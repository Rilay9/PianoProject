"""Q88: every row without a file in each built catalogue named, grouped by what its importHint says, and which of
them `validate.unfetched_placeholders` (the guard's one input) reads as this build's fetch. Run from the worktree root:
    python docs/prompts/runs/Q88/scripts-placeholders.py <content dir> [<content dir> ...]"""
from __future__ import annotations

import collections
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / "tools" / "content"))

from validate import unfetched_placeholders  # noqa: E402


def kind(item: dict) -> str:
    hint = " ".join((item.get("importHint") or "").split())
    if not hint:
        return f"no hint ({item['type']})"
    return hint[:90]


for arg in sys.argv[1:]:
    catalog = json.loads((Path(arg) / "catalog.json").read_text(encoding="utf-8"))
    without = [item for item in catalog if not item.get("file")]
    fetch = unfetched_placeholders(catalog)
    print(f"== {arg}: {len(catalog)} items, {len(without)} without a file, {len(fetch)} read as this build's fetch")
    for item_id, reason in fetch:
        print(f"   fetch: {item_id} ({reason})")
    groups = collections.Counter(kind(item) for item in without)
    for text, count in groups.most_common():
        print(f"   {count:4d}  {text}")
