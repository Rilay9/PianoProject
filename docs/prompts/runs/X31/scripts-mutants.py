"""
X31's mutants: each takes one rule out of `opening_quarter_bpm` in a copy of `difficulty.py` (the tree's file is
never touched), runs this tree's `test_difficulty.py` against the copy, and prints the result. A mutant is killed
when the run fails.

    python docs/prompts/runs/X31/scripts-mutants.py <scratch dir>
"""
from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
SOURCE = ROOT / "tools" / "content" / "difficulty.py"
TESTS = ROOT / "tools" / "content" / "tests" / "test_difficulty.py"

MUTANTS = {
    # The beat unit ignored: the mark's raw number, as the committed code read it.
    "raw-number": (
        "    bpm = mark.getQuarterBPM()\n",
        "    bpm = mark.numberSounding if mark.numberSounding is not None else mark.number\n",
    ),
    # The first readable mark `recurse()` meets, wherever it stands.
    "first-found": (
        "        if best is None or (offset, order) < best:\n",
        "        if best is None:\n",
    ),
    # music21's number for a tempo word counted as the file's.
    "implicit-counted": (
        "    if mark.numberSounding is None and mark.numberImplicit:\n        return None\n",
        "",
    ),
}


def main() -> int:
    scratch = Path(sys.argv[1])
    text = SOURCE.read_text(encoding="utf-8")
    killed = 0
    for name, (old, new) in MUTANTS.items():
        # The tree's files keep CRLF on Windows checkouts; match either.
        body = text.replace("\r\n", "\n")
        if body.count(old) != 1:
            print(f"{name}: the line to change was found {body.count(old)} times; not run")
            continue
        home = scratch / f"x31-mutant-{name}" / "content"
        if home.exists():
            shutil.rmtree(home)
        (home / "tests").mkdir(parents=True)
        (home / "difficulty.py").write_text(body.replace(old, new), encoding="utf-8")
        shutil.copy2(TESTS, home / "tests" / "test_difficulty.py")
        run = subprocess.run(
            [sys.executable, "-m", "unittest", "discover", "-s", str(home / "tests"), "-p", "test_difficulty.py"],
            capture_output=True, text=True, encoding="utf-8", errors="replace",
        )
        failing = [line for line in run.stderr.splitlines() if line.startswith(("FAIL:", "ERROR:"))]
        verdict = "killed" if run.returncode != 0 else "SURVIVED"
        killed += run.returncode != 0
        print(f"== {name}: {verdict} (exit {run.returncode}); {len(failing)} failing")
        for line in failing:
            print(f"   {line}")
        tail = [line for line in run.stderr.splitlines() if line.startswith(("Ran ", "OK", "FAILED"))]
        print("   " + "; ".join(tail))
    print(f"killed {killed} of {len(MUTANTS)}")
    return 0 if killed == len(MUTANTS) else 1


if __name__ == "__main__":
    raise SystemExit(main())
