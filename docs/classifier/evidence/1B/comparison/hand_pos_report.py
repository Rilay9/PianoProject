"""Tables for technique.five-finger and technique.position-shift from hand_pos_truth.json and hand_pos_named.json.
Writes frag_pos.md and hand_pos_metrics.json. Run with the main .venv."""
import json, sys, collections, statistics, os
from pathlib import Path
from hand_xml import HERE
import hand_def as D
import hand_pos as HP

SUF = os.environ.get("HAND_SUFFIX", "")
T = json.load(open(HERE / f"hand_pos_truth{SUF}.json"))
man = json.load(open(HERE / "hand_manifest.json"))
meta = {x["id"]: x for x in man["truth"]}
METHODS = [("current", "current detector (frames.py, corrected rule)"), ("fixed", "current detector with fixes F1+F2+F3 (hand_fix.py)"), ("pp", "pianoplayer fingering, read through hand_def.py")]
CLS = ["five-finger", "extended", "beyond"]
METHODS_ALL = METHODS + [("f1", "current detector with F1 only"), ("f2", "current detector with F2 only")]


def stratum(k):
    m = meta[k]
    return "generated " + m["family"] if m["src"] == "generated" else m["src"]


def pct(a, b):
    return "-" if not b else f"{100 * a / b:.1f}%"


def row(*c):
    return "| " + " | ".join(str(x) for x in c) + " |"


M, out = {}, []
strata = sorted({stratum(k) for k in T}) + ["all"]
# ---------------------------------------------------------------- collect
acc = {}  # (method, stratum) -> dict
for k, r in T.items():
    s_ = stratum(k)
    for h, hr in r["hands"].items():
        tr = hr.get("truth")
        if not tr:
            continue
        for m, _ in METHODS_ALL:
            for st in (s_, "all"):
                a = acc.setdefault((m, st), {"hand_items": 0, "no_result": 0, "tseg": 0, "agree": 0, "conf": collections.Counter(), "tb": 0, "pb": 0, "mb": 0,
                                             "kinds": collections.Counter(), "mseg": 0, "pp_digits": 0, "pp_match": 0})
                mv = hr.get(m)
                if not mv:
                    a["no_result"] += 1
                    continue
                a["hand_items"] += 1
                frames_ = mv["frames"] if m != "pp" else [{"first": s["first"], "last": s["last"], "cls": s["cls"]} for s in mv["segs"]]
                rows = HP.class_agreement(tr["segs"], frames_)
                a["tseg"] += len(rows)
                a["agree"] += sum(1 for x, y in rows if x == y)
                for x, y in rows:
                    a["conf"][(x, y)] += 1
                a["mseg"] += len(frames_)
                c = HP.prf_counts(tr["bounds"], mv["bounds"])
                a["tb"] += c["truth"]; a["pb"] += c["pred"]; a["mb"] += c["matched"]
                for kk, n in c["kinds"].items():
                    a["kinds"][kk] += n
                if m == "pp":
                    a["pp_digits"] += mv.get("printed_digits", 0)
                    a["pp_match"] += mv.get("match_digits", 0)
# ---------------------------------------------------------------- tables
out.append("**Per-passage class agreement (truth segment vs the method's frame holding most of its events).** Counts are truth segments (one hand-passage of one item = several segments).")
out.append("")
out.append(row("method", "stratum", "hand-items run", "no result", "truth segments", "class agrees", "agreement"))
out.append(row(*["---"] * 7))
for m, name in METHODS:
    for st in strata:
        a = acc.get((m, st))
        if not a:
            continue
        out.append(row(name, st, a["hand_items"], a["no_result"], a["tseg"], a["agree"], pct(a["agree"], a["tseg"])))
        M[f"class|{m}|{st}"] = {"segments": a["tseg"], "agree": a["agree"]}
for st in strata:
    a = acc.get(("current", st))
    if a:
        n5 = sum(c for (x, y), c in a["conf"].items() if x == "five-finger")
        out.append(row("baseline: always says five-finger", st, "", "", a["tseg"], n5, pct(n5, a["tseg"])))
        M[f"class|always-five-finger|{st}"] = {"segments": a["tseg"], "agree": n5}
out.append("")
out.append("**Truth class by method class (all strata; rows = truth class, columns = the method's class).**")
out.append("")
for m, name in METHODS:
    a = acc[(m, "all")]
    out.append(f"{name}:")
    out.append("")
    out.append(row("truth \\ method", *CLS))
    out.append(row(*["---"] * 4))
    for x in CLS:
        out.append(row(x, *[a["conf"].get((x, y), 0) for y in CLS]))
    out.append("")
out.append("**Position shifts at note resolution (+-1 event).** Truth boundary = start of a new fingering-derived segment; predicted boundary = start of a new frame / fingering segment of the method. Precision = matched / predicted; recall = matched / truth.")
out.append("")
out.append(row("method", "stratum", "truth shifts", "predicted", "matched", "precision", "recall", "F1"))
out.append(row(*["---"] * 8))
for m, name in METHODS:
    for st in strata:
        a = acc.get((m, st))
        if not a:
            continue
        p = a["mb"] / a["pb"] if a["pb"] else 0
        r_ = a["mb"] / a["tb"] if a["tb"] else 0
        f1 = 2 * p * r_ / (p + r_) if p + r_ else 0
        out.append(row(name, st, a["tb"], a["pb"], a["mb"], pct(a["mb"], a["pb"]), pct(a["mb"], a["tb"]), f"{100 * f1:.1f}%"))
        M[f"shift|{m}|{st}"] = {"truth": a["tb"], "pred": a["pb"], "matched": a["mb"]}
out.append("")
uni = collections.Counter()
for k, r in T.items():
    for h, hr in r["hands"].items():
        if not (hr.get("truth") and hr.get("current") and hr.get("pp")):
            continue
        tb = [b for b, _ in hr["truth"]["bounds"]]
        marks = sorted({b for b, _ in hr["current"]["bounds"]} | {b for b, _ in hr["pp"]["bounds"]})
        for nm_, bs in (("cur", sorted({b for b, _ in hr["current"]["bounds"]})), ("pp", sorted({b for b, _ in hr["pp"]["bounds"]}))):
            uni[nm_ + "_pred"] += len(bs)
            uni[nm_ + "_true"] += sum(1 for b in bs if any(abs(b - t) <= 1 for t in tb))
            uni[nm_ + "_hit"] += sum(1 for t in tb if any(abs(b - t) <= 1 for b in bs))
        uni["truth"] += len(tb); uni["pred"] += len(marks)
        uni["marks_true"] += sum(1 for b in marks if any(abs(b - t) <= 1 for t in tb))
        uni["truth_hit"] += sum(1 for t in tb if any(abs(b - t) <= 1 for b in marks))
out.append(f"Union of marks (every distinct boundary of the current detector or pianoplayer; the pilot's candidate-list form; a mark is true if a truth shift lies within one event, a truth shift is found if a mark lies within one event): {uni['pred']} marks, {uni['marks_true']} true: precision {pct(uni['marks_true'], uni['pred'])}; truth shifts found {uni['truth_hit']} of {uni['truth']}: recall {pct(uni['truth_hit'], uni['truth'])}. Same any-within-one criterion for each alone: current detector precision {pct(uni['cur_true'], uni['cur_pred'])}, recall {pct(uni['cur_hit'], uni['truth'])}; pianoplayer precision {pct(uni['pp_true'], uni['pp_pred'])}, recall {pct(uni['pp_hit'], uni['truth'])}.")
M["shift|union|all"] = dict(uni)
out.append("")
out.append("**Kind at matched boundaries (truth kind from the printed fingering > the method's kind).**")
out.append("")
out.append(row("method", "crossing>crossing", "crossing>shift", "shift>crossing", "shift>shift"))
out.append(row(*["---"] * 5))
for m, name in METHODS_ALL:
    a = acc[(m, "all")]
    k = a["kinds"]
    out.append(row(name, k["crossing>crossing"], k["crossing>shift"], k["shift>crossing"], k["shift>shift"]))
    M[f"kind|{m}"] = dict(k)
out.append("")
out.append("Kind right at matched boundaries: " + "; ".join(
    f"{nm} {acc[(m, 'all')]['kinds']['crossing>crossing'] + acc[(m, 'all')]['kinds']['shift>shift']} of {sum(acc[(m, 'all')]['kinds'].values())} ({pct(acc[(m, 'all')]['kinds']['crossing>crossing'] + acc[(m, 'all')]['kinds']['shift>shift'], sum(acc[(m, 'all')]['kinds'].values()))})" for m, nm in METHODS_ALL) + ".")
out.append("")
# agreement between methods as confidence: a boundary both the current detector and pianoplayer predict (within +-1 event of each other)
ag = collections.Counter()
for k, r in T.items():
    for h, hr in r["hands"].items():
        if not (hr.get("truth") and hr.get("current") and hr.get("pp")):
            continue
        tb = [b for b, _ in hr["truth"]["bounds"]]
        cb = [b for b, _ in hr["current"]["bounds"]]
        pb = [b for b, _ in hr["pp"]["bounds"]]
        both = [c for c in cb if any(abs(c - p) <= 1 for p in pb)]
        only_c = [c for c in cb if c not in both]
        only_p = [p for p in pb if not any(abs(c - p) <= 1 for c in cb)]
        for name, bs in (("both", both), ("only current", only_c), ("only pianoplayer", only_p)):
            ag[(name, "n")] += len(bs)
            ag[(name, "true")] += sum(1 for b in bs if any(abs(b - t) <= 1 for t in tb))
out.append("**Agreement as confidence, not proof.** Predicted shifts by who predicts them (the current detector and pianoplayer within +-1 event of each other), and how many of each are truth shifts:")
out.append("")
out.append(row("predicted by", "boundaries", "of them truth shifts", "share"))
out.append(row(*["---"] * 4))
for name in ("both", "only current", "only pianoplayer"):
    out.append(row(name, ag[(name, "n")], ag[(name, "true")], pct(ag[(name, "true")], ag[(name, "n")])))
    M[f"agree|{name}"] = {"n": ag[(name, "n")], "true": ag[(name, "true")]}
out.append("")
a = acc[("pp", "all")]
out.append(f"**pianoplayer's fingering against the printed one** (note-by-note digit equality, notes with a printed digit): {a['pp_match']} of {a['pp_digits']} ({pct(a['pp_match'], a['pp_digits'])}). By stratum: " +
           "; ".join(f"{st} {pct(acc[('pp', st)]['pp_match'], acc[('pp', st)]['pp_digits'])}" for st in strata if ("pp", st) in acc and st != "all") + ".")
out.append("")
M["pp_digit_match"] = {"match": a["pp_match"], "printed": a["pp_digits"]}

# ---------------------------------------------------------------- runtime
tt = [(k, r["t_load_view"]) for k, r in T.items() if "t_load_view" in r]
ts_cur = [h_["current"]["t"] for r in T.values() for h_ in r["hands"].values() if "current" in h_]
times = {}
for f in ("pp_times_all.json", "pp_times_truth_rev.json", "pp_times_named.json", "pp_times_partial.json"):
    p = HERE / f
    if p.exists():
        times.update(json.load(open(p))["times"])
nev = {k: sum(h_["n_events"] for h_ in r["hands"].values()) for k, r in T.items()}
out.append("**Runtime per item** (measured on this machine, several processes at once, so an upper bound; items = hand-passages of the truth set).")
out.append("")
ppt = [times[k] for k in T if k in times]
out.append(f"- current detector: reader + texture view {statistics.mean([t for _, t in tt[1:]]):.2f} s mean, {statistics.median([t for _, t in tt[1:]]):.2f} s median, {max(t for _, t in tt[1:]):.2f} s max over {len(tt) - 1} items (the first item loaded paid a {tt[0][1]:.0f} s one-off import); frames + changes {statistics.mean(ts_cur) * 1000:.0f} ms mean per hand, {max(ts_cur) * 1000:.0f} ms max over {len(ts_cur)} hands.")
if ppt:
    out.append(f"- pianoplayer: {statistics.mean(ppt):.1f} s mean, {statistics.median(ppt):.1f} s median, {max(ppt):.1f} s max over {len(ppt)} truth items that this session timed (a Python process start is not included; several runs shared the CPU).")
M["runtime"] = {"cur_view_mean": statistics.mean([t for _, t in tt[1:]]), "pp_n": len(ppt), "pp_mean": statistics.mean(ppt) if ppt else None}
open(HERE / f"frag_pos{SUF}.md", "w", encoding="utf-8").write("\n".join(out) + "\n")
json.dump(M, open(HERE / f"hand_pos_metrics{SUF}.json", "w"), indent=1)
print("\n".join(out))
