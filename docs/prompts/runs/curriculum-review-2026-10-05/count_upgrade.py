"""Count CURRICULUM-UPGRADE.md's section 2 rows and section 3 markers.

Run: py -3.11 count_upgrade.py   (PYTHONIOENCODING=utf-8 on Windows)

Section 2: every table row under a "### 2.N <track>" heading is one
recommendation row with five cells: item, class, where, evidence, needs.
The class is the one class word the cell holds (MUST, SHOULD, NICE, REJECT,
ALREADY); "MUST (correctness)" counts as MUST. A cell with no class word, more
than one, or a path/conditional label is an error (exit 1).

Section 3: each "(changed" or "(new" marker on a unit is counted; a marker on
a non-unit item (the rock overview) is reported apart.

Kinds (section 0 item 5): each MUST or SHOULD row is assigned to exactly one
kind, by the first rule that matches, so the kinds sum to MUST + SHOULD:
  1 substantive new or restructured teaching: where or needs names a new unit,
    rung or section, or the item is a rewrite;
  2 factual or text corrections: class "(correctness)", needs "docs" alone, or
    the item is a correction, wording, match or alignment fix;
  3 transfer or requirement-line additions: the item names a requirement,
    prerequisite, cross-reference or pointer;
  4 repertoire, data, generator or app-code changes: needs names generator,
    repertoire, exercise, search or code, or data without text;
  5 existing-rung lesson or task additions: everything else.
The rules are a heuristic on the row's own cells; a batch brief may refine one
row's kind, never the class.
"""
import re
import sys
from collections import Counter, OrderedDict
from pathlib import Path

DOC = Path(__file__).with_name("CURRICULUM-UPGRADE.md")
CLASSES = ["MUST", "SHOULD", "NICE", "REJECT", "ALREADY"]
NEEDS = ["text", "data", "exercise", "generator", "repertoire", "search",
         "external", "docs", "code", "new rung"]
KINDS = [
    "substantive new or restructured teaching",
    "factual or text corrections",
    "transfer or requirement-line additions",
    "repertoire, data, generator or app-code changes",
    "existing-rung lesson or task additions",
]

text = DOC.read_text(encoding="utf-8")
lines = text.splitlines()
errors = []


def section(num):
    start = next(i for i, l in enumerate(lines) if l.startswith(f"## {num}."))
    end = next((i for i in range(start + 1, len(lines)) if lines[i].startswith("## ")), len(lines))
    return lines[start:end]


# ---- section 2 rows
rows = []
track = None
for l in section(2):
    m = re.match(r"### 2\.\d+ (\S+)", l)
    if m:
        track = m.group(1)
        continue
    if not l.startswith("|") or l.startswith("| Item ") or l.startswith("| ---"):
        continue
    cells = [c.strip() for c in l.strip().strip("|").split("|")]
    if len(cells) != 5:
        errors.append(f"{track}: {len(cells)} cells: {l[:80]}")
        continue
    item, cls, where, evidence, needs = cells
    found = [c for c in CLASSES if re.search(rf"\b{c}\b", cls)]
    if len(found) != 1 or re.search(r"path|conditional|[†‡§]", cls + item):
        errors.append(f"{track}: class cell {cls!r} on {item[:60]!r}")
        continue
    rows.append(dict(track=track, item=item, cls=found[0], clscell=cls,
                     where=where, evidence=evidence, needs=needs))

by_class = Counter(r["cls"] for r in rows)
print("CLASSES " + ", ".join(f"{c} {by_class[c]}" for c in CLASSES))
print(f"TOTAL {len(rows)} (class sum {sum(by_class.values())})")

ms = [r for r in rows if r["cls"] in ("MUST", "SHOULD")]
dossier = [r for r in ms if "`[D]`" in r["evidence"]]
print(f"DOSSIER-DEPENDENT (MUST or SHOULD citing [D]) {len(dossier)}")
for r in dossier:
    print(f"- {r['track']}: {r['item']}")


def needs_words(n):
    n = re.sub(r"\bno (new )?(code|generator)\b", "", n)
    return [k for k in NEEDS if re.search(rf"\b{k}\b", n)]


nc = Counter(k for r in rows for k in needs_words(r["needs"]))
print("NEEDS " + ", ".join(f"{k} {nc[k]}" for k in NEEDS))
print("GENERATOR MUST rows: " + "; ".join(
    f"{r['track']}: {r['item'][:50]}" for r in rows
    if r["cls"] == "MUST" and "generator" in needs_words(r["needs"])))
print("CODE rows: " + "; ".join(
    f"{r['track']}: {r['item'][:50]}" for r in rows if "code" in needs_words(r["needs"])))
print("EXTERNAL rows: " + "; ".join(
    f"{r['track']}: {r['item'][:50]}" for r in rows if "external" in needs_words(r["needs"])))


def kind(r):
    w = needs_words(r["needs"])
    if re.search(r"new `|new unit|new rung|new section", r["where"] + " " + r["needs"]) \
            or "rewritten" in r["item"]:
        return 0
    if "(correctness)" in r["clscell"] or r["needs"] == "docs" or re.search(
            r"\b(corrected|[Ww]ording|softened|relabelled|match(es)?|agree|Fix|Align|One threshold|Lesson facts|labelled as)\b",
            r["item"]):
        return 1
    if re.search(r"requirement|prerequisite|[Cc]ross-reference|pointer", r["item"]):
        return 2
    if set(w) & {"generator", "repertoire", "exercise", "search", "code"} or ("data" in w and "text" not in w):
        return 3
    return 4


kc = Counter(kind(r) for r in ms)
print("KINDS (MUST and SHOULD rows, one kind each)")
for i, k in enumerate(KINDS):
    print(f"  {k}: {kc[i]}")
print(f"  sum {sum(kc.values())} = MUST + SHOULD {len(ms)}")

# ---- section 3 markers
changed_units, changed_other, new_units, raw_changed, raw_new = 0, [], [], 0, 0
for l in section(3):
    m = re.match(r"- \*\*([a-z-]+)\*\*", l)
    if not m:
        continue
    tr = m.group(1)
    raw_changed += l.count("(changed")
    raw_new += l.count("(new")
    for mm in re.finditer(r"(?:([a-z-]+)\.)?(\d+(?:\.\d+)?|overview)(?:\*\*)?\s*\((changed|new)", l):
        uid = f"{mm.group(1) or tr}.{mm.group(2)}" if not mm.group(1) else f"{mm.group(1)}.{mm.group(2)}"
        if mm.group(3) == "new":
            new_units.append(uid)
        elif mm.group(2) == "overview":
            changed_other.append(uid)
        else:
            changed_units += 1
if raw_changed != changed_units + len(changed_other) or raw_new != len(new_units):
    errors.append(f"section 3: unparsed markers (changed {raw_changed}, new {raw_new})")
print(f"SECTION 3: (changed markers on units {changed_units}; on non-units {len(changed_other)} {changed_other}; "
      f"(new markers {len(new_units)} {new_units}")

if sum(by_class.values()) != len(rows):
    errors.append("class counts do not sum to the total")
for e in errors:
    print("ERROR " + e)
sys.exit(1 if errors else 0)
