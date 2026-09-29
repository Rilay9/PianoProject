"""
The rung-claims report of one built catalogue (claims.render_rung_claims), cut to the summary, the claims no checked
option keeps, the every-rung rows of 2.4 and ragtime.8, and each of the two rungs' options with its verdict on the tie
or the stride-bass claim. Read-only. After Q75's scripts-strict-report.py.

    python scripts-strict-report.py <content dir>
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
report = claims.rung_claims(catalog, curriculum)
text = claims.render_rung_claims(report)
summary = text.split("## Summary")[1].split("## The rungs Part 12 names first")[0]
kept = text.split("## Rung claims no option establishes")[1].split("## Concepts a rung introduces")[0]
print(f"content: {content.as_posix()}\n\n## Summary{summary}## Rung claims no option establishes{kept}## Every rung (2.4, ragtime.8)\n")
for line in text.splitlines():
    if any(line.startswith(f"| {rung} |") for rung in ("2.4", "ragtime.8")):
        print(line)
print("\n## The two rungs' options on their claim (verdict per option)\n")
wanted = {"2.4": ("rhythm.ties", "tie"), "ragtime.8": ("texture.left-hand-pattern",)}
for option in report["options"]:
    if option["rung"] in wanted:
        verdicts = {c["id"]: c["status"] for c in option["claims"] if c["id"] in wanted[option["rung"]]}
        print(f"- {option['rung']} {option['item']}: {verdicts} (measured: {option['measured']})")
