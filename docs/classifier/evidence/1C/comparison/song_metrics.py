"""Correlation of each method's value with the listeners' mean rating on the 111 Song stimuli (and presence against a
fixed "listeners heard syncopation" label). Reads song_stimuli.json, song_synpy.json, song_cur.json, song_amads.json.
Run with the main .venv. Writes song_metrics.json and frag_song.md.

Rules fixed before any value was looked at:
  - value of a method on a stimulus: SynPy = mean of the model's values on the two pattern bars (None if the model
    declined either); current detector = song_cur.json value_all (events of the seven kinds, accent excluded, per
    bar over bars 1-3) and value_held; AMADS = the three values of song_amads.json.
  - correlation: Spearman rho (rank, ties averaged) and Pearson r over the stimuli the method gave a value on.
  - label "listeners heard syncopation": mean rating >= 1.0 (rating scale 0 to 4 as recorded in the workbook).
  - presence: LHL, TMC, SG, KTH, WNBD, AMADS values and the current detector: value > 0; PRS and TOB have no zero
    (their values on a bar of plain beats are 2): value > the value on the file's own metronome bar (bar 1).
  - AUC = probability that a stimulus labelled syncopated has a larger value than one not (ties 0.5).
"""
import json, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import syn_common as C

H = C.HERE
stim = json.loads((H / "song_stimuli.json").read_text(encoding="utf-8"))
syn = json.loads((H / "song_synpy.json").read_text(encoding="utf-8"))["stimuli"]
cur = json.loads((H / "song_cur.json").read_text(encoding="utf-8"))
am = json.loads((H / "song_amads.json").read_text(encoding="utf-8"))
bs = json.loads((H / "song_beatsearch.json").read_text(encoding="utf-8"))
SYN = ["LHL", "PRS", "TMC", "SG", "KTH", "TOB", "WNBD"]
LABEL_T = 1.0


def group(name):
    r = stim[name]
    if r["ts"] == "6/8":
        return "6/8 mono"
    n = len(r["bars"][2])
    return "4/4 poly" if n == 12 else "4/4 mono"


def synval(name, k):
    bars = syn[name][k]["bars"]
    a, b = bars[2], bars[3]
    return None if (a is None or b is None) else (a + b) / 2


def metval(name, method):
    if method.startswith("SynPy "):
        return synval(name, method[6:])
    if method == "current detector (all kinds)":
        return cur[name].get("value_all")
    if method == "current detector (held kinds)":
        return cur[name].get("value_held")
    if method == "AMADS WNBD (vector)":
        return am[name].get("wnbd_vector")
    if method == "AMADS WNBD (score file)":
        return am[name].get("wnbd_score")
    if method == "AMADS span":
        return am[name].get("span")
    if method == "Beatsearch L-H&L (hierarchical)":
        return (bs[name].get("hierarchical") or {}).get("sum")
    if method == "Beatsearch L-H&L (equal_upbeats)":
        return (bs[name].get("equal_upbeats") or {}).get("sum")


def ref0(name, method):
    if method in ("SynPy PRS", "SynPy TOB"):
        return syn[name][method[6:]]["bars"][0]
    return 0.0


def auc(pos, neg):
    if not pos or not neg:
        return None
    s = 0.0
    for p in pos:
        for q in neg:
            s += 1.0 if p > q else 0.5 if p == q else 0.0
    return s / (len(pos) * len(neg))


METHODS = (["current detector (all kinds)", "current detector (held kinds)"] + ["SynPy " + k for k in SYN]
           + ["AMADS WNBD (vector)", "AMADS WNBD (score file)", "AMADS span",
              "Beatsearch L-H&L (hierarchical)", "Beatsearch L-H&L (equal_upbeats)"])
GROUPS = ["all", "mono", "4/4 mono", "6/8 mono", "4/4 poly"]
res = {}
for m in METHODS:
    res[m] = {}
    for g in GROUPS:
        names = [n for n in stim if g == "all" or (g == "mono" and group(n) != "4/4 poly") or group(n) == g]
        xs, ys, lab, vals = [], [], [], []
        for n in names:
            v = metval(n, m)
            if v is None:
                continue
            xs.append(v); ys.append(stim[n]["mean_rating"]); lab.append(stim[n]["mean_rating"] >= LABEL_T)
            vals.append((v, v > ref0(n, m)))
        rec = {"n_stimuli": len(names), "n_measured": len(xs)}
        if len(xs) >= 3:
            rec["spearman"] = C.spearman(xs, ys)
            rec["pearson"] = C.pearson(xs, ys)
            pos = [x for x, l in zip(xs, lab) if l]; neg = [x for x, l in zip(xs, lab) if not l]
            rec["auc_label"] = auc(pos, neg)
            tp = sum(1 for (v, pr), l in zip(vals, lab) if pr and l)
            fp = sum(1 for (v, pr), l in zip(vals, lab) if pr and not l)
            fn = sum(1 for (v, pr), l in zip(vals, lab) if (not pr) and l)
            rec.update({"label_pos": len(pos), "label_neg": len(neg), "present_tp": tp, "present_fp": fp, "present_fn": fn,
                        "precision": tp / (tp + fp) if tp + fp else None, "recall": tp / (tp + fn) if tp + fn else None})
        res[m][g] = rec
# agreement of the two L-H&L implementations (SynPy LHL, Beatsearch hierarchical) on the stimuli both measured
pairs = [(synval(n, "LHL"), metval(n, "Beatsearch L-H&L (hierarchical)")) for n in stim]
pairs = [(a, b) for a, b in pairs if a is not None and b is not None]
res["_lhl_vs_beatsearch"] = {"n": len(pairs), "spearman": C.spearman([a for a, _ in pairs], [b for _, b in pairs]),
                             "n_zero_vs_nonzero_disagree": sum(1 for a, b in pairs if (a > 0) != (b > 0))}
(H / "song_metrics.json").write_text(json.dumps(res, indent=1), encoding="utf-8")


def fmt(x, d=2):
    return "-" if x is None else f"{x:.{d}f}"


lines = []
lines.append(f"Spearman rho of each method's value with the mean listener rating, per group (measured / stimuli in group). "
             f"All stimuli: label 'heard syncopation' (mean rating >= {LABEL_T}) on {sum(1 for n in stim if stim[n]['mean_rating'] >= LABEL_T)} of {len(stim)}.\n")
lines.append("| method | all 111 | monorhythms, 4/4 + 6/8 (63) | 4/4 mono (27) | 6/8 mono (36) | 4/4 polyrhythm (48) |")
lines.append("| --- | --- | --- | --- | --- | --- |")
for m in METHODS:
    cells = []
    for g in GROUPS:
        r = res[m][g]
        cells.append(f"{fmt(r.get('spearman'))} ({r['n_measured']}/{r['n_stimuli']})")
    lines.append(f"| {m} | " + " | ".join(cells) + " |")
lines.append("")
lines.append("Presence against the label on the 63 monorhythms (all stimuli the method measured there): precision, recall, AUC of the value against the label, Pearson r. The label is 'heard syncopation' on those stimuli: " + str(sum(1 for n in stim if group(n) != "4/4 poly" and stim[n]["mean_rating"] >= LABEL_T)) + " of 63.\n")
lines.append("| method | measured | precision | recall | AUC | Pearson r |")
lines.append("| --- | --- | --- | --- | --- | --- |")
for m in METHODS:
    r = res[m]["mono"]
    lines.append(f"| {m} | {r['n_measured']}/63 | {fmt(r.get('precision'))} | {fmt(r.get('recall'))} | {fmt(r.get('auc_label'))} | {fmt(r.get('pearson'))} |")
lines.append("")
lines.append("Same, all 111 stimuli (polyrhythms included where the method measured them).\n")
lines.append("| method | measured | precision | recall | AUC | Pearson r |")
lines.append("| --- | --- | --- | --- | --- | --- |")
for m in METHODS:
    r = res[m]["all"]
    lines.append(f"| {m} | {r['n_measured']}/111 | {fmt(r.get('precision'))} | {fmt(r.get('recall'))} | {fmt(r.get('auc_label'))} | {fmt(r.get('pearson'))} |")
(H / "frag_song.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
print("\n".join(lines))
