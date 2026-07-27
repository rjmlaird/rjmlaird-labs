# Astro Mission Control

An interactive Streamlit "mission control" dashboard for planning astronomy
observations by **site**, **target**, and **equipment** — a true multipage
web app (every page has its own URL), built on a shared **Skyfield**
astronomy engine. No CLI, no local scripts to run by hand — this repo is set
up to deploy straight to the web.

## What it does

- **Observation plan** — one view that combines everything below into a
  single recommendation with a plain-English verdict.
- **Night sky view** — a live dome chart of the sky above your horizon,
  with **15-minute/1-hour step controls** to scrub through time, **stars
  sized by real magnitude**, labelled altitude rings every 20°, and a sky
  background that shifts through night → twilight → natural daytime blue as
  the Sun's altitude changes. Optional **constellation line overlay with
  name labels** (86 IAU constellations, Sky & Telescope figure data).
- **Detailed weather** — cloud cover (total + low/mid/high layers), temp,
  dew point, humidity, wind + gusts, precipitation probability, visibility,
  and a weather-icon strip, all from live data.
- **Seeing** — a target-specific "effective seeing" score: the weather-based
  proxy degraded by **airmass** (worse seeing low on the horizon than at the
  zenith), plus a **dew-risk** indicator from the temperature/dew-point
  spread. Kept on its own page, separate from general weather.
- **Sun & Moon** — sunrise/sunset, moonrise/moonset, and moon phase for any
  site, any number of days ahead, found with Skyfield's `almanac` module.
- **Target visibility** — tracks a target's altitude through the night and
  finds the best observing window (astronomically dark + above a minimum
  altitude), factoring in Moon separation.
- **Telescope field of view** — resolves magnification, exit pupil, and true
  field of view for a scope + eyepiece against a target's angular size, across
  every eyepiece you own.
- **Aurora outlook** — two data sources: NOAA's global **OVATION** probability
  grid at your exact coordinates (with a world + polar visibility map), and a
  **UK-specific geomagnetic activity index** from AuroraWatch UK (Lancaster
  University) — the same hourly nT bar chart / alert-level system they use,
  built from live UK magnetometer data.
- **Satellite passes (beta)** — search **any active payload in Celestrak's
  full catalog** (not just a fixed shortlist), passes in the **next 24
  hours** with an **estimated visual magnitude** (diffuse-sphere reflection
  model) and a magnitude filter, plus a **Mercator ground-track map** showing
  current position.
- **Light pollution (beta)** — an estimated **Bortle scale** for any site,
  from an offline population-based model (Walker's Law), since there's no
  free API for the real satellite-measured maps.
- **Eclipse planner** — lunar and solar eclipses for your site: contact
  times (P1/U1/U2/greatest/U3/U4/P4 for lunar; C1-C4 for solar), umbral and
  penumbral magnitude, an eclipse diagram showing the Moon's path through
  Earth's shadow (or the Sun/Moon disks at maximum for a solar eclipse), and
  a local visibility verdict (is the target even above the horizon).

## Why Skyfield

The whole astronomy engine (`astrodash/engine.py`) sits on
[Skyfield](https://rhodesmill.org/skyfield/) with a bundled **DE421** JPL
ephemeris (`data/de421.bsp`), so:
- Sun/Moon/planet positions and rise/set/twilight are accurate and computed
  the same way everywhere in the app.
- It works without an ephemeris download at runtime — the ~17MB kernel ships
  in the repo, which keeps cold-start deploys fast and reliable.
- It's a natural base to grow into eclipses/conjunctions/oppositions — see
  "Where to go next" below.

The star field for the night-sky view comes from a **pre-trimmed Hipparcos
subset** (`data/bright_stars.csv`, mag ≤ 6.5, ~9,000 stars, ~250KB) instead of
shipping/parsing the full ~53MB raw catalog.

## Project layout

```
astrodash/            Core library (no UI code)
  engine.py              Skyfield timescale/ephemeris/star-catalog, loaded once
  config.py              Load/lookup sites, equipment, targets from config/*.json
  weather.py              Open-Meteo API client (hourly + current conditions)
  weather_icons.py        WMO code -> description/emoji + hand-drawn glyph icons
  seeing.py               Weather seeing proxy + airmass-adjusted per-target seeing + Moon sky-brightness
  sun_moon.py             Sunrise/sunset/moonrise/moonset/phase (Skyfield almanac)
  visibility.py           Target altitude/airmass tracking + best-window finder
  skyview.py              Live all-sky dome chart: magnitude-scaled stars, twilight/daylight sky colour
  constellations.py       Constellation stick-figure lines + names (Sky & Telescope figure data)
  telescope.py            FOV/magnification/exit-pupil calculations
  aurora.py               NOAA OVATION grid + AuroraWatch UK activity index + Kp (beta)
  satellites.py           Full SATCAT search + TLE + pass prediction + magnitude estimate + ground track (beta)
  light_pollution.py      Offline Bortle-scale estimate from a population model (beta)
  eclipses.py             Lunar eclipse contact times (Skyfield eclipselib + shadow geometry) + local solar eclipse search
  planner.py              Combines everything into one recommendation
  plotting.py             Shared matplotlib chart builders
data/                  Bundled DE421 ephemeris, trimmed bright-star catalog, constellation data
config/                Example site/equipment/target definitions (edit these!)
dashboard/
  app.py                 Home page — quick summary + links to every page (Streamlit entry point)
  _shared.py             Sidebar controls + theme, shared by every page via session_state
  pages/                 One file per page — Streamlit auto-builds the sidebar nav from this folder
    1_Plan.py
    2_Night_Sky.py
    3_Weather.py
    4_Seeing.py
    5_Visibility.py
    6_Sun_Moon.py
    7_Telescope_FOV.py
    8_Aurora.py
    9_Satellites.py
    10_Light_Pollution.py
    11_Eclipses.py
.streamlit/config.toml  Dark theme + server settings
Dockerfile             Container build for self-hosting
Procfile               For Heroku-style platforms (Railway, Render, etc.)
runtime.txt            Python version pin
requirements.txt       Python dependencies
```

## Running it locally

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
streamlit run dashboard/app.py
```

Add your own observing sites, telescopes/eyepieces, and targets to the JSON
files in `config/` — they follow the same shape as the bundled examples.

This is a proper **multipage app** — each page in the sidebar nav is a
wholly separate script under `dashboard/pages/`, not a tab, so each has its
own URL and can be bookmarked/shared directly. Your site/equipment/target/date
selections persist as you move between pages (kept in `st.session_state`).

## Deploying online

### Streamlit Community Cloud (easiest, free)

1. Push this repo to GitHub.
2. Go to [share.streamlit.io](https://share.streamlit.io), sign in, and click
   "New app".
3. Point it at your repo, branch, and set the main file path to
   `dashboard/app.py`.
4. Deploy. `requirements.txt` and `.streamlit/config.toml` are picked up
   automatically.

### Docker (self-host anywhere)

```bash
docker build -t astro-mission-control .
docker run -p 8501:8501 astro-mission-control
```

Then open `http://localhost:8501`. This same image works on any container
platform (Fly.io, Render, Railway, Google Cloud Run, AWS ECS, etc.).

### Heroku-style platforms (Railway, Render, Heroku)

The included `Procfile` and `runtime.txt` are picked up automatically by
these platforms' buildpacks — just connect the repo and deploy, no extra
configuration needed.

### Notes for any deployment target

- The app is stateless and needs no database — `st.session_state` handles
  per-session selections, and nothing is written to disk at runtime.
- The bundled ephemeris (`data/de421.bsp`, ~17MB) means cold starts don't
  depend on an external download.
- Live features (Weather, Seeing, Aurora, Satellites, Light Pollution) call
  free, keyless public APIs (Open-Meteo, NOAA SWPC, AuroraWatch UK,
  Celestrak) — no secrets or API keys to configure. If your host restricts
  outbound network access, only the offline-capable pages (Night Sky,
  Visibility, Sun & Moon, Telescope FOV, Eclipses) will work.

## Notes on the data sources

Constellation line/name data (`data/constellationship.fab`,
`constellation_names.eng.fab`, `star_names.fab`) comes from the
`skaven81/western_SnT` Stellarium sky-culture project, generated from public
Sky & Telescope figure data — 86 of the 88 IAU constellations are covered.

The seeing-proxy formula and Moon sky-brightness model, the telescope FOV
maths, and the weather-icon glyphs were all built from scratch for this app
(no third-party scraping) — see the module docstrings in `astrodash/` for the
physics behind each one.

## Where to go next

A few natural extensions:

- **Eclipse path maps** — the eclipse planner reports local circumstances for
  one site at a time (contact times, magnitude, visibility); it doesn't yet
  plot the umbra/penumbra footprint moving across the globe (the classic
  "path of totality" map) — that needs full Besselian elements, a bigger
  undertaking than the local-circumstances geometry used here.
- **Hybrid eclipse detection** — solar eclipses that are annular along part
  of their path and total along another (hybrid eclipses) are classified
  here purely from the local site's perspective (whichever it actually is
  from there), which is correct for planning but doesn't label the event as
  "globally hybrid".
- **Satellite watchlist** — save a shortlist of favourite NORAD IDs instead of
  searching by name every time.
- **Aurora time series** — OVATION is a now/next-90-minutes snapshot; layering
  in the 3-day Kp forecast (`noaa-planetary-k-index-forecast.json`, already
  a one-line addition next to `fetch_kp_forecast`) would give a "worth
  planning around tonight vs. tomorrow" view instead of just "right now".
- **Light pollution accuracy** — the Bortle estimate is an offline heuristic
  (Walker's Law over city population/distance); swapping in real VIIRS tile
  data (e.g. a cropped region of David Lorenz's World Atlas) where available
  would make it a measurement rather than an estimate.
- **Satellite ground-track basemap** — the Mercator view currently draws
  lat/lon gridlines only (no bundled coastline data); adding a lightweight
  world outline (e.g. a simplified Natural Earth shapefile) would make it
  read like a real map at a glance.
- **User accounts / saved sites** — currently `config/*.json` is shared and
  edited by hand; a hosted multi-user version would want per-user site lists,
  probably backed by a small database instead of flat JSON files.

## Dependencies

skyfield, numpy, pandas, matplotlib, requests, pillow, geonamescache,
streamlit — see `requirements.txt`. No API keys required (Open-Meteo,
Celestrak, NOAA SWPC, and AuroraWatch UK are all free/keyless); `geonamescache`
bundles its city data, so the light-pollution page works fully offline.
