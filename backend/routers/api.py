import asyncio
import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse

from config import settings
from models.schemas import (
    Scene, GenerateScriptRequest, GenerateImagesRequest, GenerateVoiceRequest,
    BuildVideoRequest, GenerateAllRequest, TaskStatus, HistoryItem,
    ImageStyle, AspectRatio,
)
from services.gemini_service import gemini_service
from services.image_service import image_generator
from services.voice_service import voice_service
from services.video_service import video_service
from services.subtitle_service import subtitle_service
from utils.logger import logger

router = APIRouter(prefix="/api", tags=["api"])

active_tasks: dict = {}
task_history: List[HistoryItem] = []


def get_task(task_id: str) -> TaskStatus:
    if task_id not in active_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    return active_tasks[task_id]


def update_task(task_id: str, **kwargs):
    if task_id in active_tasks:
        for k, v in kwargs.items():
            setattr(active_tasks[task_id], k, v)


@router.post("/generate-scenes")
async def generate_scenes(req: GenerateScriptRequest):
    if not gemini_service.is_configured():
        raise HTTPException(status_code=400, detail="Gemini API key not configured")

    try:
        scenes = gemini_service.analyze_story(req.story)
        return {"scenes": [s.model_dump() for s in scenes]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-images")
async def generate_images(req: GenerateImagesRequest):
    task_id = str(uuid.uuid4())[:8]
    task = TaskStatus(
        task_id=task_id, status="running", progress=0,
        current_scene=0, total_scenes=len(req.scenes),
        current_task="Generating images",
    )
    active_tasks[task_id] = task

    async def progress_callback():
        task.current_scene += 1
        task.progress = int((task.current_scene / task.total_scenes) * 100)

    try:
        scenes = await image_generator.generate_batch(
            req.scenes,
            style=req.style.value if hasattr(req.style, 'value') else str(req.style),
            aspect_ratio=req.aspect_ratio.value if hasattr(req.aspect_ratio, 'value') else str(req.aspect_ratio),
            progress_callback=progress_callback,
        )
        task.status = "completed"
        task.progress = 100
        return {"scenes": [s.model_dump() for s in scenes], "task_id": task_id}
    except Exception as e:
        task.status = "failed"
        task.error = str(e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-voice")
async def generate_voice(req: GenerateVoiceRequest):
    task_id = str(uuid.uuid4())[:8]
    task = TaskStatus(
        task_id=task_id, status="running", progress=0,
        current_scene=0, total_scenes=len(req.scenes),
        current_task="Generating voice narration",
    )
    active_tasks[task_id] = task

    async def progress_callback():
        task.current_scene += 1
        task.progress = int((task.current_scene / task.total_scenes) * 100)

    try:
        scenes = await voice_service.generate_batch(
            req.scenes, req.voice_settings, progress_callback
        )
        task.status = "completed"
        task.progress = 100
        return {"scenes": [s.model_dump() for s in scenes], "task_id": task_id}
    except Exception as e:
        task.status = "failed"
        task.error = str(e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/build-video")
async def build_video(req: BuildVideoRequest):
    task_id = str(uuid.uuid4())[:8]
    task = TaskStatus(
        task_id=task_id, status="running", progress=0,
        current_scene=0, total_scenes=len(req.scenes),
        current_task="Building video",
    )
    active_tasks[task_id] = task

    output_path = Path(settings.output_folder) / task_id
    output_path.mkdir(parents=True, exist_ok=True)

    if req.subtitle_settings.enabled:
        try:
            srt_path = subtitle_service.generate_srt(req.scenes, str(output_path))
            if req.subtitle_settings.format == "ass":
                subtitle_service.generate_ass(req.scenes, str(output_path), req.subtitle_settings)
        except Exception as e:
            logger.warning(f"Subtitle generation failed: {e}")

    async def progress_callback():
        task.current_scene += 1
        task.progress = int((task.current_scene / task.total_scenes) * 100)

    try:
        video_path = await video_service.build_video(
            req.scenes, str(output_path),
            req.subtitle_settings, req.music_settings, req.video_effect,
            req.fps, req.resolution, progress_callback,
        )
        task.status = "completed"
        task.progress = 100
        return {"video_path": video_path, "task_id": task_id}
    except Exception as e:
        task.status = "failed"
        task.error = str(e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-all")
async def generate_all(req: GenerateAllRequest, background_tasks: BackgroundTasks):
    task_id = str(uuid.uuid4())[:8]
    task = TaskStatus(
        task_id=task_id, status="running", progress=0,
        current_scene=0, total_scenes=1,
        current_task="Analyzing story with Gemini",
    )
    active_tasks[task_id] = task
    output_path = Path(settings.output_folder) / task_id

    async def run_pipeline():
        output_path.mkdir(parents=True, exist_ok=True)

        try:
            logger.info(f"Pipeline {task_id}: Starting story analysis")
            scenes = gemini_service.analyze_story(req.story)
            task.total_scenes = len(scenes)
            update_task(task_id, current_task="Generating images", total_scenes=len(scenes))
            logger.info(f"Pipeline {task_id}: Story analyzed - {len(scenes)} scenes")

            async def img_progress():
                task.current_scene += 1
                task.progress = int((task.current_scene / (task.total_scenes * 3)) * 100)
                logger.info(f"Pipeline {task_id}: Image {task.current_scene}/{task.total_scenes}")

            scenes = await image_generator.generate_batch(
                scenes, req.style.value if hasattr(req.style, 'value') else str(req.style),
                req.aspect_ratio.value if hasattr(req.aspect_ratio, 'value') else str(req.aspect_ratio),
                progress_callback=img_progress,
            )
            task.current_scene = 0
            update_task(task_id, current_task="Generating voice narration")
            logger.info(f"Pipeline {task_id}: Images done")

            successful_scenes = [s for s in scenes if s.status == "completed"]
            if not successful_scenes:
                raise RuntimeError("All image generations failed. Check logs for details.")
            task.total_scenes = len(successful_scenes)

            async def voice_progress():
                task.current_scene += 1
                task.progress = int(((task.total_scenes + task.current_scene) / (task.total_scenes * 3)) * 100)

            scenes = await voice_service.generate_batch(successful_scenes, req.voice_settings, voice_progress)
            task.current_scene = 0
            update_task(task_id, current_task="Building video")
            logger.info(f"Pipeline {task_id}: Voice done")

            scenes_with_audio = [s for s in scenes if s.status == "completed" and s.audio_path]
            if not scenes_with_audio:
                raise RuntimeError("All voice generations failed")
            task.total_scenes = len(scenes_with_audio)
            scenes = scenes_with_audio

            if req.subtitle_settings.enabled:
                subtitle_service.generate_srt(scenes, str(output_path))
                if req.subtitle_settings.format == "ass":
                    subtitle_service.generate_ass(scenes, str(output_path), req.subtitle_settings)

            async def video_progress():
                task.current_scene += 1
                task.progress = int(((task.total_scenes * 2 + task.current_scene) / (task.total_scenes * 3)) * 100)

            video_path = await video_service.build_video(
                scenes, str(output_path),
                req.subtitle_settings, req.music_settings, req.video_effect,
                req.fps, req.resolution, video_progress,
            )

            update_task(
                task_id, status="completed", progress=100,
                current_task="Complete",
            )

            history_item = HistoryItem(
                id=task_id,
                title=req.story[:50],
                story=req.story,
                scenes=scenes,
                created_at=datetime.now().isoformat(),
                video_path=video_path,
                settings=req.model_dump(),
            )
            task_history.append(history_item)
            logger.info(f"Pipeline {task_id}: Completed successfully")

        except Exception as e:
            from services.gemini_service import GeminiError
            if isinstance(e, GeminiError):
                err_msg = str(e)
            else:
                err_msg = f"{type(e).__name__}: {str(e)}" if str(e) else f"{type(e).__name__}"
            logger.error(f"Pipeline {task_id}: Failed - {err_msg}")
            import traceback
            logger.error(f"Pipeline {task_id}: Traceback:\n{traceback.format_exc()}")
            update_task(task_id, status="failed", error=err_msg)

    background_tasks.add_task(run_pipeline)
    return {"task_id": task_id, "message": "Pipeline started"}


@router.get("/progress/{task_id}")
async def get_progress(task_id: str):
    task = get_task(task_id)
    return task


@router.get("/history")
async def get_history():
    return {"history": [h.model_dump() for h in reversed(task_history)]}


@router.post("/cancel/{task_id}")
async def cancel_task(task_id: str):
    task = get_task(task_id)
    task.status = "cancelled"
    return {"message": "Task cancelled"}


@router.post("/pause/{task_id}")
async def pause_task(task_id: str):
    task = get_task(task_id)
    task.status = "paused"
    return {"message": "Task paused"}


@router.post("/resume/{task_id}")
async def resume_task(task_id: str):
    task = get_task(task_id)
    if task.status == "paused":
        task.status = "running"
    return {"message": "Task resumed"}


@router.get("/settings")
async def get_settings():
    key = settings.gemini_api_key
    masked = key[:8] + "..." if len(key) > 8 else ""
    return {
        "gemini_api_key": masked,
        "gemini_api_key_set": bool(key),
        "gemini_model": settings.gemini_model,
        "edge_tts_voice": settings.edge_tts_voice,
        "edge_tts_rate": settings.edge_tts_rate,
        "edge_tts_pitch": settings.edge_tts_pitch,
        "edge_tts_volume": settings.edge_tts_volume,
        "max_concurrent_tabs": settings.max_concurrent_tabs,
        "perchance_timeout": settings.perchance_timeout,
        "retry_count": settings.retry_count,
        "default_style": settings.default_style,
        "default_aspect_ratio": settings.default_aspect_ratio,
        "theme": settings.theme,
        "language": settings.language,
        "auto_save": settings.auto_save,
    }


@router.post("/settings")
async def update_settings(data: dict):
    for key, value in data.items():
        if hasattr(settings, key):
            if key == "gemini_api_key" and value:
                gemini_service.update_api_key(value)
            setattr(settings, key, value)
    env_path = Path(settings.config_folder).parent / ".env"
    try:
        lines = []
        if env_path.exists():
            lines = env_path.read_text(encoding="utf-8").splitlines()
        updated_keys = set(data.keys())
        new_lines = []
        keys_written = set()
        for line in lines:
            stripped = line.strip()
            if stripped and not stripped.startswith("#"):
                eq = stripped.find("=")
                if eq > 0:
                    k = stripped[:eq].strip().upper()
                    if k in updated_keys:
                        v = str(data.get(k.lower(), ""))
                        new_lines.append(f"{k}={v}")
                        keys_written.add(k)
                        continue
            new_lines.append(line)
        for k in updated_keys:
            if k.upper() not in keys_written:
                new_lines.append(f"{k.upper()}={data.get(k, '')}")
        env_path.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
    except Exception as e:
        logger.warning(f"Could not save .env file: {e}")
    return {"message": "Settings updated"}


@router.post("/gemini/test")
async def test_gemini():
    if not gemini_service.is_configured():
        raise HTTPException(status_code=400, detail="API key not configured")
    try:
        result = gemini_service._call_gemini("Reply with just: OK")
        return {"success": True, "message": result}
    except Exception as e:
        return {"success": False, "message": str(e)}


@router.get("/gemini/models")
async def list_gemini_models():
    if not gemini_service.is_configured():
        raise HTTPException(status_code=400, detail="API key not configured")
    try:
        models = gemini_service._discover_models()
        return {"models": sorted(models)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/download/{task_id}")
async def download_video(task_id: str):
    video_path = Path(settings.output_folder) / task_id / "final_video.mp4"
    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Video not found")
    return FileResponse(
        str(video_path),
        media_type="video/mp4",
        filename=f"story_video_{task_id}.mp4",
    )
