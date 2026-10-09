"""Position classes and position shifts: the current detector (area-1B frames.py), the current detector with the fixes
(hand_fix.py), and pianoplayer's fingering read through hand_def.py, each against the fingering-derived truth
(hand_def.py applied to the printed / recipe fingering). Run with the main checkout's .venv, -X utf8.
Writes hand_pos_results.json (per item and hand)."""
import json, sys, time, warnings, bisect, collections
from pathlib import Path
warnings.simplefilter("ignore")
from hand_xml import *
import hand_def as D
import hand_fix as FX
sys.path.insert(0, str(WT / "tools/classifier"))
import score as S
from rules.texture import view
import frames as FR

PP = WT / "build/ppout"
import os
WW = int(os.environ.get("HAND_W", D.W))


def fingered(evs):
    """-> (list of [(pitch, finger)], list of full indexes)"""
    out, idx = [], []
    for i, ev in enumerate(evs):
        pf = [(n["midi"], digit(n)) for n in ev if digit(n) is not None]
        if pf:
            out.append(pf)
            idx.append(i)
    return out, idx


def seg_from_fingering(evs, hand):
    """Segments and boundaries of one hand from the fingering on the note events (hand_def). Indexes are full event indexes."""
    fe, idx = fingered(evs)
    if not fe:
        return None
    segs = D.segments(fe, hand, w=WW)
    bds = D.boundaries(fe, segs, hand)
    S_ = [{"first": idx[s["first"]], "last": idx[s["last"]], "R": s["R"], "cls": s["cls"]} for s in segs]
    B_ = [(idx[b], k) for b, k in bds]
    return {"segs": S_, "bounds": B_, "n_fingered_events": len(fe), "n_events": len(evs)}


def onset_index(evs):
    on = [ev[0]["onset"] for ev in evs]

    def at(t):
        j = bisect.bisect_left(on, t - 1e-3)
        if j >= len(on):
            return len(on) - 1
        if j > 0 and abs(on[j - 1] - t) < abs(on[j] - t):
            return j - 1
        return j
    return at


def det_frames(v_evs, evs, mode):
    """Detector frames as dicts {first, last (full idx), cls, kinds of boundaries}"""
    at = onset_index(evs)
    if mode == "current":
        fr = FR.frames(v_evs)
        ch = FR.changes(v_evs, fr)
    elif mode == "fixed":
        fr = FX.frames_f3(v_evs)
        ch = FX.changes_fixed(v_evs, fr)
    elif mode in ("f1", "f2"):
        fr = FR.frames(v_evs)
        ch = FX.changes_fixed(v_evs, fr, f1=(mode == "f1"), f2=(mode == "f2"))
    out =[{"first": at(v_evs[f["first"]].onset), "last": at(v_evs[f["last"]].onset), "cls": f["cls"]} for f in fr]
    bounds = [(at(v_evs[q["first"]].onset), c["kind"]) for q, c in zip(fr[1:], ch)]
    return out, bounds


def class_agreement(truth_segs, frames_):
    """For each truth segment: class of the frame holding most of its events (event overlap), compared to the truth class."""
    rows = []
    for s in truth_segs:
        best, bo = None, -1
        for f in frames_:
            o = min(s["last"], f["last"]) - max(s["first"], f["first"]) + 1
            if o > bo:
                bo, best = o, f
        rows.append((s["cls"], best["cls"] if best else None))
    return rows


def prf_counts(truth_b, pred_b, tol=1):
    t = [b for b, _ in truth_b]
    p = [b for b, _ in pred_b]
    pairs = D.match(t, p, tol)
    kinds = {b: k for b, k in truth_b}
    pk = {b: k for b, k in pred_b}
    kc = collections.Counter((kinds[a], pk[b]) for a, b in pairs)
    return {"truth": len(t), "pred": len(p), "matched": len(pairs), "kinds": {f"{a}>{b}": n for (a, b), n in kc.items()}}


def run(items, label, with_pp=True):
    res = {}
    for it in items:
        k = it["id"]
        cat_item = {"id": k, "file": it["file"], "hands": it.get("hands")}
        notes, np_, st = read_notes(CONTENT / it["file"])
        assign_hand(notes, np_, st, it.get("hands"))
        r = {"hands": {}}
        t0 = time.perf_counter()
        try:
            sc = S.load(cat_item, CONTENT)
            v = view(sc)
            if v.unknown:
                r["detector_unknown"] = v.unknown
                v = None
        except Exception as e:
            r["detector_error"] = f"{type(e).__name__}: {str(e)[:120]}"
            v = None
        r["t_load_view"] = round(time.perf_counter() - t0, 3)
        ppn = None
        if with_pp and (PP / (k + ".xml")).exists():
            try:
                ppn, a, b = read_notes(PP / (k + ".xml"))
                assign_hand(ppn, a, b, it.get("hands"))
            except Exception as e:
                r["pp_read_error"] = f"{type(e).__name__}: {str(e)[:120]}"
        for h in it.get("eligible") or ["R", "L"]:
            evs = events(notes, h)
            if not evs:
                continue
            hr = {"n_events": len(evs), "sizes": [len(e) for e in evs], "lows": [e[0]["midi"] for e in evs], "bars": [e[0]["measure"] for e in evs]}
            tr = seg_from_fingering(evs, h) if it.get("eligible") else None
            if tr:
                hr["truth"] = tr
            for mode in ("current", "fixed", "f1", "f2"):
                if v is not None and h in v.hands:
                    t1 = time.perf_counter()
                    fr, bd = det_frames(v.hands[h], evs, mode)
                    hr[mode] = {"frames": fr, "bounds": bd, "t": round(time.perf_counter() - t1, 4)}
            if ppn is not None:
                pevs = events(ppn, h)
                if len(pevs) == len(evs):
                    pr = seg_from_fingering(pevs, h)
                    if pr:
                        hr["pp"] = pr
                        hr["pp"]["match_digits"] = sum(1 for e1, e2 in zip(evs, pevs) for n1, n2 in zip(e1, e2)
                                                       if digit(n1) is not None and digit(n1) == digit(n2))
                        hr["pp"]["printed_digits"] = sum(1 for e1 in evs for n1 in e1 if digit(n1) is not None)
                else:
                    hr["pp_note"] = f"event count differs: {len(pevs)} vs {len(evs)}"
            r["hands"][h] = hr
        res[k] = r
    return res


if __name__ == "__main__":
    man = json.load(open(HERE / "hand_manifest.json"))
    which = sys.argv[1]
    items = man[which]
    if which == "named":
        items = [i for i in items]
    out = run(items, which)
    json.dump(out, open(HERE / (f"hand_pos_{which}.json" if WW == D.W else f"hand_pos_{which}_W{WW}.json"), "w"), indent=0)
    print("done", which, len(out))
