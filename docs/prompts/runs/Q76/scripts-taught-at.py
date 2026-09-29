"""The demands a rung's ancestry has taught (taughtAt on its path) and those it has not, from the vocabulary and a built curriculum; and each option's untaught demands."""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve()
sys.path.insert(0, str(HERE.parents[4] / "tools" / "content"))
import claims  # noqa: E402

content = Path(sys.argv[1])
rung = sys.argv[2]
curriculum = json.loads((content / "curriculum.json").read_text(encoding="utf-8"))
catalog = {i["id"]: i for i in json.loads((content / "catalog.json").read_text(encoding="utf-8"))}
skills, demands = claims.load_vocabulary()
ancestry = claims.rung_ancestry(curriculum)
taught = [d for d in demands if any(at in ancestry[rung] for at in claims.taught_at(demands[d]))]
print("taught on", rung, ":", taught)
print("not taught:", [d for d in demands if d not in taught])
lesson = next(l for _s, _u, l in claims.lessons_in_order(curriculum) if l["id"] == rung)
for option in lesson.get("exerciseOptions", []) + lesson.get("songOptions", []):
    it = catalog.get(option)
    print(" ", option, claims.untaught_on(it, rung, ancestry, demands) if it else "missing")
