"""
The physical gate (D0 item 4; G38, G23): no generated item asks a hand for what the family's
contract does not declare, and the open voicings first.

Part 11 named it: two open-voicing shapes asked one hand to strike fourteen and fifteen
semitones at once, and `test_generator_invariants.py` exempted them, so a structural validator
blessed what a teacher would question at once. The exemption is gone. The gate
(`family_contracts.physical_faults`) reads each score against its family's row: the widest
chord one hand strikes, a move of the hand beyond an octave and the time it has, a fast
repeated note and its solution, the fastest rate, continuous playing, the keys, and the printed
fingering against its source. The build runs it on every item it writes (`confirm_physical`).

The resolution of the two shapes is the contract's, one of the reviewer's three for each:
the quartal stack is a narrower arrangement (the root leaves the right hand, which the left
hand already sounds); the add9 is a large-hand voicing, declared with its prerequisite and its
alternative. The adversaries below are shapes no family declares — a chord beyond the hand, a
fast repeated note with no change of finger, a leap beyond the hand in a sixteenth — and each
must fail.
"""
from __future__ import annotations

import copy
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from music21 import articulations, chord, note, stream  # noqa: E402

import family_contracts as FC  # noqa: E402
import generate_exercises as G  # noqa: E402
from tests import planned  # noqa: E402


def one_hand_score(events: list, bpm: int = 60, hand: str = "RH") -> stream.Score:
    """A grand staff with `events` in one hand: (pitches or a pitch, quarter length, fingers)."""
    sc, rh, lh = G.grand_staff("adversary", bpm)
    part = rh if hand == "RH" else lh
    other = lh if hand == "RH" else rh
    total = 0.0
    for pitches, length, fingers in events:
        if isinstance(pitches, list):
            element = chord.Chord(pitches, quarterLength=length)
        else:
            element = note.Note(pitches, quarterLength=length)
        for finger in fingers or []:
            element.articulations.append(articulations.Fingering(finger))
        part.append(element)
        total += length
    other.append(note.Rest(quarterLength=total))
    return sc


def row_with(family: str, **physical) -> dict:
    row = copy.deepcopy(FC.contract(family))
    row["physical"].update(physical)
    return row


class TestTheOpenVoicings(unittest.TestCase):
    """G38: red on the shapes as they stood, green on the resolution the contract writes."""

    def test_the_shapes_as_they_stood_fail_the_gate(self) -> None:
        row = FC.contract("open_voicing")
        for flavour, pitches in (("quartal", ["C4", "F4", "B-4", "E-5"]), ("add9", ["C4", "E4", "G4", "D5"])):
            recipe = {"flavour": flavour, "hands": "both"}
            undeclared = copy.deepcopy(row)
            undeclared["physical"].pop("largeHand", None)
            sc = one_hand_score([(pitches, 4.0, [1, 2, 3, 5])])
            with self.subTest(flavour=flavour):
                faults = FC.physical_faults(undeclared, recipe, sc)
                self.assertTrue(any(f.startswith("span:") for f in faults), faults)

    def test_the_quartal_stack_is_arranged_within_the_hand(self) -> None:
        for tonic in G.HARMONY_KEYS:
            sc, entry = G.make_open_voicing(tonic, "quartal")
            with self.subTest(item=entry["id"]):
                facts = FC.physical_facts(sc)
                self.assertLessEqual(facts["hands"]["RH"]["span"], FC.AN_OCTAVE)
                self.assertEqual(FC.physical_faults(FC.contract("open_voicing"), FC.recipe_of(entry), sc, entry), [])
                self.assertEqual(entry["drill"]["params"]["intervals"], [5, 10, 15],
                                 "the fourths above the bass's root")

    def test_the_add9_passes_only_as_a_declared_large_hand_voicing(self) -> None:
        sc, entry = G.make_open_voicing("C", "add9")
        row = FC.contract("open_voicing")
        recipe = FC.recipe_of(entry)
        declared = row["physical"]["largeHand"]
        self.assertEqual(declared["when"], {"flavour": "add9"})
        self.assertTrue(declared["prerequisite"] and declared["alternative"])
        self.assertEqual(FC.physical_facts(sc)["hands"]["RH"]["span"], declared["span"])
        self.assertEqual(FC.physical_faults(row, recipe, sc, entry), [])
        for missing in ("prerequisite", "alternative"):
            stripped = copy.deepcopy(row)
            del stripped["physical"]["largeHand"][missing]
            with self.subTest(missing=missing):
                self.assertNotEqual(FC.physical_faults(stripped, recipe, sc, entry), [])
        # and the declaration covers the add9 and nothing else in the family
        sus, sus_entry = G.make_open_voicing("C", "sus2")
        self.assertFalse(FC.matches(declared["when"], FC.recipe_of(sus_entry)))

    def test_the_invariant_suite_no_longer_exempts_any_family(self) -> None:
        from tests import test_generator_invariants as inv  # noqa: PLC0415

        self.assertFalse(hasattr(inv, "STRIKES_WIDER_THAN_A_HAND"),
                         "the exemption is deleted: the contract declares a large-hand voicing or the gate refuses it")


class TestEveryItemInThePlan(unittest.TestCase):
    def test_every_generated_item_passes_the_physical_gate(self) -> None:
        faults: list[str] = []
        for sc, entry in planned.plan():
            row = FC.contract(entry["drill"]["generator"]["family"])
            faults += [f"{entry['id']}: {f}" for f in FC.physical_faults(row, FC.recipe_of(entry), sc, entry)]
        self.assertEqual(faults[:20], [], f"{len(faults)} physical faults over {len(planned.plan())} items")

    def test_fingering_verified_is_never_true_without_a_source(self) -> None:
        """The reviewer's T53 rule: a printed number is a claim, and the flag needs a source."""
        seen = 0
        for _sc, entry in planned.plan():
            params = entry["drill"]["params"]
            if params.get("fingeringVerified"):
                seen += 1
                row = FC.contract(entry["drill"]["generator"]["family"])
                with self.subTest(item=entry["id"]):
                    self.assertTrue(row["physical"]["fingering"]["source"],
                                    "fingeringVerified true and the family names no source")
        self.assertGreater(seen, 0, "no item claims verified fingering: the check saw nothing")

    def test_the_families_that_print_no_fingering_print_none(self) -> None:
        for family, items in planned.by_family().items():
            if FC.contract(family)["physical"]["fingering"]["printed"] != "none":
                continue
            for sc, entry in items:
                printed = sum(h["fingered"] for h in FC.physical_facts(sc)["hands"].values())
                with self.subTest(item=entry["id"]):
                    self.assertEqual(printed, 0)


class TestAdversaries(unittest.TestCase):
    """Shapes no contract declares: each must fail, for the reason named."""

    def test_a_chord_beyond_the_hand_fails(self) -> None:
        sc = one_hand_score([(["C4", "E4", "G4", "E5"], 4.0, None)])
        faults = FC.physical_faults(FC.contract("seventh_voicing"), {"hands": "both"}, sc)
        self.assertTrue(any(f.startswith("span:") for f in faults), faults)

    def test_a_repeated_note_figure_without_a_solution_fails(self) -> None:
        # Sixteenths on one key at ♩=120: 0.125 s apart, the same finger printed each time.
        sc = one_hand_score([("C5", 0.25, [3])] * 16, bpm=120)
        faults = FC.physical_faults(FC.contract("five_finger"), {"hands": "right"}, sc)
        self.assertTrue(any(f.startswith("repeated note:") for f in faults), faults)
        # the same figure with the fingers changing is a solution
        changing = one_hand_score([("C5", 0.25, [f]) for f in (3, 2, 1, 4) * 4], bpm=120)
        self.assertFalse(any(f.startswith("repeated note:")
                             for f in FC.physical_faults(row_with("five_finger", maxRate=10), {"hands": "right"}, changing)))

    def test_a_leap_beyond_the_hand_fails_where_no_leap_is_declared(self) -> None:
        # C4 to C6 and back, sixteenths at ♩=60: two octaves in a quarter of a second.
        sc = one_hand_score([("C4", 0.25, None), ("E4", 0.25, None), ("G4", 0.25, None), ("C5", 0.25, None),
                             ("C6", 0.25, None), ("E6", 0.25, None), ("G6", 0.25, None), ("C7", 0.25, None)])
        faults = FC.physical_faults(row_with("scale", maxRate=10), {"hands": "right"}, sc)
        self.assertTrue(any(f.startswith("leap:") for f in faults), faults)
        # a family that declares its leaps passes only within them
        stride = FC.contract("stride")
        self.assertIn("leaps", stride["physical"])
        too_fast = row_with("stride", leaps={"max": 26, "minSeconds": 1.5}, maxRate=10)
        self.assertTrue(any(f.startswith("leap:") for f in FC.physical_faults(too_fast, {"hands": "both"}, sc)))

    def test_a_rate_beyond_the_declared_one_fails(self) -> None:
        sc = one_hand_score([(p, 0.25, None) for p in ("C4", "D4", "E4", "F4", "G4", "F4", "E4", "D4")], bpm=160)
        faults = FC.physical_faults(FC.contract("five_finger"), {"hands": "right"}, sc)
        self.assertTrue(any(f.startswith("rate:") for f in faults), faults)

    def test_fingering_where_the_contract_says_none_fails(self) -> None:
        sc, entry = G.make_broken_seventh("C", "dominant7", "both")
        fingered = copy.deepcopy(sc)
        for n in list(fingered.parts[0].recurse().notes)[:2]:
            n.articulations.append(articulations.Fingering(1))
        faults = FC.physical_faults(FC.contract("broken_seventh"), FC.recipe_of(entry), fingered, entry)
        self.assertTrue(any("row says none" in f for f in faults), faults)

    def test_verified_fingering_without_a_source_fails(self) -> None:
        sc, entry = G.make_octave_scale("C", "right", 1)
        claimed = copy.deepcopy(entry)
        claimed["drill"]["params"]["fingeringVerified"] = True
        faults = FC.physical_faults(FC.contract("octave_scale"), FC.recipe_of(claimed), sc, claimed)
        self.assertIn("fingering: fingeringVerified is true and the row names no source", faults)

    def test_a_finger_passing_the_wrong_way_at_speed_fails(self) -> None:
        # Right hand going up 1-2-3 then 2 on the next key up, sixteenths at ♩=100.
        sc = one_hand_score([("C4", 0.25, [1]), ("D4", 0.25, [2]), ("E4", 0.25, [3]), ("F4", 0.25, [2])], bpm=100)
        faults = FC.physical_faults(row_with("scale", maxRate=10), {"hands": "right"}, sc)
        self.assertTrue(any("going up 3->2" in f for f in faults), faults)


if __name__ == "__main__":
    unittest.main()
