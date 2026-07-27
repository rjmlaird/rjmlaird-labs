"""WMO weather-code -> icon mapping.

Your original weather-icons.py scraped PNGs from a third-party GitHub repo;
that repo's file layout has since changed (404s on the old paths), which
makes it a fragile foundation for a "mission control" dashboard that should
work offline and not silently lose icons when someone reorganises a repo.

Instead this maps each WMO code to (a) an emoji, for zero-dependency display
in the dashboard/CLI, and (b) a simple hand-drawn matplotlib glyph, for
crisp icons in saved PNG charts.
"""
from __future__ import annotations

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.patches import Circle, FancyBboxPatch

# Open-Meteo/WMO weather_code -> icon key.
WMO_TO_ICON = {
    0: "clear", 1: "mostly_clear", 2: "partly_cloudy", 3: "cloudy",
    45: "fog", 48: "fog",
    51: "drizzle", 53: "drizzle", 55: "drizzle", 56: "drizzle", 57: "drizzle",
    61: "rain", 63: "rain", 65: "rain",
    66: "drizzle", 67: "rain",
    71: "snow", 73: "snow", 75: "snow", 77: "snow",
    80: "showers", 81: "showers", 82: "showers",
    85: "snow", 86: "snow",
    95: "thunderstorm", 96: "thunderstorm", 99: "thunderstorm",
}

WMO_DESCRIPTIONS = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Depositing rime fog",
    51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
    56: "Light freezing drizzle", 57: "Dense freezing drizzle",
    61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
    66: "Light freezing rain", 67: "Heavy freezing rain",
    71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow", 77: "Snow grains",
    80: "Slight showers", 81: "Moderate showers", 82: "Violent showers",
    85: "Slight snow showers", 86: "Heavy snow showers",
    95: "Thunderstorm", 96: "Thunderstorm with slight hail", 99: "Thunderstorm with heavy hail",
}

ICON_EMOJI = {
    "clear": "☀️", "mostly_clear": "🌤️", "partly_cloudy": "⛅", "cloudy": "☁️",
    "fog": "🌫️", "drizzle": "🌦️", "rain": "🌧️", "showers": "🌧️",
    "snow": "❄️", "thunderstorm": "⛈️", "unknown": "❔",
}


def icon_key_for_code(code: int) -> str:
    return WMO_TO_ICON.get(int(code), "unknown")


def description_for_code(code: int) -> str:
    return WMO_DESCRIPTIONS.get(int(code), "Unknown")


def emoji_for_code(code: int) -> str:
    return ICON_EMOJI.get(icon_key_for_code(code), "❔")


def draw_icon(ax, code: int) -> None:
    """Draw a simple, crisp weather glyph onto a matplotlib axis (for saved PNGs)."""
    ax.set_xlim(-1, 1)
    ax.set_ylim(-1, 1)
    ax.set_aspect("equal")
    ax.axis("off")
    key = icon_key_for_code(code)

    sun_color, cloud_color, rain_color, snow_color = "#f59e0b", "#94a3b8", "#3b82f6", "#93c5fd"

    def cloud(cx=0.0, cy=-0.15, scale=1.0, color=cloud_color):
        for dx, dy, r in [(-0.35, 0.0, 0.28), (0.0, 0.12, 0.34), (0.35, 0.0, 0.26), (0.0, -0.12, 0.30)]:
            ax.add_patch(Circle((cx + dx * scale, cy + dy * scale), r * scale, color=color, zorder=3))

    def sun(cx=0.0, cy=0.0, r=0.35):
        ax.add_patch(Circle((cx, cy), r, color=sun_color, zorder=2))
        for i in range(8):
            a = i * np.pi / 4
            x0, y0 = cx + (r + 0.08) * np.cos(a), cy + (r + 0.08) * np.sin(a)
            x1, y1 = cx + (r + 0.28) * np.cos(a), cy + (r + 0.28) * np.sin(a)
            ax.plot([x0, x1], [y0, y1], color=sun_color, lw=2.2, zorder=1)

    def rain(n=4, color=rain_color, y0=-0.55):
        xs = np.linspace(-0.4, 0.4, n)
        for x in xs:
            ax.plot([x, x - 0.08], [y0, y0 - 0.22], color=color, lw=2.2, zorder=4)

    def snow(n=4, y0=-0.55):
        xs = np.linspace(-0.4, 0.4, n)
        for x in xs:
            ax.plot(x, y0 - 0.1, marker="*", color=snow_color, markersize=9, zorder=4)

    def bolt():
        ax.plot([0.05, -0.15, 0.05, -0.1], [-0.35, -0.55, -0.55, -0.8], color="#facc15", lw=2.4, zorder=4)

    if key == "clear":
        sun(r=0.5)
    elif key == "mostly_clear":
        sun(cx=-0.15, cy=0.15, r=0.32)
        cloud(cx=0.15, cy=-0.25, scale=0.75)
    elif key == "partly_cloudy":
        sun(cx=-0.2, cy=0.2, r=0.3)
        cloud(cx=0.1, cy=-0.2, scale=0.85)
    elif key == "cloudy":
        cloud(scale=1.05)
    elif key == "fog":
        for y in (-0.15, 0.05, 0.25, -0.35):
            ax.plot([-0.5, 0.5], [y, y], color=cloud_color, lw=3, alpha=0.7, zorder=3)
    elif key == "drizzle":
        cloud(cy=0.05, scale=0.9)
        rain(n=3, y0=-0.35)
    elif key in ("rain", "showers"):
        cloud(cy=0.05, scale=0.95)
        rain(n=4, y0=-0.35)
    elif key == "snow":
        cloud(cy=0.05, scale=0.95)
        snow(n=4, y0=-0.35)
    elif key == "thunderstorm":
        cloud(cy=0.1, scale=0.95)
        bolt()
    else:
        ax.text(0, 0, "?", ha="center", va="center", fontsize=28, color=cloud_color)


def icon_figure(code: int, size=1.4):
    fig, ax = plt.subplots(figsize=(size, size))
    draw_icon(ax, code)
    fig.tight_layout(pad=0)
    return fig
