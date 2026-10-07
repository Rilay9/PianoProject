"""
CK-1 (wave 1(a) seam 1a.9, W4): every contrary-motion scale starts both thumbs on the same key-note.

Core 4.1 says "Start both thumbs on the same C and move outwards", and the ABRSM Grade 1 table asks for
"contrary motion C major 1 octave hands starting on the tonic". Before this seam, `make_scale` started the
left hand's contrary run at the top of its own preferred range, so its start depended on the key: 20 of
the 36 shipped items began at the unison, 10 one-octave items began with the left hand an octave below,
and 6 two-octave items began with it an octave above, the hands crossed (`GENERATOR-ADDENDUM.md` G2).

The contract, for every contrary item:
- the two staves' first notes have the same letter and octave (the same written pitch);
- the right hand climbs `octaves × 7` scale steps and comes back; the left hand mirrors it step for step,
  note against note at the same onsets, down and back;
- both end where they began.

Read from partitura's note arrays (an independent parser, the addendum's ADOPT; music21 wrote these files
and is never their witness), from two places: every built `exercise.scale.*contrary*` file the catalogue
ships, and every key and mode `make_scale` accepts in contrary motion, generated to a temporary folder
under the worktree's `build/`, so that a key no rung lists cannot regress. A contrary run that would leave
the keyboard is refused by the generator, never written.

The built half needs `app/public/content` (the content build runs first, Q24) and fails when it is missing.
"""
from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import partitura as pt  # noqa: E402

from generate_exercises import (  # noqa: E402
    KEYBOARD_BOTTOM,
    KEYBOARD_TOP,
    MAJOR_KEYS,
    MINOR_KEYS,
    ScaleSpec,
    make_scale,
)

REPO = Path(__file__).resolve().parents[3]
CONTENT = REPO / "app" / "public" / "content"
LETTERS = "CDEFGAB"


def hands(path: Path) -> dict[int, list[tuple[float, int, int, str]]]:
    """Per staff, its notes in onset order: (onset in quarters, diatonic index, MIDI, spelled name)."""
    score = pt.load_score(str(path))
    out: dict[int, list] = {}
    for part in score.parts:
        na = part.note_array(include_staff=True, include_pitch_spelling=True)
        for n in na:
            step, alter, octave = str(n["step"]), int(n["alter"]), int(n["octave"])
            name = f"{step}{'#' * max(0, alter)}{'b' * max(0, -alter)}{octave}"
            out.setdefault(int(n["staff"]), []).append(
                (round(float(n["onset_quarter"]), 4), octave * 7 + LETTERS.index(step), int(n["pitch"]), name))
    return {staff: sorted(notes) for staff, notes in out.items()}


def faults(path: Path, octaves: int) -> list[str]:
    """What the contract finds wrong with one contrary item; empty when it holds."""
    staves = hands(path)
    if sorted(staves) != [1, 2]:
        return [f"staves {sorted(staves)}, not the right hand on 1 and the left on 2"]
    rh, lh = staves[1], staves[2]
    out: list[str] = []
    if (rh[0][1], rh[0][3][:1]) != (lh[0][1], lh[0][3][:1]):
        out.append(f"first notes RH {rh[0][3]}, LH {lh[0][3]}: not the same letter and octave")
    if rh[0][2] != lh[0][2]:
        out.append(f"first notes RH {rh[0][3]}, LH {lh[0][3]}: not the same key")
    if len(rh) != len(lh) or [n[0] for n in rh] != [n[0] for n in lh]:
        out.append("the hands do not strike together note for note")
        return out
    start = rh[0][1]
    climb = [n[1] - start for n in rh]
    top = octaves * 7
    want = list(range(top + 1)) + list(range(top - 1, -1, -1))
    if climb != want:
        out.append(f"the right hand's steps from its first note are not up {top} and back")
    mirror = [lh_n[1] - lh[0][1] for lh_n in lh]
    if mirror != [-step for step in climb]:
        out.append("the left hand does not mirror the right hand step for step")
    if rh[-1][2] != rh[0][2] or lh[-1][2] != lh[0][2]:
        out.append("a hand does not end where it began")
    low = min(n[2] for n in rh + lh)
    high = max(n[2] for n in rh + lh)
    if low < KEYBOARD_BOTTOM or high > KEYBOARD_TOP:
        out.append(f"notes off the keyboard ({low}-{high})")
    return out


class TheShippedContraryScales(unittest.TestCase):
    def test_every_built_contrary_scale_starts_at_the_unison_and_mirrors(self) -> None:
        catalog_path = CONTENT / "catalog.json"
        self.assertTrue(catalog_path.is_file(), f"{catalog_path} is missing: run tools/content/build.py first (Q24)")
        rows = [r for r in json.loads(catalog_path.read_text(encoding="utf-8"))
                if r["id"].startswith("exercise.scale.") and ".contrary." in r["id"]]
        self.assertEqual(len(rows), 36, "the shipped contrary scales are the plan's 36: 12 major at one and two octaves, 12 harmonic minor at one")
        found = {}
        for row in rows:
            path = CONTENT / row["file"]
            self.assertTrue(path.is_file(), f"{path} is missing")
            bad = faults(path, int(row["drill"]["params"]["octaves"]))
            if bad:
                found[row["id"]] = bad
        self.assertEqual(found, {})


class EveryContraryScaleTheGeneratorAccepts(unittest.TestCase):
    def test_every_key_and_mode_in_contrary_motion(self) -> None:
        (REPO / "build").mkdir(exist_ok=True)
        cases = [(k, "major") for k in MAJOR_KEYS] + [(k, m) for k in MINOR_KEYS for m in ("harmonic", "melodic", "natural")]
        accepted, refused, found = 0, [], {}
        with tempfile.TemporaryDirectory(dir=REPO / "build", prefix="ck1-") as tmp:
            for tonic, mode in cases:
                for octaves in (1, 2, 3, 4):
                    spec = ScaleSpec(tonic, mode, "both", octaves, "contrary", 0.5, 60)
                    try:
                        sc, _entry = make_scale(spec)
                    except ValueError:
                        refused.append((tonic, mode, octaves))
                        continue
                    path = Path(tmp) / f"{tonic}-{mode}-{octaves}.musicxml"
                    sc.write("musicxml", fp=str(path))
                    accepted += 1
                    bad = faults(path, octaves)
                    if bad:
                        found[(tonic, mode, octaves)] = bad
        self.assertEqual(found, {})
        # One, two and three octaves fit every key from the right hand's start; four octaves each way
        # is eight octaves of keyboard, more than a piano has, so the generator refuses every one.
        self.assertEqual(sorted({o for _t, _m, o in refused}), [4])
        self.assertEqual(len(refused), len(cases))
        self.assertEqual(accepted, len(cases) * 3)


if __name__ == "__main__":
    unittest.main()
