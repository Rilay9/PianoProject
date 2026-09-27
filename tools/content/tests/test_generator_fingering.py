"""
Fingerings on melodic lines — the ones `confirm_fingering` cannot see.

`finalize` checks every *chord* for a finger on two notes or a crossed hand.
A scale, an arpeggio, a bass line and a chromatic run are melodies, and a
wrong finger on a melody ships silently: the file is valid, the notes are
right, and the learner practises a hand that crosses itself. These are the
faults the 2026-09-14 review found by reading the tables — sixty arpeggios
with the thumb on a black key, sixteen walking basses with the thumb on the
lowest note of the bar, twelve chromatic runs whose left hand was a right
hand — each held here to the rule it broke.

And the one the 2026-09-26 pass found (T53, G41): every two-octave left hand
on a white root went 5-3-2-**5**-3-2-1, finger 5 straight after 2 at the
octave join, and every right hand on a black root put finger 2 on two notes a
fourth apart, because one construction gave every root the first root's
finger. The old assertions here encoded both, so they passed. The truth is
now a published chart, read key by key (`KELLEY_CHART`); the rules below it
— no finger on two different notes in a row, a hand crossing only at the
thumb, finger 5 only where the line starts, turns or stops, the thumb on a
black key only where the chord has no white one, the notes spelled for the
key — are guards against a future table, never a substitute for the chart.
The authored *Ode to Joy (full theme)* is held to the same hand at its bar 12.

T53b carried the same discipline to three things T53 left (G43, G44, G47).
The B♭ minor two- and three-octave scales put finger 2 on each B♭ inside the
run, straight after 3 on the A below it, because the scale join gave every
inner tonic the finger the one-octave table starts on; Clementi, whose
edition the scale tables already follow, prints 4 there, and so does Kelley's
scale chart. The broken sevenths were spelled by semitone count (E major 7th
with an E♭, A♭7 in sharps); they now take their notes from the arpeggios'
own interval contract, and the two makers are held to spell every chord
alike. And the white-root seventh arpeggios printed a fingering marked
verified that no source had been read for; the fingering is now a published
one (`MCLAIN_SEVENTH_ASCENT`), transcribed here apart from the generator.

T53c took three more (G48, G49, G45). G♯ natural minor, both ways, and G♯
melodic minor coming down put the left thumb on F♯, because `make_scale`
fingered every minor form from the harmonic table, whose thumb falls on F𝄪;
each of the four minor forms now has its table, and G♯ minor's left hand is
held to Kelley's chart and Clementi's run (`KELLEY_G_SHARP_MINOR`,
`CLEMENTI_G_SHARP_MINOR_LH`). The broken sevenths printed a fingering no
source gives while their flag said unverified; they now print none. And the
chromatic scale from E began the left hand on the thumb twice; it is held to
McLain's chromatic figure (`MCLAIN_CHROMATIC_FROM_C`).
"""
from __future__ import annotations

import re
import sys
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from music21 import articulations, converter, interval, key, note, pitch  # noqa: E402

import generate_exercises as G  # noqa: E402
from abc_tools import apply_fingerings, extract_fingerings, prepare_abc  # noqa: E402
from generate_exercises import (  # noqa: E402
    BLACK_PITCH_CLASSES,
    HARMONIC_MINOR_FINGERING,
    MAJOR_KEYS,
    MINOR_KEYS,
    ScaleSpec,
    chromatic_finger,
    default_plan,
    is_black_root,
    make_arpeggio,
    make_broken_seventh,
    make_chromatic,
    make_scale,
    make_seventh_arpeggio,
    make_tumbao,
    make_walking_bass,
    walking_bass_fingers,
)

REPO = Path(__file__).resolve().parents[3]


def fingered_notes(sc, part_id: str) -> list[tuple[pitch.Pitch, int | None]]:
    """(pitch, finger) for every note of one staff, in order."""
    part = next(p for p in sc.parts if p.id == part_id)
    out = []
    for element in part.recurse().notes:
        if not isinstance(element, note.Note):
            continue
        fingers = [a.fingerNumber for a in element.articulations if isinstance(a, articulations.Fingering)]
        out.append((element.pitch, fingers[0] if fingers else None))
    return out


# --------------------------------------------------------------------------------------
# the arpeggios' source: one chart, as its page prints it
# --------------------------------------------------------------------------------------

#: Robert Kelley, "Arpeggio Fingering Chart for Piano, Organ, or Electric
#: Keyboard", read 2026-09-26 at
#: https://robertkelleyphd.com/home/teaching/keyboard/keyboard-arpeggio-fingering-chart/
#:
#: Transcribed the way the page groups it — a pattern, then the keys under it —
#: and kept apart from the generator's own table on purpose: a slip in either
#: transcription is a disagreement here. Each pattern is four fingers going up,
#: root, third, fifth and the root an octave higher, and the page's rules say
#: how to read it over more octaves: "The arpeggio fingering pattern repeats
#: every three notes, so that every octave has the same fingering", and "The
#: fifth finger is only used at a starting place, a stopping place, or a
#: turning-around place."
KELLEY_CHART = {
    "RH 1231": "C Major, D Major, E Major, F Major, G Major, A Major, B Major, F♯/G♭ Major, "
               "A minor, B minor, C minor, D minor, E minor, F minor, G minor, D♯/E♭ minor",
    "RH 2124": "C♯/D♭ major, E♭ major, A♭ major, B♭ major, C♯ minor, F♯ minor, G♯/A♭ minor",
    "RH 2312": "B♭/A♯ minor",
    "LH 1421": "C major, F major, G major, A minor, B minor, C minor, D minor, E minor, F minor, "
               "G minor, D♯/E♭ minor",
    "LH 1321": "D major, E major, A major, B major, F♯/G♭ major",
    "LH 2142": "C♯/D♭ major, E♭ major, A♭ major, C♯ minor, F♯ minor, G♯/A♭ minor",
    "LH 3213": "B♭ major, B♭/A♯ minor",
}

#: "The thumb always stays on the white keys, except when there are no white
#: keys (F♯/G♭ major and D♯/E♭ minor)" — the page's second rule, in the
#: generator's spelling.
NO_WHITE_KEY = {("G-", "major"), ("E-", "minor")}


def chart_by_key() -> dict[tuple[str, str], dict[str, str]]:
    """`{(root, quality): {"RH": pattern, "LH": pattern}}` in music21 spelling."""
    out: dict[tuple[str, str], dict[str, str]] = {}
    for heading, keys in KELLEY_CHART.items():
        hand, pattern = heading.split()
        for name in keys.split(", "):
            names, quality = name.rsplit(" ", 1)
            quality = quality.lower()
            wanted = MAJOR_KEYS if quality == "major" else MINOR_KEYS
            spelled = [n.replace("♯", "#").replace("♭", "-") for n in names.split("/")]
            root = next(n for n in spelled if n in wanted)
            slot = out.setdefault((root, quality), {})
            assert hand not in slot, f"{name} is under two {hand} patterns"
            slot[hand] = pattern
    return out


def read_the_chart(pattern: str, hand: str, octaves: int) -> list[int]:
    """
    The ascent a pattern gives over `octaves`, read by the page's rules.

    Every root after the first takes the last digit ("every octave has the
    same fingering"), and the thumb is replaced by the fifth finger at the
    left hand's starting place and the right hand's turning-around place.
    """
    digits = [int(d) for d in pattern]
    ascent = digits[:1] + digits[1:] * octaves
    if hand == "LH" and ascent[0] == 1:
        ascent[0] = 5
    if hand == "RH" and ascent[-1] == 1:
        ascent[-1] = 5
    return ascent


def ascent(notes: list[tuple[pitch.Pitch, int | None]]) -> list[tuple[pitch.Pitch, int | None]]:
    """The notes from the first to the highest, inclusive."""
    top = max(range(len(notes)), key=lambda i: notes[i][0].ps)
    return notes[: top + 1]


# --------------------------------------------------------------------------------------
# the seventh arpeggios' source (T53b, G47)
# --------------------------------------------------------------------------------------

#: Margaret Starr McLain, *Class Piano* (Bloomington: Indiana University Press,
#: 1974), chapter 9, "Diatonic Scales with Standard Fingering, concluded", the
#: section "Fingering for Seventh Chord Arpeggios"; read 2026-09-27 in the
#: press's open-access edition (CC BY-NC-ND 4.0) at
#: https://publish.iupress.indiana.edu/read/class-piano/section/f039d7d1-597f-4b17-87bd-95408ef56d20
#:
#: The book gives one rule for every form of seventh-chord arpeggio — dominant,
#: major, minor, half-diminished and diminished alike: from a white key, the left
#: hand going up plays 5 4 3 2 1 4 3 2 1 and the right hand 1 2 3 4 1 2 3 4 5,
#: two octaves, every finger used, the left hand starting and the right hand
#: ending on the fifth finger. Kept apart from the generator's tables on purpose,
#: as `KELLEY_CHART` is. Corroborated for the dominant and diminished sevenths by
#: S. Torkelson's fingering sheet for Wartburg College,
#: https://vip.wartburg.edu/musicdept/fandp.pdf, which prints the same fingers
#: with the thumb at both ends (RH 1 2 3 4 1 2 3 4 1, LH 1 4 3 2 1 4 3 2 1). The
#: book gives the way up; the way down is its mirror, the top note once, as the
#: triads are read.
MCLAIN_SEVENTH_ASCENT = {
    "RH": [1, 2, 3, 4, 1, 2, 3, 4, 5],
    "LH": [5, 4, 3, 2, 1, 4, 3, 2, 1],
}


def seventh_source_faults(sc, entry: dict) -> list[str]:
    """Where a white-root seventh arpeggio's print differs from the book, up and back."""
    faults = []
    for part_id, wanted_up in MCLAIN_SEVENTH_ASCENT.items():
        printed = [f for _, f in fingered_notes(sc, part_id)]
        if not printed:
            continue
        wanted = wanted_up + list(reversed(wanted_up))[1:]
        if printed != wanted:
            faults.append(f"{part_id} prints {printed}, the source reads {wanted}")
    return faults


# --------------------------------------------------------------------------------------
# the B♭ minor scale's right hand (T53b, G43)
# --------------------------------------------------------------------------------------

#: Clementi, Op. 42, in the Mutopia typeset — the source the scale tables name
#: (`content/sources/clementi-op42-fingering.json`, at the revision it pins,
#: 2144afd) — as engraved: the right hand of `inlineScaleBesMin` in
#: `ftp/ClementiM/O42/clementi-op42/clementi-op42-lys/ilys/clementi-op42-p1-18-scales.ily`,
#: read 2026-09-27. Two octaves of B♭ melodic minor, up and back; a number
#: after `_` or `-` is a printed finger. The committed extraction reads only the
#: first octave, so it never saw the join. Here the edition prints 4 on the B♭
#: inside the run on the way down, and on the way up the fingers step from the
#: thumb on F to the thumb on C: 1, 2, 3, 4.
CLEMENTI_B_FLAT_MINOR_RH = (
    "bes16_2 c_1 des ees f_1 g! a! bes c-1 des ees f-1 g! a! bes aes! "
    "ges! f ees-3 des c bes_4 aes ges f ees_3 des c bes4_2"
)

#: Robert Kelley, "Scale Fingering Chart for Piano, Organ, or Electric Keyboard",
#: https://robertkelleyphd.com/home/keyboard-scale-fingering-chart/ (the chart,
#: read 2026-09-27): A♯/B♭ minor's right hand is 41231234 in the natural, the
#: harmonic and the melodic column alike. The page's first rule is that the
#: fingering alternates 123 and 1234 "so that the same fingering pattern repeats
#: every octave", so the pattern's last digit is the finger on every B♭ after
#: the first.
KELLEY_B_FLAT_MINOR_RH = "41231234"

#: What the right hand prints going up, read from both: Clementi's printed
#: start on 2 (Kelley starts on 4; either is a place to begin), then Kelley's
#: pattern, with 4 on every B♭ after the first — Clementi's 4 on the inner B♭.
B_FLAT_MINOR_RH_ASCENT = {
    1: [2, 1, 2, 3, 1, 2, 3, 4],
    2: [2, 1, 2, 3, 1, 2, 3, 4, 1, 2, 3, 1, 2, 3, 4],
    3: [2, 1, 2, 3, 1, 2, 3, 4, 1, 2, 3, 1, 2, 3, 4, 1, 2, 3, 1, 2, 3, 4],
}

LILYPOND_STEPS = {"c": "C", "d": "D", "e": "E", "f": "F", "g": "G", "a": "A", "b": "B"}
LILYPOND_ACCIDENTALS = {"": "", "es": "-", "is": "#", "eses": "--", "isis": "##"}


def read_lilypond(line: str) -> list[tuple[str, int | None]]:
    """(the note's name in music21's spelling, its printed finger or None), note by note."""
    out = []
    for token in line.split():
        match = re.fullmatch(r"([a-g])((?:es|is){0,2})!?\d*\.?(?:[_-](\d))?", token)
        assert match, token
        name = LILYPOND_STEPS[match.group(1)] + LILYPOND_ACCIDENTALS[match.group(2)]
        out.append((name, int(match.group(3)) if match.group(3) else None))
    return out


# --------------------------------------------------------------------------------------
# the G♯ minor scales' left hand (T53c, G48)
# --------------------------------------------------------------------------------------

#: Robert Kelley's scale chart (the page `KELLEY_B_FLAT_MINOR_RH` names; the chart
#: image read 2026-09-27): G♯/A♭ minor as its three minor columns print it. The
#: melodic column is headed "(ascending)"; there is no descending one, because the
#: melodic minor comes down through the natural minor's notes and the natural
#: column fingers them. The harmonic left hand puts its thumb on the seventh,
#: F𝄪, a white key; the natural left hand keeps it off the natural seventh, F♯.
KELLEY_G_SHARP_MINOR = {
    "natural": {"RH": "34123123", "LH": "32132143"},
    "harmonic": {"RH": "34123123", "LH": "32143213"},
    "melodic (ascending)": {"RH": "34123123", "LH": "32143213"},
}

#: Which of the chart's columns fingers each form going up and coming down.
G_SHARP_MINOR_COLUMNS = {
    "harmonic": ("harmonic", "harmonic"),
    "natural": ("natural", "natural"),
    "melodic": ("melodic (ascending)", "natural"),
}

#: Clementi, Op. 42 (Mutopia, as for B♭ minor), the left hand of
#: `inlineScaleGisMin`, verbatim: G♯ melodic minor up an octave and a fifth with
#: E♯ and F𝄪, back down through the natural minor's F♯ and E (engraved `fis!` and
#: `e!`) to the F𝄪 below the start, and home. Every finger of the first octave up
#: is printed; coming down he prints the thumb on E and on B, never on F♯.
CLEMENTI_G_SHARP_MINOR_LH = (
    "gis16-3 ais-2 b-1 cis-4 dis-3 eis-2 fisis-1 gis-3 ais b cis-3 dis-2 "
    "cis-3 b-1 ais gis fis! e!-1 dis cis b-1 ais gis fisis-4 gis2.-3"
)


def read_scale_pattern(pattern: str, octaves: int) -> list[int]:
    """
    The ascent a scale chart's pattern gives over `octaves`.

    Kelley's first rule: the fingering "repeats every octave", so every tonic
    after the first takes the pattern's last digit. For these G♯ minor patterns
    the first and last digits agree, so no inner tonic needs a finger of its own.
    """
    digits = [int(d) for d in pattern]
    return digits[:1] + digits[1:] * octaves


#: The five items G48 is about, their left hands as printed up and back, read
#: from the chart by the rule above: the natural form's 32132143 both ways, and
#: the melodic form's 32143213 going up and the natural form's coming down.
G_SHARP_MINOR_LH = {
    "exercise.scale.g-sharp-natural-minor.1oct.similar.both.2":
        [3, 2, 1, 3, 2, 1, 4, 3, 4, 1, 2, 3, 1, 2, 3],
    "exercise.scale.g-sharp-natural-minor.2oct.similar.both.2":
        [3, 2, 1, 3, 2, 1, 4, 3, 2, 1, 3, 2, 1, 4, 3, 4, 1, 2, 3, 1, 2, 3, 4, 1, 2, 3, 1, 2, 3],
    "exercise.scale.g-sharp-melodic-minor.1oct.similar.left.2":
        [3, 2, 1, 4, 3, 2, 1, 3, 4, 1, 2, 3, 1, 2, 3],
    "exercise.scale.g-sharp-melodic-minor.1oct.similar.both.2":
        [3, 2, 1, 4, 3, 2, 1, 3, 4, 1, 2, 3, 1, 2, 3],
    "exercise.scale.g-sharp-melodic-minor.2oct.similar.both.2":
        [3, 2, 1, 4, 3, 2, 1, 3, 2, 1, 4, 3, 2, 1, 3, 4, 1, 2, 3, 1, 2, 3, 4, 1, 2, 3, 1, 2, 3],
}

#: Scale steps in semitones, tonic to tonic, for each minor form's table.
MINOR_FORM_STEPS = {
    "harmonic": [0, 2, 3, 5, 7, 8, 11, 12],
    "natural": [0, 2, 3, 5, 7, 8, 10, 12],
    "melodic ascending": [0, 2, 3, 5, 7, 9, 11, 12],
    "melodic descending": [0, 2, 3, 5, 7, 8, 10, 12],
}


# --------------------------------------------------------------------------------------
# the chromatic scale (T53c, G45)
# --------------------------------------------------------------------------------------

#: Margaret Starr McLain, *Class Piano* (the edition `MCLAIN_SEVENTH_ASCENT`
#: names), chapter 9, "Chromatic Scale Fingering", read 2026-09-27: the figure,
#: C up to C, each hand's finger as printed. The rule under it: black keys take
#: the third finger, single white keys the thumb, and each pair of neighbouring
#: white keys 1 and 2, the pairs being the only place the two hands differ.
#: Indexed by pitch class from C.
MCLAIN_CHROMATIC_FROM_C = {
    "RH": [2, 3, 1, 3, 1, 2, 3, 1, 3, 1, 3, 1, 2],
    "LH": [1, 3, 1, 3, 2, 1, 3, 1, 3, 1, 3, 2, 1],
}


def chromatic_source_faults(sc) -> list[str]:
    """
    Where a chromatic scale's print differs from the book's finger for each key.

    One allowance, the first note of a run: the right hand's 2 is on the upper
    white of a pair (F, C), so a right hand that starts there starts without
    the pair's lower note and begins on the thumb, as the scale tables let a
    run's first note be fingered for a hand that starts there. The left hand's
    2 is on the lower white (E, B), whose partner is the very next note, so it
    has no such allowance. The crossing guard runs over the same notes.
    """
    faults = []
    for part_id in ("RH", "LH"):
        notes = fingered_notes(sc, part_id)
        if not notes or all(f is None for _, f in notes):
            continue
        for index, (p, finger) in enumerate(notes):
            wanted = MCLAIN_CHROMATIC_FROM_C[part_id][p.pitchClass]
            if index == 0 and part_id == "RH" and p.pitchClass in (0, 5):
                wanted = 1
            if finger != wanted:
                faults.append(f"{part_id} {p.nameWithOctave}({finger}): the book's figure gives {wanted}")
        faults += crossing_faults(notes, part_id)
    return faults


# --------------------------------------------------------------------------------------
# the guards: what no fingering of these shapes may do, whatever the chart says
# --------------------------------------------------------------------------------------


def crossing_faults(notes: list[tuple[pitch.Pitch, int | None]], hand: str) -> list[str]:
    """
    Two neighbouring notes a hand cannot take as printed.

    One finger on two different notes in a row; and a hand crossing itself
    anywhere but at the thumb. Fingers lie across the hand in order, so going
    up the right hand's numbers rise and the left hand's fall; the only way
    against that order is the thumb passing under, or 2, 3 or 4 crossing over
    the thumb. Finger 5 never crosses. This is `fingerscan.py`'s two rules
    from Entry 82 (the same finger; the left hand's finger rising on a rising
    line) made one rule for both hands and both directions.
    """
    faults = []
    for (p1, f1), (p2, f2) in zip(notes, notes[1:]):
        if f1 is None or f2 is None or p1.ps == p2.ps:
            continue
        where = f"{p1.nameWithOctave}({f1}) {p2.nameWithOctave}({f2})"
        if f1 == f2:
            faults.append(f"{hand} {where}: one finger on two different notes")
            continue
        rising = p2.ps > p1.ps
        with_the_hand = (f2 > f1) if (hand == "RH") == rising else (f2 < f1)
        if with_the_hand:
            continue
        thumb_under = f2 == 1
        over_the_thumb = f1 == 1 and f2 in (2, 3, 4)
        if not (thumb_under or over_the_thumb):
            faults.append(f"{hand} {where}: the hand crosses itself away from the thumb")
    return faults


def fifth_finger_faults(notes: list[tuple[pitch.Pitch, int | None]], hand: str) -> list[str]:
    """
    Finger 5 anywhere but where the line starts, turns or stops.

    The chart's third rule. On an up-and-back arpeggio those places are its
    lowest and highest notes, so this is the brief's "finger 5 mid-ascent in
    the left hand's rising pattern", and its mirror in the right hand, as one
    rule.
    """
    sounding = [p.ps for p, _ in notes]
    low, high = min(sounding), max(sounding)
    return [f"{hand} {p.nameWithOctave}(5): finger 5 in the middle of the run"
            for p, f in notes if f == 5 and p.ps not in (low, high)]


def thumb_on_black_faults(notes, root: str, quality: str, hand: str) -> list[str]:
    """The thumb on a black key, unless the chord has no white key at all."""
    if (root, quality) in NO_WHITE_KEY:
        return []
    return [f"{hand} {p.nameWithOctave}(1): thumb on a black key"
            for p, f in notes if f == 1 and p.pitchClass in BLACK_PITCH_CLASSES]


#: The seventh shapes as intervals, the test's own copy: a seventh chord is
#: spelled in stacked thirds from its root, whatever its semitones.
SEVENTH_INTERVALS = {
    "dominant7": ("P1", "M3", "P5", "m7"),
    "diminished7": ("P1", "m3", "d5", "d7"),
    "major7": ("P1", "M3", "P5", "M7"),
    "minor7": ("P1", "m3", "P5", "m7"),
    "half-diminished7": ("P1", "m3", "d5", "m7"),
}

#: The four white keys that can wear an accidental. A seventh chord's own
#: tone is printed as its stacked thirds spell it, these included
#: (`_readable`, D0a): C flat is A flat minor 7's third and F flat is G flat
#: 7's seventh. Only a double accidental is printed as its enharmonic, and
#: the enharmonic is never one of these.
WHITE_KEYS_WITH_ACCIDENTALS = {"C-", "F-", "B#", "E#"}


def spelling_faults(sc, entry: dict) -> list[str]:
    """
    Notes spelled for some other key.

    A triad arpeggio prints only its key's first, third and fifth degrees; a
    seventh arpeggio or a broken seventh prints its four notes as stacked
    thirds from the root, except that a note whose stacked-thirds spelling
    needs a double accidental may be printed as its enharmonic.
    """
    params = entry["drill"]["params"]
    root = params["key"]
    quality = params["quality"]
    faults = []
    for part_id in ("RH", "LH"):
        for p, _ in fingered_notes(sc, part_id):
            if entry["id"].startswith(("exercise.arpeggio7.", "exercise.broken7.")):
                proper = [pitch.Pitch(root).transpose(interval.Interval(name))
                          for name in SEVENTH_INTERVALS[quality]]
                ok = False
                for want in proper:
                    if p.name == want.name:
                        ok = True
                    elif abs(want.alter) > 1 and \
                            p.pitchClass == want.pitchClass and abs(p.alter) <= 1 and \
                            p.name not in WHITE_KEYS_WITH_ACCIDENTALS:
                        ok = True
            else:
                k = key.Key(root if quality == "major" else root.lower())
                ok = p.name in {k.pitchFromDegree(d).name for d in (1, 3, 5)}
            if not ok:
                faults.append(f"{part_id} {p.nameWithOctave} is not spelled for {root} {quality}")
    return faults


def guard_faults(sc, entry: dict) -> list[str]:
    """Every guard, over both hands of one item."""
    params = entry["drill"]["params"]
    faults = []
    for part_id in ("RH", "LH"):
        notes = fingered_notes(sc, part_id)
        if not notes:
            continue
        faults += crossing_faults(notes, part_id)
        faults += fifth_finger_faults(notes, part_id)
        faults += thumb_on_black_faults(notes, params["key"], params["quality"], part_id)
    return faults


def scale_guard_faults(sc) -> list[str]:
    """The crossing and fifth-finger guards over a scale, both hands, as for an arpeggio."""
    faults = []
    for part_id in ("RH", "LH"):
        notes = fingered_notes(sc, part_id)
        if not notes or all(f is None for _, f in notes):
            continue
        faults += crossing_faults(notes, part_id)
        faults += fifth_finger_faults(notes, part_id)
    return faults


def scale_thumb_faults(sc) -> list[str]:
    """
    The thumb on a black key anywhere in a scale.

    No scale lacks a white key, and Kelley's scale chart puts the thumb on
    white keys only, "never on black keys".
    """
    return [f"{part_id} {p.nameWithOctave}(1): thumb on a black key"
            for part_id in ("RH", "LH")
            for p, f in fingered_notes(sc, part_id)
            if f == 1 and p.pitchClass in BLACK_PITCH_CLASSES]


def chart_faults(sc, entry: dict, chart: dict) -> list[str]:
    """Where one triad arpeggio's printed ascent differs from the chart's."""
    params = entry["drill"]["params"]
    patterns = chart[(params["key"], params["quality"])]
    faults = []
    for part_id in ("RH", "LH"):
        notes = fingered_notes(sc, part_id)
        if not notes:
            continue
        printed = [f for _, f in ascent(notes)]
        wanted = read_the_chart(patterns[part_id], part_id, params["octaves"])
        if printed != wanted:
            faults.append(f"{part_id} prints {printed}, the chart {patterns[part_id]} reads {wanted}")
    return faults


#: The families these tests read from the shipping plan, by id prefix.
PLAN_FAMILIES = ("exercise.arpeggio.", "exercise.arpeggio7.", "exercise.broken7.", "exercise.scale.",
                 "exercise.chromatic.")

_PLAN: dict[str, list[tuple[object, dict]]] | None = None


def plan_items(prefix: str) -> list[tuple[object, dict]]:
    """Every item of one family the shipping plan builds, from one build of the plan."""
    global _PLAN
    if _PLAN is None:
        _PLAN = {family: [] for family in PLAN_FAMILIES}
        for sc, entry in default_plan(quick=False):
            for family in PLAN_FAMILIES:
                if entry["id"].startswith(family):
                    _PLAN[family].append((sc, entry))
    return _PLAN[prefix]


def plan_arpeggios() -> list[tuple[object, dict]]:
    """Every arpeggio item the shipping plan builds, triads and sevenths."""
    return plan_items("exercise.arpeggio.") + plan_items("exercise.arpeggio7.")


class TestArpeggioFingering(unittest.TestCase):
    def test_a_white_root_starts_on_the_thumb_and_tops_with_the_fifth(self) -> None:
        sc, _ = make_arpeggio("C", "major", "both", 2)
        rh = [f for _, f in fingered_notes(sc, "RH")]
        self.assertEqual(rh[:7], [1, 2, 3, 1, 2, 3, 5])
        lh = [f for _, f in fingered_notes(sc, "LH")]
        # 5-4-2-1, then 4 over the thumb: the lesson's fingering and the chart's
        # LH 1421. It read [5, 3, 2, 5, 3, 2, 1] — the fault, asserted.
        self.assertEqual(lh[:7], [5, 4, 2, 1, 4, 2, 1])

    def test_a_black_root_never_takes_the_thumb(self) -> None:
        # G flat major was in this list, and the chart says otherwise: a chord
        # with no white key puts the thumb on a black one (see the next test).
        for root, quality in (("A-", "major"), ("E-", "major"), ("B-", "minor"), ("F#", "minor"),
                              ("B-", "major"), ("D-", "major"), ("C#", "minor"), ("G#", "minor")):
            sc, entry = make_arpeggio(root, quality, "both", 2)
            for part_id in ("RH", "LH"):
                notes = fingered_notes(sc, part_id)
                self.assertNotEqual(notes[0][1], 1, f"{root} {quality} {part_id} starts on the thumb")
                for p, finger in notes:
                    if p.pitchClass == pitch.Pitch(root).pitchClass:
                        self.assertNotEqual(finger, 1, f"{root} {quality} {part_id}: thumb on the root {p.nameWithOctave}")
            self.assertTrue(entry["drill"]["params"]["fingeringVerified"])

    def test_a_chord_with_no_white_key_is_fingered_as_if_it_were_white(self) -> None:
        for root, quality, lh in (("G-", "major", [5, 3, 2, 1, 3, 2, 1]), ("E-", "minor", [5, 4, 2, 1, 4, 2, 1])):
            sc, _ = make_arpeggio(root, quality, "both", 2)
            self.assertEqual([f for _, f in fingered_notes(sc, "RH")][:7], [1, 2, 3, 1, 2, 3, 5], root)
            self.assertEqual([f for _, f in fingered_notes(sc, "LH")][:7], lh, root)

    def test_the_black_root_shape_takes_every_later_root_with_the_fourth(self) -> None:
        # A flat major: 2-1-2-4, then 1-2-4 — the chart's RH 2124 and LH 2142.
        # It read [2, 1, 2, 2, 1, 2, 4]: finger 2 on E flat and again on the A
        # flat a fourth above it.
        sc, _ = make_arpeggio("A-", "major", "both", 2)
        self.assertEqual([f for _, f in fingered_notes(sc, "RH")][:7], [2, 1, 2, 4, 1, 2, 4])
        self.assertEqual([f for _, f in fingered_notes(sc, "LH")][:7], [2, 1, 4, 2, 1, 4, 2])

    def test_a_flat_major_is_spelled_with_flats(self) -> None:
        sc, _ = make_arpeggio("A-", "major", "both", 2)
        for part_id in ("RH", "LH"):
            names = {p.name for p, _ in fingered_notes(sc, part_id)}
            self.assertEqual(names, {"A-", "C", "E-"}, part_id)

    def test_no_arpeggio_in_the_plan_puts_the_thumb_on_a_black_root(self) -> None:
        for sc, entry in plan_arpeggios():
            if not entry["id"].startswith("exercise.arpeggio."):
                continue
            root = entry["drill"]["params"]["key"]
            if not is_black_root(root) or (root, entry["drill"]["params"]["quality"]) in NO_WHITE_KEY:
                continue
            for part_id in ("RH", "LH"):
                for p, finger in fingered_notes(sc, part_id):
                    if p.pitchClass == pitch.Pitch(root).pitchClass:
                        self.assertNotEqual(finger, 1, f"{entry['id']} {part_id}: thumb on {p.nameWithOctave}")


class TestArpeggiosAgainstTheChart(unittest.TestCase):
    """The source: every triad arpeggio the plan ships, both hands, as the chart reads."""

    def test_the_chart_names_every_key_the_plan_arpeggiates_once_per_hand(self) -> None:
        chart = chart_by_key()
        wanted = {(k, "major") for k in MAJOR_KEYS} | {(k, "minor") for k in MINOR_KEYS}
        self.assertEqual(set(chart), wanted)
        for slot, hands in chart.items():
            self.assertEqual(set(hands), {"RH", "LH"}, slot)

    def test_the_c_major_left_hand_is_the_one_the_lesson_teaches(self) -> None:
        for hands in ("left", "both"):
            sc, _ = make_arpeggio("C", "major", hands, 2)
            self.assertEqual([f for _, f in ascent(fingered_notes(sc, "LH"))], [5, 4, 2, 1, 4, 2, 1], hands)

    def test_every_triad_arpeggio_in_the_plan_is_fingered_as_the_chart_reads(self) -> None:
        chart = chart_by_key()
        checked, faults = 0, []
        for sc, entry in plan_arpeggios():
            if not entry["id"].startswith("exercise.arpeggio."):
                continue
            checked += 1
            self.assertTrue(entry["drill"]["params"]["fingeringVerified"], entry["id"])
            faults += [f"{entry['id']}: {fault}" for fault in chart_faults(sc, entry, chart)]
        # 24 keys at two and four octaves, and the twelve hands-separate items.
        self.assertEqual(checked, 60)
        self.assertEqual(faults, [], "\n".join(faults))


class TestArpeggioGuards(unittest.TestCase):
    """The mechanical adversaries, over every arpeggio item the plan ships."""

    def test_no_arpeggio_in_the_plan_asks_for_a_hand_that_is_not_there(self) -> None:
        checked, faults = 0, []
        for sc, entry in plan_arpeggios():
            checked += 1
            faults += [f"{entry['id']}: {fault}" for fault in guard_faults(sc, entry)]
        self.assertEqual(checked, 120)
        self.assertEqual(faults, [], "\n".join(faults[:40]) + f"\n… {len(faults)} in all")

    def test_every_arpeggio_in_the_plan_is_spelled_for_its_key(self) -> None:
        faults = []
        for sc, entry in plan_arpeggios():
            faults += [f"{entry['id']}: {fault}" for fault in spelling_faults(sc, entry)]
        self.assertEqual(faults, [], "\n".join(faults[:40]) + f"\n… {len(faults)} in all")

    def test_a_shape_printed_without_fingering_says_so(self) -> None:
        for sc, entry in plan_arpeggios():
            printed = any(f is not None for part_id in ("RH", "LH") for _, f in fingered_notes(sc, part_id))
            self.assertEqual(entry["drill"]["params"]["fingeringVerified"], printed, entry["id"])


class TestSeventhArpeggiosAgainstTheSource(unittest.TestCase):
    """
    G47: a printed seventh-arpeggio fingering is the book's, or none is printed.

    T53 left the white-root sevenths printing 1-2-3-4 and 5-4-3-2-1-4-3-2-1
    with `fingeringVerified` true, and no seventh source had been read. The
    numbers turn out to be McLain's exactly; this is the test that says so,
    and the mutations below show it can tell them from a hand's other choices.
    """

    def test_every_white_root_seventh_in_the_plan_is_fingered_as_the_source_gives(self) -> None:
        checked, faults = 0, []
        for sc, entry in plan_items("exercise.arpeggio7."):
            params = entry["drill"]["params"]
            if is_black_root(params["key"]):
                continue
            checked += 1
            # The book gives two octaves, and the plan ships nothing else.
            self.assertEqual(params["octaves"], 2, entry["id"])
            self.assertTrue(params["fingeringVerified"], entry["id"])
            faults += [f"{entry['id']}: {fault}" for fault in seventh_source_faults(sc, entry)]
        # Seven white roots: four shapes on the majors' and the diminished on the minors'.
        self.assertEqual(checked, 35)
        self.assertEqual(faults, [], "\n".join(faults))


class TestBrokenSeventhSpelling(unittest.TestCase):
    """
    G44: the broken sevenths are spelled as stacked thirds, from the same
    quality-to-interval contract as the seventh arpeggios.

    `make_broken_seventh` built its notes with `start.transpose(i)`, a count
    of semitones, which music21 spells by pitch class: E major 7th printed an
    E♭ under a D♯ chord, A♭7 came out G♯ C E♭ F♯, and C half-diminished
    raised its fourth where it should lower its fifth.
    """

    @staticmethod
    def names(sc) -> set[str]:
        return {p.name for part_id in ("RH", "LH") for p, _ in fingered_notes(sc, part_id)}

    def test_sharp_and_flat_keys_and_every_quality_are_spelled_as_thirds(self) -> None:
        for root, quality, wanted in (
            ("E", "major7", {"E", "G#", "B", "D#"}),
            ("B", "dominant7", {"B", "D#", "F#", "A"}),
            ("A", "minor7", {"A", "C", "E", "G"}),
            ("A-", "dominant7", {"A-", "C", "E-", "G-"}),
            ("E-", "minor7", {"E-", "G-", "B-", "D-"}),
            ("C", "half-diminished7", {"C", "E-", "G-", "B-"}),
            ("F#", "half-diminished7", {"F#", "A", "C", "E"}),
            ("E", "diminished7", {"E", "G", "B-", "D-"}),
            ("B", "diminished7", {"B", "D", "F", "A-"}),
        ):
            sc, entry = make_broken_seventh(root, quality, "both")
            self.assertEqual(self.names(sc), wanted, entry["id"])
            self.assertEqual(spelling_faults(sc, entry), [], entry["id"])

    def test_every_broken_seventh_in_the_plan_is_spelled_as_stacked_thirds(self) -> None:
        checked, faults = 0, []
        for sc, entry in plan_items("exercise.broken7."):
            checked += 1
            faults += [f"{entry['id']}: {fault}" for fault in spelling_faults(sc, entry)]
        self.assertEqual(checked, 36)
        self.assertEqual(faults, [], "\n".join(faults[:40]) + f"\n… {len(faults)} in all")

    def test_the_broken_seventh_spells_every_chord_the_arpeggio_spells(self) -> None:
        # One contract, two makers: every root and shape the plan arpeggiates,
        # built as a broken seventh too, has the same four note names.
        differ = []
        for _, entry in plan_items("exercise.arpeggio7."):
            params = entry["drill"]["params"]
            arpeggio, _ = make_seventh_arpeggio(params["key"], params["quality"], "right", 2)
            broken, _ = make_broken_seventh(params["key"], params["quality"], "right")
            if self.names(broken) != self.names(arpeggio):
                differ.append(f"{params['key']} {params['quality']}: broken {sorted(self.names(broken))}, "
                              f"arpeggio {sorted(self.names(arpeggio))}")
        self.assertEqual(differ, [], "\n".join(differ))


class TestTheBFlatMinorScaleJoin(unittest.TestCase):
    """
    G43: the B♭ minor scales' right hand at the B♭ inside a run.

    `expand_fingering` gave every inner tonic the finger the one-octave table
    starts on, which in every other key is also the finger the tonic takes
    inside a run. B♭ minor's table starts on 2, where Clementi starts it, and
    its B♭ inside a run is 4 in both sources, so the two- and three-octave
    scales printed A(3) then B♭(2), the hand crossing itself away from the
    thumb. The one-octave table is checked against the sources first, then
    the join.
    """

    def test_the_one_octave_table_is_the_sources(self) -> None:
        rh, _ = HARMONIC_MINOR_FINGERING["B-"]
        printed = [finger for _, finger in read_lilypond(CLEMENTI_B_FLAT_MINOR_RH)][:8]
        for position, finger in enumerate(printed):
            if finger is not None:
                self.assertEqual(rh[position], finger, f"position {position}, as Clementi prints it")
        self.assertEqual(rh[1:], [int(d) for d in KELLEY_B_FLAT_MINOR_RH[1:]], "Kelley, after the first note")
        self.assertEqual(rh, B_FLAT_MINOR_RH_ASCENT[1])

    def test_two_octaves_print_every_finger_clementi_prints(self) -> None:
        sc, _ = make_scale(ScaleSpec("B-", "melodic", "right", 2))
        notes = fingered_notes(sc, "RH")
        source = read_lilypond(CLEMENTI_B_FLAT_MINOR_RH)
        self.assertEqual([p.name for p, _ in notes], [name for name, _ in source])
        disagree = [f"{p.nameWithOctave}({finger}): Clementi prints {want}"
                    for (p, finger), (_, want) in zip(notes, source)
                    if want is not None and finger != want]
        self.assertEqual(disagree, [])

    def test_every_b_flat_minor_scale_in_the_plan_takes_each_inner_b_flat_with_the_fourth(self) -> None:
        pattern = [int(d) for d in KELLEY_B_FLAT_MINOR_RH]
        checked, faults = 0, []
        for sc, entry in plan_items("exercise.scale."):
            params = entry["drill"]["params"]
            notes = fingered_notes(sc, "RH")
            if params["key"] != "B-" or params["mode"] == "major" or all(f is None for _, f in notes):
                continue
            checked += 1
            octaves = params["octaves"]
            up = [f for _, f in ascent(notes)]
            wanted = B_FLAT_MINOR_RH_ASCENT[octaves]
            if up != wanted:
                faults.append(f"{entry['id']}: going up {up}, the sources read {wanted}")
            if up[1:] != pattern[1:] * octaves:
                faults.append(f"{entry['id']}: after the first note {up[1:]}, Kelley's {KELLEY_B_FLAT_MINOR_RH} "
                              f"reads {pattern[1:] * octaves}")
            if [f for _, f in notes] != wanted + list(reversed(wanted))[1:]:
                faults.append(f"{entry['id']}: coming down {[f for _, f in notes][len(up) - 1:]}")
            inner = [f"{p.nameWithOctave}({f})" for p, f in notes[1:-1]
                     if p.name == "B-" and p.ps != max(q.ps for q, _ in notes) and f != 4]
            if inner:
                faults.append(f"{entry['id']}: inner B♭ not on 4: {inner}")
        # Harmonic and melodic one hand at one octave, the three forms at one and
        # two octaves, the contrary-motion octave and harmonic at three octaves.
        self.assertEqual(checked, 10)
        self.assertEqual(faults, [], "\n".join(faults))

    def test_no_scale_in_the_plan_asks_for_a_hand_that_is_not_there(self) -> None:
        checked, faults = 0, []
        for sc, entry in plan_items("exercise.scale."):
            checked += 1
            faults += [f"{entry['id']}: {fault}" for fault in scale_guard_faults(sc)]
        self.assertEqual(checked, 252)
        self.assertEqual(faults, [], "\n".join(faults[:40]) + f"\n… {len(faults)} in all")

    def test_no_scale_in_the_plan_puts_the_thumb_on_a_black_key(self) -> None:
        """
        Every scale in the plan, both hands, no exception.

        This row replaces T53b's pin, which listed five G♯ minor items as a
        known fault: the natural form both ways and the melodic form coming
        down put the left thumb on F♯, because `make_scale` fingered them from
        the harmonic table, whose thumb falls on F𝄪. Each minor form now takes
        its own table (G48), so the pin's list is empty and the rule holds for
        all of them.
        """
        checked, faults = 0, {}
        for sc, entry in plan_items("exercise.scale."):
            checked += 1
            found = scale_thumb_faults(sc)
            if found:
                faults[entry["id"]] = found
        self.assertEqual(checked, 252)
        self.assertEqual(faults, {}, "\n".join(f"{item}: {found}" for item, found in faults.items()))


class TestTheMinorFormsFingerings(unittest.TestCase):
    """
    G48: each minor form has its own fingering, and G♯ minor's are the sources'.

    Harmonic, natural, melodic going up and melodic coming down: four forms, and
    `make_scale` took the harmonic table for all of them. In G♯ minor that put
    the left thumb on F♯ wherever the notes were natural. The one-octave tables
    are checked against the sources first, then what the plan prints over one,
    two and three octaves.
    """

    def test_the_one_octave_tables_are_the_sources(self) -> None:
        digits = lambda pattern: [int(d) for d in pattern]  # noqa: E731
        for form, column in (("harmonic", "harmonic"), ("natural", "natural"),
                             ("melodic ascending", "melodic (ascending)"), ("melodic descending", "natural")):
            rh, lh = G.MINOR_FINGERING[form]["G#"]
            self.assertEqual(lh, digits(KELLEY_G_SHARP_MINOR[column]["LH"]), f"{form}: the chart's {column} LH")
            self.assertEqual(rh, digits(KELLEY_G_SHARP_MINOR[column]["RH"]), f"{form}: the chart's {column} RH")
        # Clementi's first octave up is the melodic form, every finger printed.
        printed = [finger for _, finger in read_lilypond(CLEMENTI_G_SHARP_MINOR_LH)][:8]
        self.assertEqual(G.MINOR_FINGERING["melodic ascending"]["G#"][1], printed)
        self.assertEqual(G.MINOR_SCALE_FORMS, {
            "harmonic": ("harmonic", "harmonic"),
            "natural": ("natural", "natural"),
            "melodic": ("melodic ascending", "melodic descending"),
        })

    def test_clementi_s_run_is_the_melodic_left_hand_both_ways(self) -> None:
        sc, _ = make_scale(ScaleSpec("G#", "melodic", "left", 1))
        notes = fingered_notes(sc, "LH")
        source = read_lilypond(CLEMENTI_G_SHARP_MINOR_LH)
        # His first octave up, and his octave from the upper G♯ down to the lower.
        for printed, run in ((notes[:8], source[:8]), (notes[7:], source[15:23])):
            self.assertEqual([p.name for p, _ in printed], [name for name, _ in run])
            disagree = [f"{p.nameWithOctave}({finger}): Clementi prints {want}"
                        for (p, finger), (_, want) in zip(printed, run)
                        if want is not None and finger != want]
            self.assertEqual(disagree, [])
        # The unprinted fingers coming down step from his printed thumbs, E and B.
        self.assertEqual([f for _, f in notes[7:]], [3, 4, 1, 2, 3, 1, 2, 3])

    def test_the_five_items_print_the_left_hand_the_sources_give(self) -> None:
        items = {entry["id"]: (sc, entry) for sc, entry in plan_items("exercise.scale.")}
        for item_id, wanted in G_SHARP_MINOR_LH.items():
            sc, entry = items[item_id]
            params = entry["drill"]["params"]
            up_column, down_column = G_SHARP_MINOR_COLUMNS[params["mode"]]
            up = read_scale_pattern(KELLEY_G_SHARP_MINOR[up_column]["LH"], params["octaves"])
            down = read_scale_pattern(KELLEY_G_SHARP_MINOR[down_column]["LH"], params["octaves"])
            self.assertEqual(up + list(reversed(down))[1:], wanted, f"{item_id}: the sequence written here is the chart's")
            printed = fingered_notes(sc, "LH")
            self.assertEqual([f for _, f in printed], wanted, item_id)
            self.assertEqual([p.nameWithOctave for p, f in printed if f == 1 and p.name == "F#"], [], item_id)

    def test_every_g_sharp_minor_scale_in_the_plan_is_fingered_as_the_sources_give(self) -> None:
        checked, faults = 0, []
        for sc, entry in plan_items("exercise.scale."):
            params = entry["drill"]["params"]
            if params["key"] != "G#" or params["mode"] == "major":
                continue
            checked += 1
            self.assertTrue(params["fingeringVerified"], entry["id"])
            up_column, down_column = G_SHARP_MINOR_COLUMNS[params["mode"]]
            for part_id in ("RH", "LH"):
                printed = [f for _, f in fingered_notes(sc, part_id)]
                if not printed:
                    continue
                up = read_scale_pattern(KELLEY_G_SHARP_MINOR[up_column][part_id], params["octaves"])
                down = list(reversed(read_scale_pattern(KELLEY_G_SHARP_MINOR[down_column][part_id],
                                                        params["octaves"])))
                contrary = part_id == "LH" and params["motion"] == "contrary"
                wanted = down + up[1:] if contrary else up + down[1:]
                if printed != wanted:
                    faults.append(f"{entry['id']} {part_id}: prints {printed}, the chart reads {wanted}")
        # Harmonic and melodic one hand at one octave, the three forms together at
        # one and two octaves, the contrary-motion octave and harmonic at three.
        self.assertEqual(checked, 12)
        self.assertEqual(faults, [], "\n".join(faults))

    def test_the_natural_table_differs_from_the_harmonic_only_in_g_sharp_minor_s_left_hand(self) -> None:
        """
        Clementi's twelve descents, read 2026-09-27 from the Mutopia typeset with
        the repository's own parser (T53c; the extraction commits only the first
        octave up, G46), put the thumbs where the harmonic table puts them on the
        natural minor's notes in twenty-three of the twenty-four hands. The
        twenty-fourth is G♯ minor's left hand, thumbs on E and B. This holds the
        natural table to that reading.
        """
        self.assertEqual(set(G.NATURAL_MINOR_FINGERING), set(HARMONIC_MINOR_FINGERING))
        differ = sorted((tonic, hand) for tonic in HARMONIC_MINOR_FINGERING
                        for hand, index in (("RH", 0), ("LH", 1))
                        if G.NATURAL_MINOR_FINGERING[tonic][index] != HARMONIC_MINOR_FINGERING[tonic][index])
        self.assertEqual(differ, [("G#", "LH")])

    def test_every_minor_form_s_table_keeps_the_thumb_on_white_keys(self) -> None:
        # `test_fingering.py`'s rules, on each form's own notes and in every key.
        faults = []
        for form, table in G.MINOR_FINGERING.items():
            steps = MINOR_FORM_STEPS[form]
            for tonic, (rh, lh) in table.items():
                base = pitch.Pitch(tonic).pitchClass
                for hand, fingering in (("RH", rh), ("LH", lh)):
                    self.assertEqual(len(fingering), 8, f"{form} {tonic} {hand}")
                    thumbs = [i for i, f in enumerate(fingering) if f == 1]
                    faults += [f"{form} {tonic} {hand}: thumb on a black key at degree {i + 1}"
                               for i in thumbs if (base + steps[i]) % 12 in BLACK_PITCH_CLASSES]
                    faults += [f"{form} {tonic} {hand}: {b - a - 1} notes between thumbs"
                               for a, b in zip(thumbs, thumbs[1:]) if b - a > 4]
        self.assertEqual(faults, [], "\n".join(faults))


class TestTheFingeringChecksGoRedOnAMutation(unittest.TestCase):
    """
    The census for the checks above: each one fails on a generator broken the
    way this one was, and passes on the real one. A check nobody has seen fail
    is a check nobody knows the shape of (`00-invariants` §2).
    """

    def test_the_old_construction_fails_the_guards_and_the_chart(self) -> None:
        def every_root_takes_the_first_finger(first, join, top, octaves):
            # `table[:3] * octaves + [table[3]]`, the line that shipped.
            return first * octaves + [top]

        chart = chart_by_key()
        for root, quality, hands in (("C", "major", "left"), ("A-", "major", "right"),
                                     ("E", "minor", "both")):
            real, entry = make_arpeggio(root, quality, hands, 2)
            self.assertEqual(guard_faults(real, entry) + chart_faults(real, entry, chart), [])
            with mock.patch.object(G, "arpeggio_ascent", every_root_takes_the_first_finger):
                mutant, entry = make_arpeggio(root, quality, hands, 2)
            self.assertNotEqual(guard_faults(mutant, entry), [],
                                f"{entry['id']}: mutation `every_root_takes_the_first_finger` did not go red")
            self.assertNotEqual(chart_faults(mutant, entry, chart), [], entry["id"])
        real, entry = make_seventh_arpeggio("C", "dominant7", "both", 2)
        self.assertEqual(guard_faults(real, entry) + seventh_source_faults(real, entry), [])
        with mock.patch.object(G, "arpeggio_ascent", every_root_takes_the_first_finger):
            mutant, entry = make_seventh_arpeggio("C", "dominant7", "both", 2)
        self.assertNotEqual(guard_faults(mutant, entry), [],
                            "the seventh: mutation `every_root_takes_the_first_finger` did not go red")
        self.assertNotEqual(seventh_source_faults(mutant, entry), [],
                            "the seventh: mutation `every_root_takes_the_first_finger` passed the source")

    def test_a_playable_seventh_the_source_does_not_give_fails_only_the_source(self) -> None:
        # The thumb on the top note, 1-2-3-4-1-2-3-4-1: what Torkelson's sheet
        # prints for a hand that keeps going. No guard objects to it; the book
        # puts the fifth finger at the turn, so only the source can say no.
        real_ascent = G.arpeggio_ascent

        def the_thumb_at_the_turn(first, join, top, octaves):
            return real_ascent(first, join, 1 if top == 5 else top, octaves)

        real, entry = make_seventh_arpeggio("C", "major7", "both", 2)
        self.assertEqual(guard_faults(real, entry) + seventh_source_faults(real, entry), [])
        with mock.patch.object(G, "arpeggio_ascent", the_thumb_at_the_turn):
            mutant, entry = make_seventh_arpeggio("C", "major7", "both", 2)
        self.assertEqual(guard_faults(mutant, entry), [])
        self.assertNotEqual(seventh_source_faults(mutant, entry), [],
                            "mutation `the_thumb_at_the_turn` did not go red")

    def test_the_old_scale_join_fails_the_guards_and_the_sources(self) -> None:
        # With the join table empty every inner tonic takes the finger its
        # table starts on — the line that shipped.
        spec = ScaleSpec("B-", "harmonic", "both", 2, "similar", 0.5, 72)
        real, _ = make_scale(spec)
        self.assertEqual(scale_guard_faults(real), [])
        self.assertEqual([f for _, f in ascent(fingered_notes(real, "RH"))], B_FLAT_MINOR_RH_ASCENT[2])
        with mock.patch.dict(G.SCALE_JOIN_RH, {}, clear=True):
            mutant, _ = make_scale(spec)
        self.assertNotEqual(scale_guard_faults(mutant), [],
                            "mutation `the_join_the_table_starts_on` did not go red on the guards")
        self.assertNotEqual([f for _, f in ascent(fingered_notes(mutant, "RH"))], B_FLAT_MINOR_RH_ASCENT[2],
                            "mutation `the_join_the_table_starts_on` did not go red on the sources")

    def test_the_harmonic_table_for_every_minor_form_fails_the_guard_and_the_sources(self) -> None:
        # `make_scale` as it shipped: the natural minor, and the melodic minor
        # coming down, fingered from the harmonic table.
        for spec in (ScaleSpec("G#", "natural", "both", 2, "similar", 0.5, 72),
                     ScaleSpec("G#", "melodic", "left", 1, "similar", 0.5, 60)):
            real, entry = make_scale(spec)
            self.assertEqual(scale_thumb_faults(real), [], entry["id"])
            self.assertEqual([f for _, f in fingered_notes(real, "LH")], G_SHARP_MINOR_LH[entry["id"]])
            with mock.patch.dict(G.MINOR_FINGERING, {"natural": HARMONIC_MINOR_FINGERING,
                                                     "melodic descending": HARMONIC_MINOR_FINGERING}):
                mutant, _ = make_scale(spec)
            self.assertNotEqual(scale_thumb_faults(mutant), [],
                                f"{entry['id']}: mutation `the_harmonic_table_for_every_form` did not go red on the guard")
            self.assertNotEqual([f for _, f in fingered_notes(mutant, "LH")], G_SHARP_MINOR_LH[entry["id"]],
                                f"{entry['id']}: mutation `the_harmonic_table_for_every_form` passed the sources")

    def test_a_thumb_start_in_the_left_hand_fails_the_chromatic_source(self) -> None:
        # The first-note exception for both hands, as it shipped: a run from E
        # began the left hand E(1) F(1).
        real_finger = G.chromatic_finger

        def the_thumb_starts_either_hand(midi, first, hand="right"):
            if first and midi % 12 not in BLACK_PITCH_CLASSES:
                return 1
            return real_finger(midi, first, hand)

        real, _ = make_chromatic("E", "left", 1)
        self.assertEqual(chromatic_source_faults(real), [])
        with mock.patch.object(G, "chromatic_finger", the_thumb_starts_either_hand):
            mutant, _ = make_chromatic("E", "left", 1)
        self.assertNotEqual(chromatic_source_faults(mutant), [],
                            "mutation `the_thumb_starts_either_hand` did not go red")

    def test_spelling_broken_sevenths_by_semitones_fails_the_spelling_check(self) -> None:
        # One helper spells both seventh families, so breaking it breaks both.
        def by_semitones(start, quality):
            return [start.transpose(semitones) for semitones in G.SEVENTH_SHAPES[quality]]

        for maker, args in ((make_broken_seventh, ("E", "major7", "both")),
                            (make_broken_seventh, ("A-", "dominant7", "both")),
                            (make_seventh_arpeggio, ("E", "major7", "both", 2))):
            real, entry = maker(*args)
            self.assertEqual(spelling_faults(real, entry), [], entry["id"])
            with mock.patch.object(G, "seventh_chord", by_semitones):
                mutant, entry = maker(*args)
            self.assertNotEqual(spelling_faults(mutant, entry), [],
                                f"{entry['id']}: mutation `by_semitones` did not go red")

    def test_a_right_hand_table_on_the_left_fails_the_guards(self) -> None:
        with mock.patch.dict(G.ARPEGGIO_CHART, {("C", "major"): ("1231", "1231")}):
            mutant, entry = make_arpeggio("C", "major", "left", 2)
        self.assertNotEqual(guard_faults(mutant, entry), [],
                            "mutation `a_right_hand_table_on_the_left` did not go red")

    def test_a_playable_table_the_chart_does_not_give_fails_only_the_chart(self) -> None:
        # 5-3-2-1 is a fingering hands use for C (the lesson says so), so no
        # guard can object to it; only the source can. Which is why the guards
        # are guards and the chart is the truth.
        with mock.patch.dict(G.ARPEGGIO_CHART, {("C", "major"): ("1231", "1321")}):
            mutant, entry = make_arpeggio("C", "major", "left", 2)
        self.assertEqual(guard_faults(mutant, entry), [])
        self.assertNotEqual(chart_faults(mutant, entry, chart_by_key()), [],
                            "mutation `a_playable_table_the_chart_does_not_give` did not go red")

    def test_a_black_key_thumb_fails_the_guard(self) -> None:
        with mock.patch.dict(G.ARPEGGIO_CHART, {("B-", "minor"): ("2124", "2142")}):
            mutant, entry = make_arpeggio("B-", "minor", "both", 2)
        self.assertTrue(any("thumb on a black key" in f for f in guard_faults(mutant, entry)),
                        "mutation `the_major_table_on_b_flat_minor` did not go red")

    def test_spelling_by_semitones_fails_the_spelling_check(self) -> None:
        def by_semitones(p, semitones):
            return p.transpose(semitones)

        real, entry = make_arpeggio("A-", "major", "both", 2)
        self.assertEqual(spelling_faults(real, entry), [])
        with mock.patch.object(G, "up", by_semitones):
            mutant, entry = make_arpeggio("A-", "major", "both", 2)
        self.assertNotEqual(spelling_faults(mutant, entry), [],
                            "mutation `by_semitones` did not go red")


class TestSeventhArpeggioFingering(unittest.TestCase):
    def test_a_white_root_is_one_finger_a_note_with_the_thumb_under_after_the_fourth(self) -> None:
        sc, entry = make_seventh_arpeggio("C", "dominant7", "both", 2)
        self.assertEqual([f for _, f in fingered_notes(sc, "RH")][:9], [1, 2, 3, 4, 1, 2, 3, 4, 5])
        # The thumb takes the second C, as in the triads and the scales: it read
        # [5, 4, 3, 2, 5, 4, 3, 2, 1], finger 5 again straight after 2.
        self.assertEqual([f for _, f in fingered_notes(sc, "LH")][:9], [5, 4, 3, 2, 1, 4, 3, 2, 1])
        self.assertTrue(entry["drill"]["params"]["fingeringVerified"])

    def test_a_black_root_prints_no_fingering_and_says_so(self) -> None:
        sc, entry = make_seventh_arpeggio("E-", "dominant7", "both", 2)
        self.assertTrue(all(f is None for _, f in fingered_notes(sc, "RH")))
        self.assertTrue(all(f is None for _, f in fingered_notes(sc, "LH")))
        self.assertFalse(entry["drill"]["params"]["fingeringVerified"])


class TestBrokenSeventhFingering(unittest.TestCase):
    """
    G49: a broken seventh prints a fingering a source gives, or none.

    The white roots printed 1-2-3-4-5-4-3-2 in the right hand and 5-4-3-2-1-2-3-4
    in the left with `fingeringVerified` false, the flag no screen reads. The
    learner reads engraved numbers as the fingering, so "printed but unverified"
    is not a state an item may be in. No source for this figure was found
    (T53c), so none is printed until one is.
    """

    def test_no_broken_seventh_in_the_plan_prints_a_fingering(self) -> None:
        checked, faults = 0, []
        for sc, entry in plan_items("exercise.broken7."):
            checked += 1
            printed = [f"{part_id} {p.nameWithOctave}({f})" for part_id in ("RH", "LH")
                       for p, f in fingered_notes(sc, part_id) if f is not None]
            verified = entry["drill"]["params"]["fingeringVerified"]
            if printed or verified:
                faults.append(f"{entry['id']}: verified={verified}, printed {len(printed)} fingers, "
                              f"the first {printed[:1]}")
        self.assertEqual(checked, 36)
        self.assertEqual(faults, [], "\n".join(faults))

    def test_a_white_root_prints_none_as_a_black_root_does(self) -> None:
        # It read [1, 2, 3, 4, 5, 4, 3, 2] for C: the fingering this asserted.
        for root in ("C", "A", "D-"):
            for hands in ("both", "right", "left"):
                sc, entry = make_broken_seventh(root, "dominant7", hands)
                for part_id in ("RH", "LH"):
                    self.assertTrue(all(f is None for _, f in fingered_notes(sc, part_id)),
                                    f"{entry['id']} {part_id}")
                self.assertFalse(entry["drill"]["params"]["fingeringVerified"], entry["id"])


class TestWalkingBassFingering(unittest.TestCase):
    def test_root_third_fifth_sit_under_five_three_one(self) -> None:
        sc, _ = make_walking_bass("C", "blues", "intro")
        lh = fingered_notes(sc, "LH")
        for bar in range(12):
            self.assertEqual([f for _, f in lh[bar * 4 : bar * 4 + 3]], [5, 3, 1], f"bar {bar + 1}")

    def test_the_approach_note_is_fingered_by_where_it_lands(self) -> None:
        sc, _ = make_walking_bass("C", "blues", "intro")
        lh = fingered_notes(sc, "LH")
        # Bar 1: C E G then B below the C — the hand drops, the little finger takes it.
        self.assertEqual(lh[3][0].nameWithOctave, "B1")
        self.assertEqual(lh[3][1], 5)
        # Bar 8 -> 9: C E G then F sharp, between the third and the fifth.
        self.assertEqual(lh[7 * 4 + 3][0].name, "F#")
        self.assertEqual(lh[7 * 4 + 3][1], 2)

    def test_the_thumb_is_never_below_the_second_finger_within_a_bar(self) -> None:
        for tonic in ("C", "F", "B-", "E-"):
            for form in ("blues", "ii-V-I"):
                sc, entry = make_walking_bass(tonic, form)
                lh = fingered_notes(sc, "LH")
                for start in range(0, len(lh), 4):
                    bar = lh[start : start + 4]
                    if len(bar) < 4:
                        continue
                    by_finger = {f: p.ps for p, f in bar[:3]}
                    _, approach_finger = bar[3]
                    approach_ps = bar[3][0].ps
                    # A finger's note is never above a lower-numbered finger's in the left hand.
                    if approach_finger == 1:
                        self.assertGreaterEqual(approach_ps, by_finger[3], entry["id"])
                    if approach_finger == 5:
                        self.assertLessEqual(approach_ps, by_finger[5], entry["id"])

    def test_the_rule_as_arithmetic(self) -> None:
        line = [pitch.Pitch("C2"), pitch.Pitch("E2"), pitch.Pitch("G2"), pitch.Pitch("B1")]
        self.assertEqual(walking_bass_fingers(line), [5, 3, 1, 5])
        line[3] = pitch.Pitch("F#2")
        self.assertEqual(walking_bass_fingers(line), [5, 3, 1, 2])
        line[3] = pitch.Pitch("E2")
        self.assertEqual(walking_bass_fingers(line), [5, 3, 1, 3])
        line[3] = pitch.Pitch("D2")
        self.assertEqual(walking_bass_fingers(line), [5, 3, 1, 4])
        line[3] = pitch.Pitch("B2")
        self.assertEqual(walking_bass_fingers(line), [5, 3, 1, 1])


class TestChromaticLeftHand(unittest.TestCase):
    def test_the_right_hand_puts_two_on_f_and_c(self) -> None:
        self.assertEqual(chromatic_finger(pitch.Pitch("F4").midi, False, "right"), 2)
        self.assertEqual(chromatic_finger(pitch.Pitch("C5").midi, False, "right"), 2)
        self.assertEqual(chromatic_finger(pitch.Pitch("E4").midi, False, "right"), 1)
        self.assertEqual(chromatic_finger(pitch.Pitch("B4").midi, False, "right"), 1)

    def test_the_left_hand_puts_two_on_e_and_b(self) -> None:
        self.assertEqual(chromatic_finger(pitch.Pitch("E3").midi, False, "left"), 2)
        self.assertEqual(chromatic_finger(pitch.Pitch("B3").midi, False, "left"), 2)
        self.assertEqual(chromatic_finger(pitch.Pitch("F3").midi, False, "left"), 1)
        self.assertEqual(chromatic_finger(pitch.Pitch("C4").midi, False, "left"), 1)
        for name in ("C#3", "E-3", "F#3", "A-3", "B-3"):
            self.assertEqual(chromatic_finger(pitch.Pitch(name).midi, False, "left"), 3)

    def test_the_left_hand_never_climbs_from_the_thumb_to_the_second_finger(self) -> None:
        sc, _ = make_chromatic("C", "both", 1)
        lh = fingered_notes(sc, "LH")
        up = lh[:13]
        self.assertEqual([f for _, f in up], [1, 3, 1, 3, 2, 1, 3, 1, 3, 1, 3, 2, 1])
        for (p1, f1), (p2, f2) in zip(up, up[1:]):
            if p2.ps > p1.ps and f1 == 1:
                self.assertEqual(f2, 3, f"{p1.nameWithOctave}{f1} -> {p2.nameWithOctave}{f2}")

    def test_the_two_hands_differ_only_where_the_pairs_are(self) -> None:
        sc, _ = make_chromatic("C", "both", 1)
        rh = [f for _, f in fingered_notes(sc, "RH")]
        lh = [f for _, f in fingered_notes(sc, "LH")]
        self.assertEqual(rh[:13], [1, 3, 1, 3, 1, 2, 3, 1, 3, 1, 3, 1, 2])
        self.assertEqual(len(rh), len(lh))

    def test_the_left_hand_from_e_begins_on_the_second_finger(self) -> None:
        # G45: it read E3(1) F3(1), the thumb on two neighbouring keys. The
        # book's figure has the left hand's E on 2 and F on 1.
        for hands, octaves in (("left", 1), ("both", 1), ("both", 2)):
            sc, entry = make_chromatic("E", hands, octaves)
            lh = fingered_notes(sc, "LH")
            self.assertEqual([(p.nameWithOctave, f) for p, f in lh[:3]], [("E3", 2), ("F3", 1), ("F#3", 3)],
                             entry["id"])

    def test_the_scale_from_c_is_the_book_s_figure(self) -> None:
        sc, _ = make_chromatic("C", "both", 1)
        lh = [f for _, f in fingered_notes(sc, "LH")][:13]
        rh = [f for _, f in fingered_notes(sc, "RH")][:13]
        self.assertEqual(lh, MCLAIN_CHROMATIC_FROM_C["LH"])
        # The one difference: the run starts on the right hand's C, which the
        # figure, written as a cycle, fingers 2 and the item begins on the thumb.
        self.assertEqual(rh[1:], MCLAIN_CHROMATIC_FROM_C["RH"][1:])
        self.assertEqual((rh[0], MCLAIN_CHROMATIC_FROM_C["RH"][0]), (1, 2))

    def test_every_chromatic_scale_in_the_plan_takes_the_book_s_finger_on_every_key(self) -> None:
        checked, faults = 0, []
        for sc, entry in plan_items("exercise.chromatic."):
            checked += 1
            faults += [f"{entry['id']}: {fault}" for fault in chromatic_source_faults(sc)]
        # From C, D, E and G: each hand alone and both at one octave, both at two.
        self.assertEqual(checked, 16)
        self.assertEqual(faults, [], "\n".join(faults))


class TestTumbaoAnticipation(unittest.TestCase):
    def test_the_note_on_four_is_held_through_the_barline(self) -> None:
        sc, _ = make_tumbao("C", bars=4)
        lh = next(p for p in sc.parts if p.id == "LH")
        measures = list(lh.getElementsByClass("Measure"))
        self.assertGreaterEqual(len(measures), 4)
        second = measures[1]
        first_event = next(e for e in second.notesAndRests)
        self.assertIsInstance(first_event, note.Note, "the second bar opens with the held root, not a rest")
        self.assertIsNotNone(first_event.tie)
        self.assertEqual(first_event.tie.type, "stop")
        last_of_first = list(measures[0].notes)[-1]
        self.assertIsNotNone(last_of_first.tie)
        self.assertIn(last_of_first.tie.type, ("start", "continue"))
        # And the first bar still opens on nothing: the downbeat is empty by design.
        self.assertIsInstance(next(e for e in measures[0].notesAndRests), note.Rest)


class TestHandsSeparateArpeggios(unittest.TestCase):
    def test_the_quick_plan_has_them_in_c_at_stage_four(self) -> None:
        ids = {entry["id"]: entry for _, entry in default_plan(quick=True)}
        for hands in ("right", "left"):
            entry = ids.get(f"exercise.arpeggio.c-major.2oct.{hands}")
            self.assertIsNotNone(entry, hands)
            self.assertEqual(entry["level"], 4.3)
            entry = ids.get(f"exercise.arpeggio.a-minor.2oct.{hands}")
            self.assertIsNotNone(entry, hands)


class TestOdeToJoyBarTwelve(unittest.TestCase):
    """
    *Ode to Joy (full theme)*, `song.classical.ode-to-joy.full` (R48).

    Bar 12 is C4 D4 G3 in the right hand, and it printed 1 2 **5**: the little
    finger on the G below a thumb on middle C, which is the right hand
    crossing itself. Lesson 2.5 teaches this bar as the piece's one position
    shift, "a number that does not follow on from the last one", so the G is
    the thumb's: lift after the D, land the thumb on the G, and use the half
    note to come back to C position for bar 13. Read through the same ABC
    path the build compiles (`convert.py`: `prepare_abc`, then the fingerings
    put back by position).
    """

    ABC = REPO / "content" / "scores" / "authored" / "ode-to-joy-full.abc"

    def right_hand_bars(self) -> dict[int, list[tuple[pitch.Pitch, int | None]]]:
        text = self.ABC.read_text(encoding="utf-8")
        score = converter.parse(prepare_abc(text), format="abc")
        apply_fingerings(score, extract_fingerings(text))
        bars: dict[int, list[tuple[pitch.Pitch, int | None]]] = {}
        # Counted from 1 by position: music21 numbers this tune's first bar 0,
        # and `convert.renumber_measures` renumbers it from 1 for the page,
        # because it is a full bar and not a pickup.
        for number, measure in enumerate(score.parts[0].getElementsByClass("Measure"), start=1):
            notes = []
            for element in measure.notes:
                if not isinstance(element, note.Note):
                    continue
                fingers = [a.fingerNumber for a in element.articulations
                           if isinstance(a, articulations.Fingering)]
                notes.append((element.pitch, fingers[0] if fingers else None))
            bars[number] = notes
        return bars

    @staticmethod
    def below_the_thumb(bar: list[tuple[pitch.Pitch, int | None]]) -> list[str]:
        """
        A right-hand finger above the thumb on a pitch below the thumb's.

        Allowed only as a crossing: 2, 3 or 4 straight after the thumb, going
        down over it. Anything else is the hand on the wrong side of itself.
        """
        faults = []
        thumbs = [p.ps for p, f in bar if f == 1]
        for i, (p, f) in enumerate(bar):
            if f is None or f == 1:
                continue
            for thumb in thumbs:
                if p.ps >= thumb:
                    continue
                before = bar[i - 1] if i else None
                crossing = before is not None and before[1] == 1 and before[0].ps == thumb and f in (2, 3, 4)
                if not crossing:
                    faults.append(f"{p.nameWithOctave}({f}) under a thumb on {pitch.Pitch(ps=thumb).nameWithOctave}")
        return faults

    def test_bar_twelve_is_played_by_a_hand(self) -> None:
        bar = self.right_hand_bars()[12]
        self.assertEqual([p.nameWithOctave for p, _ in bar], ["C4", "D4", "G3"])
        self.assertEqual(self.below_the_thumb(bar), [])
        self.assertEqual([f for _, f in bar], [1, 2, 1])

    def test_no_bar_of_the_right_hand_crosses_under_its_thumb(self) -> None:
        faults = {number: self.below_the_thumb(bar) for number, bar in self.right_hand_bars().items()}
        self.assertEqual({n: f for n, f in faults.items() if f}, {})

    def test_the_rule_refuses_the_bar_that_shipped(self) -> None:
        shipped = [(pitch.Pitch("C4"), 1), (pitch.Pitch("D4"), 2), (pitch.Pitch("G3"), 5)]
        self.assertEqual(self.below_the_thumb(shipped), ["G3(5) under a thumb on C4"])
        crossing = [(pitch.Pitch("C4"), 1), (pitch.Pitch("B3"), 2)]
        self.assertEqual(self.below_the_thumb(crossing), [])


if __name__ == "__main__":
    unittest.main()
