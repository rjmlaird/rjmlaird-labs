import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from _shared import inject_css, page_header, sidebar_controls  # noqa: E402

import streamlit as st

from astrodash import plotting, seeing

st.set_page_config(page_title="Seeing - Mission Control", page_icon="🌡️", layout="wide")
inject_css()
controls = sidebar_controls()
site, target, obs_date = controls["site"], controls["target"], controls["obs_date"]

page_header("🌡️ Seeing", f"Atmospheric seeing for {target['name']} — airmass-adjusted, not just weather.")

if not controls["run_weather"]:
    st.info("Enable 'Fetch live weather forecast' in the sidebar to see this page.")
else:
    try:
        merged = seeing.target_seeing_track(
            site, target, target_date=obs_date, forecast_days=controls["forecast_days"]
        )

        best_idx = merged["effective_seeing"].idxmax()
        best_row = merged.loc[best_idx]

        c1, c2, c3, c4 = st.columns(4)
        c1.metric("Best effective seeing tonight", f"{best_row['effective_seeing']:.0f}/100")
        c2.metric("...at airmass", f"{best_row['target_airmass']:.2f}" if best_row["target_airmass"] else "—")
        c3.metric("Temperature", f"{best_row['temperature_c']:.1f}°C" if best_row["temperature_c"] is not None else "—")
        dew_label = {"high": "🔴 High", "moderate": "🟠 Moderate", "low": "🟢 Low", "unknown": "—"}
        c4.metric("Dew risk", dew_label.get(best_row.get("dew_risk"), "—"))

        fig = plotting.seeing_detail_figure(merged, target["name"], site["name"])
        st.pyplot(fig, clear_figure=True)

        st.markdown(
            "**Reading this chart:** the dashed line is the weather-only seeing proxy (cloud/wind/humidity). "
            "The solid blue line degrades that further for airmass — the same weather gives worse seeing when "
            f"{target['name']} is low in the sky than when it's near the zenith. The bottom panel shows how close "
            "temperature is to the dew point; a small gap means dew or frost risk on your optics."
        )

        st.dataframe(
            merged[[
                "time_local", "target_alt_deg", "target_airmass", "seeing_proxy",
                "airmass_penalty", "effective_seeing", "temperature_c", "dew_point_c", "dew_risk",
            ]],
            width="stretch", height=320,
        )
    except Exception as e:  # noqa: BLE001
        st.error(f"Couldn't compute seeing: {e}")
