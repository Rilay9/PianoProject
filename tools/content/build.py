#!/usr/bin/env python3
"""
Builds `app/public/content/` from `content/` and the fetched sources.

docs/03-content-pipeline.md §3 lists the ten steps in the order they run here.
The order matters and the failure modes differ at each step, so each is
reported separately:

  1. fetch            — clone what is reachable; skipping a source is not a failure
  2. import [MT]      — the MuseTrainer library, per-file licence decisions
  3. import [KERN]    — the Humdrum editions, per-file licence decisions
  4. import [PDMX]    — the reviewed quarry slice, checksummed (step_import_pdmx)
  4a. import [MUTO]   — Mutopia's public-domain editions from their published MIDI, spelled from the .ly (Q76)
  5. generate         — scales, arpeggios, Hanon, harmony families, rhythm rows
  6. author           — our own ABC and music21 sources
  7. merge            — the fragments into one catalog, sections attached
  8. curriculum, lessons, tips — copied through from content/
  9. validate         — schema, cross-references, licences, durations, the ladder report
 10. render           — optional; every item loaded in a real browser (slow);
                        validate runs again after it, since it writes durations back

Steps 2–6 each write their own catalog fragment; the merge is one place, so a
duplicate id between an authored tune and a generated exercise is caught by
validation rather than by whichever wrote last.

Usage (the personal build is the default — docs/00 D23, owner 2026-09-12):
    python3 tools/content/build.py                 # everything but the render check
    python3 tools/content/build.py --offline       # no network
    python3 tools/content/build.py --render        # …and render every item
    python3 tools/content/build.py --render-limit N  # …only the first N
    python3 tools/content/build.py --quick         # a small generator subset
    python3 tools/content/build.py --skip-fetch    # keep what is fetched, do not refresh it
    python3 tools/content/build.py --no-cache      # reconvert every source (docs/03 §3a)
    python3 tools/content/build.py --strict-license  # the public build (or PIANOPATH_STRICT_LICENSE=1)
    python3 tools/content/build.py --no-personal   # a build without the owner's extra items
    python3 tools/content/build.py --allow-nc      # the older, narrower spelling of --personal
    python3 tools/content/build.py --out DIR       # somewhere other than app/public/content
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import (  # noqa: E402
    BUILD_DIR,
    CONTENT_SRC,
    DEFAULT_OUT,
    REPO_ROOT,
    ContentBusy,
    Step,
    content_lock,
    read_front_matter,
    read_json,
    run,
    write_json,
)

import finder  # noqa: E402

#: Sits in `content/curriculum/` but is not a stage file: the concept display
#: names and their finders.
CONCEPTS_FILE = "concepts.json"

FRAGMENTS = (
    "catalog.mt.json",
    "catalog.kern.json",
    "catalog.generated.json",
    "catalog.authored.json",
    "catalog.pdmx.json",
    "catalog.mutopia.json",
)


def python(script: str, *args: str) -> tuple[int, str]:
    """
    Runs a pipeline script and returns its output, stdout last.

    stdout last on purpose: every step prints its one-line summary at the end of
    stdout and `summary_line` takes the last line, but music21 writes parser
    warnings to stderr. Concatenating the other way round once made a build
    report a Humdrum warning where the import count should have been.
    """
    result = run([sys.executable, str(Path(__file__).resolve().parent / script), *args], timeout=3600)
    output = (result.stderr or "") + (result.stdout or "")
    return result.returncode, output.strip()


def step_fetch(offline: bool) -> Step:
    args = ["--offline"] if offline else []
    code, output = python("fetch.py", *args)
    detail = output.splitlines()[-1] if output else ""
    # A source we cannot reach is a smaller build, not a broken one.
    return Step("fetch", ok=True, detail=detail, skipped=False, warnings=[] if code == 0 else [output])


def step_import(out_dir: Path, no_cache: bool = False, personal: bool = False) -> Step:
    args = ["--out", str(out_dir), "--catalog", str(BUILD_DIR / "catalog.mt.json")]
    if no_cache:
        args.append("--no-cache")
    if personal:
        args.append("--personal")
    code, output = python("import_musetrainer.py", *args)
    return Step("import [MT]", ok=code == 0, detail=summary_line(output))


def step_import_kern(out_dir: Path, allow_nc: bool, no_cache: bool = False) -> Step:
    args = [
        "--out", str(out_dir), "--catalog", str(BUILD_DIR / "catalog.kern.json"),
    ]
    if allow_nc:
        args.append("--allow-nc")
    if no_cache:
        args.append("--no-cache")
    code, output = python("import_kern.py", *args)
    return Step("import [KERN]", ok=code == 0, detail=summary_line(output))


def step_import_pdmx(out_dir: Path, personal: bool, strict_license: bool) -> Step:
    """
    The quarried PDMX scores, if any have been committed.

    Needs nothing but the repository: the archive is on the owner's machine and
    the quarry ran there once (replan §2.1). Before P14 there is no table and
    this writes an empty fragment, which is a normal state and not a failure.
    """
    args = [
        "--out", str(out_dir), "--catalog", str(BUILD_DIR / "catalog.pdmx.json"),
    ]
    if personal:
        args.append("--personal")
    if strict_license:
        args.append("--strict-license")
    code, output = python("import_pdmx.py", *args)
    return Step("import [PDMX]", ok=code == 0, detail=summary_line(output),
                warnings=[] if code == 0 else [output])


def step_import_mutopia(out_dir: Path, offline: bool, no_cache: bool = False) -> Step:
    """
    Mutopia's public-domain editions (Q76): `content/sources/mutopia.json`'s rows, each from the MIDI file Mutopia
    publishes for it, converted by the repository's MIDI converter and spelled and keyed from the edition's .ly.

    It fetches only the files the table names, and not at all when the build is offline or asked not to refresh
    what is fetched; a row whose files are missing or not the pinned ones is a placeholder saying so, which is a
    smaller build, never a failed one (the fetch step's rule), and the placeholder is printed under the step.
    """
    args = ["--out", str(out_dir), "--catalog", str(BUILD_DIR / "catalog.mutopia.json")]
    if offline:
        args.append("--offline")
    if no_cache:
        args.append("--no-cache")
    code, output = python("import_mutopia.py", *args)
    placeheld = [line.strip() for line in output.splitlines() if line.strip().startswith("placeholder ")]
    return Step("import [MUTO]", ok=code == 0, detail=summary_line(output),
                warnings=([] if code == 0 else [output]) + placeheld)


def step_score_checks(out_dir: Path) -> Step:
    """
    The seven score checks, as a gate on their `high` rows (T15, 2026-09-22).

    `--no-analysis` because the music21 key pass is the minutes in that tool and
    produces only medium and low rows, which never fail a build. The allow-file
    is `content/score-checks.allow.json`: a reason per row, and a high row with
    no entry stops the build naming it.

    **`--catalog` names the catalog this build just wrote** (2026-09-22 review).
    The step took `out_dir` and never used it: the script read
    `app/public/content/catalog.json` off a constant, so a `--out DIR` run —
    documented usage, and `build/p19-personal/` and `build/p19-strict/` are on
    disk — gated a catalog other than the one `merge_catalog(out_dir)` had
    written one step earlier. Every other step is handed the same directory.
    """
    code, output = python(
        "score_checks.py", "--gate", "--no-analysis", "--quiet",
        "--catalog", str(out_dir / "catalog.json"),
    )
    lines = [line for line in output.splitlines() if line.strip()]
    detail = next((line for line in lines if line.startswith("score-checks gate:")), summary_line(output))
    return Step(
        "score checks",
        ok=code == 0,
        detail=detail,
        warnings=[] if code == 0 else ["\n".join(lines[-40:])],
    )


def step_generate(out_dir: Path, quick: bool) -> Step:
    args = [
        "--out", str(out_dir / "scores" / "generated"),
        "--catalog", str(BUILD_DIR / "catalog.generated.json"),
    ]
    if quick:
        args.append("--quick")
    code, output = python("generate_exercises.py", *args)
    return Step("generate [GEN]", ok=code == 0, detail=summary_line(output))


def step_author(out_dir: Path, no_cache: bool = False) -> Step:
    args = ["--out", str(out_dir), "--catalog", str(BUILD_DIR / "catalog.authored.json")]
    if no_cache:
        args.append("--no-cache")
    code, output = python("author.py", *args)
    return Step("author [AUTH]", ok=code == 0, detail=summary_line(output))


def summary_line(text: str) -> str:
    """Each step prints its summary last, so that is the line to show."""
    lines = [line for line in text.splitlines() if line.strip()]
    return lines[-1] if lines else ""


def merge_catalog(out_dir: Path) -> Step:
    entries: list[dict] = []
    # The hand-written fragment first: runtime drills and import placeholders
    # have no generator and no source file, so they live in the repository.
    static = CONTENT_SRC / "catalog.static.json"
    if static.exists():
        fragment = read_json(static)
        assert isinstance(fragment, list)
        entries.extend(fragment)
    for name in FRAGMENTS:
        path = BUILD_DIR / name
        if not path.exists():
            continue
        fragment = read_json(path)
        assert isinstance(fragment, list)
        entries.extend(fragment)
    entries.sort(key=lambda item: item["id"])
    sections = attach_sections(entries)
    tracked = attach_rung_tracks(entries)
    # E1: the approved excerpts, cut from their parents' built files into files of their own,
    # before the notation, demands and provenance steps read every file alike.
    import excerpts as excerpt_step

    cut, unbundled, refusals = excerpt_step.attach_excerpts(entries, out_dir)
    read = attach_notation(entries, out_dir)
    keyed = settle_key_signatures(entries)
    measured, unmeasured, runtime = attach_demands(entries, out_dir)
    attach_provenance(entries, out_dir)
    write_json(out_dir / "catalog.json", entries)
    detail = f"{len(entries)} items"
    if sections:
        detail += f", {sections} with named sections"
    if cut or unbundled:
        detail += f", {cut} excerpt(s) cut" + (f" ({len(unbundled)} not: the parent is not bundled here)" if unbundled else "")
    if tracked:
        detail += f", {tracked} given a track by their rung"
    if read:
        detail += f", {read} read from the score"
    if keyed:
        detail += f", {keyed} keySig corrected"
    detail += f", demands measured on {measured} ({unmeasured} unmeasured, {runtime} made at runtime)"
    # A row the cutter refuses (a range across a repeat sign, a parent that is gone) stops the
    # build with the row and the bars named: shipping the catalogue without it would hide it.
    return Step("merge catalog", ok=not refusals, detail=detail, warnings=["excerpts refused:\n" + "\n".join(refusals)] if refusals else [])


#: Circle-of-fifths names, index 0 = C major / A minor. The same four tables
#: and the same spelling as `keySignatureName` in `app/src/score/
#: extractScoreModel.ts`, so a row this function writes and a row the render
#: check writes read the same on the Library's detail sheet.
_SHARP_KEYS = ["C", "G", "D", "A", "E", "B", "F#", "C#"]
_FLAT_KEYS = ["C", "F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb"]
_SHARP_MINORS = ["A", "E", "B", "F#", "C#", "G#", "D#", "A#"]
_FLAT_MINORS = ["A", "D", "G", "C", "F", "Bb", "Eb", "Ab"]


def _key_words(fifths: int, minor: bool) -> str:
    table = (_SHARP_MINORS if fifths >= 0 else _FLAT_MINORS) if minor else (
        _SHARP_KEYS if fifths >= 0 else _FLAT_KEYS
    )
    return f"{table[min(abs(fifths), 7)]} {'minor' if minor else 'major'}"


def _signature_words(fifths: int) -> str:
    """The signature with no mode claimed: `1 flat`, `3 sharps`."""
    if fifths == 0:
        return "no sharps or flats"
    count = abs(fifths)
    return f"{count} {'sharp' if fifths > 0 else 'flat'}{'' if count == 1 else 's'}"


def settle_key_signatures(entries: list[dict]) -> int:
    """
    `keySig` from what the file says, not from a default (2026-09-22).

    **The fault.** A key signature stands for two keys and most files never
    write `<mode>`. Both writers of this field guess *major* when the tag is
    missing: `keySignatureName` in `app/src/score/extractScoreModel.ts` is
    handed OSMD's `Mode`, whose 0 means major and whose "absent" is also 0, and
    `import_musetrainer.py` passes `mode or "major"` outright. So the Library's
    detail sheet printed **Key: F major** over the D minor Toccata and Fugue
    BWV 565, *Für Elise* read C major, the Moonlight read E major, and the
    coordinator confirmed the same on six more rows on 2026-09-22.

    **The rule.** A stated *minor* is believed; otherwise the last bass note
    decides between the signature's major and its relative minor; and when it
    is neither, no mode is claimed at all and the signature alone is printed
    (`_signature_words` — "2 sharps").

    **It is not `key_name`, and the two part twice** (2026-09-22 review; §2.17,
    a comment is a claim). `key_name` in `tools/content/notation.py` — and
    `keyOf` in `app/tests/unit/lessonClaimsAboutMusic.test.ts`, which is the
    same rule in TypeScript — **differs from this one** on two of its three
    branches: it believes `mode == "major"` (`if first.get("mode") ==
    "major": return major`), which the paragraph below says this function
    deliberately does not; and where the final bass matches neither the tonic
    nor its relative it still names a tonic with a query (`return major +
    "?"`), where this names none. Only the stated-minor branch is shared. Both
    readings are deliberate: `key_name` reports what one file says, and this
    decides what the Library prints over a catalogue of them.

    **`<mode>major</mode>` is not a statement.** `Nocturne_in_C_sharp_Minor.mxl`
    under `content/scores/imported/musetrainer/scores` contains no `<mode>` tag
    at all, and the built file the catalog reads contains `<mode>major</mode>`:
    the conversion writes it. So a built file saying *major* carries the same
    information as one saying nothing, and is treated the same way here. A file
    saying *minor* is believed, because nothing in the pipeline writes that by
    default. This is what settles Op. 9 No. 1 (B flat minor), the C sharp minor
    Nocturne, the Op. 64 No. 2 waltz and the Pachelbel chaconne, all four of
    which the file calls major and the title, the signature and the final bass
    call minor.

    **One guard, and it is not in the rule.** A `keySig` that already names a
    *minor* key was put there by an importer reading catalogue data — the NIFC
    files carry a RISM key record, and `import_kern.mode_for` prefers it — and
    that is better evidence than a final bass. Chopin's Scherzo No. 2 is in B
    flat minor and ends in D flat major; the Op. 35 scherzo is in E flat minor
    and ends in G flat. The last bass note is right about both endings and
    wrong about both works, so those rows are left alone.

    Returns the number of rows changed. `LibraryScreen.ts:628` is the only
    reader of this field in the app (it prints `Key: …`); `render_check.py`
    fills it only where it is still `None`, so it cannot undo this.
    """
    changed = 0
    for entry in entries:
        # Songs only. A generated exercise's `keySig` is written by
        # `generate_exercises.engraved_key` from the key it was asked to
        # engrave, which is a fact about the maker's input rather than a guess
        # — and the last bass note is the wrong witness for a scale, which
        # ends on its own last degree: `exercise.articulation.c.legato.right`
        # is C major and ends on A.
        if entry.get("type") != "song":
            continue
        keys = (entry.get("notation") or {}).get("keys") or []
        if not keys:
            continue
        fifths = int(keys[0].get("fifths") or 0)
        if abs(fifths) > 7:
            continue
        mode = keys[0].get("mode")
        current = entry.get("keySig")
        if mode == "minor":
            settled = _key_words(fifths, True)
        else:
            if current and current.strip().lower() != _key_words(fifths, False).lower():
                # Catalogue data, not a guess: see the guard above.
                continue
            major_pc = (7 * fifths) % 12
            final_bass = (entry.get("notation") or {}).get("finalBass")
            if final_bass == (major_pc + 9) % 12:
                settled = _key_words(fifths, True)
            elif final_bass == major_pc:
                settled = _key_words(fifths, False)
            else:
                settled = _signature_words(fifths)
        # Two spellings of the same answer live in the catalog — `import_kern`
        # writes `a minor` for the chord-symbol convention, the app writes
        # `A minor` — and re-casing three hundred generated exercises is not
        # this function's business.
        if settled.lower() != (current or "").strip().lower():
            entry["keySig"] = settled
            changed += 1
    return changed


def attach_notation(entries: list[dict], out_dir: Path) -> int:
    """
    What the score actually says, on the row the app reads (2026-09-18).

    **The cause this is here to remove.** Everything downstream of the catalog —
    which song goes on which rung, what a lesson may claim about it, what the
    Library filters show, which items `alternativesFor` offers — was decided
    from `title`, `level`, `genre` and `tracks`. Not one of those is read from
    the music: `level` is a constant in a maker or a regression on features,
    `tracks` came from the import bucket, `genre` from the id's prefix. So the
    only way to choose a song was to guess from its name, and guessing from a
    name is exactly how a right-hand-only melody of eleven bars with no chord
    symbols came to sit on the rung that teaches left-hand chords, and how two
    tangos came to be called bossas in a lesson.

    The facts were being computed and thrown away. `content/sources/pdmx.json`
    already carries nineteen measured `features` per quarried row, and
    `levelDrivers` even records which of them set the level — none of it reaches
    `catalog.json`. And the three questions that actually get asked of a piece
    when placing it — *is it minor, is it a waltz, has it got chords* — were
    computed nowhere at all, because `features` measures difficulty rather than
    identity.

    So: one pass over every score file, and the answers go on the row. This is
    not the guessing `import_pdmx` refuses to do — nothing here reads a title.

    Cached on (size, mtime) in `build/notation-cache.json`, because the second
    build of a day should not re-read two thousand scores to learn what it
    already knows.
    """
    # The parser lives in `notation.py` so that `archive_notation.py` can read a
    # score straight out of the archive with the same code. Two copies of a
    # parser is two things that can drift.
    from notation import describe, read_musicxml

    cache_path = BUILD_DIR / "notation-cache.json"
    cache: dict = read_json(cache_path) if cache_path.exists() else {}
    assert isinstance(cache, dict)
    fresh: dict = {}

    touched = 0
    for entry in entries:
        rel = entry.get("file")
        if not rel:
            continue
        path = out_dir / rel
        if not path.exists():
            continue
        stat = path.stat()
        token = f"{stat.st_size}:{int(stat.st_mtime)}"
        cached = cache.get(rel)
        if isinstance(cached, dict) and cached.get("token") == token:
            fresh[rel] = cached
            entry["notation"] = cached["notation"]
            touched += 1
            continue
        text = read_musicxml(path)
        if text is None:
            continue
        try:
            described = describe(text)
        except Exception:  # a file that will not parse is data, not a crash
            continue
        fresh[rel] = {"token": token, "notation": described}
        entry["notation"] = described
        touched += 1

    write_json(cache_path, fresh)

    # A derived field that came out empty everywhere is a broken reader, not a
    # library of scores without time signatures. This exists because the first
    # version of `describe` used `ElementTree.iter("{*}time")` — `iter()` does
    # not parse the `{*}` wildcard, only `find`/`findall` do — so every row got
    # `times: []`, `keys: []`, `chordCount: 0`, `staves: 1`, and the step
    # cheerfully reported "1975 read from the score". Only `bars` was right,
    # because it happened to use `findall`, and that was enough to make the
    # output look plausible. Counting the rows written is not the same as
    # looking at what was written in them.
    if touched:
        with_time = sum(1 for e in entries if (e.get("notation") or {}).get("times"))
        if with_time < touched * 0.5:
            raise SystemExit(
                f"attach_notation: {touched} rows read but only {with_time} carry a time "
                f"signature. Nearly every score has one, so this is the reader failing "
                f"silently rather than the library being strange. Delete "
                f"build/notation-cache.json after fixing it — the cache stores the wrong "
                f"answers too."
            )
    return touched


#: The per-demand useful-density rule for notated items (E0): one file, read here and
#: by `app/src/curriculum/eligibility.ts`.
DENSITY_FILE = CONTENT_SRC / "sources" / "opportunity-density.json"

#: What a score file is, for the detectors: MusicXML, compressed or not.
NOTATION_SUFFIXES = (".mxl", ".musicxml", ".xml")


def _sha256(path: Path) -> str:
    import hashlib

    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


#: The detectors' clef assumption (`detect.ts`'s module note): staff 1 is read as the treble
#: clef and staff 2 as the bass. A file whose upper staff is written in the bass clef — a
#: one-staff part in the bass clef, or an upper staff that changes to it — is read wrong by
#: the two detectors that depend on the clef. Found from the file's own `<clef>` signs,
#: which is structure, not a demand reading; the readings are marked, never corrected here
#: (the detectors' readings are E22's seam).
CLEF_MISREAD = ("clef.bass", "pitch.ledger")
_CLEF = __import__("re").compile(r'<clef(?:\s+number="(\d)")?[^>]*>\s*<sign>([A-Z]+)</sign>')


def clef_misread(path: Path, staves: int | None) -> str | None:
    """Why the clef-dependent readings of this file are unreliable, or None."""
    from notation import read_musicxml

    text = read_musicxml(path)
    if text is None:
        return None
    upper = [sign for number, sign in _CLEF.findall(text) if number in ("", "1")]
    if not upper or "F" not in upper:
        return None
    if staves == 1 and upper[0] == "F":
        return "one staff in the bass clef: the detectors read staff 1 as the treble clef (detect.ts's clef assumption)"
    return "the upper staff moves into the bass clef: the detectors read staff 1 as the treble clef throughout (detect.ts's clef assumption)"


def established_by_density(located: dict[str, int], bars: int, table: dict, order: list[str]) -> list[str]:
    """
    The demands a notated item provides at a useful density (E0 item 3): the located
    count reaches the demand's `min` and its count per bar reaches `perBar`
    (`content/sources/opportunity-density.json`). In the vocabulary's order.

    The same arithmetic as `usefulDensity` in `app/src/curriculum/eligibility.ts`, over
    the same file; `eligibility.test.ts` holds the two equal on every built item.
    """
    rules = table["demands"]
    out = []
    for demand in order:
        rule = rules.get(demand)
        n = int(located.get(demand, 0))
        if rule is None or n <= 0:
            continue
        if n >= rule["min"] and n / max(bars, 1) >= rule["perBar"]:
            out.append(demand)
    return out


#: The window minimum where the density file states none (E1 item 9): two occurrences.
DEFAULT_MIN_IN_WINDOW = 2


def established_by_window(located: dict[str, int], bars: int, table: dict, order: list[str]) -> list[str]:
    """
    The demands an excerpt provides at a useful density (E1 item 9): the window rule — `perBar`
    reached and the located count at least `minInWindow` (two where the file states none) — in
    place of the whole-piece `min`, which a four-to-eight-bar cut cannot hold. The proposer reads
    the same rule for a window (`excerpt_proposer.window_rule`). In the vocabulary's order.
    """
    rules = table["demands"]
    out = []
    for demand in order:
        rule = rules.get(demand)
        n = int(located.get(demand, 0))
        if rule is None or n <= 0:
            continue
        if n >= rule.get("minInWindow", DEFAULT_MIN_IN_WINDOW) and n / max(bars, 1) >= rule["perBar"]:
            out.append(demand)
    return out


#: The bridge's per-printed-bar positions (E1 item 5), kept apart from the counts: the proposer
#: reads them, the catalogue never carries them, and the counts' cache stays the size it was.
POSITIONS_CACHE = "positions-cache.json"
POSITION_KEYS = ("positions", "everyBar", "hands", "printedBars")


def established_by_contract(entry: dict, row: dict) -> list[str]:
    """
    The demands a generated item provides at its own family's density (D0's contract):
    each `requires` rule that states a density — a count per bar, or a count of two or
    more — and that the item meets, by the contract's own gate (`pedagogical_faults`
    on that one rule). A rule asking only for presence states no density and
    establishes nothing here (the tie drill's one tie in four bars, D0 finding 6).
    """
    import family_contracts as FC

    family = ((entry.get("drill") or {}).get("generator") or {}).get("family")
    if not family or family not in FC.contracts():
        return []
    recipe = FC.recipe_of(entry)
    out = []
    for rule in FC.selected(FC.contract(family).get("requires"), recipe):
        if "minPer" not in rule and int(rule.get("min", 0)) < 2:
            continue
        faults = FC.pedagogical_faults({"requires": [rule], "target": {"primary": []}}, recipe, row)
        if not faults and rule["demand"] not in out:
            out.append(rule["demand"])
    return out


def attach_demands(entries: list[dict], out_dir: Path) -> tuple[int, int, int]:
    """
    The demands the app's own detectors measure on every bundled score, on its row (E0
    item 1; E23): `demands` (the ids, in the vocabulary's order) and `measurement` — the
    located count of each demand, the bars, steps and notes, which demands the item
    provides at a useful density (`established`), and the definitions they were measured
    under.

    **One measurement, through the bridge.** Every score file goes through
    `demands.measure_each`, which runs `app/src/demands/detect.ts` on the model the app
    makes of the file (`demandsOfFiles.test.ts`): authored, PDMX, Kern, MuseTrainer and
    generated alike, never a Python reading of a demand. Measured on the arrangement in
    the file; nothing here reads a title, a genre or a level.

    **Cached on the file's bytes** in `build/demands-cache.json`, like
    `attach_notation`, and on `demands.definition_fingerprint()`: a changed detector,
    model or vocabulary discards the cache and every file is measured again; a changed
    score is measured again alone.

    **Never an empty list that reads as "no demands".** A file the app cannot load, a
    score that is not notation, a piece whose notation is not bundled: `demands:
    "unmeasured"` and `measurement.status: "unmeasured"` with the reason. A runtime drill
    writes no score: it has no `demands` at all and `measurement.status: "runtime"`,
    because its demands belong to each phrase it makes.

    Returns (measured, unmeasured, runtime).
    """
    import demands as D

    table = read_json(DENSITY_FILE)
    assert isinstance(table, dict)
    vocabulary = read_json(CONTENT_SRC / "curriculum" / "vocabulary" / "demands.json")
    assert isinstance(vocabulary, dict)
    order = [d["id"] for d in vocabulary["demands"]]
    fingerprint = D.definition_fingerprint()
    definitions = D.evidence_definitions()
    cache_path = BUILD_DIR / "demands-cache.json"
    cache = read_json(cache_path) if cache_path.exists() else {}
    assert isinstance(cache, dict)
    rows: dict[str, dict] = dict(cache.get("files") or {}) if cache.get("fingerprint") == fingerprint else {}
    # E1: the positions, beside the counts under the same fingerprint. A file whose counts are
    # cached without its positions (a cache from before E1) is measured again.
    positions_path = BUILD_DIR / POSITIONS_CACHE
    positions_cache = read_json(positions_path) if positions_path.exists() else {}
    assert isinstance(positions_cache, dict)
    positions: dict[str, dict] = (dict(positions_cache.get("files") or {})
                                  if positions_cache.get("fingerprint") == fingerprint else {})
    rows = {sha: row for sha, row in rows.items() if sha in positions or "error" in row}

    def unmeasured(entry: dict, reason: str) -> None:
        entry["demands"] = "unmeasured"
        entry["measurement"] = {"status": "unmeasured", "reason": reason}

    planned: list[tuple[dict, str]] = []
    todo: dict[str, Path] = {}
    runtime = 0
    for entry in entries:
        rel = entry.get("file")
        if not rel:
            if entry.get("drill"):
                entry.pop("demands", None)
                reading = (entry.get("drill") or {}).get("kind") == "sight-reading"
                entry["measurement"] = {
                    "status": "runtime",
                    "reason": (
                        "made when it opens: each phrase's demands are the reading controls', held to the rung that opens it"
                        if reading
                        else "made when it opens: a runtime drill writes no score the build can measure"
                    ),
                }
                runtime += 1
            else:
                unmeasured(entry, "no notation is bundled: it arrives when the learner imports the piece")
            continue
        path = out_dir / rel
        if not path.exists():
            unmeasured(entry, "the score file was not built")
            continue
        if path.suffix.lower() not in NOTATION_SUFFIXES:
            unmeasured(entry, f"not notation the detectors read (a {path.suffix.lstrip('.').upper()} file)")
            continue
        sha = _sha256(path)
        planned.append((entry, sha))
        if sha not in rows:
            todo[sha] = path

    if todo:
        answered = D.measure_each(list(todo.values()))
        for sha, path in todo.items():
            row = dict(answered[str(path)])
            if "error" not in row:
                positions[sha] = {key: row.pop(key) for key in POSITION_KEYS if key in row}
            rows[sha] = row

    measured = 0
    failed = 0
    for entry, sha in planned:
        row = rows[sha]
        if "error" in row:
            unmeasured(entry, f"the app could not load the file: {row['error']}")
            failed += 1
            continue
        located = {demand: int(n) for demand, n in (row.get("opportunities") or {}).items() if int(n) > 0}
        by_density = established_by_density(located, int(row["measures"]), table, order)
        # An excerpt is a window (E1 item 9): the window rule establishes what the whole-piece
        # count cannot, and `window` says which.
        by_window = ([d for d in established_by_window(located, int(row["measures"]), table, order) if d not in by_density]
                     if entry.get("type") == "excerpt" else [])
        by_contract = [d for d in established_by_contract(entry, row) if d not in by_density and d not in by_window]
        misread = clef_misread(out_dir / entry["file"], (entry.get("notation") or {}).get("staves"))
        # A reading known to be wrong on this file never establishes an opportunity; it stays
        # among the ids, so the gate still treats it as something the learner may have to meet.
        established = [d for d in order if (d in by_density or d in by_window or d in by_contract)
                       and not (misread and d in CLEF_MISREAD)]
        entry["demands"] = list(row["demands"])
        entry["measurement"] = {
            "status": "measured",
            "definitions": definitions,
            "detectors": fingerprint,
            "located": located,
            "bars": int(row["measures"]),
            "steps": int(row["steps"]),
            "notes": int(row["notes"]),
            "established": established,
            **({"contract": [d for d in by_contract if d in established]} if [d for d in by_contract if d in established] else {}),
            **({"window": [d for d in by_window if d in established]} if [d for d in by_window if d in established] else {}),
            **({"misread": {"demands": list(CLEF_MISREAD), "why": misread}} if misread else {}),
        }
        measured += 1

    write_json(cache_path, {"fingerprint": fingerprint, "files": {sha: rows[sha] for _e, sha in planned}})
    # Compact: the proposer's input, per printed bar, a few megabytes indented would be many more.
    positions_path.parent.mkdir(parents=True, exist_ok=True)
    with positions_path.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump({"fingerprint": fingerprint, "files": {sha: positions[sha] for _e, sha in planned if sha in positions}},
                  handle, ensure_ascii=False, separators=(",", ":"))
        handle.write("\n")

    # A reader that fails on most files is a broken bridge, not a library of unreadable
    # scores (attach_notation's lesson): stop, rather than ship a catalog of "unmeasured".
    if planned and failed > len(planned) // 10:
        raise SystemExit(
            f"attach_demands: {failed} of {len(planned)} score files could not be measured. "
            f"That is the detector run failing, not the library; the first: "
            f"{next(e['measurement']['reason'] for e, _s in planned if e.get('demands') == 'unmeasured')}"
        )
    unmeasured_count = sum(1 for entry in entries if entry.get("demands") == "unmeasured")
    return measured, unmeasured_count, runtime


def source_kind(entry: dict) -> str:
    """Where an item's notes come from (R35): the one answer every provenance record starts from."""
    tags = set(entry.get("tags") or [])
    rel = entry.get("file") or ""
    drill = entry.get("drill") or {}
    if entry.get("type") == "excerpt":
        # A passage cut by the build from its parent's file (E1): its own kind, whatever the
        # parent's was, with the parent's chain carried in its `excerpt` block.
        return "excerpt"
    if drill.get("generator") or rel.startswith("scores/generated/"):
        return "generated"
    if not rel and drill:
        return "runtime"
    if "pdmx" in tags:
        return "pdmx"
    if "kern" in tags:
        return "kern"
    if "musetrainer" in tags:
        return "musetrainer"
    if "mutopia" in tags:
        return "mutopia"
    if "authored" in tags or rel.startswith("scores/authored/"):
        return "authored"
    if not rel:
        return "placeholder"
    return "unknown"


def attach_provenance(entries: list[dict], out_dir: Path | None = None) -> None:
    """
    Where every item came from and how each fact about it is known (E0 item 2; R35,
    R15, R11, Part 21 §B): `provenance` on every row.

    - `source`: authored, pdmx, kern, musetrainer, mutopia (Q76: its `converter` names the MIDI
      converter, the published MIDI it read by checksum and the .ly its spelling came from),
      generated (with D0's identity), runtime (a drill the app makes when it opens), placeholder
      (not bundled).
    - `edition`, `composition`, `arrangement`: R15's chain as far as the data knows it.
      An authored variant names its tune by `variantOf` (authored); otherwise the
      composition is `work_key` of the title and composer — the PDMX identity function,
      conservative by design (two keys that differ may still be one piece; two that
      match are one), so it is `inferred`. A PDMX duplicate edition shares its
      arrangement with the upload it duplicates.
    - `converter` / `generator`: what turned the source into the score, by version.
    - `facts`: each fact with how it is known — `measured` (the detectors, by their
      definitions), `inferred` (the converter's default tempo, a level estimate, an
      identity key), `authored` (written by the edition, the generator's recipe or this
      repository), `reviewed` (a person's decision). Never flattened into one field.
      Where the tempo is inferred, the tempo-sensitive demands are listed untrusted.
    - `review`: R42's two decisions as separate bits — a usable, faithful score; a good
      teaching use — filled from the human review record (`content/review/decisions.jsonl`,
      D2) by `review.fill_reviewed`: each dimension's current decision on the item's current
      identity (a triage line or a stale identity never), as the bit (`yes` true; `no` and
      `fix` false) and as a `reviewed` fact with the value, the basis, the date and the event
      id (`reviewedScore`, `reviewedTeaching`). `null` is "no person has decided". A PDMX
      row's quarry `keep` is a source-level decision of the quarry, recorded as `quarryKeep`
      (the decision; the reviewer's note stays in `pdmx.json`) and never read as either bit
      (Part 12 §14: one keep bit never implies both). `out_dir` is where the built score
      files are, for a notated item's identity (the file's sha256).
    - `physical`: a generated item's declared large-hand voicing, with its prerequisite
      and alternative (D0 finding 5), so no selector recommends it without them.
    - `facts.promise` (D3a): a generated item's promise, `music` or `drill`, as an `authored`
      fact from the contract table — the rule matching the item's recipe (`review.promise_of`,
      the microscope's reading; the `meter` family is a drill in 5/4 and music in 12/8), never
      the row's first rule — so the app's one gate can keep a music-promising item with no
      affirmative teaching-use decision out of automatic offers without reading the table. A
      runtime drill and a notated item carry none.
    - `identity` (D4 item 1): the material identity on every row, D2's `Identity` as
      `review.current_identity` computes it — a generated item's generator triple, recipe and tempo;
      a notated item's built file by its sha256 (an excerpt's cut included); `none`, with the reason,
      for a drill made when it opens or a placeholder — so every run can store the exact versioned
      material it played and the app never recomputes it.
    - `transferOf` (D4 item 4): a transfer role's relationship as its family contract declares it for
      the recipe (`transfer_of`: the skill, the families it was written against, the dimensions
      declared to differ, what stays unmeasured), an authored fact; intent, never evidence.
    """
    import family_contracts as FC
    from convert import tool_fingerprint
    from pdmx.shortlist import work_key
    from review import promise_of

    table = read_json(DENSITY_FILE)
    assert isinstance(table, dict)
    tempo_sensitive = set(table["tempoSensitive"])
    pdmx_rows: dict[str, dict] = {}
    pdmx_path = CONTENT_SRC / "sources" / "pdmx.json"
    if pdmx_path.exists():
        data = read_json(pdmx_path)
        assert isinstance(data, dict)
        pdmx_rows = {row["id"]: row for row in data.get("items", [])}
    converter = {"name": "tools/content/convert.py", "version": tool_fingerprint()[:12]}
    by_id = {entry["id"]: entry for entry in entries}

    def root_of(entry: dict) -> dict:
        seen = {entry["id"]}
        here = entry
        while here.get("variantOf") and here["variantOf"] in by_id and here["variantOf"] not in seen:
            seen.add(here["variantOf"])
            here = by_id[here["variantOf"]]
        return here

    for entry in entries:
        kind = source_kind(entry)
        # Q76: what the [MUTO] import did, carried on the row only as far as this step.
        mutopia = entry.pop("_mutopia", None)
        if kind == "excerpt":
            continue  # after every parent's record, below: it carries the parent's chain down
        source = entry.get("source") or {}
        checksum = str(source.get("checksum") or "").replace("sha256:", "")
        drill = entry.get("drill") or {}
        facts: dict[str, dict] = {}
        record: dict = {"source": kind}

        # --- identity (R15) -----------------------------------------------------
        if kind == "generated":
            generator = drill.get("generator") or {}
            record["generator"] = {
                "name": "tools/content/generate_exercises.py",
                "family": generator.get("family"),
                "version": generator.get("version"),
                "seed": generator.get("seed"),
            }
        elif kind == "runtime":
            record["generator"] = {"name": "the app, when the drill opens", "kind": drill.get("kind")}
        else:
            if kind == "pdmx":
                row = pdmx_rows.get(entry["id"], {})
                cid = row.get("cid") or Path(entry.get("file") or "").stem or None
                record["edition"] = f"pdmx:{cid}" if cid else None
                duplicate = row.get("duplicateOf")
                record["arrangement"] = duplicate or entry["id"]
                facts["arrangement"] = {"kind": "authored" if duplicate else "inferred",
                                        "via": "the quarry's duplicate edition" if duplicate else "one upload, one arrangement"}
                # The decision alone: the reviewer's note is working prose with no source
                # (one names a year T22 removed from every catalogue field), and it stays in
                # the source table.
                decision = (row.get("review") or {}).get("decision")
                if decision:
                    record["quarryKeep"] = decision
            elif kind == "mutopia" and mutopia:
                record["edition"] = mutopia["edition"]
                record["arrangement"] = entry["id"]
                facts["arrangement"] = {"kind": "authored", "via": "one catalogue entry per edition"}
            else:
                record["edition"] = f"{kind}:sha256:{checksum[:16]}" if checksum else None
                record["arrangement"] = entry["id"]
                facts["arrangement"] = {"kind": "authored", "via": "one catalogue entry per edition or arrangement"}
            root = root_of(entry)
            if root is not entry:
                record["composition"] = f"variant-of:{root['id']}"
                facts["composition"] = {"kind": "authored", "via": "variantOf"}
            else:
                artist = str((pdmx_rows.get(entry["id"]) or {}).get("artist") or "")
                record["composition"] = f"work:{work_key(entry.get('title') or '', entry.get('composer'), artist)}"
                facts["composition"] = {"kind": "inferred", "via": "work_key (title and composer)"}
            if kind in ("pdmx", "kern", "musetrainer"):
                record["converter"] = converter
            elif kind == "mutopia" and mutopia:
                # The source artifact is the MIDI Mutopia publishes, never its notation (the reviewer, Q76).
                record["converter"] = {**mutopia["converter"], "normaliser": converter,
                                       "artifact": mutopia["artifact"], "spelling": mutopia["spelling"]}
            elif kind == "authored":
                record["converter"] = {"name": "tools/content/author.py", "version": converter["version"]}

        # --- the facts ----------------------------------------------------------
        measurement = entry.get("measurement") or {}
        if measurement.get("status") == "measured":
            facts["demands"] = {
                "kind": "measured",
                "via": "app/src/demands/detect.ts",
                "definitions": measurement.get("definitions"),
                "detectors": measurement.get("detectors"),
            }
            if measurement.get("misread"):
                facts["demands"]["misread"] = measurement["misread"]["demands"]
                facts["demands"]["misreadWhy"] = measurement["misread"]["why"]
        elif measurement.get("status") == "unmeasured":
            facts["demands"] = {"kind": "unmeasured", "why": measurement.get("reason")}
        else:
            facts["demands"] = {"kind": "runtime", "why": measurement.get("reason")}

        if kind in ("generated", "authored"):
            facts["tempo"] = {"kind": "authored", "via": "the recipe" if kind == "generated" else "this repository's score"}
        elif kind == "pdmx":
            defaulted = "tempo-defaulted" in (entry.get("tags") or [])
            facts["tempo"] = ({"kind": "inferred", "via": "convert.py's default (the upload has no tempo of its own)"}
                              if defaulted else {"kind": "authored", "via": "the upload"})
        elif kind in ("kern", "musetrainer"):
            facts["tempo"] = ({"kind": "authored", "via": "the edition"} if entry.get("tempoBpm")
                              else {"kind": "inferred", "via": "convert.py's default (the edition has no tempo of its own)"})
        elif kind == "mutopia":
            facts["tempo"] = ({"kind": "authored", "via": "the edition's tempo mark, as its published MIDI carries it"}
                              if (mutopia or {}).get("tempoFromEdition")
                              else {"kind": "inferred", "via": "the published MIDI's tempo, LilyPond's default where the edition states none"})
        if facts.get("tempo", {}).get("kind") == "inferred" and isinstance(entry.get("demands"), list):
            untrusted = [d for d in entry["demands"] if d in tempo_sensitive]
            if untrusted:
                facts["demands"]["untrusted"] = untrusted
                facts["demands"]["untrustedWhy"] = "their difficulty depends on a tempo the converter supplied, not one the score states"

        if entry.get("levelSource") == "estimated":
            facts["level"] = {"kind": "inferred", "via": "an estimate (the difficulty model, or an opus banded on import)"}
        else:
            facts["level"] = {"kind": "authored", "via": "judged for this item"}
        if kind in ("generated", "authored"):
            facts["hands"] = {"kind": "authored", "via": "the recipe" if kind == "generated" else "this repository's score"}
        elif kind in ("pdmx", "kern", "musetrainer"):
            facts["hands"] = {"kind": "authored", "via": "the edition's staves"}
        elif kind == "mutopia":
            facts["hands"] = {"kind": "authored", "via": "the edition's staves, a MIDI track each"}
        if entry.get("type") == "song" and (entry.get("notation") or {}).get("keys"):
            facts["key"] = {"kind": "measured", "via": "the file's signature and final bass (build.settle_key_signatures)"}
        elif kind == "generated":
            facts["key"] = {"kind": "authored", "via": "the recipe"}
        if entry.get("targetSkills"):
            facts["targetSkills"] = ({"kind": "authored", "via": f"the family contract, version {(drill.get('generator') or {}).get('version')}"}
                                     if kind == "generated" else {"kind": "authored", "via": "the vocabulary's reading rows (C2)"})
        if entry.get("role"):
            facts["role"] = {"kind": "authored", "via": "the family contract"}

        record["facts"] = facts
        record["review"] = {"score": None, "teaching": None}

        if kind == "generated":
            family = (drill.get("generator") or {}).get("family")
            if family in FC.contracts():
                facts["promise"] = {"kind": "authored", "via": "family_contracts.json (the rule matching the recipe)",
                                    "value": promise_of(FC.contract(family), FC.recipe_of(entry))}
                large = (FC.contract(family).get("physical") or {}).get("largeHand")
                if large and FC.matches(large.get("when"), FC.recipe_of(entry)):
                    record["physical"] = {
                        "largeHandSpan": large.get("span"),
                        "prerequisite": large.get("prerequisite"),
                        "alternative": large.get("alternative"),
                    }
                # D4 item 4: a transfer role's relationship as the contract declares it for the recipe.
                relation = transfer_of(FC.contract(family), FC.recipe_of(entry)) if entry.get("role") == "transfer" else None
                if relation is not None:
                    record["transferOf"] = relation
                    facts["transferOf"] = {"kind": "authored", "via": "family_contracts.json (the rule matching the recipe)"}
        entry["provenance"] = record

    # E1 item 4: an excerpt's record, from its parent's. Its identity is the chain the parent
    # has — composition and arrangement carried down — plus the `excerpt` block: the definition,
    # the cut version, the parent's bytes at cut time and edition, and the key over them.
    import excerpts as excerpt_step

    for entry in entries:
        if source_kind(entry) != "excerpt":
            continue
        carried = entry.pop("_excerpt", None) or {}
        parent = by_id.get(entry.get("excerptOf") or "") or {}
        excerpt_step.settle_key(entry, parent)
        parent_record = parent.get("provenance") or {}
        parent_facts = parent_record.get("facts") or {}
        facts: dict[str, dict] = {}
        record: dict = {"source": "excerpt", "edition": parent_record.get("edition")}
        for name in ("composition", "arrangement"):
            if parent_record.get(name):
                record[name] = parent_record[name]
                facts[name] = {"kind": "inferred" if (parent_facts.get(name) or {}).get("kind") == "inferred" else "authored",
                               "via": f"the parent's ({entry.get('excerptOf')})"}
        record["converter"] = {"name": "tools/content/excerpts.py", "version": excerpt_step.CUT_VERSION}
        measurement = entry.get("measurement") or {}
        if measurement.get("status") == "measured":
            facts["demands"] = {
                "kind": "measured",
                "via": "app/src/demands/detect.ts",
                # The file measured: the cut, never the parent's.
                "on": entry.get("file"),
                "definitions": measurement.get("definitions"),
                "detectors": measurement.get("detectors"),
            }
            if measurement.get("misread"):
                facts["demands"]["misread"] = measurement["misread"]["demands"]
                facts["demands"]["misreadWhy"] = measurement["misread"]["why"]
        else:
            facts["demands"] = {"kind": "unmeasured", "why": measurement.get("reason")}
        tempo_fact = parent_facts.get("tempo")
        if tempo_fact:
            facts["tempo"] = {"kind": tempo_fact["kind"], "via": f"the parent's: {tempo_fact.get('via', '')}".rstrip(": ")}
            if tempo_fact["kind"] == "inferred" and isinstance(entry.get("demands"), list):
                untrusted = [d for d in entry["demands"] if d in tempo_sensitive]
                if untrusted:
                    facts["demands"]["untrusted"] = untrusted
                    facts["demands"]["untrustedWhy"] = "their difficulty depends on a tempo the converter supplied, not one the score states"
        facts["level"] = {"kind": "inferred", "via": "the difficulty model on the cut (tools/content/difficulty.py), never the parent's"}
        facts["hands"] = {"kind": "authored", "via": "the approved selection (content/sources/excerpts.json)"}
        facts["boundary"] = {"kind": "authored",
                             "via": f"the approved row in content/sources/excerpts.json (event {carried.get('event')}, by {carried.get('by')})"}
        if (entry.get("notation") or {}).get("keys"):
            facts["key"] = {"kind": "measured", "via": "the cut's signature, carried in from the parent at the cut"}
        record["facts"] = facts
        record["review"] = {"score": None, "teaching": None}
        if carried:
            record["excerpt"] = excerpt_step.provenance_block({"_excerpt": carried}, parent_record)
        entry["provenance"] = record

    # The reviewed facts (D2 item 4): the record's current decisions, per dimension.
    import review

    review.fill_reviewed(entries, out_dir)

    # D4 item 1: the material identity, D2's, on every row, from the same function the record binds to.
    for entry_id, identity in review.identities(entries, out_dir).items():
        by_id[entry_id]["provenance"]["identity"] = identity


def transfer_of(row: dict, recipe: dict) -> dict | None:
    """
    D4 item 4: the family contract's `transferOf` for a transfer item's recipe — the skill it is transfer
    material for, the families it was written against (`from`), the surface dimensions declared to differ
    and what stays unmeasured — as the rule matching the recipe (one object for the whole row, or a list
    of rules each with its `when`), `when` dropped. Intent and relationship facts, never evidence.
    """
    import family_contracts as FC

    declared = (row.get("roles") or {}).get("transferOf")
    if declared is None:
        return None
    for rule in declared if isinstance(declared, list) else [declared]:
        if FC.matches(rule.get("when"), recipe):
            return {key: value for key, value in rule.items() if key != "when"}
    return None


def attach_rung_tracks(entries: list[dict]) -> int:
    """
    A song on a genre rung carries that genre's track (2026-09-18).

    **The fault this fixes.** The Library filters by track, and a song's track
    came from its import bucket: a tango quarried into the classical bucket was
    `classical` and nothing else. So every song on the latin rung, every song on
    the rock rung and every "song" on the jam rung lacked the tag of the track
    whose rung offered it — the Latin and Rock & metal filters held **no songs
    at all**, only generated exercises, while their own lessons said "under
    Latin in the Library". Measured before the fix: latin 6 of 6 missing, rock 3
    of 3, jam 5 of 5, hymns 18 of 19, holiday 24 of 29, jazz 11 across its rungs.

    **Why this is not the guessing `import_pdmx` refuses to do.** That module's
    comment — "guessing tracks from a title is how the library fills with
    mislabelled rows" — is right, and this is not that. Nothing here reads a
    title. The curriculum has already *stated* that this song serves this track,
    by putting it on that track's rung; this only carries the statement to the
    row the Library reads. One fact, asserted in one place, propagated rather
    than repeated.

    The track is **added, not replaced**: *Greensleeves (with chords)* is on the
    hymns rung and is still a core and a classical piece, and a filter that
    stopped showing it under Classical would have traded one missing row for
    another.
    """
    curriculum_dir = CONTENT_SRC / "curriculum"
    if not curriculum_dir.exists():
        return 0
    wanted: dict[str, set[str]] = {}
    for path in sorted(curriculum_dir.glob("stage-*.json")):
        data = read_json(path)
        assert isinstance(data, dict)
        for stage in data.get("stages", []):
            for unit in stage.get("units", []):
                track = unit.get("track")
                # `core` is not a genre and every item would collect it; the
                # rung's own track is the claim worth carrying.
                if not track or track in {"core", "practice", "technique", "theory-ear"}:
                    continue
                for lesson in unit.get("lessons", []):
                    for item_id in lesson.get("songOptions", []):
                        wanted.setdefault(item_id, set()).add(track)
    touched = 0
    for entry in entries:
        extra = wanted.get(entry["id"])
        if not extra:
            continue
        tracks = list(entry.get("tracks") or [])
        missing = [t for t in sorted(extra) if t not in tracks]
        if not missing:
            continue
        entry["tracks"] = tracks + missing
        touched += 1
    return touched


def attach_sections(entries: list[dict]) -> int:
    """
    Merges `content/sources/sections.json` into each item's `teaching.sections`.

    One file rather than three mechanisms: an item's notes arrive through
    authored ABC, an importer or the PDMX quarry, and the sections are the same
    kind of fact about the music whichever way the file got here.

    A section naming an item that is not in the catalog is left alone here and
    reported by `validate.py`; the build is not the place to decide whether
    that is a typo or an item that has not been generated yet.
    """
    path = CONTENT_SRC / "sources" / "sections.json"
    if not path.exists():
        return 0
    data = read_json(path)
    assert isinstance(data, dict)
    by_id = data.get("sections", {})
    assert isinstance(by_id, dict)
    touched = 0
    for entry in entries:
        ranges = by_id.get(entry["id"])
        if not ranges:
            continue
        teaching = dict(entry.get("teaching") or {})
        teaching["sections"] = [
            {"label": r["label"], "fromMeasure": r["fromBar"], "toMeasure": r["toBar"]}
            for r in ranges
        ]
        entry["teaching"] = teaching
        touched += 1
    return touched


def copy_curriculum(out_dir: Path) -> Step:
    """
    Merges `content/curriculum/*.json` into one file.

    P5 writes those files; until then this produces the empty-but-valid
    curriculum the app already knows how to load, so the build is green before
    the content exists rather than after.
    """
    source_dir = CONTENT_SRC / "curriculum"
    tracks: list[dict] = []
    stages: list[dict] = []
    # `concepts.json` sits in the same directory but is a different thing: it
    # carries the display names and the per-concept finders, and is emitted
    # alongside the stages rather than merged into them.
    files = sorted(p for p in source_dir.glob("*.json") if p.name != CONCEPTS_FILE)         if source_dir.exists() else []
    for path in files:
        data = read_json(path)
        assert isinstance(data, dict)
        tracks.extend(data.get("tracks", []))
        stages.extend(data.get("stages", []))
    seen: set[str] = set()
    unique_tracks = [t for t in tracks if not (t["id"] in seen or seen.add(t["id"]))]
    stages.sort(key=lambda stage: stage["number"])

    # The prompts are generated here, not authored (replan §4.1): one wording
    # change fixes every rung at once, and what ships can be checked. A lesson's
    # concepts are deliberately not passed to the seed list (E2a, Entry 111): a
    # rung's finder states a key, a metre, a genre and a level the seed's works
    # carry none of, and matched on any one of the lesson's concepts, most of the
    # seeded examples contradicted the rung's own "must" or "avoid" (Minuet in G
    # beside "C major" and "avoid moving left hand"). The concept entries below
    # pass their own id, where the seed's claim and the prompt's subject agree.
    lessons_with_finders = 0
    for stage in stages:
        for unit in stage.get("units", []):
            for lesson in unit.get("lessons", []):
                block = lesson.get("finder")
                if not block:
                    continue
                lesson["finder"] = finder.generate(
                    block, what=finder.lesson_what(stage["number"], lesson["title"])
                )
                lessons_with_finders += 1

    concepts = []
    concepts_path = source_dir / CONCEPTS_FILE
    if concepts_path.exists():
        data = read_json(concepts_path)
        assert isinstance(data, dict)
        for entry in data.get("concepts", []):
            out = {"id": entry["id"], "display": entry["display"]}
            if entry.get("appFeature"):
                # Nothing to find: "wait mode" is a feature of this app. The
                # Skills screen still needs the name, and saying so is better
                # than a finder that sends the owner looking for sheet music
                # about a button.
                out["appFeature"] = True
            elif entry.get("finder"):
                # The concept's own id reaches the seed list (E2a): its works are named
                # among the examples where the seed knows the concept — a proposal for
                # the owner's search, never an admission.
                out["finder"] = finder.generate(
                    entry["finder"],
                    what=finder.concept_what(entry["display"].lower()),
                    concepts=[entry["id"]],
                )
            concepts.append(out)

    write_json(
        out_dir / "curriculum.json",
        {"version": 1, "tracks": unique_tracks, "stages": stages, "concepts": concepts},
    )
    return Step(
        "curriculum",
        ok=True,
        detail=f"{len(files)} file(s), {len(stages)} stage(s), "
               f"{lessons_with_finders} finder(s), {len(concepts)} concept(s)",
    )


#: Where the two generated reports live for the reviewer and the owner (E0 items 5 and 6).
RUNG_CLAIMS_MD = REPO_ROOT / "docs" / "prompts" / "rung-claims.md"
INVENTORY_MD = REPO_ROOT / "docs" / "prompts" / "inventory.md"


def step_reports(out_dir: Path, write_docs: bool) -> Step:
    """
    The rung-claims report and the inventory, from the catalogue and curriculum this build
    just wrote (E0 items 5 and 6; `claims.py`). Always as JSON under `build/`; as the two
    markdown files in `docs/prompts/` only for the default build, so a `--out` or
    `--quick` build never rewrites what the reviewer reads with a partial catalogue.

    Also the builder's microscope data (D2), under the builder-only `dev/` root beside the
    content directory (`app/public/dev/review/microscope.json` for the default build; D2a),
    never inside it: every file under `content/` is in the learner's precache (P19).
    """
    import claims

    catalog = read_json(out_dir / "catalog.json")
    curriculum = read_json(out_dir / "curriculum.json")
    assert isinstance(catalog, list) and isinstance(curriculum, dict)
    report = claims.rung_claims(catalog, curriculum)
    inventory = claims.inventory(catalog, curriculum)
    write_json(BUILD_DIR / "rung-claims.json", report)
    write_json(BUILD_DIR / "inventory.json", inventory)
    # The builder's microscope reads the report's data, the contracts' verdicts, the queue and
    # the record beside the catalogue (D2): one file under `dev/`, beside the built content and
    # never precached (D2a).
    import review

    review.write_microscope(out_dir, catalog, report)
    # D2 wrote it inside the built content; a checkout built before D2a still holds that copy,
    # served there and never precached, which the offline invariant refuses (P19).
    stale = out_dir / "review" / "microscope.json"
    if stale.is_file():
        stale.unlink()
        try:
            stale.parent.rmdir()
        except OSError:
            pass
    if write_docs:
        RUNG_CLAIMS_MD.write_text(claims.render_rung_claims(report), encoding="utf-8", newline="\n")
        INVENTORY_MD.write_text(claims.render_inventory(inventory), encoding="utf-8", newline="\n")
    s = report["summary"]
    detail = (f"{s['measurable']} checkable claims on {s['options']} options: {s['unestablished']} not established, "
              f"{s['rungClaimsKeptByNoOption']} kept by no option; {inventory['headline']['works']} works, "
              f"{inventory['headline']['arrangements']} arrangements")
    return Step("reports", ok=True, detail=detail + ("" if write_docs else " (docs/prompts left alone)"))


def copy_lessons(out_dir: Path) -> Step:
    source_dir = CONTENT_SRC / "lessons"
    target = out_dir / "lessons"
    if target.exists():
        shutil.rmtree(target)
    if not source_dir.exists():
        return Step("lessons", ok=True, detail="none yet", skipped=True)
    shutil.copytree(source_dir, target)
    return Step("lessons", ok=True, detail=f"{len(list(target.rglob('*.md')))} file(s)")


def copy_tips(out_dir: Path) -> Step:
    """
    The per-drill-kind advice, plus an index of which variants exist (replan §6).

    The index is what lets the app pick a variant without fetching files to
    find out whether they are there: it reads `when:` out of the front matter
    at build time, so the drill screen makes one request for the index and one
    for the file it actually wants.
    """
    source_dir = CONTENT_SRC / "tips"
    target = out_dir / "tips"
    if target.exists():
        shutil.rmtree(target)
    if not source_dir.exists():
        return Step("tips", ok=True, detail="none yet", skipped=True)
    shutil.copytree(source_dir, target)

    kinds: dict[str, dict] = {}
    for path in sorted(target.glob("*.md")):
        meta, _ = read_front_matter(path)
        kind = str(meta.get("kind") or "")
        if not kind:
            continue
        entry = kinds.setdefault(kind, {"variants": []})
        # `<kind>.<variant>.md`; a file named for the kind alone is the default.
        stem = path.stem
        if stem != kind and stem.startswith(f"{kind}."):
            entry["variants"].append(
                {"variant": stem[len(kind) + 1 :], "when": meta.get("when") or {}}
            )
    write_json(target / "index.json", {"kinds": kinds})
    variants = sum(len(entry["variants"]) for entry in kinds.values())
    return Step("tips", ok=True, detail=f"{len(kinds)} kind(s), {variants} variant(s)")


def copy_schemas(out_dir: Path) -> None:
    for name in ("catalog.schema.json", "curriculum.schema.json"):
        source = CONTENT_SRC / name
        if source.exists():
            shutil.copy2(source, out_dir / name)


def copy_level_model(out_dir: Path) -> None:
    """
    The levelling coefficients, where the app can fetch them (replan §4.4).

    The app levels a score the owner imports, and it must reach the same number
    the quarry did. Copying the fitted model into the served content rather
    than compiling it into TypeScript means refitting is a content change, not
    a code change — and there is exactly one file to be wrong about.
    """
    source = REPO_ROOT / "content" / "sources" / "level-model.json"
    if source.exists():
        shutil.copy2(source, out_dir / "level-model.json")


def step_validate(
    out_dir: Path, strict_license: bool, allow_nc: bool = False, personal: bool = False
) -> Step:
    """
    The validator: on a pass its verdict line is the detail, on a failure its whole output.

    Its `WARNING` lines are the step's warnings, on a pass and a failure alike (Q84): since Q75 and Q80 they name what
    this build could not measure or could not fetch, and keeping the verdict alone on a pass dropped them, so the one
    log a Pages deploy leaves said "content validation OK" and nothing else. The summary prints them under the step,
    in the validator's own words, as it prints the `[MUTO]` step's placeholders.
    """
    args = ["--dir", str(out_dir)]
    if strict_license:
        args.append("--strict-license")
    if allow_nc:
        args.append("--allow-nc")
    if personal:
        args.append("--personal")
    code, output = python("validate.py", *args)
    warned = [line.strip() for line in output.splitlines() if line.strip().startswith("WARNING")]
    return Step("validate", ok=code == 0, detail=output if code else summary_line(output), warnings=warned)


def step_render(out_dir: Path, limit: int) -> Step:
    args = ["--content", str(out_dir), "--apply"]
    if limit:
        args += ["--limit", str(limit)]
    code, output = python("render_check.py", *args)
    return Step("render check", ok=code == 0, detail=summary_line(output), warnings=[] if code == 0 else [output])


def clean_scores(out_dir: Path) -> None:
    """
    Removes previously built scores.

    Without this a renamed or excluded item stays in the output directory for
    ever and gets precached into the app, which is how a piece we decided not
    to ship would ship anyway.
    """
    scores = out_dir / "scores"
    if scores.exists():
        shutil.rmtree(scores)


def display_path(path: Path) -> str:
    """The output path, shortened when it sits inside the repository."""
    try:
        return str(path.relative_to(REPO_ROOT))
    except ValueError:
        # --out can point anywhere; a scratch directory outside the repo is a
        # normal thing to ask for and must not crash the summary line.
        return str(path)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--offline", action="store_true", help="never touch the network")
    parser.add_argument("--quick", action="store_true", help="a small generator subset")
    parser.add_argument("--render", action="store_true", help="render every item in Chromium")
    parser.add_argument("--render-limit", type=int, default=0)
    parser.add_argument("--skip-fetch", action="store_true")
    parser.add_argument(
        "--no-cache",
        action="store_true",
        help="ignore build/cache/convert and reconvert every source",
    )
    parser.add_argument(
        "--strict-license",
        action="store_true",
        default=os.environ.get("PIANOPATH_STRICT_LICENSE") == "1",
        help=(
            "fail on any licence that is not redistributable; also settable with "
            "PIANOPATH_STRICT_LICENSE=1, which is how the Pages deploy asks for it "
            "when the content build runs inside `npm run build`"
        ),
    )
    parser.add_argument(
        "--allow-nc",
        action="store_true",
        help="include CC BY-NC editions — a personal build only, never deployed (docs/00 D10a)",
    )
    # The owner's build is *the* build, so this defaults on (owner, 2026-09-12:
    # "just forget about the personal flag thing. It should always treat the app
    # as my personal app which it is, even though it's on a public repo").
    #
    # Off, 159 items never reach the app: the whole ragtime ladder at Stages 6-8
    # and the repertoire several mini-modules are named for are placeholders, and
    # the Plan screen reads as a wall of rungs nothing can open. That is not a
    # licensing safeguard, it is a broken app — the safeguard is
    # `--strict-license`, which the Pages deploy runs and which refuses these
    # items at the point where they would actually be published.
    parser.add_argument(
        "--personal",
        action=argparse.BooleanOptionalAction,
        default=True,
        help=(
            "the owner's build (docs/00 D23), on by default: implies --allow-nc, and also admits "
            "items whose *composition* is not public domain. Pass --no-personal for a build that "
            "does not, and note that --strict-license, which the Pages deploy runs, refuses them "
            "regardless"
        ),
    )
    args = parser.parse_args()
    started = time.time()
    try:
        lock = content_lock("build.py")
        lock.__enter__()
    except ContentBusy as busy:
        print(f"content build refused: {busy}", file=sys.stderr)
        sys.exit(2)
    try:
        run_build(args, started)
    finally:
        lock.__exit__(None, None, None)


def run_build(args: argparse.Namespace, started: float) -> None:
    # A strict build is never a personal one, whatever the default says.
    #
    # `--personal` now defaults on, because the owner's build *is* the build and
    # off it leaves 159 items — the whole ragtime ladder among them — as rungs
    # that open nothing. But `allow_nc` is derived from it, so without this line
    # the Pages deploy would inherit it and publish CC BY-NC editions to the open
    # internet. `PIANOPATH_STRICT_LICENSE=1` is exactly the deploy asking not to
    # be a personal build, so it is honoured here rather than left to the caller
    # to remember to pass `--no-personal` as well.
    if args.strict_license:
        args.personal = False

    # One flag for the owner. --allow-nc was about the edition; --personal is
    # about the edition *and* the composition, and a build that admitted one
    # but not the other would be a distinction nobody asked for.
    allow_nc = args.allow_nc or args.personal

    args.out.mkdir(parents=True, exist_ok=True)
    BUILD_DIR.mkdir(parents=True, exist_ok=True)
    clean_scores(args.out)

    steps: list[Step] = []
    if not args.skip_fetch:
        steps.append(step_fetch(args.offline))
    steps.append(step_import(args.out, args.no_cache, args.personal))
    steps.append(step_import_kern(args.out, allow_nc, args.no_cache))
    steps.append(step_import_pdmx(args.out, args.personal, args.strict_license))
    steps.append(step_import_mutopia(args.out, args.offline or args.skip_fetch, args.no_cache))
    steps.append(step_generate(args.out, args.quick))
    steps.append(step_author(args.out, args.no_cache))
    steps.append(merge_catalog(args.out))
    steps.append(step_score_checks(args.out))
    steps.append(copy_curriculum(args.out))
    steps.append(step_reports(args.out, write_docs=args.out.resolve() == DEFAULT_OUT.resolve() and not args.quick))
    steps.append(copy_lessons(args.out))
    steps.append(copy_tips(args.out))
    copy_schemas(args.out)
    copy_level_model(args.out)
    steps.append(step_validate(args.out, args.strict_license, allow_nc, args.personal))
    if args.render:
        steps.append(step_render(args.out, args.render_limit))
        # The render check writes measured durations back, so validate again.
        steps.append(step_validate(args.out, args.strict_license, allow_nc, args.personal))

    print("\n--- content build ---")
    for step in steps:
        mark = "skip" if step.skipped else ("ok  " if step.ok else "FAIL")
        print(f"  {mark}  {step.name:16} {step.detail}")
        for warning in step.warnings:
            for line in warning.splitlines():
                print(f"          {line}")
    print(f"  {time.time() - started:.1f}s → {display_path(args.out)}")

    if any(not step.ok for step in steps):
        sys.exit(1)


if __name__ == "__main__":
    main()
