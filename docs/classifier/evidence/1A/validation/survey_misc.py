import collections
from common import *
from r_misc import unusual, fingering, chord_symbols, reading_aids, figured

share_bins = collections.Counter(); zero_items = []
unc = collections.Counter(); nest = collections.Counter()
tm = collections.Counter(); tm_ex = {}
dup = collections.Counter(); raw = collections.Counter()
aid_hits = []
fig_items = collections.Counter()
lyr = 0
for i in BYID:
    w = cache(i); p = pipeline(i)
    f = fingering(w)
    if f["fingered"]:
        b = min(int(f["share"] * 10), 10) / 10
        share_bins[(p, b)] += 1
    if any(t.strip() == "0" for n in w["notes"] for t, _, _ in n["fing"]):
        zero_items.append(i)
    u = unusual(w)
    if u["unclosed"]:
        unc[p] += 1
    if u["nested"]:
        nest[p] += 1
    for k, c in u["tmods"].items():
        tm[k] += c; tm_ex.setdefault(k, i)
    c = chord_symbols(w)
    if c["raw"]:
        raw[p] += c["raw"]; dup[p] += c["duplicates_removed"]
    a = reading_aids(w)
    if a["rule2_fires"]:
        aid_hits.append((i, a["aligned_share"]))
    if figured(w)["n_candidates"]:
        fig_items[p] += 1
    if any(n["lyrics"] for n in w["notes"]):
        lyr += 1
print("finger share bins (items with any fingering):", sorted(share_bins.items()))
print("items with a fingering 0:", zero_items)
print("unclosed tuplet files:", dict(unc), "nested:", dict(nest))
print("time-modifications:", {k: (v, tm_ex[k]) for k, v in tm.items()})
print("chord symbols raw/dup:", dict(raw), dict(dup))
print("reading-aid rule 2 hits:", aid_hits)
print("figured-bass word candidates (items):", dict(fig_items))
print("files with <lyric>:", lyr)
