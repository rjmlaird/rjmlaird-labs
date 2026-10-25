# Local Climate Time Machine

Drag a slider through 140+ years of measured UK weather and a model-based view of the next 25, for a chosen region, with plain-English notes on what changed.

The slider track is the region's own **warming stripes**: one bar per year, coloured by how far that year sits from the 1961–1990 average. Years beyond the last measurement are hatched.

## Quick start

```bash
npm install
npm run dev          # first run downloads the data automatically
```

`npm run fetch-data` re-downloads everything. `npm test` checks the parser and bias-adjustment logic. `npm run build` makes a static site in `dist/` that can be hosted under any path.

## Real data sources

| What | Source | Licence |
|---|---|---|
| Observed temperature (mean, max, min), rainfall (annual, winter, summer) and days of air frost (from 1961) | Met Office UK regional series, derived from HadUK-Grid | Open Government Licence v3.0 |
| Projections to 2050 | 7 CMIP6 HighResMIP models via the Open-Meteo Climate API | CC BY 4.0 (check their terms if your use is commercial) |

Nothing is bundled or hand-typed: `scripts/fetch-data.mjs` downloads both sources and writes `public/data/*.json`.

## What the app shows

- **Time slider** over the stripes, with play/pause and clickable markers for notable UK events.
- **Four charts**: temperature (mean, summer, daytime highs, night-time lows), rainfall (annual, winter, summer), air frost days, and growing-season dryness, with each year, a 10-year average, the model mean and the model range.
- **Annotation panel** whose sentences are computed from the data (rank, anomaly, how often a 2022-style summer occurs in the models), plus short curated notes on well-documented UK events.

## Honest limitations

- **Frost days** are measured only from 1961, and model frost counts are biased, so only their change is used.
- **Region, not county.** The Midlands series is the closest published match to Leicestershire.
- **One emissions pathway.** The HighResMIP models are run under SSP5-8.5, so there is no low/medium selector yet.
- **Projections stop at 2050.**
- **Dryness is simplified**: standardised April–September rainfall, not SPEI.
- Models are sampled at one point per region and bias-adjusted by delta change. See `docs/methods.md`.

## Roadmap

1. Multi-scenario projections (low/medium/high) from UKCP18 via CEDA, which needs a free account.
2. Finer geographies using HadUK-Grid area averages.
3. Seasonal views and region comparison.
4. Proper SPEI with an evaporation estimate.

## Structure

```
scripts/        fetch-data.mjs + lib/ (Met Office parser, model processing)
test/           parser and adjustment tests
src/lib/        data lookups, narrative sentences, curated events
src/components/ StripeSlider, ClimateChart, AnnotationPanel, Method
docs/           data-sources.md, methods.md
```
