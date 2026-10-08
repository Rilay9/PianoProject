"""Shared helpers for the area-1A validation (validation tools, not the implementation)."""
from __future__ import annotations
import re, collections
from fractions import Fraction as F
from walk import cache, BYID, CAT

STEP_PC = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
LETTER = {"C": 0, "D": 1, "E": 2, "F": 3, "G": 4, "A": 5, "B": 6}
SHARPS = "FCGDAEB"


def pipeline(i):
    if i.startswith("exercise."):
        return "generated"
    if "pdmx" in i:
        return "pdmx"
    return "other"


def real_ids():
    return [i for i in BYID if pipeline(i) != "generated"]


def midi(n):
    return 12 * (n["octave"] + 1) + STEP_PC[n["step"]] + int(round(n["alter"]))


def unpitched_staves(w):
    out = set()
    for c in w["clefs"]:
        if c["sign"] in ("percussion", "TAB"):
            out.add((c["part"], c["staff"]))
    for d in w["staffdet"]:
        if d["lines"] is not None and d["lines"].strip() != "5":
            out.add((d["part"], d["staff"]))
    return out


def pitched_notes(w, grace=False):
    up = unpitched_staves(w)
    return [n for n in w["notes"] if not n["rest"] and n["step"] and (grace or not n["grace"]) and (n["part"], n["staff"]) not in up]


def struck(n):
    return not n["rest"] and not n["tie_stop"] and n["step"] is not None


def clef_at(w, part, staff, t):
    cs = sorted([c for c in w["clefs"] if c["part"] == part and c["staff"] == staff], key=lambda c: c["t"])
    cur = None
    for c in cs:
        if c["t"] <= t:
            cur = c
        else:
            break
    return cur


def octave_spans(w):
    """S4: pair each start with the next stop of the same part, staff and number."""
    spans, open_ = [], {}
    for d in sorted([d for d in w["dirs"] if d["kind"] == "oct"], key=lambda d: d["t"]):
        key = (d["part"], d["staff"], d["number"])
        if d["type"] in ("up", "down"):
            if key in open_:
                spans.append({**open_[key], "stop": None})
            open_[key] = {"part": d["part"], "staff": d["staff"], "type": d["type"], "size": d["size"], "start": d["t"], "m0": d["m"]}
        elif d["type"] == "stop":
            if key in open_:
                s = open_.pop(key)
                spans.append({**s, "stop": d["t"], "m1": d["m"]})
    for s in open_.values():
        spans.append({**s, "stop": None})
    return spans


def displayed_octave(w, n, spans=None):
    """Returns (octave, status) status in ok / unclosed."""
    spans = octave_spans(w) if spans is None else spans
    for s in spans:
        if s["part"] == n["part"] and s["staff"] == n["staff"] and n["t"] >= s["start"] and (s["stop"] is None or n["t"] < s["stop"]):
            k = 1 if s["size"] == 8 else 2
            sh = -k if s["type"] == "down" else k
            return n["octave"] + sh, ("unclosed" if s["stop"] is None else "ok")
    return n["octave"], "ok"


def ledger_lines(w, n, spans=None):
    """(lines, side) or None for unpitched; side in below/above/None."""
    c = clef_at(w, n["part"], n["staff"], n["t"])
    if c is None:
        sign, line, oc = ("G", 2, 0) if n["staff"] == 1 else ("F", 4, 0)
    else:
        sign, line, oc = c["sign"], int(c["line"] or {"G": 2, "F": 4, "C": 3}.get(c["sign"], 2)), c["oct"]
    if sign not in ("G", "F", "C"):
        return None
    ref = {"G": 32, "F": 24, "C": 28}[sign] + 7 * oc
    b = ref - 2 * (line - 1)
    o, st = displayed_octave(w, n, spans)
    p = o * 7 + LETTER[n["step"]]
    if p <= b - 2:
        return (b - p) // 2, "below", p, st
    if p >= b + 10:
        return (p - b - 8) // 2, "above", p, st
    return 0, None, p, st


def sig_alters(fifths):
    f = int(fifths)
    alt = {s: 0 for s in "CDEFGAB"}
    if f > 0:
        for s in SHARPS[:f]:
            alt[s] = 1
    elif f < 0:
        for s in SHARPS[::-1][:(-f)]:
            alt[s] = -1
    return alt


def key_at(w, part, staff, t):
    ks = sorted([k for k in w["keys"] if k["part"] == part and (k["number"] is None or int(k["number"]) == staff)], key=lambda k: k["t"])
    cur = 0
    for k in ks:
        if k["t"] <= t and k["fifths"] is not None:
            cur = int(k["fifths"])
    return cur


ACC_ALTER = {"sharp": 1, "flat": -1, "natural": 0, "double-sharp": 2, "sharp-sharp": 2, "flat-flat": -2, "double-flat": -2}


def accidental_model(w):
    """Section 12 corrected model. Per note (struck or tie continuation, grace included), classify.
    Returns list of (note, cls) with cls in required/carried_bar/carried_tie/courtesy/courtesy_marked/in_file_not_shown/missing/plain/sigletter_restate.
    Also returns per-note flags: shown (required or courtesy shown), pos_had_record."""
    up = unpitched_staves(w)
    out = []
    groups = collections.defaultdict(list)
    for n in w["notes"]:
        if n["rest"] or n["step"] is None or (n["part"], n["staff"]) in up:
            continue
        groups[(n["part"], n["staff"], n["m"])].append(n)
    for (part, staff, m), ns in groups.items():
        ns = sorted(ns, key=lambda n: (n["t"], 0 if n["grace"] else 1))
        state, record = {}, set()
        for n in ns:
            fifths = key_at(w, part, staff, n["t"])
            sig = sig_alters(fifths)
            pos = (n["step"], n["octave"])
            cur = state.get(pos, sig[n["step"]])
            alter = int(round(n["alter"]))
            info = {"sig": sig[n["step"]], "alter": alter, "had_record": pos in record, "file_acc": n["acc"]}
            if n["tie_stop"]:
                cls = "carried_tie" if alter != sig[n["step"]] else "plain_tie"
                state[pos] = alter
                out.append((n, cls, info)); continue
            if alter != cur:
                cls = "required"
                if not n["acc"]:
                    cls = "missing"
                state[pos] = alter; record.add(pos)
                info["shown"] = True
            else:
                if n["acc"]:
                    if pos not in record and sig[n["step"]] == 0:
                        cls = "courtesy_marked" if n["acc_attrs"] else "courtesy"
                        info["shown"] = True
                        record.add(pos)
                    else:
                        cls = "in_file_not_shown"
                else:
                    cls = "carried_bar" if alter != sig[n["step"]] else "plain"
            out.append((n, cls, info))
    return out


def dedup_symbols(w):
    seen, out = set(), []
    for h in w["harm"]:
        k = (h["part"], h["t"], h["root"], h["kind"], h["bass"])
        if k in seen:
            continue
        seen.add(k); out.append(h)
    return out


def n_measures(w, part=0):
    return len(w["measures"].get(part, []))


def bar_of(w, t, part=0):
    ms = w["measures"][part]
    for i in range(len(ms) - 1, -1, -1):
        if ms[i][0] <= t:
            return i
    return 0
