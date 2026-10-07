"""Station 2: the C shuffle as built (music21 on the worktree's built file): its sha256, the catalogue
row's identity and hands, chord symbols per bar, and per bar per staff per voice the notes (for the
hand-fact draft and the chordMatch probe). Writes shuffle.json."""
import hashlib
import json
import sys
from fractions import Fraction
from pathlib import Path

from music21 import converter, harmony, stream

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
ID = "exercise.blues.twelve-bar-shuffle.c"
built = REPO / "app" / "public" / "content" / "scores" / "authored" / f"{ID}.mxl"
data = built.read_bytes()
cat = json.loads((REPO / "app" / "public" / "content" / "catalog.json").read_text(encoding="utf-8"))
items = cat["items"] if isinstance(cat, dict) else cat
row = next(i for i in items if i.get("id") == ID)
out = {"file": str(built.relative_to(REPO)).replace("\\", "/"), "sha256": hashlib.sha256(data).hexdigest(),
       "catalog": {k: row.get(k) for k in ("id", "title", "hands", "tempoBpm", "timeSig", "keySig", "file")},
       "provenance_identity": (row.get("provenance") or {}).get("identity"),
       "notation": {k: (row.get("notation") or {}).get(k) for k in ("chordCount", "staves", "voices")}}
s = converter.parse(str(built))
bars = {}
for si, part in enumerate(s.parts, start=1):
    for m in part.getElementsByClass(stream.Measure):
        b = bars.setdefault(int(m.number), {"symbols": [], "staves": {}})
        for h in m.recurse().getElementsByClass(harmony.ChordSymbol):
            b["symbols"].append({"figure": h.figure, "offset": str(Fraction(h.getOffsetInHierarchy(m)).limit_denominator(64)),
                                 "pcs": sorted({p.pitchClass for p in h.pitches})})
        voices = {}
        for n in m.recurse().notes:
            if isinstance(n, harmony.ChordSymbol):
                continue
            v = n.getContextByClass(stream.Voice)
            vid = v.id if v is not None else "1"
            voices.setdefault(str(vid), []).append({"onset": str(Fraction(n.getOffsetInHierarchy(m)).limit_denominator(64)),
                                                    "dur": str(Fraction(n.quarterLength).limit_denominator(64)),
                                                    "pitches": [p.nameWithOctave for p in n.pitches],
                                                    "midi": [int(p.midi) for p in n.pitches]})
        b["staves"][str(si)] = voices
out["bars"] = bars
(HERE / "shuffle.json").write_text(json.dumps(out, indent=1), encoding="utf-8")
print(json.dumps({k: out[k] for k in ("file", "sha256", "catalog", "provenance_identity", "notation")}, indent=1))
for b, v in sorted(bars.items()):
    print(b, [x["figure"] for x in v["symbols"]],
          {st: {vo: [n["pitches"] for n in ns] for vo, ns in vs.items()} for st, vs in v["staves"].items()})
