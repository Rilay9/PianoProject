"""
Accompaniment textures, measured from the notes (docs/classifier/rules/texture.md holds each
definition, its source or validation, the positives, the near-misses and when it says UNKNOWN).

Every rule reads the score through `score.load` and works on one view of it, built once per
score (`view`): per hand, the onset events (the notes struck together, grace notes left out),
each with its bar and its position in the bar, and per bar its metre. A rule answers
`{"present", "bars", "share", "hands"}` plus what it needs, with `where` the 0-based bars, or
UNKNOWN with the reason. Provenance is exact: the rules are deterministic over the notation;
how far each rule is the musical characteristic is what texture.md defends.

The shared helpers here (`view`, `fits_chord`, `arpeggio_segments`, `alberti_cover`) are also
read by rules/technique.py.
"""
from __future__ import annotations

import collections
from dataclasses import dataclass, field

import numpy as np

import score as S
from score import Result, measures

EPS = 1e-4
LETTERS = "CDEFGAB"

# --------------------------------------------------------------------------- chord templates
_TRIADS = ((0, 4, 7), (0, 3, 7), (0, 3, 6), (0, 4, 8))
_SEVENTHS = ((0, 4, 7, 10), (0, 4, 7, 11), (0, 3, 7, 10), (0, 3, 6, 10), (0, 3, 6, 9), (0, 3, 7, 11))
TRIADS = {frozenset((r + i) % 12 for i in t) for r in range(12) for t in _TRIADS}
SEVENTHS = {frozenset((r + i) % 12 for i in t) for r in range(12) for t in _SEVENTHS}
CHORDS = TRIADS | SEVENTHS
#: (seventh chord, root, seventh) for every seventh chord: the one pair a broken seventh chord
#: may step between
SEVENTH_ROOTS = [(frozenset((r + i) % 12 for i in t), r, (r + t[3]) % 12) for r in range(12) for t in _SEVENTHS]


def fits_chord(pcs) -> bool:
    """Every pitch class belongs to one triad or seventh chord (major, minor, diminished,
    augmented; dominant, major, minor, half-diminished, diminished, minor-major seventh)."""
    s = frozenset(int(p) % 12 for p in pcs)
    return any(s <= t for t in CHORDS)


def full_triads(pcs) -> list[frozenset]:
    """The triads wholly contained in a pitch-class set."""
    s = frozenset(int(p) % 12 for p in pcs)
    return [t for t in TRIADS if t <= s]


# --------------------------------------------------------------------------- the view
@dataclass
class Ev:
    onset: float  # quarters from the start
    pos: float  # quarters from the notated start of its bar (a pickup is right-aligned)
    bar: int
    pitches: tuple  # sorted MIDI pitches struck together in this hand
    end: float  # latest end among them
    letters: tuple  # diatonic index (octave * 7 + letter) per pitch, same order

    @property
    def low(self) -> int:
        return self.pitches[0]

    @property
    def high(self) -> int:
        return self.pitches[-1]

    @property
    def single(self) -> bool:
        return len(self.pitches) == 1

    @property
    def pcs(self) -> frozenset:
        return frozenset(p % 12 for p in self.pitches)


@dataclass
class Bar:
    length: float  # actual length in quarters
    full: float  # the time signature's length in quarters
    offset: float  # added to an onset's distance from the bar start (a pickup's missing part)
    beats: int
    beat_type: int

    @property
    def compound(self) -> bool:
        return self.beat_type == 8 and self.beats in (6, 9, 12)

    @property
    def beat_len(self) -> float:
        q = 4.0 / self.beat_type
        return 3 * q if self.compound else q

    @property
    def n_beats(self) -> int:
        return self.beats // 3 if self.compound else self.beats


@dataclass
class View:
    sc: S.Score
    unknown: str | None = None
    bars: list[Bar] = field(default_factory=list)
    hands: dict = field(default_factory=dict)  # hand -> list[Ev]
    by_bar: dict = field(default_factory=dict)  # (hand, bar) -> list[Ev]
    notes: dict = field(default_factory=dict)  # hand -> arrays onset, end, pitch, bar (graces out)
    graces: list = field(default_factory=list)  # (hand, onset, pitch, bar)

    @property
    def n_bars(self) -> int:
        return len(self.bars)


def _bars(sc: S.Score) -> list[Bar]:
    n = sc.notes
    starts = sc.measure_starts
    nb = len(starts)
    ts_at: dict[int, tuple[int, int]] = {}
    for m, b, t in zip(sc.measure.tolist(), n["ts_beats"].tolist(), n["ts_beat_type"].tolist()):
        ts_at.setdefault(int(m), (int(b), int(t)))
    out, cur = [], (4, 4)
    for m in range(nb):
        cur = ts_at.get(m, cur)
        full = cur[0] * 4.0 / cur[1]
        if m + 1 < nb:
            length = starts[m + 1] - starts[m]
        else:
            ends = n["onset_quarter"] + n["duration_quarter"]
            length = max(full, float(ends.max()) - starts[m]) if len(n) else full
        offset = full - length if (m == 0 and sc.pickup and length < full - EPS) else 0.0
        out.append(Bar(length=length, full=full, offset=offset, beats=cur[0], beat_type=cur[1]))
    return out


def view(sc: S.Score) -> View:
    """The texture view of a score, built once and kept on the score."""
    v = getattr(sc, "_texture_view", None)
    if v is not None:
        return v
    v = View(sc=sc)
    sc._texture_view = v  # type: ignore[attr-defined]
    n = sc.notes
    if not len(n):
        v.unknown = "no notes"
        return v
    if not sc.measure_starts:
        v.unknown = "no measures"
        return v
    if sc.parts == 1 and sc.staves <= 1 and sc.item.get("hands") == "both":
        v.unknown = "one staff holds both hands: the hands cannot be separated"
        return v
    v.bars = _bars(sc)
    starts = sc.measure_starts
    on = n["onset_quarter"].astype(float)
    du = n["duration_quarter"].astype(float)
    pitch = n["pitch"].astype(int)
    letter = n["octave"].astype(int) * 7 + np.array([LETTERS.index(s) if s in LETTERS else 0 for s in n["step"]])
    bar = np.clip(sc.measure.astype(int), 0, len(starts) - 1)
    for h in sorted(set(sc.hand.tolist())):
        sel = sc.hand == h
        grace = sel & (du <= EPS)
        for i in np.flatnonzero(grace):
            v.graces.append((h, float(on[i]), int(pitch[i]), int(bar[i])))
        idx = np.flatnonzero(sel & (du > EPS))
        idx = idx[np.lexsort((pitch[idx], on[idx]))]
        v.notes[h] = {"onset": on[idx], "end": on[idx] + du[idx], "pitch": pitch[idx], "bar": bar[idx]}
        evs: list[Ev] = []
        k = 0
        while k < len(idx):
            j = k
            while j + 1 < len(idx) and abs(on[idx[j + 1]] - on[idx[k]]) < EPS:
                j += 1
            g = idx[k:j + 1]
            m = int(bar[g[0]])
            evs.append(Ev(onset=float(on[g[0]]), pos=float(on[g[0]]) - starts[m] + v.bars[m].offset, bar=m,
                          pitches=tuple(int(p) for p in pitch[g]), end=float((on[g] + du[g]).max()),
                          letters=tuple(int(x) for x in letter[g])))
            k = j + 1
        v.hands[h] = evs
        for e in evs:
            v.by_bar.setdefault((h, e.bar), []).append(e)
    if not v.hands:
        v.unknown = "only grace notes"
    return v


def bar_events(v: View, hand: str, m: int) -> list[Ev]:
    return v.by_bar.get((hand, m), [])


def sounding(v: View, t0: float, t1: float, exclude: str | None = None):
    """Pitches of the notes sounding at any time in [t0, t1), optionally leaving one hand out."""
    out = []
    for h, a in v.notes.items():
        if h == exclude:
            continue
        mask = (a["onset"] < t1 - EPS) & (a["end"] > t0 + EPS)
        out.extend(a["pitch"][mask].tolist())
    return out


def _result(v: View, bars_by_hand: dict, minimum: int, **extra) -> Result:
    """The common answer: present when some hand shows at least `minimum` bars."""
    allbars = sorted({b for bs in bars_by_hand.values() for b in bs})
    hands = sorted(h for h, bs in bars_by_hand.items() if bs)
    present = any(len(bs) >= minimum for bs in bars_by_hand.values())
    value = {"present": present, "bars": len(allbars), "share": round(len(allbars) / max(1, v.n_bars), 3), "hands": hands}
    value.update(extra)
    return Result(value=value, provenance="exact", where=allbars)


def _short(v: View, need: int, what: str) -> Result | None:
    if v.unknown:
        return Result.unknown_because(v.unknown)
    if v.n_bars < need:
        return Result.unknown_because(f"{v.n_bars} bar(s): too short to show {what} ({need} bars needed)")
    return None


def _even(evs: list[Ev], start: float, length: float) -> bool:
    """The events fill [start, start + length) at one even spacing, the first on its start."""
    if len(evs) < 2 or abs(evs[0].pos - start) > EPS:
        return False
    d = length / len(evs)
    return all(abs(e.pos - (start + i * d)) < EPS for i, e in enumerate(evs))


def _even_to_end(evs: list[Ev], start: float, length: float) -> bool:
    """The events run at one even spacing to the end of [start, start + length); the first may
    come after a rest shorter than half the span (a figure that enters off the beat, as the
    right hand of Bach's C major prelude does over the left hand's held notes)."""
    if len(evs) < 2:
        return False
    d = evs[1].pos - evs[0].pos
    if d <= EPS or evs[0].pos < start - EPS or evs[0].pos - start >= length / 2:
        return False
    if any(abs(e.pos - (evs[0].pos + i * d)) > EPS for i, e in enumerate(evs)):
        return False
    return abs(evs[-1].pos + d - (start + length)) < EPS


# --------------------------------------------------------------------------- Alberti
def alberti_cover(v: View, hand: str) -> set[int]:
    """Indices (in the hand's event list) of notes inside an Alberti group: four single notes
    at one even spacing of a quarter or less, lowest-highest-middle-highest, the highest note
    repeated, within an octave, the three pitch classes one triad or seventh chord."""
    evs = v.hands[hand]
    cover: set[int] = set()
    for i in range(len(evs) - 3):
        q = evs[i:i + 4]
        if not all(e.single for e in q):
            continue
        d = q[1].onset - q[0].onset
        if d <= EPS or d > 1.0 + EPS:
            continue
        if any(abs((q[k + 1].onset - q[k].onset) - d) > EPS for k in range(3)):
            continue
        a, b, c, b2 = (e.low for e in q)
        if b2 != b or not (a < c < b) or b - a > 12:
            continue
        if len({a % 12, b % 12, c % 12}) < 3 or not fits_chord((a, b, c)):
            continue
        cover.update(range(i, i + 4))
    return cover


def _alberti_bars(v: View) -> dict:
    out = {}
    for h, evs in v.hands.items():
        cover = alberti_cover(v, h)
        per_bar = collections.Counter(evs[i].bar for i in cover)
        tot = collections.Counter(e.bar for e in evs)
        # the figure fills the bar: three quarters of the hand's notes there (Hanon No. 5's
        # C-A-G-A is one Alberti-shaped group in a bar of eight and is not an Alberti bass)
        out[h] = sorted(m for m, c in per_bar.items() if c >= 4 and c >= 0.75 * tot[m])
    return out


@measures("texture.alberti")
def alberti(sc: S.Score) -> Result:
    v = view(sc)
    r = _short(v, 2, "an Alberti pattern sustained over two bars")
    return r or _result(v, _alberti_bars(v), 2)


# --------------------------------------------------------------------------- broken chord
def _broken_group(evs: list[Ev], start: float, length: float, beat: float) -> bool:
    if len(evs) < 3 or not all(e.single for e in evs):
        return False
    if not _even_to_end(evs, start, length):
        return False
    ps = [e.low for e in evs]
    pcs = [p % 12 for p in ps]
    if len(set(pcs)) < 3 or not fits_chord(ps):
        return False
    fast = evs[1].pos - evs[0].pos <= beat / 2 + EPS
    if len(set(ps)) == len(ps) and not fast:
        # one note a beat that never returns to a pitch it has left is a line, not a figure: a
        # walking bass through chord tones (A2-C#3-E3-G#2) moves on, as detect.ts walkingBass
        # says; a broken chord circles back (C-E-G-E), or runs two or more notes a beat
        return False
    # no step between neighbours, except a seventh chord's seventh to its root (B flat-C in C7)
    pairs = {frozenset((r, s)) for t, r, s in SEVENTH_ROOTS if frozenset(pcs) <= t}
    return all(abs(b - a) not in (1, 2) or frozenset((a % 12, b % 12)) in pairs for a, b in zip(ps, ps[1:]))


def _broken_bars(v: View) -> dict:
    out = {}
    for h in v.hands:
        bars = []
        for m, b in enumerate(v.bars):
            evs = bar_events(v, h, m)
            if not evs:
                continue
            start, length = b.offset, b.length
            bl = b.beat_len
            if _broken_group(evs, start, length, bl):
                bars.append(m)
                continue
            half = length / 2
            first = [e for e in evs if e.pos < start + half - EPS]
            second = [e for e in evs if e.pos >= start + half - EPS]
            if (b.n_beats % 2 == 0 and _broken_group(first, start, half, bl)
                    and _broken_group(second, start + half, half, bl)):
                bars.append(m)
        out[h] = bars
    return out


@measures("texture.broken-chord")
def broken_chord(sc: S.Score) -> Result:
    v = view(sc)
    r = _short(v, 2, "a broken-chord figure sustained over two bars")
    if r:
        return r
    broken = _broken_bars(v)
    alb = _alberti_bars(v)
    both = {h: sorted(set(broken.get(h, [])) | set(alb.get(h, []))) for h in v.hands}
    other = sorted({m for h in v.hands for m in broken.get(h, []) if m not in alb.get(h, [])})
    return _result(v, both, 2, not_alberti_bars=len(other))


# --------------------------------------------------------------------------- arpeggio
def arpeggio_segments(v: View, hand: str, max_ioi: float = 1.0) -> list[tuple[int, int, int]]:
    """Monotone runs of single notes through the tones of one chord: (first index, last
    index, span in semitones). Each step is 3 to 9 semitones (the next chord tone, or the one
    after in an open voicing), or 1 to 2 when the run's tones make a seventh chord (the
    seventh to the root); every pitch class in the run belongs to one triad or seventh chord,
    at least three of them; no gap between onsets longer than `max_ioi` quarters."""
    evs = v.hands[hand]
    segs = []
    i = 0
    while i < len(evs) - 1:
        if not evs[i].single:
            i += 1
            continue
        j, direction = i, 0
        pcs = {evs[i].low % 12}
        while j + 1 < len(evs) and evs[j + 1].single:
            a, b = evs[j].low, evs[j + 1].low
            step = b - a
            sign = (step > 0) - (step < 0)
            if sign == 0 or (direction and sign != direction):
                break
            if evs[j + 1].onset - evs[j].onset > max_ioi + EPS:
                break
            new = pcs | {b % 12}
            if not fits_chord(new):
                break
            if abs(step) > 9:
                break
            if abs(step) < 3 and not any(frozenset(new) <= t for t in SEVENTHS):
                break
            direction, pcs, j = sign, new, j + 1
        if j - i >= 3 and len(pcs) >= 3:
            segs.append((i, j, abs(evs[j].low - evs[i].low)))
            i = j  # the turning note may start the next run
        else:
            i += 1
    return segs


@measures("texture.arpeggio")
def arpeggio(sc: S.Score) -> Result:
    v = view(sc)
    r = _short(v, 2, "an arpeggiated texture over two bars")
    if r:
        return r
    out = {}
    for h, evs in v.hands.items():
        inside = collections.Counter()
        for i, j, span in arpeggio_segments(v, h):
            if span > 12:
                for k in range(i, j + 1):
                    inside[evs[k].bar] += 1
        tot = collections.Counter(e.bar for e in evs)
        out[h] = sorted(m for m, c in inside.items() if c >= 4 and c >= 0.5 * tot[m])
    return _result(v, out, 2)


# --------------------------------------------------------------------------- bass and chord
def _is_chord(e: Ev) -> bool:
    return len(e.pitches) >= 2 and len(e.pcs) >= 2


#: A bass struck as two notes: a fifth, a seventh, an octave or a tenth (the stride bass
#: intervals Wikipedia's "Stride (music)" names, with the fifth of the oom-pah's open bass).
BASS_DYADS = {7, 10, 11, 12, 15, 16}


def _is_bass(e: Ev, chord: Ev) -> bool:
    if len(e.pitches) > 2 or chord.low - e.low < 3:
        return False
    return len(e.pitches) == 1 or (e.pitches[1] - e.pitches[0]) in BASS_DYADS


@measures("texture.waltz-bass")
def waltz_bass(sc: S.Score) -> Result:
    v = view(sc)
    r = _short(v, 2, "a waltz bass over two bars")
    if r:
        return r
    out = {}
    for h in v.hands:
        bars = []
        for m, b in enumerate(v.bars):
            if b.beats != 3 or b.beat_type not in (2, 4, 8) or b.offset > EPS:
                continue
            evs = bar_events(v, h, m)
            if len(evs) != 3 or not _even(evs, 0.0, b.full):
                continue
            e0, e1, e2 = evs
            if _is_chord(e1) and _is_chord(e2) and _is_bass(e0, e1) and _is_bass(e0, e2):
                bars.append(m)
        out[h] = bars
    return _result(v, out, 2)


def _oompah_bar(evs: list[Ev], b: Bar) -> list[tuple[Ev, Ev]] | None:
    """The bass-chord pairs of an oom-pah bar, or None: an even number of events filling a
    duple bar at one spacing, alternating a bass (one or two notes) and a chord above it."""
    duple = (not b.compound and b.beats in (2, 4)) or (b.compound and b.beats in (6, 12))
    if not duple or b.offset > EPS or len(evs) < 2 or len(evs) % 2 or not _even(evs, 0.0, b.full):
        return None
    pairs = []
    for k in range(0, len(evs), 2):
        bass, chord = evs[k], evs[k + 1]
        if not (_is_chord(chord) and _is_bass(bass, chord)):
            return None
        pairs.append((bass, chord))
    return pairs


def _oompah(v: View):
    out, reach = {}, {}
    for h in v.hands:
        bars = []
        for m, b in enumerate(v.bars):
            pairs = _oompah_bar(bar_events(v, h, m), b)
            if pairs:
                bars.append(m)
                # the widest reach in the bar: lowest bass note to highest chord note of a pair
                reach[(h, m)] = max(c.high - bs.low for bs, c in pairs)
        out[h] = bars
    return out, reach


@measures("texture.oom-pah")
def oom_pah(sc: S.Score) -> Result:
    v = view(sc)
    r = _short(v, 2, "an oom-pah bass over two bars")
    if r:
        return r
    out, reach = _oompah(v)
    return _result(v, out, 2, leap_bars=sum(1 for x in reach.values() if x > 12))


@measures("texture.stride")
def stride(sc: S.Score) -> Result:
    v = view(sc)
    r = _short(v, 2, "a stride bass over two bars")
    if r:
        return r
    out, reach = _oompah(v)
    wide = {h: [m for m in bars if reach[(h, m)] > 12] for h, bars in out.items()}
    return _result(v, wide, 2)


# --------------------------------------------------------------------------- boogie
#: Semitones above the figure's root a boogie bass uses: the root, minor and major third,
#: fourth and sharp fourth (only as a walk to the fifth), fifth, sharp fifth (only as a walk
#: to the sixth), sixth and flat seventh. A second (2), a flat second (1) or a major seventh
#: (11) means another harmony or another style.
BOOGIE_TONES = {0, 3, 4, 5, 6, 7, 8, 9, 10}


def _two_per_beat(evs: list[Ev], b: Bar) -> bool:
    """Two onsets on every beat of a four-beat bar: on the beat, and halfway, two-thirds or
    three-quarters through it (straight, triplet or dotted swing)."""
    if b.n_beats != 4 or b.offset > EPS or abs(b.length - b.full) > EPS or len(evs) != 8:
        return False
    p = b.beat_len
    for k in range(4):
        a, c = evs[2 * k], evs[2 * k + 1]
        if abs(a.pos - k * p) > EPS:
            return False
        f = (c.pos - k * p) / p
        if not any(abs(f - x) < 0.02 for x in (0.5, 2 / 3, 0.75)):
            return False
    return True


def _boogie_bars(v: View) -> dict:
    out = {}
    alb = _alberti_bars(v)
    for h in v.hands:
        cands = {}
        for m, b in enumerate(v.bars):
            evs = bar_events(v, h, m)
            if not _two_per_beat(evs, b) or any(len(e.pitches) > 2 for e in evs) or m in alb.get(h, []):
                continue
            low = min(e.low for e in evs)
            t0 = v.sc.measure_starts[m]
            others = sounding(v, t0, t0 + b.length, exclude=h)
            if others and min(others) < low:
                continue  # not the bass line
            root = evs[0].low
            if root != low:
                continue  # the figure starts on its root, the bottom of the bar (one chord a bar)
            rel ={(p - root) % 12 for e in evs for p in e.pitches}
            if len({p for e in evs for p in e.pitches}) < 2:
                continue
            if not rel <= BOOGIE_TONES:
                continue  # a second harmony in the bar, or a tone no boogie figure uses
            if 5 in rel and 6 not in rel:
                continue  # the fourth only as a chromatic walk (4-#4-5); else it is IV over the root (G-B-D-B G-C-E-C)
            if 8 in rel and 9 not in rel:
                continue  # the sharp fifth only on the way to the sixth (Pinetop's 5-#5-6 shuffle)
            colour = bool(rel & {9, 10}) or (rel <= {0, 7} and (root + 10) % 12 in {p % 12 for p in others})
            if not colour:
                continue
            shape = tuple(tuple(p - root for p in e.pitches) for e in evs)
            cands[m] = (shape, root)
        by_shape = collections.defaultdict(list)
        for m, (shape, root) in cands.items():
            by_shape[shape].append((m, root))
        bars = []
        for shape, ms in by_shape.items():
            roots = {r % 12 for _, r in ms}
            fourth = any((a - c) % 12 in (5, 7) for a in roots for c in roots)
            sixth = any(9 in {(p % 12) for p in ev} for ev in shape)
            if fourth or len(ms) >= 4 or (sixth and len(ms) >= 2):
                bars.extend(m for m, _ in ms)
        # a boogie bass keeps going: only bars next to another boogie bar count
        bs = set(bars)
        out[h] = sorted(m for m in bs if m - 1 in bs or m + 1 in bs)
    return out


@measures("texture.boogie-bass")
def boogie_bass(sc: S.Score) -> Result:
    v = view(sc)
    r = _short(v, 2, "a boogie bass over two bars")
    return r or _result(v, _boogie_bars(v), 2)


# --------------------------------------------------------------------------- ostinato
@measures("texture.ostinato")
def ostinato(sc: S.Score) -> Result:
    v = view(sc)
    r = _short(v, 4, "a figure repeated for four bars")
    if r:
        return r
    out, longest = {}, 0
    for h in v.hands:
        sig = []
        for m in range(v.n_bars):
            evs = bar_events(v, h, m)
            s = tuple((round(e.pos, 3), e.pitches) for e in evs)
            figure = len(evs) >= 3 or (len(evs) >= 2 and len({p for e in evs for p in e.pitches}) >= 2)
            sig.append(s if figure else None)
        bars: set[int] = set()
        for unit in (1, 2):
            m = 0
            while m + unit <= v.n_bars:
                block = sig[m:m + unit]
                if any(x is None for x in block):
                    m += 1
                    continue
                k = m + unit
                while k + unit <= v.n_bars and sig[k:k + unit] == block:
                    k += unit
                # persistent: a bar four times, or two bars three times (a two-bar phrase
                # sung twice, as Silent Night's opening is, is a repeated phrase)
                if (k - m) // unit >= (4 if unit == 1 else 3):
                    bars.update(range(m, k))
                    longest = max(longest, k - m)
                    m = k
                else:
                    m += 1
        out[h] = sorted(bars)
    return _result(v, out, 4, longest=longest)


# --------------------------------------------------------------------------- pedal point
def _harmony(v: View, t0: float, t1: float) -> list[int]:
    """The pitches that make the harmony of [t0, t1): those struck twice or more in it, or
    sounding for at least a third of it. A passing note of a run (each scale note once, for a
    quarter of the window) is left out; a broken chord's repeated tones and held notes stay."""
    out = []
    span = t1 - t0
    for a in v.notes.values():
        mask = (a["onset"] < t1 - EPS) & (a["end"] > t0 + EPS)
        if not mask.any():
            continue
        on, end, p = a["onset"][mask], a["end"][mask], a["pitch"][mask]
        dur = np.minimum(end, t1) - np.maximum(on, t0)
        struck = collections.Counter(p[(on >= t0 - EPS)].tolist())
        sounding_for = collections.defaultdict(float)
        for x, d in zip(p.tolist(), dur.tolist()):
            sounding_for[x] += d
        out.extend(x for x in sounding_for if struck[x] >= 2 or sounding_for[x] >= span / 3 - EPS)
    return out


@measures("texture.pedal-point")
def pedal_point(sc: S.Score) -> Result:
    v = view(sc)
    r = _short(v, 2, "a bass held or repeated over two bars")
    if r:
        return r
    starts = sc.measure_starts
    beats = []  # harmony windows: (bar, bass pitch class or None, upper pitch classes)
    for m, b in enumerate(v.bars):
        t0 = starts[m]
        # the window: half a bar of an even number of beats, else the bar
        wl = b.full / 2 if b.n_beats % 2 == 0 else b.full
        k = 0.0
        while k < b.full - EPS:
            a0, a1 = max(t0 + k - b.offset, t0), t0 + k - b.offset + wl
            if a1 > t0 + EPS:
                ps = _harmony(v, a0, a1)
                if ps:
                    low = min(ps)
                    beats.append((m, low % 12, {p % 12 for p in ps} - {low % 12}))
                else:
                    beats.append((m, None, set()))
            k += wl
    found: set[int] = set()
    i = 0
    while i < len(beats):
        pc = beats[i][1]
        j = i
        while j + 1 < len(beats) and pc is not None and beats[j + 1][1] == pc:
            j += 1
        span = beats[i:j + 1]
        bars = sorted({x[0] for x in span})
        full_bars = [m for m in bars if all(x[1] == pc for x in beats if x[0] == m)]
        if pc is not None and len(full_bars) >= 2:
            # u leaves the bass's pitch class out: a full triad in it is a harmony of its own,
            # and it is foreign to the pedal when the pedal is no tone of a chord built on that
            # triad (C under E-G-B flat is C7, not a pedal; C under G-B-D is; G under B-D-F with
            # a passing C is G7)
            if any(not fits_chord(t | {pc}) for _, _, u in span for t in full_triads(u)):
                found.update(full_bars)
        i = j + 1
    bars = sorted(found)
    present = len(bars) >= 2
    value = {"present": present, "bars": len(bars), "share": round(len(bars) / max(1, v.n_bars), 3)}
    return Result(value=value, provenance="exact", where=bars)


# --------------------------------------------------------------------------- four to the bar
@measures("texture.four-to-the-bar")
def four_to_the_bar(sc: S.Score) -> Result:
    v = view(sc)
    r = _short(v, 2, "a chord on every beat over two bars")
    if r:
        return r
    out = {}
    for h in v.hands:
        bars = []
        for m, b in enumerate(v.bars):
            if b.n_beats != 4 or b.offset > EPS:
                continue
            evs = bar_events(v, h, m)
            if len(evs) != 4 or not _even(evs, 0.0, b.full) or not all(_is_chord(e) for e in evs):
                continue
            lows = [e.low for e in evs]
            # one register (lowest notes within a fifth: a bass dyad an octave under the chords
            # is a bass, as in a tango's G2-D3 under G3-B flat 3-D4), and a comp repeats its harmony
            if max(lows) - min(lows) > 7 or len({e.pitches for e in evs}) > 2:
                continue
            bars.append(m)
        out[h] = bars
    return _result(v, out, 2)


# --------------------------------------------------------------------------- melody in chords
@measures("texture.melody-in-chords")
def melody_in_chords(sc: S.Score) -> Result:
    v = view(sc)
    r = _short(v, 2, "a melody carried in chords")
    if r:
        return r
    out = {}
    for h, evs in v.hands.items():
        top = []
        for e in evs:
            above = [p for p in sounding(v, e.onset, e.onset + EPS * 2, exclude=h) if p > e.high]
            top.append(not above)
        bars: set[int] = set()
        i = 0
        while i < len(evs):
            if not top[i]:
                i += 1
                continue
            j = i
            while j + 1 < len(evs) and top[j + 1]:
                j += 1
            run = evs[i:j + 1]
            # windows of at least four events in the run
            for s in range(0, max(0, len(run) - 3)):
                w = run[s:s + 4]
                chords = [e for e in w if _is_chord(e)]
                if len(chords) < 3:
                    continue
                if sum(1 for e in w if len(e.pitches) >= 3) < 2:
                    continue  # two-note events are double notes or two voices in a hand, not chords
                if w[-1].onset - w[0].onset > 1.5 * v.bars[w[0].bar].full + EPS:
                    continue  # a chord a bar or slower is a harmony held, not a melody
                moves = sum(1 for a, c in zip(w, w[1:]) if a.high != c.high)
                if moves >= 2:
                    bars.update(e.bar for e in w)
            i = j + 1
        out[h] = sorted(bars)
    return _result(v, out, 2)


# --------------------------------------------------------------------------- tremolo in thirds
def _tremolo_marks(v: View) -> list[tuple[str, int, int]]:
    """Notes carrying a tremolo mark, as (hand, bar, partner interval): the interval to a note
    struck with it in the same hand, or to the next marked note (a two-note tremolo)."""
    import partitura as pt  # noqa: F401  (the marks live on partitura's note objects)

    sc = v.sc
    out = []
    for pi, part in enumerate(sc.part_score.parts):
        q = part.quarter_map
        marked = [n for n in part.notes_tied if "tremolo" in (getattr(n, "ornaments", None) or [])]
        for k, n in enumerate(marked):
            if sc.parts == 1 and sc.staves <= 1:
                h = "L" if sc.item.get("hands") == "left" else "R"
            elif sc.parts >= 2 and sc.staves <= 1:
                h = "R" if pi == 0 else "L"
            else:
                h = "R" if (n.staff or 1) == 1 else "L"
            on = float(q(n.start.t))
            m = int(np.clip(np.searchsorted(np.array(sc.measure_starts), on, side="right") - 1, 0, len(sc.measure_starts) - 1))
            same = [e for e in bar_events(v, h, m) if abs(e.onset - on) < EPS]
            partners = [p for e in same for p in e.pitches if p != n.midi_pitch]
            if not partners and k + 1 < len(marked):
                partners = [marked[k + 1].midi_pitch]
            for p in partners:
                out.append((h, m, abs(p - n.midi_pitch)))
    return out


@measures("texture.tremolo-thirds")
def tremolo_thirds(sc: S.Score) -> Result:
    v = view(sc)
    if v.unknown:
        return Result.unknown_because(v.unknown)
    out: dict = {h: set() for h in v.hands}
    marks = 0
    for h, evs in v.hands.items():
        i = 0
        while i < len(evs) - 1:
            a, b = evs[i], evs[i + 1]
            third = abs(b.low - a.low) in (3, 4) and abs(b.letters[0] - a.letters[0]) == 2  # written as a third
            if not (a.single and b.single and third and b.onset - a.onset <= 0.5 + EPS):
                i += 1
                continue
            j = i + 1
            while (j + 1 < len(evs) and evs[j + 1].single and evs[j + 1].low == evs[j - 1].low
                   and evs[j + 1].onset - evs[j].onset <= 0.5 + EPS):
                j += 1
            if j - i + 1 >= 6:
                # a bar counts where the tremolo is, not where one note of it spills over
                per = collections.Counter(e.bar for e in evs[i:j + 1])
                out[h].update(m for m, c in per.items() if c >= 4)
                i = j
            else:
                i += 1
    for h, m, iv in _tremolo_marks(v):
        if iv in (3, 4):
            out.setdefault(h, set()).add(m)
            marks += 1
    return _result(v, {h: sorted(b) for h, b in out.items()}, 1, marked=marks)


# --------------------------------------------------------------------------- crushed note
@measures("texture.crushed-note")
def crushed_note(sc: S.Score) -> Result:
    v = view(sc)
    if v.unknown:
        return Result.unknown_because(v.unknown)
    out: dict = {h: set() for h in v.hands}
    count = 0
    graces = collections.defaultdict(list)
    for h, on, p, m in v.graces:
        graces[(h, round(on, 3))].append(p)
    for (h, on), ps in graces.items():
        evs = [e for e in v.hands.get(h, []) if abs(e.onset - on) < 2 * EPS]
        if not evs:
            continue
        e = evs[0]
        if len(e.pitches) < 2:
            continue  # the main note is not part of a chord in that hand
        for g in ps:
            slide = [x for x in ps if x != g and g - 2 <= x <= g]
            if g + 1 in e.pitches and not slide:
                out[h].add(e.bar)
                count += 1
    return _result(v, {h: sorted(b) for h, b in out.items()}, 1, count=count)


# --------------------------------------------------------------------------- stop-time
def _keeps_time(evs: list[Ev], b: Bar) -> bool:
    if len(evs) >= 2:
        return True
    return bool(evs) and evs[0].end - evs[0].onset >= 0.5 * b.length - EPS


@measures("texture.stop-time")
def stop_time(sc: S.Score) -> Result:
    v = view(sc)
    r = _short(v, 4, "stop-time hits against time kept elsewhere")
    if r:
        return r
    if len(v.hands) < 2:
        return Result(value={"present": False, "bars": 0, "share": 0.0, "hands": []}, provenance="exact")
    starts = sc.measure_starts
    out = {}
    # the accompaniment: the hand that sits lower
    acc = min(v.hands, key=lambda h: float(np.median(v.notes[h]["pitch"])) if len(v.notes[h]["pitch"]) else 999)
    for h in [acc]:
        stops, timed = [], 0
        for m, b in enumerate(v.bars):
            evs = bar_events(v, h, m)
            if _keeps_time(evs, b):
                timed += 1
            if len(evs) != 1 or abs(evs[0].pos) > EPS or b.offset > EPS:
                continue
            hit = evs[0]
            if hit.end - hit.onset > b.beat_len + EPS:
                continue
            t0 = starts[m]
            after = [n for o, a in v.notes.items() if o != h
                     for n in a["onset"][(a["onset"] > hit.end - EPS) & (a["onset"] < t0 + b.length - EPS)].tolist()]
            if after:
                stops.append(m)
        # chains of hits on each bar or every other bar; the bar between two hits a bar apart
        # is silent in that hand (a bar that keeps time between them is the normal time, as a
        # Classical left hand alternating a figure bar and a cadence note is); three hits at
        # least, so the attacks are regular
        chained: set[int] = set()
        chain = stops[:1]
        for a, c in zip(stops, stops[1:]):
            if c - a == 1 or (c - a == 2 and not bar_events(v, h, a + 1)):
                chain.append(c)
                continue
            if len(chain) >= 3:
                chained.update(chain)
            chain = [c]
        if len(chain) >= 3:
            chained.update(chain)
        others = v.n_bars - len(chained)
        keeps = timed >= 0.5 * max(1, others)
        out[h] = sorted(chained) if keeps else []
    return _result(v, out, 3)
