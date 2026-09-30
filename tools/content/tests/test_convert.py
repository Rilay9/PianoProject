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
    today's path and are green before and after, by design.
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
        self.assertEqual(self.metronome(written), ("quarter", False, "96"))
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
