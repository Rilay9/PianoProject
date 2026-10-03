"""
The named accompaniment figures against their published definitions (CT1 part one).

Positives are the sources' own examples, where they are short enough to write as notes.
Negatives are the near-misses each definition must turn away:
- the sixteen two-hand exercises `leftHandPattern` misread (the CT1 brief's appendix);
- a broken chord in another order;
- a scale in quarters;
- a pulse on one note.

Catalogue positives are held in `test_figures_catalogue.py`, run after a build.
"""
from __future__ import annotations

import sys
import unittest
from fractions import Fraction
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))

import figures  # noqa: E402
from figures import Bar, Note, Score  # noqa: E402

GOLDEN = HERE.parents[2] / "app" / "tests" / "fixtures" / "scores" / "golden"

#: The CT1 brief's appendix: the reviewer's probe at b98169e2 found `leftHandPattern`
#: present on each of these.
APPENDIX = [
    "exercise.arpeggio.a-minor.2oct.both", "exercise.arpeggio.c-major.2oct.both",
    "exercise.arpeggio.f-major.2oct.both", "exercise.arpeggio.g-major.2oct.both",
    "exercise.scale.a-harmonic-minor.1oct.similar.both.2", "exercise.scale.a-melodic-minor.1oct.similar.both.2",
    "exercise.scale.a-natural-minor.1oct.similar.both.2",
    "exercise.scale.c-major.1oct.similar.both.2", "exercise.scale.f-major.1oct.similar.both.2",
    "exercise.scale.g-major.1oct.similar.both.2",
    "exercise.scale.c-major.1oct.contrary.both.2", "exercise.scale.f-major.1oct.contrary.both.2",
    "exercise.scale.g-major.1oct.contrary.both.2",
    "exercise.scale.c-major.2oct.similar.both.2", "exercise.scale.f-major.2oct.similar.both.2",
    "exercise.scale.g-major.2oct.similar.both.2",
]


def build(bars: list[list[tuple[float, float, list[int]]]], upper: list[list[tuple[float, float, list[int]]]] | None = None,
          sig: tuple[int, int] = (4, 4)) -> Score:
    """Bars of (beat, length, pitches) for the lower staff, and optionally the upper."""
    length = Fraction(sig[0] * 4, sig[1])
    out: list[Note] = []
    for staff, staff_bars in ((2, bars), (1, upper or [])):
        for b, events in enumerate(staff_bars):
            for at, dur, pitches in events:
                for p in pitches:
                    out.append(Note(b, b * length + Fraction(at), Fraction(dur), p, staff))
    return Score(out, [Bar(b * length, *sig) for b in range(len(bars))])


C, D, E, F, G, A, B = 48, 50, 52, 53, 55, 57, 59  # the octave below middle C
TUNE = [(0, 2, [72]), (2, 2, [76])]  # a half-note tune


def eighths(pitches: list[int]) -> list[tuple[float, float, list[int]]]:
    return [(i / 2, 0.5, [p]) for i, p in enumerate(pitches)]


class Alberti(unittest.TestCase):
    def test_the_definitions_own_example(self):
        # "a C major chord … would be performed as C-G-E-G" (Wikipedia, Alberti bass), twice a bar.
        bar = eighths([C, G, E, G, C, G, E, G])
        result = figures.match(build([bar, bar], [TUNE, TUNE]))
        self.assertTrue(result["alberti"]["present"])
        self.assertTrue(result["alberti"]["accompanies"])

    def test_through_a_chord_change(self):
        # I, then V7 in first inversion as B-G-D-G (B, D, G of G; low–high–middle–high).
        bars = [eighths([C, G, E, G, C, G, E, G]), eighths([B - 12, G, D, G, B - 12, G, D, G])]
        self.assertEqual(figures.match(build(bars, [TUNE, TUNE]))["alberti"]["bars"], [1, 2])

    def test_another_order_is_a_broken_chord_not_alberti(self):
        for order in ([C, E, G, E], [C, G, E, C + 12], [G, E, C, E]):
            bar = eighths(order * 2)
            result = figures.match(build([bar, bar], [TUNE, TUNE]))
            self.assertFalse(result["alberti"]["present"], order)

    def test_one_bar_is_a_gesture_not_a_figure(self):
        bars = [eighths([C, G, E, G, C, G, E, G]), [(0, 4, [C])]]
        self.assertFalse(figures.match(build(bars, [TUNE, TUNE]))["alberti"]["present"])

    def test_not_one_chord(self):
        # Low–high–middle–high in shape, but C, A, D is no triad or seventh.
        bar = eighths([C, A, D, A] * 2)
        self.assertFalse(figures.match(build([bar, bar], [TUNE, TUNE]))["alberti"]["present"])


class WaltzAndOompah(unittest.TestCase):
    def test_waltz(self):
        bar = [(0, 1, [C]), (1, 1, [E + 12, G + 12]), (2, 1, [E + 12, G + 12])]
        result = figures.match(build([bar, bar], [[(0, 3, [72])]] * 2, sig=(3, 4)))
        self.assertTrue(result["waltz-bass"]["present"])
        self.assertFalse(result["oom-pah-bass"]["present"])

    def test_waltz_needs_triple_time(self):
        bar = [(0, 1, [C]), (1, 1, [E + 12, G + 12]), (2, 1, [E + 12, G + 12]), (3, 1, [E + 12, G + 12])]
        self.assertFalse(figures.match(build([bar, bar], [TUNE, TUNE]))["waltz-bass"]["present"])

    def test_oompah_near_and_stride_far(self):
        near = [(0, 1, [C]), (1, 1, [E, G]), (2, 1, [G - 12]), (3, 1, [E, G])]
        result = figures.match(build([near, near], [TUNE, TUNE]))
        self.assertTrue(result["oom-pah-bass"]["present"])
        self.assertFalse(result["stride-bass"]["present"])
        far = [(0, 1, [C - 12, C]), (1, 1, [E + 12, G + 12, C + 24]), (2, 1, [G - 12]), (3, 1, [E + 12, G + 12, C + 24])]
        result = figures.match(build([far, far], [TUNE, TUNE]))
        self.assertTrue(result["stride-bass"]["present"])
        self.assertTrue(result["oom-pah-bass"]["present"])

    def test_block_chords_are_not_oompah(self):
        bar = [(q, 1, [C, E, G]) for q in range(4)]
        self.assertFalse(figures.match(build([bar, bar], [TUNE, TUNE]))["oom-pah-bass"]["present"])


class Walking(unittest.TestCase):
    def test_a_walk(self):
        bars = [[(0, 1, [C]), (1, 1, [E]), (2, 1, [G]), (3, 1, [A])], [(0, 1, [F]), (1, 1, [A]), (2, 1, [C + 12]), (3, 1, [D + 12])]]
        self.assertTrue(figures.match(build(bars, [TUNE, TUNE]))["walking-bass"]["accompanies"])

    def test_a_one_note_pulse_is_not_a_walk(self):
        bar = [(q, 1, [C]) for q in range(4)]
        self.assertFalse(figures.match(build([bar, bar], [TUNE, TUNE]))["walking-bass"]["present"])

    def test_a_two_hand_scale_in_quarters_is_not_a_walk(self):
        lower = [[(q, 1, [p]) for q, p in enumerate([C, D, E, F])], [(q, 1, [p]) for q, p in enumerate([G, A, B, C + 12])]]
        upper = [[(q, 1, [p + 12]) for q, p in enumerate([C, D, E, F])], [(q, 1, [p + 12]) for q, p in enumerate([G, A, B, C + 12])]]
        self.assertFalse(figures.match(build(lower, upper))["walking-bass"]["present"])


class Boogie(unittest.TestCase):
    def test_root_three_five_six_flat_seven(self):
        # "| Root-3-5-6 | b7-6-5-3 |" (StudyBass), in C.
        bars = [[(q, 1, [p]) for q, p in enumerate([C, E, G, A])], [(q, 1, [p]) for q, p in enumerate([A + 1, A, G, E])]]
        # The second bar read from its own first note is not the figure; the pattern is two bars.
        self.assertEqual(figures.match(build(bars + bars, [TUNE] * 4))["boogie-bass"]["bars"], [1, 3])

    def test_a_scale_is_not_boogie(self):
        bar = eighths([C, D, E, F, G, A, B, C + 12])
        self.assertFalse(figures.match(build([bar, bar], [TUNE, TUNE]))["boogie-bass"]["present"])


class BrokenChord(unittest.TestCase):
    def test_arpeggiated_accompaniment(self):
        bar = eighths([C, E, G, C + 12, G, E, C, E])
        self.assertTrue(figures.match(build([bar, bar], [TUNE, TUNE]))["broken-chord"]["accompanies"])

    def test_steps_are_not_a_broken_chord(self):
        # Hanon No. 1's left hand, C E F G A G F E: no three successive notes skip through one chord.
        bar = eighths([C, E, F, G, A, G, F, E])
        self.assertFalse(figures.match(build([bar, bar], [TUNE, TUNE]))["broken-chord"]["present"])


class TuneOverFigure(unittest.TestCase):
    def test_same_rhythm_is_still_a_tune_over_a_figure(self):
        # A tune in eighths over Alberti in eighths: the hands strike together, the lines differ.
        lower = eighths([C, G, E, G, C, G, E, G])
        upper = eighths([72, 74, 76, 77, 79, 77, 76, 74])
        result = figures.match(build([lower, lower], [upper, upper]))
        self.assertTrue(result["alberti"]["accompanies"])

    def test_contrary_motion_arpeggio_is_one_line_mirrored(self):
        lower = eighths([C + 12, A, F, C, F, A, C + 12, F + 12])
        upper = eighths([C + 24, E + 24, G + 24, C + 36, G + 24, E + 24, C + 24, G + 12])
        result = figures.match(build([lower, lower], [upper, upper]))
        self.assertFalse(result["broken-chord"]["accompanies"])


class TheAppendix(unittest.TestCase):
    """Every known false positive gets no accompaniment or named-figure claim (CT1 check 1)."""

    def test_the_sixteen(self):
        for name in APPENDIX:
            with self.subTest(name):
                score = figures.read(GOLDEN / f"{name}.json")
                self.assertIsNotNone(score)
                result = figures.match(score)
                for concept in figures.CONCEPT_FIGURES:
                    self.assertFalse(figures.concept_present(result, concept), concept)

    def test_every_golden_exercise(self):
        # The wider near-miss set: every scale, arpeggio, Hanon, five-finger and inversion model.
        for path in sorted(GOLDEN.glob("exercise.*.json")):
            with self.subTest(path.stem):
                result = figures.match(figures.read(path))
                claimed = [c for c in figures.CONCEPT_FIGURES if figures.concept_present(result, c)]
                self.assertEqual(claimed, [])


if __name__ == "__main__":
    unittest.main()
