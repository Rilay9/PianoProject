"""U118: the stop condition's table, from the probe's JSON (build/u118/probe-out).

Per cell: the run's frozen shape with the stage as it is ("as-is") and with the stage made shorter
during the run by the two-line chip reserve ("reserved"): systems on the stage / systems in the window
/ bars shown, the drawn size (frozen CSS scale x engraving zoom), what bound the fit; and, from the
as-is run paused and folded, the header the fold takes away (the stage's growth at the fold), the
reserve, the chip's lines and whether the chip meets the first system's ink.
Usage: python summarise_stop.py <probe-out dir> [label]
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

out = Path(sys.argv[1])
label = sys.argv[2] if len(sys.argv) > 2 else ""
cells: dict[str, dict[str, dict]] = {}
for f in sorted(out.glob("*.json")):
    d = json.loads(f.read_text(encoding="utf-8"))
    key = f"{d['viewport']} {d['piece']} {d['bars']} bars text {d['text']}%"
    arm = d.get("arm") or ("reserved" if d["reserved"] else "as-is")
    if arm not in ("as-is", "reserved"):
        continue
    cells.setdefault(key, {})[arm] = d


def shape(s: dict) -> str:
    return f"{s['slots']}/{s['systems']}/{s['shown']}"


changed_count = 0
changed_scale = 0
rest_changed = 0
rows = []
for key, pair in cells.items():
    a = pair.get("as-is")
    r = pair.get("reserved")
    if a is None or r is None:
        rows.append(f"| {key} | missing | | | | | | |")
        continue
    ra, rr = a["run"], r["run"]
    count_same = shape(ra) == shape(rr)
    drawn_same = ra["drawn"] is not None and rr["drawn"] is not None and abs(ra["drawn"] - rr["drawn"]) < 0.0005
    if not count_same:
        changed_count += 1
    if not drawn_same:
        changed_scale += 1
    if shape(a["rest"]) != shape(r["rest"]):
        rest_changed += 1
    # The fold hides the header (`style.css`: `.score-head { display: none }` while folded, off a tablet),
    # so the stage grows by the header's height; read at rest, because the run's own read can land after
    # the fold on a slow settle.
    grow = round(a["rest"]["headH"], 1)
    reserve = round(a["reserve"], 1)
    chip = a["fold"]
    over = "yes" if chip["under"] else "no"
    drawn = f"{ra['drawn']} -> {rr['drawn']}" if not drawn_same else f"{ra['drawn']} (same)"
    rows.append(
        f"| {key} | {shape(ra)} | {shape(rr)} | {'same' if count_same else 'CHANGED'} | {drawn} | {ra['fitBy']} / {rr['fitBy']} | {grow} vs {reserve} | {chip['chipLines']} | {over} |"
    )

print(f"# U118 stop-condition table {label}".rstrip())
print()
print("| cell | as-is shape | reserved shape | count | drawn size (scale x zoom) | fit by | header the fold hides vs reserve (px) | chip lines (as-is, folded) | chip over first-system ink (as-is) |")
print("| --- | --- | --- | --- | --- | --- | --- | --- | --- |")
for row in rows:
    print(row)
print()
print(f"cells: {len(cells)}; shape changed by the reserve: {changed_count}; drawn size changed: {changed_scale}; at-rest shape differs between the two arms: {rest_changed}")
