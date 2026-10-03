"""U118, option (iii): copy the build's kept files into docs/prompts/runs/U118 (prefix `iii-`), machine paths
replaced by <worktree> and <home>; a file over 300 KB is refused, and the full unit log is kept as its summary
lines only. Run from the worktree root."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path.cwd()
RUNS = ROOT / "docs" / "prompts" / "runs" / "U118"
HOME = Path.home()
LIMIT = 300 * 1024
B = "build/u118/"
A = "app/build/u118/"

PAIRS = {
    A + "fix-table-upright.md": "iii-ordinary-and-turned-upright.md",
    A + "fix-table-not-tablets.md": "iii-ordinary-and-turned-not-tablets.md",
    B + "mutants/mutants.md": "iii-mutants.md",
    B + "mutants-run.txt": "iii-mutants-run.txt",
    B + "gallery-summary.md": "iii-gallery-summary.md",
    B + "states-fix.txt": "iii-gallery-u118.txt",
    B + "mutants/base-gallery.txt": "iii-gallery-before-u118.txt",
    B + "e2e-targeted.txt": "iii-e2e-targeted.txt",
    B + "wr-u118-2.txt": "iii-window-rule-u118-cases.txt",
    B + "probe-fix-upright.txt": "iii-probe-upright.txt",
    B + "probe-fix-not-tablets.txt": "iii-probe-not-tablets.txt",
    B + "disc-after.txt": "iii-disc-after.txt",
    B + "disc-crossing.txt": "iii-disc-crossing-before-the-fold.txt",
    B + "pictures-after.txt": "iii-pictures-after.txt",
    B + "unit-stage-5.txt": "iii-unit-window-renderer-stage.txt",
    B + "unit-three-rerun.txt": "iii-unit-three-timeouts-rerun.txt",
    B + "mutants/unit-four-on-base.txt": "iii-unit-four-on-base-source.txt",
    B + "unit-lessonclaims-lf.txt": "iii-unit-lesson-claims-lf.txt",
    B + "tsc-final.txt": "iii-tsc.txt",
    B + "lint-final.txt": "iii-lint.txt",
    B + "build-app-fix2.txt": "iii-build-app.txt",
    A + "summarise_fix.py": "iii-scripts-summarise_fix.py",
    A + "probe/stop.spec.ts": "iii-scripts-stop.spec.ts",
    A + "disc/folded-chip.spec.ts": "iii-scripts-folded-chip.spec.ts",
    A + "disc/pictures.spec.ts": "iii-scripts-pictures.spec.ts",
    A + "playwright.states.u118-5313.config.ts": "iii-scripts-playwright.states.u118-5313.config.ts",
    B + "mutants.py": "iii-scripts-mutants.py",
    B + "gallery_variant.py": "iii-scripts-gallery_variant.py",
    B + "gallery_summary.py": "iii-scripts-gallery_summary.py",
    B + "unit_base.py": "iii-scripts-unit_base.py",
    B + "mocks.py": "iii-scripts-mocks.py",
    B + "docrows.py": "iii-scripts-docrows.py",
    B + "append.py": "iii-scripts-append.py",
    B + "eol.py": "iii-scripts-eol.py",
    B + "to_lf.py": "iii-scripts-to_lf.py",
    B + "keep2.py": "iii-scripts-keep2.py",
    A + "probe-out-fix-upright/342x740-hcb-2bars-text100-as-is.json": "iii-probe-342x740-hcb-2bars-ordinary.json",
    A + "probe-out-fix-upright/342x740-hcb-2bars-text100-turned.json": "iii-probe-342x740-hcb-2bars-turned.json",
    A + "probe-out-fix-upright/342x740-hcb-2bars-text100-turned-off.json": "iii-probe-342x740-hcb-2bars-turned-band0.json",
}
for name in ("base", "M1", "M2", "M3", "M4"):
    PAIRS[B + f"mutants/{name}-browser.txt"] = f"iii-mutant-{name}-browser.txt"
    PAIRS[B + f"mutants/{name}-unit.txt"] = f"iii-mutant-{name}-unit.txt"


def scrub(text: str) -> str:
    for base, name in ((ROOT, "<worktree>"), (HOME, "<home>")):
        forms = {str(base), str(base).replace("\\", "/"), str(base).replace("\\", "\\\\"), str(base).replace(" ", "%20").replace("\\", "/")}
        for form in sorted(forms, key=len, reverse=True):
            text = re.sub(re.escape(form), name, text, flags=re.IGNORECASE)
    return text


RUNS.mkdir(parents=True, exist_ok=True)
for src, dst in PAIRS.items():
    path = ROOT / src
    if not path.exists():
        print(f"missing: {src}", file=sys.stderr)
        continue
    text = scrub(path.read_text(encoding="utf-8", errors="replace"))
    if len(text.encode("utf-8")) > LIMIT:
        print(f"over 300 KB, not kept: {src}", file=sys.stderr)
        continue
    (RUNS / dst).write_text(text, encoding="utf-8", newline="\n")
    print(f"kept {dst}")

# The full unit suite: its summary lines only (the log is about 900 KB).
full = (ROOT / B / "unit-all-3.txt").read_text(encoding="utf-8", errors="replace")
keep = [l for l in full.splitlines() if l.startswith((" FAIL ", " Test Files", "      Tests")) or "Failed Tests" in l]
(RUNS / "iii-unit-all-summary.txt").write_text(scrub("\n".join(keep)) + "\n\nThe full log (about 900 KB) was not kept.\n", encoding="utf-8", newline="\n")
print("kept iii-unit-all-summary.txt")
