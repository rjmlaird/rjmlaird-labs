#!/usr/bin/env node
// Assembles dist/ from src/: shared shell + per-lab body/CSS/JS + index page. No dependencies.
import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src"), dist = join(root, "dist");
const reg = JSON.parse(readFileSync(join(src, "labs.json"), "utf8"));
const cats = Object.fromEntries(reg.categories.map((c) => [c.id, c.label]));
const labs = reg.labs.slice().sort((a, b) => a.order - b.order);
const esc = (s = "") => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap">`;
const hasPdf = (slug) => existsSync(join(src, "assets", "pdf", `${slug}.pdf`));

rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, "labs"), { recursive: true });
cpSync(join(src, "assets"), join(dist, "assets"), { recursive: true });
mkdirSync(join(dist, "assets", "css", "labs"), { recursive: true });
mkdirSync(join(dist, "assets", "js", "labs"), { recursive: true });

// Split shared base.css into core.css (rules every lab uses) and per-lab subsets, using the "@labs:" annotations.
const baseParts = readFileSync(join(src, "assets", "css", "base.css"), "utf8").split(/\/\* @labs: ([^*]*?) \*\/\n/).slice(1);
const shared = [];
for (let k = 0; k < baseParts.length; k += 2) shared.push({ labs: baseParts[k].trim() === "*" ? "*" : baseParts[k].trim().split(","), css: baseParts[k + 1].trim() });
const coreCss = shared.filter((r) => r.labs === "*").map((r) => r.css).join("\n\n");
if (coreCss) writeFileSync(join(dist, "assets", "css", "core.css"), "/* Rules used by every lab. */\n" + coreCss + "\n");

labs.forEach((lab, i) => {
  const dir = join(src, "labs", lab.slug);
  const body = readFileSync(join(dir, "body.html"), "utf8");
  const prev = labs[(i + labs.length - 1) % labs.length], next = labs[(i + 1) % labs.length];
  const related = labs.filter((l) => l.category === lab.category && l.slug !== lab.slug).concat(labs.filter((l) => l.category !== lab.category && l.slug !== lab.slug)).slice(0, 3);
  const subset = shared.filter((r) => r.labs !== "*" && r.labs.includes(lab.slug)).map((r) => r.css).join("\n\n");
  writeFileSync(join(dist, "assets", "css", "labs", `${lab.slug}.css`), `/* Generated: shared rules this lab uses (from base.css) followed by lab-specific rules (src/labs/${lab.slug}/page.css). */\n${subset}\n\n${readFileSync(join(dir, "page.css"), "utf8")}`);
  cpSync(join(dir, "page.js"), join(dist, "assets", "js", "labs", `${lab.slug}.js`));
  const header = `<a class="ml-skip" href="#main">Skip to content</a>
  <header class="ml-header">
    <div class="wrap ml-header-inner">
      <a class="ml-brand" href="../../index.html"><span class="ml-mark" aria-hidden="true">ML</span>Marketing Labs</a>
      <nav class="ml-nav" aria-label="Lab navigation">
        <a href="../../index.html">All labs</a>
        <a rel="prev" href="../${prev.slug}/index.html" title="${esc(prev.title)}">← Previous</a>
        <a rel="next" href="../${next.slug}/index.html" title="${esc(next.title)}">Next →</a>
      </nav>
    </div>
  </header>
  <div class="wrap ml-labbar">
    <div class="ml-labid"><span class="ml-mark" aria-hidden="true">${esc(lab.brandMark || "ML")}</span><div><p>${esc(cats[lab.category])}</p><strong>${esc(lab.title)}</strong></div></div>
    <div class="ml-actions" role="toolbar" aria-label="Lab tools">
      ${hasPdf(lab.slug) ? `<a class="ml-btn primary" href="../../assets/pdf/${lab.slug}.pdf" download>Download PDF guide</a>` : ""}
      <button class="ml-btn" type="button" data-action="save">Save inputs</button>
      <button class="ml-btn" type="button" data-action="load">Load inputs</button>
      <button class="ml-btn" type="button" data-action="share">Copy share link</button>
      <button class="ml-btn" type="button" data-action="print">Print</button>
      <button class="ml-btn" type="button" data-action="reset">Reset</button>
      <input id="ml-file" type="file" accept="application/json" hidden />
    </div>
  </div>`;
  const more = `<nav class="ml-more" aria-label="More labs"><div class="wrap"><h2>More Marketing Labs</h2><ul>${related.map((l) => `<li><a href="../${l.slug}/index.html"><strong>${esc(l.title)}</strong><small>${esc(cats[l.category])}</small></a></li>`).join("")}</ul></div></nav>`;
  const page = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="${esc(lab.summary)}" />
  <meta name="color-scheme" content="dark" />
  <title>${esc(lab.title)} · Marketing Labs</title>
  ${FONTS}
  <link rel="stylesheet" href="../../assets/css/tokens.css" />
${coreCss ? `<link rel="stylesheet" href="../../assets/css/core.css" />\n  ` : ""}  <link rel="stylesheet" href="../../assets/css/components.css" />
  <link rel="stylesheet" href="../../assets/css/labs/${lab.slug}.css" />
  <link rel="stylesheet" href="../../assets/css/print.css" media="print" />
</head>
<body data-lab="${lab.slug}">
  ${body.replace("<!--SITE_HEADER-->", header)}
  ${more}
  <div class="ml-toast" id="ml-toast" role="status" aria-live="polite"></div>
  <script src="../../assets/js/labs/${lab.slug}.js" defer></script>
  <script src="../../assets/js/shared.js" defer></script>
</body>
</html>
`;
  mkdirSync(join(dist, "labs", lab.slug), { recursive: true });
  writeFileSync(join(dist, "labs", lab.slug, "index.html"), page);
});

const card = (l) => `<article class="ml-card" data-cat="${l.category}" data-search="${esc((l.title + " " + l.summary + " " + cats[l.category]).toLowerCase())}">
        <header><span class="ml-mark" aria-hidden="true">${esc(l.brandMark || "ML")}</span><h3>${esc(l.title)}</h3></header>
        <p>${esc(l.summary)}</p>
        <div class="row"><a class="ml-btn primary" href="labs/${l.slug}/index.html">Open lab</a>${hasPdf(l.slug) ? `<a class="ml-btn" href="assets/pdf/${l.slug}.pdf" download>PDF guide</a>` : ""}</div>
      </article>`;
const bundle = existsSync(join(src, "assets", "pdf", "marketing-labs-complete-guide.pdf"));
const index = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="Interactive marketing, positioning, loyalty, content and impact-planning frameworks with printable PDF guides." />
  <meta name="color-scheme" content="dark" />
  <title>Marketing Labs · Interactive frameworks and PDF guides</title>
  ${FONTS}
  <link rel="stylesheet" href="assets/css/tokens.css" />
  ${coreCss ? `<link rel="stylesheet" href="assets/css/core.css" />` : ""}
  <link rel="stylesheet" href="assets/css/components.css" />
  <link rel="stylesheet" href="assets/css/index.css" />
</head>
<body>
  <a class="ml-skip" href="#main">Skip to content</a>
  <header class="ml-header"><div class="wrap ml-header-inner"><a class="ml-brand" href="index.html"><span class="ml-mark" aria-hidden="true">ML</span>Marketing Labs</a>
    <nav class="ml-nav" aria-label="Site"><a href="#labs" aria-current="page">Labs</a><a href="#resources">PDF guides</a></nav></div></header>
  <main id="main" class="wrap">
    <section class="ml-hero">
      <p class="eyebrow">Interactive frameworks</p>
      <h1>Plan with the model, not just the slide.</h1>
      <p class="lede">${labs.length} working canvases for strategy, positioning, customer loyalty, content and impact planning. Each one is a thinking tool with ethical guardrails, and each comes with a printable PDF guide.</p>
      <ul class="ml-features">
        <li><strong>Autosaves your inputs</strong>Work stays in your browser. Nothing is sent anywhere.</li>
        <li><strong>Save, load and share</strong>Export inputs as JSON, or copy a link that rebuilds your canvas.</li>
        <li><strong>Print-ready</strong>Every lab prints in a light, ink-friendly layout.</li>
        <li><strong>PDF guides</strong>A reference and blank worksheet for each framework.</li>
      </ul>
    </section>
    <div class="ml-controls" id="labs">
      <label class="ml-sr" for="q">Search labs</label>
      <input id="q" type="search" placeholder="Search labs, e.g. loyalty, SEO, stakeholders…" autocomplete="off" />
      <div class="ml-chips" role="group" aria-label="Filter by category"><button type="button" data-cat="all" aria-pressed="true">All</button>${reg.categories.map((c) => `<button type="button" data-cat="${c.id}" aria-pressed="false">${esc(c.label)}</button>`).join("")}</div>
      <p class="ml-count" id="count" aria-live="polite"></p>
    </div>
    ${reg.categories.map((c) => `<section class="ml-group" aria-labelledby="g-${c.id}"><h2 id="g-${c.id}">${esc(c.label)}</h2><div class="ml-grid">
      ${labs.filter((l) => l.category === c.id).map(card).join("\n      ")}
    </div></section>`).join("\n    ")}
    <section class="ml-resources" id="resources" aria-labelledby="res-h">
      <h2 id="res-h">Downloadable PDF guides</h2>
      <p>Each guide summarises the framework, lists the questions the lab asks, and ends with a blank worksheet you can print or fill in on screen.</p>
      <div class="row">${bundle ? `<a class="ml-btn primary" href="assets/pdf/marketing-labs-complete-guide.pdf" download>Complete guide (all labs)</a>` : ""}</div>
    </section>
    <footer class="ml-footer">Marketing Labs are planning aids, not advice. Test assumptions with evidence, and consider privacy, accessibility, fairness and sustainability before acting.</footer>
  </main>
  <script src="assets/js/index.js" defer></script>
</body>
</html>
`;
writeFileSync(join(dist, "index.html"), index);
writeFileSync(join(dist, "labs.json"), JSON.stringify({ categories: reg.categories, labs }, null, 2));
console.log(`Built ${labs.length} labs + index → ${dist}`);
