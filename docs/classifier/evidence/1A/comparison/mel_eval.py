"""texture.melody-location metrics: per-bar agreement on which staff (hand) carries the melody (UNKNOWN counted wrong) and note-level melody P/R/F1/accuracy,
on the POP909 test songs (pop_build.py) and the Mozart movements (moz_build.py). Reads pop_cur_results.json, pop_mb_results.json, moz_cur_results.json,
moz_mb_results.json (whatever MidiBERT has finished). Writes mel_metrics.json and frag_mel_*.md.

Truth per note: POP909 -- positive = MELODY track note (variant "M") or MELODY or BRIDGE track note (variant "M+B"); every note is evaluated.
Mozart -- positive = Simonetta's soprano=1; only notes with a transferred label, in aligned bars, are evaluated (moz_build.py).
Truth hand of a bar = the staff holding most of its positive notes (a tie goes to the right hand); bars with no positive note are not scored for agreement.
A method's hand for a bar: the current detector's own answer; for a note-labelling method, the staff holding most of the notes it labels melody in that bar.
UNKNOWN = no answer. Agreement = correct / bars with truth (UNKNOWN counted wrong).
"""
import sys, collections, statistics
from mel_common import *

OUTP = BUILD / "pop909/scores"
OUTM = BUILD / "mozart"


def load_pop():
    pieces = {}
    for p in sorted(OUTP.glob("*.truth.json")):
        t = jload(p)
        notes = t["notes"]
        for n in notes:
            n["bar"] = n["on"] // 16
        pieces[t["song"]] = {"notes": notes, "bars": t["bars"], "eval_bars": set(range(t["bars"])),
                             "pos": {"M": [n["label"] == "M" for n in notes], "M+B": [n["label"] in ("M", "B") for n in notes]},
                             "ev": [True] * len(notes)}
    return pieces


def load_moz():
    pieces = {}
    for p in sorted(OUTM.glob("*.truth.json")):
        t = jload(p)
        notes = t["notes"]
        ab = set(t["aligned_bars"])
        pieces[t["name"]] = {"notes": notes, "bars": t["bars"], "eval_bars": ab,
                             "pos": {"melody": [n["label"] == 1 for n in notes]},
                             "ev": [(n["label"] >= 0 and n["bar"] in ab) for n in notes], "ts": t["ts"]}
    return pieces


def truth_hands(pc, variant):
    cnt = collections.defaultdict(collections.Counter)
    for i, n in enumerate(pc["notes"]):
        if pc["ev"][i] and pc["pos"][variant][i] and n["bar"] in pc["eval_bars"]:
            cnt[n["bar"]]["R" if n["staff"] == 1 else "L"] += 1
    return {b: ("R" if c["R"] >= c["L"] else "L") for b, c in cnt.items()}


def method_hands(pc, res):
    if "bar_hand" in res:
        return {int(b): h for b, h in res["bar_hand"].items()}
    cnt = collections.defaultdict(collections.Counter)
    for i in res.get("idx", []):
        n = pc["notes"][i]
        cnt[n["bar"]]["R" if n["staff"] == 1 else "L"] += 1
    return {b: ("R" if c["R"] >= c["L"] else "L") for b, c in cnt.items()}


def evaluate(pieces, results, method, variant, names=None):
    """-> dict of totals over the pieces that have a result for `method`."""
    tb = ans = cor = 0
    tp = fp = fn = tn = 0
    stp = sfp = sfn = 0     # within bars the method answered
    secs, nn, used = [], 0, 0
    claims_nobar = 0        # bars with no truth melody where the method names a hand
    L_truth = L_found = L_false = 0   # bars whose melody is in the left hand: named left; right-hand bars named left
    for nm, pc in pieces.items():
        if names is not None and nm not in names:
            continue
        r = results.get(nm, {}).get(method)
        if r is None or "idx" not in r and "bar_hand" not in r:
            continue
        used += 1
        th = truth_hands(pc, variant)
        mh = method_hands(pc, r)
        for b, h in th.items():
            tb += 1
            a = mh.get(b)
            if h == "L":
                L_truth += 1
                L_found += (a == "L")
            elif a == "L":
                L_false += 1
            if a is not None:
                ans += 1
                cor += (a == h)
        for b in pc["eval_bars"]:
            if b not in th and mh.get(b) is not None:
                claims_nobar += 1
        pred = set(r.get("idx", []))
        answered_bars = {b for b, h in mh.items() if h is not None}
        for i, n in enumerate(pc["notes"]):
            if not pc["ev"][i]:
                continue
            p = i in pred
            t = pc["pos"][variant][i]
            if p and t: tp += 1
            elif p: fp += 1
            elif t: fn += 1
            else: tn += 1
            if n["bar"] in answered_bars:
                if p and t: stp += 1
                elif p: sfp += 1
                elif t: sfn += 1
        secs.append(r.get("seconds", 0))
        nn += len(pc["notes"])
    P, R, F = prf(tp, fp, fn)
    sP, sR, sF = prf(stp, sfp, sfn)
    tot = tp + fp + fn + tn
    return {"pieces": used, "truth_bars": tb, "answered": ans, "correct": cor,
            "agreement": cor / tb if tb else None, "acc_answered": cor / ans if ans else None, "coverage": ans / tb if tb else None,
            "bars_without_truth_named": claims_nobar, "L_truth_bars": L_truth, "L_found": L_found, "R_bars_named_L": L_false,
            "tp": tp, "fp": fp, "fn": fn, "tn": tn, "P": P, "R": R, "F1": F, "acc": (tp + tn) / tot if tot else None,
            "settled_P": sP, "settled_R": sR, "settled_F1": sF,
            "sec_mean": statistics.mean(secs) if secs else None, "sec_median": statistics.median(secs) if secs else None, "sec_max": max(secs) if secs else None,
            "sec_per_1000_notes": (sum(secs) / nn * 1000) if nn else None}


def agreement_rule(pieces, results, methods, variant, names=None):
    """Accept a bar's hand only where every method in `methods` answers and they all name the same hand; the rest go to the agent.
    -> accepted bars, accepted and right, bars with truth, and the share of truth bars that are left-hand and accepted."""
    acc = right = tb = L_tb = L_acc = L_right = 0
    for nm, pc in pieces.items():
        if names is not None and nm not in names:
            continue
        rs = [results.get(nm, {}).get(m) for m in methods]
        if any(r is None or ("idx" not in r and "bar_hand" not in r) for r in rs):
            continue
        th = truth_hands(pc, variant)
        mh = [method_hands(pc, r) for r in rs]
        for b, h in th.items():
            tb += 1
            L_tb += (h == "L")
            ans = [x.get(b) for x in mh]
            if all(a is not None for a in ans) and len(set(ans)) == 1:
                acc += 1
                right += (ans[0] == h)
                if ans[0] == "L":
                    L_acc += 1
                    L_right += (h == "L")
    return {"truth_bars": tb, "accepted": acc, "accepted_right": right, "accepted_wrong": acc - right, "sent_to_agent": tb - acc,
            "left_truth_bars": L_tb, "accepted_as_left": L_acc, "accepted_as_left_right": L_right}


METHODS = [("const_R", "always the right hand (no look at the notes)"), ("current", "current detector (r_melody rules 1-3)"), ("skyline_plain", "skyline, plain (top note per onset)"),
           ("skyline_repo", "skyline, MidiBERT repo (>=60, 8th grid)"), ("midibert", "MidiBERT-Piano, class 1 = melody"),
           ("midibert_12", "MidiBERT-Piano, class 1 or 2 = melody or bridge")]


def add_union(res):
    for nm, d in res.items():
        m = d.get("midibert")
        if m and "idx" in m:
            d["midibert_12"] = {"idx": sorted(set(m["idx"]) | set(m.get("idx_bridge", []))), "seconds": m["seconds"]}


def run():
    pop, moz = load_pop(), load_moz()
    pr = jload(HERE / "pop_cur_results.json")
    pm = jload(HERE / "pop_mb_results.json") if (HERE / "pop_mb_results.json").exists() else {}
    for s, d in pm.items():
        pr.setdefault(s, {}).update(d)
    mr = jload(HERE / "moz_cur_results.json")
    mm = jload(HERE / "moz_mb_results.json") if (HERE / "moz_mb_results.json").exists() else {}
    for s, d in mm.items():
        mr.setdefault(s, {}).update(d)
    add_union(pr); add_union(mr)
    for res, pcs in ((pr, pop), (mr, moz)):
        for nm, pc in pcs.items():
            res.setdefault(nm, {})["const_R"] = {"bar_hand": {b: "R" for b in range(pc["bars"])}, "seconds": 0.0}
    out = {"pop": {}, "moz": {}, "pop_mb_songs": sorted(pm), "moz_mb_movs": sorted(mm)}
    for variant in ("M", "M+B"):
        for m, _ in METHODS:
            out["pop"][f"{variant}|{m}|all"] = evaluate(pop, pr, m, variant)
            if pm:
                out["pop"][f"{variant}|{m}|mbset"] = evaluate(pop, pr, m, variant, set(pm))
    for m, _ in METHODS:
        out["moz"][f"melody|{m}|all"] = evaluate(moz, mr, m, "melody")
        if mm:
            out["moz"][f"melody|{m}|mbset"] = evaluate(moz, mr, m, "melody", set(mm))
        # simple-metre / 4-4 movements (MidiBERT assumes 4/4 bars)
        four = {n for n, p in moz.items() if tuple(p["ts"]) in ((4, 4), (2, 2), (2, 4))}
        out["moz"][f"melody|{m}|dupletime"] = evaluate(moz, mr, m, "melody", four)
    out["agree"] = {}
    for ds, pcs, res, var, mbn in (("pop", pop, pr, "M", set(pm)), ("moz", moz, mr, "melody", set(mm))):
        for combo in (("skyline_plain", "current"), ("skyline_plain", "midibert"), ("skyline_plain", "midibert_12"), ("skyline_plain", "midibert_12", "current")):
            for subset in ("all", "mbset"):
                if "midibert" in combo and not mbn:
                    continue
                out["agree"][f"{ds}|{'+'.join(combo)}|{subset}"] = agreement_rule(pcs, res, combo, var, mbn if subset == "mbset" else None)
    # truth description
    td = {}
    for nm, pcs in (("pop", pop), ("moz", moz)):
        for variant in pcs[next(iter(pcs))]["pos"]:
            c = collections.Counter()
            npos = nev = 0
            for pc in pcs.values():
                for b, h in truth_hands(pc, variant).items():
                    c[h] += 1
                npos += sum(1 for i, x in enumerate(pc["pos"][variant]) if x and pc["ev"][i])
                nev += sum(1 for x in pc["ev"] if x)
            td[f"{nm}|{variant}"] = {"truth_bars_R": c["R"], "truth_bars_L": c["L"], "positive_notes": npos, "evaluated_notes": nev, "pieces": len(pcs)}
    out["truth"] = td
    jdump(out, HERE / "mel_metrics.json")
    return out


if __name__ == "__main__":
    o = run()
    for k, v in o["truth"].items():
        print(k, v)
    for ds in ("pop", "moz"):
        for k, v in o[ds].items():
            print(ds, k, {a: (round(b, 3) if isinstance(b, float) else b) for a, b in v.items() if a in ("pieces", "truth_bars", "coverage", "agreement", "acc_answered", "P", "R", "F1", "acc", "settled_F1")})
