"""
Lengths music21's MusicXML writer cannot name, and the step that settles them
(docs/03 §3b).

The fault these cover is an editor's arithmetic, not a notation anyone wrote.
MusicXML counts time in integer ticks, an irregular tuplet does not divide
evenly into them, and the editor rounds each note of the run to the nearest
tick — so the run does not add up to the beat it fills, the last note overhangs
the barline by a tick, and the sliver left when music21 ties it across is a
length no printed note value names. It comes back as one of three sentences:
`Cannot convert "2048th" duration to MusicXML`, `Cannot convert inexpressible
durations`, or a bare `KeyError` from `makeTies`.

The fixtures are therefore MusicXML text rather than music21 scores: the tick
counts *are* the fault, and a score built through music21 could not carry them.
Every count asserted here is counted by eye off the fixture above it. The one
test that reads a real file asserts only that its two counts agree.
"""
from __future__ import annotations

import json
import re
import sys
import tempfile
import unittest
from fractions import Fraction
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from convert import (  # noqa: E402
    SMALLEST_WRITABLE_QL,
    ConversionError,
    convert_file,
    count_note_events,
    normalise,
    parse_source,
    refuse_unwritable,
    settle_durations,
    source_note_events,
    writable_quarter_length,
)
from mxlutil import read_mxl  # noqa: E402

REPO = Path(__file__).resolve().parents[3]

#: The raw files the PDMX re-run left behind, if that run is still on disk.
PDMX_RAW = REPO / "build" / "pdmx-rerun" / "raw"
PDMX_QUARRIED = REPO / "build" / "pdmx-rerun" / "quarried.json"


def score(divisions: int, time: str, measures: str) -> str:
    beats, beat_type = time.split("/")
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>{divisions}</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>{beats}</beats><beat-type>{beat_type}</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
{measures}
  </part>
</score-partwise>
"""


def pitched(step: str, octave: int, ticks: int, kind: str, extra: str = "") -> str:
    return (
        f"      <note><pitch><step>{step}</step><octave>{octave}</octave></pitch>"
        f"<duration>{ticks}</duration><type>{kind}</type>{extra}</note>\n"
    )


def rest(ticks: int, kind: str) -> str:
    return f"      <note><rest/><duration>{ticks}</duration><type>{kind}</type></note>\n"


#: Seven in the time of six: the ratio the editor printed.
SEVEN_IN_SIX = (
    "<time-modification><actual-notes>7</actual-notes>"
    "<normal-notes>6</normal-notes></time-modification>"
)

#: Seven sixteenths in the time of six, in a 3/8 bar. At 480 ticks to the
#: quarter the bar is 720 ticks and each note of the run is 720/7 = 102.86 of
#: them, so the editor writes 103 and the run comes to 721: one tick over the
#: barline, which is the whole fault. Seven notes in the run, one dotted
#: quarter in the bar after it — eight note events, no rests.
ROUNDED_TUPLET = score(
    480,
    "3/8",
    "".join(
        pitched("CDEFGAB"[i], 5, 103, "16th", SEVEN_IN_SIX) for i in range(7)
    )
    + "    </measure>\n"
    + '    <measure number="2">\n'
    + pitched("C", 5, 720, "quarter", "<dot/>")
    + "    </measure>\n",
)

#: The seven notes of that run, and the length each of them is printed as: a
#: sixteenth (a quarter of a quarter) taken at six sevenths.
ROUNDED_TUPLET_RUN = 7
ROUNDED_TUPLET_EVENTS = 8
ROUNDED_TUPLET_PRINTED = Fraction(1, 4) * Fraction(6, 7)

#: A note one tick long where the tick is a 2048th — 512 ticks to the quarter,
#: which is what an editor reaches for when a piece has 128th tremolos. There
#: is no printed value for it: MusicXML's shortest is the 1024th. Nothing here
#: can settle it, because the only value it could be given is longer than it
#: is, and lengthening it pushes the bar past its own barline.
TWO_THOUSAND_AND_FORTY_EIGHTH = score(
    512,
    "4/4",
    # No `<type>`: the tick count is all there is, so music21 reads a 2048th.
    '      <note><pitch><step>C</step><octave>5</octave></pitch>'
    "<duration>1</duration></note>\n"
    + rest(2047, "whole")
    + "    </measure>\n"
    + '    <measure number="2">\n'
    + pitched("G", 4, 2048, "whole")
    + "    </measure>\n",
)

#: Three grace notes running into the note they ornament, over the same
#: rounded run as above so that there is something for the step to settle.
#: A grace has no length to settle and must come through untouched. Three
#: graces, seven notes of the run, one dotted quarter: eleven events.
GRACE_CHAIN = score(
    480,
    "3/8",
    "".join(
        f'      <note><grace/><pitch><step>{step}</step><octave>5</octave></pitch>'
        f"<type>32nd</type></note>\n"
        for step in ("A", "B", "C")
    )
    + "".join(pitched("CDEFGAB"[i], 5, 103, "16th", SEVEN_IN_SIX) for i in range(7))
    + "    </measure>\n"
    + '    <measure number="2">\n'
    + pitched("C", 5, 720, "quarter", "<dot/>")
    + "    </measure>\n",
)

GRACE_CHAIN_GRACES = 3
GRACE_CHAIN_EVENTS = 11


def quantised_count(warnings: list[str]) -> int | None:
    """The number a `N durations quantised…` warning names, or None."""
    for warning in warnings:
        found = re.match(r"^(\d+) durations quantised", warning)
        if found:
            return int(found.group(1))
    return None


class DurationCase(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.dir = Path(self._tmp.name)

    def tearDown(self) -> None:
        self._tmp.cleanup()

    def written(self, xml: str, name: str = "source") -> Path:
        # Never the same stem as the output: writing an `.mxl` makes music21
        # stage a `.musicxml` beside it and then delete it, which ate the
        # fixture's own source the first time these were run.
        src = self.dir / f"{name}-in.musicxml"
        src.write_text(xml, encoding="utf-8")
        return src

    def convert(self, xml: str, name: str = "source"):
        src = self.written(xml, name)
        result = convert_file(src, self.dir / f"{name}-out.mxl")
        return src, result


class TestTheFixturesAreTheFault(DurationCase):
    """
    The fixtures are unwritable as they arrive — otherwise the tests below
    would pass with the step taken out, and prove nothing.
    """

    def unsettled(self, xml: str) -> str:
        from music21.musicxml.xmlObjects import MusicXMLExportException

        parsed = parse_source(self.written(xml))
        with self.assertRaises(MusicXMLExportException) as refusal:
            parsed.write("musicxml", fp=str(self.dir / "straight-out.mxl"))
        return str(refusal.exception)

    def test_the_rounded_run_cannot_be_written_as_it_stands(self) -> None:
        self.assertIn("inexpressible", self.unsettled(ROUNDED_TUPLET))

    def test_the_grace_chain_cannot_be_written_as_it_stands(self) -> None:
        self.assertIn("inexpressible", self.unsettled(GRACE_CHAIN))

    def test_the_2048th_cannot_be_written_as_it_stands(self) -> None:
        self.assertIn("2048th", self.unsettled(TWO_THOUSAND_AND_FORTY_EIGHTH))


class TestRoundedTuplet(DurationCase):
    def test_it_is_written_at_all(self) -> None:
        # Without the step this raises out of music21's writer rather than
        # producing a file, which is what cost the quarry its best admissions.
        src, result = self.convert(ROUNDED_TUPLET)
        self.assertTrue(result.path.exists())
        self.assertEqual(source_note_events(src), ROUNDED_TUPLET_EVENTS)
        self.assertEqual(result.note_events, source_note_events(src))

    def test_the_warning_counts_what_it_touched(self) -> None:
        _src, result = self.convert(ROUNDED_TUPLET)
        self.assertEqual(quantised_count(result.warnings), ROUNDED_TUPLET_RUN)

    def test_every_note_of_the_run_lasts_what_it_is_printed_as(self) -> None:
        parsed = parse_source(self.written(ROUNDED_TUPLET))
        settled, _result = normalise(parsed, keep_lyrics=False, tempo_bpm=None)
        run = [
            note
            for note in settled.recurse().notes
            if note.duration.tuplets
        ]
        self.assertEqual(len(run), ROUNDED_TUPLET_RUN)
        for note in run:
            self.assertEqual(
                Fraction(note.duration.quarterLength), ROUNDED_TUPLET_PRINTED
            )

    def test_no_note_moves_by_as_much_as_the_shortest_writable_note(self) -> None:
        # The rounding is a tick; the correction has to be smaller than
        # anything MusicXML could have written instead.
        self.assertLess(
            abs(ROUNDED_TUPLET_PRINTED - Fraction(103, 480)), SMALLEST_WRITABLE_QL
        )

    def test_the_run_keeps_its_printed_ratio(self) -> None:
        _src, result = self.convert(ROUNDED_TUPLET)
        written = read_mxl(result.path)
        self.assertEqual(
            written.xml.count("<actual-notes>7</actual-notes>"), ROUNDED_TUPLET_RUN
        )


class TestTwoThousandAndFortyEighth(DurationCase):
    def test_it_is_refused_in_a_sentence_rather_than_dropped(self) -> None:
        # The loud answer, and the one the importers already know what to do
        # with. Silently rounding it up would move a barline.
        with self.assertRaises(ConversionError) as refusal:
            self.convert(TWO_THOUSAND_AND_FORTY_EIGHTH)
        self.assertIn("bar 1", str(refusal.exception))
        self.assertIn("2048th", str(refusal.exception))

    def test_it_is_not_quietly_rewritten_first(self) -> None:
        parsed = parse_source(self.written(TWO_THOUSAND_AND_FORTY_EIGHTH))
        sliver = min(parsed.recurse().notes, key=lambda n: n.duration.quarterLength)
        self.assertEqual(sliver.duration.type, "2048th")
        self.assertIsNone(writable_quarter_length(sliver.duration))


class TestGraceChain(DurationCase):
    def test_it_is_written_at_all(self) -> None:
        src, result = self.convert(GRACE_CHAIN)
        self.assertTrue(result.path.exists())
        self.assertEqual(source_note_events(src), GRACE_CHAIN_EVENTS)
        self.assertEqual(result.note_events, source_note_events(src))

    def test_the_warning_counts_what_it_touched(self) -> None:
        # The graces are not among them: a grace has no sounding length for
        # the step to disagree with.
        _src, result = self.convert(GRACE_CHAIN)
        self.assertEqual(quantised_count(result.warnings), ROUNDED_TUPLET_RUN)

    def test_the_graces_come_through(self) -> None:
        _src, result = self.convert(GRACE_CHAIN)
        written = read_mxl(result.path)
        self.assertEqual(written.xml.count("<grace"), GRACE_CHAIN_GRACES)


class TestWhatItDeclines(unittest.TestCase):
    def test_a_length_that_agrees_with_its_notation_is_left_alone(self) -> None:
        from music21 import duration

        for spelling in ("quarter", "eighth", "16th", "whole"):
            with self.subTest(spelling=spelling):
                self.assertIsNone(
                    writable_quarter_length(duration.Duration(type=spelling))
                )

    def test_an_ordinary_triplet_is_left_alone(self) -> None:
        from music21 import duration

        unit = duration.Duration(type="eighth")
        triplet = duration.Tuplet(3, 2)
        triplet.setDurationType("eighth")
        unit.tuplets = (triplet,)
        self.assertIsNone(writable_quarter_length(unit))

    def test_a_bar_of_plain_notes_is_not_touched(self) -> None:
        self.assertEqual(settle_durations(self.plain_bar()), 0)

    def test_the_refusal_names_the_bar_and_the_length(self) -> None:
        # A length no printed value expresses is refused with a sentence of
        # our own, rather than left for the writer to raise on.
        holder = self.plain_bar()
        stubborn = list(holder.recurse().notes)[0]
        stubborn.duration.quarterLength = Fraction(1, 480)
        sentence = refuse_unwritable(holder)
        self.assertIn("bar 4", sentence)
        self.assertIn("1/480", sentence)

    def test_a_writable_bar_is_not_refused(self) -> None:
        self.assertEqual(refuse_unwritable(self.plain_bar()), "")

    def plain_bar(self):
        from music21 import note as m21note
        from music21 import stream

        holder = stream.Score()
        staff = stream.PartStaff()
        measure = stream.Measure(number=4)
        for index, name in enumerate(("C5", "D5", "E5", "F5")):
            measure.insert(index, m21note.Note(name, type="quarter"))
        staff.insert(0, measure)
        holder.insert(0, staff)
        return holder


class TestARealFile(unittest.TestCase):
    """
    One of the files the PDMX re-run could not write, end to end.

    Skipped when that run is not on this machine — `build/` is not in the
    repository. Nothing here asserts how many notes the file has: only that the
    number that went in is the number that came out.
    """

    #: The upload the step was built against: a piano transcription of the Ride
    #: of the Valkyries, which the re-run refused with `Cannot convert
    #: inexpressible durations to MusicXML`.
    CID = "QmNvwJ9vARcx8XgrVn7ev45WSt3Rj2Qyx7AvqSUSrGLRRw"

    def setUp(self) -> None:
        self.raw = PDMX_RAW / f"{self.CID}.mxl"
        if not self.raw.exists():
            self.skipTest("the PDMX re-run's raw files are not on this machine")

    def test_the_re_run_refused_it_at_the_export_step(self) -> None:
        # Guards the premise rather than the fix: if the recorded reason is not
        # one of the writer's, this file is no longer the right witness.
        if not PDMX_QUARRIED.exists():
            self.skipTest("the PDMX re-run's results are not on this machine")
        rows = json.loads(PDMX_QUARRIED.read_text(encoding="utf-8"))["rows"]
        row = next(row for row in rows if row["cid"] == self.CID)
        self.assertEqual(row.get("gate"), "convert")
        self.assertIn("inexpressible durations", row.get("reason") or "")

    def test_it_converts_now_with_every_note_it_arrived_with(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            try:
                result = convert_file(self.raw, Path(tmp) / "out.mxl")
            except ConversionError as exc:  # pragma: no cover — a real refusal
                self.fail(f"{self.raw.name} was refused: {exc}")
            self.assertEqual(result.note_events, source_note_events(self.raw))
            self.assertIsNotNone(quantised_count(result.warnings))
            # And the file on disk says the same as the stream that wrote it.
            self.assertEqual(
                count_note_events(parse_source(result.path)), result.note_events
            )


if __name__ == "__main__":
    unittest.main()
