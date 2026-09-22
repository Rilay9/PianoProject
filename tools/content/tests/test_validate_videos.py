"""
The lesson-video check in validate.py, and the parser it rests on.

The fault: 80 lessons linked to a video and no link had ever been fetched, so a
dead one was indistinguishable from a good one everywhere in the repository.
`video_check.py` fetches them and writes `content/video-index.json`;
`validate.py` refuses a lesson URL that is not in that file with a live status
and a checked date, which is what makes a *new* link fail the build until
somebody has checked it once.

Nothing here touches the network. The fetch is `video_check.fetch`, which these
tests do not call — they are about the offline half, which is the half that runs
in the build.
"""
from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import video_check  # noqa: E402
from validate import video_index_errors  # noqa: E402

LIVE = {"title": "Crush notes for blues piano", "author": "Bill Hilton", "status": "live", "http": 200, "checked": "2026-09-22"}
URL = "https://www.youtube.com/watch?v=l3pKMdTM-rM"

LESSON = """---
title: "A rung"
stage: 3
unit: "blues-boogie.3.1"
videos:
  - label: "Crush notes for blues piano"
    url: "{url}"
    teacher: "Bill Hilton"
readingTime: 3
---

The body.
"""


class VideoParsing(unittest.TestCase):
    """`common.read_front_matter` reads a `- ` item as an indented pair, so the
    videos list needs its own reader; this is the test that says it does."""

    def test_reads_label_url_and_teacher_off_a_list_item(self) -> None:
        with TemporaryDirectory() as tmp:
            lessons = Path(tmp)
            (lessons / "blues.3.md").write_text(LESSON.format(url=URL), encoding="utf-8")
            self.assertEqual(
                video_check.lesson_videos(lessons),
                [("blues.3.md", [{"label": "Crush notes for blues piano", "url": URL, "teacher": "Bill Hilton"}])],
            )

    def test_a_lesson_with_an_empty_list_contributes_no_url(self) -> None:
        with TemporaryDirectory() as tmp:
            lessons = Path(tmp)
            (lessons / "0.4.md").write_text(
                LESSON.format(url=URL).replace(
                    'videos:\n  - label: "Crush notes for blues piano"\n    url: "%s"\n    teacher: "Bill Hilton"' % URL,
                    "videos: []",
                ),
                encoding="utf-8",
            )
            self.assertEqual(video_check.lesson_urls(lessons), {})


class VideoIndexCheck(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = TemporaryDirectory()
        self.dir = Path(self._tmp.name)
        self.lessons = self.dir / "lessons"
        self.lessons.mkdir()
        (self.lessons / "blues.3.md").write_text(LESSON.format(url=URL), encoding="utf-8")
        self.index = self.dir / "video-index.json"
        self.write_index({URL: dict(LIVE)})

    def tearDown(self) -> None:
        self._tmp.cleanup()

    def write_index(self, rows: dict) -> None:
        self.index.write_text(json.dumps(rows, indent=2), encoding="utf-8")

    def errors(self) -> list[str]:
        return video_index_errors(self.lessons, self.index)

    def test_a_checked_live_url_passes(self) -> None:
        self.assertEqual(self.errors(), [])

    def test_a_url_no_one_has_fetched_fails(self) -> None:
        # The one that matters: a link added by hand is refused until
        # video_check.py has been run over it.
        self.write_index({})
        errors = self.errors()
        self.assertEqual(len(errors), 1)
        self.assertIn("in no lesson video index", errors[0])
        self.assertIn("blues.3.md", errors[0])

    def test_a_dead_url_fails(self) -> None:
        self.write_index({URL: dict(LIVE, status="dead", http=404, title=None)})
        errors = self.errors()
        self.assertEqual(len(errors), 1)
        self.assertIn("'dead'", errors[0])
        self.assertIn("404", errors[0])

    def test_a_row_with_no_checked_date_fails(self) -> None:
        # A row written by hand, or half-written: live, and never actually asked.
        self.write_index({URL: dict(LIVE, checked="")})
        errors = self.errors()
        self.assertEqual(len(errors), 1)
        self.assertIn("no checked date", errors[0])

    def test_a_missing_index_names_the_command_that_writes_it(self) -> None:
        self.index.unlink()
        errors = self.errors()
        self.assertEqual(len(errors), 1)
        self.assertIn("video_check.py", errors[0])

    def test_an_empty_lesson_directory_is_an_error_not_a_pass(self) -> None:
        # Pointed at the wrong directory, the check would otherwise report
        # nothing wrong — an exit code standing in for the work being done.
        for path in self.lessons.glob("*.md"):
            path.unlink()
        self.assertEqual(len(self.errors()), 1)
        self.assertIn("never been empty", self.errors()[0])


if __name__ == "__main__":
    unittest.main()
