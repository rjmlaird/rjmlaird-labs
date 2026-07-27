"""Matplotlib figure builders shared between the CLI (saves PNGs) and the
Streamlit dashboard (renders inline)."""
from __future__ import annotations

import matplotlib.pyplot as plt
import pandas as pd
from matplotlib.patches import Circle, Wedge


def weather_detail_figure(df: pd.DataFrame, site_name: str, max_icons: int = 12) -> plt.Figure:
    """Mission-control style weather breakdown: icon strip, cloud layers,
    temperature/precip, and wind — all sharing a time axis."""
    from . import weather_icons as wi

    fig = plt.figure(figsize=(13, 9), facecolor="white")
    gs = fig.add_gridspec(4, 1, height_ratios=[0.6, 1, 1, 1], hspace=0.5)

    ax_icons = fig.add_subplot(gs[0])
    ax_icons.set_xlim(0, 1)
    ax_icons.set_ylim(0, 1)
    ax_icons.axis("off")
    step = max(1, len(df) // max_icons)
    sample = df.iloc[::step].head(max_icons)
    n_icons = max(len(sample), 1)
    for i, (_, row) in enumerate(sample.iterrows()):
        x0 = i / n_icons
        icon_ax = ax_icons.inset_axes([x0 + 0.01, 0.15, 1 / n_icons - 0.02, 0.8])
        wi.draw_icon(icon_ax, row["weather_code"])
        ax_icons.text((i + 0.5) / n_icons, 0.02, row["time"].strftime("%H:%M"),
                       ha="center", va="bottom", fontsize=8, color="#475569", transform=ax_icons.transAxes)
    ax_icons.set_title(f"{site_name} — weather outlook", fontsize=12, loc="left")

    ax_cloud = fig.add_subplot(gs[1])
    ax_cloud.plot(df["time"], df["cloud_cover"], color="#334155", lw=2, label="Total cloud %")
    ax_cloud.plot(df["time"], df["cloud_cover_low"], color="#60a5fa", lw=1.2, alpha=0.8, label="Low")
    ax_cloud.plot(df["time"], df["cloud_cover_mid"], color="#a78bfa", lw=1.2, alpha=0.8, label="Mid")
    ax_cloud.plot(df["time"], df["cloud_cover_high"], color="#fca5a5", lw=1.2, alpha=0.8, label="High")
    ax_cloud.set_ylabel("Cloud cover %")
    ax_cloud.set_ylim(0, 100)
    ax_cloud.grid(True, alpha=0.25)
    ax_cloud.legend(loc="upper right", fontsize=7, ncol=4)

    ax_temp = fig.add_subplot(gs[2])
    ax_temp.plot(df["time"], df["temperature_c"], color="#dc2626", lw=1.8, label="Temp °C")
    ax_temp.plot(df["time"], df["dew_point_c"], color="#0891b2", lw=1.4, ls="--", label="Dew point °C")
    ax_temp.set_ylabel("°C")
    ax_temp.grid(True, alpha=0.25)
    ax_precip = ax_temp.twinx()
    ax_precip.bar(df["time"], df["precipitation_probability"], width=0.02, color="#3b82f6", alpha=0.25,
                   label="Precip prob %")
    ax_precip.set_ylabel("Precip prob %")
    ax_precip.set_ylim(0, 100)
    lines1, labels1 = ax_temp.get_legend_handles_labels()
    lines2, labels2 = ax_precip.get_legend_handles_labels()
    ax_temp.legend(lines1 + lines2, labels1 + labels2, loc="upper right", fontsize=7)

    ax_wind = fig.add_subplot(gs[3])
    ax_wind.plot(df["time"], df["wind_speed_kmh"], color="#0f766e", lw=1.8, label="Wind km/h")
    ax_wind.plot(df["time"], df["wind_gust_kmh"], color="#0f766e", lw=1.0, ls=":", alpha=0.7, label="Gust km/h")
    ax_wind.set_ylabel("km/h")
    ax_wind.grid(True, alpha=0.25)
    ax_wind.legend(loc="upper right", fontsize=7)

    fig.autofmt_xdate()
    return fig


def aurora_map_figure(matrix, site: dict, hemisphere: str = "north") -> plt.Figure:
    """Two views of the OVATION aurora probability grid: a world map with the
    site marked, and a polar close-up of the relevant hemisphere."""
    import numpy as np
    from . import aurora as aurora_mod

    fig, (ax_world, ax_polar) = plt.subplots(1, 2, figsize=(13, 6), facecolor="#050914")
    cmap = plt.get_cmap("viridis")

    # World map (equirectangular): lon 0-359 -> -180..180 for a natural look.
    shifted = np.roll(matrix, shift=180, axis=1)
    ax_world.set_facecolor("#050914")
    im = ax_world.imshow(shifted, extent=[-180, 180, -90, 90], origin="lower",
                          cmap=cmap, aspect="auto", vmin=0, vmax=max(20, matrix.max()))
    ax_world.set_xlabel("Longitude", color="white")
    ax_world.set_ylabel("Latitude", color="white")
    ax_world.tick_params(colors="white")
    ax_world.set_title("Aurora probability — world", color="white", fontsize=11)
    site_lon = ((float(site["lon"]) + 180) % 360) - 180
    ax_world.scatter([site_lon], [float(site["lat"])], marker="*", s=180,
                       c="white", edgecolors="#22c55e", linewidths=1.5, zorder=5)
    fig.colorbar(im, ax=ax_world, fraction=0.03, pad=0.04).ax.tick_params(colors="white")

    # Polar close-up of the relevant hemisphere.
    ax_polar.remove()
    ax_polar = fig.add_subplot(1, 2, 2, projection="polar", facecolor="#050914")
    lat_idx = np.array(aurora_mod.LATS)
    if hemisphere == "north":
        mask = lat_idx >= 0
        colat = 90 - lat_idx[mask]
    else:
        mask = lat_idx <= 0
        colat = 90 + lat_idx[mask]
    theta = np.deg2rad(np.array(aurora_mod.LONS))
    r = colat
    Theta, R = np.meshgrid(theta, r)
    Z = matrix[mask, :]
    ax_polar.pcolormesh(Theta, R, Z, cmap=cmap, shading="auto", vmin=0, vmax=max(20, matrix.max()))
    ax_polar.set_theta_zero_location("N")
    ax_polar.set_rlim(0, 40)
    ax_polar.set_facecolor("#050914")
    ax_polar.tick_params(colors="white")
    ax_polar.set_title(f"{hemisphere.capitalize()} polar close-up", color="white", fontsize=11, pad=20)

    site_colat = (90 - float(site["lat"])) if hemisphere == "north" else (90 + float(site["lat"]))
    site_theta = np.deg2rad(float(site["lon"]) % 360)
    if 0 <= site_colat <= 40:
        ax_polar.scatter([site_theta], [site_colat], marker="*", s=200,
                           c="white", edgecolors="#22c55e", linewidths=1.5, zorder=5)

    fig.suptitle(f"{site.get('name', 'Site')} — aurora outlook", color="white", fontsize=13)
    fig.tight_layout()
    return fig


def satellite_mercator_figure(sat_name: str, track: pd.DataFrame, current: dict, site: dict | None = None) -> plt.Figure:
    """Simplified Mercator projection (no coastlines bundled — lat/lon
    gridlines only) showing a satellite's ground track and current position."""
    import numpy as np

    def mercator_y(lat_deg):
        lat_deg = np.clip(lat_deg, -85, 85)
        lat_rad = np.radians(lat_deg)
        return np.log(np.tan(np.pi / 4 + lat_rad / 2))

    fig, ax = plt.subplots(figsize=(11, 6), facecolor="#0b1020")
    ax.set_facecolor("#0f1629")

    for lon in range(-180, 181, 30):
        ax.axvline(lon, color="#1e293b", lw=0.6)
    for lat in [-60, -30, 0, 30, 60]:
        ax.axhline(mercator_y(lat), color="#1e293b", lw=0.6)
        ax.text(-178, mercator_y(lat), f"{lat}°", color="#64748b", fontsize=7, va="bottom")
    ax.axhline(mercator_y(0), color="#334155", lw=1.0)

    # Split the track at antimeridian crossings so it doesn't draw a spurious
    # line all the way across the map.
    lons = track["lon"].to_numpy()
    lats = track["lat"].to_numpy()
    breaks = np.where(np.abs(np.diff(lons)) > 180)[0]
    segments = np.split(np.arange(len(lons)), breaks + 1)
    for seg in segments:
        if len(seg) > 1:
            ax.plot(lons[seg], mercator_y(lats[seg]), color="#22d3ee", lw=1.8, alpha=0.85, zorder=3)

    ax.scatter([current["lon"]], [mercator_y(current["lat"])], s=140, c="#f97316",
                edgecolors="white", linewidths=1.2, zorder=5, label=sat_name)
    ax.text(current["lon"], mercator_y(current["lat"]) + 0.06, sat_name, color="#fdba74",
             fontsize=9, ha="center", zorder=5)

    if site is not None:
        ax.scatter([site["lon"]], [mercator_y(site["lat"])], marker="*", s=200, c="#22c55e",
                    edgecolors="white", linewidths=1.0, zorder=5)
        ax.text(site["lon"], mercator_y(site["lat"]) - 0.12, site.get("name", "Site"), color="#86efac",
                 fontsize=8, ha="center", zorder=5)

    ax.set_xlim(-180, 180)
    ax.set_ylim(mercator_y(-85), mercator_y(85))
    ax.set_xlabel("Longitude", color="#94a3b8")
    ax.tick_params(colors="#94a3b8")
    for spine in ax.spines.values():
        spine.set_color("#334155")
    ax.set_yticks([])
    ax.set_title(f"{sat_name} — ground track (simplified Mercator, no coastlines)", color="white", fontsize=11)
    fig.tight_layout()
    return fig


def lunar_eclipse_figure(diagram_data: dict, event: dict, site_circumstances: dict | None = None) -> plt.Figure:
    """Classic lunar-eclipse diagram: penumbra/umbra circles with the Moon's
    path drawn through them, contact points marked."""
    d = diagram_data
    fig, ax = plt.subplots(figsize=(8, 8), facecolor="#0b1020")
    ax.set_facecolor("#0b1020")

    ax.add_patch(Circle((0, 0), d["penumbra_radius_deg"], facecolor="#1e293b", edgecolor="#475569", lw=1.2, alpha=0.7, zorder=1))
    ax.add_patch(Circle((0, 0), d["umbra_radius_deg"], facecolor="#0f172a", edgecolor="#94a3b8", lw=1.5, alpha=0.9, zorder=2))

    ax.plot(d["path_x_deg"], d["path_y_deg"], color="#fbbf24", lw=1.2, alpha=0.6, zorder=3)

    for name, xy in d["contacts_xy"].items():
        if xy is None:
            continue
        x, y = xy
        ax.add_patch(Circle((x, y), d["moon_radius_deg"], facecolor="#e2e8f0", edgecolor="#94a3b8",
                              lw=0.8, alpha=0.85, zorder=4))
        ax.text(x, y - d["moon_radius_deg"] - 0.08, name, color="#fde68a", fontsize=8, ha="center", zorder=5)

    lim = d["penumbra_radius_deg"] * 1.3
    ax.set_xlim(-lim, lim)
    ax.set_ylim(-lim, lim)
    ax.set_aspect("equal")
    ax.axis("off")

    subtitle = f"Umbral mag. {event['umbral_magnitude']:.2f} · Penumbral mag. {event['penumbral_magnitude']:.2f}"
    if site_circumstances:
        subtitle += f"\n{site_circumstances['verdict']}"
    ax.set_title(f"{event['type']} Lunar Eclipse — {event['greatest_eclipse'].strftime('%Y-%m-%d')}\n{subtitle}",
                  color="white", fontsize=11)
    fig.tight_layout()
    return fig


def solar_eclipse_figure(eclipse_event: dict, sun_radius_deg: float, moon_radius_deg: float,
                           separation_deg: float, site_name: str) -> plt.Figure:
    """Local view at maximum eclipse: Sun and Moon disks as seen from the site."""
    fig, ax = plt.subplots(figsize=(7, 7), facecolor="#0b1020")
    ax.set_facecolor("#0b1020")

    ax.add_patch(Circle((0, 0), sun_radius_deg, facecolor="#fde047", edgecolor="#fbbf24", lw=1.5, zorder=1))
    ax.add_patch(Circle((separation_deg, 0), moon_radius_deg, facecolor="#0b1020", edgecolor="#64748b",
                          lw=1.5, alpha=0.96, zorder=2))

    lim = max(sun_radius_deg, moon_radius_deg + separation_deg) * 1.4
    ax.set_xlim(-lim, lim)
    ax.set_ylim(-lim, lim)
    ax.set_aspect("equal")
    ax.axis("off")

    ax.set_title(
        f"{eclipse_event['type']} Solar Eclipse — {site_name}\n"
        f"{eclipse_event['max_eclipse'].strftime('%Y-%m-%d %H:%M UTC')} · "
        f"{eclipse_event['obscuration_pct']:.0f}% of the Sun's diameter obscured",
        color="white", fontsize=11,
    )
    fig.tight_layout()
    return fig


def uk_aurora_activity_figure(activity: dict) -> plt.Figure:
    """AuroraWatch UK-style hourly activity bar chart: bars coloured by alert
    level, threshold lines, y-axis scaled to the next alert level up."""
    import pandas as pd
    from . import aurora as aurora_mod

    bars = activity["bars"]
    df = pd.DataFrame(bars)
    df["datetime"] = pd.to_datetime(df["datetime"])

    color_map = {"green": "#16a34a", "yellow": "#eab308", "amber": "#f59e0b", "red": "#dc2626"}
    bar_colors = [color_map.get(s, "#94a3b8") for s in df["status_id"]]

    ceiling, next_level = aurora_mod.uk_chart_scale(bars, activity["thresholds"])

    fig, ax = plt.subplots(figsize=(11, 5), facecolor="white")
    ax.bar(df["datetime"], df["value_nt"], width=0.035, color=bar_colors, zorder=3)

    for status_id, threshold in activity["thresholds"].items():
        if threshold <= ceiling:
            ax.axhline(threshold, color=color_map.get(status_id, "#94a3b8"), lw=1.2, ls="--", alpha=0.8, zorder=2)
            ax.text(df["datetime"].iloc[0], threshold, f" {status_id} ({threshold:.0f} nT)",
                     va="bottom", fontsize=8, color=color_map.get(status_id, "#94a3b8"))

    ax.set_ylim(0, ceiling * 1.05)
    ax.set_ylabel("Activity index (nT)")
    ax.set_title(f"UK geomagnetic activity — {activity['site_id']} — updated {activity['updated']} UTC",
                  fontsize=11, loc="left")
    ax.grid(True, axis="y", alpha=0.2)
    fig.autofmt_xdate()
    fig.tight_layout()
    return fig


def seeing_detail_figure(merged: pd.DataFrame, target_name: str, site_name: str) -> plt.Figure:
    """Effective seeing for a specific target: weather-based proxy, degraded
    by airmass as the target sits lower in the sky, plus a dew-risk strip."""
    fig, (ax_seeing, ax_extra) = plt.subplots(
        2, 1, figsize=(12, 7.5), facecolor="white", height_ratios=[2, 1], sharex=True
    )

    ax_seeing.plot(merged["time_local"], merged["seeing_proxy"], color="#94a3b8", lw=1.4, ls="--",
                    label="Weather-only seeing proxy")
    ax_seeing.plot(merged["time_local"], merged["effective_seeing"], color="#2563eb", lw=2.4,
                    label=f"Effective seeing for {target_name}")
    ax_seeing.axhspan(75, 100, color="#16a34a", alpha=0.06)
    ax_seeing.axhspan(50, 75, color="#f59e0b", alpha=0.08)
    ax_seeing.axhspan(0, 50, color="#dc2626", alpha=0.06)
    ax_seeing.set_ylim(0, 100)
    ax_seeing.set_ylabel("Seeing score (0-100)")
    ax_seeing.grid(True, alpha=0.25)
    ax_seeing.legend(loc="upper right", fontsize=8)
    ax_seeing.set_title(f"{site_name} — seeing for {target_name}", fontsize=12, loc="left")

    ax_am = ax_seeing.twinx()
    ax_am.plot(merged["time_local"], merged["target_airmass"], color="#7c3aed", lw=1.2, alpha=0.7,
                label="Airmass")
    ax_am.set_ylabel("Airmass", color="#7c3aed")
    ax_am.set_ylim(1, 5)
    ax_am.invert_yaxis()

    ax_extra.plot(merged["time_local"], merged["temperature_c"], color="#dc2626", lw=1.6, label="Temp °C")
    ax_extra.plot(merged["time_local"], merged["dew_point_c"], color="#0891b2", lw=1.4, ls="--", label="Dew point °C")
    ax_extra.fill_between(merged["time_local"], merged["temperature_c"], merged["dew_point_c"],
                            color="#fbbf24", alpha=0.15, label="Dew margin")
    ax_extra.set_ylabel("°C")
    ax_extra.grid(True, alpha=0.25)
    ax_extra.legend(loc="upper right", fontsize=8)

    fig.autofmt_xdate()
    fig.tight_layout()
    return fig


def seeing_figure(df: pd.DataFrame, site_name: str) -> plt.Figure:
    fig, ax1 = plt.subplots(figsize=(12, 5.5), facecolor="white")
    ax1.plot(df["time"], df["seeing_proxy"], color="#2563eb", lw=2.2, label="Seeing proxy")
    ax1.set_ylabel("Seeing proxy (0-100)")
    ax1.set_ylim(0, 100)
    ax1.grid(True, alpha=0.25)
    ax1.axhspan(75, 100, color="#16a34a", alpha=0.08)
    ax1.axhspan(50, 75, color="#f59e0b", alpha=0.10)
    ax1.axhspan(0, 50, color="#dc2626", alpha=0.08)

    ax2 = ax1.twinx()
    ax2.plot(df["time"], df["cloud_cover"], color="#6b7280", lw=1.4, alpha=0.8, label="Cloud cover %")
    ax2.plot(df["time"], df["wind_speed_kmh"], color="#0f766e", lw=1.2, alpha=0.8, label="Wind km/h")
    ax2.plot(df["time"], df["humidity"], color="#7c3aed", lw=1.2, alpha=0.8, label="Humidity %")
    ax2.set_ylabel("Cloud / wind / humidity")

    fig.suptitle(f"{site_name} — seeing conditions")
    fig.autofmt_xdate()
    lines1, labels1 = ax1.get_legend_handles_labels()
    lines2, labels2 = ax2.get_legend_handles_labels()
    ax1.legend(lines1 + lines2, labels1 + labels2, loc="upper right", fontsize=8)
    fig.tight_layout()
    return fig


def visibility_figure(track: pd.DataFrame, target_name: str, window: dict) -> plt.Figure:
    fig, ax = plt.subplots(figsize=(12, 5.5), facecolor="white")
    ax.plot(track["time_local"], track["target_alt_deg"], color="#2563eb", lw=2.2, label=target_name)
    ax.plot(track["time_local"], track["moon_alt_deg"], color="#a78bfa", lw=1.4, ls="--", label="Moon")
    ax.plot(track["time_local"], track["sun_alt_deg"], color="#f59e0b", lw=1.2, ls=":", label="Sun")
    ax.axhline(0, color="#9ca3af", lw=0.8)

    dark = track[track["is_astro_dark"]]
    if not dark.empty:
        ax.axvspan(dark["time_local"].iloc[0], dark["time_local"].iloc[-1], color="#0b1020", alpha=0.06)

    if window["start"] is not None:
        ax.axvspan(window["start"], window["end"], color="#16a34a", alpha=0.12, label="Best window")

    ax.set_ylabel("Altitude (deg)")
    ax.set_ylim(-10, 90)
    ax.grid(True, alpha=0.25)
    ax.legend(loc="upper right", fontsize=8)
    fig.suptitle(f"{target_name} visibility track")
    fig.autofmt_xdate()
    fig.tight_layout()
    return fig


def moon_phase_icon(ax, phase_percent: float, title: str = "") -> None:
    ax.set_aspect("equal")
    ax.set_xlim(-1.25, 1.25)
    ax.set_ylim(-1.25, 1.25)
    ax.axis("off")

    p = max(0.0, min(1.0, phase_percent / 100.0))
    ax.add_patch(Circle((0, 0), 1.0, facecolor="#f8fafc", edgecolor="#cbd5e1", lw=2))

    if p <= 0.5:
        frac = p / 0.5
        ax.add_patch(Circle((0, 0), 1.0, facecolor="#0b1020", edgecolor="none"))
        ax.add_patch(Wedge((0, 0), 1.0, 90, 270, width=2.0 * (1.0 - frac), facecolor="#f8fafc", edgecolor="none"))
    else:
        frac = (p - 0.5) / 0.5
        ax.add_patch(Wedge((0, 0), 1.0, -90, 90, facecolor="#f8fafc", edgecolor="none"))
        ax.add_patch(Wedge((0, 0), 1.0, 90, 270, width=2.0 * (1.0 - frac), facecolor="#0b1020", edgecolor="none"))

    ax.add_patch(Circle((0, 0), 1.0, facecolor="none", edgecolor="#cbd5e1", lw=2))
    if title:
        ax.text(0, -1.3, title, ha="center", va="top", fontsize=10)


def sun_moon_figure(df: pd.DataFrame, site_name: str) -> plt.Figure:
    n = len(df)
    fig, axes = plt.subplots(1, n, figsize=(2.0 * n, 2.4), facecolor="white")
    if n == 1:
        axes = [axes]
    for ax, (_, row) in zip(axes, df.iterrows()):
        moon_phase_icon(ax, row["moon_phase_percent"], title=f"{row['date']}\n{row['moon_phase_percent']:.0f}%")
    fig.suptitle(f"{site_name} — moon phase, next {n} days")
    fig.tight_layout()
    return fig


def telescope_fov_figure(row: dict) -> plt.Figure:
    """Simple schematic: field-of-view circle with target-size circle inside/outside it."""
    fig, ax = plt.subplots(figsize=(5.5, 5.5), facecolor="black")
    ax.set_facecolor("black")

    fov_radius = row["tfov_arcmin"] / 2.0
    ax.add_patch(Circle((0, 0), fov_radius, edgecolor="white", facecolor="none", lw=2.2))

    if row.get("target_size_arcmin"):
        target_radius = row["target_size_arcmin"] / 2.0
        color = "#22c55e" if row["fits_in_fov"] else "#ef4444"
        ax.add_patch(Circle((0, 0), target_radius, edgecolor=color, facecolor=color, alpha=0.35, lw=1.5))

    lim = fov_radius * 1.25
    ax.set_xlim(-lim, lim)
    ax.set_ylim(-lim, lim)
    ax.set_aspect("equal")
    ax.axis("off")
    ax.set_title(
        f"{row['equipment']} on {row['target']} — {row['magnification_x']:.0f}x, "
        f"TFOV {row['tfov_arcmin']:.1f}'",
        color="white",
        fontsize=10,
    )
    fig.tight_layout()
    return fig
