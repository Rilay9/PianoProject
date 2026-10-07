"""Prints each option of the named rungs from a built catalogue and curriculum: level, file, measured status, bars, the located ties and left-hand pattern, and whether each is established; licence and composition status."""
import json
import sys
from pathlib import Path

content = Path(sys.argv[1])
rungs = sys.argv[2].split(",")
catalog = {i["id"]: i for i in json.loads((content / "catalog.json").read_text(encoding="utf-8"))}
curriculum = json.loads((content / "curriculum.json").read_text(encoding="utf-8"))
for stage in curriculum["stages"]:
    for unit in stage["units"]:
        for lesson in unit["lessons"]:
            if lesson["id"] not in rungs:
                continue
            print(f"== {lesson['id']} band {lesson.get('levelBand')}")
            for option in lesson.get("exerciseOptions", []) + lesson.get("songOptions", []):
                it = catalog.get(option, {})
                m = it.get("measurement") or {}
                located = m.get("located") or {}
                est = m.get("established") or []
                print(f"  {option}: level {it.get('level')} file {'yes' if it.get('file') else 'no'} {m.get('status')} bars {m.get('bars')}"
                      f" ties {located.get('rhythm.ties')} {'EST' if 'rhythm.ties' in est else '-'}"
                      f" lhp {located.get('texture.left-hand-pattern')} {'EST' if 'texture.left-hand-pattern' in est else '-'}"
                      f" | {(it.get('source') or {}).get('license')} | {it.get('compositionStatus')}")
