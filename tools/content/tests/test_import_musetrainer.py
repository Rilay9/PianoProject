"""
When an `[MT]` file may be copied verbatim, and when it may not.

The import copies a file untouched unless something about it needs fixing,
which is a real saving — a music21 round-trip re-engraves the score, and these
editions are already MusicXML. The rule was written on the assumption that the
verbatim copies "were already verified to render". Two of them do not, and
nothing in the pipeline could have said so until the render check could report
per-item failures. So the table can now name a file that must be normalised,
with the reason, and these tests pin both halves of the decision.
"""
from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from import_musetrainer import normalisation_reasons  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parents[3]
TABLE = REPO_ROOT / "content" / "sources" / "musetrainer.json"

ONE_PART_WITH_TEMPO = (
    '<score-partwise><part-list><score-part id="P1"/></part-list>'
    '<part id="P1"><measure number="1"><sound tempo="96"/></measure></part></score-partwise>'
)


class TestStructuralReasons(unittest.TestCase):
    def test_a_single_part_with_a_tempo_is_copied_verbatim(self) -> None:
        self.assertEqual(normalisation_reasons(ONE_PART_WITH_TEMPO), [])

    def test_two_parts_must_be_merged(self) -> None:
        xml = ONE_PART_WITH_TEMPO.replace(
            '<score-part id="P1"/>', '<score-part id="P1"/><score-part id="P2"/>'
        )
        self.assertEqual(len(normalisation_reasons(xml)), 1)
        self.assertIn("grand staff", normalisation_reasons(xml)[0])

    def test_no_tempo_of_its_own(self) -> None:
        xml = ONE_PART_WITH_TEMPO.replace('<sound tempo="96"/>', "")
        self.assertIn("no tempo of its own", normalisation_reasons(xml))


class TestForcedNormalisation(unittest.TestCase):
    """A reason the file cannot state about itself: it does not render."""

    def test_the_table_can_demand_it(self) -> None:
        spec = {"normalise": "render: OSMD draws nothing"}
        reasons = normalisation_reasons(ONE_PART_WITH_TEMPO, spec)
        self.assertEqual(reasons, ["render: OSMD draws nothing"])

    def test_it_adds_to_the_structural_reasons_rather_than_replacing_them(self) -> None:
        xml = ONE_PART_WITH_TEMPO.replace('<sound tempo="96"/>', "")
        reasons = normalisation_reasons(xml, {"normalise": "render: OSMD draws nothing"})
        self.assertEqual(len(reasons), 2)

    def test_no_flag_means_no_extra_reason(self) -> None:
        self.assertEqual(normalisation_reasons(ONE_PART_WITH_TEMPO, {}), [])
        self.assertEqual(normalisation_reasons(ONE_PART_WITH_TEMPO, None), [])


class TestTheRealTable(unittest.TestCase):
    def test_k545_is_marked_for_normalisation(self) -> None:
        # The regression this exists for: lesson classical.7 offers this piece,
        # and the verbatim copy drew nothing.
        table = json.loads(TABLE.read_text(encoding="utf-8"))
        spec = table["items"]["Sonata_No._16_1st_Movement_K._545.mxl"]
        self.assertIn("normalise", spec)
        self.assertEqual(spec["id"], "song.classical.mozart-k545-i")
        self.assertTrue(normalisation_reasons(ONE_PART_WITH_TEMPO, spec))

    def test_every_excluded_entry_says_why(self) -> None:
        table = json.loads(TABLE.read_text(encoding="utf-8"))
        for name, spec in table["items"].items():
            if "exclude" in spec:
                self.assertTrue(str(spec["exclude"]).strip(), f"{name} excluded with no reason")


if __name__ == "__main__":  # pragma: no cover
    unittest.main()
