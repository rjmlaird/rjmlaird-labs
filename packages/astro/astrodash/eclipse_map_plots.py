# astrodash/eclipse_map_plots.py
"""
Plotting utilities for eclipse paths on 2D globes and close-up maps.

Provides:
  - eclipse_path_globe: global equirectangular map with eclipse path,
                        northern/southern limits, home location, and max-eclipse point.
  - eclipse_path_closeup: zoomed-in map around the center of the path.

Supports:
  - Total/annular (umbral) paths: dark central line, dashed umbral limits.
  - Partial (penumbral) paths: lighter, wider band, dashed penumbral limits.
"""

from typing import Optional

import plotly.graph_objects as go

from .eclipse_maps import EclipsePath


def eclipse_path_globe(
    path: EclipsePath,
    home_lat: float,
    home_lon: float,
    home_name: str = "Home",
    max_lat: Optional[float] = None,
    max_lon: Optional[float] = None,
    max_label: str = "Max eclipse",
) -> go.Figure:
    """
    Create a 2D equirectangular globe showing:

      - Path of eclipse (total/annular or partial) as a line.
      - Northern and southern limits (umbral or penumbral) as dashed lines.
      - Home location (e.g. Leicester) as a red marker.
      - Optional maximum-eclipse point as a gold marker.

    Parameters
    ----------
    path : EclipsePath
        Eclipse path data with central line and N/S limits.
    home_lat : float
        Latitude of home location in degrees.
    home_lon : float
        Longitude of home location in degrees.
    home_name : str, optional
        Label for the home location marker.
    max_lat : float, optional
        Latitude of maximum eclipse point in degrees.
    max_lon : float, optional
        Longitude of maximum eclipse point in degrees.
    max_label : str, optional
        Label for the maximum eclipse marker.

    Returns
    -------
    go.Figure
        Plotly figure with the global eclipse map.
    """
    fig = go.Figure()

    # Determine styling based on partial vs total/annular
    if path.is_partial:
        # Penumbral (partial) path: lighter, wider
        central_color = "#555555"
        central_width = 2
        limit_color = "#777777"
        limit_width = 1.5
        central_name = "Penumbral path (partial eclipse)"
        limit_name_prefix = "Penumbral"
    else:
        # Umbral (total/annular) path: dark, thin
        central_color = "black"
        central_width = 2
        limit_color = "#000000"
        limit_width = 1.2
        central_name = f"Path of {path.eclipse_type}ity"
        limit_name_prefix = "Umbral"

    # Central line
    if path.central_lats and path.central_lons:
        fig.add_trace(
            go.Scattergeo(
                lon=path.central_lons,
                lat=path.central_lats,
                mode="lines",
                line=dict(color=central_color, width=central_width),
                name=central_name,
            )
        )

    # Northern limit
    if path.north_lats and path.north_lons:
        fig.add_trace(
            go.Scattergeo(
                lon=path.north_lons,
                lat=path.north_lats,
                mode="lines",
                line=dict(color=limit_color, width=limit_width, dash="dash"),
                name=f"{limit_name_prefix} northern limit",
                opacity=0.8,
            )
        )

    # Southern limit
    if path.south_lats and path.south_lons:
        fig.add_trace(
            go.Scattergeo(
                lon=path.south_lons,
                lat=path.south_lats,
                mode="lines",
                line=dict(color=limit_color, width=limit_width, dash="dash"),
                name=f"{limit_name_prefix} southern limit",
                opacity=0.8,
            )
        )

    # Home location marker
    fig.add_trace(
        go.Scattergeo(
            lon=[home_lon],
            lat=[home_lat],
            mode="markers+text",
            marker=dict(size=10, color="red"),
            text=[home_name],
            textposition="top center",
            name=home_name,
        )
    )

    # Maximum eclipse point marker
    if max_lat is not None and max_lon is not None:
        fig.add_trace(
            go.Scattergeo(
                lon=[max_lon],
                lat=[max_lat],
                mode="markers+text",
                marker=dict(size=10, color="gold"),
                text=[max_label],
                textposition="top center",
                name=max_label,
            )
        )

    # Base map styling
    fig.update_geos(
        projection_type="equirectangular",
        showland=True,
        landcolor="#f0f0f0",
        oceancolor="#d0e8ff",
        showcoastlines=True,
        coastlinecolor="#888888",
        showcountries=True,
        countrycolor="#666666",
    )

    fig.update_layout(
        margin=dict(l=0, r=0, t=40, b=0),
        height=500,
        geo=dict(showframe=False, bgcolor="white"),
        legend=dict(x=0, y=1),
    )

    return fig


def eclipse_path_closeup(
    path: EclipsePath,
    center_lat: float,
    center_lon: float,
    width_deg: float = 10.0,
    home_lat: Optional[float] = None,
    home_lon: Optional[float] = None,
    home_name: str = "Home",
) -> go.Figure:
    """
    Create a zoomed-in equirectangular map around the center of the eclipse path.

    Shows:
      - Eclipse path (total/annular or partial) as a line.
      - Northern and southern limits (umbral or penumbral) as dashed lines.
      - Optional home location marker.

    Parameters
    ----------
    path : EclipsePath
        Eclipse path data with central line and N/S limits.
    center_lat : float
        Center latitude of the close-up map in degrees.
    center_lon : float
        Center longitude of the close-up map in degrees.
    width_deg : float, optional
        Total width and height of the map in degrees.
    home_lat : float, optional
        Latitude of home location in degrees.
    home_lon : float, optional
        Longitude of home location in degrees.
    home_name : str, optional
        Label for the home location marker.

    Returns
    -------
    go.Figure
        Plotly figure with the zoomed-in eclipse map.
    """
    fig = go.Figure()

    if path.is_partial:
        central_color = "#555555"
        central_width = 2.5
        limit_color = "#777777"
        limit_width = 2
        central_name = "Penumbral path (partial eclipse)"
        limit_name_prefix = "Penumbral"
    else:
        central_color = "black"
        central_width = 2.5
        limit_color = "#000000"
        limit_width = 1.5
        central_name = f"Path of {path.eclipse_type}ity"
        limit_name_prefix = "Umbral"

    # Central line
    if path.central_lats and path.central_lons:
        fig.add_trace(
            go.Scattergeo(
                lon=path.central_lons,
                lat=path.central_lats,
                mode="lines",
                line=dict(color=central_color, width=central_width),
                name=central_name,
            )
        )

    # Northern limit
    if path.north_lats and path.north_lons:
        fig.add_trace(
            go.Scattergeo(
                lon=path.north_lons,
                lat=path.north_lats,
                mode="lines",
                line=dict(color=limit_color, width=limit_width, dash="dash"),
                name=f"{limit_name_prefix} northern limit",
                opacity=0.8,
            )
        )

    # Southern limit
    if path.south_lats and path.south_lons:
        fig.add_trace(
            go.Scattergeo(
                lon=path.south_lons,
                lat=path.south_lats,
                mode="lines",
                line=dict(color=limit_color, width=limit_width, dash="dash"),
                name=f"{limit_name_prefix} southern limit",
                opacity=0.8,
            )
        )

    # Home location marker
    if home_lat is not None and home_lon is not None:
        fig.add_trace(
            go.Scattergeo(
                lon=[home_lon],
                lat=[home_lat],
                mode="markers+text",
                marker=dict(size=10, color="red"),
                text=[home_name],
                textposition="top center",
                name=home_name,
            )
        )

    # Map bounds
    lon_min = center_lon - width_deg / 2
    lon_max = center_lon + width_deg / 2
    lat_min = center_lat - width_deg / 2
    lat_max = center_lat + width_deg / 2

    # Base map styling
    fig.update_geos(
        projection_type="equirectangular",
        showland=True,
        landcolor="#f0f0f0",
        oceancolor="#d0e8ff",
        showcoastlines=True,
        coastlinecolor="#888888",
        showcountries=True,
        countrycolor="#666666",
        lonaxis=dict(range=[lon_min, lon_max]),
        lataxis=dict(range=[lat_min, lat_max]),
    )

    fig.update_layout(
        margin=dict(l=0, r=0, t=40, b=0),
        height=400,
        geo=dict(showframe=False, bgcolor="white"),
        legend=dict(x=0, y=1),
    )

    return fig
