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

The rule judges only what this build measured (Q75). An option the build did not measure (a
strict build's licence placeholder, a file the app could not load) establishes nothing and refutes
nothing (E0): it is not a checked option, the report counts it apart, and a claim whose
establishing option may be among the unmeasured is warned, never failed. The Pages deploy is the
strict build; it holds the one option that establishes 2.4's tie and ragtime.8's stride bass as
placeholders, and F2's rule counted them as checked options that establish nothing.

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


def unmeasured(item_id: str) -> dict:
    """A score this build holds no notation for, marked as `build.attach_demands` marks a strict build's placeholder."""
    return {"id": item_id, "type": "song", "file": None, "demands": "unmeasured",
            "measurement": {"status": "unmeasured",
                            "reason": "no notation is bundled: it arrives when the learner imports the piece"}}


STEPS_ONLY = [measured("exercise.f2.steps", ["interval.step"])]
A_WALK = [measured("exercise.f2.walk", ["interval.step", WALK])]
#: The one option that would establish the walk, a placeholder on this build (the strict build's 2.4 and ragtime.8).
PLACEHELD_WALK = [unmeasured("song.q75.walk")]


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


class TestOnlyWhatThisBuildMeasured(unittest.TestCase):
    """
    Q75: an unmeasured option is not a checked option. It establishes nothing, so it never keeps a
    claim; it refutes nothing, so a claim it might keep is warned on this build, not failed. A claim
    fails where every option this build holds for it was checked, or is a runtime drill no build
    checks (F2's rule), and none establishes it.
    """

    def findings(self, catalog: list[dict], options: list[str], deferred: dict | None = None,
                 concepts: list[str] | None = None) -> tuple[list[str], list[str]]:
        return validate.concept_claim_findings(
            catalog, curriculum(rung("F.1", concepts=concepts or ["walking-bass"], options=options)),
            deferred=deferred or {})

    def test_its_one_establishing_option_unmeasured_here_is_warned_not_failed(self) -> None:
        errors, warnings = self.findings(PLACEHELD_WALK, ["song.q75.walk"])
        self.assertEqual(errors, [], "the build measured no option of F.1: it cannot say the claim is unkept")
        self.assertTrue(any("F.1" in w and "walking-bass" in w and WALK in w and "1 of its options unmeasured here" in w
                            and "not judged" in w for w in warnings),
                        f"the warning names the rung, the concept and how many options this build could not measure; got {warnings}")

    def test_the_same_option_measured_and_absent_still_fails(self) -> None:
        errors, _warnings = self.findings(STEPS_ONLY, ["exercise.f2.steps"])
        self.assertTrue(any("F.1" in e and "walking-bass" in e for e in errors), errors)

    def test_one_unmeasured_and_one_measured_establishing_is_no_finding(self) -> None:
        errors, warnings = self.findings(PLACEHELD_WALK + A_WALK, ["song.q75.walk", "exercise.f2.walk"])
        self.assertEqual((errors, warnings), ([], []), "a checked option keeps the claim; the placeholder changes nothing")

    def test_one_unmeasured_and_one_measured_absent_is_warned_not_failed(self) -> None:
        """
        The Pages deploy's case: 2.4's one tie option and ragtime.8's Joplin rags are placeholders in
        the strict build, the rest measured and without the demand. The placeholder may be the option
        that keeps the claim, so the build that could not measure it does not judge it.
        """
        errors, warnings = self.findings(PLACEHELD_WALK + STEPS_ONLY, ["song.q75.walk", "exercise.f2.steps"])
        self.assertEqual(errors, [], "an unmeasured option refutes nothing: the claim is not judged on this build")
        self.assertTrue(any("F.1" in w and "1 of its options unmeasured here" in w
                            and "none of its 1 checked options establishes it" in w for w in warnings), warnings)

    def test_a_runtime_drill_beside_a_measured_absent_option_still_fails(self) -> None:
        """F2's rule for the options no build checks is unchanged: a runtime drill neither keeps nor defers a claim."""
        runtime = [{"id": "drill.f2.card", "type": "drill", "measurement": {"status": "runtime"}}]
        errors, warnings = self.findings(runtime + STEPS_ONLY, ["drill.f2.card", "exercise.f2.steps"])
        self.assertTrue(any("F.1" in e and "walking-bass" in e for e in errors), errors)
        self.assertFalse(any("not judged" in w for w in warnings), warnings)

    def test_the_failing_message_says_how_many_were_checked_and_unmeasured(self) -> None:
        catalog = STEPS_ONLY + [measured("exercise.f2.skips", ["interval.skip"])]
        errors, _warnings = self.findings(catalog, ["exercise.f2.steps", "exercise.f2.skips"])
        self.assertTrue(any("none of its 2 checked options establishes it" in e and "0 unmeasured on this build" in e
                            for e in errors),
                        f"a reader of the runner's log tells a fully measured rung from a placeholder; got {errors}")

    def test_a_deferral_whose_options_this_build_could_not_measure_is_not_stale(self) -> None:
        """A deferral is stale when the claim is kept or no longer made, never because a build could not look."""
        deferred = {("F.1", "walking-bass"): "the fixture's detector misreads this walk"}
        errors, warnings = self.findings(PLACEHELD_WALK, ["song.q75.walk"], deferred=deferred)
        self.assertEqual(errors, [], "the claim is neither kept nor dropped on this build")
        self.assertTrue(any("misreads this walk" in w and "1 unmeasured on this build" in w for w in warnings), warnings)

    def test_a_deferral_with_a_placeholder_beside_its_checked_options_still_warns_with_its_reason(self) -> None:
        deferred = {("F.1", "walking-bass"): "the fixture's detector misreads this walk"}
        errors, warnings = self.findings(PLACEHELD_WALK + STEPS_ONLY, ["song.q75.walk", "exercise.f2.steps"], deferred=deferred)
        self.assertEqual(errors, [])
        self.assertTrue(any("misreads this walk" in w and "none of its 1 checked options" in w for w in warnings), warnings)


class TestTheReportCountsTheUnmeasuredApart(unittest.TestCase):
    """
    Q75 item 2: the rung-claims report shows how many options were unmeasured where it shows how many
    were checked, so the report a strict or cold build writes does not read like the measured one.
    """

    def setUp(self) -> None:
        import claims

        self.claims = claims
        self.catalog = PLACEHELD_WALK + STEPS_ONLY
        self.curriculum = curriculum(
            rung("F.1", concepts=["walking-bass"], options=["song.q75.walk", "exercise.f2.steps"]),
            rung("F.2", concepts=[], introduces=["walking-bass"], options=["song.q75.walk"]))
        self.report = claims.rung_claims(self.catalog, self.curriculum)

    def test_a_claim_counts_its_checked_and_its_unmeasured_options_apart(self) -> None:
        row = next(c for r in self.report["rungs"] if r["rung"] == "F.1" for c in r["claims"] if c["id"] == WALK)
        self.assertEqual((row["established"], row["measurable"], row["unmeasured"]), (0, 1, 1),
                         "one option checked and without the walk, one unmeasured: not two checked options")
        introduced = next(c for r in self.report["rungs"] if r["rung"] == "F.2" for c in r["introduced"])
        self.assertEqual((introduced["measurable"], introduced["unmeasured"]), (0, 1))

    def test_the_summary_counts_unmeasured_pairs_apart_from_the_checkable(self) -> None:
        s = self.report["summary"]
        self.assertEqual((s["measurable"], s["unestablished"], s["unmeasured"]), (1, 1, 1),
                         "an unmeasured pair is neither checkable nor unestablished")

    def test_the_markdown_shows_the_unmeasured_count_beside_the_checked(self) -> None:
        text = self.claims.render_rung_claims(self.report)
        self.assertIn("unmeasured on this build: 1", text.split("## The rungs Part 12 names first")[0])
        self.assertIn(f"({WALK}) 0/1 (+1 unmeasured here)", text, "the every-rung table")
        kept = text.split("## Rung claims no option establishes")[1].split("## Concepts a rung introduces")[0]
        self.assertIn("| 1 (+1 unmeasured here) |", kept, "the claims no checked option keeps")

    def test_the_validators_count_line_says_it_too(self) -> None:
        line = validate.rung_claims_warning(self.catalog, self.curriculum)
        self.assertIn("1 of 1 checkable claims", line)
        self.assertIn("1 unmeasured on this build", line)


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
