"""U32a: before | after, side by side, one image a cell (not for the commit; kept in the run folder).

    python pairs.py <before-dir> <after-dir> <out-dir> <suffix>

For each <name><suffix>.png under <before-dir> with its twin under <after-dir>, writes
<out-dir>/<name><suffix>.png: the two pictures at their own size, a gap between them, and two lines
under each saying which it is and what the probe measured from the glass. The measurement is read
from <name>__first.json (the held first paint) or from <name>.json's `settled` (the settled shape).
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

GAP = 12
LABEL_H = 44


def measured(directory: Path, name: str, suffix: str) -> dict | None:
    if suffix == "__first":
        path = directory / f"{name}__first.json"
        return json.loads(path.read_text(encoding="utf8")) if path.exists() else None
    path = directory / f"{name}.json"
    return json.loads(path.read_text(encoding="utf8")).get("settled") if path.exists() else None


def label(m: dict | None, which: str) -> list[str]:
    if m is None:
        return [which, "no measurement"]
    ahead = " ".join(m.get("ahead") or []) or "none"
    sheets = m.get("sheets")
    made = sheets.get("made") if isinstance(sheets, dict) else sheets
    return [
        f"{which}: staff {m.get('staffPx')} px, ink {round((m.get('inkShare') or 0) * 100)}% high, greyed [{ahead}]",
        f"{m.get('barsShown')}/{m.get('barsAsked')} bars on {m.get('systemsPerWindow')} rows, free below {m.get('freeBelow')}, sheets made {made}",
    ]


def main() -> None:
    before, after, out, suffix = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3]), sys.argv[4]
    out.mkdir(parents=True, exist_ok=True)
    count = 0
    for a_path in sorted(before.glob(f"*{suffix}.png")):
        b_path = after / a_path.name
        if not b_path.exists():
            continue
        name = a_path.name[: -len(f"{suffix}.png")]
        a = Image.open(a_path).convert("RGB")
        b = Image.open(b_path).convert("RGB")
        width = a.width + GAP + b.width
        height = max(a.height, b.height) + LABEL_H
        sheet = Image.new("RGB", (width, height), "white")
        sheet.paste(a, (0, 0))
        sheet.paste(b, (a.width + GAP, 0))
        draw = ImageDraw.Draw(sheet)
        draw.rectangle([a.width, 0, a.width + GAP - 1, height], fill=(200, 200, 200))
        for x, lines in ((0, label(measured(before, name, suffix), "before")), (a.width + GAP, label(measured(after, name, suffix), "after"))):
            for i, line in enumerate(lines):
                draw.text((x + 4, max(a.height, b.height) + 4 + i * 18), line, fill="black")
        sheet.save(out / a_path.name)
        count += 1
    print(f"{count} pairs written to {out}")


if __name__ == "__main__":
    main()
