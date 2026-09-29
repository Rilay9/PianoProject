"""
G1c: the final tests over the committed sources. HEAD's `PlanScreen.ts` and `session.ts` are written
in place (with the checkout's CRLF), the new Plan file, the revised guard and `lessonClaimsAboutApp`
(the whole suite's two reds) are run, and this tree's two files are put back by their bytes, sha256
checked. Run from the repository root; writes docs/prompts/runs/G1c/red/red-vitest-final-tests-head-sources.txt.
"""
import hashlib
import subprocess
from pathlib import Path

FILES = ["app/src/ui/screens/PlanScreen.ts", "app/src/curriculum/session.ts"]
TESTS = ["tests/unit/planProjectStage.test.ts", "tests/unit/projectLifecycle.test.ts", "tests/unit/lessonClaimsAboutApp.test.ts"]
LOG = Path("docs/prompts/runs/G1c/red/red-vitest-final-tests-head-sources.txt")

saved = {rel: Path(rel).read_bytes() for rel in FILES}
digests = {rel: hashlib.sha256(data).hexdigest() for rel, data in saved.items()}
lines = []
try:
    for rel in FILES:
        blob = subprocess.run(["git", "show", f"HEAD:{rel}"], capture_output=True, check=True).stdout
        Path(rel).write_bytes(blob.replace(b"\r\n", b"\n").replace(b"\n", b"\r\n"))
        status = subprocess.run(["git", "status", "--porcelain", "--", rel], capture_output=True, text=True).stdout.strip()
        lines.append(f"{rel}: HEAD's blob written; git status: {status or 'clean'}")
    run = subprocess.run(["npx", "vitest", "run", *TESTS], cwd="app", capture_output=True, text=True, encoding="utf-8", errors="replace", shell=True)
    lines.append(run.stdout)
    lines.append(run.stderr)
    lines.append(f"exit={run.returncode}")
finally:
    for rel, data in saved.items():
        Path(rel).write_bytes(data)
        assert hashlib.sha256(Path(rel).read_bytes()).hexdigest() == digests[rel], f"{rel} not restored"
        lines.append(f"{rel}: this tree's bytes restored, sha256 {digests[rel]}")
LOG.write_text("\n".join(lines) + "\n", encoding="utf-8")
print("\n".join(line for line in lines if line.startswith(("app/", "exit=")) or "Tests " in line or "×" in line))
