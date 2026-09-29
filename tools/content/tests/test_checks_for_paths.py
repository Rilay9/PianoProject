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
import re
import subprocess
import sys
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path, PurePosixPath

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


#: The whole default Playwright configuration and the whole unit suite, as the reader prints them.
WHOLE_E2E = ("e2e", "app", "npx playwright test --workers=4")
WHOLE_UNIT = ("unit", "app", "npx vitest run")

#: Specs that skip in the default configuration unless an environment variable asks for them
#: (`test.skip(!process.env...)` in each): naming one runs nothing, so no list names them.
ENV_GATED = {"bisect-render.spec.ts", "content-render.spec.ts", "generate-audio-fixtures.spec.ts", "guide-shots.spec.ts"}


class TheMinimumSemantics(unittest.TestCase):
    """Q65a, the reviewer's ruling on Q-tooling (`docs/review/responses/198c148.md`): the map is the
    smallest set that discriminates the mechanisms a changed path reaches, plus the cheap universal
    guards; the whole browser suite only where a module's behaviour runs on every spec's path. The
    full suites are merged-tree CI's and the fallback's."""

    @classmethod
    def setUpClass(cls) -> None:
        cls.map = cfp.load_map_data(json.loads((ROOT / "docs" / "prompts" / "checks.json").read_text(encoding="utf-8")))

    def result(self, *paths: str) -> cfp.Result:
        return cfp.checks_for(list(paths), self.map, ROOT)

    def e2e_names(self, *paths: str) -> list[str]:
        """The spec files the map names for these paths; fails if it asks for the whole suite."""
        commands = self.result(*paths).commands
        self.assertNotIn(WHOLE_E2E, commands, f"{paths}: the whole browser suite, where docs/08 and the chains name specs")
        e2e = [c for c in commands if c[0] == "e2e"]
        self.assertEqual(len(e2e), 1, f"{paths}: one e2e command naming its specs")
        return [PurePosixPath(n).name for n in e2e[0][2].split() if n.endswith(".spec.ts")]

    def test_a_score_screen_change_names_its_specs_and_keeps_the_gallery(self) -> None:
        names = self.e2e_names("app/src/ui/screens/ScoreScreen.ts")
        # docs/08: score.screen (one test per control), score.states (the state machine cell by
        # cell); G1's chain: lab; D4's, D4a's and G1's chains: transfer-offer.
        for spec in ("score.screen.spec.ts", "score.states.spec.ts", "lab.spec.ts", "transfer-offer.spec.ts"):
            self.assertIn(spec, names)
        ids = [c[0] for c in self.result("app/src/ui/screens/ScoreScreen.ts").commands]
        self.assertIn("states", ids, "the state gallery stays with the Score screen")

    def test_the_six_blanket_modules_name_their_specs_and_keep_the_cheap_guards(self) -> None:
        cited = {  # one spec each that docs/08's file lines or a landing chain tie to the module
            "app/src/score/WindowRenderer.ts": "score.window-rule.spec.ts",   # docs/08; U74's chain
            "app/src/ui/screens/ScoreScreen.ts": "score.screen.spec.ts",      # docs/08
            "app/src/data/db.ts": "progress.spec.ts",                         # docs/08: the backup round trip
            "app/src/curriculum/session.ts": "today.spec.ts",                 # docs/08: the session from the templates
            "app/src/ui/screens/TodayScreen.ts": "app-shell.spec.ts",         # docs/08: lands on Today
            "app/src/engine/PracticeEngine.ts": "engine.spec.ts",             # docs/08: the P3 acceptance criteria
        }
        for path, spec in cited.items():
            with self.subTest(path=path):
                self.assertIn(spec, self.e2e_names(path))
                commands = self.result(path).commands
                self.assertIn(WHOLE_UNIT, commands, "the unit suite stays the cheap universal guard")
                for check in ("tsc", "lint", "build-app"):
                    self.assertIn(check, [c[0] for c in commands])

    def test_a_renderer_change_names_the_fit_paths_spec_its_chain_ran(self) -> None:
        # U74's chain ran score-fit-paths, which no docs/08 line names (a finding in Q65a's entry).
        self.assertIn("score-fit-paths.spec.ts", self.e2e_names("app/src/score/WindowRenderer.ts"))

    def test_a_test_side_helper_names_its_importers_not_the_whole_suite(self) -> None:
        # scoreControls.ts is imported by about a third of the spec files, not by every spec.
        names = self.e2e_names("app/tests/e2e/scoreControls.ts")
        self.assertIn("score.screen.spec.ts", names)
        self.assertNotIn("audio.spec.ts", names)

    def test_the_playwright_harness_is_the_whole_suite(self) -> None:
        # playwright.config.ts imports chromium.ts and loads storageState.json for every spec.
        for path in ("app/tests/e2e/fixtures/chromium.ts", "app/tests/e2e/fixtures/storageState.json"):
            with self.subTest(path=path):
                self.assertIn(WHOLE_E2E, self.result(path).commands)

    def test_a_renderer_file_with_a_harness_file_is_the_whole_suite(self) -> None:
        self.assertIn(WHOLE_E2E, self.result("app/src/score/WindowRenderer.ts", "app/tests/e2e/fixtures/chromium.ts").commands)

    def test_a_module_on_every_spec_s_path_is_the_whole_suite(self) -> None:
        for path in ("app/src/router.ts", "app/src/main.ts", "app/src/style.css", "app/src/ui/AppShell.ts"):
            with self.subTest(path=path):
                self.assertIn(WHOLE_E2E, self.result(path).commands)

    def test_a_machine_read_docs_path_runs_its_readers(self) -> None:
        # docs/04 is read by five unit files (readFileSync of docs/04-ui-spec.md), not one.
        commands = self.result("docs/04-ui-spec.md").commands
        unit = [c for c in commands if c[0] == "unit"]
        self.assertEqual(len(unit), 1)
        for name in ("docsConsistency.test.ts", "help.test.ts", "labHelp.test.ts",
                     "progressHistoryLines.test.ts", "sightReadingFromReadingState.test.ts"):
            self.assertIn(f"tests/unit/{name}", unit[0][2].split())
        self.assertNotIn("e2e", [c[0] for c in commands])

    def test_a_prose_docs_path_runs_nothing_and_is_not_unmatched(self) -> None:
        # docs/00-invariants.md is cited in comments; no script, test or workflow opens it.
        result = self.result("docs/00-invariants.md")
        self.assertEqual((result.commands, result.unmatched), ([], []))
        self.assertIn("docs/00-invariants.md", result.matched)

    def test_a_shared_fixture_the_converter_reads_runs_the_converter_s_checks(self) -> None:
        # tools/midi-cleanup/tests/parity_reference.py and test_parity_reference.py read
        # app/tests/fixtures/imports/two-hands.mid; test_converter.py reads fixtures/scores/generated.
        ids = [c[0] for c in self.result("app/tests/fixtures/imports/two-hands.mid").commands]
        for check in ("converter-harness", "parity-reference"):
            self.assertIn(check, ids)

    def test_the_score_model_the_detectors_read_runs_the_content_measurement(self) -> None:
        # app/src/demands/detect.ts imports extractScoreModel.ts; the build measures every file's
        # demands through tests/unit/demandsOfFiles.test.ts, so the catalogue is the model's too.
        ids = [c[0] for c in self.result("app/src/score/extractScoreModel.ts").commands]
        for check in ("content-build", "content-validate", "review-check"):
            self.assertIn(check, ids)

    def test_a_test_side_helper_names_every_file_that_reads_it(self) -> None:
        # A helper or fixture reaches exactly the files that read it. Its pattern names them, and
        # this keeps the names true: a spec, unit file or content test that starts reading one is
        # red here until the map names it. (`"*"` names everything.)
        read_by = {  # pattern -> (the reference a reader makes, the reader sets to hold it to)
            "app/tests/e2e/scoreControls.ts": (r"""['"]\./scoreControls['"]""", ("e2e",)),
            "app/tests/e2e/fixtures/midiMock.ts": (r"""fixtures/midiMock['"]""", ("e2e",)),
            "app/tests/e2e/fixtures/playInTime.ts": (r"""fixtures/playInTime['"]""", ("e2e",)),
            "app/tests/e2e/fixtures/devScore.ts": (r"""fixtures/devScore['"]""", ("e2e",)),
            "app/tests/e2e/fixtures/reader-learners.json": (r"reader-learners\.json", ("e2e", "unit", "content-tests")),
            "app/tests/e2e/fixtures/excerpt-candidates.json": (r"excerpt-candidates\.json", ("e2e", "unit", "content-tests")),
            "app/tests/fixtures/**": (r"""tests/fixtures/|'tests', 'fixtures'|fixtures/devScore['"]""", ("e2e",)),
        }
        readers_in = {
            "e2e": ("app/tests/e2e", "*.spec.ts", lambda p: PurePosixPath(p).name not in ENV_GATED, lambda p: f"tests/e2e/{PurePosixPath(p).name}"),
            "unit": ("app/tests/unit", "*.test.ts", lambda p: True, lambda p: f"tests/unit/{PurePosixPath(p).name}"),
            "content-tests": ("tools/content/tests", "test_*.py", lambda p: PurePosixPath(p).name != "test_checks_for_paths.py", lambda p: PurePosixPath(p).name),
        }
        patterns = {p.pattern: p for p in self.map.patterns}
        for pattern, (reference, sets) in read_by.items():
            with self.subTest(pattern=pattern):
                self.assertIn(pattern, patterns, f"{pattern}: the map has no pattern for it")
            if pattern not in patterns:
                continue
            named = patterns[pattern].checks
            for check_id in sets:
                folder, glob, keep, as_named = readers_in[check_id]
                readers = sorted(as_named(p.as_posix()) for p in (ROOT / folder).glob(glob)
                                 if keep(p.as_posix()) and re.search(reference, p.read_text(encoding="utf-8", errors="replace")))
                value = named.get(check_id)
                with self.subTest(pattern=pattern, check=check_id):
                    if value == "*":
                        continue
                    self.assertEqual([r for r in readers if r not in (value or [])], [],
                                     f"{pattern}: {check_id} does not name every file that reads it")
        # The converter reads the shared fixture folder too.
        midi = [p for p in (ROOT / "tools" / "midi-cleanup" / "tests").glob("*.py")
                if re.search(r'app/tests/fixtures|"app" / "tests" / "fixtures"', p.read_text(encoding="utf-8"))]
        if midi:
            for check in ("converter-harness", "parity-reference"):
                self.assertIn(check, patterns["app/tests/fixtures/**"].checks)


if __name__ == "__main__":
    unittest.main()
