"""
The relations between the two hands' streams (docs/classifier/characteristics.yaml, area coordination): how often they
strike together, whether their rhythms differ, how fast each moves, where they hold and move, and how their
registers meet. Every one needs both hands: a score with notes in one hand only is UNKNOWN, never zero.

Counted from the note array by hand (one hand rule, `score.load`); the articulation conflict also reads
music21's marks. The statistics are exact given the notes; none judges whether a passage is hard.
"""
from __future__ import annotations

import collections

import numpy as np

import score as S
from . import _common as C
from .technique import crossings
from .texture import _held_groups

EPS = C.EPS
NEED_BOTH = "only one hand has notes"


def _sounding_other(h: C.Hand, t: float) -> bool:
    """Does the hand have a note that began before t and is still sounding at t?"""
    return bool(((h.on < t - EPS) & (h.end > t + EPS)).any())


@C.direct("coordination.synchrony-share")
def coordination_synchrony_share(sc: S.Score) -> S.Result:
    """Of the moments when either hand strikes, the share where both strike together (`together`), only one strikes
    while the other still sounds a note it struck earlier (`offset`), and only one strikes while the other is
    silent (`alone`). `events` is the number of moments; the shares are fractions of it."""
    hs = C.two_hands(sc)
    if hs is None:
        return C.unknown(NEED_BOTH)
    R, L = hs
    times = np.union1d(R.gon, L.gon)
    inr = np.isin(times, R.gon)
    inl = np.isin(times, L.gon)
    together = int((inr & inl).sum())
    offset = alone = 0
    for t, r_on, l_on in zip(times, inr, inl):
        if r_on and l_on:
            continue
        other = L if r_on else R
        if _sounding_other(other, float(t)):
            offset += 1
        else:
            alone += 1
    n = len(times)
    return C.res({"events": n, "together": together, "offset": offset, "alone": alone,
                  "together_share": round(together / n, 4), "offset_share": round(offset / n, 4),
                  "alone_share": round(alone / n, 4)})


def _bar_onsets(sc: S.Score, h: C.Hand) -> dict[int, set[float]]:
    out: dict[int, set[float]] = collections.defaultdict(set)
    starts = sc.measure_starts
    for t, m in zip(h.on, h.meas):
        out[int(m)].add(round(float(t) - starts[int(m)], 4))
    return out


@C.direct("coordination.rhythmic-independence")
def coordination_rhythmic_independence(sc: S.Score) -> S.Result:
    """Bars in which the hands' rhythms differ. A hand's rhythm in a bar is the set of positions (quarters from the bar
    line) at which it strikes; two hands in unison or in block chords have equal sets. Compared are bars where both
    hands strike at least once: `bars_compared`, of which `bars_differ` have unequal sets (`share` the
    fraction). `bars_one_handed` are bars where only one hand strikes (a held note or a rest in the other
    counts as not striking). Durations are not compared (a held note against moving notes is
    coordination.sustain-vs-move). `where` lists the bars that differ."""
    hs = C.two_hands(sc)
    if hs is None:
        return C.unknown(NEED_BOTH)
    R, L = hs
    ro, lo = _bar_onsets(sc, R), _bar_onsets(sc, L)
    both = sorted(set(ro) & set(lo))
    differ = [m for m in both if ro[m] != lo[m]]
    one = len(set(ro) ^ set(lo))
    return C.res({"bars_compared": len(both), "bars_differ": len(differ),
                  "share": round(len(differ) / len(both), 4) if both else 0.0, "bars_one_handed": one}, where=differ)


@C.direct("coordination.unequal-rates")
def coordination_unequal_rates(sc: S.Score) -> S.Result:
    """How unevenly the hands move: in each bar where both strike, the number of times each hand strikes (a chord is
    one strike) and the ratio of the larger to the smaller. `bars_compared`; `bars_unequal` (ratio above 1);
    `bars_double` (ratio of 2 or more); `mean_ratio` and `max_ratio`; `faster_R` / `faster_L` / `equal` count
    the bars by which hand strikes more. `where` lists the bars at which that relation changes from the last
    compared bar."""
    hs = C.two_hands(sc)
    if hs is None:
        return C.unknown(NEED_BOTH)
    R, L = hs
    ro, lo = _bar_onsets(sc, R), _bar_onsets(sc, L)
    both = sorted(set(ro) & set(lo))
    ratios, rel, where = [], [], []
    c = collections.Counter()
    last = None
    for m in both:
        a, b = len(ro[m]), len(lo[m])
        ratios.append(max(a, b) / min(a, b))
        r = "equal" if a == b else ("faster_R" if a > b else "faster_L")
        c[r] += 1
        if last is not None and r != last:
            where.append(m)
        last = r
    if not both:
        return C.res({"bars_compared": 0, "bars_unequal": 0, "bars_double": 0, "mean_ratio": 0.0, "max_ratio": 0.0,
                      "faster_R": 0, "faster_L": 0, "equal": 0})
    arr = np.array(ratios)
    return C.res({"bars_compared": len(both), "bars_unequal": int((arr > 1 + 1e-9).sum()), "bars_double": int((arr >= 2 - 1e-9).sum()),
                  "mean_ratio": round(float(arr.mean()), 4), "max_ratio": round(float(arr.max()), 4),
                  "faster_R": c["faster_R"], "faster_L": c["faster_L"], "equal": c["equal"]}, where=where)


@C.direct("coordination.articulation-conflict")
def coordination_articulation_conflict(sc: S.Score) -> S.Result:
    """Different articulations at once, from music21's marks. `legato_vs_staccato`: a moment where one hand strikes a
    staccato (staccato, staccatissimo, spiccato) note while the other hand is under a slur or strikes a tenuto
    note. `accent_one_hand`: a moment where both hands strike and exactly one of them carries an accent. `count`
    is their sum; each moment counts once per kind. A slur covers from its first note's onset to its last note's
    end. Needs both hands."""
    if C.two_hands(sc) is None:
        return C.unknown(NEED_BOTH)
    notes, _ = C.m21_notes(sc)
    slurs = C.m21_slurs(sc)
    by = {h: collections.defaultdict(list) for h in ("R", "L")}
    for n in notes:
        if not n.rest:
            by[n.hand][round(n.on, 4)].append(n)
    lv = set()
    ac = set()
    for h, other in (("R", "L"), ("L", "R")):
        for t, ns in by[h].items():
            if any(n.short for n in ns):
                slurred = any(sh == other and a - EPS <= t < b - EPS for sh, a, b in slurs)
                tenuto = any(n.tenuto for n in by[other].get(t, []))
                if slurred or tenuto:
                    lv.add(t)
    for t in set(by["R"]) & set(by["L"]):
        r = any(n.accent for n in by["R"][t])
        l = any(n.accent for n in by["L"][t])
        if r != l:
            ac.add(t)
    where = {C.measure_of(sc, t) for t in lv | ac}
    return C.res({"count": len(lv) + len(ac), "legato_vs_staccato": len(lv), "accent_one_hand": len(ac)},
                 provenance="one-witness", where=where)


@C.direct("coordination.register-overlap")
def coordination_register_overlap(sc: S.Score) -> S.Result:
    """Whether the hands share a register. In each bar where both strike, each hand's range is its lowest to highest
    struck pitch; the overlap is the semitones the two ranges share (0 when apart). `bars_compared`,
    `bars_overlap` (overlap above 0), `mean_overlap` and `max_overlap` in semitones. `crossing_passages` and
    `crossing_moments` are technique.hand-crossing's (the left hand's sounding notes entirely above the
    right's lowest and highest). `where` lists the bars whose ranges overlap."""
    hs = C.two_hands(sc)
    if hs is None:
        return C.unknown(NEED_BOTH)
    R, L = hs

    def ranges(h):
        out = {}
        for m in np.unique(h.meas):
            p = h.pitch[h.meas == m]
            out[int(m)] = (int(p.min()), int(p.max()))
        return out
    rr, lr = ranges(R), ranges(L)
    both = sorted(set(rr) & set(lr))
    ov = []
    for m in both:
        a, b = rr[m], lr[m]
        ov.append(max(0, min(a[1], b[1]) - max(a[0], b[0])))
    cx = crossings(sc)
    arr = np.array(ov) if ov else np.array([0])
    return C.res({"bars_compared": len(both), "bars_overlap": int((arr > 0).sum()), "mean_overlap": round(float(arr.mean()), 3),
                  "max_overlap": int(arr.max()), "crossing_passages": cx["passages"], "crossing_moments": cx["moments"]},
                 where=[m for m, o in zip(both, ov) if o > 0])


@C.direct("coordination.sustain-vs-move")
def coordination_sustain_vs_move(sc: S.Score) -> S.Result:
    """One hand holds while the other moves: a note of at least a quarter note in one hand with at least one note of the
    other hand beginning strictly inside it. `count` is the number of onset groups holding, `notes` the notes,
    `by_hand_holding` splits by the holding hand. The same-hand case is texture.held-under-moving. Needs both
    hands."""
    hs = C.two_hands(sc)
    if hs is None:
        return C.unknown(NEED_BOTH)
    R, L = hs
    where, notes, groups, by = set(), 0, 0, {}
    for h, other in ((R, L), (L, R)):
        held = set(_held_groups(h, other))
        gk = {int(np.searchsorted(h.gon, h.on[i])) for i in held}
        notes += len(held)
        groups += len(gk)
        by[h.name] = len(gk)
        where |= {int(h.meas[i]) for i in held}
    return C.res({"count": groups, "notes": notes, "by_hand_holding": by}, where=where)
