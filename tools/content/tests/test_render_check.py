"""
The judgements render_check.py makes about a render report (replan §7.1–§7.4).

The rendering itself is a Playwright test; what is worth unit-testing is the
reading of what it reported, because those are the checks the pipeline was
blind in — and a check nobody can test is how it stayed blind.
"""
from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from common import write_json  # noqa: E402
from render_check import (  # noqa: E402
    apply_durations,
    console_flags,
    console_summary,
    hands_flags,
    pace_flags,
    parity_failures,
)


def item(**overrides: object) -> dict:
    base = {
        "id": "song.test.one",
        "ok": True,
        "cached": False,
        "steps": 10,
        "cursorSteps": 10,
        "measures": 8,
        "durationSec": 16.0,
        "tempoBpm": 96,
        "hands": "both",
    }
    base.update(overrides)
    return base


class TestParity(unittest.TestCase):
    def test_matching_counts_pass(self) -> None:
        self.assertEqual(parity_failures([item()]), [])

    def test_a_mismatch_is_named(self) -> None:
        failures = parity_failures([item(steps=10, cursorSteps=9)])
        self.assertEqual(len(failures), 1)
        self.assertIn("model 10 steps vs cursor 9", failures[0])

    def test_a_failed_render_is_not_a_parity_failure(self) -> None:
        self.assertEqual(parity_failures([item(ok=False, steps=None, cursorSteps=None)]), [])

    def test_a_row_with_no_cursor_count_is_not_evidence(self) -> None:
        # An older manifest entry, written before the parity check existed.
        row = item()
        del row["cursorSteps"]
        self.assertEqual(parity_failures([row]), [])


class TestPace(unittest.TestCase):
    def test_two_seconds_a_bar_is_fine(self) -> None:
        self.assertEqual(pace_flags([item(durationSec=16.0, measures=8)]), [])

    def test_a_bar_that_flies_past_is_flagged(self) -> None:
        flags = pace_flags([item(durationSec=1.0, measures=8)])  # 0.125 s/bar
        self.assertEqual(len(flags), 1)
        self.assertIn("per bar", flags[0])

    def test_a_forty_minute_bar_is_flagged(self) -> None:
        self.assertEqual(len(pace_flags([item(durationSec=2400.0, measures=8)])), 1)

    def test_the_bounds_themselves_pass(self) -> None:
        self.assertEqual(pace_flags([item(durationSec=4.0, measures=8)]), [])  # 0.5
        self.assertEqual(pace_flags([item(durationSec=96.0, measures=8)]), [])  # 12.0

    def test_a_missing_measurement_is_not_a_flag(self) -> None:
        self.assertEqual(pace_flags([item(durationSec=None)]), [])
        self.assertEqual(pace_flags([item(measures=0)]), [])


class TestHands(unittest.TestCase):
    def test_agreement_is_silent(self) -> None:
        catalog = [{"id": "song.test.one", "hands": "both"}]
        self.assertEqual(hands_flags([item(hands="both")], catalog), [])

    def test_a_mislabelled_hand_is_flagged(self) -> None:
        catalog = [{"id": "song.test.one", "hands": "both"}]
        flags = hands_flags([item(hands="right")], catalog)
        self.assertEqual(len(flags), 1)
        self.assertIn("catalog says both, model has right", flags[0])

    def test_an_item_absent_from_the_catalog_is_not_flagged(self) -> None:
        self.assertEqual(hands_flags([item()], []), [])


class TestConsole(unittest.TestCase):
    def test_lines_are_attributed_to_their_item(self) -> None:
        flags = console_flags([item(consoleErrors=["warning: dropped an element"])])
        self.assertEqual(flags, ["song.test.one: warning: dropped an element"])

    def test_a_quiet_item_says_nothing(self) -> None:
        self.assertEqual(console_flags([item()]), [])

    def test_repeats_collapse_with_a_count(self) -> None:
        # OSMD emits one SkyBottomLineCalculator warning per measure; printing
        # 62 identical lines buries the one that matters.
        flags = console_flags([item(consoleErrors=["warning: width not > 0"] * 3)])
        self.assertEqual(flags, ["song.test.one: warning: width not > 0 (×3)"])

    def test_the_summary_groups_by_message_across_items(self) -> None:
        rows = [
            item(id="song.a", consoleErrors=["warning: w"] * 2),
            item(id="song.b", consoleErrors=["warning: w", "error: e"]),
        ]
        summary = console_summary(rows)
        self.assertIn("warning: w — 3 time(s) across 2 item(s)", summary)
        self.assertIn("error: e — 1 time(s) across 1 item(s)", summary)


class TestApplyDurations(unittest.TestCase):
    """A cached row must write the catalog exactly as a fresh one would."""

    def test_manifest_rows_are_applied_like_fresh_ones(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            catalog_path = Path(tmp) / "catalog.json"
            write_json(
                catalog_path,
                [
                    {"id": "song.a", "durationSec": None, "tempoBpm": None},
                    {"id": "song.b", "durationSec": None, "tempoBpm": 60},
                ],
            )
            apply_durations(
                catalog_path,
                [
                    item(id="song.a", cached=True, durationSec=12.5, tempoBpm=88),
                    item(id="song.b", cached=False, durationSec=30.0, tempoBpm=90),
                ],
            )
            written = {e["id"]: e for e in __import__("json").loads(catalog_path.read_text("utf-8"))}
            self.assertEqual(written["song.a"]["durationSec"], 12.5)
            self.assertEqual(written["song.a"]["tempoBpm"], 88)
            self.assertEqual(written["song.b"]["durationSec"], 30.0)
            # An explicit tempo in the catalog wins over the measured one.
            self.assertEqual(written["song.b"]["tempoBpm"], 60)


if __name__ == "__main__":  # pragma: no cover
    unittest.main()
