"""Stage 1 for the candidate tools: read each catalogue score with the project's reader and write the onsets of the
two lines the current detector reads (right hand top line, left hand bottom line), bar by bar, as exact fractions.

The line selection is the one in validation/sync.py `analyse` (copied, not imported, because it is inline there):
at each onset of a hand the highest (right) or lowest (left) note, dropped if a higher (lower) note of the hand is
still sounding. Only readable bars (full length, not a pickup) are written, with their metre (num, den).

Also "A": every onset of any note of either hand per readable bar (the whole texture, as a MIDI export would give a tool
that reads note-on times only).
Output: build/lines_items.json   {id: {"metre": {bar: [n, d]}, "R": {bar: ["p/q", ...]}, "L": {...}, "A": {...}, "secs": float,
                                       "nbars": int, "readable": int, "unknown": str|None}}
Position strings are quarters from the bar start (Fraction as "p/q").
Usage: python lines_extract.py [id ...]      (no ids: every catalogue item with a file; 4 workers)
"""
import json, sys, time, warnings
from collections import defaultdict
from fractions import Fraction as F
from multiprocessing import Pool
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import syn_common as C

warnings.simplefilter("ignore")
OUT = C.BUILD / "lines_items.json"
_vs = _vc = None


def init():
    global _vs, _vc
    _vs, _vc = C.current()


def extract(iid):
    from rules import rhythm as R
    t0 = time.perf_counter()
    item = _vc.BYID[iid]
    out = {"id": iid, "metre": {}, "R": {}, "L": {}}
    sc = _vc.load(iid)
    if not len(sc.notes):
        out["unknown"] = "no notes"
        return out
    b = R.Bars(sc)
    starts = [_vc.fr(s) for s in sc.measure_starts]
    nb_ = len(starts)
    out["nbars"] = nb_
    out["readable"] = len(b.readable)

    def bar_index(t):
        k = -1
        for j in range(nb_):
            if starts[j] <= t + _vc.EPS:
                k = j
            else:
                break
        return k

    notes = {"R": [], "L": []}
    for pi, part in enumerate(sc.part_score.parts):
        q = part.quarter_map
        for n in part.notes_tied:
            o = _vc.fr(q(n.start.t))
            e = _vc.fr(q(n.end_tied.t))
            if e <= o:
                continue
            h = _vs.hand_of(sc, item, pi, n.staff)
            notes[h].append((o, e, n.midi_pitch))
    for m in sorted(b.readable):
        out["metre"][str(m)] = list(b.metre[m])
    # the whole texture: every onset of any note of either hand (what a MIDI export of the score would give a tool
    # that reads note-on times only), as one list per readable bar
    allon = defaultdict(set)
    for h in "RL":
        for (o, e, p) in notes[h]:
            m = bar_index(o)
            if m in b.readable:
                allon[m].add(o - starts[m])
    out["A"] = {str(m): [str(x) for x in sorted(v)] for m, v in allon.items()}
    for h in "RL":
        by = defaultdict(list)
        for x in notes[h]:
            by[x[0]].append(x)
        line = []
        for o in sorted(by):
            pick = max(by[o], key=lambda x: x[2]) if h == "R" else min(by[o], key=lambda x: x[2])
            covered = any(x[0] < o - _vc.EPS and x[1] > o + _vc.EPS and ((x[2] > pick[2]) if h == "R" else (x[2] < pick[2]))
                          for x in notes[h])
            if not covered:
                line.append(pick)
        bars = defaultdict(list)
        for (o, e, p) in line:
            m = bar_index(o)
            if m in b.readable:
                bars[m].append(str(o - starts[m]))
        out[h] = {str(m): v for m, v in bars.items()}
    out["secs"] = time.perf_counter() - t0
    return out


def safe(iid):
    try:
        return extract(iid)
    except Exception as ex:  # noqa: BLE001
        return {"id": iid, "error": repr(ex)[:200]}


if __name__ == "__main__":
    ids = sys.argv[1:] or [i["id"] for i in C.catalogue() if i.get("file")]
    t0 = time.perf_counter()
    with Pool(3, initializer=init) as p:
        res = p.map(safe, ids, chunksize=8)
    if len(sys.argv) > 1:
        print(json.dumps(res)[:3000])
    else:
        OUT.write_text(json.dumps({r["id"]: r for r in res}), encoding="utf-8")
        print(len(res), "items;", sum(1 for r in res if "error" in r), "errors;", round(time.perf_counter() - t0), "s wall")
