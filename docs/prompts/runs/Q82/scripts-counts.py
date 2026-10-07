"""Q82: the counts on each real build with a clone moved aside, read from the catalogue the build wrote.

Q80's `scripts-kern-unreachable.py` simulated a missing clone by removing the rows one repository gives from a
built catalogue (the step's old behaviour), so rerunning it on the changed tree says nothing about the change. This
reads the catalogues the real builds wrote instead (`build/q82-<case>-<flavour>-<phase>/content`), before and after,
and runs the same three checks on them: the curriculum's cross-references, the catalogue's own (`variantOf`,
`alternatives`), and the ladder check (Q80). Nothing is written but stdout.

    python docs/prompts/runs/Q82/scripts-counts.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(REPO / "tools" / "content"))

from validate import (  # noqa: E402
    ladder_report_findings,
    unfetched_placeholders,
    validate_catalog,
    validate_curriculum,
)

for content in sorted((REPO / "build").glob("q82-*/content")):
    catalog_path = content / "catalog.json"
    if not catalog_path.is_file():
        print(f"== {content.parent.name}: no catalogue (the build stopped before the merge)")
        continue
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    curriculum = json.loads((content / "curriculum.json").read_text(encoding="utf-8"))
    strict = "-strict-" in content.parent.name
    cur_errors = validate_curriculum(curriculum, catalog, 3)
    unknown = [e for e in cur_errors if "references unknown item" in e]
    cat_errors = validate_catalog(catalog, content, strict, allow_nc=not strict, personal=not strict)
    variant = [e for e in cat_errors if "variantOf" in e or "alternatives names" in e]
    ladder_errors, ladder_warnings = ladder_report_findings(catalog, curriculum)
    fetched_not = unfetched_placeholders(catalog)
    kinds = {}
    for _, reason in fetched_not:
        key = ("kern" if "kern clone" in reason else "MuseTrainer" if "MuseTrainer" in reason
               else "Mutopia")
        kinds[key] = kinds.get(key, 0) + 1
    print(f"== {content.parent.name}")
    print(f"   catalogue items: {len(catalog)}; placeholders for want of a fetch: {len(fetched_not)} {kinds or ''}")
    print(f"   curriculum errors: {len(cur_errors)} (unknown items: {len(unknown)}); "
          f"catalogue cross-reference errors: {len(variant)}; other catalogue errors: {len(cat_errors) - len(variant)}")
    print(f"   ladder check: {len(ladder_errors)} error(s), {len(ladder_warnings)} warning(s)")
    for line in unknown[:2] + variant[:2] + [e for e in cat_errors if e not in variant][:3]:
        print(f"     {line[:200]}")
    for line in ladder_errors + ladder_warnings:
        print(f"     {line[:240]}{' …' if len(line) > 240 else ''}")
