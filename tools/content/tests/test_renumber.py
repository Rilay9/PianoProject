"""
Bars are numbered from 1 unless the first bar is a pickup (P21e A4).

music21's ABC reader numbers the first measure 0 for a tune that starts on a
full bar, and the engraver prints that number: an authored song opened at
"bar 0" and its second system said "1". A real pickup is the one case where 0
is right.
"""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from music21 import meter, note, stream  # noqa: E402

from convert import renumber_measures  # noqa: E402


def staff_with(first_bar_quarters: float, bars: int = 3) -> stream.PartStaff:
    staff = stream.PartStaff()
    for index in range(bars):
        measure = stream.Measure(number=index)
        if index == 0:
            measure.insert(0, meter.TimeSignature("4/4"))
            length = first_bar_quarters
        else:
            length = 4.0
        measure.append(note.Note("C4", quarterLength=length))
        staff.append(measure)
    return staff


class RenumberMeasures(unittest.TestCase):
    def test_a_full_first_bar_numbered_zero_is_renumbered_from_one(self) -> None:
        staff = staff_with(4.0)
        self.assertTrue(renumber_measures([staff]))
        numbers = [m.number for m in staff.getElementsByClass(stream.Measure)]
        self.assertEqual(numbers, [1, 2, 3])

    def test_a_pickup_keeps_its_zero(self) -> None:
        staff = staff_with(1.0)
        self.assertFalse(renumber_measures([staff]))
        numbers = [m.number for m in staff.getElementsByClass(stream.Measure)]
        self.assertEqual(numbers, [0, 1, 2])

    def test_bars_already_numbered_from_one_are_left_alone(self) -> None:
        staff = staff_with(4.0)
        for index, measure in enumerate(staff.getElementsByClass(stream.Measure)):
            measure.number = index + 1
        self.assertFalse(renumber_measures([staff]))


if __name__ == "__main__":
    unittest.main()
