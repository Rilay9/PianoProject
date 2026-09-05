"""
convert.py against a small sample of every input format (docs/03 §3 step 2).

The assertions are on the *written file* rather than on the music21 stream,
because the thing that has to be right is what OSMD is handed: one part, two
staves, treble on top, fingering and chord symbols intact.
"""
from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from convert import ConversionError, convert_file  # noqa: E402
from tests.mxlutil import read_mxl  # noqa: E402

FIXTURES = Path(__file__).resolve().parent / "fixtures"


class ConvertCase(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.out = Path(self._tmp.name)

    def tearDown(self) -> None:
        self._tmp.cleanup()

    def convert(self, name: str, **kwargs):
        dest = self.out / (Path(name).stem + ".mxl")
        result = convert_file(FIXTURES / name, dest, **kwargs)
        return result, read_mxl(dest)


class TestKern(ConvertCase):
    def test_two_spines_become_one_part_with_two_staves(self) -> None:
        result, written = self.convert("two-spines.krn")
        self.assertEqual(written.score_parts, 1)
        self.assertEqual(written.staves, 2)
        self.assertEqual(result.staves, 2)

    def test_treble_goes_on_the_top_staff(self) -> None:
        # Humdrum orders its spines low-to-high, so trusting the source order
        # would put the bass on staff 1 for every kern import.
        _, written = self.convert("two-spines.krn")
        self.assertEqual(written.clef_of_staff(1), "G")
        self.assertEqual(written.clef_of_staff(2), "F")

    def test_source_tempo_is_kept(self) -> None:
        result, written = self.convert("two-spines.krn")
        self.assertEqual(result.tempo_bpm, 72)
        self.assertFalse(result.added_tempo)
        self.assertIn(72.0, written.tempos)

    def test_metadata_comes_across(self) -> None:
        result, _ = self.convert("two-spines.krn")
        self.assertEqual(result.title, "Two spine test")
        self.assertIn("Test", result.composer or "")


class TestAbc(ConvertCase):
    def test_two_voices_become_two_staves(self) -> None:
        result, written = self.convert("two-voices.abc")
        self.assertEqual(written.score_parts, 1)
        self.assertEqual(written.staves, 2)
        self.assertEqual(result.measures, 2)

    def test_fingering_survives(self) -> None:
        # music21 parses `!1!` and then discards it, so abc_tools puts it back;
        # without that the authored fingering in docs/03 §5 would be lost.
        _, written = self.convert("two-voices.abc")
        self.assertEqual(written.fingerings, [1, 2, 3, 5])

    def test_chord_symbols_survive(self) -> None:
        _, written = self.convert("two-voices.abc")
        self.assertEqual(written.harmonies, 2)

    def test_tempo_from_the_q_header(self) -> None:
        result, _ = self.convert("two-voices.abc")
        self.assertEqual(result.tempo_bpm, 88)


class TestLilyPond(ConvertCase):
    def test_piano_staff_becomes_a_grand_staff(self) -> None:
        _, written = self.convert("simple.ly")
        self.assertEqual(written.score_parts, 1)
        self.assertEqual(written.staves, 2)

    def test_missing_tempo_gets_the_default(self) -> None:
        result, written = self.convert("simple.ly")
        self.assertTrue(result.added_tempo)
        self.assertEqual(result.tempo_bpm, 96)
        self.assertIn(96.0, written.tempos)


class TestMusicXml(ConvertCase):
    def test_two_parts_are_merged_into_one(self) -> None:
        _, written = self.convert("two-parts.musicxml")
        self.assertEqual(written.score_parts, 1)
        self.assertEqual(written.staves, 2)

    def test_the_bass_part_does_not_win_by_being_first(self) -> None:
        # The fixture deliberately lists the bass part first.
        _, written = self.convert("two-parts.musicxml")
        self.assertEqual(written.clef_of_staff(1), "G")
        self.assertEqual(written.clef_of_staff(2), "F")

    def test_lyrics_are_stripped_by_default(self) -> None:
        result, written = self.convert("two-parts.musicxml")
        self.assertEqual(written.lyrics, 0)
        self.assertEqual(result.stripped_lyrics, 8)

    def test_lyrics_are_kept_when_asked(self) -> None:
        result, written = self.convert("two-parts.musicxml", keep_lyrics=True)
        self.assertGreater(written.lyrics, 0)
        self.assertEqual(result.stripped_lyrics, 0)

    def test_more_than_two_parts_collapse_to_two_staves(self) -> None:
        result, written = self.convert("three-parts.musicxml")
        self.assertEqual(written.staves, 2)
        self.assertTrue(any("merged" in w for w in result.warnings), result.warnings)

    def test_a_forced_tempo_replaces_the_source_tempo(self) -> None:
        result, written = self.convert("two-spines.krn", tempo_bpm=60)
        self.assertEqual(result.tempo_bpm, 60)
        self.assertEqual(set(written.tempos), {60.0})

    def test_an_unsupported_format_is_refused(self) -> None:
        with self.assertRaises(ConversionError):
            convert_file(FIXTURES / "nope.txt", self.out / "nope.mxl")


if __name__ == "__main__":
    unittest.main()
