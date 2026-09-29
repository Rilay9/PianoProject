"""Q82: one fetch placeholder of each step as a real build wrote it, beside the row a build that fetched it wrote.

Reads the catalogues under build/ (the kern and whole-library builds after the change, and the final personal build
with every clone) and prints, for one Joplin rag and one MuseTrainer song on a rung, the fields that differ between
the two rows, and the words the Library and the score screen show for a row with no file (`importHint`). Nothing is
written.

    python docs/prompts/runs/Q82/scripts-rows.py
"""
from __future__ import annotations

import json
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
FETCHED = REPO / "app" / "public" / "content" / "catalog.json"
CASES = [
    ("song.ragtime.joplin-easy-winners", REPO / "build" / "q82-kern-personal-after" / "content" / "catalog.json"),
    ("song.folk.happy-birthday", REPO / "build" / "q82-mtlib-strict-after" / "content" / "catalog.json"),
]


def by_id(path: Path) -> dict:
    return {item["id"]: item for item in json.loads(path.read_text(encoding="utf-8"))}


fetched = by_id(FETCHED)
for item_id, path in CASES:
    placeholder = by_id(path)[item_id]
    full = fetched[item_id]
    print(f"== {item_id} ({path.parent.parent.name} against the final personal build)")
    for key in sorted(set(placeholder) | set(full)):
        a, b = placeholder.get(key), full.get(key)
        if key in ("demands", "measurement", "notation", "provenance"):
            print(f"   {key}: {'present' if a else 'absent'} on the placeholder, {'present' if b else 'absent'} when fetched")
            continue
        if a != b:
            print(f"   {key}: {json.dumps(a, ensure_ascii=False)[:160]}  |  fetched: {json.dumps(b, ensure_ascii=False)[:120]}")
    print(f"   the words shown for it: {placeholder.get('importHint')}")
