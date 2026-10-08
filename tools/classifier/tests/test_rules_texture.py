"""
The accompaniment-texture and technique-figure rules (docs/classifier/rules/texture.md) on real
catalogue items: per rule, positives and near-misses. Items marked "red first" are the
near-misses the first draft of the rule over-matched on the catalogue run; the rule was changed
for them, and these tests hold that line.

Reads the built catalogue (app/public/content, written by the content build, not in git); the
suite skips when it is absent.

    python -m unittest tools/classifier/tests/test_rules_texture.py   (from the repository root)
"""
from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(HERE))

import score as S  # noqa: E402
import rules.texture  # noqa: E402,F401  (registers the texture ids)
import rules.technique  # noqa: E402,F401  (registers the technique ids)

CATALOG = S.CONTENT / "catalog.json"
_ITEMS: dict = {}
_SCORES: dict = {}


def measure(item_id: str, cid: str) -> dict:
    if not _ITEMS:
        _ITEMS.update({i["id"]: i for i in json.loads(CATALOG.read_text(encoding="utf-8"))})
    if item_id not in _SCORES:
        _SCORES[item_id] = S.load(_ITEMS[item_id])
    return S.REGISTRY[cid](_SCORES[item_id]).to_json()


@unittest.skipUnless(CATALOG.exists(), "the built catalogue (app/public/content) is absent")
class Base(unittest.TestCase):
    def present(self, item_id: str, cid: str, bars: list[int] | None = None) -> dict:
        r = measure(item_id, cid)
        self.assertIn("value", r, f"{cid} on {item_id}: {r}")
        self.assertTrue(r["value"]["present"], f"{cid} should find it in {item_id}: {r}")
        for b in bars or []:
            self.assertIn(b, r.get("where", []), f"{cid} on {item_id}: bar {b} missing from {r.get('where')}")
        return r

    def absent(self, item_id: str, cid: str, bars: list[int] | None = None) -> dict:
        """Not present; with bars, only those bars are checked absent from where."""
        r = measure(item_id, cid)
        self.assertIn("value", r, f"{cid} on {item_id}: {r}")
        if bars is None:
            self.assertFalse(r["value"]["present"], f"{cid} should not find it in {item_id}: {r}")
        for b in bars or []:
            self.assertNotIn(b, r.get("where", []), f"{cid} on {item_id}: bar {b} should not be in {r.get('where')}")
        return r


class Alberti(Base):
    cid = "texture.alberti"

    def test_generated_alberti(self):
        self.present("exercise.accompaniment.alberti.c-major.both", self.cid, [0, 1, 2, 3])

    def test_mozart_k545_opening(self):
        self.present("song.classical.mozart-k545-i", self.cid, [0, 1, 2, 3])

    def test_generic_broken_chord_is_not_alberti(self):
        self.absent("exercise.accompaniment.broken.c-major.left", self.cid)

    def test_hanon_5_one_alberti_shaped_group_a_bar(self):  # red first
        self.absent("exercise.hanon.05.right", self.cid)

    def test_pachelbel_broken_chords(self):
        self.absent("song.classical.pachelbel-canon-d", self.cid)


class BrokenChord(Base):
    cid = "texture.broken-chord"

    def test_generated_broken_chord(self):
        r = self.present("exercise.accompaniment.broken.c-major.left", self.cid, [0, 1, 2, 3])
        self.assertEqual(r["value"]["not_alberti_bars"], 4)

    def test_bach_prelude_right_hand_entering_after_a_rest(self):
        self.present("song.classical.bach-wtc1-prelude-1", self.cid, [0, 1])

    def test_alberti_is_a_broken_chord_but_not_another_kind(self):
        r = self.present("exercise.accompaniment.alberti.c-major.both", self.cid)
        self.assertEqual(r["value"]["not_alberti_bars"], 0)

    def test_broken_seventh_steps_from_seventh_to_root(self):  # red first: B flat-C was refused
        self.present("exercise.broken7.c-dominant7.both", self.cid, [0, 1])

    def test_walking_bass_through_chord_tones(self):  # red first
        self.absent("exercise.walking-bass.a.blues", self.cid)

    def test_waltz_block_chords(self):
        self.absent("exercise.accompaniment.waltz.c-major.both", self.cid)


class Arpeggio(Base):
    cid = "texture.arpeggio"

    def test_generated_two_octave_arpeggio(self):
        self.present("exercise.arpeggio.c-major.2oct.both", self.cid, [0, 1])

    def test_chopin_nocturne_op9_1_left_hand(self):
        self.present("song.classical.chopin-nocturne-op9-1", self.cid)

    def test_broken_chord_within_an_octave(self):
        self.absent("exercise.accompaniment.broken.c-major.left", self.cid)

    def test_alberti(self):
        self.absent("exercise.accompaniment.alberti.c-major.both", self.cid)


class WaltzBass(Base):
    cid = "texture.waltz-bass"

    def test_generated_waltz(self):
        self.present("exercise.accompaniment.waltz.c-major.both", self.cid, [0, 1, 2, 3])

    def test_joplin_waltz(self):
        self.present("song.ragtime.joplin-harmony-club-waltz", self.cid)

    def test_greensleeves_waltz(self):
        self.present("song.folk.greensleeves.waltz", self.cid)

    def test_duple_oom_pah(self):
        self.absent("exercise.oompah.c.octave", self.cid)

    def test_minuet_left_hand_in_single_notes(self):
        self.absent("song.classical.bach-menuet-bwv-anh-113.pdmx", self.cid)


class OomPahAndStride(Base):
    def test_generated_oom_pah(self):
        self.present("exercise.oompah.c.octave", "texture.oom-pah", list(range(8)))

    def test_entertainer_oom_pah(self):
        self.present("song.ragtime.joplin-entertainer", "texture.oom-pah")

    def test_triple_waltz_is_not_oom_pah(self):
        self.absent("exercise.accompaniment.waltz.c-major.both", "texture.oom-pah")

    def test_two_dyads_are_not_bass_and_chord(self):  # red first: Moonlight III bar 46
        self.absent("song.classical.beethoven-moonlight-iii", "texture.oom-pah", [46])

    def test_tenth_oom_pah_leaps_every_bar(self):
        self.present("exercise.oompah.c.tenth", "texture.stride", list(range(8)))

    def test_octave_oom_pah_leaps_only_from_the_root(self):
        # C2 to C3-E3-G3 spans a twelfth (a leap); G2 to C3-E3-G3 spans an octave (no leap)
        self.present("exercise.oompah.c.octave", "texture.stride", [0, 2, 4, 6])
        self.absent("exercise.oompah.c.octave", "texture.stride", [1, 3, 5, 7])

    def test_maple_leaf_rag(self):
        self.present("song.ragtime.joplin-maple-leaf-rag", "texture.stride")

    def test_stride_is_a_subset_of_oom_pah(self):
        for item in ("song.ragtime.joplin-maple-leaf-rag", "exercise.oompah.c.octave", "song.ragtime.joplin-entertainer"):
            s = set(measure(item, "texture.stride").get("where", []))
            o = set(measure(item, "texture.oom-pah").get("where", []))
            self.assertLessEqual(s, o, item)


class Boogie(Base):
    cid = "texture.boogie-bass"

    def test_generated_pinetop(self):
        self.present("exercise.boogie.c.pinetop", self.cid, [0, 1, 2, 3])

    def test_generated_root_fifth_under_a_dominant_seventh(self):
        self.present("exercise.boogie.c.root-fifth", self.cid, [0, 1, 2, 3])

    def test_twelve_bar_shuffle(self):
        self.present("exercise.blues.twelve-bar-shuffle.c", self.cid)

    def test_real_boogie(self):
        self.present("song.folk.boogie-woogie.pdmx", self.cid)

    def test_pachelbel_two_broken_chords_a_bar(self):  # red first
        self.absent("song.classical.pachelbel-canon-d", self.cid)

    def test_ode_to_joy_eighths_over_two_chords(self):  # red first
        self.absent("song.classical.beethoven-ode-a-alegria-nona-sinfonia.pdmx", self.cid)

    def test_isolated_root_sixth_bars(self):  # red first: Moonlight III bars 5, 68, 107, 160
        self.absent("song.classical.beethoven-moonlight-iii", self.cid)

    def test_alberti_in_eighths(self):
        self.absent("exercise.accompaniment.alberti.c-major.both", self.cid)

    def test_tonic_and_subdominant_broken_in_eighths(self):  # red first: Duvernoy Op. 176 No. 3, G-B-D-B G-C-E-C
        self.absent("song.classical.duvernoy-etude-op-176-no-3.pdmx", self.cid)

    def test_right_hand_fifths_over_a_held_bass(self):
        self.absent("exercise.ostinato.a.fifths", self.cid)


class Ostinato(Base):
    cid = "texture.ostinato"

    def test_generated_ostinato(self):
        self.present("exercise.ostinato.a.arpeggio", self.cid, list(range(8)))

    def test_carol_of_the_bells(self):
        self.present("song.holiday.carol-of-the-bells", self.cid)

    def test_boogie_on_one_chord_is_an_ostinato_bass(self):
        self.present("exercise.boogie.c.pinetop", self.cid)

    def test_silent_night_phrase_sung_twice(self):  # red first
        self.absent("song.classical.1818-franz-xaver-gruber-silent-night.pdmx", self.cid)

    def test_alberti_following_the_harmony(self):
        self.absent("exercise.accompaniment.alberti.c-major.both", self.cid)

    def test_too_short_is_unknown(self):
        self.assertIn("unknown", measure("exercise.tremolo-third.c.right", self.cid))


class PedalPoint(Base):
    cid = "texture.pedal-point"

    def test_bach_prelude_dominant_pedal(self):
        # the G pedal of bars 24-30 (0-based 23-29); bar 31 (30) starts the C pedal
        r = self.present("song.classical.bach-wtc1-prelude-1", self.cid, [23, 24, 25, 26, 27, 28, 29])
        self.assertNotIn(22, r["where"])

    def test_scale_in_sixteenths_over_a_held_chord(self):  # red first: Lemoine Op. 37 No. 12 bars 6-7
        self.absent("song.classical.lemoine-etude-op-37-no-12.pdmx", self.cid, [6, 7])

    def test_passing_note_over_a_dominant_seventh(self):  # red first: the study's C over G7
        self.absent("exercise.study.position-shift.c-major.4-4.16bar.blocked.03", self.cid)

    def test_root_fifth_boogie_under_c7(self):  # red first: C under E-G-B flat is C7
        self.absent("exercise.boogie.c.root-fifth", self.cid)

    def test_drone_under_its_own_triad(self):
        self.absent("exercise.ostinato.a.arpeggio", self.cid)

    def test_sustain_pedal_family(self):
        self.absent("exercise.pedal.c", self.cid)


class FourToTheBar(Base):
    cid = "texture.four-to-the-bar"

    def test_generated_four_on_the_floor(self):
        self.present("exercise.comping.c.four-on-the-floor", self.cid, [0, 1, 2, 3])

    def test_chopin_funeral_march(self):
        self.present("song.classical.chopin-sonata-2-3.nifc", self.cid, [0, 1, 2, 3])

    def test_tonic_and_dominant_on_every_beat(self):
        self.present("song.classical.bertini-etude-in-g-minor-op-29-no-3.pdmx", self.cid, [8, 9])

    def test_bass_dyad_under_two_chords(self):  # red first: the tango's G2-D3 on one and four
        self.absent("song.pop.hans-otto-borgmann-tango-notturno.pdmx", self.cid, [22])

    def test_off_beat_comp(self):
        self.absent("exercise.comping.c.off-beats", self.cid)

    def test_oom_pah(self):
        self.absent("exercise.oompah.c.octave", self.cid)


class MelodyInChords(Base):
    cid = "texture.melody-in-chords"

    def test_shearing_block_chords(self):
        r = self.present("song.jazz.george-shearing-lullaby-of-birdland.pdmx", self.cid)
        self.assertEqual(r["value"]["hands"], ["R"])

    def test_held_chords_a_bar_each(self):  # red first: the stride exercise's right hand
        self.absent("exercise.stride.c", self.cid)

    def test_repeated_comp_chord(self):
        self.absent("exercise.comping.c.four-on-the-floor", self.cid)

    def test_single_line_melody(self):
        self.absent("exercise.five-finger.c-major.right", self.cid)


class TremoloThirds(Base):
    cid = "texture.tremolo-thirds"

    def test_generated_tremolo_in_thirds(self):
        self.present("exercise.tremolo-third.c.right", self.cid, [0, 1])

    def test_mozart_k545_left_hand_thirds(self):
        self.present("song.classical.mozart-k545-i", self.cid, [13])

    def test_octave_tremolo(self):
        self.absent("exercise.tremolo.c.right", self.cid)

    def test_measured_trill(self):
        self.absent("exercise.trill.c.4pb.right", self.cid)

    def test_semitone_alternation_and_its_spill_into_the_next_bar(self):  # red first
        # K. 545 bar 12 alternates C sharp-D; the thirds of bar 13 start on its last note
        self.absent("song.classical.mozart-k545-i", self.cid, [12])


class CrushedNote(Base):
    cid = "texture.crushed-note"

    def test_joy_to_the_world_arrangement(self):
        self.present("song.pop.thomasclarke11-joy-to-the-world.pdmx", self.cid)

    def test_no_graces(self):
        self.absent("exercise.accompaniment.alberti.c-major.both", self.cid)


class StopTime(Base):
    cid = "texture.stop-time"

    def test_rhythm_and_boogie_break(self):
        self.present("song.blues.rhythm-and-boogie", self.cid, [8, 9, 10])

    def test_classical_cadence_note_between_figure_bars(self):  # red first
        # bars 1 and 3 are single left-hand notes between Alberti bars: the normal time
        self.absent("song.classical.beethoven-sonatina-in-f-major-anh-5-no-2.pdmx", self.cid, [1, 3, 5, 7])

    def test_classical_hits_under_a_running_right_hand(self):
        # bars 46-49: both hands strike on one, the left hand is silent, the right hand runs on
        self.present("song.classical.beethoven-sonatina-in-f-major-anh-5-no-2.pdmx", self.cid, [46, 47, 48, 49])

    def test_two_cadence_notes(self):  # red first
        self.absent("song.classical.bach-menuet-bwv-anh-113.pdmx", self.cid)

    def test_one_hand(self):
        self.absent("exercise.riff.a.rocking", self.cid)


class ScaleRun(Base):
    cid = "technique.scale-run"

    def test_harmonic_minor_scale(self):
        r = self.present("exercise.scale.c-harmonic-minor.1oct.similar.left.2", self.cid)
        self.assertIn("diatonic", r["value"]["kinds"])

    def test_chromatic_scale(self):
        r = self.present("exercise.chromatic.c.1oct.right", self.cid)
        self.assertEqual(r["value"]["kinds"], ["chromatic"])

    def test_scale_in_thirds(self):
        r = self.present("exercise.double-third.c.1oct.right", self.cid)
        self.assertIn("thirds", r["value"]["kinds"])

    def test_scale_in_octaves(self):  # red first: the octave-scale family was missed
        r = self.present("exercise.octave-scale.c.1oct.right", self.cid)
        self.assertIn("octaves", r["value"]["kinds"])

    def test_blues_and_pentatonic_scales(self):  # red first: their minor-third steps broke the run
        for item in ("exercise.blues-scale.a.1oct.right", "exercise.pentatonic.a.pentatonic"):
            r = self.present(item, self.cid)
            self.assertIn("gapped", r["value"]["kinds"], item)

    def test_diminished_seventh_arpeggio_is_not_a_scale(self):
        self.absent("exercise.arpeggio7.c-diminished7.2oct.both", self.cid)

    def test_five_notes_fit_one_position(self):
        self.absent("exercise.five-finger.c-major.right", self.cid)

    def test_position_shift_exercise(self):
        self.absent("exercise.position-shift.c.right", self.cid)


class ArpeggioRun(Base):
    cid = "technique.arpeggio-run"

    def test_two_octaves(self):
        r = self.present("exercise.arpeggio.c-major.2oct.both", self.cid)
        self.assertGreaterEqual(r["value"]["widest"], 24)

    def test_alberti(self):
        self.absent("exercise.accompaniment.alberti.c-major.both", self.cid)

    def test_broken_chord(self):
        self.absent("exercise.accompaniment.broken.c-major.left", self.cid)


class FingerIndependence(Base):
    cid = "technique.finger-independence"

    def test_held_note_under_moving_notes(self):
        self.present("song.beautiful.merry-christmas-mr-lawrence", self.cid)

    def test_one_note_at_a_time(self):
        self.absent("exercise.hanon.01.right", self.cid)

    def test_held_in_one_hand_moving_in_the_other(self):
        self.absent("exercise.pedal.held-melody.c", self.cid)


class Positions(Base):
    def test_five_finger_exercise(self):
        self.present("exercise.five-finger.c-major.both", "technique.five-finger")
        self.absent("exercise.five-finger.c-major.both", "technique.position-shift")

    def test_riff_within_a_fifth(self):
        self.present("exercise.riff.a.rocking", "technique.five-finger")

    def test_position_shift_exercise(self):
        self.absent("exercise.position-shift.c.right", "technique.five-finger")
        r = self.present("exercise.position-shift.c.right", "technique.position-shift")
        self.assertEqual(r["value"]["shifts"], {"R": 1})

    def test_repeated_octaves_stay_in_one_shape(self):
        # the same wide shape again is not a shift (exercise.tremolo: one octave per bar group)
        r = measure("exercise.tremolo.c.right", "technique.position-shift")
        self.assertLess(r["value"]["shifts"]["R"], 8)


class Unknown(Base):
    def test_one_staff_both_hands(self):
        for cid in ("texture.alberti", "technique.scale-run", "technique.five-finger"):
            r = measure("song.folk.muskrat-ramble.pdmx", cid)
            self.assertIn("unknown", r)
            self.assertIn("hands cannot be separated", r["unknown"])


if __name__ == "__main__":
    unittest.main()
