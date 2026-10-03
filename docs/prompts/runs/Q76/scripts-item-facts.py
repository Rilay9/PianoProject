"""Prints named catalogue rows' facts (title, composer, level and source, hands, notation, source licence, composition status, located demands, established) from a built catalogue."""
import json
import sys
from pathlib import Path

content = Path(sys.argv[1])
catalog = {i["id"]: i for i in json.loads((content / "catalog.json").read_text(encoding="utf-8"))}
for item_id in sys.argv[2:]:
    it = catalog.get(item_id)
    if it is None:
        print(item_id, "MISSING")
        continue
    m = it.get("measurement") or {}
    print(json.dumps({
        "id": item_id, "title": it.get("title"), "composer": it.get("composer"), "level": it.get("level"),
        "levelSource": it.get("levelSource"), "hands": it.get("hands"), "file": it.get("file"),
        "keySig": it.get("keySig"), "timeSig": it.get("timeSig"), "tempoBpm": it.get("tempoBpm"),
        "notation": it.get("notation"), "license": (it.get("source") or {}).get("license"),
        "sourceName": (it.get("source") or {}).get("name"), "compositionStatus": it.get("compositionStatus"),
        "tags": it.get("tags"), "concepts": it.get("concepts"), "tracks": it.get("tracks"),
        "located": m.get("located"), "established": m.get("established"), "bars": m.get("bars"),
    }, ensure_ascii=False, indent=1))
