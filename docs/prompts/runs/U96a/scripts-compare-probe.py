"""Compares U96a's record probe on the committed DrillScreen.ts and on the change.

usage: python scripts-compare-probe.py <committed.json> <changed.json>

The record (what `keep` handed the record writer, the duration blanked) must be identical for every case;
the sheet is printed side by side, since changing what the sheet says is the point. The time-to-answer row is
a clock reading and is left out of the sheet lines. Exit 0 when every record matches, 1 otherwise.
"""
import json
import sys

committed = json.load(open(sys.argv[1], encoding="utf-8"))
changed = json.load(open(sys.argv[2], encoding="utf-8"))
same = True
for case in sorted(set(committed) | set(changed)):
    before = committed.get(case)
    after = changed.get(case)
    if before is None or after is None:
        print(f"{case}: MISSING on one side")
        same = False
        continue
    record_same = before["record"] == after["record"]
    same = same and record_same
    print(f"{case}: record {'identical' if record_same else 'DIFFERENT'}")
    if not record_same:
        print(f"  committed: {json.dumps(before['record'], sort_keys=True)}")
        print(f"  changed:   {json.dumps(after['record'], sort_keys=True)}")
    r = before["record"]
    print(f"  record: accuracy={r.get('accuracy')} wrongNotes={r.get('wrongNotes')} missed={r.get('missed')} passed={r.get('passed')}")
    skip = {"average-time-to-answer"}
    for side, data in (("committed", before), ("changed  ", after)):
        rows = "; ".join(f"{k}={v}" for k, v in data["sheet"].items() if k not in skip)
        print(f"  sheet {side}: {rows}")
print("records identical for every case" if same else "RECORDS DIFFER")
sys.exit(0 if same else 1)
