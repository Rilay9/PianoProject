"""
The generator's fingering tables against a published chart.

The chart is Clementi's Op. 42 (1801) in the Mutopia typeset, extracted by
tools/content/extract_fingering.py. What is compared is the **thumb
positions**: a scale fingering is a decision about where the thumb goes, and
the other fingers follow by stepping. The first and last notes are excluded
from the comparison and the reason is in the table's own comment — Clementi
prints two-octave runs, so his outer fingers are chosen for a hand that keeps
going.

The rules at the bottom hold whatever any chart says — no scale fingering puts
the thumb on a black key, and no hand stretches more than four notes between
thumbs — so they keep a future edit honest without a chart to consult.
"""
from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from generate_exercises import (  # noqa: E402
    HARMONIC_MINOR_FINGERING,
    MAJOR_FINGERING,
    ScaleSpec,
    _walk,
    expand_fingering,
    make_scale,
    make_syncopation,
    one_of,
)

CHART = Path(__file__).resolve().parents[3] / "content" / "sources" / "clementi-op42-fingering.json"

#: music21 spelling → the enharmonic Clementi prints, where they differ.
ENHARMONIC = {"G- major": "F# major", "E- minor": "D# minor"}

BLACK_PITCH_CLASSES = {1, 3, 6, 8, 10}
NATURAL_PITCH_CLASS = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11, 12]
HARMONIC_MINOR_STEPS = [0, 2, 3, 5, 7, 8, 11, 12]


def tonic_pitch_class(tonic: str) -> int:
    base = NATURAL_PITCH_CLASS[tonic[0]]
    return (base + tonic.count("#") - tonic.count("-")) % 12


def thumbs(fingering: list[int]) -> set[int]:
    """Positions of the thumb within the octave, ignoring the outer notes."""
    return {index for index, finger in enumerate(fingering) if finger == 1 and 0 < index < 7}


class TestAgainstClementi(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.chart = json.loads(CHART.read_text(encoding="utf-8"))["keys"]

    def check(self, name: str, ours: tuple[list[int], list[int]]) -> None:
        entry = self.chart.get(ENHARMONIC.get(name, name))
        self.assertIsNotNone(entry, f"{name} is not in the chart")
        for hand, index in (("rh", 0), ("lh", 1)):
            printed = entry[hand]["filled"]
            if any(f is None for f in printed[1:7]):
                # The edition marks this key sparsely enough that the interior
                # cannot be read off; the printed fingers are still checked.
                for position in range(1, 7):
                    if printed[position] is not None:
                        self.assertEqual(
                            ours[index][position], printed[position],
                            f"{name} {hand} position {position}",
                        )
                continue
            self.assertEqual(
                thumbs(ours[index]), thumbs(printed),
                f"{name} {hand}: thumbs at {sorted(thumbs(ours[index]))}, "
                f"Clementi has {sorted(thumbs(printed))}",
            )

    def test_every_major_scale(self) -> None:
        for tonic, fingering in MAJOR_FINGERING.items():
            with self.subTest(key=tonic):
                self.check(f"{tonic} major", fingering)

    def test_every_minor_scale(self) -> None:
        for tonic, fingering in HARMONIC_MINOR_FINGERING.items():
            with self.subTest(key=tonic):
                self.check(f"{tonic} minor", fingering)

    def test_the_chart_covers_every_key_we_generate(self) -> None:
        missing = [
            f"{tonic} {mode}"
            for mode, table in (("major", MAJOR_FINGERING), ("minor", HARMONIC_MINOR_FINGERING))
            for tonic in table
            if ENHARMONIC.get(f"{tonic} {mode}", f"{tonic} {mode}") not in self.chart
        ]
        self.assertEqual(missing, [])


class TestFingeringRules(unittest.TestCase):
    """Rules that hold for any scale fingering, whatever the chart says."""

    def all_tables(self):
        for mode, table, steps in (
            ("major", MAJOR_FINGERING, MAJOR_STEPS),
            ("minor", HARMONIC_MINOR_FINGERING, HARMONIC_MINOR_STEPS),
        ):
            for tonic, (rh, lh) in table.items():
                yield f"{tonic} {mode}", tonic, steps, rh, lh

    def test_every_table_is_one_octave(self) -> None:
        for name, _, _, rh, lh in self.all_tables():
            self.assertEqual(len(rh), 8, name)
            self.assertEqual(len(lh), 8, name)

    def test_fingers_are_fingers(self) -> None:
        for name, _, _, rh, lh in self.all_tables():
            for finger in rh + lh:
                self.assertIn(finger, {1, 2, 3, 4, 5}, name)

    def test_the_thumb_never_lands_on_a_black_key(self) -> None:
        # The one rule of scale fingering with no exceptions: the thumb is
        # too short to reach comfortably between the black keys.
        for name, tonic, steps, rh, lh in self.all_tables():
            base = tonic_pitch_class(tonic)
            for hand_name, fingering in (("RH", rh), ("LH", lh)):
                for position, finger in enumerate(fingering):
                    if finger != 1:
                        continue
                    pitch_class = (base + steps[position]) % 12
                    self.assertNotIn(
                        pitch_class, BLACK_PITCH_CLASSES,
                        f"{name} {hand_name}: thumb on a black key at position {position}",
                    )

    def test_the_hand_never_has_to_stretch_more_than_four_notes(self) -> None:
        # Between two thumbs there are at most four fingers to use.
        for name, _, _, rh, lh in self.all_tables():
            for hand_name, fingering in (("RH", rh), ("LH", lh)):
                positions = [i for i, f in enumerate(fingering) if f == 1]
                for first, second in zip(positions, positions[1:]):
                    self.assertLessEqual(second - first, 4, f"{name} {hand_name}")


if __name__ == "__main__":
    unittest.main()

class TestTheOctaveJoin(unittest.TestCase):
    """
    Where one octave of a scale meets the next.

    The two hands join differently. The right thumb *starts* each octave group,
    so the tonic in the middle of a run takes the finger the run began with. The
    left thumb *ends* one, so the middle tonic takes the finger the octave ends
    on. One rule was used for both, and every two-octave left-hand scale in C,
    G, D, A, E, B and F major — and in seven harmonic minors — printed the fifth
    finger on the middle tonic, telling the hand to jump back to its little
    finger halfway up.

    The seven flat keys hid it. Their tables begin and end on the same finger,
    so both rules agree there, and the bug was invisible in every key except the
    ones a beginner actually plays.
    """

    def test_the_left_hand_joins_on_its_thumb(self) -> None:
        for table in (MAJOR_FINGERING, HARMONIC_MINOR_FINGERING):
            for tonic, (_rh, lh) in table.items():
                fingers = expand_fingering(lh, 2, hand="left")
                self.assertEqual(len(fingers), 15, tonic)
                self.assertEqual(fingers[7], lh[-1],
                                 f"{tonic}: the middle tonic should take the finger the "
                                 f"octave ends on")

    def test_the_right_hand_joins_on_its_thumb(self) -> None:
        for table in (MAJOR_FINGERING, HARMONIC_MINOR_FINGERING):
            for tonic, (rh, _lh) in table.items():
                fingers = expand_fingering(rh, 2)
                self.assertEqual(len(fingers), 15, tonic)
                self.assertEqual(fingers[7], rh[0], tonic)

    def test_one_octave_is_the_table_itself(self) -> None:
        # Whatever the join rule, a single octave has to be exactly what the
        # chart says, in both hands.
        for tonic, (rh, lh) in MAJOR_FINGERING.items():
            self.assertEqual(expand_fingering(rh, 1), rh, tonic)
            self.assertEqual(expand_fingering(lh, 1, hand="left"), lh, tonic)

    def test_no_two_octave_scale_repeats_a_finger_on_a_step(self) -> None:
        # The symptom, measured on the score rather than the table: an ascending
        # scale that asks for a *lower* finger than the note before it has
        # either crossed the thumb under or made a mistake, and a crossing to
        # the fifth finger is not a crossing.
        for tonic in ("C", "G", "F", "B"):
            sc, _ = make_scale(ScaleSpec(tonic=tonic, mode="major", hands="left", octaves=2))
            notes = list(sc.parts[1].recurse().notes)
            for before, after in zip(notes, notes[1:]):
                if after.pitch.ps <= before.pitch.ps:
                    break  # the descent; the same rule mirrored, tested above
                fb = [a.fingerNumber for a in before.articulations
                      if hasattr(a, "fingerNumber")]
                fa = [a.fingerNumber for a in after.articulations
                      if hasattr(a, "fingerNumber")]
                if fb and fa and fa[0] > fb[0]:
                    self.assertNotEqual(
                        fa[0], 5,
                        f"{tonic}: {before.pitch.nameWithOctave}({fb[0]}) -> "
                        f"{after.pitch.nameWithOctave}({fa[0]}) climbs to the little "
                        "finger mid-scale",
                    )


class TestAWalkIsStepwise(unittest.TestCase):
    """
    `_walk` fills a phrase with a scale, and it used to fill it by repeating the
    ascending run — so the moment more than fifteen notes were asked for, the
    line hit the top C and fell two octaves to start again. It reached the page
    in three families: the staccato and legato phrases ended "A5 B5 C6 C4", and
    so did the 5/4 meter drill and both syncopation studies.
    """

    def test_every_step_is_a_step(self) -> None:
        for per_bar in (2, 3, 4, 5, 7, 10):
            walk = _walk("C", bars=4, per_bar=per_bar)
            self.assertEqual(len(walk), 4 * per_bar)
            leaps = [abs(b.ps - a.ps) for a, b in zip(walk, walk[1:])]
            self.assertLessEqual(max(leaps), 2.0,
                                 f"per_bar={per_bar}: a walk that leaps is not a walk")


class TestPhrasesEndOnABarline(unittest.TestCase):
    def test_syncopation_fills_whole_bars(self) -> None:
        # Both variants stopped part-way through a bar — fourteen quarters and
        # ten — so the last bar of each was half empty and the left hand's
        # whole-note chords ran out before the right hand did.
        for variant in ("tied-across-bar", "sixteenth"):
            sc, _ = make_syncopation(variant)
            lengths = {float(part.duration.quarterLength) for part in sc.parts}
            self.assertEqual(len(lengths), 1, f"{variant}: staves of different lengths")
            self.assertEqual(lengths.pop() % 4.0, 0.0, f"{variant}: ends mid-bar")


class TestTheInputsAreAClosedSet(unittest.TestCase):
    """
    An `else` is not a check.

    `make_shaping("C", "rise")` produced a score titled "Rise over a scale in C"
    that printed *ff* and "Fade evenly from the first note to the last", because
    "rise" is not "crescendo". There was one `raise ValueError` in three
    thousand lines, and the families that turned out to be right were the
    table-driven ones — because indexing a table raises.
    """

    def test_a_word_the_generator_does_not_know_is_an_error(self) -> None:
        with self.assertRaises(ValueError):
            one_of("shape", "rise", ("crescendo", "diminuendo"))

    def test_a_word_it_does_know_comes_back(self) -> None:
        self.assertEqual(one_of("shape", "crescendo", ("crescendo", "diminuendo")),
                         "crescendo")

    def test_the_message_names_what_was_allowed(self) -> None:
        with self.assertRaises(ValueError) as caught:
            one_of("motion", "sideways", ("similar", "contrary"))
        self.assertIn("similar", str(caught.exception))
        self.assertIn("sideways", str(caught.exception))

