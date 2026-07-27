"""Track a target's altitude through a night and find the best observing
window, built on Skyfield (fixed RA/Dec targets, Sun, and Moon all via the
same engine as the rest of the app)."""
from __future__ import annotations

from datetime import date

import numpy as np
import pandas as pd
from skyfield.api import Star

from . import engine


def target_star(target: dict) -> Star:
    if str(target.get("kind", "")).lower() == "moon":
        raise ValueError(
            "The Moon moves too fast for a fixed RA/Dec track — use the sun_moon "
            "module (or the 'sunmoon' CLI command / Sun & Moon tab) for Moon events instead."
        )
    return Star(ra_hours=float(target["ra_deg"]) / 15.0, dec_degrees=float(target["dec_deg"]))


def night_track(site: dict, target: dict, target_date: date | None = None,
                 step_minutes: int = 10) -> pd.DataFrame:
    """Altitude of target/Sun/Moon, and target-Moon separation, across a local
    24h window centred on local noon of target_date (so the full night is
    covered without splitting across a sunrise/sunset boundary)."""
    d = target_date or date.today()
    tz = engine.site_tz(site)
    ts = engine.timescale()
    t0, t1 = engine.local_midnight_range(site, d, hours=24.0)

    n_steps = int(24 * 60 / step_minutes) + 1
    times = ts.linspace(t0, t1, n_steps)
    times_local = [t.utc_datetime().astimezone(tz) for t in times]

    observer = engine.observer(site)
    star = target_star(target)
    eph = engine.ephemeris()

    target_alt, _, _ = observer.at(times).observe(star).apparent().altaz()
    sun_alt, _, _ = observer.at(times).observe(eph["sun"]).apparent().altaz()
    moon_astrometric = observer.at(times).observe(eph["moon"]).apparent()
    moon_alt, _, _ = moon_astrometric.altaz()
    moon_sep = moon_astrometric.separation_from(observer.at(times).observe(star).apparent())

    target_alt_deg = target_alt.degrees
    sun_alt_deg = sun_alt.degrees
    moon_alt_deg = moon_alt.degrees

    df = pd.DataFrame({
        "time_local": times_local,
        "target_alt_deg": target_alt_deg,
        "target_airmass": engine.airmass_from_altitude(target_alt_deg),
        "sun_alt_deg": sun_alt_deg,
        "moon_alt_deg": moon_alt_deg,
        "moon_separation_deg": moon_sep.degrees,
        "is_astro_dark": sun_alt_deg <= -18.0,
    })
    return df


def best_window(df: pd.DataFrame, min_target_alt: float = 30.0) -> dict:
    """Find the observing window: astronomically dark AND target above min_target_alt."""
    mask = (df["is_astro_dark"]) & (df["target_alt_deg"] >= min_target_alt)
    if not mask.any():
        return {"start": None, "end": None, "max_alt": float(df["target_alt_deg"].max()), "duration_hours": 0.0}

    idx = np.where(mask.to_numpy())[0]
    start = df.iloc[idx[0]]["time_local"]
    end = df.iloc[idx[-1]]["time_local"]
    duration_hours = (end - start).total_seconds() / 3600.0
    max_alt = float(df.loc[mask, "target_alt_deg"].max())
    return {"start": start, "end": end, "max_alt": round(max_alt, 1), "duration_hours": round(duration_hours, 2)}
