#!/usr/bin/env node
// Sanity checks on dist/: every local link/asset resolves, every lab has the shared shell, every lab has a PDF.
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const dist = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
let bad = 0, pages = 0;
for (const file of walk(dist).filter((f) => f.endsWith(".html"))) {
  pages++; const html = readFileSync(file, "utf8");
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const u = m[1]; if (/^(https?:|mailto:|data:|#|javascript:)/.test(u)) continue;
    const target = resolve(dirname(file), u.split("#")[0].split("?")[0]);
    if (!existsSync(target)) { bad++; console.error(`BROKEN ${file.replace(dist, "")} → ${u}`); }
  }
  if (file.includes("/labs/")) for (const need of ['data-lab="', 'id="main"', 'class="ml-skip"', 'data-action="print"']) if (!html.includes(need)) { bad++; console.error(`MISSING ${need} in ${file.replace(dist, "")}`); }
}
const reg = JSON.parse(readFileSync(join(dist, "labs.json"), "utf8"));
for (const l of reg.labs) if (!existsSync(join(dist, "assets", "pdf", `${l.slug}.pdf`))) { bad++; console.error(`NO PDF for ${l.slug}`); }
console.log(bad ? `${bad} problem(s) in ${pages} pages` : `OK: ${pages} pages, ${reg.labs.length} labs, all links resolve`);
process.exit(bad ? 1 : 0);
