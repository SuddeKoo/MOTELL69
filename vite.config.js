import { defineConfig } from 'vite';

// Relativ base, så bygget kan legges ut som statisk nettside (f.eks. Render) uten ekstra oppsett.
export default defineConfig({
  base: './',
  build: { target: 'es2020', chunkSizeWarningLimit: 900 },
});
