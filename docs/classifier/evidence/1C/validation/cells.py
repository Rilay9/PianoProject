"""cells.py ID ... : per hand, bars (0-based) holding exactly the habanera, tresillo, cinquillo onset cells (2/4 and doubled),
the backbeat onsets {1/4, 3/4} and accents-only-on-2-and-4 in 4/4 and 12/8, and whether each is a pattern (rules/rhythm.py
`repeated`)."""
import sys, json, warnings
from fractions import Fraction as F
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import load
warnings.simplefilter("ignore")
from rules import rhythm as R
HAB = frozenset({F(0), F(3, 8), F(1, 2), F(3, 4)})
TRE = frozenset({F(0), F(3, 8), F(3, 4)})
CIN = frozenset({F(0), F(1, 4), F(3, 8), F(5, 8), F(3, 4)})
BB = frozenset({F(1, 4), F(3, 4)})
for iid in sys.argv[1:]:
    sc = load(iid)
    b = R.Bars(sc)
    out = {}
    for h in "RL":
        for name, cell in (("hab", HAB), ("tre", TRE), ("cin", CIN)):
            for kind, mets in (("2/4", {(2, 4)}), ("dbl", {(4, 4), (2, 2)})):
                bars = [m for m in b.bars_in(mets) if b.fractions(h, m) == cell]
                if bars:
                    out[f"{h} {name} {kind}"] = (len(bars), R.repeated([[m] for m in bars]), bars[:10])
        bars = [m for m in b.bars_in({(4, 4), (12, 8)}) if b.fractions(h, m) == BB]
        if bars:
            afterbeat = [m for m in bars if b.chordal(h, m)]
            out[f"{h} backbeat-onsets"] = (len(bars), R.repeated([[m] for m in bars]), bars[:10], "chordal bars", len(afterbeat))
    # accents kind: the bar's accent marks (accent, strong-accent) fall only on beats 2 and 4 (4/4, 12/8)
    from common import fr
    from collections import defaultdict
    acc = defaultdict(set)
    starts = [fr(s) for s in sc.measure_starts]
    for pi, part in enumerate(sc.part_score.parts):
        q = part.quarter_map
        for n in part.notes_tied:
            if set(getattr(n, "articulations", None) or []) & {"accent", "strong-accent"}:
                o = fr(q(n.start.t))
                m = max(j for j in range(len(starts)) if starts[j] <= o)
                if m in b.readable and b.metre[m] in {(4, 4), (12, 8)}:
                    acc[m].add((o - starts[m]) / b.length[m])
    abars = sorted(m for m, s in acc.items() if s and s <= BB)
    if abars:
        out["accents-on-2-and-4"] = (len(abars), R.repeated([[m] for m in abars]), abars[:10])
    print(iid, json.dumps(out))
