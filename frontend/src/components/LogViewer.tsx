import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LogEntry {
  id: number;
  timestamp: string;
  level: "info" | "success" | "warning" | "error";
  message: string;
}

const logColors: Record<string, string> = {
  info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  success: "bg-green-500/10 text-green-400 border-green-500/20",
  warning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  error: "bg-red-500/10 text-red-400 border-red-500/20",
};

const levelBadge: Record<string, "info" | "success" | "warning" | "destructive"> = {
  info: "info",
  success: "success",
  warning: "warning",
  error: "destructive",
};

export function LogViewer({ logs: externalLogs }: { logs?: LogEntry[] }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (externalLogs) {
      setLogs(externalLogs);
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//localhost:8000/ws`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const entry: LogEntry = {
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          level: data.level || "info",
          message: data.message || JSON.stringify(data),
        };
        setLogs((prev) => [...prev.slice(-99), entry]);
      } catch {
        // ignore
      }
    };

    return () => ws.close();
  }, [externalLogs]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  if (logs.length === 0) {
    return (
      <div className="glass rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-medium">Live Logs</h3>
        </div>
        <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
          Waiting for backend logs...
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-medium">Live Logs</h3>
        <Badge variant="secondary" className="text-xs">
          {logs.length} entries
        </Badge>
      </div>
      <ScrollArea ref={scrollRef} className="h-48 p-2">
        <div className="space-y-1">
          {logs.map((log) => (
            <div
              key={log.id}
              className={cn(
                "flex items-start gap-2 px-3 py-1.5 rounded-md text-xs font-mono",
                logColors[log.level]
              )}
            >
              <span className="opacity-50 shrink-0">{log.timestamp}</span>
              <Badge variant={levelBadge[log.level]} className="text-[10px] px-1.5 py-0">
                {log.level.toUpperCase()}
              </Badge>
              <span className="break-all">{log.message}</span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
