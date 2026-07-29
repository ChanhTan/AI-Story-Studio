import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Key, Radio, Monitor, Sliders, Music } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useSettings, useUpdateSettings } from "@/hooks/useApi";

export function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const [local, setLocal] = useState<Record<string, unknown>>({});
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [tkSessionInput, setTkSessionInput] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setLocal(settings as unknown as Record<string, unknown>);
    }
  }, [settings]);

  const handleSave = () => {
    const payload: Record<string, unknown> = {};
    if (apiKeyInput.trim()) {
      payload.gemini_api_key = apiKeyInput.trim();
    }
    for (const key of ["edge_tts_voice", "edge_tts_rate", "edge_tts_pitch", "edge_tts_volume",
      "max_concurrent_tabs", "perchance_timeout", "retry_count", "default_style",
      "default_aspect_ratio", "theme", "language", "auto_save"]) {
      if (key in local) payload[key] = local[key];
    }
    if (tkSessionInput.trim()) payload.tiktok_session_id = tkSessionInput.trim();
    updateSettings.mutate(payload, {
      onSuccess: () => {
        setSaved(true);
        setApiKeyInput("");
        setTkSessionInput("");
        setTimeout(() => setSaved(false), 2000);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure your AI Story Video Creator
          </p>
        </div>
        <Button onClick={handleSave} disabled={updateSettings.isPending}>
          <Save size={16} />
          {saved ? "Saved!" : "Save Settings"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key size={16} className="text-primary" />
            Gemini API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">API Key</label>
            <div className="flex items-center gap-2 mb-2">
              <div className={cn("w-2 h-2 rounded-full", local.gemini_api_key_set ? "bg-green-400" : "bg-red-400")} />
              <span className="text-xs text-muted-foreground">
                {local.gemini_api_key_set ? "API key is configured" : "API key not set"}
              </span>
            </div>
            <Input
              type="password"
              placeholder={local.gemini_api_key_set ? "Enter new key to replace existing one" : "Enter your Gemini API key"}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Get your API key from{" "}
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                Google AI Studio
              </a>
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Model</label>
            <div className="flex gap-2">
              <Select
                value={(local.gemini_model as string) || "gemini-2.5-flash"}
                onChange={(e) => setLocal({ ...local, gemini_model: e.target.value })}
                options={[
                  { label: "Gemini 2.5 Flash", value: "gemini-2.5-flash" },
                  { label: "Gemini 2.5 Pro", value: "gemini-2.5-pro" },
                  { label: "Gemini 3.1 Pro", value: "gemini-3.1-pro" },
                  { label: "Gemini 2.0 Flash", value: "gemini-2.0-flash" },
                  { label: "Gemini 1.5 Flash", value: "gemini-1.5-flash" },
                ]}
                className="flex-1"
              />
              <Button variant="outline" onClick={async () => {
                try {
                  const res = await fetch("/api/gemini/models");
                  const data = await res.json();
                  alert("Available models:\n" + (data.models?.join("\n") || "None found"));
                } catch {}
              }}>
                List Models
              </Button>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={async () => {
            try {
              const res = await fetch("/api/gemini/test", { method: "POST" });
              const data = await res.json();
              alert(data.success ? "OK: " + data.message : "FAIL: " + data.message);
            } catch {
              alert("Connection error");
            }
          }}>
            Test API Key
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Radio size={16} className="text-primary" />
            Edge TTS Voice
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Voice</label>
              <Select
                value={(local.edge_tts_voice as string) || "en-US-JennyNeural"}
                onChange={(e) => setLocal({ ...local, edge_tts_voice: e.target.value })}
                options={[
                  { label: "Jenny (US Female)", value: "en-US-JennyNeural" },
                  { label: "Guy (US Male)", value: "en-US-GuyNeural" },
                  { label: "Aria (US Female)", value: "en-US-AriaNeural" },
                  { label: "Sonia (UK Female)", value: "en-GB-SoniaNeural" },
                  { label: "Ryan (UK Male)", value: "en-GB-RyanNeural" },
                ]}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Language</label>
              <Select
                value={(local.language as string) || "en"}
                onChange={(e) => setLocal({ ...local, language: e.target.value })}
                options={[
                  { label: "English", value: "en" },
                  { label: "Vietnamese", value: "vi" },
                  { label: "Japanese", value: "ja" },
                  { label: "Korean", value: "ko" },
                  { label: "Chinese", value: "zh" },
                ]}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Rate: {local.edge_tts_rate as string}</label>
              <Input
                value={(local.edge_tts_rate as string) || "0%"}
                onChange={(e) => setLocal({ ...local, edge_tts_rate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Pitch: {local.edge_tts_pitch as string}</label>
              <Input
                value={(local.edge_tts_pitch as string) || "0%"}
                onChange={(e) => setLocal({ ...local, edge_tts_pitch: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Volume: {local.edge_tts_volume as string}</label>
              <Input
                value={(local.edge_tts_volume as string) || "0%"}
                onChange={(e) => setLocal({ ...local, edge_tts_volume: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Music size={16} className="text-primary" />
            TikTok TTS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Session ID</label>
            <div className="flex items-center gap-2 mb-2">
              <div className={cn("w-2 h-2 rounded-full", local.tiktok_session_id_set ? "bg-green-400" : "bg-red-400")} />
              <span className="text-xs text-muted-foreground">
                {local.tiktok_session_id_set ? "Session ID is configured" : "Session ID not set"}
              </span>
            </div>
            <Input
              type="password"
              placeholder={local.tiktok_session_id_set ? "Enter new session ID to replace" : "Enter your TikTok session ID"}
              value={tkSessionInput}
              onChange={(e) => setTkSessionInput(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Get session ID from TikTok cookie (<code>sessionid</code>) after logging in on tiktok.com
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sliders size={16} className="text-primary" />
            Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Concurrent Tabs</label>
              <Input
                type="number"
                value={(local.max_concurrent_tabs as number) || 3}
                onChange={(e) => setLocal({ ...local, max_concurrent_tabs: parseInt(e.target.value) || 3 })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Timeout (seconds)</label>
              <Input
                type="number"
                value={(local.perchance_timeout as number) || 120}
                onChange={(e) => setLocal({ ...local, perchance_timeout: parseInt(e.target.value) || 120 })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Retry Count</label>
              <Input
                type="number"
                value={(local.retry_count as number) || 3}
                onChange={(e) => setLocal({ ...local, retry_count: parseInt(e.target.value) || 3 })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Monitor size={16} className="text-primary" />
            General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Theme</label>
              <Select
                value={(local.theme as string) || "dark"}
                onChange={(e) => setLocal({ ...local, theme: e.target.value })}
                options={[
                  { label: "Dark", value: "dark" },
                  { label: "Light", value: "light" },
                ]}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Default Style</label>
              <Select
                value={(local.default_style as string) || "Realistic"}
                onChange={(e) => setLocal({ ...local, default_style: e.target.value })}
                options={[
                  { label: "Realistic", value: "Realistic" },
                  { label: "Cinematic", value: "Cinematic" },
                  { label: "Fantasy", value: "Fantasy" },
                  { label: "Anime", value: "Anime" },
                ]}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">Auto Save</span>
              <p className="text-xs text-muted-foreground">Automatically save projects</p>
            </div>
            <Switch
              checked={!!local.auto_save}
              onCheckedChange={(checked) => setLocal({ ...local, auto_save: checked })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
