"""Count the distance from "plan finished" (INTAKE-GATE.md section (d)). Read-only.

    PYTHONIOENCODING=utf-8 py -3.11 docs/prompts/runs/curriculum-review-2026-10-05/count_plan_distance.py

The definition it measures (INTAKE-GATE.md (d), the reviewer's unit, docs/review/responses/b8b96730.md 1a):
the plan is finished when every required ability station has a decided supply or disposition (no
SOURCE-NEEDED station remains), the map's existing trace still covers every MUST and accepted target
row, the intake gate is specified, every required import has a terminal disposition, and no
unresolved question remains except an explicitly listener-only or owner-only one.

What it counts, and from where
1. Stations without a decided supply: ABILITY-MAP.md section 2, the four-row station table of every
   "#### A<id>" block, with each later line of the same block of the form
   "(<code>, <STATION>...): State <X> -> <Y>" (or with the station first) applied. A state the map
   changes in other words is applied only through the HAND list HAND_STATES; every other block line
   naming a State without the arrow form is printed for a hand check.
2. The trace: count_ability_map.py (beside this script) is run, and its exit code is the trace check
   (every MUST and accepted target row cited by a block or a W disposition). This script does not
   infer rung ids from prose.
3. Import dispositions: the HAND list IM_DISPOSITIONS, one line per asset an IM id names (IM-3,
   IM-10 and IM-14 name two each; IM-5 is conditional on W14 choosing "replace"), each with its
   status read from the map's IM row or amendment line (cited by line). Terminal statuses are
   ADMITTED, REJECTED, NOT NEEDED and SUPERSEDED; anything else is unresolved and counts as distance.
   The script exits 1 when an IM id in the map has no line here, or a line names an id the map
   does not have. Intake records (intake/*.md) are counted beside it, not subtracted.
4. Open questions: ABILITY-MAP.md section 8.6, its numbered items and the "(n)" sub-items of item
   10, classified by the HAND list CLASSIFY (closed, listener-only, owner-only, or open). An item
   the list does not know makes the script exit 1.
5. The gate specified: INTAKE-GATE.md exists and carries its five section headings (a)-(e).

Beside the distance it prints a ceiling: the PDMX CIDs the map names that content/sources/pdmx.json
does not hold. It reads the map as it is on disk; the numbers are a reading of the map, not of
records the map has not consumed.
"""
from __future__ import annotations

import re
import subprocess
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
TERMINAL = ("ADMITTED", "REJECTED", "NOT NEEDED", "SUPERSEDED")
CID = re.compile(r"\bQm[1-9A-HJ-NP-Za-km-z]{44}\b")
ARROW = re.compile(
    r"\(([^,()]+),\s*(CONTROL|MODEL/TRANSFER|MUSIC|INDEPENDENCE)[^)]*\):\s*State\s+([A-Z-]+)\s*->\s*([A-Z-]+)"
)
ARROW_STATION_FIRST = re.compile(
    r"\((CONTROL|MODEL/TRANSFER|MUSIC|INDEPENDENCE)(),[^)]*\):\s*State\s+([A-Z-]+)\s*->\s*([A-Z-]+)"
)

# State changes the map states in prose, read by hand on 2026-10-06: (block, station) -> (state, why).
HAND_STATES = {
    ("A7c.3", "CONTROL"): ("NEW", "map :470, PARALLEL-UNBLOCKS section 1: 'contract supplied for CONTROL'"),
}

# One line per asset an IM id names, read by hand from the map on 2026-10-06 (map as committed at b8b96730).
# (IM id, asset, status, where the status is read). Only TERMINAL statuses leave the distance.
IM_DISPOSITIONS = [
    ("IM-1", "Harlem Rag, Tyers edition", "CANDIDATE until read", ":935, :941"),
    ("IM-2", "Libertango two-staff arrangement", "candidate (admissions separate)", ":936"),
    ("IM-3", "Bizet, Habanera", "CANDIDATE (the probe runs it)", ":937, :1181"),
    ("IM-3", "Contra Danza", "REJECTED", ":1181, 'cannot serve this row' (its left hand prints no habanera bar)"),
    ("IM-4", "O Christmas Tree source edition", "fix of a shipped score, not done in the map", ":938"),
    ("IM-5", "single-line Joyful, Joyful (only if W14 chooses replace)", "CANDIDATE, conditional", ":939, :84"),
    ("IM-6", "Garota de Ipanema", "candidate, not imported", ":461, :941"),
    ("IM-7", "Original Jelly Roll Blues", "candidate, not imported", ":314, :941"),
    ("IM-8", "Pinetop's Boogie Woogie, Parham edition", "candidate, not imported", ":314, :941"),
    ("IM-9", "Blues Riff in C", "candidate, not imported", ":315, :941"),
    ("IM-10", "After You've Gone", "candidate, not imported", ":396, :941"),
    ("IM-10", "Autumn Leaves transcription", "candidate, waits for passages", ":396"),
    ("IM-11", "There Will Never Be Another You", "candidate, not imported", ":701-702, :941"),
    ("IM-12", "Blue Bossa", "candidate, not imported", ":462, :941"),
    ("IM-13", "La Negra Tiene Tumbao", "candidate, not imported", ":439, :941"),
    ("IM-14", "Maoz Tzur", "candidate, not imported", ":638, :941"),
    ("IM-14", "Dreidel Song", "candidate, not imported", ":638, :941"),
]

# Section 8.6, read by hand on 2026-10-06. Keys are the item numbers as printed ("10.3" is item 10's "(3)").
CLASSIFY = {
    "1": "open",
    "2": "open",
    "3": "open",
    "4": "owner-only (copyright and the public build, closed as out of scope by the owner 2026-10-05)",
    "5": "open",
    "6": "open",
    "7": "open",
    "8": "open",
    "9": "listener-only",
    "10.1": "owner-only (copyright and the public build, closed as out of scope by the owner 2026-10-05)",
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


failures = []

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

# 2. the trace
trace = subprocess.run([sys.executable, str(HERE / "count_ability_map.py")], capture_output=True, text=True,
                       encoding="utf-8", errors="replace")
trace_ok = trace.returncode == 0

# 3. import dispositions
text = "\n".join(MAP)
im_in_map = set(re.findall(r"\bIM-\d+\b", text))
im_listed = {d[0] for d in IM_DISPOSITIONS}
for missing in sorted(im_in_map - im_listed, key=lambda s: int(s[3:])):
    failures.append(f"{missing} is in the map and has no line in IM_DISPOSITIONS")
for extra in sorted(im_listed - im_in_map, key=lambda s: int(s[3:])):
    failures.append(f"{extra} has a line in IM_DISPOSITIONS and is not in the map")
terminal = [d for d in IM_DISPOSITIONS if d[2].startswith(TERMINAL)]
unresolved = [d for d in IM_DISPOSITIONS if not d[2].startswith(TERMINAL)]
records = sorted((HERE / "intake").glob("*.md")) if (HERE / "intake").is_dir() else []
admitted = [
    p.name for p in records if re.search(r"^Curriculum admission:\s*ADMITTED", p.read_text(encoding="utf-8"), re.M)
]
cids = sorted(set(CID.findall(text)))
shipped_cids = set(CID.findall(PDMX.read_text(encoding="utf-8"))) if PDMX.exists() else set()
unshipped = [c for c in cids if c not in shipped_cids]

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
for i in items:
    if i not in CLASSIFY:
        failures.append(f"section 8.6 item {i} is not classified")
klass = Counter(CLASSIFY[i].split(" ")[0] for i in items if i in CLASSIFY)
open_items = [i for i in items if CLASSIFY.get(i, "").startswith("open")]

# 5. gate
gate_text = GATE.read_text(encoding="utf-8") if GATE.exists() else ""
gate_heads = [h for h in ("(a)", "(b)", "(c)", "(d)", "(e)") if re.search(rf"^## {re.escape(h)} ", gate_text, re.M)]
gate_ok = len(gate_heads) == 5

print("PLAN DISTANCE (count_plan_distance.py)")
print(f"Stations: {sum(before.values())} in {len(blocks)} blocks; as tabled: " + ", ".join(f"{s} {before[s]}" for s in STATES))
print(f"  after {len(applied)} state lines applied: " + ", ".join(f"{s} {after[s]}" for s in STATES))
for a in applied:
    print(f"    applied: {a}")
print(f"  stations without a decided supply (SOURCE-NEEDED): {len(source_needed)}")
for s in source_needed:
    print(f"    {s}")
print(f"  block lines naming a State without the arrow form (read by hand): {len(unparsed)}")
for u in unparsed:
    print(f"    {u}")
print(f"Trace (count_ability_map.py): {'OK, exit 0' if trace_ok else f'FAILED, exit {trace.returncode}'}")
print(f"Import dispositions: {len(IM_DISPOSITIONS)} assets under {len(im_listed)} IM ids; terminal {len(terminal)}; "
      f"unresolved {len(unresolved)}")
for d in IM_DISPOSITIONS:
    print(f"    {d[0]:6} {d[1]}: {d[2]} ({d[3]})")
print(f"  intake records: {len(records)}; with a curriculum admission: {len(admitted)} (read beside the list, not subtracted)")
print(f"Section 8.6 items: {len(items)}; " + ", ".join(f"{k} {v}" for k, v in sorted(klass.items())))
print(f"  open (not listener-only, not owner-only, not closed): {len(open_items)} ({', '.join(open_items)})")
print(f"Gate specified: {'yes' if gate_ok else 'no'} ({len(gate_heads)}/5 section headings in INTAKE-GATE.md)")
for f in failures:
    print(f"FAILURE: {f}")
print(
    f"DISTANCE: {len(source_needed)} stations without a decided supply + {len(unresolved)} unresolved import "
    f"dispositions + {len(open_items)} open questions + {0 if gate_ok else 1} gate not specified + "
    f"{0 if trace_ok else 1} trace failing"
)
print(f"  ceiling beside it: {len(unshipped)} PDMX CIDs named in the map and not in pdmx.json")
sys.exit(1 if failures else 0)
