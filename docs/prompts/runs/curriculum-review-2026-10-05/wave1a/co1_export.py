"""CO-1 (seam 1a.9): the 16 changed contrary scales, bar 1 and the bar of the turn, each hand's notes with fingering.

usage:
  py -3.11 co1_export.py capture <name>     # reads the built scores into build/lane/co1-<name>.json
  py -3.11 co1_export.py write <before> <after>   # writes CO-1.md beside this script

Read from the built MusicXML text (the written step, alter, octave, staff and <fingering>), not from music21.
The bar of the turn is the bar that holds the right hand's highest note, where both hands change direction.
"""
from __future__ import annotations

import json
import re
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[5]
CONTENT = ROOT / "app" / "public" / "content"
LANE = ROOT / "build" / "lane"
ITEMS = [
    "exercise.scale.a-flat-major.1oct.contrary.both.2",
    "exercise.scale.a-major.1oct.contrary.both.2",
    "exercise.scale.b-flat-major.1oct.contrary.both.2",
    "exercise.scale.b-major.1oct.contrary.both.2",
    "exercise.scale.g-flat-major.1oct.contrary.both.2",
    "exercise.scale.g-major.1oct.contrary.both.2",
    "exercise.scale.a-harmonic-minor.1oct.contrary.both.2",
    "exercise.scale.b-flat-harmonic-minor.1oct.contrary.both.2",
    "exercise.scale.b-harmonic-minor.1oct.contrary.both.2",
    "exercise.scale.g-harmonic-minor.1oct.contrary.both.2",
    "exercise.scale.c-major.2oct.contrary.both.2",
    "exercise.scale.d-flat-major.2oct.contrary.both.2",
    "exercise.scale.d-major.2oct.contrary.both.2",
    "exercise.scale.e-flat-major.2oct.contrary.both.2",
    "exercise.scale.e-major.2oct.contrary.both.2",
    "exercise.scale.f-major.2oct.contrary.both.2",
]
STEPS = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def xml_of(path: Path) -> str:
    with zipfile.ZipFile(path) as z:
        name = next(n for n in z.namelist() if n.endswith((".xml", ".musicxml")) and not n.startswith("META-INF"))
        return z.read(name).decode("utf-8")


def bars(item_id: str) -> list[dict]:
    catalog = {r["id"]: r for r in json.loads((CONTENT / "catalog.json").read_text(encoding="utf-8"))}
    xml = xml_of(CONTENT / catalog[item_id]["file"])
    out = []
    for m in re.finditer(r'<measure\b[^>]*number="([^"]*)"[^>]*>([\s\S]*?)</measure>', xml):
        notes = {"1": [], "2": []}
        for n in re.finditer(r"<note\b[\s\S]*?</note>", m.group(2)):
            t = n.group(0)
            p = re.search(r"<step>([A-G])</step>\s*(?:<alter>(-?\d+)</alter>)?\s*<octave>(-?\d+)</octave>", t)
            if not p:
                continue
            alter = int(p.group(2) or 0)
            name = f"{p.group(1)}{'#' * max(0, alter)}{'b' * max(0, -alter)}{p.group(3)}"
            midi = (int(p.group(3)) + 1) * 12 + STEPS[p.group(1)] + alter
            finger = re.search(r"<fingering[^>]*>([^<]*)</fingering>", t)
            staff = re.search(r"<staff>(\d+)</staff>", t)
            notes[staff.group(1) if staff else "1"].append([name, finger.group(1) if finger else "", midi])
        out.append({"bar": m.group(1), "rh": notes["1"], "lh": notes["2"]})
    return out


def capture(name: str) -> None:
    data = {}
    for item in ITEMS:
        b = bars(item)
        top = max(n[2] for bar in b for n in bar["rh"])
        turn = next(bar for bar in b if any(n[2] == top for n in bar["rh"]))
        data[item] = {"bar1": b[0], "turn": turn}
    (LANE / f"co1-{name}.json").write_text(json.dumps(data, indent=1), encoding="utf-8")
    print(f"captured {len(data)} -> co1-{name}.json")


def line(notes: list) -> str:
    return " ".join(f"{n}({f})" if f else n for n, f, _m in notes) or "(rest)"


def write(before: str, after: str) -> None:
    b = json.loads((LANE / f"co1-{before}.json").read_text(encoding="utf-8"))
    a = json.loads((LANE / f"co1-{after}.json").read_text(encoding="utf-8"))
    out = [
        "# CO-1: the 16 contrary-motion scales seam 1a.9 changed (before and after)",
        "",
        "For the outside reviewer, as text: each item's bar 1 and the bar of the turn (the bar holding the right",
        "hand's highest note), each hand's written notes in order with the printed finger in brackets. Read from",
        "the built MusicXML by `co1_export.py` beside this file; *before* is the build at the lane's base, *after*",
        "the build with the fix. Denominator 16/16. The right hand's notes and every finger are unchanged by",
        "design; the left hand's notes move to start on the right hand's first note. Nothing here has been heard.",
        "",
    ]
    for item in ITEMS:
        out.append(f"## `{item}`")
        out.append("")
        for label, key in (("Bar 1", "bar1"), ("Turn", "turn")):
            for when, src in (("before", b), ("after", a)):
                bar = src[item][key]
                out.append(f"- {label} (bar {bar['bar']}), {when}: RH {line(bar['rh'])} | LH {line(bar['lh'])}")
        out.append("")
    path = Path(__file__).with_name("CO-1.md")
    path.write_text("\n".join(out), encoding="utf-8")
    print(f"wrote {path} ({path.stat().st_size} bytes)")


if __name__ == "__main__":
    if sys.argv[1] == "capture":
        capture(sys.argv[2])
    else:
        write(sys.argv[2], sys.argv[3])
