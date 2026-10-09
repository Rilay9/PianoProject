"""reading.accidental-kinds, whole catalogue: the files where the emulation differs from the render, split into 'did not pair' (grace-note timeline drift)
and 'paired but differs', the 8 render errors, and the model's disagreement by pipeline. Reads out/f2_full_0/1.json."""
import json, collections
from pathlib import Path
HERE = Path(__file__).resolve().parent
res = {}
for s in (0, 1):
    res.update(json.load(open(HERE / f"out/f2_full_{s}.json", encoding="utf8")))
print("files:", len(res), "| errors:", [(i, r.get("error")) for i, r in res.items() if "error" in r or ("conf" not in r and "skipped" not in r)][:12])
secs = [r["seconds"] for r in res.values() if "seconds" in r]
print("render seconds per file: mean %.1f, max %.1f, total %.0f" % (sum(secs) / len(secs), max(secs), sum(secs)))
unp, paired_diff, exact = [], [], 0
mod_notes = collections.Counter(); emu_dis_paired = 0
for i, r in res.items():
    if "conf" not in r:
        continue
    d = 0
    for k, v in r["conf"].items():
        rd, fa, sh, dr = k.split("|")
        if rd == "emulation" and sh != dr:
            d += v
    if d == 0:
        exact += 1
    elif r["unmatched"].get("emu_no_partner", 0) >= 20 or r["unmatched"].get("render_no_partner_for_emulation", 0) >= 20 + 0 and r["unmatched"].get("emu_no_partner", 0) >= 1:
        unp.append((i, d))
    else:
        paired_diff.append((i, d, r["unmatched"]))
print("emulation exact:", exact, "| differs and did not pair (20+ unpaired emulation notes):", len(unp), "| differs but paired:", len(paired_diff))
for x in paired_diff[:40]:
    print("   paired-but-differs:", x)
print("unpaired files by pipeline:", dict(collections.Counter(res[i]["pipeline"] for i, d in unp)), "| nifc:", sum(1 for i, d in unp if i.endswith(".nifc")))
