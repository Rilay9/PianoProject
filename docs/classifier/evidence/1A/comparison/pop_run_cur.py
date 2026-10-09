"""POP909 test songs: the current detector (validation/r_melody.py rules, unchanged) and the plain skyline floor.

Output: pop_cur_results.json  {song: {method: {"idx": [note indices predicted melody], "bar_hand": {bar: "R"|"L"|null}, "seconds": s, "rules": {...}}}}
Note indices are positions in <song>.truth.json["notes"]. Methods:
  current        - per bar the validator's rule 1 (guarded) / 2 / 3, else UNKNOWN; predicted melody notes = the highest note per onset of the
                   chosen hand in that bar (rule 1 and 2 both say "the hand's top line").
  skyline_plain  - the highest note at each onset over both staves (no threshold, no filter): the survey's floor.
"""
import sys, time, collections
from cur_melody import *
from mel_common import *

OUT = BUILD / "pop909/scores"


def hand_of_staff(s):
    return "R" if s == 1 else "L"


def top_per_onset(notes, idxs):
    by = {}
    for i in idxs:
        n = notes[i]
        if n["on"] not in by or n["pitch"] > notes[by[n["on"]]]["pitch"]:
            by[n["on"]] = i
    return list(by.values())


def run(song):
    tr = jload(OUT / f"{song}.truth.json")
    notes = tr["notes"]
    nb = tr["bars"]
    res = {}
    # current
    t = time.time()
    o = bars_for_file(f"pop909.{song}", OUT / f"{song}.musicxml")
    dt = time.time() - t
    bh, idx, rules = {}, [], collections.Counter()
    by_bar_staff = collections.defaultdict(list)
    for i, n in enumerate(notes):
        by_bar_staff[(n["on"] // 16, n["staff"])].append(i)
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
                idx += top_per_onset(notes, by_bar_staff.get((b, st), []))
        res["current"] = {"idx": idx, "bar_hand": bh, "seconds": dt, "rules": dict(rules)}
    # plain skyline
    t = time.time()
    idx = top_per_onset(notes, range(len(notes)))
    dt = time.time() - t
    bh = {}
    cnt = collections.defaultdict(collections.Counter)
    for i in idx:
        cnt[notes[i]["on"] // 16][hand_of_staff(notes[i]["staff"])] += 1
    for b in range(nb):
        c = cnt.get(b)
        bh[b] = None if not c else ("R" if c["R"] >= c["L"] else "L")
    res["skyline_plain"] = {"idx": idx, "bar_hand": bh, "seconds": dt}
    return res


if __name__ == "__main__":
    from pop_build import select
    ids, _ = select()
    out = {}
    for s in ids:
        out[s] = run(s)
        print(s, out[s]["current"].get("rules"), flush=True)
    jdump(out, HERE / "pop_cur_results.json")
