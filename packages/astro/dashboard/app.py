"""Astro Mission Control — Home.

Run with:
    streamlit run dashboard/app.py

Every other page lives in dashboard/pages/ and shows up automatically in the
sidebar navigation above "Mission setup".
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _shared import inject_css, page_header, sidebar_controls  # noqa: E402

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import streamlit as st

from astrodash import planner, sun_moon

st.set_page_config(page_title="Astro Mission Control", page_icon="🛰️", layout="wide")
inject_css()

controls = sidebar_controls()
site, target, equipment, obs_date = controls["site"], controls["target"], controls["equipment"], controls["obs_date"]

page_header("🛰️ Astro Mission Control", "Seeing, sky visibility, telescope fit, weather, aurora, and satellite passes.")

st.write(
    "Use the page list in the sidebar to jump straight to **Plan**, **Night Sky**, **Weather**, **Seeing**, "
    "**Visibility**, **Sun & Moon**, **Telescope FOV**, **Aurora**, or **Satellites**. Your site/equipment/target/date "
    "selections in the sidebar carry over between pages."
)

st.subheader(f"📍 Tonight at {site['name']}")

try:
    result = planner.build_plan(site, target, equipment=equipment, target_date=obs_date)
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Moon illumination", f"{result['moon_phase_percent']:.0f}%")
    c2.metric(
        "Peak target altitude",
        f"{result['target_max_altitude_deg']}°" if result["target_max_altitude_deg"] is not None else "—",
    )
    c3.metric("Window length", f"{result['window_duration_hours']} h")
    c4.metric(
        "Avg seeing proxy",
        f"{result['avg_seeing_proxy_in_window']}/100" if result["avg_seeing_proxy_in_window"] is not None else "—",
    )
    st.info(f"**Verdict for {target['name']}:** {result['verdict']}")
except Exception as e:  # noqa: BLE001
    st.warning(f"Couldn't build a quick summary: {e}")

st.divider()
st.markdown(
    """
**Pages at a glance:**
- 📋 **Plan** — the headline recommendation, all signals combined.
- 🔭 **Night Sky** — a live dome view of the sky right now, or at any time you choose.
- 🌦️ **Weather** — cloud layers, temperature, dew point, wind, precipitation, with icons.
- 🌡️ **Seeing** — atmospheric seeing for your chosen target, factoring in airmass and dew risk.
- 🎯 **Visibility** — altitude/airmass track through the night and the best observing window.
- 🌙 **Sun & Moon** — rise/set/phase for the week ahead.
- 🔬 **Telescope FOV** — magnification, exit pupil, and field-of-view fit per eyepiece.
- 🌌 **Aurora** *(beta)* — live NOAA OVATION probability plus a UK-specific geomagnetic activity index.
- 🛰️ **Satellites** *(beta)* — search the full Celestrak catalog, passes in the next 24h with estimated magnitude and a ground-track map.
- 🌆 **Light Pollution** *(beta)* — estimated Bortle scale from an offline population model.
- 🌗 **Eclipses** — lunar and solar eclipse planner: contact times, umbra/penumbra circumstances, and local visibility for your site.
    """
)
