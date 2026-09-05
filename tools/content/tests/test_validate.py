"""
The cross-reference and option-count rules in validate.py.

The schema answers "is this the right shape?"; these are the questions it cannot ask.
The three-alternatives rule (docs/00 D21) is here rather than left to an author's
judgement because a thin rung looks exactly like a full one until a learner opens it and
has nothing to switch to.
"""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from validate import MIN_OPTIONS, validate_catalog, validate_curriculum  # noqa: E402


def item(item_id: str, **overrides) -> dict:
    base = {
        "id": item_id,
        "type": "exercise",
        "title": item_id,
        "level": 1.0,
        "hands": "both",
        "tracks": ["core"],
        "concepts": [],
        "file": None,
        "importHint": "bring your own",
        "source": {"name": "test", "license": "CC0-1.0", "pd_region": "worldwide"},
    }
    base.update(overrides)
    return base


def lesson(lesson_id: str, exercises: list[str], songs: list[str], **overrides) -> dict:
    base = {
        "id": lesson_id,
        "title": lesson_id,
        "concepts": [],
        "textFile": f"lessons/{lesson_id}.md",
        "exerciseOptions": exercises,
        "songOptions": songs,
        "mastery": {
            "exercisesRequired": 1,
            "songsRequired": 1,
            "minAccuracy": 0.9,
            "minTempoPct": 0.8,
        },
    }
    base.update(overrides)
    return base


def curriculum(*lessons: dict) -> dict:
    return {
        "version": 1,
        "tracks": [{"id": "core", "title": "Core", "description": "", "startsAtStage": 0}],
        "stages": [
            {
                "number": 1,
                "title": "Stage",
                "summary": "",
                "units": [{"id": "1.1", "title": "Unit", "track": "core", "lessons": list(lessons)}],
            }
        ],
    }


THREE_EX = ["exercise.a", "exercise.b", "exercise.c"]
THREE_SONGS = ["song.a", "song.b", "song.c"]
CATALOG = [item(i) for i in THREE_EX + THREE_SONGS]


class TestAlternativesReferences(unittest.TestCase):
    def test_an_alternative_that_does_not_exist_is_an_error(self) -> None:
        catalog = [item("song.a", alternatives=["song.nowhere"])]
        errors = validate_catalog(catalog, Path("."), strict_license=False)
        self.assertTrue(any("song.nowhere" in e for e in errors), errors)

    def test_an_alternative_that_exists_is_fine(self) -> None:
        catalog = [item("song.a", alternatives=["song.b"]), item("song.b")]
        self.assertEqual(validate_catalog(catalog, Path("."), strict_license=False), [])

    def test_an_item_may_not_be_its_own_alternative(self) -> None:
        catalog = [item("song.a", alternatives=["song.a"])]
        errors = validate_catalog(catalog, Path("."), strict_license=False)
        self.assertTrue(any("itself" in e for e in errors), errors)


class TestThreeAlternatives(unittest.TestCase):
    def test_a_full_lesson_passes(self) -> None:
        data = curriculum(lesson("1.1", THREE_EX, THREE_SONGS))
        self.assertEqual(validate_curriculum(data, CATALOG), [])

    def test_too_few_exercises_is_an_error(self) -> None:
        data = curriculum(lesson("1.1", THREE_EX[:2], THREE_SONGS))
        errors = validate_curriculum(data, CATALOG)
        self.assertTrue(any("exercise option" in e for e in errors), errors)

    def test_too_few_songs_is_an_error_and_names_the_way_out(self) -> None:
        data = curriculum(lesson("1.1", THREE_EX, THREE_SONGS[:1]))
        errors = validate_curriculum(data, CATALOG)
        self.assertTrue(any("song option" in e for e in errors), errors)
        self.assertTrue(any("songOptional" in e for e in errors), errors)

    def test_song_optional_counts_the_two_lists_together(self) -> None:
        data = curriculum(lesson("1.1", THREE_EX, [], songOptional=True))
        self.assertEqual(validate_curriculum(data, CATALOG), [])

    def test_song_optional_still_needs_three_exercises(self) -> None:
        data = curriculum(lesson("1.1", THREE_EX[:2], [], songOptional=True))
        errors = validate_curriculum(data, CATALOG)
        self.assertTrue(any("exercise option" in e for e in errors), errors)

    def test_a_lesson_that_needs_no_songs_is_not_asked_for_three(self) -> None:
        thin = lesson("1.1", THREE_EX, [])
        thin["mastery"]["songsRequired"] = 0
        self.assertEqual(validate_curriculum(curriculum(thin), CATALOG), [])

    def test_an_exempt_lesson_is_skipped_entirely(self) -> None:
        data = curriculum(lesson("0.4", ["exercise.a"], [], optionsExempt=True))
        self.assertEqual(validate_curriculum(data, CATALOG), [])

    def test_the_threshold_can_be_turned_off(self) -> None:
        data = curriculum(lesson("1.1", ["exercise.a"], ["song.a"]))
        self.assertEqual(validate_curriculum(data, CATALOG, min_options=0), [])

    def test_the_default_threshold_is_three(self) -> None:
        self.assertEqual(MIN_OPTIONS, 3)


class TestOptionReferences(unittest.TestCase):
    def test_an_option_that_is_not_in_the_catalog_is_an_error(self) -> None:
        data = curriculum(lesson("1.1", THREE_EX[:2] + ["exercise.nowhere"], THREE_SONGS))
        errors = validate_curriculum(data, CATALOG)
        self.assertTrue(any("exercise.nowhere" in e for e in errors), errors)

    def test_a_repeated_option_is_an_error(self) -> None:
        # Three options that are two options is the failure this rule exists to stop.
        data = curriculum(lesson("1.1", ["exercise.a", "exercise.b", "exercise.a"], THREE_SONGS))
        errors = validate_curriculum(data, CATALOG)
        self.assertTrue(any("repeats" in e for e in errors), errors)


if __name__ == "__main__":
    unittest.main()
