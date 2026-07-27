# EMS Impact Viewer

A reusable lab tool for showcasing Copernicus Emergency Management Service (EMS)
activation data — built around your EMSR897 (Tintwistle Moor) case study, but
designed to work with any future wildfire (or other hazard) activation.

## What's in this folder

| File | Purpose |
|---|---|
| `index.html` | The tool itself. Open it in a browser — no server needed. |
| `ems-sample-emsr897.js` | Pre-processed EMSR897/AOI01 reference data, used by the "Load EMSR897 demo" button. Must stay in the same folder as `index.html`. |
| `prepare_ems_layers.py` | Converter script for turning a *new* EMS activation download into lightweight layers the viewer can use. |

## Using it

1. Open `index.html` in a browser (double-click it, or host the folder).
2. Click **Load EMSR897 demo** to see the Tintwistle Moor case study straight away, or
3. Click **Load activation data…** (or drag files onto the drop zone) to load your own
   EMS layers. Filenames following the standard EMS naming convention
   (`*_areaOfInterestA_*`, `*_builtUpA_*`, `*_facilitiesA/L_*`, `*_naturalLandUseA_*`,
   `*_transportationL_*`) are detected automatically; anything else is assigned manually.
4. Set the **Before/After** dates in the header and click **Update imagery** — the map
   swipes between two dated NASA satellite passes so students can see the ground
   condition either side of the event.
5. Toggle layers on/off with the chips above the map (land cover, buildings, facilities,
   transport, fire perimeter).

## About the "measurable impact" numbers

The **Extent** and **Land cover** panels come straight from the EMS *reference* layers
(land use, buildings, facilities, roads) inside the AOI — always available, since
that's what you uploaded.

The **Measurable impact** panel (burnt area, % of AOI, buildings/roads affected) only
switches on once a **fire-perimeter / delineation polygon** is loaded. That's a
deliberate design choice worth explaining to students:

> **Your EMSR897_AOI01_BLP.zip file is the reference/baseline product** — it maps what
> was already there (buildings, land cover, roads) before the fire. It does **not**
> contain the burnt-area polygon itself. That comes from a separate EMS product,
> usually labelled **Delineation** or **Grading** on the activation's download page
> (`https://mapping.emergency.copernicus.eu/activations/EMSR897/download/`). Once you
> download that layer, just drag its GeoJSON straight onto the viewer — no conversion
> needed — and the impact panel will populate automatically (burnt km²/ha, % of AOI,
> exposed buildings and facilities, affected road length).

This split is actually a nice teaching point in itself: EMS activations separate
*what existed* (reference/baseline products) from *what happened* (delineation/grading
products), and real impact assessment means combining the two.

## Preparing a new activation for the demo library

Raw EMS reference layers can run to tens of thousands of features at full coordinate
precision — too heavy to drop straight into a browser. `prepare_ems_layers.py` handles
the conversion:

```bash
pip install shapely pyproj
python3 prepare_ems_layers.py \
    --raw-dir path/to/unzipped_json_files \
    --prefix EMSR###_AOI##_XXX_PRODUCT \
    --out-dir out \
    --bundle --bundle-path ems-sample-<code>.js
```

This reprojects everything into a local metre-based CRS to get accurate km²/km figures
regardless of latitude, simplifies geometry for display, reduces buildings/facilities
to centroid points (counts stay exact, file size doesn't), and writes a `stats.json`
plus an optional `window.EMS_SAMPLE_DATA`-style JS bundle you can wire up as another
demo button in `index.html`.

## Basemap imagery

Before/after imagery comes from NASA's GIBS service (VIIRS/MODIS true-colour daily
mosaics), which is free and requires no API key, so the tool works out of the box in
any lab session without credentials to manage. Resolution (~250 m) suits
landscape-scale events like moorland or forest fires; it won't resolve individual
buildings — pair it with the vector building/facility layers for that level of detail.
