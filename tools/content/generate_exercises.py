#!/usr/bin/env python3
"""
PianoPath exercise generator ([GEN] items).

Produces MusicXML (.mxl) grand-staff exercises plus a catalog fragment (JSON) describing them.
Designed to be extended by builders; the structure here is the contract:

    python generate_exercises.py --out build/generated --catalog build/generated/catalog.gen.json [--quick]

Every generator returns (music21.stream.Score, dict catalog_entry). The Score always has exactly
two PartStaff objects (RH, LH) inside one StaffGroup so MusicXML export yields a single piano
part with <staves>2</staves> — the layout OSMD expects for a grand staff.

Requires: music21>=10 (pip install music21).
"""
from __future__ import annotations

import argparse
import json
import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, NamedTuple

from music21 import (chord, clef, instrument, interval, key, layout, meter, metadata,
                     note, pitch, scale, stream, tempo, articulations, expressions)
from music21.scale import Direction


def note_name(name: str) -> str:
    """A pitch or key name as a reader writes it: A♭, not A-.

    music21 spells a flat as a trailing hyphen, which is fine inside the
    library and wrong the moment it reaches a screen. Two of the five title
    builders here remembered to translate it and three did not, so seventy
    items shipped called "A- major arpeggio" — visible in the Library on any
    screen wide enough to show two columns of it.
    """
    return name.replace("-", "♭").replace("#", "♯")

# --------------------------------------------------------------------------------------
# Fingering tables, verified against a published chart.
#
# The chart is Muzio Clementi, *Introduction to the Art of Playing on the Piano Forte*,
# Op. 42 (1801), in the Mutopia Project's CC BY-SA 4.0 typeset; it is extracted by
# tools/content/extract_fingering.py into content/sources/clementi-op42-fingering.json and
# compared against these tables by tools/content/tests/test_fingering.py.
#
# What the comparison checks is the **thumb positions**, because that is what a fingering
# is: the rest of the fingers follow by stepping. Three of the entries that were marked
# VERIFY disagreed with the chart and now follow it: the F# minor and C# minor right hands
# (Clementi turns the thumb under on the 7th degree, these had it on the 6th) and the
# G# minor left hand.
#
# Where our tables differ from Clementi in the *first* or *last* note only, that is
# deliberate and not a discrepancy: Clementi prints two-octave runs, so his first note is
# fingered for a hand that will keep going, while these are one-octave tables whose last
# entry is the finger you stop on.
#
# Each list is one octave ascending, 8 entries (tonic to tonic).
# --------------------------------------------------------------------------------------
MAJOR_FINGERING: dict[str, tuple[list[int], list[int]]] = {
    #  key : (RH ascending, LH ascending)
    "C":  ([1, 2, 3, 1, 2, 3, 4, 5], [5, 4, 3, 2, 1, 3, 2, 1]),
    "G":  ([1, 2, 3, 1, 2, 3, 4, 5], [5, 4, 3, 2, 1, 3, 2, 1]),
    "D":  ([1, 2, 3, 1, 2, 3, 4, 5], [5, 4, 3, 2, 1, 3, 2, 1]),
    "A":  ([1, 2, 3, 1, 2, 3, 4, 5], [5, 4, 3, 2, 1, 3, 2, 1]),
    "E":  ([1, 2, 3, 1, 2, 3, 4, 5], [5, 4, 3, 2, 1, 3, 2, 1]),
    "B":  ([1, 2, 3, 1, 2, 3, 4, 5], [4, 3, 2, 1, 4, 3, 2, 1]),
    "F":  ([1, 2, 3, 4, 1, 2, 3, 4], [5, 4, 3, 2, 1, 3, 2, 1]),
    "B-": ([4, 1, 2, 3, 1, 2, 3, 4], [3, 2, 1, 4, 3, 2, 1, 3]),
    "E-": ([3, 1, 2, 3, 4, 1, 2, 3], [3, 2, 1, 4, 3, 2, 1, 3]),
    "A-": ([3, 4, 1, 2, 3, 1, 2, 3], [3, 2, 1, 4, 3, 2, 1, 3]),
    "D-": ([2, 3, 1, 2, 3, 4, 1, 2], [3, 2, 1, 4, 3, 2, 1, 3]),
    "G-": ([2, 3, 4, 1, 2, 3, 1, 2], [4, 3, 2, 1, 3, 2, 1, 4]),
}
HARMONIC_MINOR_FINGERING: dict[str, tuple[list[int], list[int]]] = {
    "A":  ([1, 2, 3, 1, 2, 3, 4, 5], [5, 4, 3, 2, 1, 3, 2, 1]),
    "E":  ([1, 2, 3, 1, 2, 3, 4, 5], [5, 4, 3, 2, 1, 3, 2, 1]),
    "D":  ([1, 2, 3, 1, 2, 3, 4, 5], [5, 4, 3, 2, 1, 3, 2, 1]),
    "G":  ([1, 2, 3, 1, 2, 3, 4, 5], [5, 4, 3, 2, 1, 3, 2, 1]),
    "C":  ([1, 2, 3, 1, 2, 3, 4, 5], [5, 4, 3, 2, 1, 3, 2, 1]),
    "B":  ([1, 2, 3, 1, 2, 3, 4, 5], [4, 3, 2, 1, 4, 3, 2, 1]),
    "F":  ([1, 2, 3, 4, 1, 2, 3, 4], [5, 4, 3, 2, 1, 3, 2, 1]),
    # Clementi Op. 42: thumb on the 3rd and the 7th degree, not on the 6th.
    "F#": ([2, 3, 1, 2, 3, 4, 1, 2], [4, 3, 2, 1, 3, 2, 1, 4]),
    "C#": ([2, 3, 1, 2, 3, 4, 1, 2], [3, 2, 1, 4, 3, 2, 1, 3]),
    # …and the left hand here had its second thumb a degree early.
    "G#": ([3, 4, 1, 2, 3, 1, 2, 3], [3, 2, 1, 4, 3, 2, 1, 3]),
    "B-": ([2, 1, 2, 3, 1, 2, 3, 4], [2, 1, 3, 2, 1, 4, 3, 2]),
    "E-": ([3, 1, 2, 3, 4, 1, 2, 3], [2, 1, 4, 3, 2, 1, 3, 2]),
}
#: The twelve major and twelve minor keys, spelled the way they are played.
#:
#: The spellings are not interchangeable: D-flat minor needs eight flats and
#: G-flat minor nine, which MusicXML cannot express (its key signature runs
#: -7..+7) and OSMD will not draw. Generating them produced two scores that
#: parsed, counted their steps, and rendered nothing at all.
#: The three values every maker's `hands` argument may take.
#:
#: Two idioms were in use and they fail differently. Most makers write
#: `if hands in ("both", "right")` with an else that fills the staff with rest,
#: so an unknown value gives a grand staff of silence. `make_chromatic` writes
#: `if hands == "left": rest`, so an unknown value plays *both* hands. Neither
#: raises, and the second cannot be caught by looking at the score afterwards,
#: because a hands-together score is a perfectly good score — just not the one
#: that was asked for.
HANDS = ("both", "right", "left")

MAJOR_KEYS = ("C", "G", "D", "A", "E", "B", "F", "B-", "E-", "A-", "D-", "G-")
MINOR_KEYS = ("A", "E", "D", "G", "C", "B", "F", "F#", "C#", "G#", "B-", "E-")

ARPEGGIO_FINGERING_RH = [1, 2, 3, 5]   # root-position major/minor triad, white-key roots
ARPEGGIO_FINGERING_LH = [5, 3, 2, 1]
#: The same triad from a black-key root. The thumb does not take the black
#: key: the second finger starts, the thumb takes the next chord tone, and
#: the top note is the fourth finger — 2-1-2-4 in the right hand and its
#: mirror 2-1-4-2 in the left, which is the shape Hanon prints for every
#: black-key arpeggio (No. 41) and the one the graded syllabuses give for
#: D♭, E♭, A♭, B♭ and G♭ major and the black-root minors. Sixty items shipped
#: with the white-key table on these roots, thumb on the black key in every
#: one, and `confirm_fingering` cannot see it: a melodic line is not a chord.
ARPEGGIO_FINGERING_RH_BLACK = [2, 1, 2, 4]
ARPEGGIO_FINGERING_LH_BLACK = [2, 1, 4, 2]
#: A four-note seventh arpeggio from a white-key root: one finger a note,
#: thumb under after the fourth, 5 on the last note — 1-2-3-4 and 5-4-3-2.
#: The old `[1, 2, 3, 5]` put the little finger on the seventh and then
#: passed the thumb under *it*, which no hand does. Black-key roots print no
#: fingering at all and say so in the catalog (`fingeringVerified`), the
#: policy `make_blues_scale` set: better none than one this file invented.
SEVENTH_ARPEGGIO_FINGERING_RH = [1, 2, 3, 4]
SEVENTH_ARPEGGIO_FINGERING_LH = [5, 4, 3, 2]


def is_black_root(name: str) -> bool:
    """Whether a root name is a black key, spelled either way."""
    return pitch.Pitch(name + "4").pitchClass in BLACK_PITCH_CLASSES

# --------------------------------------------------------------------------------------
# levels
# --------------------------------------------------------------------------------------
#
# One table, `level_for()`, replaces the literal levels that used to sit in
# `default_plan()` (replan §3.1, `02` Part E amendment). Every scale variant was
# handed a literal 4.1 regardless of key, hands, octaves or motion, which is why
# 225 exercises sat at level 4 and none above 5 — the ladder above Stage 5 had
# nothing generated to stand on.
#
# The rules below are `02` Part E's stage table read as parameters. They are a
# judgement about difficulty, so they are in one place, named, and tested.

#: The keys a hand learns first, in the order Part E introduces them.
FIRST_THREE = ("C", "G", "F")
#: Sharp-side majors: the black keys fall under the long fingers, so two octaves
#: hands-together arrive earlier here than in the flat keys.
SHARP_SIDE = ("C", "G", "D", "A", "E", "B")
#: The three flat keys Part E names at stage 4; the remaining flats come later.
FLAT_SIDE = ("F", "B-", "E-")
#: The minors Part E introduces first (`02` stage 3: "A minor harmonic HS").
FIRST_MINORS = ("A", "E", "D")


def accidental_count(tonic: str, mode: str) -> int:
    """How many sharps or flats the key signature carries, as a count."""
    signature = key.Key(tonic if mode == "major" else tonic.lower())
    return abs(signature.sharps or 0)


def scale_level(tonic: str, mode: str, hands: str, octaves: int, motion: str, rhythm: float) -> float:
    """
    The level of one scale variant (replan §3.1).

    Read top-down: the widest span wins, because four octaves in a familiar key
    is harder than one octave in an unfamiliar one. Within a span, the key
    decides.
    """
    separately = hands != "both"
    if octaves >= 4:
        # `02` Part E stage 8: "all scales 4 oct at ♩=120 in 16ths". The span is
        # stage 6 work; doing it in sixteenths at speed is what stage 8 adds.
        return 8.1 if rhythm <= 0.25 else 6.2
    if octaves == 3:
        return 6.1
    if mode == "chromatic":
        return 6.1 if octaves >= 2 else 4.4
    if mode == "major":
        if separately and octaves == 1:
            # The same key order as the hands-together bands below, a step
            # lower, because one hand is the easier version of the same work.
            # This used to lump every key past D and A into one 4.2, which put
            # E and B major *above* their own hands-together score: the same
            # scale, in the same key, rated harder for using one hand.
            if tonic in FIRST_THREE:
                return 2.5
            if tonic in ("D", "A"):
                return 3.1
            return 3.2 if tonic in SHARP_SIDE else 4.2
        # Hands together, one or two octaves, similar or contrary: the same
        # three key bands, because what makes B major hard is the key and not
        # the direction.
        # One and two octaves take the same bands, which is what the paragraph
        # above says and what the code did not do: the one-octave path had a
        # narrower easy set, `("C", "G", "D", "A")`, so E and B major scored 5.1
        # at one octave and 4.1 at two — the same scale, in the same key, rated
        # harder for being shorter.
        if tonic in SHARP_SIDE:
            return 4.1
        return 4.2 if tonic in FLAT_SIDE else 5.1
    # Minors: harmonic, melodic and natural share a table.
    if separately and octaves == 1:
        return 3.3 if tonic in FIRST_MINORS else 4.2
    if octaves >= 2:
        return 5.1 if accidental_count(tonic, "minor") <= 3 else 5.2
    # Hands together at one octave. Part E names three minors at stage 4 — "Am
    # Em Dm harmonic+melodic HT 1–2 oct" — and no others until stage 5, so the
    # remote keys follow the same accidental split as two octaves rather than
    # all landing on 4.2. Letting them sit at 4.2 was most of what was left of
    # the level-4 bulge: 36 items in keys the stage does not teach.
    if tonic in FIRST_MINORS:
        return 4.2
    return 5.1 if accidental_count(tonic, "minor") <= 3 else 5.2


def arpeggio_level(root: str, quality: str, hands: str, octaves: int) -> float:
    """Triads and sevenths (replan §3.1)."""
    if quality in ("major", "minor"):
        if octaves >= 4:
            return 6.2
        return 4.3 if hands != "both" else 5.1
    if quality == "dominant7":
        # Part E puts the dominant 7th in C, G and F at stage 5 and the rest a
        # stage later, which is the same three-key ordering the scales use.
        return 5.2 if root in FIRST_THREE else 6.1
    if quality == "diminished7":
        return 6.1
    # maj7, min7 and half-diminished: the shapes Part E puts at stage 6, and
    # the broken-seventh patterns built on them at stage 7.
    return 6.3


def broken_seventh_level(root: str) -> float:
    """Broken-seventh patterns in all keys — Part E stage 7."""
    return 7.2 if root not in FIRST_THREE else 7.1

# Hanon 1–20 come from content/sources/hanon-mutopia.json, encoded by
# tools/content/extract_hanon.py from the Mutopia Project's public-domain edition of
# *The Virtuoso Pianist* (1873). Encoding twenty exercises from memory would have been
# twenty chances to teach the owner a wrong note; reading them from a published edition is
# not.
HANON_DATA_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "content", "sources", "hanon-mutopia.json",
)


def load_hanon() -> dict:
    with open(HANON_DATA_PATH, encoding="utf-8") as handle:
        return json.load(handle)["exercises"]


# --------------------------------------------------------------------------------------
# helpers
# --------------------------------------------------------------------------------------
def slug(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def key_slug(name: str) -> str:
    """
    A key name as an id fragment, keeping the accidental.

    `slug("E-")` is "e", which is also `slug("E")` — so every flat key
    collided with its natural and half the generated catalog shared ids with
    the other half. Validation caught it; this stops it happening again.
    """
    return slug(name.replace("-", "-flat").replace("#", "-sharp"))


#: Minor keys whose signature MusicXML cannot write.
#:
#: The same fact `MAJOR_KEYS` is spelled to avoid, one mode over: D flat minor
#: needs eight flats and G flat minor nine, and MusicXML's key signature runs
#: -7..+7. A score in one of them parses, counts its steps, reports the right
#: bar count — and renders nothing at all. The harmony families take their root
#: from `HARMONY_KEYS`, which holds D flat, so every maker that lowers its root
#: into the minor has to be told about this or it will engrave a page nobody can
#: see the moment `--full` reaches that key.
UNWRITABLE_MINOR = frozenset({"D-", "G-"})


def minor_key(tonic: str) -> key.Key:
    """The minor key on `tonic`, or a loud failure where it cannot be written."""
    if tonic in UNWRITABLE_MINOR:
        raise ValueError(
            f"{tonic} minor needs more than seven flats, which MusicXML cannot "
            "express and no renderer will draw. Use the enharmonic spelling, or "
            "leave this key out of the family's plan."
        )
    return key.Key(tonic.lower())


def grand_staff(title: str, bpm: int, ts: str = "4/4", ks: key.Key | None = None) -> tuple[stream.Score, stream.PartStaff, stream.PartStaff]:
    sc = stream.Score()
    sc.metadata = metadata.Metadata()
    sc.metadata.title = title
    sc.metadata.composer = "PianoPath (generated)"
    rh = stream.PartStaff(id="RH")
    lh = stream.PartStaff(id="LH")
    for p, cl in ((rh, clef.TrebleClef()), (lh, clef.BassClef())):
        p.insert(0, instrument.Piano())
        p.insert(0, cl)
        p.insert(0, meter.TimeSignature(ts))
        if ks is not None:
            p.insert(0, ks)
    rh.insert(0, tempo.MetronomeMark(number=bpm))
    sc.insert(0, rh)
    sc.insert(0, lh)
    sc.insert(0, layout.StaffGroup([rh, lh], name="Piano", abbreviation="Pno.", symbol="brace"))
    return sc, rh, lh


def add_notes(part: stream.PartStaff, pitches: Iterable[pitch.Pitch], fingers: Iterable[int] | None, ql: float) -> None:
    fingers = list(fingers) if fingers is not None else None
    for i, p in enumerate(pitches):
        n = note.Note(p, quarterLength=ql)
        if fingers:
            n.articulations.append(articulations.Fingering(fingers[i % len(fingers)] if len(fingers) != 0 else 1))
        part.append(n)


def fingered_chord(pitches: Iterable[pitch.Pitch], fingers: Iterable[int], ql: float) -> chord.Chord:
    """
    A chord whose fingering survives the MusicXML export.

    Fingering attached to the Note objects *inside* a chord is silently dropped by
    music21 10.5 — it exports nothing at all. Attached to the chord itself, several
    Fingering articulations are mapped onto its notes in pitch order, low to high, which is
    what MusicXML wants. Measured, not assumed: every chord-shaped exercise written before
    this helper existed shipped with no fingering on it.
    """
    tones = sorted(pitches, key=lambda p: p.ps)
    c = chord.Chord(tones, quarterLength=ql)
    for finger in fingers:
        c.articulations.append(articulations.Fingering(finger))
    return c


class WrongNotes(AssertionError):
    """A generated score whose notes contradict its own chord symbol."""


def confirm(sc: stream.Score, label: str = "") -> stream.Score:
    """
    Checks that a chord does not carry the third its symbol did not ask for.

    **What this is not.** It is not a check that an exercise is musically right,
    and it cannot be one. Both the symbol and the notes are derived from the
    same `quality`, so if the underlying table is wrong they are wrong together
    and this passes. Correctness of the *music* comes from the tables —
    `SEVENTH_VOICINGS`, `TRIAD_INTERVALS`, `TURNAROUNDS`, `TWELVE_BAR` — small
    enough to read and are the one place each musical fact is written down.

    **What it is.** A guard against deriving the same fact twice by different
    routes. `make_turnaround` looked its symbol up and then worked its third out
    inline with `quality.startswith("m")`, which is true of "maj7", so twelve
    keys of major sevenths were engraved as minor triads under major symbols.
    Everything else passed: valid MusicXML, right symbols, right item count, no
    doubled accidental. Only the pitches disagreed, and nothing was reading them.

    Those two routes are now one table lookup, so this can no longer fire on
    anything that ships. It stays because the next person to inline a musical
    fact will be told, at the moment they do it, rather than after a learner has
    practised the wrong chord for a week.

    A cluster check was tried here too and removed the same afternoon: it failed
    on `['C5', 'E5', 'F5', 'A5']`, which is a Dm7 rootless B voicing with the
    ninth a semitone under the third, and that semitone *is* the voicing. A rule
    that cannot tell a cluster from a colour has no business in a build.
    """
    from music21 import chord as m21chord, harmony as m21harmony

    for part in sc.parts:
        symbol = None
        for element in part.flatten().notesAndRests:
            if isinstance(element, m21harmony.ChordSymbol):
                symbol = element
                continue
            if symbol is None or not isinstance(element, m21chord.Chord):
                continue
            sounding = {pp.pitchClass for pp in element.pitches}
            root = symbol.root().pitchClass
            minorish = symbol.quality == "minor"
            unwanted = {(root + (4 if minorish else 3)) % 12}
            if sounding & unwanted:
                raise WrongNotes(
                    f"{label or sc.metadata.title}: {symbol.figure} sounds "
                    f"{[pp.nameWithOctave for pp in element.pitches]}, which carries the "
                    f"{'major' if minorish else 'minor'} third"
                )
            # A symbol that names a seventh has to have one under it.
            #
            # Two intro tiers printed "Dm7" and "G7" over plain triads, at the
            # level where a learner is being taught what a chord symbol means,
            # and the app has a chord-chart view that reads exactly these
            # symbols. Stride printed a dominant over a triad in every bar of
            # every key, because its after-beat pair took the fifth instead of
            # the seventh.
            #
            # Chords only, never single notes: a walking bass outlines C7 with
            # C-E-G and an approach note and is not wrong to. And not a slash
            # chord -- music21 reads the bass of "C/B" as a seventh, which it is
            # harmonically, but the B is in the other hand where it belongs.
            seventh = symbol.seventh
            if (
                seventh is not None
                and symbol.bass().pitchClass == root
                and seventh.pitchClass not in sounding
            ):
                raise WrongNotes(
                    f"{label or sc.metadata.title}: {symbol.figure} sounds "
                    f"{[pp.nameWithOctave for pp in element.pitches]}, which has no "
                    f"{seventh.name} in it — either the notes or the symbol is the "
                    "simplification, and they have to agree"
                )
    return sc


class ImpossibleFingering(AssertionError):
    """A chord whose printed fingering no hand could take."""


def confirm_fingering(sc: stream.Score, label: str = "") -> stream.Score:
    """
    Checks that each chord's printed fingering describes a hand.

    Two facts, and neither is a matter of taste. A finger is one place, so it
    cannot be on two notes of the same chord. And fingers lie across the hand in
    order, so within a chord they have to run with the pitches: 1 at the bottom
    climbing to 5 in the right hand, 5 at the bottom down to 1 in the left. A
    hand cannot cross itself.

    Every fingered chord in the whole plan is checked here rather than in a test
    because a test over 4,700 chords takes ten minutes and would be run once.
    This costs nothing and runs on every build, including `--full`, where the
    flat keys live and where most of what it found was hiding.

    What it found, on the run that introduced it: 150 chords. Every left-hand
    octave scale in the shipped set printed the thumb on the *bottom* note and
    the fifth on top, which is a right hand — the maker wrote one fingering rule
    and used it for both hands, and its own docstring said "in both hands".

    It says nothing about *which* fingering is best. 1-3-5 or 1-2-5 on a triad
    is a judgement and belongs in the tables. Only the impossible is an error.
    """
    from music21 import chord as m21chord

    for part in sc.parts:
        # `grand_staff` names them; anything else is not a two-hand score.
        if part.id not in ("RH", "LH"):
            continue
        for element in part.recurse().getElementsByClass(m21chord.Chord):
            fingers = [
                a.fingerNumber for a in element.articulations
                if isinstance(a, articulations.Fingering)
            ]
            if len(fingers) != len(element.pitches):
                # Partly fingered chords are legitimate: some makers mark only
                # the note the exercise is about.
                continue
            where = f"{label or sc.metadata.title} ({part.id})"
            notes = [pp.nameWithOctave for pp in element.pitches]
            if len(set(fingers)) != len(fingers):
                raise ImpossibleFingering(
                    f"{where}: {notes} asks one finger for two notes — {fingers}"
                )
            wanted = sorted(fingers, reverse=part.id == "LH")
            if fingers != wanted:
                raise ImpossibleFingering(
                    f"{where}: {notes} fingered {fingers} low to high, which "
                    f"crosses the hand; it wants {wanted}"
                )
    return sc


def confirm_not_silent(sc: stream.Score, label: str = "") -> stream.Score:
    """
    A score has to have a note in it.

    Every maker that takes `hands` writes it as `if hands in ("both", "right")`
    with an `else` that fills the staff with rest, twice. So `hands="rigth"` —
    or any other value the maker does not know — does not fail: it produces a
    grand staff of silence, valid MusicXML, right title, right catalogue row,
    right bar count, and nothing to play. This is the one check that catches
    that for every maker at once, including any written later.
    """
    for part in sc.parts:
        if any(True for _ in part.recurse().notes):
            return sc
    raise WrongNotes(
        f"{label or sc.metadata.title}: not one note in any staff — "
        "almost always a `hands` value no maker recognises"
    )


def pad_final_bar(sc: stream.Score) -> stream.Score:
    """
    Fill out the last bar of each staff with rest, so a piece ends on a barline.

    Nine hundred of the two thousand staves stopped part-way through their last
    bar — a one-octave scale is fifteen eighths, which is a bar and seven
    eighths, so the final bar was drawn a beat short with nothing saying why.
    Every note keeps its place; this only says where the bar ends, which is what
    a printed edition does.
    """
    for part in sc.parts:
        measures = list(part.getElementsByClass('Measure'))
        if not measures:
            continue
        signatures = part.recurse().getElementsByClass(meter.TimeSignature)
        bar_len = float(signatures[0].barDuration.quarterLength) if signatures else 4.0
        last = measures[-1]
        short = bar_len - float(last.duration.quarterLength)
        if 0 < short < bar_len:
            last.append(note.Rest(quarterLength=short))
    return sc


def confirm_playable(sc: stream.Score, label: str = "") -> stream.Score:
    """
    Every note has to be a key that exists: A0 to C8.

    Forty-four items asked for keys that are not there — the four-octave scales
    and arpeggios in D, E, F sharp, G, A and B, two hundred and six notes above
    the top of the instrument — because every run started at `tonic4` whatever
    its span, and G4 plus four octaves is G8. Nothing could see it: the
    MusicXML is valid, the pitches are spelled correctly, the fingering is
    right, and a renderer will draw D8 on as many ledger lines as it takes.
    """
    for part in sc.parts:
        for n in part.recurse().notes:
            for pp in n.pitches:
                if not (KEYBOARD_BOTTOM <= pp.midi <= KEYBOARD_TOP):
                    raise WrongNotes(
                        f"{label or sc.metadata.title}: {pp.nameWithOctave} is not on a "
                        "piano — the run needs to start lower, not stop early"
                    )
    return sc


def finalize(sc: stream.Score) -> stream.Score:
    for p in sc.parts:
        p.makeMeasures(inPlace=True)
        p.makeTies(inPlace=True)
    return confirm_playable(confirm_not_silent(confirm_fingering(confirm(pad_final_bar(sc)))))


def write(sc: stream.Score, out_dir: str, item_id: str) -> str:
    """
    Writes one generated exercise, through the same writer every other score uses.

    Not `sc.write()` directly: music21 mints part ids from object identity and
    stamps zip entries with the wall clock, so these 426 files changed bytes on
    every build. Nothing noticed until the render check became incremental —
    and then it re-engraved all 426 every run, because the manifest is keyed on
    the output file's sha256 and none of them ever matched. `write_mxl` pins
    both (see convert.normalise_archive).
    """
    from convert import write_mxl  # late import: music21 is slow to load

    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, item_id + ".mxl")
    write_mxl(sc, Path(path))
    return path


def catalog_entry(item_id: str, title: str, level: float, concepts: list[str], hands: str, bpm: int,
                  kind: str, params: dict, file_rel: str, tracks: list[str] | None = None) -> dict:
    return {
        "id": item_id,
        "type": "exercise",
        "title": title,
        "composer": None,
        "arranger": "PianoPath generator",
        "genre": ["technique"],
        "tracks": tracks or ["technique", "core"],
        "level": level,
        # A generated exercise's level comes from the parameters that generated
        # it — the key, the span, the rhythm — so it is judged for that item by
        # the table that produced it, not banded from a neighbour.
        "levelSource": "judged",
        "abrsmGradeApprox": None,
        "concepts": concepts,
        "hands": hands,
        "durationSec": None,
        "tempoBpm": bpm,
        "keySig": params.get("key"),
        "timeSig": params.get("timeSig", "4/4"),
        "file": file_rel,
        "variantOf": None,
        "variantLabel": None,
        "drill": {"kind": kind, "params": params},
        "source": {"name": "PianoPath generator", "url": None, "license": "CC0", "pd_region": "worldwide",
                   "fetchedAt": None, "checksum": None, "editionNotes": None},
        "importHint": None,
        "teaching": {"lessonIds": [], "notes": "", "practiceTips": [], "sections": []},
        "media": [],
        "tags": ["generated"],
    }


def expand_fingering(
    one_octave: list[int], octaves: int, ascending: bool = True, hand: str = "right",
) -> list[int]:
    """
    Repeat a one-octave fingering over N octaves. `one_octave` is 8 entries, tonic to tonic.

    The two hands repeat differently, and the reason is visible on the keyboard.
    The right thumb *starts* each octave group, so a tonic in the middle of a
    run takes the finger the run began with and the join is `one_octave[0]`.
    The left thumb *ends* one, so the middle tonic takes the finger the octave
    ends on and the next group begins at the second entry.

    One rule was used for both. Every two-octave left-hand scale in C, G, D, A,
    E, B and F major and in A, E, D, G, C, B and F harmonic minor printed the
    *fifth finger* on the middle tonic — a hand told to jump back to its little
    finger halfway up an ascending scale. Fourteen keys, and the seven flat ones
    hid it, because their tables happen to begin and end on the same finger, so
    both rules agree there and the bug is invisible in exactly the keys a
    reader would check last.
    """
    if hand == "left":
        fingers = [one_octave[0]] + one_octave[1:] * octaves
    else:
        fingers = one_octave[:-1] * octaves + [one_octave[-1]]
    return fingers if ascending else list(reversed(fingers))


# --------------------------------------------------------------------------------------
# generators
# --------------------------------------------------------------------------------------
@dataclass
class ScaleSpec:
    tonic: str = "C"          # music21 spelling: "B-" for B-flat, "F#" for F-sharp
    mode: str = "major"       # major | harmonic | melodic | natural | chromatic
    hands: str = "both"       # both | right | left
    octaves: int = 1
    motion: str = "similar"   # similar | contrary
    rhythm: float = 0.5       # quarterLength per note: 1.0 quarters, 0.5 eighths, 0.25 sixteenths
    bpm: int = 60

    @property
    def level(self) -> float:
        """Derived, never passed: see `scale_level` and replan §3.1."""
        return scale_level(self.tonic, self.mode, self.hands, self.octaves, self.motion, self.rhythm)


def make_scale(spec: ScaleSpec) -> tuple[stream.Score, dict]:
    if spec.mode == "major":
        sc_obj = scale.MajorScale(spec.tonic)
        fing = MAJOR_FINGERING.get(spec.tonic)
        ks = key.Key(spec.tonic, "major")
        mode_label = "major"
    elif spec.mode == "harmonic":
        sc_obj = scale.HarmonicMinorScale(spec.tonic)
        fing = HARMONIC_MINOR_FINGERING.get(spec.tonic)
        ks = key.Key(spec.tonic.lower(), "minor")
        mode_label = "harmonic minor"
    elif spec.mode == "melodic":
        sc_obj = scale.MelodicMinorScale(spec.tonic)
        fing = HARMONIC_MINOR_FINGERING.get(spec.tonic)
        ks = key.Key(spec.tonic.lower(), "minor")
        mode_label = "melodic minor"
    elif spec.mode == "natural":
        sc_obj = scale.MinorScale(spec.tonic)
        fing = HARMONIC_MINOR_FINGERING.get(spec.tonic)
        ks = key.Key(spec.tonic.lower(), "minor")
        mode_label = "natural minor"
    else:
        raise ValueError(spec.mode)

    title = f"{note_name(spec.tonic)} {mode_label} scale — {spec.octaves} oct, {spec.motion}, {spec.hands}"
    sc, rh, lh = grand_staff(title, spec.bpm, ks=ks)

    one_of("motion", spec.motion, ("similar", "contrary"))
    one_of("hands", spec.hands, ("both", "right", "left"))
    rh_start = fits_on_the_keyboard(spec.tonic, spec.octaves, 4)
    lh_preferred = 3
    if spec.tonic in ("A", "B", "B-", "A-", "G", "G-"):
        # keep the LH inside the bass staff without excessive ledger lines
        lh_preferred = 2
    lh_start = fits_on_the_keyboard(spec.tonic, spec.octaves, lh_preferred)

    def run(start: pitch.Pitch, direction: str) -> list[pitch.Pitch]:
        top = start.transpose(12 * spec.octaves)
        if spec.mode == "melodic":
            up = sc_obj.getPitches(start, top, direction=Direction.ASCENDING)
            down = list(reversed(scale.MinorScale(spec.tonic).getPitches(start, top)))[1:]
        else:
            up = sc_obj.getPitches(start, top)
            down = list(reversed(up))[1:]
        return up + down if direction == "up" else list(reversed(up)) + up[1:]

    rh_p = run(rh_start, "up")
    lh_p = run(lh_start, "up" if spec.motion == "similar" else "down")

    rh_f = lh_f = None
    if fing:
        rh_f = expand_fingering(fing[0], spec.octaves) + expand_fingering(fing[0], spec.octaves, ascending=False)[1:]
        lh_asc = expand_fingering(fing[1], spec.octaves, hand="left")
        lh_f = lh_asc + list(reversed(lh_asc))[1:]
        if spec.motion == "contrary":
            lh_f = list(reversed(lh_asc)) + lh_asc[1:]

    if spec.hands in ("both", "right"):
        add_notes(rh, rh_p, rh_f, spec.rhythm)
    else:
        rh.append(note.Rest(quarterLength=spec.rhythm * len(rh_p)))
    if spec.hands in ("both", "left"):
        add_notes(lh, lh_p, lh_f, spec.rhythm)
    else:
        lh.append(note.Rest(quarterLength=spec.rhythm * len(lh_p)))
    finalize(sc)

    item_id = f"exercise.scale.{key_slug(spec.tonic)}-{slug(mode_label)}.{spec.octaves}oct.{spec.motion}.{spec.hands}.{int(spec.rhythm*4)}"
    entry = catalog_entry(item_id, title, spec.level,
                          ["scale", f"{note_name(spec.tonic)}-{mode_label}", spec.motion, f"hands:{spec.hands}"],
                          spec.hands, spec.bpm, "scale",
                          {"key": spec.tonic, "mode": spec.mode, "octaves": spec.octaves, "motion": spec.motion,
                           "rhythm": spec.rhythm, "fingeringVerified": fing is not None},
                          f"scores/generated/{item_id}.mxl")
    return sc, entry



def make_arpeggio(root: str, quality: str = "major", hands: str = "both", octaves: int = 2, bpm: int = 60) -> tuple[stream.Score, dict]:
    one_of("hands", hands, HANDS)
    level = arpeggio_level(root, quality, hands, octaves)
    intervals = triad(quality)
    title = f"{note_name(root)} {quality} arpeggio — {octaves} oct, {hands}"
    ks = key.Key(root if quality == "major" else root.lower())
    sc, rh, lh = grand_staff(title, bpm, ks=ks)

    def run(start: pitch.Pitch) -> list[pitch.Pitch]:
        up = [start.transpose(12 * o + i) for o in range(octaves) for i in intervals] + [start.transpose(12 * octaves)]
        return up + list(reversed(up))[1:]

    rh_p = run(fits_on_the_keyboard(root, octaves, 4))
    lh_p = run(fits_on_the_keyboard(root, octaves, 2))
    n_up = 3 * octaves + 1
    black = is_black_root(root)
    rh_table = ARPEGGIO_FINGERING_RH_BLACK if black else ARPEGGIO_FINGERING_RH
    lh_table = ARPEGGIO_FINGERING_LH_BLACK if black else ARPEGGIO_FINGERING_LH
    rh_f = rh_table[:3] * octaves + [rh_table[3]]
    rh_f = rh_f + list(reversed(rh_f))[1:]
    lh_f = lh_table[:3] * octaves + [lh_table[3]]
    lh_f = lh_f + list(reversed(lh_f))[1:]
    assert len(rh_f) == len(rh_p) == 2 * n_up - 1
    if hands in ("both", "right"):
        add_notes(rh, rh_p, rh_f, 0.5)
    else:
        rh.append(note.Rest(quarterLength=0.5 * len(rh_p)))
    if hands in ("both", "left"):
        add_notes(lh, lh_p, lh_f, 0.5)
    else:
        lh.append(note.Rest(quarterLength=0.5 * len(lh_p)))
    finalize(sc)
    item_id = f"exercise.arpeggio.{key_slug(root)}-{quality}.{octaves}oct.{hands}"
    entry = catalog_entry(item_id, title, level, ["arpeggio", f"{note_name(root)}-{quality}", f"hands:{hands}"], hands, bpm,
                          "arpeggio", {"key": root, "quality": quality, "octaves": octaves, "fingeringVerified": True},
                          f"scores/generated/{item_id}.mxl")
    return sc, entry


def make_triad_inversions(root: str, quality: str = "major", hands: str = "both", bpm: int = 60, level: float = 4.3) -> tuple[stream.Score, dict]:
    # 4.3 for every key: `02` Part E puts "triads all inversions (12 major, 12
    # minor)" at stage 4 without splitting them by key, and the shape really is
    # the same work in all of them.
    """Root position, 1st inversion, 2nd inversion, root (octave up), then back down — as block chords."""
    one_of("hands", hands, HANDS)
    base = triad(quality)
    third = base[1]
    title = f"{note_name(root)} {quality} triad inversions — {hands}"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key(root if quality == "major" else root.lower()))
    shapes = [base, [base[1], base[2], 12], [base[2], 12, 12 + third], [12, 12 + third, 19]]
    seq = shapes + list(reversed(shapes))[1:]
    # The conventional inversion fingerings, low to high. These are the shapes every method
    # book prints — the finger that changes is the one next to the wide gap — and unlike the
    # scale tables above they are convention rather than an extraction from the Clementi
    # chart, which covers scales only.
    inversion_fingers = {
        "right": ([1, 3, 5], [1, 2, 5], [1, 3, 5], [1, 3, 5]),
        "left": ([5, 3, 1], [5, 3, 1], [5, 2, 1], [5, 3, 1]),
    }
    for part_, oct_, side in ((rh, 4, "right"), (lh, 2, "left")):
        if (part_ is rh and hands == "left") or (part_ is lh and hands == "right"):
            part_.append(note.Rest(quarterLength=len(seq)))
            continue
        fingers = inversion_fingers[side]
        order = list(range(len(shapes))) + list(reversed(range(len(shapes))))[1:]
        for position, shp in zip(order, seq):
            part_.append(
                fingered_chord(
                    [pitch.Pitch(root + str(oct_)).transpose(i) for i in shp],
                    fingers[position],
                    1.0,
                )
            )
    finalize(sc)
    item_id = f"exercise.inversions.{key_slug(root)}-{quality}.{hands}"
    entry = catalog_entry(item_id, title, level, ["triad", "inversions", f"{note_name(root)}-{quality}"], hands, bpm, "inversion",
                          {"key": root, "quality": quality}, f"scores/generated/{item_id}.mxl")
    return sc, entry


def make_five_finger(root: str, quality: str = "major", hands: str = "both", bpm: int = 60) -> tuple[stream.Score, dict]:
    """C-D-E-F-G-F-E-D-C style pattern in quarters, then the five notes as a block chord."""
    # replan §3.1: hands separately is unit 1.1, hands together is 2.1.
    one_of("hands", hands, HANDS)
    level = 1.1 if hands != "both" else 2.1
    steps = [0, 2, 4, 5, 7] if quality == "major" else [0, 2, 3, 5, 7]
    seq = steps + list(reversed(steps))[1:]
    title = f"{note_name(root)} {quality} five-finger pattern — {hands}"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key(root if quality == "major" else root.lower()))
    rh_f = [1, 2, 3, 4, 5, 4, 3, 2, 1]
    lh_f = [5, 4, 3, 2, 1, 2, 3, 4, 5]
    for part_, oct_, fing in ((rh, 4, rh_f), (lh, 3, lh_f)):
        if (part_ is rh and hands == "left") or (part_ is lh and hands == "right"):
            part_.append(note.Rest(quarterLength=len(seq) + 3))
            continue
        add_notes(part_, [pitch.Pitch(root + str(oct_)).transpose(s) for s in seq], fing, 1.0)
        part_.append(note.Rest(quarterLength=3.0))
    finalize(sc)
    item_id = f"exercise.five-finger.{key_slug(root)}-{quality}.{hands}"
    entry = catalog_entry(item_id, title, level, ["five-finger", f"{note_name(root)}-{quality}", f"hands:{hands}"], hands, bpm,
                          "five-finger", {"key": root, "quality": quality}, f"scores/generated/{item_id}.mxl")
    return sc, entry


def make_hanon(
    number: int,
    hands: str = "both",
    bpm: int = 60,
    data: dict | None = None,
) -> tuple[stream.Score, dict]:
    """
    One Hanon exercise, note for note as the Mutopia edition prints it.

    The data is a list of diatonic scale degrees per hand, counted from the
    hand's starting note, so building the score is a walk up the C major scale
    rather than a reconstruction of the pattern.
    """
    # replan §3.1: Hanon 1-10 is stage 4 work, 11-20 stage 5.
    one_of("hands", hands, HANDS)
    level = 4.4 if number <= 10 else 5.3
    exercises = data if data is not None else load_hanon()
    spec = exercises[str(number)]
    cmaj = scale.MajorScale("C")
    title = f"Hanon No. {number} (C major) — {hands}"
    sc, rh, lh = grand_staff(title, bpm, ts="2/4", ks=key.Key("C"))

    def degrees_to_pitches(start_name: str, degrees: list[int]) -> list[pitch.Pitch]:
        start = pitch.Pitch(start_name)
        out = []
        for degree in degrees:
            if degree == 0:
                out.append(pitch.Pitch(start.nameWithOctave))
                continue
            direction = Direction.ASCENDING if degree > 0 else Direction.DESCENDING
            out.append(cmaj.nextPitch(start, direction=direction, stepSize=abs(degree)))
        return out

    ql = 0.25  # sixteenths in 2/4: eight notes to the bar, as printed
    for part_, side in ((rh, "rh"), (lh, "lh")):
        wanted = not ((part_ is rh and hands == "left") or (part_ is lh and hands == "right"))
        pitches = degrees_to_pitches(spec[side]["start"], spec[side]["steps"])
        fingers = spec[side]["fingers"]
        if not wanted:
            part_.append(
                note.Rest(quarterLength=ql * (len(pitches) - spec.get("finalChordNotes", 1)) + 2)
            )
            continue
        # The closing note is long, and in No. 20 it is a two-note chord.
        final = spec.get("finalChordNotes", 1)
        for index, p in enumerate(pitches[:-final]):
            n = note.Note(p, quarterLength=ql)
            finger = fingers[index] if index < len(fingers) else None
            if finger:
                n.articulations.append(articulations.Fingering(finger))
            part_.append(n)
        closing = pitches[-final:]
        part_.append(
            note.Note(closing[0], quarterLength=2.0)
            if len(closing) == 1
            else chord.Chord(closing, quarterLength=2.0)
        )
    finalize(sc)
    item_id = f"exercise.hanon.{number:02d}.{hands}"
    entry = catalog_entry(
        item_id, title, level, ["hanon", "finger-independence", f"hands:{hands}"], hands, bpm, "hanon",
        {"number": number, "key": "C", "timeSig": "2/4"}, f"scores/generated/{item_id}.mxl",
    )
    # The note data was read from a CC BY-SA edition, so it is credited even
    # though the composition itself is public domain (docs/03 §1 rule 2).
    entry["source"] = {
        "name": "Hanon, The Virtuoso Pianist (1873); note data from the Mutopia Project edition",
        "url": "https://github.com/MutopiaProject/MutopiaProject",
        "license": "PD (composition); edition CC BY-SA 4.0",
        "pd_region": "worldwide",
        "fetchedAt": None,
        "checksum": None,
        "editionNotes": "Typeset by Steve Taylor and Javier Ruiz-Alma for the Mutopia Project.",
    }
    entry["composer"] = "Charles-Louis Hanon"
    return sc, entry


#: Black keys, where the chromatic scale puts the third finger.
BLACK_PITCH_CLASSES = {1, 3, 6, 8, 10}


def chromatic_finger(midi: int, first: bool, hand: str = "right") -> int:
    """
    The modern chromatic fingering: 3 on every black key, 1 on every white,
    and 2 on one white of each adjacent white pair.

    Which one is the hand. The thumb is the *lower* finger of the right hand
    and the *upper* finger of the left, so the right hand puts 2 on the upper
    white of the pair — F and C — and the left on the lower, E and B. Written
    out, the left hand ascending from C is 1 3 1 3 2 1 3 1 3 1 3 2 1. One
    rule was used for both hands, so the left was told E1 F2 going up: the
    second finger climbing over the thumb by a semitone, which is not a
    fingering anybody plays. Twelve items.

    It is *not* what Clementi Op. 42 prints — his 1801 chromatic runs 1-2-3-4
    across the keys — and that is a deliberate departure from the chart the
    scale fingerings were verified against: the 1-3 shape is what every
    modern method teaches and what the learner will see everywhere else.
    """
    pitch_class = midi % 12
    if pitch_class in BLACK_PITCH_CLASSES:
        return 3
    seconds = (4, 11) if hand == "left" else (5, 0)
    if pitch_class in seconds:
        # Except at the very start, where the thumb begins the run.
        return 1 if first else 2
    return 1


def make_chromatic(
    start: str = "C", hands: str = "both", octaves: int = 1, bpm: int = 60
) -> tuple[stream.Score, dict]:
    """
    The chromatic scale, with the standard 1-3 fingering.

    Both hands use the same shape ascending: thumb on every white key that has
    no black key above it, third finger on the black keys. It is written out
    rather than generated from a scale object so the fingering can be attached
    to the right notes.
    """
    one_of("hands", hands, HANDS)
    level = scale_level(start, "chromatic", hands, octaves, "similar", 0.5)
    title = f"Chromatic scale from {note_name(start)} — {octaves} oct, {hands}"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key("C"))

    def run(base: str) -> list[pitch.Pitch]:
        first = pitch.Pitch(base)
        up = [first.transpose(i) for i in range(12 * octaves + 1)]
        return up + list(reversed(up))[1:]

    def fingers_for(pitches: list[pitch.Pitch], hand: str) -> list[int]:
        return [chromatic_finger(int(p.midi), index == 0, hand) for index, p in enumerate(pitches)]

    for part_, base, hand in ((rh, f"{start}4", "right"), (lh, f"{start}3", "left")):
        if (part_ is rh and hands == "left") or (part_ is lh and hands == "right"):
            part_.append(note.Rest(quarterLength=0.5 * (2 * (12 * octaves + 1) - 1)))
            continue
        pitches = run(base)
        add_notes(part_, pitches, fingers_for(pitches, hand), 0.5)
    finalize(sc)
    item_id = f"exercise.chromatic.{key_slug(start)}.{octaves}oct.{hands}"
    entry = catalog_entry(
        item_id, title, level, ["chromatic", "semitones", f"hands:{hands}"], hands, bpm, "scale",
        {"key": start, "mode": "chromatic", "octaves": octaves}, f"scores/generated/{item_id}.mxl",
    )
    return sc, entry


#: Seventh-chord shapes as semitones above the root.
SEVENTH_SHAPES = {
    "dominant7": [0, 4, 7, 10],
    "diminished7": [0, 3, 6, 9],
    # The three shapes `02` Part E puts at stage 6. They are the seventh chords
    # a jazz or late-Romantic texture is actually built from, and the ear has to
    # know them as shapes before the hand can voice them.
    "major7": [0, 4, 7, 11],
    "minor7": [0, 3, 7, 10],
    "half-diminished7": [0, 3, 6, 10],
}

#: How each shape is spoken about, for titles and concept tags.
SEVENTH_LABELS = {
    "dominant7": "dominant 7th",
    "diminished7": "diminished 7th",
    "major7": "major 7th",
    "minor7": "minor 7th",
    "half-diminished7": "half-diminished 7th",
}


def make_seventh_arpeggio(
    root: str, quality: str = "dominant7", hands: str = "both", octaves: int = 2,
    bpm: int = 60,
) -> tuple[stream.Score, dict]:
    """
    A four-note seventh arpeggio, up and back, over two octaves.

    Two octaves rather than one because one lasts four and a half seconds,
    which is under the five-second floor docs/03 §3 sets for an item and, more
    to the point, is not long enough to practise anything: the stretch across
    the keyboard is the whole exercise.

    Fingered 1-2-3-5 in the right hand and 5-3-2-1 in the left, which is the
    standard shape for a four-note arpeggio and the reason these are taught
    after the triads: the hand has to stretch a seventh rather than a fifth.
    """
    one_of("hands", hands, HANDS)
    level = arpeggio_level(root, quality, hands, octaves)
    shape = SEVENTH_SHAPES[quality]
    label = SEVENTH_LABELS[quality]
    title = f"{note_name(root)} {label} arpeggio — {octaves} oct, {hands}"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key("C"))

    def run(start: pitch.Pitch) -> list[pitch.Pitch]:
        up = [start.transpose(12 * o + i) for o in range(octaves) for i in shape] + [
            start.transpose(12 * octaves)
        ]
        return up + list(reversed(up))[1:]

    rh_pitches, lh_pitches = run(pitch.Pitch(root + "4")), run(pitch.Pitch(root + "3"))
    fingered = not is_black_root(root)
    rh_fingers = lh_fingers = None
    if fingered:
        rh_fingers = SEVENTH_ARPEGGIO_FINGERING_RH * octaves + [5]
        rh_fingers = rh_fingers + list(reversed(rh_fingers))[1:]
        lh_fingers = SEVENTH_ARPEGGIO_FINGERING_LH * octaves + [1]
        lh_fingers = lh_fingers + list(reversed(lh_fingers))[1:]

    for part_, pitches, fingers in ((rh, rh_pitches, rh_fingers), (lh, lh_pitches, lh_fingers)):
        if (part_ is rh and hands == "left") or (part_ is lh and hands == "right"):
            part_.append(note.Rest(quarterLength=0.5 * len(pitches)))
            continue
        add_notes(part_, pitches, fingers, 0.5)
    finalize(sc)
    item_id = f"exercise.arpeggio7.{key_slug(root)}-{quality}.{octaves}oct.{hands}"
    entry = catalog_entry(
        item_id, title, level, ["arpeggio", "seventh-chord", f"{note_name(root)}-{label}", f"hands:{hands}"],
        hands, bpm, "arpeggio",
        {"key": root, "quality": quality, "octaves": octaves, "fingeringVerified": fingered},
        f"scores/generated/{item_id}.mxl",
    )
    return sc, entry


# --------------------------------------------------------------------------------------
# double notes, octaves and broken sevenths — `02` Part E stages 7 and 8
# --------------------------------------------------------------------------------------
#
# These are the families that put generated material at level 7, which had none:
# the ladder above stage 6 was asking for double-note work and octave technique
# and had nothing to offer but repertoire.


def add_chords(
    part: stream.PartStaff,
    groups: Iterable[Iterable[pitch.Pitch]],
    fingers: Iterable[Iterable[int]] | None,
    ql: float,
) -> None:
    """Appends a run of double stops, each with its own fingering."""
    finger_list = list(fingers) if fingers is not None else None
    for i, group in enumerate(groups):
        tones = list(group)
        if finger_list:
            part.append(fingered_chord(tones, finger_list[i % len(finger_list)], ql))
        else:
            part.append(chord.Chord(sorted(tones, key=lambda p: p.ps), quarterLength=ql))


def _diatonic_run(tonic: str, mode: str, start: pitch.Pitch, octaves: int) -> list[pitch.Pitch]:
    """One scale, up and back down, as pitches."""
    scale_obj = scale.MajorScale(tonic) if mode == "major" else scale.HarmonicMinorScale(tonic)
    up = scale_obj.getPitches(start, start.transpose(12 * octaves))
    return up + list(reversed(up))[1:]


#: Double-third and double-sixth fingering, both fingers, as the standard
#: three-group cycle: 1-3, 2-4, 3-5 repeating in the right hand and its mirror
#: in the left, retraced coming down.
#:
#: This comment used to say only the outer finger was printed, because that part
#: is genuinely hand-specific and a wrong printed fingering teaches a habit. The
#: data has always carried both, and printing only the upper one is not
#: expressible anyway: a lone `Fingering` on a two-note chord binds to the
#: *lower* note, so "upper only" would silently mark the wrong finger. Both is
#: also what a published edition does. `technique.7` used to repeat the claim
#: and now tells the learner the truth — the inner finger is a starting point to
#: change if their hand disagrees, not a rule.
DOUBLE_THIRD_RH = ([1, 3], [2, 4], [3, 5], [1, 3], [2, 4], [3, 5], [1, 3], [2, 4])
DOUBLE_THIRD_LH = ([5, 3], [4, 2], [3, 1], [5, 3], [4, 2], [3, 1], [5, 3], [4, 2])
DOUBLE_SIXTH_RH = ([1, 5], [1, 5], [2, 5], [1, 4], [1, 5], [1, 5], [2, 5], [1, 4])
DOUBLE_SIXTH_LH = ([5, 1], [5, 1], [5, 2], [4, 1], [5, 1], [5, 1], [5, 2], [4, 1])


def make_double_scale(
    tonic: str, interval_name: str = "third", hands: str = "right", octaves: int = 1, bpm: int = 54,
) -> tuple[stream.Score, dict]:
    """
    A scale in parallel thirds or sixths — `02` Part E stage 7.

    Both notes of each pair come from the scale, so the interval is diatonic
    (major and minor thirds alternate) rather than a fixed transposition: that
    is what makes it a scale in thirds and not a scale doubled.
    """
    one_of("hands", hands, HANDS)
    one_of("interval_name", interval_name, ("third", "sixth"))
    steps = 2 if interval_name == "third" else 5
    level = 7.1 if tonic in ("C", "G") else 7.3
    label = "3rds" if interval_name == "third" else "6ths"
    title = f"{note_name(tonic)} major scale in {label} — {octaves} oct, {hands}"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key(tonic))

    scale_obj = scale.MajorScale(tonic)

    def pairs(start: pitch.Pitch) -> list[list[pitch.Pitch]]:
        lower = scale_obj.getPitches(start, start.transpose(12 * octaves + 12))
        run = [[lower[i], lower[i + steps]] for i in range(len(lower) - steps)]
        # Up and back, without repeating the top pair.
        return run + list(reversed(run))[1:]

    rh_pairs = pairs(pitch.Pitch(tonic + "4"))
    lh_pairs = pairs(pitch.Pitch(tonic + "2"))
    rh_fingers = DOUBLE_THIRD_RH if interval_name == "third" else DOUBLE_SIXTH_RH
    lh_fingers = DOUBLE_THIRD_LH if interval_name == "third" else DOUBLE_SIXTH_LH

    def mirrored(table: tuple, pair_count: int) -> list[list[int]]:
        """
        The table cycling up, then the same fingers retraced coming down.

        `add_chords` cycles a short table across every pair, which kept counting
        through the turn: the top pair took (2,4) and the one below it (3,5), so
        the hand was told to move down the keyboard and up through its own
        fingers at the same time. Coming down a scale in thirds you play the way
        you went up, backwards.
        """
        up_to = (pair_count + 1) // 2
        ascending = [list(table[i % len(table)]) for i in range(up_to)]
        return (ascending + list(reversed(ascending))[1:])[:pair_count]

    if hands in ("both", "right"):
        add_chords(rh, rh_pairs, mirrored(rh_fingers, len(rh_pairs)), 0.5)
    else:
        silent(rh, 0.5 * len(rh_pairs))
    if hands in ("both", "left"):
        add_chords(lh, lh_pairs, mirrored(lh_fingers, len(lh_pairs)), 0.5)
    else:
        silent(lh, 0.5 * len(lh_pairs))
    finalize(sc)

    item_id = f"exercise.double-{interval_name}.{key_slug(tonic)}.{octaves}oct.{hands}"
    entry = catalog_entry(
        item_id, title, level,
        ["double-notes", f"scale-in-{label}", "finger-independence", f"hands:{hands}"],
        hands, bpm, f"double-{interval_name}",
        {"key": tonic, "interval": interval_name, "octaves": octaves,
         # The outer finger is standard; the inner one varies by hand size and
         # by key, so the catalog does not claim it is verified.
         "fingeringVerified": False},
        f"scores/generated/{item_id}.mxl",
    )
    return sc, entry


def make_octave_scale(
    tonic: str, hands: str = "right", octaves: int = 1, bpm: int = 60, broken: bool = False,
) -> tuple[stream.Score, dict]:
    """
    A scale in octaves, solid or broken — `02` Part E stage 7.

    Fingering is the one rule that matters and it is safe to print: thumb and
    fifth on the white keys, thumb and fourth on the black ones, in both hands.
    A hand that plays every octave 1–5 will not survive D flat.

    "In both hands" is the part this got wrong for as long as it existed. The
    left thumb plays the *upper* note of an octave and the fifth the lower; both
    branches here printed the thumb on the bottom, and the broken branch printed
    the thumb on both notes. It read as a right hand written twice.
    """
    one_of("hands", hands, HANDS)
    level = 7.2
    kind_label = "broken octaves" if broken else "octave scale"
    title = f"{note_name(tonic)} {kind_label} — {octaves} oct, {hands}"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key(tonic))

    def top_finger(p: pitch.Pitch) -> int:
        return 4 if p.pitchClass in BLACK_PITCH_CLASSES else 5

    def build(part_: stream.PartStaff, start: pitch.Pitch, is_right: bool) -> float:
        run = _diatonic_run(tonic, "major", start, octaves)
        # `up(p, 12)` and not `p.transpose(12)`: twelve semitones is a number,
        # and music21 respells it — a D flat octave came back as D flat under C
        # sharp, the two halves of one octave printed in different alphabets.
        # `up` asks for a perfect octave, which cannot respell. Only reachable
        # with `--full`, where the flat keys are, which is why nothing saw it.
        if broken:
            # Lower note then upper note, so the wrist rotates rather than the
            # arm lifting — which is the whole point of the broken form.
            for p in run:
                low, high = p, up(p, 12)
                # The thumb takes the note nearer the middle of the keyboard:
                # the low note in the right hand, the high note in the left.
                pairs = ((low, 1), (high, top_finger(high))) if is_right else                         ((low, top_finger(low)), (high, 1))
                for tone, finger in pairs:
                    n = note.Note(tone, quarterLength=0.25)
                    n.articulations.append(articulations.Fingering(finger))
                    part_.append(n)
            return 0.5 * len(run)
        for p in run:
            high = up(p, 12)
            # `fingered_chord` pairs these with the pitches low to high.
            fingers = [1, top_finger(high)] if is_right else [top_finger(p), 1]
            part_.append(fingered_chord([p, high], fingers, 0.5))
        return 0.5 * len(run)

    span = 0.0
    if hands in ("both", "right"):
        span = build(rh, pitch.Pitch(tonic + "4"), True)
    if hands in ("both", "left"):
        span = build(lh, pitch.Pitch(tonic + "2"), False)
    if hands == "left":
        silent(rh, span)
    if hands == "right":
        silent(lh, span)
    finalize(sc)

    slug_kind = "broken-octaves" if broken else "octave-scale"
    item_id = f"exercise.{slug_kind}.{key_slug(tonic)}.{octaves}oct.{hands}"
    entry = catalog_entry(
        item_id, title, level,
        ["octaves", "wrist", kind_label.replace(" ", "-"), f"hands:{hands}"],
        hands, bpm, slug_kind,
        {"key": tonic, "octaves": octaves, "broken": broken, "fingeringVerified": True},
        f"scores/generated/{item_id}.mxl",
    )
    return sc, entry


def make_broken_seventh(
    root: str, quality: str = "dominant7", hands: str = "both", bpm: int = 63,
) -> tuple[stream.Score, dict]:
    """
    A seventh chord as a broken figure rather than a straight arpeggio.

    The arpeggio walks the shape once; this turns it back on itself
    (1-3-5-7-5-3) so the hand crosses the same stretch repeatedly, which is the
    stage-7 work: "broken chords 7ths all keys".
    """
    one_of("hands", hands, HANDS)
    level = broken_seventh_level(root)
    shape = SEVENTH_SHAPES[quality]
    label = SEVENTH_LABELS[quality]
    title = f"{note_name(root)} broken {label} — {hands}"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key("C"))

    def figure(start: pitch.Pitch) -> list[pitch.Pitch]:
        tones = [start.transpose(i) for i in shape] + [start.transpose(12)]
        cell = tones + list(reversed(tones))[1:-1]
        # Two octaves of the same figure, twice.
        #
        # The comment here used to claim the two octaves were what cleared
        # docs/03 §3's five-second floor, and they were not: sixteen sixteenths
        # at 63 is 3.8 seconds, and every one of the thirty-six items in this
        # family was under it. Sixteenths are the point of the family, so the
        # figure repeats rather than slowing down. 7.6 seconds.
        two_octaves = cell + [up(p, 12) for p in cell]
        return two_octaves + two_octaves

    # The figure spans an octave and the hand stays over it, so the fingers run
    # straight out and straight back: 1-2-3-4-5 in the right hand and 5-4-3-2-1
    # in the left. What stood here put 5 on the seventh and 1 on the octave
    # above it — the thumb to the *right* of the little finger — and the mirror
    # of that in the left. `confirm_fingering` cannot see this one, because it
    # is a melodic line rather than a chord, and a melodic rule would have to
    # allow the thumb-under that every scale depends on.
    # Only from a white root: from a black one the thumb would take the
    # root, and the honest shape for those is not in any chart this file has.
    fingered = not is_black_root(root)
    rh_fingers = [1, 2, 3, 4, 5, 4, 3, 2] if fingered else None
    lh_fingers = [5, 4, 3, 2, 1, 2, 3, 4] if fingered else None
    if hands in ("both", "right"):
        add_notes(rh, figure(pitch.Pitch(root + "3")), rh_fingers, 0.25)
    else:
        silent(rh, 0.25 * len(figure(pitch.Pitch(root + "3"))))
    if hands in ("both", "left"):
        add_notes(lh, figure(pitch.Pitch(root + "2")), lh_fingers, 0.25)
    else:
        silent(lh, 0.25 * len(figure(pitch.Pitch(root + "2"))))
    finalize(sc)

    item_id = f"exercise.broken7.{key_slug(root)}-{quality}.{hands}"
    entry = catalog_entry(
        item_id, title, level,
        ["broken-chord", "seventh-chord", f"{note_name(root)}-{label}", f"hands:{hands}"],
        hands, bpm, "broken-seventh",
        {"key": root, "quality": quality, "fingeringVerified": False},
        f"scores/generated/{item_id}.mxl",
    )
    return sc, entry


#: Rhythm patterns as (label, [quarterLengths]) for one 4/4 bar.
RHYTHM_PATTERNS: list[tuple[str, list[float], float]] = [
    ("quarters", [1, 1, 1, 1], 1.1),
    ("half-and-quarters", [2, 1, 1], 1.2),
    ("eighths", [0.5] * 8, 1.3),
    ("quarter-eighths", [1, 0.5, 0.5, 1, 1], 1.4),
    ("dotted-quarter-eighth", [1.5, 0.5, 1, 1], 2.2),
    ("syncopated", [0.5, 1, 1, 1, 0.5], 3.2),
    ("sixteenths", [0.25] * 8 + [1, 1], 3.3),
    # Three notes in the time of two beats, then two plain beats.
    ("triplet-quarters", [2 / 3] * 3 + [1, 1], 4.2),
]


#: The meters `make_rhythm` did not have. Unit 1.4 teaches 3/4 and unit 4.5 teaches 6/8, and
#: neither had a rhythm exercise because `make_rhythm` hardcoded 4/4. The last two are the
#: swing feel: straight eighths on the page with the instruction above them, which is how a
#: real chart writes it — notating triplets would teach the wrong thing.
#:
#: (label, note lengths in quarters, level, time signature, printed direction)
RHYTHM_PATTERNS_EXTRA: list[tuple[str, list[float], float, str, str | None]] = [
    ("waltz-quarters", [1, 1, 1], 1.4, "3/4", None),
    ("waltz-dotted-half", [3], 1.4, "3/4", None),
    ("waltz-half-quarter", [2, 1], 1.4, "3/4", None),
    ("waltz-quarter-eighths", [1, 0.5, 0.5, 1], 2.2, "3/4", None),
    ("six-eight-eighths", [0.5] * 6, 4.5, "6/8", None),
    ("six-eight-dotted-quarters", [1.5, 1.5], 4.5, "6/8", None),
    ("six-eight-long-short", [1.0, 0.5, 1.0, 0.5], 4.5, "6/8", None),
    ("six-eight-mixed", [1.5, 0.5, 0.5, 0.5], 4.5, "6/8", None),
    ("shuffle-eighths", [0.5] * 8, 4.5, "4/4", "Shuffle — play the eighths long-short"),
    ("shuffle-quarter-eighths", [1, 0.5, 0.5, 1, 1], 4.5, "4/4",
     "Shuffle — play the eighths long-short"),
]


def rhythm_spec(pattern: str) -> tuple[str, list[float], float, str, str | None]:
    """Looks a pattern up in either table. 4/4 patterns keep their original ids."""
    for label, lengths, level in RHYTHM_PATTERNS:
        if label == pattern:
            return label, lengths, level, "4/4", None
    return next(spec for spec in RHYTHM_PATTERNS_EXTRA if spec[0] == pattern)


def make_rhythm(pattern: str, bars: int = 4, bpm: int = 80) -> tuple[stream.Score, dict]:
    """
    A rhythm drill on a one-line staff.

    One line, one pitch: the point is the timing, and a five-line staff invites
    the learner to read pitches that are not there. MusicXML expresses it as a
    percussion-style staff with a single line, which OSMD renders as such.
    """
    label, lengths, level, time_sig, direction = rhythm_spec(pattern)
    title = f"Rhythm: {label.replace('-', ' ')} — {bars} bars"
    sc = stream.Score()
    sc.metadata = metadata.Metadata()
    sc.metadata.title = title
    sc.metadata.composer = "PianoPath (generated)"

    part = stream.PartStaff(id="Rhythm")
    part.insert(0, instrument.Piano())
    part.insert(0, clef.PercussionClef())
    part.insert(0, meter.TimeSignature(time_sig))
    part.insert(0, tempo.MetronomeMark(number=bpm))
    layout_staff = layout.StaffLayout(staffLines=1)
    part.insert(0, layout_staff)
    if direction is not None:
        from music21 import expressions

        part.insert(0, expressions.TextExpression(direction))
    for _ in range(bars):
        for length in lengths:
            part.append(note.Note("B4", quarterLength=length))
    part.makeMeasures(inPlace=True)
    sc.insert(0, part)

    item_id = f"exercise.rhythm.{slug(label)}.{bars}bar"
    concepts = ["rhythm", label, "counting", f"meter:{time_sig}"]
    if direction:
        concepts.append("swing")
    entry = catalog_entry(
        item_id, title, level, concepts, "right", bpm, "rhythm",
        {"pattern": label, "bars": bars, "timeSig": time_sig,
         **({"feel": "shuffle"} if direction else {})},
        f"scores/generated/{item_id}.mxl",
        tracks=["technique", "core", "theory-ear"],
    )
    return sc, entry


# --------------------------------------------------------------------------------------
# P5b families (docs/02 Part E2)
#
# The families above are a technique syllabus: scales, arpeggios, inversions, Hanon. The
# ones below are the skills the *lessons* are made of, which had no generated material at
# all — unit 3.6 is about accompaniment patterns and had none, 2.1 is about hands-together
# coordination and had none, and rhythm existed only in 4/4 while 1.4 needs 3/4 and 4.5
# needs 6/8.
# --------------------------------------------------------------------------------------


def scale_pitches(k: key.Key, octave: int, degrees: Iterable[int]) -> list[pitch.Pitch]:
    """
    Degrees of a key as pitches, spelled by the key rather than by semitone count.

    Degree 1 is the tonic in `octave`; degrees above 7 continue into the next octave and
    degree 0 is the leading tone below the tonic. Spelling matters: transposing by a
    semitone count lets music21 respell, and the seventh of B flat 7 comes back as G sharp.
    """
    sc_obj = scale.MajorScale(k.tonic) if k.mode == "major" else scale.MinorScale(k.tonic)
    tonic = pitch.Pitch(f"{k.tonic.name}{octave}")
    out: list[pitch.Pitch] = []
    for degree in degrees:
        steps = degree - 1
        if steps == 0:
            out.append(pitch.Pitch(tonic.nameWithOctave))
            continue
        direction = Direction.ASCENDING if steps > 0 else Direction.DESCENDING
        out.append(sc_obj.nextPitch(tonic, direction=direction, stepSize=abs(steps)))
    return out


def silent(part: stream.PartStaff, quarters: float) -> None:
    """Fills a staff with rest so a hands-separate item still prints a grand staff."""
    part.append(note.Rest(quarterLength=quarters))


#: Unit 2.1 is "the left hand holds, the right hand moves", and it is the first genuinely
#: hard thing in the course. Two variants: a left hand that never moves, and one that
#: changes chord every bar, which is the step that actually breaks people.
COORDINATION_VARIANTS = ("hold", "change")


def make_coordination(root: str, variant: str = "hold", bpm: int = 60, level: float = 2.1):
    """RH five-finger walk over a LH that holds (or changes I/V every bar)."""
    k = key.Key(root)
    title = f"Hands together in {note_name(root)} — left hand {'holds' if variant == 'hold' else 'changes'}"
    sc, rh, lh = grand_staff(title, bpm, ks=k)

    walk = [1, 2, 3, 4, 5, 4, 3, 2]          # C D E F G F E D, then a whole-note tonic
    rh_fingers = [1, 2, 3, 4, 5, 4, 3, 2]
    pitches = scale_pitches(k, 4, walk)
    add_notes(rh, pitches, rh_fingers, 1.0)
    add_notes(rh, scale_pitches(k, 4, [1]), [1], 4.0)

    # Left hand: whole notes only. Tonic every bar, or tonic/dominant alternating.
    lh_degrees = [1, 1, 1] if variant == "hold" else [1, 5, 1]
    lh_fingers = [5] if variant == "hold" else [5, 1, 5]
    for degree, finger in zip(lh_degrees, lh_fingers * 3):
        n = note.Note(scale_pitches(k, 3, [degree])[0], quarterLength=4.0)
        n.articulations.append(articulations.Fingering(finger))
        lh.append(n)

    finalize(sc)
    item_id = f"exercise.coordination.{key_slug(root)}.{variant}"
    entry = catalog_entry(
        item_id, title, level,
        ["hands-together", "held-LH", "vertical-alignment", f"{note_name(root)}-major"], "both", bpm,
        "coordination", {"key": root, "variant": variant, "leftHand": variant},
        f"scores/generated/{item_id}.mxl",
    )
    return sc, entry


#: Bar rhythms for the interval-reading melodies. Quarters and halves only: unit 1.5 is
#: about reading the *distance* between notes, and an unfamiliar rhythm on top of that is
#: two new things at once.
INTERVAL_BAR_RHYTHMS = ([1, 1, 1, 1], [2, 1, 1], [1, 1, 2], [2, 2])


def make_interval_reading(seed: int, hands: str = "right", bpm: int = 66, level: float = 1.5):
    """
    A four-bar melody in one five-finger position, using only 2nds and 3rds.

    Deterministic from `seed` so a lesson can name a specific one and the review queue can
    bring the same one back — which is the difference between this and the runtime
    sight-reading generator (`05` §8), whose whole point is never repeating.
    """
    one_of("hands", hands, HANDS)
    import random

    rng = random.Random(seed)
    k = key.Key("C")
    title = f"Steps and skips in C position — no. {seed}"
    sc, rh, lh = grand_staff(title, bpm, ks=k)

    degree = 1                                    # index into the five-finger position 1..5
    events: list[tuple[int, float]] = []
    for _ in range(4):
        for length in rng.choice(INTERVAL_BAR_RHYTHMS):
            move = rng.choice([-2, -1, 1, 2])      # a 3rd or a 2nd, either direction
            candidate = degree + move
            if not 1 <= candidate <= 5:
                candidate = degree - move          # bounce off the edge of the position
            degree = max(1, min(5, candidate))
            events.append((degree, float(length)))
    # End on the tonic — but by walking to it, not by teleporting. Overwriting the last
    # degree on its own left a leap of a fifth in some seeds, in an exercise whose entire
    # premise is that nothing is wider than a third.
    if len(events) >= 2:
        third_last = events[-3][0] if len(events) >= 3 else 2
        approach = min((2, 3), key=lambda candidate: abs(candidate - third_last))
        events[-2] = (approach, events[-2][1])
    events[-1] = (1, events[-1][1])

    target, other = (rh, lh) if hands == "right" else (lh, rh)
    octave = 4 if hands == "right" else 3
    for index, (deg, length) in enumerate(events):
        n = note.Note(scale_pitches(k, octave, [deg])[0], quarterLength=length)
        # Fingering on the first note only: the hand never moves, so a number over every
        # note would teach the learner to read numbers instead of intervals.
        if index == 0:
            n.articulations.append(articulations.Fingering(deg if hands == "right" else 6 - deg))
        target.append(n)
    silent(other, sum(length for _, length in events))

    finalize(sc)
    item_id = f"exercise.interval-reading.c-position.{hands}.{seed:02d}"
    entry = catalog_entry(
        item_id, title, level, ["steps", "skips", "interval-reading", "C-position"], hands, bpm,
        "interval-reading", {"key": "C", "seed": seed, "maxInterval": 3},
        f"scores/generated/{item_id}.mxl", tracks=["core", "technique", "theory-ear"],
    )
    return sc, entry


def make_position_shift(root: str, hands: str = "right", bpm: int = 66, level: float = 2.5):
    """
    Four bars with one hand shift in the middle, marked by the fingering.

    Bars 1-2 sit with the thumb on the tonic; bars 3-4 move the hand up a fifth. The only
    fingering printed is on the two notes that start a position, because that is what a
    fingering number is *for* and printing them all hides the one that matters.
    """
    one_of("hands", hands, HANDS)
    k = key.Key(root)
    title = f"Position shift in {note_name(root)} — {hands}"
    sc, rh, lh = grand_staff(title, bpm, ks=k)

    lower = [1, 2, 3, 4, 5, 4, 3, 2]      # tonic position
    upper = [5, 6, 7, 8, 9, 8, 7, 5]      # the same shape from the dominant
    target, other = (rh, lh) if hands == "right" else (lh, rh)
    octave = 4 if hands == "right" else 3

    for index, degree in enumerate(lower + upper):
        n = note.Note(scale_pitches(k, octave, [degree])[0], quarterLength=1.0)
        if index in (0, len(lower)):
            n.articulations.append(articulations.Fingering(1 if hands == "right" else 5))
        target.append(n)
    silent(other, float(len(lower) + len(upper)))

    finalize(sc)
    item_id = f"exercise.position-shift.{key_slug(root)}.{hands}"
    entry = catalog_entry(
        item_id, title, level, ["position-shift", "hand-position", f"{note_name(root)}-major"], hands, bpm,
        "position-shift", {"key": root, "shift": "fifth"}, f"scores/generated/{item_id}.mxl",
    )
    return sc, entry


#: The two ways a beginner is taught I-IV-V7-I. Root position names the chords; the
#: voice-led version is the one that is actually playable at speed, because only one or two
#: fingers move between chords. Both are generated so a lesson can put them side by side.
#:
#: Degrees are counted in the key, not in semitones, so the notes are spelled correctly in
#: every key — `scale_pitches` explains why that matters.
CADENCE_VOICINGS: dict[str, list[tuple[list[int], list[int]]]] = {
    # (degrees, fingering) per chord, low to high
    "root": [
        ([1, 3, 5], [5, 3, 1]),          # I
        ([4, 6, 8], [5, 3, 1]),          # IV
        ([5, 7, 9, 11], [5, 4, 2, 1]),   # V7
        ([1, 3, 5], [5, 3, 1]),          # I
    ],
    "voice-led": [
        ([1, 3, 5], [5, 3, 1]),          # I
        ([1, 4, 6], [5, 2, 1]),          # IV, second inversion — the tonic stays put
        ([0, 4, 5], [5, 2, 1]),          # V7 without its fifth: leading tone, 4th, 5th
        ([1, 3, 5], [5, 3, 1]),          # I
    ],
    # IV-I, the amen. Three chords rather than four, because that is the whole
    # cadence: the tonic to say where we are, the subdominant, and home. The
    # `hymns` rung names the plagal cadence as one of the things it teaches, and
    # `concepts.json` has carried the id since it was written; nothing in the
    # app ever played one, so the rung described a sound it could not make.
    "plagal": [
        ([1, 3, 5], [5, 3, 1]),          # I
        ([4, 6, 8], [5, 3, 1]),          # IV
        ([1, 3, 5], [5, 3, 1]),          # I
    ],
}

#: What each voicing's chords are, spoken. The progression is no longer the
#: same for all of them, so it cannot stay inside the title's format string.
CADENCE_PROGRESSIONS: dict[str, list[str]] = {
    "root": ["I", "IV", "V7", "I"],
    "voice-led": ["I", "IV", "V7", "I"],
    "plagal": ["I", "IV", "I"],
}
CADENCE_LABELS: dict[str, str] = {
    "root": "root position",
    "voice-led": "smooth voicing",
    "plagal": "the amen cadence",
}
#: The concepts each voicing carries. The plagal is a different *sound* rather
#: than a different fingering of the same one, so it is tagged as itself —
#: a learner searching the Library for "plagal" was finding nothing at all.
CADENCE_CONCEPTS: dict[str, list[str]] = {
    "root": ["I-IV-V7", "cadence", "voice-leading"],
    "voice-led": ["I-IV-V7", "cadence", "voice-leading"],
    "plagal": ["plagal-cadence", "cadences", "cadence", "IV-I"],
}


def make_cadence(root: str, voicing: str = "root", bpm: int = 60, level: float = 3.2):
    """The cadence as whole-note left-hand chords, in one of three voicings.

    Two of them are I-IV-V7-I: root position, which names the chords, and the
    voice-led form, which is the one that is actually playable at speed. The
    third is the plagal IV-I, a different cadence rather than a different way
    of playing the same one.

    All three sit at the same level. The hand shapes are the ones unit 3.2 asks
    for either way, and what is being learnt here is the sound.
    """
    one_of("voicing", voicing, tuple(CADENCE_VOICINGS))
    k = key.Key(root)
    chords = CADENCE_VOICINGS[voicing]
    label = CADENCE_LABELS[voicing]
    title = f"{'-'.join(CADENCE_PROGRESSIONS[voicing])} in {note_name(root)} — {label}"
    sc, rh, lh = grand_staff(title, bpm, ks=k)

    for degrees, fingers in chords:
        lh.append(fingered_chord(scale_pitches(k, 3, degrees), fingers, 4.0))
    silent(rh, 4.0 * len(chords))

    finalize(sc)
    item_id = f"exercise.cadence.{key_slug(root)}.{voicing}"
    entry = catalog_entry(
        item_id, title, level, [*CADENCE_CONCEPTS[voicing], f"{note_name(root)}-major"], "left", bpm,
        "cadence",
        {"key": root, "voicing": voicing, "progression": CADENCE_PROGRESSIONS[voicing]},
        f"scores/generated/{item_id}.mxl", tracks=["technique", "core", "chords-pop"],
    )
    return sc, entry


#: Unit 3.6's three accompaniment patterns, as offsets into the chord being played:
#: index 0 is the lowest note of the triad, 2 the highest. Written as indices rather than
#: intervals so the same table works for a minor chord.
ACCOMPANIMENT_PATTERNS: dict[str, tuple[str, list[tuple[int, float]], str]] = {
    "broken":  ("Broken chord", [(0, 1.0), (1, 1.0), (2, 1.0), (1, 1.0)], "4/4"),
    "alberti": ("Alberti bass",
                [(0, 0.5), (2, 0.5), (1, 0.5), (2, 0.5)] * 2, "4/4"),
    "waltz":   ("Waltz bass", [(0, 1.0), (-1, 1.0), (-1, 1.0)], "3/4"),
}

#: I-IV-V-I, the sequence every one of the patterns is practised over.
ACCOMPANIMENT_CHORDS = ([1, 3, 5], [4, 6, 8], [5, 7, 9], [1, 3, 5])


def make_accompaniment(root: str, mode: str, pattern: str, hands: str = "left",
                       bpm: int = 72, level: float = 3.6):
    """
    A left-hand accompaniment pattern over I-IV-V-I, alone or under a right-hand scale.

    `-1` in the pattern table means "the rest of the chord together", which is the second
    and third beats of a waltz bass.
    """
    one_of("hands", hands, HANDS)
    k = key.Key(root if mode == "major" else root.lower())
    label, steps, time_sig = ACCOMPANIMENT_PATTERNS[pattern]
    hands_label = "left hand" if hands == "left" else "hands together"
    title = f"{label} in {note_name(root)} {mode} — {hands_label}"
    sc, rh, lh = grand_staff(title, bpm, ts=time_sig, ks=k)
    beats_per_bar = 4.0 if time_sig == "4/4" else 3.0

    for degrees in ACCOMPANIMENT_CHORDS:
        tones = scale_pitches(k, 3, degrees)
        for index, length in steps:
            if index == -1:
                lh.append(chord.Chord([pitch.Pitch(t.nameWithOctave) for t in tones[1:]],
                                      quarterLength=length))
                continue
            n = note.Note(pitch.Pitch(tones[index].nameWithOctave), quarterLength=length)
            if index == 0:
                # Only the bass note is fingered: the pattern's shape is the lesson, and
                # the little finger is the one that has to find the new root.
                n.articulations.append(articulations.Fingering(5))
            lh.append(n)

    if hands == "both":
        # A scale over the top, because independence is the skill this trains — the
        # pattern alone is a left-hand exercise, and the two together are a piano one.
        degrees = [1, 2, 3, 4, 5, 6, 7, 8]
        length = beats_per_bar * 4 / len(degrees) / 2
        for repeat in range(2):
            order = degrees if repeat == 0 else list(reversed(degrees))
            add_notes(rh, scale_pitches(k, 4, order), None, length)
    else:
        silent(rh, beats_per_bar * len(ACCOMPANIMENT_CHORDS))

    finalize(sc)
    item_id = f"exercise.accompaniment.{pattern}.{key_slug(root)}-{mode}.{hands}"
    entry = catalog_entry(
        item_id, title, level,
        [pattern, "accompaniment-pattern", "broken-chords", f"{note_name(root)}-{mode}"], hands, bpm,
        "accompaniment",
        {"key": root, "quality": mode, "pattern": pattern, "timeSig": time_sig,
         "progression": ["I", "IV", "V", "I"]},
        f"scores/generated/{item_id}.mxl", tracks=["technique", "core", "chords-pop"],
    )
    return sc, entry


#: The oom-pah's two reaches, and the level each earns.
#:
#: The *span* is the whole difficulty of the style — how far the hand travels
#: between the bass note and the chord above it. At the octave it jumps an
#: octave and lands on a shape it can see; at the tenth it jumps a third further
#: onto the chord's first inversion, and that extra third is what separates a
#: cakewalk from a rag. Same notes, same count, same hand: only the distance
#: changes, which is why they are one maker and two rows rather than two makers.
OOMPAH_SPANS: dict[str, float] = {"octave": 4.2, "tenth": 5.6}

#: I-IV-V-I, four beats a chord: the bass falls on 1 and 3 and the chord on 2
#: and 4, which is how the pattern is counted and taught. In 2/4 — how a rag is
#: printed — those four beats are two bars.
OOMPAH_CHORDS = ((0, "maj"), (5, "maj"), (7, "maj"), (0, "maj"))


def oompah_chord(
    root_name: str, quality: str, span: str,
) -> tuple[pitch.Pitch, list[pitch.Pitch]]:
    """The bass note an oom-pah is built from, and the chord that answers it.

    Built by asking `up` for an interval no wider than an octave and then
    shifting by whole octaves: a semitone count past a thirteenth is not in
    `SEMITONE_INTERVAL`, and a count of twelve respells a flat.
    """
    one_of("span", span, tuple(OOMPAH_SPANS))
    bass = pitch.Pitch(root_name + "2")
    shape = chord_shape(quality)
    # The chord an octave above the bass, or — at the tenth — its first
    # inversion, whose lowest note is the third an octave up.
    rungs = (0, shape[1], shape[2]) if span == "octave" else (shape[1], shape[2], 12)
    return bass, [by_octaves(up(bass, i), 1) for i in rungs]


def write_oompah_bar(
    part: stream.PartStaff, root_name: str, quality: str, span: str, beat: float = 1.0,
) -> None:
    """
    Bass, chord, bass, chord — one chord's worth of the ragtime left hand.

    Four beats of it, which is one bar of 4/4 or two bars of 2/4; either way the
    count is oom-pah-oom-pah.

    **The two "ooms" are the root and its fifth, not the root twice.** A bass
    that sits on one note while the chord bounces above it is exactly what a
    learner plays instead of an oom-pah, and it is the fault this family exists
    to drill out — so the exercise cannot be written that way itself. The first
    draft was, in every key.

    Extracted because two makers write this figure now: `make_oompah`, which is
    about the leap, and `make_secondary_rag`, which needs a beat marked
    underneath a right hand that is deliberately off it. One copy, for the
    reason `write_tumbao` has one.
    """
    bass, tones = oompah_chord(root_name, quality, span)
    for semitones in (0, 7):
        add_notes(part, [up(bass, semitones)], [5], beat)
        part.append(fingered_chord(tones, [5, 3, 1], beat))


def make_oompah(tonic: str = "C", span: str = "octave", bpm: int = 88):
    """
    Bass on 1 and 3, chord on 2 and 4 — the ragtime left hand.

    `02` Part D5's ragtime rungs name the oom-pah bass on every one of them and
    `concepts.json` has carried `oom-pah-bass` since it was written; the rung's
    four "exercises" were borrowed accompaniment and syncopation rows and not
    one of them played this. It is the single technical problem of the style.

    Written in 2/4 with two bars to a chord, which is how it is printed and how
    it is counted: the bass takes the downbeat of each bar and the chord the
    upbeat, so over a pair of bars the count is bass-chord-bass-chord.

    The right hand rests. A rag's right hand is the syncopated melody, which is
    a different exercise and a harder one; the point here is that the left hand
    can leap without looking, and putting something over it hides whether it can.

    **Reachable through `oom-pah-bass`**, the concept `ragtime.5`, `.6` and `.7`
    already teach, until one of those rungs names this item in its
    `exerciseOptions`. That is the only route to it: `alternativesFor` offers an
    exercise on a rung only when it shares a concept with something already
    there *and* sits within half a level of it.
    """
    one_of("span", span, tuple(OOMPAH_SPANS))
    level = OOMPAH_SPANS[span]
    title = f"Oom-pah bass in {note_name(tonic)} — the chord at the {span}"
    sc, rh, lh = grand_staff(title, bpm, ts="2/4", ks=key.Key(tonic))
    # The rest first, then the symbols. `add_symbol` inserts at an absolute
    # offset and carries the part's end there with it, so a rest appended after
    # the last symbol would start in bar seven and the staves would not line up.
    silent(rh, 4.0 * len(OOMPAH_CHORDS))

    offset = 0.0
    for degree, quality in OOMPAH_CHORDS:
        root_name = _transpose_name(tonic, degree)
        add_symbol(rh, _figure(root_name, quality), offset)
        write_oompah_bar(lh, root_name, quality, span)
        offset += 4.0
    finalize(sc)

    item_id = f"exercise.oompah.{key_slug(tonic)}.{span}"
    entry = catalog_entry(
        item_id, title, level,
        ["oom-pah-bass", "accompaniment-pattern", "left-hand", "leaps",
         "ragtime-texture", f"{note_name(tonic)}-major"],
        "left", bpm, "accompaniment",
        {"key": tonic, "pattern": "oom-pah", "span": span, "timeSig": "2/4",
         "progression": ["I", "IV", "V", "I"]},
        f"scores/generated/{item_id}.mxl", tracks=["ragtime", "technique", "chords-pop"],
    )
    return sc, entry


def make_pedal(root: str, bpm: int = 54, level: float = 3.5):
    """
    A chord sequence with pedal marks, for the CC64 change-timing drill.

    The chords are the smooth I-IV-V7-I; the pedal spans each chord and lifts on the next,
    which is the change the `pedal` drill in `05` §7 scores between 0 and 120 ms after the
    new chord's first Note-On.
    """
    from music21 import expressions

    k = key.Key(root)
    title = f"Pedal changes on I-IV-V7-I in {note_name(root)}"
    sc, rh, lh = grand_staff(title, bpm, ks=k)

    chords = []
    for degrees, fingers in CADENCE_VOICINGS["voice-led"]:
        c = fingered_chord(scale_pitches(k, 3, degrees), fingers, 4.0)
        lh.append(c)
        chords.append(c)
    # A held melody note over each chord, so there is something to listen to the pedal
    # blurring — a pedal exercise on bare chords teaches nothing about when it goes wrong.
    for degrees in ([5], [6], [5], [5]):
        add_notes(rh, scale_pitches(k, 4, degrees), None, 4.0)

    for c in chords:
        mark = expressions.PedalMark()
        mark.addSpannedElements([c])
        lh.insert(0, mark)

    finalize(sc)
    item_id = f"exercise.pedal.{key_slug(root)}"
    entry = catalog_entry(
        item_id, title, level, ["sustain-pedal", "legato-pedalling", "CC64"], "both", bpm,
        "pedal", {"key": root, "progression": ["I", "IV", "V7", "I"], "maxOverlapMs": 120},
        f"scores/generated/{item_id}.mxl",
    )
    return sc, entry


# --------------------------------------------------------------------------------------
# Hanon-style cells (`02` Part E amendment: the skills of 21-60, not the text)
# --------------------------------------------------------------------------------------
#
# No reachable public-domain edition of Hanon 21-60 exists, and encoding sixty
# exercises from memory is what P4 refused to do for 1-20. What those numbers
# train has names, so the names are what is generated: "Repeated notes
# 4-to-a-note in C", not "Hanon 44".


def _walk(tonic: str, bars: int, per_bar: int) -> list[pitch.Pitch]:
    """
    A stepwise scale walk long enough to fill `bars`.

    Up and back down, and the "back down" is the whole point. This used to
    repeat the ascending run — so the moment more than fifteen notes were asked
    for, the line hit the top C and fell two octaves to start again. That is not
    a stepwise walk, and it reached the page: the staccato phrase ended
    "A5 B5 C6 C4", the 5/4 meter drill ended one bar the same way, and so did
    both syncopation studies. Every one of them is four bars long and the leap
    was always in the last of them.

    Turning round instead makes the cycle twenty-eight notes and every step a
    step, however many are asked for.
    """
    scale_obj = scale.MajorScale(tonic)
    start = pitch.Pitch(tonic + "4")
    run = list(scale_obj.getPitches(start, start.transpose(24)))
    # Neither endpoint repeated, so the cycle joins to itself by a step too.
    cycle = run + list(reversed(run))[1:-1]
    needed = bars * per_bar
    out: list[pitch.Pitch] = []
    while len(out) < needed:
        out.extend(cycle)
    return out[:needed]


def make_repeated_notes(
    tonic: str = "C", per_note: int = 3, hands: str = "right", bpm: int = 60,
) -> tuple[stream.Score, dict]:
    """
    The same note struck three or four times, changing finger each time.

    Hanon 21-30 territory and the reason a repeated note sounds even at speed:
    the hand does not lift, the fingers take turns. 3-2-1 for three notes and
    4-3-2-1 for four, which is the standard descending order.
    """
    one_of("hands", hands, HANDS)
    fingers = [3, 2, 1] if per_note == 3 else [4, 3, 2, 1]
    level = 5.3 if per_note == 3 else 6.3
    title = f"Repeated notes {per_note}-to-a-note in {note_name(tonic)} — {hands}"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key(tonic))
    steps = _walk(tonic, bars=4, per_bar=2)
    ql = 1.0 / per_note

    def build(part_: stream.PartStaff, transpose: int) -> float:
        for p in steps:
            for finger in fingers:
                n = note.Note(by_octaves(p, transpose // 12), quarterLength=ql)
                n.articulations.append(articulations.Fingering(finger))
                part_.append(n)
        return len(steps) * per_note * ql

    span = 0.0
    if hands in ("both", "right"):
        span = build(rh, 0)
    if hands in ("both", "left"):
        span = build(lh, -24)
    if hands == "left":
        silent(rh, span)
    if hands == "right":
        silent(lh, span)
    finalize(sc)

    item_id = f"exercise.repeated-notes.{key_slug(tonic)}.{per_note}x.{hands}"
    entry = catalog_entry(
        item_id, title, level,
        ["repeated-notes", "finger-independence", "evenness", f"hands:{hands}"],
        hands, bpm, "repeated-notes",
        {"key": tonic, "perNote": per_note, "fingering": fingers, "fingeringVerified": True},
        f"scores/generated/{item_id}.mxl",
    )
    return sc, entry


def make_trill(
    tonic: str = "C", notes_per_beat: int = 4, hands: str = "right", bpm: int = 60,
    ornament: str = "trill",
) -> tuple[stream.Score, dict]:
    """
    A *measured* trill or a mordent, with the count written on the score.

    An unmeasured trill cannot be scored and cannot be practised evenly — "as
    fast as you can" is not a target. Writing the number of notes per beat is
    what turns it into an exercise, so the direction says so in words and the
    notation matches it exactly.
    """
    one_of("hands", hands, HANDS)
    from music21 import expressions

    level = 6.3 if ornament == "trill" else 5.3
    label = "Measured trill" if ornament == "trill" else "Mordents"
    title = f"{label} in {note_name(tonic)} — {notes_per_beat} per beat, {hands}"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key(tonic))
    scale_obj = scale.MajorScale(tonic)
    starts = scale_obj.getPitches(pitch.Pitch(tonic + "4"), pitch.Pitch(tonic + "5"))[:4]
    ql = 1.0 / notes_per_beat

    direction = expressions.TextExpression(
        f"{notes_per_beat} notes to the beat — count them, do not hurry"
    )
    rh.insert(0, direction)

    # The scale degrees around each main note, taken from a plain list rather
    # than `Scale.next`: music21 10 shadows that with `Music21Object.next`, and
    # a neighbour is an index into the scale anyway.
    ladder = scale_obj.getPitches(pitch.Pitch(tonic + "3"), pitch.Pitch(tonic + "6"))

    def neighbour(p: pitch.Pitch, step: int) -> pitch.Pitch:
        for i, candidate in enumerate(ladder):
            if candidate.nameWithOctave == p.nameWithOctave:
                return ladder[min(max(i + step, 0), len(ladder) - 1)]
        return p

    def build(part_: stream.PartStaff, transpose: int) -> float:
        # The finger that lands on the first printed note. The two hands number
        # a pair of adjacent keys from opposite ends — the right hand counts up
        # away from the thumb, the left hand counts down towards it — so one
        # number for both was only ever right while the first note was the
        # lower of the pair. It no longer is, for a trill.
        first = 3 if (ornament == "trill" and part_.id == "RH") else 2
        total = 0.0
        for main in starts:
            upper = neighbour(main, 1)
            lower = neighbour(main, -1)
            if ornament == "trill":
                # Upper note first, main note last, and both halves are
                # corrections. A Classical trill begins on the note above —
                # which is what `classical.5` tells the learner, while the only
                # trill in the app began on the main note and made that lesson
                # false about its own material. And a trill resolves onto its
                # main note; written main-first with an even count it ended
                # hanging on the neighbour, which no trill does.
                cell = [upper, main] * notes_per_beat
            else:
                # A mordent is main-lower-main, then the beat is held. This is
                # the stroked sign, the one `classical.3` describes as taking
                # the note below.
                cell = [main, lower, main]
            for i, p in enumerate(cell):
                n = note.Note(by_octaves(p, transpose // 12), quarterLength=ql)
                if i == 0:
                    n.articulations.append(articulations.Fingering(first))
                part_.append(n)
            total += len(cell) * ql
            rest = note.Rest(quarterLength=max(0.0, 2.0 - len(cell) * ql))
            if rest.quarterLength > 0:
                part_.append(rest)
                total += float(rest.quarterLength)
        return total

    span = 0.0
    if hands in ("both", "right"):
        span = build(rh, 0)
    if hands in ("both", "left"):
        span = build(lh, -24)
    if hands == "left":
        silent(rh, span)
    if hands == "right":
        silent(lh, span)
    finalize(sc)

    item_id = f"exercise.{ornament}.{key_slug(tonic)}.{notes_per_beat}pb.{hands}"
    entry = catalog_entry(
        item_id, title, level,
        [ornament, "ornamentation", "evenness", f"hands:{hands}"],
        hands, bpm, "trill",
        {"key": tonic, "ornament": ornament, "notesPerBeat": notes_per_beat,
         "direction": f"{notes_per_beat} notes to the beat"},
        f"scores/generated/{item_id}.mxl",
    )
    return sc, entry


#: The two tremolos, as (semitones apart, lower finger, upper finger, level).
#:
#: A third and an octave are the same wrist motion at two sizes, and the size is
#: the whole difficulty: the hand that plays a third tremolo is closed and can
#: do it in a week, and the one that plays an octave is open and cannot. So they
#: are one maker and two rows rather than two makers.
#:
#: The third is here because `blues.5` names "tremolo-thirds" as one of the
#: three things it teaches and nothing in the app played one — the only tremolo
#: was the octave, which is level 7.2 and sits two stages above that rung. The
#: shimmering right hand over a blues is a third, not an octave.
TREMOLOS: dict[str, tuple[int, int, int, float]] = {
    #          semitones  lower  upper  level
    "third":  (4, 1, 3, 5.0),
    "octave": (12, 1, 5, 7.2),
}


def make_tremolo_octaves(
    tonic: str = "C", hands: str = "right", bpm: int = 60, shape: str = "octave",
) -> tuple[stream.Score, dict]:
    """
    A tremolo: two notes alternating in sixteenths, an octave or a third apart.

    Hanon 51-60 territory. The exercise is the forearm, not the fingers, so the
    fingering is the interval's own — 1 and 5 for an octave, 1 and 4 when the
    upper note is black, 1 and 3 for a third — and nothing else is marked.
    """
    one_of("hands", hands, HANDS)
    one_of("shape", shape, tuple(TREMOLOS))
    semitones, lower_finger, upper_finger, level = TREMOLOS[shape]
    label = "Octave tremolo" if shape == "octave" else "Tremolo in 3rds"
    title = f"{label} in {note_name(tonic)} — {hands}"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key(tonic))
    scale_obj = scale.MajorScale(tonic)
    roots = scale_obj.getPitches(pitch.Pitch(tonic + "4"), pitch.Pitch(tonic + "5"))[:4]

    def build(part_: stream.PartStaff, transpose: int, is_right: bool) -> float:
        total = 0.0
        for root in roots:
            # Octaves, not a semitone count: the left hand's -24 respelled a
            # D flat tremolo as C sharp, under a five-flat key signature.
            low = by_octaves(root, transpose // 12)
            # A named interval, not a semitone count: the second spelling of a
            # D flat octave came back as C sharp.
            high = up(low, semitones)
            # The stretch finger drops to 4 on a black key, which only applies
            # to the octave — a third is taken 1-3 whatever colour it lands on.
            outer = (4 if (shape == "octave" and high.pitchClass in BLACK_PITCH_CLASSES)
                     else upper_finger)
            for i in range(8):
                is_low = i % 2 == 0
                tone = low if is_low else high
                # The thumb takes the note nearer the middle of the keyboard:
                # the low note of the octave in the right hand, the high note in
                # the left. Both hands were fingered as a right hand.
                finger = ((lower_finger if is_low else outer) if is_right
                          else (outer if is_low else lower_finger))
                n = note.Note(tone, quarterLength=0.25)
                n.articulations.append(articulations.Fingering(finger))
                part_.append(n)
            total += 2.0
        return total

    span = 0.0
    if hands in ("both", "right"):
        span = build(rh, 0, True)
    if hands in ("both", "left"):
        span = build(lh, -24, False)
    if hands == "left":
        silent(rh, span)
    if hands == "right":
        silent(lh, span)
    finalize(sc)

    slug_kind = "tremolo" if shape == "octave" else "tremolo-third"
    item_id = f"exercise.{slug_kind}.{key_slug(tonic)}.{hands}"
    entry = catalog_entry(
        item_id, title, level, ["tremolo", "octaves" if shape == "octave" else "tremolo-thirds",
         "forearm", f"hands:{hands}"],
        hands, bpm, "tremolo",
        {"key": tonic, "fingeringVerified": True},
        f"scores/generated/{item_id}.mxl",
    )
    return sc, entry


def make_rotation(
    tonic: str = "C", hands: str = "left", bpm: int = 72,
) -> tuple[stream.Score, dict]:
    """
    Alberti figuration at speed — wrist rotation rather than finger work.

    The same shape `make_accompaniment` writes as an accompaniment pattern, but
    fast, in sixteenths, and named for the technique it trains, because at
    this speed it stops being an accompaniment and starts being a rotation
    study (Hanon 46-49 territory).
    """
    one_of("hands", hands, HANDS)
    level = 6.3
    title = f"Wrist rotation (Alberti at speed) in {note_name(tonic)} — {hands}"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key(tonic))
    k = key.Key(tonic)

    def build(part_: stream.PartStaff, octave: int) -> float:
        total = 0.0
        for degrees in ACCOMPANIMENT_CHORDS:
            tones = scale_pitches(k, octave, degrees)
            order = [tones[0], tones[2], tones[1], tones[2]]
            fingers = [5, 1, 3, 1] if part_ is lh else [1, 5, 3, 5]
            for _ in range(2):
                for tone, finger in zip(order, fingers):
                    n = note.Note(tone, quarterLength=0.25)
                    n.articulations.append(articulations.Fingering(finger))
                    part_.append(n)
            total += 2.0
        return total

    span = 0.0
    if hands in ("both", "left"):
        span = build(lh, 3)
    if hands in ("both", "right"):
        span = build(rh, 4)
    if hands == "left":
        silent(rh, span)
    if hands == "right":
        silent(lh, span)
    finalize(sc)

    item_id = f"exercise.rotation.{key_slug(tonic)}.{hands}"
    entry = catalog_entry(
        item_id, title, level, ["rotation", "alberti", "wrist", f"hands:{hands}"],
        hands, bpm, "rotation", {"key": tonic, "pattern": "alberti"},
        f"scores/generated/{item_id}.mxl",
    )
    return sc, entry


# --------------------------------------------------------------------------------------
# families the engine scores in a new way
# --------------------------------------------------------------------------------------


def make_articulation(
    tonic: str = "C", articulation: str = "staccato", hands: str = "right", bpm: int = 72,
) -> tuple[stream.Score, dict]:
    """
    The same four-bar phrase, written staccato and written legato.

    The pair is the exercise: playing either one well is easy, and hearing the
    difference between them is the skill. They are two items rather than one
    eight-bar item so the engine can score each against a single target —
    `drill.params.articulation` says which, and `ArticulationScore` in the
    engine judges it by how long each note is actually held.
    """
    one_of("hands", hands, HANDS)
    from music21 import expressions

    one_of("articulation", articulation, ("staccato", "legato"))
    level = 4.5 if articulation == "legato" else 4.4
    label = articulation.capitalize()
    title = f"{label} phrase in {note_name(tonic)} — {hands}"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key(tonic))
    steps = _walk(tonic, bars=4, per_bar=4)
    rh.insert(0, expressions.TextExpression(
        "Crisp and short — release each key before the next"
        if articulation == "staccato"
        else "Joined — hold each key until the next one sounds"
    ))

    def build(part_: stream.PartStaff, transpose: int) -> float:
        for i, p in enumerate(steps):
            n = note.Note(by_octaves(p, transpose // 12), quarterLength=1.0)
            if articulation == "staccato":
                n.articulations.append(articulations.Staccato())
            elif i == 0:
                n.articulations.append(articulations.Tenuto())
            part_.append(n)
        return float(len(steps))

    span = 0.0
    if hands in ("both", "right"):
        span = build(rh, 0)
    if hands in ("both", "left"):
        span = build(lh, -24)
    if hands == "left":
        silent(rh, span)
    if hands == "right":
        silent(lh, span)
    finalize(sc)

    item_id = f"exercise.articulation.{key_slug(tonic)}.{articulation}.{hands}"
    other = "legato" if articulation == "staccato" else "staccato"
    entry = catalog_entry(
        item_id, title, level,
        ["articulation", articulation, "note-length", f"hands:{hands}"],
        hands, bpm, "articulation",
        {"key": tonic, "articulation": articulation,
         # The engine's thresholds, carried with the item so a future change to
         # either is visible as a content change (docs/05 §7).
         "heldFractionMax": 0.5 if articulation == "staccato" else None,
         "heldFractionMin": None if articulation == "staccato" else 0.9},
        f"scores/generated/{item_id}.mxl",
    )
    entry["variantOf"] = f"exercise.articulation.{key_slug(tonic)}.{other}.{hands}" if articulation == "legato" else None
    entry["variantLabel"] = articulation
    return sc, entry


#: The hand-independence ratios, as (right notes : left notes) per beat.
INDEPENDENCE_RATIOS = (("2:1", 2, 1, 5.3), ("3:1", 3, 1, 6.2), ("2:3", 2, 3, 7.1), ("3:2", 3, 2, 7.1))


def make_hand_independence(
    tonic: str = "C", ratio: str = "2:1", bpm: int = 60,
) -> tuple[stream.Score, dict]:
    """
    Two hands at different subdivisions of the same beat.

    2:1 is eighths over quarters and is a coordination exercise; 2-against-3 in
    either direction is a genuinely different skill, which is why both
    directions exist as separate items — the hand that plays the three is the
    one doing the work, and it matters which one it is.
    """
    right_n, left_n, level = next((r, l, lv) for name, r, l, lv in INDEPENDENCE_RATIOS if name == ratio)
    title = f"Hand independence {ratio} in {note_name(tonic)}"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key(tonic))
    k = key.Key(tonic)
    bars = 4

    for degrees, part_, count, octave in (
        ([1, 2, 3, 4, 5], rh, right_n, 4),
        ([1, 5, 3, 1, 5], lh, left_n, 3),
    ):
        tones = scale_pitches(k, octave, degrees)
        ql = 1.0 / count
        for bar in range(bars):
            for beat in range(4):
                for i in range(count):
                    tone = tones[(bar * 4 + beat + i) % len(tones)]
                    part_.append(note.Note(tone, quarterLength=ql))
    finalize(sc)

    item_id = f"exercise.independence.{key_slug(tonic)}.{ratio.replace(':', 'v')}"
    entry = catalog_entry(
        item_id, title, level,
        ["hand-independence", f"polyrhythm-{ratio}", "coordination"],
        "both", bpm, "hand-independence",
        {"key": tonic, "ratio": ratio, "rightPerBeat": right_n, "leftPerBeat": left_n},
        f"scores/generated/{item_id}.mxl",
    )
    return sc, entry


def make_shaping(
    tonic: str = "C", shape: str = "crescendo", bpm: int = 60,
) -> tuple[stream.Score, dict]:
    """
    A scale played with a rising (or falling) dynamic, scored on the slope.

    The existing `dynamics` drill compares a soft phrase with a loud one, which
    measures whether two dynamics are different. This measures whether one line
    *travels* — velocity rising monotonically across the run with a range of at
    least 30, which is the difference between a crescendo and a step.
    """
    from music21 import dynamics as m21dynamics
    from music21 import expressions

    one_of("shape", shape, ("crescendo", "diminuendo"))
    level = 5.2
    title = f"{shape.capitalize()} over a scale in {note_name(tonic)}"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key(tonic))
    run = _diatonic_run(tonic, "major", pitch.Pitch(tonic + "4"), 2)
    if shape == "diminuendo":
        run = list(reversed(run))
    rh.insert(0, m21dynamics.Dynamic("pp" if shape == "crescendo" else "ff"))
    rh.insert(0, expressions.TextExpression(
        "Grow evenly from the first note to the last" if shape == "crescendo"
        else "Fade evenly from the first note to the last"
    ))
    add_notes(rh, run, None, 0.5)
    rh.append(note.Note(run[-1], quarterLength=2.0))
    silent(lh, 0.5 * len(run) + 2.0)
    finalize(sc)

    item_id = f"exercise.shaping.{key_slug(tonic)}.{shape}"
    entry = catalog_entry(
        item_id, title, level,
        ["dynamics", "shaping", shape, "phrasing"],
        "right", bpm, "shaping",
        {"key": tonic, "shape": shape, "minVelocityRange": 30},
        f"scores/generated/{item_id}.mxl",
    )
    return sc, entry


def make_voicing(tonic: str = "C", bpm: int = 54) -> tuple[stream.Score, dict]:
    """
    A chord sequence whose top note must sing above the rest.

    The skill the *Beautiful pieces* shelf is built on and the one nothing
    tested: a four-note chord where the melody note is the one you hear. It is
    measurable — the top note's velocity against the mean of the others — which
    is why it can be an exercise rather than a note in a lesson.
    """
    from music21 import expressions

    level = 6.2
    title = f"Voicing the top note in {note_name(tonic)}"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key(tonic))
    k = key.Key(tonic)
    rh.insert(0, expressions.TextExpression("The top note sings; the rest accompany it"))
    for degrees in ([1, 3, 5, 8], [2, 4, 6, 9], [3, 5, 7, 10], [1, 3, 5, 8]):
        tones = scale_pitches(k, 4, degrees)
        rh.append(fingered_chord(tones, [1, 2, 3, 5], 4.0))
        add_notes(lh, scale_pitches(k, 2, [degrees[0]]), [5], 4.0)
    finalize(sc)

    item_id = f"exercise.voicing.{key_slug(tonic)}"
    entry = catalog_entry(
        item_id, title, level,
        ["voicing", "melody-projection", "balance", "tone"],
        "both", bpm, "voicing",
        {"key": tonic, "topNoteRatio": 1.4},
        f"scores/generated/{item_id}.mxl",
    )
    return sc, entry


# --------------------------------------------------------------------------------------
# rhythm: ties across the bar, 16th syncopation, and the odd meters
# --------------------------------------------------------------------------------------


def make_syncopation(
    variant: str = "tied-across-bar", bpm: int = 76,
) -> tuple[stream.Score, dict]:
    """
    Ties over the barline, and syncopation at the sixteenth.

    `make_rhythm` writes patterns inside a bar. What neither it nor anything
    else wrote is a note that *starts* in one bar and belongs to the next,
    which is the thing that makes a learner lose the beat.
    """
    from music21 import expressions

    one_of("variant", variant, ("tied-across-bar", "sixteenth"))
    level = 5.4 if variant == "tied-across-bar" else 6.4
    title = ("Ties across the bar line" if variant == "tied-across-bar"
             else "Sixteenth-note syncopation")
    sc, rh, lh = grand_staff(title, bpm)
    rh.insert(0, expressions.TextExpression("Count out loud; the pulse does not move"))

    if variant == "tied-across-bar":
        pattern = [1.0, 1.0, 1.0, 1.5, 0.5, 1.0, 2.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]
    else:
        pattern = [0.25, 0.5, 0.25, 0.5, 0.5, 0.5, 0.5, 0.25, 0.5, 0.25,
                   0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1.0, 1.0]
    # Both of these stopped part-way through a bar — fourteen quarters and ten,
    # so the last bar of each was half empty and the left hand's whole-note
    # chords ran out before the right hand did. Hold the final note to the
    # barline, which is how a phrase ends anyway.
    short = (-sum(pattern)) % 4.0
    if short:
        pattern = pattern[:-1] + [pattern[-1] + short]
    tones = _walk("C", bars=4, per_bar=len(pattern) // 4 + 1)
    for i, ql in enumerate(pattern):
        rh.append(note.Note(tones[i % len(tones)], quarterLength=ql))
    beats = sum(pattern)
    for _ in range(int(beats // 4)):
        lh.append(chord.Chord(["C3", "E3", "G3"], quarterLength=4.0))
    remainder = beats - 4 * int(beats // 4)
    if remainder:
        lh.append(note.Rest(quarterLength=remainder))
    finalize(sc)

    item_id = f"exercise.syncopation.{variant}"
    entry = catalog_entry(
        item_id, title, level, ["rhythm", "syncopation", variant], "both", bpm,
        "syncopation", {"variant": variant, "timeSig": "4/4"},
        f"scores/generated/{item_id}.mxl",
    )
    return sc, entry


#: Secondary rag: a three-sixteenth cell over a beat of four.
#:
#: Written short–long — a sixteenth and an eighth — repeated without a break.
#: Three sixteenths against four means the cell starts a sixteenth later in
#: every beat and only comes home after three of them, which is the whole
#: effect: the tune appears to slip while the left hand does not move.
#:
#: `concepts.json` calls it "the three-against-four figure of the late rags" and
#: has carried the id `secondary-rag` with nothing behind it. `ragtime.8` names
#: it. This is the exercise that id was waiting for.
SECONDARY_RAG_CELL = [0.25, 0.5]

#: The chord under each bar of it, as (semitones from the tonic, quality).
#: I-IV-I-V: enough harmony that the ear has something to measure the slipping
#: figure against, and not so much that the bar is a second thing to read.
SECONDARY_RAG_CHORDS = ((0, "maj"), (5, "maj"), (0, "maj"), (7, "maj"))


def make_secondary_rag(bars: int = 4, tonic: str = "C", bpm: int = 72):
    """
    The short–long sixteenth figure that crosses the beat, over an oom-pah bass.

    Modelled on `make_syncopation`, and the difference is the point of it. That
    family writes rhythms *inside* a bar; this one writes a cell that does not
    fit the bar at all, so the figure and the barline disagree for three beats
    at a time and `finalize` ties it across. A learner who can play this can
    read late Joplin.

    The left hand plays the oom-pah rather than holding a chord, and that is not
    decoration: the whole effect is a right hand that *appears* to slip while
    something else does not move, and a held whole note does not mark a beat for
    it to slip against. With bass-chord-bass-chord underneath, the learner can
    hear which of the two hands is lying.

    **Levelled with `make_syncopation`'s sixteenth variant**, not below it. The
    first draft put this at 4.6, which is a stage-4 band: three-against-four at
    the sixteenth is not stage-4 work, it is the hardest rhythm in this file,
    and `ragtime.8` — the rung that names it — is at stage 8. A number that puts
    an item on rungs it cannot be played on is worse than no number.

    The last note is whatever is left over, so the figure lands on the final
    barline instead of stopping a sixteenth short of it.

    **Reachable through `secondary-rag`**, the concept `ragtime.8` teaches, until
    a rung names this item in its `exerciseOptions`. That is the only route to
    it: `alternativesFor` offers an exercise on a rung only when it shares a
    concept with something already there *and* sits within half a level of it.
    """
    from music21 import expressions

    # The level `make_syncopation` gives its sixteenth-note variant: the same
    # subdivision, and this one also crosses the barline.
    level = 6.4
    beats = 4.0 * bars
    title = f"Secondary rag in {note_name(tonic)} — three sixteenths against four"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key(tonic))
    rh.insert(0, expressions.TextExpression(
        "The figure is three sixteenths; the beat is four. Count the beat, not the figure"
    ))

    pattern: list[float] = []
    while sum(pattern) + sum(SECONDARY_RAG_CELL) <= beats:
        pattern.extend(SECONDARY_RAG_CELL)
    short = beats - sum(pattern)
    if short:
        pattern.append(short)
    tones = _walk(tonic, bars=bars, per_bar=len(pattern) // bars + 1)
    for index, ql in enumerate(pattern):
        rh.append(note.Note(tones[index % len(tones)], quarterLength=ql))

    for index in range(bars):
        degree, quality = SECONDARY_RAG_CHORDS[index % len(SECONDARY_RAG_CHORDS)]
        write_oompah_bar(lh, _transpose_name(tonic, degree), quality, "octave", 1.0)
    # Symbols last: the right hand was written straight through above, so there
    # was nothing to interleave them with — the second of the two orders
    # `add_symbol` describes.
    for index in range(bars):
        degree, quality = SECONDARY_RAG_CHORDS[index % len(SECONDARY_RAG_CHORDS)]
        add_symbol(rh, _figure(_transpose_name(tonic, degree), quality), 4.0 * index)
    finalize(sc)

    item_id = f"exercise.secondary-rag.{key_slug(tonic)}.{bars}bar"
    entry = catalog_entry(
        item_id, title, level,
        ["secondary-rag", "syncopation", "rhythm", "ragtime-texture", "three-against-four"],
        "both", bpm, "syncopation",
        {"key": tonic, "variant": "secondary-rag", "bars": bars, "timeSig": "4/4",
         "cell": list(SECONDARY_RAG_CELL)},
        f"scores/generated/{item_id}.mxl",
        tracks=["ragtime", "jazz", "technique"],
    )
    return sc, entry


class MeterSpec(NamedTuple):
    """One row of `ODD_METERS`: a bar `make_rhythm` cannot write."""

    signature: str
    #: One bar, as note lengths in quarters. On a counting row the right hand
    #: plays it; on a row with a `form` the left hand does, and the right comps.
    pattern: list[float]
    level: float
    #: How the bar is counted — named in the title.
    grouping: str
    #: What the meter is *for*, where it has a name. Empty where it has none.
    label: str
    #: The concepts this row carries, beyond "rhythm".
    concepts: list[str]
    #: What is printed above the staff.
    direction: str
    #: A key of `BLUES_FORMS`, where the row is a piece of music rather than a
    #: counting drill. Named rather than referenced so this table can stay above
    #: the blues section that defines the forms.
    form: str | None = None
    key: str = "C"
    tracks: tuple[str, ...] = ("technique", "core")


#: The shuffle bass in one bar, as semitones above the chord root.
#:
#: Root, fifth, sixth, fifth, twice — `blues_forms.SHUFFLE` written as intervals
#: instead of interval names, which is the figure the authored twelve-bar
#: shuffle plays and the one `blues.4` puts in front of a learner first. Paired
#: with a 12/8 row's long-short `pattern` it comes out as the slow-blues lilt:
#: the long note on the beat, the short one on the third eighth of it.
SHUFFLE_BASS = (0, 7, 9, 7, 0, 7, 9, 7)
#: …and the fingers it is played with: the little finger finds each root, the
#: thumb takes the sixth, and the second finger sits on the fifth between them.
SHUFFLE_BASS_FINGERS = (5, 2, 1, 2, 5, 2, 1, 2)

#: The meters `make_rhythm` could not express: it writes 4/4 only, and a 7/8 bar
#: is not a 4/4 bar with a note missing.
#:
#: "Odd" is the name the table was born with and two of its three rows earn it.
#: 12/8 does not — it is compound, four groups of three — and it is here because
#: it is the same problem for the same maker. `02` Part D3 names "slow blues
#: 12/8" at stage 6 and nothing in the app could write a bar of it.
#:
#: The concepts are per row rather than one tag for the family, so the 12/8
#: study is not filed under a word that is untrue of it: a learner who searches
#: "odd meter" should not be handed the most ordinary meter in the blues.
#:
#: And the 12/8 row is a *blues*, not a C major walk in a new time signature.
#: It was the latter for one draft — the same stepwise line over the same held
#: open fifth as 5/4 and 7/8, titled "slow blues" and tagged `shuffle`, sitting
#: where the blues rungs would reach it. A learner sent to "slow blues 12/8" and
#: handed a scale has been told something untrue by the catalog. So the row
#: names a form, and `make_meter` writes it: twelve bars, the shuffle bass in
#: the left hand, the shell in the right.
ODD_METERS: tuple[MeterSpec, ...] = (
    MeterSpec("5/4", [1.0] * 5, 5.4, "3 + 2", "",
              ["odd-meter", "meter-5-4"], "Count 3 + 2"),
    MeterSpec("7/8", [0.5] * 7, 6.4, "2 + 2 + 3", "",
              ["odd-meter", "meter-7-8"], "Count 2 + 2 + 3"),
    MeterSpec("12/8", [1.0, 0.5] * 4, 6.1, "4 groups of 3", "slow blues",
              ["shuffle", "compound-meter", "slow-blues", "twelve-bar-blues",
               "meter-12-8"],
              "Four beats, three eighths in each — long, short",
              form="blues", key="C",
              tracks=("blues-boogie", "jazz", "technique")),
)


def meter_spec(signature: str) -> MeterSpec:
    """The row for a signature, or a named error for the caller's typo."""
    one_of("signature", signature, tuple(spec.signature for spec in ODD_METERS))
    return next(spec for spec in ODD_METERS if spec.signature == signature)


def make_meter(signature: str = "5/4", bpm: int | None = None) -> tuple[stream.Score, dict]:
    """
    A phrase in one of `ODD_METERS`, with the grouping written above it.

    Two of the three rows are counting drills — a stepwise walk over a held open
    fifth — because what is being learnt there is where the bar ends, and a
    harmony under it would be a second thing to read.

    The third is a twelve-bar blues, because "slow blues 12/8" is a *style*
    rather than a bar length, and it is reachable from the blues rungs. What the
    meter does to the music is the lesson: each beat is three eighths, the bass
    takes two of them and then one, and that long-short is the shuffle written
    out instead of asked for in words the way `make_rhythm` has to ask for it.
    """
    from music21 import expressions

    spec = meter_spec(signature)
    bpm = bpm if bpm is not None else (76 if spec.form else 66)
    bar_length = sum(spec.pattern)
    name = f"{spec.signature} {spec.label}".strip()

    if spec.form is None:
        title = f"{name} — counting in {spec.grouping}"
        sc, rh, lh = grand_staff(title, bpm, ts=spec.signature)
        rh.insert(0, expressions.TextExpression(spec.direction))
        per_bar = len(spec.pattern)
        tones = _walk("C", bars=4, per_bar=per_bar)
        for bar in range(4):
            for i, ql in enumerate(spec.pattern):
                rh.append(
                    note.Note(tones[(bar * per_bar + i) % len(tones)], quarterLength=ql))
            lh.append(chord.Chord(["C3", "G3"], quarterLength=bar_length))
        params = {"timeSig": signature, "grouping": spec.grouping}
    else:
        bars = BLUES_FORMS[spec.form]
        title = f"{name} in {note_name(spec.key)} — counting in {spec.grouping}"
        sc, rh, lh = grand_staff(title, bpm, ts=spec.signature, ks=key.Key(spec.key))
        rh.insert(0, expressions.TextExpression(spec.direction))
        for index, (degree, quality) in enumerate(bars):
            root_name = _transpose_name(spec.key, degree)
            # Bar by bar, so the symbol goes in before the chord it names.
            add_symbol(rh, _figure(root_name, quality), bar_length * index)
            top = pitch.Pitch(root_name + "4")
            shell = [top, up(top, triad(quality)[1]), up(top, 10)]
            # Twice a bar rather than once: a chord held for six quarters stops
            # sounding long before the bar does, and the learner loses the half
            # way point of a bar they are still learning to count.
            for _ in range(2):
                rh.append(fingered_chord(shell, [1, 2, 5], bar_length / 2))
            root = pitch.Pitch(root_name + "2")
            for semitones, length, finger in zip(
                SHUFFLE_BASS, spec.pattern, SHUFFLE_BASS_FINGERS
            ):
                n = note.Note(up(root, semitones), quarterLength=length)
                n.articulations.append(articulations.Fingering(finger))
                lh.append(n)
        params = {"timeSig": signature, "grouping": spec.grouping, "key": spec.key,
                  "form": spec.form, "bars": len(bars)}
    finalize(sc)

    item_id = f"exercise.meter.{signature.replace('/', '-')}"
    entry = catalog_entry(
        item_id, title, spec.level, ["rhythm", *spec.concepts],
        "both", bpm, "meter", params,
        f"scores/generated/{item_id}.mxl", tracks=list(spec.tracks),
    )
    return sc, entry


def make_pedal_variant(
    root: str = "C", variant: str = "held-melody", bpm: int = 54,
) -> tuple[stream.Score, dict]:
    """
    The two pedal skills the clean-change drill does not reach.

    `held-melody` is a melody note held while the harmony under it moves — the
    pedal has to change without cutting the melody, which is the whole
    difficulty. `half-pedal` asks for the damper part-way, scored on the CC64
    *value* rather than on its timing: a pedal that is only ever 0 or 127 cannot
    play late Romantic music.
    """
    from music21 import expressions

    one_of("variant", variant, ("held-melody", "half-pedal"))
    level = 6.4 if variant == "held-melody" else 7.4
    k = key.Key(root)
    title = ("Held melody over changing harmony" if variant == "held-melody"
             else "Half pedal — the damper part-way down") + f" in {note_name(root)}"
    sc, rh, lh = grand_staff(title, bpm, ks=k)
    rh.insert(0, expressions.TextExpression(
        "Change the pedal under the held note — it must not break"
        if variant == "held-melody"
        else "Half way down: enough to blur, not enough to smear"
    ))
    for degrees in ([1, 3, 5], [1, 4, 6], [2, 5, 7], [1, 3, 5]):
        lh.append(fingered_chord(scale_pitches(k, 3, degrees), [5, 3, 1], 4.0))
    if variant == "held-melody":
        # One note across all four bars: that is the exercise.
        add_notes(rh, scale_pitches(k, 5, [1]), [5], 16.0)
    else:
        for degrees in ([5], [6], [5], [3]):
            add_notes(rh, scale_pitches(k, 5, degrees), [5], 4.0)
    finalize(sc)

    item_id = f"exercise.pedal.{variant}.{key_slug(root)}"
    entry = catalog_entry(
        item_id, title, level,
        ["sustain-pedal", variant, "CC64", "tone"], "both", bpm,
        "pedal-held" if variant == "held-melody" else "half-pedal",
        {"key": root,
         **({"ccRange": [32, 96]} if variant == "half-pedal" else {"holdBars": 4})},
        f"scores/generated/{item_id}.mxl",
    )
    return sc, entry


# --------------------------------------------------------------------------------------
# harmony: voicings, progressions and left-hand patterns (P12b)
# --------------------------------------------------------------------------------------
#
# `02` Parts D2-D4 describe the chords-pop, blues and jazz tracks and the
# curriculum names skills — the four-chord loop in five keys, shell voicings,
# walking bass — that had no exercise anywhere. Everything below carries
# `<harmony>` chord symbols so the chord-chart view (`04` §3b) works on it: an
# exercise about harmony that the chart cannot read is an exercise about
# notation.


def add_symbol(part: stream.PartStaff, figure: str, offset: float) -> None:
    """
    Writes a chord symbol above the staff at `offset`.

    `writeAsChord = False` matters: without it music21 exports the symbol as a
    sounding chord as well, and the learner gets the voicing printed twice —
    once as the thing to play and once as a block underneath it.

    **Where in the writing to call it.** `insert` puts the symbol at an absolute
    offset and carries the part's end to that offset with it, so the one safe
    rule is: insert a symbol only at an offset the part has *already reached*.
    In practice that comes out two ways, and both are in this file.

    A maker that writes bar by bar inserts each symbol at the end it is standing
    on, which is immediately *before* the chord that bar contains — and that
    order is not only about length. `confirm` judges a sounding chord against
    the last symbol it saw, and at equal offsets the order is insertion order,
    so a symbol filed in behind its own chord leaves that chord to be judged by
    the previous bar's harmony. A shell of G7 read as a Dm7 has no seventh in
    it, which is exactly the check that then fires.

    A maker that writes its staff straight through — because its figure crosses
    barlines, or because the staff is one long rest — has nothing to interleave
    with, so it appends everything first and inserts every symbol *afterwards*,
    behind an end that is already past them. `write_vamp_symbols` is that case
    and says so.
    """
    from music21 import harmony

    symbol = harmony.ChordSymbol(figure)
    symbol.writeAsChord = False
    part.insert(offset, symbol)


def add_power_symbol(part: stream.PartStaff, root_name: str, offset: float) -> None:
    """
    A power chord's symbol, which cannot be written as a figure.

    `harmony.ChordSymbol("A5")` parses, and everything about it looks right: the
    root is A, the pitches are A and E, and `.figure` reads back "A5". What it
    does not have is a `chordKind`, so the MusicXML carries `<kind>none</kind>`
    and OSMD prints **nothing at all** above the staff. A chord-chart exercise
    with no chords on it, and every check passed — the item validated, the
    pitches were right, and a test on `.figure` was green.

    Built from the kind instead it exports `<kind text="5">power</kind>`, which
    is what a reader sees as "A5". The tests read the kind rather than the
    figure for the same reason.
    """
    from music21 import harmony

    symbol = harmony.ChordSymbol(kind="power", root=root_name)
    # The text a renderer prints after the root. Without it the kind is exported
    # with no `text` attribute and a renderer is left to invent one.
    symbol.chordKindStr = "5"
    symbol.writeAsChord = False
    part.insert(offset, symbol)


#: The four ways a seventh chord is voiced under one hand (`02` Part D4).
#:
#: Semitones above the root. "Shell" is root-third-seventh, the voicing that
#: says the most with three notes; the rootless voicings drop the root because
#: a bass player has it, and A/B alternate so the hand stays put through a
#: ii-V-I instead of leaping.
SEVENTH_VOICINGS: dict[str, dict[str, list[int]]] = {
    "close":       {"maj7": [0, 4, 7, 11], "7": [0, 4, 7, 10], "m7": [0, 3, 7, 10]},
    "shell":       {"maj7": [0, 4, 11],    "7": [0, 4, 10],    "m7": [0, 3, 10]},
    "rootless-a":  {"maj7": [4, 7, 11, 14], "7": [4, 7, 10, 14], "m7": [3, 7, 10, 14]},
    "rootless-b":  {"maj7": [11, 14, 16, 19], "7": [10, 14, 16, 19], "m7": [10, 14, 15, 19]},
}

#: A triad in semitones from its root, by quality.
#:
#: One place where this fact is written down, in the same shape as
#: `SEVENTH_VOICINGS` and for the same reason. Three call sites used to work it
#: out inline instead, and one of them — `quality.startswith("m")`, true of
#: "maj7" as well as "m7" — engraved a minor triad under every major-seventh
#: symbol in twelve keys, shipped, unnoticed by anybody reading the source.
#:
#: A lookup cannot get that wrong. It also *fails* on a quality nobody wrote
#: down, where `4 if quality == "major" else 3` quietly returns a minor triad
#: for "diminished" — the failure that is worse than a crash, because the build
#: is green and the learner practises the wrong chord.
TRIAD_INTERVALS: dict[str, list[int]] = {
    "major": [0, 4, 7],
    "minor": [0, 3, 7],
    "diminished": [0, 3, 6],
    "augmented": [0, 4, 8],
}

#: The triad a seventh-chord quality is built on. `m7` is a minor triad with a
#: minor seventh; `7` and `maj7` are both major triads and differ only above.
TRIAD_OF_SEVENTH: dict[str, str] = {"maj7": "major", "7": "major", "m7": "minor"}


def triad(quality: str) -> list[int]:
    """The triad for a quality named either way — "major" or "maj7"."""
    if quality in TRIAD_INTERVALS:
        return TRIAD_INTERVALS[quality]
    return TRIAD_INTERVALS[TRIAD_OF_SEVENTH[quality]]

VOICING_LABELS = {
    "close": "close position",
    "shell": "shell (root, 3rd, 7th)",
    "rootless-a": "rootless A",
    "rootless-b": "rootless B",
}

#: The quality on each degree of a major-key ii-V-I.
II_V_I = (("m7", 2, "ii"), ("7", 7, "V"), ("maj7", 0, "I"))


def _figure(root_pc_name: str, quality: str) -> str:
    return f"{root_pc_name}{'' if quality == 'maj' else quality}"


def _triad_figure(root_pc_name: str, quality: str) -> str:
    """
    The symbol for the triad a seventh quality reduces to.

    The intro tiers play `triad(quality)` and printed `_figure(quality)` over
    it, so a learner at level 4.4 read "Dm7" and played D-F-A. The app has a
    chord-chart view that reads exactly these symbols, so the drill taught that
    Dm7 is a three-note chord with no seventh in it. Whichever of the notes and
    the symbol is the simplification, they have to agree.
    """
    quality = TRIAD_OF_SEVENTH.get(quality, quality)
    return f"{root_pc_name}{'m' if quality in ('minor', 'm') else ''}"


def chord_shape(quality: str) -> list[int]:
    """Root-position semitones for a quality named as a triad or a seventh."""
    if quality in SEVENTH_VOICINGS["close"]:
        return SEVENTH_VOICINGS["close"][quality]
    return triad({"maj": "major", "m": "minor"}.get(quality, quality))


def telling_pair(quality: str) -> list[int]:
    """
    The two notes above a bass note that say which chord this is.

    A stride or oom-pah left hand plays two notes on the after-beat and which
    two is not free: the third says major or minor, and the note above it says
    triad or seventh. Under a dominant that second note is the flat seventh --
    B and F under G7 -- and the fifth was played instead, so every stride bar
    in every key printed a dominant symbol over a plain triad.
    """
    shape = chord_shape(quality)
    return [shape[1], shape[3] if len(shape) > 3 else shape[2]]


#: Semitones above a root, as the interval that spells them correctly.
#:
#: `Pitch.transpose(4)` is not the major third: it is *some* pitch four
#: semitones up, and music21 picks the spelling by pitch class. In A flat major
#: that turns the tonic itself into G sharp, so a chord chart in A flat printed
#: G#m7 where A flat's ii belongs. Transposing by a named interval keeps the
#: letter, which is the whole difference between a key signature and a piano.
SEMITONE_INTERVAL = {
    0: "P1", 1: "m2", 2: "M2", 3: "m3", 4: "M3", 5: "P4", 6: "A4", 7: "P5",
    8: "m6", 9: "M6", 10: "m7", 11: "M7", 12: "P8", 13: "m9", 14: "M9",
    15: "m10", 16: "M10", 17: "P11", 19: "P12", 21: "M13",
}

#: Which scale degree each semitone above the tonic is, where it is diatonic.
DEGREE_FOR_SEMITONE = {0: 1, 2: 2, 4: 3, 5: 4, 7: 5, 9: 6, 11: 7}

#: Spellings that are correct and that nobody prints.
#:
#: Each of these is a white key wearing an accidental it does not need. They
#: turn up as the flat II of the flat keys, where the arithmetic is right and
#: the notation is unreadable.
UNWRITTEN = frozenset({"C-", "F-", "B#", "E#"})

#: The octave the guide tones live in, as MIDI numbers: E4 up to E5.
#:
#: A ii-V-I only shows its voice leading if the two notes stay put while the
#: chords move under them. Written from each root upwards instead, the third of
#: C major lands an octave below the seventh it just resolved from and the
#: exercise demonstrates nothing.
GUIDE_TONE_FLOOR, GUIDE_TONE_CEILING = 64, 76


def in_guide_tone_window(p: pitch.Pitch) -> pitch.Pitch:
    """`p` moved by octaves until it sits between E4 and E5."""
    while p.ps < GUIDE_TONE_FLOOR:
        p = p.transpose(interval.Interval("P8"))
    while p.ps >= GUIDE_TONE_CEILING:
        p = p.transpose(interval.Interval("-P8"))
    return p

def alternating_forms(start: str) -> list[str]:
    """
    The rootless form each chord of a ii-V-I takes, starting from `start`.

    `SEVENTH_VOICINGS` has said "A/B alternate so the hand stays put through a
    ii-V-I instead of leaping" since it was written, and for a long time nothing
    alternated: both makers played one form on all three chords. That is the
    leap the alternation exists to prevent, and on the B form it carried the V
    chord up to D6, which is not a register anybody comps in.

    A on the ii, B on the V, A again on the I. Two voices move by a step and the
    rest stay, which is the whole reason the voicings are worth learning.
    """
    other = "rootless-b" if start == "rootless-a" else "rootless-a"
    return [start, other, start]


def place_near(tones: list[pitch.Pitch], anchor_ps: float | None) -> list[pitch.Pitch]:
    """
    The same voicing shifted by whole octaves to sit nearest `anchor_ps`.

    Octaves only, so the shape is untouched — this decides *where* a voicing is
    played, never what is in it. With no anchor it lands in the middle of the
    guide-tone window; with one, its bottom note goes as close to the previous
    chord's bottom note as an octave shift allows, which is what a player's hand
    does between two chords.
    """
    target = anchor_ps if anchor_ps is not None else (GUIDE_TONE_FLOOR + GUIDE_TONE_CEILING) / 2
    best: list[pitch.Pitch] | None = None
    best_gap = None
    for octaves in (-2, -1, 0, 1, 2):
        shifted = [by_octaves(t, octaves) for t in tones]
        gap = abs(shifted[0].ps - target)
        if best_gap is None or gap < best_gap:
            best, best_gap = shifted, gap
    assert best is not None
    return best


#: The lowest and highest keys on a piano, as MIDI numbers: A0 and C8.
KEYBOARD_BOTTOM, KEYBOARD_TOP = 21, 108


def fits_on_the_keyboard(tonic: str, octaves: int, preferred: int) -> pitch.Pitch:
    """
    The starting pitch for a run of `octaves`, dropped until the top of it exists.

    Every scale and arpeggio started its right hand at `tonic4` whatever the
    span, which is fine up to three octaves and walks off the end of the
    instrument at four: G4 plus four octaves is G8, and a piano stops at C8. The
    four-octave scales and arpeggios in D, E, F sharp, G, A and B — 44 items,
    206 notes — asked for keys that are not there.

    Dropping the start by whole octaves is the same fix a player makes: a
    four-octave scale is begun lower, not abandoned.
    """
    octave = preferred
    while octave > 0:
        start = pitch.Pitch(f"{tonic}{octave}")
        if start.midi + 12 * octaves <= KEYBOARD_TOP and start.midi >= KEYBOARD_BOTTOM:
            return start
        octave -= 1
    raise ValueError(f"{tonic}: {octaves} octaves do not fit on a piano from any octave")


def one_of(name: str, value: str, allowed: tuple[str, ...]) -> str:
    """
    `value` if the generator knows it, and a loud failure if it does not.

    An `else` is not a check. `make_shaping("C", "rise")` — a word this
    generator has never used — produced a score titled "Rise over a scale in C"
    that printed *ff* and the instruction "Fade evenly from the first note to
    the last", because "rise" is not "crescendo" and the else branch is the
    diminuendo. `make_scale` with a bad `motion` quietly wrote a contrary-motion
    scale. `make_ii_v_i` and `make_comping` looked their tier up with
    `next(..., default)` and silently handed back the middle one.

    There was one `raise ValueError` in three thousand lines, and the families
    that turned out to be *right* are the table-driven ones — because indexing a
    table raises. This gives the same failure to the families that branch.
    """
    if value not in allowed:
        raise ValueError(
            f"{name}={value!r} is not one of {list(allowed)}. The generator's "
            "inputs are a closed set: a wrong one has to stop the build, not "
            "engrave something plausible."
        )
    return value


def by_octaves(p: pitch.Pitch, count: int) -> pitch.Pitch:
    """
    `p` moved `count` whole octaves, up or down, spelled the same.

    A perfect octave at a time and never a semitone count: twelve semitones is a
    number and music21 respells it, so a D flat two octaves up comes back as a
    C sharp. It also keeps this off `SEMITONE_INTERVAL`, which stops at a
    thirteenth and raised a `KeyError` on the first two-octave shift.
    """
    step = interval.Interval("P8" if count >= 0 else "-P8")
    out = p
    for _ in range(abs(count)):
        out = out.transpose(step)
    return out


#: The twelve keys as a chord chart spells them.
#:
#: `MAJOR_KEYS` ends with G flat, which is right for a scale — the fingering and
#: the key signature are what a scale is about. A chart in G flat prints its IV
#: chord as C flat, which no chart does; the same music written in F sharp
#: prints B. So the harmony families use F sharp and the scale families keep
#: G flat, because they are answering different questions.
HARMONY_KEYS = ("C", "D-", "D", "E-", "E", "F", "F#", "G", "A-", "A", "B-", "B")

#: The keys a band plays blues in, because a guitar is tuned to them.
#:
#: The default harmony set is `narrow` — C, F, B flat, E flat — which are the
#: keys a horn section reads and contain not one of these. So the `jam` module,
#: whose own lesson says "the guitarist will call E, A, G or D", could not offer
#: a boogie, a walking line or a comping pattern in any key it names, and its
#: four exercises were all borrowed from other rungs.
JAM_KEYS = ("E", "A", "G", "D")


def _readable(p: pitch.Pitch) -> pitch.Pitch:
    """
    Respells double accidentals, and nothing else.

    A player reading E double flat has been failed by the notation, not taught
    something — and the flat keys produce them freely: the tritone substitute in
    B flat is spelled B double flat by interval, and the quartal stack in G flat
    reaches both B double flat and E double flat. A reader in a flat key is not
    confused by a flat, so the rule stays narrow: only the spellings nobody
    writes get changed.
    """
    if abs(p.alter) > 1 or p.name in UNWRITTEN:
        return p.simplifyEnharmonic(inPlace=False)
    return p


def up(p: pitch.Pitch, semitones: int) -> pitch.Pitch:
    """`p` raised by `semitones`, spelled as the interval rather than the pitch class."""
    return _readable(p.transpose(interval.Interval(SEMITONE_INTERVAL[semitones])))


def _transpose_name(tonic: str, semitones: int) -> str:
    """The note name `semitones` above `tonic`, spelled for the key."""
    k = key.Key(tonic)
    degree = DEGREE_FOR_SEMITONE.get(semitones)
    if degree is not None:
        return k.pitchFromDegree(degree).name
    # Chromatic: the diatonic degree above it, lowered — which is how a flat
    # second is spelled, and then made printable.
    #
    # The flat II is borrowed from outside the key, so spelling it by the key
    # signature gives C flat in B flat and F flat in E flat, and no chart has
    # ever printed either. `_readable` turns those into B and E and leaves
    # D flat alone, which is what a chart in C actually says.
    above = k.pitchFromDegree(DEGREE_FOR_SEMITONE[semitones + 1])
    lowered = pitch.Pitch(above.nameWithOctave)
    lowered.accidental = pitch.Accidental(above.alter - 1)
    return _readable(lowered).name


def chart_root(root_name: str, quality: str) -> str:
    """
    The spelling of a chord root that its own notes can be written in.

    `_transpose_name` spells a root by the key it is borrowed into, which is
    right for a chord that belongs to the key and can be badly wrong for one
    that does not. The half-step approach to F minor in E flat comes out of that
    arithmetic as **G flat minor 7**: its third is B double flat and its seventh
    F flat, and no chart has ever printed either. The same chord spelled F sharp
    minor 7 is F sharp, A, C sharp, E — four notes a reader can take in at a
    glance.

    `_readable` cannot help, because it fixes the *pitches* after the fact and
    leaves the printed root saying G flat over a chord that no longer spells one.
    The root is the thing that has to move.

    So both spellings are built, each is charged for the notes nobody writes —
    a double accidental, or one of `UNWRITTEN`'s white keys wearing an
    accidental — and the cheaper wins. A tie keeps the name the key gave it,
    because in a flat key a flat is what a reader is expecting and D flat 7 is
    what a chart prints even though C sharp 7 costs the same.
    """
    def cost(name: str) -> int:
        base = pitch.Pitch(name + "4")
        tones = [base.transpose(interval.Interval(SEMITONE_INTERVAL[i]))
                 for i in chord_shape(quality)]
        return sum(1 for p in tones if abs(p.alter) > 1 or p.name in UNWRITTEN)

    other = pitch.Pitch(root_name).getEnharmonic().name
    return other if cost(other) < cost(root_name) else root_name


def make_seventh_voicing(
    tonic: str = "C", voicing: str = "shell", bpm: int = 66,
) -> tuple[stream.Score, dict]:
    """
    A ii-V-I with the sevenths voiced one way, in one key.

    One exercise per voicing per key rather than a menu, because the point is
    the *hand shape*: playing a shell voicing once teaches nothing, and playing
    twelve of them is how the shape stops needing to be worked out.
    """
    level = 6.1 if voicing in ("close", "shell") else 7.1
    label = VOICING_LABELS[voicing]
    title = f"ii-V-I in {note_name(tonic)} — {label}"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key(tonic))

    # A rootless drill alternates its two forms; the close and shell voicings do
    # not have two forms and play the one they name on every chord.
    forms = alternating_forms(voicing) if voicing.startswith("rootless") else [voicing] * 3

    offset = 0.0
    previous = None
    for (quality, degree, _roman), form in zip(II_V_I, forms):
        root_name = _transpose_name(tonic, degree)
        add_symbol(rh, _figure(root_name, quality), offset)
        intervals = SEVENTH_VOICINGS[form][quality]
        base = pitch.Pitch(root_name + "4")
        tones = [up(base, i) for i in intervals]
        if form.startswith("rootless"):
            tones = place_near(tones, previous)
            previous = tones[0].ps
        fingers = [1, 2, 3, 5][: len(tones)] if len(tones) > 3 else [1, 2, 5]
        rh.append(fingered_chord(tones, fingers, 4.0))
        # The bass note the voicing assumes, so the exercise sounds like the
        # harmony it names even when the right hand has dropped the root.
        add_notes(lh, [pitch.Pitch(root_name + "2")], [5], 4.0)
        offset += 4.0
    finalize(sc)

    item_id = f"exercise.voicing7.{key_slug(tonic)}.{voicing}"
    entry = catalog_entry(
        item_id, title, level,
        ["seventh-chord", "voicing", f"voicing-{voicing}", "ii-V-I", "jazz-harmony"],
        "both", bpm, "seventh-voicing",
        {"key": tonic, "voicing": voicing, "progression": ["ii7", "V7", "Imaj7"]},
        f"scores/generated/{item_id}.mxl",
        tracks=["jazz", "chords-pop", "technique"],
    )
    return sc, entry


#: The loop every pop song is made of, as scale degrees: I-V-vi-IV.
FOUR_CHORD_LOOP = ((0, "maj"), (7, "maj"), (9, "m"), (5, "maj"))


def make_four_chord_loop(
    tonic: str = "C", inversions: bool = False, bpm: int = 72,
) -> tuple[stream.Score, dict]:
    """
    I-V-vi-IV, root position or with the voice leading tidied by inversions.

    `02` Part D2's chords-pop 4 rung asks for this in five keys and the catalog
    offered it in none. The inverted version is the one worth practising: the
    root-position form teaches the chords, the inverted form teaches the hand
    to stop jumping.
    """
    level = 4.4 if not inversions else 5.4
    kind_label = "with inversions" if inversions else "root position"
    title = f"I-V-vi-IV in {note_name(tonic)} — {kind_label}"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key(tonic))

    offset = 0.0
    previous: list[pitch.Pitch] | None = None
    for degree, quality in FOUR_CHORD_LOOP:
        root_name = _transpose_name(tonic, degree)
        add_symbol(rh, _figure(root_name, quality), offset)
        intervals = [0, 3, 7] if quality == "m" else [0, 4, 7]
        base = pitch.Pitch(root_name + "4")
        tones = [up(base, i) for i in intervals]
        if inversions and previous is not None:
            # Rotate the chord upwards until its lowest note is near the last
            # chord's, which is what "voice leading" means with triads.
            while tones[0].ps < previous[0].ps - 3:
                tones = tones[1:] + [up(tones[0], 12)]
            while tones[0].ps > previous[0].ps + 3:
                tones = [tones[-1].transpose(interval.Interval("-P8"))] + tones[:-1]
        rh.append(fingered_chord(tones, [1, 3, 5], 4.0))
        add_notes(lh, [pitch.Pitch(root_name + "2")], [5], 4.0)
        previous = tones
        offset += 4.0
    finalize(sc)

    suffix = "inversions" if inversions else "root"
    item_id = f"exercise.loop4.{key_slug(tonic)}.{suffix}"
    entry = catalog_entry(
        item_id, title, level,
        ["chord-progression", "four-chord-loop", "I-V-vi-IV",
         "voice-leading" if inversions else "root-position"],
        "both", bpm, "progression",
        {"key": tonic, "progression": ["I", "V", "vi", "IV"], "inversions": inversions},
        f"scores/generated/{item_id}.mxl",
        tracks=["chords-pop", "core"],
    )
    return sc, entry


def make_slash_bass(tonic: str = "C", bpm: int = 69) -> tuple[stream.Score, dict]:
    """
    A stepwise bass line under held chords, written as slash chords.

    The trick behind half the pop ballads there are: the chords barely move and
    the bass walks down the scale, so each bar is the same triad over a
    different bass note. Reading `C/B` and knowing it is still a C chord is the
    skill.
    """
    level = 5.4
    title = f"Slash chords — a walking bass under held harmony in {note_name(tonic)}"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key(tonic))
    # I  I/7  vi  I/5  IV  IV/3  ii  V — the descending line.
    plan = [(0, "maj", 0), (0, "maj", 11), (9, "m", 9), (0, "maj", 7),
            (5, "maj", 5), (5, "maj", 4), (2, "m", 2), (7, "maj", 7)]
    offset = 0.0
    previous_bass: float | None = None
    for index, (degree, quality, bass_semitones) in enumerate(plan):
        root_name = _transpose_name(tonic, degree)
        bass_name = _transpose_name(tonic, bass_semitones)
        figure = _figure(root_name, quality)
        add_symbol(rh, figure if bass_name == root_name else f"{figure}/{bass_name}", offset)
        intervals = [0, 3, 7] if quality == "m" else [0, 4, 7]
        base = pitch.Pitch(root_name + "4")
        rh.append(fingered_chord([up(base, i) for i in intervals], [1, 3, 5], 2.0))
        # Octaves chosen so the line goes down. Written at a fixed octave it
        # does not: B is above C inside one octave, so a C-B-A-G "descent"
        # spelled that way climbs a seventh and then falls, which is a
        # different exercise and not the one named in the title. The last bar
        # is the dominant, where the line turns round to start again.
        bass = pitch.Pitch(bass_name + "3")
        if index == len(plan) - 1:
            bass = pitch.Pitch(bass_name + "2")
        else:
            while previous_bass is not None and bass.ps > previous_bass:
                bass = bass.transpose(interval.Interval("-P8"))
            previous_bass = bass.ps
        add_notes(lh, [bass], [5], 2.0)
        offset += 2.0
    finalize(sc)

    item_id = f"exercise.slash-bass.{key_slug(tonic)}"
    entry = catalog_entry(
        item_id, title, level,
        ["slash-chord", "bass-line", "voice-leading", "chord-symbols"],
        "both", bpm, "slash-bass",
        {"key": tonic, "shape": "descending stepwise bass"},
        f"scores/generated/{item_id}.mxl",
        tracks=["chords-pop", "jazz"],
    )
    return sc, entry


#: The twelve-bar blues, as (scale degree, quality) per bar.
#:
#: Four bars of I, which is the form `blues.4` states in words — "Four bars of
#: C7, two of F7, two of C7, one of G7, one of F7, then two of C7 (the last of
#: which is often G7)" — and the form `tools/content/blues_forms.py` writes into
#: the authored shuffle a learner meets on that same rung.
#:
#: This used to put IV in bar two, the "quick change", and nothing in the app
#: teaches the quick change or mentions it. So a learner read the form on
#: blues.4, played the shuffle that matches it, and then met a walking bass and
#: a boogie on the next two rungs whose second bar had moved to the four, with
#: nothing anywhere saying why. Three statements of the same twelve bars, and
#: one of them disagreed.
#:
#: The quick change is a real and common variant. It is not in the app because
#: no lesson introduces it, and a variant nobody is told about is not a variant,
#: it is an inconsistency.
TWELVE_BAR = ((0, "7"), (0, "7"), (0, "7"), (0, "7"),
              (5, "7"), (5, "7"), (0, "7"), (0, "7"),
              (7, "7"), (5, "7"), (0, "7"), (7, "7"))

#: The minor twelve-bar, the same way.
#:
#: `02` Part D3 names "minor blues" at stage 6 and `TWELVE_BAR` is dominant in
#: every bar, so the line that asked for it had nothing to play. The shape is
#: the standard one: the i and the iv are minor sevenths, and bars nine and ten
#: are the ♭VI7–V7 pair. That pair is the only place a minor blues leaves the
#: key and it is what makes it sound like a minor blues rather than a blues with
#: a flat third in it, so it is written out here rather than derived from
#: `TWELVE_BAR` by lowering thirds.
TWELVE_BAR_MINOR = ((0, "m7"), (0, "m7"), (0, "m7"), (0, "m7"),
                    (5, "m7"), (5, "m7"), (0, "m7"), (0, "m7"),
                    (8, "7"),  (7, "7"),  (0, "m7"), (7, "7"))

#: The twelve bars each blues form walks through, by name. One statement of each
#: form, in one place — which is the rule `TWELVE_BAR`'s own comment exists to
#: keep, and the reason the boogie's four bars are read from here rather than
#: written out again beside it.
BLUES_FORMS: dict[str, tuple[tuple[int, str], ...]] = {
    "blues": TWELVE_BAR,
    "minor-blues": TWELVE_BAR_MINOR,
}


#: What a walking line is walking over, and what that is worth.
#:
#: The minor blues is a band above the major one for a reason a learner can
#: hear: ten of its bars are the same walk in a different mode, and bars nine
#: and ten are a ♭VI7 and a V7 that are not in the key at all, so the approach
#: notes into them are the first ones in the family that cannot be found by ear
#: from the scale.
WALKING_BASS_FORMS: dict[str, float] = {
    "blues": 6.2,
    "minor-blues": 6.4,
    "ii-V-I": 6.4,
}


def walking_bass_fingers(line: list[pitch.Pitch]) -> list[int]:
    """
    Fingers for one bar of root–third–fifth–approach in the left hand.

    Root, third and fifth are 5-3-1: the hand sits over the chord. The
    approach note is a semitone under the *next* root and lands wherever
    that is — under this bar's root more often than not (C E G then B, F A C
    then B) — so its finger follows its place in the hand rather than a
    fixed fourth entry. `[5, 3, 2, 1]` gave the approach the thumb, which put
    finger 1 below finger 2 on every bar whose next root was lower: a left
    hand crossing itself, sixteen items, on the rungs that introduce the
    line. Melodic, so `confirm_fingering` never saw it.
    """
    root, third, fifth, approach = line
    if approach.ps >= fifth.ps:
        last = 1
    elif approach.ps == third.ps:
        last = 3
    elif approach.ps > third.ps:
        last = 2
    elif approach.ps > root.ps:
        last = 4
    else:
        last = 5
    return [5, 3, 1, last]


def make_walking_bass(
    tonic: str = "C", form: str = "blues", tier: str = "standard",
    bpm: int | None = None,
) -> tuple[stream.Score, dict]:
    """
    A walking bass line in quarters, over a blues or over a ii-V-I.

    Four notes to the bar, root-third-fifth-approach: the approach note is a
    semitone below the next bar's root, which is the whole trick and the reason
    a walking line sounds inevitable rather than random.

    **intro** is the left hand alone and slower. `blues.5` introduces the
    walking line at band 3.4-5.2 and the only studies were at 6.2 and 6.4, so
    the rung that teaches it could not offer it. Taking the right hand away is
    the honest way to make it easier: the line is the exercise, and comping a
    shell on top of it is a second skill the learner does not have yet.

    **minor-blues** is the same line over `TWELVE_BAR_MINOR`. It is a band above
    the major form, because two of its twelve bars leave the key.
    """
    one_of("form", form, tuple(WALKING_BASS_FORMS))
    level = 4.5 if tier == "intro" else WALKING_BASS_FORMS[form]
    bpm = bpm if bpm is not None else (72 if tier == "intro" else 92)
    bars = (list(BLUES_FORMS[form]) if form in BLUES_FORMS
            else [(2, "m7"), (7, "7"), (0, "maj7"), (0, "maj7")])
    title = {
        "blues": f"Walking bass over a 12-bar blues in {note_name(tonic)}",
        "minor-blues": f"Walking bass over a minor 12-bar blues in {note_name(tonic)} minor",
        "ii-V-I": f"Walking bass over ii-V-I in {note_name(tonic)}",
    }[form]
    sc, rh, lh = grand_staff(
        title, bpm, ks=minor_key(tonic) if form == "minor-blues" else key.Key(tonic))

    offset = 0.0
    for index, (degree, quality) in enumerate(bars):
        root_name = _transpose_name(tonic, degree)
        add_symbol(rh, _figure(root_name, quality), offset)
        # Looked up, not worked out. "maj7".startswith("m") is true, so this
        # line used to walk a *minor* third through every major-seventh bar and
        # comp a minor triad under a major symbol — shipped since the harmony
        # families landed, and found by the confirmation in `finalize`.
        third = triad(quality)[1]
        root = pitch.Pitch(root_name + "2")
        next_degree = bars[(index + 1) % len(bars)][0]
        next_root = pitch.Pitch(_transpose_name(tonic, next_degree) + "2")
        # A semitone under the next root: the note that makes the line sound
        # like it was going there all along.
        approach = _readable(next_root.transpose(interval.Interval("-m2")))
        line = [root, up(root, third), up(root, 7), approach]
        add_notes(lh, line, walking_bass_fingers(line), 1.0)
        # The right hand comps the shell so the line has something to walk under —
        # except at the intro tier, where the line is the whole exercise.
        if tier == "intro":
            rh.append(note.Rest(quarterLength=4.0))
        else:
            top = pitch.Pitch(root_name + "4")
            rh.append(fingered_chord(
                [top, up(top, third), up(top, 10 if quality != "maj7" else 11)], [1, 2, 5], 4.0))
        offset += 4.0
    finalize(sc)

    # `slug`, not the form verbatim: "ii-V-I" is how the progression is written
    # and an id may not carry a capital letter.
    item_id = f"exercise.walking-bass.{key_slug(tonic)}.{slug(form)}"
    if tier != "standard":
        item_id = f"{item_id}.{tier}"
    entry = catalog_entry(
        item_id, title, level,
        ["walking-bass", "bass-line", "swing", f"form-{form}"],
        "left" if tier == "intro" else "both", bpm, "walking-bass",
        {"key": tonic, "form": form, "notesPerBar": 4, "tier": tier},
        f"scores/generated/{item_id}.mxl",
        tracks=["jazz", "blues-boogie"],
    )
    return sc, entry


#: Comping rhythms as offsets in quarters within a 4/4 bar (`02` Part D4).
COMPING_PATTERNS: dict[str, list[float]] = {
    "charleston": [0.0, 1.5],
    "off-beats": [0.5, 1.5, 2.5, 3.5],
    "anticipated": [0.0, 2.5],
    "four-on-the-floor": [0.0, 1.0, 2.0, 3.0],
    # "bossa" is added below, beside `CLAVE_PATTERNS`, because it *is* the bossa
    # clave and writing its five offsets out twice is how two statements of one
    # fact come to disagree. It is also the only figure here that is two bars
    # long; `comping_cycle_bars` is how the maker and its tests find that out.
}

#: What each pattern is comped over, where it is not the ii-V-I the swing
#: patterns assume.
#:
#: A bossa played over a ii-V-I is a swing exercise with the wrong rhythm
#: printed on it. It belongs on `LATIN_VAMP`, which is where the rest of the
#: latin family sits, and two of the latin rung's six songs are bossas.
COMPING_FORM: dict[str, str] = {"bossa": "latin-vamp"}

#: The seventh each triad quality turns into. `LATIN_VAMP` is written as triads
#: because `make_montuno` voices it as one; a comping pattern voices it as a
#: shell, and a shell is the root, the third and a seventh the triad table does
#: not carry.
SEVENTH_OF_TRIAD: dict[str, str] = {"m": "m7", "maj": "maj7"}

#: Every comping study is four bars, whatever the length of its figure.
COMPING_BARS = 4


def comping_form(pattern: str) -> str:
    """The progression a comping pattern is practised over."""
    return COMPING_FORM.get(pattern, "ii-V-I")


def comping_cycle_bars(pattern: str) -> int:
    """How many bars one turn of the figure covers — one, or the bossa's two.

    A figure that does not divide `COMPING_BARS` cannot be played a whole
    number of times inside a study, so the last turn would be cut off mid-figure
    and the item would end in the middle of its own rhythm. Nothing downstream
    would see it: the bar count would be right and the notation valid.
    """
    cycle = int(max(COMPING_PATTERNS[pattern]) // 4.0) + 1
    if COMPING_BARS % cycle:
        raise ValueError(
            f"comping pattern {pattern!r} covers {cycle} bars, which does not "
            f"divide the {COMPING_BARS}-bar study: the last turn of the figure "
            "would be cut off at the double bar"
        )
    return cycle


def swing_comping_patterns() -> list[str]:
    """The patterns that sit on a ii-V-I, for the plan's jazz and jam loops."""
    return [p for p in COMPING_PATTERNS if comping_form(p) == "ii-V-I"]


def latin_comping_patterns() -> list[str]:
    """The patterns that sit on the latin vamp."""
    return [p for p in COMPING_PATTERNS if comping_form(p) == "latin-vamp"]


#: Comping at two amounts of hand. `jazz.5` meets comping at band 3.4-5.2 and
#: `jam` at 3.4-4.5, and the only comping study was at 6.3 — so the two rungs
#: that introduce the skill could not offer it. The rhythm is the same; what
#: changes is what the hand has to think about while playing it.
COMPING_TIERS: tuple[tuple[str, float, int], ...] = (
    ("intro", 4.4, 88),
    ("standard", 6.3, 132),
)


def make_comping(
    tonic: str = "C", pattern: str = "charleston", tier: str = "standard",
    bpm: int | None = None,
) -> tuple[stream.Score, dict]:
    """
    A ii-V-I comped in one rhythm, so the rhythm is the exercise.

    Chord voicings are the shell, held short: comping is a rhythmic skill and
    practising it on a voicing you have to think about teaches neither.

    **intro** takes that further — plain triads, slower — because the first time
    somebody comps, the seventh is one thing too many. **standard** is the shell
    form, which is what a player actually uses.

    **bossa** is comped over `LATIN_VAMP` rather than a ii-V-I, and its figure
    is two bars long. So the right hand is written straight through with one
    cursor instead of a bar at a time: a loop over chords cannot hold a pattern
    that crosses a barline, and that is what made this function's shape change.
    """
    one_of("tier", tier, tuple(t[0] for t in COMPING_TIERS))
    one_of("pattern", pattern, tuple(COMPING_PATTERNS))
    spec = next(t for t in COMPING_TIERS if t[0] == tier)
    _, level, default_bpm = spec
    bpm = bpm if bpm is not None else default_bpm
    offsets = COMPING_PATTERNS[pattern]
    cycle = comping_cycle_bars(pattern)
    latin = comping_form(pattern) == "latin-vamp"
    if latin:
        plan = [(degree, SEVENTH_OF_TRIAD[quality])
                for degree, quality in vamp_plan(COMPING_BARS)]
    else:
        plan = [(degree, quality) for quality, degree, _roman in II_V_I + (("maj7", 0, "I"),)]
    words = " on triads" if tier == "intro" else ""
    mode = " minor" if latin else ""
    title = (f"Comping — {pattern.replace('-', ' ')}{words} "
             f"in {note_name(tonic)}{mode}")
    sc, rh, lh = grand_staff(
        title, bpm, ks=minor_key(tonic) if latin else key.Key(tonic))

    # Which strokes land in which bar. A one-bar figure puts the same strokes in
    # all four; the bossa's two-bar figure puts three in the odd bars and one in
    # the even ones. Either way every stroke belongs to exactly one bar, so the
    # rest of this can stay a loop over bars — which is what keeps each chord
    # symbol in front of the chord it names.
    by_bar: dict[int, list[float]] = {}
    for start in range(0, COMPING_BARS, cycle):
        for offset in offsets:
            hit = 4.0 * start + offset
            by_bar.setdefault(int(hit // 4.0), []).append(hit % 4.0)

    for bar in range(COMPING_BARS):
        degree, quality = plan[bar % len(plan)]
        root_name = _transpose_name(tonic, degree)
        # The symbol says what is printed under it, at both tiers.
        add_symbol(rh, (_triad_figure if tier == "intro" else _figure)(root_name, quality),
                   4.0 * bar)
        shape = triad(quality) if tier == "intro" else SEVENTH_VOICINGS["shell"][quality]
        base = pitch.Pitch(root_name + "4")
        tones = [up(base, i) for i in shape]
        cursor = 0.0
        for within in by_bar.get(bar, []):
            if within > cursor:
                rh.append(note.Rest(quarterLength=within - cursor))
                cursor = within
            rh.append(fingered_chord(tones, [1, 2, 5], 0.5))
            cursor += 0.5
        if cursor < 4.0:
            rh.append(note.Rest(quarterLength=4.0 - cursor))
        add_notes(lh, [pitch.Pitch(root_name + "2")], [5], 4.0)
    finalize(sc)

    item_id = f"exercise.comping.{key_slug(tonic)}.{pattern}"
    if tier != "standard":
        item_id = f"{item_id}.{tier}"
    entry = catalog_entry(
        item_id, title, level,
        ["comping", "rhythm", f"comping-{pattern}",
         *(["latin", "bossa-nova"] if latin else ["swing"]), "jazz-harmony"],
        "both", bpm, "comping",
        {"key": tonic, "pattern": pattern, "offsets": offsets, "tier": tier,
         "form": comping_form(pattern), "cycleBars": cycle},
        f"scores/generated/{item_id}.mxl",
        tracks=["latin", "jazz", "chords-pop"] if latin else ["jazz", "chords-pop"],
    )
    return sc, entry


def make_stride(tonic: str = "C", bpm: int = 96) -> tuple[stream.Score, dict]:
    """
    Stride left hand: bass, chord, tenth, chord.

    The pattern under ragtime and early jazz. The tenth on beat three is what
    makes it stride rather than oom-pah, and it is also the reason it is hard —
    the hand has to leap and land, twice a bar, without looking.
    """
    level = 7.3
    title = f"Stride left hand in {note_name(tonic)}"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key(tonic))

    offset = 0.0
    for degree, quality in ((0, "maj"), (7, "7"), (0, "maj"), (5, "maj")):
        root_name = _transpose_name(tonic, degree)
        add_symbol(rh, _figure(root_name, quality), offset)
        root = pitch.Pitch(root_name + "2")
        # The after-beat chord is the third and the note that identifies the
        # chord, an octave above the bass. Under a dominant that is the flat
        # seventh, not the fifth.
        # The interval first and the octave after: `up(root, 12 + 10)` asks
        # `SEMITONE_INTERVAL` for a twenty-second, which it does not have.
        pair = telling_pair(quality)
        chord_tones = [by_octaves(up(root, i), 1) for i in pair]
        # The tenth is the third an octave up -- the same interval the chord's
        # lower note takes, and not a hard-coded major tenth, which would print
        # a major third over a minor chord the moment one was asked for.
        tenth = by_octaves(up(root, pair[0]), 1)
        # bass — chord — tenth — chord
        add_notes(lh, [root], [5], 1.0)
        lh.append(fingered_chord(chord_tones, [2, 1], 1.0))
        add_notes(lh, [tenth], [1], 1.0)
        lh.append(fingered_chord(chord_tones, [2, 1], 1.0))
        top = pitch.Pitch(root_name + "4")
        rh.append(fingered_chord([up(top, i) for i in chord_shape(quality)],
                                 [1, 2, 3, 5][: len(chord_shape(quality))], 4.0))
        offset += 4.0
    finalize(sc)

    item_id = f"exercise.stride.{key_slug(tonic)}"
    entry = catalog_entry(
        item_id, title, level,
        ["stride", "left-hand", "leaps", "ragtime-texture"],
        "both", bpm, "stride",
        {"key": tonic, "pattern": ["bass", "chord", "tenth", "chord"]},
        f"scores/generated/{item_id}.mxl",
        tracks=["ragtime", "jazz", "blues-boogie"],
    )
    return sc, entry


#: Turnaround shapes, as (scale degree, quality) per half-bar.
TURNAROUNDS: dict[str, list[tuple[int, str]]] = {
    "I-vi-ii-V": [(0, "maj7"), (9, "m7"), (2, "m7"), (7, "7")],
    "iii-VI-ii-V": [(4, "m7"), (9, "7"), (2, "m7"), (7, "7")],
}


def make_turnaround(
    tonic: str = "C", variant: str = "I-vi-ii-V", tier: str = "standard",
    bpm: int | None = None,
) -> tuple[stream.Score, dict]:
    """
    The two bars that send a chorus back to the top.

    `I-vi-ii-V` is the one every standard ends with; `iii-VI-ii-V` is the same
    two bars with the tonic replaced by the chord a third above and the vi made
    dominant, which is what a player reaches for when the tune has already sat
    on the tonic for eight bars.

    **intro** plays them as plain triads, slower. `blues.5` is where a learner
    first meets a turnaround, at band 3.4-5.2, and the shell-voiced studies sat
    at 6.4 and 7.1 — so the rung that teaches the turnaround could not offer
    one. The shape of the progression is the lesson; the sevenths come later.
    """
    one_of("tier", tier, ("intro", "standard"))
    level = (4.6 if tier == "intro" else (6.4 if variant == "I-vi-ii-V" else 7.1))
    bpm = bpm if bpm is not None else (72 if tier == "intro" else 88)
    plan = TURNAROUNDS[variant]
    title = f"Turnaround in {note_name(tonic)} — {variant}"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key(tonic))

    offset = 0.0
    for degree, quality in plan:
        root_name = _transpose_name(tonic, degree)
        add_symbol(rh, (_triad_figure if tier == "intro" else _figure)(root_name, quality), offset)
        shape = triad(quality) if tier == "intro" else SEVENTH_VOICINGS["shell"][quality]
        base = pitch.Pitch(root_name + "4")
        rh.append(fingered_chord([up(base, i) for i in shape], [1, 2, 5], 2.0))
        add_notes(lh, [pitch.Pitch(root_name + "2")], [5], 2.0)
        offset += 2.0
    finalize(sc)

    item_id = f"exercise.turnaround.{key_slug(tonic)}.{slug(variant)}"
    if tier != "standard":
        item_id = f"{item_id}.{tier}"
    entry = catalog_entry(
        item_id, title, level,
        ["turnaround", "jazz-harmony", "chord-progression"],
        "both", bpm, "turnaround",
        {"key": tonic, "variant": variant, "tier": tier},
        f"scores/generated/{item_id}.mxl",
        tracks=["jazz", "blues-boogie"],
    )
    return sc, entry


#: The three difficulties a ii-V-I is worth practising at, and the level each
#: earns. `jazz.5` meets the progression at band 3.4-5.2 and `jazz.6` works on
#: it at 6.1-6.4; one specimen at 5.4 sat outside both, so the rung that teaches
#: ii-V-I could not offer a ii-V-I. Same music, three amounts of hand.
II_V_I_SHAPES: tuple[tuple[str, float, int, str], ...] = (
    ("shells", 4.2, 54, "shells"),
    ("guide-tones", 5.4, 60, "guide tones"),
    ("rootless", 6.3, 72, "rootless voicings"),
)


def make_ii_v_i(
    tonic: str = "C", shape: str = "guide-tones", bpm: int | None = None
) -> tuple[stream.Score, dict]:
    """
    ii-V-I in one key, at one of three difficulties (`II_V_I_SHAPES`).

    The reason a ii-V-I is *the* progression: the seventh of one chord is the
    third of the next, a semitone lower. Dm7's C becomes G7's B; G7's F becomes
    Cmaj7's E. Once the hand knows that, it stops looking for the chords and
    starts hearing where they are going, which is why this is a family of its
    own rather than a voicing study — `make_seventh_voicing` teaches the shape,
    this teaches the motion.

    **shells** is the same motion with only the root and seventh, blocked, in
    one hand: two notes, which is what `jazz.5` asks for the first time it meets
    the progression. **guide-tones** is the standard form. **rootless** drops
    the root entirely — the bass player's note — and alternates the A and B
    forms of `SEVENTH_VOICINGS`, which is what `jazz.6` and `jazz.7` are for.

    Every interval here is a table lookup. Written out, the shells tier played
    the root for a whole bar and the seventh for the next, so its left hand ran
    thirty-two quarters against a right hand of sixteen — a shell is two notes
    together, not two long ones — and the rootless tier built each chord upward
    from its own third, which put the three chords a fourth apart and made a
    voicing exercise out of leaping.
    """
    one_of("shape", shape, tuple(s[0] for s in II_V_I_SHAPES))
    spec = next(s for s in II_V_I_SHAPES if s[0] == shape)
    _, level, default_bpm, words = spec
    bpm = bpm if bpm is not None else default_bpm
    title = f"ii-V-I in {note_name(tonic)} — {words}"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key(tonic))

    # A rootless tier alternates the two forms so the hand stays put; the others
    # have one shape each.
    forms = alternating_forms("rootless-a") if shape == "rootless" else [shape] * 3

    offset = 0.0
    previous = None
    # The I lasts two bars, because the point is arriving rather than moving on.
    for (quality, degree, bars), form in zip(
        (("m7", 2, 1), ("7", 7, 1), ("maj7", 0, 2)), forms
    ):
        root_name = _transpose_name(tonic, degree)
        add_symbol(rh, _figure(root_name, quality), offset)
        # Both intervals out of one table row rather than worked out here.
        # `4 if quality != "m7" else 3` is the shape of the bug that engraved
        # minor triads under major-seventh symbols in twelve keys.
        _, third, _, seventh = SEVENTH_VOICINGS["close"][quality]
        base = pitch.Pitch(root_name + "4")
        if shape == "shells":
            # One hand, two notes: root and seventh, which is what a player
            # means by a shell. The right hand rests — the first time somebody
            # meets this progression the motion is the lesson, and a second
            # hand is a second problem. This has to be *different music* from
            # the guide-tone form, not the same notes at a lower level: the
            # first draft changed only the tempo and shipped two identical
            # exercises at 4.2 and 5.4.
            # Blocked, and at the register a shell is actually played in:
            # root and seventh sounding together for the bar. Written as two
            # successive notes it was neither a shell nor the same length as
            # the staff above it.
            root = pitch.Pitch(root_name + "3")
            lh.append(fingered_chord([root, up(root, seventh)], [5, 1], 4.0 * bars))
            rh.append(note.Rest(quarterLength=4.0 * bars))
        elif shape == "rootless":
            # Third, seventh and ninth, stacked upward from the third: the root
            # is the bass player's job. Not folded one note at a time into the
            # guide-tone window — doing that dropped the ninth an octave and put
            # it a semitone *below* the third, which is a muddy cluster and not
            # the voicing anybody plays.
            voiced = place_near(
                [up(base, i) for i in SEVENTH_VOICINGS[form][quality]], previous
            )
            previous = voiced[0].ps
            rh.append(fingered_chord(voiced, [1, 2, 3, 5], 4.0 * bars))
            # A staff of nothing renders as a staff of nothing; say "rest".
            lh.append(note.Rest(quarterLength=4.0 * bars))
        else:
            voiced = [in_guide_tone_window(up(base, third)),
                      in_guide_tone_window(up(base, seventh))]
            rh.append(fingered_chord(voiced, [1, 5], 4.0 * bars))
            add_notes(lh, [pitch.Pitch(root_name + "2")], [5], 4.0 * bars)
        offset += 4.0 * bars
    finalize(sc)

    item_id = f"exercise.ii-v-i.{key_slug(tonic)}"
    if shape != "guide-tones":
        item_id = f"{item_id}.{shape}"
    entry = catalog_entry(
        item_id, title, level,
        ["ii-V-I", "guide-tones", "voice-leading", "seventh-chord", "jazz-harmony"],
        {"shells": "left", "rootless": "right"}.get(shape, "both"), bpm, "ii-V-I",
        {"key": tonic, "progression": ["ii7", "V7", "Imaj7"], "shape": shape},
        f"scores/generated/{item_id}.mxl",
        tracks=["jazz", "chords-pop", "theory-ear"],
    )
    return sc, entry


def make_tritone_sub(tonic: str = "C", bpm: int = 76) -> tuple[stream.Score, dict]:
    """
    The same ii-V-I with the dominant replaced by the chord a tritone away.

    G7 and D♭7 share their third and seventh — B/F and F/C♭, the same two notes
    spelled differently — so the substitute resolves exactly as well and the
    bass walks down in semitones instead of leaping a fourth. Written next to
    the plain ii-V-I on purpose: the exercise is hearing that the substitution
    changes the bass and almost nothing else.
    """
    level = 7.4
    title = f"Tritone substitution in {note_name(tonic)} — ii-sub V-I"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key(tonic))

    offset = 0.0
    # ii7 — ♭II7 (the substitute for V7) — Imaj7 — Imaj7.
    for quality, degree, bars in (("m7", 2, 1), ("7", 1, 1), ("maj7", 0, 2)):
        root_name = _transpose_name(tonic, degree)
        add_symbol(rh, _figure(root_name, quality), offset)
        shape = SEVENTH_VOICINGS["shell"][quality]
        base = pitch.Pitch(root_name + "4")
        rh.append(fingered_chord([up(base, i) for i in shape], [1, 2, 5], 4.0 * bars))
        add_notes(lh, [pitch.Pitch(root_name + "2")], [5], 4.0 * bars)
        offset += 4.0 * bars
    finalize(sc)

    item_id = f"exercise.tritone-sub.{key_slug(tonic)}"
    entry = catalog_entry(
        item_id, title, level,
        ["tritone-substitution", "reharmonisation", "guide-tones", "jazz-harmony"],
        "both", bpm, "tritone-sub",
        {"key": tonic, "progression": ["ii7", "subV7", "Imaj7"]},
        f"scores/generated/{item_id}.mxl",
        tracks=["jazz"],
    )
    return sc, entry


def make_open_voicing(
    tonic: str = "C", flavour: str = "quartal", bpm: int = 63,
) -> tuple[stream.Score, dict]:
    """
    Voicings built on fourths, and the suspended/added-note colours.

    Quartal voicings are stacked fourths — the sound of modal jazz and of a
    great deal of film music, and the reason they are worth a family of their
    own is that they are not spellable as triads, so a hand that only knows
    thirds cannot find them.
    """
    level = 7.2 if flavour == "quartal" else 5.3
    # Read from the root up, a stack of fourths is root, 11th, flat 7th and
    # flat 10th — which is an m11 chord, and is what the symbol has to say if
    # the chord chart is to be true.
    shapes = {
        "quartal": [0, 5, 10, 15],
        "sus2": [0, 2, 7, 12],
        "sus4": [0, 5, 7, 12],
        "add9": [0, 4, 7, 14],
    }
    labels = {"quartal": "quartal (stacked 4ths)", "sus2": "sus2", "sus4": "sus4", "add9": "add9"}
    intervals = shapes[flavour]
    title = f"{labels[flavour]} voicings in {note_name(tonic)}"
    # Quartal stacks are m11 chords on i, iv and v, so the music is in the minor
    # and the signature has to say so. Written in the major it printed sixteen
    # accidentals in four bars -- every E flat, A flat and B flat spelled out --
    # which is a page a reader fights rather than a voicing they can see.
    ks = key.Key(tonic.lower() if flavour == "quartal" else tonic)
    sc, rh, lh = grand_staff(title, bpm, ks=ks)

    offset = 0.0
    for degree in (0, 5, 7, 0):
        root_name = _transpose_name(tonic, degree)
        figure = f"{root_name}m11" if flavour == "quartal" else f"{root_name}{flavour}"
        add_symbol(rh, figure, offset)
        base = pitch.Pitch(root_name + "4")
        rh.append(fingered_chord([up(base, i) for i in intervals], [1, 2, 3, 5], 4.0))
        add_notes(lh, [pitch.Pitch(root_name + "2")], [5], 4.0)
        offset += 4.0
    finalize(sc)

    item_id = f"exercise.open-voicing.{key_slug(tonic)}.{flavour}"
    entry = catalog_entry(
        item_id, title, level,
        ["voicing", f"voicing-{flavour}", "open-voicing", "colour"],
        "both", bpm, "open-voicing",
        {"key": tonic, "flavour": flavour, "intervals": intervals},
        f"scores/generated/{item_id}.mxl",
        tracks=["jazz", "chords-pop", "improv-compose"],
    )
    return sc, entry


#: Boogie left-hand figures: eight eighths a bar as semitones from the chord
#: root, and the fingering that shape is actually played with.
#:
#: The fingering belongs *in* the table. It used to be one constant
#: `[5, 4, 3, 2, 1, 2, 3, 4]` shared by all three, which is right for the two
#: that climb — thumb at the top of the figure, and each finger gets one note —
#: and nonsense for the one that alternates two notes, where it printed the same
#: C under fingers 5, 3 and 1 in the same bar. Nothing could catch it:
#: `add_notes` takes `fingers[i % len(fingers)]`, so a fingering list of the
#: wrong length does not fail, it *repeats*, and one of the right length that
#: describes a different shape does not fail at all.
#:
#: Naming: "pinetop" is Pinetop Smith's figure and every blues method calls it
#: that. The alternating one was called "yancey" here, and it is not — Jimmy
#: Yancey's left hand is a dotted habanera figure, not eight even eighths. It is
#: the plain root-and-fifth alternation, which is the right *first* boogie and
#: is now named for what it is. A learner should not carry away a wrong
#: attribution from a drill title.
BOOGIE_PATTERNS: dict[str, tuple[list[int], list[int], float]] = {
    #                  offsets                        fingers                   level
    "root-fifth":      ([0, 7, 0, 7, 0, 7, 0, 7],     [5, 1, 5, 1, 5, 1, 5, 1], 5.4),
    "pinetop":         ([0, 4, 7, 9, 10, 9, 7, 4],    [5, 4, 3, 2, 1, 2, 3, 4], 6.2),
    "walking-eighths": ([0, 4, 7, 10, 12, 10, 7, 4],  [5, 4, 3, 2, 1, 2, 3, 4], 6.2),
}


#: What each boogie figure is worth over the minor form: one band above its
#: major twin, and literally one band — `BOOGIE_PATTERNS`'s level plus 0.1.
#:
#: The hand already knows the shape; what is new is the form. Where the four
#: arrives is the same, but bars nine and ten are a ♭VI7 and a V7 that are not
#: in the key, the key signature has three or four accidentals the major form
#: did not, and in two of the three figures the third has moved under fingers
#: that were not expecting it.
#:
#: The first draft wrote 6.1 / 6.3 / 6.3 against majors of 5.4 / 6.2 / 6.2,
#: which is a *stage* above for one figure and a band above for the other two,
#: under a comment claiming all three were the same distance. Derived from the
#: major table so the claim and the numbers cannot drift apart again.
BOOGIE_MINOR_LEVELS: dict[str, float] = {
    pattern: round(level + 0.1, 1) for pattern, (_o, _f, level) in BOOGIE_PATTERNS.items()
}


def flatten_the_third(offsets: list[int]) -> list[int]:
    """The same boogie figure over a minor chord.

    Only the third moves. A major third in the bass under a minor seventh is
    not a colour, it is a wrong note, and it is the one interval in these three
    figures that the mode decides. The sixth stays where it is: a minor blues is
    Dorian, and the natural sixth is what makes it one rather than a funeral
    march.

    **`root-fifth` comes back unchanged, and that is correct.** The figure is
    root and fifth alternating; it has no third in it, so there is nothing for
    the mode to move. What separates the minor `root-fifth` study from the major
    one is therefore the key signature and the right hand's shell — a minor
    seventh instead of a dominant — and not one note of the left hand. That is
    worth knowing before somebody "fixes" it: the openness is why this figure is
    the one that works under either mode, and inventing a ♭7 for it would make
    the easiest boogie in the table harder than the two above it.
    """
    return [3 if semitones == 4 else semitones for semitones in offsets]


def make_boogie(
    tonic: str = "C", pattern: str = "pinetop", form: str = "blues", bpm: int = 104,
) -> tuple[stream.Score, dict]:
    """
    A boogie left hand over the first four bars of a blues.

    Eight eighths a bar, the same shape transposed to each chord — which is
    exactly how it is played, and why the exercise is about stamina and the
    shift rather than about reading.

    The four bars come from `TWELVE_BAR` rather than from a literal written
    here, so that there is one statement of the form in this file and not two.
    They were written here once, as `(0, 0, 5, 0)` — a quick change in the
    second bar — while the form everything else used stayed on the one for four
    bars. A learner who practised the boogie and then played the twelve-bar
    shuffle met the move to the four in a different place each time, and nothing
    anywhere named the variant that explains it.

    So this is four bars of the tonic seventh, which is what `TWELVE_BAR` opens
    with, what `blues_forms.DEGREES` writes into the authored shuffle on the
    same rung, and what `blues.4` tells the learner to expect.

    **minor-blues** takes its four bars from `TWELVE_BAR_MINOR` instead, and
    flattens the figure's third to match. Same argument, one form over.
    """
    one_of("form", form, tuple(BLUES_FORMS))
    offsets, fingers, level = BOOGIE_PATTERNS[pattern]
    minor = form == "minor-blues"
    if minor:
        offsets = flatten_the_third(offsets)
        level = BOOGIE_MINOR_LEVELS[pattern]
    title = (f"Minor-blues boogie left hand — {pattern.replace('-', ' ')} "
             f"in {note_name(tonic)} minor" if minor else
             f"Boogie left hand — {pattern.replace('-', ' ')} in {note_name(tonic)}")
    sc, rh, lh = grand_staff(
        title, bpm, ks=minor_key(tonic) if minor else key.Key(tonic))

    bar = 0.0
    for degree, quality in BLUES_FORMS[form][:4]:
        root_name = _transpose_name(tonic, degree)
        add_symbol(rh, _figure(root_name, quality), bar)
        root = pitch.Pitch(root_name + "2")
        add_notes(lh, [up(root, i) for i in offsets], fingers, 0.5)
        # The right hand's shell, looked up rather than written out: a major
        # third over a minor seventh is the fault `triad` was made to stop, and
        # the number 4 was sitting here in plain sight.
        top = pitch.Pitch(root_name + "4")
        rh.append(fingered_chord(
            [top, up(top, triad(quality)[1]), up(top, 10)], [1, 2, 5], 4.0))
        bar += 4.0
    finalize(sc)

    item_id = f"exercise.boogie.{key_slug(tonic)}.{pattern}"
    if minor:
        item_id = f"{item_id}.{form}"
    entry = catalog_entry(
        item_id, title, level,
        ["boogie", "left-hand", "shuffle", f"boogie-{pattern}", "blues",
         *(["minor-blues"] if minor else [])],
        "both", bpm, "boogie",
        {"key": tonic, "pattern": pattern, "form": form, "offsets": offsets},
        f"scores/generated/{item_id}.mxl",
        tracks=["blues-boogie", "jazz"],
    )
    return sc, entry


#: The blues scale, in semitones from the tonic.
#:
#: Six notes and the octave: root, flat third, fourth, flat fifth, fifth, flat
#: seventh. The flat fifth is the whole point of it — it is the note that is not
#: in the minor pentatonic, it is passed through rather than landed on, and a
#: "blues scale" written without it is a minor pentatonic with a different name.
BLUES_SCALE = (0, 3, 5, 6, 7, 10, 12)


def make_blues_scale(
    tonic: str = "C", hands: str = "right", octaves: int = 1, bpm: int = 76,
) -> tuple[stream.Score, dict]:
    """
    The blues scale, up and back.

    `blues.4` names the blues scale as one of the two things it teaches and
    nothing in the generator could write one, so the rung offered a twelve-bar
    form and no scale to play over it.

    **No fingering is printed.** Every other scale family here takes its
    fingering from a published chart — Clementi, by way of
    `content/sources/clementi-op42-fingering.json` — and there is no such chart
    for this one. The choice is between printing a fingering I would be
    inventing and printing none, and `make_scale` already has the answer: it
    marks `fingeringVerified` false and prints nothing rather than guess. A
    wrong fingering on a melodic line is the one error in this file that ships
    silently, because `confirm_fingering` can only see chords.
    """
    one_of("hands", hands, HANDS)
    level = 4.4 if tonic in ("C", "G", "F") else 5.2
    title = f"{note_name(tonic)} blues scale — {octaves} oct, {hands}"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key(tonic))
    rh.insert(0, expressions.TextExpression(
        "The flat fifth is passed through, not landed on"
    ))

    def run(start: pitch.Pitch) -> list[pitch.Pitch]:
        climb = [up(start, 12 * o + i)
                 for o in range(octaves) for i in BLUES_SCALE[:-1]]
        climb.append(by_octaves(start, octaves))
        return climb + list(reversed(climb))[1:]

    rh_p, lh_p = run(pitch.Pitch(tonic + "4")), run(pitch.Pitch(tonic + "3"))
    if hands in ("both", "right"):
        add_notes(rh, rh_p, None, 0.5)
    else:
        silent(rh, 0.5 * len(rh_p))
    if hands in ("both", "left"):
        add_notes(lh, lh_p, None, 0.5)
    else:
        silent(lh, 0.5 * len(lh_p))
    finalize(sc)

    item_id = f"exercise.blues-scale.{key_slug(tonic)}.{octaves}oct.{hands}"
    entry = catalog_entry(
        item_id, title, level,
        ["blues-scale", "blues", "flat-fifth", "improvisation", f"hands:{hands}"],
        hands, bpm, "blues-scale",
        {"key": tonic, "octaves": octaves, "intervals": list(BLUES_SCALE),
         "fingeringVerified": False},
        f"scores/generated/{item_id}.mxl",
        tracks=["blues-boogie", "jazz", "improv-compose"],
    )
    return sc, entry


# --------------------------------------------------------------------------------------
# latin: clave, tumbao and montuno
# --------------------------------------------------------------------------------------
#
# The latin rung teaches three named skills and had nothing that plays any of
# them. Its exercise options were a syncopated rhythm drill, shuffle eighths,
# off-beat comping, a ii-V-I walking bass and ties across the bar line — every
# one of them a general rhythm exercise — and its songs were a twelve-bar blues,
# Greensleeves in 6/8 and Row Row Row Your Boat. A learner could finish the rung
# without meeting a bar of latin music.
#
# The lesson names the order to build it in: clap the clave, play the tumbao
# alone, then add the montuno two notes at a time. These follow it.

#: The clave, as quarter-length offsets across its two bars.
#:
#: Five strokes over two bars, and `latin.md` states them: 3-2 son has the first
#: bar on beat 1, the "and" of 2 and beat 4, and the second bar on beats 2 and 3.
#: Beat 4 of the first bar is offset 3.0, beat 2 of the second is 5.0. 2-3 is the
#: same pattern with the bars swapped, not a different rhythm.
#:
#: The rumba differs from the son by one stroke — the third, delayed by an
#: eighth from beat 4 to the "and" of 4 — and that single eighth is the whole
#: argument between them, which is why both are written out rather than one
#: being derived from the other.
#: The bossa is the fifth row and it has no 3-2 / 2-3 pair, which is why its
#: name is one word: a bossa is played one way round and a chart does not say
#: which. Two of the latin rung's six songs are bossas and `CLAVE_PATTERNS` had
#: son and rumba only, so the rung could not clap either of them.
#:
#: It is the son with its last stroke delayed by one eighth, from beat 3 of the
#: second bar to the "and" of 3 — one stroke's difference from the son, exactly
#: as the rumba is one stroke from the son in the *first* bar. (This row was
#: `[…, 7.0]` until a review, 2026-09-18: that moved the stroke a whole beat, to
#: beat 4, which is no standard clave — the bossa's delay is the eighth.) The first draft of this
#: row was `[0.0, 1.5, 4.0, 5.5, 7.0]`, which put a stroke on the downbeat of
#: both bars and only two strokes in the first: a clave has a three-side and a
#: two-side, and that is not either of them. `TestTheBossaAndThePulse` now
#: refuses a row with both downbeats struck, because a pattern that plays the
#: top of both bars has stopped being a clave whatever it is called.
CLAVE_PATTERNS: dict[str, list[float]] = {
    "son-3-2":   [0.0, 1.5, 3.0, 5.0, 6.0],
    "son-2-3":   [1.0, 2.0, 4.0, 5.5, 7.0],
    "rumba-3-2": [0.0, 1.5, 3.5, 5.0, 6.0],
    "rumba-2-3": [1.0, 2.0, 4.0, 5.5, 7.5],
    "bossa":     [0.0, 1.5, 3.0, 5.0, 6.5],
}

#: A bossa is comped **on the clave**, so the comping table reads the clave
#: table rather than restating it.
#:
#: The first draft wrote `[0.0, 1.5, 3.0, 4.5]` here — an even stroke every
#: three eighths, which is a plausible-looking figure and not the rhythm of any
#: bossa. Two statements of one fact, and they disagreed within a week of each
#: other; it is the same fault that had the boogie playing different twelve bars
#: from the table it was supposed to follow. One object, both tables.
COMPING_PATTERNS["bossa"] = CLAVE_PATTERNS["bossa"]


def clave_words(pattern: str) -> tuple[str, str]:
    """A clave's style and its side, where it has one.

    `pattern.split("-", 1)` unpacked into two names for as long as every row
    was `<style>-<side>`, and the moment one was not it raised on a line whose
    only job was writing a title.
    """
    style, _, side = pattern.partition("-")
    return style, side


#: The bass tumbao, as offsets in one bar.
#:
#: `latin.md`: "not on beat one ... hits the 'and' of two and beat four, leaving
#: the downbeat empty, which is why Latin music feels like it is leaning
#: forward". The note on four is the root of the *next* chord, not this one —
#: the anticipation is the figure, and a tumbao that waits for the barline to
#: change chord is not a tumbao.
TUMBAO_OFFSETS = (1.5, 3.0)

#: A two-chord vamp to practise all three over, as (semitones from the tonic,
#: quality) a bar at a time. i - iv in the minor, which is what most of the
#: standard son and salsa repertoire sits on.
LATIN_VAMP = ((0, "m"), (5, "m"))


def one_line_staff(
    part_id: str, bpm: int | None = None, staff: int = 1,
) -> stream.PartStaff:
    """
    A single-line percussion staff, for the families whose subject is timing.

    The clef's `line` is set, and it has to be. Left at music21's default of
    `None` a single-staff export omits `<line>` entirely, which is valid — but
    the moment two of these are joined into one two-staff part, music21's
    `joinPartStaffs` writes `<line />` **empty** on the second clef, which is
    not. One line on the staff, so the clef sits on line 1 and the file says so.

    `<staff-details>` is written once, without a `number`, and that is also
    correct: MusicXML reads an un-numbered `staff-details` as applying to every
    staff in the part, and both staves here have one line. music21 cannot write
    the `number` attribute at all — its exporter carries a TODO for it — so
    relying on the default is the only option and is the right one.
    """
    part = stream.PartStaff(id=part_id)
    part.insert(0, instrument.Piano())
    percussion = clef.PercussionClef()
    percussion.line = 1
    part.insert(0, percussion)
    part.insert(0, meter.TimeSignature("4/4"))
    part.insert(0, layout.StaffLayout(staffLines=1, staffNumber=staff))
    if bpm is not None:
        part.insert(0, tempo.MetronomeMark(number=bpm))
    return part


def make_clave(
    pattern: str = "son-3-2", bars: int = 8, bpm: int = 88, with_pulse: bool = False,
) -> tuple[stream.Score, dict]:
    """
    The clave on one line, to be clapped.

    One line and one pitch for the same reason `make_rhythm` uses them: the
    timing is the whole exercise. Eight bars rather than four because the clave
    is a *two*-bar unit and the lesson's common mistake is counting it as two
    separate bars — four repetitions make that audible.

    **with_pulse** puts quarter notes on a second line underneath. `latin.md`
    says "clap it for a week" and then admits "the app cannot clap a clave
    behind you", so the clave alone is a rhythm nothing can mark: played on its
    own, a learner who drifts a sixteenth early for eight bars is still playing
    the pattern. Against a pulse in the other hand the drift has something to be
    wrong against, which is what makes it an exercise rather than a picture of
    one. The pulse is the beat, which is the easiest second part there is, and
    it is a band above the clave alone because it is still a second part.
    """
    one_of("pattern", pattern, tuple(CLAVE_PATTERNS))
    offsets = CLAVE_PATTERNS[pattern]
    style, side = clave_words(pattern)
    label = " ".join(word for word in (style, "clave", side) if word)
    # Levelled against the core path's own rhythm ladder (2026-09-17): quarters
    # and rests 1.1, mixed values 1.2, 3/4 at 1.4, eighths 2.2, dotted rhythms
    # 2.4, 6/8 at 4.5. A clave is five strokes on one note — one hand, nothing to
    # read but the rhythm — so it sits just past the dotted rhythms it is harder
    # than, and nowhere near 6/8. Against a pulse it becomes two parts at once,
    # which is a different and genuinely later skill.
    level = 3.6 if with_pulse else 2.8
    name = " ".join(word for word in (style, side) if word)
    title = f"Clave — {name}" + (" over a quarter-note pulse" if with_pulse else "")
    sc = stream.Score()
    sc.metadata = metadata.Metadata()
    sc.metadata.title = title
    sc.metadata.composer = "PianoPath (generated)"

    # "Rhythm" while there is one staff, so the four claves that already ship
    # keep the part id they were engraved with and the render manifest does not
    # re-do them; "RH"/"LH" when there are two, which is what every other
    # two-staff score in this file calls them.
    part = one_line_staff("RH" if with_pulse else "Rhythm", bpm, staff=1)
    part.insert(0, expressions.TextExpression(
        "The left hand is the beat. The clave is not on it, and that is the point"
        if with_pulse else
        "One two-bar unit, not two bars — clap it until it stops needing counting"
    ))

    # One bar at a time, so nothing crosses a barline.
    #
    # Written as two bars' worth in one pass, the rest between the third stroke
    # and the fourth is 1.5 long and starts at 3.5 — `makeMeasures` puts a whole
    # element in the bar it begins in, so the first bar came out holding five
    # quarters and the second four. The strokes were still at the right offsets,
    # which is why a test on their offsets passed: what was wrong was the
    # barring, and the learner counting the bar is exactly who that breaks.
    for repetition in range(bars // 2):
        for bar in range(2):
            cursor = 0.0
            for hit in offsets:
                within = hit - 4.0 * bar
                if not 0.0 <= within < 4.0:
                    continue
                if within > cursor:
                    part.append(note.Rest(quarterLength=within - cursor))
                    cursor = within
                part.append(note.Note("B4", quarterLength=0.5))
                cursor += 0.5
            if cursor < 4.0:
                part.append(note.Rest(quarterLength=4.0 - cursor))
    part.makeMeasures(inPlace=True)
    sc.insert(0, part)
    if with_pulse:
        pulse = one_line_staff("LH", staff=2)
        for _ in range(bars * 4):
            pulse.append(note.Note("B4", quarterLength=1.0))
        pulse.makeMeasures(inPlace=True)
        sc.insert(0, pulse)
        sc.insert(0, layout.StaffGroup(
            [part, pulse], name="Percussion", abbreviation="Perc.", symbol="brace"))

    item_id = f"exercise.clave.{pattern}" + (".pulse" if with_pulse else "")
    entry = catalog_entry(
        item_id, title, level,
        ["clave", label, "latin", "syncopation",
         # The son and the rumba come in a 3-2 and a 2-3 and this tag is what a
         # learner searches to compare them. A bossa has neither side, so it
         # does not carry a tag about choosing between them.
         *(["two-three-and-three-two"] if side else []),
         *(["pulse", "coordination"] if with_pulse else [])],
        "both" if with_pulse else "right", bpm, "clave",
        {"pattern": pattern, "offsets": offsets, "bars": bars, "withPulse": with_pulse},
        f"scores/generated/{item_id}.mxl",
        tracks=["latin", "theory-ear"],
    )
    return sc, entry


def vamp_plan(bars: int) -> list[tuple[int, str]]:
    """The chord of each bar, for `bars` bars of the vamp."""
    return [LATIN_VAMP[i % len(LATIN_VAMP)] for i in range(bars)]


def write_tumbao(lh: stream.PartStaff, tonic: str, plan: list[tuple[int, str]]) -> None:
    """
    One bar of tumbao per entry in `plan`, appended to `lh`.

    Extracted so the figure exists once. `make_tumbao` teaches it alone and
    `make_latin_groove` puts it under the montuno, and if the two ever wrote it
    out separately they would eventually disagree — which is how a boogie came
    to play different bars from the twelve-bar table it was supposed to follow.
    """
    for index, (degree, _quality) in enumerate(plan):
        root = pitch.Pitch(_transpose_name(tonic, degree) + "2")
        # The chord the *next* bar turns into, which is the note beat four takes.
        nxt_degree, _nxt = plan[(index + 1) % len(plan)]
        nxt_root = pitch.Pitch(_transpose_name(tonic, nxt_degree) + "2")
        # The downbeat is empty only in the first bar: from the second on it
        # is covered by the note beat four started, held through the barline
        # to the next figure — the anticipation *is* the tumbao, and a note
        # that stopped at the barline left the next bar opening with the
        # rest the style is built on not having. `finalize` ties it across.
        if index == 0:
            lh.append(note.Rest(quarterLength=TUMBAO_OFFSETS[0]))
        add_notes(lh, [up(root, 7)], [2], TUMBAO_OFFSETS[1] - TUMBAO_OFFSETS[0] - 0.5)
        lh.append(note.Rest(quarterLength=0.5))
        last = index == len(plan) - 1
        add_notes(lh, [nxt_root], [5], 1.0 if last else 1.0 + TUMBAO_OFFSETS[0])


def write_montuno(rh: stream.PartStaff, tonic: str, offsets: list[float],
                  voices: int, repetitions: int) -> None:
    """
    The guajeo on the clave's own strokes, appended to `rh`, two bars at a time.

    Same reason as `write_tumbao`: one copy of the figure. The attacks are
    `offsets` and nothing else, because playing against the clave is the one
    error `latin.md` calls unmistakable.
    """
    for _ in range(repetitions):
        cursor = 0.0
        for hit in offsets:
            degree, quality = LATIN_VAMP[int(hit // 4.0) % len(LATIN_VAMP)]
            root = pitch.Pitch(_transpose_name(tonic, degree) + "4")
            tones = [up(root, i) for i in triad({"m": "minor", "maj": "major"}[quality])]
            voiced = tones[1:] if voices == 2 else [tones[1], tones[2], up(root, 12)]
            if hit > cursor:
                rh.append(note.Rest(quarterLength=hit - cursor))
                cursor = hit
            rh.append(fingered_chord(voiced, [1, 3, 5][: len(voiced)], 0.5))
            cursor += 0.5
        if cursor < 8.0:
            rh.append(note.Rest(quarterLength=8.0 - cursor))


def write_vamp_symbols(rh: stream.PartStaff, tonic: str, plan: list[tuple[int, str]]) -> None:
    """
    The chord symbols, inserted last.

    `add_symbol` inserts at an absolute offset, which moves the part's end to
    that offset, so anything appended afterwards starts from there — the first
    draft of these makers wrote its notes into bar four.
    """
    for index, (degree, quality) in enumerate(plan):
        add_symbol(rh, _figure(_transpose_name(tonic, degree), quality), 4.0 * index)


def make_tumbao(tonic: str = "C", bars: int = 8, bpm: int = 88) -> tuple[stream.Score, dict]:
    """
    The bass tumbao alone, over a two-bar vamp.

    Left hand only, because the lesson says to play it alone before anything is
    added to it. Silence on the downbeat, the fifth on the "and" of two, and the
    root of the next chord on beat four — the chord arrives an eighth-note early
    and stays through the barline, which is the anticipation the style is built
    on.
    """
    level = 5.2
    title = f"Tumbao — latin bass in {note_name(tonic)} minor"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key(tonic.lower()))
    rh.insert(0, expressions.TextExpression(
        "Nothing on beat one. The note on four belongs to the next bar's chord"
    ))

    plan = vamp_plan(bars)
    write_tumbao(lh, tonic, plan)
    silent(rh, 4.0 * bars)
    write_vamp_symbols(rh, tonic, plan)
    finalize(sc)

    item_id = f"exercise.tumbao.{key_slug(tonic)}"
    entry = catalog_entry(
        item_id, title, level,
        ["tumbao", "latin", "left-hand", "syncopation", "anticipation"],
        "left", bpm, "tumbao",
        {"key": tonic, "offsets": list(TUMBAO_OFFSETS), "bars": bars},
        f"scores/generated/{item_id}.mxl",
        tracks=["latin", "chords-pop"],
    )
    return sc, entry


def make_montuno(
    tonic: str = "C", voices: int = 2, clave: str = "son-3-2", bpm: int = 88,
) -> tuple[stream.Score, dict]:
    """
    The right-hand montuno, locked to the clave.

    A guajeo is chord tones on the clave's own strokes, repeated without
    variation for as long as the section lasts — the lesson's phrase is that
    "its virtue is that it does not change". So the rhythm here *is*
    `CLAVE_PATTERNS`, not a rhythm that resembles it: if the two ever disagree
    the exercise teaches a learner to play against the clave, which the lesson
    calls the one unmistakable error in the style.

    `voices` is 2 or 3 because the lesson says to add the montuno two notes at a
    time. Two notes is the third and the fifth; three adds the octave above the
    root.
    """
    one_of("clave", clave, tuple(CLAVE_PATTERNS))
    if voices not in (2, 3):
        raise ValueError(f"voices={voices!r}: the montuno is built two or three notes at a time")
    offsets = CLAVE_PATTERNS[clave]
    level = 5.6 if voices == 2 else 6.2
    title = f"Montuno — {voices} notes on {clave.replace('-', ' ')} in {note_name(tonic)} minor"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key(tonic.lower()))
    rh.insert(0, expressions.TextExpression(
        "Every note is a clave stroke. It repeats without changing"
    ))

    # The vamp is a bar a chord; the clave is two bars. Four bars is two claves
    # and two turns of the vamp, which is the smallest unit where both line up.
    write_montuno(rh, tonic, offsets, voices, repetitions=2)
    silent(lh, 16.0)
    write_vamp_symbols(rh, tonic, vamp_plan(4))
    finalize(sc)

    item_id = f"exercise.montuno.{key_slug(tonic)}.{voices}note.{clave}"
    entry = catalog_entry(
        item_id, title, level,
        ["montuno", "latin", "right-hand", "clave", "syncopation"],
        "right", bpm, "montuno",
        {"key": tonic, "voices": voices, "clave": clave, "offsets": offsets},
        f"scores/generated/{item_id}.mxl",
        tracks=["latin", "chords-pop"],
    )
    return sc, entry


def make_latin_groove(
    tonic: str = "C", clave: str = "son-3-2", bpm: int = 88,
) -> tuple[stream.Score, dict]:
    """
    Tumbao and montuno together — what the rung asks you to be able to do.

    `latin.md` ends "Tumbao in the left hand and a two-note montuno in the
    right, together, for sixteen bars, with the clave audible in your head", and
    until this existed there was nothing in the app where both hands play at
    once. Every other rung has something to practise its own target on.

    The lesson also says this is the hardest coordination in the app, and the
    reason is worth stating: neither hand is on the beat. The left is on the
    "and" of two and on four, the right is on the clave, and the two coincide
    only on the first stroke of the 3-side. There is no downbeat anywhere to
    hold on to, which is exactly why it is built last and two notes at a time.

    Eight bars: four turns of the vamp and four claves. Sixteen is the target to
    hold, not the length of the page — a groove is repeated, and a page that
    ends is a page you stop at.
    """
    one_of("clave", clave, tuple(CLAVE_PATTERNS))
    level = 6.4
    offsets = CLAVE_PATTERNS[clave]
    title = (f"Latin groove — tumbao and montuno on {clave.replace('-', ' ')} "
             f"in {note_name(tonic)} minor")
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key(tonic.lower()))
    rh.insert(0, expressions.TextExpression(
        "Neither hand is on the beat. Left hand alone first, then two notes on top"
    ))

    bars = 8
    plan = vamp_plan(bars)
    write_montuno(rh, tonic, offsets, voices=2, repetitions=bars // 2)
    write_tumbao(lh, tonic, plan)
    write_vamp_symbols(rh, tonic, plan)
    finalize(sc)

    item_id = f"exercise.latin-groove.{key_slug(tonic)}.{clave}"
    entry = catalog_entry(
        item_id, title, level,
        ["tumbao", "montuno", "clave", "latin", "coordination", "syncopation"],
        "both", bpm, "latin-groove",
        {"key": tonic, "clave": clave, "offsets": offsets, "bars": bars},
        f"scores/generated/{item_id}.mxl",
        tracks=["latin", "chords-pop"],
    )
    return sc, entry


# --------------------------------------------------------------------------------------
# the mini-modules: holiday, hymns-gospel and rock-metal
# --------------------------------------------------------------------------------------
#
# Three tracks whose lessons name a device in words and had nothing that played
# it. `holiday` tells a learner to "play the last four bars of the tune before
# you start" and offered no vamp; `hymns` names the walk-up and the passing
# chord as its two gospel devices and offered a descending slash bass, which is
# neither; `rock.overview` names five textures and `concepts.json` has carried
# `ostinato` and `eighth-note-ostinato` with nothing behind either id.
#
# Everything here is small and none of it is a new idea — they are the figures
# the lessons already describe, written down so a hand can practise one.


def make_intro(tonic: str = "C", bars: int = 4, bpm: int = 76) -> tuple[stream.Score, dict]:
    """
    A four-bar vamp introduction, over the loop every pop song is made of.

    "Play the last four bars of the tune before you start" is the whole of the
    holiday rung's *how you'll know you've got it*, and there was nothing to
    practise it on. The chords are `FOUR_CHORD_LOOP` — the last four bars of a
    song built on it are the loop — with the left hand on the root and the right
    breaking the chord, which is what a vamp is: a figure that keeps time while
    nothing has started yet.

    The last bar blocks the chord instead of breaking it, because an
    introduction's job is to hand over. A vamp that goes on breaking chords past
    the end of the fourth bar has not introduced anything.

    **Reachable through `four-chord-loop`**, which `holiday` and `chords-pop.6` teach, until a rung
    names this item in its `exerciseOptions`. That is the only route to it:
    `alternativesFor` offers an exercise on a rung only when it shares a concept
    with something already there *and* sits within half a level of it.
    """
    from music21 import expressions

    level = 3.4
    title = f"Four-bar introduction in {note_name(tonic)} — the vamp before the tune"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key(tonic))
    rh.insert(0, expressions.TextExpression(
        "Four bars, then the tune. The last bar hands over — do not vamp through it"
    ))

    for index in range(bars):
        degree, quality = FOUR_CHORD_LOOP[index % len(FOUR_CHORD_LOOP)]
        root_name = _transpose_name(tonic, degree)
        # The symbol before the bar it names, never after: `confirm` reads the
        # last symbol it saw, so a symbol filed in behind its own chord hands
        # the chord to the previous bar's harmony to be judged against.
        add_symbol(rh, _figure(root_name, quality), 4.0 * index)
        base = pitch.Pitch(root_name + "4")
        tones = [up(base, i) for i in chord_shape(quality)]
        if index == bars - 1:
            rh.append(fingered_chord(tones, [1, 3, 5], 4.0))
        else:
            # Low, middle, high, middle — the broken-chord shape unit 3.6
            # teaches, so this is a figure the hand has already met.
            for tone, finger in zip(
                [tones[0], tones[1], tones[2], tones[1]], [1, 3, 5, 3]
            ):
                n = note.Note(pitch.Pitch(tone.nameWithOctave), quarterLength=1.0)
                n.articulations.append(articulations.Fingering(finger))
                rh.append(n)
        add_notes(lh, [pitch.Pitch(root_name + "2")], [5], 4.0)
    finalize(sc)

    item_id = f"exercise.intro.{key_slug(tonic)}.{bars}bar"
    entry = catalog_entry(
        item_id, title, level,
        ["four-chord-loop", "chord-progression", "I-V-vi-IV", "broken-chord",
         "intro", "form"],
        "both", bpm, "progression",
        {"key": tonic, "progression": ["I", "V", "vi", "IV"], "bars": bars,
         "shape": "vamp introduction"},
        f"scores/generated/{item_id}.mxl",
        tracks=["chords-pop", "holiday", "core"],
    )
    return sc, entry


#: The chromatic walk-up's passing note, in semitones above the tonic.
#:
#: The flat third between the second and the third degree: C–D–E♭–E–F in C. It
#: is the one note that separates the gospel walk-up from the diatonic one, and
#: it is a blue note, not a modulation — the chord above it does not move.
WALKUP_CHROMATIC = (0, 2, 3, 4)
#: And the diatonic walk, which takes three beats and holds the first.
WALKUP_DIATONIC = (0, 2, 4)


def make_walkup(tonic: str = "C", bpm: int = 69) -> tuple[stream.Score, dict]:
    """
    The bass walking *into* the next chord — diatonic, then chromatic.

    `hymns` is titled "Four-part texture and walk-ups" and names this as its
    first gospel device. The nearest thing the generator had was
    `make_slash_bass`, which walks a bass *down* under a chord that does not
    change — the opposite motion, under the opposite harmony.

    Two two-bar phrases, and the pair is the exercise: the same walk from I to
    IV, once inside the key and once through the note between. Playing either
    one is easy; hearing which one a record is doing is the skill.

    The fingering is printed on every note, because it is the whole difficulty:
    the hand starts on the little finger and arrives on the thumb, and a hand
    that starts anywhere else runs out of fingers before it runs out of walk.

    **Reachable through `passing-chords`**, which `hymns` teaches, until a rung
    names this item in its `exerciseOptions`. That is the only route to it:
    `alternativesFor` offers an exercise on a rung only when it shares a concept
    with something already there *and* sits within half a level of it.
    """
    from music21 import expressions

    level = 4.6
    title = f"Walk-ups in {note_name(tonic)} — diatonic, then chromatic"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key(tonic))
    rh.insert(0, expressions.TextExpression(
        "The same walk twice: inside the key, then through the note between"
    ))

    # (the walk, the length of each of its notes) — the diatonic walk is three
    # notes in a bar of four, so its first note is held.
    walks = ((WALKUP_DIATONIC, (2.0, 1.0, 1.0)), (WALKUP_CHROMATIC, (1.0, 1.0, 1.0, 1.0)))
    start = pitch.Pitch(_transpose_name(tonic, 0) + "2")
    bar = 0
    for walk, lengths in walks:
        fingers = [5, 4, 3, 2][:len(walk)]
        for semitones, length, finger in zip(walk, lengths, fingers):
            n = note.Note(up(start, semitones), quarterLength=length)
            n.articulations.append(articulations.Fingering(finger))
            lh.append(n)
        # The bar the walk was going to: the subdominant, taken by the thumb.
        add_notes(lh, [up(start, 5)], [1], 4.0)
        # The right hand holds the harmony so the walk is heard against it.
        # Symbol first, then the chord it names — see `add_symbol`.
        #
        # Over the chromatic walk the tonic chord drops its third and holds the
        # bare fifth. The passing note in the bass is the flat third, and a
        # major third sounding above it for a whole bar is not a blue note, it
        # is both thirds of the same chord at once — which is the one thing
        # `confirm` calls a wrong note when it can see it, and it cannot see it
        # here because the two are in different hands. Gospel players leave the
        # third out for exactly this reason: the bass is borrowing it.
        for degree in (0, 5):
            root_name = _transpose_name(tonic, degree)
            add_symbol(rh, _figure(root_name, "maj"), 4.0 * bar)
            base = pitch.Pitch(root_name + "4")
            root, third, fifth = triad("major")
            # The bar the flat third passes through, and only that one.
            borrowed = degree == 0 and third - 1 in walk
            rungs = (root, fifth) if borrowed else (root, third, fifth)
            fingers = [1, 5] if borrowed else [1, 3, 5]
            rh.append(fingered_chord([up(base, i) for i in rungs], fingers, 4.0))
            bar += 1
    finalize(sc)

    item_id = f"exercise.walkup.{key_slug(tonic)}"
    entry = catalog_entry(
        item_id, title, level,
        ["passing-chords", "bass-line", "walk-up", "chromatic", "voice-leading"],
        "both", bpm, "walking-bass",
        {"key": tonic, "diatonic": list(WALKUP_DIATONIC),
         "chromatic": list(WALKUP_CHROMATIC), "shape": "ascending walk into the IV"},
        f"scores/generated/{item_id}.mxl",
        tracks=["hymns-gospel", "chords-pop", "core"],
    )
    return sc, entry


#: The half-step approach, as (target degree, its quality). The approach chord
#: is the same quality a semitone above, which is what makes it an approach and
#: not a substitution: nothing about the harmony changes except when it arrives.
PASSING_TARGETS = ((2, "m7"), (7, "7"))


def make_passing_chord(tonic: str = "C", bpm: int = 72) -> tuple[stream.Score, dict]:
    """
    The chord a semitone above the one you meant, played first.

    `hymns`'s second gospel device, and the cheapest reharmonisation there is:
    take the chord you are going to, move the whole shape up a semitone, play it
    for half a bar, and slide down into it. The hand does not learn a new voicing
    — it learns to arrive late on purpose.

    Four bars: the tonic, then the ii approached from above, then the V
    approached from above, then home. The bass is the audible part — C, E♭–D,
    A♭–G, C — and it is the reason this is filed under `passing-chords` rather
    than under substitution: the approach chord passes, it does not replace.

    **Reachable through `passing-chords`**, which `hymns` teaches, until a rung
    names this item in its `exerciseOptions`. That is the only route to it:
    `alternativesFor` offers an exercise on a rung only when it shares a concept
    with something already there *and* sits within half a level of it.
    """
    level = 5.4
    title = f"Passing chords in {note_name(tonic)} — the half-step approach"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key(tonic))

    def voiced(root_name: str, quality: str, at: float, length: float) -> None:
        """One chord: its symbol, its shell, and the bass note under it.

        The symbol goes in *before* the chord, at the offset the right hand has
        already reached — the first of the two orders `add_symbol` describes,
        and here it is load-bearing: `confirm` judges a chord against the last
        symbol it saw, so a symbol filed in afterwards leaves its own chord to
        be checked against the previous one, and a shell of G7 read as a Dm7 has
        no seventh in it.
        """
        add_symbol(rh, _figure(root_name, quality), at)
        base = pitch.Pitch(root_name + "4")
        shape = SEVENTH_VOICINGS["shell"][quality]
        rh.append(fingered_chord([up(base, i) for i in shape], [1, 2, 5], length))
        add_notes(lh, [pitch.Pitch(root_name + "2")], [5], length)

    voiced(_transpose_name(tonic, 0), "maj7", 0.0, 4.0)
    offset = 4.0
    for degree, quality in PASSING_TARGETS:
        # A semitone above the target, same quality: the approach. Its root is
        # spelled for its own notes rather than for the key it is borrowed into
        # — in E flat that is F sharp minor 7 and not G flat minor 7, whose
        # third is a B double flat.
        voiced(chart_root(_transpose_name(tonic, degree + 1), quality), quality,
               offset, 2.0)
        voiced(_transpose_name(tonic, degree), quality, offset + 2.0, 2.0)
        offset += 4.0
    voiced(_transpose_name(tonic, 0), "maj7", offset, 4.0)
    finalize(sc)

    item_id = f"exercise.passing-chord.{key_slug(tonic)}"
    entry = catalog_entry(
        item_id, title, level,
        ["passing-chords", "chromatic-approach", "reharmonisation", "voice-leading",
         "seventh-chord"],
        "both", bpm, "progression",
        {"key": tonic, "progression": ["Imaj7", "bIIIm7", "iim7", "bVI7", "V7", "Imaj7"],
         "approach": "a semitone above, same quality"},
        f"scores/generated/{item_id}.mxl",
        tracks=["hymns-gospel", "chords-pop", "jazz"],
    )
    return sc, entry


#: The four bars a power chord is practised over, as semitones from the tonic.
#:
#: i – ♭VII – ♭VI – ♭VII, the Aeolian loop that half of rock is built on. The
#: chords have no third in them, so the mode is carried entirely by where the
#: roots go, which is the other half of why this is worth an exercise.
POWER_CHORD_ROOTS = (0, 10, 8, 10)


def make_power_chord(tonic: str = "A", bpm: int = 92) -> tuple[stream.Score, dict]:
    """
    Root, fifth, octave — with weight.

    `rock.overview` names five textures and this is the one with no exercise
    anywhere. A power chord is not a hard chord to find and it is a hard chord
    to *play*: the sound is arm weight landing on a shape the hand is already
    holding, and a learner who plays it with the fingers gets a thin, clattery
    noise and no idea why.

    So the left hand drives eighths and the right hand marks one and three, and
    the only instruction on the page is about where the sound comes from. The
    shape never changes; there is nothing to read after the first bar. That is
    deliberate — this is a weight exercise wearing a chord's clothes.

    **Reachable through `open-voicings`**, which `rock.overview` teaches, until a rung
    names this item in its `exerciseOptions`. That is the only route to it:
    `alternativesFor` offers an exercise on a rung only when it shares a concept
    with something already there *and* sits within half a level of it.
    """
    from music21 import dynamics as m21dynamics
    from music21 import expressions

    # Levelled against the core path (2026-09-17). There is nothing to read after
    # the first bar and the shape never changes, so the reading load is lower than
    # the C-F-G triads of core 2.3; what makes it harder than those is the octave
    # span and the stamina of continuous eighths, which is core 2.2. It was 4.1
    # because it was written beside the open-voicing families and took their band.
    level = 2.8
    title = f"Power chords in {note_name(tonic)} minor — root, fifth, octave"
    sc, rh, lh = grand_staff(title, bpm, ks=minor_key(tonic))
    rh.insert(0, expressions.TextExpression(
        "Weight from the arm, not the fingers. The hand keeps its shape"
    ))
    rh.insert(0, m21dynamics.Dynamic("ff"))

    for degree in POWER_CHORD_ROOTS:
        root_name = _transpose_name(tonic, degree)
        bass = pitch.Pitch(root_name + "2")
        tones = [bass, up(bass, 7), up(bass, 12)]
        for _ in range(8):
            lh.append(fingered_chord(tones, [5, 2, 1], 0.5))
        top = [by_octaves(t, 2) for t in tones]
        for _ in range(2):
            marked = fingered_chord(top, [1, 2, 5], 2.0)
            marked.articulations.append(articulations.Accent())
            rh.append(marked)
    # Both staves are written straight through above, so the symbols go in last
    # — the second of the two orders `add_symbol` describes.
    for index, degree in enumerate(POWER_CHORD_ROOTS):
        add_power_symbol(rh, _transpose_name(tonic, degree), 4.0 * index)
    finalize(sc)

    item_id = f"exercise.power-chord.{key_slug(tonic)}"
    entry = catalog_entry(
        item_id, title, level,
        ["power-chord", "fifths", "open-voicings", "modal-minor", "left-hand"],
        "both", bpm, "open-voicing",
        {"key": tonic, "intervals": [0, 7, 12], "progression": ["i", "bVII", "bVI", "bVII"]},
        f"scores/generated/{item_id}.mxl",
        tracks=["rock-metal", "technique", "chords-pop"],
    )
    return sc, entry


#: The ostinato figures, as (eight eighths in semitones above the tonic, the
#: fingering that shape is played with, level).
#:
#: Both are minor: `rock.overview` teaches the modal minor and an ostinato over
#: a pedal bass is where that sound comes from. `fifths` is the open one — no
#: third at all, so it will sit under any chord the other hand finds. `arpeggio`
#: names the mode and is a wider reach, which is the whole difference between
#: them and the reason they are two rows and not two makers.
#: Levelled against the core path rather than against the other genre families
#: (2026-09-17). An ostinato over a held bass is *exactly* what core 2.1 teaches —
#: "the left hand holds, the right hand moves" — in eighths, which is 2.2. So the
#: root-and-fifth figure belongs beside those rungs and not two stages above them;
#: it was 4.4 because it was written next to the boogie families and took their
#: band. The arpeggio form is a wider span and a real minor triad broken across
#: four notes, which is core 3.3's material.
OSTINATO_SHAPES: dict[str, tuple[list[int], list[int], float, str]] = {
    "fifths":   ([0, 7, 0, 7, 0, 7, 0, 7], [1, 5, 1, 5, 1, 5, 1, 5], 2.6,
                 "root and fifth"),
    "arpeggio": ([0, 3, 7, 12, 7, 3, 0, 3], [1, 2, 3, 5, 3, 2, 1, 2], 3.4,
                 "broken minor triad"),
}


#: The riff cells, as scale degrees of a five-finger position and the fingering
#: that plays them without moving the hand. Each is two bars of quarters and a
#: half — a hook, not a scale — and each repeats, because repeating is what makes
#: a figure a riff rather than a phrase.
#:
#: Both positions are **all white keys**: C-D-E-F-G is core 1.1's own position,
#: and A-B-C-D-E is the same five fingers a third lower and is naturally minor,
#: which is where the rock character comes from. A riff that needed a black key
#: would need a hand position core Stage 1 has not taught.
#: The cell names say what the *shape* does and not what mode it is in, because
#: the same degrees are read against a major position in C and a minor one in A:
#: a cell called "minor" would be a lie in half the keys it is generated in.
RIFF_CELLS: dict[str, tuple[list[int], list[float], list[int], str]] = {
    "falling":  ([0, 0, 2, 3, 2, 0], [1, 1, 1, 1, 1, 2], [1, 1, 3, 4, 3, 1],
                 "the hook falls back to where it started"),
    "rocking":  ([0, 4, 0, 4, 3, 2, 0], [1, 1, 1, 0.5, 0.5, 1, 2], [1, 5, 1, 5, 4, 3, 1],
                 "two notes rocking, then a walk home"),
}


def make_riff(
    tonic: str = "A", cell: str = "minor-hook", bars: int = 8, bpm: int = 76,
) -> tuple[stream.Score, dict]:
    """
    A figure in a five-finger position, repeated until it is a riff.

    The earliest genre material the app can honestly offer. Core 1.1 teaches one
    finger per key in a fixed position and quarter notes; this is that, and
    nothing more — but arranged so the repetition is the point, which is the one
    idea a riff has and the reason rock is playable long before rock repertoire
    is readable.

    Written in **A** it is the natural minor five-finger position, all white
    keys, and it sounds like the thing it is imitating. Written in **C** it is
    core 1.1's own position exactly. There is no accidental in either, because a
    Stage 1 hand does not move.

    The right hand plays alone. A left hand under this would make it core 2.1's
    exercise, which already exists as `make_ostinato`.
    """
    one_of("cell", cell, tuple(RIFF_CELLS))
    degrees, rhythm, fingers, blurb = RIFF_CELLS[cell]
    minor = tonic == "A"
    # A-B-C-D-E and C-D-E-F-G are the two five-finger positions with no black key
    # in them; the degree table is read against whichever was asked for.
    steps = [0, 2, 3, 5, 7] if minor else [0, 2, 4, 5, 7]
    level = 1.3 if cell == "falling" else 1.6
    quality = "minor" if minor else "major"
    title = f"Riff in {note_name(tonic)} {quality} — {blurb}"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key(tonic if not minor else tonic.lower()))
    base = pitch.Pitch(tonic + "4")

    # Whole cells only, and enough of them to fill the bars asked for rather than
    # to fall just short: a riff that stops mid-figure is a phrase that was cut
    # off. `bars` is therefore a floor, and the score is as many complete cells
    # as cover it.
    cell_beats = sum(rhythm)
    repeats = max(2, -(-(bars * 4) // int(cell_beats)) if float(cell_beats).is_integer()
                  else max(2, int((bars * 4) // cell_beats) + 1))
    for _ in range(repeats):
        for degree, ql, finger in zip(degrees, rhythm, fingers):
            n = note.Note(base.transpose(steps[degree]), quarterLength=ql)
            n.articulations.append(articulations.Fingering(finger))
            rh.append(n)
    lh.append(note.Rest(quarterLength=repeats * cell_beats))
    rh.insert(0, expressions.TextExpression(
        "Keep the hand still"
    ))
    finalize(sc)

    item_id = f"exercise.riff.{key_slug(tonic)}.{cell}"
    entry = catalog_entry(
        item_id, title, level,
        ["riff", "ostinato", "five-finger", "repetition", f"hands:right"],
        "right", bpm, "five-finger", {"key": tonic, "cell": cell},
        f"scores/generated/{item_id}.mxl",
        tracks=["rock-metal", "core", "improv-compose"],
    )
    return sc, entry


#: The two scales blues and rock improvise on, as degrees from the tonic.
#:
#: The minor pentatonic in **A is every white key** — A C D E G — which is the
#: whole reason it can be taught at core 2.5 rather than after the black keys
#: arrive at 3.1. Adding the flat fifth makes it the blues scale and costs
#: exactly one accidental, so that variant waits for 3.1 and is levelled there.
#: Spelled as **intervals, not semitones**. Six semitones above D is A flat or
#: G sharp depending on who is asked, and music21 answers G sharp — which is a
#: raised fourth, a different degree that happens to sound the same. A blues
#: scale has a *lowered fifth*: it must sit on the fifth's own line or space
#: with a flat in front of it, or a learner reads a sharp fourth and the drill
#: that names notes disagrees with the scale that plays them. `d5` says which
#: one is meant and the spelling follows in every key.
BLUES_SCALE_FORMS: dict[str, tuple[list[str], float, str]] = {
    "pentatonic": (["P1", "m3", "P4", "P5", "m7"], 2.6, "minor pentatonic"),
    "blues": (["P1", "m3", "P4", "d5", "P5", "m7"], 3.2, "blues scale"),
}


def make_pentatonic(
    tonic: str = "A", form: str = "pentatonic", bpm: int = 72,
) -> tuple[stream.Score, dict]:
    """
    The scale every blues and rock solo is built from, one octave, thumb under.

    Core 2.5 is "moving out of C position": the thumb passes under and the hand
    arrives somewhere new. That is a technique, and the app teaches it on the C
    major scale alone. This is the same technique on the scale a learner
    actually wants — and in A it needs no black key at all, so it costs nothing
    extra to read.

    **Five notes over an octave will not fit five fingers**, which is the point:
    A to G is a minor seventh and the hand has to move. The fingering is
    1-2-3 then the thumb under for 1-2-3, the standard shape, and it is written
    on the page because a scale without a fingering is a scale practised
    differently every time.

    The blues form adds the flat fifth and nothing else. It is one accidental,
    so it is levelled after core 3.1 where accidentals are taught, and it is a
    separate item rather than a parameter nobody sees.
    """
    one_of("form", form, tuple(BLUES_SCALE_FORMS))
    degrees, level, label = BLUES_SCALE_FORMS[form]
    title = f"{note_name(tonic)} {label} — one octave, thumb under"
    # A minor is the key signature that spells these white; the flat fifth is an
    # accidental against it rather than a key of its own.
    sc, rh, lh = grand_staff(title, bpm, ks=minor_key(tonic))
    base = pitch.Pitch(tonic + "4")

    up_ = [base.transpose(interval.Interval(d)) for d in degrees] + [
        base.transpose(interval.Interval("P8"))]
    seq = up_ + list(reversed(up_))[1:]
    # 1-2-3 | 1-2-3 ascending for the six-note blues form, 1-2-3 | 1-2-3 for the
    # five-note one plus the octave: in both the thumb passes under once.
    n = len(up_)
    up_fingers = [1, 2, 3, 1, 2, 3, 4][:n] if n <= 7 else [1, 2, 3, 1, 2, 3, 4, 5][:n]
    fingers = up_fingers + list(reversed(up_fingers))[1:]
    add_notes(rh, seq, fingers, 0.5)
    lh.append(note.Rest(quarterLength=len(seq) * 0.5))
    rh.insert(0, expressions.TextExpression("Thumb under, no bump"))
    finalize(sc)

    item_id = f"exercise.pentatonic.{key_slug(tonic)}.{form}"
    entry = catalog_entry(
        item_id, title, level,
        ["blues-scale", "pentatonic", "thumb-under", "scale", "improvisation"],
        "right", bpm, "blues-scale", {"key": tonic, "form": form},
        f"scores/generated/{item_id}.mxl",
        tracks=["blues-boogie", "rock-metal", "improv-compose", "core"],
    )
    return sc, entry


def make_tresillo(tonic: str = "C", bars: int = 8, bpm: int = 84) -> tuple[stream.Score, dict]:
    """
    Three, three, two — the bass figure under most latin music.

    Core 3.6 teaches the left hand as a pattern: broken chords, Alberti, the
    waltz "oom-pah-pah". The tresillo is the same family's latin member and the
    rung has no latin in it. Eight eighths grouped 3+3+2 rather than 4+4, which
    is one idea, is countable out loud, and is the thing every habanera, tango
    and reggaeton bass is a decoration of.

    **Written as dotted quarters**, which is how every published tresillo is
    written and what a learner will meet everywhere else. Tying eighths across
    the groups would show the 3+3+2 arithmetic on the page, and it was tempting
    for exactly that reason — but it would teach a notation nobody uses to read
    a rhythm everybody plays, and the counting line under the staff already says
    where the eighths are. The page matches the world; the text does the
    teaching.
    """
    level = 3.6
    title = f"Tresillo bass in {note_name(tonic)} — three, three, two"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key(tonic))
    root = pitch.Pitch(tonic + "3")
    top = pitch.Pitch(tonic + "4")
    shape = chord_shape("maj")

    for _ in range(bars):
        # 3 + 3 + 2 eighths, as quarterLengths: 1.5, 1.5, 1.0.
        for ql in (1.5, 1.5, 1.0):
            n = note.Note(root, quarterLength=ql)
            n.articulations.append(articulations.Fingering(5))
            lh.append(n)
        # The right hand holds the chord so the bar's shape is the bass's alone.
        rh.append(fingered_chord(
            [top, top.transpose(shape[1]), top.transpose(shape[2])], [1, 3, 5], 4.0))

    lh.insert(0, expressions.TextExpression("Count: 1 . . 2 . . 3 ."))
    finalize(sc)

    item_id = f"exercise.tresillo.{key_slug(tonic)}"
    entry = catalog_entry(
        item_id, title, level,
        ["tresillo", "latin", "syncopation", "left-hand", "accompaniment"],
        "both", bpm, "accompaniment", {"key": tonic},
        f"scores/generated/{item_id}.mxl",
        tracks=["latin", "chords-pop", "core"],
    )
    return sc, entry


def make_swing_pair(tonic: str = "C", bpm: int = 96) -> tuple[stream.Score, dict]:
    """
    Four bars of eighths straight, then the same four bars swung.

    Core 2.2 is where eighth notes arrive, and swing is the *same notation* read
    differently — which is precisely why it can be taught the moment eighths can
    be read, and why it cannot be taught before. The learner plays the phrase
    twice and changes one thing.

    **The eighths are written straight in both halves.** Swing is a performance
    instruction, not a rhythm: writing the second half as dotted-eighth-sixteenth
    is the standard way of getting this wrong, and it teaches a rhythm nobody
    plays — a swung pair is nearer two-thirds and one-third than three-quarters
    and one-quarter, and a good player varies it. So the notes are identical and
    a `Swing` direction over bar five is the whole difference. If the two halves
    ever stop being identical, this exercise is teaching the wrong thing.
    """
    level = 2.2
    title = f"Straight, then swung — the same four bars in {note_name(tonic)}"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key(tonic))
    base = pitch.Pitch(tonic + "4")
    # A plain diatonic phrase in the five-finger position: the subject is the
    # eighths, so the pitches stay where core 2.2's own drills put them.
    phrase = [0, 2, 4, 2, 0, 2, 4, 5, 4, 2, 4, 2, 0, 0]
    rhythm = [0.5] * 12 + [1.0, 1.0]
    fingers = [1, 2, 3, 2, 1, 2, 3, 4, 3, 2, 3, 2, 1, 1]

    # The phrase is eight beats, so each half plays it twice to make the four
    # bars this exercise says it has. The two halves are the *same* notes; if
    # that ever stops being true the exercise is no longer about the feel.
    for half in (0, 1):
        for _ in range(2):
            for degree, ql, finger in zip(phrase, rhythm, fingers):
                n = note.Note(base.transpose([0, 2, 4, 5, 7][degree % 5] + 12 * (degree // 5)),
                              quarterLength=ql)
                n.articulations.append(articulations.Fingering(finger))
                rh.append(n)
        if half == 0:
            rh.append(note.Rest(quarterLength=4.0))
    lh.append(note.Rest(quarterLength=sum(rhythm) * 4 + 4.0))

    rh.insert(0, expressions.TextExpression("Straight"))
    swing_at = sum(rhythm) * 2 + 4.0
    rh.insert(swing_at, expressions.TextExpression(
        "Swing: long, then late"
    ))
    finalize(sc)

    item_id = f"exercise.swing-pair.{key_slug(tonic)}"
    entry = catalog_entry(
        item_id, title, level,
        ["swing", "eighth-notes", "subdivision", "feel", "hands:right"],
        "right", bpm, "rhythm", {"key": tonic},
        f"scores/generated/{item_id}.mxl",
        tracks=["jazz", "blues-boogie", "core"],
    )
    return sc, entry


def make_modal_vamp(tonic: str = "A", bars: int = 8, bpm: int = 80) -> tuple[stream.Score, dict]:
    """
    i-bVII-bVI-bVII: the minor loop most rock and metal is built on.

    **The same four chords the accompaniment lab writes for a minor key**
    (`04` §3c), and deliberately so: the lab's minor form of the four-chord
    song is `i-bVII-bVI-bVII` because a minor key does not simply transpose
    `I-V-vi-IV`, and two statements of one progression that disagree is how a
    learner ends up holding two numbers for one sound.

    In A minor those chords are **A minor, G, F, G — every one of them white
    keys**, which is why this can sit on core 3.3 where the minor triad is
    taught rather than waiting for a rock rung three stages later.

    The left hand takes root and fifth rather than the full triad: an open
    fifth under a minor chord is the rock voicing, it keeps the bass out of the
    right hand's way, and it is the shape `make_power_chord` drills.
    """
    # i, bVII, bVI, bVII — as the intervals they are actually played at, which is
    # **downward**. Spelling them up (+10, +8) is arithmetically the same chord
    # and musically a different thing: every change would leap up a seventh, the
    # left hand would climb above middle C by the second bar, and the hand would
    # move on every chord. A vamp is a hand that stays where it is while the
    # harmony moves underneath it, so the flat seven is a whole step *down* and
    # the flat six a major third down.
    degrees = (0, -2, -4, -2)
    level = 3.0
    title = f"Minor vamp in {note_name(tonic)} — i, flat seven, flat six"
    sc, rh, lh = grand_staff(title, bpm, ks=minor_key(tonic))
    root = pitch.Pitch(tonic + "3")
    top = pitch.Pitch(tonic + "4")

    for bar in range(bars):
        step = degrees[bar % len(degrees)]
        low = root.transpose(step)
        # Left hand: the open fifth, held for the bar.
        lh.append(fingered_chord([low, low.transpose(7)], [5, 1], 4.0))
        # Right hand: the triad on beats 1 and 3. Minor on i, major on the two
        # flat degrees — that is what the progression *is*, and a blanket minor
        # third here would have made it a modal drone instead.
        third = 3 if step == 0 else 4
        chord_root = top.transpose(step)
        shape = [chord_root, chord_root.transpose(third), chord_root.transpose(7)]
        for _ in range(2):
            rh.append(fingered_chord(shape, [1, 3, 5], 2.0))

    rh.insert(0, expressions.TextExpression(
        "Four chords, round and round"
    ))
    finalize(sc)

    item_id = f"exercise.modal-vamp.{key_slug(tonic)}"
    entry = catalog_entry(
        item_id, title, level,
        ["modal-minor", "minor-triad", "open-voicings", "four-chord-loop", "pedal-bass"],
        "both", bpm, "progression", {"key": tonic},
        f"scores/generated/{item_id}.mxl",
        tracks=["rock-metal", "chords-pop", "core"],
    )
    return sc, entry


def make_ostinato(
    tonic: str = "A", shape: str = "fifths", bars: int = 8, bpm: int = 84,
) -> tuple[stream.Score, dict]:
    """
    One figure in eighths, repeated, over a bass that does not move.

    `concepts.json` has carried `ostinato` and `eighth-note-ostinato` since it
    was written and nothing in the app played either. The finder text for the
    first says "repeating one figure while everything else changes"; here
    nothing else changes at all, and that is the honest first version of it —
    the skill is that the figure does not drift, does not get louder, and does
    not get faster, and adding a moving harmony on top would hide whether it did.

    Eight bars rather than four, for the same reason: four bars of an ostinato
    is a picture of one. What goes wrong goes wrong in bar six.

    **Reachable through `ostinato` and `eighth-note-ostinato`**, both of which `rock.overview` teaches, until a rung
    names this item in its `exerciseOptions`. That is the only route to it:
    `alternativesFor` offers an exercise on a rung only when it shares a concept
    with something already there *and* sits within half a level of it.
    """
    from music21 import expressions

    one_of("shape", shape, tuple(OSTINATO_SHAPES))
    offsets, fingers, level, label = OSTINATO_SHAPES[shape]
    title = (f"Ostinato over a pedal bass in {note_name(tonic)} minor — {label}")
    sc, rh, lh = grand_staff(title, bpm, ks=minor_key(tonic))
    rh.insert(0, expressions.TextExpression(
        "The figure does not change. Nothing in it gets louder, later or faster"
    ))

    start = pitch.Pitch(tonic + "4")
    pedal = pitch.Pitch(tonic + "2")
    for _ in range(bars):
        add_notes(rh, [up(start, i) for i in offsets], fingers, 0.5)
        lh.append(fingered_chord([pedal, up(pedal, 12)], [5, 1], 4.0))
    finalize(sc)

    item_id = f"exercise.ostinato.{key_slug(tonic)}.{shape}"
    entry = catalog_entry(
        item_id, title, level,
        ["ostinato", "eighth-note-ostinato", "pedal-bass", "modal-minor", "evenness"],
        "both", bpm, "accompaniment",
        {"key": tonic, "shape": shape, "offsets": offsets, "bars": bars},
        f"scores/generated/{item_id}.mxl",
        tracks=["rock-metal", "technique", "improv-compose"],
    )
    return sc, entry


# --------------------------------------------------------------------------------------
# main
# --------------------------------------------------------------------------------------
def default_plan(quick: bool, full: bool = False) -> list[tuple[stream.Score, dict]]:
    items: list[tuple[stream.Score, dict]] = []
    majors = list(MAJOR_KEYS)
    minors = list(MINOR_KEYS)
    all_twelve_major = list(MAJOR_KEYS)
    all_twelve_minor = list(MINOR_KEYS)
    hanon = load_hanon()
    hanon_numbers = sorted(int(n) for n in hanon)
    if quick:
        majors, minors = ["C", "G", "F"], ["A"]
        all_twelve_major, all_twelve_minor = ["C", "F"], ["A"]
        hanon_numbers = hanon_numbers[:2]

    # Levels are no longer written here: every generator derives its own from
    # `scale_level` / `arpeggio_level` (replan §3.1). What this function decides
    # is *which variants exist*, which is a different question and the one the
    # upper half of the ladder was missing.
    for k in majors:
        for hands in ("right", "left", "both"):
            items.append(make_scale(ScaleSpec(k, "major", hands, 1, "similar", 0.5, 60)))
        items.append(make_scale(ScaleSpec(k, "major", "both", 2, "similar", 0.5, 72)))
        items.append(make_scale(ScaleSpec(k, "major", "both", 1, "contrary", 0.5, 60)))
        # Contrary motion at two octaves: `02` Part E lists it from stage 4 and only the
        # one-octave form existed.
        items.append(make_scale(ScaleSpec(k, "major", "both", 2, "contrary", 0.5, 72)))
        # Three and four octaves (Part E stage 6), and the stage-8 form: four
        # octaves in sixteenths at ♩=120. These are what put generated material
        # above level 5 at all.
        items.append(make_scale(ScaleSpec(k, "major", "both", 3, "similar", 0.5, 84)))
        items.append(make_scale(ScaleSpec(k, "major", "both", 4, "similar", 0.5, 84)))
        items.append(make_scale(ScaleSpec(k, "major", "both", 4, "similar", 0.25, 120)))
        items.append(make_arpeggio(k, "major", "both", 2))
        items.append(make_arpeggio(k, "major", "both", 4))
        items.append(make_triad_inversions(k, "major", "both"))
        items.append(make_seventh_arpeggio(k, "dominant7", "both", 2))
        # The stage-6 seventh shapes, and the broken-seventh patterns built on
        # them at stage 7.
        for quality in ("major7", "minor7", "half-diminished7"):
            items.append(make_seventh_arpeggio(k, quality, "both", 2))
    for k in minors:
        # Hands separately at one octave is where Part E starts the minors
        # (stage 3, "A minor harmonic HS"); it did not exist before.
        for mode in ("harmonic", "melodic"):
            for hands in ("right", "left"):
                items.append(make_scale(ScaleSpec(k, mode, hands, 1, "similar", 0.5, 60)))
        for mode in ("harmonic", "melodic", "natural"):
            items.append(make_scale(ScaleSpec(k, mode, "both", 1, "similar", 0.5, 60)))
            # Two octaves hands together: stage 5 in Part E, and the level table
            # splits them by how many accidentals the key carries.
            items.append(make_scale(ScaleSpec(k, mode, "both", 2, "similar", 0.5, 72)))
        # Contrary motion in the minors too — 4.2 asks for the same work in the new keys.
        items.append(make_scale(ScaleSpec(k, "harmonic", "both", 1, "contrary", 0.5, 60)))
        items.append(make_scale(ScaleSpec(k, "harmonic", "both", 3, "similar", 0.5, 84)))
        items.append(make_arpeggio(k, "minor", "both", 2))
        items.append(make_arpeggio(k, "minor", "both", 4))
        items.append(make_triad_inversions(k, "minor", "both"))
        items.append(make_seventh_arpeggio(k, "diminished7", "both", 2))

    # Five-finger patterns in all twelve keys, major and minor: these are the
    # first thing a beginner plays and the last thing to be dropped.
    #
    # Hands separately as well as together: units 1.1 and 1.3 are explicitly right hand
    # alone and left hand alone, and `make_five_finger` has always taken a `hands`
    # argument — it was simply never called with anything but "both".
    for k in all_twelve_major:
        for hands in ("right", "left", "both"):
            items.append(make_five_finger(k, "major", hands))
    for k in all_twelve_minor:
        items.append(make_five_finger(k, "minor", "both"))

    # The chromatic scale from each of the four starting points that use a
    # different fingering shape.
    for start in (["C"] if quick else ["C", "D", "E", "G"]):
        for hands in ("right", "left", "both"):
            items.append(make_chromatic(start, hands, 1))
        # Two octaves hands together: Part E stage 6, and the span is what makes
        # the thumb-under shape a technique rather than a pattern.
        items.append(make_chromatic(start, "both", 2))

    for pattern, _, _ in (RHYTHM_PATTERNS[:2] if quick else RHYTHM_PATTERNS):
        items.append(make_rhythm(pattern))
    extra_rhythms = RHYTHM_PATTERNS_EXTRA[:2] if quick else RHYTHM_PATTERNS_EXTRA
    for spec in extra_rhythms:
        items.append(make_rhythm(spec[0]))

    for number in hanon_numbers:
        for hands in ("right", "left", "both"):
            items.append(make_hanon(number, hands, data=hanon))

    # ---- docs/02 Part E2: the skills the lessons are made of -------------------------
    #
    # Kept to the keys each unit actually teaches rather than all twelve. A beginner
    # meeting unit 2.1 does not need hands-together coordination in G flat, and 288
    # exercises nobody opens is not breadth.
    beginner_keys = ["C"] if quick else ["C", "G", "F", "D", "A"]
    for k in beginner_keys:
        for variant in COORDINATION_VARIANTS:
            items.append(make_coordination(k, variant))
        for hands in ("right", "left"):
            items.append(make_position_shift(k, hands))

    for seed in (range(1, 3) if quick else range(1, 9)):
        for hands in ("right", "left"):
            items.append(make_interval_reading(seed, hands))

    # Arpeggios hands separately, in the keys unit 4.3 names: "arpeggios
    # hands separately, two octaves, in C, G, F, A minor, D minor and E
    # minor". `arpeggio_level` has rated them 4.3 since the replan and nothing
    # ever asked for one, so the rung offered hands-together arpeggios at 5.1
    # and the lesson described exercises that did not exist.
    for k in beginner_keys[:3]:
        for hands in ("right", "left"):
            items.append(make_arpeggio(k, "major", hands, 2))
    for k in (["A"] if quick else ["A", "D", "E"]):
        for hands in ("right", "left"):
            items.append(make_arpeggio(k, "minor", hands, 2))

    for k in (["C"] if quick else list(MAJOR_KEYS)):
        for voicing in CADENCE_VOICINGS:
            items.append(make_cadence(k, voicing))

    accompaniment_keys = [("C", "major")] if quick else [
        ("C", "major"), ("G", "major"), ("F", "major"), ("A", "minor"), ("D", "minor"),
    ]
    for root, mode in accompaniment_keys:
        for pattern in ACCOMPANIMENT_PATTERNS:
            for hands in ("left", "both"):
                items.append(make_accompaniment(root, mode, pattern, hands))

    for k in (["C"] if quick else ["C", "G", "F", "D", "A", "B-"]):
        items.append(make_pedal(k))

    # ---- `02` Part E stages 7-8: double notes, octaves, broken sevenths ----------------
    #
    # `02` names C and G first for the double-note scales and "all keys" a stage
    # later, so the narrow set is the default and the twelve are behind --full:
    # twenty-four double-third scales nobody has reached yet is payload, not
    # breadth (the same argument Part E2 makes about 288 exercises).
    double_keys = ["C"] if quick else (list(MAJOR_KEYS) if full else ["C", "G"])
    for k in double_keys:
        for interval_name in ("third", "sixth"):
            for hands in ("right", "left"):
                items.append(make_double_scale(k, interval_name, hands))

    octave_keys = ["C"] if quick else (list(MAJOR_KEYS) if full else ["C", "G", "F", "D", "A"])
    for k in octave_keys:
        for hands in ("right", "left", "both"):
            items.append(make_octave_scale(k, hands, 1))
        items.append(make_octave_scale(k, "right", 1, broken=True))
        items.append(make_octave_scale(k, "left", 1, broken=True))

    broken_keys = ["C"] if quick else list(MAJOR_KEYS)
    for k in broken_keys:
        for quality in ("dominant7", "major7", "minor7"):
            items.append(make_broken_seventh(k, quality, "both"))

    # ---- the Hanon 21-60 skills, as named families (`02` Part E amendment) -------------
    #
    # C, G and F first because that is the order the course introduces keys in;
    # --full opens the rest. The point of these is the motion, not the key.
    cell_keys = ["C"] if quick else (list(MAJOR_KEYS) if full else ["C", "G", "F"])
    for k in cell_keys:
        for per_note in (3, 4):
            for hands in ("right", "left"):
                items.append(make_repeated_notes(k, per_note, hands))
        for hands in ("right", "left"):
            items.append(make_trill(k, 4, hands, ornament="trill"))
            items.append(make_trill(k, 2, hands, ornament="mordent"))
            items.append(make_tremolo_octaves(k, hands))
            # The third as well as the octave: `blues.5` teaches
            # tremolo thirds and nothing played one.
            items.append(make_tremolo_octaves(k, hands, shape="third"))
        for hands in ("left", "right"):
            items.append(make_rotation(k, hands))

    # ---- families the engine scores in a new way --------------------------------------
    articulation_keys = ["C"] if quick else ["C", "G", "F", "D"]
    for k in articulation_keys:
        for articulation in ("staccato", "legato"):
            items.append(make_articulation(k, articulation, "right"))

    independence_keys = ["C"] if quick else ["C", "G", "F"]
    for k in independence_keys:
        for ratio, *_ in INDEPENDENCE_RATIOS:
            items.append(make_hand_independence(k, ratio))

    shaping_keys = ["C"] if quick else ["C", "G", "F", "D", "A"]
    for k in shaping_keys:
        for shape in ("crescendo", "diminuendo"):
            items.append(make_shaping(k, shape))
    for k in shaping_keys:
        items.append(make_voicing(k))

    # ---- rhythm the existing generator could not write --------------------------------
    for variant in ("tied-across-bar", "sixteenth"):
        items.append(make_syncopation(variant))
    for spec in ODD_METERS:
        items.append(make_meter(spec.signature))
    # The ragtime figure that crosses the beat. One key: like the other two
    # rhythm families, what is being learnt is a count, and twelve keys of the
    # same count is twelve copies of one exercise.
    items.append(make_secondary_rag())

    for k in (["C"] if quick else ["C", "G", "F", "A"]):
        for variant in ("held-melody", "half-pedal"):
            items.append(make_pedal_variant(k, variant))

    # ---- harmony: the chords-pop, blues and jazz tracks (`02` Parts D2-D4) -------------
    #
    # Twelve keys where the curriculum says twelve keys and a narrow set where
    # it does not, on the Part E2 argument: the ii-V-I and the four-chord loop
    # are explicitly "in all twelve", and a stride study in G flat that nobody
    # reaches is payload. `--full` opens the rest.
    harmony_keys = ["C"] if quick else list(HARMONY_KEYS)
    narrow = ["C"] if quick else (list(HARMONY_KEYS) if full else ["C", "F", "B-", "E-"])
    for k in harmony_keys:
        for voicing in SEVENTH_VOICINGS:
            items.append(make_seventh_voicing(k, voicing))
        for shape, *_ in II_V_I_SHAPES:
            items.append(make_ii_v_i(k, shape))
        for inversions in (False, True):
            items.append(make_four_chord_loop(k, inversions))
    for k in narrow:
        items.append(make_tritone_sub(k))
        items.append(make_slash_bass(k))
        items.append(make_stride(k))
        for form in ("blues", "ii-V-I"):
            items.append(make_walking_bass(k, form))
            items.append(make_walking_bass(k, form, "intro"))
        for variant in TURNAROUNDS:
            items.append(make_turnaround(k, variant))
        items.append(make_turnaround(k, "I-vi-ii-V", "intro"))
        for pattern in swing_comping_patterns():
            for tier, *_ in COMPING_TIERS:
                items.append(make_comping(k, pattern, tier))
        for flavour in ("quartal", "sus2", "sus4", "add9"):
            items.append(make_open_voicing(k, flavour))
        for pattern in BOOGIE_PATTERNS:
            items.append(make_boogie(k, pattern))
        for hands in ("right", "both"):
            items.append(make_blues_scale(k, hands))
        # The oom-pah, both reaches: `02` Part D5's ragtime rungs name it on
        # every one of them and the track had no generated family at all.
        for span in OOMPAH_SPANS:
            items.append(make_oompah(k, span))

    # ---- the minor blues (`02` Part D3 stage 6) ---------------------------------------
    #
    # The same two families over `TWELVE_BAR_MINOR`. D flat is dropped rather
    # than spelled some other way: its minor needs eight flats, which MusicXML
    # cannot write, and `minor_key` says so out loud rather than engraving a
    # page that renders blank. With `--full` `narrow` is all twelve keys, which
    # is the only way that key is ever reached here.
    for k in [key_name for key_name in narrow if key_name not in UNWRITABLE_MINOR]:
        items.append(make_walking_bass(k, "minor-blues"))
        for pattern in BOOGIE_PATTERNS:
            items.append(make_boogie(k, pattern, form="minor-blues"))

    # ---- the guitar keys (`02` Part D3, and the whole of the jam module) --------------
    #
    # E, A, G and D: the keys a band plays blues in, and none of them is in
    # `narrow`. The jam rung's own lesson asks for a boogie bass in E, a walking
    # line and comping behind somebody else, and not one of the three existed in
    # any key the rung names — so the module's four exercises were all borrowed
    # from elsewhere and its five "songs" are all generated shuffles.
    #
    # Four families rather than all of them, and the comping at the intro tier
    # only. This is about forty items; `--full` in these keys would be four
    # hundred, and nobody sight-reads a quartal voicing at a jam.
    jam_keys = [k for k in (["E"] if quick else list(JAM_KEYS)) if k not in narrow]
    for k in jam_keys:
        for pattern in BOOGIE_PATTERNS:
            items.append(make_boogie(k, pattern))
        for hands in ("right", "both"):
            items.append(make_blues_scale(k, hands))
        items.append(make_walking_bass(k, "blues"))
        items.append(make_walking_bass(k, "blues", "intro"))
        for pattern in swing_comping_patterns():
            items.append(make_comping(k, pattern, "intro"))

    # ---- the mini-modules: holiday, hymns-gospel and rock-metal -----------------------
    #
    # Each of these is a device its own lesson already names in words. The keys
    # are the ones the track is played in rather than all twelve, on the Part E2
    # argument: a power chord in G flat minor is not breadth.
    for k in (["C"] if quick else ["C", "G", "F", "D", "A"]):
        items.append(make_intro(k))
    for k in (["C"] if quick else ["C", "F", "B-", "E-"]):
        items.append(make_walkup(k))
        items.append(make_passing_chord(k))
    for k in (["A"] if quick else ["A", "E", "D"]):
        items.append(make_power_chord(k))
        for shape in OSTINATO_SHAPES:
            items.append(make_ostinato(k, shape))

    # ---- genre, early (2026-09-17) ----------------------------------------------------
    #
    # The library has no genre repertoire below level 4: read from the notation
    # rather than the titles, the blues holdings are 1915-1925 lead sheets in E
    # flat and A flat with diminished and augmented chords, and every other
    # genre's songs start higher still. So the first three stages' genre content
    # is generated or it does not exist.
    #
    # The keys are chosen so that every one of these is playable **without a
    # black key**: A minor and C major are the two five-finger positions core
    # Stages 1-3 actually teach, and a riff that needed a hand position the
    # learner has not met would be genre content they cannot reach.
    for k in (["A"] if quick else ["A", "C"]):
        for cell in RIFF_CELLS:
            items.append(make_riff(k, cell))
    for k in (["C"] if quick else ["C", "G", "F"]):
        items.append(make_swing_pair(k))
    for k in (["A"] if quick else ["A", "E", "D"]):
        items.append(make_modal_vamp(k))
    # A and E minor pentatonic are white-key shapes; D needs one flat and is
    # generated anyway because the blues rungs are in flat keys.
    for k in (["A"] if quick else ["A", "E", "D"]):
        for form in BLUES_SCALE_FORMS:
            items.append(make_pentatonic(k, form))
    for k in (["C"] if quick else ["C", "F", "G"]):
        items.append(make_tresillo(k))

    # ---- latin (`02` Part D) ----------------------------------------------------------
    #
    # Every clave in the table, because a tune is in one of them and the rung's
    # whole point is telling them apart — five of them now the bossa is written
    # down, and two of the rung's six songs are bossas. The tumbao and montuno
    # stay in the keys the repertoire sits in rather than twelve: the skill is
    # the rhythm, and twelve keys of a figure nobody has reached is the payload
    # Part E2 argues against.
    for pattern in (list(CLAVE_PATTERNS)[:1] if quick else list(CLAVE_PATTERNS)):
        items.append(make_clave(pattern))
        # And the same clave with the beat under it, so a drift has something to
        # be wrong against. The lesson says the app cannot clap behind you; this
        # is the nearest honest thing to it.
        items.append(make_clave(pattern, with_pulse=True))
    for k in (["C"] if quick else ["C", "D", "G", "A", "F"]):
        items.append(make_tumbao(k))
        for voices in (2, 3):
            items.append(make_montuno(k, voices))
        # The bossa clave as well as the son: two of the rung's six songs are
        # bossas and `make_montuno` reads the table, so this costs one line.
        items.append(make_montuno(k, 2, "bossa"))
        items.append(make_latin_groove(k))
        for pattern in latin_comping_patterns():
            for tier, *_ in COMPING_TIERS:
                items.append(make_comping(k, pattern, tier))
    return items


def engraved_key(sc: stream.Score, declared: str | None) -> str | None:
    """
    The key signature actually written on the page, as the catalog says it.

    `catalog_entry` filled this field from the maker's `key` parameter, which is
    a music21 root and not a key: across the 1,012 generated rows it shipped
    "A" for an exercise engraved in A *minor*, and "B-" and "E-" and "A-" —
    music21's trailing hyphen for a flat, in a field the Library screen prints
    to the learner under the heading "Key". `note_name` exists in this file
    because that exact spelling leaked into seventy *titles* once and was
    fixed there; the same leak in `keySig` was never noticed, and it is the
    only family in the catalog that does it — every kern and MuseTrainer row
    carries a real key name with its mode.

    Two things it is not allowed to guess. The mode comes off the engraved
    signature, never off the root, because a minor exercise and its relative
    major share a signature and only the score knows which one it is. And where
    the engraved key is not the exercise's own — the seventh-chord families are
    deliberately written with no signature at all, `ks=key.Key("C")`, so the
    shape is spelled in accidentals — this returns nothing rather than claiming
    the piece is in C major. The root is in the title, where it belongs.

    ASCII, and lower case for a minor key: this field follows the chord-symbol
    convention `import_kern.key_name` documents and the 217 kern rows carry —
    "Ab major", "c# minor". Titles are the place for the typographic flat.
    """
    if declared is None:
        return None
    signature = next(iter(sc.recurse().getElementsByClass(key.Key)), None)
    if signature is None:
        return None
    tonic = signature.tonic.name
    if tonic != declared:
        return None
    mode = signature.mode or "major"
    spelled = tonic.replace("-", "b")
    return f"{spelled.lower() if mode == 'minor' else spelled} {mode}"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--catalog", required=True)
    ap.add_argument("--quick", action="store_true", help="small subset for smoke tests")
    ap.add_argument(
        "--full",
        action="store_true",
        help="every key for the double-note and cell families, not just the ones "
             "the curriculum introduces first",
    )
    args = ap.parse_args()
    entries = []
    for sc, entry in default_plan(args.quick, args.full):
        write(sc, args.out, entry["id"])
        # The one place both the score and its row are in hand. `catalog_entry`
        # cannot do this: it never sees the score, which is the only thing that
        # knows what key signature was actually engraved.
        entry["keySig"] = engraved_key(sc, (entry.get("drill") or {}).get("params", {}).get("key"))
        entries.append(entry)
    os.makedirs(os.path.dirname(os.path.abspath(args.catalog)), exist_ok=True)
    with open(args.catalog, "w", encoding="utf-8") as f:
        json.dump(entries, f, indent=2, ensure_ascii=False)
    print(f"wrote {len(entries)} items to {args.out}; catalog {args.catalog}")


if __name__ == "__main__":
    main()
