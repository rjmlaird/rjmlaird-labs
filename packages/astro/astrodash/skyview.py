"""A live 'dome' view of the sky above a site's horizon at a given moment —
stars (from the bundled Hipparcos subset), Sun/Moon/planets, and optionally a
highlighted target. Uses an azimuthal-equidistant projection centred on the
zenith, which is the natural way to draw "look up and this is what you'll see".

Background colour and star visibility respond to the Sun's altitude, so the
chart looks like night, twilight, or a natural blue daytime sky depending on
when you point it.
"""
from __future__ import annotations

from datetime import datetime

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.patches import Circle
from skyfield.api import Star

from . import engine

PLANET_STYLE = {
    "mercury": dict(color="#9ca3af", size=60, marker="o"),
    "venus": dict(color="#fde68a", size=90, marker="o"),
    "mars": dict(color="#f87171", size=70, marker="o"),
    "jupiter": dict(color="#fbbf24", size=100, marker="o"),
    "saturn": dict(color="#facc15", size=90, marker="o"),
    "uranus": dict(color="#67e8f9", size=60, marker="o"),
    "neptune": dict(color="#60a5fa", size=60, marker="o"),
}

# Sky background colour as a function of Sun altitude (deg), from full night
# through the three twilight stages to a natural daytime blue. Interpolated
# smoothly between these control points rather than snapping between bands.
_SKY_STOPS = [
    (-90, (5, 9, 20)),      # night
    (-18, (5, 9, 20)),      # astronomical twilight begins
    (-12, (16, 24, 48)),    # nautical twilight
    (-6, (52, 74, 110)),    # civil twilight
    (0, (96, 146, 196)),    # sunrise/sunset
    (10, (110, 170, 224)),  # full daylight blue
    (90, (110, 170, 224)),
]

# Stars fade out as the sky brightens; fully out by civil twilight's end.
_STAR_FADE_START = -18.0  # fully visible at/below this
_STAR_FADE_END = -6.0     # fully invisible at/above this


def sky_background_color(sun_alt_deg: float) -> str:
    stops_x = [s[0] for s in _SKY_STOPS]
    r = np.interp(sun_alt_deg, stops_x, [s[1][0] for s in _SKY_STOPS])
    g = np.interp(sun_alt_deg, stops_x, [s[1][1] for s in _SKY_STOPS])
    b = np.interp(sun_alt_deg, stops_x, [s[1][2] for s in _SKY_STOPS])
    return f"#{int(r):02x}{int(g):02x}{int(b):02x}"


def star_alpha_for_sun_alt(sun_alt_deg: float) -> float:
    if sun_alt_deg <= _STAR_FADE_START:
        return 1.0
    if sun_alt_deg >= _STAR_FADE_END:
        return 0.0
    frac = (sun_alt_deg - _STAR_FADE_START) / (_STAR_FADE_END - _STAR_FADE_START)
    return float(1.0 - frac)


def twilight_label(sun_alt_deg: float) -> str:
    if sun_alt_deg > 0:
        return "Daylight"
    if sun_alt_deg > -6:
        return "Civil twilight"
    if sun_alt_deg > -12:
        return "Nautical twilight"
    if sun_alt_deg > -18:
        return "Astronomical twilight"
    return "Night"


def _to_dome_xy(alt_deg, az_deg):
    """Zenith-centred azimuthal-equidistant projection: r=0 at zenith, r=1 at
    horizon. Compass north at top, east to the right (as seen looking up)."""
    r = (90.0 - alt_deg) / 90.0
    theta = np.deg2rad(az_deg)
    x = r * np.sin(theta)
    y = r * np.cos(theta)
    return x, y


def _mag_to_size(mag, mag_limit: float):
    """Star marker area scales with brightness (flux ~ 10^-0.4*mag), scaled
    relative to the chart's own faint-end cutoff so the dimmest visible stars
    stay small and the brightest stand out clearly, whatever mag_limit is set to."""
    flux = 10 ** (-0.4 * np.asarray(mag, dtype=float))
    flux_at_limit = 10 ** (-0.4 * mag_limit)
    size = 1.2 + 55.0 * np.sqrt(flux / flux_at_limit)
    return np.clip(size, 1.0, 110.0)


def _constellation_star_altaz(observer, t) -> dict[int, tuple[float, float]]:
    """Alt/az for exactly the HIP stars used by constellation figures (~740
    stars) — cheap enough to compute fresh each render rather than caching
    against a moving sky."""
    from . import constellations as const

    needed_hips = sorted({h for c in const.load_constellations() for pair in c.hip_segments for h in pair})
    catalog = engine.bright_star_catalog()
    subset = catalog[catalog.index.isin(needed_hips)]
    if subset.empty:
        return {}
    star_obj = Star(ra_hours=subset["ra_degrees"].to_numpy() / 15.0, dec_degrees=subset["dec_degrees"].to_numpy())
    alt, az, _ = observer.at(t).observe(star_obj).apparent().altaz()
    return {hip: (a, z) for hip, a, z in zip(subset.index, alt.degrees, az.degrees)}


def sky_snapshot(site: dict, when: datetime | None = None, mag_limit: float = 5.2,
                  include_constellation_stars: bool = False) -> dict:
    """Compute alt/az for stars/sun/moon/planets at a moment. Returns plain
    data (no plotting) so the dashboard can also render a live text summary."""
    ts = engine.timescale()
    t = ts.from_datetime(when) if when else ts.now()
    observer = engine.observer(site)

    stars_df = engine.bright_star_catalog()
    stars_df = stars_df[stars_df["magnitude"] <= mag_limit]
    star_obj = Star(ra_hours=stars_df["ra_degrees"].to_numpy() / 15.0, dec_degrees=stars_df["dec_degrees"].to_numpy())
    star_alt, star_az, _ = observer.at(t).observe(star_obj).apparent().altaz()

    visible_stars = stars_df.assign(alt_deg=star_alt.degrees, az_deg=star_az.degrees)
    visible_stars = visible_stars[visible_stars["alt_deg"] > 0]

    bodies = {}
    for name in ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune"]:
        alt, az, _ = observer.at(t).observe(engine.body(name)).apparent().altaz()
        bodies[name] = {"alt_deg": alt.degrees, "az_deg": az.degrees, "above_horizon": alt.degrees > 0}

    result = {"time": t.utc_datetime(), "stars": visible_stars, "bodies": bodies}
    if include_constellation_stars:
        result["constellation_star_altaz"] = _constellation_star_altaz(observer, t)
    return result


def _draw_constellations(ax, const_altaz: dict[int, tuple[float, float]], show_labels: bool, text_color: str) -> None:
    from . import constellations as const

    for c in const.load_constellations():
        pts = []
        for hip_a, hip_b in c.hip_segments:
            pa = const_altaz.get(hip_a)
            pb = const_altaz.get(hip_b)
            if pa is None or pb is None or pa[0] <= 0 or pb[0] <= 0:
                continue
            xa, ya = _to_dome_xy(pa[0], pa[1])
            xb, yb = _to_dome_xy(pb[0], pb[1])
            # Skip segments that would wrap across the whole dome (a star
            # pair split by the horizon edge produces a spurious long line).
            if (xa - xb) ** 2 + (ya - yb) ** 2 > 3.0:
                continue
            ax.plot([xa, xb], [ya, yb], color="#38bdf8", lw=0.9, alpha=0.6, zorder=3)
            pts.append((xa, ya))
            pts.append((xb, yb))

        if show_labels and pts:
            cx = sum(p[0] for p in pts) / len(pts)
            cy = sum(p[1] for p in pts) / len(pts)
            ax.text(cx, cy, c.name, color=text_color, fontsize=7, alpha=0.75, ha="center", va="center",
                     style="italic", zorder=3)


def sky_dome_figure(site: dict, when: datetime | None = None, mag_limit: float = 5.2,
                     target: dict | None = None, show_constellations: bool = False,
                     show_constellation_labels: bool = False) -> plt.Figure:
    snap = sky_snapshot(site, when=when, mag_limit=mag_limit,
                          include_constellation_stars=show_constellations)
    sun_alt = snap["bodies"]["sun"]["alt_deg"]
    bg_color = sky_background_color(sun_alt)
    star_alpha = star_alpha_for_sun_alt(sun_alt)
    grid_color = "#1e293b" if sun_alt <= -6 else "#ffffff"
    grid_alpha_boost = 0.0 if sun_alt <= -6 else 0.25

    fig, ax = plt.subplots(figsize=(7.5, 7.5), facecolor=bg_color)
    ax.set_facecolor(bg_color)
    ax.set_xlim(-1.22, 1.22)
    ax.set_ylim(-1.22, 1.22)
    ax.set_aspect("equal")
    ax.axis("off")

    # Altitude grid rings every 20 degrees, labelled in degrees (same idea as
    # the aurora polar chart's radial gridlines).
    for alt_ring in (0, 20, 40, 60, 80):
        r = (90.0 - alt_ring) / 90.0
        lw = 1.6 if alt_ring == 0 else 0.8
        alpha = 0.9 if alt_ring == 0 else 0.35 + grid_alpha_boost
        ax.add_patch(Circle((0, 0), r, fill=False, edgecolor=grid_color, lw=lw, alpha=min(alpha, 1.0), zorder=1))
        if alt_ring > 0:
            lx, ly = _to_dome_xy(alt_ring, 315)  # place labels along the NW spoke
            ax.text(lx, ly, f"{alt_ring}°", color=grid_color, alpha=0.8, fontsize=7.5,
                     ha="center", va="center", zorder=1)

    for label, az in [("N", 0), ("E", 90), ("S", 180), ("W", 270)]:
        x, y = _to_dome_xy(2, az)  # just outside the horizon ring
        ax.text(x * 1.07, y * 1.07, label, color=grid_color, ha="center", va="center", fontsize=12, zorder=5)

    if show_constellations and star_alpha > 0:
        _draw_constellations(ax, snap.get("constellation_star_altaz", {}), show_constellation_labels, grid_color)

    if star_alpha > 0:
        stars = snap["stars"]
        if not stars.empty:
            x, y = _to_dome_xy(stars["alt_deg"].to_numpy(), stars["az_deg"].to_numpy())
            ax.scatter(x, y, s=_mag_to_size(stars["magnitude"].to_numpy(), mag_limit), c="white",
                       alpha=0.95 * star_alpha, linewidths=0, zorder=2)

    for name, info in snap["bodies"].items():
        if not info["above_horizon"]:
            continue
        x, y = _to_dome_xy(info["alt_deg"], info["az_deg"])
        if name == "sun":
            ax.scatter([x], [y], s=320, c="#fde047", edgecolors="#fef9c3", linewidths=1.5, zorder=6)
            ax.text(x, y - 0.07, "Sun", color="#1e293b" if sun_alt > -6 else "#fde68a",
                     fontsize=9, ha="center", zorder=6)
        elif name == "moon":
            ax.scatter([x], [y], s=180, c="#e2e8f0", edgecolors="#94a3b8", linewidths=1.2, zorder=6)
            ax.text(x, y - 0.06, "Moon", color="#1e293b" if sun_alt > -6 else "#e2e8f0",
                     fontsize=9, ha="center", zorder=6)
        elif star_alpha > 0.15:  # hide planets too once it's properly bright out
            style = PLANET_STYLE.get(name, dict(color="#e2e8f0", size=50, marker="o"))
            ax.scatter([x], [y], s=style["size"], c=style["color"], marker=style["marker"],
                       alpha=min(1.0, star_alpha + 0.3), zorder=5)
            ax.text(x, y - 0.05, name.capitalize(), color=style["color"], fontsize=8,
                     alpha=min(1.0, star_alpha + 0.3), ha="center", zorder=5)

    if target is not None and str(target.get("kind", "")).lower() != "moon":
        ts = engine.timescale()
        t = ts.from_datetime(when) if when else ts.now()
        observer = engine.observer(site)
        star = Star(ra_hours=float(target["ra_deg"]) / 15.0, dec_degrees=float(target["dec_deg"]))
        alt, az, _ = observer.at(t).observe(star).apparent().altaz()
        if alt.degrees > 0:
            x, y = _to_dome_xy(alt.degrees, az.degrees)
            ax.scatter([x], [y], s=220, facecolors="none", edgecolors="#22c55e", linewidths=2.0, zorder=7)
            ax.text(x, y + 0.06, target["name"], color="#16a34a" if sun_alt > -6 else "#22c55e",
                     fontsize=9, ha="center", zorder=7)

    tz = engine.site_tz(site)
    local_time = snap["time"].astimezone(tz)
    title_color = "#0f172a" if sun_alt > -6 else "white"
    fig.suptitle(
        f"{site.get('name', 'Site')} — {local_time.strftime('%Y-%m-%d %H:%M %Z')} — {twilight_label(sun_alt)}",
        color=title_color, fontsize=12,
    )
    fig.tight_layout()
    return fig
