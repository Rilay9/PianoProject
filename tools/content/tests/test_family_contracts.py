"""
Every generator family says what it is for, in one table (D0 item 1; G1, G21; Q41's contract cases).

`family_contracts.json` holds one row per maker in `generate_exercises.py`. This file holds the
table to that shape, table-driven over the makers rather than one file per family:

- every maker has exactly one row, and passes its family's name to `catalog_entry`, so every
  item says which row made it;
- every skill a row names is in the vocabulary (`skills.json`), every demand in `demands.json`,
  and an item whose recipe matches no primary rule falls to the row's "not judged by the app"
  with its candidate recorded — never a made-up skill;
- every item carries what its row says: `targetSkills` (only where the primary is judged),
  `role`, and its identity `drill.generator` (family, version, seed; the recipe is
  `drill.params`), and no `genre`;
- identity changes with recipe or version: two items with one identity never differ in their
  music, and a family's music may change only with its version (`fixtures/identity_pins.json`);
- **the census, extended**: a mutation of every promise a row makes — each required
  opportunity, each forbidden demand, the target skill's opportunity, the physical limits, the
  fingering claim, the musical hook — makes its gate fail on that family's own item. The
  census of `test_generator_invariants.py` stays as it is; this is its contract half;
- **CL15**: a canonical role names an item the plan ships, for every family (G54); a title,
  concept or tag never names a skill whose opportunity the app's detectors do not find in the
  item (G51's syncopation naming); the tie drill's density is a count of independent across-bar
  ties (G51); and a family-wide version bump carries each unchanged item's old identity, proven
  per item by its music digest, and no changed item's (the generated-identity continuity relation).
"""
from __future__ import annotations

import ast
import copy
import hashlib
import inspect
import json
import re
import sys
import unittest
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from music21 import harmony, meter  # noqa: E402

import family_contracts as FC  # noqa: E402
import generate_exercises as G  # noqa: E402
import review  # noqa: E402
from tests import planned  # noqa: E402

FIXTURES = Path(__file__).resolve().parent / "fixtures"


def makers() -> dict[str, object]:
    return {name[len("make_"):]: obj for name, obj in inspect.getmembers(G, inspect.isfunction)
            if name.startswith("make_") and obj.__module__ == G.__name__}


#: The music an item is (every strike's onset, length, written pitches and tie, per staff, and the
#: tempo and metre). One definition, `family_contracts.music_digest` since CL15: the continuity
#: relation proves an unchanged item by the same digest this file's identity tests read.
music_digest = FC.music_digest


def identity_key(entry: dict) -> str:
    recipe = FC.recipe_of(entry)
    recipe["tempoBpm"] = entry.get("tempoBpm")
    return json.dumps([entry["drill"]["generator"], recipe], sort_keys=True)


class TestEveryMakerHasExactlyOneContract(unittest.TestCase):
    def test_the_table_and_the_module_name_the_same_families(self) -> None:
        self.assertEqual(sorted(FC.contracts()), sorted(makers()))
        for family, row in FC.contracts().items():
            self.assertEqual(row["maker"], f"make_{family}")

    def test_the_invariant_census_and_the_table_name_the_same_families(self) -> None:
        from tests import test_generator_invariants as inv  # noqa: PLC0415

        self.assertEqual(sorted(inv.FAMILIES), sorted(FC.contracts()))

    def test_each_maker_passes_its_own_family_to_catalog_entry(self) -> None:
        tree = ast.parse(Path(G.__file__).read_text(encoding="utf-8"))
        passed = {}
        for node in tree.body:
            if isinstance(node, ast.FunctionDef) and node.name.startswith("make_"):
                calls = [n for n in ast.walk(node) if isinstance(n, ast.Call) and getattr(n.func, "id", None) == "catalog_entry"]
                self.assertEqual(len(calls), 1, node.name)
                family = [k.value.value for k in calls[0].keywords if k.arg == "family"]
                passed[node.name] = family[0] if family else None
        self.assertEqual({maker: fam for maker, fam in passed.items() if fam != maker[len("make_"):]}, {})


class TestTheContractsNameTheVocabulary(unittest.TestCase):
    def test_every_skill_and_demand_a_row_names_exists(self) -> None:
        skills, demands = FC.vocabulary()
        bad = []
        for family, row in FC.contracts().items():
            for rule in row["target"]["primary"] + row["target"].get("secondary", []):
                if rule["skill"] not in skills:
                    bad.append(f"{family}: skill {rule['skill']}")
            names = [r["demand"] for r in row["requires"] + row["forbids"] + row["overconcentration"]] + row["assumes"]
            bad += [f"{family}: demand {d}" for d in names if d not in demands]
        self.assertEqual(bad, [])

    def test_an_item_no_primary_rule_matches_is_declared_not_judged(self) -> None:
        for _sc, entry in planned.plan():
            family = entry["drill"]["generator"]["family"]
            row = FC.contract(family)
            recipe = FC.recipe_of(entry)
            if FC.primary_skill(row, recipe) is not None:
                continue
            declared = row["target"].get("notJudged")
            with self.subTest(item=entry["id"]):
                self.assertIsNotNone(declared, "no primary skill and no not-judged declaration")
                self.assertTrue(declared["candidate"] and declared["why"])
                self.assertTrue(FC.matches(declared.get("when"), recipe), "the not-judged declaration does not cover it")
                self.assertNotIn("targetSkills", entry)


class TestTheRowsAreWellFormed(unittest.TestCase):
    def test_every_field(self) -> None:
        sources = FC.table()["sources"]
        for family, row in FC.contracts().items():
            with self.subTest(family=family):
                self.assertTrue(row["name"] and row["admission"])
                self.assertIsInstance(row["version"], int)
                self.assertGreaterEqual(row["version"], 1)
                self.assertTrue(row["promise"] and "when" not in row["promise"][-1], "the last promise rule is the default")
                self.assertTrue(all(r["promise"] in FC.PROMISES and r["why"] for r in row["promise"]))
                physical = row["physical"]
                self.assertLessEqual(physical["maxSpan"], FC.AN_OCTAVE)
                self.assertIn(physical["fingering"]["printed"], FC.FINGERING_PRINT)
                for source in physical["fingering"]["source"] or []:
                    self.assertIn(source, sources)
                roles = row["roles"]
                self.assertTrue(roles["assign"] and "when" not in roles["assign"][-1])
                self.assertTrue(set(r["role"] for r in roles["assign"]) <= set(roles["provides"]) <= set(FC.ROLES))
                self.assertTrue(roles["transfer"])
                self.assertTrue(row["assessment"]["unjudged"])

    def test_heard_is_held_to_the_record(self) -> None:
        """
        D2 item 4 (revised from D0's "every music family is marked unheard", whose assumption was
        that no hearing could be recorded): `heard` stays a hand-maintained declaration, and a
        family marked `heard: true` has at least one `heard` decision by a person on a current
        item of it in `content/review/decisions.jsonl` — never the reverse. A music family still
        unheard says so in its unjudged lines.
        """
        events, errors = review.read_record()
        self.assertEqual(errors, [])
        entries = [entry for _sc, entry in planned.plan()]
        current = {entry["id"]: review.generator_identity(entry) for entry in entries}
        family_of = {entry["id"]: entry["drill"]["generator"]["family"] for entry in entries}
        self.assertEqual(review.heard_faults(FC.contracts(), events, current, family_of), [])
        music = [f for f, row in FC.contracts().items() if any(r["promise"] == "music" for r in row["promise"])]
        self.assertGreater(len(music), 10)
        for family in music:
            row = FC.contract(family)
            with self.subTest(family=family):
                self.assertIsInstance(row["heard"], bool)
                if not row["heard"]:
                    self.assertTrue(any("heard" in line for line in row["assessment"]["unjudged"]))

    def test_a_family_marked_heard_without_a_heard_decision_fails(self) -> None:
        """The adversaries of the rule above, on a copy of the table with `tumbao` marked heard."""
        entry = next(e for _sc, e in planned.plan() if e["id"] == "exercise.tumbao.c")
        identity = review.generator_identity(entry)
        current = {entry["id"]: identity}
        family_of = {entry["id"]: "tumbao"}
        contracts = copy.deepcopy(FC.contracts())
        contracts["tumbao"]["heard"] = True

        def event(**over) -> dict:
            base = {"v": 1, "event": "ev-heard-1", "item": entry["id"], "identity": copy.deepcopy(identity),
                    "dimension": "goodTeachingUse", "value": "yes", "basis": "heard", "reason": "heard complete",
                    "category": "style", "by": "A. Reviewer", "at": "2026-09-27T10:00:00.000Z"}
            base.update(over)
            return base

        def faults(*events: dict, table: dict = contracts) -> list[str]:
            text = "".join(json.dumps(e) + "\n" for e in events)
            parsed, errors = review.parse(text)
            self.assertEqual(errors, [])
            return review.heard_faults(table, parsed, current, family_of)

        stale = copy.deepcopy(identity)
        stale["version"] = identity["version"] + 1
        self.assertTrue(faults(), "heard with nothing in the record")
        self.assertTrue(faults(event(basis="notation")), "heard on a notation decision")
        self.assertTrue(faults(event(identity=stale)), "heard on a stale identity")
        triage = {"v": 1, "event": "ev-heard-t", "item": entry["id"], "by": "triage", "reason": "it grooves",
                  "at": "2026-09-27T10:00:00.000Z"}
        self.assertTrue(faults(triage), "heard on a triage line")
        self.assertEqual(faults(event()), [], "a heard decision on a current item")
        self.assertEqual(faults(event(), table=FC.contracts()), [], "never the reverse: heard: false stays allowed")

    def test_the_groove_and_style_families_promise_music(self) -> None:
        """Item 6: clave, tumbao, montuno, boogie, stride, comping, walking bass, rag, vamp, riff, ostinato."""
        for family in ("clave", "tumbao", "montuno", "latin_groove", "boogie", "stride", "comping", "walking_bass",
                       "secondary_rag", "modal_vamp", "riff", "ostinato"):
            with self.subTest(family=family):
                self.assertEqual(FC.contract(family)["promise"][-1]["promise"], "music")


class TestEveryItemCarriesItsContract(unittest.TestCase):
    def test_target_skills_role_and_identity_are_the_rows(self) -> None:
        declaring = 0
        for _sc, entry in planned.plan():
            family = entry["drill"]["generator"]["family"]
            row = FC.contract(family)
            recipe = FC.recipe_of(entry)
            with self.subTest(item=entry["id"]):
                skills = FC.target_skills(row, recipe)
                self.assertEqual(entry.get("targetSkills", []), skills)
                self.assertEqual(entry["role"], FC.role_of(row, recipe))
                self.assertEqual(entry["drill"]["generator"], FC.identity(family, recipe))
                self.assertNotIn("genre", entry, "technique and drill are types; genre is descriptive (G33)")
            declaring += bool(skills)
        self.assertGreater(declaring, 0)

    def test_every_family_in_the_table_is_in_the_plan(self) -> None:
        self.assertEqual(sorted(planned.by_family()), sorted(FC.contracts()))


class TestIdentity(unittest.TestCase):
    """G21: family + recipe + seed + generator version."""

    def test_one_identity_is_one_piece_of_music(self) -> None:
        seen: dict[str, tuple[str, str]] = {}
        clashes = []
        for sc, entry in planned.plan():
            key = identity_key(entry)
            digest = music_digest(sc, entry)
            if key in seen and seen[key][1] != digest:
                clashes.append(f"{entry['id']} and {seen[key][0]}")
            seen.setdefault(key, (entry["id"], digest))
        self.assertEqual(clashes, [], "the same identity, different music: the recipe does not say what it writes")

    def test_a_family_s_music_changes_only_with_its_version(self) -> None:
        pins = json.loads((FIXTURES / "identity_pins.json").read_text(encoding="utf-8"))["families"]
        digests: dict[str, list] = defaultdict(list)
        for sc, entry in planned.plan():
            digests[entry["drill"]["generator"]["family"]].append((entry["id"], music_digest(sc, entry)))
        for family, items in digests.items():
            family_digest = hashlib.sha256(json.dumps(sorted(items)).encode("utf-8")).hexdigest()
            pin = pins[family]
            with self.subTest(family=family):
                self.assertEqual(FC.contract(family)["version"], pin["version"],
                                 "the version moved: re-pin the family's music with the new version")
                self.assertEqual(family_digest, pin["digest"],
                                 "the music changed and the version did not (G21): bump the row's version and re-pin")


class TestTheMutationCensus(unittest.TestCase):
    """A mutation of every promise each row makes fails its gate, on the family's own item."""

    def test_every_promise_can_fail(self) -> None:
        measured = planned.measured()
        unreddened = []
        reddened: dict[str, int] = {}
        for family, items in planned.by_family().items():
            sc, entry = items[0]
            row = FC.contract(family)
            recipe = FC.recipe_of(entry)
            m = measured[entry["id"]]
            self.assertEqual(FC.pedagogical_faults(row, recipe, m), [], entry["id"])
            self.assertEqual(FC.physical_faults(row, recipe, sc, entry), [], entry["id"])
            count = 0
            for rule in FC.selected(row["requires"], recipe):
                gone = copy.deepcopy(m)
                gone["demands"] = [d for d in gone["demands"] if d != rule["demand"]]
                gone["opportunities"][rule["demand"]] = 0
                if not FC.pedagogical_faults(row, recipe, gone):
                    unreddened.append(f"{family}: dropping {rule['demand']}")
                count += 1
                if "min" in rule or "minPer" in rule:
                    tight = copy.deepcopy(row)
                    for r in tight["requires"]:
                        if r is not None and r["demand"] == rule["demand"] and r.get("when") == rule.get("when"):
                            if "min" in r:
                                r["min"] = m["opportunities"][rule["demand"]] + 1
                            if "minPer" in r:
                                r["minPer"] = [r["minPer"][0], r["minPer"][1] * 1000]
                    if not FC.pedagogical_faults(tight, recipe, m):
                        unreddened.append(f"{family}: raising the density of {rule['demand']}")
                    count += 1
            for rule in FC.selected(row["forbids"], recipe):
                brought = copy.deepcopy(m)
                brought["demands"].append(rule["demand"])
                if not FC.pedagogical_faults(row, recipe, brought):
                    unreddened.append(f"{family}: bringing {rule['demand']}")
                count += 1
            skills, _demands = FC.vocabulary()
            for skill in FC.target_skills(row, recipe):
                opportunity = skills[skill]["opportunity"]
                if opportunity == "every-step":
                    continue
                stripped = copy.deepcopy(m)
                stripped["demands"] = [d for d in stripped["demands"] if d not in opportunity]
                if not FC.pedagogical_faults(row, recipe, stripped):
                    unreddened.append(f"{family}: {skill} without its opportunity")
                count += 1
            facts = FC.physical_facts(sc)
            slow = copy.deepcopy(row)
            slow["physical"]["maxRate"] = max(f["rate"] for f in facts["hands"].values()) / 2
            if not FC.physical_faults(slow, recipe, sc, entry):
                unreddened.append(f"{family}: halving the rate")
            count += 1
            widest = max(f["span"] for f in facts["hands"].values())
            if widest > 0:
                narrow = copy.deepcopy(row)
                narrow["physical"]["maxSpan"] = widest - 1
                narrow["physical"].pop("largeHand", None)
                if not FC.physical_faults(narrow, recipe, sc, entry):
                    unreddened.append(f"{family}: narrowing the span")
                count += 1
            if "leaps" in row["physical"]:
                short = copy.deepcopy(row)
                short["physical"].pop("leaps")
                moves = [s for f in facts["hands"].values() for s, _t, _w in f["moves"] if s > FC.AN_OCTAVE]
                if moves:
                    if not FC.physical_faults(short, recipe, sc, entry):
                        unreddened.append(f"{family}: taking the leaps away")
                    count += 1
            printed = sum(f["fingered"] for f in facts["hands"].values())
            if printed:
                none = copy.deepcopy(row)
                none["physical"]["fingering"]["printed"] = "none"
                if not FC.physical_faults(none, recipe, sc, entry):
                    unreddened.append(f"{family}: saying no fingering is printed")
                count += 1
            claimed = copy.deepcopy(entry)
            claimed["drill"]["params"]["fingeringVerified"] = True
            unsourced = copy.deepcopy(row)
            unsourced["physical"]["fingering"]["source"] = None
            if not FC.physical_faults(unsourced, recipe, sc, claimed):
                unreddened.append(f"{family}: verified fingering without a source")
            count += 1
            # Revised (D3; the old assumption: no family has a musical evaluator, so any family's
            # gate claiming an evaluation was the fault). A row naming an evaluator must refuse its
            # own item once the floor is raised above the item's score; every other music family's
            # gate stays "not evaluated", and a drill's does not apply.
            gate = FC.musical_gate(row, sc, entry)
            if row.get("musical"):
                if not gate.get("evaluated") or not gate.get("passes"):
                    unreddened.append(f"{family}: the evaluator does not pass its own item: {gate.get('why')}")
                strict = copy.deepcopy(row)
                strict["musical"]["floor"] = gate.get("total", 0) + 0.01
                if FC.musical_gate(strict, sc, entry).get("passes"):
                    unreddened.append(f"{family}: raising the musical floor above the item's score")
                count += 1
            elif gate.get("evaluated"):
                unreddened.append(f"{family}: the musical hook claims an evaluation")
            reddened[family] = count
        self.assertEqual(unreddened, [], "promises whose mutation did not fail the gate")
        self.assertEqual(sorted(f for f, n in reddened.items() if n == 0), [], "families no mutation reaches")


# --------------------------------------------------------------------------------------
# CL15
# --------------------------------------------------------------------------------------


def planned_item(item_id: str) -> tuple:
    return next((sc, entry) for sc, entry in planned.plan() if entry["id"] == item_id)


class TestACanonicalRoleNamesAShippedItem(unittest.TestCase):
    """
    G54 (CL15): a family's canonical role names an item the plan ships, for every family.

    `power_chord`'s row named `{"key": "C"}` while the plan writes A, E and D (`make_power_chord`'s
    own reasoning: the keys the track is played in), so the family had no canonical item at all and
    D2's queue stood in for one. The rule is read over every family's canonical clause, so a row
    written the same way elsewhere fails here too.
    """

    @staticmethod
    def unmatched(contracts: dict) -> tuple[list[str], int]:
        families = planned.by_family()
        missing: list[str] = []
        checked = 0
        for family, row in contracts.items():
            for rule in row["roles"]["assign"]:
                if rule["role"] != "canonical" or not rule.get("when"):
                    continue
                checked += 1
                if not any(FC.matches(rule["when"], FC.recipe_of(entry)) for _sc, entry in families.get(family, [])):
                    missing.append(f"{family}: canonical when {rule['when']} matches no planned item")
        return missing, checked

    def test_every_canonical_when_matches_a_planned_item(self) -> None:
        missing, checked = self.unmatched(FC.contracts())
        self.assertEqual(missing, [])
        self.assertGreater(checked, 50, "every family's canonical clause is read, not one family's")

    def test_a_canonical_key_the_plan_never_writes_is_refused(self) -> None:
        contracts = copy.deepcopy(FC.contracts())
        contracts["power_chord"]["roles"]["assign"][0]["when"] = {"key": "C"}
        missing, _checked = self.unmatched(contracts)
        self.assertEqual(missing, ["power_chord: canonical when {'key': 'C'} matches no planned item"])

    def test_the_power_chord_canonical_item_is_the_a_root(self) -> None:
        roles = {entry["id"]: entry["role"] for _sc, entry in planned.by_family()["power_chord"]}
        self.assertEqual(roles, {"exercise.power-chord.a": "canonical", "exercise.power-chord.e": "variable",
                                 "exercise.power-chord.d": "variable"})


def names_skill(skill_id: str, text: str) -> bool:
    """`text` names the skill: its id as a word, a plural allowed ("syncopation", "ties")."""
    return re.search(r"(?<![\w-])" + re.escape(skill_id.lower()) + r"s?(?![\w-])", text.lower()) is not None


class TestANameClaimsOnlyWhatTheDetectorsFind(unittest.TestCase):
    """
    G51 (CL15): an item's title, concepts and tags never name a skill whose opportunity the app's
    own detectors do not find in it.

    The sixteenth-note drill was titled "Sixteenth-note syncopation" and both syncopation items
    listed the `syncopation` concept, which the Library prints under what the item trains, while the
    family's contract said the detectors find no syncopation in either (T37's definition counts a
    note a quarter or longer off the beat; the drill's off-beat notes are eighths, and the tie starts
    on the beat). The rule is the vocabulary's: a skill named is a skill whose opportunity demands
    the measured file holds. It is not "never name a not-judged candidate" — a tremolo drill is a
    tremolo, and naming its material is honest where judging the ability is out of reach.
    """

    @staticmethod
    def faults(entries: list[dict]) -> list[str]:
        skills, _demands = FC.vocabulary()
        measured = planned.measured()
        out = []
        for entry in entries:
            present = set(measured[entry["id"]]["demands"])
            words = [entry["title"], *entry.get("concepts", []), *entry.get("tags", [])]
            for skill_id, skill in skills.items():
                opportunity = skill["opportunity"]
                if opportunity == "every-step":
                    continue
                if any(names_skill(skill_id, word) for word in words) and not present & set(opportunity):
                    out.append(f"{entry['id']}: names {skill_id}, and the detectors find none of {opportunity}")
        return out

    def test_no_item_names_a_skill_its_music_holds_no_opportunity_for(self) -> None:
        self.assertEqual(self.faults([entry for _sc, entry in planned.plan()]), [])

    def test_the_check_reads_the_title_and_the_concepts(self) -> None:
        _sc, entry = planned_item("exercise.syncopation.sixteenth")
        titled = dict(entry, title="Sixteenth-note syncopation")
        conceptual = dict(entry, concepts=[*entry["concepts"], "syncopation"])
        why = "exercise.syncopation.sixteenth: names syncopation, and the detectors find none of ['rhythm.syncopation']"
        self.assertEqual(self.faults([titled]), [why])
        self.assertEqual(self.faults([conceptual]), [why])
        self.assertTrue(names_skill("tie", "Ties across the bar line"))
        self.assertFalse(names_skill("tie", "tied-across-bar"))


def across_bar_ties(sc, part_id: str = "RH") -> list[tuple[float, float]]:
    """(onset, written length) of each note on the staff that starts in one bar and ends in a later one, a tie chain as one note."""
    part = next(p for p in sc.parts if p.id == part_id)
    bar = float(next(iter(sc.recurse().getElementsByClass(meter.TimeSignature))).barDuration.quarterLength)
    chains: list[list[float]] = []
    for n in part.recurse().notes:
        if isinstance(n, harmony.ChordSymbol):
            continue
        length = float(n.duration.quarterLength)
        if n.tie is not None and n.tie.type in ("stop", "continue") and chains:
            chains[-1][1] += length
            continue
        chains.append([float(n.getOffsetInHierarchy(part)), length])
    return [(onset, length) for onset, length in chains if int(onset // bar) != int((onset + length - 1e-9) // bar)]


class TestTheTieDrillHasDensity(unittest.TestCase):
    """
    G51 (CL15; the reviewer's ruling, `responses/questions-e71ef3ad.md` §CL15): one tie across the bar
    in four bars is an example, not practice. At least two independent across-bar ties in the
    four-bar drill, as a minimum count of opportunities, never a pattern that repeats one bar's shape.
    """

    def test_two_independent_across_bar_ties_in_four_bars(self) -> None:
        sc, _entry = planned_item("exercise.syncopation.tied-across-bar")
        ties = across_bar_ties(sc)
        self.assertGreaterEqual(len(ties), 2, ties)
        bar = 4.0
        self.assertEqual(len({(onset % bar, length) for onset, length in ties}), len(ties),
                         f"a crossing repeats another's rhythm cell: {ties}")
        self.assertEqual(len({int((onset + length) // bar) for onset, length in ties}), len(ties),
                         f"two crossings share a barline: {ties}")

    def test_the_contract_states_the_floor_as_a_count_and_the_file_meets_it(self) -> None:
        _sc, entry = planned_item("exercise.syncopation.tied-across-bar")
        row = FC.contract("syncopation")
        recipe = FC.recipe_of(entry)
        rules = [rule for rule in FC.selected(row["requires"], recipe) if rule["demand"] == "rhythm.ties"]
        self.assertEqual([rule.get("min") for rule in rules], [2])
        self.assertNotIn("minPer", rules[0])
        measured = planned.measured()[entry["id"]]
        self.assertGreaterEqual(measured["opportunities"]["rhythm.ties"], 2)
        self.assertEqual(FC.pedagogical_faults(row, recipe, measured), [])

    def test_the_counter_finds_no_crossing_in_a_figure_inside_the_bar(self) -> None:
        sc, _entry = G.make_rhythm("dotted-quarter-eighth")
        self.assertEqual(across_bar_ties(sc, sc.parts[0].id), [])


class TestGeneratedIdentityContinuity(unittest.TestCase):
    """
    CL15 item 9 (the reviewer's required change, `responses/questions-122a5224.md` §CL15): a version
    belongs to a whole family, so a bump moves every item's identity, the unchanged ones among them.
    `generator_continuity.json` records each bumped family's items as the catalogue held them at the
    version left, with each item's music digest there; `family_contracts.former_generator_identities`
    carries the old identity onto an item only where its music digest now is the recorded one. So an
    unchanged sibling keeps learner continuity, proven per item rather than by shape or form name, and
    a changed item takes the new identity with no link to its old music.
    """

    def test_the_table_records_every_item_of_each_family_at_the_version_left(self) -> None:
        table = FC.continuity_table()["families"]
        self.assertTrue(table)
        families = planned.by_family()
        for family, record in table.items():
            with self.subTest(family=family):
                self.assertEqual(sorted(record["items"]), sorted(entry["id"] for _sc, entry in families[family]))
                self.assertEqual(record["to"], FC.contract(family)["version"],
                                 "the family moved again: record the version it left now")
                self.assertLess(record["from"], record["to"])
                for item_id, one in record["items"].items():
                    self.assertEqual((one["identity"]["kind"], one["identity"]["family"], one["identity"]["version"]),
                                     ("generator", family, record["from"]), item_id)
                    self.assertRegex(one["digest"], r"^[0-9a-f]{64}$")

    def test_an_unchanged_item_carries_its_old_identity_and_a_changed_one_none(self) -> None:
        table = FC.continuity_table()["families"]
        carried, changed = [], []
        for sc, entry in planned.plan():
            formers = FC.former_generator_identities(sc, entry)
            record = table.get(entry["drill"]["generator"]["family"])
            with self.subTest(item=entry["id"]):
                if record is None:
                    self.assertEqual(formers, [])
                    continue
                one = record["items"][entry["id"]]
                if one["digest"] == FC.music_digest(sc, entry):
                    self.assertEqual(formers, [one["identity"]])
                    current = review.generator_identity(entry)
                    self.assertEqual({**one["identity"], "version": current["version"]}, current,
                                     "the old identity is the item's own at the version left")
                    self.assertFalse(review.same_identity(one["identity"], current))
                    carried.append(entry["id"])
                else:
                    self.assertEqual(formers, [])
                    changed.append(entry["id"])
        self.assertTrue(carried and changed)

    def test_the_siblings_the_ruling_names(self) -> None:
        carried = {entry["id"] for sc, entry in planned.plan() if FC.former_generator_identities(sc, entry)}
        octaves = {entry["id"] for _sc, entry in planned.by_family()["tremolo_octaves"] if entry["drill"]["params"]["shape"] == "octave"}
        thirds = {entry["id"] for _sc, entry in planned.by_family()["tremolo_octaves"] if entry["drill"]["params"]["shape"] == "third"}
        blues = {entry["id"] for _sc, entry in planned.by_family()["pentatonic"] if entry["drill"]["params"]["form"] == "blues"}
        pentatonic = {entry["id"] for _sc, entry in planned.by_family()["pentatonic"] if entry["drill"]["params"]["form"] == "pentatonic"}
        self.assertEqual([len(octaves), len(thirds), len(blues), len(pentatonic)], [6, 6, 3, 3])
        self.assertLessEqual(octaves | blues | {"exercise.syncopation.sixteenth"}, carried)
        self.assertEqual((thirds | pentatonic | {"exercise.syncopation.tied-across-bar"}) & carried, set())

    def test_a_digest_that_does_not_match_carries_nothing(self) -> None:
        sc, entry = planned_item("exercise.tremolo.c.right")
        table = copy.deepcopy(FC.continuity_table())
        self.assertEqual(len(FC.former_generator_identities(sc, entry, table)), 1)
        table["families"]["tremolo_octaves"]["items"][entry["id"]]["digest"] = "0" * 64
        self.assertEqual(FC.former_generator_identities(sc, entry, table), [])
        table = copy.deepcopy(FC.continuity_table())
        table["families"]["tremolo_octaves"]["to"] += 1
        self.assertEqual(FC.former_generator_identities(sc, entry, table), [], "a table for another version is not read")


if __name__ == "__main__":
    unittest.main()
