"""Station 2: two independent readers of every <harmony> in a file, compared per symbol.

Reader A, the raw walk: ElementTree over the file's own XML (quarry_core.mxl_inner_xml unzips
it, nothing else), the symbol's position computed from <divisions>, note durations, <backup>,
<forward> and the harmony's own <offset>; pitch classes from a table written here from the
MusicXML 4.0 <kind> definitions and its <degree-alter> rule (alter/subtract: relative to the
degree as the kind has it; add: relative to a dominant chord, i.e. major and perfect intervals
and a minor seventh).

Reader B, music21: converter.parse on the same file (its own unzip and parser), every
harmony.ChordSymbol (NoChord included) with its measure number, offset, root, chordKind,
chord-step modifications and pitches; and the Roman figure music21 gives it in the named key.

Usage: py -3.11 harmony_read.py <file> <key, e.g. c or a> <label>
Writes build/a7a3/harmony-<label>.json and prints one line per symbol.
"""
from __future__ import annotations

import json
import sys
import xml.etree.ElementTree as ET
from fractions import Fraction
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / "tools" / "content"))
from pdmx.quarry_core import mxl_inner_xml  # noqa: E402

STEP = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
NAMES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"]
# MusicXML 4.0 kind-value: chord members as (degree, semitones above the root).
KIND = {
    "major": [(1, 0), (3, 4), (5, 7)],
    "minor": [(1, 0), (3, 3), (5, 7)],
    "augmented": [(1, 0), (3, 4), (5, 8)],
    "diminished": [(1, 0), (3, 3), (5, 6)],
    "dominant": [(1, 0), (3, 4), (5, 7), (7, 10)],
    "major-seventh": [(1, 0), (3, 4), (5, 7), (7, 11)],
    "minor-seventh": [(1, 0), (3, 3), (5, 7), (7, 10)],
    "diminished-seventh": [(1, 0), (3, 3), (5, 6), (7, 9)],
    "half-diminished": [(1, 0), (3, 3), (5, 6), (7, 10)],
    "major-sixth": [(1, 0), (3, 4), (5, 7), (6, 9)],
    "minor-sixth": [(1, 0), (3, 3), (5, 7), (6, 9)],
    "minor-ninth": [(1, 0), (3, 3), (5, 7), (7, 10), (9, 14)],
    "dominant-13th": [(1, 0), (3, 4), (5, 7), (7, 10), (9, 14), (11, 17), (13, 21)],
    "none": [],
}
# For degree-type add: relative to a dominant chord.
ADD_BASE = {1: 0, 2: 2, 3: 4, 4: 5, 5: 7, 6: 9, 7: 10, 9: 14, 11: 17, 13: 21}


def reader_a(xml: bytes) -> list[dict]:
    root = ET.fromstring(xml)
    out = []
    for part in root.iter("part"):
        divisions = 1
        for measure in part.iter("measure"):
            pos = Fraction(0)
            last_dur = Fraction(0)
            for el in measure:
                if el.tag == "attributes" and el.find("divisions") is not None:
                    divisions = int(el.find("divisions").text)
                elif el.tag == "note":
                    if el.find("grace") is not None:
                        continue
                    dur = Fraction(int(el.findtext("duration", "0")), divisions)
                    if el.find("chord") is not None:
                        continue  # same onset as the note before
                    pos += dur
                    last_dur = dur
                elif el.tag == "backup":
                    pos -= Fraction(int(el.findtext("duration", "0")), divisions)
                elif el.tag == "forward":
                    pos += Fraction(int(el.findtext("duration", "0")), divisions)
                elif el.tag == "harmony":
                    step = el.findtext("root/root-step")
                    alter = int(el.findtext("root/root-alter", "0") or 0)
                    kind_el = el.find("kind")
                    kind = (kind_el.text or "").strip()
                    printed = kind_el.get("text")
                    off = el.findtext("offset")
                    at = pos + (Fraction(int(off), divisions) if off else 0)
                    members = {d: s for d, s in KIND.get(kind, [(1, 0), (3, 4), (5, 7)])}
                    degrees = []
                    for dg in el.findall("degree"):
                        v = int(dg.findtext("degree-value"))
                        a = int(dg.findtext("degree-alter", "0") or 0)
                        t = dg.findtext("degree-type").strip()
                        degrees.append((v, a, t))
                        if t == "add":
                            members[v] = ADD_BASE[v] + a
                        elif t == "alter":
                            members[v] = members[v] + a
                        elif t == "subtract":
                            members.pop(v, None)
                    rpc = (STEP[step] + alter) % 12
                    bass = el.findtext("bass/bass-step")
                    out.append({
                        "measure": measure.get("number"), "offset": str(at), "root": NAMES[rpc], "rootPc": rpc,
                        "kind": kind, "printed": printed, "degrees": degrees,
                        "bass": (NAMES[(STEP[bass] + int(el.findtext("bass/bass-alter", "0") or 0)) % 12]
                                 if bass else None),
                        "pcs": sorted({(rpc + s) % 12 for s in members.values()}) if kind != "none" else [],
                    })
    return out


def reader_b(path: Path, tonic: str) -> list[dict]:
    from music21 import converter, harmony, key, roman
    k = key.Key(tonic)  # lower case: minor
    score = converter.parse(str(path))
    out = []
    for part in score.parts:
        for m in part.getElementsByClass("Measure"):
            for cs in m.recurse().getElementsByClass(harmony.ChordSymbol):
                nochord = isinstance(cs, harmony.NoChord)
                mods = [(d.degree, d.interval.semitones if d.interval else 0, d.modType)
                        for d in cs.getChordStepModifications()]
                pcs = sorted({p.pitchClass for p in cs.pitches}) if not nochord else []
                fig = None
                if not nochord and cs.pitches:
                    try:
                        fig = roman.romanNumeralFromChord(cs, k).figure
                    except Exception as e:  # noqa: BLE001
                        fig = f"error {e}"
                out.append({
                    "measure": str(m.number), "offset": str(Fraction(cs.offset).limit_denominator(64)),
                    "root": cs.root().name if cs.root() is not None and not nochord else None,
                    "rootPc": cs.root().pitchClass if cs.root() is not None and not nochord else None,
                    "kind": cs.chordKind, "figure": cs.figure, "mods": mods, "pcs": pcs,
                    "nochord": nochord, "roman": fig,
                    "bass": cs.bass().name if (not nochord and cs.bass() is not None) else None,
                })
    return out


def main() -> int:
    path, tonic, label = Path(sys.argv[1]), sys.argv[2], sys.argv[3]
    a = reader_a(mxl_inner_xml(path.read_bytes()))
    b = reader_b(path, tonic)
    rows = []
    for i in range(max(len(a), len(b))):
        x = a[i] if i < len(a) else None
        y = b[i] if i < len(b) else None
        agree = bool(x and y and x["measure"] == y["measure"] and Fraction(x["offset"]) == Fraction(y["offset"])
                     and x["pcs"] == y["pcs"] and (x["kind"] == "none") == y["nochord"]
                     and (x["kind"] == "none" or x["rootPc"] == y["rootPc"]))
        rows.append({"A": x, "B": y, "agree": agree})
        pa = "-".join(NAMES[p] for p in x["pcs"]) if x else "?"
        pb = "-".join(NAMES[p] for p in y["pcs"]) if y else "?"
        print(f"{'AGREE' if agree else 'DIFFER'}  bar {x and x['measure']:>3} @{x and x['offset']:<4} "
              f"A: {x and x['root']}{'' if not x else ' ' + x['kind']} deg={x and x['degrees']} "
              f"printed={x and x['printed']!r} pcs={pa} | B: bar {y and y['measure']} @{y and y['offset']} "
              f"{y and y['figure']!r} kind={y and y['kind']} mods={y and y['mods']} pcs={pb} roman={y and y['roman']}")
    print(f"{label}: reader A {len(a)} symbols, reader B {len(b)}, agree {sum(r['agree'] for r in rows)}/{len(rows)}")
    (HERE / f"harmony-{label}.json").write_text(json.dumps(rows, indent=1, default=str), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
