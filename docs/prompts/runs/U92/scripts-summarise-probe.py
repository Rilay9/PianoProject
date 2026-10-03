"""Summarise U92's probe readings for one state (build/u92-probe/<label>/probe-<label>-<face>.json):
what each Stage 2 concept row's detail line reads, then the counts over every stage and the rows whose
first token is not read whole. Usage: python scripts-summarise-probe.py <label> [<label> ...]"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
sys.stdout.reconfigure(encoding="utf-8")

for label in sys.argv[1:]:
    for face in ("stack", "wide"):
        path = ROOT / "build" / "u92-probe" / label / f"probe-{label}-{face}.json"
        d = json.loads(path.read_text(encoding="utf-8"))
        print(f"== {label}, {face} face, {d['viewport']}")
        print("Stage 2, each concept row's detail as read:")
        for line in d["stage2"]:
            print("  " + line)
        e = d["everyStage"]
        print("Every stage:")
        for key, value in e.items():
            if key == "conceptsLineWithoutAllThreeFacts":
                print(f"  {key}: {len(value)} (fitDetail's whole-token drop; listed in the JSON)")
            elif isinstance(value, list):
                print(f"  {key}: {len(value)}")
                for item in value:
                    print(f"    {item}")
            else:
                print(f"  {key}: {value}")
        rows = {(r["kind"], r["id"]): r for r in d["rows"]}
        for cid in ("position-shift", "I-IV-V7", "leap"):
            r = rows.get(("concept", cid))
            if r:
                print(f"  {cid}: \"{r['meta']}\" reads \"{r['reads']}\"; meta lines {r['metaLines']}, title lines {r['titleLines']}, row {r['rowHeight']} px")
        print()
