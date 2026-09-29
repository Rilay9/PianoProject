"""Q84: the lines the build step prints under *validate* against the validator's own WARNING lines, run alone.

    python docs/prompts/runs/Q83-Q84/scripts-warnings-verbatim.py <build log> <validator log>

Prints each list's length and whether they are equal, in order, character for character (indentation stripped on
both sides: the validator indents by two, the summary by ten). Read only.
"""
from __future__ import annotations

import sys
from pathlib import Path


def under_validate(log: str) -> list[str]:
    lines = log.splitlines()
    start = next(i for i, line in enumerate(lines) if line.lstrip().startswith("ok    validate") or
                 line.lstrip().startswith("FAIL  validate"))
    found = []
    for line in lines[start + 1:]:
        if not line.startswith("          "):
            break
        found.append(line.strip())
    return found


build = under_validate(Path(sys.argv[1]).read_text(encoding="utf-8"))
validator = [line.strip() for line in Path(sys.argv[2]).read_text(encoding="utf-8").splitlines()
             if line.strip().startswith("WARNING")]
print(f"under validate in the build log: {len(build)} line(s)")
print(f"WARNING lines the validator printed alone: {len(validator)}")
print(f"equal, in order: {build == validator}")
for a, b in zip(build, validator):
    if a != b:
        print(f"  differs:\n    build:     {a}\n    validator: {b}")
q80 = [line for line in build if line.startswith("WARNING (ladder report, Q80)")]
print(f"the Q80 line under validate: {len(q80)}")
sys.exit(0 if build == validator else 1)
