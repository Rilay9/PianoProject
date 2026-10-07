"""U32a: the settled pictures, before against after (not for the commit).

    python settled-compare.py <before-dir> <after-dir>

For each <name>__settled.png: pixel-identical or not; if not, the share of the picture's pixels that
differ at all and that differ strongly (more than a quarter of the range on any channel) — an
engraving at another zoom drawn at the same size moves anti-aliased edges, not notes — and the
engraving zoom and drawn size each build settled at, from the probe's frames.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image, ImageChops


def settled_zoom(state: dict) -> str:
    frames = [f for f in state["frames"] if f["at"] <= state["settledAt"] + 1]
    key = frames[-1]["key"].split(" | ")
    scale = float(key[1].split("scale(")[1].rstrip(")")) if "scale(" in key[1] else 0.0
    zoom = float(key[2].split(" ")[1])
    return f"zoom {zoom}, drawn {round(zoom * scale, 3)}"


before, after = Path(sys.argv[1]), Path(sys.argv[2])
for a in sorted(before.glob("*__settled.png")):
    b = after / a.name
    ia, ib = Image.open(a).convert("RGB"), Image.open(b).convert("RGB")
    diff = ImageChops.difference(ia, ib)
    name = a.name.replace("__settled.png", "")
    za = settled_zoom(json.loads((before / f"{name}.json").read_text(encoding="utf8"))["state"])
    zb = settled_zoom(json.loads((after / f"{name}.json").read_text(encoding="utf8"))["state"])
    if diff.getbbox() is None:
        print(f"{name}: pixel-identical (before {za}; after {zb})")
        continue
    px = list(diff.getdata())
    anyd = sum(1 for p in px if max(p) > 0) / len(px)
    strong = sum(1 for p in px if max(p) > 64) / len(px)
    print(f"{name}: differs in {diff.getbbox()}: {anyd:.1%} of pixels at all, {strong:.1%} strongly (before {za}; after {zb})")
