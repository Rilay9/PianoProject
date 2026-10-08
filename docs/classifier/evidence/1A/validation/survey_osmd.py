"""Catalogue-wide: the section 12 model's classes against the emulated OSMD 2.1.2 logic (which matched the render)."""
import collections
from common import *
from osmd_emul import osmd_model

tab = collections.defaultdict(collections.Counter)
items = collections.defaultdict(collections.Counter)
for i in BYID:
    w = cache(i)
    if len(w["parts"]) != 1:
        continue
    p = pipeline(i)
    emu = osmd_model(w)
    seen = set()
    for n, cls, info in accidental_model(w):
        if n["grace"]:
            continue
        k0 = (n["m"], n["staff"], round(float(n["t"]), 3), n["step"], n["octave"])
        if emu.get(k0 + (True,), 0) > 0:
            emu[k0 + (True,)] -= 1; shown = True
        elif emu.get(k0 + (False,), 0) > 0:
            emu[k0 + (False,)] -= 1; shown = False
        else:
            continue
        if n["acc"] and cls not in ("required", "missing"):
            tab[p][(cls, "drawn" if shown else "not drawn")] += 1
            if cls == "in_file_not_shown" and shown:
                seen.add("in_file_not_shown but drawn")
    for s in seen:
        items[p][s] += 1
for p in tab:
    print(p, dict(tab[p]), dict(items[p]))
