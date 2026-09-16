"""
A key signature Humdrum writes between two bars (docs/03 §3d).

music21's Humdrum parser hands back a `*k[...]` that stands between barline
records as a `KeySignature` in the *part*, outside every measure. The MusicXML
writer rescues loose attributes into the first measure and only the first, so
every later one was dropped without a word and the strain after it was engraved
in the key of the strain before it.

The fixture is kern text because the idiom is the fault: the record has to
stand between two barline records to come out loose, and a `*k` written after
the last note of a bar does not. What is asserted is a relation — every
signature the source prints reaches the page, at the instant the source puts
it — rather than a count of anything.
"""
from __future__ import annotations

import sys
import tempfile
import unittest
from fractions import Fraction
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from music21 import key, stream  # noqa: E402

from convert import convert_file, normalise, parse_source  # noqa: E402

REPO = Path(__file__).resolve().parents[3]

#: craigsapp's Joplin edition, if this working tree has it.
CLEOPHA = REPO / "content" / "scores" / "imported" / "kern" / "joplin" / "kern" / "cleopha.krn"

HEAD = "**kern\t**kern\n*staff2\t*staff1\n*clefF4\t*clefG2\n*k[]\t*k[]\n*M2/4\t*M2/4\n"
FOOT = "==\t==\n*-\t*-\n"

#: A strain change: the double barline, the new key at it, and the eighth left
#: over standing as the pickup into the strain — *Cleopha*'s bar 54 in little.
STRAIN_CHANGE = HEAD + (
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
) + FOOT

#: The same tune with one key signature, at the head where it belongs.
ONE_KEY = HEAD + (
    "=1\t=1\n"
    "4C\t4c\n"
    "4D\t4d\n"
    "=2\t=2\n"
    "4E\t4e\n"
    "4F\t4f\n"
) + FOOT


def signatures(score: stream.Score) -> set[tuple[Fraction, int]]:
    """Every key signature as (where it takes effect, how many sharps or flats)."""
    return {
        (
            Fraction(sig.getOffsetInHierarchy(score)).limit_denominator(3840),
            sig.sharps,
        )
        for sig in score.recurse().getElementsByClass(key.KeySignature)
    }


class LooseAttributeCase(unittest.TestCase):
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
        dest = self.out / (path.stem + ".mxl")
        convert_file(path, dest)
        return parse_source(path), parse_source(dest)


class TestAKeyChangeBetweenBars(LooseAttributeCase):
    def test_the_parser_leaves_it_outside_every_bar(self) -> None:
        # The fault, stated: this is what the writer would have thrown away.
        source = parse_source(self.source(STRAIN_CHANGE))
        staff = list(source.parts)[0]
        loose = [sig.sharps for sig in staff.getElementsByClass(key.KeySignature)]
        self.assertEqual(loose, [-1])

    def test_it_is_put_into_the_bar_it_falls_in(self) -> None:
        source = parse_source(self.source(STRAIN_CHANGE))
        out, result = normalise(source, keep_lyrics=False, tempo_bpm=None)
        for staff in out.parts:
            self.assertEqual(list(staff.getElementsByClass(key.KeySignature)), [])
            holders = [
                measure
                for measure in staff.getElementsByClass(stream.Measure)
                if measure.getElementsByClass(key.KeySignature)
            ]
            self.assertEqual(len(holders), 2)  # the opening one, and the change
        self.assertTrue(
            any("into the bar they fall in" in note for note in result.warnings), result.warnings
        )

    def test_the_new_strain_is_written_in_its_own_key(self) -> None:
        source, written = self.round_trip(self.source(STRAIN_CHANGE))
        self.assertEqual(signatures(written), signatures(source))

    def test_a_score_with_nothing_loose_is_left_alone(self) -> None:
        source = parse_source(self.source(ONE_KEY))
        _, result = normalise(source, keep_lyrics=False, tempo_bpm=None)
        self.assertEqual([w for w in result.warnings if "into the bar they fall in" in w], [])


@unittest.skipUnless(CLEOPHA.exists(), "craigsapp's Joplin edition is not in this tree")
class TestCleopha(LooseAttributeCase):
    """
    The rag it was found on. `*k[b-e-]` stands at the double bar in the middle
    of bar 54, and the second strain used to be engraved in the first strain's
    key — every B flat of it spelled out as an accidental instead.
    """

    def test_every_signature_the_edition_prints_reaches_the_page(self) -> None:
        source, written = self.round_trip(CLEOPHA)
        self.assertEqual(signatures(written), signatures(source))

    def test_the_second_strain_carries_two_flats(self) -> None:
        _, written = self.round_trip(CLEOPHA)
        staff = list(written.parts)[0]
        last = staff.getElementsByClass(stream.Measure).last()
        in_force = last.getContextByClass(key.KeySignature)
        self.assertIsNotNone(in_force)
        self.assertEqual(in_force.sharps, -2)


if __name__ == "__main__":
    unittest.main()
