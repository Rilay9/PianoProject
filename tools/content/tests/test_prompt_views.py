"""The reviewer's views of the audit file and the matrix are never stale.

`docs/prompts/views/` is a projection of `docs/prompts/audit-2026-09-25-outside.md` and
`docs/prompts/backlog-2026-09-25.md` for the outside reviewer's fetch limit (the audit file's
header says why). A canonical edit without `python tools/docs/split_prompt_views.py`, or a view
edited by hand, fails here — in the chain's content-tests step and in CI — so nobody inspects an
old part-NN.md six months from now because the convention was forgotten. The reviewer asked for
this on 2026-09-26.
"""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "tools" / "docs"))

import split_prompt_views as views  # noqa: E402


class PromptViewsAreFresh(unittest.TestCase):
    def test_views_match_the_canonical_files(self) -> None:
        expected = views.render()
        actual = views.on_disk()
        missing = sorted(set(expected) - set(actual))
        extra = sorted(set(actual) - set(expected))
        stale = sorted(k for k in expected if k in actual and actual[k] != expected[k])
        problems = []
        if missing:
            problems.append(f"missing views (run tools/docs/split_prompt_views.py): {missing[:5]}")
        if extra:
            problems.append(f"views with no canonical source (a view is never edited by hand): {extra[:5]}")
        if stale:
            problems.append(f"stale views (the canonical file changed; regenerate): {stale[:5]}")
        self.assertEqual(problems, [], "\n".join(problems))

    def test_every_audit_part_has_a_view(self) -> None:
        names = [name for name, _ in views.split_audit()]
        self.assertGreater(len(names), 20)
        self.assertIn("part-22", names)
        self.assertIn("part-23", names)

    def test_every_series_has_a_view(self) -> None:
        _, rows = views.split_backlog()
        for series in ("L", "R", "G", "E", "X", "Q", "U", "S", "T", "M", "I"):
            self.assertIn(series, rows, series)


if __name__ == "__main__":
    unittest.main()
