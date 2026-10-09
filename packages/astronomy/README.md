# Astronomy Labs

Astro static site for `astronomy.labs.rjmlaird.co.uk`.

## Structure
- `public/demos/<slug>/index.html` – each self-contained demo, untouched
- `src/content/labs/<slug>.md` – metadata (title, summary, category, tags, order, status) + short write-up
- `src/data/categories.ts` – category list (add a category here)
- `src/pages/` – home, `/labs/<slug>/` (shell + iframe), `/c/<category>/`, sitemap
- URLs are flat (`/labs/<slug>/`), so recategorising never breaks links.

## Commands
- `npm run dev` / `npm run build` / `npm run preview`
- `npm run new-lab -- my-slug "My Title" optics` – scaffold a new lab

## Deploy (Cloudflare Pages)
Build command `npm run build`, output directory `dist`, custom domain `astronomy.labs.rjmlaird.co.uk`.

## Planned labs
Two-body orbit, active vs adaptive optics, EO mission planner, satellite link budget, comet/asteroid explorer, rocket launch physics. Set `status: planned` to hide until ready.
