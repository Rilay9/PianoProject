"""Metrics on our catalogue from cat_keys_results.json, cat_kc_results.json (and augnet_cat.json when it exists).
Writes cat_metrics.json and frag_cat_tonic.md, frag_cat_kc.md, frag_cat_time.md for build_key.py.

tonic-mode : exact tonic + mode against t_keys.py's reference (generated: the recipe's keySig; real: the title's key, six
             titles corrected); errors split as in wir_metrics.py; abstain = no key; no result = the project's score reader
             raised (score.py line 109) so the current detector could not run on the item.
key.change : for each named item, whether each expected area is found (an area of at least 4 bars in the same key with at
             least half of the expected area's bars inside it) and, for the current detector, confirmed by a cadence
             (first version: any cadence; corrected: after the home-dominant exclusion). The other tools have no cadence
             step, so only "found" is reported for them.
"""
from cmp_common import *
import collections, statistics
from wir_metrics import GLOBAL, tup, stats

METHODS = GLOBAL


def augnet_cat():
    p = HERE / "augnet_cat_raw.json"
    return json.load(open(p)) if p.exists() else {}


def load_keys():
    res = json.load(open(HERE / "cat_keys_results.json"))
    aug = augnet_cat()
    for r in res:
        a = aug.get(r["id"])
        if a and "error" not in a:
            r["g"]["augnet_first"], r["g"]["augnet_mode"] = a["first"], a["mode"]
            r["sec"]["augnet"] = a["seconds"]
        elif a:
            r["err"]["augnet"] = a["error"]
    return res


def tonic_rows(res, flt, methods=METHODS, restrict=None):
    rows = []
    for m, label in methods:
        c = collections.Counter()
        n = 0
        for r in res:
            if not flt(r) or (restrict is not None and r["id"] not in restrict):
                continue
            if m.startswith("augnet"):
                if m not in r["g"]:
                    continue
            n += 1
            if "piece" in r["err"] and m.startswith("cur"):
                c["no result"] += 1
                continue
            if m not in r["g"]:
                c["no result"] += 1
                continue
            c[relation((r["ref"][0], r["ref"][1]), tup(r["g"][m]))] += 1
        if n:
            rows.append((m, label, n, c))
    return rows


def md_rows(rows):
    out = ["| method | items | exact | exact of those it ran on | relative | parallel | fifth | other | abstain | no result |", "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |"]
    for m, label, n, c in rows:
        ran = n - c["no result"]
        out.append(f"| {label} | {n} | {c['exact']} ({100 * c['exact'] / n:.1f}%) | {100 * c['exact'] / ran:.1f}% | {c['relative']} | {c['parallel']} | {c['fifth']} | {c['other']} | {c['abstain']} | {c['no result']} |")
    return "\n".join(out)


def inside(area, exp):
    """Number of the area's bars that lie inside an expected area of the same key."""
    if tuple(area["key"]) != tuple(exp["key"]):
        return 0
    lo, hi = max(area["bars"][0], exp["bars"][0]), min(area["bars"][1], exp["bars"][1])
    return max(0, hi - lo + 1)


def found(areas, exp):
    """An expected area is found when at least half of its bars lie inside detected areas of the same key (their union)."""
    bars = set()
    for a in areas:
        if tuple(a["key"]) == tuple(exp["key"]):
            bars |= set(range(a["bars"][0], a["bars"][1] + 1))
    want = set(range(exp["bars"][0], exp["bars"][1] + 1))
    return len(bars & want) >= len(want) / 2


def in_annotation(area, exps):
    """A detected area matches the annotation when at least half of its bars lie inside one expected area of its key."""
    n = area["bars"][1] - area["bars"][0] + 1
    return any(inside(area, e) >= n / 2 for e in exps)


def kc_section(cat, aug):
    lines = []
    out = {}
    toolnames = [("cur", "current detector (areas; confirmed)"), ("cur_win", "current raw windows"), ("m21_float", "music21 floatingKey"), ("m21_win_BB", "music21 windows Bellman-Budge"), ("m21_win_AE", "music21 windows Aarden-Essen"), ("augnet", "AugmentedNet")]
    inv = [r for r in cat if "invention" in r["id"]]
    # ---- Inventions: any area in the relation dominant or relative; confirmed
    t = collections.defaultdict(lambda: collections.Counter())
    rowsI = []
    for r in inv:
        row = {"id": r["id"].replace("song.classical.bach-", "").replace(".pdmx", ""), "home": r["home_reference"]}
        # current
        if r.get("cur_areas") is not None:
            ar = [a for a in r["cur_areas"] if a["relation"] in ("dominant", "relative")]
            row["cur_found"] = bool(ar)
            row["cur_first"] = any(a["first_version"] for a in ar)
            row["cur_corr"] = any(a["corrected"] for a in ar)
            row["cur_any_confirmed_first"] = any(a["first_version"] for a in r["cur_areas"])
        else:
            row["cur_found"] = row["cur_first"] = row["cur_corr"] = None
        for k, v in r["tool_areas"].items():
            if k == "cur_win":
                continue
            row[k] = any(a["relation"] in ("dominant", "relative") for a in v)
        a = aug.get(r["id"])
        if a and "error" not in a and r.get("home_reference"):
            ser = series_from_aug(a, r)
            row["augnet"] = any(x["relation"] in ("dominant", "relative") for x in areas_of(ser, r["home_reference"]))
        rowsI.append(row)
    cnt = collections.Counter()
    for row in rowsI:
        for k, v in row.items():
            if k in ("id", "home"):
                continue
            if v is None:
                cnt[(k, "n/a")] += 1
            else:
                cnt[(k, "yes" if v else "no")] += 1
    out["inventions"] = rowsI
    lines.append("**Bach Inventions (expected: an area of 4+ bars on the dominant or the relative key; source: reading, the standard analysis).** Number of the 15 Inventions with such an area, by tool; `n/a` = the tool could not run on the item (the project's reader raises on No. 1).\n")
    lines.append("| tool / step | found | not found | n/a |")
    lines.append("| --- | --- | --- | --- |")
    names = [("cur_found", "current: area found"), ("cur_first", "current: area confirmed by a cadence (first version)"), ("cur_corr", "current: area confirmed (corrected exclusion)"),
             ("m21_float", "music21 floatingKey: area found"), ("m21_win_BB", "music21 windows Bellman-Budge: area found"), ("m21_win_AE", "music21 windows Aarden-Essen: area found"),
             ("augnet", "AugmentedNet: area found")]
    for k, label in names:
        if any(k in row for row in rowsI):
            lines.append(f"| {label} | {cnt[(k, 'yes')]} | {cnt[(k, 'no')]} | {cnt[(k, 'n/a')]} |")
    lines.append("")
    un = sum(1 for row in rowsI if row.get("cur_found") or row.get("augnet"))
    lines.append(f"Union of the current detector's areas and AugmentedNet's (an area in the expected relation from either): {un} of 15.\n")
    lines.append("Per Invention (`yes` = an area of 4+ bars on the dominant or relative key; for the columns `cur first` and `cur corr` it must also be confirmed by a cadence; `-` none; `n/a` the tool could not run): current found / first / corrected, then music21 floatingKey, BB, AE" + (", AugmentedNet" if any("augnet" in row for row in rowsI) else "") + ".\n")
    hdr = "| Invention | home | cur found | cur first | cur corr | m21 float | m21 BB | m21 AE |" + (" augnet |" if any("augnet" in row for row in rowsI) else "")
    lines.append(hdr)
    lines.append("| " + " | ".join(["---"] * (hdr.count("|") - 1)) + " |")
    f = lambda v: "n/a" if v is None else ("yes" if v else "-")
    for row in rowsI:
        h = f"{NAMES[row['home'][0]]} {row['home'][1]}" if row["home"] else "?"
        cells = [row["id"], h, f(row.get("cur_found")), f(row.get("cur_first")), f(row.get("cur_corr")), f(row.get("m21_float")), f(row.get("m21_win_BB")), f(row.get("m21_win_AE"))]
        if any("augnet" in x for x in rowsI):
            cells.append(f(row.get("augnet")) if "augnet" in row else "n/a")
        lines.append("| " + " | ".join(cells) + " |")
    lines.append("")
    # ---- K545, WTC1: annotated areas
    for r in cat:
        if "k545" not in r["id"] and "wtc1" not in r["id"]:
            continue
        exp = r["expected_areas"]
        lines.append(f"**{r['id']}** (expected areas from the When in Rome annotation; global key {key_str(tuple(r['truth_global']))}; catalogue score {r.get('bars_sc')} bars, annotation {r['wir_bars']} bars"
                     + ("" if r.get("bars_sc") == r["wir_bars"] else "; **bar counts differ, bars compared by index**") + "). 0-based bars.\n")
        tn = [n for _, n in toolnames if n != "current raw windows" and (n != "AugmentedNet" or aug)]
        lines.append("| expected area | relation | " + " | ".join(tn) + " |")
        lines.append("| --- | --- | " + " | ".join("---" for _ in tn) + " |")
        sers = {}
        for k in ("m21_float", "m21_win_BB", "m21_win_AE"):
            sers[k] = r["tool_areas"].get(k, [])
        a = aug.get(r["id"])
        augareas = None
        if a and "error" not in a:
            augareas = areas_of(series_from_aug(a, r), r["home_reference"])
        for e in exp:
            e = dict(e)
            cells = []
            cur = r.get("cur_areas")
            if cur is None:
                cells.append("n/a")
            elif not found(cur, e):
                cells.append("not found")
            else:
                m = [x for x in cur if inside(x, e)]
                cells.append("found; confirmed (first version: %s, corrected: %s)" % ("yes" if any(x["first_version"] for x in m) else "no", "yes" if any(x["corrected"] for x in m) else "no"))
            for k in ("m21_float", "m21_win_BB", "m21_win_AE"):
                cells.append("found" if found(sers[k], e) else "not found")
            if aug:
                cells.append("n/a" if augareas is None else ("found" if found(augareas, e) else "not found"))
            lines.append(f"| {NAMES[e['key'][0]]} {e['key'][1]} bars {e['bars'][0]}-{e['bars'][1]} | {e['relation']} | " + " | ".join(cells) + " |")
        extra = {}
        cur = r.get("cur_areas") or []
        extra["current areas not in the annotation"] = [(x["bars"], key_str(tuple(x["key"])), "confirmed" if x["first_version"] else "unconfirmed") for x in cur if not in_annotation(x, exp)]
        for k in sers:
            extra[k + " areas not in the annotation"] = [(x["bars"], key_str(tuple(x["key"]))) for x in sers[k] if not in_annotation(x, exp)]
        if augareas is not None:
            extra["augnet areas not in the annotation"] = [(x["bars"], key_str(tuple(x["key"]))) for x in augareas if not in_annotation(x, exp)]
        lines.append("")
        for k, v in extra.items():
            lines.append(f"- {k}: {v if v else 'none'}")
        lines.append("")
        out[r["id"]] = {"expected": exp, "extra": extra}
    # ---- Happy Birthday
    for r in cat:
        if "happy-birthday" not in r["id"]:
            continue
        lines.append(f"**{r['id']}** (expected: no modulation; source: reading. Home C major).\n")
        cur = r.get("cur_areas") or []
        lines.append(f"- current detector areas: " + (", ".join(f"{key_str(tuple(x['key']))} bars {x['bars'][0]}-{x['bars'][1]} (first version: {'confirmed' if x['first_version'] else 'no cadence'}; corrected: {'confirmed' if x['corrected'] else 'not confirmed'})" for x in cur) or "none"))
        for k, v in r["tool_areas"].items():
            if k != "cur_win":
                lines.append(f"- {k}: " + (", ".join(f"{key_str(tuple(x['key']))} bars {x['bars'][0]}-{x['bars'][1]}" for x in v) or "no area"))
        a = aug.get(r["id"])
        if a and "error" not in a:
            lines.append("- augnet: " + (", ".join(f"{key_str(tuple(x['key']))} bars {x['bars'][0]}-{x['bars'][1]}" for x in areas_of(series_from_aug(a, r), r["home_reference"])) or "no area"))
        lines.append("")
    return "\n".join(lines), out


def series_from_aug(a, r):
    """AugmentedNet's key per music21 measure index of the catalogue score (measure numbers 1.. or 0.. from the file)."""
    by = a["by_number"]
    nums = sorted(int(k) for k in by)
    ser = []
    for i in range(r["bars_m21"]):
        # the catalogue file's measure numbers: pickups are number 0, so index i has number i or i+1; use the order of numbers
        ser.append(by[str(nums[i])] if i < len(nums) else None)
    return ser


def areas_of(series, home, L=4):
    import cat_kc
    return cat_kc.areas_from_series(series, home, L)


if __name__ == "__main__":
    res = load_keys()
    aug = augnet_cat()
    out = {}
    frag = []
    gen = lambda r: r["p"] == "generated"
    real = lambda r: r["p"] != "generated"
    for name, flt in (("generated (recipe key)", gen), ("real with a key in the title", real)):
        rows = tonic_rows(res, flt)
        frag.append(f"**{name}: {sum(1 for r in res if flt(r))} items.**\n\n" + md_rows(rows) + "\n")
        out[name] = [{"method": m, "items": n, **dict(c)} for m, _, n, c in rows]
    if aug:
        ids = set(aug)
        for name, flt in (("generated sample (every 8th)", gen), ("real (all with a title key)", real)):
            rows = tonic_rows(res, flt, restrict=ids)
            frag.append(f"**AugmentedNet comparison set, {name}: {sum(1 for r in res if flt(r) and r['id'] in ids)} items (all methods on the same items).**\n\n" + md_rows(rows) + "\n")
            out["augnet set " + name] = [{"method": m, "items": n, **dict(c)} for m, _, n, c in rows]
    # witness on catalogue
    for name, flt in (("generated", gen), ("real", real)):
        w = collections.Counter()
        for r in res:
            if not flt(r) or "piece" in r["err"] or r["g"].get("cur_corr") is None and r["g"].get("m21_BB") is None:
                continue
            ref = (r["ref"][0], r["ref"][1])
            a, b = tup(r["g"]["cur_corr"]), tup(r["g"]["m21_BB"])
            w[("agree" if a is not None and a == b else "disagree", "right" if a == ref else "wrong")] += 1
        w3 = collections.Counter()
        for r in res:
            if not flt(r) or "piece" in r["err"] or r["g"].get("cur_corr") is None:
                continue
            ref = (r["ref"][0], r["ref"][1])
            a = tup(r["g"]["cur_corr"])
            ok = a == tup(r["g"]["m21_BB"]) == tup(r["g"]["m21_TKP"])
            w3[("agree3" if ok else "not3", "right" if a == ref else "wrong")] += 1
        out["witness3 " + name] = {f"{k[0]}/{k[1]}": v for k, v in w3.items()}
        frag.append(f"**Three witnesses, {name} items (corrected current answer, Bellman-Budge and Temperley-Kostka-Payne all equal).** all three agree and right {w3[('agree3', 'right')]}, agree and wrong {w3[('agree3', 'wrong')]}; not all equal: right {w3[('not3', 'right')]}, wrong {w3[('not3', 'wrong')]} (UNKNOWN answers are not counted here).\n")
        out["witness " + name] = {f"{k[0]}/{k[1]}": v for k, v in w.items()}
        frag.append(f"**Second witness, {name} items the current detector ran on (corrected current answer against music21 Bellman-Budge).** agree-right {w[('agree', 'right')]}, agree-wrong {w[('agree', 'wrong')]}, disagree-right {w[('disagree', 'right')]}, disagree-wrong {w[('disagree', 'wrong')]}. "
                    f"Disagreement flags {w[('disagree', 'wrong')]} of {w[('agree', 'wrong')] + w[('disagree', 'wrong')]} wrong answers and sends {w[('disagree', 'right')]} right ones to the agent.\n")
    # silent errors: the corrected or first answer is wrong and the second witness agrees with it
    for tag, cur in (("corrected", "cur_corr"), ("first version", "cur_first")):
        silent = []
        for r in res:
            if "piece" in r["err"] or r["p"] == "generated":
                continue
            ref = (r["ref"][0], r["ref"][1])
            a = tup(r["g"].get(cur))
            if a is not None and a != ref and a == tup(r["g"]["m21_BB"]):
                silent.append(r)
        frag.append(f"**Real items where the {tag} current answer is wrong and Bellman-Budge gives the same wrong key ({len(silent)}).** Answers: current / BB / TKP / AE / AugmentedNet first key; reference.\n\n"
                    + "\n".join(f"- {r['id']}: {key_str(tup(r['g'][cur]))} / {key_str(tup(r['g']['m21_BB']))} / {key_str(tup(r['g']['m21_TKP']))} / {key_str(tup(r['g']['m21_AE']))} / "
                                + (key_str(tup(r['g']['augnet_first'])) if 'augnet_first' in r['g'] else 'not run') + f"; reference {key_str((r['ref'][0], r['ref'][1]))} ({r['ref'][2]})" for r in silent) + "\n")
    # a witness set of four: current (first version) and the three profiles BB, TKP, AugmentedNet first key, on the AugmentedNet set
    w4 = collections.Counter()
    for r in res:
        if "piece" in r["err"] or "augnet_first" not in r["g"] or r["g"].get("cur_first") is None:
            continue
        ref = (r["ref"][0], r["ref"][1])
        a = tup(r["g"]["cur_first"])
        ok = a == tup(r["g"]["m21_BB"]) == tup(r["g"]["augnet_first"])
        w4[(r["p"] == "generated", "agree" if ok else "not", "right" if a == ref else "wrong")] += 1
    if w4:
        frag.append("**Witness rule: first-version current answer equal to Bellman-Budge and to AugmentedNet's first key (items AugmentedNet ran on; UNKNOWN current answers left out).** "
                    + "; ".join(f"{'generated sample' if g else 'real'}: all equal and right {w4[(g, 'agree', 'right')]}, all equal and wrong {w4[(g, 'agree', 'wrong')]}, not all equal: right {w4[(g, 'not', 'right')]}, wrong {w4[(g, 'not', 'wrong')]}" for g in (True, False)) + ".\n")
        out["witness4"] = {str(k): v for k, v in w4.items()}
    # generated families where the corrected current answer is wrong
    fam = collections.defaultdict(lambda: [0, 0, 0, 0])
    for r in res:
        if gen(r) and "piece" not in r["err"]:
            f = fam[r["fam"]]
            f[0] += 1
            f[1] += tup(r["g"]["cur_corr"]) != (r["ref"][0], r["ref"][1])
            f[2] += tup(r["g"]["m21_BB"]) != (r["ref"][0], r["ref"][1])
            f[3] += tup(r["g"]["m21_AE"]) != (r["ref"][0], r["ref"][1])
    rows = ["| generator family | items | current corrected wrong (incl. UNKNOWN) | Bellman-Budge wrong | Aarden-Essen wrong |", "| --- | --- | --- | --- | --- |"]
    for k, v in sorted(fam.items(), key=lambda kv: -(kv[1][1] + kv[1][2])):
        if v[1] or v[2] or v[3]:
            rows.append(f"| {k} | {v[0]} | {v[1]} | {v[2]} | {v[3]} |")
    frag.append("**Generated families with at least one wrong answer by these three methods.**\n\n" + "\n".join(rows) + "\n")
    # named real items of validation row 5
    pats = ["chopin-ballade-3", "chopin-etude-op25-6", "chopin-etude-op-25-no-6", "k-1d", "k1d", "sonatina-in-g", "bach-menuet", "invention-no-12", "k-4", "hanon", "sonata-no-2"]
    rows = ["| item | reference | " + " | ".join(l for m, l in METHODS if m not in ("augnet_first", "augnet_mode")) + " |", "| --- | --- | " + " | ".join("---" for m, l in METHODS if m not in ("augnet_first", "augnet_mode")) + " |"]
    shown = 0
    for r in res:
        if r["p"] == "generated":
            continue
        if any(p in r["id"] for p in ("chopin-ballade", "chopin-etude-op-25", "chopin-etude-op25", "mozart-minuet", "sonatina", "bach-menuet", "invention-no-12", "hanon", "sonata-no-2")):
            cells = []
            for m, l in METHODS:
                if m.startswith("augnet"):
                    continue
                cells.append("no result" if m not in r["g"] else (key_str(tup(r["g"][m])) if r["g"][m] else "UNKNOWN"))
            rows.append(f"| {r['id']} | {key_str((r['ref'][0], r['ref'][1]))} ({r['ref'][2]}) | " + " | ".join(cells) + " |")
            shown += 1
    frag.append(f"**Real items named in validation row 5 and look-alikes (id patterns: Chopin ballades and Op. 25 etudes, Mozart minuets, sonatinas, Bach menuet, Invention 12, Hanon, Sonata No. 2): {shown} items with a title key.**\n\n" + "\n".join(rows) + "\n")
    open(HERE / "frag_cat_tonic.md", "w", encoding="utf-8").write("\n".join(frag))
    # key.change on named items
    cat = json.load(open(HERE / "cat_kc_results.json"))
    md, kcout = kc_section(cat, aug)
    open(HERE / "frag_cat_kc.md", "w", encoding="utf-8").write(md)
    out["kc"] = kcout
    # time
    keys = collections.defaultdict(list)
    for r in res:
        for k, v in r["sec"].items():
            keys[k].append(v)
    names = {"cur": "current detector: harmony analysis + first/corrected key + partitura K-S (after loading)", "m21_parse": "music21 parse", "m21_KS": "music21 K-S", "m21_AE": "music21 Aarden-Essen", "m21_BB": "music21 Bellman-Budge", "m21_TKP": "music21 Temperley-Kostka-Payne", "augnet": "AugmentedNet inference (excluding model load)"}
    lines = ["Seconds per item (mean / median / max). Measured on this machine, 12 worker processes at once; short items (median "
             f"{int(statistics.median(r['bars'] for r in res if 'bars' in r))} bars).\n", "| step | items | seconds per item: mean / median / max |", "| --- | --- | --- |"]
    for k, lab in names.items():
        if k in keys:
            lines.append(f"| {lab} | {len(keys[k])} | {stats(keys[k])} |")
    open(HERE / "frag_cat_time.md", "w", encoding="utf-8").write("\n".join(lines) + "\n")
    json.dump(out, open(HERE / "cat_metrics.json", "w"), indent=1, default=str)
    for f in ("frag_cat_tonic.md", "frag_cat_kc.md", "frag_cat_time.md"):
        print(open(HERE / f, encoding="utf-8").read())
