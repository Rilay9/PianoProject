"""
The harmony and form rules (tools/classifier/rules/harmony.py, form.py) on real catalogue items: for each rule the
positive items, and the near-misses a rule could plausibly over-match (docs/classifier/rules/harmony.md lists why
each item is here). Reads the built catalogue (app/public/content/, a build output); skipped where it is absent.

    python -m unittest tools.classifier.tests.test_rules_harmony
"""
from __future__ import annotations

import json
import sys
import unittest
from functools import lru_cache
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "tools/classifier"))
import score as S  # noqa: E402
from rules import form as F  # noqa: E402,F401  (registers the form ids)
from rules import harmony as H  # noqa: E402,F401

CATALOG = ROOT / "app/public/content/catalog.json"


@lru_cache(maxsize=None)
def _catalog() -> dict:
    return {i["id"]: i for i in json.loads(CATALOG.read_text(encoding="utf-8")) if i.get("file")}


@lru_cache(maxsize=64)
def _score(iid: str) -> S.Score:
    return S.load(_catalog()[iid])


def run(cid: str, iid: str) -> S.Result:
    return S.REGISTRY[cid](_score(iid))


def labels(r: S.Result) -> list:
    return [c[2] for c in r.value["chords"]]


@unittest.skipUnless(CATALOG.exists(), "the built catalogue is absent (app/public/content/ is a build output)")
class Roman(unittest.TestCase):
    def test_symbols_ii_v_i(self):
        r = run("harmony.roman", "exercise.ii-v-i.c")
        self.assertEqual(r.value["key"], "C major")
        self.assertEqual(labels(r), ["ii7", "V7", "Imaj7"])
        self.assertEqual(r.provenance, "one-witness")

    def test_symbols_tritone_substitute(self):
        self.assertEqual(labels(run("harmony.roman", "exercise.tritone-sub.c")), ["ii7", "bII7", "Imaj7"])

    def test_symbols_minor_key(self):
        r = run("harmony.roman", "exercise.walking-bass.c.minor-blues")
        self.assertEqual(r.value["key"], "C minor")
        self.assertEqual(labels(r)[0][0], "i")

    def test_notes_block_chords(self):
        r = run("harmony.roman", "exercise.cadence.c.root")
        self.assertEqual(r.value["source"], "notes")
        self.assertEqual(labels(r), ["I", "IV", "V7", "I"])
        self.assertEqual(r.provenance, "inferred")

    def test_melody_only_is_unknown(self):
        r = run("harmony.roman", "exercise.blues-scale.c.1oct.right")
        self.assertIsNotNone(r.unknown)
        self.assertIn("melody only", r.unknown)

    def test_scale_in_two_hands_is_unknown(self):
        # two lines, but a scale shows no chords: the notes path must not guess one per beat
        r = run("harmony.roman", "exercise.scale.a-harmonic-minor.1oct.similar.both.2")
        self.assertIn("does not show the chords", r.unknown or "")

    def test_bass_line_under_a_riff_is_unknown(self):
        # Blues Riff in C: one bass note a bar under a melody; the notes do not show the chords
        self.assertIsNotNone(run("harmony.roman", "song.blues.blues-riff-in-c.pdmx").unknown)


@unittest.skipUnless(CATALOG.exists(), "the built catalogue is absent")
class MinorForm(unittest.TestCase):
    def test_harmonic(self):
        self.assertEqual(run("key.minor-form", "exercise.scale.a-harmonic-minor.1oct.similar.both.2").value["forms"], ["harmonic"])

    def test_melodic(self):
        self.assertIn("melodic", run("key.minor-form", "exercise.scale.a-melodic-minor.1oct.similar.right.2").value["forms"])

    def test_natural(self):
        self.assertEqual(run("key.minor-form", "exercise.scale.a-natural-minor.1oct.similar.both.2").value["forms"], ["natural"])

    def test_major_has_no_minor_form(self):
        v = run("key.minor-form", "exercise.scale.c-major.1oct.similar.both.2").value
        self.assertEqual((v["mode"], v["forms"]), ("major", []))


@unittest.skipUnless(CATALOG.exists(), "the built catalogue is absent")
class Collection(unittest.TestCase):
    def test_blues_scale(self):
        self.assertEqual(run("scale.collection", "exercise.blues-scale.c.1oct.right").value["all"], "blues scale on C")

    def test_minor_pentatonic(self):
        self.assertEqual(run("scale.collection", "exercise.pentatonic.a.pentatonic").value["all"], "minor pentatonic on A")

    def test_five_finger_is_not_pentatonic(self):
        # five pitch classes, but C D E F G is no named five-note collection
        self.assertIn("no named collection", run("scale.collection", "exercise.five-finger.c-major.right").value["all"])

    def test_boogie_figure_is_not_a_pentatonic_passage(self):
        # red first: the shuffle bass's root-fifth-sixth over C7 and F7 sounds an F pentatonic set in bars 5-8
        v = run("scale.collection", "exercise.blues.twelve-bar-shuffle.c").value
        self.assertNotIn("passages", v)

    def test_quartal_chords_are_not_a_scale(self):
        self.assertIn("(no scale run)", run("scale.collection", "exercise.open-voicing.c.quartal").value["R"])


@unittest.skipUnless(CATALOG.exists(), "the built catalogue is absent")
class Progression(unittest.TestCase):
    def test_ii_v_i_major(self):
        self.assertIn("ii-V-I", run("harmony.progression", "exercise.ii-v-i.c").value)

    def test_ii_v_i_minor_and_local(self):
        v = run("harmony.progression", "song.jazz.kenny-dorham-blue-bossa.pdmx").value
        self.assertIn("ii-V-i", v)
        self.assertTrue(any(k.startswith("ii-V-I (local") for k in v))  # the bridge's move to D flat

    def test_named_four_chord(self):
        v = run("harmony.progression", "exercise.loop4.c.root").value
        self.assertIn("I-V-vi-IV", v)
        self.assertFalse(any(k.startswith("four-chord loop") for k in v))  # one pass is not a loop
        self.assertNotIn("I-IV-V only", v)

    def test_primary_chords(self):
        self.assertIn("I-IV-V only", run("harmony.progression", "exercise.cadence.c.root").value)

    def test_turnaround_is_not_a_home_ii_v_i(self):
        v = run("harmony.progression", "exercise.turnaround.c.i-vi-ii-v").value
        self.assertNotIn("ii-V-I", v)  # it ends on V: no arrival on I inside the item


@unittest.skipUnless(CATALOG.exists(), "the built catalogue is absent")
class Applied(unittest.TestCase):
    def test_chromatic_approach_and_tritone_sub(self):
        v = run("harmony.applied", "exercise.passing-chord.c").value
        self.assertEqual(v.get("chromatic approach"), 2)
        self.assertEqual(v.get("subV7"), 1)

    def test_tritone_sub(self):
        self.assertIn("subV7", run("harmony.applied", "exercise.tritone-sub.c").value)

    def test_blues_tonic_seventh_is_not_applied(self):
        # red first: C7 to F7 in a C blues would read as V7/IV; the blues' I7 is the home chord
        self.assertEqual(run("harmony.applied", "exercise.blues.twelve-bar-shuffle.c").value, {})

    def test_diatonic_ii_v_i_has_nothing_applied(self):
        self.assertEqual(run("harmony.applied", "exercise.ii-v-i.c").value, {})


@unittest.skipUnless(CATALOG.exists(), "the built catalogue is absent")
class Voicing(unittest.TestCase):
    def test_types(self):
        for iid, want in (("exercise.voicing7.c.shell", "R:shell"), ("exercise.voicing7.c.rootless-a", "R:rootless"),
                          ("exercise.voicing7.c.rootless-b", "R:rootless"), ("exercise.voicing7.c.close", "R:close"),
                          ("exercise.open-voicing.c.quartal", "R:quartal"), ("exercise.open-voicing.c.add9", "R:open"),
                          ("exercise.ii-v-i.c", "R:shell (split hands)")):
            with self.subTest(iid=iid):
                self.assertEqual(list(run("harmony.voicing", iid).value), [want])

    def test_octave_doubled_triad_is_close(self):
        # C4 F4 G4 C5: the upper notes lie within an octave; the doubled root does not make it open
        self.assertEqual(list(run("harmony.voicing", "exercise.open-voicing.c.sus4").value), ["R:close"])

    def test_no_symbols_is_unknown(self):
        self.assertIn("no chord symbols", run("harmony.voicing", "exercise.cadence.c.root").unknown or "")


@unittest.skipUnless(CATALOG.exists(), "the built catalogue is absent")
class Bass(unittest.TestCase):
    def test_anticipated_bass(self):
        self.assertGreater(run("harmony.bass-behaviour", "exercise.tumbao.c").value["anticipations"], 0)

    def test_root_on_every_change_no_anticipation(self):
        v = run("harmony.bass-behaviour", "exercise.blues.twelve-bar-shuffle.c").value
        self.assertEqual((v["root_on_change"], v["anticipations"], v["pedal_points"]), (1.0, 0, 0))

    def test_slash_bass(self):
        self.assertGreater(run("harmony.bass-behaviour", "exercise.slash-bass.c").value["slash_bass_on_change"], 0)


@unittest.skipUnless(CATALOG.exists(), "the built catalogue is absent")
class WalkUp(unittest.TestCase):
    def test_walk_up(self):
        self.assertEqual(run("texture.bass-walk-up", "exercise.walkup.c").value["walk_ups"], 2)

    def test_root_progression_by_step_is_not_a_walk_up(self):
        # red first: A, B, C sharp under I, ii, iii (one bass note per chord) climbs by step into a root
        self.assertEqual(run("texture.bass-walk-up", "exercise.voicing.a").value["walk_ups"], 0)
        self.assertEqual(run("texture.bass-walk-up", "exercise.modal-vamp.a").value["walk_ups"], 0)


@unittest.skipUnless(CATALOG.exists(), "the built catalogue is absent")
class MelodyRelation(unittest.TestCase):
    def test_guide_tones_and_blue_seventh(self):
        v = run("melody.chord-relation", "exercise.blues.twelve-bar-shuffle.c").value
        self.assertEqual(v["strong_beat_chord_tones"], 1.0)
        self.assertGreater(v["blue"]["b7"], 0)

    def test_no_melody_is_unknown(self):
        self.assertIn("no melody", run("melody.chord-relation", "exercise.cadence.c.root").unknown or "")


@unittest.skipUnless(CATALOG.exists(), "the built catalogue is absent")
class Cadence(unittest.TestCase):
    def test_imperfect_authentic(self):
        # I IV V7 I with G on top at the end: authentic, not perfect
        self.assertEqual(run("harmony.cadence", "exercise.cadence.c.root").value["cadences"][-1][2], "imperfect authentic")

    def test_plagal(self):
        self.assertEqual(run("harmony.cadence", "exercise.cadence.c.plagal").value["cadences"][-1][2], "plagal")

    def test_half(self):
        self.assertEqual(run("harmony.cadence", "exercise.blues.twelve-bar-shuffle.c").value["cadences"][-1][2], "half")


@unittest.skipUnless(CATALOG.exists(), "the built catalogue is absent")
class TwelveBar(unittest.TestCase):
    def test_standard_two_witnesses(self):
        r = run("form.twelve-bar", "exercise.blues.twelve-bar-shuffle.c")
        self.assertEqual((r.value["choruses"], r.value["variants"]), (1, ["standard"]))
        self.assertEqual(r.provenance, "two-witnesses")

    def test_minor(self):
        self.assertEqual(run("form.twelve-bar", "exercise.walking-bass.c.minor-blues").value["variants"], ["minor"])

    def test_quick_iv(self):
        self.assertEqual(run("form.twelve-bar", "song.blues.riverside-blues").value["variants"], ["quick IV"])

    def test_bass_roots_when_the_notes_hide_the_chords(self):
        v = run("form.twelve-bar", "song.blues.blues-riff-in-c.pdmx").value
        self.assertEqual((v["choruses"], v["basis"]), (1, "downbeat bass as root"))

    def test_near_misses(self):
        # a minor ii-V-i walking line; an eight-bar song called a blues; a twelve-bar study that is not a blues
        for iid in ("exercise.walking-bass.c.ii-v-i", "song.pop.careless-love-blues.pdmx", "song.blues.st-james-infirmary",
                    "exercise.study.metre-compound.e-flat-major.6-8.12bar.blocked.01"):
            with self.subTest(iid=iid):
                self.assertEqual(run("form.twelve-bar", iid).value["choruses"], 0)


@unittest.skipUnless(CATALOG.exists(), "the built catalogue is absent")
class Turnaround(unittest.TestCase):
    def test_i_vi_ii_v(self):
        self.assertEqual(run("form.turnaround", "exercise.turnaround.c.i-vi-ii-v").value["patterns"], {"Imaj7-vi7-ii7-V7": 1})

    def test_blues_bars_eleven_twelve(self):
        self.assertEqual(run("form.turnaround", "exercise.blues.twelve-bar-shuffle.c").value["count"], 1)

    def test_final_cadence_is_not_a_turnaround(self):
        self.assertEqual(run("form.turnaround", "exercise.cadence.c.root").value["count"], 0)


@unittest.skipUnless(CATALOG.exists(), "the built catalogue is absent")
class Forms(unittest.TestCase):
    def test_classic_rag(self):
        v = run("form.multi-strain", "song.ragtime.joplin-maple-leaf-rag").value
        self.assertEqual((v["multi_strain"], v["trio_in_subdominant"]), (True, True))
        self.assertEqual(v["sections"], [16, 16, 16, 16, 16])

    def test_binary_minuet_is_not_multi_strain(self):
        self.assertFalse(run("form.multi-strain", "song.classical.bach-little-prelude-in-c-major-bwv-933.pdmx").value["multi_strain"])

    def test_aaba(self):
        for iid in ("song.pop.frank-sinatra-let-it-snow-leadsheet.pdmx", "song.jazz.george-shearing-lullaby-of-birdland.pdmx"):
            with self.subTest(iid=iid):
                self.assertEqual(run("form.thirty-two-bar", iid).value["form"], "AABA")

    def test_not_aaba(self):
        # two sixteen-bar halves (A B A B'); a rounded binary with repeats, A A B A B A
        for iid in ("song.jazz.bart-howard-fly-me-to-the-moon.pdmx", "song.classical.burgmuller-burgmuller-arabesque-op-100-no-2.pdmx"):
            with self.subTest(iid=iid):
                self.assertEqual(run("form.thirty-two-bar", iid).value["form"], "not AABA")

    def test_binary(self):
        self.assertEqual(run("form.binary-ternary", "song.classical.bach-little-prelude-in-c-major-bwv-933.pdmx").value, "binary")

    def test_unmarked_is_unknown(self):
        self.assertIsNotNone(run("form.binary-ternary", "exercise.blues.twelve-bar-shuffle.c").unknown)


if __name__ == "__main__":
    unittest.main()
