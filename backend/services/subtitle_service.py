from pathlib import Path
from typing import List
from config import settings
from models.schemas import Scene, SubtitleSettings
from utils.logger import logger


class SubtitleService:
    def generate_srt(self, scenes: List[Scene], output_path: str) -> str:
        lines = []
        current_time = 0.0

        for scene in scenes:
            duration = scene.audio_duration or 5.0
            start_time = current_time
            end_time = current_time + duration

            start_srt = self._seconds_to_srt_time(start_time)
            end_srt = self._seconds_to_srt_time(end_time)

            lines.append(str(scene.scene_number))
            lines.append(f"{start_srt} --> {end_srt}")
            lines.append(scene.narration_text)
            lines.append("")

            current_time = end_time

        content = "\n".join(lines)
        output_file = Path(output_path) / "subtitles.srt"
        output_file.parent.mkdir(parents=True, exist_ok=True)
        output_file.write_text(content, encoding="utf-8")

        logger.info(f"Subtitle: SRT generated ({len(scenes)} scenes)")
        return str(output_file)

    def generate_ass(self, scenes: List[Scene], output_path: str, settings: SubtitleSettings) -> str:
        lines = [
            "[Script Info]",
            "Title: Story Video Subtitles",
            "ScriptType: v4.00+",
            "Collisions: Normal",
            "PlayResX: 1920",
            "PlayResY: 1080",
            "",
            "[V4+ Styles]",
            f"Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
            f"Style: Default,{settings.font},{settings.font_size},&H00FFFFFF,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,{2 if settings.outline else 0},{1 if settings.shadow else 0},2,10,10,10,1",
            "",
            "[Events]",
            "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
        ]

        current_time = 0.0
        for scene in scenes:
            duration = scene.audio_duration or 5.0
            start_ass = self._seconds_to_ass_time(current_time)
            end_ass = self._seconds_to_ass_time(current_time + duration)

            effect = ""
            if settings.animation == "fade":
                effect = "\\fad(200,200)"
            elif settings.animation == "slide":
                effect = "\\move(1920,0,0,0)"

            lines.append(
                f"Dialogue: 0,{start_ass},{end_ass},Default,,0,0,0,,{effect}{scene.narration_text}"
            )
            current_time += duration

        content = "\n".join(lines)
        output_file = Path(output_path) / "subtitles.ass"
        output_file.write_text(content, encoding="utf-8")

        logger.info(f"Subtitle: ASS generated ({len(scenes)} scenes)")
        return str(output_file)

    def _seconds_to_srt_time(self, seconds: float) -> str:
        h = int(seconds // 3600)
        m = int((seconds % 3600) // 60)
        s = int(seconds % 60)
        ms = int((seconds - int(seconds)) * 1000)
        return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

    def _seconds_to_ass_time(self, seconds: float) -> str:
        h = int(seconds // 3600)
        m = int((seconds % 3600) // 60)
        s = int(seconds % 60)
        cs = int((seconds - int(seconds)) * 100)
        return f"{h}:{m:02d}:{s:02d}.{cs:02d}"


subtitle_service = SubtitleService()
