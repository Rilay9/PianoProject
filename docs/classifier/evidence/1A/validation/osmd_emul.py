"""An emulation of OSMD 2.1.2 checkAccidental as read in the minified source, to test that reading against the render."""
import sys, json, collections, subprocess
from common import *
from walk import HERE
from osmd_compare import to_xml


def osmd_model(w):
    """Returns Counter of (m, staff, t, step, octave, shown)."""
    out = collections.Counter()
    groups = collections.defaultdict(list)
    for n in w["notes"]:
        if n["rest"] or n["step"] is None or n["grace"]:
            continue
        groups[(n["part"], n["staff"], n["m"])].append(n)
    for (part, staff, m), ns in groups.items():
        ns = sorted(ns, key=lambda n: (n["t"], n["voice"]))
        fifths = key_at(w, part, staff, w["measures"][part][m][0])
        sig = sig_alters(fifths)
        rec, lst = {}, set()
        for n in ns:
            pos = (n["step"], n["octave"])
            if sig[n["step"]] != 0:
                rec.setdefault(pos, sig[n["step"]])
        for n in ns:
            pos = (n["step"], n["octave"])
            alter = int(round(n["alter"]))
            shown = False
            if n["tie_stop"]:
                out[(m, staff, round(float(n["t"]), 3), n["step"], n["octave"], False)] += 1
                continue
            enum_none = alter == 0 and n["acc"] != "natural"
            a = pos in lst
            sigp = sig[n["step"]] if sig[n["step"]] != 0 else None
            if pos in rec:
                if a:
                    lst.discard(pos)
                if rec[pos] != alter:
                    if sigp is not None and sigp != alter:
                        lst.add(pos); rec[pos] = alter
                    elif not enum_none:
                        if sigp is not None:
                            rec[pos] = sigp
                        else:
                            del rec[pos]
                    else:
                        rec[pos] = alter
                    shown = True
                else:
                    shown = bool(n["acc"]) and not a
            else:
                if not enum_none:
                    if not a:
                        lst.add(pos)
                    rec[pos] = alter
                    shown = True
                else:
                    if a:
                        shown = True; lst.discard(pos)
            out[(m, staff, round(float(n["t"]), 3), n["step"], n["octave"], shown)] += 1
    return out


def run(i):
    w = cache(i)
    if len(w["parts"]) != 1:
        return None
    mine = osmd_model(w)
    p = subprocess.run(["node", "osmd_acc.cjs", str(to_xml(i))], capture_output=True, text=True, timeout=900, cwd=HERE)
    if p.returncode != 0:
        return {"error": p.stderr[-200:]}
    osmd = collections.Counter()
    for r in json.loads(p.stdout):
        key = r["note"].split(",")[0].replace("Key: ", "")
        octv = int(r["note"].split("octave: ")[1]) + 3
        osmd[(r["m"], r["staff"], round(r["t"], 3), key[0], octv, r["drawn"] not in (None, "NONE"))] += 1
    both = mine & osmd
    return {"agree": sum(both.values()), "mine_only": sum((mine - osmd).values()), "osmd_only": sum((osmd - mine).values()),
            "shown_agree": sum(v for k, v in both.items() if k[5]), "ex": [k for k in (mine - osmd)][:3]}


if __name__ == "__main__":
    import random
    ids = sys.argv[1:]
    if ids and ids[0] == "sample":
        random.seed(int(ids[1]) if len(ids) > 1 else 7)
        gen = [i for i in BYID if pipeline(i) == "generated"]
        pd = [i for i in BYID if pipeline(i) == "pdmx"]
        ot = [i for i in BYID if pipeline(i) == "other"]
        ids = random.sample(gen, 12) + random.sample(pd, 12) + random.sample(ot, 6)
    tot = collections.Counter()
    for i in ids:
        r = run(i)
        print(i, json.dumps(r))
        if r and "error" not in r:
            for k in ("agree", "mine_only", "osmd_only", "shown_agree"):
                tot[k] += r[k]
    print("TOTAL", dict(tot))
