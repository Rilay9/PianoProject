"""rhythm.cadenza: the rule as the area page states it (BEFORE) against the two smallest fixes (AFTER), per item and route.

Routes: cue-size runs >= a beat, grace runs of 6+, irregular tuplets, cadenza words. The validators' cadenza.scan is called UNCHANGED for the
cue, grace and word routes (it reads the item's own file). Irregular tuplets come from out/f3_groups.json (one row per item and ratio, all parts; cadenza.scan itself reads only the first <part>
and applies no noise rule), so the same data serves both rules.

BEFORE (the page): cue route reads 'the PDMX source file mapped by content/sources/pdmx.json'; an item with no mapped source answers UNKNOWN
        (every rep item, every unmapped PDMX item; generated items have no cue by the family list and are not asked).
        irregular route = irregular ratios that survive rhythm.tuplets-other as written: not within 5% of 1, and the bracket holds at least a notes.
AFTER:  cue route reads the item's own file in every pipeline (the 544 mapped sources are byte-identical to the app's files: same_all.py);
        irregular route = irregular ratios in a closed bracket of 2+ notes with a != b (the tuplets-other fix, variant D of f3_analyse.py).
Writes out/f4_items.json.  Run with the repo .venv:  python f4_cadenza.py
"""
import sys, json, collections
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path[:0] = [str(HERE / "shim1c"), str((HERE / "../../1C/validation").resolve())]
import common  # the shim's
from common import CAT, CONTENT, MAIN
import cadenza  # the validators' (unchanged)

GROUPS = collections.defaultdict(list)
for g in json.load(open(HERE / "out/f3_groups.json", encoding="utf8")):   # one row per item and ratio (f3_analyse.py), all parts
    GROUPS[g["item"]].append(g)
d = json.loads((MAIN / "content/sources/pdmx.json").read_text(encoding="utf-8"))
key = [k for k, v in d.items() if isinstance(v, list) and v and isinstance(v[0], dict) and "cid" in v[0]][0]
MAPPED = {e["id"] for e in d[key] if (MAIN / "content/scores/pdmx" / e["file"]).exists()}


def pipe(i):
    return "gen" if i.startswith("exercise.") else "pdmx" if (i.endswith(".pdmx") or ".pdmx." in i) else "rep"


def irregular(a, b):
    return a not in (12, 16, 24, 32) and (a >= 11 or (a >= 9 and a > 2 * b))


items = {}
for it in CAT:
    if not it.get("file"):
        continue
    i = it["id"]
    cr, gr, irr_val, wd = cadenza.scan(i, CONTENT / it["file"])
    cue_c = [c for c in cr if c[3]]
    gs = GROUPS.get(i, [])
    # BEFORE: ratio kept by tuplets-other as written (not within 5% of 1; not removed by the fewer-notes test, which acts only on brackets that exist)
    irr_before = sorted({g["ratio"] for g in gs if irregular(g["a"], g["b"]) and not g["within5"] and not (g["brackets"] and g["short_brackets"] == g["brackets"])})
    # AFTER: printed bracket of 2+ notes, ratio not 1
    irr_after = sorted({g["ratio"] for g in gs if irregular(g["a"], g["b"]) and g["multi_brackets"] and g["a"] != g["b"]})
    p = pipe(i)
    cue_before = "none (family)" if p == "gen" else ("candidate" if (i in MAPPED and cue_c) else ("none" if i in MAPPED else "UNKNOWN"))
    cue_after = "candidate" if cue_c else "none"
    items[i] = {"pipe": p, "mapped": i in MAPPED, "cue_runs_ge_beat": len(cue_c), "cue_runs_all": len(cr), "cue_sizes": [c[1] for c in cue_c][:12], "cue_bars": [c[0] for c in cue_c][:12],
                "grace6": [list(g) for g in gr][:6], "words": [list(w) for w in wd][:4],
                "irr_validators_cadenza_py": sorted({x[1] for x in irr_val}), "irr_before": irr_before, "irr_after": irr_after,
                "cue_before": cue_before, "cue_after": cue_after}
json.dump(items, open(HERE / "out/f4_items.json", "w", encoding="utf8"), indent=0)

P = print
P("items scanned:", len(items), "| PDMX ids with a held source (pdmx.json, file present) in the catalogue:", sum(1 for v in items.values() if v["mapped"]),
  "| mapped ids not in the catalogue:", len(MAPPED - set(items)))
P("\n== cue route, by pipeline: items whose own file has a cue-size run >= a beat; the page's answer for them")
for p in ("gen", "pdmx", "rep"):
    its = {i: v for i, v in items.items() if v["pipe"] == p}
    P(f"  {p}: items {len(its)} | own file has a candidate cue run: {sum(1 for v in its.values() if v['cue_runs_ge_beat'])}"
      f" | page BEFORE: candidate {sum(1 for v in its.values() if v['cue_before']=='candidate')}, UNKNOWN {sum(1 for v in its.values() if v['cue_before']=='UNKNOWN')},"
      f" none {sum(1 for v in its.values() if v['cue_before'] in ('none','none (family)'))} | AFTER candidate {sum(1 for v in its.values() if v['cue_after']=='candidate')}")
P("  items with a cue candidate that the page answers UNKNOWN for:", [i for i, v in items.items() if v["cue_runs_ge_beat"] and v["cue_before"] == "UNKNOWN"])
P("  items the page would call UNKNOWN for the cue route (all non-generated unmapped):", sum(1 for v in items.values() if v["cue_before"] == "UNKNOWN"))

P("\n== irregular route: items with at least one irregular ratio")
P("  validators' cadenza.py as run (no noise rule):", sum(1 for v in items.values() if v["irr_validators_cadenza_py"]))
P("  BEFORE (page: not within 5%, bracket holds >= a notes):", sum(1 for v in items.values() if v["irr_before"]),
  "| AFTER (bracket of 2+ notes, a != b):", sum(1 for v in items.values() if v["irr_after"]))
P("  ratios BEFORE not AFTER (item: ratios):")
for i, v in items.items():
    gone = sorted(set(v["irr_before"]) - set(v["irr_after"]))
    new = sorted(set(v["irr_after"]) - set(v["irr_before"]))
    if gone or new:
        P("    ", i, "| dropped:", gone, "| added:", new)
P("  ratios kept (before and after):", {i: v["irr_after"] for i, v in items.items() if v["irr_after"]})

tot = collections.Counter()
for v in items.values():
    for rt, on in (("cue", v["cue_runs_ge_beat"]), ("grace6", v["grace6"]), ("words", v["words"])):
        tot[rt] += bool(on)
P("\n== other routes (same before and after): items with grace run 6+:", tot["grace6"], "| items with a cadenza word:", tot["words"])
anyb = {i for i, v in items.items() if (v["cue_before"] == "candidate") or v["grace6"] or v["words"] or v["irr_before"]}
anya = {i for i, v in items.items() if v["cue_runs_ge_beat"] or v["grace6"] or v["words"] or v["irr_after"]}
P("items with at least one code candidate: BEFORE", len(anyb), "| AFTER", len(anya), "| gained", len(anya - anyb), sorted(anya - anyb), "| lost", len(anyb - anya), sorted(anyb - anya))

exp = json.load(open(HERE / "expected_cadenza.json", encoding="utf8"))
P("\n== NAMED positives: route evidence; BEFORE (page) vs AFTER")
for i, why in exp["positives_to_flag"].items():
    v = items[i]
    b = bool(v["cue_before"] == "candidate" or v["grace6"] or v["words"] or v["irr_before"])
    a = bool(v["cue_runs_ge_beat"] or v["grace6"] or v["words"] or v["irr_after"])
    P(f"  {i}\n      expected: {why}\n      cue runs>=beat {v['cue_runs_ge_beat']} (page: {v['cue_before']}) bars {v['cue_bars'][:6]} | grace6 {v['grace6']} | words {v['words']} | irr before {v['irr_before']} after {v['irr_after']}"
      f"\n      candidate BEFORE {b} | AFTER {a}")
P("\n== NEAR-MISSES / artefact checks")
for grp in ("near_miss_for_the_agent", "must_not_flag_from_artefacts"):
    for i, why in exp[grp].items():
        v = items[i]
        P(f"  [{grp}] {i}\n      {why}\n      cue runs>=beat {v['cue_runs_ge_beat']} (sizes {v['cue_sizes'][:8]}) page:{v['cue_before']} | grace6 {v['grace6']} | irr validators' script {v['irr_validators_cadenza_py']} before {v['irr_before']} after {v['irr_after']}")
