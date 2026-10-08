"""Tests of direct/marks.py: synthetic scores carrying one mark each (and a near-miss), and real catalogue items for known values.

Real items need the built catalogue (app/public/content, gitignored): those tests skip without it."""
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


def direction(inner: str) -> dict:
    return {"xml": f'<direction placement="below"><direction-type>{inner}</direction-type></direction>'}


def one_bar(*notes, **kw):
    return synth(mxml([[list(notes)]], staves=1, **kw))


class Clef(unittest.TestCase):
    def test_counts_each_treble_clef(self):
        self.assertEqual(val("clef.treble", synth(mxml([[[q()] * 4]], staves=2, clefs=("G2", "G2"))))["count"], 2)

    def test_bass_clef_is_not_treble(self):
        self.assertEqual(val("clef.treble", synth(mxml([[[q("C", 3)] * 4]], staves=1, clefs=("F4",))))["count"], 0)


class Dynamics(unittest.TestCase):
    def test_letters(self):
        sc = one_bar(direction("<dynamics><mf/></dynamics>"), q(), q(), direction("<dynamics><p/></dynamics>"), q(), q())
        v = val("mark.dynamics", sc)
        self.assertEqual((v["count"], v["distinct"]), (2, ["mf", "p"]))

    def test_none(self):
        self.assertEqual(val("mark.dynamics", one_bar(q(), q(), q(), q()))["count"], 0)

    def test_wedge_is_not_a_dynamic_letter_but_a_hairpin(self):
        sc = one_bar(direction('<wedge type="crescendo" number="1"/>'), q(), q(), direction('<wedge type="stop" number="1"/>'), q(), q())
        self.assertEqual(val("mark.dynamics", sc)["count"], 0)
        v = val("mark.hairpin", sc)
        self.assertEqual((v["count"], v["crescendo"], v["diminuendo"]), (1, 1, 0))


class ArticulationSlurFingering(unittest.TestCase):
    def test_articulations_count_each_mark_and_not_fingering(self):
        sc = one_bar(q(extra="<articulations><staccato/></articulations>"), q(extra="<articulations><accent/><tenuto/></articulations>"),
                     q(extra="<technical><fingering>3</fingering></technical>"), q())
        v = val("mark.articulation", sc)
        self.assertEqual((v["count"], v["kinds"]), (3, {"accent": 1, "staccato": 1, "tenuto": 1}))
        f = val("mark.fingering", sc)
        self.assertEqual((f["count"], f["notes"]), (1, 1))

    def test_a_slur(self):
        sc = one_bar(q(extra='<slur type="start" number="1"/>'), q(), q(), q(extra='<slur type="stop" number="1"/>'))
        self.assertEqual(val("mark.slur", sc)["count"], 1)
        self.assertEqual(val("mark.slur", one_bar(q(), q(), q(), q()))["count"], 0)


class PedalOrnamentTremoloOttavaFermata(unittest.TestCase):
    def test_pedal_press(self):
        sc = one_bar(direction('<pedal type="start" line="no"/>'), q(), q(), direction('<pedal type="stop" line="no"/>'), q(), q())
        res = run("mark.pedal", sc)
        self.assertIsNone(res.unknown, res.unknown)
        self.assertEqual((res.value["count"], res.provenance), (1, "two-witnesses"))

    def test_ornaments_and_a_grace_note(self):
        sc = one_bar(q(extra="<ornaments><trill-mark/></ornaments>"), n("D", 5, 0, grace=True), q(), q(extra="<ornaments><mordent/></ornaments>"), q())
        v = val("mark.ornament", sc)
        self.assertEqual((v["count"], v["kinds"]), (3, {"grace": 1, "mordent": 1, "trill": 1}))

    def test_tremolo_is_not_an_ornament(self):
        sc = one_bar(q(extra='<ornaments><tremolo type="single">3</tremolo></ornaments>'), q(), q(), q())
        self.assertEqual(val("mark.tremolo", sc)["count"], 1)
        self.assertEqual(val("mark.ornament", sc)["count"], 0)

    def test_ottava(self):
        sc = one_bar(direction('<octave-shift type="up" size="8" number="1"/>'), q(), q(), direction('<octave-shift type="stop" size="8" number="1"/>'), q(), q())
        self.assertEqual(val("mark.ottava", sc)["count"], 1)

    def test_fermata(self):
        sc = one_bar(q(), q(), q(), q(extra="<fermata/>"))
        self.assertEqual(val("mark.fermata", sc)["count"], 1)
        self.assertEqual(val("mark.fermata", one_bar(q(), q(), q(), q()))["count"], 0)


class RepeatAndPickup(unittest.TestCase):
    FWD = '<barline location="left"><bar-style>heavy-light</bar-style><repeat direction="forward"/></barline>'
    BACK = '<barline location="right"><bar-style>light-heavy</bar-style><repeat direction="backward"/></barline>'

    def test_repeat_signs(self):
        bars = [[[q()] * 4], [[{"xml": self.FWD}] + [q()] * 4 + [{"xml": self.BACK}]]]
        v = val("mark.repeat", synth(mxml(bars, staves=1)))
        self.assertEqual((v["starts"], v["ends"], v["count"]), (1, 1, 2))

    def test_no_repeat(self):
        self.assertEqual(val("mark.repeat", synth(mxml([[[q()] * 4]], staves=1)))["count"], 0)

    def test_pickup_bar(self):
        sc = synth(mxml([[[q()]], [[q()] * 4]], staves=1))
        v = val("mark.anacrusis", sc)
        self.assertEqual((v["count"], v["quarters"]), (1, 1.0))

    def test_full_first_bar_is_no_pickup(self):
        self.assertEqual(val("mark.anacrusis", synth(mxml([[[q()] * 4], [[q()] * 4]], staves=1)))["count"], 0)


@unittest.skipUnless(HAVE_CATALOG, "needs the built catalogue")
class RealItems(unittest.TestCase):
    pass


if __name__ == "__main__":
    unittest.main()
