import asyncio
import hashlib
from pathlib import Path
from typing import List, Optional
from urllib.parse import quote
import httpx
from config import settings
from models.schemas import Scene
from utils.logger import logger


STYLE_PROMPTS = {
    "Realistic": "photorealistic, highly detailed, 8K",
    "Cinematic": "cinematic, dramatic lighting, anamorphic, movie scene",
    "Fantasy": "fantasy art, magical, ethereal, glowing, epic fantasy",
    "Anime": "anime style, cel shaded, vibrant colors, Japanese animation",
    "Minecraft": "Minecraft style, blocky, pixelated, voxel art",
    "Pixel Art": "pixel art, 16-bit, retro, chunky pixels, game sprite",
    "Horror": "horror, dark, frightening, creepy atmosphere, gothic",
    "Sci-Fi": "sci-fi, futuristic, cyberpunk, neon, high tech",
    "Dark Fantasy": "dark fantasy, grim, medieval dark, eldritch, occult",
}

RESOLUTION_MAP = {
    "16:9": {"width": 1216, "height": 832},
    "9:16": {"width": 832, "height": 1216},
    "1:1": {"width": 1024, "height": 1024},
}

POLLINATIONS_URL = "https://image.pollinations.ai/prompt"


class ImageGenerator:
    def __init__(self):
        self.semaphore = asyncio.Semaphore(settings.max_concurrent_tabs)

    def _get_cache_key(self, prompt: str, style: str, aspect_ratio: str) -> str:
        data = f"{prompt}:{style}:{aspect_ratio}"
        return hashlib.md5(data.encode()).hexdigest()

    def _get_cache_path(self, cache_key: str) -> Path:
        return Path(settings.cache_folder) / f"{cache_key}.jpg"

    def check_cache(self, prompt: str, style: str, aspect_ratio: str) -> Optional[str]:
        cache_key = self._get_cache_key(prompt, style, aspect_ratio)
        cache_path = self._get_cache_path(cache_key)
        if cache_path.exists():
            logger.info(f"Image cache hit: {cache_key}")
            return str(cache_path)
        return None

    async def generate_single(
        self, prompt: str, style: str = "Realistic", aspect_ratio: str = "16:9"
    ) -> str:
        cached = self.check_cache(prompt, style, aspect_ratio)
        if cached:
            return cached

        async with self.semaphore:
            style_boost = STYLE_PROMPTS.get(style, "")
            full_prompt = f"{prompt}, {style_boost}" if style_boost else prompt

            res = RESOLUTION_MAP.get(aspect_ratio, {"width": 1216, "height": 832})

            seed = hash(full_prompt) % (2**31)
            params = {
                "width": res["width"],
                "height": res["height"],
                "seed": seed,
                "nologo": "true",
            }

            url = f"{POLLINATIONS_URL}/{quote(full_prompt)}"

            last_error = None
            for attempt in range(settings.retry_count):
                try:
                    logger.info(f"Generating image via Pollinations (attempt {attempt+1}): {prompt[:60]}...")
                    async with httpx.AsyncClient(timeout=120.0) as client:
                        resp = await client.get(url, params=params, follow_redirects=True)

                        if resp.status_code == 429:
                            retry_after = 3 * (attempt + 1)
                            logger.warning(f"Rate limited, retrying in {retry_after}s...")
                            await asyncio.sleep(retry_after)
                            continue

                        resp.raise_for_status()

                        cache_key = self._get_cache_key(prompt, style, aspect_ratio)
                        cache_path = self._get_cache_path(cache_key)
                        cache_path.write_bytes(resp.content)

                        target_path = Path(settings.images_folder) / f"{cache_key}.jpg"
                        if target_path.exists():
                            target_path.unlink()
                        cache_path.rename(target_path)

                        logger.info(f"Image saved: {target_path}")
                        return str(target_path)

                except httpx.HTTPStatusError as e:
                    last_error = e
                    if e.response.status_code == 429:
                        retry_after = 3 * (attempt + 1)
                        logger.warning(f"Rate limited, retrying in {retry_after}s...")
                        await asyncio.sleep(retry_after)
                    else:
                        raise
                except Exception as e:
                    last_error = e
                    if attempt < settings.retry_count - 1:
                        await asyncio.sleep(2 * (attempt + 1))
                    else:
                        raise

            raise last_error or RuntimeError("Failed to generate image after all retries")

    async def generate_batch(
        self, scenes: List[Scene], style: str = "Realistic", aspect_ratio: str = "16:9",
        progress_callback=None
    ) -> List[Scene]:
        output_scenes = []
        for scene in scenes:
            try:
                result = await self._generate_with_progress(scene, style, aspect_ratio, None)
                output_scenes.append(result)
            except Exception as e:
                scene.status = "failed"
                scene.image_path = ""
                logger.error(f"Scene {scene.scene_number} failed: {e}")
                output_scenes.append(scene)
            if progress_callback:
                await progress_callback()
            await asyncio.sleep(2)
        return output_scenes

    async def _generate_with_progress(self, scene, style, aspect_ratio, progress_callback):
        path = await self.generate_single(scene.image_prompt, style, aspect_ratio)
        scene.image_path = path
        scene.image_url = path
        scene.status = "completed"
        if progress_callback:
            await progress_callback()
        return scene

    async def close(self):
        pass


image_generator = ImageGenerator()
