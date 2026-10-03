"""G30's edit of tools/content/tests/test_family_contracts.py: the continuity cases revised, two G30 classes added.

usage: python docs/prompts/runs/G30/scripts-edit_tests.py
Idempotent: each splice checks its own replacement first.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
p = ROOT / "tools" / "content" / "tests" / "test_family_contracts.py"
raw = p.read_bytes()
crlf = b"\r\n" in raw
s = raw.decode("utf-8").replace("\r\n", "\n")


def sub(old: str, new: str) -> None:
    global s
    if new in s:
        return
    assert s.count(old) == 1, old[:80]
    s = s.replace(old, new)


sub('''  ties (G51); and a family-wide version bump carries each unchanged item's old identity, proven
  per item by its music digest, and no changed item's (the generated-identity continuity relation).
"""''',
'''  ties (G51); and a family-wide version bump carries each unchanged item's old identity, proven
  per item by its music digest, and no changed item's (the generated-identity continuity relation);
- **G30**: a row prints fingering only with a named source (the one held row named, with why); the
  print step, not the maker's tables, withholds an unsourced convention; and the bump that withdrew it
  carries every item of the 42 families, a second bump of a CL15 family carrying CL15's identities too.
"""''')

sub('''from collections import defaultdict
from pathlib import Path
''', '''from collections import defaultdict
from pathlib import Path
from unittest import mock
''')

sub('''                for item_id, one in record["items"].items():
                    self.assertEqual((one["identity"]["kind"], one["identity"]["family"], one["identity"]["version"]),
                                     ("generator", family, record["from"]), item_id)
                    self.assertRegex(one["digest"], r"^[0-9a-f]{64}$")
''', '''                for item_id, one in record["items"].items():
                    self.assertEqual((one["identity"]["kind"], one["identity"]["family"], one["identity"]["version"]),
                                     ("generator", family, record["from"]), item_id)
                    self.assertRegex(one["digest"], r"^[0-9a-f]{64}$")
                    # G30: the former identities the catalogue listed for the item at the version left, each the
                    # item's own identity at an earlier version (a second bump of a CL15 family carries CL15's).
                    for earlier in one.get("formerGeneratorIdentities", []):
                        self.assertEqual({**earlier, "version": record["from"]}, one["identity"], item_id)
                        self.assertLess(earlier["version"], record["from"], item_id)
''')

sub('''                one = record["items"][entry["id"]]
                if one["digest"] == FC.music_digest(sc, entry):
                    self.assertEqual(formers, [one["identity"]])
''', '''                one = record["items"][entry["id"]]
                if one["digest"] == FC.music_digest(sc, entry):
                    self.assertEqual(formers, [one["identity"], *one.get("formerGeneratorIdentities", [])])
''')

sub('''    def test_the_siblings_the_ruling_names(self) -> None:
        carried = {entry["id"] for sc, entry in planned.plan() if FC.former_generator_identities(sc, entry)}
        octaves = {entry["id"] for _sc, entry in planned.by_family()["tremolo_octaves"] if entry["drill"]["params"]["shape"] == "octave"}
        thirds = {entry["id"] for _sc, entry in planned.by_family()["tremolo_octaves"] if entry["drill"]["params"]["shape"] == "third"}
        blues = {entry["id"] for _sc, entry in planned.by_family()["pentatonic"] if entry["drill"]["params"]["form"] == "blues"}
        pentatonic = {entry["id"] for _sc, entry in planned.by_family()["pentatonic"] if entry["drill"]["params"]["form"] == "pentatonic"}
        self.assertEqual([len(octaves), len(thirds), len(blues), len(pentatonic)], [6, 6, 3, 3])
        self.assertLessEqual(octaves | blues | {"exercise.syncopation.sixteenth"}, carried)
        self.assertEqual((thirds | pentatonic | {"exercise.syncopation.tied-across-bar"}) & carried, set())
''', '''    def test_the_siblings_the_ruling_names(self) -> None:
        """
        Revised by G30 (the old assumption: the siblings CL15 changed carry nothing, which held while CL15's
        bump was the family's last). G30 moved tremolo_octaves and pentatonic again, a fingering-only bump
        that changed no item's music, so every item now carries its v2 identity; the CL15 ruling's line is
        the v1 identity, which only the siblings CL15 left unchanged carry. syncopation G30 did not touch.
        """
        versions = {entry["id"]: {one["version"] for one in FC.former_generator_identities(sc, entry)}
                    for sc, entry in planned.plan()}
        octaves = {entry["id"] for _sc, entry in planned.by_family()["tremolo_octaves"] if entry["drill"]["params"]["shape"] == "octave"}
        thirds = {entry["id"] for _sc, entry in planned.by_family()["tremolo_octaves"] if entry["drill"]["params"]["shape"] == "third"}
        blues = {entry["id"] for _sc, entry in planned.by_family()["pentatonic"] if entry["drill"]["params"]["form"] == "blues"}
        pentatonic = {entry["id"] for _sc, entry in planned.by_family()["pentatonic"] if entry["drill"]["params"]["form"] == "pentatonic"}
        self.assertEqual([len(octaves), len(thirds), len(blues), len(pentatonic)], [6, 6, 3, 3])
        for item_id in octaves | blues:
            self.assertEqual(versions[item_id], {1, 2}, item_id)
        for item_id in thirds | pentatonic:
            self.assertEqual(versions[item_id], {2}, f"{item_id}: CL15 changed its notes, so its v1 identity is never carried")
        self.assertEqual(versions["exercise.syncopation.sixteenth"], {1})
        self.assertEqual(versions["exercise.syncopation.tied-across-bar"], set())
''')

sub('''        sc, entry = planned_item("exercise.tremolo.c.right")
        table = copy.deepcopy(FC.continuity_table())
        self.assertEqual(len(FC.former_generator_identities(sc, entry, table)), 1)
        table["families"]["tremolo_octaves"]["items"][entry["id"]]["digest"] = "0" * 64
''', '''        sc, entry = planned_item("exercise.tremolo.c.right")
        table = copy.deepcopy(FC.continuity_table())
        # Revised by G30 (the old assumption: one identity per item): v2, G30's, and v1, CL15's, carried with it.
        self.assertEqual([one["version"] for one in FC.former_generator_identities(sc, entry, table)], [2, 1])
        table["families"]["tremolo_octaves"]["items"][entry["id"]]["digest"] = "0" * 64
''')

NEW = '''

# --------------------------------------------------------------------------------------
# G30
# --------------------------------------------------------------------------------------

#: The rows G30 moved to "none" say so in their fingering note (`docs/prompts/runs/G30/`, Entry 211).
G30_MARK = "(G30; the ruling,"
#: Rows that still print a convention no source gives, each with why. Held, not decided: removing the
#: change of finger fails the physical gate on the four-to-a-note items (Entry 211's open question).
HELD_UNSOURCED = {"repeated_notes": "the printed change of finger is what passes the repeated-note check at 0.25 s"}


def g30_families() -> list[str]:
    return sorted(f for f, row in FC.contracts().items() if G30_MARK in (row["physical"]["fingering"].get("note") or ""))


class TestFingeringOnlyWhereSourced(unittest.TestCase):
    """
    G30 (`responses/questions-53670d2a.md` §3, held again in `questions-90b19bee.md` §1): print no
    fingering until it has a source. A finger number over a note is read as the fingering, so a row that
    prints one names the source it comes from; the generator's own convention is withheld from the page.
    """

    def test_a_row_prints_fingering_only_with_a_named_source(self) -> None:
        unsourced = sorted(f for f, row in FC.contracts().items()
                           if row["physical"]["fingering"]["printed"] in ("printed", "where-sourced")
                           and not row["physical"]["fingering"].get("source"))
        self.assertEqual(unsourced, sorted(HELD_UNSOURCED), "a row prints a fingering no source gives")

    def test_the_rows_g30_moved_print_none_and_name_none(self) -> None:
        families = g30_families()
        self.assertEqual(len(families), 42)
        for family in families:
            fingering = FC.contract(family)["physical"]["fingering"]
            with self.subTest(family=family):
                self.assertEqual(fingering["printed"], "none")
                self.assertFalse(fingering.get("source"))
                self.assertNotIn("printed as advice", fingering["note"])

    def test_the_print_step_not_the_maker_withholds_the_convention(self) -> None:
        """
        The maker still works its convention out; `print_as_contracted` takes it off because the row says
        none. With the row read as printing, the same maker's score carries it: so it is the step, keyed
        on the row, that withholds it, and a source added to the row prints it again with no maker edit.
        """
        sc, entry = G.make_five_finger("C", "major", "right")
        self.assertEqual(sum(h["fingered"] for h in FC.physical_facts(sc)["hands"].values()), 0)
        row = copy.deepcopy(FC.contract("five_finger"))
        row["physical"]["fingering"]["printed"] = "printed"
        with mock.patch.object(G.family_contracts, "contract", lambda family: row):
            fingered, _entry = G.make_five_finger("C", "major", "right")
        self.assertGreater(sum(h["fingered"] for h in FC.physical_facts(fingered)["hands"].values()), 0)
        self.assertEqual(FC.music_digest(sc, entry), FC.music_digest(fingered, entry), "the notes are the same notes")

    def test_a_maker_that_skips_the_step_stops_the_build(self) -> None:
        """The physical gate holds the written score to the row: a fingered item of a row that says none fails."""
        row = copy.deepcopy(FC.contract("five_finger"))
        row["physical"]["fingering"]["printed"] = "printed"
        with mock.patch.object(G.family_contracts, "contract", lambda family: row):
            fingered, entry = G.make_five_finger("C", "major", "right")
        faults = FC.physical_faults(FC.contract("five_finger"), FC.recipe_of(entry), fingered, entry)
        self.assertTrue(any(f.startswith("fingering: RH prints ") and f.endswith("the row says none") for f in faults), faults)
        with self.assertRaises(G.PhysicallyIndefensible):
            G.confirm_physical(fingered, entry)

    def test_the_held_row_still_prints_and_says_why(self) -> None:
        for family in HELD_UNSOURCED:
            fingering = FC.contract(family)["physical"]["fingering"]
            self.assertEqual(fingering["printed"], "printed", f"{family} moved: take it out of HELD_UNSOURCED")
            self.assertIn("Held at printed by G30", fingering["note"])


class TestTheWithdrawalKeepsLearnerContinuity(unittest.TestCase):
    """
    G30 (`responses/questions-90b19bee.md` §1): withdrawing an unsupported annotation makes a changed
    artifact, so the family's version moves, and the learner's history is not reset, because no item's
    music changed: each item carries its pre-G30 identity through CL15's relation, proven by its digest.
    A family CL15 had already bumped carries the identities CL15 carried as well, back to the version
    before CL15, so a run stored against that oldest identity still names the row's material.
    """

    def test_every_item_of_the_42_families_carries_its_identity_from_before(self) -> None:
        table = FC.continuity_table()["families"]
        families = g30_families()
        self.assertEqual(len(families), 42, "the rows G30 moved")
        for family in families:
            version = FC.contract(family)["version"]
            self.assertEqual((table[family]["from"], table[family]["to"]), (version - 1, version), family)
            for sc, entry in planned.by_family()[family]:
                current = review.generator_identity(entry)
                formers = FC.former_generator_identities(sc, entry)
                with self.subTest(item=entry["id"]):
                    self.assertEqual(formers[:1], [{**current, "version": current["version"] - 1}],
                                     "the music did not change, so the item keeps the identity it had")

    def test_a_second_bump_carries_the_first_bump_s_identities(self) -> None:
        table = FC.continuity_table()["families"]
        multi = {item_id: one for record in table.values() for item_id, one in record["items"].items()
                 if one.get("formerGeneratorIdentities")}
        self.assertEqual(sorted({family for family, record in table.items()
                                 if any(one.get("formerGeneratorIdentities") for one in record["items"].values())}),
                         ["interval_reading", "pentatonic", "tremolo_octaves"])
        self.assertEqual(len(multi), 11)
        for item_id in multi:
            sc, entry = planned_item(item_id)
            formers = FC.former_generator_identities(sc, entry)
            current = review.generator_identity(entry)
            with self.subTest(item=item_id):
                self.assertEqual([f["version"] for f in formers], [current["version"] - 1, current["version"] - 2])
                self.assertIn({**current, "version": current["version"] - 2}, formers,
                              "the identity before CL15 is still carried")

    def test_the_naive_capture_would_drop_the_identity_before_cl15(self) -> None:
        """
        CL15's capture recorded the version left and nothing the item carried; written that way for a second
        bump, the table forgets the first, and `material.learnFormerIdentities` builds its map from the loaded
        catalogue alone, so a run stored against the identity before CL15 would stop resolving.
        """
        sc, entry = planned_item("exercise.tremolo.c.right")
        naive = copy.deepcopy(FC.continuity_table())
        naive["families"]["tremolo_octaves"]["items"][entry["id"]].pop("formerGeneratorIdentities")
        self.assertEqual([one["version"] for one in FC.former_generator_identities(sc, entry, naive)], [2])
        self.assertEqual([one["version"] for one in FC.former_generator_identities(sc, entry)], [2, 1])
'''

anchor = '''

if __name__ == "__main__":
    unittest.main()
'''
if "class TestFingeringOnlyWhereSourced" not in s:
    assert s.count(anchor) == 1
    s = s.replace(anchor, NEW + anchor)

sub('        table = FC.continuity_table()["families"]\n        for family in g30_families():\n            version = FC.contract(family)["version"]\n', '        table = FC.continuity_table()["families"]\n        families = g30_families()\n        self.assertEqual(len(families), 42, "the rows G30 moved")\n        for family in families:\n            version = FC.contract(family)["version"]\n')

out = (s.replace("\n", "\r\n") if crlf else s).encode("utf-8")
if out != raw:
    p.write_bytes(out)
print("ok")
