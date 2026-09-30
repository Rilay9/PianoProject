"""
L120b (item 9, for information and a Question): the interval.leap pairs in the after-gate table whose row lies
wholly inside the fixed positions taught at its rung — the pairs the skip's predicate would remove if a leap
inside a taught position were ruled coped with the same way. Nothing reads this; no leap is exempted.
Run from the worktree root; writes docs/prompts/runs/L120b/leaps-in-position.txt.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / "tools" / "content"))
import claims  # noqa: E402

build = ROOT / "build" / "l120b-after-gate"
table = json.loads((build / "untaught-options.json").read_text(encoding="utf-8"))
catalog = {it["id"]: it for it in json.loads((build / "catalog.json").read_text(encoding="utf-8"))}
curriculum = json.loads((build / "curriculum.json").read_text(encoding="utf-8"))
_skills, demands = claims.load_vocabulary()
ancestry = claims.rung_ancestry(curriculum)
concepts = claims.concepts_by_rung(curriculum)
skip = demands["interval.skip"]
lines, inside = [], 0
for line in table["lines"]:
    for row in line["demands"]:
        if row["id"] != "interval.leap":
            continue
        item = catalog[line["item"]]
        behind = {c for r in ancestry[line["rung"]] for c in concepts.get(r, set())}
        held = claims.in_taught_position(item, skip, behind)
        span = (item.get("measurement") or {}).get("span") or {}
        inside += held
        lines.append(f"{line['rung']} {line['item']} — {'inside' if held else 'not inside'} a taught position — "
                     + (", ".join(f"{h} {lo}-{hi}" for h, (lo, hi) in span.items()) or "no span") + f" — {row['class']}")
out = ["python docs/prompts/runs/L120b/scripts-leaps-in-position.py", "",
       f"interval.leap pairs in the after-gate table: {len(lines)}; of them on a row wholly inside the positions taught at its rung: {inside}", ""] + lines
(ROOT / "docs" / "prompts" / "runs" / "L120b" / "leaps-in-position.txt").write_text("\n".join(out) + "\n", encoding="utf-8")
print("\n".join(out))
