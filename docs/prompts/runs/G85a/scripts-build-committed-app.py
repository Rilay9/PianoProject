"""Builds the committed code's app for the browser red and the before pictures: the changed
LibraryScreen.ts is moved aside under the worktree's `build/g85a/aside/`, HEAD's bytes put in its place,
the icons generated and `vite build` run into `build/g85a/dist-head`, and the changed source put back and
checked by sha256, whatever happened. Only LibraryScreen.ts differs from HEAD under `app/src`.

Usage (from the worktree root): python docs/prompts/runs/G85a/scripts-build-committed-app.py <capture file>
"""
import hashlib
import pathlib
import shutil
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[4]
FILES = ["app/src/ui/screens/LibraryScreen.ts"]
ASIDE = ROOT / "build" / "g85a" / "aside-build"
DIST = ROOT / "build" / "g85a" / "dist-head"
out = pathlib.Path(sys.argv[1]).resolve()


def sha(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


changed_under_src = subprocess.run(["git", "diff", "--name-only", "HEAD", "--", "app/src"], cwd=ROOT, check=True, capture_output=True, text=True).stdout.split()
ASIDE.mkdir(parents=True, exist_ok=True)
before = {}
for name in FILES:
    source = ROOT / name
    before[name] = sha(source)
    shutil.copy2(source, ASIDE / pathlib.Path(name).name)
code = 99
try:
    for name in FILES:
        head = subprocess.run(["git", "show", f"HEAD:{name}"], cwd=ROOT, check=True, capture_output=True).stdout
        (ROOT / name).write_bytes(head)
    with out.open("wb") as capture:
        capture.write(f"changed under app/src at HEAD: {changed_under_src}\n".encode())
        capture.write(f"committed sources in place: {', '.join(FILES)} (HEAD's bytes)\n".encode())
        capture.flush()
        result = subprocess.run(f'node scripts/generate-icons.mjs && npx vite build --outDir "{DIST}" --emptyOutDir', cwd=ROOT / "app", shell=True, stdout=capture, stderr=subprocess.STDOUT)
        code = result.returncode
finally:
    for name in FILES:
        shutil.copy2(ASIDE / pathlib.Path(name).name, ROOT / name)
    restored = all(sha(ROOT / name) == before[name] for name in FILES)
    with out.open("ab") as capture:
        capture.write(f"\nbuild exit {code}\nchanged sources restored, sha256 equal: {restored}\n".encode())
    print(f"build exit {code}; restored {restored}")
    if not restored:
        sys.exit(3)
