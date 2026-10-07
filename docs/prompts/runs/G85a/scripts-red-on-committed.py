"""Runs G85a's final unit tests against the committed LibraryScreen.ts: the changed source is moved
aside under the worktree's `build/g85a/aside/`, HEAD's bytes put in its place, vitest run on the two
files, and the changed source put back and checked by sha256, whatever happened (G85's script, one
source file).

Usage (from the worktree root): python docs/prompts/runs/G85a/scripts-red-on-committed.py <capture file>
"""
import hashlib
import pathlib
import shutil
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[4]
FILES = ["app/src/ui/screens/LibraryScreen.ts"]
TESTS = ["tests/unit/libraryProjects.test.ts", "tests/unit/projectLifecycle.test.ts"]
ASIDE = ROOT / "build" / "g85a" / "aside"
out = pathlib.Path(sys.argv[1]).resolve()


def sha(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


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
        capture.write(f"committed sources in place: {', '.join(FILES)} (HEAD's bytes)\n".encode())
        capture.flush()
        result = subprocess.run("npx vitest run " + " ".join(TESTS), cwd=ROOT / "app", shell=True, stdout=capture, stderr=subprocess.STDOUT)
        code = result.returncode
finally:
    for name in FILES:
        shutil.copy2(ASIDE / pathlib.Path(name).name, ROOT / name)
    restored = all(sha(ROOT / name) == before[name] for name in FILES)
    with out.open("ab") as capture:
        capture.write(f"\nvitest exit {code}\nchanged sources restored, sha256 equal: {restored}\n".encode())
    print(f"vitest exit {code}; restored {restored}")
    if not restored:
        sys.exit(3)
