"""Fail-closed ledger for outside-review requirements.

Historical responses are frozen in reviewer_closure_baseline.json. Every later response must opt into
this format. OPEN requirements remain visible until a later response closes the same id with current
implementation and test paths. The guard does not try to infer requirements from prose; it makes the
reviewer classify them explicitly before the response can pass docs-integrity.
"""
from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RESPONSES_REL = Path("docs/review/responses")
BASELINE_REL = Path("tools/content/tests/reviewer_closure_baseline.json")
EXPECTED_BASELINE_COUNT = 241
MARKER = "<!-- reviewer-closure-v1 -->"

OPEN_RE = re.compile(r"^REVIEW-OPEN:\s*([A-Za-z0-9][A-Za-z0-9._-]*)\s*\|\s*(\S.*)$")
CLOSE_RE = re.compile(r"^REVIEW-CLOSE:\s*([A-Za-z0-9][A-Za-z0-9._-]*)\s*\|\s*(\S.*)$")
NONE_RE = re.compile(r"^REVIEW-NONE\s*$")
TEST_PATTERNS = (
    re.compile(r"\.(?:test|spec)\.(?:[cm]?[jt]sx?)$", re.I),
    re.compile(r"(?:^|/)test_[^/]+\.py$", re.I),
    re.compile(r"(?:^|/)[^/]+_test\.py$", re.I),
)


@dataclass(frozen=True)
class Requirement:
    ident: str
    source: str
    text: str


def _paths(value: str) -> list[str]:
    return [part.strip() for part in value.split(",") if part.strip()]


def _fields(tail: str) -> dict[str, str]:
    out: dict[str, str] = {}
    for part in tail.split("|"):
        part = part.strip()
        if "=" not in part:
            continue
        key, value = part.split("=", 1)
        out[key.strip().casefold()] = value.strip()
    return out


def scan(root: Path = ROOT, expected_baseline_count: int = EXPECTED_BASELINE_COUNT) -> tuple[list[tuple[str, str]], list[Requirement]]:
    """Return (problems, still-open requirements) for the current repository tree."""
    problems: list[tuple[str, str]] = []
    responses = root / RESPONSES_REL
    baseline_path = root / BASELINE_REL

    if not responses.exists() and not baseline_path.exists():
        return [], []

    if not baseline_path.is_file():
        return [(BASELINE_REL.as_posix(), "review-closure baseline is missing")], []
    try:
        raw = json.loads(baseline_path.read_text(encoding="utf-8"))
        baseline_rows = raw["files"]
    except (OSError, ValueError, KeyError, TypeError):
        return [(BASELINE_REL.as_posix(), "review-closure baseline is unreadable")], []

    if not isinstance(baseline_rows, list):
        return [(BASELINE_REL.as_posix(), "review-closure baseline files must be a list")], []
    baseline = [str(x) for x in baseline_rows]
    if len(baseline) != expected_baseline_count or len(set(baseline)) != expected_baseline_count:
        problems.append((
            BASELINE_REL.as_posix(),
            f"frozen review-closure baseline must remain exactly {expected_baseline_count} unique response files",
        ))

    actual = {p.name for p in responses.glob("*.md") if p.name != "README.md"}
    missing = sorted(set(baseline) - actual)
    if missing:
        problems.append((
            BASELINE_REL.as_posix(),
            "frozen review-closure baseline names missing historical response(s): " + ", ".join(missing),
        ))

    opens: dict[str, Requirement] = {}
    closes: dict[str, tuple[str, str]] = {}
    new_names = sorted(actual - set(baseline))
    for name in new_names:
        path = responses / name
        shown = (RESPONSES_REL / name).as_posix()
        text = path.read_text(encoding="utf-8")
        lines = text.splitlines()
        if lines.count(MARKER) != 1:
            problems.append((shown, f"new reviewer response must contain exactly one {MARKER}"))
            continue

        action_count = 0
        none_count = 0
        for line in lines:
            if NONE_RE.match(line):
                none_count += 1
                action_count += 1
                continue
            opened = OPEN_RE.match(line)
            if opened:
                action_count += 1
                ident, description = opened.groups()
                if ident in opens:
                    problems.append((shown, f"duplicate REVIEW-OPEN id {ident!r}; first opened in {opens[ident].source}"))
                else:
                    opens[ident] = Requirement(ident, shown, description.strip())
                continue
            closed = CLOSE_RE.match(line)
            if closed:
                action_count += 1
                ident, tail = closed.groups()
                if ident in closes:
                    problems.append((shown, f"duplicate REVIEW-CLOSE id {ident!r}; first closed in {closes[ident][0]}"))
                    continue
                fields = _fields(tail)
                impl = _paths(fields.get("impl", ""))
                tests = _paths(fields.get("test", ""))
                if not impl:
                    problems.append((shown, f"REVIEW-CLOSE {ident!r} needs impl=<current repo path[,path]>"))
                if not tests:
                    problems.append((shown, f"REVIEW-CLOSE {ident!r} needs test=<current test path[,path]>"))
                for rel in impl + tests:
                    if not (root / rel).is_file():
                        problems.append((shown, f"REVIEW-CLOSE {ident!r} cites missing path {rel!r}"))
                for rel in tests:
                    if not any(pattern.search(rel.replace("\\", "/")) for pattern in TEST_PATTERNS):
                        problems.append((shown, f"REVIEW-CLOSE {ident!r} test path is not a recognized test source: {rel!r}"))
                closes[ident] = (shown, tail.strip())

        if action_count == 0:
            problems.append((shown, "new reviewer response has no REVIEW-OPEN, REVIEW-CLOSE or REVIEW-NONE line"))
        if none_count and action_count != none_count:
            problems.append((shown, "REVIEW-NONE cannot appear with REVIEW-OPEN or REVIEW-CLOSE"))
        if none_count > 1:
            problems.append((shown, "REVIEW-NONE may appear only once"))

    for ident, (source, _tail) in closes.items():
        if ident not in opens:
            problems.append((source, f"REVIEW-CLOSE {ident!r} has no REVIEW-OPEN in the post-baseline review stream"))

    still_open = [req for ident, req in opens.items() if ident not in closes]
    still_open.sort(key=lambda r: (r.source, r.ident))
    return problems, still_open
