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
  list every unestablished claim, and report works, arrangements and coverage.

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
SOURCES = {"authored", "pdmx", "kern", "musetrainer", "generated", "runtime", "placeholder", "excerpt"}
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
                self.assertNotIn("stale", block, "approved on other parent bytes")
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
        """
        import claims
        import excerpts as X

        sharing = sorted(c for c, d in claims.CONCEPT_DEMANDS.items() if d == "texture.left-hand-pattern")
        report = X.candidate_rungs(self.catalog, self.curriculum)
        found = 0
        for row in report:
            for candidate in row["candidates"]:
                for claim in candidate["established"]:
                    if claim["kind"] == "demand" and claim["id"] == "texture.left-hand-pattern" and claim["from"].startswith("concept "):
                        found += 1
                        self.assertEqual(sorted(claim.get("sharedBy") or []), sharing, f"{row['item']} at {candidate['rung']}")
                    elif claim["id"] != "texture.left-hand-pattern":
                        self.assertNotIn("sharedBy", claim, f"{row['item']} at {candidate['rung']}: {claim['id']}")
        self.assertGreater(found, 0, "no candidate reached through the left-hand pattern to read")
        self.assertIn("one detector", X.candidate_rungs_markdown(report))

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
        untaught there (blues.5 teaches it, on another track, stored before jazz.5 in the file); the
        same option on blues.6, which builds on blues.5, is taught; and listed on both, it is read at
        both, since neither rung comes before the other on its path.
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
        self.assertIn("texture.walking-bass", coverage["blues.5"]["taught"])
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


if __name__ == "__main__":
    unittest.main()
