"""
L120e: does any rung of the excerpts' candidate-rungs report (`excerpts.candidate_rungs`, the second report of its
kind, which since the coordinator's addition carries the same flag) rest on the fixed-position route alone on the
built content? For each candidate (excerpt, rung) pair on a build: the demands the rung's taught set leaves
(`claims.untaught_on` without the curriculum), beside the report's own `positionCoped`, which must agree. Read-only.
Run from the worktree root:

    python docs/prompts/runs/L120e/scripts-excerpt-coping.py build/l120e/out OUT.txt
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / "tools" / "content"))
import claims  # noqa: E402
import excerpts  # noqa: E402


def main(build: str, out: str) -> int:
    catalog = json.loads((ROOT / build / "catalog.json").read_text(encoding="utf-8"))
    curriculum = json.loads((ROOT / build / "curriculum.json").read_text(encoding="utf-8"))
    _skills, demands = claims.load_vocabulary()
    ancestry = claims.rung_ancestry(curriculum)
    items = {item["id"]: item for item in catalog}
    lines = [f"python docs/prompts/runs/L120e/scripts-excerpt-coping.py {build} {out}", ""]
    pairs = coping = disagree = 0
    for row in excerpts.candidate_rungs(catalog, curriculum):
        item = items[row["item"]]
        for c in row["candidates"]:
            pairs += 1
            left = claims.untaught_on(item, c["rung"], ancestry, demands)
            disagree += left != c.get("positionCoped")
            if left:
                coping += 1
                lines.append(f"- {row['item']} at {c['rung']}: coped with only by a taught fixed position: {left}")
    lines.insert(2, f"candidate (excerpt, rung) pairs: {pairs}; resting on the fixed-position route alone: {coping}; "
                    f"the report's positionCoped disagreeing: {disagree}")
    Path(ROOT / out).write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))
    return 0


if __name__ == "__main__":
    sys.exit(main(*sys.argv[1:3]))
