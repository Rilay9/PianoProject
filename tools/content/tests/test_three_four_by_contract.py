"""
3/4 established by a family contract, never by a general count (SR2; the orchestrator's decision under the reviewer's
ruling on SR1, `docs/review/responses/sr1-sightreading-quality.md` §3, and the cells' route 2,
`docs/review/responses/d0762e52.md` §1).

`metre.three-four` is curated-only (`content/sources/opportunity-density.json`): no count of located places
establishes it. The rhythm family's waltz patterns (`tools/content/family_contracts.json`, the `rhythm` family's
`requires`) ask for it in every bar, and the build's contract proof (`build.established_by_contract`, the app's
detector through the bridge) establishes it on each item that meets the rule. The independent witness for the metre is
partitura's time signatures, which agreed with the app's detector on every catalogue file (SR2's H7,
`docs/prompts/runs/SR2/README.md`). So 1.4's concept claim `3/4` is established by its three 4-bar waltz drills,
and `validate.concept_claim_findings` raises nothing for 1.4.

Reads the built content: run `python tools/content/build.py` first (CI: 'Build content').
"""
from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import validate  # noqa: E402

REPO = Path(__file__).resolve().parents[3]
BUILT = REPO / "app" / "public" / "content"
WALTZ_DRILLS = (
    "exercise.rhythm.waltz-quarters.4bar",
    "exercise.rhythm.waltz-half-quarter.4bar",
    "exercise.rhythm.waltz-dotted-half.4bar",
)


def built(name: str):
    path = BUILT / name
    if not path.is_file():
        raise AssertionError(f"{path} is missing: run `python tools/content/build.py` first")
    return json.loads(path.read_text(encoding="utf-8"))


class ThreeFourByContract(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.catalog = built("catalog.json")
        cls.by_id = {row["id"]: row for row in cls.catalog}
        cls.curriculum = built("curriculum.json")

    def test_curated_only_with_its_reason(self) -> None:
        table = json.loads((REPO / "content" / "sources" / "opportunity-density.json").read_text(encoding="utf-8"))
        self.assertIn("metre.three-four", table["curatedOnly"])
        self.assertNotIn("metre.three-four", table["demands"])

    def test_the_waltz_drills_establish_three_four_by_their_contract(self) -> None:
        for item in WALTZ_DRILLS:
            with self.subTest(item=item):
                measurement = self.by_id[item]["measurement"]
                self.assertIn("metre.three-four", measurement.get("established", []))
                self.assertIn("metre.three-four", measurement.get("contract", []))

    def test_nothing_establishes_three_four_but_a_contract(self) -> None:
        for row in self.catalog:
            measurement = row.get("measurement") or {}
            if "metre.three-four" in (measurement.get("established") or []):
                with self.subTest(item=row["id"]):
                    self.assertIn("metre.three-four", measurement.get("contract", []))

    def test_one_point_four_raises_no_concept_claim_finding(self) -> None:
        errors, _warnings = validate.concept_claim_findings(self.catalog, self.curriculum)
        self.assertEqual([e for e in errors if e.startswith("1.4:")], [])


if __name__ == "__main__":
    unittest.main()
