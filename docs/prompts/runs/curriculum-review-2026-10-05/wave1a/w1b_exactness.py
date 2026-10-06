"""Wave 1(b): is the shipped G edition's right hand the C theme's right hand a perfect fifth higher, event for event?

usage: py -3.11 docs/prompts/runs/curriculum-review-2026-10-05/wave1a/w1b_exactness.py

Read with partitura (an independent parser; music21 wrote neither file's checks), from the built scores in
app/public/content. The right hand is the upper staff. Compared per note: onset and duration in quarters,
and MIDI pitch + 7. Also prints the G right hand's pitch range and the spelled pitches it uses.
"""
from __future__ import annotations

import json
from pathlib import Path

import partitura as pt

ROOT = Path(__file__).resolve().parents[5]
CONTENT = ROOT / "app" / "public" / "content"
catalog = {e["id"]: e for e in json.loads((CONTENT / "catalog.json").read_text(encoding="utf-8"))}


def right_hand(item_id: str) -> list[tuple[float, float, int, str]]:
    score = pt.load_score(str(CONTENT / catalog[item_id]["file"]))
    notes = []
    for part in score.parts:
        na = part.note_array(include_staff=True, include_pitch_spelling=True)
        upper = min(int(s) for s in na["staff"])
        for n in na:
            if int(n["staff"]) == upper:
                name = f"{n['step']}{'#' * max(0, int(n['alter']))}{'b' * max(0, -int(n['alter']))}{int(n['octave'])}"
                notes.append((round(float(n["onset_quarter"]), 4), round(float(n["duration_quarter"]), 4), int(n["pitch"]), name))
        break
    return sorted(notes)


c = right_hand("song.classical.ode-to-joy.full")
g = right_hand("song.classical.ode-to-joy.g")
same = sum(1 for a, b in zip(c, g) if (a[0], a[1], a[2] + 7) == (b[0], b[1], b[2]))
print(f"C theme RH events {len(c)}, G edition RH events {len(g)}, equal a fifth up: {same}")
print("G RH range:", min(g, key=lambda n: n[2])[3], "to", max(g, key=lambda n: n[2])[3])
print("G RH pitches used:", sorted({n[3] for n in g}, key=lambda s: next(n[2] for n in g if n[3] == s)))
