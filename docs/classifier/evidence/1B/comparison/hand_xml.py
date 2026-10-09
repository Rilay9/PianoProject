"""A small MusicXML walker for the hand comparison: notes with part, staff, voice, absolute onset (quarters),
pitch, written fingering digits. Hand = the project's rule (tools/classifier/score.py): a part with two staves gives
staff 1 to R and staff 2 to L; two one-staff parts give part 0 to R and part 1 to L; a single staff takes the
catalogue's declared hand (left -> L, else R). Repeats are not expanded (score order)."""
import json, re, sys, zipfile, warnings
from pathlib import Path
import xml.etree.ElementTree as ET

warnings.simplefilter("ignore")
HERE = Path(__file__).resolve().parent
WT = HERE.parents[4]
MAIN = Path(r"C:/Users/yalir/repos/Piano Stuff/PianoProject")
CONTENT = MAIN / "app/public/content"
STEP = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def root_of(path):
    path = Path(path)
    if path.suffix == ".mxl":
        with zipfile.ZipFile(path) as z:
            names = [n for n in z.namelist() if n.endswith((".xml", ".musicxml")) and not n.startswith("META")]
            data = z.read(names[0])
    else:
        data = path.read_bytes()
    r = ET.fromstring(data)
    for e in r.iter():
        if isinstance(e.tag, str) and "}" in e.tag:
            e.tag = e.tag.split("}", 1)[1]
    return r


def read_notes(path):
    """-> (notes, nparts, staves_per_part). Each note: dict(part, staff, voice, onset, dur, midi, step, alter, oct,
    chord, tie_stop, tie_start, grace, fing[list of str], measure, bar_no)."""
    r = root_of(path)
    parts = r.findall("part")
    notes = []
    staves_pp = []
    for pi, part in enumerate(parts):
        div = 1
        t = 0.0
        last_on = 0.0
        nst = 1
        for mi, m in enumerate(part.findall("measure")):
            mstart = t
            for el in m:
                if el.tag == "attributes":
                    d = el.findtext("divisions")
                    if d:
                        div = float(d)
                    s = el.findtext("staves")
                    if s:
                        nst = max(nst, int(s))
                elif el.tag == "forward":
                    t += float(el.findtext("duration") or 0) / div
                elif el.tag == "backup":
                    t -= float(el.findtext("duration") or 0) / div
                elif el.tag == "note":
                    chord = el.find("chord") is not None
                    grace = el.find("grace") is not None
                    dur = float(el.findtext("duration") or 0) / div
                    on = last_on if chord else t
                    p = el.find("pitch")
                    ties = [x.get("type") for x in el.findall("tie")]
                    fing = [("".join(f.itertext())).strip() for f in el.iter("fingering")]
                    if p is not None:
                        step = p.findtext("step")
                        alter = int(float(p.findtext("alter") or 0))
                        octv = int(p.findtext("octave"))
                        midi = 12 * (octv + 1) + STEP[step] + alter
                        notes.append(dict(part=pi, staff=int(el.findtext("staff") or 1), voice=int(el.findtext("voice") or 1),
                                          onset=round(on, 5), dur=dur, midi=midi, step=step, alter=alter, oct=octv, chord=chord,
                                          tie_stop="stop" in ties, tie_start="start" in ties, grace=grace, fing=fing,
                                          measure=mi, bar_no=m.get("number")))
                    if not chord:
                        last_on = on
                        if not grace:
                            t = on + dur
        staves_pp.append(nst)
    return notes, len(parts), staves_pp


def assign_hand(notes, nparts, staves_pp, declared="both"):
    """Adds n['hand'] by the project's rule (score.py)."""
    mx = max(staves_pp) if staves_pp else 1
    for n in notes:
        if nparts == 1 and mx <= 1:
            n["hand"] = "L" if declared == "left" else "R"
        elif nparts >= 2 and mx <= 1:
            n["hand"] = "R" if n["part"] == 0 else "L"
        else:
            n["hand"] = "R" if n["staff"] == 1 else "L"
    return notes


def events(notes, hand):
    """Struck notes (no grace, no tie continuation) of one hand grouped by onset -> list of events, each a list of notes
    (sorted by pitch). Returns events sorted by onset."""
    by = {}
    for n in notes:
        if n["hand"] != hand or n["grace"] or n["tie_stop"]:
            continue
        by.setdefault(n["onset"], []).append(n)
    return [sorted(v, key=lambda x: x["midi"]) for _, v in sorted(by.items())]


def digit(n):
    """Single digit 1..5 of a note's fingering, or None (substitutions like 4-3, alternates, chords of digits are None)."""
    f = [x for x in n["fing"] if re.fullmatch(r"[1-5]", x)]
    return int(f[0]) if len(f) == 1 and len(n["fing"]) == 1 else None
