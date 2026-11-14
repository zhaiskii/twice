import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // DECISION(base): relative base so the static build works on any host path
  // (GitHub Pages serves under /twice/, Vercel at /). Revisit only if we add routing.
  base: './',
});
