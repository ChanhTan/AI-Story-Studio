import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, Image, Music, Video, Play, Pause, Maximize2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const sampleScenes = [
  { id: 1, prompt: "A lone warrior standing on a mountain peak at sunrise", status: "ready", duration: 8 },
  { id: 2, prompt: "Ancient forest with glowing mystical creatures", status: "ready", duration: 6 },
  { id: 3, prompt: "Dark castle under a blood moon sky", status: "ready", duration: 7 },
  { id: 4, prompt: "Hero riding a dragon through storm clouds", status: "ready", duration: 9 },
];

export function PreviewPage() {
  const [activeTab, setActiveTab] = useState("images");

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Preview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Preview your generated content
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="images">
            <Image size={14} />
            Images
          </TabsTrigger>
          <TabsTrigger value="audio">
            <Music size={14} />
            Audio
          </TabsTrigger>
          <TabsTrigger value="video">
            <Video size={14} />
            Video
          </TabsTrigger>
        </TabsList>

        <TabsContent value="images" className="mt-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {sampleScenes.map((scene) => (
              <motion.div
                key={scene.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: scene.id * 0.1 }}
              >
                <Card className="overflow-hidden card-hover">
                  <div className="aspect-video bg-gradient-to-br from-secondary to-accent flex items-center justify-center">
                    <Image size={32} className="text-muted-foreground/50" />
                  </div>
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {scene.prompt}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="success" className="text-[10px]">
                        {scene.status}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {scene.duration}s
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="audio" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-3">
                {sampleScenes.map((scene) => (
                  <div key={scene.id} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50">
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      <Play size={14} />
                    </Button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">Scene {scene.id} Narration</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {scene.duration}s
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="video" className="mt-6">
          <Card>
            <div className="aspect-video bg-gradient-to-br from-secondary to-accent flex items-center justify-center rounded-t-xl">
              <Button variant="outline" size="lg" className="rounded-full w-16 h-16">
                <Play size={24} />
              </Button>
            </div>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Final Video</h3>
                  <p className="text-xs text-muted-foreground">
                    {sampleScenes.reduce((a, s) => a + s.duration, 0)}s total
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm">
                    <Maximize2 size={14} />
                  </Button>
                  <Button size="sm">Download</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
