"""
The twelve-bar blues, built once and transposed.

The three authored blues exercises (C, F and G) are the same shape in three
keys, and the shape — a shuffle figure moved onto each chord of the form — is
what the exercise teaches. Keeping the builder here means the three modules in
content/scores/authored/ are three lines of data each, and a change to the
figure changes all three.
"""
from __future__ import annotations

from music21 import (chord, clef, harmony, instrument, interval, key, layout, metadata, meter,
                     note, pitch, stream, tempo)

#: One chord root per bar, as scale degrees of the key: I I I I IV IV I I V IV I V.
DEGREES = [0, 0, 0, 0, 5, 5, 0, 0, 7, 5, 0, 7]

#: The shuffle figure: root, fifth, sixth, fifth of the chord. Written as
#: intervals rather than semitone counts so the notes are spelled for the key --
#: the sixth of B flat is G, not F double sharp, and a semitone count cannot
#: tell the difference.
SHUFFLE = ("P1", "P5", "M6", "P5")


def roots(tonic: str) -> list[str]:
    """The twelve bars' chord roots, spelled for the key."""
    tonic_pitch = pitch.Pitch(f"{tonic}2")
    return [tonic_pitch.transpose(step).name for step in DEGREES]


def build_twelve_bar(tonic: str, bpm: float) -> stream.Score:
    score = stream.Score()
    score.insert(0, metadata.Metadata())
    score.metadata.title = f"Twelve-bar blues shuffle in {tonic}"
    score.metadata.composer = "PianoPath"

    right = stream.PartStaff(id="RH")
    left = stream.PartStaff(id="LH")
    for part, part_clef in ((right, clef.TrebleClef()), (left, clef.BassClef())):
        part.insert(0, instrument.Piano())
        part.insert(0, part_clef)
        part.insert(0, meter.TimeSignature("4/4"))
        part.insert(0, key.Key(tonic))
    right.insert(0, tempo.MetronomeMark(number=bpm))

    for bar, root in enumerate(roots(tonic)):
        base = pitch.Pitch(f"{root}2")
        for step in SHUFFLE * 2:
            left.append(note.Note(interval.Interval(step).transposePitch(base), quarterLength=0.5))
        symbol = harmony.ChordSymbol(f"{root}7")
        symbol.writeAsChord = False
        right.insert(bar * 4, symbol)
        # The chord symbol already spells the seventh correctly; move its
        # pitches bodily into the octave above middle C rather than rebuilding
        # them from semitone offsets, which loses the spelling.
        octaves = round((pitch.Pitch(f"{root}4").ps - symbol.pitches[0].ps) / 12)
        voiced = []
        for tone in symbol.pitches:
            # Shift the octave number, not the pitch: transposing by an integer
            # number of semitones lets music21 respell, and B flat 7's seventh
            # comes back as G sharp instead of A flat.
            moved = pitch.Pitch(tone.name)
            moved.octave = (tone.octave or 4) + octaves
            voiced.append(moved)
        for _ in (0, 2):
            right.append(chord.Chord(list(voiced), quarterLength=2.0))

    for part in (right, left):
        part.makeMeasures(inPlace=True)
    score.insert(0, right)
    score.insert(0, left)
    score.insert(0, layout.StaffGroup([right, left], name="Piano", symbol="brace", barTogether=True))
    return score
