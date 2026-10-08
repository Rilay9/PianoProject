"""bars.py ID A B : part 0 measures A..B (0-based) with signature, length, barlines, words, key change."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from times import measures
ms = measures(sys.argv[1])
print("measures:", len(ms))
for i in range(int(sys.argv[2]), min(len(ms), int(sys.argv[3]) + 1)):
    m = ms[i]
    print(f"[{i}] no.{m['no']} {m['sig']} len {m['len']} bar {m['bar']} words {m['words'][:4]} key {m['key']}")
