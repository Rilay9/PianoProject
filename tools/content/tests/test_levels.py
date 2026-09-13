"""
The one level table (replan §3.1, `02` Part E amendment).

Every scale variant used to be handed a literal `4.1` in `default_plan()`,
which is why 225 of 430 exercises sat at level 4 and none above 5: the upper
half of the ladder had no generated material to stand on. The levels now follow
from the parameters, and this file is the table read back — each case is a row
of §3.1 rather than whatever the code happens to return.
"""
from __future__ import annotations

import sys
import unittest
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from generate_exercises import (  # noqa: E402
    ScaleSpec,
    accidental_count,
    arpeggio_level,
    broken_seventh_level,
    default_plan,
    make_five_finger,
    scale_level,
)


def major(tonic, hands="both", octaves=1, motion="similar", rhythm=0.5):
    return scale_level(tonic, "major", hands, octaves, motion, rhythm)


def minor(tonic, hands="both", octaves=1, mode="harmonic", rhythm=0.5):
    return scale_level(tonic, mode, hands, octaves, "similar", rhythm)


class TestMajorScales(unittest.TestCase):
    def test_hands_separately_one_octave_follows_the_key_bands(self) -> None:
        # E and B used to sit at 4.2 here, with everything past D and A, which
        # put them *above* their own hands-together score of 4.1: the same
        # scale, in the same key, rated harder for using one hand. They follow
        # the sharp-side band a step lower now. The flat and remote keys are
        # unchanged.
        for tonic in ("C", "G", "F"):
            self.assertEqual(major(tonic, hands="right"), 2.5, tonic)
        for tonic in ("D", "A"):
            self.assertEqual(major(tonic, hands="right"), 3.1, tonic)
        for tonic in ("E", "B"):
            self.assertEqual(major(tonic, hands="right"), 3.2, tonic)
        for tonic in ("A-", "G-", "B-", "E-", "D-"):
            self.assertEqual(major(tonic, hands="right"), 4.2, tonic)

    def test_hands_together_one_octave(self) -> None:
        # One and two octaves take the same bands. The one-octave path used to
        # have a narrower easy set, so E and B scored 5.1 at one octave and 4.1
        # at two — rated harder for being shorter.
        for tonic in ("C", "G", "D", "A", "E", "B"):
            self.assertEqual(major(tonic), 4.1, tonic)
        for tonic in ("F", "B-", "E-"):
            self.assertEqual(major(tonic), 4.2, tonic)
        for tonic in ("A-", "D-", "G-"):
            self.assertEqual(major(tonic), 5.1, tonic)

    def test_two_octaves_splits_sharp_side_from_flat(self) -> None:
        for tonic in ("C", "G", "D", "A", "E", "B"):
            self.assertEqual(major(tonic, octaves=2), 4.1, tonic)
        for tonic in ("F", "B-", "E-"):
            self.assertEqual(major(tonic, octaves=2), 4.2, tonic)
        for tonic in ("A-", "D-", "G-"):
            self.assertEqual(major(tonic, octaves=2), 5.1, tonic)

    def test_contrary_motion_is_levelled_like_similar(self) -> None:
        # What makes B major hard is the key, not the direction.
        self.assertEqual(major("C", motion="contrary"), major("C"))
        self.assertEqual(major("G-", octaves=2, motion="contrary"), major("G-", octaves=2))

    def test_the_wide_spans_are_stage_six(self) -> None:
        self.assertEqual(major("C", octaves=3), 6.1)
        self.assertEqual(major("G-", octaves=3), 6.1)
        self.assertEqual(major("C", octaves=4), 6.2)

    def test_four_octaves_in_sixteenths_is_stage_eight(self) -> None:
        # `02` Part E stage 8: "all scales 4 oct at ♩=120 in 16ths".
        self.assertEqual(major("C", octaves=4, rhythm=0.25), 8.1)
        # …the span alone is not.
        self.assertEqual(major("C", octaves=4, rhythm=0.5), 6.2)


class TestMinorScales(unittest.TestCase):
    def test_the_first_three_minors_start_hands_separately_at_three(self) -> None:
        for tonic in ("A", "E", "D"):
            self.assertEqual(minor(tonic, hands="right"), 3.3, tonic)

    def test_other_minors_hands_separately(self) -> None:
        self.assertEqual(minor("G#", hands="right"), 4.2)

    def test_hands_together_one_octave_only_favours_the_stage_four_minors(self) -> None:
        # Part E names Am, Em and Dm at stage 4 and no others until stage 5.
        for tonic in ("A", "E", "D"):
            self.assertEqual(minor(tonic), 4.2, tonic)
        self.assertEqual(minor("G"), 5.1)      # 2 flats
        self.assertEqual(minor("G#"), 5.2)     # 5 sharps

    def test_two_octaves_splits_on_the_accidental_count(self) -> None:
        self.assertEqual(minor("A", octaves=2), 5.1)
        self.assertEqual(minor("C", octaves=2), 5.1)   # 3 flats
        self.assertEqual(minor("G#", octaves=2), 5.2)  # 5 sharps

    def test_accidental_count_is_the_key_signature(self) -> None:
        self.assertEqual(accidental_count("C", "major"), 0)
        self.assertEqual(accidental_count("A", "minor"), 0)
        self.assertEqual(accidental_count("C", "minor"), 3)
        self.assertEqual(accidental_count("G#", "minor"), 5)


class TestChromatic(unittest.TestCase):
    def test_one_octave_is_four_and_two_is_six(self) -> None:
        self.assertEqual(scale_level("C", "chromatic", "right", 1, "similar", 0.5), 4.4)
        self.assertEqual(scale_level("C", "chromatic", "both", 1, "similar", 0.5), 4.4)
        self.assertEqual(scale_level("C", "chromatic", "both", 2, "similar", 0.5), 6.1)


class TestArpeggios(unittest.TestCase):
    def test_triads(self) -> None:
        self.assertEqual(arpeggio_level("C", "major", "right", 2), 4.3)
        self.assertEqual(arpeggio_level("C", "major", "both", 2), 5.1)
        self.assertEqual(arpeggio_level("C", "major", "both", 4), 6.2)

    def test_sevenths(self) -> None:
        self.assertEqual(arpeggio_level("C", "dominant7", "both", 2), 5.2)
        self.assertEqual(arpeggio_level("B", "dominant7", "both", 2), 6.1)
        self.assertEqual(arpeggio_level("C", "diminished7", "both", 2), 6.1)
        for quality in ("major7", "minor7", "half-diminished7"):
            self.assertEqual(arpeggio_level("C", quality, "both", 2), 6.3, quality)

    def test_broken_sevenths_are_stage_seven(self) -> None:
        self.assertEqual(broken_seventh_level("C"), 7.1)
        self.assertEqual(broken_seventh_level("E-"), 7.2)


class TestDerivedNotPassed(unittest.TestCase):
    """No caller can hand a generator the wrong level, because none takes one."""

    def test_scale_spec_derives_its_level(self) -> None:
        self.assertEqual(ScaleSpec("C", "major", "both", 2).level, 4.1)
        self.assertEqual(ScaleSpec("G-", "major", "both", 2).level, 5.1)

    def test_five_finger_splits_on_hands(self) -> None:
        self.assertEqual(make_five_finger("C", "major", "right")[1]["level"], 1.1)
        self.assertEqual(make_five_finger("C", "major", "both")[1]["level"], 2.1)


class TestTheShapeOfThePlan(unittest.TestCase):
    """
    The distribution is the point of §3.1, so it is asserted rather than admired.

    These are deliberately loose bounds: the exact counts move whenever a family
    is added, and pinning them would make every future phase edit this test. The
    two properties that must hold are that no level in 1–8 is empty and that no
    single level swallows the library.
    """

    @classmethod
    def setUpClass(cls) -> None:
        cls.levels = Counter(int(entry["level"]) for _, entry in default_plan(quick=False))

    def test_no_level_one_to_eight_is_empty(self) -> None:
        empty = [lvl for lvl in range(1, 9) if self.levels.get(lvl, 0) == 0]
        self.assertEqual(empty, [], f"levels with no generated exercise: {empty}")

    def test_level_four_no_longer_holds_half_the_library(self) -> None:
        total = sum(self.levels.values())
        share = self.levels.get(4, 0) / total
        # It was 225/430 — 52%. Anything under a third is a distribution rather
        # than a bulge.
        self.assertLess(share, 0.34, f"level 4 holds {share:.0%} of {total} exercises")

    def test_the_upper_half_of_the_ladder_is_populated(self) -> None:
        upper = sum(self.levels.get(lvl, 0) for lvl in (6, 7, 8))
        self.assertGreater(upper, 100, "stages 6-8 need generated material to stand on")


if __name__ == "__main__":  # pragma: no cover
    unittest.main()

class TestTheLadderOnlyGoesUp(unittest.TestCase):
    """
    A harder input may never score lower than an easier one.

    Both faults above were inversions, and neither was visible from the numbers
    a test asserts one at a time — each individual band looked reasonable. What
    catches them is asking the question across the whole space at once, which
    is cheap here because these are pure functions.
    """

    KEYS = ("C", "G", "D", "A", "E", "B", "F", "B-", "E-", "A-", "D-", "G-")
    MINORS = ("A", "E", "D", "G", "C", "B", "F", "F#", "C#", "G#", "B-", "E-")

    def test_more_octaves_is_never_easier(self) -> None:
        for tonic in self.KEYS:
            for hands in ("right", "left", "both"):
                for rhythm in (1.0, 0.5, 0.25):
                    got = [major(tonic, hands=hands, octaves=o, rhythm=rhythm)
                           for o in (1, 2, 3, 4)]
                    self.assertEqual(got, sorted(got), f"{tonic} {hands} {rhythm}")

    def test_faster_notes_are_never_easier(self) -> None:
        for tonic in self.KEYS:
            for octaves in (1, 2, 3, 4):
                got = [major(tonic, octaves=octaves, rhythm=r) for r in (1.0, 0.5, 0.25)]
                self.assertEqual(got, sorted(got), f"{tonic} {octaves}oct")

    def test_two_hands_is_never_easier_than_one(self) -> None:
        for tonic in self.KEYS:
            for octaves in (1, 2, 3, 4):
                both = major(tonic, hands="both", octaves=octaves)
                for hands in ("right", "left"):
                    self.assertLessEqual(
                        major(tonic, hands=hands, octaves=octaves), both,
                        f"{tonic} {octaves}oct {hands}")

    def test_a_minor_is_never_easier_than_its_major(self) -> None:
        for tonic in self.MINORS:
            for hands in ("right", "left", "both"):
                for octaves in (1, 2, 3):
                    for mode in ("harmonic", "melodic", "natural"):
                        self.assertGreaterEqual(
                            minor(tonic, hands=hands, octaves=octaves, mode=mode),
                            major(tonic, hands=hands, octaves=octaves),
                            f"{tonic} {mode} {hands} {octaves}oct")

