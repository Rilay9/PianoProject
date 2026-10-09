"""pitch.tone-row, "current detector with fix": page rule 1's scale-figure test relaxed on the evidence of row_diag.py.
The current clause set rejects a 12-note window with 8 or more steps by a second (of 11), or 5 seconds in a row, or two interleaved
stepwise lines. Fix F: reject only 10 or more seconds (a chromatic or whole-tone scale has 10 or 11) or two interleaved stepwise lines.
IN-SAMPLE: the threshold is read off the 71 table rows that the positives are built from (row_diag.py), so the recall below is not a test
of the fix on new rows; the false-find side (catalogue, counterexamples) is not tuned. Everything else is the validators' code.
Writes row_fix.json and frag_row_fix.md. Usage: python -X utf8 row_fix.py"""
from row_lib import *
import row_lib
from multiprocessing import Pool


def ok_fix(w):
    if len(set(p % 12 for p in w)) < 12:
        return False
    s = [(min((b - a) % 12, (a - b) % 12) in (1, 2)) for a, b in zip(w, w[1:])]
    if sum(s) >= 10:
        return False
    ev, od = w[0::2], w[1::2]
    sec_ = lambda a, b: min((b - a) % 12, (a - b) % 12) in (1, 2)
    if all(sec_(a, b) for a, b in zip(ev, ev[1:])) and all(sec_(a, b) for a, b in zip(od, od[1:])):
        return False
    return True


PR["ok_window"] = ok_fix        # `statements` looks the name up in this namespace
from row_scan import current_detector


def run_item(idx):
    it = ITEMS[idx]
    rec = {"id": it["id"], "p": pipeline(it), "title": it["title"]}
    try:
        if one_line_staff(it):
            return rec
        v = view(load(it))
        if v.unknown:
            return rec
        rec["cur"] = current_detector(v)
    except Exception as ex:  # noqa
        rec["error"] = repr(ex)[:100]
    return rec


def run_case(c):
    try:
        v = view(load_path_v(c["path"]))
        return c["id"], current_detector(v)
    except Exception as ex:  # noqa
        return c["id"], {"error": repr(ex)[:100]}


if __name__ == "__main__":
    cases = json.load(open(HERE / "row_cases.json"))
    with Pool(3, maxtasksperchild=50) as pool:
        cat = list(pool.imap(run_item, range(len(ITEMS)), chunksize=4))
        built = dict(pool.imap(run_case, cases, chunksize=2))
    json.dump({"cat": cat, "built": built}, open(HERE / "row_fix.json", "w"))
    ok = [r for r in cat if "cur" in r]
    base = {r["id"]: r for r in json.load(open(HERE / "row_scan.json")) if "cur" in r}
    md = ["**Current detector with fix F (reject only 10 or more steps by a second, or two interleaved stepwise lines; the 8-second and 5-in-a-row clauses dropped).** In-sample for the positives (the threshold was read off the same 71 rows); the catalogue and counterexample columns are not tuned.\n",
          "| set | current (rule as written) | with fix F |", "| --- | --- | --- |"]
    for pref, lbl in (("V1", "V1 one line P, I, R: row present (of 71)"), ("V2", "V2 split between the hands: present (of 12)"), ("V3", "V3 repeated notes: present (of 12)")):
        ids = [c["id"] for c in cases if c["id"].startswith(pref)]
        # current figures come from row_music21_results.json (same detector)
        M = json.load(open(HERE / "row_music21_results.json"))
        cur_p = sum(1 for i in ids if M.get(f"built|{i}|all", {}).get("current", {}).get("present"))
        fix_p = sum(1 for i in ids if built.get(i, {}).get("present"))
        md.append(f"| {lbl} | {cur_p} | {fix_p} |")
    for lbl, f in (("catalogue items with a statement (of %d scanned)" % len(ok), lambda r: r["n_statements"] >= 1), ("catalogue items with a row present", lambda r: r["present"]),
                   ("catalogue items sent to the agent", lambda r: r["to_agent"])):
        cur_n = sum(1 for r in base.values() if f(r["cur"]))
        fix_n = sum(1 for r in ok if f(r["cur"]))
        md.append(f"| {lbl} | {cur_n} | {fix_n} |")
    newly = sorted(r["id"] for r in ok if r["cur"]["n_statements"] >= 1 and base.get(r["id"], {}).get("cur", {}).get("n_statements", 0) == 0)
    md.append("")
    md.append("Catalogue items that gain a statement under F: " + (", ".join(newly) if newly else "none") + ".\n")
    md.append("Counterexamples under F (statements / present): " + "; ".join(f"{c['id']}: {built.get(c['id'], {}).get('n_statements')} / {'yes' if built.get(c['id'], {}).get('present') else 'no'}" for c in cases if c["id"].startswith("N")) + ".")
    (HERE / "frag_row_fix.md").write_text("\n".join(md), encoding="utf-8")
    print("\n".join(md))
