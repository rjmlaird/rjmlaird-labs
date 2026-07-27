import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from _shared import inject_css, page_header, sidebar_controls  # noqa: E402

import streamlit as st

from astrodash import plotting, satellites

st.set_page_config(page_title="Satellites - Mission Control", page_icon="🛰️", layout="wide")
inject_css()
controls = sidebar_controls()
site = controls["site"]

page_header("🛰️ Satellite Passes", "Search the full Celestrak catalog, see passes in the next 24 hours. (beta)")

st.write("**Find a satellite**")
c1, c2 = st.columns([3, 1])
query = c1.text_input("Search by name", value="ISS", key="sat_query")
payloads_only = c2.checkbox("Payloads only", value=True, key="sat_payloads_only")

if "sat_results" not in st.session_state:
    st.session_state["sat_results"] = None

if st.button("Search catalog"):
    try:
        results = satellites.search_satcat(query, payloads_only=payloads_only, active_only=True, max_results=25)
        st.session_state["sat_results"] = results
    except Exception as e:  # noqa: BLE001
        st.error(f"Couldn't search the satellite catalog: {e}")
        st.session_state["sat_results"] = None

results = st.session_state["sat_results"]
if results is not None and not results.empty:
    display_cols = [c for c in ["OBJECT_NAME", "NORAD_CAT_ID", "OBJECT_TYPE", "LAUNCH_DATE", "OWNER"] if c in results.columns]
    st.dataframe(results[display_cols], width="stretch", height=220)

    options = {f"{row['OBJECT_NAME']} (#{row['NORAD_CAT_ID']})": row["NORAD_CAT_ID"] for _, row in results.iterrows()}
    choice = st.selectbox("Selected satellite", list(options.keys()))
    selected_norad_id = options[choice]
elif results is not None:
    st.warning("No matches. Try a shorter or different search term.")
    selected_norad_id = None
else:
    selected_norad_id = None

st.divider()
min_alt = st.slider("Minimum pass altitude (deg)", 5, 60, 10, key="sat_min_alt")
mag_filter = st.slider("Only show passes brighter than magnitude", -4.0, 10.0, 6.0, 0.5, key="sat_mag_filter",
                         help="Lower magnitude = brighter. 6 is roughly the naked-eye limit under a dark sky.")

if selected_norad_id is not None and st.button("Find passes (next 24 hours)"):
    try:
        satcat_row = satellites.satcat_row_for(int(selected_norad_id))
        sat = satellites.load_satellite(int(selected_norad_id))
        df = satellites.find_passes(site, sat, hours=24, min_altitude_deg=min_alt, satcat_row=satcat_row)

        if df.empty:
            st.warning(f"No passes above {min_alt}° found in the next 24 hours.")
        else:
            filtered = df[df["estimated_magnitude"].fillna(99) <= mag_filter]
            st.dataframe(filtered, width="stretch")
            st.caption(
                f"{len(filtered)} of {len(df)} passes are brighter than magnitude {mag_filter}. "
                "Magnitude is an approximation (diffuse-sphere reflection model) — real satellites can be "
                "brighter or dimmer, especially with specular flares not modelled here."
            )

        st.subheader("Current position & ground track")
        current = satellites.current_subpoint(sat)
        track = satellites.ground_track(sat)
        fig = plotting.satellite_mercator_figure(sat.name, track, current, site=site)
        st.pyplot(fig, clear_figure=True)
        st.caption(f"Subpoint: {current['lat']:.2f}°, {current['lon']:.2f}° · altitude {current['elevation_km']:.0f} km")
    except Exception as e:  # noqa: BLE001
        st.error(f"Couldn't fetch pass data: {e}")

st.caption(
    "Beta feature — searches Celestrak's full SATCAT (celestrak.org/pub/satcat.csv), so any active "
    "payload can be looked up, not just a fixed shortlist."
)
