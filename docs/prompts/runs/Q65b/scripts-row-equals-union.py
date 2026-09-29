"""Whether each frame helper's committed row names exactly the union its importing screens' rows give
(Q65b). The drift test asserts containment (judgement may add; the map never subtracts); this says
whether the row is also the minimum today. The importers come from the test module's own discovery.

    python docs/prompts/runs/Q65b/scripts-row-equals-union.py .
"""
from __future__ import annotations

import json
import sys
from pathlib import Path, PurePosixPath

root = Path(sys.argv[1]).resolve()
sys.path.insert(0, str(root))
sys.path.insert(0, str(root / "tools" / "docs"))
import checks_for_paths as cfp  # noqa: E402
from tools.content.tests import test_checks_for_paths as T  # noqa: E402

data = json.loads((root / "docs" / "prompts" / "checks.json").read_text(encoding="utf-8"))
the_map = cfp.load_map_data(data)
rows = {p["pattern"]: p for p in data["patterns"]}


def e2e(path: str) -> set[str] | str:
    cmds = [c for c in cfp.checks_for([path], the_map, root).commands if c[0] == "e2e"]
    if T.WHOLE_E2E in cmds:
        return "*"
    return {PurePosixPath(n).name for c in cmds for n in c[2].split() if n.endswith(".spec.ts")}


for helper in T.FRAME_HELPERS:
    importers = T.frame_importers(helper, root)
    union: set[str] = set()
    for imp in importers:
        value = e2e(imp)
        assert isinstance(value, set) and value, f"{imp}: no named set"
        union |= value
    row = {PurePosixPath(n).name for n in rows[helper]["checks"]["e2e"]}
    print(f"{helper}: importers {len(importers)} ({' '.join(PurePosixPath(i).stem for i in importers)})")
    print(f"   row {len(row)}, union {len(union)}, row == union: {row == union}; in the row only: {sorted(row - union) or '-'}; in the union only: {sorted(union - row) or '-'}")
