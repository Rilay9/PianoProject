"""X31a: restores the four files the content builds rewrite from the snapshot taken before the first build."""
import shutil
from pathlib import Path

W = Path(__file__).resolve().parents[2]
SNAP = W / "build" / "x31a-snapshot"
OUT = W / "docs" / "prompts" / "runs" / "X31a" / "restore.txt"
lines = ["the builds rewrote (git status before the restore):"]
lines += (W / "build" / "x31a-tmp" / "status-before-restore.txt").read_text(encoding="utf-8").splitlines()
lines.append("content differences ignoring line endings (git diff --ignore-cr-at-eol --stat): content/scores/imported/SOURCES.md "
             "10 lines changed (restored without reading them line by line; Q80 and X31 found the same rewrite to be the ledger "
             "re-dating rows of copied clones); docs/prompts/inventory.md and docs/prompts/rung-claims.md none (line endings only); "
             "docs/generated/ladder.md not rewritten")
for rel in ("content/scores/imported/SOURCES.md", "docs/prompts/inventory.md", "docs/prompts/rung-claims.md", "docs/generated/ladder.md"):
    shutil.copy2(SNAP / rel, W / rel)
    lines.append(f"restored {rel} from the snapshot taken before the first build")
OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
print("\n".join(lines))
