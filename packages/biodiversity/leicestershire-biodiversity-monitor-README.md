# Leicestershire Biodiversity &amp; Habitat Health Monitor

A reusable lab tool combining **satellite vegetation health**, **live
designated-habitat boundaries**, and **live river/water data** — defaults to
Leicester &amp; Leicestershire, but works anywhere in England (Wales/Scotland/NI
are not covered by the layers used here — see caveats below). Open
`index.html` in a browser, no setup, no API keys.

## What's in it

**Vegetation health (NDVI)** — Copernicus Global Land Service, served free
by VITO with no key: `globalland.vito.be/wmts`, layer
`clms_global_ndvi_1km_v2_10daily`. 1 km resolution, 10-daily composites —
coarse, but enough to see landscape-scale greenness across a county the size
of Leicestershire. Darker green = denser/healthier vegetation. Opacity is
adjustable so you can compare it against the basemap or the habitat layers
underneath.

*Caveat worth passing to students*: Copernicus has iterated this product
line (v1 → v2 → v3, 1km and 300m variants), and the newer, higher-resolution
NDVI products have moved toward the Copernicus Data Space Ecosystem, which
needs a free account. The 1km v2 layer used here is the version confirmed
still served on the open, no-key VITO endpoint at the time of building —
worth checking [land.copernicus.eu/global](https://land.copernicus.eu/global/)
for whether a newer no-key layer exists before relying on this for
current research.

**Designated habitats** — click "Load habitat layers for this view" to pull
live boundaries for whatever's in view, from Natural England/Defra's open
geospatial services (Open Government Licence, no key):
- National Nature Reserves — confirmed live feed
- Local Nature Reserves — confirmed live feed
- Ancient Woodland Inventory — confirmed live feed
- Sites of Special Scientific Interest (SSSI) — **best-effort**: I found
  Natural England's SSSI data is definitely served the same way, but
  couldn't confirm the exact service name before building this. If the SSSI
  chip fails silently (a toast will say so), the polygon layer isn't
  reachable at that URL and needs updating — see "Fixing a broken layer"
  below.

Click any shaded polygon for a popup with whatever attribute fields Natural
England publishes for that site (name, designation date, area, etc. — this
varies by layer).

**River &amp; water health** — two live Environment Agency sources, combined:
- **River level** (`environment.data.gov.uk/flood-monitoring`) — same
  "compared to typical range" approach as the UK Drought Monitor tool
- **Water Quality Archive / WIMS** (`environment.data.gov.uk/water-quality`)
  — nearby sampling points with their most recent determinand readings
  (nitrate, phosphate, dissolved oxygen, ammonia, etc. — whatever's been
  sampled there recently). **This one is also best-effort** — the Water
  Quality Archive API's exact endpoint shape wasn't independently verified
  during a live test before shipping this tool, only documented as existing.
  If it errors, the panel says so and links straight to the archive's own
  browse page rather than pretending to have live numbers.

Leicestershire's main watercourses (River Soar, River Wreake, River Welland,
River Sence) are covered by EA's network, so station search should return
useful results across most of the county.

## Honesty notes (please keep these in mind before presenting results)

This tool follows the same principle as the earlier drought and wildfire
tools in this series: a labelled gap or an honest "couldn't confirm" beats a
confident-looking number that isn't real.

- The **SSSI layer** and the **Water Quality Archive integration** are
  flagged above as best-effort. Everything else (NDVI, NNR, LNR, Ancient
  Woodland, river level) is a confirmed, tested live endpoint.
- NDVI is a **regional greenness signal**, not a biodiversity score — dense
  vegetation isn't automatically "healthy" (a dense stand of an invasive
  species reads the same as ancient woodland). Pair it with the habitat
  layers and use it to prompt discussion, not as a standalone verdict.
- Designated-site boundaries (NNR/LNR/SSSI/Ancient Woodland) mark
  legal/planning status, not real-time ecological condition. Natural England
  publishes separate SSSI *condition* assessments (favourable/unfavourable)
  as a different, non-spatial dataset not wired into this tool.

## Fixing a broken layer

Each layer in `HABITAT_LAYERS` near the top of the script is just a `{key,
name, color, url, nameField}` object — if a URL stops working (or you find
the correct SSSI endpoint), edit the `url` field directly. To find the right
one yourself: search the dataset name on
[environment.data.gov.uk](https://environment.data.gov.uk/) → its dataset
page lists an "ESRI REST Feature Service API" link — that FeatureServer URL
plus `/0/query?...&f=geojson` is the pattern used throughout this tool.

## Attribution

- NDVI: Copernicus Global Land Service, VITO
- Habitat designations: © Natural England / Defra, Open Government Licence
- River &amp; water quality: Environment Agency, Open Government Licence v3.0
- Basemap: © CARTO, © OpenStreetMap contributors
