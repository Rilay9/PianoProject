"""
Print a catalog item's score bar by bar: what is actually written, per staff.

    python tools/content/dump_score.py song.folk.greensleeves.chords
    python tools/content/dump_score.py exercise.blues-scale.c.1oct.right --bars 4

Written for checking what a lesson says about a piece against the notes, which
the catalog's `notation` summary cannot answer: "the left hand holds block
triads", "a broken chord in every bar", "the blue note is written F sharp". It
reads the built `.mxl` the app plays (`app/public/content/<file>`), so it shows
exactly what a learner sees.

Each bar prints each staff's notes in order: `+` before a note means it sounds
with the one before it (a chord), `r` is a rest, and the value follows the
slash (`qua` quarter, `hal` half, `eig` eighth, `who` whole, `16t` sixteenth; a
trailing `.` is dotted). Voices on one staff are printed separately as `v1`,
`v2`. Chord symbols print as `[root kind]` where the bar has them.

Drills have no file (`"file": null`); the tool says so rather than guessing.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONTENT = ROOT / "app" / "public" / "content"


def score_xml(path: Path) -> str:
    if path.suffix == ".mxl":
        with zipfile.ZipFile(path) as z:
            names = [n for n in z.namelist() if not n.startswith("META-INF") and n.endswith((".xml", ".musicxml"))]
            return z.read(names[0]).decode("utf-8", "replace")
    return path.read_text(encoding="utf-8", errors="replace")


def note_text(n: str) -> str:
    pitch = re.search(r"<step>(\w)</step>(?:\s*<alter>(-?\d+)</alter>)?\s*<octave>(\d)</octave>", n)
    if pitch:
        alter = {"-2": "bb", "-1": "b", "1": "#", "2": "##"}.get(pitch.group(2) or "", "")
        name = f"{pitch.group(1)}{alter}{pitch.group(3)}"
    elif "<rest" in n:
        name = "r"
    else:
        name = "?"
    kind = re.search(r"<type>(\w+)</type>", n)
    value = (kind.group(1)[:3] if kind else "?") + "." * len(re.findall(r"<dot\s*/>", n))
    return ("+" if re.search(r"<chord\s*/>", n) else " ") + f"{name}/{value}"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("item")
    parser.add_argument("--bars", type=int, default=0, help="stop after this many bars (0 = all)")
    args = parser.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")

    catalog = json.loads((CONTENT / "catalog.json").read_text(encoding="utf-8"))
    row = next((r for r in catalog if r["id"] == args.item), None)
    if row is None:
        print(f"{args.item}: not in the built catalog", file=sys.stderr)
        return 1
    print(f"{row['id']} | {row.get('title')} | level {row.get('level')} ({row.get('levelSource')})")
    print(f"notation: {json.dumps(row.get('notation'))}")
    if not row.get("file"):
        print("no file: this item is generated at runtime (a drill) and has no written score")
        return 0
    xml = score_xml(CONTENT / row["file"])
    fifths = re.findall(r"<fifths>(-?\d+)</fifths>", xml)
    modes = re.findall(r"<mode>(\w+)</mode>", xml)
    times = re.findall(r"<beats>(\d+)</beats>\s*<beat-type>(\d+)</beat-type>", xml)
    print(f"key signatures (fifths): {fifths}  modes: {modes}  times: {['/'.join(t) for t in times]}")
    words = [w for w in re.findall(r"<words[^>]*>([^<]+)</words>", xml) if w.strip()]
    if words:
        print(f"text on the score: {words[:8]}")
    measures = re.findall(r"<measure\b([^>]*)>(.*?)</measure>", xml, re.S)
    for index, (attrs, body) in enumerate(measures, start=1):
        if args.bars and index > args.bars:
            break
        number = re.search(r'number="([^"]+)"', attrs)
        staves: dict[str, dict[str, list[str]]] = {}
        for n in re.findall(r"<note\b[^>]*>(.*?)</note>", body, re.S):
            staff = re.search(r"<staff>(\d+)</staff>", n)
            voice = re.search(r"<voice>(\d+)</voice>", n)
            staves.setdefault(staff.group(1) if staff else "1", {}).setdefault(
                voice.group(1) if voice else "1", []).append(note_text(n))
        harmony = [
            f"[{h[0]}{ {'-1': 'b', '1': '#'}.get(h[1], '') } {h[2]}]"
            for h in re.findall(
                r"<root-step>(\w)</root-step>(?:\s*<root-alter>(-?\d)</root-alter>)?.*?<kind[^>]*>([^<]*)</kind>",
                body, re.S)
        ]
        parts = []
        for staff in sorted(staves):
            voices = staves[staff]
            label = "RH" if staff == "1" else "LH" if staff == "2" else f"staff{staff}"
            if len(voices) == 1:
                parts.append(f"{label}:" + "".join(next(iter(voices.values()))))
            else:
                parts.append(f"{label}:" + " | ".join(f"v{v}:" + "".join(ns) for v, ns in sorted(voices.items())))
        print(f"bar {number.group(1) if number else index:>3} " + "  ".join(parts) + ("  " + " ".join(harmony) if harmony else ""))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
