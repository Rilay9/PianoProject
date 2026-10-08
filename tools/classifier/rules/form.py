"""
Form rules over the harmony analysis and the notated structure (docs/classifier/rules/harmony.md, "Form"):
twelve-bar blues, turnarounds, multi-strain (rag and march) form, the 32-bar AABA song form, binary and ternary.

The chord timeline and key are rules/harmony.py's `analyse`; the marked structure (repeats, endings, double
bars, key changes, D.C. and Fine) is partitura's reading of the file (`harmony.marks`). Repeats are unfolded at
the bar level (`bar_order`) before any section is compared, so a written ||: A :|| counts as A A.
"""
from __future__ import annotations

import score as S
from rules import harmony as H


# --------------------------------------------------------------------------- bars
def bar_chord(an: H.Analysis, sc: S.Score, m: int) -> H.Chord | None:
    """The chord sounding on the bar's downbeat, else the first chord struck in the bar."""
    t = sc.measure_starts[m]
    c = H.chord_at(an, t + 1e-6)
    if c is not None:
        return c
    end = sc.measure_starts[m + 1] if m + 1 < len(sc.measure_starts) else an.end
    return next((c for c in an.chords if t <= c.t0 < end), None)


def bar_chords(sq: list[H.Chord], sc: S.Score, an: H.Analysis, m: int) -> list[H.Chord]:
    t = sc.measure_starts[m]
    end = sc.measure_starts[m + 1] if m + 1 < len(sc.measure_starts) else an.end
    return [c for c in sq if c.t0 < end - 1e-6 and c.t1 > t + 1e-6]


def _bars_of(sc: S.Score, t: float) -> int:
    return H.measure_of(sc, t)


def structure(sc: S.Score, an: H.Analysis) -> dict:
    """The marks as bar indices: repeat spans, first-ending bars, section boundaries, key changes, D.C./Fine."""
    mk = H.marks(sc)
    n = len(sc.measure_starts)
    reps = []
    for a, b in mk["repeats"]:
        if b is None:
            continue
        sb, eb = _bars_of(sc, a + 1e-6), _bars_of(sc, b - 1e-6)
        if 0 <= sb <= eb < n:
            reps.append((sb, eb))
    first_end = set()
    second = {}  # first bar of a second (or later) ending -> its last bar
    for a, b, num in mk["endings"]:
        if b is None:
            continue
        a_bar, b_bar = _bars_of(sc, a + 1e-6), _bars_of(sc, b - 1e-6)
        if num.strip().startswith("1") and "2" not in num:
            first_end.update(range(a_bar, b_bar + 1))
        else:
            second[a_bar] = b_bar
    bounds = set()
    for sb, eb in reps:
        # a second ending belongs to the strain it closes; where the file marks only the first ending, the bars after
        # the repeat that replace it (as many as the first ending has) are taken as the second
        k = sum(1 for m in first_end if sb <= m <= eb)
        bounds.update({sb, max(second.get(eb + 1, eb), eb + k) + 1})
    rep_times = [x for r in mk["repeats"] for x in r if x is not None]
    for t, _style in mk["bars"]:
        if any(abs(t - u) < 1e-3 for u in rep_times):
            continue  # the barline of a repeat sign: the repeat already marks it
        if t < an.end - 1e-3:
            bounds.add(_bars_of(sc, t - 1e-6) + 1)
    keys = [(t, f) for t, f in mk["keys"] if t > 1e-6 and t < an.end - 1e-3]
    for t, _f in keys:
        bounds.add(_bars_of(sc, t + 1e-6))
    bounds = sorted(b for b in bounds if 0 < b < n)
    home = mk["keys"][0][1] if mk["keys"] else None
    return {"repeats": sorted(set(reps)), "first_end": first_end, "bounds": bounds,
            "keys": [(_bars_of(sc, t + 1e-6), f) for t, f in keys], "home": home,
            "dacapo": bool(mk["dacapo"]), "fine": bool(mk["fine"]), "n": n}


def bar_order(st: dict) -> list[int]:
    """The bars in playing order with repeats taken once and first endings skipped on the second pass."""
    n = st["n"]
    order, done, i = [], set(), 0
    while i < n and len(order) < 4 * n:
        rep_in = [r for r in st["repeats"] if r[0] <= i <= r[1]]
        if i in st["first_end"] and rep_in and all(r in done for r in rep_in):
            i += 1
            continue
        order.append(i)
        rep = next((r for r in st["repeats"] if r[1] == i and r not in done), None)
        if rep is not None:
            done.add(rep)
            i = rep[0]
            continue
        i += 1
    return order


# --------------------------------------------------------------------------- melody similarity
def bar_events(sc: S.Score, an: H.Analysis) -> list[frozenset]:
    """Per written bar: the melody's (position in the bar, pitch) events; the top line of the right hand, or the top
    line of everything when there is one hand."""
    line = an.melody
    if not line:
        n = sc.notes
        out = {}
        for o, d, p, m in zip(n["onset_quarter"], n["duration_quarter"], n["pitch"], sc.measure):
            k = round(float(o), 4)
            if k not in out or p > out[k][2]:
                out[k] = (float(o), float(o + d), int(p), int(m))
        line = [out[k] for k in sorted(out)]
    ev = [set() for _ in sc.measure_starts]
    for o, e, p, m in line:
        if 0 <= m < len(ev):
            ev[m].add((round((o - sc.measure_starts[m]) * 12) / 12, p))
    return [frozenset(e) for e in ev]


def bar_sim(a: frozenset, b: frozenset) -> float:
    if not a and not b:
        return 1.0
    return len(a & b) / len(a | b)


def section_sim(ev, order, i, j, length) -> float:
    return sum(bar_sim(ev[order[i + k]], ev[order[j + k]]) for k in range(length)) / length


def harmony_sim(an, sc, order, i, j, length) -> float | None:
    if H.timeline_unknown(an) or an.unknown:
        return None
    same = tot = 0
    for k in range(length):
        a, b = bar_chord(an, sc, order[i + k]), bar_chord(an, sc, order[j + k])
        if a is None or b is None:
            continue
        tot += 1
        same += (a.root_pc, a.triad) == (b.root_pc, b.triad)
    return same / tot if tot else None


def both_sim(an, sc, ev, order, i, j, length) -> float:
    """Melody similarity, averaged with harmony similarity where the chord timeline stands."""
    mel = section_sim(ev, order, i, j, length)
    har = harmony_sim(an, sc, order, i, j, length)
    return (mel + har) / 2 if har is not None else mel


# =========================================================================== form.twelve-bar
#: per bar of the chorus, the root degrees (semitones above the tonic) the bar's downbeat chord may have.
#: The standard and quick-IV forms differ only in bar 2; bars 4, 6, 7, 8, 9, 10, 11 admit the common jazz-blues
#: substitutions (v7-I7 into IV, #iv dim, iii-VI7, ii-V); bar 12 is the turnaround and admits anything.
TWELVE_MAJOR = [{0}, {0, 5}, {0}, {0, 7}, {5}, {5, 6}, {0, 4}, {0, 9, 4, 3}, {7, 2}, {5, 7, 2}, {0, 4}, None]
#: the share of bars whose downbeat bass is the printed symbol's root, measured on the catalogue's items with symbols
#: and a bass line (docs/classifier/rules/harmony.md, form.twelve-bar)
BASS_ROOT_AGREEMENT = 0.9  # 0.906 of 2,053 bars
TWELVE_MINOR = [{0}, {0, 5}, {0}, {0, 7}, {5}, {5}, {0}, {0}, {7, 8, 2}, {7, 5}, {0}, None]


def _twelve_match(bars: list, minor: bool) -> str | None:
    """bars: twelve (root degree, triad quality or None when only the bass is known)."""
    tpl = TWELVE_MINOR if minor else TWELVE_MAJOR
    for k, (deg, triad) in enumerate(bars):
        if tpl[k] is not None and deg not in tpl[k]:
            return None
        if k == 3 and deg == 7 and triad not in ("m", None):  # bar 4's v7 is the minor ii of IV, not V
            return None
    want = "m" if minor else "M"
    if bars[0][1] not in (want, None) or bars[4][1] not in (want, None):
        return None
    return "minor" if minor else "quick IV" if bars[1][0] == 5 else "standard"


def _twelve_at(an, sc, s, key):
    bars = []
    for k in range(12):
        c = bar_chord(an, sc, s + k)
        if c is None:
            return None
        bars.append((c.deg, c.triad))
    return _twelve_match(bars, key.mode == "minor")


def bass_roots(an: H.Analysis, sc: S.Score) -> list:
    """Per bar, the bass note struck on the downbeat as the bar's root (degree above the tonic), or None."""
    out = []
    for m, t in enumerate(sc.measure_starts):
        b = next((x for x in an.bass if abs(x[0] - t) < 1e-4), None)
        out.append(None if b is None else (b[2] - an.key.tonic_pc) % 12)
    return out


@S.measures("form.twelve-bar")
def twelve_bar(sc: S.Score) -> S.Result:
    an = H.analyse(sc)
    why = H.timeline_unknown(an)
    n = len(sc.measure_starts)
    if why:
        # no chord timeline: the bass struck on each downbeat as the bar's root, when there is a bass and a key
        if an.key is None or not an.bass:
            return S.Result.unknown_because(why)
        roots = bass_roots(an, sc)
        starts, variants = [], []
        s = 0
        while s + 12 <= n:
            v = None if None in roots[s:s + 12] else _twelve_match([(d, None) for d in roots[s:s + 12]], an.key.mode == "minor")
            if v:
                starts.append(s)
                variants.append(v)
                s += 12
            else:
                s += 1
        value = {"choruses": len(starts), "basis": "downbeat bass as root"}
        if starts:
            value["variants"] = sorted(set(variants))
            value["starts"] = starts
        return S.Result(value=value, provenance="inferred", confidence=round(an.key.confidence * BASS_ROOT_AGREEMENT, 3),
                        where=starts)
    starts, variants = [], []
    s = 0
    while s + 12 <= n:
        v = _twelve_at(an, sc, s, an.key)
        if v:
            starts.append(s)
            variants.append(v)
            s += 12
        else:
            s += 1
    value = {"choruses": len(starts)}
    if starts:
        value["variants"] = sorted(set(variants))
        value["starts"] = starts
    if an.source == "symbols" and an.bass:
        # the downbeat bass is a second, independent witness to the printed symbols' roots
        roots = bass_roots(an, sc)
        by_bass = [s for s in range(0, n - 11) if None not in roots[s:s + 12]
                   and _twelve_match([(d, None) for d in roots[s:s + 12]], an.key.mode == "minor")]
        if bool(by_bass) != bool(starts):
            return S.Result.unknown_because(f"the symbols ({len(starts)} choruses) and the downbeat bass "
                                            f"({'a' if by_bass else 'no'} twelve-bar) disagree")
        return S.Result(value=value, provenance="two-witnesses", where=starts)
    return H.result(an, value, starts)


# =========================================================================== form.turnaround
def _dominant_fn(c: H.Chord) -> bool:
    return (c.deg == 7 and c.triad == "M") or (c.deg == 1 and c.triad == "M" and c.seventh == "7") \
        or (c.deg == 11 and c.triad == "d")


def _tonic_fn(c: H.Chord | None, key: H.Key) -> bool:
    return c is not None and c.deg == 0 and c.triad == ("M" if key.mode == "major" else "m")


@S.measures("form.turnaround")
def turnaround(sc: S.Score) -> S.Result:
    an = H.analyse(sc)
    why = H.timeline_unknown(an)
    if why:
        return S.Result.unknown_because(why)
    n = len(sc.measure_starts)
    if n < 2:
        return S.Result.unknown_because("fewer than two bars")
    sq = H.seq(an)
    st = structure(sc, an)
    # chorus ends: each twelve-bar chorus, each marked section, each repeat (back to its start), the end of the item
    targets: dict[int, int] = {}  # boundary bar -> the bar it returns to
    for b in st["bounds"]:
        targets[b] = b
    for sb, eb in st["repeats"]:
        targets[eb + 1] = sb
    s = 0
    while s + 12 <= n:
        if _twelve_at(an, sc, s, an.key):
            targets.setdefault(s + 12, s + 12 if s + 12 < n else s)
            s += 12
        else:
            s += 1
    targets.setdefault(n, 0)
    found: dict[str, int] = {}
    where = []
    for b, back in sorted(targets.items()):
        if b < 2 or b > n:
            continue
        chs = [c for c in sq if c.t0 < (sc.measure_starts[b] if b < n else an.end) - 1e-6 and c.t1 > sc.measure_starts[b - 2] + 1e-6]
        if len({c.label for c in chs}) < 2 or not _dominant_fn(chs[-1]):
            continue  # a turnaround moves: one dominant held for two bars is a half cadence, not a turnaround
        dest = bar_chord(an, sc, back if b == n else b) if (back if b == n else b) < n else None
        if not _tonic_fn(dest, an.key) and not (dest is not None and dest.deg == 0 and H.blues_tonic(sq)):
            continue
        pat = "-".join(c.label for k, c in enumerate(chs) if k == 0 or c.label != chs[k - 1].label)
        found[pat] = found.get(pat, 0) + 1
        where.append(b - 2)
    return H.result(an, {"count": sum(found.values()), "patterns": found}, where)


# =========================================================================== form.multi-strain
@S.measures("form.multi-strain")
def multi_strain(sc: S.Score) -> S.Result:
    an = H.analyse(sc)
    st = structure(sc, an)
    n = st["n"]
    if not st["bounds"] and not st["repeats"]:
        return S.Result.unknown_because("no repeats, double bars or key changes: the strains are not marked")
    edges = [0] + st["bounds"] + [n]
    sections = []
    for a, b in zip(edges, edges[1:]):
        length = sum(1 for m in range(a, b) if m not in st["first_end"])
        if sc.pickup and a == 0:
            length -= 1
        sections.append((a, length))
    strains = [a for a, L in sections if L in (16, 32)]
    trio = None
    if st["home"] is not None and st["keys"]:
        trio = any(f == st["home"] - 1 and m in strains for m, f in st["keys"])
    value = {"sections": [L for _a, L in sections if L > 0], "strains_16_or_32": len(strains), "trio_in_subdominant": trio,
             "multi_strain": len(strains) >= 3}
    return S.Result(value=value, provenance="exact", where=strains)


# =========================================================================== form.thirty-two-bar
A_SAME = 0.6  # two A sections: at least this similar (validated: docs/classifier/rules/harmony.md)
B_DIFF = 0.35  # the bridge: at most this similar to either A
A_NONE = 0.25  # below this no two A sections are alike at any start: not AABA (between the two: UNKNOWN)


@S.measures("form.thirty-two-bar")
def thirty_two(sc: S.Score) -> S.Result:
    an = H.analyse(sc)
    st = structure(sc, an)
    order = bar_order(st)
    if len(order) < 32:
        return S.Result(value={"form": None, "why": f"{len(order)} bars played, fewer than 32"}, provenance="exact")
    ev = bar_events(sc, an)
    best = None
    for s in range(0, min(9, len(order) - 31)):
        a1, a2, b, a3 = s, s + 8, s + 16, s + 24
        sims = {}
        for nm, (i, j) in {"A1A2": (a1, a2), "A1A3": (a1, a3), "A2A3": (a2, a3), "A1B": (a1, b), "A2B": (a2, b)}.items():
            sims[nm] = round(both_sim(an, sc, ev, order, i, j, 8), 3)
        a_same = min(sims["A1A2"], max(sims["A1A3"], sims["A2A3"]))
        b_diff = max(sims["A1B"], sims["A2B"])
        margin = a_same - b_diff
        if best is None or margin > best[0]:
            best = (margin, s, sims, a_same, b_diff)
    margin, s, sims, a_same, b_diff = best
    rest = len(order) - (s + 32)
    if a_same >= A_SAME and b_diff <= B_DIFF and rest > 8:
        # the AABA must be the chorus: what follows it begins the chorus again (A), not the bridge again (a rounded
        # binary with repeats unfolds to A A B A B A)
        k = min(8, rest)
        again = both_sim(an, sc, ev, order, s, s + 32, k)
        bridge = both_sim(an, sc, ev, order, s + 16, s + 32, k)
        if bridge >= A_SAME and again < A_SAME:
            return S.Result(value={"form": "not AABA", "why": "the AABA run continues with its bridge again (A A B A B A): "
                                   "a rounded binary with repeats, not a 32-bar chorus", "best_start": s, "sims": sims},
                            provenance="inferred", confidence=0.6)
        if again < A_SAME:
            return S.Result.unknown_because(f"an AABA run of sections at bar {order[s]}, but the {rest} bars after it "
                                            "neither repeat the chorus nor the bridge")
    if a_same >= A_SAME and b_diff <= B_DIFF:
        return S.Result(value={"form": "AABA", "start": s, "sims": sims}, provenance="inferred",
                        confidence=round(min(0.95, 0.5 + margin), 3), where=[order[s], order[s + 8], order[s + 16], order[s + 24]])
    if a_same < A_NONE:
        return S.Result(value={"form": "not AABA", "best_start": s, "sims": sims}, provenance="inferred", confidence=0.6)
    return S.Result.unknown_because(f"sections neither clearly alike nor clearly different (A-A {a_same:.2f}, A-B {b_diff:.2f})")


# =========================================================================== form.binary-ternary
@S.measures("form.binary-ternary")
def binary_ternary(sc: S.Score) -> S.Result:
    an = H.analyse(sc)
    st = structure(sc, an)
    n = st["n"]
    ev = bar_events(sc, an)
    start = 1 if sc.pickup else 0
    if st["dacapo"] and st["fine"]:
        return S.Result(value="ternary (da capo al fine)", provenance="exact")
    reps = st["repeats"]
    # binary: two repeated halves that together cover the piece
    if len(reps) == 2:
        (s1, e1), (s2, e2) = reps
        if s1 <= start and s2 == e1 + 1 and e2 >= n - 2:
            a_len = e1 - start + 1
            k = min(4, a_len, e2 - s2 + 1)
            opening = [ev[m] for m in range(start, start + k)]
            # a return of the opening inside B's second half
            best = 0.0
            for j in range(s2 + (e2 - s2 + 1) // 2 - k, e2 - k + 2):
                if j < s2:
                    continue
                best = max(best, sum(bar_sim(opening[q], ev[j + q]) for q in range(k)) / k)
            if best >= A_SAME:
                return S.Result(value="rounded binary", provenance="inferred", confidence=round(best, 3), where=[s1, s2])
            return S.Result(value="binary", provenance="exact", where=[s1, s2])
    edges = [start] + [b for b in st["bounds"] if b > start] + [n]
    secs = [(a, b) for a, b in zip(edges, edges[1:]) if b > a]
    if len(secs) == 3:
        (a0, a1), (b0, b1), (c0, c1) = secs
        k = min(a1 - a0, c1 - c0, 8)
        if k >= 2:
            ac = sum(bar_sim(ev[a0 + q], ev[c0 + q]) for q in range(k)) / k
            kb = min(a1 - a0, b1 - b0, 8)
            ab = sum(bar_sim(ev[a0 + q], ev[b0 + q]) for q in range(kb)) / kb
            if ac >= A_SAME and ab <= B_DIFF:
                return S.Result(value="ternary", provenance="inferred", confidence=round(ac, 3), where=[a0, b0, c0])
    if not st["bounds"] and not reps:
        return S.Result.unknown_because("no repeats, double bars or D.C.: the sections are not marked")
    return S.Result(value=f"other ({len(secs)} marked sections)", provenance="exact", where=[a for a, _b in secs])
