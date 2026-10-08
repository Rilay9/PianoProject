from common import *
from r_format import fmt_measures, staves_of
rows = []
for i in BYID:
    w = cache(i)
    if len(w["parts"]) != 1 or staves_of(w)[0] != 1 or pipeline(i) == "generated":
        continue
    r = fmt_measures(w)
    rows.append((r["layout"][:12], r.get("syms"), r.get("bars"), r.get("multi"), r.get("slash"), i[:70], (w["title"] or "")[:40]))
for x in sorted(rows, key=lambda x: (x[0], x[5])):
    print(x)
