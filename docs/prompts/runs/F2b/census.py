"""
F2b census: the rung-claims report's functions (`tools/content/claims.py`) on this tree's built
catalogue and curriculum (app/public/content), printed so a before and an after can be compared
line by line. "Notated" is a measured item (its notes were read) that no generator family wrote;
an untaught row is an option read where the learner first meets it (`earliest`) with a non-empty
`untaught` list, as the report writes it.
"""
from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path

WT = Path(__file__).resolve().parent if False else Path(sys.argv[1])
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
print(f"  rungs {s['rungs']} options {s['options']} checkable {s['measurable']} established {s['established']} "
      f"unestablished {s['unestablished']} keptByNone {s['rungClaimsKeptByNoOption']} introduced {s['introduced']} "
      f"servesNone {s['optionsServingNoneOfTheirRungsClaims']}")
rows = [o for o in report["options"] if o["untaught"]]
notated = [o for o in rows if o["measured"] == "measured"
           and not (((by_id.get(o["item"]) or {}).get("drill") or {}).get("generator") or {}).get("family")]
print(f"  untaught rows {len(rows)} (notated {len(notated)}, distinct notated items {len({o['item'] for o in notated})}) "
      f"generated combos {s['generatedUntaught']} (record {'matches' if s['generatedUntaughtMatchesRecord'] else 'differs'})")
print(f"  kept by none: {sorted((r['rung'], r['id']) for r in report['keptByNone'])}")
print(f"  introduced: {[(r['rung'], r['id'], r['from'], r['established'], r['measurable']) for r in report['introduced']]}")
by_demand = Counter(d for o in notated for d in o["untaught"])
print(f"  notated untaught by demand: {dict(sorted(by_demand.items()))}")
print(f"  untaught rows per track (all): {dict(sorted(Counter(o['track'] for o in rows).items()))}")
print(f"  untaught rows per track (notated): {dict(sorted(Counter(o['track'] for o in notated).items()))}")
gen = Counter()
for g in report["generatedUntaught"]:
    track = next((o["track"] for o in report["options"] if o["rung"] == g["rung"]), "?")
    gen[track] += 1
print(f"  generated combos per track: {dict(sorted(gen.items()))}")
ancestry = claims.rung_ancestry(curriculum)
lessons = {lesson["id"]: lesson for _s, _u, lesson in claims.lessons_in_order(curriculum)}
for n in range(1, 6):
    rung = f"practice.{n}"
    core = sorted(m for m in ancestry[rung] if not m.startswith("practice.") and m[0].isdigit())
    untaught = [(o["item"], o["untaught"]) for o in report["options"] if o["rung"] == rung and o["untaught"]]
    earliest = [o["item"] for o in report["options"] if o["rung"] == rung and o["earliest"]]
    print(f"  {rung} prerequisites {lessons[rung].get('prerequisites')} core ancestry tail {core[-3:]} "
          f"read here {earliest} untaught rows: {untaught}")
for rung in ("1.5", "2.1", "blues.7", "ragtime.9"):
    row = next(r for r in report["rungs"] if r["rung"] == rung)
    leap = [(c["kind"], c["id"], c["from"], c["established"], c["measurable"]) for c in row["claims"] if c["id"] == "interval.leap"]
    intro = [(c["id"], c["from"]) for c in row["introduced"] if c["id"] == "interval.leap"]
    print(f"  {rung} leap claims {leap} introduced {intro} concepts {lessons[rung]['concepts']} introduces {lessons[rung].get('introduces')}")
print(f"  rungs naming leaps: {[r for r, l in lessons.items() if 'leaps' in l['concepts'] + (l.get('introduces') or [])]}")
print(f"  rungs naming leap: {[r for r, l in lessons.items() if 'leap' in l['concepts'] + (l.get('introduces') or [])]}")
print(f"  generated combos: {sorted((g['family'], g['rung'], g['demand'], g['items']) for g in report['generatedUntaught'])}")
