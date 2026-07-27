"""Telescope + eyepiece field-of-view resolution against a target's angular size."""
from __future__ import annotations


def target_size_arcmin(target: dict) -> float | None:
    if "diameter_arcmin" in target:
        return float(target["diameter_arcmin"])
    if "diameter_arcsec" in target:
        return float(target["diameter_arcsec"]) / 60.0
    return None


def resolve_view(equipment: dict, target: dict) -> dict:
    scope_fl = float(equipment["scope_focal_length_mm"])
    scope_ap = float(equipment["scope_aperture_mm"])
    ep_fl = float(equipment["eyepiece_focal_length_mm"])
    afov = float(equipment["eyepiece_afov_deg"])

    magnification = scope_fl / ep_fl
    exit_pupil = scope_ap / magnification
    tfov_deg = afov / magnification
    tfov_arcmin = tfov_deg * 60.0

    size_arcmin = target_size_arcmin(target)
    fits, fill_pct = None, None
    if size_arcmin is not None:
        fits = size_arcmin <= tfov_arcmin
        fill_pct = (size_arcmin / tfov_arcmin) * 100.0

    # Rough guidance on exit pupil suitability (dark-adapted human pupil ~5-7mm).
    if exit_pupil < 0.7:
        pupil_note = "Very high power — dim image, atmospheric turbulence will show easily."
    elif exit_pupil > 6.0:
        pupil_note = "Exit pupil exceeds typical dark-adapted eye — some light is being wasted."
    else:
        pupil_note = "Good exit pupil for visual observing."

    return {
        "equipment": equipment["name"],
        "target": target["name"],
        "magnification_x": round(magnification, 1),
        "exit_pupil_mm": round(exit_pupil, 2),
        "tfov_deg": round(tfov_deg, 3),
        "tfov_arcmin": round(tfov_arcmin, 1),
        "target_size_arcmin": None if size_arcmin is None else round(size_arcmin, 2),
        "fits_in_fov": fits,
        "fov_fill_pct": None if fill_pct is None else round(fill_pct, 1),
        "pupil_note": pupil_note,
    }


def resolve_all_eyepieces(equipment: dict, target: dict) -> list[dict]:
    """If equipment defines a list of eyepieces, resolve the view for each one."""
    eyepieces = equipment.get("eyepieces")
    if not eyepieces:
        return [resolve_view(equipment, target)]

    rows = []
    for ep in eyepieces:
        combined = {
            "name": equipment["name"],
            "scope_focal_length_mm": equipment["scope_focal_length_mm"],
            "scope_aperture_mm": equipment["scope_aperture_mm"],
            "eyepiece_focal_length_mm": ep["focal_length_mm"],
            "eyepiece_afov_deg": ep["afov_deg"],
        }
        row = resolve_view(combined, target)
        row["eyepiece"] = ep.get("name", f"{ep['focal_length_mm']}mm")
        rows.append(row)
    return rows
