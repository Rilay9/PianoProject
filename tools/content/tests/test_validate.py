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
            "minAccuracy": 0.9,
            "minTempoPct": 0.8,
        },
        "requirements": [
            {"kind": "runs", "from": "exercises", "count": 1},
            {"kind": "runs", "from": "songs", "count": 1},
        ],
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


class TestTitlesThatLostAByte(unittest.TestCase):
    """
    A letter that came apart on the way in, caught before a learner reads it.

    Three quarried rows shipped like this. Each held one or two ruined letters
    and was otherwise perfect, which is why nothing saw them: the quarry's
    `looks_garbled` wants a quarter of the characters to be high bytes and one
    bad letter in sixteen is six per cent, the result is valid NFC so a
    normalisation check passes it, and it round-trips through Latin-1 to an
    error rather than back to the original, so the usual repair test says
    "not mojibake".

    Position is what is left. A real accented capital opens a word.
    """

    def test_an_accented_capital_inside_a_word_is_an_error(self) -> None:
        # "Petit Papa Noël", whose ë arrived as a bare Ì.
        catalog = [item("song.a", title="Petit Papa Noe\u00ccl")]
        errors = validate_catalog(catalog, Path("."), strict_license=False)
        self.assertTrue(any("lost a byte" in e for e in errors), errors)

    def test_it_checks_the_people_as_well_as_the_piece(self) -> None:
        catalog = [item("song.a", composer="Anton\u00cdn Dvo\u0159\u00e1k")]
        errors = validate_catalog(catalog, Path("."), strict_license=False)
        self.assertTrue(any("composer" in e for e in errors), errors)

    def test_an_accented_capital_that_opens_a_word_is_a_name(self) -> None:
        # Every one of these is a real title or a real person, and none may
        # cost a build. The rule is about position, not about the alphabet.
        for good in (
            "\u00c1nh tr\u0103ng n\u00f3i h\u1ed9 l\u00f2ng t\u00f4i",
            "\u00dcbung f\u00fcr die linke Hand",
            "\u00c9cole moderne",
            "Fikrimin ince g\u00fcl\u00fc - piyano notlar\u0131",
            "Ma m\u00e8re l'Oye",
            "Antonin Dvo\u0159\u00e1k",
            "3 \u00d7 4 against 2",
        ):
            catalog = [item("song.a", title=good)]
            errors = validate_catalog(catalog, Path("."), strict_license=False)
            self.assertEqual(errors, [], f"{good!r} is a real title and was rejected")


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
        # Revised (C5): a rung whose requirements ask for no song run, where it
        # was one whose `mastery.songsRequired` was 0.
        thin = lesson("1.1", THREE_EX, [])
        thin["requirements"] = [{"kind": "runs", "from": "exercises", "count": 1}]
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
