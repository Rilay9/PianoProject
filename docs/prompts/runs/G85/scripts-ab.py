"""A/B of one unit file on this tree's sources and on the committed ones, alternating, N rounds each:
does G85's change make `libraryImportWords.test.ts` fail, or is it the machine's load? The two changed
source files are moved aside under `build/g85/aside/` for the committed rounds and put back by sha256.

Usage (from the worktree root): python docs/prompts/runs/G85/scripts-ab.py <capture> <rounds> <test file>...
"""
import hashlib
import pathlib
import re
import shutil
import subprocess
import sys
import time

ROOT = pathlib.Path(__file__).resolve().parents[4]
FILES = ["app/src/ui/screens/LibraryScreen.ts", "app/src/ui/help.ts"]
ASIDE = ROOT / "build" / "g85" / "aside-ab"
out = pathlib.Path(sys.argv[1]).resolve()
rounds = int(sys.argv[2])
tests = sys.argv[3:]


def sha(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


ASIDE.mkdir(parents=True, exist_ok=True)
mine = {}
for name in FILES:
    mine[name] = sha(ROOT / name)
    shutil.copy2(ROOT / name, ASIDE / pathlib.Path(name).name)
heads = {name: subprocess.run(["git", "show", f"HEAD:{name}"], cwd=ROOT, check=True, capture_output=True).stdout for name in FILES}
lines = []
try:
    for index in range(rounds):
        for label in ("changed", "committed"):
            for name in FILES:
                if label == "committed":
                    (ROOT / name).write_bytes(heads[name])
                else:
                    shutil.copy2(ASIDE / pathlib.Path(name).name, ROOT / name)
            started = time.time()
            result = subprocess.run("npx vitest run " + " ".join(tests), cwd=ROOT / "app", shell=True, capture_output=True, text=True, encoding="utf-8", errors="replace")
            took = time.time() - started
            summary = re.findall(r"Tests\s+(.*)", result.stdout)
            failed = re.findall(r"×\s+(.*)", result.stdout)
            lines.append(f"round {index + 1} {label}: exit {result.returncode}; {summary[-1] if summary else '?'}; wall {took:.0f}s")
            for name in failed:
                lines.append(f"    x {name}")
finally:
    for name in FILES:
        shutil.copy2(ASIDE / pathlib.Path(name).name, ROOT / name)
    restored = all(sha(ROOT / name) == mine[name] for name in FILES)
    lines.append(f"changed sources restored, sha256 equal: {restored}")
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))
    if not restored:
        sys.exit(3)
