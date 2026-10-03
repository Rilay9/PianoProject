"""Builds the base's app (the lane's source files put back to HEAD for the build only, then restored and
checked by hash) and runs the lane's final walk spec against it: the red-first, measured by the same judge.
Writes build/u122c-base/; the tree is rebuilt as it is by the mutant script that follows."""
import hashlib
import os
import subprocess

ROOT = os.getcwd()
APP = os.path.join(ROOT, 'app')
OUT = os.path.join(ROOT, 'build', 'u122c-base')
os.makedirs(OUT, exist_ok=True)
FILES = ['app/src/ui/screens/ScoreScreen.ts', 'app/src/style.css', 'app/src/score/WindowRenderer.ts']
NPM = 'npm.cmd' if os.name == 'nt' else 'npm'


def sha(b):
    return hashlib.sha256(b).hexdigest()


saved = {f: open(os.path.join(ROOT, f), 'rb').read() for f in FILES}
log = os.path.join(OUT, 'build-base.txt')
try:
    for f in FILES:
        base = subprocess.check_output(['git', 'show', f'HEAD:{f}'], cwd=ROOT)
        if b'\r\n' in saved[f] and b'\r\n' not in base:
            base = base.replace(b'\n', b'\r\n')
        open(os.path.join(ROOT, f), 'wb').write(base)
    with open(log, 'w', encoding='utf-8') as fh:
        code = subprocess.call([NPM, 'run', 'build:app'], cwd=APP, stdout=fh, stderr=subprocess.STDOUT)
        fh.write(f'exit {code}\n')
finally:
    for f, b in saved.items():
        open(os.path.join(ROOT, f), 'wb').write(b)
        assert sha(open(os.path.join(ROOT, f), 'rb').read()) == sha(b), f
print('base build exit', code, '; sources restored')
env = dict(os.environ, U122C_OUT='build/u122c/base-final', U122C_SHOTS='build/u122c/shots-base', U122C_SHOT_PREFIX='before-')
with open(os.path.join(OUT, 'run-base.txt'), 'w', encoding='utf-8', errors='replace') as fh:
    code = subprocess.call(
        ['npx.cmd' if os.name == 'nt' else 'npx', 'playwright', 'test', '--config', 'build/u122c/playwright.u122c.config.ts', 'tests/e2e/score.task-chrome.spec.ts', '--workers=2'],
        cwd=APP, stdout=fh, stderr=subprocess.STDOUT, env=env,
    )
    fh.write(f'exit {code}\n')
print('base run exit', code)
