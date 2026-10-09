"""The current detector (sync.py, unchanged) on the 111 Song stimulus scores built by song_scores.py.

Per stimulus: the events of kinds beat-level held / held / held at the subdivision / off-beat attack / rest /
bass-then-held-chord in bars 1, 2, 3 (0-based) of the five-bar score, by kind; value_all = events of those kinds / 3,
value_held = (beat-level held + held + held at the subdivision) / 3. Run with the main .venv.
Writes song_cur.json.
"""
import json, sys, time, warnings
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import syn_common as C

warnings.simplefilter("ignore")
vs, vc = C.current()
stim = json.loads((C.HERE / "song_stimuli.json").read_text(encoding="utf-8"))
KINDS = ["beat-level held", "held", "held at the subdivision", "off-beat attack", "rest", "bass-then-held-chord", "accent"]
out = {}
for name in stim:
    iid = "song." + name
    vc.BYID[iid] = {"id": iid, "file": str(C.BUILD / "song_scores" / f"{name}.musicxml"), "hands": "right"}
    vs.BYID = vc.BYID
    t0 = time.perf_counter()
    try:
        r = vs.analyse(iid, detail=True)
        secs = time.perf_counter() - t0
        ev = [e for e in r["events"] if e[2] in (1, 2, 3)]
        c = Counter(e[1] for e in ev)
        out[name] = {"counts": {k: c.get(k, 0) for k in KINDS},
                     "value_all": sum(c.get(k, 0) for k in KINDS if k != "accent") / 3,
                     "value_held": sum(c.get(k, 0) for k in ("beat-level held", "held", "held at the subdivision")) / 3,
                     "present_page": r["present_page"], "secs": secs, "unknown": r.get("unknown")}
    except Exception as ex:  # noqa: BLE001
        out[name] = {"error": repr(ex)[:200]}
(C.HERE / "song_cur.json").write_text(json.dumps(out), encoding="utf-8")
print(len(out), "stimuli;", sum(1 for v in out.values() if "error" in v), "errors")
