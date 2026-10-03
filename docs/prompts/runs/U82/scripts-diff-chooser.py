"""U82: `chooseWindowShape` in two copies of WindowRenderer.ts, diffed with no context lines.

python scripts-diff-chooser.py <old WindowRenderer.ts> <new WindowRenderer.ts>
"""

import difflib
import sys


def chooser(path: str) -> list[str]:
    lines = open(path, encoding="utf-8").read().replace("\r\n", "\n").split("\n")
    start = next(i for i, line in enumerate(lines) if line.startswith("  private chooseWindowShape("))
    end = next(i for i in range(start + 1, len(lines)) if lines[i] == "  }")
    return lines[start : end + 1]


old, new = chooser(sys.argv[1]), chooser(sys.argv[2])
print(f"chooseWindowShape: {len(old)} lines before, {len(new)} after")
for line in difflib.unified_diff(old, new, sys.argv[1], sys.argv[2], lineterm="", n=0):
    print(line)
