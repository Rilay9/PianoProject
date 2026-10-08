from common import *
from r_misc import fingering
rows = []
for i in BYID:
    if pipeline(i) == "generated":
        continue
    f = fingering(cache(i))
    if f["share"] >= 0.6:
        rows.append((f["share"], i, BYID[i].get("title")))
for r in sorted(rows):
    print(r)
