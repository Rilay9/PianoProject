"""Tests of direct/form.py and direct/integrity.py (form.sections, integrity.*)."""
import unittest

from direct import _testkit as T
from direct._testkit import mxml, n, r, synth, run

HAVE_CATALOG = (T.S.CONTENT / "catalog.json").exists()


def val(cid, sc):
    res = run(cid, sc)
    assert res.unknown is None, res.unknown
    return res.value


def q(step="C", octave=5, **kw):
    return n(step, octave, 4, **kw)


def bar(*extra):
    return [list(extra) + [q()] * 4]


BACKWARD = {"xml": '<barline location="right"><bar-style>light-heavy</bar-style><repeat direction="backward"/></barline>'}
DOUBLE = {"xml": '<barline location="right"><bar-style>light-light</bar-style></barline>'}
FINAL = {"xml": '<barline location="right"><bar-style>light-heavy</bar-style></barline>'}
REHEARSAL = {"xml": '<direction placement="above"><direction-type><rehearsal>B</rehearsal></direction-type></direction>'}
KEY2 = {"xml": "<attributes><key><fifths>2</fifths></key></attributes>"}


class Sections(unittest.TestCase):
    def test_no_marks_is_one_section(self):
        v = val("form.sections", synth(mxml([bar(), bar(), bar()], staves=1)))
        self.assertEqual((v["sections"], v["boundaries"]), (1, []))

    def test_each_kind_of_boundary(self):
        # bar 0 ends with a backward repeat, bar 1 with a double barline, bar 2 carries a rehearsal mark, bar 3 changes key
        bars = [[[q()] * 4 + [BACKWARD]], [[q()] * 4 + [DOUBLE]], [[REHEARSAL] + [q()] * 4], [[KEY2] + [q()] * 4], bar()]
        v = val("form.sections", synth(mxml(bars, staves=1)))
        self.assertEqual(v["boundaries"], [1, 2, 3])
        self.assertEqual(v["by_kind"], {"repeat": 1, "double": 1, "rehearsal": 1, "key": 1})
        self.assertEqual(v["sections"], 4)

    def test_the_final_barline_is_not_a_boundary(self):
        bars = [bar(), [[q()] * 4 + [FINAL]]]
        self.assertEqual(val("form.sections", synth(mxml(bars, staves=1)))["sections"], 1)

    def test_rehearsal_mark_on_the_first_bar_is_not_a_boundary(self):
        bars = [[[REHEARSAL] + [q()] * 4], bar()]
        self.assertEqual(val("form.sections", synth(mxml(bars, staves=1)))["sections"], 1)


def three_part_xml(program_second="1", unpitched=False):
    notes = '<note><pitch><step>C</step><octave>4</octave></pitch><duration>16</duration><voice>1</voice></note>'
    perc = '<note><unpitched><display-step>C</display-step><display-octave>4</display-octave></unpitched><duration>16</duration><voice>1</voice></note>'
    attrs = "<attributes><divisions>4</divisions><time><beats>4</beats><beat-type>4</beat-type></time></attributes>"

    def part(pid, body):
        return f'<part id="{pid}"><measure number="1">{attrs}{body}</measure></part>'
    plist = "".join(f'<score-part id="P{i}"><part-name>p{i}</part-name><midi-instrument id="I{i}"><midi-program>{prog}</midi-program></midi-instrument></score-part>'
                    for i, prog in ((1, "1"), (2, program_second), (3, "1")))
    return ('<?xml version="1.0"?><score-partwise version="3.1"><part-list>' + plist + "</part-list>"
            + part("P1", notes) + part("P2", notes) + part("P3", perc if unpitched else notes) + "</score-partwise>")


class ExtraParts(unittest.TestCase):
    def test_a_piano_score_has_none(self):
        v = val("integrity.extra-parts", synth(mxml([bar()], staves=2)))
        self.assertEqual((v["count"], v["parts"], v["max_staves"]), (0, 1, 2))

    def test_a_third_part_is_extra(self):
        v = val("integrity.extra-parts", synth(three_part_xml()))
        self.assertEqual((v["count"], v["parts"]), (1, 3))

    def test_a_non_piano_program_is_extra(self):
        v = val("integrity.extra-parts", synth(three_part_xml(program_second="41")))
        self.assertIn("part 2 plays program 41", v["reasons"])

    def test_unpitched_part_is_percussion(self):
        v = val("integrity.extra-parts", synth(three_part_xml(unpitched=True)))
        self.assertEqual(v["percussion_parts"], 1)

    def test_three_staves_is_extra(self):
        v = val("integrity.extra-parts", synth(mxml([bar()], staves=3, clefs=("G2", "G2", "F4"))))
        self.assertEqual(v["max_staves"], 3)
        self.assertGreaterEqual(v["count"], 1)


class LeadSheetAndRange(unittest.TestCase):
    HARM = {"xml": "<harmony><root><root-step>C</root-step></root><kind>major</kind></harmony>"}

    def test_melody_with_symbols_is_a_lead_sheet(self):
        v = val("integrity.lead-sheet-shape", synth(mxml([bar(self.HARM)], staves=1)))
        self.assertEqual((v["lead_sheet"], v["chord_symbols"], v["hands_with_notes"]), (True, 1, 1))

    def test_symbols_over_a_written_left_hand_are_not(self):
        sc = synth(mxml([[[self.HARM] + [q()] * 4, [q("C", 3, staff=2)] * 4]], staves=2))
        self.assertFalse(val("integrity.lead-sheet-shape", sc)["lead_sheet"])

    def test_melody_without_symbols_is_not(self):
        self.assertFalse(val("integrity.lead-sheet-shape", synth(mxml([bar()], staves=1)))["lead_sheet"])

    def test_range_inside_the_keys(self):
        v = val("integrity.piano-range", synth(mxml([[[n("A", 0), n("C", 8), q(), q()]]], staves=1)))
        self.assertEqual((v["ok"], v["min"], v["max"], v["outside"]), (True, 21, 108, 0))

    def test_a_note_below_the_keys(self):
        v = val("integrity.piano-range", synth(mxml([[[n("G", 0), q(), q(), q()]]], staves=1)))
        self.assertEqual((v["ok"], v["outside"], v["min"]), (False, 1, 19))

    def test_a_note_above_the_keys(self):
        v = val("integrity.piano-range", synth(mxml([[[n("C", 8, alter=1), q(), q(), q()]]], staves=1)))
        self.assertEqual((v["ok"], v["max"]), (False, 109))


@unittest.skipUnless(HAVE_CATALOG, "needs the built catalogue")
class RealItems(unittest.TestCase):
    pass


if __name__ == "__main__":
    unittest.main()
