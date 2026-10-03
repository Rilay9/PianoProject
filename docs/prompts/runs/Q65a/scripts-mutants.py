"""Each new case in test_checks_for_paths.py bites (Q65a): the committed map mutated one way at a time,
the case expected to fail on the mutant and pass on the map as written.

Two kinds of case need this rather than a red on the map before Q65a: the ones that pin what must
not change (the harness and the modules on every spec's path stay the whole suite; a renderer file
with a harness file is the whole suite), which held on the old map too, and the reader guard,
which "*" satisfies trivially on the old map. Each mutant is applied to a copy in memory; the
committed file is not touched.

    python docs/prompts/runs/Q65a/scripts/mutants.py .
"""
from __future__ import annotations

import copy
import json
import sys
import unittest
from pathlib import Path

root = Path(sys.argv[1]).resolve()
sys.path.insert(0, str(root))
sys.path.insert(0, str(root / "tools" / "docs"))
import checks_for_paths as cfp  # noqa: E402
from tools.content.tests import test_checks_for_paths as T  # noqa: E402

MAP = json.loads((root / "docs" / "prompts" / "checks.json").read_text(encoding="utf-8"))


def pattern(data: dict, name: str) -> dict:
    return next(p for p in data["patterns"] if p["pattern"] == name)


def drop(name: str, check: str, item: str):
    def apply(data: dict) -> None:
        pattern(data, name)["checks"][check].remove(item)
    return apply


def setv(name: str, check: str, value):
    def apply(data: dict) -> None:
        if value is None:
            del pattern(data, name)["checks"][check]
        else:
            pattern(data, name)["checks"][check] = value
    return apply


MUTANTS = [
    ("the harness narrowed to one spec", setv("app/tests/e2e/fixtures/chromium.ts", "e2e", ["tests/e2e/today.spec.ts"]),
     ["test_the_playwright_harness_is_the_whole_suite", "test_a_renderer_file_with_a_harness_file_is_the_whole_suite"]),
    ("the router narrowed to one spec", setv("app/src/router.ts", "e2e", ["tests/e2e/app-shell.spec.ts"]),
     ["test_a_module_on_every_spec_s_path_is_the_whole_suite"]),
    ("the Score screen given the whole suite again", setv("app/src/ui/screens/ScoreScreen.*", "e2e", "*"),
     ["test_a_score_screen_change_names_its_specs_and_keeps_the_gallery", "test_the_six_blanket_modules_name_their_specs_and_keep_the_cheap_guards"]),
    ("the Score screen without the state gallery", setv("app/src/ui/screens/ScoreScreen.*", "states", None),
     ["test_a_score_screen_change_names_its_specs_and_keeps_the_gallery"]),
    ("a spec that imports scoreControls.ts left off its list", drop("app/tests/e2e/scoreControls.ts", "e2e", "tests/e2e/score.screen.spec.ts"),
     ["test_a_test_side_helper_names_every_file_that_reads_it"]),
    ("a spec that imports midiMock.ts left off its list", drop("app/tests/e2e/fixtures/midiMock.ts", "e2e", "tests/e2e/wide.spec.ts"),
     ["test_a_test_side_helper_names_every_file_that_reads_it"]),
    ("the unit file that makes reader-learners.json left off", setv("app/tests/e2e/fixtures/reader-learners.json", "unit", None),
     ["test_a_test_side_helper_names_every_file_that_reads_it"]),
    ("the content test that holds excerpt-candidates.json left off", setv("app/tests/e2e/fixtures/excerpt-candidates.json", "content-tests", None),
     ["test_a_test_side_helper_names_every_file_that_reads_it"]),
    ("a spec that opens a shared fixture by path left off", drop("app/tests/fixtures/**", "e2e", "tests/e2e/sweeps.spec.ts"),
     ["test_a_test_side_helper_names_every_file_that_reads_it"]),
    ("the converter's harness off the shared fixtures", setv("app/tests/fixtures/**", "converter-harness", None),
     ["test_a_test_side_helper_names_every_file_that_reads_it", "test_a_shared_fixture_the_converter_reads_runs_the_converter_s_checks"]),
    ("a docs/04 reader left off", drop("docs/04-ui-spec.md", "unit", "tests/unit/help.test.ts"),
     ["test_a_machine_read_docs_path_runs_its_readers"]),
    ("the content measurement off the score model", setv("app/src/score/extractScoreModel.ts", "content-build", None),
     ["test_the_score_model_the_detectors_read_runs_the_content_measurement"]),
]


def run(data: dict, names: list[str]) -> list[tuple[str, bool]]:
    class OnTheMutant(T.TheMinimumSemantics):
        @classmethod
        def setUpClass(cls) -> None:
            cls.map = cfp.load_map_data(data)
    out = []
    for name in names:
        result = unittest.TestResult()
        unittest.TestSuite([OnTheMutant(name)]).run(result)  # a suite runs setUpClass
        out.append((name, result.wasSuccessful() and result.testsRun == 1))
    return out


caught = 0
for label, apply, names in MUTANTS:
    data = copy.deepcopy(MAP)
    apply(data)
    on_mutant = run(data, names)
    on_map = run(MAP, names)
    ok = all(not passed for _, passed in on_mutant) and all(passed for _, passed in on_map)
    caught += ok
    print(f"{'caught' if ok else 'MISSED'}: {label}")
    for (name, passed), (_, on_map_passed) in zip(on_mutant, on_map):
        print(f"    {name}: mutant {'passes' if passed else 'fails'}, map as written {'passes' if on_map_passed else 'fails'}")
print(f"{caught} of {len(MUTANTS)} mutants caught")
sys.exit(0 if caught == len(MUTANTS) else 1)
