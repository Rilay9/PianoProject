"""A7a.3 probe, Station 1 form facts: a raw MusicXML walk (no music21) per bar: time and key
signatures, barlines and repeats, melody pitches with durations; then music21's own count of
measures and repeat barlines as the second reader. Prints the phrase comparison the lesson
would cite (bars 1-8 vs 9-16 vs 17-24).

Usage: py -3.11 form_read.py <file.mxl> <label>
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


def raw(path: Path) -> list[dict]:
    root = ET.fromstring(mxl_inner_xml(path.read_bytes()))
    bars = []
    for part in root.iter("part"):
        div = 1
        for m in part.iter("measure"):
            row = {"n": m.get("number"), "implicit": m.get("implicit"), "time": None, "fifths": None, "mode": None,
                   "barlines": [], "notes": [], "harm": [], "len": Fraction(0)}
            pos = Fraction(0)
            for el in m:
                if el.tag == "attributes":
                    if el.find("divisions") is not None:
                        div = int(el.findtext("divisions"))
                    if el.find("time") is not None:
                        row["time"] = f"{el.findtext('time/beats')}/{el.findtext('time/beat-type')}"
                    if el.find("key") is not None:
                        row["fifths"] = el.findtext("key/fifths")
                        row["mode"] = el.findtext("key/mode")
                elif el.tag == "barline":
                    rep = el.find("repeat")
                    row["barlines"].append({"loc": el.get("location"), "style": el.findtext("bar-style"),
                                            "repeat": rep.get("direction") if rep is not None else None,
                                            "ending": (el.find("ending").attrib if el.find("ending") is not None else None)})
                elif el.tag == "harmony":
                    row["harm"].append(el.findtext("root/root-step") + (el.findtext("root/root-alter") or "") + ":" + (el.findtext("kind") or ""))
                elif el.tag == "note":
                    if el.find("grace") is not None:
                        continue
                    d = Fraction(int(el.findtext("duration", "0")), div)
                    if el.find("chord") is not None:
                        continue
                    if el.find("rest") is not None:
                        row["notes"].append(f"r{d}")
                    else:
                        p = el.find("pitch")
                        alt = p.findtext("alter")
                        acc = {"-1": "b", "1": "#", None: ""}.get(alt, alt)
                        row["notes"].append(f"{p.findtext('step')}{acc}{p.findtext('octave')}:{d}")
                    pos += d
                elif el.tag == "backup":
                    pos -= Fraction(int(el.findtext("duration", "0")), div)
                elif el.tag == "forward":
                    pos += Fraction(int(el.findtext("duration", "0")), div)
                row["len"] = max(row["len"], pos)
            row["len"] = str(row["len"])
            bars.append(row)
    return bars


def m21(path: Path) -> dict:
    from music21 import bar, converter
    s = converter.parse(str(path))
    p = s.parts[0]
    ms = list(p.getElementsByClass("Measure"))
    reps = [(m.number, b.direction) for m in ms for b in m.getElementsByClass(bar.Repeat)]
    ts = [(m.number, t.ratioString) for m in ms for t in m.getElementsByClass("TimeSignature")]
    ks = [(m.number, k.sharps) for m in ms for k in m.getElementsByClass("KeySignature")]
    try:
        expanded = len(list(p.expandRepeats().getElementsByClass("Measure"))) if reps else len(ms)
    except Exception as e:  # noqa: BLE001
        expanded = f"{type(e).__name__}: {e}"
    return {"measures": len(ms), "first": ms[0].number, "last": ms[-1].number, "repeats": reps, "time": ts,
            "keys": ks, "expandedMeasures": expanded}


def main() -> int:
    path, label = Path(sys.argv[1]), sys.argv[2]
    bars = raw(path)
    b = m21(path)
    for r in bars:
        print(f"bar {r['n']:>3} len={r['len']:<3} time={r['time']} fifths={r['fifths']} mode={r['mode']} "
              f"barlines={r['barlines'] or ''} harm={r['harm']} notes={' '.join(r['notes'])}")
    print("music21:", b)
    if len(bars) >= 24:
        mel = [" ".join(r["notes"]) for r in bars]
        for a, c in ((0, 8), (0, 16), (8, 16)):
            same = [i + 1 for i in range(8) if mel[a + i] == mel[c + i]]
            print(f"melody bars {a+1}-{a+8} vs {c+1}-{c+8}: identical in phrase positions {same}")
    (HERE / f"form-{label}.json").write_text(json.dumps({"raw": bars, "music21": b}, indent=1, default=str),
                                             encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
