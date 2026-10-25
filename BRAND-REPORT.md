# rjmlaird-labs: brand audit and engine roadmap

## Result
Before: 0/23 apps on shared brand, 628 off-brand hex colours, 142 findings.
After this patch: 8/23 apps migrated, 541 hex, 107 findings. `pnpm audit:ci` blocks regressions while the rest migrate.
Not visually verified (no browser here). `drought` builds and bundles the self-hosted fonts.

## Critical findings
1. CI is dead: deploy.yml, new-experiment.mjs and README target `packages/`; apps live in `apps/`. Fixed deploy.yml. STILL BROKEN: new-experiment.mjs, assign-dev-ports.js (looks for wrangler.toml), README.
2. labs-index has only wrangler.toml, so CI never deploys it; its comments name old domains.
3. 20 near-identical stub workers; the 11 that return "X Worker is running" shadow `/api/*`.
4. Nine apps are single-file index.html; the React scaffold beside them was dead code (removed). `maths`, `exp-example`, `equations` still carry template text.
5. Drift: 5+ palettes, 9 font families, Google Fonts in 13 apps, `blueprint` package named "electricity", n-body blocks pinch-zoom, sewage muted text 3.4:1.
6. Committed dist/.astro/.DS_Store, 11 package-lock.json beside pnpm, 3 compatibility dates, leaflet/turf from CDN without SRI.
7. components sandbox (meant to be the shared UI source) uses its own indigo/Public Sans palette.

## Done
- packages/brand: DTCG tokens -> CSS (dark + opt-in light), contrast gate (all pairs >= 4.5:1), self-hosted fonts, base/shell CSS, static bundle, viz and status tokens.
- Migrated: drought, sewage, biodiversity, electricity, elements, blueprint, cfd, rubiks.
- scripts/brand-audit.mjs, scripts/lib, scripts/migrations.

## Not done (next, in order)
1. Fix new-experiment/assign-dev-ports/README; move exp-example to templates/.
2. Astro apps: mechanics, graphs, contrast, climate-visualiser, n-body, astronomy (+14 demos via static bundle), satellites, wildfires; then climate-time-machine, equations, components, marketing, labs-index.
3. Decide marketing's orange/pink (brand viz palette has 8 hues).

## Shared engines to build
- worker-kit: one `createLabWorker({proxies, csp})` replacing 20 copies; security headers, /api/health, cached allow-listed proxy.
- sim-core: vec2/3, units+constants (G appears as 4pi^2, 1, 6.674e-20 and "AU = 2pi"), velocity-Verlet/RK4 with energy-drift tests, fixed-timestep loop, reduced-motion hook, formatters (fmt x5, clamp x3 today).
- orbital-core: Kepler, elements<->state, ground track; shared by satellites, n-body, astronomy demos.
- data-core: fetch+cache+CSV (papaparse) with provenance (source, licence, retrieved-at) feeding DatasetMetadata.
- viz: pick one chart lib (Plotly, ApexCharts, Recharts, p5 today) and one map lib (MapLibre vs Leaflet); ChartFrame with table fallback.
- lab manifest: one lab.json per app generating labs.ts, sitemap, routes check (derive `tech`/`updated`).
- test-kit: axe + contrast smoke on every built app in CI (only components has tests).
- ui: promote components sandbox, rebased on brand tokens; dedupe 3 Buttons, 2 Cards, 2 Callouts.
