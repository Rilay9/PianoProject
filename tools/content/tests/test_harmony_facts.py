"""
CF2 (`harmony_facts.py`): each fact on a score built to have it, the expected answers textbook
harmony (C, F and G7 are I, IV and V7 in C; G, C and D7 are I, IV and V7 in G), and "unknown"
wherever the score states no harmony or the row no mode.
"""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from music21 import chord, harmony, note, stream  # noqa: E402

from harmony_facts import facts  # noqa: E402


def lead_sheet(*symbols: str) -> stream.Score:
    part = stream.Part()
    for figure in symbols:
        part.append(harmony.ChordSymbol(figure))
        part.append(note.Note("E4", quarterLength=4))
    return stream.Score([part])


class Facts(unittest.TestCase):
    def test_the_rungs_own_chords(self):
        f = facts(lead_sheet("C", "F", "G7", "C"), {"keySig": "C major"})
        self.assertEqual((f["chords"], f["literalCFG"], f["numerals"], f["primaryOnly"]),
                         (["C", "F", "G7"], True, ["I", "IV", "V7"], True))

    def test_the_same_function_in_another_key_is_not_literally_c_f_g(self):
        f = facts(lead_sheet("G", "C", "D7", "G"), {"keySig": "G major"})
        self.assertEqual((f["literalCFG"], f["numerals"], f["primaryOnly"]), (False, ["I", "IV", "V7"], True))

    def test_a_minor_key_song_is_neither(self):
        f = facts(lead_sheet("Am", "G", "Am"), {"keySig": "A minor"})
        self.assertEqual((f["literalCFG"], f["numerals"], f["primaryOnly"]), (False, ["VII", "i"], False))

    def test_a_stray_chord_breaks_both(self):
        f = facts(lead_sheet("C", "F", "A-", "G7"), {"keySig": "C major"})  # music21 writes A flat "A-"
        self.assertEqual((f["literalCFG"], f["primaryOnly"]), (False, False))

    def test_written_triads_are_read_when_no_symbol_is_printed(self):
        part = stream.Part([chord.Chord(["C3", "E3", "G3"], quarterLength=4),
                            chord.Chord(["F3", "A3", "C4"], quarterLength=4)])
        f = facts(stream.Score([part]), {"keySig": "C major"})
        self.assertEqual((f["harmony"], f["chords"], f["numerals"]), ("written", ["C", "F"], ["I", "IV"]))

    def test_a_tune_alone_states_no_harmony(self):
        part = stream.Part([note.Note(p, quarterLength=1) for p in ("C4", "E4", "G4", "F4")])
        f = facts(stream.Score([part]), {"keySig": "C major"})
        self.assertEqual((f["harmony"], f["literalCFG"], f["primaryOnly"]), ("none", "unknown", "unknown"))

    def test_a_row_with_no_mode_leaves_the_function_unknown(self):
        f = facts(lead_sheet("G", "C", "D7"), {"keySig": "1 sharp"})
        self.assertEqual((f["literalCFG"], f["numerals"]), (False, None))
        self.assertTrue(f["primaryOnly"].startswith("unknown"))


if __name__ == "__main__":
    unittest.main()
