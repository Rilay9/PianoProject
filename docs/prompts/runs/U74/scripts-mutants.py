"""U74's mutants: each change in WindowRenderer.ts undone on its own, the stage unit file run against it.

Run from the worktree root: python docs/prompts/runs/U74/scripts/mutants.py
Each mutant's output lands in docs/prompts/runs/U74/mutants/<name>.txt; the source is restored after
every run and verified byte-identical at the end.
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[5]
SRC = ROOT / "app" / "src" / "score" / "WindowRenderer.ts"
OUT = ROOT / "docs" / "prompts" / "runs" / "U74" / "mutants"
TEST = "tests/unit/windowRendererStage.test.ts"
LF = chr(10)
CRLF = chr(13) + chr(10)

# (name, what it undoes, text in the changed source, text put in its place); LF-joined lines.
MUTANTS: list[tuple[str, str, list[str], list[str]]] = [
    (
        "no-preload",
        "the probe not loaded in create",
        ["    if (options.model.sourceMeasureCount <= PROBE_MAX_BARS) {", "      try {", "        await probe.load("],
        ["    if (false) {", "      try {", "        await probe.load("],
    ),
    (
        "preload-always",
        "the probe loaded in create whatever the piece's length",
        ["    if (options.model.sourceMeasureCount <= PROBE_MAX_BARS) {", "      try {"],
        ["    if (true) {", "      try {"],
    ),
    (
        "no-measure-before-pricing",
        "measureBeforePricing does nothing",
        ["  private measureBeforePricing(): void {", "    if ("],
        ["  private measureBeforePricing(): void {", "    return;", "    if ("],
    ),
    (
        "measure-during-search",
        "measureBeforePricing also measures inside the engraving search",
        ["    if (this.disposed || this.fitting || this.running || this.layout !== 'window' || this.currentStep > 0) return;"],
        ["    if (this.disposed || this.running || this.layout !== 'window' || this.currentStep > 0) return;"],
    ),
    (
        "search-default-shape",
        "the search falls back to the default shape at each trial zoom",
        ["      if (this.fitting) {", "        return {"],
        ["      if (false) {", "        return {"],
    ),
    (
        "settled-at-once",
        "data-settled said in the task that finished the fit",
        ["    if (this.el.dataset.settled === 'true' || this.settledCheck !== null) return;"],
        ["    this.el.dataset.settled = 'true';", "    return;"],
    ),
    (
        "no-observer-unsettle",
        "a stage change does not take the word back",
        ["        this.cancelSettledCheck();", "        delete this.el.dataset.settled;", "        this.stageHeight = -1;"],
        ["        this.stageHeight = -1;"],
    ),
]


def main() -> int:
    original = SRC.read_bytes()
    crlf = CRLF.encode("utf-8") in original
    text = original.decode("utf-8").replace(CRLF, LF)
    summary: list[str] = []
    try:
        for name, what, old_lines, new_lines in MUTANTS:
            old = LF.join(old_lines)
            new = LF.join(new_lines)
            if text.count(old) != 1:
                summary.append(f"{name}: SKIPPED, the text to mutate occurs {text.count(old)} times")
                continue
            mutated = text.replace(old, new)
            SRC.write_bytes((mutated.replace(LF, CRLF) if crlf else mutated).encode("utf-8"))
            run = subprocess.run(
                "npx vitest run " + TEST,
                cwd=ROOT / "app",
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                shell=True,
            )
            output = run.stdout + run.stderr
            (OUT / f"{name}.txt").write_text(f"mutant: {what}{LF}{output}{LF}exit {run.returncode}{LF}", encoding="utf-8")
            failed = [line.strip() for line in output.splitlines() if line.strip().startswith("×")]
            verdict = "RED" if run.returncode != 0 else "survived"
            summary.append(f"{name} ({what}): {verdict}, exit {run.returncode}; " + ("; ".join(failed) or "no test failed"))
            SRC.write_bytes(original)
    finally:
        SRC.write_bytes(original)
    assert SRC.read_bytes() == original, "the source was not restored"
    report = LF.join(summary) + LF + "source restored byte-identical" + LF
    (OUT / "summary.txt").write_text(report, encoding="utf-8")
    print(report)
    return 0


if __name__ == "__main__":
    sys.exit(main())
