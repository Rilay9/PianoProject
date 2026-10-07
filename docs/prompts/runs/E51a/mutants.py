"""
E51a's three map mutants (Entry 164), run from the repository root after the splice. Each writes a mutated
docs/prompts/checks.json, runs the new TheMinimumSemantics case, records the failing line, and restores the file,
checked by sha256 before the next mutant. Prints the report on stdout (runs/E51a/mutants.txt).
"""
from __future__ import annotations

import hashlib
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path.cwd()
MAP = ROOT / "docs" / "prompts" / "checks.json"
CASE = "tools.content.tests.test_checks_for_paths.TheMinimumSemantics.test_the_merge_and_its_definitions_name_the_merge_s_browser_spec"
EOL = "\r\n"

ORIGINAL = MAP.read_bytes()
SHA = hashlib.sha256(ORIGINAL).hexdigest()
LINES = ORIGINAL.decode("utf-8").split(EOL)
NEW_PY = next(i for i, line in enumerate(LINES) if line.startswith('    {"pattern": "tools/content/excerpts.py", '))
NEW_JSON = next(i for i, line in enumerate(LINES) if line.startswith('    {"pattern": "content/sources/excerpts.json", '))
FOLDER = next(i for i, line in enumerate(LINES) if line.startswith('    {"pattern": "tools/content/*.py", '))
E2E = '"e2e": ["tests/e2e/excerpts.spec.ts"]'


def spec_on_the_folder_row(lines: list[str]) -> list[str]:
    out = list(lines)
    assert '"build-app": true}, "reason"' in out[FOLDER]
    out[FOLDER] = out[FOLDER].replace('"build-app": true}, "reason"', f'"build-app": true, {E2E}}}, "reason"', 1)
    del out[NEW_PY]
    return out


def whole_suite_on_the_new_row(lines: list[str]) -> list[str]:
    out = list(lines)
    assert E2E in out[NEW_PY]
    out[NEW_PY] = out[NEW_PY].replace(E2E, '"e2e": "*"', 1)
    return out


def second_row_omitted(lines: list[str]) -> list[str]:
    out = list(lines)
    del out[NEW_JSON]
    return out


MUTANTS = [
    ("1. the spec added to the tools/content/*.py row instead of its own row", spec_on_the_folder_row,
     "the build.py line (assertNotIn e2e)"),
    ('2. "e2e": "*" on the new tools/content/excerpts.py row', whole_suite_on_the_new_row,
     "e2e_names' whole-suite assertion"),
    ("3. the content/sources/excerpts.json row omitted", second_row_omitted,
     "the content/sources/excerpts.json assertEqual"),
]


def run_case() -> tuple[int, str]:
    run = subprocess.run([sys.executable, "-m", "unittest", CASE], cwd=ROOT, capture_output=True, text=True, encoding="utf-8")
    return run.returncode, run.stdout + run.stderr


def main() -> int:
    print(f"checks.json sha256 before the mutants: {SHA}")
    code, out = run_case()
    print(f"\n0. the spliced map: exit {code} ({'green' if code == 0 else 'RED'})")
    ok = code == 0
    for title, mutate, expected in MUTANTS:
        MAP.write_bytes(EOL.join(mutate(LINES)).encode("utf-8"))
        try:
            code, out = run_case()
        finally:
            MAP.write_bytes(ORIGINAL)
        restored = hashlib.sha256(MAP.read_bytes()).hexdigest()
        assert restored == SHA, (title, restored)
        failing = [line.strip() for line in out.splitlines() if line.strip().startswith(("self.assert", "AssertionError"))]
        where = re.findall(r'line (\d+), in (\w+)', out)
        print(f"\n{title}\n   expected red at: {expected}\n   exit {code} ({'RED' if code else 'green: the mutant survived'})")
        for (n, fn) in where:
            print(f"   at line {n}, in {fn}")
        for line in failing:
            print(f"   {line}")
        print(f"   restored, sha256 {restored} (equal to before: {restored == SHA})")
        ok = ok and code != 0
    print(f"\nall three mutants caught and the file restored: {ok}")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
