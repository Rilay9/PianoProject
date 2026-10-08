"""Tests of direct/texture.py: synthetic scores for the definitions and their near-misses, and real catalogue items for known values.

Real items need the built catalogue (app/public/content, gitignored): the tests skip without it."""
import unittest

from direct import _testkit as T
from direct._testkit import mxml, n, r, synth, run

HAVE_CATALOG = (T.S.CONTENT / "catalog.json").exists()


def val(cid, sc):
    res = run(cid, sc)
    assert res.unknown is None, res.unknown
    return res.value


class Octaves(unittest.TestCase):
    def test_simultaneous_octaves_and_a_run(self):
        sc = synth(mxml([[[n("C", 4), n("C", 5, chord=True)] * 4]], staves=1))
        v = val("texture.octaves", sc)
        self.assertEqual((v["simultaneous"], v["octave_runs"], v["count"]), (4, 1, 4))

    def test_a_seventh_is_not_an_octave(self):
        sc = synth(mxml([[[n("C", 4), n("B", 4, chord=True)] * 4]], staves=1))
        self.assertEqual(val("texture.octaves", sc)["count"], 0)

    def test_broken_octave(self):
        sc = synth(mxml([[[n("C", 3), n("C", 4), n("C", 3), n("C", 4)]]], staves=1))
        v = val("texture.octaves", sc)
        self.assertEqual((v["broken_runs"], v["simultaneous"]), (1, 0))

    def test_a_single_octave_leap_is_not_a_broken_octave(self):
        sc = synth(mxml([[[n("C", 3), n("C", 4), n("D", 4), n("E", 4)]]], staves=1))
        self.assertEqual(val("texture.octaves", sc)["broken_runs"], 0)


class DoubleNotes(unittest.TestCase):
    def test_thirds_and_sixths(self):
        sc = synth(mxml([[[n("C", 4), n("E", 4, chord=True), n("D", 4), n("F", 4, chord=True), n("C", 4), n("A", 4, chord=True), n("D", 4), n("B", 4, chord=True)]]], staves=1))
        v = val("texture.double-notes", sc)
        self.assertEqual((v["thirds"], v["sixths"], v["count"], v["moving"], v["runs"]), (2, 2, 4, 4, 1))

    def test_an_augmented_second_is_not_a_third(self):
        # C-D# sounds a minor third (3 semitones) but is spelled as a second
        sc = synth(mxml([[[n("C", 4), n("D", 4, alter=1, chord=True)] * 2 + [r(), r()]]], staves=1))
        self.assertEqual(val("texture.double-notes", sc)["count"], 0)
        sc = synth(mxml([[[n("C", 4), n("E", 4, alter=-1, chord=True)] * 2 + [r(), r()]]], staves=1))
        self.assertEqual(val("texture.double-notes", sc)["thirds"], 2)


class PowerChord(unittest.TestCase):
    def test_root_and_fifth(self):
        sc = synth(mxml([[[n("C", 3), n("G", 3, chord=True), n("F", 3), n("C", 4, chord=True), n("C", 3), n("G", 3, chord=True), n("C", 4, chord=True), r()]]], staves=1))
        self.assertEqual(val("texture.power-chord", sc)["count"], 3)

    def test_triad_and_fourth_are_not(self):
        sc = synth(mxml([[[n("C", 3), n("E", 3, chord=True), n("G", 3, chord=True), n("C", 3), n("F", 3, chord=True), r(), r()]]], staves=1))
        self.assertEqual(val("texture.power-chord", sc)["count"], 0)


class BlockChordsAndSustained(unittest.TestCase):
    def test_block_chords_need_three_pitches(self):
        sc = synth(mxml([[[n("C", 4), n("E", 4, chord=True), n("G", 4, chord=True), n("C", 4), n("E", 4, chord=True), r(), r()]]], staves=1))
        v = val("texture.block-chords", sc)
        self.assertEqual((v["count"], v["max_simultaneous"]["R"]), (1, 3))

    def test_chord_held_a_bar(self):
        whole = [[n("C", 4, 16), n("E", 4, 16, chord=True), n("G", 4, 16, chord=True)]]
        v = val("texture.sustained", synth(mxml([whole], staves=1)))
        self.assertEqual((v["count"], v["dyads"], v["single_notes"]), (1, 0, 0))

    def test_half_note_chord_is_not_a_bar(self):
        half = [[n("C", 4, 8), n("E", 4, 8, chord=True), n("G", 4, 8, chord=True), n("C", 4, 8), n("E", 4, 8, chord=True), n("G", 4, 8, chord=True)]]
        self.assertEqual(val("texture.sustained", synth(mxml([half], staves=1)))["count"], 0)


class HeldUnderMoving(unittest.TestCase):
    def test_voice_two_moves_under_a_held_note(self):
        bar = [[n("C", 5, 8), n("D", 5, 8)], [n("E", 4, 4, voice=2), n("F", 4, 4, voice=2), n("G", 4, 4, voice=2), n("A", 4, 4, voice=2)]]
        v = val("texture.held-under-moving", synth(mxml([bar], staves=1)))
        self.assertEqual(v["count"], 2)

    def test_one_voice_of_quarters_holds_nothing(self):
        bar = [[n("C", 5), n("D", 5), n("E", 5), n("F", 5)]]
        self.assertEqual(val("texture.held-under-moving", synth(mxml([bar], staves=1)))["count"], 0)


class Between(unittest.TestCase):
    def two_staves(self, right, left):
        return synth(mxml([[right, left]], staves=2))

    def test_contrary_motion(self):
        sc = self.two_staves([n("C", 5), n("D", 5), n("E", 5), n("F", 5)], [n("C", 3, staff=2), n("B", 2, staff=2), n("A", 2, staff=2), n("G", 2, staff=2)])
        v = val("texture.motion", sc)
        self.assertEqual((v["contrary"], v["pairs"]), (3, 3))

    def test_parallel_and_similar(self):
        sc = self.two_staves([n("C", 5), n("D", 5), n("E", 5), n("G", 5)], [n("C", 3, staff=2), n("D", 3, staff=2), n("E", 3, staff=2), n("A", 3, staff=2)])
        v = val("texture.motion", sc)
        self.assertEqual((v["parallel"], v["similar"], v["contrary"]), (2, 1, 0))

    def test_one_hand_is_unknown(self):
        sc = synth(mxml([[[n("C", 5)] * 4]], staves=1))
        self.assertIsNotNone(run("texture.motion", sc).unknown)
        self.assertIsNotNone(run("texture.alternating-hands", sc).unknown)

    def test_hands_in_turn(self):
        sc = self.two_staves([n("C", 5), r(), n("C", 5), r()], [r(staff=2), n("C", 3, staff=2), r(staff=2), n("C", 3, staff=2)])
        v = val("texture.alternating-hands", sc)
        self.assertEqual((v["count"], v["moments"], v["longest_chain"]), (3, 4, 3))

    def test_hands_together_do_not_alternate(self):
        sc = self.two_staves([n("C", 5)] * 4, [n("C", 3, staff=2)] * 4)
        self.assertEqual(val("texture.alternating-hands", sc)["count"], 0)

    def test_triplets_against_eighths_is_a_cross_rhythm(self):
        right = [n("C", 5, 4, tm=(3, 2), type="eighth")] * 3 + [n("D", 5, 12)] * 3
        left = [n("C", 3, 6, staff=2, type="eighth")] * 2 + [n("D", 3, 12, staff=2)] * 3
        v = val("texture.polyrhythm", synth(mxml([[right, left]], staves=2, divisions=12)))
        self.assertEqual((v["count"], v["ratios"]), (1, {"3:2": 1}))

    def test_triplets_in_both_hands_are_not(self):
        right = [n("C", 5, 4, tm=(3, 2), type="eighth")] * 3 + [n("D", 5, 12)] * 3
        left = [n("C", 3, 4, staff=2, tm=(3, 2), type="eighth")] * 3 + [n("D", 3, 12, staff=2)] * 3
        v = val("texture.polyrhythm", synth(mxml([[right, left]], staves=2, divisions=12)))
        self.assertEqual(v["count"], 0)


@unittest.skipUnless(HAVE_CATALOG, "needs the built catalogue")
class RealItems(unittest.TestCase):
    def test_placeholder(self):
        self.assertTrue(T.catalogue())


if __name__ == "__main__":
    unittest.main()
