"""Run the map (tools/docs/checks_for_paths.py) on every path U92 changed or added: `git status` in the
worktree, less the two files the offline build rewrote and U92 wrote back (not to commit)."""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
status = subprocess.run(
    ["git", "status", "--short", "--untracked-files=all"], cwd=ROOT, capture_output=True, text=True, check=True
).stdout.splitlines()
paths = [line[3:] for line in status if not line.endswith(("docs/prompts/inventory.md", "docs/prompts/rung-claims.md"))]
print(f"# {len(paths)} path(s):")
for p in paths:
    print(f"#   {p}")
sys.stdout.flush()
sys.exit(subprocess.run([sys.executable, "tools/docs/checks_for_paths.py", *paths], cwd=ROOT).returncode)
