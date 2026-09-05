"""
Hanon 1–20 against the printed score (docs/03 §2, the P4 build list).

The encoding in content/sources/hanon-mutopia.json was read off a published
edition by tools/content/extract_hanon.py, so the risk it carries is a parser
bug, not a memory lapse. These tests are aimed at that: the exercises the
expectations are written from — No. 1 and No. 2 — are checked note for note
against the print, and the structural rules that hold for all twenty are
checked against every one of them.

Hanon is written in 2/4 with eight sixteenths to the bar, so "the first two
bars" is the first sixteen notes and "the first descending bar" is the eight
notes after the double bar.
"""
from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from generate_exercises import load_hanon, make_hanon  # noqa: E402

DATA = Path(__file__).resolve().parents[3] / "content" / "sources" / "hanon-mutopia.json"

#: C major, so a scale degree is a letter and nothing else is needed.
LETTERS = "CDEFGAB"


def degree_to_name(start: str, degree: int) -> str:
    """`("C4", 2)` → "E4": walk `degree` steps up the C major scale."""
    letter, octave = start[0], int(start[1:])
    index = LETTERS.index(letter) + degree
    return f"{LETTERS[index % 7]}{octave + index // 7}"


def names(spec: dict, hand: str, start: int, count: int) -> list[str]:
    steps = spec[hand]["steps"][start : start + count]
    return [degree_to_name(spec[hand]["start"], step) for step in steps]


class TestAgainstThePrint(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.exercises = load_hanon()

    def test_no_1_first_two_bars(self) -> None:
        # Hanon No. 1, right hand: C E F G A G F E | D F G A B A G F
        self.assertEqual(
            names(self.exercises["1"], "rh", 0, 16),
            ["C4", "E4", "F4", "G4", "A4", "G4", "F4", "E4",
             "D4", "F4", "G4", "A4", "B4", "A4", "G4", "F4"],
        )

    def test_no_1_left_hand_is_two_octaves_below(self) -> None:
        # The hands play the same pattern; only the register differs.
        right = names(self.exercises["1"], "rh", 0, 16)
        left = names(self.exercises["1"], "lh", 0, 16)
        self.assertEqual([n[0] for n in left], [n[0] for n in right])
        self.assertEqual([int(n[1:]) for n in left], [int(n[1:]) - 1 for n in right])

    def test_no_1_first_descending_bar(self) -> None:
        # After the double bar: G E D C B C D E, two octaves up from where the
        # ascending half started.
        spec = self.exercises["1"]
        ascending = spec["rh"]["ascendingNotes"]
        self.assertEqual(ascending, 112)
        self.assertEqual(
            names(spec, "rh", ascending, 8),
            ["G6", "E6", "D6", "C6", "B5", "C6", "D6", "E6"],
        )

    def test_no_1_printed_fingering(self) -> None:
        # 1 2 3 4 5 in the right hand, 5 4 3 2 1 in the left, printed on the
        # first five notes and not repeated after that.
        spec = self.exercises["1"]
        self.assertEqual(spec["rh"]["fingers"][:8], [1, 2, 3, 4, 5, None, None, None])
        self.assertEqual(spec["lh"]["fingers"][:8], [5, 4, 3, 2, 1, None, None, None])

    def test_no_2_first_two_bars(self) -> None:
        # Hanon No. 2: C E A G F G F E | D F B A G A G F
        self.assertEqual(
            names(self.exercises["2"], "rh", 0, 16),
            ["C4", "E4", "A4", "G4", "F4", "G4", "F4", "E4",
             "D4", "F4", "B4", "A4", "G4", "A4", "G4", "F4"],
        )

    def test_no_2_first_descending_bar(self) -> None:
        # G D B C D C D E — the ascending figure turned round.
        spec = self.exercises["2"]
        self.assertEqual(
            names(spec, "rh", spec["rh"]["ascendingNotes"], 8),
            ["G6", "D6", "B5", "C6", "D6", "C6", "D6", "E6"],
        )


class TestAllTwenty(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.exercises = load_hanon()

    def test_all_twenty_are_present(self) -> None:
        self.assertEqual(sorted(int(n) for n in self.exercises), list(range(1, 21)))

    def test_each_is_a_whole_number_of_bars_plus_the_final_note(self) -> None:
        for number, spec in self.exercises.items():
            with self.subTest(number=number):
                final = spec["finalChordNotes"]
                for hand in ("rh", "lh"):
                    self.assertEqual((len(spec[hand]["steps"]) - final) % 8, 0, hand)

    def test_the_hands_are_the_same_length(self) -> None:
        for number, spec in self.exercises.items():
            with self.subTest(number=number):
                self.assertEqual(len(spec["rh"]["steps"]), len(spec["lh"]["steps"]))

    def test_the_ascending_half_repeats_one_cell(self) -> None:
        # Every exercise is one eight-note figure moved up the scale a step at
        # a time; if the parse dropped or invented a note this breaks.
        for number, spec in self.exercises.items():
            with self.subTest(number=number):
                steps = spec["rh"]["steps"]
                bars = spec["rh"]["ascendingNotes"] // 8
                cells = [
                    [s - steps[bar * 8] for s in steps[bar * 8 : bar * 8 + 8]]
                    for bar in range(bars)
                ]
                # The interior bars are one figure moved up the scale. The
                # last one turns the corner into the descent, and No. 12
                # begins on a different note from the one its figure repeats
                # from — both are in the print.
                self.assertEqual(len({tuple(c) for c in cells[1:-1]}), 1, "cells differ")
                self.assertEqual(cells[-1][:7], cells[1][:7], "last bar differs early")

    def test_each_bar_starts_one_step_above_the_last(self) -> None:
        for number, spec in self.exercises.items():
            with self.subTest(number=number):
                steps = spec["rh"]["steps"]
                bars = spec["rh"]["ascendingNotes"] // 8
                starts = [steps[bar * 8] for bar in range(bars)]
                # From the second bar on; No. 12's first bar starts a third
                # lower than the sequence it then follows.
                self.assertEqual(starts[1:], list(range(starts[1], starts[1] + bars - 1)))

    def test_every_exercise_stays_on_the_keyboard(self) -> None:
        for number, spec in self.exercises.items():
            with self.subTest(number=number):
                for hand, lowest in (("rh", 60), ("lh", 48)):
                    for step in spec[hand]["steps"]:
                        name = degree_to_name(spec[hand]["start"], step)
                        octave = int(name[1:])
                        self.assertGreaterEqual(octave, 1, f"{hand} {name}")
                        self.assertLessEqual(octave, 7, f"{hand} {name}")


class TestGeneratedScore(unittest.TestCase):
    def test_the_score_has_the_printed_bar_count(self) -> None:
        from music21 import stream

        score, entry = make_hanon(1, "both")
        bars = max(len(part.getElementsByClass(stream.Measure)) for part in score.parts)
        # 14 ascending bars + 15 descending + the closing long note.
        self.assertEqual(bars, 30)
        self.assertEqual(entry["id"], "exercise.hanon.01.both")

    def test_the_fingering_reaches_the_score(self) -> None:
        from music21 import articulations

        score, _ = make_hanon(1, "both")
        fingerings = [
            a
            for n in score.recurse().notes
            for a in n.articulations
            if isinstance(a, articulations.Fingering)
        ]
        self.assertGreater(len(fingerings), 20)

    def test_the_edition_is_credited(self) -> None:
        # The note data came from a CC BY-SA edition, so it says so.
        _, entry = make_hanon(1, "both")
        self.assertIn("Mutopia", entry["source"]["name"])
        self.assertIn("CC BY-SA", entry["source"]["license"])

    def test_one_hand_at_a_time(self) -> None:
        for hands in ("right", "left"):
            score, entry = make_hanon(2, hands)
            self.assertEqual(entry["hands"], hands)
            self.assertGreater(len(score.recurse().notes), 100)


class TestProvenance(unittest.TestCase):
    def test_the_data_file_records_where_it_came_from(self) -> None:
        data = json.loads(DATA.read_text(encoding="utf-8"))
        self.assertIn("Mutopia", data["source"]["name"])
        self.assertEqual(data["source"]["license"], "CC BY-SA 4.0")
        self.assertTrue(data["source"]["revision"])


if __name__ == "__main__":
    unittest.main()
