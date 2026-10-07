"""
X31: the bundled scores whose build opening X31 moved, by what the committed read got wrong, from
`corpus-bpm.jsonl` (the first mark `recurse()` met, and the opening X31 takes).

    python docs/prompts/runs/X31/scripts-moved-by-cause.py docs/prompts/runs/X31/corpus-bpm.jsonl
"""
from __future__ import annotations

import collections
import json
import sys
from pathlib import Path


def main() -> int:
    rows = [json.loads(line) for line in Path(sys.argv[1]).read_text(encoding="utf-8").splitlines() if line.strip()]
    causes: collections.Counter[str] = collections.Counter()
    moved = 0
    for row in rows:
        if "error" in row or abs(row["before"] - row["after"]) < 0.01:
            continue
        moved += 1
        first, opening = row.get("first") or {}, row.get("opening") or {}
        if first.get("number") is None:
            causes["the first mark had no number (a <sound tempo> alone, or a mark music21 cannot read): read as 100"] += 1
        elif opening.get("order") != 0:
            causes["the opening is not the first mark found"] += 1
        elif opening.get("numberSounding") is not None:
            causes["music21 kept a sound that differs from the mark's number"] += 1
        elif tuple(opening.get("referent") or ()) != ("quarter", 0):
            unit, dots = opening["referent"]
            causes[f"a beat unit other than an undotted quarter: {unit}{'.' * dots}"] += 1
        else:
            causes["other"] += 1
    print(f"bundled scores whose build opening X31 moved: {moved}")
    for cause, count in causes.most_common():
        print(f"  {count}\t{cause}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
