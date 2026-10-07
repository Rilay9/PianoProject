"""
G1d mutants (G1c's harness): each undoes or bends one part of the change and runs the unit cases that
should catch it; the file is restored by its bytes (sha256 checked) after each. Run from the repository
root; writes docs/prompts/runs/G1d/mutants.txt.
"""
import hashlib
import subprocess
from pathlib import Path

SESSION = "app/src/curriculum/session.ts"
TESTS = ["tests/unit/repertoireRetention.test.ts", "tests/unit/projectLifecycle.test.ts"]
LOOKUP = "    const project = projectIn(ctx.input.projects ?? [], { itemId: piece.itemId, material: materialOfItem(item) });\n"
CHECK = "    if (project?.state === 'paused' || project?.state === 'retired') continue;\n"
IMPORT = "import { PROJECT_STAGES, projectIn, type ProjectRow } from '../data/projectStore';"

MUTANTS = [
    # The suppression gone: the committed behaviour back.
    ("no-suppression", SESSION, CHECK, ""),
    # Only one of the two states the ruling names.
    ("paused-only", SESSION, CHECK, "    if (project?.state === 'paused') continue;\n"),
    ("retired-only", SESSION, CHECK, "    if (project?.state === 'retired') continue;\n"),
    # A third state suppressed: `maintaining` is the positive retention state.
    ("maintaining-suppressed", SESSION, CHECK, "    if (project?.state === 'paused' || project?.state === 'retired' || project?.state === 'maintaining') continue;\n"),
    # Any project at all suppresses.
    ("any-project-suppresses", SESSION, CHECK, "    if (project !== undefined) continue;\n"),
    # Identity by id alone: the same file under another id no longer found.
    ("identity-by-id-only", SESSION, LOOKUP, "    const project = projectIn(ctx.input.projects ?? [], { itemId: piece.itemId, material: undefined });\n"),
    # The suppression taken off the whole card: it moves the next piece's order (a skip that breaks the loop).
    ("suppression-stops-the-loop", SESSION, CHECK, "    if (project?.state === 'paused' || project?.state === 'retired') break;\n"),
    # The session opens the store itself.
    ("session-opens-the-store", SESSION, IMPORT, IMPORT.replace("projectIn,", "projectIn, allProjects,") + "\nvoid allProjects;"),
    # A second lookup, outside review().
    ("second-lookup-outside-review", SESSION, "export const REPERTOIRE_WINDOW_DAYS = 14;", "export const REPERTOIRE_WINDOW_DAYS = 14;\nexport const lookup = (rows: readonly ProjectRow[]): unknown => projectIn(rows, { itemId: '', material: undefined });"),
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

out = Path("docs/prompts/runs/G1d/mutants.txt")
out.write_text("\n".join(lines) + "\n", encoding="utf-8")
print("\n".join(lines))
