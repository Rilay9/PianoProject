"""Raw MusicXML walk for the validation of area-1A rules (validation tool, not the implementation).
Written for this validation; independent of the writer's scan.py and the checker's walk.py."""
from __future__ import annotations
import json, zipfile, pickle, sys
from fractions import Fraction as F
from pathlib import Path
import xml.etree.ElementTree as ET

# SHIM of docs/classifier/evidence/1A/validation/walk.py: the only changes are the lines marked SHIM
# (where the catalogue, the scores and the cache live); the walk itself is unchanged.
HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[5]  # the worktree root  # SHIM
CONTENT = ROOT / "app" / "public" / "content"  # SHIM: built catalogue and scores, copied into the worktree (gitignored)
CAT = json.load(open(CONTENT / "catalog.json", encoding="utf8"))  # SHIM
BYID = {x["id"]: x for x in CAT if x.get("file")}


def root_xml(path: Path) -> ET.Element:
    with zipfile.ZipFile(path) as z:
        names = z.namelist()
        rf = None
        if "META-INF/container.xml" in names:
            c = ET.fromstring(z.read("META-INF/container.xml"))
            for e in c.iter():
                if e.tag.endswith("rootfile"):
                    rf = e.get("full-path"); break
        if rf is None:
            rf = [n for n in names if not n.startswith("META-INF") and n.endswith((".xml", ".musicxml"))][0]
        return ET.fromstring(z.read(rf))


def txt(e, path, default=None):
    x = e.find(path)
    return x.text if x is not None and x.text is not None else default


def walk(item_id: str) -> dict:
    it = BYID[item_id]
    root = root_xml(CONTENT / it["file"])  # SHIM
    out = {"id": item_id, "title": it.get("title"), "hands": it.get("hands"), "parts": [], "notes": [], "clefs": [], "keys": [],
           "times": [], "dirs": [], "harm": [], "fb": [], "bars": [], "staves": [], "staffdet": [], "mstyle": [], "measures": {}}
    sp = {}
    for s in root.iter("score-part"):
        sp[s.get("id")] = {"name": txt(s, "part-name", ""), "inst": [i.text or "" for i in s.iter("instrument-name")],
                           "prog": [int(p.text) for p in s.iter("midi-program") if p.text and p.text.strip().isdigit()]}
    for pi, part in enumerate(root.findall("part")):
        out["parts"].append(sp.get(part.get("id"), {"name": "", "inst": [], "prog": []}))
        div = F(1)
        mstart = F(0)
        last_onset = F(0)
        mlist = []
        for mi, meas in enumerate(part.findall("measure")):
            pos = F(0); maxpos = F(0)
            for el in meas:
                tag = el.tag
                if tag == "attributes":
                    d = txt(el, "divisions")
                    if d: div = F(int(float(d)))
                    for k in el.findall("key"):
                        out["keys"].append({"part": pi, "m": mi, "t": mstart + pos, "off": pos, "fifths": txt(k, "fifths"), "mode": txt(k, "mode"), "number": k.get("number")})
                    for c in el.findall("clef"):
                        out["clefs"].append({"part": pi, "m": mi, "t": mstart + pos, "off": pos, "staff": int(c.get("number") or 1), "sign": txt(c, "sign"),
                                             "line": txt(c, "line"), "oct": int(txt(c, "clef-octave-change", "0") or 0), "print": c.get("print-object")})
                    for tm in el.findall("time"):
                        out["times"].append({"part": pi, "m": mi, "t": mstart + pos, "beats": txt(tm, "beats"), "bt": txt(tm, "beat-type")})
                    st = txt(el, "staves")
                    if st: out["staves"].append((pi, int(st)))
                    for sd in el.findall("staff-details"):
                        out["staffdet"].append({"part": pi, "staff": int(sd.get("number") or 1), "lines": txt(sd, "staff-lines")})
                    for ms in el.findall("measure-style"):
                        out["mstyle"].append({"part": pi, "m": mi, "xml": ET.tostring(ms, encoding="unicode")})
                elif tag == "backup":
                    pos -= F(int(float(txt(el, "duration", "0")))) / div
                elif tag == "forward":
                    pos += F(int(float(txt(el, "duration", "0")))) / div; maxpos = max(maxpos, pos)
                elif tag == "direction":
                    off = F(int(float(txt(el, "offset", "0")))) / div
                    staff = int(txt(el, "staff", "1"))
                    for dt in el.findall("direction-type"):
                        for w in dt.findall("words"):
                            out["dirs"].append({"part": pi, "m": mi, "t": mstart + pos + off, "staff": staff, "kind": "words", "text": "".join(w.itertext())})
                        for o in dt.findall("octave-shift"):
                            out["dirs"].append({"part": pi, "m": mi, "t": mstart + pos + off, "staff": staff, "kind": "oct", "type": o.get("type"), "size": int(o.get("size") or 8), "number": o.get("number") or "1"})
                        for s in dt.findall("segno"):
                            out["dirs"].append({"part": pi, "m": mi, "t": mstart + pos, "staff": staff, "kind": "segno"})
                        for s in dt.findall("coda"):
                            out["dirs"].append({"part": pi, "m": mi, "t": mstart + pos, "staff": staff, "kind": "coda"})
                    s = el.find("sound")
                    if s is not None and any(s.get(a) for a in ("dacapo", "dalsegno", "fine", "tocoda", "segno", "coda")):
                        out["dirs"].append({"part": pi, "m": mi, "t": mstart + pos, "staff": staff, "kind": "soundjump", "attrs": dict(s.attrib)})
                elif tag == "harmony":
                    off = F(int(float(txt(el, "offset", "0")))) / div
                    k = el.find("kind")
                    out["harm"].append({"part": pi, "m": mi, "t": mstart + pos + off, "staff": int(txt(el, "staff", "1")),
                                        "root": (txt(el, "root/root-step"), txt(el, "root/root-alter")), "kind": k.text if k is not None else None,
                                        "ktext": k.get("text") if k is not None else None, "bass": (txt(el, "bass/bass-step"), txt(el, "bass/bass-alter")),
                                        "numeral": el.find("numeral") is not None, "function": el.find("function") is not None, "print": el.get("print-object")})
                elif tag == "figured-bass":
                    out["fb"].append({"part": pi, "m": mi})
                elif tag == "barline":
                    r = el.find("repeat"); e = el.find("ending")
                    out["bars"].append({"part": pi, "m": mi, "loc": el.get("location"), "repeat": (r.get("direction"), r.get("times")) if r is not None else None,
                                        "ending": (e.get("number"), e.get("type")) if e is not None else None,
                                        "segno": el.find("segno") is not None, "coda": el.find("coda") is not None})
                elif tag == "note":
                    grace = el.find("grace") is not None
                    chord = el.find("chord") is not None
                    dur = F(int(float(txt(el, "duration", "0")))) / div if not grace else F(0)
                    onset = last_onset if chord else pos
                    if not chord:
                        last_onset = pos
                        pos += dur; maxpos = max(maxpos, pos)
                    p = el.find("pitch")
                    acc = el.find("accidental")
                    nh = el.find("notehead")
                    ties = [t.get("type") for t in el.findall("tie")] + [t.get("type") for t in el.findall("notations/tied")]
                    n = {"part": pi, "m": mi, "t": mstart + onset, "off": onset, "dur": dur, "grace": grace, "chord": chord,
                         "cue": el.find("cue") is not None, "rest": el.find("rest") is not None,
                         "staff": int(txt(el, "staff", "1")), "voice": txt(el, "voice", "1"),
                         "step": txt(p, "step") if p is not None else None, "alter": float(txt(p, "alter", "0")) if p is not None else 0.0,
                         "octave": int(txt(p, "octave")) if p is not None else None,
                         "unpitched": el.find("unpitched") is not None,
                         "tie_start": "start" in ties, "tie_stop": "stop" in ties,
                         "acc": acc.text if acc is not None else None,
                         "acc_attrs": {a: acc.get(a) for a in ("cautionary", "parentheses", "editorial", "bracket") if acc is not None and acc.get(a)},
                         "notehead": nh.text if nh is not None else None, "nh_color": nh.get("color") if nh is not None else None,
                         "nh_text": el.find("notehead-text") is not None, "stem": txt(el, "stem"),
                         "print": el.get("print-object"),
                         "tuplets": [(tp.get("type"), tp.get("number") or "1") for tp in el.findall("notations/tuplet")],
                         "tmod": (txt(el, "time-modification/actual-notes"), txt(el, "time-modification/normal-notes")),
                         "fing": [(f.text or "", f.get("substitution"), f.get("alternate")) for f in el.iter("fingering")],
                         "beams": [(b.get("number") or "1", b.text) for b in el.findall("beam")],
                         "lyrics": [(l.get("number"), txt(l, "text"), txt(l, "syllabic")) for l in el.findall("lyric")],
                         "type": txt(el, "type")}
                    out["notes"].append(n)
            mlen = maxpos
            mlist.append((mstart, mlen))
            mstart += mlen
        out["measures"][pi] = mlist
    return out


def cache(item_id: str) -> dict:
    cdir = ROOT / "build" / "cache1a"; cdir.mkdir(exist_ok=True, parents=True)  # SHIM
    f = cdir / (item_id + ".pkl")
    if f.exists():
        return pickle.load(open(f, "rb"))
    w = walk(item_id)
    pickle.dump(w, open(f, "wb"))
    return w


if __name__ == "__main__":
    ids = sys.argv[1:] or list(BYID)
    bad = 0
    for i in ids:
        try:
            cache(i)
        except Exception as e:
            bad += 1; print("ERR", i, repr(e))
    print("walked", len(ids), "errors", bad)
