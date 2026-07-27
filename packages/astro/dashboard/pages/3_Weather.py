import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from _shared import inject_css, page_header, sidebar_controls  # noqa: E402

import streamlit as st

from astrodash import plotting, seeing

st.set_page_config(page_title="Weather - Mission Control", page_icon="🌦️", layout="wide")
inject_css()
controls = sidebar_controls()
site = controls["site"]

page_header("🌦️ Weather", f"{site['name']} — cloud, temperature, wind, and precipitation.")

if not controls["run_weather"]:
    st.info("Enable 'Fetch live weather forecast' in the sidebar to see this page.")
else:
    try:
        df = seeing.forecast_seeing(site, forecast_days=controls["forecast_days"])
        fig = plotting.weather_detail_figure(df, site["name"])
        st.pyplot(fig, clear_figure=True)

        cols = [
            "time", "cloud_cover", "cloud_cover_low", "cloud_cover_mid", "cloud_cover_high",
            "temperature_c", "dew_point_c", "humidity", "wind_speed_kmh", "wind_gust_kmh",
            "precipitation_probability", "precipitation_mm", "visibility_m",
        ]
        st.dataframe(df[cols], width="stretch", height=320)
        st.caption("Atmospheric seeing (turbulence/transparency scoring) now lives on its own **Seeing** page.")
    except Exception as e:  # noqa: BLE001
        st.error(f"Couldn't fetch weather data: {e}")
