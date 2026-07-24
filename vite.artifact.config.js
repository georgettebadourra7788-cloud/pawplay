import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// Separate build used only to produce a single self-contained HTML file
// (all JS/CSS/images inlined) for one-off hosting like a Claude Artifact.
// The normal `vite.config.js` / `npm run build` stays untouched for real
// deployments (Vercel, Netlify, etc.) where separate chunked assets are
// preferable.
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  build: {
    outDir: "dist-artifact",
    assetsInlineLimit: 200000,
    cssCodeSplit: false,
  },
});
