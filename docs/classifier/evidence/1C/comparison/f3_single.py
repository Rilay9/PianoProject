"""rhythm.tuplets-other: closed brackets that enclose a single note or rest (cannot group anything), catalogue-wide, by ratio and item;
and the effect of requiring at least two items inside a bracket on the named cases. Reads out/f3_scan.json."""
import json, collections
from pathlib import Path
HERE = Path(__file__).resolve().parent
S = json.load(open(HERE / "out/f3_scan.json", encoding="utf8"))
one = collections.defaultdict(list)
n_closed = 0
for i, v in S.items():
    if "error" in v:
        continue
    for x in v["brackets"]:
        if x[6] == "UNCLOSED":
            continue
        n_closed += 1
        if x[1] == 1:
            one[(i, f"{x[0][0]}:{x[0][1]}" if x[0] else "no time-modification")].append(x[2])
print("closed brackets:", n_closed, "| enclosing exactly one note/rest:", sum(len(v) for v in one.values()), "in", len({k[0] for k in one}), "items")
for (i, r), ms in sorted(one.items()):
    print("  ", r.ljust(8), i, "measures", ms[:6])
