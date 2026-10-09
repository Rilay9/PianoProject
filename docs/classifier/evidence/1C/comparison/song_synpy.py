"""SynPy (the SynPy3 port, through synpy_adapter.py) on the 111 Song stimuli, its own .rhy files, all seven models.

Per stimulus and model: the value of each of the four bars, and the value used here = mean of the two pattern bars
(bars 3 and 4); None when the model declined the bar (polyrhythm, or compound metre for KTH). Also the value of a
bar of plain beats in the same metre (the metronome bar, bar 1) = the model's own "no syncopation" reference.
Run with build/venv-synpy:  build/venv-synpy/Scripts/python.exe song_synpy.py
Writes song_synpy.json.
"""
import io, json, sys, time, contextlib
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import synpy_adapter as SA

HERE = Path(__file__).resolve().parent
SRC = SA.WT / "build/syn/synpy-electronstudio/Rhythm_stimuli_text_format"
out = {"pkl_equals_source_dict": SA.PKL_EQUALS_SOURCE_DICT, "stimuli": {}}
t_all = time.perf_counter()
for f in sorted(SRC.glob("*.rhy")):
    name = f.stem
    rec = {}
    t0 = time.perf_counter()
    for k, m in SA.MODELS.items():
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            try:
                r = SA.run(m, str(f))
                bars = r["syncopation_by_bar"]
                rec[k] = {"bars": bars, "msgs": sorted(set(buf.getvalue().splitlines()))[:3]}
            except Exception as ex:  # noqa: BLE001
                rec[k] = {"error": repr(ex)[:200]}
    rec["secs"] = time.perf_counter() - t0
    out["stimuli"][name] = rec
out["total_secs"] = time.perf_counter() - t_all
(HERE / "song_synpy.json").write_text(json.dumps(out), encoding="utf-8")
errs = sum(1 for v in out["stimuli"].values() for k, x in v.items() if isinstance(x, dict) and "error" in x)
print(len(out["stimuli"]), "stimuli x 7 models;", errs, "errors;", round(out["total_secs"], 2), "s")
