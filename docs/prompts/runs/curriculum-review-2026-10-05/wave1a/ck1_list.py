"""CK-1, listed: each built contrary scale with what the contract finds wrong (the refuting run, and after).

usage: py -3.11 docs/prompts/runs/curriculum-review-2026-10-05/wave1a/ck1_list.py
"""
import json
import sys
import warnings
from pathlib import Path

ROOT = Path(__file__).resolve().parents[5]
sys.path.insert(0, str(ROOT / "tools" / "content"))
warnings.filterwarnings("ignore")
from tests.test_contrary_scales_unison import CONTENT, faults, hands  # noqa: E402

rows = [r for r in json.loads((CONTENT / "catalog.json").read_text(encoding="utf-8"))
        if r["id"].startswith("exercise.scale.") and ".contrary." in r["id"]]
bad = 0
for row in sorted(rows, key=lambda r: r["id"]):
    path = CONTENT / row["file"]
    st = hands(path)
    found = faults(path, int(row["drill"]["params"]["octaves"]))
    bad += bool(found)
    print(f"{'FAIL' if found else 'ok  '} {row['id']}: RH {st[1][0][3]}, LH {st[2][0][3]}" + (f" -- {found[0]}" if found else ""))
print(f"{bad} of {len(rows)} fail the contract")
