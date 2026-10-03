"""Summarises a whole-suite vitest log: the totals, the failing files and each failing test's name.

usage: python scripts-summarise-vitest.py <vitest log> > <summary>

The full log is not kept in the run folder (over 300 KB); this summary is.
"""
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

ANSI = re.compile(r"\x1b\[[0-9;]*m")
lines = [ANSI.sub("", line.rstrip("\n")) for line in open(sys.argv[1], encoding="utf-8", errors="replace")]
print(lines[0] if lines else "(empty log)")
failing = []
for line in lines:
    match = re.match(r"^\s*FAIL\s+(\S+\.test\.ts)\s+>\s+(.*)$", line)
    if match:
        failing.append((match.group(1), match.group(2).strip()))
seen = []
for item in failing:
    if item not in seen:
        seen.append(item)
files = sorted({file for file, _ in seen})
print(f"failing files ({len(files)}):")
for file in files:
    names = [name for f, name in seen if f == file]
    print(f"  {file}: {len(names)} failing")
    for name in names:
        print(f"    - {name}")
for line in lines:
    if re.match(r"^\s*(Test Files|Tests|Errors|Duration)\s", line) or line.startswith("exit="):
        print(line.strip())
