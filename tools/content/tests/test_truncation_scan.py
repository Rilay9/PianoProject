"""
The grace-16th truncation scan (P2 §8, made permanent by replan §7).

The defect is silent by construction — the bar renders, it is just short — so
the scan is the only thing that would ever notice. These tests pin both halves
of its judgement: it must catch the signature, and it must not cry wolf over
the ordinary short bars that P2's one-off run turned up.
"""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from truncation_scan import SHORT_GRACE_TYPES, scan_xml  # noqa: E402


def score(measures: str) -> bytes:
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1">{measures}</part>
</score-partwise>""".encode("utf-8")


def measure(number: int, body: str, *, attributes: bool = False) -> str:
    head = (
        '<attributes><divisions>4</divisions>'
        '<time><beats>4</beats><beat-type>4</beat-type></time></attributes>'
        if attributes
        else ""
    )
    return f'<measure number="{number}">{head}{body}</measure>'


def note(duration: int, *, chord: bool = False) -> str:
    return (
        f'<note>{"<chord/>" if chord else ""}<pitch><step>C</step><octave>4</octave></pitch>'
        f"<duration>{duration}</duration></note>"
    )


def grace(kind: str) -> str:
    return f'<note><grace/><pitch><step>D</step><octave>4</octave></pitch><type>{kind}</type></note>'


class TestFullBars(unittest.TestCase):
    def test_a_complete_bar_is_not_short(self) -> None:
        report = scan_xml(score(measure(1, note(16), attributes=True)))
        self.assertEqual(report.short, 0)
        self.assertEqual(report.findings, [])

    def test_a_complete_bar_with_a_short_grace_is_not_flagged(self) -> None:
        # The grace is only a symptom when the bar is *also* truncated.
        report = scan_xml(score(measure(1, grace("16th") + note(16), attributes=True)))
        self.assertEqual(report.findings, [])

    def test_chord_members_add_no_time(self) -> None:
        body = note(16) + note(16, chord=True)
        self.assertEqual(scan_xml(score(measure(1, body, attributes=True))).short, 0)

    def test_backup_lets_a_second_voice_refill_the_bar(self) -> None:
        body = note(16) + "<backup><duration>16</duration></backup>" + note(16)
        self.assertEqual(scan_xml(score(measure(1, body, attributes=True))).short, 0)


class TestTruncated(unittest.TestCase):
    def test_the_defect_signature_is_reported(self) -> None:
        # A quarter where a whole bar should be, with a 16th grace: P2 §8.
        report = scan_xml(score(measure(1, grace("16th") + note(4), attributes=True)))
        self.assertEqual(report.short, 1)
        self.assertEqual(len(report.findings), 1)
        finding = report.findings[0]
        self.assertEqual(finding.measure, "1")
        self.assertEqual(finding.reached, 4)
        self.assertEqual(finding.expected, 16)
        self.assertIn("16th", finding.describe())

    def test_a_short_bar_without_a_short_grace_is_counted_not_reported(self) -> None:
        # A pickup, or a bar split at a repeat — what P2's scan actually found.
        report = scan_xml(score(measure(1, note(4), attributes=True)))
        self.assertEqual(report.short, 1)
        self.assertEqual(report.findings, [])

    def test_an_eighth_grace_is_not_the_defect(self) -> None:
        report = scan_xml(score(measure(1, grace("eighth") + note(4), attributes=True)))
        self.assertEqual(report.short, 1)
        self.assertEqual(report.findings, [])

    def test_every_short_type_triggers(self) -> None:
        for kind in sorted(SHORT_GRACE_TYPES):
            report = scan_xml(score(measure(1, grace(kind) + note(4), attributes=True)))
            self.assertEqual(len(report.findings), 1, kind)


class TestCarryForward(unittest.TestCase):
    def test_divisions_and_time_carry_into_later_bars(self) -> None:
        body = measure(1, note(16), attributes=True) + measure(2, grace("32nd") + note(4))
        report = scan_xml(score(body))
        self.assertEqual(report.measures, 2)
        self.assertEqual(len(report.findings), 1)
        self.assertEqual(report.findings[0].measure, "2")

    def test_a_score_with_no_divisions_is_skipped_quietly(self) -> None:
        report = scan_xml(score(measure(1, note(4))))
        self.assertEqual(report.short, 0)
        self.assertEqual(report.findings, [])


class TestRobustness(unittest.TestCase):
    def test_unparseable_xml_returns_no_findings(self) -> None:
        report = scan_xml(b"<not-xml")
        self.assertEqual(report.files, 1)
        self.assertEqual(report.findings, [])

    def test_summary_reads_as_a_build_line(self) -> None:
        report = scan_xml(score(measure(1, grace("16th") + note(4), attributes=True)))
        self.assertIn("1 with a short grace", report.summary())


if __name__ == "__main__":  # pragma: no cover
    unittest.main()
