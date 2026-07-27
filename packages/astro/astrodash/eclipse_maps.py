# astrodash/eclipse_maps.py
"""
Geometric computation of solar eclipse paths on Earth.

Provides:
  - EclipsePath dataclass holding central line and northern/southern limits.
  - solar_eclipse_path() for total/annular eclipses (umbral path).
  - solar_eclipse_path_partial() for partial eclipses (penumbral path).

Uses:
  - Skyfield for Sun/Moon positions in ITRS (Earth-fixed) frame.
  - WGS84 ellipsoid for Earth shape.
  - Shadow-axis intersection with the ellipsoid to get the central line.
  - Umbral/penumbral cone geometry to estimate path width and derive N/S limits.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from skyfield.api import load

ts = load.timescale()
eph = load("de421.bsp")
sun = eph["Sun"]
moon = eph["Moon"]
earth = eph["Earth"]

# WGS84 parameters
EARTH_EQUATORIAL_RADIUS_M = 6378137.0
EARTH_FLATTENING = 1.0 / 298.257223563
EARTH_POLAR_RADIUS_M = EARTH_EQUATORIAL_RADIUS_M * (1.0 - EARTH_FLATTENING)


@dataclass
class EclipsePath:
    """
    Path of a solar eclipse on Earth's surface.

    For total/annular eclipses:
      - central line = path of greatest eclipse (umbral axis intersection).
      - north/south = umbral limits (totality/annularity edges).

    For partial eclipses:
      - central line = path of greatest eclipse (penumbral axis approximation).
      - north/south = approximate penumbral limits (where any eclipse is visible).

    All lats/lons in degrees. Times are datetimes (UTC).
    """

    central_lats: List[float]
    central_lons: List[float]
    times: List[datetime]
    north_lats: Optional[List[float]] = None
    north_lons: Optional[List[float]] = None
    south_lats: Optional[List[float]] = None
    south_lons: Optional[List[float]] = None
    eclipse_type: str = "partial"  # 'partial', 'total', or 'annular'
    is_partial: bool = True  # True for partial-only, False for total/annular


def _geocentric_to_geodetic(x: float, y: float, z: float) -> Tuple[float, float, float]:
    """
    Convert ECEF (x,y,z) in meters to geodetic (lat, lon, h) using a simple
    iterative method. Returns (lat_deg, lon_deg, h_m).
    """
    lon = math.atan2(y, x)

    p = math.hypot(x, y)
    lat = math.atan2(z, p * (1.0 - EARTH_FLATTENING))
    for _ in range(5):
        N = EARTH_EQUATORIAL_RADIUS_M / math.sqrt(
            1.0 - (2 * EARTH_FLATTENING - EARTH_FLATTENING**2) * math.sin(lat) ** 2
        )
        h = p / math.cos(lat) - N
        lat = math.atan2(z, p * (1.0 - EARTH_FLATTENING * N / (N + h)))

    lat_deg = math.degrees(lat)
    lon_deg = math.degrees(lon)
    if lon_deg > 180:
        lon_deg -= 360
    h_m = h
    return lat_deg, lon_deg, h_m


def _geodetic_to_geocentric(
    lat_deg: float, lon_deg: float, h_m: float = 0.0
) -> Tuple[float, float, float]:
    """
    Convert geodetic (lat, lon, h) to ECEF (x, y, z) in meters.
    """
    lat = math.radians(lat_deg)
    lon = math.radians(lon_deg)

    e2 = 2 * EARTH_FLATTENING - EARTH_FLATTENING**2
    N = EARTH_EQUATORIAL_RADIUS_M / math.sqrt(1 - e2 * math.sin(lat) ** 2)

    x = (N + h_m) * math.cos(lat) * math.cos(lon)
    y = (N + h_m) * math.cos(lat) * math.sin(lon)
    z = (N * (1 - e2) + h_m) * math.sin(lat)

    return x, y, z


def _shadow_axis_and_radii(t):
    """
    For a given Skyfield time t, compute:
      - p0, p1: two points on the shadow axis in ECEF (m)
      - sun_dir, moon_dir: unit vectors from Earth center to Sun/Moon in ECEF
      - sun_radius_rad, moon_radius_rad: apparent angular radii (radians)
    """
    # ITRS positions (km) – correct Skyfield API usage
    sun_itrs_km = sun.at(t).position.itrs().km
    moon_itrs_km = moon.at(t).position.itrs().km

    sun_pos = np.array(sun_itrs_km) * 1000.0  # m
    moon_pos = np.array(moon_itrs_km) * 1000.0  # m

    # Distances from Earth center
    r_sun = np.linalg.norm(sun_pos)
    r_moon = np.linalg.norm(moon_pos)

    # Unit vectors
    sun_dir = sun_pos / r_sun
    moon_dir = moon_pos / r_moon

    # Physical radii
    R_sun = 696340000.0  # m
    R_moon = 1737400.0  # m

    # Apparent angular radii
    sun_radius_rad = math.atan2(R_sun, r_sun)
    moon_radius_rad = math.atan2(R_moon, r_moon)

    # Shadow axis direction (from Sun to Moon)
    axis_dir = moon_pos - sun_pos
    axis_dir = axis_dir / np.linalg.norm(axis_dir)

    # Two points on the axis
    p0 = moon_pos
    p1 = moon_pos + EARTH_EQUATORIAL_RADIUS_M * axis_dir

    return p0, p1, sun_dir, moon_dir, sun_radius_rad, moon_radius_rad


def _line_ellipsoid_intersection(
    p0: np.ndarray,
    p1: np.ndarray,
) -> Optional[Tuple[np.ndarray, np.ndarray]]:
    """
    Intersect the line p(t) = p0 + t*(p1-p0) with the WGS84 ellipsoid:
      x^2/a^2 + y^2/a^2 + z^2/b^2 = 1

    Returns up to two intersection points (as ECEF vectors in meters),
    or None if no real intersection.
    """
    a = EARTH_EQUATORIAL_RADIUS_M
    b = EARTH_POLAR_RADIUS_M

    d = p1 - p0
    dx, dy, dz = d
    x0, y0, z0 = p0

    A = (dx * dx + dy * dy) / (a * a) + (dz * dz) / (b * b)
    B = 2.0 * (x0 * dx + y0 * dy) / (a * a) + 2.0 * (z0 * dz) / (b * b)
    C = (x0 * x0 + y0 * y0) / (a * a) + (z0 * z0) / (b * b) - 1.0

    disc = B * B - 4.0 * A * C
    if disc < 0:
        return None

    sqrt_disc = math.sqrt(disc)
    t1 = (-B - sqrt_disc) / (2.0 * A)
    t2 = (-B + sqrt_disc) / (2.0 * A)

    pts = []
    for t_val in (t1, t2):
        pt = p0 + t_val * d
        pts.append(pt)

    return pts[0], pts[1]


def _umbral_radius_at_surface(
    sun_radius_rad: float,
    moon_radius_rad: float,
    surface_point: np.ndarray,
    moon_pos: np.ndarray,
    axis_dir: np.ndarray,
) -> float:
    """
    Approximate umbral radius at the Earth's surface.

    For a total eclipse: moon_radius > sun_radius, umbra converges.
    For an annular eclipse: moon_radius < sun_radius, antumbra diverges.

    We approximate the umbra as a cone with half-angle:
      alpha = moon_radius_rad - sun_radius_rad

    Then at a distance L along the axis from the Moon, the radius is:
      R_umbra ≈ L * tan(alpha)

    Here L is the projection of (surface_point - moon_pos) onto axis_dir.
    """
    alpha = moon_radius_rad - sun_radius_rad

    if abs(alpha) < 1e-8:
        return 0.0

    # Vector from Moon to surface point
    s_minus_m = surface_point - moon_pos
    # Distance along axis from Moon to surface point
    L = float(np.dot(s_minus_m, axis_dir))

    R_umbra = abs(L * math.tan(alpha))
    return R_umbra


def _penumbral_radius_at_surface(
    sun_radius_rad: float,
    moon_radius_rad: float,
    surface_point: np.ndarray,
    moon_pos: np.ndarray,
    axis_dir: np.ndarray,
) -> float:
    """
    Approximate penumbral radius at the Earth's surface.

    The penumbra is formed by rays that just graze the Sun and Moon.
    Its half-angle is approximately:
      beta = sun_radius_rad + moon_radius_rad

    Then at a distance L along the axis from the Moon, the radius is:
      R_pen ≈ L * tan(beta)

    Here L is the projection of (surface_point - moon_pos) onto axis_dir.
    """
    beta = sun_radius_rad + moon_radius_rad

    if abs(beta) < 1e-8:
        return 0.0

    s_minus_m = surface_point - moon_pos
    L = float(np.dot(s_minus_m, axis_dir))

    R_pen = abs(L * math.tan(beta))
    return R_pen


def _compute_path(
    dt_start: datetime,
    dt_end: datetime,
    step_seconds: int,
    use_umbra: bool,
    eclipse_event: Dict[str, Any],
) -> EclipsePath:
    """
    Internal helper to compute eclipse path (umbral or penumbral).

    use_umbra:
      - True  -> compute umbral path (total/annular).
      - False -> compute penumbral path (partial).
    """
    etype = eclipse_event.get("type", "").lower()
    if use_umbra:
        if "total" in etype:
            eclipse_type = "total"
        elif "annular" in etype:
            eclipse_type = "annular"
        else:
            return EclipsePath(
                central_lats=[],
                central_lons=[],
                times=[],
                eclipse_type=etype,
                is_partial=True,
            )
    else:
        eclipse_type = etype

    t_start = ts.from_datetime(dt_start - timedelta(minutes=10))
    t_end = ts.from_datetime(dt_end + timedelta(minutes=10))
    step = timedelta(seconds=step_seconds)

    central_lats: List[float] = []
    central_lons: List[float] = []
    north_lats: List[float] = []
    north_lons: List[float] = []
    south_lats: List[float] = []
    south_lons: List[float] = []
    times: List[datetime] = []

    # Use Julian date for comparison (Skyfield Time objects don't support <=)
    t = t_start
    end_jd = t_end.tt  # Terrestrial Time Julian date as float

    # Small epsilon to avoid floating-point edge issues
    while t.tt <= end_jd + 1e-9:
        p0, p1, sun_dir, moon_dir, sun_radius_rad, moon_radius_rad = _shadow_axis_and_radii(t)

        # Intersection with Earth for central line
        intersections = _line_ellipsoid_intersection(p0, p1)
        if intersections is None:
            t = t + step
            continue

        # Choose one intersection as central point (e.g., first)
        pt_c = intersections[0]

        # Distance Earth center to Moon and Moon position vector
        moon_itrs_km = moon.at(t).position.itrs().km
        moon_pos_vec = np.array(moon_itrs_km) * 1000.0

        if use_umbra:
            R_shadow = _umbral_radius_at_surface(
                sun_radius_rad,
                moon_radius_rad,
                pt_c,
                moon_pos_vec,
                p1 - p0,
            )
        else:
            R_shadow = _penumbral_radius_at_surface(
                sun_radius_rad,
                moon_radius_rad,
                pt_c,
                moon_pos_vec,
                p1 - p0,
            )

        # Convert central point to geodetic
        lat_c, lon_c, _ = _geocentric_to_geodetic(pt_c[0], pt_c[1], pt_c[2])

        lat_c_rad = math.radians(lat_c)
        lon_c_rad = math.radians(lon_c)

        # Local ENU unit vectors in ECEF:
        # East
        e_east = np.array([-math.sin(lon_c_rad), math.cos(lon_c_rad), 0.0])
        # North
        e_north = np.array(
            [
                -math.sin(lat_c_rad) * math.cos(lon_c_rad),
                -math.sin(lat_c_rad) * math.sin(lon_c_rad),
                math.cos(lat_c_rad),
            ]
        )
        # Up (radial)
        e_up = np.array(
            [
                math.cos(lat_c_rad) * math.cos(lon_c_rad),
                math.cos(lat_c_rad) * math.sin(lon_c_rad),
                math.sin(lat_c_rad),
            ]
        )

        # Shadow axis direction
        axis_dir = p1 - p0
        axis_dir = axis_dir / np.linalg.norm(axis_dir)

        # Project axis onto tangent plane (remove up component)
        axis_tan = axis_dir - np.dot(axis_dir, e_up) * e_up
        norm_axis_tan = np.linalg.norm(axis_tan)
        if norm_axis_tan < 1e-8:
            perp_dir = e_east
        else:
            axis_tan = axis_tan / norm_axis_tan
            perp_dir = np.cross(e_up, axis_tan)
            perp_dir = perp_dir / np.linalg.norm(perp_dir)

        def offset_point(pt, direction, distance):
            pt_off = pt + direction * distance
            lat_off, lon_off, _ = _geocentric_to_geodetic(
                pt_off[0], pt_off[1], pt_off[2]
            )
            x, y, z = _geodetic_to_geocentric(lat_off, lon_off, 0.0)
            return np.array([x, y, z])

        pt_n = offset_point(pt_c, perp_dir, R_shadow)
        pt_s = offset_point(pt_c, -perp_dir, R_shadow)

        lat_n, lon_n, _ = _geocentric_to_geodetic(pt_n[0], pt_n[1], pt_n[2])
        lat_s, lon_s, _ = _geocentric_to_geodetic(pt_s[0], pt_s[1], pt_s[2])

        central_lats.append(lat_c)
        central_lons.append(lon_c)
        north_lats.append(lat_n)
        north_lons.append(lon_n)
        south_lats.append(lat_s)
        south_lons.append(lon_s)
        times.append(t.utc_datetime())

        t = t + step

    if not central_lats:
        return EclipsePath(
            central_lats=[],
            central_lons=[],
            times=[],
            eclipse_type=eclipse_type,
            is_partial=not use_umbra,
        )

    return EclipsePath(
        central_lats=central_lats,
        central_lons=central_lons,
        times=times,
        north_lats=north_lats,
        north_lons=north_lons,
        south_lats=south_lats,
        south_lons=south_lons,
        eclipse_type=eclipse_type,
        is_partial=not use_umbra,
    )


def solar_eclipse_path(
    eclipse_event: Dict[str, Any],
    dt_start: datetime,
    dt_end: datetime,
    step_seconds: int = 120,
) -> EclipsePath:
    """
    Compute the path of a total or annular solar eclipse between
    dt_start and dt_end using full geometric shadow-axis intersection,
    including northern and southern umbral limits.

    eclipse_event: dict as returned by your existing eclipses.find_solar_eclipses
    step_seconds: time step along the path (seconds)

    Returns an EclipsePath with central line and N/S umbral limits.
    """
    return _compute_path(dt_start, dt_end, step_seconds, use_umbra=True, eclipse_event=eclipse_event)


def solar_eclipse_path_partial(
    eclipse_event: Dict[str, Any],
    dt_start: datetime,
    dt_end: datetime,
    step_seconds: int = 120,
) -> EclipsePath:
    """
    Compute the path of a partial solar eclipse between
    dt_start and dt_end using penumbral shadow geometry.

    This gives an approximate region where any eclipse is visible
    (penumbral shadow on Earth).

    eclipse_event: dict as returned by your existing eclipses.find_solar_eclipses
    step_seconds: time step along the path (seconds)

    Returns an EclipsePath with central line and N/S penumbral limits.
    """
    return _compute_path(dt_start, dt_end, step_seconds, use_umbra=False, eclipse_event=eclipse_event)
