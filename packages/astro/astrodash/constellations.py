"""Constellation stick-figure lines and names.

Data source: Sky & Telescope's constellation figures, as distributed via the
skaven81/western_SnT Stellarium sky-culture project (generated from public
S&T data; see data/star_names.fab and data/constellation_names.eng.fab for
the accompanying star/constellation name files). 86 of the 88 IAU
constellations are covered (Microscopium and Mensa are absent in the source
data).

File formats:
  constellationship.fab        "Abb  N  hip1 hip2  hip2 hip3  ..." (N line
                                segments, given as consecutive HIP pairs)
  constellation_names.eng.fab  "Abb\t\"Full Name\"\t..."
  star_names.fab               "  HIP|_(\"Proper Name\")"
"""
from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
LINES_PATH = DATA_DIR / "constellationship.fab"
NAMES_PATH = DATA_DIR / "constellation_names.eng.fab"
STAR_NAMES_PATH = DATA_DIR / "star_names.fab"


@dataclass
class Constellation:
    abbreviation: str
    name: str
    hip_segments: list[tuple[int, int]]  # (hip_a, hip_b) per line segment


@lru_cache(maxsize=1)
def _names() -> dict[str, str]:
    names = {}
    with open(NAMES_PATH, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            parts = line.split("\t")
            abbr = parts[0].strip()
            full = parts[1].strip().strip('"')
            names[abbr] = full
    return names


@lru_cache(maxsize=1)
def _star_names() -> dict[int, str]:
    names = {}
    with open(STAR_NAMES_PATH, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or "|" not in line:
                continue
            hip_str, rest = line.split("|", 1)
            try:
                hip = int(hip_str.strip())
            except ValueError:
                continue
            # rest looks like: _("Alpheratz")
            name = rest.strip()
            if name.startswith('_("') and name.endswith('")'):
                name = name[3:-2]
            names[hip] = name
    return names


@lru_cache(maxsize=1)
def load_constellations() -> list[Constellation]:
    names = _names()
    constellations = []
    with open(LINES_PATH, encoding="utf-8") as f:
        for line in f:
            parts = line.split()
            if len(parts) < 2:
                continue
            abbr = parts[0]
            hips = [int(x) for x in parts[2:]]
            segments = [(hips[i], hips[i + 1]) for i in range(0, len(hips) - 1, 2)]
            constellations.append(
                Constellation(abbreviation=abbr, name=names.get(abbr, abbr), hip_segments=segments)
            )
    return constellations


def star_proper_name(hip: int) -> str | None:
    return _star_names().get(hip)
