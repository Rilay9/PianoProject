"""G1b: the final test files over HEAD's consumer files — the five screens and modules the brief gives
G1b a line of (the Score screen, Progress, the lesson page, the backup, Settings) put back to HEAD's
bytes, with G1b's new modules (projectStore, projectSheet), db.ts and help.ts left as they are so the
tests can load — then every file restored by its bytes (sha256 checked). Shows each door and reader
case red without G1b's line in that file. Also runs lessonClaimsAboutApp.test.ts, whose two reds are
the recorded line-ending ones, to show them the same on HEAD's Score screen.
Run from the worktree root; writes docs/prompts/runs/G1b/red/red-vitest-final-tests-head-consumers.txt."""
import hashlib
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
FILES = [
    'app/src/ui/screens/ScoreScreen.ts',
    'app/src/ui/screens/ProgressScreen.ts',
    'app/src/ui/screens/LessonScreen.ts',
    'app/src/data/backup.ts',
    'app/src/ui/screens/SettingsScreen.ts',
]
TESTS = [
    'tests/unit/projectLifecycle.test.ts',
    'tests/unit/projectSheet.test.ts',
    'tests/unit/stage9ProjectsPage.test.ts',
    'tests/unit/progressProjects.test.ts',
    'tests/unit/projectOnTheFinishSheet.test.ts',
    'tests/unit/backup.test.ts',
    'tests/unit/lessonClaimsAboutApp.test.ts',
]
saved = {rel: (ROOT / rel).read_bytes() for rel in FILES}
out = []
try:
    for rel in FILES:
        blob = subprocess.run(['git', 'show', f'HEAD:{rel}'], cwd=ROOT, capture_output=True, check=True).stdout
        crlf = b'\r\n' in saved[rel]
        data = blob.replace(b'\r\n', b'\n').replace(b'\n', b'\r\n') if crlf else blob
        (ROOT / rel).write_bytes(data)
        out.append(f'{rel}: HEAD\'s bytes written (sha256 {hashlib.sha256(data).hexdigest()[:16]}…)\n')
    result = subprocess.run(['npx', 'vitest', 'run', *TESTS], cwd=ROOT / 'app', capture_output=True, text=True, encoding='utf-8', errors='replace', shell=True)
    out.append(result.stdout + result.stderr)
    out.append(f'exit={result.returncode}\n')
finally:
    for rel, data in saved.items():
        (ROOT / rel).write_bytes(data)
        assert hashlib.sha256((ROOT / rel).read_bytes()).hexdigest() == hashlib.sha256(data).hexdigest(), rel
    out.append('every file restored by its bytes (sha256 equal)\n')
target = ROOT / 'docs/prompts/runs/G1b/red/red-vitest-final-tests-head-consumers.txt'
target.write_text(''.join(out), encoding='utf-8')
sys.stdout.reconfigure(encoding='utf-8')  # the first run's summary print failed on the console's code page, after the capture was written
print(''.join(line for line in ''.join(out).splitlines(keepends=True) if 'FAIL' in line or '×' in line or 'Test Files' in line or 'Tests ' in line or 'exit=' in line or 'restored' in line))
