"""U32: compares two folders of PNGs file by file, pixel by pixel.

    python scripts-png-diff.py <before-dir> <after-dir>

For each PNG under <before-dir> (recursively) with the same relative path under <after-dir>: the size,
the count of pixels that differ, and the box they fall in. Prints one line a picture and a summary.
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageChops


def main() -> None:
    before, after = Path(sys.argv[1]), Path(sys.argv[2])
    files = sorted(p.relative_to(before) for p in before.rglob("*.png") if not p.name.startswith("sheet-"))
    same = differ = missing = 0
    for rel in files:
        a_path, b_path = before / rel, after / rel
        if not b_path.exists():
            print(f"{rel}: missing after")
            missing += 1
            continue
        a = Image.open(a_path).convert("RGB")
        b = Image.open(b_path).convert("RGB")
        if a.size != b.size:
            print(f"{rel}: size {a.size} -> {b.size}")
            differ += 1
            continue
        diff = ImageChops.difference(a, b)
        box = diff.getbbox()
        if box is None:
            same += 1
            continue
        count = sum(1 for px in diff.getdata() if px != (0, 0, 0))
        print(f"{rel}: {count} pixels differ in {box}")
        differ += 1
    extra = sorted(p.relative_to(after) for p in after.rglob("*.png") if not (before / p.relative_to(after)).exists() and not p.name.startswith("sheet-"))
    for rel in extra:
        print(f"{rel}: only after")
    print(f"{len(files)} pictures before: {same} identical, {differ} differ, {missing} missing after; {len(extra)} only after")


if __name__ == "__main__":
    main()
