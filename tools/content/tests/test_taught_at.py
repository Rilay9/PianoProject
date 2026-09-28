"""
A demand can be taught at more than one rung (E0b; the reviewer's finding 2 on E0a,
`docs/review/responses/5bfe6d2.md`).

`demands.json`'s `taughtAt` named one rung, "the first rung whose concepts name" the demand:
first in the curriculum file, the order E0a stopped reading as the path. So the walking bass was
`blues.5`'s alone, and `jazz.6`, whose lesson teaches a walking line and assigns one, taught
nothing of it: a learner through `jazz.6` was withheld it at `jazz.8`. Since E0b `taughtAt` is
every rung that genuinely teaches the demand, one per path — a rung whose ancestry
(`claims.rung_ancestry`) already holds a listed rung of the same demand is not a second teaching
rung. The schema requires the list; the validator checks that every listed rung exists, the
one-per-path rule, and that each listed rung's concepts name the demand (where `taughtAtNote`
writes down a hand reading of the lesson for that rung, a warning instead, until F reads the
lesson); and it warns where a rung's concepts name the demand and no rung on its path is listed.

Each case is written to fail on the committed vocabulary and validator with the demand and the
rung in its message, except the ones marked as holding already (a sibling track, theory.9).
"""
from __future__ import annotations

import copy
import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import claims  # noqa: E402
import validate  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parents[3]
CONTENT = REPO_ROOT / "content"
WALK = "texture.walking-bass"


def source_curriculum() -> dict:
    stages: list[dict] = []
    for path in sorted((CONTENT / "curriculum").glob("stage-*.json")):
        stages.extend(json.loads(path.read_text(encoding="utf-8")).get("stages", []))
    return {"stages": stages}


class Vocabulary(unittest.TestCase):
    def setUp(self) -> None:
        self.skills, self.demands = validate.load_vocabulary()
        self.catalog = json.loads((CONTENT / "catalog.static.json").read_text(encoding="utf-8"))
        self.curriculum = source_curriculum()

    def with_taught_at(self, demand_id: str, value, note: str | None = None) -> dict:
        demands = copy.deepcopy(self.demands)
        for demand in demands["demands"]:
            if demand["id"] == demand_id:
                demand["taughtAt"] = value
                if note is not None:
                    demand["taughtAtNote"] = note
        return demands

    def errors(self, demands: dict) -> list[str]:
        return validate.vocabulary_errors(self.skills, demands, self.curriculum, self.catalog)

    def warnings(self, demands: dict) -> list[str]:
        # Looked up per call, so the committed validator's lack of it is this case's red, not the file's.
        return validate.taught_at_findings(self.skills, demands, self.curriculum)[1]


class TestTheShape(Vocabulary):
    def test_the_schema_refuses_one_rung_as_a_string(self) -> None:
        errors = self.errors(self.with_taught_at(WALK, "blues.5"))
        self.assertTrue(any("taughtAt" in e and "'blues.5' is not of type 'array'" in e for e in errors),
                        f"{WALK} taught at the string 'blues.5': the schema must require a list; got {errors}")

    def test_the_schema_refuses_null(self) -> None:
        errors = self.errors(self.with_taught_at("rhythm.sixteenths", None))
        self.assertTrue(any("taughtAt" in e and "None is not of type 'array'" in e for e in errors),
                        f"rhythm.sixteenths taught at null: taught nowhere is [] now; got {errors}")

    def test_taught_nowhere_is_an_empty_list_and_says_why(self) -> None:
        demands = self.with_taught_at("rhythm.sixteenths", [])
        self.assertEqual(self.errors(demands), [], "rhythm.sixteenths taught at []: the empty list is the shape")
        for demand in demands["demands"]:
            if demand["id"] == "rhythm.sixteenths":
                demand.pop("taughtAtNote", None)
        errors = self.errors(demands)
        self.assertTrue(any("'taughtAtNote' is a required property" in e for e in errors),
                        f"rhythm.sixteenths taught at [] with no note: the note is required; got {errors}")


class TestOneTeachingRungPerPath(Vocabulary):
    def test_two_paths_two_rungs(self) -> None:
        errors = self.errors(self.with_taught_at(WALK, ["blues.5", "jazz.6"]))
        self.assertEqual(errors, [], f"{WALK} at blues.5 and jazz.6, neither on the other's path, is valid")

    def test_a_listed_rung_on_another_listed_rung_s_path_fails(self) -> None:
        errors = self.errors(self.with_taught_at(WALK, ["blues.5", "blues.6"]))
        self.assertTrue(any(WALK in e and "'blues.6'" in e and "'blues.5'" in e and "one teaching rung per path" in e
                            for e in errors),
                        f"{WALK} at blues.5 and blues.6, which builds on blues.5: one teaching rung per path; got {errors}")

    def test_a_listed_rung_the_curriculum_lacks_fails(self) -> None:
        errors = self.errors(self.with_taught_at(WALK, ["blues.5", "jazz.66"]))
        self.assertTrue(any(WALK in e and "'jazz.66', which is not a rung" in e for e in errors),
                        f"{WALK} at jazz.66: not a rung; got {errors}")


class TestTheListIsTheLessons(Vocabulary):
    def test_a_listed_rung_whose_concepts_do_not_name_the_demand_fails(self) -> None:
        errors = self.errors(self.with_taught_at(WALK, ["blues.5", "classical.6"]))
        self.assertTrue(any(WALK in e and "'classical.6'" in e and "concepts name none of" in e for e in errors),
                        f"{WALK} at classical.6, whose concepts do not name walking-bass; got {errors}")

    def test_a_hand_reading_the_note_writes_down_warns_instead(self) -> None:
        # 3.1 teaches sharps, flats and the accidental that lasts a bar; no rung's concepts name
        # `accidentals`. The note says so, naming 3.1: a warning, never a silent pass.
        self.assertEqual(self.errors(self.demands), [])
        warned = [w for w in self.warnings(self.demands) if "pitch.chromatic" in w and "'3.1'" in w]
        self.assertEqual(len(warned), 1, f"pitch.chromatic at 3.1 is a hand reading and is warned; got {self.warnings(self.demands)}")
        errors = self.errors(self.with_taught_at("pitch.chromatic", ["3.1"], note="Read by hand from a lesson."))
        self.assertTrue(any("pitch.chromatic" in e and "'3.1'" in e for e in errors),
                        f"pitch.chromatic at 3.1 with a note that does not name 3.1 fails; got {errors}")

    def test_jazz_6_naming_the_walking_bass_must_make_the_list(self) -> None:
        demands = self.with_taught_at(WALK, ["blues.5", "jam.6"])
        self.assertEqual(self.errors(demands), [])
        warned = [w for w in self.warnings(demands) if WALK in w and "jazz.6" in w]
        self.assertEqual(len(warned), 1,
                         f"{WALK}: jazz.6's concepts name walking-bass and nothing on its path is listed; got {self.warnings(demands)}")

    def test_the_committed_lists_are_the_lessons_readings(self) -> None:
        """
        The committed vocabulary holds together, and what the build says about it is exactly what
        the entry says: `latin` names walking-bass and its lesson never teaches one (warned, not
        listed); 1.1's steps, 1.5's leap and 3.1's accidentals are hand readings the notes name.
        """
        self.assertEqual(self.errors(self.demands), [])
        warnings = self.warnings(self.demands)
        expected = [("interval.step", "1.1"), ("interval.leap", "1.5"), ("pitch.chromatic", "3.1"), (WALK, "latin")]
        for demand_id, rung in expected:
            self.assertEqual(sum(1 for w in warnings if f"demand {demand_id} " in w and f"'{rung}'" in w), 1,
                             f"{demand_id} at {rung}: one warning; got {warnings}")
        self.assertEqual(len(warnings), len(expected), warnings)


class TestTheDerivation(Vocabulary):
    def test_the_walking_bass_is_taught_on_three_paths(self) -> None:
        by_id = {d["id"]: d for d in self.demands["demands"]}
        self.assertEqual(by_id[WALK]["taughtAt"], ["blues.5", "jazz.6", "jam.6"],
                         f"{WALK}: blues.5, jazz.6 ('Comping, walking bass, and hearing the changes') and jam.6 "
                         "('Walking bass, when there is no bass player')")

    def test_the_rungs_whose_concepts_name_a_demand_one_per_path(self) -> None:
        skills = {s["id"]: s for s in self.skills["skills"]}
        demands = {d["id"]: d for d in self.demands["demands"]}
        derived = claims.teaching_rungs(self.curriculum, skills, demands)
        self.assertEqual(derived[WALK], ["blues.5", "latin", "jazz.6", "jam.6"])
        self.assertEqual(derived["rhythm.syncopation"], ["latin.3", "4.5"])
        self.assertEqual(derived["key.signature"], ["3.1", "theory.3"])
        self.assertEqual(derived["texture.hands-together"], ["2.1", "holiday"])
        # Every other derived rung is the listed one: the lists differ from the derivation only where
        # the entry says, per demand, why.
        ancestry = claims.rung_ancestry(self.curriculum)
        for demand_id, rungs in derived.items():
            listed = demands[demand_id]["taughtAt"]
            for rung in rungs:
                on_path = [r for r in listed if r in ancestry[rung]]
                if demand_id == WALK and rung == "latin":
                    self.assertEqual(on_path, [], "latin: named in passing, not a teaching rung")
                    continue
                self.assertTrue(on_path, f"{demand_id}: {rung}'s concepts name it and nothing on its path is listed")


class TestTheWalkingBassOnThePaths(unittest.TestCase):
    """The build's reading (`claims.untaught_on`), which the rung-claims report and D0's rung check share."""

    @classmethod
    def setUpClass(cls) -> None:
        cls.curriculum = source_curriculum()
        cls.ancestry = claims.rung_ancestry(cls.curriculum)
        _skills, cls.demands = claims.load_vocabulary()
        cls.item = {"id": "song.e0b.walking-probe", "demands": [WALK],
                    "measurement": {"status": "measured", "established": [WALK]}}

    def untaught(self, rung: str) -> list[str]:
        return claims.untaught_on(self.item, rung, self.ancestry, self.demands)

    def test_jazz_6_teaches_it_without_blues_5(self) -> None:
        self.assertNotIn("blues.5", self.ancestry["jazz.6"], "jazz.6's path does not go through blues.5")
        for rung in ("jazz.6", "jazz.7", "jazz.8", "jazz.9"):
            self.assertEqual(self.untaught(rung), [], f"{WALK} at {rung}: jazz.6 teaches it, on {rung}'s path")

    def test_jam_6_teaches_it_on_its_own_path(self) -> None:
        self.assertNotIn("blues.5", self.ancestry["jam.6"])
        self.assertEqual(self.untaught("jam.6"), [], f"{WALK} at jam.6: 'Walking bass, when there is no bass player'")

    def test_theory_9_and_the_sibling_tracks_still_do_not_inherit_it(self) -> None:
        # Holding already on the committed vocabulary: adding jazz.6 must not change these.
        for rung in ("theory.9", "classical.6", "chords-pop.6", "jazz.5", "latin"):
            self.assertEqual(self.untaught(rung), [WALK], f"{WALK} at {rung}: no teaching rung on its path")


if __name__ == "__main__":
    unittest.main()
