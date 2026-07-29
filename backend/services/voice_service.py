import asyncio
import base64
from pathlib import Path
from typing import List, Optional
import httpx
from gtts import gTTS
from config import settings
from models.schemas import Scene, VoiceSettings
from utils.logger import logger


GTTS_VOICE_MAP = {
    "en-US": ("en", "com"),
    "en-GB": ("en", "co.uk"),
    "en-AU": ("en", "com.au"),
    "en-IN": ("en", "co.in"),
    "vi-VN": ("vi", "com"),
    "ja-JP": ("ja", "com"),
    "ko-KR": ("ko", "com"),
    "zh-CN": ("zh-CN", "com"),
    "fr-FR": ("fr", "com"),
    "de-DE": ("de", "com"),
    "es-ES": ("es", "com"),
    "pt-BR": ("pt", "com.br"),
    "ru-RU": ("ru", "com"),
    "it-IT": ("it", "com"),
}

TIKTOK_VOICES = {
    "vi-VN-Female": "BV074_streaming",
    "vi-VN-Male": "BV075_streaming",
    "en-US-Deep-Male": "en_us_006",
    "en-US-Male": "en_us_002",
    "en-US-Young-Male": "en_us_007",
    "en-UK-Male": "en_uk_001",
    "en-US-Female": "en_us_001",
    "en-US-Young-Female": "en_us_009",
    "en-US-Serious-Female": "en_us_010",
    "en-UK-Female": "en_uk_003",
}

TIKTOK_URL = "https://api16-normal-v6.tiktokv.com/media/api/text/speech/invoke/"


class VoiceService:

    async def generate_single(self, text: str, index: int, voice_settings: VoiceSettings) -> dict:
        output_path = Path(settings.audio_folder) / f"scene_{index:04d}.mp3"
        output_path.parent.mkdir(parents=True, exist_ok=True)

        provider = voice_settings.provider if voice_settings.provider else "gtts"

        try:
            if provider == "tiktok":
                await self._synthesize_tiktok(text, str(output_path), voice_settings.voice)
            else:
                await self._synthesize_gtts(text, str(output_path), voice_settings.voice)

            if not output_path.exists() or output_path.stat().st_size == 0:
                raise ValueError(f"Empty audio file generated for scene {index}")

            actual_duration = self._get_audio_duration(str(output_path))
            logger.info(f"Voice: Scene {index} generated ({provider}, {actual_duration:.1f}s)")
            return {"path": str(output_path), "duration": actual_duration}

        except Exception as e:
            logger.error(f"Voice: Scene {index} failed ({provider}): {e}")
            raise

    async def _synthesize_gtts(self, text: str, output_path: str, voice_key: str):
        mapped = GTTS_VOICE_MAP.get(voice_key, ("en", "com"))
        lang, tld = mapped
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, lambda: self._gtts_save(text, output_path, lang, tld))

    def _gtts_save(self, text: str, output_path: str, lang: str, tld: str):
        tts = gTTS(text=text, lang=lang, tld=tld, slow=False)
        tts.save(output_path)

    async def _synthesize_tiktok(self, text: str, output_path: str, voice_key: str):
        voice_id = TIKTOK_VOICES.get(voice_key, "en_us_001")
        session_id = settings.tiktok_session_id
        if not session_id:
            raise ValueError("TikTok session ID not configured. Go to Settings to set it.")

        params = {
            "text_speaker": voice_id,
            "req_text": text[:150],
            "speaker_map_type": "0",
            "aid": "1180",
        }
        headers = {
            "User-Agent": "com.zhiliaoapp.musically/2022600030",
            "Cookie": f"sessionid={session_id}",
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(TIKTOK_URL, params=params, headers=headers)
            data = resp.json()

        if data.get("message") != "success":
            raise RuntimeError(f"TikTok TTS failed: {data.get('message', 'unknown')}")

        v_str = data.get("data", {}).get("v_str")
        if not v_str:
            raise RuntimeError("TikTok TTS: no audio data in response")

        audio_bytes = base64.b64decode(v_str)
        Path(output_path).write_bytes(audio_bytes)

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
