"""The figures for the mark.repeat part of repeat-times.md, from rep_readers.json, rep_readings.json, expected_repeat_named.json, rep_structure.json.
Writes rep_summary.json and prints the tables."""
import json, collections
from pathlib import Path
HERE = Path(__file__).resolve().parent
R = json.load(open(HERE / "rep_readers.json", encoding="utf8"))
S = json.load(open(HERE / "rep_structure.json", encoding="utf8"))
RD = json.load(open(HERE / "rep_readings.json", encoding="utf8"))
F, SPOT = RD["files"], RD["spot"]
EXP = json.load(open(HERE / "expected_repeat_named.json", encoding="utf8"))
out = {}


def isint(v):
    return isinstance(v, int)


# 1. named items
print("== named items (expected written before the readers ran: expected_repeat_named.json)")
named = {}
for i, e in EXP.items():
    if i.startswith("_"):
        continue
    r = R[i]
    row = {"expected": e["expected"], "alternative": e.get("alternative"), "printed": r["printed"]}
    for k in ("unroller", "unroller_cp", "music21", "pt_max_noleap", "pt_max", "pt_min"):
        v = r[k]
        if e["expected"] is None:
            verdict = "no single right count"
        elif not isint(v):
            verdict = "no count"
        else:
            verdict = "right" if v == e["expected"] else "wrong"
        row[k] = [v, verdict]
    named[i] = row
    print(i.replace("song.", ""), json.dumps(row, ensure_ascii=False))
out["named"] = named

# 2. verdicts per reader over the files read
print("\n== readers against the reading, 88 files where readers differ (undetermined files left out of the right/wrong count)")
ver = {}
for rd in ("unroller", "unroller_cp", "music21", "pt_max_noleap", "pt_max", "pt_min"):
    c = collections.Counter()
    for i, e in F.items():
        if e["kind"] == "undetermined":
            c["file undetermined"] += 1
            continue
        v = R[i][rd]
        c["no count" if not isint(v) else ("right" if v == e["reading"] else "wrong")] += 1
    ver[rd] = dict(c)
    print(rd, dict(c))
out["verdict_88"] = ver

# 3. wrong music21 / partitura: direction and cause class
print("\n== music21: wrong counts, by direction (over = more bars than the reading)")
c = collections.Counter(); over = []
for i, e in F.items():
    v = R[i]["music21"]
    if e["kind"] == "undetermined" or not isint(v) or v == e["reading"]:
        continue
    d = "over" if v > e["reading"] else "under"
    c[(d, "jump words" if e["jump"] else "no jump words")] += 1
    over.append((i, e["reading"], v, round(v / e["reading"], 2), d))
print(dict(c))
mx = max((o for o in over if o[4] == "over"), key=lambda o: o[3])
print("largest over-expansion ratio:", mx)
out["m21_wrong"] = {f"{a}|{b}": n for (a, b), n in c.items()}
rag = [(i, F[i]["reading"], R[i]["music21"]) for i in F if i.startswith("song.ragtime.") and isint(R[i]["music21"])]
ragwrong = [x for x in rag if x[1] != x[2]]
print("ragtime (song.ragtime.*) files with a music21 count in the 88:", len(rag), "of which music21 differs from the reading:", len(ragwrong))
print("   direction of those:", {"over": sum(1 for x in ragwrong if x[2] > x[1]), "under": sum(1 for x in ragwrong if x[2] < x[1])},
      "ratios over:", sorted(round(x[2] / x[1], 2) for x in ragwrong if x[2] > x[1]))
allrag = [i for i in R if i.startswith("song.ragtime.")]
print("all song.ragtime.* files with repeat structure:", len(allrag), "music21 count:", sum(1 for i in allrag if isint(R[i]["music21"])),
      "music21 equal to unroller:", sum(1 for i in allrag if isint(R[i]["music21"]) and R[i]["music21"] == R[i]["unroller"]))
out["ragtime"] = {"all": len(allrag), "m21_count": sum(1 for i in allrag if isint(R[i]["music21"])), "m21_equal_unroller": sum(1 for i in allrag if isint(R[i]["music21"]) and R[i]["music21"] == R[i]["unroller"]),
                  "in_88_m21_wrong": len(ragwrong)}

# 4. the fix (two coda signs, no 'To Coda' words)
print("\n== the fix named by the validation row (unroll(w, coda_pair=True)): files whose count it changes")
fx = []
for i, r in R.items():
    if r["unroller"] != r["unroller_cp"]:
        e = F.get(i)
        reading = e["reading"] if e and e["kind"] != "undetermined" else None
        fx.append({"id": i, "before": r["unroller"], "after": r["unroller_cp"], "music21": r["music21"], "reading": reading, "kind": e["kind"] if e else None,
                   "carioca_floor": None})
        print(i.replace("song.", ""), "before", r["unroller"], "after", r["unroller_cp"], "music21", r["music21"], "reading", reading, e["kind"] if e else "")
out["fix"] = fx
# after the fix, wrong against the reading
wrong_before = [i for i, e in F.items() if e["kind"] != "undetermined" and R[i]["unroller"] != e["reading"]]
wrong_after = [i for i, e in F.items() if e["kind"] != "undetermined" and R[i]["unroller_cp"] != e["reading"]]
print("unroller wrong against the reading before the fix:", len(wrong_before), [i.replace("song.", "") for i in wrong_before])
print("after the fix:", len(wrong_after), [i.replace("song.", "") for i in wrong_after])
out["fix_wrong_before"] = wrong_before; out["fix_wrong_after"] = wrong_after

# 5. the page's two-witness rule: unroller (+fix) and music21 agree -> two-witnesses; else UNKNOWN / one-witness
print("\n== the page's rule with music21 as the witness (agree: accepted; disagree or music21 cannot expand: flagged)")
for key in ("unroller", "unroller_cp"):
    acc = [i for i, r in R.items() if isint(r["music21"]) and r["music21"] == r[key]]
    flg = [i for i in R if i not in acc]
    acc_read = [i for i in acc if i in F and F[i]["kind"] != "undetermined"]
    acc_wrong = [i for i in acc_read if R[i][key] != F[i]["reading"]]
    acc_undet = [i for i in acc if i in F and F[i]["kind"] == "undetermined"]
    flg_read = [i for i in flg if i in F and F[i]["kind"] != "undetermined"]
    flg_right = [i for i in flg_read if R[i][key] == F[i]["reading"]]
    flg_notread = [i for i in flg if i not in F]
    print(key, "accepted", len(acc), "(read:", len(acc_read), "wrong by reading:", len(acc_wrong), [i.replace("song.", "") for i in acc_wrong], "undetermined:", len(acc_undet), ")",
          "| flagged", len(flg), "(read, determinable:", len(flg_read), "of which the unroller's count is right:", len(flg_right), "; not read:", len(flg_notread), ")")
    out[f"rule_music21_{key}"] = {"accepted": len(acc), "accepted_read": len(acc_read), "accepted_wrong": acc_wrong, "accepted_undetermined": acc_undet,
                                  "flagged": len(flg), "flagged_read": len(flg_read), "flagged_unroller_right": len(flg_right), "flagged_not_read": len(flg_notread)}
amb = [i for i, e in F.items() if e["kind"] in ("convention", "undetermined")]
amb_acc = [i for i in amb if isint(R[i]["music21"]) and R[i]["music21"] == R[i]["unroller_cp"]]
print("files whose right count depends on a convention or is undetermined (kind convention/undetermined):", len(amb),
      "| of these the music21 witness agrees with the fixed unroller (so the rule would accept them):", len(amb_acc), [i.replace("song.", "") for i in amb_acc])
out["ambiguous"] = {"n": len(amb), "accepted_by_rule": amb_acc}
# the same with partitura as witness (no jump words only)
acc = [i for i, r in R.items() if isint(r["pt_max_noleap"]) and r["pt_max_noleap"] == r["unroller_cp"]]
acc_wrong = [i for i in acc if i in F and F[i]["kind"] != "undetermined" and R[i]["unroller_cp"] != F[i]["reading"]]
print("partitura unfold_part_maximal(ignore_leaps=False) as witness: agree", len(acc), "of 329; agree and wrong by reading:", acc_wrong)
out["rule_pt"] = {"agree": len(acc), "agree_wrong": acc_wrong}
# agreement of the three, and the 12-file spot check
print("\n== spot check of 12 agreed files: reading equals the agreed count in", sum(1 for e in SPOT.values() if e["reading"] == e["unroller"]), "of", len(SPOT))
out["spot_ok"] = sum(1 for e in SPOT.values() if e["reading"] == e["unroller"])

# 5b. verdicts split by jump words, and readers equal to a listed alternative reading
print("\n== verdicts by whether the file has jump words (determinable files of the 88; the 88 are selected for disagreement, so these are not catalogue rates)")
split = {}
for rd in ("unroller_cp", "music21", "pt_max_noleap"):
    c = collections.Counter()
    for i, e in F.items():
        if e["kind"] == "undetermined":
            continue
        v = R[i][rd]
        c[("jump words" if e["jump"] else "no jump words", "no count" if not isint(v) else ("right" if v == e["reading"] else "wrong"))] += 1
    split[rd] = {f"{a}|{b}": n for (a, b), n in c.items()}
    print(rd, dict(c))
out["verdict_split"] = split
alt_eq = {rd: [i for i, e in F.items() if e["alts"] and R[i][rd] in e["alts"].values()] for rd in ("unroller_cp", "music21", "pt_max_noleap")}
nalt = sum(1 for e in F.values() if e["alts"])
print("files with a listed alternative reading:", nalt, "| reader equals one of the alternatives:", {k: len(v) for k, v in alt_eq.items()})
out["alt_equal"] = {k: v for k, v in alt_eq.items()}
# catalogue-level: music21 against the fixed unroller on every file where it gave a count
m21n = [i for i, r in R.items() if isint(r["music21"])]
print("music21 gave a count on", len(m21n), "files; equal to the fixed unroller on", sum(1 for i in m21n if R[i]["music21"] == R[i]["unroller_cp"]), "; read as wrong on", sum(1 for i in m21n if i in F and F[i]["kind"] != "undetermined" and R[i]["music21"] != F[i]["reading"]))
# 6. groups
print("\n== partitura: errors / not-run")
print([i for i, r in R.items() if isinstance(r["pt_max_noleap"], str)])
print("music21 error:", [i for i, r in R.items() if isinstance(r["music21"], str)], "cannot expand (None):", sum(1 for r in R.values() if r["music21"] is None))
# music21 None by pipeline and jump words
c = collections.Counter((S[i]["pipeline"], bool(S[i]["jump_words"])) for i, r in R.items() if r["music21"] is None)
print("music21 cannot expand, by (pipeline, has jump words):", dict(c))
# what the music21-None files look like (reading)
print("\n== timing (seconds, per file, mean over the 329 files; 8 worker processes at once on this machine)")
for k in ("t_unroller", "t_music21", "t_partitura"):
    v = [r[k] for r in R.values()]
    print(k, round(sum(v) / len(v), 3), "max", max(v))
    out.setdefault("timing", {})[k] = [round(sum(v) / len(v), 3), max(v)]
json.dump(out, open(HERE / "rep_summary.json", "w", encoding="utf8"), indent=1, ensure_ascii=False)
