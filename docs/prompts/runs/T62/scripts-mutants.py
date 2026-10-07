"""T62 scratch: the red side of test_ci_order.py.

1. The old (0d2c3472) test file against the new job graph: the single-job reader's failure.
2. The new test file against the old single-job workflow.
3. Mutants of the new workflow, one fault each, against the new test file: which tests go red.
"""
from __future__ import annotations

import importlib.util
import io
import re
import shutil
import sys
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
WT = HERE.parents[1]
WF = WT / ".github" / "workflows"


def load(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def run(module, workflow: Path, case: str = "TheWorkflowOrder") -> unittest.TestResult:
    module.WORKFLOW = workflow
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(getattr(module, case))
    stream = io.StringIO()
    return unittest.TextTestRunner(stream=stream, verbosity=0).run(suite)


def names(result: unittest.TestResult) -> list[str]:
    out = []
    for test, trace in result.failures + result.errors:
        last = [line for line in trace.strip().splitlines() if line.strip()][-1]
        out.append(f"{str(test).split(' ')[0]}: {last[:200]}")
    return out


def stage(name: str, text: str) -> Path:
    folder = HERE / "mut" / name
    folder.mkdir(parents=True, exist_ok=True)
    (folder / "ci.yml").write_text(text, encoding="utf-8")
    for sibling in ("docs-integrity.yml", "pages.yml"):
        shutil.copy(WF / sibling, folder / sibling)
    return folder / "ci.yml"


def in_job(text: str, job: str, old: str, new: str) -> str:
    start = text.index(f"\n  {job}:\n")
    nxt = re.search(r"\n  [a-z0-9-]+:\n", text[start + 1:])
    end = start + 1 + nxt.start() if nxt else len(text)
    section = text[start:end]
    assert section.count(old) == 1, (job, old, section.count(old))
    return text[:start] + section.replace(old, new) + text[end:]


def move_validate_after_save(text: str) -> str:
    start = text.index("      - name: Validate again, now that durations have been written\n")
    end = text.index("      # The content cache's save, after the render check")
    block = text[start:end]
    text = text[:start] + text[end:]
    at = text.index("      - name: Upload content previews\n")
    return text[:at] + block + text[at:]


def main() -> None:
    new_text = (WF / "ci.yml").read_text(encoding="utf-8")
    old_text = (HERE / "old" / "ci.yml").read_text(encoding="utf-8")

    print("== 1. the old test file (0d2c3472) against the new graph")
    old = load(HERE / "old" / "test_ci_order.py", "old_ci_order")
    try:
        old.read_steps(new_text)
    except AssertionError as error:
        print(f"read_steps raises AssertionError: {error}")
    result = run(old, stage("new-under-old", new_text))
    print(f"ran {result.testsRun}, failures {len(result.failures)}, errors {len(result.errors)}")
    for line in names(result):
        print("  ", line)

    new = load(WT / "tools" / "content" / "tests" / "test_ci_order.py", "new_ci_order")
    print("\n== 2. the new test file against the old single-job workflow")
    result = run(new, stage("old-under-new", old_text))
    print(f"ran {result.testsRun}, failures {len(result.failures)}, errors {len(result.errors)}")
    for line in names(result):
        print("  ", line)

    print("\n== 3. the new test file against the new workflow, then against one fault at a time")
    result = run(new, stage("clean", new_text))
    print(f"clean: ran {result.testsRun}, failures {len(result.failures)}, errors {len(result.errors)}")
    mutants = {
        "fail-fast true": in_job(new_text, "e2e", "fail-fast: false", "fail-fast: true"),
        "shard list 1..7 with total 8": in_job(new_text, "e2e", "shard: [1, 2, 3, 4, 5, 6, 7, 8]", "shard: [1, 2, 3, 4, 5, 6, 7]"),
        "blob report upload not always()": in_job(new_text, "e2e", "        # them): what e2e-coverage reads, kept on a red shard too.\n        if: always()\n", "        # them): what e2e-coverage reads, kept on a red shard too.\n"),
        "test-results upload not always()": in_job(new_text, "e2e", "        # failure files, which the runner's disk took with it until T62.\n        if: always()\n", "        # failure files, which the runner's disk took with it until T62.\n"),
        "render job runs after a red shard": in_job(new_text, "render-and-validate", "    needs: [content-and-unit, e2e]\n", "    needs: [content-and-unit, e2e]\n    if: always()\n"),
        "render job needs only the content job": in_job(new_text, "render-and-validate", "    needs: [content-and-unit, e2e]\n", "    needs: content-and-unit\n"),
        "shards restore no app": in_job(new_text, "e2e", "      - name: Restore the built app\n        uses: actions/download-artifact@v4\n        with:\n          name: app-dist\n          path: app/dist\n\n", ""),
        "shards unpack no content": in_job(new_text, "e2e", "        run: tar -xf build/content-and-render-state.tar\n", "        run: echo skipped\n"),
        "shards install no Python deps": in_job(new_text, "e2e", "        run: pip install -r tools/content/requirements.txt\n", "        run: echo skipped\n"),
        "shards rebuild the app": in_job(new_text, "e2e", "          PIANOPATH_PREBUILT_DIST: '1'\n", "          OTHER: '1'\n"),
        "shard step loses npm run e2e": in_job(new_text, "e2e", "        run: npm run e2e -- --shard=", "        run: npx playwright test --shard="),
        "coverage job has no checkout": in_job(new_text, "e2e-coverage", "    steps:\n      - uses: actions/checkout@v4\n\n", "    steps:\n"),
        "coverage skipped on a red shard": in_job(new_text, "e2e-coverage", "    if: ${{ !cancelled() && needs.content-and-unit.result == 'success' }}\n", ""),
        "content cache auto-saves in the content job": in_job(new_text, "content-and-unit", "        uses: actions/cache/restore@v4\n        with:\n          path: |\n            build/cache", "        uses: actions/cache@v4\n        with:\n          path: |\n            build/cache"),
        "content cache key differs from pages.yml": in_job(new_text, "content-and-unit", "'content/sources/*.json', 'app/package-lock.json')", "'content/sources/*.json')"),
        "cache saved before the validation": move_validate_after_save(new_text),
        "render job has no content-equality check": in_job(new_text, "render-and-validate", "        run: diff -r app/dist/content app/public/content\n", "        run: echo trusted\n"),
        "render job installs no music21": in_job(new_text, "render-and-validate", "        run: pip install -r tools/content/requirements.txt\n", "        run: echo skipped\n"),
        "render step may fail quietly": in_job(new_text, "render-and-validate", "        env:\n          PIANOPATH_PREBUILT_DIST: '1'\n        run: python3 tools/content/render_check.py --apply\n", "        continue-on-error: true\n        env:\n          PIANOPATH_PREBUILT_DIST: '1'\n        run: python3 tools/content/render_check.py --apply\n"),
        "previews kept 1 day": in_job(new_text, "render-and-validate", "          path: build/previews\n          if-no-files-found: ignore\n          retention-days: 7\n", "          path: build/previews\n          if-no-files-found: ignore\n          retention-days: 1\n"),
        "content job still installs Chromium": in_job(new_text, "content-and-unit", "      - name: Build\n", "      - name: Install Playwright Chromium\n        working-directory: app\n        run: npx playwright install --with-deps chromium\n\n      - name: Build\n"),
        "app uploaded before the build": in_job(new_text, "content-and-unit", "      - name: Build\n", "      - name: Early upload\n        uses: actions/upload-artifact@v4\n        with:\n          name: app-dist\n          path: app/dist\n\n      - name: Build\n"),
        "a second 'Unit tests' step in a shard": in_job(new_text, "e2e", "      - name: Install Playwright Chromium\n", "      - name: Unit tests\n        run: echo again\n\n      - name: Install Playwright Chromium\n"),
        "cancel-in-progress true": new_text.replace("  cancel-in-progress: false\n", "  cancel-in-progress: true\n", 1),
        "a job narrows the group": in_job(new_text, "e2e", "    runs-on: ubuntu-latest\n", "    runs-on: ubuntu-latest\n    concurrency:\n      group: shard\n"),
    }
    survivors = []
    for label, text in mutants.items():
        assert text != new_text, label
        slug = re.sub(r"[^a-z0-9]+", "-", label.lower()).strip("-")
        result = run(new, stage(slug, text))
        red = names(result)
        print(f"- {label}: {len(red)} red")
        for line in red:
            print("     ", line)
        if not red:
            survivors.append(label)
    print(f"\nsurvivors: {survivors or 'none'}")


if __name__ == "__main__":
    main()
