#!/usr/bin/env python3
"""
Builds `app/public/content/` from `content/` and the fetched sources.

docs/03-content-pipeline.md §3. The order matters and the failure modes differ
at each step, so each is reported separately:

  1. fetch     — clone what is reachable; skipping a source is not a failure
  2. import    — the [MT] library and the [KERN] tier, per-file licence decisions
  3. generate  — scales, arpeggios, Hanon, rhythm drills
  4. author    — our own ABC and music21 sources
  5. curriculum/lessons — copied through from content/
  6. validate  — schema, cross-references, licences, durations
  7. render    — optional; every item loaded in a real browser (slow)

Steps 2–4 each write their own catalog fragment; the merge is one place, so a
duplicate id between an authored tune and a generated exercise is caught by
validation rather than by whichever wrote last.

Usage:
    python3 tools/content/build.py                 # everything but the render check
    python3 tools/content/build.py --offline       # no network
    python3 tools/content/build.py --render        # …and render every item
    python3 tools/content/build.py --quick         # a small generator subset
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
    Step,
    read_json,
    run,
    write_json,
)

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
    write_json(out_dir / "catalog.json", entries)
    return Step("merge catalog", ok=True, detail=f"{len(entries)} items")


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
    files = sorted(source_dir.glob("*.json")) if source_dir.exists() else []
    for path in files:
        data = read_json(path)
        assert isinstance(data, dict)
        tracks.extend(data.get("tracks", []))
        stages.extend(data.get("stages", []))
    seen: set[str] = set()
    unique_tracks = [t for t in tracks if not (t["id"] in seen or seen.add(t["id"]))]
    stages.sort(key=lambda stage: stage["number"])
    write_json(out_dir / "curriculum.json", {"version": 1, "tracks": unique_tracks, "stages": stages})
    return Step("curriculum", ok=True, detail=f"{len(files)} file(s), {len(stages)} stage(s)")


def copy_lessons(out_dir: Path) -> Step:
    source_dir = CONTENT_SRC / "lessons"
    target = out_dir / "lessons"
    if target.exists():
        shutil.rmtree(target)
    if not source_dir.exists():
        return Step("lessons", ok=True, detail="none yet", skipped=True)
    shutil.copytree(source_dir, target)
    return Step("lessons", ok=True, detail=f"{len(list(target.rglob('*.md')))} file(s)")


def copy_schemas(out_dir: Path) -> None:
    for name in ("catalog.schema.json", "curriculum.schema.json"):
        source = CONTENT_SRC / name
        if source.exists():
            shutil.copy2(source, out_dir / name)


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
    parser.add_argument(
        "--personal",
        action="store_true",
        help=(
            "the owner's build (docs/00 D23): implies --allow-nc, and also admits items whose "
            "*composition* is not public domain. --strict-license, which the Pages deploy runs, "
            "refuses them"
        ),
    )
    args = parser.parse_args()
    # One flag for the owner. --allow-nc was about the edition; --personal is
    # about the edition *and* the composition, and a build that admitted one
    # but not the other would be a distinction nobody asked for.
    allow_nc = args.allow_nc or args.personal

    started = time.time()
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
    steps.append(copy_curriculum(args.out))
    steps.append(copy_lessons(args.out))
    copy_schemas(args.out)
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
