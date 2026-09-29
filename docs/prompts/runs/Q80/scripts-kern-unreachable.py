"""Q80's stop finding: what an unreachable kern or MuseTrainer repository does to validation.

`import_kern.build_entry` and `import_musetrainer` leave out a file they cannot find (`report.missing`), writing no
placeholder and no reason. This takes a built catalogue, removes the rows one repository would have given (by the
tag the step writes), and runs the curriculum cross-references and the ladder check on what is left, so the error a
runner would log is read, not guessed. Nothing is written.

    python docs/prompts/runs/Q80/scripts-kern-unreachable.py app/public/content joplin musetrainer
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(REPO / "tools" / "content"))

from validate import ladder_report_findings, validate_curriculum  # noqa: E402

content = REPO / sys.argv[1]
catalog = json.loads((content / "catalog.json").read_text(encoding="utf-8"))
curriculum = json.loads((content / "curriculum.json").read_text(encoding="utf-8"))
for tag in sys.argv[2:]:
    gone = {item["id"] for item in catalog if tag in (item.get("tags") or []) and item.get("type") != "excerpt"}
    left = [item for item in catalog if item["id"] not in gone]
    errors = validate_curriculum(curriculum, left, 3)
    unknown = [e for e in errors if "references unknown item" in e]
    ladder_errors, ladder_warnings = ladder_report_findings(left, curriculum)
    print(f"== the rows tagged {tag!r} left out ({len(gone)} rows), as the import step does when the clone is missing")
    print(f"   curriculum errors: {len(errors)}, of which 'references unknown item': {len(unknown)}")
    for line in unknown[:3]:
        print(f"     {line}")
    print(f"   ladder check: {len(ladder_errors)} error(s), {len(ladder_warnings)} warning(s)")
    for line in ladder_errors:
        print(f"     {line[:160]}")
