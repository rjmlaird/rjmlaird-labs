import sys
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from _shared import inject_css, page_header, sidebar_controls  # noqa: E402

import streamlit as st

from astrodash import engine, skyview

st.set_page_config(page_title="Night Sky - Mission Control", page_icon="🔭", layout="wide")
inject_css()
controls = sidebar_controls()
site, target = controls["site"], controls["target"]

page_header("🔭 Night Sky", "What the sky above your site looks like — live, or scrubbed to any moment.")

if "sky_step_minutes" not in st.session_state:
    st.session_state["sky_step_minutes"] = 0

use_now = st.checkbox("Use current time", value=(st.session_state["sky_step_minutes"] == 0), key="sky_use_now")

col1, col2 = st.columns(2)
base_date = col1.date_input("Base date", value=controls["obs_date"], key="sky_base_date", disabled=use_now)
base_time = col2.time_input("Base time", value=datetime.now().time(), key="sky_base_time", disabled=use_now)

if use_now:
    base_dt = datetime.now(tz=engine.site_tz(site))
else:
    base_dt = datetime.combine(base_date, base_time, tzinfo=engine.site_tz(site))

st.write("**Step through time:**")
b1, b2, b3, b4, b5 = st.columns(5)
if b1.button("◀◀ 1 hour"):
    st.session_state["sky_step_minutes"] -= 60
if b2.button("◀ 15 min"):
    st.session_state["sky_step_minutes"] -= 15
if b3.button("Reset ⟲"):
    st.session_state["sky_step_minutes"] = 0
if b4.button("15 min ▶"):
    st.session_state["sky_step_minutes"] += 15
if b5.button("1 hour ▶▶"):
    st.session_state["sky_step_minutes"] += 60

when = base_dt + timedelta(minutes=st.session_state["sky_step_minutes"])
mag_limit = st.slider("Faintest star magnitude shown", 3.0, 6.5, 5.2, 0.1, key="sky_mag_limit")

c1, c2 = st.columns(2)
show_constellations = c1.checkbox("Show constellation lines", value=False, key="sky_show_const")
show_labels = c2.checkbox("Show constellation names", value=False, key="sky_show_const_labels", disabled=not show_constellations)

fig = skyview.sky_dome_figure(
    site, when=when, mag_limit=mag_limit, target=target,
    show_constellations=show_constellations, show_constellation_labels=show_labels,
)
st.pyplot(fig, clear_figure=True)

snap = skyview.sky_snapshot(site, when=when, mag_limit=mag_limit)
sun_alt = snap["bodies"]["sun"]["alt_deg"]
st.caption(
    f"Showing {when.strftime('%Y-%m-%d %H:%M %Z')} · {skyview.twilight_label(sun_alt)} "
    f"(Sun altitude {sun_alt:.1f}°) · Green circle marks your selected target · "
    "Zenith is the centre, the outer ring is the horizon."
)
