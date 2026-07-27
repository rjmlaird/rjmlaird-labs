#!/usr/bin/env python3
"""
prepare_ems_layers.py
----------------------
Converts a raw Copernicus EMS product package (the *.json / *.shp exports you
get in an EMSR activation download, e.g. EMSR897_AOI01_BLP_PRODUCT_*.json)
into lightweight web-friendly GeoJSON + a stats.json summary that the
EMS Impact Viewer (index.html) can load.

Why: the raw reference layers (built-up areas, facilities, transportation)
can contain tens of thousands of features with full-precision coordinates —
far too heavy to drop straight into a browser map. This script:
  - reprojects everything into a local metre-based CRS to compute accurate
    areas/lengths (km², km) regardless of latitude
  - simplifies polygon/line geometry for display
  - reduces polygons to centroid points where only counts/locations matter
    (built-up buildings, facilities)
  - writes a compact stats.json with all the summary numbers used in the
    "Extent" and "Land cover" panels

USAGE
  1. Unzip your EMSR download so the *.json files (NOT the .shp/.dbf) are
     in one folder, e.g. raw/EMSR###_AOI##_XXX_PRODUCT_<layer>_v1.json
  2. pip install shapely pyproj
  3. python3 prepare_ems_layers.py --raw-dir raw --prefix EMSR###_AOI##_XXX_PRODUCT --out-dir out

  This produces:
     out/out_aoi.geojson
     out/out_naturalLandUse.geojson   (if present)
     out/out_builtUp.geojson          (if present)
     out/out_facilities.geojson       (if present)
     out/out_transportation.geojson   (if present)
     out/out_stats.json

  Drag these files onto the EMS Impact Viewer (or bundle them into a
  window.EMS_SAMPLE_DATA JS file the same way ems-sample-emsr897.js was built
  — see build_sample_bundle() below) — the viewer auto-detects layer type
  from filenames containing "areaofinterest", "builtup", "facilities",
  "naturallanduse"/"landuse", "transportation".

  IMPORTANT: this script only processes the standard EMS *reference* layers.
  If your activation includes an actual fire-perimeter / burnt-area /
  delineation polygon (usually a separate "Delineation" or "Grading"
  product, not the reference "BLP"-style package), just drop that GeoJSON
  straight into the viewer — no preprocessing needed, it'll be auto-detected
  from a filename containing "delineation", "grading", "burnt", "hazard",
  "observedevent" or "fire" (or assign it manually in the prompt).
"""
import argparse
import json
import os

from shapely.geometry import shape, mapping
from shapely.ops import transform as shp_transform
import pyproj


def load(raw_dir, prefix, layer):
    path = os.path.join(raw_dir, f"{prefix}_{layer}_v1.json")
    if not os.path.exists(path):
        return None
    return json.load(open(path))


def build_projector(aoi_geom):
    """Create a transform function from WGS84 to local LAEA (metres)."""
    minx, miny, maxx, maxy = aoi_geom.bounds
    lat0, lon0 = (miny + maxy) / 2, (minx + maxx) / 2
    
    # Create transformer
    transformer = pyproj.Transformer.from_crs(
        "EPSG:4326",
        f"+proj=laea +lat_0={lat0} +lon_0={lon0} +units=m +datum=WGS84",
        always_xy=True,
    )
    
    # Return a function that transforms a geometry
    def transform_geom(geom):
        return shp_transform(transformer.transform, geom)
    
    return transform_geom


def process(raw_dir, prefix, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    stats = {}

    aoi = load(raw_dir, prefix, "areaOfInterestA")
    if not aoi:
        raise SystemExit("Could not find *_areaOfInterestA_v1.json — check --raw-dir/--prefix")
    aoi_geom = shape(aoi["features"][0]["geometry"])
    to_m = build_projector(aoi_geom)
    aoi_geom_m = to_m(aoi_geom)
    aoi_area_km2 = aoi_geom_m.area / 1e6
    stats["aoi_area_km2"] = round(aoi_area_km2, 2)
    stats["aoi_name"] = aoi["features"][0]["properties"]
    json.dump(
        {"type": "FeatureCollection",
         "features": [{"type": "Feature", "properties": aoi["features"][0]["properties"],
                       "geometry": mapping(aoi_geom)}]},
        open(os.path.join(out_dir, "out_aoi.geojson"), "w"))

    nlu = load(raw_dir, prefix, "naturalLandUseA")
    if nlu:
        out = {"type": "FeatureCollection", "features": []}
        class_area = {}
        for f in nlu["features"]:
            g = shape(f["geometry"])
            g_m = to_m(g)
            cls = f["properties"].get("info", "Unknown")
            class_area[cls] = class_area.get(cls, 0) + g_m.area / 1e6
            out["features"].append({
                "type": "Feature",
                "properties": {"class": cls, "grp": f["properties"].get("obj_type", "")},
                "geometry": mapping(g.simplify(0.0001, preserve_topology=True)),
            })
        stats["land_use_km2"] = {k: round(v, 3) for k, v in sorted(class_area.items(), key=lambda x: -x[1])}
        json.dump(out, open(os.path.join(out_dir, "out_naturalLandUse.geojson"), "w"))

    bua = load(raw_dir, prefix, "builtUpA")
    if bua:
        out = {"type": "FeatureCollection", "features": []}
        total_m2, by_type = 0, {}
        for f in bua["features"]:
            g = shape(f["geometry"])
            g_m = to_m(g)
            total_m2 += g_m.area
            t = f["properties"].get("simplified", f["properties"].get("obj_type", "Unknown"))
            by_type[t] = by_type.get(t, 0) + 1
            c = g.centroid
            out["features"].append({"type": "Feature", "properties": {"t": t},
                                     "geometry": {"type": "Point", "coordinates": [round(c.x, 5), round(c.y, 5)]}})
        stats["builtup_count"] = len(bua["features"])
        stats["builtup_footprint_km2"] = round(total_m2 / 1e6, 3)
        stats["builtup_by_type"] = by_type
        json.dump(out, open(os.path.join(out_dir, "out_builtUp.geojson"), "w"))

    fac_a = load(raw_dir, prefix, "facilitiesA") or {"features": []}
    fac_l = load(raw_dir, prefix, "facilitiesL") or {"features": []}
    if fac_a["features"] or fac_l["features"]:
        out = {"type": "FeatureCollection", "features": []}
        by_type = {}
        for f in fac_a["features"] + fac_l["features"]:
            g = shape(f["geometry"])
            t = f["properties"].get("info", f["properties"].get("obj_type", "Unknown"))
            by_type[t] = by_type.get(t, 0) + 1
            c = g.centroid
            out["features"].append({"type": "Feature", "properties": {"t": t},
                                     "geometry": {"type": "Point", "coordinates": [round(c.x, 5), round(c.y, 5)]}})
        stats["facilities_count"] = len(out["features"])
        stats["facilities_by_type"] = dict(sorted(by_type.items(), key=lambda x: -x[1])[:15])
        json.dump(out, open(os.path.join(out_dir, "out_facilities.geojson"), "w"))

    trans = load(raw_dir, prefix, "transportationL")
    if trans:
        out = {"type": "FeatureCollection", "features": []}
        by_type = {}
        for f in trans["features"]:
            g = shape(f["geometry"])
            g_m = to_m(g)
            length_km = g_m.length / 1000
            t = f["properties"].get("simplified", f["properties"].get("obj_type", "Unknown"))
            by_type[t] = by_type.get(t, 0) + length_km
            out["features"].append({"type": "Feature", "properties": {"t": t},
                                     "geometry": mapping(g.simplify(0.0002, preserve_topology=True))})
        stats["transport_km_by_type"] = {k: round(v, 1) for k, v in sorted(by_type.items(), key=lambda x: -x[1])}
        stats["transport_total_km"] = round(sum(by_type.values()), 1)
        json.dump(out, open(os.path.join(out_dir, "out_transportation.geojson"), "w"))

    json.dump(stats, open(os.path.join(out_dir, "out_stats.json"), "w"), indent=2)
    print(f"Done. Wrote layers + stats to {out_dir}/")
    print(json.dumps(stats, indent=2)[:1500])


def build_sample_bundle(out_dir, bundle_path, var_name="EMS_SAMPLE_DATA"):
    """Bundle out_*.geojson + out_stats.json into a single window.<var_name> = {...}; JS file
    for use with the 'Load ... demo' button in the viewer."""
    files = {
        "aoi": "out_aoi.geojson", "landuse": "out_naturalLandUse.geojson",
        "builtup": "out_builtUp.geojson", "facilities": "out_facilities.geojson",
        "transport": "out_transportation.geojson", "stats": "out_stats.json",
    }
    bundle = {}
    for key, fname in files.items():
        path = os.path.join(out_dir, fname)
        if os.path.exists(path):
            bundle[key] = json.load(open(path))
    with open(bundle_path, "w") as f:
        f.write(f"window.{var_name} = ")
        json.dump(bundle, f, separators=(",", ":"))
        f.write(";")
    print(f"Wrote bundle to {bundle_path}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--raw-dir", default="raw", help="Folder containing the unzipped *_v1.json files")
    ap.add_argument("--prefix", required=True,
                     help="Common filename prefix, e.g. EMSR897_AOI01_BLP_PRODUCT (everything before '_<layer>_v1.json')")
    ap.add_argument("--out-dir", default="out", help="Where to write the lightweight output layers")
    ap.add_argument("--bundle", action="store_true", help="Also write a window.EMS_SAMPLE_DATA JS bundle")
    ap.add_argument("--bundle-path", default="ems-sample-data.js")
    args = ap.parse_args()

    process(args.raw_dir, args.prefix, args.out_dir)
    if args.bundle:
        build_sample_bundle(args.out_dir, args.bundle_path)
