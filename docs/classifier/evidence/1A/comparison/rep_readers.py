"""Played-bar count of every catalogue file with repeat structure, by each reader.
Readers:
  unroller      validation/r_repeat.py unroll(w)                (the current detector, as the spec states it)
  unroller+cp   validation/r_repeat.py unroll(w, coda_pair=True) (the fix the validation row points to: two coda signs, no 'To Coda' words)
  music21       validation/r_repeat.py m21_played(i)             (repeat.Expander on part 0, defaults; None = not expandable)
  m21_after     repeat.Expander with repeatAfterJump=True is NOT run here (the page's convention is the default False)
  pt_max        partitura.score.unfold_part_maximal(part)                (all repeats, jump info ignored: default ignore_leaps=True)
  pt_max_noleap partitura.score.unfold_part_maximal(part, ignore_leaps=False)   (no repeats after a leap)
  pt_min        partitura.score.unfold_part_minimal(part)               (each repeat once, last volta only)
Count for partitura = number of score.Measure objects of the unfolded part. Input = the catalogue file read in place.
Usage: rep_readers.py --all   (writes rep_readers.json)   |   rep_readers.py ID ...   (prints)"""
import sys, json, time, traceback
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from rcommon import *


def one(i):
    walk, common, rr = load_validators()
    from common import BYID, cache
    res = {"id": i, "printed": None}
    w = cache(i)
    S, words = rr.structure(w)
    res["printed"] = len(S)
    res["jump_words"] = [(m + 1, t) for m, t in words]
    t0 = time.time()
    for key, kw in (("unroller", {}), ("unroller_cp", {"coda_pair": True})):
        try:
            res[key] = rr.unroll(w, **kw)["played"]
        except Exception as e:
            res[key] = "ERR " + repr(e)[:100]
    res["t_unroller"] = round(time.time() - t0, 3)
    t0 = time.time()
    try:
        mp, rex = rr.m21_played(i)
        res["music21"] = mp
        res["m21_repeat_expressions"] = rex
    except Exception as e:
        res["music21"] = "ERR " + repr(e)[:100]
    res["t_music21"] = round(time.time() - t0, 3)
    t0 = time.time()
    try:
        sys.setrecursionlimit(20000)
        import partitura as pt
        from partitura import score as ps
        sc = pt.load_musicxml(str(CONTENT / BYID[i]["file"]))
        part = sc.parts[0]
        res["pt_printed"] = len(list(part.iter_all(ps.Measure)))
        for key, fn in (("pt_max", lambda p: ps.unfold_part_maximal(p)),
                        ("pt_max_noleap", lambda p: ps.unfold_part_maximal(p, ignore_leaps=False)),
                        ("pt_min", lambda p: ps.unfold_part_minimal(p))):
            try:
                up = fn(pt.load_musicxml(str(CONTENT / BYID[i]["file"])).parts[0])  # fresh load each time: get_paths adds segments to the part
                res[key] = len(list(up.iter_all(ps.Measure)))
            except Exception as e:
                res[key] = "ERR " + repr(e)[:100]
    except Exception as e:
        for key in ("pt_max", "pt_max_noleap", "pt_min"):
            res[key] = "ERR " + repr(e)[:100]
    res["t_partitura"] = round(time.time() - t0, 3)
    return res


if __name__ == "__main__":
    args = sys.argv[1:]
    if args == ["--all"]:
        from multiprocessing import Pool
        ids = list(json.load(open(OUT / "rep_structure.json", encoding="utf8")))
        out = {}
        with Pool(8) as p:
            for n, r in enumerate(p.imap_unordered(one, ids, chunksize=2)):
                out[r["id"]] = r
                if n % 40 == 0:
                    print(n, len(ids), flush=True)
        json.dump(out, open(OUT / "rep_readers.json", "w", encoding="utf8"), indent=1, ensure_ascii=False, sort_keys=True)
        print("done", len(out))
    else:
        for i in args:
            print(json.dumps(one(i), ensure_ascii=False))
