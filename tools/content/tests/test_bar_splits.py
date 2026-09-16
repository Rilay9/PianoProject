"""
A bar the edition wrote short stays short (docs/03 §3d).

music21's MusicXML writer fills every measure out to its time signature before
it writes one, so a bar an edition wrote short came back with a rest on the end
and everything after it in the file was late by what was added. `**kern` writes
a change of strain exactly that way: a double barline inside the bar, the key
change at it, and the rest of the bar standing after it as the pickup into the
next strain.

The fixtures here are kern text rather than music21 scores, because the idiom
*is* the fault, and every length asserted against them is read off the fixture
printed above it. The two tests that read a real file assert only that the
source and the conversion agree with each other.
"""
from __future__ import annotations

import sys
import tempfile
import unittest
from collections import Counter
from fractions import Fraction
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from music21 import stream  # noqa: E402

from convert import convert_file, normalise, parse_source  # noqa: E402

REPO = Path(__file__).resolve().parents[3]

#: craigsapp's Joplin edition, if this working tree has it.
CLEOPHA = REPO / "content" / "scores" / "imported" / "kern" / "joplin" / "kern" / "cleopha.krn"

HEAD = "**kern\t**kern\n*staff2\t*staff1\n*clefF4\t*clefG2\n*k[]\t*k[]\n*M2/4\t*M2/4\n"
FOOT = "==\t==\n*-\t*-\n"

#: A full 2/4 bar, then a bar split by a double barline after three eighths:
#: the eighth left over is the pickup into the next strain and the key changes
#: at the double bar, exactly as bar 54 of *Cleopha* is written. Then two more
#: full bars.
SPLIT_BAR = HEAD + (
    "=1\t=1\n"
    "4C\t4c\n"
    "4D\t4d\n"
    "=2\t=2\n"
    "4E\t4e\n"
    "8F\t8f\n"
    "=||\t=||\n"
    "*k[b-]\t*k[b-]\n"
    "8G\t8g\n"
    "=3\t=3\n"
    "4A\t4a\n"
    "4B\t4b\n"
    "=4\t=4\n"
    "4c\t4cc\n"
    "4d\t4dd\n"
) + FOOT

#: The same double barline, but falling *on* a barline rather than inside a
#: bar: what stands between the two records is a seam, not a bar of silence.
SEAM_BAR = HEAD + (
    "=1\t=1\n"
    "4C\t4c\n"
    "4D\t4d\n"
    "=2\t=2\n"
    "4E\t4e\n"
    "4F\t4f\n"
    "=||\t=||\n"
    "*k[b-]\t*k[b-]\n"
    "=3\t=3\n"
    "4A\t4a\n"
    "4B\t4b\n"
) + FOOT

#: The same music opening on an anacrusis: one eighth before the first barline.
ANACRUSIS = HEAD + (
    "8C\t8c\n"
    "=1\t=1\n"
    "4D\t4d\n"
    "4E\t4e\n"
    "=2\t=2\n"
    "4F\t4f\n"
    "8G\t8g\n"
) + FOOT


def instants(score: stream.Score) -> Counter:
    """Every sounding note as (where it starts, which pitch), the score over."""
    from music21 import harmony

    bag: Counter = Counter()
    for element in score.recurse().notes:
        if isinstance(element, harmony.ChordSymbol):
            continue
        if element.tie is not None and element.tie.type in ("stop", "continue"):
            continue  # the continuation of a tie is not a second sounding note
        at = Fraction(element.getOffsetInHierarchy(score)).limit_denominator(3840)
        for pitch in element.pitches:
            bag[(at, pitch.midi)] += 1
    return bag


def bar_lengths(score: stream.Score) -> list[Fraction]:
    """What each bar of the top staff lasts, in quarters."""
    staff = list(score.parts)[0]
    return [
        Fraction(measure.duration.quarterLength).limit_denominator(3840)
        for measure in staff.getElementsByClass(stream.Measure)
    ]


class BarSplitCase(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.out = Path(self._tmp.name)

    def tearDown(self) -> None:
        self._tmp.cleanup()

    def source(self, kern: str) -> Path:
        path = self.out / "fixture.krn"
        path.write_text(kern, encoding="utf-8")
        return path

    def round_trip(self, path: Path) -> tuple[stream.Score, stream.Score]:
        """The source as parsed, and the conversion of it as parsed back."""
        dest = self.out / (path.stem + ".mxl")
        convert_file(path, dest)
        return parse_source(path), parse_source(dest)


class TestSplitBar(BarSplitCase):
    def test_the_split_bar_and_its_remainder_keep_their_lengths(self) -> None:
        source = parse_source(self.source(SPLIT_BAR))
        out, result = normalise(source, keep_lyrics=False, tempo_bpm=None)
        # A full bar, then a bar of three eighths, the eighth left over after
        # the double bar, then two more full bars.
        self.assertEqual(
            bar_lengths(out),
            [Fraction(2), Fraction(3, 2), Fraction(1, 2), Fraction(2), Fraction(2)],
        )
        self.assertTrue(
            any("shorter than the time signature" in note for note in result.warnings),
            result.warnings,
        )

    def test_the_conversion_starts_every_note_where_the_source_does(self) -> None:
        source, written = self.round_trip(self.source(SPLIT_BAR))
        self.assertEqual(instants(written), instants(source))

    def test_the_bars_after_the_split_are_not_filled_out(self) -> None:
        # The fault this covers: filled out, the two halves of the split bar
        # become two whole bars and everything after them is a bar late.
        _, written = self.round_trip(self.source(SPLIT_BAR))
        self.assertEqual(
            bar_lengths(written),
            [Fraction(2), Fraction(3, 2), Fraction(1, 2), Fraction(2), Fraction(2)],
        )

    def test_the_double_barline_survives(self) -> None:
        _, written = self.round_trip(self.source(SPLIT_BAR))
        styles = [
            measure.rightBarline.type
            for measure in list(written.parts)[0].getElementsByClass(stream.Measure)
            if measure.rightBarline is not None
        ]
        self.assertIn("double", styles)


class TestSeamBar(BarSplitCase):
    def test_the_seam_is_not_a_bar(self) -> None:
        source = parse_source(self.source(SEAM_BAR))
        # The parser makes a measure of what stands between the two barline
        # records, holding nothing at all.
        self.assertIn(Fraction(0), bar_lengths(source))
        out, result = normalise(source, keep_lyrics=False, tempo_bpm=None)
        self.assertEqual(bar_lengths(out), [Fraction(2), Fraction(2), Fraction(2)])
        self.assertTrue(
            any("nothing but a barline" in note for note in result.warnings), result.warnings
        )

    def test_the_seam_does_not_become_a_bar_of_silence(self) -> None:
        source, written = self.round_trip(self.source(SEAM_BAR))
        self.assertEqual(instants(written), instants(source))
        self.assertEqual(bar_lengths(written), [Fraction(2), Fraction(2), Fraction(2)])

    def test_the_barline_the_seam_was_made_of_survives(self) -> None:
        # Dropping the measure must not drop the double bar that made it: the
        # strain change is still drawn, on the bar it ends.
        _, written = self.round_trip(self.source(SEAM_BAR))
        styles = [
            measure.rightBarline.type
            for measure in list(written.parts)[0].getElementsByClass(stream.Measure)
            if measure.rightBarline is not None
        ]
        self.assertIn("double", styles)


class TestAnacrusis(BarSplitCase):
    def test_a_pickup_is_still_a_pickup(self) -> None:
        source, written = self.round_trip(self.source(ANACRUSIS))
        # One eighth before the first barline, and it stays one eighth.
        self.assertEqual(bar_lengths(source)[0], Fraction(1, 2))
        self.assertEqual(bar_lengths(written)[0], Fraction(1, 2))

    def test_a_pickup_piece_keeps_its_instants(self) -> None:
        source, written = self.round_trip(self.source(ANACRUSIS))
        self.assertEqual(instants(written), instants(source))


@unittest.skipUnless(CLEOPHA.exists(), "craigsapp's Joplin edition is not in this tree")
class TestCleopha(BarSplitCase):
    """
    The rag the fault was found on. Bar 54 is written

        4F FF / 8FF FFF / =|| / *k[b-e-] / 8r 8f / =55!|:

    and its second strain used to begin a bar late, behind silence Joplin did
    not write.
    """

    def test_a_real_split_bar_keeps_every_instant(self) -> None:
        source, written = self.round_trip(CLEOPHA)
        moved = instants(source) - instants(written)
        self.assertEqual(sum(moved.values()), 0, f"{len(moved)} instants moved, e.g. {list(moved)[:3]}")

    def test_the_rag_is_as_long_as_its_source(self) -> None:
        source, written = self.round_trip(CLEOPHA)
        self.assertEqual(
            Fraction(written.highestTime).limit_denominator(3840),
            Fraction(source.highestTime).limit_denominator(3840),
        )


if __name__ == "__main__":
    unittest.main()
