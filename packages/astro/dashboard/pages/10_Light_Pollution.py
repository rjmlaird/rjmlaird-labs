import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from _shared import inject_css, page_header, sidebar_controls  # noqa: E402

import streamlit as st

from astrodash import light_pollution

st.set_page_config(page_title="Light Pollution - Mission Control", page_icon="🌆", layout="wide")
inject_css()
controls = sidebar_controls()
site = controls["site"]

page_header("🌆 Light Pollution", f"Estimated Bortle scale for {site['name']}.")

try:
    result = light_pollution.estimate_bortle(float(site["lat"]), float(site["lon"]))

    c1, c2 = st.columns([1, 2])
    c1.metric("Estimated Bortle class", result["bortle"])
    c2.write(f"**{result['description']}**")

    if result["dominant_source"]:
        d = result["dominant_source"]
        st.write(f"Dominant light source: **{d['name']}** ({d['population']:,} people, {d['distance_km']} km away)")

    if result["nearby_sources"]:
        st.write("**Nearby contributing towns/cities:**")
        st.dataframe(
            [{"Name": s["name"], "Population": s["population"], "Distance (km)": s["distance_km"]}
             for s in result["nearby_sources"]],
            width="stretch",
        )

    st.warning(result["caveat"])
    st.markdown(
        "For an authoritative, satellite-measured light pollution map, see "
        "[lightpollutionmap.info](https://www.lightpollutionmap.info/) (VIIRS-based World Atlas data)."
    )
except Exception as e:  # noqa: BLE001
    st.error(f"Couldn't estimate light pollution: {e}")

st.divider()
st.markdown(
    """
**How this estimate works:** it uses [Walker's Law](https://en.wikipedia.org/wiki/Light_pollution)
(Walker, 1977), an empirical relationship between a city's population, your distance from it, and how
much it brightens the night sky, applied to an offline database of world cities (GeoNames). This runs
entirely offline — no satellite imagery is used — so treat the Bortle number as a reasonable estimate
for comparing sites, not a measurement.
"""
)
