"""G1b: builds HEAD's app into app/dist-head for the browser spec's red run. Every source file G1b
changed is put back to HEAD's bytes, `vite build --outDir dist-head` runs (vite bundles only what the
entry reaches, so the new modules, which nothing at HEAD imports, are not in it), and every file is
restored by its bytes (sha256 checked). Run from the worktree root; writes
docs/prompts/runs/G1b/build-app-head.txt."""
import hashlib
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
FILES = [
    'app/src/data/db.ts',
    'app/src/data/backup.ts',
    'app/src/ui/help.ts',
    'app/src/ui/screens/ScoreScreen.ts',
    'app/src/ui/screens/ProgressScreen.ts',
    'app/src/ui/screens/LessonScreen.ts',
    'app/src/ui/screens/SettingsScreen.ts',
]
saved = {rel: (ROOT / rel).read_bytes() for rel in FILES}
out = []
try:
    for rel in FILES:
        blob = subprocess.run(['git', 'show', f'HEAD:{rel}'], cwd=ROOT, capture_output=True, check=True).stdout
        data = blob.replace(b'\r\n', b'\n').replace(b'\n', b'\r\n') if b'\r\n' in saved[rel] else blob
        (ROOT / rel).write_bytes(data)
        out.append(f'{rel}: HEAD\'s bytes written\n')
    result = subprocess.run('npx vite build --outDir dist-head', cwd=ROOT / 'app', capture_output=True, text=True, encoding='utf-8', errors='replace', shell=True)
    out.append(result.stdout[-3000:] + result.stderr[-3000:])
    out.append(f'exit={result.returncode}\n')
finally:
    for rel, data in saved.items():
        (ROOT / rel).write_bytes(data)
        assert hashlib.sha256((ROOT / rel).read_bytes()).hexdigest() == hashlib.sha256(data).hexdigest(), rel
    out.append('every file restored by its bytes (sha256 equal)\n')
(ROOT / 'docs/prompts/runs/G1b/build-app-head.txt').write_text(''.join(out), encoding='utf-8')
