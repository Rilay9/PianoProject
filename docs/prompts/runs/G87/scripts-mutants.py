"""G87 mutants: each one change to `style.css` or `LessonScreen.ts`, the two unit files run, the file
restored by its bytes (sha256 checked). A mutant is caught when vitest exits non-zero.
The capture is mutants.txt.  Run from the worktree:  python docs/prompts/runs/G87/scripts-mutants.py
"""
from __future__ import annotations

import hashlib
import re
import subprocess
import sys
from pathlib import Path

W = Path(__file__).resolve().parents[4]
APP = W / "app"
OUT = W / "docs" / "prompts" / "runs" / "G87" / "mutants.txt"
TESTS = "tests/unit/projectSheet.test.ts tests/unit/stage9ProjectsPage.test.ts"
CSS = "app/src/style.css"
LESSON = "app/src/ui/screens/LessonScreen.ts"
DATE_RULE = re.compile(r"\.sheet__body input\[type='date'\] \{[^}]*\}")

def date_rule(edit):
    def apply(text: str) -> str:
        found = DATE_RULE.search(text)
        assert found, "the date rule is not in style.css"
        return text[: found.start()] + edit(found.group(0)) + text[found.end():]
    return apply

MUTANTS = [
    ("start-always-short (every stage's line loses the clause)", LESSON,
     lambda t: t.replace("target.id === first && !isProjectRung(rung)", "false", 1)),
    ("start-project-ignored (the committed condition)", LESSON,
     lambda t: t.replace("target.id === first && !isProjectRung(rung)", "target.id === first", 1)),
    ("badge-pass-style (item 3: a project's badge back in the pass style)", LESSON,
     lambda t: t.replace("PROJECT_TEXT.notStarted, 'neutral')", "PROJECT_TEXT.notStarted, project ? 'passed' : 'neutral')", 1)),
    ("badge-pass-style-but-paused (item 3: only paused and put away neutral)", LESSON,
     lambda t: t.replace("PROJECT_TEXT.notStarted, 'neutral')", "PROJECT_TEXT.notStarted, project && project.state !== 'paused' && project.state !== 'retired' ? 'passed' : 'neutral')", 1)),
    ("date-no-face (the font line dropped)", CSS,
     date_rule(lambda r: re.sub(r"\s*font: -webkit-small-control;", "", r))),
    ("date-no-radius (the corners dropped)", CSS,
     date_rule(lambda r: re.sub(r"\s*border-radius: 10px;", "", r))),
    ("date-other-size (type at 0.9rem)", CSS,
     date_rule(lambda r: r.replace("font-size: 1rem;", "font-size: 0.9rem;"))),
    ("date-rule-misses (the selector names another type)", CSS,
     date_rule(lambda r: r.replace("[type='date']", "[type='week']"))),
]


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> int:
    lines, caught = [], 0
    for name, path, mutate in MUTANTS:
        target = W / path
        kept = target.read_bytes()
        try:
            text = kept.decode("utf-8")
            changed = mutate(text)
            assert changed != text, f"{name}: the mutation changed nothing"
            target.write_bytes(changed.encode("utf-8"))
            run = subprocess.run(f"npx vitest run {TESTS}", cwd=APP, capture_output=True, shell=True)
            said = run.stdout.decode("utf-8", "replace")
            failed = [line.strip() for line in said.splitlines() if line.strip().startswith("×")]
            verdict = "caught" if run.returncode != 0 else "SURVIVED"
            caught += run.returncode != 0
            lines.append(f"{verdict}: {name} — vitest exit={run.returncode}; red: {failed}")
        finally:
            target.write_bytes(kept)
            lines.append(f"  restored {path}: sha256 {'match' if sha(target.read_bytes()) == sha(kept) else 'MISMATCH'}")
    lines.append(f"{caught} of {len(MUTANTS)} caught")
    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(lines[-1])
    return 0


if __name__ == "__main__":
    sys.exit(main())
