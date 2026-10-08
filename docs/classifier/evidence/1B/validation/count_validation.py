"""Counts for the 1.B validation: rule statuses and threshold bases, from area-1B.md and validation.md."""
import re, collections
from pathlib import Path
WT = Path(__file__).resolve().parents[2]
page = (WT / "docs/classifier/rules/area-1B.md").read_text(encoding="utf-8")
val = (WT / "docs/classifier/audits/rules-1B/validation.md").read_text(encoding="utf-8")


def basis_kind(cell):
    c = cell.strip().replace("*", "").lower().replace("validated: in part", "validated in part")
    for k in ("sourced + validated", "validated in part", "validated against false positives only", "validated on built files",
              "validated as computed", "validated", "sourced", "failing", "open", "reused", "neither"):
        if c.startswith(k):
            return k
    return "?" + c[:30]


# area-1B.md: per section, the threshold tables' basis column and the status line
secs = re.split(r"\n## (\d+)\. ", page)
per = {}
status = {}
for i in range(1, len(secs), 2):
    n, body = int(secs[i]), secs[i + 1]
    name = body.split("\n", 1)[0].strip()
    kinds = []
    for tab in re.findall(r"\| threshold \| value \| basis \|\n\| --- \| --- \| --- \|\n((?:\|.*\|\n)+)", body):
        for row in tab.strip().split("\n"):
            cells = [c for c in row.split(" | ")]
            kinds.append(basis_kind(cells[-1].rstrip("|").strip()))
    per[(n, name)] = collections.Counter(kinds)
    m = re.search(r"\*\*Validation status: (\w+)", body)
    status[(n, name)] = m.group(1) if m else None
tot = collections.Counter()
for k, c in per.items():
    tot.update(c)
    print(k[0], k[1], "| status:", status[k], "| thresholds:", dict(c))
print("area-1B.md thresholds total:", sum(tot.values()), dict(tot))
print("area-1B.md statuses:", dict(collections.Counter(status.values())))
# validation.md: rules table statuses, thresholds table bases
rules = re.search(r"## Rules \(one line each\)\n\n(.*?)\n\n## ", val, re.S).group(1)
st = collections.Counter(re.search(r"\*\*(\w+)\*\*", r).group(1) for r in rules.split("\n")[2:])
print("validation.md rule lines:", sum(st.values()), dict(st))
th = re.search(r"## Thresholds.*?\n\n(.*?)\n\n## ", val, re.S).group(1)
tk = collections.Counter(basis_kind(r.split(" | ")[-1].rstrip("|")) for r in th.split("\n")[2:])
print("validation.md threshold lines:", sum(tk.values()), dict(tk))
rd = re.search(r"## The applier's own readings, tested\n\n.*?\n\n(.*?)\n\n## ", val, re.S).group(1)
print("validation.md readings tested:", len(rd.split("\n")[2:]))
