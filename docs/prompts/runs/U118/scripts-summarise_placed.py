"""U118: the placement-only stand-in against the code as it stands, per cell, from the probe's JSON.

"as-is" is the code as it stands; "placed" is the same run with the drawn stacked slots moved down by the
chip's two-line extent once folded (CSS `margin-top`), nothing priced differently. Per cell, folded and
paused: the run's shape and drawn size in both arms, whether anything of the score's ink is under the
chip, the highest ink against the chip's bottom (both from the stage's border box), the lowest ink against the stage's bottom, the
slots' reading order, and the frozen scale before and after the fold.
Usage: python summarise_placed.py <probe-out dir>
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

out = Path(sys.argv[1])
cells: dict[str, dict[str, dict]] = {}
for f in sorted(out.glob("*.json")):
    d = json.loads(f.read_text(encoding="utf-8"))
    key = f"{d['viewport']} {d['piece']} {d['bars']} bars text {d['text']}%"
    cells.setdefault(key, {})[d.get("arm") or ("reserved" if d["reserved"] else "as-is")] = d


def shape(s: dict) -> str:
    return f"{s['slots']}/{s['systems']}/{s['shown']}"


def ordered(fold: dict) -> bool:
    froms = [p["from"] if p["from"] is not None else 10**9 for p in fold.get("placed", [])]
    return froms == sorted(froms)


print("| cell | shape as-is / placed | drawn as-is / placed | under the chip as-is / placed | highest ink vs chip bottom (placed) | lowest ink vs stage bottom (placed) | order kept (placed) | frozen scale held through the fold (placed) |")
print("| --- | --- | --- | --- | --- | --- | --- | --- |")
bad = {"under": 0, "first": 0, "bottom": 0, "order": 0, "scale": 0, "shape": 0}
n = 0
for key, arms in cells.items():
    a, p = arms.get("as-is"), arms.get("placed")
    if a is None or p is None:
        continue
    n += 1
    fp = p["fold"]
    first = fp["inkTop"]
    first_ok = first is not None and fp["chipBottom"] is not None and first >= fp["chipBottom"]
    bottom_ok = fp["inkBottom"] is not None and fp["inkBottom"] <= fp["stageH"] + 1
    held = p["run"]["frozenScale"] == p["after"]["frozenScale"]
    same_shape = shape(a["run"]) == shape(p["run"]) and a["run"]["drawn"] == p["run"]["drawn"]
    bad["under"] += bool(fp["under"])
    bad["first"] += not first_ok
    bad["bottom"] += not bottom_ok
    bad["order"] += not ordered(fp)
    bad["scale"] += not held
    bad["shape"] += not same_shape
    print(
        f"| {key} | {shape(a['run'])} / {shape(p['run'])} | {a['run']['drawn']} / {p['run']['drawn']} | "
        f"{len(a['fold']['under'])} / {len(fp['under'])} | {first} vs {fp['chipBottom']} | {fp['inkBottom']} vs {fp['stageH']} | "
        f"{'yes' if ordered(fp) else 'NO'} | {'yes' if held else 'NO'} |"
    )
print()
print(
    f"cells: {n}; with the stand-in: ink under the chip in {bad['under']}, highest ink above the chip's bottom in {bad['first']}, "
    f"ink past the stage's bottom in {bad['bottom']}, order broken in {bad['order']}, scale moved at the fold in {bad['scale']}, "
    f"shape or drawn size different from as-is in {bad['shape']}"
)
