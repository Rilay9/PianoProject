"""
CF1 (`independent_check.py`): every key and variant the N1/N2 makers can write, read back from
MusicXML and held to its family's promise; and one deliberate break per promise, caught. The space
is finite, so it is enumerated whole.
"""
from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from music21 import converter, expressions, pitch, stream  # noqa: E402

from generate_exercises import (  # noqa: E402
    COORDINATION_VARIANTS, MAJOR_KEYS, MINOR_KEYS, OSTINATO_SHAPES, RHYTHM_PATTERNS, RHYTHM_PATTERNS_EXTRA,
    engraved_key, make_coordination, make_five_finger, make_ostinato, make_rhythm, make_swing_pair,
)
from independent_check import check  # noqa: E402

TMP = Path(tempfile.mkdtemp(prefix="cf1-"))


def item(made):
    """Read back from the written file, with the `keySig` the build gives the row."""
    score, row = made
    path = TMP / f"{row['id']}.musicxml"
    score.write("musicxml", fp=str(path))
    return converter.parse(str(path)), {**row, "keySig": engraved_key(score, row["drill"]["params"].get("key"))}


def every_item():
    for k in MAJOR_KEYS:
        yield from (make_coordination(k, v) for v in COORDINATION_VARIANTS)
        yield from (make_five_finger(k, "major", h) for h in ("right", "left", "both"))
        yield make_swing_pair(k)
    for k in MINOR_KEYS:
        yield make_five_finger(k, "minor", "both")
        yield from (make_ostinato(k, shape) for shape in OSTINATO_SHAPES)
    yield from (make_rhythm(pattern) for pattern, *_ in RHYTHM_PATTERNS + RHYTHM_PATTERNS_EXTRA)


class Breadth(unittest.TestCase):
    def test_every_key_and_variant_keeps_its_promise(self) -> None:
        for made in every_item():
            score, row = item(made)
            with self.subTest(item=row["id"]):
                self.assertEqual(check(score, row), [])


def bar(score, staff, index):
    return score.parts[staff].getElementsByClass(stream.Measure)[index]


class Breaks(unittest.TestCase):
    """Each break is made on the page as read back, and named by the fault it should raise."""

    def caught(self, made, breaks, words):
        score, row = item(made)
        breaks(score)
        self.assertTrue(any(words in f for f in check(score, row)), check(score, row))

    def test_a_bar_short(self):
        self.caught(make_coordination("C", "hold"), lambda s: bar(s, 0, 1).remove(bar(s, 0, 1).notes[-1]),
                    "bar 2: not full")

    def test_a_note_spelled_outside_its_key(self):
        def respell(s):
            bar(s, 0, 0).notes[2].pitch = pitch.Pitch("G-4")      # F sharp in D major, written G flat
        self.caught(make_coordination("D", "hold"), respell, "G-4 is not D major's own")

    def test_a_left_hand_that_holds_and_moves(self):
        def move(s):
            bar(s, 1, 1).notes[0].pitch = pitch.Pitch("G3")
        self.caught(make_coordination("C", "hold"), move, "left hand holds and moves")

    def test_a_left_hand_that_changes_and_repeats(self):
        def repeat(s):
            bar(s, 1, 1).notes[0].pitch = pitch.Pitch("F3")
        self.caught(make_coordination("F", "change"), repeat, "left hand changes and repeats")

    def test_a_leap_in_the_walk(self):
        def leap(s):
            bar(s, 0, 0).notes[2].pitch = pitch.Pitch("A4")
        self.caught(make_coordination("C", "hold"), leap, "right hand leaves the five-finger walk")

    def test_a_five_finger_pattern_that_skips(self):
        def skip(s):
            bar(s, 0, 0).notes[1].pitch = pitch.Pitch("C5")
        self.caught(make_five_finger("A", "minor", "both"), skip, "not five steps up from the tonic and back")

    def test_an_ostinato_that_drifts(self):
        def drift(s):
            bar(s, 0, 5).notes[1].transpose("M2", inPlace=True)
        self.caught(make_ostinato("A", "fifths"), drift, "the eighth-note figure changes")

    def test_a_rhythm_whose_bars_differ(self):
        def swap(s):
            first, second = bar(s, 0, 2).notes[0], bar(s, 0, 2).notes[1]
            first.quarterLength, second.quarterLength = 0.5, 1.0
        self.caught(make_rhythm("quarter-eighths"), swap, "not one rhythm on one pitch")

    def test_a_swung_half_that_is_not_the_straight_half(self):
        def change(s):
            bar(s, 0, 7).notes[0].transpose("M2", inPlace=True)
        self.caught(make_swing_pair("G"), change, "not four bars, a silent bar and the same four bars")

    def test_no_swing_mark(self):
        def unmark(s):
            for t in list(bar(s, 0, 5).getElementsByClass(expressions.TextExpression)):
                bar(s, 0, 5).remove(t)
        self.caught(make_swing_pair("C"), unmark, "no swing mark")


if __name__ == "__main__":
    unittest.main()
