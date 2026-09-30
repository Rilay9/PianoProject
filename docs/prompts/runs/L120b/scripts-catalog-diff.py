"""
L120b: the catalogue diff by item and demand between two builds (item 2: "a catalogue diff by item and demand
over every row with a 3/8 bar, each move named"). Compares each item's `demands`, `measurement.located`,
`measurement.established` and (after class 2) `measurement.span`; says which rows carry a 3/8 bar
(`timeSig` or `notation.times`) and holds every other row's reading unchanged but for the stamps
(`definitions`, `detectors`). Run from the worktree root:

    python docs/prompts/runs/L120b/scripts-catalog-diff.py build/l120b-before/catalog.json build/l120b-after-reading/catalog.json OUT.txt
"""
from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path


def three_eight(item: dict) -> bool:
    times = (item.get("notation") or {}).get("times") or []
    return item.get("timeSig") == "3/8" or "3/8" in times


def reading(item: dict) -> dict:
    m = item.get("measurement") or {}
    return {"demands": item.get("demands"), "located": m.get("located") or {}, "established": m.get("established") or [],
            "span": m.get("span"), "status": m.get("status")}


def main(before_path: str, after_path: str, out_path: str) -> int:
    before = {it["id"]: it for it in json.loads(Path(before_path).read_text(encoding="utf-8"))}
    after = {it["id"]: it for it in json.loads(Path(after_path).read_text(encoding="utf-8"))}
    lines: list[str] = []
    moves: Counter = Counter()
    rows_moved: dict[str, list[str]] = {}
    other_moved: list[str] = []
    span_rows = 0
    for ident in sorted(set(before) | set(after)):
        a, b = before.get(ident), after.get(ident)
        if a is None or b is None:
            lines.append(f"{ident}: only in {'after' if a is None else 'before'}")
            continue
        ra, rb = reading(a), reading(b)
        if rb["span"] is not None:
            span_rows += 1
        changes = []
        da = set(ra["demands"]) if isinstance(ra["demands"], list) else set()
        db = set(rb["demands"]) if isinstance(rb["demands"], list) else set()
        for d in sorted(db - da):
            changes.append(f"+{d} (located {rb['located'].get(d, 0)})")
            moves[("enters", d)] += 1
        for d in sorted(da - db):
            changes.append(f"-{d} (was located {ra['located'].get(d, 0)})")
            moves[("leaves", d)] += 1
        for d in sorted(da & db):
            if ra["located"].get(d, 0) != rb["located"].get(d, 0):
                changes.append(f"{d} located {ra['located'].get(d, 0)} -> {rb['located'].get(d, 0)}")
                moves[("located", d)] += 1
        ea, eb = set(ra["established"]), set(rb["established"])
        for d in sorted(eb - ea):
            changes.append(f"established +{d}")
            moves[("established+", d)] += 1
        for d in sorted(ea - eb):
            changes.append(f"established -{d}")
            moves[("established-", d)] += 1
        if ra["status"] != rb["status"]:
            changes.append(f"status {ra['status']} -> {rb['status']}")
        if changes:
            rows_moved[ident] = changes
            if not three_eight(b):
                other_moved.append(ident)
    rows_38 = [ident for ident, it in after.items() if three_eight(it)]
    lines.insert(0, f"# Catalogue diff: {before_path} -> {after_path}")
    lines.insert(1, "")
    lines.insert(2, f"- rows in both: {len(set(before) & set(after))}; rows with a 3/8 bar (timeSig or notation.times): {len(rows_38)}"
                 f" ({sum(1 for i in rows_38 if after[i].get('timeSig') == '3/8')} of them with timeSig 3/8)")
    lines.insert(3, f"- rows whose demands, located counts or established set moved: {len(rows_moved)}; of them without a 3/8 bar: {len(other_moved)}")
    lines.insert(4, f"- rows carrying measurement.span after: {span_rows}")
    lines.insert(5, "- moves by kind and demand: " + (", ".join(f"{k[0]} {k[1]} {n}" for k, n in sorted(moves.items())) or "none"))
    lines.insert(6, "")
    lines.append("## Rows with a 3/8 bar")
    lines.append("")
    for ident in sorted(rows_38):
        it = after[ident]
        tag = f"timeSig {it.get('timeSig')}; times {', '.join((it.get('notation') or {}).get('times') or []) or 'none'}"
        lines.append(f"{ident} [{tag}]: " + ("; ".join(rows_moved.get(ident, [])) or "no move"))
    lines.append("")
    lines.append("## Rows without a 3/8 bar that moved")
    lines.append("")
    for ident in other_moved:
        it = after[ident]
        tag = f"timeSig {it.get('timeSig')}; times {', '.join((it.get('notation') or {}).get('times') or []) or 'none'}"
        lines.append(f"{ident} [{tag}]: " + "; ".join(rows_moved[ident]))
    if not other_moved:
        lines.append("none")
    Path(out_path).write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines[:7]))
    return 0


if __name__ == "__main__":
    sys.exit(main(*sys.argv[1:4]))
