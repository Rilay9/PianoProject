"""Step 1 for notation.times (before any reader is compared): the current detector's own list, times.py as the validators wrote it.
For every catalogue file: part 0's measures (times.measures), the bars whose signature differs from the one before (times.classify), and the
labels times.device_runs gives them. Writes tm_current.json = {id: {sigs, changes, labels}} for the files that have a change (the 49), and prints the ids."""
import sys, json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from tcommon import *
common, T = load_times()

res = {}
errors = []
nitems = 0
for it in common.CAT:
    if not it.get("file"):
        continue
    nitems += 1
    try:
        ms = T.measures(it["id"])
    except Exception as ex:
        errors.append((it["id"], repr(ex)[:80]))
        continue
    ch, cad = T.classify(ms)
    if not ch:
        continue
    lab = T.device_runs(ms, cad)
    res[it["id"]] = {
        "n_bars": len(ms),
        "sigs": [f"{m['sig'][0]}/{m['sig'][1]}" if m["sig"] else None for m in ms],
        "lens": [str(m["len"]) for m in ms],
        "numbers": [m["no"] for m in ms],
        "changes": ch,
        "labels": {str(i): v for i, v in sorted(lab.items())},
        "cad_bars": sorted(cad),
    }
print("catalogue files read:", nitems, "read errors:", len(errors), errors[:5])
print("files with a signature change (times.classify):", len(res))
for i, r in res.items():
    print(i, "| changes at idx", r["changes"], "|", sorted(set(r["labels"].values())))
json.dump(res, open(OUT / "tm_current.json", "w", encoding="utf8"), indent=1, ensure_ascii=False)
