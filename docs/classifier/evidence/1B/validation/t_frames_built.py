"""Sections 3-4 corrected rule on built lines: the check's failing cases and plausible counterexamples."""
from frames import *

S = lambda s: s.split()
CASES = [
    # (label, spec, expected by the page / by music)
    ("POS LH I-IV6/4-V6/5-I x2 (check case b)", ["C3 E3 G3", "C3 F3 A3", "B2 F3 G3", "C3 E3 G3"] * 2, "1 frame, linked, extended (span 10)"),
    ("POS RH I-IV6/4-V6/5-I x2", ["C4 E4 G4", "C4 F4 A4", "B3 F4 G4", "C4 E4 G4"] * 2, "1 frame"),
    ("POS LH A minor i-iv6/4-V6/5-i", ["A2 C3 E3", "A2 D3 F3", "G#2 D3 E3", "A2 C3 E3"] * 2, "1 frame"),
    ("POS LH I-IV6/4-V7(4 notes G2 B2 F3? no: B2 D3 F3 G3)-I", ["C3 E3 G3", "C3 F3 A3", "B2 D3 F3 G3", "C3 E3 G3"], "1 frame (V7 full, span 10)"),
    ("CTR LH root-position I-IV-V-I", ["C3 E3 G3", "F2 A2 C3", "G2 B2 D3", "C3 E3 G3"], "hand moves: >1 frame"),
    ("CTR LH I to I6 (C-E-G to E-G-C)", ["C3 E3 G3", "E3 G3 C4", "C3 E3 G3"], "hand moves: >1 frame"),
    ("CTR LH chord chain drifting by thirds", ["C3 E3 G3", "E3 G3 B3", "G3 B3 D4", "B3 D4 F4"], "hand moves: >1 frame"),
    ("CTR RH parallel triads C-D-E (planing)", ["C4 E4 G4", "D4 F4 A4", "E4 G4 B4"], "hand moves: >1 frame"),
    ("CHK I-vi root position (C-E-G, A-C-E)", ["C3 E3 G3", "A2 C3 E3", "C3 E3 G3"], "reading: one extended frame acceptable"),
    ("POS C position major then minor (check case a)", S("C4 D4 E4 F4 G4 F4 E4 D4 C4 D4 Eb4 F4 G4 F4 Eb4 D4 C4"), "1 frame, five-finger"),
    ("POS D position major then minor (F# and F)", S("D4 E4 F#4 G4 A4 G4 F#4 E4 D4 E4 F4 G4 A4 G4 F4 E4 D4"), "1 frame, five-finger"),
    ("CHK check's G position with F# and F below G", S("G4 A4 B4 C5 D5 C5 B4 A4 G4 F#4 G4 F4 G4"), "page claims 1 frame (reading)"),
    ("POS G position with C and C# (raised 4th neighbour)", S("G4 A4 B4 C5 D5 C#5 D5 C5 B4 A4 G4"), "1 frame"),
    ("CTR chromatic C4 to G4 up (sharps)", S("C4 C#4 D4 D#4 E4 F4 F#4 G4"), "not one five-finger frame"),
    ("CTR chromatic G4 to C4 down (flats)", S("G4 Gb4 F4 E4 Eb4 D4 Db4 C4"), "not one five-finger frame"),
    ("CTR C position then C# position (transposed up a semitone, sharps)", S("C4 D4 E4 F4 G4 F4 E4 D4 C4 C#4 D#4 E#4 F#4 G#4 F#4 E#4 D#4 C#4"), "hand moves a semitone: 2 frames"),
    ("CTR C position then Db position (flats)", S("C4 D4 E4 F4 G4 F4 E4 D4 C4 Db4 Eb4 F4 Gb4 Ab4 Gb4 F4 Eb4 Db4"), "2 frames"),
    ("CTR C major five-finger then C# minor five-finger (C#4 D#4 E4 F#4 G#4)", S("C4 D4 E4 F4 G4 F4 E4 D4 C4 C#4 D#4 E4 F#4 G#4 F#4 E4 D#4 C#4"), "2 frames"),
    ("POS broken octave 1-5-8-5 (check case c)", ["C3", "G3", "C4", "G3"] * 3, "1 frame, beyond"),
    ("POS Alberti C-G-E-G", ["C3", "G3", "E3", "G3"] * 3, "1 frame, five-finger"),
    ("CHK C major scale 1 octave up and down", S("C4 D4 E4 F4 G4 A4 B4 C5 B4 A4 G4 F4 E4 D4 C4"), "2 changes, crossing"),
    ("CHK melody D4-G4 (check case d)", S("D4 E4 F4 G4 F4 E4 D4"), "candidates C4 to D4"),
    ("POS C position melody C4-G4", S("C4 E4 G4 F4 D4 C4"), "C4 position"),
    ("CTR C position then G position, joined by a repeated G", S("C4 D4 E4 F4 G4 G4 A4 B4 C5 D5"), "a lifted shift, not a thumb-under crossing (reading)"),
    ("CTR C position then G position joined by a leap", S("C4 D4 E4 F4 G4 E4 C4 G4 A4 B4 C5 D5"), "shift"),
]
for label, spec, exp in CASES:
    evs = built(spec)
    fr = frames(evs)
    ch = changes(evs, fr)
    print(f"{label}\n   expected: {exp}\n   got: {len(fr)} frames {show(fr)}\n   changes: {[(c['index'], c['from'], c['to'], c['joined_by'], c['kind']) for c in ch]}")
