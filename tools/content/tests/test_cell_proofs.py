"""
The two proofs that establish a curated-only cell (CD1, the brief's §3a; `docs/review/responses/33497357.md` §2).
They replace the density tests the brief had (T9's density statuses, T11, M5, M6): neither cell has a general
density rule.

- **No general rule.** `opportunity-density.json` names each vocabulary demand by a rule or under `curatedOnly`,
  never both. The habanera and the tresillo are the curated-only ones, and no located count establishes them.
- **The contract proof** (`build.established_by_contract`, gated by `build._witness_agrees`). The tresillo family's
  contract names the exact cell, three located places in every bar. A contract establishes a cell only where the
  independent witness (`cells.py`) agrees with the app's located places bar for bar. Shown on hand-written fixtures
  with the bridge's position shape: agreement passes, and one doctored bar goes red.
- **The verified passage fact** (a `demand` row of the verified facts store, `verified_facts.py`, checked by
  `passages.py`). A fact counts only when it is current: the same file identity,
  bars, hand, staff, demand and definition version as its verification, with the app and the witness agreeing on
  every bar. Each change goes stale. `claims.status_of` counts a current fact for its exact item, rung and demand
  and nothing else. The bridge-backed case shows a passage where the app and the witness disagree (a cross-staff
  bar) is not verified.

No catalogue truth is read: everything here is a hand-written fixture, a constructed row or the bridge on those
fixtures. The real facts are verified after the hand rule (HD2) lands. Nothing is heard.
"""
from __future__ import annotations

import copy
import hashlib
import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import build  # noqa: E402
import cells  # noqa: E402
import claims  # noqa: E402
import family_contracts as FC  # noqa: E402
import passages  # noqa: E402
import verified_facts  # noqa: E402

REPO = Path(__file__).resolve().parents[3]
FIXTURES = Path(__file__).resolve().parent / "fixtures" / "cells"
PRESENT = FIXTURES / "present.musicxml"
DENSITY = json.loads((REPO / "content" / "sources" / "opportunity-density.json").read_text(encoding="utf-8"))
CELLS = ["rhythm.habanera", "rhythm.tresillo"]


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def positions_of(path: Path, staff: int = 2) -> dict:
    """The bridge's `positions` shape for the cells, written from the witness itself: what an agreeing app locates."""
    out: dict = {}
    for bar in cells.bar_cells(path, staff):
        if bar["cell"] is None:
            continue
        counts = [0, 0]
        counts[0 if staff == 1 else 1] = cells.PLACES[bar["cell"]]
        out.setdefault(cells.DEMAND[bar["cell"]], {})[str(bar["index"])] = counts
    return out


class NoGeneralRule(unittest.TestCase):
    def test_each_demand_is_ruled_or_curated_only_never_both_and_the_cells_are_curated_only(self) -> None:
        _skills, demands = claims.load_vocabulary()
        ruled, curated = set(DENSITY["demands"]), set(DENSITY["curatedOnly"])
        self.assertEqual(ruled | curated, set(demands))
        self.assertEqual(ruled & curated, set())
        self.assertEqual(sorted(curated), CELLS)
        for demand in CELLS:
            self.assertNotIn("hypothesis", DENSITY["curatedOnly"][demand])
            self.assertNotIn("min", DENSITY["curatedOnly"][demand])

    def test_no_located_count_establishes_a_cell(self) -> None:
        order = list(claims.load_vocabulary()[1])
        located = {"rhythm.habanera": 10_000, "rhythm.tresillo": 10_000}
        self.assertEqual(build.established_by_density(located, 10, DENSITY, order), [])
        self.assertEqual(build.established_by_window(located, 10, DENSITY, order), [])


class TheContractProof(unittest.TestCase):
    def test_the_tresillo_family_names_the_exact_cell_in_every_bar_and_no_other_family_names_a_cell(self) -> None:
        rules = [r for r in FC.contract("tresillo")["requires"] if r["demand"] == "rhythm.tresillo"]
        self.assertEqual([r["minPer"] for r in rules], [["bar", 3]])
        for family in FC.contracts():
            if family == "tresillo":
                continue
            named = [r["demand"] for key in ("requires", "forbids") for r in FC.contract(family).get(key) or []]
            self.assertFalse(set(named) & set(CELLS), family)

    def test_the_contract_establishes_the_cell_only_where_the_witness_agrees(self) -> None:
        entry = {"id": "fixture.present", "notation": {"staves": 2}}
        agreeing = {"positions": positions_of(PRESENT)}
        self.assertEqual(agreeing["positions"]["rhythm.tresillo"], {"4": [0, 3], "5": [0, 3]})
        self.assertTrue(build._witness_agrees(entry, PRESENT, agreeing, "rhythm.tresillo"))
        # Red when they disagree: the app missing one bar the witness reads, or locating one the witness does not.
        missing = copy.deepcopy(agreeing)
        del missing["positions"]["rhythm.tresillo"]["5"]
        self.assertFalse(build._witness_agrees(entry, PRESENT, missing, "rhythm.tresillo"))
        extra = copy.deepcopy(agreeing)
        extra["positions"]["rhythm.tresillo"]["1"] = [0, 3]
        self.assertFalse(build._witness_agrees(entry, PRESENT, extra, "rhythm.tresillo"))
        upper = copy.deepcopy(agreeing)
        upper["positions"]["rhythm.tresillo"]["4"] = [1, 3]
        self.assertFalse(build._witness_agrees(entry, PRESENT, upper, "rhythm.tresillo"))
        # A file the witness refuses is never agreement.
        self.assertFalse(build._witness_agrees(entry, FIXTURES / "two-parts.musicxml", agreeing, "rhythm.tresillo"))


def demand_row(item: str, bars: list[int], staff: int, demand: str, rungs: list[str], hand: str = "L") -> dict:
    """An unproved `demand` row of the verified facts store, in the shared row shape."""
    return {"item": item, "identity": None, "bars": bars, "staff": staff, "voice": None, "kind": "demand",
            "fact": {"demand": demand, "hand": hand}, "rungs": rungs,
            "proof": {"method": None, "date": None, "evidence": "a fixture"}}


class TheVerifiedPassageFact(unittest.TestCase):
    def setUp(self) -> None:
        self.version = "v-test"
        self.item = {"id": "song.fixture", "provenance": {"identity": {"kind": "file", "sha256": sha(PRESENT)}}}
        row = demand_row("song.fixture", [2, 3], 2, "rhythm.habanera", ["rung.a"])
        verified = passages.verification_of(row, self.item, PRESENT, positions_of(PRESENT), self.version)
        self.row = passages.proved(row, self.item, verified, "2026-10-06")

    def test_the_row_is_the_shared_record_type_and_stale_is_never_authored(self) -> None:
        self.assertEqual(verified_facts.shape_errors(self.row), [])
        self.assertTrue(verified_facts.shape_errors({**self.row, "stale": False}))
        self.assertTrue(verified_facts.shape_errors({**self.row, "id": "x"}))
        self.assertTrue(verified_facts.shape_errors({**self.row, "kind": "hand"}), "a hand row's fact and rungs differ")
        self.assertEqual(self.row["identity"], {"kind": "file", "sha256": sha(PRESENT)})
        self.assertEqual(self.row["proof"]["evidence"], "a fixture")

    def test_an_agreeing_proof_is_current_and_names_every_bar(self) -> None:
        self.assertEqual(self.row["proof"]["verified"]["numbers"], [2, 3])
        self.assertEqual(self.row["proof"]["verified"]["app"], self.row["proof"]["verified"]["witness"])
        self.assertEqual(passages.stale_reasons(self.row, self.item, self.version), [])

    def test_it_goes_stale_when_the_file_bars_hand_staff_demand_or_definitions_change(self) -> None:
        changes = {
            "file": (lambda r, i: i["provenance"]["identity"].update(sha256="0" * 64), "file identity"),
            "bars": (lambda r, i: r.update(bars=[2, 4]), "bars"),
            "hand": (lambda r, i: r["fact"].update(hand="R"), "hand"),
            "staff": (lambda r, i: r.update(staff=1), "staff"),
            "demand": (lambda r, i: r["fact"].update(demand="rhythm.tresillo"), "demand"),
        }
        for name, (change, word) in changes.items():
            with self.subTest(change=name):
                row, item = copy.deepcopy(self.row), copy.deepcopy(self.item)
                change(row, item)
                reasons = passages.stale_reasons(row, item, self.version)
                self.assertTrue(any(word in reason for reason in reasons), reasons)
        self.assertTrue(passages.stale_reasons(self.row, self.item, "v-other"))
        unproved = demand_row("song.fixture", [2, 3], 2, "rhythm.habanera", ["rung.a"])
        self.assertEqual(passages.stale_reasons(unproved, self.item, self.version), ["never proved"])

    def test_a_hand_row_is_the_hand_kind_s_and_never_a_demand_proof(self) -> None:
        # HD2's rules (verified_hand.check_hand_fact) validate it; it is current exactly while its file is; and the
        # claim path's reader never returns it: no read across kinds.
        hand = {**copy.deepcopy(self.row), "kind": "hand", "fact": "R", "voice": 2, "rungs": None,
                "proof": {"method": "notation", "date": "2026-10-06", "evidence": "a fixture"}}
        self.assertEqual(verified_facts.shape_errors(hand), [])
        self.assertEqual(verified_facts.stale_reasons(hand, self.item), [])
        moved = copy.deepcopy(self.item)
        moved["provenance"]["identity"]["sha256"] = "0" * 64
        self.assertEqual(verified_facts.stale_reasons(hand, moved), ["the file identity changed since it was proved"])
        self.assertEqual(len(verified_facts.current([self.item], "hand", [hand, self.row])), 1)
        self.assertEqual(passages.demand_rows([hand]), [])
        self.assertEqual(passages.current_facts([self.item], self.version, [hand]), {})

    def test_two_current_hand_rows_that_disagree_are_refused_and_agreeing_duplicates_tolerated(self) -> None:
        import verified_hand

        sha_now = sha(PRESENT)
        base = {"item": "song.fixture", "identity": {"kind": "file", "sha256": sha_now}, "bars": [2, 4], "staff": 1,
                "voice": 2, "kind": "hand", "fact": "R", "rungs": None,
                "proof": {"method": "notation", "date": "2026-10-06", "evidence": "a fixture"}}
        other = {**copy.deepcopy(base), "bars": [4, 5], "fact": "L"}
        conflicts = verified_facts.hand_conflicts([base, other], {"song.fixture": sha_now})
        self.assertEqual(len(conflicts), 1)
        self.assertIn("rows 0 and 1", conflicts[0])
        self.assertIn("bars 4-4", conflicts[0])
        # Never resolved by file order: the bridge's reader refuses either order.
        for rows in ([base, other], [other, base]):
            with self.assertRaises(verified_hand.VerifiedFactsError):
                verified_hand.verified_hands("song.fixture", sha_now, rows)
        # Not a conflict: another voice, another staff, bars that do not meet, a stale row, or two rows that agree.
        for second in ({**other, "voice": 1}, {**other, "staff": 2}, {**other, "bars": [5, 6]},
                       {**other, "identity": {"kind": "file", "sha256": "0" * 64}}, {**copy.deepcopy(base), "bars": [3, 6]}):
            with self.subTest(second=second["bars"]):
                self.assertEqual(verified_facts.hand_conflicts([base, second], {"song.fixture": sha_now}), [])
        self.assertEqual(len(verified_hand.verified_hands("song.fixture", sha_now, [base, {**copy.deepcopy(base), "bars": [3, 6]}])), 2)
        # The committed store holds none.
        self.assertEqual(verified_facts.hand_conflicts(verified_facts.load()), [])

    def test_a_fact_goes_stale_when_its_file_s_verified_hands_change(self) -> None:
        # The Crave's proof measured the model with bar 40's verified hand row (HD2): a proof that recorded other hands
        # is stale, since the hands are part of the model it measured. Read on the built catalogue.
        built_rows = {row["id"]: row for row in json.loads((REPO / "app" / "public" / "content" / "catalog.json").read_text(encoding="utf-8"))}
        crave = next(r for r in passages.demand_rows() if r["item"] == "song.jazz.the-crave")
        item = built_rows["song.jazz.the-crave"]
        self.assertEqual(passages.stale_reasons(crave, item), [])
        self.assertEqual([h["bars"] for h in crave["proof"]["verified"]["hands"]], [[40, 40]])
        other = copy.deepcopy(crave)
        other["proof"]["verified"]["hands"] = []
        self.assertIn("the file's verified hands changed since it was proved", passages.stale_reasons(other, item))

    def test_the_committed_store_keeps_hd2_s_hand_rows_and_proves_the_four_passages(self) -> None:
        import verified_hand

        rows = verified_facts.load()
        hands = verified_hand.read_hand_facts()
        self.assertEqual(len(hands), 5, "HD2's five hand rows")
        self.assertEqual([r for r in rows if r["kind"] == "hand"], hands)
        self.assertEqual(verified_hand.read_hand_facts(), [r for r in rows if r["kind"] == "hand"],
                         "the hand reader reads no demand row")

    def test_the_definition_version_moves_with_the_detector_the_hand_rule_or_the_witness(self) -> None:
        with tempfile.TemporaryDirectory(dir=REPO / "build") if (REPO / "build").exists() else tempfile.TemporaryDirectory() as scratch:
            root = Path(scratch)
            for rel in passages.DEFINITION_FILES:
                (root / rel).parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(REPO / rel, root / rel)
            base = passages.definition_version(root)
            self.assertEqual(base, passages.definition_version(REPO))
            for rel in ("app/src/demands/detect.ts", "app/src/score/extractScoreModel.ts", "tools/content/cells.py"):
                with self.subTest(file=rel):
                    original = (root / rel).read_bytes()
                    (root / rel).write_bytes(original + b"\n// changed\n")
                    self.assertNotEqual(passages.definition_version(root), base)
                    (root / rel).write_bytes(original)

    def test_a_passage_the_two_readers_disagree_on_is_not_proved(self) -> None:
        doctored = positions_of(PRESENT)
        del doctored["rhythm.habanera"]["3"]
        verified = passages.verification_of(self.row, self.item, PRESENT, doctored, self.version)
        self.assertEqual(verified["disagree"], [3])
        row = passages.proved(self.row, self.item, verified, "2026-10-06")
        self.assertTrue(any("did not agree" in r or "every bar" in r for r in passages.stale_reasons(row, self.item, self.version)))

    def test_status_of_counts_a_current_fact_for_its_exact_item_rung_and_demand_only(self) -> None:
        skills, _demands = claims.load_vocabulary()
        item = {**self.item, "demands": ["rhythm.habanera"],
                "measurement": {"status": "measured", "established": [], "located": {"rhythm.habanera": 8}}}
        facts = passages.current_facts([item], self.version, [self.row])
        claim = {"kind": "demand", "id": "rhythm.habanera"}
        self.assertEqual(claims.status_of(claim, item, skills, "rung.a", facts), "established")
        self.assertEqual(claims.status_of(claim, item, skills, "rung.b", facts), "incidental", "another rung")
        self.assertEqual(claims.status_of(claim, item, skills), "incidental", "no rung or facts given")
        self.assertEqual(claims.status_of({"kind": "demand", "id": "rhythm.tresillo"}, item, skills, "rung.a", facts), "absent")
        other = {**item, "id": "song.other"}
        self.assertEqual(claims.status_of(claim, other, skills, "rung.a", facts), "incidental", "another item")
        stale = passages.current_facts([item], "v-other", [self.row])
        self.assertEqual(claims.status_of(claim, item, skills, "rung.a", stale), "incidental", "a stale fact counts for nothing")

    def test_the_committed_store_holds_the_four_bizet_path_passages_in_the_shared_shape(self) -> None:
        rows = passages.demand_rows()
        self.assertEqual({verified_facts.name_of(r) for r in rows}, {
            "song.jazz.the-crave@bars=21-26 rhythm.tresillo",
            "song.folk.por-una-cabeza-carlos-gardel.pdmx@bars=1-14 rhythm.habanera",
            "song.classical.bizet-l-amour-est-un-oiseau-rebelle.pdmx@bars=1-12 rhythm.habanera",
            "excerpt.classical.bizet-l-amour-est-un-oiseau-rebelle.pdmx.b1-12.lh@bars=1-12 rhythm.habanera",
        })
        for row in rows:
            self.assertEqual(verified_facts.shape_errors(row), [], verified_facts.name_of(row))
            self.assertIn(row["fact"]["demand"], CELLS)
        crave = next(r for r in rows if r["item"] == "song.jazz.the-crave")
        self.assertEqual(crave["rungs"], ["latin.6"])
        cut = next(r for r in rows if r["item"].startswith("excerpt."))
        self.assertEqual((cut["staff"], cut["fact"]["hand"]), (1, "L"))


class TheBridgeOnTheFixtures(unittest.TestCase):
    """The app's own positions (the bridge) on the hand-written fixtures: agreement proves, a cross-staff bar does not."""

    @classmethod
    def setUpClass(cls) -> None:
        import demands

        cls.paths = {name: FIXTURES / f"{name}.musicxml" for name in ("present", "boundary")}
        answered = demands.measure_opportunities(list(cls.paths.values()))
        cls.rows = {name: answered[str(path)] for name, path in cls.paths.items()}

    def verification(self, name: str, bars: list[int], demand: str) -> dict:
        path = self.paths[name]
        item = {"id": f"fixture.{name}", "provenance": {"identity": {"kind": "file", "sha256": sha(path)}}}
        return passages.verification_of(demand_row(item["id"], bars, 2, demand, []), item, path, self.rows[name]["positions"], "v")

    def test_the_app_and_the_witness_agree_on_the_present_fixture(self) -> None:
        verification = self.verification("present", [1, 3], "rhythm.habanera")
        self.assertEqual((verification["disagree"], verification["numbers"]), ([], [1, 2, 3]))

    def test_a_cross_staff_bar_is_not_proved(self) -> None:
        # Boundary bar 5: a left-hand note drawn on the upper staff. The app reads it by the hand, the witness by the
        # staff, so a passage over it is never a proved fact.
        verification = self.verification("boundary", [2, 5], "rhythm.habanera")
        self.assertEqual(verification["disagree"], [5])
        self.assertNotIn(5, verification["numbers"])


if __name__ == "__main__":
    unittest.main()
