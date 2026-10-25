// Colour helpers shared by brand-audit and the migration scripts.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const tokens = JSON.parse(readFileSync(path.join(root, "packages/brand/src/brand.tokens.json"), "utf8"));

export const toRgb = (h) => { h = h.replace("#", ""); if (h.length === 3) h = [...h].map((c) => c + c).join(""); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
export const normHex = (m) => { let h = m.replace("#", "").toLowerCase(); if (h.length === 3) h = [...h].map((c) => c + c).join(""); return "#" + h; };
// OKLab distances track perceived colour difference far better than raw RGB.
export const toOklab = (h) => {
  const [r, g, b] = toRgb(h).map((c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
};
export const dist = (a, b) => Math.hypot(...a.map((v, i) => v - b[i]));

const SPECIAL = new Set(["focus", "on-accent"]);
const candidates = (theme) => Object.entries(tokens.theme[theme]).filter(([k, t]) => t.$type === "color" && t.$value.startsWith("#") && !SPECIAL.has(k)).map(([k, t]) => [k, toOklab(t.$value)]);
const cache = { dark: candidates("dark"), light: candidates("light") };

/** Nearest brand token for a hex colour: { token, d } where d is the OKLab distance (0.02 is roughly one just-noticeable difference). */
export function nearest(hex, theme = "dark") {
  const c = toOklab(hex); let best = { token: "", d: Infinity };
  for (const [k, lab] of cache[theme]) { const d = dist(c, lab); if (d < best.d) best = { token: k, d }; }
  return best;
}
export const brandHexes = () => {
  const s = new Map();
  for (const theme of Object.values(tokens.theme)) for (const [k, t] of Object.entries(theme)) if (t.$type === "color" && t.$value.startsWith("#")) s.set(t.$value.toLowerCase(), k);
  return s;
};
