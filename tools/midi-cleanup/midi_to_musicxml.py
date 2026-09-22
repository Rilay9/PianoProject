#!/usr/bin/env python3
"""Convert a MIDI file to a cleaned-up MusicXML file.

A personal utility, independent of tools/content/'s curated build pipeline.
It reads a MIDI file with music21 and deals with the problems that make a raw
MIDI import unreadable:

  * timing        - every onset is snapped to one grid per bar (see `quantise`)
  * swing         - a run played long-short is written straight, with the word
                    on the score, rather than as triplets (see `detect_swing`)
  * hands         - a two-hand performance recorded on one track is split into
                    two parts by a moving boundary (see `split_hands`)
  * rhythm        - a slice whose length is not a rhythm is cut into ones that
                    are and tied (see `notatable_pieces`)
  * overlaps      - a played-in legato leaves notes overlapping; each part is
                    rebuilt as one line of chords, and a note that crosses
                    another's start or a barline is split and tied
  * bars          - bars are made fresh from the notes, so every bar adds up
  * key           - from --key if given, else estimated from the notes; any key
                    signature already in the MIDI is removed so only one is written
  * spelling      - every note is spelled from the key by interval (see
                    spell_in_key), so B flat in C stays B flat
  * part names    - taken from the MIDI's track names where it has them

After writing, the output is read back and checked: every note the quantiser
placed must still be there at the beat it placed it, and every bar but the
first and last must add up to its time signature. If either check fails the
utility says what failed and exits with status 2; it does not report a broken
file as a success.

Estimating the key, choosing a grid and splitting the hands are guesses. A
DAW-quantized MIDI should come out clean first time; a live performance is
worth reading through, and may need a different --divisors or an explicit
--key. `tools/midi-cleanup/tests/` is the harness, and its docstring says
which of its inputs are in the repository and which are not.

Usage:
    python midi_to_musicxml.py input.mid [-o output.musicxml] [--force]
    python midi_to_musicxml.py input.mid --key "E minor" --divisors 4
    python midi_to_musicxml.py input.mid --hands split --swing off
"""
from __future__ import annotations

import argparse
import copy
import sys
from collections import Counter
from dataclasses import dataclass
from fractions import Fraction
from functools import lru_cache
from pathlib import Path

from music21 import (
    chord,
    clef,
    converter,
    duration,
    expressions,
    interval,
    key as key_module,
    layout,
    metadata,
    meter,
    midi as midi_module,
    note,
    pitch,
    stream,
    tempo,
    tie,
)

#: How each of the twelve pitch classes above the tonic is spelled, as an
#: interval. The seven notes of the scale take the key's own names. The five
#: chromatic ones follow common practice for a melody line: in a major key the
#: raised tonic (C sharp in C), the flat third, the raised fourth, the flat sixth
#: and the flat seventh — the blues notes of C are E flat, F sharp and B flat —
#: and in a minor key the flat second, the raised third and fourth, and the
#: raised sixth and seventh of the melodic and harmonic minor (F sharp and G
#: sharp in A minor). The raised fourth matches the rule the app's own blues
#: scales use (`tools/content/generate_exercises.py`, `BLUES_SCALE_FORMS`).
SPELLING = {
    "major": ["P1", "A1", "M2", "m3", "M3", "P4", "A4", "P5", "m6", "M6", "m7", "M7"],
    "minor": ["P1", "m2", "M2", "m3", "M3", "P4", "A4", "P5", "m6", "M6", "m7", "M7"],
}

#: Ticks are integers and quarters are not, so every time in this file is a
#: Fraction. This bounds the denominator when one is built from a float: 3840 is
#: ten times the 384 ticks per quarter the three test recordings use, so no real
#: onset is rounded by the conversion itself.
TIME_DENOMINATOR = 3840

#: How far apart, in quarter notes, the two halves of a note the MIDI reader cut
#: at a barline may be and still be rejoined. See `part_events`.
TIE_JOIN_TOLERANCE = Fraction(1, 64)

#: How far apart, in semitones, the two notes of one hand may be before the
#: split stops believing one hand played both. An octave and a step: a tenth is
#: reachable and a twelfth is not, and the cases in between are rare enough that
#: erring towards "two hands" loses less than erring the other way.
HAND_SPAN_SEMITONES = 14

#: How much of the new note each hand's running centre takes. At 0.4 the centre
#: lags a line moving by one semitone a note by about a semitone and a half,
#: which is enough memory to survive a leap and little enough to follow a scale.
HAND_MEMORY = Fraction(2, 5)

#: A swung off-beat eighth sounds at two thirds of the beat. The number is the
#: app's own (`app/src/audio/backingLoop.ts`, `SWING_OFFBEAT`, quoted in
#: pending-review Entry 24 item 6) rather than a second opinion written here, so
#: what this tool writes and what the app judges cannot drift apart.
SWING_RATIO = Fraction(2, 3)

#: Half the width of the window an onset must fall in to be counted as a swung
#: off-beat or as a straight one, as a share of the beat.
#:
#: **The same width either side, which is the whole point.** The first version
#: had a swung window of a quarter of the beat and a straight one of a tenth,
#: and called the Bach prelude and the Scarlatti sonata swung — because a wide
#: window catches more onsets than a narrow one whatever is played, so the
#: comparison was measuring the windows and not the music.
SWING_HALF_WINDOW = Fraction(1, 16)

#: How many swung off-beats a run needs before the whole of it is called swung,
#: and by what factor they must outnumber the straight ones. Two conditions
#: rather than one: a ratio alone calls a four-note run swung on one stray
#: onset, and a count alone calls a long straight run swung on the handful of
#: eighths that happened to be late.
SWING_MIN_OFFBEATS = 8
SWING_MIN_RATIO = 2

#: The share of onsets that must land on a beat before the beats are believed
#: at all — the "where the tempo map implies it" half of the rule.
#:
#: A MIDI file states where its beats are; whether the performance agreed is a
#: separate question, and off-beat positions mean nothing when it did not. All
#: three recordings in `build/midi-real/` are wall-clock captures written at a
#: nominal 120 bpm that nobody played to: their onsets land on a beat about an
#: eighth of the time, which is what scattering them at random over the beat
#: would give (the window is an eighth of the beat wide). A performance played
#: to the file's own clock puts far more than that on the beat.
SWING_MIN_ON_BEAT = Fraction(3, 10)


@dataclass
class Event:
    """One struck note: when it started, when it stopped, what and how hard.

    Times are in quarter notes from the beginning of the piece, as Fractions —
    a grid of thirds and a grid of quarters do not both fit in a float, and the
    rounding showed up as bars that were a 64th short.
    """

    start: Fraction
    end: Fraction
    midi: int
    velocity: int | None = None

    @property
    def length(self) -> Fraction:
        return self.end - self.start


def as_fraction(value: float | Fraction) -> Fraction:
    return Fraction(value).limit_denominator(TIME_DENOMINATOR)


def parse_divisors(text: str) -> tuple[int, ...]:
    try:
        values = tuple(int(x) for x in text.split(","))
    except ValueError as exc:
        raise argparse.ArgumentTypeError(f"expected comma-separated integers, got {text!r}") from exc
    if not values or any(v <= 0 for v in values):
        raise argparse.ArgumentTypeError(f"divisors must be positive integers, got {text!r}")
    return values


def parse_key(text: str) -> key_module.Key:
    """`"E minor"`, `"Bb major"`, `"F#m"`: whatever music21 reads as a key."""
    words = text.replace("-", " ").split()
    try:
        if len(words) == 2 and words[1].lower() in ("major", "minor"):
            tonic = words[0].replace("b", "-") if len(words[0]) > 1 else words[0]
            return key_module.Key(tonic, words[1].lower())
        return key_module.Key(text)
    except Exception as exc:  # noqa: BLE001 - music21 raises several types here
        raise argparse.ArgumentTypeError(f"not a key: {text!r}") from exc


def parse_time_signature(text: str) -> meter.TimeSignature:
    try:
        return meter.TimeSignature(text)
    except Exception as exc:  # noqa: BLE001 - music21 raises several types here
        raise argparse.ArgumentTypeError(f"not a time signature: {text!r}") from exc


def spell_in_key(p: pitch.Pitch, k: key_module.Key) -> pitch.Pitch:
    """`p` as the key spells its pitch class, as a new pitch; the sound never changes.

    A new pitch, not `p` edited in place: on pitches read from MIDI, setting
    `step` and `accidental` did not stick, and a whole file came out with its
    MIDI spellings while the tool reported notes respelled.

    The name comes from the interval above the tonic (`SPELLING`); where that
    would need a double sharp or flat (a raised fourth in F sharp major, say),
    the simpler of the note's two names is used instead.
    """
    sounding = p.ps
    # A fresh tonic: the one on a key music21 estimated is marked as spelled by
    # inference, and anything transposed from it is re-spelled by music21's own
    # guess — A plus an augmented fourth came back as E flat.
    tonic = pitch.Pitch(k.tonic.name)
    step = int(round(sounding - tonic.ps)) % 12
    mode = "minor" if k.mode == "minor" else "major"
    target = tonic.transpose(interval.Interval(SPELLING[mode][step]))
    if target.accidental is not None and abs(target.accidental.alter) > 1:
        target = pitch.Pitch(ps=sounding)
        target = target.simplifyEnharmonic(mostCommon=True)
    spelled = pitch.Pitch(target.name)
    # Octave numbers follow the letter (B sharp 3 sounds as C 4), so set the
    # octave that makes the sounding pitch come out unchanged.
    spelled.octave = 4
    spelled.octave = 4 + int(round((sounding - spelled.ps) / 12))
    return spelled


# --------------------------------------------------------------------------------------
# what the MIDI file holds
# --------------------------------------------------------------------------------------


def read_midi(path: Path) -> dict:
    """The file's own note-ons and note-offs, its tempo, its metre and its track names.

    Read here rather than through `converter.parse`, and that is a correction
    rather than a preference. music21's MIDI reader builds a `Score` with bars
    and ties already in it, and on the Bach recording it produced **152 note
    objects for 129 Note-On messages**: twenty-three of its fifty-nine ties
    join pieces that are bars apart, so no adjacency rule can tell a split note
    from a note struck again, and every one of those became an extra note-head
    in the output. Counting the messages is the only reading that cannot
    invent a note.

    The sustain pedal is **not** folded into the durations. CC64 is how long a
    string rang; the written duration is how long the finger held the key, and
    a score that wrote the ringing would double every value under a pedalled
    bar.

    Returns ticks converted to quarter notes, so everything downstream is in
    the same unit as a `quarterLength`.
    """
    midi_file = midi_module.MidiFile()
    midi_file.open(str(path))
    try:
        midi_file.read()
    finally:
        midi_file.close()
    ticks = Fraction(midi_file.ticksPerQuarterNote or 1024)

    tracks: list[dict] = []
    time_signature: meter.TimeSignature | None = None
    first_tempo: tempo.MetronomeMark | None = None
    key_signatures: list[str] = []
    for track in midi_file.tracks:
        at = Fraction(0)
        name: str | None = None
        open_notes: dict[int, Event] = {}
        events: list[Event] = []
        for event in track.events:
            if event.isDeltaTime():
                at += Fraction(event.time or 0)
                continue
            kind = event.type
            if kind == midi_module.MetaEvents.SEQUENCE_TRACK_NAME and name is None:
                name = bytes(event.data or b"").decode("latin-1").strip() or None
            elif kind == midi_module.MetaEvents.SET_TEMPO and first_tempo is None:
                data = bytes(event.data or b"")
                micros = int.from_bytes(data, "big") if data else 0
                if micros > 0:
                    first_tempo = tempo.MetronomeMark(number=60_000_000.0 / micros)
            elif kind == midi_module.MetaEvents.TIME_SIGNATURE and time_signature is None:
                data = bytes(event.data or b"")
                if len(data) >= 2:
                    time_signature = meter.TimeSignature(f"{data[0]}/{2 ** data[1]}")
            elif kind == midi_module.MetaEvents.KEY_SIGNATURE:
                data = bytes(event.data or b"")
                if len(data) >= 2:
                    sharps = data[0] - 256 if data[0] > 127 else data[0]
                    key_signatures.append(str(key_module.KeySignature(sharps)))
            elif kind == midi_module.ChannelVoiceMessages.NOTE_ON and (event.velocity or 0) > 0:
                quarters = at / ticks
                # The same pitch struck again while it is still down ends the
                # first one here: two overlapping note-ons of one pitch are one
                # string, and a MIDI file that sends them is saying "again".
                earlier = open_notes.pop(event.pitch, None)
                if earlier is not None and earlier.end <= earlier.start:
                    earlier.end = quarters
                new = Event(quarters, quarters, int(event.pitch), int(event.velocity))
                events.append(new)
                open_notes[int(event.pitch)] = new
            elif kind == midi_module.ChannelVoiceMessages.NOTE_OFF or (
                kind == midi_module.ChannelVoiceMessages.NOTE_ON and (event.velocity or 0) == 0
            ):
                earlier = open_notes.pop(int(event.pitch), None)
                if earlier is not None:
                    earlier.end = at / ticks
        tail = max((e.end for e in events), default=Fraction(0))
        for still_down in open_notes.values():
            if still_down.end <= still_down.start:
                still_down.end = max(at / ticks, tail, still_down.start + Fraction(1, 4))
        events = [e for e in events if e.end > e.start]
        events.sort(key=lambda e: (e.start, e.midi))
        tracks.append({"index": track.index, "name": name, "events": events})
    return {
        "tracks": tracks,
        "time_signature": time_signature or meter.TimeSignature("4/4"),
        "had_time_signature": time_signature is not None,
        "tempo": first_tempo,
        "key_signatures": sorted(set(key_signatures)),
    }


def track_with_the_notes(path: Path) -> int:
    """The index of the one track holding Note-Ons, or -1 if that is not one track.

    A format 1 file is conventionally a conductor track — tempo, time signature,
    nothing sounding — followed by the parts, and every one of the three
    Disklavier performances in `build/midi-real/` is exactly that: track 0 has
    six events and none of them is a note, track 1 has every note and every
    CC64 message. Read rather than assumed, because "track 1 is the music" is a
    convention and not a rule, and a file that breaks it would otherwise be
    converted silently into an empty score.
    """
    with_notes = [track["index"] for track in read_midi(path)["tracks"] if track["events"]]
    return with_notes[0] if len(with_notes) == 1 else -1


def continues(member: note.Note, holder: note.NotRest) -> bool:
    """Is this note the tied continuation of one before it?

    Asked of the note, never the chord holding it: a chord's own `tie` does not
    say which of its notes carry on, and reading it as if it did miscounted
    notes both ways.
    """
    del holder
    return member.tie is not None and member.tie.type in ("stop", "continue")


# --------------------------------------------------------------------------------------
# the quantisation policy
# --------------------------------------------------------------------------------------


def snap(value: Fraction, unit: Fraction) -> Fraction:
    """`value` on the nearest multiple of `unit`, halves going up."""
    steps = value / unit
    whole = int(steps)
    rest = steps - whole
    if rest >= Fraction(1, 2):
        whole += 1
    elif rest <= Fraction(-1, 2):
        whole -= 1
    return unit * whole


def detect_swing(events: list[Event], beat: Fraction) -> dict:
    """Does this performance play its off-beats long-short?

    The beat comes from the caller (the time signature, read through the tempo
    map) rather than being assumed to be a quarter, because the position of an
    onset *within its beat* is the whole measurement and a 6/8 beat is not a
    quarter.

    Three conditions, and all three have to hold:

    1. The onsets agree with the file's beats often enough for "off the beat"
       to mean anything (`SWING_MIN_ON_BEAT`). This is the tempo map's half of
       it: a wall-clock recording states a tempo nobody played to, and every
       position within its beat is then an artefact of the stated tempo.
    2. There are at least `SWING_MIN_OFFBEATS` onsets near two thirds of a beat.
    3. They outnumber the ones near a half by `SWING_MIN_RATIO`, counted in
       windows of the same width (`SWING_HALF_WINDOW`).

    The beat comes from the caller (the time signature, read through the tempo
    map) rather than being assumed to be a quarter, because the position of an
    onset *within its beat* is the whole measurement and a 6/8 beat is not a
    quarter.
    """
    near_swung = 0
    near_straight = 0
    on_beat = 0
    for event in events:
        position = (event.start % beat) / beat
        if min(position, 1 - position) <= SWING_HALF_WINDOW:
            on_beat += 1
        if abs(position - Fraction(1, 2)) <= SWING_HALF_WINDOW:
            near_straight += 1
        elif abs(position - SWING_RATIO) <= SWING_HALF_WINDOW:
            near_swung += 1
    placed = Fraction(on_beat, len(events)) if events else Fraction(0)
    swung = (
        placed >= SWING_MIN_ON_BEAT
        and near_swung >= SWING_MIN_OFFBEATS
        and near_swung >= SWING_MIN_RATIO * max(near_straight, 1)
    )
    return {
        "swung": swung,
        "near_swung": near_swung,
        "near_straight": near_straight,
        "on_beat_share": float(placed),
    }


def deswing(value: Fraction, beat: Fraction) -> Fraction:
    """An onset two thirds of the way through its beat, moved to the half.

    The convention a swing marking states is that a written pair of eighths is
    played as the first and third of a triplet, so the *written* position of
    what was played at two thirds is the half. Writing the triplet instead
    would be a true transcription of the sound and a false one of the music,
    and the app judges a swung piece by moving the expected time the same way
    (Entry 24 item 6).
    """
    within = (value % beat) / beat
    if abs(within - SWING_RATIO) <= SWING_HALF_WINDOW:
        return value - (value % beat) + beat / 2
    return value


def separate_repeats(events: list[Event], unit_for_bar, bar_length: Fraction) -> None:
    """Two strikes of one pitch that the grid put on one onset, pulled apart.

    A grid that merges them loses a note, and losing a note is the one thing
    this tool refuses to do. The second strike moves forward one grid unit and
    the first is shortened to meet it.
    """
    seen: dict[tuple[Fraction, int], Event] = {}
    for event in sorted(events, key=lambda e: (e.start, e.midi)):
        while (event.start, event.midi) in seen:
            unit = unit_for_bar(int(event.start // bar_length))
            earlier = seen[(event.start, event.midi)]
            if earlier.end > event.start + unit:
                earlier.end = event.start + unit
            event.start += unit
            if event.end <= event.start:
                event.end = event.start + unit
        seen[(event.start, event.midi)] = event


def quantise(
    events: list[Event],
    *,
    bar_length: Fraction,
    beat: Fraction,
    divisors: tuple[int, ...],
    swing: bool | None,
) -> dict:
    """Every onset and release on a grid, and the grid stated.

    **The policy, in four sentences.**

    1. The candidate grids are the multiples of `1/d` of a quarter note for each
       `d` in `--divisors`; the default `4,3` offers sixteenths and eighth-note
       triplets.
    2. **The choice is made once per bar, not once per note.** The grid a bar
       takes is the one its own onsets are nearest to, totalled over the bar.
       Choosing per note is what the previous version did (music21's
       `quantizePost` with two divisors), and it is why all three real
       recordings crashed the MusicXML exporter: a bar holding one onset on a
       quarter grid and the next on a third has slices a twelfth long between
       them, and a twelfth of a beat here and five twelfths there is not a
       rhythm anybody can write.
    3. A release is snapped to the grid of the bar it falls in, so a note that
       crosses a barline is measured by both bars honestly; a note whose
       release lands on its own onset is given one grid unit rather than being
       dropped.
    4. Where the run is swung, an off-beat onset is moved to the half of the
       beat *before* the grid is chosen (`deswing`), so a swung performance is
       written straight and the bar is not dragged onto a triplet grid by it.

    Returns the new events in the order they were given — the caller relies on
    that to put them back into the parts they came from.
    """
    if not events:
        return {"events": [], "grid_by_bar": [],
                "swing": {"swung": False, "near_swung": 0, "near_straight": 0, "on_beat_share": 0.0},
                "moved": Fraction(0)}

    units = [Fraction(1, d) for d in divisors]
    measured = detect_swing(events, beat)
    swing_report = measured if swing is None else {**measured, "swung": bool(swing),
                                                   "forced": True}
    swung = bool(swing_report["swung"])

    starts = [deswing(e.start, beat) if swung else e.start for e in events]
    last_bar = int(max(e.end for e in events) // bar_length) + 1
    grid_by_bar: list[Fraction] = []
    for index in range(last_bar + 1):
        low = bar_length * index
        high = low + bar_length
        inside = [s for s in starts if low <= s < high]
        if not inside:
            grid_by_bar.append(units[0])
            continue
        best = min(units, key=lambda u: sum(abs(s - snap(s, u)) for s in inside))
        grid_by_bar.append(best)

    def unit_for_bar(index: int) -> Fraction:
        if index < 0:
            index = 0
        if index >= len(grid_by_bar):
            index = len(grid_by_bar) - 1
        return grid_by_bar[index]

    out: list[Event] = []
    moved = Fraction(0)
    for event, start in zip(events, starts):
        start_unit = unit_for_bar(int(start // bar_length))
        new_start = snap(start, start_unit)
        if new_start < 0:
            new_start = Fraction(0)
        end_unit = unit_for_bar(int(event.end // bar_length))
        new_end = snap(event.end, end_unit)
        if new_end <= new_start:
            new_end = new_start + start_unit
        moved = max(moved, abs(new_start - event.start))
        out.append(Event(new_start, new_end, event.midi, event.velocity))
    separate_repeats(out, unit_for_bar, bar_length)
    return {"events": out, "grid_by_bar": grid_by_bar, "swing": swing_report, "moved": moved}


# --------------------------------------------------------------------------------------
# durations that are rhythms
# --------------------------------------------------------------------------------------


@lru_cache(maxsize=4096)
def is_notatable(length: Fraction) -> bool:
    """Can one written note-head carry this length?

    music21 will hand back *something* for almost any number — five twelfths of
    a quarter comes back as a 6:5 tuplet of a 64th — so "the exporter did not
    throw" is not the question. The question is whether a reader would call it a
    rhythm, and the answer is: one duration type, at most one dot, and any
    tuplet three in the time of two.
    """
    if length <= 0:
        return False
    d = duration.Duration(float(length))
    if len(d.components) != 1:
        return False
    if d.type in ("inexpressible", "complex", "zero"):
        return False
    if d.dots > 1:
        return False
    for t in d.tuplets:
        if (t.numberNotesActual, t.numberNotesNormal) != (3, 2):
            return False
    return True


def notatable_pieces(
    start_in_bar: Fraction, length: Fraction, unit: Fraction, beat: Fraction
) -> list[Fraction]:
    """`length` as a list of lengths that are rhythms, to be tied together.

    Cut at the next beat first and only then shortened onto the grid, because a
    note tied across a beat reads and a 6:5 tuplet does not. The last resort —
    a length the grid cannot express at all — is handed back whole rather than
    silently altered, so the written-file check reports it instead of this
    function hiding it.
    """
    pieces: list[Fraction] = []
    at = Fraction(start_in_bar)
    left = Fraction(length)
    while left > 0:
        take = left
        if not is_notatable(take):
            room = (at // beat + 1) * beat - at
            if 0 < room < take:
                take = room
        if not is_notatable(take):
            steps = int(take / unit)
            found = None
            for k in range(steps, 0, -1):
                if is_notatable(unit * k):
                    found = unit * k
                    break
            if found is not None:
                take = found
        if not is_notatable(take):
            pieces.append(take)
            break
        pieces.append(take)
        at += take
        left -= take
    return pieces


# --------------------------------------------------------------------------------------
# the hand split
# --------------------------------------------------------------------------------------


def percentile(values: list[int], share: Fraction) -> Fraction:
    ordered = sorted(values)
    if not ordered:
        return Fraction(60)
    index = int(share * (len(ordered) - 1))
    return Fraction(ordered[index])


def split_hands(events: list[Event], max_span: int = HAND_SPAN_SEMITONES) -> dict:
    """One recorded track of two-hand playing, split into a left and a right.

    **The rule.** Not a fixed middle C — a waltz bass sits under middle C and
    its right hand starts on it, and a piece that climbs an octave would hand
    the whole second half to one hand. The boundary *moves*, and what moves it
    is voice-leading:

    * Each hand carries a running centre (`HAND_MEMORY`): a smoothed average of
      the notes it has been given. The centre *moves with the line*, which is
      what a fixed middle C cannot do — a waltz bass sits under middle C and
      its right hand starts on it, and a piece that climbs an octave would hand
      the whole second half to one hand.
      A running *trend* — centre plus the smoothed interval between consecutive
      notes — was written here as well and taken out again on 2026-09-22,
      because removing it changed the answer on none of these tests and on none
      of the three recordings. An untested moving part is a control that does
      nothing (`00-invariants` §1); if a case is found that needs it, it comes
      back with that case beside it.
    * Notes struck together are one group, and a group is cut in **one** place:
      everything below the cut is the left hand, everything above it the right.
      Two hands cannot interleave within one instant on a piano, and allowing
      it produced assignments no hand could play.
    * The cut is the one minimising the total distance from each note to the
      predicted pitch of the hand it lands in, plus a penalty for asking either
      hand to span more than `max_span` semitones.
    * The boundary that comes out — the midpoint between the top of the left
      block and the bottom of the right — is returned per onset, because it is
      the claim "the boundary moves" made checkable.

    **Where it fails**, said here rather than left to be discovered:

    * At a crossing, the two lines are at the same pitch by definition, and
      nothing in the onsets tells them apart. The rule holds each line until
      they meet and then has no reason to prefer either continuation; the test
      `test_where_it_fails_...` pins what it actually does.
    * A left hand that leaps over the right and comes back — the melody note
      taken by the left in late Romantic writing — is given to the right, every
      time, because its pitch is the only evidence and its pitch is the right
      hand's.
    * Notes struck together in the same register are cut by pitch alone, so the
      lower is always the left.
    * A third voice (an inner line either hand might take) is not modelled at
      all; every note goes to one of two hands.
    """
    if not events:
        return {"right": [], "left": [], "boundary": []}

    pitches = [e.midi for e in events]
    centre = {"left": percentile(pitches, Fraction(1, 4)), "right": percentile(pitches, Fraction(3, 4))}

    groups: dict[Fraction, list[Event]] = {}
    for event in events:
        groups.setdefault(event.start, []).append(event)

    right: list[Event] = []
    left: list[Event] = []
    boundary: list[tuple[Fraction, Fraction]] = []
    span_penalty = Fraction(1000)

    for onset in sorted(groups):
        members = sorted(groups[onset], key=lambda e: e.midi)
        heights = [Fraction(e.midi) for e in members]
        predict = centre

        def cost(cut: int) -> Fraction:
            total = Fraction(0)
            low = heights[:cut]
            high = heights[cut:]
            for p in low:
                total += abs(p - predict["left"])
            for p in high:
                total += abs(p - predict["right"])
            for block in (low, high):
                if block and block[-1] - block[0] > max_span:
                    total += span_penalty * (block[-1] - block[0] - max_span)
            return total

        best_cut = min(range(len(members) + 1), key=cost)
        low_block = members[:best_cut]
        high_block = members[best_cut:]
        left.extend(low_block)
        right.extend(high_block)
        for side, block in (("left", low_block), ("right", high_block)):
            if not block:
                continue
            mean = sum(Fraction(e.midi) for e in block) / len(block)
            centre[side] = centre[side] * (1 - HAND_MEMORY) + mean * HAND_MEMORY
        if low_block and high_block:
            boundary.append((onset, (Fraction(low_block[-1].midi) + Fraction(high_block[0].midi)) / 2))
        elif boundary:
            boundary.append((onset, boundary[-1][1]))
        else:
            boundary.append((onset, (centre["left"] + centre["right"]) / 2))

    right.sort(key=lambda e: (e.start, e.midi))
    left.sort(key=lambda e: (e.start, e.midi))
    return {"right": right, "left": left, "boundary": boundary}


# --------------------------------------------------------------------------------------
# notes to notation
# --------------------------------------------------------------------------------------


def key_estimate(events: list[Event]) -> key_module.Key:
    """music21's key analysis, run on the notes rather than on a parsed file.

    Built with the real onsets and lengths because the analysis weights a pitch
    class by how long it sounds; appending the notes end to end would give a
    passing sixteenth the same say as a held bass.
    """
    if not events:
        return key_module.Key("C")
    line = stream.Stream()
    for event in events:
        line.insert(float(event.start), note.Note(pitch.Pitch(ps=event.midi),
                                                  quarterLength=float(event.length)))
    return line.analyze("key")


def relative_by_ending(events: list[Event], estimate: key_module.Key) -> key_module.Key:
    """The estimate, or its relative major/minor if that is where the music ends.

    A key estimate from how often each note sounds cannot tell a key from its
    relative — the A blues scale and C major share most of their notes. The
    lowest note of the last chord is the tiebreak a musician would use.
    """
    if not events:
        return estimate
    last_start = max(e.start for e in events)
    bass = min(e.midi for e in events if e.start == last_start)
    bass_class = bass % 12
    relative = estimate.relative
    if bass_class == int(round(relative.tonic.ps)) % 12 and bass_class != int(round(estimate.tonic.ps)) % 12:
        return relative
    return estimate


def slice_into_chords(
    events: list[Event], bar_length: Fraction, beat: Fraction, unit_for_bar
) -> stream.Stream:
    """The events as one line of chords, a new chord wherever any note starts or stops.

    Every start and end is a boundary; between two boundaries, whatever is
    sounding is one chord. A pitch that carries on from the slice before
    without being struck again is tied to it; one struck again is a new note.
    Written here rather than with music21's `chordify`, which on a loose
    stream of overlapping notes (a played-in MIDI) skipped stretches of time
    and kept ended notes sounding, and with `addTies` tied repeated notes
    together — all three lost notes.

    Every barline is a boundary too, so no chord crosses one. Left to
    `makeNotation`, a piece already tied from the one before that crossed a
    barline was split with its tie reset to "start", and the note read as
    struck again. **And every slice whose length is not a rhythm is cut into
    ones that are** (`notatable_pieces`) before anything is built, so the tie
    bookkeeping below sees them as ordinary slices rather than having to be
    taught about them afterwards.
    """
    line = stream.Stream()
    if not events:
        return line
    last = max(e.end for e in events)
    bar_count = int(last // bar_length) + 2
    bars = {bar_length * i for i in range(bar_count) if bar_length * i <= last}
    boundaries = sorted({e.start for e in events} | {e.end for e in events} | bars)
    filled = [boundaries[0]]
    for left_at, right_at in zip(boundaries, boundaries[1:]):
        unit = unit_for_bar(int(left_at // bar_length))
        pieces = notatable_pieces(left_at % bar_length, right_at - left_at, unit, beat)
        at = left_at
        for piece in pieces[:-1]:
            at += piece
            filled.append(at)
        filled.append(right_at)

    previous: dict[int, tuple[chord.Chord, pitch.Pitch]] = {}
    previous_end: Fraction | None = None
    for left_at, right_at in zip(filled, filled[1:]):
        sounding: dict[int, tuple[Fraction, int | None]] = {}
        for event in events:
            if event.start < right_at and event.end > left_at:
                # Two notes of one pitch at once (a legato overlap): keep the one struck here.
                if event.midi not in sounding or event.start == left_at:
                    sounding[event.midi] = (event.start, event.velocity)
        if not sounding:
            previous, previous_end = {}, None
            continue
        piece = chord.Chord(
            [pitch.Pitch(ps=m) for m in sorted(sounding)],
            quarterLength=float(right_at - left_at),
        )
        velocities = [v for _, v in sounding.values() if v is not None]
        if velocities:
            piece.volume.velocity = max(velocities)
        joined = previous_end is not None and previous_end == left_at
        current: dict[int, tuple[chord.Chord, pitch.Pitch]] = {}
        for p in piece.pitches:
            midi = int(round(p.ps))
            struck_here = sounding[midi][0] == left_at
            if joined and midi in previous and not struck_here:
                before_chord, before_pitch = previous[midi]
                old = before_chord.getTie(before_pitch)
                before_chord.setTie(
                    tie.Tie("continue" if old is not None and old.type == "stop" else "start"),
                    before_pitch,
                )
                piece.setTie(tie.Tie("stop"), p)
            current[midi] = (piece, p)
        line.insert(float(left_at), piece)
        previous, previous_end = current, right_at
    return line


def rebuild_part(
    events: list[Event],
    name: str,
    time_signature: meter.TimeSignature,
    written_key: key_module.Key,
    first_tempo: tempo.MetronomeMark | None,
    unit_for_bar,
    forced_clef: clef.Clef | None = None,
    swing_mark: bool = False,
    as_staff: bool = False,
) -> stream.Part:
    """One readable part from the notes alone, with bars made fresh.

    The notes are taken at their quantized offsets with everything else left
    behind: the MIDI's own bars, key and time signatures and rests. They are
    then cut into one line of chords (`slice_into_chords`), and `makeNotation`
    makes the bars, splitting and tying across barlines and filling the gaps
    with rests.
    """
    bar_length = as_fraction(time_signature.barDuration.quarterLength)
    beat = as_fraction(time_signature.beatDuration.quarterLength)
    line = slice_into_chords(events, bar_length, beat, unit_for_bar)
    # A `PartStaff` when this is one hand of a grand staff: music21 writes a
    # group of them as **one** `<part>` with `<staves>2</staves>`, which is what
    # a piano score is. Two ordinary parts export as two instruments, and the
    # app reads the hand off the printed staff - so a two-part file imported
    # fine and reported both hands as the right one, which is what
    # `converted-import.spec.ts` caught.
    rebuilt = stream.PartStaff() if as_staff else stream.Part()
    rebuilt.partName = name
    rebuilt.partAbbreviation = name[:8]
    pitches = [p for n in line.notes for p in n.pitches]
    if forced_clef is not None:
        rebuilt.insert(0, forced_clef)
    else:
        rebuilt.insert(
            0,
            clef.bestClef(stream.Stream(pitches and [note.Note(p) for p in pitches]), recurse=True)
            if pitches
            else clef.TrebleClef(),
        )
    rebuilt.insert(0, copy.deepcopy(written_key))
    rebuilt.insert(0, copy.deepcopy(time_signature))
    if first_tempo is not None:
        rebuilt.insert(0, copy.deepcopy(first_tempo))
    if swing_mark:
        # The word, not the triplets: what is written is a pair of eighths and
        # the marking is what says how to play them.
        rebuilt.insert(0, expressions.TextExpression("Swing eighths"))
    for n in line.notes:
        # Read the position first: the note that replaces a one-note chord is a
        # new object at offset 0, and placing it there put every single note of
        # a part on the first beat.
        at = n.offset
        # A one-note "chord" is a note, and reads as one.
        if isinstance(n, chord.Chord) and len(n.pitches) == 1:
            single = note.Note(n.pitches[0], quarterLength=n.duration.quarterLength)
            single.tie = n.getTie(n.pitches[0])
            single.volume.velocity = n.volume.velocity
            n = single
        rebuilt.insert(at, n)
    rebuilt.makeNotation(inPlace=True)
    return rebuilt


def sounding_pitches(score: stream.Score) -> Counter:
    """Every note start — (beat from the beginning, MIDI number) — not counting tied continuations.

    When as well as which: a count of pitches alone passed a file whose notes
    had all been moved to the first beat.
    """
    out: Counter = Counter()
    for part in score.parts:
        for n in part.flatten().notes:
            # A chord's ties belong to each of its notes, not to the chord.
            members = list(n.notes) if isinstance(n, chord.Chord) else [n]
            for member in members:
                if continues(member, n):
                    continue
                out[(round(float(n.offset), 3), int(round(member.pitch.ps)))] += 1
    return out


def expected_pitches(parts: list[tuple[str, list[Event]]]) -> Counter:
    """The same shape as `sounding_pitches`, built from the quantised events.

    The comparison the tool makes is between *what the quantiser decided* and
    what came back off the disk — not between the raw performance and the file,
    because the quantiser moves onsets on purpose and a check that called that
    a loss would fire on every live recording. What the quantiser moved is
    reported separately (`moved`).
    """
    out: Counter = Counter()
    for _, events in parts:
        for event in events:
            out[(round(float(event.start), 3), event.midi)] += 1
    return out


def bars_that_do_not_add_up(score: stream.Score) -> list[str]:
    """`part:bar` for every bar but the first and last whose length is not its time signature's."""
    bad = []
    for part in score.parts:
        measures = list(part.getElementsByClass(stream.Measure))
        for i, m in enumerate(measures):
            if i in (0, len(measures) - 1):
                continue
            ts = m.getContextByClass(meter.TimeSignature)
            want = ts.barDuration.quarterLength if ts else 4.0
            for voice in (m.voices or [m]):
                got = sum(e.duration.quarterLength for e in voice.notesAndRests)
                if abs(got - want) > 1e-3:
                    bad.append(f"{part.partName or '?'}:{m.number} ({got} of {want})")
                    break
    return bad


def convert(
    input_path: Path,
    output_path: Path,
    divisors: tuple[int, ...],
    respell: bool,
    force: bool = False,
    forced_key: key_module.Key | None = None,
    hands: str = "auto",
    swing: bool | None = None,
    forced_time_signature: meter.TimeSignature | None = None,
) -> dict:
    if output_path.exists() and not force:
        raise FileExistsError(f"{output_path} exists; pass --force to overwrite it")

    source = read_midi(input_path)
    midi_keys = source["key_signatures"]
    # A wall-clock capture states whatever metre its exporter wrote: all three
    # recordings in `build/midi-real/` say 4/4, and one of them is a waltz. The
    # file is believed unless the caller knows better.
    time_signature = forced_time_signature or source["time_signature"]
    bar_length = as_fraction(time_signature.barDuration.quarterLength)
    beat = as_fraction(time_signature.beatDuration.quarterLength)
    first_tempo = source["tempo"]

    raw: list[tuple[str, list[Event]]] = [
        (track["name"] or f"Part {track['index'] + 1}", track["events"])
        for track in source["tracks"]
        if track["events"]
    ]

    flat = [event for _, events in raw for event in events]
    report = quantise(flat, bar_length=bar_length, beat=beat, divisors=divisors, swing=swing)
    quantised = report["events"]

    split = hands == "split" or (hands == "auto" and len(raw) == 1)
    hand_median: dict[str, float] = {}
    if split and quantised:
        sides = split_hands(quantised)
        parts: list[tuple[str, list[Event]]] = []
        for label, side in (("Right hand", "right"), ("Left hand", "left")):
            if sides[side]:
                parts.append((label, sides[side]))
                ordered = sorted(e.midi for e in sides[side])
                hand_median[side] = float(ordered[len(ordered) // 2])
        boundaries = {b for _, b in sides["boundary"]}
        hand_boundaries = len(boundaries)
    else:
        parts = []
        at = 0
        for name, events in raw:
            parts.append((name, quantised[at : at + len(events)]))
            at += len(events)
        hand_boundaries = 0

    grid_by_bar = report["grid_by_bar"]

    def unit_for_bar(index: int) -> Fraction:
        if not grid_by_bar:
            return Fraction(1, divisors[0])
        return grid_by_bar[min(max(index, 0), len(grid_by_bar) - 1)]

    all_events = [event for _, events in parts for event in events]
    estimated = relative_by_ending(all_events, key_estimate(all_events))
    written_key = forced_key or estimated
    swung = bool(report["swing"]["swung"])

    score = stream.Score()
    # A title, so the file says what it is where it is opened. Without one
    # music21 writes "Music21 Fragment", and the app's import path takes its
    # library row's name from the title (`04` §4) - so every converted file
    # would arrive called the same thing.
    score.insert(0, metadata.Metadata(title=input_path.stem.replace("-", " ").replace("_", " ")))
    clefs = {"Right hand": clef.TrebleClef(), "Left hand": clef.BassClef()}
    # Exactly two parts is a piano: one instrument on two staves, braced. More
    # than two is an ensemble and each one keeps its own part.
    grand_staff = len(parts) == 2
    built: list[stream.Part] = []
    for index, (name, events) in enumerate(parts):
        built.append(
            rebuild_part(
                events,
                name,
                time_signature,
                written_key,
                first_tempo if index == 0 else None,
                unit_for_bar,
                clefs.get(name, clef.TrebleClef() if index == 0 else clef.BassClef())
                if grand_staff
                else clefs.get(name),
                swing_mark=swung and index == 0,
                as_staff=grand_staff,
            )
        )
    for part in built:
        score.insert(0, part)
    if grand_staff:
        # The upper staff names the instrument; the lower carries none, which is
        # how a brace reads.
        built[0].partName = "Piano"
        built[0].partAbbreviation = "Pno."
        built[1].partName = None
        built[1].partAbbreviation = None
        score.insert(0, layout.StaffGroup(built, symbol="brace", barTogether=True))

    respelled = 0
    if respell:
        for n in score.flatten().notes:
            # Each note's own `.pitch`: `Note.pitches` is not the note's pitch
            # object, and respelling through it changed nothing on single notes.
            for member in (n.notes if isinstance(n, chord.Chord) else [n]):
                was = member.pitch.nameWithOctave
                member.pitch = spell_in_key(member.pitch, written_key)
                respelled += int(member.pitch.nameWithOctave != was)

    score.write("musicxml", fp=str(output_path))

    # Read back what was written, which is what anyone opening it will get.
    written = converter.parse(str(output_path))
    before = expected_pitches(parts)
    after = sounding_pitches(written)
    lost = before - after
    added = after - before

    def readable(c: Counter) -> list[str]:
        return [f"{pitch.Pitch(ps=m).nameWithOctave} at beat {o}" + (f" x{k}" if k > 1 else "")
                for (o, m), k in sorted(c.items())]

    broken = bars_that_do_not_add_up(written)
    units = sorted({str(u) for u in grid_by_bar})
    return {
        "parts": [name for name, _ in parts],
        "key": f"{written_key.tonic.name} {written_key.mode}",
        "key_from": "--key" if forced_key else "estimated from the notes",
        "estimated_key": f"{estimated.tonic.name} {estimated.mode}",
        "midi_key_signatures": midi_keys,
        "time_signature": time_signature.ratioString
        + (" (--time-signature)" if forced_time_signature
           else "" if source["had_time_signature"] else " (none in the MIDI; assumed)"),
        "respelled_notes": respelled,
        "notes_in": sum(before.values()),
        "lost": readable(lost),
        "added": readable(added),
        "broken_bars": broken,
        "hands": "split into two" if split else f"{len(parts)} as recorded",
        "hand_median": hand_median,
        "hand_boundaries": hand_boundaries,
        "grid": ", ".join(f"1/{u.denominator} quarter" for u in map(Fraction, units)) or "none",
        "grid_by_bar": grid_by_bar,
        "swing": report["swing"],
        "moved": float(report["moved"]),
        "output": str(output_path),
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("input", type=Path, help="source .mid/.midi file")
    parser.add_argument("-o", "--output", type=Path, default=None,
                        help="output .musicxml path (default: input name, .musicxml)")
    parser.add_argument("--divisors", type=parse_divisors, default=(4, 3),
                        help="candidate grids as comma-separated divisors of a quarter note: 4,3 is "
                             "sixteenths and eighth-note triplets, and one of them is chosen per bar "
                             "(default: 4,3)")
    parser.add_argument("--key", type=parse_key, default=None,
                        help='the key to write and spell in, e.g. "E minor" or "Bb major" (default: estimated)')
    parser.add_argument("--time-signature", type=parse_time_signature, default=None,
                        help='the metre to bar the music in, e.g. "3/4". The metre written in the '
                             "MIDI is used when this is not given, and a wall-clock recording's "
                             "is often a placeholder: all three files in build/midi-real/ say 4/4 "
                             "and one of them is a waltz")
    parser.add_argument("--hands", choices=("auto", "split", "keep"), default="auto",
                        help="split one recorded track into two hands; 'auto' splits when the file "
                             "has exactly one track with notes (default: auto)")
    parser.add_argument("--swing", choices=("auto", "on", "off"), default="auto",
                        help="write off-beats played long-short as straight eighths with a swing "
                             "marking (default: auto, decided from the onsets)")
    parser.add_argument("--no-respell", action="store_true",
                        help="keep the MIDI reader's own spelling instead of spelling from the key")
    parser.add_argument("--force", action="store_true", help="overwrite the output file if it exists")
    args = parser.parse_args(argv)

    if not args.input.exists():
        print(f"error: {args.input} does not exist", file=sys.stderr)
        return 1
    output_path = args.output or args.input.with_suffix(".musicxml")
    swing = {"auto": None, "on": True, "off": False}[args.swing]
    try:
        result = convert(args.input, output_path, args.divisors, respell=not args.no_respell,
                         force=args.force, forced_key=args.key, hands=args.hands, swing=swing,
                         forced_time_signature=args.time_signature)
    except FileExistsError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1

    print(f"wrote {result['output']}")
    print(f"parts: {', '.join(result['parts'])} ({result['hands']})")
    print(f"key: {result['key']} ({result['key_from']})")
    if result["key_from"] == "--key" and result["estimated_key"] != result["key"]:
        print(f"  the notes suggest {result['estimated_key']}")
    if result["midi_key_signatures"]:
        print(f"  key signature(s) in the MIDI, replaced: {', '.join(result['midi_key_signatures'])}")
    print(f"time signature: {result['time_signature']}")
    print(f"grid: {result['grid']}, chosen per bar; largest onset moved {result['moved']:.3f} quarters")
    swing_report = result["swing"]
    if swing_report["swung"]:
        print(f"  written as swing eighths: {swing_report['near_swung']} off-beats near two thirds "
              f"of the beat against {swing_report['near_straight']} near the half, with "
              f"{swing_report['on_beat_share']:.0%} of onsets on a beat")
    if result["hand_median"]:
        print(f"  hands split; the boundary took {result['hand_boundaries']} value(s)")
    if not args.no_respell:
        print(f"respelled {result['respelled_notes']} note(s) to the key")

    failed = False
    if result["lost"] or result["added"]:
        failed = True
        print(f"FAILED: of {result['notes_in']} notes, {len(result['lost'])} lost and "
              f"{len(result['added'])} added on the way through (beats count from the start, in quarters)",
              file=sys.stderr)
        for label, items in (("lost", result["lost"]), ("added", result["added"])):
            if items:
                print(f"  {label}: {', '.join(items[:10])}{' ...' if len(items) > 10 else ''}", file=sys.stderr)
    if result["broken_bars"]:
        failed = True
        shown = ", ".join(result["broken_bars"][:8])
        more = f" and {len(result['broken_bars']) - 8} more" if len(result["broken_bars"]) > 8 else ""
        print(f"FAILED: bars that do not add up: {shown}{more}", file=sys.stderr)
    if failed:
        print("The file was written; read it before trusting it.", file=sys.stderr)
        return 2
    print(f"checked: all {result['notes_in']} notes kept, every bar adds up")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
