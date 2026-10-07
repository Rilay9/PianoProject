"""
The validator's excerpt check (E1 item 2), beside the sections check: each rule on a fixture.

A row of `content/sources/excerpts.json` names a parent that exists and is a notated item with a
built file, a range inside its printed bars (1-based, the pickup as bar 1), a selection its staves
allow, targets the vocabulary has, a derived id no other row or item shares; a range across a
repeat sign is refused with the bars named; a row approved against parent bytes the parent no
longer has is warned as stale; a parent this build does not bundle is a warning, not an error.
Since E-tail: a built cut that does not establish a target its approval names is warned with the
count (E29), and a row merged under an older cutter is warned stale by cut version (E33).
"""
from __future__ import annotations

import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import excerpts as X  # noqa: E402
from validate import excerpt_findings  # noqa: E402

FIXTURE = Path(__file__).resolve().parent / "fixtures" / "excerpts" / "pickup-and-repeat.musicxml"
PARENT = "song.test.pickup-and-repeat"
ALL_DEMANDS = sorted(__import__("claims").load_vocabulary()[1])


class Fixture:
    """A parent on disk and the check run over rows of `excerpts.json` (shared by the classes below)."""

    def setUp(self) -> None:
        self.dir = Path(tempfile.mkdtemp(prefix="validate-excerpts-"))
        self.addCleanup(lambda: shutil.rmtree(self.dir, ignore_errors=True))
        (self.dir / "scores").mkdir()
        shutil.copyfile(FIXTURE, self.dir / "scores" / "parent.musicxml")
        self.sha = X.sha256_of(self.dir / "scores" / "parent.musicxml")
        self.parent = {"id": PARENT, "type": "song", "title": "Pickup and repeat", "file": "scores/parent.musicxml",
                       "notation": {"bars": 5, "staves": 2}, "tags": []}

    def check(self, rows: list[dict], catalog: list[dict] | None = None, built: bool = True) -> tuple[list[str], list[str]]:
        path = self.dir / "excerpts.json"
        path.write_text(json.dumps({"excerpts": rows, "rejected": []}), encoding="utf-8")
        items = list(catalog if catalog is not None else [self.parent])
        if built:
            for row in rows:
                if row.get("selection") not in X.SELECTIONS:
                    continue
                eid = X.excerpt_id(row["of"], row["fromBar"], row["toBar"], row["selection"])
                if not any(i["id"] == eid for i in items):
                    # A measured stand-in that establishes every demand, as a built cut is measured (E29 reads it).
                    items.append({"id": eid, "type": "excerpt", "excerptOf": row["of"], "title": eid, "demands": ALL_DEMANDS,
                                  "measurement": {"status": "measured", "definitions": 3, "located": {d: 8 for d in ALL_DEMANDS},
                                                  "bars": 2, "steps": 8, "notes": 8, "established": ALL_DEMANDS}})
        return excerpt_findings(items, self.dir, path)

    def row(self, **over) -> dict:
        # Merged under the cutter in force (E33): a row with no `cutVersion` is stale by cut version.
        made = {"of": PARENT, "fromBar": 4, "toBar": 5, "selection": "both", "targets": ["interval.leap"],
                "label": "", "note": "", "parentSha256": self.sha, "event": "ex-test-1", "by": "a test", "at": "2026-09-28T00:00:00.000Z",
                "cutVersion": X.CUT_VERSION}
        made.update(over)
        return made


class TheExcerptCheck(Fixture, unittest.TestCase):
    def test_a_clean_row_passes(self) -> None:
        self.assertEqual(self.check([self.row()]), ([], []))

    def test_the_parent_must_exist(self) -> None:
        errors, _ = self.check([self.row(of="song.not-there")])
        self.assertTrue(any("its parent 'song.not-there' is not in the catalogue" in e for e in errors), errors)

    def test_the_parent_must_be_a_notated_item_with_a_built_file(self) -> None:
        drill = {"id": "drill.runtime", "type": "drill", "title": "A drill", "file": None, "drill": {"kind": "rhythm"}}
        errors, _ = self.check([self.row(of="drill.runtime")], [self.parent, drill])
        self.assertTrue(any("is not a notated item with a built file" in e for e in errors), errors)

    def test_a_parent_this_build_does_not_bundle_is_a_warning_not_an_error(self) -> None:
        placeholder = {**self.parent, "file": None, "tags": ["personal-build"]}
        errors, warnings = self.check([self.row()], [placeholder], built=False)
        self.assertEqual(errors, [])
        self.assertTrue(any("not cut in this build" in w for w in warnings), warnings)

    def test_the_range_lies_inside_the_printed_bars(self) -> None:
        errors, _ = self.check([self.row(fromBar=4, toBar=6)])
        self.assertTrue(any("are not inside the parent's 5 printed bar(s)" in e for e in errors), errors)

    def test_the_selection_is_valid_for_the_parents_staves(self) -> None:
        errors, _ = self.check([self.row(selection="middle")])
        self.assertTrue(any("selection 'middle' is not one of" in e for e in errors), errors)
        one_staff = {**self.parent, "notation": {"bars": 5, "staves": 1}}
        errors, _ = self.check([self.row(selection="right")], [one_staff])
        self.assertTrue(any("no second hand" in e for e in errors), errors)

    def test_the_targets_exist(self) -> None:
        errors, _ = self.check([self.row(targets=["interval.giant-leap"])])
        self.assertTrue(any("target 'interval.giant-leap' is not a vocabulary skill or demand" in e for e in errors), errors)
        errors, _ = self.check([self.row(targets=[])])
        self.assertTrue(any("no target" in e for e in errors), errors)
        self.assertEqual(self.check([self.row(targets=["syncopation", "rhythm.eighths"])])[0], [])

    def test_no_two_rows_share_parent_range_and_selection(self) -> None:
        errors, _ = self.check([self.row(), self.row(event="ex-test-2", label="Another name")])
        self.assertTrue(any("the same parent, bars and selection as row 1" in e for e in errors), errors)
        # The other hand is another excerpt.
        self.assertEqual(self.check([self.row(), self.row(event="ex-test-2", selection="left")])[0], [])

    def test_a_range_across_a_repeat_sign_is_refused_with_the_bars_named(self) -> None:
        errors, _ = self.check([self.row(fromBar=1, toBar=3)])
        self.assertTrue(any("bars 1–3: a repeat sign opens bar 2" in e for e in errors), errors)
        # The repeated section itself: the repeat signs are its edges.
        self.assertEqual(self.check([self.row(fromBar=2, toBar=3)])[0], [])

    def test_a_row_approved_on_other_parent_bytes_is_warned_stale(self) -> None:
        errors, warnings = self.check([self.row(parentSha256="0" * 64)])
        self.assertEqual(errors, [])
        self.assertTrue(any("stale by provenance" in w and "b4-5" in w for w in warnings), warnings)

    def test_the_build_made_an_item_for_every_row_and_no_other(self) -> None:
        errors, _ = self.check([self.row()], built=False)
        self.assertTrue(any("the build made no item for it" in e for e in errors), errors)
        stray = {"id": "excerpt.test.stray.b1-2", "type": "excerpt", "excerptOf": PARENT, "title": "stray"}
        errors, _ = self.check([self.row()], [self.parent, stray])
        self.assertTrue(any("excerpt.test.stray.b1-2: an excerpt with no approved row" in e for e in errors), errors)


class TheTargetCheck(Fixture, unittest.TestCase):
    """
    E29: a built excerpt whose measured `established` set lacks a target its approval names is warned,
    naming the cut, the target and the count — the approval's claim is not what the passage carries.
    Read with the rung-claims report's one reading of "establishes" (`claims.status_of`): a skill target
    by the demands it stands for, a demand target by itself.
    """

    def measured(self, located: dict[str, int], established: list[str], bars: int = 2) -> dict:
        return {"status": "measured", "definitions": 3, "located": located, "bars": bars, "steps": 8, "notes": 8,
                "established": established}

    def built(self, row: dict, measurement: dict) -> list[dict]:
        eid = X.excerpt_id(row["of"], row["fromBar"], row["toBar"], row["selection"])
        return [self.parent, {"id": eid, "type": "excerpt", "excerptOf": row["of"], "title": eid,
                              "demands": sorted(measurement.get("located") or {}), "measurement": measurement}]

    def test_a_cut_approved_for_a_target_its_notes_do_not_establish_is_warned_with_the_count(self) -> None:
        row = self.row(targets=["interval.leap"])
        errors, warnings = self.check([row], self.built(row, self.measured({"interval.leap": 1, "interval.step": 6}, ["interval.step"])))
        self.assertEqual(errors, [])
        named = [w for w in warnings if "does not establish" in w]
        self.assertEqual(len(named), 1, warnings)
        self.assertIn("excerpt.test.pickup-and-repeat.b4-5", named[0])
        self.assertIn("interval.leap", named[0])
        self.assertIn("1 located in 2 bar(s)", named[0])

    def test_a_cut_that_establishes_its_target_is_not_warned(self) -> None:
        row = self.row(targets=["interval.leap"])
        self.assertEqual(self.check([row], self.built(row, self.measured({"interval.leap": 4}, ["interval.leap"]))), ([], []))

    def test_a_skill_target_is_read_by_the_demand_it_stands_for(self) -> None:
        row = self.row(targets=["syncopation"])
        self.assertEqual(self.check([row], self.built(row, self.measured({"rhythm.syncopation": 5}, ["rhythm.syncopation"]))), ([], []))
        _, warnings = self.check([row], self.built(row, self.measured({"rhythm.syncopation": 1}, [])))
        named = [w for w in warnings if "does not establish" in w]
        self.assertEqual(len(named), 1, warnings)
        self.assertIn("syncopation (rhythm.syncopation: 1 located in 2 bar(s))", named[0])

    def test_a_target_absent_from_the_cut_is_warned_with_none_located(self) -> None:
        row = self.row(targets=["pitch.chromatic"])
        _, warnings = self.check([row], self.built(row, self.measured({"interval.step": 6}, ["interval.step"])))
        self.assertTrue(any("pitch.chromatic" in w and "0 located in 2 bar(s)" in w for w in warnings), warnings)

    def test_an_unmeasured_cut_is_warned_that_its_targets_cannot_be_checked(self) -> None:
        row = self.row(targets=["interval.leap"])
        _, warnings = self.check([row], self.built(row, {"status": "unmeasured", "reason": "no notes"}))
        self.assertTrue(any("is not measured" in w and "interval.leap" in w for w in warnings), warnings)

    def test_the_approved_cuts_on_the_build_each_establish_their_targets(self) -> None:
        """The five approved cuts: none warned by this check (the stale warnings are the cut version's, E33)."""
        from validate import load

        content = Path(__file__).resolve().parents[3] / "app" / "public" / "content"
        if not (content / "catalog.json").is_file():
            self.skipTest("no built catalogue")
        catalog = load(content / "catalog.json")
        if not any(item.get("type") == "excerpt" for item in catalog):
            self.skipTest("no excerpt in the built catalogue")
        _, warnings = excerpt_findings(catalog, content)
        self.assertEqual([w for w in warnings if "does not establish" in w or "is not measured" in w], [])


class TheCutVersionCheck(Fixture, unittest.TestCase):
    """E33: an approval merged under an older cutter is stale by cut version, warned with the row named."""

    def test_a_row_merged_before_the_cutter_moved_is_warned_stale_by_cut_version(self) -> None:
        before_e33 = {k: v for k, v in self.row().items() if k != "cutVersion"}
        errors, warnings = self.check([before_e33])
        self.assertEqual(errors, [])
        self.assertTrue(any("stale by cut version" in w and "b4-5" in w and "version 1" in w for w in warnings), warnings)
        self.assertEqual(self.check([self.row()]), ([], []))


class TheLicence(unittest.TestCase):
    """
    A cut carries its parent's attribution and licence tags (`excerpts.entry_for`), so the catalogue's
    own licence check refuses it where it refuses the parent: a CC BY-NC edition under a strict build,
    a personal-build parent's cut in a strict build; the personal build bundles both.
    """

    def rows(self, licence: str, tags: list[str]) -> list[dict]:
        directory = Path(tempfile.mkdtemp(prefix="validate-excerpt-licence-"))
        self.addCleanup(lambda: shutil.rmtree(directory, ignore_errors=True))
        (directory / "scores" / "excerpts").mkdir(parents=True)
        shutil.copyfile(FIXTURE, directory / "scores" / "parent.musicxml")
        shutil.copyfile(FIXTURE, directory / "scores" / "excerpts" / "cut.musicxml")
        self.dir = directory
        parent = {"id": PARENT, "type": "song", "title": "Pickup and repeat", "file": "scores/parent.musicxml",
                  "source": {"name": "an edition", "license": licence}, "tags": tags, "tracks": ["core"], "level": 2}
        made = X.Cut(path=directory / "scores" / "excerpts" / "cut.musicxml", bars=2, staves=2, notes=4,
                     tempo_bpm=96.0, time="3/4", level=1.5)
        row = {"of": PARENT, "fromBar": 4, "toBar": 5, "selection": "both", "targets": ["interval.leap"]}
        return [parent, X.entry_for(row, parent, made, "scores/excerpts/cut.musicxml")]

    def refused(self, catalog: list[dict], strict: bool, allow_nc: bool = False) -> set[str]:
        from validate import validate_catalog

        errors = validate_catalog(catalog, self.dir, strict, allow_nc=allow_nc)
        return {item["id"] for item in catalog
                if any(e.startswith(f"{item['id']}: licence") or e.startswith(f"{item['id']}: tagged") for e in errors)}

    def test_a_personal_build_parents_cut_is_refused_in_a_strict_build_with_it(self) -> None:
        catalog = self.rows("Public Domain", ["personal-build"])
        self.assertEqual(self.refused(catalog, strict=True), {item["id"] for item in catalog})
        self.assertEqual(self.refused(catalog, strict=False), set())

    def test_a_cc_by_nc_editions_cut_is_refused_in_a_strict_build_with_it(self) -> None:
        catalog = self.rows("CC BY-NC 4.0", [])
        self.assertEqual(self.refused(catalog, strict=True), {item["id"] for item in catalog})


if __name__ == "__main__":
    unittest.main()
