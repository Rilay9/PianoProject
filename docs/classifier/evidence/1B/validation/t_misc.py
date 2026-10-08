"""Sections 1, 2, 9, 10 on their named examples (and the near-misses), plus grace notes (9) and the half-diminished
seventh spellings (10)."""
from common import *
import collections, re
import numpy as np
from music21 import converter, clef as m21clef

BLACK = {1, 3, 6, 8, 10}
print("== 1 hands.per-bar-range")
for iid in ["song.classical.albeniz-asturias.pdmx", "song.blues.handful-of-keys", "song.beautiful.mariage-damour.alt2",
            "song.classical.bach-toccata-fugue-bwv565", "exercise.arpeggio.c-major.4oct.both", "exercise.five-finger.c-major.right"]:
    sc = load(BYID[iid])
    n = sc.notes
    p = n["pitch"].astype(int)
    hands = {h: (int(p[sc.hand == h].min()), int(p[sc.hand == h].max())) for h in sorted(set(sc.hand.tolist()))}
    reg = [int((p <= 54).sum()), int(((p >= 55) & (p <= 72)).sum()), int((p >= 73).sum())]
    out88 = [(int(m), h, int(x)) for m, h, x in zip(sc.measure, sc.hand, p) if x < 21 or x > 108]
    print(iid, "compass", int(p.min()), int(p.max()), "hands", hands, "registers low/mid/high", reg, "outside88", out88[:5])

print("== 2 pitch.black-key-share (struck notes, ties merged by partitura, grace included)")
for iid in ["exercise.arpeggio.g-flat-major.2oct.both", "exercise.inversions.e-flat-minor.both", "exercise.five-finger.g-flat-major.right",
            "exercise.open-voicing.e-flat.sus4"]:
    it = BYID.get(iid)
    if not it:
        print("missing", iid); continue
    sc = load(it)
    n = sc.notes
    st = n["staff"]
    res = {}
    for s in sorted(set(st.tolist())):
        ps = n["pitch"][st == s] % 12
        res[int(s)] = (round(float(np.isin(ps, list(BLACK)).mean()), 3), len(ps))
    print(iid, res, "all", round(float(np.isin(n["pitch"] % 12, list(BLACK)).mean()), 3))

print("== 9 pitch.inventory: grace notes")
def inv(it):
    s = converter.parse(str(CONTENT / it["file"]))
    out = {}
    for pi, part in enumerate(s.parts):
        struck, grace = collections.Counter(), collections.Counter()
        for nn in part.recurse().notes:
            if "ChordSymbol" in nn.classes:
                continue
            if nn.duration.isGrace:
                for p in nn.pitches:
                    grace[p.nameWithOctave] += 1
                continue
            if nn.tie is not None and nn.tie.type in ("stop", "continue"):
                continue
            for p in nn.pitches:
                struck[p.nameWithOctave] += 1
        names = set(struck) | set(grace)
        out[pi] = {"distinct": len(names), "distinct_struck": len(struck), "grace_only": sorted(set(grace) - set(struck)), "grace_n": sum(grace.values())}
    return out
graced = []
for it in ITEMS:
    if pipeline(it) == "generated":
        continue
    try:
        r = xml_root(it)
    except Exception:
        continue
    g = sum(1 for _ in r.iter("grace"))
    if g:
        graced.append((it["id"], g))
print("real items with grace notes (raw <grace>):", len(graced))
for iid, g in graced[:6]:
    print(iid, g, inv(BYID[iid]))
for iid in ["exercise.five-finger.c-major.right", "exercise.interval-reading.c-position.left.01", "song.folk.twinkle.rh"]:
    print(iid, inv(BYID[iid]))

print("== 10 reading.enharmonic-spelling")
def spell(it):
    sc = load(it)
    n = sc.notes
    names = collections.Counter(f"{s}{'#' * a if a > 0 else 'b' * -a}" for s, a in zip(n["step"], n["alter"]))
    wk = [(s, a) for s, a in zip(n["step"], n["alter"]) if (s, a) in (("E", 1), ("B", 1), ("C", -1), ("F", -1))]
    dbl = sum(1 for a in n["alter"] if abs(a) == 2)
    two = collections.defaultdict(set)
    for p, s, a in zip(n["pitch"], n["step"], n["alter"]):
        two[int(p)].add((s, int(a)))
    two = {k: v for k, v in two.items() if len(v) > 1}
    return dict(names), len(wk), dbl, two
for iid in ["exercise.tritone-sub.c", "exercise.scale.g-flat-major.1oct.similar.right.2", "exercise.arpeggio7.a-flat-dominant7.2oct.both",
            "exercise.five-finger.c-major.right", "exercise.arpeggio7.a-flat-half-diminished7.2oct.both"]:
    print(iid, spell(BYID[iid]))
print("-- every half-diminished seventh item: is the fifth spelled a letter-fifth above the root?")
L = "CDEFGAB"
for it in ITEMS:
    if "half-diminished" in it["id"] and it["id"].startswith("exercise.arpeggio7"):
        sc = load(it)
        n = sc.notes
        order = np.argsort(n["onset_quarter"], kind="stable")
        root = (n["step"][order[0]], int(n["alter"][order[0]]))
        letters = sorted({(L.index(s) - L.index(root[0])) % 7 for s in n["step"]})
        sp = sorted({f"{s}{'#' * a if a > 0 else 'b' * -a}" for s, a in zip(n["step"], n["alter"])})
        print(it["id"], "root", root, "letter steps above root", letters, sp, "OK" if letters == [0, 2, 4, 6] else "WRONG SPELLING")
