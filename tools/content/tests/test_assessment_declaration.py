"""
No family claims a judged quality its assessment declaration does not name (D0; G8, Part 15 §16).

A structurally perfect five-finger pattern can be played unevenly: if only pitch and timing are
measured, tone, evenness and ease are not claimed. Every row's `assessment` says what can be
judged, from which input, at what precision, and what stays unjudged. Three things are held:

- every judged entry names an input from the closed list (`family_contracts.INPUTS`) and a
  precision;
- a family whose items the Score screen gives a technique measure (read from
  `app/src/engine/Scoring.ts`'s `techniqueMeasureFor`, so a new measure there fails this until a
  row names it) declares that input judged, and a family with no such measure claims nothing
  from velocity, note-off or the pedal;
- a quality the items' own tags name (evenness, tone, balance, the wrist, the forearm, the
  pedal, the feel) is either judged from an input that measures it or named in the unjudged list.
"""
from __future__ import annotations

import re
import sys
import unittest
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import family_contracts as FC  # noqa: E402
from tests import planned  # noqa: E402

SCORING = Path(__file__).resolve().parents[3] / "app" / "src" / "engine" / "Scoring.ts"

#: The input each Score-screen technique measure reads.
MEASURE_INPUT = {"articulation": "note-off", "voicing": "velocity", "shaping": "velocity", "half-pedal": "cc64-value"}

#: A quality an item's tag names: the inputs that could judge it, and the words an unjudged line
#: uses for it when none does.
QUALITIES = {
    "evenness": (("velocity",), ("evenness",)),
    "tone": (("velocity",), ("tone",)),
    "balance": (("velocity",), ("balance",)),
    "melody-projection": (("velocity",), ("top note", "balance")),
    "dynamics": (("velocity",), ("dynamic", "velocity")),
    "phrasing": ((), ("phrasing",)),
    "forearm": ((), ("forearm",)),
    "wrist": ((), ("wrist",)),
    "finger-independence": ((), ("independence",)),
    "legato-pedalling": (("cc64-timing",), ("pedal",)),
    "sustain-pedal": (("cc64-timing",), ("pedal",)),
    "half-pedal": (("cc64-value",), ("pedal",)),
    "note-length": (("note-off",), ("length", "legato")),
    "feel": ((), ("feel", "swing")),
    "swing": ((), ("swing", "feel")),
    "thumb-under": ((), ("thumb",)),
    "leaps": ((), ("leap", "looking")),
}


def unmeasured_claims(row: dict, kinds: set[str]) -> tuple[set, set]:
    """(inputs the Score screen measures for these kinds and the row does not declare,
    inputs the row declares and nothing measures for these kinds)."""
    judged = {j["input"] for j in row["assessment"]["judged"]}
    wanted = {MEASURE_INPUT[k] for k in kinds if k in MEASURE_INPUT}
    return wanted - judged, judged - wanted - {"pitch", "onset-timing"}


def technique_measure_kinds() -> set[str]:
    """The drill kinds `techniqueMeasureFor` gives a measure, read from the source."""
    text = SCORING.read_text(encoding="utf-8")
    start = text.index("export function techniqueMeasureFor(")
    end = text.index("\n}\n", start)
    return set(re.findall(r"drill\.kind === '([a-z-]+)'", text[start:end]))


class TestTheDeclarationsAreWellFormed(unittest.TestCase):
    def test_every_judged_entry_names_an_input_and_a_precision(self) -> None:
        for family, row in FC.contracts().items():
            for entry in row["assessment"]["judged"]:
                with self.subTest(family=family, quality=entry.get("quality")):
                    self.assertIn(entry["input"], FC.INPUTS)
                    self.assertTrue(entry["quality"] and entry["precision"])
            with self.subTest(family=family):
                self.assertTrue(row["assessment"]["unjudged"], "every family admits something unjudged")

    def test_the_measure_map_is_the_score_screen_s(self) -> None:
        self.assertEqual(technique_measure_kinds(), set(MEASURE_INPUT))


class TestNoUnmeasuredQualityIsClaimed(unittest.TestCase):
    def test_a_measured_kind_is_declared_and_an_unmeasured_one_claims_nothing_beyond_pitch_and_time(self) -> None:
        kinds: dict[str, set] = defaultdict(set)
        for _sc, entry in planned.plan():
            kinds[entry["drill"]["generator"]["family"]].add(entry["drill"]["kind"])
        for family, row in FC.contracts().items():
            undeclared, unmeasured = unmeasured_claims(row, kinds[family])
            with self.subTest(family=family):
                self.assertEqual(undeclared, set(), "measured on the sheet and not declared")
                self.assertEqual(unmeasured, set(), "declared and measured by nothing for this family")

    def test_a_quality_the_tags_name_is_judged_or_admitted(self) -> None:
        tagged: dict[str, set] = defaultdict(set)
        for _sc, entry in planned.plan():
            for concept in entry["concepts"]:
                if concept in QUALITIES:
                    tagged[entry["drill"]["generator"]["family"]].add(concept)
        self.assertTrue(tagged, "no item names a quality: the check saw nothing")
        for family, qualities in tagged.items():
            row = FC.contract(family)
            judged = {j["input"] for j in row["assessment"]["judged"]}
            unjudged = " ".join(row["assessment"]["unjudged"]).lower()
            for quality in sorted(qualities):
                inputs, words = QUALITIES[quality]
                with self.subTest(family=family, quality=quality):
                    if not set(inputs) & judged:
                        self.assertTrue(any(word in unjudged for word in words),
                                        f"{quality} is tagged, nothing judges it, and the unjudged lines do not say so")

    def test_a_scale_claiming_evenness_from_velocity_fails(self) -> None:
        """The adversary: a technique family claiming a quality from an input nothing measures for it."""
        import copy  # noqa: PLC0415

        row = copy.deepcopy(FC.contract("scale"))
        row["assessment"]["judged"].append({"quality": "evenness", "input": "velocity", "precision": "per note"})
        self.assertEqual(unmeasured_claims(row, {"scale"}), (set(), {"velocity"}))
        dropped = copy.deepcopy(FC.contract("articulation"))
        dropped["assessment"]["judged"] = [j for j in dropped["assessment"]["judged"] if j["input"] != "note-off"]
        self.assertEqual(unmeasured_claims(dropped, {"articulation"}), ({"note-off"}, set()))


if __name__ == "__main__":
    unittest.main()
