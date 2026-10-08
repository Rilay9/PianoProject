from common import *
from frames import nm
from rules.texture import view
import collections
D = json.load(open(OUT / "frames_cat.json"))
for iid in ["exercise.cadence.c.plagal", "exercise.cadence.c.root"]:
    v = view(load(BYID[iid]))
    for h, evs in v.hands.items():
        print(iid, h, [(e.bar, "+".join(nm(p) for p in e.pitches)) for e in evs][:16])
diff = collections.defaultdict(list)
for k, r in D.items():
    if "hands" not in r:
        continue
    o = sum(x["old_n"] for x in r["hands"].values())
    n = sum(x["n"] for x in r["hands"].values())
    if o != n:
        diff[r["p"] if r["p"] in ("generated", "pdmx") else "other"].append((k, o, n))
for p, l in diff.items():
    print(p, len(l), "items whose frame count changed;", "fewer:", sum(1 for x in l if x[2] < x[1]), "more:", sum(1 for x in l if x[2] > x[1]))
    print("   ", l[:40])
