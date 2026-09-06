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
import functools
import hashlib
import json
import os
import re
import shutil
import sys
import warnings
import zipfile
from dataclasses import dataclass, field
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import BUILD_DIR  # noqa: E402

# music21 is noisy about things we do not control (missing metadata, unusual
# spines); the pipeline reports its own diagnostics instead.
warnings.filterwarnings("ignore")

from abc_tools import (apply_fingerings, apply_voice_clefs, extract_fingerings,  # noqa: E402
                       parse_voice_clefs, prepare_abc)
from music21 import (  # noqa: E402
    beam,
    chord,
    clef,
    converter,
    dynamics,
    harmony,
    instrument,
    layout,
    metadata,
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


# ---------------------------------------------------------------------------
# parsing
# ---------------------------------------------------------------------------

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


def collapse_to_two(parts: list[stream.Part], notes: list[str]) -> list[stream.Part]:
    """
    Reduces a score to two staves.

    Sources with more than two parts are usually a piano reduction that kept a
    separate spine for dynamics, or an ensemble score. Empty parts are dropped;
    beyond that the extra parts are merged into the nearest staff by register,
    because dropping notes silently would be worse than a crowded staff.
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
        target = treble if average_pitch(extra) >= 60 else bass
        for element in extra.recurse().notesAndRests:
            try:
                target.insert(extra.elementOffset(element, returnSpecial=False), element)
            except Exception:  # noqa: BLE001 - a stray element is not worth failing on
                continue
    return [treble, bass]


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


#: Printed note values a beam may not be attached to (VexFlow enforces it).
UNBEAMABLE_TYPES = frozenset({"quarter", "half", "whole", "breve", "longa", "maxima"})


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

    displaced = align_voice_offsets(out)
    if displaced:
        notes.append(f"moved {displaced} mid-bar voice(s) to the barline with a hidden rest")

    unbeamed = clean_beams(out)
    if unbeamed:
        notes.append(f"dropped unrenderable beams from {unbeamed} note(s)")

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

    note_count = len([n for n in out.recurse().notes])
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
    )
    return out, result


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
    staged.replace(path)


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
CACHE_VERSION = 1

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
        staged.replace(payload)
        staged_json = sidecar.with_suffix(".json.tmp")
        staged_json.write_text(
            json.dumps(record_from_result(result), indent=2), encoding="utf-8"
        )
        staged_json.replace(sidecar)
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
