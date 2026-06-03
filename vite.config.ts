import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Pathfinder roadmap viewer — Vite + React app rooted at the repo root.
// The Cloudflare worker (worker/) is built separately via wrangler and is not
// part of this Vite build.
export default defineConfig({
  plugins: [react()],
});
