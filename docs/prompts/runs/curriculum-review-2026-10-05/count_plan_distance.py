"""Count the distance from "plan finished" (INTAKE-GATE.md section (d)). Read-only.

    PYTHONIOENCODING=utf-8 py -3.11 docs/prompts/runs/curriculum-review-2026-10-05/count_plan_distance.py

What it counts, and from where
1. Stations without a decided source: ABILITY-MAP.md section 2, the four-row station table of
   every "#### A<id>" block, with each later line of the same block of the form
   "(<code>, <STATION>...): State <X> -> <Y>" applied (the first "-> <Y>" on the line wins). Lines
   that change a state in other words (for example the PARALLEL-UNBLOCKS consumption lines) are
   NOT applied; the script lists every block line that names a State without the arrow form, for a
   hand check.
2. Real scores the plan names that have no intake record: every PDMX CID (Qm + 44 base58
   characters) in ABILITY-MAP.md, split into shipped (the CID is in content/sources/pdmx.json) and
   not shipped. Every not-shipped CID needs the intake gate before it can be admitted. The IM-n ids
   of section 5.4 and the amendments are counted beside it.
3. Intake records: files intake/*.md beside this script whose "Curriculum admission:" line says
   ADMITTED. None exist on the day this was written; the probe writes the first.
4. Open questions: ABILITY-MAP.md section 8.6, its numbered items and the "(n)" sub-items of
   item 10, classified by the HAND list CLASSIFY below (closed, listener-only, out of scope by the
   owner's 2026-10-05 decision on copyright, or open). The classification is a reading, not a
   parse; change the list, not the code, when an item closes. An item the list does not know
   makes the script exit 1.
5. The gate specified: INTAKE-GATE.md exists and carries its five section headings (a)-(e).

What it does not count: a per-rung decision. The map is keyed by ability block and station, not by
rung; the rung each station serves is named in prose ("Tracks:" lines) and is not parsed here.
"""
from __future__ import annotations

import json
import re
import sys
from collections import Counter, OrderedDict
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
MAP = (HERE / "ABILITY-MAP.md").read_text(encoding="utf-8").splitlines()
GATE = HERE / "INTAKE-GATE.md"
PDMX = ROOT / "content" / "sources" / "pdmx.json"
STATIONS = ["CONTROL", "MODEL/TRANSFER", "MUSIC", "INDEPENDENCE"]
STATES = ["EXISTING", "REPAIR", "NEW", "SOURCE-NEEDED", "SHARED", "NO-SEPARATE-ARTIFACT"]
CID = re.compile(r"\bQm[1-9A-HJ-NP-Za-km-z]{44}\b")
ARROW = re.compile(
    r"\(([^,()]+),\s*(CONTROL|MODEL/TRANSFER|MUSIC|INDEPENDENCE)[^)]*\):\s*State\s+([A-Z-]+)\s*->\s*([A-Z-]+)"
)
# The same, with the station first: "(MODEL/TRANSFER, a candidate ...): State REPAIR -> REPAIR".
ARROW_STATION_FIRST = re.compile(
    r"\((CONTROL|MODEL/TRANSFER|MUSIC|INDEPENDENCE)(),[^)]*\):\s*State\s+([A-Z-]+)\s*->\s*([A-Z-]+)"
)
# State changes the map states in prose, read by hand on 2026-10-06 (block, station) -> state.
# A7c.3 CONTROL: "State SOURCE-NEEDED -> contract supplied for CONTROL" (PARALLEL-UNBLOCKS section 1, line 470):
# the source is decided (one basic bossa bass pattern and its contract); the build waits for its brief.
HAND_STATES = {("A7c.3", "CONTROL"): ("NEW", "PARALLEL-UNBLOCKS section 1, contract supplied")}

# Section 8.6, read by hand on 2026-10-06. Keys are the item numbers as printed ("10.3" is item 10's "(3)").
CLASSIFY = {
    "1": "open",
    "2": "open",
    "3": "open",
    "4": "out-of-scope (copyright and the public build, owner 2026-10-05)",
    "5": "open",
    "6": "open",
    "7": "open",
    "8": "open",
    "9": "listener-only",
    "10.1": "out-of-scope (copyright and the public build, owner 2026-10-05)",
    "10.2": "open",
    "10.3": "closed (item 11 b)",
    "10.4": "closed (item 11 a)",
    "10.5": "open",
    "10.6": "open",
    "10.7": "open (the probe answers it)",
    "10.8": "open",
    "10.9": "open",
    "10.10": "open",
    "10.11": "listener-only",
    "11": "closed (11 a and b are themselves closures)",
}


def section(lines, head):
    start = next(i for i, l in enumerate(lines) if l.startswith(head))
    level = len(head.split(" ")[0])
    end = next(
        (i for i in range(start + 1, len(lines)) if lines[i].startswith("#") and len(lines[i].split(" ")[0]) <= level),
        len(lines),
    )
    return lines[start:end]


# 1. stations
blocks = OrderedDict()
cur = None
for l in section(MAP, "## 2."):
    m = re.match(r"#### (A\d+[a-z]?\.\d+) ", l)
    if m:
        cur = m.group(1)
        blocks[cur] = {"stations": OrderedDict(), "lines": []}
        continue
    if l.startswith("### "):
        cur = None
    if cur is None:
        continue
    cells = [c.strip() for c in l.strip().strip("|").split("|")] if l.startswith("| ") else []
    if len(cells) == 4 and cells[0] in STATIONS and cells[2] in STATES:
        blocks[cur]["stations"][cells[0]] = cells[2]
    else:
        blocks[cur]["lines"].append(l)

before, after = Counter(), Counter()
applied, unparsed, source_needed = [], [], []
for bid, b in blocks.items():
    final = dict(b["stations"])
    for l in b["lines"]:
        m = ARROW.search(l)
        m2 = None if m else ARROW_STATION_FIRST.search(l)
        if m or m2:
            if m:
                code, st, _x, y = m.groups()
            else:
                st, code, _x, y = m2.groups()
                code = "station first"
            if st in final and y in STATES:
                applied.append(f"{bid} {st}: {final[st]} -> {y} ({code.strip()})")
                final[st] = y
        elif re.search(r"\bState\b", l) and l.lstrip().startswith("-"):
            unparsed.append(f"{bid}: {l.strip()[:110]}")
    for (hb, hs), (y, why) in HAND_STATES.items():
        if hb == bid and hs in final:
            applied.append(f"{bid} {hs}: {final[hs]} -> {y} (by hand: {why})")
            final[hs] = y
    for s in b["stations"].values():
        before[s] += 1
    for st, s in final.items():
        after[s] += 1
        if s == "SOURCE-NEEDED":
            source_needed.append(f"{bid} {st}")

# 2. CIDs and IM ids
text = "\n".join(MAP)
cids = sorted(set(CID.findall(text)))
shipped_cids = set(CID.findall(PDMX.read_text(encoding="utf-8"))) if PDMX.exists() else set()
shipped = [c for c in cids if c in shipped_cids]
unshipped = [c for c in cids if c not in shipped_cids]
im_ids = sorted(set(re.findall(r"\bIM-\d+\b", text)), key=lambda s: int(s[3:]))

# 3. intake records
records = sorted((HERE / "intake").glob("*.md")) if (HERE / "intake").is_dir() else []
admitted = [
    p.name for p in records if re.search(r"^Curriculum admission:\s*ADMITTED", p.read_text(encoding="utf-8"), re.M)
]

# 4. open questions in 8.6
items = []
for l in section(MAP, "### 8.6"):
    m = re.match(r"(\d+)\. ", l)
    if not m:
        continue
    if m.group(1) == "10":
        items += [f"10.{s}" for s in dict.fromkeys(re.findall(r"\((\d+)\) ", l))]
    else:
        items.append(m.group(1))
klass = Counter()
unclassified = [i for i in items if i not in CLASSIFY]
for i in items:
    if i in CLASSIFY:
        klass[CLASSIFY[i].split(" ")[0]] += 1
open_items = [i for i in items if CLASSIFY.get(i, "").startswith("open")]

# 5. gate
gate_text = GATE.read_text(encoding="utf-8") if GATE.exists() else ""
gate_heads = [h for h in ("(a)", "(b)", "(c)", "(d)", "(e)") if re.search(rf"^## {re.escape(h)} ", gate_text, re.M)]
gate_ok = len(gate_heads) == 5

print("PLAN DISTANCE (count_plan_distance.py)")
print(f"Stations: {sum(before.values())} in {len(blocks)} blocks; as tabled: " + ", ".join(f"{s} {before[s]}" for s in STATES))
print(f"  after {len(applied)} 'State X -> Y' amendment lines: " + ", ".join(f"{s} {after[s]}" for s in STATES))
for a in applied:
    print(f"    applied: {a}")
print(f"  stations with no decided source (SOURCE-NEEDED after amendments): {len(source_needed)}")
for s in source_needed:
    print(f"    {s}")
print(f"  block lines naming a State without the arrow form (not applied; read by hand): {len(unparsed)}")
for u in unparsed:
    print(f"    {u}")
print(f"PDMX CIDs named in the map: {len(cids)}; shipped {len(shipped)}; not shipped (need the intake gate) {len(unshipped)}")
print(f"IM ids named: {len(im_ids)} ({', '.join(im_ids)})")
print(f"Intake records: {len(records)}; admitted to the curriculum: {len(admitted)}")
print(
    f"Section 8.6 items: {len(items)}; "
    + ", ".join(f"{k} {v}" for k, v in sorted(klass.items()))
    + (f"; UNCLASSIFIED {unclassified}" if unclassified else "")
)
print(f"  open (not listener-only, not closed, not out of scope): {len(open_items)} ({', '.join(open_items)})")
print(f"Gate specified: {'yes' if gate_ok else 'no'} ({len(gate_heads)}/5 section headings in INTAKE-GATE.md)")
imports_open = len(im_ids) - len(admitted)
print(
    f"DISTANCE: {len(source_needed)} stations without a decided source + {imports_open} imports (IM ids) without a "
    f"curriculum admission + {len(open_items)} open questions + {0 if gate_ok else 1} gate not specified"
)
print(
    f"  ceiling beside it: {len(unshipped)} PDMX CIDs named in the map and not shipped (includes comparison editions "
    f"and optional-shelf scores; which ones a station depends on is not parsed)"
)
sys.exit(1 if unclassified else 0)
