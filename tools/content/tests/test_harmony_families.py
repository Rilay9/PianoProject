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
    BLUES_SCALE,
    BOOGIE_PATTERNS,
    TWELVE_BAR,
    CLAVE_PATTERNS,
    TUMBAO_OFFSETS,
    make_blues_scale,
    make_clave,
    make_montuno,
    make_tumbao,
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

    def test_root_fifth_alternates_root_and_fifth(self) -> None:
        # Named for the shape, not for Jimmy Yancey, whose left hand this is
        # not. The test that stood here was called
        # `test_yancey_alternates_root_and_fifth` — it knew what the figure was
        # and asserted it under the wrong name anyway.
        self.assertEqual(BOOGIE_PATTERNS["root-fifth"][0], [0, 7, 0, 7, 0, 7, 0, 7])

    def test_pinetop_climbs_to_the_flat_seventh_and_comes_back(self) -> None:
        self.assertEqual(BOOGIE_PATTERNS["pinetop"][0][0], 0)
        self.assertEqual(max(BOOGIE_PATTERNS["pinetop"][0]), 10)

    def test_no_finger_plays_two_different_notes_in_a_bar(self) -> None:
        """
        A finger is a place on the keyboard. If the same finger is printed under
        two different pitches inside one bar of eight eighths, the fingering is
        not describing a hand that could play it.

        This is what a shared fingering constant did to the root-and-fifth
        figure: fingers 5-4-3-2-1-2-3-4 over C-G-C-G-C-G-C-G, so the same C
        carried 5, then 3, then 1. `add_notes` only checks the two lists are the
        same length, which they were.
        """
        for pattern, (offsets, fingers, _level) in BOOGIE_PATTERNS.items():
            self.assertEqual(len(offsets), len(fingers), pattern)
            seen: dict[int, int] = {}
            for offset, finger in zip(offsets, fingers):
                if finger in seen:
                    self.assertEqual(
                        seen[finger], offset,
                        f"{pattern}: finger {finger} is asked for two pitches "
                        f"({seen[finger]} and {offset} semitones up)",
                    )
                seen[finger] = offset

    def test_the_four_bars_are_the_blues_the_app_teaches(self) -> None:
        # One statement about where the four arrives, and this test had it
        # wrong. It asserted I-IV-I-I because `TWELVE_BAR` opened with the quick
        # change, and `blues.4` — the rung where a learner first meets the form
        # — says "Four bars of C7", which is also what the authored shuffle on
        # that same rung plays. The lesson and the music a learner is given are
        # the statement; a table that disagreed with both was the thing to move.
        sc, _ = make_boogie("C", "pinetop")
        symbols = [cs.figure for cs in sc.parts[0].recurse().getElementsByClass("ChordSymbol")]
        self.assertEqual(symbols, ["C7", "C7", "C7", "C7"])

    def test_every_pattern_in_every_key(self) -> None:
        for tonic in HARMONY_KEYS:
            for pattern in BOOGIE_PATTERNS:
                sc, entry = make_boogie(tonic, pattern)
                self.assertReadable(sc, entry["id"])
                self.assertCharted(sc, entry["id"], 4)


class TestOneTwelveBarForm(unittest.TestCase):
    """
    The app says the twelve bars three times. They have to agree.

    `blues.4` states the form in words — "Four bars of C7, two of F7, two of C7,
    one of G7, one of F7, then two of C7" — and it is the first rung where a
    learner meets it. `blues_forms.py` writes the authored shuffle that rung
    offers. `TWELVE_BAR` drives the generated boogie and walking bass on the two
    rungs above it.

    The generator used to open I-IV, the "quick change", while the other two
    opened with four bars of I. Nothing in the app teaches the quick change or
    mentions it, so the only thing a learner could conclude was that one of the
    three was wrong. A common variant nobody is told about is not a variant.
    """

    def test_the_generator_and_the_authored_shuffle_agree(self) -> None:
        import blues_forms

        self.assertEqual([degree for degree, _quality in TWELVE_BAR], blues_forms.DEGREES)

    def test_it_is_four_bars_of_one(self) -> None:
        # The specific thing blues.4 says, and the specific thing that was wrong.
        self.assertEqual([degree for degree, _q in TWELVE_BAR[:4]], [0, 0, 0, 0])

    def test_every_chord_of_the_form_is_a_dominant_seventh(self) -> None:
        self.assertEqual({quality for _d, quality in TWELVE_BAR}, {"7"})


class TestLatin(HarmonyFamilyCase):
    """
    Clave, tumbao and montuno — the three skills the latin rung names.

    It named all three and offered a syncopated rhythm drill, shuffle eighths,
    off-beat comping, a ii-V-I walking bass and ties across the bar line, with a
    twelve-bar blues, Greensleeves in 6/8 and Row Row Row Your Boat for
    repertoire. Not one bar of latin music on the latin rung.
    """

    def test_the_clave_is_the_pattern_the_lesson_states(self) -> None:
        # `latin.md`: 3-2 son has the first bar on beat 1, the "and" of 2 and
        # beat 4, and the second bar on beats 2 and 3. In quarter-lengths from
        # the start of the two-bar unit that is 0, 1.5, 3 | 5, 6. The lesson and
        # the table have to say the same thing, because the lesson is what the
        # learner reads and the table is what they hear.
        self.assertEqual(CLAVE_PATTERNS["son-3-2"], [0.0, 1.5, 3.0, 5.0, 6.0])

    def test_two_three_is_the_same_pattern_with_the_bars_swapped(self) -> None:
        for style in ("son", "rumba"):
            three_two = CLAVE_PATTERNS[f"{style}-3-2"]
            two_three = CLAVE_PATTERNS[f"{style}-2-3"]
            swapped = sorted((x + 4.0) % 8.0 for x in three_two)
            self.assertEqual(two_three, swapped, style)

    def test_the_rumba_differs_from_the_son_by_one_eighth(self) -> None:
        # The third stroke, delayed from beat four to the "and" of four. If any
        # other stroke differs, one of the two tables is wrong.
        son = CLAVE_PATTERNS["son-3-2"]
        rumba = CLAVE_PATTERNS["rumba-3-2"]
        differences = [(a, b) for a, b in zip(son, rumba) if a != b]
        self.assertEqual(differences, [(3.0, 3.5)])

    def test_every_clave_engraves_its_own_strokes(self) -> None:
        for pattern, offsets in CLAVE_PATTERNS.items():
            sc, entry = make_clave(pattern, bars=2)
            attacks = [float(n.getOffsetInHierarchy(sc))
                       for n in sc.parts[0].recurse().notes]
            self.assertEqual(attacks, offsets, pattern)
            self.assertReadable(sc, entry["id"])

    def test_the_montuno_plays_on_the_clave_and_nowhere_else(self) -> None:
        """
        The one unmistakable error in the style, per the lesson, is playing
        against the clave. So the montuno's attacks are not a rhythm that
        resembles the clave — they are `CLAVE_PATTERNS` itself, and this is what
        stops the two drifting apart.
        """
        from music21 import chord as m21chord, harmony as m21harmony

        for clave, offsets in CLAVE_PATTERNS.items():
            for voices in (2, 3):
                sc, entry = make_montuno("C", voices, clave)
                attacks = sorted(
                    float(c.getOffsetInHierarchy(sc))
                    for c in sc.parts[0].recurse().getElementsByClass(m21chord.Chord)
                    if not isinstance(c, m21harmony.ChordSymbol)
                )
                self.assertEqual(attacks, offsets + [x + 8.0 for x in offsets],
                                 f"{clave} {voices}-note")
                self.assertReadable(sc, entry["id"])

    def test_the_tumbao_is_never_on_a_downbeat(self) -> None:
        # "not on beat one ... which is why Latin music feels like it is leaning
        # forward". A tumbao with a note on beat one is not a tumbao.
        # Beat one is not *struck*: from the second bar on it is covered by the
        # anticipation held across the barline, so a tie's continuation is not
        # an attack.
        sc, entry = make_tumbao("C", bars=4)
        notes = list(sc.parts[1].recurse().notes)
        attacks = [float(n.getOffsetInHierarchy(sc))
                   for n in notes if not (n.tie and n.tie.type == "stop")]
        self.assertEqual(attacks, [bar * 4.0 + o for bar in range(4) for o in TUMBAO_OFFSETS])
        self.assertTrue(all(a % 4.0 != 0.0 for a in attacks), attacks)
        held = [float(n.getOffsetInHierarchy(sc))
                for n in notes if n.tie and n.tie.type == "stop"]
        self.assertEqual(held, [bar * 4.0 for bar in range(1, 4)],
                         "the anticipation is held into every bar after the first")

    def test_the_tumbao_takes_the_next_chord_early(self) -> None:
        # The note on beat four is the root of the bar that has not started yet.
        # That anticipation is the figure; without it this is just an off-beat
        # bass line.
        sc, _ = make_tumbao("C", bars=4)
        notes = [n for n in sc.parts[1].recurse().notes
                 if not (n.tie and n.tie.type == "stop")]
        fours = notes[1::2]
        symbols = [cs for cs in sc.parts[0].recurse().getElementsByClass("ChordSymbol")]
        for index, note_on_four in enumerate(fours):
            nxt = symbols[(index + 1) % len(symbols)]
            self.assertEqual(note_on_four.pitch.pitchClass, nxt.root().pitchClass,
                             f"bar {index + 1} does not anticipate {nxt.figure}")

    def test_the_parts_are_the_same_length(self) -> None:
        for sc, entry in (make_tumbao("C"), make_montuno("C", 2), make_montuno("C", 3)):
            lengths = {float(part.duration.quarterLength) for part in sc.parts}
            self.assertEqual(len(lengths), 1, f"{entry['id']}: staves of different lengths")


class TestBluesScale(HarmonyFamilyCase):
    def test_it_has_the_flat_fifth(self) -> None:
        # The note that separates a blues scale from a minor pentatonic. Without
        # it this family would be a pentatonic scale under another name.
        self.assertIn(6, BLUES_SCALE)
        self.assertEqual(BLUES_SCALE, (0, 3, 5, 6, 7, 10, 12))

    def test_the_notes_are_right_in_every_key(self) -> None:
        for tonic in HARMONY_KEYS:
            sc, entry = make_blues_scale(tonic, "right")
            classes = {p.pitchClass for n in sc.parts[0].recurse().notes for p in n.pitches}
            root = sc.parts[0].recurse().notes[0].pitch.pitchClass
            self.assertEqual(classes, {(root + i) % 12 for i in BLUES_SCALE}, tonic)
            self.assertReadable(sc, entry["id"])

    def test_it_prints_no_fingering(self) -> None:
        # Deliberate: there is no published chart for this scale in
        # `content/sources`, and a fingering on a melodic line is the one error
        # here that ships silently — `confirm_fingering` can only see chords.
        from music21 import articulations

        sc, _ = make_blues_scale("C", "both")
        marks = [a for n in sc.recurse().notes for a in n.articulations
                 if isinstance(a, articulations.Fingering)]
        self.assertEqual(marks, [])


class TestTheNotesAgreeWithTheSymbols(unittest.TestCase):
    """
    What is played under a chord symbol has to be that chord.

    Every other test here reads the code or counts the items. This one reads the
    *pitches*, because the code can be plausible and the music wrong — and it
    was. `make_turnaround`'s intro tier chose its third with
    `quality.startswith("m")`, which is true of "maj7" as well as "m7", so every
    major-seventh chord in the family came out as a minor triad under a major
    symbol. Twelve keys of it. Nothing caught it: the symbols were right, the
    engraving was valid, no accidental was doubled, and the item count was
    correct.

    The rule is the narrow one that would have caught it. A chord sounding under
    a symbol must contain that symbol's third, and must not contain the other
    one — you cannot have the major and the minor third of the same chord and
    mean it.
    """

    #: The families whose right hand spells the symbol out. Walking bass and
    #: boogie are lines rather than chords and are judged elsewhere.
    def _chorded(self):
        from generate_exercises import (
            make_comping, make_ii_v_i, make_turnaround, make_seventh_voicing,
        )
        from generate_exercises import COMPING_TIERS, II_V_I_SHAPES, TURNAROUNDS
        for shape, *_ in II_V_I_SHAPES:
            yield f"ii-V-I {shape}", make_ii_v_i("C", shape)[0]
        for tier, *_ in COMPING_TIERS:
            yield f"comping {tier}", make_comping("C", "charleston", tier)[0]
        for variant in TURNAROUNDS:
            yield f"turnaround {variant}", make_turnaround("C", variant)[0]
        yield "turnaround intro", make_turnaround("C", "I-vi-ii-V", "intro")[0]
        for voicing in ("shell", "rootless-a"):
            yield f"seventh {voicing}", make_seventh_voicing("C", voicing)[0]

    def test_every_sounding_chord_has_the_third_its_symbol_names(self) -> None:
        from music21 import chord as m21chord

        for label, score in self._chorded():
            for part in score.parts:
                symbol = None
                for element in part.flatten().notesAndRests:
                    if isinstance(element, harmony.ChordSymbol):
                        symbol = element
                        continue
                    if symbol is None or not isinstance(element, m21chord.Chord):
                        continue
                    root = symbol.root().pitchClass
                    wanted = {(root + i) % 12 for i in ([3] if symbol.quality == "minor" else [4])}
                    other = {(root + i) % 12 for i in ([4] if symbol.quality == "minor" else [3])}
                    sounding = {p.pitchClass for p in element.pitches}
                    if not sounding & wanted and not sounding & other:
                        # A two-note shell may leave the third out entirely;
                        # what it may not do is print the wrong one.
                        continue
                    self.assertFalse(
                        sounding & other,
                        f"{label}: {symbol.figure} sounds "
                        f"{[p.nameWithOctave for p in element.pitches]}, which carries the "
                        f"{'major' if symbol.quality == 'minor' else 'minor'} third",
                    )

    def test_no_chord_stacks_two_notes_a_semitone_apart(self) -> None:
        """
        A cluster in a voicing is a bug, not a colour.

        `make_ii_v_i`'s rootless tier folded each note into the guide-tone
        window one at a time, which dropped the ninth an octave and left it a
        semitone *below* the third. It read fine in the source.
        """
        from music21 import chord as m21chord

        for label, score in self._chorded():
            for part in score.parts:
                for element in part.flatten().notesAndRests:
                    if isinstance(element, harmony.ChordSymbol) or not isinstance(element, m21chord.Chord):
                        continue
                    steps = sorted(p.ps for p in element.pitches)
                    for lower, upper in zip(steps, steps[1:]):
                        self.assertGreater(
                            upper - lower, 1.0,
                            f"{label}: {[p.nameWithOctave for p in element.pitches]} has two "
                            "notes a semitone apart",
                        )


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
        # ii-V-I is three per key, not one: shells, guide tones and rootless.
        # One specimen sat at level 5.4 and the two rungs that teach the
        # progression are banded 3.4-5.2 and 6.1-6.4, so neither could offer a
        # ii-V-I drill. Twelve keys is still twelve keys; what changed is that
        # each key exists at the three difficulties the ladder asks for.
        for kind, per_key in (("seventh-voicing", 4), ("ii-V-I", 3), ("progression", 2)):
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
