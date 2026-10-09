"""pitch.tone-row: music21 search.serial (TransformedSegmentMatcher) with the row chosen four ways, and the current detector, on one score.

  python -X utf8 row_music21.py --task <task.json> <out.json>     one task (called by row_drive.py)

A task: {"key", "kind": "cat"|"built", "path" (score file), "item_id" (cat), "oracle" (12 pitch classes or null), "choices": [...]}.
Row choices (how the row that search.serial needs as input is chosen):
  oracle   the true row, known only for built scores (an upper bound: nobody has it for a real piece);
  self     the first 12 consecutive notes of one line with 12 different pitch classes, found in the project's note view (top line then bottom
           line, right hand first), with no scale-figure filter: the piece's own first aggregate, then every P, I, R, RI form of it is searched for;
  first12  the first 12 notes of the piece's first staff in music21's reading order (chords bottom to top), when they are 12 different
           pitch classes;
  hist     all 71 rows of music21's table of rows from named works (serial.historicalDict), searched in one call.
Found = at least two statements (P, I, R or RI forms, the chosen row itself counted) of one row: the page's rule 3.
"""
import sys
from row_lib import *


def first_run12(v):
    for h, evs in v.hands.items():
        top = [e.high for e in evs]
        bot = [e.low for e in evs]
        for nm, line in (("top", top),) if top == bot else (("top", top), ("bottom", bot)):
            pcs = [p % 12 for p in line]
            for k in range(len(pcs) - 11):
                if len(set(pcs[k:k + 12])) == 12:
                    return pcs[k:k + 12], {"hand": h, "line": nm, "index": k, "bar": int(evs[k].bar) if hasattr(evs[k], "bar") else None,
                                           "seconds_of_11": sum(1 for a, b in zip(pcs[k:k + 12], pcs[k + 1:k + 12]) if min((b - a) % 12, (a - b) % 12) in (1, 2))}
    return None, None


def first12_notes(s):
    pcs = []
    src = s.parts[0] if len(s.parts) else s       # the first staff only (the notes of both hands would interleave)
    for n in src.flatten().notes:
        for p in (n.pitches if n.isChord else [n.pitch]):
            pcs.append(int(p.pitchClass))
            if len(pcs) == 12:
                break
        if len(pcs) == 12:
            break
    return pcs if len(pcs) == 12 and len(set(pcs)) == 12 else None


def search(s, rows_):
    import music21.search.serial as ss
    t = time.perf_counter()
    f = ss.TransformedSegmentMatcher(s, "skipConsecutive", includeChords=True).find(rows_)
    dt = time.perf_counter() - t
    hits = {}
    for x in f:
        key = tuple(int(p) for p in x.matchedSegment)
        hits.setdefault(key, []).append([int(x.startMeasureNumber), [list(tr) for tr in x.zeroCenteredTransformationsFromMatched]])
    return hits, dt


def run_task(task):
    from music21 import converter, serial
    res = {"key": task["key"], "kind": task["kind"], "choices": {}}
    if task["kind"] == "cat":
        it = next(i for i in ITEMS if i["id"] == task["item_id"])
        sc = load(it)
    else:
        sc = load_path_v(task["path"])
    v = view(sc)
    if "current" in task["choices"]:
        from row_scan import current_detector
        res["current"] = current_detector(v)
    t = time.perf_counter()
    s = converter.parse(task["path"])
    res["sec_parse"] = time.perf_counter() - t
    HIST = {k: [int(x) for x in serial.getHistoricalRowByName(k).pitchClasses()] for k in sorted(serial.historicalDict)}
    for ch in task["choices"]:
        if ch == "current":
            continue
        if ch == "hist":
            hits, dt = search(s, list(HIST.values()))
            names = {tuple(v_): k for k, v_ in HIST.items()}
            res["choices"]["hist"] = {"sec": dt, "rows_found": {names[k]: len(v_) for k, v_ in hits.items()},
                                      "found": any(len(v_) >= 2 for v_ in hits.values()),
                                      "found_rows_ge2": [names[k] for k, v_ in hits.items() if len(v_) >= 2]}
            continue
        if ch == "oracle":
            row = task.get("oracle")
            info = None
        elif ch == "self":
            row, info = first_run12(v)
        elif ch == "first12":
            row, info = first12_notes(s), None
        if row is None:
            res["choices"][ch] = {"row": None, "n_statements": 0, "found": False, "sec": 0.0}
            continue
        hits, dt = search(s, [row])
        h = hits.get(tuple(row), [])
        res["choices"][ch] = {"row": row, "where": info, "n_statements": len(h), "forms": [x[1] for x in h][:8], "found": len(h) >= 2, "sec": dt}
    return res


if __name__ == "__main__":
    if len(sys.argv) >= 4 and sys.argv[1] == "--task":
        task = json.load(open(sys.argv[2]))
        try:
            out = run_task(task)
        except Exception as ex:  # noqa
            out = {"key": task["key"], "error": repr(ex)[:300]}
        json.dump(out, open(sys.argv[3], "w"))
