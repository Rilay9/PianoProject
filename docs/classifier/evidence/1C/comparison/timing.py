"""Runtime per piece, one process, sequential, on a fixed sample of 30 catalogue items (every 67th item with a file, in
catalogue order). Usage:  python timing.py cur|extract   (main .venv)
                          python timing.py synpy         (build/venv-synpy; needs build/lines_items.json)
                          python timing.py amads         (build/venv-amads)
Each prints and writes timing_<tool>.json: per item seconds, median, max. A first call per tool (module import, caches)
is run before timing and not counted. Measured on one machine (the author's Windows 11 PC, shared with other jobs):
the numbers say how the tools compare here, not how long they take anywhere else.
"""
import json, statistics, sys, time, warnings
from pathlib import Path

warnings.simplefilter("ignore")
HERE = Path(__file__).resolve().parent
MAIN = Path(r"C:/Users/yalir/repos/Piano Stuff/PianoProject")
CAT = json.loads((MAIN / "app/public/content/catalog.json").read_text(encoding="utf-8"))
FILES = [i for i in CAT if i.get("file")]
SAMPLE = [i["id"] for i in FILES][::67]


def finish(tool, secs):
    ok = [s for s in secs.values() if s is not None]
    out = {"tool": tool, "items": len(secs), "measured": len(ok), "median_s": statistics.median(ok), "max_s": max(ok),
           "mean_s": statistics.mean(ok), "per_item": secs}
    (HERE / f"timing_{tool}.json").write_text(json.dumps(out), encoding="utf-8")
    print(tool, {k: v for k, v in out.items() if k != "per_item"})


def cur():
    sys.path.insert(0, str(HERE))
    import syn_common as C
    vs, vc = C.current()
    vs.analyse(SAMPLE[0])
    secs = {}
    for iid in SAMPLE:
        t = time.perf_counter()
        try:
            vs.analyse(iid)
            secs[iid] = time.perf_counter() - t
        except Exception:  # noqa: BLE001
            secs[iid] = None
    finish("cur", secs)


def extract():
    sys.path.insert(0, str(HERE))
    import lines_extract as LE
    LE.init()
    LE.extract(SAMPLE[0])
    secs = {}
    for iid in SAMPLE:
        t = time.perf_counter()
        try:
            LE.extract(iid)
            secs[iid] = time.perf_counter() - t
        except Exception:  # noqa: BLE001
            secs[iid] = None
    finish("extract", secs)


def synpy():
    sys.path.insert(0, str(HERE))
    import cat_synpy as CS
    CS.work(SAMPLE[0])
    secs = {}
    for iid in SAMPLE:
        if iid not in CS.LINES or "error" in CS.LINES[iid]:
            secs[iid] = None
            continue
        t = time.perf_counter()
        CS.work(iid)
        secs[iid] = time.perf_counter() - t
    finish("synpy", secs)


def amads():
    sys.path.insert(0, str(HERE))
    import amads_tools as AT
    AT.wnbd_score(MAIN / "app/public/content" / FILES[0]["file"])
    cat = {i["id"]: i for i in CAT}
    secs = {}
    for iid in SAMPLE:
        t = time.perf_counter()
        try:
            AT.wnbd_score(MAIN / "app/public/content" / cat[iid]["file"])
            secs[iid] = time.perf_counter() - t
        except Exception:  # noqa: BLE001
            secs[iid] = None
    finish("amads", secs)


if __name__ == "__main__":
    globals()[sys.argv[1]]()
