"""Copies the kept pictures and facts from the worktree's `build/g85/` into `docs/prompts/pictures/g85/`,
and the timing rounds into the run folder. The builder's own copying: no spec writes under `docs/`.

Usage (from the worktree root): python docs/prompts/runs/G85/scripts-copy-pictures.py
"""
import pathlib
import shutil

ROOT = pathlib.Path(__file__).resolve().parents[4]
BUILD = ROOT / "build" / "g85"
PICTURES = ROOT / "docs" / "prompts" / "pictures" / "g85"
RUNS = ROOT / "docs" / "prompts" / "runs" / "G85"
KEEP = {
    "pictures/before": [
        "before-row-hot-cross-buns-learning-342x740.png",
        "before-library-search-hot-cross-learning-342x740.png",
        "before-filters-open-342x740.png",
        "before-filters-342x740.png",
        "before-library-first-page-342x740.png",
        "before-probe-first-page-with-project-word-342x740.png",
        "before-facts.json",
    ],
    "pictures/after": [
        "after-row-hot-cross-buns-learning-342x740.png",
        "after-row-hot-cross-buns-paused-342x740.png",
        "after-library-search-hot-cross-learning-342x740.png",
        "after-library-search-hot-cross-paused-342x740.png",
        "after-filters-open-342x740.png",
        "after-filters-342x740.png",
        "after-filter-learning-342x740.png",
        "after-library-first-page-342x740.png",
        "after-facts.json",
    ],
    "pictures/badges": [
        "row-passed-and-preparing-342x740.png",
        "two-badges-facts.json",
    ],
    "pictures/stage9": [
        "stage9-classical-9-ballade-polishing-342x740.png",
        "stage9-facts.json",
    ],
    "pictures/probe": [
        "probe-hot-cross-as-built-342x740.png",
        "probe-hot-cross-with-project-word-342x740.png",
        "probe-twinkle-as-built-342x740.png",
        "probe-twinkle-with-project-word-342x740.png",
    ],
}
PICTURES.mkdir(parents=True, exist_ok=True)
copied = 0
for folder, names in KEEP.items():
    for name in names:
        shutil.copy2(BUILD / folder / name, PICTURES / name)
        copied += 1
timing = RUNS / "timing"
timing.mkdir(exist_ok=True)
for path in sorted((BUILD / "timing").glob("*.json")):
    shutil.copy2(path, timing / path.name)
    copied += 1
print(f"copied {copied} file(s)")
