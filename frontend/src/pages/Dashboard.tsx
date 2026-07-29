import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Sparkles, Image, Volume2, Video, Square,
  Clock, FileText, Settings, AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { LogViewer } from "@/components/LogViewer";
import { apiFetch } from "@/lib/utils";
import { cn } from "@/lib/utils";

const ASPECT_OPTIONS = {
  "16:9": { label: "16:9 (Ngang)", resolution: "1920x1080" },
  "9:16": { label: "9:16 (Dọc)", resolution: "1080x1920" },
};

export function Dashboard({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [story, setStory] = useState("");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [numScenes, setNumScenes] = useState<number>(0);
  const [voice, setVoice] = useState("en-US");
  const [style, setStyle] = useState("Anime");
  const [rate, setRate] = useState(0);
  const [voiceProvider, setVoiceProvider] = useState("gtts");

  const wordCount = story.trim() ? story.trim().split(/\s+/).length : 0;
  const estimatedDuration = Math.round(wordCount * 0.3);
  const estimatedScenes = Math.max(1, Math.round(wordCount / 50));

  const { data: task } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => apiFetch<{
      status: string; progress: number; current_task: string;
      current_scene: number; total_scenes: number; error?: string;
    }>(`/api/progress/${taskId}`),
    enabled: !!taskId,
    refetchInterval: (q) => {
      const d = q.state.data;
      if (d?.status === "completed" || d?.status === "failed" || d?.status === "cancelled") return false;
      return 1000;
    },
  });

  const isGenerating = taskId !== null && task?.status !== "completed" && task?.status !== "failed" && task?.status !== "cancelled";
  const progress = task?.progress ?? 0;
  const currentTask = task?.current_task ?? "";

  const steps = [
    { icon: FileText, label: "Analyze Story", color: "text-blue-400", done: progress > 20 },
    { icon: Image, label: "Generate Images", color: "text-purple-400", done: progress > 40 },
    { icon: Volume2, label: "Generate Voice", color: "text-green-400", done: progress > 60 },
    { icon: Video, label: "Build Video", color: "text-orange-400", done: progress > 80 },
    { icon: Sparkles, label: "Complete", color: "text-primary", done: progress >= 100 },
  ];

  const handleGenerateAll = useCallback(async () => {
    if (!story.trim()) return;
    const res = ASPECT_OPTIONS[aspectRatio as keyof typeof ASPECT_OPTIONS]?.resolution || "1920x1080";
    try {
      const data = await apiFetch<{ task_id: string }>("/api/generate-all", {
        method: "POST",
        body: JSON.stringify({
          story,
          style,
          aspect_ratio: aspectRatio,
          voice_settings: { provider: voiceProvider, voice, rate: `${rate >= 0 ? '+' : ''}${rate}%`, pitch: "0%", volume: "0%", language: voice },
          subtitle_settings: { enabled: true, format: "srt", burn: true, font: "Arial", font_size: 24, outline: true, shadow: true, color: "#FFFFFF", animation: "fade" },
          music_settings: { enabled: false, volume: 0.3, fade_in: 2, fade_out: 3, loop: true },
          video_effect: { ken_burns: "none", fade: true, cross_fade: true, blur: false, film_grain: false, vignette: false, motion_blur: false, light_shake: false },
          fps: 30, resolution: res,
          num_scenes: numScenes > 0 ? numScenes : null,
        }),
      });
      setTaskId(data.task_id);
    } catch (err) {
      alert("Error: " + (err as Error).message);
    }
  }, [story, aspectRatio, numScenes, voice, style, rate, voiceProvider]);

  const handleCancel = useCallback(async () => {
    if (taskId) {
      await apiFetch(`/api/cancel/${taskId}`, { method: "POST" });
      setTaskId(null);
    }
  }, [taskId]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate cinematic story videos with one click
          </p>
        </div>
        <Button variant="outline" onClick={() => onNavigate("settings")}>
          <Settings size={16} />
          Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText size={16} />
                Story Input
              </CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={story}
                onChange={(e) => setStory(e.target.value)}
                placeholder="Paste your story here..."
                className="w-full h-48 premium-input resize-none"
                disabled={isGenerating}
              />
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span>{wordCount} words</span>
                <span>~{estimatedDuration}s estimated</span>
                <span>~{estimatedScenes} scenes</span>
              </div>
            </CardContent>
          </Card>

          {task && isGenerating && (
            <Card className="border-primary/30">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-sm font-medium">{currentTask}</span>
                  </div>
                  <Badge variant="secondary">{progress}%</Badge>
                </div>
                <Progress value={progress} />
                <div className="flex items-center justify-between">
                  <div className="flex gap-4">
                    {steps.map((step, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs">
                        <step.icon size={12} className={cn(step.color, step.done ? "opacity-100" : "opacity-30")} />
                        <span className={cn("text-muted-foreground", step.done && "text-foreground")}>
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Button variant="destructive" size="sm" onClick={handleCancel}>
                    <Square size={14} />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {task?.status === "completed" && (
            <Card className="border-green-500/30">
              <CardContent className="p-6 text-center">
                <Sparkles size={32} className="mx-auto mb-2 text-green-400" />
                <p className="font-medium text-green-400">Video generated successfully!</p>
              </CardContent>
            </Card>
          )}

          {task?.status === "failed" && (
            <Card className="border-red-500/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle size={20} className="text-red-400 shrink-0" />
                  <p className="font-medium text-red-400">Generation failed</p>
                </div>
                <div className="bg-red-950/50 rounded-lg p-3 border border-red-500/20">
                  <p className="text-sm text-red-300 font-mono whitespace-pre-wrap break-all">
                    {task.error || "Unknown error"}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setTaskId(null)}>
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          <LogViewer />
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Aspect Ratio</label>
                <Select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  options={[
                    { label: "16:9 (Ngang)", value: "16:9" },
                    { label: "9:16 (Dọc)", value: "9:16" },
                  ]}
                  disabled={isGenerating}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Số scene (0 = tự động)</label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={numScenes}
                  onChange={(e) => setNumScenes(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full premium-input px-3 py-2 text-sm"
                  disabled={isGenerating}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Phong cách ảnh</label>
                <Select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  options={[
                    { label: "Anime", value: "Anime" },
                    { label: "Cartoon", value: "Cartoon" },
                    { label: "Cinematic", value: "Cinematic" },
                    { label: "Realistic", value: "Realistic" },
                    { label: "Fantasy", value: "Fantasy" },
                    { label: "Pixel Art", value: "Pixel Art" },
                    { label: "Minecraft", value: "Minecraft" },
                    { label: "Horror", value: "Horror" },
                    { label: "Sci-Fi", value: "Sci-Fi" },
                  ]}
                  disabled={isGenerating}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Công cụ TTS</label>
                <Select
                  value={voiceProvider}
                  onChange={(e) => { setVoiceProvider(e.target.value); setVoice("en-US"); }}
                  options={[
                    { label: "Google TTS (mặc định)", value: "gtts" },
                    { label: "TikTok TTS", value: "tiktok" },
                  ]}
                  disabled={isGenerating}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Giọng đọc</label>
                {voiceProvider === "tiktok" ? (
                  <Select
                    value={voice}
                    onChange={(e) => setVoice(e.target.value)}
                    options={[
                      { label: "US Nữ (Jessie)", value: "en-US-Female" },
                      { label: "US Nam trầm (Adam)", value: "en-US-Deep-Male" },
                      { label: "US Nam", value: "en-US-Male" },
                      { label: "US Nam trẻ", value: "en-US-Young-Male" },
                      { label: "US Nữ trẻ", value: "en-US-Young-Female" },
                      { label: "US Nữ nghiêm túc", value: "en-US-Serious-Female" },
                      { label: "UK Nam", value: "en-UK-Male" },
                      { label: "UK Nữ", value: "en-UK-Female" },
                      { label: "VN Nữ (Cô Gái Hoạt Ngôn)", value: "vi-VN-Female" },
                      { label: "VN Nam (Thanh Niên Tự Tin)", value: "vi-VN-Male" },
                    ]}
                    disabled={isGenerating}
                  />
                ) : (
                  <Select
                    value={voice}
                    onChange={(e) => setVoice(e.target.value)}
                    options={[
                      { label: "English (US)", value: "en-US" },
                      { label: "English (UK)", value: "en-GB" },
                      { label: "English (Australia)", value: "en-AU" },
                      { label: "English (India)", value: "en-IN" },
                      { label: "Tiếng Việt", value: "vi-VN" },
                      { label: "Japanese", value: "ja-JP" },
                      { label: "Korean", value: "ko-KR" },
                      { label: "Chinese", value: "zh-CN" },
                      { label: "French", value: "fr-FR" },
                      { label: "German", value: "de-DE" },
                      { label: "Spanish", value: "es-ES" },
                      { label: "Portuguese (Brazil)", value: "pt-BR" },
                      { label: "Russian", value: "ru-RU" },
                      { label: "Italian", value: "it-IT" },
                    ]}
                    disabled={isGenerating}
                  />
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Tốc độ đọc: {rate > 0 ? '+' : ''}{rate}%</label>
                <input
                  type="range"
                  min={-75}
                  max={100}
                  step={5}
                  value={rate}
                  onChange={(e) => setRate(parseInt(e.target.value))}
                  className="w-full"
                  disabled={isGenerating}
                />
              </div>
              <Button className="w-full" size="lg" disabled={!story.trim() || isGenerating} onClick={handleGenerateAll}>
                <Sparkles size={18} />
                Generate All
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" disabled={!story.trim() || isGenerating} onClick={() => onNavigate("script")}>
                  <Image size={14} />
                  Images
                </Button>
                <Button variant="secondary" disabled={!story.trim() || isGenerating} onClick={() => onNavigate("voices")}>
                  <Volume2 size={14} />
                  Voice
                </Button>
              </div>
              <Button variant="outline" className="w-full" disabled={isGenerating} onClick={() => onNavigate("render")}>
                <Video size={14} />
                Build Video
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Words", value: wordCount, icon: FileText },
                { label: "Est. Duration", value: `${estimatedDuration}s`, icon: Clock },
                { label: "Est. Scenes", value: estimatedScenes, icon: Image },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <stat.icon size={14} />
                    {stat.label}
                  </div>
                  <span className="text-sm font-medium">{stat.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
