"""Q88: each workflow mutant must turn TheDeployStep red. The mutants are written to the worktree's build/, and the
test class is pointed at them; `.github/workflows/pages.yml` itself is never edited. Run from the worktree root."""
from __future__ import annotations

import io
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / "tools" / "content"))

from tests import test_deploy_guard as T  # noqa: E402

GUARD_STEP = (
    "      - name: Guard the deploy\n"
)
RUN = "        run: python3 tools/content/deploy_guard.py --dir app/dist/content\n"
UPLOAD = "      - uses: actions/upload-pages-artifact@v3\n        with:\n          path: app/dist\n"


def mutants(text: str) -> dict[str, str]:
    start = text.index(GUARD_STEP)
    end = text.index(RUN) + len(RUN)
    step = text[start:end]
    without = text[:start] + text[end:].lstrip("\n")
    return {
        "the guard after the upload": without.replace(UPLOAD, UPLOAD + "\n" + step),
        "continue-on-error on the guard": text.replace(RUN, RUN + "        continue-on-error: true\n"),
        "the guard reads app/public/content": text.replace("--dir app/dist/content", "--dir app/public/content"),
        "the upload runs after a failure": text.replace(
            "      - uses: actions/upload-pages-artifact@v3\n",
            "      - uses: actions/upload-pages-artifact@v3\n        if: always()\n"),
        "the guard step removed": without,
        "the deploy job no longer needs the build": text.replace("    needs: build\n", ""),
    }


def main() -> int:
    original = T.PAGES.read_text(encoding="utf-8")
    out = ROOT / "build" / "q88-mutants"
    out.mkdir(parents=True, exist_ok=True)
    worst = 0
    for name, text in mutants(original).items():
        if text == original:
            print(f"{name}: NOT APPLIED (the mutant equals the workflow)")
            worst = 1
            continue
        path = out / "pages.yml"
        path.write_text(text, encoding="utf-8")
        T.PAGES = path
        stream = io.StringIO()
        result = unittest.TextTestRunner(stream=stream, verbosity=0).run(
            unittest.defaultTestLoader.loadTestsFromTestCase(T.TheDeployStep))
        red = [test.id().rsplit(".", 1)[-1] for test, _ in result.failures + result.errors]
        print(f"{name}: {'red' if red else 'GREEN (the mutant survived)'} — {', '.join(red) or 'none'}")
        worst = max(worst, 0 if red else 1)
    T.PAGES = ROOT / ".github" / "workflows" / "pages.yml"
    print(f"exit {worst}")
    return worst


if __name__ == "__main__":
    sys.exit(main())
