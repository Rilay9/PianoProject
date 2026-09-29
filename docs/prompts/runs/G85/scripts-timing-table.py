"""G85's draw timing, tabled: the alternating rounds' medians per build, and after/before as a ratio.
Usage (from the worktree root): python docs/prompts/runs/G85/scripts-timing-table.py
The milliseconds are this machine's, observed here; the ratios are the relationship the entry reports.
"""
import json
import pathlib
import statistics

ROOT = pathlib.Path(__file__).resolve().parents[4] / "build" / "g85" / "timing"
KEYS = ["drawNone", "drawOne", "drawForty", "loadNone", "loadOne", "loadForty"]
rows = {phase: [json.loads((ROOT / f"{phase}-{r}.json").read_text(encoding="utf-8")) for r in (1, 2, 3)] for phase in ("before", "after")}
print("measure      | before rounds (ms, observed here) | after rounds (ms, observed here) | after / before (median of rounds)")
for key in KEYS:
    before = [round(one[key], 2) for one in rows["before"]]
    after = [round(one[key], 2) for one in rows["after"]]
    ratio = statistics.median(after) / statistics.median(before)
    print(f"{key:12} | {before} | {after} | {ratio:.2f}")
print("seeded:", [one.get("seededForty") for one in rows["after"]])
