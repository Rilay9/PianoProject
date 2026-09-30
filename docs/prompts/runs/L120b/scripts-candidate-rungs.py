"""
L120b: what the two other readers of `claims.untaught_on` show differently (item 3) — the excerpts' and the
studies' candidate rungs (`excerpts.candidate_rungs`, `study.candidate_rungs`) at the base, after class 1 and
after class 2, each on that state's built catalogue. The base's reading is HEAD's `untaught_on` (every listed
demand asked); class 1's is today's without the curriculum (the key signature's rule alone); class 2's is
today's with it. Run from the worktree root; writes docs/prompts/runs/L120b/candidate-rungs.txt.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / "tools" / "content"))

import claims  # noqa: E402
import excerpts  # noqa: E402
import study  # noqa: E402

CURRENT = claims.untaught_on


def head_untaught_on(item, rung, ancestry, demands, curriculum=None):
    """HEAD's reading (f6d36ee9): every listed demand, no key-signature rule, no positions."""
    if not isinstance(item.get("demands"), list) or rung not in ancestry:
        return []
    taught_by = ancestry[rung]
    return [d for d in item["demands"] if not any(at in taught_by for at in claims.taught_at(demands.get(d)))]


def class1_untaught_on(item, rung, ancestry, demands, curriculum=None):
    return CURRENT(item, rung, ancestry, demands)


STATES = [("base", "l120b-before", head_untaught_on), ("after-reading", "l120b-after-reading", class1_untaught_on),
          ("after-gate", "l120b-after-gate", CURRENT)]


def main() -> int:
    seen: dict[str, dict[str, dict[str, list[str]]]] = {}
    for name, folder, reading in STATES:
        catalog = json.loads((ROOT / "build" / folder / "catalog.json").read_text(encoding="utf-8"))
        curriculum = json.loads((ROOT / "build" / folder / "curriculum.json").read_text(encoding="utf-8"))
        claims.untaught_on = reading
        try:
            seen[name] = {
                "excerpts": {row["item"]: [c["rung"] for c in row["candidates"]] for row in excerpts.candidate_rungs(catalog, curriculum)},
                "studies": {row["item"]: [c["rung"] for c in row["candidates"]] for row in study.candidate_rungs(catalog, curriculum)},
            }
        finally:
            claims.untaught_on = CURRENT
    lines = ["python docs/prompts/runs/L120b/scripts-candidate-rungs.py", ""]
    for kind in ("excerpts", "studies"):
        lines.append(f"## {kind}: {len(seen['base'][kind])} items")
        lines.append("")
        for a, b in (("base", "after-reading"), ("after-reading", "after-gate")):
            moved = []
            for item in sorted(seen[a][kind]):
                before, after = set(seen[a][kind][item]), set(seen[b][kind].get(item, []))
                if before != after:
                    moved.append(f"  {item}: +{sorted(after - before)} -{sorted(before - after)}")
            lines.append(f"- {a} -> {b}: {len(moved)} items whose candidate rungs moved" + ("" if moved else " (none)"))
            lines.extend(moved)
        lines.append("")
    (ROOT / "docs" / "prompts" / "runs" / "L120b" / "candidate-rungs.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))
    return 0


if __name__ == "__main__":
    sys.exit(main())
