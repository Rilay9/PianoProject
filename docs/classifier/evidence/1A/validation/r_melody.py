"""texture.melody-location (4): rules 1 (with the accompaniment guard), 2, 3, per bar, over score.load and texture.py."""
import sys, json, warnings, collections, random
from pathlib import Path
warnings.simplefilter("ignore")
WT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(WT / "tools/classifier"))
sys.path.insert(0, str(WT / "tools/classifier/rules"))
import score as S
import texture as T
from common import BYID, pipeline, cache
from walk import HERE

_captured = {}
_orig = T._result


def _cap(v, bars_by_hand, minimum, **extra):
    _captured.setdefault("cur", []).append({h: set(b) for h, b in bars_by_hand.items()})
    return _orig(v, bars_by_hand, minimum, **extra)


T._result = _cap
PATTERNS = ["alberti", "broken_chord", "waltz_bass", "oom_pah", "stride", "boogie_bass", "four_to_the_bar"]


def pattern_bars(sc):
    per = collections.defaultdict(set)
    for p in PATTERNS:
        _captured["cur"] = []
        try:
            getattr(T, p)(sc)
        except Exception:
            continue
        for d in _captured["cur"]:
            for h, bs in d.items():
                per[h] |= bs
    return per


def melody(i, guard=True):
    sc = S.load(BYID[i], content=HERE)
    v = T.view(sc)
    if v.unknown:
        return {"unknown": v.unknown}
    pb = pattern_bars(sc)
    w = cache(i)
    lyr_or_sym = bool(w["harm"]) or any(n["lyrics"] for n in w["notes"])
    out = {}
    hands = list(v.hands)
    for m in range(v.n_bars):
        sounding = [h for h in hands if T.bar_events(v, h, m)]
        pat = [h for h in hands if m in pb.get(h, set())]
        if len(hands) == 1:
            out[m] = ("rule3" if lyr_or_sym else "rule1", hands[0]) if sounding else None
            continue
        if len(sounding) == 1:
            h = sounding[0]
            if guard and h in pat:
                out[m] = ("UNKNOWN accompaniment pattern alone", h)
            else:
                out[m] = ("rule1", h)
        elif len(sounding) == 2 and len(pat) == 1:
            out[m] = ("rule2", [h for h in hands if h != pat[0]][0])
        else:
            out[m] = None
    return out


def summary(i, guard=True):
    o = melody(i, guard)
    if "unknown" in o:
        return o
    c = collections.Counter(x[0] if x else "UNKNOWN" for x in o.values())
    return {"bars": len(o), **c}


if __name__ == "__main__":
    args = sys.argv[1:]
    if args[0] == "bars":
        i = args[1]; bs = [int(x) for x in args[2].split(",")]
        o = melody(i)
        o2 = melody(i, guard=False)
        for b in bs:
            print(i, "bar", b, "guarded:", o.get(b), "unguarded:", o2.get(b))
    elif args[0] == "sample":
        random.seed(7)
        two = [i for i in BYID if pipeline(i) == "pdmx" and len(cache(i)["parts"]) == 1 and any(s == 2 for p, s in cache(i)["staves"])]
        ids = random.sample(two, 60)
        tot = collections.Counter(); tot_ng = collections.Counter()
        for i in ids:
            try:
                s = summary(i); s2 = summary(i, False)
            except Exception as e:
                continue
            for k, v in s.items():
                if k != "unknown":
                    tot[k] += v
            for k, v in s2.items():
                if k != "unknown":
                    tot_ng[k] += v
        print("guarded", dict(tot)); print("unguarded", dict(tot_ng))
    else:
        for i in args:
            print(i, "=>", json.dumps(summary(i)), "| unguarded", json.dumps(summary(i, False)))
