"""
E57: the logs the run folder keeps, copied from build/e57 with machine paths replaced (`<worktree>`, `<home>`); the one
over 300 KB (the whole unit suite's) trimmed to its summary and its failing names, which the kept file says. The e2e
config copy is kept the same way. Idempotent: every kept file is rewritten from its source.

    python scripts-collect-logs.py
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

W = Path(__file__).resolve().parents[4]
SRC = W / "build" / "e57"
RUNS = W / "docs" / "prompts" / "runs" / "E57"
HOME = Path.home()
WHOLE = ["setup.txt", "build-before.txt", "build-after1.txt", "build-after.txt", "red-committed.txt", "red-relation-committed.txt",
         "content-suite.txt", "validate.txt", "review-check.txt", "record-mirrors.txt", "tsc.txt", "lint.txt", "build-app.txt",
         "e2e-library.txt"]


def scrub(text: str) -> str:
    for root, name in ((W, "<worktree>"), (HOME, "<home>")):
        for form in {str(root), str(root).replace("\\", "/"), str(root).replace("\\", "\\\\")}:
            text = text.replace(form, name)
    return re.sub(r"[A-Za-z]:\\Users\\[^\\\s]+", "<home>", text)


def main() -> int:
    kept = []
    for name in WHOLE:
        path = SRC / name
        if not path.is_file():
            kept.append(f"{name}: absent")
            continue
        (RUNS / name).write_text(scrub(path.read_text(encoding="utf-8", errors="replace")), encoding="utf-8")
        kept.append(f"{name}: kept whole")
    vitest = (SRC / "vitest-all.txt").read_text(encoding="utf-8", errors="replace")
    lines = vitest.splitlines()
    failing = [line for line in lines if line.startswith(" FAIL ")]
    summary = [line for line in lines if re.match(r"\s*(Test Files|Tests|Duration|Start at)\b", line)]
    (RUNS / "vitest-all.txt").write_text(scrub("\n".join(
        ["The whole unit suite (`npx vitest run` in app/, alone, on the final tree); the full log (over 300 KB) was not kept:",
         "its summary and every failing test's name follow.", ""] + summary + [""] + failing) + "\n"), encoding="utf-8")
    kept.append("vitest-all.txt: summary and failing names (the full log was not kept)")
    config = W / "app" / "build" / "E57" / "playwright.e57.config.ts"
    if config.is_file():
        (RUNS / "scripts-playwright.e57.config.ts").write_text(scrub(config.read_text(encoding="utf-8")), encoding="utf-8")
        kept.append("scripts-playwright.e57.config.ts: the e2e config copy, kept")
    print("\n".join(kept))
    return 0


if __name__ == "__main__":
    sys.exit(main())
