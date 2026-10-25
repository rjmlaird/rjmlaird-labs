# UK Drought Risk Monitor

A reusable lab tool for teaching UK drought risk — combines **live Copernicus
drought indicators** with **live Environment Agency hydrology data**. No API
keys, no setup: open `index.html` in a browser.

## What's live in this tool

**Copernicus European & Global Drought Observatories (EDO/GDO)** — run by the
Joint Research Centre, part of the Copernicus Emergency Management Service:
- **Combined Drought Indicator (CDI)** — the headline Watch/Warning/Alert
  agricultural drought classification
- **SPI (short & long term)** — Standardised Precipitation Index, ERA5-based,
  with a switchable accumulation period (SPI-1/3/6/12/24/48)
- **Soil moisture anomaly**, **Low-flow index**, **Risk of Drought Impact
  (agriculture)**

These are fetched directly from the live public WMS
(`drought.emergency.copernicus.eu/api/wms`) — the same service behind the
official EDO map viewer. SPI, SPI-long-term and Drought Impact Risk are
**queryable**: click anywhere on the map and the tool sends a live
GetFeatureInfo request and shows the value at that point.

**Environment Agency (England) & SEPA (Scotland) real-time hydrology** — click
"Find UK stations near map centre" (or search an English town) and the tool
queries, live and in parallel:
- `environment.data.gov.uk/flood-monitoring` (England) — river level stations
  compared against each station's own published *typical range* (95th/5th
  percentile band), plus rainfall gauges with a live-computed 24-hour total
- `timeseries.sepa.org.uk/KiWIS` (Scotland) — SEPA's Time Series Data Service,
  river level stations compared against each station's published *median
  annual maximum/minimum level* (the closest published equivalent to EA's
  typical range)

Both are free, open, no API key required.

**Wales (Natural Resources Wales) and Northern Ireland (DfI Rivers)** — these
are *not* wired in as live feeds, for two different honest reasons:
- NRW's River Levels API requires a free personal subscription key
  (sign up at [api-portal.naturalresources.wales](https://api-portal.naturalresources.wales/))
  — the tool doesn't embed a shared key, since that's tied to an individual
  account. The endpoint pattern is
  `https://api.naturalresources.wales/rivers-and-seas/v1/api/StationData/historical?location={id}&parameter={id}`
  (header `Ocp-Apim-Subscription-Key`) if you want to extend the tool with
  your own key — you'd also need to resolve station IDs first, which isn't
  confirmed as a no-key operation.
- DfI Rivers (Northern Ireland) doesn't publish a public API at all — only a
  web viewer.

Instead, the results panel always includes direct links to NRW's and DfI's
official live viewers, clearly labelled, so nothing is silently missing.

## What's NOT live — reservoir stocks

There is no open, live UK reservoir-stock API. The Environment Agency
publishes reservoir levels once a month, as part of the
[Water Situation national report](https://www.gov.uk/government/publications/water-situation-national-monthly-reports-for-england-2026)
(PDF/CSV). The "Reservoir stocks" panel is a manual entry table for exactly
this reason — type in each region's % figure from the latest report and the
bars update. It's a deliberate design choice: better an honest manual field
than a fabricated live number.

## Using it in a session

1. Pick a drought indicator from the chips above the map.
2. Use "Jump to latest indicator date" (omits the date parameter — per
   Copernicus's own documentation this returns whichever date is most
   recently available) or step back/forward in 10-day increments to look at
   how conditions evolved.
3. For SPI layers, switch the accumulation period (SPI-1 vs SPI-12 tells very
   different stories — short-term dryness vs multi-year reservoir/groundwater
   deficit) — a good discussion point in itself.
4. Click the map on a queryable layer for the point value.
5. Search a town or pan the map and pull live EA station data to ground-truth
   the satellite/model-based indicators against actual river and rainfall
   readings.
6. Enter the latest monthly reservoir figures for a fuller regional picture.

## Attribution (built in, but worth knowing)

- Drought indicators: © European Commission / Joint Research Centre,
  Copernicus European & Global Drought Observatories
- Hydrology data: Environment Agency, Open Government Licence v3.0
- Basemap: © CARTO, © OpenStreetMap contributors

## Extending it

The `LAYERS` array near the top of the script is the whole indicator
catalogue — add another EDO WMS layer name from the
[capabilities document](https://drought.emergency.copernicus.eu/api/wms?REQUEST=GetCapabilities&SERVICE=WMS&VERSION=1.1.1)
and it appears as a new toggle automatically. Station search radius, default
map view, and the reservoir region list are all plain variables near the
top of their respective sections.
