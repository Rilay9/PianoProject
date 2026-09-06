"""
The checks P11 added to validate.py: one track list, orphans, estimated levels.

Kept in their own file rather than folded into test_validate.py so the reason
each exists stays next to it — these are the replan's §1.8, §7.5 and §1.4
respectively, and each replaces something that used to be untested or
unstated.
"""
from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from common import load_item_labels, load_tracks  # noqa: E402
from validate import (  # noqa: E402
    estimated_by_stage,
    orphan_exercises,
    validate_tracks,
)

REPO_ROOT = Path(__file__).resolve().parents[3]
TRACKS_FILE = REPO_ROOT / "content" / "curriculum" / "00-tracks.json"


def item(item_id: str, **overrides) -> dict:
    base = {
        "id": item_id,
        "type": "exercise",
        "title": item_id,
        "level": 1.0,
        "levelSource": "judged",
        "hands": "both",
        "tracks": ["core"],
        "concepts": [],
    }
    base.update(overrides)
    return base


def curriculum(units: list[dict]) -> dict:
    return {"stages": [{"number": 1, "units": units}]}


def unit(unit_id: str, track: str, lessons: list[dict] | None = None) -> dict:
    return {"id": unit_id, "track": track, "lessons": lessons or []}


class TestTrackList(unittest.TestCase):
    """replan §1.8: one source of truth, and a made-up track fails."""

    def test_a_made_up_track_fails(self) -> None:
        errors = validate_tracks([item("exercise.a", tracks=["not-a-track"])], curriculum([]), ("core",))
        self.assertEqual(len(errors), 1)
        self.assertIn("not-a-track", errors[0])

    def test_a_made_up_unit_track_fails(self) -> None:
        errors = validate_tracks([], curriculum([unit("u1", "nope")]), ("core",))
        self.assertEqual(len(errors), 1)
        self.assertIn("nope", errors[0])

    def test_a_known_track_passes(self) -> None:
        self.assertEqual(
            validate_tracks([item("exercise.a", tracks=["core"])], curriculum([unit("u1", "core")]), ("core",)),
            [],
        )

    def test_an_item_label_is_allowed_on_an_item(self) -> None:
        self.assertEqual(
            validate_tracks([item("exercise.a", tracks=["technique"])], curriculum([]), ("core",), ("technique",)),
            [],
        )

    def test_an_item_label_is_not_allowed_on_a_unit(self) -> None:
        # A unit is a rung on a ladder; `technique` has no ladder, so a unit
        # claiming it would be a module the Plan screen could not draw.
        errors = validate_tracks([], curriculum([unit("u1", "technique")]), ("core",), ("technique",))
        self.assertEqual(len(errors), 1)
        self.assertIn("itemLabel", errors[0])

    def test_an_empty_track_file_is_itself_an_error(self) -> None:
        errors = validate_tracks([item("exercise.a")], curriculum([]), ())
        self.assertEqual(len(errors), 1)
        self.assertIn("defines no tracks", errors[0])


class TestRealTrackFile(unittest.TestCase):
    """The check above is only useful if it passes on what is actually shipped."""

    def test_every_track_the_repository_uses_is_defined(self) -> None:
        tracks = load_tracks(TRACKS_FILE)
        labels = load_item_labels(TRACKS_FILE)
        self.assertIn("core", tracks)
        # The two ids that drifted: used by content, defined nowhere, which is
        # what §1.8 was written about.
        self.assertIn("technique", labels)
        self.assertIn("film-game", labels)
        self.assertEqual(set(tracks) & set(labels), set())

    def test_the_static_catalog_only_uses_known_ids(self) -> None:
        static = json.loads(
            (REPO_ROOT / "content" / "catalog.static.json").read_text(encoding="utf-8")
        )
        errors = validate_tracks(static, {"stages": []}, load_tracks(TRACKS_FILE), load_item_labels(TRACKS_FILE))
        self.assertEqual(errors, [])


class TestOrphans(unittest.TestCase):
    """replan §7.5: an exercise no lesson and no concept reaches is invisible."""

    def test_an_exercise_named_by_a_lesson_is_not_an_orphan(self) -> None:
        lessons = [{"id": "l1", "exerciseOptions": ["exercise.a"], "songOptions": [], "concepts": []}]
        found = orphan_exercises([item("exercise.a")], curriculum([unit("u1", "core", lessons)]))
        self.assertEqual(found, [])

    def test_an_exercise_sharing_a_taught_concept_is_not_an_orphan(self) -> None:
        lessons = [{"id": "l1", "exerciseOptions": [], "songOptions": [], "concepts": ["scales"]}]
        found = orphan_exercises(
            [item("exercise.a", concepts=["scales"])], curriculum([unit("u1", "core", lessons)])
        )
        self.assertEqual(found, [])

    def test_an_unreachable_exercise_is_reported(self) -> None:
        lessons = [{"id": "l1", "exerciseOptions": [], "songOptions": [], "concepts": ["scales"]}]
        found = orphan_exercises(
            [item("exercise.a", concepts=["nothing-teaches-this"])],
            curriculum([unit("u1", "core", lessons)]),
        )
        self.assertEqual(found, ["exercise.a"])

    def test_songs_are_not_orphans(self) -> None:
        # Only exercises: a song reachable from nowhere is a library item, and
        # the Library is a legitimate way to reach it.
        found = orphan_exercises([item("song.a", type="song", concepts=["x"])], curriculum([]))
        self.assertEqual(found, [])


class TestEstimatedCounts(unittest.TestCase):
    """replan §1.4: print how much of the library's difficulty is a guess."""

    def test_counts_are_grouped_by_stage(self) -> None:
        catalog = [
            item("a", level=7.1, levelSource="estimated"),
            item("b", level=7.9, levelSource="judged"),
            item("c", level=8.0, levelSource="estimated"),
        ]
        self.assertEqual(estimated_by_stage(catalog), {7: (1, 2), 8: (1, 1)})

    def test_an_item_with_no_level_source_counts_as_judged(self) -> None:
        catalog = [item("a", level=3.0)]
        catalog[0].pop("levelSource")
        self.assertEqual(estimated_by_stage(catalog), {3: (0, 1)})


class TestCatalogItemRequiresLevelSource(unittest.TestCase):
    def test_a_writer_must_say_which(self) -> None:
        from common import SourceBlock, catalog_item

        with self.assertRaises(TypeError):
            catalog_item(  # type: ignore[call-arg]
                item_id="song.a",
                item_type="song",
                title="A",
                level=1.0,
                hands="both",
                tracks=["core"],
                concepts=[],
                source=SourceBlock(name="t", license="CC0-1.0"),
            )

    def test_a_nonsense_value_is_refused(self) -> None:
        from common import SourceBlock, catalog_item

        with self.assertRaises(ValueError):
            catalog_item(
                item_id="song.a",
                item_type="song",
                title="A",
                level=1.0,
                level_source="probably",
                hands="both",
                tracks=["core"],
                concepts=[],
                source=SourceBlock(name="t", license="CC0-1.0"),
            )

    def test_the_field_reaches_the_item(self) -> None:
        from common import SourceBlock, catalog_item

        made = catalog_item(
            item_id="song.a",
            item_type="song",
            title="A",
            level=1.0,
            level_source="estimated",
            hands="both",
            tracks=["core"],
            concepts=[],
            source=SourceBlock(name="t", license="CC0-1.0"),
        )
        self.assertEqual(made["levelSource"], "estimated")


class TestLoadTracks(unittest.TestCase):
    def test_a_missing_file_is_empty_not_a_crash(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            self.assertEqual(load_tracks(Path(tmp) / "nope.json"), ())
            self.assertEqual(load_item_labels(Path(tmp) / "nope.json"), ())


if __name__ == "__main__":  # pragma: no cover
    unittest.main()
