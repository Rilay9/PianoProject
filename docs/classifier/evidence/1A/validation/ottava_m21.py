"""S4 exclusive-stop rule vs music21 toWrittenPitch, on every catalogue file with an <octave-shift>."""
import collections, sys, warnings, time
warnings.simplefilter("ignore")
from music21 import converter, harmony, note, chord
from common import *
from walk import HERE

def ours(w, inclusive=False):
    spans = octave_spans(w)
    c = collections.Counter()
    for n in w["notes"]:
        if n["rest"] or n["step"] is None:
            continue
        o = n["octave"]
        for s in spans:
            if s["part"] == n["part"] and s["staff"] == n["staff"] and n["t"] >= s["start"] and (s["stop"] is None or n["t"] < s["stop"] or (inclusive and n["t"] == s["stop"])):
                k = 1 if s["size"] == 8 else 2
                o += -k if s["type"] == "down" else k
                break
        c[(n["step"], o)] += 1
    return c

def m21(path):
    sc = converter.parse(str(path))
    wr = sc.toWrittenPitch(inPlace=False)
    c = collections.Counter()
    for el in wr.recurse().notes:
        if isinstance(el, harmony.ChordSymbol):
            continue
        ps = el.pitches if isinstance(el, chord.Chord) else [el.pitch]
        for p in ps:
            c[(p.step, p.octave)] += 1
    return c

ids = [i for i in BYID if any(d["kind"] == "oct" for d in cache(i)["dirs"])]
agree = agree_incl = 0
dis = []
t0 = time.time()
for i in ids:
    w = cache(i)
    try:
        m = m21(HERE / BYID[i]["file"])
    except Exception as e:
        print("ERR", i, e); continue
    a = ours(w); b = ours(w, True)
    if a == m:
        agree += 1
    else:
        diff = sum(((a - m) + (m - a)).values())
        unc = any(s["stop"] is None for s in octave_spans(w))
        dis.append((i, diff, "unclosed" if unc else ""))
    if b == m:
        agree_incl += 1
print("files", len(ids), "agree exclusive", agree, "agree inclusive", agree_incl, "secs", round(time.time() - t0))
for d in dis:
    print(" disagree", d)
