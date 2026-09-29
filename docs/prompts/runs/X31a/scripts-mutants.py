"""
X31a's mutants (X31's script, X31a's rules): each takes one rule out of `opening_quarter_bpm`'s opening check in
a copy of `difficulty.py` (the tree's file is never touched), runs this tree's `test_difficulty.py` against the
copy, and prints the result. A mutant is killed when the run fails.

    python docs/prompts/runs/X31a/scripts-mutants.py <scratch dir>
"""
from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
SOURCE = ROOT / "tools" / "content" / "difficulty.py"
TESTS = ROOT / "tools" / "content" / "tests" / "test_difficulty.py"

LOOP = "    for element in sounding(score.recurse().notes):\n"
MUTANTS = {
    # X31's reading: the earliest readable mark opens whatever sounded before it.
    "no-sound-check": ("    if best is None or best[0] <= 0:\n", "    if True:\n"),
    # A rest counted as sounding.
    "rests-count": (LOOP, "    for element in score.recurse().notesAndRests:\n"),
    # A chord symbol counted as sounding.
    "chord-symbols-count": (LOOP, "    for element in score.recurse().notes:\n"),
    # Only the first staff decides what has sounded.
    "first-staff-only": (LOOP, "    for element in sounding(score.parts[0].recurse().notes):\n"),
    # A note beginning where the mark stands counted as before it.
    "not-strict": ("        if at < best[0] - 1e-6:\n", "        if at <= best[0] + 1e-6:\n"),
    # A grace note not counted as sounding.
    "graces-left-out": (
        "        if at < best[0] - 1e-6:\n",
        "        if element.duration.isGrace:\n            continue\n        if at < best[0] - 1e-6:\n",
    ),
}


def main() -> int:
    scratch = Path(sys.argv[1])
    text = SOURCE.read_text(encoding="utf-8")
    killed = 0
    for name, (old, new) in MUTANTS.items():
        body = text.replace("\r\n", "\n")
        if body.count(old) != 1:
            print(f"{name}: the line to change was found {body.count(old)} times; not run")
            continue
        home = scratch / f"x31a-mutant-{name}" / "content"
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
