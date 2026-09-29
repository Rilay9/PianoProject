"""
The tie piece's left hand against the lead sheet it was read from: each bar's held note is the root of the chord the
lead-sheet edition (PDMX CID QmPbR5ngH5hsCGjDz7bZJTxRgSAp1tiPyh8Rrjrj4yjDWB, from the owner's archive) prints over the
same melody bar, a chord carrying on until the next symbol. The lead sheet's melody is aligned to the authored one by
matching each authored bar's pitches (the lead sheet opens with an empty bar and has fill bars the melody lacks).

    python scripts-lh-roots-check.py <lead sheet .mxl> <authored .abc>
"""
import sys
import warnings
from pathlib import Path

warnings.filterwarnings("ignore")
HERE = Path(__file__).resolve()
sys.path.insert(0, str(HERE.parents[4] / "tools" / "content"))
from convert import parse_source  # noqa: E402
from music21 import converter, harmony, stream  # noqa: E402

lead = converter.parse(sys.argv[1])
mine = parse_source(Path(sys.argv[2]))


def bars(part):
    out = []
    for m in part.getElementsByClass(stream.Measure):
        notes = [n for n in m.recurse().notes if not isinstance(n, harmony.Harmony)]
        symbols = [h.root().name for h in m.recurse().getElementsByClass(harmony.ChordSymbol)]
        out.append(([p.name for n in notes for p in n.pitches], symbols))
    return out


lead_bars = bars(lead.parts[0])
rh, lh = [bars(p) for p in list(mine.parts)[:2]]
# The alignment, read off the two dumps (scripts-dump-ties.py): the lead sheet's bar 1 is empty, so the authored
# bar i is the lead sheet's bar i+1 through the verse; its bar 18 is a fill bar with no melody, so from the chorus on
# the authored bar i is the lead sheet's bar i+2. Both melodies are printed so the alignment can be read.
def lead_index(i):
    return i + 1 if i <= 16 else i + 2
chord_at = {}
current = None
for k, (_pitches, symbols) in enumerate(lead_bars, start=1):
    if symbols:
        current = symbols[-1]
    chord_at[k] = current
mismatch = 0
for i, ((rh_pitches, _), (lh_pitches, _)) in enumerate(zip(rh, lh), start=1):
    k = lead_index(i)
    lead_melody = lead_bars[k - 1][0]
    root = chord_at[k]
    ok = bool(lh_pitches) and lh_pitches[0] == root
    mismatch += 0 if ok else 1
    print(f"bar {i:2} (lead sheet bar {k:2}): melody {rh_pitches} / lead sheet {lead_melody} | left hand {lh_pitches} | chord root {root} {'ok' if ok else 'DIFFERS'}")
print(f"{mismatch} bar(s) differ")
