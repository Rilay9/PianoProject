"""A finding beside Q65b, for the map's owner: which e2e specs open app/tests/fixtures by a path, whether
the `app/tests/fixtures/**` row names them, and whether the reader guard's reference pattern (Q65a's,
in test_a_test_side_helper_names_every_file_that_reads_it) sees them. The path forms searched are the
guard's own plus `'..', 'fixtures'` (path.join from the spec's folder) and `../fixtures/` (a URL).

    python docs/prompts/runs/Q65b/scripts-fixture-readers.py .
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

root = Path(sys.argv[1]).resolve()
GUARD = r"""tests/fixtures/|'tests', 'fixtures'|fixtures/devScore['"]"""
WIDER = GUARD + r"""|['"]\.\.['"],\s*['"]fixtures['"]|\.\./fixtures/"""
ENV_GATED = {"bisect-render.spec.ts", "content-render.spec.ts", "generate-audio-fixtures.spec.ts", "guide-shots.spec.ts"}
data = json.loads((root / "docs" / "prompts" / "checks.json").read_text(encoding="utf-8"))
row = next(p for p in data["patterns"] if p["pattern"] == "app/tests/fixtures/**")
named = {Path(n).name for n in row["checks"].get("e2e", [])}
print("spec | read by the wider forms | the guard sees it | the row names it")
unnamed_unseen, unnamed_seen = [], []
for spec in sorted((root / "app" / "tests" / "e2e").glob("*.spec.ts")):
    if spec.name in ENV_GATED:
        continue
    text = spec.read_text(encoding="utf-8", errors="replace")
    if not re.search(WIDER, text):
        continue
    seen = bool(re.search(GUARD, text))
    print(f"{spec.name} | yes | {'yes' if seen else 'no'} | {'yes' if spec.name in named else 'NO'}")
    if spec.name not in named:
        (unnamed_seen if seen else unnamed_unseen).append(spec.name)
print(f"\nunnamed and seen by the guard (red today): {' '.join(unnamed_seen) or '-'}")
print(f"unnamed and not seen by the guard (silent): {' '.join(unnamed_unseen) or '-'}")
