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
    make_pentatonic,
    BOOGIE_MINOR_LEVELS,
    BOOGIE_PATTERNS,
    COMPING_BARS,
    JAM_KEYS,
    TWELVE_BAR,
    TWELVE_BAR_MINOR,
    UNWRITABLE_MINOR,
    CLAVE_PATTERNS,
    TUMBAO_OFFSETS,
    clave_words,
    comping_cycle_bars,
    comping_form,
    flatten_the_third,
    latin_comping_patterns,
    make_blues_scale,
    make_clave,
    make_montuno,
    make_tumbao,
    swing_comping_patterns,
    COMPING_PATTERNS,
    HARMONY_KEYS,
    OSTINATO_SHAPES,
    SECONDARY_RAG_CELL,
    SEVENTH_VOICINGS,
    TURNAROUNDS,
    default_plan,
    make_boogie,
    make_comping,
    make_four_chord_loop,
    make_ii_v_i,
    make_intro,
    make_oompah,
    make_open_voicing,
    make_ostinato,
    make_passing_chord,
    make_power_chord,
    make_secondary_rag,
    make_seventh_voicing,
    make_slash_bass,
    make_stride,
    make_tritone_sub,
    make_turnaround,
    make_walkup,
    make_walking_bass,
)

REPO_ROOT = Path(__file__).resolve().parents[3]


def printed(symbol) -> str:
    """One chord symbol, as the MusicXML will carry it.

    Not `.figure`, which is what music21 *parsed* and can disagree with what it
    exports. `ChordSymbol("A5")` has the figure "A5", the right root and the
    right two pitches, and no `chordKind` at all — so it exports
    `<kind>none</kind>` and OSMD prints nothing above the staff. A whole family
    of chord-chart exercises had no chords on the chart, and a test on `.figure`
    was green on every one of them.

    So the kind is the thing read here: a symbol without one fails outright, and
    where a kind carries its own `text` — which is the attribute a renderer
    prints after the root — that text is what comes back.
    """
    if not symbol.chordKind or symbol.chordKind == "none":
        raise AssertionError(
            f"{symbol.figure!r} exports <kind>none</kind>: it will print as "
            "nothing at all, whatever `.figure` says"
        )
    if symbol.chordKindStr:
        root = symbol.root().name
        bass = symbol.bass().name
        slash = "" if bass == root else f"/{bass}"
        return f"{root}{symbol.chordKindStr}{slash}"
    return symbol.figure


def symbols(score) -> list[str]:
    """The chord symbols in a score, in the order they are written."""
    found = [
        (float(cs.getOffsetInHierarchy(score)), printed(cs))
        for cs in score.recurse().getElementsByClass(harmony.ChordSymbol)
    ]
    return [figure for _, figure in sorted(found)]


def engraved(score) -> list:
    """Every note that will actually be printed — a chord symbol is not one."""
    return [n for n in score.recurse().notes if not isinstance(n, harmony.Harmony)]


def played(part) -> list:
    """The same, for one staff.

    `part.recurse().notes` includes the chord symbols written above it, because
    a `ChordSymbol` is a `Chord`. Every test that read a staff's notes directly
    counted the symbols as music and got twice as many events as the page has.
    """
    return [n for n in part.recurse().notes if not isinstance(n, harmony.Harmony)]


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
        # Every study is `COMPING_BARS` long, so a one-bar figure is played four
        # times and the bossa's two-bar figure twice. Counting `len(offsets) * 4`
        # was the same sum until a pattern existed that does not fit in a bar.
        for pattern, offsets in COMPING_PATTERNS.items():
            sc, _ = make_comping("C", pattern)
            hits = [n for n in engraved(sc) if n.quarterLength == 0.5]
            turns = COMPING_BARS // comping_cycle_bars(pattern)
            self.assertEqual(len(hits), len(offsets) * turns, pattern)

    def test_the_charleston_lands_on_one_and_the_and_of_two(self) -> None:
        sc, _ = make_comping("C", "charleston")
        first_bar = [
            float(n.getOffsetInHierarchy(sc))
            for n in engraved(sc)
            if n.quarterLength == 0.5 and float(n.getOffsetInHierarchy(sc)) < 4.0
        ]
        self.assertEqual(first_bar, [0.0, 1.5])

    def test_the_bossa_crosses_the_barline(self) -> None:
        # The stroke that makes it a two-bar figure: the fourth one falls on the
        # second beat of the second bar, and there is nothing at all on the
        # second bar's downbeat. Folding it back into one bar — which is what a
        # table of one-bar patterns would have forced — makes it a different
        # rhythm wearing the same name.
        offsets = COMPING_PATTERNS["bossa"]
        self.assertEqual(comping_cycle_bars("bossa"), 2)
        self.assertGreater(max(offsets), 4.0)
        self.assertNotIn(4.0, offsets)
        for pattern in COMPING_PATTERNS:
            if pattern != "bossa":
                self.assertEqual(comping_cycle_bars(pattern), 1, pattern)

    def test_the_bossa_is_comped_over_the_latin_vamp(self) -> None:
        # Not a ii-V-I. A bossa rhythm over a ii-V-I is a swing exercise with
        # the wrong notation on it, and the rung that needs this has two bossas
        # among its six songs.
        self.assertEqual(comping_form("bossa"), "latin-vamp")
        self.assertEqual(symbols(make_comping("C", "bossa")[0]),
                         ["Cm7", "Fm7", "Cm7", "Fm7"])
        # …and the intro tier says triads, and plays them.
        self.assertEqual(symbols(make_comping("C", "bossa", "intro")[0]),
                         ["Cm", "Fm", "Cm", "Fm"])

    def test_a_figure_that_does_not_divide_the_study_stops_the_build(self) -> None:
        # A three-bar figure inside a four-bar study would be cut off mid-turn
        # at the double bar, and nothing downstream would see it: the bar count
        # would be right and the notation valid.
        original = dict(COMPING_PATTERNS)
        COMPING_PATTERNS["three-bar"] = [0.0, 4.0, 8.0]
        try:
            with self.assertRaises(ValueError):
                comping_cycle_bars("three-bar")
        finally:
            COMPING_PATTERNS.clear()
            COMPING_PATTERNS.update(original)

    def test_every_swing_pattern_in_every_key(self) -> None:
        for tonic in HARMONY_KEYS:
            for pattern in swing_comping_patterns():
                sc, entry = make_comping(tonic, pattern)
                self.assertReadable(sc, entry["id"])
                self.assertCharted(sc, entry["id"], 4)

    def test_every_latin_pattern_in_the_keys_its_mode_can_be_written_in(self) -> None:
        # Not all twelve: these are written with a minor key signature, and
        # D flat minor needs eight flats. `minor_key` refuses it rather than
        # engraving a page that parses and renders blank.
        for tonic in HARMONY_KEYS:
            for pattern in latin_comping_patterns():
                if tonic in UNWRITABLE_MINOR:
                    with self.assertRaises(ValueError):
                        make_comping(tonic, pattern)
                    continue
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

    def test_the_blue_note_is_written_as_a_raised_fourth_in_every_key(self) -> None:
        # The owner's rule (2026-09-19, `BLUES_SCALE_FORMS`): the flattened
        # fifth is *spelled* as a raised fourth everywhere, because the flat
        # spelling runs out (C flat in F, B double flat in E flat), and
        # `blues.4` and `improv.5` tell the learner so. Both families and the
        # Simon seeded from this scale read the one table; this is the check
        # that the two written families actually agree.
        for tonic in HARMONY_KEYS:
            sc, entry = make_blues_scale(tonic, "right")
            notes = list(sc.parts[0].recurse().notes)
            root = notes[0].pitch
            fourth = root.transpose("A4")
            blue = [n.pitch for n in notes if (n.pitch.pitchClass - root.pitchClass) % 12 == 6]
            self.assertTrue(blue, entry["id"])
            for p in blue:
                self.assertEqual(p.name, fourth.name, f"{entry['id']}: {p.nameWithOctave}")
        for tonic in ("A", "D", "E"):
            sc, entry = make_pentatonic(tonic, "blues")
            notes = list(sc.parts[0].recurse().notes)
            root = notes[0].pitch
            blue = [n.pitch for n in notes if (n.pitch.pitchClass - root.pitchClass) % 12 == 6]
            self.assertTrue(blue, entry["id"])
            for p in blue:
                self.assertEqual(p.name, root.transpose("A4").name, f"{entry['id']}: {p.nameWithOctave}")
        # The keys the rungs teach, by name, so a change of HARMONY_KEYS
        # cannot quietly drop them: C, G and F on blues.3, A on core 3.1.
        self.assertEqual(make_blues_scale("C", "right")[0].parts[0].recurse().notes[3].pitch.name, "F#")
        self.assertEqual(make_blues_scale("G", "right")[0].parts[0].recurse().notes[3].pitch.name, "C#")
        self.assertEqual(make_blues_scale("F", "right")[0].parts[0].recurse().notes[3].pitch.name, "B")
        self.assertEqual(make_pentatonic("A", "blues")[0].parts[0].recurse().notes[3].pitch.name, "D#")

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


class TestTheMinorBlues(HarmonyFamilyCase):
    """
    `02` Part D3 names "minor blues" at stage 6 and there was no such form.

    `TWELVE_BAR` is a dominant seventh in all twelve bars, so a learner who
    reached that line of the syllabus had a name for something the app could not
    play. The test that matters is not that a minor form exists — it is that it
    is the *standard* one, because a twelve-bar shape a learner half-knows is
    worse than one they do not know at all.
    """

    def test_the_form_is_minor_where_the_major_one_is_dominant(self) -> None:
        self.assertEqual(len(TWELVE_BAR_MINOR), len(TWELVE_BAR))
        # The i and the iv are minor sevenths; bars nine and ten are the pair
        # that leaves the key.
        self.assertEqual([quality for _d, quality in TWELVE_BAR_MINOR[:8]], ["m7"] * 8)
        self.assertEqual(TWELVE_BAR_MINOR[8], (8, "7"))
        self.assertEqual(TWELVE_BAR_MINOR[9], (7, "7"))

    def test_the_four_and_the_five_arrive_where_the_major_form_puts_them(self) -> None:
        # Whatever else changes, the bars do not move: `blues.4` states where
        # the four arrives and three separate statements of the form agree.
        majors = [degree for degree, _q in TWELVE_BAR]
        minors = [degree for degree, _q in TWELVE_BAR_MINOR]
        self.assertEqual(majors[:8], minors[:8])
        self.assertEqual(majors[10], minors[10])

    def test_the_walking_line_still_approaches_from_a_semitone_below(self) -> None:
        sc, entry = make_walking_bass("C", "minor-blues")
        bass = [n.pitches[0].ps for n in sc.parts[1].recurse().notes]
        self.assertEqual(len(sc.parts[0].getElementsByClass("Measure")),
                         len(TWELVE_BAR_MINOR))
        for bar in range(len(TWELVE_BAR_MINOR)):
            approach = bass[bar * 4 + 3]
            next_root = bass[((bar + 1) % len(TWELVE_BAR_MINOR)) * 4]
            self.assertEqual(next_root - approach, 1.0, f"bar {bar + 1}")
        self.assertReadable(sc, entry["id"])

    def test_the_walking_line_walks_a_minor_third(self) -> None:
        # The fault `triad()` exists to prevent, one form over: the line has to
        # take the third its symbol names, and in eight of these twelve bars
        # that third is minor.
        sc, _ = make_walking_bass("C", "minor-blues")
        bass = [n.pitches[0].ps for n in sc.parts[1].recurse().notes]
        self.assertEqual(bass[1] - bass[0], 3.0)

    def test_the_boogie_flattens_its_third_and_keeps_its_sixth(self) -> None:
        # Only the third moves. The sixth stays natural because a minor blues is
        # Dorian, and flattening it too would turn the figure into a lament.
        for pattern, (offsets, _f, _l) in BOOGIE_PATTERNS.items():
            minor = flatten_the_third(offsets)
            self.assertEqual(len(minor), len(offsets), pattern)
            self.assertNotIn(4, minor, pattern)
            for major_step, minor_step in zip(offsets, minor):
                expected = 3 if major_step == 4 else major_step
                self.assertEqual(minor_step, expected, pattern)

    def test_the_boogie_symbol_and_its_shell_agree(self) -> None:
        for pattern in BOOGIE_PATTERNS:
            sc, entry = make_boogie("C", pattern, form="minor-blues")
            self.assertEqual(symbols(sc), ["Cm7"] * 4)
            self.assertReadable(sc, entry["id"])
            # Eight eighths a bar, as in the major form.
            left = list(sc.parts[1].recurse().notes)
            self.assertEqual(len(left), 32, pattern)
            self.assertTrue(all(n.quarterLength == 0.5 for n in left), pattern)

    def test_the_minor_form_is_a_band_above_its_major_twin(self) -> None:
        # One band, and the *same* band for all three — the comment said so
        # while the table gave one figure a whole stage and the other two a
        # band. Derived from the major table now, so this asserts the claim
        # rather than three numbers somebody typed.
        for pattern, (_o, _f, major_level) in BOOGIE_PATTERNS.items():
            self.assertAlmostEqual(
                BOOGIE_MINOR_LEVELS[pattern] - major_level, 0.1, places=6, msg=pattern)

    def test_the_open_figure_has_no_third_for_the_mode_to_move(self) -> None:
        # `root-fifth` comes back from `flatten_the_third` unchanged, and that
        # is correct rather than a miss: it is root and fifth alternating, so
        # what separates its minor study from its major one is the key signature
        # and the right hand's shell. Pinned so nobody "fixes" it into a figure
        # harder than the two above it.
        offsets = BOOGIE_PATTERNS["root-fifth"][0]
        self.assertEqual(flatten_the_third(offsets), list(offsets))
        self.assertEqual({0, 7}, set(offsets))
        for pattern in ("pinetop", "walking-eighths"):
            changed = BOOGIE_PATTERNS[pattern][0]
            self.assertNotEqual(flatten_the_third(changed), list(changed), pattern)

    def test_a_key_whose_minor_cannot_be_written_is_refused(self) -> None:
        # D flat minor is eight flats. The failure is loud on purpose: engraving
        # it produces valid MusicXML that no renderer draws, which is the one
        # kind of fault nothing downstream can see.
        for tonic in UNWRITABLE_MINOR:
            with self.assertRaises(ValueError):
                make_boogie(tonic, "pinetop", form="minor-blues")
            with self.assertRaises(ValueError):
                make_walking_bass(tonic, "minor-blues")


class TestTheGuitarKeys(HarmonyFamilyCase):
    """
    E, A, G and D — the keys the `jam` module names and could not play in.

    Its lesson says a guitarist will call one of these four, and the default
    harmony key set is C, F, B flat and E flat, which are what a horn section
    reads. So the rung asking for "a boogie bass in E" offered a boogie in C.
    """

    def test_the_jam_keys_are_the_ones_the_module_names(self) -> None:
        self.assertEqual(set(JAM_KEYS), {"E", "A", "G", "D"})
        # …and none of them is in the default harmony set, which is the whole
        # reason this loop exists.
        self.assertEqual(set(JAM_KEYS) & {"C", "F", "B-", "E-"}, set())

    def test_the_four_families_the_rung_asks_for_exist_in_them(self) -> None:
        plan_ids = {entry["id"] for _, entry in default_plan(quick=False)}
        for tonic in JAM_KEYS:
            slug = tonic.lower()
            for wanted in (
                f"exercise.boogie.{slug}.pinetop",
                f"exercise.blues-scale.{slug}.1oct.right",
                f"exercise.walking-bass.{slug}.blues",
                f"exercise.walking-bass.{slug}.blues.intro",
                f"exercise.comping.{slug}.charleston.intro",
            ):
                self.assertIn(wanted, plan_ids)

    def test_the_blues_scale_in_g_earns_the_easy_level_its_rule_promises(self) -> None:
        # `make_blues_scale` has rated C, G and F at 4.4 since it was written,
        # and G was never generated, so the rule never fired in two of its three
        # keys. The `jam` rung's band is 3.4-4.5.
        self.assertEqual(make_blues_scale("G", "right")[1]["level"],
                         make_blues_scale("C", "right")[1]["level"])


class TestTheBossaAndThePulse(HarmonyFamilyCase):
    """The two things the latin rung's own lesson asks for and did not have."""

    def test_the_bossa_is_a_clave_with_no_side(self) -> None:
        # son and rumba come in a 3-2 and a 2-3; a bossa does not, which is why
        # its key is one word. The title builder split on the hyphen and
        # unpacked into two names, so the first pattern without one raised.
        self.assertEqual(clave_words("son-3-2"), ("son", "3-2"))
        self.assertEqual(clave_words("bossa"), ("bossa", ""))
        self.assertIn("bossa", CLAVE_PATTERNS)
        sc, entry = make_clave("bossa", bars=2)
        attacks = [float(n.getOffsetInHierarchy(sc))
                   for n in sc.parts[0].recurse().notes]
        self.assertEqual(attacks, CLAVE_PATTERNS["bossa"])
        self.assertNotIn("—  ", entry["title"])

    def test_the_bossa_has_five_strokes_over_two_bars_like_the_others(self) -> None:
        # A clave is a two-bar unit — the lesson's whole point, and the thing a
        # learner counting it as two separate bars gets wrong. So every row has
        # strokes in both halves and neither half holds all five: a pattern that
        # fitted inside one bar would not be a clave whatever it was called.
        for pattern, offsets in CLAVE_PATTERNS.items():
            self.assertEqual(len(offsets), len(CLAVE_PATTERNS["son-3-2"]), pattern)
            self.assertTrue(all(0.0 <= hit < 8.0 for hit in offsets), pattern)
            self.assertEqual(offsets, sorted(offsets), pattern)
            first = [hit for hit in offsets if hit < 4.0]
            second = [hit for hit in offsets if hit >= 4.0]
            self.assertTrue(first and second, pattern)
            self.assertEqual(sorted((len(first), len(second))), [2, 3], pattern)

    def test_no_clave_strikes_the_top_of_both_bars(self) -> None:
        """
        A clave has a three-side and a two-side, and only one of them starts.

        This is the invariant the first bossa row broke: `[0, 1.5, 4, 5.5, 7]`
        put a stroke on the downbeat of *both* bars and only two in the first,
        which is neither side of any clave. It looked like a clave — five
        strokes, two bars, syncopated, sorted — and every test then written
        passed it. The property that separates a clave from a pattern with five
        strokes in it is that the second bar answers the first rather than
        starting again.
        """
        for pattern, offsets in CLAVE_PATTERNS.items():
            self.assertFalse(
                0.0 in offsets and 4.0 in offsets,
                f"{pattern} strikes the downbeat of both bars, so neither bar "
                f"answers the other: {offsets}",
            )

    def test_the_bossa_is_the_son_with_its_last_stroke_moved(self) -> None:
        # One stroke of difference, in the second bar, exactly as the rumba is
        # one stroke from the son in the first. If more than one differs, one of
        # the two rows has been invented rather than written down.
        # The move is one eighth, to the "and" of 3 — not a whole beat to 4,
        # which this test used to pin along with the table's wrong value.
        son = CLAVE_PATTERNS["son-3-2"]
        bossa = CLAVE_PATTERNS["bossa"]
        differences = [(a, b) for a, b in zip(son, bossa) if a != b]
        self.assertEqual(differences, [(6.0, 6.5)])

    def test_the_bossa_comping_row_is_the_bossa_clave(self) -> None:
        # One object, not two equal lists: a bossa is comped *on* the clave, and
        # the draft that wrote the offsets out twice had them disagreeing within
        # a week — an even stroke every three eighths, which is no bossa at all.
        self.assertIs(COMPING_PATTERNS["bossa"], CLAVE_PATTERNS["bossa"])

    def test_the_pulse_is_the_beat_and_the_clave_is_not_on_it(self) -> None:
        bars = 4
        sc, entry = make_clave("son-3-2", bars=bars, with_pulse=True)
        self.assertEqual(len(list(sc.parts)), 2)
        pulse = [n for n in sc.parts[1].recurse().notes]
        # One note to the beat, for every beat there is.
        self.assertEqual(len(pulse), bars * 4)
        self.assertTrue(all(n.quarterLength == 1.0 for n in pulse))
        self.assertEqual([float(n.getOffsetInHierarchy(sc)) for n in pulse],
                         [float(beat) for beat in range(bars * 4)])
        self.assertEqual(entry["hands"], "both")

    def test_the_clave_over_a_pulse_is_the_same_clave(self) -> None:
        # The pulse is an addition, not a rewrite: if the strokes moved, the
        # learner would be practising against a clave they will never meet.
        for pattern, offsets in CLAVE_PATTERNS.items():
            sc, _ = make_clave(pattern, bars=2, with_pulse=True)
            attacks = [float(n.getOffsetInHierarchy(sc))
                       for n in sc.parts[0].recurse().notes]
            self.assertEqual(attacks, offsets, pattern)

    def test_the_one_line_staves_export_a_clef_a_reader_can_parse(self) -> None:
        """
        An empty `<line />` is not valid MusicXML, and music21 writes one.

        A single one-line staff exports no `<line>` at all, which is fine. Join
        two of them into a two-staff part and `joinPartStaffs` writes `<line />`
        with no text on the second clef. Setting the line explicitly is the only
        way to stop it from here.

        The single un-numbered `<staff-details>` is deliberate and is checked so
        that it stays that way: MusicXML reads it as applying to every staff in
        the part, both of these have one line, and music21 cannot write the
        `number` attribute at all.
        """
        from music21.musicxml import m21ToXml

        for kwargs in ({}, {"with_pulse": True}):
            sc, entry = make_clave("son-3-2", bars=2, **kwargs)
            exported = m21ToXml.GeneralObjectExporter().parse(sc).decode("utf-8")
            self.assertNotIn("<line />", exported, entry["id"])
            self.assertNotIn("<line/>", exported, entry["id"])
            self.assertEqual(exported.count("<staff-lines>1</staff-lines>"), 1,
                             entry["id"])

    def test_the_bossa_does_not_claim_a_side_it_has_not_got(self) -> None:
        # `two-three-and-three-two` is what a learner searches to compare the
        # two sides of a clave. A bossa has neither, so it does not carry a tag
        # about choosing between them.
        self.assertNotIn("two-three-and-three-two", make_clave("bossa")[1]["concepts"])
        self.assertIn("two-three-and-three-two", make_clave("son-3-2")[1]["concepts"])

    def test_the_pulse_costs_a_band(self) -> None:
        alone = make_clave("son-3-2")[1]["level"]
        together = make_clave("son-3-2", with_pulse=True)[1]["level"]
        self.assertGreater(together, alone)


class TestOompah(HarmonyFamilyCase):
    """
    Bass on 1 and 3, chord on 2 and 4 — `02` Part D5's one technical problem.

    Ragtime had no generated family at all: its rung's four exercises were
    borrowed accompaniment and syncopation rows and not one of them played this.
    """

    def test_it_is_written_in_two_four(self) -> None:
        from music21 import meter as m21meter

        sc, entry = make_oompah("C", "octave")
        signature = sc.parts[1].recurse().getElementsByClass(m21meter.TimeSignature)[0]
        self.assertEqual(signature.ratioString, "2/4")
        self.assertEqual(entry["timeSig"], "2/4")

    def test_the_bass_and_the_chord_alternate(self) -> None:
        sc, _ = make_oompah("C", "octave")
        left = list(sc.parts[1].recurse().notes)
        self.assertEqual([len(n.pitches) for n in left[:4]], [1, 3, 1, 3])
        self.assertTrue(all(n.quarterLength == 1.0 for n in left))

    def test_the_two_ooms_are_the_root_and_its_fifth(self) -> None:
        # Not the root twice. A bass that sits on one note while the chord
        # bounces above it is what a learner plays *instead* of an oom-pah, and
        # it is the fault this family exists to drill out — so the exercise had
        # better not be written that way, which the first draft was.
        sc, _ = make_oompah("C", "octave")
        left = list(sc.parts[1].recurse().notes)
        first, second = left[0].pitches[0], left[2].pitches[0]
        self.assertEqual(second.ps - first.ps, 7.0)
        self.assertEqual([first.name, second.name], ["C", "G"])

    def test_the_progression_is_one_four_five_one(self) -> None:
        self.assertEqual(symbols(make_oompah("C", "octave")[0]), ["C", "F", "G", "C"])
        self.assertEqual(symbols(make_oompah("E-", "tenth")[0]),
                         ["E-", "A-", "B-", "E-"])

    def test_the_tenth_reaches_a_third_further_than_the_octave(self) -> None:
        # The span *is* the exercise. If the two produced the same leap they
        # would be the same item twice, which is what the ii-V-I family shipped
        # once and had to be told about.
        def first_leap(span: str) -> float:
            sc, _ = make_oompah("C", span)
            left = list(sc.parts[1].recurse().notes)
            return left[1].pitches[0].ps - left[0].pitches[0].ps

        self.assertEqual(first_leap("octave"), 12.0)
        self.assertEqual(first_leap("tenth"), 16.0)

    def test_the_tenth_is_the_harder_of_the_two(self) -> None:
        self.assertGreater(make_oompah("C", "tenth")[1]["level"],
                           make_oompah("C", "octave")[1]["level"])

    def test_the_right_hand_rests(self) -> None:
        # A rag's right hand is a different exercise, and putting one over this
        # hides whether the left can leap without looking.
        sc, entry = make_oompah("C", "octave")
        self.assertEqual(played(sc.parts[0]), [])
        self.assertEqual(entry["hands"], "left")

    def test_every_span_in_the_ragtime_keys(self) -> None:
        for tonic in ("C", "F", "B-", "E-", "G"):
            for span in ("octave", "tenth"):
                sc, entry = make_oompah(tonic, span)
                self.assertReadable(sc, entry["id"])
                self.assertCharted(sc, entry["id"], 4)

    def test_a_span_nobody_wrote_down_stops_the_build(self) -> None:
        with self.assertRaises(ValueError):
            make_oompah("C", "twelfth")


class TestSecondaryRag(HarmonyFamilyCase):
    """The three-against-four figure `concepts.json` had an id for and no music."""

    def test_the_cell_is_three_sixteenths(self) -> None:
        self.assertEqual(sum(SECONDARY_RAG_CELL), 0.75)
        # Short then long, which is what makes it read as a figure rather than
        # as a triplet.
        self.assertLess(SECONDARY_RAG_CELL[0], SECONDARY_RAG_CELL[1])

    def test_the_figure_does_not_fit_the_beat(self) -> None:
        # The whole point: three against four. A cell that divided the beat
        # evenly would be a rhythm exercise and not this one.
        self.assertNotEqual(4.0 % sum(SECONDARY_RAG_CELL), 0.0)

    def test_it_fills_its_bars_exactly(self) -> None:
        for bars in (4, 8):
            sc, entry = make_secondary_rag(bars=bars)
            self.assertEqual(len(sc.parts[0].getElementsByClass("Measure")), bars)
            self.assertEqual(len(sc.parts[1].getElementsByClass("Measure")), bars)
            self.assertEqual(entry["drill"]["params"]["bars"], bars)

    def test_the_right_hand_crosses_the_barline(self) -> None:
        # If every bar started the figure again this would be a bar of
        # syncopation repeated, which is a different and much easier thing.
        sc, _ = make_secondary_rag(bars=4)
        attacks = [float(n.getOffsetInHierarchy(sc))
                   for n in played(sc.parts[0])
                   if not (n.tie and n.tie.type == "stop")]
        self.assertTrue(any(attack % 4.0 != 0.0 for attack in attacks))
        self.assertGreater(len({attack % 1.0 for attack in attacks}), 1)

    def test_the_left_hand_marks_the_beat_with_an_oom_pah(self) -> None:
        # A held whole note gives the right hand nothing to slip against, and
        # the whole effect of this figure is that one hand appears to slip while
        # the other does not move. Four events a bar, bass-chord-bass-chord.
        sc, _ = make_secondary_rag(bars=4)
        left = list(sc.parts[1].recurse().notes)
        self.assertEqual(len(left), 4 * 4)
        self.assertTrue(all(n.quarterLength == 1.0 for n in left))
        self.assertEqual([len(n.pitches) for n in left[:4]], [1, 3, 1, 3])
        self.assertEqual(symbols(sc), ["C", "F", "C", "G"])

    def test_it_is_levelled_with_the_sixteenth_syncopation_it_belongs_beside(self) -> None:
        # Not 4.6, which is a stage-4 band: three-against-four at the sixteenth
        # is the hardest rhythm in this file and `ragtime.8` is where it is
        # taught. A level that puts an item on rungs it cannot be played on is
        # worse than no level at all.
        from generate_exercises import make_syncopation

        self.assertEqual(make_secondary_rag()[1]["level"],
                         make_syncopation("sixteenth")[1]["level"])


class TestIntro(HarmonyFamilyCase):
    """The four bars before the tune — the holiday rung's own "how you'll know"."""

    def test_the_chords_are_the_loop(self) -> None:
        self.assertEqual(symbols(make_intro("C")[0]), ["C", "G", "Am", "F"])
        self.assertEqual(symbols(make_intro("E-")[0]), ["E-", "B-", "Cm", "A-"])

    def test_it_is_four_bars(self) -> None:
        sc, entry = make_intro("C")
        for part in sc.parts:
            self.assertEqual(len(part.getElementsByClass("Measure")), 4)
        self.assertEqual(entry["drill"]["params"]["bars"], 4)

    def test_the_last_bar_blocks_the_chord_and_the_others_break_it(self) -> None:
        # An introduction's last bar hands over. A vamp that keeps breaking
        # chords through it has introduced nothing.
        sc, _ = make_intro("C")
        right = played(sc.parts[0])
        self.assertTrue(all(len(n.pitches) == 1 for n in right[:-1]))
        self.assertEqual(len(right[-1].pitches), 3)
        self.assertEqual(right[-1].quarterLength, 4.0)

    def test_the_broken_figure_is_low_middle_high_middle(self) -> None:
        sc, _ = make_intro("C")
        bar = [n.pitches[0].ps for n in played(sc.parts[0])][:4]
        self.assertLess(bar[0], bar[1])
        self.assertLess(bar[1], bar[2])
        self.assertEqual(bar[3], bar[1])

    def test_the_left_hand_is_the_root_of_each_bar(self) -> None:
        sc, _ = make_intro("C")
        left = list(sc.parts[1].recurse().notes)
        self.assertEqual([n.pitch.name for n in left], ["C", "G", "A", "F"])
        self.assertTrue(all(n.quarterLength == 4.0 for n in left))

    def test_every_pop_key(self) -> None:
        for tonic in HARMONY_KEYS:
            sc, entry = make_intro(tonic)
            self.assertReadable(sc, entry["id"])
            self.assertCharted(sc, entry["id"], 4)


class TestWalkupAndPassingChord(HarmonyFamilyCase):
    """
    The two gospel devices `hymns` names — it is titled "…and walk-ups" — and
    for which the nearest thing in the generator was `make_slash_bass`, which
    walks a bass *down* under a chord that does not move.
    """

    def test_the_diatonic_walk_stays_in_the_key(self) -> None:
        sc, _ = make_walkup("C")
        left = [n.pitch.name for n in sc.parts[1].recurse().notes]
        self.assertEqual(left[:4], ["C", "D", "E", "F"])

    def test_the_chromatic_walk_passes_through_the_note_between(self) -> None:
        sc, _ = make_walkup("C")
        left = [n.pitch.name for n in sc.parts[1].recurse().notes]
        self.assertEqual(left[4:], ["C", "D", "E-", "E", "F"])

    def test_the_walk_climbs(self) -> None:
        # The motion is the whole difference from `make_slash_bass`, which is
        # the family this could be mistaken for.
        sc, _ = make_walkup("C")
        for walk in ([n.pitch.ps for n in sc.parts[1].recurse().notes][:4],
                     [n.pitch.ps for n in sc.parts[1].recurse().notes][4:]):
            self.assertEqual(walk, sorted(walk))

    def test_the_walk_arrives_on_the_subdominant(self) -> None:
        sc, _ = make_walkup("C")
        self.assertEqual(symbols(sc), ["C", "F", "C", "F"])

    def test_the_chromatic_bar_leaves_its_third_to_the_bass(self) -> None:
        # The passing note *is* the flat third. A major third held above it for
        # a whole bar is both thirds of one chord sounding at once, which is
        # what `confirm` calls a wrong note whenever it can see it — and it
        # cannot see this one, because the two are in different hands.
        sc, _ = make_walkup("C")
        right = played(sc.parts[0])
        diatonic, chromatic = right[0], right[2]
        self.assertEqual(len(diatonic.pitches), 3)
        self.assertEqual(len(chromatic.pitches), 2)
        steps = {p.ps - chromatic.pitches[0].ps for p in chromatic.pitches}
        self.assertEqual(steps, {0.0, 7.0})
        # …and the bar that has no passing note keeps its third.
        self.assertEqual({p.ps - right[1].pitches[0].ps for p in right[1].pitches},
                         {0.0, 4.0, 7.0})

    def test_the_walk_is_fingered_from_the_little_finger_to_the_thumb(self) -> None:
        from music21 import articulations

        sc, _ = make_walkup("C")
        fingers = [a.fingerNumber
                   for n in sc.parts[1].recurse().notes
                   for a in n.articulations
                   if isinstance(a, articulations.Fingering)]
        self.assertEqual(fingers[:4], [5, 4, 3, 1])
        self.assertEqual(fingers[4:], [5, 4, 3, 2, 1])

    def test_the_approach_chord_is_a_semitone_above_its_target(self) -> None:
        figures = symbols(make_passing_chord("C")[0])
        self.assertEqual(figures, ["Cmaj7", "E-m7", "Dm7", "A-7", "G7", "Cmaj7"])

    def test_the_approach_root_is_spelled_for_its_own_notes(self) -> None:
        # Spelled by the key it is borrowed into, the approach to F minor in
        # E flat is G flat minor 7 — third a B double flat, seventh an F flat,
        # and no chart has printed either. `chart_root` moves the root instead;
        # `_readable` cannot, because it fixes the pitches after the fact and
        # leaves the printed root naming a chord that no longer spells one.
        self.assertEqual(symbols(make_passing_chord("E-")[0])[1], "F#m7")
        self.assertEqual(symbols(make_passing_chord("B-")[0])[1], "C#m7")
        self.assertEqual(symbols(make_passing_chord("F")[0])[1], "G#m7")
        # A tie keeps the name the key gave it: D flat 7 is what a chart prints
        # even though C sharp 7 costs exactly the same.
        self.assertEqual(symbols(make_passing_chord("F")[0])[3], "D-7")

    def test_no_approach_chord_in_any_key_needs_a_spelling_nobody_writes(self) -> None:
        for tonic in HARMONY_KEYS:
            sc, entry = make_passing_chord(tonic)
            self.assertReadable(sc, entry["id"])
            for figure in symbols(sc):
                root = figure.rstrip("maj7m#-").replace("maj", "")
                self.assertNotIn("--", figure, entry["id"])
                self.assertNotIn("##", figure, entry["id"])
                self.assertTrue(root, entry["id"])

    def test_the_approach_keeps_the_target_s_quality(self) -> None:
        # That is what makes it an approach rather than a substitution: nothing
        # about the harmony changes except when it arrives.
        sc, _ = make_passing_chord("C")
        right = played(sc.parts[0])
        approach, target = right[1], right[2]
        steps = [p.ps - approach.pitches[0].ps for p in approach.pitches]
        self.assertEqual(steps, [p.ps - target.pitches[0].ps for p in target.pitches])
        self.assertEqual(approach.pitches[0].ps - target.pitches[0].ps, 1.0)

    def test_the_bass_slides_down_a_semitone_into_each_target(self) -> None:
        sc, _ = make_passing_chord("C")
        bass = [n.pitch.ps for n in sc.parts[1].recurse().notes]
        self.assertEqual(bass[1] - bass[2], 1.0)
        self.assertEqual(bass[3] - bass[4], 1.0)

    def test_every_gospel_key(self) -> None:
        for tonic in HARMONY_KEYS:
            for sc, entry in (make_walkup(tonic), make_passing_chord(tonic)):
                self.assertReadable(sc, entry["id"])
                for part in sc.parts:
                    self.assertEqual(len(part.getElementsByClass("Measure")), 4,
                                     entry["id"])


class TestRockTextures(HarmonyFamilyCase):
    """
    Two of the five textures `rock.overview` names in prose.

    `concepts.json` has carried `ostinato` and `eighth-note-ostinato` since it
    was written with nothing behind either id, and the power chord — the one
    sound anybody could name from the outside — had no exercise anywhere.
    """

    def test_a_power_chord_has_no_third(self) -> None:
        sc, _ = make_power_chord("A")
        for element in sc.parts[1].recurse().notes:
            steps = {int(p.ps - element.pitches[0].ps) for p in element.pitches}
            self.assertEqual(steps, {0, 7, 12})

    def test_the_symbol_says_what_it_is(self) -> None:
        self.assertEqual(symbols(make_power_chord("A")[0]), ["A5", "G5", "F5", "G5"])
        self.assertEqual(symbols(make_power_chord("E")[0]), ["E5", "D5", "C5", "D5"])

    def test_the_symbol_reaches_the_musicxml_as_a_kind(self) -> None:
        """
        The one check that would have caught the blank chart.

        `ChordSymbol("A5")` parses, carries the right root and the right two
        pitches, reads back "A5" from `.figure` — and has no `chordKind`, so it
        exports `<kind>none</kind>` and a renderer draws nothing above the
        staff. Everything in this file except this test was green on it.
        """
        from music21.musicxml import m21ToXml

        sc, _ = make_power_chord("A")
        exported = m21ToXml.GeneralObjectExporter().parse(sc).decode("utf-8")
        self.assertIn('<kind text="5">power</kind>', exported)
        self.assertNotIn("<kind>none</kind>", exported)

    def test_the_left_hand_drives_eighths(self) -> None:
        sc, _ = make_power_chord("A")
        left = list(sc.parts[1].recurse().notes)
        self.assertEqual(len(left), 4 * 8)
        self.assertTrue(all(n.quarterLength == 0.5 for n in left))

    def test_the_right_hand_marks_one_and_three(self) -> None:
        sc, _ = make_power_chord("A")
        right = played(sc.parts[0])
        self.assertEqual([float(n.getOffsetInHierarchy(sc)) for n in right],
                         [2.0 * beat for beat in range(8)])

    def test_the_ostinato_repeats_without_changing(self) -> None:
        # The skill is that it does not drift. If the figure moved, the exercise
        # would be about reading rather than about steadiness.
        for shape in ("fifths", "arpeggio"):
            sc, entry = make_ostinato("A", shape, bars=4)
            right = [n.pitch.ps for n in played(sc.parts[0])]
            self.assertEqual(len(right), 4 * 8, shape)
            self.assertEqual(right[:8], right[8:16], shape)
            self.assertEqual(right[:8], right[-8:], shape)
            self.assertReadable(sc, entry["id"])

    def test_the_bass_is_a_pedal(self) -> None:
        sc, _ = make_ostinato("A", "fifths", bars=4)
        left = list(sc.parts[1].recurse().notes)
        self.assertEqual(len(left), 4)
        self.assertTrue(all(n.quarterLength == 4.0 for n in left))
        self.assertEqual({p.name for n in left for p in n.pitches}, {"A"})

    def test_the_fifths_shape_has_no_third_and_the_arpeggio_has_a_minor_one(self) -> None:
        self.assertNotIn(3, OSTINATO_SHAPES["fifths"][0])
        self.assertNotIn(4, OSTINATO_SHAPES["fifths"][0])
        self.assertIn(3, OSTINATO_SHAPES["arpeggio"][0])
        self.assertNotIn(4, OSTINATO_SHAPES["arpeggio"][0])

    def test_every_shape_is_eight_eighths_with_a_finger_for_each(self) -> None:
        for shape, (offsets, fingers, _level, _label) in OSTINATO_SHAPES.items():
            self.assertEqual(len(offsets), 8, shape)
            self.assertEqual(len(fingers), len(offsets), shape)

    def test_both_are_written_in_the_minor(self) -> None:
        for tonic in ("A", "E", "D"):
            for sc, entry in (make_power_chord(tonic), make_ostinato(tonic, "fifths")):
                signature = next(iter(sc.recurse().getElementsByClass("Key")))
                self.assertEqual(signature.mode, "minor", entry["id"])


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
        #
        # Counted by id prefix and not by `drill.kind`. The kind records what
        # *generated* the notation, and three families now write a chord
        # progression — the four-chord loop, the four-bar introduction and the
        # passing-chord study — so counting the kind stopped being a count of
        # this family the moment the second one existed.
        for prefix, per_key in (
            ("exercise.voicing7.", 4), ("exercise.ii-v-i.", 3), ("exercise.loop4.", 2),
        ):
            count = sum(1 for _, e in self.plan if e["id"].startswith(prefix))
            self.assertEqual(count, len(HARMONY_KEYS) * per_key, prefix)

    def test_every_harmony_item_names_a_track_that_teaches_it(self) -> None:
        teaching = {"jazz", "blues-boogie", "chords-pop", "ragtime",
                    "improv-compose", "theory-ear", "core", "technique"}
        for _, entry in self.plan:
            if entry["drill"]["kind"] in self.KINDS:
                self.assertTrue(teaching & set(entry["tracks"]), entry["id"])


if __name__ == "__main__":  # pragma: no cover
    unittest.main()
