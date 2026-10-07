"""Q81: the captures' machine paths replaced by <worktree>, <main checkout>, <scratchpad> and <home>.

The paths are computed at run time (the worktree is the working directory, the main checkout three
levels above it, the scratchpad the one argument), never written here. Longest first, in both slash
styles, so a worktree path is never half-replaced by the main checkout's. Idempotent: a second run
finds nothing to replace. Run from the worktree root: python docs/prompts/runs/Q81/scripts-sanitise.py <scratchpad>
"""
from __future__ import annotations

import sys
from pathlib import Path

worktree = Path.cwd().resolve()
main = worktree.parents[2]
home = Path.home()
scratch = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else None

PAIRS: list[tuple[str, str]] = []
for path, name in ((scratch, "<scratchpad>"), (worktree, "<worktree>"), (main, "<main checkout>"), (home, "<home>")):
    if path is None:
        continue
    forward = path.as_posix()
    for spelling in (forward, forward.replace("/", "\\"), forward.replace("/", "\\\\")):
        PAIRS.append((spelling, name))
        PAIRS.append((spelling[0].lower() + spelling[1:], name))

folder = Path("docs/prompts/runs/Q81")
for capture in sorted(folder.glob("*.txt")):
    text = capture.read_bytes().decode("utf-8", errors="surrogateescape")
    changed = text
    for old, new in PAIRS:
        changed = changed.replace(old, new)
    if changed != text:
        capture.write_bytes(changed.encode("utf-8", errors="surrogateescape"))
        print(f"sanitised {capture.name}")
