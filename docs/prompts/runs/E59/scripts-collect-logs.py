"""
E59: the step logs copied from build/e59 into the run folder, machine paths replaced (`<worktree>`, `<home>`), each under
300 KB (a long log keeps its summary and its failing names, and says it was trimmed), and the kept copies of the temporary
Playwright files (app/build/e59/, deleted at the cleanup) written beside the scripts. Every run-folder text file is then
scanned for a machine path. Output: the files, and the list printed.

    python scripts-collect-logs.py
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

W = Path(__file__).resolve().parents[4]
RUNS = W / "docs" / "prompts" / "runs" / "E59"
LOGS = W / "build" / "e59"
HOME = Path.home()
LIMIT = 300_000
COPY = {
    "setup.txt": "setup.txt", "build-before.txt": "build-before.txt", "build-after1.txt": "build-after1.txt",
    "build-after.txt": "build-after.txt", "build-final.txt": "build-final.txt", "validate.txt": "validate.txt",
    "review-check.txt": "review-check.txt", "record-mirrors.txt": "record-mirrors.txt", "tsc.txt": "tsc.txt", "lint.txt": "lint.txt",
    "vitest-all.txt": "vitest-all.txt", "build-app.txt": "build-app.txt", "e2e.txt": "e2e.txt", "screen.txt": "screen.txt",
    "screen-compare.txt": "screen-compare.txt", "x40-before.txt": "x40-before.txt", "x40-final.txt": "x40-final.txt",
    "exit-codes.txt": "exit-codes-steps.txt", "content-tests.stderr.txt": "content-suite.txt",
}
TEMP_FILES = {
    "app/build/e59/playwright.e59.config.ts": "scripts-playwright.e59.config.ts",
    "app/build/e59/playwright.screen.config.ts": "scripts-playwright.screen.config.ts",
    "app/build/e59/screen.e59.spec.ts": "scripts-screen.e59.spec.ts",
}


def scrub(text: str) -> str:
    for path, name in ((W, "<worktree>"), (HOME, "<home>")):
        for form in {str(path), str(path).replace("\\", "/"), str(path).replace("\\", "\\\\")}:
            text = text.replace(form, name)
    return text


def trim(name: str, text: str) -> str:
    if len(text.encode("utf-8")) <= LIMIT and name != "content-tests.stderr.txt":
        return text
    keep = [line for line in text.splitlines() if re.match(r"^(FAIL|ERROR):|^Ran |^OK|^FAILED|AssertionError", line)]
    return (f"(trimmed: the full log was not kept; its summary and failing names follow)\n" + "\n".join(keep) + "\n")


def main() -> int:
    written = []
    for source, target in COPY.items():
        path = LOGS / source
        if not path.is_file():
            written.append(f"absent: build/e59/{source}")
            continue
        text = path.read_text(encoding="utf-8", errors="replace").lstrip("\ufeff")
        (RUNS / target).write_text(trim(source, scrub(text)), encoding="utf-8")
        written.append(f"{target} ({(RUNS / target).stat().st_size} bytes)")
    for source, target in TEMP_FILES.items():
        path = W / source
        if path.is_file():
            text = "// Kept copy (machine path replaced) of the temporary " + source + ", deleted at the lane's cleanup.\n" + \
                   path.read_text(encoding="utf-8")
            (RUNS / target).write_text(scrub(text).replace("C:/<worktree>", "<worktree>"), encoding="utf-8")
            written.append(target)
    faults = []
    for path in sorted(RUNS.iterdir()):
        if path.is_file():
            text = path.read_text(encoding="utf-8", errors="replace")
            if f"\\{HOME.name}" in text or f"/{HOME.name}" in text or re.search(r"[A-Za-z]:\\Users", text):
                faults.append(path.name)
            if path.stat().st_size > LIMIT:
                faults.append(f"{path.name} over 300 KB")
    print("\n".join(written))
    print(f"machine paths or oversize files left: {faults or 'none'}")
    return 1 if faults else 0


if __name__ == "__main__":
    sys.exit(main())
