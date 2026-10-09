"""Single-process timing of the scale.collection methods on 40 items spread over the catalogue (the other timings were taken with 12
worker processes at once). Writes scale_timing.json. Usage: python -X utf8 scale_timing.py"""
from scale_run import *
import scale_run as SR
import statistics

idxs = [i for i, it in enumerate(ITEMS) if not (pipeline(it) == "generated" and fam(it) not in GEN_FAMS)]
pick = idxs[::max(1, len(idxs) // 40)][:40]
rows = []
for i in pick:
    it = ITEMS[i]
    try:
        if one_line_staff(it):
            continue
        t = time.perf_counter(); sc = load(it); t_read = time.perf_counter() - t
        t = time.perf_counter(); an = H.analyse(sc); t_key = time.perf_counter() - t
        S = frozenset(int(x) % 12 for x in sc.notes["pitch"])
        T = an.key.tonic_pc if an.key else None
        t = time.perf_counter(); item_name(S, T); t_cur = time.perf_counter() - t
        spell, t_parse = spelling_of(it)
        SR._m21_cache.clear()
        t = time.perf_counter(); m21_cands(S, spell); t_m21 = time.perf_counter() - t
        rows.append({"id": it["id"], "read": t_read, "key": t_key, "cur_naming": t_cur, "m21_parse": t_parse, "m21_deriveRanked": t_m21})
    except Exception as ex:  # noqa
        print("error", it["id"], repr(ex)[:100])
json.dump(rows, open(HERE / "scale_timing.json", "w"), indent=0)
def st(k):
    x = [r[k] for r in rows]
    return f"{statistics.mean(x)*1000:.1f} / {statistics.median(x)*1000:.1f} / {max(x)*1000:.1f}"
LAB = {"read": "project score reader (partitura)", "key": "key detection (`H.analyse`, whole analysis)", "cur_naming": "current detector, naming only (`item_name`)",
       "m21_parse": "music21 `converter.parse` (to get the score's spelling)", "m21_deriveRanked": "music21 `deriveRanked`, 13 scale classes, 12 results each"}
out = [f"**Runtime per item, one process, {len(rows)} items spread over the catalogue (milliseconds: mean / median / max).** Measured on this machine, nothing else running from this script.\n", "| step | ms per item |", "| --- | --- |"]
out += [f"| {LAB[k]} | {st(k)} |" for k in LAB]
(HERE / "frag_scale_timing.md").write_text("\n".join(out), encoding="utf-8")
print("\n".join(out))
