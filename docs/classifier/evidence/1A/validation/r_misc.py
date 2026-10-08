"""Sections 15-22, 24, 25 on the raw walk."""
import sys, json, re, collections, math
from fractions import Fraction as F
from common import *

# ---------------------------------------------------------------- 15 unusual notation
def unusual(w):
    cue = sum(1 for n in w["notes"] if n["cue"])
    nested = unclosed = 0
    ex = []
    openby = collections.defaultdict(dict)  # (part, voice) -> number -> t
    for n in sorted(w["notes"], key=lambda n: (n["part"], n["t"])):
        key = (n["part"], n["voice"])
        for typ, num in n["tuplets"]:
            if typ == "start":
                o = openby[key]
                if num in o:
                    unclosed += 1
                    if len(ex) < 3:
                        ex.append(("unclosed", n["m"], float(o[num])))
                elif o:
                    nested += 1
                    if len(ex) < 3:
                        ex.append(("nested", n["m"]))
                o[num] = n["t"]
            elif typ == "stop":
                openby[key].pop(num, None)
    tmods = collections.Counter(n["tmod"] for n in w["notes"] if n["tmod"][0])
    # cross-staff beams: group by part, voice, beam 1 begin..end
    xbeams = 0
    cur = {}
    for n in sorted(w["notes"], key=lambda n: (n["part"], n["t"])):
        for num, typ in n["beams"]:
            if num != "1":
                continue
            k = (n["part"], n["voice"])
            if typ == "begin":
                cur[k] = {n["staff"]}
            elif k in cur:
                cur[k].add(n["staff"])
                if typ == "end":
                    if len(cur[k]) > 1:
                        xbeams += 1
                    del cur[k]
    nh = collections.Counter(n["notehead"] for n in w["notes"] if n["notehead"] and n["notehead"] not in ("normal",))
    hidden = nh.pop("none", 0)
    return {"cue": cue, "nested": nested, "unclosed": unclosed, "ex": ex, "cross_staff_beams": xbeams, "noteheads": dict(nh), "hidden": hidden,
            "tmods": {f"{a}:{b}": c for (a, b), c in tmods.items()}}


# ---------------------------------------------------------------- 16 entropy, 17 redundancy
def per_staff_struck(w):
    up = unpitched_staves(w)
    g = collections.defaultdict(list)
    for n in w["notes"]:
        if struck(n) and not n["grace"] and (n["part"], n["staff"]) not in up:
            g[f"{n['part']}:{n['staff']}"].append(n)
    return g


def entropy(w):
    out = {}
    for k, ns in per_staff_struck(w).items():
        c = collections.Counter(midi(n) for n in ns)
        tot = sum(c.values())
        out[k] = round(-sum(v / tot * math.log2(v / tot) for v in c.values()), 2) if tot >= 2 else "UNKNOWN too few"
    return out


def lz76(s):
    """Kaspar-Schuster LZ76 complexity c(n)."""
    n = len(s)
    if n == 0:
        return 0
    i, k, l, c, kmax = 0, 1, 1, 1, 1
    while True:
        if s[i + k - 1] == s[l + k - 1]:
            k += 1
            if l + k > n:
                c += 1; break
        else:
            kmax = max(k, kmax)
            i += 1
            if i == l:
                c += 1; l += kmax
                if l + 1 > n:
                    break
                i, k, kmax = 0, 1, 1
            else:
                k = 1
    return c


def redundancy(w):
    out = {}
    for k, ns in per_staff_struck(w).items():
        g = collections.defaultdict(set)
        for n in ns:
            g[n["t"]].add(midi(n))
        seq = [tuple(sorted(g[t])) for t in sorted(g)]
        if len(seq) < 8:
            out[k] = "UNKNOWN too short"; continue
        c = lz76(seq)
        out[k] = {"lz": c, "n": len(seq), "share": round(c / len(seq), 3)}
    return out


# ---------------------------------------------------------------- 18 turn spans
def turn_spans(w, bpm):
    out = {}
    for k, ns in per_staff_struck(w).items():
        ivs = sorted((float(n["t"]), float(n["t"] + n["dur"])) for n in w["notes"] if f"{n['part']}:{n['staff']}" == k and not n["rest"] and not n["grace"] and n["step"])
        longest_rest = 0.0; at = None; end = None
        for s, e in ivs:
            if end is not None and s - end > longest_rest:
                longest_rest = s - end; at = bar_of(w, F(end).limit_denominator(1000))
            end = e if end is None else max(end, e)
        out[k] = {"longest_rest_q": round(longest_rest, 2), "bar": at, "seconds": round(longest_rest * 60 / bpm, 2) if bpm else None}
    return out


# ---------------------------------------------------------------- 19 fingering
FSUB = re.compile(r"^[1-5]\s*[-–]\s*[1-5]$")


def fingering(w):
    up = unpitched_staves(w)
    kinds = collections.Counter()
    fingered = struck_n = 0
    zero = False
    for n in w["notes"]:
        if not struck(n) or n["grace"] or (n["part"], n["staff"]) in up:
            continue
        struck_n += 1
        if n["fing"]:
            fingered += 1
        for txt, sub, alt in n["fing"]:
            t = txt.strip()
            if t == "0":
                zero = True
            if sub == "yes" or FSUB.match(t):
                kinds["substitution"] += 1
            elif alt == "yes":
                kinds["alternate"] += 1
            elif "\n" in t:
                kinds["chord"] += 1
            elif re.fullmatch(r"[1-5]", t):
                kinds["digit"] += 1
            else:
                kinds["anomalous:" + t[:6]] += 1
    words_digits = sum(1 for d in w["dirs"] if d["kind"] == "words" and re.fullmatch(r"\s*[1-5]\s*", d["text"] or ""))
    from r_format import other_instrument
    oi = other_instrument(w)
    return {"fingered": fingered, "share": round(fingered / max(1, struck_n), 3), "kinds": dict(kinds), "digit_words": words_digits, "not_piano": bool(zero or any(x.startswith("title:") for x in oi))}


# ---------------------------------------------------------------- 21 chord symbols
CHORD_TXT = re.compile(r"^[A-G][#b♯♭]?(m|maj|min|dim|aug|sus|M|°|ø|\+|−|-)?\d{0,2}([#b+\-]?\d{1,2}|add\d|sus\d)*(/[A-G][#b]?)?$")


def chord_symbols(w):
    raw = len(w["harm"])
    d = dedup_symbols(w)
    nc = sum(1 for h in d if h["kind"] == "none")
    slash = sum(1 for h in d if h["bass"][0] and h["bass"][0] != h["root"][0])
    numerals = sum(1 for h in d if h["numeral"] or h["function"])
    bars_notes = collections.defaultdict(int)
    for n in w["notes"]:
        if struck(n) and n["notehead"] != "slash":
            bars_notes[(n["part"], n["m"])] += 1
    alone = sum(1 for h in d if h["kind"] != "none" and bars_notes.get((h["part"], h["m"]), 0) == 0)
    cands = [x["text"].strip() for x in w["dirs"] if x["kind"] == "words" and len((x["text"] or "").strip()) <= 10 and CHORD_TXT.match((x["text"] or "").strip())]
    return {"raw": raw, "symbols": len(d), "duplicates_removed": raw - len(d), "nc": nc, "slash": slash, "numerals": numerals, "alone_bars_with_no_notes": alone, "text_candidates": cands[:8]}


# ---------------------------------------------------------------- 22 figured bass
FIG = re.compile(r"^\s*[#b♯♭n]?\d{1,2}(\s*[/ ]\s*[#b]?\d{1,2})*\s*$")


def figured(w):
    cands = [x["text"].strip() for x in w["dirs"] if x["kind"] == "words" and FIG.match(x["text"] or "") and not re.fullmatch(r"\s*[1-5]\s*", x["text"])]
    return {"figured_bass": len(w["fb"]), "candidates": cands[:10], "n_candidates": len(cands)}


# ---------------------------------------------------------------- 24 reading aids
SOLF = {"do": "C", "re": "D", "mi": "E", "fa": "F", "sol": "G", "so": "G", "la": "A", "si": "B", "ti": "B"}


def reading_aids(w):
    st = [n for n in w["notes"] if struck(n) and not n["grace"]]
    on = collections.defaultdict(list)
    for n in st:
        on[(n["part"], n["staff"], n["t"])].append(n)
    words = [d for d in w["dirs"] if d["kind"] == "words"]
    letter = aligned = 0
    for d in words:
        t = (d["text"] or "").strip()
        m = re.fullmatch(r"([A-Ga-g])[#b♯♭]?", t)
        L = m.group(1).upper() if m else SOLF.get(t.lower())
        if not L:
            continue
        letter += 1
        ns = on.get((d["part"], d["staff"], d["t"]), [])
        if any(n["step"] == L for n in ns):
            aligned += 1
    f = fingering(w)
    return {"letter_words": letter, "aligned": aligned, "struck": len(st), "aligned_share": round(aligned / max(1, len(st)), 3),
            "rule2_fires": aligned >= 0.5 * len(st), "finger_share": f["share"], "rule4_fires": f["share"] >= 0.9 and not f["not_piano"],
            "nh_text": sum(1 for n in st if n["nh_text"]), "colored": sum(1 for n in st if n["nh_color"] and n["nh_color"].upper() not in ("#000000", "#FF000000"))}


# ---------------------------------------------------------------- 25 slash
def slash(w):
    s = [n for n in w["notes"] if n["notehead"] == "slash"]
    beat = sum(1 for n in s if n["stem"] == "none")
    return {"slash": len(s), "beat_slashes": beat, "rhythmic": len(s) - beat, "bars": sorted({n["m"] for n in s})[:12], "measure_style": len(w["mstyle"])}


if __name__ == "__main__":
    which = sys.argv[1]
    fn = {"unusual": unusual, "entropy": entropy, "redund": redundancy, "fing": fingering, "chords": chord_symbols, "fig": figured, "aids": reading_aids, "slash": slash,
          "turn": lambda w: turn_spans(w, BYID[w["id"]].get("tempoBpm"))}[which]
    for i in sys.argv[2:]:
        print(i, "=>", json.dumps(fn(cache(i)), default=str, ensure_ascii=True)[:700])
