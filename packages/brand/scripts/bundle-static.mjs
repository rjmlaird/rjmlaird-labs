#!/usr/bin/env node
// Builds a single static stylesheet for pages that cannot import CSS (plain HTML, Hono, custom build scripts).
//   node ../../packages/brand/scripts/bundle-static.mjs ./public/brand
// Output: <dest>/brand.css, <dest>/fonts/*.woff2, <dest>/favicon.svg
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dest = path.resolve(process.cwd(), process.argv[2] ?? path.join(root, "dist/static"));
mkdirSync(path.join(dest, "fonts"), { recursive: true });

const parts = ["fonts", "tokens", "base", "shell"].map((n) => readFileSync(path.join(root, "css", `${n}.css`), "utf8"));
writeFileSync(path.join(dest, "brand.css"), parts.join("\n").replaceAll("url(../fonts/", "url(./fonts/"));
for (const f of readdirSync(path.join(root, "fonts"))) if (f.endsWith(".woff2")) copyFileSync(path.join(root, "fonts", f), path.join(dest, "fonts", f));
copyFileSync(path.join(root, "favicon.svg"), path.join(dest, "favicon.svg"));
console.log(`brand static bundle -> ${path.relative(process.cwd(), dest) || "."}`);
