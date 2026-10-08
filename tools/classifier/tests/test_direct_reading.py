"""Tests of direct/reading.py."""
import unittest

from direct import _testkit as T
from direct._testkit import mxml, n, r, synth, run

HAVE_CATALOG = (T.S.CONTENT / "catalog.json").exists()


def val(cid, sc):
    res = run(cid, sc)
    assert res.unknown is None, res.unknown
    return res.value


class AccidentalChurn(unittest.TestCase):
    def test_sharp_natural_sharp_in_one_bar(self):
        bar = [n("C", 5, alter=1), n("C", 5), n("C", 5, alter=1), n("C", 5, alter=1)]
        v = val("reading.accidental-churn", synth(mxml([[bar]], staves=1)))
        # the first sharp is needed, the natural cancels it, the second sharp returns; the last repeats the sharp already in force
        self.assertEqual((v["needed"], v["count"], v["bars_with_churn"]), (3, 2, 1))

    def test_the_key_signature_covers_the_sharp(self):
        bar = [n("C", 5, alter=1)] * 4
        v = val("reading.accidental-churn", synth(mxml([[bar]], staves=1, fifths=2)))
        self.assertEqual((v["needed"], v["count"]), (0, 0))

    def test_one_sign_per_bar_is_no_churn(self):
        bars = [[n("C", 5, alter=1)] * 4, [n("C", 5, alter=1)] * 4]
        v = val("reading.accidental-churn", synth(mxml([[bars[0]], [bars[1]]], staves=1)))
        self.assertEqual((v["needed"], v["count"]), (2, 0))

    def test_octaves_are_separate_pitches(self):
        bar = [n("C", 5, alter=1), n("C", 4), n("C", 5, alter=1), n("C", 4, alter=1)]
        v = val("reading.accidental-churn", synth(mxml([[bar]], staves=1)))
        self.assertEqual((v["needed"], v["count"]), (2, 0))


class VisualDensity(unittest.TestCase):
    def test_chords_count_every_notehead(self):
        chord = [n("C", 4), n("E", 4, chord=True), n("G", 4, chord=True)]
        v = val("reading.visual-density", synth(mxml([[chord * 4]], staves=1)))
        self.assertEqual((v["noteheads_max"], v["voices_per_staff_max"], v["accidentals_max"]), (12, 1, 0))

    def test_two_voices_and_accidentals(self):
        bar = [[n("C", 5, alter=1), n("D", 5), n("E", 5), n("F", 5)], [n("E", 4, 8, voice=2), n("G", 4, 8, voice=2)]]
        v = val("reading.visual-density", synth(mxml([bar], staves=1)))
        self.assertEqual((v["noteheads_max"], v["voices_per_staff_max"], v["accidentals_max"]), (6, 2, 1))

    def test_chord_symbols_are_not_noteheads(self):
        harm = {"xml": "<harmony><root><root-step>C</root-step></root><kind>major</kind></harmony>"}
        v = val("reading.visual-density", synth(mxml([[[harm, n("C", 5, 16)]]], staves=1)))
        self.assertEqual(v["noteheads_max"], 1)


class UnusualNotation(unittest.TestCase):
    def test_nothing_unusual(self):
        v = val("reading.unusual-notation", synth(mxml([[[n("C", 5)] * 4]], staves=1)))
        self.assertEqual(v["count"], 0)

    def test_cross_staff_line(self):
        bar = [[n("C", 5), n("D", 5), n("E", 3, staff=2), n("F", 3, staff=2)]]
        v = val("reading.unusual-notation", synth(mxml([bar], staves=2)))
        self.assertEqual((v["cross_staff"], v["count"]), (1, 1))

    def test_two_voices_on_two_staves_are_not_cross_staff(self):
        bar = [[n("C", 5)] * 4, [n("C", 3, staff=2)] * 4]
        self.assertEqual(val("reading.unusual-notation", synth(mxml([bar], staves=2)))["cross_staff"], 0)

    def test_cue_notes(self):
        v = val("reading.unusual-notation", synth(mxml([[[n("C", 5, cue=True), n("D", 5, cue=True), n("E", 5), n("F", 5)]]], staves=1)))
        self.assertEqual(v["cue_notes"], 2)

    def test_clef_change_mid_bar_but_not_at_the_barline(self):
        mid = {"xml": '<attributes><clef><sign>F</sign><line>4</line></clef></attributes>'}
        bars = [[[n("C", 5), n("D", 5), mid, n("E", 3), n("F", 3)]], [[mid, n("C", 3)] + [n("D", 3)] * 3]]
        v = val("reading.unusual-notation", synth(mxml(bars, staves=1)))
        self.assertEqual(v["clef_mid_bar"], 1)


@unittest.skipUnless(HAVE_CATALOG, "needs the built catalogue")
class RealItems(unittest.TestCase):
    pass


if __name__ == "__main__":
    unittest.main()
