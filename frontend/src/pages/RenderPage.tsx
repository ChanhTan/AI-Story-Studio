import { useState } from "react";
import { Video, Settings2, Film, Music, Subtitles, Wand2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";

export function RenderPage() {
  const [rendering, setRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resolution, setResolution] = useState("1920x1080");
  const [fps, setFps] = useState(30);
  const [kenBurns, setKenBurns] = useState("Zoom In");
  const [subsEnabled, setSubsEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [musicVolume, setMusicVolume] = useState([30]);

  const handleRender = () => {
    setRendering(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setRendering(false);
          return 100;
        }
        return p + 5;
      });
    }, 500);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Render Video</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Build the final video with all assets
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings2 size={16} className="text-primary" />
                Video Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Resolution</label>
                  <Select
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    options={[
                      { label: "1920x1080 (Full HD)", value: "1920x1080" },
                      { label: "1280x720 (HD)", value: "1280x720" },
                      { label: "3840x2160 (4K)", value: "3840x2160" },
                    ]}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">FPS</label>
                  <Select
                    value={String(fps)}
                    onChange={(e) => setFps(parseInt(e.target.value))}
                    options={[
                      { label: "24 FPS (Cinematic)", value: "24" },
                      { label: "30 FPS (Standard)", value: "30" },
                      { label: "60 FPS (Smooth)", value: "60" },
                    ]}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ken Burns</label>
                  <Select
                    value={kenBurns}
                    onChange={(e) => setKenBurns(e.target.value)}
                    options={[
                      { label: "None", value: "None" },
                      { label: "Zoom In", value: "Zoom In" },
                      { label: "Zoom Out", value: "Zoom Out" },
                      { label: "Pan Left", value: "Pan Left" },
                      { label: "Pan Right", value: "Pan Right" },
                    ]}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Subtitles size={16} className="text-primary" />
                Subtitles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">Enable Subtitles</span>
                  <p className="text-xs text-muted-foreground">Burn subtitles into video</p>
                </div>
                <Switch checked={subsEnabled} onCheckedChange={setSubsEnabled} />
              </div>
              {subsEnabled && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Font</label>
                    <Select value="Arial" onChange={() => {}} options={[{ label: "Arial", value: "Arial" }, { label: "Helvetica", value: "Helvetica" }, { label: "Courier New", value: "Courier New" }]} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Size</label>
                    <Select value="24" onChange={() => {}} options={[{ label: "Small", value: "18" }, { label: "Medium", value: "24" }, { label: "Large", value: "32" }]} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Animation</label>
                    <Select value="fade" onChange={() => {}} options={[{ label: "Fade", value: "fade" }, { label: "Slide", value: "slide" }, { label: "None", value: "none" }]} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Music size={16} className="text-primary" />
                Background Music
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">Enable Music</span>
                  <p className="text-xs text-muted-foreground">Add background track</p>
                </div>
                <Switch checked={musicEnabled} onCheckedChange={setMusicEnabled} />
              </div>
              {musicEnabled && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Volume: {musicVolume[0]}%</label>
                    <Slider value={musicVolume} onValueChange={setMusicVolume} />
                  </div>
                  <Button variant="outline" className="w-full">
                    <Music size={14} />
                    Select Music File
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <Button
                className="w-full mb-3"
                size="lg"
                onClick={handleRender}
                disabled={rendering}
              >
                {rendering ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Wand2 size={18} />
                )}
                {rendering ? "Rendering..." : "Build Video"}
              </Button>

              {rendering && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Processing...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}

              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Scenes</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">0s</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Output</span>
                  <Badge variant="secondary" className="text-xs">MP4</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Effects</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Film Grain", default: false },
                { label: "Vignette", default: false },
                { label: "Motion Blur", default: false },
                { label: "Light Shake", default: false },
              ].map((effect) => (
                <div key={effect.label} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{effect.label}</span>
                  <Switch checked={false} onCheckedChange={() => {}} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
