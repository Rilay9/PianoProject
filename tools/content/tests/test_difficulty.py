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

The last two classes are the duration feature's tempo (X31): the tempo
`notesPerSecond` is computed at, read back from the features. The first holds
the build to quarter notes a minute from the opening mark; the second builds the
MusicXML of `app/tests/unit/tempoFromXml.test.ts` (the app's one tempo reader)
and states, shape by shape, where music21's reading and the app's agree and
where they do not — the build keeps music21's reading, and the gap is named
here rather than closed by a second copy of the app's reader.
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


def _tempo_read(score, beats: int) -> float:
    """
    The tempo the duration feature was computed at, read back from the features.

    `notesPerSecond` is notes / (bars × beats × 60 / bpm) and `notesPerBar` is
    notes / bars, so their ratio is bpm / (beats × 60) whatever the notes are;
    `beats` is the first time signature's numerator, which is what `features`
    multiplies by. Read through the public features so a red run shows the
    number the old reading gave, not an import error.
    """
    f = features(score)
    return f["notesPerSecond"] / f["notesPerBar"] * beats * 60


def _marked(marks_by_part, *, bars: int = 1, beats: int = 4, beat_type: int = 4):
    """
    A score of one staff per entry of `marks_by_part`, `bars` bars of
    `beats`/`beat_type`, every bar full of notes of the beat type; each entry
    maps a bar number to the tempo marks standing at that bar's start.
    """
    from music21 import meter, note, stream

    score = stream.Score()
    for marks in marks_by_part:
        part = stream.PartStaff()
        for number in range(1, bars + 1):
            measure = stream.Measure(number=number)
            if number == 1:
                measure.insert(0.0, meter.TimeSignature(f"{beats}/{beat_type}"))
            for mark in marks.get(number, []):
                measure.insert(0.0, mark)
            length = 4.0 / beat_type
            for index in range(beats):
                pitch = note.Note(midi=60)
                pitch.quarterLength = length
                measure.insert(index * length, pitch)
            part.append(measure)
        score.insert(0.0, part)
    return score


class TestTheOpeningTempo(unittest.TestCase):
    """
    The duration feature's tempo is quarter notes a minute from the opening mark
    (X31; X3d's follow-up 1): music21's `getQuarterBPM()` — the mark's number
    times its beat unit's length in quarters, dots included — never the raw
    `number`, and the opening is the readable mark at the earliest offset in the
    score, not the first `recurse()` happens to meet. The app's `difficulty.ts`
    takes the first entry of the score model's map, which is in quarter notes a
    minute since X3d, so a half note = 60 read as 60 here was half the tempo the
    app computes the same feature at.
    """

    def test_a_half_note_mark_is_counted_in_quarter_notes(self) -> None:
        from music21 import tempo

        score = _marked([{1: [tempo.MetronomeMark(number=60, referent="half")]}], beats=2, beat_type=2)
        self.assertAlmostEqual(_tempo_read(score, beats=2), 120.0, places=6)

    def test_a_dotted_quarter_mark_is_counted_in_quarter_notes(self) -> None:
        from music21 import duration, tempo

        mark = tempo.MetronomeMark(number=80, referent=duration.Duration(type="quarter", dots=1))
        score = _marked([{1: [mark]}], beats=6, beat_type=8)
        self.assertAlmostEqual(_tempo_read(score, beats=6), 120.0, places=6)

    def test_the_opening_is_the_earliest_mark_not_the_first_found(self) -> None:
        # The upper staff has no mark in bar 1 and one in bar 5; the lower staff
        # has one in bar 1. `recurse()` walks the upper staff whole first, so the
        # first mark it meets is bar 5's.
        from music21 import tempo

        score = _marked(
            [{5: [tempo.MetronomeMark(number=60)]}, {1: [tempo.MetronomeMark(number=120)]}],
            bars=5,
        )
        self.assertAlmostEqual(_tempo_read(score, beats=4), 120.0, places=6)

    def test_a_file_with_no_mark_keeps_the_default(self) -> None:
        self.assertAlmostEqual(_tempo_read(_marked([{}]), beats=4), 100.0, places=6)

    def test_a_text_only_mark_keeps_the_default(self) -> None:
        # music21 gives a tempo word a number of its own ("Allegro" is 132, with
        # `numberImplicit`); the file states none, so the word is not a tempo.
        from music21 import tempo

        score = _marked([{1: [tempo.MetronomeMark("Allegro")]}])
        self.assertAlmostEqual(_tempo_read(score, beats=4), 100.0, places=6)


# The MusicXML of `app/tests/unit/tempoFromXml.test.ts`, built the same way.
_QUARTER = "<note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type></note>"
_OPENING = "<measure number=\"1\"><attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time></attributes>"


def _xml(bars, *, implicit_first: bool = False, beats: int = 4, beat_type: int = 4) -> str:
    """The app test's `score()`: one part, `bars[i]` at the start of bar i + 1, quarter notes, divisions 1."""
    quarters = beats * 4 // beat_type
    measures = []
    for index, opening in enumerate(bars):
        attributes = (
            f"<attributes><divisions>1</divisions><time><beats>{beats}</beats><beat-type>{beat_type}</beat-type></time></attributes>"
            if index == 0
            else ""
        )
        notes = _QUARTER if implicit_first and index == 0 else _QUARTER * quarters
        number = index if implicit_first else index + 1
        implicit = ' implicit="yes"' if implicit_first and index == 0 else ""
        measures.append(f'<measure number="{number}"{implicit}>{attributes}{opening}{notes}</measure>')
    return (
        '<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><part-list>'
        '<score-part id="P1"><part-name>Piano</part-name></score-part></part-list>'
        f'<part id="P1">{"".join(measures)}</part></score-partwise>'
    )


def _metronome(unit: str, per_minute: str, dots: int = 0) -> str:
    return f"<metronome><beat-unit>{unit}</beat-unit>{'<beat-unit-dot/>' * dots}<per-minute>{per_minute}</per-minute></metronome>"


def _direction(types: str, inner: str = "") -> str:
    return f'<direction placement="above"><direction-type>{types}</direction-type>{inner}</direction>'


def _sound(bpm) -> str:
    return f'<sound tempo="{bpm}"/>'


def _rest(quarters: int) -> str:
    return f"<note><rest/><duration>{quarters}</duration><voice>1</voice></note>"


def _app_shapes() -> dict[str, tuple[str, int, float, float]]:
    """
    name → (the MusicXML, the time signature's numerator, the app's opening
    tempo, the build's). The app's number is `openingTempo(xml) ?? 100` as
    `tempoFromXml.test.ts` asserts it for that shape; the build's is music21's.
    """
    cue = "<note><cue/><pitch><step>G</step><octave>4</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type></note>"
    # The app's fixture leaves P2 out of the part-list; music21 then drops the
    # part whole, so the entry is added here for both readers to see both parts.
    two_parts =_xml([_direction(_metronome("quarter", "60"), _sound(60))]).replace(
        "</part></score-partwise>",
        '</part><part id="P2"><measure number="1"><attributes><divisions>2</divisions></attributes>'
        f"{_sound(70)}<forward><duration>4</duration></forward>{_sound(84)}<forward><duration>4</duration></forward>"
        "</measure></part></score-partwise>",
    ).replace(
        '<score-part id="P1"><part-name>Piano</part-name></score-part>',
        '<score-part id="P1"><part-name>Piano</part-name></score-part><score-part id="P2"><part-name>Piano</part-name></score-part>',
    )
    shapes: dict[str, tuple[str, int, float, float]] = {
        # The reviewer's shapes and the normalisation table, a mark alone or with its sound.
        "half = 60 with sound 120, cut time": (_xml([_direction(_metronome("half", "60"), _sound(120))], beats=2, beat_type=2), 2, 120, 120),
        "half = 60 alone, cut time": (_xml([_direction(_metronome("half", "60"))], beats=2, beat_type=2), 2, 120, 120),
        "dotted quarter = 60 with sound 90, 6/8": (_xml([_direction(_metronome("quarter", "60", 1), _sound(90))], beats=6, beat_type=8), 6, 90, 90),
        "eighth = 120 alone": (_xml([_direction(_metronome("eighth", "120"))]), 4, 60, 60),
        "whole = 30 alone": (_xml([_direction(_metronome("whole", "30"))]), 4, 120, 120),
        "16th = 240 alone": (_xml([_direction(_metronome("16th", "240"))]), 4, 60, 60),
        "breve = 10 alone": (_xml([_direction(_metronome("breve", "10"))]), 4, 80, 80),
        "dotted half = 61 alone": (_xml([_direction(_metronome("half", "61", 1))]), 4, 183, 183),
        "dotted eighth = 120 alone": (_xml([_direction(_metronome("eighth", "120", 1))]), 4, 90, 90),
        "double-dotted quarter = 40 alone": (_xml([_direction(_metronome("quarter", "40", 2))]), 4, 70, 70),
        # A <sound tempo> alone: standing in the bar, or in a tempo word's direction.
        "a sound alone in the bar, 72.5": (_xml([_sound(72.5)]), 4, 72.5, 72.5),
        "a tempo word with its sound, 132": (_xml([_direction("<words>Allegro</words>", _sound(132))]), 4, 132, 132),
        # Fractions kept (the second is equal to a millionth: music21 reads the mark, 100.5).
        "quarter = 90.00009000009 with its sound": (_xml([_direction(_metronome("quarter", "90.00009000009"), _sound("90.00009000009"))]), 4, 90.00009000009, 90.00009000009),
        "dotted quarter = 67 with sound 100.49999999999999": (_xml([_direction(_metronome("quarter", "67", 1), _sound("100.49999999999999"))]), 4, 100.49999999999999, 100.5),
        # Positions: a visual offset, a sounding one after an opening sound; every part, the first first.
        "a visual offset": (_xml([_direction(_metronome("quarter", "60"), f"<offset>2</offset>{_sound(60)}")]), 4, 60, 60),
        "an opening sound, then a sounding offset": (_xml([_sound(50) + _direction(_metronome("quarter", "60"), f'<offset sound="yes">2</offset>{_sound(60)}')]), 4, 50, 50),
        "two parts at one place: the first part's": (two_parts, 4, 60, 60),
        # Not tempos, on both sides: the default.
        "a metric modulation": (_xml([_direction("<metronome><beat-unit>quarter</beat-unit><beat-unit>eighth</beat-unit><beat-unit-dot/></metronome>")]), 4, 100, 100),
        "the metronome-note form": (_xml([_direction("<metronome><metronome-note><metronome-type>quarter</metronome-type></metronome-note><metronome-relation>equals</metronome-relation><metronome-note><metronome-type>eighth</metronome-type></metronome-note></metronome>")]), 4, 100, 100),
        "a mark with no number": (_xml([_direction("<metronome><beat-unit>quarter</beat-unit><per-minute>fast</per-minute></metronome>")]), 4, 100, 100),
        "a range": (_xml([_direction(_metronome("quarter", "100-110"))]), 4, 100, 100),
        "a tempo word alone": (_xml([_direction("<words>Allegro</words>")]), 4, 100, 100),
        "a sound in a comment": (_xml([f"<!-- {_sound(99)} -->"]), 4, 100, 100),
        "no tempo at all": (_xml([""]), 4, 100, 100),
        # The opening.
        "an opening sound, a mark in bar 2": (_xml([_sound(100), _direction(_metronome("quarter", "132"), _sound(132))]), 4, 100, 100),
        "a tempo after an opening rest (the Fifth's shape)": (_xml(["", ""]).replace(_OPENING + _QUARTER * 4, f"{_OPENING}{_rest(1)}{_direction('<words>Allegro con brio</words>', _sound(164))}{_QUARTER * 3}"), 4, 164, 164),
        "a mark on bar 2 after a cue note and rests": (_xml(["", _direction(_metronome("quarter", "72"), _sound(72))]).replace(_OPENING + _QUARTER * 4, f"{_OPENING}{cue}{_rest(3)}"), 4, 72, 72),
        "E48's form: a sound opening bar 1, a mark in bar 2": (_xml(["", _direction(_metronome("quarter", "132"), _sound(132))]).replace('<measure number="1">', f'<measure number="1">{_sound(72)}'), 4, 72, 72),
        # Where music21 and the app part ways (the build keeps music21's reading; X31's entry counts the corpus).
        "a mark and a sound that disagree in one direction": (_xml([_direction(_metronome("half", "60"), _sound(100))]), 4, 100, 120),
        "a sound standing beside a mark at one place (E32's form)": (_xml([f"{_direction(_metronome('quarter', '132'))}{_sound(100)}"]), 4, 100, 132),
        "a pickup whose mark and sound disagree": (_xml([_direction(_metronome("quarter", "60", 1), _sound(70)), _sound(90), ""], implicit_first=True), 4, 70, 90),
        "'c. 108'": (_xml([_direction(_metronome("quarter", "c. 108"))]), 4, 108, 100),
        "a mark only in bar 2": (_xml(["", _direction(_metronome("quarter", "132"), _sound(132))]), 4, 100, 132),
        "a tempo after the first note of bar 1": (_xml([""]).replace(_OPENING, f"{_OPENING}{_QUARTER}{_sound(90)}"), 4, 100, 90),
        "an upbeat before bar 1's tempo": (_xml(["", _direction(_metronome("quarter", "60", 1), _sound(90)), ""], implicit_first=True), 4, 100, 90),
    }
    return shapes


#: Where music21's reading and the app's differ, and why. Each is music21's
#: MusicXML reader or the app's opening rule, never a Python choice: a sound in a
#: direction that also holds a `<metronome>` is dropped (music21's `xmlDirection`:
#: "avoiding doubled metronomes"), so the mark wins where the app's sound does;
#: two tempos at one offset go to the first in the file; "c." before a number is
#: not read; and the app opens at its default until a tempo written after a note
#: has sounded, where the build takes the earliest mark anywhere.
_GAPS = {
    "a mark and a sound that disagree in one direction": "music21 drops the sound in a direction that holds a mark",
    "a sound standing beside a mark at one place (E32's form)": "two tempos at one offset: music21's first in the file is the mark; the app's sound wins",
    "a pickup whose mark and sound disagree": "music21 drops the sound in a direction that holds a mark",
    "'c. 108'": "music21 reads no number from 'c. 108'",
    "a mark only in bar 2": "the app opens at its default before a tempo written after notes have sounded",
    "a tempo after the first note of bar 1": "the app opens at its default before a tempo written after notes have sounded",
    "an upbeat before bar 1's tempo": "the app opens at its default before a tempo written after notes have sounded",
}


class TestTheAppsTempoShapes(unittest.TestCase):
    """
    What music21 makes of the MusicXML the app's tempo reader is tested on
    (`app/tests/unit/tempoFromXml.test.ts`, X3d), read through the build's
    duration feature. The three forms the reviewer named — a `<metronome>` with
    a beat unit and dots, a `<sound tempo>` alone, both in one direction — agree
    wherever the file agrees with itself; `_GAPS` is where they do not.
    """

    maxDiff = None

    @classmethod
    def setUpClass(cls) -> None:
        from music21 import converter

        cls.shapes = _app_shapes()
        cls.read = {
            name: round(_tempo_read(converter.parseData(xml, format="musicxml"), beats=beats), 6)
            for name, (xml, beats, _app, _build) in cls.shapes.items()
        }

    def test_the_build_reads_each_shape_as_music21_does(self) -> None:
        self.assertEqual(self.read, {name: round(build, 6) for name, (_x, _b, _app, build) in self.shapes.items()})

    def test_the_build_and_the_app_differ_only_where_named(self) -> None:
        differ = {name: (self.read[name], app) for name, (_x, _b, app, _build) in self.shapes.items() if abs(self.read[name] - app) > 1e-6}
        self.assertEqual(sorted(differ), sorted(_GAPS), differ)


if __name__ == "__main__":  # pragma: no cover
    unittest.main()
