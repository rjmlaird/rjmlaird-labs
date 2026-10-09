# Migration plan

## What the audit found

| Finding | Where | Action |
|---|---|---|
| Byte-identical duplicate | `electricity.html` = `electricity-lab.html` | Dropped one (`legacy/static-html/electricity-lab.html`) |
| Build output committed | `cfd/dist/index.html` = `cfd/index.html` | Not carried over; `dist` is gitignored |
| Stale template at repo root | root `wrangler.jsonc` name `marketing`, `vite.config.ts` comment says `exp-example`, page title says "N-Body Orbital Sandbox" | Replaced by `templates/lab` |
| Broken/dead code in mechanics | `EnergyChart.tsx` imports a non-existent `../lib/physics`; `hooks/useMechanicsSimulation.ts` and `components/ramp/*` are never imported | Deleted in `apps/mechanics` |
| Same helpers copied 3+ times | `clamp`, `formatValue`, `vec2`, DPR canvas sizing (every standalone HTML) | `@labs/sim-core` |
| 4 unrelated palettes, 3 font stacks | navy/teal, forest/copper, paper/orange, slate/amber | 4 themes on one token vocabulary |
| Mixed stacks | Astro 5 (mechanics), Astro 4 + Tailwind (orbital), Vite (cfd, lagrange, relativity), raw HTML | Target: Astro 5 + React islands |
| Two `<h1>`s per mechanics page | shell header + hero | Shell header is now a link, page keeps one `<h1>` |
| Hard-coded nav list | `ExperimentNav.astro` with a `current` string union | Generated from `registry` |
| `.DS_Store`, `.astro/`, `.wrangler/`, `__MACOSX` in the zip | everywhere | `.gitignore` |

`fluid-flow.html` looks like an earlier version of `cfd/index.html` (same title, same palette, 481 vs 969 lines). Kept as `fluid-flow-v0.html`; delete it once you've confirmed.

## Done in this scaffold

- Shared packages, hub, template and generator (all typechecked; hub, mechanics and a generated lab build cleanly)
- Mechanics fully moved onto the shared packages. Its CSS shrank to zero: all styling now comes from `@labs/ui/styles.css` + tokens
- `mech-panel` / `mech-lab-grid` / `mech-dashboard` classes renamed to `lab-*`

## Order for the rest (cheapest wins first)

| # | Lab | Effort | How |
|---|---|---|---|
| 1 | `fluid-flow` / `cfd` | S | Port to `templates/lab`, theme `paper`. Particle loop becomes `useSimulation`, canvas becomes `useCanvas2D`. Delete v0. |
| 2 | `orbital-mechanics` | S | `lib/*.ts` is already clean TS: move `vectors.ts` into sim-core (drop the copy), keep `physics/simulation/presets/units`. Replace Tailwind classes with `ui` components and drop Tailwind and Astro 4. |
| 3 | `electricity` | M | 6 canvases (Ohm, IV, network, power, Coulomb, RC). Each becomes one component, with physics split out of the draw code. Theme `forest`. |
| 4 | `magnetic-fields`, `rocket-types` | M | Same shape as electricity. Share one `Tabs` component (add to `@labs/ui` when the second lab needs it). Theme `slate`. |
| 5 | `lagrange-explorer`, `relativity-playground` | M | Already React. Convert JSX to TSX, replace their Header/Footer/Controls CSS with `ui`, move `public/data/*.json` into the app. |

Until a lab is ported it can still ship: serve its HTML from the app's `public/` and keep `kind: "static-html"` in the registry so the hub lists it.

## Per-lab porting checklist

1. `pnpm new:lab <slug> "<Title>" <theme> <topic>`
2. Move physics into `src/lib/<name>/{physics,types,presets}.ts`. No DOM access.
3. Wire `useSimulation({ init, step })`; add `useSimHotkeys`.
4. Replace canvas boilerplate with `useCanvas2D`.
5. Replace hand-rolled controls with `Panel`, `SliderField`, `PresetPicker`, `SimControls`, `ReadoutList`.
6. Fill `summary`, `level`, `experiments` in `labs.ts`.
7. Delete the legacy copy.

## Assumptions to confirm

- Electricity Lab mapping: copper = accent, gold = accent-2. I didn't read its CSS in depth, so check the contrast.
- Subdomain convention `<slug>.labs.rjmlaird.co.uk` applies to every lab except where `url` overrides it.
- `mechanics` previously had no `wrangler.jsonc` in the zip; add one from `templates/lab/` if it's deployed through Workers.
