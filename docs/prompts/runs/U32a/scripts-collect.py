"""U32a: copy what the lane keeps from build/u32a/ into docs/prompts/runs/U32a/ (not for the commit)."""

from __future__ import annotations

import shutil
from pathlib import Path

W = Path(__file__).resolve().parents[2]
B = W / "build" / "u32a"
R = W / "docs" / "prompts" / "runs" / "U32a"
P = W / "docs" / "prompts" / "pictures" / "u32a"
R.mkdir(parents=True, exist_ok=True)

COPIES = {
    "out/look-summary.txt": "look-summary.txt",
    "out/play-summary.txt": "play-press-summary.txt",
    "out/play-base-round0.txt": "play-press-base-round0.txt",
    "out/heap-summary.txt": "heap-summary.txt",
    "out/first-compare.txt": "first-paint-compare.txt",
    "out/settled-compare.txt": "settled-compare.txt",
    "out/snapshot-before.json": "slot-snapshot-before.json",
    "out/snapshot-after.json": "slot-snapshot-after.json",
    "out/snapshot-diff.txt": "slot-snapshot-diff.txt",
    "out/arrange-race-final.txt": "arrange-race-final-annotation.txt",
    "logs/arrange-race-base.log": "arrange-race-base.txt",
    "logs/e2e-targeted-final.log": "e2e-targeted-final.txt",
    "logs/red-unit-base.log": "red-unit-base.txt",
    "logs/mutant-m1-max-slots-unit.log": "mutant-1-max-slots-unit.txt",
    "logs/mutant-m2-load-in-run-unit.log": "mutant-2-load-in-run-unit.txt",
    "logs/mutant-m3-rest-only-unit.log": "mutant-3-rest-only-unit.txt",
    "logs/unit-after.log": "unit-stage-after.txt",
    "logs/unit-files.log": "unit-files-after.txt",
    "logs/vitest-env-rerun.log": "vitest-env-rerun.txt",
    "logs/tsc.log": "tsc.txt",
    "logs/lint.log": "lint.txt",
    "logs/checks-for-paths.txt": "checks-for-paths.txt",
    "logs/snapshot-before.log": "slot-snapshot-before-run.txt",
    "logs/snapshot-after.log": "slot-snapshot-after-run.txt",
    "logs/look-before.log": "look-before-run.txt",
    "logs/look-after.log": "look-after-run.txt",
    "logs/first-before.log": "first-paint-before-run.txt",
    "logs/first-after.log": "first-paint-after-run.txt",
    "logs/between-after.log": "between-after-run.txt",
    "logs/heap-base.log": "heap-base-run.txt",
    "logs/heap-final.log": "heap-final-run.txt",
    "logs/mode-base.log": "mode-base-run.txt",
    "logs/mode-final.log": "mode-final-run.txt",
    "logs/build-final.log": "build-app-final.txt",
    "logs/parity-reference.log": "setup-parity-reference.txt",
    "logs/npm-ci.log": "setup-npm-ci.txt",
    "zz-u32a-look.spec.ts": "scripts-zz-u32a-look.spec.ts",
    "zz-u32a-play.spec.ts": "scripts-zz-u32a-play.spec.ts",
    "zz-u32a-heap.spec.ts": "scripts-zz-u32a-heap.spec.ts",
    "zz-u32a-mode-debug.spec.ts": "scripts-zz-u32a-mode-debug.spec.ts",
    "zz-u32a-slot-snapshot.spec.ts": "scripts-zz-u32a-slot-snapshot.spec.ts",
    "playwright.u32a.config.ts": "scripts-playwright.u32a.config.ts",
    "make_mutants.py": "scripts-make-mutants.py",
    "look-summary.mjs": "scripts-look-summary.mjs",
    "mode-summary.mjs": "scripts-mode-summary.mjs",
    "pairs.py": "scripts-pairs.py",
    "sequence.py": "scripts-sequence.py",
    "first-compare.py": "scripts-first-compare.py",
    "settled-compare.py": "scripts-settled-compare.py",
    "collect.py": "scripts-collect.py",
}
for src, dst in COPIES.items():
    shutil.copyfile(B / src, R / dst)

# The whole unit suite's log is over the 300 KB the run folder keeps: its totals and failing names only.
full = (B / "logs" / "vitest-all.log").read_text(encoding="utf8", errors="replace").splitlines()
kept = [line for line in full if line.startswith((" FAIL ", " Test Files", "      Tests", "exit="))]
(R / "vitest-all-summary.txt").write_text(
    "U32a: the whole unit suite, npx vitest run, on the final tree (the full log was not kept: over 300 KB).\n"
    "The two lessonClaimsAboutApp line-ending claims fail on a CRLF checkout and pass on the runner (Entry 101);\n"
    "midiParity and taughtByAncestry failed on inputs a fresh worktree lacks (build/midi-parity, build/rung-claims.json)\n"
    "and passed once those were written or copied (vitest-env-rerun.txt).\n\n" + "\n".join(dict.fromkeys(kept)) + "\n",
    encoding="utf8",
)

# The after build's sequences for the cells where a sheet comes after the measurement's re-plan.
for name in ("nocturne__342x740__bars-4", "nocturne__342x740__bars-8", "scherzo__342x740__bars-8"):
    shutil.copyfile(B / "out" / "seq" / f"{name}__sequence.png", P / f"{name}__sequence-after.png")

too_big = [p.name for p in R.iterdir() if p.stat().st_size > 300_000]
print(f"{len(list(R.iterdir()))} files in {R}; over 300 KB: {too_big or 'none'}")
