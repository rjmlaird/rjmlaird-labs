import { defineConfig } from "astro/config";
import react from "@astrojs/react";

export default defineConfig({
  site: "https://mechanics.labs.rjmlaird.co.uk",
  integrations: [react()],
  vite: { ssr: { noExternal: [/^@labs\//] } },
});
