"""Every planned item's generator identity, music digest and a readable note list (CL15's before/after record).

usage: python build/cl15/snapshot_plan.py <out.json>
Run once on the base generator (before any edit) and once on the edited one.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT / "tools" / "content") not in sys.path:
    sys.path.insert(0, str(ROOT / "tools" / "content"))

from music21 import harmony, meter  # noqa: E402

import generate_exercises as G  # noqa: E402
import review  # noqa: E402
from tests.test_family_contracts import music_digest  # noqa: E402


def notes_of(sc) -> dict:
    """Per staff: (bar, beat-in-bar, written pitches or 'rest', quarter length, tie) as text."""
    out = {}
    for part in sc.parts:
        rows = []
        for m in part.getElementsByClass("Measure"):
            for n in m.notesAndRests:
                if isinstance(n, harmony.ChordSymbol):
                    continue
                what = "rest" if n.isRest else "+".join(p.nameWithOctave for p in n.pitches)
                tie = f" tie-{n.tie.type}" if getattr(n, "tie", None) is not None else ""
                rows.append(f"{m.number}:{float(n.offset):g} {what} {float(n.duration.quarterLength):g}{tie}")
        out[part.id] = rows
    symbols = []
    for part in sc.parts:
        for m in part.getElementsByClass("Measure"):
            for s in m.getElementsByClass(harmony.ChordSymbol):
                symbols.append(f"{m.number}:{float(s.offset):g} {s.figure}")
    if symbols:
        out["symbols"] = symbols
    return out


def main() -> None:
    out_path = Path(sys.argv[1])
    plan = G.default_plan(quick=False)
    rows = {}
    for sc, entry in plan:
        sig = next(iter(sc.recurse().getElementsByClass(meter.TimeSignature)), None)
        rows[entry["id"]] = {
            "family": entry["drill"]["generator"]["family"],
            "identity": review.generator_identity(entry),
            "digest": music_digest(sc, entry),
            "title": entry["title"],
            "tags": entry["tags"],
            "concepts": entry["concepts"],
            "role": entry.get("role"),
            "level": entry["level"],
            "hands": entry["hands"],
            "tempoBpm": entry["tempoBpm"],
            "timeSig": sig.ratioString if sig else None,
            "notes": notes_of(sc),
        }
    out_path.write_text(json.dumps(rows, indent=1, ensure_ascii=False), encoding="utf-8")
    print(f"{len(rows)} items -> {out_path}")


if __name__ == "__main__":
    main()
