// Helpers for the brand migration. Every function is idempotent: running the migration twice changes nothing.
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { nearest, normHex } from "./colour.mjs";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const appDir = (id) => path.join(root, "apps", id);
export const notes = [];
export const note = (app, msg) => notes.push(`${app}: ${msg}`);

export const read = (p) => readFileSync(p, "utf8");
export function write(p, s) { mkdirSync(path.dirname(p), { recursive: true }); writeFileSync(p, s); }
export function edit(p, fn, app = "") {
  if (!existsSync(p)) { note(app, `MISSING ${path.relative(root, p)}`); return false; }
  const before = read(p), after = fn(before);
  if (after !== before) write(p, after);
  return after !== before;
}

/** Index of the matching close brace for the open brace at `open`. */
export function matchBrace(s, open) {
  let depth = 0;
  for (let i = open; i < s.length; i++) { if (s[i] === "{") depth++; else if (s[i] === "}" && --depth === 0) return i; }
  return -1;
}

/** Replace the first top-level `:root{...}` block that defines custom properties. Returns [newText, oldBlockBody|null]. */
export function replaceRoot(css, newBody) {
  const m = /(^|[\s}])(:root)\s*\{/.exec(css);
  if (!m) return [css, null];
  const open = m.index + m[0].length - 1, close = matchBrace(css, open);
  return [css.slice(0, open + 1) + "\n" + newBody + "\n" + css.slice(close), css.slice(open + 1, close)];
}

/** Parse `--name: value;` declarations from a block body. */
export function parseVars(body) {
  const out = {};
  for (const m of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out[m[1]] = m[2].trim().replace(/\s*\/\*.*?\*\/\s*$/, "");
  return out;
}

const rj = (t) => (t.startsWith("var(") || t.includes("(") || t.startsWith("#") ? t : `var(--rj-${t})`);
/** Alias block: legacy names keep working, values come from brand tokens. `map` values are token names or raw CSS. */
export function aliasBlock(map, header = "/* legacy names kept; values come from @rjmlaird/brand */") {
  return `  ${header}\n` + Object.entries(map).map(([k, v]) => `  --${k}: ${rj(v)};`).join("\n");
}

/** Apply hex -> var() replacement in CSS, skipping url(...) payloads. */
export function retokenCss(css, { explicit = {}, snap = 0.05, theme = "dark" } = {}) {
  let snapped = 0;
  const swap = (seg) => seg.replace(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g, (m) => {
    const h = normHex(m);
    if (h === "#ffffff" || h === "#000000") return m;
    if (explicit[h]) return explicit[h];
    if (snap) { const n = nearest(h, theme); if (n.d <= snap) { snapped++; return `var(--rj-${n.token})`; } }
    return m;
  });
  return css.split(/(url\([^)]*\))/g).map((seg, i) => (i % 2 ? seg : swap(seg))).join("");
}

const MONO = /mono|consolas|menlo|courier|ui-monospace|sfmono/i;
const DISPLAY = /grotesk|fraunces|archivo|newsreader|georgia|serif(?!-)/i;
/** Map any font-family declaration to the brand variables (mono / display / body). */
export function retokenFonts(css) {
  return css
    .replace(/@import\s+url\([^)]*fonts\.googleapis[^)]*\)\s*;?/g, "")
    .replace(/font-family\s*:\s*([^;}]+)/g, (m, v) => {
      if (/var\(/.test(v)) return m;
      const first = v.split(",")[0];
      const kind = MONO.test(first) ? "mono" : DISPLAY.test(first) ? "display" : "body";
      return `font-family: var(--rj-font-${kind})`;
    });
}

/** Rename custom properties to --dom-* (intentional domain colours, exempt from the audit). */
export function renameVars(text, names) {
  let t = text;
  for (const n of names) t = t.replace(new RegExp(`--${n}(?![\\w-])`, "g"), `--dom-${n}`);
  return t;
}

export const GFONT_LINKS = /\s*<link[^>]+fonts\.(googleapis|gstatic)\.com[^>]*>\s*/g;
export function headFixes(html, { brandHref, favicon = "/favicon.svg", themeColor = "#0B0F1A" }) {
  let h = html.replace(GFONT_LINKS, "\n");
  h = h.replace(/,?\s*maximum-scale\s*=\s*[\d.]+/i, "").replace(/,?\s*user-scalable\s*=\s*(no|0)/i, "");
  if (!h.includes(brandHref)) {
    const tag = `<link rel="stylesheet" href="${brandHref}">`;
    h = /<style/i.test(h) ? h.replace(/<style/i, `${tag}\n<style`) : h.replace(/<\/head>/i, `${tag}\n</head>`);
  }
  if (!/rel=["']icon["']/.test(h)) h = h.replace(/<\/head>/i, `<link rel="icon" type="image/svg+xml" href="${favicon}">\n</head>`);
  if (!/name=["']theme-color["']/.test(h)) h = h.replace(/<\/head>/i, `<meta name="theme-color" content="${themeColor}">\n</head>`);
  return h;
}

/** Add a skip link and landmark target. Returns [html, ok]. */
export function skipLink(html) {
  if (html.includes("rj-skip")) return [html, true];
  const main = /<main\b([^>]*)>/i.exec(html);
  if (!main) return [html, false];
  let id = /id=["']([^"']+)["']/.exec(main[1])?.[1];
  let h = html;
  if (!id) { id = "rj-main"; h = h.replace(main[0], `<main id="rj-main" tabindex="-1"${main[1]}>`); }
  h = h.replace(/<body([^>]*)>/i, `<body$1>\n<a class="rj-skip" href="#${id}">Skip to content</a>`);
  return [h, true];
}

export function pkgEdit(id, fn) {
  const p = path.join(appDir(id), "package.json");
  const j = JSON.parse(read(p)); fn(j);
  const out = JSON.stringify(j, null, 2) + "\n";
  if (out !== read(p)) write(p, out);
}
export const addBrandDep = (j) => { j.dependencies = { "@rjmlaird/brand": "workspace:*", ...(j.dependencies ?? {}) }; };
export const removePath = (p) => { if (existsSync(p)) rmSync(p, { recursive: true, force: true }); };
