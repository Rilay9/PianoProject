"""A rung's tools open something the rung has (`validate.py` `tool_errors`)."""
from __future__ import annotations

import unittest

from tools.content.validate import tool_errors


def curriculum(tool: dict, songs: list[str], exercises: list[str]) -> dict:
    lesson = {"id": "blues.3", "tools": [tool], "songOptions": songs, "exerciseOptions": exercises}
    return {"stages": [{"units": [{"lessons": [lesson]}]}]}


SIMON = "drill.ear.simon-blues-c"


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

    def test_a_duet_still_needs_its_item_among_the_songs(self) -> None:
        # The change for Simon must not let a duet open an exercise.
        errors = tool_errors(curriculum({"kind": "duet", "item": "exercise.y"}, ["song.x"], ["exercise.y"]))
        self.assertEqual(len(errors), 1)
        self.assertIn("song options", errors[0])


if __name__ == "__main__":
    unittest.main()
