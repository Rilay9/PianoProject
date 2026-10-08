"""Spot-check: in real items where the corrected rule gives fewer frames, show the corrected frames that contain a
shared slot (a semitone pair on one letter), with their notes, to judge whether one hand position is right."""
from common import *
from frames import frames, nm
from rules.texture import view
import random
random.seed(1)
ids = sys.argv[1:]
for iid in ids:
    v = view(load(BYID[iid]))
    shown = 0
    for h, evs in v.hands.items():
        for f in frames(evs):
            ms = sorted({m for m, _ in f["pairs"]})
            if len(ms) > f["slots"] and not f.get("linked"):
                seq = [("+".join(nm(p) for p in e.pitches)) for e in evs[f["first"]:f["last"] + 1]]
                print(iid, h, "bar", evs[f["first"]].bar, f["cls"], "slots", f["slots"], "pitches", [nm(m) for m in ms], "seq", seq[:20])
                shown += 1
                if shown >= 4:
                    break
