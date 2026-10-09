"""reading.accidental-kinds, whole catalogue: render every single-part file with OSMD 2.1.2 (jsdom) and tabulate the model and the
emulation against it with f2_osmd.confusion (same note key as the validators). Sharded so two processes can run.

Usage: python f2_full.py <shard> <of>      writes out/f2_full_<shard>.json (resumable: files already done are skipped)
"""
import sys, json, time
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path[:0] = [str(HERE / "shim1a"), str((HERE / "../../1A/validation").resolve())]
import f2_osmd as FO
from common import *

shard, of = int(sys.argv[1]), int(sys.argv[2])
ids = [i for i in BYID if len(cache(i)["parts"]) == 1]
mine = [i for k, i in enumerate(ids) if k % of == shard]
outf = HERE / f"out/f2_full_{shard}.json"
res = json.load(open(outf, encoding="utf8")) if outf.exists() else {}
t0 = time.time()
for n, i in enumerate(mine):
    if i in res:
        continue
    t1 = time.time()
    try:
        r = FO.confusion(i)
    except Exception as e:
        r = {"error": repr(e)[:300]}
    r["pipeline"] = pipeline(i)
    r["seconds"] = round(time.time() - t1, 1)
    res[i] = r
    if n % 25 == 0:
        json.dump(res, open(outf, "w", encoding="utf8"))
        print(shard, n, "/", len(mine), round(time.time() - t0), "s", flush=True)
json.dump(res, open(outf, "w", encoding="utf8"))
print("DONE", shard, len(res), round(time.time() - t0), "s", flush=True)
