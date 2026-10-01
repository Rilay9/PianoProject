"""
convert.py against a small sample of every input format (docs/03 §3 step 2).

The assertions are on the *written file* rather than on the music21 stream,
because the thing that has to be right is what OSMD is handed: one part, two
staves, treble on top, fingering and chord symbols intact.
"""
from __future__ import annotations

import re
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from music21 import meter, note, stream  # noqa: E402

from convert import ConversionError, convert_file, merge_part_into, prepare_kern  # noqa: E402
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
        # E59: the default is playback truth only, a `<sound tempo>`, never a printed metronome mark the edition
        # does not state.
        self.assertEqual(written.xml.count("<metronome"), 0)


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


def kern_with_marks(bars: list[tuple[str | None, str | None]], *, time: tuple[int, int] = (4, 4)) -> str:
    """
    A grand-staff kern file (E57), one bar per entry: each bar opens with the `*MM` records given for the bass and
    the treble spine (None writes a null interpretation), then one note filling the bar in each spine. Kern repeats a
    tempo in every spine, so `("*MM48", "*MM48")` is one statement arriving twice at one position.
    """
    beats, beat_type = time
    note = {(4, 4): "1", (3, 4): "2."}[time]
    lines = ["!!!OTL: E57 tempo marks", "**kern\t**kern", "*staff2\t*staff1", "*clefF4\t*clefG2", "*k[]\t*k[]",
             f"*M{beats}/{beat_type}\t*M{beats}/{beat_type}"]
    for number, (bass, treble) in enumerate(bars, start=1):
        if bass or treble:
            lines.append(f"{bass or '*'}\t{treble or '*'}")
        lines += [f"{note}C\t{note}c", f"={number}\t={number}"]
    return "\n".join(lines + ["*-\t*-"]) + "\n"


PRINTED = ('<direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit>'
           '<per-minute>{0}</per-minute></metronome></direction-type><sound tempo="{0}"/></direction>')
SOUND_ONLY = '<direction><sound tempo="{0}"/></direction>'
#: A mark with no readable per-minute: music21 gives a `MetronomeMark` whose `getQuarterBPM()` is None.
NO_TEMPO = ('<direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit>'
            '<per-minute>c. 100</per-minute></metronome></direction-type></direction>')


def directions_score(*directions: str) -> str:
    """A two-bar, one-staff MusicXML file (E57) whose bar 1 opens with `directions`, all at its first beat."""
    bars = []
    for number in (1, 2):
        attributes = ("<attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats>"
                      "<beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>") if number == 1 else ""
        opening = "".join(directions) if number == 1 else ""
        bars.append(f'<measure number="{number}">{attributes}{opening}<note><pitch><step>C</step><octave>5</octave></pitch>'
                    '<duration>4</duration><voice>1</voice><type>whole</type></note></measure>')
    return ('<?xml version="1.0" encoding="UTF-8"?>\n<score-partwise version="3.1"><part-list>'
            '<score-part id="P1"><part-name>Piano</part-name></score-part></part-list>'
            f'<part id="P1">{"".join(bars)}</part></score-partwise>\n')


class TestALaterTempoMarkSurvives(ConvertCase):
    """
    E57: `normalise` removed every metronome mark after the first it found, wherever it stood, so a kern score's later
    `*MM` (Chopin's Rondo op. 16, the Waltz op. 70 no. 1, Joplin's *Combination March*) played the opening tempo
    throughout. Now only a copy of one statement goes — the same position in the score and the same quarter-note tempo
    within X42's `SERIALIZATION_TOLERANCE` — and of a statement's copies a printed mark is kept over a sound-only one.
    `TestTempoMarks` above holds the copies that still collapse to one (the ABC voices, the kern spines). The
    three shapes, the conflicts and the printed-over-sound case are red on the committed converter; the printed-first
    case is green before and after, by design.
    """

    def convert_text(self, text: str, suffix: str, name: str = "marks"):
        src = self.out / f"{name}{suffix}"
        src.write_text(text, encoding="utf-8")
        dest = self.out / f"{name}.mxl"
        result = convert_file(src, dest)
        return result, read_mxl(dest)

    def tempo_by_bar(self, written) -> list[tuple[str, float]]:
        """Every `<sound tempo>` with the bar it stands in, in the file's order."""
        import re

        out = []
        for number, body in re.findall(r'<measure\b[^>]*\bnumber="([^"]+)"[^>]*>(.*?)</measure>', written.xml, re.S):
            out += [(number, float(value)) for value in re.findall(r'<sound tempo="([0-9.]+)"', body)]
        return out

    def per_minute(self, written) -> list[str]:
        import re

        return re.findall(r"<per-minute>([^<]*)</per-minute>", written.xml)

    # --- (b) two distinct positions survive: the three kern rows' shapes -----------------------------------

    def test_b_the_rondo_shape_keeps_its_two_later_changes(self) -> None:
        # Op. 16: *MM48 (Andante), *MM152 (Piu mosso), *MM96 (Allo. vivace), each in both spines.
        result, written = self.convert_text(kern_with_marks([("*MM48", "*MM48"), ("*MM152", "*MM152"), ("*MM96", "*MM96")]), ".krn")
        self.assertEqual(self.tempo_by_bar(written), [("1", 48.0), ("2", 152.0), ("3", 96.0)])
        self.assertEqual(written.xml.count("<metronome"), 3)
        self.assertEqual((result.tempo_bpm, result.added_tempo), (48.0, False))

    def test_b_the_waltz_shape_keeps_a_return_to_the_first_tempo(self) -> None:
        # Op. 70 no. 1: *MM264, *MM96 (Meno mosso), *MM264 (tempo I): the same number at two places is two statements.
        _, written = self.convert_text(kern_with_marks([("*MM264", "*MM264"), ("*MM96", "*MM96"), ("*MM264", "*MM264")], time=(3, 4)), ".krn")
        self.assertEqual(self.tempo_by_bar(written), [("1", 264.0), ("2", 96.0), ("3", 264.0)])

    def test_b_the_march_shape_reaches_its_tempo_di_marcia(self) -> None:
        # Combination March: *MM100 (Andante), *MM120 (Tempo di Marcia).
        _, written = self.convert_text(kern_with_marks([("*MM100", "*MM100"), ("*MM120", "*MM120")]), ".krn")
        self.assertEqual(self.tempo_by_bar(written), [("1", 100.0), ("2", 120.0)])

    # --- (c) the same position, a different tempo: a conflict, kept for the reader ----------------------------

    def test_c_a_different_tempo_in_the_other_spine_at_one_place_survives(self) -> None:
        _, written = self.convert_text(kern_with_marks([("*MM100", "*MM120"), (None, None)]), ".krn")
        self.assertEqual(sorted(self.tempo_by_bar(written)), [("1", 100.0), ("1", 120.0)])
        self.assertEqual(written.xml.count("<metronome"), 2)

    def test_c_a_different_tempo_on_one_staff_at_one_place_survives(self) -> None:
        _, written = self.convert_text(directions_score(PRINTED.format(100), PRINTED.format(120)), ".musicxml")
        self.assertEqual(sorted(self.tempo_by_bar(written)), [("1", 100.0), ("1", 120.0)])
        self.assertEqual(sorted(self.per_minute(written)), ["100", "120"])

    # --- (d) one statement, printed and sound-only: the printed mark stays; the tolerance; a mark with no tempo ---

    def test_d_a_sound_only_copy_gives_way_to_the_printed_mark(self) -> None:
        # Satie's shape (X42): MuseScore's 76.0002 beside the printed 76, here with the sound first.
        _, written = self.convert_text(directions_score(SOUND_ONLY.format("76.0002"), PRINTED.format(76)), ".musicxml")
        self.assertEqual(self.per_minute(written), ["76"])
        self.assertEqual(self.tempo_by_bar(written), [("1", 76.0)])

    def test_d_the_printed_mark_first_is_kept_as_before(self) -> None:
        _, written = self.convert_text(directions_score(PRINTED.format(76), SOUND_ONLY.format("76.0002")), ".musicxml")
        self.assertEqual(self.per_minute(written), ["76"])
        self.assertEqual(self.tempo_by_bar(written), [("1", 76.0)])

    def test_d_a_tempo_beyond_the_tolerance_is_another_statement(self) -> None:
        # 68.1 beside a printed 68: the nearest non-noise difference X42 found in any file here.
        _, written = self.convert_text(directions_score(PRINTED.format(68), SOUND_ONLY.format("68.1")), ".musicxml")
        self.assertEqual(sorted(self.tempo_by_bar(written)), [("1", 68.0), ("1", 68.1)])

    def test_d_a_mark_with_no_tempo_is_never_a_duplicate(self) -> None:
        # Beside a printed 100, and beside another like it: neither `c. 100` mark is anyone's copy. (music21 writes
        # such a mark as an empty `<words/>` direction whether or not it is kept, so the stream is what is read.)
        from music21 import converter, tempo

        import convert

        for number, directions in enumerate(((PRINTED.format(100), NO_TEMPO), (NO_TEMPO, PRINTED.format(100)), (NO_TEMPO, NO_TEMPO))):
            src = self.out / f"no-tempo-{number}.musicxml"
            src.write_text(directions_score(*directions), encoding="utf-8")
            score = converter.parse(src)
            marks = list(score.recurse().getElementsByClass(tempo.MetronomeMark))
            self.assertEqual(len(marks), 2)
            self.assertEqual(convert.duplicate_tempo_marks(score, marks), [], directions)

    def test_the_tolerance_is_x42s(self) -> None:
        # One value, stated in the app's reader and in the converter: the two must never drift apart.
        import re

        import convert

        reader = (Path(__file__).resolve().parents[3] / "app/src/score/tempoFromXml.ts").read_text(encoding="utf-8")
        stated = re.search(r"export const SERIALIZATION_TOLERANCE = ([0-9.]+);", reader)
        self.assertIsNotNone(stated)
        self.assertEqual(convert.SERIALIZATION_TOLERANCE, float(stated.group(1)))  # type: ignore[union-attr]


def text_mark_score(words: str | None, *, time: tuple[int, int] = (4, 4), mark_bar: int = 1,
                    bar_one_rests: bool = False, metronome: int | None = None) -> str:
    """
    A three-bar grand-staff MusicXML file (E50) whose `mark_bar` prints `words` as a `<words>` direction before
    its first note, as MuseScore 3.6.2 exported the seven bundled PDMX scores (*Wabash Blues*: a boxed
    `= 120` in MuseJazz, the note glyph dropped), with no tempo anywhere unless `metronome` adds a
    `<metronome>` of the file's own. Bar 1 holds rests only where `bar_one_rests` says so.
    """
    beats, beat_type = time
    divisions = 2
    length = beats * divisions * 4 // beat_type
    kind = {8: "whole", 6: "half", 4: "half", 12: "whole"}.get(length, "whole")
    dot = "<dot/>" if length == 6 else ""
    direction = ""
    if words is not None:
        direction += ('<direction placement="above"><direction-type><words enclosure="rectangle" '
                      f'font-family="MuseJazz" font-style="italic">{words}</words></direction-type></direction>')
    measures = []
    for number in (1, 2, 3):
        attributes = ""
        if number == 1:
            attributes = (f"<attributes><divisions>{divisions}</divisions><key><fifths>0</fifths></key>"
                          f"<time><beats>{beats}</beats><beat-type>{beat_type}</beat-type></time><staves>2</staves>"
                          '<clef number="1"><sign>G</sign><line>2</line></clef><clef number="2"><sign>F</sign><line>4</line></clef></attributes>')
        own = ""
        if metronome is not None and number == 1:
            own = ('<direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit>'
                   f'<per-minute>{metronome}</per-minute></metronome></direction-type><sound tempo="{metronome}"/></direction>')
        printed = direction if number == mark_bar else ""
        if number == 1 and bar_one_rests:
            body = (f'<note><rest measure="yes"/><duration>{length}</duration><voice>1</voice><staff>1</staff></note>'
                    f"<backup><duration>{length}</duration></backup>"
                    f'<note><rest measure="yes"/><duration>{length}</duration><voice>5</voice><staff>2</staff></note>')
        else:
            body = (f"<note><pitch><step>C</step><octave>5</octave></pitch><duration>{length}</duration><voice>1</voice>"
                    f"<type>{kind}</type>{dot}<staff>1</staff></note>"
                    f"<backup><duration>{length}</duration></backup>"
                    f"<note><pitch><step>C</step><octave>3</octave></pitch><duration>{length}</duration><voice>5</voice>"
                    f"<type>{kind}</type>{dot}<staff>2</staff></note>")
        measures.append(f'<measure number="{number}">{attributes}{own}{printed}{body}</measure>')
    return ('<?xml version="1.0" encoding="UTF-8"?>\n<score-partwise version="3.1"><part-list>'
            '<score-part id="P1"><part-name>Piano</part-name></score-part></part-list>'
            f'<part id="P1">{"".join(measures)}</part></score-partwise>\n')


class TestTheTempoPrintedAsText(ConvertCase):
    """
    E50: an opening metronome mark printed only as text is read before the default is inserted (E32's rule,
    the import door's `textTempoOf`, `app/src/data/importStore.ts`, ported to `convert.py`). The seven bundled
    PDMX scores print `= N` over bar 1 as `<words>`, the note glyph dropped by MuseScore's export; music21
    hands the converter a `TextExpression` and no `MetronomeMark`, so the converter inserted 96. The mark now
    becomes the score's `<metronome>`, its note the glyph's or, where the glyph is missing, the metre's beat in
    x/4 or x/2, and the words go. (a), (b) and (c) are red on the committed converter; (d) and (e) hold
    today's path and are green before and after, by design. Since E59 (d)'s default is a `<sound tempo>` alone,
    no printed mark (`assert_today`).
    """

    def convert_text(self, xml: str, name: str = "text-mark", **kwargs):
        src = self.out / f"{name}.musicxml"
        src.write_text(xml, encoding="utf-8")
        dest = self.out / f"{name}.mxl"
        result = convert_file(src, dest, **kwargs)
        return result, read_mxl(dest)

    def printed_words(self, written) -> list[str]:
        import re

        return [text.strip() for text in re.findall(r"<words\b[^>]*>([^<]*)</words>", written.xml)]

    def metronome(self, written) -> tuple[str, bool, str] | None:
        import re

        found = re.findall(r"<metronome\b[^>]*>\s*<beat-unit>([^<]*)</beat-unit>\s*(<beat-unit-dot\s*/>)?\s*<per-minute>([^<]*)</per-minute>", written.xml)
        self.assertLessEqual(len(found), 1, found)
        return (found[0][0], bool(found[0][1]), found[0][2]) if found else None

    # --- (a) the Wabash shape ------------------------------------------------------------------------

    def test_a_the_wabash_shape_reads_as_a_quarter_the_metres_beat(self) -> None:
        result, written = self.convert_text(text_mark_score(" = 120"))
        self.assertEqual((result.tempo_bpm, result.added_tempo), (120.0, False))
        self.assertEqual(written.xml.count("<metronome"), 1)
        self.assertEqual(self.metronome(written), ("quarter", False, "120"))
        self.assertIn('<sound tempo="120"', written.xml)
        self.assertEqual(written.tempos, [120.0])
        self.assertNotIn("= 120", self.printed_words(written))
        said = [w for w in result.warnings if "= 120" in w]
        self.assertEqual(len(said), 1, result.warnings)
        self.assertIn("read as a quarter (the metre's beat)", said[0])
        self.assertFalse(any("no tempo in source" in w for w in result.warnings), result.warnings)

    # --- (b) a glyph given: the door's four numbers (importMeasuredTruth.test.ts) ------------------------

    def test_b_a_quarter_glyph(self) -> None:
        result, written = self.convert_text(text_mark_score(" = 132"))
        self.assertEqual((result.tempo_bpm, result.added_tempo), (132.0, False))
        self.assertEqual(self.metronome(written), ("quarter", False, "132"))
        self.assertEqual(written.tempos, [132.0])
        self.assertEqual([w for w in self.printed_words(written) if "=" in w], [])
        self.assertFalse(any("the metre's beat" in w for w in result.warnings), result.warnings)

    def test_b_an_eighth_glyph_sounds_at_half_its_number(self) -> None:
        # music21 writes the eighth with its per-minute number and a `<sound tempo>` in quarters (60),
        # which `tempoFromXml` lets win: the player plays 60 quarters a minute, as the mark means.
        result, written = self.convert_text(text_mark_score(" = 120"))
        self.assertEqual((result.tempo_bpm, result.added_tempo), (60.0, False))
        self.assertEqual(self.metronome(written), ("eighth", False, "120"))
        self.assertEqual(written.tempos, [60.0])

    def test_b_a_dotted_quarter_glyph(self) -> None:
        result, written = self.convert_text(text_mark_score(" = 80"))
        self.assertEqual((result.tempo_bpm, result.added_tempo), (120.0, False))
        self.assertEqual(self.metronome(written), ("quarter", True, "80"))
        self.assertEqual(written.tempos, [120.0])

    def test_b_no_glyph_in_cut_time_reads_as_a_half(self) -> None:
        result, written = self.convert_text(text_mark_score("= 60", time=(2, 2)))
        self.assertEqual((result.tempo_bpm, result.added_tempo), (120.0, False))
        self.assertEqual(self.metronome(written), ("half", False, "60"))
        self.assertEqual(written.tempos, [120.0])
        self.assertTrue(any("read as a half (the metre's beat)" in w for w in result.warnings), result.warnings)

    # --- (c) after rests only: X31a's opening rule ----------------------------------------------------

    def test_c_a_mark_after_a_bar_of_rests_opens_the_piece(self) -> None:
        result, written = self.convert_text(text_mark_score("= 120", mark_bar=2, bar_one_rests=True))
        self.assertEqual((result.tempo_bpm, result.added_tempo), (120.0, False))
        self.assertEqual(self.metronome(written), ("quarter", False, "120"))
        self.assertEqual(written.tempos, [120.0])
        self.assertNotIn("= 120", self.printed_words(written))

    # --- (d) not read: today's path, the default and the words kept -------------------------------------

    def assert_today(self, xml: str, words: str) -> None:
        result, written = self.convert_text(xml)
        self.assertEqual((result.tempo_bpm, result.added_tempo), (96.0, True))
        self.assertEqual(written.tempos, [96.0])
        # Revised by E59 (Entry 184): this asserted a printed quarter = 96, the converter's default written as
        # though the edition stated it. The default is now playback truth only, its `<sound tempo>`, and nothing
        # is printed (`TestADefaultedTempoIsPlaybackOnly`).
        self.assertIsNone(self.metronome(written))
        self.assertIn(words, self.printed_words(written))

    def test_d_a_missing_glyph_in_a_compound_metre_is_not_read(self) -> None:
        self.assert_today(text_mark_score("= 120", time=(6, 8)), "= 120")

    def test_d_a_tempo_word_is_not_a_mark(self) -> None:
        self.assert_today(text_mark_score("Allegro"), "Allegro")

    def test_d_text_that_is_not_a_mark_alone(self) -> None:
        self.assert_today(text_mark_score("bars 1 = 12"), "bars 1 = 12")

    def test_d_a_mark_after_a_note_has_sounded_is_a_later_change_and_not_read(self) -> None:
        self.assert_today(text_mark_score("= 140", mark_bar=2), "= 140")

    def test_the_warnings_name_a_later_mark_as_not_read(self) -> None:
        # New with the reader (red on the committed converter): the mark it leaves is said, with its bar.
        result, _ = self.convert_text(text_mark_score("= 140", mark_bar=2))
        said = [w for w in result.warnings if "= 140" in w]
        self.assertEqual(len(said), 1, result.warnings)
        self.assertIn("not read", said[0])
        self.assertIn("bar 2", said[0])

    def test_d_a_file_with_a_metronome_of_its_own_keeps_it_and_the_words(self) -> None:
        result, written = self.convert_text(text_mark_score("= 120", metronome=100))
        self.assertEqual((result.tempo_bpm, result.added_tempo), (100.0, False))
        self.assertEqual(written.tempos, [100.0])
        self.assertEqual(self.metronome(written), ("quarter", False, "100"))
        self.assertIn("= 120", self.printed_words(written))

    # --- (e) a forced tempo still replaces every tempo -------------------------------------------------

    def test_e_a_forced_tempo_replaces_the_printed_one(self) -> None:
        result, written = self.convert_text(text_mark_score(" = 120"), tempo_bpm=60)
        self.assertEqual((result.tempo_bpm, result.added_tempo), (60.0, True))
        self.assertEqual(set(written.tempos), {60.0})


def pdmx_shaped_score(staves: int) -> str:
    """
    A MuseScore-style upload with no tempo of its own (E59): one part, two bars of 4/4, on one staff or on a grand staff
    (`<staves>2</staves>`, a clef and a note per staff), no `<metronome>`, no `<sound tempo>`, no tempo words: the shape
    of PDMX's 169 rows tagged `tempoDefaulted`, single-staff and grand-staff.
    """
    clefs = ('<clef number="1"><sign>G</sign><line>2</line></clef><clef number="2"><sign>F</sign><line>4</line></clef>'
             if staves == 2 else "<clef><sign>G</sign><line>2</line></clef>")
    measures = []
    for number in (1, 2):
        attributes = (f"<attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats>"
                      f"<beat-type>4</beat-type></time>{'<staves>2</staves>' if staves == 2 else ''}{clefs}</attributes>"
                      if number == 1 else "")
        upper = ('<note><pitch><step>C</step><octave>5</octave></pitch><duration>4</duration><voice>1</voice>'
                 f"<type>whole</type>{'<staff>1</staff>' if staves == 2 else ''}</note>")
        lower = ('<backup><duration>4</duration></backup><note><pitch><step>C</step><octave>3</octave></pitch>'
                 '<duration>4</duration><voice>5</voice><type>whole</type><staff>2</staff></note>') if staves == 2 else ""
        measures.append(f'<measure number="{number}">{attributes}{upper}{lower}</measure>')
    return ('<?xml version="1.0" encoding="UTF-8"?>\n<score-partwise version="3.1"><part-list>'
            '<score-part id="P1"><part-name>Piano</part-name></score-part></part-list>'
            f'<part id="P1">{"".join(measures)}</part></score-partwise>\n')


#: The default as the converter now writes it (E59): a sound-only direction, music21's own form for a
#: `MetronomeMark` with only `numberSounding` (an empty `<words />`, then the sound), with the `<staff>` music21 adds
#: on a grand staff. PDMX's committed defaulted files carry exactly this block with the four metronome lines where
#: `<words />` stands.
SOUND_ONLY_DEFAULT = re.compile(
    r'(?P<i>[ ]*)<direction>\n(?P=i)  <direction-type>\n(?P=i)    <words />\n(?P=i)  </direction-type>\n'
    r'(?:(?P=i)  <staff>(?P<staff>\d+)</staff>\n)?(?P=i)  <sound tempo="96" />\n(?P=i)</direction>\n'
)


class TestADefaultedTempoIsPlaybackOnly(ConvertCase):
    """
    E59: where a source states no tempo (no metronome mark, no override, none printed as text), the converter
    supplies 96 so the player has a tempo, and wrote it as `MetronomeMark(number=96)`, which music21 exports as a
    printed `<metronome>` quarter = 96 beside the `<sound tempo="96">`: a number the edition never states, written as
    though it did. The default is now `numberSounding=96` (music21's own field for a tempo that sounds and is not
    printed): the same `<sound tempo>`, the same `tempo_bpm` and `added_tempo`, and no `<metronome>`. Red on the
    committed converter, green after; a real mark (`test_d_a_file_with_a_metronome_of_its_own_keeps_it_and_the_words`)
    and a forced tempo (`test_e_…`) are other branches and print as before.
    """

    def convert_xml(self, xml: str, name: str, **kwargs):
        src = self.out / f"{name}.musicxml"
        src.write_text(xml, encoding="utf-8")
        dest = self.out / f"{name}.mxl"
        return convert_file(src, dest, **kwargs), read_mxl(dest), dest

    def assert_sound_only_default(self, result, written, staff: str | None) -> None:
        self.assertEqual((result.tempo_bpm, result.added_tempo), (96.0, True))
        self.assertTrue(any("no tempo in source" in w for w in result.warnings), result.warnings)
        self.assertEqual(written.tempos, [96.0])
        self.assertEqual(written.xml.count("<metronome"), 0)
        found = list(SOUND_ONLY_DEFAULT.finditer(written.xml))
        self.assertEqual(len(found), 1, written.xml[:2000])
        self.assertEqual(found[0].group("staff"), staff)

    def test_a_single_staff_upload_gets_a_sound_and_no_printed_mark(self) -> None:
        # PDMX's first shape (74 of the 169 rows): one staff, no `<staff>` in the direction.
        result, written, _ = self.convert_xml(pdmx_shaped_score(1), "one-staff")
        self.assertEqual(written.staves, 1)
        self.assert_sound_only_default(result, written, None)

    def test_a_grand_staff_upload_gets_a_sound_and_no_printed_mark(self) -> None:
        # PDMX's second shape (95 of the 169 rows): a grand staff, the direction on staff 1.
        result, written, _ = self.convert_xml(pdmx_shaped_score(2), "grand-staff")
        self.assertEqual(written.staves, 2)
        self.assert_sound_only_default(result, written, "1")

    def test_a_converted_default_converted_again_stays_sound_only(self) -> None:
        # A cut's second pass through `normalise` (`excerpts.py`), and any re-conversion of a built file: the
        # sound-only mark is read back as the file's tempo and written as it was, never printed and never doubled.
        _, _, first = self.convert_xml(pdmx_shaped_score(2), "first")
        again = self.out / "again.mxl"
        result = convert_file(first, again)
        written = read_mxl(again)
        self.assertEqual(result.tempo_bpm, 96.0)
        self.assertEqual(written.tempos, [96.0])
        self.assertEqual(written.xml.count("<metronome"), 0)
        self.assertEqual(len(SOUND_ONLY_DEFAULT.findall(written.xml)), 1)


class TestSilentStaff(ConvertCase):
    def test_a_hand_that_only_rests_loses_its_staff(self) -> None:
        # It used to keep it: a right-hand-only beginner tune was printed on a
        # grand staff with an empty bass staff, so the page looked like a piano
        # piece. On the phone that staff took half of every window for nothing,
        # and the tune was engraved at half the size it could have been, so the
        # pipeline leaves it out (`docs/08` 3.2, `drop_silent_staves`).
        #
        # `test_silent_staff.py` covers the function; this covers a whole
        # conversion, which is where the staff count is actually written.
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
        self.assertEqual(written.staves, 1)
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

    def test_a_high_tune_over_a_sounding_bass_still_gets_a_bass_clef(self) -> None:
        # The bass voice holds a note rather than resting. It used to rest, and
        # the point was the clef on a staff nobody plays -- but such a staff is
        # dropped now (`drop_silent_staves`), and a test of clef *guessing*
        # should not turn on whether the staff survives. A tune this high is
        # what made music21 guess two treble staves, which is the bug here.
        written = self.write_and_convert(
            "X:1\nT:Right hand over a held bass\nL:1/4\nM:4/4\nK:C\n"
            "V:1 clef=treble\nV:2 clef=bass\n"
            "[V:1] c d e f |]\n[V:2] C,4 |]\n"
        )
        self.assertEqual(written.clef_of_staff(1), "G")
        self.assertEqual(written.clef_of_staff(2), "F")


class TestShadowedKeySignature(ConvertCase):
    """
    Humdrum's `*kcancel`, and the key signature it hid.

    `*kcancel` asks an engraver to print the naturals that cancel the *previous*
    signature. music21 reads it as a key signature of its own — C major — and
    inserts it at offset 0, in front of the `*k[...]` record on the next line.
    Two key signatures at one instant, and the MusicXML writer emits the first,
    so the score is engraved with no key signature at all and every accidental
    of the home key is printed inline for the whole piece.

    Three scores in the built catalogue read that way, and they are not
    obscure: Chopin's Ballade no. 3 — which is on the Stage 9 classical rung —
    his Scherzo no. 4, and a movement of the B minor sonata. Ballade no. 3 is
    in A flat and printed 1,840 accidentals; the source, `047-1-BH.krn` line
    17, is `*k[b-e-a-d-]` and was right all along.

    The fixture is that header, down to the `*kcancel`, because a simpler kern
    file does not reproduce it: without the cancel record music21 writes one
    key signature and the test passes while proving nothing.
    """

    def test_the_real_signature_reaches_the_page(self) -> None:
        result, written = self.convert("shadowed-key.krn")
        self.assertEqual(
            written.fifths, [-4],
            "the A flat signature was shadowed by the cancel that precedes it",
        )
        self.assertTrue(
            any("key signature" in note for note in result.warnings),
            f"the conversion did not report removing one: {result.warnings}",
        )

    def test_a_cancel_after_the_signature_does_not_replace_it_either(self) -> None:
        # The record can sit on either side of the one it refers to — before it
        # in `047-1-BH.krn` and after it in `015-1a-BH-001.krn` — so a rule of
        # "keep the first" and a rule of "keep the last" are each right about
        # half the corpus, and the first attempt at this fix broke eight scores
        # in the other direction while mending three. Neutralising the record
        # is what makes the ordering stop mattering.
        _, written = self.convert("cancel-after-key.krn")
        self.assertEqual(
            written.fifths, [-1],
            "a cancel record after the signature wiped it out",
        )

    def test_the_edition_keeps_its_own_signature(self) -> None:
        # The half of this that is easy to get wrong. `key.Key` is a subclass
        # of `key.KeySignature`, and Humdrum's two records are different
        # claims: `*k[...]` is what the engraver printed and `*g#:` is an
        # analysis of the key. music21 gives the second a `sharps` derived from
        # the tonic, so on Chopin's Mazurka op. 33 no. 1 — G sharp minor, five
        # sharps, printed by its first edition with four — "keep the last one"
        # silently replaces the edition's signature with the analysis, on
        # eleven scores. The printed signature is the one that survives.
        _, written = self.convert("under-signed-key.krn")
        self.assertEqual(
            written.fifths, [4],
            "the analytical *g#: record overwrote the printed four-sharp signature",
        )

    def test_a_score_without_a_cancel_is_left_alone(self) -> None:
        # The guard against a fix that removes signatures it should not.
        result, _ = self.convert("two-spines.krn")
        self.assertFalse(
            any("key signature" in note for note in result.warnings),
            f"nothing should have been removed here: {result.warnings}",
        )


class TestMergeLoosePart(unittest.TestCase):
    """
    `merge_part_into` with a barred target and an unbarred extra.

    The old unbarred branch inserted the extra's notes at part level, which in
    a part that has measures is outside every bar — and the writer only writes
    what is inside one. The `note_loss` gate would refuse the file, but by
    then the music was gone. Checked on the stream rather than on a written
    file because the fault is in where the notes land, and a written file
    would only show that they had not.
    """

    def test_loose_notes_land_inside_the_bars_at_the_offsets_they_held(self) -> None:
        target = stream.Part()
        for number, start in ((1, 0.0), (2, 4.0)):
            bar = stream.Measure(number=number)
            if number == 1:
                bar.insert(0.0, meter.TimeSignature("4/4"))
            # A bar left three beats long, as a staff that was rest-stripped is.
            bar.insert(0.0, note.Note("C4", quarterLength=3))
            target.insert(start, bar)

        extra = stream.Part()
        wanted = {(0.0, "E3"), (3.0, "F3"), (4.5, "G3"), (9.0, "A3")}
        for offset, name in sorted(wanted):
            extra.insert(offset, note.Note(name, quarterLength=1))

        merge_part_into(target, extra)

        # Nothing loose at part level: every note of both parts is in a bar.
        self.assertEqual(len(target.getElementsByClass(note.GeneralNote)), 0)
        measures = list(target.getElementsByClass(stream.Measure))
        inside = sum(len(measure.recurse().notes) for measure in measures)
        self.assertEqual(inside, 2 + len(wanted))
        # At the offsets they held, read back through the bars they landed in.
        flat = target.flatten()
        placed = {(float(flat.elementOffset(n)), n.nameWithOctave) for n in flat.notes}
        self.assertTrue(wanted <= placed, f"lost or moved: {wanted - placed}")
        # The note past the last barline got a bar of its own rather than nothing.
        self.assertEqual(len(measures), 3)
        self.assertEqual(float(target.elementOffset(measures[-1])), 8.0)


class TestPrepareKern(unittest.TestCase):
    """The text transformation on its own, spine by spine."""

    def test_a_file_without_a_cancel_is_returned_unchanged(self) -> None:
        text = "**kern\t**kern\n*k[f#]\t*k[f#]\n=1\t=1\n4c\t4e\n*-\t*-\n"
        self.assertIs(prepare_kern(text), text)

    def test_the_token_becomes_a_null_interpretation(self) -> None:
        # `*` and not a deleted line: every spine has to keep its place or the
        # file stops parsing.
        text = "**kern\t**kern\t**dynam\n*kcancel\t*kcancel\t*kcancel\n=1\t=1\t=1\n"
        out = prepare_kern(text)
        self.assertEqual(out.splitlines()[1], "*\t*\t*")
        self.assertEqual(len(out.splitlines()), len(text.splitlines()))

    def test_the_other_tokens_on_the_line_are_left_alone(self) -> None:
        # The real files carry it on the kern spines only, with nulls between.
        self.assertEqual(prepare_kern("*kcancel\t*\t*kcancel\t*\t*\n"),
                         "*\t*\t*\t*\t*\n")

    def test_a_key_record_is_never_touched(self) -> None:
        text = "*k[b-e-a-d-]\t*\t*k[b-e-a-d-]\n*kcancel\t*\t*kcancel\n"
        out = prepare_kern(text).splitlines()
        self.assertEqual(out[0], "*k[b-e-a-d-]\t*\t*k[b-e-a-d-]")
        self.assertEqual(out[1], "*\t*\t*")

    def test_line_endings_survive(self) -> None:
        self.assertEqual(prepare_kern("*kcancel\t*kcancel\r\n"), "*\t*\r\n")
