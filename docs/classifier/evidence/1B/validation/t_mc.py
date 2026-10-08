"""Section 3 steps 6-7: Middle C position and tonic-to-dominant, on the generated families that declare a position and
on every two-hand item (Middle C)."""
from common import *
import collections
from frames import frames, nm
from rules.texture import view
import rules.harmony as H


def cands(f):
    s = f["hi"] - f["lo"]
    if s > 7:
        return []
    if f["slots"] == 5 or s == 7:
        return [f["lo"]]
    return list(range(f["hi"] - 7, f["lo"] + 1))


ttd = collections.Counter()
mc = []
for it in ITEMS:
    if pipeline(it) != "generated" or one_line_staff(it):
        continue
    try:
        sc = load(it)
        v = view(sc)
        if v.unknown:
            continue
    except Exception:
        continue
    fr = {h: frames(evs) for h, evs in v.hands.items()}
    if fam(it) in ("five_finger", "interval_reading"):
        an = H.analyse(sc)
        for h, fs in fr.items():
            for f in fs:
                if an.key is None:
                    ttd[(fam(it), "no key")] += 1
                    continue
                ok = any((T % 12) == an.key.tonic_pc and f["lo"] >= T and f["hi"] <= T + 7 for T in range(f["hi"] - 7, f["lo"] + 1))
                ttd[(fam(it), ok)] += 1
    if "R" in fr and "L" in fr:
        r1 = [f for f in fr["R"] if 60 in cands(f)]
        l1 = [f for f in fr["L"] if f["hi"] == 60]
        if r1 and l1:
            evR, evL = v.hands["R"], v.hands["L"]
            over = any(not (evR[a["last"]].end <= evL[b["first"]].onset or evL[b["last"]].end <= evR[a["first"]].onset) for a in r1 for b in l1)
            if over:
                exact = any(cands(a) == [60] for a in r1) and any(len(cands(b)) == 1 for b in l1)
                mc.append((it["id"], "exact" if exact else "inferred"))
print("tonic to dominant per frame (family, result):", dict(ttd))
print("Middle C position found:", len(mc), mc[:30])
