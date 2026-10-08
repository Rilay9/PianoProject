import sys, collections, json, re
from common import *

LIMIT = 6


def ledger_rule(w, limit=LIMIT):
    spans = octave_spans(w)
    up = unpitched_staves(w)
    per = collections.defaultdict(lambda: {"below": 0, "above": 0, "middle_c": 0, "max_below": 0, "max_above": 0})
    beyond, unknown = [], 0
    for n in w["notes"]:
        if n["rest"] or n["grace"] or n["step"] is None or (n["part"], n["staff"]) in up:
            continue
        r = ledger_lines(w, n, spans)
        if r is None:
            continue
        lines, side, p, st = r
        if st == "unclosed":
            unknown += 1
            continue
        if not side:
            continue
        k = f"{n['part']}:{n['staff']}"
        if lines >= limit:
            beyond.append((n["m"], k, f"{n['step']}{n['octave']}", lines))
            continue
        if p == 28 and lines == 1:
            per[k]["middle_c"] += 1
            continue
        per[k][side] += 1
        per[k]["max_" + side] = max(per[k]["max_" + side], lines)
    return {"per_staff": dict(per), "beyond_limit": beyond, "unknown_notes": unknown}


def ottava_rule(w):
    spans = octave_spans(w)
    out = []
    for s in spans:
        kind = {("down", 8): "8va", ("up", 8): "8vb", ("down", 15): "15ma", ("up", 15): "15mb"}.get((s["type"], s["size"]), "?")
        covered = [n for n in w["notes"] if not n["rest"] and n["part"] == s["part"] and n["staff"] == s["staff"] and n["t"] >= s["start"] and (s["stop"] is None or n["t"] < s["stop"])]
        out.append({"kind": kind, "staff": s["staff"], "m0": s["m0"], "m1": s.get("m1"), "closed": s["stop"] is not None, "notes": len(covered)})
    words = [d["text"] for d in w["dirs"] if d["kind"] == "words" and re.match(r"^\s*(8va|8vb|8va bassa|15ma|15mb|ottava|loco)", d["text"] or "", re.I)]
    return {"spans": out, "unclosed": sum(1 for s in out if not s["closed"]), "empty": sum(1 for s in out if s["notes"] == 0), "words": words}


if __name__ == "__main__":
    which = sys.argv[1]
    for i in sys.argv[2:]:
        w = cache(i)
        r = ledger_rule(w) if which == "ledger" else ottava_rule(w)
        if which == "ledger":
            r["beyond_limit"] = r["beyond_limit"][:6] + ([f"... {len(r['beyond_limit'])} total"] if len(r["beyond_limit"]) > 6 else [])
        print(i, "=>", json.dumps(r, default=str)[:1000])
