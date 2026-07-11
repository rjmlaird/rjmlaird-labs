import { defineConfig } from "astro/config";

// This site is deployed as labs.rjmlaird.co.uk on Cloudflare Pages.
// Kept as a static build — no adapter needed unless you add SSR routes later.
export default defineConfig({
  site: "https://labs.rjmlaird.co.uk",
  output: "static",
  build: {
    format: "directory"
  }
});
