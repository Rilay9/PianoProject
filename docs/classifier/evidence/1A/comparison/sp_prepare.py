"""Stage 1: read every piece once into a note table (build/sp_in/<hash>.npz) for the later stages.

The reader is the project's (tools/classifier/score.py, partitura); where it raises (its pickup test, the line-109 fault already
listed on rules/area-1B.md) the same reader without that test is used and the piece is marked reader_ok = false.
Writes sp_prepare.json: per key {hash, n_notes, reader_ok, load_s} or {error}.
"""
from cmp_common import *
import hashlib
import numpy as np
from multiprocessing import Pool

IN = BUILD / "sp_in"; IN.mkdir(exist_ok=True)
FIELDS = ["onset_beat", "duration_beat", "onset_div", "duration_div", "step", "alter", "octave", "pitch", "onset_quarter", "duration_quarter", "ks_fifths", "voice", "staff"]


def h(key):
    return hashlib.sha1(key.encode("utf8")).hexdigest()[:12]


def one(p):
    key = p["key"]
    try:
        (sc, ok), dt = timed(load_notes, p["path"])
        n = sc.notes
        data = {f: np.asarray(n[f]) for f in FIELDS}
        data["measure"] = np.asarray(sc.measure)
        np.savez_compressed(IN / (h(key) + ".npz"), **data)
        return key, {"hash": h(key), "n_notes": int(len(n)), "reader_ok": ok, "load_s": round(dt, 3)}
    except Exception as e:                                          # noqa
        return key, {"error": repr(e)[:200]}


if __name__ == "__main__":
    pieces = json.load(open(HERE / "sp_pieces.json", encoding="utf8"))["pieces"]
    out = {}
    with Pool(8) as pool:
        for k, v in pool.imap_unordered(one, pieces, chunksize=4):
            out[k] = v
    json.dump(out, open(HERE / "sp_prepare.json", "w", encoding="utf8"), indent=0)
    bad = [k for k, v in out.items() if "error" in v]
    print("pieces", len(out), "errors", len(bad), "reader fallback", sum(1 for v in out.values() if v.get("reader_ok") is False))
    for k in bad[:20]:
        print(k, out[k]["error"])
