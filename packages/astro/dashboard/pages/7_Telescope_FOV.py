import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from _shared import inject_css, page_header, sidebar_controls  # noqa: E402

import streamlit as st

from astrodash import plotting, telescope

st.set_page_config(page_title="Telescope FOV - Mission Control", page_icon="🔬", layout="wide")
inject_css()
controls = sidebar_controls()
equipment, target = controls["equipment"], controls["target"]

page_header("🔬 Telescope Field of View", f"{target['name']} through your gear.")

if equipment is None:
    st.info("Choose a piece of equipment in the sidebar to see field-of-view resolution.")
else:
    rows = telescope.resolve_all_eyepieces(equipment, target)
    st.dataframe(rows, width="stretch")

    eyepiece_names = [r.get("eyepiece", "default") for r in rows]
    choice = st.selectbox("Eyepiece", eyepiece_names)
    row = rows[eyepiece_names.index(choice)]
    fig = plotting.telescope_fov_figure(row)
    st.pyplot(fig, clear_figure=True)
    st.caption(row["pupil_note"])
