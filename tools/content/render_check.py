#!/usr/bin/env python3
"""
Renders every catalog item in a real browser and reports what came back.

docs/03-content-pipeline.md §3 steps 5–6. The check itself is a Playwright
test (app/tests/e2e/content-render.spec.ts) rather than Python, for one
reason: "does this file render?" has to mean "does *the app* render it?", and
the app's loader, its OSMD wrapper and the P2 ScoreModel extractor are all
TypeScript. Reimplementing any of that here would test a different program.

This script builds the app, serves the built content, runs that test, and
turns its report into something the build can use — the per-item duration and
step count, the list of items to exclude, and the checks below.

The spec reports facts and remembers them in `build/render-manifest.json` under
each file's sha256, so only unseen files are engraved (replan §1.3). The
judgements live here, because they need the catalog and are worth unit tests:

  * **cursor-step parity** (§7.1) — the ScoreModel's step count against a real
    rendered cursor's. A mismatch means the engine would walk a different score
    from the one on the screen, so it fails the check.
  * **pace** (§7.3) — seconds per bar outside 0.5–12 s. A score that renders
    with a tempo of 8, or one whose 40 minutes come from a mis-parsed duration,
    passes every other check.
  * **hands** (§7.4) — the catalog's `hands` against the model's.
  * **console** (§7.2) — `console.error`/`warn` captured per item, so an OSMD
    warning about a dropped element is visible instead of silent.

Pace, hands and console are reported, not failed: they describe content that
already ships, and turning them into failures is a content decision, not a
pipeline one.

Usage:
    python3 tools/content/render_check.py [--content app/public/content] [--full]
"""
from __future__ import annotations

import argparse
import os
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import BUILD_DIR, DEFAULT_OUT, REPO_ROOT, read_json, write_json  # noqa: E402

APP_DIR = REPO_ROOT / "app"
SPEC = "tests/e2e/content-render.spec.ts"


def npx() -> str:
    """
    The full path to `npx`.

    `subprocess.run(["npx", …])` works on Linux and fails on Windows with
    `[WinError 2] The system cannot find the file specified`: the file there is
    `npx.cmd`, and CreateProcess does not apply PATHEXT the way a shell does.
    `shutil.which` does, so it finds the right one on both.
    """
    return shutil.which("npx") or "npx"


#: replan §7.3. A bar under half a second is a tempo the engine cannot follow;
#: a bar over twelve seconds is almost always a mis-read duration rather than a
#: very slow piece.
MIN_SEC_PER_BAR = 0.5
MAX_SEC_PER_BAR = 12.0


def run_check(
    content_dir: Path,
    report_path: Path,
    preview_dir: Path,
    manifest_path: Path,
    limit: int,
    full: bool,
) -> int:
    environment = dict(os.environ)
    environment.update(
        {
            "CONTENT_RENDER_CHECK": "1",
            "CONTENT_DIR": str(content_dir.resolve()),
            "CONTENT_RENDER_REPORT": str(report_path.resolve()),
            "CONTENT_PREVIEW_DIR": str(preview_dir.resolve()),
            "CONTENT_RENDER_MANIFEST": str(manifest_path.resolve()),
            "CONTENT_RENDER_LIMIT": str(limit),
            "CONTENT_RENDER_FULL": "1" if full else "0",
        }
    )
    import subprocess

    scope = "every item" if full else "items not in the manifest"
    print(f"rendering {scope} from {content_dir}/catalog.json in Chromium (builds the app first)…")
    result = subprocess.run(
        [npx(), "playwright", "test", SPEC, "--reporter=list"],
        cwd=APP_DIR,
        env=environment,
        check=False,
    )
    return result.returncode


def summarise(report_path: Path) -> dict:
    if not report_path.exists():
        return {"items": []}
    report = read_json(report_path)
    assert isinstance(report, dict)
    return report


# ---------------------------------------------------------------------------
# the checks (pure, so tools/content/tests can drive them)
# ---------------------------------------------------------------------------

def parity_failures(items: list[dict]) -> list[str]:
    """
    replan §7.1: the model's step count must equal a real cursor's.

    Only meaningful where the spec measured it — a cached row carries the
    number it measured when it was fresh, and a row with no `cursorSteps` at
    all (an older manifest, or a failed render) is not evidence of anything.
    """
    out: list[str] = []
    for item in items:
        if not item.get("ok"):
            continue
        cursor = item.get("cursorSteps")
        steps = item.get("steps")
        if cursor is None or steps is None:
            continue
        if cursor != steps:
            out.append(f"{item['id']}: model {steps} steps vs cursor {cursor}")
    return out


def pace_flags(items: list[dict]) -> list[str]:
    """replan §7.3: seconds per bar outside 0.5–12 s."""
    out: list[str] = []
    for item in items:
        if not item.get("ok"):
            continue
        duration = item.get("durationSec")
        measures = item.get("measures")
        if not duration or not measures:
            continue
        per_bar = duration / measures
        if per_bar < MIN_SEC_PER_BAR or per_bar > MAX_SEC_PER_BAR:
            out.append(
                f"{item['id']}: {per_bar:.2f}s per bar "
                f"({duration:g}s over {measures} bars, tempo {item.get('tempoBpm')})"
            )
    return out


def hands_flags(items: list[dict], catalog: list[dict]) -> list[str]:
    """replan §7.4: the catalog's `hands` against what the model actually has."""
    claimed = {entry["id"]: entry.get("hands") for entry in catalog}
    out: list[str] = []
    for item in items:
        if not item.get("ok"):
            continue
        model_hands = item.get("hands")
        catalog_hands = claimed.get(item["id"])
        if model_hands and catalog_hands and model_hands != catalog_hands:
            out.append(f"{item['id']}: catalog says {catalog_hands}, model has {model_hands}")
    return out


def console_flags(items: list[dict]) -> list[str]:
    """replan §7.2: whatever the browser complained about, per item."""
    out: list[str] = []
    for item in items:
        for line in item.get("consoleErrors") or []:
            out.append(f"{item['id']}: {line}")
    return out


def report_section(title: str, lines: list[str], stream=sys.stdout, limit: int = 20) -> None:
    if not lines:
        return
    print(f"\n{title} ({len(lines)}):", file=stream)
    for line in lines[:limit]:
        print(f"  - {line}", file=stream)
    if len(lines) > limit:
        print(f"  … and {len(lines) - limit} more", file=stream)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--content", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--report", type=Path, default=BUILD_DIR / "render-report.json")
    parser.add_argument("--previews", type=Path, default=BUILD_DIR / "previews")
    parser.add_argument("--manifest", type=Path, default=BUILD_DIR / "render-manifest.json")
    parser.add_argument("--limit", type=int, default=0, help="check only the first N items")
    parser.add_argument(
        "--full",
        action="store_true",
        help="ignore the manifest and render every item (the weekly workflow)",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="write the measured durations back into the catalog",
    )
    args = parser.parse_args()

    code = run_check(
        args.content, args.report, args.previews, args.manifest, args.limit, args.full
    )
    report = summarise(args.report)
    items = report.get("items", [])
    failed = [item for item in items if not item.get("ok")]
    fresh = report.get("rendered", sum(1 for i in items if not i.get("cached")))
    cached = report.get("cached", sum(1 for i in items if i.get("cached")))
    print(f"\nrendered {len(items) - len(failed)}/{len(items)} item(s): {fresh} fresh, {cached} from the manifest")
    for item in failed:
        print(f"  FAIL {item['id']}: {item.get('error')}", file=sys.stderr)

    catalog_path = args.content / "catalog.json"
    catalog = read_json(catalog_path) if catalog_path.exists() else []
    assert isinstance(catalog, list)

    parity = parity_failures(items)
    report_section("cursor-step parity mismatches", parity, stream=sys.stderr)
    report_section("pace outside 0.5-12s per bar", pace_flags(items))
    report_section("hands disagree with the model", hands_flags(items, catalog))
    report_section("browser console", console_flags(items))

    if args.apply and items:
        apply_durations(catalog_path, items)

    # A parity mismatch means the engine would follow a different score from
    # the one drawn, which is the defect this check exists to catch.
    sys.exit(code or (1 if parity else 0))


def apply_durations(catalog_path: Path, items: list[dict]) -> None:
    """
    Writes the measured duration and step count back into the catalog.

    These cannot be known before the score is parsed, and parsing it twice —
    once in Python to guess and once in the browser to check — would be two
    answers to one question. The rows merged from the manifest carry the same
    numbers a fresh render would have produced, so an incremental run still
    writes a complete catalog.
    """
    catalog = read_json(catalog_path)
    assert isinstance(catalog, list)
    measured = {item["id"]: item for item in items if item.get("ok")}
    for entry in catalog:
        found = measured.get(entry["id"])
        if not found:
            continue
        entry["durationSec"] = found.get("durationSec")
        if entry.get("tempoBpm") is None:
            entry["tempoBpm"] = found.get("tempoBpm")
        if entry.get("timeSig") is None:
            entry["timeSig"] = found.get("timeSig")
        if entry.get("keySig") is None:
            entry["keySig"] = found.get("keySig")
    write_json(catalog_path, catalog)
    print(f"wrote measured durations into {catalog_path}")


if __name__ == "__main__":
    main()
