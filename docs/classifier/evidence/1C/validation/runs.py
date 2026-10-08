"""runs.py : every item whose part-0 signature changes; each run of one signature as (first no., sig, bars, actual
length of the first bar, boundary at its start or end, cadenza words inside, numerator 1)."""
import sys, re
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import CAT
from times import measures, siglen, boundary, CAD_WORDS

n_items = 0
for it in CAT:
    if not it.get("file"):
        continue
    try:
        ms = measures(it["id"])
    except Exception as ex:
        print("ERR", it["id"], ex); continue
    runs = []
    for i, m in enumerate(ms):
        if runs and m["sig"] == ms[runs[-1][0]]["sig"]:
            runs[-1][1] += 1
        else:
            runs.append([i, 1])
    if len(runs) < 2:
        continue
    n_items += 1
    src = "gen" if it["id"].startswith("exercise.") else "pdmx" if it["id"].endswith(".pdmx") or ".pdmx." in it["id"] else "rep"
    parts = []
    for (i, k) in runs:
        m = ms[i]
        cw = any(CAD_WORDS.search(w) for j in range(i, i + k) for w in ms[j]["words"])
        b = boundary(ms, i) or boundary(ms, i + k - 1)
        parts.append(f"{m['no']}:{m['sig'][0]}/{m['sig'][1]}x{k}{'(len ' + str(m['len']) + ')' if k <= 2 and m['len'] != siglen(m['sig']) else ''}{' B' if b else ''}{' CAD' if cw else ''}")
    print(src, it["id"], "|", " ".join(parts[:16]) + (" ..." if len(parts) > 16 else ""))
print("items with a change:", n_items)
