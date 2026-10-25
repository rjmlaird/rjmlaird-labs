#!/usr/bin/env node
// Migrates the apps whose whole UI lives in index.html (inline <style>/<script>) onto @rjmlaird/brand.
// Legacy variable names are kept (so the app's own CSS is untouched) but now resolve to brand tokens.
import path from "node:path";
import { appDir, read, write, edit, note, notes, replaceRoot, parseVars, aliasBlock, retokenCss, retokenFonts, renameVars, headFixes, skipLink, pkgEdit, addBrandDep, removePath } from "../lib/migrate.mjs";
import { normHex } from "../lib/colour.mjs";

/** Turn the primary content <div class="main"> (or the elements table wrapper) into <main>, matching its closing tag. */
function promoteMain(html, id) {
  const open = /<div\b([^>]*\bclass="main"[^>]*)>/.exec(html) ?? /<div\b([^>]*\bid="table-wrap"[^>]*)>/.exec(html);
  if (!open) return html;
  let depth = 0, i = open.index;
  const re = /<\/?div\b/gi; re.lastIndex = i;
  for (let m; (m = re.exec(html)); ) { depth += m[0][1] === "/" ? -1 : 1; if (depth === 0) { i = m.index; break; } }
  if (depth !== 0) { note(id, "could not match closing </div> for <main> promotion"); return html; }
  return html.slice(0, open.index) + `<main${open[1]}>` + html.slice(open.index + open[0].length, i) + "</main>" + html.slice(i + 6);
}

const mix = (c, pct) => `color-mix(in srgb, var(--rj-${c}) ${pct}%, #000)`;
const STATUS = { alert: "alert", warning: "warn", watch: "watch", ok: "ok" };

const R = {
  drought: { tone: "amber", alias: { bg: "ink", panel: "card", "panel-2": "lift", line: "border", ash: "text", "ash-dim": "text-2", amber: "amber", "amber-dim": mix("amber", 70), water: "sky", "water-dim": mix("sky", 65), ...STATUS, radius: "var(--rj-radius-sm)" } },
  sewage: { tone: "amber", domain: ["sewage", "sewage-dim"], alias: { bg: "ink", panel: "card", "panel-2": "lift", line: "border", ash: "text", "ash-dim": "text-2", discharging: "alert", recent: "warn", clear: "ok", offline: "text-3", radius: "var(--rj-radius-sm)" } },
  biodiversity: { tone: "green", domain: ["soil"], alias: { bg: "ink", panel: "card", "panel-2": "lift", line: "border", ash: "text", "ash-dim": "text-2", leaf: "green", "leaf-dim": mix("green", 65), water: "sky", "water-dim": mix("sky", 65), ...STATUS, radius: "var(--rj-radius-sm)" } },
  electricity: { tone: "amber", domain: ["copper"], alias: { bg: "ink", panel: "card", "panel-2": "lift", line: "border", text: "text", "text-dim": "text-2", gold: "amber", cyan: "teal", danger: "alert", "font-display": "var(--rj-font-display)", "font-body": "var(--rj-font-body)", "font-mono": "var(--rj-font-mono)" } },
  elements: { tone: "teal", domain: ["am", "ae", "tm", "pm", "me", "nm", "hal", "ng", "la", "ac", "un"], alias: { void: "ink", panel: "card", "panel-raised": "lift", "grid-line": "border", "text-primary": "text", "text-muted": "text-3", "text-dim": "text-3", "accent-cyan": "teal", "accent-amber": "amber" } },
  blueprint: { tone: "sky", domain: ["ink", "blue-950", "blue-900", "blue-800", "blue-700", "cyan", "cyan-soft", "line", "line-strong", "panel"], alias: { white: "text", muted: "text-2", danger: "alert", success: "ok", warning: "warn", "text-muted": "text-2", radius: "var(--rj-radius-lg)", "font-display": "var(--rj-font-display)", "font-mono": "var(--rj-font-mono)" }, keepBlueprintSkin: true },
  cfd: { tone: "sky", theme: "light", alias: { bg: "ink", ink: "text", muted: "text-2", panel: "card", line: "border-strong", accent: "teal", blue: "sky" } },
  rubiks: { tone: "violet", theme: "auto", dropLegacyDark: true, alias: { bg: "ink", ink: "text", mute: "text-2", panel: "card", line: "border-strong", acc: "teal", ax: "amber", ay: "sky", az: "violet" } },
};

for (const [id, r] of Object.entries(R)) {
  const file = path.join(appDir(id), "index.html");
  edit(file, (html) => {
    let h = html;
    // 1. <style> blocks: root aliases, domain renames, hex -> var, fonts
    h = h.replace(/<style([^>]*)>([\s\S]*?)<\/style>/g, (m, attrs, css) => {
      let c = css;
      const legacy = (() => { const m2 = /(^|[\s}])(:root)\s*\{/.exec(c); return m2 ? parseVars(c.slice(m2.index + m2[0].length, (function () { let d = 0; for (let i = m2.index + m2[0].length - 1; i < c.length; i++) { if (c[i] === "{") d++; else if (c[i] === "}" && --d === 0) return i; } return c.length; })())) : null; })();
      if (legacy) {
        const explicit = {};
        for (const [k, v] of Object.entries(legacy)) if (/^#[0-9a-f]{3,6}$/i.test(v)) { const n = k.slice(2); if (r.alias[n] !== undefined || (r.domain ?? []).includes(n)) explicit[normHex(v)] = `var(${(r.domain ?? []).includes(n) ? "--dom-" + n : k})`; }
        const [replaced] = replaceRoot(c, aliasBlock(r.alias) + (r.domain?.length ? "\n  /* domain colours: intentional, exempt from brand-audit */\n" + r.domain.map((n) => `  --dom-${n}: ${legacy["--" + n]}; /* domain */`).join("\n") : ""));
        c = retokenCss(replaced.replace(/(--dom-[\w-]+:\s*#[0-9a-fA-F]+;[^\n]*)/g, (x) => x), { explicit, snap: r.theme === "light" ? 0 : 0.05 });
        // retokenCss must not touch the domain/alias lines it just wrote; they hold no raw hex apart from domain values, which it may snap, so restore them
        for (const n of r.domain ?? []) c = c.replace(new RegExp(`--dom-${n}:[^;]*;( /\\* domain \\*/)`), `--dom-${n}: ${legacy["--" + n]};$1`);
      } else c = retokenCss(c, { snap: 0.05 });
      if (r.domain?.length) c = c.split("\n").map((line) => (/^\s*--dom-[\w-]+:/.test(line) ? line : renameVars(line, r.domain))).join("\n");
      c = retokenFonts(c);
      return `<style${attrs}>${c}</style>`;
    });
    if (r.domain?.length) {
      // attributes and scripts too (inline style="var(--x)", classList builders), but never the :root definitions that already use --dom-*
      h = h.split("\n").map((line) => (/^\s*--dom-[\w-]+:/.test(line) || /<style|<\/style/.test(line) ? line : renameVars(line, r.domain))).join("\n");
      h = h.replace(/var\(--\$\{(\w+)\}\)/g, "var(--dom-${$1})"); // dynamic: var(--${cat})
    }
    if (r.dropLegacyDark) h = h.replace(/@media\(prefers-color-scheme:dark\)\{:root:not\(\[data-theme="light"\]\)\{[^}]*\}\}\s*/g, "").replace(/:root\[data-theme="dark"\]\{[^}]*\}\s*/g, "");
    // 2. head: brand stylesheet (bundled by Vite), no Google Fonts, no pinch-zoom block
    h = headFixes(h, { brandHref: "/src/brand.css", themeColor: r.theme === "light" ? "#F3F5F9" : "#0B0F1A" });
    // 3. theme + tone on <html>
    h = h.replace(/<html([^>]*)>/i, (m, a) => { a = a.replace(/\sdata-(theme|tone)="[^"]*"/g, ""); return `<html${a}${r.theme ? ` data-theme="${r.theme}"` : ""} data-tone="${r.tone}">`; });
    // 4. skip link
    if (!/<main\b/i.test(h)) h = promoteMain(h, id);
    const [h2, ok] = skipLink(h); if (!ok) note(id, "no <main> landmark: skip link not added");
    return h2;
  }, id);
  write(path.join(appDir(id), "src/brand.css"), '@import "@rjmlaird/brand/css";\n');
  // dead React scaffold -> removed; the app is plain HTML + inline JS built by Vite
  for (const f of ["src/App.tsx", "src/main.tsx"]) removePath(path.join(appDir(id), f));
  write(path.join(appDir(id), "vite.config.ts"), 'import { defineConfig } from "vite";\n\n// Single-file app: index.html is the entry; Vite bundles the brand stylesheet and fonts.\nexport default defineConfig({ base: "/" });\n');
  pkgEdit(id, (j) => { addBrandDep(j); for (const d of ["react", "react-dom"]) delete j.dependencies?.[d]; delete j.devDependencies?.["@vitejs/plugin-react"]; j.name = `@rjmlaird/${id}`; });
}

// post-check: any var(--x) used but never defined?
for (const id of Object.keys(R)) {
  const h = read(path.join(appDir(id), "index.html"));
  const defined = new Set([...h.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
  const used = new Set([...h.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]));
  const undef = [...used].filter((u) => !defined.has(u) && !u.startsWith("--rj-"));
  if (undef.length) note(id, `UNDEFINED custom properties: ${undef.join(", ")}`);
}
console.log(notes.join("\n") || "single-file migration: no warnings");
