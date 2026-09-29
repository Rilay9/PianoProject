"""
L120a: the build's table against the app's probe re-run at this head (probe-head-refusals.txt, the gate's
verdicts; probe-head-uncoped.txt, the coping question alone whatever the gate asks first). Prints every
difference with the row's kind; run from the worktree root. Writes nothing.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / "tools" / "content"))
import untaught_options as U  # noqa: E402

RUNS = ROOT / "docs" / "prompts" / "runs" / "L120a"
LINE = re.compile(r"^(\S+) (\S+): (.*)$")


def read(path: Path, untaught_only: bool) -> dict[tuple[str, str], tuple[str, ...]]:
    out = {}
    for raw in path.read_text(encoding="utf-8").splitlines():
        m = LINE.match(raw.strip())
        if not m:
            continue
        value = json.loads(m.group(3))
        if untaught_only:
            if value.get("why") != "untaught":
                continue
            value = value["demands"]
        out[(m.group(1), m.group(2))] = tuple(value)
    return out


content = ROOT / "app" / "public" / "content"
catalog = json.loads((content / "catalog.json").read_text(encoding="utf-8"))
curriculum = json.loads((content / "curriculum.json").read_text(encoding="utf-8"))
report = U.table(catalog, curriculum)
lines = {(l["rung"], l["item"]): tuple(d["id"] for d in l["demands"]) for l in report["lines"]}
shadowed = {(r["rung"], r["item"]): tuple(r["demands"]) for r in report["shadowed"]}
unread = {(r["rung"], r["item"]) for r in report["unread"]}

refusals = read(RUNS / "probe-head-refusals.txt", True)
uncoped = read(RUNS / "probe-head-uncoped.txt", False)

print(f"tool lines {len(lines)}; app probe `untaught` at this head {len(refusals)}")
for key in sorted(set(refusals) - set(lines)):
    print(f"  only the app: {key} {refusals[key]} ({'a runtime reading row, listed unread by the tool' if key in unread else 'UNEXPLAINED'})")
for key in sorted(set(lines) - set(refusals)):
    print(f"  only the tool: {key} {lines[key]} UNEXPLAINED")
same = [k for k in lines if k in refusals and lines[k] != refusals[k]]
print(f"  same option, different demands: {len(same)}")
for key in same:
    print(f"    {key}: app {refusals[key]} tool {lines[key]}")

both = {**lines, **shadowed}
print(f"tool lines + shadowed {len(both)}; app `uncoped` at this head (the coping question alone) {len(uncoped)}")
for key in sorted(set(uncoped) - set(both)):
    print(f"  only the app: {key} {uncoped[key]} ({'a runtime reading row, listed unread by the tool' if key in unread else 'UNEXPLAINED'})")
for key in sorted(set(both) - set(uncoped)):
    print(f"  only the tool: {key} {both[key]} UNEXPLAINED")
same = [k for k in both if k in uncoped and both[k] != uncoped[k]]
print(f"  same option, different demands: {len(same)}")
for key in same:
    print(f"    {key}: app {uncoped[key]} tool {both[key]}")
