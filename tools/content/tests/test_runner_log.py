"""
A runner's log says what a fetch failure is (Q83 + Q84, 2026-09-29; Q80's follow-ups 2 and 3).

Since Q75 and Q80 the validator names, in `WARNING` lines, what a build could not measure or could not fetch. Two
logs dropped that name:

- **the build step (Q84).** `build.step_validate` kept only the validator's last line when it passed, so the one
  log a Pages deploy leaves read "content validation OK" and nothing else: Q75's deferred claims and Q80's
  set-aside placeholder never reached it. The step now keeps every line the validator starts with `WARNING` (after
  its indentation) as the step's warnings, in the validator's own words, on a pass and on a failure alike; the
  runner already prints a step's warnings indented under it, whether the step passed or not (the `[MUTO]` step's
  placeholder lines are printed that way).
- **the content tests CI runs after its build (Q83).** On a build that could not fetch Mutopia's edition,
  `test_import_mutopia`'s strict-flavour case fails, by CI's recorded design, with "ragtime.8's stride bass is
  kept by no option on the strict flavour", which does not say why. Its message now names the placeholder and the
  reason its import step wrote in the row's `importHint`; its pass condition is unchanged.
  Revised (CQ1, `docs/prompts/runs/CQ1/decision.md`): ragtime.8 no longer claims a stride bass (a broad left-hand
  result cannot certify a named style), so the case's condition is now that the Mutopia edition is measured on the
  build, and its message says "ragtime.8's Mutopia edition is not measured on this build". `Q75_LINE` below is the
  validator's wording as a fixture string, not a claim the build still makes.

The Q83 half reads the built content (run `python tools/content/build.py` first), as the case it pins does: it
turns the built catalogue's rag into the placeholder `import_mutopia.build_entry` really writes when the edition's
files are not there, in a temporary directory, and runs the case on it.
"""
from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import build  # noqa: E402
from tests import test_import_mutopia as T  # noqa: E402

#: Two of the validator's warnings, as it prints them (Q80's strict build without Mutopia's files).
Q75_LINE = (
    "WARNING (rung claims, Q75): ragtime.8 claims stride-bass (texture.left-hand-pattern), not judged on this build: "
    "6 of its options unmeasured here (a placeholder, or a file the app could not load) and none of its 6 checked "
    "options establishes it; an unmeasured option establishes nothing and refutes nothing"
)
Q80_LINE = (
    "WARNING (ladder report, Q80): docs\\generated\\ladder.md compared without the 1 item this build could not fetch "
    "(read as bundled, as the committed report has them): song.ragtime.joplin-pine-apple-rag.mutopia (the edition's "
    ".ly file was not fetched); a placeholder made for want of a fetch is not a change to the catalogue"
)
SUMMARY = "content validation OK: build\\unfetched\\content (2091 catalog items)"
PASSING = "\n".join([
    "  wrote needs into 105 rung(s)",
    "content validation of build\\unfetched\\content:",
    "  excerpts (E1): 4 cut, on no rung",
    f"  {Q75_LINE}",
    f"  {Q80_LINE}",
    "  views (docs/prompts/views): regenerated 47 file(s) from the audit file and the matrix; 0 had been stale",
    SUMMARY,
])


def validate_step(code: int, output: str) -> build.Step:
    """`build.step_validate` on a validator that printed `output` and exited `code`."""
    with mock.patch.object(build, "python", lambda script, *args: (code, output)):
        return build.step_validate(Path("build") / "unfetched" / "content", strict_license=True)


class TestTheValidateStepKeepsTheValidatorsWarnings(unittest.TestCase):
    """Q84: a passing validator's `WARNING` lines are the step's warnings, word for word."""

    def test_a_pass_keeps_both_warning_lines_verbatim(self) -> None:
        step = validate_step(0, PASSING)
        self.assertTrue(step.ok)
        self.assertEqual(step.warnings, [Q75_LINE, Q80_LINE])

    def test_the_detail_is_still_the_summary_line(self) -> None:
        self.assertEqual(validate_step(0, PASSING).detail, SUMMARY)

    def test_a_pass_without_warnings_has_none(self) -> None:
        quiet = "\n".join(line for line in PASSING.splitlines() if "WARNING" not in line)
        self.assertEqual(validate_step(0, quiet).warnings, [])

    def test_a_failure_keeps_them_too_and_its_detail_is_the_whole_output(self) -> None:
        # The one failure after the warnings are printed: the views check (stderr first, as `build.python` joins them).
        failing = "content validation FAILED: views (docs/prompts/views): 1 stale\n" + PASSING.rsplit("\n", 1)[0]
        step = validate_step(1, failing)
        self.assertFalse(step.ok)
        self.assertEqual(step.detail, failing)
        self.assertEqual(step.warnings, [Q75_LINE, Q80_LINE])


class TestTheStrictCaseNamesTheFetch(unittest.TestCase):
    """Q83: when the rag is a placeholder, the strict case's failure names it and the reason its row gives."""

    CASE = "test_on_the_strict_flavour_ragtime_8s_stride_bass_is_established_by_it"

    @classmethod
    def setUpClass(cls) -> None:
        cls.catalog = json.loads((T.BUILT / "catalog.json").read_text(encoding="utf-8"))
        cls.curriculum = (T.BUILT / "curriculum.json").read_text(encoding="utf-8")

    def failure(self, rag: dict) -> str:
        """The strict case's failure message on the built catalogue with the rag's row replaced by `rag`."""
        catalog = [rag if item["id"] == T.RAG else item for item in self.catalog]
        with tempfile.TemporaryDirectory() as raw:
            built = Path(raw)
            (built / "catalog.json").write_text(json.dumps(catalog), encoding="utf-8")
            (built / "curriculum.json").write_text(self.curriculum, encoding="utf-8")
            with mock.patch.object(T, "BUILT", built):
                with self.assertRaises(AssertionError, msg="the strict case passed without the rag: a fetch failure "
                                       "no longer fails it"
                                       ) as caught:
                    getattr(T.TestThePlacement(self.CASE), self.CASE)()
        return str(caught.exception)

    def test_an_unfetched_edition_is_named_with_its_reason(self) -> None:
        import import_mutopia as M

        with tempfile.TemporaryDirectory() as raw:
            # No files at all: the placeholder the step writes when the fetch failed.
            rag = M.build_entry(T.row(), T.table(), sources_dir=Path(raw) / "published",
                                scores_out=Path(raw) / "scores", report=M.ImportReport(), work_dir=Path(raw) / "work",
                                use_cache=False)
        self.assertIsNone(rag.get("file"))
        # What the build's demands step writes on a row with no file.
        rag["demands"] = "unmeasured"
        rag["measurement"] = {"status": "unmeasured",
                              "reason": "no notation is bundled: it arrives when the learner imports the piece"}
        message = self.failure(rag)
        self.assertIn("ragtime.8's Mutopia edition is not measured on this build", message)
        self.assertIn(f"{T.RAG} is a placeholder (the edition's .ly file was not fetched)", message)

    def test_a_bundled_rag_that_was_not_measured_is_not_called_a_placeholder(self) -> None:
        rag = dict(next(item for item in self.catalog if item["id"] == T.RAG))
        # Bundled, as a build that fetched it writes it (set here, so this holds on a build that could not fetch too).
        rag["file"] = f"scores/imported/{T.RAG}.mxl"
        rag["demands"] = "unmeasured"
        rag["measurement"] = {"status": "unmeasured", "reason": "the score file was not built"}
        message = self.failure(rag)
        self.assertIn("ragtime.8's Mutopia edition is not measured on this build", message)
        self.assertNotIn("placeholder", message)


if __name__ == "__main__":
    unittest.main()
