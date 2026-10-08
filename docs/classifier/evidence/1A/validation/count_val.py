"""Counts for validation.md (sections 1 and 2) and a cross-check against area-1A.md's status lines; writes the block after <!-- counts -->."""
import re, collections
from pathlib import Path
from common import cache, BYID

ROOT = Path(__file__).resolve().parents[2]
V = ROOT / "docs/classifier/audits/rules-1A/validation.md"
A = ROOT / "docs/classifier/rules/area-1A.md"
t = V.read_text(encoding="utf8")
head, _, _ = t.partition("<!-- counts -->")
s1 = head.split("## 1. One line per rule")[1].split("## 2.")[0]
s2 = head.split("## 2. One line per threshold")[1].split("## 3.")[0]
rows1 = [r for r in s1.splitlines() if r.startswith("| ") and not r.startswith("| id ") and not r.startswith("| ---")]
rows2 = [r for r in s2.splitlines() if r.startswith("| ") and not r.startswith("| threshold") and not r.startswith("| ---")]
st = collections.Counter(r.split("|")[2].strip() for r in rows1)
ids1 = [r.split("|")[1].strip() for r in rows1]
page = collections.Counter(r.split("|")[2].strip() for r in rows2)
now = collections.Counter(re.split(r" \(", r.split("|")[3].strip())[0] for r in rows2)
# the area page's status lines
a = A.read_text(encoding="utf8")
secs = re.findall(r"^## (\d+)\. (\S+)\n\n\*\*Status \(validation, 2026-10-08\): (\w+)\.\*\*", a, re.M)
amap = {cid: s for _, cid, s in secs}
mism = [i for i in ids1 if amap.get(i) != dict((r.split("|")[1].strip(), r.split("|")[2].strip()) for r in rows1)[i]]
# list characteristics of section 1.A from the characteristics list, for the coverage check
cl = (ROOT / "docs/classifier/characteristics-list.md").read_text(encoding="utf8")
sec = cl.split("### 1.A")[1].split("### 1.B")[0] if "### 1.A" in cl else ""
listed = re.findall(r"^\| ([a-z]+\.[a-z0-9-]+)[ |]", sec, re.M)
# distinct time-modification ratios in the catalogue
ratios = set()
for i in BYID:
    for n in cache(i)["notes"]:
        if n["tmod"][0]:
            ratios.add(n["tmod"])
out = [
    f"- Rules: {len(rows1)} lines; characteristics in section 1.A of the list: {len(listed)}; missing from the table: {sorted(set(listed) - set(ids1)) or 'none'}; extra: {sorted(set(ids1) - set(listed)) or 'none'}.",
    "- Status: " + "; ".join(f"{k} {v}" for k, v in sorted(st.items())) + ".",
    f"- Status lines on area-1A.md: {len(secs)}; disagreeing with this table: {mism or 'none'}.",
    f"- Thresholds: {len(rows2)} lines. The page's basis: " + "; ".join(f"{k} {v}" for k, v in sorted(page.items())) + ".",
    "- Basis now: " + "; ".join(f"{k} {v}" for k, v in sorted(now.items())) + ".",
    f"- Distinct `<time-modification>` ratios in the catalogue (cited in the unusual-notation line): {len(ratios)}.",
]
V.write_text(head + "<!-- counts -->\n" + "\n".join(out) + "\n", encoding="utf8")
print("\n".join(out))
