"""Eclipse planner: lunar and solar eclipses, with local circumstances for a
given site — contact times, umbra/penumbra geometry, and visibility.

Lunar eclipses are detected with Skyfield's `eclipselib` (adapted from the
Explanatory Supplement to the Astronomical Almanac) — that part is
authoritative library code. This module adds contact-time search (P1, U1,
U2, greatest eclipse, U3, U4, P4) by replicating Skyfield's own shadow-radius
geometry at a series of times and finding where the Moon crosses each
threshold, plus per-site visibility (is the Moon even above the horizon).

Solar eclipses are inherently local — whether you see one, and whether it's
partial/annular/total, depends entirely on where you're standing. There's no
built-in Skyfield finder for this, so this module searches every new moon in
the requested window and, for each one, checks the real topocentric
Sun-Moon separation and angular sizes *as seen from the given site*
(topocentric positions correctly include parallax, which is exactly why
solar eclipse visibility varies by location while lunar eclipses don't).
"""
from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

import numpy as np
from skyfield import eclipselib
from skyfield.constants import ERAD

from . import engine

SOLAR_RADIUS_KM = 696340.0
MOON_RADIUS_KM = 1737.1

LUNAR_ECLIPSE_TYPES = ["Penumbral", "Partial", "Total"]


# ---------------------------------------------------------------------------
# Lunar eclipses
# ---------------------------------------------------------------------------

def _lunar_geometry(t, eph):
    """Replicates Skyfield's own lunar-eclipse geometry (Danjon shadow
    enlargement) at an arbitrary set of times, so contact times can be found
    by sampling around the moment of greatest eclipse that eclipselib gives us."""
    earth, sun, moon = eph["earth"], eph["sun"], eph["moon"]

    earth_to_sun = (sun - earth).at(t).position.km
    moon_to_earth = (earth - moon).at(t).position.km

    def norm(v):
        return np.sqrt((v ** 2).sum(axis=0))

    def angle_between(a, b):
        a_n = a / norm(a)
        b_n = b / norm(b)
        dot = (a_n * b_n).sum(axis=0)
        return np.arccos(np.clip(dot, -1.0, 1.0))

    pi_m = (ERAD / 1e3) / norm(moon_to_earth)
    pi_s = (ERAD / 1e3) / norm(earth_to_sun)
    s_s = SOLAR_RADIUS_KM / norm(earth_to_sun)

    closest_approach = angle_between(earth_to_sun, moon_to_earth)
    moon_radius = np.arcsin(MOON_RADIUS_KM / norm(moon_to_earth))

    pi_1 = 1.01 * pi_m
    penumbra_radius = pi_1 + pi_s + s_s
    umbra_radius = pi_1 + pi_s - s_s

    return closest_approach, moon_radius, penumbra_radius, umbra_radius


def _find_crossing(ts, times, values, threshold, rising: bool):
    """Linear-interpolated time where `values` crosses `threshold`, searching
    for a falling (entering shadow) or rising (leaving shadow) edge."""
    for i in range(len(values) - 1):
        v0, v1 = values[i] - threshold, values[i + 1] - threshold
        crossed = (v0 >= 0 > v1) if rising is False else (v0 <= 0 < v1)
        if crossed:
            frac = -v0 / (v1 - v0) if (v1 - v0) != 0 else 0.0
            t0, t1 = times[i].tt, times[i + 1].tt
            return ts.tt_jd(t0 + frac * (t1 - t0))
    return None


def lunar_eclipse_contacts(t_greatest, eph) -> dict:
    """P1/U1/U2/U3/U4/P4 contact times around a moment of greatest lunar
    eclipse, found by sampling Skyfield's own shadow geometry every 2 minutes
    across a 6-hour window centred on greatest eclipse."""
    ts = engine.timescale()
    window_minutes = np.arange(-180, 181, 2)
    times = ts.tt_jd(t_greatest.tt + window_minutes / 1440.0)

    closest_approach, moon_radius, penumbra_radius, umbra_radius = _lunar_geometry(times, eph)

    p_threshold = penumbra_radius + moon_radius
    u_threshold = umbra_radius + moon_radius
    total_threshold = umbra_radius - moon_radius

    contacts = {
        "P1": _find_crossing(ts, times, closest_approach, np.median(p_threshold), rising=False),
        "U1": _find_crossing(ts, times, closest_approach, np.median(u_threshold), rising=False),
        "U2": _find_crossing(ts, times, closest_approach, np.median(total_threshold), rising=False),
        "U3": _find_crossing(ts, times, closest_approach, np.median(total_threshold), rising=True),
        "U4": _find_crossing(ts, times, closest_approach, np.median(u_threshold), rising=True),
        "P4": _find_crossing(ts, times, closest_approach, np.median(p_threshold), rising=True),
    }
    return contacts


def find_lunar_eclipses(start: date, end: date) -> list[dict]:
    eph = engine.ephemeris()
    ts = engine.timescale()
    t0 = ts.from_datetime(datetime(start.year, start.month, start.day, tzinfo=timezone.utc))
    t1 = ts.from_datetime(datetime(end.year, end.month, end.day, tzinfo=timezone.utc))

    t, codes, details = eclipselib.lunar_eclipses(t0, t1, eph)

    events = []
    for i in range(len(t)):
        contacts = lunar_eclipse_contacts(t[i], eph)
        events.append({
            "type": LUNAR_ECLIPSE_TYPES[codes[i]],
            "greatest_eclipse": t[i].utc_datetime(),
            "umbral_magnitude": round(float(details["umbral_magnitude"][i]), 3),
            "penumbral_magnitude": round(float(details["penumbral_magnitude"][i]), 3),
            "contacts": {k: (v.utc_datetime() if v is not None else None) for k, v in contacts.items()},
        })
    return events


def lunar_eclipse_diagram_data(event: dict, eph) -> dict:
    """The Moon's path through Earth's shadow, projected onto a small tangent
    plane centred on the shadow axis — everything needed to draw the classic
    two-circles-and-a-path eclipse diagram."""
    ts = engine.timescale()
    t_greatest = ts.from_datetime(event["greatest_eclipse"])

    p1, p4 = event["contacts"].get("P1"), event["contacts"].get("P4")
    if p1 is None or p4 is None:
        span_minutes = 120
    else:
        span_minutes = max(30, (p4 - p1).total_seconds() / 60 / 2 + 20)

    offsets = np.arange(-span_minutes, span_minutes + 1, 3)
    times = ts.tt_jd(t_greatest.tt + offsets / 1440.0)

    earth, sun, moon = eph["earth"], eph["sun"], eph["moon"]
    earth_to_sun = (sun - earth).at(times).position.km
    earth_to_moon = (moon - earth).at(times).position.km

    def norm(v):
        return np.sqrt((v ** 2).sum(axis=0))

    shadow_dir = -earth_to_sun / norm(earth_to_sun)
    moon_dir = earth_to_moon / norm(earth_to_moon)

    mid = shadow_dir[:, len(offsets) // 2]
    up = np.array([0.0, 0.0, 1.0])
    east = np.cross(up, mid)
    east /= np.linalg.norm(east)
    north = np.cross(mid, east)

    # Offset of the Moon from the shadow axis at each *same* instant (not
    # from a single fixed reference time) — this is what makes contact
    # points land exactly on the penumbra/umbra circles in the diagram.
    offset_vec = moon_dir - shadow_dir
    x_deg = np.degrees(offset_vec.T @ east)
    y_deg = np.degrees(offset_vec.T @ north)

    _, moon_radius, penumbra_radius, umbra_radius = _lunar_geometry(t_greatest, eph)

    def contact_xy(name):
        dt = event["contacts"].get(name)
        if dt is None:
            return None
        t = ts.from_datetime(dt)
        etm = (moon - earth).at(t).position.km
        mdir = etm / np.linalg.norm(etm)
        ets = (sun - earth).at(t).position.km
        sdir = -ets / np.linalg.norm(ets)
        offset = mdir - sdir
        return float(np.degrees(np.dot(offset, east))), float(np.degrees(np.dot(offset, north)))

    return {
        "path_x_deg": x_deg,
        "path_y_deg": y_deg,
        "moon_radius_deg": float(np.degrees(moon_radius)),
        "penumbra_radius_deg": float(np.degrees(penumbra_radius)),
        "umbra_radius_deg": float(np.degrees(umbra_radius)),
        "contacts_xy": {name: contact_xy(name) for name in ["P1", "U1", "U2", "U3", "U4", "P4"]},
    }


def lunar_eclipse_local_circumstances(event: dict, site: dict) -> dict:
    """Which contacts are actually visible from a site (Moon above horizon),
    and an overall visibility verdict."""
    observer = engine.observer(site)
    ts = engine.timescale()
    tz = engine.site_tz(site)
    eph = engine.ephemeris()

    contact_altitudes = {}
    for name, dt in event["contacts"].items():
        if dt is None:
            contact_altitudes[name] = None
            continue
        t = ts.from_datetime(dt)
        alt, _, _ = observer.at(t).observe(eph["moon"]).apparent().altaz()
        contact_altitudes[name] = round(float(alt.degrees), 1)

    t_greatest = ts.from_datetime(event["greatest_eclipse"])
    alt_greatest, _, _ = observer.at(t_greatest).observe(eph["moon"]).apparent().altaz()
    visible_at_greatest = alt_greatest.degrees > 0

    valid_contacts = [v for v in contact_altitudes.values() if v is not None]
    all_above = valid_contacts and all(v > 0 for v in valid_contacts)
    any_above = any(v is not None and v > 0 for v in contact_altitudes.values())

    if all_above:
        verdict = "Fully visible — the Moon is above the horizon for the entire eclipse."
    elif any_above:
        verdict = "Partially visible — moonrise or moonset happens during the eclipse, so part of it is cut off."
    else:
        verdict = "Not visible — the Moon is below the horizon for the whole eclipse from this site."

    return {
        "contact_altitudes_deg": contact_altitudes,
        "moon_altitude_at_greatest_deg": round(float(alt_greatest.degrees), 1),
        "visible_at_greatest": visible_at_greatest,
        "verdict": verdict,
    }


# ---------------------------------------------------------------------------
# Solar eclipses (inherently local — computed from the site's topocentric view)
# ---------------------------------------------------------------------------

def _new_moon_dates(start: date, end: date) -> list:
    """Approximate new-moon instants in [start, end), found by sampling the
    Sun-Moon ecliptic longitude difference every 6 hours and looking for
    0/360 degree crossings (i.e. conjunction — new moon)."""
    eph = engine.ephemeris()
    ts = engine.timescale()
    earth, sun, moon = eph["earth"], eph["sun"], eph["moon"]

    t0 = ts.from_datetime(datetime(start.year, start.month, start.day, tzinfo=timezone.utc))
    t1 = ts.from_datetime(datetime(end.year, end.month, end.day, tzinfo=timezone.utc))
    hours = np.arange(0, (t1.tt - t0.tt) * 24 + 6, 6.0)
    times = ts.tt_jd(t0.tt + hours / 24.0)

    sun_lon = earth.at(times).observe(sun).apparent().ecliptic_latlon()[1].degrees
    moon_lon = earth.at(times).observe(moon).apparent().ecliptic_latlon()[1].degrees
    diff = (moon_lon - sun_lon + 180) % 360 - 180  # wrapped to [-180, 180)

    new_moons = []
    for i in range(len(diff) - 1):
        if diff[i] <= 0 < diff[i + 1]:
            frac = -diff[i] / (diff[i + 1] - diff[i])
            t_new = ts.tt_jd(times[i].tt + frac * (times[i + 1].tt - times[i].tt))
            new_moons.append(t_new)
    return new_moons


def _topocentric_solar_geometry(t, site):
    """Sun-Moon angular separation and angular radii as seen from a specific
    site (topocentric — this is where parallax makes solar eclipses local)."""
    eph = engine.ephemeris()
    observer = engine.observer(site)

    sun_app = observer.at(t).observe(eph["sun"]).apparent()
    moon_app = observer.at(t).observe(eph["moon"]).apparent()

    separation = sun_app.separation_from(moon_app).radians
    sun_radius = np.arcsin(SOLAR_RADIUS_KM / sun_app.distance().km)
    moon_radius = np.arcsin(MOON_RADIUS_KM / moon_app.distance().km)
    sun_alt, _, _ = sun_app.altaz()

    return separation, sun_radius, moon_radius, sun_alt.degrees


def find_solar_eclipses(site: dict, start: date, end: date) -> list[dict]:
    """Local solar eclipses visible from `site` between start and end. Only
    checks actual new-moon dates (solar eclipses can't happen otherwise), and
    only reports ones where the disks actually overlap from this site."""
    ts = engine.timescale()
    events = []

    for t_new in _new_moon_dates(start, end):
        window_minutes = np.arange(-240, 241, 2)
        times = ts.tt_jd(t_new.tt + window_minutes / 1440.0)

        separations = np.empty(len(times))
        sun_radii = np.empty(len(times))
        moon_radii = np.empty(len(times))
        sun_alts = np.empty(len(times))
        for i, ti in enumerate(times):
            separations[i], sun_radii[i], moon_radii[i], sun_alts[i] = _topocentric_solar_geometry(ti, site)

        overlap = separations < (sun_radii + moon_radii)
        if not overlap.any():
            continue  # no eclipse visible from this site at this new moon

        min_idx = int(np.argmin(separations))
        max_sun_r, max_moon_r = sun_radii[min_idx], moon_radii[min_idx]
        min_sep = separations[min_idx]

        if min_sep <= moon_radii[min_idx] - sun_radii[min_idx]:
            ecl_type = "Total"
        elif min_sep <= sun_radii[min_idx] - moon_radii[min_idx]:
            ecl_type = "Annular"
        else:
            ecl_type = "Partial"

        magnitude = (max_sun_r + max_moon_r - min_sep) / (2 * max_sun_r)
        obscuration_pct = round(min(100.0, max(0.0, float(magnitude) * 100)), 1)

        partial_threshold = sun_radii + moon_radii
        c1 = _find_crossing(ts, times, separations, np.median(partial_threshold), rising=False)
        c4 = _find_crossing(ts, times, separations, np.median(partial_threshold), rising=True)

        c2 = c3 = None
        if ecl_type in ("Total", "Annular"):
            inner_threshold = np.abs(sun_radii - moon_radii)
            c2 = _find_crossing(ts, times, separations, np.median(inner_threshold), rising=False)
            c3 = _find_crossing(ts, times, separations, np.median(inner_threshold), rising=True)

        events.append({
            "type": ecl_type,
            "max_eclipse": times[min_idx].utc_datetime(),
            "obscuration_pct": obscuration_pct,
            "magnitude": round(float(magnitude), 3),
            "sun_altitude_at_max_deg": round(float(sun_alts[min_idx]), 1),
            "visible": bool(sun_alts[min_idx] > 0),
            "contacts": {
                "C1": c1.utc_datetime() if c1 is not None else None,
                "C2": c2.utc_datetime() if c2 is not None else None,
                "C3": c3.utc_datetime() if c3 is not None else None,
                "C4": c4.utc_datetime() if c4 is not None else None,
            },
        })

    return events

def solar_eclipse_geometry_at_max(event: dict, site: dict) -> dict:
    """Sun/Moon angular radii and separation at maximum eclipse, in degrees —
    everything `plotting.solar_eclipse_figure` needs."""
    ts = engine.timescale()
    t_max = ts.from_datetime(event["max_eclipse"])
    sep, sun_r, moon_r, _ = _topocentric_solar_geometry(t_max, site)
    return {
        "sun_radius_deg": float(np.degrees(sun_r)),
        "moon_radius_deg": float(np.degrees(moon_r)),
        "separation_deg": float(np.degrees(sep)),
    }
