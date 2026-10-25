# Wildfire Story Lab

A satellite before-and-after storytelling site for wildfire recovery — an
[RJML Labs](https://labs.rjmlaird.co.uk) experiment by [Ryan Laird](https://rjmlaird.co.uk).

Each case study pairs a before and after Cloud-Optimised GeoTIFF (COG), served through
[TiTiler](https://developmentseed.org/titiler/), in a synced MapLibre compare slider with a
burn-severity legend and exact-pixel-value tooltips.

## Stack

- [Astro](https://astro.build) (static output) + [React](https://react.dev) islands
- [MapLibre GL](https://maplibre.org) with [`@maplibre/maplibre-gl-compare`](https://github.com/maplibre/maplibre-gl-compare) for the synced swipe view
- [TiTiler](https://developmentseed.org/titiler/) for on-the-fly COG tiling, statistics, and point queries
- Case data as Zod-validated Astro content collections (`src/content/cases/*.json`)

## Getting started

```bash
npm install
npm run dev
```

Set `PUBLIC_TITILER_URL` in a `.env` file to point at a running TiTiler instance —
without it, the map and legend will show a setup notice instead of imagery.

```
PUBLIC_TITILER_URL=https://your-titiler-instance.example.com
```

## Adding a case

Add a new JSON file to `src/content/cases/` following the schema in `src/content.config.ts`:
title, region, dates, sensor, burn metric, before/after COG URLs and bounds, raster CRS, and
optional TiTiler rendering parameters (colormap, color formula, rescale, band index).

## Scripts

- `npm run dev` — local dev server
- `npm run build` — static build to `dist/`
- `npm run preview` — preview the production build
