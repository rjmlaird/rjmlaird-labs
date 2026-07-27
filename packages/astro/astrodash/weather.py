"""Weather data via the free Open-Meteo API (no key required)."""
from __future__ import annotations

import requests

FORECAST_URL = "https://api.open-meteo.com/v1/forecast"

HOURLY_FIELDS = [
    "weather_code",
    "cloud_cover",
    "cloud_cover_low",
    "cloud_cover_mid",
    "cloud_cover_high",
    "wind_speed_10m",
    "wind_direction_10m",
    "wind_gusts_10m",
    "relative_humidity_2m",
    "temperature_2m",
    "dew_point_2m",
    "precipitation_probability",
    "precipitation",
    "visibility",
]

CURRENT_FIELDS = [
    "weather_code",
    "cloud_cover",
    "temperature_2m",
    "relative_humidity_2m",
    "wind_speed_10m",
    "wind_gusts_10m",
    "precipitation",
    "is_day",
]


def fetch_hourly(lat: float, lon: float, timezone_name: str = "UTC", forecast_days: int = 3) -> dict:
    """Hourly forecast including a weather_code for icon lookup and full
    cloud-layer / wind / humidity / precipitation / visibility breakdown."""
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": ",".join(HOURLY_FIELDS),
        "current": ",".join(CURRENT_FIELDS),
        "forecast_days": forecast_days,
        "timezone": timezone_name,
        "timeformat": "iso8601",
        "wind_speed_unit": "kmh",
        "temperature_unit": "celsius",
    }
    r = requests.get(FORECAST_URL, params=params, timeout=30)
    r.raise_for_status()
    return r.json()
