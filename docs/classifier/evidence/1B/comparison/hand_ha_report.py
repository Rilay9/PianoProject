"""Tables for prereq.hand-assignment from hand_ha_results.json. Writes frag_ha.md and hand_ha_metrics.json."""
import json, collections, statistics
from hand_xml import HERE

R = json.load(open(HERE / "hand_ha_results.json"))
L = json.load(open(HERE / "hand_ha_list.json"))
out, M = [], {}


def pct(a, b):
    return "-" if not b else f"{100 * a / b:.1f}%"


def row(*c):
    return "| " + " | ".join(str(x) for x in c) + " |"


# --- words
items_w = list(L["words"])
out.append("**Hand-word truth (12 files with a printed hand word; rule in section 1).**")
out.append("")
out.append(row("item", "words", "truth notes", "of them on the other hand's staff (truth hand differs from the staff rule)", "staff rule right", "piano_svsep right (of notes it predicted)", "svsep right on other-staff notes", "svsep right on same-staff notes", "truth notes in flagged bars"))
out.append(row(*["---"] * 9))
tot = collections.Counter()
for k in items_w:
    r = R[k]
    tr = r.get("truth_notes", [])
    oth = [t for t in tr if t["truth"] != t["staffrule"]]
    same = [t for t in tr if t["truth"] == t["staffrule"]]
    sv_ok = lambda ts: sum(1 for t in ts if t["svsep"] == t["truth"])
    sv_n = lambda ts: sum(1 for t in ts if t["svsep"] is not None)
    out.append(row(k, "", len(tr), len(oth), f"{len(same)} ({pct(len(same), len(tr))})", f"{sv_ok(tr)}/{sv_n(tr)} ({pct(sv_ok(tr), sv_n(tr))})",
                   f"{sv_ok(oth)}/{sv_n(oth)}", f"{sv_ok(same)}/{sv_n(same)}", sum(1 for t in tr if t["flagged"])))
    tot["n"] += len(tr); tot["oth"] += len(oth); tot["same"] += len(same)
    tot["sv_ok"] += sv_ok(tr); tot["sv_n"] += sv_n(tr); tot["svo_ok"] += sv_ok(oth); tot["svo_n"] += sv_n(oth)
    tot["svs_ok"] += sv_ok(same); tot["svs_n"] += sv_n(same); tot["flag"] += sum(1 for t in tr if t["flagged"])
    tot["oth_flag"] += sum(1 for t in oth if t["flagged"])
out.append(row("**all**", "", tot["n"], tot["oth"], f"{tot['same']} ({pct(tot['same'], tot['n'])})", f"{tot['sv_ok']}/{tot['sv_n']} ({pct(tot['sv_ok'], tot['sv_n'])})",
               f"{tot['svo_ok']}/{tot['svo_n']} ({pct(tot['svo_ok'], tot['svo_n'])})", f"{tot['svs_ok']}/{tot['svs_n']} ({pct(tot['svs_ok'], tot['svs_n'])})", tot["flag"]))
M["words"] = dict(tot)
out.append("")
ag = collections.Counter()
for k in items_w:
    for t in R[k].get("truth_notes", []):
        if t["svsep"] is None:
            continue
        same = t["svsep"] == t["staffrule"]
        ag[("agree" if same else "disagree", "right" if (t["staffrule"] if same else t["svsep"]) == t["truth"] else "wrong")] += 1
out.append(f"Agreement as confidence, not proof (word-truth notes both methods answered, {sum(ag.values())}): the staff rule and piano_svsep agree and are right on {ag[('agree', 'right')]}, agree and are both wrong on {ag[('agree', 'wrong')]}; they disagree on {ag[('disagree', 'right')] + ag[('disagree', 'wrong')]}, of which piano_svsep is right on {ag[('disagree', 'right')]}.")
out.append("")
M["words_agreement"] = {f"{a}|{b}": n for (a, b), n in ag.items()}
out.append(f"Other-staff truth notes inside a bar the hand-word flag raises: {tot['oth_flag']} of {tot['oth']}.")
out.append("")

# --- generated
g = [(k, r) for k, r in R.items() if r["group"] == "generated" and "svsep_error" not in r]
gn = sum(r["n_compared"] for _, r in g)
ga = sum(r["agree_svsep_staffrule"] for _, r in g)
gerr = [k for k, r in R.items() if r["group"] == "generated" and "svsep_error" in r]
out.append(f"**Generated two-staff items, hand = written staff by construction ({len(g)} items run, {len(gerr)} errors).** piano_svsep's predicted staff equals the written staff on {ga} of {gn} notes ({pct(ga, gn)}); items with at least one differing note: {sum(1 for _, r in g if r['disagree_total'])}; unmatched model rows {sum(r['unmatched_svsep_rows'] for _, r in g)}, notes it gave no prediction {sum(r['unpredicted_notes'] for _, r in g)}. The staff rule is right on every note by construction (100%). Flags raised by the current detector on these items: {sum(1 for _, r in g if r['flags'])} items.")
out.append("")
bad = sorted(((r["disagree_total"], k) for k, r in g if r["disagree_total"]), reverse=True)
out.append("Largest disagreements (notes, item): " + "; ".join(f"{n} {k}" for n, k in bad[:12]))
out.append("")
M["generated"] = {"items": len(g), "notes": gn, "agree": ga, "errors": gerr, "items_with_disagree": sum(1 for _, r in g if r["disagree_total"])}

# --- pdmx agreement
p = [(k, r) for k, r in R.items() if r["group"] == "pdmx" and "svsep_error" not in r]
pn = sum(r["n_compared"] for _, r in p)
pa = sum(r["agree_svsep_staffrule"] for _, r in p)
perr = [k for k, r in R.items() if r["group"] == "pdmx" and "svsep_error" in r]
dflag = sum(r["disagree_in_flagged_bars"] for _, r in p)
dtot = sum(r["disagree_total"] for _, r in p)
out.append(f"**Real two-staff items, every 20th by id ({len(p)} run, {len(perr)} errors): agreement only, no truth.** piano_svsep's staff equals the written staff on {pa} of {pn} notes ({pct(pa, pn)}); {dtot} differing notes, of which {dflag} are in bars the current flags raise.")
out.append("")
M["pdmx"] = {"items": len(p), "notes": pn, "agree": pa, "disagree": dtot, "disagree_flagged": dflag, "errors": perr}

# --- named
out.append("**Items the validation row names.**")
out.append("")
out.append(row("item", "notes", "svsep staff = written staff", "differing notes", "differing notes in flagged bars", "flags (bars, 0-based)", "differing bars (part:bar -> notes)"))
out.append(row(*["---"] * 7))
for k in L["named"] + L["words"]:
    r = R[k]
    if "svsep_error" in r:
        out.append(row(k, r["n_notes"], "ERROR", r["svsep_error"][:80], "", "", ""))
        continue
    fl = {a: (len(b) if len(b) > 6 else b) for a, b in r["flags"].items()}
    db = r["disagree_bars"]
    dbs = ", ".join(f"{a}->{c}" for a, c in list(db.items())[:10]) + (" ..." if len(db) > 10 else "")
    out.append(row(k, r["n_notes"], f"{r['agree_svsep_staffrule']}/{r['n_compared']} ({pct(r['agree_svsep_staffrule'], r['n_compared'])})", r["disagree_total"],
                   r["disagree_in_flagged_bars"], json.dumps(fl)[:120], dbs))
out.append("")
ts = [r["svsep_t"] for r in R.values() if r.get("svsep_t") is not None]
nn = [r["n_notes"] for r in R.values() if r.get("svsep_t") is not None]
out.append(f"**Runtime, piano_svsep (CPU, one process, model load {json.load(open(HERE / 'svsep_out.json')).get('_load_seconds')} s once):** per item mean {statistics.mean(ts):.2f} s, median {statistics.median(ts):.2f} s, max {max(ts):.2f} s over {len(ts)} items (median {statistics.median(nn):.0f} notes, max {max(nn)}).")
tf = [r['t_flags'] for r in R.values() if 't_flags' in r]
out.append(f"**Runtime, the four flags of the current rule (re-implementation, after the file is read):** mean {statistics.mean(tf)*1000:.1f} ms, max {max(tf)*1000:.0f} ms over {len(tf)} items (the file read and the staff rule are the project reader's: 0.55 s per piece mean in key.md section 5).")
M["flags_runtime_ms"] = statistics.mean(tf)*1000
M["svsep_runtime"] = {"n": len(ts), "mean": statistics.mean(ts), "median": statistics.median(ts), "max": max(ts)}
open(HERE / "frag_ha.md", "w", encoding="utf-8").write("\n".join(out) + "\n")
json.dump(M, open(HERE / "hand_ha_metrics.json", "w"), indent=1)
print("\n".join(out))
