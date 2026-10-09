"""Catalogue tables for the rhythm.syncopation comparison. Reads cur_items.json, cat_synpy.json, cat_amads.json,
named_items.json, the catalogue; writes cat_metrics.json and frag_cat.md. Run with the main .venv.

Ground truth on the 1,211 generated items (fixed before any candidate was scored): positive = the recipe declares
syncopation (concepts name syncopation, or the drill kind is a syncopation drill: 46 items); negative = every other
generated item (1,165). Presence per method:
  current detector            present_page (kinds beat-level held, held, held at the subdivision, off-beat attack, accent,
                              rest, bass-then-held-chord: the page's list), and present_proper (without off-beat attack
                              and bass-then-held-chord: the validation row's count "without");
  current detector, fix       sync.py with the bass-then-held-chord test changed to octave-bass-aware and left-hand-only
                              (cur_run.py), page list, and UNKNOWN when the file has no <time> element;
  SynPy model                 at least one measured bar above the model's own reference (cat_synpy.py), on the texture
                              (every onset of either hand) or on the lines (right-hand top, left-hand bottom);
  AMADS WNBD                  value > 0 on the score file, or on the texture / lines onsets;
  AMADS span                  total score > 0 on the texture / lines onsets (single-metre items on a dyadic grid only).
AUC uses a continuous score per item: events per readable bar (current), present bars / measured bars (SynPy), the
WNBD value, the span score.
"""
import json, sys
from collections import Counter, defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import syn_common as C

H = C.HERE
cat = {i["id"]: i for i in C.catalogue()}
cur = {r["id"]: r for r in json.loads((H / "cur_items.json").read_text(encoding="utf-8"))}
syn = json.loads((H / "cat_synpy.json").read_text(encoding="utf-8"))
am = json.loads((H / "cat_amads.json").read_text(encoding="utf-8"))
named = json.loads((H / "named_items.json").read_text(encoding="utf-8"))["items"]
SYN = ["LHL", "PRS", "TMC", "SG", "KTH", "TOB", "WNBD"]
gen = [i for i in cat if i.startswith("exercise.") and cat[i].get("file")]
label = {i: C.declares_syncopation(cat[i]) for i in gen}


def nevents(r, kinds=None):
    n = 0
    for h, c in r.get("kinds", {}).items():
        for k, v in c.items():
            if k in ("silent beat after a run",):
                continue
            if kinds is None or k in kinds:
                n += v
    return n


# ---- per method: item -> (present: True/False/None for no result, score: float/None)
M = {}


def put(method, iid, present, score):
    M.setdefault(method, {})[iid] = (present, score)


for iid, r in cur.items():
    if "error" in r:
        put("current detector (page list)", iid, None, None)
        put("current detector, presence without off-beat attack / bass-then-held-chord", iid, None, None)
        put("current detector with fix", iid, None, None)
        continue
    nb = max(1, r.get("readable") or 1)
    put("current detector (page list)", iid, bool(r["present_page"]), nevents(r) / nb)
    proper = ("beat-level held", "held", "held at the subdivision", "accent", "rest")
    put("current detector, presence without off-beat attack / bass-then-held-chord", iid, bool(r["present_proper"]), nevents(r, proper) / nb)
    f = r.get("fix", {})
    if "error" in f:
        put("current detector with fix", iid, None, None)
    elif r.get("has_time") is False:
        put("current detector with fix", iid, "UNKNOWN", None)
    else:
        put("current detector with fix", iid, bool(f["present_page"]), nevents(f) / nb)
for k in SYN:
    for inp in ("texture", "lines"):
        name = f"SynPy {k} ({inp})"
        for iid, r in syn.items():
            if "error" in r or "extract_error" in r:
                put(name, iid, None, None)
                continue
            x = r[inp][k]
            if not x["measured"]:
                put(name, iid, None, None)
            else:
                put(name, iid, bool(x["present"]), x["present_bars"] / x["measured"])
for iid, r in am.items():
    if "wnbd_score" in r:
        put("AMADS WNBD (score file)", iid, r["wnbd_score"] > 0, r["wnbd_score"])
    else:
        put("AMADS WNBD (score file)", iid, None, None)
    wl = r.get("wnbd_lines", {})
    if "A" in wl:
        put("AMADS WNBD (texture onsets)", iid, wl["A"] > 0, wl["A"])
    else:
        put("AMADS WNBD (texture onsets)", iid, None, None)
    ls = [wl[h] for h in "RL" if h in wl]
    put("AMADS WNBD (lines onsets)", iid, (max(ls) > 0) if ls else None, max(ls) if ls else None)
    sp = r.get("span", {})
    if "A" in sp:
        put("AMADS span (texture onsets)", iid, sp["A"] > 0, sp["A"])
    else:
        put("AMADS span (texture onsets)", iid, None, None)
    ls = [sp[h] for h in "RL" if h in sp]
    put("AMADS span (lines onsets)", iid, (max(ls) > 0) if ls else None, max(ls) if ls else None)


def auc(pos, neg):
    if not pos or not neg:
        return None
    s = 0.0
    for p in pos:
        for q in neg:
            s += 1.0 if p > q else 0.5 if p == q else 0.0
    return s / (len(pos) * len(neg))


def prf(method, items):
    tp = fp = fn = tn = nores = unk = 0
    pos, neg = [], []
    for i in items:
        pr, sc = M[method].get(i, (None, None))
        if pr is None:
            nores += 1
            continue
        if pr == "UNKNOWN":
            unk += 1
            continue
        if sc is not None:
            (pos if label[i] else neg).append(sc)
        if label[i]:
            tp += pr; fn += (not pr)
        else:
            fp += pr; tn += (not pr)
    return {"tp": tp, "fp": fp, "fn": fn, "tn": tn, "no_result": nores, "unknown": unk,
            "precision": tp / (tp + fp) if tp + fp else None, "recall": tp / (tp + fn) if tp + fn else None,
            "auc": auc(pos, neg)}


METHODS = list(M)
res = {"generated": {m: prf(m, gen) for m in METHODS}}


def fmt(x, d=3):
    return "-" if x is None else f"{x:.{d}f}"


L = []
npos = sum(label.values())
L.append(f"**Generated items against the recipe declarations: {len(gen)} items, {npos} declare syncopation (positives), {len(gen) - npos} do not (negatives).**\n")
L.append("| method | TP | FP | FN | TN | no result | UNKNOWN | precision | recall | AUC |")
L.append("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |")
for m in METHODS:
    r = res["generated"][m]
    L.append(f"| {m} | {r['tp']} | {r['fp']} | {r['fn']} | {r['tn']} | {r['no_result']} | {r['unknown']} | {fmt(r['precision'])} | {fmt(r['recall'])} | {fmt(r['auc'])} |")

# ---- by generated family: negatives flagged, positives found (for a few methods)
def fam(i):
    return ".".join(i.split(".")[:2])


FAM_METHODS = ["current detector (page list)", "current detector, presence without off-beat attack / bass-then-held-chord",
               "SynPy LHL (texture)", "SynPy LHL (lines)", "SynPy SG (texture)", "AMADS WNBD (score file)", "AMADS span (lines onsets)"]
fams = defaultdict(lambda: {"items": 0, "declare": 0})
fm = {m: Counter() for m in FAM_METHODS}
for i in gen:
    f = fam(i)
    fams[f]["items"] += 1
    fams[f]["declare"] += label[i]
    for m in FAM_METHODS:
        pr = M[m].get(i, (None, None))[0]
        if pr is True:
            fm[m][f] += 1
L.append("\n**Generated families: items flagged present by each method (families with a declared positive or with at least 4 flagged items by any of the methods shown).**\n")
hdr = "| family | items | declare syncopation | " + " | ".join(m.replace("current detector", "cur").replace("presence without off-beat attack / bass-then-held-chord", "proper") for m in FAM_METHODS) + " |"
L.append(hdr)
L.append("| " + " | ".join(["---"] * (3 + len(FAM_METHODS))) + " |")
rows = []
for f, c in sorted(fams.items()):
    if c["declare"] or any(fm[m][f] >= 4 for m in FAM_METHODS):
        rows.append((f, c))
for f, c in rows:
    L.append(f"| {f} | {c['items']} | {c['declare']} | " + " | ".join(str(fm[m][f]) for m in FAM_METHODS) + " |")
res["families"] = {f: {"items": c["items"], "declare": c["declare"], **{m: fm[m][f] for m in FAM_METHODS}} for f, c in fams.items()}

# ---- real items: counts and agreement with the current detector
real = [i for i in cat if cat[i].get("file") and not i.startswith("exercise.")]
L.append(f"\n**Real items ({len(real)}: PDMX and representative, no recipe, no annotation): items flagged present, and agreement with the current detector's page-list presence (not a ground truth).**\n")
L.append("| method | measured | present | agree with current | current present & method absent | current absent & method present |")
L.append("| --- | --- | --- | --- | --- | --- |")
res["real"] = {}
for m in METHODS:
    n = pres = ag = ca = cb = 0
    for i in real:
        pr = M[m].get(i, (None, None))[0]
        c0 = M["current detector (page list)"].get(i, (None, None))[0]
        if pr in (None, "UNKNOWN") or c0 is None:
            continue
        n += 1
        pres += pr
        ag += (pr == c0)
        ca += (c0 and not pr)
        cb += ((not c0) and pr)
    res["real"][m] = {"measured": n, "present": pres, "agree": ag, "cur_only": ca, "method_only": cb}
    L.append(f"| {m} | {n} | {pres} | {ag} | {ca} | {cb} |")

# ---- per evidence type (the current detector is the only method that names the types)
TYPES = {"held over a stronger beat, beat level": ["beat-level held"], "held across the next beat from off the beat": ["held"],
         "held at the subdivision": ["held at the subdivision"], "off-beat attack": ["off-beat attack"],
         "accent on a weak position": ["accent"], "rest on a strong beat": ["rest"],
         "bass-then-held-chord": ["bass-then-held-chord"]}
TIED = ["beat-level held", "held", "held at the subdivision"]


def kinds_of(i):
    r = cur.get(i)
    if not r or "error" in r:
        return None
    ks = set()
    for h, c in r.get("kinds", {}).items():
        ks |= set(c)
    return ks


def klass(ks):
    if ks & set(TIED):
        return "tied (any of the three held kinds)"
    if "off-beat attack" in ks:
        return "no tied kind; off-beat attack"
    if "bass-then-held-chord" in ks:
        return "no tied kind or off-beat attack; bass-then-held-chord"
    if "rest" in ks:
        return "only rest"
    if "accent" in ks:
        return "only accent"
    return "no counted kind"


L.append("\n**Per evidence type, current detector (the only method here that separates the types): items with the kind, generated items (of 46 declared positives / 1,165 declared negatives) and real items.**\n")
L.append("| evidence type | generated items with it | of which declared positive | declared negative | real items with it |")
L.append("| --- | --- | --- | --- | --- |")
res["types"] = {}
for t, kk in TYPES.items():
    g = [i for i in gen if kinds_of(i) and kinds_of(i) & set(kk)]
    rl = [i for i in real if kinds_of(i) and kinds_of(i) & set(kk)]
    res["types"][t] = {"gen": len(g), "gen_pos": sum(label[i] for i in g), "gen_neg": sum(not label[i] for i in g), "real": len(rl)}
    L.append(f"| {t} | {len(g)} | {sum(label[i] for i in g)} | {sum(not label[i] for i in g)} | {len(rl)} |")
CLASSES = ["tied (any of the three held kinds)", "no tied kind; off-beat attack", "no tied kind or off-beat attack; bass-then-held-chord",
           "only rest", "only accent", "no counted kind"]
TOOLS = ["SynPy LHL (texture)", "SynPy LHL (lines)", "SynPy SG (texture)", "SynPy PRS (texture)", "AMADS WNBD (score file)",
         "AMADS WNBD (lines onsets)", "AMADS span (lines onsets)"]
for scope, items in (("generated", gen), ("real", real)):
    L.append(f"\n**The tools split by what the current detector found in the item ({scope} items): number of items in the class, declared positives among them, and how many each tool flags present. A tool that flags the classes other than 'tied' cannot tell tied syncopation from an accompaniment's off-beat chords or a rest.**\n")
    L.append("| class of item (by current detector's kinds) | items | declared positive | " + " | ".join(TOOLS) + " |")
    L.append("| " + " | ".join(["---"] * (3 + len(TOOLS))) + " |")
    res["class_" + scope] = {}
    for c in CLASSES:
        its = [i for i in items if kinds_of(i) is not None and klass(kinds_of(i)) == c]
        row = {"items": len(its), "declared_positive": sum(label.get(i, False) for i in its)}
        cells = []
        for t in TOOLS:
            ms = [i for i in its if M[t].get(i, (None, None))[0] not in (None, "UNKNOWN")]
            fl = sum(1 for i in ms if M[t][i][0])
            row[t] = [fl, len(ms)]
            cells.append(f"{fl}/{len(ms)}")
        res["class_" + scope][c] = row
        L.append(f"| {c} | {len(its)} | {row['declared_positive'] if scope == 'generated' else '-'} | " + " | ".join(cells) + " |")

# ---- named items
def mark(pr, exp):
    if pr is None:
        return "no result"
    if pr == "UNKNOWN":
        s = "UNKNOWN"
        return s + (" (right)" if exp == "UNKNOWN" else " (wrong)" if exp in ("present", "absent") else "")
    s = "present" if pr else "absent"
    if exp == "open":
        return s
    right = (exp == "present" and pr) or (exp == "absent" and not pr)
    return s + (" (right)" if right else " (wrong)")


NAMED_METHODS = ["current detector (page list)", "current detector, presence without off-beat attack / bass-then-held-chord",
                 "current detector with fix", "AMADS WNBD (score file)", "AMADS WNBD (lines onsets)", "AMADS span (lines onsets)"]
SYN_T = [f"SynPy {k} (texture)" for k in SYN]
SYN_L = [f"SynPy {k} (lines)" for k in SYN]
res["named"] = {}
tally = {m: Counter() for m in METHODS}
for n in named:
    iid = n["id"]
    res["named"][iid] = {"expected": n["expected"], "group": n["group"], "answers": {}}
    for m in METHODS:
        pr = M[m].get(iid, (None, None))[0]
        a = mark(pr, n["expected"])
        res["named"][iid]["answers"][m] = a
        if n["expected"] != "open":
            tally[m]["right" if a.endswith("(right)") else "wrong" if a.endswith("(wrong)") else "no result"] += 1
scored = [n for n in named if n["expected"] != "open"]
L.append(f"\n**Named items ({len(named)}; {len(scored)} with an expected answer, {len(named) - len(scored)} open). Expected answers: named_items.json. Right and wrong counts are over the {len(scored)}.**\n")
for title, cols in (("current detector and AMADS", NAMED_METHODS), ("SynPy on the texture (every onset of either hand)", SYN_T),
                    ("SynPy on the lines (right-hand top, left-hand bottom)", SYN_L)):
    L.append(f"\n*{title}*\n")
    L.append("| item | expected | " + " | ".join(c.replace("SynPy ", "").replace("current detector", "cur").replace("presence without off-beat attack / bass-then-held-chord", "proper") for c in cols) + " |")
    L.append("| " + " | ".join(["---"] * (2 + len(cols))) + " |")
    for n in named:
        L.append(f"| {n['id']} | {n['expected']} | " + " | ".join(res["named"][n["id"]]["answers"][c] for c in cols) + " |")
    L.append("| **right / wrong / no result** | | " + " | ".join(f"{tally[c]['right']} / {tally[c]['wrong']} / {tally[c]['no result']}" for c in cols) + " |")
res["named_tally"] = {m: dict(tally[m]) for m in METHODS}

# ---- runtime (full runs, worker processes on a shared machine)
import statistics


def stats(v):
    v = sorted(x for x in v if x is not None)
    if not v:
        return None
    return {"n": len(v), "median_s": statistics.median(v), "p90_s": v[int(0.9 * (len(v) - 1))], "max_s": v[-1]}


rt = {
    "current detector (read + analyse)": stats([r.get("secs") for r in cur.values() if "error" not in r]),
    "line extraction (read with the project's reader + lines)": stats([r.get("extract_secs") for r in syn.values()]),
    "SynPy 7 models x (texture + lines)": stats([r.get("secs") for r in syn.values()]),
    "AMADS WNBD on the score file (partitura load + measure)": stats([r.get("secs_score") for r in am.values()]),
    "AMADS WNBD on lines onsets (3 lines)": stats([r.get("secs_wnbd_lines") for r in am.values()]),
    "AMADS span on lines onsets": stats([r.get("secs_span") for r in am.values()]),
}
res["runtime_full_run"] = rt
L.append("\n**Runtime per piece in the full runs (seconds; worker processes on a shared machine, so an upper bound for one process):**\n")
L.append("| step | pieces | median | 90th percentile | max |")
L.append("| --- | --- | --- | --- | --- |")
for k, v in rt.items():
    if v:
        L.append(f"| {k} | {v['n']} | {v['median_s']:.3f} | {v['p90_s']:.3f} | {v['max_s']:.2f} |")
(H / "cat_metrics.json").write_text(json.dumps(res, indent=1), encoding="utf-8")
(H / "frag_cat.md").write_text("\n".join(L) + "\n", encoding="utf-8")
print("\n".join(L[:60]))
