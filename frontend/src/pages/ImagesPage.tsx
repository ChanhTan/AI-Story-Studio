import { useState } from "react";
import { Image, Play, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SceneCard } from "@/components/SceneCard";

interface Scene {
  scene_number: number;
  summary: string;
  image_prompt: string;
  narration_text: string;
  status: string;
}

export function ImagesPage() {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(false);
  const [style, setStyle] = useState("Cinematic");

  const handleGenerateImages = async () => {
    if (scenes.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/generate-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenes, style, aspect_ratio: "16:9" }),
      });
      const data = await res.json();
      setScenes(data.scenes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Image Generation</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate images using Perchance AI
          </p>
        </div>
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
            className="w-36"
          />
          <Button onClick={handleGenerateImages} disabled={loading || scenes.length === 0}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Image size={16} />}
            {loading ? "Generating..." : "Generate All"}
          </Button>
        </div>
      </div>

      {scenes.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Image size={48} className="mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              First analyze your story in the Script tab to see scenes here
            </p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[600px]">
          <div className="space-y-3 pr-4">
            {scenes.map((scene) => (
              <SceneCard key={scene.scene_number} scene={scene} />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
