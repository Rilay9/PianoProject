"""
L120d (item 5): L120b's census (`docs/prompts/runs/L120b/scripts-leaps-in-position.py`) over a given build's table —
the interval.leap pairs whose row lies wholly inside the fixed positions taught at its rung.

    python docs/prompts/runs/L120d/scripts-leaps-in-position.py build/l120d-base  docs/prompts/runs/L120d/base/leaps-in-position.txt  skip
    python docs/prompts/runs/L120d/scripts-leaps-in-position.py build/l120d-after docs/prompts/runs/L120d/after/leaps-in-position.txt leap

The last word says whose positions are read: `skip` (the base, where the leap has none: L120b's reading, the pairs
the ruling would free, the hypothesis) or `leap` (after, the leap's own: the hypothesis says none is left).
Run from the worktree root.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / "tools" / "content"))
import claims  # noqa: E402

build, out_path, whose = ROOT / sys.argv[1], ROOT / sys.argv[2], sys.argv[3]
table = json.loads((build / "untaught-options.json").read_text(encoding="utf-8"))
catalog = {it["id"]: it for it in json.loads((build / "catalog.json").read_text(encoding="utf-8"))}
curriculum = json.loads((build / "curriculum.json").read_text(encoding="utf-8"))
_skills, demands = claims.load_vocabulary()
ancestry = claims.rung_ancestry(curriculum)
concepts = claims.concepts_by_rung(curriculum)
reader = demands["interval.skip" if whose == "skip" else "interval.leap"]
lines, inside = [], 0
for line in table["lines"]:
    for row in line["demands"]:
        if row["id"] != "interval.leap":
            continue
        item = catalog[line["item"]]
        behind = {c for r in ancestry[line["rung"]] for c in concepts.get(r, set())}
        held = claims.in_taught_position(item, reader, behind)
        span = (item.get("measurement") or {}).get("span") or {}
        others = [d["id"] for d in line["demands"] if d["id"] != "interval.leap"]
        inside += held
        lines.append(f"{line['rung']} {line['item']} — {'inside' if held else 'not inside'} a taught position — "
                     + (", ".join(f"{h} {lo}-{hi}" for h, (lo, hi) in span.items()) or "no span") + f" — {row['class']}"
                     + f" — the line's other untaught demands: {', '.join(others) or 'none'}")
out = [f"python docs/prompts/runs/L120d/scripts-leaps-in-position.py {sys.argv[1]} {sys.argv[2]} {whose}", "",
       f"positions read: interval.{whose}'s ({json.dumps(reader.get('fixedPositions'))})",
       f"interval.leap pairs in the table: {len(lines)}; of them on a row wholly inside the positions taught at its rung: {inside}", ""] + lines
out_path.write_text("\n".join(out) + "\n", encoding="utf-8")
print("\n".join(out[:4]))
