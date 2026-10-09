"""Run the current detector and the music21 / partitura tools on every selected When in Rome piece; write
wir_results.json (per piece: truth, global answers, per-bar local-key series, seconds per method).

Usage: python wir_run.py [limit]       (limit = first N pieces, for a pilot)
Local-key series are stored per music21 measure index of the first part (`nums` = the measure number of each index), as
[pc, mode] or null. Methods:
  global : cur_first (H.analyse key), cur_corr (keyfix.infer_key2), cur_ks (partitura estimate_key on the whole piece),
           m21_KS, m21_AE, m21_BB, m21_TKP (music21 analyze('krumhansl'|'aarden'|'bellman'|'temperley'))
  local  : cur_win (partitura estimate_key, bars b-1..b+2), cur_areas_all / cur_areas_first / cur_areas_corr (t_kc areas),
           m21_float (analysis.floatingKey.KeyAnalyzer.run), m21_float_raw (its single-bar key),
           m21_win_BB / m21_win_AE (music21 Bellman-Budge / Aarden-Essen over bars b-1..b+2)
"""
from cmp_common import *
from multiprocessing import Pool
import traceback


def timed(f, *a):
    t = time.perf_counter()
    try:
        r = f(*a)
    except Exception as e:  # noqa
        return None, time.perf_counter() - t, repr(e)[:150]
    return r, time.perf_counter() - t, None


def run_piece(entry):
    from music21 import converter, analysis
    from music21.analysis import floatingKey, discrete
    import cur_detector as C
    rec = {"dir": entry["dir"], "group": entry["group"], "truth": entry["truth"], "g": {}, "loc": {}, "sec": {}, "err": {}}
    mxl = WIR / entry["dir"] / "score.mxl"
    try:
        s, dt, e = timed(converter.parse, str(mxl))
        if s is None:
            rec["err"]["parse"] = e
            return rec
        rec["sec"]["m21_parse"] = dt
        ms = s.parts[0].getElementsByClass("Measure")
        rec["nums"] = [m.number for m in ms]
        n = len(ms)
        # ---- music21 global
        for tag, ident in (("KS", "krumhansl"), ("AE", "aarden"), ("BB", "bellman"), ("TKP", "temperley")):
            r, dt, e = timed(lambda: m21_key(s.analyze(ident)))
            rec["g"]["m21_" + tag] = r
            rec["sec"]["g_m21_" + tag] = dt
            if e:
                rec["err"]["g_m21_" + tag] = e
        # ---- music21 local
        def fl():
            ka = floatingKey.KeyAnalyzer(s)
            sm = ka.run()
            return [m21_key(k) for k in sm], [m21_key(k) for k in ka.rawKeyByMeasure]
        r, dt, e = timed(fl)
        if r:
            rec["loc"]["m21_float"], rec["loc"]["m21_float_raw"] = r
        rec["sec"]["l_m21_float"] = dt
        if e:
            rec["err"]["l_m21_float"] = e
        for tag, ident in (("BB", "bellman"), ("AE", "aarden")):
            def win():
                out = []
                for i in range(n):
                    lo, hi = max(0, i - 1), min(n - 1, i + 2)
                    try:
                        sub = s.measures(lo, hi, indicesNotNumbers=True)
                        out.append(m21_key(sub.analyze(ident)) if len(sub.recurse().notes) >= 8 else None)
                    except Exception:  # noqa
                        out.append(None)
                return out
            r, dt, e = timed(win)
            rec["loc"]["m21_win_" + tag] = r
            rec["sec"]["l_m21_win_" + tag] = dt
            if e:
                rec["err"]["l_m21_win_" + tag] = e
        # ---- current detector (project score reader + harmony analysis)
        t0 = time.perf_counter()
        sc = load_path(mxl)
        rec["sec"]["cur_load"] = time.perf_counter() - t0
        rec["nb_sc"] = len(sc.measure_starts)
        rec["nb_m21"] = n
        t0 = time.perf_counter()
        an, first, (corr, conf, flags), ks = C.global_key(sc)
        rec["sec"]["g_cur"] = time.perf_counter() - t0
        rec["g"]["cur_first"] = list(first) if first else None
        rec["g"]["cur_corr"] = list(corr) if corr else None
        rec["g"]["cur_corr_conf"] = conf
        rec["g"]["cur_corr_flags"] = flags
        rec["g"]["cur_ks"] = list(ks) if ks else None
        rec["cur_unknown"] = an.unknown
        t0 = time.perf_counter()
        loc = C.local_windows(sc)
        rec["loc"]["cur_win"] = [list(k) if k else None for k in loc]
        rec["sec"]["l_cur_win"] = time.perf_counter() - t0
        t0 = time.perf_counter()
        areas, home = C.kc_areas(sc, an, loc)
        rec["sec"]["l_cur_areas"] = time.perf_counter() - t0
        rec["cur_areas"] = areas
        if areas is not None:
            for k, v in C.timelines(len(sc.measure_starts), home, areas).items():
                rec["loc"]["cur_areas_" + k] = [list(x) for x in v]
        else:
            rec["cur_areas_unknown"] = "home UNKNOWN" if home is None else f"{len(sc.measure_starts)} bars (< 8)"
    except Exception as e:  # noqa
        rec["err"]["piece"] = repr(e)[:200] + " | " + traceback.format_exc()[-300:]
    return rec


if __name__ == "__main__":
    pieces = json.load(open(HERE / "wir_pieces.json"))["pieces"]
    lim = int(sys.argv[1]) if len(sys.argv) > 1 else None
    if lim:
        pieces = pieces[:lim] if lim > 0 else pieces[lim:]
    t0 = time.time()
    out = []
    with Pool(12, maxtasksperchild=4) as pool:
        for i, r in enumerate(pool.imap(run_piece, pieces)):
            out.append(r)
            print(i, r["dir"][-50:], round(time.time() - t0), r.get("err") and list(r["err"]), flush=True)
    name = "wir_results.json" if not lim else f"wir_results_pilot{lim}.json"
    json.dump(out, open(HERE / name, "w"))
    print("done", round(time.time() - t0))
