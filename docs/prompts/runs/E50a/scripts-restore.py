"""E50a (X31a's script, paths changed): restores the four files the content builds rewrite from the snapshot taken
before the first build, and says what the builds had changed. Output: restore.txt."""
import shutil
import subprocess
from pathlib import Path

W = Path(__file__).resolve().parents[4]
SNAP = W / "build" / "e50a" / "snapshot"
OUT = W / "docs" / "prompts" / "runs" / "E50a" / "restore.txt"
FILES = ("content/scores/imported/SOURCES.md", "docs/prompts/inventory.md", "docs/prompts/rung-claims.md", "docs/generated/ladder.md")
lines = ["what the builds had changed among the four (git diff --ignore-cr-at-eol --stat, before the restore):"]
stat = subprocess.run(["git", "-C", str(W), "diff", "--ignore-cr-at-eol", "--stat", "--", *FILES], capture_output=True, text=True).stdout
lines += ["   " + line for line in stat.splitlines()] or ["   nothing"]
for rel in FILES:
    shutil.copy2(SNAP / rel, W / rel)
    lines.append(f"restored {rel} from the snapshot taken before the first build")
after = subprocess.run(["git", "-C", str(W), "status", "--short", "--", *FILES], capture_output=True, text=True).stdout
lines.append(f"git status of the four after the restore: {after.strip() or 'clean'}")
OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
print("\n".join(lines))
