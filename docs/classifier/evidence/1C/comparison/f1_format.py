"""item.format: the current layout rules (the area-1A validators' fmt_measures, unchanged) against two smallest fixes.

Fix A (lead sheet): the 10% two-note-onset cut of rule 3 raised to CUT_NEW (the row's own evidence: Blue Bossa 0.118).
Fix B (UNKNOWN layout): the rule 'one part, two staves, chord symbols, lower staff silent in at least half the bars'
        is not applied to generated items (a generated layout is code's: from the file's own rules 1 to 4 / the family).
The UNKNOWN rule is not in fmt_measures; the validators ran it in survey_last.py ('partial'); it is repeated here
line for line (survey_last.py lines 14-19) and the unchanged survey_last.py output is checked against it.

Writes out/f1_format.json (every catalogue item, before and after) and out/f1_format_sweep.json.
Run with the repo .venv:  python f1_format.py
"""
import sys, json, collections
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path[:0] = [str(HERE / "shim1a"), str((HERE / "../../1A/validation").resolve())]
from common import *                                              # validators' common.py (unchanged)
from r_format import fmt_measures, other_instrument, purpose, staves_of   # validators' detector (unchanged)

CUT_OLD, CUT_NEW = 0.10, 0.20


def unknown_rule(i, w, skip_generated):
    """survey_last.py lines 14-19: one part, two staves, chord symbols, lower staff silent in at least half the bars."""
    if skip_generated and pipeline(i) == "generated":
        return None
    sv = staves_of(w)
    if len(w["parts"]) == 1 and sv[0] == 2 and w["harm"]:
        bars = n_measures(w)
        low = {n["m"] for n in w["notes"] if struck(n) and n["staff"] == 2}
        if bars and (bars - len(low)) >= bars / 2:
            return {"bars": bars, "bars_with_lower_notes": len(low)}
    return None


def layout_current(i, w):
    r = fmt_measures(w)
    u = unknown_rule(i, w, skip_generated=False)
    return ("UNKNOWN", r, u) if u else (r["layout"], r, None)


def lead_ok(r, cut):
    """rule 3 lead-sheet condition with the cut as a parameter (fmt_measures prints syms, bars, multi in its evidence)."""
    return r.get("rule") == 3 and r["syms"] and r["syms"] >= r["bars"] / 4 and r["multi"] < cut


def layout_fixed(i, w, cut=CUT_NEW, fix_a=True, fix_b=True):
    r = fmt_measures(w)
    lay = r["layout"]
    if fix_a and lay == "piano score (one-hand part)" and lead_ok(r, cut):
        lay = "lead sheet"
    u = unknown_rule(i, w, skip_generated=fix_b)
    return ("UNKNOWN" if u else lay), r, u


if __name__ == "__main__":
    items = {}
    for i in BYID:
        w = cache(i)
        b, rb, ub = layout_current(i, w)
        a, ra, ua = layout_fixed(i, w)
        items[i] = {"pipeline": pipeline(i), "before": b, "after": a, "rule": rb.get("rule"),
                    "syms": rb.get("syms"), "bars": rb.get("bars"), "multi": rb.get("multi"),
                    "unknown_before": ub, "other_instr": other_instrument(w) if pipeline(i) != "generated" else [],
                    "title": w["title"]}
    json.dump(items, open(HERE / "out/f1_format.json", "w", encoding="utf8"), indent=1, ensure_ascii=False)

    cnt_b = collections.Counter((v["pipeline"], v["before"]) for v in items.values())
    cnt_a = collections.Counter((v["pipeline"], v["after"]) for v in items.values())
    print("catalogue items walked:", len(items))
    print("COUNTS before (pipeline, layout):")
    for k, v in sorted(cnt_b.items()): print("  ", k, v)
    print("COUNTS after:")
    for k, v in sorted(cnt_a.items()): print("  ", k, v)
    print("items whose layout changes:")
    for i, v in items.items():
        if v["before"] != v["after"]:
            print("  ", i, "|", v["before"], "->", v["after"], "| multi", v["multi"], "syms", v["syms"], "bars", v["bars"])

    # sweep of the cut: how many items change from piano score (one-hand part) to lead sheet at each cut
    sweep = {}
    for cut in (0.10, 0.11, 0.12, 0.15, 0.20, 0.25, 0.27, 0.28, 0.30, 0.40, 0.50):
        ch = [i for i in BYID if (lambda r: r["layout"] == "piano score (one-hand part)" and lead_ok(r, cut))(fmt_measures(cache(i)))]
        sweep[cut] = ch
    json.dump(sweep, open(HERE / "out/f1_format_sweep.json", "w", encoding="utf8"), indent=1)
    print("SWEEP (cut: items newly lead sheet):", {k: len(v) for k, v in sweep.items()})

    # named items
    exp = json.load(open(HERE / "expected_format.json", encoding="utf8"))
    print("NAMED ITEMS (expected | before | after | multi | other-instrument flag):")
    for i, e in exp.items():
        if i.startswith("_"):
            continue
        v = items[i]
        print("  ", i[:70], "|", e, "|", v["before"], "|", v["after"], "| multi", v["multi"], "|", v["other_instr"])
