"""Copies the kept pictures from app/test-results/g96-pictures/<phase>/ to docs/prompts/pictures/g96/, and the two
facts files to docs/prompts/runs/G96/, by hand after the picture runs (a spec never writes under docs/).

Usage (from the worktree root): python docs/prompts/runs/G96/scripts-copy-pictures.py docs/prompts/runs/G96/copy-pictures.txt
"""
import pathlib
import shutil
import sys

ROOT = pathlib.Path(__file__).resolve().parents[4]
SRC = ROOT / "app" / "test-results" / "g96-pictures"
DEST = ROOT / "docs" / "prompts" / "pictures" / "g96"
RUNS = ROOT / "docs" / "prompts" / "runs" / "G96"
KEEP = {
    "before": ["sheet-library-never-played", "library-after-close", "progress-after-close", "pdf-row", "row-twinkle-ht-learning"],
    "after": [
        "sheet-library-never-played",
        "library-after-close",
        "sheet-progress-passed",
        "progress-after-close",
        "pdf-row",
        "pdf-details",
        "row-twinkle-ht-learning",
        "sheet-library-self-passed",
    ],
}
DEST.mkdir(parents=True, exist_ok=True)
lines = []
for phase, names in KEEP.items():
    for name in names:
        source = SRC / phase / f"{phase}-{name}-342x740.png"
        target = DEST / source.name
        shutil.copy2(source, target)
        lines.append(f"{source.relative_to(ROOT).as_posix()} -> {target.relative_to(ROOT).as_posix()} ({target.stat().st_size} bytes)")
    facts = SRC / phase / f"{phase}-facts.json"
    shutil.copy2(facts, RUNS / f"pictures-facts-{phase}.json")
    lines.append(f"{facts.relative_to(ROOT).as_posix()} -> docs/prompts/runs/G96/pictures-facts-{phase}.json")
pathlib.Path(sys.argv[1]).write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"{len(lines)} files copied")
