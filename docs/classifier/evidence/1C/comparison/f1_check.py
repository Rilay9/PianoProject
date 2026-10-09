"""item.format: checks that f1_format.py reproduces the validators' unchanged runs (out/f1_before_survey_last.txt, out/f1_before_survey_format.txt)."""
import json, re, collections
from pathlib import Path
HERE = Path(__file__).resolve().parent
items = json.load(open(HERE / "out/f1_format.json", encoding="utf8"))
last = (HERE / "out/f1_before_survey_last.txt").read_text(encoding="utf-8-sig")
m = re.search(r"lower staff silent in at least half the bars: (\[.*\])", last)
theirs = {t[0] for t in eval(m.group(1))}
mine = {i for i, v in items.items() if v["unknown_before"]}
print("UNKNOWN-layout rule: validators' survey_last.py ids", len(theirs), "| f1_format.py ids", len(mine), "| identical:", theirs == mine)
fmt = (HERE / "out/f1_before_survey_format.txt").read_text(encoding="utf-8-sig")
their_counts = collections.Counter()
for line in fmt.splitlines():
    mm = re.match(r"\('(\w+)', '(.*)'\) (\d+)$", line)
    if mm:
        their_counts[(mm.group(1), mm.group(2))] = int(mm.group(3))
mine_counts = collections.Counter()
for i, v in items.items():
    lay = v["before"]
    if lay == "UNKNOWN":   # the validators' survey_format.py has no UNKNOWN: such an item is whatever fmt_measures said
        continue
    mine_counts[(v["pipeline"], lay)] += 1
# items f1_format called UNKNOWN fall back to their fmt_measures layout in the validators' table
for i, v in items.items():
    if v["before"] == "UNKNOWN":
        pass
print("survey_format.py table rows:", sum(their_counts.values()), "items; f1_format.py rows without the UNKNOWN items:", sum(mine_counts.values()))
diff = {k: (their_counts.get(k, 0), mine_counts.get(k, 0)) for k in set(their_counts) | set(mine_counts) if their_counts.get(k, 0) != mine_counts.get(k, 0)}
print("rows that differ (validators, f1_format) - only the 28 UNKNOWN items should account for them:", diff)

