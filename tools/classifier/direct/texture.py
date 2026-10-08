"""
How the notes are laid out between and within the hands (docs/classifier/characteristics.yaml, area texture).

All of it is read from the note array (`score.load`) by hand, with a hand's *onset group* being the notes the
hand strikes at one time (voices of a staff pooled). Definitions are operational and stated in each docstring; none
is a musical judgment: the texture is what the notes do, not what the passage is called.
"""
from __future__ import annotations

import collections

import numpy as np

import score as S
from . import _common as C

EPS = C.EPS


def _groups(h: C.Hand) -> list[tuple[float, np.ndarray, slice]]:
    """(onset, distinct sorted pitches, slice into the hand's arrays) for each onset group."""
    out = []
    for k in range(len(h.gstart)):
        sl = h.group(k)
        out.append((float(h.gon[k]), np.unique(h.pitch[sl]), sl))
    return out


def _need_notes(sc: S.Score):
    s = C.streams(sc)
    return s


def _by_hand_value(counts: dict[str, int], hands) -> dict[str, int]:
    return {h: counts.get(h, 0) for h in ("R", "L") if h in hands}


# --------------------------------------------------------------------------- chords
@C.direct("texture.block-chords")
def texture_block_chords(sc: S.Score) -> S.Result:
    """Chords struck together: onset groups of three or more distinct pitches in one hand. `count` is the number
    of such groups, `by_hand` splits it, `max_simultaneous` is the most pitches struck at once per hand (a
    dyad is not a block chord: see texture.double-notes)."""
    s = C.streams(sc)
    if not s:
        return S.Result.unknown_because("no notes")
    counts, mx, where = collections.Counter(), {}, set()
    for hn, h in s.items():
        mx[hn] = 0
        for t, ps, sl in _groups(h):
            mx[hn] = max(mx[hn], len(ps))
            if len(ps) >= 3:
                counts[hn] += 1
                where.add(int(h.meas[sl.start]))
    return C.res(value={"count": sum(counts.values()), "by_hand": _by_hand_value(counts, s), "max_simultaneous": mx},
                    provenance="exact", where=sorted(where))


def _held_groups(h: C.Hand, other: C.Hand | None = None):
    """Yield (note index) for each note of `h` that sounds for at least a quarter note while `other` (default: h itself)
    begins at least one more note strictly inside its duration."""
    target = other if other is not None else h
    gon = target.gon
    for i in range(h.n):
        if h.end[i] - h.on[i] < 1.0 - EPS:
            continue
        lo = np.searchsorted(gon, h.on[i] + EPS, side="right")
        hi = np.searchsorted(gon, h.end[i] - EPS, side="left")
        if hi - lo >= 1:
            yield i


@C.direct("texture.held-under-moving")
def texture_held_under_moving(sc: S.Score) -> S.Result:
    """A note or chord held while other notes begin in the same hand: within one hand, a note that sounds for at least a
    quarter note and has another note of that hand begin strictly inside it (two voices, a held note under a
    moving line). `count` is the number of onset groups containing such a held note, `notes` the notes. Held
    against the other hand is coordination.sustain-vs-move."""
    s = C.streams(sc)
    if not s:
        return S.Result.unknown_because("no notes")
    groups, notes, where, by_hand = 0, 0, set(), {}
    for hn, h in s.items():
        held = set(_held_groups(h))
        notes += len(held)
        gk = {int(np.searchsorted(h.gon, h.on[i])) for i in held}
        groups += len(gk)
        by_hand[hn] = len(gk)
        where |= {int(h.meas[i]) for i in held}
    return C.res(value={"count": groups, "notes": notes, "by_hand": by_hand}, provenance="exact", where=sorted(where))


@C.direct("texture.sustained")
def texture_sustained(sc: S.Score) -> S.Result:
    """Chords held a bar or more: onset groups of three or more distinct pitches in one hand, every note of which
    lasts at least one full bar of its time signature (ties are one note in the array). `dyads` counts the same for
    groups of two pitches and `single_notes` for one; `by_hand` splits `count`."""
    s = C.streams(sc)
    if not s:
        return S.Result.unknown_because("no notes")
    cnt, by_hand, dy, single, where = 0, collections.Counter(), 0, 0, set()
    for hn, h in s.items():
        for t, ps, sl in _groups(h):
            dur = h.end[sl] - h.on[sl]
            if (dur >= h.bar_q[sl] - EPS).all():
                if len(ps) >= 3:
                    cnt += 1
                    by_hand[hn] += 1
                    where.add(int(h.meas[sl.start]))
                elif len(ps) == 2:
                    dy += 1
                else:
                    single += 1
    return C.res(value={"count": cnt, "by_hand": _by_hand_value(by_hand, s), "dyads": dy, "single_notes": single},
                    provenance="exact", where=sorted(where))


# --------------------------------------------------------------------------- intervals inside a hand
def _runs(flags: list[bool], minlen: int) -> list[tuple[int, int]]:
    out, i = [], 0
    while i < len(flags):
        if flags[i]:
            j = i
            while j + 1 < len(flags) and flags[j + 1]:
                j += 1
            if j - i + 1 >= minlen:
                out.append((i, j))
            i = j + 1
        else:
            i += 1
    return out


@C.direct("texture.octaves")
def texture_octaves(sc: S.Score) -> S.Result:
    """Octaves in a hand. `simultaneous` counts onset groups of exactly two distinct pitches twelve semitones apart;
    `octave_runs` counts runs of three or more such groups on consecutive onsets (melody in octaves);
    `broken_runs` counts runs of three or more consecutive single-note onsets each exactly an octave from the
    last (a broken octave, C3 C4 C3). `count` is `simultaneous + broken_runs`, the number of octave figures."""
    s = C.streams(sc)
    if not s:
        return S.Result.unknown_because("no notes")
    sim, oruns, bruns, where, by_hand = 0, 0, 0, set(), collections.Counter()
    for hn, h in s.items():
        gs = _groups(h)
        octv = [len(ps) == 2 and ps[1] - ps[0] == 12 for _, ps, _ in gs]
        sim += sum(octv)
        by_hand[hn] += sum(octv)
        for i, k in enumerate(octv):
            if k:
                where.add(int(h.meas[gs[i][2].start]))
        oruns += len(_runs(octv, 3))
        single = [len(ps) == 1 for _, ps, _ in gs]
        leap12 = [False] * len(gs)  # leap12[i]: group i is a single note an octave from single note i-1
        for i in range(1, len(gs)):
            leap12[i] = single[i] and single[i - 1] and abs(int(gs[i][1][0]) - int(gs[i - 1][1][0])) == 12
        for a, b in _runs(leap12, 2):
            bruns += 1
            by_hand[hn] += 1
            where.add(int(h.meas[gs[a][2].start]))
    return C.res(value={"count": sim + bruns, "simultaneous": sim, "octave_runs": oruns, "broken_runs": bruns,
                           "by_hand": _by_hand_value(by_hand, s)}, provenance="exact", where=sorted(where))


@C.direct("texture.double-notes")
def texture_double_notes(sc: S.Score) -> S.Result:
    """Double notes: onset groups of exactly two distinct pitches a generic third or sixth apart (by the spelling, so
    an augmented second is not a third), the interval of any quality. `thirds` and `sixths` split `count`;
    `moving` is the number of such groups that sit in a run of two or more on consecutive onsets of the same
    hand, `runs` the number of runs."""
    s = C.streams(sc)
    if not s:
        return S.Result.unknown_because("no notes")
    th, sx, moving, runs, where, by_hand = 0, 0, 0, 0, set(), collections.Counter()
    for hn, h in s.items():
        flags = []
        for t, ps, sl in _groups(h):
            seg_p = h.pitch[sl]
            if len(ps) == 2:
                lo = sl.start + int(np.argmin(seg_p))
                hi = sl.start + int(np.argmax(seg_p))
                g = int(h.dia[hi] - h.dia[lo])
                if g == 2:
                    th += 1
                elif g == 5:
                    sx += 1
                flags.append(g in (2, 5))
                if g in (2, 5):
                    by_hand[hn] += 1
                    where.add(int(h.meas[sl.start]))
            else:
                flags.append(False)
        r = _runs(flags, 2)
        runs += len(r)
        moving += sum(b - a + 1 for a, b in r)
    return C.res(value={"count": th + sx, "thirds": th, "sixths": sx, "moving": moving, "runs": runs,
                           "by_hand": _by_hand_value(by_hand, s)}, provenance="exact", where=sorted(where))


@C.direct("texture.power-chord")
def texture_power_chord(sc: S.Score) -> S.Result:
    """Root-and-fifth chords: onset groups whose notes use exactly two pitch classes, the upper a perfect fifth (seven
    semitones) above the lowest note, which is the root; octave doublings of either are allowed (C3 G3, C3 G3 C4)."""
    s = C.streams(sc)
    if not s:
        return S.Result.unknown_because("no notes")
    cnt, where, by_hand = 0, set(), collections.Counter()
    for hn, h in s.items():
        for t, ps, sl in _groups(h):
            pcs = {int(p) % 12 for p in ps}
            low = int(ps[0])
            if len(pcs) == 2 and pcs == {low % 12, (low + 7) % 12}:
                cnt += 1
                by_hand[hn] += 1
                where.add(int(h.meas[sl.start]))
    return C.res(value={"count": cnt, "by_hand": _by_hand_value(by_hand, s)}, provenance="exact", where=sorted(where))


# --------------------------------------------------------------------------- between the hands
@C.direct("texture.motion")
def texture_motion(sc: S.Score) -> S.Result:
    """Motion between the hands at consecutive moments when both strike. The line of each hand is its outer voice: the
    highest note of the right hand and the lowest note of the left. Comparing each joint onset with the
    previous one: `contrary` (the lines move in opposite directions), `parallel` (the same direction and the same
    number of letter-name steps, so the interval between them keeps its size), `similar` (the same direction,
    unequal steps), `oblique` (one line moves, the other stays), `static` (neither). Needs both hands."""
    hs = C.two_hands(sc)
    if hs is None:
        return S.Result.unknown_because("only one hand has notes")
    R, L = hs
    joint = np.intersect1d(R.gon, L.gon)
    c = collections.Counter()
    prev = None
    where = set()
    for t in joint:
        rk = int(np.searchsorted(R.gon, t))
        lk = int(np.searchsorted(L.gon, t))
        rs, ls = R.group(rk), L.group(lk)
        ri = rs.start + int(np.argmax(R.pitch[rs]))
        li = ls.start + int(np.argmin(L.pitch[ls]))
        cur = (R.pitch[ri], L.pitch[li], R.dia[ri], L.dia[li], int(R.meas[ri]))
        if prev is not None:
            dr, dl = int(cur[0] - prev[0]), int(cur[1] - prev[1])
            if dr == 0 and dl == 0:
                c["static"] += 1
            elif dr == 0 or dl == 0:
                c["oblique"] += 1
            elif (dr > 0) != (dl > 0):
                c["contrary"] += 1
                where.add(cur[4])
            elif int(cur[2] - prev[2]) == int(cur[3] - prev[3]):
                c["parallel"] += 1
            else:
                c["similar"] += 1
        prev = cur
    pairs = sum(c.values())
    return C.res(value={"pairs": pairs, "joint_onsets": int(len(joint)), **{k: c.get(k, 0) for k in
                           ("contrary", "parallel", "similar", "oblique", "static")}},
                    provenance="exact", where=sorted(where))


@C.direct("texture.alternating-hands")
def texture_alternating_hands(sc: S.Score) -> S.Result:
    """Hands in turn: over the moments when either hand strikes, a *turn* is a moment when only one hand strikes
    followed by a moment when only the other does. `count` is the number of turns, `moments` the strikes
    in total, `share` turns over (moments - 1), `longest_chain` the most turns in an unbroken chain. Needs both
    hands."""
    hs = C.two_hands(sc)
    if hs is None:
        return S.Result.unknown_because("only one hand has notes")
    R, L = hs
    times = np.union1d(R.gon, L.gon)
    inr = np.isin(times, R.gon)
    inl = np.isin(times, L.gon)
    label = np.where(inr & inl, "B", np.where(inr, "R", "L"))
    turns, chain, best, where = 0, 0, 0, set()
    for i in range(1, len(times)):
        if label[i] != "B" and label[i - 1] != "B" and label[i] != label[i - 1]:
            turns += 1
            chain += 1
            best = max(best, chain)
            where.add(C.measure_of(sc, float(times[i])))
        else:
            chain = 0
    return C.res(value={"count": turns, "moments": int(len(times)), "share": round(turns / max(1, len(times) - 1), 4),
                           "longest_chain": best}, provenance="exact", where=sorted(where))


@C.direct("texture.polyrhythm")
def texture_polyrhythm(sc: S.Score) -> S.Result:
    """Cross-rhythm between the hands: a tuplet in one hand (music21 tuplets, grouped from the tuplet's own length: three
    eighths in the time of two make one group) in whose span the other hand strikes a note that the tuplet hand
    does not (the hands divide the span differently: 3 against 2, 2 against 3 ...). `ratios` counts the
    cases as `n:m`, n the tuplet hand's strikes in the span and m the other hand's. `against_single` counts tuplet groups
    where the other hand strikes only at the group's start (3 against 1) and is not part of `count`. A
    tuplet in both hands with the same ratio on the same span is not a cross-rhythm. Needs both hands."""
    if C.two_hands(sc) is None:
        return S.Result.unknown_because("only one hand has notes")
    notes, _ = C.m21_notes(sc)
    by_hand = {h: [n for n in notes if n.hand == h] for h in ("R", "L")}
    count, single, ratios, where = 0, 0, collections.Counter(), set()
    for hn, other in (("R", "L"), ("L", "R")):
        mine = sorted(by_hand[hn], key=lambda n: n.on)
        o_on = np.array(sorted({n.on for n in by_hand[other] if not n.rest}))
        o_tup = [(n.on, n.end, n.tuplet) for n in by_hand[other] if n.tuplet]
        i = 0
        while i < len(mine):
            n = mine[i]
            if n.tuplet is None:
                i += 1
                continue
            ratio, total = n.tuplet[:2], n.tuplet[2]
            j, span_end = i, n.on
            grp = []
            while j < len(mine) and mine[j].tuplet and mine[j].tuplet[:2] == ratio and mine[j].on < n.on + total - EPS:
                grp.append(mine[j])
                span_end = mine[j].end
                j += 1
            i = max(j, i + 1)
            t0, t1 = n.on, n.on + total
            mine_on = {g.on for g in grp if not g.rest}
            if len(mine_on) < 2:
                continue
            if any(a < t1 - EPS and b > t0 + EPS and tp[:2] == ratio for a, b, tp in o_tup):
                continue
            inside = o_on[(o_on >= t0 - EPS) & (o_on < t1 - EPS)]
            if len(inside) == 0:
                continue
            off_grid = [x for x in inside if not any(abs(x - m) < EPS for m in mine_on)]
            if off_grid:
                count += 1
                ratios[f"{len(mine_on)}:{len(inside)}"] += 1
                where.add(C.measure_of(sc, t0))
            elif len(inside) == 1 and abs(inside[0] - t0) < EPS:
                single += 1
    return C.res(value={"count": count, "ratios": dict(sorted(ratios.items())), "against_single": single},
                    provenance="one-witness", where=sorted(where))
