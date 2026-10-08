import collections
from common import *
from r_format import purpose, staves_of
from r_repeat import unroll

pc = collections.Counter(); ex = []
partial = []
ratio = []
for i in BYID:
    w = cache(i); p = pipeline(i)
    if p != "generated":
        pu = purpose(w)
        pc[(p, pu)] += 1
        if pu.startswith("technical") and len(ex) < 200:
            ex.append(BYID[i].get("title"))
    sv = staves_of(w)
    if len(w["parts"]) == 1 and sv[0] == 2 and w["harm"]:
        bars = n_measures(w)
        low = {n["m"] for n in w["notes"] if struck(n) and n["staff"] == 2}
        if bars and (bars - len(low)) >= bars / 2:
            partial.append((i, bars, len(low)))
    u = unroll(w)
    if u["printed"]:
        ratio.append((round(u["played"] / u["printed"], 2), i))
print("purpose:", sorted(pc.items()))
print("technical-exercise candidate titles (real):", len(ex))
for t in ex:
    print("   ", t)
print("one-part two-staff with symbols and the lower staff silent in at least half the bars:", partial)
print("unroller played/printed, top 5:", sorted(ratio, reverse=True)[:5])
