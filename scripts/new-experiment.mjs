#!/usr/bin/env node
// Usage: pnpm new:experiment my-experiment-name
// Scaffolds packages/<slug> from exp-example and adds an entry to
// packages/labs-index/src/data/experiments.json

import { mkdirSync, cpSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const slug = process.argv[2];
if (!slug) {
  console.error("Usage: pnpm new:experiment <slug>");
  process.exit(1);
}
if (!/^[a-z0-9-]+$/.test(slug)) {
  console.error("Slug must be lowercase, alphanumeric, hyphen-separated.");
  process.exit(1);
}

const target = path.join(root, "packages", slug);
if (existsSync(target)) {
  console.error(`packages/${slug} already exists.`);
  process.exit(1);
}

// Copy the exp-example template as a starting point
cpSync(path.join(root, "packages", "exp-example"), target, {
  recursive: true,
  filter: (src) => !src.includes("node_modules") && !src.includes("dist")
});

// Rewrite the copied package.json name
const pkgPath = path.join(target, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
pkg.name = slug;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

// Register in the manifest
const manifestPath = path.join(root, "packages", "labs-index", "src", "data", "experiments.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
manifest.push({
  slug,
  title: slug,
  description: "New experiment — update this description.",
  status: "planned",
  tech: ["React", "Vite"],
  demoUrl: `https://${slug}.labs.rjmlaird.co.uk`,
  repoUrl: `https://github.com/greenorbitspace/labs/tree/main/packages/${slug}`,
  updated: new Date().toISOString().slice(0, 10)
});
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

console.log(`Created packages/${slug} and registered it in the labs-index manifest.`);
console.log(`Next: cd packages/${slug} && pnpm install && pnpm dev`);
