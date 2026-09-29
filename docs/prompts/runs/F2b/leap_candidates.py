"""
F2b: the excerpt candidate-rungs report's lines reached through the leap (`excerpts.candidate_rungs` on this
tree's build), by rung, with the `sharedBy` note each carries. Read-only.
"""
import json
import sys
from collections import Counter
from pathlib import Path

WT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(WT / "tools" / "content"))
import excerpts as X  # noqa: E402

content = WT / "app" / "public" / "content"
catalog = json.loads((content / "catalog.json").read_text(encoding="utf-8"))
curriculum = json.loads((content / "curriculum.json").read_text(encoding="utf-8"))
report = X.candidate_rungs(catalog, curriculum)
by_rung: Counter = Counter()
notes: Counter = Counter()
for row in report:
    for candidate in row["candidates"]:
        for claim in candidate["established"]:
            if claim["id"] == "interval.leap":
                by_rung[(candidate["rung"], claim["from"])] += 1
                notes[tuple(claim.get("sharedBy") or [])] += 1
print("excerpt candidate lines reached through interval.leap, by rung and source:")
for (rung, source), n in sorted(by_rung.items()):
    print(f"  {rung:10} {source:16} {n}")
print(f"sharedBy notes on those lines: {dict(notes)}")
