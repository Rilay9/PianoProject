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
from typing import Iterable

from music21 import (chord, clef, instrument, interval, key, layout, meter, metadata,
                     note, pitch, scale, stream, tempo, articulations)
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
            if tonic in FIRST_THREE:
                return 2.5
            return 3.1 if tonic in ("D", "A") else 4.2
        # Hands together, one or two octaves, similar or contrary: the same
        # three key bands, because what makes B major hard is the key and not
        # the direction.
        if octaves == 2:
            if tonic in SHARP_SIDE:
                return 4.1
            return 4.2 if tonic in FLAT_SIDE else 5.1
        if tonic in ("C", "G", "D", "A"):
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


def make_arpeggio(root: str, quality: str = "major", hands: str = "both", octaves: int = 2, bpm: int = 60) -> tuple[stream.Score, dict]:
    level = arpeggio_level(root, quality, hands, octaves)
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
    # 4.3 for every key: `02` Part E puts "triads all inversions (12 major, 12
    # minor)" at stage 4 without splitting them by key, and the shape really is
    # the same work in all of them.
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


def make_five_finger(root: str, quality: str = "major", hands: str = "both", bpm: int = 60) -> tuple[stream.Score, dict]:
    """C-D-E-F-G-F-E-D-C style pattern in quarters, then the five notes as a block chord."""
    # replan §3.1: hands separately is unit 1.1, hands together is 2.1.
    level = 1.1 if hands != "both" else 2.1
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
    data: dict | None = None,
) -> tuple[stream.Score, dict]:
    """
    One Hanon exercise, note for note as the Mutopia edition prints it.

    The data is a list of diatonic scale degrees per hand, counted from the
    hand's starting note, so building the score is a walk up the C major scale
    rather than a reconstruction of the pattern.
    """
    # replan §3.1: Hanon 1-10 is stage 4 work, 11-20 stage 5.
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
    start: str = "C", hands: str = "both", octaves: int = 1, bpm: int = 60
) -> tuple[stream.Score, dict]:
    """
    The chromatic scale, with the standard 1-3 fingering.

    Both hands use the same shape ascending: thumb on every white key that has
    no black key above it, third finger on the black keys. It is written out
    rather than generated from a scale object so the fingering can be attached
    to the right notes.
    """
    level = scale_level(start, "chromatic", hands, octaves, "similar", 0.5)
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
    level = arpeggio_level(root, quality, hands, octaves)
    shape = SEVENTH_SHAPES[quality]
    label = SEVENTH_LABELS[quality]
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


#: Double-third and double-sixth fingering is genuinely hand- and key-specific,
#: and a printed fingering that is wrong is worse than none: it teaches a habit.
#: What is safe to print is the *outer* finger on every note plus the thumb
#: pattern the ascending run uses in the white keys, so that is what these
#: carry, and `fingeringVerified` says so in the catalog.
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
    steps = 2 if interval_name == "third" else 5
    level = 7.1 if tonic in ("C", "G") else 7.3
    label = "3rds" if interval_name == "third" else "6ths"
    title = f"{tonic.replace('-', '♭')} major scale in {label} — {octaves} oct, {hands}"
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

    if hands in ("both", "right"):
        add_chords(rh, rh_pairs, rh_fingers, 0.5)
    else:
        silent(rh, 0.5 * len(rh_pairs))
    if hands in ("both", "left"):
        add_chords(lh, lh_pairs, lh_fingers, 0.5)
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
    """
    level = 7.2
    kind_label = "broken octaves" if broken else "octave scale"
    title = f"{tonic.replace('-', '♭')} {kind_label} — {octaves} oct, {hands}"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key(tonic))

    def top_finger(p: pitch.Pitch) -> int:
        return 4 if p.pitchClass in BLACK_PITCH_CLASSES else 5

    def build(part_: stream.PartStaff, start: pitch.Pitch, is_right: bool) -> float:
        run = _diatonic_run(tonic, "major", start, octaves)
        if broken:
            # Lower note then upper note, so the wrist rotates rather than the
            # arm lifting — which is the whole point of the broken form.
            for p in run:
                low, high = p, p.transpose(12)
                for tone, finger in ((low, 1), (high, top_finger(high))):
                    n = note.Note(tone, quarterLength=0.25)
                    n.articulations.append(
                        articulations.Fingering(finger if is_right else (1 if tone is high else finger))
                    )
                    part_.append(n)
            return 0.5 * len(run)
        for p in run:
            fingers = [1, top_finger(p.transpose(12))]
            part_.append(fingered_chord([p, p.transpose(12)], fingers, 0.5))
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
    level = broken_seventh_level(root)
    shape = SEVENTH_SHAPES[quality]
    label = SEVENTH_LABELS[quality]
    title = f"{root.replace('-', '♭')} broken {label} — {hands}"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key("C"))

    def figure(start: pitch.Pitch) -> list[pitch.Pitch]:
        tones = [start.transpose(i) for i in shape] + [start.transpose(12)]
        cell = tones + list(reversed(tones))[1:-1]
        # Two octaves of the same figure, so it lasts long enough to be an
        # exercise rather than a gesture (docs/03 §3's five-second floor).
        return cell + [p.transpose(12) for p in cell]

    rh_fingers = [1, 2, 3, 5, 1, 5, 3, 2]
    lh_fingers = [5, 4, 2, 1, 5, 1, 2, 4]
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
        ["broken-chord", "seventh-chord", f"{root}-{label}", f"hands:{hands}"],
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
# Hanon-style cells (`02` Part E amendment: the skills of 21-60, not the text)
# --------------------------------------------------------------------------------------
#
# No reachable public-domain edition of Hanon 21-60 exists, and encoding sixty
# exercises from memory is what P4 refused to do for 1-20. What those numbers
# train has names, so the names are what is generated: "Repeated notes
# 4-to-a-note in C", not "Hanon 44".


def _walk(tonic: str, bars: int, per_bar: int) -> list[pitch.Pitch]:
    """A stepwise scale walk long enough to fill `bars`."""
    scale_obj = scale.MajorScale(tonic)
    start = pitch.Pitch(tonic + "4")
    run = scale_obj.getPitches(start, start.transpose(24))
    needed = bars * per_bar
    out: list[pitch.Pitch] = []
    while len(out) < needed:
        out.extend(run)
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
    fingers = [3, 2, 1] if per_note == 3 else [4, 3, 2, 1]
    level = 5.3 if per_note == 3 else 6.3
    title = f"Repeated notes {per_note}-to-a-note in {tonic.replace('-', '♭')} — {hands}"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key(tonic))
    steps = _walk(tonic, bars=4, per_bar=2)
    ql = 1.0 / per_note

    def build(part_: stream.PartStaff, transpose: int) -> float:
        for p in steps:
            for finger in fingers:
                n = note.Note(p.transpose(transpose), quarterLength=ql)
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
    from music21 import expressions

    level = 6.3 if ornament == "trill" else 5.3
    label = "Measured trill" if ornament == "trill" else "Mordents"
    title = f"{label} in {tonic.replace('-', '♭')} — {notes_per_beat} per beat, {hands}"
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
        total = 0.0
        for main in starts:
            upper = neighbour(main, 1)
            lower = neighbour(main, -1)
            if ornament == "trill":
                cell = [main, upper] * (notes_per_beat * 2 // 2)
            else:
                # A mordent is main-lower-main, then the beat is held.
                cell = [main, lower, main]
            for i, p in enumerate(cell):
                n = note.Note(p.transpose(transpose), quarterLength=ql)
                if i == 0:
                    n.articulations.append(articulations.Fingering(2))
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


def make_tremolo_octaves(
    tonic: str = "C", hands: str = "right", bpm: int = 60,
) -> tuple[stream.Score, dict]:
    """
    An octave tremolo: the two notes of an octave alternating in sixteenths.

    Hanon 51-60 territory. The exercise is the forearm, not the fingers, so the
    fingering is the octave's (1 and 5, or 1 and 4 on a black key) and nothing
    else is marked.
    """
    level = 7.2
    title = f"Octave tremolo in {tonic.replace('-', '♭')} — {hands}"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key(tonic))
    scale_obj = scale.MajorScale(tonic)
    roots = scale_obj.getPitches(pitch.Pitch(tonic + "4"), pitch.Pitch(tonic + "5"))[:4]

    def build(part_: stream.PartStaff, transpose: int) -> float:
        total = 0.0
        for root in roots:
            low = root.transpose(transpose)
            high = low.transpose(12)
            top = 4 if high.pitchClass in BLACK_PITCH_CLASSES else 5
            for i in range(8):
                tone = low if i % 2 == 0 else high
                n = note.Note(tone, quarterLength=0.25)
                n.articulations.append(articulations.Fingering(1 if i % 2 == 0 else top))
                part_.append(n)
            total += 2.0
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

    item_id = f"exercise.tremolo.{key_slug(tonic)}.{hands}"
    entry = catalog_entry(
        item_id, title, level, ["tremolo", "octaves", "forearm", f"hands:{hands}"],
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
    level = 6.3
    title = f"Wrist rotation (Alberti at speed) in {tonic.replace('-', '♭')} — {hands}"
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
    from music21 import expressions

    level = 4.5 if articulation == "legato" else 4.4
    label = articulation.capitalize()
    title = f"{label} phrase in {tonic.replace('-', '♭')} — {hands}"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key(tonic))
    steps = _walk(tonic, bars=4, per_bar=4)
    rh.insert(0, expressions.TextExpression(
        "Crisp and short — release each key before the next"
        if articulation == "staccato"
        else "Joined — hold each key until the next one sounds"
    ))

    def build(part_: stream.PartStaff, transpose: int) -> float:
        for i, p in enumerate(steps):
            n = note.Note(p.transpose(transpose), quarterLength=1.0)
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
    title = f"Hand independence {ratio} in {tonic.replace('-', '♭')}"
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

    level = 5.2
    title = f"{shape.capitalize()} over a scale in {tonic.replace('-', '♭')}"
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
    title = f"Voicing the top note in {tonic.replace('-', '♭')}"
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


#: The odd meters `02` asks for and `make_rhythm` could not express: it writes
#: 4/4 only, and a 7/8 bar is not a 4/4 bar with a note missing.
ODD_METERS = (("5/4", [1.0, 1.0, 1.0, 1.0, 1.0], 5.4), ("7/8", [0.5] * 7, 6.4))


def make_meter(signature: str = "5/4", bpm: int = 66) -> tuple[stream.Score, dict]:
    """A four-bar phrase in an odd meter, with the grouping written above it."""
    from music21 import expressions

    pattern, level = next((p, lv) for sig, p, lv in ODD_METERS if sig == signature)
    grouping = "3 + 2" if signature == "5/4" else "2 + 2 + 3"
    title = f"{signature} — counting in {grouping}"
    sc, rh, lh = grand_staff(title, bpm, ts=signature)
    rh.insert(0, expressions.TextExpression(f"Count {grouping}"))
    tones = _walk("C", bars=4, per_bar=len(pattern))
    for bar in range(4):
        for i, ql in enumerate(pattern):
            rh.append(note.Note(tones[(bar * len(pattern) + i) % len(tones)], quarterLength=ql))
        lh.append(chord.Chord(["C3", "G3"], quarterLength=sum(pattern)))
    finalize(sc)

    item_id = f"exercise.meter.{signature.replace('/', '-')}"
    entry = catalog_entry(
        item_id, title, level, ["rhythm", "odd-meter", f"meter-{signature.replace('/', '-')}"],
        "both", bpm, "meter", {"timeSig": signature, "grouping": grouping},
        f"scores/generated/{item_id}.mxl",
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

    level = 6.4 if variant == "held-melody" else 7.4
    k = key.Key(root)
    title = ("Held melody over changing harmony" if variant == "held-melody"
             else "Half pedal — the damper part-way down") + f" in {root.replace('-', '♭')}"
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
    """
    from music21 import harmony

    symbol = harmony.ChordSymbol(figure)
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

#: The twelve keys as a chord chart spells them.
#:
#: `MAJOR_KEYS` ends with G flat, which is right for a scale — the fingering and
#: the key signature are what a scale is about. A chart in G flat prints its IV
#: chord as C flat, which no chart does; the same music written in F sharp
#: prints B. So the harmony families use F sharp and the scale families keep
#: G flat, because they are answering different questions.
HARMONY_KEYS = ("C", "D-", "D", "E-", "E", "F", "F#", "G", "A-", "A", "B-", "B")


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


def make_seventh_voicing(
    tonic: str = "C", voicing: str = "shell", bpm: int = 66,
) -> tuple[stream.Score, dict]:
    """
    A ii-V-I with the sevenths voiced one way, in one key.

    One exercise per voicing per key rather than a menu, because the point is
    the *hand shape*: playing a shell voicing once teaches nothing, and playing
    twelve of them is how the shape stops needing to be worked out.
    """
    shapes = SEVENTH_VOICINGS[voicing]
    level = 6.1 if voicing in ("close", "shell") else 7.1
    label = VOICING_LABELS[voicing]
    title = f"ii-V-I in {tonic.replace('-', '♭')} — {label}"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key(tonic))

    offset = 0.0
    for quality, degree, _roman in II_V_I:
        root_name = _transpose_name(tonic, degree)
        add_symbol(rh, _figure(root_name, quality), offset)
        intervals = shapes[quality]
        base = pitch.Pitch(root_name + "4")
        tones = [up(base, i) for i in intervals]
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
    title = f"I-V-vi-IV in {tonic.replace('-', '♭')} — {kind_label}"
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
    title = f"Slash chords — a walking bass under held harmony in {tonic.replace('-', '♭')}"
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
TWELVE_BAR = ((0, "7"), (5, "7"), (0, "7"), (0, "7"),
              (5, "7"), (5, "7"), (0, "7"), (0, "7"),
              (7, "7"), (5, "7"), (0, "7"), (7, "7"))


def make_walking_bass(
    tonic: str = "C", form: str = "blues", bpm: int = 92,
) -> tuple[stream.Score, dict]:
    """
    A walking bass line in quarters, over a blues or over a ii-V-I.

    Four notes to the bar, root-third-fifth-approach: the approach note is a
    semitone below the next bar's root, which is the whole trick and the reason
    a walking line sounds inevitable rather than random.
    """
    level = 6.2 if form == "blues" else 6.4
    bars = list(TWELVE_BAR) if form == "blues" else [(2, "m7"), (7, "7"), (0, "maj7"), (0, "maj7")]
    title = (f"Walking bass over a 12-bar blues in {tonic.replace('-', '♭')}"
             if form == "blues"
             else f"Walking bass over ii-V-I in {tonic.replace('-', '♭')}")
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key(tonic))

    offset = 0.0
    for index, (degree, quality) in enumerate(bars):
        root_name = _transpose_name(tonic, degree)
        add_symbol(rh, _figure(root_name, quality), offset)
        third = 3 if quality.startswith("m") else 4
        root = pitch.Pitch(root_name + "2")
        next_degree = bars[(index + 1) % len(bars)][0]
        next_root = pitch.Pitch(_transpose_name(tonic, next_degree) + "2")
        # A semitone under the next root: the note that makes the line sound
        # like it was going there all along.
        approach = _readable(next_root.transpose(interval.Interval("-m2")))
        line = [root, up(root, third), up(root, 7), approach]
        add_notes(lh, line, [5, 3, 2, 1], 1.0)
        # The right hand comps the shell so the line has something to walk under.
        top = pitch.Pitch(root_name + "4")
        rh.append(fingered_chord(
            [top, up(top, third), up(top, 10 if quality != "maj7" else 11)], [1, 2, 5], 4.0))
        offset += 4.0
    finalize(sc)

    # `slug`, not the form verbatim: "ii-V-I" is how the progression is written
    # and an id may not carry a capital letter.
    item_id = f"exercise.walking-bass.{key_slug(tonic)}.{slug(form)}"
    entry = catalog_entry(
        item_id, title, level,
        ["walking-bass", "bass-line", "swing", f"form-{form}"],
        "both", bpm, "walking-bass",
        {"key": tonic, "form": form, "notesPerBar": 4},
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
}


def make_comping(
    tonic: str = "C", pattern: str = "charleston", bpm: int = 132,
) -> tuple[stream.Score, dict]:
    """
    A ii-V-I comped in one rhythm, so the rhythm is the exercise.

    Chord voicings are the shell, held short: comping is a rhythmic skill and
    practising it on a voicing you have to think about teaches neither.
    """
    level = 6.3
    offsets = COMPING_PATTERNS[pattern]
    title = f"Comping — {pattern.replace('-', ' ')} in {tonic.replace('-', '♭')}"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key(tonic))

    bar = 0.0
    for quality, degree, _roman in II_V_I + (("maj7", 0, "I"),):
        root_name = _transpose_name(tonic, degree)
        add_symbol(rh, _figure(root_name, quality), bar)
        shape = SEVENTH_VOICINGS["shell"][quality]
        base = pitch.Pitch(root_name + "4")
        tones = [up(base, i) for i in shape]
        cursor = 0.0
        for hit in offsets:
            if hit > cursor:
                rh.append(note.Rest(quarterLength=hit - cursor))
                cursor = hit
            rh.append(fingered_chord(tones, [1, 2, 5], 0.5))
            cursor += 0.5
        if cursor < 4.0:
            rh.append(note.Rest(quarterLength=4.0 - cursor))
        add_notes(lh, [pitch.Pitch(root_name + "2")], [5], 4.0)
        bar += 4.0
    finalize(sc)

    item_id = f"exercise.comping.{key_slug(tonic)}.{pattern}"
    entry = catalog_entry(
        item_id, title, level,
        ["comping", "rhythm", f"comping-{pattern}", "swing", "jazz-harmony"],
        "both", bpm, "comping",
        {"key": tonic, "pattern": pattern, "offsets": offsets},
        f"scores/generated/{item_id}.mxl",
        tracks=["jazz", "chords-pop"],
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
    title = f"Stride left hand in {tonic.replace('-', '♭')}"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key(tonic))

    offset = 0.0
    for degree, quality in ((0, "maj"), (7, "7"), (0, "maj"), (5, "maj")):
        root_name = _transpose_name(tonic, degree)
        add_symbol(rh, _figure(root_name, quality), offset)
        root = pitch.Pitch(root_name + "2")
        third = 3 if quality == "m" else 4
        chord_tones = [up(root, 12 + third), up(root, 19)]
        # bass — chord — tenth — chord
        add_notes(lh, [root], [5], 1.0)
        lh.append(fingered_chord(chord_tones, [2, 1], 1.0))
        add_notes(lh, [up(root, 16)], [1], 1.0)
        lh.append(fingered_chord(chord_tones, [2, 1], 1.0))
        top = pitch.Pitch(root_name + "4")
        rh.append(fingered_chord([top, up(top, third), up(top, 7)], [1, 3, 5], 4.0))
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
    tonic: str = "C", variant: str = "I-vi-ii-V", bpm: int = 88,
) -> tuple[stream.Score, dict]:
    """
    The two bars that send a chorus back to the top.

    `I-vi-ii-V` is the one every standard ends with; `iii-VI-ii-V` is the same
    two bars with the tonic replaced by the chord a third above and the vi made
    dominant, which is what a player reaches for when the tune has already sat
    on the tonic for eight bars.
    """
    level = 6.4 if variant == "I-vi-ii-V" else 7.1
    plan = TURNAROUNDS[variant]
    title = f"Turnaround in {tonic.replace('-', '♭')} — {variant}"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key(tonic))

    offset = 0.0
    for degree, quality in plan:
        root_name = _transpose_name(tonic, degree)
        add_symbol(rh, _figure(root_name, quality), offset)
        shape = SEVENTH_VOICINGS["shell"][quality]
        base = pitch.Pitch(root_name + "4")
        rh.append(fingered_chord([up(base, i) for i in shape], [1, 2, 5], 2.0))
        add_notes(lh, [pitch.Pitch(root_name + "2")], [5], 2.0)
        offset += 2.0
    finalize(sc)

    item_id = f"exercise.turnaround.{key_slug(tonic)}.{slug(variant)}"
    entry = catalog_entry(
        item_id, title, level,
        ["turnaround", "jazz-harmony", "chord-progression"],
        "both", bpm, "turnaround",
        {"key": tonic, "variant": variant},
        f"scores/generated/{item_id}.mxl",
        tracks=["jazz", "blues-boogie"],
    )
    return sc, entry


def make_ii_v_i(tonic: str = "C", bpm: int = 60) -> tuple[stream.Score, dict]:
    """
    ii-V-I with the guide tones written out, in one key.

    The reason a ii-V-I is *the* progression: the seventh of one chord is the
    third of the next, a semitone lower. Dm7's C becomes G7's B; G7's F becomes
    Cmaj7's E. Once the hand knows that, it stops looking for the chords and
    starts hearing where they are going, which is why this is a family of its
    own rather than a voicing study — `make_seventh_voicing` teaches the shape,
    this teaches the motion.
    """
    level = 5.4
    title = f"ii-V-I in {tonic.replace('-', '♭')} — guide tones"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key(tonic))

    offset = 0.0
    # The I lasts two bars, because the point is arriving rather than moving on.
    for quality, degree, bars in (("m7", 2, 1), ("7", 7, 1), ("maj7", 0, 2)):
        root_name = _transpose_name(tonic, degree)
        add_symbol(rh, _figure(root_name, quality), offset)
        third = 3 if quality == "m7" else 4
        seventh = 11 if quality == "maj7" else 10
        base = pitch.Pitch(root_name + "4")
        rh.append(fingered_chord(
            [in_guide_tone_window(up(base, third)),
             in_guide_tone_window(up(base, seventh))], [1, 5], 4.0 * bars))
        add_notes(lh, [pitch.Pitch(root_name + "2")], [5], 4.0 * bars)
        offset += 4.0 * bars
    finalize(sc)

    item_id = f"exercise.ii-v-i.{key_slug(tonic)}"
    entry = catalog_entry(
        item_id, title, level,
        ["ii-V-I", "guide-tones", "voice-leading", "seventh-chord", "jazz-harmony"],
        "both", bpm, "ii-V-I",
        {"key": tonic, "progression": ["ii7", "V7", "Imaj7"]},
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
    title = f"Tritone substitution in {tonic.replace('-', '♭')} — ii-sub V-I"
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
    title = f"{labels[flavour]} voicings in {tonic.replace('-', '♭')}"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key(tonic))

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


#: Boogie left-hand figures, as semitone offsets per eighth over one bar.
#:
#: Named after the players the shapes are associated with, which is how every
#: blues method refers to them and how the owner will hear them named.
BOOGIE_PATTERNS: dict[str, list[int]] = {
    "pinetop": [0, 4, 7, 9, 10, 9, 7, 4],
    "yancey": [0, 7, 0, 7, 0, 7, 0, 7],
    "walking-eighths": [0, 4, 7, 10, 12, 10, 7, 4],
}


def make_boogie(
    tonic: str = "C", pattern: str = "pinetop", bpm: int = 104,
) -> tuple[stream.Score, dict]:
    """
    A boogie left hand over the first four bars of a blues.

    Eight eighths a bar, the same shape transposed to each chord — which is
    exactly how it is played, and why the exercise is about stamina and the
    shift rather than about reading.
    """
    level = 5.4 if pattern == "yancey" else 6.2
    offsets = BOOGIE_PATTERNS[pattern]
    title = f"Boogie left hand — {pattern.replace('-', ' ')} in {tonic.replace('-', '♭')}"
    sc, rh, lh = grand_staff(title, bpm, ks=key.Key(tonic))

    bar = 0.0
    for degree in (0, 0, 5, 0):
        root_name = _transpose_name(tonic, degree)
        add_symbol(rh, f"{root_name}7", bar)
        root = pitch.Pitch(root_name + "2")
        add_notes(lh, [up(root, i) for i in offsets], [5, 4, 3, 2, 1, 2, 3, 4], 0.5)
        top = pitch.Pitch(root_name + "4")
        rh.append(fingered_chord([top, up(top, 4), up(top, 10)], [1, 2, 5], 4.0))
        bar += 4.0
    finalize(sc)

    item_id = f"exercise.boogie.{key_slug(tonic)}.{pattern}"
    entry = catalog_entry(
        item_id, title, level,
        ["boogie", "left-hand", "shuffle", f"boogie-{pattern}", "blues"],
        "both", bpm, "boogie",
        {"key": tonic, "pattern": pattern, "offsets": offsets},
        f"scores/generated/{item_id}.mxl",
        tracks=["blues-boogie", "jazz"],
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
    for signature, _, _ in ODD_METERS:
        items.append(make_meter(signature))

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
        items.append(make_ii_v_i(k))
        for inversions in (False, True):
            items.append(make_four_chord_loop(k, inversions))
    for k in narrow:
        items.append(make_tritone_sub(k))
        items.append(make_slash_bass(k))
        items.append(make_stride(k))
        for form in ("blues", "ii-V-I"):
            items.append(make_walking_bass(k, form))
        for variant in TURNAROUNDS:
            items.append(make_turnaround(k, variant))
        for pattern in COMPING_PATTERNS:
            items.append(make_comping(k, pattern))
        for flavour in ("quartal", "sus2", "sus4", "add9"):
            items.append(make_open_voicing(k, flavour))
        for pattern in BOOGIE_PATTERNS:
            items.append(make_boogie(k, pattern))
    return items


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
        entries.append(entry)
    os.makedirs(os.path.dirname(os.path.abspath(args.catalog)), exist_ok=True)
    with open(args.catalog, "w", encoding="utf-8") as f:
        json.dump(entries, f, indent=2, ensure_ascii=False)
    print(f"wrote {len(entries)} items to {args.out}; catalog {args.catalog}")


if __name__ == "__main__":
    main()
