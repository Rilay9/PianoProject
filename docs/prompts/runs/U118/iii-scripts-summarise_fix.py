"""U118, option (iii): the ordinary path and the size taken while folded, from the probe's JSON on the fixed build.

Arms (one JSON each per cell): `as-is` is the fixed build's ordinary run (unfolded start, frozen, paused,
folded); `turned` is the same run turned and turned back while folded, so its size is taken again with the
chip drawn; `turned-off` is that turn with the chip hidden for the whole run, so the band is 0 — how the
code before U118 prices it.

Table A: the ordinary path's frozen shape and drawn size against the code before U118 (the as-is columns
of the stop tables, `stop-table-run1.md` and `stop-table-not-tablets.md`), and once folded: the band,
whether anything of the score's ink is under the chip, the highest ink against the band, the lowest ink
against the stage's bottom, the slots' first-bar order, and the frozen scale before and after the fold.
Table B: the turned run's shape and drawn size with the band and without it, against the ordinary path at
the same geometry, and its ink against the chip and the stage's bottom.
Usage: python summarise_fix.py <probe-out dir> <stop table .md> [label]
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

out = Path(sys.argv[1])
table = Path(sys.argv[2]).read_text(encoding="utf-8")
label = sys.argv[3] if len(sys.argv) > 3 else ""

base: dict[str, tuple[str, float]] = {}
for line in table.splitlines():
    cells = [c.strip() for c in line.strip().strip("|").split("|")]
    if len(cells) < 5 or not re.match(r"^\d+x\d+ ", cells[0]):
        continue
    drawn = float(cells[4].split(" ")[0])
    base[cells[0]] = (cells[1], drawn)

cells: dict[str, dict[str, dict]] = {}
for f in sorted(out.glob("*.json")):
    d = json.loads(f.read_text(encoding="utf-8"))
    key = f"{d['viewport']} {d['piece']} {d['bars']} bars text {d['text']}%"
    cells.setdefault(key, {})[d["arm"]] = d


def shape(s: dict | None) -> str:
    return "?" if not s else f"{s['slots']}/{s['systems']}/{s['shown']}"


def ordered(fold: dict) -> bool:
    froms = [p["from"] if p["from"] is not None else 10**9 for p in fold.get("placed", [])]
    return froms == sorted(froms)


a_rows, b_rows = [], []
bad = {"shape": 0, "under": 0, "inkTop": 0, "bottom": 0, "order": 0, "scale": 0, "missing": 0}
tb = {"count_vs_off": 0, "smaller_than_ordinary": 0, "fewer_than_ordinary": 0, "under": 0, "bottom": 0, "off_bottom": 0}
for key, arms in cells.items():
    o = arms.get("as-is")
    if o is None:
        continue
    run, fold, after = o["run"], o["fold"], o["after"]
    band = after.get("band") or 0
    want = base.get(key)
    same = want is not None and want[0] == shape(run) and abs(want[1] - (run["drawn"] or 0)) < 0.0005
    if want is None:
        bad["missing"] += 1
    elif not same:
        bad["shape"] += 1
    # The chip's bottom in the probe's frame is the stage's border box; the band is the padding box's.
    ink_ok = fold["inkTop"] is not None and fold["chipBottom"] is not None and fold["inkTop"] >= fold["chipBottom"]
    bottom_ok = fold["inkBottom"] is not None and fold["inkBottom"] <= fold["stageH"] + 1
    held = run["frozenScale"] == after["frozenScale"]
    bad["under"] += bool(fold["under"])
    bad["inkTop"] += not ink_ok
    bad["bottom"] += not bottom_ok
    bad["order"] += not ordered(fold)
    bad["scale"] += not held
    a_rows.append(
        f"| {key} | {want[0] if want else '?'} / {shape(run)} | {want[1] if want else '?'} / {run['drawn']} | {round(band, 2)} | "
        f"{fold['chipLines']} | {len(fold['under'])} | {fold['inkTop']} vs {fold['chipBottom']} | {fold['inkBottom']} vs {fold['stageH']} | "
        f"{'yes' if ordered(fold) else 'NO'} | {'yes' if held else 'NO'} |"
    )
    t, off = arms.get("turned"), arms.get("turned-off")
    if t and off and t.get("turnedRun") and off.get("turnedRun"):
        tr, tf, orr, of = t["turnedRun"], t["turnedFold"], off["turnedRun"], off["turnedFold"]
        count_differs = (tr["slots"], tr["systems"], tr["shown"]) != (orr["slots"], orr["systems"], orr["shown"])
        fewer = (tr["systems"], tr["shown"], tr["slots"]) < (run["systems"], run["shown"], run["slots"])
        smaller = (tr["drawn"] or 0) < (run["drawn"] or 0) - 0.0005
        t_bottom = tf["inkBottom"] is not None and tf["inkBottom"] <= tf["stageH"] + 1
        off_bottom = of["inkBottom"] is not None and of["inkBottom"] <= of["stageH"] + 1
        tb["count_vs_off"] += count_differs
        tb["fewer_than_ordinary"] += fewer
        tb["smaller_than_ordinary"] += smaller
        tb["under"] += bool(tf["under"])
        tb["bottom"] += not t_bottom
        tb["off_bottom"] += not off_bottom
        b_rows.append(
            f"| {key} | {shape(run)} @ {run['drawn']} | {shape(orr)} @ {orr['drawn']} | {shape(tr)} @ {tr['drawn']} | "
            f"{'CHANGED' if count_differs else 'same'} | {len(tf['under'])} | {tf['inkBottom']} vs {tf['stageH']} | {of['inkBottom']} vs {of['stageH']} | {tr['chrome']} |"
        )

print(f"# U118 option (iii): the ordinary path {label}".rstrip())
print()
print("| cell | shape before U118 / now | drawn before / now | band (px) | chip lines | marks under the chip | highest ink vs chip bottom | lowest ink vs stage bottom | order kept | frozen scale held through the fold |")
print("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |")
for row in a_rows:
    print(row)
print()
print(
    f"cells: {len(a_rows)}; shape or drawn size different from before U118: {bad['shape']} (no base row: {bad['missing']}); "
    f"ink under the chip: {bad['under']}; highest ink above the chip's bottom: {bad['inkTop']}; ink past the stage's bottom: {bad['bottom']}; "
    f"order broken: {bad['order']}; frozen scale moved at the fold: {bad['scale']}"
)
print()
print(f"# U118 option (iii): a size taken while folded (turned and turned back) {label}".rstrip())
print()
print("| cell | ordinary path | turned, band 0 (before U118) | turned, band | count with the band vs without | marks under the chip (band) | lowest ink vs stage bottom (band) | lowest ink vs stage bottom (band 0) | chrome after the turns |")
print("| --- | --- | --- | --- | --- | --- | --- | --- | --- |")
for row in b_rows:
    print(row)
print()
print(
    f"cells: {len(b_rows)}; count changed by the band: {tb['count_vs_off']}; fewer systems or bars than the ordinary path: {tb['fewer_than_ordinary']}; "
    f"drawn smaller than the ordinary path: {tb['smaller_than_ordinary']}; ink under the chip: {tb['under']}; ink past the stage's bottom with the band: {tb['bottom']}; "
    f"ink past the stage's bottom with band 0: {tb['off_bottom']}"
)
