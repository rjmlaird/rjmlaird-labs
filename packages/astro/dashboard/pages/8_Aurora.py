import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from _shared import inject_css, page_header, sidebar_controls  # noqa: E402

import streamlit as st

from astrodash import aurora, plotting

st.set_page_config(page_title="Aurora - Mission Control", page_icon="🌌", layout="wide")
inject_css()
controls = sidebar_controls()
site = controls["site"]

page_header("🌌 Aurora Outlook", "Global OVATION probability plus a UK-specific geomagnetic activity index. (beta)")

tab_global, tab_uk = st.tabs(["🌍 Global (OVATION)", "🇬🇧 UK activity index"])

with tab_global:
    if st.button("Check current aurora outlook"):
        try:
            result = aurora.current_aurora_outlook(site)
            kp = aurora.latest_kp()

            c1, c2, c3 = st.columns(3)
            c1.metric("Probability at your site", f"{result['probability_pct']}%")
            c2.metric("Planetary Kp (secondary signal)", kp["kp"])
            c3.metric("Dark now?", "Yes" if result["is_dark_now"] else "No")
            st.info(result["verdict"])
            st.caption(f"Observed {result['observation_time']}, forecast for {result['forecast_time']}.")

            data = aurora.fetch_ovation()
            matrix = aurora.grid_matrix(data)
            hemisphere = "north" if float(site["lat"]) >= 0 else "south"
            fig = plotting.aurora_map_figure(matrix, site, hemisphere=hemisphere)
            st.pyplot(fig, clear_figure=True)
        except Exception as e:  # noqa: BLE001
            st.error(f"Couldn't fetch aurora data: {e}")
    st.caption(
        "OVATION is a now/next-90-minutes nowcast, not a multi-night forecast. The planetary Kp "
        "shown alongside is a useful secondary signal but isn't location-specific."
    )

with tab_uk:
    st.write(
        "AuroraWatch UK (Lancaster University) runs a network of UK magnetometers and publishes an "
        "hourly geomagnetic activity index in nanotesla (nT), updated every few minutes. This is "
        "calibrated specifically for UK aurora visibility — more relevant here than the global Kp index."
    )
    if st.button("Check UK activity index"):
        try:
            outlook = aurora.uk_aurora_outlook(site)
            activity = aurora.fetch_uk_activity()

            status_color = {"green": "🟢", "yellow": "🟡", "amber": "🟠", "red": "🔴"}
            c1, c2 = st.columns(2)
            c1.metric("Current alert level", f"{status_color.get(outlook['status_id'], '')} {outlook['status_id'].capitalize()}")
            c2.metric("Dark now at your site?", "Yes" if outlook["is_dark_now"] else "No")
            st.info(outlook["verdict"])

            fig = plotting.uk_aurora_activity_figure(activity)
            st.pyplot(fig, clear_figure=True)
            st.caption(
                "Bars show the maximum activity index reached each hour, coloured by alert level. "
                "The y-axis scales to just past the next alert level up, matching AuroraWatch UK's own chart."
            )
        except Exception as e:  # noqa: BLE001
            st.error(f"Couldn't fetch UK activity data: {e}")
    st.caption(
        "Data: AuroraWatch UK, Lancaster University (aurorawatch.lancs.ac.uk). Most useful for UK and "
        "nearby European sites — elsewhere, use the Global tab."
    )
