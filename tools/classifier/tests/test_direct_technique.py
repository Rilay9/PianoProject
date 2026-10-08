"""Tests of direct/technique.py: reach, leaps, crossings and the velocity at the written tempo."""
import unittest

from direct import _testkit as T
from direct._testkit import mxml, n, r, synth, run


def val(cid, sc):
    res = run(cid, sc)
    assert res.unknown is None, res.unknown
    return res.value


def q(step, octave, staff=1, **kw):
    return n(step, octave, 4, staff=staff, **kw)


class Span(unittest.TestCase):
    def test_struck_chord(self):
        sc = synth(mxml([[[q("C", 4), n("G", 5, 4, chord=True), r(), r(), r()]]], staves=1))
        v = val("technique.span", sc)
        self.assertEqual((v["max_struck_span"]["R"], v["max_sounding_span"]["R"]), (19, 19))

    def test_held_note_widens_the_sounding_reach_only(self):
        bar = [[n("C", 4, 16)], [r(8, voice=2), n("D", 5, 8, voice=2)]]
        v = val("technique.span", synth(mxml([bar], staves=1)))
        self.assertEqual((v["max_struck_span"]["R"], v["max_sounding_span"]["R"]), (0, 14))

    def test_single_notes_have_no_span(self):
        v = val("technique.span", synth(mxml([[[q("C", 4)] * 4]], staves=1)))
        self.assertEqual(v["max_sounding_span"]["R"], 0)

    def test_a_one_staff_file_takes_the_declared_hand(self):
        sc = synth(mxml([[[q("C", 3), q("D", 3), q("E", 3), q("F", 3)]]], staves=1, clefs=("F4",)), hands="left")
        self.assertEqual(set(val("technique.span", sc)["max_sounding_span"]), {"L"})


class Leaps(unittest.TestCase):
    def test_the_right_hand_line_is_its_top_note(self):
        bar = [[q("C", 4), n("E", 4, 4, chord=True), q("D", 4), n("F", 4, 4, chord=True), q("C", 6), r()]]
        v = val("technique.leap-size", synth(mxml([[bar[0]]], staves=1)))
        self.assertEqual(v["R"]["max"], 19)  # top notes E4 F4 C6: F4 (65) to C6 (84); the bottom notes C4 D4 C6 would give 22
        self.assertEqual(v["R"]["n"], 2)

    def test_the_left_hand_line_is_its_bottom_note(self):
        bar = [[q("C", 3, 2), n("G", 3, 4, chord=True, staff=2), q("D", 3, 2), n("A", 3, 4, chord=True, staff=2), q("C", 2, 2), r(staff=2)]]
        v = val("technique.leap-size", synth(mxml([[[q("C", 5), q("D", 5), q("E", 5), q("F", 5)], bar[0]]], staves=2)))
        self.assertEqual(v["L"]["max"], 14)  # D3 -> C2

    def test_scale_steps(self):
        v = val("technique.leap-size", synth(mxml([[[q("C", 4), q("D", 4), q("E", 4), q("F", 4)]]], staves=1)))
        self.assertEqual((v["R"]["max"], v["R"]["median"]), (2, 2.0))


class Crossing(unittest.TestCase):
    def two(self, right, left):
        return synth(mxml([[right, left]], staves=2))

    def test_left_above_right_is_a_crossing(self):
        sc = self.two([q("C", 3)] * 4, [q("C", 5, 2)] * 4)
        v = val("technique.hand-crossing", sc)
        self.assertEqual((v["count"], v["moments"]), (1, 4))

    def test_normal_position_is_none(self):
        sc = self.two([q("C", 5)] * 4, [q("C", 3, 2)] * 4)
        self.assertEqual(val("technique.hand-crossing", sc)["count"], 0)

    def test_a_hand_that_encloses_the_other_is_not_crossed(self):
        sc = self.two([q("C", 3), n("C", 5, 4, chord=True), q("C", 3), n("C", 5, 4, chord=True), r(), r()], [q("E", 3, 2)] * 4)
        self.assertEqual(val("technique.hand-crossing", sc)["count"], 0)

    def test_two_separate_crossings(self):
        right = [q("C", 3), q("C", 5), q("C", 3), q("C", 5)]
        left = [q("C", 5, 2), q("C", 3, 2), q("C", 5, 2), q("C", 3, 2)]
        v = val("technique.hand-crossing", self.two(right, left))
        self.assertEqual((v["passages"], v["moments"]), (2, 2))


class Velocity(unittest.TestCase):
    def test_strikes_per_second_at_120(self):
        sc = synth(mxml([[[q("C", 4)] * 4], [[q("C", 4)] * 4]], staves=1, tempo=120))
        v = val("technique.velocity", sc)
        self.assertEqual((v["tempo_qpm"], v["strikes_per_second"]["R"], v["notes_per_second"]), (120.0, 2.0, 2.0))

    def test_a_half_note_beat_unit_is_two_quarters(self):
        sc = synth(mxml([[[q("C", 4)] * 4]], staves=1, tempo=60, beat_unit="half"))
        v = val("technique.velocity", sc)
        self.assertEqual(v["tempo_qpm"], 120.0)

    def test_chord_strikes_once_and_notes_count_each_pitch(self):
        sc = synth(mxml([[[q("C", 4), n("E", 4, 4, chord=True)] * 4]], staves=1, tempo=60))
        v = val("technique.velocity", sc)
        self.assertEqual((v["strikes_per_second"]["R"], v["notes_per_second"]), (1.0, 2.0))

    def test_no_written_tempo_is_unknown(self):
        sc = synth(mxml([[[q("C", 4)] * 4]], staves=1))
        self.assertIn("no tempo", run("technique.velocity", sc).unknown)


if __name__ == "__main__":
    unittest.main()
