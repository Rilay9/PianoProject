"""Report over sync_all.json: kinds by pipeline; generated families against their declared concepts; inner chains."""
import json, re, sys
from collections import Counter, defaultdict
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import BYID, HERE
res = json.loads((HERE / "sync_all.json").read_text(encoding="utf-8"))


def pipe(i):
    return "gen" if i.startswith("exercise.") else "pdmx" if (i.endswith(".pdmx") or ".pdmx." in i) else "rep"


err = [r for r in res if "error" in r]
print("items", len(res), "errors", len(err), Counter(pipe(r["id"]) for r in res), [e["id"] for e in err][:6])
kinds = defaultdict(Counter)
pres = Counter(); proper = Counter()
for r in res:
    if "error" in r or r.get("unknown"):
        continue
    p = pipe(r["id"])
    ks = set()
    for h, c in r["kinds"].items():
        ks |= set(c)
    for k in ks:
        kinds[p][k] += 1
    pres[p] += r["present_page"]; proper[p] += r["present_proper"]
for p in ("gen", "pdmx", "rep"):
    print(p, "present (page list)", pres[p], "present without off-beat attack and bass-then-held-chord", proper[p], dict(kinds[p]))
# generated: declared syncopation?
SYN = re.compile(r"syncop|charleston|anticipat|offbeat|off-beat|clave|tresillo|habanera|tumbao|montuno|rag|swing|backbeat", re.I)
fam = defaultdict(lambda: Counter())
for r in res:
    if "error" in r or not r["id"].startswith("exercise."):
        continue
    it = BYID[r["id"]]
    concepts = " ".join(it.get("concepts") or [])
    declared = bool(re.search(r"syncop", concepts, re.I))
    f = ".".join(r["id"].split(".")[:2])
    ks = set()
    for h, c in r["kinds"].items():
        ks |= set(c)
    fam[f]["items"] += 1
    fam[f]["declares syncopation"] += declared
    fam[f]["present"] += r["present_page"]
    fam[f]["proper"] += r["present_proper"]
    for k in ks:
        fam[f][k] += 1
print("\nGenerated families (items; declares syncopation in concepts; present; proper; kinds):")
for f, c in sorted(fam.items()):
    print(" ", f, dict(c))
print("\nGenerated items declaring syncopation but absent:", [r["id"] for r in res if "error" not in r and r["id"].startswith("exercise.")
      and re.search(r"syncop", " ".join(BYID[r["id"]].get("concepts") or []), re.I) and not r["present_page"]])
# ties
tie = defaultdict(Counter)
inner_only = []
for r in res:
    if "error" in r:
        continue
    p = pipe(r["id"])
    for h, c in r.get("ties", {}).items():
        for k, v in c.items():
            tie[p][k] += v
    w = sum(c.get("inner chains from a weak beat through a stronger beat", 0) + c.get("inner chains from off the beat through the next beat", 0) for c in r.get("ties", {}).values())
    s = sum(c.get("syncopating from a weak beat", 0) + c.get("syncopating from off the beat", 0) for c in r.get("ties", {}).values())
    if w >= 4 and s == 0:
        inner_only.append((r["id"], w))
for p in ("gen", "pdmx", "rep"):
    print("ties", p, dict(tie[p]))
print("items whose only syncopating-shaped chains are inner (>=4, 0 on the lines):", len(inner_only), sorted(inner_only, key=lambda x: -x[1])[:15])
# beat-level kind: items where it is the only proper kind
only_bl = [r["id"] for r in res if "error" not in r and {k for c in r["kinds"].values() for k in c} & {"beat-level held", "held", "held at the subdivision", "accent", "rest"} == {"beat-level held"}]
print("items whose only proper kind is beat-level held:", len(only_bl), Counter(pipe(i) for i in only_bl))
print("unknown:", [(r["id"], r["unknown"]) for r in res if r.get("unknown")][:5])
