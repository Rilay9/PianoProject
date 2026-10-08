"""Sections 3-4 corrected rule on the catalogue: named examples, the check's failing items, the generated families,
and every readable item (first version vs corrected). Writes frames_cat.json."""
from common import *
from frames import frames, changes, show, nm
from rules.texture import view
import collections, time
import rules.harmony as H

NAMED = ["exercise.five-finger.c-major.right", "exercise.interval-reading.c-position.left.01", "exercise.position-shift.c.right",
         "exercise.hanon.01.both", "exercise.cadence.c.voice-led", "exercise.scale.c-major.1oct.similar.right.2",
         "exercise.tremolo.c.left", "exercise.five-finger.g-major.left", "exercise.five-finger.c-minor.both"]
out = {}
t0 = time.time()
for it in ITEMS:
    try:
        if one_line_staff(it):
            continue
        sc = load(it)
        v = view(sc)
        if v.unknown:
            continue
    except Exception as e:  # noqa
        out[it["id"]] = {"error": repr(e)[:100]}
        continue
    rec = {"p": pipeline(it), "fam": fam(it), "hands": {}}
    for h, evs in v.hands.items():
        old = frames(evs, slot_sharing=False, chord_link=False, guard=False)
        new = frames(evs)
        ch = changes(evs, new)
        rec["hands"][h] = {"old_n": len(old), "old_cls": [f["cls"] for f in old], "n": len(new), "cls": [f["cls"] for f in new],
                           "linked": sum(1 for f in new if f.get("linked")), "kinds": [c["kind"] for c in ch],
                           "joined": [c["joined_by"] for c in ch], "bars": [c["bar"] for c in ch],
                           "names": [f["name"] for f in new[:4]], "lohi": [[f["lo"], f["hi"]] for f in new[:6]]}
        if it["id"] in NAMED:
            print(it["id"], h, len(new), "frames", show(new)[:6], [(c["bar"], c["from"], c["to"], c["joined_by"], c["kind"]) for c in ch][:6])
            print("   first version:", len(old), "frames", [(nm(f["lo"]), nm(f["hi"]), f["cls"]) for f in old][:6])
    out[it["id"]] = rec
json.dump(out, open(OUT / "frames_cat.json", "w"), indent=0)
print("done", len(out), round(time.time() - t0))
