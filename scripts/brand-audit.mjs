#!/usr/bin/env node
// Brand and hygiene audit for every app under apps/.
//   node scripts/brand-audit.mjs                    summary table
//   node scripts/brand-audit.mjs --json out.json    machine-readable results
//   node scripts/brand-audit.mjs --baseline b.json  fail only if an app got worse than the baseline
//   node scripts/brand-audit.mjs --strict           fail on any finding
import { readdirSync, readFileSync, statSync, existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appsDir = path.join(root, "apps");
const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };

import { tokens, normHex, nearest as nearestTok, brandHexes } from "./lib/colour.mjs";
const palette = brandHexes();
const neutral = new Set(["#ffffff", "#000000"]);
const brandFonts = /^(space grotesk( variable)?|inter( variable)?|jetbrains mono( variable)?|system-ui|-apple-system|segoe ui|ui-monospace|sfmono-regular|menlo|consolas|sans-serif|monospace|inherit|initial|unset|ui-sans-serif|blinkmacsystemfont)$/i;

const SKIP_DIRS = new Set(["node_modules", "dist", ".astro", ".git", "data", ".wrangler"]);
const TEXT = /\.(css|html|astro|tsx|ts|jsx|js|mjs)$/;
function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name) || name === ".DS_Store") continue;
    const p = path.join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) yield* walk(p);
    else if (TEXT.test(name) && s.size < 600_000) yield p;
  }
}
const nearest = (hex) => nearestTok(hex, "dark").token;

const results = [];
for (const id of readdirSync(appsDir).sort()) {
  const dir = path.join(appsDir, id);
  if (!statSync(dir).isDirectory()) continue;
  const files = [...walk(dir)];
  const text = files.map((f) => readFileSync(f, "utf8")).join("\n");
  const pkg = existsSync(path.join(dir, "package.json")) ? JSON.parse(readFileSync(path.join(dir, "package.json"), "utf8")) : null;
  const r = { id, findings: [], metrics: {} };

  // --- brand adoption
  const usesBrand = /@rjmlaird\/brand/.test(text) || (pkg && JSON.stringify(pkg).includes("@rjmlaird/brand"));
  r.metrics.usesBrand = !!usesBrand;
  if (!usesBrand) r.findings.push("does not import @rjmlaird/brand");

  // --- fonts
  const fams = new Set();
  for (const m of text.matchAll(/font-family\s*:\s*([^;}{]+)/gi))
    for (const f of m[1].split(",")) { const n = f.replace(/!important/i, "").trim().replace(/^['"]|['"]$/g, ""); if (n && !/^var\(/.test(n) && !brandFonts.test(n) && !/^\$\{/.test(n)) fams.add(n); }
  for (const m of text.matchAll(/--(?:font|sans|serif|mono|display)[\w-]*\s*:\s*([^;}{]+)/gi))
    for (const f of m[1].split(",")) { const n = f.trim().replace(/^['"]|['"]$/g, ""); if (n && !/^var\(/.test(n) && !brandFonts.test(n)) fams.add(n); }
  r.metrics.offBrandFonts = [...fams];
  if (fams.size) r.findings.push(`off-brand fonts: ${[...fams].join(", ")}`);
  const gf = (text.match(/fonts\.(googleapis|gstatic)\.com/g) || []).length;
  r.metrics.googleFontRefs = gf;
  if (gf) r.findings.push(`${gf} Google Fonts reference(s) (third-party request, render-blocking)`);

  // --- colours
  const counts = new Map();
  const colourText = text.split("\n").filter((l) => !/\/\*\s*domain|--dom-[\w-]*\s*:/.test(l)).join("\n"); // intentional domain colours are exempt
  for (const m of colourText.matchAll(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)) {
    const h = normHex(m[0]);
    if (palette.has(h) || neutral.has(h)) continue;
    counts.set(h, (counts.get(h) || 0) + 1);
  }
  r.metrics.offBrandHexUnique = counts.size;
  r.metrics.offBrandHexTotal = [...counts.values()].reduce((a, b) => a + b, 0);
  r.metrics.topOffBrand = [...counts].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([h, n]) => ({ hex: h, uses: n, nearest: nearest(h) }));
  if (counts.size) r.findings.push(`${counts.size} off-brand hex colours (${r.metrics.offBrandHexTotal} uses)`);

  // --- accessibility heuristics
  const a11y = [];
  if (/maximum-scale\s*=\s*1(\.0)?|user-scalable\s*=\s*(no|0)/i.test(text)) a11y.push("blocks pinch-zoom (WCAG 1.4.4)");
  if (!/focus-visible/.test(text)) a11y.push("no :focus-visible styling");
  if (!/prefers-reduced-motion/.test(text) && /requestAnimationFrame|animation\s*:|transition\s*:/.test(text)) a11y.push("animates without prefers-reduced-motion");
  if (!/rj-skip|skip-link|skip to|Skip to/.test(text)) a11y.push("no skip link");
  if (/<script[^>]+src=["']https?:/i.test(text) && !/<script[^>]+integrity=/i.test(text)) a11y.push("third-party <script> without SRI");
  r.metrics.a11y = a11y;
  for (const a of a11y) r.findings.push(a);

  // --- packaging hygiene
  if (pkg) {
    const want = new Set([id, `@rjmlaird/${id}`]);
    if (!want.has(pkg.name)) r.findings.push(`package name "${pkg.name}" does not match folder`);
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const entryUsesReact = /src\/main\.(tsx|jsx)/.test(text) || files.some((f) => /\.(tsx|jsx)$/.test(f) && /from ["']react["']/.test(readFileSync(f, "utf8")));
    const realReact = files.some((f) => /\.(tsx|jsx)$/.test(f) && /ReactDOM|createRoot|useState|useEffect|client:/.test(readFileSync(f, "utf8")) && !/exp-example/.test(readFileSync(f, "utf8")));
    if (deps.react && !realReact) r.findings.push("react is a dependency but nothing renders with it (dead scaffold)");
    if (/exp-example/.test(text) && id !== "exp-example") r.findings.push('contains leftover "exp-example" template text');
  }
  results.push(r);
}

// ---- output
const pad = (s, n) => String(s).padEnd(n);
console.log(`${pad("app", 22)}${pad("brand", 7)}${pad("fonts", 7)}${pad("gfonts", 8)}${pad("hex", 6)}${pad("a11y", 6)}findings`);
for (const r of results)
  console.log(`${pad(r.id, 22)}${pad(r.metrics.usesBrand ? "yes" : "no", 7)}${pad(r.metrics.offBrandFonts.length, 7)}${pad(r.metrics.googleFontRefs, 8)}${pad(r.metrics.offBrandHexUnique, 6)}${pad(r.metrics.a11y.length, 6)}${r.findings.length}`);
const totals = results.reduce((t, r) => ({ apps: t.apps + 1, brand: t.brand + (r.metrics.usesBrand ? 1 : 0), hex: t.hex + r.metrics.offBrandHexUnique, findings: t.findings + r.findings.length }), { apps: 0, brand: 0, hex: 0, findings: 0 });
console.log(`\n${totals.brand}/${totals.apps} apps on @rjmlaird/brand, ${totals.hex} off-brand hex colours, ${totals.findings} findings`);

const out = opt("--json");
if (out) writeFileSync(out, JSON.stringify({ totals, results }, null, 2));

let fail = args.includes("--strict") && totals.findings > 0;
const base = opt("--baseline");
if (base && existsSync(base)) {
  const prev = new Map(JSON.parse(readFileSync(base, "utf8")).results.map((r) => [r.id, r]));
  for (const r of results) {
    const p = prev.get(r.id); if (!p) continue;
    const worse = r.findings.length > p.findings.length || r.metrics.offBrandHexUnique > p.metrics.offBrandHexUnique;
    if (worse) { console.error(`REGRESSION ${r.id}: findings ${p.findings.length} -> ${r.findings.length}, off-brand hex ${p.metrics.offBrandHexUnique} -> ${r.metrics.offBrandHexUnique}`); fail = true; }
  }
}
process.exit(fail ? 1 : 0);
