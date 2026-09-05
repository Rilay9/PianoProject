"""
The ABC preprocessor (docs/03 §5's authoring conventions).

Both behaviours here exist because music21 10.5 does not do them: it parses the
inline `[V:n]` voice form into one part plus one empty part, and it discards
`!n!` fingering decorations entirely.
"""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from abc_tools import (  # noqa: E402
    extract_fingerings,
    inline_voices_to_blocks,
    parse_metadata,
    parse_tempo,
    parse_voice_clefs,
    prepare_abc,
)

INLINE = """X:1
T:Inline
%%pianopath id=song.test.inline level=2.1 tracks=core,classical
%%score {1 2}
L:1/4
M:4/4
K:C
V:1 clef=treble
V:2 clef=bass
[V:1] C D E G |]
[V:2] C,2 E,2 |]
"""


class TestVoiceRewrite(unittest.TestCase):
    def test_inline_voices_become_blocks(self) -> None:
        out = inline_voices_to_blocks(INLINE)
        lines = [line for line in out.splitlines() if line.strip()]
        self.assertIn("V:1 clef=treble", lines)
        self.assertIn("C D E G |]", lines)
        self.assertLess(lines.index("V:1 clef=treble"), lines.index("C D E G |]"))
        self.assertLess(lines.index("V:2 clef=bass"), lines.index("C,2 E,2 |]"))

    def test_voice_attributes_are_carried_onto_the_header(self) -> None:
        # Without the clef the grand staff comes out as two treble staves.
        self.assertIn("V:2 clef=bass", inline_voices_to_blocks(INLINE))

    def test_a_file_already_in_block_form_is_left_alone(self) -> None:
        block = "X:1\nK:C\nV:1\nC D E F |]\n"
        self.assertEqual(inline_voices_to_blocks(block), block)

    def test_pianopath_lines_are_removed_before_parsing(self) -> None:
        self.assertNotIn("%%pianopath", prepare_abc(INLINE))


class TestMetadata(unittest.TestCase):
    def test_reads_pianopath_pairs(self) -> None:
        meta = parse_metadata(INLINE)
        self.assertEqual(meta.get("id"), "song.test.inline")
        self.assertEqual(meta.get("level"), "2.1")
        self.assertEqual(meta.list("tracks"), ["core", "classical"])

    def test_reads_standard_headers(self) -> None:
        meta = parse_metadata(INLINE)
        self.assertEqual(meta.title, "Inline")
        self.assertEqual(meta.key, "C")
        self.assertEqual(meta.meter, "4/4")

    def test_quoted_values_survive_spaces(self) -> None:
        meta = parse_metadata('%%pianopath title="Two Words" level=1\n')
        self.assertEqual(meta.get("title"), "Two Words")


class TestTempo(unittest.TestCase):
    def test_quarter_note_tempo(self) -> None:
        self.assertEqual(parse_tempo("1/4=84"), 84)

    def test_dotted_and_other_beat_units_convert_to_quarters(self) -> None:
        # 60 dotted-quarter beats a minute is 90 quarter notes a minute.
        self.assertEqual(parse_tempo("3/8=60"), 90)
        self.assertEqual(parse_tempo("1/2=40"), 80)

    def test_a_bare_number(self) -> None:
        self.assertEqual(parse_tempo("100"), 100)

    def test_nonsense_is_none_rather_than_a_guess(self) -> None:
        self.assertIsNone(parse_tempo("allegro"))


class TestFingering(unittest.TestCase):
    def test_fingerings_are_indexed_by_note_position(self) -> None:
        abc = "X:1\nK:C\nV:1\n!1!C !3!E G !5!c |]\n"
        self.assertEqual(extract_fingerings(abc), {"1": {0: 1, 1: 3, 3: 5}})

    def test_a_chord_counts_as_one_note_event(self) -> None:
        abc = "X:1\nK:C\nV:1\n!1![CEG] !5!c |]\n"
        self.assertEqual(extract_fingerings(abc), {"1": {0: 1, 1: 5}})

    def test_chord_symbols_and_rests_do_not_shift_the_index(self) -> None:
        abc = 'X:1\nK:C\nV:1\n"C"!1!C z !2!D |]\n'
        self.assertEqual(extract_fingerings(abc), {"1": {0: 1, 1: 2}})

    def test_accidentals_are_part_of_the_note(self) -> None:
        abc = "X:1\nK:C\nV:1\n!2!^C !3!_E |]\n"
        self.assertEqual(extract_fingerings(abc), {"1": {0: 2, 1: 3}})

    def test_each_voice_is_counted_separately(self) -> None:
        abc = "X:1\nK:C\nV:1\n!1!C D |]\nV:2\n!5!C, E, |]\n"
        self.assertEqual(extract_fingerings(abc), {"1": {0: 1}, "2": {0: 5}})

    def test_decorations_that_are_not_fingerings_are_ignored(self) -> None:
        abc = "X:1\nK:C\nV:1\n!trill!C !1!D |]\n"
        self.assertEqual(extract_fingerings(abc), {"1": {1: 1}})


if __name__ == "__main__":
    unittest.main()


class TestFingeringPlacement(unittest.TestCase):
    """
    Which staff a fingering lands on.

    A left-hand-only tune marks fingering on voice 2 and nothing on voice 1.
    Mapping voices to parts by their position in the extracted dictionary put
    all of it on the silent treble staff, so the printed score had none.
    """

    def build(self, abc: str):
        from music21 import converter

        from abc_tools import apply_fingerings, extract_fingerings, prepare_abc

        score = converter.parse(prepare_abc(abc), format="abc")
        applied = apply_fingerings(score, extract_fingerings(abc))
        return score, applied

    def test_a_left_hand_only_tune_is_fingered_on_the_bass_staff(self) -> None:
        from music21 import articulations

        abc = (
            "X:1\nT:LH\nL:1/4\nM:4/4\nK:C\n"
            "V:1 clef=treble\nV:2 clef=bass\n"
            "[V:1] z4 |]\n[V:2] !5!C, !4!D, !3!E, !2!F, |]\n"
        )
        score, applied = self.build(abc)
        self.assertEqual(applied, 4)
        bass = list(score.parts)[1]
        fingerings = [
            a
            for n in bass.recurse().notes
            for a in n.articulations
            if isinstance(a, articulations.Fingering)
        ]
        self.assertEqual([f.fingerNumber for f in fingerings], [5, 4, 3, 2])

    def test_both_hands_land_on_their_own_staff(self) -> None:
        abc = (
            "X:1\nT:HT\nL:1/4\nM:4/4\nK:C\n"
            "V:1 clef=treble\nV:2 clef=bass\n"
            "[V:1] !1!C !2!D |]\n[V:2] !5!C, !4!D, |]\n"
        )
        _, applied = self.build(abc)
        self.assertEqual(applied, 4)


class TestVoiceClefs(unittest.TestCase):
    def test_clefs_are_read_from_the_voice_headers(self) -> None:
        text = "X:1\nK:C\nV:1 clef=treble\nV:2 clef=bass\n[V:1] C |]\n[V:2] C, |]\n"
        self.assertEqual(parse_voice_clefs(text), {"1": "TrebleClef", "2": "BassClef"})

    def test_a_voice_with_no_clef_is_not_listed(self) -> None:
        text = "X:1\nK:C\nV:1\nV:2 clef=bass\n"
        self.assertEqual(parse_voice_clefs(text), {"2": "BassClef"})
