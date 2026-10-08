"""count_page.py: over docs/classifier/rules/area-1C.md: the threshold table's rows by label (first word of the label
cell), the sections (## headings that are characteristic ids), and the 'Validation status' lines by status word."""
import re, sys
from collections import Counter
from pathlib import Path
WT = Path(__file__).resolve().parents[2]
t = (WT / "docs/classifier/rules/area-1C.md").read_text(encoding="utf-8")
rows = re.findall(r"^\| (T\d+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \|", t, re.M)
labels = Counter(r[3].strip().split()[0].strip("*,;:") for r in rows)
print("threshold rows:", len(rows), "ids unique:", len({r[0] for r in rows}), dict(labels))
secs = re.findall(r"^## ([a-z]+\.[a-z0-9.-]+)\s*$", t, re.M)
print("sections:", len(secs))
st = re.findall(r"^\*\*Validation status \(2026-10-08\): (\w+)", t, re.M)
print("status lines:", len(st), dict(Counter(st)))
missing = [s for s in secs if not re.search(r"^## " + re.escape(s) + r"\s*$.*?^\*\*Validation status", t, re.M | re.S)]
print("sections:", secs)
