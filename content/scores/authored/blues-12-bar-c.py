"""
A twelve-bar blues in C: shuffle bass under seventh chords.

Written as a module rather than in ABC because the point of the exercise is
the *pattern* — the same two-bar shuffle figure moved onto each chord of the
form — and saying that in code is shorter and less error-prone than typing out
forty-eight bars of ABC.

docs/02-curriculum.md Part D's blues ladder starts here: the left hand alone,
then hands together, then the same shape in F and G.
"""
from __future__ import annotations

from music21 import chord, clef, harmony, instrument, key, layout, metadata, meter, note, pitch, stream, tempo

PIANOPATH = {
    "id": "exercise.blues.twelve-bar-shuffle.c",
    "title": "Twelve-bar blues shuffle in C",
    "level": 3.4,
    "hands": "both",
    "tracks": "blues-boogie,improv-compose",
    "concepts": "12-bar-blues,shuffle,dominant-7th,I-IV-V",
    "license": "CC0",
    "genre": "blues",
    "tempoBpm": 88,
    "abrsm": 2,
}

#: The twelve-bar form: one chord root per bar.
FORM = ["C", "C", "C", "C", "F", "F", "C", "C", "G", "F", "C", "G"]

#: A shuffle figure is the root, fifth, sixth, fifth of the chord, in
#: semitones. Played as swung eighths, which is what the triplet feel below
#: writes out.
SHUFFLE = [0, 7, 9, 7]


def build() -> stream.Score:
    score = stream.Score()
    score.insert(0, metadata.Metadata())
    score.metadata.title = PIANOPATH["title"]
    score.metadata.composer = "PianoPath"

    right = stream.PartStaff(id="RH")
    left = stream.PartStaff(id="LH")
    for part, part_clef in ((right, clef.TrebleClef()), (left, clef.BassClef())):
        part.insert(0, instrument.Piano())
        part.insert(0, part_clef)
        part.insert(0, meter.TimeSignature("4/4"))
        part.insert(0, key.Key("C"))
    right.insert(0, tempo.MetronomeMark(number=PIANOPATH["tempoBpm"]))

    for bar, root in enumerate(FORM):
        base = pitch.Pitch(f"{root}2")
        # Left hand: the shuffle, twice a bar.
        for step in SHUFFLE * 2:
            left.append(note.Note(base.transpose(step), quarterLength=0.5))
        # Right hand: the seventh chord on beats 1 and 3, so the harmony is
        # audible under a first attempt at improvising over it.
        symbol = harmony.ChordSymbol(f"{root}7")
        symbol.writeAsChord = False
        right.insert(bar * 4, symbol)
        for beat in (0, 2):
            seventh = chord.Chord(
                [pitch.Pitch(f"{root}4").transpose(i) for i in (0, 4, 7, 10)], quarterLength=2.0
            )
            right.append(seventh)
            del beat

    for part in (right, left):
        part.makeMeasures(inPlace=True)
    score.insert(0, right)
    score.insert(0, left)
    score.insert(0, layout.StaffGroup([right, left], name="Piano", symbol="brace", barTogether=True))
    return score
