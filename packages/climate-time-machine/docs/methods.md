# Methods

## Reference period
Anomalies and the dryness index use 1961–1990. Bias adjustment uses 1991–2020, the current 30-year climate normal.

## Observed series
`buildObservations` joins temperature and rainfall by year. Growing-season rainfall is the sum of April to September monthly totals, and is null if any month is missing.

## Model processing
1. Daily model output is aggregated to annual mean temperature, summer (Jun–Aug) mean temperature, annual rainfall and April–September rainfall. Years with missing days are dropped.
2. Rainfall totals are scaled to a 365.25-day year so models with 360-day calendars compare fairly.
3. Frost days are days with minimum temperature below 0 °C, scaled to a 365.25-day year. Winter rainfall is December to February, labelled by the year of its January (1991 is dropped from model baselines because December 1990 isn't requested). Summer is June to August.
4. **Delta-change adjustment** per model: temperature = observed 1991–2020 mean + (model value − model 1991–2020 mean); rainfall (annual, seasonal) = observed 1991–2020 mean × (model value ÷ model 1991–2020 mean). Temperatures and frost days use the difference; frost days are floored at zero. This keeps the regional observed climate and uses the model only for change.
5. Only years after the last observed year are kept as projections.

## Dryness index
`dry = −(AprSepRain − mean₁₉₆₁₋₁₉₉₀) / sd₁₉₆₁₋₁₉₉₀`. Positive means drier than the reference. It has no evaporation term, so it understates drying in warmer years.

## Narrative sentences
Computed in `src/lib/narrative.js`: anomalies, ranks, and the share of model-years in a ±5-year window that exceed a threshold (summer 2022, or the 90th percentile of 1991–2020 annual temperature). Because the window pools model-years, the shares describe the ensemble, not a probability forecast.

## Uncertainty
The shaded band is the min–max across models and years. It mixes model disagreement with year-to-year variability and is not a confidence interval. All models share one emissions pathway, so scenario uncertainty is not shown.
