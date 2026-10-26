# labs.rjmlaird.co.uk — MVP (Earthquake physics explorer)

## Plan and architecture
**Astro + vanilla TypeScript** (recommended over Next.js): static-first, ships near-zero JavaScript except one script on the lab page, cheap to host, and matches the Astro stack already used in `rjmlaird-labs`. Next.js would add a React runtime for what are essentially SVG widgets.

```
src/
  lib/sim-core.ts        pure physics (tested)  → can move to packages/sim-core in the monorepo
  data/                  site.ts, labs.ts (registry), earthquakes.ts (config + copy)
  layouts/               Base.astro (SEO), LabLayout.astro (reusable lab template)
  components/            ModuleDocs.astro (method/equations/assumptions/limitations/try this)
  pages/                 /, /labs, /labs/earthquakes, /about, /contact, /privacy, 404, sitemap.xml
  scripts/earthquakes.ts client interactivity for the lab only
  styles/global.css      tokens, focus states, reduced motion
public/                  robots.txt, favicon.svg (add og.png, 1200×630)
tests/unit, tests/a11y   Vitest unit tests; built-HTML accessibility smoke test
```

## Setup
```bash
npm install
npm run dev          # http://localhost:4321
npm test             # unit tests (P–S distance, magnitude, tsunami)
npm run check        # Astro/TypeScript check
npm run build        # outputs dist/
npm run test:a11y    # builds, then smoke-tests dist/ HTML
npm run format       # Prettier
```
No environment variables are needed.

## Deploy (Cloudflare Pages, Vercel or Netlify)
Build command `npm run build`, output directory `dist`, Node 20+. Point `labs.rjmlaird.co.uk` at the project (CNAME). The `site` URL in `astro.config.mjs` and `src/data/site.ts` drive canonical URLs and the sitemap.

**Checklist:** add `public/og.png` · confirm contact email in `src/data/site.ts` · `npm test && npm run test:a11y` · keyboard-only run through all four modules · test at 320 px · check with reduced motion on · verify `/sitemap.xml`, `/robots.txt` and the 404 page · run a screen-reader pass (VoiceOver/NVDA) and a Lighthouse accessibility audit.

## Add a new lab
1. Add an entry to `src/data/labs.ts` and the route to `site.routes` in `src/data/site.ts`.
2. Put pure calculations in `src/lib/` with tests in `tests/unit/`.
3. Create `src/pages/labs/<slug>.astro` using `LabLayout` (title block, disclaimer, further-reading slot) and `ModuleDocs`.
4. Keep copy and presets in `src/data/<slug>.ts`; put interactivity in `src/scripts/<slug>.ts`.

## Accessibility checklist (manual, beyond the smoke test)
Semantic landmarks and one `h1` per page; tabs follow the ARIA tab pattern (arrow keys, Home/End); stations are keyboard-movable; animations have a pause button and respect `prefers-reduced-motion`; wave types and circles are distinguished by label and line style, not colour alone; live regions announce results.

## Post-MVP roadmap
1. Real historical case studies and more scenarios (including S-wave shadow zone).
2. Fault-type and rupture-direction visualisations.
3. Shake-intensity and local-site-effect explainer.
4. CSV/data export.
5. Embeddable widget builds.
6. Optional privacy-respecting analytics (update `/privacy` first).
7. Git-based lab workflow (PR template, lab checklist).
8. Community feedback and contribution workflow.
