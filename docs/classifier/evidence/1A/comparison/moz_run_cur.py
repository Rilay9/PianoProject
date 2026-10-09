"""Mozart movements (moz_build.py): the current detector (validation/r_melody.py rules, unchanged) and the plain skyline floor.
Output: moz_cur_results.json, same layout as pop_cur_results.json (note indices into <name>.truth.json["notes"], bar = score measure index)."""
import sys, time, collections
from cur_melody import *
from mel_common import *
from pop_run_cur import top_per_onset

OUT = BUILD / "mozart"
WIR = BUILD / "when-in-rome/repo/Corpus/Piano_Sonatas/Mozart,_Wolfgang_Amadeus"


def run(name):
    tr = jload(OUT / f"{name}.truth.json")
    notes = tr["notes"]
    nb = tr["bars"]
    k, m = name[1:].split("-")
    path = WIR / f"K{k}" / m / "score.mxl"
    res = {}
    t = time.time()
    o = bars_for_file(f"moz.{name}", path)
    dt = time.time() - t
    by_bar_staff = collections.defaultdict(list)
    for i, n in enumerate(notes):
        by_bar_staff[(n["bar"], n["staff"])].append(i)
    bh, idx, rules = {}, [], collections.Counter()
    if "unknown" in o:
        res["current"] = {"unknown": o["unknown"], "seconds": dt}
    else:
        for b in range(nb):
            x = o.get(b)
            if x is None or str(x[0]).startswith("UNKNOWN"):
                bh[b] = None
                rules["UNKNOWN" if x is None else "UNKNOWN-guard"] += 1
            else:
                bh[b] = x[1]
                rules[x[0]] += 1
                st = 1 if x[1] == "R" else 2
                idx += top_per_onset_f(notes, by_bar_staff.get((b, st), []))
        res["current"] = {"idx": idx, "bar_hand": bh, "seconds": dt, "rules": dict(rules)}
    t = time.time()
    idx = top_per_onset_f(notes, range(len(notes)))
    dt = time.time() - t
    cnt = collections.defaultdict(collections.Counter)
    for i in idx:
        cnt[notes[i]["bar"]]["R" if notes[i]["staff"] == 1 else "L"] += 1
    bh = {}
    for b in range(nb):
        c = cnt.get(b)
        bh[b] = None if not c else ("R" if c["R"] >= c["L"] else "L")
    res["skyline_plain"] = {"idx": idx, "bar_hand": bh, "seconds": dt}
    return res


def top_per_onset_f(notes, idxs):
    by = {}
    for i in idxs:
        n = notes[i]
        key = round(n["on"], 4)
        if key not in by or n["pitch"] > notes[by[key]]["pitch"]:
            by[key] = i
    return list(by.values())


if __name__ == "__main__":
    names = sorted(p.name[:-len(".truth.json")] for p in OUT.glob("*.truth.json"))
    out = {}
    for nm in names:
        try:
            out[nm] = run(nm)
            print(nm, out[nm]["current"].get("rules"), flush=True)
        except Exception as e:
            print(nm, "FAILED", type(e).__name__, e, flush=True)
    jdump(out, HERE / "moz_cur_results.json")
