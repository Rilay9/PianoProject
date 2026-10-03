#!/usr/bin/env python3
"""What the Python converter's split does with the committed one-track fixture.

The hands the fixture script's table intends, against the hands `split_hands` gives, and
the boundary per onset. Run from the worktree root:

    python docs/prompts/runs/Q47/probe_fixture_split.py
"""
from __future__ import annotations

import importlib.util
import sys
from fractions import Fraction
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / "tools" / "midi-cleanup"))

from midi_to_musicxml import quantise, read_midi, split_hands  # noqa: E402

FIXTURES = ROOT / "tools" / "midi-cleanup" / "tests" / "fixtures"
spec = importlib.util.spec_from_file_location("make", FIXTURES / "make-one-track-two-hands-midi.py")
make = importlib.util.module_from_spec(spec)
spec.loader.exec_module(make)  # type: ignore[union-attr]

source = read_midi(FIXTURES / "one-track-two-hands.mid")
tracks = [t for t in source["tracks"] if t["events"]]
ts = source["time_signature"]
report = quantise([e for t in tracks for e in t["events"]],
                  bar_length=Fraction(ts.barDuration.quarterLength),
                  beat=Fraction(ts.beatDuration.quarterLength), divisors=(4, 3), swing=None)
sides = split_hands(report["events"])

intended = {"right": sorted((Fraction(a), m) for a, _, m in make.RIGHT),
            "left": sorted((Fraction(a), m) for a, _, m in make.LEFT)}
given = {side: sorted((e.start, e.midi) for e in sides[side]) for side in ("right", "left")}
print(f"note tracks: {len(tracks)}; metre {ts.ratioString}")
for side in ("right", "left"):
    print(f"{side}: {len(given[side])} given, {len(intended[side])} intended; "
          f"same: {given[side] == intended[side]}")
print("boundary per onset:", [(float(at), float(value)) for at, value in sides["boundary"]])
fixed = [(float(at), m) for at, m in intended["left"] if m >= 60]
print("left-hand notes a fixed middle-C boundary (60 and up to the right) would move:", fixed)
sys.exit(0 if all(given[s] == intended[s] for s in given) else 1)
