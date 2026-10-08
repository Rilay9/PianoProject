import collections
from common import *
from r_ledger import ledger_rule

dist = collections.Counter()
hi = []
gen6 = collections.Counter()
for i in BYID:
    w = cache(i)
    r = ledger_rule(w, limit=99)
    mx = max([max(v["max_below"], v["max_above"]) for v in r["per_staff"].values()] or [0])
    p = pipeline(i)
    dist[(p, min(mx, 9))] += 1
    if p == "generated":
        if mx >= 6:
            gen6[i.split(".")[1] + "." + (i.split(".")[3] if len(i.split(".")) > 3 else "")] += 1
    elif mx >= 5:
        # where: which bars/staff/notes at >=5
        r2 = ledger_rule(w, limit=5)
        bl = r2["beyond_limit"]
        hi.append((mx, i, len(bl), bl[:4]))
print("max ledger lines per item (capped 9):")
for k in sorted(dist):
    print(" ", k, dist[k])
print("generated items with >=6:", sum(gen6.values()), dict(gen6))
print("real items with a note at >=5 lines:")
for x in sorted(hi, reverse=True):
    print(" ", x)
