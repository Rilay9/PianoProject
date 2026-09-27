"""
Every generated item's demands are measured by the app's own detectors, and satisfy its family's
contract (D0 items 2 and 3; G3, G4; Q41's measured-demand cases).

**The bridge regression comes first.** `tools/content/demands.py` is a bridge, not a twin: it hands
files to `app/tests/unit/demandsOfFiles.test.ts` under Vitest, which runs `app/src/demands/detect.ts`
— the one definition of every demand — and reads the ids back. The items pinned in
`fixtures/bridge_regression.json` were read from their notation by hand; this file sends them
through the bridge and `demandsOfFiles.test.ts` reads the same items from the content build
directly, both held to the same ids. If the bridge ever returned something the detectors did not,
one side would go red. No Python reading of a demand exists or is added here.

**Then the contract.** The whole shipping plan is written out and measured in one bridge run
(`planned.measured`), and each item is held to its family's row by `pedagogical_faults`: presence,
useful density (a count, or a count per bar, note or step), overconcentration where the family
says it defeats the purpose, absence of the forbidden demands, and each target skill's opportunity
in the music. Thresholds are the family's own, each with its reason in the row; there is no
universal percentage.

**And the rung.** The combination appropriate to the rung the item sits on: every measured demand
of an item a rung lists, against the curriculum's order and `demands.json`'s `taughtAt`, on the
earliest rung listing it (the sight-reading promise test's rule). D0 changes no placement (the
round-robin stays, G18), so what this finds is recorded, family by rung by demand, in
`fixtures/untaught_on_rung.json` — the pedagogical gate's report, for E's needs-versus-taught gate
to act on. The test fails when a new combination appears or a recorded one disappears.
"""
from __future__ import annotations

import copy
import json
import sys
import tempfile
import unittest
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import demands  # noqa: E402
import family_contracts as FC  # noqa: E402
import generate_exercises as G  # noqa: E402
from tests import planned  # noqa: E402

FIXTURES = Path(__file__).resolve().parent / "fixtures"
REPO = Path(__file__).resolve().parents[3]


def lesson_order() -> list[str]:
    """Rung ids in the curriculum's order, as `build.py` assembles `curriculum.json` from the sources."""
    stages: list[dict] = []
    for path in sorted((REPO / "content" / "curriculum").glob("*.json")):
        if path.name == "concepts.json":
            continue
        stages.extend(json.loads(path.read_text(encoding="utf-8")).get("stages", []))
    stages.sort(key=lambda stage: stage["number"])
    return [lesson["id"] for stage in stages for unit in stage.get("units", []) for lesson in unit.get("lessons", [])]


def first_listing() -> dict[str, str]:
    """`{item id: the earliest rung listing it}`, over exercise and song options."""
    out: dict[str, str] = {}
    stages: list[dict] = []
    for path in sorted((REPO / "content" / "curriculum").glob("*.json")):
        if path.name == "concepts.json":
            continue
        stages.extend(json.loads(path.read_text(encoding="utf-8")).get("stages", []))
    stages.sort(key=lambda stage: stage["number"])
    for stage in stages:
        for unit in stage.get("units", []):
            for lesson in unit.get("lessons", []):
                for item_id in lesson.get("exerciseOptions", []) + lesson.get("songOptions", []):
                    out.setdefault(item_id, lesson["id"])
    return out


class TestTheBridgeReturnsTheDetectorsIds(unittest.TestCase):
    """First: generated files through `demands.py` give exactly the pinned ids."""

    def test_the_pinned_generated_items_through_the_bridge(self) -> None:
        pinned = json.loads((FIXTURES / "bridge_regression.json").read_text(encoding="utf-8"))["items"]
        wanted = {item["id"]: item["demands"] for item in pinned}
        built = {entry["id"]: (sc, entry) for sc, entry in planned.plan() if entry["id"] in wanted}
        self.assertEqual(sorted(built), sorted(wanted), "a pinned item is not in the plan")
        with tempfile.TemporaryDirectory() as scratch:
            paths = planned.write_all(Path(scratch), list(built.values()))
            answered = demands.measure_opportunities(list(paths.values()))
            for item_id, path in paths.items():
                row = answered[str(path)]
                with self.subTest(item=item_id):
                    self.assertEqual(row["demands"], wanted[item_id])
                    # the counts are the same detectors' `at` lists: a present demand was located or
                    # is present with nowhere to point (a key signature whose letters never sound)
                    for demand in row["demands"]:
                        self.assertGreaterEqual(row["opportunities"][demand], 0)
                    for demand, n in row["opportunities"].items():
                        if n > 0:
                            self.assertIn(demand, row["demands"])

    def test_the_bridge_measures_the_whole_plan_and_misses_nothing(self) -> None:
        measured = planned.measured()
        self.assertEqual(sorted(measured), sorted(entry["id"] for _sc, entry in planned.plan()))


class TestEveryItemSatisfiesItsContract(unittest.TestCase):
    def test_presence_density_overconcentration_and_absence_hold_for_every_item(self) -> None:
        measured = planned.measured()
        faults: list[str] = []
        for _sc, entry in planned.plan():
            row = FC.contract(entry["drill"]["generator"]["family"])
            faults += [f"{entry['id']}: {f}"
                       for f in FC.pedagogical_faults(row, FC.recipe_of(entry), measured[entry["id"]])]
        self.assertEqual(faults[:20], [], f"{len(faults)} pedagogical faults")

    def test_a_contract_claiming_an_opportunity_the_music_lacks_fails(self) -> None:
        """The adversary: the same measured item, a contract that claims what is not there."""
        measured = planned.measured()
        _sc, entry = next(p for p in planned.plan() if p[1]["id"] == "exercise.interval-reading.c-position.right.01")
        row = FC.contract("interval_reading")
        recipe = FC.recipe_of(entry)
        claims_a_leap = copy.deepcopy(row)
        claims_a_leap["requires"].append({"demand": "interval.leap", "min": 1})
        self.assertIn("presence: interval.leap is required and absent",
                      FC.pedagogical_faults(claims_a_leap, recipe, measured[entry["id"]]))
        claims_triplets = copy.deepcopy(row)
        claims_triplets["target"]["primary"] = [{"skill": "triplets"}]
        self.assertTrue(any(f.startswith("target: triplets")
                            for f in FC.pedagogical_faults(claims_triplets, recipe, measured[entry["id"]])))

    def test_no_threshold_is_universal(self) -> None:
        """Part 15 §13: family-specific thresholds, never one universal percentage."""
        stated = Counter()
        families_with_density = set()
        for family, row in FC.contracts().items():
            for rule in row["requires"]:
                if "minPer" in rule:
                    stated[(rule["minPer"][0], rule["minPer"][1])] += 1
                    families_with_density.add(family)
                if "min" in rule:
                    stated[("count", rule["min"])] += 1
                    families_with_density.add(family)
        self.assertGreater(len(stated), 5)
        most, count = stated.most_common(1)[0]
        self.assertLess(count, len(families_with_density), f"{most} is stated by every family that states a density")

    def test_the_five_finger_patterns_are_spelled_in_their_key(self) -> None:
        """
        What the measured demands found: twenty patterns spelled by pitch class (B major as B C-sharp
        E-flat E F-sharp), read by the detectors as skips and chromatic notes in a family that writes
        neither. Held for every key the plan builds.
        """
        measured = planned.measured()
        seen = 0
        for _sc, entry in planned.by_family()["five_finger"]:
            seen += 1
            with self.subTest(item=entry["id"]):
                self.assertNotIn("pitch.chromatic", measured[entry["id"]]["demands"])
                self.assertNotIn("interval.skip", measured[entry["id"]]["demands"])
        self.assertEqual(seen, 48)


class TestTheRungTheItemSitsOn(unittest.TestCase):
    def test_untaught_demands_on_the_earliest_listing_rung_are_the_recorded_ones(self) -> None:
        order = lesson_order()
        first = first_listing()
        measured = planned.measured()
        found: Counter = Counter()
        for _sc, entry in planned.plan():
            rung = first.get(entry["id"])
            if rung is None or rung not in order:
                continue
            for demand in FC.untaught_on(order.index(rung), measured[entry["id"]], order):
                found[(entry["drill"]["generator"]["family"], rung, demand)] += 1
        recorded = json.loads((FIXTURES / "untaught_on_rung.json").read_text(encoding="utf-8"))["found"]
        pinned = Counter({(r["family"], r["rung"], r["demand"]): r["items"] for r in recorded})
        new = {f"{k[0]} on {k[1]}: {k[2]} x{n}" for k, n in found.items() if pinned.get(k) != n}
        gone = {f"{k[0]} on {k[1]}: {k[2]} x{n}" for k, n in pinned.items() if found.get(k) != n}
        self.assertEqual(sorted(new), [], "untaught combinations the record does not hold")
        self.assertEqual(sorted(gone), [], "recorded combinations no longer found: remove them from the record")


if __name__ == "__main__":
    unittest.main()
