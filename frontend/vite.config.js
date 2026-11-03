import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/api": {
        target: "http://3.6.123.26:3000",   // ← change to backend port on AWS
        changeOrigin: true,
      },
    },
  },
});
