"""Each identity the continuity table records against the base build's catalogue row (CL15).

usage: python table_check.py <catalog-base.json> <generator_continuity.json>
The recorded old identity must be exactly what the catalogue a learner's device held stored as the
row's `provenance.identity`, or a stored row would not name it.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path


def main() -> None:
    catalog = {row["id"]: row for row in json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))}
    table = json.loads(Path(sys.argv[2]).read_text(encoding="utf-8"))["families"]
    checked = mismatched = 0
    for family, record in sorted(table.items()):
        for item_id, one in sorted(record["items"].items()):
            checked += 1
            held = catalog[item_id]["provenance"]["identity"]
            if held != one["identity"]:
                mismatched += 1
                print(f"MISMATCH {item_id}: catalogue {held} table {one['identity']}")
        print(f"{family}: {len(record['items'])} items, v{record['from']} -> v{record['to']}")
    print(f"checked {checked}, mismatched {mismatched}")


if __name__ == "__main__":
    main()
