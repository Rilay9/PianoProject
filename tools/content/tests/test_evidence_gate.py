"""
The build refuses a rung whose requirement no run can evidence (C2, C5).

Design 2026-09-26 §4, enforcement 3: a rung that requires a skill with
`observable: none`, or a standard whose conditions no run records, or evidence
its own page offers no way to give, is a promise the app cannot keep, and the
Plan screen would mark it done on evidence of something else. Since C5 a rung's
requirements are predicates in the content (`requirements`, `curriculum.schema.json`)
and `evidence/rungState.ts` reads them; this reads the same predicates against
vocabulary v0 and the catalog, and refuses the rung. Nothing is waived: C2's
three waivers (1.5's five first readings, 3.4's five reads, 4.6's reading ahead)
became a predicate the evidence can meet or an `unjudged` requirement the page
prints as the lesson's rule, and every unjudged rule is listed on every build.

Also here: `CLAIMING_CONCEPTS` keys are concept ids (G34), and the vocabulary's
own references resolve.
"""
from __future__ import annotations

import copy
import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import validate  # noqa: E402

# Looked up per call, so each test says for itself what the committed validator
# lacks rather than one import error standing for all of them.
def evidence_gate(*args):  # noqa: ANN001, ANN202
    return validate.evidence_gate(*args)


def load_vocabulary(*args):  # noqa: ANN001, ANN202
    return validate.load_vocabulary(*args)


def vocabulary_errors(*args):  # noqa: ANN001, ANN202
    return validate.vocabulary_errors(*args)

REPO_ROOT = Path(__file__).resolve().parents[3]
CONTENT = REPO_ROOT / "content"


def rung(
    lesson_id: str,
    concepts: list[str],
    requirements: list[dict] | None = None,
    exercises: list[str] | None = None,
    songs: list[str] | None = None,
) -> dict:
    return {
        "id": lesson_id,
        "concepts": concepts,
        "mastery": {"minAccuracy": 0.9, "minTempoPct": 0.8},
        "requirements": requirements if requirements is not None else [{"kind": "runs", "from": "exercises", "count": 1}],
        "exerciseOptions": exercises if exercises is not None else ["ex.1", "drill.read"],
        "songOptions": songs if songs is not None else [],
    }


def curriculum(*lessons: dict) -> dict:
    return {"stages": [{"number": 1, "units": [{"id": "u", "track": "core", "lessons": list(lessons)}]}]}


SKILLS = {
    "conditions": [
        {"id": "keep-tempo", "meaning": "the run kept a tempo", "recordedBy": "SessionRow.mode"},
        {"id": "guide-off", "meaning": "the keys did not show the next note", "recordedBy": None},
    ],
    "skills": [
        {
            "id": "reading",
            "kind": "reading",
            "observable": ["pitch"],
            "opportunity": "every-step",
            "standards": {"practice": [], "full": ["guide-off"]},
        },
        {
            "id": "keeping-going",
            "kind": "continuity",
            "observable": "none",
            "unobserved": ["stops and hesitations are not measured"],
            "opportunity": "every-step",
            "standards": {"practice": [], "full": []},
        },
    ],
}

#: The reading row the constructed rungs list, declaring the one measurable skill.
CATALOG = [{"id": "drill.read", "targetSkills": ["reading"]}, {"id": "ex.1"}]

UNJUDGED_PEDAL = {"kind": "unjudged", "rule": "pedal-clean>=0.9", "says": "Change the pedal cleanly.", "why": "pedalling is not judged"}


class TestTheGate(unittest.TestCase):
    def test_a_rung_requiring_a_skill_no_run_can_measure_is_refused(self) -> None:
        errors, _ = evidence_gate(
            curriculum(rung("9.9", [], [{"kind": "skill", "skill": "keeping-going", "state": "familiar"}])), SKILLS, CATALOG
        )
        self.assertEqual(len(errors), 1)
        self.assertIn("9.9", errors[0])
        self.assertIn("keeping-going", errors[0])
        self.assertIn("observable", errors[0])

    def test_a_concept_no_run_can_measure_is_refused_unless_the_rung_says_the_app_does_not_judge_it(self) -> None:
        errors, _ = evidence_gate(curriculum(rung("9.9", ["keeping-going"])), SKILLS, CATALOG)
        self.assertEqual(len(errors), 1)
        self.assertIn("keeping-going", errors[0])
        said = {"kind": "unjudged", "rule": "keeping-going", "says": "Keep going through a slip.", "why": "continuity is not measured"}
        errors, unjudged = evidence_gate(
            curriculum(rung("9.9", ["keeping-going"], [{"kind": "runs", "from": "exercises", "count": 1}, said])), SKILLS, CATALOG
        )
        self.assertEqual(errors, [])
        self.assertEqual(unjudged, ["9.9: keeping-going"])

    def test_a_requirement_whose_standard_no_run_records_is_refused(self) -> None:
        reads = {"kind": "reads", "skill": "reading", "standard": "full", "share": 0.9, "count": 5}
        errors, _ = evidence_gate(curriculum(rung("9.9", [], [reads])), SKILLS, CATALOG)
        self.assertEqual(len(errors), 1)
        self.assertIn("guide-off", errors[0])

    def test_a_skill_the_rung_offers_no_way_to_show_is_refused(self) -> None:
        # No option of the rung declares the skill: the page could never lead to
        # the evidence its requirement names.
        errors, _ = evidence_gate(
            curriculum(rung("9.9", [], [{"kind": "skill", "skill": "reading", "state": "familiar"}], exercises=["ex.1"])),
            SKILLS,
            CATALOG,
        )
        self.assertEqual(len(errors), 1)
        self.assertIn("no option", errors[0])

    def test_a_measurable_skill_its_page_can_show_passes(self) -> None:
        requirements = [
            {"kind": "runs", "from": "exercises", "count": 2},
            {"kind": "skill", "skill": "reading", "state": "familiar"},
            {"kind": "reads", "skill": "reading", "standard": "practice", "share": 0.85, "count": 5},
        ]
        self.assertEqual(evidence_gate(curriculum(rung("9.9", ["reading"], requirements)), SKILLS, CATALOG), ([], []))

    def test_a_count_of_runs_the_rung_cannot_offer_is_refused(self) -> None:
        errors, _ = evidence_gate(
            curriculum(rung("9.9", [], [{"kind": "runs", "from": "songs", "count": 1}], songs=[])), SKILLS, CATALOG
        )
        self.assertEqual(len(errors), 1)
        self.assertIn("songs", errors[0])

    def test_a_finished_item_is_a_requirement_only_for_the_one_rung_listing_it(self) -> None:
        done = [{"kind": "done", "item": "ex.1"}]
        errors, _ = evidence_gate(curriculum(rung("9.8", [], done), rung("9.9", [])), SKILLS, CATALOG)
        self.assertEqual(len(errors), 1)
        self.assertIn("9.9", errors[0])

    def test_a_rung_with_no_requirement_is_refused(self) -> None:
        errors, _ = evidence_gate(curriculum(rung("9.9", [], [])), SKILLS, CATALOG)
        self.assertEqual(len(errors), 1)
        self.assertIn("no requirement", errors[0])

    def test_an_unjudged_rule_is_listed_not_refused(self) -> None:
        errors, unjudged = evidence_gate(
            curriculum(rung("9.9", [], [{"kind": "runs", "from": "exercises", "count": 1}, UNJUDGED_PEDAL])), SKILLS, CATALOG
        )
        self.assertEqual(errors, [])
        self.assertEqual(unjudged, ["9.9: pedal-clean>=0.9"])

    def test_the_tree_is_refused_nothing_and_says_what_it_does_not_judge(self) -> None:
        stages = []
        for path in sorted((CONTENT / "curriculum").glob("stage-*.json")):
            stages.extend(json.loads(path.read_text(encoding="utf-8")).get("stages", []))
        skills, _ = load_vocabulary()
        catalog = json.loads((CONTENT / "catalog.static.json").read_text(encoding="utf-8"))
        errors, unjudged = evidence_gate({"stages": stages}, skills, catalog)
        self.assertEqual(errors, [])
        # The technique, ear and performance measures the lessons state and no
        # run records: listed, never silently passed.
        self.assertIn("3.5: pedal-clean>=0.9", unjudged)
        self.assertIn("2.4: dynamics-contrast>=1.6", unjudged)
        # C2's three waivers, each become what the evidence can meet or what
        # the page says the app does not judge.
        self.assertIn("4.6: reading-ahead", unjudged)
        lessons = {lesson["id"]: lesson for stage in stages for unit in stage["units"] for lesson in unit["lessons"]}
        for rung_id, standard, share in (("1.5", "full", 0.9), ("3.4", "practice", 0.85)):
            reads = [r for r in lessons[rung_id]["requirements"] if r["kind"] == "reads"]
            self.assertEqual(
                [(r["skill"], r["standard"], r["share"], r["count"]) for r in reads],
                [("sight-reading", standard, share, 5)],
                rung_id,
            )

    def test_no_rung_keeps_the_old_counting_fields(self) -> None:
        for path in sorted((CONTENT / "curriculum").glob("stage-*.json")):
            for stage in json.loads(path.read_text(encoding="utf-8")).get("stages", []):
                for unit in stage["units"]:
                    for lesson in unit["lessons"]:
                        self.assertEqual(
                            sorted(lesson["mastery"]), ["minAccuracy", "minTempoPct"], f"{lesson['id']} in {path.name}"
                        )


class TestTheVocabulary(unittest.TestCase):
    def setUp(self) -> None:
        self.skills, self.demands = load_vocabulary()
        self.catalog = json.loads((CONTENT / "catalog.static.json").read_text(encoding="utf-8"))
        stages = []
        for path in sorted((CONTENT / "curriculum").glob("stage-*.json")):
            stages.extend(json.loads(path.read_text(encoding="utf-8")).get("stages", []))
        self.curriculum = {"stages": stages}

    def test_the_committed_vocabulary_holds_together(self) -> None:
        self.assertEqual(vocabulary_errors(self.skills, self.demands, self.curriculum, self.catalog), [])

    def test_a_demand_coped_with_by_no_skill_is_named(self) -> None:
        demands = copy.deepcopy(self.demands)
        demands["demands"][0]["copedWithBy"] = "nobody"
        errors = vocabulary_errors(self.skills, demands, self.curriculum, self.catalog)
        self.assertTrue(any("nobody" in e for e in errors), errors)

    def test_an_item_naming_a_skill_the_vocabulary_lacks_is_named(self) -> None:
        catalog = copy.deepcopy(self.catalog)
        row = next(r for r in catalog if (r.get("drill") or {}).get("kind") == "sight-reading")
        row["targetSkills"] = ["sight-reading", "juggling"]
        errors = vocabulary_errors(self.skills, self.demands, self.curriculum, catalog)
        self.assertTrue(any("juggling" in e for e in errors), errors)


class TestClaimingConcepts(unittest.TestCase):
    def test_every_claiming_key_is_a_concept_id(self) -> None:
        ids = {c["id"] for c in json.loads((CONTENT / "curriculum" / "concepts.json").read_text(encoding="utf-8"))["concepts"]}
        self.assertEqual(sorted(set(validate.CLAIMING_CONCEPTS) - ids), [])


if __name__ == "__main__":
    unittest.main()
