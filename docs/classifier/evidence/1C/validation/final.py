"""final.py: over items whose proper syncopation includes the beat-level kind, how many beat-level events are a note
that sounds to the end of the piece (the final note held over the last bar line), and in how many items that is the only
proper event."""
import json, sys, warnings
from collections import Counter
from multiprocessing import Pool
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import HERE
from fractions import Fraction as F

warnings.simplefilter("ignore")


def one(iid):
    from sync import analyse
    try:
        r = analyse(iid, detail=True)
    except Exception:
        return None
    from common import load
    sc = load(iid)
    end = max(F(float(o + d)).limit_denominator(192) for o, d in zip(sc.notes["onset_quarter"], sc.notes["duration_quarter"]))
    nbars = len(sc.measure_starts)
    proper = [e for e in r["events"] if e[1] in ("beat-level held", "held", "held at the subdivision", "accent", "rest")]
    finals = [e for e in r["events"] if e[1] == "beat-level held" and e[2] >= nbars - 2 and e[6].endswith("q")]
    # the event's note sounds to the end: onset + length == end of piece
    fin = []
    for e in finals:
        ln = F(e[6][:-1]) if "/" not in e[6] else None
        fin.append(e)
    return iid, len(proper), len(fin), [(e[2], e[4], e[6]) for e in fin]


if __name__ == "__main__":
    res = json.loads((HERE / "sync_all.json").read_text(encoding="utf-8"))
    ids = [r["id"] for r in res if "error" not in r and any("beat-level held" in c for c in r["kinds"].values())]
    with Pool(6) as p:
        out = [x for x in p.map(one, ids, chunksize=4) if x]
    only = [x for x in out if x[2] and x[1] == x[2]]
    some = [x for x in out if x[2]]
    pipe = lambda i: "gen" if i.startswith("exercise.") else "pdmx" if (i.endswith(".pdmx") or ".pdmx." in i) else "rep"
    print("items with a beat-level event:", len(out), Counter(pipe(x[0]) for x in out))
    print("items with a beat-level event in the last two bars:", len(some), Counter(pipe(x[0]) for x in some))
    print("items whose only proper events are beat-level events in the last two bars:", len(only), Counter(pipe(x[0]) for x in only))
    for x in only[:40]:
        print("  ", x)
