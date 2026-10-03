"""
L120c's mutants: each a one-place change to a working file, the named content tests run against it, the file
restored byte for byte (in `finally`). A mutant is killed when at least one named test fails beyond the control run
(the same tests on the unmutated files). Run from the worktree root, never while another check reads the files:

    python docs/prompts/runs/L120c/scripts-mutants.py OUT.txt
"""
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
TESTS = ["tests.test_sixteenths_owner", "tests.test_taught_at", "tests.test_measured_demands.TestTheRungTheItemSitsOn"]

MUTANTS: list[tuple[str, str, str, str]] = [
    ("the mapping row removed", "tools/content/claims.py",
     '    "sixteenth-notes": "rhythm.sixteenths",\r\n', ""),
    ("taughtAt back to []", "content/curriculum/vocabulary/demands.json",
     '"taughtAt": ["4.4"],', '"taughtAt": [],'),
    ("a second teaching rung on 4.4's path (ragtime.5)", "content/curriculum/vocabulary/demands.json",
     '"taughtAt": ["4.4"],', '"taughtAt": ["4.4", "ragtime.5"],'),
    ("4.4's claim removed, taughtAt kept", "content/curriculum/stage-4.json",
     '"transposition",\r\n                "sixteenth-notes"', '"transposition"'),
    ("latin.7 claims it too", "content/curriculum/stage-7.json",
     '"repeated-notes",\r\n                "performance-mode"\r\n', '"repeated-notes",\r\n                "performance-mode",\r\n                "sixteenth-notes"\r\n'),
    ("technique.6's claim removed", "content/curriculum/stage-6.json",
     '"meter-7-8",\r\n                "sixteenth-notes"', '"meter-7-8"'),
    ("4.4's paragraph removed", "content/lessons/4.4.md",
     None, None),
    ("jazz.4's claim removed, taughtAt kept", "content/curriculum/stage-4.json",
     '"triads",\r\n                "syncopation"', '"triads"'),
    ("jazz.4 dropped from syncopation's taughtAt", "content/curriculum/vocabulary/demands.json",
     '"taughtAt": ["4.5", "latin.3", "jazz.4"]', '"taughtAt": ["4.5", "latin.3"]'),
]


def run() -> tuple[int, set[str]]:
    proc = subprocess.run([sys.executable, "-m", "unittest", *TESTS], cwd=REPO / "tools" / "content",
                          capture_output=True, text=True)
    failed = set(re.findall(r"^(?:FAIL|ERROR): (\S+ \([^)]*\))", proc.stderr, re.M))
    return proc.returncode, failed


def main(out_path: str) -> int:
    lines = [f"L120c mutants over {', '.join(TESTS)}", ""]
    code, control = run()
    lines.append(f"control (unmutated): exit {code}, {len(control)} failing: {sorted(control)}")
    survived = 0
    for name, rel, old, new in MUTANTS:
        path = REPO / rel
        kept = path.read_bytes()
        text = kept.decode("utf-8")
        if old is None:  # the paragraph: from its bold lead-in to the blank line after it
            start = text.index("**Sixteenths.**")
            end = text.index("\r\n\r\n", start) + 4
            mutated = text[:start] + text[end:]
        else:
            assert text.count(old) == 1, (name, text.count(old))
            mutated = text.replace(old, new)
        try:
            path.write_bytes(mutated.encode("utf-8"))
            code, failed = run()
        finally:
            path.write_bytes(kept)
        red = sorted(failed - control)
        survived += 0 if red else 1
        lines.append(f"- {name} ({rel}): {'KILLED' if red else 'SURVIVED'} — {len(red)} red: {'; '.join(red[:6])}")
    lines.append("")
    lines.append(f"{len(MUTANTS)} mutants, {survived} survived; every file restored byte for byte")
    Path(out_path).write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1]))
