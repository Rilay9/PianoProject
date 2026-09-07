"""
The two builds have to carry the same ids (P19 A7, review C11).

`build.py --personal` had failed validation since P14 and nobody had run it:
`import_musetrainer` *dropped* the files whose composition is not public
domain in a strict build and *admitted* them under `--personal`, so the two
catalogs differed by six items. `docs/generated/ladder.md` is committed and is
checked for staleness against the catalog, and one report cannot be fresh for
two different catalogs — whichever flavour wrote it, the other failed.

`import_pdmx` never had the problem because it emits a placeholder in the
strict build instead of nothing. This is that, for the other importer, and the
test that would have caught it is the last one here.
"""
from __future__ import annotations

import json
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import import_musetrainer  # noqa: E402

MUSICXML = """<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <work><work-title>Fixture</work-title></work>
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><type>whole</type></note>
    </measure>
  </part>
</score-partwise>
"""


def mxl(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(path, "w") as archive:
        archive.writestr(
            "META-INF/container.xml",
            '<container><rootfiles><rootfile full-path="score.xml"/></rootfiles></container>',
        )
        archive.writestr("score.xml", MUSICXML)


def spec(item_id: str, **over: object) -> dict:
    base: dict = {
        "id": item_id,
        "title": item_id,
        "level": 3.0,
        "tracks": ["classical"],
        "concepts": ["legato"],
        "composer": "Bach, Johann Sebastian",
        "publishedYear": 1725,
    }
    base.update(over)
    return base


class TestBothBuildsAgree(unittest.TestCase):
    """Three files: one plainly free, one refused for its composition, one for its edition."""

    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        library = self.root / "library"
        for name in ("free.mxl", "modern.mxl", "edition.mxl"):
            mxl(library / name)
        table = {
            "items": {
                "free.mxl": spec("song.classical.free"),
                "modern.mxl": spec(
                    "song.classical.modern",
                    composer="Richard Clayderman",
                    publishedYear=1977,
                    exclude="composition: published 1977, still in copyright",
                ),
                "edition.mxl": spec(
                    "song.classical.edition",
                    exclude="edition: no licence granted for this engraving",
                ),
            }
        }
        self.table_path = self.root / "musetrainer.json"
        self.table_path.write_text(json.dumps(table), encoding="utf-8")
        self._table = import_musetrainer.TABLE_PATH
        self._library = import_musetrainer.LIBRARY_DIR
        import_musetrainer.TABLE_PATH = self.table_path
        import_musetrainer.LIBRARY_DIR = library

    def tearDown(self) -> None:
        import_musetrainer.TABLE_PATH = self._table
        import_musetrainer.LIBRARY_DIR = self._library
        self.tmp.cleanup()

    def build(self, *, personal: bool) -> tuple[list[dict], object]:
        flavour = "personal" if personal else "strict"
        catalog = self.root / f"catalog.{flavour}.json"
        report = import_musetrainer.import_library(
            self.root / f"out-{flavour}", catalog, personal=personal
        )
        return json.loads(catalog.read_text(encoding="utf-8")), report

    def test_the_two_builds_carry_exactly_the_same_ids(self) -> None:
        # The bug, in one line. Before the fix the strict build had two items
        # and the personal build three.
        personal, _ = self.build(personal=True)
        strict, _ = self.build(personal=False)
        self.assertEqual(
            {item["id"] for item in strict},
            {item["id"] for item in personal},
        )

    def test_the_personal_build_bundles_the_file(self) -> None:
        personal, report = self.build(personal=True)
        modern = next(item for item in personal if item["id"] == "song.classical.modern")
        self.assertTrue(modern.get("file"))
        self.assertIsNone(modern.get("importHint"))
        self.assertIn(import_musetrainer.PERSONAL_BUILD_TAG, modern["tags"])
        self.assertEqual([name for name, _ in report.personal_build], ["modern.mxl"])
        self.assertEqual(report.placeheld, [])

    def test_the_strict_build_carries_a_placeholder_with_a_reason(self) -> None:
        strict, report = self.build(personal=False)
        modern = next(item for item in strict if item["id"] == "song.classical.modern")
        self.assertIsNone(modern.get("file"))
        self.assertIn("--personal", modern["importHint"])
        self.assertIn(import_musetrainer.PERSONAL_BUILD_TAG, modern["tags"])
        self.assertEqual([name for name, _ in report.placeheld], ["modern.mxl"])
        self.assertEqual(report.personal_build, [])

    def test_no_score_file_is_written_for_a_placeholder(self) -> None:
        # A strict build must not put the bytes on disk at all — that, not the
        # catalog row, is what redistribution would mean.
        self.build(personal=False)
        written = sorted(p.name for p in (self.root / "out-strict" / "scores" / "imported").iterdir())
        self.assertEqual(written, ["song.classical.free.mxl"])

    def test_an_edition_exclusion_is_still_a_real_exclusion(self) -> None:
        # No flag grants the right to redistribute an engraving nobody
        # licensed, so that id is in neither catalog and nothing is out of step.
        for personal in (True, False):
            items, report = self.build(personal=personal)
            self.assertNotIn("song.classical.edition", {item["id"] for item in items})
            self.assertIn("edition.mxl", [name for name, _ in report.excluded])

    def test_the_composition_label_agrees_with_the_tag_in_both_builds(self) -> None:
        for personal in (True, False):
            items, _ = self.build(personal=personal)
            for item in items:
                self.assertIn(item.get("compositionStatus"), {"pd", "in-copyright"}, item["id"])
                self.assertEqual(
                    item["compositionStatus"] != "pd",
                    import_musetrainer.PERSONAL_BUILD_TAG in item["tags"],
                    item["id"],
                )

    def test_a_placeholder_keeps_the_metadata_the_rung_needs(self) -> None:
        # It is still an option of a lesson: the level, tracks and concepts are
        # what put it there, and a placeholder that lost them would quietly
        # thin the rung it belongs to.
        strict, _ = self.build(personal=False)
        modern = next(item for item in strict if item["id"] == "song.classical.modern")
        self.assertEqual(modern["level"], 3.0)
        self.assertEqual(modern["tracks"], ["classical"])
        self.assertEqual(modern["concepts"], ["legato"])
        self.assertEqual(modern["levelSource"], "judged")


if __name__ == "__main__":  # pragma: no cover
    unittest.main()
