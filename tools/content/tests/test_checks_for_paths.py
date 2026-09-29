"""The path-to-checks map: the auditable minimum checks for the paths a seam touches (Q65).

Which checks a landing needed was decided per landing from memory and `docs/08`; the outside
reviewer asked for a committed map, read by the orchestrator's chain and asserted against CI.
`docs/prompts/checks.json` holds each path pattern, the checks a change under it needs and the
reason; `tools/docs/checks_for_paths.py <path>...` prints the union, in the chain's order, as
commands. A path no pattern names falls back to the full required suites and is printed as
unmatched, so the map can be extended; it is never refused (the reviewer, `responses/d1562ef.md`).
`test_ci_order.py` asserts CI runs every check the map can name.
"""
from __future__ import annotations

import io
import json
import subprocess
import sys
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "tools" / "docs"))

import checks_for_paths as cfp  # noqa: E402

FIXTURE = {
    "checks": [
        {"id": "content-build", "cwd": ".", "run": "python tools/content/build.py --offline", "ci": "tools/content/build.py"},
        {"id": "content-tests", "cwd": ".", "run": "python -m unittest discover -s tools/content/tests -t tools/content -p {name}",
         "each": True, "names_in": "tools/content/tests", "whole": "python -m unittest discover -s tools/content/tests -t tools/content",
         "ci": "unittest discover -s tools/content/tests"},
        {"id": "tsc", "cwd": "app", "run": "npx tsc -b", "ci": "npm run typecheck"},
        {"id": "unit", "cwd": "app", "run": "npx vitest run {names}", "whole": "npx vitest run", "ci": "npm run test"},
        {"id": "e2e", "cwd": "app", "run": "npx playwright test {names} --workers=4",
         "whole": "npx playwright test --workers=4", "ci": "npm run e2e"},
    ],
    "patterns": [
        {"pattern": "app/src/**", "checks": {"tsc": True, "unit": "*"}, "reason": "app code"},
        {"pattern": "app/src/ui/screens/TodayScreen.ts", "checks": {"e2e": ["tests/e2e/today.spec.ts"]}, "reason": "Today"},
        {"pattern": "app/src/data/**", "checks": {"e2e": ["tests/e2e/today.spec.ts", "tests/e2e/progress.spec.ts"]}, "reason": "data"},
        {"pattern": "app/tests/unit/*.test.ts", "checks": {"tsc": True, "unit": ["{self}"]}, "reason": "a unit file runs itself"},
        {"pattern": "app/tests/e2e/score.*.spec.ts", "checks": {"e2e": ["tests/e2e/score.*.spec.ts"]}, "reason": "a glob"},
        {"pattern": "content/lessons/*.md", "checks": {"content-build": True, "content-tests": ["test_b.py", "test_a.py"]}, "reason": "lessons"},
        {"pattern": "tools/content/tests/test_*.py", "checks": {"content-tests": ["{self}"]}, "reason": "a content test runs itself"},
        {"pattern": "docs/**", "checks": {}, "reason": "the record: nothing reads it"},
    ],
    "fallback": {"checks": {"content-build": True, "content-tests": "*", "tsc": True, "unit": "*", "e2e": "*"},
                 "reason": "a path no pattern names: the full required suites"},
}


class OnAFixtureMap(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self._tmp.cleanup)
        self.root = Path(self._tmp.name)
        for rel in ("app/tests/e2e/score.run.spec.ts", "app/tests/e2e/score.blind.spec.ts", "app/tests/e2e/today.spec.ts"):
            (self.root / rel).parent.mkdir(parents=True, exist_ok=True)
            (self.root / rel).write_text("", encoding="utf-8")
        self.map = cfp.load_map_data(FIXTURE)

    def commands(self, *paths: str) -> list[tuple[str, str, str]]:
        return cfp.checks_for(list(paths), self.map, self.root).commands

    def test_the_union_is_deduplicated_and_in_the_chain_s_order(self) -> None:
        got = self.commands("content/lessons/a.md", "app/src/data/progressStore.ts", "app/src/ui/screens/TodayScreen.ts")
        self.assertEqual([c[0] for c in got], ["content-build", "content-tests", "content-tests", "tsc", "unit", "e2e"])
        self.assertEqual(got[-1], ("e2e", "app", "npx playwright test tests/e2e/progress.spec.ts tests/e2e/today.spec.ts --workers=4"))
        self.assertEqual([c[2] for c in got if c[0] == "content-tests"], [
            "python -m unittest discover -s tools/content/tests -t tools/content -p test_a.py",
            "python -m unittest discover -s tools/content/tests -t tools/content -p test_b.py",
        ])
        self.assertIn(("unit", "app", "npx vitest run"), got)

    def test_the_whole_suite_wins_over_named_files(self) -> None:
        got = self.commands("app/tests/unit/a.test.ts", "app/src/x.ts")
        self.assertEqual([c for c in got if c[0] == "unit"], [("unit", "app", "npx vitest run")])

    def test_self_names_the_changed_file(self) -> None:
        got = self.commands("app/tests/unit/a.test.ts", "tools/content/tests/test_z.py")
        self.assertIn(("unit", "app", "npx vitest run tests/unit/a.test.ts"), got)
        self.assertIn(("content-tests", ".", "python -m unittest discover -s tools/content/tests -t tools/content -p test_z.py"), got)

    def test_a_glob_expands_against_the_tree(self) -> None:
        got = self.commands("app/tests/e2e/score.run.spec.ts")
        self.assertEqual(got, [("e2e", "app", "npx playwright test tests/e2e/score.blind.spec.ts tests/e2e/score.run.spec.ts --workers=4")])

    def test_a_path_under_no_pattern_takes_the_full_suites_and_is_named(self) -> None:
        result = cfp.checks_for(["packaging/build-apk.sh", "app/src/x.ts"], self.map, self.root)
        self.assertEqual(result.unmatched, ["packaging/build-apk.sh"])
        self.assertIn(("e2e", "app", "npx playwright test --workers=4"), result.commands)
        self.assertIn(("content-tests", ".", "python -m unittest discover -s tools/content/tests -t tools/content"), result.commands)

    def test_the_unmatched_path_is_conspicuous_and_never_a_refusal(self) -> None:
        mapfile = self.root / "checks.json"
        mapfile.write_text(json.dumps(FIXTURE), encoding="utf-8")
        out, err = io.StringIO(), io.StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            code = cfp.main(["--map", str(mapfile), "--root", str(self.root), "packaging/build-apk.sh"])
        self.assertEqual(code, 0)
        self.assertIn("UNMATCHED", out.getvalue())
        self.assertIn("packaging/build-apk.sh", out.getvalue())
        self.assertIn("packaging/build-apk.sh", err.getvalue())

    def test_a_docs_path_needs_nothing_and_says_so(self) -> None:
        result = cfp.checks_for(["docs/pending-review.md"], self.map, self.root)
        self.assertEqual((result.commands, result.unmatched), ([], []))

    def test_windows_and_dotted_paths_are_read_as_repository_paths(self) -> None:
        self.assertEqual(self.commands(".\\app\\tests\\unit\\a.test.ts"), self.commands("app/tests/unit/a.test.ts"))

    def test_a_pattern_naming_an_unknown_check_is_refused_when_the_map_loads(self) -> None:
        broken = json.loads(json.dumps(FIXTURE))
        broken["patterns"].append({"pattern": "x/**", "checks": {"nope": True}, "reason": "?"})
        with self.assertRaisesRegex(ValueError, "nope"):
            cfp.load_map_data(broken)


class TheCommittedMap(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.data = json.loads((ROOT / "docs" / "prompts" / "checks.json").read_text(encoding="utf-8"))
        cls.map = cfp.load_map_data(cls.data)

    def test_every_pattern_carries_a_reason(self) -> None:
        self.assertEqual([p["pattern"] for p in self.data["patterns"] if not p.get("reason", "").strip()], [])

    def test_every_named_file_exists(self) -> None:
        # A spec renamed or deleted must not leave the map naming nothing (a glob must match).
        missing = cfp.missing_names(self.map, ROOT)
        self.assertEqual(missing, [], "the map names files the tree does not have")

    def test_every_pattern_matches_a_path_in_the_tree(self) -> None:
        # A pattern that matches nothing is a typo or a path since renamed: checked against the
        # tracked files and the untracked ones git does not ignore.
        listed = subprocess.run(["git", "ls-files", "--cached", "--others", "--exclude-standard"],
                                cwd=ROOT, check=True, capture_output=True, text=True, encoding="utf-8").stdout
        files = [line for line in listed.splitlines() if line]
        dead = [p.pattern for p in self.map.patterns if not any(p.matches(f) for f in files)]
        self.assertEqual(dead, [])

    def test_a_lesson_edit_is_covered_and_not_a_fallback(self) -> None:
        result = cfp.checks_for(["content/lessons/blues.5.md"], self.map, ROOT)
        self.assertEqual(result.unmatched, [])
        ids = [c[0] for c in result.commands]
        for needed in ("content-build", "content-validate", "unit", "e2e"):
            self.assertIn(needed, ids)

    def test_a_docs_only_change_runs_nothing(self) -> None:
        result = cfp.checks_for(["docs/pending-review.md", "docs/prompts/in-flight.md"], self.map, ROOT)
        self.assertEqual((result.commands, result.unmatched), ([], []))


if __name__ == "__main__":
    unittest.main()
