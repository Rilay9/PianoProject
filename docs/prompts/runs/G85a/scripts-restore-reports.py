"""Records the restore of the files the offline content build rewrites: inventory.md, rung-claims.md and
SOURCES.md were snapshotted under `build/g85a/snap/` before the build, and the first two copied back from
the snapshots after it (SOURCES.md was never rewritten). Prints whether each matches its snapshot and what
`git status` says of the three.

Usage (from the worktree root): python docs/prompts/runs/G85a/scripts-restore-reports.py > docs/prompts/runs/G85a/restore-reports.txt
"""
import pathlib
import subprocess

ROOT = pathlib.Path(__file__).resolve().parents[4]
SNAP = ROOT / "build" / "g85a" / "snap"
FILES = ["docs/prompts/inventory.md", "docs/prompts/rung-claims.md", "content/scores/imported/SOURCES.md"]
for name in FILES:
    same = (SNAP / pathlib.Path(name).name).read_bytes() == (ROOT / name).read_bytes()
    print(f"{name}: {'same bytes as its snapshot' if same else 'DIFFERS from its snapshot'}")
status = subprocess.run(["git", "status", "--short", "--", *FILES], cwd=ROOT, capture_output=True, text=True).stdout
print("git status on the three: " + (status.strip() or "clean"))
print("exit=0")
