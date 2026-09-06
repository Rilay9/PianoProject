"""
The harmony families P12b adds to the generator.

`02` Parts D2-D4 name the skills the chords-pop, blues and jazz tracks are made
of — the four-chord loop in twelve keys, shell voicings, walking bass, stride,
comping, turnarounds — and before this phase the generator wrote none of them.
There is one test class per family, because a family that is silently wrong in
one key is worse than a family that does not exist: the learner practises the
wrong chord and has no way to know.

The two properties every one of them must have are that the chord symbols reach
the MusicXML — the chord-chart view of `04` §3b reads `<harmony>`, so a harmony
exercise without symbols is a notation exercise — and that nothing engraves a
double accidental.
"""
from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from music21 import harmony  # noqa: E402

from generate_exercises import (  # noqa: E402
    BOOGIE_PATTERNS,
    COMPING_PATTERNS,
    HARMONY_KEYS,
    SEVENTH_VOICINGS,
    TURNAROUNDS,
    default_plan,
    make_boogie,
    make_comping,
    make_four_chord_loop,
    make_ii_v_i,
    make_open_voicing,
    make_seventh_voicing,
    make_slash_bass,
    make_stride,
    make_tritone_sub,
    make_turnaround,
    make_walking_bass,
)

REPO_ROOT = Path(__file__).resolve().parents[3]


def symbols(score) -> list[str]:
    """The chord symbols in a score, in the order they are written."""
    found = [
        (float(cs.getOffsetInHierarchy(score)), cs.figure)
        for cs in score.recurse().getElementsByClass(harmony.ChordSymbol)
    ]
    return [figure for _, figure in sorted(found)]


def engraved(score) -> list:
    """Every note that will actually be printed — a chord symbol is not one."""
    return [n for n in score.recurse().notes if not isinstance(n, harmony.Harmony)]


class HarmonyFamilyCase(unittest.TestCase):
    """The two things every harmony family owes the reader."""

    def assertReadable(self, score, item_id: str) -> None:
        bad = sorted({
            p.nameWithOctave
            for n in engraved(score)
            for p in n.pitches
            if abs(p.alter) > 1
        })
        self.assertEqual(bad, [], f"{item_id} engraves double accidentals: {bad}")

    def assertCharted(self, score, item_id: str, expected: int) -> None:
        self.assertEqual(len(symbols(score)), expected, item_id)


class TestSeventhVoicings(HarmonyFamilyCase):
    """`02` Part D4: close, shell, rootless A and rootless B."""

    def test_every_voicing_in_every_key(self) -> None:
        for tonic in HARMONY_KEYS:
            for voicing in SEVENTH_VOICINGS:
                sc, entry = make_seventh_voicing(tonic, voicing)
                self.assertReadable(sc, entry["id"])
                self.assertCharted(sc, entry["id"], 3)
                self.assertEqual(entry["drill"]["kind"], "seventh-voicing")

    def test_the_shell_is_root_third_and_seventh_only(self) -> None:
        # Three notes, not four: the fifth is the one note a seventh chord can
        # always spare, which is the entire point of the voicing.
        for quality, shape in SEVENTH_VOICINGS["shell"].items():
            self.assertEqual(len(shape), 3, quality)
            self.assertNotIn(7, shape, quality)

    def test_the_rootless_voicings_have_no_root(self) -> None:
        for name in ("rootless-a", "rootless-b"):
            for quality, shape in SEVENTH_VOICINGS[name].items():
                self.assertNotIn(0, shape, f"{name}/{quality}")

    def test_the_symbols_are_the_two_five_one(self) -> None:
        self.assertEqual(symbols(make_seventh_voicing("C", "shell")[0]),
                         ["Dm7", "G7", "Cmaj7"])
        self.assertEqual(symbols(make_seventh_voicing("E-", "close")[0]),
                         ["Fm7", "B-7", "E-maj7"])

    def test_the_rootless_voicings_are_a_stage_higher(self) -> None:
        self.assertEqual(make_seventh_voicing("C", "shell")[1]["level"], 6.1)
        self.assertEqual(make_seventh_voicing("C", "rootless-a")[1]["level"], 7.1)


class TestIiViI(HarmonyFamilyCase):
    """`02` Part D4: ii-V-I in twelve keys."""

    def test_twelve_keys(self) -> None:
        made = [make_ii_v_i(tonic) for tonic in HARMONY_KEYS]
        self.assertEqual(len({entry["id"] for _, entry in made}), 12)
        for sc, entry in made:
            self.assertReadable(sc, entry["id"])
            self.assertCharted(sc, entry["id"], 3)

    def test_the_guide_tones_resolve_by_a_semitone(self) -> None:
        # The seventh of one chord is the third of the next, one semitone down.
        # That is what the exercise is; if it stops being true the exercise is
        # about nothing.
        sc, _ = make_ii_v_i("C")
        pairs = [n for n in engraved(sc) if len(n.pitches) == 2]
        self.assertEqual([p.nameWithOctave for p in pairs[0].pitches], ["F4", "C5"])
        self.assertEqual([p.nameWithOctave for p in pairs[1].pitches], ["F4", "B4"])
        self.assertEqual([p.nameWithOctave for p in pairs[2].pitches], ["E4", "B4"])

    def test_the_tonic_gets_two_bars(self) -> None:
        sc, _ = make_ii_v_i("C")
        self.assertEqual(len(sc.parts[0].getElementsByClass("Measure")), 4)


class TestTritoneSubstitution(HarmonyFamilyCase):
    """`02` Part D4: the substitution, written next to what it replaces."""

    def test_the_substitute_is_a_semitone_above_the_tonic(self) -> None:
        self.assertEqual(symbols(make_tritone_sub("C")[0]), ["Dm7", "D-7", "Cmaj7"])
        # …and is spelled the way a chart spells it. B flat's flat II is C flat
        # by the key signature, and B by every lead sheet ever printed.
        self.assertEqual(symbols(make_tritone_sub("B-")[0]), ["Cm7", "B7", "B-maj7"])
        self.assertEqual(symbols(make_tritone_sub("E-")[0]), ["Fm7", "E7", "E-maj7"])

    def test_every_key(self) -> None:
        for tonic in HARMONY_KEYS:
            sc, entry = make_tritone_sub(tonic)
            self.assertReadable(sc, entry["id"])
            self.assertCharted(sc, entry["id"], 3)


class TestFourChordLoop(HarmonyFamilyCase):
    """`02` Part D2's chords-pop rung: I-V-vi-IV, in twelve keys."""

    def test_twelve_keys_both_ways(self) -> None:
        for tonic in HARMONY_KEYS:
            for inversions in (False, True):
                sc, entry = make_four_chord_loop(tonic, inversions)
                self.assertReadable(sc, entry["id"])
                self.assertCharted(sc, entry["id"], 4)

    def test_the_symbols_are_one_five_six_four(self) -> None:
        self.assertEqual(symbols(make_four_chord_loop("C")[0]), ["C", "G", "Am", "F"])
        self.assertEqual(symbols(make_four_chord_loop("D-")[0]),
                         ["D-", "A-", "B-m", "G-"])

    def test_inversions_stop_the_hand_leaping(self) -> None:
        # The claim the inverted version makes is that no chord moves far. Root
        # position moves more than a major third between two of them; the
        # inverted form moves no more than that anywhere.
        def bottoms(score):
            return [n.pitches[0].ps for n in engraved(score) if len(n.pitches) == 3]

        rooted = bottoms(make_four_chord_loop("C", inversions=False)[0])
        led = bottoms(make_four_chord_loop("C", inversions=True)[0])
        self.assertGreater(max(abs(b - a) for a, b in zip(rooted, rooted[1:])), 4)
        self.assertLessEqual(max(abs(b - a) for a, b in zip(led, led[1:])), 4)

    def test_inversions_are_a_stage_later(self) -> None:
        self.assertEqual(make_four_chord_loop("C", False)[1]["level"], 4.4)
        self.assertEqual(make_four_chord_loop("C", True)[1]["level"], 5.4)


class TestSlashBass(HarmonyFamilyCase):
    """The chord that stays put while the bass walks down under it."""

    def test_the_symbols_carry_the_bass_note(self) -> None:
        figures = symbols(make_slash_bass("C")[0])
        self.assertEqual(figures[0], "C")
        self.assertEqual(figures[1], "C/B")

    def test_the_bass_descends(self) -> None:
        sc, _ = make_slash_bass("C")
        bass = [n.pitches[0].ps for n in sc.parts[1].recurse().notes]
        # The last chord is the dominant, which is where the line turns round.
        self.assertTrue(all(b <= a for a, b in zip(bass, bass[1:-1])), bass)

    def test_every_key(self) -> None:
        for tonic in HARMONY_KEYS:
            sc, entry = make_slash_bass(tonic)
            self.assertReadable(sc, entry["id"])
            self.assertCharted(sc, entry["id"], 8)


class TestWalkingBass(HarmonyFamilyCase):
    def test_the_blues_is_twelve_bars(self) -> None:
        sc, entry = make_walking_bass("F", "blues")
        self.assertEqual(len(sc.parts[0].getElementsByClass("Measure")), 12)
        self.assertCharted(sc, entry["id"], 12)

    def test_four_notes_to_the_bar(self) -> None:
        sc, _ = make_walking_bass("C", "ii-V-I")
        bass = list(sc.parts[1].recurse().notes)
        self.assertEqual(len(bass), 16)
        self.assertTrue(all(n.quarterLength == 1.0 for n in bass))

    def test_each_bar_approaches_the_next_root_from_a_semitone_below(self) -> None:
        # The reason a walking line sounds inevitable rather than random.
        sc, _ = make_walking_bass("C", "blues")
        bass = [n.pitches[0].ps for n in sc.parts[1].recurse().notes]
        for bar in range(12):
            approach = bass[bar * 4 + 3]
            next_root = bass[((bar + 1) % 12) * 4]
            self.assertEqual(next_root - approach, 1.0, f"bar {bar + 1}")

    def test_both_forms_in_every_key(self) -> None:
        for tonic in HARMONY_KEYS:
            for form in ("blues", "ii-V-I"):
                sc, entry = make_walking_bass(tonic, form)
                self.assertReadable(sc, entry["id"])


class TestComping(HarmonyFamilyCase):
    def test_the_pattern_is_the_rhythm_that_gets_played(self) -> None:
        for pattern, offsets in COMPING_PATTERNS.items():
            sc, _ = make_comping("C", pattern)
            hits = [n for n in engraved(sc) if n.quarterLength == 0.5]
            self.assertEqual(len(hits), len(offsets) * 4, pattern)

    def test_the_charleston_lands_on_one_and_the_and_of_two(self) -> None:
        sc, _ = make_comping("C", "charleston")
        first_bar = [
            float(n.getOffsetInHierarchy(sc))
            for n in engraved(sc)
            if n.quarterLength == 0.5 and float(n.getOffsetInHierarchy(sc)) < 4.0
        ]
        self.assertEqual(first_bar, [0.0, 1.5])

    def test_every_pattern_in_every_key(self) -> None:
        for tonic in HARMONY_KEYS:
            for pattern in COMPING_PATTERNS:
                sc, entry = make_comping(tonic, pattern)
                self.assertReadable(sc, entry["id"])
                self.assertCharted(sc, entry["id"], 4)


class TestStride(HarmonyFamilyCase):
    def test_the_left_hand_is_bass_chord_tenth_chord(self) -> None:
        sc, _ = make_stride("C")
        left = list(sc.parts[1].recurse().notes)[:4]
        self.assertEqual([len(n.pitches) for n in left], [1, 2, 1, 2])
        # The tenth is what makes it stride rather than oom-pah: an octave and
        # a major third above the bass note.
        self.assertEqual(left[2].pitches[0].ps - left[0].pitches[0].ps, 16.0)

    def test_every_key(self) -> None:
        for tonic in HARMONY_KEYS:
            sc, entry = make_stride(tonic)
            self.assertReadable(sc, entry["id"])
            self.assertCharted(sc, entry["id"], 4)


class TestTurnarounds(HarmonyFamilyCase):
    def test_the_standard_shape(self) -> None:
        self.assertEqual(symbols(make_turnaround("C", "I-vi-ii-V")[0]),
                         ["Cmaj7", "Am7", "Dm7", "G7"])

    def test_the_third_degree_substitute(self) -> None:
        self.assertEqual(symbols(make_turnaround("C", "iii-VI-ii-V")[0]),
                         ["Em7", "A7", "Dm7", "G7"])

    def test_two_bars_in_every_key(self) -> None:
        for tonic in HARMONY_KEYS:
            for variant in TURNAROUNDS:
                sc, entry = make_turnaround(tonic, variant)
                self.assertReadable(sc, entry["id"])
                self.assertEqual(len(sc.parts[0].getElementsByClass("Measure")), 2)


class TestOpenVoicings(HarmonyFamilyCase):
    def test_a_stack_of_fourths_is_labelled_as_the_chord_it_is(self) -> None:
        # Root, 11th, flat 7th, flat 10th — an m11, and the chart has to say so
        # or the symbol is decoration.
        self.assertEqual(symbols(make_open_voicing("D", "quartal")[0])[0], "Dm11")

    def test_the_suspended_and_added_colours(self) -> None:
        for flavour in ("sus2", "sus4", "add9"):
            self.assertEqual(symbols(make_open_voicing("C", flavour)[0])[0],
                             f"C{flavour}")

    def test_sus_chords_have_no_third(self) -> None:
        for flavour in ("sus2", "sus4"):
            sc, _ = make_open_voicing("C", flavour)
            first = engraved(sc)[0]
            steps = {int(p.ps - first.pitches[0].ps) for p in first.pitches}
            self.assertEqual(steps & {3, 4}, set(), flavour)

    def test_every_flavour_in_every_key(self) -> None:
        for tonic in HARMONY_KEYS:
            for flavour in ("quartal", "sus2", "sus4", "add9"):
                sc, entry = make_open_voicing(tonic, flavour)
                self.assertReadable(sc, entry["id"])
                self.assertCharted(sc, entry["id"], 4)


class TestBoogie(HarmonyFamilyCase):
    def test_eight_eighths_a_bar(self) -> None:
        for pattern in BOOGIE_PATTERNS:
            sc, _ = make_boogie("C", pattern)
            left = list(sc.parts[1].recurse().notes)
            self.assertEqual(len(left), 32, pattern)
            self.assertTrue(all(n.quarterLength == 0.5 for n in left), pattern)

    def test_yancey_alternates_root_and_fifth(self) -> None:
        self.assertEqual(BOOGIE_PATTERNS["yancey"], [0, 7, 0, 7, 0, 7, 0, 7])

    def test_pinetop_climbs_to_the_flat_seventh_and_comes_back(self) -> None:
        self.assertEqual(BOOGIE_PATTERNS["pinetop"][0], 0)
        self.assertEqual(max(BOOGIE_PATTERNS["pinetop"]), 10)

    def test_every_pattern_in_every_key(self) -> None:
        for tonic in HARMONY_KEYS:
            for pattern in BOOGIE_PATTERNS:
                sc, entry = make_boogie(tonic, pattern)
                self.assertReadable(sc, entry["id"])
                self.assertCharted(sc, entry["id"], 4)


class TestTheFamiliesAreInThePlan(unittest.TestCase):
    """A family the plan never calls is a family that does not ship."""

    KINDS = ("seventh-voicing", "ii-V-I", "tritone-sub", "progression", "slash-bass",
             "walking-bass", "comping", "stride", "turnaround", "open-voicing", "boogie")

    @classmethod
    def setUpClass(cls) -> None:
        cls.plan = default_plan(quick=False)

    def test_every_harmony_kind_is_generated(self) -> None:
        kinds = {entry["drill"]["kind"] for _, entry in self.plan}
        self.assertEqual(set(self.KINDS) - kinds, set())

    def test_the_kinds_are_all_in_the_schema(self) -> None:
        schema = json.loads(
            (REPO_ROOT / "content" / "catalog.schema.json").read_text(encoding="utf-8")
        )
        item = schema["$defs"]["item"]
        allowed = item["properties"]["drill"]["properties"]["kind"]["enum"]
        for kind in self.KINDS:
            self.assertIn(kind, allowed)

    def test_the_twelve_key_families_really_are_in_twelve_keys(self) -> None:
        for kind, per_key in (("seventh-voicing", 4), ("ii-V-I", 1), ("progression", 2)):
            count = sum(1 for _, e in self.plan if e["drill"]["kind"] == kind)
            self.assertEqual(count, 12 * per_key, kind)

    def test_every_harmony_item_names_a_track_that_teaches_it(self) -> None:
        teaching = {"jazz", "blues-boogie", "chords-pop", "ragtime",
                    "improv-compose", "theory-ear", "core", "technique"}
        for _, entry in self.plan:
            if entry["drill"]["kind"] in self.KINDS:
                self.assertTrue(teaching & set(entry["tracks"]), entry["id"])


if __name__ == "__main__":  # pragma: no cover
    unittest.main()
