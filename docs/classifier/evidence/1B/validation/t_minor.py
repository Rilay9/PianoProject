"""Section 6 note level (rules/harmony.py minor_form, unchanged) on the generated minor scales and the named examples;
the A minor broken-chord item with the key the corrected helper gives (A minor) put in place of the first version's."""
from common import *
import collections
import rules.harmony as H

res = collections.defaultdict(collections.Counter)
for it in ITEMS:
    if fam(it) != "scale" or "minor" not in it["id"]:
        continue
    r = H.minor_form(load(it))
    kind = "harmonic" if "harmonic" in it["id"] else "melodic" if "melodic" in it["id"] else "natural"
    res[kind][str(r.value.get("forms") if r.value else r.unknown)] += 1
print({k: dict(v) for k, v in res.items()})
for iid in ["exercise.scale.a-harmonic-minor.1oct.similar.both.2", "exercise.scale.a-melodic-minor.1oct.similar.right.2",
            "exercise.scale.a-natural-minor.1oct.similar.both.2", "exercise.scale.c-major.1oct.similar.both.2", "exercise.accompaniment.broken.a-minor.left"]:
    sc = load(BYID[iid])
    r = H.minor_form(sc)
    print(iid, r.value if r.value else r.unknown)
# the broken-chord item with the corrected key
sc = load(BYID["exercise.accompaniment.broken.a-minor.left"])
an = H.analyse(sc)
an.key = H.Key(9, "A", "minor", 0.9, "corrected ending vote (build/v1b keyfix)")
print("broken a-minor with the corrected key:", H.minor_form(sc).value)
