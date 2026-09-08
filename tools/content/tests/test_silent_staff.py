"""A staff with nothing to play is left out (round four of the tour)."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from music21 import meter, note, stream  # noqa: E402

from convert import drop_silent_staves  # noqa: E402


def part_of(pitched: bool, bars: int = 2) -> stream.Part:
    part = stream.Part()
    for i in range(bars):
        measure = stream.Measure(number=i + 1)
        if i == 0:
            measure.append(meter.TimeSignature("4/4"))
        measure.append(note.Note("C4", quarterLength=4) if pitched else note.Rest(quarterLength=4))
        part.append(measure)
    return part


class DropSilentStaves(unittest.TestCase):
    def test_a_staff_of_rests_under_a_tune_is_dropped(self) -> None:
        notes: list[str] = []
        kept = drop_silent_staves([part_of(True), part_of(False)], notes)
        self.assertEqual(len(kept), 1)
        self.assertEqual(notes, ["dropped 1 silent staff(ves) with only rests"])

    def test_two_sounding_staves_are_both_kept(self) -> None:
        notes: list[str] = []
        self.assertEqual(len(drop_silent_staves([part_of(True), part_of(True)], notes)), 2)
        self.assertEqual(notes, [])

    def test_a_piece_of_nothing_but_rests_keeps_its_staves(self) -> None:
        notes: list[str] = []
        self.assertEqual(len(drop_silent_staves([part_of(False)], notes)), 1)


if __name__ == "__main__":
    unittest.main()
