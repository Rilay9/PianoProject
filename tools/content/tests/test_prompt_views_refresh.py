"""The validator's last step regenerates the reviewer's views, then compares them (Q-tooling).

On 2026-09-29 the views under `docs/prompts/views/` went stale across six record commits: the
matrix was edited and `split_prompt_views.py` not run. The brief put the regeneration in the
content build's last step; `build.py` is another builder's file this wave, so it is the
validator's last step instead (the build runs the validator, and CI runs it twice).

On GitHub's runner the step compares and does not write. The committed views are what the
reviewer fetches; regenerating them there would let `test_prompt_views` pass on any stale commit,
so the gate would close nothing. Everywhere else a validator run leaves the views fresh.
"""
from __future__ import annotations

import os
import re
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "tools" / "docs"))

import split_prompt_views as views  # noqa: E402

AUDIT = "preamble\n===== PART 1 — one =====\nbody one\n===== PART 2 — two =====\nbody two\n"
BACKLOG = "# The matrix\n\n| id | problem |\n|---|---|\n| Q1 | a |\n| Q2 | b |\n| T1 | c |\n"


class OnATempTree(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        base = Path(self._tmp.name)
        (base / "audit.md").write_text(AUDIT, encoding="utf-8")
        (base / "backlog.md").write_text(BACKLOG, encoding="utf-8")
        patches = [
            mock.patch.object(views, "AUDIT", base / "audit.md"),
            mock.patch.object(views, "BACKLOG", base / "backlog.md"),
            mock.patch.object(views, "VIEWS", base / "views"),
        ]
        for patch in patches:
            patch.start()
            self.addCleanup(patch.stop)
        self.addCleanup(self._tmp.cleanup)
        self.base = base
        views.write_views(views.render())
        # The canonical matrix edited and the views not regenerated: the 2026-09-29 fault.
        (base / "backlog.md").write_text(BACKLOG + "| Q3 | d |\n", encoding="utf-8")

    def test_the_validator_step_regenerates_stale_views(self) -> None:
        with mock.patch.dict(os.environ, {"GITHUB_ACTIONS": ""}):
            ok, line = views.refresh_for_validator()
        self.assertTrue(ok, line)
        self.assertEqual(views.stale_views(), [])
        self.assertIn("Q3", (self.base / "views" / "backlog" / "Q.md").read_text(encoding="utf-8"))
        # The series file and the index, which counts each series' rows.
        self.assertRegex(line, r"regenerated .* 2 had been stale")

    def test_on_github_s_runner_it_compares_and_writes_nothing(self) -> None:
        before = (self.base / "views" / "backlog" / "Q.md").read_text(encoding="utf-8")
        with mock.patch.dict(os.environ, {"GITHUB_ACTIONS": "true"}):
            ok, line = views.refresh_for_validator()
        self.assertTrue(ok, "the gate is test_prompt_views; the validator warns")
        self.assertEqual((self.base / "views" / "backlog" / "Q.md").read_text(encoding="utf-8"), before)
        self.assertEqual(views.stale_views(), ["README.md", "backlog/Q.md"])
        self.assertIn("WARNING", line)
        self.assertIn("backlog/Q.md", line)

    def test_fresh_views_on_github_s_runner_say_so(self) -> None:
        views.write_views(views.render())
        with mock.patch.dict(os.environ, {"GITHUB_ACTIONS": "true"}):
            ok, line = views.refresh_for_validator()
        self.assertTrue(ok)
        self.assertIn("fresh", line)


class TheValidatorRunsItLast(unittest.TestCase):
    def test_validate_main_calls_the_step_before_its_verdict_line(self) -> None:
        # Read as text: running validate.main needs a built catalogue. The step sits after every
        # check and before the one-line verdict, which the build shows as the step's summary.
        text = (ROOT / "tools" / "content" / "validate.py").read_text(encoding="utf-8")
        main = text[text.index("\ndef main("):]
        call = main.find("split_prompt_views.refresh_for_validator()")
        verdict = main.find('print(f"content validation OK')
        self.assertNotEqual(call, -1, "validate.main does not regenerate the views")
        self.assertLess(call, verdict)
        self.assertLess(main.rfind("concept_claim_findings(catalog, curriculum)[1]"), call)
        self.assertIsNone(re.search(r"sys\.exit\(0\)", main[call:verdict]))


if __name__ == "__main__":
    unittest.main()
