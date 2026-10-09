#!/usr/bin/env node
// Usage: pnpm new:lab <slug> "<Title>" [theme=navy] [topic=mechanics]
import { cpSync, readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const [slug, title = slug, theme = "navy", topic = "mechanics"] = process.argv.slice(2);
if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
  console.error('Usage: pnpm new:lab <kebab-slug> "<Title>" [navy|forest|paper|slate] [topic]');
  process.exit(1);
}
const dest = join(root, "apps", slug);
if (existsSync(dest)) { console.error(`apps/${slug} already exists`); process.exit(1); }

cpSync(join(root, "templates/lab"), dest, { recursive: true });
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(json|jsonc|mjs|astro|tsx?|md)$/.test(f)) {
      writeFileSync(p, readFileSync(p, "utf8").replaceAll("__SLUG__", slug).replaceAll("__TITLE__", title));
    }
  }
})(dest);

const labsFile = join(root, "packages/registry/src/labs.ts");
const marker = "  // @new-lab";
const entry = `  {
    slug: "${slug}",
    title: ${JSON.stringify(title)},
    summary: "TODO: one sentence for the hub card.",
    topic: "${topic}",
    level: "explore",
    theme: "${theme}",
    kind: "astro-react",
    status: "wip",
  },
`;
const src = readFileSync(labsFile, "utf8");
if (!src.includes(marker)) { console.error("Marker not found in labs.ts; add the manifest by hand."); process.exit(1); }
writeFileSync(labsFile, src.replace(marker, entry + marker));

console.log(`Created apps/${slug} and registered it. Next:\n  pnpm install\n  pnpm --filter @labs/${slug} dev`);
