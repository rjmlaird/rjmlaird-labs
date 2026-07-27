"""Combine weather seeing, target visibility, moon brightness, and telescope
FOV into a single observation plan / recommendation."""
from __future__ import annotations

from datetime import date

import pandas as pd

from .seeing import forecast_seeing, moon_sky_brightness
from .sun_moon import solar_lunar_events
from .telescope import resolve_view
from .visibility import best_window, night_track


def build_plan(site: dict, target: dict, equipment: dict | None = None,
                target_date: date | None = None) -> dict:
    d = target_date or date.today()

    track = night_track(site, target, target_date=d)
    window = best_window(track)
    sl = solar_lunar_events(site, d)

    # Sky brightness near the target at the moment of peak altitude within the window.
    if window["start"] is not None:
        peak_mask = (track["time_local"] >= window["start"]) & (track["time_local"] <= window["end"])
        peak_row = track.loc[peak_mask, "target_alt_deg"].idxmax()
        row = track.loc[peak_row]
        brightness = moon_sky_brightness(
            moon_illum_pct=sl["moon_phase_percent"],
            moon_alt_deg=row["moon_alt_deg"],
            target_alt_deg=row["target_alt_deg"],
            moon_target_sep_deg=row["moon_separation_deg"],
        )
    else:
        brightness = None

    window_seeing = None
    try:
        seeing_df = forecast_seeing(site, forecast_days=2)
        if window["start"] is not None:
            mask = (seeing_df["time"] >= pd.Timestamp(window["start"])) & (
                seeing_df["time"] <= pd.Timestamp(window["end"])
            )
            if mask.any():
                window_seeing = round(float(seeing_df.loc[mask, "seeing_proxy"].mean()), 1)
    except Exception:
        # Weather API unreachable (offline, blocked, rate-limited, etc.) — the
        # rest of the plan (visibility/moon/telescope) is still useful without it.
        pass

    telescope_fit = resolve_view(equipment, target) if equipment else None

    verdict = _verdict(window, brightness, window_seeing)

    return {
        "site": site.get("name"),
        "target": target.get("name"),
        "date": d.isoformat(),
        "moon_phase_percent": sl["moon_phase_percent"],
        "window_start_local": window["start"],
        "window_end_local": window["end"],
        "window_duration_hours": window["duration_hours"],
        "target_max_altitude_deg": window["max_alt"],
        "avg_seeing_proxy_in_window": window_seeing,
        "moon_sky_brightness": brightness,
        "telescope_fit": telescope_fit,
        "verdict": verdict,
        "track": track,
    }


def _verdict(window: dict, brightness: dict | None, window_seeing: float | None) -> str:
    if window["start"] is None:
        return "Target does not clear a useful altitude during astronomical darkness on this date."

    notes = []
    if window["duration_hours"] < 1.0:
        notes.append("short observing window")
    if brightness and brightness["penalty_mag"] > 1.0:
        notes.append("significant moonlight interference")
    if window_seeing is not None and window_seeing < 50:
        notes.append("poor atmospheric conditions forecast")

    if not notes:
        return "Good conditions — clear window, target well placed, minimal moon interference."
    return "Usable but not ideal: " + "; ".join(notes) + "."
