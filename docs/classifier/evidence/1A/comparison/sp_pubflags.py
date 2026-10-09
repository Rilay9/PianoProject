"""The kind-2 flags on the published scores, listed (39 flags in 14 pieces) -> frag_pubflags.md, so a reader can judge each one."""
from cmp_common import *
import collections

rows, kinds = [], collections.Counter()
for s in ("wir", "m21ch", "m21kb"):
    for x in json.load(open(HERE / f"sp_results_{s}.json", encoding="utf8")):
        if x.get("kind2"):
            c = collections.Counter((f[1][:-1], f[2], f[3]) for f in x["kind2_flags"])
            bars = sorted({f[0] + 1 for f in x["kind2_flags"]})
            for (w, p, k), n in sorted(c.items()):
                kinds[(w, p)] += n
            rows.append(f"| {x['label'].replace('Corpus/', '')} | {x['n_notes']} | {x['kind2']} | " + "; ".join(f"{n} x {w} (ps13 {p}, PKSpell {k})" for (w, p, k), n in sorted(c.items())) + f" | bars {', '.join(map(str, bars))} |")
head = ["| piece | notes | kind-2 flags | written (what ps13 and PKSpell say instead) | bars (1-based) |", "| --- | --- | --- | --- | --- |"]
tail = ["", "By written spelling: " + "; ".join(f"{w} (estimated {p}) {n}" for (w, p), n in sorted(kinds.items(), key=lambda kv: -kv[1])) + "."]
(HERE / "frag_pubflags.md").write_text("\n".join(head + rows + tail) + "\n", encoding="utf8")
print("\n".join(head + rows + tail))
