"""G87: the final unit tests over HEAD's two sources (`style.css`, `LessonScreen.ts`), then this tree's
files written back by their bytes, sha256 checked. The capture is red/red-vitest-final-tests-head-sources.txt.

Run from the worktree:  python docs/prompts/runs/G87/scripts-final_tests_head_sources.py
"""
from __future__ import annotations

import hashlib
import subprocess
import sys
from pathlib import Path

W = Path(__file__).resolve().parents[4]
APP = W / "app"
OUT = W / "docs" / "prompts" / "runs" / "G87" / "red" / "red-vitest-final-tests-head-sources.txt"
SOURCES = ["app/src/style.css", "app/src/ui/screens/LessonScreen.ts"]
TESTS = ["tests/unit/projectSheet.test.ts", "tests/unit/stage9ProjectsPage.test.ts", "tests/unit/lessonClaimsAboutApp.test.ts"]


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> int:
    kept = {path: (W / path).read_bytes() for path in SOURCES}
    lines = []
    try:
        for path in SOURCES:
            head = subprocess.run(["git", "show", f"HEAD:{path}"], cwd=W, capture_output=True, check=True).stdout
            # The checkout's own line endings (CRLF here), so the file is HEAD's as this tree would hold it.
            if b"\r\n" in kept[path] and b"\r\n" not in head:
                head = head.replace(b"\n", b"\r\n")
            (W / path).write_bytes(head)
            lines.append(f"wrote HEAD's {path} ({sha(head)[:12]})")
        run = subprocess.run("npx vitest run " + " ".join(TESTS), cwd=APP, capture_output=True, shell=True)
        lines.append(run.stdout.decode("utf-8", "replace") + run.stderr.decode("utf-8", "replace"))
        lines.append(f"vitest exit={run.returncode}")
    finally:
        for path, data in kept.items():
            (W / path).write_bytes(data)
            ok = sha((W / path).read_bytes()) == sha(data)
            lines.append(f"restored {path}: sha256 {'match' if ok else 'MISMATCH'} ({sha(data)[:12]})")
    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(lines[-3] if len(lines) >= 3 else lines[-1])
    return 0


if __name__ == "__main__":
    sys.exit(main())
