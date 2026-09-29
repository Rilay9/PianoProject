"""
L120a: per-demand counts of the `untaught` lines — X1's probe (at X1's head), the app's probe re-run at this
head, and the build's table — with every difference and the lines that make it. Run from the worktree root.
"""
from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / "tools" / "content"))
import untaught_options as U  # noqa: E402

LINE = re.compile(r"^(\S+) (\S+): (\{.*\})$")


def probe(path: Path) -> dict:
    out = {}
    for raw in path.read_text(encoding="utf-8").splitlines():
        m = LINE.match(raw.strip())
        if m and json.loads(m.group(3)).get("why") == "untaught":
            out[(m.group(1), m.group(2))] = tuple(json.loads(m.group(3))["demands"])
    return out


content = ROOT / "app" / "public" / "content"
report = U.table(json.loads((content / "catalog.json").read_text(encoding="utf-8")),
                 json.loads((content / "curriculum.json").read_text(encoding="utf-8")))
tool = {(l["rung"], l["item"]): tuple(d["id"] for d in l["demands"]) for l in report["lines"]}
x1 = probe(ROOT / "docs" / "prompts" / "runs" / "X1" / "probe-head-refusals.txt")
head = probe(ROOT / "docs" / "prompts" / "runs" / "L120a" / "probe-head-refusals.txt")
counts = {name: Counter(d for demands in lines.values() for d in demands) for name, lines in
          (("x1", x1), ("head", head), ("tool", tool))}
print(f"lines: X1 probe {len(x1)}, app probe at this head {len(head)}, tool {len(tool)}")
print(f"pairs: X1 probe {sum(counts['x1'].values())}, app probe at this head {sum(counts['head'].values())}, tool {sum(counts['tool'].values())}")
print()
print(f"{'demand':<30} {'X1':>5} {'head':>5} {'tool':>5}  difference")
for demand in sorted(set().union(*counts.values()), key=lambda d: -counts["x1"][d]):
    a, b, c = counts["x1"][demand], counts["head"][demand], counts["tool"][demand]
    notes = []
    if b != a:
        notes.append(f"head {b - a:+d}: " + ", ".join(f"{r} {i}" for (r, i), ds in head.items() if demand in ds and (r, i) not in x1))
    if c != b:
        notes.append(f"tool {c - b:+d}: " + ", ".join(f"{r} {i}" for (r, i), ds in head.items() if demand in ds and (r, i) not in tool))
    print(f"{demand:<30} {a:>5} {b:>5} {c:>5}  {'; '.join(notes) or '—'}")
print()
print("head +: options Q76 added to rungs after X1's head (e4f9d3f2: stage-2.json 2.4, stage-8.json ragtime.8);")
print("tool -: the runtime reading row the build does not read (listed unread, never as coped with).")
