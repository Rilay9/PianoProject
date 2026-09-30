"""Builds the committed code's app for the browser red and the before pictures: every changed source under
`app/src` is copied aside under the worktree's `build/g96/aside-build/`, HEAD's bytes put in its place, the
icons generated and `vite build` run into `build/g96/dist-head`, and the changed sources put back and
checked by sha256, whatever happened.

Usage (from the worktree root): python docs/prompts/runs/G96/scripts-build-committed-app.py <capture file>
"""
import hashlib
import pathlib
import shutil
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[4]
ASIDE = ROOT / "build" / "g96" / "aside-build"
DIST = ROOT / "build" / "g96" / "dist-head"
out = pathlib.Path(sys.argv[1]).resolve()


def sha(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


files = subprocess.run(["git", "diff", "--name-only", "HEAD", "--", "app/src"], cwd=ROOT, check=True, capture_output=True, text=True).stdout.split()
ASIDE.mkdir(parents=True, exist_ok=True)
before = {}
for name in files:
    source = ROOT / name
    before[name] = sha(source)
    shutil.copy2(source, ASIDE / name.replace("/", "__"))
code = 99
try:
    for name in files:
        head = subprocess.run(["git", "show", f"HEAD:{name}"], cwd=ROOT, check=True, capture_output=True).stdout
        (ROOT / name).write_bytes(head)
    with out.open("wb") as capture:
        capture.write(f"changed under app/src (HEAD's bytes put in place for this build): {files}\n".encode())
        capture.flush()
        result = subprocess.run(f'node scripts/generate-icons.mjs && npx vite build --outDir "{DIST}" --emptyOutDir', cwd=ROOT / "app", shell=True, stdout=capture, stderr=subprocess.STDOUT)
        code = result.returncode
finally:
    for name in files:
        shutil.copy2(ASIDE / name.replace("/", "__"), ROOT / name)
    restored = all(sha(ROOT / name) == before[name] for name in files)
    with out.open("ab") as capture:
        capture.write(f"\nbuild exit {code}\nchanged sources restored, sha256 equal: {restored}\n".encode())
    print(f"build exit {code}; restored {restored}")
    if not restored:
        sys.exit(3)
