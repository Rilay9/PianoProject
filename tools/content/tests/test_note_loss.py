"""
The note-loss gate (docs/03 §3): counting a source, and refusing a conversion
that lost too much of it.

Two mechanisms were losing notes between a source file and the `.mxl` the app
ships, and nothing in the pipeline counted notes, so neither was ever reported.
The counters here are the source of truth the gate compares against, so they
are tested against inline fixtures small enough to count by eye; the gate
itself is tested as a pure function; and the end-to-end case asserts the two
counts are *equal*, never what either of them is.
"""
from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from convert import (  # noqa: E402
    NOTE_LOSS_LIMIT,
    ConversionResult,
    convert_file,
    kern_note_events,
    musicxml_note_events,
    note_loss,
    record_from_result,
    result_from_record,
    source_note_events,
)

REPO = Path(__file__).resolve().parents[3]

#: Three spines, one of them `**dynam`; a chord, a positioned rest, and a split
#: that runs for two lines before merging back. Counted by eye: four notes in
#: the left hand of bar 1 and three events in the right (the chord is one, the
#: `8rff` is a rest), six across the two split lines, two in bar 3 — fifteen.
#: The dynamics are `p`, `<` and `ff`, and an `ff` read as pitch letters would
#: make sixteen.
KERN = "\n".join([
    "!!!COM: Test",
    "**kern\t**kern\t**dynam",
    "*M4/4\t*M4/4\t*M4/4",
    "=1\t=1\t=1",
    "4C\t4cc ee gg\tp",
    "4D\t4dd\t.",
    "4E\t8rff\t<",
    "4F\t8ee\tff",
    "=2\t=2\t=2",
    "*\t*^\t*",
    "4G\t4gg\t4b\t.",
    "4A\t4aa\t4cc\t.",
    "*\t*v\t*v\t*",
    "=3\t=3\t=3",
    "4B\t4bb\t.",
    "*-\t*-\t*-",
    "",
])

KERN_EVENTS = 15

#: One chord of three pitches, one rest, two single notes: three events.
MUSICXML = """<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration></note>
      <note><chord/><pitch><step>E</step><octave>4</octave></pitch><duration>1</duration></note>
      <note><chord/><pitch><step>G</step><octave>4</octave></pitch><duration>1</duration></note>
      <note><rest/><duration>1</duration></note>
      <note><pitch><step>D</step><octave>4</octave></pitch><duration>1</duration></note>
      <note><pitch><step>E</step><octave>4</octave></pitch><duration>1</duration></note>
    </measure>
  </part>
</score-partwise>
"""

MUSICXML_EVENTS = 3


class TestKernCounter(unittest.TestCase):
    def test_a_chord_is_one_event_and_a_rest_is_none(self) -> None:
        self.assertEqual(kern_note_events(KERN), KERN_EVENTS)

    def test_a_dynamics_spine_is_not_music(self) -> None:
        # `ff` is two pitch letters to anything that does not know which spine
        # it is in, so dropping the `**dynam` column has to change the answer.
        without = "\n".join(
            "\t".join(line.split("\t")[:-1]) if "\t" in line else line
            for line in KERN.splitlines()
        )
        self.assertEqual(kern_note_events(without), KERN_EVENTS)

    def test_the_split_spine_is_counted(self) -> None:
        # Bar 2 runs on three sounding spines because the right hand splits.
        # Silencing the spine that the `*^` opened has to cost exactly the two
        # notes in it; a counter that lost track of the columns would either
        # miss them both anyway or charge the dynamics for them.
        emptied = (KERN
                   .replace("4G\t4gg\t4b\t.", "4G\t4gg\t.\t.")
                   .replace("4A\t4aa\t4cc\t.", "4A\t4aa\t.\t."))
        self.assertEqual(kern_note_events(emptied), KERN_EVENTS - 2)


class TestMusicXmlCounter(unittest.TestCase):
    def test_a_chord_is_one_event_and_a_rest_is_none(self) -> None:
        self.assertEqual(musicxml_note_events(MUSICXML.encode("utf-8")), MUSICXML_EVENTS)


class TestSourceNoteEvents(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.dir = Path(self._tmp.name)

    def tearDown(self) -> None:
        self._tmp.cleanup()

    def test_a_kern_file_is_counted(self) -> None:
        path = self.dir / "sample.krn"
        path.write_text(KERN, encoding="utf-8")
        self.assertEqual(source_note_events(path), KERN_EVENTS)

    def test_a_musicxml_file_is_counted(self) -> None:
        path = self.dir / "sample.musicxml"
        path.write_text(MUSICXML, encoding="utf-8")
        self.assertEqual(source_note_events(path), MUSICXML_EVENTS)

    def test_a_format_we_cannot_count_is_not_gated(self) -> None:
        # ABC, LilyPond and MIDI have no note count this side of a parser, so
        # they say "unknown" and the gate lets them past rather than guessing.
        path = self.dir / "tune.abc"
        path.write_text("X:1\nT:Tune\nK:C\nCDEF|\n", encoding="utf-8")
        self.assertIsNone(source_note_events(path))

    def test_an_unreadable_source_is_unknown_rather_than_refused(self) -> None:
        path = self.dir / "broken.musicxml"
        path.write_text("<score-partwise", encoding="utf-8")
        self.assertIsNone(source_note_events(path))


class TestGate(unittest.TestCase):
    """`note_loss` as a decision, with no file and no music21 in the way."""

    #: A round number of events, so the limit's fraction of it is a whole
    #: number and "one more than the limit allows" is exactly one note.
    SOURCE = 10_000

    def allowed(self) -> int:
        return int(self.SOURCE * NOTE_LOSS_LIMIT)

    def test_a_loss_over_the_limit_is_refused(self) -> None:
        verdict, sentence = note_loss(self.SOURCE, self.SOURCE - self.allowed() - 1)
        self.assertEqual(verdict, "refuse")
        self.assertIn(str(self.SOURCE), sentence)
        self.assertIn(str(self.SOURCE - self.allowed() - 1), sentence)
        self.assertIn("%", sentence)

    def test_a_loss_at_or_under_the_limit_is_a_warning(self) -> None:
        verdict, sentence = note_loss(self.SOURCE, self.SOURCE - self.allowed())
        self.assertEqual(verdict, "warn")
        self.assertIn(str(self.SOURCE), sentence)

    def test_an_exact_match_says_nothing(self) -> None:
        self.assertEqual(note_loss(self.SOURCE, self.SOURCE), ("ok", ""))

    def test_a_gain_is_not_a_fault(self) -> None:
        # Normalisation splits a tie that crosses a barline into two written
        # notes, so a score can honestly come out with more events than it
        # went in with.
        self.assertEqual(note_loss(self.SOURCE, self.SOURCE + 7)[0], "ok")

    def test_an_unknown_source_count_is_not_gated(self) -> None:
        self.assertEqual(note_loss(None, 1)[0], "ok")


class TestCacheRecord(unittest.TestCase):
    def test_a_sidecar_without_the_counts_still_loads(self) -> None:
        # The fingerprint hashes convert.py, so every entry written before the
        # gate existed is already unreachable — but a cache that raises on an
        # old file is a build that cannot start, and that is not worth risking.
        result = ConversionResult(
            path=Path("."), title="T", composer=None, measures=1, notes=1,
            staves=2, tempo_bpm=96.0, added_tempo=False, stripped_lyrics=0,
            fingerings=0, harmonies=0,
        )
        record = record_from_result(result)
        record.pop("source_notes")
        record.pop("note_events")
        restored = result_from_record(record, Path("x.mxl"))
        self.assertIsNone(restored.source_notes)
        self.assertEqual(restored.note_events, 0)

    def test_the_counts_survive_the_round_trip(self) -> None:
        result = ConversionResult(
            path=Path("."), title="T", composer=None, measures=1, notes=1,
            staves=2, tempo_bpm=96.0, added_tempo=False, stripped_lyrics=0,
            fingerings=0, harmonies=0, source_notes=KERN_EVENTS,
            note_events=KERN_EVENTS,
        )
        restored = result_from_record(record_from_result(result), Path("x.mxl"))
        self.assertEqual(restored.source_notes, KERN_EVENTS)
        self.assertEqual(restored.note_events, KERN_EVENTS)


#: A rag whose Humdrum edition keeps three spines, so it is the corpus's own
#: example of a source that has to be merged onto two staves. It used to come
#: out with the middle spine missing entirely.
THREE_SPINE_RAG = REPO / "content" / "scores" / "imported" / "kern" / "joplin" / "kern" / "school.krn"


@unittest.skipUnless(THREE_SPINE_RAG.is_file(), f"{THREE_SPINE_RAG} is not in this tree")
class TestThreeStavesKeepEveryNote(unittest.TestCase):
    def test_the_conversion_holds_every_event_the_source_had(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            result = convert_file(THREE_SPINE_RAG, Path(tmp) / "rag.mxl")
        self.assertTrue(any("merged" in w for w in result.warnings), result.warnings)
        self.assertEqual(result.source_notes, source_note_events(THREE_SPINE_RAG))
        # The assertion is the equality, not either number: what the rag holds
        # is the edition's business and may change with it.
        self.assertEqual(result.note_events, result.source_notes)
        self.assertEqual(note_loss(result.source_notes, result.note_events), ("ok", ""))


if __name__ == "__main__":
    unittest.main()
