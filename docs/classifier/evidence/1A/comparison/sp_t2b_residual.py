"""What test 2b flags on the published scores, by interval, before and after the fix -> frag_t2bres.md, sp_t2b_residual.json."""
from cmp_common import *
import collections

allh = collections.Counter(); v1 = collections.Counter(); v2 = collections.Counter(); cl = collections.Counter()
for s in ("wir", "m21ch", "m21kb"):
    for x in json.load(open(HERE / f"sp_results_{s}.json", encoding="utf8")):
        for h in x.get("t2b_hits", []):
            iv = h["iv"].replace("Augmented", "aug").replace("Diminished", "dim")
            allh[iv] += 1
            cl[h["cleared"]] += 1
            if h["cleared"] in (None, "dim-unison"): v1[iv] += 1
            if h["cleared"] is None: v2[iv] += 1
rows = ["| interval (as music21 names it) | test 2b hits | kept by fix v1 | kept by fix v2 |", "| --- | --- | --- | --- |"]
for iv, n in allh.most_common(12):
    rows.append(f"| {iv} | {n:,} | {v1[iv]:,} | {v2[iv]:,} |")
rest = sum(allh.values()) - sum(n for _, n in allh.most_common(12))
rows.append(f"| other intervals | {rest:,} | {sum(v1.values()) - sum(v1[i] for i, _ in allh.most_common(12)):,} | {sum(v2.values()) - sum(v2[i] for i, _ in allh.most_common(12)):,} |")
rows.append(f"| **all** | {sum(allh.values()):,} | {sum(v1.values()):,} | {sum(v2.values()):,} |")
rows.append("")
rows.append("Cleared by: " + ", ".join(f"{k or 'not cleared'} {v:,}" for k, v in cl.most_common()) + ".")
(HERE / "frag_t2bres.md").write_text("\n".join(rows) + "\n", encoding="utf8")
json.dump({"all": allh, "v1": v1, "v2": v2, "cleared": {str(k): v for k, v in cl.items()}}, open(HERE / "sp_t2b_residual.json", "w"), indent=1)
print("\n".join(rows))
