"""
The stale-ladder check tells a build's own placeholders from the catalogue's (Q80, 2026-09-29).

`docs/generated/ladder.md` is rendered from the catalogue and committed, and `validate.stale_ladder_report`
compares the committed file with what this build renders. A build that could not fetch a source carries a
placeholder the committed report does not: Q76's first landing chain here (an offline build without Mutopia's
two files) failed validation on "is stale — the catalog has changed", a reason that says nothing about the
catalogue, and on the runner a network hiccup at fetch time would have failed CI and the Pages deploy the same
way. What is held here:

- **a placeholder whose reason is this build's fetch** (the edition's file not fetched, or a fetched file that is
  not the pinned one, as `import_mutopia.build_entry` writes them) is compared as the committed report has it,
  and warned, naming the item and the reason; no error;
- **a placeholder that is the catalogue's** (a licence the gate refuses) is a change, and the error stands;
- **a genuine change to the ladder** (a song added to a rung) is the error as today, with or without a fetch
  failure beside it; beside one, the error names the items it set aside, so nobody regenerates the committed
  report from a build that could not fetch them;
- **the licence-strict flavour's placeholders**, tagged personal-only in the owner's build, compare equal to
  that build's bundled files, as they did before Q80 (a pin).

The committed report is a temporary file under `build/` (never `docs/`), rendered from a fixture catalogue;
the Mutopia placeholders are the ones `import_mutopia` really writes, so a change to its wording turns this red.
"""
from __future__ import annotations

import copy
import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import ladder_report  # noqa: E402
from common import BUILD_DIR  # noqa: E402

REPO = Path(__file__).resolve().parents[3]
TABLE = REPO / "content" / "sources" / "mutopia.json"
RAG = "song.ragtime.joplin-pine-apple-rag.mutopia"


def mutopia_table() -> tuple[dict, dict]:
    table = json.loads(TABLE.read_text(encoding="utf-8"))
    return table, next(item for item in table["items"] if item["id"] == RAG)


def song(item_id: str, level: float, **overrides) -> dict:
    base = {
        "id": item_id, "type": "song", "title": item_id.rsplit(".", 1)[-1].title(), "level": level,
        "hands": "both", "tracks": ["ragtime"], "concepts": [], "file": f"scores/imported/{item_id}.mxl",
        "tags": [], "source": {"name": "test", "license": "Public Domain", "pd_region": "worldwide"},
    }
    base.update(overrides)
    return base


def exercise(item_id: str, level: float) -> dict:
    return song(item_id, level, type="exercise", file=f"scores/generated/{item_id}.musicxml")


EXERCISES = ["exercise.a", "exercise.b", "exercise.c"]
SONGS = ["song.ragtime.one", "song.ragtime.two", RAG]


def curriculum(songs: list[str]) -> dict:
    return {
        "tracks": [{"id": "ragtime", "title": "Ragtime", "startsAtStage": 6}],
        "stages": [{"number": 8, "units": [{"id": "ragtime-8", "track": "ragtime", "lessons": [
            {"id": "ragtime.8", "exerciseOptions": EXERCISES, "songOptions": songs},
        ]}]}],
    }


def build_mutopia_entry(tmp: Path, sources: Path, row: dict | None = None) -> dict:
    """The row `import_mutopia.build_entry` writes from what is (or is not) under `sources`."""
    import import_mutopia as M

    table, pinned = mutopia_table()
    report = M.ImportReport()
    return M.build_entry(row or pinned, table, sources_dir=sources, scores_out=tmp / "out" / "scores" / "imported",
                         report=report, work_dir=tmp / "work", use_cache=False)


def as_a_fetching_build_has_it(placeholder: dict) -> dict:
    """The same row with its file: what the committed report was rendered from."""
    item = copy.deepcopy(placeholder)
    item.update(file=f"scores/imported/{RAG}.mxl", importHint=None, tags=["mutopia"])
    item["source"] = dict(item["source"], license="Public Domain")
    return item


class LadderCase(unittest.TestCase):
    """A committed report rendered from `self.committed`, and `ladder_report.DEFAULT_OUT` pointed at it."""

    def setUp(self) -> None:
        BUILD_DIR.mkdir(parents=True, exist_ok=True)
        # Under build/ (gitignored), not the system temp: the error names the report relative to the repository.
        self._tmp = tempfile.TemporaryDirectory(dir=BUILD_DIR, prefix="q80-ladder-")
        self.tmp = Path(self._tmp.name)
        self._original = ladder_report.DEFAULT_OUT
        ladder_report.DEFAULT_OUT = self.tmp / "ladder.md"
        self.unfetched = build_mutopia_entry(self.tmp, self.tmp / "nothing-fetched")
        self.assertIsNone(self.unfetched.get("file"), "an edition with no files is a placeholder")
        self.rag = as_a_fetching_build_has_it(self.unfetched)
        self.committed = [exercise(i, 5.0) for i in EXERCISES] + [
            song("song.ragtime.one", 7.0), song("song.ragtime.two", 7.6), self.rag,
        ]
        self.commit(self.committed, curriculum(SONGS))

    def tearDown(self) -> None:
        ladder_report.DEFAULT_OUT = self._original
        self._tmp.cleanup()

    def commit(self, catalog: list, cur: dict) -> None:
        ladder_report.DEFAULT_OUT.write_text(ladder_report.render(catalog, cur), encoding="utf-8")

    def with_rag(self, item: dict) -> list:
        return [item if entry["id"] == RAG else entry for entry in self.committed]


class TestABuildsOwnPlaceholders(LadderCase):
    def test_an_edition_this_build_did_not_fetch_is_not_an_error(self) -> None:
        from validate import stale_ladder_report

        self.assertEqual(stale_ladder_report(self.with_rag(self.unfetched), curriculum(SONGS)), [])

    def test_the_warning_names_the_item_and_its_reason(self) -> None:
        from validate import ladder_report_findings

        errors, warnings = ladder_report_findings(self.with_rag(self.unfetched), curriculum(SONGS))
        self.assertEqual(errors, [])
        self.assertEqual(len(warnings), 1, warnings)
        self.assertIn("WARNING (ladder report, Q80)", warnings[0])
        self.assertIn("1 item this build could not fetch", warnings[0])
        self.assertIn(f"{RAG} (the edition's .ly file was not fetched)", warnings[0])

    def test_a_fetched_file_that_is_not_the_pinned_one_is_the_builds_too(self) -> None:
        from validate import stale_ladder_report

        _, row = mutopia_table()
        sources = self.tmp / "tampered"
        ly = sources / row["ly"]["path"]
        ly.parent.mkdir(parents=True)
        ly.write_bytes(b"\\header { title = \"not the edition\" }\n")
        mismatched = build_mutopia_entry(self.tmp, sources)
        self.assertIsNone(mismatched.get("file"))
        self.assertEqual(stale_ladder_report(self.with_rag(mismatched), curriculum(SONGS)), [])
        from validate import ladder_report_findings

        errors, warnings = ladder_report_findings(self.with_rag(mismatched), curriculum(SONGS))
        self.assertEqual(errors, [])
        self.assertIn("PineappleRag.ly is not the pinned file (sha256 ", warnings[0])

    def test_nothing_to_set_aside_says_nothing(self) -> None:
        from validate import ladder_report_findings

        self.assertEqual(ladder_report_findings(self.committed, curriculum(SONGS)), ([], []))

    def test_a_report_written_without_the_fetch_matches_a_build_without_it_and_needs_no_warning(self) -> None:
        from validate import ladder_report_findings

        self.commit(self.with_rag(self.unfetched), curriculum(SONGS))
        self.assertEqual(ladder_report_findings(self.with_rag(self.unfetched), curriculum(SONGS)), ([], []))


class TestTheCataloguesOwnChanges(LadderCase):
    """Pins: each of these was an error before Q80 and still is."""

    def assertStale(self, catalog: list, cur: dict) -> list[str]:
        from validate import stale_ladder_report

        errors = stale_ladder_report(catalog, cur)
        self.assertEqual(len(errors), 1, errors)
        self.assertIn("is stale — the catalog has changed since it was written", errors[0])
        return errors

    def test_a_licence_the_gate_refuses_is_a_change(self) -> None:
        _, pinned = mutopia_table()
        sources = self.tmp / "non-commercial"
        ly_bytes = b'\\header {\n  license = "Creative Commons Attribution-NonCommercial 4.0"\n}\n'
        midi_bytes = b"MThd"
        row = copy.deepcopy(pinned)
        for part, data in (("ly", ly_bytes), ("midi", midi_bytes)):
            path = sources / row[part]["path"]
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
            row[part]["sha256"] = hashlib.sha256(data).hexdigest()
        refused = build_mutopia_entry(self.tmp, sources, row)
        self.assertIsNone(refused.get("file"))
        self.assertIn("the edition states", refused["importHint"])
        self.assertStale(self.with_rag(refused), curriculum(SONGS))

    def test_a_kern_licence_placeholder_is_a_change(self) -> None:
        import import_kern

        catalog = [
            dict(entry, file=None, importHint=import_kern.IMPORT_HINT.format(repo="joplin"), tags=["kern", "import-only"])
            if entry["id"] == "song.ragtime.one" else entry
            for entry in self.committed
        ]
        self.assertStale(catalog, curriculum(SONGS))

    def test_a_song_added_to_the_rung_is_a_change(self) -> None:
        self.assertStale(self.committed + [song("song.ragtime.three", 7.2)], curriculum(SONGS + ["song.ragtime.three"]))

    def test_the_strict_flavours_licence_placeholders_compare_as_the_owners_build(self) -> None:
        """`ladder_report.shippable` reads a personal-only tag as not shipped, so one report serves both flavours."""
        import import_kern
        from validate import stale_ladder_report

        personal = song("song.ragtime.one", 7.0, tags=["kern", "joplin", "nc-personal-build"],
                        source={"name": "test", "license": "CC BY-NC-SA 4.0", "pd_region": "worldwide"})
        self.committed = [personal if entry["id"] == "song.ragtime.one" else entry for entry in self.committed]
        self.commit(self.committed, curriculum(SONGS))
        strict = dict(personal, file=None, importHint=import_kern.IMPORT_HINT.format(repo="joplin"),
                      tags=["kern", "joplin", "import-only"])
        catalog = [strict if entry["id"] == "song.ragtime.one" else entry for entry in self.committed]
        self.assertEqual(stale_ladder_report(catalog, curriculum(SONGS)), [])


class TestAChangeBesideAFetchFailure(LadderCase):
    def test_a_song_added_beside_an_unfetched_edition_is_still_an_error(self) -> None:
        from validate import stale_ladder_report

        catalog = self.with_rag(self.unfetched) + [song("song.ragtime.three", 7.2)]
        errors = stale_ladder_report(catalog, curriculum(SONGS + ["song.ragtime.three"]))
        self.assertEqual(len(errors), 1, errors)
        self.assertIn("is stale — the catalog has changed since it was written", errors[0])

    def test_that_error_names_what_it_set_aside(self) -> None:
        from validate import stale_ladder_report

        catalog = self.with_rag(self.unfetched) + [song("song.ragtime.three", 7.2)]
        errors = stale_ladder_report(catalog, curriculum(SONGS + ["song.ragtime.three"]))
        self.assertIn(f"{RAG} (the edition's .ly file was not fetched)", errors[0])
        self.assertIn("a build that fetched", errors[0])


if __name__ == "__main__":  # pragma: no cover
    unittest.main()
