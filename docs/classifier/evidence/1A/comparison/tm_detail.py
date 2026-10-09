"""The detail view of times.py (its __main__ branch for IDs) for chosen items, run through the patched loader. Prints, around each signature change:
index, printed bar number, signature, actual length (quarter notes), barlines, words, and the label the current detector gives. Reading aid only."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from tcommon import *
common, T = load_times()
for iid in sys.argv[1:]:
    ms = T.measures(iid)
    ch, cad = T.classify(ms)
    lab = T.device_runs(ms, cad)
    print("==", iid, "bars", len(ms), "changes at idx", ch)
    for i in sorted(set(ch) | {j for c in ch for j in (c - 1, c + 1)}):
        if 0 <= i < len(ms):
            m = ms[i]
            print(f"  [{i}] no.{m['no']} sig {m['sig']} len {m['len']} bar {m['bar']} words {m['words'][:3]} key {m['key']} -> {lab.get(i)}")
