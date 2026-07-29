import asyncio
from pathlib import Path
from typing import List, Optional
from gtts import gTTS
from config import settings
from models.schemas import Scene, VoiceSettings
from utils.logger import logger


class VoiceService:
    async def generate_single(self, text: str, index: int, voice_settings: VoiceSettings) -> dict:
        output_path = Path(settings.audio_folder) / f"scene_{index:04d}.mp3"
        output_path.parent.mkdir(parents=True, exist_ok=True)

        try:
            lang = voice_settings.language if voice_settings.language else "en"
            tld = "com"

            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, lambda: self._synthesize(text, str(output_path), lang, tld))

            if not output_path.exists() or output_path.stat().st_size == 0:
                raise ValueError(f"Empty audio file generated for scene {index}")

            actual_duration = self._get_audio_duration(str(output_path))
            logger.info(f"Voice: Scene {index} generated ({actual_duration:.1f}s)")
            return {"path": str(output_path), "duration": actual_duration}

        except Exception as e:
            logger.error(f"Voice: Scene {index} generation failed: {e}")
            raise

    def _synthesize(self, text: str, output_path: str, lang: str, tld: str):
        tts = gTTS(text=text, lang=lang, tld=tld, slow=False)
        tts.save(output_path)

    async def generate_batch(
        self, scenes: List[Scene], voice_settings: VoiceSettings,
        progress_callback=None
    ) -> List[Scene]:
        semaphore = asyncio.Semaphore(3)

        async def generate_one(scene: Scene) -> Scene:
            async with semaphore:
                try:
                    result = await self.generate_single(
                        scene.narration_text, scene.scene_number, voice_settings
                    )
                    scene.audio_path = result["path"]
                    scene.audio_duration = result["duration"]
                    scene.status = "completed"
                except Exception as e:
                    scene.status = "failed"
                    logger.error(f"Scene {scene.scene_number} voice failed: {e}")
                if progress_callback:
                    await progress_callback()
                return scene

        tasks = [generate_one(s) for s in scenes]
        return await asyncio.gather(*tasks)

    def _get_audio_duration(self, file_path: str) -> float:
        try:
            import subprocess
            import re
            result = subprocess.run(
                [settings.ffmpeg_path, "-i", file_path, "-f", "null", "-"],
                capture_output=True, text=True, timeout=30,
            )
            match = re.search(r"Duration: (\d+):(\d+):(\d+)\.(\d+)", result.stderr)
            if match:
                h, m, s, ms = match.groups()
                return float(h) * 3600 + float(m) * 60 + float(s) + float(f"0.{ms}")
            return 0
        except Exception as e:
            logger.warning(f"Could not get audio duration: {e}")
            return 0


voice_service = VoiceService()
