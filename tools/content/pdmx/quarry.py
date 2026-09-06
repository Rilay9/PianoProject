"""
raw/<cid>.mxl -> converted + features + level + a render verdict (replan §2.3).

Six machine gates, in order, first failure recorded. Everything here is a
question a person should never have to be asked, because the answer is a fact
about the file:

  1. parse and normalise    through convert_file: one part, two staves, tempo,
                            lyrics stripped. An exception rejects.
  2. round trip             the converted file must contain the same multiset
                            of (bar, staff, pitch) as the raw one — the P10
                            listen-check, generalised.
  3. structure              bars, a time signature, a plausible tempo, pitches
                            on a piano, not mostly empty, both staves unless it
                            is a single line.
  4. the P2 defect scan     a bar under half its time signature next to a short
                            grace note is the OSMD truncation bug.
  5. render                 through the app's own loader, with cursor-step
                            parity — the P2 invariant that has never been run
                            over content.
  6. duplicates             against the catalog, folded title + composer.

The order matters: each gate is cheaper than the one after it, and gate 5 costs
a browser. The per-band rejection rate is printed and written into the run
header, because replan §2.3's 40 % rule needs last run's number to compare
against.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
import unicodedata
from dataclasses import asdict, dataclass, field
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from paths import BUILD_DIR, REPO_ROOT  # noqa: E402

APP_DIR = REPO_ROOT / "app"
RENDER_SPEC = "tests/e2e/content-render.spec.ts"

#: Gates whose verdict is a property of the file, so it can be carried over.
#:
#: `render` is not one of them: it depends on the browser and on the app build,
#: both of which change between runs, and reusing a render failure would make a
#: fixed renderer look like broken content for ever.
FINAL_GATES = frozenset({"convert", "round-trip", "structure", "truncation", "extract"})

#: Structure gate bounds (replan §2.3 item 3).
MIN_BARS = 8
MIN_TEMPO, MAX_TEMPO = 30, 220
LOWEST_PIANO_MIDI, HIGHEST_PIANO_MIDI = 21, 108
MAX_EMPTY_BAR_RATIO = 0.20


@dataclass
class QuarryRow:
    cid: str
    ok: bool
    reason: str = ""
    gate: str = ""
    title: str = ""
    composer: str | None = None
    converted: str | None = None
    raw_sha256: str = ""
    converted_sha256: str = ""
    measures: int = 0
    notes: int = 0
    staves: int = 0
    tempo_bpm: float = 0.0
    tempo_defaulted: bool = False
    single_line: bool = False
    lyrics_stripped: int = 0
    features: dict = field(default_factory=dict)
    level: float = 0.0
    level_source: str = ""
    level_drivers: list = field(default_factory=list)
    duplicate_of: str | None = None
    render_steps: int = 0
    render_cursor_steps: int = 0
    render_ms: float = 0.0


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def fold_title(text: str) -> str:
    decomposed = unicodedata.normalize("NFKD", text or "")
    stripped = "".join(ch for ch in decomposed if not unicodedata.combining(ch)).lower()
    return " ".join(ch for ch in stripped if ch.isalnum() or ch.isspace()).split().__str__()


# --- gate 2: the round trip ---------------------------------------------------


def pitch_multiset(score) -> set[tuple[int, int, int]]:  # noqa: ANN001
    """
    (bar, staff, MIDI) for every note you *hear*, as a set of distinct triples.

    A set of `(bar, staff, pitch, index)` rather than a true multiset: two notes
    of the same pitch in the same bar and staff are common (a repeated note),
    so the index within the bar keeps them distinct without needing Counter
    semantics at every comparison site.

    **Tie continuations are not counted.** A note tied from the previous bar is
    one sound held, not a second attack, and music21 legitimately *adds* the
    continuation when the source left it implicit — a malformed tie repaired on
    export. Counting it made the round-trip gate reject files whose only crime
    was being fixed: measured on the real run, eight of twenty-nine round-trip
    failures were exactly one repaired tie. What this gate is for is the P10
    listen-check — the same notes, at the same moments — and a held note is one
    note by that measure.
    """
    out: set[tuple[int, int, int]] = set()
    counts: dict[tuple[int, int, int], int] = {}
    for index, part in enumerate(getattr(score, "parts", []) or [score]):
        staff = index + 1
        for measure in part.recurse().getElementsByClass("Measure"):
            number = int(measure.number or 0)
            for element in measure.recurse().notes:
                tie = getattr(element.tie, "type", None)
                if tie in ("stop", "continue"):
                    continue
                for pitch in element.pitches:
                    key = (number, staff, int(pitch.midi))
                    counts[key] = counts.get(key, 0) + 1
                    out.add((number, staff, int(pitch.midi) * 1000 + counts[key]))
    return out


def round_trip_ok(raw_score, converted_score) -> tuple[bool, str]:  # noqa: ANN001
    """
    The converted file must sound like the raw one.

    Compared as pitches per bar per staff, not as XML: the converter is
    *supposed* to change the file — it merges parts, strips lyrics and adds a
    tempo — and a byte comparison would reject every success. What it is not
    allowed to change is which notes are played when.
    """
    before = pitch_multiset(raw_score)
    after = pitch_multiset(converted_score)
    if before == after:
        return True, ""
    lost = len(before - after)
    gained = len(after - before)
    return False, f"round trip lost {lost} note(s) and gained {gained}"


# --- gate 3: structure --------------------------------------------------------


def structure_failure(score, result) -> tuple[str | None, dict]:  # noqa: ANN001
    """The structure gate, and the flags a passing file carries forward."""
    flags = {"tempo_defaulted": bool(getattr(result, "added_tempo", False)), "single_line": False}
    measures = list(score.recurse().getElementsByClass("Measure"))
    parts = list(getattr(score, "parts", []) or [score])
    bars = max(1, len(measures) // max(1, len(parts)))
    if bars < MIN_BARS:
        return f"{bars} bars (want >= {MIN_BARS})", flags

    signatures = list(score.recurse().getElementsByClass("TimeSignature"))
    if not signatures:
        return "no time signature", flags

    tempo = float(getattr(result, "tempo_bpm", 0) or 0)
    if not (MIN_TEMPO <= tempo <= MAX_TEMPO):
        return f"tempo {tempo:g} outside {MIN_TEMPO}-{MAX_TEMPO}", flags

    pitches = [int(p.midi) for element in score.recurse().notes for p in element.pitches]
    if not pitches:
        return "no notes", flags
    if min(pitches) < LOWEST_PIANO_MIDI or max(pitches) > HIGHEST_PIANO_MIDI:
        return f"pitch outside A0-C8 ({min(pitches)}-{max(pitches)})", flags

    empty = sum(1 for measure in measures if not list(measure.recurse().notes))
    if empty / max(1, len(measures)) > MAX_EMPTY_BAR_RATIO:
        return f"{empty}/{len(measures)} bars empty", flags

    if len(parts) < 2:
        # A single line is not repertoire, but it is exactly the Part F
        # reference set and the sight-reading corpus (replan §9.2), so it is
        # kept and labelled rather than rejected.
        flags["single_line"] = True
    return None, flags


# --- gate 5: render -----------------------------------------------------------


#: Where the candidates are staged so the browser can fetch them.
#:
#: The spec loads each item from `/PianoProject/content/<file>` — a URL, not a
#: path — so a file outside the served content root is simply not reachable and
#: every item comes back "Could not retrieve requested URL 0". Pointing
#: `CONTENT_DIR` at `build/pdmx/converted` is enough for the on-disk hashing
#: and not enough for the fetch, which is exactly the mistake the first real
#: run made. Staged under the served root instead, and removed afterwards.
STAGING = "scores/pdmx-quarry"


def render_batch(rows: list[QuarryRow], converted_dir: Path, out_dir: Path) -> dict[str, dict]:
    """
    Runs the app's own render spec over the converted files.

    An explicit item list rather than a catalog (`CONTENT_ITEMS_JSON`): these
    files are not in the catalog and most of them never will be. Everything
    else about the check — the loader, the extractor, the cursor walk, the
    console capture — is the same code the content build runs, which is the
    only way this gate means what it says.
    """
    content_dir = APP_DIR / "public" / "content"
    # Both roots. `public/` is the source vite copies from; `dist/` is what the
    # preview server actually serves, and `reuseExistingServer` means a run may
    # skip the rebuild entirely and serve a `dist/` that predates the staging.
    # That is the second half of the same bug: staging into `public/` alone
    # left every item reporting "Could not retrieve requested URL 0" again.
    roots = [content_dir, APP_DIR / "dist" / "content"]
    staged: list[Path] = []
    for root in roots:
        if not root.parent.is_dir():
            continue
        staging = root / STAGING
        if staging.exists():
            shutil.rmtree(staging)
        staging.mkdir(parents=True)
        staged.append(staging)
        for row in rows:
            shutil.copyfile(converted_dir / f"{row.cid}.mxl", staging / f"{row.cid}.mxl")

    # The render spec keeps its own manifest, keyed on each file's sha256, and
    # replays a remembered verdict rather than rendering again. That is right
    # for a *pass* and wrong for a failure: a failed render is exactly what
    # changes when the app, the staging or the renderer is fixed, and leaving
    # one in the manifest means the next run replays it and nothing is ever
    # re-tried. This is what made the second real quarry run reproduce the
    # first one's 249 failures without opening a browser.
    manifest_path = out_dir / "render-manifest.json"
    if manifest_path.is_file():
        try:
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            manifest = None
        if isinstance(manifest, dict):
            kept = {
                key: entry
                for key, entry in (manifest.get("entries") or {}).items()
                if entry.get("ok")
            }
            dropped = len(manifest.get("entries") or {}) - len(kept)
            if dropped:
                manifest["entries"] = kept
                manifest_path.write_text(
                    json.dumps(manifest, indent=2) + chr(10), encoding="utf-8"
                )
                print(f"  dropped {dropped} remembered render failure(s); they will be re-tried")

    items_path = out_dir / "render-items.json"
    report_path = out_dir / "render-report.json"
    items_path.write_text(
        json.dumps(
            [
                {"id": row.cid, "title": row.title or row.cid, "file": f"{STAGING}/{row.cid}.mxl"}
                for row in rows
            ],
            indent=2,
        ),
        encoding="utf-8",
    )
    environment = dict(os.environ)
    environment.update(
        {
            "CONTENT_RENDER_CHECK": "1",
            "CONTENT_ITEMS_JSON": str(items_path.resolve()),
            "CONTENT_DIR": str(content_dir.resolve()),
            "CONTENT_RENDER_REPORT": str(report_path.resolve()),
            "CONTENT_PREVIEW_DIR": str((out_dir / "previews").resolve()),
            "CONTENT_RENDER_MANIFEST": str((out_dir / "render-manifest.json").resolve()),
            "CONTENT_RENDER_LIMIT": "0",
            "CONTENT_RENDER_FULL": "0",
        }
    )
    npx = shutil.which("npx") or "npx"
    try:
        subprocess.run(
            [npx, "playwright", "test", RENDER_SPEC, "--reporter=list"],
            cwd=APP_DIR,
            env=environment,
            check=False,
        )
    finally:
        # Left behind, these would be precached into the app and shipped —
        # files nobody has reviewed, in a directory nothing else knows about.
        for staging in staged:
            shutil.rmtree(staging, ignore_errors=True)

    if not report_path.is_file():
        return {}
    report = json.loads(report_path.read_text(encoding="utf-8"))
    return {entry["id"]: entry for entry in report.get("items", [])}


# --- gate 6: duplicates -------------------------------------------------------


def catalog_index(catalog_path: Path) -> dict[str, str]:
    """Folded `title|composer` -> catalog id, for the duplicate gate."""
    if not catalog_path.is_file():
        return {}
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    return {
        f"{fold_title(item.get('title', ''))}|{fold_title(item.get('composer') or '')}": item["id"]
        for item in catalog
        if item.get("type") == "song"
    }


# --- the loop -----------------------------------------------------------------


def previous_rows(out_dir: Path) -> dict[str, dict]:
    """
    Last run's verdicts, keyed by cid.

    A quarry run is minutes of music21 per hundred files and a browser pass on
    top, and the usual reason to run it again is that the *selector* changed —
    a name added to the composer table, a band re-tuned — which leaves most of
    the previous run's files bit-for-bit identical. Reusing a verdict whose raw
    file has the same sha256 is free and correct; anything else is re-quarried.
    """
    path = out_dir / "quarried.json"
    if not path.is_file():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}
    return {row["cid"]: row for row in data.get("rows", []) if row.get("cid")}


def quarry(
    candidates: list[dict],
    raw_dir: Path,
    out_dir: Path,
    *,
    catalog_path: Path,
    skip_render: bool = False,
    reuse: bool = True,
) -> list[QuarryRow]:
    from convert import convert_file, parse_source  # late: music21 is slow to import
    from truncation_scan import scan_file

    import difficulty

    model = difficulty.load_model()
    duplicates = catalog_index(catalog_path)
    converted_dir = out_dir / "converted"
    converted_dir.mkdir(parents=True, exist_ok=True)

    rows: list[QuarryRow] = []
    passed_to_render: list[QuarryRow] = []
    earlier = previous_rows(out_dir) if reuse else {}
    reused = 0

    for candidate in candidates:
        cid = candidate["cid"]
        raw = raw_dir / f"{cid}.mxl"
        row = QuarryRow(cid=cid, ok=False, title=candidate.get("title", ""),
                        composer=candidate.get("composer"))
        if not raw.is_file():
            row.gate, row.reason = "extract", "not extracted"
            rows.append(row)
            continue
        row.raw_sha256 = sha256(raw)

        was = earlier.get(cid)
        if was and was.get("raw_sha256") == row.raw_sha256:
            previous = QuarryRow(**was)
            if previous.gate in FINAL_GATES:
                # Rejected by something about the file itself. Settled.
                rows.append(previous)
                reused += 1
                continue
            if previous.converted and (out_dir / previous.converted).is_file():
                # Converted, round-tripped, structured and scanned already —
                # which is the minutes of music21 — and only the browser's
                # verdict is in question. Keep the work, redo the render.
                previous.ok = False
                previous.gate = ""
                previous.reason = ""
                rows.append(previous)
                passed_to_render.append(previous)
                reused += 1
                continue

        # 1 — parse and normalise.
        destination = converted_dir / f"{cid}.mxl"
        try:
            result = convert_file(raw, destination)
        except Exception as error:  # noqa: BLE001 - any music21 failure rejects
            row.gate, row.reason = "convert", f"{type(error).__name__}: {error}"
            rows.append(row)
            continue
        row.title = row.title or result.title
        row.composer = row.composer or result.composer
        row.measures = result.measures
        row.notes = result.notes
        row.staves = result.staves
        row.tempo_bpm = result.tempo_bpm
        row.lyrics_stripped = result.stripped_lyrics
        row.converted = str(destination.relative_to(out_dir).as_posix())
        row.converted_sha256 = sha256(destination)

        # 2 — round trip.
        try:
            raw_score = parse_source(raw)
            converted_score = parse_source(destination)
        except Exception as error:  # noqa: BLE001
            row.gate, row.reason = "round-trip", f"reparse failed: {type(error).__name__}: {error}"
            rows.append(row)
            continue
        ok, why = round_trip_ok(raw_score, converted_score)
        if not ok:
            row.gate, row.reason = "round-trip", why
            rows.append(row)
            continue

        # 3 — structure.
        failure, flags = structure_failure(converted_score, result)
        row.tempo_defaulted = flags["tempo_defaulted"]
        row.single_line = flags["single_line"]
        if failure:
            row.gate, row.reason = "structure", failure
            rows.append(row)
            continue

        # 4 — the P2 truncation defect.
        scan = scan_file(destination)
        if scan.findings:
            row.gate = "truncation"
            row.reason = scan.findings[0].describe()
            rows.append(row)
            continue

        # Features and a level, so the reviewer sees them whatever gate 5 says.
        row.features = difficulty.features(converted_score)
        level = difficulty.estimate(row.features, model)
        row.level = level.level
        row.level_source = level.source
        row.level_drivers = level.drivers

        # 6 — duplicates. Cheap, and done before the browser so a duplicate
        # does not cost a render.
        key = f"{fold_title(row.title)}|{fold_title(row.composer or '')}"
        row.duplicate_of = duplicates.get(key)

        passed_to_render.append(row)
        rows.append(row)

    if reused:
        print(f"reused {reused} verdict(s) from the previous run (same source bytes)")

    # 5 — render, in one browser for the whole batch.
    if passed_to_render and not skip_render:
        reports = render_batch(passed_to_render, converted_dir, out_dir)
        for row in passed_to_render:
            report = reports.get(row.cid)
            if report is None:
                row.gate, row.reason = "render", "no render report for this item"
                continue
            if not report.get("ok"):
                row.gate, row.reason = "render", str(report.get("error", "render failed"))
                continue
            steps = int(report.get("steps") or 0)
            cursor = int(report.get("cursorSteps") or 0)
            row.render_steps = steps
            row.render_cursor_steps = cursor
            row.render_ms = float(report.get("renderMs") or 0)
            if steps < 1:
                row.gate, row.reason = "render", "no steps"
                continue
            if cursor and cursor != steps:
                # The P2 invariant. A cursor that walks a different number of
                # steps from the model means the follow engine and the picture
                # disagree about where the music is.
                row.gate, row.reason = "render", f"cursor parity {cursor} != {steps} steps"
                continue
            row.ok = True
    elif skip_render:
        for row in passed_to_render:
            row.ok = True

    return rows


def rejection_rates(rows: list[QuarryRow], candidates: list[dict]) -> dict[str, dict]:
    """Per band: how many were offered, how many survived, and the rate."""
    band_of = {c["cid"]: c.get("band", "?") for c in candidates}
    out: dict[str, dict] = {}
    for row in rows:
        band = band_of.get(row.cid, "?")
        bucket = out.setdefault(band, {"offered": 0, "passed": 0, "reasons": {}})
        bucket["offered"] += 1
        if row.ok:
            bucket["passed"] += 1
        else:
            bucket["reasons"][row.gate] = bucket["reasons"].get(row.gate, 0) + 1
    for bucket in out.values():
        offered = bucket["offered"]
        bucket["rejectionRate"] = round(1 - bucket["passed"] / offered, 3) if offered else 0.0
    return out


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--candidates", type=Path, default=BUILD_DIR / "candidates.json")
    parser.add_argument("--raw", type=Path, default=BUILD_DIR / "raw")
    parser.add_argument("--out", type=Path, default=BUILD_DIR)
    parser.add_argument("--catalog", type=Path, default=REPO_ROOT / "app" / "public" / "content" / "catalog.json")
    parser.add_argument("--band", action="append", default=[])
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument(
        "--no-reuse",
        action="store_true",
        help="re-quarry every candidate, ignoring the previous run's verdicts",
    )
    parser.add_argument(
        "--skip-render",
        action="store_true",
        help="skip gate 5 (needs Chromium and a built app); used by the fixture test",
    )
    args = parser.parse_args(argv)

    if not args.candidates.is_file():
        print(f"{args.candidates} does not exist. Run select.py first.", file=sys.stderr)
        return 2
    data = json.loads(args.candidates.read_text(encoding="utf-8"))
    candidates = [
        c
        for c in data["candidates"]
        if not c.get("over_quota") and (not args.band or c["band"] in args.band)
    ]
    if args.limit:
        candidates = candidates[: args.limit]

    args.out.mkdir(parents=True, exist_ok=True)
    rows = quarry(candidates, args.raw, args.out, catalog_path=args.catalog,
                  skip_render=args.skip_render, reuse=not args.no_reuse)
    rates = rejection_rates(rows, candidates)

    out_path = args.out / "quarried.json"
    out_path.write_text(
        json.dumps(
            {
                "header": {**data.get("header", {}), "rejectionRates": rates},
                "rows": [asdict(row) for row in rows],
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )

    kept = sum(1 for row in rows if row.ok)
    print(f"{kept}/{len(rows)} candidate(s) passed every machine gate")
    for band, bucket in sorted(rates.items()):
        print(
            f"  band {band}: {bucket['passed']}/{bucket['offered']} passed "
            f"(rejection rate {bucket['rejectionRate']:.0%}) {bucket['reasons']}"
        )
    print(f"wrote {out_path}")
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
