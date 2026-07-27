import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from _shared import inject_css, page_header, sidebar_controls  # noqa: E402

import streamlit as st

from astrodash import plotting, visibility

st.set_page_config(page_title="Visibility - Mission Control", page_icon="🎯", layout="wide")
inject_css()
controls = sidebar_controls()
site, target, obs_date, min_alt = controls["site"], controls["target"], controls["obs_date"], controls["min_alt"]

page_header("🎯 Target Visibility", f"{target['name']} from {site['name']} on {obs_date.isoformat()}.")

try:
    track = visibility.night_track(site, target, target_date=obs_date)
    window = visibility.best_window(track, min_target_alt=min_alt)
    fig = plotting.visibility_figure(track, target["name"], window)
    st.pyplot(fig, clear_figure=True)

    if window["start"] is not None:
        st.write(
            f"Observable above {min_alt}° while astronomically dark from "
            f"**{window['start']}** to **{window['end']}** ({window['duration_hours']} h), "
            f"peaking at **{window['max_alt']}°**."
        )
    else:
        st.warning("No qualifying window on this date.")
    st.dataframe(track, width="stretch", height=320)
except ValueError as e:
    st.warning(str(e))
