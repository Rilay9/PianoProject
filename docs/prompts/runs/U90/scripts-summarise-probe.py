"""Summarise U90's probe readings: for each label given (committed, fixed) and each condition (stack, wide,
stack at 115 % text, stack sideways),
the face the leap's title is drawn in, the leap row's title as a relationship (its text wider than its
box or not), and every Skills name the list cuts. Usage: scripts-summarise-probe.py <label> [<label> ...]."""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent

for label in sys.argv[1:]:
    for face in ("stack", "wide", "stack-115", "stack-sideways"):
        p = HERE / f"probe-{label}-{face}.json"
        if not p.exists():
            print(f"== {label} {face}: no reading")
            continue
        d = json.loads(p.read_text(encoding="utf-8"))
        print(f"== {label}, {face}: the leap's title drawn in {d['leapTitleDrawnIn']}; its button in {d['leapButtonDrawnIn']}")
        s = d["stage2"]
        leap = s["leap"]
        rel = "wider than" if leap["scrollWidth"] > leap["clientWidth"] else "no wider than"
        print(f"  Stage 2: {s['concepts']} concept rows, {s['drills']} drill rows; the leap's text is {rel} its box; "
              f"{leap['lines']} line(s); cut={leap['cut']}")
        print(f"  Stage 2 names cut: {s['cut'] or 'none'}")
        e = d["everyStage"]
        print(f"  every stage: {e['concepts']} concept rows, {e['drills']} drill rows")
        print(f"  concept names cut ({len(e['cutConcepts'])}):")
        for x in e["cutConcepts"]:
            print(f"    {x}")
        print(f"  drill titles cut ({len(e['cutDrills'])}):")
        for x in e["cutDrills"]:
            print(f"    {x}")
        print(f"  concept names on more than one line ({len(e['wrappedConcepts'])}):")
        for x in e["wrappedConcepts"]:
            print(f"    {x}")
        print(f"  rows not reading as one entry: {e['brokenRows'] or 'none'}")
        rows = [r for r in d["rows"] if r["kind"] == "concept"]
        with_actions = [r for r in rows if r["actions"] is not None]
        beside = [r for r in with_actions if r["actions"]["top"] < r["meta"]["bottom"] if r["meta"]]
        print(f"  concept rows with actions: {len(with_actions)}; actions beside the words (not dropped under them): {len(beside)}")
