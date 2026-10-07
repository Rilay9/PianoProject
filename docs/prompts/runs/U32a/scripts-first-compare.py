"""U32a: the held first paint, before against after (not for the commit).

    python first-compare.py <before-dir> <after-dir>

For each <name>__first.png: whether the two pictures are pixel-identical, and what the probe measured
from the glass on each (rows, greyed rows, staff, sheets).
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image, ImageChops


def said(m: dict) -> str:
    rows = ",".join(f"{r['bars']}{'~' if r['ahead'] else ''}" for r in m.get("rows", []))
    return f"rows [{rows}] staff {m.get('staffPx')} px, {m.get('barsShown')}/{m.get('barsAsked')} bars, sheets {json.dumps(m.get('sheets'))}"


before, after = Path(sys.argv[1]), Path(sys.argv[2])
for a in sorted(before.glob("*__first.png")):
    b = after / a.name
    if not b.exists():
        print(f"{a.name}: no after")
        continue
    box = ImageChops.difference(Image.open(a).convert("RGB"), Image.open(b).convert("RGB")).getbbox()
    ma = json.loads((before / a.name.replace(".png", ".json")).read_text(encoding="utf8"))
    mb = json.loads((after / b.name.replace(".png", ".json")).read_text(encoding="utf8"))
    print(f"{a.name}: {'pixel-identical' if box is None else f'differs in {box}'}")
    print(f"   before: {said(ma)}")
    print(f"   after:  {said(mb)}")
