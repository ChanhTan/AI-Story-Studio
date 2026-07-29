import { useState } from "react";
import { Volume2, Play, Loader2, Music } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export function VoicesPage() {
  const [generating, setGenerating] = useState(false);
  const [voice, setVoice] = useState("en-US-JennyNeural");

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Voice Narration</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate narration with Edge TTS
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Music size={16} className="text-primary" />
            Voice Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Voice</label>
              <Select
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
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
              <label className="text-sm font-medium">Rate (%)</label>
              <Input type="text" defaultValue="0%" placeholder="e.g. +10%, -5%" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Volume2 size={16} className="text-primary" />
            Generated Audio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Volume2 size={48} className="mx-auto mb-4 opacity-50" />
            <p>Generate images first, then return here for voice generation</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
