"""
The generator's fingering tables against a published chart.

The chart is Clementi's Op. 42 (1801) in the Mutopia typeset, extracted by
tools/content/extract_fingering.py. What is compared is the **thumb
positions**: a scale fingering is a decision about where the thumb goes, and
the other fingers follow by stepping. The first and last notes are excluded
from the comparison and the reason is in the table's own comment — Clementi
prints two-octave runs, so his outer fingers are chosen for a hand that keeps
going.

The rules at the bottom hold whatever any chart says — no scale fingering puts
the thumb on a black key, and no hand stretches more than four notes between
thumbs — so they keep a future edit honest without a chart to consult.
"""
from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from generate_exercises import HARMONIC_MINOR_FINGERING, MAJOR_FINGERING  # noqa: E402

CHART = Path(__file__).resolve().parents[3] / "content" / "sources" / "clementi-op42-fingering.json"

#: music21 spelling → the enharmonic Clementi prints, where they differ.
ENHARMONIC = {"G- major": "F# major", "E- minor": "D# minor"}

BLACK_PITCH_CLASSES = {1, 3, 6, 8, 10}
NATURAL_PITCH_CLASS = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11, 12]
HARMONIC_MINOR_STEPS = [0, 2, 3, 5, 7, 8, 11, 12]


def tonic_pitch_class(tonic: str) -> int:
    base = NATURAL_PITCH_CLASS[tonic[0]]
    return (base + tonic.count("#") - tonic.count("-")) % 12


def thumbs(fingering: list[int]) -> set[int]:
    """Positions of the thumb within the octave, ignoring the outer notes."""
    return {index for index, finger in enumerate(fingering) if finger == 1 and 0 < index < 7}


class TestAgainstClementi(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.chart = json.loads(CHART.read_text(encoding="utf-8"))["keys"]

    def check(self, name: str, ours: tuple[list[int], list[int]]) -> None:
        entry = self.chart.get(ENHARMONIC.get(name, name))
        self.assertIsNotNone(entry, f"{name} is not in the chart")
        for hand, index in (("rh", 0), ("lh", 1)):
            printed = entry[hand]["filled"]
            if any(f is None for f in printed[1:7]):
                # The edition marks this key sparsely enough that the interior
                # cannot be read off; the printed fingers are still checked.
                for position in range(1, 7):
                    if printed[position] is not None:
                        self.assertEqual(
                            ours[index][position], printed[position],
                            f"{name} {hand} position {position}",
                        )
                continue
            self.assertEqual(
                thumbs(ours[index]), thumbs(printed),
                f"{name} {hand}: thumbs at {sorted(thumbs(ours[index]))}, "
                f"Clementi has {sorted(thumbs(printed))}",
            )

    def test_every_major_scale(self) -> None:
        for tonic, fingering in MAJOR_FINGERING.items():
            with self.subTest(key=tonic):
                self.check(f"{tonic} major", fingering)

    def test_every_minor_scale(self) -> None:
        for tonic, fingering in HARMONIC_MINOR_FINGERING.items():
            with self.subTest(key=tonic):
                self.check(f"{tonic} minor", fingering)

    def test_the_chart_covers_every_key_we_generate(self) -> None:
        missing = [
            f"{tonic} {mode}"
            for mode, table in (("major", MAJOR_FINGERING), ("minor", HARMONIC_MINOR_FINGERING))
            for tonic in table
            if ENHARMONIC.get(f"{tonic} {mode}", f"{tonic} {mode}") not in self.chart
        ]
        self.assertEqual(missing, [])


class TestFingeringRules(unittest.TestCase):
    """Rules that hold for any scale fingering, whatever the chart says."""

    def all_tables(self):
        for mode, table, steps in (
            ("major", MAJOR_FINGERING, MAJOR_STEPS),
            ("minor", HARMONIC_MINOR_FINGERING, HARMONIC_MINOR_STEPS),
        ):
            for tonic, (rh, lh) in table.items():
                yield f"{tonic} {mode}", tonic, steps, rh, lh

    def test_every_table_is_one_octave(self) -> None:
        for name, _, _, rh, lh in self.all_tables():
            self.assertEqual(len(rh), 8, name)
            self.assertEqual(len(lh), 8, name)

    def test_fingers_are_fingers(self) -> None:
        for name, _, _, rh, lh in self.all_tables():
            for finger in rh + lh:
                self.assertIn(finger, {1, 2, 3, 4, 5}, name)

    def test_the_thumb_never_lands_on_a_black_key(self) -> None:
        # The one rule of scale fingering with no exceptions: the thumb is
        # too short to reach comfortably between the black keys.
        for name, tonic, steps, rh, lh in self.all_tables():
            base = tonic_pitch_class(tonic)
            for hand_name, fingering in (("RH", rh), ("LH", lh)):
                for position, finger in enumerate(fingering):
                    if finger != 1:
                        continue
                    pitch_class = (base + steps[position]) % 12
                    self.assertNotIn(
                        pitch_class, BLACK_PITCH_CLASSES,
                        f"{name} {hand_name}: thumb on a black key at position {position}",
                    )

    def test_the_hand_never_has_to_stretch_more_than_four_notes(self) -> None:
        # Between two thumbs there are at most four fingers to use.
        for name, _, _, rh, lh in self.all_tables():
            for hand_name, fingering in (("RH", rh), ("LH", lh)):
                positions = [i for i, f in enumerate(fingering) if f == 1]
                for first, second in zip(positions, positions[1:]):
                    self.assertLessEqual(second - first, 4, f"{name} {hand_name}")


if __name__ == "__main__":
    unittest.main()
