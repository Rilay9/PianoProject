"""
The [KERN] importer's licence gate (docs/00 D10a, docs/03 §1).

`--allow-nc` is one flag with two very different meanings depending on which
repository it is pointed at, so the interesting tests here are the refusals:
a repository with no licence must stay out however permissive the flag, and a
build without the flag must produce placeholders rather than files.

The fixtures are tiny Humdrum repositories built in a temp directory. The real
clones are not used: they are gitignored, and CI runs these tests before the
fetch step that would create them.
"""
from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import import_kern  # noqa: E402
from import_kern import (  # noqa: E402
    ExcludedRepositoryError,
    import_kern as run_import,
    kern_facts,
    publication_year,
)

NC_LICENSE = (
    "A Digital Edition\n================\n\nCopyright (C) 2004-2021 A. Editor\n\n"
    "Licensed with Attribution-NonCommercial-ShareAlike 4.0 International\n"
    "(CC BY-NC-SA 4.0) https://creativecommons.org/licenses/by-nc-sa/4.0\n"
)

#: A two-staff rag of two bars. Humdrum is tab-separated and music21 is strict
#: about it, so the columns are joined explicitly rather than typed as spaces.
def kern_source(*, year: str = "1902", licence: str | None = "CC BY-NC-SA 4.0", copyright_only: bool = False) -> str:
    rows = [
        ["**kern", "**kern"],
        ["*staff2", "*staff1"],
        ["*clefF4", "*clefG2"],
        ["*k[b-e-]", "*k[b-e-]"],
        ["*M2/4", "*M2/4"],
        ["*MM88", "*MM88"],
        ["=1", "=1"],
        ["4BB-", "4d"],
        ["4F", "4f"],
        ["=2", "=2"],
        ["4BB-", "4d"],
        ["4F", "4f"],
        ["==", "=="],
        ["*-", "*-"],
    ]
    head = f"!!!COM: Tester, Terry\n!!!OTL: Test Rag\n!!!ODT: {year}\n"
    body = "\n".join("\t".join(row) for row in rows)
    tail = "\n!!!ENC: A. Editor\n"
    if copyright_only:
        tail += "!!!YEC: Copyright 2008 by A. Editor\n"
    elif licence:
        tail += f"!!!YEC: 2021 A. Editor\n!!!YEM: Licence: ({licence}) https://creativecommons.org/\n"
    return head + body + tail


def make_repo(root: Path, name: str, *, licence_text: str | None, **source_kwargs) -> None:
    repo = root / name
    (repo / "kern").mkdir(parents=True)
    if licence_text is not None:
        (repo / "LICENSE.txt").write_text(licence_text, encoding="utf-8")
    (repo / "kern" / "rag.krn").write_text(kern_source(**source_kwargs), encoding="utf-8")


def table_for(name: str, **spec_overrides) -> dict:
    spec = {
        "id": "song.ragtime.test-rag",
        "title": "Test Rag",
        "composer": "Terry Tester",
        "publishedYear": 1902,
        "level": 7.0,
        "abrsmGradeApprox": 6,
        "tracks": ["ragtime"],
        "concepts": ["syncopation"],
    }
    spec.update(spec_overrides)
    return {
        "repos": {name: {"name": f"craigsapp/{name}", "url": f"https://github.com/craigsapp/{name}"}},
        "mustStayExcluded": {},
        "items": {f"{name}/kern/rag.krn": spec},
    }


class KernImportCase(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.root = Path(self._tmp.name)
        self.kern_dir = self.root / "kern"
        self.kern_dir.mkdir()
        self.out = self.root / "out"
        self.catalog = self.root / "catalog.kern.json"
        self._saved = (import_kern.KERN_DIR, import_kern.TABLE_PATH)
        import_kern.KERN_DIR = self.kern_dir
        self.addCleanup(self._restore)
        self.addCleanup(self._tmp.cleanup)

    def _restore(self) -> None:
        import_kern.KERN_DIR, import_kern.TABLE_PATH = self._saved

    def run_with(self, table: dict, *, allow_nc: bool):
        table_path = self.root / "kern.json"
        table_path.write_text(json.dumps(table), encoding="utf-8")
        import_kern.TABLE_PATH = table_path
        report = run_import(self.out, self.catalog, allow_nc=allow_nc)
        return report, json.loads(self.catalog.read_text(encoding="utf-8"))


class TestNonCommercialEditions(KernImportCase):
    def test_allow_nc_bundles_the_file_and_tags_it(self) -> None:
        make_repo(self.kern_dir, "joplin", licence_text=NC_LICENSE)
        report, catalog = self.run_with(table_for("joplin"), allow_nc=True)

        self.assertEqual(report.imported, ["joplin/kern/rag.krn"])
        self.assertEqual(report.placeheld, [])
        self.assertEqual(len(catalog), 1)
        item = catalog[0]
        self.assertEqual(item["file"], "scores/imported/song.ragtime.test-rag.mxl")
        self.assertTrue((self.out / item["file"]).exists())
        self.assertIn("nc-personal-build", item["tags"])
        self.assertEqual(item["source"]["license"], "CC BY-NC-SA")

    def test_without_the_flag_the_same_row_becomes_a_placeholder(self) -> None:
        make_repo(self.kern_dir, "joplin", licence_text=NC_LICENSE)
        report, catalog = self.run_with(table_for("joplin"), allow_nc=False)

        self.assertEqual(report.imported, [])
        self.assertEqual(len(report.placeheld), 1)
        item = catalog[0]
        # Same id, so the curriculum resolves either way…
        self.assertEqual(item["id"], "song.ragtime.test-rag")
        # …but nothing is written and nothing is shipped.
        self.assertIsNone(item.get("file"))
        self.assertIn("import-only", item["tags"])
        self.assertNotIn("nc-personal-build", item["tags"])
        self.assertIn("--allow-nc", item["importHint"])
        self.assertFalse((self.out / "scores" / "imported" / "song.ragtime.test-rag.mxl").exists())


class TestUnlicensedRepositories(KernImportCase):
    def test_a_repository_with_no_licence_is_refused_even_with_allow_nc(self) -> None:
        make_repo(self.kern_dir, "beethoven-piano-sonatas", licence_text=None, licence=None)
        report, catalog = self.run_with(table_for("beethoven-piano-sonatas"), allow_nc=True)

        self.assertEqual(catalog, [])
        self.assertEqual(len(report.excluded), 1)
        key, why = report.excluded[0]
        self.assertEqual(key, "beethoven-piano-sonatas/kern/rag.krn")
        self.assertIn("states no licence", why)

    def test_a_bare_copyright_line_is_not_a_grant(self) -> None:
        # chopin-preludes' shape: no LICENSE file, and inside each file a
        # !!!YEC copyright claim with no !!!YEM licence record.
        make_repo(self.kern_dir, "chopin-preludes", licence_text=None, copyright_only=True)
        report, catalog = self.run_with(table_for("chopin-preludes"), allow_nc=True)

        self.assertEqual(catalog, [])
        self.assertEqual(len(report.excluded), 1)

    def test_the_guard_fires_when_an_excluded_repository_would_pass(self) -> None:
        # The failure this guards against: someone adds a LICENSE to a
        # repository listed as must-stay-excluded, or points a row at one.
        make_repo(self.kern_dir, "chopin-mazurkas", licence_text=NC_LICENSE)
        table = table_for("joplin")
        make_repo(self.kern_dir, "joplin", licence_text=NC_LICENSE)
        table["mustStayExcluded"] = {"chopin-mazurkas": "no licence"}
        with self.assertRaises(ExcludedRepositoryError):
            self.run_with(table, allow_nc=True)

    def test_the_guard_fires_when_a_row_names_an_excluded_repository(self) -> None:
        make_repo(self.kern_dir, "chopin-mazurkas", licence_text=None, licence=None)
        table = table_for("chopin-mazurkas")
        table["mustStayExcluded"] = {"chopin-mazurkas": "no licence"}
        with self.assertRaises(ExcludedRepositoryError):
            self.run_with(table, allow_nc=True)

    def test_the_real_table_excludes_the_three_unlicensed_repositories(self) -> None:
        table = json.loads(import_kern.CONTENT_SRC.joinpath("sources", "kern.json").read_text("utf-8"))
        self.assertEqual(
            sorted(table["mustStayExcluded"]),
            ["beethoven-piano-sonatas", "chopin-mazurkas", "chopin-preludes"],
        )
        named = {key.split("/", 1)[0] for key in table["items"]}
        self.assertEqual(named & set(table["mustStayExcluded"]), set())


class TestTheTableIsNotTrusted(KernImportCase):
    def test_a_year_the_file_contradicts_is_excluded(self) -> None:
        make_repo(self.kern_dir, "joplin", licence_text=NC_LICENSE, year="1902")
        report, catalog = self.run_with(table_for("joplin", publishedYear=1899), allow_nc=True)

        self.assertEqual(catalog, [])
        self.assertIn("1899", report.excluded[0][1])
        self.assertIn("1902", report.excluded[0][1])

    def test_a_composition_still_in_copyright_is_excluded(self) -> None:
        make_repo(self.kern_dir, "joplin", licence_text=NC_LICENSE, year="1975")
        report, catalog = self.run_with(table_for("joplin", publishedYear=1975), allow_nc=True)

        self.assertEqual(catalog, [])
        self.assertIn("composition", report.excluded[0][1])

    def test_a_file_with_no_publication_date_is_excluded(self) -> None:
        repo = self.kern_dir / "joplin"
        (repo / "kern").mkdir(parents=True)
        (repo / "LICENSE.txt").write_text(NC_LICENSE, encoding="utf-8")
        undated = kern_source().replace("!!!ODT: 1902\n", "")
        (repo / "kern" / "rag.krn").write_text(undated, encoding="utf-8")
        report, catalog = self.run_with(table_for("joplin"), allow_nc=True)

        self.assertEqual(catalog, [])
        self.assertIn("publication year", report.excluded[0][1])


class TestFactsReadFromTheSource(unittest.TestCase):
    def test_key_time_and_tempo_come_out_of_the_kern_spines(self) -> None:
        facts = kern_facts(kern_source())
        self.assertEqual(facts, {"keySig": "Bb major", "timeSig": "2/4", "tempoBpm": 88.0})

    def test_an_empty_key_signature_is_c_major(self) -> None:
        self.assertEqual(kern_facts("*k[]\n*M4/4\n")["keySig"], "C major")

    def test_a_lower_case_key_record_means_minor(self) -> None:
        self.assertEqual(kern_facts("*k[f#]\n*e:\n")["keySig"], "e minor")

    def test_the_composer_dates_are_never_read_as_a_publication_year(self) -> None:
        # !!!CDT is Joplin's birth and death; reading it would date every rag 1868.
        records = {"CDT": "1868/11/24-1917/04/01"}
        self.assertIsNone(publication_year(records))
        records["PDT"] = "1899"
        self.assertEqual(publication_year(records), 1899)

    def test_an_approximate_date_still_counts(self) -> None:
        self.assertEqual(publication_year({"ODT": "~1905"}), 1905)


if __name__ == "__main__":
    unittest.main()
