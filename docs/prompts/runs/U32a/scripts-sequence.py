"""U32a: what the after build shows in turn — first paint | the measurement's re-plan | settled — one
image a cell (not for the commit; kept in the run folder).

    python sequence.py <first-dir> <between-dir> <settled-dir> <out-dir>

Each cell with all three pictures becomes <out-dir>/<name>__sequence.png, with a line under each
picture saying which it is and what the probe measured from the glass.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

GAP = 12
LABEL_H = 44


def label(m: dict | None, which: str) -> list[str]:
    if m is None:
        return [which, "no measurement"]
    ahead = " ".join(m.get("ahead") or []) or "none"
    sheets = m.get("sheets")
    made = sheets.get("made") if isinstance(sheets, dict) else sheets
    return [
        f"{which}: staff {m.get('staffPx')} px, greyed [{ahead}]",
        f"{m.get('barsShown')}/{m.get('barsAsked')} bars on {m.get('systemsPerWindow')} rows, sheets {made}",
    ]


first, between, settled, out = (Path(p) for p in sys.argv[1:5])
out.mkdir(parents=True, exist_ok=True)
count = 0
for f in sorted(first.glob("*__first.png")):
    name = f.name[: -len("__first.png")]
    b = between / f"{name}__between.png"
    s = settled / f"{name}__settled.png"
    if not (b.exists() and s.exists()):
        continue
    pictures = [Image.open(p).convert("RGB") for p in (f, b, s)]
    measures = [
        json.loads((first / f"{name}__first.json").read_text(encoding="utf8")),
        json.loads((between / f"{name}__between.json").read_text(encoding="utf8")),
        json.loads((settled / f"{name}.json").read_text(encoding="utf8")).get("settled"),
    ]
    width = sum(p.width for p in pictures) + GAP * 2
    height = max(p.height for p in pictures) + LABEL_H
    sheet = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(sheet)
    x = 0
    for picture, m, which in zip(pictures, measures, ("first paint", "measured, a sheet to come", "settled")):
        sheet.paste(picture, (x, 0))
        for i, line in enumerate(label(m, which)):
            draw.text((x + 4, height - LABEL_H + 4 + i * 18), line, fill="black")
        x += picture.width
        if x < width:
            draw.rectangle([x, 0, x + GAP - 1, height], fill=(200, 200, 200))
            x += GAP
    sheet.save(out / f"{name}__sequence.png")
    count += 1
print(f"{count} sequences written to {out}")
