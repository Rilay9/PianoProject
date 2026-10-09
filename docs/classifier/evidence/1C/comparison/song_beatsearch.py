"""Beatsearch's MonophonicSyncopationVector (Longuet-Higgins and Lee) on the Song monorhythms. Run with
build/venv-beatsearch (see beatsearch_shim.py for how it is imported).

Per stimulus with a dyadic grid (4/4 with 4 or 8 ticks, 6/8 with 6 ticks): a MonophonicRhythm from the pattern bar's
binary vector (cyclic, one bar), time signature (n, d), unit = the tick (quarter, eighth); value = sum of the
syncopation strengths returned, for each of Beatsearch's salience profiles 'hierarchical' (the L-H&L one) and
'equal_upbeats' (its default, Witek et al.); count = number of syncopations. The 12-tick 4/4 patterns (polyrhythms)
have no unit in Beatsearch's grid: not run.
Writes song_beatsearch.json.
"""
import json, sys, time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import beatsearch_shim as BS
from beatsearch.rhythm import Unit

HERE = Path(__file__).resolve().parent
stim = json.loads((HERE / "song_stimuli.json").read_text(encoding="utf-8"))
UNIT = {(4, 4): Unit.QUARTER, (8, 4): Unit.EIGHTH, (6, 6): Unit.EIGHTH}
out = {}
for name, rec in stim.items():
    num, den = map(int, rec["ts"].split("/"))
    vec = [int(v) for v in rec["bars"][2]]
    key = (len(vec), num) if den == 4 else (len(vec), 6)
    r = {}
    unit = UNIT.get((len(vec), num if den == 4 else 6)) if rec["ts"] in ("4/4", "6/8") else None
    if unit is None or len(vec) not in (4, 8, 6):
        r["na"] = "grid not in Beatsearch units (triplet grid)"
        out[name] = r
        continue
    t0 = time.perf_counter()
    try:
        rh = BS.MonophonicRhythm.create.from_binary_vector(vec, time_signature=(num, den), unit=unit)
        for prof in ("hierarchical", "equal_upbeats"):
            ex = BS.MonophonicSyncopationVector(unit=unit, salience_profile_type=prof, cyclic=True)
            sv = list(ex.process(rh))
            r[prof] = {"sum": float(sum(s[0] for s in sv)), "count": len(sv)}
    except Exception as ex_:  # noqa: BLE001
        r["error"] = repr(ex_)[:300]
    r["secs"] = time.perf_counter() - t0
    out[name] = r
(HERE / "song_beatsearch.json").write_text(json.dumps(out), encoding="utf-8")
print(len(out), "stimuli;", sum(1 for v in out.values() if "error" in v), "errors;", sum(1 for v in out.values() if "na" in v), "not run")
print(next((v for v in out.values() if "error" in v), "no error"))
