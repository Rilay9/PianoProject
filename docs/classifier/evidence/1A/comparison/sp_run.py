"""Stage 3: every method on every piece (needs sp_prepare.py and pks_run.py done).

Per piece, writes one record to sp_results_<set>.json: note counts, the count of each flag kind (sp_lib.py), the flags themselves
(measure, written, PS13, PKSpell) for the kinds that are lists the later tables name, the seconds each method took.
PS13 = partitura estimate_spelling on the project's note array (the fields that array carries); PKSpell = pks_run.py's output;
test 2b = the validators' function over the raw walk of the same file (executed from source, sp_lib.t2b_hits adds the fix verdict).
"""
from cmp_common import *
import sp_lib as L
import numpy as np
from multiprocessing import Pool

IN = BUILD / "sp_in"; PKS = BUILD / "sp_pks"
PREP = json.load(open(HERE / "sp_prepare.json", encoding="utf8"))
FIELDS = ["onset_beat", "duration_beat", "onset_div", "duration_div", "step", "alter", "octave", "pitch", "onset_quarter",
          "duration_quarter", "ks_fifths", "voice", "staff"]


def notes_array(d):
    n = len(d["pitch"])
    dt = [(f, d[f].dtype) for f in FIELDS]
    arr = np.zeros(n, dtype=dt)
    for f in FIELDS:
        arr[f] = d[f]
    return arr


def one(p):
    key = p["key"]
    pr = PREP[key]
    rec = {"key": key, "set": p["set"], "label": p["label"]}
    t_walk = {}
    # ---- 2b first (raw walk; works even where the note table could not be built)
    try:
        wkey = "sp_" + (pr.get("hash") or __import__("hashlib").sha1(key.encode()).hexdigest()[:12])
        cache_file = BUILD / "sp_walkcache" / (wkey + ".pkl")
        cached = cache_file.exists()
        w, dt_walk = timed(walk_path, p["path"], wkey)
        hits, dt2b = timed(L.t2b_hits, w)
        rec["walk_s"] = None if cached else round(dt_walk, 3)
        rec["t2b_s"] = round(dt2b, 3)
        rec["n_struck"] = L.n_struck(w)
        rec["t2b"] = len(hits)
        rec["t2b_fix"] = sum(1 for h in hits if h["cleared"] in (None, "dim-unison"))
        rec["t2b_fix2"] = sum(1 for h in hits if h["cleared"] is None)
        rec["t2b_hits"] = hits
    except Exception as e:                                           # noqa
        rec["t2b_error"] = repr(e)[:200]
    if "hash" not in pr:
        rec["note_error"] = pr.get("error")
        return rec
    d = np.load(IN / (pr["hash"] + ".npz"))
    notes = notes_array(d)
    rec["n_notes"] = int(len(notes)); rec["reader_ok"] = pr["reader_ok"]; rec["load_s"] = pr["load_s"]
    if len(notes) == 0:
        return rec
    est, dt = timed(ps13, notes)
    rec["ps13_s"] = round(dt, 4)
    pk = json.load(open(PKS / (pr["hash"] + ".json")))
    rec["pks_s"] = pk["seconds"]
    ps, pa = L.pks_arrays(pk["tpc"])
    m = L.masks(notes, est, ps, pa)
    for kname, mk in m.items():
        rec[kname] = int(mk.sum())
    # flags that later tables name
    meas = d["measure"]
    ws, wa = L.written(notes)
    es, ea = est["step"].astype(str), est["alter"].astype(int)
    rec["kind2_flags"] = [[int(meas[i]), L.to_m21_name(ws[i], wa[i]) + str(int(notes["octave"][i])), L.to_m21_name(es[i], ea[i]),
                           L.to_m21_name(ps[i], pa[i])] for i in np.where(m["kind2"])[0]]
    rec["pks_gate_flags"] = [[int(meas[i]), L.to_m21_name(ws[i], wa[i]) + str(int(notes["octave"][i])), L.to_m21_name(es[i], ea[i]),
                              L.to_m21_name(ps[i], pa[i])] for i in np.where(m["pks_gate"])[0]]
    return rec


if __name__ == "__main__":
    pieces = json.load(open(HERE / "sp_pieces.json", encoding="utf8"))["pieces"]
    by_set = {}
    with Pool(8) as pool:
        for rec in pool.imap_unordered(one, pieces, chunksize=4):
            by_set.setdefault(rec["set"], []).append(rec)
    for s, recs in by_set.items():
        recs.sort(key=lambda r: r["key"])
        json.dump(recs, open(HERE / f"sp_results_{s}.json", "w", encoding="utf8"), ensure_ascii=False)
        print(s, len(recs), "t2b errors", sum(1 for r in recs if "t2b_error" in r), "note errors", sum(1 for r in recs if "note_error" in r))
