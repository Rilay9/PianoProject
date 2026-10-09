"""Metrics on When in Rome from wir_results.json (and augnet_wir.json when it exists). Writes wir_metrics.json and the
markdown fragments frag_wir_tonic.md, frag_wir_local.md, frag_wir_time.md that build_key.py puts into key.md.

tonic-mode : exact tonic + mode against the analysis's first key; errors split relative / parallel / fifth (dominant or
             subdominant, same mode) / other; abstain = the method gave no key.
key.change : per bar, the method's key against the analysis's key in force at the bar's start (exact tonic + mode);
             "agreement" counts a bar the method did not answer as wrong, "coverage" is the share of bars answered.
             Modulation = a bar whose key differs from the previous bar's (in the truth: the bars of the analysis, in order;
             in a method's series: the same bars, an unanswered bar carries the previous answer). Precision / recall by a
             one-to-one greedy match of modulation bars within +-1 bar.
"""
from cmp_common import *
import collections, statistics

GLOBAL = [("cur_first", "current: first version (H.analyse key)"), ("cur_corr", "current: corrected ending vote (keyfix.infer_key2)"),
          ("cur_ks", "partitura estimate_key (the current detector's K-S witness)"), ("m21_KS", "music21 Krumhansl-Schmuckler"),
          ("m21_AE", "music21 Aarden-Essen"), ("m21_BB", "music21 Bellman-Budge"), ("m21_TKP", "music21 Temperley-Kostka-Payne"),
          ("augnet_first", "AugmentedNet: first local key"), ("augnet_mode", "AugmentedNet: most frequent local key")]
LOCAL = [("cur_win", "current: raw 4-bar partitura windows"), ("cur_areas_all", "current: key areas (4+ bars, no cadence needed)"),
         ("cur_areas_first", "current: areas confirmed by a cadence (first version)"), ("cur_areas_corr", "current: areas confirmed (corrected, home-dominant exclusion)"),
         ("m21_float", "music21 floatingKey (smoothed)"), ("m21_float_raw", "music21 floatingKey raw (one bar)"),
         ("m21_win_BB", "music21 4-bar windows, Bellman-Budge"), ("m21_win_AE", "music21 4-bar windows, Aarden-Essen"),
         ("augnet", "AugmentedNet local key"),
         ("union:augnet+cur_areas_all", "union of marks: AugmentedNet + current key areas (candidate list for an agent)"),
         ("union:augnet+m21_win_BB", "union of marks: AugmentedNet + music21 Bellman-Budge windows")]


def tup(k):
    return None if k is None else (int(k[0]), k[1])


def load_results():
    res = json.load(open(HERE / "wir_results.json"))
    aug = {}
    p = HERE / "augnet_wir_raw.json"
    if p.exists():
        aug = json.load(open(p))
    for r in res:
        a = aug.get(r["dir"])
        if a and "error" not in a:
            r["g"]["augnet_first"] = a["first"]
            r["g"]["augnet_mode"] = a["mode"]
            r["loc"]["augnet"] = [a["by_number"].get(str(n)) for n in r["nums"]]   # per music21 measure index
            r["sec"]["augnet"] = a["seconds"]
        elif a:
            r["err"]["augnet"] = a["error"]
    return res


def tonic_table(res, group_filter, methods, restrict=None):
    rows = []
    for m, label in methods:
        c = collections.Counter()
        n = 0
        for r in res:
            if not group_filter(r) or (restrict and r["dir"] not in restrict):
                continue
            if m not in r["g"] and not (m.startswith("cur") and "piece" in r["err"]):
                c["no result"] += 1 if (m.startswith("augnet")) else 0
                if m.startswith("augnet"):
                    n += 1
                continue
            if m.startswith("cur") and "piece" in r["err"]:
                c["no result"] += 1
                n += 1
                continue
            n += 1
            c[relation(tup(r["truth"]["global"]), tup(r["g"][m]))] += 1
        if n == 0 or (m.startswith("augnet") and c["no result"] == n):
            continue
        rows.append((m, label, n, c))
    return rows


def md_tonic(rows):
    out = ["| method | pieces | exact | relative | parallel | fifth | other | abstain | no result |", "| --- | --- | --- | --- | --- | --- | --- | --- | --- |"]
    for m, label, n, c in rows:
        ans = n - c["no result"]
        out.append(f"| {label} | {n} | {c['exact']} ({100 * c['exact'] / n:.1f}%) | {c['relative']} | {c['parallel']} | {c['fifth']} | {c['other']} | {c['abstain']} | {c['no result']} |")
    return "\n".join(out)


def series_for_truth(r, m):
    """The method's key at each truth bar, in the analysis's order; None where the method has none."""
    ser = r["loc"].get(m)
    if ser is None:
        return None
    nums = r["nums"]
    first = {}
    for i, n in enumerate(nums):
        first.setdefault(n, i)
    out = []
    for n, _ in r["truth"]["bars"]:
        i = first.get(n)
        out.append(tup(ser[i]) if i is not None and i < len(ser) else None)
    return out


def match(truth_mods, pred_mods, tol=1):
    used, hit = set(), 0
    for t in truth_mods:
        best = None
        for j, p in enumerate(pred_mods):
            if j in used or abs(p - t) > tol:
                continue
            if best is None or abs(p - t) < abs(pred_mods[best] - t):
                best = j
        if best is not None:
            used.add(best)
            hit += 1
    return hit


def mods(keys):
    out, prev = [], None
    for j, k in enumerate(keys):
        if k is None:
            continue
        if prev is not None and k != prev:
            out.append(j)
        prev = k
    return out


def durable(keys, L=4):
    """The truth with runs shorter than L bars (tonicisations) absorbed into the previous run (the first run, if short,
    into the next): what remains are key areas of at least L bars."""
    runs = []
    for k in keys:
        if runs and runs[-1][0] == k:
            runs[-1][1] += 1
        else:
            runs.append([k, 1])
    changed = True
    while changed and len(runs) > 1:
        changed = False
        for i, (k, n) in enumerate(runs):
            if n < L:
                j = i - 1 if i > 0 else 1
                runs[j][1] += n
                del runs[i]
                # merge equal neighbours
                merged = []
                for r in runs:
                    if merged and merged[-1][0] == r[0]:
                        merged[-1][1] += r[1]
                    else:
                        merged.append(list(r))
                runs = merged
                changed = True
                break
    out = []
    for k, n in runs:
        out += [k] * n
    return out


def local_metrics(res, group_filter, m, restrict=None, area_truth=False):
    tb = ta = tc = 0
    tm = pm = hit = 0
    npieces = nres = 0
    for r in res:
        if not group_filter(r) or (restrict and r["dir"] not in restrict):
            continue
        npieces += 1
        if m.startswith("union:"):
            members = [series_for_truth(r, x) for x in m[6:].split("+")]
            if any(x is None for x in members):
                continue
            pmods = sorted({j for x in members for j in mods(x)})
            merged = []
            for j in pmods:                      # one candidate per cluster of marks within 1 bar
                if not merged or j - merged[-1] > 1:
                    merged.append(j)
            pmods = merged
            keys = members[0]
        else:
            keys = series_for_truth(r, m)
            if keys is None:
                continue
            pmods = mods(keys)
        nres += 1
        truth = [tup(k) for _, k in r["truth"]["bars"]]
        tb += len(truth)
        ta += sum(1 for k in keys if k is not None)
        tc += sum(1 for k, t in zip(keys, truth) if k is not None and k == t)
        tmods = mods(durable(truth) if area_truth else truth)
        tm += len(tmods)
        pm += len(pmods)
        hit += match(tmods, pmods)
    if nres == 0:
        return None
    prec = hit / pm if pm else float("nan")
    rec = hit / tm if tm else float("nan")
    f1 = 2 * prec * rec / (prec + rec) if pm and tm and hit else 0.0
    return {"pieces": npieces, "with_result": nres, "bars": tb, "answered": ta, "agree": tc, "agreement": tc / tb, "coverage": ta / tb,
            "truth_mods": tm, "pred_mods": pm, "matched": hit, "precision": prec, "recall": rec, "f1": f1}


def md_local(table):
    out = ["| method | pieces with a result | bar agreement (unanswered = wrong) | coverage | truth modulations | predicted | matched +-1 bar | precision | recall | F1 |",
           "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |"]
    for label, d in table:
        if d is None:
            continue
        ag, cv = (("-", "-") if "union" in label else (f"{100 * d['agreement']:.1f}%", f"{100 * d['coverage']:.1f}%"))
        out.append(f"| {label} | {d['with_result']}/{d['pieces']} | {ag} | {cv} | {d['truth_mods']} | {d['pred_mods']} | {d['matched']} | {100 * d['precision']:.1f}% | {100 * d['recall']:.1f}% | {100 * d['f1']:.1f}% |")
    return "\n".join(out)


def stats(v):
    v = sorted(v)
    return f"{statistics.mean(v):.2f} / {statistics.median(v):.2f} / {v[-1]:.2f}"


if __name__ == "__main__":
    res = load_results()
    out = {}
    frag = []
    groups = [("keyboard (Bach WTC I, Chopin, Mozart sonatas)", lambda r: r["group"] == "keyboard"),
              ("textbook (Aldwell, Kostka, Rimsky-Korsakov, Tchaikovsky; 8+ bars)", lambda r: r["group"] == "textbook"),
              ("all selected", lambda r: True)]
    spl_p = HERE / "augnet_split.json"
    if spl_p.exists():
        SPL = json.load(open(spl_p, encoding="utf-8"))

        def lab(r):
            return {x for x in SPL.get(r["dir"], "").replace("unassigned", "").split("/") if x}
        groups.append(("AugmentedNet held-out: keyboard pieces in its test split or in none of its lists (17)", lambda r: r["group"] == "keyboard" and ("training" not in lab(r) and "validation" not in lab(r))))
        groups.append(("AugmentedNet seen: keyboard pieces in its training or validation split (63)", lambda r: r["group"] == "keyboard" and ("training" in lab(r) or "validation" in lab(r))))
    ran_cur = {r["dir"] for r in res if "piece" not in r["err"]}
    ran_all = {r["dir"] for r in res if "piece" not in r["err"] and ("augnet" in r["loc"] or "augnet_first" not in r["g"] or True)}
    # ---- tonic-mode
    out["tonic"] = {}
    for gname, gf in groups:
        rows = tonic_table(res, gf, GLOBAL)
        out["tonic"][gname] = [{"method": m, "pieces": n, **dict(c)} for m, _, n, c in rows]
        frag.append(f"**{gname}: {sum(1 for r in res if gf(r))} pieces.**\n\n" + md_tonic(rows) + "\n")
    rows = tonic_table(res, lambda r: True, GLOBAL, restrict=ran_cur)
    out["tonic"]["common (current detector ran)"] = [{"method": m, "pieces": n, **dict(c)} for m, _, n, c in rows]
    frag.append(f"**Common set: the {len(ran_cur)} pieces on which the current detector ran (all methods on the same pieces).**\n\n" + md_tonic(rows) + "\n")
    # witness: current corrected vs Bellman-Budge
    wit = collections.Counter()
    for r in res:
        if r["dir"] not in ran_cur:
            continue
        t = tup(r["truth"]["global"])
        a, b = tup(r["g"]["cur_corr"]), tup(r["g"]["m21_BB"])
        agree = a is not None and a == b
        wit[("agree" if agree else "disagree", "right" if a == t else "wrong")] += 1
    out["witness"] = {f"{k[0]}/{k[1]}": v for k, v in wit.items()}
    frag.append("**Second witness (the corrected current answer against music21 Bellman-Budge, on the common set).** "
                f"Agree and right {wit[('agree', 'right')]}, agree and wrong {wit[('agree', 'wrong')]}, disagree and right {wit[('disagree', 'right')]}, "
                f"disagree and wrong {wit[('disagree', 'wrong')]}. Disagreement flags {wit[('disagree', 'wrong')]} of the "
                f"{wit[('agree', 'wrong')] + wit[('disagree', 'wrong')]} wrong answers and sends {wit[('disagree', 'right')]} right ones to the agent.\n")
    open(HERE / "frag_wir_tonic.md", "w", encoding="utf-8").write("\n".join(frag))
    # ---- local keys
    frag = []
    out["local"] = {}
    for gname, gf in groups:
        tab = [(label, local_metrics(res, gf, m)) for m, label in LOCAL]
        out["local"][gname] = {label: d for label, d in tab if d}
        frag.append(f"**{gname}.**\n\n" + md_local(tab) + "\n")
    tab = [(label, local_metrics(res, lambda r: True, m, restrict=ran_cur)) for m, label in LOCAL]
    out["local"]["common"] = {label: d for label, d in tab if d}
    frag.append(f"**Common set: the {len(ran_cur)} pieces on which the current detector ran.**\n\n" + md_local(tab) + "\n")
    out["local_area_truth"] = {}
    for gname, gf in [groups[0], groups[2]] + groups[3:4]:
        tab = [(label, local_metrics(res, gf, m, area_truth=True)) for m, label in LOCAL]
        out["local_area_truth"][gname] = {label: d for label, d in tab if d}
        frag.append(f"**Modulation detection against key areas of 4+ bars only (truth runs under 4 bars absorbed; `durable()` in wir_metrics.py), {gname}.** Bar agreement is the same as above.\n\n" + md_local(tab) + "\n")
    open(HERE / "frag_wir_local.md", "w", encoding="utf-8").write("\n".join(frag))
    # ---- runtime
    keys = collections.defaultdict(list)
    for r in res:
        for k, v in r["sec"].items():
            keys[k].append(v)
    names = {"m21_parse": "music21 parse of the MusicXML", "g_m21_KS": "music21 K-S, whole piece", "g_m21_AE": "music21 Aarden-Essen, whole piece",
             "g_m21_BB": "music21 Bellman-Budge, whole piece", "g_m21_TKP": "music21 Temperley-Kostka-Payne, whole piece",
             "cur_load": "project score reader (partitura)", "g_cur": "current detector: harmony analysis + first/corrected key + partitura K-S",
             "l_cur_win": "current: raw 4-bar windows (partitura)", "l_cur_areas": "current: areas, cadences, exclusion (after the windows)",
             "l_m21_float": "music21 floatingKey (smoothed + raw)", "l_m21_win_BB": "music21 4-bar windows, Bellman-Budge", "l_m21_win_AE": "music21 4-bar windows, Aarden-Essen",
             "augnet": "AugmentedNet inference (excluding model load)"}
    nb = [len(r["truth"]["bars"]) for r in res]
    lines = [f"Seconds per piece (mean / median / max) over the pieces each step ran on; pieces have {min(nb)} to {max(nb)} analysed bars (median {int(statistics.median(nb))}). "
             "Measured on this machine, 12 worker processes at once on 20 logical CPUs; the relation between methods is the point, not the figures.\n",
             "| step | pieces | seconds per piece: mean / median / max |", "| --- | --- | --- |"]
    for k, label in names.items():
        if k in keys:
            lines.append(f"| {label} | {len(keys[k])} | {stats(keys[k])} |")
    open(HERE / "frag_wir_time.md", "w", encoding="utf-8").write("\n".join(lines) + "\n")
    out["errors"] = {"current detector no result": len(res) - len(ran_cur), "pieces": len(res)}
    json.dump(out, open(HERE / "wir_metrics.json", "w"), indent=1, default=lambda x: None if x != x else x)
    print(open(HERE / "frag_wir_tonic.md", encoding="utf-8").read())
    print(open(HERE / "frag_wir_local.md", encoding="utf-8").read())
    print(open(HERE / "frag_wir_time.md", encoding="utf-8").read())
