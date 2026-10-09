"""Step 1 (before any reader is run): which catalogue files have repeat structure, and each file's printed structure.
Selection = survey_repeat.py's predicate (any forward/backward repeat barline, ending, segno, coda, or jump/Fine/Coda word).
Writes rep_structure.json: {id: {pipeline, printed, compact structure string, ...}}. No played-bar count is computed here."""
import sys, json, collections
sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parent))
from rcommon import *
walk, common, rr = load_validators()
from common import BYID, cache, pipeline


def compact(S, words):
    """One line per file: bar numbers are 1-based printed positions (index+1)."""
    parts = []
    for m in sorted(S):
        s = S[m]
        t = []
        if s["fwd"]: t.append("|:")
        if s["end_start"]: t.append("V" + "".join(str(x) for x in sorted(s["end_start"])))
        if s["segno"]: t.append("SEGNO")
        if s["coda"]: t.append("CODA")
        if s["tocoda"]: t.append("TOCODA")
        if s["fine"]: t.append("FINE")
        if s["jump"]: t.append("JUMP:%s/%s" % s["jump"])
        if s["bwd"]: t.append(":|" + (f"x{s['bwd']}" if s["bwd"] != 2 else ""))
        if s["end_stop"]: t.append("v-end")
        if t:
            parts.append(f"{m+1}[{' '.join(t)}]")
    return " ".join(parts)


out = {}
cnt = collections.Counter()
for i in BYID:
    w = cache(i)
    S, words = rr.structure(w)
    has = any(s["fwd"] or s["bwd"] or s["end_start"] or s["segno"] or s["coda"] for s in S.values()) or words
    if not has:
        continue
    p = pipeline(i)
    cnt[p] += 1
    out[i] = {"pipeline": p, "title": BYID[i].get("title"), "printed": len(S), "jump_words": [(m + 1, t) for m, t in words],
              "structure": compact(S, words), "n_fwd": sum(1 for s in S.values() if s["fwd"]), "n_bwd": sum(1 for s in S.values() if s["bwd"])}
print(dict(cnt), "files with repeat structure:", len(out), "of", len(BYID), "notated catalogue items")
json.dump(out, open(OUT / "rep_structure.json", "w", encoding="utf8"), indent=1, ensure_ascii=False)
