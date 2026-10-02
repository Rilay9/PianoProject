"""G30's consumer read over the lessons: which lesson offers an item of the 43 families, and every line of its text that speaks of fingers.

usage: python docs/prompts/runs/G30/scripts-lesson_consumers.py <baseline.json> <out.txt>

`baseline.json` is scripts-baseline.py's output (every planned item of the 43 families, with its family).
A lesson is read when its `exerciseOptions` or `songOptions` name one of those items. Every line of its
text matching a finger word is listed with the items it offers, for a reader to judge whether the line
depends on the item's printed fingering. Read, not decided: the script lists, the handoff judges.
"""
from __future__ import annotations

import glob
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
WORDS = re.compile(r"finger|thumb|\b[1-5](?:-[1-5]){1,}\b|numbers? (?:above|over|under|below)|printed", re.I)


def lessons() -> list[dict]:
    out = []

    def walk(node) -> None:
        if isinstance(node, dict):
            for lesson in node.get("lessons") or []:
                if isinstance(lesson, dict) and "id" in lesson:
                    out.append(lesson)
            for value in node.values():
                walk(value)
        elif isinstance(node, list):
            for value in node:
                walk(value)

    for path in sorted(glob.glob(str(ROOT / "content" / "curriculum" / "stage-*.json"))):
        walk(json.loads(Path(path).read_text(encoding="utf-8")))
    return out


def main() -> None:
    baseline = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    family_of = {item_id: one["family"] for item_id, one in baseline.items()}
    lines = []
    seen = set()
    for lesson in lessons():
        offered = [i for i in (lesson.get("exerciseOptions") or []) + (lesson.get("songOptions") or []) if i in family_of]
        if not offered or lesson["id"] in seen:
            continue
        seen.add(lesson["id"])
        text_file = lesson.get("textFile")
        path = ROOT / "content" / text_file if text_file else None
        hits = []
        if path is not None and path.exists():
            for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
                if WORDS.search(line):
                    hits.append(f"    {text_file}:{number}: {line.strip()}")
        families = sorted({family_of[i] for i in offered})
        lines.append(f"{lesson['id']} offers {len(offered)} item(s) of {', '.join(families)}: {', '.join(offered)}")
        lines.extend(hits or ["    (no line speaks of fingers)"])
    Path(sys.argv[2]).write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"{len(seen)} lessons offer an item of the 43 families")


if __name__ == "__main__":
    main()
