"""Copies G85a's pictures and facts from the worktree's `build/g85a/pictures/<phase>/` (where they were
copied out of `app/test-results/g85a-pictures/<phase>/` after each run, since Playwright empties
`test-results/` at the start of a run) into `docs/prompts/pictures/g85a/`. The builder's own copying: no
spec writes under `docs/`. Every file of both phases is kept.

Usage (from the worktree root): python docs/prompts/runs/G85a/scripts-copy-pictures.py
"""
import pathlib
import shutil

ROOT = pathlib.Path(__file__).resolve().parents[4]
BUILD = ROOT / "build" / "g85a" / "pictures"
PICTURES = ROOT / "docs" / "prompts" / "pictures" / "g85a"
PICTURES.mkdir(parents=True, exist_ok=True)
copied = 0
for phase in ("before", "after"):
    for source in sorted((BUILD / phase).iterdir()):
        shutil.copy2(source, PICTURES / source.name)
        copied += 1
        print(f"copied {phase}/{source.name}")
print(f"{copied} files into docs/prompts/pictures/g85a/")
