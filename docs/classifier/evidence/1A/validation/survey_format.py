import collections
from common import *
from r_format import fmt_measures, other_instrument, purpose, staves_of, onset_groups

lay = collections.Counter()
hymnb = []
oi = []
for i in BYID:
    w = cache(i)
    r = fmt_measures(w)
    lay[(pipeline(i), r["layout"])] += 1
    sv = staves_of(w)
    if len(w["parts"]) == 1 and sv[0] == 2 and pipeline(i) != "generated":
        f = r.get("four_note_onsets", 0)
        if f >= 0.6:
            # rhythm: share of beats (quarter grid of time sig denominators approx: use quarter) with at most one onset time
            g = onset_groups(w)
            ts = sorted(g)
            beats = collections.Counter(int(t) for t in ts)  # quarter-beat buckets
            one = sum(1 for b, c in beats.items() if c <= 1) / max(1, len(beats))
            hymnb.append((round(f, 3), round(one, 3), r["two_voice_bars"], i))
    if pipeline(i) != "generated":
        h = other_instrument(w)
        if h:
            oi.append((i, h, w["title"]))
for k, v in sorted(lay.items()):
    print(k, v)
print("--- one-part two-staff real files, four-note onset share >= 0.6: (four, one-onset-per-quarter share, two-voice bars, id)")
for x in sorted(hymnb, reverse=True):
    print(x)
print("--- other-instrument flag hits on real files:", len(oi))
for x in oi:
    print(x)
