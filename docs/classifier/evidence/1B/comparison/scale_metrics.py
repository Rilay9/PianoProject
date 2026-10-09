"""scale.collection metrics: reads scale_results.json (scale_run.py) and scale_tonal_out.json (scale_tonal.py), writes
scale_metrics.json and frag_scale.md (the tables of scale-row.md section 3). Usage: python -X utf8 scale_metrics.py"""
import json, re, collections, statistics, sys
from pathlib import Path
from scale_lib import lab, parse_cur_item, NAMES, SHARP

HERE = Path(__file__).resolve().parent
R = json.load(open(HERE / "scale_results.json"))
TN = json.load(open(HERE / "scale_tonal_out.json"))
TNR = TN["results"]
TONICLESS = {"all twelve", "whole-tone", "octatonic"}


def key_eq(a, b):
    """a, b = (label, tonic); equal when labels equal and (tonics equal or the label has no tonic)."""
    return a[0] == b[0] and (a[0] in TONICLESS or a[1] == b[1])


def classify(exp, C, tonic):
    """exp = (label, tonic) or None (= no name expected); C = list of (label, tonic) the method names; tonic = the tonic given to
    the method (pc) or None. Returns one of: exact, right_among_several, wrong, missed, correct_none, false_name."""
    C = [c for c in C if tonic is None or c[0] in TONICLESS or c[1] == tonic]
    C = list(dict.fromkeys((c[0], None) if c[0] in TONICLESS else (c[0], c[1]) for c in C))
    if exp is None:
        return ("correct_none" if not C else "false_name"), C
    hit = [c for c in C if key_eq(c, exp)]
    if hit and len(C) == 1:
        return "exact", C
    if hit:
        return "right_among_several", C
    if not C:
        return "missed", C
    return "wrong", C


def m21_label(c):
    """The label music21 itself gives a returned scale: its class. The blues class (WeightedHexatonicBlues) is a six-note scale whose
    `pitches` property lists only five notes (the blue note is a weighted passing note), so it is labelled by class, not by pitches."""
    if c["cls"] == "WeightedHexatonicBlues":
        return "blues scale"
    return lab(c["pcs"], c["tonic"])[0] or f"other scale ({c['cls']})"


def m21_lists(m21c, S):
    """-> (native, eq). native = every full match deriveRanked returned (weight == number of pitch classes of S), however large the
    scale; eq = the matches whose scale has exactly the pitch classes of S (the blues class: six pitch classes)."""
    nat = [(m21_label(c), c["tonic"]) for c in m21c]
    eq = [(m21_label(c), c["tonic"]) for c in m21c
          if (len(S) == 6 if c["cls"] == "WeightedHexatonicBlues" else sorted(c["pcs"]) == sorted(S))]
    return nat, eq


def tonal_all(tid, S):
    out = []
    for c in TNR[tid]["all"]:
        # Tonal's scale-type chroma is relative to the tonic (bit i = interval of i semitones): rotate by the tonic
        bits = {(i + c["tonic"]) % 12 for i, ch in enumerate(c["chroma"]) if ch == "1"}
        assert bits == set(S), (tid, c)       # exact match: the scale is the item's own set
        l = lab(S, c["tonic"])[0] or f"other ({c['type']})"
        out.append((l, c["tonic"], c["name"]))
    return out


def expt(rec):
    e = rec.get("exp")
    if not e:
        return None
    return (e["label"], e["tonic"]) if e["label"] else None


# ---------------------------------------------------------------- item level
METH = ["cur_T", "cur_ref", "m21nat_T", "m21eq_T", "m21eq_ref", "m21eq_sharp_T", "tonal_T", "tonal_ref", "tonal_T7", "tonal_none"]
MLAB = {"cur_T": "current detector (tonic: its own key)", "cur_ref": "current detector (tonic: reference)",
        "m21nat_T": "music21 deriveRanked, as returned (tonic: detected key)",
        "m21eq_T": "music21 deriveRanked + equality check (tonic: detected key)",
        "m21eq_ref": "music21 deriveRanked + equality check (tonic: reference)",
        "m21eq_sharp_T": "music21 deriveRanked + equality check, notes spelled with sharps only (tonic: detected key)",
        "tonal_T": "Tonal Scale.detect exact (tonic: detected key)", "tonal_ref": "Tonal Scale.detect exact (tonic: reference)",
        "tonal_T7": "Tonal Scale.detect exact, names of 8 to 11 pitch classes dropped (tonic: detected key)",
        "tonal_none": "Tonal Scale.detect exact (no tonic given)"}


def answers(k, rec):
    S = rec["S"]
    T = rec["home"][0] if rec.get("home") else None
    Rt = rec.get("ref_t")
    cu = parse_cur_item(tuple(rec["cur"]["res"]))
    cur_T = [cu] if cu else []
    cr = parse_cur_item(tuple(rec["cur_ref"])) if rec.get("cur_ref") else None
    cur_ref = [cr] if cr else (cur_T if rec.get("ref_t") is None else [])      # no reference tonic (chromatic): same as its own
    nat, eq = m21_lists(rec["m21"]["cands"], S)
    _, eq_sharp = m21_lists(rec["m21_sharp"]["cands"], S)
    ta = [(l, t) for l, t, _ in tonal_all(str(k), S)]
    ta7 = ta if (len(S) <= 7 or len(S) == 12) else []
    return {"cur_T": (cur_T, None), "cur_ref": (cur_ref, None), "m21nat_T": (nat, T), "m21eq_T": (eq, T), "m21eq_ref": (eq, Rt),
            "m21eq_sharp_T": (eq_sharp, T),
            "tonal_T": (ta, T), "tonal_ref": (ta, Rt), "tonal_T7": (ta7, T), "tonal_none": (ta, None)}


def group_of(rec):
    f, i = rec["fam"], rec["id"]
    if f == "scale":
        s = i.split(".")[2]
        return "scale: harmonic minor" if "harmonic" in s else "scale: melodic minor" if "melodic" in s else "scale: natural minor" if "natural" in s else "scale: major"
    if f == "pentatonic":
        return "pentatonic drill: blues" if i.endswith(".blues") else "pentatonic drill: minor pentatonic"
    return f


CATS = ["exact", "right_among_several", "wrong", "missed", "correct_none", "false_name"]
gen = collections.OrderedDict()
res_gen = collections.defaultdict(lambda: collections.defaultdict(collections.Counter))   # method -> group -> cat
conf_gen = collections.defaultdict(collections.Counter)
tot_gen = collections.defaultdict(collections.Counter)
wrongs_gen = collections.defaultdict(list)
for k, rec in enumerate(R):
    if rec["p"] != "generated" or "S" not in rec:
        continue
    g = group_of(rec)
    exp = expt(rec)
    A = answers(k, rec)
    for m in METH:
        C, tonic = A[m]
        if m == "m21eq_ref" or m == "tonal_ref" or m == "cur_ref":
            pass
        cat, Cf = classify(exp, C, tonic)
        res_gen[m][g][cat] += 1
        tot_gen[m][cat] += 1
        if cat in ("wrong", "false_name", "missed", "right_among_several"):
            e = exp[0] if exp else "none"
            conf_gen[m][(e, " / ".join(sorted({f"{c[0]}" for c in Cf})) or "(nothing)", cat)] += 1
            if cat in ("wrong", "false_name", "missed") and len(wrongs_gen[m]) < 30:
                wrongs_gen[m].append((rec["id"], e, [list(c[:2]) for c in Cf][:6]))
    gen[g] = gen.get(g, 0) + 1

groups = list(gen)


def row_exact(m, g):
    c = res_gen[m][g]
    n = gen[g]
    good = c["exact"] + c["correct_none"]
    return f"{good}/{n}"


md = []
md.append("**Generated items (374, expected answer from the recipe): right answers per family.** A right answer is `exact` (the method names exactly the expected collection and tonic and nothing else) or, where the recipe declares no 7-class collection (melodic minor, up and down: 9 pitch classes; five-finger: 5), `correct_none` (the method names nothing). Columns are the methods; the last row is all 374.\n")
md.append("| family | items | " + " | ".join(MLAB[m] for m in METH) + " |")
md.append("| --- | --- | " + " | ".join("---" for _ in METH) + " |")
for g in groups:
    md.append(f"| {g} | {gen[g]} | " + " | ".join(row_exact(m, g) for m in METH) + " |")
N = sum(gen.values())
md.append(f"| **all** | {N} | " + " | ".join(f"{tot_gen[m]['exact'] + tot_gen[m]['correct_none']}/{N} ({100*(tot_gen[m]['exact'] + tot_gen[m]['correct_none'])/N:.1f}%)" for m in METH) + " |")
md.append("")
md.append("**Generated items, all categories (counts out of 374).**\n")
md.append("| method | exact | right among several | wrong | missed (no name) | correct: no name | false name |")
md.append("| --- | --- | --- | --- | --- | --- | --- |")
for m in METH:
    c = tot_gen[m]
    md.append(f"| {MLAB[m]} | " + " | ".join(str(c[x]) for x in CATS) + " |")
md.append("")
md.append("**Generated items: confusion pairs (expected label -> what the method named; only the answers that were not exact).** `wrong` names another collection or tonic, `false_name` names a collection where none is expected, `missed` names nothing, `right_among_several` includes the expected name among others.\n")
for m in METH:
    c = conf_gen[m]
    if not c:
        md.append(f"- {MLAB[m]}: none.")
        continue
    items = sorted(c.items(), key=lambda kv: -kv[1])[:12]
    md.append(f"- {MLAB[m]}: " + "; ".join(f"{e} -> {got} [{cat}] x{n}" for (e, got, cat), n in items) + (f" (and {len(c) - 12} more pair kinds)" if len(c) > 12 else ""))
md.append("")

# ---------------------------------------------------------------- real items
real_exp = collections.defaultdict(lambda: collections.defaultdict(collections.Counter))
real_all = collections.defaultdict(collections.Counter)
conf_real = collections.defaultdict(collections.Counter)
n_exp_name = n_exp_none = n_titled = 0
all_real = []
for k, rec in enumerate(R):
    if rec["p"] == "generated" or "S" not in rec:
        continue
    all_real.append((k, rec))
    S = rec["S"]
    n = len(S)
    A = answers(k, rec)
    exp = expt(rec)
    titled = rec.get("exp") is not None
    if titled:
        n_titled += 1
        if exp:
            n_exp_name += 1
        else:
            n_exp_none += 1
        for m in METH:
            if m in ("cur_ref", "m21eq_ref", "tonal_ref"):
                continue
            C, tonic = A[m]
            cat, Cf = classify(exp, C, tonic)
            real_exp[m]["name expected" if exp else "no name expected"][cat] += 1
            if cat in ("wrong", "false_name"):
                conf_real[m][((exp[0] if exp else "none"), " / ".join(sorted({c[0] for c in Cf})), cat)] += 1
    # set-level, all real items, tonic not used: does the method name anything / the table collection?
    for m in ("cur_T", "m21nat_T", "m21eq_T", "tonal_T7", "tonal_none"):
        C, tonic = A[m]
        named = [c for c in dict.fromkeys(C)] if m != "cur_T" else C
        grp = "12 pitch classes" if n == 12 else "8 to 11 pitch classes" if n >= 8 else "5 to 7 pitch classes" if n >= 5 else "fewer than 5"
        real_all[m][(grp, "item count")] += 1
        if named:
            real_all[m][(grp, "names something")] += 1
            if all(str(c[0]).startswith("other") or "tonic not its own" in str(c[0]) for c in named):
                real_all[m][(grp, "only outside table")] += 1
setlev = collections.Counter()
for k, rec in all_real:
    S = rec["S"]; n = len(S)
    grp = "12 pitch classes" if n == 12 else "8 to 11 pitch classes" if n >= 8 else "5 to 7 pitch classes" if n >= 5 else "fewer than 5"
    eqname = bool(any(lab(S, t)[0] and "tonic not its own" not in lab(S, t)[0] for t in S)) if n <= 7 or n == 12 else False
    setlev[(grp, "set equals a table collection")] += 1 if eqname else 0
    setlev[(grp, "items")] += 1

md.append(f"**Real items with a key in the title ({n_titled}; {n_exp_name} whose pitch-class set equals a table collection at the title's tonic, {n_exp_none} whose set does not).** Expected: the project's table name of the item's pitch-class set at the title's tonic, or no name when the set equals no collection of at most 7 pitch classes. Tonic given to the library methods and used by the current detector: the key the project's detector found (`H.analyse`).\n")
md.append("| method | set names a collection: exact | right among several | wrong | missed | set equals no collection: correct (no name) | false name |")
md.append("| --- | --- | --- | --- | --- | --- | --- |")
for m in ("cur_T", "m21nat_T", "m21eq_T", "m21eq_sharp_T", "tonal_T", "tonal_T7", "tonal_none"):
    a, b = real_exp[m]["name expected"], real_exp[m]["no name expected"]
    md.append(f"| {MLAB[m]} | {a['exact']}/{n_exp_name} | {a['right_among_several']} | {a['wrong']} | {a['missed']} | {b['correct_none']}/{n_exp_none} | {b['false_name']} |")
md.append("")
md.append("**Real items with a title key: what the wrong and false answers were (expected -> named).**\n")
for m in ("cur_T", "m21nat_T", "m21eq_T", "m21eq_sharp_T", "tonal_T", "tonal_T7", "tonal_none"):
    c = conf_real[m]
    items = sorted(c.items(), key=lambda kv: -kv[1])[:10]
    md.append(f"- {MLAB[m]}: " + ("; ".join(f"{e} -> {got} [{cat}] x{n}" for (e, got, cat), n in items) if items else "none") + (f" (and {len(c) - 10} more)" if len(c) > 10 else ""))
md.append("")
md.append("**All 812 readable real items: how many each method gives a collection name to, by the size of the item's pitch-class set (no tonic given to the library methods; the current detector with its own key).** A name for 8 to 11 pitch classes is a false name by the page's rule (equality, not containment).\n")
grps = ["fewer than 5", "5 to 7 pitch classes", "8 to 11 pitch classes", "12 pitch classes"]
md.append("| method | " + " | ".join(grps) + " |")
md.append("| --- | " + " | ".join("---" for _ in grps) + " |")
md.append("| items in the group | " + " | ".join(str(setlev[(g, 'items')]) for g in grps) + " |")
md.append("| of which the set equals a table collection (or twelve) | " + " | ".join(str(setlev[(g, 'set equals a table collection')]) for g in grps) + " |")
for m in ("cur_T", "m21nat_T", "m21eq_T", "tonal_T7", "tonal_none"):
    md.append(f"| {MLAB[m]}: items given a name | " + " | ".join(str(real_all[m][(g, 'names something')]) for g in grps) + " |")
    md.append(f"| {MLAB[m]}: of those, named only with a collection outside the project's table (or with a set whose tonic is not its own) | " + " | ".join(str(real_all[m][(g, 'only outside table')]) for g in grps) + " |")
md.append("")

# the real modal items: every real item the current detector names a mode, plus mode names from any method
modal_rows = []
for k, rec in all_real:
    cu = parse_cur_item(tuple(rec["cur"]["res"]))
    if cu and cu[0] not in ("ionian (major)", "aeolian (natural minor)", "all twelve"):
        A = answers(k, rec)
        row = {"id": rec["id"], "home": rec.get("home"), "S": rec["S"]}
        for m in ("cur_T", "m21nat_T", "m21eq_T", "m21eq_sharp_T", "tonal_T", "tonal_T7", "tonal_none"):
            C, tonic = A[m]
            _, Cf = classify(None, C, tonic)
            row[m] = [list(c[:2]) for c in Cf]
        modal_rows.append(row)
md.append(f"**Real items the current detector gives a mode or other non-major/minor name ({len(modal_rows)}), and what each method says.** (tonic: the key the project's detector found.) Expected: see section 1 (no title or score text names a mode; truth is a reading).\n")
md.append("| item | detected key | current | music21 + equality | music21 as returned (labels) | Tonal exact (tonic given) | Tonal exact (no tonic) |")
md.append("| --- | --- | --- | --- | --- | --- | --- |")
def fmt(L):
    return ", ".join(f"{a} on {NAMES[b]}" if b is not None else a for a, b in L) if L else "-"
for r in modal_rows:
    h = r["home"]
    md.append(f"| {r['id']} | {NAMES[h[0]]+' '+h[1] if h else '-'} | {fmt(r['cur_T'])} | {fmt(r['m21eq_T'])} | {fmt(r['m21nat_T'])[:120]} | {fmt(r['tonal_T'])} | {fmt(r['tonal_none'])[:120]} |")
md.append("")

# ---------------------------------------------------------------- passage level
def parse_cur_passage(nm):
    m = re.match(r"^(\w#?b?) (major|natural minor) scale \(local key\)$", nm)
    if m:
        return ("ionian (major)" if m.group(2) == "major" else "aeolian (natural minor)", NAMES.index(m.group(1)))
    m = re.match(r"^(\w#?b?) (harmonic minor|melodic minor \(ascending\)) \(local key\)$", nm)
    if m:
        return (m.group(2), NAMES.index(m.group(1)))
    m = re.match(r"^(.+) on (\w#?b?) \(local key\)$", nm)
    if m:
        return (m.group(1), NAMES.index(m.group(2)))
    if nm == "whole-tone":
        return ("whole-tone", None)
    if nm == "chromatic":
        return ("all twelve", None)
    return None


def exp_run(rec, run):
    e = rec["exp"]
    if rec["fam"] == "scale" and "melodic" in rec["id"].split(".")[2]:
        lbl = "melodic minor (ascending)" if run["dir"] > 0 else "aeolian (natural minor)"
        return (lbl, e["tonic"])
    if rec["fam"] == "five_finger" or not e["label"]:
        return None
    return (e["label"], e["tonic"])


PM = ["cur", "m21nat", "m21eq", "tonal"]
PLAB = {"cur": "current detector (passage_name, local key)", "m21nat": "music21 deriveRanked, as returned", "m21eq": "music21 deriveRanked + equality check", "tonal": "Tonal Scale.detect exact"}
pas = collections.defaultdict(lambda: collections.defaultdict(collections.Counter))
pas_tot = collections.defaultdict(collections.Counter)
pas_conf = collections.defaultdict(collections.Counter)
n_runs = n_mismatch = 0
mism_ex = []
secs = collections.defaultdict(list)
for k, rec in enumerate(R):
    if rec["p"] != "generated" or not rec.get("runs"):
        continue
    for j, run in enumerate(rec["runs"]):
        n_runs += 1
        S = run["pcs"]
        e = exp_run(rec, run)
        lk_t = run["lk"][0]
        # the run's own set must be the expected collection for the run to be scored
        if e is not None and lab(S, e[1])[0] != e[0] and e[0] not in TONICLESS:
            n_mismatch += 1
            if len(mism_ex) < 6:
                mism_ex.append((rec["id"], run["bar"], run["dir"], S, e))
            continue
        if e is None and rec["fam"] == "five_finger":
            continue
        ans = {}
        cp = parse_cur_passage(run["cur"][0])
        ans["cur"] = ([cp] if cp else [], None)
        nat, eq = m21_lists(run["m21"], S)
        ans["m21nat"] = (nat, lk_t)
        ans["m21eq"] = (eq, lk_t)
        ta = [(l, t) for l, t, _ in tonal_all(f"{k}#r{j}", S)]
        ans["tonal"] = (ta, lk_t)
        g = group_of(rec)
        for m in PM:
            C, tonic = ans[m]
            cat, Cf = classify(e, C, tonic)
            pas[m][g][cat] += 1
            pas_tot[m][cat] += 1
            if cat not in ("exact", "correct_none"):
                pas_conf[m][((e[0] if e else "none"), " / ".join(sorted({c[0] for c in Cf})) or "(nothing)", cat)] += 1
        secs["cur"].append(run["sec_cur"])
        if not run["m21_cached"]:
            secs["m21"].append(run["sec_m21"])
scored = sum(pas_tot["cur"].values())
md.append(f"**Passage level, generated scale drills: {n_runs} single-note runs of at least 6 notes found by the project's `scale_runs`; {n_mismatch} whose pitch-class set is not the declared collection (not scored); {scored} scored.** Every method names the same run; the tonic given to the library methods is the run's local key tonic (as the current detector uses). Expected: the declared collection (melodic minor drills: the ascending run melodic minor, the descending run natural minor: a reading of the standard scale and the page's direction test).\n")
md.append("| method | exact | right among several | wrong | missed | correct: no name | false name |")
md.append("| --- | --- | --- | --- | --- | --- | --- |")
for m in PM:
    c = pas_tot[m]
    md.append(f"| {PLAB[m]} | " + " | ".join(str(c[x]) for x in CATS) + " |")
md.append("")
md.append("**Passage level: runs by family (exact + correct no-name / scored).**\n")
pg = sorted({g for m in PM for g in pas[m]})
md.append("| family | scored runs | " + " | ".join(PLAB[m] for m in PM) + " |")
md.append("| --- | --- | " + " | ".join("---" for _ in PM) + " |")
for g in pg:
    nrun = sum(pas["cur"][g].values())
    md.append(f"| {g} | {nrun} | " + " | ".join(f"{pas[m][g]['exact'] + pas[m][g]['correct_none']}" for m in PM) + " |")
md.append("")
md.append("**Passage level: what the non-exact answers were.**\n")
for m in PM:
    c = pas_conf[m]
    items = sorted(c.items(), key=lambda kv: -kv[1])[:8]
    md.append(f"- {PLAB[m]}: " + ("; ".join(f"{e} -> {got} [{cat}] x{n}" for (e, got, cat), n in items) if items else "none") + (f" (and {len(c) - 8} more)" if len(c) > 8 else ""))
if mism_ex:
    md.append("")
    md.append("Runs not scored (set differs from the declared collection), first " + str(len(mism_ex)) + ": " + "; ".join(f"{i} bar {b} dir {d} pcs {s} expected {e}" for i, b, d, s, e in mism_ex))

# El Condor Pasa
md.append("")
md.append("**Real passage: `song.folk.el-condor-pasa-if-i-could.pdmx` (the page's positive: a minor pentatonic run).** Runs of 6 or more single notes:\n")
for k, rec in enumerate(R):
    if "el-condor-pasa" in rec["id"]:
        for j, run in enumerate(rec.get("runs", [])):
            S = run["pcs"]
            nat, eq = m21_lists(run["m21"], S)
            ta = [(l, t) for l, t, _ in tonal_all(f"{k}#r{j}", S)]
            tt = [c for c in ta if c[1] == run["lk"][0]]
            md.append(f"- bar {run['bar']} (0-based), hand {run['h']}, {run['n']} notes, set {[SHARP[x] for x in S]}, local key {NAMES[run['lk'][0]]} {run['lk'][1]}: current: {run['cur'][0]!r}; music21 + equality: {fmt([c for c in eq if c[1]==run['lk'][0]])} (tonic-free list: {fmt(eq)[:90]}); music21 as returned at that tonic: {fmt([c for c in nat if c[1]==run['lk'][0]])}; Tonal at that tonic: {fmt(tt)}")

# ---------------------------------------------------------------- runtime
def stats(x):
    x = sorted(x)
    return f"{statistics.mean(x)*1000:.2f} / {statistics.median(x)*1000:.2f} / {x[-1]*1000:.2f}"
cur_s = [r["cur"]["sec"] for r in R if "S" in r]
key_s = [r["sec_key"] for r in R if "sec_key" in r]
m21_s = [r["m21"]["sec"] for r in R if "S" in r]
ta_all = [TNR[str(k)]["sec_all"] for k, r in enumerate(R) if "S" in r]
ta_t = [TNR[str(k)]["sec_tonic"] for k, r in enumerate(R) if "S" in r and TNR[str(k)]["sec_tonic"] is not None]
md.append("")
md.append("**Runtime per item (milliseconds: mean / median / max), item level.** Measured on this machine in 12 worker processes (music21, current detector) and one Node process (Tonal); the naming step only, after the score is read and, for the current detector and the library methods that need a tonic, after the key is found.\n")
md.append("| step | items | ms per item |")
md.append("| --- | --- | --- |")
md.append(f"| current detector, naming only (`item_name`) | {len(cur_s)} | {stats(cur_s)} |")
md.append(f"| key detection the naming needs (`H.analyse`, whole analysis) | {len(key_s)} | {stats(key_s)} |")
md.append(f"| music21 `deriveRanked`, 13 scale classes, 12 results each | {len(m21_s)} | {stats(m21_s)} |")
md.append(f"| Tonal `Scale.detect` exact, every tonic in the set | {len(ta_all)} | {stats(ta_all)} |")
md.append(f"| Tonal `Scale.detect` exact, one tonic given | {len(ta_t)} | {stats(ta_t)} |")
md.append(f"| Tonal, whole batch of {len(TNR)} queries, one Node process | - | {TN['total_sec']*1000:.0f} ms in all |")
md.append(f"| current detector, passage naming (`passage_name`) | {len(secs['cur'])} runs | {stats(secs['cur'])} |")
md.append(f"| music21 `deriveRanked`, one run's set (first time that set was seen) | {len(secs['m21'])} runs | {stats(secs['m21'])} |")

(HERE / "frag_scale.md").write_text("\n".join(md), encoding="utf-8")
json.dump({"gen_tot": {m: dict(tot_gen[m]) for m in METH}, "n_gen": N, "real_exp": {m: {k: dict(v) for k, v in real_exp[m].items()} for m in real_exp},
           "n_titled": n_titled, "n_exp_name": n_exp_name, "n_exp_none": n_exp_none, "passage": {m: dict(pas_tot[m]) for m in PM}, "n_runs": n_runs,
           "n_run_mismatch": n_mismatch, "modal_rows": modal_rows, "wrongs_gen": {m: wrongs_gen[m] for m in METH}}, open(HERE / "scale_metrics.json", "w"), indent=1)
print("\n".join(md))
