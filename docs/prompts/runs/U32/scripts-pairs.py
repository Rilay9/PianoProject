"""U32: before | after, side by side, one image a cell of the long pieces' grid.

    python scripts-pairs.py <before-dir> <after-dir> <out-dir> [filter]

Each PNG under <before-dir> with its twin under <after-dir> becomes <out-dir>/<name>.png: the two
pictures at their own size, a gap between them, and a line under each saying which it is and the
figures the probe measured from the glass (the staff, the greyed rows, the free height below).
`filter` keeps only names containing it.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

GAP = 12
LABEL_H = 44


def label(measure_path: Path, which: str) -> list[str]:
    if not measure_path.exists():
        return [which, "no measurement"]
    m = json.loads(measure_path.read_text(encoding="utf8"))
    ahead = " ".join(m.get("ahead") or []) or "none"
    return [
        f"{which}: staff {m.get('staffPx')} px, ink {round((m.get('inkShare') or 0) * 100)}% high, spacing x{m.get('worstSpacing')}",
        f"greyed [{ahead}], free below {m.get('freeBelow')} vs row {m.get('rowPx')}, {m.get('barsShown')}/{m.get('barsAsked')} bars, sheets {m.get('sheetsMade')}",
    ]


def main() -> None:
    before, after, out = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
    keep = sys.argv[4] if len(sys.argv) > 4 else ""
    out.mkdir(parents=True, exist_ok=True)
    count = 0
    for a_path in sorted(before.glob("*.png")):
        if keep and keep not in a_path.name:
            continue
        b_path = after / a_path.name
        if not b_path.exists():
            continue
        a = Image.open(a_path).convert("RGB")
        b = Image.open(b_path).convert("RGB")
        width = a.width + GAP + b.width
        height = max(a.height, b.height) + LABEL_H
        sheet = Image.new("RGB", (width, height), (24, 24, 28))
        sheet.paste(a, (0, 0))
        sheet.paste(b, (a.width + GAP, 0))
        draw = ImageDraw.Draw(sheet)
        for x, path, which in ((0, a_path, "before"), (a.width + GAP, b_path, "after")):
            for i, line in enumerate(label(path.with_suffix(".json"), which)):
                draw.text((x + 4, max(a.height, b.height) + 4 + i * 18), line, fill=(220, 220, 220))
        sheet.save(out / a_path.name)
        count += 1
    print(f"{count} pairs written to {out}")


if __name__ == "__main__":
    main()
