"""
`parity_reference.py`'s two gates (Q46, Q47).

The reference writer decides what `app/tests/unit/midiParity.test.ts` can compare, so two
of its silences were open gates. Its `return 0 if written else 1` passed whenever anything
was written, so under CI a fetch that brought one recording of three would have gone
unnoticed; and no committed fixture was split, so the parity case *splits the hands the
same way* skipped wherever the recordings were absent. These tests hold both: a missing
recording fails under CI after the rest is written, and the committed one-track fixture
is written with a hand split, which the writer itself insists on.

Run from the repository root:

    python -m unittest discover -s tools/midi-cleanup/tests -p test_parity_reference.py -v
"""
from __future__ import annotations

import contextlib
import io
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent))

import parity_reference  # noqa: E402

ONE_TRACK = "tools/midi-cleanup/tests/fixtures/one-track-two-hands.mid"
TWO_TRACKS = "app/tests/fixtures/imports/two-hands.mid"


class TestTheReferenceWriter(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.tmp = Path(self._tmp.name)
        (self.tmp / "no-recordings").mkdir()

    def tearDown(self) -> None:
        self._tmp.cleanup()

    def run_main(self, fixtures, ci: str | None) -> tuple[int, str]:
        """`main()` on the given fixtures only, with no recordings and no rendering."""
        env = {key: value for key, value in os.environ.items() if key != "CI"}
        if ci is not None:
            env["CI"] = ci
        printed = io.StringIO()
        with mock.patch.object(parity_reference, "OUT", self.tmp / "out"), \
                mock.patch.object(parity_reference, "REAL_DIR", self.tmp / "no-recordings"), \
                mock.patch.object(parity_reference, "RENDERED_CASES", ()), \
                mock.patch.object(parity_reference, "APP_FIXTURES", tuple(fixtures)), \
                mock.patch.dict(os.environ, env, clear=True), \
                contextlib.redirect_stdout(printed):
            code = parity_reference.main()
        return code, printed.getvalue()

    def entry(self, relative: str) -> tuple:
        found = [row for row in parity_reference.APP_FIXTURES if row[0] == relative]
        self.assertEqual(len(found), 1, f"{relative} is not in APP_FIXTURES once")
        return found[0]

    def test_the_one_track_fixture_is_written_with_a_hand_split(self) -> None:
        code, printed = self.run_main([self.entry(ONE_TRACK)], ci=None)
        self.assertEqual(code, 0, printed)
        data = json.loads((self.tmp / "out" / "one-track-two-hands.json").read_text(encoding="utf-8"))
        self.assertIsNotNone(data["handSplit"])
        self.assertTrue(data["handSplit"]["left"] and data["handSplit"]["right"])
        # Where midiParity.test.ts finds the MIDI the reference was written from.
        self.assertEqual(data["fixtureFrom"], "tools/midi-cleanup/tests/fixtures")
        self.assertEqual(data["hands"], "auto")

    def test_the_writer_refuses_a_fixture_it_expects_split_that_is_not(self) -> None:
        # An earlier run's reference for it must not survive the refusal, or the parity
        # test would compare against it.
        stale = self.tmp / "out" / "two-hands.json"
        stale.parent.mkdir(parents=True)
        stale.write_text("{}", encoding="utf-8")
        code, printed = self.run_main([(TWO_TRACKS, True)], ci=None)
        self.assertNotEqual(code, 0)
        self.assertIn("two-hands.mid", printed)
        self.assertIn("handSplit", printed)
        self.assertFalse(stale.exists(), "a refused fixture's earlier reference was left in place")

    def test_in_ci_a_missing_recording_fails_after_the_rest_is_written(self) -> None:
        code, printed = self.run_main([self.entry(ONE_TRACK)], ci="true")
        self.assertNotEqual(code, 0, printed)
        self.assertIn("'Fetch the MAESTRO test recordings'", printed)
        for name in parity_reference.REAL_FILES:
            self.assertIn(name, printed)
        self.assertTrue((self.tmp / "out" / "one-track-two-hands.json").is_file())

    def test_on_a_developer_checkout_a_missing_recording_is_reported_not_failed(self) -> None:
        code, printed = self.run_main([self.entry(ONE_TRACK)], ci=None)
        self.assertEqual(code, 0, printed)
        self.assertIn("fetch_maestro.py", printed)

    def test_a_missing_committed_fixture_fails_everywhere(self) -> None:
        # Beside a fixture that is written, so the failure is the missing one's and not
        # "nothing was written".
        code, printed = self.run_main(
            [self.entry(ONE_TRACK), ("tools/midi-cleanup/tests/fixtures/absent.mid", False)],
            ci=None,
        )
        self.assertNotEqual(code, 0)
        self.assertIn("absent.mid", printed)
        self.assertTrue((self.tmp / "out" / "one-track-two-hands.json").is_file())


if __name__ == "__main__":
    unittest.main()
