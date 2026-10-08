import sys, collections
from common import *
i = sys.argv[1]
bars = set(int(x) for x in sys.argv[2].split(",")) if len(sys.argv) > 2 and sys.argv[2] else None
w = cache(i)
print(w["title"], "parts", [p["name"] for p in w["parts"]], "measures", n_measures(w))
for n in w["notes"]:
    if bars is not None and n["m"] not in bars:
        continue
    if n["rest"]:
        print(" m", n["m"], "st", n["staff"], "v", n["voice"], "t", float(n["t"]), "REST", float(n["dur"]))
        continue
    print(" m", n["m"], "st", n["staff"], "v", n["voice"], "t", float(n["t"]), f"{n['step']}{n['alter']:+.0f}{n['octave']}" if n["step"] else "unp",
          "d", float(n["dur"]), "ch" if n["chord"] else "", "acc", n["acc"], n["acc_attrs"] or "", "nh", n["notehead"] or "", "tie", "S" if n["tie_start"] else "", "E" if n["tie_stop"] else "",
          "tup", n["tuplets"] or "", "f", n["fing"] or "", "g" if n["grace"] else "")
if len(sys.argv) > 3:
    for d in w["dirs"]:
        if bars is None or d["m"] in bars:
            print(" DIR", d)
    for h in w["harm"]:
        if bars is None or h["m"] in bars:
            print(" HARM", h["m"], float(h["t"]), h["root"], h["kind"], h["staff"])
    for c in w["clefs"]:
        if bars is None or c["m"] in bars:
            print(" CLEF", c)
