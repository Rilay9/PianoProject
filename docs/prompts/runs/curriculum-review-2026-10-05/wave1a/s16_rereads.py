"""Seam 1a.6's facts the brief marks *re-read* (stop condition S2), read again from the built scores with partitura.

usage: py -3.11 docs/prompts/runs/curriculum-review-2026-10-05/wave1a/s16_rereads.py

Partitura, not music21, so the re-read does not share a parser with the brief's first reading. "Upper staff"
and "lower staff" are staves, not hands (content-mistakes 11): the lessons' "right hand" and "left hand"
are the staves as printed. Bar numbers are the files' measure numbers.
"""
from __future__ import annotations

import json
import warnings
from collections import Counter
from pathlib import Path

import partitura as pt

warnings.filterwarnings("ignore")
ROOT = Path(__file__).resolve().parents[5]
CONTENT = ROOT / "app" / "public" / "content"
CAT = {e["id"]: e for e in json.loads((CONTENT / "catalog.json").read_text(encoding="utf-8"))}


def load(item_id):
    return pt.load_score(str(CONTENT / CAT[item_id]["file"]))


def notes(score, staff=None):
    out = []
    for part in score.parts:
        na = part.note_array(include_staff=True, include_pitch_spelling=True)
        bars = {m.start.t: m.number for m in part.iter_all(pt.score.Measure)}
        starts = sorted(bars)
        for n in na:
            if staff is not None and int(n["staff"]) != staff:
                continue
            t = int(n["onset_div"])
            bar = bars[max(s for s in starts if s <= t)]
            name = f"{n['step']}{'#' * max(0, int(n['alter']))}{'b' * max(0, -int(n['alter']))}{int(n['octave'])}"
            out.append(dict(bar=bar, onset=float(n["onset_beat"]), dur=float(n["duration_beat"]), pitch=int(n["pitch"]),
                            name=name, staff=int(n["staff"])))
        break
    return out


def top(item_id, staff=1):
    ns = notes(load(item_id), staff)
    m = max(ns, key=lambda n: n["pitch"])
    return m["name"]


print("Edit 11: upper-staff highest note")
for i in ("song.classical.mendelssohn-felix-mendelssohn-hark-the-herald-angels-sing.pdmx",
          "song.pop.misc-christmas-traditional-music-god-rest-ye-merry-gentlemen-gw.pdmx"):
    print("  ", i, top(i))

print("Edit 12: O Christmas Tree bar 32, harmony and upper-staff notes")
s = load("song.pop.misc-christmas-o-christmas-tree.pdmx")
part = s.parts[0]
b32 = next(m for m in part.iter_all(pt.score.Measure) if m.number == 32)
harm = [h for h in part.iter_all(pt.score.Harmony, b32.start, b32.end)] if hasattr(pt.score, "Harmony") else []
print("   harmony:", [getattr(h, "text", None) for h in harm])
print("   upper staff:", [n["name"] for n in notes(s, 1) if n["bar"] == 32])

print("Edit 15: Carol of the Bells (easy), upper staff, bars opening with C5 B4 C5 A4 / E5 D5 E5 C5")
ns = notes(load("song.holiday.carol-of-the-bells.easy"), 1)
by_bar = {}
for n in sorted(ns, key=lambda n: (n["bar"], n["onset"])):
    by_bar.setdefault(n["bar"], []).append(n["name"])
fig = [b for b, v in by_bar.items() if v[:4] == ["C5", "B4", "C5", "A4"]]
third = [b for b, v in by_bar.items() if v[:4] == ["E5", "D5", "E5", "C5"]]
print(f"   bars: {len(by_bar)}; C5 B4 C5 A4 in {len(fig)}: {fig}; E5 D5 E5 C5 in {len(third)}: {third}")

print("Edit 20: Malaguena, lower staff, bars 1-20")
ns = notes(load("song.classical.lecuona-malaguena-by-ernesto-lecuona.pdmx"), 2)
for b in range(1, 21):
    bar = sorted([n for n in ns if n["bar"] == b], key=lambda n: (n["onset"], n["pitch"]))
    print(f"   bar {b}: " + " ".join(f"{n['name']}@{n['onset']:g}/{n['dur']:g}" for n in bar))

print("Edit 23: Annie's Song, harmony kinds")
s = load("song.folk.john-denver-annie-s-song.pdmx")
for part in s.parts:
    hs = list(part.iter_all(pt.score.Harmony)) if hasattr(pt.score, "Harmony") else []
    print("   harmony elements:", len(hs), Counter(getattr(h, "text", None) for h in hs).most_common(12))
    break

print("Edit 25: Moonlight III dynamics")
s = load("song.classical.beethoven-moonlight-iii")
count = 0
for part in s.parts:
    for cls in ("ConstantLoudnessDirection", "DynamicLoudnessDirection", "LoudnessDirection"):
        if hasattr(pt.score, cls):
            count += len(list(part.iter_all(getattr(pt.score, cls), include_subclasses=False)))
print("   loudness directions (partitura):", count)
