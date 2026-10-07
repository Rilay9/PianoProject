"""
G1c: compare the before and after pictures' facts (docs/prompts/pictures/g1c/<tag>-facts.json): the
Stage 8 block's HTML byte for byte, and Stage 9's head and rows as words. Run from the repository
root; prints the comparison and exits 1 if Stage 8's block differs.
"""
import json
import sys
from pathlib import Path

D = Path("docs/prompts/pictures/g1c")
before = json.loads((D / "before-facts.json").read_text(encoding="utf-8"))
after = json.loads((D / "after-facts.json").read_text(encoding="utf-8"))

same8 = before["stage8"]["html"] == after["stage8"]["html"]
print(f"Stage 8 block HTML byte-equal before and after: {same8}")
print(f"Stage 8 head before: { {k: v for k, v in before['stage8']['head'].items() if k != 'rowHeight'} }")
print(f"Stage 8 head after:  { {k: v for k, v in after['stage8']['head'].items() if k != 'rowHeight'} }")
for tag, facts in (("before", before), ("after", after)):
    nine = facts["stage9"]
    print(f"Stage 9 head {tag}: meta={nine['head']['meta']!r} badges={nine['head']['badges']} bar={nine['head']['bar']}")
    for row in nine["rows"]:
        if "lesson" in row:
            print(f"  {tag} row {row['lesson']}: {row['title']!r} | {row['meta']!r} | badges={row['badges']}")
print(f"Stage 9 head row height, before vs after: {'same' if before['stage9']['head']['rowHeight'] == after['stage9']['head']['rowHeight'] else 'differs'}"
      f" ({'after lower' if after['stage9']['head']['rowHeight'] < before['stage9']['head']['rowHeight'] else 'after not lower'})")
for key in ("legend", "status", "next"):
    print(f"{key}: before={before[key]!r} after={after[key]!r} same={before[key] == after[key]}")
sys.exit(0 if same8 else 1)
