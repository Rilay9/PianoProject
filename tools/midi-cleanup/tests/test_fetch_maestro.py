"""
`fetch_maestro.py`, on a fixture archive (Q47).

The real archive is a download CI makes once per cache key; these tests build a small zip
with the same layout (the metadata CSV under the dataset's folder, MIDI members beside it)
so every rule the fetch step applies is checked without the network: the archive's
checksum before anything is extracted, each alias mapped to exactly one metadata row that
names the intended performance, a missing, duplicated, empty or altered member refused,
exactly three files and `SOURCE.md` written, and a restored cache validated rather than
trusted.

Run from the repository root:

    python -m unittest discover -s tools/midi-cleanup/tests -p test_fetch_maestro.py -v
"""
from __future__ import annotations

import csv
import hashlib
import io
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent))

import fetch_maestro  # noqa: E402
from fetch_maestro import (  # noqa: E402
    CITATION_TITLE,
    LICENCE,
    LICENCE_TEXT_URL,
    DATASET_PAGE,
    VERSION,
    FetchError,
    Performance,
    extract,
    problems,
)

ROOT = "maestro-v3.0.0/"
FIELDS = ["canonical_composer", "canonical_title", "split", "year", "midi_filename",
          "audio_filename", "duration"]
TODAY = "2026-09-29"


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


class Fixture:
    """A zip shaped like the MIDI-only archive, and the performances that name it."""

    def __init__(self, tmp: Path) -> None:
        self.tmp = tmp
        self.bytes = {
            "a.mid": b"MThd-first-performance",
            "b.mid": b"MThd-second-performance",
            "c.mid": b"MThd-third-performance",
        }
        self.performances = (
            Performance("a.mid", "2011/one.midi", "Johann Sebastian Bach",
                        "BWV 885", "2011", sha(self.bytes["a.mid"])),
            Performance("b.mid", "2014/two.midi", "Edvard Grieg",
                        "Op. 38 No. 7", "2014", sha(self.bytes["b.mid"])),
            Performance("c.mid", "2008/three.midi", "Domenico Scarlatti",
                        "K. 525", "2008", sha(self.bytes["c.mid"])),
        )
        self.rows = [
            {"canonical_composer": p.composer, "canonical_title": f"Piece, {p.title_contains}",
             "split": "train", "year": p.year, "midi_filename": p.member,
             "audio_filename": p.member.replace(".midi", ".wav"), "duration": "60.0"}
            for p in self.performances
        ]
        # A second performance of the first piece in the same year, as the real metadata
        # has: a match on composer, title and year alone would find two.
        self.rows.append({**self.rows[0], "midi_filename": "2011/other.midi",
                          "audio_filename": "2011/other.wav"})
        self.members = {ROOT + p.member: self.bytes[p.alias] for p in self.performances}
        self.members[ROOT + "2011/other.midi"] = b"MThd-the-other-one"

    def write(self) -> Path:
        text = io.StringIO()
        writer = csv.DictWriter(text, fieldnames=FIELDS, lineterminator="\n")
        writer.writeheader()
        writer.writerows(self.rows)
        path = self.tmp / "maestro-v3.0.0-midi.zip"
        entries = {ROOT + "maestro-v3.0.0.csv": text.getvalue().encode("utf-8"),
                   ROOT + "LICENSE": b"Attribution-NonCommercial-ShareAlike 4.0",
                   **self.members}
        with zipfile.ZipFile(path, "w") as archive:
            for name, data in entries.items():
                # A fixed timestamp, so writing the same fixture twice gives the same bytes
                # and the same checksum.
                archive.writestr(zipfile.ZipInfo(name, date_time=(2020, 1, 1, 0, 0, 0)), data)
        return path

    def extract(self, out: Path, **overrides) -> None:
        archive = self.write()
        extract(archive, out, expected_sha256=overrides.pop("expected_sha256", sha(archive.read_bytes())),
                performances=overrides.pop("performances", self.performances), today=TODAY)


class TestTheFetch(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.tmp = Path(self._tmp.name)
        self.fixture = Fixture(self.tmp)
        self.out = self.tmp / "midi-real"

    def tearDown(self) -> None:
        self._tmp.cleanup()

    def written(self) -> list[str]:
        return sorted(p.name for p in self.out.iterdir()) if self.out.exists() else []

    def test_a_good_archive_yields_exactly_the_three_aliases_and_their_provenance(self) -> None:
        self.fixture.extract(self.out)
        self.assertEqual(self.written(), ["SOURCE.md", "a.mid", "b.mid", "c.mid"])
        for alias, data in self.fixture.bytes.items():
            self.assertEqual((self.out / alias).read_bytes(), data, alias)
        source = (self.out / "SOURCE.md").read_text(encoding="utf-8")
        archive_sha = sha(self.fixture.write().read_bytes())
        for needed in (VERSION, archive_sha, LICENCE, DATASET_PAGE, LICENCE_TEXT_URL,
                       CITATION_TITLE, TODAY):
            self.assertIn(needed, source)
        for p in self.fixture.performances:
            self.assertIn(f"`{p.alias}`", source)
            self.assertIn(f"`{ROOT}{p.member}`", source)
        # The other performance of the same piece is not taken.
        self.assertNotIn("other.midi", source)
        self.assertEqual(problems(self.out, performances=self.fixture.performances,
                                  expected_sha256=archive_sha), [])

    def test_a_wrong_archive_checksum_stops_before_anything_is_extracted(self) -> None:
        with self.assertRaises(FetchError) as caught:
            self.fixture.extract(self.out, expected_sha256="0" * 64)
        self.assertIn("0" * 64, str(caught.exception))
        self.assertEqual(self.written(), [])

    def test_a_member_the_metadata_does_not_list_fails(self) -> None:
        self.fixture.rows = [row for row in self.fixture.rows if row["midi_filename"] != "2014/two.midi"]
        with self.assertRaises(FetchError) as caught:
            self.fixture.extract(self.out)
        self.assertIn("2014/two.midi", str(caught.exception))
        self.assertIn("0 rows", str(caught.exception))
        self.assertEqual(self.written(), [])

    def test_a_member_the_metadata_lists_twice_fails(self) -> None:
        self.fixture.rows.append(dict(self.fixture.rows[2]))
        with self.assertRaises(FetchError) as caught:
            self.fixture.extract(self.out)
        self.assertIn("2008/three.midi", str(caught.exception))
        self.assertIn("2 rows", str(caught.exception))
        self.assertEqual(self.written(), [])

    def test_a_member_whose_row_names_another_performance_fails(self) -> None:
        self.fixture.rows[1] = {**self.fixture.rows[1], "year": "2015"}
        with self.assertRaises(FetchError) as caught:
            self.fixture.extract(self.out)
        self.assertIn("b.mid", str(caught.exception))
        self.assertIn("2015", str(caught.exception))
        self.assertEqual(self.written(), [])

    def test_an_empty_member_fails(self) -> None:
        self.fixture.members[ROOT + "2008/three.midi"] = b""
        with self.assertRaises(FetchError) as caught:
            self.fixture.extract(self.out)
        self.assertIn("empty", str(caught.exception))
        self.assertEqual(self.written(), [])

    def test_a_member_absent_from_the_archive_fails(self) -> None:
        del self.fixture.members[ROOT + "2011/one.midi"]
        with self.assertRaises(FetchError) as caught:
            self.fixture.extract(self.out)
        self.assertIn("2011/one.midi", str(caught.exception))
        self.assertEqual(self.written(), [])

    def test_a_member_whose_bytes_are_not_the_pinned_ones_fails(self) -> None:
        self.fixture.members[ROOT + "2014/two.midi"] = b"MThd-a-different-take"
        with self.assertRaises(FetchError) as caught:
            self.fixture.extract(self.out)
        self.assertIn("b.mid", str(caught.exception))
        self.assertEqual(self.written(), [])


class TestARestoredCacheIsValidated(unittest.TestCase):
    """A restore is not proof the inputs exist: the same files, bytes and provenance."""

    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.tmp = Path(self._tmp.name)
        self.fixture = Fixture(self.tmp)
        self.out = self.tmp / "midi-real"
        self.fixture.extract(self.out)
        self.archive_sha = sha(self.fixture.write().read_bytes())

    def tearDown(self) -> None:
        self._tmp.cleanup()

    def found(self) -> list[str]:
        return problems(self.out, performances=self.fixture.performances,
                        expected_sha256=self.archive_sha)

    def test_the_fetched_directory_passes(self) -> None:
        self.assertEqual(self.found(), [])

    def test_a_missing_file_is_named(self) -> None:
        (self.out / "b.mid").unlink()
        self.assertTrue(any("b.mid" in line and "missing" in line for line in self.found()), self.found())

    def test_an_empty_file_is_named(self) -> None:
        (self.out / "c.mid").write_bytes(b"")
        self.assertTrue(any("c.mid" in line and "empty" in line for line in self.found()), self.found())

    def test_a_file_with_other_bytes_is_named(self) -> None:
        (self.out / "a.mid").write_bytes(b"MThd-something-else")
        self.assertTrue(any("a.mid" in line and "SHA256" in line for line in self.found()), self.found())

    def test_a_provenance_file_that_does_not_name_an_alias_is_refused(self) -> None:
        source = self.out / "SOURCE.md"
        source.write_text(source.read_text(encoding="utf-8").replace("`b.mid`", "`b`"), encoding="utf-8")
        self.assertTrue(any("SOURCE.md" in line and "b.mid" in line for line in self.found()), self.found())

    def test_a_missing_provenance_file_is_refused(self) -> None:
        (self.out / "SOURCE.md").unlink()
        self.assertTrue(any("SOURCE.md" in line for line in self.found()), self.found())


class TestTheCommand(unittest.TestCase):
    """The step's two paths: a cache hit is validated and never re-fetched; a miss fetches."""

    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.tmp = Path(self._tmp.name)
        self.fixture = Fixture(self.tmp)
        self.archive = self.fixture.write()
        self.patches = [
            mock.patch.object(fetch_maestro, "PERFORMANCES", self.fixture.performances),
            mock.patch.object(fetch_maestro, "ARCHIVE_SHA256", sha(self.archive.read_bytes())),
        ]
        for patch in self.patches:
            patch.start()

    def tearDown(self) -> None:
        for patch in self.patches:
            patch.stop()
        self._tmp.cleanup()

    def test_a_cache_hit_on_an_empty_directory_fails_without_downloading(self) -> None:
        out = self.tmp / "restored"
        out.mkdir()
        with mock.patch.object(fetch_maestro, "download", side_effect=AssertionError("downloaded")):
            code = fetch_maestro.main(["--cache-hit", "true", "--out", str(out)])
        self.assertEqual(code, 1)

    def test_a_miss_downloads_verifies_and_keeps_only_the_three_and_their_provenance(self) -> None:
        out = self.tmp / "fresh"

        def fake_download(url: str, dest: Path) -> None:
            self.assertEqual(url, fetch_maestro.ARCHIVE_URL)
            dest.write_bytes(self.archive.read_bytes())

        with mock.patch.object(fetch_maestro, "download", side_effect=fake_download) as called:
            code = fetch_maestro.main(["--cache-hit", "", "--out", str(out)])
        self.assertEqual(code, 0)
        self.assertEqual(called.call_count, 1)
        # The zip is not kept beside the files: the cache holds the three, not the archive.
        self.assertEqual(sorted(p.name for p in out.iterdir()), ["SOURCE.md", "a.mid", "b.mid", "c.mid"])

    def test_a_cache_hit_on_the_fetched_directory_passes(self) -> None:
        out = self.tmp / "restored"
        self.assertEqual(fetch_maestro.main(["--archive", str(self.archive), "--out", str(out)]), 0)
        with mock.patch.object(fetch_maestro, "download", side_effect=AssertionError("downloaded")):
            self.assertEqual(fetch_maestro.main(["--cache-hit", "true", "--out", str(out)]), 0)


class TestTheRealMapping(unittest.TestCase):
    """The constants the CI step runs with, checked against their consumer."""

    def test_the_aliases_are_the_ones_the_harness_reads(self) -> None:
        from test_converter import REAL_DIR, REAL_FILES

        self.assertEqual(sorted(p.alias for p in fetch_maestro.PERFORMANCES), sorted(REAL_FILES))
        self.assertEqual(fetch_maestro.DEFAULT_OUT, REAL_DIR)

    def test_each_alias_names_one_member_in_its_year(self) -> None:
        members = [p.member for p in fetch_maestro.PERFORMANCES]
        self.assertEqual(len(set(members)), len(members))
        for p in fetch_maestro.PERFORMANCES:
            self.assertTrue(p.member.startswith(f"{p.year}/"), p)
            self.assertIn(p.year, p.alias)
            self.assertRegex(p.sha256, r"^[0-9a-f]{64}$")

    def test_the_archive_is_the_published_one(self) -> None:
        # The publisher's figure for the MIDI-only v3.0.0 zip, re-read on 2026-09-29 at the
        # dataset's page; the reviewer quoted the same figure (responses/f52ebde.md).
        self.assertEqual(
            fetch_maestro.ARCHIVE_SHA256,
            "70470ee253295c8d2c71e6d9d4a815189e35c89624b76d22fce5a019d5dde12c",
        )
        self.assertTrue(fetch_maestro.ARCHIVE_URL.endswith("/v3.0.0/maestro-v3.0.0-midi.zip"))


if __name__ == "__main__":
    unittest.main()
