"""Skyfield-based astronomy engine.

This is the single source of astronomical truth for the whole dashboard —
sun/moon events, target visibility, and the sky-view chart all sit on top of
this module. Using Skyfield (with a bundled DE421 kernel) instead of mixing
astropy/ephem gives accurate positions, robust rise/set/twilight finding via
`skyfield.almanac`, and works fully offline once the kernel is loaded.
"""
from __future__ import annotations

from datetime import date, datetime, timedelta
from functools import lru_cache
from pathlib import Path
from zoneinfo import ZoneInfo

import pandas as pd
from skyfield.api import Star, load, wgs84
from skyfield.timelib import Time as SkyfieldTime

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DE421_PATH = DATA_DIR / "de421.bsp"
BRIGHT_STARS_PATH = DATA_DIR / "bright_stars.csv"

# Bodies we care about, keyed by the friendly names used throughout the app.
BODY_NAMES = {
    "sun": "sun",
    "moon": "moon",
    "mercury": "mercury",
    "venus": "venus",
    "mars": "mars",
    "jupiter": "jupiter barycenter",
    "saturn": "saturn barycenter",
    "uranus": "uranus barycenter",
    "neptune": "neptune barycenter",
}


@lru_cache(maxsize=1)
def timescale():
    return load.timescale()


@lru_cache(maxsize=1)
def ephemeris():
    if not DE421_PATH.exists():
        raise FileNotFoundError(
            f"Missing {DE421_PATH} — the DE421 kernel should ship in data/de421.bsp."
        )
    return load(str(DE421_PATH))


def body(name: str):
    """Look up a Skyfield body (planet/sun/moon) by friendly name."""
    eph = ephemeris()
    key = BODY_NAMES.get(name.lower())
    if key is None:
        raise KeyError(f"Unknown body '{name}'. Known: {', '.join(BODY_NAMES)}")
    return eph[key]


def earth():
    return ephemeris()["earth"]


def observer(site: dict):
    """A Skyfield topocentric observer (earth + wgs84 position) for a site dict."""
    topos = wgs84.latlon(
        float(site["lat"]),
        float(site["lon"]),
        elevation_m=float(site.get("elevation_m", 0)),
    )
    return earth() + topos


def site_tz(site: dict) -> ZoneInfo:
    return ZoneInfo(site.get("timezone", "UTC"))


def to_skyfield_time(dt: datetime):
    ts = timescale()
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=ZoneInfo("UTC"))
    return ts.from_datetime(dt)


def local_midnight_range(site: dict, target_date: date, hours: float = 24.0):
    """A Skyfield Time pair spanning local noon -> local noon + hours, so the
    range comfortably covers one full local night."""
    tz = site_tz(site)
    start_local = datetime(target_date.year, target_date.month, target_date.day, 12, 0, tzinfo=tz)
    end_local = start_local + timedelta(hours=hours)
    ts = timescale()
    return ts.from_datetime(start_local), ts.from_datetime(end_local)


def local_day_range(site: dict, target_date: date):
    """A Skyfield Time pair spanning local midnight -> next local midnight,
    i.e. the calendar day `target_date` — used for that day's sunrise/sunset."""
    tz = site_tz(site)
    start_local = datetime(target_date.year, target_date.month, target_date.day, 0, 0, tzinfo=tz)
    end_local = start_local + timedelta(days=1)
    ts = timescale()
    return ts.from_datetime(start_local), ts.from_datetime(end_local)


def altaz(observer_body, target, t) -> tuple:
    """Return (altitude_deg, azimuth_deg, distance_au) of target as seen from observer_body at time t."""
    astrometric = observer_body.at(t).observe(target).apparent()
    alt, az, distance = astrometric.altaz()
    return alt.degrees, az.degrees, distance.au


def airmass_from_altitude(alt_deg):
    import numpy as np
    alt_deg = np.asarray(alt_deg, dtype=float)
    z = 90.0 - alt_deg
    with __import__("warnings").catch_warnings():
        __import__("warnings").simplefilter("ignore")
        am = 1.0 / (np.cos(np.deg2rad(z)) + 0.50572 * (96.07995 - z) ** (-1.6364))
    am = np.where(alt_deg > 0, am, np.nan)
    return am


@lru_cache(maxsize=1)
def bright_star_catalog() -> pd.DataFrame:
    """A compact (mag <= 7.5) subset of the Hipparcos catalog, pre-extracted
    with Skyfield's hipparcos loader so the dashboard doesn't need to parse
    the full ~53MB raw catalog (or hit the network) on every run."""
    if not BRIGHT_STARS_PATH.exists():
        raise FileNotFoundError(f"Missing {BRIGHT_STARS_PATH}.")
    return pd.read_csv(BRIGHT_STARS_PATH)


def star_objects(df: pd.DataFrame) -> Star:
    """Vectorised Skyfield Star object for a whole star-catalog DataFrame at once."""
    return Star(ra_hours=df["ra_degrees"].to_numpy() / 15.0, dec_degrees=df["dec_degrees"].to_numpy())
