"""
The exercise generator's catalog output (docs/03 §2 [GEN]).

The id test is here because the ids collided in a way nothing else would have
noticed: `slug("E-")` and `slug("E")` are both "e", so every flat key wrote
over its natural. The catalog validated, the files existed, and half the
library was silently the wrong piece.
"""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from generate_exercises import (  # noqa: E402
    RHYTHM_PATTERNS,
    chromatic_finger,
    default_plan,
    key_slug,
    make_chromatic,
    make_rhythm,
    make_seventh_arpeggio,
)


class TestKeySlug(unittest.TestCase):
    def test_flats_and_naturals_are_different(self) -> None:
        self.assertNotEqual(key_slug("E-"), key_slug("E"))
        self.assertEqual(key_slug("E-"), "e-flat")

    def test_sharps_and_naturals_are_different(self) -> None:
        self.assertNotEqual(key_slug("F#"), key_slug("F"))
        self.assertEqual(key_slug("F#"), "f-sharp")


class TestPlan(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.plan = default_plan(quick=True)

    def test_every_id_is_unique(self) -> None:
        ids = [entry["id"] for _, entry in self.plan]
        self.assertEqual(sorted(ids), sorted(set(ids)))

    def test_every_entry_names_the_file_it_writes(self) -> None:
        for _, entry in self.plan:
            with self.subTest(item=entry["id"]):
                self.assertEqual(entry["file"], f"scores/generated/{entry['id']}.mxl")

    def test_every_entry_declares_a_licence(self) -> None:
        for _, entry in self.plan:
            with self.subTest(item=entry["id"]):
                self.assertTrue(entry["source"]["license"])


class TestChromatic(unittest.TestCase):
    def test_the_standard_one_three_shape(self) -> None:
        # C C# D D# E F F# G — 1 3 1 3 1 2 3 1.
        fingers = [chromatic_finger(60 + i, i == 0) for i in range(8)]
        self.assertEqual(fingers, [1, 3, 1, 3, 1, 2, 3, 1])

    def test_the_c_at_the_top_of_the_octave_takes_the_second_finger(self) -> None:
        self.assertEqual(chromatic_finger(72, False), 2)
        self.assertEqual(chromatic_finger(60, True), 1)

    def test_it_writes_a_grand_staff(self) -> None:
        score, entry = make_chromatic("C", "both", 1)
        self.assertEqual(len(list(score.parts)), 2)
        self.assertEqual(entry["drill"]["params"]["mode"], "chromatic")


class TestSevenths(unittest.TestCase):
    def test_a_dominant_seventh_has_a_flat_seventh(self) -> None:
        score, _ = make_seventh_arpeggio("C", "dominant7", "right", 1)
        pitches = [n.pitch.midi % 12 for n in score.parts[0].recurse().notes]
        self.assertEqual(sorted(set(pitches)), [0, 4, 7, 10])

    def test_a_diminished_seventh_is_a_stack_of_minor_thirds(self) -> None:
        score, _ = make_seventh_arpeggio("C", "diminished7", "right", 1)
        pitches = [n.pitch.midi % 12 for n in score.parts[0].recurse().notes]
        self.assertEqual(sorted(set(pitches)), [0, 3, 6, 9])


class TestRhythm(unittest.TestCase):
    def test_every_pattern_fills_whole_bars(self) -> None:
        for label, lengths, _ in RHYTHM_PATTERNS:
            with self.subTest(pattern=label):
                self.assertAlmostEqual(sum(lengths) % 4, 0, places=6)

    def test_a_rhythm_drill_is_written_on_one_line(self) -> None:
        score, entry = make_rhythm("quarters", bars=4)
        self.assertEqual(len(list(score.parts)), 1)
        self.assertEqual(entry["drill"]["kind"], "rhythm")

    def test_a_rhythm_drill_has_the_bars_it_says(self) -> None:
        from music21 import stream

        score, _ = make_rhythm("eighths", bars=3)
        self.assertEqual(len(score.parts[0].getElementsByClass(stream.Measure)), 3)


if __name__ == "__main__":
    unittest.main()
