"""
A rung claims only what its options establish, or says it introduces it (F2 item 7; the reviewer's
required change, `docs/review/responses/12af708.md`).

`validate.concept_claim_findings` reads the rung-claims report (`claims.rung_claims`, one reading
of "establishes") and fails a build where a rung's `concepts` name a measurable demand or skill that
no checkable option of the rung establishes. The same concept under the rung's `introduces` list
passes: the rung introduces it and says no piece there practises it yet. The list grants nothing:
`claims.teaching_rungs` reads `concepts` alone, so an introduced concept never makes its rung a
teaching rung and `taughtAt` never names it (`taught_at_findings` refuses a listed rung that only
introduces the demand, whatever its note says); and it never meets a requirement (the evidence gate's
existing failure, a required skill no option declares, stands).

Where a claim no option establishes is a detector's reading known to be wrong, the validator names it
in `DEFERRED_CONCEPT_CLAIMS` with the reason and warns; a deferral that no longer describes the
build (the claim established, or no longer made) fails, so none outlives its reason.

These are fixture rungs: a lesson, its options' measured facts and nothing else.
"""
from __future__ import annotations

import copy
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import validate  # noqa: E402

WALK = "texture.walking-bass"


def measured(item_id: str, demands: list[str], established: list[str] | None = None) -> dict:
    return {"id": item_id, "type": "exercise", "demands": demands,
            "measurement": {"status": "measured", "established": established if established is not None else demands}}


def curriculum(*lessons: dict) -> dict:
    return {"stages": [{"number": 6, "units": [{"id": "F", "track": "core", "lessons": list(lessons)}]}]}


def rung(rung_id: str, *, concepts: list[str], introduces: list[str] | None = None, options: list[str],
         requirements: list[dict] | None = None, prerequisites: list[str] | None = None) -> dict:
    lesson = {"id": rung_id, "title": f"Fixture {rung_id}", "concepts": concepts, "exerciseOptions": options,
              "songOptions": [], "requirements": requirements or [{"kind": "runs", "from": "exercises", "count": 1}]}
    if introduces is not None:
        lesson["introduces"] = introduces
    if prerequisites is not None:
        lesson["prerequisites"] = prerequisites
    return lesson


STEPS_ONLY = [measured("exercise.f2.steps", ["interval.step"])]
A_WALK = [measured("exercise.f2.walk", ["interval.step", WALK])]


class TestAConceptNoOptionEstablishes(unittest.TestCase):
    def test_named_in_concepts_it_fails(self) -> None:
        errors, _warnings = validate.concept_claim_findings(
            STEPS_ONLY, curriculum(rung("F.1", concepts=["walking-bass"], options=["exercise.f2.steps"])), deferred={})
        self.assertTrue(any("F.1" in e and "walking-bass" in e and WALK in e for e in errors),
                        f"F.1 names walking-bass and its one option has no walking bass: a promise the notes do not keep; got {errors}")

    def test_under_introduces_it_passes(self) -> None:
        errors, warnings = validate.concept_claim_findings(
            STEPS_ONLY, curriculum(rung("F.1", concepts=[], introduces=["walking-bass"], options=["exercise.f2.steps"])), deferred={})
        self.assertEqual(errors, [], "F.1 introduces the walking bass and says no piece there practises it yet")
        self.assertEqual(warnings, [])

    def test_kept_by_an_option_it_passes(self) -> None:
        errors, _warnings = validate.concept_claim_findings(
            A_WALK, curriculum(rung("F.1", concepts=["walking-bass"], options=["exercise.f2.walk"])), deferred={})
        self.assertEqual(errors, [], "an option establishes the walking bass: the claim is kept")

    def test_a_rung_whose_options_nobody_can_measure_is_not_judged(self) -> None:
        runtime = [{"id": "drill.f2.card", "type": "drill", "measurement": {"status": "runtime"}}]
        errors, _warnings = validate.concept_claim_findings(
            runtime, curriculum(rung("F.1", concepts=["walking-bass"], options=["drill.f2.card"])), deferred={})
        self.assertEqual(errors, [], "no checkable option: the report counts the claim as unchecked, not unkept")

    def test_an_introduced_concept_an_option_establishes_is_warned_back_to_concepts(self) -> None:
        errors, warnings = validate.concept_claim_findings(
            A_WALK, curriculum(rung("F.1", concepts=[], introduces=["walking-bass"], options=["exercise.f2.walk"])), deferred={})
        self.assertEqual(errors, [])
        self.assertTrue(any("F.1" in w and "walking-bass" in w and "concepts" in w for w in warnings),
                        f"an option establishes what F.1 only introduces: it belongs in concepts; got {warnings}")

    def test_a_concept_in_both_lists_fails(self) -> None:
        errors, _warnings = validate.concept_claim_findings(
            A_WALK, curriculum(rung("F.1", concepts=["walking-bass"], introduces=["walking-bass"], options=["exercise.f2.walk"])), deferred={})
        self.assertTrue(any("F.1" in e and "walking-bass" in e and "both" in e for e in errors),
                        f"a rung teaches a concept or introduces it, never both; got {errors}")


class TestTheDeferrals(unittest.TestCase):
    def test_a_deferred_claim_warns_with_its_reason(self) -> None:
        deferred = {("F.1", "walking-bass"): "the fixture's detector misreads this walk"}
        errors, warnings = validate.concept_claim_findings(
            STEPS_ONLY, curriculum(rung("F.1", concepts=["walking-bass"], options=["exercise.f2.steps"])), deferred=deferred)
        self.assertEqual(errors, [])
        self.assertTrue(any("F.1" in w and "misreads this walk" in w for w in warnings), warnings)

    def test_a_deferral_the_build_no_longer_needs_fails(self) -> None:
        deferred = {("F.1", "walking-bass"): "the fixture's detector misreads this walk"}
        errors, _warnings = validate.concept_claim_findings(
            A_WALK, curriculum(rung("F.1", concepts=["walking-bass"], options=["exercise.f2.walk"])), deferred=deferred)
        self.assertTrue(any("F.1" in e and "walking-bass" in e and "deferr" in e for e in errors),
                        f"the claim is kept now: remove the deferral; got {errors}")


class TestTheListGrantsNothing(unittest.TestCase):
    def setUp(self) -> None:
        self.skills, self.demands = validate.load_vocabulary()

    def test_an_introduced_skill_never_meets_a_requirement(self) -> None:
        """
        The evidence gate's existing failure, pinned against the new list: F.1 requires interval
        reading, introduces it, and has no option declaring it in `targetSkills` — refused, as it was
        before `introduces` existed.
        """
        catalog = [{**measured("exercise.f2.steps", ["interval.step"]), "targetSkills": []}]
        lesson = rung("F.1", concepts=[], introduces=["interval-reading"], options=["exercise.f2.steps"],
                      requirements=[{"kind": "skill", "skill": "interval-reading", "state": "familiar"}])
        errors, _unjudged = validate.evidence_gate(curriculum(lesson), self.skills, catalog)
        self.assertTrue(any("F.1" in e and "requires interval-reading" in e and "targetSkills" in e for e in errors),
                        f"introducing a skill is not evidence of it; got {errors}")

    def test_taught_at_may_not_name_a_rung_that_only_introduces_the_demand(self) -> None:
        demands = copy.deepcopy(self.demands)
        for demand in demands["demands"]:
            if demand["id"] == WALK:
                demand["taughtAt"] = ["F.1"]
                demand["taughtAtNote"] = "F.1 is read by hand: its lesson teaches the walking line."
        cur = curriculum(rung("F.1", concepts=[], introduces=["walking-bass"], options=["exercise.f2.steps"]))
        errors, _warnings = validate.taught_at_findings(self.skills, demands, cur)
        self.assertTrue(any(WALK in e and "'F.1'" in e and "introduces" in e for e in errors),
                        f"a hand-reading note must not make an introducing rung a teaching rung; got {errors}")

    def test_an_unknown_concept_under_introduces_is_refused(self) -> None:
        cur = curriculum(rung("F.1", concepts=[], introduces=["no-such-concept"], options=[]))
        cur["concepts"] = [{"id": "walking-bass", "display": "Walking bass"}]
        errors = validate.unknown_concepts(cur)
        self.assertTrue(any("no-such-concept" in e for e in errors), errors)


if __name__ == "__main__":
    unittest.main()
