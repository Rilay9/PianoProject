"""
E50: `docs/prompts/inventory.md` written from the after build's catalogue and curriculum by the build's own renderer
(`build.step_reports`'s two lines: `claims.render_inventory(claims.inventory(...))`, newline "\\n"), because
`test_measured_truth.TestTheReports` holds the committed file to the catalogue and E50 moves eight of its counts
(the tempo-defaulted rows). `rung-claims.md` renders unchanged (runs/E50/reports.txt) and is not written.
    python scripts-write-inventory.py <content dir>
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

W = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(W / "tools" / "content"))
import claims  # noqa: E402

folder = Path(sys.argv[1])
catalog = json.loads((folder / "catalog.json").read_text(encoding="utf-8"))
curriculum = json.loads((folder / "curriculum.json").read_text(encoding="utf-8"))
out = W / "docs" / "prompts" / "inventory.md"
out.write_text(claims.render_inventory(claims.inventory(catalog, curriculum)), encoding="utf-8", newline="\n")
print(f"wrote {out.relative_to(W).as_posix()}")
