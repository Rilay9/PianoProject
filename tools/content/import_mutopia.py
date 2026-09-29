#!/usr/bin/env python3
"""
The [MUTO] tier: Mutopia Project editions the public, licence-strict build can bundle (Q76, 2026-09-29).

docs/03-content-pipeline.md §2 names Mutopia (mutopiaproject.org, mirrored on GitHub at
`MutopiaProject/MutopiaProject`) as a public-domain source. The owner's word of 2026-09-29 — public-domain material
first where it exists — asked for it where the phone needed it: on the licence-strict build every craigsapp Joplin
edition (CC BY-NC-SA) is a placeholder, so no bundled piece practised the stride bass `ragtime.8` names.

The route, and why
------------------
python-ly's MusicXML writer (`convert.parse_lilypond`, the route §2 first named) gives no Joplin rag that is right:
it does not implement `\\alternative`, so both volta endings are written in turn, and on *Pine Apple Rag* music21
refuses what it writes (the left hand's first bar closes after a quarter; a chord ending a bar is split across the
bar line). The measured finding is `content/sources/mutopia.json`'s `checkedAndRefused`. So the import takes the
reviewer's first fallback (`docs/review/responses/questions-400e69c8.md` §2): **the MIDI file Mutopia publishes for
the edition**, through the repository's MIDI converter (`tools/midi-cleanup/midi_to_musicxml.py`), whose own
read-back refuses a file that lost or gained a note or has a bar that does not add up. A MIDI file carries notes and
times; it does not carry spelling, voices or repeat signs. So two things come from the edition's LilyPond source,
which the importer reads with python-ly's own tools (`rel2abs`, `rhythm_explicit`, and every repeat unfolded, so its
pitch order is the MIDI's):

- **every note's spelling**: the edition's pitches per staff are aligned with the converted notes by pitch class, and
  each note takes the edition's letter and accidental at its own sounding pitch. A note the edition never spells
  that way, or one left unspelled, refuses the item: a converter's guess (D flat for the edition's C sharp) is a
  wrong note name, and no score teaches one;
- **the key changes**, from the key-signature events the MIDI carries (LilyPond writes them where the edition
  changes key), inserted at the bar they fall on.

What stays the converter's is said on the row: the repeats are written out, and where the edition writes two voices
in one hand they are merged into chords. The row never calls the result Mutopia's notation.

Nothing in the table is trusted: both files are fetched at the pinned places (the .ly from the GitHub mirror at the
pinned revision, the .mid from Mutopia's own site, the only place it is published), and refused unless their sha256
is the pinned one; the licence is re-read from the .ly header (`license`, else `copyright`); the composition's year
is checked against docs/03 §1 rule 1. A row whose files are missing (an offline build that never fetched them) or do
not match stays in the catalogue as a placeholder with the reason, so the curriculum's id always resolves and the
build says why the score is not there.

Conversions are cached under `build/cache/mutopia/` by the two files' bytes, this module's and the MIDI
converter's bytes, and the music21 and python-ly versions; the normalisation after it is `convert.cached_convert`'s,
keyed as every conversion is.

Usage:
    python3 tools/content/import_mutopia.py --out build/content --catalog build/catalog.mutopia.json
    python3 tools/content/import_mutopia.py --out build/content --catalog build/catalog.mutopia.json --offline
"""
from __future__ import annotations

import argparse
import difflib
import functools
import hashlib
import json
import os
import re
import sys
import urllib.request
import warnings
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from common import (  # noqa: E402
    BUILD_DIR,
    CONTENT_SRC,
    IMPORTED_DIR,
    LedgerRow,
    SourceBlock,
    catalog_item,
    read_json,
    sha256_file,
    update_ledger,
    write_json,
)
from licensing import LicenseDecision, Verdict, composition_verdict, license_verdict  # noqa: E402

TABLE_PATH = CONTENT_SRC / "sources" / "mutopia.json"
#: Where the fetched files live, beside the other fetched sources (gitignored).
SOURCES_DIR = IMPORTED_DIR / "mutopia" / "published"
CACHE_DIR = BUILD_DIR / "cache" / "mutopia"
MIDI_CONVERTER = HERE.parent / "midi-cleanup" / "midi_to_musicxml.py"

#: Bump when what this module decides changes (the alignment, the key changes, the options it passes).
IMPORT_VERSION = 1

IMPORT_HINT = (
    "Not bundled in this build: {why}. Fetch the edition's files with "
    "`python tools/content/import_mutopia.py --out <dir> --catalog <file>` on a machine that can reach "
    "github.com and mutopiaproject.org, or import your own copy of the score."
)


@dataclass
class ImportReport:
    imported: list[str] = field(default_factory=list)
    placeheld: list[tuple[str, str]] = field(default_factory=list)
    fetched: list[str] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)

    def summary(self) -> str:
        return f"imported {len(self.imported)} score(s), {len(self.placeheld)} placeholder(s)"


class Refused(RuntimeError):
    """The item cannot be shipped: the reason is the message."""


# ---------------------------------------------------------------------------
# the .ly header
# ---------------------------------------------------------------------------

def header_field(text: str, name: str) -> str | None:
    """A plain-string header field (`name = "..."`); a markup value is not a plain statement and reads as None."""
    match = re.search(rf'^\s*{name}\s*=\s*"([^"\n]*)"', text, re.M)
    return match.group(1).strip() if match else None


def licence_of(text: str) -> str | None:
    """The licence the edition states: its `license` field, else its `copyright` field (Mutopia uses either)."""
    return header_field(text, "license") or header_field(text, "copyright")


def licence_decision(text: str) -> LicenseDecision:
    """The gate's verdict on the stated licence, for a redistributable build (no --allow-nc)."""
    return license_verdict(licence_of(text) or "", source="mutopia", allow_nc=False)


def version_of(text: str) -> tuple[int, int]:
    match = re.search(r'\\version\s+"(\d+)\.(\d+)', text)
    return (int(match.group(1)), int(match.group(2))) if match else (2, 0)


# ---------------------------------------------------------------------------
# the edition's pitches, with python-ly's own tools
# ---------------------------------------------------------------------------

def _tokens(text: str) -> list:
    import ly.document

    doc = ly.document.Document(text)
    return list(ly.document.Source(ly.document.Cursor(doc), True, tokens_with_position=True))


def _skip_space(tokens: list, index: int) -> int:
    import ly.lex

    while index < len(tokens) and isinstance(tokens[index], (ly.lex.Space, ly.lex.Comment)):
        index += 1
    return index


def _braced(tokens: list, index: int) -> int:
    """tokens[index] is '{': the index after its matching '}'."""
    depth = 0
    while index < len(tokens):
        if tokens[index] == "{":
            depth += 1
        elif tokens[index] == "}":
            depth -= 1
            if depth == 0:
                return index + 1
        index += 1
    raise Refused("the .ly's braces do not balance")


def _unfold_once(text: str) -> str | None:
    """Unfold the last-starting `\\repeat` (so an inner one goes first); None when none is left."""
    tokens = _tokens(text)
    for index in reversed([k for k, t in enumerate(tokens) if t == "\\repeat"]):
        j = _skip_space(tokens, index + 1)
        kind = str(tokens[j]).strip('"')
        j = _skip_space(tokens, j + 1)
        try:
            count = int(str(tokens[j]))
        except ValueError as exc:
            raise Refused(f"a \\repeat the importer cannot read ({kind} {tokens[j]})") from exc
        j = _skip_space(tokens, j + 1)
        if tokens[j] != "{" or kind == "tremolo":
            continue
        body_end = _braced(tokens, j)
        body = text[tokens[j].pos:tokens[body_end - 1].end]
        end = tokens[body_end - 1].end
        alternatives = []
        k = _skip_space(tokens, body_end)
        if k < len(tokens) and tokens[k] == "\\alternative":
            k = _skip_space(tokens, k + 1)
            outer_end = _braced(tokens, k)
            m = _skip_space(tokens, k + 1)
            while m < outer_end - 1:
                one_end = _braced(tokens, m)
                alternatives.append(text[tokens[m].pos:tokens[one_end - 1].end])
                m = _skip_space(tokens, one_end)
            end = tokens[outer_end - 1].end
        passes = []
        for number in range(count):
            passes.append(body)
            if alternatives:
                passes.append(alternatives[max(0, number - (count - len(alternatives)))])
        return text[:tokens[index].pos] + "{ " + " ".join(passes) + " }" + text[end:]
    return None


def played_text(text: str) -> str:
    """The .ly with absolute pitches, every duration written and every repeat unfolded: the order a MIDI plays."""
    import ly.document
    import ly.pitch.rel2abs
    import ly.rhythm

    doc = ly.document.Document(text)
    ly.pitch.rel2abs.rel2abs(ly.document.Cursor(doc), first_pitch_absolute=version_of(text) >= (2, 18))
    explicit = ly.document.Document(doc.plaintext())
    ly.rhythm.rhythm_explicit(ly.document.Cursor(explicit))
    out = explicit.plaintext()
    while True:
        unfolded = _unfold_once(out)
        if unfolded is None:
            return out
        out = unfolded


_LETTERS = "CDEFGAB"
_NATURAL = (0, 2, 4, 5, 7, 9, 11)


def edition_pitches(text: str, variable: str) -> list[tuple[int, str, int]]:
    """
    (pitch class, letter, alter) for every note one staff's variable starts, in the order written: a chord's members
    sorted by pitch class, and a note tied from the one before it left out (it is that note held, as in the MIDI).
    """
    import ly.document
    import ly.lex.lilypond
    import ly.pitch

    match = re.search(rf"^{re.escape(variable)}\s*=", text, re.M)
    if match is None:
        raise Refused(f"the .ly has no variable {variable!r}")
    brace = text.index("{", match.end())
    tokens = _tokens(text)
    first = next(k for k, t in enumerate(tokens) if t.pos == brace)
    end = tokens[_braced(tokens, first) - 1].end
    source = ly.document.Source(ly.document.Cursor(ly.document.Document(text[brace:end])), True, tokens_with_position=True)
    out: list[tuple[int, str, int]] = []
    chord: list | None = None
    previous: set = set()
    tied = False

    def emit(event: list) -> None:
        nonlocal previous, tied
        out.extend(sorted((e for e in event if not (tied and e in previous)), key=lambda e: (e[0], e[1])))
        previous, tied = set(event), False

    for token in ly.pitch.PitchIterator(source).pitches():
        if isinstance(token, ly.lex.lilypond.ChordStart):
            chord = []
        elif isinstance(token, ly.lex.lilypond.ChordEnd):
            emit(chord or [])
            chord = None
        elif isinstance(token, ly.lex.lilypond.Tie):
            tied = True
        elif isinstance(token, ly.pitch.Pitch):
            alter = int(round(float(token.alter) * 2))
            entry = ((_NATURAL[token.note] + alter) % 12, _LETTERS[token.note], alter)
            if chord is not None:
                chord.append(entry)
            else:
                emit([entry])
    return out


# ---------------------------------------------------------------------------
# the converted score: the edition's spelling and key changes
# ---------------------------------------------------------------------------

def _note_starts(part) -> list:
    """Every note that starts in a part (a tied continuation is not a start), in time order, a chord by pitch class."""
    rows = []
    for element in part.recurse().notes:
        members = list(element.notes) if element.isChord else [element]
        offset = element.getOffsetInHierarchy(part)
        for member in members:
            if member.tie is not None and member.tie.type in ("stop", "continue"):
                continue
            rows.append((offset, member.pitch.pitchClass, member.pitch.step, member))
    rows.sort(key=lambda r: (r[0], r[1], r[2]))
    return [r[3] for r in rows]


def _respell(note, letter: str, alter: int) -> bool:
    from music21 import pitch as m21pitch

    accidental = {-2: "--", -1: "-", 0: "", 1: "#", 2: "##"}.get(alter)
    if accidental is None:
        return False
    midi = note.pitch.midi
    for octave in range(0, 10):
        candidate = m21pitch.Pitch(f"{letter}{accidental}{octave}")
        if candidate.midi == midi:
            note.pitch = candidate
            return True
    return False


def spell_from_edition(part, edition: list[tuple[int, str, int]]) -> dict:
    """
    Every note of `part` spelled as the edition spells it. The pitch-class sequences are aligned (difflib); a note in
    an unaligned stretch pairs, in order, with the edition's notes of the same pitch class in that stretch; one still
    left takes the spelling of the nearest spelled note of its pitch class. A tied continuation keeps its note's.
    """
    notes = _note_starts(part)
    a = [e[0] for e in edition]
    b = [n.pitch.pitchClass for n in notes]
    spelled = [False] * len(notes)
    aligned = paired = 0
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(a=a, b=b, autojunk=False).get_opcodes():
        if tag == "equal":
            for k in range(i2 - i1):
                spelled[j1 + k] = _respell(notes[j1 + k], edition[i1 + k][1], edition[i1 + k][2])
                aligned += spelled[j1 + k]
        elif tag == "replace":
            pool = list(range(i1, i2))
            for j in range(j1, j2):
                hit = next((i for i in pool if edition[i][0] == b[j]), None)
                if hit is not None:
                    pool.remove(hit)
                    spelled[j] = _respell(notes[j], edition[hit][1], edition[hit][2])
                    paired += spelled[j]
    for j in range(len(notes)):
        if spelled[j]:
            continue
        for distance in range(1, 64):
            near = [k for k in (j - distance, j + distance)
                    if 0 <= k < len(notes) and spelled[k] and notes[k].pitch.pitchClass == b[j]]
            if near:
                spelled[j] = _respell(notes[j], notes[near[0]].pitch.step, int(notes[near[0]].pitch.alter))
                paired += spelled[j]
                break
    held: dict[int, tuple[str, int]] = {}
    for element in part.recurse().notes:
        for member in (list(element.notes) if element.isChord else [element]):
            tie = member.tie.type if member.tie is not None else None
            if tie in ("stop", "continue") and member.pitch.midi in held:
                _respell(member, *held[member.pitch.midi])
            if tie in ("start", "continue"):
                held[member.pitch.midi] = (member.pitch.step, int(member.pitch.alter))
    allowed: dict[int, set] = {}
    for pc, letter, alter in edition:
        allowed.setdefault(pc, set()).add((letter, alter))
    foreign = Counter(f"{n.pitch.name}" for n in notes
                      if (n.pitch.step, int(n.pitch.alter)) not in allowed.get(n.pitch.pitchClass, set()))
    return {"notes": len(notes), "editionNotes": len(edition), "aligned": aligned, "paired": paired,
            "unspelled": spelled.count(False), "foreign": dict(foreign)}


def midi_key_changes(midi_path: Path) -> list[tuple[float, int]]:
    """(offset in quarters, sharps) of every key-signature event in the MIDI, in time order, duplicates dropped."""
    from music21 import midi

    mf = midi.MidiFile()
    mf.open(str(midi_path))
    mf.read()
    mf.close()
    found: set[tuple[float, int]] = set()
    for track in mf.tracks:
        ticks = 0
        for event in track.events:
            if isinstance(event, midi.DeltaTime):
                ticks += event.time
            elif event.type == midi.MetaEvents.KEY_SIGNATURE:
                data = event.data if isinstance(event.data, (bytes, bytearray)) else bytes(event.data or b"")
                sharps = data[0] - 256 if data and data[0] > 127 else (data[0] if data else 0)
                found.add((ticks / mf.ticksPerQuarterNote, sharps))
    return sorted(found)


def insert_key_changes(score, changes: list[tuple[float, int]]) -> list[str]:
    """Each later key change as a key signature at the bar it falls on, in every part; a change inside a bar is reported."""
    from music21 import key, stream

    problems = []
    for offset, sharps in changes:
        if offset == 0:
            continue
        for part in score.parts:
            bar = next((m for m in part.getElementsByClass(stream.Measure)
                        if abs(float(m.getOffsetInHierarchy(part)) - offset) < 1e-6), None)
            if bar is None:
                problems.append(f"a key change at quarter {offset} falls inside a bar of {part.id}")
                continue
            for old in list(bar.getElementsByClass(key.KeySignature)):
                bar.remove(old)
            bar.insert(0, key.KeySignature(sharps))
    return problems


# ---------------------------------------------------------------------------
# one item
# ---------------------------------------------------------------------------

@functools.lru_cache(maxsize=1)
def _midi_converter():
    sys.path.insert(0, str(MIDI_CONVERTER.parent))
    import midi_to_musicxml

    return midi_to_musicxml


def _cache_key(row: dict, ly_path: Path, midi_path: Path) -> str:
    from music21 import __version__ as music21_version
    import ly.pkginfo

    digest = hashlib.sha256()
    for path in (ly_path, midi_path, Path(__file__), MIDI_CONVERTER):
        digest.update(path.read_bytes())
    digest.update(f"{music21_version}|{ly.pkginfo.version}|v{IMPORT_VERSION}".encode("utf-8"))
    digest.update(json.dumps({k: row[k] for k in ("staves", "key", "timeSig")}, sort_keys=True).encode("utf-8"))
    return digest.hexdigest()


def convert_item(row: dict, ly_path: Path, midi_path: Path, *, work_dir: Path | None = None,
                 use_cache: bool = True) -> tuple[Path, dict]:
    """
    The edition's published MIDI as MusicXML, spelled and keyed from its .ly: (the staged file, its report).
    Raises `Refused` with the reason where the converter or the spelling cannot vouch for the result.
    """
    warnings.filterwarnings("ignore")
    key = _cache_key(row, ly_path, midi_path)
    cache = work_dir or CACHE_DIR
    staged = cache / f"{key}.musicxml"
    sidecar = cache / f"{key}.json"
    if use_cache and os.environ.get("PIANOPATH_NO_CACHE", "") != "1" and staged.is_file() and sidecar.is_file():
        return staged, json.loads(sidecar.read_text(encoding="utf-8"))

    from music21 import converter

    m2x = _midi_converter()
    cache.mkdir(parents=True, exist_ok=True)
    raw = cache / f"{key}.raw.musicxml"
    result = m2x.convert(midi_path, raw, divisors=(4, 3), respell=True, force=True,
                         forced_key=m2x.parse_key(row["key"]), hands="auto", swing=False)
    converter_report = {"name": m2x.CONVERTER_NAME, "version": m2x.CONVERTER_VERSION, "parts": result["parts"],
                        "timeSignature": result["time_signature"], "lost": result["lost"], "added": result["added"],
                        "brokenBars": result["broken_bars"], "grid": result["grid"]}
    if result["lost"] or result["added"] or result["broken_bars"]:
        raise Refused(f"the MIDI converter's read-back failed: {len(result['lost'])} lost, {len(result['added'])} added, "
                      f"bars that do not add up {result['broken_bars'][:5]}")
    if len(result["parts"]) != 2:
        raise Refused(f"the published MIDI holds {len(result['parts'])} note tracks, not a hand per staff")
    if result["time_signature"].split(" ")[0] != row["timeSig"]:
        raise Refused(f"the MIDI's metre {result['time_signature']} is not the table's {row['timeSig']}")

    score = converter.parse(str(raw))
    text = played_text(ly_path.read_text(encoding="utf-8", errors="replace"))
    spelling = []
    for part, variable in zip(score.parts, row["staves"]):
        verdict = spell_from_edition(part, edition_pitches(text, variable))
        spelling.append({"variable": variable, **verdict})
        if verdict["unspelled"] or verdict["foreign"]:
            raise Refused(f"the {variable} staff cannot be spelled as the edition spells it: {verdict['unspelled']} left, "
                          f"spellings the edition never uses {verdict['foreign']}")
    changes = midi_key_changes(midi_path)
    opening = next((sharps for offset, sharps in changes if offset == 0), None)
    if opening is not None and opening != m2x.parse_key(row["key"]).sharps:
        raise Refused(f"the MIDI opens with {opening} sharps, not the table's key {row['key']}")
    problems = insert_key_changes(score, changes)
    if problems:
        raise Refused("; ".join(problems))
    score.write("musicxml", fp=str(staged))
    raw.unlink(missing_ok=True)
    report = {"converter": converter_report, "spelling": spelling,
              "keyChanges": [{"quarter": offset, "sharps": sharps} for offset, sharps in changes]}
    sidecar.write_text(json.dumps(report, indent=2), encoding="utf-8")
    return staged, report


def _placeholder(row: dict, why: str, report: ImportReport) -> dict:
    """The row without a file: the id resolves, and the hint says why the score is not in this build."""
    report.placeheld.append((row["id"], why))
    return catalog_item(
        # No file to estimate from: the table's level for the work (`placeholderLevel`, where it came from said there).
        item_id=row["id"], item_type="song", title=row["title"], level=float(row["placeholderLevel"]),
        level_source="estimated", hands="both", tracks=row["tracks"], concepts=row["concepts"],
        source=SourceBlock(name=f"The Mutopia Project, edition {row['edition']}", url=row["pieceUrl"],
                           license="Public Domain (as the edition's .ly header states; not read on this build)",
                           pd_region="worldwide", fetchedAt=None, checksum=None, editionNotes=row["editionNotes"]),
        composer=row["composer"], genre=["ragtime"] if "ragtime" in row["tracks"] else ["classical"], file=None,
        importHint=IMPORT_HINT.format(why=why), variantOf=row.get("variantOf"), variantLabel=row.get("variantLabel"),
        keySig=row["key"], timeSig=row["timeSig"], tags=["mutopia", "import-only"],
    )


def build_entry(row: dict, table: dict, *, sources_dir: Path, scores_out: Path, report: ImportReport,
                work_dir: Path | None = None, use_cache: bool = True) -> dict:
    """Admits one edition and turns it into a catalogue row, or a placeholder that says why not."""
    ly_path = sources_dir / row["ly"]["path"]
    midi_path = sources_dir / row["midi"]["path"]
    for part, path in (("ly", ly_path), ("midi", midi_path)):
        if not path.is_file():
            return _placeholder(row, f"the edition's .{'ly' if part == 'ly' else 'mid'} file was not fetched", report)
        got = sha256_file(path).replace("sha256:", "")
        if got != row[part]["sha256"]:
            return _placeholder(row, f"{path.name} is not the pinned file (sha256 {got[:12]}…, pinned "
                                     f"{row[part]['sha256'][:12]}…)", report)
    text = ly_path.read_text(encoding="utf-8", errors="replace")
    stated = licence_of(text)
    decision = licence_decision(text)
    if decision.verdict is not Verdict.BUNDLE:
        return _placeholder(row, f"the edition states {stated!r}: {decision.reason}", report)
    composition = composition_verdict(composer=row["composer"], published_year=int(row["publishedYear"]))
    if composition.verdict is not Verdict.BUNDLE:
        return _placeholder(row, f"the composition: {composition.reason}", report)
    if header_field(text, "footer") != row["edition"]:
        return _placeholder(row, f"the .ly's footer {header_field(text, 'footer')!r} is not the table's edition", report)

    try:
        staged, conversion = convert_item(row, ly_path, midi_path, work_dir=work_dir, use_cache=use_cache)
    except Refused as refused:
        return _placeholder(row, str(refused), report)

    from convert import cached_convert
    import difficulty
    from music21 import converter

    dest = scores_out / f"{row['id']}.mxl"
    result = cached_convert(staged, dest, title=row["title"], composer=row["composer"], use_cache=use_cache)
    estimate = difficulty.estimate(difficulty.features(converter.parse(str(dest))))
    report.imported.append(row["id"])
    source = table["source"]
    entry = catalog_item(
        item_id=row["id"], item_type="song", title=row["title"], level=estimate.level, level_source="estimated",
        hands="both", tracks=row["tracks"], concepts=row["concepts"],
        source=SourceBlock(
            name=f"The Mutopia Project, edition {row['edition']}", url=row["pieceUrl"], license=stated or "unstated",
            pd_region="worldwide", fetchedAt=source["pinned"], checksum=sha256_file(dest),
            editionNotes=row["editionNotes"],
        ),
        composer=row["composer"], genre=["ragtime"] if "ragtime" in row["tracks"] else ["classical"],
        file=f"scores/imported/{row['id']}.mxl", variantOf=row.get("variantOf"), variantLabel=row.get("variantLabel"),
        tempoBpm=round(float(result.tempo_bpm), 2) if result.tempo_bpm else None,
        keySig=row["key"], timeSig=row["timeSig"], tags=["mutopia"],
    )
    # Read by build.attach_provenance and taken off the row there (the schema has no place for it on a row).
    entry["_mutopia"] = {
        "edition": f"mutopia:{row['edition']}",
        "artifact": {"kind": "the MIDI file Mutopia publishes for the edition",
                     "url": source["midiBase"] + row["midi"]["path"], "sha256": row["midi"]["sha256"]},
        "spelling": {"from": "the edition's LilyPond source, read with python-ly (rel2abs, rhythm_explicit, repeats unfolded)",
                     "url": source["lyBase"] + row["ly"]["path"], "sha256": row["ly"]["sha256"]},
        "converter": {"name": conversion["converter"]["name"], "version": conversion["converter"]["version"],
                      "then": f"tools/content/import_mutopia.py v{IMPORT_VERSION} (spelling and key changes from the edition)"},
        "tempoFromEdition": bool(re.search(r"^\s*\\tempo[^\n]*=\s*\d+", text, re.M)),
    }
    return entry


# ---------------------------------------------------------------------------
# the fetch
# ---------------------------------------------------------------------------

def fetch(table: dict, sources_dir: Path, report: ImportReport) -> None:
    """Fetches each named file that is missing or not the pinned one; never the rest of the archive."""
    source = table["source"]
    rows = []
    for row in table["items"]:
        for part, base in (("ly", source["lyBase"]), ("midi", source["midiBase"])):
            dest = sources_dir / row[part]["path"]
            if dest.is_file() and sha256_file(dest).replace("sha256:", "") == row[part]["sha256"]:
                continue
            dest.parent.mkdir(parents=True, exist_ok=True)
            try:
                with urllib.request.urlopen(base + row[part]["path"], timeout=60) as response:
                    data = response.read()
            except OSError as exc:
                report.notes.append(f"could not fetch {base + row[part]['path']}: {exc}")
                continue
            staging = dest.with_suffix(dest.suffix + ".part")
            staging.write_bytes(data)
            staging.replace(dest)
            report.fetched.append(row[part]["path"])
        rows.append(LedgerRow(source="mutopia", path=f"mutopia/published/{Path(row['ly']['path']).parent.as_posix()}",
                              url=source["midiBase"] + Path(row["midi"]["path"]).parent.as_posix(),
                              license="Public Domain (the edition's .ly header)", pd_region="worldwide",
                              fetched=source["pinned"], revision=row["edition"], files=2))
    if rows:
        update_ledger(rows)


def import_mutopia(out_dir: Path, catalog_path: Path, *, offline: bool, use_cache: bool = True,
                   sources_dir: Path = SOURCES_DIR) -> ImportReport:
    table = read_json(TABLE_PATH)
    assert isinstance(table, dict)
    report = ImportReport()
    if not offline:
        fetch(table, sources_dir, report)
    scores_out = out_dir / "scores" / "imported"
    scores_out.mkdir(parents=True, exist_ok=True)
    entries = [build_entry(row, table, sources_dir=sources_dir, scores_out=scores_out, report=report,
                           use_cache=use_cache) for row in table["items"]]
    write_json(catalog_path, entries)
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, required=True, help="content output directory")
    parser.add_argument("--catalog", type=Path, required=True)
    parser.add_argument("--offline", action="store_true", help="never touch the network; use what is fetched")
    parser.add_argument("--no-cache", action="store_true", help="ignore build/cache and reconvert")
    args = parser.parse_args()
    if args.no_cache:
        os.environ["PIANOPATH_NO_CACHE"] = "1"
    report = import_mutopia(args.out, args.catalog, offline=args.offline, use_cache=not args.no_cache)
    for path in report.fetched:
        print(f"  fetched {path}")
    for note in report.notes:
        print(f"  note   {note}")
    for item_id, why in report.placeheld:
        print(f"  placeholder {item_id}: {why}")
    from convert import CACHE_STATS  # late import: music21 is slow to load

    # Last, so the build's one-line summary of this step is the count.
    print(f"{report.summary()} ({CACHE_STATS.summary()})")


if __name__ == "__main__":
    main()
