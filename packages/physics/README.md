# rjmlaird-labs

One monorepo for every lab at `*.labs.rjmlaird.co.uk`.

```
packages/
  tokens/     design tokens, 4 themes (navy, forest, paper, slate), reset, font URLs
  ui/         React components + Astro layout/nav/card + shared stylesheet
  sim-core/   useSimulation (fixed-step loop), useCanvas2D, hotkeys, vec2, math, constants
  registry/   labs.ts — the single manifest every lab is listed in
apps/
  hub/        labs.rjmlaird.co.uk index, generated from the registry
  mechanics/  reference migration (Ramp, Newton's Cradle, Projectile, Stopping Distances)
templates/lab/  what `pnpm new:lab` copies
legacy/         labs not yet migrated (see MIGRATION.md)
```

## Daily use

```bash
pnpm install
pnpm dev                                   # hub
pnpm --filter @labs/mechanics dev          # one lab
pnpm new:lab magnetism "Magnetic Fields" slate magnetism
pnpm typecheck && pnpm build               # whole repo
```

## Rules that keep it scalable

1. **A lab is registered once**, in `packages/registry/src/labs.ts`. Theme, fonts, nav, hub card and subdomain all derive from it.
2. **Colours come from tokens only.** No hex in lab CSS. A new look is a new `[data-theme]` block in `tokens.css`.
3. **Physics is pure TypeScript** in `src/lib/<experiment>/` (state in, state out, no React/DOM). That is what you unit test.
4. **Rendering uses shared pieces**: `useSimulation` for the loop, `useCanvas2D` for DPR/resize, `Panel`/`LabGrid` for layout.
5. **If two labs need it, it moves to a package.** If only one does, it stays in the app.
