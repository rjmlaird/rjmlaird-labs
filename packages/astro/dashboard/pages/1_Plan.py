import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from _shared import inject_css, page_header, sidebar_controls  # noqa: E402

import streamlit as st

from astrodash import planner, plotting

st.set_page_config(page_title="Plan - Mission Control", page_icon="📋", layout="wide")
inject_css()
controls = sidebar_controls()
site, target, equipment, obs_date = controls["site"], controls["target"], controls["equipment"], controls["obs_date"]

page_header("📋 Observation Plan", f"{site['name']} — {obs_date.isoformat()}")

try:
    result = planner.build_plan(site, target, equipment=equipment, target_date=obs_date)
except Exception as e:  # noqa: BLE001
    st.error(f"Could not build a plan: {e}")
    result = None

if result:
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

    if result["window_start_local"] is not None:
        st.success(f"Best window: **{result['window_start_local']}** → **{result['window_end_local']}**")
    else:
        st.warning("No usable window: target doesn't clear a useful altitude during astronomical darkness on this date.")

    st.info(f"**Verdict:** {result['verdict']}")

    if result["telescope_fit"]:
        f = result["telescope_fit"]
        fit_text = "fits comfortably" if f["fits_in_fov"] else "will not fully fit"
        st.write(
            f"With **{f['equipment']}** at {f['magnification_x']}x (TFOV {f['tfov_arcmin']}'), "
            f"**{target['name']}** {fit_text} in the eyepiece field of view."
        )
    else:
        st.caption("Pick a piece of equipment in the sidebar to see telescope fit here.")

    fig = plotting.visibility_figure(
        result["track"], target["name"],
        {"start": result["window_start_local"], "end": result["window_end_local"]},
    )
    st.pyplot(fig, clear_figure=True)
