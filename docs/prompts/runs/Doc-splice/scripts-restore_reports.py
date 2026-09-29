"""Puts back the three tracked reports the content build rewrites, from copies taken before the build.

`content/scores/imported/SOURCES.md`, `docs/prompts/inventory.md` and `docs/prompts/rung-claims.md` are
rewritten by every build (dates, line endings); none is this seam's. The copies were taken from the
worktree at 71ee5f4 before the build. Prints each file's sha256 before and after, and `git diff --quiet`'s
answer for the three.

    python docs/prompts/runs/Doc-splice/scripts/restore_reports.py <backup dir>
"""
from __future__ import annotations

import hashlib
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[5]
FILES = ["content/scores/imported/SOURCES.md", "docs/prompts/inventory.md", "docs/prompts/rung-claims.md"]


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()[:16]


def main(backup: str) -> int:
    for rel in FILES:
        src, dst = Path(backup) / Path(rel).name, ROOT / rel
        before = sha(dst)
        shutil.copyfile(src, dst)
        print(f"{rel}: {before} -> {sha(dst)} (the copy: {sha(src)})")
    code = subprocess.run(["git", "diff", "--quiet", "--", *FILES], cwd=ROOT).returncode
    print(f"git diff --quiet on the three: {code} ({'unchanged from HEAD' if code == 0 else 'DIFFERS from HEAD'})")
    return code


if __name__ == "__main__":
    sys.exit(main(sys.argv[1]))
