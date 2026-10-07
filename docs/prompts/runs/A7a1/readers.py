"""Station 1 step 5, the claim checks: two independent readers of the RAW Blues Riff member.

Reader A: a raw MusicXML walk (ElementTree over the file's own XML). Position from <divisions>,
<duration>, <backup>, <forward>, the <chord/> flag and grace notes (no advance); staff from <staff>;
pitch from <step>/<alter>/<octave>; unpitched from <unpitched>/<display-step>; ties from <tie>.
Reader B: music21 (music21.converter.parse on the same bytes; PartStaff per staff; offsets in the
measure; pitch.nameWithOctave normalised to the same spelling).

Each event is (role, bar, onset quarter, duration quarter, head, tie), head a spelled pitch such
as "Bb4" or "x" for an unpitched head. Roles come from the part and staff: Piano staff 1 =
voicing, Piano staff 2 = root, Riff = riff, Drumset = drum. Rests are listed separately.
The readers' event multisets are compared; then the claims are derived from reader A and checked
against reader B's derivation: the plan per bar from the roots, the voicings' pitch classes per
bar, every B and Bb in each part with bar and beat, the bars 9-10 rhythms.
Writes readers.json and events-by-role.json (reader A's events, the re-staffing brief's table).
"""
from __future__ import annotations

import hashlib
import io
import json
import sys
import xml.etree.ElementTree as ET
import zipfile
from collections import Counter, defaultdict
from fractions import Fraction
from pathlib import Path

HERE = Path(__file__).resolve().parent
CID = "Qmb7mkEfKzmNvK5EJKb5Ntph7797QwEeS4anHT8q8wdgKi"
RAW = HERE / "pdmx" / "raw" / f"{CID}.mxl"
DATA = RAW.read_bytes()
SHA = hashlib.sha256(DATA).hexdigest()


def inner_xml(data: bytes) -> bytes:
    """The score file named by META-INF/container.xml (read here, not through quarry_core)."""
    z = zipfile.ZipFile(io.BytesIO(data))
    container = ET.fromstring(z.read("META-INF/container.xml"))
    for el in container.iter():
        if el.tag.endswith("rootfile") and el.get("full-path"):
            return z.read(el.get("full-path"))
    raise SystemExit("no rootfile")


def role_of(part_name: str, staff: int) -> str:
    n = part_name.lower()
    if "riff" in n:
        return "riff"
    if "drum" in n:
        return "drum"
    return "root" if staff == 2 else "voicing"


def spell(step: str, alter: int, octave: int) -> str:
    return step + {-2: "bbb"[:2], -1: "b", 0: "", 1: "#", 2: "##"}[alter] + str(octave)


def q(x) -> str:
    return str(Fraction(x).limit_denominator(256))


# ---------------------------------------------------------------- reader A
def reader_a() -> tuple[list[tuple], list[tuple]]:
    root = ET.fromstring(inner_xml(DATA))
    names = {sp.get("id"): (sp.findtext("part-name") or "").strip() for sp in root.iter("score-part")}
    events, rests = [], []
    for part in root.findall("part"):
        name = names.get(part.get("id"), "")
        divisions = 1
        for measure in part.findall("measure"):
            bar = int(measure.get("number"))
            pos = Fraction(0)
            last_onset = Fraction(0)
            for el in measure:
                if el.tag == "attributes" and el.findtext("divisions"):
                    divisions = int(el.findtext("divisions"))
                elif el.tag == "backup":
                    pos -= Fraction(int(el.findtext("duration")), divisions)
                elif el.tag == "forward":
                    pos += Fraction(int(el.findtext("duration")), divisions)
                elif el.tag == "note":
                    grace = el.find("grace") is not None
                    dur = Fraction(int(el.findtext("duration") or 0), divisions)
                    is_chord = el.find("chord") is not None
                    onset = last_onset if is_chord else pos
                    staff = int(el.findtext("staff") or 1)
                    role = role_of(name, staff)
                    ties = sorted(t.get("type") for t in el.findall("tie"))
                    tie = "+".join(ties) if ties else None
                    if el.find("rest") is not None:
                        rests.append((role, bar, q(onset), q(dur)))
                    elif el.find("pitch") is not None:
                        p = el.find("pitch")
                        head = spell(p.findtext("step"), int(float(p.findtext("alter") or 0)), int(p.findtext("octave")))
                        events.append((role, bar, q(onset), q(dur), head, tie, "grace" if grace else ""))
                    elif el.find("unpitched") is not None:
                        events.append((role, bar, q(onset), q(dur), "x", tie, "grace" if grace else ""))
                    if not is_chord and not grace:
                        last_onset = pos
                        pos += dur
                    elif not is_chord and grace:
                        last_onset = pos
    return events, rests


# ---------------------------------------------------------------- reader B
def reader_b() -> tuple[list[tuple], list[tuple]]:
    from music21 import chord, converter, note, stream
    score = converter.parseData(inner_xml(DATA), format="musicxml") if hasattr(converter, "parseData") else None
    if score is None:
        score = converter.parse(io.BytesIO(inner_xml(DATA)).read(), format="musicxml")
    events, rests = [], []
    for part in score.parts:
        name = part.partName or ""
        staff = 2 if part.id.endswith("Staff2") else 1
        role = role_of(name, staff)
        for m in part.getElementsByClass(stream.Measure):
            bar = int(m.number)
            for el in m.recurse().notesAndRests:
                onset = el.getOffsetInHierarchy(m)
                dur = el.quarterLength
                grace = "grace" if el.duration.isGrace else ""
                tie = None
                if el.isRest:
                    rests.append((role, bar, q(onset), q(dur)))
                    continue
                heads = []
                if isinstance(el, note.Unpitched):
                    heads = ["x"]
                elif isinstance(el, chord.ChordBase):
                    # A chord: each member may be pitched or unpitched (a PercussionChord).
                    for n in el.notes:
                        heads.append("x" if isinstance(n, note.Unpitched) else
                                     n.pitch.step + {-2: "bb", -1: "b", 0: "", 1: "#", 2: "##"}[
                                         int(n.pitch.accidental.alter) if n.pitch.accidental else 0] + str(n.pitch.octave))
                else:
                    p = el.pitch
                    heads = [p.step + {-2: "bb", -1: "b", 0: "", 1: "#", 2: "##"}[
                        int(p.accidental.alter) if p.accidental else 0] + str(p.octave)]
                if el.tie is not None:
                    tie = {"start": "start", "stop": "stop", "continue": "start+stop"}.get(el.tie.type, el.tie.type)
                for h in heads:
                    events.append((role, bar, q(onset), q(dur), h, tie, grace))
    return events, rests


def beat(onset: str) -> str:
    b = Fraction(onset) + 1
    return str(b) if b.denominator > 1 else str(b.numerator)


PC = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
ROMAN = {0: "I", 5: "IV", 7: "V"}
INTERVAL = {0: "1", 1: "b9", 2: "9", 3: "b3/#9", 4: "3", 5: "11", 6: "b5/#11", 7: "5", 8: "#5/b13", 9: "6/13",
            10: "b7", 11: "7"}


def pc(head: str) -> int:
    s = head.rstrip("0123456789")
    return (PC[s[0]] + s.count("#") - s[1:].count("b")) % 12


def claims(events: list[tuple]) -> dict:
    by = defaultdict(list)
    for e in events:
        by[(e[0], e[1])].append(e)
    bars = sorted({e[1] for e in events})
    out = {"plan": {}, "voicings": {}, "B_and_Bb": [], "bars_9_10_riff": {}, "counts": {}}
    for b in bars:
        roots = by[("root", b)]
        rpc = sorted({pc(e[4]) for e in roots})
        out["plan"][b] = {"roots": [(e[4], beat(e[2]), e[3]) for e in roots],
                          "roman": "+".join(ROMAN.get(x, "?") for x in rpc)}
        vo = by[("voicing", b)]
        vpcs = sorted({pc(e[4]) for e in vo})
        r = rpc[0] if rpc else 0
        out["voicings"][b] = {"heads": [(e[4], beat(e[2]), e[3]) for e in vo],
                              "pcs": vpcs, "over_root": sorted(INTERVAL[(x - r) % 12] for x in vpcs)}
    for e in sorted(events, key=lambda e: (e[1], e[0], Fraction(e[2]), e[4])):
        if e[4] != "x" and e[4].rstrip("0123456789") in ("B", "Bb"):
            out["B_and_Bb"].append({"part": e[0], "bar": e[1], "beat": beat(e[2]), "dur": e[3], "head": e[4]})
    for b in (9, 10):
        out["bars_9_10_riff"][b] = [(beat(e[2]), e[3], e[4], e[5]) for e in sorted(by[("riff", b)], key=lambda e: (Fraction(e[2]), e[4]))]
    out["counts"] = dict(Counter(e[0] for e in events))
    return out


a_ev, a_rest = reader_a()
b_ev, b_rest = reader_b()
ca, cb = Counter(a_ev), Counter(b_ev)
ra, rb = Counter(a_rest), Counter(b_rest)
agree = {"events_a": len(a_ev), "events_b": len(b_ev), "only_a": sorted((ca - cb).elements()),
         "only_b": sorted((cb - ca).elements()), "rests_a": len(a_rest), "rests_b": len(b_rest),
         "rests_only_a": sorted((ra - rb).elements()), "rests_only_b": sorted((rb - ra).elements())}
cla, clb = claims(a_ev), claims(b_ev)
claims_agree = json.dumps(cla, sort_keys=True, default=str) == json.dumps(clb, sort_keys=True, default=str)
result = {"raw_sha256": SHA, "agreement": agree, "claims_agree": claims_agree, "claims_a": cla, "claims_b": clb}
(HERE / "readers.json").write_text(json.dumps(result, indent=1, default=str), encoding="utf-8")
table = defaultdict(lambda: defaultdict(list))
for e in sorted(a_ev, key=lambda e: (e[1], Fraction(e[2]), e[4])):
    table[e[0]][e[1]].append({"beat": beat(e[2]), "onset": e[2], "dur": e[3], "head": e[4], "tie": e[5]})
for r in sorted(a_rest, key=lambda r: (r[1], Fraction(r[2]))):
    table[r[0] + "_rests"][r[1]].append({"beat": beat(r[2]), "onset": r[2], "dur": r[3]})
(HERE / "events-by-role.json").write_text(json.dumps({"raw_sha256": SHA, "reader": "A (raw MusicXML walk)",
                                                      "roles": table}, indent=1), encoding="utf-8")
print("raw sha256", SHA)
print("agreement:", json.dumps({k: (v if not isinstance(v, list) else (len(v), v[:8])) for k, v in agree.items()}))
print("claims agree:", claims_agree)
print("counts A", cla["counts"], "B", clb["counts"])
for b, v in cla["plan"].items():
    print(f"bar {b:>2}: roots {v['roots']} -> {v['roman']}; voicing {[h for h, *_ in cla['voicings'][b]['heads']]} "
          f"pcs {cla['voicings'][b]['pcs']} over root {cla['voicings'][b]['over_root']}")
print("B and Bb:")
for x in cla["B_and_Bb"]:
    print("  ", x)
for b in (9, 10):
    print(f"riff bar {b}:", cla["bars_9_10_riff"][b])
