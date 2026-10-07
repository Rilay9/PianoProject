"""Copies the offline content build's inputs from the main checkout (read only), as earlier seams did.

The kern and musetrainer datasets (without version-control folders), `build/cache/convert` and the three
caches. All are gitignored build inputs; nothing tracked is touched. Prints the file count per copy.

Run from the repository root: `python docs/prompts/runs/Doc-splice/scripts/copy_inputs.py`.
"""
from __future__ import annotations

import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[5]
MAIN = Path(r"C:\Users\yalir\repos\Piano Stuff\PianoProject")

DIRS = ["content/scores/imported/kern", "content/scores/imported/musetrainer", "build/cache/convert"]
FILES = ["build/positions-cache.json", "build/demands-cache.json", "build/notation-cache.json"]


def main() -> int:
    failed = 0
    for rel in DIRS:
        src, dst = MAIN / rel, ROOT / rel
        if not src.is_dir():
            print(f"MISSING in the main checkout: {rel}")
            failed += 1
            continue
        shutil.copytree(src, dst, dirs_exist_ok=True, ignore=shutil.ignore_patterns(".git"))
        count = sum(1 for p in dst.rglob("*") if p.is_file())
        print(f"copied {rel}: {count} file(s) now under it")
    for rel in FILES:
        src, dst = MAIN / rel, ROOT / rel
        if not src.is_file():
            print(f"MISSING in the main checkout: {rel}")
            failed += 1
            continue
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        print(f"copied {rel}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
