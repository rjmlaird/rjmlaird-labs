"""Sun and Moon events (rise/set/transit/phase) for a site, built on Skyfield's
almanac module — robust rise/set finding and accurate moon-phase angles,
using the bundled DE421 kernel."""
from __future__ import annotations

from datetime import date, timedelta

import pandas as pd
from skyfield import almanac
from skyfield.api import wgs84

from . import engine


def _topos(site: dict):
    return wgs84.latlon(float(site["lat"]), float(site["lon"]), elevation_m=float(site.get("elevation_m", 0)))


def moon_illumination_pct(t) -> float:
    """Illuminated fraction of the Moon's disk (0-100%) at Skyfield time t."""
    eph = engine.ephemeris()
    phase_angle = almanac.moon_phase(eph, t).degrees
    import math
    return float((1 - math.cos(math.radians(phase_angle))) / 2.0 * 100.0)


def _first_event(times, events, wanted: int):
    for t, e in zip(times, events):
        if e == wanted:
            return t.utc_datetime()
    return None


def solar_lunar_events(site: dict, target_date: date) -> dict:
    eph = engine.ephemeris()
    topos = _topos(site)
    t0, t1 = engine.local_day_range(site, target_date)

    sun_f = almanac.sunrise_sunset(eph, topos)
    sun_times, sun_events = almanac.find_discrete(t0, t1, sun_f)
    sunrise = _first_event(sun_times, sun_events, 1)
    sunset = _first_event(sun_times, sun_events, 0)

    moon_f = almanac.risings_and_settings(eph, eph["moon"], topos)
    moon_times, moon_events = almanac.find_discrete(t0, t1, moon_f)
    moonrise = _first_event(moon_times, moon_events, 1)
    moonset = _first_event(moon_times, moon_events, 0)

    # Sample the moon's altitude across the day to find its daily peak, and
    # take the midday illumination as the headline phase percentage.
    ts = engine.timescale()
    tz = engine.site_tz(site)
    from datetime import datetime
    samples = ts.from_datetimes([
        (datetime(target_date.year, target_date.month, target_date.day, tzinfo=tz) + timedelta(minutes=i * 10))
        for i in range(0, 24 * 6 + 1)
    ])
    observer = engine.earth() + topos
    alt, _, _ = observer.at(samples).observe(eph["moon"]).apparent().altaz()
    alt_deg = alt.degrees
    max_idx = int(alt_deg.argmax())

    illum = moon_illumination_pct(samples[len(samples) // 2])

    return {
        "date": target_date.isoformat(),
        "sunrise": sunrise,
        "sunset": sunset,
        "moonrise": moonrise,
        "moonset": moonset,
        "moon_max_altitude_deg": round(float(alt_deg[max_idx]), 2),
        "moon_max_altitude_time": samples[max_idx].utc_datetime(),
        "moon_phase_percent": round(illum, 1),
    }


def fmt_local(dt, tz) -> str:
    if dt is None:
        return "—"
    return dt.astimezone(tz).strftime("%Y-%m-%d %H:%M %Z")


def build_days_table(site: dict, start_date: date | None = None, days: int = 7) -> pd.DataFrame:
    tz = engine.site_tz(site)
    start = start_date or date.today()
    rows = []
    for i in range(days):
        d = start + timedelta(days=i)
        ev = solar_lunar_events(site, d)
        rows.append({
            "date": ev["date"],
            "sunrise_local": fmt_local(ev["sunrise"], tz),
            "sunset_local": fmt_local(ev["sunset"], tz),
            "moonrise_local": fmt_local(ev["moonrise"], tz),
            "moonset_local": fmt_local(ev["moonset"], tz),
            "moon_phase_percent": ev["moon_phase_percent"],
            "moon_max_altitude_deg": ev["moon_max_altitude_deg"],
            "moon_max_altitude_time_local": fmt_local(ev["moon_max_altitude_time"], tz),
        })
    return pd.DataFrame(rows)
