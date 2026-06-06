import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Wayforge roadmap viewer — Vite + React app rooted at the repo root.
export default defineConfig({
  plugins: [react()],
});
