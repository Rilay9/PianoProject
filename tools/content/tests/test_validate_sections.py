"""
Named sections have to name bars the piece actually has (replan/`04` §5).

The rule matters because a section is a loop: `toMeasure` past the last bar
produces a loop that ends early and says nothing about it. What is tested
hardest here is not the arithmetic but where the bar count comes from — the
first version read it only out of `build/render-report.json`, which is written
by a later build step than the one that runs this check, so the rule vanished
on a clean checkout and took CI down with it. Both sources are exercised, and
so is having neither.
"""
from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from validate import printed_bars, section_errors  # noqa: E402

MISSING = Path("does-not-exist") / "render-report.json"


def item(*sections: tuple[str, int, int], item_id: str = "song.test", file: str | None = None) -> dict:
    made: dict = {
        "id": item_id,
        "teaching": {
            "sections": [
                {"label": label, "fromMeasure": low, "toMeasure": high}
                for label, low, high in sections
            ]
        },
    }
    if file is not None:
        made["file"] = file
    return made


def report(path: Path, **bars: int) -> Path:
    path.write_text(
        json.dumps({"items": [{"id": k, "sourceMeasures": v, "ok": True} for k, v in bars.items()]}),
        encoding="utf-8",
    )
    return path


def eight_bar_score(directory: Path, name: str = "eight.musicxml") -> str:
    """A real file for the fallback to read, written the way the pipeline writes one."""
    from music21 import note, stream

    part = stream.Part()
    for _ in range(8):
        measure = stream.Measure()
        measure.append(note.Note("C4", quarterLength=4.0))
        part.append(measure)
    score = stream.Score()
    score.append(part)
    score.write("musicxml", fp=str(directory / name))
    return name


class TestBounds(unittest.TestCase):
    """The arithmetic, with the count supplied so only the arithmetic is in play."""

    def check(self, *sections: tuple[str, int, int], bars: int = 8) -> list[str]:
        with tempfile.TemporaryDirectory() as tmp:
            path = report(Path(tmp) / "r.json", **{"song.test": bars})
            return section_errors([item(*sections)], Path(tmp), path)

    def test_a_section_inside_the_piece_is_fine(self) -> None:
        self.assertEqual(self.check(("First half", 1, 4), ("Second half", 5, 8)), [])

    def test_the_whole_piece_is_fine(self) -> None:
        self.assertEqual(self.check(("All of it", 1, 8)), [])

    def test_a_section_running_past_the_last_bar_is_caught(self) -> None:
        errors = self.check(("Too far", 5, 9))
        self.assertEqual(len(errors), 1)
        self.assertIn("runs to bar 9", errors[0])
        self.assertIn("8 printed bar(s)", errors[0])

    def test_bar_zero_is_caught_because_bars_are_one_based(self) -> None:
        # The mistake anyone porting from a measure index makes exactly once.
        errors = self.check(("Off by one", 0, 4))
        self.assertEqual(len(errors), 1)
        self.assertIn("1-based", errors[0])

    def test_a_backwards_section_is_caught(self) -> None:
        errors = self.check(("Backwards", 8, 3))
        self.assertEqual(len(errors), 1)
        self.assertIn("before it starts", errors[0])

    def test_every_bad_section_is_reported_not_just_the_first(self) -> None:
        errors = self.check(("A", 0, 4), ("B", 5, 99))
        self.assertEqual(len(errors), 2)

    def test_an_item_with_no_sections_is_not_looked_at(self) -> None:
        self.assertEqual(section_errors([{"id": "song.test"}], Path("."), MISSING), [])
        self.assertEqual(section_errors([], Path("."), MISSING), [])


class TestWhereTheCountComesFrom(unittest.TestCase):
    def test_the_file_answers_when_there_is_no_report(self) -> None:
        # The CI regression: validate runs before the render check, so on a
        # clean checkout there is no report at all and the rule still has to
        # hold.
        with tempfile.TemporaryDirectory() as tmp:
            name = eight_bar_score(Path(tmp))
            catalog = [item(("All of it", 1, 8), file=name)]
            self.assertEqual(section_errors(catalog, Path(tmp), MISSING), [])
            over = [item(("Too far", 1, 9), file=name)]
            self.assertIn("8 printed bar(s)", section_errors(over, Path(tmp), MISSING)[0])

    def test_the_file_answers_for_an_item_the_report_does_not_mention(self) -> None:
        # A report from before the item existed is the same situation as none.
        with tempfile.TemporaryDirectory() as tmp:
            name = eight_bar_score(Path(tmp))
            path = report(Path(tmp) / "r.json", **{"song.other": 400})
            over = [item(("Too far", 1, 9), file=name)]
            self.assertIn("8 printed bar(s)", section_errors(over, Path(tmp), path)[0])

    def test_a_count_that_cannot_be_established_is_an_error_not_a_pass(self) -> None:
        # A rule that goes quiet when its input is missing is a rule that stops
        # working the day somebody deletes build/.
        errors = section_errors([item(("Anywhere", 1, 4))], Path("."), MISSING)
        self.assertEqual(len(errors), 1)
        self.assertIn("could not be established", errors[0])

    def test_a_failed_render_is_not_treated_as_a_bar_count(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "r.json"
            path.write_text(
                json.dumps({"items": [{"id": "song.test", "sourceMeasures": 2, "ok": False}]}),
                encoding="utf-8",
            )
            errors = section_errors([item(("All of it", 1, 8))], Path(tmp), path)
            self.assertIn("could not be established", errors[0])


class TestPrintedBars(unittest.TestCase):
    def test_it_counts_written_bars(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            name = eight_bar_score(Path(tmp))
            self.assertEqual(printed_bars(Path(tmp) / name), 8)

    def test_an_unreadable_file_is_none_rather_than_a_crash(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            junk = Path(tmp) / "junk.musicxml"
            junk.write_text("not a score", encoding="utf-8")
            self.assertIsNone(printed_bars(junk))
            self.assertIsNone(printed_bars(Path(tmp) / "absent.musicxml"))


if __name__ == "__main__":  # pragma: no cover
    unittest.main()
