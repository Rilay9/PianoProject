"""The corrected rhythm.syncopation and rhythm.ties of docs/classifier/rules/area-1C.md (origin 485f2be2),
implemented as the page states them, for validation only (build, not committed).

Usage: python sync.py ID [ID ...]           -> per item JSON lines with events
       python sync.py --all                 -> sync_all.json (every item with a file)
"""
from __future__ import annotations
import json, sys, warnings
from collections import Counter, defaultdict
from fractions import Fraction as F
from multiprocessing import Pool
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import *  # noqa

TYPEQ = {"breve": F(8), "whole": F(4), "half": F(2), "quarter": F(1), "eighth": F(1, 2), "16th": F(1, 4),
         "32nd": F(1, 8), "64th": F(1, 16), "128th": F(1, 32)}
IMPULSIVE = {"sf", "sfz", "fz", "sffz", "rfz", "rf", "sfp", "sfzp"}
PAGE_IMPULSIVE = {"sf", "sfz", "fz"}


def hand_of(sc, item, pi, staff):
    if sc.parts == 1 and sc.staves <= 1:
        return "L" if item.get("hands") == "left" else "R"
    if sc.parts >= 2 and sc.staves <= 1:
        return "R" if pi == 0 else "L"
    return "R" if (staff or 1) == 1 else "L"


def analyse(iid, detail=False):
    import partitura.score as PS
    from rules import rhythm as R
    item = BYID[iid]
    sc = load(iid)
    out = {"id": iid, "kinds": defaultdict(Counter), "bars": defaultdict(set), "events": [], "ties": defaultdict(Counter),
           "tie_ev": [], "skipped_onsets": 0}
    if not len(sc.notes):
        out["unknown"] = "no notes"
        return out
    b = R.Bars(sc)
    starts = [fr(s) for s in sc.measure_starts]
    nb_ = len(starts)
    mnum = [m.number for m in sc.part_score.parts[0].measures]

    def bar_index(t):
        k = -1
        for j in range(nb_):
            if starts[j] <= t + EPS:
                k = j
            else:
                break
        return k

    def frame(m):
        if m not in b.metre:
            return None
        metre = b.metre[m]
        full = F(4 * metre[0], metre[1])
        if m in b.readable:
            return starts[m], metre
        if m == 0 and sc.pickup and nb_ > 1:
            return starts[1] - full, metre
        return None

    notes = {"R": [], "L": []}
    onsets_all = {"R": defaultdict(set), "L": defaultdict(set)}  # hand -> onset -> pitches (all notes, not line)
    dyn = []  # (time, hand or None, text)
    heads = []  # tie chain heads: (hand, o, end, pitch, links, startbar, endbar)
    for pi, part in enumerate(sc.part_score.parts):
        q = part.quarter_map
        for n in part.notes_tied:
            o = fr(q(n.start.t))
            e = fr(q(n.end_tied.t))
            if e <= o:
                continue
            h = hand_of(sc, item, pi, n.staff)
            sd = n.symbolic_duration or {}
            tup_long = (TYPEQ.get(sd.get("type"), F(0)) or F(-1)) if sd.get("actual_notes") else False
            acc = bool(set(getattr(n, "articulations", None) or []) & {"accent", "strong-accent"})
            notes[h].append([o, e, n.midi_pitch, tup_long, acc, n.staff, False])
            onsets_all[h][o].add(n.midi_pitch)
        for n in part.notes:
            if n.tie_prev is None and n.tie_next is not None:
                k = n; links = 0
                while k.tie_next is not None:
                    k = k.tie_next; links += 1
                o = fr(q(n.start.t)); e = fr(q(k.end.t))
                heads.append((hand_of(sc, item, pi, n.staff), o, e, n.midi_pitch, links))
        for d in part.iter_all(PS.ImpulsiveLoudnessDirection):
            txt = (d.text or "").strip().lower()
            st = getattr(d, "staff", None)
            dyn.append((fr(q(d.start.t)), hand_of(sc, item, pi, st) if st else None, txt))
    # impulsive dynamics attach to the hand's onsets at the same time
    for h in "RL":
        for x in notes[h]:
            for (t, dh, txt) in dyn:
                if t == x[0] and (dh is None or dh == h) and txt in PAGE_IMPULSIVE:
                    x[6] = txt
    out["dyn_count"] = len(dyn)
    out["dyn_texts"] = dict(Counter(t for _, _, t in dyn))

    def add(h, kind, m, o, p, extra=""):
        out["kinds"][h][kind] += 1
        out["bars"][kind].add(m)
        if detail:
            bs = frame(m)[0]
            out["events"].append((h, kind, m, mnum[m] if m < len(mnum) else None, str(o - bs), p, extra))

    line_events = {}
    line_keys = set()
    for h in "RL":
        by = defaultdict(list)
        for x in notes[h]:
            by[x[0]].append(x)
        line = []
        for o in sorted(by):
            pick = max(by[o], key=lambda x: x[2]) if h == "R" else min(by[o], key=lambda x: x[2])
            covered = any(x[0] < o - EPS and x[1] > o + EPS and ((x[2] > pick[2]) if h == "R" else (x[2] < pick[2]))
                          for x in notes[h])
            if not covered:
                line.append(pick)
        lon = {x[0] for x in line}
        line_keys |= {(h, x[0], x[2]) for x in line}
        last = line[-1][0] if line else None
        for (o, e, p, tup, acc, staff, dmark) in line:
            m = bar_index(o)
            fm = frame(m)
            if fm is None:
                out["skipped_onsets"] += 1
                continue
            bs, metre = fm
            bt, tt = metre
            B = beat_len(bt, tt)
            barlen = F(4 * bt, tt)
            div = B / 3 if is_compound(bt, tt) else B / 2
            if tup and tup >= B:
                continue
            pos = o - bs
            k = pos // B
            into = pos - k * B
            kind = None
            if into <= EPS:
                w = weight(pos, bt, tt)
                if w < 1:
                    qq = pos + B
                    while qq < barlen and weight(qq, bt, tt) <= w:
                        qq += B
                    at = bs + qq
                    if at not in lon and e > at + EPS:
                        kind = "beat-level held"
                wn = weight(pos + B, bt, tt) if pos + B < barlen else F(1)
                if (acc or dmark) and w < wn:
                    add(h, "accent", m, o, p, "dyn " + dmark if dmark else "acc")
            else:
                nb = bs + (k + 1) * B
                if nb not in lon and e > nb + EPS:
                    kind = "held"
                elif nb not in lon and o != last and e <= nb + EPS:
                    bstart = bs + k * B
                    isolated = not any(bstart - EPS <= x < o - EPS or o + EPS < x < nb - EPS for x in lon)
                    kind = "off-beat attack" if isolated else "silent beat after a run"
                elif into % div > EPS and tup is False:
                    nd = bs + k * B + (into // div + 1) * div
                    if nd < nb - EPS and nd not in lon and e > nd + EPS:
                        kind = "held at the subdivision"
                if acc or dmark:
                    add(h, "accent", m, o, p, "dyn " + dmark if dmark else "acc")
            if kind in ("beat-level held", "held"):
                here = onsets_all[h].get(o, set())
                prev = [x for x in onsets_all[h] if x < o]
                pv = max(prev) if prev else None
                if len(here) >= 2 and pv is not None and o - pv == B and len(onsets_all[h][pv]) == 1:
                    kind_b = "bass-then-held-chord"
                    line_events[(h, o, p)] = kind_b
                    add(h, kind_b, m, o, p, kind)
                    continue
            if kind:
                line_events[(h, o, p)] = kind
                add(h, kind, m, o, p, f"{float(e - o):.3g}q")
    # rest kind on the whole texture
    all_iv = [(x[0], x[1]) for h in "RL" for x in notes[h]]
    all_on = sorted({x[0] for h in "RL" for x in notes[h]})
    for m in sorted(b.readable):
        bt, tt = b.metre[m]
        B = beat_len(bt, tt)
        nbeats = int(F(4 * bt, tt) / B)
        for k in range(nbeats):
            if weight(k * B, bt, tt) < F(1, 2):
                continue
            s = starts[m] + k * B
            if any(o <= s + EPS and e > s + EPS for o, e in all_iv):
                continue
            before = any(o < s - EPS and e > s - B + EPS for o, e in all_iv)
            entry = any(s + EPS < o < s + B - EPS for o in all_on)
            if before and entry:
                out["kinds"]["all"]["rest"] += 1
                out["bars"]["rest"].add(m)
                if detail:
                    out["events"].append(("all", "rest", m, mnum[m], str(k * B), None, ""))
    # ties
    for (h, o, e, p, links) in heads:
        m = bar_index(o); me = bar_index(e - EPS)
        t = out["ties"][h]
        t["chains"] += 1; t["links"] += links
        t["across-bar" if me > m else "within-bar"] += 1
        kind = line_events.get((h, o, p))
        on_line = (h, o, p) in line_keys
        if not on_line:
            t["inner chains"] += 1
            fm = frame(m) if m >= 0 else None
            if fm:
                bt, tt = fm[1]; B = beat_len(bt, tt); pos = o - fm[0]; barlen = F(4 * bt, tt)
                if pos % B == 0:
                    w = weight(pos, bt, tt); qq = pos + B
                    while qq < barlen and weight(qq, bt, tt) <= w:
                        qq += B
                    if w < 1 and e > fm[0] + qq + EPS:
                        t["inner chains from a weak beat through a stronger beat"] += 1
                        if detail:
                            out["tie_ev"].append((h, m, mnum[m], str(pos), p, links, "INNER-weak"))
                elif e > fm[0] + (pos // B + 1) * B + EPS:
                    t["inner chains from off the beat through the next beat"] += 1
                    if detail:
                        out["tie_ev"].append((h, m, mnum[m], str(pos), p, links, "INNER-off"))
        if kind == "beat-level held":
            t["syncopating from a weak beat"] += 1; s = "weak"
        elif kind == "held":
            t["syncopating from off the beat"] += 1; s = "off"
        elif kind == "bass-then-held-chord":
            t["bass-then-held-chord chain"] += 1; s = "btc"
        else:
            s = None
        if detail:
            fm = frame(m) if m >= 0 else None
            out["tie_ev"].append((h, m, mnum[m] if 0 <= m < len(mnum) else None, str(o - fm[0]) if fm else None, p, links, s))
    out["kinds"] = {h: dict(c) for h, c in out["kinds"].items()}
    out["bars"] = {k: sorted(v) for k, v in out["bars"].items()}
    out["ties"] = {h: dict(c) for h, c in out["ties"].items()}
    allk = set()
    for h, c in out["kinds"].items():
        allk |= set(c)
    page = {"beat-level held", "held", "held at the subdivision", "off-beat attack", "accent", "rest", "bass-then-held-chord"}
    out["present_page"] = bool(allk & page)
    out["present_proper"] = bool(allk & {"beat-level held", "held", "held at the subdivision", "accent", "rest"})
    out["readable"] = len(b.readable)
    return out


def safe(iid):
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            r = analyse(iid)
        r.pop("events", None); r.pop("tie_ev", None)
        return r
    except Exception as ex:  # noqa: BLE001
        return {"id": iid, "error": repr(ex)[:200]}


if __name__ == "__main__":
    if sys.argv[1] == "--all":
        ids = [i["id"] for i in CAT if i.get("file")]
        with Pool(6) as pool:
            res = pool.map(safe, ids, chunksize=8)
        (HERE / "sync_all.json").write_text(json.dumps(res), encoding="utf-8")
        print(len(res), sum(1 for r in res if "error" in r), "errors")
    else:
        for iid in sys.argv[1:]:
            r = analyse(iid, detail=True)
            print(json.dumps(r, default=str))
