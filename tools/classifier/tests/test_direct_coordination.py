"""Tests of direct/coordination.py: synthetic two-hand scores (right hand on staff 1, left on staff 2)."""
import unittest

from direct import _testkit as T
from direct._testkit import mxml, n, r, synth, run


def val(cid, sc):
    res = run(cid, sc)
    assert res.unknown is None, res.unknown
    return res.value


def two(right_bars, left_bars, **kw):
    """right_bars / left_bars: one list of notes per bar."""
    return synth(mxml([[rb, lb] for rb, lb in zip(right_bars, left_bars)], staves=2, **kw))


def q(step, octave, staff=1, **kw):
    return n(step, octave, 4, staff=staff, **kw)


class Synchrony(unittest.TestCase):
    def test_together(self):
        sc = two([[q("C", 5)] * 4], [[q("C", 3, 2)] * 4])
        v = val("coordination.synchrony-share", sc)
        self.assertEqual((v["events"], v["together"], v["offset"], v["alone"]), (4, 4, 0, 0))

    def test_offset_when_the_other_hand_is_holding(self):
        sc = two([[q("C", 5)] * 4], [[n("C", 3, 16, staff=2)]])
        v = val("coordination.synchrony-share", sc)
        self.assertEqual((v["together"], v["offset"], v["alone"]), (1, 3, 0))

    def test_alone_when_the_other_hand_rests(self):
        sc = two([[q("C", 5)] * 4, [q("D", 5)] * 4], [[q("C", 3, 2)] * 4, [r(16, staff=2)]])
        v = val("coordination.synchrony-share", sc)
        self.assertEqual((v["together"], v["offset"], v["alone"]), (4, 0, 4))

    def test_one_hand_is_unknown(self):
        sc = synth(mxml([[[q("C", 5)] * 4]], staves=1))
        for cid in ("coordination.synchrony-share", "coordination.rhythmic-independence", "coordination.unequal-rates",
                    "coordination.register-overlap", "coordination.sustain-vs-move", "coordination.articulation-conflict"):
            self.assertIsNotNone(run(cid, sc).unknown, cid)


class Independence(unittest.TestCase):
    def test_equal_and_different_bars(self):
        right = [[q("C", 5)] * 4, [n("C", 5, 8), n("D", 5, 8)]]
        left = [[q("C", 3, 2)] * 4, [q("C", 3, 2)] * 4]
        v = val("coordination.rhythmic-independence", two(right, left))
        self.assertEqual((v["bars_compared"], v["bars_differ"]), (2, 1))

    def test_rate_ratio(self):
        sc = two([[q("C", 5)] * 4], [[n("C", 3, 16, staff=2)]])
        v = val("coordination.unequal-rates", sc)
        self.assertEqual((v["bars_compared"], v["bars_unequal"], v["max_ratio"], v["faster_R"]), (1, 1, 4.0, 1))

    def test_equal_rates(self):
        sc = two([[q("C", 5)] * 4], [[q("C", 3, 2)] * 4])
        v = val("coordination.unequal-rates", sc)
        self.assertEqual((v["bars_unequal"], v["equal"]), (0, 1))


class Articulation(unittest.TestCase):
    STACC = '<articulations><staccato/></articulations>'
    ACCENT = '<articulations><accent/></articulations>'

    def slurred(self):
        return [q("C", 3, 2, extra='<slur type="start" number="1"/>'), q("D", 3, 2), q("E", 3, 2), q("F", 3, 2, extra='<slur type="stop" number="1"/>')]

    def test_staccato_against_a_slur(self):
        right = [q("C", 5, extra=self.STACC), q("D", 5, extra=self.STACC), q("E", 5, extra=self.STACC), q("F", 5, extra=self.STACC)]
        v = val("coordination.articulation-conflict", two([right], [self.slurred()]))
        self.assertEqual((v["legato_vs_staccato"], v["accent_one_hand"]), (4, 0))

    def test_staccato_in_both_hands_is_no_conflict(self):
        right = [q("C", 5, extra=self.STACC)] * 4
        left = [q("C", 3, 2, extra=self.STACC)] * 4
        self.assertEqual(val("coordination.articulation-conflict", two([right], [left]))["count"], 0)

    def test_accent_in_one_hand(self):
        right = [q("C", 5, extra=self.ACCENT)] + [q("D", 5)] * 3
        left = [q("C", 3, 2)] * 4
        v = val("coordination.articulation-conflict", two([right], [left]))
        self.assertEqual((v["accent_one_hand"], v["count"]), (1, 1))


class RegisterAndHolding(unittest.TestCase):
    def test_ranges_that_touch_do_not_overlap(self):
        sc = two([[q("C", 4), q("E", 4), q("G", 4), q("C", 5)]], [[q("C", 3, 2), q("E", 3, 2), q("G", 3, 2), q("C", 4, 2)]])
        v = val("coordination.register-overlap", sc)
        self.assertEqual((v["bars_compared"], v["bars_overlap"], v["max_overlap"]), (1, 0, 0))

    def test_ranges_that_share_a_third(self):
        sc = two([[q("C", 4), q("E", 4), q("G", 4), q("C", 5)]], [[q("C", 3, 2), q("E", 3, 2), q("G", 3, 2), q("E", 4, 2)]])
        v = val("coordination.register-overlap", sc)
        self.assertEqual((v["bars_overlap"], v["max_overlap"]), (1, 4))

    def test_left_holds_while_right_moves(self):
        sc = two([[q("C", 5)] * 4], [[n("C", 3, 16, staff=2)]])
        v = val("coordination.sustain-vs-move", sc)
        self.assertEqual((v["count"], v["by_hand_holding"]), (1, {"R": 0, "L": 1}))

    def test_both_hands_moving_hold_nothing(self):
        sc = two([[q("C", 5)] * 4], [[q("C", 3, 2)] * 4])
        self.assertEqual(val("coordination.sustain-vs-move", sc)["count"], 0)


if __name__ == "__main__":
    unittest.main()
