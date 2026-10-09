"""rhythm.tuplets-other: the current noise rules against 'read only printed <tuplet> brackets', from out/f3_scan.json.

CURRENT (the page's rule as the validators ran it, tup.py): a ratio a:b is a tuplet unless |a/b - 1| <= 0.05 (encoding noise);
        a closed bracket holding fewer notes than a is also noise (the fewer-notes test).
FIX, two variants of 'printed bracket' (the brief: <tuplet> with show-number / bracket):
  A  a closed <tuplet> start..stop bracket of that ratio exists in the file (any attributes);
  B  such a bracket draws something: bracket != "no" or show-number != "none".
A time-modification with no bracket (A) / no drawn bracket (B) is 'not printed' (to integrity.notation-sanity, kept in the excluded list).
Irregular figuration (feeds rhythm.cadenza): a not in (12,16,24,32) and (a >= 11 or (a >= 9 and a > 2*b)).

Writes out/f3_groups.json (one row per item and ratio) and prints the tables.
"""
import sys, json, collections, re
from pathlib import Path
HERE = Path(__file__).resolve().parent
S = json.load(open(HERE / "out/f3_scan.json", encoding="utf8"))


def pipe(i):
    return "gen" if i.startswith("exercise.") else "pdmx" if (i.endswith(".pdmx") or ".pdmx." in i) else "rep"


def irregular(a, b):
    return a not in (12, 16, 24, 32) and (a >= 11 or (a >= 9 and a > 2 * b))


def drawn(br):
    return br[4] != "no" or br[5] != "none"


def complete(br):
    """The written values inside the bracket add up to a x 2^k whole notes: the bracket really holds `a` notes of one base value
    (3:2 quarter+eighth = 3 eighths; 5:4 sixteenths = 5 sixteenths). A rest with no written type (None) leaves the test undecided -> treated as complete."""
    from fractions import Fraction as F
    if br[7] is None:
        return True
    a = br[0][0]
    q = F(br[7]) / a
    return q > 0 and (q.numerator == 1 or q.denominator == 1) and (q.numerator & (q.numerator - 1)) == 0 and (q.denominator & (q.denominator - 1)) == 0


rows = []
for i, v in S.items():
    if "error" in v:
        continue
    for r, (n, with_el, inside) in v["notes"].items():
        a, b = map(int, r.split(":"))
        brs = [x for x in v["brackets"] if x[0] == [a, b] and x[6] != "UNCLOSED"]
        rows.append({"item": i, "pipe": pipe(i), "ratio": r, "a": a, "b": b, "notes": n, "notes_with_tuplet_element": with_el,
                     "notes_inside_bracket": inside, "brackets": len(brs), "drawn_brackets": sum(1 for x in brs if drawn(x)),
                     "short_brackets": sum(1 for x in brs if x[1] < a), "complete_brackets": sum(1 for x in brs if complete(x)), "multi_brackets": sum(1 for x in brs if x[1] >= 2), "within5": abs(a / b - 1) <= 0.05, "irregular": irregular(a, b)})
json.dump(rows, open(HERE / "out/f3_groups.json", "w", encoding="utf8"), indent=0)

P = print
# the page's two noise rules at group level: ratio within 5% of 1, or every closed bracket of the ratio holds fewer notes than actual-notes
cur = lambda r: "noise" if (r["within5"] or (r["brackets"] and r["short_brackets"] == r["brackets"])) else "tuplet"
VARS = {"A": lambda r: "tuplet" if r["brackets"] else "not printed", "B": lambda r: "tuplet" if r["drawn_brackets"] else "not printed",
        "C (A, not within 5%, a bracket of 2+ notes)": lambda r: "tuplet" if (r["multi_brackets"] and not r["within5"]) else "not printed",
        "D (a bracket of 2+ notes, a != b; no 5% bound)": lambda r: "tuplet" if (r["multi_brackets"] and r["a"] != r["b"]) else "not printed"}
other = [r for r in rows if r["ratio"] != "3:2"]
P("== scope: item-ratio groups other than 3:2:", len(other), "in", len({r["item"] for r in other}), "items;", sum(r["notes"] for r in other), "notes")
for vn, fx in VARS.items():
    M = collections.Counter(); N = collections.Counter()
    for r in other:
        M[(cur(r), fx(r))] += 1; N[(cur(r), fx(r))] += r["notes"]
    P(f"\n-- variant {vn}: current x fix, groups (notes):")
    for k in sorted(M): P("  current", k[0], "| fix", k[1], ":", M[k], "groups", f"({N[k]} notes)")
    P("  irregular (to rhythm.cadenza): current route", sum(1 for r in other if r["irregular"] and cur(r) == "tuplet"), "groups in",
      len({r["item"] for r in other if r["irregular"] and cur(r) == "tuplet"}), "items | after fix", sum(1 for r in other if r["irregular"] and fx(r) == "tuplet"),
      "groups in", len({r["item"] for r in other if r["irregular"] and fx(r) == "tuplet"}), "items")

fxC = VARS["C (A, not within 5%, a bracket of 2+ notes)"]
P("\n== variant C vs current: groups C drops that current keeps (ratio item notes closed-brackets multi-note-brackets):")
for r in sorted([r for r in other if cur(r) == "tuplet" and fxC(r) != "tuplet"], key=lambda r: (r["item"], r["a"])):
    P("  ", r["ratio"], r["item"], r["notes"], r["brackets"], r["multi_brackets"], "irregular" if r["irregular"] else "")
P("== variant C vs current: groups C keeps that current drops (noise by the 5% bound or the fewer-notes test):", [(r["ratio"], r["item"]) for r in other if cur(r) == "noise" and fxC(r) == "tuplet"])
fx = VARS["A"]
P("\n== variant A: groups the FIX removes from 'tuplet' (current keeps them): ratio, item, notes, notes-with-<tuplet>, closed brackets")
for r in sorted([r for r in other if cur(r) == "tuplet" and fx(r) == "not printed"], key=lambda r: (r["item"], r["a"])):
    P("  ", r["ratio"], r["item"], r["notes"], r["notes_with_tuplet_element"], r["brackets"], "irregular" if r["irregular"] else "")
P("\n== variant A: groups the FIX keeps that CURRENT calls noise (ratio within 5%):")
for r in [r for r in other if cur(r) == "noise" and fx(r) == "tuplet"]:
    P("  ", r["ratio"], r["item"], r["notes"], "closed brackets", r["brackets"])
P("\n== variant A: noise under both:")
for r in [r for r in other if cur(r) == "noise" and fx(r) != "tuplet"]:
    P("  ", r["ratio"], r["item"], r["notes"])
P("\n== variant B minus A: groups with a bracket but none drawn:")
for r in [r for r in other if VARS["A"](r) == "tuplet" and VARS["B"](r) != "tuplet"]:
    P("  ", r["ratio"], r["item"], r["notes"], "brackets", r["brackets"], "irregular" if r["irregular"] else "")

# the fewer-notes test
allbr = [(i, x) for i, v in S.items() if "error" not in v for x in v["brackets"]]
closed = [(i, x) for i, x in allbr if x[6] != "UNCLOSED"]
short = [(i, x) for i, x in closed if x[0] and x[1] < x[0][0]]
P("\n== brackets closed:", len(closed), "| fewer notes than actual-notes (counted across bar lines and both staves of a voice):", len(short),
  "| ratio 3:2:", sum(1 for i, x in short if x[0] == [3, 2]), "| ratio within 5%:", sum(1 for i, x in short if abs(x[0][0] / x[0][1] - 1) <= .05))
P("   short brackets by ratio:", dict(collections.Counter(f"{x[0][0]}:{x[0][1]}" for i, x in short).most_common(14)))
inc = [(i, x) for i, x in closed if x[0] and not complete(x)]
P("   brackets whose written values do NOT add up to a x 2^k (the sum test):", len(inc), "| of them within the 5% bound:", sum(1 for i, x in inc if abs(x[0][0] / x[0][1] - 1) <= .05),
  "| ratio 3:2:", sum(1 for i, x in inc if x[0] == [3, 2]), "| by ratio:", dict(collections.Counter(f"{x[0][0]}:{x[0][1]}" for i, x in inc).most_common(20)))
P("   incomplete brackets, items:", sorted({i for i, x in inc}))
P("   of the", len(short), "fewer-notes brackets, how many the sum test also calls incomplete:", sum(1 for i, x in short if not complete(x)))
P("   unclosed brackets:", sum(1 for i, x in allbr if x[6] == "UNCLOSED"), "| brackets with bracket=no and show-number=none:", sum(1 for i, x in closed if not drawn(x)))

# cost: time-modification notes with no <tuplet> element, by ratio
P("\n== notes with a time-modification but NO <tuplet> notation (variant A would not see them), by ratio")
tot = collections.Counter(); miss = collections.Counter(); items_none = collections.defaultdict(set)
for r in rows:
    tot[r["ratio"]] += r["notes"]; miss[r["ratio"]] += r["notes"] - r["notes_with_tuplet_element"]
    if r["brackets"] == 0: items_none[r["ratio"]].add(r["item"])
for rt, k in sorted(tot.items(), key=lambda kv: -kv[1])[:10]:
    P("  ", rt, "notes", k, "| without a <tuplet> element:", miss[rt], "| items where the ratio has no closed bracket at all:", len(items_none[rt]))
P("   all ratios:", sum(tot.values()), "notes;", sum(miss.values()), "without a <tuplet> element; groups with no closed bracket:",
  sum(1 for r in rows if not r["brackets"]), "of", len(rows), "| 3:2 groups without one, by pipeline:",
  dict(collections.Counter(r["pipe"] for r in rows if r["ratio"] == "3:2" and not r["brackets"])), "of", dict(collections.Counter(r["pipe"] for r in rows if r["ratio"] == "3:2")))
