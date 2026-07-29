import { LogViewer } from "@/components/LogViewer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Terminal } from "lucide-react";

export function LogsPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">System Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time system activity and errors
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Terminal size={16} className="text-primary" />
            Live Output
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black/40 rounded-xl border border-border/50 p-4 font-mono text-xs h-[500px] overflow-auto">
            <div className="space-y-1">
              <LogViewer />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
