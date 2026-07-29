from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class Scene(BaseModel):
    scene_number: int
    summary: str
    image_prompt: str
    image_url: Optional[str] = None
    image_path: Optional[str] = None
    audio_path: Optional[str] = None
    audio_duration: Optional[float] = None
    narration_text: str
    status: str = "pending"


class ImageStyle(str, Enum):
    realistic = "Realistic"
    cinematic = "Cinematic"
    fantasy = "Fantasy"
    anime = "Anime"
    cartoon = "Cartoon"
    minecraft = "Minecraft"
    pixel_art = "Pixel Art"
    horror = "Horror"
    sci_fi = "Sci-Fi"
    dark_fantasy = "Dark Fantasy"


class AspectRatio(str, Enum):
    r_16_9 = "16:9"
    r_9_16 = "9:16"
    r_1_1 = "1:1"


class KenBurnsEffect(str, Enum):
    none = "none"
    zoom_in = "Zoom In"
    zoom_out = "Zoom Out"
    pan_left = "Pan Left"
    pan_right = "Pan Right"


class VoiceSettings(BaseModel):
    provider: str = "gtts"
    voice: str = "en-US"
    rate: str = "0%"
    pitch: str = "0%"
    volume: str = "0%"
    language: str = "en"


class SubtitleSettings(BaseModel):
    enabled: bool = True
    format: str = "srt"
    burn: bool = True
    font: str = "Arial"
    font_size: int = 24
    outline: bool = True
    shadow: bool = True
    color: str = "#FFFFFF"
    animation: str = "fade"


class MusicSettings(BaseModel):
    enabled: bool = False
    file_path: Optional[str] = None
    volume: float = 0.3
    fade_in: float = 2.0
    fade_out: float = 3.0
    loop: bool = True


class VideoEffect(BaseModel):
    ken_burns: KenBurnsEffect = KenBurnsEffect.none
    fade: bool = True
    cross_fade: bool = True
    blur: bool = False
    film_grain: bool = False
    vignette: bool = False
    motion_blur: bool = False
    light_shake: bool = False


class GenerateScriptRequest(BaseModel):
    story: str = Field(..., min_length=1, max_length=50000)
    style: ImageStyle = ImageStyle.cinematic
    aspect_ratio: AspectRatio = AspectRatio.r_16_9


class GenerateImagesRequest(BaseModel):
    scenes: List[Scene]
    style: ImageStyle = ImageStyle.cinematic
    aspect_ratio: AspectRatio = AspectRatio.r_16_9


class GenerateVoiceRequest(BaseModel):
    scenes: List[Scene]
    voice_settings: VoiceSettings = VoiceSettings()


class BuildVideoRequest(BaseModel):
    scenes: List[Scene]
    subtitle_settings: SubtitleSettings = SubtitleSettings()
    music_settings: MusicSettings = MusicSettings()
    video_effect: VideoEffect = VideoEffect()
    fps: int = 30
    resolution: str = "1920x1080"


class GenerateAllRequest(BaseModel):
    story: str
    style: ImageStyle = ImageStyle.cinematic
    aspect_ratio: AspectRatio = AspectRatio.r_16_9
    voice_settings: VoiceSettings = VoiceSettings()
    subtitle_settings: SubtitleSettings = SubtitleSettings()
    music_settings: MusicSettings = MusicSettings()
    video_effect: VideoEffect = VideoEffect()
    fps: int = 30
    resolution: str = "1920x1080"
    num_scenes: Optional[int] = None


class TaskStatus(BaseModel):
    task_id: str
    status: str
    progress: int
    current_scene: int
    total_scenes: int
    current_task: str
    estimated_remaining: Optional[float] = None
    error: Optional[str] = None
    warning: Optional[str] = None


class HistoryItem(BaseModel):
    id: str
    title: str
    story: str
    scenes: List[Scene]
    created_at: str
    video_path: Optional[str] = None
    settings: dict = {}


class LogEntry(BaseModel):
    timestamp: str
    level: str
    message: str
    task_id: Optional[str] = None
