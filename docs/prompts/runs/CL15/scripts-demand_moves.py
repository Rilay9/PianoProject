"""The catalogue's demand facts that moved between the two builds, per item (CL15).

usage: python demand_moves.py <catalog-base.json> <catalog-after.json>
"""
from __future__ import annotations

import json
import sys
from pathlib import Path


def main() -> None:
    base = {r["id"]: r for r in json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))}
    after = {r["id"]: r for r in json.loads(Path(sys.argv[2]).read_text(encoding="utf-8"))}
    for item_id in sorted(after):
        b, a = base[item_id], after[item_id]
        bd, ad = set(b.get("demands") or []), set(a.get("demands") or [])
        if bd != ad:
            print(f"{item_id} demands: -{sorted(bd - ad)} +{sorted(ad - bd)}")
        mb, ma = b.get("measurement") or {}, a.get("measurement") or {}
        for field in ("established", "contract"):
            if mb.get(field) != ma.get(field):
                print(f"  {item_id} measurement.{field}: {json.dumps(mb.get(field))} -> {json.dumps(ma.get(field))}")


if __name__ == "__main__":
    main()
