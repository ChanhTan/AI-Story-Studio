import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/ws": {
        target: "ws://localhost:8000",
        ws: true,
      },
      "/images": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/audio": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/output": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
