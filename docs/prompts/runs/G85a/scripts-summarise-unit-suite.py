"""The whole unit suite's log is over the run folder's 300 KB limit (mostly jsdom's *Not implemented*
lines), so it is not kept: this writes its totals, the failed files and every failed test's name, with
the first error line of each, into the run folder.

Usage (from the worktree root): python docs/prompts/runs/G85a/scripts-summarise-unit-suite.py build/g85a/vitest-full.txt docs/prompts/runs/G85a/vitest-full-summary.txt
"""
import pathlib
import re
import sys

log = pathlib.Path(sys.argv[1]).read_text(encoding="utf-8", errors="replace")
out = pathlib.Path(sys.argv[2])
lines = [f"$ (cd app) npx vitest run — the full log ({len(log.encode('utf-8'))} bytes) was not kept; this is its summary."]
for pattern in (r"^ Test Files .*$", r"^      Tests .*$", r"^   Duration .*$", r"^exit=.*$"):
    lines += [found.strip() for found in re.findall(pattern, log, flags=re.MULTILINE)]
lines.append("failed files:")
lines += ["  " + found.strip() for found in re.findall(r"^ ❯ tests/unit/\S+ \(.*$", log, flags=re.MULTILINE)]
lines.append("failed tests (FAIL line, then the first error line after it):")
blocks = re.split(r"^ FAIL  ", log, flags=re.MULTILINE)[1:]
for block in blocks:
    head = block.splitlines()[0].strip()
    error = next((line.strip() for line in block.splitlines()[1:] if re.match(r"\s*(\w*Error|Error:)", line)), "")
    lines.append(f"  {head}\n      {error[:200]}")
out.write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"{len(blocks)} failed tests summarised")
