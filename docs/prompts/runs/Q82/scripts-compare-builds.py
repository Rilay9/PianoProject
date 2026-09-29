"""Q82: the final personal build's step lines against the baseline's (HEAD's code, the same clones), elapsed time aside.

    python docs/prompts/runs/Q82/scripts-compare-builds.py
"""
from pathlib import Path

RUNS = Path(__file__).resolve().parent


def steps(name: str) -> list[str]:
    lines = (RUNS / name).read_text(encoding="utf-8").splitlines()
    return [line for line in lines if line.startswith("  ok ") or line.startswith("  FAIL ")]


before, after = steps("build-baseline-personal.txt"), steps("build-final-personal.txt")
different = [(a, b) for a, b in zip(before, after) if a != b]
print(f"{len(before)} step line(s) before, {len(after)} after; {len(different)} differ")
for a, b in different:
    print(f"  before: {a}\n  after:  {b}")
