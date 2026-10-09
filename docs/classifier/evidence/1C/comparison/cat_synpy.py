"""SynPy (SynPy3 port, seven models) on the catalogue, fed from build/lines_items.json (lines_extract.py).

Two inputs, both through SynPy's own Bar / BarList objects (its MIDI reader does not run in the port, so the score is
not exported to MIDI; the bars are built directly from the onsets a MIDI export would carry):
  texture : every onset of any note of either hand, one rhythm per piece (what a MIDI export of the score gives a
            tool that reads note-on times: the survey's route);
  lines   : the right hand's top line and the left hand's bottom line, each its own rhythm (the lines the current
            detector reads).
Adapter: for each rhythm and each run of consecutive readable bars with one metre, one SynPy Bar per bar: the velocity
sequence on the bar's own grid (tick = greatest common divisor of the onset positions and the bar length, so a bar of
quarter notes is 4 ticks, 3 in 3/4, and a bar with a sixteenth is 16), time signature "n/d" (SynPy's table
timeSignatureBase must hold it, else the run is not measured), velocity 1 at an onset; the bars of a run form a BarList
(LHL uses the previous bar's last note). A bar with no onset is an empty bar (kept in the chain, not counted).

Per input, item and model: bars measured, bars declined by the model (polyrhythm grid, compound metre for KTH), bars
where the value exceeds the model's "no syncopation" reference, max value. Reference: 0 for TMC, SG, KTH, WNBD, LHL (its
"none" is -1, so > 0); for PRS and TOB (no zero) the model's value on a bar with one onset on each beat in the same
metre. present = at least one measured bar above the reference.
Writes cat_synpy.json {id: {"texture": {model: {...}}, "lines": {model: {...}}, "secs", "metres_not_in_table",
"per_bar" (named items only)}}.
Run with build/venv-synpy.
"""
import contextlib, io, json, sys, time
from fractions import Fraction as F
from math import gcd
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import synpy_adapter as SA

LINES = json.loads((SA.WT / "build/lines_items.json").read_text(encoding="utf-8"))
NAMED = json.loads((HERE / "named_items.json").read_text(encoding="utf-8"))
NAMED_IDS = {x["id"] for x in NAMED["items"]}
MODELS = SA.MODELS
TS_OK = set(SA.parameter_setter.timeSignatureBase)
_ref_cache = {}
MAX_TICKS = 64


def lcm(a, b):
    return a * b // gcd(a, b)


def velocity_sequence(positions, barq):
    pos = [F(p) for p in positions]
    D = 1
    for x in pos + [barq]:
        D = lcm(D, x.denominator)
    g = int(barq * D)
    for x in pos:
        g = gcd(g, int(x * D))
    n = int(barq * D) // g
    seq = [0.0] * n
    for x in pos:
        seq[int(x * D) // g] = 1.0
    return seq


def safe_seq(positions, barq):
    """velocity_sequence, or "BAD" when the bar cannot be put on a grid inside its own length (an onset at or past the
    bar end: a file whose barlines the reader could not place, e.g. the Gnossienne with no time signature)."""
    try:
        if any(F(p) >= barq or F(p) < 0 for p in positions):
            return "BAD"
        return velocity_sequence(positions, barq)
    except Exception:  # noqa: BLE001
        return "BAD"


def bar_values(model, seqs, ts):
    """Values of a model on the consecutive bars (lists of velocities) of one run, chained as SynPy chains a BarList."""
    bl = SA.BarList()
    for s in seqs:
        bl.append(SA.Bar(SA.VelocitySequence(list(s)), ts))
    vals = []
    for bar in bl:
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            try:
                vals.append(model.get_syncopation(bar))
            except Exception:  # noqa: BLE001
                vals.append("error")
    return vals


def reference(kname, ts):
    if kname not in ("PRS", "TOB"):
        return 0.0
    key = (kname, ts)
    if key not in _ref_cache:
        num, den = map(int, ts.split("/"))
        nb = num // 3 if num in (6, 9, 12) else num
        v = bar_values(MODELS[kname], [[1.0] * nb], ts)[0]
        _ref_cache[key] = v if isinstance(v, (int, float)) else None
    return _ref_cache[key]


def run_rhythm(bars, metre, store, per_bar, key):
    """bars: {bar index str: [position strings]}; metre: {bar index str: [n, d]}; store: model summary dict."""
    ms = sorted(int(m) for m in metre)
    runs, cur = [], []
    for m in ms:
        if cur and m != cur[-1] + 1:
            runs.append(cur); cur = []
        cur.append(m)
    if cur:
        runs.append(cur)
    not_in_table = []
    for run in runs:
        seg = [run[0]]
        segs = []
        for m in run[1:]:
            if metre[str(m)] != metre[str(seg[-1])]:
                segs.append(seg); seg = []
            seg.append(m)
        segs.append(seg)
        for seg in segs:
            n, d = metre[str(seg[0])]
            ts = f"{n}/{d}"
            if ts not in TS_OK:
                if ts not in not_in_table:
                    not_in_table.append(ts)
                continue
            barq = F(4 * n, d)
            seqs = [safe_seq(bars[str(m)], barq) if bars.get(str(m)) else None for m in seg]
            empties = [s is None for s in seqs]
            nbt = n // 3 if n in (6, 9, 12) else n
            # a bar whose own grid is finer than 64 ticks is not given to SynPy: its tree recursion did not finish in
            # hours on one catalogue item in the first run (a worker ran 7,000 s of CPU); counted as declined (fine grid)
            fine = [s is not None and (s == "BAD" or len(s) > MAX_TICKS) for s in seqs]
            seqs2 = [s if (s is not None and s != "BAD" and len(s) <= MAX_TICKS) else [0.0] * nbt for s in seqs]
            for k, model in MODELS.items():
                vals = bar_values(model, seqs2, ts)
                ref = reference(k, ts)
                rk = store[k]
                for m, v, e, fi in zip(seg, vals, empties, fine):
                    if e:
                        rk["empty"] += 1
                        continue
                    if fi:
                        rk["declined"] += 1
                        rk["declined_fine_grid"] = rk.get("declined_fine_grid", 0) + 1
                        continue
                    if v is None:
                        rk["declined"] += 1
                        continue
                    if v == "error":
                        rk["errors"] += 1
                        continue
                    rk["measured"] += 1
                    if rk["max"] is None or v > rk["max"]:
                        rk["max"] = v
                    if ref is not None and v > ref:
                        rk["present_bars"] += 1
                    if per_bar is not None:
                        per_bar.setdefault(key, {}).setdefault(k, {})[str(m)] = v
    return not_in_table


def fresh():
    return {k: {"measured": 0, "present_bars": 0, "max": None, "declined": 0, "empty": 0, "errors": 0} for k in MODELS}


def one(rec):
    t0 = time.perf_counter()
    named = rec["id"] in NAMED_IDS
    per_bar = {} if named else None
    out = {"texture": fresh(), "lines": fresh(), "metres_not_in_table": []}
    metre = rec.get("metre", {})
    t = run_rhythm(rec.get("A", {}), metre, out["texture"], per_bar, "texture")
    out["metres_not_in_table"] = sorted(set(t))
    for h in "RL":
        run_rhythm(rec.get(h, {}), metre, out["lines"], per_bar, "lines_" + h)
    # lines: per-model sums over the two hands are already in out["lines"]
    for inp in ("texture", "lines"):
        for k in MODELS:
            rk = out[inp][k]
            rk["present"] = (rk["present_bars"] > 0) if rk["measured"] else None
    if per_bar is not None:
        out["per_bar"] = per_bar
    out["secs"] = time.perf_counter() - t0
    return out


def work(iid):
    rec = LINES[iid]
    if "error" in rec or rec.get("unknown"):
        return iid, {"extract_error": rec.get("error") or rec.get("unknown")}
    try:
        r = one(rec)
        r["extract_secs"] = rec.get("secs")
        return iid, r
    except Exception as ex:  # noqa: BLE001
        return iid, {"error": repr(ex)[:200]}


if __name__ == "__main__":
    from multiprocessing import Pool
    t0 = time.perf_counter()
    ids = sys.argv[1:] or list(LINES)          # ids given: re-run those and merge into the existing file
    with Pool(3) as p:
        res = dict(p.map(work, ids, chunksize=8))
    if sys.argv[1:]:
        old = json.loads((HERE / "cat_synpy.json").read_text(encoding="utf-8"))
        old.update(res)
        res = old
    (HERE / "cat_synpy.json").write_text(json.dumps(res), encoding="utf-8")
    print(len(res), "items;", sum(1 for r in res.values() if "error" in r or "extract_error" in r), "without a result;",
          round(time.perf_counter() - t0), "s wall")
