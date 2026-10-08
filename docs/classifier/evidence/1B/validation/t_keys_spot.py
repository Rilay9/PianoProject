from common import *
import collections
from frames import nm
D = json.load(open(OUT / "keys_v.json"))
R = {k: r for k, r in D.items() if r["p"] != "generated" and "info" in r}
f = [k for k, r in R.items() if "f" in r["flags"]]
print("real flag f by ending source:", collections.Counter(R[k]["info"]["src"] for k in f))
dd = [k for k, r in R.items() if "d" in r["flags"]]
print("real flag d by ending source:", collections.Counter(R[k]["info"]["src"] for k in dd))
print("real flag d in the first-version ending (lowest note or chord) would be:", "n/a (the first version had no flag d computed here)")
for iid in ["exercise.articulation.c.legato.right", "exercise.double-sixth.c.1oct.right", "song.classical.ah-vous-dirais-je-maman.pdmx",
            "song.classical.bach-invention-no-12-in-a-major-bwv-783.pdmx", "song.classical.mozart-minuet-in-f-major-k-4.pdmx",
            "song.classical.bach-menuet-bwv-anh-113.pdmx", "song.folk.happy-birthday-piano.pdmx", "song.classical.chopin-ballade-2.nifc"]:
    sc = load(BYID[iid])
    n = sc.notes
    nb = len(sc.measure_starts)
    for m in (nb - 2, nb - 1):
        sel = sc.measure == m
        ev = sorted({(round(float(o), 2), int(p)) for o, p in zip(n["onset_quarter"][sel], n["pitch"][sel])})
        by = collections.defaultdict(list)
        for o, p in ev:
            by[o].append(nm(p))
        print(iid, "bar", m, dict(list(by.items())[:10]))
    print("   ", D[iid].get("info"), D[iid].get("flags"), D[iid].get("old"), D[iid].get("new"))
