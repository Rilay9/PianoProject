"""
E57a (Entry 195): E57's scripts-collect-logs.py, copied; its folders (build/e57a, runs/E57a), its list of logs and the e2e
config copy's name are E57a's.

E57's docstring, unchanged below. E57: the logs the run folder keeps, copied from build/e57 with machine paths replaced (`<worktree>`, `<home>`); the one
over 300 KB (the whole unit suite's) trimmed to its summary and its failing names, which the kept file says. The e2e
config copy is kept the same way. Idempotent: every kept file is rewritten from its source.

    python scripts-collect-logs.py
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

W = Path(__file__).resolve().parents[4]
SRC = W / "build" / "e57a"
RUNS = W / "docs" / "prompts" / "runs" / "E57a"
HOME = Path.home()
WHOLE = ["setup.txt", "build-before.txt", "build-after.txt", "build-mutant.txt", "content-suite.txt", "validate.txt",
         "review-check.txt", "record-mirrors.txt", "tsc.txt", "lint.txt", "build-app.txt", "e2e.txt", "python-relations.txt"]


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
        # E57a: a step's stderr is kept after its stdout where it has any (unittest and the record check write there).
        text = path.read_text(encoding="utf-8", errors="replace")
        err = path.with_name(path.stem + ".stderr.txt")
        if err.is_file() and err.stat().st_size:
            text += "\n--- stderr ---\n" + err.read_text(encoding="utf-8", errors="replace")
        (RUNS / name).write_text(scrub(text), encoding="utf-8")
        kept.append(f"{name}: kept whole")
    # E57a: vitest's stdout is small and names every failure; its stderr (over 300 KB) is cut to each failure's first lines.
    vitest = (SRC / "vitest-all.txt").read_text(encoding="utf-8", errors="replace")
    stderr = (SRC / "vitest-all.stderr.txt").read_text(encoding="utf-8", errors="replace").splitlines()
    reasons = [line for i, line in enumerate(stderr) if line.startswith(" FAIL ") or
               (i > 0 and stderr[i - 1].startswith(" FAIL ") and line.strip())]
    alone = (SRC / "vitest-alone.txt").read_text(encoding="utf-8", errors="replace") if (SRC / "vitest-alone.txt").is_file() else ""
    (RUNS / "vitest-all.txt").write_text(scrub("\n".join(
        ["The whole unit suite (`npx vitest run` in app/, alone, on the final tree): its stdout whole, then each failure's name and",
         "first line from its stderr (the full stderr, over 300 KB, was not kept); then the timed-out files run alone.", "", vitest,
         "--- each failure, from stderr ---"] + reasons + ["", "--- alone: expectedNote, sessionProtocol, tempoSoundAgainstMark, "
         "lessonClaimsAboutMusic, repairedTempoLineage ---", alone]) + "\n"), encoding="utf-8")
    kept.append("vitest-all.txt: stdout, each failure's reason, the files run alone (the full stderr was not kept)")
    config = W / "app" / "build" / "e57a" / "playwright.e57a.config.ts"
    if config.is_file():
        (RUNS / "scripts-playwright.e57a.config.ts").write_text(scrub(config.read_text(encoding="utf-8")), encoding="utf-8")
        kept.append("scripts-playwright.e57a.config.ts: the e2e config copy, kept")
    print("\n".join(kept))
    return 0


if __name__ == "__main__":
    sys.exit(main())
