"""U68's census: every planned item whose right-hand staff strikes nothing (CL15)."""
from __future__ import annotations

import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "content"))

from music21 import harmony  # noqa: E402

import generate_exercises as G  # noqa: E402


def struck(part) -> int:
    return sum(1 for n in part.recurse().notes if not isinstance(n, harmony.ChordSymbol))


def main() -> None:
    plan = G.default_plan(quick=False)
    by_family: dict[str, list[str]] = defaultdict(list)
    shapes = Counter()
    for sc, entry in plan:
        parts = list(sc.parts)
        ids = [p.id for p in parts]
        shapes[(len(parts), tuple(ids))] += 1
        rh = next((p for p in parts if p.id == "RH"), None)
        lh = next((p for p in parts if p.id == "LH"), None)
        if rh is not None and lh is not None and struck(rh) == 0 and struck(lh) > 0:
            by_family[entry["drill"]["generator"]["family"]].append(f"{entry['id']} (hands={entry.get('hands')})")
    out = {
        "planned": len(plan),
        "staff shapes": {f"{n} parts {list(ids)}": c for (n, ids), c in sorted(shapes.items(), key=str)},
        "left-hand-only items": sum(len(v) for v in by_family.values()),
        "families": {f: {"count": len(v), "items": v} for f, v in sorted(by_family.items())},
    }
    print(json.dumps(out, indent=1))


if __name__ == "__main__":
    main()
