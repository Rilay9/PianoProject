"""key.tonic-mode as corrected on area-1B.md section 5: the ending chord (chord over the last bar, else the whole last
bar's pitch-class set holding a triad, else the last beat holding a triad, else the lowest note of the last bar), the
dominant-seventh ending (vote a fifth below when the root is no candidate and the root a fifth below is), and the
flags b, c, d, f. Voting copied from rules/harmony.py infer_key, unchanged."""
import warnings
import numpy as np
import rules.harmony as H
from rules.texture import TRIADS

MAJ, MIN = (0, 4, 7), (0, 3, 7)


def triad_of(pcs, bass_pc):
    """(root, 'M'|'m', has_minor_seventh) of the one major or minor triad the set holds; with several, the one whose
    root is the bass; else None."""
    s = frozenset(pcs)
    cands = []
    for r in range(12):
        for q, iv in (("M", MAJ), ("m", MIN)):
            if frozenset((r + i) % 12 for i in iv) <= s:
                cands.append((r, q))
    if not cands:
        return None
    if len(cands) > 1:
        b = [c for c in cands if c[0] == bass_pc]
        if len(b) != 1:
            return "ambiguous"
        cands = b
    r, q = cands[0]
    return r, q, (r + 10) % 12 in s


def sounding(sc, t0, t1):
    n = sc.notes
    on = n["onset_quarter"].astype(float)
    du = n["duration_quarter"].astype(float)
    sel = (on < t1 - 1e-6) & (on + du > t0 + 1e-6) & (du > 1e-6)
    return n["pitch"][sel].astype(int)


def ending(sc, an):
    """(chord tuple (root, quality, seventh) or None, source, lowest pc)."""
    end = an.end
    final = an.chords[-1] if an.chords and an.chords[-1].t1 >= end - 1e-6 else None
    if final is None and an.source == "notes" and an.chords and an.chords[-1].m == len(sc.measure_starts) - 1:
        final = an.chords[-1]
    if final is not None and final.src == "notes" and final.triad == "m":
        w = H._weights(sc, final.t0, final.t1, 1.0)
        if w[(final.root_pc + 10) % 12] > 1e-9:
            final = None
    if an.unknown is not None:
        final = None  # analyse calls infer_key(sc, None, None) when the timeline is UNKNOWN
    if final is not None and final.triad in ("M", "m"):
        return (final.root_pc, final.triad, final.seventh == "7" and final.triad == "M"), "chord", None
    if final is not None:
        return None, "chord-other", None
    last = len(sc.measure_starts) - 1
    t0 = sc.measure_starts[last]
    ps = sounding(sc, t0, max(end, t0 + 1e-3))
    if len(ps):
        tr = triad_of({int(p) % 12 for p in ps}, int(ps.min()) % 12)
        if tr and tr != "ambiguous":
            return tr, "bar", None
    # the last beat holding a triad, searching backwards
    for m in range(last, -1, -1):
        bl = an.beat_len[m] if m < len(an.beat_len) else 1.0
        s = sc.measure_starts[m]
        e = sc.measure_starts[m + 1] if m + 1 < len(sc.measure_starts) else end
        t = e
        while t > s + 1e-6:
            a = max(s, t - bl)
            ps = sounding(sc, a, t)
            if len(ps):
                tr = triad_of({int(p) % 12 for p in ps}, int(ps.min()) % 12)
                if tr and tr != "ambiguous":
                    return tr, "beat", None
            t = a
    ps = sounding(sc, t0, max(end, t0 + 1e-3))
    if not len(ps):
        on = sc.notes["onset_quarter"]
        ps = sc.notes["pitch"][on == on.max()]
    return None, "lowest", int(ps.min()) % 12


def infer_key2(sc, an):
    from partitura.musicanalysis import estimate_key
    n = sc.notes
    order = np.argsort(n["onset_quarter"], kind="stable")
    fifths = int(n["ks_fifths"][order[0]])
    maj = H._fifths_tonic(fifths)
    mnr = (maj + 9) % 12
    pair = {(maj, "major"), (mnr, "minor")}
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            ks = estimate_key(n)
        ks_minor = ks.endswith("m")
        name = ks[:-1] if ks_minor else ks
        ks_key = (H.pc_of(name[0], name[1:].count("#") - name[1:].count("b")), "minor" if ks_minor else "major")
    except Exception:  # noqa
        ks_key = None
    first = an.chords[0] if (an.chords and an.unknown is None) else None

    def chord_key(ch):
        if ch.triad == "M":
            return (ch.root_pc, "major")
        if ch.triad == "m":
            return (ch.root_pc, "minor")
        return None

    def bass_key(pc):
        return (maj, "major") if pc == maj else (mnr, "minor") if pc == mnr else None

    tri, src, low = ending(sc, an)
    flags = []
    if tri is not None:
        r, q, sev = tri
        cand_roots = {maj, mnr}
        if q == "M" and sev and r not in cand_roots and (r - 7) % 12 in cand_roots:
            k = (r - 7) % 12
            end = (k, "major" if k == maj else "minor")
            flags.append("f")
        else:
            end = (r, "major" if q == "M" else "minor")
        end_w = 2
    else:
        end = bass_key(low) if low is not None else None
        on = n["onset_quarter"]
        last = on == on.max()
        end_w = 2 if len(set(sc.hand.tolist())) < 2 or (sc.hand[last] == "L").any() else 1
    on = n["onset_quarter"]
    beg = chord_key(first) if first is not None else bass_key(int(n["pitch"][on == on.min()].min()) % 12)
    votes = {}
    for k, w in ((end, end_w), (beg, 1), (ks_key, 1)):
        if k is not None:
            votes[k] = votes.get(k, 0) + w
    # flag c: the opening and ending votes are the two keys of the signature
    if end in pair and beg in pair and end != beg:
        flags.append("c")
    # flag d: modal candidate (ending tonic in the signature's scale, neither candidate, not a V7 ending)
    if end is not None and "f" not in flags and end not in pair and end[0] in {(maj + i) % 12 for i in (0, 2, 4, 5, 7, 9, 11)} and end[0] not in (maj, mnr):
        flags.append("d")
    inside = sorted(((v, k) for k, v in votes.items() if k in pair), reverse=True)
    res = None
    if inside and inside[0][0] >= 2 and (len(inside) == 1 or inside[0][0] > inside[1][0]):
        v, k = inside[0]
        agree = [nm for nm, kk in (("ending", end), ("opening", beg), ("K-S", ks_key)) if kk == k]
        conf = {4: 0.95, 3: 0.9 if "ending" in agree else 0.85, 2: 0.8 if "ending" not in agree else 0.7}[v]
        res = (k[0], k[1], conf)
    elif len(inside) == 1 and inside[0][0] == 1 and not any(k in pair for k in votes if k != inside[0][1]):
        k = inside[0][1]
        res = (k[0], k[1], 0.6)
    elif end is not None and end == ks_key and end not in pair:
        res = (end[0], end[1], 0.7)
    if res is None:
        flags.append("a")
    return res, {"ending": end, "src": src, "tri": tri, "opening": beg, "ks": ks_key, "fifths": fifths}, flags
