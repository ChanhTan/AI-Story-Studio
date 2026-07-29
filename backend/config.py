from pydantic_settings import BaseSettings
from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"

    edge_tts_voice: str = "en-US-JennyNeural"
    edge_tts_rate: str = "0%"
    edge_tts_pitch: str = "0%"
    edge_tts_volume: str = "0%"

    ffmpeg_path: str = "ffmpeg"
    download_folder: str = str(BASE_DIR / "download")
    output_folder: str = str(BASE_DIR / "output")
    browser_path: str = ""
    cache_folder: str = str(BASE_DIR / "cache")
    images_folder: str = str(BASE_DIR / "images")
    audio_folder: str = str(BASE_DIR / "audio")
    videos_folder: str = str(BASE_DIR / "videos")
    subtitles_folder: str = str(BASE_DIR / "subtitles")
    logs_folder: str = str(BASE_DIR / "logs")
    config_folder: str = str(BASE_DIR / "config")

    max_concurrent_tabs: int = 3
    perchance_timeout: int = 120
    retry_count: int = 3
    default_style: str = "Realistic"
    default_aspect_ratio: str = "16:9"

    theme: str = "dark"
    language: str = "en"
    auto_save: bool = True

    host: str = "0.0.0.0"
    port: int = 8000

    class Config:
        env_file = str(BASE_DIR / ".env")
        env_file_encoding = "utf-8"


settings = Settings()

for folder in [
    settings.images_folder, settings.audio_folder, settings.videos_folder,
    settings.subtitles_folder, settings.logs_folder, settings.config_folder,
    settings.cache_folder, settings.download_folder, settings.output_folder,
]:
    Path(folder).mkdir(parents=True, exist_ok=True)
