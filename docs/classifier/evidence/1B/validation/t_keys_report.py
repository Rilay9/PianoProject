from common import *
import collections
D = json.load(open(OUT / "keys_v.json"))
NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]
err = [k for k, r in D.items() if "error" in r]
print("items run:", len(D), "errors:", len(err), err[:6])


def right(ans, ref):
    return ans is not None and ans[0] == ref[0] and ans[1] == ref[1]


for grp in ["generated", "real"]:
    R = {k: r for k, r in D.items() if r.get("ref") and "error" not in r and ((r["p"] == "generated") == (grp == "generated"))}
    old_ans = sum(1 for r in R.values() if r["old"]); new_ans = sum(1 for r in R.values() if r["new"])
    old_ok = sum(1 for r in R.values() if right(r["old"], r["ref"])); new_ok = sum(1 for r in R.values() if right(r["new"], r["ref"]))
    bb_ok = sum(1 for r in R.values() if right(r.get("bb"), r["ref"])); ae_ok = sum(1 for r in R.values() if right(r.get("ae"), r["ref"]))
    print(f"\n== {grp}: {len(R)} reference items. first-version helper right {old_ok} / answered {old_ans}; corrected helper right {new_ok} / answered {new_ans}; BB right {bb_ok}; AE right {ae_ok}")
    fixed = [k for k, r in R.items() if right(r["new"], r["ref"]) and not right(r["old"], r["ref"])]
    broke = [k for k, r in R.items() if right(r["old"], r["ref"]) and not right(r["new"], r["ref"])]
    print("  corrected right, first wrong:", len(fixed), fixed[:20])
    print("  first right, corrected wrong:", len(broke), [(k, R[k]["new"], R[k]["info"]["src"], R[k]["flags"]) for k in broke][:20])
    wrong = [k for k, r in R.items() if r["new"] and not right(r["new"], r["ref"])]
    print("  corrected wrong answers:", len(wrong))
    for k in wrong:
        r = R[k]
        bbd = r.get("bb") and (r["bb"][0], r["bb"][1]) != (r["new"][0], r["new"][1])
        fl = list(r["flags"]) + (["b"] if bbd else [])
        print("    ", k, "ref", NAMES[r["ref"][0]], r["ref"][1], "got", NAMES[r["new"][0]], r["new"][1], r["new"][2], "src", r["info"]["src"], "flags", fl, "BB", r.get("bb"))
    unf = [k for k in wrong if not R[k]["flags"] and not (R[k].get("bb") and (R[k]["bb"][0], R[k]["bb"][1]) != (R[k]["new"][0], R[k]["new"][1]))]
    print("  wrong and unflagged (two-witness):", unf)
    # BB as second witness on the corrected helper
    agree = [k for k, r in R.items() if r["new"] and r.get("bb") and (r["bb"][0], r["bb"][1]) == (r["new"][0], r["new"][1])]
    print("  BB agrees with the corrected helper:", len(agree), "right of those:", sum(1 for k in agree if right(R[k]["new"], R[k]["ref"])),
          "| helper errors BB catches (disagrees):", sum(1 for k in wrong if R[k].get("bb") and (R[k]["bb"][0], R[k]["bb"][1]) != (R[k]["new"][0], R[k]["new"][1])), "of", len(wrong))
    ae_agree = [k for k, r in R.items() if r["new"] and r.get("ae") and (r["ae"][0], r["ae"][1]) == (r["new"][0], r["new"][1])]
    print("  AE agrees:", len(ae_agree), "right of those:", sum(1 for k in ae_agree if right(R[k]["new"], R[k]["ref"])),
          "| helper errors AE catches:", sum(1 for k in wrong if R[k].get("ae") and (R[k]["ae"][0], R[k]["ae"][1]) != (R[k]["new"][0], R[k]["new"][1])))
    bands = collections.defaultdict(lambda: [0, 0])
    for r in R.values():
        if r["new"]:
            bands[r["new"][2]][1] += 1
            bands[r["new"][2]][0] += right(r["new"], r["ref"])
    print("  bands right/answered:", dict(sorted(bands.items(), reverse=True)))

print("\n== ending source over every item (corrected rule)")
for grp in ["generated", "real"]:
    R = {k: r for k, r in D.items() if "error" not in r and "info" in r and ((r["p"] == "generated") == (grp == "generated"))}
    print(grp, len(R), dict(collections.Counter(r["info"]["src"] for r in R.values())))
    chg = [k for k, r in R.items() if r["old"] and r["new"] and (r["old"][0], r["old"][1]) != (r["new"][0], r["new"][1])]
    print("  key changed from the first version:", len(chg), [(k, NAMES[R[k]["old"][0]] + " " + R[k]["old"][1], NAMES[R[k]["new"][0]] + " " + R[k]["new"][1], R[k]["info"]["src"]) for k in chg][:40])
    f = [k for k, r in R.items() if "f" in r["flags"]]
    print("  flag f (ends on V7):", len(f), f[:40])
    d = [k for k, r in R.items() if "d" in r["flags"]]
    print("  flag d (modal):", len(d), "of which ending source 'beat':", sum(1 for k in d if R[k]["info"]["src"] == "beat"), d[:30])
    beat = [k for k, r in R.items() if r["info"]["src"] == "beat"]
    print("  ending read from an earlier beat:", len(beat), [(k, R[k]["info"]["tri"], R[k]["info"]["ending"], R[k]["flags"]) for k in beat][:25])
    # blues guard: a dominant-seventh ending whose root is a candidate tonic
    g = [k for k, r in R.items() if r["info"]["tri"] and r["info"]["tri"][2] and r["info"]["tri"][1] == "M" and "f" not in r["flags"]]
    print("  dominant-seventh endings kept on their own root (the I7 guard):", len(g), [(k, NAMES[R[k]["info"]["tri"][0]], R[k]["new"]) for k in g][:30])
