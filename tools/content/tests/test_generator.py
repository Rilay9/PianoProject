"""
The exercise generator's catalog output (docs/03 §2 [GEN]).

The id test is here because the ids collided in a way nothing else would have
noticed: `slug("E-")` and `slug("E")` are both "e", so every flat key wrote
over its natural. The catalog validated, the files existed, and half the
library was silently the wrong piece.
"""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from generate_exercises import (  # noqa: E402
    ACCOMPANIMENT_PATTERNS,
    make_triad_inversions,
    RHYTHM_PATTERNS,
    RHYTHM_PATTERNS_EXTRA,
    chromatic_finger,
    default_plan,
    key_slug,
    make_accompaniment,
    make_cadence,
    make_chromatic,
    make_coordination,
    make_five_finger,
    make_interval_reading,
    make_pedal,
    make_position_shift,
    make_rhythm,
    make_seventh_arpeggio,
    make_arpeggio,
    make_trill,
    engraved_key,
    make_scale,
    ScaleSpec,
    note_name,
)


#: The plan that actually ships, built once for the whole module.
#:
#: Two tests here have to walk every generated item rather than a sample,
#: because both faults they guard were per-key and invisible in any one maker.
#: `--quick` is no use for either: it produces 184 items and **not one of them
#: is in a flat key**, which is the only place the bugs lived. The shipping
#: plan is 1,012 items and about two minutes, so it is computed once and both
#: tests read it.
_SHIPPING_PLAN: list | None = None


def shipping_plan() -> list:
    global _SHIPPING_PLAN
    if _SHIPPING_PLAN is None:
        _SHIPPING_PLAN = default_plan(quick=False)
    return _SHIPPING_PLAN


class TestKeySlug(unittest.TestCase):
    def test_flats_and_naturals_are_different(self) -> None:
        self.assertNotEqual(key_slug("E-"), key_slug("E"))
        self.assertEqual(key_slug("E-"), "e-flat")

    def test_sharps_and_naturals_are_different(self) -> None:
        self.assertNotEqual(key_slug("F#"), key_slug("F"))
        self.assertEqual(key_slug("F#"), "f-sharp")


class TestPlan(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.plan = default_plan(quick=True)

    def test_every_id_is_unique(self) -> None:
        ids = [entry["id"] for _, entry in self.plan]
        self.assertEqual(sorted(ids), sorted(set(ids)))

    def test_every_entry_names_the_file_it_writes(self) -> None:
        for _, entry in self.plan:
            with self.subTest(item=entry["id"]):
                self.assertEqual(entry["file"], f"scores/generated/{entry['id']}.mxl")

    def test_every_entry_declares_a_licence(self) -> None:
        for _, entry in self.plan:
            with self.subTest(item=entry["id"]):
                self.assertTrue(entry["source"]["license"])


class TestChromatic(unittest.TestCase):
    def test_the_standard_one_three_shape(self) -> None:
        # C C# D D# E F F# G — 1 3 1 3 1 2 3 1.
        fingers = [chromatic_finger(60 + i, i == 0) for i in range(8)]
        self.assertEqual(fingers, [1, 3, 1, 3, 1, 2, 3, 1])

    def test_the_c_at_the_top_of_the_octave_takes_the_second_finger(self) -> None:
        self.assertEqual(chromatic_finger(72, False), 2)
        self.assertEqual(chromatic_finger(60, True), 1)

    def test_it_writes_a_grand_staff(self) -> None:
        score, entry = make_chromatic("C", "both", 1)
        self.assertEqual(len(list(score.parts)), 2)
        self.assertEqual(entry["drill"]["params"]["mode"], "chromatic")


class TestSevenths(unittest.TestCase):
    def test_a_dominant_seventh_has_a_flat_seventh(self) -> None:
        score, _ = make_seventh_arpeggio("C", "dominant7", "right", 1)
        pitches = [n.pitch.midi % 12 for n in score.parts[0].recurse().notes]
        self.assertEqual(sorted(set(pitches)), [0, 4, 7, 10])

    def test_a_diminished_seventh_is_a_stack_of_minor_thirds(self) -> None:
        score, _ = make_seventh_arpeggio("C", "diminished7", "right", 1)
        pitches = [n.pitch.midi % 12 for n in score.parts[0].recurse().notes]
        self.assertEqual(sorted(set(pitches)), [0, 3, 6, 9])


class TestRhythm(unittest.TestCase):
    def test_every_pattern_fills_whole_bars(self) -> None:
        for label, lengths, _ in RHYTHM_PATTERNS:
            with self.subTest(pattern=label):
                self.assertAlmostEqual(sum(lengths) % 4, 0, places=6)

    def test_a_rhythm_drill_is_written_on_one_line(self) -> None:
        score, entry = make_rhythm("quarters", bars=4)
        self.assertEqual(len(list(score.parts)), 1)
        self.assertEqual(entry["drill"]["kind"], "rhythm")

    def test_a_rhythm_drill_has_the_bars_it_says(self) -> None:
        from music21 import stream

        score, _ = make_rhythm("eighths", bars=3)
        self.assertEqual(len(score.parts[0].getElementsByClass(stream.Measure)), 3)


class TestKeySignatures(unittest.TestCase):
    """
    Every key we generate has to be one MusicXML can write down.

    D-flat minor is eight flats and G-flat minor is nine; the format's key
    signature runs -7..+7, so those two produced scores that parsed, reported
    their steps and rendered a blank page.
    """

    def test_every_key_fits_a_key_signature(self) -> None:
        from music21 import key

        from generate_exercises import MAJOR_KEYS, MINOR_KEYS

        for tonic in MAJOR_KEYS:
            with self.subTest(key=f"{tonic} major"):
                self.assertLessEqual(abs(key.Key(tonic, "major").sharps), 7)
        for tonic in MINOR_KEYS:
            with self.subTest(key=f"{tonic} minor"):
                self.assertLessEqual(abs(key.Key(tonic.lower(), "minor").sharps), 7)

    def test_there_are_twelve_of_each(self) -> None:
        from generate_exercises import MAJOR_KEYS, MINOR_KEYS

        self.assertEqual(len(MAJOR_KEYS), 12)
        self.assertEqual(len(MINOR_KEYS), 12)
        self.assertEqual(len(set(MAJOR_KEYS)), 12)
        self.assertEqual(len(set(MINOR_KEYS)), 12)


# --------------------------------------------------------------------------------------
# docs/02 Part E2 — the families P5b added.
#
# Each of these asserts the thing that would actually be wrong if the generator broke: the
# fingering on the note that carries a position change, the meter, the bar count, and which
# hand a hands-separate item is on. A test that only checks "it produced a file" would have
# passed for every bug found while writing them.
# --------------------------------------------------------------------------------------
def notes_of(part) -> list:
    from music21 import note

    return [n for n in part.recurse().notes if isinstance(n, note.Note)]


def fingerings_of(part) -> list[int]:
    from music21 import articulations

    return [
        a.fingerNumber
        for n in part.recurse().notes
        for a in n.articulations
        if isinstance(a, articulations.Fingering)
    ]


class TestCoordination(unittest.TestCase):
    def test_the_left_hand_holds_whole_notes_under_a_moving_right_hand(self) -> None:
        score, entry = make_coordination("C", "hold")
        rh, lh = list(score.parts)
        self.assertGreater(len(notes_of(rh)), len(notes_of(lh)))
        self.assertTrue(all(n.duration.quarterLength == 4.0 for n in notes_of(lh)))
        self.assertEqual(entry["level"], 2.1)

    def test_the_change_variant_moves_the_left_hand_to_the_dominant(self) -> None:
        score, _ = make_coordination("C", "change")
        lh = list(score.parts)[1]
        self.assertEqual([n.name for n in notes_of(lh)], ["C", "G", "C"])

    def test_the_left_hand_fingering_is_five_on_the_tonic_and_one_on_the_dominant(self) -> None:
        score, _ = make_coordination("C", "change")
        self.assertEqual(fingerings_of(list(score.parts)[1]), [5, 1, 5])

    def test_it_is_spelled_for_the_key(self) -> None:
        score, _ = make_coordination("F", "change")
        names = {n.name for n in notes_of(list(score.parts)[0])}
        self.assertIn("B-", names)
        self.assertNotIn("A#", names)


class TestIntervalReading(unittest.TestCase):
    def test_the_same_seed_gives_the_same_melody(self) -> None:
        first, _ = make_interval_reading(3)
        second, _ = make_interval_reading(3)
        self.assertEqual(
            [n.nameWithOctave for n in notes_of(first.parts[0])],
            [n.nameWithOctave for n in notes_of(second.parts[0])],
        )

    def test_different_seeds_give_different_melodies(self) -> None:
        first, _ = make_interval_reading(1)
        second, _ = make_interval_reading(2)
        self.assertNotEqual(
            [n.nameWithOctave for n in notes_of(first.parts[0])],
            [n.nameWithOctave for n in notes_of(second.parts[0])],
        )

    def test_no_interval_is_wider_than_a_third(self) -> None:
        for seed in range(1, 9):
            score, _ = make_interval_reading(seed)
            pitches = [n.pitch.ps for n in notes_of(score.parts[0])]
            with self.subTest(seed=seed):
                steps = [abs(b - a) for a, b in zip(pitches, pitches[1:])]
                self.assertLessEqual(max(steps), 4)  # a major 3rd is four semitones

    def test_it_stays_inside_the_five_finger_position(self) -> None:
        score, _ = make_interval_reading(5)
        names = {n.name for n in notes_of(score.parts[0])}
        self.assertTrue(names <= {"C", "D", "E", "F", "G"}, names)

    def test_the_left_hand_version_is_on_the_bass_staff(self) -> None:
        score, entry = make_interval_reading(1, hands="left")
        self.assertEqual(entry["hands"], "left")
        self.assertEqual(len(notes_of(score.parts[0])), 0)
        self.assertGreater(len(notes_of(score.parts[1])), 0)


class TestPositionShift(unittest.TestCase):
    def test_only_the_two_notes_that_start_a_position_are_fingered(self) -> None:
        score, _ = make_position_shift("C", "right")
        self.assertEqual(fingerings_of(score.parts[0]), [1, 1])

    def test_the_second_half_starts_a_fifth_higher(self) -> None:
        score, _ = make_position_shift("C", "right")
        notes = notes_of(score.parts[0])
        self.assertEqual(notes[0].name, "C")
        self.assertEqual(notes[8].name, "G")

    def test_the_left_hand_version_uses_the_little_finger(self) -> None:
        score, _ = make_position_shift("C", "left")
        self.assertEqual(fingerings_of(score.parts[1]), [5, 5])


class TestCadence(unittest.TestCase):
    def test_root_position_gives_the_four_chords_of_the_cadence(self) -> None:
        from music21 import chord

        score, _ = make_cadence("C", "root")
        chords = [c for c in score.parts[1].recurse().getElementsByClass(chord.Chord)]
        self.assertEqual(len(chords), 4)
        self.assertEqual([c.root().name for c in chords], ["C", "F", "G", "C"])

    def test_the_dominant_seventh_has_four_notes_and_a_minor_seventh(self) -> None:
        from music21 import chord

        score, _ = make_cadence("C", "root")
        v7 = [c for c in score.parts[1].recurse().getElementsByClass(chord.Chord)][2]
        self.assertEqual(len(v7.notes), 4)
        self.assertIn("F", [n.name for n in v7.notes])

    def test_the_smooth_voicing_keeps_the_tonic_under_the_subdominant(self) -> None:
        from music21 import chord

        score, _ = make_cadence("C", "voice-led")
        chords = [c for c in score.parts[1].recurse().getElementsByClass(chord.Chord)]
        self.assertEqual(chords[1].bass().name, "C")   # F/C, not F
        self.assertEqual(chords[2].bass().name, "B")   # G7/B — the leading tone

    def test_a_flat_key_is_spelled_with_flats(self) -> None:
        from music21 import chord

        score, _ = make_cadence("B-", "root")
        names = {
            n.name
            for c in score.parts[1].recurse().getElementsByClass(chord.Chord)
            for n in c.notes
        }
        self.assertFalse({n for n in names if "#" in n}, names)


class TestAccompaniment(unittest.TestCase):
    def test_the_waltz_pattern_is_in_three_four(self) -> None:
        from music21 import meter

        score, entry = make_accompaniment("C", "major", "waltz", "left")
        signature = score.parts[1].recurse().getElementsByClass(meter.TimeSignature)[0]
        self.assertEqual(signature.ratioString, "3/4")
        self.assertEqual(entry["timeSig"], "3/4")

    def test_alberti_is_low_high_middle_high(self) -> None:
        score, _ = make_accompaniment("C", "major", "alberti", "left")
        first_bar = [n.pitch.ps for n in notes_of(score.parts[1])][:4]
        self.assertLess(first_bar[0], first_bar[2])
        self.assertLess(first_bar[2], first_bar[1])
        self.assertEqual(first_bar[1], first_bar[3])

    def test_hands_together_puts_something_in_the_right_hand(self) -> None:
        alone, _ = make_accompaniment("C", "major", "broken", "left")
        together, _ = make_accompaniment("C", "major", "broken", "both")
        self.assertEqual(len(notes_of(alone.parts[0])), 0)
        self.assertGreater(len(notes_of(together.parts[0])), 0)

    def test_only_the_bass_note_of_each_group_is_fingered(self) -> None:
        score, _ = make_accompaniment("C", "major", "broken", "left")
        self.assertEqual(fingerings_of(score.parts[1]), [5, 5, 5, 5])

    def test_a_minor_key_uses_its_own_third(self) -> None:
        score, _ = make_accompaniment("A", "minor", "broken", "left")
        self.assertIn("C", [n.name for n in notes_of(score.parts[1])[:4]])

    def test_every_pattern_fills_its_bar(self) -> None:
        for name, (_, steps, time_sig) in ACCOMPANIMENT_PATTERNS.items():
            with self.subTest(pattern=name):
                beats = 4.0 if time_sig == "4/4" else 3.0
                self.assertAlmostEqual(sum(length for _, length in steps), beats, places=6)


class TestPedal(unittest.TestCase):
    def test_every_chord_carries_a_pedal_mark(self) -> None:
        from music21 import chord, expressions

        score, entry = make_pedal("C")
        marks = list(score.parts[1].recurse().getElementsByClass(expressions.PedalMark))
        chords = list(score.parts[1].recurse().getElementsByClass(chord.Chord))
        self.assertEqual(len(marks), len(chords))
        self.assertEqual(entry["drill"]["kind"], "pedal")

    def test_there_is_something_to_hear_the_pedal_blur(self) -> None:
        score, _ = make_pedal("C")
        self.assertGreater(len(notes_of(score.parts[0])), 0)


class TestExtraRhythms(unittest.TestCase):
    def test_every_extra_pattern_fills_whole_bars_of_its_own_meter(self) -> None:
        for label, lengths, _, time_sig, _direction in RHYTHM_PATTERNS_EXTRA:
            with self.subTest(pattern=label):
                numerator, denominator = (int(x) for x in time_sig.split("/"))
                bar = numerator * 4 / denominator
                self.assertAlmostEqual(sum(lengths) % bar, 0, places=6)

    def test_a_three_four_pattern_is_written_in_three_four(self) -> None:
        from music21 import meter

        score, entry = make_rhythm("waltz-quarters")
        signature = score.parts[0].recurse().getElementsByClass(meter.TimeSignature)[0]
        self.assertEqual(signature.ratioString, "3/4")
        self.assertEqual(entry["timeSig"], "3/4")

    def test_a_six_eight_pattern_is_written_in_six_eight(self) -> None:
        _, entry = make_rhythm("six-eight-eighths")
        self.assertEqual(entry["timeSig"], "6/8")

    def test_shuffle_is_straight_eighths_with_a_direction_over_them(self) -> None:
        from music21 import expressions

        score, entry = make_rhythm("shuffle-eighths")
        directions = list(score.parts[0].recurse().getElementsByClass(expressions.TextExpression))
        self.assertTrue(directions, "a shuffle with no instruction is just straight eighths")
        self.assertIn("Shuffle", directions[0].content)
        self.assertIn("swing", entry["concepts"])
        # Straight eighths on the page: notating triplets would teach the wrong thing.
        self.assertTrue(all(n.duration.quarterLength == 0.5 for n in notes_of(score.parts[0])))

    def test_the_four_four_patterns_kept_their_ids(self) -> None:
        _, entry = make_rhythm("quarters")
        self.assertEqual(entry["id"], "exercise.rhythm.quarters.4bar")


class TestFiveFingerHandsSeparately(unittest.TestCase):
    def test_the_right_hand_version_leaves_the_bass_staff_empty(self) -> None:
        score, entry = make_five_finger("C", "major", "right")
        self.assertEqual(entry["hands"], "right")
        self.assertGreater(len(notes_of(score.parts[0])), 0)
        self.assertEqual(len(notes_of(score.parts[1])), 0)

    def test_the_left_hand_version_leaves_the_treble_staff_empty(self) -> None:
        score, entry = make_five_finger("C", "major", "left")
        self.assertEqual(entry["hands"], "left")
        self.assertEqual(len(notes_of(score.parts[0])), 0)
        self.assertGreater(len(notes_of(score.parts[1])), 0)

    def test_the_hands_have_mirrored_fingering(self) -> None:
        right, _ = make_five_finger("C", "major", "right")
        left, _ = make_five_finger("C", "major", "left")
        self.assertEqual(fingerings_of(right.parts[0])[:5], [1, 2, 3, 4, 5])
        self.assertEqual(fingerings_of(left.parts[1])[:5], [5, 4, 3, 2, 1])


class TestChordFingeringSurvivesExport(unittest.TestCase):
    """
    Fingering on a chord has to reach the *file*, not just the stream.

    music21 10.5 silently drops a Fingering attached to a Note inside a Chord: the score
    looks right in Python and exports with no `<fingering>` element at all. Every
    chord-shaped exercise shipped that way until this test existed, so the assertion is on
    the written MusicXML and nothing else.
    """

    def written_fingerings(self, score) -> list[str]:
        import re
        import tempfile

        path = tempfile.mktemp(suffix=".musicxml")
        score.write("musicxml", fp=path)
        return re.findall(r"<fingering[^>]*>(\d)</fingering>", Path(path).read_text())

    def test_a_cadence_chord_keeps_its_fingering(self) -> None:
        score, _ = make_cadence("C", "root")
        self.assertEqual(self.written_fingerings(score)[:3], ["5", "3", "1"])

    def test_the_seventh_chord_is_fingered_on_all_four_notes(self) -> None:
        score, _ = make_cadence("C", "root")
        self.assertEqual(len(self.written_fingerings(score)), 3 + 3 + 4 + 3)

    def test_the_pedal_exercise_keeps_its_fingering(self) -> None:
        score, _ = make_pedal("C")
        self.assertEqual(self.written_fingerings(score)[:3], ["5", "3", "1"])

    def test_inversions_are_fingered_at_all(self) -> None:
        # They never were: the family shipped with none, against docs/02 Part E.
        score, _ = make_triad_inversions("C", "major", "right")
        written = self.written_fingerings(score)
        self.assertTrue(written)
        self.assertEqual(written[:6], ["1", "3", "5", "1", "2", "5"])

    def test_the_left_hand_fingers_inversions_from_the_bottom(self) -> None:
        score, _ = make_triad_inversions("C", "major", "left")
        self.assertEqual(self.written_fingerings(score)[:3], ["5", "3", "1"])

class TestTrillAndMordent(unittest.TestCase):
    """
    Where an ornament starts and where it ends, which two lessons teach.

    `classical.5` says a trill in Classical style starts on the note above the
    main one and finishes on the main note; `technique.6` says the same about
    the exercise itself, which is written out note for note so the learner can
    see it. The maker wrote main-note-first, which made both lessons false about
    the app's own material and also left every trill hanging on its upper
    neighbour — the one thing no trill does.

    The mordent is the other sign and stays main-lower-main: `classical.3`
    describes the stroked mordent as taking the note below, and this is it.
    """

    @staticmethod
    def _notes(part):
        return [n.nameWithOctave for n in part.recurse().notes]

    @staticmethod
    def _fingers(part):
        return [a.fingerNumber
                for n in part.recurse().notes
                for a in n.articulations
                if hasattr(a, "fingerNumber")]

    def _sounding(self, score):
        for part in score.parts:
            names = self._notes(part)
            if names:
                return part, names
        self.fail("no part has any notes")

    def test_a_trill_starts_on_the_note_above(self) -> None:
        score, _ = make_trill(tonic="C", notes_per_beat=4, hands="right")
        _, names = self._sounding(score)
        self.assertEqual(names[0][0], "D", f"trill began on {names[0]}, not the upper note")
        self.assertEqual(names[1][0], "C")

    def test_a_trill_ends_on_its_main_note(self) -> None:
        # Eight notes to a main note at four per beat, alternating from the
        # upper: the last of each cell has to be the note being decorated.
        score, _ = make_trill(tonic="C", notes_per_beat=4, hands="right")
        _, names = self._sounding(score)
        cell = names[:8]
        self.assertEqual(cell[-1][0], "C", f"trill ended on {cell[-1]}")
        self.assertEqual(len(cell), 8)

    def test_a_mordent_is_main_lower_main(self) -> None:
        score, _ = make_trill(tonic="C", notes_per_beat=2, hands="left", ornament="mordent")
        _, names = self._sounding(score)
        self.assertEqual([n[0] for n in names[:3]], ["C", "B", "C"])

    def test_the_two_hands_finger_the_first_note_from_their_own_end(self) -> None:
        # The right hand climbs away from the thumb and the left climbs towards
        # it, so the upper of two adjacent keys is 3 in one hand and 2 in the
        # other. One number for both was only right while the first note was
        # the lower of the pair.
        right, _ = make_trill(tonic="C", notes_per_beat=4, hands="right")
        left, _ = make_trill(tonic="C", notes_per_beat=4, hands="left")
        self.assertEqual(self._fingers(self._sounding(right)[0])[0], 3)
        self.assertEqual(self._fingers(self._sounding(left)[0])[0], 2)

    def test_the_lessons_still_say_what_this_builds(self) -> None:
        # The reason the notes are this way round is written in two lessons. If
        # one of them is reworded away, this test should be read again rather
        # than the maker quietly changed back.
        lessons = Path(__file__).resolve().parents[3] / "content" / "lessons"
        classical = " ".join((lessons / "classical.5.md").read_text(encoding="utf-8").split())
        technique = " ".join((lessons / "technique.6.md").read_text(encoding="utf-8").split())
        self.assertIn("starts on the **upper** note", classical)
        self.assertIn("on the note *above* the main one, and on the main note last", technique)


class TestKeySignatureInTheRow(unittest.TestCase):
    """
    What the Library screen prints under "Key", against what is on the page.

    `catalog_entry` filled `keySig` from the maker's `key` argument, which is a
    music21 root and not a key signature. Across the generated family — 1,012
    rows, about two thirds of the catalogue — that shipped two faults at once:
    no mode, so every minor exercise was labelled with its relative major's
    name; and music21's trailing hyphen for a flat, so the Library showed
    "Key: B-" and "Key: E-". `note_name` exists in this file because that same
    hyphen leaked into seventy titles once; nothing was watching this field.

    Every other importer already writes a real key name with its mode, so this
    was the only family doing it.
    """

    def test_a_minor_exercise_is_not_labelled_with_its_relative_major(self) -> None:
        score, entry = make_scale(ScaleSpec("A", "harmonic", "both", 1, "similar", 0.5, 60))
        declared = entry["drill"]["params"]["key"]
        # Lower case for a minor key: the convention `import_kern.key_name`
        # documents and every kern row carries.
        self.assertEqual(engraved_key(score, declared), "a minor")

    def test_a_flat_key_is_spelled_the_way_a_reader_writes_it(self) -> None:
        score, entry = make_scale(ScaleSpec("E-", "major", "both", 1, "similar", 0.5, 60))
        declared = entry["drill"]["params"]["key"]
        self.assertEqual(engraved_key(score, declared), "Eb major")

    def test_a_shape_written_without_a_signature_claims_no_key(self) -> None:
        # The seventh families are engraved with no key signature on purpose, so
        # the shape is spelled in accidentals. Naming the root as the key would
        # be false and naming C major would be worse.
        score, entry = make_seventh_arpeggio("A-", "dominant7", "both")
        declared = entry["drill"]["params"]["key"]
        self.assertIsNone(engraved_key(score, declared))

    def test_no_generated_row_ships_a_hyphen_flat_or_a_bare_root(self) -> None:
        # The whole shipping family, not a sample and not `--quick`: the fault
        # was a music21 flat spelling, so a plan with no flat key in it — which
        # is what `--quick` is — cannot see it.
        bad = []
        for score, entry in shipping_plan():
            value = engraved_key(score, (entry.get("drill") or {}).get("params", {}).get("key"))
            if value is None:
                continue
            if "-" in value:
                bad.append(f"{entry['id']}: {value}")
            elif not value.endswith((" major", " minor")):
                bad.append(f"{entry['id']}: {value} has no mode")
        self.assertEqual(bad, [], "generated rows with an unreadable key: " + "; ".join(bad))


class FlatSpelling(unittest.TestCase):
    """Seventy shipped titles read "A- major arpeggio" until this existed.

    music21 spells a flat as a trailing hyphen. Two of the five title builders
    in the generator translated it and three did not, so the Library showed
    "A- major five-finger pattern" beside "A major five-finger pattern" and
    nothing in the suite minded. A per-builder test would have missed it the
    same way the builders did; this asks every one of them the same question.
    """

    def test_note_name_writes_them_the_way_a_reader_does(self):
        self.assertEqual(note_name("A-"), "A♭")
        self.assertEqual(note_name("B-"), "B♭")
        self.assertEqual(note_name("F#"), "F♯")
        self.assertEqual(note_name("C"), "C")

    def test_no_generated_title_spells_a_flat_as_a_hyphen(self):
        titles = [
            make_arpeggio("A-", "major", "both", 2)[1]["title"],
            make_seventh_arpeggio("B-", "dominant7", "both", 2)[1]["title"],
            make_chromatic("A-", "both", 1)[1]["title"],
        ]
        for title in titles:
            self.assertIn("♭", title, title)
            self.assertNotIn("- ", title, title)

    def test_no_generated_concept_spells_a_flat_as_a_hyphen(self):
        # The same leak, one field over, and it outlived the title fix by long
        # enough to ship: every per-key concept tag is `<root>-<label>` built
        # from a music21 root, so the five flat keys produced "A--major",
        # "B--harmonic minor", "E--dominant 7th" — thirty-five distinct tags.
        # The Library prints an item's concepts on the same panel as its title,
        # and searches them, so "A flat major" found none of the A flat
        # exercises and the panel showed a double hyphen.
        for score, entry in shipping_plan():
            for concept in entry["concepts"]:
                self.assertNotIn(
                    "--", concept,
                    f"{entry['id']} carries the concept {concept!r}",
                )

    def test_a_flat_key_concept_names_the_key(self):
        # Not just "no double hyphen": the tag has to still say which key.
        tags = dict(
            arpeggio=make_arpeggio("A-", "major", "both", 2)[1]["concepts"],
            seventh=make_seventh_arpeggio("E-", "dominant7", "both")[1]["concepts"],
            scale=make_scale(ScaleSpec("B-", "harmonic", "both", 1, "similar", 0.5, 60))[1]["concepts"],
        )
        self.assertIn("A♭-major", tags["arpeggio"])
        self.assertIn("E♭-dominant 7th", tags["seventh"])
        self.assertIn("B♭-harmonic minor", tags["scale"])
        # A natural key is untouched.
        self.assertIn("A-major", make_arpeggio("A", "major", "both", 2)[1]["concepts"])
