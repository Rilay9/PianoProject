"""pitch.tone-row, catalogue pass 1: the current detector (validation/t_poly_row.py's rows(), windows(), page rule 1-4) on every
readable catalogue item, plus the unfiltered "12 distinct pitch classes in 12 consecutive notes of a line" flag.
Writes row_scan.json. The page's rule 2-3 (the later statements are forms of the first, found by music21's
findZeroCenteredTransformations) is applied here as `present`.
Usage: python -X utf8 row_scan.py"""
from row_lib import *
from multiprocessing import Pool


def forms_of(prime, other):
    from music21 import serial
    r = serial.pcToToneRow(list(prime)).findZeroCenteredTransformations(serial.pcToToneRow(list(other)))
    return r if isinstance(r, list) else []


def current_detector(v):
    """-> dict for one item's view (rules/texture view): statements, which are forms of the first, windows, the trigger."""
    t0 = time.perf_counter()
    sts = rows(v)
    forms = []
    if sts:
        forms = [forms_of(sts[0], s) for s in sts[1:]]
    cw, two = windows(v)
    present = any(forms)
    return {"statements": [list(s) for s in sts], "n_statements": len(sts), "later_forms": [f for f in forms], "present": bool(present),
            "windows": cw, "consecutive_window_pairs": two, "to_agent": bool(two or len(sts) >= 1),
            "sec": time.perf_counter() - t0}


def run_item(idx):
    it = ITEMS[idx]
    rec = {"id": it["id"], "p": pipeline(it), "fam": fam(it), "title": it["title"], "composer": it.get("composer")}
    try:
        if one_line_staff(it):
            rec["skip"] = "one-line staff"
            return rec
        sc = load(it)
        v = view(sc)
        if v.unknown:
            rec["skip"] = "view unknown"
            return rec
        rec["bars"] = v.n_bars
        rec["run12"] = run12_items(v)
        rec["cur"] = current_detector(v)
    except Exception as ex:  # noqa
        rec["error"] = repr(ex)[:160]
    return rec


if __name__ == "__main__":
    t0 = time.time()
    out = []
    with Pool(3, maxtasksperchild=50) as pool:
        for k, r in enumerate(pool.imap(run_item, range(len(ITEMS)), chunksize=4)):
            out.append(r)
            if k % 200 == 0:
                print(k, round(time.time() - t0), flush=True)
    json.dump(out, open(HERE / "row_scan.json", "w"))
    ok = [r for r in out if "cur" in r]
    print("done", round(time.time() - t0), "items", len(out), "scanned", len(ok), "errors", sum(1 for r in out if "error" in r), "skipped", sum(1 for r in out if "skip" in r))
    print("12-run (unfiltered):", sum(1 for r in ok if r["run12"]), "| >=1 statement:", sum(1 for r in ok if r["cur"]["n_statements"] >= 1),
          "| present:", sum(1 for r in ok if r["cur"]["present"]), "| to agent:", sum(1 for r in ok if r["cur"]["to_agent"]),
          "| consecutive window pairs:", sum(1 for r in ok if r["cur"]["consecutive_window_pairs"]))
