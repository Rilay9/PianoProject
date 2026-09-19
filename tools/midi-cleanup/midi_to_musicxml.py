#!/usr/bin/env python3
"""Convert a MIDI file to a cleaned-up MusicXML file.

A personal utility, independent of tools/content/'s curated build pipeline.
It reads a MIDI file with music21 and deals with the problems that make a raw
MIDI import unreadable:

  * timing        - notes are snapped to a rhythmic grid (--divisors)
  * overlaps      - a played-in legato leaves notes overlapping; each part is
                    rebuilt as one line of chords, and a note that crosses
                    another's start or a barline is split and tied
  * bars          - bars are made fresh from the notes, so every bar adds up
  * key           - from --key if given, else estimated from the notes; any key
                    signature already in the MIDI is removed so only one is written
  * spelling      - every note is spelled from the key by interval (see
                    spell_in_key), so B flat in C stays B flat
  * part names    - taken from the MIDI's track names where it has them

After writing, the output is read back and checked: every pitch the MIDI file
holds must still be there, and every bar but the first and last must add up to
its time signature. If either check fails the utility says what failed and
exits with status 2; it does not report a broken file as a success.

Estimating the key and snapping to a grid are guesses. A DAW-quantized MIDI
should come out clean first time; a live performance is worth reading through,
and may need a different --divisors or an explicit --key.

Usage:
    python midi_to_musicxml.py input.mid [-o output.musicxml] [--force]
    python midi_to_musicxml.py input.mid --key "E minor" --divisors 4
    python midi_to_musicxml.py input.mid --no-respell
"""
from __future__ import annotations

import argparse
import copy
import sys
from collections import Counter
from pathlib import Path

from music21 import (
    chord,
    clef,
    converter,
    interval,
    key as key_module,
    meter,
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


def relative_by_ending(score: stream.Score, estimate: key_module.Key) -> key_module.Key:
    """The estimate, or its relative major/minor if that is where the music ends.

    A key estimate from how often each note sounds cannot tell a key from its
    relative — the A blues scale and C major share most of their notes. The
    lowest note of the last chord is the tiebreak a musician would use.
    """
    notes = list(score.flatten().notes)
    if not notes:
        return estimate
    last_start = max(float(n.offset) for n in notes)
    bass = min(p.ps for n in notes if abs(float(n.offset) - last_start) < 1e-4 for p in n.pitches)
    bass_class = int(round(bass)) % 12
    relative = estimate.relative
    if bass_class == int(round(relative.tonic.ps)) % 12 and bass_class != int(round(estimate.tonic.ps)) % 12:
        return relative
    return estimate


def part_name(part: stream.Part, index: int) -> str:
    for inst in part.getInstruments(recurse=True):
        name = inst.partName or inst.instrumentName
        if name:
            return name
    return f"Part {index + 1}"


def continues(member: note.Note, holder: note.NotRest) -> bool:
    """Is this note the tied continuation of one before it?

    Asked of the note, never the chord holding it: a chord's own `tie` does not
    say which of its notes carry on, and reading it as if it did miscounted
    notes both ways.
    """
    del holder
    return member.tie is not None and member.tie.type in ("stop", "continue")


def slice_into_chords(part: stream.Part, bar_length: float) -> stream.Stream:
    """The part's notes as one line of chords, a new chord wherever any note starts or stops.

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
    struck again.
    """
    # The MIDI reader has already cut notes at its own barlines and tied the
    # pieces; a tied piece is the same note carrying on, so it lengthens the
    # event it continues instead of starting a new one.
    events: list[list] = []  # [start, end, midi, pitch, velocity]
    open_events: dict[int, list] = {}
    for n in part.flatten().notes:
        start = float(n.offset)
        end = start + float(n.duration.quarterLength)
        if end - start <= 1e-6:
            continue
        members = list(n.notes) if isinstance(n, chord.Chord) else [n]
        for member in members:
            midi = int(round(member.pitch.ps))
            carried = continues(member, n)
            earlier = open_events.get(midi)
            if carried and earlier is not None and abs(earlier[1] - start) < 1e-6:
                earlier[1] = end
                continue
            velocity = member.volume.velocity if member.volume.velocity is not None else n.volume.velocity
            event = [start, end, midi, copy.deepcopy(member.pitch), velocity]
            events.append(event)
            open_events[midi] = event
    line = stream.Stream()
    if not events:
        return line
    last = max(e[1] for e in events)
    bars = {round(i * bar_length, 6) for i in range(int(last // bar_length) + 2) if i * bar_length <= last + 1e-6}
    boundaries = sorted({round(e[0], 6) for e in events} | {round(e[1], 6) for e in events} | bars)
    previous: dict[int, tuple[chord.Chord, pitch.Pitch]] = {}
    previous_end: float | None = None
    for left, right in zip(boundaries, boundaries[1:]):
        sounding: dict[int, tuple] = {}
        for start, end, midi, p, velocity in events:
            if start < right - 1e-6 and end > left + 1e-6:
                # Two notes of one pitch at once (a legato overlap): keep the one struck here.
                if midi not in sounding or abs(start - left) < 1e-6:
                    sounding[midi] = (start, p, velocity)
        if not sounding:
            previous, previous_end = {}, None
            continue
        piece = chord.Chord([copy.deepcopy(sounding[m][1]) for m in sorted(sounding)],
                            quarterLength=right - left)
        velocities = [v for _, _, v in sounding.values() if v is not None]
        if velocities:
            piece.volume.velocity = max(velocities)
        joined = previous_end is not None and abs(previous_end - left) < 1e-6
        current: dict[int, tuple[chord.Chord, pitch.Pitch]] = {}
        for p in piece.pitches:
            midi = int(round(p.ps))
            struck_here = abs(sounding[midi][0] - left) < 1e-6
            if joined and midi in previous and not struck_here:
                before_chord, before_pitch = previous[midi]
                old = before_chord.getTie(before_pitch)
                before_chord.setTie(tie.Tie("continue" if old is not None and old.type == "stop" else "start"),
                                    before_pitch)
                piece.setTie(tie.Tie("stop"), p)
            current[midi] = (piece, p)
        line.insert(left, piece)
        previous, previous_end = current, right
    return line


def rebuild_part(
    part: stream.Part,
    index: int,
    time_signature: meter.TimeSignature,
    written_key: key_module.Key,
    first_tempo: tempo.MetronomeMark | None,
) -> stream.Part:
    """One readable part from the notes alone, with bars made fresh.

    The notes are taken at their quantized offsets with everything else left
    behind: the MIDI's own bars, key and time signatures and rests. They are
    then cut into one line of chords (`slice_into_chords`), and `makeNotation`
    makes the bars, splitting and tying across barlines and filling the gaps
    with rests.
    """
    line = slice_into_chords(part, float(time_signature.barDuration.quarterLength))
    rebuilt = stream.Part()
    name = part_name(part, index)
    rebuilt.partName = name
    rebuilt.partAbbreviation = name[:8]
    pitches = [p for n in line.notes for p in n.pitches]
    rebuilt.insert(0, clef.bestClef(stream.Stream(pitches and [note.Note(p) for p in pitches]), recurse=True)
                   if pitches else clef.TrebleClef())
    rebuilt.insert(0, copy.deepcopy(written_key))
    rebuilt.insert(0, copy.deepcopy(time_signature))
    if first_tempo is not None and index == 0:
        rebuilt.insert(0, copy.deepcopy(first_tempo))
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
) -> dict:
    if output_path.exists() and not force:
        raise FileExistsError(f"{output_path} exists; pass --force to overwrite it")

    source = converter.parse(str(input_path), quantizePost=True, quarterLengthDivisors=divisors)
    before = sounding_pitches(source)

    midi_keys = sorted({str(k) for k in source.flatten().getElementsByClass(key_module.KeySignature)})
    estimated = relative_by_ending(source, source.analyze("key"))
    written_key = forced_key or estimated
    time_signatures = source.flatten().getTimeSignatures()
    time_signature = copy.deepcopy(time_signatures[0]) if time_signatures else meter.TimeSignature("4/4")
    tempos = source.flatten().getElementsByClass(tempo.MetronomeMark)
    first_tempo = tempos[0] if tempos else None

    score = stream.Score()
    for i, part in enumerate(source.parts):
        if not part.flatten().notes:
            continue
        score.insert(0, rebuild_part(part, i, time_signature, written_key, first_tempo))

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
    after = sounding_pitches(written)
    lost = before - after
    added = after - before

    def readable(c: Counter) -> list[str]:
        return [f"{pitch.Pitch(ps=m).nameWithOctave} at beat {o}" + (f" x{k}" if k > 1 else "")
                for (o, m), k in sorted(c.items())]
    broken = bars_that_do_not_add_up(written)
    return {
        "parts": [p.partName for p in score.parts],
        "key": f"{written_key.tonic.name} {written_key.mode}",
        "key_from": "--key" if forced_key else "estimated from the notes",
        "estimated_key": f"{estimated.tonic.name} {estimated.mode}",
        "midi_key_signatures": midi_keys,
        "time_signature": time_signature.ratioString + ("" if time_signatures else " (none in the MIDI; assumed)"),
        "respelled_notes": respelled,
        "notes_in": sum(before.values()),
        "lost": readable(lost),
        "added": readable(added),
        "broken_bars": broken,
        "output": str(output_path),
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("input", type=Path, help="source .mid/.midi file")
    parser.add_argument("-o", "--output", type=Path, default=None,
                        help="output .musicxml path (default: input name, .musicxml)")
    parser.add_argument("--divisors", type=parse_divisors, default=(4, 3),
                        help="grid as comma-separated divisors of a quarter note: 4,3 is sixteenths and "
                             "eighth-note triplets (default: 4,3)")
    parser.add_argument("--key", type=parse_key, default=None,
                        help='the key to write and spell in, e.g. "E minor" or "Bb major" (default: estimated)')
    parser.add_argument("--no-respell", action="store_true",
                        help="keep the MIDI reader's own spelling instead of spelling from the key")
    parser.add_argument("--force", action="store_true", help="overwrite the output file if it exists")
    args = parser.parse_args(argv)

    if not args.input.exists():
        print(f"error: {args.input} does not exist", file=sys.stderr)
        return 1
    output_path = args.output or args.input.with_suffix(".musicxml")
    try:
        result = convert(args.input, output_path, args.divisors, respell=not args.no_respell,
                         force=args.force, forced_key=args.key)
    except FileExistsError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1

    print(f"wrote {result['output']}")
    print(f"parts: {', '.join(result['parts'])}")
    print(f"key: {result['key']} ({result['key_from']})")
    if result["key_from"] == "--key" and result["estimated_key"] != result["key"]:
        print(f"  the notes suggest {result['estimated_key']}")
    if result["midi_key_signatures"]:
        print(f"  key signature(s) in the MIDI, replaced: {', '.join(result['midi_key_signatures'])}")
    print(f"time signature: {result['time_signature']}")
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
