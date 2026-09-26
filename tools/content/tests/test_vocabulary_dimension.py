"""
Every demand names the musical dimension it belongs to (C4b).

The vocabulary is the ontology of musical demands (the reviewer, Part 8, the
fourth message §4): a demand's `dimension` says what kind of musical fact it is
(an interval, a rhythm, the clef, the range, the key, an accidental, the metre,
the texture), from one small closed list in `demands.schema.json`. What the
generator can change to write or remove a demand is not here: that map is app
code (`app/src/engine/readingControls.ts`), so a later generator can be
unbundled without touching the vocabulary or the evidence that names it.
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
VOCABULARY = CONTENT / "curriculum" / "vocabulary"

#: The closed list, as the schema holds it.
DIMENSIONS = ["clef", "interval", "rhythm", "metre", "key", "accidental", "range", "texture"]


class TestDemandDimension(unittest.TestCase):
    def setUp(self) -> None:
        self.skills, self.demands = validate.load_vocabulary()
        self.catalog = json.loads((CONTENT / "catalog.static.json").read_text(encoding="utf-8"))
        stages = []
        for path in sorted((CONTENT / "curriculum").glob("stage-*.json")):
            stages.extend(json.loads(path.read_text(encoding="utf-8")).get("stages", []))
        self.curriculum = {"stages": stages}

    def errors(self, demands: dict) -> list[str]:
        return validate.vocabulary_errors(self.skills, demands, self.curriculum, self.catalog)

    def test_the_schema_holds_the_closed_list(self) -> None:
        schema = json.loads((VOCABULARY / "demands.schema.json").read_text(encoding="utf-8"))
        item = schema["properties"]["demands"]["items"]
        self.assertIn("dimension", item["required"])
        self.assertEqual(item["properties"]["dimension"]["enum"], DIMENSIONS)

    def test_every_committed_demand_names_a_dimension_from_the_list(self) -> None:
        missing = [d["id"] for d in self.demands["demands"] if d.get("dimension") not in DIMENSIONS]
        self.assertEqual(missing, [])
        self.assertEqual(self.errors(self.demands), [])

    def test_a_demand_without_a_dimension_is_refused(self) -> None:
        demands = copy.deepcopy(self.demands)
        demands["demands"][0].pop("dimension", None)
        errors = self.errors(demands)
        self.assertTrue(any("'dimension' is a required property" in e for e in errors), errors)

    def test_a_dimension_outside_the_list_is_refused(self) -> None:
        demands = copy.deepcopy(self.demands)
        demands["demands"][0]["dimension"] = "hands"
        errors = self.errors(demands)
        self.assertTrue(any("'hands' is not one of" in e for e in errors), errors)

    def test_the_dimension_is_the_demand_s_own_family_but_where_the_family_is_pitch(self) -> None:
        # A demand's id already says its family (`rhythm.ties`); the dimension is
        # that family, except that `pitch.*` names two different musical facts: a
        # ledger line is how far the music ranges, a note outside the key is an
        # accidental.
        expected = {"pitch.ledger": "range", "pitch.chromatic": "accidental"}
        for demand in self.demands["demands"]:
            family = demand["id"].split(".", 1)[0]
            self.assertEqual(demand.get("dimension"), expected.get(demand["id"], family), demand["id"])


if __name__ == "__main__":
    unittest.main()
