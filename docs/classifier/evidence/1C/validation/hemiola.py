"""hemiola.py ID ... : the corrected rhythm.hemiola kinds per hand: two-bar (3/4 or 3/2, onsets {0,2,4} beats over two bars),
6/8 as 3/4 ({0,1/3,2/3} of a 6/8 bar), 3/4 cross-grouped bar ({0,1/2} of a 3/4 bar), and the sesquialtera reading
(a cross-grouped bar next to a 3/4 bar of the metre's own grouping: onsets at beat 2 or 3, none at the half bar)."""
import sys, json, warnings
from fractions import Fraction as F
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import load
warnings.simplefilter("ignore")
from rules import rhythm as R
for iid in sys.argv[1:]:
    sc = load(iid); b = R.Bars(sc)
    out = {}
    for h in "RL":
        two = []
        for mets in ({(3, 4)}, {(3, 2)}):
            bars = b.bars_in(mets)
            for m in bars:
                if m + 1 in bars:
                    on = {o / (2 * b.length[m]) for o in b.onsets[h].get(m, {})} | {(o + b.length[m]) / (2 * b.length[m]) for o in b.onsets[h].get(m + 1, {})}
                    if on == {F(0), F(1, 3), F(2, 3)}:
                        two.append(m)
        six = [m for m in b.bars_in({(6, 8)}) if b.fractions(h, m) == {F(0), F(1, 3), F(2, 3)}]
        cross = [m for m in b.bars_in({(3, 4)}) if b.fractions(h, m) == {F(0), F(1, 2)}]
        own = {m for m in b.bars_in({(3, 4)}) if (b.fractions(h, m) & {F(1, 3), F(2, 3)}) and F(1, 2) not in b.fractions(h, m)}
        alt = [m for m in cross if (m - 1 in own or m + 1 in own)]
        for k, v in (("two-bar", two), ("6/8 as 3/4", six), ("3/4 cross-grouped", cross), ("sesquialtera (alternating)", alt)):
            if v:
                out[f"{h} {k}"] = (len(v), v[:12])
    print(iid, json.dumps(out))
