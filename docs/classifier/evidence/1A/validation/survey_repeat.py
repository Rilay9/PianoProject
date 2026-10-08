import collections, sys
from common import *
from r_repeat import unroll, structure, m21_played

res = collections.Counter(); dis = []; jumps = []
for i in BYID:
    w = cache(i)
    S, words = structure(w)
    has = any(s["fwd"] or s["bwd"] or s["end_start"] or s["segno"] or s["coda"] for s in S.values()) or words
    if not has:
        continue
    p = pipeline(i)
    u = unroll(w)["played"]; u2 = unroll(w, True)["played"]
    try:
        mp, rex = m21_played(i)
    except Exception:
        mp, rex = None, 0
    jw = bool(words)
    if mp is None:
        res[(p, "jump" if jw else "nojump", "m21 cannot")] += 1
    elif mp == u:
        res[(p, "jump" if jw else "nojump", "agree")] += 1
    else:
        res[(p, "jump" if jw else "nojump", "disagree")] += 1
        dis.append((i, u, u2, mp, n_measures(w), [t[:20] for _, t in words][:3]))
for k in sorted(res):
    print(k, res[k])
for d in dis:
    print(" ", d)
