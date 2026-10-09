"""prereq.hand-assignment: the current detector (staff rule + the four flags of area-1A rule 3, re-implemented from the page and
from evidence/1A/validation/r_format.py hand_flags) against piano_svsep's predicted staff, on:
  words     : hand truth from printed hand words (rule: hand.md section 3.1)
  generated : generated two-staff 'both' items, hand = staff by construction
  pdmx      : agreement only
  named     : the items the validation row names
Run with the main .venv, -X utf8, after svsep_run.py. Writes hand_ha_results.json."""
import json, re, collections
from hand_xml import *

HANDR = re.compile(r"^\s*[\(\[]?\s*(m\.\s?d\.|r\.\s?h\.|rh\b|mano destra|main droite|rechte hand)", re.I)
HANDL = re.compile(r"^\s*[\(\[]?\s*(m\.\s?s\.|m\.\s?g\.|l\.\s?h\.|lh\b|mano sinistra|main gauche|linke hand)", re.I)
lst = json.load(open(HERE / "hand_ha_list.json"))
words = json.load(open(HERE / "hand_words.json"))
sv = json.load(open(HERE / "svsep_out.json"))
cat = {i["id"]: i for i in json.load(open(CONTENT / "catalog.json", encoding="utf-8"))}
EPS = 1e-4


def flags(notes, hand_words_rows):
    """The four flags (+ one-staff-both) of area-1A rule 3: sets of bar indexes (0-based, per part)."""
    fl = collections.defaultdict(set)
    byv = collections.defaultdict(lambda: collections.defaultdict(list))
    for n in notes:
        if n["grace"]:
            continue
        byv[(n["part"], n["measure"], n["voice"])][n["staff"]].append(n)
    for (p, m, v), st in byv.items():
        a, b = st.get(1, []), st.get(2, [])
        if not a or not b:
            continue
        ov = any(x["onset"] < y["onset"] + y["dur"] - EPS and y["onset"] < x["onset"] + x["dur"] - EPS for x in a for y in b)
        fl["collision" if ov else "cross_staff"].add((p, m))
    for w in hand_words_rows:
        fl["hand_words"].add((w["part"], w["bar_index"]))
    g = collections.defaultdict(list)
    for n in notes:
        if not n["grace"] and not n["tie_stop"]:
            g[(n["part"], n["staff"], n["onset"])].append(n)
    for (p, s, t), ns in g.items():
        if max(x["midi"] for x in ns) - min(x["midi"] for x in ns) > 16:
            fl["reach"].add((p, ns[0]["measure"]))
    return fl


def word_truth(notes, rows):
    """note index -> 'R'/'L' from the printed words. Rule: a word applies to the notes of its part and staff in its bar from its
    onset to the next hand word on that part+staff in that bar, else to the bar's end. Two words at one onset on one staff: skipped."""
    truth, skipped = {}, 0
    key = collections.defaultdict(list)
    for w in rows:
        key[(w["part"], w["staff"], w["bar_index"])].append(w)
    for (p, s, m), ws in key.items():
        ws = sorted(ws, key=lambda w: w["onset_q"])
        onsets = [w["onset_q"] for w in ws]
        for j, w in enumerate(ws):
            if onsets.count(w["onset_q"]) > 1:
                skipped += 1
                continue
            h = "R" if HANDR.match(w["text"]) else "L" if HANDL.match(w["text"]) else None
            if h is None:
                continue
            end = ws[j + 1]["onset_q"] if j + 1 < len(ws) else 1e9
            for i, n in enumerate(notes):
                if n["part"] == p and n["staff"] == s and n["measure"] == m and not n["grace"] and not n["tie_stop"] \
                        and w["onset_q"] - EPS <= n["onset"] < end - EPS:
                    truth[i] = h
    return truth, skipped


res = {}
for it in lst["list"]:
    k, grp = it["id"], it["group"]
    notes, npart, st = read_notes(CONTENT / it["file"])
    assign_hand(notes, npart, st, cat[k].get("hands"))
    out = {"group": grp, "n_notes": sum(1 for n in notes if not n["grace"] and not n["tie_stop"])}
    s = sv.get(k, {})
    out["svsep_t"] = s.get("t")
    if "error" in s:
        out["svsep_error"] = s["error"]
        res[k] = out
        continue
    # map svsep rows onto my notes: both lists sorted by (onset, pitch); partitura counts a pickup measure's onsets from a
    # negative time and splits ties at barlines, so rows are aligned by the pitch sequence (difflib), not by onset
    import difflib
    mine_idx = sorted((i for i, n in enumerate(notes) if not n["grace"] and not n["tie_stop"]), key=lambda i: (notes[i]["onset"], notes[i]["midi"]))
    their = sorted(s["notes"], key=lambda r: (r[0], r[1]))
    sm = difflib.SequenceMatcher(None, [notes[i]["midi"] for i in mine_idx], [r[1] for r in their], autojunk=False)
    pred = {}
    matched_rows = 0
    for blk in sm.get_matching_blocks():
        for d in range(blk.size):
            pred[mine_idx[blk.a + d]] = their[blk.b + d][2]
            matched_rows += 1
    unmatched = len(their) - matched_rows
    idx = {None: [mine_idx[j] for j in range(len(mine_idx)) if mine_idx[j] not in pred]}
    out["unmatched_svsep_rows"] = unmatched
    out["unpredicted_notes"] = len(idx[None])
    # svsep hand: predicted staff 1 -> R, 2 -> L (the project's rule for a two-staff part)
    sv_hand = {i: ("R" if ps == 1 else "L") for i, ps in pred.items()}
    cur_hand = {i: n["hand"] for i, n in enumerate(notes)}
    twostaff = (npart == 1 and st[0] >= 2) or (npart >= 2)
    out["twostaff"] = twostaff
    both = [i for i in sv_hand]
    out["agree_svsep_staffrule"] = sum(1 for i in both if sv_hand[i] == cur_hand[i])
    out["n_compared"] = len(both)
    import time as _t
    _t0 = _t.perf_counter()
    fl = flags(notes, words.get(k, []))
    out['t_flags'] = round(_t.perf_counter() - _t0, 4)
    out["flags"] = {a: sorted(b) for a, b in fl.items()}
    flagged_bars = set().union(*fl.values()) if fl else set()
    # bars where svsep and written staff differ
    dis_bars = collections.Counter((notes[i]["part"], notes[i]["measure"]) for i in both if sv_hand[i] != cur_hand[i])
    out["disagree_bars"] = {f"{p}:{m}": c for (p, m), c in sorted(dis_bars.items())}
    out["disagree_in_flagged_bars"] = sum(c for (p, m), c in dis_bars.items() if (p, m) in flagged_bars)
    out["disagree_total"] = sum(dis_bars.values())
    if k in words:
        tr, skipped = word_truth(notes, words[k])
        out["word_truth_skipped_words"] = skipped
        rows = []
        for i, h in tr.items():
            rows.append({"i": i, "bar": notes[i]["measure"], "staff": notes[i]["staff"], "truth": h, "staffrule": cur_hand[i],
                         "svsep": sv_hand.get(i), "flagged": (notes[i]["part"], notes[i]["measure"]) in fl.get("hand_words", set())})
        out["truth_notes"] = rows
    res[k] = out
json.dump(res, open(HERE / "hand_ha_results.json", "w"), indent=0)
print("done", len(res))
