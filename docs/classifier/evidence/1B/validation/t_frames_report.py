from common import *
from frames import nm
from rules.texture import view
import collections
D = json.load(open(OUT / "frames_cat.json"))


def hands(rec):
    return rec.get("hands", {})


for iid in ["exercise.position-shift.c.right", "exercise.position-shift.c.left", "exercise.study.position-shift.c-major.4-4.12bar.blocked.01"]:
    v = view(load(BYID[iid]))
    for h, evs in v.hands.items():
        print(iid, h, [(e.bar, "+".join(nm(p) for p in e.pitches)) for e in evs][:24])
        print("   ", D[iid]["hands"][h])

print("\n== generated families (corrected / first version)")
for f in ["five_finger", "interval_reading", "riff", "position_shift", "cadence", "scale", "hanon", "tremolo_octaves", "triad_inversions", "arpeggio", "four_chord_loop", "accompaniment"]:
    recs = [(k, r) for k, r in D.items() if r.get("fam") == f]
    one_ff = sum(1 for k, r in recs if hands(r) and all(x["n"] == 1 and x["cls"] == ["five-finger"] for x in hands(r).values()))
    one_ff_old = sum(1 for k, r in recs if hands(r) and all(x["old_n"] == 1 and x["old_cls"] == ["five-finger"] for x in hands(r).values()))
    nchg = collections.Counter(sum(x["n"] - 1 for x in hands(r).values()) for k, r in recs)
    nchg_old = collections.Counter(sum(x["old_n"] - 1 for x in hands(r).values()) for k, r in recs)
    kinds = collections.Counter(k2 for k, r in recs for x in hands(r).values() for k2 in x["kinds"])
    linked = sum(1 for k, r in recs for x in hands(r).values() if x["linked"])
    print(f, len(recs), "one five-finger frame per hand:", one_ff, "(first", one_ff_old, ")", "changes per item:", dict(sorted(nchg.items())), "(first", dict(sorted(nchg_old.items())), ")", "kinds:", dict(kinds), "linked frames:", linked)

print("\n== cadence family per item")
for k, r in sorted(D.items()):
    if r.get("fam") == "cadence":
        print(k, {h: (x["n"], x["cls"], x["kinds"], x["old_n"]) for h, x in hands(r).items()})

print("\n== all items by pipeline")
for p in ["generated", "pdmx", "other"]:
    recs = [r for r in D.values() if "hands" in r and (r["p"] == p or (p == "other" and r["p"] not in ("generated", "pdmx")))]
    anyc = sum(1 for r in recs if any(x["n"] > 1 for x in r["hands"].values()))
    anyc_old = sum(1 for r in recs if any(x["old_n"] > 1 for x in r["hands"].values()))
    one = sum(1 for r in recs if r["hands"] and all(x["n"] == 1 and x["cls"] == ["five-finger"] for x in r["hands"].values()))
    one_old = sum(1 for r in recs if r["hands"] and all(x["old_n"] == 1 and x["old_cls"] == ["five-finger"] for x in r["hands"].values()))
    kinds = collections.Counter(k2 for r in recs for x in r["hands"].values() for k2 in x["kinds"])
    print(p, len(recs), "items with a change of frame:", anyc, "(first", anyc_old, ") one five-finger frame per hand:", one, "(first", one_old, ") kinds:", dict(kinds))
print("errors:", [k for k, r in D.items() if "error" in r])
