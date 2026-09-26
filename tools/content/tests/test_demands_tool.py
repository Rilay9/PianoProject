"""
The build measures a file's demands with the app's own detectors (C2 item 4).

Reviewer decision 4: one authoritative definition of each musical fact. The
detectors live in `app/src/demands/detect.ts` and read the score model OSMD
makes of a file; `demands.py` hands the build's files to that code through
Node rather than keeping a second, Python definition beside it. This proves the
path on one quarried piece, Anh. 113, against what its MusicXML says (read by
hand and by an ElementTree pass, recorded in the C2 entry).

Needs Node and `app/node_modules`, which CI installs before these tests run.
"""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

REPO_ROOT = Path(__file__).resolve().parents[3]
ANH_113 = REPO_ROOT / "content" / "scores" / "pdmx" / "QmZzbCrrGH19zjfe766mDvw9C1cXYXSa5ApF7MRnRhpqjL.mxl"


class TestDemandsTool(unittest.TestCase):
    def test_a_quarried_piece_is_measured_by_the_one_definition(self) -> None:
        import demands  # noqa: PLC0415 - the module under test; red until it exists

        result = demands.measure([ANH_113])
        self.assertEqual(list(result), [str(ANH_113)])
        found = set(result[str(ANH_113)])
        for demand in (
            "clef.bass",
            "pitch.ledger",
            "interval.leap",
            "rhythm.sixteenths",
            "rhythm.triplets",
            "key.signature",
            "pitch.chromatic",
            "texture.hands-together",
        ):
            self.assertIn(demand, found)
        for demand in ("rhythm.ties", "rhythm.dotted-quarter", "metre.compound"):
            self.assertNotIn(demand, found)

    def test_a_file_that_will_not_load_is_named_not_dropped(self) -> None:
        import demands  # noqa: PLC0415

        missing = REPO_ROOT / "content" / "scores" / "no-such-file.mxl"
        with self.assertRaises(demands.DemandsError) as caught:
            demands.measure([missing])
        self.assertIn("no-such-file.mxl", str(caught.exception))


if __name__ == "__main__":
    unittest.main()
