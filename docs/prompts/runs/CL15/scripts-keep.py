"""Copies CL15's kept files into docs/prompts/runs/CL15/, machine paths replaced, each under 300 KB."""
from __future__ import annotations

import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
RUN = ROOT / "docs" / "prompts" / "runs" / "CL15"
LIMIT = 300 * 1024

WORKTREE_FORMS = [
    str(ROOT), str(ROOT).replace("\\", "/"), "<worktree>",
    str(ROOT).replace("\\", "\\\\"),
]
HOME_FORMS = ["<home>", "<home>", "<home>", "<home, backslashes doubled>"]

DATA = {
    "census.json": "census.json", "content-items.txt": "content-items.txt", "catalog-diff.txt": "catalog-diff.txt",
    "demand-moves.txt": "demand-moves.txt", "measured-changed.json": "measured-changed.json",
    "walk-counts.txt": "walk-counts.txt", "table-check.txt": "table-check.txt",
    "logs/red-first-python.txt": "red-first-python.txt",
    "logs/vitest-continuity-red-base-build.txt": "vitest-continuity-red-base-build.txt",
    "logs/mutants-python.txt": "mutants-python.txt", "logs/mutants-app.txt": "mutants-app.txt",
    "logs/pin-test.txt": "pin-test.txt", "logs/vitest-env-rerun.txt": "vitest-env-rerun.txt",
    "logs/vitest-oneStaffHand.txt": "vitest-oneStaffHand.txt",
}
SCRIPTS = ["snapshot_plan.py", "continuity_table.py", "edit_contracts.py", "repin.py", "edit_bridge.py", "red_first.py",
           "mutants.py", "app_mutants.py", "measure_changed.py", "content_items.py", "content_list.py", "catalog_diff.py",
           "demand_moves.py", "census.py", "walk_counts.py", "table_check.py", "keep.py"]


def scrub(text: str) -> str:
    for form in sorted(WORKTREE_FORMS, key=len, reverse=True):
        text = text.replace(form, "<worktree>")
    for form in sorted(HOME_FORMS, key=len, reverse=True):
        text = text.replace(form, "<home>")
    return re.sub(r"[A-Za-z]:\\\\?Users\\\\?[^\\\s\"']+", "<home>", text)


def main() -> None:
    RUN.mkdir(parents=True, exist_ok=True)
    pairs = [(HERE / src, RUN / dst) for src, dst in DATA.items()] + [(HERE / s, RUN / f"scripts-{s}") for s in SCRIPTS]
    pairs += [(HERE / extra, RUN / name) for extra, name in (a.split("=") for a in sys.argv[1:])]
    for src, dst in pairs:
        text = scrub(src.read_text(encoding="utf-8", errors="replace"))
        data = text.encode("utf-8")
        assert len(data) < LIMIT, f"{src.name} is {len(data)} bytes"
        dst.write_bytes(data)
        print(f"{dst.name}: {len(data)} bytes")


if __name__ == "__main__":
    main()
