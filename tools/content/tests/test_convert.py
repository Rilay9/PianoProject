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


class TestMidBarVoices(ConvertCase):
    """
    A `**kern` spine that splits mid-bar (docs/03 §3 step 2).

    music21's MusicXML writer backs every voice up to the barline, so a voice
    that starts on beat 3 is written on beat 1 and the file stops saying what
    the edition says. Four of the eight Joplin rags in content/sources/kern.json
    are shaped like this fixture, so the assertion is on where the notes land,
    not on whether the file merely parses.
    """

    def offsets_in_first_measure(self, dest: Path) -> dict[str, float]:
        from music21 import converter as m21converter

        score = m21converter.parse(str(dest))
        measure = score.parts[0].getElementsByClass("Measure")[0]
        return {
            pitch.nameWithOctave: round(float(n.getOffsetInHierarchy(measure)), 4)
            for n in measure.recurse().notes
            for pitch in n.pitches
        }

    def test_a_voice_that_starts_on_beat_three_still_starts_on_beat_three(self) -> None:
        result, _ = self.convert("mid-bar-voice.krn")
        offsets = self.offsets_in_first_measure(self.out / "mid-bar-voice.mxl")
        self.assertEqual(offsets["C5"], 0.0)
        self.assertEqual(offsets["E5"], 2.0)
        self.assertEqual(offsets["G5"], 2.0)
        self.assertTrue(any("mid-bar voice" in w for w in result.warnings), result.warnings)

    def test_the_padding_rest_is_not_printed(self) -> None:
        # The timing is stated with a rest the engraving never shows, so the
        # page looks like the edition it came from.
        _, written = self.convert("mid-bar-voice.krn")
        self.assertIn('print-object="no"', written.xml)

    def test_a_score_with_no_split_is_left_alone(self) -> None:
        result, _ = self.convert("two-spines.krn")
        self.assertEqual([w for w in result.warnings if "mid-bar voice" in w], [])


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


class TestTempoMarks(ConvertCase):
    def test_only_one_tempo_mark_survives(self) -> None:
        # music21's ABC reader puts a metronome mark in every voice and OSMD
        # draws all of them, so an authored tune showed its tempo twice.
        _, written = self.convert("two-voices.abc")
        self.assertEqual(written.xml.count("<metronome"), 1)
        self.assertEqual(len(written.tempos), 1)

    def test_a_kern_source_keeps_its_single_mark(self) -> None:
        _, written = self.convert("two-spines.krn")
        self.assertEqual(written.xml.count("<metronome"), 1)


class TestSilentStaff(ConvertCase):
    def test_a_hand_that_only_rests_keeps_its_staff(self) -> None:
        # A right-hand-only beginner tune is printed on a grand staff with an
        # empty bass staff, not squeezed onto one line.
        import tempfile

        abc = (
            "X:1\nT:Right hand only\nL:1/4\nM:4/4\nK:C\n"
            "V:1 clef=treble\nV:2 clef=bass\n"
            "[V:1] C D E F |]\n[V:2] z4 |]\n"
        )
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / "rh.abc"
            source.write_text(abc, encoding="utf-8")
            dest = self.out / "rh.mxl"
            convert_file(source, dest)
            written = read_mxl(dest)
        self.assertEqual(written.staves, 2)
        self.assertEqual(written.score_parts, 1)


class TestDeclaredClefs(ConvertCase):
    """
    `V:1 clef=treble` has to reach the printed staff.

    music21 10.5 parses the voice and then ignores the clef it declares: it
    runs its own best-clef guess over each part's range and gives every voice
    the same answer. A right-hand tune sitting low came back as two bass
    staves, a right-hand-only tune as two treble ones, and sixteen of the
    authored tunes were printed that way before this was caught.
    """

    def write_and_convert(self, abc: str):
        import tempfile

        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / "clefs.abc"
            source.write_text(abc, encoding="utf-8")
            dest = self.out / "clefs.mxl"
            convert_file(source, dest)
            return read_mxl(dest)

    def test_a_low_melody_still_gets_a_treble_staff(self) -> None:
        written = self.write_and_convert(
            "X:1\nT:Low melody\nL:1/4\nM:4/4\nK:C\n"
            "V:1 clef=treble\nV:2 clef=bass\n"
            "[V:1] C D E C |]\n[V:2] C,4 |]\n"
        )
        self.assertEqual(written.clef_of_staff(1), "G")
        self.assertEqual(written.clef_of_staff(2), "F")

    def test_a_silent_bass_staff_still_gets_a_bass_clef(self) -> None:
        written = self.write_and_convert(
            "X:1\nT:Right hand only\nL:1/4\nM:4/4\nK:C\n"
            "V:1 clef=treble\nV:2 clef=bass\n"
            "[V:1] c d e f |]\n[V:2] z4 |]\n"
        )
        self.assertEqual(written.clef_of_staff(1), "G")
        self.assertEqual(written.clef_of_staff(2), "F")
