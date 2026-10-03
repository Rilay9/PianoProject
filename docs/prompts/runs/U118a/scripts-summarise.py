"""U118a: one line per probe record in the given logs, and the margin per log.

margin = (when the run's 700 ms start fold was armed + 700) - (when the Both
click reached the page). Positive: the click beat the fold. When the click never
landed, the attempt's start (the probe's sample just before it) stands in, and
the margin is an upper bound.
"""
import json
import os
import re
import statistics
import sys

for path in sys.argv[1:]:
    print(f"== {os.path.basename(path)}")
    margins = []
    for line in open(path, encoding="utf-8", errors="replace"):
        if "PROBE " not in line:
            continue
        j = json.loads(line[line.index("{"):])
        ev = j["events"]

        def first(pattern):
            for e in ev:
                if re.search(pattern, e):
                    return int(e.split(" ")[0])
            return None

        start_fold = next((int(a.split("+")[0]) for a in j.get("armed", []) if a.endswith("+700")), None)
        click = first(r"click #score-hands-both")
        attempt = int(j["before"]["sincePlay"])
        landed = j["clicked"] == "landed"
        margin = None
        if start_fold is not None:
            margin = start_fold + 700 - (click if landed and click is not None else attempt)
            margins.append(margin)
        print(
            f"  cpu x{j['cpu']} face {j['face']}: armed {start_fold}+700, press64 {first('pointerdown 64')},"
            f" press62 {first('pointerdown 62')}, both click {click if landed else 'none'} (attempt {attempt}),"
            f" first fold {first('data-chrome=folded')}, margin {margin}{'' if landed else ' (upper bound)'},"
            f" chrome@attempt {j['before']['chrome']}, hit {j['before']['hit']}, landed {landed},"
            f" box positions {len(j['boxesDistinct'])}, stage {j['before'].get('stage')},"
            f" bar-left overflow-x {j['before'].get('barLeftOverflowX')}"
        )
    if margins:
        print(f"  margin median {statistics.median(margins)} ms, min {min(margins)}, max {max(margins)}, n {len(margins)}")
