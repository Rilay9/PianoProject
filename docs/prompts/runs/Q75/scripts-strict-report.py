"""
The rung-claims report a built catalogue gets under the changed claims.py (Q75 item 2), rendered and
cut to what differs between a strict build and the measured one: the summary, the claims no checked
option keeps, and the every-rung rows of 2.4, ragtime.5, ragtime.8 and blues.6. Read-only.

Usage: python scripts-strict-report.py <content dir>
"""
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(REPO / "tools" / "content"))
import claims  # noqa: E402

content = Path(sys.argv[1])
catalog = json.loads((content / "catalog.json").read_text(encoding="utf-8"))
curriculum = json.loads((content / "curriculum.json").read_text(encoding="utf-8"))
text = claims.render_rung_claims(claims.rung_claims(catalog, curriculum))
summary = text.split("## Summary")[1].split("## The rungs Part 12 names first")[0]
kept = text.split("## Rung claims no option establishes")[1].split("## Concepts a rung introduces")[0]
print(f"content: {content}\n\n## Summary{summary}## Rung claims no option establishes{kept}## Every rung (selected)\n")
for line in text.splitlines():
    if any(line.startswith(f"| {rung} |") for rung in ("2.4", "ragtime.5", "ragtime.8", "blues.6")):
        print(line)
