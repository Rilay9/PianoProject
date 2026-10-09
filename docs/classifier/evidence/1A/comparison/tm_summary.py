"""Figures for the notation.times part of repeat-times.md, from tm_results.json, tm_current.json and expected_times_named.json. Writes tm_summary.json."""
import json, collections
from pathlib import Path
HERE = Path(__file__).resolve().parent
R = json.load(open(HERE / "tm_results.json", encoding="utf8"))
C = json.load(open(HERE / "tm_current.json", encoding="utf8"))
EXP = json.load(open(HERE / "expected_times_named.json", encoding="utf8"))
out = {}


def kind_of(label):
    if label is None:
        return "change"
    if label.startswith("cadenza (words)") or label.startswith("cadenza bar (words)"):
        return "cadenza-words"
    if label.startswith("cadenza bar (one longer bar)"):
        return "cadenza-longer"
    if label.startswith("device?"):
        return "device?"
    if label.startswith("device"):
        return "device"
    return "change"


# 1. totals over the 49 items
tot = collections.Counter()
for iid, r in R.items():
    n = len(r["raw_changes"])
    tot["items"] += 1
    tot["raw signature changes (times.classify)"] += n
    tot["music21 plain read changes"] += len(r["m21_changes"])
    tot["partitura plain read changes"] += len(r["pt_changes"])
    for tag, key in (("current", "current"), ("fix", "fix")):
        for i, lab in r[key].items():
            tot[f"{tag}:{kind_of(lab)}"] += 1
    tot["items where music21 changes == raw"] += int(r["m21_changes"] == r["raw_changes"])
    tot["items where partitura changes == raw"] += int(r["pt_changes"] == r["raw_changes"])
    tot["items where music21 signature per bar == raw"] += int(bool(r.get("m21_sigs_equal_raw")))
    tot["items where partitura signature per bar == raw"] += int(bool(r.get("pt_sigs_equal_raw")))
    tot["items with equal bar count (music21)"] += int(r.get("m21_bars") == r["bars"])
    tot["items with equal bar count (partitura)"] += int(r.get("pt_bars") == r["bars"])
print("== totals over the 49 items with a signature change")
for k, v in tot.items():
    print(f"  {k}: {v}")
out["totals"] = dict(tot)
cur_changes = sum(v for k, v in tot.items() if k.startswith("current:") and not k.endswith(("device", "cadenza-words", "cadenza-longer", "device?")))
cur_counted = tot["current:change"]
print("  => current detector counts as changes of metre:", cur_counted, "| plain read:", tot["raw signature changes (times.classify)"],
      "| difference:", tot["raw signature changes (times.classify)"] - cur_counted)
print("  => current+fix counts as changes of metre:", tot["fix:change"])
# items where plain read count differs from current counted
diff_items = [iid for iid, r in R.items() if len(r["raw_changes"]) != sum(1 for lab in r["current"].values() if kind_of(lab) == "change")]
print("  items where the plain read and the current detector give a different number of changes of metre:", len(diff_items), "of", len(R))
out["items_differing"] = len(diff_items)
fix_diff = [iid for iid, r in R.items() if sum(1 for lab in r["fix"].values() if kind_of(lab) == "change") != sum(1 for lab in r["current"].values() if kind_of(lab) == "change")]
print("  items whose count the fix changes:", len(fix_diff))
out["items_fix_changes"] = len(fix_diff)

# 2. the named items
print("\n== named items: changes of metre counted, expected, and the class of the named bars")
named = {}
for iid, e in EXP.items():
    if iid.startswith("_"):
        continue
    r = R[iid]
    row = {"expected_class": e["expected_class"], "expected_changes_of_metre": e["expected_changes_of_metre"], "n_sig_changes": len(r["raw_changes"])}
    for meth, key in (("current", "current"), ("fix", "fix")):
        counted = sum(1 for lab in r[key].values() if kind_of(lab) == "change")
        named_cls = {i: kind_of(r[key].get(str(i)) if str(i) in r[key] else None) if str(i) in r[key] else "(no signature change)" for i in e["named_bars_idx"]}
        # named-bar test: each named bar that is a signature change must carry the expected class (device? counts as device)
        want = e["expected_class"]
        ok_bars = True
        for i, c in named_cls.items():
            if c == "(no signature change)":
                continue
            c2 = "device" if c == "device?" else ("cadenza" if c.startswith("cadenza") else c)
            if c2 != want:
                ok_bars = False
        row[meth] = {"changes_of_metre": counted, "named_bars": named_cls, "named_bars_right": ok_bars, "item_right": counted == e["expected_changes_of_metre"]}
    for meth, key in (("music21", "m21_changes"), ("partitura", "pt_changes")):
        n = len(r[key])
        want = e["expected_class"]
        row[meth] = {"changes_of_metre": n, "reads_the_named_signature_changes": all(i in r[key] for i in e["named_bars_idx"] if i in r["raw_changes"]),
                     "named_bars_right": want == "change", "item_right": n == e["expected_changes_of_metre"]}
    named[iid] = row
    print(iid.replace("song.", ""), json.dumps({k: (v if not isinstance(v, dict) else {a: b for a, b in v.items() if a != "named_bars"}) for k, v in row.items()}, ensure_ascii=False))
out["named"] = named
print("\n-- named bars by class under current / fix")
for iid, row in named.items():
    print(iid.replace("song.", ""), "current:", row["current"]["named_bars"], "| fix:", row["fix"]["named_bars"])
meths = ["current", "fix", "music21", "partitura"]
print("\n== named items right (9 items), by criterion")
sumry = {}
for m in meths:
    nb = sum(1 for r in named.values() if r[m]["named_bars_right"])
    ir = sum(1 for r in named.values() if r[m]["item_right"])
    sumry[m] = {"named_bars_right": nb, "item_changes_of_metre_right": ir, "of": len(named)}
    print(f"  {m}: named bars classed as expected {nb} of {len(named)}; whole-item count of changes of metre as expected {ir} of {len(named)}")
out["named_summary"] = sumry

# 3. every firing of the longer-bar clause in the catalogue
print("\n== every bar the clause 'one-bar signature longer than the bars around it' labels a cadenza bar (current detector)")
fire = []
for iid, r in R.items():
    for i, lab in r["current"].items():
        if kind_of(lab) == "cadenza-longer":
            i = int(i)
            fire.append({"id": iid, "idx": i, "sig": r["sigs"][i], "prev": r["sigs"][i - 1], "next": r["sigs"][i + 1] if i + 1 < len(r["sigs"]) else None, "bars_in_file": r["bars"]})
for f in fire:
    print(" ", f["id"].replace("song.", ""), f["idx"], f["prev"], "->", f["sig"], "->", f["next"])
print("  total firings:", len(fire), "in", len({f['id'] for f in fire}), "files")
out["clause_firings"] = fire
json.dump(out, open(HERE / "tm_summary.json", "w", encoding="utf8"), indent=1, ensure_ascii=False)
