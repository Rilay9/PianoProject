"""
Technique figures, measured from the notes (docs/classifier/rules/texture.md, the technique
section, holds each definition, its reason, the positives, the near-misses and UNKNOWN).

Reads the same per-hand view as rules/texture.py (`texture.view`): onset events per hand,
grace notes left out. Values are `{"present", "bars", "share", "hands"}` plus counts, with
`where` the 0-based bars; provenance exact.
"""
from __future__ import annotations

import collections

import numpy as np

import score as S
from score import Result, measures
from rules.texture import EPS, Ev, View, arpeggio_segments, view

#: A five-finger position spans a fifth: seven semitones from thumb to fifth finger. The same
#: number as app/src/demands/detect.ts POSITION_SPAN (one definition per fact; see texture.md).
POSITION_SPAN = 7

#: A scale run is longer than one hand position holds: six notes or more in one direction
#: need a crossing or a shift (texture.md, technique.scale-run).
RUN_NOTES = 6

#: The widest frame a hand holds without moving (thumb to fifth finger stretched): an octave.
OCTAVE = 12


def _value(v: View, bars_by_hand: dict, present: bool, **extra) -> Result:
    allbars = sorted({b for bs in bars_by_hand.values() for b in bs})
    value = {"present": present, "bars": len(allbars), "share": round(len(allbars) / max(1, v.n_bars), 3),
             "hands": sorted(h for h, bs in bars_by_hand.items() if bs)}
    value.update(extra)
    return Result(value=value, provenance="exact", where=allbars)


# --------------------------------------------------------------------------- scale runs
def _step(a: Ev, b: Ev, k: int = 0) -> int:
    """+1 or -1 when voice k moves by a step from a to b (a diatonic second, spelled as one,
    of one to three semitones; or a chromatic semitone on one letter), else 0."""
    ds = b.pitches[k] - a.pitches[k]
    dl = b.letters[k] - a.letters[k]
    if ds == 0:
        return 0
    sign = 1 if ds > 0 else -1
    if (abs(dl) == 1 and (dl > 0) == (ds > 0) and 1 <= abs(ds) <= 3) or (dl == 0 and abs(ds) == 1):
        return sign
    return 0


def _gap(a: Ev, b: Ev) -> int:
    """+1 or -1 for a minor third written as a third: the gap step of a pentatonic or blues
    scale (A-C, E-G), else 0."""
    ds = b.pitches[0] - a.pitches[0]
    if abs(ds) == 3 and b.letters[0] - a.letters[0] == (2 if ds > 0 else -2):
        return 1 if ds > 0 else -1
    return 0


DOUBLE = {"thirds": (3, 4), "sixths": (8, 9), "octaves": (12,)}


def scale_runs(v: View, hand: str) -> list[tuple[int, int, str]]:
    """(first index, last index, kind) of every run of at least RUN_NOTES events moving by
    step in one direction: single notes (kind diatonic, chromatic, or gapped when a pentatonic
    or blues scale's minor-third steps occur, never two in a row and never more than half the
    steps), or two-note events a third, a sixth or an octave apart with both voices stepping
    together (kind thirds, sixths, octaves)."""
    evs = v.hands[hand]
    out = []
    i = 0
    while i < len(evs) - 1:
        a = evs[i]
        kind = None
        if a.single:
            kind = "single"
        elif len(a.pitches) == 2:
            kind = next((k for k, ivs in DOUBLE.items() if a.pitches[1] - a.pitches[0] in ivs), None)
        if kind is None:
            i += 1
            continue
        j, direction, gaps, last_gap = i, 0, 0, False
        while j + 1 < len(evs):
            b, c = evs[j], evs[j + 1]
            g = False
            if kind == "single":
                if not c.single:
                    break
                s = _step(b, c)
                if s == 0:
                    s = _gap(b, c)
                    g = s != 0
                    if g and last_gap:
                        break  # two thirds in a row is an arpeggio, not a scale
            else:
                if len(c.pitches) != 2 or (c.pitches[1] - c.pitches[0]) not in DOUBLE[kind]:
                    break
                s0, s1 = _step(b, c, 0), _step(b, c, 1)
                s = s0 if s0 == s1 else 0
            if s == 0 or (direction and s != direction):
                break
            direction, j, last_gap = s, j + 1, g
            gaps += g
        while gaps and 2 * gaps > (j - i):  # trim until the thirds are at most half the steps
            gaps -= _gap(evs[j - 1], evs[j]) != 0
            j -= 1
        if j - i + 1 >= RUN_NOTES:
            if kind == "single":
                semis = {abs(evs[k + 1].low - evs[k].low) for k in range(i, j)}
                kind = "gapped" if gaps else ("chromatic" if semis == {1} else "diatonic")
            out.append((i, j, kind))
            i = j
        else:
            i += 1
    return out


@measures("technique.scale-run")
def scale_run(sc: S.Score) -> Result:
    v = view(sc)
    if v.unknown:
        return Result.unknown_because(v.unknown)
    bars, runs, longest, kinds = {}, 0, 0, set()
    for h, evs in v.hands.items():
        b = set()
        for i, j, kind in scale_runs(v, h):
            runs += 1
            longest = max(longest, j - i + 1)
            kinds.add(kind)
            b.update(e.bar for e in evs[i:j + 1])
        bars[h] = sorted(b)
    return _value(v, bars, runs > 0, runs=runs, longest=longest, kinds=sorted(kinds))


# --------------------------------------------------------------------------- arpeggio runs
@measures("technique.arpeggio-run")
def arpeggio_run(sc: S.Score) -> Result:
    v = view(sc)
    if v.unknown:
        return Result.unknown_because(v.unknown)
    bars, runs, widest = {}, 0, 0
    for h, evs in v.hands.items():
        b = set()
        for i, j, span in arpeggio_segments(v, h):
            if span >= 24:
                runs += 1
                widest = max(widest, span)
                b.update(e.bar for e in evs[i:j + 1])
        bars[h] = sorted(b)
    return _value(v, bars, runs > 0, runs=runs, widest=widest)


# --------------------------------------------------------------------------- finger independence
@measures("technique.finger-independence")
def finger_independence(sc: S.Score) -> Result:
    """A note held in one hand while that hand plays at least two other notes of two different
    pitches, each starting after the held note starts and before it ends."""
    v = view(sc)
    if v.unknown:
        return Result.unknown_because(v.unknown)
    bars, count = {}, 0
    for h, a in v.notes.items():
        on, end, pitch, bar = a["onset"], a["end"], a["pitch"], a["bar"]
        b = set()
        for k in range(len(on)):
            lo = np.searchsorted(on, on[k] + EPS, side="right")
            hi = np.searchsorted(on, end[k] - EPS, side="left")
            if hi - lo < 2:
                continue
            movers = pitch[lo:hi]
            moving = movers[movers != pitch[k]]
            if len(moving) >= 2 and len(set(moving.tolist())) >= 2:
                count += 1
                b.update(bar[lo:hi][pitch[lo:hi] != pitch[k]].tolist())
        bars[h] = sorted(b)
    return _value(v, bars, count > 0, held=count)


# --------------------------------------------------------------------------- positions
def positions(v: View, hand: str) -> list[tuple[int, int, int]]:
    """The fewest five-finger positions the hand needs, in order: (first event index, low,
    high). Greedy is optimal here: a position is a run of events whose combined range is at
    most POSITION_SPAN, and any part of a feasible run is feasible. An event wider than a
    position (an octave, a wide chord) is a position of its own; the same shape again stays in
    it."""
    evs = v.hands[hand]
    out = []
    lo = hi = None
    for i, e in enumerate(evs):
        if lo is None:
            lo, hi = e.low, e.high
            out.append([i, lo, hi])
            continue
        nlo, nhi = min(lo, e.low), max(hi, e.high)
        if nhi - nlo <= POSITION_SPAN or (e.low >= lo and e.high <= hi):
            lo, hi = nlo, nhi
            out[-1][1:] = [lo, hi]
        elif (len(out) >= 2 and out[-2][1] <= e.low and e.high <= out[-2][2]
              and max(out[-2][2], hi) - min(out[-2][1], lo) <= OCTAVE):
            # back to the position before, within an octave of it: the hand alternates in one
            # stretched frame (a broken octave, a tremolo), it does not travel
            prev = out.pop()
            lo, hi = min(out[-1][1], prev[1]), max(out[-1][2], prev[2])
            out[-1][1:] = [lo, hi]
        else:
            lo, hi = e.low, e.high
            out.append([i, lo, hi])
    return [tuple(x) for x in out]


@measures("technique.five-finger")
def five_finger(sc: S.Score) -> Result:
    """Present when every hand stays in one five-finger position for the whole item (the
    negation of detect.ts beyondPosition); bars counts the bars in which every hand that plays
    fits one position."""
    v = view(sc)
    if v.unknown:
        return Result.unknown_because(v.unknown)
    span = {h: int(a["pitch"].max() - a["pitch"].min()) for h, a in v.notes.items() if len(a["pitch"])}
    present = all(s <= POSITION_SPAN for s in span.values())
    inbar = []
    for m in range(v.n_bars):
        ok, played = True, False
        for h, a in v.notes.items():
            p = a["pitch"][a["bar"] == m]
            if len(p):
                played = True
                ok &= int(p.max() - p.min()) <= POSITION_SPAN
        if played and ok:
            inbar.append(m)
    return _value(v, {h: inbar for h in span}, present, span=span)


@measures("technique.position-shift")
def position_shift(sc: S.Score) -> Result:
    v = view(sc)
    if v.unknown:
        return Result.unknown_because(v.unknown)
    bars, shifts, largest = {}, {}, 0
    for h, evs in v.hands.items():
        ps = positions(v, h)
        shifts[h] = len(ps) - 1
        bars[h] = sorted({evs[i].bar for i, _, _ in ps[1:]})
        for (_, l0, h0), (_, l1, h1) in zip(ps, ps[1:]):
            largest = max(largest, int(round(abs((l1 + h1) / 2 - (l0 + h0) / 2))))
    total = sum(shifts.values())
    return _value(v, bars, total > 0, shifts=shifts, largest=largest)
