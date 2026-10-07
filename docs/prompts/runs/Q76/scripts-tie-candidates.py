"""
The catalogue's songs that establish rhythm.ties (measured), with a level inside 2.4's band, and whether a strict
build bundles each (an nc/personal tag or a non-pd composition makes it a strict placeholder), with the demands
2.4's ancestry has not taught (the rung-claims report's rule). Read from a built personal catalogue and curriculum.
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve()
sys.path.insert(0, str(HERE.parents[4] / "tools" / "content"))
import claims  # noqa: E402

content = Path(sys.argv[1])
rung = sys.argv[2] if len(sys.argv) > 2 else "2.4"
catalog = json.loads((content / "catalog.json").read_text(encoding="utf-8"))
curriculum = json.loads((content / "curriculum.json").read_text(encoding="utf-8"))
skills, demands = claims.load_vocabulary()
ancestry = claims.rung_ancestry(curriculum)
lesson = next(l for _s, _u, l in claims.lessons_in_order(curriculum) if l["id"] == rung)
low, high = lesson["levelBand"]
where = {}
for _s, _u, l in claims.lessons_in_order(curriculum):
    for i in l.get("exerciseOptions", []) + l.get("songOptions", []):
        where.setdefault(i, []).append(l["id"])
rows = []
for it in catalog:
    m = it.get("measurement") or {}
    if m.get("status") != "measured" or "rhythm.ties" not in (m.get("established") or []):
        continue
    if not (low <= float(it.get("level") or 0) <= high):
        continue
    tags = set(it.get("tags") or [])
    strict = not ({"nc-personal-build", "personal-build"} & tags) and it.get("compositionStatus") in (None, "pd")
    untaught = claims.untaught_on(it, rung, ancestry, demands)
    rows.append((it["id"], it.get("type"), it.get("level"), m.get("bars"), (m.get("located") or {}).get("rhythm.ties"),
                 "strict" if strict else "personal-only", untaught, where.get(it["id"], [])))
for r in sorted(rows, key=lambda r: (r[5] != "strict", len(r[6]), r[2])):
    print(r)
