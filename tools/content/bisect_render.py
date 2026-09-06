#!/usr/bin/env python3
"""
Narrows a score OpenSheetMusicDisplay refuses down to the measure that breaks it.

Thirteen Chopin first editions convert cleanly, round-trip through music21 note
for note, and then make VexFlow throw `Invalid note initialization object: {}`
— an empty note struct — so the score does not render at all
(`docs/decisions/2026-09-06-p10-chopin-and-breadth.md` §5). Grace notes and
beams were ruled out by hand. The replan's ruling (§1.1) is to stop guessing
and bisect: slice the score by measure range, convert each slice the normal
way, render each in the dev route, and keep halving until one measure is left.

The tool is the deliverable, not the answer. Every future "OSMD will not draw
it" starts here instead of in a debugger, which is why it survives whatever
this particular hunt concludes.

How the search works. A range that fails is halved; if exactly one half fails,
the search recurses into it, and if neither half fails alone the cause needs
both halves at once (a tie or slur across the split, a `<attributes>` change
the second half depends on) — so the smallest failing range is reported rather
than a wrong single measure. Both halves are rendered in one browser round
trip, so a 200-bar score costs about eight of them.

Usage:
    python3 tools/content/bisect_render.py content/scores/imported/kern/…/foo.krn
    python3 tools/content/bisect_render.py --from-catalog song.classical.chopin-nocturne-op9-2.nifc
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import BUILD_DIR, DEFAULT_OUT, REPO_ROOT, read_json  # noqa: E402

APP_DIR = REPO_ROOT / "app"
SPEC = "tests/e2e/bisect-render.spec.ts"
WORK_DIR = BUILD_DIR / "bisect"


@dataclass
class Probe:
    """One candidate slice and what the browser did with it."""

    low: int
    high: int
    path: Path
    ok: bool = False
    error: str = ""
    steps: int = 0

    @property
    def label(self) -> str:
        return f"bars {self.low}-{self.high}"


def slice_path(low: int, high: int) -> Path:
    return WORK_DIR / f"slice-{low:04d}-{high:04d}.musicxml"


def write_slice(source_score, low: int, high: int, keep_lyrics: bool) -> Path | None:
    """
    Writes bars `low`..`high` of an already-parsed score, through the real converter.

    Through `normalise` on purpose: bisecting the *source* would find the bar
    that breaks a file the app never sees. What has to be narrowed down is the
    thing the pipeline produces.
    """
    from convert import ConversionError, normalise, write_mxl

    dest = slice_path(low, high)
    try:
        excerpt = source_score.measures(low, high)
        normalised, _ = normalise(excerpt, keep_lyrics=keep_lyrics, tempo_bpm=None)
        write_mxl(normalised, dest)
    except (ConversionError, Exception) as exc:  # noqa: BLE001 - a slice that will
        # not even convert is not the defect we are hunting; say so and move on.
        print(f"  (bars {low}-{high}: could not be written — {type(exc).__name__}: {exc})")
        return None
    return dest


def render_batch(probes: list[Probe]) -> None:
    """Renders every probe in one browser session and fills in the results."""
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    plan_path = WORK_DIR / "plan.json"
    results_path = WORK_DIR / "results.json"
    plan_path.write_text(
        json.dumps({"files": [str(p.path.resolve()) for p in probes]}, indent=2), encoding="utf-8"
    )
    if results_path.exists():
        results_path.unlink()

    environment = dict(os.environ)
    environment.update(
        {
            "CONTENT_BISECT_PLAN": str(plan_path.resolve()),
            "CONTENT_BISECT_RESULTS": str(results_path.resolve()),
        }
    )
    subprocess.run(
        ["npx", "playwright", "test", SPEC, "--reporter=line"],
        cwd=APP_DIR,
        env=environment,
        check=False,
    )
    if not results_path.exists():
        raise SystemExit("the render worker wrote no results; is the app buildable?")

    payload = read_json(results_path)
    assert isinstance(payload, dict)
    by_file = {Path(r["file"]).resolve(): r for r in payload.get("results", [])}
    for probe in probes:
        found = by_file.get(probe.path.resolve())
        if found is None:
            probe.ok, probe.error = False, "not rendered"
            continue
        probe.ok = bool(found.get("ok"))
        probe.error = str(found.get("error") or "")
        probe.steps = int(found.get("steps") or 0)


def measure_xml(source_score, low: int, high: int) -> str:
    """The failing measures as MusicXML text, which is what a bug report needs."""
    from music21 import converter  # noqa: F401  (kept: music21 must be importable here)

    excerpt = source_score.measures(low, high)
    written = excerpt.write("musicxml")
    return Path(str(written)).read_text(encoding="utf-8", errors="replace")


def bisect(source_score, total: int, keep_lyrics: bool) -> tuple[int, int]:
    """
    Returns the smallest measure range that still fails to render.

    Assumes the whole score fails; the caller checks that first.
    """
    low, high = 1, total
    while low < high:
        middle = (low + high) // 2
        halves = [(low, middle), (middle + 1, high)]
        probes: list[Probe] = []
        for a, b in halves:
            path = write_slice(source_score, a, b, keep_lyrics)
            if path is not None:
                probes.append(Probe(low=a, high=b, path=path))
        if not probes:
            break
        print(f"  probing {' and '.join(p.label for p in probes)}…")
        render_batch(probes)
        for probe in probes:
            state = "renders" if probe.ok else f"FAILS ({probe.error[:70]})"
            print(f"    {probe.label}: {state}")

        failing = [p for p in probes if not p.ok]
        if len(failing) == 1:
            low, high = failing[0].low, failing[0].high
            continue
        # Neither half fails on its own (the cause spans the split), or both do
        # (two independent causes). Either way this range is as small as a
        # halving search can honestly make it.
        break
    return low, high


def source_for_catalog_id(item_id: str, content_dir: Path) -> Path:
    catalog = read_json(content_dir / "catalog.json")
    assert isinstance(catalog, list)
    for entry in catalog:
        if entry["id"] == item_id:
            if not entry.get("file"):
                raise SystemExit(f"{item_id} has no file")
            return content_dir / entry["file"]
    raise SystemExit(f"{item_id} is not in {content_dir}/catalog.json")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", nargs="?", type=Path, help="a score source (.krn, .musicxml, …)")
    parser.add_argument("--from-catalog", help="a catalog id, resolved against --content")
    parser.add_argument("--content", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--keep-lyrics", action="store_true")
    parser.add_argument(
        "--max-measures",
        type=int,
        default=0,
        help="only bisect the first N bars (a long score costs a round trip per halving)",
    )
    args = parser.parse_args()

    if args.from_catalog:
        source = source_for_catalog_id(args.from_catalog, args.content)
    elif args.source:
        source = args.source
    else:
        parser.error("give a source path or --from-catalog")

    from convert import parse_source

    print(f"parsing {source}…")
    score = parse_source(source)
    total = len(score.parts[0].getElementsByClass("Measure")) if score.parts else 0
    if total == 0:
        raise SystemExit("the source has no measures to bisect")
    if args.max_measures:
        total = min(total, args.max_measures)
    print(f"{total} measures")

    WORK_DIR.mkdir(parents=True, exist_ok=True)
    whole = write_slice(score, 1, total, args.keep_lyrics)
    if whole is None:
        raise SystemExit("the whole score could not be converted; that is the bug, not a render one")
    probe = Probe(low=1, high=total, path=whole)
    print("checking the whole score renders as badly as reported…")
    render_batch([probe])
    if probe.ok:
        print(
            f"the whole score renders here ({probe.steps} steps). Nothing to bisect — "
            "the failure is not reproducible from this source."
        )
        return
    print(f"  confirmed: {probe.error}")

    low, high = bisect(score, total, args.keep_lyrics)
    span = "measure" if low == high else "measures"
    print(f"\nsmallest failing range: {span} {low}" + ("" if low == high else f"-{high}"))
    print("-" * 60)
    print(measure_xml(score, low, high))


if __name__ == "__main__":
    main()
