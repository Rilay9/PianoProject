"""Q82 finding: the named-sections check on a build whose sectioned MuseTrainer songs are fetch placeholders.

`validate.section_errors` needs each sectioned item's printed bar count, from `build/render-report.json` when it
exists and from the item's file otherwise. A placeholder has no file. On a fresh runner (CI's "Build content", the
Pages job) there is no render report at validation time: neither workflow restores it (their cache is `build/cache`
and `build/render-manifest.json`), and CI's render step runs after the build. So there the check fails a sectioned
placeholder. The owner's machine has a render report from an earlier render, which counts the bars of the file it
once rendered, and there the same check passes. This runs the check on each Q82 catalogue both ways: with no
report, as a runner has it (a path that does not exist), and with the main checkout's report (read only). Nothing is
written.

    python docs/prompts/runs/Q82/scripts-sections.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(REPO / "tools" / "content"))

from validate import section_errors, unfetched_placeholders  # noqa: E402

MAIN_REPORT = Path(r"C:\Users\yalir\repos\Piano Stuff\PianoProject\build\render-report.json")
NO_REPORT = REPO / "build" / "q82-no-render-report.json"
assert not NO_REPORT.exists()

print(f"the worktree's own build/render-report.json exists: {(REPO / 'build' / 'render-report.json').is_file()}")
print(f"the main checkout's render report, read only: {MAIN_REPORT.is_file()}")
for content in sorted((REPO / "build").glob("q82-*-after/content")):
    catalog_path = content / "catalog.json"
    if not catalog_path.is_file():
        continue
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    unfetched = {item_id for item_id, _ in unfetched_placeholders(catalog)}
    sectioned = sorted(i["id"] for i in catalog if (i.get("teaching") or {}).get("sections") and i["id"] in unfetched)
    runner = section_errors(catalog, content, NO_REPORT)
    owner = section_errors(catalog, content, MAIN_REPORT)
    print(f"== {content.parent.name}: {len(sectioned)} fetch placeholder(s) carry named sections {sectioned}")
    print(f"   no render report (a runner): {len(runner)} error(s)")
    for line in runner:
        print(f"     {line[:160]}")
    print(f"   the main checkout's render report (the owner's machine): {len(owner)} error(s)")
    for line in owner:
        print(f"     {line[:160]}")
