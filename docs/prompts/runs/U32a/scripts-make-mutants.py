"""U32a's mutants of WindowRenderer.ts, written beside the kept copy (not for the commit).

Each replacement must match exactly once, or the mutant is not written and the script says so.
"""
from pathlib import Path

HERE = Path(__file__).parent
SRC = (HERE / "WindowRenderer.after.ts").read_text(encoding="utf-8")

MUTANTS = {
    # 1. The pricing pass answering MAX_SLOTS again: every sheet a stage can hold, once measured.
    "m1-max-slots": [
        (
            "    const atRest = this.priceWindowShape('slots', stage, MAX_SLOTS);\n",
            "    return MAX_SLOTS;\n    const atRest = this.priceWindowShape('slots', stage, MAX_SLOTS);\n",
        ),
    ],
    # 3. The run's stage not priced: only the shape at rest decides the sheets.
    "m3-rest-only": [
        (
            "    const alsoRun = run !== null && ",
            "    const alsoRun = false && run !== null && ",
        ),
    ],
    # 2. A load inside a run: every guard that keeps a sheet load out of a run removed.
    "m2-load-in-run": [
        (
            "    if (this.running || this.frozen) return false;\n    const need = this.sheetsNeeded();\n",
            "    const need = this.sheetsNeeded();\n",
        ),
        (
            "      if (this.running || this.frozen) {\n        // A run started since it was queued: the loads resume when it stops.\n",
            "      if (false) {\n        // A run started since it was queued: the loads resume when it stops.\n",
        ),
        (
            "    if (this.currentStep < 0 || this.running || this.frozen || this.fitting || this.fitHandle !== null) return null;\n",
            "    if (this.currentStep < 0 || this.fitting || this.fitHandle !== null) return null;\n",
        ),
    ],
}

for name, edits in MUTANTS.items():
    text = SRC
    ok = True
    for old, new in edits:
        n = text.count(old)
        if n != 1:
            print(f"{name}: expected one match, found {n}: {old[:60]!r}")
            ok = False
            break
        text = text.replace(old, new)
    if ok:
        (HERE / f"WindowRenderer.{name}.ts").write_text(text, encoding="utf-8")
        print(f"{name}: written")
