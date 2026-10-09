"""item.format: in which bars the two-note onsets of Blue Bossa and of The Flute Tune fall (the walk, unchanged)."""
import sys, collections
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path[:0] = [str(HERE / "shim1a"), str((HERE / "../../1A/validation").resolve())]
from common import *
from r_format import onset_groups

for i in ("song.jazz.kenny-dorham-blue-bossa.pdmx", "song.folk.the-flute-tune-soulpride-remix.pdmx"):
    w = cache(i)
    g = onset_groups(w)
    bars = collections.Counter()
    for t, ns in g.items():
        if len(ns) >= 2:
            bars[bar_of(w, t) + 1] += 1
    print(i, "onsets", len(g), "two-or-more-note onsets", sum(bars.values()), "bars (1-based):", dict(sorted(bars.items())), "of", n_measures(w), "bars;",
          "symbols", len([h for h in dedup_symbols(w) if h["kind"] != "none"]))
