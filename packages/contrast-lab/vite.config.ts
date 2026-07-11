import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Deployed independently as contrast-lab.labs.rjmlaird.co.uk
export default defineConfig({
  plugins: [react()],
  base: "/"
});
