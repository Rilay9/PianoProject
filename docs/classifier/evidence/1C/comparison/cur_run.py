"""The current rhythm.syncopation detector (validation/sync.py, unchanged) over every catalogue item with a file.

Writes cur_items.json: per item the kinds per hand, present_page / present_proper, unknown, error, whether the file
carries a <time> element, and the wall time of analyse() (which includes reading the file with the project's reader).
Also runs the same code with three one-line patches (a "fix" variant, text replacement at load time, sync.py untouched):
  F1  bass-then-held-chord: the previous onset counts as a single note when its pitches share one pitch class
      (an octave bass), the validation row's failure (2);
  F2  bass-then-held-chord only in the left hand (it fired in Mazurka Op. 68 No. 4's right-hand melody);
and records the fix variant's kinds in the same row under "fix".
Usage: python cur_run.py           (all items, 4 worker processes)
"""
import json, re, sys, time, types, warnings
from multiprocessing import Pool
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import syn_common as C

warnings.simplefilter("ignore")
OUT = C.HERE / "cur_items.json"
_vs = None
_vf = None


def _fix_module():
    """sync.py source with F1 and F2 applied by text replacement, loaded as module sync_fix."""
    src = (C.VALID / "sync.py").read_text(encoding="utf-8")
    a = "if len(here) >= 2 and pv is not None and o - pv == B and len(onsets_all[h][pv]) == 1:"
    assert a in src
    b = ("if h == 'L' and len(here) >= 2 and pv is not None and o - pv == B "
         "and len({p % 12 for p in onsets_all[h][pv]}) == 1:")
    src = src.replace(a, b)
    m = types.ModuleType("sync_fix")
    m.__file__ = str(C.VALID / "sync.py")
    m.__dict__["__name__"] = "sync_fix"
    exec(compile(src, str(C.VALID / "sync.py"), "exec"), m.__dict__)
    return m


def init():
    global _vs, _vf
    _vs, _vc = C.current()
    _vf = _fix_module()


def one(iid):
    row = {"id": iid}
    try:
        xml = _vs.item_xml(iid) if hasattr(_vs, "item_xml") else None
    except Exception:
        xml = None
    row["has_time"] = bool(re.search(r"<time[ >]", xml)) if xml is not None else None
    t = time.perf_counter()
    try:
        r = _vs.analyse(iid)
        row["secs"] = time.perf_counter() - t
        row["kinds"] = r.get("kinds", {})
        row["present_page"] = r.get("present_page")
        row["present_proper"] = r.get("present_proper")
        row["unknown"] = r.get("unknown")
        row["readable"] = r.get("readable")
        row["ties"] = r.get("ties", {})
    except Exception as ex:  # noqa: BLE001
        row["secs"] = time.perf_counter() - t
        row["error"] = repr(ex)[:200]
        return row
    try:
        f = _vf.analyse(iid)
        row["fix"] = {"kinds": f.get("kinds", {}), "present_page": f.get("present_page"),
                      "present_proper": f.get("present_proper")}
    except Exception as ex:  # noqa: BLE001
        row["fix"] = {"error": repr(ex)[:200]}
    return row


if __name__ == "__main__":
    cat = C.catalogue()
    ids = [i["id"] for i in cat if i.get("file")]
    t0 = time.perf_counter()
    with Pool(3, initializer=init) as p:
        res = p.map(one, ids, chunksize=8)
    OUT.write_text(json.dumps(res), encoding="utf-8")
    print(len(res), "items;", sum(1 for r in res if "error" in r), "errors;", round(time.perf_counter() - t0), "s wall")
