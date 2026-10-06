import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  vite: {
    // satellite.js v7 ships a WASM/pthreads build whose worker file uses
    // top-level await, which Vite's default IIFE worker format can't
    // handle. ES module workers support it fine.
    worker: { format: 'es' },
  },
});
