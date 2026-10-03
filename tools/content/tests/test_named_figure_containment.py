"""
CQ1 (`docs/prompts/runs/CQ1/decision.md`): a broad accompaniment result (`leftHandPattern`) or the
`walkingBass` heuristic cannot certify a named style.

The eight named-style concepts were mapped onto the two broad demands, so a rung naming "alberti" was
"established" by any option whose notes tripped the broad flag, among them two-hand scales, Hanon and
arpeggios (content-mistakes 1, 2). They map to no demand now. Each case below fails on `claims.py` at
738e23e (the run record shows it red there) and holds after.

What does not move: the hand-set `taughtAt` in `demands.json` and so the prerequisite gate and the D0 rung
check (`claims.untaught_on`). Uncertainty may restrict and never grants (content-mistakes 6).
"""
from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import claims  # noqa: E402

REPO = Path(__file__).resolve().parents[3]
BUILT = REPO / "app" / "public" / "content"
FIXTURES = Path(__file__).resolve().parent / "fixtures"
VOCABULARY = REPO / "content" / "curriculum" / "vocabulary"

NAMED = ("alberti", "alberti-bass", "broken-chord-accompaniment", "waltz-bass", "oom-pah-bass", "boogie-bass",
         "stride-bass", "walking-bass")
TWO_HAND_FAMILIES = {"scale", "octave_scale", "double_scale", "arpeggio", "seventh_arpeggio", "broken_seventh", "hanon",
                     "triad_inversions", "five_finger"}


def built(name: str):
    path = BUILT / name
    if not path.is_file():
        raise AssertionError(f"{path} is missing: run `python tools/content/build.py` first (CI: 'Build content')")
    return json.loads(path.read_text(encoding="utf-8"))


class TheTable(unittest.TestCase):
    def test_no_named_style_maps_to_a_demand_and_all_eight_are_on_the_record(self) -> None:
        for concept in NAMED:
            with self.subTest(concept=concept):
                self.assertNotIn(concept, claims.CONCEPT_DEMANDS)
        self.assertEqual(set(claims.NAMED_FIGURES_AWAITING_A_SOURCED_CHECK), set(NAMED))
        self.assertEqual(len(claims.NAMED_FIGURES_AWAITING_A_SOURCED_CHECK), len(NAMED))

    def test_no_concept_is_reached_through_the_two_broad_demands(self) -> None:
        reached = {d for d in claims.CONCEPT_DEMANDS.values()}
        self.assertNotIn("texture.left-hand-pattern", reached)
        self.assertNotIn("texture.walking-bass", reached)


class TheReport(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.catalog = built("catalog.json")
        cls.curriculum = built("curriculum.json")
        cls.report = claims.rung_claims(cls.catalog, cls.curriculum)
        cls.by_id = {item["id"]: item for item in cls.catalog}

    def test_no_rung_claim_has_a_named_style_as_its_source(self) -> None:
        sources = {f"concept {c}" for c in NAMED}
        for rung in self.report["rungs"]:
            for claim in rung["claims"]:
                with self.subTest(rung=rung["rung"], claim=claim["id"]):
                    self.assertNotIn(claim["from"], sources)
        for option in self.report["options"]:
            for claim in option["claims"]:
                self.assertNotIn(claim["from"], sources, f"{option['item']} on {option['rung']}")

    def test_no_item_establishes_a_named_style(self) -> None:
        sources = {f"concept {c}" for c in NAMED}
        established = [(o["item"], o["rung"], c["from"]) for o in self.report["options"] for c in o["claims"]
                       if c["from"] in sources and c["status"] == "established"]
        self.assertEqual(established, [])

    def test_the_two_hand_families_establish_none_of_them(self) -> None:
        seen = 0
        for option in self.report["options"]:
            item = self.by_id.get(option["item"]) or {}
            family = (((item.get("drill") or {}).get("generator")) or {}).get("family")
            if family not in TWO_HAND_FAMILIES:
                continue
            seen += 1
            for claim in option["claims"]:
                with self.subTest(item=option["item"], rung=option["rung"], claim=claim["id"]):
                    self.assertFalse(claim["from"].removeprefix("concept ") in NAMED and claim["status"] == "established")
        self.assertGreater(seen, 0, "no scale/arpeggio/hanon/inversion/five-finger option on the built curriculum to read")

    def test_each_named_style_a_rung_names_is_a_claim_no_detector_measures(self) -> None:
        named_on_rungs = {c for _s, _u, lesson in claims.lessons_in_order(self.curriculum) for c in lesson.get("concepts", [])
                          if c in NAMED}
        self.assertTrue(named_on_rungs, "no rung names a named style: the check would prove nothing")
        reached = {c for rung in self.report["rungs"] for c in rung["unmeasurable"]}
        self.assertTrue(named_on_rungs <= reached, f"named and not listed as unmeasured: {named_on_rungs - reached}")


class TheGateInput(unittest.TestCase):
    def test_the_hand_set_taught_at_is_untouched(self) -> None:
        demands = {d["id"]: d for d in json.loads((VOCABULARY / "demands.json").read_text(encoding="utf-8"))["demands"]}
        self.assertEqual(demands["texture.left-hand-pattern"]["taughtAt"], ["3.6"])
        self.assertEqual(demands["texture.walking-bass"]["taughtAt"], ["jazz.6", "blues.6", "jam.6"])

    def test_the_rung_check_answers_as_it_did_before_for_every_listed_item(self) -> None:
        """`claims.untaught_on` against the record made from `claims.py` at 738e23e, for every (rung, item)."""
        record = json.loads((FIXTURES / "cq1_untaught_before.json").read_text(encoding="utf-8"))["pairs"]
        catalog, curriculum = built("catalog.json"), built("curriculum.json")
        by_id = {item["id"]: item for item in catalog}
        _skills, demands = claims.load_vocabulary()
        ancestry = claims.rung_ancestry(curriculum)
        now: dict[str, list[str]] = {}
        for _s, _u, lesson in claims.lessons_in_order(curriculum):
            for item_id in dict.fromkeys(lesson.get("exerciseOptions", []) + lesson.get("songOptions", [])):
                if item_id in by_id:
                    now[f"{lesson['id']}|{item_id}"] = claims.untaught_on(by_id[item_id], lesson["id"], ancestry, demands, curriculum)
        self.assertGreater(len(record), 500)
        self.assertEqual(now, record)


if __name__ == "__main__":
    unittest.main()
