"""
Fingerings on melodic lines — the ones `confirm_fingering` cannot see.

`finalize` checks every *chord* for a finger on two notes or a crossed hand.
A scale, an arpeggio, a bass line and a chromatic run are melodies, and a
wrong finger on a melody ships silently: the file is valid, the notes are
right, and the learner practises a hand that crosses itself. These are the
faults the 2026-09-14 review found by reading the tables — sixty arpeggios
with the thumb on a black key, sixteen walking basses with the thumb on the
lowest note of the bar, twelve chromatic runs whose left hand was a right
hand — each held here to the rule it broke.
"""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from music21 import articulations, note, pitch  # noqa: E402

from generate_exercises import (  # noqa: E402
    BLACK_PITCH_CLASSES,
    chromatic_finger,
    default_plan,
    is_black_root,
    make_arpeggio,
    make_broken_seventh,
    make_chromatic,
    make_seventh_arpeggio,
    make_tumbao,
    make_walking_bass,
    walking_bass_fingers,
)


def fingered_notes(sc, part_id: str) -> list[tuple[pitch.Pitch, int | None]]:
    """(pitch, finger) for every note of one staff, in order."""
    part = next(p for p in sc.parts if p.id == part_id)
    out = []
    for element in part.recurse().notes:
        if not isinstance(element, note.Note):
            continue
        fingers = [a.fingerNumber for a in element.articulations if isinstance(a, articulations.Fingering)]
        out.append((element.pitch, fingers[0] if fingers else None))
    return out


class TestArpeggioFingering(unittest.TestCase):
    def test_a_white_root_starts_on_the_thumb_and_tops_with_the_fifth(self) -> None:
        sc, _ = make_arpeggio("C", "major", "both", 2)
        rh = [f for _, f in fingered_notes(sc, "RH")]
        self.assertEqual(rh[:7], [1, 2, 3, 1, 2, 3, 5])
        lh = [f for _, f in fingered_notes(sc, "LH")]
        self.assertEqual(lh[:7], [5, 3, 2, 5, 3, 2, 1])

    def test_a_black_root_never_takes_the_thumb(self) -> None:
        for root, quality in (("A-", "major"), ("E-", "major"), ("B-", "minor"), ("F#", "minor"), ("G-", "major")):
            sc, entry = make_arpeggio(root, quality, "both", 2)
            for part_id in ("RH", "LH"):
                notes = fingered_notes(sc, part_id)
                self.assertNotEqual(notes[0][1], 1, f"{root} {quality} {part_id} starts on the thumb")
                for p, finger in notes:
                    if p.pitchClass == pitch.Pitch(root).pitchClass:
                        self.assertNotEqual(finger, 1, f"{root} {quality} {part_id}: thumb on the root {p.nameWithOctave}")
            self.assertTrue(entry["drill"]["params"]["fingeringVerified"])

    def test_the_black_root_shape_is_hanons(self) -> None:
        sc, _ = make_arpeggio("A-", "major", "both", 2)
        self.assertEqual([f for _, f in fingered_notes(sc, "RH")][:7], [2, 1, 2, 2, 1, 2, 4])
        self.assertEqual([f for _, f in fingered_notes(sc, "LH")][:7], [2, 1, 4, 2, 1, 4, 2])

    def test_no_arpeggio_in_the_plan_puts_the_thumb_on_a_black_root(self) -> None:
        plan = default_plan(quick=False)
        for sc, entry in plan:
            if not entry["id"].startswith("exercise.arpeggio."):
                continue
            root = entry["drill"]["params"]["key"]
            if not is_black_root(root):
                continue
            for part_id in ("RH", "LH"):
                for p, finger in fingered_notes(sc, part_id):
                    if p.pitchClass == pitch.Pitch(root).pitchClass:
                        self.assertNotEqual(finger, 1, f"{entry['id']} {part_id}: thumb on {p.nameWithOctave}")


class TestSeventhArpeggioFingering(unittest.TestCase):
    def test_a_white_root_is_one_finger_a_note_with_the_thumb_under_after_the_fourth(self) -> None:
        sc, entry = make_seventh_arpeggio("C", "dominant7", "both", 2)
        self.assertEqual([f for _, f in fingered_notes(sc, "RH")][:9], [1, 2, 3, 4, 1, 2, 3, 4, 5])
        self.assertEqual([f for _, f in fingered_notes(sc, "LH")][:9], [5, 4, 3, 2, 5, 4, 3, 2, 1])
        self.assertTrue(entry["drill"]["params"]["fingeringVerified"])

    def test_a_black_root_prints_no_fingering_and_says_so(self) -> None:
        sc, entry = make_seventh_arpeggio("E-", "dominant7", "both", 2)
        self.assertTrue(all(f is None for _, f in fingered_notes(sc, "RH")))
        self.assertTrue(all(f is None for _, f in fingered_notes(sc, "LH")))
        self.assertFalse(entry["drill"]["params"]["fingeringVerified"])

    def test_a_broken_seventh_on_a_black_root_prints_no_fingering(self) -> None:
        sc, _ = make_broken_seventh("D-", "dominant7", "both")
        self.assertTrue(all(f is None for _, f in fingered_notes(sc, "RH")))
        sc, _ = make_broken_seventh("C", "dominant7", "both")
        self.assertEqual([f for _, f in fingered_notes(sc, "RH")][:8], [1, 2, 3, 4, 5, 4, 3, 2])


class TestWalkingBassFingering(unittest.TestCase):
    def test_root_third_fifth_sit_under_five_three_one(self) -> None:
        sc, _ = make_walking_bass("C", "blues", "intro")
        lh = fingered_notes(sc, "LH")
        for bar in range(12):
            self.assertEqual([f for _, f in lh[bar * 4 : bar * 4 + 3]], [5, 3, 1], f"bar {bar + 1}")

    def test_the_approach_note_is_fingered_by_where_it_lands(self) -> None:
        sc, _ = make_walking_bass("C", "blues", "intro")
        lh = fingered_notes(sc, "LH")
        # Bar 1: C E G then B below the C — the hand drops, the little finger takes it.
        self.assertEqual(lh[3][0].nameWithOctave, "B1")
        self.assertEqual(lh[3][1], 5)
        # Bar 8 -> 9: C E G then F sharp, between the third and the fifth.
        self.assertEqual(lh[7 * 4 + 3][0].name, "F#")
        self.assertEqual(lh[7 * 4 + 3][1], 2)

    def test_the_thumb_is_never_below_the_second_finger_within_a_bar(self) -> None:
        for tonic in ("C", "F", "B-", "E-"):
            for form in ("blues", "ii-V-I"):
                sc, entry = make_walking_bass(tonic, form)
                lh = fingered_notes(sc, "LH")
                for start in range(0, len(lh), 4):
                    bar = lh[start : start + 4]
                    if len(bar) < 4:
                        continue
                    by_finger = {f: p.ps for p, f in bar[:3]}
                    _, approach_finger = bar[3]
                    approach_ps = bar[3][0].ps
                    # A finger's note is never above a lower-numbered finger's in the left hand.
                    if approach_finger == 1:
                        self.assertGreaterEqual(approach_ps, by_finger[3], entry["id"])
                    if approach_finger == 5:
                        self.assertLessEqual(approach_ps, by_finger[5], entry["id"])

    def test_the_rule_as_arithmetic(self) -> None:
        line = [pitch.Pitch("C2"), pitch.Pitch("E2"), pitch.Pitch("G2"), pitch.Pitch("B1")]
        self.assertEqual(walking_bass_fingers(line), [5, 3, 1, 5])
        line[3] = pitch.Pitch("F#2")
        self.assertEqual(walking_bass_fingers(line), [5, 3, 1, 2])
        line[3] = pitch.Pitch("E2")
        self.assertEqual(walking_bass_fingers(line), [5, 3, 1, 3])
        line[3] = pitch.Pitch("D2")
        self.assertEqual(walking_bass_fingers(line), [5, 3, 1, 4])
        line[3] = pitch.Pitch("B2")
        self.assertEqual(walking_bass_fingers(line), [5, 3, 1, 1])


class TestChromaticLeftHand(unittest.TestCase):
    def test_the_right_hand_puts_two_on_f_and_c(self) -> None:
        self.assertEqual(chromatic_finger(pitch.Pitch("F4").midi, False, "right"), 2)
        self.assertEqual(chromatic_finger(pitch.Pitch("C5").midi, False, "right"), 2)
        self.assertEqual(chromatic_finger(pitch.Pitch("E4").midi, False, "right"), 1)
        self.assertEqual(chromatic_finger(pitch.Pitch("B4").midi, False, "right"), 1)

    def test_the_left_hand_puts_two_on_e_and_b(self) -> None:
        self.assertEqual(chromatic_finger(pitch.Pitch("E3").midi, False, "left"), 2)
        self.assertEqual(chromatic_finger(pitch.Pitch("B3").midi, False, "left"), 2)
        self.assertEqual(chromatic_finger(pitch.Pitch("F3").midi, False, "left"), 1)
        self.assertEqual(chromatic_finger(pitch.Pitch("C4").midi, False, "left"), 1)
        for name in ("C#3", "E-3", "F#3", "A-3", "B-3"):
            self.assertEqual(chromatic_finger(pitch.Pitch(name).midi, False, "left"), 3)

    def test_the_left_hand_never_climbs_from_the_thumb_to_the_second_finger(self) -> None:
        sc, _ = make_chromatic("C", "both", 1)
        lh = fingered_notes(sc, "LH")
        up = lh[:13]
        self.assertEqual([f for _, f in up], [1, 3, 1, 3, 2, 1, 3, 1, 3, 1, 3, 2, 1])
        for (p1, f1), (p2, f2) in zip(up, up[1:]):
            if p2.ps > p1.ps and f1 == 1:
                self.assertEqual(f2, 3, f"{p1.nameWithOctave}{f1} -> {p2.nameWithOctave}{f2}")

    def test_the_two_hands_differ_only_where_the_pairs_are(self) -> None:
        sc, _ = make_chromatic("C", "both", 1)
        rh = [f for _, f in fingered_notes(sc, "RH")]
        lh = [f for _, f in fingered_notes(sc, "LH")]
        self.assertEqual(rh[:13], [1, 3, 1, 3, 1, 2, 3, 1, 3, 1, 3, 1, 2])
        self.assertEqual(len(rh), len(lh))


class TestTumbaoAnticipation(unittest.TestCase):
    def test_the_note_on_four_is_held_through_the_barline(self) -> None:
        sc, _ = make_tumbao("C", bars=4)
        lh = next(p for p in sc.parts if p.id == "LH")
        measures = list(lh.getElementsByClass("Measure"))
        self.assertGreaterEqual(len(measures), 4)
        second = measures[1]
        first_event = next(e for e in second.notesAndRests)
        self.assertIsInstance(first_event, note.Note, "the second bar opens with the held root, not a rest")
        self.assertIsNotNone(first_event.tie)
        self.assertEqual(first_event.tie.type, "stop")
        last_of_first = list(measures[0].notes)[-1]
        self.assertIsNotNone(last_of_first.tie)
        self.assertIn(last_of_first.tie.type, ("start", "continue"))
        # And the first bar still opens on nothing: the downbeat is empty by design.
        self.assertIsInstance(next(e for e in measures[0].notesAndRests), note.Rest)


class TestHandsSeparateArpeggios(unittest.TestCase):
    def test_the_quick_plan_has_them_in_c_at_stage_four(self) -> None:
        ids = {entry["id"]: entry for _, entry in default_plan(quick=True)}
        for hands in ("right", "left"):
            entry = ids.get(f"exercise.arpeggio.c-major.2oct.{hands}")
            self.assertIsNotNone(entry, hands)
            self.assertEqual(entry["level"], 4.3)
            entry = ids.get(f"exercise.arpeggio.a-minor.2oct.{hands}")
            self.assertIsNotNone(entry, hands)


if __name__ == "__main__":
    unittest.main()
