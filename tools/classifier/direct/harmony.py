"""
Harmony read from the chord symbols the score prints (docs/classifier/characteristics.yaml, area harmony). Harmony
from the notes alone is a rule, not a direct reading, and is not here: a score with no chord symbols is UNKNOWN for
all three, never zero.

Reader: music21 `harmony.ChordSymbol` (the `<harmony>` elements). music21 copies a part's chord symbols into each of
its staves, so symbols at one offset with the same figure are one. A `<harmony>` whose kind is `other` (MuseScore
writes text such as "rit." or "In Tempo" this way) or `none` (N.C.) is not a chord.
"""
from __future__ import annotations

import collections

import score as S
from . import _common as C

TRIADS = {"major", "minor", "augmented", "diminished"}
SIXTHS = {"major-sixth", "minor-sixth"}
SEVENTHS = {"dominant-seventh", "major-seventh", "minor-seventh", "diminished-seventh", "half-diminished-seventh",
            "augmented-seventh", "minor-major-seventh"}
SUS = {"suspended-second", "suspended-fourth"}
NOT_CHORDS = {"none", "other"}


def kind_class(kind: str) -> str:
    if kind in TRIADS:
        return "triad"
    if kind in SIXTHS:
        return "sixth"
    if kind in SEVENTHS:
        return "seventh"
    if kind in SUS:
        return "sus"
    if kind == "power":
        return "power"
    if kind.endswith(("-ninth", "-11th", "-13th")):
        return "extended"
    return "other"


def symbols(sc: S.Score) -> list[tuple[float, object]]:
    """[(offset in quarters, ChordSymbol)] of real chords (not N.C., not text), in score order, de-duplicated."""
    def make():
        from music21 import harmony
        root = C.m21(sc)
        seen, out = set(), []
        for cs in root.recurse().getElementsByClass(harmony.ChordSymbol):
            if cs.chordKind in NOT_CHORDS:
                continue
            q = C.m21_offset(cs, root)
            if q is None:
                continue
            key = (round(q, 4), cs.figure, cs.chordKind)
            if key in seen:
                continue
            seen.add(key)
            out.append((float(q), cs))
        out.sort(key=lambda x: x[0])
        return out
    return C.cached(sc, "chord_symbols", make)


def _identity(cs) -> tuple:
    try:
        r = cs.root().pitchClass
        b = cs.bass().pitchClass
    except Exception:  # noqa: BLE001 - a symbol music21 could not place
        return (cs.figure,)
    return (r, cs.chordKind, b, tuple(str(m) for m in cs.chordStepModifications))


@C.direct("harmony.chord-quality")
def harmony_chord_quality(sc: S.Score) -> S.Result:
    """The chord qualities the printed symbols use. `count` is the number of chord symbols; `classes` splits them as
    triad (major, minor, augmented, diminished), sixth (major or minor sixth), seventh (dominant, major, minor,
    diminished, half-diminished, augmented, minor-major sevenths), extended (ninths, 11ths, 13ths), sus
    (suspended second or fourth) and power (root and fifth); `kinds` counts by the MusicXML `kind` (music21's
    names); `with_degrees` counts symbols that add or alter a degree (add9, b5 ...). UNKNOWN when the score
    prints no chord symbols."""
    syms = symbols(sc)
    if not syms:
        return C.unknown("no chord symbols")
    kinds = collections.Counter(cs.chordKind for _, cs in syms)
    classes = collections.Counter(kind_class(k) for k in kinds.elements())
    deg = sum(1 for _, cs in syms if cs.chordStepModifications)
    return C.res({"count": len(syms), "classes": dict(sorted(classes.items())), "kinds": dict(sorted(kinds.items())),
                  "with_degrees": deg}, provenance="one-witness", where={C.measure_of(sc, q) for q, _ in syms})


@C.direct("harmony.rhythm")
def harmony_rhythm(sc: S.Score) -> S.Result:
    """How often the harmony changes: a *change* is a chord symbol whose chord (root, kind, bass, added degrees)
    differs from the symbol before it; the first symbol opens the piece and is not a change. `changes` is their
    number, `per_bar_mean` changes over the bars of the score, `per_bar_max` the most in one bar,
    `bars_with_changes` the bars that have any, and `symbols` the symbols printed. `where` lists the bars with two or
    more changes. UNKNOWN when the score prints no chord symbols."""
    syms = symbols(sc)
    if not syms:
        return C.unknown("no chord symbols")
    per = collections.Counter()
    last = None
    changes = 0
    for q, cs in syms:
        ident = _identity(cs)
        if last is not None and ident != last:
            changes += 1
            per[C.measure_of(sc, q)] += 1
        last = ident
    bars = max(1, len(sc.measure_starts))
    return C.res({"symbols": len(syms), "changes": changes, "bars": bars, "per_bar_mean": round(changes / bars, 4),
                  "per_bar_max": max(per.values()) if per else 0, "bars_with_changes": len(per)},
                 provenance="one-witness", where=[m for m, n in per.items() if n >= 2])


@C.direct("harmony.inversion")
def harmony_inversion(sc: S.Score) -> S.Result:
    """Slash chords: symbols whose bass note is not the root (`<bass>` differs from `<root>`, music21 pitch classes).
    `count` is their number of `of` symbols; `inversion` those whose bass is a chord tone (C/E, G7/B) and
    `slash_other` those with a bass outside the chord (C/D). UNKNOWN when the score prints no chord symbols."""
    syms = symbols(sc)
    if not syms:
        return C.unknown("no chord symbols")
    inv = other = 0
    where = set()
    for q, cs in syms:
        try:
            if cs.root().pitchClass == cs.bass().pitchClass:
                continue
            tone = 1 <= cs.inversion() < len(cs.pitches)
        except Exception:  # noqa: BLE001
            continue
        if tone:
            inv += 1
        else:
            other += 1
        where.add(C.measure_of(sc, q))
    return C.res({"count": inv + other, "of": len(syms), "inversion": inv, "slash_other": other},
                 provenance="one-witness", where=where)
