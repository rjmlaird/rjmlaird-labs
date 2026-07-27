"""Shared setup for every Mission Control page: repo path wiring, dark theme
CSS, and the sidebar controls (site/equipment/target/date), kept in
st.session_state so selections persist as you move between pages.
"""
from __future__ import annotations

import sys
import warnings
from datetime import date
from pathlib import Path

warnings.filterwarnings("ignore", module="astropy")

REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

import streamlit as st

from astrodash import config

MISSION_CSS = """
<style>
.stApp { background-color: #0b1020; }
section[data-testid="stSidebar"] { background-color: #0f1629; }
h1, h2, h3, .stMarkdown, p, label, span { color: #e2e8f0 !important; }
div[data-testid="stMetricValue"] { color: #22d3ee !important; }
</style>
"""


def inject_css() -> None:
    st.markdown(MISSION_CSS, unsafe_allow_html=True)


def sidebar_controls() -> dict:
    """Renders the sidebar and returns the current selections. Every widget
    has a fixed `key=` so Streamlit's session_state keeps the value in sync
    across every page in the multipage app."""
    with st.sidebar:
        st.header("🛰️ Mission setup")

        sites = config.load_sites()
        site_names = [s["name"] for s in sites] + ["Custom location…"]
        site_choice = st.selectbox("Observing site", site_names, key="site_choice")

        if site_choice == "Custom location…":
            col1, col2 = st.columns(2)
            lat = col1.number_input("Latitude", value=52.6369, format="%.4f", key="custom_lat")
            lon = col2.number_input("Longitude", value=-1.1398, format="%.4f", key="custom_lon")
            elevation_m = st.number_input("Elevation (m)", value=0.0, key="custom_elev")
            tz = st.text_input("Timezone (IANA name)", value="UTC", key="custom_tz")
            site = config.custom_site(lat, lon, elevation_m, timezone=tz)
        else:
            site = config.get_site(site_choice)

        st.divider()

        equipment_list = config.load_equipment()
        equipment_choice = st.selectbox(
            "Equipment", ["(none)"] + [e["name"] for e in equipment_list], key="equipment_choice"
        )
        equipment = config.get_equipment(equipment_choice) if equipment_choice != "(none)" else None

        targets = [t for t in config.load_targets() if t.get("kind") != "moon"]
        target_choice = st.selectbox("Target", [t["name"] for t in targets], key="target_choice")
        target = config.find_by_name(targets, target_choice)

        obs_date = st.date_input("Date", value=date.today(), key="obs_date")
        min_alt = st.slider("Minimum useful altitude (deg)", 10, 60, 30, key="min_alt")

        st.divider()
        forecast_days = st.slider("Weather forecast days", 1, 7, 2, key="forecast_days")
        run_weather = st.checkbox("Fetch live weather forecast (needs internet)", value=True, key="run_weather")

        st.divider()
        st.caption("Use the page list above to jump between Plan / Night Sky / Weather / Seeing / etc.")

    return {
        "site": site,
        "equipment": equipment,
        "target": target,
        "targets": targets,
        "obs_date": obs_date,
        "min_alt": min_alt,
        "forecast_days": forecast_days,
        "run_weather": run_weather,
    }


def page_header(title: str, caption: str | None = None) -> None:
    st.title(title)
    if caption:
        st.caption(caption)
