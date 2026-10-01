"""U118a: per probe record, the steps' outcome (landed or not, the state after)."""
import json
import os
import sys

for path in sys.argv[1:]:
    print(f"== {os.path.basename(path)}")
    for line in open(path, encoding="utf-8", errors="replace"):
        if "PROBE " not in line:
            continue
        j = json.loads(line[line.index("{"):])
        title = line.split("PROBE ", 1)[1].split(" {", 1)[0]
        print(
            f"  {title}: chrome@attempt {j['before']['chrome']}, hit {j['before']['hit']},"
            f" learner tap -> {j.get('afterLearnerTap')}, click {j['clicked'][:60]}, after: {j.get('after')},"
            f" box positions {len(j['boxesDistinct'])}"
        )
