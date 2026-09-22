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


def step_score_checks(out_dir: Path) -> Step:
    """
    The seven score checks, as a gate on their `high` rows (T15, 2026-09-22).

    `--no-analysis` because the music21 key pass is the minutes in that tool and
    produces only medium and low rows, which never fail a build. The allow-file
    is `content/score-checks.allow.json`: a reason per row, and a high row with
    no entry stops the build naming it.
    """
    code, output = python("score_checks.py", "--gate", "--no-analysis", "--quiet")
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
    read = attach_notation(entries, out_dir)
    keyed = settle_key_signatures(entries)
    write_json(out_dir / "catalog.json", entries)
    detail = f"{len(entries)} items"
    if sections:
        detail += f", {sections} with named sections"
    if tracked:
        detail += f", {tracked} given a track by their rung"
    if read:
        detail += f", {read} read from the score"
    if keyed:
        detail += f", {keyed} keySig corrected"
    return Step("merge catalog", ok=True, detail=detail)


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

    **The rule**, which is `keyOf` in `app/tests/unit/lessonClaimsAboutMusic.
    test.ts` and `key_name` in `tools/content/notation.py` written once more:
    a stated mode is believed; with no stated mode the last bass note decides
    between the signature's major and its relative minor; and when it is
    neither, no mode is claimed at all and the signature alone is printed.

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
    # change fixes every rung at once, and what ships can be checked.
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
                out["finder"] = finder.generate(
                    entry["finder"], what=finder.concept_what(entry["display"].lower())
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
    args = ["--dir", str(out_dir)]
    if strict_license:
        args.append("--strict-license")
    if allow_nc:
        args.append("--allow-nc")
    if personal:
        args.append("--personal")
    code, output = python("validate.py", *args)
    return Step("validate", ok=code == 0, detail=output if code else summary_line(output))


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
    steps.append(step_generate(args.out, args.quick))
    steps.append(step_author(args.out, args.no_cache))
    steps.append(merge_catalog(args.out))
    steps.append(step_score_checks(args.out))
    steps.append(copy_curriculum(args.out))
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
