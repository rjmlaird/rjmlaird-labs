import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

interface IndexEntry {
  id: string;
  type: "story" | "docs";
  title: string;
  name: string;
}

const themes = ["light", "dark"] as const;

test.describe("component accessibility", () => {
  let stories: IndexEntry[] = [];

  test.beforeAll(async ({ request }) => {
    const res = await request.get("/index.json");
    const index = (await res.json()) as { entries: Record<string, IndexEntry> };
    stories = Object.values(index.entries).filter((e) => e.type === "story");
  });

  test("Storybook exposes stories", () => {
    expect(stories.length).toBeGreaterThan(0);
  });

  for (const theme of themes) {
    test(`no axe violations in ${theme} theme`, async ({ page }) => {
      test.setTimeout(120_000);
      const failures: string[] = [];

      for (const story of stories) {
        await page.goto(`/iframe.html?id=${story.id}&viewMode=story&globals=theme:${theme}`);
        await page.locator("#storybook-root > *").first().waitFor();
        // Open disclosure widgets so their contents are checked too.
        await page.evaluate(() => document.querySelectorAll("details").forEach((d) => (d.open = true)));

        const results = await new AxeBuilder({ page })
          .include("#storybook-root")
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();

        for (const v of results.violations) {
          failures.push(`${story.title} / ${story.name}: ${v.id} (${v.nodes.length} nodes) ${v.helpUrl}`);
        }
      }

      expect(failures, failures.join("\n")).toEqual([]);
    });
  }
});
