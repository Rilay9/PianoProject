"""The record scripts' matrix edits: by row id, re-searched after every change, never a silent no-op.

On 2026-09-29 a record script's `text.replace(old, new)` met a row that had changed since the
script was written, replaced nothing and said nothing: the task index's E2a row was dropped and a
commit message named a record its tree did not carry (fa57005). `tools/docs/matrix_edit.py`
edits a table row found by its id, adds a row after an id, re-searches the text after each change,
and refuses (writing nothing) when an edit would change nothing or the row is not the one the
script expected. After writing the matrix or the audit file it regenerates the reviewer's views,
which were the other recurring fault of that night.
"""
from __future__ import annotations

import io
import json
import sys
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "tools" / "docs"))

import matrix_edit as me  # noqa: E402
import split_prompt_views as views  # noqa: E402

TABLE = (
    "# The matrix\n"
    "\n"
    "Q2 is mentioned in prose too, pending.\n"
    "\n"
    "| id | problem | status |\n"
    "|---|---|---|\n"
    "| Q1 | one | pending |\n"
    "| Q2 | two, with a \\| escaped pipe | pending |\n"
    "| **T2** | trading fours | none |\n"
    "| ~~T4~~ | ~~done~~ | done |\n"
)


class Edit(unittest.TestCase):
    def test_edit_changes_the_row_and_nothing_else(self) -> None:
        out = me.apply(TABLE, [{"op": "edit", "id": "Q2", "old": "pending", "new": "built"}])
        self.assertIn("| Q2 | two, with a \\| escaped pipe | built |", out)
        self.assertIn("Q2 is mentioned in prose too, pending.", out)
        self.assertIn("| Q1 | one | pending |", out)

    def test_a_stale_old_text_is_refused(self) -> None:
        with self.assertRaisesRegex(me.Refused, "not in row Q1"):
            me.apply(TABLE, [{"op": "edit", "id": "Q1", "old": "decided", "new": "built"}])

    def test_new_equal_to_old_is_refused(self) -> None:
        with self.assertRaisesRegex(me.Refused, "changes nothing"):
            me.apply(TABLE, [{"op": "edit", "id": "Q1", "old": "one", "new": "one"}])

    def test_old_twice_in_the_row_is_refused(self) -> None:
        with self.assertRaisesRegex(me.Refused, "2 times in row Q1"):
            me.apply(TABLE, [{"op": "edit", "id": "Q1", "old": " | ", "new": " ; "}])

    def test_an_id_with_no_row_or_two_rows_is_refused(self) -> None:
        with self.assertRaisesRegex(me.Refused, "no row Q9"):
            me.apply(TABLE, [{"op": "edit", "id": "Q9", "old": "a", "new": "b"}])
        twice = TABLE + "| Q1 | again | x |\n"
        with self.assertRaisesRegex(me.Refused, "2 rows Q1"):
            me.apply(twice, [{"op": "edit", "id": "Q1", "old": "one", "new": "uno"}])

    def test_an_edit_that_loses_the_id_is_refused(self) -> None:
        with self.assertRaisesRegex(me.Refused, "row Q1"):
            me.apply(TABLE, [{"op": "edit", "id": "Q1", "old": "| Q1 |", "new": "| Q7 |"}])

    def test_decorated_ids_are_found_by_the_bare_id(self) -> None:
        out = me.apply(TABLE, [{"op": "edit", "id": "T2", "old": "none", "new": "built"},
                               {"op": "edit", "id": "T4", "old": "| done |", "new": "| done 2026-09-18 |"}])
        self.assertIn("| **T2** | trading fours | built |", out)
        self.assertIn("| ~~T4~~ | ~~done~~ | done 2026-09-18 |", out)

    def test_replace_takes_the_whole_row_and_keeps_its_id(self) -> None:
        out = me.apply(TABLE, [{"op": "replace", "id": "Q1", "row": "| Q1 | one, restated | built |"}])
        self.assertIn("| Q1 | one, restated | built |", out)
        with self.assertRaisesRegex(me.Refused, "names Q5"):
            me.apply(TABLE, [{"op": "replace", "id": "Q1", "row": "| Q5 | x | y |"}])
        with self.assertRaisesRegex(me.Refused, "changes nothing"):
            me.apply(TABLE, [{"op": "replace", "id": "Q1", "row": "| Q1 | one | pending |"}])


class AddAfter(unittest.TestCase):
    def test_the_row_goes_straight_after_its_anchor(self) -> None:
        out = me.apply(TABLE, [{"op": "add-after", "id": "Q2", "row": "| Q3 | three | recorded |"}])
        lines = out.splitlines()
        self.assertEqual(lines[lines.index("| Q3 | three | recorded |") - 1], "| Q2 | two, with a \\| escaped pipe | pending |")

    def test_an_id_already_in_the_table_is_refused(self) -> None:
        with self.assertRaisesRegex(me.Refused, "already has a row Q1"):
            me.apply(TABLE, [{"op": "add-after", "id": "Q2", "row": "| Q1 | again | x |"}])

    def test_a_row_of_another_width_is_refused(self) -> None:
        with self.assertRaisesRegex(me.Refused, "2 cells, row Q2 has 3"):
            me.apply(TABLE, [{"op": "add-after", "id": "Q2", "row": "| Q3 | three |"}])


class TheBatch(unittest.TestCase):
    def test_each_step_searches_the_text_the_last_one_left(self) -> None:
        out = me.apply(TABLE, [
            {"op": "edit", "id": "Q1", "old": "pending", "new": "recorded"},
            {"op": "edit", "id": "Q1", "old": "recorded", "new": "built"},
            {"op": "add-after", "id": "Q1", "row": "| Q1a | the fix-forward | recorded |"},
            {"op": "edit", "id": "Q1a", "old": "recorded", "new": "built"},
        ])
        self.assertIn("| Q1 | one | built |\n| Q1a | the fix-forward | built |\n", out)

    def test_a_step_written_against_the_old_text_is_refused(self) -> None:
        with self.assertRaisesRegex(me.Refused, r"step 2: .*not in row Q1"):
            me.apply(TABLE, [
                {"op": "edit", "id": "Q1", "old": "pending", "new": "built"},
                {"op": "edit", "id": "Q1", "old": "pending", "new": "decided"},
            ])


class TheCommandLine(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self._tmp.cleanup)
        self.base = Path(self._tmp.name)
        self.matrix = self.base / "backlog.md"
        self.matrix.write_bytes(TABLE.replace("\n", "\r\n").encode("utf-8"))
        (self.base / "audit.md").write_text("preamble\n===== PART 1 — one =====\nbody\n", encoding="utf-8")
        for name, value in (("AUDIT", self.base / "audit.md"), ("BACKLOG", self.matrix), ("VIEWS", self.base / "views")):
            patch = mock.patch.object(views, name, value)
            patch.start()
            self.addCleanup(patch.stop)

    def run_main(self, ops: list[dict]) -> tuple[int, str]:
        ops_file = self.base / "ops.json"
        ops_file.write_text(json.dumps(ops), encoding="utf-8")
        out, err = io.StringIO(), io.StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            code = me.main([str(self.matrix), str(ops_file)])
        return code, out.getvalue() + err.getvalue()

    def test_writing_the_matrix_regenerates_the_views_and_keeps_its_line_endings(self) -> None:
        code, text = self.run_main([{"op": "edit", "id": "Q1", "old": "pending", "new": "built"}])
        self.assertEqual(code, 0, text)
        raw = self.matrix.read_bytes()
        self.assertIn(b"| Q1 | one | built |\r\n", raw)
        self.assertNotIn(b"\n", raw.replace(b"\r\n", b""), "every line ending stays CRLF")
        self.assertEqual(views.stale_views(), [])
        self.assertIn("views", text)

    def test_a_refused_batch_leaves_the_file_as_it_was(self) -> None:
        before = self.matrix.read_bytes()
        code, text = self.run_main([
            {"op": "edit", "id": "Q1", "old": "pending", "new": "built"},
            {"op": "edit", "id": "Q2", "old": "decided", "new": "built"},
        ])
        self.assertEqual(code, 2)
        self.assertIn("refused", text)
        self.assertEqual(self.matrix.read_bytes(), before)
        self.assertFalse((self.base / "views").exists(), "nothing written, nothing regenerated")


if __name__ == "__main__":
    unittest.main()
