"""
The build refuses a rung that requires evidence no run can give (C2).

Design 2026-09-26 §4, enforcement 3: a rung whose requirement names a skill with
`observable: none`, or a condition no run records, or a count nothing counts, is
a promise the app cannot keep, and the Plan screen would mark it done on
evidence of something else. Vocabulary v0 (`content/curriculum/vocabulary/`)
says what each reading skill's observable and conditions are; `validate.py`
reads it and refuses the rung. The refusals the tree already carries are
waivers with reasons until C5 turns rung requirements into predicates.

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


def rung(lesson_id: str, concepts: list[str], custom: str | None = None) -> dict:
    mastery: dict = {"exercisesRequired": 1, "songsRequired": 0, "minAccuracy": 0.9, "minTempoPct": 0.8}
    if custom is not None:
        mastery["custom"] = custom
    return {"id": lesson_id, "concepts": concepts, "mastery": mastery, "exerciseOptions": [], "songOptions": []}


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
    "requirementTerms": [
        {"term": "read-5", "skill": "reading", "standard": "practice", "runs": 5, "evaluatedBy": "lessonComplete"},
        {"term": "read-5-unseen", "skill": "reading", "standard": "full", "runs": 5, "evaluatedBy": "lessonComplete"},
        {"term": "read-5-counted-by-nobody", "skill": "reading", "standard": "practice", "runs": 5, "evaluatedBy": None},
    ],
    "gateWaivers": [],
}


class TestTheGate(unittest.TestCase):
    def test_a_rung_requiring_a_skill_no_run_can_measure_is_refused(self) -> None:
        errors, waived, _ = evidence_gate(curriculum(rung("9.9", ["keeping-going"])), SKILLS)
        self.assertEqual(waived, [])
        self.assertEqual(len(errors), 1)
        self.assertIn("9.9", errors[0])
        self.assertIn("keeping-going", errors[0])
        self.assertIn("observable", errors[0])

    def test_a_requirement_whose_standard_no_run_records_is_refused(self) -> None:
        errors, _, _ = evidence_gate(curriculum(rung("9.9", [], "read-5-unseen>=0.9")), SKILLS)
        self.assertEqual(len(errors), 1)
        self.assertIn("guide-off", errors[0])

    def test_a_count_nothing_counts_is_refused(self) -> None:
        errors, _, _ = evidence_gate(curriculum(rung("9.9", [], "read-5-counted-by-nobody>=0.9")), SKILLS)
        self.assertEqual(len(errors), 1)
        self.assertIn("nothing evaluates", errors[0])

    def test_a_measurable_skill_with_a_counted_requirement_passes(self) -> None:
        errors, waived, unjudged = evidence_gate(curriculum(rung("9.9", ["reading"], "read-5>=0.85")), SKILLS)
        self.assertEqual((errors, waived, unjudged), ([], [], []))

    def test_a_waiver_turns_the_refusal_into_a_named_exception(self) -> None:
        skills = copy.deepcopy(SKILLS)
        skills["gateWaivers"] = [
            {"rung": "9.9", "skill": "keeping-going", "reason": "continuity is not measured yet; C5 decides", "until": "C5"}
        ]
        errors, waived, _ = evidence_gate(curriculum(rung("9.9", ["keeping-going"])), skills)
        self.assertEqual(errors, [])
        self.assertEqual(len(waived), 1)
        self.assertIn("9.9", waived[0])

    def test_a_waiver_nothing_needs_is_an_error(self) -> None:
        skills = copy.deepcopy(SKILLS)
        skills["gateWaivers"] = [{"rung": "9.9", "skill": "reading", "reason": "no longer true", "until": "C5"}]
        errors, _, _ = evidence_gate(curriculum(rung("9.9", ["reading"])), skills)
        self.assertEqual(len(errors), 1)
        self.assertIn("waiver", errors[0])

    def test_a_measure_outside_the_vocabulary_is_reported_not_refused(self) -> None:
        errors, _, unjudged = evidence_gate(curriculum(rung("9.9", [], "pedal-clean>=0.9")), SKILLS)
        self.assertEqual(errors, [])
        self.assertEqual(unjudged, ["9.9: pedal-clean"])

    def test_a_comparison_written_as_prose_is_listed_whole(self) -> None:
        errors, _, unjudged = evidence_gate(curriculum(rung("9.9", [], "two clean passes, then blind at >=0.9")), SKILLS)
        self.assertEqual(errors, [])
        self.assertEqual(unjudged, ['9.9: "two clean passes, then blind at >=0.9"'])

    def test_the_tree_carries_exactly_its_waivers(self) -> None:
        stages = []
        for path in sorted((CONTENT / "curriculum").glob("stage-*.json")):
            stages.extend(json.loads(path.read_text(encoding="utf-8")).get("stages", []))
        skills, _ = load_vocabulary()
        errors, waived, unjudged = evidence_gate({"stages": stages}, skills)
        self.assertEqual(errors, [])
        self.assertEqual(sorted(w.split(":")[0] for w in waived), ["1.5", "3.4", "4.6"])
        # The technique, ear and performance measures named in `mastery.custom`
        # are outside v0: counted, never silently passed.
        self.assertIn("3.5: pedal-clean", unjudged)
        self.assertIn("2.4: dynamics-contrast", unjudged)


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
