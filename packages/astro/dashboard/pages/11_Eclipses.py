import sys
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from _shared import inject_css, page_header, sidebar_controls  # noqa: E402

import streamlit as st

from astrodash import eclipses, engine, plotting
from astrodash import eclipse_maps, eclipse_map_plots

st.set_page_config(page_title="Eclipses - Mission Control", page_icon="🌗", layout="wide")
inject_css()
controls = sidebar_controls()
site = controls["site"]

page_header(
    "🌗 Eclipse Planner",
    f"Lunar and solar eclipses for {site['name']} — contact times, umbra/penumbra, local visibility.",
)

# Default home location: Leicester, UK (override if site has lat/lon)
home_lat = site.get("lat_deg", 52.6369)
home_lon = site.get("lon_deg", -1.1398)
home_name = site.get("name", "Leicester")

tab_lunar, tab_solar, tab_maps = st.tabs(
    ["🌕 Lunar eclipses", "☀️ Solar eclipses", "🌍 Eclipse maps"]
)

# ——— Lunar eclipses tab ———
with tab_lunar:
    years = st.slider("Look ahead (years)", 1, 10, 2, key="lunar_ecl_years")
    if st.button("Find lunar eclipses"):
        try:
            start_date = date.today()
            end_date = date(start_date.year + years, start_date.month, start_date.day)
            events = eclipses.find_lunar_eclipses(start_date, end_date)

            if not events:
                st.warning(f"No lunar eclipses found in the next {years} years.")
            else:
                eph = engine.ephemeris()
                tz = engine.site_tz(site)
                for e in events:
                    circ = eclipses.lunar_eclipse_local_circumstances(e, site)
                    st.subheader(f"{e['type']} lunar eclipse — {e['greatest_eclipse'].date()}")

                    c1, c2, c3 = st.columns(3)
                    c1.metric(
                        "Greatest eclipse (local)",
                        e["greatest_eclipse"].astimezone(tz).strftime("%H:%M %Z"),
                    )
                    c2.metric("Umbral magnitude", e["umbral_magnitude"])
                    c3.metric(
                        "Moon altitude at greatest",
                        f"{circ['moon_altitude_at_greatest_deg']}°",
                    )

                    if circ["visible_at_greatest"]:
                        st.success(circ["verdict"])
                    else:
                        st.warning(circ["verdict"])

                    data = eclipses.lunar_eclipse_diagram_data(e, eph)
                    fig = plotting.lunar_eclipse_figure(data, e, circ)
                    st.pyplot(fig, clear_figure=True)

                    contact_rows = [
                        {
                            "Contact": name,
                            "Time (local)": (
                                dt.astimezone(tz).strftime("%Y-%m-%d %H:%M:%S")
                                if dt
                                else "—"
                            ),
                            "Moon altitude": (
                                f"{circ['contact_altitudes_deg'].get(name)}°"
                                if circ["contact_altitudes_deg"].get(name) is not None
                                else "—"
                            ),
                        }
                        for name, dt in e["contacts"].items()
                    ]
                    st.dataframe(contact_rows, width="stretch")
                    st.divider()
        except Exception as ex:  # noqa: BLE001
            st.error(f"Couldn't compute lunar eclipses: {ex}")

# ——— Solar eclipses tab ———
with tab_solar:
    years = st.slider("Look ahead (years)", 1, 10, 5, key="solar_ecl_years")
    st.caption(
        "This checks every new moon in the window against your site's exact position, "
        "so it can take a little while for long ranges."
    )
    if st.button("Find solar eclipses"):
        try:
            start_date = date.today()
            end_date = date(start_date.year + years, start_date.month, start_date.day)
            with st.spinner("Searching new moons for local solar eclipses…"):
                events = eclipses.find_solar_eclipses(site, start_date, end_date)

            if not events:
                st.warning(
                    f"No solar eclipses visible from {site['name']} in the next {years} years."
                )
            else:
                tz = engine.site_tz(site)
                for e in events:
                    st.subheader(f"{e['type']} solar eclipse — {e['max_eclipse'].date()}")

                    c1, c2, c3 = st.columns(3)
                    c1.metric(
                        "Maximum eclipse (local)",
                        e["max_eclipse"].astimezone(tz).strftime("%H:%M %Z"),
                    )
                    c2.metric("Obscuration", f"{e['obscuration_pct']}%")
                    c3.metric("Sun altitude", f"{e['sun_altitude_at_max_deg']}°")

                    if e["visible"]:
                        st.success(
                            "Visible — the Sun is above the horizon at maximum eclipse."
                        )
                        geom = eclipses.solar_eclipse_geometry_at_max(e, site)
                        fig = plotting.solar_eclipse_figure(
                            e,
                            geom["sun_radius_deg"],
                            geom["moon_radius_deg"],
                            geom["separation_deg"],
                            site["name"],
                        )
                        st.pyplot(fig, clear_figure=True)
                    else:
                        st.warning(
                            "Not visible — the Sun is below the horizon at maximum eclipse from this site."
                        )

                    contact_rows = [
                        {
                            "Contact": name,
                            "Time (local)": (
                                dt.astimezone(tz).strftime("%Y-%m-%d %H:%M:%S")
                                if dt
                                else "—"
                            ),
                        }
                        for name, dt in e["contacts"].items()
                    ]
                    st.dataframe(contact_rows, width="stretch")
                    st.caption(
                        "C1/C4: partial phase begins/ends · C2/C3: totality or annularity "
                        "begins/ends (total/annular eclipses only)"
                    )
                    st.divider()
        except Exception as ex:  # noqa: BLE001
            st.error(f"Couldn't compute solar eclipses: {ex}")

# ——— Eclipse maps tab ———
with tab_maps:
    st.subheader("🌍 Eclipse maps for all solar eclipses visible from Leicester")

    years = st.slider("Look ahead (years) for maps", 1, 20, 10, key="map_ecl_years")
    st.caption(
        "This shows maps for all solar eclipses visible from Leicester (partial, total, annular). "
        "For total/annular eclipses, the dark line is the path of totality/annularity with umbral limits. "
        "For partial-only eclipses, the lighter band shows the penumbral shadow where any eclipse is visible. "
        f"Home location is fixed to {home_name} (Leicester by default)."
    )

    if st.button("Compute eclipse maps"):
        try:
            start_date = date.today()
            end_date = date(start_date.year + years, start_date.month, start_date.day)

            with st.spinner("Searching new moons for solar eclipses…"):
                events = eclipses.find_solar_eclipses(site, start_date, end_date)

            if not events:
                st.warning(
                    f"No solar eclipses visible from {site['name']} in the next {years} years."
                )
            else:
                tz = engine.site_tz(site)

                for e in events:
                    st.subheader(f"{e['type']} solar eclipse — {e['max_eclipse'].date()}")

                    contacts = e.get("contacts", {})
                    dt_start = contacts.get("C1")
                    dt_end = contacts.get("C4")

                    if not dt_start or not dt_end:
                        st.warning("Cannot compute map without C1/C4 contact times.")
                        continue

                    # Choose path function based on eclipse type
                    etype = e["type"].lower()
                    if "total" in etype or "annular" in etype:
                        path = eclipse_maps.solar_eclipse_path(
                            e, dt_start, dt_end, step_seconds=120
                        )
                    else:
                        path = eclipse_maps.solar_eclipse_path_partial(
                            e, dt_start, dt_end, step_seconds=120
                        )

                    if not path.central_lats:
                        st.info("No path computed for this eclipse.")
                        continue

                    # Find the central-line point closest in time to max_eclipse
                    max_t = e["max_eclipse"]
                    best_idx = min(
                        range(len(path.times)),
                        key=lambda i: abs((path.times[i] - max_t).total_seconds()),
                    )
                    max_lat = path.central_lats[best_idx]
                    max_lon = path.central_lons[best_idx]

                    # Global map
                    fig_globe = eclipse_map_plots.eclipse_path_globe(
                        path,
                        home_lat=home_lat,
                        home_lon=home_lon,
                        home_name=home_name,
                        max_lat=max_lat,
                        max_lon=max_lon,
                        max_label="Max eclipse",
                    )
                    st.plotly_chart(fig_globe, use_container_width=True)

                    # Close-up around max eclipse
                    center_lat = max_lat
                    center_lon = max_lon
                    width_deg = 10.0  # adjust zoom as desired

                    fig_zoom = eclipse_map_plots.eclipse_path_closeup(
                        path,
                        center_lat=center_lat,
                        center_lon=center_lon,
                        width_deg=width_deg,
                        home_lat=home_lat,
                        home_lon=home_lon,
                        home_name=home_name,
                    )
                    st.plotly_chart(fig_zoom, use_container_width=True)

                    if path.is_partial:
                        st.caption(
                            f"Penumbral path and limits computed geometrically. "
                            f"Maximum eclipse at {max_lat:.2f}°, {max_lon:.2f}°."
                        )
                    else:
                        st.caption(
                            f"Central line and umbral limits computed geometrically. "
                            f"Maximum eclipse at {max_lat:.2f}°, {max_lon:.2f}°."
                        )
                    st.divider()

        except Exception as ex:  # noqa: BLE001
            st.error(f"Couldn't compute eclipse maps: {ex}")

st.caption(
    "Lunar eclipse detection uses Skyfield's eclipselib (Explanatory Supplement to the "
    "Astronomical Almanac); contact times are found by sampling the same shadow geometry "
    "around greatest eclipse. Solar eclipses are found by checking real topocentric "
    "Sun-Moon geometry from your site at every new moon — this is why they're inherently "
    "local while lunar eclipses aren't. The ‘Eclipse maps’ tab computes the shadow-axis "
    "intersection with Earth’s ellipsoid to draw the path of totality/annularity (for "
    "total/annular eclipses) or the penumbral shadow (for partial eclipses), including "
    "northern and southern limits."
)
