"""
`add_technique_units.py` must not take anything away.

It is a bootstrap tool: it brought the five technique rungs into being and is
not part of the build or of CI, so it runs only when somebody runs it — which
is exactly the shape of tool that is safe to trust and dangerous to be wrong.

Its docstring promised idempotence and it did not have it. `units[existing] =
unit` replaced the whole unit, so every field added to those rungs after the
first run was deleted by the second: `levelBand` and `finder` on all five,
131 lines, while the tool printed "updated" five times and exited zero. And
`representative` chooses by level band alone, so once the catalog grew past the
first run it swapped technique.5's mordent, crescendo and tied-across-the-bar
exercises — the three that rung's lesson is written about — for a montuno, a
ii-V-I and a boogie, each of them in band and none of them technique.

Both of those are the same fault in two places: the tool knows how to make a
rung and does not know what is on one. These tests hold it to that.
"""
from __future__ import annotations

import copy
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from add_technique_units import UNITS, build_unit, merge_unit  # noqa: E402
from common import CONTENT_SRC, read_json  # noqa: E402

CURRICULUM = CONTENT_SRC / "curriculum"


def technique_units() -> dict[int, dict]:
    """Every technique unit as the curriculum has it now."""
    found = {}
    for stage in sorted(UNITS):
        data = read_json(CURRICULUM / f"stage-{stage}.json")
        for unit in data["stages"][0]["units"]:
            if unit["id"] == UNITS[stage]["id"]:
                found[stage] = unit
    return found


class TestMergeKeepsWhatItDoesNotOwn(unittest.TestCase):
    def test_a_field_the_tool_never_writes_survives(self) -> None:
        existing = {
            "id": "technique.9.1",
            "title": "old title",
            "lessons": [{"id": "technique.9", "exerciseOptions": ["a"], "levelBand": [9.0, 9.1],
                         "finder": {"skill": "written by a person"}}],
        }
        built = {
            "id": "technique.9.1",
            "title": "new title",
            "lessons": [{"id": "technique.9", "exerciseOptions": ["b"], "concepts": ["x"]}],
        }
        merged = merge_unit(existing, built)
        lesson = merged["lessons"][0]
        self.assertEqual(merged["title"], "new title", "the tool owns the title")
        self.assertEqual(lesson["concepts"], ["x"], "the tool owns the concepts")
        self.assertEqual(lesson["levelBand"], [9.0, 9.1], "levelBand is not the tool's to delete")
        self.assertEqual(lesson["finder"], {"skill": "written by a person"})

    def test_a_rung_that_already_names_its_exercises_keeps_them(self) -> None:
        existing = {"id": "u", "lessons": [{"id": "l", "exerciseOptions": ["chosen.by.hand"]}]}
        built = {"id": "u", "lessons": [{"id": "l", "exerciseOptions": ["picked.by.level"]}]}
        self.assertEqual(
            merge_unit(existing, built)["lessons"][0]["exerciseOptions"],
            ["chosen.by.hand"],
        )

    def test_a_rung_with_no_exercises_yet_gets_them(self) -> None:
        existing = {"id": "u", "lessons": [{"id": "l", "exerciseOptions": []}]}
        built = {"id": "u", "lessons": [{"id": "l", "exerciseOptions": ["picked.by.level"]}]}
        self.assertEqual(
            merge_unit(existing, built)["lessons"][0]["exerciseOptions"],
            ["picked.by.level"],
        )


class TestAgainstTheCurriculumAsItStands(unittest.TestCase):
    """The real files, not a fixture: this is the run that did the damage."""

    def setUp(self) -> None:
        catalog_path = Path("build") / "catalog.generated.json"
        if not catalog_path.is_file():
            self.skipTest("no generated catalog; run tools/content/build.py")
        self.catalog = read_json(catalog_path)
        self.units = technique_units()
        self.assertEqual(len(self.units), len(UNITS), "not every technique unit was found")

    def test_running_it_again_changes_nothing(self) -> None:
        for stage, unit in self.units.items():
            before = copy.deepcopy(unit)
            after = merge_unit(unit, build_unit(stage, self.catalog))
            self.assertEqual(after, before, f"stage {stage}: a second run would change the rung")

    def test_every_technique_rung_still_has_its_band_and_its_finder(self) -> None:
        for stage, unit in self.units.items():
            lesson = unit["lessons"][0]
            self.assertTrue(lesson.get("levelBand"), f"stage {stage}: no levelBand")
            self.assertTrue(lesson.get("finder"), f"stage {stage}: no finder")

    def test_every_rung_says_how_long_it_takes(self) -> None:
        # 81 of the 86 rungs carried `estimatedDays` and these five did not, so
        # the plan screen — which prints "~N days" beside every rung that has
        # one — showed a blank for the whole technique ladder and nowhere else.
        from add_technique_units import DAYS_PER_STAGE

        for stage, unit in self.units.items():
            lesson = unit["lessons"][0]
            self.assertEqual(
                lesson.get("estimatedDays"), DAYS_PER_STAGE[stage],
                f"technique.{stage} does not carry its stage's estimate",
            )

    def test_the_ladder_is_chained(self) -> None:
        # Every other multi-rung track in the curriculum chains each rung to the
        # one below it; this one had no prerequisites at all, because the tool
        # that built it never wrote the field.
        stages = sorted(UNITS)
        for earlier, later in zip(stages, stages[1:]):
            lesson = self.units[later]["lessons"][0]
            self.assertEqual(
                lesson.get("prerequisites"), [f"technique.{earlier}"],
                f"technique.{later} does not require technique.{earlier}",
            )
        first = self.units[stages[0]]["lessons"][0]
        self.assertIsNone(first.get("prerequisites"), "the foot of the ladder needs no parent")


if __name__ == "__main__":
    unittest.main()
