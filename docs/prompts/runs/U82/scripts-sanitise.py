"""Replaces this machine's paths in U82's captures with placeholders. Run from docs/prompts/runs/U82."""
import os
from pathlib import Path

WORKTREE = Path(__file__).resolve().parents[4]
MAIN = WORKTREE.parents[2]
TEMP = Path(os.environ.get("TEMP", os.environ.get("TMP", str(WORKTREE))))
SUBS = []
for path, name in ((WORKTREE, "<worktree>"), (MAIN, "<main checkout>"), (TEMP, "<temp>")):
    SUBS.append((str(path).replace("\\", "\\\\"), name))  # JSON-escaped, as a report quotes it
    SUBS.append((str(path), name))
    SUBS.append((path.as_posix(), name))

changed = 0
for folder, _dirs, files in os.walk("."):
    for file in files:
        if not file.endswith((".txt", ".log", ".json")):
            continue
        target = os.path.join(folder, file)
        raw = open(target, "rb").read()
        text = None
        for encoding in ("utf-8", "utf-16"):
            try:
                text = raw.decode(encoding)
                break
            except UnicodeDecodeError:
                continue
        if text is None:
            continue
        out = text
        for old, new in SUBS:
            out = out.replace(old, new)
        if out != text:
            with open(target, "w", encoding="utf-8", newline="") as handle:
                handle.write(out)
            changed += 1
print("sanitised", changed)
