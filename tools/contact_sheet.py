"""Tiles the corpus pictures into contact sheets, so the whole corpus can be read.

    py -3.11 tools/contact_sheet.py                 # build/corpus/** -> build/corpus/sheet-N.png
    py -3.11 tools/contact_sheet.py build/states    # any folder of pngs

Twelve pictures a sheet, three across, each scaled to a 420 px column with its
path written under it. A layout fault — black where music should be, a band
off its note, a bar wrapped, a cut note — survives the scaling; a sheet is one
picture to open instead of twelve.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
COLS = 3
ROWS = 4
COL_W = 420
LABEL_H = 22
GAP = 8


def main() -> None:
    folder = ROOT / (sys.argv[1] if len(sys.argv) > 1 else "build/corpus")
    # Only the sheets this script writes are skipped: `sheet-01.png`, not a
    # cell whose name happens to start with "sheet-" (the gallery's ⋯ sheet).
    files = sorted(p for p in folder.rglob("*.png") if not re.fullmatch(r"sheet-\d+\.png", p.name))
    if not files:
        print(f"no pictures under {folder}")
        return
    per = COLS * ROWS
    sheets = [files[i : i + per] for i in range(0, len(files), per)]
    for n, batch in enumerate(sheets, start=1):
        thumbs = []
        for f in batch:
            im = Image.open(f).convert("RGB")
            scale = COL_W / im.width
            im = im.resize((COL_W, max(1, int(im.height * scale))))
            thumbs.append((f, im))
        row_h = [0] * ROWS
        for i, (_, im) in enumerate(thumbs):
            r = i // COLS
            row_h[r] = max(row_h[r], im.height + LABEL_H)
        width = COLS * (COL_W + GAP) + GAP
        height = sum(h + GAP for h in row_h if h) + GAP
        sheet = Image.new("RGB", (width, height), (24, 24, 28))
        draw = ImageDraw.Draw(sheet)
        y = GAP
        for r in range(ROWS):
            if not row_h[r]:
                break
            for c in range(COLS):
                i = r * COLS + c
                if i >= len(thumbs):
                    break
                f, im = thumbs[i]
                x = GAP + c * (COL_W + GAP)
                sheet.paste(im, (x, y))
                draw.text((x, y + im.height + 4), str(f.relative_to(folder))[-64:], fill=(200, 200, 200))
            y += row_h[r] + GAP
        out = folder / f"sheet-{n:02d}.png"
        sheet.save(out)
        print(f"{out}: {len(batch)} pictures")


if __name__ == "__main__":
    main()
