"""item.format (section 1), notation.staves (2), prereq.hand-assignment (3), clefs (5), clef-change (6), keys (9)."""
from __future__ import annotations
import re, collections, sys, json
from common import *

KEYB = re.compile(r"piano|keyboard|klavier|pianoforte|organ|harpsichord|rhodes|synth", re.I)
VOICE_NAMES = re.compile(r"^\s*(soprano|alto|tenor|bass|s\.|a\.|t\.|b\.)\s*$", re.I)
INSTR = re.compile(r"\b(violin|viola|cello|trombone|trumpet|flute|clarinet|oboe|saxophone|guitar)s?\b", re.I)
PIANOW = re.compile(r"\b(piano|klavier|keyboard)\b", re.I)
DUET = re.compile(r"primo|secondo|duet|4 hands|four hands|quatre mains|vierh[äa]ndig|teacher part", re.I)
EXER = re.compile(r"exercise|exercice|übung|étude|etude|study|studie|scale|arpeggio|hanon|czerny|beyer|velocity|technique|drill", re.I)


def staves_of(w):
    st = collections.defaultdict(lambda: 1)
    for p, s in w["staves"]:
        st[p] = max(st[p], s)
    return [st[p] for p in range(len(w["parts"]))]


def onset_groups(w, part=None, staff=None):
    g = collections.defaultdict(list)
    for n in w["notes"]:
        if not struck(n) or n["grace"]:
            continue
        if part is not None and n["part"] != part:
            continue
        if staff is not None and n["staff"] != staff:
            continue
        g[n["t"]].append(n)
    return g


def fmt_measures(w):
    up = unpitched_staves(w)
    sv = staves_of(w)
    parts = len(w["parts"])
    note_staves = {(n["part"], n["staff"]) for n in w["notes"] if not n["rest"]}
    ev = {}
    # rule 1
    if note_staves and all(s in up for s in note_staves):
        return {"layout": "piano score (rhythm staff)", "rule": 1}
    if parts >= 2:
        names = [p["name"] for p in w["parts"]]
        if all(s == 1 for s in sv) and all(VOICE_NAMES.match(nm or "") for nm in names):
            return {"layout": "hymn or chorale in parts (open score)", "rule": "2a"}
        nonkey = []
        for p in w["parts"]:
            txtn = (p["name"] or "") + " " + " ".join(p["inst"])
            prog_ok = all((1 <= x <= 8) or (17 <= x <= 21) for x in p["prog"]) if p["prog"] else True
            if not KEYB.search(txtn) or not prog_ok:
                nonkey.append(p["name"])
        if nonkey:
            return {"layout": "piano part with other instruments", "rule": "2c", "nonkey": nonkey}
        return {"layout": "piano score", "rule": "2d"}
    syms = [h for h in dedup_symbols(w) if h["kind"] != "none"]
    nb = n_measures(w)
    if sv[0] == 1:
        slash = [n for n in w["notes"] if n["notehead"] == "slash"]
        sym_bars = {h["m"] for h in syms}
        pitched_bars = {n["m"] for n in w["notes"] if struck(n) and n["notehead"] != "slash"}
        g = onset_groups(w)
        multi = sum(1 for t, ns in g.items() if len(ns) >= 2) / max(1, len(g))
        ev.update(syms=len(syms), bars=nb, slash=len(slash), multi=round(multi, 3),
                  sym_bars_with_notes=round(len(sym_bars & pitched_bars) / max(1, len(sym_bars)), 3))
        if syms and slash and len(sym_bars & pitched_bars) < 0.10 * len(sym_bars):
            return {"layout": "chord chart", "rule": 3, **ev}
        if syms and len(syms) >= nb / 4 and multi < 0.10:
            return {"layout": "lead sheet", "rule": 3, **ev}
        return {"layout": "piano score (one-hand part)", "rule": 3, **ev}
    # rule 4: one part two staves
    sb = collections.defaultdict(set)
    for n in w["notes"]:
        if not n["rest"]:
            sb[(n["staff"], n["m"])].add(n["voice"])
    two = sum(1 for v in sb.values() if len(v) >= 2) / max(1, len(sb))
    g = onset_groups(w)
    four = sum(1 for ns in g.values() if len(ns) == 4) / max(1, len(g))
    ev.update(two_voice_bars=round(two, 3), four_note_onsets=round(four, 3))
    if two >= 0.5 and four >= 0.5:
        return {"layout": "hymn or chorale in parts (candidate, 4a)", "rule": "4a", **ev}
    if pipeline(w["id"]) != "generated" and four >= 0.8:
        return {"layout": "hymn or chorale in parts (candidate, 4b, rhythm condition unnumbered)", "rule": "4b", **ev}
    return {"layout": "piano score", "rule": 4, **ev}


def other_instrument(w):
    title = w["title"] or ""
    hit = []
    m = INSTR.search(title)
    if m and not PIANOW.search(title):
        hit.append("title:" + m.group(0))
    zeros = sum(1 for n in w["notes"] for f in n["fing"] if f[0].strip() == "0")
    if zeros:
        hit.append(f"fingering0x{zeros}")
    return hit


def purpose(w):
    i = w["id"]
    if pipeline(i) == "generated":
        return "from recipe family"
    t = (w["title"] or "") + " " + " ".join(p["name"] or "" for p in w["parts"])
    if DUET.search(t):
        return "duet part (candidate)"
    if EXER.search(w["title"] or ""):
        return "technical exercise (candidate)"
    return "piece"


def staves_rule(w):
    up = unpitched_staves(w)
    sv = staves_of(w)
    with_notes = {(n["part"], n["staff"]) for n in w["notes"] if not n["rest"]}
    return {"parts": len(w["parts"]), "staves_per_part": sv, "pitched": sorted(s for s in with_notes if s not in up), "unpitched": sorted(up & with_notes)}


HANDW = re.compile(r"^\s*[\(\[]?\s*(m\.\s?d\.|m\.\s?s\.|m\.\s?g\.|r\.\s?h\.|l\.\s?h\.|rh\b|lh\b|mano destra|mano sinistra|main droite|main gauche|rechte hand|linke hand)", re.I)


def hand_flags(w):
    fl = collections.defaultdict(list)
    byv = collections.defaultdict(lambda: collections.defaultdict(list))
    for n in w["notes"]:
        if n["rest"] or n["step"] is None or n["grace"]:
            continue
        byv[(n["part"], n["m"], n["voice"])][n["staff"]].append(n)
    for (p, m, v), st in byv.items():
        if len(st) < 2:
            continue
        a, b = st.get(1, []), st.get(2, [])
        if not a or not b:
            continue
        ov = any(x["t"] < y["t"] + y["dur"] and y["t"] < x["t"] + x["dur"] for x in a for y in b)
        fl["collision" if ov else "cross_staff"].append(m)
    for d in w["dirs"]:
        if d["kind"] == "words" and HANDW.match(d["text"] or ""):
            fl["hand_words"].append((d["m"], d["text"].strip()[:20]))
    g = collections.defaultdict(list)
    for n in w["notes"]:
        if struck(n) and not n["grace"]:
            g[(n["part"], n["staff"], n["t"])].append(midi(n))
    for (p, s, t), ps in g.items():
        if max(ps) - min(ps) > 16:
            fl["reach"].append((bar_of(w, t, p), max(ps) - min(ps)))
    sv = staves_of(w)
    if len(w["parts"]) == 1 and sv[0] == 1 and w["hands"] == "both":
        fl["one_staff_both"].append("all")
    return {k: (sorted(set(v)) if k in ("cross_staff", "collision") else v) for k, v in fl.items()}


def max_reach(w):
    g = collections.defaultdict(list)
    for n in w["notes"]:
        if struck(n) and not n["grace"]:
            g[(n["part"], n["staff"], n["t"])].append(midi(n))
    return max([max(ps) - min(ps) for ps in g.values()] or [0])


def clefs_rule(w):
    up = unpitched_staves(w)
    cnt = collections.defaultdict(collections.Counter)
    flags = []
    for n in w["notes"]:
        if n["rest"] or n["step"] is None or (n["part"], n["staff"]) in up:
            continue
        c = clef_at(w, n["part"], n["staff"], n["t"])
        name = f"{c['sign']}{c['line']}" + (f"{c['oct']:+d}" if c and c["oct"] else "") if c else "none"
        cnt[f"{n['part']}:{n['staff']}"][name] += 1
    for k, c in cnt.items():
        st = int(k.split(":")[1])
        for nm in c:
            if st == 1 and nm.startswith("F"):
                flags.append(f"bass on staff1 {k}")
            if st == 2 and nm.startswith("G"):
                flags.append(f"treble on staff2 {k}")
            if not (nm.startswith("G2") or nm.startswith("F4")):
                flags.append(f"other clef {nm} {k}")
    return {"per_staff": {k: dict(v) for k, v in cnt.items()}, "flags": sorted(set(flags)), "unpitched": sorted(up)}


def clef_changes(w):
    out = []
    byst = collections.defaultdict(list)
    for c in w["clefs"]:
        byst[(c["part"], c["staff"])].append(c)
    for k, cs in byst.items():
        cs = sorted(cs, key=lambda c: c["t"])
        cur = None
        for c in cs:
            sig = (c["sign"], c["line"], c["oct"])
            if cur is not None and sig != cur:
                mlen = w["measures"][c["part"]][c["m"]][1]
                where = "barline" if c["off"] == 0 or c["off"] == mlen else "inside"
                out.append({"staff": k, "m": c["m"], "off": float(c["off"]), "from": cur, "to": sig, "where": where})
            restate = cur is not None and sig == cur
            cur = sig
    return out


def restatements(w):
    n = 0
    byst = collections.defaultdict(list)
    for c in w["clefs"]:
        byst[(c["part"], c["staff"])].append(c)
    for k, cs in byst.items():
        cs = sorted(cs, key=lambda c: c["t"])
        for a, b in zip(cs, cs[1:]):
            if (a["sign"], a["line"], a["oct"]) == (b["sign"], b["line"], b["oct"]):
                n += 1
    return n


def keys_rule(w):
    ks = sorted(w["keys"], key=lambda k: k["t"])
    first = ks[0]["fifths"] if ks else "0"
    ch, cur = [], {}
    for k in ks:
        key = (k["part"], k["number"])
        if key in cur and cur[key] != k["fifths"]:
            ch.append((k["m"], float(k["off"]), k["fifths"]))
        cur[key] = k["fifths"]
    ch = sorted(set(ch))
    return {"first": first, "changes": ch, "per_staff": any(k["number"] for k in ks), "nontrad": any(k["fifths"] is None for k in ks)}


if __name__ == "__main__":
    which = sys.argv[1]
    ids = sys.argv[2:]
    fn = {"format": lambda w: {**fmt_measures(w), "other_instr": other_instrument(w), "purpose": purpose(w)},
          "staves": staves_rule, "hands": hand_flags, "clefs": clefs_rule, "clefch": lambda w: {"changes": clef_changes(w), "restatements": restatements(w)},
          "keys": keys_rule, "reach": max_reach}[which]
    for i in ids:
        w = cache(i)
        r = fn(w)
        print(i, "=>", json.dumps(r, default=str)[:900])
