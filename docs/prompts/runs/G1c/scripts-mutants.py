"""
G1c mutants: each undoes one part of the change and runs the unit cases that should catch it; the
file is restored by its bytes (sha256 checked) after each. Run from the repository root; writes
docs/prompts/runs/G1c/mutants.txt.
"""
import hashlib
import subprocess
from pathlib import Path

PLAN = "app/src/ui/screens/PlanScreen.ts"
SESSION = "app/src/curriculum/session.ts"
TESTS = ["tests/unit/planProjectStage.test.ts", "tests/unit/projectLifecycle.test.ts"]

MUTANTS = [
    ("row-badge-back", PLAN, "      options.project\n        ? []\n        : state?.status", "      false\n        ? []\n        : state?.status"),
    ("stage-line-counts", PLAN, "        meta: project\n          ? PROJECT_TEXT.stageNine", "        meta: false\n          ? PROJECT_TEXT.stageNine"),
    ("stage-wears-complete", PLAN, "badges: !project && done === total", "badges: done === total"),
    ("stage-draws-bar", PLAN, "      if (!project) {\n        const share", "      if (true) {\n        const share"),
    ("legend-counts-stage-9", PLAN, "(stage) => !isProjectStage(stage) && completion", "(stage) => completion"),
    ("no-project-stage", PLAN, "  return PROJECT_STAGES.has(stage.number);", "  return false;"),
    ("session-own-constant", SESSION, "import { PROJECT_STAGES } from '../data/projectStore';", "const PROJECT_STAGES: ReadonlySet<number> = new Set([9]);"),
    ("session-reads-a-project", SESSION, "import { PROJECT_STAGES } from '../data/projectStore';", "import { PROJECT_STAGES, allProjects } from '../data/projectStore';\nvoid allProjects;"),
]

lines = []
for name, path, old, new in MUTANTS:
    p = Path(path)
    original = p.read_bytes()
    digest = hashlib.sha256(original).hexdigest()
    text = original.decode("utf-8")
    crlf = "\r\n" in text
    body = text.replace("\r\n", "\n")
    if body.count(old) != 1:
        lines.append(f"{name}: SKIPPED (anchor found {body.count(old)} times)")
        continue
    mutated = body.replace(old, new)
    p.write_bytes((mutated.replace("\n", "\r\n") if crlf else mutated).encode("utf-8"))
    try:
        run = subprocess.run(["npx", "vitest", "run", *TESTS], cwd="app", capture_output=True, text=True, encoding="utf-8", errors="replace", shell=True)
        failed = [line.strip() for line in run.stdout.splitlines() if line.strip().startswith("×")]
        verdict = "CAUGHT" if run.returncode != 0 else "SURVIVED"
        lines.append(f"{name}: {verdict} (vitest exit {run.returncode}); red: {' | '.join(failed) if failed else '-'}")
    finally:
        p.write_bytes(original)
        assert hashlib.sha256(p.read_bytes()).hexdigest() == digest, f"{path} not restored"
    lines.append(f"  {path} restored, sha256 {digest}")

out = Path("docs/prompts/runs/G1c/mutants.txt")
out.write_text("\n".join(lines) + "\n", encoding="utf-8")
print("\n".join(lines))
