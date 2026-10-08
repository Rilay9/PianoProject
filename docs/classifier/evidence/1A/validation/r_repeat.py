"""mark.repeat (23): a custom unroller over the raw structure, as the rule specifies (validation prototype)."""
import sys, re, json, collections, warnings
warnings.simplefilter("ignore")
from common import *
from walk import HERE

DC = re.compile(r"\b(d\.\s?c\.|da\s+capo)", re.I)
DS = re.compile(r"\b(d\.\s?s\.|dal\s+segno)", re.I)
ALFINE = re.compile(r"al\s+fine", re.I)
ALCODA = re.compile(r"al\s+coda", re.I)
TOCODA = re.compile(r"^\s*(to\s+coda|al\s+coda\s*$)", re.I)
FINE = re.compile(r"^\s*fine\s*\.?\s*$", re.I)
CODA = re.compile(r"^\s*coda\s*$", re.I)


def structure(w):
    N = n_measures(w)
    S = {m: {"fwd": False, "bwd": None, "end_start": None, "end_stop": False, "segno": False, "coda": False, "fine": False, "tocoda": False, "jump": None} for m in range(N)}
    for b in w["bars"]:
        if b["part"] != 0:
            continue
        s = S[b["m"]]
        if b["repeat"]:
            d, t = b["repeat"]
            if d == "forward":
                s["fwd"] = True
            elif d == "backward":
                s["bwd"] = int(t) if t else 2
        if b["ending"]:
            num, typ = b["ending"]
            if typ == "start":
                s["end_start"] = {int(x) for x in re.findall(r"\d+", num or "1")} or {1}
            else:
                s["end_stop"] = True
        if b["segno"]:
            s["segno"] = True
        if b["coda"]:
            s["coda"] = True
    words = []
    for d in w["dirs"]:
        if d["part"] != 0:
            continue
        s = S.get(d["m"])
        if s is None:
            continue
        if d["kind"] == "segno":
            s["segno"] = True
        elif d["kind"] == "coda":
            s["coda"] = True
        elif d["kind"] == "words":
            t = (d["text"] or "").strip()
            if DC.search(t) or DS.search(t):
                s["jump"] = ("DS" if DS.search(t) else "DC", "fine" if ALFINE.search(t) else "coda" if ALCODA.search(t) else None)
                words.append((d["m"], t))
            elif FINE.match(t):
                s["fine"] = True; words.append((d["m"], t))
            elif TOCODA.match(t):
                s["tocoda"] = True; words.append((d["m"], t))
            elif CODA.match(t):
                s["coda"] = True; words.append((d["m"], t))
    return S, words


def unroll(w, coda_pair=False):
    S, words = structure(w)
    if coda_pair:
        cs = [m for m in S if S[m]["coda"]]
        if len(cs) >= 2 and not any(S[m]["tocoda"] for m in S):
            S[cs[0]]["tocoda"] = True; S[cs[0]]["coda"] = False
    N = len(S)
    # ending spans
    spans = {}
    m = 0
    while m < N:
        if S[m]["end_start"]:
            e = m
            while e < N - 1 and not S[e]["end_stop"] and not (e > m and S[e + 1]["end_start"]):
                if S[e + 1]["end_start"]:
                    break
                e += 1
            spans[m] = (S[m]["end_start"], e)
            m = e + 1
        else:
            m += 1
    played = 0
    i = 0
    rstart = 0
    passn = 1
    jumped = None
    last_ending = max([max(n) for n, _ in spans.values()] or [1])
    coda_targets = [m for m in range(N) if S[m]["coda"]]
    guard = 0
    while i < N and guard < 20000:
        guard += 1
        if i in spans:
            nums, e = spans[i]
            want = last_ending if jumped else passn
            if want not in nums:
                i = e + 1
                continue
        if S[i]["fwd"] and not (jumped and passn > 1):
            if rstart != i:
                rstart = i; passn = 1
        played += 1
        if jumped and jumped[1] == "fine" and S[i]["fine"]:
            break
        if jumped and jumped[1] == "coda" and S[i]["tocoda"]:
            nxt = [m for m in coda_targets if m > i]
            if nxt:
                i = nxt[0]; jumped = (jumped[0], "done"); continue
        if S[i]["bwd"] and not jumped:
            if passn < S[i]["bwd"]:
                passn += 1; i = rstart; continue
            passn = 1; rstart = i + 1
        if S[i]["jump"] and not jumped:
            jumped = S[i]["jump"]
            if jumped[0] == "DS":
                seg = [m for m in range(N) if S[m]["segno"]]
                i = seg[0] if seg else 0
            else:
                i = 0
            continue
        i += 1
    return {"printed": N, "played": played, "jump_words": words}


def m21_played(i):
    from music21 import converter, repeat, stream
    sc = converter.parse(str(HERE / BYID[i]["file"]))
    p = sc.parts[0]
    ex = repeat.Expander(p)
    if not ex.isExpandable():
        return None, 0
    rex = len(list(p.recurse().getElementsByClass(repeat.RepeatExpression)))
    out = ex.process()
    return len(out.getElementsByClass(stream.Measure)), rex


if __name__ == "__main__":
    for i in sys.argv[1:]:
        r = unroll(cache(i))
        try:
            mp, rex = m21_played(i)
        except Exception as e:
            mp, rex = "ERR " + repr(e)[:80], 0
        print(i, "=>", json.dumps(r, ensure_ascii=True), "| music21", mp, "repeat-expressions", rex)
