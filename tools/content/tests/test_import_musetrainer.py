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

import io
import json
import shutil
import sys
import tempfile
import unittest
import zipfile
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from unittest import mock

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


class TestTheConvertersTempoIsTagged(unittest.TestCase):
    """
    A file with no tempo of its own plays the converter's default; the row says so (tempo provenance, 2026-10-07).

    "No tempo of its own" sends the file through `convert`, which writes `DEFAULT_TEMPO_BPM` as a `<sound tempo>`
    and says so (`added_tempo`). This step read the default back from the written file as the row's `tempoBpm`
    and dropped the converter's answer, so six rows played 96 untagged and the build called it the edition's.
    The discriminating pair: the same file with and without a tempo of its own.
    """

    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        library = self.root / "library"
        mxl(library / "bare.mxl")
        stated = library / "stated.mxl"
        stated.parent.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(stated, "w") as archive:
            archive.writestr("META-INF/container.xml",
                             '<container><rootfiles><rootfile full-path="score.xml"/></rootfiles></container>')
            archive.writestr("score.xml", MUSICXML.replace(
                "      <note>", '      <direction><direction-type><metronome><beat-unit>quarter</beat-unit>'
                               '<per-minute>72</per-minute></metronome></direction-type><sound tempo="72"/></direction>\n'
                               "      <note>", 1))
        table = {"items": {"bare.mxl": spec("song.classical.bare"), "stated.mxl": spec("song.classical.stated")}}
        table_path = self.root / "musetrainer.json"
        table_path.write_text(json.dumps(table), encoding="utf-8")
        self._saved = (import_musetrainer.TABLE_PATH, import_musetrainer.LIBRARY_DIR)
        import_musetrainer.TABLE_PATH, import_musetrainer.LIBRARY_DIR = table_path, library

    def tearDown(self) -> None:
        import_musetrainer.TABLE_PATH, import_musetrainer.LIBRARY_DIR = self._saved
        self.tmp.cleanup()

    def test_only_the_file_with_no_tempo_of_its_own_is_tagged(self) -> None:
        catalog = self.root / "catalog.json"
        import_musetrainer.import_library(self.root / "out", catalog, personal=True)
        rows = {item["id"]: item for item in json.loads(catalog.read_text(encoding="utf-8"))}
        self.assertIn("tempo-defaulted", rows["song.classical.bare"]["tags"])
        self.assertEqual(rows["song.classical.bare"]["tempoBpm"], 96.0, "the default the file plays")
        self.assertNotIn("tempo-defaulted", rows["song.classical.stated"]["tags"])
        self.assertEqual(rows["song.classical.stated"]["tempoBpm"], 72.0)


def not_fetched(filename: str) -> str:
    """Q82: the reason the step gives for a file the library lacks, as `validate.UNFETCHED_REASONS` reads it."""
    return f"{filename} was not fetched: the MuseTrainer library is not on this build"


class TestAFileTheLibraryLacks(unittest.TestCase):
    """
    Q82: a file the library lacks is a placeholder that says it was not fetched, on both flavours.

    The fetch step skips a source it cannot reach, and a skipped source is a smaller build, not a broken one.
    Before Q82 this step dropped a file it could not find (`report.missing`, nothing in the catalogue), and a
    library that did not arrive at all left an empty fragment, so every rung that named one of its songs pointed
    at nothing (Q80 simulated it: 65 unknown items). One file is here; three the table names are not — one plainly
    free, one the owner's build carries for its composition, one the table excludes for its edition.
    """

    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.library = self.root / "library"
        mxl(self.library / "free.mxl")
        table = {
            "items": {
                "free.mxl": spec("song.classical.free"),
                "gone.mxl": spec("song.classical.gone"),
                "modern.mxl": spec(
                    "song.classical.modern",
                    composer="Richard Clayderman",
                    publishedYear=1977,
                    exclude="composition: published 1977, still in copyright",
                ),
                "edition.mxl": spec("song.classical.edition", exclude="edition: no licence granted for this engraving"),
            }
        }
        self.table_path = self.root / "musetrainer.json"
        self.table_path.write_text(json.dumps(table), encoding="utf-8")
        self._saved = (import_musetrainer.TABLE_PATH, import_musetrainer.LIBRARY_DIR)
        import_musetrainer.TABLE_PATH = self.table_path
        import_musetrainer.LIBRARY_DIR = self.library

    def tearDown(self) -> None:
        import_musetrainer.TABLE_PATH, import_musetrainer.LIBRARY_DIR = self._saved
        self.tmp.cleanup()

    def build(self, *, personal: bool) -> tuple[dict, object]:
        flavour = "personal" if personal else "strict"
        catalog = self.root / f"catalog.{flavour}.json"
        report = import_musetrainer.import_library(self.root / f"out-{flavour}", catalog, personal=personal)
        return {item["id"]: item for item in json.loads(catalog.read_text(encoding="utf-8"))}, report

    def test_a_filename_the_library_lacks_is_a_placeholder_with_the_reason(self) -> None:
        for personal in (True, False):
            items, report = self.build(personal=personal)
            self.assertIn("song.classical.gone", items, "the id resolves")
            gone = items["song.classical.gone"]
            self.assertIsNone(gone.get("file"))
            self.assertIn(not_fetched("gone.mxl"), gone["importHint"])
            self.assertEqual(report.missing, ["gone.mxl", "modern.mxl"])
            self.assertEqual(report.imported, ["free.mxl"])
            # Neither a licence placeholder nor a file the owner's build carries: it is not here at all.
            self.assertEqual(report.placeheld, [])
            self.assertEqual(report.personal_build, [])

    def test_a_composition_the_owners_build_carries_keeps_its_label_and_says_why_it_is_missing(self) -> None:
        for personal in (True, False):
            items, _ = self.build(personal=personal)
            modern = items["song.classical.modern"]
            self.assertIsNone(modern.get("file"))
            self.assertIn(not_fetched("modern.mxl"), modern["importHint"])
            self.assertNotIn("--personal", modern["importHint"])
            self.assertIn(import_musetrainer.PERSONAL_BUILD_TAG, modern["tags"])
            self.assertEqual(modern["compositionStatus"], "in-copyright")
            gone = items["song.classical.gone"]
            self.assertEqual(gone["tags"], ["musetrainer"])
            self.assertEqual(gone["compositionStatus"], "pd")

    def test_it_keeps_the_metadata_the_rung_needs(self) -> None:
        items, _ = self.build(personal=False)
        gone = items["song.classical.gone"]
        self.assertEqual((gone["level"], gone["levelSource"]), (3.0, "judged"))
        self.assertEqual((gone["tracks"], gone["concepts"]), (["classical"], ["legato"]))
        self.assertEqual(gone["source"]["license"], import_musetrainer.STATED_LICENSE)
        self.assertIsNone(gone["source"].get("fetchedAt"), "a file that did not arrive has no fetch date")

    def test_the_two_builds_carry_the_same_placeholders(self) -> None:
        personal, _ = self.build(personal=True)
        strict, _ = self.build(personal=False)
        self.assertEqual(set(personal), set(strict))
        for item_id in ("song.classical.gone", "song.classical.modern"):
            self.assertEqual(personal[item_id], strict[item_id], item_id)

    def test_an_edition_exclusion_stays_an_exclusion_when_its_file_is_missing(self) -> None:
        items, report = self.build(personal=True)
        self.assertNotIn("song.classical.edition", items)
        self.assertIn("edition.mxl", [name for name, _ in report.excluded])
        self.assertNotIn("edition.mxl", report.missing)

    def run_main(self) -> tuple[str, dict]:
        catalog = self.root / "catalog.main.json"
        argv = ["import_musetrainer.py", "--out", str(self.root / "out-main"), "--catalog", str(catalog)]
        out, err = io.StringIO(), io.StringIO()
        with mock.patch.object(sys, "argv", argv), redirect_stdout(out), redirect_stderr(err):
            import_musetrainer.main()
        return out.getvalue(), {item["id"]: item for item in json.loads(catalog.read_text(encoding="utf-8"))}

    def test_the_steps_last_line_counts_what_was_not_fetched(self) -> None:
        # `build.py` shows a step's last line and nothing else, so that is where a runner's log says it.
        out, _ = self.run_main()
        self.assertIn("2 not fetched", out.strip().splitlines()[-1])

    def test_no_library_at_all_placeholds_every_row(self) -> None:
        # What a runner has when the clone failed: the library folder itself is absent.
        shutil.rmtree(self.library)
        out, items = self.run_main()
        self.assertEqual(sorted(items), ["song.classical.free", "song.classical.gone", "song.classical.modern"])
        self.assertIn(not_fetched("free.mxl"), items["song.classical.free"]["importHint"])
        self.assertIn("3 not fetched", out.strip().splitlines()[-1])


if __name__ == "__main__":  # pragma: no cover
    unittest.main()
