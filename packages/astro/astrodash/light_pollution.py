"""Light pollution / Bortle-scale estimate, from an offline population model.

There's no free, keyless API for authoritative VIIRS-based sky brightness —
sites like lightpollutionmap.info serve a rendered map or multi-hundred-MB
GeoTIFFs (David Lorenz's World Atlas), not a queryable API. This module
instead estimates light pollution using Walker's Law (Walker, 1977) — an
empirical relationship between a city's population, its distance, and how
much it brightens the night sky — summed over every nearby city using a
bundled offline GeoNames dataset (the `geonamescache` package).

This is a genuine physical heuristic, not a lookup of measured sky
brightness. It's useful for a quick "roughly how bad is it here" signal and
for comparing sites, but it isn't a substitute for the real thing — for an
authoritative map, see https://www.lightpollutionmap.info/.
"""
from __future__ import annotations

import math
from functools import lru_cache

import geonamescache

EARTH_RADIUS_KM = 6371.0
SEARCH_RADIUS_KM = 250.0
MIN_CITY_POPULATION = 20_000  # smaller settlements add noise without much real skyglow signal
WALKER_EXPONENT_DISTANCE = 2.5  # Walker's Law: sky brightening ~ population / distance^2.5
CALIBRATION_K = 1.0

# Brightness-score breakpoints mapping onto Bortle 2-9 (anything below the
# first breakpoint is Bortle 1). Calibrated against known real-world sites:
# central London/Manchester -> 9, a small city centre -> 8, a rural village
# within reach of city glow -> 5, a designated dark-sky park -> 3-4, remote
# countryside -> 2, no significant population within range -> 1.
_BREAKPOINTS = [2, 8, 20, 60, 250, 900, 2000, 5000]

BORTLE_DESCRIPTIONS = {
    1: "Excellent dark sky — the Milky Way casts shadows, zodiacal light is visible.",
    2: "Typical dark sky — the Milky Way shows real structure, M33 is visible to the naked eye.",
    3: "Rural sky — the Milky Way is still impressive, with some light pollution near the horizon.",
    4: "Rural/suburban transition — the Milky Way is visible but loses structure near the horizon.",
    5: "Suburban sky — the Milky Way is washed out near the horizon, still visible overhead.",
    6: "Bright suburban sky — the Milky Way is very washed out, barely visible overhead.",
    7: "Suburban/urban transition — the Milky Way is essentially invisible.",
    8: "City sky — the sky glows grey or orange; only bright Messier objects show through a telescope.",
    9: "Inner-city sky — only the Moon, planets, and the brightest stars are visible.",
}


@lru_cache(maxsize=1)
def _cities() -> list[dict]:
    gc = geonamescache.GeonamesCache(min_city_population=500)
    return [c for c in gc.get_cities().values() if c["population"] >= MIN_CITY_POPULATION]


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlambda / 2) ** 2
    return 2 * EARTH_RADIUS_KM * math.asin(math.sqrt(a))


def _city_radius_km(population: int) -> float:
    """A city isn't a point source once you're inside it — approximate its
    built-up radius from population so 'distance' saturates sensibly instead
    of blowing up as you approach the city's own coordinate pin."""
    return max(1.5, (population / 3000.0) ** 0.5)


def nearby_light_sources(lat: float, lon: float, radius_km: float = SEARCH_RADIUS_KM) -> list[dict]:
    """Cities within radius_km, each with its Walker's-Law contribution to
    local sky brightening, sorted by contribution (biggest influence first)."""
    results = []
    for city in _cities():
        d = _haversine_km(lat, lon, city["latitude"], city["longitude"])
        if d <= radius_km:
            d_eff = max(d, _city_radius_km(city["population"]))
            contribution = city["population"] / (d_eff ** WALKER_EXPONENT_DISTANCE)
            results.append({
                "name": city["name"],
                "population": city["population"],
                "distance_km": round(d, 1),
                "contribution": contribution,
            })
    results.sort(key=lambda r: -r["contribution"])
    return results


def estimate_bortle(lat: float, lon: float) -> dict:
    sources = nearby_light_sources(lat, lon)
    # Summing every matching town within range double-counts in densely
    # populated regions (the UK alone has hundreds of >20k towns within
    # 250km of almost anywhere) — Walker's Law describes the effect of a
    # dominant nearby source, so only the handful of biggest contributors
    # are combined here.
    top_sources = sources[:3]
    total_contribution = sum(s["contribution"] for s in top_sources)
    brightness_score = CALIBRATION_K * total_contribution

    bortle = 1
    for bp in _BREAKPOINTS:
        if brightness_score > bp:
            bortle += 1
    bortle = min(bortle, 9)

    return {
        "bortle": bortle,
        "description": BORTLE_DESCRIPTIONS[bortle],
        "brightness_score": round(brightness_score, 4),
        "dominant_source": sources[0] if sources else None,
        "nearby_sources": sources[:5],
        "caveat": (
            "Estimated from an offline population/distance model (Walker's Law), not measured "
            "satellite sky-brightness data. For an authoritative map, see lightpollutionmap.info."
        ),
    }
