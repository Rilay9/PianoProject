"""Q82 follow-up: what the Q80 comparison makes of a kern CC BY-NC-SA row that was not fetched, where the report prints it.

A fetching personal build bundles such a row with the `nc-personal-build` tag; a fetching strict build carries it as
a licence placeholder. Neither ships it, so `ladder_report.shippable` is false either way, and on the real catalogue
the placeholder Q82 writes renders the committed report unchanged (the Joplin rows sit past the 80 rows of the
"wanted" table, so only its count would show them, and that count does not move). Where the row *is* printed, its
"why" differs: the bundled row says its licence, the placeholder its hint. Q80's second render then gives the row a
file and nothing else, which reads it as shippable, so the error stands, naming the item it set aside. This builds
both rows through `import_kern` on a two-song fixture, where the wanted table prints every row, and prints what the
check says. Nothing is written outside a temporary folder under build/.

    python docs/prompts/runs/Q82/scripts-nc-set-aside.py
"""
from __future__ import annotations

import sys
import tempfile
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(REPO / "tools" / "content"))
sys.path.insert(0, str(REPO / "tools" / "content" / "tests"))

import ladder_report  # noqa: E402
from common import BUILD_DIR  # noqa: E402
from test_validate_ladder import EXERCISES, curriculum, exercise, humdrum, song  # noqa: E402,F401
import test_validate_ladder as T  # noqa: E402
from validate import ladder_report_findings  # noqa: E402

BUILD_DIR.mkdir(parents=True, exist_ok=True)
with tempfile.TemporaryDirectory(dir=BUILD_DIR, prefix="q82-nc-") as name:
    tmp = Path(name)
    original = ladder_report.DEFAULT_OUT
    ladder_report.DEFAULT_OUT = tmp / "ladder.md"
    try:
        cur = curriculum(["song.ragtime.one", T.KERN_ID])
        others = [exercise(i, 5.0) for i in EXERCISES] + [song("song.ragtime.one", 7.0)]
        bundled = T.kern_rows(tmp, cloned=True, licence="CC BY-NC-SA 4.0", allow_nc=True)
        print("fetched, personal:", {k: bundled[0].get(k) for k in ("file", "tags")},
              "shippable:", ladder_report.shippable(bundled[0]))
        ladder_report.DEFAULT_OUT.write_text(ladder_report.render(others + bundled, cur), encoding="utf-8")
        unfetched = T.kern_rows(tmp, cloned=False, allow_nc=True)
        print("not fetched:", {k: unfetched[0].get(k) for k in ("file", "tags")},
              "shippable:", ladder_report.shippable(unfetched[0]))
        errors, warnings = ladder_report_findings(others + unfetched, cur)
        print(f"ladder check: {len(errors)} error(s), {len(warnings)} warning(s)")
        for line in errors + warnings:
            print("  ", line)
    finally:
        ladder_report.DEFAULT_OUT = original
