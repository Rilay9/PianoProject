"""
What the hands must physically do (docs/classifier/characteristics.yaml, area technique): how fast, how wide, how far
they jump, whether they cross. The proving run found the old difficulty features ambiguous on three points; each is
settled here, in the docstring of the function it governs:

- *Which line through chords.* A hand's notes are grouped by onset (the notes it strikes at one time, voices of a
  staff pooled). Reach (span) is read from every note the hand must cover at once; a leap is read from one line
  per hand, its outer voice (right hand: the highest note of each group; left hand: the lowest).
- *Which hand for a one-staff file.* The hand rule of `score.load`: a single staff takes the catalogue's declared
  hand (`hands: left` is the left hand, anything else the right), as the app does.
- *The tempo's beat unit.* The written tempo in quarter notes a minute, as `app/src/score/tempoFromXml.ts` reads
  it: a metronome mark's per-minute number times its beat unit's length in quarters (dots included), a
  `<sound tempo>` taken as already in quarters; a tempo the file does not state is UNKNOWN (the catalogue tag
  `tempo-defaulted`), never the app's default of 100.
"""
from __future__ import annotations

import collections
import sys

import numpy as np

import score as S
from . import _common as C

EPS = C.EPS
_ROOT = str(S.ROOT)
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)


# --------------------------------------------------------------------------- the tempo
def tempo_map(sc: S.Score):
    """[(quarter offset, quarter notes a minute)] in score order, the first at the opening, or None when the file
    states no tempo (or the catalogue tags it `tempo-defaulted`).

    Reads music21's metronome marks with the project's own normalisation (`tools.content.difficulty`: the app's
    beat-unit and dot rule read through music21, and its opening rule: the first readable mark opens the piece
    only where no note sounds before it). Later readable marks are tempo changes at their offsets."""
    def make():
        if "tempo-defaulted" in (sc.item.get("tags") or []):
            return None
        from music21 import tempo as m21tempo
        from tools.content import difficulty as D
        root = C.m21(sc)
        marks = []
        for order, mk in enumerate(root.recurse().getElementsByClass(m21tempo.MetronomeMark)):
            bpm = D._quarter_bpm(mk)
            q = C.m21_offset(mk, root)
            if bpm is not None and q is not None:
                marks.append((q, order, bpm))
        if not marks:
            return None
        marks.sort()
        opening = D.opening_quarter_bpm(root)
        if opening == D.DEFAULT_BPM and abs(marks[0][2] - D.DEFAULT_BPM) > 1e-9:
            return None  # a note sounded before the first mark: the piece opens at the default, which is not stated
        events = [(0.0, float(opening))]
        for q, _, bpm in marks:
            if q > EPS and (abs(bpm - events[-1][1]) > 1e-9):
                events.append((float(q), float(bpm)))
        return events
    return C.cached(sc, "tempo_map", make)


def seconds_between(events, a: float, b: float) -> float:
    """Seconds from quarter offset a to b under the tempo map."""
    if b <= a:
        return 0.0
    total, t = 0.0, a
    for i, (q, bpm) in enumerate(events):
        nxt = events[i + 1][0] if i + 1 < len(events) else np.inf
        if nxt <= t:
            continue
        seg_end = min(b, nxt)
        if seg_end > t:
            total += (seg_end - t) * 60.0 / bpm
            t = seg_end
        if t >= b:
            break
    return total


@C.direct("technique.velocity")
def technique_velocity(sc: S.Score) -> S.Result:
    """How fast the hands strike at the written tempo. Strikes are onset groups (a chord is one strike); a note
    counts in `notes_per_second` once per pitch. `strikes_per_second` is over the whole piece (first onset to last
    note's end) for `R`, `L` and `both` (union of onset times); `peak_strikes_per_second` is the highest of any
    bar (strikes in the bar over the bar's seconds). The tempo is the file's written tempo in quarter notes a
    minute under every tempo change (`tempo_map`); UNKNOWN where the file states none. `tempo_qpm` is the
    opening tempo. `where` lists the bars at the overall peak."""
    ev = tempo_map(sc)
    if ev is None:
        return C.unknown("the file states no tempo (tempo-defaulted)")
    s = C.streams(sc)
    if not s:
        return C.unknown("no notes")
    first = min(float(h.on.min()) for h in s.values())
    last = max(float(h.end.max()) for h in s.values())
    secs = seconds_between(ev, first, last)
    if secs <= 0:
        return C.unknown("no duration")
    starts = list(sc.measure_starts) + [max(last, sc.measure_starts[-1] if sc.measure_starts else last)]
    per_hand = {hn: int(len(h.gon)) for hn, h in s.items()}
    union = np.unique(np.concatenate([h.gon for h in s.values()]))
    per_hand["both"] = int(len(union))
    rate = {k: round(v / secs, 4) for k, v in per_hand.items()}

    def bar_rates(times):
        out = {}
        for m in range(len(starts) - 1):
            a, b = starts[m], starts[m + 1]
            if b - a <= EPS:
                continue
            n = int(((times >= a - EPS) & (times < b - EPS)).sum())
            if n:
                out[m] = n / max(seconds_between(ev, a, b), 1e-9)
        return out
    peak = {}
    where = []
    for hn, h in s.items():
        r = bar_rates(h.gon)
        peak[hn] = round(max(r.values()), 4) if r else 0.0
    r = bar_rates(union)
    peak["both"] = round(max(r.values()), 4) if r else 0.0
    if r:
        top = max(r.values())
        where = [m for m, v in r.items() if abs(v - top) < 1e-9]
    return C.res({"tempo_qpm": ev[0][1], "tempo_changes": len(ev) - 1, "seconds": round(secs, 3),
                  "strikes_per_second": rate, "peak_strikes_per_second": peak,
                  "notes_per_second": round(int(C.timed_mask(sc).sum()) / secs, 4)}, where=where)


# --------------------------------------------------------------------------- reach and leaps
def extent(h: C.Hand, times) -> tuple[np.ndarray, np.ndarray]:
    """Lowest and highest pitch sounding in the hand at each time (nan where none sounds)."""
    lo = np.full(len(times), np.nan)
    hi = np.full(len(times), np.nan)
    for i, t in enumerate(times):
        p = int(np.searchsorted(h.on, t + EPS, side="right"))
        live = np.nonzero(h.end[:p] > t + EPS)[0]
        if len(live):
            ps = h.pitch[live]
            lo[i], hi[i] = ps.min(), ps.max()
    return lo, hi


@C.direct("technique.span")
def technique_span(sc: S.Score) -> S.Result:
    """The widest reach each hand must cover at once, in semitones. `max_struck_span`: the largest distance between
    the lowest and highest note struck together at one time. `max_sounding_span`: the same over every note the hand
    must have down at a time it strikes (the struck notes plus any it is still holding), which is the reach
    the fingers meet. Per hand; a hand with one note at a time has span 0. `where` lists the bars of the
    largest sounding span."""
    s = C.streams(sc)
    if not s:
        return C.unknown("no notes")
    struck, sounding, where = {}, {}, set()
    for hn, h in s.items():
        lo, hi = extent(h, h.gon)
        span = hi - lo
        sounding[hn] = int(np.nanmax(span))
        mx = 0
        for k in range(len(h.gstart)):
            p = h.pitch[h.group(k)]
            mx = max(mx, int(p.max() - p.min()))
        struck[hn] = mx
        for k in np.nonzero(span == sounding[hn])[0]:
            where.add(int(h.meas[h.gstart[k]]))
    return C.res({"max_struck_span": struck, "max_sounding_span": sounding}, where=where)


@C.direct("technique.leap-size")
def technique_leap_size(sc: S.Score) -> S.Result:
    """The leaps each hand makes between one onset group and the next, in semitones. The line through chords is the
    hand's outer voice: the highest note of each group for the right hand, the lowest for the left. A leap is the
    absolute difference between consecutive groups' line notes (a rest between them does not break it).
    Per hand: `max`, `median`, `p90`, and `n` leaps measured; a hand with fewer than two groups has `n` 0.
    `where` lists the bars where a hand's largest leap lands."""
    s = C.streams(sc)
    if not s:
        return C.unknown("no notes")
    out, where = {}, set()
    for hn, h in s.items():
        line = []
        for k in range(len(h.gstart)):
            p = h.pitch[h.group(k)]
            line.append(int(p.max() if hn == "R" else p.min()))
        if len(line) < 2:
            out[hn] = {"max": 0, "median": 0, "p90": 0, "n": 0}
            continue
        leaps = np.abs(np.diff(np.array(line)))
        out[hn] = {"max": int(leaps.max()), "median": float(np.median(leaps)), "p90": float(np.percentile(leaps, 90)), "n": int(len(leaps))}
        where |= {int(h.meas[h.gstart[k + 1]]) for k in np.nonzero(leaps == leaps.max())[0]}
    return C.res(out, where=where)


# --------------------------------------------------------------------------- crossings
def crossings(sc: S.Score) -> dict:
    """The hand-crossing moments and passages. At each time either hand strikes, with both hands sounding, the hands
    are crossed when the left hand's lowest sounding note is above the right hand's lowest AND its highest is above
    the right hand's highest (the left hand has moved to the right of the right hand, wholly or partly; a hand
    whose range merely encloses the other's is not crossed). `moments` counts such times, `passages` the maximal runs
    of consecutive such times, `where` the bars of the moments."""
    def make():
        hs = C.two_hands(sc)
        if hs is None:
            return {"moments": 0, "passages": 0, "where": []}
        R, L = hs
        times = np.union1d(R.gon, L.gon)
        loR, hiR = extent(R, times)
        loL, hiL = extent(L, times)
        flag = (loL > loR) & (hiL > hiR)  # nan compares False
        passages = 0
        prev = False
        for f in flag:
            if f and not prev:
                passages += 1
            prev = bool(f)
        return {"moments": int(flag.sum()), "passages": passages,
                "where": sorted({C.measure_of(sc, float(t)) for t in times[flag]})}
    return C.cached(sc, "crossings", make)


@C.direct("technique.hand-crossing")
def technique_hand_crossing(sc: S.Score) -> S.Result:
    """Hand crossings: see `crossings` for the definition. `passages` is the count of crossings (an unbroken stretch of
    crossed moments is one), `moments` the strikes within them. Needs both hands: a one-handed score is UNKNOWN."""
    if C.two_hands(sc) is None:
        return C.unknown("only one hand has notes")
    c = crossings(sc)
    return C.res({"count": c["passages"], "passages": c["passages"], "moments": c["moments"]}, where=c["where"])
