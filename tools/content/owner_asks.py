"""Fail-closed guard against assigning automatable QA to the owner in new reviewer handoffs.

The frozen baseline is history. Every later immutable handoff is scanned. A genuinely non-automatable
owner/device observation must declare exactly one property and reason immediately before exactly one
owner-check line; that exception never exempts the rest of the handoff.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
HANDOFFS_REL = Path("docs/review/handoffs")
BASELINE_REL = Path("tools/content/tests/owner_ask_baseline.json")
EXPECTED_BASELINE_COUNT = 222

ASKS = [
    re.compile(r"\b(your|the owner'?s)\s+(phone[\s-]?walk|walk[\s-]?through|walk|confirmation|sign[\s-]?off)\b", re.I),
    re.compile(r"\b(waits?|waiting|blocked|gated?)\s+(only\s+)?(on|for)\s+(you\b|your\b|the owner)", re.I),
    re.compile(r"\b(you|the owner)\s+(should\s+|could\s+|can\s+|need\s+to\s+|must\s+|will\s+)?(check|confirm|verify|tick|walk|test|try\s+it)\b", re.I),
    re.compile(r"\bon\s+(your|the owner'?s)\s+(phone|tablet|device)\b", re.I),
    re.compile(r"\b(owner|you)\s+(plays?|opens?)\b[^.\n]{0,60}\b(and|to)\s+(checks?|confirms?|see\s+whether|verif(y|ies))\b", re.I),
]
NON_AUTOMATABLE = re.compile(r"^\s*Non-automatable:\s*\S.{3,}\s+-\s+\S.{5,}\s*$", re.I)


def owner_asks(text: str) -> list[str]:
    """Owner-verification lines not covered by one immediately preceding non-automatable declaration."""
    found: list[str] = []
    permit_next_ask = False
    for line in text.splitlines():
        if line.lstrip().startswith(">"):
            continue
        if NON_AUTOMATABLE.match(line):
            permit_next_ask = True
            continue
        if not line.strip():
            continue
        is_ask = any(pattern.search(line) for pattern in ASKS)
        if is_ask and permit_next_ask:
            permit_next_ask = False
            continue
        if is_ask:
            found.append(line.strip()[:160])
        permit_next_ask = False
    return found


def problems(root: Path = ROOT) -> list[tuple[str, str]]:
    """Return (file, message) failures for baseline integrity and every post-baseline handoff."""
    handoffs = root / HANDOFFS_REL
    baseline_path = root / BASELINE_REL

    # Tiny fixture trees that contain no review stream are outside this guard's domain.
    if not handoffs.exists() and not baseline_path.exists():
        return []

    if not baseline_path.is_file():
        return [(BASELINE_REL.as_posix(), "owner-work baseline is missing; refusing to skip historical handoffs")]

    try:
        rows = json.loads(baseline_path.read_text(encoding="utf-8"))["files"]
    except (OSError, ValueError, KeyError, TypeError):
        return [(BASELINE_REL.as_posix(), "owner-work baseline is unreadable")]

    failures: list[tuple[str, str]] = []
    if not isinstance(rows, list) or len(rows) != EXPECTED_BASELINE_COUNT or len(set(rows)) != EXPECTED_BASELINE_COUNT:
        failures.append(
            (
                BASELINE_REL.as_posix(),
                f"frozen owner-work baseline must remain exactly {EXPECTED_BASELINE_COUNT} unique files",
            )
        )
        baseline: set[str] = set(rows) if isinstance(rows, list) else set()
    else:
        baseline = set(rows)

    actual = {path.name for path in handoffs.glob("*.md")}
    missing = sorted(baseline - actual)
    if missing:
        failures.append(
            (BASELINE_REL.as_posix(), "frozen owner-work baseline names missing historical handoff(s): " + ", ".join(missing))
        )

    for path in sorted(handoffs.glob("*.md")):
        if path.name in baseline:
            continue
        asks = owner_asks(path.read_text(encoding="utf-8"))
        if asks:
            failures.append(
                (
                    path.relative_to(root).as_posix(),
                    "asks the owner to verify what another actor/test should establish: " + " | ".join(asks),
                )
            )
    return failures
