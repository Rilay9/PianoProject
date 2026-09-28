"""
Canonical, variable and transfer are data, and transfer is never inferred from a new seed (D0 item 5;
G25, Part 15 §7, Part 26).

Every item's `role` comes from its family's row, relative to its primary target skill. A family
states which roles it can honestly provide; transfer changes surface and context enough to
establish generalisation, so a new seed of the same family — the same constraints, another
realisation — is never transfer, and a family that cannot establish transfer says so and leaves
it to another family, an unseen phrase or repertoire. Where a row does declare transfer, it names
the family whose skill it transfers and the dimensions its surface differs on, and every one of
those dimensions is measured here, item against item. What cannot be measured is listed as such
and claims nothing. `role: transfer` stays intent and provenance, never proof (Part 26): first
contact and the evidence decide, which is the ladder's, not this file's.
"""
from __future__ import annotations

import copy
import sys
import unittest
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import family_contracts as FC  # noqa: E402
from tests import planned  # noqa: E402


def transfer_rules(row: dict) -> list[dict]:
    """
    A row's transfer declarations, each `{when?, skill, from, differs, notMeasured}`. One object for a
    family whose every item is the transfer (the pentatonic); a list, each with its `when`, for a
    family that transfers several skills recipe by recipe (the study, D3).
    """
    of = row["roles"].get("transferOf")
    if not of:
        return []
    return of if isinstance(of, list) else [of]


def transfer_rule_for(row: dict, recipe: dict) -> dict | None:
    return next((rule for rule in transfer_rules(row) if FC.matches(rule.get("when"), recipe)), None)


def register(sc) -> tuple[int, int]:
    """The compass of the staff that carries the tune: the upper staff where it sounds, else the lower."""
    for part in sc.parts:
        pitches = [p.midi for n in part.recurse().notes for p in getattr(n, "pitches", [])]
        if pitches:
            return min(pitches), max(pitches)
    return 0, 0


def surface(entry: dict, measured: dict, dimension: str, sc=None) -> object:
    """One measurable dimension of an item's surface."""
    demands = measured["demands"]
    if dimension == "register":
        if sc is None:
            raise KeyError("register is measured on the score")
        return register(sc)
    if dimension == "family":
        return entry["drill"]["generator"]["family"]
    if dimension == "rhythm":
        return frozenset(d for d in demands if d.startswith(("rhythm.", "metre.")))
    if dimension == "texture":
        return frozenset(d for d in demands if d.startswith("texture."))
    if dimension == "key":
        return entry["drill"]["params"].get("key")
    if dimension == "hands":
        return entry["hands"]
    if dimension == "clef":
        return "clef.bass" in demands
    raise KeyError(f"{dimension} is not a measurable dimension; list it under notMeasured")


def transfer_faults(rows: dict[str, dict], items: list) -> list[str]:
    """Items given `transfer` where their family does not declare transfer from another family,
    and families whose seeds alone differ yet hold a transfer role."""
    faults = []
    for _sc, entry in items:
        family = entry["drill"]["generator"]["family"]
        role = FC.role_of(rows[family], FC.recipe_of(entry))
        if role != "transfer":
            continue
        of = transfer_rule_for(rows[family], FC.recipe_of(entry))
        if not of or family in of.get("from", []):
            faults.append(f"{entry['id']}: transfer with no other family named")
    by_constraints: dict[tuple, list] = defaultdict(list)
    for _sc, entry in items:
        recipe = FC.recipe_of(entry)
        if recipe.get("seed") is None:
            continue
        family = entry["drill"]["generator"]["family"]
        rest = tuple(sorted((k, str(v)) for k, v in recipe.items() if k != "seed"))
        by_constraints[(family, rest)].append(FC.role_of(rows[family], recipe))
    for (family, _rest), roles in by_constraints.items():
        if len(roles) > 1 and "transfer" in roles:
            faults.append(f"{family}: a new seed of the same constraints is marked transfer")
    return faults


class TestRolesAreExplicit(unittest.TestCase):
    def test_every_item_has_a_role_its_family_provides(self) -> None:
        for _sc, entry in planned.plan():
            row = FC.contract(entry["drill"]["generator"]["family"])
            with self.subTest(item=entry["id"]):
                self.assertIn(entry["role"], FC.ROLES)
                self.assertIn(entry["role"], row["roles"]["provides"])

    def test_every_family_says_what_it_does_about_transfer(self) -> None:
        for family, row in FC.contracts().items():
            with self.subTest(family=family):
                self.assertTrue(row["roles"]["transfer"])
                if "transfer" not in row["roles"]["provides"]:
                    self.assertIn("not provided", row["roles"]["transfer"])


class TestANewSeedIsNotTransfer(unittest.TestCase):
    def test_no_item_is_transfer_by_seed_or_by_its_own_family(self) -> None:
        self.assertEqual(transfer_faults(FC.contracts(), planned.plan()), [])
        seeded = [entry for _sc, entry in planned.plan() if entry["drill"]["params"].get("seed") is not None]
        self.assertGreater(len(seeded), 1, "no seeded family in the plan: the check saw nothing")

    def test_the_check_fails_when_a_seed_is_marked_transfer(self) -> None:
        rows = copy.deepcopy(FC.contracts())
        rows["interval_reading"]["roles"]["assign"].insert(0, {"role": "transfer", "when": {"seed": 2}})
        faults = transfer_faults(rows, planned.plan())
        self.assertTrue(any("new seed" in f for f in faults), faults)
        self.assertTrue(any("no other family named" in f for f in faults), faults)


class TestATransferItemDiffersInSurfaceAsItsContractSays(unittest.TestCase):
    def test_every_declared_dimension_differs_from_every_item_of_the_source_family(self) -> None:
        measured = planned.measured()
        by_family = planned.by_family()
        declared = [(f, row) for f, row in FC.contracts().items() if "transfer" in row["roles"]["provides"]]
        self.assertTrue(declared, "no family declares transfer: the check saw nothing")
        checked = 0
        for family, row in declared:
            for of in transfer_rules(row):
                self.assertIn("family", of["differs"])
                # Revised (D3; the old assumption: a family declares one transfer and every item of it
                # is that transfer). The items a declaration covers are its family's transfer items
                # whose recipe matches its `when`; a family with one declaration and no `when` is
                # still every item (the pentatonic).
                covered = [(sc, entry) for sc, entry in by_family[family]
                           if entry["role"] == "transfer" and FC.matches(of.get("when"), FC.recipe_of(entry))]
                with self.subTest(family=family, skill=of["skill"]):
                    self.assertTrue(covered, "a transfer declaration no item of the plan carries")
                for sc, entry in covered:
                    checked += 1
                    for source in of["from"]:
                        self.assertNotEqual(source, family)
                        for ssc, other in by_family[source]:
                            for dimension in of["differs"]:
                                with self.subTest(item=entry["id"], against=other["id"], dimension=dimension):
                                    self.assertNotEqual(surface(entry, measured[entry["id"]], dimension, sc),
                                                        surface(other, measured[other["id"]], dimension, ssc))
                    with self.subTest(item=entry["id"]):
                        # the primary skill is the one transferred, and the source family targets it too
                        self.assertEqual(FC.primary_skill(row, FC.recipe_of(entry)), of["skill"])
                for source in of["from"]:
                    src_row = FC.contract(source)
                    judged = [e for _s, e in by_family[source] if FC.primary_skill(src_row, FC.recipe_of(e)) == of["skill"]]
                    with self.subTest(family=family, source=source):
                        self.assertTrue(judged, f"{source} has no item whose primary skill is {of['skill']}")
        self.assertGreater(checked, 0)

    def test_a_claimed_dimension_the_items_share_would_fail(self) -> None:
        """The adversary: a contract claiming the pentatonic differs from the position shift by hand."""
        measured = planned.measured()
        by_family = planned.by_family()
        entry = by_family["pentatonic"][0][1]
        same_hand = [e for _s, e in by_family["position_shift"] if e["hands"] == entry["hands"]]
        self.assertTrue(same_hand)
        self.assertEqual(surface(entry, measured[entry["id"]], "hands"),
                         surface(same_hand[0], measured[same_hand[0]["id"]], "hands"))
        # and a dimension nothing measures cannot be claimed at all
        with self.assertRaises(KeyError):
            surface(entry, measured[entry["id"]], "the thumb passing under")


if __name__ == "__main__":
    unittest.main()
