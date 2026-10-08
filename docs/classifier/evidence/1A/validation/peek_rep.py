import sys
from common import *
from r_repeat import structure
w = cache(sys.argv[1])
S, words = structure(w)
for m, s in S.items():
    flags = {k: v for k, v in s.items() if v}
    if flags:
        print(m, flags)
for d in w["dirs"]:
    if d["part"] == 0 and d["kind"] in ("words", "segno", "coda", "soundjump"):
        print(" dir", d["m"], d["kind"], (d.get("text") or "")[:40])
