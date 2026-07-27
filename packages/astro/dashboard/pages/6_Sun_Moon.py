import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from _shared import inject_css, page_header, sidebar_controls  # noqa: E402

import streamlit as st

from astrodash import plotting, sun_moon

st.set_page_config(page_title="Sun & Moon - Mission Control", page_icon="🌙", layout="wide")
inject_css()
controls = sidebar_controls()
site, obs_date = controls["site"], controls["obs_date"]

page_header("🌙 Sun & Moon", f"{site['name']} — rise/set/phase for the week ahead.")

days_table = sun_moon.build_days_table(site, start_date=obs_date, days=7)
fig = plotting.sun_moon_figure(days_table, site["name"])
st.pyplot(fig, clear_figure=True)
st.dataframe(days_table, width="stretch", height=280)
