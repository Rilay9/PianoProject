"""The flag definitions of the spelling comparison (functions only; sp_run.py, sp_inject.py and sp_named.py call them).

Flag kinds (per piece):
  ps13_diff    a note whose written (step, alter) differs from partitura estimate_spelling (PS13).
  kind2        the current detector's spelling filter (rule 26, kind 2, first test): PS13 differs AND PS13's spelling is diatonic to
               the key signature in force AND the written spelling is not.   [r_sanity.spelling, replicated; sp_check_repro.py]
  pks_diff     the same for PKSpell's tonal pitch class.
  pks_gate     PKSpell with the same diatonic gate as kind2.
  both_diff    PS13 and PKSpell give the same spelling and it differs from the written one (the survey's "flagged by both").
  both_gate    both_diff with the diatonic gate.
  t2b          the current detector's test 2b, every hit (r_sanity.test2b, executed from source, untruncated).
  t2b_fix      test 2b with the fix (v1), defined before it was run on the published scores (see FIX below).
  t2b_fix2     fix v2 = v1 plus (c): a diminished unison (the same letter written with and without an accidental, descending), added after
               the chromatic D scale's remaining flags showed the descending steps arrive as diminished unisons; the published-score rates
               of v1 had been read by then, so v2 is reported next to v1, not instead of it.

FIX (named here, designed from the validation row's three false-flag families, so those three are not evidence for it; the
published-score rates are): a 2b hit is cleared when
  (a) the interval is an augmented unison (the same letter name written with and without an accidental: the ordinary chromatic
      step of a chromatic run), or
  (b) both written notes belong to the key signature in force read as major or its relative minor in any of its three forms:
      on the line of fifths with f = the signature (sharps positive), the major scale is f-1 .. f+5, the raised sixth of the
      relative minor is f+6 and its raised seventh f+8.
"""
from cmp_common import *
import numpy as np
from music21 import pitch as m21p, interval as m21i
from common import struck                                            # validation/common.py (walk helpers)

LOF_STEP = {"F": -1, "C": 0, "G": 1, "D": 2, "A": 3, "E": 4, "B": 5}


def lof(step, alter):
    return LOF_STEP[step] + 7 * int(alter)


def lof_arr(step, alter):
    base = np.array([LOF_STEP[str(s)] for s in step])
    return base + 7 * np.asarray(alter).astype(int)


def diat_arr(step, alter, f):
    l = lof_arr(step, alter)
    f = np.asarray(f).astype(int)
    return (l >= f - 1) & (l <= f + 5)


def pks_arrays(tpc):
    steps, alters = [], []
    for t in tpc:
        s, a = parse_tpc(t)
        steps.append(s); alters.append(a)
    return np.array(steps), np.array(alters)


def written(notes):
    return notes["step"].astype(str), notes["alter"].astype(int)


def masks(notes, est_ps13, pks_step=None, pks_alter=None):
    """Boolean masks over the note table for every note-level flag kind."""
    ws, wa = written(notes)
    f = notes["ks_fifths"].astype(int)
    es, ea = est_ps13["step"].astype(str), est_ps13["alter"].astype(int)
    out = {}
    ps13_diff = (ws != es) | (wa != ea)
    out["ps13_diff"] = ps13_diff
    w_dia = diat_arr(ws, wa, f)
    out["kind2"] = ps13_diff & diat_arr(es, ea, f) & ~w_dia
    if pks_step is not None:
        pks_diff = (ws != pks_step) | (wa != pks_alter)
        out["pks_diff"] = pks_diff
        out["pks_gate"] = pks_diff & diat_arr(pks_step, pks_alter, f) & ~w_dia
        agree = (es == pks_step) & (ea == pks_alter)
        out["both_diff"] = ps13_diff & agree
        out["both_gate"] = out["both_diff"] & diat_arr(es, ea, f) & ~w_dia
    return out


# ----------------------------------------------------------------------------- test 2b, untruncated, with the fix
_ALT = {1: "#", -1: "-", 2: "##", -2: "--"}


def _key_f(w, part, t):
    f = 0
    for k in sorted([k for k in w["keys"] if k["part"] == part and k["t"] <= t], key=lambda k: k["t"]):
        try:
            f = int(k["fifths"])
        except (TypeError, ValueError):
            pass
    return f


def t2b_hits(w):
    """r_sanity.test2b's loop, copied with every hit kept and the fix's verdict added. Returns list of dicts
    {m, a, b, iv, part, t, cleared: None | 'aug-unison' | 'key-scale'}. The count of hits equals r_sanity.test2b's count
    (sp_check_repro.py asserts it on every piece it is run on)."""
    import collections
    hits = []
    by = collections.defaultdict(list)
    for n in w["notes"]:
        if struck(n) and not n["grace"] and not n["chord"]:
            by[(n["part"], n["staff"], n["voice"])].append(n)
    for k, ns in by.items():
        ns = sorted(ns, key=lambda n: n["t"])
        for a, b in zip(ns, ns[1:]):
            pa = m21p.Pitch(a["step"] + _ALT.get(int(a["alter"]), "") + str(a["octave"]))
            pb = m21p.Pitch(b["step"] + _ALT.get(int(b["alter"]), "") + str(b["octave"]))
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
                cleared = None
                if iv.generic.undirected == 1 and iv.specifier == m21i.Specifier.AUGMENTED:
                    cleared = "aug-unison"
                else:
                    f = _key_f(w, a["part"], a["t"])
                    la, lb = lof(a["step"], a["alter"]), lof(b["step"], b["alter"])
                    al = lambda l: (f - 1 <= l <= f + 5) or l in (f + 6, f + 8)
                    if al(la) and al(lb):
                        cleared = "key-scale"
                    elif iv.generic.undirected == 1:
                        cleared = "dim-unison"
                hits.append({"m": a["m"], "a": pa.nameWithOctave, "b": pb.nameWithOctave, "iv": iv.niceName,
                             "part": a["part"], "t": float(a["t"]), "cleared": cleared})
    return hits


def n_struck(w):
    return sum(1 for n in w["notes"] if struck(n) and not n["grace"] and not n["chord"])
