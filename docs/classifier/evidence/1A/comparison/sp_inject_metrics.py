"""Catch-rate tables from sp_inject_results.json -> frag_inject.md, sp_inject_metrics.json."""
from cmp_common import *

D = json.load(open(HERE / "sp_inject_results.json", encoding="utf8"))
recs = [dict(r, set=p["set"]) for p in D if "recs" in p for r in p["recs"]]
SET = {p["key"]: p["set"] for p in json.load(open(HERE / "sp_pieces.json", encoding="utf8"))["pieces"]}
for r in recs:
    r["set"] = SET[r["key"]]
ROWS = [
    ("kind2", "current: spelling filter (PS13 + gate)"),
    ("t2b", "current: test 2b"),
    ("t2b_fix", "test 2b with fix v1"),
    ("t2b_fix2", "test 2b with fix v2"),
    ("cur", "current detector (kind 2 or test 2b)"),
    ("curfix", "current detector with fix v1 (kind 2 or fixed 2b)"),
    ("curfix2", "current detector with fix v2 (kind 2 or fixed 2b)"),
    ("ps13_diff", "ps13, every difference"),
    ("pks_diff", "PKSpell, every difference"),
    ("pks_gate", "PKSpell with the gate"),
    ("both_diff", "ps13 and PKSpell agree, differs from written"),
    ("both_gate", "the same, with the gate"),
    ("pksfix", "PKSpell with the gate or 2b with fix v1"),
    ("pksfix2", "PKSpell with the gate or 2b with fix v2"),
]


def hit(r, k):
    if k == "cur": return r["kind2"] or r["t2b"]
    if k == "curfix": return r["kind2"] or r["t2b_fix"]
    if k == "pksfix": return r["pks_gate"] or r["t2b_fix"]
    if k == "curfix2": return r["kind2"] or r["t2b_fix2"]
    if k == "pksfix2": return r["pks_gate"] or r["t2b_fix2"]
    return r[k]


def tab(rs):
    out = {"n": len(rs)}
    for k, lab in ROWS:
        c = sum(1 for r in rs if hit(r, k))
        out[k] = [c, round(100 * c / len(rs), 1) if rs else None]
    return out


def md(t, title):
    s = [f"**{title}: {t['n']} injected misspellings.**\n", "| method | caught | missed |", "| --- | --- | --- |"]
    for k, lab in ROWS:
        c, p = t[k]
        s.append(f"| {lab} | {c} ({p}%) | {t['n'] - c} |")
    return "\n".join(s) + "\n"


M, frag = {}, []
groups = [("wir", "When in Rome keyboard", lambda r: r["set"] == "wir"), ("m21ch", "Bach chorales", lambda r: r["set"] == "m21ch"),
          ("m21kb", "music21 keyboard works", lambda r: r["set"] == "m21kb"), ("all", "All injected", lambda r: True),
          ("all_inkey", "All injected, the original spelling was in key", lambda r: r["orig_diatonic"]),
          ("all_chrom", "All injected, the original spelling was chromatic (outside the key signature)", lambda r: not r["orig_diatonic"])]
for g, title, f in groups:
    M[g] = tab([r for r in recs if f(r)]); frag.append(md(M[g], title))
# PS13/PKSpell: how often does the tool's own spelling equal the injected one (they would "confirm" the error)?
M["tools_agree_with_injected"] = {"ps13": sum(1 for r in recs if r["ps13_says"] == r["injected"][:-1]),
                                  "pks": sum(1 for r in recs if r["pks_says"] == r["injected"][:-1]), "n": len(recs)}
M["tools_agree_with_original"] = {"ps13": sum(1 for r in recs if r["ps13_says"] == r["orig"][:-1]),
                                  "pks": sum(1 for r in recs if r["pks_says"] == r["orig"][:-1]), "n": len(recs)}
M["injected_diatonic_share"] = sum(1 for r in recs if r["injected_diatonic"])
json.dump(M, open(HERE / "sp_inject_metrics.json", "w", encoding="utf8"), indent=1)
(HERE / "frag_inject.md").write_text("\n".join(frag), encoding="utf8")
print("\n".join(frag)); print(M["tools_agree_with_injected"], M["tools_agree_with_original"], M["injected_diatonic_share"])
