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
from typing import Iterable

from music21 import (chord, clef, instrument, key, layout, meter, metadata, note,
                     pitch, scale, stream, tempo, articulations)
from music21.scale import Direction

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
MAJOR_KEYS = ("C", "G", "D", "A", "E", "B", "F", "B-", "E-", "A-", "D-", "G-")
MINOR_KEYS = ("A", "E", "D", "G", "C", "B", "F", "F#", "C#", "G#", "B-", "E-")

ARPEGGIO_FINGERING_RH = [1, 2, 3, 5]   # root-position major/minor triad, white-key roots
ARPEGGIO_FINGERING_LH = [5, 3, 2, 1]

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


def finalize(sc: stream.Score) -> stream.Score:
    for p in sc.parts:
        p.makeMeasures(inPlace=True)
        p.makeTies(inPlace=True)
    return sc


def write(sc: stream.Score, out_dir: str, item_id: str) -> str:
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, item_id + ".mxl")
    sc.write("musicxml", fp=path)
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


def expand_fingering(one_octave: list[int], octaves: int, ascending: bool = True) -> list[int]:
    """Repeat a one-octave fingering over N octaves. one_octave has 8 entries (tonic..tonic)."""
    body = one_octave[:-1]
    fingers = body * octaves + [one_octave[-1]]
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
    level: float = 2.5


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

    title = f"{spec.tonic.replace('-', '♭').replace('#', '♯')} {mode_label} scale — {spec.octaves} oct, {spec.motion}, {spec.hands}"
    sc, rh, lh = grand_staff(title, spec.bpm, ks=ks)

    rh_start = pitch.Pitch(spec.tonic + "4")
    lh_start = pitch.Pitch(spec.tonic + "3")
    if spec.tonic in ("A", "B", "B-", "A-", "G", "G-"):
        # keep the LH inside the bass staff without excessive ledger lines
        lh_start = pitch.Pitch(spec.tonic + "2")

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
        lh_asc = expand_fingering(fing[1], spec.octaves)
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
                          ["scale", f"{spec.tonic}-{mode_label}", spec.motion, f"hands:{spec.hands}"],
                          spec.hands, spec.bpm, "scale",
                          {"key": spec.tonic, "mode": spec.mode, "octaves": spec.octaves, "motion": spec.motion,
                           "rhythm": spec.rhythm, "fingeringVerified": fing is not None},
                          f"scores/generated/{item_id}.mxl")
    return sc, entry


def make_arpeggio(root: str, quality: str = "major", hands: str = "both", octaves: int = 2, bpm: int = 60, level: float = 4.3) -> tuple[stream.Score, dict]:
    third = 4 if quality == "major" else 3
    intervals = [0, third, 7]
    title = f"{root} {quality} arpeggio — {octaves} oct, {hands}"
    ks = key.Key(root if quality == "major" else root.lower())
    sc, rh, lh = grand_staff(title, bpm, ks=ks)

    def run(start: pitch.Pitch) -> list[pitch.Pitch]:
        up = [start.transpose(12 * o + i) for o in range(octaves) for i in intervals] + [start.transpose(12 * octaves)]
        return up + list(reversed(up))[1:]

    rh_p, lh_p = run(pitch.Pitch(root + "4")), run(pitch.Pitch(root + "2"))
    n_up = 3 * octaves + 1
    rh_f = (ARPEGGIO_FINGERING_RH[:3] * octaves + [5])
    rh_f = rh_f + list(reversed(rh_f))[1:]
    lh_f = (ARPEGGIO_FINGERING_LH[:3] * octaves + [1])
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
    entry = catalog_entry(item_id, title, level, ["arpeggio", f"{root}-{quality}", f"hands:{hands}"], hands, bpm,
                          "arpeggio", {"key": root, "quality": quality, "octaves": octaves}, f"scores/generated/{item_id}.mxl")
    return sc, entry


def make_triad_inversions(root: str, quality: str = "major", hands: str = "both", bpm: int = 60, level: float = 4.3) -> tuple[stream.Score, dict]:
    """Root position, 1st inversion, 2nd inversion, root (octave up), then back down — as block chords."""
    third = 4 if quality == "major" else 3
    base = [0, third, 7]
    title = f"{root} {quality} triad inversions — {hands}"
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
    entry = catalog_entry(item_id, title, level, ["triad", "inversions", f"{root}-{quality}"], hands, bpm, "inversion",
                          {"key": root, "quality": quality}, f"scores/generated/{item_id}.mxl")
    return sc, entry


def make_five_finger(root: str, quality: str = "major", hands: str = "both", bpm: int = 60, level: float = 1.1) -> tuple[stream.Score, dict]:
    """C-D-E-F-G-F-E-D-C style pattern in quarters, then the five notes as a block chord."""
    steps = [0, 2, 4, 5, 7] if quality == "major" else [0, 2, 3, 5, 7]
    seq = steps + list(reversed(steps))[1:]
    title = f"{root} {quality} five-finger pattern — {hands}"
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
    entry = catalog_entry(item_id, title, level, ["five-finger", f"{root}-{quality}", f"hands:{hands}"], hands, bpm,
                          "five-finger", {"key": root, "quality": quality}, f"scores/generated/{item_id}.mxl")
    return sc, entry


def make_hanon(
    number: int,
    hands: str = "both",
    bpm: int = 60,
    level: float = 4.4,
    data: dict | None = None,
) -> tuple[stream.Score, dict]:
    """
    One Hanon exercise, note for note as the Mutopia edition prints it.

    The data is a list of diatonic scale degrees per hand, counted from the
    hand's starting note, so building the score is a walk up the C major scale
    rather than a reconstruction of the pattern.
    """
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


def chromatic_finger(midi: int, first: bool) -> int:
    """
    The modern chromatic fingering: 3 on every black key, 1 on every white,
    and 2 on the white that follows a white (F after E, C after B).

    Both hands use this shape. It is *not* what Clementi Op. 42 prints — his
    1801 chromatic runs 1-2-3-4 across the keys — and that is a deliberate
    departure from the chart the scale fingerings were verified against: the
    1-3 shape is what every modern method teaches and what the learner will
    see everywhere else.
    """
    pitch_class = midi % 12
    if pitch_class in BLACK_PITCH_CLASSES:
        return 3
    if pitch_class == 5:  # F, which follows E
        return 2
    if pitch_class == 0:  # C, which follows B — except at the very start
        return 1 if first else 2
    return 1


def make_chromatic(
    start: str = "C", hands: str = "both", octaves: int = 1, bpm: int = 60, level: float = 4.4
) -> tuple[stream.Score, dict]:
    """
    The chromatic scale, with the standard 1-3 fingering.

    Both hands use the same shape ascending: thumb on every white key that has
    no black key above it, third finger on the black keys. It is written out
    rather than generated from a scale object so the fingering can be attached
    to the right notes.
    """
    title = f"Chromatic scale from {start} — {octaves} oct, {hands}"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key("C"))

    def run(base: str) -> list[pitch.Pitch]:
        first = pitch.Pitch(base)
        up = [first.transpose(i) for i in range(12 * octaves + 1)]
        return up + list(reversed(up))[1:]

    def fingers_for(pitches: list[pitch.Pitch]) -> list[int]:
        return [chromatic_finger(int(p.midi), index == 0) for index, p in enumerate(pitches)]

    for part_, base in ((rh, f"{start}4"), (lh, f"{start}3")):
        if (part_ is rh and hands == "left") or (part_ is lh and hands == "right"):
            part_.append(note.Rest(quarterLength=0.5 * (2 * (12 * octaves + 1) - 1)))
            continue
        pitches = run(base)
        add_notes(part_, pitches, fingers_for(pitches), 0.5)
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
}


def make_seventh_arpeggio(
    root: str, quality: str = "dominant7", hands: str = "both", octaves: int = 2,
    bpm: int = 60, level: float = 5.2,
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
    shape = SEVENTH_SHAPES[quality]
    label = "dominant 7th" if quality == "dominant7" else "diminished 7th"
    title = f"{root} {label} arpeggio — {octaves} oct, {hands}"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key("C"))

    def run(start: pitch.Pitch) -> list[pitch.Pitch]:
        up = [start.transpose(12 * o + i) for o in range(octaves) for i in shape] + [
            start.transpose(12 * octaves)
        ]
        return up + list(reversed(up))[1:]

    rh_pitches, lh_pitches = run(pitch.Pitch(root + "4")), run(pitch.Pitch(root + "3"))
    rh_fingers = [1, 2, 3, 5] * octaves + [1]
    rh_fingers = rh_fingers + list(reversed(rh_fingers))[1:]
    lh_fingers = [5, 3, 2, 1] * octaves + [5]
    lh_fingers = lh_fingers + list(reversed(lh_fingers))[1:]

    for part_, pitches, fingers in ((rh, rh_pitches, rh_fingers), (lh, lh_pitches, lh_fingers)):
        if (part_ is rh and hands == "left") or (part_ is lh and hands == "right"):
            part_.append(note.Rest(quarterLength=0.5 * len(pitches)))
            continue
        add_notes(part_, pitches, fingers, 0.5)
    finalize(sc)
    item_id = f"exercise.arpeggio7.{key_slug(root)}-{quality}.{octaves}oct.{hands}"
    entry = catalog_entry(
        item_id, title, level, ["arpeggio", "seventh-chord", f"{root}-{label}", f"hands:{hands}"],
        hands, bpm, "arpeggio", {"key": root, "quality": quality, "octaves": octaves},
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
    title = f"Hands together in {root} — left hand {'holds' if variant == 'hold' else 'changes'}"
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
        ["hands-together", "held-LH", "vertical-alignment", f"{root}-major"], "both", bpm,
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
    k = key.Key(root)
    title = f"Position shift in {root} — {hands}"
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
        item_id, title, level, ["position-shift", "hand-position", f"{root}-major"], hands, bpm,
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
}


def make_cadence(root: str, voicing: str = "root", bpm: int = 60, level: float = 3.2):
    """I-IV-V7-I as whole-note left-hand chords, in one of the two standard voicings."""
    k = key.Key(root)
    label = "root position" if voicing == "root" else "smooth voicing"
    title = f"I-IV-V7-I in {root} — {label}"
    sc, rh, lh = grand_staff(title, bpm, ks=k)

    for degrees, fingers in CADENCE_VOICINGS[voicing]:
        lh.append(fingered_chord(scale_pitches(k, 3, degrees), fingers, 4.0))
    silent(rh, 16.0)

    finalize(sc)
    item_id = f"exercise.cadence.{key_slug(root)}.{voicing}"
    entry = catalog_entry(
        item_id, title, level, ["I-IV-V7", "cadence", "voice-leading", f"{root}-major"], "left", bpm,
        "cadence", {"key": root, "voicing": voicing, "progression": ["I", "IV", "V7", "I"]},
        f"scores/generated/{item_id}.mxl", tracks=["technique", "core", "chords-pop"],
    )
    return sc, entry


#: Unit 3.6's three accompaniment patterns, as offsets into the chord being played:
#: index 0 is the lowest note of the triad, 2 the highest. Written as indices rather than
#: intervals so the same table works for a minor chord.
ACCOMPANIMENT_PATTERNS: dict[str, tuple[str, list[tuple[int, float]], str]] = {
    "broken":  ("Broken chord", [(0, 1.0), (2, 1.0), (1, 1.0), (2, 1.0)], "4/4"),
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
    k = key.Key(root if mode == "major" else root.lower())
    label, steps, time_sig = ACCOMPANIMENT_PATTERNS[pattern]
    hands_label = "left hand" if hands == "left" else "hands together"
    title = f"{label} in {root} {mode} — {hands_label}"
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
        [pattern, "accompaniment-pattern", "broken-chords", f"{root}-{mode}"], hands, bpm,
        "accompaniment",
        {"key": root, "quality": mode, "pattern": pattern, "timeSig": time_sig,
         "progression": ["I", "IV", "V", "I"]},
        f"scores/generated/{item_id}.mxl", tracks=["technique", "core", "chords-pop"],
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
    title = f"Pedal changes on I-IV-V7-I in {root}"
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
# main
# --------------------------------------------------------------------------------------
def default_plan(quick: bool) -> list[tuple[stream.Score, dict]]:
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

    for k in majors:
        for hands in ("right", "left", "both"):
            items.append(make_scale(ScaleSpec(k, "major", hands, 1, "similar", 0.5, 60, 2.5 if hands != "both" else 4.1)))
        items.append(make_scale(ScaleSpec(k, "major", "both", 2, "similar", 0.5, 72, 4.1)))
        items.append(make_scale(ScaleSpec(k, "major", "both", 1, "contrary", 0.5, 60, 4.1)))
        # Contrary motion at two octaves: `02` Part E lists it from stage 4 and only the
        # one-octave form existed.
        items.append(make_scale(ScaleSpec(k, "major", "both", 2, "contrary", 0.5, 72, 4.1)))
        items.append(make_arpeggio(k, "major", "both", 2))
        items.append(make_triad_inversions(k, "major", "both"))
        items.append(make_seventh_arpeggio(k, "dominant7", "both", 2))
    for k in minors:
        for mode in ("harmonic", "melodic", "natural"):
            items.append(make_scale(ScaleSpec(k, mode, "both", 1, "similar", 0.5, 60, 4.2)))
        # Contrary motion in the minors too — 4.2 asks for the same work in the new keys.
        items.append(make_scale(ScaleSpec(k, "harmonic", "both", 1, "contrary", 0.5, 60, 4.2)))
        items.append(make_arpeggio(k, "minor", "both", 2))
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
            items.append(make_five_finger(k, "major", hands, level=1.1 if hands != "both" else 2.1))
    for k in all_twelve_minor:
        items.append(make_five_finger(k, "minor", "both", level=2.1))

    # The chromatic scale from each of the four starting points that use a
    # different fingering shape.
    for start in (["C"] if quick else ["C", "D", "E", "G"]):
        for hands in ("right", "left", "both"):
            items.append(make_chromatic(start, hands, 1))

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

    for k in (["C"] if quick else list(MAJOR_KEYS)):
        for voicing in ("root", "voice-led"):
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
    return items


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--catalog", required=True)
    ap.add_argument("--quick", action="store_true", help="small subset for smoke tests")
    args = ap.parse_args()
    entries = []
    for sc, entry in default_plan(args.quick):
        write(sc, args.out, entry["id"])
        entries.append(entry)
    os.makedirs(os.path.dirname(os.path.abspath(args.catalog)), exist_ok=True)
    with open(args.catalog, "w", encoding="utf-8") as f:
        json.dump(entries, f, indent=2, ensure_ascii=False)
    print(f"wrote {len(entries)} items to {args.out}; catalog {args.catalog}")


if __name__ == "__main__":
    main()
