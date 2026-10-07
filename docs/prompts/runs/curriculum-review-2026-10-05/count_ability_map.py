"""Count ABILITY-MAP.md and check that it traces every MUST row of CURRICULUM-UPGRADE.md.

Read-only. Run beside the two files:
    PYTHONIOENCODING=utf-8 py -3.11 count_ability_map.py

What it reads
- CURRICULUM-UPGRADE.md section 2: every table row under "### 2.N <track>" is one row,
  numbered <track>#<n> in table order (every class counted, as count_upgrade.py parses
  them). MUST rows, SHOULD rows, rows citing `[D]`, and the accepted new units (where or
  needs names "new `" or "new unit") are derived here, not typed in.
- ABILITY-MAP.md:
  * section 2 ability blocks: a "#### A<id> <name>" heading; a "- **Rows:**" line whose
    <track>#<n> tokens are the rows the block disposes; a station table with exactly four
    rows (CONTROL, MODEL/TRANSFER, MUSIC, INDEPENDENCE), each "| station | supply | STATE | mode |";
    lines "- **Falls through:**", "- **Measurement:**" (naming MIDI, self-checked, no actor)
    and "- **Completion:**" (naming CT-n);
  * section 2 correction table rows "| W<n> | <row ids> | ...";
  * section 2 lines "- SHOULD <track>#<n>: ..." (one SHOULD row each);
  * section 5 table rows "| CK-n |", "| CO-n |", "| IM-n |" (CK rows carry NEW or EXISTING);
  * section 6 headings "### Wave 1(a)" .. "### Wave 1(d)", each with the six rationale labels;
  * section 8 table rows "| C<n> |" (MUST/SHOULD conflicts) and "| CT-n |" (completion treatments).

Checks (exit 1 on any failure)
- station states are one of the six; the state counts sum to the station total;
- every mode is in the vocabulary below (one or more joined by " + ") or "—";
- every target row (MUST rows plus accepted additions) is cited by an ability block or a
  W row; no non-target row is cited as a MUST disposition; every SHOULD row (other than an
  accepted addition) has a SHOULD line;
- every block whose rows include a dossier-dependent row carries "[D-gate]";
- every block names the station it falls through at, a measurement line and a completion line.
"""
import re
import sys
from collections import Counter, OrderedDict
from pathlib import Path

HERE = Path(__file__).resolve().parent
UPGRADE = (HERE / "CURRICULUM-UPGRADE.md").read_text(encoding="utf-8").splitlines()
MAP = (HERE / "ABILITY-MAP.md").read_text(encoding="utf-8").splitlines()

CLASSES = ["MUST", "SHOULD", "NICE", "REJECT", "ALREADY"]
STATIONS = ["CONTROL", "MODEL/TRANSFER", "MUSIC", "INDEPENDENCE"]
STATES = ["EXISTING", "REPAIR", "NEW", "SOURCE-NEEDED", "SHARED", "NO-SEPARATE-ARTIFACT"]
# Canonical mode names, one per MODE-SHEET.md block (section 33 summary table).
MODES = [
    "Wait for me", "Keep tempo", "Play it to me", "Score Free play", "Free play", "Simon",
    "Lab: Read it", "Lab: Jam it", "Lab: Hold the chords", "Lab: Play the tune",
    "Trading fours", "Perform", "Blind", "Loop", "Ladder", "Duet", "Rhythm only",
    "Chord chart", "Daily sight-read", "Note flash", "Find the key", "Ear: interval / chord",
    "Ear: cadence / progression", "Melodic dictation", "Harmonic dictation", "Rhythm drill",
    "Tune playback", "Theory drills", "Pedal / dynamics", "Backing track", "Paper",
    "Checklist", "Metronome", "PDF viewer",
]
NO_MODE = "—"
RATIONALE = ["Learner problem", "Solution classes considered", "Chosen path",
             "What would reverse it", "Real problem or proxy", "Remaining uncertainty"]
ROW_ID = re.compile(r"\b([a-z]+(?:-[a-z]+)?#\d+)\b")
errors = []


def section(lines, num, prefix="## "):
    start = next(i for i, l in enumerate(lines) if l.startswith(f"{prefix}{num}."))
    end = next((i for i in range(start + 1, len(lines)) if lines[i].startswith(prefix)), len(lines))
    return lines[start:end]


# ---------------------------------------------------------------- upgrade rows
rows = OrderedDict()
track, n = None, 0
for l in section(UPGRADE, 2):
    m = re.match(r"### 2\.\d+ (\S+)", l)
    if m:
        track, n = m.group(1), 0
        continue
    if not l.startswith("|") or l.startswith("| Item ") or l.startswith("| ---"):
        continue
    cells = [c.strip() for c in l.strip().strip("|").split("|")]
    if len(cells) != 5:
        errors.append(f"upgrade {track}: {len(cells)} cells")
        continue
    n += 1
    item, cls, where, evidence, needs = cells
    found = [c for c in CLASSES if re.search(rf"\b{c}\b", cls)]
    if len(found) != 1:
        errors.append(f"upgrade {track}#{n}: class cell {cls!r}")
        continue
    rows[f"{track}#{n}"] = dict(cls=found[0], item=item, where=where, evidence=evidence, needs=needs)

must = [r for r, v in rows.items() if v["cls"] == "MUST"]
should = [r for r, v in rows.items() if v["cls"] == "SHOULD"]
accepted = [r for r, v in rows.items()
            if v["cls"] in ("MUST", "SHOULD") and re.search(r"new `|new unit", v["where"] + " " + v["needs"])]
dossier = {r for r, v in rows.items() if v["cls"] in ("MUST", "SHOULD") and "`[D]`" in v["evidence"]}
target = list(OrderedDict.fromkeys(must + accepted))
if len(accepted) != 5:
    errors.append(f"accepted additions found {len(accepted)}, expected 5: {accepted}")

# ---------------------------------------------------------------- map: section 2
s2 = section(MAP, 2)
blocks = OrderedDict()
cur = None
w_rows = OrderedDict()
should_lines = []
for l in s2:
    m = re.match(r"#### (A\d+[a-z]?\.\d+) (.+)", l)
    if m:
        cur = m.group(1)
        if cur in blocks:
            errors.append(f"duplicate block {cur}")
        blocks[cur] = dict(name=m.group(2).strip(), rows=[], stations=[], text=[l],
                           falls=None, measure=None, completion=None)
        continue
    if l.startswith("### "):
        cur = None
    mw = re.match(r"\| (W\d+) \|([^|]*)\|", l)
    if mw:
        cur = None
        w_rows[mw.group(1)] = ROW_ID.findall(mw.group(2))
        continue
    ms = re.match(r"- SHOULD ([a-z]+(?:-[a-z]+)?#\d+)", l)
    if ms:
        should_lines.append(ms.group(1))
        continue
    if cur is None:
        continue
    b = blocks[cur]
    b["text"].append(l)
    if l.startswith("- **Rows:**"):
        b["rows"] += ROW_ID.findall(l)
    elif l.startswith("- **Falls through:**"):
        b["falls"] = l
    elif l.startswith("- **Measurement:**"):
        b["measure"] = l
    elif l.startswith("- **Completion:**"):
        b["completion"] = l
    elif l.startswith("| ") and l.split("|")[1].strip() in STATIONS:
        cells = [c.strip() for c in l.strip().strip("|").split("|")]
        if len(cells) != 4:
            errors.append(f"{cur}: station row has {len(cells)} cells: {l[:70]}")
            continue
        b["stations"].append(cells)

# ---------------------------------------------------------------- block checks
state_count = Counter()
mode_count = Counter()
no_mode = 0
d_gated = []
ct_use = Counter()
for bid, b in blocks.items():
    names = [s[0] for s in b["stations"]]
    if names != STATIONS:
        errors.append(f"{bid}: stations {names}, expected the four in order")
    for st, supply, state, mode in b["stations"]:
        if state not in STATES:
            errors.append(f"{bid} {st}: state {state!r}")
        state_count[state] += 1
        if mode == NO_MODE:
            no_mode += 1
            continue
        for part in [p.strip() for p in mode.split(" + ")]:
            if part not in MODES:
                errors.append(f"{bid} {st}: mode {part!r} not in the vocabulary")
            mode_count[part] += 1
    if not b["rows"]:
        errors.append(f"{bid}: no Rows line")
    if not b["falls"] or not any(s in b["falls"] for s in STATIONS):
        errors.append(f"{bid}: no Falls-through line naming a station")
    if not b["measure"] or not all(k in b["measure"] for k in ("MIDI", "self-checked", "no actor")):
        errors.append(f"{bid}: measurement line must name MIDI, self-checked and no actor")
    if not b["completion"] or not re.search(r"CT-\d", b["completion"]):
        errors.append(f"{bid}: no Completion line naming a CT treatment")
    else:
        for c in set(re.findall(r"CT-\d", b["completion"])):
            ct_use[c] += 1
    if set(b["rows"]) & dossier:
        d_gated.append(bid)
        if not any("[D-gate]" in t for t in b["text"]):
            errors.append(f"{bid}: cites dossier-dependent rows {sorted(set(b['rows']) & dossier)} without [D-gate]")

# ---------------------------------------------------------------- coverage
by_block = OrderedDict()
for bid, b in blocks.items():
    for r in dict.fromkeys(b["rows"]):  # a row named twice in one block is one disposition
        by_block.setdefault(r, []).append(bid)
by_w = OrderedDict()
for wid, ids in w_rows.items():
    for r in ids:
        by_w.setdefault(r, []).append(wid)
cited = set(by_block) | set(by_w)
untraced = [r for r in target if r not in cited]
extra = sorted(r for r in cited if r not in target)
split = [r for r in target if len(by_block.get(r, [])) + len(by_w.get(r, [])) > 1]
should_target = [r for r in should if r not in accepted]
should_missing = [r for r in should_target if r not in should_lines]
should_extra = sorted(set(r for r in should_lines if r not in should_target))
for r in untraced:
    errors.append(f"untraced target row {r}: {rows[r]['item'][:60]}")
for r in extra:
    errors.append(f"non-target row cited as a MUST disposition: {r} ({rows.get(r, {}).get('cls', 'unknown')})")
for r in should_missing:
    errors.append(f"SHOULD row without a SHOULD line: {r}")
for r in should_extra:
    errors.append(f"SHOULD line for a row that is not SHOULD: {r}")

# ---------------------------------------------------------------- sections 5, 6, 8
s5 = section(MAP, 5)
ck = [l for l in s5 if re.match(r"\| CK-\d+ \|", l)]
co = [l for l in s5 if re.match(r"\| CO-\d+ \|", l)]
im = [l for l in s5 if re.match(r"\| IM-\d+ \|", l)]
ck_kind = Counter("EXISTING" if "| EXISTING |" in l else "NEW" if "| NEW |" in l else "?" for l in ck)
if ck_kind["?"]:
    errors.append("a CK row names neither NEW nor EXISTING")
s6 = section(MAP, 6)
waves = OrderedDict()
cur = None
for l in s6:
    m = re.match(r"### Wave 1\(([a-d])\)", l)
    if m:
        cur = m.group(1)
        waves[cur] = set()
        continue
    if l.startswith("### "):
        cur = None
    if cur:
        for lab in RATIONALE:
            if l.startswith(f"- **{lab}.**"):
                waves[cur].add(lab)
complete_waves = [w for w, labs in waves.items() if len(labs) == 6]
if sorted(complete_waves) != ["a", "b", "c", "d"]:
    errors.append(f"wave-one clusters with all six rationale lines: {complete_waves}")
s8 = section(MAP, 8)
conflicts = [l for l in s8 if re.match(r"\| C\d+ \|", l)]
cts = [l for l in s8 if re.match(r"\| CT-\d+ \|", l)]

# ---------------------------------------------------------------- report
total = sum(state_count.values())
print("ABILITY MAP COUNTS (count_ability_map.py)")
print(f"MUST abilities (blocks): {len(blocks)}")
print(f"Stations: {total} = " + " + ".join(f"{s} {state_count[s]}" for s in STATES)
      + f"  (sum {sum(state_count[s] for s in STATES)}; four per block: {4 * len(blocks)})")
print(f"  planned as SHARED or NO-SEPARATE-ARTIFACT (not missing work): "
      f"{state_count['SHARED'] + state_count['NO-SEPARATE-ARTIFACT']}")
print(f"  work to supply (REPAIR + NEW + SOURCE-NEEDED): "
      f"{state_count['REPAIR'] + state_count['NEW'] + state_count['SOURCE-NEEDED']}")
print(f"Modes used: {len(mode_count)} of {len(MODES)} in the vocabulary; stations with no app mode: {no_mode}")
print("  " + "; ".join(f"{m} {c}" for m, c in mode_count.most_common()))
print(f"Checkers required: {len(ck)} (NEW {ck_kind['NEW']}, EXISTING {ck_kind['EXISTING']})")
print(f"Review corpora for the outside reviewer: {len(co)}")
print(f"Imports needing the intake gate and a second-edition comparison: {len(im)}")
print(f"Target rows: MUST {len(must)} + accepted additions {len(accepted)} "
      f"({', '.join(accepted)}; {sum(1 for r in accepted if r in must)} already MUST) = {len(target)}")
tb = sum(1 for r in target if r in by_block)
tw = sum(1 for r in target if r in by_w)
print(f"  traced by ability blocks {tb}; by W dispositions {tw}; split over more than one disposition "
      f"{len(split)} ({', '.join(split) or 'none'}); untraced {len(untraced)}; non-target cited {len(extra)}")
print(f"  W dispositions: {len(w_rows)} covering {sum(len(v) for v in w_rows.values())} row citations")
print(f"SHOULD rows with a SHOULD line: {len(set(should_lines) & set(should_target))} of {len(should_target)} "
      f"(SHOULD {len(should)} less the accepted addition practice#4)")
dt = sorted(r for r in target if r in dossier)
print(f"Dossier-dependent target rows: {len(dt)}; blocks carrying [D-gate]: {len(d_gated)} ({', '.join(d_gated)})")
print(f"Completion treatments: {len(cts)} defined; blocks per treatment: "
      + ", ".join(f"{k} {v}" for k, v in sorted(ct_use.items())))
print(f"MUST/SHOULD conflicts listed: {len(conflicts)}")
print(f"Wave-one clusters with the six-line rationale: {len(complete_waves)} of 4")
for e in errors:
    print("ERROR " + e)
sys.exit(1 if errors else 0)
