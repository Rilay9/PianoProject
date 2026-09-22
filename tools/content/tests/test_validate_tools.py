"""A rung's tools open something the rung has (`validate.py` `tool_errors`)."""
from __future__ import annotations

import unittest

from tools.content.validate import tool_errors


def curriculum(tool: dict, songs: list[str], exercises: list[str]) -> dict:
    lesson = {"id": "blues.3", "tools": [tool], "songOptions": songs, "exerciseOptions": exercises}
    return {"stages": [{"units": [{"lessons": [lesson]}]}]}


SIMON = "drill.ear.simon-blues-c"
CATALOG = [
    {"id": "song.x", "file": "scores/authored/song.x.mxl"},
    {"id": "exercise.y", "file": "scores/generated/exercise.y.mxl"},
    {"id": "drill.z", "file": None},
]


class TestToolItems(unittest.TestCase):
    def test_a_simon_tool_may_name_a_drill_the_rung_offers_as_an_exercise(self) -> None:
        # The blues rungs name the Simon seeded from the blues scale. A rung
        # offers drills as exercises, so that is where the item has to be.
        errors = tool_errors(curriculum({"kind": "simon", "item": SIMON}, ["song.x"], [SIMON]))
        self.assertEqual(errors, [])

    def test_a_simon_tool_naming_a_drill_the_rung_does_not_offer_is_refused(self) -> None:
        errors = tool_errors(curriculum({"kind": "simon", "item": SIMON}, ["song.x"], ["exercise.y"]))
        self.assertEqual(len(errors), 1)
        self.assertIn("exercise options", errors[0])

    def test_a_duet_may_name_an_exercise_the_rung_offers(self) -> None:
        """Widened 2026-09-22, and the narrow rule it replaces was tested here.

        The narrow rule said a `duet`'s item had to be among the rung's *song*
        options, and `technique.7` is the rung it was wrong about: its sentence
        is about the two-against-three exercise and its only songs are three
        Czerny études, so a duet button there opened a study instead of the
        thing the lesson is about (Entry 24 item 7 left it unbuilt for exactly
        this). The rule that matters — a lesson may not point outside its own
        options — is unchanged; what has gone is the assumption that only a
        song is notation.
        """
        errors = tool_errors(curriculum({"kind": "duet", "item": "exercise.y"}, ["song.x"], ["exercise.y"]))
        self.assertEqual(errors, [])

    def test_a_duet_naming_something_the_rung_does_not_offer_at_all_is_still_refused(self) -> None:
        errors = tool_errors(curriculum({"kind": "duet", "item": "exercise.q"}, ["song.x"], ["exercise.y"]))
        self.assertEqual(len(errors), 1)
        self.assertIn("this rung", errors[0])

    def test_a_duet_may_not_name_an_option_that_opens_as_a_drill(self) -> None:
        """The catalog is what says so, not the id.

        `4.3` leads with `drill.chord.inversions`, which the rung offers as an
        exercise and which has `file: null` — it opens the drill screen, and a
        duet against it would be a button that lands somewhere with no notes.
        The check reads `file` off the catalog row, because inferring it from
        the `drill.` prefix is the inference `00` §1a forbids.
        """
        errors = tool_errors(
            curriculum({"kind": "duet", "item": "drill.z"}, ["song.x"], ["drill.z"]), CATALOG
        )
        self.assertEqual(len(errors), 1)
        self.assertIn("no notation", errors[0])

    def test_the_catalog_check_passes_an_exercise_that_has_a_file(self) -> None:
        errors = tool_errors(
            curriculum({"kind": "duet", "item": "exercise.y"}, ["song.x"], ["exercise.y"]), CATALOG
        )
        self.assertEqual(errors, [])


class TestLabUnlockAndMode(unittest.TestCase):
    """`unlock` and `mode` on a lab tool entry (T16; Entry 24 item 5, Entry 30 item 5)."""

    def test_a_lab_may_free_a_control_its_preset_locks(self) -> None:
        errors = tool_errors(
            curriculum(
                {"kind": "lab", "preset": "ballad", "unlock": ["progression"]}, ["song.x"], []
            )
        )
        self.assertEqual(errors, [])

    def test_freeing_a_control_the_preset_does_not_lock_is_refused(self) -> None:
        # Not a harmless no-op: it reads as "this rung frees the tempo" and the
        # tempo was never locked, so the lesson would describe a button that
        # does nothing in particular.
        errors = tool_errors(
            curriculum({"kind": "lab", "preset": "ballad", "unlock": ["bars"]}, ["song.x"], [])
        )
        self.assertEqual(len(errors), 1)
        self.assertIn("does not lock", errors[0])

    def test_unlock_with_no_preset_is_refused(self) -> None:
        # A lab with no preset locks nothing, so there is nothing to free.
        errors = tool_errors(curriculum({"kind": "lab", "unlock": ["progression"]}, ["song.x"], []))
        self.assertEqual(len(errors), 1)
        self.assertIn("no preset", errors[0])

    def test_a_lab_may_preselect_one_of_the_three_ways_round(self) -> None:
        for mode in ("off", "hold", "tune"):
            with self.subTest(mode):
                errors = tool_errors(
                    curriculum(
                        {"kind": "lab", "preset": "blues-shuffle", "mode": mode}, ["song.x"], []
                    )
                )
                self.assertEqual(errors, [])

    def test_a_mode_the_lab_does_not_have_is_refused(self) -> None:
        errors = tool_errors(
            curriculum({"kind": "lab", "preset": "blues-shuffle", "mode": "comp"}, ["song.x"], [])
        )
        self.assertEqual(len(errors), 1)
        self.assertIn("ways round", errors[0])

    def test_neither_field_belongs_on_a_tool_that_is_not_the_lab(self) -> None:
        for field, value in (("unlock", ["progression"]), ("mode", "tune")):
            with self.subTest(field):
                errors = tool_errors(curriculum({"kind": "duet", field: value}, ["song.x"], []))
                self.assertEqual(len(errors), 1)
                self.assertIn("only a 'lab'", errors[0])


if __name__ == "__main__":
    unittest.main()
