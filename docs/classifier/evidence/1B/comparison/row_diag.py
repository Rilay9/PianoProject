"""pitch.tone-row: why the current detector's statement test (page rule 1, "not a scale figure") misses some rows, and what it separates.
For each of the 71 rows of music21's table (the first statement of a V1 score is the row itself) and for every 12-note window with 12
different pitch classes in the catalogue's lines (no filter; both top and bottom lines of every readable item), the three features of
rule 1: steps by a second (of 11), the longest run of seconds, and whether the even-position notes and the odd-position notes each move
only by seconds. Writes row_diag.json and frag_row_diag.md. Usage: python -X utf8 row_diag.py"""
from row_lib import *
import collections
from music21 import serial
from multiprocessing import Pool


def sec(a, b):
    return min((b - a) % 12, (a - b) % 12) in (1, 2)


def feats(w):
    s = [sec(a, b) for a, b in zip(w, w[1:])]
    run = best = 0
    for x in s:
        run = run + 1 if x else 0
        best = max(best, run)
    ev, od = w[0::2], w[1::2]
    inter = all(sec(a, b) for a, b in zip(ev, ev[1:])) and all(sec(a, b) for a, b in zip(od, od[1:]))
    return {"seconds": sum(s), "longest_run": best, "interleaved": bool(inter),
            "rejected_by": [c for c, bad in (("8+ seconds", sum(s) >= 8), ("5+ seconds in a row", best >= 5), ("two interleaved stepwise lines", inter)) if bad]}


def cat_windows(idx):
    it = ITEMS[idx]
    out = []
    try:
        if one_line_staff(it):
            return out
        v = view(load(it))
        if v.unknown:
            return out
        for h, evs in v.hands.items():
            top = [e.high for e in evs]
            bot = [e.low for e in evs]
            for nm, line in (("top", top),) if top == bot else (("top", top), ("bottom", bot)):
                pcs = [p % 12 for p in line]
                for k in range(len(pcs) - 11):
                    w = pcs[k:k + 12]
                    if len(set(w)) == 12:
                        f = feats(w)
                        f.update({"id": it["id"], "p": pipeline(it), "pos": [h, nm, k]})
                        out.append(f)
    except Exception:
        pass
    return out


if __name__ == "__main__":
    rows_ = {k: [int(x) for x in serial.getHistoricalRowByName(k).pitchClasses()] for k in sorted(serial.historicalDict)}
    R = {k: feats(r) for k, r in rows_.items()}
    with Pool(3, maxtasksperchild=50) as pool:
        W = [w for res in pool.imap(cat_windows, range(len(ITEMS)), chunksize=8) for w in res]
    json.dump({"rows": R, "catalogue_windows": W}, open(HERE / "row_diag.json", "w"))
    out = []
    n = len(R)
    out.append(f"**Why the statement test misses some rows (`row_diag.py`).** Rule 1 rejects a 12-note window with 8 or more steps by a second (of 11), or 5 seconds in a row, or two interleaved stepwise lines. Applied to the 71 rows of music21's table (as one line): rejected by any clause {sum(1 for f in R.values() if f['rejected_by'])} of {n}; by clause: " +
               ", ".join(f"{c}: {sum(1 for f in R.values() if c in f['rejected_by'])}" for c in ("8+ seconds", "5+ seconds in a row", "two interleaved stepwise lines")) + ". Rows rejected: " + (", ".join(f"{k} ({'/'.join(f['rejected_by'])}; {f['seconds']} seconds, longest run {f['longest_run']})" for k, f in R.items() if f["rejected_by"]) or "none") + ".\n")
    hist = collections.Counter(f["seconds"] for f in R.values())
    chist = collections.Counter(w["seconds"] for w in W)
    n_items = len({w["id"] for w in W})
    out.append(f"The catalogue's 12-note windows with 12 different pitch classes (no filter): {len(W)} windows in {n_items} items. Steps by a second in the window (of 11), rows of the table against catalogue windows:\n")
    out.append("| steps by a second | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 |")
    out.append("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |")
    out.append("| table rows (71) | " + " | ".join(str(hist.get(i, 0)) for i in range(12)) + " |")
    out.append("| catalogue windows | " + " | ".join(str(chist.get(i, 0)) for i in range(12)) + " |")
    out.append("")
    kept = [w for w in W if not w["rejected_by"]]
    out.append(f"Catalogue windows that rule 1 accepts: {len(kept)} in {len({w['id'] for w in kept})} items ({', '.join(sorted({w['id'] for w in kept})[:6])}).")
    (HERE / "frag_row_diag.md").write_text("\n".join(out), encoding="utf-8")
    print("\n".join(out))
