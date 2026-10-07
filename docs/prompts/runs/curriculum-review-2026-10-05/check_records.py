"""Check every track record in this folder against BRIEF.md's contract.

    py -3.11 docs/prompts/runs/curriculum-review-2026-10-05/check_records.py

Reads content/curriculum/00-tracks.json for the denominator, then for each track:
the record exists; the thirteen headings are present in order; section 0 states
"Units reviewed: n/n"; no section is empty; the unit ids listed match the
curriculum's units for that track. Prints one line per track and exits 1 on any
failure. A green run proves the records are shaped as asked, not that they are right.
"""
from __future__ import annotations

import glob
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]

HEADINGS = [
    "## 0. Scope and denominator",
    "## 1. Promised endpoint",
    "## 2. Current coverage",
    "## 3. Missing or weak abilities",
    "## 4. Sequencing concerns",
    "## 5. Correctness concerns",
    "## 6. Practice and material sufficiency",
    "## 7. Measurement limits",
    "## 8. Recommended changes",
    "## 9. Confidence",
    "## 10. Owner decision required?",
    "## 11. Cross-track abilities",
    "## 12. Evidence not acted on",
]


def curriculum_units() -> dict[str, list[str]]:
    by: dict[str, list[str]] = {}
    for f in sorted(glob.glob(str(ROOT / "content/curriculum/stage-*.json"))):
        d = json.load(open(f, encoding="utf-8"))
        for st in d["stages"]:
            for u in st["units"]:
                by.setdefault(u["track"], []).append(u["id"])
    return by


def check(track: str, units: list[str]) -> list[str]:
    faults: list[str] = []
    p = HERE / f"{track}.md"
    if not p.exists():
        return [f"{track}: record missing ({p.name})"]
    text = p.read_text(encoding="utf-8")
    pos = -1
    for h in HEADINGS:
        i = text.find(h)
        if i == -1:
            faults.append(f"{track}: heading missing: {h}")
        elif i < pos:
            faults.append(f"{track}: heading out of order: {h}")
        else:
            pos = i
    # empty sections
    parts = re.split(r"^## \d+\. ", text, flags=re.M)[1:]
    for body in parts:
        title, _, rest = body.partition("\n")
        if len(rest.strip()) < 40:
            faults.append(f"{track}: section nearly empty: {title.strip()[:40]}")
    m = re.search(r"Units reviewed:\s*\**(\d+)\**\s*/\s*\**(\d+)", text)
    if not m:
        faults.append(f"{track}: no 'Units reviewed: n/n' line")
    else:
        n, d = int(m.group(1)), int(m.group(2))
        if d != len(units):
            faults.append(f"{track}: denominator {d} but curriculum has {len(units)} units: {units}")
        if n != d:
            faults.append(f"{track}: reviewed {n} of {d}")
    missing_ids = [u for u in units if u not in text]
    if missing_ids:
        faults.append(f"{track}: unit ids not mentioned anywhere: {missing_ids}")
    return faults


def main() -> int:
    tracks = [t["id"] for t in json.load(open(ROOT / "content/curriculum/00-tracks.json", encoding="utf-8"))["tracks"]]
    units = curriculum_units()
    all_faults: list[str] = []
    ok = 0
    for t in tracks:
        faults = check(t, units.get(t, []))
        if faults:
            all_faults += faults
            print(f"FAIL {t}")
            for f in faults:
                print("   ", f)
        else:
            ok += 1
            print(f"ok   {t}")
    print(f"\n{ok}/{len(tracks)} track records pass the shape check")
    return 1 if all_faults else 0


if __name__ == "__main__":
    sys.exit(main())
