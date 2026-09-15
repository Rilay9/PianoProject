"""
One rule from the 2026-09-14 content review, held by the validator.

A core-path rung may not reach more than `CORE_SONG_REACH` above its stage for
a song. Bossa novas sat on "First chords" before this, and nothing said so.
(A second rule, that no song may sit on no rung, lived here for a day and was
withdrawn: it made rungs into dumps — handoff §5aj.)
"""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from validate import CORE_REACH_PLAN, CORE_SONG_REACH, core_reach_errors  # noqa: E402


def curriculum(track: str, stage: int, songs: list[str]) -> dict:
    return {
        "tracks": [{"id": track}],
        "stages": [
            {
                "number": stage,
                "units": [
                    {
                        "id": f"{track}.{stage}",
                        "track": track,
                        "lessons": [{"id": f"{stage}.1", "songOptions": songs}],
                    }
                ],
            }
        ],
    }


CATALOG = [
    {"id": "song.easy", "type": "song", "level": 2.3},
    {"id": "song.far", "type": "song", "level": 2 + CORE_SONG_REACH + 0.5},
    {"id": "song.placeholder", "type": "song", "level": 4.2, "tags": ["import-only"]},
    {"id": "song.easy.full", "type": "song", "level": 2 + CORE_SONG_REACH + 1.0, "variantOf": "song.easy"},
    {"id": "song.easy.alt", "type": "song", "level": 2 + CORE_SONG_REACH + 1.0, "variantOf": "song.easy.full"},
    {"id": "exercise.scale", "type": "exercise", "level": 3.0},
]


class TestCoreReach(unittest.TestCase):
    def test_a_song_within_reach_of_its_stage_passes(self) -> None:
        self.assertEqual(core_reach_errors(curriculum("core", 2, ["song.easy"]), CATALOG), [])

    def test_a_song_too_far_above_a_core_stage_is_named(self) -> None:
        errors = core_reach_errors(curriculum("core", 2, ["song.far"]), CATALOG)
        self.assertEqual(len(errors), 1)
        self.assertIn("song.far", errors[0])
        self.assertIn("Stage 2", errors[0])

    def test_a_track_rung_may_reach_as_far_as_it_likes(self) -> None:
        self.assertEqual(core_reach_errors(curriculum("classical", 2, ["song.far"]), CATALOG), [])

    def test_stage_zero_is_exempt(self) -> None:
        self.assertEqual(core_reach_errors(curriculum("core", 0, ["song.far"]), CATALOG), [])

    def test_a_far_arrangement_beside_its_own_simple_version_passes(self) -> None:
        # The full and the alternate are variants (one link deep and two) of the
        # simple one on the same rung; both may stand beside it.
        rung = curriculum("core", 2, ["song.easy", "song.easy.full", "song.easy.alt"])
        self.assertEqual(core_reach_errors(rung, CATALOG), [])

    def test_a_far_arrangement_alone_is_still_named(self) -> None:
        errors = core_reach_errors(curriculum("core", 2, ["song.easy.full"]), CATALOG)
        self.assertEqual(len(errors), 1)

    def test_the_plan_list_names_real_songs_on_real_rungs(self) -> None:
        # The exemptions are placements, so a row that names a song or a rung
        # that no longer exists is a stale exemption, not a harmless one.
        from pathlib import Path
        import json
        root = Path(__file__).resolve().parents[3]
        catalog = json.loads((root / "app/public/content/catalog.json").read_text(encoding="utf-8"))
        items = catalog["items"] if isinstance(catalog, dict) else catalog
        ids = {item["id"] for item in items}
        lessons: dict[str, list[str]] = {}
        for path in sorted((root / "content/curriculum").glob("stage-*.json")):
            for stage in json.loads(path.read_text(encoding="utf-8")).get("stages", []):
                for unit in stage.get("units", []):
                    for lesson in unit.get("lessons", []):
                        lessons[lesson["id"]] = lesson.get("songOptions", [])
        for lesson_id, song in sorted(CORE_REACH_PLAN):
            self.assertIn(song, ids, song)
            self.assertIn(song, lessons.get(lesson_id, []), f"{song} is not on {lesson_id}")


if __name__ == "__main__":
    unittest.main()
