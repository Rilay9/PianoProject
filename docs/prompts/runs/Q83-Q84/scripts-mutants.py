"""Q83+Q84: each mutant applied to the worktree's file, the new tests run on it, the file restored byte for byte.

    python docs/prompts/runs/Q83-Q84/scripts-mutants.py test     # the test_import_mutopia mutants
    python docs/prompts/runs/Q83-Q84/scripts-mutants.py build    # the build.py mutants (never while a build runs)

A mutant is killed when `tools.content.tests.test_runner_log` exits non-zero on it.
"""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
BUILD = REPO / "tools" / "content" / "build.py"
MUTOPIA = REPO / "tools" / "content" / "tests" / "test_import_mutopia.py"

MUTANTS = {
    "test": [
        (MUTOPIA, "the placeholder condition inverted",
         'if rag is not None and not rag.get("file"):', 'if rag is not None and rag.get("file"):'),
        (MUTOPIA, "the reason left out",
         'why += f": {RAG} is a placeholder ({reason})"', 'why += f": {RAG} is a placeholder"'),
        (MUTOPIA, "the whole hint, not the reason",
         "hint[len(head):len(hint) - len(tail)] if", "hint if"),
    ],
    "build": [
        (BUILD, "warnings on a pass only",
         "detail=output if code else summary_line(output), warnings=warned)",
         "detail=output if code else summary_line(output), warnings=[] if code else warned)"),
        (BUILD, "the indentation kept",
         'warned = [line.strip() for line in output.splitlines() if line.strip().startswith("WARNING")]',
         'warned = [line for line in output.splitlines() if line.strip().startswith("WARNING")]'),
        (BUILD, "warnings dropped (HEAD's step)",
         ", warnings=warned)", ")"),
    ],
}


def main() -> int:
    env = {**os.environ, "PYTHONIOENCODING": "utf-8"}
    survivors = 0
    before = {path: path.read_bytes() for path, *_ in MUTANTS[sys.argv[1]]}
    for path, name, old, new in MUTANTS[sys.argv[1]]:
        original = path.read_bytes()
        text = original.decode("utf-8")
        assert text.count(old) == 1, f"{name}: the text to mutate is not in {path.name} exactly once"
        try:
            path.write_bytes(text.replace(old, new).encode("utf-8"))
            run = subprocess.run([sys.executable, "-m", "unittest", "tools.content.tests.test_runner_log"],
                                 cwd=REPO, env=env, capture_output=True, text=True, encoding="utf-8")
        finally:
            path.write_bytes(original)
        tail = [line for line in run.stderr.splitlines() if line.startswith(("FAIL:", "ERROR:", "Ran ", "OK", "FAILED"))]
        verdict = "killed" if run.returncode else "SURVIVED"
        survivors += run.returncode == 0
        print(f"{path.name}: {name}: {verdict} (exit {run.returncode})")
        for line in tail:
            print(f"    {line}")
    restored = all(path.read_bytes() == data for path, data in before.items())
    print(f"every file restored byte for byte: {restored}; survivors: {survivors}")
    if not restored:
        return 2
    return 1 if survivors else 0


if __name__ == "__main__":
    sys.exit(main())
