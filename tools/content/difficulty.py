"""
How hard is this piece (replan §2.4).

Two things live here and they are deliberately separate:

  `features(score)`  measurable facts about a score — bars, density, span,
                     leaps, accidentals, voices, crossings. No opinion in it.
  `estimate(...)`    a level from those facts, using a model file.

The separation is the point. PDMX's own `complexity` and MusPy metrics exist
only for PDMX rows, so a level computed from them could never be compared with
the level of an authored exercise or an imported Chopin. These features are
computed identically for every score the pipeline has ever seen, which is what
makes the calibration set — the ~200 songs whose level a person judged — a
calibration set rather than a coincidence.

The model is a linear function of log-scaled features with monotone signs: no
feature may *lower* the estimate as it grows. That constraint is not a
statistical nicety. Without it a least-squares fit on 200 points will happily
decide that more accidentals means easier, and produce a model that is right on
average and absurd on any particular piece.

`content/sources/level-model.json` ships with the coarse fallback table so the
file exists before P14 fits anything, and `estimate` says which of the two it
used.
"""
from __future__ import annotations

import json
import math
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Sequence

REPO_ROOT = Path(__file__).resolve().parents[2]
MODEL_FILE = REPO_ROOT / "content" / "sources" / "level-model.json"

#: Levels are `02` Part B's stages, and nothing outside them means anything.
MIN_LEVEL, MAX_LEVEL = 1.0, 9.0

#: Every feature `features()` returns, in a fixed order so a model file and a
#: feature dict cannot drift apart silently.
FEATURE_NAMES: tuple[str, ...] = (
    "bars",
    "notesPerBar",
    "notesPerSecond",
    "maxSimultaneousRight",
    "maxSimultaneousLeft",
    "maxSpanRight",
    "maxSpanLeft",
    "maxLeapRight",
    "maxLeapLeft",
    "rangeRight",
    "rangeLeft",
    "blackKeyRatio",
    "keyAccidentals",
    "shortestValue",
    "voicesPerStaff",
    "handCrossings",
    "ornaments",
    "ledgerRatio",
    "distinctRhythms",
)

#: Which direction each feature may push the level. Enforced by `fit`.
#:
#: `shortestValue` is the only negative one, and it is negative because it is
#: measured in quarter lengths: a shorter shortest note is a *harder* piece, so
#: the number going down means the level going up.
MONOTONE_SIGNS: dict[str, int] = {
    "bars": +1,
    "notesPerBar": +1,
    "notesPerSecond": +1,
    "maxSimultaneousRight": +1,
    "maxSimultaneousLeft": +1,
    "maxSpanRight": +1,
    "maxSpanLeft": +1,
    "maxLeapRight": +1,
    "maxLeapLeft": +1,
    "rangeRight": +1,
    "rangeLeft": +1,
    "blackKeyRatio": +1,
    "keyAccidentals": +1,
    "shortestValue": -1,
    "voicesPerStaff": +1,
    "handCrossings": +1,
    "ornaments": +1,
    "ledgerRatio": +1,
    "distinctRhythms": +1,
}

#: Notes outside this stave-adjacent window count as ledger-line notes. Middle
#: C either side; a beginner reading C4-A5 and F2-C4 never meets one.
LEDGER_LOW, LEDGER_HIGH = 43, 79

BLACK_KEYS = {1, 3, 6, 8, 10}


@dataclass(frozen=True)
class LevelEstimate:
    level: float
    #: `model` or `fallback`.
    source: str
    #: The three features that moved the estimate furthest from the bias.
    drivers: list[tuple[str, float]]

    def as_dict(self) -> dict:
        return {"level": self.level, "source": self.source, "drivers": self.drivers}


def _log_scale(name: str, value: float) -> float:
    """
    Features are used on a log scale, except the ones that are already small.

    A piece with 400 bars is not forty times harder than one with ten, and a
    linear term on `bars` makes the whole model about length. Ratios and counts
    that never exceed about ten are left alone.
    """
    if name in {"blackKeyRatio", "ledgerRatio", "shortestValue"}:
        return value
    return math.log1p(max(0.0, value))


def features(score) -> dict[str, float]:  # noqa: ANN001 - music21 Score
    """
    Every measurable fact `estimate` is allowed to use.

    Takes a parsed music21 score. Written to be total: a score with one staff,
    no time signature or no tempo yields zeros for the features that need them
    rather than raising, because the caller is a quarry loop over files nobody
    has looked at.
    """
    from music21 import chord as m21chord
    from music21 import note as m21note

    parts = list(score.parts) if hasattr(score, "parts") else []
    if not parts:
        parts = [score]
    measures = score.recurse().getElementsByClass("Measure")
    bars = max(1, len(measures) // max(1, len(parts)))

    right = parts[0]
    left = parts[1] if len(parts) > 1 else None

    def hand_stats(part) -> dict[str, float]:  # noqa: ANN001
        if part is None:
            return {"simultaneous": 0.0, "span": 0.0, "leap": 0.0, "range": 0.0}
        pitches: list[int] = []
        simultaneous = 0
        span = 0
        melodic: list[int] = []
        for element in part.recurse().notes:
            midis = sorted(int(p.midi) for p in element.pitches)
            if not midis:
                continue
            pitches.extend(midis)
            if isinstance(element, m21chord.Chord):
                simultaneous = max(simultaneous, len(midis))
                span = max(span, midis[-1] - midis[0])
            elif isinstance(element, m21note.Note):
                simultaneous = max(simultaneous, 1)
            melodic.append(midis[0])
        leaps = [abs(b - a) for a, b in zip(melodic, melodic[1:])]
        return {
            "simultaneous": float(simultaneous),
            "span": float(span),
            "leap": float(max(leaps) if leaps else 0),
            "range": float(max(pitches) - min(pitches)) if pitches else 0.0,
        }

    right_stats = hand_stats(right)
    left_stats = hand_stats(left)

    all_notes = list(score.recurse().notes)
    all_pitches = [int(p.midi) for element in all_notes for p in element.pitches]
    note_count = len(all_pitches)

    durations = {
        float(element.duration.quarterLength)
        for element in all_notes
        if element.duration.quarterLength > 0
    }
    shortest = min(durations) if durations else 1.0

    tempos = list(score.recurse().getElementsByClass("MetronomeMark"))
    bpm = float(tempos[0].number) if tempos and tempos[0].number else 100.0
    signatures = list(score.recurse().getElementsByClass("TimeSignature"))
    beats_per_bar = float(signatures[0].numerator) if signatures else 4.0
    seconds = (bars * beats_per_bar * 60.0) / max(1.0, bpm)

    keys = list(score.recurse().getElementsByClass("KeySignature"))
    accidentals = abs(int(keys[0].sharps)) if keys and keys[0].sharps is not None else 0

    voices = max(
        (len(list(measure.voices)) for measure in measures),
        default=0,
    )

    crossings = 0
    if left is not None:
        # A crossing is the left hand printed above the right at the same
        # offset. Counted per offset rather than per note, because a crossed
        # passage is one difficulty however many notes it contains.
        right_by_offset: dict[float, int] = {}
        for element in right.recurse().notes:
            offset = float(element.getOffsetInHierarchy(score))
            midis = [int(p.midi) for p in element.pitches]
            if midis:
                right_by_offset[offset] = min(midis)
        for element in left.recurse().notes:
            offset = float(element.getOffsetInHierarchy(score))
            midis = [int(p.midi) for p in element.pitches]
            top = max(midis) if midis else None
            below = right_by_offset.get(offset)
            if top is not None and below is not None and top > below:
                crossings += 1

    ornaments = sum(len(element.expressions) for element in all_notes)
    ledger = sum(1 for midi in all_pitches if midi < LEDGER_LOW or midi > LEDGER_HIGH)
    black = sum(1 for midi in all_pitches if midi % 12 in BLACK_KEYS)

    return {
        "bars": float(bars),
        "notesPerBar": note_count / bars if bars else 0.0,
        "notesPerSecond": note_count / seconds if seconds > 0 else 0.0,
        "maxSimultaneousRight": right_stats["simultaneous"],
        "maxSimultaneousLeft": left_stats["simultaneous"],
        "maxSpanRight": right_stats["span"],
        "maxSpanLeft": left_stats["span"],
        "maxLeapRight": right_stats["leap"],
        "maxLeapLeft": left_stats["leap"],
        "rangeRight": right_stats["range"],
        "rangeLeft": left_stats["range"],
        "blackKeyRatio": black / note_count if note_count else 0.0,
        "keyAccidentals": float(accidentals),
        "shortestValue": float(shortest),
        "voicesPerStaff": float(voices),
        "handCrossings": float(crossings),
        "ornaments": float(ornaments),
        "ledgerRatio": ledger / note_count if note_count else 0.0,
        "distinctRhythms": float(len(durations)),
    }


def load_model(path: Path = MODEL_FILE) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def fallback_level(feature_values: dict[str, float], model: dict) -> LevelEstimate:
    """
    The coarse table, used until a fit meets the bar (replan §2.4).

    Notes per bar against the shortest note value, which is a crude reading of
    "how much is happening and how fast". It is not good; it is *stated*, which
    is the difference between a fallback and a guess.
    """
    table = model.get("fallback", {}).get("bins", [])
    density = feature_values.get("notesPerBar", 0.0)
    shortest = feature_values.get("shortestValue", 1.0)
    for row in table:
        if density <= row["maxNotesPerBar"] and shortest >= row["minShortestValue"]:
            return LevelEstimate(
                level=float(row["level"]),
                source="fallback",
                drivers=[("notesPerBar", density), ("shortestValue", shortest)],
            )
    return LevelEstimate(level=MAX_LEVEL, source="fallback",
                         drivers=[("notesPerBar", density), ("shortestValue", shortest)])


def estimate(feature_values: dict[str, float], model: dict | None = None) -> LevelEstimate:
    """A level in [1, 9] from the features, by the model or by the table."""
    model = model or load_model()
    weights = model.get("weights")
    if not weights or not model.get("fitted"):
        return fallback_level(feature_values, model)

    bias = float(model.get("bias", 4.0))
    means = model.get("means", {})
    total = bias
    contributions: list[tuple[str, float]] = []
    for name in FEATURE_NAMES:
        weight = float(weights.get(name, 0.0))
        if weight == 0.0:
            continue
        scaled = _log_scale(name, float(feature_values.get(name, 0.0))) - float(means.get(name, 0.0))
        contribution = weight * scaled
        total += contribution
        contributions.append((name, contribution))
    contributions.sort(key=lambda pair: -abs(pair[1]))
    return LevelEstimate(
        level=max(MIN_LEVEL, min(MAX_LEVEL, round(total, 2))),
        source="model",
        drivers=[(name, round(value, 3)) for name, value in contributions[:3]],
    )


# --- fitting -----------------------------------------------------------------


@dataclass
class Sample:
    features: dict[str, float]
    level: float
    id: str = ""


def _design(samples: Sequence[Sample], names: Sequence[str]) -> tuple[list[list[float]], list[float]]:
    rows = [[_log_scale(name, s.features.get(name, 0.0)) for name in names] for s in samples]
    return rows, [s.level for s in samples]


def _solve(matrix: list[list[float]], targets: list[float], ridge: float) -> list[float]:
    """
    Ridge least squares by Gaussian elimination on the normal equations.

    Written out rather than pulled from numpy: the pipeline's only heavy
    dependency is music21, and adding numpy so that a 20x20 system can be
    solved once a year is not a trade worth making. The ridge term is what
    keeps it stable when two features are nearly the same column, which on 200
    piano scores they often are.
    """
    columns = len(matrix[0]) if matrix else 0
    ata = [[sum(row[i] * row[j] for row in matrix) for j in range(columns)] for i in range(columns)]
    for i in range(columns):
        ata[i][i] += ridge
    atb = [sum(row[i] * target for row, target in zip(matrix, targets)) for i in range(columns)]

    for i in range(columns):
        pivot = max(range(i, columns), key=lambda r: abs(ata[r][i]))
        if abs(ata[pivot][i]) < 1e-12:
            continue
        ata[i], ata[pivot] = ata[pivot], ata[i]
        atb[i], atb[pivot] = atb[pivot], atb[i]
        for r in range(columns):
            if r == i:
                continue
            factor = ata[r][i] / ata[i][i]
            if factor == 0:
                continue
            for c in range(i, columns):
                ata[r][c] -= factor * ata[i][c]
            atb[r] -= factor * atb[i]
    return [
        atb[i] / ata[i][i] if abs(ata[i][i]) > 1e-12 else 0.0
        for i in range(columns)
    ]


def spearman(a: Sequence[float], b: Sequence[float]) -> float:
    """Rank correlation, with average ranks for ties."""
    def ranks(values: Sequence[float]) -> list[float]:
        order = sorted(range(len(values)), key=lambda i: values[i])
        out = [0.0] * len(values)
        i = 0
        while i < len(order):
            j = i
            while j + 1 < len(order) and values[order[j + 1]] == values[order[i]]:
                j += 1
            average = (i + j) / 2 + 1
            for k in range(i, j + 1):
                out[order[k]] = average
            i = j + 1
        return out

    if len(a) < 2:
        return 0.0
    ra, rb = ranks(a), ranks(b)
    mean_a = sum(ra) / len(ra)
    mean_b = sum(rb) / len(rb)
    numerator = sum((x - mean_a) * (y - mean_b) for x, y in zip(ra, rb))
    denominator = math.sqrt(
        sum((x - mean_a) ** 2 for x in ra) * sum((y - mean_b) ** 2 for y in rb)
    )
    return numerator / denominator if denominator else 0.0


@dataclass
class FitReport:
    model: dict
    spearman: float
    median_absolute_error: float
    samples: int
    dropped_features: list[str]

    @property
    def meets_bar(self) -> bool:
        """replan §2.4: Spearman >= 0.8 and median absolute error <= 0.7."""
        return self.spearman >= 0.8 and self.median_absolute_error <= 0.7

    def summary(self) -> str:
        verdict = "meets the bar" if self.meets_bar else "below the bar — keep the fallback"
        return (
            f"{self.samples} sample(s): Spearman {self.spearman:.3f}, "
            f"leave-one-out median |error| {self.median_absolute_error:.3f} stages — {verdict}"
        )


def fit(samples: Sequence[Sample], names: Iterable[str] = FEATURE_NAMES, ridge: float = 1.0) -> FitReport:
    """
    Least squares with the monotone signs enforced, and leave-one-out error.

    Enforcement is by dropping: a feature whose fitted weight has the wrong
    sign is removed and the fit repeated, rather than clamped to zero in place,
    because a clamped coefficient leaves the others carrying its variance and
    the report then describes a model nobody would write down.
    """
    names = list(names)
    dropped: list[str] = []
    weights: dict[str, float] = {}
    levels = [s.level for s in samples]
    bias = sum(levels) / len(levels) if levels else 4.0

    while names:
        rows, targets = _design(samples, names)
        means = [sum(row[i] for row in rows) / len(rows) for i in range(len(names))]
        centred = [[row[i] - means[i] for i in range(len(names))] for row in rows]
        centred_targets = [target - bias for target in targets]
        solved = _solve(centred, centred_targets, ridge)
        wrong = [
            name
            for name, weight in zip(names, solved)
            if weight != 0.0 and MONOTONE_SIGNS.get(name, 1) * weight < 0
        ]
        if not wrong:
            weights = dict(zip(names, solved))
            model_means = dict(zip(names, means))
            break
        dropped.extend(wrong)
        names = [name for name in names if name not in wrong]
    else:
        weights, model_means = {}, {}

    model = {
        "fitted": bool(weights),
        "bias": bias,
        "weights": {name: round(value, 6) for name, value in weights.items()},
        "means": {name: round(value, 6) for name, value in model_means.items()},
        "fallback": load_model().get("fallback", {}),
    }

    # Leave one out, refitting each time: reporting the error of a model on the
    # points it was fitted to would say only that least squares works.
    errors: list[float] = []
    predicted: list[float] = []
    if len(samples) > 3:
        for index in range(len(samples)):
            rest = [s for i, s in enumerate(samples) if i != index]
            sub = fit_once(rest, list(weights) or list(FEATURE_NAMES), ridge)
            guess = estimate(samples[index].features, sub).level
            predicted.append(guess)
            errors.append(abs(guess - samples[index].level))
    ordered = sorted(errors)
    median = ordered[len(ordered) // 2] if ordered else 0.0
    return FitReport(
        model=model,
        spearman=spearman(predicted, [s.level for s in samples]) if predicted else 0.0,
        median_absolute_error=median,
        samples=len(samples),
        dropped_features=dropped,
    )


def fit_once(samples: Sequence[Sample], names: Sequence[str], ridge: float) -> dict:
    """One unchecked fit, for the leave-one-out loop."""
    rows, targets = _design(samples, names)
    if not rows:
        return {"fitted": False, "fallback": load_model().get("fallback", {})}
    bias = sum(targets) / len(targets)
    means = [sum(row[i] for row in rows) / len(rows) for i in range(len(names))]
    centred = [[row[i] - means[i] for i in range(len(names))] for row in rows]
    solved = _solve(centred, [t - bias for t in targets], ridge)
    return {
        "fitted": True,
        "bias": bias,
        "weights": dict(zip(names, solved)),
        "means": dict(zip(names, means)),
        "fallback": {},
    }
