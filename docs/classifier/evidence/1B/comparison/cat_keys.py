"""key.tonic-mode on the catalogue: every item that validation/t_keys.py gives a reference key (generated: the recipe's
keySig; real: the title's key, six titles corrected), run with the current detector (first version = H.analyse key;
corrected = keyfix.infer_key2), partitura estimate_key, and music21 Krumhansl-Schmuckler, Aarden-Essen, Bellman-Budge,
Temperley-Kostka-Payne. Writes cat_keys_results.json. The reference rule is t_keys.py's own (its source above the line
`only = set(sys.argv[1:])` is executed unchanged).

Usage: python cat_keys.py [limit]
"""
from cmp_common import *
from multiprocessing import Pool

_src = (VALID / "t_keys.py").read_text(encoding="utf-8").split("\nonly = set(sys.argv[1:])\n", 1)[0]
_ns = {"__name__": "t_keys_funcs"}
_saved = sys.argv
sys.argv = ["t_keys_funcs"]
exec(compile(_src, str(VALID / "t_keys.py"), "exec"), _ns)
sys.argv = _saved
reference, ITEMS, load, pipeline, fam = _ns["reference"], _ns["ITEMS"], _ns["load"], _ns["pipeline"], _ns["fam"]


def run_item(idx):
    from music21 import converter
    import cur_detector as C
    it = ITEMS[idx]
    ref = reference(it)
    rec = {"id": it["id"], "p": pipeline(it), "fam": fam(it), "ref": ref, "g": {}, "sec": {}, "err": {}}
    try:
        sc = load(it)
        if not len(sc.notes):
            rec["err"]["piece"] = "no notes"
            return rec
        rec["bars"] = len(sc.measure_starts)
        t = time.perf_counter()
        an, first, (corr, conf, flags), ks = C.global_key(sc)
        rec["sec"]["cur"] = time.perf_counter() - t
        rec["g"]["cur_first"] = list(first) if first else None
        rec["g"]["cur_corr"] = list(corr) if corr else None
        rec["g"]["cur_corr_conf"] = conf
        rec["g"]["cur_corr_flags"] = flags
        rec["g"]["cur_ks"] = list(ks) if ks else None
        t = time.perf_counter()
        s = converter.parse(str(CONTENT / it["file"]))
        rec["sec"]["m21_parse"] = time.perf_counter() - t
        for tag, ident in (("KS", "krumhansl"), ("AE", "aarden"), ("BB", "bellman"), ("TKP", "temperley")):
            t = time.perf_counter()
            try:
                rec["g"]["m21_" + tag] = m21_key(s.analyze(ident))
            except Exception as e:  # noqa
                rec["g"]["m21_" + tag] = None
                rec["err"][tag] = repr(e)[:100]
            rec["sec"]["m21_" + tag] = time.perf_counter() - t
    except Exception as e:  # noqa
        rec["err"]["piece"] = repr(e)[:200]
    return rec


if __name__ == "__main__":
    idxs = [i for i, it in enumerate(ITEMS) if reference(it) is not None]
    lim = int(sys.argv[1]) if len(sys.argv) > 1 else None
    if lim:
        idxs = idxs[::max(1, len(idxs) // lim)][:lim]
    print("items with a reference", len(idxs), flush=True)
    t0 = time.time()
    out = []
    with Pool(12, maxtasksperchild=50) as pool:
        for i, r in enumerate(pool.imap(run_item, idxs, chunksize=4)):
            out.append(r)
            if i % 100 == 0:
                print(i, round(time.time() - t0), flush=True)
    json.dump(out, open(HERE / ("cat_keys_results.json" if not lim else f"cat_keys_pilot{lim}.json"), "w"))
    print("done", round(time.time() - t0))
