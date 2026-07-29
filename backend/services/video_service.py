import asyncio
import subprocess
from pathlib import Path
from typing import List
from config import settings
from models.schemas import Scene, SubtitleSettings, MusicSettings, VideoEffect, KenBurnsEffect
from utils.logger import logger


class VideoService:
    async def _run_ffmpeg(self, cmd: List[str]) -> str:
        loop = asyncio.get_event_loop()

        def run():
            proc = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                shell=False,
            )
            stdout, stderr = proc.communicate()
            if proc.returncode != 0:
                raise RuntimeError(stderr.decode()[:500])
            return stdout.decode()

        return await loop.run_in_executor(None, run)

    async def build_video(
        self,
        scenes: List[Scene],
        output_path: str,
        subtitle_settings: SubtitleSettings,
        music_settings: MusicSettings,
        video_effect: VideoEffect,
        fps: int = 30,
        resolution: str = "1920x1080",
        progress_callback=None,
    ) -> str:
        output_file = Path(output_path) / "final_video.mp4"
        output_file.parent.mkdir(parents=True, exist_ok=True)

        try:
            segments = []
            for i, scene in enumerate(scenes):
                segment_file = await self._create_scene_segment(
                    scene, i, resolution, fps, video_effect, subtitle_settings
                )
                segments.append(segment_file)
                if progress_callback:
                    await progress_callback()

            concat_file = Path(output_path) / "concat_list.txt"
            with open(concat_file, "w") as f:
                for seg in segments:
                    f.write(f"file '{seg}'\n")

            filter_parts = []
            video_filters = []

            resolution_w, resolution_h = map(int, resolution.split("x"))

            video_filters.append(f"scale={resolution_w}:{resolution_h}:force_original_aspect_ratio=1,pad={resolution_w}:{resolution_h}:(ow-iw)/2:(oh-ih)/2")

            if video_effect.film_grain:
                video_filters.append("noise=alls=10:allf=t+u")
            if video_effect.vignette:
                video_filters.append("vignette=PI/4")
            if video_effect.motion_blur:
                video_filters.append("tmix=frames=3:weights=1 1 1")
            if video_effect.light_shake:
                video_filters.append("crop=iw-20:ih-20:(random(1)*20):(random(1)*20)")

            if video_filters:
                filter_parts.append(",".join(video_filters))

            cmd = [
                settings.ffmpeg_path,
                "-f", "concat",
                "-safe", "0",
                "-i", str(concat_file),
            ]

            filter_complex = ""
            if filter_parts:
                filter_complex = f"[0:v]{','.join(filter_parts)}[v]"

            if music_settings and music_settings.enabled and music_settings.file_path:
                if filter_complex:
                    cmd.extend(["-filter_complex", f"{filter_complex};[1:a]volume={music_settings.volume}[a]"])
                    cmd.extend(["-map", "[v]", "-map", "[a]"])
                else:
                    cmd.extend(["-filter_complex", f"[1:a]volume={music_settings.volume}[a]"])
                    cmd.extend(["-map", "0:v", "-map", "[a]"])
                cmd.extend(["-shortest"])
            else:
                if filter_complex:
                    cmd.extend(["-filter_complex", filter_complex])
                    cmd.extend(["-map", "[v]"])
                cmd.extend(["-map", "0:a"])

            cmd.extend([
                "-c:v", "libx264",
                "-preset", "medium",
                "-crf", "23",
                "-c:a", "aac",
                "-b:a", "192k",
                "-pix_fmt", "yuv420p",
                "-y",
                str(output_file),
            ])

            logger.info(f"Video: Building final video...")
            await self._run_ffmpeg(cmd)

            logger.info(f"Video: Final video created: {output_file}")
            return str(output_file)

        except Exception as e:
            logger.error(f"Video: Build failed: {e}")
            raise

    async def _create_scene_segment(
        self,
        scene: Scene,
        index: int,
        resolution: str,
        fps: int,
        video_effect: VideoEffect,
        subtitle_settings: SubtitleSettings,
    ) -> str:
        segment_file = Path(settings.videos_folder) / f"segment_{index:04d}.mp4"
        duration = scene.audio_duration or 5.0

        if not scene.image_path or not Path(scene.image_path).exists():
            raise FileNotFoundError(f"Image not found for scene {scene.scene_number}: {scene.image_path}")

        if not scene.audio_path or not Path(scene.audio_path).exists():
            raise FileNotFoundError(f"Audio not found for scene {scene.scene_number}: {scene.audio_path}")

        resolution_w, resolution_h = map(int, resolution.split("x"))

        filter_parts = [f"scale={resolution_w}:{resolution_h}:force_original_aspect_ratio=1,pad={resolution_w}:{resolution_h}:(ow-iw)/2:(oh-ih)/2"]

        ken_burns = video_effect.ken_burns
        if ken_burns and ken_burns != KenBurnsEffect.none:
            zoom_start = 1.0
            zoom_end = 1.3
            if ken_burns == KenBurnsEffect.zoom_in:
                filter_parts.append(f"zoompan=z='min(zoom+0.005,{zoom_end})':d={int(duration*fps)}:s={resolution_w}x{resolution_h}:fps={fps}")
            elif ken_burns == KenBurnsEffect.zoom_out:
                filter_parts.append(f"zoompan=z='max(zoom-0.005,{zoom_start})':d={int(duration*fps)}:s={resolution_w}x{resolution_h}:fps={fps}")
            elif ken_burns == KenBurnsEffect.pan_left:
                filter_parts.append(f"crop={resolution_w}:{resolution_h}:(iw-{resolution_w})*(t/{duration}):0")
            elif ken_burns == KenBurnsEffect.pan_right:
                filter_parts.append(f"crop={resolution_w}:{resolution_h}:(iw-{resolution_w})*(1-t/{duration}):0")

        if video_effect.blur:
            filter_parts.append("gblur=sigma=0.5")

        if video_effect.film_grain:
            filter_parts.append("noise=alls=5:allf=t+u")

        if video_effect.fade:
            fade_duration = min(0.5, duration / 4)
            filter_parts.append(f"fade=in:0:{int(fade_duration*fps)}")

        filter_complex = ",".join(filter_parts) if filter_parts else "null"

        cmd = [
            settings.ffmpeg_path,
            "-loop", "1",
            "-i", scene.image_path,
            "-i", scene.audio_path,
            "-c:v", "libx264",
            "-t", str(duration),
            "-pix_fmt", "yuv420p",
            "-vf", filter_complex,
            "-c:a", "aac",
            "-b:a", "192k",
            "-shortest",
            "-y",
            str(segment_file),
        ]

        if subtitle_settings.burn and subtitle_settings.enabled:
            subtitle_file = Path(settings.subtitles_folder) / "subtitles.srt"
            if subtitle_file.exists():
                cmd.extend(["-vf", f"subtitles={subtitle_file}:si=0"])

        await self._run_ffmpeg(cmd)
        return str(segment_file)


video_service = VideoService()
