import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // DECISION(base): relative base so the static build works on any host path
  // (GitHub Pages serves under /twice/, Vercel at /). Revisit only if we add routing.
  base: './',
  build: {
    // DECISION(chunk-limit): one ~570 KB (≈175 KB gzip) chunk is expected — React, motion and
    // the engine's sourced catalog JSON all load before the first analysis can run, so
    // splitting would only add a waterfall. Raise the warning, don't hide real growth:
    // if a build crosses this, look at what was added before bumping it again.
    chunkSizeWarningLimit: 700,
  },
});
