"""Bars that walk, per walking-bass option on the four deferred rungs, before and after (CL15).

usage: python walk_counts.py <plan-base.json> <plan-after.json>
`detect.ts`'s `walkingBass` reading of one bar, restated for the count only: four quarters in the
left hand that never come back to a pitch they have left (a repeated note is not leaving). The
deferral texts in `validate.py` state these counts; the build's own check is that the claims stay
unestablished (`concept_claim_findings`), and this re-reads the numbers the texts print.
"""
from __future__ import annotations

import glob
import json
import sys
from pathlib import Path

from music21 import pitch

ROOT = Path(__file__).resolve().parents[2]


def walks(rows: list[str]) -> list[bool]:
    bars: dict[int, list[tuple[str, float]]] = {}
    for event in rows:
        bar, rest = event.split(":", 1)
        _offset, name, length = rest.split(" ")[:3]
        bars.setdefault(int(bar), []).append((name, float(length)))
    out = []
    for bar in sorted(bars):
        notes = bars[bar]
        quarters = len(notes) == 4 and all(length == 1.0 for _n, length in notes)
        midi = [pitch.Pitch(name).midi for name, _l in notes if name != "rest"]
        left: set[int] = set()
        back = False
        for before, here in zip(midi, midi[1:]):
            if here == before:
                continue
            left.add(before)
            back = back or here in left
        out.append(quarters and not back)
    return out


def main() -> None:
    base = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    after = json.loads(Path(sys.argv[2]).read_text(encoding="utf-8"))
    options: dict[str, list[str]] = {}
    for path in glob.glob(str(ROOT / "content" / "curriculum" / "*.json")):
        data = json.loads(Path(path).read_text(encoding="utf-8"))
        for stage in data.get("stages", []) if isinstance(data, dict) else []:
            for unit in stage.get("units", []):
                for lesson in unit.get("lessons", []):
                    options[lesson["id"]] = [o for o in lesson.get("exerciseOptions", []) if "walking-bass" in o]
    for rung in ("blues.6", "blues.8", "jazz.6", "jam.6"):
        for item in options.get(rung, []):
            b, a = walks(base[item]["notes"]["LH"]), walks(after[item]["notes"]["LH"])
            print(f"{rung} {item}: before {sum(b)} of {len(b)}, after {sum(a)} of {len(a)}; "
                  f"bars that do not walk after: {[i + 1 for i, ok in enumerate(a) if not ok]}")


if __name__ == "__main__":
    main()
