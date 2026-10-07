"""Closure: every new reviewer handoff carries a clause map whose cited files exist (the owner, 2026-10-07).

CLAUDE.md's checklist question 6 and FABLE section 10: a decision written down is not the mechanism that enforces
it; a ruling closes only when each clause maps to the file that implements it, the test that pins it and the CI path
that runs that test, on the current HEAD. This guard makes the handoff carry that map and checks the part a script
can check: the cited files exist and the CI path names a real workflow. It runs from `check_chains.py --lint-briefs`,
on the docs-integrity path that sees `docs/review/**`.

Every handoff after the frozen baseline has a section headed `## Clause map`. Its body is either the one line
`No ruling closes in this handoff.` or a table with the header `| Clause | Implementation | Test | CI path |` and at
least one row. In each row every cell is filled; the Implementation and Test cells each cite at least one existing
repository path in backticks; the CI path cell names an existing workflow under `.github/workflows/`.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
HANDOFFS_REL = Path("docs/review/handoffs")
BASELINE_REL = Path("tools/content/tests/clause_map_baseline.json")
NONE_LINE = "No ruling closes in this handoff."
HEADER = ["clause", "implementation", "test", "ci path"]
_SECTION = re.compile(r"^## Clause map\s*$", re.M)
_TICKED = re.compile(r"`([^`\s]+)`")
_WORKFLOW = re.compile(r"([\w.-]+\.ya?ml)")


def _cells(line: str) -> list[str]:
    return [cell.strip() for cell in line.strip().strip("|").split("|")]


def _existing_paths(cell: str, root: Path) -> list[str]:
    out = []
    for token in _TICKED.findall(cell):
        path = token.split(":", 1)[0].split("#", 1)[0]
        if "/" in path and (root / path).exists():
            out.append(path)
    return out


def check_text(text: str, root: Path = ROOT) -> list[str]:
    """The clause-map problems of one handoff's text; empty when it is closed honestly."""
    match = _SECTION.search(text)
    if not match:
        return ["no `## Clause map` section (CLAUDE.md question 6, FABLE section 10)"]
    rest = text[match.end():]
    end = re.search(r"^## ", rest, re.M)
    body = (rest[: end.start()] if end else rest).strip()
    if body == NONE_LINE:
        return []
    lines = [line for line in body.splitlines() if line.strip().startswith("|")]
    if len(lines) < 3 or [c.lower() for c in _cells(lines[0])] != HEADER:
        return [f"the clause map is neither `{NONE_LINE}` nor a table headed | Clause | Implementation | Test | CI path |"]
    problems = []
    for n, line in enumerate(lines[2:], 1):
        cells = _cells(line)
        if len(cells) != 4 or any(not cell for cell in cells):
            problems.append(f"clause map row {n}: four filled cells needed")
            continue
        clause, impl, test, ci = cells
        if not _existing_paths(impl, root):
            problems.append(f"clause map row {n} ({clause[:40]}): no existing file in backticks under Implementation")
        if not _existing_paths(test, root):
            problems.append(f"clause map row {n} ({clause[:40]}): no existing file in backticks under Test")
        flows = [w for w in _WORKFLOW.findall(ci) if (root / ".github" / "workflows" / w).exists()]
        if not flows:
            problems.append(f"clause map row {n} ({clause[:40]}): the CI path names no existing workflow")
    return problems


def problems(root: Path = ROOT) -> list[tuple[str, str]]:
    """(file, message) for every post-baseline handoff whose clause map is missing or does not check out."""
    handoffs = root / HANDOFFS_REL
    baseline_path = root / BASELINE_REL
    if not handoffs.exists() and not baseline_path.exists():
        return []
    if not baseline_path.is_file():
        return [(BASELINE_REL.as_posix(), "clause-map baseline is missing; refusing to skip historical handoffs")]
    try:
        baseline = set(json.loads(baseline_path.read_text(encoding="utf-8"))["files"])
    except (OSError, ValueError, KeyError, TypeError):
        return [(BASELINE_REL.as_posix(), "clause-map baseline is unreadable")]
    out: list[tuple[str, str]] = []
    for path in sorted(handoffs.glob("*.md")):
        if path.name in baseline:
            continue
        for message in check_text(path.read_text(encoding="utf-8"), root):
            out.append(((HANDOFFS_REL / path.name).as_posix(), message))
    return out
