"""G96's three mutants (the brief's item 13), each applied to the changed source alone, the named unit tests
run against it, and the source put back and checked by sha256 whatever happened. A mutant is caught when
every named test fails on it (vitest's own per-test lines are kept, trimmed).

Usage (from the worktree root): python docs/prompts/runs/G96/scripts-mutants.py docs/prompts/runs/G96/mutants.txt
"""
import hashlib
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[4]
APP = ROOT / "app"
out = pathlib.Path(sys.argv[1]).resolve()

MUTANTS = [
    {
        "name": "1. Keep it playable offered again from no project (the evidence condition removed from the policy)",
        "file": "app/src/data/projectStore.ts",
        "find": "return state === undefined && !passed ? offered.filter((action) => action !== NEEDS_A_PASS) : offered;",
        "replace": "return offered;",
        "tests": [
            ("tests/unit/projectSheet.test.ts", "offers three ways in"),
            ("tests/unit/libraryProjects.test.ts", r"\(d\) no project on a song"),
            ("tests/unit/projectLifecycle.test.ts", r"\(a\) no project and no progress row"),
        ],
    },
    {
        "name": "2. The store accepting Keep it playable without the evidence while the sheet still hides it (the store's check reads no pass)",
        "file": "app/src/data/projectStore.ts",
        "find": "if (!actionsFor(existing?.state, passed).includes(action)) {",
        "replace": "if (!actionsFor(existing?.state, passed || action === 'keep').includes(action)) {",
        "tests": [
            ("tests/unit/projectLifecycle.test.ts", r"\(a\) no project and no progress row"),
            ("tests/unit/projectLifecycle.test.ts", r"\(b\) a run that did not pass"),
        ],
        # The sheet still hides it: the sheet's own case stays green on this mutant.
        "green": [("tests/unit/projectSheet.test.ts", "offers three ways in")],
    },
    {
        "name": "3. The refocus fallback removed from openSheet's close",
        "file": "app/src/ui/widgets.ts",
        "find": "if (returnFocus instanceof HTMLElement && !returnFocus.isConnected && options.refocus) {",
        "replace": "if (false as boolean) {",
        "tests": [
            ("tests/unit/sheetIsolation.test.ts", r"\(n\) the row was replaced"),
            ("tests/unit/libraryProjects.test.ts", r"\(u\) the door, Learn this"),
            ("tests/unit/progressProjects.test.ts", r"\(w\) Make it a project"),
        ],
    },
]


def sha(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run(file: str, name: str) -> tuple[int, str]:
    result = subprocess.run(
        f'npx vitest run {file} -t "{name}"',
        cwd=APP,
        shell=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    text = result.stdout + result.stderr
    lines = [line for line in text.splitlines() if re.search(r"✓|×|Tests |FAIL|AssertionError", line)]
    return result.returncode, "\n".join(lines[:12])


with out.open("w", encoding="utf-8") as log:
    for mutant in MUTANTS:
        path = ROOT / mutant["file"]
        original = path.read_bytes()
        before = sha(path)
        text = original.decode("utf-8")
        log.write(f"## {mutant['name']}\n{mutant['file']}\n")
        if text.count(mutant["find"]) != 1:
            log.write(f"MARKER NOT FOUND ONCE ({text.count(mutant['find'])}): not applied\n\n")
            continue
        try:
            path.write_bytes(text.replace(mutant["find"], mutant["replace"]).encode("utf-8"))
            caught = True
            for file, name in mutant["tests"]:
                code, lines = run(file, name)
                log.write(f"- {file} -t {name}: exit {code} ({'caught' if code != 0 else 'NOT CAUGHT'})\n{lines}\n")
                caught = caught and code != 0
            for file, name in mutant.get("green", []):
                code, lines = run(file, name)
                log.write(f"- (stays green on this mutant) {file} -t {name}: exit {code}\n{lines}\n")
            log.write(f"=> {'CAUGHT by every named test' if caught else 'NOT CAUGHT by every named test'}\n")
        finally:
            path.write_bytes(original)
            log.write(f"source restored, sha256 equal: {sha(path) == before}\n\n")
        log.flush()
print("\n".join(line for line in out.read_text(encoding="utf-8").splitlines() if line.startswith(("##", "=>", "source restored"))).encode("ascii", "replace").decode("ascii"))
