import { useEffect, useRef, useCallback, useState } from "react";

export interface WSMessage {
  type: string;
  [key: string]: unknown;
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const listenersRef = useRef<Map<string, ((data: WSMessage) => void)[]>>(new Map());

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = "localhost:8000";
    const ws = new WebSocket(`${protocol}//${host}/ws`);

    ws.onopen = () => {
      setConnected(true);
    };

    ws.onclose = () => {
      setConnected(false);
      setTimeout(() => {
        // Reconnect
      }, 3000);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WSMessage;
        const typeListeners = listenersRef.current.get(data.type) || [];
        typeListeners.forEach((cb) => cb(data));

        const allListeners = listenersRef.current.get("*") || [];
        allListeners.forEach((cb) => cb(data));
      } catch {
        // ignore
      }
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, []);

  const send = useCallback((data: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const on = useCallback((type: string, cb: (data: WSMessage) => void) => {
    if (!listenersRef.current.has(type)) {
      listenersRef.current.set(type, []);
    }
    listenersRef.current.get(type)!.push(cb);
    return () => {
      const arr = listenersRef.current.get(type);
      if (arr) {
        const idx = arr.indexOf(cb);
        if (idx >= 0) arr.splice(idx, 1);
      }
    };
  }, []);

  return { connected, send, on };
}
