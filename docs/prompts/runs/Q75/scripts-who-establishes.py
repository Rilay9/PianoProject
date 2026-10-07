"""Which options of 2.4 and ragtime.8 establish the two claims the Pages run failed, and what a
strict build does with each (its tags, licence, compositionStatus). Reads a built catalogue and
curriculum from the folder given on the command line (read-only)."""
import json
import sys
from pathlib import Path

content = Path(sys.argv[1])
catalog = json.loads((content / "catalog.json").read_text(encoding="utf-8"))
curriculum = json.loads((content / "curriculum.json").read_text(encoding="utf-8"))
by_id = {i["id"]: i for i in catalog}
wanted = {"2.4": "rhythm.ties", "ragtime.8": "texture.left-hand-pattern"}
for stage in curriculum["stages"]:
    for unit in stage["units"]:
        for lesson in unit["lessons"]:
            if lesson["id"] not in wanted:
                continue
            demand = wanted[lesson["id"]]
            ids = list(dict.fromkeys(lesson.get("exerciseOptions", []) + lesson.get("songOptions", [])))
            print(f"== {lesson['id']} ({demand}): {len(ids)} options")
            for item_id in ids:
                item = by_id.get(item_id) or {}
                m = item.get("measurement") or {}
                est = demand in (m.get("established") or [])
                src = item.get("source") or {}
                print(f"  {'EST ' if est else '    '}{item_id} | status={m.get('status')} | tags={item.get('tags')} | "
                      f"licence={src.get('license')} | composition={item.get('compositionStatus')} | file={item.get('file')}")
