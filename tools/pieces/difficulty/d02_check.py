"""D02: how well do simple score statistics agree with PUBLISHED difficulty levels?

Run from anywhere:  python tools/pieces/difficulty/d02_check.py
Reads (only): docs/pieces/characteristics-summary.csv, docs/pieces/chosen.csv.
Writes: docs/pieces/difficulty-check.csv, docs/pieces/difficulty-check.md.
Needs numpy and scipy only (scikit-learn is not installed; ridge is closed-form here).

METHOD
 1. Labels: the 135 chosen files, published level B,1..8 -> 0..8.  Files are
    grouped by work (BWV / Op.+No. / K / WoO number, else composer+title), so
    variants of one work, and all movements of one sonatina, sit in one group.
    A group is never split between training and test.
 2. Features (10, fixed before any result was looked at): attacks per second
    (tempo known), notes per quarter (tempo free), shortest value, largest
    chord, pitch range, ledger-line maximum, accidentals per 100 notes, has
    tuplets, key-signature size, pitch entropy.  Chosen because each is a
    direct, readable figure for reading load (accidentals, key, ledger lines,
    range), rhythm (shortest value, tuplets, density) or texture (chord size,
    entropy).  Bars/length were left out on purpose: several chosen files hold
    more than the chosen piece, so whole-file length is not the piece's length.
    Two-staff figures are combined by max (mean for accidentals, sum for notes
    per quarter).  Missing values (no tempo, unreadable cell) are replaced by
    the TRAINING-fold median.
 3. Spearman correlation of each feature with level (with n).
 4. Leave-one-group-out cross-validation: (a) median-level baseline, (b) the
    single feature with the best |Spearman| on the training fold, linear fit,
    (c) ridge regression on all standardised features, ridge strength picked by
    an inner leave-one-group-out on the training fold.  Predictions rounded and
    clipped to 0-8.  Descriptive numbers only; there is no pass mark.
 5. Alarms: held-out prediction differs from the published level by 2 or more.
    Drivers = features whose (coefficient x standardised value) pushes the
    prediction furthest in the direction of the disagreement.
 6. Ridge fitted on all 135 is applied to the other candidate files: a
    PROVISIONAL suggestion column only.
 Negative control: levels shuffled across files, whole procedure rerun.
 Sensitivity: the same CV with all pieces of one composer held out together.

WHAT IT DOES NOT CLAIM
 It does not assign or change levels.  Alarms are prompts for a reviewer, not
 verdicts.  Level labels come from different syllabuses; statistics are
 per staff, not per hand; whole-file figures are used even where only part of a
 file is the chosen piece (max-type figures such as range or chord size may
 overstate); editions and arrangements differ; nobody has listened to or played
 anything.  Group assignment is by title/number rules, not by comparing notes.
"""
import csv
import re
from collections import Counter, defaultdict
from pathlib import Path
import numpy as np
from scipy.stats import spearmanr

ROOT = Path(__file__).resolve().parents[3]
SUMMARY = ROOT / "docs/pieces/characteristics-summary.csv"
CHOSEN = ROOT / "docs/pieces/chosen.csv"
OUT_CSV = ROOT / "docs/pieces/difficulty-check.csv"
OUT_MD = ROOT / "docs/pieces/difficulty-check.md"
LEVEL_NUM = {"B": 0, **{str(i): i for i in range(1, 9)}}
NUM_LEVEL = {v: k for k, v in LEVEL_NUM.items()}
ALPHAS = [1, 10, 30, 100, 300]
N_SHUFFLES = 10
RNG = np.random.default_rng(20261010)

# ---------------------------------------------------------------- features
VAL_DEPTH = {"whole": 0, "half": 1, "quarter": 2, "eighth": 3, "16th": 4,
             "32nd": 5, "64th": 6, "128th": 7}
FEATURES = ["attacks_per_second", "notes_per_quarter", "shortest_depth",
            "largest_chord", "range_semitones", "ledger_max",
            "accidentals_per_100", "has_tuplets", "key_sig_size", "pitch_entropy"]
NAN = float("nan")


def nums(cell):
    out = []
    for p in (cell or "").split("|"):
        try:
            out.append(float(p))
        except ValueError:
            out.append(NAN)
    return out


def featurize(r):
    f = {}
    try:
        known = float(r["known_tempo_share"])
        aps = float(r["attacks_per_second"])
        ok = (r["tempo_source"] != "none" and "possible exporter default" not in r["tempo_source"]
              and known >= 0.5)
        f["attacks_per_second"] = aps if ok else NAN
    except ValueError:
        f["attacks_per_second"] = NAN
    npq = [x for x in nums(r["median_notes_per_quarter_s1|s2"]) if x == x]
    f["notes_per_quarter"] = sum(npq) if npq else NAN
    depths = [VAL_DEPTH.get(x) for x in r["shortest_value_s1|s2"].split("|")]
    depths = [d for d in depths if d is not None]
    f["shortest_depth"] = max(depths) if depths else NAN
    ch = [x for x in nums(r["largest_chord_s1|s2"]) if x == x]
    f["largest_chord"] = max(ch) if ch else NAN
    lo1, hi1 = nums(r["range_low|high_s1"])
    lo2, hi2 = nums(r["range_low|high_s2"])
    los = [x for x in (lo1, lo2) if x == x]
    his = [x for x in (hi1, hi2) if x == x]
    f["range_semitones"] = max(his) - min(los) if los and his else NAN
    led = [x for x in nums(r["ledger_max_above_s1|s2"]) + nums(r["ledger_max_below_s1|s2"]) if x == x]
    f["ledger_max"] = max(led) if led else NAN
    acc = [x for x in nums(r["accidentals_per_100_s1|s2"]) if x == x]
    f["accidentals_per_100"] = float(np.mean(acc)) if acc else NAN
    tup = [x for x in nums(r["tuplet_runs_s1|s2"]) if x == x]
    f["has_tuplets"] = float(any(x > 0 for x in tup)) if tup else NAN
    try:
        f["key_sig_size"] = abs(float(r["key_fifths_start"]))
    except ValueError:
        f["key_sig_size"] = NAN
    try:
        f["pitch_entropy"] = float(r["pitch_entropy"])
    except ValueError:
        f["pitch_entropy"] = NAN
    return [f[k] for k in FEATURES]


# ---------------------------------------------------------------- grouping
COMPOSERS = ["bach", "beethoven", "burgm", "clementi", "mozart", "handel", "haydn", "chopin",
             "schumann", "scarlatti", "brahms", "schubert", "kuhlau", "diabelli", "hook",
             "petzold", "scriabin", "heller", "grieg", "czerny", "farrenc", "kabalevsky",
             "satie", "tchaikovsky", "joplin", "rachmaninoff", "lully", "krieger", "duncombe",
             "attwood", "spindler", "lemoine", "gurlitt", "praetorius", "armstrong"]


def composer_key(comp):
    c = comp.lower()
    for k in COMPOSERS:
        if k in c:
            return k
    return re.sub(r"\W+", "", c)


def work_key(comp, title):
    ck, t = composer_key(comp), title
    m = re.search(r"BWV\s*(Anh\.?)?\s*(\d+)", t, re.I)
    if m:
        return "bwv-%s%s" % ("anh" if m.group(1) else "", m.group(2))
    m = re.search(r"\bOp\.?\s*(\d+)\W+No\.?\s*(\d+)", t, re.I)
    if m:
        return "%s-op%s-no%s" % (ck, m.group(1), m.group(2))
    m = re.search(r"\bNo\.?\s*(\d+)\b.*?\bOp\.?\s*(\d+)", t, re.I)
    if m:
        return "%s-op%s-no%s" % (ck, m.group(2), m.group(1))
    m = re.search(r"\bWoO\s*(\d+)", t, re.I)
    if m:
        return "%s-woo%s" % (ck, m.group(1))
    m = re.search(r"\bK\.?\s*(\d+[a-z]?)\b", t)
    if m and ck in ("mozart", "scarlatti"):
        return "%s-k%s" % (ck, m.group(1))
    return ck + "-" + re.sub(r"\W+", "", t.lower())


# ---------------------------------------------------------------- models
def impute(Xtr, Xte):
    med = np.nanmedian(Xtr, axis=0)
    med = np.where(np.isnan(med), 0.0, med)
    a, b = Xtr.copy(), Xte.copy()
    for j in range(a.shape[1]):
        a[np.isnan(a[:, j]), j] = med[j]
        b[np.isnan(b[:, j]), j] = med[j]
    return a, b


def standardise(a, b):
    mu, sd = a.mean(0), a.std(0)
    sd[sd == 0] = 1.0
    return (a - mu) / sd, (b - mu) / sd, mu, sd


def ridge_fit(Z, y, alpha):
    ym = y.mean()
    w = np.linalg.solve(Z.T @ Z + alpha * np.eye(Z.shape[1]), Z.T @ (y - ym))
    return w, ym


def to_level(v):
    return np.clip(np.rint(v), 0, 8)


def pick_alpha(X, y, g):
    """Inner leave-one-group-out on the training data; squared error, unrounded."""
    errs = {a: 0.0 for a in ALPHAS}
    for grp in np.unique(g):
        te = g == grp
        A, B = impute(X[~te], X[te])
        A, B, _, _ = standardise(A, B)
        for a in ALPHAS:
            w, ym = ridge_fit(A, y[~te], a)
            errs[a] += float(((B @ w + ym - y[te]) ** 2).sum())
    return min(ALPHAS, key=lambda a: errs[a])


def run_cv(X, y, g, want_detail=False):
    n = len(y)
    pb = np.zeros(n)
    ps = np.zeros(n)
    pr = np.zeros(n)
    detail = [None] * n
    best_feat = [None] * n
    alphas = []
    for grp in np.unique(g):
        te = np.where(g == grp)[0]
        tr = np.where(g != grp)[0]
        pb[te] = to_level(np.median(y[tr]))
        A, B = impute(X[tr], X[te])
        rhos = []
        for j in range(X.shape[1]):
            if np.std(A[:, j]) == 0:
                rhos.append(0.0)
            else:
                rhos.append(abs(spearmanr(A[:, j], y[tr]).statistic))
        j = int(np.argmax(rhos))
        sl, ic = np.polyfit(A[:, j], y[tr], 1)
        ps[te] = to_level(sl * B[:, j] + ic)
        for i in te:
            best_feat[i] = FEATURES[j]
        alpha = pick_alpha(X[tr], y[tr], g[tr])
        alphas.append(alpha)
        Zt, Zs, _, _ = standardise(A, B)
        w, ym = ridge_fit(Zt, y[tr], alpha)
        pr[te] = to_level(Zs @ w + ym)
        if want_detail:
            for k, i in enumerate(te):
                detail[i] = (Zs[k] * w, Zs[k])
    return pb, ps, pr, detail, best_feat, alphas


def scores(y, p):
    e = np.abs(p - y)
    return dict(n=len(y), mae=float(e.mean()), exact=float((e == 0).mean()), within1=float((e <= 1).mean()))


def group_bootstrap(y, preds, g, B=2000):
    """95% interval of MAE (and difference ridge-median) resampling whole groups."""
    ug = np.unique(g)
    idx = {u: np.where(g == u)[0] for u in ug}
    res = {k: [] for k in preds}
    diff = []
    for _ in range(B):
        pick = RNG.choice(ug, size=len(ug), replace=True)
        ii = np.concatenate([idx[u] for u in pick])
        m = {k: np.abs(p[ii] - y[ii]).mean() for k, p in preds.items()}
        for k in m:
            res[k].append(m[k])
        diff.append(m["ridge"] - m["median"])
    ci = lambda v: tuple(float(x) for x in np.percentile(v, [2.5, 97.5]))
    return {k: ci(v) for k, v in res.items()}, ci(diff)


def fit_full(X, y, g):
    alpha = pick_alpha(X, y, g)
    A, _ = impute(X, X)
    med = np.nanmedian(X, axis=0)
    med = np.where(np.isnan(med), 0.0, med)
    mu, sd = A.mean(0), A.std(0)
    sd[sd == 0] = 1.0
    w, ym = ridge_fit((A - mu) / sd, y, alpha)
    return dict(alpha=alpha, med=med, mu=mu, sd=sd, w=w, ym=ym)


def predict_full(m, X):
    Xf = np.where(np.isnan(X), m["med"], X)
    return to_level(((Xf - m["mu"]) / m["sd"]) @ m["w"] + m["ym"])


# ---------------------------------------------------------------- main
def main():
    S = list(csv.DictReader(open(SUMMARY, encoding="utf-8")))
    C = list(csv.DictReader(open(CHOSEN, encoding="utf-8")))
    summ = {r["file"]: r for r in S}
    ch_level = {c["candidate_file"]: LEVEL_NUM[c["level"]] for c in C}
    assert len(ch_level) == 135 and all(f in summ for f in ch_level)
    assert all(summ[f]["in_chosen"] == "True" for f in ch_level)
    files = [c["candidate_file"] for c in C]
    X = np.array([featurize(summ[f]) for f in files], float)
    y = np.array([ch_level[f] for f in files], float)
    gkeys = [work_key(c["composer"], c["title"]) for c in C]
    gid = {k: i for i, k in enumerate(dict.fromkeys(gkeys))}
    g = np.array([gid[k] for k in gkeys])
    ckeys = [composer_key(c["composer"]) for c in C]
    cid = {k: i for i, k in enumerate(dict.fromkeys(ckeys))}
    gc = np.array([cid[k] for k in ckeys])

    print("groups with >1 file:")
    multi = defaultdict(list)
    for i, k in enumerate(gkeys):
        multi[k].append(i)
    for k, ii in multi.items():
        if len(ii) > 1:
            print("  ", k, [(C[i]["title"][:40], C[i]["level"]) for i in ii])
    # safeguard: same bars + length + near-equal entropy must share a group
    for i in range(len(files)):
        for j in range(i + 1, len(files)):
            a, b = summ[files[i]], summ[files[j]]
            if (a["printed_bars"], a["quarters"]) == (b["printed_bars"], b["quarters"]) and \
               abs(float(a["pitch_entropy"]) - float(b["pitch_entropy"])) < 0.02 and g[i] != g[j] \
               and composer_key(C[i]["composer"]) == composer_key(C[j]["composer"]):
                print("  NEAR-DUPLICATE NOT GROUPED:", C[i]["title"], "|", C[j]["title"])
    print("n files %d, work groups %d, composer groups %d" % (len(y), len(gid), len(cid)))
    miss = {FEATURES[j]: int(np.isnan(X[:, j]).sum()) for j in range(len(FEATURES))}
    print("missing (chosen):", {k: v for k, v in miss.items() if v})

    # 3. Spearman per feature
    corr = []
    for j, name in enumerate(FEATURES):
        ok = ~np.isnan(X[:, j])
        r = spearmanr(X[ok, j], y[ok])
        corr.append((name, float(r.statistic), int(ok.sum())))
        print("  %-20s rho=%+.2f n=%d" % corr[-1])

    # 4. grouped CV
    pb, ps, pr, detail, best_feat, alphas = run_cv(X, y, g, want_detail=True)
    sc = {"median": scores(y, pb), "single": scores(y, ps), "ridge": scores(y, pr)}
    for k, v in sc.items():
        print(k, v)
    ci, dci = group_bootstrap(y, {"median": pb, "single": ps, "ridge": pr}, g)
    print("MAE 95% group-bootstrap:", ci, "ridge-median diff:", dci)
    print("single-feature choice counts:", Counter(best_feat).most_common())
    print("alpha choices:", Counter(alphas))
    cb, cs, cr, _, _, _ = run_cv(X, y, gc)
    sc_c = {"median": scores(y, cb), "single": scores(y, cs), "ridge": scores(y, cr)}
    print("composer-grouped:", sc_c)
    per_level = []
    for lv in range(9):
        m = y == lv
        per_level.append((NUM_LEVEL[lv], int(m.sum()), float(np.mean(pr[m] - y[m])),
                          float(np.mean(np.abs(pr[m] - y[m])))))
        print("  level %s n=%d mean signed err %+.2f MAE %.2f" % per_level[-1])
    sh = []
    for s in range(N_SHUFFLES):
        ys = RNG.permutation(y)
        b2, s2, r2, _, _, _ = run_cv(X, ys, g)
        sh.append((scores(ys, b2), scores(ys, r2)))
    shuf_med = {k: float(np.mean([x[0][k] for x in sh])) for k in ("mae", "exact", "within1")}
    shuf_rdg = {k: float(np.mean([x[1][k] for x in sh])) for k in ("mae", "exact", "within1")}
    print("shuffled median:", shuf_med, "shuffled ridge:", shuf_rdg)

    # 5. alarms
    alarm = np.abs(pr - y) >= 2
    alarms = []
    for i in np.where(alarm)[0]:
        contrib, z = detail[i]
        direction = np.sign(pr[i] - y[i])
        order = np.argsort(-direction * contrib)
        drivers = []
        for j in order[:3]:
            if direction * contrib[j] <= 0:
                break
            v = X[i, j]
            drivers.append("%s=%s (z%+.1f)" % (FEATURES[j], "missing" if v != v else ("%g" % round(v, 2)), z[j]))
        alarms.append((i, drivers))
    alarms.sort(key=lambda a: -abs(pr[a[0]] - y[a[0]]))
    drv = {i: "; ".join(d) for i, d in alarms}
    print("alarms:", len(alarms))
    for i, d in alarms:
        print("  %s -> %s | %s | %s" % (NUM_LEVEL[int(y[i])], NUM_LEVEL[int(pr[i])], C[i]["title"][:45], drv[i]))

    # 6. fit on all, apply to non-chosen
    model = fit_full(X, y, g)
    others = [r for r in S if r["file"] not in ch_level]
    Xo = np.array([featurize(r) for r in others], float)
    po = predict_full(model, Xo)
    print("full-fit alpha", model["alpha"], "coef", {k: round(float(v), 2) for k, v in zip(FEATURES, model["w"])},
          "other files:", len(others), "pred dist:", sorted(Counter(NUM_LEVEL[int(p)] for p in po).items()))

    with open(OUT_CSV, "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["file", "title", "published_level", "prediction", "prediction_kind", "alarm",
                    "alarm_drivers", "work_group"] + FEATURES)
        fmt = lambda v: "" if v != v else ("%g" % round(float(v), 3))
        for i, f in enumerate(files):
            w.writerow([f, C[i]["title"], C[i]["level"], NUM_LEVEL[int(pr[i])], "held-out",
                        "ALARM" if alarm[i] else "", drv.get(i, ""), gkeys[i]] + [fmt(v) for v in X[i]])
        for r, x, p in zip(others, Xo, po):
            w.writerow([r["file"], r["title"], "", NUM_LEVEL[int(p)], "provisional", "", "", ""]
                       + [fmt(v) for v in x])

    write_md(corr, sc, ci, dci, sc_c, per_level, shuf_med, shuf_rdg, alarms, y, pr, C, miss,
             len(gid), len(cid), model, Counter(best_feat), len(others))


def pct(v):
    return "%d%%" % round(100 * v)


def write_md(corr, sc, ci, dci, sc_c, per_level, shuf_med, shuf_rdg, alarms, y, pr, C, miss,
             ngroups, ncomp, model, bf, nothers):
    L = []
    L.append("# D02: score statistics against published levels (descriptive; alarms only)")
    L.append("")
    L.append("Script: tools/pieces/difficulty/d02_check.py. Inputs fixed at commit 644b31fb. n = 135 chosen files in "
             "%d work groups (variants and all movements of one sonatina kept together); levels B,1-8 = 0-8. "
             "No pass mark. Per-file table: difficulty-check.csv." % ngroups)
    L.append("")
    L.append("## Spearman correlation with published level (10 features, fixed in advance)")
    L.append("")
    L.append("; ".join("%s %+.2f (n=%d)" % (n, r, k) for n, r, k in sorted(corr, key=lambda c: -abs(c[1]))) + ".")
    L.append("")
    L.append("No usable tempo (none, exporter-default 120, or under half the piece with a known tempo): %d of 135; "
             "such gaps are filled with the training-fold median." % miss["attacks_per_second"])
    L.append("")
    L.append("## Leave-one-group-out, n = 135 (held-out predictions rounded, clipped to 0-8)")
    L.append("")
    L.append("| predictor | mean abs level error (95% interval) | exact | within one |")
    L.append("|---|---|---|---|")
    names = {"median": "(a) always the training median level",
             "single": "(b) best single feature (picked inside each fold)",
             "ridge": "(c) ridge regression, all 10 features"}
    for k in ("median", "single", "ridge"):
        v = sc[k]
        L.append("| %s | %.2f (%.2f-%.2f) | %s | %s |" % (names[k], v["mae"], ci[k][0], ci[k][1], pct(v["exact"]), pct(v["within1"])))
    L.append("")
    L.append("Intervals resample whole groups. Ridge minus median error: %+.2f levels (interval %+.2f to %+.2f). "
             "Single feature picked most often: %s."
             % (sc["ridge"]["mae"] - sc["median"]["mae"], dci[0], dci[1], ", ".join("%s x%d" % kv for kv in bf.most_common(2))))
    L.append("")
    L.append("Stricter grouping (every piece of one composer held out together, %d groups), error / exact / within one: "
             "median %.2f / %s / %s; single %.2f / %s / %s; ridge %.2f / %s / %s."
             % (ncomp, sc_c["median"]["mae"], pct(sc_c["median"]["exact"]), pct(sc_c["median"]["within1"]),
                sc_c["single"]["mae"], pct(sc_c["single"]["exact"]), pct(sc_c["single"]["within1"]),
                sc_c["ridge"]["mae"], pct(sc_c["ridge"]["exact"]), pct(sc_c["ridge"]["within1"])))
    L.append("")
    L.append("Shuffled-levels control (10 shuffles, same procedure), mean error / within one: median baseline %.2f / %s, ridge %.2f / %s."
             % (shuf_med["mae"], pct(shuf_med["within1"]), shuf_rdg["mae"], pct(shuf_rdg["within1"])))
    L.append("")
    L.append("Ridge by published level, as level: n, mean signed error (held-out minus published), mean abs error: " +
             "; ".join("%s: %d, %+.1f, %.1f" % (a, n, s, m) for a, n, s, m in per_level) + ".")
    L.append("")
    L.append("## Alarms: held-out ridge prediction 2 or more levels from published (%d of 135)" % len(alarms))
    L.append("")
    L.append("For review, not reassignment. Largest first; drivers = features pushing furthest toward the disagreement "
             "(z = standardised value). All alarms with up to 3 drivers are in the CSV.")
    L.append("")
    shown = alarms[:10]
    for i, d in shown:
        L.append("- published %s, predicted %s: %s | %s" % (C[i]["level"], NUM_LEVEL[int(pr[i])], C[i]["title"][:44], "; ".join(d[:2])))
    if len(alarms) > len(shown):
        L.append("- ... %d more in the CSV." % (len(alarms) - len(shown)))
    L.append("")
    L.append("## Provisional suggestions")
    L.append("")
    L.append("Ridge fitted on all 135 (strength %g) applied to the other %d candidate files: `prediction`, "
             "`prediction_kind` = provisional. A suggestion only; no alarm, no published level." % (model["alpha"], nothers))
    L.append("")
    L.append("## Limits")
    L.append("")
    L.append("- Small sample: 135 files, 9 levels with 11-22 each; intervals are wide and the alarm list moves with the fold.")
    L.append("- Labels come from different syllabuses and lists; low levels are mostly arrangements, high levels mostly originals, so style may be learned as much as difficulty.")
    L.append("- Figures are per staff, not per hand; the whole file is measured even where only part (a movement, bars 1-N, the prelude) is the chosen piece.")
    L.append("- Editions and arrangements differ; same-work grouping uses title and number rules plus a check for equal bars, length and entropy.")
    L.append("- Ridge shrinks toward the middle, so alarms at levels 1 and 8 are partly shrinkage; same work, different labels (Fur Elise is 5 and 6). No listening, playing or fingering.")
    L.append("- The 10 features and the ridge-strength grid were fixed before running; single feature and strength are chosen inside each training fold.")
    L.append("")
    OUT_MD.write_text("\n".join(L) + "\n", encoding="utf-8")
    print("md lines:", len(L))


if __name__ == "__main__":
    main()
