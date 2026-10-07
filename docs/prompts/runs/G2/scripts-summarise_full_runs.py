"""G2: a short summary of each full unit run (first line the command, the FAIL lines and totals, last line the exit)."""
from pathlib import Path

RUNS = Path("docs/prompts/runs/G2")
for name in ("vitest-full-1", "vitest-full-final"):
    lines = (RUNS / f"{name}.txt").read_text(encoding="utf-8", errors="replace").splitlines()
    keep = sorted({line.strip() for line in lines if line.startswith(" FAIL ") or "Test Files" in line or line.strip().startswith("Tests ")})
    out = [lines[0], *keep, lines[-1]]
    (RUNS / f"{name}-summary.txt").write_text("\n".join(out) + "\n", encoding="utf-8")
    print("\n".join(out), "\n")
