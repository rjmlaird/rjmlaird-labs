# legacy/

Labs that predate the shared framework, kept untouched so nothing is lost.
Each one is queued for migration in `MIGRATION.md`. Once a lab is ported into `apps/<slug>`, delete its copy here.

- `static-html/` single-file labs (own CSS, own palette, own canvas code)
- `vite-apps/` Lagrange Explorer and Relativity Playground (Vite + React, plain JS)
- `orbital-mechanics-astro4/` N-body sandbox (Astro 4 + Tailwind; physics lib is already clean TS)
