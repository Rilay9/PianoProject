#!/usr/bin/env python3
"""
Converts any supported score source into the app's one runtime format:
a compressed MusicXML file holding a single piano part with two staves.

docs/03-content-pipeline.md §3 step 2. The normalisation matters more than the
parsing: OSMD renders whatever it is given, but the practice engine assumes a
grand staff (docs/01 §4.1), and sources disagree about how to express one.
Humdrum gives two spines, MuseScore exports sometimes give two *parts* named
"Piano right"/"Piano left", ABC gives two voices. All three end up here as one
part with `<staff>1</staff>` and `<staff>2</staff>`.

Usage:
    python3 tools/content/convert.py IN.krn OUT.mxl [--keep-lyrics] [--tempo 96]
    python3 tools/content/convert.py --batch DIR --out DIR --pattern '**/*.krn'
"""
from __future__ import annotations

import argparse
import copy
import functools
import hashlib
import json
import os
import re
import shutil
import sys
import time
import warnings
import zipfile
from dataclasses import dataclass, field
from fractions import Fraction
from pathlib import Path
from xml.etree import ElementTree

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import BUILD_DIR  # noqa: E402

# music21 is noisy about things we do not control (missing metadata, unusual
# spines); the pipeline reports its own diagnostics instead.
warnings.filterwarnings("ignore")

from abc_tools import (apply_fingerings, apply_voice_clefs, extract_fingerings,  # noqa: E402
                       parse_voice_clefs, prepare_abc)
from music21 import (  # noqa: E402
    bar,
    beam,
    chord,
    clef,
    converter,
    duration,
    dynamics,
    harmony,
    instrument,
    key,
    layout,
    metadata,
    meter,
    note,
    stream,
    tempo,
)

#: What to write when a source has no tempo of its own. docs/03 §3 asks for a
#: default `<sound tempo>`; 96 is a neutral walking tempo that makes Tempo mode
#: usable rather than absurd, and every catalog entry can override it.
DEFAULT_TEMPO_BPM = 96

SUPPORTED_SUFFIXES = {".krn", ".abc", ".ly", ".xml", ".musicxml", ".mxl", ".mid", ".midi"}


class ConversionError(RuntimeError):
    pass


@dataclass
class ConversionResult:
    path: Path
    title: str
    composer: str | None
    measures: int
    notes: int
    staves: int
    tempo_bpm: float
    added_tempo: bool
    stripped_lyrics: int
    fingerings: int
    harmonies: int
    warnings: list[str] = field(default_factory=list)
    #: Note events counted in the source file itself, or None for a format
    #: this module cannot count without music21. See `source_note_events`.
    source_notes: int | None = None
    #: Note events in the written score. Unlike `notes` above, a chord symbol
    #: printed over the staff is not one of them, so this is the number the
    #: source count can be compared against.
    note_events: int = 0


# ---------------------------------------------------------------------------
# counting note events
# ---------------------------------------------------------------------------
#
# Nothing in the pipeline used to count notes, so two ways of losing them ran
# for months without being seen: music21's Humdrum parser drops most of a file
# whose spines split inside a split, and `collapse_to_two` below used to drop
# every note of a third part. The source is therefore counted here, without
# music21, and compared with what came out. See docs/03 §3.

#: How much of a source may go missing before the conversion is refused rather
#: than merely noted. Measured across every imported score: the files that lose
#: a note or two at a spine split lose well under one percent, and the two
#: mechanisms that lose real music lose a third of the file and more. The limit
#: sits in the empty gap between the two populations.
NOTE_LOSS_LIMIT = 0.02

#: A pitch letter in a `**kern` token. An `r` is a rest and never a pitch.
KERN_PITCH = re.compile(r"[a-gA-G]")

#: Humdrum spine-path records: a split, a merge, an exchange, a new spine, an end.
KERN_SPINE_PATH = frozenset({"*^", "*v", "*-", "*+", "*x"})


def kern_note_events(text: str) -> int:
    """
    Note events in the `**kern` spines of a Humdrum file.

    One per data token that carries a pitch: a chord — pitches separated by a
    space inside one token — is one event, and a rest or a null token is none.
    A rest may carry a position letter (`8rff`), which is not a pitch, so the
    `r` decides and not the letters around it.

    Spine paths are followed so that the interpretation of each column is
    known: a `**dynam` or `**text` spine's tokens are full of the letters a–g
    and none of them is a note.
    """
    types: list[str] = []
    count = 0
    for line in text.splitlines():
        if not line or line.startswith("!"):
            continue
        tokens = line.split("\t")
        if line.startswith("**"):
            types = tokens
            continue
        if line.startswith("*"):
            if any(token in KERN_SPINE_PATH for token in tokens):
                moved: list[str] = []
                index = 0
                while index < len(tokens):
                    token = tokens[index]
                    kind = types[index] if index < len(types) else "**?"
                    if token == "*^":
                        moved += [kind, kind]
                    elif token == "*v":
                        # A run of `*v` on one line merges into a single spine.
                        moved.append(kind)
                        while index + 1 < len(tokens) and tokens[index + 1] == "*v":
                            index += 1
                    elif token == "*-":
                        pass
                    elif token.startswith("**"):
                        moved.append(token)
                    else:
                        moved.append(kind)
                    index += 1
                types = moved
            continue
        if line.startswith("="):
            continue
        for index, token in enumerate(tokens):
            if index < len(types) and types[index] != "**kern":
                continue
            if token in (".", ""):
                continue
            if any("r" not in part and KERN_PITCH.search(part) for part in token.split()):
                count += 1
    return count


def musicxml_note_events(data: bytes) -> int:
    """
    Note events in a MusicXML document: every `<note>` that is neither a rest
    nor a continuation of the chord before it.
    """
    root = ElementTree.fromstring(data)
    count = 0
    for element in root.iter():
        if element.tag.split("}")[-1] != "note":
            continue
        children = {child.tag.split("}")[-1] for child in element}
        if "rest" in children or "chord" in children:
            continue
        count += 1
    return count


def musicxml_bytes(path: Path) -> bytes:
    """The MusicXML of a `.xml`/`.musicxml` file, or of an `.mxl`'s rootfile."""
    if path.suffix.lower() != ".mxl":
        return path.read_bytes()
    with zipfile.ZipFile(path) as archive:
        names = [
            name for name in archive.namelist()
            if not name.startswith("META-INF/") and name.lower().endswith((".xml", ".musicxml"))
        ]
        try:
            container = ElementTree.fromstring(archive.read("META-INF/container.xml"))
        except (KeyError, ElementTree.ParseError):
            pass
        else:
            rootfile = container.find(".//{*}rootfile")
            named = rootfile.get("full-path") if rootfile is not None else None
            if named and named in archive.namelist():
                names = [named]
        if not names:
            raise ConversionError(f"{path}: no MusicXML inside the archive")
        return archive.read(names[0])


def source_note_events(path: Path) -> int | None:
    """
    Note events in the source file, counted without music21, or None when the
    format is not one this can count.

    `.abc`, `.ly` and `.mid` return None and are therefore never gated: ABC's
    note count depends on how its voices and repeats are read, LilyPond reaches
    the pipeline through a converter of its own, and a MIDI file has no notion
    of a written note at all.
    """
    suffix = path.suffix.lower()
    try:
        if suffix == ".krn":
            return kern_note_events(path.read_text(encoding="utf-8", errors="replace"))
        if suffix in (".mxl", ".musicxml", ".xml"):
            return musicxml_note_events(musicxml_bytes(path))
    except (OSError, ConversionError, zipfile.BadZipFile, ElementTree.ParseError):
        # A source this cannot read is the parser's problem to report. Saying
        # "unknown" leaves the file ungated rather than refusing it for a
        # reason that has nothing to do with its notes.
        return None
    return None


def count_note_events(score: stream.Stream) -> int:
    """
    Sounding note events in a stream: a chord is one, a rest is none.

    `harmony.ChordSymbol` is a Chord as far as music21 is concerned and so is
    in `.notes`, but it is a letter name printed over the staff rather than
    something the source counted as a note, and including it would let a lead
    sheet's chord symbols paper over notes that had gone missing.
    """
    return len([n for n in score.recurse().notes if not isinstance(n, harmony.ChordSymbol)])


def note_loss(source_notes: int | None, note_events: int) -> tuple[str, str]:
    """
    What a conversion's two note counts mean: `ok`, `warn` or `refuse`.

    Returns the verdict and the sentence to say, empty when there is nothing to
    say. A *gain* is `ok` and deliberately so: normalisation splits a tie that
    crosses a barline into two written notes, so a dozen of the imported scores
    come out with a few more events than they went in with. That is the tie
    being spelled out, not music being invented.
    """
    if not source_notes or source_notes <= 0 or note_events >= source_notes:
        return ("ok", "")
    lost = source_notes - note_events
    fraction = lost / source_notes
    sentence = (
        f"{source_notes} note events in the source, {note_events} in the conversion: "
        f"{lost} lost ({fraction:.1%})"
    )
    return ("refuse" if fraction > NOTE_LOSS_LIMIT else "warn", sentence)


# ---------------------------------------------------------------------------
# parsing
# ---------------------------------------------------------------------------

def prepare_kern(text: str) -> str:
    """
    Neutralises Humdrum's `*kcancel`, which music21 reads as a key signature.

    `*kcancel` asks an engraver to print the naturals that cancel the key
    signature *before* it. It carries no pitch of its own, and music21's
    Humdrum parser turns it into `KeySignature(0)` — C major — inserted at the
    same instant as the real `*k[...]` record. The MusicXML writer then emits
    whichever it meets first, and on Chopin's Ballade no. 3 that was the
    phantom: the score was engraved with no key signature at all and every one
    of A flat major's four flats printed inline, 1,840 accidentals, on a piece
    that sits on the Stage 9 classical rung.

    Removing it here rather than picking between them afterwards, because
    afterwards there is nothing to pick on. The two objects are identical in
    type and in every attribute except `sharps`, and the cancel can sit either
    side of the real record — before it in `047-1-BH.krn`, after it in
    `015-1a-BH-001.krn` — so "keep the first" and "keep the last" are each
    right about half the corpus. Forty-seven of the 1,267 kern files carry one.

    The token becomes `*`, the null interpretation, rather than the line being
    dropped: every spine has to keep its place or the file stops parsing.
    """
    if "*kcancel" not in text:
        return text
    out = []
    for line in text.splitlines(keepends=True):
        if "*kcancel" not in line:
            out.append(line)
            continue
        body = line.rstrip("\r\n")
        out.append("\t".join("*" if token == "*kcancel" else token
                            for token in body.split("\t")) + line[len(body):])
    return "".join(out)


def parse_source(path: Path) -> stream.Score:
    """Parses any supported source into a music21 Score."""
    suffix = path.suffix.lower()
    if suffix not in SUPPORTED_SUFFIXES:
        raise ConversionError(f"unsupported input {suffix} ({path})")
    if suffix == ".ly":
        return parse_lilypond(path)
    if suffix == ".abc":
        # music21 needs the block voice form, and drops `!n!` fingering; see
        # abc_tools for both measurements.
        text = path.read_text(encoding="utf-8", errors="replace")
        parsed = converter.parse(prepare_abc(text), format="abc")
        apply_fingerings(parsed, extract_fingerings(text))
        apply_voice_clefs(parsed, parse_voice_clefs(text))
    elif suffix == ".krn":
        # Read as text so `*kcancel` can be taken out before music21 sees it.
        parsed = converter.parse(
            prepare_kern(path.read_text(encoding="utf-8", errors="replace")),
            format="humdrum",
        )
    else:
        parsed = converter.parse(str(path))
    if isinstance(parsed, stream.Opus):
        # A multi-movement ABC file: take the first score, and say so.
        scores = list(parsed.scores)
        if not scores:
            raise ConversionError(f"{path}: opus with no scores")
        parsed = scores[0]
    if not isinstance(parsed, stream.Score):
        holder = stream.Score()
        holder.insert(0, parsed)
        parsed = holder
    return parsed


def parse_lilypond(path: Path) -> stream.Score:
    """
    LilyPond via python-ly's MusicXML writer.

    docs/03 §2 calls this "simple pieces only" and means it: python-ly handles
    notes, rests, ties, clefs, keys and articulations, and quietly drops the
    sophisticated engraving that a Mutopia edition tends to use. Anything it
    cannot parse raises here rather than producing a half-score.
    """
    try:
        import ly.musicxml
    except ImportError as exc:  # pragma: no cover - dependency is in requirements
        raise ConversionError("python-ly is not installed") from exc

    writer = ly.musicxml.writer()
    writer.parse_text(path.read_text(encoding="utf-8", errors="replace"))
    xml_bytes = writer.musicxml().tostring()
    if not xml_bytes or b"<note" not in xml_bytes:
        raise ConversionError(f"{path}: python-ly produced no notes")
    return converter.parse(xml_bytes.decode("utf-8"), format="musicxml")


# ---------------------------------------------------------------------------
# normalisation
# ---------------------------------------------------------------------------

def average_pitch(part: stream.Stream) -> float:
    pitches = [p.ps for n in part.recurse().notes for p in n.pitches]
    return sum(pitches) / len(pitches) if pitches else 60.0


def leading_clef(part: stream.Stream) -> clef.Clef | None:
    found = part.recurse().getElementsByClass(clef.Clef)
    return found[0] if found else None


def order_as_grand_staff(parts: list[stream.Part]) -> list[stream.Part]:
    """
    Puts the treble staff first.

    The clef is the reliable signal and is checked first; Humdrum in particular
    orders its spines low-to-high, so trusting source order would put the bass
    on the top staff for every kern import. Average pitch is the fallback for
    sources with no clef at all.
    """
    def rank(part: stream.Part) -> tuple[int, float]:
        found = leading_clef(part)
        if isinstance(found, clef.BassClef):
            return (1, -average_pitch(part))
        if isinstance(found, clef.TrebleClef):
            return (0, -average_pitch(part))
        return (0 if average_pitch(part) >= 60 else 1, -average_pitch(part))

    return sorted(parts, key=rank)


def note_strands(container: stream.Stream) -> list[tuple[stream.Stream, list[tuple[float, note.GeneralNote]]]]:
    """
    The note-bearing strands of a measure, and where each of them lives.

    A measure's own notes are one strand and each of its voices is another, so
    two notes that sound together stay in separate strands instead of being
    flattened into a single line the writer would have to express as one. Each
    row is `(offset within the measure, element)`; the stream beside the rows
    is the one to take them out of.
    """
    strands: list[tuple[stream.Stream, list[tuple[float, note.GeneralNote]]]] = []
    loose = [
        (float(container.elementOffset(element)), element)
        for element in container.getElementsByClass(note.GeneralNote)
    ]
    if loose:
        strands.append((container, loose))
    for voice in container.getElementsByClass(stream.Voice):
        start = float(container.elementOffset(voice))
        rows = [
            (start + float(voice.elementOffset(element)), element)
            for element in voice.getElementsByClass(note.GeneralNote)
        ]
        if rows:
            strands.append((voice, rows))
    return strands


def as_voice(rows: list[tuple[float, note.GeneralNote]]) -> stream.Voice:
    """
    One strand re-homed into a Voice, at the offsets it held in its measure.

    A strand that starts after the barline is padded with an invisible rest,
    for the reason `align_voice_offsets` gives: music21's writer backs up to
    the barline before writing a voice, so a voice whose first note is on beat
    three has to say so in its own contents.
    """
    voice = stream.Voice()
    start = min(offset for offset, _ in rows)
    if start > 0:
        padding = note.Rest(quarterLength=start)
        padding.style.hideObjectOnPrint = True
        voice.insert(0.0, padding)
    for offset, element in rows:
        voice.insert(offset, element)
    return voice


def number_voices(part: stream.Stream) -> None:
    """
    Numbers each measure's voices 1, 2, 3.

    music21 mints a voice id from the object's memory address when the source
    did not name one, and writes that id straight into `<voice>`. Two staves
    merged into one can then hand two different strands numbers no reader will
    make sense of; a measure with a single voice is left as it was.
    """
    for measure in part.getElementsByClass(stream.Measure):
        voices = list(measure.getElementsByClass(stream.Voice))
        if len(voices) < 2:
            continue
        for index, voice in enumerate(voices):
            voice.id = str(index + 1)


def merge_part_into(target: stream.Part, extra: stream.Part) -> None:
    """
    Moves every note and rest of `extra` onto `target`'s staff.

    This used to ask `extra` for the offset of a note that lives inside one of
    `extra`'s *measures*. music21 answers that only for a stream the element is
    directly in, so every insert raised, every raise was swallowed by the
    `except` around it, and the entire part disappeared without a word. Two
    scores in the corpus were shipping with a hand missing: a rag lost 194 of
    its 502 note events and an arrangement lost 967 of 1,727.

    Bars are matched on the offset of the measure within its part rather than
    on its number, because the two staves agree about time and need not agree
    about numbering. Each strand of the source becomes a voice of its own on
    the target staff.
    """
    extra_measures = list(extra.getElementsByClass(stream.Measure))
    if not extra_measures:
        # An unbarred part: there are no bars to match on, so the notes go on
        # at the offsets they hold in the part itself and `normalise` bars the
        # staff afterwards.
        flat = extra.flatten()
        for element in list(flat.getElementsByClass(note.GeneralNote)):
            target.insert(float(flat.elementOffset(element)), element)
        return

    homes: dict[float, stream.Measure] = {}
    for measure in target.getElementsByClass(stream.Measure):
        homes.setdefault(round(float(target.elementOffset(measure)), 4), measure)

    for measure in extra_measures:
        strands = note_strands(measure)
        if not strands:
            continue
        offset = round(float(extra.elementOffset(measure)), 4)
        home = homes.get(offset)
        if home is None:
            # The staves do not agree about where the bars are. A bar of its
            # own keeps the music rather than dropping it, and is rare enough
            # to be worth seeing in the output when it happens.
            home = stream.Measure(number=measure.number)
            target.insert(offset, home)
            homes[offset] = home
        else:
            # The staff's own notes become a voice too, so that a measure is
            # never half loose notes and half voices.
            for source, rows in note_strands(home):
                if isinstance(source, stream.Voice):
                    continue
                for _, element in rows:
                    source.remove(element)
                home.insert(0.0, as_voice(rows))
        for source, rows in strands:
            for _, element in rows:
                source.remove(element)
            home.insert(0.0, as_voice(rows))

    number_voices(target)


def collapse_to_two(parts: list[stream.Part], notes: list[str]) -> list[stream.Part]:
    """
    Reduces a score to two staves.

    Sources with more than two parts are usually a piano reduction that kept a
    separate spine for dynamics, or an ensemble score. Empty parts are dropped;
    beyond that the extra parts are merged into the nearest staff by register,
    because a crowded staff is better than a lost one. `merge_part_into` does
    the merging and says what used to go wrong with it; the note-loss gate in
    `convert_file` is what would now catch it if anything did.
    """
    if len(parts) <= 2:
        # A part of nothing but rests is kept here: a right-hand-only beginner
        # tune is still printed on a grand staff, with an empty bass staff the
        # learner can see is empty.
        return parts

    non_empty = [p for p in parts if len(p.recurse().notes) > 0]
    if len(non_empty) != len(parts):
        notes.append(f"dropped {len(parts) - len(non_empty)} empty part(s)")
    if len(non_empty) <= 2:
        return non_empty or parts[:1]

    ordered = order_as_grand_staff(non_empty)
    notes.append(f"merged {len(ordered)} parts into 2 staves by register")
    treble, bass = ordered[0], ordered[-1]
    for extra in ordered[1:-1]:
        merge_part_into(treble if average_pitch(extra) >= 60 else bass, extra)
    return [treble, bass]


def drop_silent_staves(parts: list[stream.Part], notes: list[str]) -> list[stream.Part]:
    """Leaves out a staff that has nothing to play.

    Fourteen of the authored songs are one hand's tune over a bass staff of
    whole-bar rests, so that the page looked like a piano piece. On the phone
    that staff took half of every window for nothing: the tune was engraved at
    half the size it could have been, and the fit paid for a stave nobody was
    reading. The rests are the source's; the app has no use for them.
    """
    sounding = [part for part in parts if any(True for _ in part.recurse().notes)]
    if sounding and len(sounding) < len(parts):
        dropped = len(parts) - len(sounding)
        notes.append(f"dropped {dropped} silent staff(ves) with only rests")
        return sounding
    return parts


def to_part_staff(part: stream.Part, staff_clef: clef.Clef | None) -> stream.PartStaff:
    """Re-homes a Part's elements into a PartStaff, keeping their offsets."""
    staff = stream.PartStaff()
    # Only a real name: music21 warns when an id looks like a memory address,
    # which is exactly what an unnamed part's default id is.
    if isinstance(part.id, str) and not part.id.isdigit():
        staff.id = part.id
    for element in list(part.elements):
        staff.insert(part.elementOffset(element), element)
    if staff_clef is not None and leading_clef(staff) is None:
        staff.insert(0, staff_clef)
    return staff


#: Printed note values music21's MusicXML writer refuses (`typeToMusicXMLType`).
#: `2048th` and `duplex-maxima` fall off the ends of MusicXML's `<type>`
#: vocabulary; `inexpressible` and `zero` are music21 saying it could not find a
#: printed note value for the length at all.
UNWRITABLE_TYPES = frozenset({"2048th", "duplex-maxima", "inexpressible", "zero"})

#: The shortest note MusicXML can name, as a fraction of a quarter: a 1024th.
#: Nothing below may lengthen or shorten a note by as much as this.
SMALLEST_WRITABLE_QL = Fraction(1, 256)


def exact_quarter_length(value) -> Fraction:
    """A duration or an offset as an exact fraction, float noise removed."""
    return Fraction(value).limit_denominator(1_000_000)


def unwritable_type(unit: duration.Duration) -> str:
    """
    The first printed value inside `unit` the MusicXML writer would refuse.

    Both halves matter. The note's own value is written as `<type>`, and the
    tuplet around it is written as `<time-modification>` naming the value it is
    a tuplet *of* — so an ordinary 32nd note refuses to be written when the
    tuplet on it says "sixty in the time of forty-three 2048ths". Returns "" when
    nothing in it would be refused.
    """
    for component in unit.components:
        if component.type in UNWRITABLE_TYPES:
            return component.type
    for tuplet in unit.tuplets:
        for side in (tuplet.durationNormal, tuplet.durationActual):
            if side is not None and side.type in UNWRITABLE_TYPES:
                return side.type
    return ""


def writable_quarter_length(unit: duration.Duration) -> Fraction | None:
    """
    The length `unit`'s own printed notation says it has, when that is not the
    length it claims to last. None when there is nothing to correct.

    Almost every one of these is an editor's rounding. MusicXML counts time in
    integer ticks (`<divisions>`, commonly 480 to the quarter), so an irregular
    tuplet — seven in the time of six, thirty-nine in the time of thirty-two —
    does not divide evenly into ticks, and the editor writes each note of the
    run as the nearest whole tick. The notes then do not add up to the beat they
    fill: fourteen notes of 103 ticks come to 1,442 where the run is three
    quarters, 1,440. The engraving is right and the arithmetic is two ticks out.

    So this is not a quantisation onto a grid of our choosing; it is taking the
    note at its own printed word. Value, dots and tuplet ratio are left exactly
    as the editor wrote them and the sounding length is made to agree with them.

    When the printed notation is itself unusable there is no word to take, so
    nothing is returned and `refuse_unwritable` reports the note instead.
    Rounding it to the nearest value that *can* be printed was tried and is
    wrong: the shortest MusicXML can name is a 1024th, so a sliver can only be
    rounded *up*, which pushes the bar past its own barline and fails at the
    writer anyway — having changed a note on the way.
    """
    if unit.isGrace or len(unit.components) != 1 or unwritable_type(unit):
        # A grace has no sounding length to correct, and a length written as
        # several tied notes is split by the writer before it is typed.
        return None
    actual = exact_quarter_length(unit.quarterLength)
    printed = exact_quarter_length(
        duration.convertTypeToQuarterLength(unit.type, unit.dots, unit.tuplets)
    )
    return None if printed == actual else printed


def rewrite_duration(element: note.GeneralNote) -> None:
    """
    Makes `element` last exactly what it is printed as.

    Rebuilt from the printed value rather than assigned a quarterLength,
    because assigning one makes music21 look for a notation that expresses it —
    which is how the unusable tuplets got there in the first place.
    """
    unit = element.duration
    fresh = duration.Duration(type=unit.type, dots=unit.dots)
    if unit.tuplets:
        # Fresh copies: one Tuplet is shared by every note of its run, and
        # setting it on a new Duration freezes it.
        fresh.tuplets = tuple(copy.deepcopy(tuplet) for tuplet in unit.tuplets)
    element.duration = fresh


def settle_durations(score: stream.Score) -> int:
    """
    Makes every note last what its own notation says, so the score can be written.

    music21's MusicXML writer raises rather than guessing when it is handed a
    length it cannot name, and the three sentences it raised on the PDMX
    shortlist — `Cannot convert "2048th" duration to MusicXML`, `inexpressible
    durations`, and a bare `KeyError` out of `makeTies` — are one fault seen
    from three sides. A run whose tick counts were rounded (see
    `writable_quarter_length`) leaves its bar a tick or two too long; the note
    that then overhangs the barline is tied across it and the remainder is a
    sliver no note value names. Sometimes the sliver is written as a 2048th,
    sometimes as a tuplet of 2048ths, and sometimes the tie lands in a voice
    number the next bar does not have and `makeTies` looks it up anyway.
    Correcting the lengths before the writer sees them removes all three.

    Nothing about the engraving changes: no pitch is touched, no note is added
    or dropped, and every note keeps the printed value, dots and tuplet ratio it
    arrived with. Each note's length moves by less than a 1024th, the shortest
    note MusicXML can name. A length further from its notation than that is not
    a rounding at all — it is a note deliberately written as one value and held
    for another, which MusicXML expresses and this must not touch.

    Within a bar the notes after a corrected one move with it, by the same few
    ticks. That is what makes the bar add up again, and it is why the step runs
    before `align_voice_offsets`, which measures a voice's start.

    A bar is taken across both staves at once, because a run can be. The first
    Ballade's bar 247 is a single cadenza of thirty-nine notes written
    twenty-two in the right hand and seventeen in the left: correcting the
    hands separately would leave the left hand starting where the *uncorrected*
    right hand ended, which is how far the two are apart. So each voice keeps
    its own running correction — that is what holds its notes end to end — and
    a voice that starts mid-bar is led in by the largest correction any other
    voice of the same bar has accumulated by then. Where two hands play the
    same run in parallel, the largest is one hand's, not both added.

    One correction is never made: one that would push a voice past the end of
    its bar when it did not already reach it. A bar that falls a tick short is
    written — the writer fills the gap and says nothing — while a bar a tick
    long is tied across the barline, which is the fault this step exists to
    avoid. Liszt's transcription of *Ständchen*, which converted perfectly
    well, went from seven ticks under one of its bars to one tick over and
    stopped converting; that is how this was found.

    Returns the number of notes whose length was corrected.
    """
    settled = 0
    for bar in bar_groups(score):
        holders: list[stream.Stream] = []
        for measure in bar:
            holders.append(measure)
            holders.extend(measure.voices)
        planned = {id(holder): plan_corrections(holder) for holder in holders}
        room = bar_room(bar, holders)
        for holder in holders:
            corrections = planned[id(holder)]
            if not corrections:
                continue
            shift = lead_in(holder, holders, planned)
            if projected_end(holder, corrections, shift) > room:
                continue
            for element in sorted(holder, key=holder.elementOffset):
                if isinstance(element, stream.Stream):
                    # A voice is corrected as its own holder, from its own start.
                    continue
                if shift:
                    holder.setElementOffset(
                        element, exact_quarter_length(holder.elementOffset(element)) + shift
                    )
                planned_here = corrections.get(id(element))
                if planned_here is None:
                    continue
                _at, actual, target = planned_here
                shift += target - actual
                rewrite_duration(element)
                settled += 1
            holder.coreElementsChanged()
    return settled


def bar_room(bar: list[stream.Measure], holders: list[stream.Stream]) -> Fraction:
    """
    How far into the bar a corrected voice may reach.

    Its own length, or how far the bar already reaches if that is further —
    an irregular bar that holds more than its time signature says is the
    editor's decision and not this step's to change.
    """
    room = Fraction(0)
    for measure in bar:
        try:
            room = max(room, exact_quarter_length(measure.barDuration.quarterLength))
        except Exception:  # noqa: BLE001 — no time signature in scope
            pass
    for holder in holders:
        room = max(room, exact_quarter_length(holder.highestTime))
    return room


def lead_in(
    holder: stream.Stream,
    holders: list[stream.Stream],
    planned: dict[int, dict[int, tuple[Fraction, Fraction, Fraction]]],
) -> Fraction:
    """How far a voice that starts mid-bar has to move with the bar around it."""
    ordered = sorted(holder, key=holder.elementOffset)
    if not ordered:
        return Fraction(0)
    start = exact_quarter_length(holder.elementOffset(ordered[0]))
    if start <= 0:
        return Fraction(0)
    return max(
        (accumulated(planned[id(other)], start) for other in holders if other is not holder),
        default=Fraction(0),
    )


def projected_end(
    holder: stream.Stream,
    corrections: dict[int, tuple[Fraction, Fraction, Fraction]],
    lead: Fraction,
) -> Fraction:
    """Where `holder` would end if its corrections were applied."""
    shift = lead
    end = Fraction(0)
    for element in sorted(holder, key=holder.elementOffset):
        if isinstance(element, stream.Stream):
            continue
        at = exact_quarter_length(holder.elementOffset(element)) + shift
        planned_here = corrections.get(id(element))
        if planned_here is None:
            length = exact_quarter_length(element.duration.quarterLength)
        else:
            _at, actual, target = planned_here
            length = target
            shift += target - actual
        end = max(end, at + length)
    return end


def bar_groups(score: stream.Score) -> list[list[stream.Measure]]:
    """The score's measures, one list per bar, both staves of a bar together."""
    bars: dict[Fraction, list[stream.Measure]] = {}
    for measure in score.recurse().getElementsByClass(stream.Measure):
        at = exact_quarter_length(measure.getOffsetInHierarchy(score))
        bars.setdefault(at, []).append(measure)
    return [bars[at] for at in sorted(bars)]


def plan_corrections(holder: stream.Stream) -> dict[int, tuple[Fraction, Fraction, Fraction]]:
    """
    Which of `holder`'s own notes need a corrected length, and what it is.

    Each entry is where the note sits, what it claims to last and what its own
    notation says it lasts. Keyed by identity rather than by offset, because
    the offsets move as the corrections are applied and two notes can share one.
    """
    corrections: dict[int, tuple[Fraction, Fraction, Fraction]] = {}
    for element in holder.notesAndRests:
        target = writable_quarter_length(element.duration)
        if target is None:
            continue
        actual = exact_quarter_length(element.duration.quarterLength)
        if abs(target - actual) >= SMALLEST_WRITABLE_QL:
            # Further out than the shortest note MusicXML can name, so this is
            # a note deliberately held for something other than its printed
            # value, not an editor's rounding of one.
            continue
        corrections[id(element)] = (
            exact_quarter_length(holder.elementOffset(element)),
            actual,
            target,
        )
    return corrections


def accumulated(
    corrections: dict[int, tuple[Fraction, Fraction, Fraction]], before: Fraction
) -> Fraction:
    """How far a holder's own corrections have moved it by the offset `before`."""
    return sum(
        (target - actual for at, actual, target in corrections.values() if at < before),
        Fraction(0),
    )


def refuse_unwritable(score: stream.Score) -> str:
    """
    The sentence to refuse a score with, or "" when it can be written.

    `settle_durations` corrects what it can recognise as a rounding. What it
    cannot, the MusicXML writer would raise on later with a measure number and
    no way back, so it is said here instead, in a sentence naming the bar and
    the length. Refusing is the point: the alternative is a note silently
    dropped or squashed to nothing.

    A rest the writer itself lets through is not counted — it skips a hidden
    rest it cannot name rather than raising, and a whole-bar rest is written
    with no `<type>` at all.
    """
    for measure in score.recurse().getElementsByClass(stream.Measure):
        for element in measure.recurse().notesAndRests:
            if element.duration.isGrace:
                continue
            if isinstance(element, note.Rest) and (
                element.style.hideObjectOnPrint
                or exact_quarter_length(element.duration.quarterLength)
                == exact_quarter_length(measure.barDuration.quarterLength)
            ):
                continue
            refused = unwritable_type(element.duration)
            if refused:
                return (
                    f"bar {measure.number} has a {element.classes[0].lower()} lasting "
                    f"{exact_quarter_length(element.duration.quarterLength)} of a quarter, "
                    f"which no printed note value expresses ({refused}); it cannot be "
                    "written as MusicXML without dropping it"
                )
    return ""


def align_voice_offsets(score: stream.Score) -> int:
    """
    Moves every voice to the start of its measure, padding with a rest.

    music21's MusicXML writer assumes a voice begins where its measure does: it
    emits `<backup>` all the way to the barline and then writes the voice's
    notes from there. A `stream.Voice` sitting at a later offset — which is
    exactly what a `**kern` spine that splits mid-bar produces — is therefore
    written a beat or more early, and the file no longer says what the edition
    says.

    Measured on craigsapp's Joplin edition: four of the eight rags came out
    with displaced voices, up to 50 notes in *Pine Apple Rag*. Padding the
    voice with a leading rest states the same music in the one shape the
    writer can express. The rest is marked invisible, so the engraving is
    unchanged; the timing is what this is for.

    Returns the number of voices moved.
    """
    moved = 0
    for measure in score.recurse().getElementsByClass(stream.Measure):
        for voice in list(measure.getElementsByClass(stream.Voice)):
            offset = float(measure.elementOffset(voice))
            if offset <= 0:
                continue
            padding = note.Rest(quarterLength=offset)
            padding.style.hideObjectOnPrint = True
            voice.insertAndShift(0.0, padding)
            measure.setElementOffset(voice, 0.0)
            moved += 1
    return moved


#: What a `<measure>` may state about itself at an instant, in the order the
#: MusicXML writer wants them inside an `<attributes>` tag.
LOOSE_ATTRIBUTE_CLASSES = (clef.Clef, key.KeySignature, meter.TimeSignature)


def place_loose_attributes(score: stream.Score) -> int:
    """
    Puts a key signature, time signature or clef into the bar it falls in.

    Humdrum states a change of key between two bars — `=54 … =|| *k[b-e-]
    =55` — and music21's parser hands that back as a `KeySignature` sitting in
    the *part*, outside every measure, at the offset the record stood at. The
    MusicXML writer has one rescue for that and only one: `fixupNotationMeasured`
    lifts loose attributes into the **first** measure, so an opening signature
    survives and every later one is dropped without a word.

    What reaches the page then is a strain engraved in the key of the strain
    before it. *Cleopha* modulates at bar 54 and the second half of the rag was
    printed with one flat where Joplin wrote two, every B flat of it spelled
    out as an accidental. That is the fault `drop_superseded_key_signatures`
    was written for, arriving by the other door: there, two signatures at one
    instant and the wrong one printed; here, the right one and nowhere to
    print it.

    So each loose attribute is moved into the measure that holds its offset, at
    the offset it has inside that measure — which the writer knows how to
    write, as an `<attributes>` tag in the middle of a bar if that is where it
    falls. A record standing exactly on a barline belongs to the bar it opens,
    not to the one it closes, so a measure that *starts* there is preferred to
    the one that ends there.

    Every staff is done, because the signature has to be printed on both. One
    that falls past the last barline has no bar to go in and is left where it
    is, for the writer to ignore as it does now.

    Returns the number of attributes placed.
    """
    placed = 0
    for staff in score.getElementsByClass(stream.Stream):
        measures = list(staff.getElementsByClass(stream.Measure))
        if not measures:
            continue
        spans = [
            (
                exact_quarter_length(staff.elementOffset(measure)),
                exact_quarter_length(measure.duration.quarterLength),
                measure,
            )
            for measure in measures
        ]
        for element in list(staff.getElementsByClass(LOOSE_ATTRIBUTE_CLASSES)):
            at = exact_quarter_length(staff.elementOffset(element))
            opens = next((span for span in spans if span[0] == at and span[1] > 0), None)
            holds = opens or next(
                (span for span in spans if span[0] <= at < span[0] + span[1]), None
            )
            if holds is None:
                continue  # after the last barline: nothing to put it in
            start, _length, measure = holds
            staff.remove(element)
            measure.insert(at - start, element)
            placed += 1
    return placed


def is_seam(measure: stream.Measure) -> bool:
    """True when a measure holds no music at all — not a note, not a rest."""
    return not measure.recurse().notesAndRests and exact_quarter_length(measure.highestTime) == 0


def drop_seam_bars(score: stream.Score) -> int:
    """
    Removes a "bar" that holds nothing but the barline that made it.

    The `=||` that splits a bar in two (see `declare_partial_bars`) as often
    falls *on* a barline as inside one — `4a 4b / =|| / *k[d-] / =70!|:` — and
    music21 makes a measure out of what stands between the two records: no
    note, no rest, nothing but the barline and the interpretations that came
    with it. It is not a bar of silence; silence is written with rests. It is
    the seam between two strains.

    The MusicXML writer cannot tell the difference and fills it out like any
    other short bar, so the piece grows a whole silent bar at every change of
    strain, and everything after the first one is late by a bar. Chopin's op. 18
    waltz grows one where it turns to D flat.

    Whatever the seam carries — the key signature of the new strain, a repeat
    mark — moves to the bar it introduces, which is where it takes effect, and
    the barline itself is given to whichever neighbour has none of its own;
    both usually have it already, since the seam is drawn between two barlines
    that are themselves recorded. Then the measure goes.

    Only a seam both staves agree on is dropped. The two are written into one
    `<part>` measure by measure at the end, so a bar removed from one hand and
    not the other would set the hands a bar apart for the rest of the piece.

    Returns the number of measures removed, counted once per bar.
    """
    staves = [
        staff
        for staff in score.getElementsByClass(stream.Stream)
        if staff.getElementsByClass(stream.Measure)
    ]
    runs = [list(staff.getElementsByClass(stream.Measure)) for staff in staves]
    if not runs or len({len(run) for run in runs}) != 1:
        # The staves already disagree about how many bars there are; lining
        # them up is not this step's to attempt.
        return 0
    dropped = 0
    gone: set[int] = set()
    for position in range(len(runs[0])):
        if not all(is_seam(run[position]) for run in runs):
            continue
        # Two seams in a row: the neighbour to hand a barline back to is the
        # last bar still standing, not the one just removed.
        back = position - 1
        while back in gone:
            back -= 1
        for staff, run in zip(staves, runs):
            measure = run[position]
            following = run[position + 1] if position + 1 < len(run) else None
            previous = run[back] if back >= 0 else None
            for element in list(measure.elements):
                if isinstance(element, bar.Barline):
                    continue
                measure.remove(element)
                if following is not None:
                    following.insert(0, element)
                elif previous is not None:
                    previous.insert(exact_quarter_length(previous.highestTime), element)
            barline = measure.rightBarline or measure.leftBarline
            if barline is not None:
                if previous is not None and previous.rightBarline is None:
                    previous.rightBarline = barline
                elif following is not None and following.leftBarline is None:
                    following.leftBarline = barline
            staff.remove(measure)
        gone.add(position)
        dropped += 1
    return dropped


def declare_partial_bars(score: stream.Score) -> int:
    """
    Says of a bar the edition wrote short that it is meant to be short.

    music21's MusicXML writer fills every measure out to the length its time
    signature says *before* it writes a note of it: `GeneralObjectExporter`
    calls `makeRests(timeRangeFromBarDuration=True, fillGaps=True)` on the copy
    it exports. A bar the edition wrote short therefore comes back with a rest
    on the end, the bar is now a full bar long, and every note after it in the
    file is late by what was added. Nothing warns; the score simply says
    something the edition does not.

    `**kern` writes a change of strain exactly that way. In craigsapp's Joplin
    edition, *Cleopha*'s bar 54 is

        4F FF / 8FF FFF / =|| / *k[b-e-] / 8r 8f / =55!|:

    — a 2/4 bar whose last eighth stands *after* a mid-bar double barline as
    the pickup into the next strain, with the key change at the double bar.
    music21 reads the page as written: a bar of three eighths, then an
    unnumbered bar of one. Filled out, the two became four beats where the
    edition has two, and the whole second half of the rag played a bar late
    behind a beat and a half of silence Joplin never wrote.

    What says otherwise is the same `paddingLeft` that makes an opening
    anacrusis survive the writer, and the two cases are the same case. It is
    decided here per *bar*, across both staves at once, and only when the bar
    is short in all of them: one hand resting through the end of a bar the
    other hand fills is not a short bar, and the rest the writer adds there is
    the right engraving and moves nothing.

    Which side of the bar is missing is a reading of what the bar is, and
    `makeBeams` asks — `paddingLeft` beams the notes as the *end* of a bar,
    `paddingRight` as its beginning. So the first bar of a piece, and the
    second half of a bar split in two, are short at the front; everything else
    — a closing bar that completes the opening anacrusis, a bar an editor
    wrote irregular — is short at the end.

    Merging such a pair into one full bar with the double barline inside it was
    the other candidate, and MusicXML can express a mid-measure `<barline>`.
    music21 cannot write one: its `MeasureExporter` lists `Barline` in
    `ignoreOnParseClasses` and emits only a measure's own left and right
    barlines, so Joplin's double bar and the repeat sign after it would have
    been dropped on the way out. Keeping the two measures keeps both.

    Returns the number of measures told that they are short.
    """
    declared = 0
    #: How much the bar before this one was missing, when it was short at all.
    before: Fraction | None = None
    for position, bar in enumerate(bar_groups(score)):
        full = Fraction(0)
        for measure in bar:
            try:
                full = max(full, exact_quarter_length(measure.barDuration.quarterLength))
            except Exception:  # noqa: BLE001 — no time signature in scope
                pass
        reach = max(
            (exact_quarter_length(measure.highestTime) for measure in bar), default=Fraction(0)
        )
        missing = full - reach
        if not full or reach <= 0 or missing < SMALLEST_WRITABLE_QL:
            # An empty bar is a bar's rest and the writer should draw it; a bar
            # short by less than the shortest note MusicXML can name has no
            # rest to draw at all.
            before = None
            continue
        # Short at the front when it opens the piece, or when it is what is
        # left of the bar before — the half bar after a mid-bar double barline.
        at_front = position == 0 or before == reach
        for measure in bar:
            already = exact_quarter_length(measure.paddingLeft) + exact_quarter_length(
                measure.paddingRight
            )
            if already >= missing:
                continue  # the parser already said so: an anacrusis it recognised
            if at_front:
                measure.paddingLeft = exact_quarter_length(measure.paddingLeft) + missing - already
                if position and measure.number == 0:
                    # The remainder of a split bar is not a bar of its own, and
                    # an engraver gives it no number: `implicit="yes"` says so,
                    # rather than printing a "0" in the middle of the piece.
                    measure.showNumber = stream.enums.ShowNumber.NEVER
            else:
                measure.paddingRight = (
                    exact_quarter_length(measure.paddingRight) + missing - already
                )
            declared += 1
        before = missing
    return declared


#: Printed note values a beam may not be attached to (VexFlow enforces it).
UNBEAMABLE_TYPES = frozenset({"quarter", "half", "whole", "breve", "longa", "maxima"})


def drop_superseded_key_signatures(score: stream.Score) -> int:
    """
    Removes a key signature another one replaces at the same instant.

    A bar cannot have two key signatures, and music21's Humdrum parser writes
    three into the first bar of some Chopin first editions: a default C at
    offset 0 and then the real `*k[...]` twice behind it. The MusicXML writer
    emits the first one it finds, so the score is engraved with **no key
    signature at all** and every accidental of the home key is printed inline
    for the whole piece.

    Three of the 1,199 scores in the built catalogue were like this, and they
    are not obscure: Chopin's Ballade no. 3, which is on the Stage 9 classical
    rung, his Scherzo no. 4, and the third movement of the B minor sonata. The
    source is right — `047-1-BH.krn` line 17 is `*k[b-e-a-d-]`, four flats —
    so nothing was wrong with the edition, only with what reached the page.
    Ballade no. 3 printed 1,840 accidentals where a key signature would have
    carried four of them.

    Which of them to keep is the whole subtlety, and "the last one" is wrong.
    `key.Key` is a subclass of `key.KeySignature`, and the two Humdrum records
    mean different things: `*k[...]` is the signature **printed on the page**
    and `*g#:` is an analysis of what key the music is in. music21 turns the
    second into a `Key` whose `sharps` comes from the tonic, which need not be
    what the engraver printed — Chopin's Mazurka op. 33 no. 1 is in G sharp
    minor, five sharps, and the first edition prints four. Keeping the last
    element there would replace the edition's own signature with a
    musicologist's reading of it, on eleven scores.

    So: the engraved signature is the last plain `KeySignature`, and a `Key` is
    only used when there is no plain one. A signature that another supersedes
    at the same instant could not have been seen, and goes.

    Returns the number removed.
    """
    removed = 0
    for holder in [score, *score.recurse().getElementsByClass(stream.Stream)]:
        signatures = list(holder.getElementsByClass(key.KeySignature))
        if len(signatures) < 2:
            continue
        by_offset: dict[float, list] = {}
        for signature in signatures:
            by_offset.setdefault(float(holder.elementOffset(signature)), []).append(signature)
        for together in by_offset.values():
            if len(together) < 2:
                continue
            engraved = [s for s in together if not isinstance(s, key.Key)]
            keep = engraved[-1] if engraved else together[-1]
            for superseded in together:
                if superseded is keep:
                    continue
                holder.remove(superseded)
                removed += 1
    return removed


def clean_beams(score: stream.Score) -> int:
    """
    Removes beams the engraver will refuse, keeping every note.

    VexFlow — the engraver underneath OpenSheetMusicDisplay — rejects two
    things music21's MusicXML writer emits from Humdrum sources, and it rejects
    them by throwing, so the score does not render at all:

      * a **grace note carrying a beam `end` with no `begin`**. Chopin's
        Op. 9 no. 2 has fifteen ornamental grace notes and one of them ends a
        beam that never started; VexFlow builds an empty note group from it and
        reports "Invalid note initialization object: {}".
      * a **beam on a quarter note or longer**, which is not a legal beam:
        "Beams can only be applied to notes shorter than a quarter note."

    Beams are engraving, not music: dropping them changes how a passage looks
    and nothing about what it sounds like or when it happens. Fifteen of the
    182 Chopin first editions would not render at all without this.

    Returns the number of notes whose beams were dropped.
    """
    cleaned = 0
    for element in score.recurse().notes:
        beams = getattr(element, "beams", None)
        if beams is None or not beams.beamsList:
            continue
        graceful = getattr(element.duration, "isGrace", False)
        # The engraver reads the printed *type*, not the sounding length: a
        # quarter note inside a tuplet lasts less than a quarter and is still
        # spelled "quarter", and VexFlow refuses to beam it either way.
        too_long = element.duration.type in UNBEAMABLE_TYPES
        if graceful or too_long:
            element.beams = beam.Beams()
            cleaned += 1
    return cleaned


def insert_tempo(staff: stream.PartStaff, bpm: float) -> None:
    """
    Puts a metronome mark where MusicXML export will actually find it.

    A mark inserted at the staff's own offset 0 is silently dropped when the
    staff is already divided into measures — measured: the LilyPond fixture
    came out with no `<sound tempo>` at all. It has to go inside the first
    measure.
    """
    mark = tempo.MetronomeMark(number=bpm)
    measures = staff.getElementsByClass(stream.Measure)
    if measures:
        measures[0].insert(0, mark)
    else:
        staff.insert(0, mark)


def normalise(score: stream.Score, *, keep_lyrics: bool, tempo_bpm: float | None) -> tuple[stream.Score, ConversionResult]:
    """Turns a parsed score into the app's canonical grand staff."""
    notes: list[str] = []
    parts = list(score.parts)
    if not parts:
        raise ConversionError("score has no parts")

    parts = collapse_to_two(parts, notes)
    parts = order_as_grand_staff(parts)
    parts = drop_silent_staves(parts, notes)

    if len(parts) == 1:
        notes.append("source had a single staff; kept as one")

    default_clefs = [clef.TrebleClef(), clef.BassClef()]
    staves = [to_part_staff(part, default_clefs[i] if i < 2 else None) for i, part in enumerate(parts)]

    out = stream.Score()
    meta = score.metadata or metadata.Metadata()
    out.insert(0, meta)
    for staff in staves:
        # One instrument for the whole grand staff, or MusicXML export invents
        # a second score-part.
        for existing in list(staff.recurse().getElementsByClass(instrument.Instrument)):
            existing.activeSite.remove(existing)
        staff.insert(0, instrument.Piano())
        out.insert(0, staff)
    if len(staves) > 1:
        out.insert(0, layout.StaffGroup(staves, name="Piano", abbreviation="Pno.", symbol="brace", barTogether=True))

    # Before `align_voice_offsets`, which pads a voice with a rest as long as
    # the voice's own start: a start measured off lengths that do not add up is
    # a rest no note value names.
    settled = settle_durations(out)
    if settled:
        notes.append(f"{settled} durations quantised to the printed note value")

    displaced = align_voice_offsets(out)
    if displaced:
        notes.append(f"moved {displaced} mid-bar voice(s) to the barline with a hidden rest")

    unbeamed = clean_beams(out)
    if unbeamed:
        notes.append(f"dropped unrenderable beams from {unbeamed} note(s)")

    # Before the key signatures are deduplicated, because a seam hands the one
    # it carries to the bar it introduces, which may have its own.
    seams = drop_seam_bars(out)
    if seams:
        notes.append(f"removed {seams} bar(s) holding nothing but a barline record")

    # Also before the deduplication below, so a signature put into a bar that
    # already has one at the same instant is settled by the same rule.
    placed = place_loose_attributes(out)
    if placed:
        notes.append(f"moved {placed} key/time signature(s) or clef(s) into the bar they fall in")

    shadowed = drop_superseded_key_signatures(out)
    if shadowed:
        notes.append(f"removed {shadowed} key signature(s) replaced at the same instant")

    stripped = 0
    if not keep_lyrics:
        for element in out.recurse().notes:
            if getattr(element, "lyrics", None):
                stripped += len(element.lyrics)
                element.lyrics = []

    existing_tempo = list(out.recurse().getElementsByClass(tempo.MetronomeMark))
    added_tempo = False
    if tempo_bpm is not None:
        for mark in existing_tempo:
            mark.activeSite.remove(mark)
        insert_tempo(staves[0], float(tempo_bpm))
        effective = float(tempo_bpm)
        added_tempo = True
    elif existing_tempo:
        effective = float(existing_tempo[0].getQuarterBPM() or DEFAULT_TEMPO_BPM)
        # One mark, on the top staff. music21's ABC reader puts a tempo in
        # every voice, and OSMD dutifully draws all of them: an authored tune
        # came out with "♩=84" twice, once over the staff and once beside the
        # first note.
        for mark in existing_tempo[1:]:
            if mark.activeSite is not None:
                mark.activeSite.remove(mark)
    else:
        insert_tempo(staves[0], float(DEFAULT_TEMPO_BPM))
        effective = float(DEFAULT_TEMPO_BPM)
        added_tempo = True
        notes.append(f"no tempo in source; added {DEFAULT_TEMPO_BPM} bpm")

    measures = max((len(s.getElementsByClass(stream.Measure)) for s in staves), default=0)
    if measures == 0:
        # kern and ABC both hand back unbarred streams for some inputs.
        for staff in staves:
            staff.makeMeasures(inPlace=True)
        measures = max((len(s.getElementsByClass(stream.Measure)) for s in staves), default=0)
        notes.append("source had no measures; bars derived from the time signature")

    renumbered = renumber_measures(staves)
    if renumbered:
        notes.append("first bar was numbered 0 without being a pickup; bars renumbered from 1")

    # Last, because it reads the bars as they will be written: after the
    # lengths are settled, after a mid-bar voice has been led in, and after a
    # source with no barlines has been given some.
    partial = declare_partial_bars(out)
    if partial:
        notes.append(f"{partial} bar(s) shorter than the time signature kept as written")

    # Said here, with the bar and the length, rather than by the MusicXML
    # writer minutes later with neither.
    unwritable = refuse_unwritable(out)
    if unwritable:
        raise ConversionError(unwritable)

    # `notes` counts every element music21 calls a note, chord symbols
    # included, and other tools read it with that meaning; `note_events` is the
    # sounding count the note-loss gate compares against the source.
    note_count = len([n for n in out.recurse().notes])
    event_count = count_note_events(out)
    fingerings = count_fingerings(out)
    harmonies = len(list(out.recurse().getElementsByClass(harmony.ChordSymbol)))

    result = ConversionResult(
        path=Path("."),
        title=(meta.title or "").strip() or "Untitled",
        composer=(meta.composer or None),
        measures=measures,
        notes=note_count,
        staves=len(staves),
        tempo_bpm=effective,
        added_tempo=added_tempo,
        stripped_lyrics=stripped,
        fingerings=fingerings,
        harmonies=harmonies,
        warnings=notes,
        note_events=event_count,
    )
    return out, result


def renumber_measures(staves: list[stream.PartStaff]) -> bool:
    """
    Numbers bars from 1 when the source numbered them from 0 without a pickup.

    music21's ABC reader hands back a first measure numbered 0 for a tune that
    starts on a full bar, and OSMD prints that number at the head of the first
    system: an authored song opened at "bar 0" and the second system said "1"
    (P21e A4). A real pickup — a first bar shorter than the time signature — is
    the one case where 0 is right, and it is left alone.

    Returns True when anything changed.
    """
    changed = False
    for staff in staves:
        measures = list(staff.getElementsByClass(stream.Measure))
        if not measures or measures[0].number != 0:
            continue
        first = measures[0]
        try:
            full = float(first.barDuration.quarterLength)
        except Exception:  # noqa: BLE001 — no time signature in scope; treat as full
            full = float(first.duration.quarterLength)
        if float(first.duration.quarterLength) + 1e-6 < full:
            continue  # a pickup: numbered 0 on purpose
        for index, measure in enumerate(measures):
            measure.number = index + 1
        changed = True
    return changed


def count_fingerings(score: stream.Stream) -> int:
    from music21 import articulations

    total = 0
    for element in score.recurse().notes:
        targets = [element] if isinstance(element, note.Note) else list(getattr(element, "notes", []))
        if isinstance(element, chord.Chord):
            targets = [element, *element.notes]
        for target in targets:
            total += len(
                [a for a in getattr(target, "articulations", []) if isinstance(a, articulations.Fingering)]
            )
    return total


# ---------------------------------------------------------------------------
# writing
# ---------------------------------------------------------------------------

#: music21 mints part and instrument ids from object identity, so they look
#: like `P64fa5e9c10000199a0c6ce0460494465` and are different every run.
MUSIC21_MINTED_ID = re.compile(r"^[A-Za-z][0-9a-f]{16,}$")

#: A fixed timestamp for every zip entry. 1980-01-01 is the earliest a DOS zip
#: field can express, and is what reproducible-build tooling conventionally uses.
ZIP_EPOCH = (1980, 1, 1, 0, 0, 0)


def deterministic_ids(xml_text: str) -> str:
    """
    Renames music21's minted part/instrument ids to `P1`, `I1`, `P2`, …

    Without this the pipeline is not reproducible: the same source converted
    twice produces different bytes, because music21 derives these ids from
    Python object identity. Three consequences, all of them things this phase
    is about — the `checksum` recorded in the catalog's provenance block says a
    file changed when only the run did; the render manifest is keyed on the
    output file's sha256 and would re-engrave a score nobody touched; and two
    machines converting the same edition disagree about what they produced.

    The ids are internal cross-references (`<score-part>` ↔ `<part>`,
    `<score-instrument>` ↔ `<midi-instrument>`), so renaming them consistently
    is invisible to a reader — and `P1`/`I1` is what MuseScore and Finale emit
    anyway. Done as text rather than through ElementTree because parsing and
    re-serialising would drop the XML declaration and the DOCTYPE.
    """
    seen: dict[str, str] = {}
    for pattern, prefix in ((r'<score-part id="([^"]+)"', "P"), (r'<score-instrument id="([^"]+)"', "I")):
        for found in re.findall(pattern, xml_text):
            if found in seen or not MUSIC21_MINTED_ID.match(found):
                continue
            seen[found] = f"{prefix}{sum(1 for v in seen.values() if v.startswith(prefix)) + 1}"
    for old, new in seen.items():
        xml_text = xml_text.replace(f'"{old}"', f'"{new}"')
    return xml_text


def replace_atomically(staged: Path, path: Path, attempts: int = 6) -> None:
    """
    `staged.replace(path)`, retried, because Windows lets other processes veto it.

    On Windows a rename fails with `PermissionError` (WinError 5) while any other
    handle to either file is open, and the commonest holder is a virus scanner
    reading the `.tmp` the line above has just finished writing. It is transient
    and it is measured in milliseconds, but the whole content build dies on it:
    the generate step wipes `scores/generated/` before it starts, so a failure
    part-way leaves the catalogue referencing hundreds of files that no longer
    exist, and every later step reports them as missing. That happened three
    times in a row here, on a different file each run, which is the signature of
    a scanner rather than of anything this code is doing wrong.

    Six attempts over about a second. Any longer and a genuine permission problem
    — a read-only file, a directory the build cannot write — would be hidden
    behind a wait instead of being reported, so the last failure is re-raised.
    """
    for attempt in range(attempts):
        try:
            staged.replace(path)
            return
        except PermissionError:
            if attempt == attempts - 1:
                raise
            time.sleep(0.05 * (2**attempt))


def normalise_archive(path: Path) -> None:
    """
    Rewrites a `.mxl` so its bytes depend only on its music.

    Two things in a zip are wall-clock: the per-entry modification time, and —
    through `deterministic_ids` above — the ids music21 minted while it was
    running. Both are pinned here. Entry order is preserved rather than sorted,
    because the MXL container wants `META-INF/container.xml` to stay where the
    writer put it.
    """
    with zipfile.ZipFile(path) as archive:
        entries = [(info.filename, archive.read(info.filename)) for info in archive.infolist()]

    staged = path.with_suffix(path.suffix + ".tmp")
    with zipfile.ZipFile(staged, "w", zipfile.ZIP_DEFLATED) as archive:
        for name, data in entries:
            if name.lower().endswith((".xml", ".musicxml")):
                data = deterministic_ids(data.decode("utf-8")).encode("utf-8")
            info = zipfile.ZipInfo(name, date_time=ZIP_EPOCH)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o600 << 16
            archive.writestr(info, data)
    replace_atomically(staged, path)


def write_mxl(score: stream.Score, out_path: Path) -> Path:
    """
    Writes MusicXML. music21 picks the format from the suffix.

    The output is then normalised so that the same music always produces the
    same bytes — see `normalise_archive`.
    """
    out_path.parent.mkdir(parents=True, exist_ok=True)
    written = score.write("musicxml", fp=str(out_path))
    written_path = Path(str(written))
    if written_path != out_path:
        written_path.replace(out_path)
    if out_path.suffix.lower() == ".mxl":
        normalise_archive(out_path)
    else:
        out_path.write_text(
            deterministic_ids(out_path.read_text(encoding="utf-8")), encoding="utf-8"
        )
    return out_path


# ---------------------------------------------------------------------------
# conversion cache
# ---------------------------------------------------------------------------

#: Bump to invalidate every existing entry without deleting the directory.
CACHE_VERSION = 2

CACHE_DIR = BUILD_DIR / "cache" / "convert"

#: Set by `--no-cache` so a build.py flag reaches the importers, which call
#: `cached_convert` in their own subprocesses.
NO_CACHE_ENV = "PIANOPATH_NO_CACHE"


@dataclass
class CacheStats:
    """Counted per process; each importer prints it in its summary line."""

    hits: int = 0
    misses: int = 0

    def summary(self) -> str:
        return f"{self.hits} cached, {self.misses} converted"


CACHE_STATS = CacheStats()


@functools.lru_cache(maxsize=1)
def tool_fingerprint() -> str:
    """
    A digest of everything except the source that decides what a conversion produces.

    `convert.py` and `abc_tools.py` are the two files whose text changes the
    output; music21's version changes it without either file moving. All three
    go in the key, which is the cache's entire correctness argument: a cache
    that keys on every input to the answer can only change *when* the answer is
    computed, never what it is.
    """
    from music21 import __version__ as music21_version

    digest = hashlib.sha256()
    here = Path(__file__).resolve().parent
    for name in ("convert.py", "abc_tools.py"):
        digest.update((here / name).read_bytes())
    digest.update(music21_version.encode("utf-8"))
    digest.update(f"v{CACHE_VERSION}".encode("ascii"))
    return digest.hexdigest()


def cache_key(src: Path, **options: object) -> str:
    """
    The key for one conversion: source bytes + the tool fingerprint + the options.

    The options are in the key because they change the output as surely as the
    source does — a forced tempo, a kept lyric line and an overridden title all
    end up inside the written file. Keying on the source alone would hand the
    same `.mxl` to two callers that asked for different things, which is the
    one way a cache can be wrong.
    """
    digest = hashlib.sha256()
    digest.update(src.read_bytes())
    digest.update(tool_fingerprint().encode("ascii"))
    digest.update(json.dumps(options, sort_keys=True, default=str).encode("utf-8"))
    return digest.hexdigest()


def record_from_result(result: ConversionResult) -> dict:
    """The parts of a ConversionResult that survive a round trip through JSON."""
    return {
        "title": result.title,
        "composer": result.composer,
        "measures": result.measures,
        "notes": result.notes,
        "staves": result.staves,
        "tempo_bpm": result.tempo_bpm,
        "added_tempo": result.added_tempo,
        "stripped_lyrics": result.stripped_lyrics,
        "fingerings": result.fingerings,
        "harmonies": result.harmonies,
        "warnings": result.warnings,
        "source_notes": result.source_notes,
        "note_events": result.note_events,
    }


def result_from_record(record: dict, dest: Path) -> ConversionResult:
    return ConversionResult(
        path=dest,
        title=record["title"],
        composer=record["composer"],
        measures=record["measures"],
        notes=record["notes"],
        staves=record["staves"],
        tempo_bpm=record["tempo_bpm"],
        added_tempo=record["added_tempo"],
        stripped_lyrics=record["stripped_lyrics"],
        fingerings=record["fingerings"],
        harmonies=record["harmonies"],
        warnings=list(record.get("warnings") or []),
        # Defaulted: a sidecar written before the note-loss gate existed still
        # loads. The fingerprint hashes this file, so in practice there are no
        # such entries left, but a cache that cannot be read is a build that
        # cannot start.
        source_notes=record.get("source_notes"),
        note_events=record.get("note_events") or 0,
    )


def cache_enabled(use_cache: bool) -> bool:
    return use_cache and os.environ.get(NO_CACHE_ENV, "") != "1"


def cached_convert(
    src: Path,
    dest: Path,
    *,
    use_cache: bool = True,
    keep_lyrics: bool = False,
    tempo_bpm: float | None = None,
    title: str | None = None,
    composer: str | None = None,
) -> ConversionResult:
    """
    `convert_file` with its answer remembered under `build/cache/convert/`.

    music21 is the pipeline's whole cost: parsing and re-exporting the 800-odd
    imported scores is most of a seven-minute build, and almost none of it
    changes between runs. A hit copies the `.mxl` out of the cache and rebuilds
    the ConversionResult from a JSON sidecar, so callers cannot tell the
    difference — `import_musetrainer` re-reads the written file either way, and
    `author.py` reads `tempo_bpm` off the result.

    A cache that cannot be written is not an error: the build is correct
    without it, only slower, so every write is best-effort.
    """
    options = {
        "keep_lyrics": keep_lyrics,
        "tempo_bpm": tempo_bpm,
        "title": title,
        "composer": composer,
    }
    if not cache_enabled(use_cache):
        CACHE_STATS.misses += 1
        return convert_file(src, dest, **options)  # type: ignore[arg-type]

    key = cache_key(src, **options)
    payload = CACHE_DIR / f"{key}.mxl"
    sidecar = CACHE_DIR / f"{key}.json"
    if payload.is_file() and sidecar.is_file():
        try:
            record = json.loads(sidecar.read_text(encoding="utf-8"))
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(payload, dest)
        except (OSError, json.JSONDecodeError, KeyError):
            pass  # a damaged entry is a miss, not a failure
        else:
            CACHE_STATS.hits += 1
            return result_from_record(record, dest)

    CACHE_STATS.misses += 1
    result = convert_file(src, dest, **options)  # type: ignore[arg-type]
    try:
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        # Written to a temporary name and renamed, so a run killed mid-write
        # never leaves a truncated `.mxl` that the next run would trust. The
        # payload lands before the sidecar and a hit needs both, so the
        # half-written state reads as a miss.
        staged = payload.with_suffix(".mxl.tmp")
        shutil.copyfile(dest, staged)
        replace_atomically(staged, payload)
        staged_json = sidecar.with_suffix(".json.tmp")
        staged_json.write_text(
            json.dumps(record_from_result(result), indent=2), encoding="utf-8"
        )
        replace_atomically(staged_json, sidecar)
    except OSError:
        pass
    return result


def convert_file(
    src: Path,
    dest: Path,
    *,
    keep_lyrics: bool = False,
    tempo_bpm: float | None = None,
    title: str | None = None,
    composer: str | None = None,
) -> ConversionResult:
    score = parse_source(src)
    normalised, result = normalise(score, keep_lyrics=keep_lyrics, tempo_bpm=tempo_bpm)

    # The note-loss gate. Nothing downstream can tell a score that was engraved
    # thinly from one that arrived with half its notes missing, so the count is
    # taken here, from the source's own bytes, and compared with what came out.
    # Refusal is the loud answer and every importer already has one: kern
    # excludes the file with the reason, MuseTrainer falls back to copying the
    # original, the PDMX quarry records the gate it failed.
    result.source_notes = source_note_events(src)
    verdict, sentence = note_loss(result.source_notes, result.note_events)
    if verdict == "refuse":
        raise ConversionError(f"{src}: {sentence}")
    if verdict == "warn":
        result.warnings.append(sentence)

    if title or composer:
        meta = normalised.metadata
        if meta is None:
            meta = metadata.Metadata()
            normalised.insert(0, meta)
        if title:
            meta.title = title
            result.title = title
        if composer:
            meta.composer = composer
            result.composer = composer
    write_mxl(normalised, dest)
    result.path = dest
    return result


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", nargs="?", type=Path)
    parser.add_argument("dest", nargs="?", type=Path)
    parser.add_argument("--batch", type=Path, help="convert every match under this directory")
    parser.add_argument("--pattern", default="**/*.krn")
    parser.add_argument("--out", type=Path, help="output directory for --batch")
    parser.add_argument("--keep-lyrics", action="store_true")
    parser.add_argument("--tempo", type=float, help="force this tempo in bpm")
    parser.add_argument("--limit", type=int)
    parser.add_argument(
        "--no-cache",
        action="store_true",
        help="always run music21, ignoring build/cache/convert",
    )
    args = parser.parse_args()
    if args.no_cache:
        os.environ[NO_CACHE_ENV] = "1"

    if args.batch:
        if not args.out:
            parser.error("--batch needs --out")
        sources = sorted(p for p in args.batch.glob(args.pattern) if p.is_file())
        if args.limit:
            sources = sources[: args.limit]
        failures = 0
        for src in sources:
            dest = args.out / (src.stem + ".mxl")
            try:
                result = cached_convert(
                    src, dest, keep_lyrics=args.keep_lyrics, tempo_bpm=args.tempo
                )
            except Exception as exc:  # noqa: BLE001 - one bad file must not stop a batch
                failures += 1
                print(f"FAIL {src}: {exc}", file=sys.stderr)
                continue
            print(f"ok   {dest.name}: {result.measures} bars, {result.notes} notes, {result.staves} staves")
        print(f"\nconverted {len(sources) - failures}/{len(sources)} ({CACHE_STATS.summary()})")
        sys.exit(1 if failures and not sources else 0)

    if not args.source or not args.dest:
        parser.error("give SOURCE and DEST, or --batch")
    result = cached_convert(
        args.source, args.dest, keep_lyrics=args.keep_lyrics, tempo_bpm=args.tempo
    )
    print(
        f"{result.path}: {result.title!r} — {result.measures} bars, {result.notes} notes, "
        f"{result.staves} staves, {result.tempo_bpm:g} bpm"
        + (" (added)" if result.added_tempo else "")
    )
    for warning in result.warnings:
        print(f"  note: {warning}")


if __name__ == "__main__":
    main()
