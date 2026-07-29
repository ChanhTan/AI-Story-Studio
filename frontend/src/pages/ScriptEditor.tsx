import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Wand2, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SceneCard } from "@/components/SceneCard";
import { Select } from "@/components/ui/select";

interface Scene {
  scene_number: number;
  summary: string;
  image_prompt: string;
  narration_text: string;
  status: string;
}

export function ScriptEditor() {
  const [story, setStory] = useState("");
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(false);
  const [style, setStyle] = useState("Cinematic");
  const [aspectRatio, setAspectRatio] = useState("16:9");

  const handleAnalyze = async () => {
    if (!story.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/generate-scenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story, style, aspect_ratio: aspectRatio }),
      });
      const data = await res.json();
      setScenes(data.scenes);
    } catch (err) {
      console.error("Failed to analyze story:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Script Editor</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Paste your story and let AI split it into scenes
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText size={16} />
            Story Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            placeholder="Paste your full story here. The AI will automatically split it into scenes..."
            className="w-full h-40 premium-input resize-none"
          />
          <div className="flex items-center gap-3">
            <Select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              options={[
                { label: "Realistic", value: "Realistic" },
                { label: "Cinematic", value: "Cinematic" },
                { label: "Fantasy", value: "Fantasy" },
                { label: "Anime", value: "Anime" },
                { label: "Minecraft", value: "Minecraft" },
                { label: "Pixel Art", value: "Pixel Art" },
                { label: "Horror", value: "Horror" },
                { label: "Sci-Fi", value: "Sci-Fi" },
                { label: "Dark Fantasy", value: "Dark Fantasy" },
              ]}
              className="w-40"
            />
            <Select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              options={[
                { label: "16:9 (Landscape)", value: "16:9" },
                { label: "9:16 (Portrait)", value: "9:16" },
                { label: "1:1 (Square)", value: "1:1" },
              ]}
              className="w-44"
            />
            <Button
              onClick={handleAnalyze}
              disabled={!story.trim() || loading}
              className="ml-auto"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Wand2 size={16} />
              )}
              {loading ? "Analyzing..." : "Analyze Story"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {scenes.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Scenes ({scenes.length})
            </h2>
            <Badge variant="secondary">
              ~{scenes.reduce((acc, s) => acc + s.narration_text.split(/\s+/).length, 0) * 0.3}s total
            </Badge>
          </div>
          <ScrollArea className="h-[500px]">
            <div className="space-y-3 pr-4">
              {scenes.map((scene) => (
                <SceneCard key={scene.scene_number} scene={scene} />
              ))}
            </div>
          </ScrollArea>
        </motion.div>
      )}
    </div>
  );
}
