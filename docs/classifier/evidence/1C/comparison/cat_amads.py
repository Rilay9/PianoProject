"""AMADS syncopation measures on the catalogue. Run with build/venv-amads.

  wnbd_score : SyncopationMetric(path_to_score=<the item's file>).weighted_note_to_beat_distance() (all notes of the
               score as partitura reads them; the tool's own score path). Present = value > 0. Time includes
               partitura's load_score.
  wnbd_lines : the same function on the onsets (in the metre's felt beats, from the bar index so that a pickup keeps
               the phase) of "A" (every onset of either hand: the whole texture), "R" (the right hand's top line) and
               "L" (the left hand's bottom line) from lines_items.json, each alone; results keyed A, R, L.
  span       : syncopation_span.analyse on the same line onsets (quarters), one hierarchy for the item (items whose
               readable bars all have one metre in SynPy's table, and a dyadic grid), total score of the line;
               present = either line > 0; n/a otherwise, with the reason.
Writes cat_amads.json.
"""
import json, sys, time, warnings
from fractions import Fraction as F
from math import gcd
from multiprocessing import Pool
from pathlib import Path

warnings.simplefilter("ignore")
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import amads_tools as AT

WT = AT.WT
MAIN = Path(r"C:/Users/yalir/repos/Piano Stuff/PianoProject")
CAT = {i["id"]: i for i in json.loads((MAIN / "app/public/content/catalog.json").read_text(encoding="utf-8"))}
LINES = json.loads((WT / "build/lines_items.json").read_text(encoding="utf-8"))


def lcm(a, b):
    return a * b // gcd(a, b)


def beat_of(n, d):
    """felt beat in quarters: compound metres (numerator 6, 9, 12) beat on three of the denominator."""
    return F(4, d) * (3 if n in (6, 9, 12) else 1)


def work(iid):
    out = {}
    item = CAT[iid]
    t0 = time.perf_counter()
    try:
        out["wnbd_score"] = float(AT.wnbd_score(MAIN / "app/public/content" / item["file"]))
    except Exception as ex:  # noqa: BLE001
        out["wnbd_score_err"] = repr(ex)[:160]
    out["secs_score"] = time.perf_counter() - t0
    rec = LINES.get(iid, {})
    if "error" in rec or rec.get("unknown") or not rec.get("metre"):
        out["lines_na"] = rec.get("error") or rec.get("unknown") or "no readable bar"
        return iid, out
    metre = {int(m): tuple(v) for m, v in rec["metre"].items()}
    t0 = time.perf_counter()
    vals = {}
    for h in ("A", "R", "L"):
        bars = rec.get(h, {})
        beats = []
        for m in sorted(int(x) for x in bars):
            n, d = metre[m]
            B = beat_of(n, d)
            nb = F(4 * n, d) / B
            beats += [m * nb + F(p) / B for p in bars[str(m)]]
        if len(beats) >= 2:
            try:
                vals[h] = float(AT.wnbd_onsets(tuple(beats)))
            except Exception as ex:  # noqa: BLE001
                out["wnbd_lines_err_" + h] = repr(ex)[:160]
    out["wnbd_lines"] = vals
    out["secs_wnbd_lines"] = time.perf_counter() - t0
    # span
    t0 = time.perf_counter()
    metres = {metre[m] for m in metre}
    if len(metres) != 1:
        out["span_na"] = "metre changes" if len(metres) > 1 else "no readable bar"
    else:
        n, d = next(iter(metres))
        ts = f"{n}/{d}"
        barq = F(4 * n, d)
        if ts not in AT.timeSignatureBase:
            out["span_na"] = f"metre {ts} not in table"
        else:
            res = {}
            for h in ("A", "R", "L"):
                bars = rec.get(h, {})
                ons = []
                D = 1
                for m in sorted(int(x) for x in bars):
                    for p in bars[str(m)]:
                        ons.append(m * barq + F(p))
                        D = lcm(D, F(p).denominator)
                if len(ons) < 2:
                    continue
                g = int(barq * D)
                for o in ons:
                    g = gcd(g, int(o * D))
                tick = F(g, D)
                try:
                    sp = AT.span(ons, ts, tick)
                    if sp is None:
                        out["span_na"] = "non-dyadic grid (tuplets)"
                    else:
                        res[h] = float(sp)
                except Exception as ex:  # noqa: BLE001
                    out["span_err_" + h] = repr(ex)[:160]
            out["span"] = res
    out["secs_span"] = time.perf_counter() - t0
    return iid, out


if __name__ == "__main__":
    ids = sys.argv[1:] or [i for i in CAT if CAT[i].get("file")]   # ids given: re-run those and merge
    t0 = time.perf_counter()
    with Pool(3) as p:
        res = dict(p.map(work, ids, chunksize=8))
    if sys.argv[1:]:
        old = json.loads((HERE / "cat_amads.json").read_text(encoding="utf-8"))
        old.update(res)
        res = old
    (HERE / "cat_amads.json").write_text(json.dumps(res), encoding="utf-8")
    print(len(res), "items;", round(time.perf_counter() - t0), "s wall;",
          sum(1 for r in res.values() if "wnbd_score_err" in r), "wnbd_score errors")
