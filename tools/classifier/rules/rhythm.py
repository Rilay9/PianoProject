"""
Rhythm-cell and style-pattern rules. docs/classifier/rules/rhythm.md holds each definition, its source
or the catalogue validation behind it, its examples and near-misses, and when it answers UNKNOWN.

Every rule reads notes only through `score.load` (partitura's note array, the one hand rule) and
returns a `Result`: `{"present", "bars", ...}` with `where` (0-based measure indices of the bars that
hold the figure), or UNKNOWN with the reason. The rules state onsets, never the style: a bar that holds
the son clave's onsets holds them; that the piece is a son, that it suits teaching the clave, or that a
learner plays it with its feel are not facts these rules find (as CD1 said of the habanera).

Shared conventions, the same as the app's `cellBars` (app/src/demands/detect.ts) where they apply:
- onsets are a hand's distinct onsets in a printed bar, as exact fractions of the bar; chords and
  voices merge; a tie chain is one note (partitura's note array), so a bar entered by a tie has no
  onset at its start; grace notes (zero duration in the array) are left out;
- a pickup bar, and any bar shorter or longer than its time signature, is never read;
- exact equality, never "contains", unless a rule says otherwise;
- a figure is a pattern, and "present", when it holds in two consecutive bars (or cycles) or in four
  anywhere (`repeated`): one bar is an incident. The count is reported either way.

The habanera and tresillo sets are imported from `tools/content/cells.py` (the build's statement of
the CD1 definitions), never restated here.
"""
from __future__ import annotations

import bisect
import re
import sys
from collections import Counter, defaultdict
from fractions import Fraction
from math import gcd
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import score as S  # noqa: E402

sys.path.insert(0, str(S.ROOT / "tools/content"))
from cells import HABANERA, TRESILLO  # noqa: E402  (the CD1 sets, one statement)

#: A figure in this many bars (or cycles) anywhere is a pattern; two consecutive ones are too.
MIN_SCATTERED = 4


def repeated(units: list[list[int]]) -> bool:
    """`units` are the matched bars or cycles (each a list of consecutive bars), in order."""
    if len(units) >= MIN_SCATTERED:
        return True
    return any(b[0] == a[-1] + 1 for a, b in zip(units, units[1:]))


# --------------------------------------------------------------------------- the shared reading
def _frac(x: float) -> Fraction:
    return Fraction(float(x)).limit_denominator(192)


class Bars:
    """
    One item read bar by bar: for each bar its metre, start and length in quarters, whether it is
    readable (full length, not a pickup), and per hand the distinct onsets (quarters from the bar
    start, exact) with the pitches starting there and the longest duration from there.
    """

    def __init__(self, sc: S.Score):
        self.sc = sc
        n = sc.notes
        self.metre: dict[int, tuple[int, int]] = {}
        self.start: dict[int, Fraction] = {}
        self.length: dict[int, Fraction] = {}
        self.readable: set[int] = set()
        self.onsets: dict[str, dict[int, dict[Fraction, list[int]]]] = {"R": defaultdict(dict), "L": defaultdict(dict)}
        self.durations: dict[str, dict[int, dict[Fraction, Fraction]]] = {"R": defaultdict(dict), "L": defaultdict(dict)}
        self.hands_present: set[str] = set()
        if not len(n):
            return
        starts = [_frac(s) for s in sc.measure_starts]
        for i in np.nonzero(n["duration_quarter"] > 0)[0]:  # grace notes have no duration in the array
            m = int(sc.measure[i])
            if m < 0 or m >= len(starts):
                continue
            if m not in self.metre:
                self.metre[m] = (int(n["ts_beats"][i]), int(n["ts_beat_type"][i]))
            h = str(sc.hand[i])
            self.hands_present.add(h)
            o = _frac(n["onset_quarter"][i]) - starts[m]
            self.onsets[h][m].setdefault(o, []).append(int(n["pitch"][i]))
            d = _frac(n["duration_quarter"][i])
            self.durations[h][m][o] = max(self.durations[h][m].get(o, Fraction(0)), d)
        last = None
        for m in range(len(starts)):
            if m in self.metre:
                last = self.metre[m]
            elif last is not None:
                self.metre[m] = last
            if m not in self.metre:
                continue
            b, t = self.metre[m]
            full = Fraction(4 * b, t)
            self.start[m] = starts[m]
            self.length[m] = full
            actual = starts[m + 1] - starts[m] if m + 1 < len(starts) else full
            if actual == full and not (m == 0 and sc.pickup):
                self.readable.add(m)

    def fractions(self, hand: str, m: int) -> frozenset:
        """The hand's distinct onsets in bar m as fractions of the bar."""
        return frozenset(o / self.length[m] for o in self.onsets[hand].get(m, {}))

    def chordal(self, hand: str, m: int) -> bool:
        """Every onset of the hand in bar m starts two or more pitches."""
        on = self.onsets[hand].get(m, {})
        return bool(on) and all(len(set(p)) >= 2 for p in on.values())

    def bars_in(self, metres) -> list[int]:
        return sorted(m for m in self.readable if self.metre[m] in metres)

    def bar_at(self, quarter: float) -> int:
        """The 0-based measure a time in quarters falls in (-1 before the first)."""
        return bisect.bisect_right(self.sc.measure_starts, quarter + 1e-6) - 1


def bars_of(sc: S.Score) -> Bars:
    cached = getattr(sc, "_rhythm_bars", None)
    if cached is None:
        cached = Bars(sc)
        sc._rhythm_bars = cached  # a per-Score cache; the Score is a plain dataclass
    return cached


def _no_notes(sc: S.Score) -> S.Result | None:
    return S.Result.unknown_because("no notes") if not len(sc.notes) else None


def _bars_result(bars: list[int], **extra) -> S.Result:
    where = sorted(set(bars))
    return S.Result(value={"present": repeated([[m] for m in where]), "bars": len(where), **extra},
                    provenance="exact", where=where)


# --------------------------------------------------------------------------- one-bar onset cells
CELL_METRES = {(2, 4), (4, 4), (2, 2)}  # the habanera's published 2/4 and its doubled form (CD1)
FOUR_METRES = {(4, 4), (2, 2)}

CHARLESTON = frozenset({Fraction(0), Fraction(3, 8)})
TUMBAO = frozenset({Fraction(3, 8), Fraction(3, 4)})
BOSSA_BASS = frozenset({Fraction(0), Fraction(3, 8), Fraction(1, 2), Fraction(7, 8)})


def _cell_bars(b: Bars, hand: str, cell: frozenset, metres, chordal: bool = False) -> list[int]:
    return [m for m in b.bars_in(metres) if b.fractions(hand, m) == cell and (not chordal or b.chordal(hand, m))]


@S.measures("texture.charleston")
def charleston(sc: S.Score) -> S.Result:
    """Chords on exactly beat 1 and the and-of-2 of a 4/4 or 2/2 bar, in either hand."""
    if (r := _no_notes(sc)):
        return r
    b = bars_of(sc)
    if not b.bars_in(FOUR_METRES):
        return S.Result.unknown_because("no readable bar in 4/4 or 2/2, the metres the Charleston is defined in")
    hands = {h: _cell_bars(b, h, CHARLESTON, FOUR_METRES, chordal=True) for h in "RL"}
    return _bars_result(hands["R"] + hands["L"], hand={h: len(v) for h, v in hands.items() if v})


def _held_over(b: Bars, hand: str, m: int, at: Fraction) -> bool:
    """The hand's note starting at fraction `at` of bar m sounds past the barline (the anticipation)."""
    o = at * b.length[m]
    d = b.durations[hand].get(m, {}).get(o)
    return d is not None and o + d > b.length[m]


@S.measures("texture.tumbao")
def tumbao(sc: S.Score) -> S.Result:
    """Left-hand onsets exactly the tresillo's two offbeats, 3/8 and 3/4 of the bar, the downbeat empty."""
    if (r := _no_notes(sc)):
        return r
    b = bars_of(sc)
    if "L" not in b.hands_present:
        return S.Result.unknown_because("no left hand: the tumbao is a bass figure")
    if not b.bars_in(CELL_METRES):
        return S.Result.unknown_because("no readable bar in 2/4, 4/4 or 2/2, the metres the cell is defined in")
    bars = _cell_bars(b, "L", TUMBAO, CELL_METRES)
    return _bars_result(bars, held_over=sum(1 for m in bars if _held_over(b, "L", m, Fraction(3, 4))))


# --------------------------------------------------------------------------- the clave: a 16-pulse cycle
#: Pulses of the 16-pulse cycle (Wikipedia, "Clave (rhythm)": son 3-2 X..X..X...X.X..., rumba 3-2
#: X..X...X..X.X..., the bossa nova clave the son with the two-side's second stroke one pulse late);
#: 2-3 is the same cycle started at its two-side (pulse 8).
CLAVES: dict[str, frozenset] = {
    "son-3-2": frozenset({0, 3, 6, 10, 12}),
    "rumba-3-2": frozenset({0, 3, 7, 10, 12}),
    "bossa": frozenset({0, 3, 6, 10, 13}),
}
for _k in ("son", "rumba"):
    CLAVES[f"{_k}-2-3"] = frozenset((p + 8) % 16 for p in CLAVES[f"{_k}-3-2"])
CLAVE_METRES = {(2, 4), (4, 4), (2, 2)}


def _cycles(b: Bars, hand: str):
    """
    Every span of consecutive readable bars of one metre in CLAVE_METRES lasting 4 quarters (the cycle
    on sixteenths: one 4/4 or 2/2 bar, two 2/4 bars) or 8 quarters (the cycle on eighths, the cut-time
    practice: two 4/4 or 2/2 bars), with the hand's onsets as pulses 0-15, or None where an onset falls
    between pulses. Yields (bars, pulses).
    """
    ms = b.bars_in(CLAVE_METRES)
    have = set(ms)
    for m in ms:
        for span in (Fraction(4), Fraction(8)):
            bars, total, k = [], Fraction(0), m
            while total < span and k in have and b.metre[k] == b.metre[m]:
                bars.append(k)
                total += b.length[k]
                k += 1
            if total != span:
                continue
            unit = span / 16
            pulses, ok, offset = set(), True, Fraction(0)
            for x in bars:
                for o in b.onsets[hand].get(x, {}):
                    p = (offset + o) / unit
                    if p.denominator != 1 or not 0 <= p < 16:
                        ok = False
                        break
                    pulses.add(int(p))
                offset += b.length[x]
                if not ok:
                    break
            yield bars, (frozenset(pulses) if ok else None)


def _clave_matches(b: Bars, hand: str, test) -> list[tuple[list[int], str, frozenset]]:
    """Non-overlapping cycles whose pulses pass `test(pulses) -> kind or None`, scanned from the start."""
    out, used = [], set()
    for bars, pulses in _cycles(b, hand):
        if pulses is None or used.intersection(bars):
            continue
        kind = test(pulses)
        if kind:
            out.append((bars, kind, pulses))
            used.update(bars)
    return out


def _clave_exact(pulses: frozenset) -> str | None:
    return next((k for k, v in CLAVES.items() if pulses == v), None)


def _cycles_result(found: list[tuple[list[int], str, frozenset]], **extra) -> S.Result:
    found = sorted(found, key=lambda f: f[0][0])
    bars = sorted({x for bs, _, _ in found for x in bs})
    return S.Result(value={"present": repeated([bs for bs, _, _ in found]), "bars": len(bars), "cycles": len(found),
                           "kinds": dict(Counter(k for _, k, _ in found)), **extra}, provenance="exact", where=bars)


@S.measures("texture.clave")
def clave(sc: S.Score) -> S.Result:
    """A hand whose onsets over one cycle are exactly a son, rumba or bossa clave, 3-2 or 2-3."""
    if (r := _no_notes(sc)):
        return r
    b = bars_of(sc)
    if not b.bars_in(CLAVE_METRES):
        return S.Result.unknown_because("no readable bar in 2/4, 4/4 or 2/2, the duple metres the clave is defined in")
    r_, l_ = _clave_matches(b, "R", _clave_exact), _clave_matches(b, "L", _clave_exact)
    return _cycles_result(r_ if len(r_) >= len(l_) else l_)


#: The montuno is aligned to the Cuban claves (son, rumba); the bossa clave is Brazilian.
MONTUNO_CLAVES = {k: v for k, v in CLAVES.items() if not k.startswith("bossa")}
#: At most half the cycle's pulses: a running line contains every clave and aligns to none
#: (measured on the catalogue: ragtime and Chopin running figures, docs/classifier/rules/rhythm.md).
MONTUNO_MAX_PULSES = 8


@S.measures("texture.montuno")
def montuno(sc: S.Score) -> S.Result:
    """
    A repeated syncopated chordal figure aligned to a son or rumba clave: in one hand, a cycle whose
    onsets contain every stroke of the clave, that has an onset off the beat with no onset on the next
    pulse (syncopated), that sounds on at most half the cycle's pulses (not a running line), that has
    chords at half its onsets or more, and that repeats exactly in the next or previous cycle.
    """
    if (r := _no_notes(sc)):
        return r
    b = bars_of(sc)
    if not b.bars_in(CLAVE_METRES):
        return S.Result.unknown_because("no readable bar in 2/4, 4/4 or 2/2, the duple metres the clave is defined in")
    best: list = []
    for hand in "RL":
        cyc = [(bars, p) for bars, p in _cycles(b, hand) if p is not None]

        def test(p: frozenset) -> str | None:
            if len(p) > MONTUNO_MAX_PULSES or not any(q % 2 == 1 and (q + 1) % 16 not in p for q in p):
                return None
            return next((k for k, v in MONTUNO_CLAVES.items() if v <= p), None)

        found = []
        for bars, kind, pulses in _clave_matches(b, hand, test):
            neighbours = [p for bs, p in cyc if len(bs) == len(bars) and (bs[0] == bars[-1] + 1 or bs[-1] + 1 == bars[0])]
            if pulses not in neighbours:
                continue
            chords = sum(1 for x in bars for ps in b.onsets[hand].get(x, {}).values() if len(set(ps)) >= 2)
            if chords * 2 >= len(pulses):
                found.append((bars, kind, pulses))
        if len(found) > len(best):
            best = found
    return _cycles_result(best)


@S.measures("texture.bossa")
def bossa(sc: S.Score) -> S.Result:
    """
    The bossa nova comp: a hand whose onsets over a cycle are exactly the bossa clave, as a pattern.
    The surdo bass (left-hand onsets exactly 1, the and-of-2, 3 and the and-of-4 of a 4/4 or 2/2 bar)
    is counted beside it and never decides presence alone: the same onsets are a dotted-quarter-eighth
    bass in Mozart, Schumann and Joplin (measured, docs/classifier/rules/rhythm.md).
    """
    if (r := _no_notes(sc)):
        return r
    b = bars_of(sc)
    if not b.bars_in(CLAVE_METRES):
        return S.Result.unknown_because("no readable bar in 2/4, 4/4 or 2/2, the metres the bossa is defined in")
    only = lambda p: "bossa" if p == CLAVES["bossa"] else None  # noqa: E731
    r_, l_ = _clave_matches(b, "R", only), _clave_matches(b, "L", only)
    bass = _cell_bars(b, "L", BOSSA_BASS, FOUR_METRES) if "L" in b.hands_present else []
    return _cycles_result(r_ if len(r_) >= len(l_) else l_, bass_bars=len(bass))


# --------------------------------------------------------------------------- tango
#: The marcato "en 4" sounds every quarter of the bar (quarters in 4/4, eighths in a 2/4 tango);
#: "en 2" the half bars.
MARCATO_4 = frozenset({Fraction(0), Fraction(1, 4), Fraction(1, 2), Fraction(3, 4)})
MARCATO_2 = frozenset({Fraction(0), Fraction(1, 2)})


@S.measures("texture.tango")
def tango(sc: S.Score) -> S.Result:
    """
    Tango accompaniment figures in the left hand: the 3-3-2 (the tresillo's onsets), the habanera, and
    the marcato en 4 or en 2. No repeated figure: not a tango accompaniment by its figures (exact).
    A repeated figure: UNKNOWN, because every one of them is also the habanera, the tresillo, the
    oom-pah or the march outside the tango (measured: Bizet's Habanera and Por Una Cabeza hold the same
    habanera bars; Joplin's Combination March 52 marcato bars), so onsets do not decide a tango.
    """
    if (r := _no_notes(sc)):
        return r
    b = bars_of(sc)
    if "L" not in b.hands_present:
        return S.Result.unknown_because("no left hand: the tango figures are accompaniment figures")
    ms = b.bars_in(CELL_METRES)
    if not ms:
        return S.Result.unknown_because("no readable bar in 2/4, 4/4 or 2/2, the metres the figures are defined in")
    figs = [m for m in ms if b.fractions("L", m) in (TRESILLO, HABANERA, MARCATO_4, MARCATO_2)]
    if repeated([[m] for m in figs]):
        return S.Result.unknown_because(
            "tango figures in the left hand (3-3-2, habanera or marcato), which the habanera, the tresillo, "
            "the oom-pah and the march share outside the tango: onsets do not decide a tango accompaniment")
    return S.Result(value={"present": False, "bars": 0}, provenance="exact")


# --------------------------------------------------------------------------- mazurka
ACCENTS = {"accent", "strong-accent"}


def mazurka_bar(b: Bars, m: int) -> bool:
    """
    The right hand's onsets in a 3/4 bar are the mazurka figure: beat 1 divided (a triplet, a dotted
    eighth pair or an eighth pair) before two quarter notes: onsets 0, at least one inside the first
    beat, then exactly beats 2 and 3, the note on beat 2 a quarter long.
    """
    on = sorted(b.onsets["R"].get(m, {}))
    if not on or on[0] != 0:
        return False
    first = [o for o in on if 0 < o < 1]
    rest = [o for o in on if o >= 1]
    return bool(first) and rest == [Fraction(1), Fraction(2)] and b.durations["R"][m].get(Fraction(1)) == 1


def _accented_off_beat(sc: S.Score, b: Bars) -> tuple[int, set[int]]:
    """(accent marks in the item, the 3/4 bars with an accent mark on a note off beat 1)."""
    total, bars = 0, set()
    for part in sc.part_score.parts:
        q = part.quarter_map
        for n in part.notes_tied:
            if not set(getattr(n, "articulations", None) or []) & ACCENTS:
                continue
            total += 1
            t = float(q(n.start.t))
            m = b.bar_at(t)
            if m in b.readable and b.metre[m] == (3, 4) and t - float(b.start[m]) > 1e-6:
                bars.add(m)
    return total, bars


@S.measures("texture.mazurka")
def mazurka(sc: S.Score) -> S.Result:
    """
    The mazurka rhythm: a 3/4 bar holding both features the definition names, the figure (beat 1
    divided before two quarter notes) in the right hand and an accent mark off beat 1, as a pattern.
    UNKNOWN when the item carries no accent mark at all (the accent half cannot be read), and when the
    figure is a pattern without the accent in its bars (the figure alone is shared with the waltz, the
    minuet and the polonaise: measured, docs/classifier/rules/rhythm.md). Absent when the figure
    itself is no pattern.
    """
    if (r := _no_notes(sc)):
        return r
    b = bars_of(sc)
    if "R" not in b.hands_present:
        return S.Result.unknown_because("no right hand: the figure is read in the tune")
    ms = b.bars_in({(3, 4)})
    if not ms:
        return S.Result.unknown_because("no readable bar in 3/4, the metre the mazurka is defined in")
    figure = [m for m in ms if mazurka_bar(b, m)]
    total, accented = _accented_off_beat(sc, b)
    if total == 0:
        return S.Result.unknown_because("no accent marks notated: the accent half of the mazurka rhythm cannot be read")
    both = sorted(set(figure) & accented)
    result = _bars_result(both, figure_bars=len(figure))
    if not result.value["present"] and repeated([[m] for m in figure]):
        return S.Result.unknown_because("the figure without the accent off beat 1 in the same bars: a waltz, a minuet, "
                                        "a polonaise and a mazurka share the figure")
    return result


# --------------------------------------------------------------------------- shuffle
SWING_ON = re.compile(r"\b(swing|swung|shuffle)", re.I)
SWING_OFF = re.compile(r"\b(straight|even (8th|eighth)s?)", re.I)
TRIPLET_LS = frozenset({Fraction(0), Fraction(2, 3)})
DOTTED_LS = frozenset({Fraction(0), Fraction(3, 4)})
EVEN = frozenset({Fraction(0), Fraction(1, 2)})
SIMPLE = {(2, 4), (3, 4), (4, 4), (5, 4), (6, 4), (2, 2), (3, 2)}
#: Even eighth pairs in the hand that writes the dotted pairs: the score tells the two apart, so its
#: dotted pairs are literal (a dotted-shuffle notation writes every pair dotted).
LITERAL_EVEN_BEATS = 4


def _swing_marked(sc: S.Score, b: Bars) -> set[int]:
    """Bars under a swing or shuffle direction (a Words text), until a 'straight' direction."""
    import partitura as pt

    marks = []
    for part in sc.part_score.parts:
        q = part.quarter_map
        for w in part.iter_all(pt.score.Words):
            text = str(w.text or "")
            if SWING_OFF.search(text):
                marks.append((float(q(w.start.t)), False))
            elif SWING_ON.search(text):
                marks.append((float(q(w.start.t)), True))
    if not marks:
        return set()
    marks.sort()
    out = set()
    for m, st in b.start.items():
        state = False
        for t, on in marks:
            if t <= float(st) + 1e-6:
                state = on
        if state:
            out.add(m)
    return out


def _beat_shapes(b: Bars, hand: str, m: int) -> list[frozenset]:
    """The hand's onsets inside each beat of bar m as fractions of the beat (a quarter in a simple
    metre, a dotted quarter in 12/8)."""
    unit = Fraction(3, 2) if b.metre[m] == (12, 8) else Fraction(1)
    count = int(b.length[m] / unit)
    out = [set() for _ in range(count)]
    for o in b.onsets[hand].get(m, {}):
        k = int(o // unit)
        if k < count:
            out[k].add((o - k * unit) / unit)
    return [frozenset(s) for s in out]


@S.measures("rhythm.shuffle")
def shuffle(sc: S.Score) -> S.Result:
    """
    Long-short pairs on the beat in the triplet ratio, notated: the triplet quarter-eighth, the 12/8
    quarter-eighth, or even eighths under a swing or shuffle direction. A bar counts when one hand has
    two such beats or more (one even pair is enough under a direction), no more beats divided evenly,
    and no beat entered at its second triplet (a quarter-note triplet is not a shuffle). Dotted
    eighth-sixteenth pairs are counted apart: literal when the same hand also writes even pairs,
    UNKNOWN when they are the only long-short pairs (a dotted shuffle and a dotted rhythm look alike).
    """
    if (r := _no_notes(sc)):
        return r
    b = bars_of(sc)
    ms = sorted(m for m in b.readable if b.metre[m] in SIMPLE or b.metre[m] == (12, 8))
    if not ms:
        return S.Result.unknown_because("no readable bar in a simple metre or 12/8 (in 6/8 and 9/8 the long-short is the metre's own figure)")
    marked = _swing_marked(sc, b)
    kinds: dict[str, set[int]] = {"triplet": set(), "12/8": set(), "marked": set(), "dotted": set()}
    even_beats = Counter()
    dotted_hands = set()
    for m in ms:
        for hand in "RL":
            shapes = _beat_shapes(b, hand, m)
            if b.metre[m] == (12, 8):
                ls = sum(1 for s in shapes if s == TRIPLET_LS)
                if ls >= 2 and ls >= sum(1 for s in shapes if len(s) >= 3):
                    kinds["12/8"].add(m)
                continue
            ev = sum(1 for s in shapes if s == EVEN)
            even_beats[hand] += ev
            if m in marked:
                if ev >= 1:
                    kinds["marked"].add(m)
                continue
            late = any(Fraction(1, 3) in s and 0 not in s for s in shapes)
            tri = sum(1 for s in shapes if s == TRIPLET_LS)
            dot = sum(1 for s in shapes if s == DOTTED_LS)
            if tri >= 2 and tri >= ev and not late:
                kinds["triplet"].add(m)
            elif dot >= 2 and dot >= ev:
                kinds["dotted"].add(m)
                dotted_hands.add(hand)
    sure = sorted(kinds["triplet"] | kinds["12/8"] | kinds["marked"])
    counts = {k: len(v) for k, v in kinds.items() if v}
    present = repeated([[m] for m in sure])
    dotted = sorted(kinds["dotted"] - set(sure))
    literal = all(even_beats[h] >= LITERAL_EVEN_BEATS for h in dotted_hands)
    if not present and repeated([[m] for m in dotted]) and not literal:
        return S.Result.unknown_because("dotted eighth-sixteenth pairs only, never even pairs beside them: "
                                        "the notation of a dotted shuffle and of a straight dotted rhythm")
    return S.Result(value={"present": present, "bars": len(sure), "kinds": counts}, provenance="exact", where=sure)


# --------------------------------------------------------------------------- secondary rag
def _min_notes(per_beat: int) -> int:
    """The cell recurs until it is back on the beat (lcm of 3 and the notes per beat), three times at least."""
    return max(9, 3 * per_beat // gcd(3, per_beat))


@S.measures("rhythm.secondary-rag")
def secondary_rag(sc: S.Score) -> S.Result:
    """
    Berlin's secondary rag: an unsyncopated three-note melodic pattern repeated over the duple beat.
    In the right hand's top line, a run of beats each divided the same way into two or four onsets
    (even eighths or sixteenths, or a swung or dotted pair) whose pitches repeat with period three
    (p[i] == p[i+3]) and not period one, long enough to come back onto the beat (9 notes, 12 at four
    to the beat).
    """
    if (r := _no_notes(sc)):
        return r
    b = bars_of(sc)
    if "R" not in b.hands_present:
        return S.Result.unknown_because("no right hand: the pattern is read in the tune")
    duple = [m for m in sorted(b.readable) if b.metre[m] in {(2, 4), (4, 4), (2, 2), (4, 2)}]
    if not duple:
        return S.Result.unknown_because("no readable bar in 2/4, 4/4, 2/2 or 4/2: the pattern is defined over a duple beat")
    # beats in order: (bar, absolute beat start, shape, [(onset, top pitch)])
    beats = []
    for m in duple:
        unit = Fraction(4, b.metre[m][1])
        top = sorted((o, max(p)) for o, p in b.onsets["R"].get(m, {}).items())
        for k in range(int(b.length[m] / unit)):
            inside = [(o, p) for o, p in top if k * unit <= o < (k + 1) * unit]
            beats.append((m, b.start[m] + k * unit, frozenset((o - k * unit) / unit for o, _ in inside),
                          [p for _, p in inside], unit))
    hits, runs, i = set(), 0, 0
    while i < len(beats):
        shape = beats[i][2]
        if len(shape) not in (2, 4):
            i += 1
            continue
        j = i  # grow the run while the next beat follows on at once and is divided the same way
        while j + 1 < len(beats) and beats[j + 1][2] == shape and beats[j + 1][1] == beats[j][1] + beats[j][4]:
            j += 1
        notes = [(beats[x][0], p) for x in range(i, j + 1) for p in beats[x][3]]
        k = 0
        while k + 3 < len(notes):
            e = k
            while e + 3 < len(notes) and notes[e][1] == notes[e + 3][1]:
                e += 1
            length = (e - k) + 3
            if length >= _min_notes(len(shape)) and len({p for _, p in notes[k:k + 3]}) > 1:
                runs += 1
                hits.update(x for x, _ in notes[k:k + length])
                k = e + 3
            else:
                k += 1
        i = j + 1
    return S.Result(value={"present": runs >= 1, "bars": len(hits), "runs": runs}, provenance="exact", where=sorted(hits))


# --------------------------------------------------------------------------- build
LEVEL = {"pppp": 0, "ppp": 1, "pp": 2, "p": 3, "mp": 4, "mf": 5, "f": 6, "ff": 7, "fff": 8, "ffff": 9}
#: Density (notes per bar, the median of each half) must rise by this factor from the first half of
#: the span to the second.
BUILD_RISE = 1.25
#: A build is a section's rise, not a hairpin's swell: four bars at least.
BUILD_BARS = 4


def _dynamics(sc: S.Score):
    """(levels: [(quarter, level)], crescendos: [(start quarter, end quarter or None)])."""
    import partitura as pt

    levels, cresc = [], []
    for part in sc.part_score.parts:
        q = part.quarter_map
        for d in part.iter_all(pt.score.ConstantLoudnessDirection, include_subclasses=True):
            lv = LEVEL.get(str(getattr(d, "text", "") or "").strip().lower())
            if lv is not None:
                levels.append((float(q(d.start.t)), lv))
        for d in part.iter_all(pt.score.IncreasingLoudnessDirection, include_subclasses=True):
            cresc.append((float(q(d.start.t)), float(q(d.end.t)) if d.end is not None else None))
    return sorted(set(levels)), sorted(set(cresc), key=lambda x: (x[0], x[1] or 0.0))


@S.measures("texture.build")
def build(sc: S.Score) -> S.Result:
    """
    A build: across a span of four bars or more the notated dynamic rises (a crescendo hairpin or
    cresc. direction, or a louder level marked after a softer one) and the note density rises with it
    (notes per bar, both hands: the median of the span's second half a quarter above its first half's,
    the median so that one sparse opening bar does not make a rise).
    """
    if (r := _no_notes(sc)):
        return r
    b = bars_of(sc)
    levels, cresc = _dynamics(sc)
    if not levels and not cresc:
        return S.Result.unknown_because("no dynamics notated: the dynamic half of a build cannot be read")
    density = Counter(int(m) for m, d in zip(sc.measure, sc.notes["duration_quarter"]) if d > 0)
    spans = set()
    for st, en in cresc:
        if en is None:
            later = [t for t, _ in levels if t > st]
            en = later[0] if later else None
        if en is None:
            continue
        a, z = b.bar_at(st), b.bar_at(en)
        if a >= 0 and z - a + 1 >= BUILD_BARS:
            spans.add((a, z))
    for (t0, l0), (t1, l1) in zip(levels, levels[1:]):
        a, z = b.bar_at(t0), b.bar_at(t1)
        if l1 > l0 and a >= 0 and z - a + 1 >= BUILD_BARS:
            spans.add((a, z))
    hits, n = set(), 0
    for a, z in sorted(spans):
        bars = list(range(a, z + 1))
        half = len(bars) // 2
        d1 = float(np.median([density.get(x, 0) for x in bars[:half]]))
        d2 = float(np.median([density.get(x, 0) for x in bars[len(bars) - half:]]))
        if d2 > d1 and d2 >= BUILD_RISE * d1:
            n += 1
            hits.update(bars)
    return S.Result(value={"present": n >= 1, "bars": len(hits), "spans": n}, provenance="exact", where=sorted(hits))
