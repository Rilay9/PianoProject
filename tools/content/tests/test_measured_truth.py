"""
Measured truth on every catalogue entry (E0 items 1, 2, 5 and 6; Q8's cases for E0's build).

Table-driven over the built catalogue, one row per entry, never one file per entry:

- **every notated entry carries `demands` measured by the app's detectors, or `demands:
  "unmeasured"` with its reason** — never an empty list that reads as "no demands"; a
  runtime drill carries none and says it is made at runtime;
- **every entry carries a provenance record** with each fact labelled measured, inferred,
  authored, reviewed, unmeasured or runtime, and R42's two review decisions as separate
  bits; a PDMX quarry keep is neither bit;
- **no tempo-sensitive demand is trusted where the tempo is inferred** (R11);
- **identity survives the build**: composition, arrangement, edition and source for a piece;
  family, version and seed for a generated item (R15, G21);
- **the bridge regression** (D0): the build's demands equal the pinned readings that
  `demandsOfFiles.test.ts` holds the direct reading of the same files to;
- **the useful-density rule** tells an opportunity from incidental presence, per demand,
  never one universal threshold, and a generated family's presence-only rule establishes
  nothing (the tie drill, D0 finding 6);
- **the rung-claims report and the inventory** are what the build wrote from this catalogue,
  list every unestablished claim, and report works, arrangements and coverage;
- **the promise fact** (D3a): every generated item carries its family's promise for its recipe,
  the rule the recipe matches, as an authored fact the app's one gate reads;
- **the material identity** (D4): every row carries `provenance.identity`, D2's identity as the
  build computes it, and a transfer role carries its contract's `transferOf` for its recipe.

These read the built catalogue: run `python tools/content/build.py` first (CI: the step
'Build content', before 'Content pipeline tests').
"""
from __future__ import annotations

import copy
import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

REPO = Path(__file__).resolve().parents[3]
BUILT = REPO / "app" / "public" / "content"
FIXTURES = Path(__file__).resolve().parent / "fixtures"
DENSITY = REPO / "content" / "sources" / "opportunity-density.json"
KINDS = {"measured", "inferred", "authored", "reviewed", "unmeasured", "runtime"}
SOURCES = {"authored", "pdmx", "kern", "musetrainer", "mutopia", "generated", "runtime", "placeholder", "excerpt"}
ANH_113 = "song.classical.bach-menuet-bwv-anh-113.pdmx"


def built(name: str):
    path = BUILT / name
    if not path.is_file():
        raise AssertionError(
            f"{path} is missing, and this test reads the built content: run "
            "`python tools/content/build.py` first (CI: the step 'Build content', "
            "before 'Content pipeline tests')"
        )
    return json.loads(path.read_text(encoding="utf-8"))


def _encoding(path: Path) -> tuple[str | None, str | None]:
    """E50a: (the first `<software>`, the `<encoding-date>`) of a built score's `<encoding>`, or Nones."""
    import io
    import re
    import zipfile

    with zipfile.ZipFile(io.BytesIO(path.read_bytes())) as archive:
        names = [n for n in archive.namelist() if n.lower().endswith((".xml", ".musicxml")) and not n.upper().startswith("META-INF/")]
        text = archive.read(names[0]).decode("utf-8") if names else ""
    block = re.search(r"<encoding>(.*?)</encoding>", text, re.DOTALL)
    if block is None:
        return None, None
    software = re.search(r"<software>([^<]*)</software>", block.group(1))
    day = re.search(r"<encoding-date>([^<]*)</encoding-date>", block.group(1))
    return (software.group(1) if software else None), (day.group(1) if day else None)


class Built(unittest.TestCase):
    catalog: list[dict]
    curriculum: dict

    @classmethod
    def setUpClass(cls) -> None:
        cls.catalog = built("catalog.json")
        cls.curriculum = built("curriculum.json")
        cls.by_id = {item["id"]: item for item in cls.catalog}
        cls.density = json.loads(DENSITY.read_text(encoding="utf-8"))


class TestEveryNotatedEntryIsMeasuredOrSaysWhyNot(Built):
    def test_one_row_per_entry(self) -> None:
        for item in self.catalog:
            with self.subTest(item=item["id"]):
                measurement = item.get("measurement")
                self.assertIsInstance(measurement, dict, "no measurement record")
                status = measurement["status"]
                if item.get("file") or item.get("type") == "song" or not item.get("drill"):
                    # A notated entry, or a piece whose notation is not bundled.
                    self.assertIn(status, ("measured", "unmeasured"))
                if status == "measured":
                    self.assertIsInstance(item["demands"], list)
                    self.assertTrue(set(measurement["located"]) <= set(item["demands"]),
                                    "a located demand the ids lack")
                    self.assertTrue(set(measurement["established"]) <= set(item["demands"]),
                                    "an established demand the ids lack")
                    self.assertGreater(measurement["bars"], 0)
                elif status == "unmeasured":
                    self.assertEqual(item["demands"], "unmeasured")
                    self.assertTrue(measurement.get("reason"), "unmeasured without a reason")
                else:
                    self.assertEqual(status, "runtime")
                    self.assertNotIn("demands", item, "a runtime drill with demands of its own")
                    self.assertTrue(measurement.get("reason"))
                    self.assertTrue(item.get("drill"), "runtime, and not a drill")

    def test_every_bundled_score_file_was_measured(self) -> None:
        """A file the build ships is measured; `unmeasured` is for what the detectors could not read."""
        unmeasured = [f"{item['id']}: {item['measurement'].get('reason')}" for item in self.catalog
                      if item.get("file") and item.get("measurement", {}).get("status") != "measured"]
        # Listed, not asserted empty: a file the app cannot load is data the report states.
        # What is asserted is that none of them reads as measured-and-empty.
        for item in self.catalog:
            if item.get("demands") == []:
                self.assertEqual(item["measurement"]["status"], "measured", item["id"])
        self.assertLess(len(unmeasured), max(1, len([i for i in self.catalog if i.get("file")]) // 10), unmeasured[:10])


class TestProvenanceLabelsEveryFact(Built):
    def test_one_row_per_entry(self) -> None:
        for item in self.catalog:
            with self.subTest(item=item["id"]):
                provenance = item.get("provenance")
                self.assertIsInstance(provenance, dict, "no provenance")
                self.assertIn(provenance["source"], SOURCES)
                for fact, how in provenance["facts"].items():
                    self.assertIn(how["kind"], KINDS, f"{fact} labelled {how['kind']!r}")
                self.assertIn("demands", provenance["facts"])
                self.assertEqual(provenance["facts"]["demands"]["kind"],
                                 {"measured": "measured", "unmeasured": "unmeasured", "runtime": "runtime"}[item["measurement"]["status"]])
                # R42: two decisions, never one keep bit standing for both. Since D2 a bit is filled
                # only from the human review record, and always beside its `reviewed` fact; a quarry
                # keep never fills one (revised: E0 held both bits null on every keep, when no person
                # had decided anything; `test_review_record.py` holds every bit to the record).
                self.assertEqual(set(provenance["review"]), {"score", "teaching"})
                for bit, fact in (("score", "reviewedScore"), ("teaching", "reviewedTeaching")):
                    if provenance["review"][bit] is not None:
                        self.assertEqual(provenance["facts"][fact]["kind"], "reviewed", f"a {bit} bit with no reviewed fact")
                    elif provenance.get("quarryKeep"):
                        self.assertNotIn(fact, provenance["facts"], f"a quarry keep read as a {bit} review")

    def test_a_quarry_keep_is_the_decision_not_the_reviewers_prose(self) -> None:
        # The quarry's review note is a reviewer's working prose ("La Cumparsita is 1916"), with no
        # source; the catalogue carries the decision, and the note stays in the source table
        # (T22: no year in any catalogue field without a source).
        table = json.loads((REPO / "content" / "sources" / "pdmx.json").read_text(encoding="utf-8"))
        decisions = {row["id"]: (row.get("review") or {}).get("decision") for row in table["items"]}
        for item in self.catalog:
            keep = item["provenance"].get("quarryKeep")
            if keep is None:
                continue
            with self.subTest(item=item["id"]):
                self.assertEqual(keep, decisions.get(item["id"]), "the quarry's note copied into the catalogue")

    def test_measured_facts_name_their_definitions(self) -> None:
        for item in self.catalog:
            how = item["provenance"]["facts"]["demands"]
            if how["kind"] == "measured":
                with self.subTest(item=item["id"]):
                    self.assertEqual(how["via"], "app/src/demands/detect.ts")
                    self.assertIsInstance(how["definitions"], int)
                    self.assertEqual(how["detectors"], item["measurement"]["detectors"])

    def test_the_level_estimate_is_inferred_and_a_judged_level_is_not(self) -> None:
        for item in self.catalog:
            with self.subTest(item=item["id"]):
                kind = item["provenance"]["facts"]["level"]["kind"]
                self.assertEqual(kind, "inferred" if item.get("levelSource") == "estimated" else "authored")


class TestTempoProvenance(Built):
    def test_no_tempo_sensitive_demand_is_trusted_where_the_tempo_is_inferred(self) -> None:
        sensitive = set(self.density["tempoSensitive"])
        inferred = 0
        for item in self.catalog:
            facts = item["provenance"]["facts"]
            tempo = (facts.get("tempo") or {}).get("kind")
            demands = item.get("demands") if isinstance(item.get("demands"), list) else []
            with self.subTest(item=item["id"]):
                if tempo == "inferred":
                    inferred += 1
                    self.assertEqual(facts["demands"].get("untrusted", []), [d for d in demands if d in sensitive])
                else:
                    self.assertNotIn("untrusted", facts["demands"])
        self.assertGreater(inferred, 0, "no entry has an inferred tempo: the tempo-defaulted rows lost their flag")

    def test_a_defaulted_tempo_never_reads_as_written(self) -> None:
        for item in self.catalog:
            if "tempo-defaulted" in (item.get("tags") or []):
                with self.subTest(item=item["id"]):
                    self.assertEqual(item["provenance"]["facts"]["tempo"]["kind"], "inferred")


class TestIdentitySurvivesTheBuild(Built):
    def test_one_row_per_entry(self) -> None:
        for item in self.catalog:
            provenance = item["provenance"]
            with self.subTest(item=item["id"]):
                if provenance["source"] == "generated":
                    self.assertEqual(
                        {k: provenance["generator"][k] for k in ("family", "version", "seed")},
                        item["drill"]["generator"])
                elif provenance["source"] == "runtime":
                    self.assertEqual(provenance["generator"]["kind"], item["drill"]["kind"])
                else:
                    self.assertTrue(provenance.get("composition"), "no composition identity")
                    self.assertTrue(provenance.get("arrangement"), "no arrangement identity")
                    self.assertIn(provenance["facts"]["composition"]["kind"], ("authored", "inferred"))
                    if item.get("file"):
                        self.assertTrue(provenance.get("edition"), "a bundled piece with no edition identity")

    def test_a_duplicate_pdmx_edition_shares_its_arrangement(self) -> None:
        table = json.loads((REPO / "content" / "sources" / "pdmx.json").read_text(encoding="utf-8"))
        duplicates = [row for row in table["items"] if row.get("duplicateOf")]
        for row in duplicates:
            with self.subTest(item=row["id"]):
                self.assertEqual(self.by_id[row["id"]]["provenance"]["arrangement"], row["duplicateOf"])
                self.assertNotEqual(self.by_id[row["id"]]["provenance"]["edition"],
                                    self.by_id[row["duplicateOf"]]["provenance"].get("edition"))

    def test_authored_variants_name_one_composition(self) -> None:
        # A generated variant (the legato twin of a staccato exercise) is identified by its
        # generator and names no composition: an exercise is not a work.
        for item in self.catalog:
            if item["provenance"]["source"] in ("generated", "runtime"):
                with self.subTest(item=item["id"]):
                    self.assertNotIn("composition", item["provenance"], "an exercise counted as a work")
                continue
            if item.get("variantOf") and item["variantOf"] in self.by_id:
                with self.subTest(item=item["id"]):
                    self.assertEqual(item["provenance"]["composition"],
                                     self.by_id[item["variantOf"]]["provenance"]["composition"]
                                     if self.by_id[item["variantOf"]].get("variantOf")
                                     else f"variant-of:{item['variantOf']}")


class TestThePromiseFact(Built):
    """
    D3a: every generated item carries its family's promise for its recipe as an authored fact,
    `provenance.facts.promise` (`value` `music` or `drill`, via the contract table), which the one gate
    reads to keep a music-promising item with no affirmative teaching-use decision out of automatic
    offers; nothing at runtime reads the table itself. The fact is the rule that matches the recipe
    (`family_contracts.selected`), never the row's first rule; a runtime drill and a notated item carry
    none.
    """

    maxDiff = None

    def promise_rule(self, item: dict) -> str | None:
        import family_contracts as FC

        rules = FC.selected(FC.contract(item["drill"]["generator"]["family"])["promise"], FC.recipe_of(item))
        return rules[0]["promise"] if rules else None

    def test_every_generated_item_carries_the_promise_its_recipe_matches(self) -> None:
        generated = [item for item in self.catalog if item["provenance"]["source"] == "generated"]
        self.assertGreater(len(generated), 1000)
        faults = []
        for item in generated:
            fact = item["provenance"]["facts"].get("promise")
            wanted = self.promise_rule(item)
            if wanted is None:
                faults.append(f"{item['id']}: no promise rule matches its recipe")
            elif fact is None:
                faults.append(f"{item['id']}: no promise fact (its recipe's rule says {wanted})")
            elif (fact.get("kind"), fact.get("value")) != ("authored", wanted) or "family_contracts.json" not in str(fact.get("via")):
                faults.append(f"{item['id']}: {fact} where the recipe's rule says authored {wanted} from family_contracts.json")
        self.assertEqual(faults[:10], [], f"{len(faults)} generated items")

    def test_music_families_carry_music_and_drills_carry_drill(self) -> None:
        import family_contracts as FC

        by_value: dict[str, set[str]] = {"music": set(), "drill": set()}
        faults = []
        for item in self.catalog:
            if item["provenance"]["source"] != "generated":
                continue
            family = item["drill"]["generator"]["family"]
            value = (item["provenance"]["facts"].get("promise") or {}).get("value")
            rules = FC.contract(family)["promise"]
            if all(rule["promise"] == "music" for rule in rules) and value != "music":
                faults.append(f"{item['id']}: the {family} family promises music, the fact says {value}")
            elif all(rule["promise"] == "drill" for rule in rules) and value != "drill":
                faults.append(f"{item['id']}: the {family} family is a drill, the fact says {value}")
            if value in by_value:
                by_value[value].add(family)
        self.assertEqual(faults[:10], [], f"{len(faults)} generated items")
        self.assertIn("study", by_value["music"])
        self.assertTrue({"clave", "tumbao", "boogie", "walking_bass"} <= by_value["music"])
        self.assertTrue({"scale", "interval_reading", "hanon"} <= by_value["drill"])

    def test_the_matching_rule_never_the_first_on_a_conditional_family(self) -> None:
        import family_contracts as FC

        rules = FC.contract("meter")["promise"]
        # The row's first rule is the conditional music rule: a first-rule reading would call 5/4 music.
        self.assertEqual((rules[0]["promise"], rules[0].get("when")), ("music", {"timeSig": "12/8"}))
        five = self.by_id["exercise.meter.5-4"]
        twelve = self.by_id["exercise.meter.12-8"]
        self.assertEqual(five["drill"]["params"]["timeSig"], "5/4")
        self.assertEqual(twelve["drill"]["params"]["timeSig"], "12/8")
        self.assertEqual((five["provenance"]["facts"].get("promise") or {}).get("value"), "drill",
                         "exercise.meter.5-4: the 5/4 walk is a drill by its recipe's rule")
        self.assertEqual((twelve["provenance"]["facts"].get("promise") or {}).get("value"), "music",
                         "exercise.meter.12-8: the 12/8 blues promises music by its recipe's rule")

    def test_no_runtime_or_notated_item_carries_one(self) -> None:
        carrying = [item["id"] for item in self.catalog
                    if item["provenance"]["source"] != "generated" and "promise" in item["provenance"]["facts"]]
        self.assertEqual(carrying[:10], [], f"{len(carrying)} items that are not generated carry a promise")
        readers = [item for item in self.catalog if (item.get("drill") or {}).get("kind") == "sight-reading"]
        self.assertEqual(len(readers), 9)
        for item in readers:
            self.assertEqual(item["measurement"]["status"], "runtime", item["id"])


class TestTheMaterialIdentity(Built):
    """
    D4 item 1: every row carries `provenance.identity`, D2's identity as the build computes it
    (`review.current_identity`), so the app never recomputes it: a generated item's generator triple,
    recipe and tempo; a notated item's built file, by the sha256 of its bytes (an excerpt's cut
    included); `none`, with its reason, for a drill made when it opens and for a placeholder. The
    oracle here is independent of `review.py`: the triple read off `drill.generator`, the recipe off
    `drill.params` and `hands`, the hash taken with `hashlib` from the file the build wrote.

    And a transfer role's relationship (D4 item 4): an item with `role: transfer` carries its family
    contract's `transferOf` for its recipe as `provenance.transferOf` (an authored fact, the rule its
    recipe matches, `when` dropped), so the session reads the declared skill and differences without
    reading the table; no other item carries one. Intent and relationship facts, never evidence.
    """

    maxDiff = None

    def test_every_row_carries_the_identity_the_build_computes(self) -> None:
        import hashlib

        faults: list[str] = []
        kinds: dict[str, int] = {"generator": 0, "file": 0, "none": 0}
        for item in self.catalog:
            identity = item["provenance"].get("identity")
            drill = item.get("drill") or {}
            rel = item.get("file") or ""
            if identity is None:
                faults.append(f"{item['id']}: no provenance.identity")
                continue
            kinds[identity.get("kind", "?")] = kinds.get(identity.get("kind", "?"), 0) + 1
            if drill.get("generator") and rel.startswith("scores/generated/"):
                recipe = dict(drill.get("params") or {})
                recipe.setdefault("hands", item.get("hands"))
                wanted = {"kind": "generator", **{k: drill["generator"].get(k) for k in ("family", "version", "seed")},
                          "recipe": recipe, "tempoBpm": item.get("tempoBpm")}
            elif rel:
                path = BUILT / rel
                wanted = ({"kind": "file", "sha256": hashlib.sha256(path.read_bytes()).hexdigest()} if path.is_file()
                          else {"kind": "none", "why": "the score file was not built"})
            elif drill:
                wanted = {"kind": "none", "why": "made when it opens: no file the build keys"}
            else:
                wanted = {"kind": "none", "why": "no notation is bundled"}
            if identity != wanted:
                faults.append(f"{item['id']}: {identity} where the build's is {wanted}")
        self.assertEqual(faults[:10], [], f"{len(faults)} rows")
        self.assertGreater(kinds["generator"], 1000)
        self.assertGreater(kinds["file"], 700)
        self.assertGreater(kinds["none"], 9, "the nine reading rows at least are made when they open")

    def test_no_file_the_converter_wrote_carries_an_encoding_date(self) -> None:
        # E50a: music21 writes the day it ran as `<encoding-date>`; the converter removes it, so every
        # built file whose `<encoding>` names music21 carries none, and a conversion on another day is
        # the same file. A committed PDMX copy keeps the date it was quarried with until a reconversion
        # replaces it (E50), and a MuseScore-written copy is not music21's.
        dated: list[str] = []
        written = 0
        for item in self.catalog:
            if (item["provenance"].get("identity") or {}).get("kind") != "file" or item["provenance"]["source"] == "pdmx":
                continue
            software, day = _encoding(BUILT / item["file"])
            if software is None or not software.startswith("music21 v."):
                continue
            written += 1
            if day is not None:
                dated.append(f"{item['id']}: {day}")
        self.assertEqual(dated[:10], [], f"{len(dated)} of {written} files the converter wrote carry a date")
        self.assertGreater(written, 200)

    def test_former_identities_are_the_recorded_history_of_undated_files_and_never_a_current_one(self) -> None:
        # E50a: a row whose file the converter wrote without a date carries the recorded historical
        # identities whose undated form is that file (`tools/content/former_identities.json`), every one of
        # them, and, since E50, the old identity each reviewed repair of that file names
        # (`tools/content/repaired_identities.json`), and nothing else carries any; no former identity is any row's current identity (the app
        # would resolve a current file away from itself). The oracle reads the table and the built files
        # itself. On a build whose zip bytes differ from the laptop's (the creating system `zipfile` writes
        # into every archive), no undated form matches and no row carries any: said, not hidden.
        table = json.loads((REPO / "tools" / "content" / "former_identities.json").read_text(encoding="utf-8"))
        by_undated: dict[str, list[str]] = {}
        for entry in table["identities"]:
            by_undated.setdefault(entry["undated"], []).append(entry["sha256"])
        # E50: beside the date proof, a reviewed musical repair (`tools/content/repaired_identities.json`) names
        # the old identity of the file it repaired; `test_a_repaired_file_carries_its_old_identity` reads those.
        relations = json.loads((REPO / "tools" / "content" / "repaired_identities.json").read_text(encoding="utf-8"))
        for repair in relations["repairs"]:
            by_undated.setdefault(repair["to"], []).append(repair["from"])
        current = {item["provenance"]["identity"]["sha256"] for item in self.catalog
                   if (item["provenance"].get("identity") or {}).get("kind") == "file"}
        # E50b: the one derived repair the build produced, the Wabash cut re-cut from its repaired parent, names its
        # old cut (the table's `cuts`) where its parent is the repair's file; no other cut, and no generated row.
        cut_formers = {cut["id"]: [cut["from"]] for cut in relations.get("cuts", [])
                       if ((self.by_id.get(cut["of"]) or {}).get("provenance", {}).get("identity") or {}).get("sha256") == cut["parentTo"]}
        faults: list[str] = []
        carrying = 0
        for item in self.catalog:
            former = item["provenance"].get("formerIdentities")
            identity = item["provenance"].get("identity") or {}
            if identity.get("kind") != "file":
                if former is not None:
                    faults.append(f"{item['id']}: former identities on a {identity.get('kind')} identity")
                continue
            software, day = _encoding(BUILT / item["file"])
            undated_music21 = software is not None and software.startswith("music21 v.") and day is None
            expected = by_undated.get(identity["sha256"], []) if undated_music21 else cut_formers.get(item["id"], [])
            got = [one["sha256"] for one in former or []]
            if any(one.get("kind") != "file" for one in former or []):
                faults.append(f"{item['id']}: a former identity that is not a file's")
            if sorted(got) != sorted(expected):
                faults.append(f"{item['id']}: former identities {len(got)} where the record names {len(expected)}")
            clashes = [sha[:12] for sha in got if sha in current]
            if clashes:
                faults.append(f"{item['id']}: former identities that are current identities: {clashes}")
            if item["provenance"]["source"] in {"excerpt", "generated"} and got and item["id"] not in cut_formers:
                faults.append(f"{item['id']}: a {item['provenance']['source']} row carries former identities")
            carrying += bool(got)
        self.assertEqual(faults[:10], [], f"{len(faults)} rows")
        # Every undated form the record names that a built file is, is one: on the laptop, all of them; and the cut.
        reached = sum(1 for item in self.catalog if (item["provenance"].get("identity") or {}).get("sha256") in by_undated)
        self.assertEqual(carrying, reached + len(cut_formers))

    def test_a_repaired_file_carries_its_old_identity_and_no_approval_is_renewed_by_it(self) -> None:
        # E50: each reviewed repair's row names the repaired file as its identity and the old file among its
        # former identities (learner continuity, the reviewer's condition); the old identity is never the
        # row's own, never un-stales an excerpt approved on the old bytes (the cut's `stale` stays, and its
        # `parentSha256` is the parent's current file), and never enters `pdmx.json`.
        repairs = json.loads((REPO / "tools" / "content" / "repaired_identities.json").read_text(encoding="utf-8"))["repairs"]
        items = {row["id"]: row for row in json.loads((REPO / "content" / "sources" / "pdmx.json").read_text(encoding="utf-8"))["items"]}
        self.assertEqual(len([repair for repair in repairs if repair["change"].startswith("E50 ")]), 7)
        # E57 (Entry 183): a file the build converts carries two relations, the dated file E50a recorded and its
        # undated form (the identity every catalogue since E50a served); a committed PDMX file one. Read per row.
        froms: dict[str, list[str]] = {}
        for repair in repairs:
            froms.setdefault(repair["id"], []).append(repair["from"])
        for repair in repairs:
            with self.subTest(repair["id"], undated=repair.get("undated", False)):
                item = self.by_id[repair["id"]]
                self.assertEqual(item["provenance"]["identity"], {"kind": "file", "sha256": repair["to"]})
                self.assertIn({"kind": "file", "sha256": repair["from"]}, item["provenance"].get("formerIdentities") or [])
                if repair["change"].startswith("E50 "):
                    self.assertNotIn("tempo-defaulted", item.get("tags") or [])
                if repair["id"] in items:
                    self.assertFalse({"formerIdentities", "repairs", "restore"} & set(items[repair["id"]]))
                # E50b: the old identity is marked as a file whose tempo the repair changed, so no tempo-dependent
                # standard reads a run of it against this row's tempo (`material.tempoNotComparable`).
                self.assertEqual(sorted(one["sha256"] for one in item["provenance"].get("tempoRepairedFrom") or []), sorted(froms[repair["id"]]))
        # E50b: the Wabash cut, re-cut from the repaired parent, carries its old cut the same way, and nothing else.
        cuts = json.loads((REPO / "tools" / "content" / "repaired_identities.json").read_text(encoding="utf-8")).get("cuts", [])
        self.assertEqual([cut["id"] for cut in cuts], ["excerpt.blues.wabash-blues.b1-4"])
        for cut in cuts:
            with self.subTest(cut["id"]):
                row = self.by_id[cut["id"]]
                self.assertEqual(row["provenance"].get("formerIdentities"), [{"kind": "file", "sha256": cut["from"]}])
                self.assertEqual(row["provenance"].get("tempoRepairedFrom"), [{"kind": "file", "sha256": cut["from"]}])
                self.assertNotEqual(row["provenance"]["identity"]["sha256"], cut["from"])
                self.assertEqual(row["provenance"]["excerpt"]["parentSha256"], cut["parentTo"])
                self.assertEqual(row["provenance"]["excerpt"]["stale"]["approvedParentSha256"], cut["parentFrom"])
        marked = sorted(item["id"] for item in self.catalog if "tempoRepairedFrom" in item["provenance"])
        self.assertEqual(marked, sorted({repair["id"] for repair in repairs} | {cut["id"] for cut in cuts}))
        for item in self.catalog:
            for one in item["provenance"].get("tempoRepairedFrom") or []:
                self.assertIn(one, item["provenance"].get("formerIdentities") or [], item["id"])
        approvals = json.loads((REPO / "content" / "sources" / "excerpts.json").read_text(encoding="utf-8"))["excerpts"]
        for row in approvals:
            parent = self.by_id.get(row["of"])
            if parent is None or not row.get("parentSha256"):
                continue
            formers = {one["sha256"] for one in parent["provenance"].get("formerIdentities") or []}
            if row["parentSha256"] not in formers:
                continue
            cut = next(item for item in self.catalog if (item["provenance"].get("excerpt") or {}).get("of") == row["of"]
                       and item["provenance"]["excerpt"]["fromBar"] == row["fromBar"] and item["provenance"]["excerpt"]["toBar"] == row["toBar"])
            block = cut["provenance"]["excerpt"]
            with self.subTest(cut["id"]):
                self.assertEqual(block["parentSha256"], parent["provenance"]["identity"]["sha256"])
                self.assertEqual((block.get("stale") or {}).get("approvedParentSha256"), row["parentSha256"])

    def test_it_is_the_review_records_identity(self) -> None:
        import review

        faults = [f"{item['id']}: {review.identity_fault(item['provenance'].get('identity'))}" for item in self.catalog
                  if review.identity_fault(item["provenance"].get("identity"))]
        self.assertEqual(faults[:10], [], f"{len(faults)} rows whose identity D2's record would refuse")
        differs = [item["id"] for item in self.catalog
                   if not review.same_identity(item["provenance"].get("identity"), review.current_identity(item, BUILT))]
        self.assertEqual(differs[:10], [], f"{len(differs)} rows whose identity is not the record's current one")

    def test_every_excerpt_is_its_cuts_file_identity(self) -> None:
        excerpts = [item for item in self.catalog if item.get("type") == "excerpt"]
        self.assertGreater(len(excerpts), 0)
        for item in excerpts:
            with self.subTest(item=item["id"]):
                self.assertEqual(item["provenance"]["identity"]["kind"], "file")
                self.assertTrue(item["file"].startswith("scores/excerpts/"))

    def test_a_transfer_role_carries_its_contracts_relationship_and_nothing_else_does(self) -> None:
        import family_contracts as FC

        faults: list[str] = []
        transfer = 0
        for item in self.catalog:
            carried = item["provenance"].get("transferOf")
            if item.get("role") != "transfer":
                if carried is not None:
                    faults.append(f"{item['id']}: role {item.get('role')!r} carries transferOf")
                continue
            transfer += 1
            row = FC.contract(item["drill"]["generator"]["family"])["roles"]["transferOf"]
            rules = row if isinstance(row, list) else [row]
            matching = [rule for rule in rules if FC.matches(rule.get("when"), FC.recipe_of(item))]
            wanted = {k: v for k, v in matching[0].items() if k != "when"} if matching else None
            if carried != wanted:
                faults.append(f"{item['id']}: {carried} where the contract's rule for its recipe is {wanted}")
            fact = item["provenance"]["facts"].get("transferOf") or {}
            if fact.get("kind") != "authored" or "family_contracts.json" not in str(fact.get("via")):
                faults.append(f"{item['id']}: the transferOf fact is {fact}")
        self.assertEqual(faults[:10], [], f"{len(faults)} rows")
        self.assertEqual(transfer, 12, "six pentatonic items for shifting position and six transfer studies")
        pentatonic = self.by_id["exercise.pentatonic.a.pentatonic"]["provenance"]["transferOf"]
        self.assertEqual((pentatonic["skill"], pentatonic["from"], pentatonic["differs"]),
                         ("position-shift", ["position_shift"], ["family", "rhythm"]))


class TestExcerptsOnTheBuild(Built):
    """
    The excerpt on the combined build (E1; Part 24): every approved row is an item of its own, measured
    on its cut and never the parent's, its identity the key over the parent's bytes and its definition,
    its attribution the parent's, on no rung and with no named section; and Q8's case on the real
    catalogue — the whole Anh. 113 refused at `classical.3`, its excerpt not.
    """

    def excerpts(self) -> list[dict]:
        return [item for item in self.catalog if item.get("type") == "excerpt"]

    def test_every_approved_row_is_an_item_and_there_are_some(self) -> None:
        import excerpts as X

        rows = X.read_definitions().get("excerpts") or []
        self.assertGreater(len(rows), 0, "no approved excerpt in content/sources/excerpts.json")
        built_ids = {item["id"] for item in self.excerpts()}
        for row in rows:
            eid = X.excerpt_id(row["of"], row["fromBar"], row["toBar"], row["selection"])
            with self.subTest(excerpt=eid):
                self.assertIn(eid, built_ids)

    def test_each_is_measured_on_its_cut_and_identified_by_its_definition(self) -> None:
        import excerpts as X

        for item in self.excerpts():
            with self.subTest(item=item["id"]):
                parent = self.by_id[item["excerptOf"]]
                block = item["provenance"]["excerpt"]
                self.assertEqual(item["id"], X.excerpt_id(parent["id"], block["fromBar"], block["toBar"], block["selection"]))
                self.assertEqual(item["file"], f"scores/excerpts/{item['id']}.mxl")
                self.assertEqual(item["measurement"]["status"], "measured")
                self.assertEqual(item["provenance"]["facts"]["demands"]["kind"], "measured")
                self.assertEqual(item["provenance"]["facts"]["demands"]["on"], item["file"], "measured on another file than the cut")
                self.assertNotEqual(item["measurement"]["bars"], parent["measurement"]["bars"],
                                    "the cut measured as many bars as the whole piece")
                self.assertEqual(item["measurement"]["bars"], block["toBar"] - block["fromBar"] + 1)
                parent_file = BUILT / parent["file"]
                self.assertEqual(block["parentSha256"], X.sha256_of(parent_file))
                self.assertEqual(block["key"], X.chain_key(block["parentSha256"], block["fromBar"], block["toBar"],
                                                           block["selection"], block["cutVersion"]))
                self.assertEqual(block["parentEdition"], parent["provenance"].get("edition"))
                # `stale` exactly where the approval was made on other parent bytes (E50: the Wabash cut's parent
                # was re-converted for its printed tempo, and its approval waits for a person, E51's path; before
                # E50 no approved row was, and this line asserted none ever is).
                approved = next((row.get("parentSha256") for row in X.read_definitions().get("excerpts") or []
                                 if X.excerpt_id(row["of"], row["fromBar"], row["toBar"], row["selection"]) == item["id"]), None)
                if approved and approved != block["parentSha256"]:
                    self.assertEqual((block.get("stale") or {}).get("approvedParentSha256"), approved)
                else:
                    self.assertNotIn("stale", block, "approved on these parent bytes")
                self.assertEqual(item["levelSource"], "estimated")
                self.assertEqual(item["hands"], block["selection"])

    def test_the_attribution_and_the_chain_are_the_parents(self) -> None:
        for item in self.excerpts():
            with self.subTest(item=item["id"]):
                parent = self.by_id[item["excerptOf"]]
                self.assertEqual(item["source"], parent["source"], "the excerpt's attribution is not the parent's")
                self.assertEqual(item["provenance"]["source"], "excerpt")
                self.assertEqual(item["provenance"]["composition"], parent["provenance"]["composition"])
                self.assertEqual(item["provenance"]["arrangement"], parent["provenance"]["arrangement"])
                for tag in ("personal-build", "nc-personal-build"):
                    self.assertEqual(tag in (item.get("tags") or []), tag in (parent.get("tags") or []), tag)

    def test_the_key_is_the_pieces_where_it_has_one_and_the_cut_prints_it(self) -> None:
        """The Library prints the key: an excerpt of a one-key piece whose cut opens in that key says it."""
        seen = 0
        for item in self.excerpts():
            parent = self.by_id[item["excerptOf"]]
            keys = (parent.get("notation") or {}).get("keys") or []
            mine = (item.get("notation") or {}).get("keys") or []
            with self.subTest(item=item["id"]):
                if len(keys) == 1 and parent.get("keySig") and mine and mine[0].get("fifths") == keys[0].get("fifths"):
                    seen += 1
                    self.assertEqual(item.get("keySig"), parent["keySig"])
                else:
                    self.assertNotIn("keySig", item)
        self.assertGreater(seen, 0, "no excerpt of a one-key piece to read")

    def test_the_candidate_rungs_say_where_one_detector_answers_for_several_concepts(self) -> None:
        """
        `texture.left-hand-pattern` is one detector for alberti, waltz, oom-pah, boogie and stride
        (claims.CONCEPT_DEMANDS): a rung reached through it is a pattern in the notes, not the rung's
        pattern, and the report says so beside the line, where F reads it.

        Revised (F2b part 2). Old assumption: the left-hand pattern is the only demand several concepts
        share. The leap is now two concepts, the beginner's `leap` (a fourth or fifth, 2.1) and the
        advanced `leaps` (an octave or more, `blues.7`, `ragtime.9`), and the one detector finds a fourth
        or wider under both: a Bach menuet's fourths make an excerpt a candidate for `blues.7` by that
        reading, and the line now says the demand is shared, which is the truth F needs there.

        Revised (F2c; the reviewer's required change on F2b, `responses/ddba53e9.md`). Old assumption: the
        leap is shared by `leap` and `leaps`. The detector finds a fourth or wider and cannot tell a fourth
        from an octave, so the advanced `leaps` maps to no demand: the leap is the beginner's alone, and
        the shared note on those lines was the false relationship.
        """
        import claims
        import excerpts as X

        sharing: dict[str, list[str]] = {}
        for concept, demand in claims.CONCEPT_DEMANDS.items():
            sharing.setdefault(demand, []).append(concept)
        shared = {demand: sorted(concepts) for demand, concepts in sharing.items() if len(concepts) > 1}
        self.assertNotIn("interval.leap", shared, "the leap shared with the advanced jump, which no fourth proves")
        report = X.candidate_rungs(self.catalog, self.curriculum)
        found: dict[str, int] = {}
        for row in report:
            for candidate in row["candidates"]:
                for claim in candidate["established"]:
                    where = f"{row['item']} at {candidate['rung']}: {claim['id']}"
                    if claim["kind"] == "demand" and claim["id"] in shared and claim["from"].startswith("concept "):
                        found[claim["id"]] = found.get(claim["id"], 0) + 1
                        self.assertEqual(sorted(claim.get("sharedBy") or []), shared[claim["id"]], where)
                    else:
                        self.assertNotIn("sharedBy", claim, where)
        self.assertGreater(found.get("texture.left-hand-pattern", 0), 0, "no candidate reached through the left-hand pattern to read")
        self.assertIn("one detector", X.candidate_rungs_markdown(report))

    def test_a_primer_fourth_satisfies_no_claim_of_the_advanced_rungs(self) -> None:
        """
        F2c (the reviewer's required change on F2b, `responses/ddba53e9.md`): a fourth-or-wider reading
        never satisfies a claim attributed to `blues.7` or `ragtime.9`, whose leap is an octave or more and
        is measured by no detector yet. On the built candidate report, the Anh. 113 menuet's cut (bars
        25-32, whose leaps the detector establishes) is a candidate for neither rung, and no excerpt is; the
        leap still reaches a rung only through the beginner's `leap`. Red on the build before F2c, where
        the menuet's cut was a candidate for both through `concept leaps`.
        """
        import excerpts as X

        report = X.candidate_rungs(self.catalog, self.curriculum)
        cuts = [row for row in report if row["of"] == ANH_113]
        self.assertGreater(len(cuts), 0, "no excerpt of Anh. 113 on the build")
        for row in cuts:
            self.assertIn("interval.leap", row["established"] or [], f"{row['item']}: the detector's leaps are the case")
        for row in report:
            with self.subTest(item=row["item"]):
                advanced = [c["rung"] for c in row["candidates"] if c["rung"] in ("blues.7", "ragtime.9")]
                self.assertEqual(advanced, [], "a fourth-or-wider reading makes the cut a candidate for an octave-or-more rung")
                sources = {claim["from"] for c in row["candidates"] for claim in c["established"] if claim["id"] == "interval.leap"}
                self.assertLessEqual(sources, {"concept leap", "taughtAt"}, "the leap reached through another concept")

    def test_on_no_rung_and_no_named_section(self) -> None:
        listed = {option for stage in self.curriculum["stages"] for unit in stage["units"] for lesson in unit["lessons"]
                  for option in lesson.get("exerciseOptions", []) + lesson.get("songOptions", [])}
        for item in self.excerpts():
            with self.subTest(item=item["id"]):
                self.assertNotIn(item["id"], listed, "an excerpt placed on a rung: placement is F's")
                self.assertNotIn("sections", item.get("teaching") or {})

    def test_the_score_checks_read_an_excerpt_as_its_parents_declared_passage(self) -> None:
        """An excerpt is short and inside its parent by definition: never a truncated copy or an undeclared containment."""
        report = json.loads((REPO / "build" / "score-checks.json").read_text(encoding="utf-8"))
        excerpt_ids = {item["id"] for item in self.excerpts()}
        found = [f"{flag['item']}: {flag['check']} {flag.get('kind')}" for flag in report["flags"]
                 if flag["item"] in excerpt_ids and flag["check"] in ("truncation", "containment")]
        self.assertEqual(found, [])

    def test_q8_the_whole_anh_113_is_refused_at_classical_3_and_its_excerpt_is_not(self) -> None:
        import claims

        _skills, demands = claims.load_vocabulary()
        ancestry = claims.rung_ancestry(self.curriculum)
        whole = self.by_id[ANH_113]
        self.assertEqual(sorted(claims.untaught_on(whole, "classical.3", ancestry, demands)),
                         ["rhythm.sixteenths", "rhythm.triplets"])
        cuts = [item for item in self.excerpts() if item["excerptOf"] == ANH_113]
        self.assertGreater(len(cuts), 0, "no excerpt of Anh. 113 on the build")
        for cut in cuts:
            with self.subTest(item=cut["id"]):
                self.assertEqual(claims.untaught_on(cut, "classical.3", ancestry, demands), [])
        # The parent's demands are the parent's: the cut leaves them as the bridge measured them.
        self.assertIn("rhythm.sixteenths", whole["demands"])
        self.assertIn("rhythm.triplets", whole["demands"])


class TestExcerptLocalTruth(unittest.TestCase):
    """
    Part 24's adversaries 1 and 2 through the bridge, on constructed parents: what an excerpt carries
    is what its bars carry.
    """

    @classmethod
    def setUpClass(cls) -> None:
        import tempfile

        from music21 import clef, key, meter, note, stream, tempo

        from convert import write_mxl
        import demands as D
        import excerpts as X

        cls.dir = Path(tempfile.mkdtemp(prefix="excerpt-truth-"))

        def parent(name: str, bars: list[list[tuple[str, float]]]) -> Path:
            upper, lower = stream.PartStaff(), stream.PartStaff()
            for number, row in enumerate(bars, start=1):
                top, bottom = stream.Measure(number=number), stream.Measure(number=number)
                if number == 1:
                    top.append([clef.TrebleClef(), key.KeySignature(0), meter.TimeSignature("4/4"), tempo.MetronomeMark(number=80)])
                    bottom.append([clef.BassClef(), key.KeySignature(0), meter.TimeSignature("4/4")])
                top.append([note.Note(p, quarterLength=q) for p, q in row])
                bottom.append(note.Note("C3", quarterLength=4))
                upper.append(top)
                lower.append(bottom)
            score = stream.Score()
            score.insert(0, upper)
            score.insert(0, lower)
            path = cls.dir / f"{name}.mxl"
            write_mxl(score, path)
            return path

        steps = [("C5", 1), ("D5", 1), ("E5", 1), ("D5", 1)]
        sixteenths = [(p, 0.25) for p in ["C5", "D5", "E5", "F5"] * 4]
        leaps = [("C5", 1), ("G5", 1), ("C5", 1), ("F5", 1)]
        cls.sixteenths_parent = parent("sixteenths-outside", [sixteenths, sixteenths] + [steps] * 6)
        cls.leaps_parent = parent("leaps-inside", [steps] * 12 + [leaps] + [steps] * 11)
        cls.sixteenths_sha = X.sha256_of(cls.sixteenths_parent)
        cls.cut_clean = X.cut(cls.sixteenths_parent, 5, 8, "both", "excerpt.test.sixteenths-outside.b5-8", cls.dir / "clean.mxl")
        cls.cut_leaps = X.cut(cls.leaps_parent, 13, 16, "both", "excerpt.test.leaps-inside.b13-16", cls.dir / "leaps.mxl")
        cls.rows = D.measure_each([cls.sixteenths_parent, cls.cut_clean.path, cls.leaps_parent, cls.cut_leaps.path])
        cls.table = json.loads(DENSITY.read_text(encoding="utf-8"))
        cls.order = [d["id"] for d in json.loads((REPO / "content" / "curriculum" / "vocabulary" / "demands.json").read_text(encoding="utf-8"))["demands"]]

    @classmethod
    def tearDownClass(cls) -> None:
        import shutil

        shutil.rmtree(cls.dir, ignore_errors=True)

    def established(self, row: dict, window: bool) -> list[str]:
        import build

        located = {d: int(n) for d, n in row["opportunities"].items() if int(n) > 0}
        rule = build.established_by_window if window else build.established_by_density
        return rule(located, int(row["measures"]), self.table, self.order)

    def test_1_untaught_sixteenths_outside_the_excerpt_are_not_in_it_and_the_parent_is_unchanged(self) -> None:
        import excerpts as X

        parent, cut = self.rows[str(self.sixteenths_parent)], self.rows[str(self.cut_clean.path)]
        self.assertIn("rhythm.sixteenths", parent["demands"])
        self.assertNotIn("rhythm.sixteenths", cut["demands"])
        self.assertEqual(X.sha256_of(self.sixteenths_parent), self.sixteenths_sha, "the cut changed the parent's file")

    def test_2_leaps_only_inside_the_passage_are_established_on_the_cut_and_not_on_the_parent(self) -> None:
        parent, cut = self.rows[str(self.leaps_parent)], self.rows[str(self.cut_leaps.path)]
        self.assertIn("interval.leap", parent["demands"], "the parent has the leaps somewhere")
        self.assertNotIn("interval.leap", self.established(parent, window=False), "established on the whole piece")
        self.assertIn("interval.leap", self.established(cut, window=True), "not established on the cut")


class TestTheBridgeRegressionOnTheBuild(Built):
    """The build's attach step and the direct reading agree, on D0's pinned items and Anh. 113."""

    def test_the_pinned_generated_items(self) -> None:
        pinned = json.loads((FIXTURES / "bridge_regression.json").read_text(encoding="utf-8"))["items"]
        for pin in pinned:
            with self.subTest(item=pin["id"]):
                self.assertEqual(self.by_id[pin["id"]]["demands"], pin["demands"])

    def test_anh_113(self) -> None:
        found = set(self.by_id[ANH_113]["demands"])
        for demand in ("clef.bass", "pitch.ledger", "interval.step", "interval.skip", "interval.leap",
                       "rhythm.eighths", "rhythm.shorter-than-quarter", "rhythm.sixteenths", "rhythm.triplets",
                       "key.signature", "pitch.chromatic", "range.beyond-position", "texture.hands-together"):
            self.assertIn(demand, found)
        for demand in ("rhythm.ties", "rhythm.dotted-quarter", "metre.compound", "rhythm.syncopation",
                       "texture.left-hand-pattern", "texture.walking-bass"):
            self.assertNotIn(demand, found)


class TestUsefulDensity(unittest.TestCase):
    """An opportunity at a useful density, told apart from incidental presence (E0 item 3)."""

    @classmethod
    def setUpClass(cls) -> None:
        import build

        cls.build = build
        cls.table = json.loads(DENSITY.read_text(encoding="utf-8"))
        cls.order = [d["id"] for d in json.loads(
            (REPO / "content" / "curriculum" / "vocabulary" / "demands.json").read_text(encoding="utf-8"))["demands"]]

    def test_incidental_presence_is_not_an_opportunity(self) -> None:
        # Two skips in forty bars: in the piece, and not practice of skips.
        self.assertEqual(self.build.established_by_density({"interval.skip": 2}, 40, self.table, self.order), [])
        # A skip every bar: practice.
        self.assertEqual(self.build.established_by_density({"interval.skip": 40}, 40, self.table, self.order), ["interval.skip"])

    def test_the_window_rule_reads_the_window_minimum_never_the_whole_piece_min(self) -> None:
        """
        E1 item 9: a passage of up to eight bars meets a demand at `minInWindow` occurrences and the
        rule's `perBar`, where the whole-piece `min` would refuse it. Each rule whose window minimum
        is below its `min`, at exactly that many in the fewest bars that reach `perBar`.
        """
        import math

        checked = 0
        for demand, rule in self.table["demands"].items():
            window_min = rule.get("minInWindow", self.build.DEFAULT_MIN_IN_WINDOW)
            if window_min >= rule["min"] or rule["perBar"] <= 0:
                continue
            bars = max(1, min(8, math.floor(window_min / rule["perBar"])))
            if window_min / bars < rule["perBar"]:
                continue
            checked += 1
            with self.subTest(demand=demand):
                located = {demand: window_min}
                self.assertEqual(self.build.established_by_window(located, bars, self.table, self.order), [demand])
                self.assertEqual(self.build.established_by_density(located, bars, self.table, self.order), [])
                self.assertEqual(self.build.established_by_window({demand: window_min - 1}, bars, self.table, self.order), [])
        self.assertGreater(checked, 0, "no rule whose window minimum is below its whole-piece min")

    def test_every_vocabulary_demand_has_its_own_rule_and_none_is_universal(self) -> None:
        self.assertEqual(sorted(self.table["demands"]), sorted(self.order))
        rules = {(rule["min"], rule["perBar"]) for rule in self.table["demands"].values()}
        self.assertGreater(len(rules), 5, "one threshold for every demand is the universal percentage Part 15 forbids")
        for demand, rule in self.table["demands"].items():
            with self.subTest(demand=demand):
                self.assertTrue(rule["why"])
                self.assertIn("hypothesis", rule)

    def test_a_presence_only_family_rule_establishes_nothing(self) -> None:
        """The tie drill: one tie in four bars is the family's promise and not adequate practice (D0 finding 6)."""
        entry = {"drill": {"kind": "rhythm", "params": {"variant": "tied-across-bar"},
                           "generator": {"family": "syncopation", "version": 1, "seed": None}}, "hands": "right"}
        row = {"demands": ["rhythm.ties"], "opportunities": {"rhythm.ties": 1}, "measures": 4, "steps": 8, "notes": 8}
        self.assertEqual(self.build.established_by_contract(entry, row), [])

    def test_a_family_density_rule_establishes_what_it_measures(self) -> None:
        entry = {"drill": {"kind": "tumbao", "params": {"key": "C"},
                           "generator": {"family": "tumbao", "version": 1, "seed": None}}, "hands": "left"}
        row = {"demands": ["rhythm.syncopation"], "opportunities": {"rhythm.syncopation": 4}, "measures": 4, "steps": 16, "notes": 16}
        self.assertEqual(self.build.established_by_contract(entry, row), ["rhythm.syncopation"])
        thin = {**row, "opportunities": {"rhythm.syncopation": 1}}
        self.assertEqual(self.build.established_by_contract(entry, thin), [])

    def test_the_built_rows_follow_the_rule(self) -> None:
        catalog = built("catalog.json")
        for item in catalog:
            measurement = item.get("measurement") or {}
            if measurement.get("status") != "measured":
                continue
            with self.subTest(item=item["id"]):
                by_density = self.build.established_by_density(measurement["located"], measurement["bars"], self.table, self.order)
                spoilt = set((measurement.get("misread") or {}).get("demands", []))
                # E1: an excerpt is a window and also establishes by the window rule (`minInWindow`);
                # nothing else does. Computed here, not read from the row's `window`.
                by_window = (set(self.build.established_by_window(measurement["located"], measurement["bars"], self.table, self.order))
                             if item.get("type") == "excerpt" else set())
                self.assertEqual(sorted((set(by_density) | set(measurement.get("contract", [])) | by_window) - spoilt), sorted(measurement["established"]))
                self.assertEqual(sorted(measurement.get("window", [])), sorted(by_window - set(by_density) - spoilt))

    def test_a_reading_the_clef_assumption_spoils_never_establishes(self) -> None:
        """detect.ts reads staff 1 as treble: a one-staff bass-clef part's ledger lines are the misreading, marked."""
        catalog = built("catalog.json")
        spoilt = [item for item in catalog if (item.get("measurement") or {}).get("misread")]
        self.assertGreater(len(spoilt), 0, "the LH songs in the bass clef on one staff are no longer found")
        by_id = {item["id"]: item for item in catalog}
        lh = by_id["song.folk.hot-cross-buns.lh"]["measurement"]
        self.assertIn("pitch.ledger", lh["misread"]["demands"])
        for item in spoilt:
            with self.subTest(item=item["id"]):
                self.assertFalse(set(item["measurement"]["established"]) & set(item["measurement"]["misread"]["demands"]))
                self.assertEqual(item["provenance"]["facts"]["demands"]["misread"], item["measurement"]["misread"]["demands"])


class TestTheReports(Built):
    """The rung-claims report and the inventory: what the build wrote from this catalogue."""

    @classmethod
    def setUpClass(cls) -> None:
        super().setUpClass()
        import claims

        cls.claims = claims
        cls.report = claims.rung_claims(cls.catalog, cls.curriculum)

    def test_the_committed_markdown_is_this_catalogues(self) -> None:
        for path, text in ((REPO / "docs" / "prompts" / "rung-claims.md", self.claims.render_rung_claims(self.report)),
                           (REPO / "docs" / "prompts" / "inventory.md",
                            self.claims.render_inventory(self.claims.inventory(self.catalog, self.curriculum)))):
            with self.subTest(path=path.name):
                self.assertTrue(path.is_file(), f"{path} is missing: the build writes it")
                self.assertEqual(path.read_text(encoding="utf-8").replace("\r\n", "\n"), text,
                                 f"{path.name} is stale: rebuild")

    def test_the_report_makes_rewriting_the_rungs_no_owners(self) -> None:
        # D3a (`responses/ee70b43.md`, `bf2666a.md`): no owner review or placement is required, so the
        # report never names the owner among those who rewrite the rungs from it.
        text = self.claims.render_rung_claims(self.report)
        self.assertNotIn("owner", text.split("**How to read it.**")[0], "the report makes rewriting the rungs the owner's")
        self.assertIn("this is what F and G rewrite from", text)

    def test_every_priority_rung_option_is_listed_with_every_claim(self) -> None:
        options = {(o["rung"], o["item"]) for o in self.report["options"]}
        for _stage, _unit, lesson in self.claims.lessons_in_order(self.curriculum):
            if lesson["id"] in self.claims.PRIORITY:
                for item_id in lesson["exerciseOptions"] + lesson["songOptions"]:
                    self.assertIn((lesson["id"], item_id), options)

    def test_an_unestablished_claim_is_counted_and_listed(self) -> None:
        """The adversary: empty one measured option's opportunities and the report must see it."""
        target = next(o for o in self.report["options"]
                      if o["measured"] == "measured" and any(c["status"] == "established" for c in o["claims"]))
        catalog = copy.deepcopy(self.catalog)
        victim = next(item for item in catalog if item["id"] == target["item"])
        victim["measurement"]["established"] = []
        after = self.claims.rung_claims(catalog, self.curriculum)
        lost = sum(1 for o in self.report["options"] if o["item"] == target["item"]
                   for c in o["claims"] if c["status"] == "established")
        self.assertEqual(after["summary"]["unestablished"], self.report["summary"]["unestablished"] + lost)
        self.assertIn(f"{target['item']} on {target['rung']}", after["servesNone"])

    def test_untaught_here_is_the_rungs_path_never_the_files_order(self) -> None:
        """
        E0a: "untaught here" is read from the rung's ancestry. A walking-bass option on jazz.5 is
        untaught there (the blues track teaches it, on another track, stored before jazz.5 in the
        file); the same option on blues.6, the blues path's teaching rung since F2 (blues.5 introduces
        the line), is taught; and listed on both, it is read at both, since neither rung comes before
        the other on its path.
        """
        catalog = copy.deepcopy(self.catalog)
        curriculum = copy.deepcopy(self.curriculum)
        probe = {"id": "song.e0a.walking-probe", "type": "song", "title": "E0a probe",
                 "demands": ["texture.walking-bass"],
                 "measurement": {"status": "measured", "established": ["texture.walking-bass"]}}
        catalog.append(probe)
        lessons = {lesson["id"]: lesson for _s, _u, lesson in self.claims.lessons_in_order(curriculum)}
        lessons["jazz.5"]["songOptions"].append(probe["id"])
        lessons["blues.6"]["songOptions"].append(probe["id"])
        rows = {o["rung"]: o for o in self.claims.rung_claims(catalog, curriculum)["options"] if o["item"] == probe["id"]}
        self.assertEqual(rows["jazz.5"]["untaught"], ["texture.walking-bass"],
                         "texture.walking-bass on jazz.5: the file's order credited blues.5, stored before jazz.5")
        self.assertTrue(rows["jazz.5"]["earliest"] and rows["blues.6"]["earliest"],
                        "an option on two tracks is met first on each")
        self.assertEqual(rows["blues.6"]["untaught"], [])

    def test_a_demand_taught_on_two_paths_is_taught_on_both_and_on_neither_sibling(self) -> None:
        """
        E0b: `taughtAt` lists every rung that teaches a demand, one per path. The walking bass is
        taught at jazz.6 as well as blues.5, so a walking-bass option on jazz.8 (whose path goes
        through jazz.6, never blues.5) is taught there; on theory.9 and classical.6, whose paths
        reach no teaching rung, it is still untaught; and the inventory's coverage row for jazz.6
        names the walking bass among what the rung teaches.
        """
        catalog = copy.deepcopy(self.catalog)
        curriculum = copy.deepcopy(self.curriculum)
        probe = {"id": "song.e0b.walking-probe", "type": "song", "title": "E0b probe",
                 "demands": ["texture.walking-bass"],
                 "measurement": {"status": "measured", "established": ["texture.walking-bass"]}}
        catalog.append(probe)
        lessons = {lesson["id"]: lesson for _s, _u, lesson in self.claims.lessons_in_order(curriculum)}
        for rung in ("jazz.8", "theory.9", "classical.6"):
            lessons[rung]["songOptions"].append(probe["id"])
        report = self.claims.rung_claims(catalog, curriculum)
        rows = {o["rung"]: o for o in report["options"] if o["item"] == probe["id"]}
        self.assertEqual(rows["jazz.8"]["untaught"], [],
                         "texture.walking-bass on jazz.8: jazz.6 teaches it, on jazz.8's path")
        self.assertEqual(rows["theory.9"]["untaught"], ["texture.walking-bass"], "theory.9's path reaches no teaching rung")
        self.assertEqual(rows["classical.6"]["untaught"], ["texture.walking-bass"], "a sibling track inherits nothing")
        coverage = {row["rung"]: row for row in self.claims.inventory(self.catalog, self.curriculum)["coverage"]}
        self.assertIn("texture.walking-bass", coverage["jazz.6"]["taught"],
                      "the inventory: jazz.6 teaches the walking bass (texture.walking-bass)")
        # Revised (F2 item 1): blues.5 introduces the walking bass (its exercise is the line alone) and
        # blues.6 teaches it; the old line held blues.5 here.
        self.assertIn("texture.walking-bass", coverage["blues.6"]["taught"])
        self.assertNotIn("texture.walking-bass", coverage["blues.5"]["taught"])
        self.assertNotIn("texture.walking-bass", coverage["theory.9"]["taught"])

    def test_the_generated_untaught_combinations_are_d0s_record(self) -> None:
        self.assertTrue(self.report["summary"]["generatedUntaughtMatchesRecord"],
                        "the build's untaught-on-rung combinations differ from tests/fixtures/untaught_on_rung.json")

    def test_the_three_misreadings_are_marked(self) -> None:
        notes = {note for o in self.report["options"] for c in o["claims"] for note in c["e22"]}
        # Every E22 note the report can give is one of the recorded misreadings, never a new claim.
        allowed = set(self.claims.E22_FAMILY.values()) | {self.claims.E22_SYNCOPATION, self.claims.E22_WALKING,
                                                           self.claims.E22_NOTATED_WALK, self.claims.E22_NOTATED_SYNC,
                                                           self.claims.CLEF_NOTE}
        self.assertTrue(notes <= allowed, notes - allowed)

    def test_the_inventory_reports_works_arrangements_and_coverage(self) -> None:
        inventory = self.claims.inventory(self.catalog, self.curriculum)
        h = inventory["headline"]
        self.assertEqual(h["measured"] + h["unmeasured"] + h["runtime"], h["items"])
        self.assertGreater(h["works"], 0)
        self.assertGreaterEqual(h["arrangements"], h["works"] // 2)
        self.assertEqual(len(inventory["coverage"]), len(list(self.claims.lessons_in_order(self.curriculum))))
        # E1 makes them: the count is the excerpt items, never the items with named sections.
        excerpts = [item for item in self.catalog if item.get("type") == "excerpt"]
        self.assertEqual(h["excerpts"], len(excerpts), "the inventory must count excerpt items, not sections")


class TestPlacementReconciled(Built):
    """
    F2 (Entry 108): the rungs reconciled with the report on the combined build. Every claim no
    option keeps is accounted for — introduced (`introduces`) or deferred by the validator with its
    reason (a detector's every-bar rule refusing music its own per-bar reading finds) — and
    nothing else; the moved options left the rung their notes were untaught at and stay where they
    are taught; the practice track's first rungs hold what a Stage 1 hand plays; no rung lists a rock
    placeholder; the lessons F2 changed say what the rung does. Red on the build before F2.

    Revised (F2a, Entry 117; the reviewer's required change, `responses/b41e19e.md`). Old assumption:
    two hand readings F2 stopped at (1.5's leap, 3.1's accidentals) are claims no option keeps and
    stay. 1.5 and 3.1 now introduce them and 2.1 and 3.3, whose options establish them, name them.
    """

    #: Revised (F2a): empty. It held 1.5's leap and 3.1's accidentals, which no option on those rungs keeps.
    HAND_READINGS: set[tuple[str, str]] = set()
    MOVED = {
        ("1.1", "exercise.five-finger.c-major.both"): "2.1",
        ("1.3", "exercise.five-finger.c-major.both"): "2.1",
        ("2.3", "exercise.inversions.c-major.both"): "4.3",
        ("3.3", "exercise.arpeggio.a-minor.2oct.both"): "3.6",
        ("hymns", "song.folk.10000-reasons-matt-redman.pdmx"): "hymns.6",
        ("practice.1", "exercise.hanon.01.both"): "4.4",
        ("practice.2", "exercise.hanon.01.both"): "4.4",
    }

    @classmethod
    def setUpClass(cls) -> None:
        super().setUpClass()
        import claims
        import validate

        cls.claims = claims
        cls.validate = validate
        cls.report = claims.rung_claims(cls.catalog, cls.curriculum)
        cls.lessons = {lesson["id"]: lesson for _s, _u, lesson in claims.lessons_in_order(cls.curriculum)}

    def text(self, rung: str) -> str:
        return " ".join((REPO / "content" / self.lessons[rung]["textFile"]).read_text(encoding="utf-8").split())

    def test_every_claim_no_option_keeps_is_accounted_for(self) -> None:
        skills, _demands = self.claims.load_vocabulary()

        def claim_of(concept: str) -> str:
            # A skill concept is claimed as the skill; a notated fact as the demand its detector finds.
            return concept if concept in skills else self.claims.CONCEPT_DEMANDS[concept]

        deferred = {(rung, claim_of(concept)) for rung, concept in self.validate.DEFERRED_CONCEPT_CLAIMS}
        kept_by_none = {(row["rung"], row["id"]) for row in self.report["keptByNone"]}
        self.assertEqual(kept_by_none, deferred | self.HAND_READINGS,
                         "a rung claim no option keeps must be introduced or deferred with its reason")
        errors, warnings = self.validate.concept_claim_findings(self.catalog, self.curriculum)
        self.assertEqual(errors, [], "the validator's rule holds on the build")
        self.assertEqual(len([w for w in warnings if "deferred" in w]), len(self.validate.DEFERRED_CONCEPT_CLAIMS), warnings)

    def test_blues_5_introduces_the_walking_bass_and_claims_it_no_more(self) -> None:
        row = next(r for r in self.report["rungs"] if r["rung"] == "blues.5")
        self.assertIn("texture.walking-bass", [c["id"] for c in row["introduced"]])
        self.assertNotIn("texture.walking-bass", [c["id"] for c in row["claims"]])
        self.assertIn("walking-bass", self.lessons["blues.5"].get("introduces", []))
        self.assertNotIn("walking-bass", self.lessons["blues.5"]["concepts"])
        self.assertIn("introduced here", self.text("blues.5"), "the lesson says the rung introduces it")
        self.assertIn("none of this rung's pieces has one yet", self.text("blues.5"))

    def test_the_concepts_named_where_taught_and_dropped_where_not(self) -> None:
        self.assertIn("steps", self.lessons["1.1"]["concepts"], "1.1 names the steps its five-finger walks are")
        steps = next(c for r in self.report["rungs"] if r["rung"] == "1.1" for c in r["claims"] if c["id"] == "interval.step")
        self.assertGreater(steps["established"], 0, "1.1's steps are established by its options")
        self.assertNotIn("walking-bass", self.lessons["latin"]["concepts"], "latin's bass is the tumbao; it names no walking bass")
        self.assertNotIn("syncopation", self.lessons["technique.5"]["concepts"],
                         "technique.5 teaches ties across the bar line, which its tied-across-bar concept claims")

    def test_the_moved_options_left_where_untaught_and_stay_where_taught(self) -> None:
        _skills, demands = self.claims.load_vocabulary()
        ancestry = self.claims.rung_ancestry(self.curriculum)
        for (source, item_id), stays in self.MOVED.items():
            with self.subTest(item=item_id, source=source):
                lesson = self.lessons[source]
                self.assertNotIn(item_id, lesson["exerciseOptions"] + lesson["songOptions"])
                there = self.lessons[stays]
                self.assertIn(item_id, there["exerciseOptions"] + there["songOptions"])
        # Revised (L120c). Old assumption: sixteenths are taught at no rung (L101), so Hanon No. 1 was skipped here as
        # untaught wherever it stood. 4.4 teaches them now, so Hanon at 4.4 is held to being taught like the rest.
        for (source, item_id), stays in self.MOVED.items():
            with self.subTest(taught=item_id, at=stays):
                self.assertEqual(self.claims.untaught_on(self.by_id[item_id], stays, ancestry, demands), [])

    def test_the_practice_floor_is_what_a_stage_1_hand_plays(self) -> None:
        stage_1_core = {item for _s, unit, lesson in self.claims.lessons_in_order(self.curriculum)
                        if unit.get("track") == "core" and lesson["id"].startswith("1.")
                        for item in lesson["exerciseOptions"]}
        for rung in ("practice.1", "practice.2"):
            with self.subTest(rung=rung):
                exercises = self.lessons[rung]["exerciseOptions"]
                self.assertGreaterEqual(len(exercises), 3)
                self.assertEqual([e for e in exercises if e not in stage_1_core], [],
                                 f"{rung}: every exercise one a Stage 1 core rung lists")
        self.assertEqual(self.lessons["practice.1"]["exerciseOptions"][0], "exercise.five-finger.c-major.right",
                         "the practice row a learner placed at 1.5 is given is the right-hand five-finger pattern")

    def test_no_rung_lists_a_rock_placeholder_and_the_library_keeps_them(self) -> None:
        listed = [(rung, item) for rung, lesson in self.lessons.items()
                  for item in lesson["exerciseOptions"] + lesson["songOptions"] if item.startswith("song.rock.")]
        self.assertEqual(listed, [])
        rows = [item for item in self.catalog if item["id"].startswith("song.rock.")]
        self.assertEqual(len(rows), 7)
        for item in rows:
            self.assertIsNone(item.get("file"), item["id"])
            self.assertTrue(item.get("importHint"), f"{item['id']}: the Library draws its import hint")
            self.assertNotIn("module", item["source"]["editionNotes"], f"{item['id']}: no module points at it")

    def test_theory_9_promises_no_walking_bass_and_the_latin_rungs_no_duet(self) -> None:
        self.assertNotIn("drill.reading.sight-reading-7", self.lessons["theory.9"]["exerciseOptions"])
        self.assertNotIn("walking bass", self.text("theory.9").lower())
        for rung in ("latin.3", "latin"):
            with self.subTest(rung=rung):
                self.assertFalse(any(t.get("kind") == "duet" for t in self.lessons[rung].get("tools") or []))
                self.assertNotIn("Play it as a duet", self.text(rung))

    def claims_of(self, rung: str) -> tuple[dict, dict]:
        row = next(r for r in self.report["rungs"] if r["rung"] == rung)
        return ({(c["kind"], c["id"]): c for c in row["claims"]},
                {(c["kind"], c["id"]): c for c in row["introduced"]})

    def test_the_leap_is_introduced_at_1_5_and_taught_where_2_1_s_options_establish_it(self) -> None:
        """
        F2a (Entry 117; the reviewer's required change, `responses/b41e19e.md`): no option on 1.5
        establishes a leap, so 1.5 introduces it and claims nothing; 2.1's options establish it (the left
        hand's moves from C to F and to G), so 2.1 names it and is the one teaching rung. Red on the build
        before F2a, where 1.5 claimed the leap by `taughtAt` and 2.1 did not.
        """
        claims, introduced = self.claims_of("1.5")
        self.assertNotIn(("demand", "interval.leap"), claims, "1.5 claims no leap")
        self.assertEqual(introduced[("demand", "interval.leap")]["established"], 0, "1.5 introduces the leap; no option establishes it")
        claims, _introduced = self.claims_of("2.1")
        self.assertGreater(claims[("demand", "interval.leap")]["established"], 0, "2.1's options establish the leap")
        # Added (F2b part 2): the claim and the introduction come from the beginner's `leap` (a fourth or
        # fifth).
        self.assertEqual(introduced[("demand", "interval.leap")]["from"], "introduces leap")
        self.assertEqual(claims[("demand", "interval.leap")]["from"], "concept leap")
        # Revised (F2c; the reviewer's required change on F2b, `responses/ddba53e9.md`). Old assumption:
        # `blues.7` and `ragtime.9` claim the demand through the advanced `leaps`. The detector finds a
        # fourth or wider and cannot prove an octave or more, so neither rung claims the leap demand and
        # `leaps` is among the concepts no detector measures on both, in the report's "Not measurable".
        for rung in ("blues.7", "ragtime.9"):
            with self.subTest(rung=rung):
                self.assertNotIn(("demand", "interval.leap"), self.claims_of(rung)[0], f"{rung} claims the leap demand")
                row = next(r for r in self.report["rungs"] if r["rung"] == rung)
                self.assertIn("leaps", row["unmeasurable"], f"{rung}: the octave-or-more jump is not measurable yet")
        self.assertIn("this rung only introduces it", self.text("1.5"), "1.5's lesson says it introduces the leap")
        self.assertIn("a fourth and a fifth", self.text("2.1"), "2.1's lesson names the leaps its left hand makes")

    def test_accidentals_are_introduced_at_3_1_and_taught_where_3_3_s_options_establish_them(self) -> None:
        """
        F2a: no option on 3.1 establishes a note outside the key (its songs are in G and F with none), so
        3.1 introduces accidentals; 3.3's options establish them (the harmonic minor's raised seventh), so
        3.3 names them. Red on the build before F2a, where 3.1 claimed the demand by `taughtAt`.
        """
        claims, introduced = self.claims_of("3.1")
        self.assertNotIn(("demand", "pitch.chromatic"), claims, "3.1 claims no note outside the key")
        self.assertNotIn(("skill", "accidentals"), claims)
        self.assertEqual(introduced[("skill", "accidentals")]["established"], 0, "3.1 introduces accidentals; no option establishes one")
        claims, _introduced = self.claims_of("3.3")
        self.assertGreater(claims[("skill", "accidentals")]["established"], 0, "3.3's options establish accidentals")
        self.assertGreater(claims[("demand", "pitch.chromatic")]["established"], 0)
        self.assertIn("only introduced here", self.text("3.1"), "3.1's lesson says it introduces the accidental")
        self.assertIn("appears as an accidental every time it is used", self.text("3.3"),
                      "3.3's lesson teaches the raised seventh as an accidental (unchanged)")

    def test_the_practice_track_walks_its_own_rungs_and_keeps_its_floor(self) -> None:
        """
        F2a item 3, its track half: each practice rung after the first stands on the one before, so an
        option two practice rungs list is read where the track first meets it, and every practice rung
        keeps D21's three exercise options. Red on the build before F2a, where `practice.2` and
        `practice.4` were read as first listings of what `practice.1` and `practice.3` list.
        """
        for n in range(1, 6):
            rung = f"practice.{n}"
            with self.subTest(rung=rung):
                self.assertGreaterEqual(len(self.lessons[rung]["exerciseOptions"]), 3, f"{rung}: D21's three exercise options")
                if n > 1:
                    self.assertEqual(self.lessons[rung].get("prerequisites"), [f"practice.{n - 1}"])
        shared = {"practice.2": ("exercise.five-finger.c-major.right", "exercise.reading.steps-and-skips-c", "song.classical.ode-to-joy.rh"),
                  "practice.4": ("exercise.five-finger.c-major.both", "exercise.five-finger.c-major.right")}
        for rung, items in shared.items():
            with self.subTest(read_at=rung):
                rows = {o["item"]: o for o in self.report["options"] if o["rung"] == rung}
                self.assertEqual([i for i in items if rows[i]["earliest"]], [],
                                 f"{rung}: an option a practice rung it stands on lists is read there, not here")
                self.assertEqual([o["item"] for o in rows.values() if o["untaught"]], [], f"{rung}: nothing read untaught here")

    def test_the_practice_floor_stands_on_1_1_and_its_false_rows_are_gone(self) -> None:
        """
        F2b (the reviewer's required change on F2a, `responses/fc91e5a.md`, part 1): `practice.1` names 1.1,
        so the floor's path holds 1.1 and the track opens from the second rung of Stage 1. The report reads
        the five-finger pattern, *Hot Cross Buns* and *Ode to Joy* at 1.1, which lists them; the one row the
        floor read untaught, the steps-and-skips study's skips, is coped with since L120b by the note reading
        of right-hand C position, inside which the study lies (1.1 teaches it; 1.5 teaches the skip); and no practice
        rung reads a step untaught, since every one stands on 1.1. Red on the build before F2b, where the
        floor's path was Stage 0 and its five-finger, *Ode* and study rows read their steps as untaught.
        """
        self.assertEqual(self.lessons["practice.1"].get("prerequisites"), ["1.1"])
        rows = {o["item"]: o for o in self.report["options"] if o["rung"] == "practice.1"}
        for item_id in ("exercise.five-finger.c-major.right", "song.folk.hot-cross-buns", "song.classical.ode-to-joy.rh"):
            with self.subTest(read_at_1_1=item_id):
                self.assertFalse(rows[item_id]["earliest"], f"{item_id}: 1.1 lists it and practice.1 stands on 1.1")
        # Revised (L120b; the reviewer's Question 1 on L120a, `responses/0bcd3be0.md`; class: an assertion of the
        # reading being corrected). It held the steps-and-skips study's skips as the floor's one untaught row. The
        # study lies inside right-hand C position (C4-G4), which 1.1 teaches by note name and the floor stands on,
        # so before 1.5 its skips are coped with by that note reading: no practice.1 row reads anything untaught.
        self.assertEqual([(o["item"], o["untaught"]) for o in rows.values() if o["untaught"]], [],
                         "practice.1: the study's skips lie inside right-hand C position, taught at 1.1 (L120b)")
        stepped = [(o["rung"], o["item"]) for o in self.report["options"]
                   if o["rung"].startswith("practice.") and "interval.step" in o["untaught"]]
        self.assertEqual(stepped, [], "a practice rung reads a step untaught, though every one stands on 1.1")


if __name__ == "__main__":
    unittest.main()
