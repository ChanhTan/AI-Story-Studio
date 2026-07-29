import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Image, Play, Trash2, RefreshCw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

interface SceneCardProps {
  scene: Scene;
  onRetry?: () => void;
  onDelete?: () => void;
  onRegenerate?: () => void;
  onDownload?: () => void;
}

export function SceneCard({ scene, onRetry, onDelete, onRegenerate, onDownload }: SceneCardProps) {
  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-400",
    completed: "bg-green-500/10 text-green-400",
    failed: "bg-red-500/10 text-red-400",
    generating: "bg-blue-500/10 text-blue-400",
  };

  const hasImage = scene.image_path || scene.image_url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: scene.scene_number * 0.05 }}
    >
      <Card className="card-hover overflow-hidden">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className={cn(
              "w-24 h-24 rounded-lg flex items-center justify-center shrink-0 overflow-hidden",
              hasImage ? "bg-cover bg-center" : "bg-secondary"
            )}
              style={hasImage ? { backgroundImage: `url(${scene.image_path || scene.image_url})` } : {}}
            >
              {!hasImage && <Image size={24} className="text-muted-foreground" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-muted-foreground">
                  Scene {scene.scene_number}
                </span>
                <Badge variant="secondary" className={cn("text-xs", statusColors[scene.status])}>
                  {scene.status}
                </Badge>
              </div>

              <p className="text-sm font-medium mb-0.5 truncate">
                {scene.summary || `Scene ${scene.scene_number}`}
              </p>

              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {scene.image_prompt}
              </p>

              {scene.audio_duration && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Play size={12} />
                  <span>{scene.audio_duration.toFixed(1)}s</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              {scene.status === "failed" && onRetry && (
                <Button variant="ghost" size="icon" onClick={onRetry} className="h-8 w-8">
                  <RefreshCw size={14} />
                </Button>
              )}
              {onRegenerate && (
                <Button variant="ghost" size="icon" onClick={onRegenerate} className="h-8 w-8">
                  <RefreshCw size={14} />
                </Button>
              )}
              {onDelete && (
                <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 text-destructive">
                  <Trash2 size={14} />
                </Button>
              )}
              {onDownload && (
                <Button variant="ghost" size="icon" onClick={onDownload} className="h-8 w-8">
                  <Download size={14} />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
