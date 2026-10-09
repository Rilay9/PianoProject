"""frag_named.md: the validation row's named false flags (test 2b) and kind-2 candidates, flag by flag, from sp_named.json.

'flagged' = the method flags it (kept); 'cleared' = test 2b flags it and the fix clears it; '-' = the method does not flag it.
Note-level methods (ps13, PKSpell, the gate, both) flag a pair when either of its notes is flagged.
"""
from cmp_common import *

R = json.load(open(HERE / "sp_named.json", encoding="utf8"))


def v(h, kd):
    return "flagged" if h[kd] else "-"


def fixv(h, k):
    return "flagged" if h[k] else f"cleared ({h['cleared']})"


lines = ["**Test 2b's false flags named in the validation row (each pair is a correct spelling).** Columns: test 2b as it stands; fix v1; fix v2; kind 2 (PS13 + gate); ps13 raw; PKSpell raw; PKSpell + gate.\n",
         "| item | pair (bar, as written) | interval | test 2b | fix v1 | fix v2 | kind 2 | ps13 raw | PKSpell raw | PKSpell + gate |", "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |"]
tot = {}
for key, label in [("a_harm_minor", "A harmonic minor scale"), ("gs_harm_minor", "G-sharp harmonic minor scale"), ("chromatic_d", "chromatic D scale, right hand")]:
    for h in R[key]["t2b"]:
        lines.append(f"| {label} | {h['m'] + 1}: {h['a']} - {h['b']} | {h['iv']} | flagged | {fixv(h, 't2b_fix')} | {fixv(h, 't2b_fix2')} | {v(h, 'kind2')} | {v(h, 'ps13_diff')} | {v(h, 'pks_diff')} | {v(h, 'pks_gate')} |")
        t = tot.setdefault(label, [0, 0, 0, 0, 0, 0, 0]); t[0] += 1
        t[1] += h["t2b_fix"]; t[2] += h["t2b_fix2"]; t[3] += h["kind2"]; t[4] += h["ps13_diff"]; t[5] += h["pks_diff"]; t[6] += h["pks_gate"]
for h in R["inv9"]["t2b"]:
    if h["a"] in ("E5", "E4") and h["b"].startswith("D-"):
        lines.append(f"| Bach Invention 9 (F minor) | {h['m'] + 1}: {h['a']} - {h['b']} | {h['iv']} | flagged | {fixv(h, 't2b_fix')} | {fixv(h, 't2b_fix2')} | {v(h, 'kind2')} | {v(h, 'ps13_diff')} | {v(h, 'pks_diff')} | {v(h, 'pks_gate')} |")
lines.append("")
lines.append("Counts of flags kept (of the pairs listed per item): " + "; ".join(f"{k}: {t[0]} pairs, fix v1 keeps {t[1]}, fix v2 keeps {t[2]}, kind 2 flags {t[3]}, ps13 raw {t[4]}, PKSpell raw {t[5]}, PKSpell + gate {t[6]}" for k, t in tot.items()) + ".\n")
# Invention 9 whole
inv = R["inv9"]
k = sum(1 for h in inv["t2b"] if h["t2b_fix"]); k2 = sum(1 for h in inv["t2b"] if h["t2b_fix2"])
lines.append(f"**Bach Invention 9, all {len(inv['t2b'])} test-2b pairs:** fix v1 keeps {k}, fix v2 keeps {k2}; kind 2 flags {len(inv['kind2'])} notes (bars {', '.join(str(h['bar']) for h in inv['kind2'])}), ps13 and PKSpell give the same spelling for all {len(inv['kind2'])}.\n")
lines.append("**Kind-2 candidates, per item (what the two estimators say).**\n")
lines.append("| item | candidates | ps13 says | PKSpell says | file's signature |")
lines.append("| --- | --- | --- | --- | --- |")
import collections
for key in ("minecraft", "inv9", "arp_ab_min7", "arp_ab_halfdim"):
    r = R[key]
    c = collections.Counter((h["written"][:-1], h["ps13"], h["pks"]) for h in r["kind2"])
    for (w_, p_, k_), n in c.items():
        lines.append(f"| {key} | {n} x {w_} | {p_} | {k_} | {r['ks']} |")
(HERE / "frag_named.md").write_text("\n".join(lines) + "\n", encoding="utf8")
print("\n".join(lines))
