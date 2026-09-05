"""
author.py: the tunes we write ourselves (docs/03 §3 step 4, §5).

The tests run against the real authored sources rather than fixtures, because
the thing most likely to break is a tune, not the compiler: a mistyped
`%%pianopath` line or a bar that does not add up should fail here rather than
in the app.
"""
from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from author import AuthoringError, author_all, compile_abc  # noqa: E402
from common import AUTHORED_DIR  # noqa: E402
from tests.mxlutil import read_mxl  # noqa: E402


class TestAuthoredSources(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls._tmp = tempfile.TemporaryDirectory()
        cls.out = Path(cls._tmp.name)
        cls.catalog_path = cls.out / "catalog.json"
        cls.report = author_all(cls.out, cls.catalog_path)
        cls.catalog = json.loads(cls.catalog_path.read_text(encoding="utf-8"))

    @classmethod
    def tearDownClass(cls) -> None:
        cls._tmp.cleanup()

    def test_everything_in_the_authored_directory_compiles(self) -> None:
        self.assertEqual(self.report.failed, [])
        sources = list(AUTHORED_DIR.glob("*.abc")) + [
            p for p in AUTHORED_DIR.glob("*.py") if p.name != "__init__.py"
        ]
        self.assertEqual(len(self.report.written), len(sources))

    def test_every_item_has_a_file_that_exists(self) -> None:
        for item in self.catalog:
            with self.subTest(item=item["id"]):
                self.assertTrue((self.out / item["file"]).exists())

    def test_every_item_is_a_grand_staff_with_a_tempo(self) -> None:
        for item in self.catalog:
            with self.subTest(item=item["id"]):
                written = read_mxl(self.out / item["file"])
                self.assertEqual(written.score_parts, 1)
                self.assertEqual(written.staves, 2)
                self.assertTrue(written.tempos)

    def test_ids_are_unique(self) -> None:
        ids = [item["id"] for item in self.catalog]
        self.assertEqual(len(ids), len(set(ids)))

    def test_abc_fingering_reaches_the_score(self) -> None:
        # The `!n!` decorations in the authored ABC are the whole reason
        # abc_tools re-extracts them; if they stop arriving, say so here.
        twinkle = next(i for i in self.catalog if i["id"] == "song.folk.twinkle.rh")
        # Thumb on C, fifth on G, then the hand moves up a step for the A and
        # back: 5 on the A and 4 on the G that follows it. Repeated notes are
        # left unmarked, so these four are the four position marks of bars 1-2.
        self.assertEqual(read_mxl(self.out / twinkle["file"]).fingerings[:4], [1, 5, 5, 4])

    def test_chord_symbols_reach_the_score(self) -> None:
        blues = next(i for i in self.catalog if i["id"].startswith("exercise.blues"))
        self.assertGreaterEqual(read_mxl(self.out / blues["file"]).harmonies, 12)

    def test_licences_are_declared(self) -> None:
        for item in self.catalog:
            with self.subTest(item=item["id"]):
                self.assertTrue(item["source"]["license"])
                self.assertTrue(item["source"]["checksum"])


class TestMetadataErrors(unittest.TestCase):
    def compile_text(self, text: str) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "tune.abc"
            path.write_text(text, encoding="utf-8")
            compile_abc(path, Path(tmp) / "out")

    def test_a_tune_with_no_id_is_refused(self) -> None:
        with self.assertRaises(AuthoringError):
            self.compile_text("X:1\nT:No id\nL:1/4\nK:C\nV:1\nC D E F |]\n")

    def test_a_tune_with_no_level_is_refused(self) -> None:
        # Without a level the item cannot be placed in the plan, and guessing
        # one from the notes is exactly the kind of guess that goes unnoticed.
        with self.assertRaises(AuthoringError):
            self.compile_text(
                "X:1\nT:No level\nL:1/4\n%%pianopath id=song.test.x tracks=core\nK:C\nV:1\nC D E F |]\n"
            )

    def test_an_id_with_the_wrong_prefix_is_refused(self) -> None:
        with self.assertRaises(AuthoringError):
            self.compile_text(
                "X:1\nT:Bad id\nL:1/4\n%%pianopath id=tune.test.x level=1 tracks=core\nK:C\nV:1\nC D E F |]\n"
            )


if __name__ == "__main__":
    unittest.main()
