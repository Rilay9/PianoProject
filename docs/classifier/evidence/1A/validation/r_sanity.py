"""integrity.notation-sanity (26): spelling filter (2), test 2b, beaming (3)."""
import sys, json, warnings, collections
from pathlib import Path
from fractions import Fraction as F
warnings.simplefilter("ignore")
WT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(WT / "tools/classifier"))
import score as S
from common import *
from walk import HERE
from music21 import pitch as m21p, interval as m21i

DIAT = {}


def diatonic(step, alter, fifths):
    return sig_alters(fifths)[step] == alter


def spelling(i):
    from partitura.musicanalysis import estimate_spelling
    sc = S.load(BYID[i], content=HERE)
    n = sc.notes
    est = estimate_spelling(n)
    cands = []
    differ = 0
    for k in range(len(n)):
        ws, wa = str(n["step"][k]), int(n["alter"][k])
        es, ea = str(est["step"][k]), int(est["alter"][k])
        if (ws, wa) == (es, ea):
            continue
        differ += 1
        f = int(n["ks_fifths"][k])
        if diatonic(es, ea, f) and not diatonic(ws, wa, f):
            cands.append((int(sc.measure[k]), f"{ws}{wa:+d}", f"{es}{ea:+d}"))
    return {"ps13_differs": differ, "candidates": len(cands), "ex": cands[:6]}


def test2b(w):
    hits = []
    by = collections.defaultdict(list)
    for n in w["notes"]:
        if struck(n) and not n["grace"] and not n["chord"]:
            by[(n["part"], n["staff"], n["voice"])].append(n)
    for k, ns in by.items():
        ns = sorted(ns, key=lambda n: n["t"])
        for a, b in zip(ns, ns[1:]):
            pa = m21p.Pitch(a["step"] + {1: "#", -1: "-", 2: "##", -2: "--"}.get(int(a["alter"]), "") + str(a["octave"]))
            pb = m21p.Pitch(b["step"] + {1: "#", -1: "-", 2: "##", -2: "--"}.get(int(b["alter"]), "") + str(b["octave"]))
            iv = m21i.Interval(pa, pb)
            if iv.specifier not in (m21i.Specifier.AUGMENTED, m21i.Specifier.DIMINISHED) or iv.semitones == 0:
                continue
            ok = False
            for x, y in ((pa, pb), (pb, pa)):
                for e in x.getAllCommonEnharmonics(1):
                    i2 = m21i.Interval(e, y) if x is pa else m21i.Interval(y, e)
                    if i2.specifier in (m21i.Specifier.PERFECT, m21i.Specifier.MAJOR, m21i.Specifier.MINOR):
                        ok = True
            if ok:
                hits.append((a["m"], pa.nameWithOctave, pb.nameWithOctave, iv.niceName))
    return {"count": len(hits), "ex": hits[:5]}


def beaming(w):
    """Kind 3 with the page's simple-metre table and dotted beats for compound metres."""
    cands = []
    ts = sorted(w["times"], key=lambda x: x["t"])
    def unit_at(t):
        cur = ("4", "4")
        for x in ts:
            if x["part"] == 0 and x["t"] <= t:
                cur = (x["beats"], x["bt"])
        b, bt = int(cur[0].split("+")[0]), int(cur[1])
        bar = F(4 * b, bt)
        if b in (6, 9, 12) and bt in (4, 8, 16):
            return F(3 * 4, bt)
        if (b, bt) in ((2, 4), (3, 4), (3, 8), (2, 8)):
            return bar
        if (b, bt) in ((4, 4), (2, 2), (4, 8)):
            return bar / 2
        if (b, bt) == (3, 2):
            return F(2)
        return None
    groups = {}
    for n in sorted(w["notes"], key=lambda n: (n["part"], n["t"])):
        for num, typ in n["beams"]:
            if num != "1":
                continue
            k = (n["part"], n["voice"])
            if typ == "begin":
                groups[k] = [n]
            elif k in groups:
                groups[k].append(n)
                if typ == "end":
                    g = groups.pop(k)
                    u = unit_at(g[0]["t"])
                    if u is None:
                        continue
                    ms = w["measures"][g[0]["part"]][g[0]["m"]]
                    if g[0]["m"] != g[-1]["m"]:
                        cands.append((g[0]["m"], "across barline")); continue
                    off0 = g[0]["t"] - ms[0]; off1 = g[-1]["t"] - ms[0]
                    if int(off0 // u) != int(off1 // u):
                        cands.append((g[0]["m"], f"crosses unit {float(u)}"))
    return {"count": len(cands), "ex": cands[:5]}


if __name__ == "__main__":
    which = sys.argv[1]
    for i in sys.argv[2:]:
        if which == "spell":
            r = spelling(i)
        elif which == "2b":
            r = test2b(cache(i))
        else:
            r = beaming(cache(i))
        print(i, "=>", json.dumps(r, default=str))
