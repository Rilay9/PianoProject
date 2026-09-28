"""
The musical evaluator the Python families share (D3 item 3; G9's second half, Part 15 §9-§12).

Two halves, each red on its own adversary:

- **The twin.** `musical_evaluator.py` ports D1's parts (`app/src/engine/sightReadingScore.ts`). Every
  constructed phrase in `fixtures/evaluator_twins.json` carries what the TypeScript scorer says of
  it (written by `app/tests/unit/studyEvaluatorTwin.test.ts`, which also holds the scorer to it);
  here the port must say exactly the same. One definition in two languages, held by one fixture.
- **The study's semantics**, which numerical parity on major four-bar phrases cannot prove (the
  reviewer's constraint): an arrival and a cadence per phrase, the authentic cadence at the close,
  the harmony read from the declared progression rather than the left hand, degrees read in the
  minor, the grammar's restatement not counted as repetition. Each with a case built to pass and one
  built to fail, and each part red on its adversary.
"""
from __future__ import annotations

import json
import re
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import musical_evaluator as ME  # noqa: E402

FIXTURE = Path(__file__).resolve().parent / "fixtures" / "evaluator_twins.json"

LENGTHS = {"w": 48, "h.": 36, "h": 24, "q.": 18, "q": 12, "e.": 9, "e": 6, "s": 3, "t": 4}
STEPS = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def midi_of(name: str) -> int:
    match = re.fullmatch(r"([A-G])([#b]?)(-?\d)", name)
    assert match, name
    alter = 1 if match.group(2) == "#" else -1 if match.group(2) == "b" else 0
    return (int(match.group(3)) + 1) * 12 + STEPS[match.group(1)] + alter


def bar_of(text: str, tied_in: bool = False) -> tuple[list[ME.WrittenNote], bool]:
    """The TypeScript helper's `barOf`: `"C4q D4e E4e r-q G4h~"`."""
    notes = []
    pending = tied_in
    ties_out = False
    for token in text.split():
        tie = token.endswith("~")
        body = token[:-1] if tie else token
        match = re.fullmatch(r"(r-|[A-G][#b]?-?\d)(w|h\.|h|q\.|q|e\.|e|s|t)", body)
        assert match, token
        midi = None if match.group(1) == "r-" else midi_of(match.group(1))
        mark = "both" if pending and tie else "stop" if pending else "start" if tie else None
        notes.append(ME.WrittenNote(midi, LENGTHS[match.group(2)], mark, match.group(2) == "t"))
        pending = tie
        ties_out = tie
    return notes, ties_out


def lines_of(texts: list[str]) -> list[list[ME.WrittenNote]]:
    out = []
    tied = False
    for text in texts:
        notes, tied = bar_of(text, tied)
        out.append(notes)
    return out


def d1_model(case: dict) -> ME.Model:
    metre = ME.Metre(case["metre"]["beats"], case["metre"]["beatType"])
    return ME.phrase_model(case["level"], case["fifths"], metre, lines_of(case["bars"]),
                           lines_of(case["left"]) if case.get("left") else None, case["maxLeap"],
                           case["restsAllowed"], case.get("harmony"))


def study(bars: list[str], harmony: list[list[int]], phrases: list[tuple[int, int, str]], *, key: int = 0,
          minor: bool = False, metre=(4, 4), restated=(), max_leap: int = 4) -> ME.Model:
    """A study model from bars and a declared progression (each bar a list of chord roots; 'V7' as 4.7)."""
    chords = [[ME.Chord(int(c), round((c % 1) * 10) == 7) for c in bar] for bar in harmony]
    return ME.Model(tonic=key, scale=ME.MINOR if minor else ME.MAJOR, metre=ME.Metre(*metre), bars=len(bars),
                    melody=ME.place_melody(lines_of(bars)), harmony=chords, max_leap=max_leap, rests_allowed=True,
                    level=None, phrases=[ME.Phrase(*p) for p in phrases], restated=frozenset(restated))


class TestTheTwin(unittest.TestCase):
    """The port says what the TypeScript scorer says, case by case."""

    def test_every_case_is_recorded_and_the_port_agrees(self) -> None:
        fixture = json.loads(FIXTURE.read_text(encoding="utf-8"))
        self.assertGreater(len(fixture["cases"]), 20)
        for case in fixture["cases"]:
            with self.subTest(case=case["name"]):
                want = case.get("expected")
                self.assertIsNotNone(want, "not recorded: run the TypeScript spec with STUDY_TWIN_WRITE=1")
                p = d1_model(case)
                parts = ME.score_parts(p)
                self.assertEqual(sorted(parts), sorted(want["parts"]))
                for name, value in want["parts"].items():
                    self.assertAlmostEqual(parts[name], value, places=12, msg=name)
                self.assertAlmostEqual(ME.total_of(parts), want["total"], places=12)
                self.assertEqual(ME.arrives(p), want["arrives"])
                self.assertEqual(ME.lands_on_beat_one(p), want["landsOnBeatOne"])
                self.assertEqual(ME.arrives_on_strong_beat(p), want["arrivesOnStrongBeat"])
                self.assertEqual(ME.ends_on_tonic(p), want["endsOnTonic"])
                self.assertEqual(ME.contour_shapes(p), want["contourShapes"])
                self.assertEqual(ME.longest_oscillation(p), want["longestOscillation"])
                self.assertEqual(ME.longest_repeat(p), want["longestRepeat"])
                self.assertAlmostEqual(ME.turn_rate(p), want["turnRate"], places=12)
                self.assertEqual(list(ME.motif_facts(p)), want["motifFacts"])
                self.assertEqual(list(ME.rest_facts(p)), want["restFacts"])
                self.assertEqual([None if not bar else bar[0].root for bar in p.harmony], want["harmony"])

    def test_a_port_that_drifts_is_caught(self) -> None:
        """The adversary: the port's arrival grade for a strong beat moved from 0.9 to 0.8 fails the twin."""
        fixture = json.loads(FIXTURE.read_text(encoding="utf-8"))
        case = next(c for c in fixture["cases"] if c["name"] == "arrives on the half bar held")
        original = ME.arrival_rhythm

        def drifted(p):
            value = original(p)
            return 0.8 if value == 0.9 else value

        ME.arrival_rhythm = drifted
        try:
            self.assertNotAlmostEqual(ME.score_parts(d1_model(case))["arrival"], case["expected"]["parts"]["arrival"],
                                      places=6)
        finally:
            ME.arrival_rhythm = original


class TestMultiPhraseSemantics(unittest.TestCase):
    """An arrival and a cadence per phrase; the authentic cadence at the close; the last phrase counts twice."""

    PERIOD = [[0], [3], [4], [4], [0], [3], [4], [0]]

    def test_each_phrase_arrives_and_the_close_counts_twice(self) -> None:
        both = study(["E4q D4q E4q G4q", "F4q E4q D4q C4q", "D4q E4q F4q E4q", "D4w",
                      "E4q D4q E4q G4q", "F4q E4q D4q C4q", "G4q F4q E4q D4q", "C4w"],
                     self.PERIOD, [(0, 4, "half"), (4, 8, "authentic")])
        self.assertAlmostEqual(ME.phrase_arrival(both, both.phrases[0]), 1.0)
        self.assertAlmostEqual(ME.study_arrival(both), 1.0)
        # the antecedent stops on an eighth: its arrival falls, and the close still counts twice
        short = study(["E4q D4q E4q G4q", "F4q E4q D4q C4q", "D4q E4q F4q E4q", "D4h. D4e B3e",
                       "E4q D4q E4q G4q", "F4q E4q D4q C4q", "G4q F4q E4q D4q", "C4w"],
                      self.PERIOD, [(0, 4, "half"), (4, 8, "authentic")])
        first = ME.phrase_arrival(short, short.phrases[0])
        self.assertLess(first, 0.5)
        self.assertAlmostEqual(ME.study_arrival(short), (first + 2 * 1.0) / 3)
        # D1's single-phrase arrival reads only the end, and cannot see the antecedent stop
        self.assertEqual(ME.arrival_rhythm(short), 1.0)

    def test_a_half_cadence_closes_on_a_tone_of_the_dominant(self) -> None:
        on_d = study(["E4q D4q E4q G4q", "F4q E4q D4q C4q", "D4q E4q F4q E4q", "D4w"],
                     [[0], [3], [4], [4]], [(0, 4, "half")])
        self.assertEqual(ME.study_cadence(on_d), 1.0)
        self.assertEqual(ME.wrong_cadences(on_d), [])
        # D1 reads a phrase closing on 2 as no close at all
        self.assertEqual(ME.arrival(ME.phrase_model(3, 0, ME.Metre(4, 4), lines_of(
            ["E4q D4q E4q G4q", "F4q E4q D4q C4q", "D4q E4q F4q E4q", "D4w"]), None, 3, True)), 0.75)
        on_e = study(["E4q D4q E4q G4q", "F4q E4q D4q C4q", "D4q E4q F4q G4q", "E4w"],
                     [[0], [3], [4], [4]], [(0, 4, "half")])
        self.assertEqual(ME.study_cadence(on_e), 0.0)
        self.assertEqual(len(ME.wrong_cadences(on_e)), 1)

    def test_the_close_is_authentic_in_the_progression_and_in_the_tune(self) -> None:
        tonic = study(["E4q D4q E4q G4q", "F4q E4q D4q C4q", "B3q C4q D4q E4q", "C4w"],
                      [[0], [3], [4], [0]], [(0, 4, "authentic")])
        self.assertEqual(ME.study_cadence(tonic), 1.0)
        third = study(["E4q D4q E4q G4q", "F4q E4q D4q C4q", "B3q C4q D4q F4q", "E4w"],
                      [[0], [3], [4], [0]], [(0, 4, "authentic")])
        self.assertEqual(ME.study_cadence(third), 0.5)
        self.assertEqual(ME.wrong_cadences(third), [])
        # the adversary: a cadence on a note outside the tonic chord
        off = study(["E4q D4q E4q G4q", "F4q E4q D4q C4q", "B3q C4q D4q E4q", "D4w"],
                    [[0], [3], [4], [0]], [(0, 4, "authentic")])
        self.assertEqual(ME.study_cadence(off), 0.0)
        self.assertIn("outside its chord", ME.wrong_cadences(off)[0])
        # the progression's own cadence: I after IV is plagal, not the authentic cadence it claims
        plagal = study(["E4q D4q E4q G4q", "F4q E4q D4q C4q", "A4q G4q F4q E4q", "C4w"],
                       [[0], [3], [3], [0]], [(0, 4, "authentic")])
        self.assertEqual(ME.study_cadence(plagal), 0.0)
        self.assertIn("no authentic cadence", ME.wrong_cadences(plagal)[0])

    def test_two_chords_in_a_bar_are_read_where_they_sound(self) -> None:
        p = study(["C4h D4h", "E4w"], [[0, 4], [0]], [(0, 2, "authentic")])
        self.assertEqual(ME.chord_at(p, 0, 0).root, 0)
        self.assertEqual(ME.chord_at(p, 0, 24).root, 4)
        self.assertEqual(ME.harmony(p), 1.0)  # C over I, D over V, E over I


class TestTheDeclaredHarmony(unittest.TestCase):
    def test_the_progression_is_read_where_the_left_hand_would_mislead(self) -> None:
        """A first-inversion chord: the left hand's first note is its third, and D1 would read the wrong chord."""
        bars = ["C4h E4h", "G4h D4h", "C4w"]
        left = ["C3w", "B2w", "C3w"]  # V6: the left hand starts on the leading tone
        inferred = ME.phrase_model(3, 0, ME.Metre(4, 4), lines_of(bars), lines_of(left), 3, True)
        self.assertEqual(inferred.harmony[1][0].root, 6)  # read as vii
        declared = study(bars, [[0], [4], [0]], [(0, 3, "authentic")])
        self.assertEqual(ME.harmony(declared), 1.0)
        self.assertLess(ME.harmony(inferred), 1.0)


class TestTheMinor(unittest.TestCase):
    A_MINOR = 9

    def test_degrees_are_read_in_the_minor(self) -> None:
        self.assertEqual(ME.degree_of(69, self.A_MINOR, ME.MINOR), 0)   # A
        self.assertEqual(ME.degree_of(72, self.A_MINOR, ME.MINOR), 2)   # C, the minor third
        self.assertEqual(ME.degree_of(68, self.A_MINOR, ME.MINOR), 6)   # G sharp, the leading tone
        self.assertEqual(ME.degree_of(67, self.A_MINOR, ME.MINOR), 6)   # G natural, the seventh
        self.assertEqual(ME.degree_of(66, self.A_MINOR, ME.MINOR), 5)   # F sharp, the raised sixth
        # the leading tone to the tonic is a step
        self.assertEqual(ME.scale_step(69, self.A_MINOR, ME.MINOR) - ME.scale_step(68, self.A_MINOR, ME.MINOR), 1)

    def test_a_minor_study_closes_on_its_own_tonic_over_its_own_dominant(self) -> None:
        bars = ["A4q B4q C5q E5q", "D5q C5q A4q C5q", "B4q C5q B4q G#4q", "A4w"]
        p = study(bars, [[0], [3], [4], [0]], [(0, 4, "authentic")], key=self.A_MINOR, minor=True)
        self.assertEqual(ME.study_cadence(p), 1.0)
        self.assertEqual(ME.phrase_arrival(p, p.phrases[0]), 1.0)  # into A by step from G sharp
        self.assertEqual(ME.harmony(p), 1.0)  # G sharp and B over E: tones of V
        # read as D1 reads it (a major key: no signature is C major), the close is the sixth degree
        as_major = ME.phrase_model(3, 0, ME.Metre(4, 4), lines_of(bars), None, 3, True, [0, 3, 4, 0])
        self.assertFalse(ME.ends_on_tonic(as_major))
        self.assertLess(ME.arrival(as_major), 1.0)

    def test_a_minor_close_on_the_leading_tone_is_wrong(self) -> None:
        p = study(["A4q B4q C5q E5q", "D5q C5q B4q A4q", "A4q B4q C5q A4q", "G#4w"],
                  [[0], [3], [4], [0]], [(0, 4, "authentic")], key=self.A_MINOR, minor=True)
        self.assertTrue(ME.wrong_cadences(p))


class TestTheGrammarsRestatementIsForm(unittest.TestCase):
    BARS = ["C4q D4q E4q C4q", "F4q E4q D4h", "E4q F4q G4h", "D4w",
            "C4q D4q E4q C4q", "F4q E4q D4h", "B3q C4q D4q B3q", "C4w"]
    HARMONY = [[0], [4], [0], [4], [0], [4], [4], [0]]

    def test_a_declared_restatement_is_not_a_repeat(self) -> None:
        declared = study(self.BARS, self.HARMONY, [(0, 4, "half"), (4, 8, "authentic")], restated=(4, 5))
        undeclared = study(self.BARS, self.HARMONY, [(0, 4, "half"), (4, 8, "authentic")])
        self.assertEqual(ME.motif_facts(declared, declared.restated)[1], 0)
        self.assertEqual(ME.motif_facts(undeclared)[1], 2)
        self.assertGreater(ME.study_motif(declared), ME.study_motif(undeclared))

    def test_the_opening_cell_varied_is_the_motif(self) -> None:
        varied = study(["C4q D4q E4q C4q", "F4h E4h", "D4q E4q F4q D4q", "G4w"], [[0], [3], [4], [4]],
                       [(0, 4, "half")])
        self.assertEqual(ME.study_motif(varied), 1.0)  # bar 3 is bar 1's rhythm and shape a step higher
        # the adversary: bars 2 and 3 share a rhythm, but the opening cell never comes back
        unrelated = study(["C4q D4q E4q C4q", "F4h E4h", "D4h G4h", "G4w"], [[0], [3], [4], [4]],
                          [(0, 4, "half")])
        self.assertEqual(ME.study_motif(unrelated), 0.0)
        self.assertEqual(ME.motif(unrelated), 1.0)  # D1's part is satisfied by any shared rhythm

    def test_the_middle_repeating_the_opening_bar_is_costed(self) -> None:
        """The brief's adversary: the middle repeats the opening bar four times."""
        drilled = study(["C4q D4q E4q C4q", "C4q D4q E4q C4q", "C4q D4q E4q C4q", "C4q D4q E4q C4q",
                         "C4q D4q E4q C4q", "F4q E4q D4h", "B3q C4q D4q B3q", "C4w"],
                        self.HARMONY, [(0, 4, "half"), (4, 8, "authentic")], restated=(4, 5))
        self.assertEqual(ME.motif_facts(drilled, drilled.restated)[1], 3)
        self.assertEqual(ME.study_motif(drilled), 0.0)


class TestEachPartOnItsAdversary(unittest.TestCase):
    """The study's parts, each on a phrase built to pass it and one built to fail it."""

    # Every strong beat on a tone of its chord, a half cadence on 2 and the close on 1 by step.
    GOOD = ["E4q D4q C4q E4q", "F4q E4q A4q G4q", "G4q F4q D4q E4q", "D4w",
            "E4q D4q C4q E4q", "F4q E4q A4q G4q", "G4q F4q B3q D4q", "C4w"]
    HARMONY = [[0], [3], [4], [4], [0], [3], [4], [0]]
    PHRASES = [(0, 4, "half"), (4, 8, "authentic")]

    def parts(self, bars, restated=(4, 5)):
        return ME.study_parts(study(bars, self.HARMONY, self.PHRASES, restated=restated))

    def test_the_good_period(self) -> None:
        good = self.parts(self.GOOD)
        for name in ("beginning", "arrival", "cadence", "harmony"):
            self.assertEqual(good[name], 1.0, name)
        self.assertGreaterEqual(ME.score_study(study(self.GOOD, self.HARMONY, self.PHRASES, restated=(4, 5)))["total"], 0.8)

    def test_the_adversaries(self) -> None:
        good = self.parts(self.GOOD)
        walk = ["E4q B4q D4q A4q", "C4q G4q D4q B4q", "F4q C4q A4q E4q", "D4w",
                "G4q C4q A4q D4q", "B3q F4q C4q G4q", "D4q A4q B3q E4q", "C4w"]
        self.assertLess(self.parts(walk, restated=())["contour"], good["contour"])
        off_beat = ["r-q E4q D4q G4q"] + self.GOOD[1:]
        self.assertLess(self.parts(off_beat)["beginning"], 1.0)
        off_chord = ["D4h F4h", "G4h B4h", "E4h G4h", "D4w"] + self.GOOD[4:]
        self.assertLess(self.parts(off_chord)["harmony"], 1.0)
        stops = self.GOOD[:3] + ["D4h. B3e C4e"] + self.GOOD[4:]
        self.assertLess(self.parts(stops)["arrival"], 1.0)
        rests_last = self.GOOD[:7] + ["C4h r-h"]
        self.assertLess(self.parts(rests_last)["rests"], good["rests"])
        leaping = ["E4q C5q G4q E5q"] + self.GOOD[1:]
        self.assertLess(self.parts(leaping)["leaps"], good["leaps"])


class TestTheGate(unittest.TestCase):
    def test_the_study_parts_and_weights_are_stated(self) -> None:
        self.assertEqual(set(ME.STUDY_PARTS), set(ME.STUDY_WEIGHTS))
        self.assertEqual(set(ME.PARTS), set(ME.WEIGHTS))
        self.assertEqual(ME.WEIGHTS, {"beginning": 1.0, "arrival": 5.0, "contour": 3.0, "motif": 1.5, "rests": 1.0,
                                      "harmony": 1.5, "leaps": 0.5})


if __name__ == "__main__":
    unittest.main()
