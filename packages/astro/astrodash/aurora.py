"""Aurora (Northern/Southern Lights) visibility outlook.

Two data sources, both free/keyless from NOAA SWPC:

1. OVATION Aurora (`fetch_ovation`) — a 360x181 grid of aurora probability
   (%) at every 1-degree lon/lat point, refreshed every ~5 minutes with a
   30-90 minute forecast lead time. This is the real visibility map: given a
   site, we look up the probability at (and around) its coordinates.
2. Planetary Kp index (`fetch_kp_forecast`) — a single global activity
   number, refreshed every 3 hours. Useful as a simple secondary signal and
   for a quick sanity check, but it says nothing about *your* location the
   way the OVATION grid does.

`current_aurora_outlook` combines the OVATION probability at your site with
whether it's actually dark there right now (aurora isn't visible in daylight).
"""
from __future__ import annotations

from datetime import date

import numpy as np
import requests

from . import engine

OVATION_URL = "https://services.swpc.noaa.gov/json/ovation_aurora_latest.json"
KP_FORECAST_URL = "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json"

LATS = list(range(-90, 91))   # 181 values, matches the OVATION grid
LONS = list(range(0, 360))    # 360 values, matches the OVATION grid


# ---------------------------------------------------------------------------
# OVATION grid: fetch, index, and query
# ---------------------------------------------------------------------------

def fetch_ovation() -> dict:
    """Raw OVATION Aurora JSON: Observation Time, Forecast Time, and a flat
    list of [lon, lat, probability_pct] covering the whole globe."""
    r = requests.get(OVATION_URL, timeout=20)
    r.raise_for_status()
    return r.json()


def _grid_lookup(data: dict) -> dict[tuple[int, int], int]:
    """Flat [lon, lat, value] list -> {(lon, lat): value} dict. Built as a
    dict rather than a fixed reshape so it's robust to whatever order NOAA
    happens to serialise the grid in."""
    lookup = {}
    for lon, lat, val in data["coordinates"]:
        lookup[(int(lon) % 360, int(lat))] = val
    return lookup


def grid_matrix(data: dict) -> np.ndarray:
    """The full grid as a (181, 360) array, rows=latitude (-90..90),
    cols=longitude (0..359) — handy for plotting a visibility map."""
    lookup = _grid_lookup(data)
    matrix = np.zeros((len(LATS), len(LONS)))
    for i, lat in enumerate(LATS):
        for j, lon in enumerate(LONS):
            matrix[i, j] = lookup.get((lon, lat), 0)
    return matrix


def probability_at(site: dict, data: dict | None = None) -> dict:
    """OVATION aurora probability (%) at a site's coordinates, with a small
    neighbourhood search if the exact rounded point is missing."""
    data = data or fetch_ovation()
    lookup = _grid_lookup(data)

    lon = int(round(float(site["lon"]))) % 360
    lat = max(-90, min(90, int(round(float(site["lat"])))))

    prob = lookup.get((lon, lat))
    if prob is None:
        for radius in (1, 2, 3):
            candidates = [
                lookup.get(((lon + dlon) % 360, max(-90, min(90, lat + dlat))))
                for dlon in range(-radius, radius + 1)
                for dlat in range(-radius, radius + 1)
            ]
            candidates = [c for c in candidates if c is not None]
            if candidates:
                prob = max(candidates)
                break
    prob = prob or 0

    return {
        "probability_pct": prob,
        "observation_time": data.get("Observation Time"),
        "forecast_time": data.get("Forecast Time"),
    }


def describe_probability(prob_pct: float) -> str:
    if prob_pct >= 40:
        return "Good chance — active aurora is likely visible on the horizon if skies are clear."
    if prob_pct >= 15:
        return "Fair chance — worth watching the horizon after dark; binoculars/camera may pick up more than the eye."
    if prob_pct >= 5:
        return "Slim chance — only under a very dark, clear sky, low on the horizon."
    return "No meaningful aurora activity expected here right now."


def current_aurora_outlook(site: dict) -> dict:
    """OVATION probability at the site, combined with whether it's currently
    dark there (aurora isn't visible in daylight or bright twilight)."""
    result = probability_at(site)

    ts = engine.timescale()
    t = ts.now()
    sun_alt, _, _ = engine.observer(site).at(t).observe(engine.body("sun")).apparent().altaz()
    is_dark = sun_alt.degrees < -6.0  # civil twilight or darker

    prob = result["probability_pct"]
    if not is_dark:
        verdict = "It's currently too light to see aurora here, regardless of activity — check back after dark."
    else:
        verdict = describe_probability(prob)

    result["is_dark_now"] = is_dark
    result["sun_altitude_deg"] = round(sun_alt.degrees, 1)
    result["verdict"] = verdict
    return result


# ---------------------------------------------------------------------------
# Planetary Kp index: simple secondary signal (3-hourly, not location-aware)
# ---------------------------------------------------------------------------

def fetch_kp_forecast() -> list[dict]:
    """List of {time_tag, Kp, a_running, station_count} records — this
    endpoint is already plain JSON objects, unlike some other SWPC products
    that use a [header_row, *data_rows] array format."""
    r = requests.get(KP_FORECAST_URL, timeout=20)
    r.raise_for_status()
    return r.json()


def latest_kp() -> dict:
    readings = fetch_kp_forecast()
    latest = readings[-1]
    return {"kp": float(latest["Kp"]), "time_tag": latest.get("time_tag")}


# ---------------------------------------------------------------------------
# AuroraWatch UK: hourly geomagnetic activity index (UK-specific, magnetometer-based)
# ---------------------------------------------------------------------------
# AuroraWatch UK (Lancaster University) runs UK magnetometers and publishes an
# hourly "activity index" in nanotesla (nT), updated every few minutes for the
# current hour. It's derived from how far the H/E magnetic field components
# stray from a quiet-day baseline. Unlike the global Kp index, this is
# calibrated specifically for estimating UK aurora visibility.

AURORAWATCH_STATUS_URL = "https://aurorawatch-api.lancs.ac.uk/0.2.5/status/current-status.xml"
AURORAWATCH_ACTIVITY_URL = "https://aurorawatch-api.lancs.ac.uk/0.2.5/status/alerting-site-activity.xml"

# AuroraWatch UK's own general guidance for each alert level (paraphrased).
UK_STATUS_GUIDANCE = {
    "green": "No significant geomagnetic activity — aurora is unlikely to be visible anywhere in the UK.",
    "yellow": "Minor geomagnetic activity — a camera on a tripod might catch something from Scotland on a dark, clear night, but it's unlikely to be visible to the naked eye.",
    "amber": "Geomagnetic activity is elevated — aurora may become visible to the naked eye from Scotland, Northern Ireland, and northern England if skies are dark and clear.",
    "red": "Significant geomagnetic activity — aurora may be visible to the naked eye across much of the UK, including central and possibly southern England, if skies are dark and clear.",
}


def fetch_uk_current_status() -> dict:
    """Overall AuroraWatch UK alert level right now (green/yellow/amber/red)."""
    import xml.etree.ElementTree as ET

    r = requests.get(AURORAWATCH_STATUS_URL, timeout=20)
    r.raise_for_status()
    root = ET.fromstring(r.text)
    updated = root.findtext("./updated/datetime")
    site_status = root.find("./site_status")
    status_id = site_status.get("status_id") if site_status is not None else "unknown"
    return {"status_id": status_id, "updated": updated, "guidance": UK_STATUS_GUIDANCE.get(status_id, "")}


def fetch_uk_activity() -> dict:
    """Hourly UK geomagnetic activity index (nT): the bar-chart data behind
    AuroraWatch UK's plot, with the same alert thresholds they use."""
    import xml.etree.ElementTree as ET

    r = requests.get(AURORAWATCH_ACTIVITY_URL, timeout=20)
    r.raise_for_status()
    root = ET.fromstring(r.text)

    thresholds = {el.get("status_id"): float(el.text) for el in root.findall("./lower_threshold")}
    updated = root.findtext("./updated/datetime")

    bars = []
    for el in root.findall("./activity"):
        bars.append({
            "datetime": el.findtext("./datetime"),
            "value_nt": float(el.findtext("./value")),
            "status_id": el.get("status_id"),
        })

    return {
        "project_id": root.get("project_id"),
        "site_id": root.get("site_id"),
        "updated": updated,
        "thresholds": thresholds,
        "bars": bars,
    }


def uk_chart_scale(bars: list[dict], thresholds: dict) -> tuple[float, str]:
    """The y-axis scales to just past the next alert level up from whatever's
    currently showing — same behaviour as the AuroraWatch UK plot: shows
    yellow's ceiling if everything's green, amber's if any bar is yellow, etc."""
    max_status = "green"
    order = ["green", "yellow", "amber", "red"]
    for bar in bars:
        if order.index(bar["status_id"]) > order.index(max_status):
            max_status = bar["status_id"]

    next_idx = min(order.index(max_status) + 1, len(order) - 1)
    next_level = order[next_idx]
    ceiling = thresholds.get(order[min(next_idx + 1, len(order) - 1)], thresholds[next_level] * 1.5)
    return ceiling, next_level


def uk_aurora_outlook(site: dict) -> dict:
    """Combined UK-specific outlook: AuroraWatch status + whether it's dark
    at the site right now. Most useful for UK sites; still returns a result
    for any site, but the guidance text is UK-specific."""
    status = fetch_uk_current_status()

    ts = engine.timescale()
    t = ts.now()
    sun_alt, _, _ = engine.observer(site).at(t).observe(engine.body("sun")).apparent().altaz()
    is_dark = sun_alt.degrees < -6.0

    status["is_dark_now"] = is_dark
    status["sun_altitude_deg"] = round(sun_alt.degrees, 1)
    if not is_dark:
        status["verdict"] = "It's currently too light to see aurora here, regardless of activity — check back after dark."
    else:
        status["verdict"] = status["guidance"]
    return status
