"""
The independent reading of generated exercises (CF1, `independent_check.py`).

Two halves. **Breadth**: every key and variant the makers of the needs N1 and N2 can write
(coordination, five-finger, ostinato, rhythm, the swing pair), more than the plan ships, written
to MusicXML, read back by music21, and held to the page and to the family's named promise.
**Adversaries**: one deliberate break per property, each red with the fault that names it, so a
green breadth run means the reading looked rather than that it could not see.

The parameter space is finite (twelve keys, a few variants), so it is enumerated whole rather than
sampled; a property-testing library would add a dependency and delete nothing here.
"""
from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from music21 import converter, expressions, pitch, stream  # noqa: E402

from generate_exercises import (  # noqa: E402
    COORDINATION_VARIANTS,
    MAJOR_KEYS,
    MINOR_KEYS,
    OSTINATO_SHAPES,
    RHYTHM_PATTERNS,
    RHYTHM_PATTERNS_EXTRA,
    engraved_key,
    make_coordination,
    make_five_finger,
    make_ostinato,
    make_rhythm,
    make_swing_pair,
)
from independent_check import check  # noqa: E402

TMP = Path(tempfile.mkdtemp(prefix="independent-check-"))


def read_back(score: stream.Score, name: str) -> stream.Score:
    """The score as the learner's file holds it: written to MusicXML and parsed again."""
    path = TMP / f"{name}.musicxml"
    score.write("musicxml", fp=str(path))
    return converter.parse(str(path))


def faults(score: stream.Score, row: dict) -> list[str]:
    result = check(score, row)
    return result["page"] + (result["promise"] or [])


def shipped(made: tuple[stream.Score, dict]) -> tuple[stream.Score, dict]:
    """The row as the build writes it: `keySig` is the engraved key, set where score and row meet."""
    score, row = made
    return score, {**row, "keySig": engraved_key(score, row["drill"]["params"].get("key"))}


def raw_items():
    for k in MAJOR_KEYS:
        for variant in COORDINATION_VARIANTS:
            yield make_coordination(k, variant)
        for hands in ("right", "left", "both"):
            yield make_five_finger(k, "major", hands)
        yield make_swing_pair(k)
    for k in MINOR_KEYS:
        yield make_five_finger(k, "minor", "both")
        for shape in OSTINATO_SHAPES:
            yield make_ostinato(k, shape)
    for pattern, *_ in RHYTHM_PATTERNS + RHYTHM_PATTERNS_EXTRA:
        yield make_rhythm(pattern)


def every_item():
    return (shipped(made) for made in raw_items())


class Breadth(unittest.TestCase):
    def test_every_key_and_variant_reads_as_its_page_and_its_promise(self) -> None:
        count = 0
        for score, row in every_item():
            count += 1
            with self.subTest(item=row["id"]):
                result = check(read_back(score, row["id"]), row)
                self.assertIsNotNone(result["promise"], "every family here has its promise read")
                self.assertEqual(result["page"] + result["promise"], [])
        self.assertGreater(count, 100)


def notes_of(part: stream.Stream) -> list:
    return [n for n in part.recurse().notes]


class Adversaries(unittest.TestCase):
    """One break per property, each read back from the file, each named by its fault."""

    def assertCaught(self, score: stream.Score, row: dict, words: str) -> None:
        found = faults(read_back(score, row["id"] + "-broken"), row)
        self.assertTrue(any(words in f for f in found), f"expected a fault naming {words!r}, got {found}")

    def test_a_bar_short_of_its_time_signature(self) -> None:
        # Broken after reading, not before writing: music21's writer re-bars a short bar it is
        # handed, so the break is made on the page as read.
        score, row = shipped(make_coordination("C", "hold"))
        page = read_back(score, row["id"])
        bar = page.parts[0].getElementsByClass(stream.Measure)[1]
        bar.remove(bar.notes[-1])
        self.assertTrue(any("holds 3.0 quarters under 4/4" in f for f in faults(page, row)))

    def test_a_note_spelled_outside_its_key(self) -> None:
        score, row = shipped(make_coordination("D", "hold"))
        third = notes_of(score.parts[0])[2]            # F-sharp in D major
        third.pitch = pitch.Pitch("G-4")                # the same key, the wrong letter
        self.assertCaught(score, row, "G-4 is not D major's own")

    def test_a_key_signature_other_than_the_rows(self) -> None:
        score, row = shipped(make_coordination("G", "hold"))
        self.assertCaught(score, {**row, "keySig": "F major"}, "key signature written with [1] sharps")

    def test_a_hand_sounding_that_the_row_says_is_silent(self) -> None:
        score, row = shipped(make_five_finger("C", "major", "both"))
        self.assertCaught(score, {**row, "hands": "right"}, "staff 2 sounds and the row says hands=right")

    def test_a_left_hand_that_holds_and_moves(self) -> None:
        score, row = shipped(make_coordination("C", "hold"))
        notes_of(score.parts[1])[1].pitch = pitch.Pitch("G3")
        self.assertCaught(score, row, "left hand 'holds' and plays")

    def test_a_left_hand_that_changes_and_repeats(self) -> None:
        score, row = shipped(make_coordination("F", "change"))
        notes_of(score.parts[1])[1].pitch = pitch.Pitch("F3")
        self.assertCaught(score, row, "left hand 'changes' and bar 2 repeats")

    def test_a_leap_in_the_five_finger_walk(self) -> None:
        score, row = shipped(make_coordination("C", "hold"))
        notes_of(score.parts[0])[2].pitch = pitch.Pitch("A4")   # D to A, a fifth
        self.assertCaught(score, row, "D4 to A4 is not a step")

    def test_a_right_hand_note_with_no_left_hand_under_it(self) -> None:
        from music21 import note as m21note
        score, row = shipped(make_coordination("C", "hold"))
        bar = score.parts[1].getElementsByClass(stream.Measure)[1]
        bar.replace(bar.notes[0], m21note.Rest(quarterLength=4.0))
        self.assertCaught(score, row, "right hand at 4.0: the left hand is not sounding")

    def test_hands_apart_where_the_pattern_has_them_an_octave_apart(self) -> None:
        score, row = shipped(make_five_finger("E-", "major", "both"))
        notes_of(score.parts[1])[3].pitch = pitch.Pitch("G3")
        self.assertCaught(score, row, "are not an octave apart together")

    def test_a_five_finger_pattern_that_skips(self) -> None:
        score, row = shipped(make_five_finger("A", "minor", "both"))
        for part, octave in zip(score.parts, (4, 3)):
            notes_of(part)[1].pitch = pitch.Pitch(f"C{octave}")
        self.assertCaught(score, row, "not five steps up and back")

    def test_an_ostinato_that_drifts_in_bar_six(self) -> None:
        score, row = shipped(make_ostinato("A", "fifths"))
        bar = score.parts[0].getElementsByClass(stream.Measure)[5]
        bar.notes[1].pitch = pitch.Pitch(bar.notes[1].pitch.nameWithOctave).transpose("M2")
        self.assertCaught(score, row, "right hand bar 6 is not the figure of bar 1")

    def test_an_ostinato_over_a_bass_that_moves(self) -> None:
        score, row = shipped(make_ostinato("D", "arpeggio"))
        bar = score.parts[1].getElementsByClass(stream.Measure)[3]
        bar.notes[0].transpose("P4", inPlace=True)
        self.assertCaught(score, row, "the bass moves")

    def test_a_rhythm_line_that_changes_pitch(self) -> None:
        score, row = shipped(make_rhythm("eighths"))
        notes_of(score.parts[0])[5].pitch = pitch.Pitch("D5")
        self.assertCaught(score, row, "not one pitch")

    def test_a_rhythm_whose_bars_differ(self) -> None:
        score, row = shipped(make_rhythm("quarter-eighths"))
        bar = score.parts[0].getElementsByClass(stream.Measure)[2]
        first, second = bar.notes[0], bar.notes[1]
        first.quarterLength, second.quarterLength = 0.5, 1.0
        self.assertCaught(score, row, "bar 3 is not bar 1's rhythm")

    def test_a_swung_half_that_is_not_the_straight_half(self) -> None:
        score, row = shipped(make_swing_pair("G"))
        bar = score.parts[0].getElementsByClass(stream.Measure)[7]
        bar.notes[0].pitch = pitch.Pitch(bar.notes[0].pitch.nameWithOctave).transpose("M2")
        self.assertCaught(score, row, "the second four bars are not the first four")

    def test_the_swing_mark_over_the_straight_half(self) -> None:
        score, row = shipped(make_swing_pair("C"))
        for mark in list(score.parts[0].recurse().getElementsByClass(expressions.TextExpression)):
            if "swing" in mark.content.lower():
                mark.activeSite.remove(mark)
        score.parts[0].getElementsByClass(stream.Measure)[1].insert(0, expressions.TextExpression("Swing"))
        self.assertCaught(score, row, "no swing direction at bar 6")


if __name__ == "__main__":
    unittest.main()
