import json
import re
import time
from typing import List, Optional
from google import genai
from google.genai import types as genai_types
from google.genai.errors import ClientError
from config import settings
from models.schemas import Scene
from utils.logger import logger

PREFERRED_MODELS = [
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.1-pro-preview",
    "gemini-3.1-flash-lite",
    "gemini-3-flash-preview",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-flash-latest",
    "gemini-pro-latest",
]


class GeminiError(Exception):
    def __init__(self, message: str, category: str = "unknown"):
        self.category = category
        super().__init__(message)


class GeminiService:
    def __init__(self):
        self.api_key = settings.gemini_api_key
        self._client = None
        self._working_model = None
        self._available_models: List[str] = []

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def update_api_key(self, key: str):
        self.api_key = key
        self._client = None
        self._working_model = None
        self._available_models = []

    def _get_client(self):
        if self._client is None and self.api_key:
            self._client = genai.Client(api_key=self.api_key)
        return self._client

    def _discover_models(self) -> List[str]:
        if self._available_models:
            return self._available_models

        client = self._get_client()
        if not client:
            return []

        try:
            discovered = []
            for m in client.models.list():
                name = m.name.replace("models/", "")
                supported = [str(s) for s in (m.supported_actions or [])]
                if "generateContent" in supported or not supported:
                    discovered.append(name)
            self._available_models = discovered
            logger.info(f"Gemini: Discovered {len(discovered)} models")
            return discovered
        except ClientError as e:
            logger.warning(f"Gemini: Model discovery failed: {e}")
            return PREFERRED_MODELS
        except Exception as e:
            logger.warning(f"Gemini: Model discovery error: {e}")
            return PREFERRED_MODELS

    def _call_gemini(self, prompt: str) -> str:
        if not self.api_key:
            raise GeminiError(
                "Gemini API key not configured. Go to Settings and enter your API key.",
                "no_key"
            )

        client = self._get_client()
        if not client:
            raise GeminiError("Failed to initialize Gemini client", "init_error")

        available_models = self._discover_models()
        models_to_try = []

        if self._working_model:
            models_to_try = [self._working_model]
        else:
            configured = settings.gemini_model
            models_to_try = [configured] if configured else []
            for m in PREFERRED_MODELS:
                if m not in models_to_try:
                    models_to_try.append(m)
            for m in available_models:
                if m not in models_to_try:
                    models_to_try.append(m)

        if not models_to_try:
            raise GeminiError("No Gemini models available", "no_models")

        last_error = None
        for model in models_to_try:
            try:
                logger.info(f"Gemini: Trying model {model}")
                response = client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=genai_types.GenerateContentConfig(
                        temperature=0.7,
                        max_output_tokens=8192,
                    ),
                )
                if response and response.text:
                    self._working_model = model
                    logger.info(f"Gemini: Success with model {model}")
                    return response.text.strip()
                else:
                    logger.warning(f"Gemini: Model {model} returned empty response")
                    last_error = f"Model {model}: empty response"
            except ClientError as e:
                err_msg = str(e)
                code = getattr(e, "code", 0)

                if code == 429 or "quota" in err_msg.lower() or "resource_exhausted" in err_msg.lower():
                    logger.warning(f"Gemini: Model {model} quota exceeded")
                    last_error = f"Model {model}: QUOTA_EXCEEDED - {err_msg[:200]}"
                    continue
                elif code == 403 or "permission" in err_msg.lower() or "not allowed" in err_msg.lower():
                    logger.warning(f"Gemini: Model {model} permission denied")
                    last_error = f"Model {model}: PERMISSION_DENIED - {err_msg[:200]}"
                    continue
                elif code == 404 or "not found" in err_msg.lower() or "not supported" in err_msg.lower():
                    logger.warning(f"Gemini: Model {model} not available")
                    last_error = f"Model {model}: NOT_FOUND - {err_msg[:200]}"
                    continue
                elif code == 400 and "api key" in err_msg.lower():
                    raise GeminiError(
                        "Invalid Gemini API key. Please check your key in Settings.",
                        "invalid_key"
                    )
                else:
                    logger.warning(f"Gemini: Model {model} failed: code={code} {err_msg[:150]}")
                    last_error = f"Model {model}: {err_msg[:200]}"
            except Exception as e:
                logger.warning(f"Gemini: Model {model} unexpected error: {e}")
                last_error = f"Model {model}: {str(e)[:200]}"

        if last_error and "QUOTA_EXCEEDED" in str(last_error):
            raise GeminiError(
                "Gemini API quota exceeded. Your API key has 0 remaining requests in the free tier.\n"
                "Solutions:\n"
                "1. Get a new API key at https://aistudio.google.com/apikey (has free quota)\n"
                "2. Enable billing in Google Cloud Console\n"
                "3. Wait and try again later",
                "quota_exceeded"
            )
        raise GeminiError(
            f"All Gemini models failed. Last error: {last_error or 'unknown'}",
            "all_failed"
        )

    def analyze_story(self, story: str) -> List[Scene]:
        prompt = f"""Analyze the following story and split it into cinematic scenes.

For each scene, provide:
1. scene_number: sequential number
2. summary: brief description of what happens
3. image_prompt: a detailed cinematic image generation prompt for AI image generator
4. narration_text: the narration text for this scene

Rules:
- Each scene should be 15-30 seconds of narration
- Image prompts must be detailed, cinematic, self-contained
- Narration flows naturally
- Return ONLY valid JSON array, no markdown

Story:
{story}

Return format:
[
  {{
    "scene_number": 1,
    "summary": "...",
    "image_prompt": "...",
    "narration_text": "..."
  }}
]"""

        try:
            text = self._call_gemini(prompt)
            text = re.sub(r'^```(?:json)?\s*', '', text)
            text = re.sub(r'\s*```$', '', text)
            scenes_data = json.loads(text)
            scenes = []
            for s in scenes_data:
                scenes.append(Scene(
                    scene_number=s["scene_number"],
                    summary=s.get("summary", ""),
                    image_prompt=s.get("image_prompt", ""),
                    narration_text=s.get("narration_text", ""),
                    status="pending"
                ))
            logger.info(f"Gemini: Analyzed story into {len(scenes)} scenes")
            return scenes
        except json.JSONDecodeError as e:
            logger.error(f"Gemini: Failed to parse response as JSON: {e}")
            raise GeminiError("Failed to parse scene data from Gemini response", "parse_error")
        except GeminiError:
            raise
        except Exception as e:
            logger.error(f"Gemini: Story analysis failed: {e}")
            raise GeminiError(str(e), "analysis_failed")

    def enhance_prompt(self, prompt: str, style: str = "Cinematic") -> str:
        enhance_prompt = f"""Enhance this image generation prompt for better AI image results.
Style: {style}
Make it more detailed, cinematic, visually compelling.

Original: {prompt}
Return only the enhanced prompt, no explanations."""

        try:
            text = self._call_gemini(enhance_prompt)
            logger.debug(f"Gemini: Enhanced prompt: {prompt[:40]}... -> {text[:40]}...")
            return text
        except Exception as e:
            logger.warning(f"Gemini: Prompt enhancement failed: {e}")
            return prompt

    def suggest_music(self, scenes: List[Scene]) -> str:
        summaries = "\n".join([f"Scene {s.scene_number}: {s.summary}" for s in scenes])
        prompt = f"""Based on these scenes, suggest background music style and mood.
Return only a short phrase (e.g. "Epic orchestral with piano").

{summaries}"""

        try:
            return self._call_gemini(prompt)
        except Exception as e:
            logger.warning(f"Gemini: Music suggestion failed: {e}")
            return ""


gemini_service = GeminiService()
