# G2a: a short summary of vitest-full.txt (the whole unit suite's capture, mostly jsdom canvas
# warnings): its first line (the command), its FAIL lines, the files with failures, the totals and
# its exit line, into vitest-full-summary.txt. Run from the worktree root.
import re

SOURCE = "docs/prompts/runs/G2a/vitest-full.txt"
OUT = "docs/prompts/runs/G2a/vitest-full-summary.txt"
KEEP = re.compile(r"^ FAIL |^ ❯ tests/|Test Files|Tests  |Failed Tests")

with open(SOURCE, encoding="utf-8", errors="replace") as handle:
    lines = handle.read().splitlines()
kept = [lines[0], "(summary of vitest-full.txt: its FAIL lines, the files with failures, the totals and its exit line)"]
kept += [line for line in lines[1:-1] if KEEP.search(line)]
kept.append(lines[-1])
with open(OUT, "w", encoding="utf-8", newline="\n") as handle:
    handle.write("\n".join(kept) + "\n")
print("\n".join(kept))
