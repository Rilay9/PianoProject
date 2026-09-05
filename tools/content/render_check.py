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
step count, and the list of items to exclude.

Usage:
    python3 tools/content/render_check.py [--content app/public/content] [--limit 20]
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import BUILD_DIR, DEFAULT_OUT, REPO_ROOT, read_json, write_json  # noqa: E402

APP_DIR = REPO_ROOT / "app"
SPEC = "tests/e2e/content-render.spec.ts"


def run_check(content_dir: Path, report_path: Path, preview_dir: Path, limit: int) -> int:
    environment = dict(os.environ)
    environment.update(
        {
            "CONTENT_RENDER_CHECK": "1",
            "CONTENT_DIR": str(content_dir.resolve()),
            "CONTENT_RENDER_REPORT": str(report_path.resolve()),
            "CONTENT_PREVIEW_DIR": str(preview_dir.resolve()),
            "CONTENT_RENDER_LIMIT": str(limit),
        }
    )
    import subprocess

    print(f"rendering {content_dir}/catalog.json in Chromium (this builds the app first)…")
    result = subprocess.run(
        ["npx", "playwright", "test", SPEC, "--reporter=list"],
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


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--content", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--report", type=Path, default=BUILD_DIR / "render-report.json")
    parser.add_argument("--previews", type=Path, default=BUILD_DIR / "previews")
    parser.add_argument("--limit", type=int, default=0, help="check only the first N items")
    parser.add_argument(
        "--apply",
        action="store_true",
        help="write the measured durations back into the catalog",
    )
    args = parser.parse_args()

    code = run_check(args.content, args.report, args.previews, args.limit)
    report = summarise(args.report)
    items = report.get("items", [])
    failed = [item for item in items if not item.get("ok")]
    print(f"\nrendered {len(items) - len(failed)}/{len(items)} item(s)")
    for item in failed:
        print(f"  FAIL {item['id']}: {item.get('error')}", file=sys.stderr)

    if args.apply and items:
        apply_durations(args.content / "catalog.json", items)

    sys.exit(code)


def apply_durations(catalog_path: Path, items: list[dict]) -> None:
    """
    Writes the measured duration and step count back into the catalog.

    These cannot be known before the score is parsed, and parsing it twice —
    once in Python to guess and once in the browser to check — would be two
    answers to one question.
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
