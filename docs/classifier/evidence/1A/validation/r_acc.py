"""key.signature-exercised (10), reading.accidental-kinds (12), accidental-churn (13), visual-density (14)."""
import sys, json, collections, statistics
from common import *
from r_ledger import ledger_rule


def sig_exercised(w):
    model = accidental_model(w)
    ex = collections.Counter(); shown = cancelled = 0
    bars = set()
    any_sig = False
    for n, cls, info in model:
        if n["grace"] or n["tie_stop"]:
            continue
        if info["sig"] == 0:
            continue
        any_sig = True
        if info["alter"] != info["sig"]:
            cancelled += 1
        elif cls == "plain" and not info["had_record"] and not n["acc"]:
            ex[n["step"] + ("#" if info["sig"] > 0 else "b")] += 1; bars.add(n["m"])
        else:
            shown += 1
    fifths = [k["fifths"] for k in w["keys"] if k["fifths"] not in (None, "0")]
    if not fifths:
        return {"no signature": True}
    return {"exercised": dict(ex), "total": sum(ex.values()), "shown_restating": shown, "cancelled": cancelled}


def acc_kinds(w):
    model = accidental_model(w)
    c = collections.Counter(cls for _, cls, _ in model)
    req = collections.Counter(n["acc"] for n, cls, _ in model if cls == "required")
    return {"counts": dict(c), "required_kinds": dict(req)}


def churn(w):
    up = unpitched_staves(w)
    g = collections.defaultdict(list)
    for n in w["notes"]:
        if n["rest"] or n["step"] is None or n["tie_stop"] or (n["part"], n["staff"]) in up:
            continue
        g[(n["part"], n["staff"], n["m"], n["step"], n["octave"])].append(n)
    ev = 0; bars = set()
    for k, ns in g.items():
        ns = sorted(ns, key=lambda n: n["t"])
        used = []
        prev = None
        for n in ns:
            a = int(round(n["alter"]))
            if prev is not None and a != prev and a in used:
                ev += 1; bars.add(k[2])
            used.append(a); prev = a
    return {"events": ev, "bars": sorted(bars)[:10]}


def density(w):
    model = accidental_model(w)
    shown = collections.Counter((n["part"], n["staff"], n["m"]) for n, cls, info in model if cls in ("required", "courtesy", "courtesy_marked"))
    staffbar = collections.defaultdict(list)
    for n in w["notes"]:
        if n["rest"] or n["grace"] or n["print"] == "no":
            continue
        staffbar[(n["part"], n["staff"], n["m"])].append(n)
    notes = [len(v) for v in staffbar.values()]
    onsets_total = len({(n["part"], n["staff"], n["t"]) for n in w["notes"] if struck(n) and not n["grace"]})
    length = sum(l for _, l in w["measures"][0])
    return {"max_notes_staffbar": max(notes or [0]), "median_notes": statistics.median(notes or [0]),
            "onsets_per_quarter_per_staff_sum": round(onsets_total / max(1, float(length)), 2), "max_shown_acc": max(shown.values() or [0])}


if __name__ == "__main__":
    which = sys.argv[1]
    fn = {"sig": sig_exercised, "acc": acc_kinds, "churn": churn, "dens": density}[which]
    for i in sys.argv[2:]:
        print(i, "=>", json.dumps(fn(cache(i)), default=str)[:700])
