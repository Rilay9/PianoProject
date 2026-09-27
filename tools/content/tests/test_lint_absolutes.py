"""
The absolute-word lint (F0, backlog T49's first step) lists and never fails.

What is worth pinning: the words gate 5 names are found where they are, with
the line a reader opens the file at; "the main reason" is reported as itself;
front matter is not read; and the script exits 0 whatever it finds, because a
listed word may be exactly right and the judgement is a person's.
"""
from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

TOOLS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(TOOLS))

import lint_absolutes  # noqa: E402

LESSON = """---
title: Always in the front matter, which is not read
readingTime: 1
---

Flat fingers are the main
reason for it. **Rests.** Count them exactly.

- The only list item.

Nothing here.
"""


class LintAbsolutesTest(unittest.TestCase):
    def setUp(self) -> None:
        self.dir = tempfile.TemporaryDirectory()
        self.path = Path(self.dir.name) / "9.9.md"
        self.path.write_text(LESSON, encoding="utf-8")

    def tearDown(self) -> None:
        self.dir.cleanup()

    def test_finds_each_word_on_its_own_line_with_its_sentence(self) -> None:
        found = lint_absolutes.findings(self.path)
        self.assertEqual(
            [(f["line"], f["word"]) for f in found],
            [(6, "the main reason"), (7, "exactly"), (9, "only")],
        )
        # The sentence is the one the word is in, not the bold lead-in before it.
        self.assertEqual(found[1]["sentence"], "Count them exactly.")

    def test_front_matter_is_not_read(self) -> None:
        self.assertNotIn("always", [f["word"] for f in lint_absolutes.findings(self.path)])

    def test_never_fails(self) -> None:
        original = lint_absolutes.LESSONS
        lint_absolutes.LESSONS = Path(self.dir.name)
        try:
            out = Path(self.dir.name) / "out.md"
            self.assertEqual(lint_absolutes.main(["--out", str(out)]), 0)
            self.assertIn("| 6 | the main reason |", out.read_text(encoding="utf-8"))
        finally:
            lint_absolutes.LESSONS = original


if __name__ == "__main__":
    unittest.main()
