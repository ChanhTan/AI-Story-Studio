import { useMutation, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/utils";

interface Scene {
  scene_number: number;
  summary: string;
  image_prompt: string;
  image_url?: string;
  image_path?: string;
  audio_path?: string;
  audio_duration?: number;
  narration_text: string;
  status: string;
}

interface Settings {
  gemini_api_key: boolean;
  edge_tts_voice: string;
  edge_tts_rate: string;
  edge_tts_pitch: string;
  edge_tts_volume: string;
  max_concurrent_tabs: number;
  perchance_timeout: number;
  retry_count: number;
  default_style: string;
  default_aspect_ratio: string;
  theme: string;
  language: string;
  auto_save: boolean;
}

export function useGenerateScenes() {
  return useMutation({
    mutationFn: (data: { story: string; style: string; aspect_ratio: string }) =>
      apiFetch<{ scenes: Scene[] }>("/api/generate-scenes", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function useGenerateImages() {
  return useMutation({
    mutationFn: (data: { scenes: Scene[]; style: string; aspect_ratio: string }) =>
      apiFetch<{ scenes: Scene[]; task_id: string }>("/api/generate-images", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function useGenerateVoice() {
  return useMutation({
    mutationFn: (data: { scenes: Scene[]; voice_settings: Record<string, unknown> }) =>
      apiFetch<{ scenes: Scene[]; task_id: string }>("/api/generate-voice", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function useBuildVideo() {
  return useMutation({
    mutationFn: (data: {
      scenes: Scene[];
      subtitle_settings: Record<string, unknown>;
      music_settings: Record<string, unknown>;
      video_effect: Record<string, unknown>;
      fps: number;
      resolution: string;
    }) =>
      apiFetch<{ video_path: string; task_id: string }>("/api/build-video", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function useGenerateAll() {
  return useMutation({
    mutationFn: (data: {
      story: string;
      style: string;
      aspect_ratio: string;
      voice_settings: Record<string, unknown>;
      subtitle_settings: Record<string, unknown>;
      music_settings: Record<string, unknown>;
      video_effect: Record<string, unknown>;
      fps: number;
      resolution: string;
    }) =>
      apiFetch<{ task_id: string }>("/api/generate-all", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function useTaskProgress(taskId: string | null) {
  return useQuery({
    queryKey: ["task", taskId],
    queryFn: () => apiFetch<{
      task_id: string;
      status: string;
      progress: number;
      current_scene: number;
      total_scenes: number;
      current_task: string;
      error?: string;
    }>(`/api/progress/${taskId}`),
    enabled: !!taskId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status === "completed" || data?.status === "failed" || data?.status === "cancelled") {
        return false;
      }
      return 1000;
    },
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => apiFetch<Settings>("/api/settings"),
  });
}

export function useUpdateSettings() {
  return useMutation({
    mutationFn: (data: Partial<Settings>) =>
      apiFetch<{ message: string }>("/api/settings", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function useHistory() {
  return useQuery({
    queryKey: ["history"],
    queryFn: () => apiFetch<{ history: unknown[] }>("/api/history"),
  });
}
