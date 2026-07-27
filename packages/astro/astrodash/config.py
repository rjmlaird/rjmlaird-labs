"""Loading and lookup helpers for site / equipment / target config files.

Config files live in config/*.json by default. Each file holds a list under
a top-level key ("sites", "equipment", "targets") so new entries can just be
appended.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parent.parent
CONFIG_DIR = REPO_ROOT / "config"

SITES_PATH = CONFIG_DIR / "sites.json"
EQUIPMENT_PATH = CONFIG_DIR / "equipment.json"
TARGETS_PATH = CONFIG_DIR / "targets.json"


def _load(path: Path, key: str) -> list[dict[str, Any]]:
    if not path.exists():
        raise FileNotFoundError(f"Config file not found: {path}")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data[key]


def load_sites() -> list[dict[str, Any]]:
    return _load(SITES_PATH, "sites")


def load_equipment() -> list[dict[str, Any]]:
    return _load(EQUIPMENT_PATH, "equipment")


def load_targets() -> list[dict[str, Any]]:
    return _load(TARGETS_PATH, "targets")


def find_by_name(items: list[dict[str, Any]], name: str) -> dict[str, Any]:
    """Case-insensitive lookup by 'name' field, raising a helpful error if missing."""
    for item in items:
        if item.get("name", "").strip().lower() == name.strip().lower():
            return item
    available = ", ".join(i.get("name", "?") for i in items)
    raise KeyError(f"'{name}' not found. Available: {available}")


def get_site(name: str) -> dict[str, Any]:
    return find_by_name(load_sites(), name)


def get_equipment(name: str) -> dict[str, Any]:
    return find_by_name(load_equipment(), name)


def get_target(name: str) -> dict[str, Any]:
    return find_by_name(load_targets(), name)


def custom_site(lat: float, lon: float, elevation_m: float = 0.0,
                 name: str = "Custom location", timezone: str = "UTC") -> dict[str, Any]:
    return {
        "name": name,
        "lat": lat,
        "lon": lon,
        "elevation_m": elevation_m,
        "timezone": timezone,
    }
