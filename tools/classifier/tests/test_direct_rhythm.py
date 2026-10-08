"""Tests of direct/rhythm.py."""
import unittest

from direct import _testkit as T
from direct._testkit import mxml, n, r, synth, run

HAVE_CATALOG = (T.S.CONTENT / "catalog.json").exists()


def val(cid, sc):
    res = run(cid, sc)
    assert res.unknown is None, res.unknown
    return res.value


class Values(unittest.TestCase):
    def test_histogram_of_notes_and_rests(self):
        bar = [n("C", 5, 4, type="quarter"), n("D", 5, 2, type="eighth"), n("E", 5, 2, type="eighth"), r(4, type="quarter"), n("F", 5, 4, type="quarter")]
        v = val("rhythm.values", synth(mxml([[bar]], staves=1)))
        self.assertEqual(v["notes"], {"eighth": 2, "quarter": 2})
        self.assertEqual(v["rests"], {"quarter": 1})
        self.assertEqual((v["distinct_note_values"], v["shortest_note"]), (2, 0.5))

    def test_dotted_and_triplet_values_are_their_own_entries(self):
        dotted = n("C", 5, 6, type="quarter", extra="")
        bar = [{**dotted, "dot": True}]
        xml = mxml([[[n("C", 5, 6, type="quarter"), n("D", 5, 2, type="eighth"), n("E", 5, 8, type="half")]]], staves=1)
        xml = xml.replace("<type>quarter</type>", "<type>quarter</type><dot/>", 1)
        v = val("rhythm.values", synth(xml))
        self.assertEqual(v["notes"], {"eighth": 1, "half": 1, "quarter.": 1})

    def test_triplet_ratio(self):
        bar = [n("C", 5, 4, tm=(3, 2), type="eighth")] * 3 + [n("D", 5, 12, type="half")] * 0 + [n("D", 5, 12, type="quarter")] * 3
        v = val("rhythm.values", synth(mxml([[bar]], staves=1, divisions=12)))
        self.assertEqual(v["notes"].get("eighth[3:2]"), 3)

    def test_chord_symbols_are_not_notes(self):
        harm = {"xml": "<harmony><root><root-step>C</root-step></root><kind>major</kind></harmony>"}
        bar = [harm, n("C", 5, 16, type="whole")]
        v = val("rhythm.values", synth(mxml([[bar]], staves=1)))
        self.assertEqual(v["notes"], {"whole": 1})


class RepeatedNotes(unittest.TestCase):
    def test_three_strikes_of_one_key(self):
        bar = [n("C", 5)] * 3 + [n("D", 5)]
        v = val("rhythm.repeated-notes", synth(mxml([[bar]], staves=1)))
        self.assertEqual((v["count"], v["longest_run"]), (2, 3))

    def test_alternating_notes_repeat_nothing(self):
        bar = [n("C", 5), n("D", 5), n("C", 5), n("D", 5)]
        self.assertEqual(val("rhythm.repeated-notes", synth(mxml([[bar]], staves=1)))["count"], 0)

    def test_a_tie_is_not_a_repeat(self):
        bar = [n("C", 5, tie="start"), n("C", 5, tie="stop"), n("D", 5), n("E", 5)]
        self.assertEqual(val("rhythm.repeated-notes", synth(mxml([[bar]], staves=1)))["count"], 0)

    def test_a_repeated_chord_counts_each_shared_pitch(self):
        chord = [n("C", 5), n("E", 5, chord=True)]
        v = val("rhythm.repeated-notes", synth(mxml([[chord * 2 + [r(), r()]]], staves=1)))
        self.assertEqual(v["count"], 2)

    def test_hands_do_not_repeat_each_other(self):
        sc = synth(mxml([[[n("C", 4)] * 4, [n("C", 4, staff=2)] * 4]], staves=2, clefs=("G2", "G2")))
        self.assertEqual(val("rhythm.repeated-notes", sc)["count"], 6)  # three repeats in each hand, none across


@unittest.skipUnless(HAVE_CATALOG, "needs the built catalogue")
class RealItems(unittest.TestCase):
    pass


if __name__ == "__main__":
    unittest.main()
