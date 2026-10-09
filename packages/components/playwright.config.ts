import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  reporter: process.env["CI"] ? [["github"], ["html", { open: "never" }]] : "list",
  use: { baseURL: "http://localhost:6006" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Serves the static Storybook build. Run `pnpm build` before `pnpm test:a11y`.
  webServer: {
    command: "pnpm exec http-server storybook-static -p 6006 --silent",
    url: "http://localhost:6006/index.json",
    reuseExistingServer: !process.env["CI"],
  },
});
