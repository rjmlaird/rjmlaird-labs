# Marketing Labs

Nineteen interactive marketing, positioning, customer, content and impact-planning canvases, consolidated into one static site with shared design tokens, shared chrome, per-lab PDF guides and a searchable index page.

Open `dist/index.html` in a browser, or run `npm run serve` and visit http://localhost:8080. No framework and no runtime dependencies.

## Labs

| Category | Labs |
| --- | --- |
| Strategy & growth | Ansoff matrix, BCG growth-share matrix, Porter's Five Forces, Lean Analytics stages |
| Positioning & marketing mix | STP model, brand positioning map, 7Ps marketing mix |
| Customers & loyalty | Customer lifetime value, loyalty ladder, lifecycle and loyalty (RACE), Hook model |
| Content & communications | AIDA, STEPPS, science-to-story translator, SEO brief-to-page |
| Impact & research | Theory of change, impact pathway canvas, evidence strength ladder, stakeholder constellation |

## What the consolidation adds

- **Index page** with search and category filters (`dist/index.html`).
- **Shared shell on every lab**: skip link, sticky header, previous/next navigation, related labs, and a toolbar.
- **Autosave** of all form inputs in the browser (localStorage, per lab). Nothing leaves the device.
- **Save/load inputs as JSON**, **copy a share link** that rebuilds the canvas from the URL hash, **reset to the starting example**.
- **Print / Save as PDF** layout: light, ink-friendly, no controls.
- **PDF guides** per lab (reference notes, guidance by option, blank worksheet) and a complete guide of all labs.
- **Shared design tokens** (`tokens.css`) and shared chrome (`components.css`) instead of 19 copies of the same CSS.
- Reduced-motion support and consistent focus styles.

## Structure

```
src/
  labs.json                 registry: slug, title, category, summary, mark, order
  labs/<slug>/              body.html (lab markup), page.css (lab-only rules), page.js (lab logic)
  assets/css/               tokens.css, base.css (shared rules, annotated), components.css, print.css, index.css
  assets/js/                shared.js (autosave, export, share, print), index.js (search/filter)
  assets/pdf/               generated PDF guides
scripts/
  build.mjs                 assembles dist/ (no dependencies)
  check.mjs                 link and shell checks
  make_pdfs.py              generates the PDFs with headless Chromium (Playwright)
dist/                       built site, ready to host anywhere static
```

`base.css` holds rules that appeared identically in five or more of the original labs. Each rule is annotated with `/* @labs: ... */`, and the build composes only the rules a lab originally used into `dist/assets/css/labs/<slug>.css`. This keeps one source of truth without letting one lab's styles leak into another.

## Commands

```
npm run build    # src → dist
npm test         # build + link/shell checks
npm run serve    # build and serve on :8080
npm run pdfs     # rebuild PDFs (needs: pip install playwright && playwright install chromium)
```

## Adding a lab

1. Create `src/labs/<slug>/` with `body.html` (start it with `<!--SITE_HEADER-->`, then `<main>…</main>`), `page.css` and `page.js`.
2. Add an entry to `src/labs.json` (category must exist in `categories`).
3. Reference tokens from `tokens.css` (`var(--teal)`, `var(--text-lo)`, …) rather than hard-coding colours.
4. Give form controls `id`s so autosave, share links and the PDF worksheet pick them up. Use `data-no-persist` on anything that shouldn't be saved.
5. `npm run pdfs`, then `npm test`.

## Notes on the migration

- **Stakeholder constellation:** `stakeholder-constellation.html` was cut off mid-script and `research-impact-mapper.html` is the complete version of the same tool, so the complete file is used. If research-impact-mapper was meant to be a different tool, add it as a new lab.
- **BCG matrix:** `bcg-growth-share-matrix.html` ended mid-markup with no script. The missing detail panel, summary cards, guidance, footer and all logic were written to match the existing CSS. Relative share is plotted high-to-low left-to-right, as in the classic BCG layout, and the axis label says so. Review the wording and demo portfolios.
- **Design tokens** that had drifted by a shade between labs (for example `--text-lo`, `--shadow`, `--radius`) were harmonised to the most common value.
- PDF guides are generated from each lab's own text, so they inherit its wording. Skim them before publishing.
- Fonts load from Google Fonts. Self-host them if you need offline or privacy-strict use.
