"""
What `difficulty.features()` is allowed to count as a note.

Every case here was red before the fix beside it, and each is a *measurement*
fault rather than an arithmetic one: the model was fine, it was being handed
things nobody plays. The three are written up in `docs/pending-review.md`
Entry 51 (found) and Entry 53 (fixed).

The fixtures are built here rather than loaded from the library because the
point is to state the rule, not to pin today's catalog: a score built in six
lines shows exactly which element the feature is reading. The one exception is
`TestBlackBottomStompBar101`, whose pitches are transcribed from the edition's
own MusicXML, because the claim it settles is about that edition.
"""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from difficulty import features, voice_lines  # noqa: E402


def _score(staves):
    """
    A score of one or two staves, each a list of voices, each a list of
    `(offset, midis, quarterLength)`. A voice given as `None` means the staff
    has no `<voice>` markings at all, which is the common single-line case.
    """
    from music21 import chord, note, stream

    score = stream.Score()
    for voices in staves:
        part = stream.PartStaff()
        measure = stream.Measure(number=1)
        for index, events in enumerate(voices, start=1):
            container = stream.Voice(id=str(index)) if len(voices) > 1 else measure
            for offset, midis, length in events:
                element = (
                    chord.Chord([note.Note(midi=m) for m in midis])
                    if len(midis) > 1
                    else note.Note(midi=midis[0])
                )
                element.quarterLength = length
                container.insert(offset, element)
            if container is not measure:
                measure.insert(0.0, container)
        part.append(measure)
        score.insert(0.0, part)
    return score


def _lead_sheet(symbols):
    """One staff: a stepwise melody in the treble with chord symbols over it."""
    from music21 import harmony, note, stream

    score = stream.Score()
    part = stream.Part()
    measure = stream.Measure(number=1)
    for offset, midi in ((0.0, 72), (1.0, 74), (2.0, 76), (3.0, 74)):
        pitch = note.Note(midi=midi)
        pitch.quarterLength = 1.0
        measure.insert(offset, pitch)
    if symbols:
        for offset, figure in ((0.0, "C"), (2.0, "G7")):
            measure.insert(offset, harmony.ChordSymbol(figure))
    part.append(measure)
    score.insert(0.0, part)
    return score


class TestChordSymbolsAreNotNotes(unittest.TestCase):
    """
    A printed `C` over a lead sheet is a name, not four notes under the hand.

    music21's `harmony.ChordSymbol` subclasses `chord.Chord`, so every symbol
    arrived from `recurse().notes` as a chord sounding at that offset. On
    `song.classical.ah-vous-dirais-je-maman.pdmx` — sixteen bars of single-line
    melody in C — that produced four simultaneous right-hand notes, a
    ten-semitone hand and a twenty-one-semitone leap, and a level 0.76 of a
    stage too high.
    """

    def test_a_symbol_adds_no_simultaneity_span_leap_or_range(self) -> None:
        plain = features(_lead_sheet(symbols=False))
        annotated = features(_lead_sheet(symbols=True))
        for name in (
            "maxSimultaneousRight",
            "maxSpanRight",
            "maxLeapRight",
            "rangeRight",
            "notesPerBar",
            "notesPerSecond",
            "blackKeyRatio",
            "ledgerRatio",
        ):
            self.assertEqual(annotated[name], plain[name], name)

    def test_the_melody_is_what_is_measured(self) -> None:
        f = features(_lead_sheet(symbols=True))
        self.assertEqual(f["maxSimultaneousRight"], 1.0)
        self.assertEqual(f["maxSpanRight"], 0.0)
        self.assertEqual(f["maxLeapRight"], 2.0)
        self.assertEqual(f["rangeRight"], 4.0)
        self.assertEqual(f["notesPerBar"], 4.0)

    def test_there_is_no_chord_symbol_feature(self) -> None:
        # The nineteen in FEATURE_NAMES are what the fitted model weighs. A
        # twentieth would have to be fitted and ported before it meant
        # anything, so the symbols are dropped rather than counted elsewhere.
        from difficulty import FEATURE_NAMES

        self.assertNotIn("chordSymbols", FEATURE_NAMES)
        self.assertEqual(set(features(_lead_sheet(symbols=True))), set(FEATURE_NAMES))


class TestTwoVoicesOnOneStaff(unittest.TestCase):
    """
    Two voices sharing a staff are two lines, and the melodic reading must not
    step from the end of one into the start of the other.

    `part.recurse().notes` yields measure by measure and, inside a measure,
    voice 1 entirely before voice 2 — so every bar of a two-voice staff ended
    with a leap the size of the gap between the voices.
    """

    def test_a_voice_boundary_is_not_a_leap(self) -> None:
        # Two stepwise lines two octaves apart. The only 24-semitone interval
        # in this bar is the silence between them.
        staff = [[(0.0, [60], 1.0), (1.0, [62], 1.0)], [(0.0, [84], 1.0), (1.0, [86], 1.0)]]
        f = features(_score([staff]))
        self.assertEqual(f["maxLeapRight"], 2.0)

    def test_span_and_simultaneity_stay_within_a_voice(self) -> None:
        # One voice holds a fifth, the other a single note an octave above it.
        # The hand does not make a twelfth out of the two.
        staff = [[(0.0, [60, 67], 4.0)], [(0.0, [84], 4.0)]]
        f = features(_score([staff]))
        self.assertEqual(f["maxSimultaneousRight"], 2.0)
        self.assertEqual(f["maxSpanRight"], 7.0)

    def test_voice_lines_splits_and_orders(self) -> None:
        staff = [[(2.0, [62], 1.0), (0.0, [60], 1.0)], [(0.0, [84], 1.0)]]
        part = list(_score([staff]).parts)[0]
        lines = voice_lines(part)
        self.assertEqual(len(lines), 2)
        self.assertEqual([int(e.pitches[0].midi) for e in lines[0]], [60, 62])
        self.assertEqual([int(e.pitches[0].midi) for e in lines[1]], [84])


class TestTheCrossingFloor(unittest.TestCase):
    """
    A crossing is the left hand above the right. "The right hand" at an offset
    is its lowest note there — across every voice, not whichever voice music21
    walked last.
    """

    def test_the_lowest_voice_sounding_is_the_floor(self) -> None:
        # Right staff: middle C in one voice, C6 in another, together. Left
        # staff: G4 between them, so the left hand is above the right hand's
        # lowest note and the two lines have crossed.
        right = [[(0.0, [60], 4.0)], [(0.0, [84], 4.0)]]
        left = [[(0.0, [67], 4.0)]]
        self.assertEqual(features(_score([right, left]))["handCrossings"], 1.0)

    def test_a_left_hand_under_both_voices_has_not_crossed(self) -> None:
        right = [[(0.0, [60], 4.0)], [(0.0, [84], 4.0)]]
        left = [[(0.0, [48], 4.0)]]
        self.assertEqual(features(_score([right, left]))["handCrossings"], 0.0)


class TestBlackBottomStompBar101(unittest.TestCase):
    """
    The forty-three-semitone left-hand "span" is **not** a two-voice artefact,
    which is what `pending-review` Entry 51 supposed it was.

    Read out of the edition's own MusicXML, the last beat of the last bar is a
    single `<chord>` in voice 5 of staff 2: E♭2 printed together with E♭5, G5
    and B♭5. Both hands are engraved on the lower staff there. So measuring per
    voice — which this module now does — leaves the number exactly where it
    was, and this test exists to stop the next reader spending the afternoon
    Entry 51's sentence would have cost them.
    """

    #: voice 5, staff 2, bar 101, transcribed from the MusicXML: (offset, midis).
    LOWER_VOICE_5 = [
        (0.0, [58, 67], 2.0),
        (1.5, [75], 0.5),
        (2.0, [75, 79], 0.25),
        (2.25, [75, 79, 82], 0.25),
        (2.5, [39, 75, 79, 82], 1.5),
    ]
    LOWER_VOICE_6 = [(0.0, [51], 2.0), (1.0, [72], 3.0)]

    def test_the_wide_chord_is_one_element_of_one_voice(self) -> None:
        part = list(_score([[self.LOWER_VOICE_5, self.LOWER_VOICE_6]]).parts)[0]
        lines = voice_lines(part)
        self.assertEqual(len(lines), 2)
        widest = max(
            (max(int(p.midi) for p in e.pitches) - min(int(p.midi) for p in e.pitches))
            for line in lines
            for e in line
        )
        self.assertEqual(widest, 43)

    def test_measuring_per_voice_does_not_narrow_it(self) -> None:
        upper = [[(0.0, [60], 4.0)]]
        f = features(_score([upper, [self.LOWER_VOICE_5, self.LOWER_VOICE_6]]))
        self.assertEqual(f["maxSpanLeft"], 43.0)


if __name__ == "__main__":  # pragma: no cover
    unittest.main()
