"""AMADS (amads 1.4.0) syncopation measures behind small functions, used by song_amads.py and cat_amads.py.
Run with build/venv-amads (amads, partitura 1.9.0, music21 10.5.0).

wnbd_score(path)            AMADS `SyncopationMetric(path).weighted_note_to_beat_distance()` on a score file: the
                            tool as its docstring says to call it (all notes, partitura onset_beat = beats of the
                            time-signature denominator; 6/8 has six beats).
wnbd_onsets(onset_beats, cycle_length=None)   the same function on supplied onsets in beats.
span(onsets_q, ts, tickq)   `amads.time.meter.syncopation_span.analyse` ("IOI span", a measure its docstring says
                            has no empirical testing) on onsets in quarters, against a hierarchy that follows
                            SynPy's subdivision-sequence table for the metre (parameter_setter.timeSignatureBase) so
                            that SynPy and the span measure are given the same metre; returns total score, or None
                            when the grid is not dyadic (triplets) or the metre is not in the table.
"""
import sys
from fractions import Fraction as F
from pathlib import Path

HERE = Path(__file__).resolve().parent
WT = HERE.parents[4]
sys.path.insert(0, str(WT / "build/syn/synpy3"))
from parameter_setter import timeSignatureBase  # noqa: E402  (pure Python table, no numpy)

from amads.time.meter.syncopation import SyncopationMetric  # noqa: E402
from amads.time.meter import syncopation_span as SS  # noqa: E402
from amads.time.meter.representations import PulseLengths, StartTimeHierarchy  # noqa: E402


def wnbd_score(path):
    return SyncopationMetric(path_to_score=str(path)).weighted_note_to_beat_distance()


def wnbd_onsets(onset_beats, cycle_length=None):
    return SyncopationMetric().weighted_note_to_beat_distance(onset_beats=onset_beats, cycle_length=cycle_length)


def _is_dyadic(x):
    x = F(x)
    return x.denominator & (x.denominator - 1) == 0


def levels_for(ts, tickq):
    num, den = map(int, ts.split("/"))
    barq = F(4 * num, den)
    if ts not in timeSignatureBase:
        return None, barq
    seq = timeSignatureBase[ts][0]
    lv = [barq]
    L = barq
    for s in seq[1:]:
        L = L / s
        if L < tickq:
            break
        lv.append(L)
    return lv, barq


def span(onsets_q, ts, tickq, max_lookahead=1):
    """onsets_q: absolute onsets in quarters (Fractions), increasing. Returns the analysis total_score or None."""
    tickq = F(tickq)
    if not _is_dyadic(tickq):
        return None
    lv, barq = levels_for(ts, tickq)
    if lv is None:
        return None
    pl = PulseLengths([float(x) for x in lv], cycle_length=float(barq))
    sh = StartTimeHierarchy(pl.to_start_hierarchy())
    r = SS.analyse([float(o) for o in onsets_q], sh, granular_pulse=float(tickq), max_lookahead=max_lookahead)
    return r.total_score
