"""
F2c: which census lines moved between two captures (`census.py` output, and its verdict side files).

    python docs/prompts/runs/F2c/compare_census.py <before.txt> <after.txt> [<before-verdicts> <after-verdicts>]

Prints every line only in the before and every line only in the after (the label line excepted), then
the same for the per-option verdicts, grouped by rung.
"""
from __future__ import annotations

import sys
from collections import Counter
from pathlib import Path


def body(path: str) -> list[str]:
    lines = Path(path).read_text(encoding="utf-8").splitlines()
    return [line for line in lines if not line.startswith("== ") and not line.startswith("exit=")
            and not line.startswith("python ")]


def moved(a: list[str], b: list[str]) -> tuple[list[str], list[str]]:
    ca, cb = Counter(a), Counter(b)
    gone = [line for line in a if ca[line] > cb.get(line, 0)]
    new = [line for line in b if cb[line] > ca.get(line, 0)]
    return list(dict.fromkeys(gone)), list(dict.fromkeys(new))


gone, new = moved(body(sys.argv[1]), body(sys.argv[2]))
print(f"census lines only before: {len(gone)}")
for line in gone:
    print(f"  - {line}")
print(f"census lines only after: {len(new)}")
for line in new:
    print(f"  + {line}")
def serves_none(path: str) -> set[str]:
    import ast

    for line in body(path):
        if line.startswith("  serves none: "):
            return set(ast.literal_eval(line[len("  serves none: "):]))
    return set()


a, b = serves_none(sys.argv[1]), serves_none(sys.argv[2])
print(f"serves none only before: {sorted(a - b)}; only after: {sorted(b - a)}")
if len(sys.argv) > 4:
    gone, new = moved(Path(sys.argv[3]).read_text(encoding="utf-8").splitlines(),
                      Path(sys.argv[4]).read_text(encoding="utf-8").splitlines())
    print(f"verdict lines only before: {len(gone)}; by rung {dict(Counter(line.split(' | ')[1] for line in gone))}")
    for line in gone:
        print(f"  - {line}")
    print(f"verdict lines only after: {len(new)}; by rung {dict(Counter(line.split(' | ')[1] for line in new))}")
    for line in new:
        print(f"  + {line}")
