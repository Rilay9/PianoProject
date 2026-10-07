"""
A skill says on which dimensions a change of material is transfer for it (G2, the brief's item 5).

`skills.json` may give a skill `transfer: {dimensions, why}`; the app's transfer policy
(`app/src/evidence/transferPolicy.ts`) credits transfer only on those dimensions, and a skill
without the block is credited none. The dimensions are the relationship's
(`app/src/curriculum/transfer.ts`, `DIMENSIONS`): the validator reads that list out of the
TypeScript, never a copy, and refuses a dimension it does not hold; the build's report lists every
skill without the block, so nothing is credited by a default.
"""
from __future__ import annotations

import copy
import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import validate  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parents[3]
CONTENT = REPO_ROOT / "content"


def source_curriculum() -> dict:
    stages: list[dict] = []
    for path in sorted((CONTENT / "curriculum").glob("stage-*.json")):
        stages.extend(json.loads(path.read_text(encoding="utf-8")).get("stages", []))
    return {"stages": stages}


class TestSkillTransfer(unittest.TestCase):
    def setUp(self) -> None:
        self.skills, self.demands = validate.load_vocabulary()
        self.catalog = json.loads((CONTENT / "catalog.static.json").read_text(encoding="utf-8"))
        self.curriculum = source_curriculum()

    def errors(self, skills: dict) -> list[str]:
        return validate.vocabulary_errors(skills, self.demands, self.curriculum, self.catalog)

    def with_transfer(self, skill_id: str, block) -> dict:
        skills = copy.deepcopy(self.skills)
        for skill in skills["skills"]:
            if skill["id"] == skill_id:
                if block is None:
                    skill.pop("transfer", None)
                else:
                    skill["transfer"] = block
        return skills

    def test_the_dimensions_are_read_out_of_transfer_ts(self) -> None:
        self.assertEqual(validate.transfer_dimensions(), ["family", "source", "key", "hands", "texture", "rhythm"])

    def test_the_committed_vocabulary_is_clean_and_names_only_known_dimensions(self) -> None:
        self.assertEqual(self.errors(self.skills), [])
        known = set(validate.transfer_dimensions())
        for skill in self.skills["skills"]:
            for dimension in (skill.get("transfer") or {}).get("dimensions", []):
                self.assertIn(dimension, known, skill["id"])

    def test_a_dimension_transfer_ts_does_not_hold_is_refused(self) -> None:
        skills = self.with_transfer("interval-reading", {"dimensions": ["key", "position"], "why": "a made-up dimension beside a real one"})
        errors = self.errors(skills)
        self.assertIn(
            "vocabulary: skill interval-reading names transfer dimension 'position', which transfer.ts's DIMENSIONS lacks",
            errors,
        )

    def test_a_block_needs_its_reason_and_at_least_one_dimension(self) -> None:
        errors = self.errors(self.with_transfer("interval-reading", {"dimensions": ["key"]}))
        self.assertTrue(any("'why' is a required property" in e for e in errors), errors)
        errors = self.errors(self.with_transfer("interval-reading", {"dimensions": [], "why": "no dimension at all, which says nothing"}))
        self.assertTrue(any("transfer/dimensions" in e for e in errors), errors)

    def test_the_skills_without_the_block_are_listed_by_name(self) -> None:
        # reading-ahead and the cells skill (CD1, Entry 249: observable none) are the two the app credits no transfer.
        self.assertEqual(validate.skills_without_transfer(self.skills), ["reading-ahead", "habanera-and-tresillo"])
        dropped = self.with_transfer("tie", None)
        self.assertEqual(validate.skills_without_transfer(dropped), ["reading-ahead", "tie", "habanera-and-tresillo"])

    def test_no_skill_claims_family_or_source(self) -> None:
        # Part 26: a new seed of one family is not transfer, and an authentic excerpt is not
        # transfer because it came from PDMX; the family and the source name where material came
        # from, not what the skill meets, so no skill counts them (the entry's table says why).
        for skill in self.skills["skills"]:
            dimensions = set((skill.get("transfer") or {}).get("dimensions", []))
            self.assertFalse(dimensions & {"family", "source"}, skill["id"])


if __name__ == "__main__":
    unittest.main()
