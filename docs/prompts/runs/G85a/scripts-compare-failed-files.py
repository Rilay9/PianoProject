"""Attributes the whole unit suite's failures: runs the files that failed there, alone, on this tree's
LibraryScreen.ts and then on HEAD's (swapped in and put back by sha256, as scripts-red-on-committed.py
does), each with vitest's JSON reporter under `build/g85a/`, and prints each run's failing test names and
the difference between the two. A failure on both is not G85a's; one only on this tree would be.

Usage (from the worktree root): python docs/prompts/runs/G85a/scripts-compare-failed-files.py <capture> <test file> ...
"""
import hashlib
import json
import pathlib
import shutil
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[4]
FILES = ["app/src/ui/screens/LibraryScreen.ts"]
ASIDE = ROOT / "build" / "g85a" / "aside-compare"
OUTDIR = ROOT / "build" / "g85a"
out = pathlib.Path(sys.argv[1]).resolve()
tests = sys.argv[2:]


def sha(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run(label: str) -> tuple[int, set[str], int]:
    report = OUTDIR / f"compare-{label}.json"
    result = subprocess.run(f'npx vitest run --reporter=json --outputFile="{report}" ' + " ".join(tests), cwd=ROOT / "app", shell=True, capture_output=True)
    data = json.loads(report.read_text(encoding="utf-8"))
    failed = set()
    total = 0
    for suite in data.get("testResults", []):
        name = pathlib.Path(suite["name"]).name
        for case in suite.get("assertionResults", []):
            total += 1
            if case.get("status") == "failed":
                failed.add(f"{name} > {case.get('fullName')}")
        if suite.get("status") == "failed" and not suite.get("assertionResults"):
            failed.add(f"{name} > (the file failed to run: {suite.get('message', '')[:200]})")
    return result.returncode, failed, total


lines = [f"files: {' '.join(tests)}"]
code_tree, failed_tree, total_tree = run("tree")
lines.append(f"this tree: exit {code_tree}, {len(failed_tree)} failed of {total_tree}")
ASIDE.mkdir(parents=True, exist_ok=True)
before = {name: sha(ROOT / name) for name in FILES}
for name in FILES:
    shutil.copy2(ROOT / name, ASIDE / pathlib.Path(name).name)
try:
    for name in FILES:
        (ROOT / name).write_bytes(subprocess.run(["git", "show", f"HEAD:{name}"], cwd=ROOT, check=True, capture_output=True).stdout)
    code_head, failed_head, total_head = run("head")
finally:
    for name in FILES:
        shutil.copy2(ASIDE / pathlib.Path(name).name, ROOT / name)
    restored = all(sha(ROOT / name) == before[name] for name in FILES)
lines.append(f"HEAD's LibraryScreen.ts: exit {code_head}, {len(failed_head)} failed of {total_head}; restored, sha256 equal: {restored}")
lines.append(f"failed on this tree only: {len(failed_tree - failed_head)}")
lines += [f"  {one}" for one in sorted(failed_tree - failed_head)]
lines.append(f"failed on HEAD only: {len(failed_head - failed_tree)}")
lines += [f"  {one}" for one in sorted(failed_head - failed_tree)]
lines.append(f"failed on both: {len(failed_tree & failed_head)}")
lines += [f"  {one}" for one in sorted(failed_tree & failed_head)]
lines.append("exit=0" if restored else "exit=3")
out.write_text("\n".join(lines) + "\n", encoding="utf-8")
print("\n".join(lines[:6]))
