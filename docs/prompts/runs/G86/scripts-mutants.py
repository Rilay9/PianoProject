"""Runs the new unit file against three mutants of the fixed screen, one at a time.

Each mutant removes one piece of the fix; the file must go red on each. The fixed
screen is restored from build/g86/ScoreScreen.fixed.ts after every run.
"""
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
APP = ROOT / "app"
SCREEN = APP / "src" / "ui" / "screens" / "ScoreScreen.ts"
FIXED = ROOT / "build" / "g86" / "ScoreScreen.fixed.ts"
OUT = ROOT / "build" / "g86" / "mutants.txt"

MUTANTS = {
    "no-drain (the disposer does not close the sheets)": (
        "    for (const close of openSheets.splice(0)) close();\r\n",
        "",
    ),
    "no-bound (the wait has no timer)": (
        "    const bound = window.setTimeout(go, PLAY_SOUND_WAIT_MS);\r\n",
        "    const bound = 0;\r\n",
    ),
    "no-guard (a second tap in the wait asks again)": (
        "    if (startingSound) return;\r\n    startingSound = true;\r\n    playWaiting = true;\r\n",
        "    startingSound = true;\r\n    playWaiting = true;\r\n",
    ),
}

shutil.copyfile(SCREEN, FIXED)
fixed = FIXED.read_bytes().decode("utf8")
lines = []
try:
    for name, (old, new) in MUTANTS.items():
        count = fixed.count(old)
        if count != 1:
            lines.append(f"## {name}\nNOT APPLIED: the text occurs {count} times\n")
            continue
        SCREEN.write_bytes(fixed.replace(old, new).encode("utf8"))
        run = subprocess.run(
            "npx vitest run tests/unit/scoreSheetsCloseAndPlayStartsSound.test.ts",
            cwd=APP, shell=True, capture_output=True, text=True, encoding="utf8", errors="replace",
        )
        summary = [l for l in (run.stdout + run.stderr).splitlines()
                   if " × " in l or "Tests " in l or "AssertionError" in l]
        lines.append(f"## {name}\nexit {run.returncode}\n" + "\n".join(summary) + "\n")
finally:
    shutil.copyfile(FIXED, SCREEN)
OUT.write_text("\n".join(lines), encoding="utf8")
print(OUT.read_text(encoding="utf8"))
