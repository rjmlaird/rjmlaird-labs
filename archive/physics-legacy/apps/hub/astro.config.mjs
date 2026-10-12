import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://labs.rjmlaird.co.uk",
  vite: { ssr: { noExternal: [/^@labs\//] } },
});
