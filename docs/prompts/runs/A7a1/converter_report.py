"""Station 1 step 4 (H2): what convert.convert_file wrote for Qmb7, part by part, and why gate 2 fails.

1. Parts and staves of the raw file and the converted file (music21 via convert.parse_source, the
   parser quarry.py uses), with each part's pitched, unpitched and rest counts.
2. Per converted staff, per bar, every event (offset, duration, pitches or 'unpitched'), and which
   raw part each event matches (riff, voicing, root, drum) by (bar, offset, duration, pitch).
3. quarry.pitch_multiset on both, and the same set with the staff index removed, so the gate's
   'lost N and gained N' can be read as moved or lost.
Writes converter-report.json and prints a summary.
"""
from __future__ import annotations

import json
import sys
from collections import Counter
from fractions import Fraction
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / "tools" / "content"))
from convert import parse_source  # noqa: E402
from music21 import note, stream  # noqa: E402
from pdmx.quarry import pitch_multiset  # noqa: E402

CID = "Qmb7mkEfKzmNvK5EJKb5Ntph7797QwEeS4anHT8q8wdgKi"
RAW = HERE / "pdmx" / "raw" / f"{CID}.mxl"
CONV = HERE / "pdmx" / "converted" / f"{CID}.mxl"


def q(x) -> str:
    return str(Fraction(x).limit_denominator(64))


def events(part: stream.Stream) -> list[dict]:
    out = []
    for m in part.getElementsByClass(stream.Measure):
        for el in m.recurse().notesAndRests:
            off = el.getOffsetInHierarchy(m)
            kind = "rest" if el.isRest else ("unpitched" if isinstance(el, note.Unpitched) or not el.pitches else "pitched")
            tie = getattr(el.tie, "type", None) if el.tie else None
            out.append({"bar": int(m.number), "offset": q(off), "dur": q(el.quarterLength), "kind": kind,
                        "pitches": [p.nameWithOctave for p in el.pitches] if kind == "pitched" else [],
                        "tie": tie})
    return out


def summary(score: stream.Score) -> list[dict]:
    rows = []
    for i, p in enumerate(score.parts):
        ev = events(p)
        rows.append({"index": i + 1, "class": type(p).__name__, "id": p.id, "name": p.partName,
                     "clef": type(p.recurse().getElementsByClass("Clef")[0]).__name__
                     if p.recurse().getElementsByClass("Clef") else None,
                     "measures": len(p.getElementsByClass(stream.Measure)),
                     "pitched": sum(1 for e in ev if e["kind"] == "pitched"),
                     "pitched_heads": sum(len(e["pitches"]) for e in ev if e["kind"] == "pitched"),
                     "unpitched": sum(1 for e in ev if e["kind"] == "unpitched"),
                     "rests": sum(1 for e in ev if e["kind"] == "rest")})
    return rows


raw, conv = parse_source(RAW), parse_source(CONV)
report = {"raw_parts": summary(raw), "converted_parts": summary(conv)}

# Label each raw pitched head by its source role.
ROLE = {}
for i, p in enumerate(raw.parts):
    name = (p.partName or "").lower()
    clef_name = report["raw_parts"][i]["clef"] or ""
    if "riff" in name:
        role = "riff"
    elif "drum" in name:
        role = "drum"
    elif "Bass" in clef_name:
        role = "root"
    else:
        role = "voicing"
    for e in events(p):
        for pitch in e["pitches"]:
            ROLE.setdefault((e["bar"], e["offset"], e["dur"], pitch), []).append(role)
        if e["kind"] == "unpitched":
            ROLE.setdefault((e["bar"], e["offset"], e["dur"], "x"), []).append(role)

staff_roles = []
for i, p in enumerate(conv.parts):
    c = Counter()
    unmatched = []
    for e in events(p):
        heads = e["pitches"] if e["kind"] == "pitched" else (["x"] if e["kind"] == "unpitched" else [])
        for h in heads:
            roles = ROLE.get((e["bar"], e["offset"], e["dur"], h))
            if roles:
                c[roles[0]] += 1
            else:
                unmatched.append({**e, "head": h})
    staff_roles.append({"staff": i + 1, "roles": dict(c), "unmatched": unmatched})
report["converted_staff_roles"] = staff_roles

sr, sc = pitch_multiset(raw), pitch_multiset(conv)
report["gate2"] = {"raw": len(sr), "converted": len(sc), "lost": len(sr - sc), "gained": len(sc - sr),
                   "lost_by_staff": dict(Counter(s for _, s, _ in sr - sc)),
                   "gained_by_staff": dict(Counter(s for _, s, _ in sc - sr))}


def no_staff(score):
    counts, out = Counter(), set()
    for part in score.parts:
        for m in part.recurse().getElementsByClass("Measure"):
            for el in m.recurse().notes:
                if getattr(el.tie, "type", None) in ("stop", "continue"):
                    continue
                for pitch in el.pitches:
                    k = (int(m.number), int(pitch.midi))
                    counts[k] += 1
                    out.add((k[0], k[1] * 1000 + counts[k]))
    return out


nr, nc = no_staff(raw), no_staff(conv)
report["staff_free"] = {"raw": len(nr), "converted": len(nc), "lost": sorted(nr - nc), "gained": sorted(nc - nr)}
report["converted_events"] = [{"staff": i + 1, "events": events(p)} for i, p in enumerate(conv.parts)]
(HERE / "converter-report.json").write_text(json.dumps(report, indent=1), encoding="utf-8")
print(json.dumps({k: report[k] for k in ("raw_parts", "converted_parts", "gate2", "staff_free")}, indent=1))
for s in staff_roles:
    print("converted staff", s["staff"], "roles", s["roles"], "unmatched", len(s["unmatched"]), s["unmatched"][:6])
