"""Tests of direct/harmony.py: chord symbols written as <harmony> in synthetic scores."""
import unittest

from direct import _testkit as T
from direct._testkit import mxml, n, r, synth, run

HAVE_CATALOG = (T.S.CONTENT / "catalog.json").exists()


def val(cid, sc):
    res = run(cid, sc)
    assert res.unknown is None, res.unknown
    return res.value


def h(step, kind="major", bass=None, alter=None, degrees=()):
    a = f"<root-alter>{alter}</root-alter>" if alter else ""
    b = f"<bass><bass-step>{bass}</bass-step></bass>" if bass else ""
    d = "".join(f"<degree><degree-value>{v}</degree-value><degree-alter>{al}</degree-alter><degree-type>{t}</degree-type></degree>" for v, al, t in degrees)
    return {"xml": f"<harmony><root><root-step>{step}</root-step>{a}</root><kind>{kind}</kind>{b}{d}</harmony>"}


def score(*symbols_per_bar):
    bars = []
    for syms in symbols_per_bar:
        bar = []
        for s in syms:
            bar += [s, n("C", 5)]
        bars.append([bar + [n("D", 5)] * (4 - len(syms))])
    return synth(mxml(bars, staves=1))


class ChordQuality(unittest.TestCase):
    def test_classes(self):
        sc = score([h("C"), h("G", "dominant")], [h("A", "minor"), h("D", "minor-seventh")], [h("G", "suspended-fourth"), h("C", "major-ninth")])
        v = val("harmony.chord-quality", sc)
        self.assertEqual(v["count"], 6)
        self.assertEqual(v["classes"], {"extended": 1, "seventh": 2, "sus": 1, "triad": 2})
        self.assertEqual(v["kinds"]["dominant-seventh"], 1)

    def test_degrees_are_counted(self):
        sc = score([h("C", degrees=[(9, 0, "add")])])
        self.assertEqual(val("harmony.chord-quality", sc)["with_degrees"], 1)

    def test_no_symbols_is_unknown_not_zero(self):
        sc = synth(mxml([[[n("C", 5)] * 4]], staves=1))
        for cid in ("harmony.chord-quality", "harmony.rhythm", "harmony.inversion"):
            self.assertEqual(run(cid, sc).unknown, "no chord symbols")

    def test_text_and_no_chord_are_not_chords(self):
        text = {"xml": "<harmony><root><root-step>C</root-step></root><kind text=\"rit.\">other</kind></harmony>"}
        nc = {"xml": "<harmony><root><root-step>C</root-step></root><kind>none</kind></harmony>"}
        sc = score([text, nc, h("C")])
        self.assertEqual(val("harmony.chord-quality", sc)["count"], 1)


class HarmonyRhythm(unittest.TestCase):
    def test_changes_per_bar(self):
        sc = score([h("C"), h("G")], [h("G")], [h("A", "minor"), h("F")])
        v = val("harmony.rhythm", sc)
        # symbols C G | G | Am F : changes at G (bar 0), none in bar 1 (G repeated), Am and F in bar 2
        self.assertEqual((v["symbols"], v["changes"], v["per_bar_max"], v["bars_with_changes"]), (5, 3, 2, 2))

    def test_a_repeated_chord_is_not_a_change(self):
        sc = score([h("C"), h("C")], [h("C")])
        self.assertEqual(val("harmony.rhythm", sc)["changes"], 0)


class Inversion(unittest.TestCase):
    def test_slash_chords(self):
        sc = score([h("C", bass="E"), h("G", "dominant", bass="B")], [h("C", bass="D"), h("F")])
        v = val("harmony.inversion", sc)
        self.assertEqual((v["count"], v["of"], v["inversion"], v["slash_other"]), (3, 4, 2, 1))

    def test_root_position_is_not_a_slash(self):
        sc = score([h("C"), h("G")])
        self.assertEqual(val("harmony.inversion", sc)["count"], 0)

    def test_a_bass_equal_to_the_root_is_not_a_slash(self):
        sc = score([h("C", bass="C")])
        self.assertEqual(val("harmony.inversion", sc)["count"], 0)


@unittest.skipUnless(HAVE_CATALOG, "needs the built catalogue")
class RealItems(unittest.TestCase):
    pass


if __name__ == "__main__":
    unittest.main()
