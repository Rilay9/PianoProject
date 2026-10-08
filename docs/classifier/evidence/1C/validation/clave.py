"""clave.py ID ... : rhythm.clave-alignment as the page states it: in-phase non-overlapping cycles from the first readable
bar, notation (sixteenth cycle of 4 quarters or eighth cycle of 8 quarters) chosen by the better average fit; per cycle
of 3+ onsets, each clave scored matches minus extras in each direction; direction of the best, neutral on a tie."""
import sys, json, warnings
from collections import Counter
from fractions import Fraction as F
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import load
warnings.simplefilter("ignore")
from rules import rhythm as R
CL = {k: v for k, v in R.CLAVES.items()}
CL["bossa-2-3"] = frozenset((p + 8) % 16 for p in CL["bossa"])
DIR = {k: ("3-2" if (k.endswith("3-2") or k == "bossa") else "2-3") for k in CL}


def cycles(b, h, span):
    ms = b.bars_in(R.CLAVE_METRES)
    if not ms:
        return []
    out = []; m = ms[0]; have = set(ms)
    while m in have:
        bars, tot, k = [], F(0), m
        while tot < span and k in have and b.metre[k] == b.metre[m]:
            bars.append(k); tot += b.length[k]; k += 1
        if tot != span:
            m = k if k > m else m + 1
            continue
        unit = span / 16; pulses = set(); ok = True; off = F(0)
        for x in bars:
            for o in b.onsets[h].get(x, {}):
                p = (off + o) / unit
                if p.denominator != 1:
                    ok = False
                pulses.add(int(p))
            off += b.length[x]
        out.append((bars, frozenset(pulses) if ok else None))
        m = k
    return out


def score(p):
    s = {k: len(p & v) - len(p - v) for k, v in CL.items()}
    best = max(s.values())
    dirs = {DIR[k] for k, v in s.items() if v == best}
    return best, (dirs.pop() if len(dirs) == 1 else "neutral")


for iid in sys.argv[1:]:
    b = R.Bars(load(iid))
    res = {}
    for h in "RL":
        best = None
        for span in (F(4), F(8)):
            cs = [(bars, p) for bars, p in cycles(b, h, span) if p is not None and len(p) >= 3]
            if not cs:
                continue
            fit = sum(score(p)[0] for _, p in cs) / len(cs)
            if best is None or fit > best[0]:
                best = (fit, span, cs)
        if best:
            res[h] = {"notation": "16ths" if best[1] == 4 else "8ths", "fit": round(float(best[0]), 2),
                      "directions": dict(Counter(score(p)[1] for _, p in best[2]))}
    print(iid, json.dumps(res))
