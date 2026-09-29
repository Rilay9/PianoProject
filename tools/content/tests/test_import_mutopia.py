"""
The [MUTO] import (Q76): a public-domain rag for ragtime.8 on the licence-strict build.

The phone runs the strict build, where every craigsapp Joplin edition (CC BY-NC-SA) is a placeholder, so no bundled
piece practised the stride bass ragtime.8 names. Mutopia's Joplin editions are public domain; python-ly's MusicXML
writer cannot convert them faithfully (it writes both volta endings in turn, and music21 refuses what it writes for
*Pine Apple Rag*), so the import takes the reviewer's first fallback (`docs/review/responses/questions-400e69c8.md`
§2): the MIDI file Mutopia publishes for the edition, through the repository's MIDI converter, with every note's
spelling and the key change read from the edition's own LilyPond source. What is held here, on the committed
fixtures (the edition's .ly and its published .mid, byte for byte the pinned files):

- **the source list's shape**, and that it pins what the fixtures are;
- **the licence comes from the .ly header** (`license`, else `copyright`), and a non-commercial one is refused;
- **the conversion keeps what the claim and the page need**: every note the MIDI holds is written, every note is
  spelled as the edition spells it (the chromatic lower neighbour in bar 1 is C sharp, never D flat), the trio
  carries the edition's key change, and the app's detectors find the left-hand pattern in every bar;
- **the provenance says what happened** — Mutopia's edition, the published MIDI by its checksum, the converter by
  name and version — and the row never calls the result Mutopia's notation;
- **a file that is not the pinned one is refused**, and the id stays in the catalogue as a placeholder;
- **ragtime.8 lists it, and on the strict flavour of the built catalogue its stride bass is established by it**
  (the built content: run `python tools/content/build.py` first).
"""
from __future__ import annotations

import copy
import hashlib
import json
import shutil
import sys
import tempfile
import unittest
import warnings
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

REPO = Path(__file__).resolve().parents[3]
FIXTURES = Path(__file__).resolve().parent / "fixtures" / "mutopia"
TABLE = REPO / "content" / "sources" / "mutopia.json"
STAGE_8 = REPO / "content" / "curriculum" / "stage-8.json"
BUILT = REPO / "app" / "public" / "content"
RAG = "song.ragtime.joplin-pine-apple-rag.mutopia"
STRICT_PLACEHOLDER_TAGS = ("personal-build", "nc-personal-build")


def sha256_lf(path: Path) -> str:
    """The file's sha256 with CRLF read as LF: a checkout on Windows turns the .ly's line endings."""
    data = path.read_bytes()
    if path.suffix == ".ly":
        data = data.replace(b"\r\n", b"\n")
    return hashlib.sha256(data).hexdigest()


def table() -> dict:
    return json.loads(TABLE.read_text(encoding="utf-8"))


def row() -> dict:
    return next(item for item in table()["items"] if item["id"] == RAG)


class TestTheSourceList(unittest.TestCase):
    def test_every_row_has_what_the_import_reads(self) -> None:
        data = table()
        for key in ("name", "mirror", "revision", "lyBase", "midiBase", "pinned"):
            self.assertTrue(data["source"].get(key), f"source.{key} missing")
        ids = set()
        for item in data["items"]:
            with self.subTest(item=item.get("id")):
                for key in ("id", "title", "composer", "publishedYear", "edition", "pieceUrl", "ly", "midi", "staves",
                            "key", "timeSig", "tracks", "concepts", "editionNotes", "placeholderLevel"):
                    self.assertIn(key, item)
                for part in ("ly", "midi"):
                    self.assertEqual(len(item[part]["sha256"]), 64)
                    self.assertTrue(item[part]["path"].startswith("JoplinS/"))
                self.assertEqual(len(item["staves"]), 2)
                self.assertLessEqual(item["publishedYear"], 1930)
                self.assertTrue(item["id"].endswith(".mutopia"))
                self.assertNotIn(item["id"], ids)
                ids.add(item["id"])
        self.assertTrue(all(isinstance(reason, str) and reason for key, reason in data["checkedAndRefused"].items()
                            if key != "_comment"))

    def test_the_fixtures_are_the_pinned_files(self) -> None:
        self.assertEqual(sha256_lf(FIXTURES / "PineappleRag.ly"), row()["ly"]["sha256"])
        self.assertEqual(sha256_lf(FIXTURES / "PineappleRag.mid"), row()["midi"]["sha256"])


class TestTheLicence(unittest.TestCase):
    def test_it_is_read_from_the_header(self) -> None:
        import import_mutopia as M

        self.assertEqual(M.licence_of((FIXTURES / "PineappleRag.ly").read_text(encoding="utf-8")), "Public Domain")
        self.assertEqual(M.licence_of('\\header {\n  license = "Creative Commons Attribution 3.0"\n  copyright = "x"\n}\n'),
                         "Creative Commons Attribution 3.0")

    def test_a_non_commercial_edition_is_refused(self) -> None:
        import import_mutopia as M

        verdict = M.licence_decision('\\header {\n  license = "Creative Commons Attribution-NonCommercial 4.0"\n}\n')
        self.assertFalse(verdict.bundlable)


class TestTheConversion(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        warnings.filterwarnings("ignore")
        import import_mutopia as M

        cls.M = M
        cls._tmp = tempfile.TemporaryDirectory()
        cls.tmp = Path(cls._tmp.name)
        cls.staged, cls.report = M.convert_item(row(), FIXTURES / "PineappleRag.ly", FIXTURES / "PineappleRag.mid",
                                                work_dir=cls.tmp, use_cache=False)
        from music21 import converter

        cls.score = converter.parse(str(cls.staged))

    @classmethod
    def tearDownClass(cls) -> None:
        cls._tmp.cleanup()

    def test_every_note_the_midi_holds_is_written_and_every_bar_adds_up(self) -> None:
        self.assertEqual(self.report["converter"]["lost"], [])
        self.assertEqual(self.report["converter"]["added"], [])
        self.assertEqual(self.report["converter"]["brokenBars"], [])

    def test_every_note_is_spelled_as_the_edition_spells_it(self) -> None:
        for staff in self.report["spelling"]:
            with self.subTest(staff=staff["variable"]):
                self.assertEqual(staff["unspelled"], 0)
                self.assertEqual(staff["foreign"], {})
        first_bar = list(self.score.parts)[0].getElementsByClass("Measure")[0]
        names = [n.pitch.name for n in first_bar.recurse().notes if not n.isChord]
        self.assertIn("C#", names, "bar 1's chromatic lower neighbour is the edition's C sharp")
        self.assertNotIn("D-", names)

    def test_the_trio_carries_the_editions_key_change(self) -> None:
        from music21 import key

        for part in self.score.parts:
            with self.subTest(part=part.id):
                signatures = [(ks.getOffsetInHierarchy(part), ks.sharps) for ks in part.recurse().getElementsByClass(key.KeySignature)]
                self.assertIn(-2, [s for o, s in signatures if o == 0])
                self.assertTrue(any(o > 0 and s == -3 for o, s in signatures), signatures)

    def test_the_detectors_find_the_left_hand_pattern_in_every_bar(self) -> None:
        import demands as D
        from convert import convert_file

        written = self.tmp / "written" / "pine-apple.mxl"
        written.parent.mkdir(parents=True, exist_ok=True)
        convert_file(self.staged, written)
        answered = D.measure_each([written])[str(written)]
        self.assertNotIn("error", answered)
        self.assertIn("texture.left-hand-pattern", answered["demands"])
        self.assertEqual(sorted((answered.get("everyBar") or {}).get("texture.left-hand-pattern") or []),
                         list(range(1, int(answered["printedBars"]) + 1)))


class TestTheEntry(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        warnings.filterwarnings("ignore")
        import import_mutopia as M

        cls.M = M
        cls._tmp = tempfile.TemporaryDirectory()
        cls.tmp = Path(cls._tmp.name)
        cls.sources = cls.tmp / "published"
        for name, part in (("PineappleRag.ly", "ly"), ("PineappleRag.mid", "midi")):
            dest = cls.sources / row()[part]["path"]
            dest.parent.mkdir(parents=True, exist_ok=True)
            data = (FIXTURES / name).read_bytes()
            dest.write_bytes(data.replace(b"\r\n", b"\n") if name.endswith(".ly") else data)

    @classmethod
    def tearDownClass(cls) -> None:
        cls._tmp.cleanup()

    def entry(self, sources: Path) -> tuple[dict, object]:
        report = self.M.ImportReport()
        out = self.tmp / "out"
        entry = self.M.build_entry(row(), table(), sources_dir=sources, scores_out=out / "scores" / "imported",
                                   report=report, work_dir=self.tmp / "work", use_cache=False)
        return entry, report

    def test_the_row_says_what_happened(self) -> None:
        entry, report = self.entry(self.sources)
        self.assertEqual(report.imported, [RAG])
        self.assertEqual(entry["file"], f"scores/imported/{RAG}.mxl")
        self.assertEqual(entry["source"]["license"], "Public Domain")
        self.assertEqual(entry["levelSource"], "estimated")
        self.assertIn("mutopia", entry["tags"])
        self.assertIn("Converted here from the MIDI file Mutopia publishes", entry["source"]["editionNotes"])
        self.assertIn("the page is not", entry["source"]["editionNotes"])
        block = entry["_mutopia"]
        self.assertEqual(block["edition"], "mutopia:Mutopia-2014/01/12-1899")
        self.assertEqual(block["artifact"]["kind"], "the MIDI file Mutopia publishes for the edition")
        self.assertEqual(block["artifact"]["sha256"], row()["midi"]["sha256"])
        self.assertEqual(block["spelling"]["sha256"], row()["ly"]["sha256"])
        self.assertEqual(block["converter"]["name"], "tools/midi-cleanup/midi_to_musicxml.py")
        self.assertIsInstance(block["converter"]["version"], int)

    def test_a_file_that_is_not_the_pinned_one_is_refused(self) -> None:
        tampered = self.tmp / "tampered"
        shutil.copytree(self.sources, tampered, dirs_exist_ok=True)
        midi = tampered / row()["midi"]["path"]
        midi.write_bytes(midi.read_bytes() + b"\x00")
        entry, report = self.entry(tampered)
        self.assertIsNone(entry.get("file"), "a placeholder carries no file")
        self.assertTrue(entry.get("importHint"))
        self.assertEqual(report.imported, [])
        self.assertTrue(any("sha256" in why for _key, why in report.placeheld), report.placeheld)


class TestThePlacement(unittest.TestCase):
    def test_ragtime_8_lists_the_public_edition(self) -> None:
        source = json.loads(STAGE_8.read_text(encoding="utf-8"))
        lesson = next(lesson for stage in source["stages"] for unit in stage["units"] for lesson in unit["lessons"]
                      if lesson["id"] == "ragtime.8")
        self.assertIn(RAG, lesson["songOptions"])

    def test_on_the_strict_flavour_ragtime_8s_stride_bass_is_established_by_it(self) -> None:
        import claims

        catalog = json.loads((BUILT / "catalog.json").read_text(encoding="utf-8"))
        curriculum = json.loads((BUILT / "curriculum.json").read_text(encoding="utf-8"))
        strict = copy.deepcopy(catalog)
        for item in strict:
            if set(item.get("tags") or []) & set(STRICT_PLACEHOLDER_TAGS):
                item["file"] = None
                item["demands"] = "unmeasured"
                item["measurement"] = {"status": "unmeasured", "reason": "a strict build's placeholder"}
        report = claims.rung_claims(strict, curriculum)
        rung = next(r for r in report["rungs"] if r["rung"] == "ragtime.8")
        stride = next(c for c in rung["claims"] if c["id"] == "texture.left-hand-pattern")
        self.assertGreaterEqual(stride["established"], 1, "ragtime.8's stride bass is kept by no option on the strict flavour")
        option = next(o for o in report["options"] if o["rung"] == "ragtime.8" and o["item"] == RAG)
        self.assertEqual({c["id"]: c["status"] for c in option["claims"] if c["id"] == "texture.left-hand-pattern"},
                         {"texture.left-hand-pattern": "established"})
        item = next(i for i in catalog if i["id"] == RAG)
        self.assertFalse(set(item.get("tags") or []) & set(STRICT_PLACEHOLDER_TAGS), "a strict build would placeholder it")
        low, high = rung.get("levelBand") or next(
            lesson for stage in json.loads(STAGE_8.read_text(encoding="utf-8"))["stages"] for unit in stage["units"]
            for lesson in unit["lessons"] if lesson["id"] == "ragtime.8")["levelBand"]
        self.assertTrue(low <= float(item["level"]) <= high, f"level {item['level']} outside ragtime.8's band")
        self.assertEqual(item["provenance"]["source"], "mutopia")


if __name__ == "__main__":
    unittest.main()
