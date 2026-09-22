"""
The committed harness for `tools/midi-cleanup/midi_to_musicxml.py`.

The converter was rebuilt on 2026-09-19 against MIDI *rendered* from catalog
scores with timing jitter, and that harness was never committed. This is it,
plus the cases rendered input cannot reach: a two-hand recording in one track,
hands that cross, and a grid that has to be chosen rather than assumed.

Two kinds of input, and the difference matters:

  * **rendered** — a committed `.mxl` fixture written out as MIDI, optionally
    with each onset and release nudged. Every note's written duration is known,
    so the round trip can be asserted exactly. Always available.
  * **real** — the three Disklavier performances in `build/midi-real/`. `build/`
    is in `.gitignore`, so those files are *not* in the repository and these
    tests skip when they are absent. They are named in the skip message rather
    than silently passing.

Run from the repository root:

    python -m unittest discover -s tools/midi-cleanup/tests -t .
"""
from __future__ import annotations

import random
import sys
import tempfile
import unittest
from fractions import Fraction
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from midi_to_musicxml import (  # noqa: E402
    HAND_SPAN_SEMITONES,
    Event,
    convert,
    detect_swing,
    is_notatable,
    notatable_pieces,
    quantise,
    read_midi,
    slice_into_chords,
    split_hands,
    track_with_the_notes,
)

REPO = Path(__file__).resolve().parents[3]
REAL_DIR = REPO / "build" / "midi-real"
FIXTURES = REPO / "app" / "tests" / "fixtures" / "scores" / "generated"
REAL_FILES = (
    "bach-bwv885-prelude-2011.mid",
    "grieg-op38-7-waltz-2014.mid",
    "scarlatti-k525-2008.mid",
)

have_real = all((REAL_DIR / name).exists() for name in REAL_FILES)
real_reason = (
    f"{REAL_DIR} is under .gitignore; fetch the three MAESTRO performances named in "
    f"its SOURCE.md to run these: {', '.join(REAL_FILES)}"
)


def ev(start: float, end: float, midi: int, velocity: int = 64) -> Event:
    """One note event, in the converter's own shape."""
    return Event(Fraction(start).limit_denominator(1000), Fraction(end).limit_denominator(1000),
                 midi, velocity)


def sounding(path: Path) -> list[tuple[float, int, float]]:
    """(onset, midi, total sounding length) for every struck note in a written file.

    Tie chains are merged, so a note the converter split at a barline counts
    once with its whole length — which is what "the same durations" means.
    """
    from music21 import chord, converter as m21converter

    score = m21converter.parse(str(path))
    out: list[tuple[float, int, float]] = []
    open_notes: dict[int, list] = {}
    for part in score.parts:
        open_notes.clear()
        for n in part.flatten().notes:
            members = list(n.notes) if isinstance(n, chord.Chord) else [n]
            for member in members:
                midi = int(round(member.pitch.ps))
                carries = member.tie is not None and member.tie.type in ("stop", "continue")
                row = open_notes.get(midi)
                if carries and row is not None:
                    row[2] += float(n.duration.quarterLength)
                    continue
                row = [round(float(n.offset), 4), midi, float(n.duration.quarterLength)]
                out.append(row)  # type: ignore[arg-type]
                open_notes[midi] = row
    return sorted((round(o, 4), m, round(d, 4)) for o, m, d in out)  # type: ignore[misc]


def render_midi(fixture: Path, out: Path, jitter_ms: float = 0.0, seed: int = 7) -> None:
    """Write a committed fixture out as MIDI, optionally nudging every onset.

    The jitter is in milliseconds at the score's own tempo, because that is
    what a performance's error is; converting it to quarters here keeps the
    test from asserting a number of beats that only holds at one tempo.

    **The notes are copied into a fresh stream rather than moved in place**, and
    that is a correction. `for n in part.flatten().notes: n.offset = ...` sets
    the offset in the *flat* stream, which is a view; the measures the MIDI
    writer walks kept the originals, so the first version of this jittered
    nothing at all and the round-trip test below was passing on unjittered
    input. It was caught by the converter reporting that its largest moved
    onset was 0.000 quarters.
    """
    import copy

    from music21 import converter as m21converter, stream, tempo

    score = m21converter.parse(str(fixture))
    marks = list(score.flatten().getElementsByClass(tempo.MetronomeMark))
    bpm = float(marks[0].number) if marks else 120.0
    quarters = jitter_ms / (60_000.0 / bpm)
    rng = random.Random(seed)

    out_score = stream.Score()
    for part in score.parts:
        rebuilt = stream.Part()
        rebuilt.insert(0, tempo.MetronomeMark(number=bpm))
        for n in part.flatten().notes:
            at = float(n.offset)
            length = float(n.duration.quarterLength)
            if quarters:
                at = max(0.0, at + rng.uniform(-quarters, quarters))
                length = max(0.05, length + rng.uniform(-quarters, quarters))
            fresh = copy.deepcopy(n)
            fresh.duration.quarterLength = length
            # Every tie dropped with the bars: a tie that survives into a flat
            # stream with moved offsets is a tie to a note that is no longer
            # where it says it is, and the MIDI writer would emit two notes.
            fresh.tie = None
            rebuilt.insert(at, fresh)
        out_score.insert(0, rebuilt)
    out_score.write("midi", fp=str(out))


class TestNotatableDurations(unittest.TestCase):
    """The crash the three real recordings all hit, as a unit."""

    def test_a_dotted_eighth_and_a_triplet_eighth_are_notatable(self) -> None:
        self.assertTrue(is_notatable(Fraction(3, 4)))
        self.assertTrue(is_notatable(Fraction(1, 3)))
        self.assertTrue(is_notatable(Fraction(1, 12)))

    def test_five_twelfths_and_five_sixteenths_are_not(self) -> None:
        # music21 writes 5/12 as a 6:5 tuplet and 5/16 as a complex duration;
        # the first is not a rhythm and the second is what the exporter throws on.
        self.assertFalse(is_notatable(Fraction(5, 12)))
        self.assertFalse(is_notatable(Fraction(5, 16)))

    def test_an_unnotatable_length_is_split_into_notatable_pieces(self) -> None:
        for start, length, unit in (
            (Fraction(0), Fraction(5, 12), Fraction(1, 12)),
            (Fraction(1, 4), Fraction(5, 16), Fraction(1, 4)),
            (Fraction(1, 2), Fraction(7, 12), Fraction(1, 12)),
        ):
            pieces = notatable_pieces(start, length, unit, Fraction(1))
            self.assertEqual(sum(pieces), length, f"{length} lost length")
            for piece in pieces:
                self.assertTrue(is_notatable(piece), f"{length} -> {pieces}: {piece} is not")


class TestSlicing(unittest.TestCase):
    """Every chord the line is cut into is a length somebody can write."""

    def test_a_held_note_on_a_triplet_grid_is_cut_into_rhythms_and_tied(self) -> None:
        # Five thirds of a beat, held. It is on the grid and it is not a rhythm:
        # music21 exports it as a 6:5 tuplet, and seven thirds as a 12:7 - the
        # shape that made every one of the three real recordings throw
        # "Cannot convert inexpressible durations to MusicXML".
        self.assertFalse(is_notatable(Fraction(5, 3)))
        events = [ev(0, 5 / 3, 48), ev(5 / 3, 7 / 3, 55)]
        line = slice_into_chords(events, Fraction(4), Fraction(1),
                                 lambda _index: Fraction(1, 3))
        lengths = [Fraction(n.duration.quarterLength).limit_denominator(1000) for n in line.notes]
        self.assertGreater(len(lengths), len(events))
        self.assertEqual(sum(lengths), Fraction(7, 3))
        for length in lengths:
            self.assertTrue(is_notatable(length), f"{length} is not a rhythm")


class TestQuantisePolicy(unittest.TestCase):
    def test_one_grid_per_bar_not_one_per_note_and_not_one_per_piece(self) -> None:
        """A bar of triplets takes the triplet unit for all of it, and the bar of
        sixteenths after it takes the sixteenth - two bars, two answers.

        Both halves matter and the first version of this test only had the
        first: one bar of triplets proves nothing about *per bar*, because one
        bar and the whole piece are the same thing. The second bar is what
        makes the assertion about the policy rather than about the example.
        """
        events = [ev(i / 3, i / 3 + 0.3, 60 + i) for i in range(6)]
        events.append(ev(1.98, 2.3, 72))  # nearer a sixteenth than a triplet
        events += [ev(4 + i / 4, 4 + i / 4 + 0.2, 60 + i) for i in range(16)]
        report = quantise(events, bar_length=Fraction(4), beat=Fraction(1),
                          divisors=(4, 3), swing=False)
        self.assertEqual(report["grid_by_bar"][0], Fraction(1, 3))
        self.assertEqual(report["grid_by_bar"][1], Fraction(1, 4))
        for event in report["events"]:
            unit = report["grid_by_bar"][int(event.start // 4)]
            self.assertEqual(event.start % unit, 0,
                             f"{event.start} is not on its own bar's grid")

    def test_a_note_shorter_than_the_grid_keeps_one_unit(self) -> None:
        report = quantise([ev(0.0, 0.02, 60)], bar_length=Fraction(4), beat=Fraction(1),
                          divisors=(4,), swing=False)
        kept = report["events"][0]
        self.assertGreater(kept.end, kept.start)

    def test_swung_eighths_are_detected_and_written_straight(self) -> None:
        events = []
        for beat in range(8):
            events.append(ev(beat, beat + 0.6, 60))
            events.append(ev(beat + 2 / 3, beat + 1.0, 64))
        self.assertTrue(detect_swing(events, Fraction(1))["swung"])
        report = quantise(events, bar_length=Fraction(4), beat=Fraction(1),
                          divisors=(4, 3), swing=None)
        offbeats = [e.start % 1 for e in report["events"] if e.start % 1 != 0]
        self.assertTrue(offbeats)
        for position in offbeats:
            self.assertEqual(position, Fraction(1, 2))

    def test_a_straight_run_is_not_called_swung(self) -> None:
        events = []
        for beat in range(8):
            events.append(ev(beat, beat + 0.5, 60))
            events.append(ev(beat + 0.5, beat + 1.0, 64))
        self.assertFalse(detect_swing(events, Fraction(1))["swung"])


class TestHandSplit(unittest.TestCase):
    def test_every_note_lands_in_exactly_one_hand(self) -> None:
        events = [ev(i * 0.5, i * 0.5 + 0.5, 48 + (i * 5) % 40) for i in range(40)]
        split = split_hands(events)
        self.assertEqual(
            sorted((e.start, e.midi) for e in split["right"] + split["left"]),
            sorted((e.start, e.midi) for e in events),
        )

    def test_the_boundary_moves(self) -> None:
        """Both hands climb an octave: a fixed middle C would put the whole
        second half in the right hand."""
        events = []
        for i in range(16):
            events.append(ev(i * 0.5, i * 0.5 + 0.5, 48 + i))       # left, C3 upwards
            events.append(ev(i * 0.5, i * 0.5 + 0.5, 72 + i))       # right, C5 upwards
        split = split_hands(events)
        boundaries = {b for _, b in split["boundary"]}
        self.assertGreater(len(boundaries), 1)
        self.assertTrue(all(e.midi >= 72 for e in split["right"]))
        self.assertTrue(all(e.midi < 72 for e in split["left"]))

    @staticmethod
    def crossing_lines() -> list[Event]:
        """One line climbing C3 to B4 while another falls C5 to C#3, alternating.

        They are the same pitch at i = 12, which is what makes it a crossing:
        a fixed middle-C boundary is wrong about half of these, and the
        interesting question is what a moving one does at the meeting point.
        """
        events = []
        for i in range(24):
            events.append(ev(i * 0.5, i * 0.5 + 0.4, 48 + i))          # the rising line
            events.append(ev(i * 0.5 + 0.25, i * 0.5 + 0.65, 72 - i))  # the falling line
        return events

    def test_crossing_lines_keep_their_hand_until_they_meet(self) -> None:
        split = split_hands(self.crossing_lines())
        left = {(e.start, e.midi) for e in split["left"]}
        for i in range(12):
            with self.subTest(i=i):
                self.assertIn((Fraction(i * 0.5).limit_denominator(1000), 48 + i), left)
                self.assertNotIn((Fraction(i * 0.5 + 0.25).limit_denominator(1000), 72 - i), left)

    def test_where_it_fails_the_two_lines_swap_hands_at_the_crossing(self) -> None:
        """Measured, not predicted, and wrong: from the note where the two
        lines are the same pitch onwards, each carries on in the *other* hand.

        Nothing in the onsets can prevent this — at the meeting the two voices
        are one pitch, and the rule has no evidence left to prefer either
        continuation. A player reading the score knows from the stems; this
        tool has no stems. The case is pinned here so that a change claiming to
        fix crossings has to change this test and say what it now does.
        """
        split = split_hands(self.crossing_lines())
        left = {(e.start, e.midi) for e in split["left"]}
        for i in range(13, 24):
            with self.subTest(i=i):
                self.assertNotIn((Fraction(i * 0.5).limit_denominator(1000), 48 + i), left)
                self.assertIn((Fraction(i * 0.5 + 0.25).limit_denominator(1000), 72 - i), left)

    def test_where_it_fails_a_simultaneous_crossing_takes_the_lower_as_the_left(self) -> None:
        """The known failure, pinned rather than only described: when the two
        voices are struck together in the same register there is nothing in the
        onset to tell them apart, and the rule takes the lower note as the left."""
        events = []
        for i in range(12):
            events.append(ev(i * 0.5, i * 0.5 + 0.5, 54 + i))
            events.append(ev(i * 0.5, i * 0.5 + 0.5, 66 - i))
        split = split_hands(events)
        for onset in {e.start for e in events}:
            left = [e.midi for e in split["left"] if e.start == onset]
            right = [e.midi for e in split["right"] if e.start == onset]
            if left and right:
                self.assertLess(max(left), min(right))

    def test_a_hand_is_not_asked_to_span_more_than_its_reach(self) -> None:
        """A five-note chord two hands can reach is cut where they can reach it.

        Not a chord they cannot: five notes over four octaves have no cut that
        leaves both hands inside a tenth, and the rule takes the least bad one
        rather than refusing — which is the right behaviour and would make this
        assertion false, so the case tested is a playable one.
        """
        events = [ev(0.0, 1.0, m) for m in (48, 55, 60, 64, 67)]
        split = split_hands(events)
        for side in ("left", "right"):
            pitches = [e.midi for e in split[side]]
            if pitches:
                self.assertLessEqual(max(pitches) - min(pitches), HAND_SPAN_SEMITONES)
        self.assertTrue(split["left"] and split["right"])


class TestRenderedInput(unittest.TestCase):
    """The round trip the 2026-09-19 rebuild was tested on, committed this time."""

    fixture = FIXTURES / "exercise.five-finger.c-major.both.mxl"

    def setUp(self) -> None:
        if not self.fixture.exists():
            self.skipTest(f"{self.fixture} is missing")

    def round_trip(self, jitter_ms: float) -> tuple[list, list, dict]:
        with tempfile.TemporaryDirectory() as tmp:
            midi = Path(tmp) / "rendered.mid"
            out = Path(tmp) / "rendered.musicxml"
            render_midi(self.fixture, midi, jitter_ms=jitter_ms)
            result = convert(midi, out, divisors=(4, 3), respell=False, force=True, hands="keep")
            return sounding(self.fixture), sounding(out), result

    def test_a_clean_rendering_keeps_every_duration(self) -> None:
        before, after, result = self.round_trip(0.0)
        # Said out loud: two empty lists are equal, and a fixture that failed to
        # load would make every assertion below vacuously true.
        self.assertGreater(len(before), 10)
        self.assertEqual(result["lost"], [])
        self.assertEqual(result["broken_bars"], [])
        self.assertEqual([(m, d) for _, m, d in after], [(m, d) for _, m, d in before])

    def test_a_jittered_rendering_round_trips_to_the_same_durations(self) -> None:
        before, after, result = self.round_trip(35.0)
        self.assertGreater(len(before), 10)
        # The quantiser must have had something to do. Without this the test
        # passed on input that was never jittered at all, which is what the
        # first version of `render_midi` produced.
        self.assertGreater(result["moved"], 0)
        self.assertEqual(result["lost"], [])
        self.assertEqual(result["broken_bars"], [])
        self.assertEqual([(m, d) for _, m, d in after], [(m, d) for _, m, d in before])


@unittest.skipUnless(have_real, real_reason)
class TestRealRecordings(unittest.TestCase):
    """The three Disklavier performances, one test method per file."""

    def one(self, name: str) -> dict:
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "out.musicxml"
            return convert(REAL_DIR / name, out, divisors=(4, 3), respell=True,
                           force=True, hands="split")

    def test_the_notes_are_in_the_second_track(self) -> None:
        for name in REAL_FILES:
            with self.subTest(name):
                self.assertEqual(track_with_the_notes(REAL_DIR / name), 1)

    def test_bach_converts_with_nothing_lost_and_every_bar_adding_up(self) -> None:
        result = self.one("bach-bwv885-prelude-2011.mid")
        self.assertEqual(result["lost"], [])
        self.assertEqual(result["broken_bars"], [])
        self.assertEqual(len(result["parts"]), 2)

    def test_grieg_converts_with_nothing_lost_and_every_bar_adding_up(self) -> None:
        result = self.one("grieg-op38-7-waltz-2014.mid")
        self.assertEqual(result["lost"], [])
        self.assertEqual(result["broken_bars"], [])
        self.assertEqual(len(result["parts"]), 2)

    def test_scarlatti_converts_with_nothing_lost_and_every_bar_adding_up(self) -> None:
        result = self.one("scarlatti-k525-2008.mid")
        self.assertEqual(result["lost"], [])
        self.assertEqual(result["broken_bars"], [])
        self.assertEqual(len(result["parts"]), 2)

    def test_no_note_is_invented_between_the_file_and_the_score(self) -> None:
        """The score holds exactly as many struck notes as the file holds Note-Ons.

        Not a spot check: reading the performance through music21's own MIDI
        parser produced **152 notes for the Bach's 129 Note-On messages**,
        because that parser marks pieces of a split note with ties whose halves
        can be bars apart, so no adjacency rule can tell one from a note struck
        again. Counting the messages is the only reading that cannot invent a
        note, and this is the assertion that says so.
        """
        for name in REAL_FILES:
            with self.subTest(name):
                messages = sum(len(t["events"]) for t in read_midi(REAL_DIR / name)["tracks"])
                self.assertGreater(messages, 100)
                self.assertEqual(self.one(name)["notes_in"], messages)

    def test_a_rubato_recording_is_not_called_swung(self) -> None:
        """None of the three is jazz, and the windows are what decides it.

        The first version of `detect_swing` used a swung window a quarter of the
        beat wide against a straight one a tenth wide, and called the Bach
        prelude and the Scarlatti sonata swung - because a wider window catches
        more onsets whatever is played. All three are wall-clock captures at a
        nominal 120 bpm nobody played to, so their off-beat positions say
        nothing at all, which is the other half of the rule.
        """
        for name in REAL_FILES:
            with self.subTest(name):
                result = self.one(name)
                self.assertFalse(result["swing"]["swung"])
                self.assertLess(result["swing"]["on_beat_share"], 0.3)

    def test_the_two_hands_are_written_as_one_braced_grand_staff(self) -> None:
        """Two `<part>` elements would be two instruments, and the app reads the
        hand off the printed staff - so a two-part file imports with both hands
        reported as the right one."""
        import tempfile as _tempfile

        with _tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "out.musicxml"
            convert(REAL_DIR / REAL_FILES[0], out, divisors=(4, 3), respell=False,
                    force=True, hands="split")
            written = out.read_text(encoding="utf-8")
        self.assertEqual(written.count("<score-part "), 1)
        self.assertIn("<staves>2</staves>", written)

    def test_the_left_hand_sits_below_the_right(self) -> None:
        for name in REAL_FILES:
            with self.subTest(name):
                result = self.one(name)
                self.assertLess(result["hand_median"]["left"], result["hand_median"]["right"])


if __name__ == "__main__":
    unittest.main()
