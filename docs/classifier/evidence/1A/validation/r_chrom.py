"""pitch.chromatic (11): spelling-based degrees against the key from the existing key helper (harmony.analyse)."""
import sys, json, warnings, collections
from pathlib import Path
warnings.simplefilter("ignore")
WT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(WT / "tools/classifier"))
sys.path.insert(0, str(WT / "tools/classifier/rules"))
import score as S
import harmony as H
from music21 import key as m21key
from common import *
from walk import HERE

LET = "CDEFGAB"


def scale_pairs(tonic, mode):
    from music21 import scale as m21scale
    t = tonic[0] + tonic[1:].replace("b", "-")
    sc = m21scale.MajorScale(t) if mode == "major" else m21scale.MinorScale(t)
    ps = sc.getPitches(t + "4", t + "5")[:7]
    return [(p.step, int(p.alter)) for p in ps]


def chromatic(i):
    sc = S.load(BYID[i], content=HERE)
    an = H.analyse(sc)
    if an.key is None:
        return {"key": None, "why": an.key_unknown}
    tonic, mode = an.key.tonic, an.key.mode
    pairs = scale_pairs(tonic, mode)
    w = cache(i)
    chrom = raised = dia = 0
    pc_chrom = pc_raised = 0
    tl = LET.index(tonic[0])
    examples = collections.Counter()
    for n in pitched_notes(w):
        if n["tie_stop"]:
            continue
        step = (LET.index(n["step"]) - tl) % 7
        sstep, salter = pairs[step]
        a = int(round(n["alter"]))
        if a == salter:
            dia += 1
        elif mode == "minor" and step in (5, 6) and a == salter + 1:
            raised += 1
        else:
            chrom += 1; examples[f"{n['step']}{a:+d}"] += 1
        # the earlier pitch-class rule, for comparison
        d = (midi(n) - an.key.tonic_pc) % 12
        if mode == "major":
            if d not in (0, 2, 4, 5, 7, 9, 11):
                pc_chrom += 1
        else:
            if d in (9, 11):
                pc_raised += 1
            elif d not in (0, 2, 3, 5, 7, 8, 10):
                pc_chrom += 1
    return {"key": f"{tonic} {mode}", "chromatic": chrom, "minor_raised": raised, "pc_rule": [pc_chrom, pc_raised], "chromatic_spellings": dict(examples.most_common(8))}


if __name__ == "__main__":
    for i in sys.argv[1:]:
        try:
            print(i, "=>", json.dumps(chromatic(i)))
        except Exception as e:
            print(i, "ERR", repr(e)[:200])
