"""AMADS syncopation measures on the 111 Song stimuli. Run with build/venv-amads.

Per stimulus:
  wnbd_vector : WNBD on the pattern bar's onsets as one cycle (cycle_length = beats per bar), beat unit = the metre's
                felt beat (4/4: quarter; 6/8: dotted quarter), the call shown in AMADS's own docstring for a rhythm vector;
  wnbd_score  : WNBD called on the stimulus as a score file (the five-bar MusicXML of song_scores.py), the other way
                the tool is documented to be called, beats taken by partitura from the time-signature denominator;
  span        : syncopation_span total over the two pattern bars (cyclic, the first onset of the next cycle closes the
                last pair) divided by 2; None for non-dyadic grids (the 12-tick polyrhythms) and metres not in the table.
Writes song_amads.json.
"""
import json, sys, time, warnings
from fractions import Fraction as F
from pathlib import Path

warnings.simplefilter("ignore")
sys.path.insert(0, str(Path(__file__).resolve().parent))
import amads_tools as AT

HERE = Path(__file__).resolve().parent
WT = AT.WT
stim = json.loads((HERE / "song_stimuli.json").read_text(encoding="utf-8"))
out = {}
for name, rec in stim.items():
    ts = rec["ts"]
    num, den = map(int, ts.split("/"))
    barq = F(4 * num, den)
    bar3, bar4 = rec["bars"][2], rec["bars"][3]
    n = len(bar3)
    tickq = barq / n
    compound = num in (6, 9, 12)
    beatq = barq / (num // 3) if compound else F(4, den)
    nbeats = int(barq / beatq)
    r = {"same_pattern_bars": bar3 == bar4}
    t0 = time.perf_counter()
    ons = [tickq * i for i, v in enumerate(bar3) if v]
    try:
        beats = tuple(F(o) / beatq for o in ons)
        r["wnbd_vector"] = float(AT.wnbd_onsets(beats, cycle_length=F(nbeats))) if beats else None
    except Exception as ex:  # noqa: BLE001
        r["wnbd_vector_err"] = repr(ex)[:200]
    r["secs_vector"] = time.perf_counter() - t0
    t0 = time.perf_counter()
    try:
        r["wnbd_score"] = float(AT.wnbd_score(WT / "build/song_scores" / f"{name}.musicxml"))
    except Exception as ex:  # noqa: BLE001
        r["wnbd_score_err"] = repr(ex)[:200]
    r["secs_score"] = time.perf_counter() - t0
    t0 = time.perf_counter()
    try:
        seq = [o + barq * k for k in range(2) for o in ons] + [ons[0] + barq * 2] if ons else []
        sp = AT.span(seq, ts, tickq)
        r["span"] = None if sp is None else float(sp) / 2
        r["span_na"] = "non-dyadic grid or metre not in table" if sp is None else None
    except Exception as ex:  # noqa: BLE001
        r["span_err"] = repr(ex)[:200]
    r["secs_span"] = time.perf_counter() - t0
    out[name] = r
(HERE / "song_amads.json").write_text(json.dumps(out), encoding="utf-8")
print(len(out), "stimuli;", sum(1 for v in out.values() for k in v if k.endswith("_err")), "errors")
