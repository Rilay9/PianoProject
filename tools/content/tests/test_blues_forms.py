"""
The twelve-bar blues builder (`blues_forms.py`).

The chord roots were counted in semitones above the tonic, so a flat key past F
came out with sharps: the IV of E flat was G sharp, and A flat's own tonic was
respelled G sharp. None of the six shipped keys (A, C, D, E, F, G) is such a
key, which is why nothing printed it, but one more key would have taught it.
"""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import blues_forms  # noqa: E402


def form(one: str, four: str, five: str) -> list[str]:
    """The twelve bars written out from the three roots: I I I I IV IV I I V IV I V."""
    return [one, one, one, one, four, four, one, one, five, four, one, five]


class TestBluesRoots(unittest.TestCase):
    def test_a_flat_key_is_spelled_with_flats(self) -> None:
        # The IV chords the brief names (A flat, D flat, G flat) and the V chords,
        # and the tonic itself, which a semitone count respelled in A flat.
        self.assertEqual(blues_forms.roots("E-"), form("E-", "A-", "B-"))
        self.assertEqual(blues_forms.roots("A-"), form("A-", "D-", "E-"))
        self.assertEqual(blues_forms.roots("D-"), form("D-", "G-", "A-"))

    def test_the_keys_already_spelled_right_are_unchanged(self) -> None:
        self.assertEqual(blues_forms.roots("C"), form("C", "F", "G"))
        self.assertEqual(blues_forms.roots("F"), form("F", "B-", "C"))
        self.assertEqual(blues_forms.roots("G"), form("G", "C", "D"))

    def test_the_other_shipped_keys_are_unchanged(self) -> None:
        self.assertEqual(blues_forms.roots("A"), form("A", "D", "E"))
        self.assertEqual(blues_forms.roots("D"), form("D", "G", "A"))
        self.assertEqual(blues_forms.roots("E"), form("E", "A", "B"))

    def test_the_semitone_form_is_still_the_same_form(self) -> None:
        self.assertEqual(blues_forms.DEGREES, [0, 0, 0, 0, 5, 5, 0, 0, 7, 5, 0, 7])


if __name__ == "__main__":
    unittest.main()
