"""Seeing/transparency proxy scoring.

Two layers, both ported and extended from the original scripts:
 1. `seeing_proxy` — a simple 0-100 score from cloud/wind/humidity, good enough
    for a quick go/no-go glance (from seeing.py).
 2. `moon_sky_brightness` — a more detailed model of how much the Moon brightens
    the sky background for a specific target (from pro-seeing.py), useful once
    you've picked a target to observe.
"""
from __future__ import annotations

import math

import pandas as pd

from .weather import fetch_hourly


# ---------------------------------------------------------------------------
# Layer 1: quick weather-based seeing proxy
# ---------------------------------------------------------------------------

def seeing_proxy(cloud: float, wind: float, gust: float, humidity: float) -> float:
    score = 100.0
    score -= cloud * 0.20
    score -= wind * 1.2
    score -= max(gust - wind, 0) * 0.5
    score -= max(humidity - 60, 0) * 0.4
    return max(0.0, min(100.0, score))


def classify(score: float) -> str:
    if score >= 75:
        return "good"
    if score >= 50:
        return "fair"
    return "poor"


def airmass_seeing_penalty(airmass: float | None) -> float:
    """Seeing degrades away from the zenith — more air, more turbulence path
    length. Roughly +8 points of penalty per unit of airmass above 1."""
    if airmass is None:
        return 100.0  # below the horizon: not observable at all
    return max(0.0, (airmass - 1.0)) * 8.0


def dew_risk(temperature_c: float | None, dew_point_c: float | None) -> str:
    """How close conditions are to the dew point — a small spread means
    dew/frost is likely to form on optics."""
    if temperature_c is None or dew_point_c is None:
        return "unknown"
    spread = temperature_c - dew_point_c
    if spread <= 1.5:
        return "high"
    if spread <= 3.5:
        return "moderate"
    return "low"


def forecast_seeing(site: dict, forecast_days: int = 2) -> pd.DataFrame:
    tz_name = site.get("timezone", "UTC")
    weather = fetch_hourly(site["lat"], site["lon"], tz_name, forecast_days=forecast_days)
    hourly = weather["hourly"]

    rows = []
    for i, t in enumerate(hourly["time"]):
        cloud = hourly["cloud_cover"][i]
        wind = hourly["wind_speed_10m"][i]
        gust = hourly["wind_gusts_10m"][i]
        humidity = hourly["relative_humidity_2m"][i]
        temp = hourly["temperature_2m"][i]
        score = round(seeing_proxy(cloud, wind, gust, humidity), 1)
        dew_point = hourly.get("dew_point_2m", [None] * len(hourly["time"]))[i]
        rows.append({
            "time": t,
            "weather_code": hourly.get("weather_code", [None] * len(hourly["time"]))[i],
            "cloud_cover": cloud,
            "cloud_cover_low": hourly.get("cloud_cover_low", [None] * len(hourly["time"]))[i],
            "cloud_cover_mid": hourly.get("cloud_cover_mid", [None] * len(hourly["time"]))[i],
            "cloud_cover_high": hourly.get("cloud_cover_high", [None] * len(hourly["time"]))[i],
            "wind_speed_kmh": wind,
            "wind_gust_kmh": gust,
            "wind_direction_deg": hourly.get("wind_direction_10m", [None] * len(hourly["time"]))[i],
            "humidity": humidity,
            "dew_point_c": dew_point,
            "dew_point_spread_c": None if dew_point is None else round(temp - dew_point, 1),
            "dew_risk": dew_risk(temp, dew_point),
            "temperature_c": temp,
            "precipitation_probability": hourly.get("precipitation_probability", [None] * len(hourly["time"]))[i],
            "precipitation_mm": hourly.get("precipitation", [None] * len(hourly["time"]))[i],
            "visibility_m": hourly.get("visibility", [None] * len(hourly["time"]))[i],
            "seeing_proxy": score,
            "class": classify(score),
        })

    df = pd.DataFrame(rows)
    df["time"] = pd.to_datetime(df["time"])
    return df


def current_conditions(site: dict) -> dict | None:
    """Snapshot of Open-Meteo's 'current' block, for a mission-control-style header."""
    tz_name = site.get("timezone", "UTC")
    weather = fetch_hourly(site["lat"], site["lon"], tz_name, forecast_days=1)
    return weather.get("current")


def target_seeing_track(site: dict, target: dict, target_date=None, forecast_days: int = 2) -> pd.DataFrame:
    """Merge the weather-based seeing proxy with a target's airmass across
    the night, producing an 'effective seeing' score that also accounts for
    how much air you're looking through — the same weather is worse seeing
    for a target low on the horizon than one near the zenith."""
    from .visibility import night_track  # local import: avoids a circular import at module load

    weather_df = forecast_seeing(site, forecast_days=forecast_days)
    track = night_track(site, target, target_date=target_date)

    # Weather is hourly; the night track is every 10 min — merge on the
    # nearest hour so every visibility sample gets a seeing_proxy value.
    # Open-Meteo's "time" column is naive local wall-clock (per the site's
    # timezone param), so we match against the track's local time with its
    # tzinfo stripped, rather than converting either side to UTC.
    track = track.copy()
    track["time_local"] = pd.to_datetime(track["time_local"])
    track["time_match"] = track["time_local"].dt.tz_localize(None)
    weather_df = weather_df.sort_values("time")
    merged = pd.merge_asof(
        track.sort_values("time_match"), weather_df.sort_values("time"),
        left_on="time_match", right_on="time", direction="nearest",
        tolerance=pd.Timedelta("90min"),
    )

    merged["airmass_penalty"] = merged["target_airmass"].apply(airmass_seeing_penalty)
    merged["effective_seeing"] = (merged["seeing_proxy"] - merged["airmass_penalty"]).clip(lower=0, upper=100)
    merged["effective_seeing"] = merged["effective_seeing"].where(merged["target_alt_deg"] > 0, other=0.0)
    return merged


# ---------------------------------------------------------------------------
# Layer 2: moon sky-brightness model (per-target, once you know alt/separation)
# ---------------------------------------------------------------------------

def clamp(x: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, x))


def mag_to_linear(mag: float) -> float:
    return 10 ** (-0.4 * mag)


def linear_to_mag(brightness: float) -> float:
    return -2.5 * math.log10(max(brightness, 1e-30))


def airmass_from_altitude(alt_deg: float | None) -> float | None:
    if alt_deg is None or alt_deg <= 0:
        return None
    z = 90.0 - alt_deg
    return 1.0 / (math.cos(math.radians(z)) + 0.50572 * (96.07995 - z) ** (-1.6364))


def moon_phase_factor(moon_illum_pct: float) -> float:
    f = clamp(moon_illum_pct / 100.0, 0.0, 1.0)
    return f ** 1.35


def altitude_factor(alt_deg: float | None) -> float:
    if alt_deg is None or alt_deg <= 0:
        return 0.0
    s = math.sin(math.radians(alt_deg))
    return clamp(s ** 0.8, 0.0, 1.0)


def separation_factor(sep_deg: float | None) -> float:
    if sep_deg is None:
        return 0.0
    if sep_deg <= 10:
        return 1.0
    if sep_deg >= 120:
        return 0.0
    return math.exp(-(sep_deg - 10.0) / 28.0)


def extinction_factor(extinction_mag_per_airmass: float) -> float:
    return clamp(extinction_mag_per_airmass / 0.35, 0.4, 1.4)


def moon_sky_brightness(
    moon_illum_pct: float,
    moon_alt_deg: float | None,
    target_alt_deg: float | None,
    moon_target_sep_deg: float | None,
    zenith_dark_sqm: float = 21.8,
    extinction_mag_per_airmass: float = 0.25,
) -> dict | None:
    """Estimate sky brightness (SQM, mag/arcsec^2) near a target given the Moon's
    position and phase. Higher `penalty_mag` means more moon-brightened sky."""
    target_am = airmass_from_altitude(target_alt_deg)
    if target_am is None:
        return None
    moon_am = airmass_from_altitude(moon_alt_deg)

    baseline_linear = mag_to_linear(zenith_dark_sqm)
    phase = moon_phase_factor(moon_illum_pct)
    moon_alt = altitude_factor(moon_alt_deg)
    sep = separation_factor(moon_target_sep_deg)
    ext = extinction_factor(extinction_mag_per_airmass)

    geom = 0.55 + 0.45 * clamp(target_am / 2.5, 0.0, 1.0)
    moon_airmass_term = 1.0 if moon_am is None else clamp(1.0 + 0.18 * (moon_am - 1.0), 0.7, 1.8)

    moon_brightness_boost = 180.0 * phase * moon_alt * sep * ext * geom * moon_airmass_term
    moon_linear = baseline_linear * moon_brightness_boost
    total_linear = baseline_linear + moon_linear
    sqm = linear_to_mag(total_linear)
    penalty = zenith_dark_sqm - sqm

    return {
        "sqm": round(sqm, 2),
        "penalty_mag": round(penalty, 2),
        "target_airmass": None if target_am is None else round(target_am, 3),
        "moon_airmass": None if moon_am is None else round(moon_am, 3),
    }
