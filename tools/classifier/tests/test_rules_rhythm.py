"""
The rhythm-cell and style-pattern rules (tools/classifier/rules/rhythm.py) on real catalogue items:
per rule, positives (generated families and repertoire) and near-misses, with the bars where it
matters. Definitions and the catalogue validation behind each threshold: docs/classifier/rules/rhythm.md.

Reads the built catalogue (app/public/content/, a build output): run tools/content/build.py first; a
missing catalogue fails, never skips.

    python -m unittest tools.classifier.tests.test_rules_rhythm
"""
from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import score as S  # noqa: E402
from rules import rhythm as R  # noqa: E402

_CATALOG: dict[str, dict] | None = None
_SCORES: dict[str, S.Score] = {}


def item(item_id: str) -> S.Score:
    global _CATALOG
    if _CATALOG is None:
        path = S.CONTENT / "catalog.json"
        if not path.exists():
            raise AssertionError(f"{path} is missing: run tools/content/build.py first")
        _CATALOG = {row["id"]: row for row in json.loads(path.read_text(encoding="utf-8"))}
    if item_id not in _CATALOG:
        raise AssertionError(f"{item_id} is not in the built catalogue")
    if item_id not in _SCORES:
        _SCORES[item_id] = S.load(_CATALOG[item_id])
    return _SCORES[item_id]


def run(cid: str, item_id: str) -> S.Result:
    return S.REGISTRY[cid](item(item_id))


class Base(unittest.TestCase):
    def present(self, cid: str, item_id: str, where: list[int] | None = None) -> S.Result:
        r = run(cid, item_id)
        self.assertIsNone(r.unknown, f"{cid} {item_id}: {r.unknown}")
        self.assertTrue(r.value["present"], f"{cid} {item_id}: {r.value}")
        if where is not None:
            self.assertEqual(r.where, where)
        return r

    def absent(self, cid: str, item_id: str) -> S.Result:
        r = run(cid, item_id)
        self.assertIsNone(r.unknown, f"{cid} {item_id}: {r.unknown}")
        self.assertFalse(r.value["present"], f"{cid} {item_id}: {r.value}")
        return r

    def unknown(self, cid: str, item_id: str, because: str) -> None:
        r = run(cid, item_id)
        self.assertIsNotNone(r.unknown, f"{cid} {item_id}: {r.value}")
        self.assertIn(because, r.unknown)


class TestRepeated(unittest.TestCase):
    def test_two_consecutive_or_four_anywhere(self):
        self.assertTrue(R.repeated([[3], [4]]))
        self.assertTrue(R.repeated([[0, 1], [2, 3]]))
        self.assertTrue(R.repeated([[1], [5], [9], [20]]))
        self.assertFalse(R.repeated([[3], [7], [21]]))  # Lullaby of Birdland's three scattered tumbao bars
        self.assertFalse(R.repeated([[0, 1], [4, 5]]))


class TestCharleston(Base):
    cid = "texture.charleston"

    def test_generated_comping_charleston(self):
        r = self.present(self.cid, "exercise.comping.c.charleston", [0, 1, 2, 3])
        self.assertEqual(r.value["hand"], {"R": 4})

    def test_left_hand_chords_in_a_ballad(self):
        # Falling: left-hand chords on 1 and the and-of-2 through most of the song
        r = self.present(self.cid, "song.pop.harry-styles-falling-by-harry-styles.pdmx")
        self.assertEqual(r.value["hand"], {"L": 44})
        self.assertEqual(r.where[:5], [0, 1, 2, 3, 4])

    def test_near_miss_anticipated_comp(self):
        # 1 and the and-of-3: a two-chord comp that is not the Charleston
        self.absent(self.cid, "exercise.comping.c.anticipated")

    def test_near_miss_bossa_comp_holds_more(self):
        # the bossa's first bar is 1, and-of-2, 4: contains the Charleston's onsets and is not it
        self.assertEqual(run(self.cid, "exercise.comping.c.bossa").value["bars"], 0)

    def test_unknown_outside_four_four(self):
        self.unknown(self.cid, "exercise.meter.12-8", "4/4 or 2/2")


class TestTumbao(Base):
    cid = "texture.tumbao"

    def test_generated_tumbao(self):
        r = self.present(self.cid, "exercise.tumbao.a", list(range(8)))
        self.assertGreaterEqual(r.value["held_over"], 7)  # the beat-4 note held over the barline

    def test_generated_latin_groove_left_hand(self):
        self.present(self.cid, "exercise.latin-groove.a.son-3-2", list(range(8)))

    def test_real_tumbao(self):
        r = self.present(self.cid, "song.pop.chancho-en-piedra-mandinga.pdmx")
        self.assertEqual(r.where[:4], [6, 7, 10, 11])

    def test_near_miss_tresillo_keeps_its_downbeat(self):
        self.absent(self.cid, "exercise.tresillo.c")

    def test_near_miss_scattered_bars_are_no_pattern(self):
        r = self.absent(self.cid, "song.jazz.george-shearing-lullaby-of-birdland.pdmx")
        self.assertEqual(r.where, [3, 7, 21])

    def test_unknown_without_a_left_hand(self):
        self.unknown(self.cid, "exercise.clave.son-3-2", "no left hand")


class TestClave(Base):
    cid = "texture.clave"

    def test_each_generated_clave_is_its_own_kind(self):
        for pattern in ("son-3-2", "son-2-3", "rumba-3-2", "rumba-2-3", "bossa"):
            with self.subTest(pattern=pattern):
                r = self.present(self.cid, f"exercise.clave.{pattern}")
                self.assertEqual(set(r.value["kinds"]), {pattern})

    def test_pulse_variant_reads_the_clave_hand(self):
        r = self.present(self.cid, "exercise.clave.son-2-3.pulse", list(range(8)))
        self.assertEqual(r.value["kinds"], {"son-2-3": 4})

    def test_one_bar_sixteenth_cycle_in_a_pop_song(self):
        # Location Unknown: the bossa clave's onsets on sixteenths, one bar in two
        r = self.present(self.cid, "song.pop.honne-location-unknown-brooklyn-session-honne.pdmx")
        self.assertEqual(r.value["kinds"], {"bossa": 23})
        self.assertEqual(r.where[:3], [28, 30, 32])

    def test_near_miss_tresillo_is_half_a_clave(self):
        self.absent(self.cid, "exercise.tresillo.c")

    def test_near_miss_single_bossa_cycle(self):
        r = self.absent(self.cid, "song.pop.takeru-kanazaki-fire-emblem-three-houses-apex-of-the-world.pdmx")
        self.assertEqual(r.value["cycles"], 1)

    def test_unknown_in_compound_metre(self):
        self.unknown(self.cid, "exercise.meter.12-8", "duple metres")


class TestMontuno(Base):
    cid = "texture.montuno"

    def test_generated_montuno_and_groove(self):
        self.present(self.cid, "exercise.montuno.a.2note.son-3-2", [0, 1, 2, 3])
        self.present(self.cid, "exercise.montuno.d.3note.son-3-2", [0, 1, 2, 3])
        self.present(self.cid, "exercise.latin-groove.a.son-3-2", list(range(8)))

    def test_near_miss_bare_clave_is_not_a_montuno(self):
        self.absent(self.cid, "exercise.clave.son-3-2")
        self.absent(self.cid, "exercise.clave.son-3-2.pulse")

    def test_near_miss_bossa_clave_chords(self):
        # aligned to the Brazilian clave, which the Cuban montuno is not
        self.absent(self.cid, "exercise.montuno.a.2note.bossa")

    def test_near_miss_running_figures_contain_every_clave(self):
        # red under the first rule (clave strokes a subset of the onsets): a rag's syncopated running
        # line and a Chopin rondo's figuration contain the son clave in every cycle
        self.absent(self.cid, "song.ragtime.joplin-felicity-rag")
        self.absent(self.cid, "song.classical.chopin-rondo-op16.nifc")
        self.absent(self.cid, "song.pop.wowaka-vocaloid-rolling-girl-aa1-4aaa3aa1-4a.pdmx")


class TestBossa(Base):
    cid = "texture.bossa"

    def test_generated_bossa_comp(self):
        r = self.present(self.cid, "exercise.comping.c.bossa", [0, 1, 2, 3])
        self.assertEqual(r.value["cycles"], 2)

    def test_near_miss_charleston_comp(self):
        self.absent(self.cid, "exercise.comping.c.charleston")

    def test_near_miss_son_clave(self):
        # the son differs from the bossa clave by one stroke, one sixteenth
        self.absent(self.cid, "exercise.clave.son-3-2")

    def test_near_miss_bass_rhythm_alone(self):
        # red under the first rule (bass cell or comp): dotted-quarter-eighth bass bars in Mozart
        r = self.absent(self.cid, "song.classical.mozart-k545-i")
        self.assertGreaterEqual(r.value["bass_bars"], 2)
        self.absent(self.cid, "song.classical.schumann-the-happy-farmer-op-68-no-10.pdmx")


class TestTango(Base):
    cid = "texture.tango"
    WHY = "onsets do not decide a tango accompaniment"

    def test_a_tango_and_a_habanera_hold_the_same_figures(self):
        self.unknown(self.cid, "song.folk.por-una-cabeza-carlos-gardel.pdmx", self.WHY)
        self.unknown(self.cid, "song.classical.bizet-l-amour-est-un-oiseau-rebelle.pdmx", self.WHY)

    def test_a_march_holds_the_marcato(self):
        self.unknown(self.cid, "song.ragtime.joplin-combination-march", self.WHY)

    def test_no_figure_is_no_tango_accompaniment(self):
        self.absent(self.cid, "exercise.tumbao.a")

    def test_unknown_without_a_left_hand(self):
        self.unknown(self.cid, "song.jazz.kenny-dorham-blue-bossa.pdmx", "no left hand")


class TestMazurka(Base):
    cid = "texture.mazurka"

    def test_chopin_mazurkas(self):
        r = self.present(self.cid, "song.classical.chopin-mazurka-op24-2.nifc")
        self.assertEqual(r.where[:4], [5, 7, 9, 11])
        self.present(self.cid, "song.classical.chopin-mazurka-op6-1.nifc")

    def test_figure_without_the_accent_is_unknown(self):
        # a polonaise and a mazurka both hold the figure as a pattern, the accents elsewhere
        self.unknown(self.cid, "song.classical.chopin-polonaise-op53.nifc", "without the accent")
        self.unknown(self.cid, "song.classical.chopin-mazurka-op17-2.nifc", "without the accent")

    def test_no_figure_is_absent(self):
        # a waltz with accents off beat 1 and never the figure
        r = self.absent(self.cid, "song.classical.chopin-waltz-op69-2.nifc")
        self.assertEqual(r.value["figure_bars"], 0)

    def test_unknown_without_accent_marks(self):
        # Mozart's minuet holds the figure in most bars and has no accent marks to tell
        self.unknown(self.cid, "song.classical.mozart-mozart-minuet-in-f-major-k2-easy.pdmx", "no accent marks")

    def test_unknown_outside_three_four(self):
        self.unknown(self.cid, "exercise.comping.c.charleston", "3/4")


class TestShuffle(Base):
    cid = "rhythm.shuffle"

    def test_twelve_eight(self):
        r = self.present(self.cid, "exercise.meter.12-8", list(range(12)))
        self.assertEqual(r.value["kinds"], {"12/8": 12})

    def test_marked_even_eighths(self):
        self.present(self.cid, "exercise.rhythm.shuffle-eighths.4bar", [0, 1, 2, 3])
        self.present(self.cid, "exercise.rhythm.shuffle-quarter-eighths.4bar", [0, 1, 2, 3])

    def test_straight_then_swung(self):
        # "Straight" over bars 0-3, "Swing: long, then late" from bar 5
        self.present(self.cid, "exercise.swing-pair.c", [5, 6, 7, 8])

    def test_triplet_notation(self):
        r = self.present(self.cid, "song.blues.black-bottom-stomp")
        self.assertIn("triplet", r.value["kinds"])

    def test_near_miss_dotted_quarter_eighth(self):
        self.absent(self.cid, "exercise.rhythm.dotted-quarter-eighth.4bar")

    def test_near_miss_quarter_note_triplets(self):
        # red under the first rule: quarter-note triplets put 0 and 2/3 in every other beat
        self.absent(self.cid, "song.classical.chopin-sonata-2-1.nifc")

    def test_dotted_pairs_beside_even_pairs_are_literal(self):
        r = self.absent(self.cid, "song.classical.mozart-twinkle-variations-k265")
        self.assertEqual(r.value["kinds"], {"dotted": 11})

    def test_dotted_pairs_alone_are_unknown(self):
        self.unknown(self.cid, "song.classical.tchaikovsky-march-of-the-wooden-soldiers-op-39-no5.pdmx", "dotted")

    def test_unknown_in_six_eight(self):
        self.unknown(self.cid, "exercise.rhythm.six-eight-long-short.4bar", "6/8")


class TestSecondaryRag(Base):
    cid = "rhythm.secondary-rag"

    def test_twelfth_street_rag_both_editions(self):
        # Berlin's example; this edition writes the pairs dotted, the other evenly
        r = self.present(self.cid, "song.jazz.twelfth-street-rag")
        self.assertEqual(r.where[:4], [10, 11, 14, 15])
        self.present(self.cid, "song.pop.12th-street-rag.pdmx")

    def test_memphis_blues(self):
        r = self.present(self.cid, "song.pop.the-memphis-blues.pdmx")
        self.assertEqual(r.where[:4], [13, 14, 15, 16])

    def test_near_miss_syncopated_cell_is_not_berlins_pattern(self):
        # the generated three-sixteenth cell crosses the beat by note lengths (sixteenth, eighth)
        # over a rising scale: syncopated, no repeating three-note melody
        self.absent(self.cid, "exercise.secondary-rag.c.4bar")

    def test_near_miss_triplet_arpeggio(self):
        # three notes repeated, but three to the beat: no cross against the beat
        self.absent(self.cid, "song.classical.beethoven-moonlight-i")

    def test_near_miss_bar_bound_period_three(self):
        # the C major prelude's right hand repeats three notes, restarting every half bar
        self.absent(self.cid, "song.classical.bach-wtc1-prelude-1")


class TestBuild(Base):
    cid = "texture.build"

    def test_rising_dynamics_and_density(self):
        self.present(self.cid, "song.classical.bennet-rosemary-s-waltz.pdmx", list(range(8)))

    def test_near_miss_crescendo_over_even_density(self):
        # a five-bar crescendo hairpin over sixteen notes a bar throughout
        self.absent(self.cid, "song.classical.duvernoy-etude-op-176-no-11.pdmx")

    def test_near_miss_one_sparse_opening_bar(self):
        # red under the first rule (means): p to mp over bars 0-9, a two-note first bar then 26 notes a bar
        self.absent(self.cid, "song.classical.chopin-prelude-op28-4.alt")

    def test_crescendo_in_words_only(self):
        # the generated crescendo is written in prose ("Grow evenly..."), with no hairpin or cresc.
        self.absent(self.cid, "exercise.shaping.c.crescendo")

    def test_unknown_without_dynamics(self):
        self.unknown(self.cid, "exercise.comping.c.charleston", "no dynamics")


if __name__ == "__main__":
    unittest.main()
