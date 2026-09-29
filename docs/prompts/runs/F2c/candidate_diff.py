"""
F2c: a candidate-rungs report regenerated before and after the mapping change, line for line (line
endings normalised), with the count of lines naming `blues.7` or `ragtime.9` and of shared-detector
notes on each side.

    python docs/prompts/runs/F2c/candidate_diff.py <before.md> <after.md>
"""
import difflib
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")  # the reports' dashes and daggers, written as UTF-8 into the capture


def lines(path: str) -> list[str]:
    return Path(path).read_bytes().replace(b"\r\n", b"\n").decode("utf-8").split("\n")


a, b = lines(sys.argv[1]), lines(sys.argv[2])
for name, side in (("before", a), ("after", b)):
    advanced = [line for line in side if line.startswith("| blues.7 ") or line.startswith("| ragtime.9 ")]
    leap = [line for line in side if "interval.leap (concept" in line and line.startswith("| ")]
    print(f"{name}: {len(side)} lines; table lines at blues.7 or ragtime.9 {len(advanced)}; "
          f"table lines crediting interval.leap through a concept {len(leap)} "
          f"(through leaps {sum('(concept leaps)' in line for line in leap)}, through leap {sum('(concept leap)' in line for line in leap)}); "
          f"shared-detector notes on interval.leap {sum(line.startswith('† `interval.leap`') for line in side)}, "
          f"on texture.left-hand-pattern {sum(line.startswith('† `texture.left-hand-pattern`') for line in side)}")
from collections import Counter  # noqa: E402

# As multisets: a line-diff shows a line as moved where only its neighbour went; these are what left and came.
gone, came = Counter(a) - Counter(b), Counter(b) - Counter(a)
print(f"as multisets: lines only before {sum(gone.values())} "
      f"(at blues.7 or ragtime.9 {sum(n for k, n in gone.items() if k.startswith(('| blues.7 ', '| ragtime.9 ')))}), "
      f"lines only after {sum(came.values())}: {sorted(came)}")
print(f"  the lines only before that are not at blues.7 or ragtime.9: "
      f"{sorted(k for k in gone if not k.startswith(('| blues.7 ', '| ragtime.9 ')))}")
diff = [line for line in difflib.unified_diff(a, b, "before", "after", n=0, lineterm="")]
print(f"diff lines: {len(diff)}")
for line in diff:
    print(line)
