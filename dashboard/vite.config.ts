import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { squadWatcherPlugin } from "./src/plugin/squadWatcher";
import { apiDevPlugin } from "./src/plugin/apiDevPlugin";

export default defineConfig({
  plugins: [react(), squadWatcherPlugin(), apiDevPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
