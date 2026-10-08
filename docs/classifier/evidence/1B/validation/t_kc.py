"""Section 7 key.change on every real item: the writer's kc.py areas and cadences (window 4, area 4, 8 notes), the
first version (any cadence confirms) and the corrected version (the home-dominant exclusion: an arrival on an area
whose local tonic is the home dominant does not count when, within 2 bars after the arrival, the home tonic triad
sounds or the bass sounds the home leading tone), and the agent trigger (items of at most 32 bars). Writes kc_v.json."""
from common import *
import time, warnings
import numpy as np
from partitura.musicanalysis import estimate_key
import rules.harmony as H

W, L = 4, 4
PC = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]


def ks_key(sub):
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        k = estimate_key(sub)
    minor = k.endswith("m")
    nm = k[:-1] if minor else k
    return ((PC[nm[0]] + nm[1:].count("#") - nm[1:].count("b")) % 12, "minor" if minor else "major")


def relation(home, k):
    d = (k[0] - home[0]) % 12
    if d == 0:
        return "parallel"
    if d == 7:
        return "dominant"
    if d == 5:
        return "subdominant"
    if (home[1] == "major" and d == 9 and k[1] == "minor") or (home[1] == "minor" and d == 3 and k[1] == "major"):
        return "relative"
    return "other"


def sounding_pcs(sc, t0, t1):
    n = sc.notes
    on = n["onset_quarter"].astype(float)
    du = n["duration_quarter"].astype(float)
    sel = (on < t1 - 1e-6) & (on + du > t0 + 1e-6) & (du > 1e-6)
    return {int(p) % 12 for p in n["pitch"][sel]}


def excluded(sc, an, sq, home, t_arr, m_arr, why):
    """Within 2 bars after the arrival (from the arrival's downbeat to the end of bar m_arr + 2): the home tonic triad
    (a timeline chord with the home tonic root and mode, or, without a timeline, a beat whose sounding set holds the
    home tonic triad) or a bass note on the home leading tone."""
    nb = len(sc.measure_starts)
    t_end = sc.measure_starts[m_arr + 3] if m_arr + 3 < nb else an.end
    tri = {home[0], (home[0] + (4 if home[1] == "major" else 3)) % 12, (home[0] + 7) % 12}
    lt = (home[0] + 11) % 12
    hits = []
    if sq:
        for c in sq:
            if t_arr + 1e-6 < c.t0 < t_end and c.root_pc == home[0] and c.triad == ("M" if home[1] == "major" else "m"):
                hits.append(("tonic triad", c.m))
                break
    else:
        for m in range(m_arr, min(nb, m_arr + 3)):
            bl = an.beat_len[m]
            s = sc.measure_starts[m]
            e = sc.measure_starts[m + 1] if m + 1 < nb else an.end
            t = s
            while t < e - 1e-6:
                if t > t_arr + 1e-6 and tri <= sounding_pcs(sc, t, t + bl):
                    hits.append(("tonic triad", m))
                    break
                t += bl
            if hits:
                break
    for x in an.bass:
        if t_arr + 1e-6 < x[0] < t_end and x[2] % 12 == lt:
            hits.append(("bass leading tone", x[3]))
            break
    return hits


out = {}
t0 = time.time()
only = set(sys.argv[1:])
for idx, it in enumerate(ITEMS):
    if pipeline(it) == "generated" or (only and it["id"] not in only):
        continue
    rec = {"p": pipeline(it)}
    try:
        sc = load(it)
        n = sc.notes
        if not len(n):
            continue
        nb = len(sc.measure_starts)
        rec["bars"] = nb
        an = H.analyse(sc)
        home = (an.key.tonic_pc, an.key.mode) if an.key else None
        rec["home"] = [NAMES[home[0]], home[1]] if home else None
        if home is None or nb < 8:
            rec["areas"] = "UNKNOWN"
            out[it["id"]] = rec
            continue
        local = []
        for b in range(nb):
            sel = (sc.measure >= b - 1) & (sc.measure <= b + W - 2)
            local.append(ks_key(n[sel]) if sel.sum() >= 8 else None)
        areas, b = [], 0
        while b < nb:
            k = local[b]
            e = b
            while e + 1 < nb and local[e + 1] == k:
                e += 1
            if k is not None and k != home and e - b + 1 >= L:
                areas.append([b, e, k])
            b = e + 1
        sq = H.seq(an) if not an.unknown else []
        res = []
        on = n["onset_quarter"]
        for a, e, k in areas:
            on_dom = k[0] == (home[0] + 7) % 12
            cads = []
            for x, y in zip(sq, sq[1:]):
                if a - 1 <= y.m <= e + 1 and x.root_pc == (k[0] + 7) % 12 and x.triad == "M" and y.root_pc == k[0] and y.triad == ("M" if k[1] == "major" else "m") and abs(y.beat - 1) < 1e-6:
                    cads.append(("chords", y.m, y.t0))
            if not sq:
                for bb in range(max(1, a - 1), min(nb, e + 2)):
                    t = sc.measure_starts[bb]
                    at = (on <= t + 1e-6) & (on + n["duration_quarter"] > t + 1e-6)
                    if not at.any() or int(n["pitch"][at].min()) % 12 != k[0]:
                        continue
                    before = [x for x in an.bass if x[0] < t - 1e-6]
                    if not before or before[-1][2] % 12 != (k[0] + 7) % 12:
                        continue
                    if ((n["pitch"][sc.measure == bb - 1] % 12) == (k[0] + 11) % 12).any():
                        cads.append(("bass", bb, t))
            first = cads[0] if cads else None
            kept, excl = None, []
            for by, m, t in cads:
                hit = excluded(sc, an, sq, home, t, m, by) if on_dom else []
                if hit:
                    excl.append([by, m, hit])
                else:
                    kept = [by, m]
                    break
            res.append({"bars": [a, e], "key": f"{NAMES[k[0]]} {k[1]}", "relation": relation(home, k),
                        "first_version": [first[0], first[1]] if first else None, "corrected": kept, "excluded": excl,
                        "timeline": bool(sq)})
        rec["areas"] = res
    except Exception as ex:  # noqa
        rec["error"] = repr(ex)[:150]
    out[it["id"]] = rec
    if idx % 200 == 0:
        print(idx, round(time.time() - t0), flush=True)
json.dump(out, open(OUT / ("kc_v_sel.json" if only else "kc_v.json"), "w"), indent=0, default=list)
print("done", round(time.time() - t0))
