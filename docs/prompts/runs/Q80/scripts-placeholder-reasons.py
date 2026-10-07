"""Q80: which placeholders in a built catalogue the stale-ladder check reads as this build's own (a fetch failure).

For each catalogue named: every placeholder's reason, grouped (the importHint's first sentence), and the items
`validate.unfetched_placeholders` picks. A reason that is a licence or a file no build has must never be picked.

    python docs/prompts/runs/Q80/scripts-placeholder-reasons.py app/public/content build/q80-unfetched/content ...
"""
from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(REPO / "tools" / "content"))

from validate import unfetched_placeholders  # noqa: E402

for name in sys.argv[1:]:
    catalog = json.loads((REPO / name / "catalog.json").read_text(encoding="utf-8"))
    placeholders = [item for item in catalog if not item.get("file")]
    reasons = Counter(" ".join((item.get("importHint") or "(no importHint)").split()).split(". ")[0][:120]
                      for item in placeholders)
    print(f"== {name}: {len(catalog)} items, {len(placeholders)} without a file")
    for reason, count in sorted(reasons.items(), key=lambda pair: -pair[1]):
        print(f"   {count:4d}  {reason}")
    picked = unfetched_placeholders(catalog)
    print(f"   read as this build's own (a fetch failure): {len(picked)}")
    for item_id, reason in picked:
        print(f"     {item_id}: {reason}")
