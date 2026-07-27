"""Satellite pass predictions, ground tracks, and brightness estimates.

Two Celestrak data sources, both free/keyless:
  1. SATCAT (`fetch_satcat`) — the full satellite catalog metadata (name,
     NORAD ID, object type, launch/decay dates, radar cross-section, etc.)
     at https://celestrak.org/pub/satcat.csv. This is what makes "search any
     satellite by name" possible instead of a fixed shortlist.
  2. GP/TLE data (`fetch_tle`) — the actual orbital elements needed to
     propagate a satellite's position, fetched per NORAD ID on demand.

Pass predictions are limited to the next 24 hours by default, and each pass
includes an estimated visual magnitude (brightness) using a standard diffuse-
sphere reflection model — an approximation, not a calibrated brightness
(real satellites vary a lot from a uniform sphere; flares/glints aren't
modelled), but it's a reasonable signal for "is this worth looking for".
"""
from __future__ import annotations

from datetime import datetime, timedelta
from functools import lru_cache

import numpy as np
import pandas as pd
import requests
from skyfield.api import EarthSatellite, wgs84

from . import engine

CELESTRAK_TLE_URL = "https://celestrak.org/NORAD/elements/gp.php"
SATCAT_URL = "https://celestrak.org/pub/satcat.csv"

WELL_KNOWN_SATELLITES = {
    "ISS": 25544,
    "TIANGONG": 48274,
    "HUBBLE": 20580,
}

# Assumed effective radius (m) when SATCAT has no RCS value for an object —
# rough, order-of-magnitude defaults used only as a magnitude-estimate fallback.
_DEFAULT_RADIUS_BY_TYPE = {
    "PAYLOAD": 1.0,
    "ROCKET BODY": 1.8,
    "DEBRIS": 0.1,
    "UNKNOWN": 0.5,
}
_DEFAULT_ALBEDO = 0.15


# ---------------------------------------------------------------------------
# SATCAT: full catalog metadata, fetch + search
# ---------------------------------------------------------------------------

@lru_cache(maxsize=1)
def fetch_satcat() -> pd.DataFrame:
    """The full Celestrak satellite catalog (tens of thousands of rows),
    cached in memory for the life of the process — re-fetching this on every
    call would be both slow and unfriendly to Celestrak's free service."""
    df = pd.read_csv(SATCAT_URL)
    return df


def search_satcat(query: str, payloads_only: bool = True, active_only: bool = True,
                   max_results: int = 25) -> pd.DataFrame:
    """Search the full catalog by (partial, case-insensitive) name."""
    df = fetch_satcat()
    if payloads_only and "OBJECT_TYPE" in df.columns:
        df = df[df["OBJECT_TYPE"] == "PAYLOAD"]
    if active_only and "DECAY_DATE" in df.columns:
        df = df[df["DECAY_DATE"].isna()]
    mask = df["OBJECT_NAME"].str.contains(query, case=False, na=False)
    return df[mask].head(max_results).copy()


def satcat_row_for(norad_id: int) -> dict | None:
    df = fetch_satcat()
    match = df[df["NORAD_CAT_ID"] == norad_id]
    if match.empty:
        return None
    return match.iloc[0].to_dict()


# ---------------------------------------------------------------------------
# TLE fetch + satellite loading
# ---------------------------------------------------------------------------

def fetch_tle(catalog_number: int) -> tuple[str, str, str]:
    params = {"CATNR": catalog_number, "FORMAT": "TLE"}
    r = requests.get(CELESTRAK_TLE_URL, params=params, timeout=20)
    r.raise_for_status()
    lines = [l for l in r.text.strip().splitlines() if l.strip()]
    if len(lines) < 3:
        raise ValueError(f"Unexpected TLE response for catalog #{catalog_number}: {r.text[:200]}")
    name, line1, line2 = lines[0].strip(), lines[1], lines[2]
    return name, line1, line2


def load_satellite(name_or_catnr: str | int = "ISS") -> EarthSatellite:
    catnr = WELL_KNOWN_SATELLITES.get(str(name_or_catnr).upper(), name_or_catnr)
    name, line1, line2 = fetch_tle(int(catnr))
    ts = engine.timescale()
    return EarthSatellite(line1, line2, name, ts)


# ---------------------------------------------------------------------------
# Brightness estimate (diffuse-sphere reflection model)
# ---------------------------------------------------------------------------

def _phase_function(beta_rad: float) -> float:
    """Normalised Lambertian (diffuse) sphere phase function, 0 (new) to 1 (full)."""
    val = (np.sin(beta_rad) + (np.pi - beta_rad) * np.cos(beta_rad)) / np.pi
    return max(val, 1e-6)


def estimate_magnitude(satellite: EarthSatellite, t, topos, eph,
                         rcs_m2: float | None = None, object_type: str | None = None,
                         albedo: float = _DEFAULT_ALBEDO) -> float | None:
    """Approximate visual magnitude at time t, or None if the satellite is in
    Earth's shadow (not illuminated, so not visible by reflected sunlight)."""
    geocentric = satellite.at(t)
    if not geocentric.is_sunlit(eph):
        return None

    sat_km = geocentric.position.km
    sun_km = (eph["sun"] - eph["earth"]).at(t).position.km
    observer_km = topos.at(t).position.km  # geocentric, matching the satellite's frame

    vec_to_sun = sun_km - sat_km
    vec_to_observer = observer_km - sat_km
    distance_m = float(np.linalg.norm(vec_to_observer)) * 1000.0
    if distance_m <= 0:
        return None

    cos_beta = np.dot(vec_to_sun, vec_to_observer) / (
        np.linalg.norm(vec_to_sun) * np.linalg.norm(vec_to_observer)
    )
    beta = np.arccos(np.clip(cos_beta, -1.0, 1.0))

    if rcs_m2 and rcs_m2 > 0 and not np.isnan(rcs_m2):
        radius_m = float(np.sqrt(rcs_m2 / np.pi))
    else:
        radius_m = _DEFAULT_RADIUS_BY_TYPE.get((object_type or "").upper(), 0.5)

    intensity = (albedo * radius_m ** 2 * _phase_function(beta)) / (2 * distance_m ** 2)
    if intensity <= 0:
        return None
    magnitude = -26.7 - 2.5 * np.log10(intensity)
    return round(float(magnitude), 1)


# ---------------------------------------------------------------------------
# Ground track / current position (for the Mercator map)
# ---------------------------------------------------------------------------

def current_subpoint(satellite: EarthSatellite, when: datetime | None = None) -> dict:
    ts = engine.timescale()
    t = ts.from_datetime(when) if when else ts.now()
    subpoint = wgs84.subpoint(satellite.at(t))
    return {
        "lat": subpoint.latitude.degrees,
        "lon": subpoint.longitude.degrees,
        "elevation_km": subpoint.elevation.km,
        "time": t.utc_datetime(),
    }


def ground_track(satellite: EarthSatellite, minutes_before: int = 45, minutes_after: int = 45,
                  step_seconds: int = 30) -> pd.DataFrame:
    """Subpoint (lat/lon) track around now, for plotting on a world map."""
    ts = engine.timescale()
    now = ts.now()
    offsets_days = np.arange(-minutes_before * 60, minutes_after * 60 + 1, step_seconds) / 86400.0
    times = ts.tt_jd(now.tt + offsets_days)
    subpoint = wgs84.subpoint(satellite.at(times))
    return pd.DataFrame({
        "time": times.utc_datetime(),
        "lat": subpoint.latitude.degrees,
        "lon": subpoint.longitude.degrees,
    })


# ---------------------------------------------------------------------------
# Visible passes (next 24 hours by default)
# ---------------------------------------------------------------------------

def find_passes(site: dict, satellite: EarthSatellite, hours: float = 24.0,
                 min_altitude_deg: float = 10.0, satcat_row: dict | None = None) -> pd.DataFrame:
    ts = engine.timescale()
    tz = engine.site_tz(site)
    topos = wgs84.latlon(float(site["lat"]), float(site["lon"]), elevation_m=float(site.get("elevation_m", 0)))

    now_local = datetime.now(tz)
    t0 = ts.from_datetime(now_local)
    t1 = ts.from_datetime(now_local + timedelta(hours=hours))

    times, events = satellite.find_events(topos, t0, t1, altitude_degrees=min_altitude_deg)

    eph = engine.ephemeris()
    observer = engine.earth() + topos
    rcs = satcat_row.get("RCS") if satcat_row else None
    object_type = satcat_row.get("OBJECT_TYPE") if satcat_row else None

    rows = []
    current = {}
    for t, event in zip(times, events):
        if event == 0:
            current = {"rise": t}
        elif event == 1:
            current["culminate"] = t
        elif event == 2:
            current["set"] = t
            if "rise" in current and "culminate" in current:
                rows.append(_summarise_pass(current, satellite, topos, observer, eph, tz, rcs, object_type))
            current = {}

    return pd.DataFrame(rows)


def _summarise_pass(pass_times: dict, satellite: EarthSatellite, topos, observer, eph, tz,
                      rcs_m2: float | None, object_type: str | None) -> dict:
    t_peak = pass_times["culminate"]

    # EarthSatellite positions are geocentric (SGP4), not part of the
    # barycentric ephemeris tree, so altaz comes from a direct topocentric
    # difference rather than observer.observe(satellite) (which is only
    # valid for bodies referenced from the Solar System Barycenter, like the
    # Sun/Moon/planets below).
    topocentric = (satellite - topos).at(t_peak)
    alt, az, distance = topocentric.altaz()

    sun_alt, _, _ = observer.at(t_peak).observe(eph["sun"]).apparent().altaz()
    magnitude = estimate_magnitude(satellite, t_peak, topos, eph, rcs_m2=rcs_m2, object_type=object_type)
    visible = magnitude is not None and sun_alt.degrees < -6.0  # civil twilight or darker

    return {
        "rise_local": pass_times["rise"].utc_datetime().astimezone(tz),
        "culminate_local": t_peak.utc_datetime().astimezone(tz),
        "set_local": pass_times["set"].utc_datetime().astimezone(tz),
        "max_altitude_deg": round(alt.degrees, 1),
        "azimuth_at_peak_deg": round(az.degrees, 1),
        "range_km": round(distance.km, 0),
        "estimated_magnitude": magnitude,
        "naked_eye_visible": visible,
    }
