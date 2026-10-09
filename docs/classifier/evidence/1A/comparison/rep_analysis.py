"""Tables from rep_readers.json + rep_structure.json: counts per reader, agreement between readers, disagreement list.
Writes rep_analysis.json and prints the tables (copied into repeat-times.md)."""
import json, collections, itertools, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
R = json.load(open(HERE / "rep_readers.json", encoding="utf8"))
S = json.load(open(HERE / "rep_structure.json", encoding="utf8"))
READERS = ["unroller", "unroller_cp", "music21", "pt_max", "pt_max_noleap", "pt_min"]


def val(r, k):
    v = r.get(k)
    return v if isinstance(v, int) else None


out = {}
# 1. which readers ran
print("== readers: ran / errors / could not (None) over", len(R), "files")
for k in READERS:
    ran = sum(1 for r in R.values() if val(r, k) is not None)
    err = sum(1 for r in R.values() if isinstance(r.get(k), str))
    none = sum(1 for r in R.values() if r.get(k) is None)
    print(f"  {k}: gave a count {ran}, error {err}, none (not expandable) {none}")
    out.setdefault("ran", {})[k] = {"count": ran, "error": err, "none": none}
    if err:
        print("     errors:", [(i, r[k]) for i, r in R.items() if isinstance(r.get(k), str)][:5])

# 2. split by pipeline and jump words
def grp(i):
    return (S[i]["pipeline"], "jump words" if S[i]["jump_words"] else "no jump words")

print("\n== files by group")
cnt = collections.Counter(grp(i) for i in R)
for g, n in sorted(cnt.items()):
    print("  ", g, n)

# 3. pairwise agreement
def agree_table(a, b, label):
    c = collections.defaultdict(collections.Counter)
    for i, r in R.items():
        va, vb = val(r, a), val(r, b)
        g = grp(i)
        if va is None or vb is None:
            c[g]["cannot (one reader gave no count)"] += 1
        elif va == vb:
            c[g]["agree"] += 1
        else:
            c[g]["disagree"] += 1
    print(f"\n== {label}: {a} vs {b}")
    tot = collections.Counter()
    for g in sorted(c):
        print("  ", g, dict(c[g]))
        tot.update(c[g])
    print("   all:", dict(tot))
    return {f"{g[0]}|{g[1]}": dict(v) for g, v in c.items()} | {"all": dict(tot)}

out["pairs"] = {}
for a, b in [("unroller", "music21"), ("unroller", "pt_max_noleap"), ("unroller", "pt_max"), ("unroller", "pt_min"), ("music21", "pt_max_noleap"),
             ("unroller_cp", "music21"), ("unroller_cp", "pt_max_noleap")]:
    out["pairs"][f"{a}~{b}"] = agree_table(a, b, "agreement")

# 4. three-way: unroller (+cp) / music21 / partitura (no-leap)
print("\n== all three readers (unroller_cp, music21, pt_max_noleap) give the same count, on files where all three gave one")
c3 = collections.Counter()
for i, r in R.items():
    v = [val(r, k) for k in ("unroller_cp", "music21", "pt_max_noleap")]
    if None in v:
        c3["a reader gave no count"] += 1
    elif len(set(v)) == 1:
        c3["all three equal"] += 1
    else:
        c3["not all equal"] += 1
print("  ", dict(c3))
out["three_way_cp"] = dict(c3)
c3 = collections.Counter()
for i, r in R.items():
    v = [val(r, k) for k in ("unroller", "music21", "pt_max_noleap")]
    if None in v:
        c3["a reader gave no count"] += 1
    elif len(set(v)) == 1:
        c3["all three equal"] += 1
    else:
        c3["not all equal"] += 1
print("  with the unroller as it is (no coda-pair fix):", dict(c3))
out["three_way"] = dict(c3)

# 5. unroller vs unroller_cp: which files change
chg = [(i, r["unroller"], r["unroller_cp"], r.get("music21")) for i, r in R.items() if r["unroller"] != r["unroller_cp"]]
print("\n== files where the coda-pair fix changes the unroller's count:", len(chg))
for x in chg:
    print("  ", x)
out["cp_changes"] = chg

# 6. disagreement list: any pair of {unroller, unroller_cp, music21, pt_max_noleap} unequal where all gave counts, or music21 None
dis = []
for i, r in sorted(R.items()):
    vals = {k: r.get(k) for k in ("unroller", "unroller_cp", "music21", "pt_max_noleap", "pt_max", "pt_min")}
    ints = {k: v for k, v in vals.items() if isinstance(v, int)}
    core = [vals["unroller"], vals["unroller_cp"], vals["music21"], vals["pt_max_noleap"]]
    if len(set(v for v in core if isinstance(v, int))) > 1 or any(not isinstance(v, int) for v in core):
        dis.append({"id": i, **vals, "printed": r["printed"], "pipeline": S[i]["pipeline"], "jump": bool(S[i]["jump_words"]), "structure": S[i]["structure"]})
out["n_disagree_any"] = len(dis)
json.dump(dis, open(HERE / "rep_disagreements.json", "w", encoding="utf8"), indent=1, ensure_ascii=False)
json.dump(out, open(HERE / "rep_analysis.json", "w", encoding="utf8"), indent=1, ensure_ascii=False)
print("\n== files where the four readers (unroller, unroller_cp, music21, pt_max_noleap) are not all equal or one gave no count:", len(dis), "-> rep_disagreements.json")
