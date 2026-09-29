"""G85's fit question, read from the pictures spec's facts: each song row with a door, before and after.

Usage: python scripts-fit.py <facts.json> <keyA> <keyB>
Prints, for every row that has a `⋯` in either list, the text width, title lines, clamped or not and row
height in A and in B, then the counts. Nothing here is a threshold: it is what the rows measured.
"""
import json
import sys

facts = json.load(open(sys.argv[1], encoding="utf-8"))
a_key, b_key = sys.argv[2], sys.argv[3]
a = {row["item"]: row for row in facts[a_key]}
b = {row["item"]: row for row in facts[b_key]}
rows = [item for item in a if item in b and ("⋯" in (a[item]["actions"] or []) or "⋯" in (b[item]["actions"] or []))]
print(f"{a_key} -> {b_key}: {len(rows)} rows with a ⋯ on the first page ({len(a)} rows drawn)")
wider = taller = newly_clamped = more_lines = 0
for item in rows:
    x, y = a[item], b[item]
    print(
        f"  {item}: text {x['textWidth']}->{y['textWidth']} px, title lines {x['titleLines']}->{y['titleLines']}, "
        f"clamped {x['titleClamped']}->{y['titleClamped']}, row {x['rowHeight']}->{y['rowHeight']} px, actions {x['actions']}->{y['actions']}"
    )
    taller += y["rowHeight"] > x["rowHeight"]
    newly_clamped += (not x["titleClamped"]) and y["titleClamped"]
    more_lines += y["titleLines"] > x["titleLines"]
print(f"rows taller: {taller}; titles newly clamped: {newly_clamped}; titles on more lines: {more_lines}")
