"""Compares the failing test names of vitest logs.

usage: python scripts-compare-fails.py <whole-suite log> <rerun-on-change log> <rerun-on-committed-source log>

Prints each log's count, the names that fail in one and not another, and exits 0.
"""
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
ANSI = re.compile(r"\x1b\[[0-9;]*m")


def fails(path: str) -> set[tuple[str, str]]:
    out = set()
    for line in open(path, encoding="utf-8", errors="replace"):
        match = re.match(r"^\s*FAIL\s+(\S+\.test\.ts)\s+>\s+(.*)$", ANSI.sub("", line.rstrip("\n")))
        if match:
            out.add((match.group(1), match.group(2).strip()))
    return out


whole, changed, committed = (fails(p) for p in sys.argv[1:4])
print(f"whole suite on the change: {len(whole)} failing")
print(f"the failing files alone, on the change: {len(changed)} failing")
print(f"the failing files alone, on the committed source: {len(committed)} failing")
for label, a, b in (
    ("in the whole suite, not alone on the change (load)", whole, changed),
    ("alone on the change, not on the committed source (the change's)", changed, committed),
    ("on the committed source, not alone on the change", committed, changed),
):
    diff = sorted(a - b)
    print(f"{label}: {len(diff)}")
    for file, name in diff:
        print(f"  - {file} > {name}")
