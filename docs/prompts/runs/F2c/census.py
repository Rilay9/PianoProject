"""
F2c census: the rung-claims report's functions (`tools/content/claims.py`) on this tree's built
catalogue and curriculum (app/public/content), printed so a before and an after can be compared
line by line (F2b's census, with every rung's claim row and every option's verdict printed too, so
the comparison says which rows moved, not only which totals).

    python docs/prompts/runs/F2c/census.py <worktree> <label>
"""
from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path

WT = Path(sys.argv[1])
sys.path.insert(0, str(WT / "tools" / "content"))
import claims  # noqa: E402

label = sys.argv[2] if len(sys.argv) > 2 else "census"
content = WT / "app" / "public" / "content"
catalog = json.loads((content / "catalog.json").read_text(encoding="utf-8"))
curriculum = json.loads((content / "curriculum.json").read_text(encoding="utf-8"))
by_id = {item["id"]: item for item in catalog}
report = claims.rung_claims(catalog, curriculum)
s = report["summary"]
print(f"== {label}")
print(f"  CONCEPT_DEMANDS leap -> {claims.CONCEPT_DEMANDS.get('leap')}; leaps -> {claims.CONCEPT_DEMANDS.get('leaps')}")
print(f"  rungs {s['rungs']} options {s['options']} pairs {s['claims']} checkable {s['measurable']} "
      f"established {s['established']} unestablished {s['unestablished']} keptByNone {s['rungClaimsKeptByNoOption']} "
      f"introduced {s['introduced']} servesNone {s['optionsServingNoneOfTheirRungsClaims']} "
      f"unmeasurableConcepts {s['unmeasurableConcepts']} humanReviewed {s['humanReviewed']}")
print(f"  byStatus {dict(sorted(s['byStatus'].items()))}")
rows = [o for o in report["options"] if o["untaught"]]
notated = [o for o in rows if o["measured"] == "measured"
           and not (((by_id.get(o["item"]) or {}).get("drill") or {}).get("generator") or {}).get("family")]
print(f"  untaught rows {len(rows)} (notated {len(notated)}, distinct notated items {len({o['item'] for o in notated})}) "
      f"generated combos {s['generatedUntaught']} (record {'matches' if s['generatedUntaughtMatchesRecord'] else 'differs'})")
print(f"  kept by none: {sorted((r['rung'], r['id']) for r in report['keptByNone'])}")
print(f"  serves none: {sorted(report['servesNone'])}")
print(f"  introduced: {[(r['rung'], r['id'], r['from'], r['established'], r['measurable']) for r in report['introduced']]}")
lessons = {lesson["id"]: lesson for _s, _u, lesson in claims.lessons_in_order(curriculum)}
for rung in ("1.5", "2.1", "blues.7", "ragtime.9"):
    row = next(r for r in report["rungs"] if r["rung"] == rung)
    leap = [(c["kind"], c["id"], c["from"], c["established"], c["measurable"]) for c in row["claims"] if c["id"] == "interval.leap"]
    intro = [(c["id"], c["from"]) for c in row["introduced"] if c["id"] == "interval.leap"]
    print(f"  {rung} leap claims {leap} introduced {intro} not measurable {row['unmeasurable']} "
          f"concepts {lessons[rung]['concepts']} introduces {lessons[rung].get('introduces')}")
_skills, demands = claims.load_vocabulary()
print(f"  taughtAt interval.leap {claims.taught_at(demands.get('interval.leap'))}; derived "
      f"{claims.teaching_rungs(curriculum, _skills, demands)['interval.leap']}")
print(f"  rungs naming leaps: {[r for r, l in lessons.items() if 'leaps' in l['concepts'] + (l.get('introduces') or [])]}")
print(f"  rungs naming leap: {[r for r, l in lessons.items() if 'leap' in l['concepts'] + (l.get('introduces') or [])]}")
print(f"  generated combos: {sorted((g['family'], g['rung'], g['demand'], g['items']) for g in report['generatedUntaught'])}")
print("  -- every rung's claim rows (rung | claim from | established/checked) and its not-measurable concepts")
for rung in report["rungs"]:
    for c in rung["claims"]:
        print(f"  claim | {rung['rung']} | {c['kind']} {c['id']} ({c['from']}) | {c['established']}/{c['measurable']}")
    print(f"  notmeasurable | {rung['rung']} | {', '.join(rung['unmeasurable']) or '-'}")
# Every option's verdict per claim, to a side file (too long for the capture; `compare_census.py` prints
# the lines that differ between two of them).
if len(sys.argv) > 3:
    with open(sys.argv[3], "w", encoding="utf-8") as out:
        for option in report["options"]:
            for c in option["claims"]:
                out.write(f"verdict | {option['rung']} | {option['item']} | {c['kind']} {c['id']} ({c['from']}) | {c['status']}\n")
    print(f"  verdicts written: {sum(len(o['claims']) for o in report['options'])} lines")
