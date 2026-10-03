"""
The human review record (D2 items 2-5; R42, G29, Q41 cases 17 and 18).

Two layers in one file:

- **the contract, as cases** (`fixtures/review_cases.json`, read by `app/tests/unit/
  reviewRecord.test.ts` too): one dimension per event; current values per item and per
  dimension — a score reviewed from notation leaves teaching use null, a heard teaching-use
  event leaves the score review's value and basis alone, a later valid event supersedes an
  earlier one on the same identity and dimension (by time, not line order), a stale identity
  and a triage line fill neither bit; a malformed line refused with its line number; the
  merge idempotent, refusing an item or identity the catalogue does not have;
- **the build** (reads the built catalogue: run `python tools/content/build.py` first): the
  provenance's `reviewed` facts are the record's current decisions for every item (red first
  on a fixture with one decision, against the provenance step before D2), the rung-claims
  report's review column shows the teaching-use decision and its basis, the queue puts the
  music families' canonical items first and places every item once, and `--merge` and
  `--check` do what the brief says from the command line.

And the microscope's projection (D5; G55, G56), on the built data: a study carries the musical
gate's verdict — evaluated, passes, the total, the floor, the wrong cadences, the evaluator and
its contract version, and whether the verdict was carried from the build or recomputed by the
projection — while a groove keeps the contract's "not evaluated" words and a drill stays a drill;
two evaluator versions on the same item are told apart; and "requires but the notes lack" names
only the rules the recipe selects (`family_contracts.selected`), as the forbidden verdicts and the
secondary targets already do. The provenance line (G60) has nothing in the projection: the screen
reads the catalogue's facts, and `app/tests/unit/microscopeLines.test.ts` holds how it prints them.
"""
from __future__ import annotations

import copy
import io
import json
import sys
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import review  # noqa: E402

REPO = Path(__file__).resolve().parents[3]
BUILT = REPO / "app" / "public" / "content"
FIXTURES = Path(__file__).resolve().parent / "fixtures"
CASES = json.loads((FIXTURES / "review_cases.json").read_text(encoding="utf-8"))


def lines_of(events: list[dict]) -> str:
    return "\n".join(json.dumps(event, ensure_ascii=False) for event in events) + "\n"


def every_event() -> dict[str, dict]:
    out = {event["event"]: event for case in CASES["cases"] for event in case["record"]}
    out.update(CASES["changed"])
    return out


def summary(decided: dict | None) -> dict:
    decided = decided or {}
    return {d: ({"event": decided[d]["event"], "value": decided[d]["value"], "basis": decided[d]["basis"]}
                if d in decided else None) for d in review.DIMENSIONS}


class TestTheFieldsAreTheCases(unittest.TestCase):
    def test_one_vocabulary_for_both_implementations(self) -> None:
        fields = CASES["fields"]
        self.assertEqual(list(review.DIMENSIONS), fields["dimensions"])
        self.assertEqual(list(review.VALUES), fields["values"])
        self.assertEqual(list(review.BASES), fields["bases"])
        self.assertEqual({k: list(v) for k, v in review.CATEGORIES.items()}, fields["categories"])


class TestCurrentValues(unittest.TestCase):
    def test_every_case(self) -> None:
        identities = CASES["identities"]
        for case in CASES["cases"]:
            with self.subTest(case=case["name"]):
                events, errors = review.parse(lines_of(case["record"]))
                self.assertEqual(errors, [])
                decisions, status = review.resolve(events, identities)
                for item, expected in case["current"].items():
                    self.assertEqual(summary(decisions.get(item)), expected, item)
                for item, expected in case["bits"].items():
                    self.assertEqual(review.bits(decisions.get(item)), expected, item)
                self.assertEqual(status, case["status"])
                if "flags" in case:
                    self.assertEqual([e["event"] for e in review.flags(events, identities)], case["flags"])

    def test_the_fact_written_for_a_decision_carries_value_basis_date_and_event(self) -> None:
        event = CASES["cases"][1]["record"][1]
        self.assertEqual(review.reviewed_fact(event), {
            "kind": "reviewed", "via": "content/review/decisions.jsonl", "value": "yes", "basis": "heard",
            "date": "2026-09-27", "event": "ev-case2-b"})


class TestMalformedLines(unittest.TestCase):
    def test_refused_with_their_line_numbers(self) -> None:
        for case in CASES["malformed"]:
            with self.subTest(case=case["name"]):
                events, errors = review.parse("\n".join(case["lines"]) + "\n")
                self.assertEqual([number for number, _why in errors], case["errorLines"], errors)
                self.assertEqual([event["event"] for _n, _r, event in events], case["valid"])


class TestMerge(unittest.TestCase):
    def test_every_case(self) -> None:
        pool = every_event()
        identities = CASES["identities"]
        for case in CASES["merge"]:
            with self.subTest(case=case["name"]):
                existing, errors = review.parse(lines_of([pool[e] for e in case["existing"]]))
                self.assertEqual(errors, [])
                incoming = lines_of([pool[e] for e in case["incoming"]])
                result = review.merge_lines(existing, incoming, identities)
                self.assertEqual([event["event"] for _line, event in result["append"]], case["append"])
                refused_lines = [number for number, _why in result["refused"]]
                expected_refused = [case["incoming"].index(e) + 1 for e in case.get("refused", [])]
                self.assertEqual(refused_lines, expected_refused, result["refused"])
                if "rerunAppends" in case:
                    after, errors = review.parse(lines_of([pool[e] for e in case["existing"]]) +
                                                 "".join(line + "\n" for line, _event in result["append"]))
                    self.assertEqual(errors, [])
                    again = review.merge_lines(after, incoming, identities)
                    self.assertEqual([event["event"] for _line, event in again["append"]], case["rerunAppends"])
                    self.assertEqual(again["refused"], [])

    def test_the_command_is_idempotent_and_refuses_an_unknown_identity(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            content = Path(tmp) / "content"
            (content / "scores" / "authored").mkdir(parents=True)
            score = content / "scores" / "authored" / "tune.musicxml"
            score.write_bytes(b"<score-partwise/>\n")
            sha = review._sha256(score)
            catalog = [
                {"id": "song.test.tune", "file": "scores/authored/tune.musicxml", "tags": ["authored"]},
                {"id": "exercise.tumbao.c", "file": "scores/generated/exercise.tumbao.c.mxl", "hands": "left",
                 "tempoBpm": 88, "drill": {"kind": "tumbao", "params": {"key": "C", "offsets": [1.5, 3.0], "bars": 8},
                                           "generator": {"family": "tumbao", "version": 1, "seed": None}}},
            ]
            (content / "catalog.json").write_text(json.dumps(catalog), encoding="utf-8")
            (content / "curriculum.json").write_text("{}", encoding="utf-8")
            record = Path(tmp) / "decisions.jsonl"
            good = copy.deepcopy(CASES["cases"][0]["record"][0])
            on_file = {**copy.deepcopy(good), "event": "ev-cli-file", "item": "song.test.tune",
                       "identity": {"kind": "file", "sha256": sha}}
            stale = {**copy.deepcopy(on_file), "event": "ev-cli-stale", "identity": {"kind": "file", "sha256": "0" * 64}}
            exported = Path(tmp) / "export.jsonl"
            exported.write_text(lines_of([good, on_file, stale]), encoding="utf-8")
            out = io.StringIO()
            with redirect_stdout(out):
                code = review.main(["--merge", str(exported), "--record", str(record), "--content", str(content)])
            self.assertEqual(code, 1, out.getvalue())
            written = record.read_bytes()
            self.assertEqual([json.loads(l)["event"] for l in written.decode("utf-8").splitlines()], ["ev-case1-a", "ev-cli-file"])
            self.assertIn("line 3: refused", out.getvalue())
            self.assertIn("names an identity the catalogue does not have", out.getvalue())
            exported.write_text(lines_of([good, on_file]), encoding="utf-8")
            with redirect_stdout(io.StringIO()):
                again = review.main(["--merge", str(exported), "--record", str(record), "--content", str(content)])
            self.assertEqual(again, 0)
            self.assertEqual(record.read_bytes(), written, "a rerun appended to the record")

    def test_a_malformed_line_in_the_export_is_refused_with_its_line_number(self) -> None:
        existing: list = []
        text = lines_of([CASES["cases"][0]["record"][0]]) + "{not json\n"
        result = review.merge_lines(existing, text, CASES["identities"])
        self.assertEqual([n for n, _why in result["refused"]], [2])
        self.assertEqual(len(result["append"]), 1)


class TestTheBuildFillsTheReviewedFacts(unittest.TestCase):
    """Red first on the provenance step before D2, which wrote `null` for both bits always."""

    def test_a_fixture_with_one_decision(self) -> None:
        import build  # noqa: PLC0415

        entry = {
            "id": "exercise.tumbao.c", "type": "exercise", "file": "scores/generated/exercise.tumbao.c.mxl",
            "hands": "left", "tempoBpm": 88, "tags": ["generated"], "role": "canonical",
            "drill": {"kind": "tumbao", "params": {"key": "C", "offsets": [1.5, 3.0], "bars": 8},
                      "generator": {"family": "tumbao", "version": 1, "seed": None}},
            "measurement": {"status": "unmeasured", "reason": "a fixture"}, "demands": "unmeasured",
        }
        other = {**copy.deepcopy(entry), "id": "exercise.tumbao.d",
                 "drill": {"kind": "tumbao", "params": {"key": "D", "offsets": [1.5, 3.0], "bars": 8},
                           "generator": {"family": "tumbao", "version": 1, "seed": None}}}
        decision = CASES["cases"][0]["record"][0]
        with tempfile.TemporaryDirectory() as tmp:
            record = Path(tmp) / "decisions.jsonl"
            record.write_text(lines_of([decision]), encoding="utf-8")
            entries = [entry, other]
            # Called as the committed build calls it, so the red is the step's, not a signature's:
            # a generated item's identity needs no built file.
            with mock.patch.object(review, "RECORD", record):
                build.attach_provenance(entries)
        provenance = entries[0]["provenance"]
        self.assertEqual(provenance["review"], {"score": True, "teaching": None})
        self.assertEqual(provenance["facts"]["reviewedScore"]["kind"], "reviewed")
        self.assertEqual(provenance["facts"]["reviewedScore"]["basis"], "notation")
        self.assertEqual(provenance["facts"]["reviewedScore"]["date"], "2026-09-27")
        self.assertNotIn("reviewedTeaching", provenance["facts"])
        self.assertEqual(entries[1]["provenance"]["review"], {"score": None, "teaching": None})


class TestAStaleDecisionOnAnOlderCutAdmitsNothing(unittest.TestCase):
    """
    E1a item 3: an excerpt's identity is its cut file's sha256, so a teaching-use `yes` recorded on an
    earlier cut of the same definition — here the parent's file changed and the cut was rebuilt under
    the same id — resolves to nothing on the new cut: the build writes the bit `null` and no reviewed
    fact, and the app's one admission (`eligibility.admittedForTeaching`, which reads only the bit)
    refuses it (`eligibility.test.ts` › E1a, the app side). The same record over the old cut fills the
    bit: the decision is refused for its identity, not for being about an excerpt.
    """

    def test_a_yes_on_the_older_cut_leaves_the_rebuilt_cut_undecided(self) -> None:
        import build  # noqa: PLC0415
        import excerpts as X  # noqa: PLC0415
        from convert import write_mxl  # noqa: PLC0415
        from tests.test_excerpts import grand  # noqa: PLC0415

        eid = "excerpt.test.parent.b2-4"
        rel = f"scores/excerpts/{eid}.mxl"

        def entry() -> dict:
            return {"id": eid, "type": "excerpt", "excerptOf": "song.test.parent", "file": rel, "hands": "both",
                    "measurement": {"status": "unmeasured", "reason": "a fixture"}, "demands": "unmeasured"}

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            before, after = root / "parent-before.mxl", root / "parent-after.mxl"
            write_mxl(grand(6), before)
            write_mxl(grand(6, right_pitch=["C5", "D5", "E5", "G5"]), after)
            older, rebuilt = root / "older", root / "rebuilt"
            (older / "scores" / "excerpts").mkdir(parents=True)
            (rebuilt / "scores" / "excerpts").mkdir(parents=True)
            X.cut(before, 2, 4, "both", eid, older / rel)
            X.cut(after, 2, 4, "both", eid, rebuilt / rel)
            old_sha, new_sha = X.sha256_of(older / rel), X.sha256_of(rebuilt / rel)
            self.assertNotEqual(old_sha, new_sha, "the rebuilt cut is other bytes under the same id")

            yes = {"v": 1, "event": "ev-e1a-older-cut", "item": eid, "identity": {"kind": "file", "sha256": old_sha},
                   "dimension": "goodTeachingUse", "value": "yes", "basis": "heard", "category": "usefulness",
                   "reason": "a constructed decision on the older cut", "by": "A. Reviewer",
                   "at": "2026-09-28T10:00:00.000Z"}
            self.assertIsNone(review.event_fault(yes))
            record = root / "decisions.jsonl"
            record.write_text(lines_of([yes]), encoding="utf-8")

            on_older, on_rebuilt = [entry()], [entry()]
            with mock.patch.object(review, "RECORD", record):
                build.attach_provenance(on_older, older)
                build.attach_provenance(on_rebuilt, rebuilt)
            events, errors = review.read_record(record)
            self.assertEqual(errors, [])
            _, status = review.resolve(events, review.identities(on_rebuilt, rebuilt))

        # Over the cut it was made on, the yes is current: the bit true and its fact written.
        self.assertIs(on_older[0]["provenance"]["review"]["teaching"], True)
        self.assertEqual(on_older[0]["provenance"]["facts"]["reviewedTeaching"]["event"], "ev-e1a-older-cut")
        # Over the rebuilt cut it is stale: the bit null, no reviewed fact, nothing admitted.
        self.assertEqual(status["ev-e1a-older-cut"], "stale")
        self.assertEqual(on_rebuilt[0]["provenance"]["review"], {"score": None, "teaching": None})
        self.assertNotIn("reviewedTeaching", on_rebuilt[0]["provenance"]["facts"])
        self.assertEqual(on_rebuilt[0]["provenance"]["source"], "excerpt")


def built(name: str | Path, root: Path = BUILT):
    path = root / name
    if not path.is_file():
        raise AssertionError(f"{path} is missing, and this test reads the built content: run "
                             "`python tools/content/build.py` first (CI: the step 'Build content')")
    return json.loads(path.read_text(encoding="utf-8"))


class Built(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.catalog = built("catalog.json")
        cls.curriculum = built("curriculum.json")
        cls.by_id = {item["id"]: item for item in cls.catalog}
        cls.events, cls.errors = review.read_record()
        cls.current = review.identities(cls.catalog, BUILT)
        cls.decisions, cls.status = review.resolve(cls.events, cls.current)


class TestTheBuiltCatalogueIsTheRecord(Built):
    def test_the_record_is_well_formed(self) -> None:
        self.assertEqual(self.errors, [])
        self.assertNotIn("unknown-item", self.status.values(), "an event on an item the catalogue does not have")

    def test_every_item_s_reviewed_facts_are_its_current_decisions(self) -> None:
        for item in self.catalog:
            with self.subTest(item=item["id"]):
                decided = self.decisions.get(item["id"], {})
                provenance = item["provenance"]
                self.assertEqual(provenance["review"], review.bits(decided))
                for dimension in review.DIMENSIONS:
                    fact = provenance["facts"].get(review.FACT[dimension])
                    if dimension in decided:
                        self.assertEqual(fact, review.reviewed_fact(decided[dimension]))
                    else:
                        self.assertIsNone(fact)
                if provenance.get("quarryKeep"):
                    # A quarry keep never fills a bit by itself: only the record does (Part 12 §14).
                    self.assertEqual(provenance["review"], review.bits(decided))


class TestTheReportShowsTheTeachingUseDecision(Built):
    def test_the_review_column(self) -> None:
        report = json.loads((REPO / "build" / "rung-claims.json").read_text(encoding="utf-8"))
        markdown = (REPO / "docs" / "prompts" / "rung-claims.md").read_text(encoding="utf-8")
        import claims  # noqa: PLC0415

        for option in report["options"]:
            with self.subTest(option=f"{option['item']} on {option['rung']}"):
                decided = self.decisions.get(option["item"], {}).get("goodTeachingUse")
                self.assertEqual(option["review"], review.bits(self.decisions.get(option["item"])))
                self.assertEqual(option.get("teachingReview"),
                                 {"value": decided["value"], "basis": decided["basis"]} if decided else None)
                if option["rung"] in claims.PRIORITY:
                    row = next(line for line in markdown.splitlines() if f"(`{option['item']}`)" in line
                               and line.startswith("|"))
                    self.assertTrue(row.rstrip().endswith(f"| {claims.review_words(option)} |"), row)


class TestTheQueue(Built):
    @classmethod
    def setUpClass(cls) -> None:
        super().setUpClass()
        import claims  # noqa: PLC0415

        cls.report = claims.rung_claims(cls.catalog, cls.curriculum)
        cls.tiers = review.queue(cls.catalog, cls.report)

    def test_every_item_once(self) -> None:
        placed = [item for tier in self.tiers for item in tier["items"]]
        self.assertEqual(len(placed), len(set(placed)))
        self.assertEqual(set(placed), set(self.by_id))

    def test_the_music_families_canonical_items_come_first(self) -> None:
        import family_contracts as FC  # noqa: PLC0415

        first = self.tiers[0]
        self.assertEqual(first["id"], "music")
        families = set()
        for item_id in first["items"]:
            item = self.by_id[item_id]
            family = item["drill"]["generator"]["family"]
            families.add(family)
            self.assertEqual(item["role"], "canonical")
            self.assertEqual(review.promise_of(FC.contract(family), FC.recipe_of(item)), "music")
        music = {f for f, row in FC.contracts().items() if row["promise"][-1]["promise"] == "music"}
        # Revised (D3; the old assumption: the music families are D0's fourteen): D0's fourteen and
        # the generated study, whose six canonical items the tier takes by the same rule.
        self.assertEqual(len(music), 15)
        self.assertIn("study", music)
        self.assertLessEqual(music, families, "a music family with no canonical item in the first tier")

    def test_then_the_not_judged_families_then_the_unmeasurable_claims(self) -> None:
        import family_contracts as FC  # noqa: PLC0415

        self.assertEqual([t["id"] for t in self.tiers], ["music", "not-judged", "unmeasurable", "rest"])
        not_judged = {f for f, row in FC.contracts().items() if not row["target"]["primary"]}
        self.assertEqual(len(not_judged), 38)
        seen = {self.by_id[i]["drill"]["generator"]["family"] for i in self.tiers[1]["items"]}
        music_first = {self.by_id[i]["drill"]["generator"]["family"] for i in self.tiers[0]["items"]}
        # `intro` and `modal_vamp` promise music and are not judged: met in the first tier.
        self.assertEqual(not_judged - music_first, seen, "a not-judged family missing from the second tier")
        for item_id in self.tiers[1]["items"]:
            item = self.by_id[item_id]
            family = item["drill"]["generator"]["family"]
            has_canonical = any(e.get("role") == "canonical" and (e.get("drill") or {}).get("generator", {}).get("family") == family
                                for e in self.catalog)
            if has_canonical:
                self.assertEqual(item["role"], "canonical", item_id)
        unmeasurable = {r["rung"] for r in self.report["rungs"] if r["unmeasurable"]}
        listed = {o["item"] for o in self.report["options"] if o["rung"] in unmeasurable and o["item"] in self.by_id}
        self.assertEqual(set(self.tiers[2]["items"]), listed - set(self.tiers[0]["items"]) - set(self.tiers[1]["items"]))

    def test_the_screen_reads_the_same_queue(self) -> None:
        # Beside the built content, in the builder-only root, not inside it (D2a).
        data = built(review.MICROSCOPE_FILE, review.dev_root(BUILT))
        self.assertEqual(data["queue"], self.tiers)
        self.assertEqual(set(data["items"]), set(self.by_id))
        for item_id, item in data["items"].items():
            self.assertEqual(item["identity"], self.current[item_id], item_id)


#: One study, one groove and one drill, as the entry walks them (D5): the 2.1 interval-reading
#: study (the one D3 walked), the son-clave groove `microscope.spec.ts` opens, and a right-hand
#: interval drill, whose family requires the bass clef only of a left-hand recipe.
STUDY = "exercise.study.interval-reading.c-major.4-4.8bar.sustained.01"
GROOVE = "exercise.latin-groove.c.son-3-2"
DRILL = "exercise.interval-reading.c-position.right.01"


def family_of(entry: dict) -> str | None:
    return (((entry.get("drill") or {}).get("generator")) or {}).get("family")


class Projected(Built):
    @classmethod
    def setUpClass(cls) -> None:
        super().setUpClass()
        cls.data = built(review.MICROSCOPE_FILE, review.dev_root(BUILT))
        cls.generated = [e for e in cls.catalog if family_of(e) in cls.data["families"]]


class TestTheMicroscopesMusicalLine(Projected):
    """G55: the gate's verdict where the gate evaluates, the contract's words where it does not."""

    def test_every_study_carries_the_gate_s_verdict_its_numbers_its_version_and_its_source(self) -> None:
        import family_contracts as FC  # noqa: PLC0415
        import musical_evaluator as ME  # noqa: PLC0415

        row = FC.contract("study")
        studies = [e for e in self.generated if family_of(e) == "study"]
        self.assertEqual(len(studies), 24)
        for entry in studies:
            with self.subTest(item=entry["id"]):
                verdict = self.data["items"][entry["id"]]["musical"]
                self.assertIs(verdict["applies"], True)
                self.assertIs(verdict["evaluated"], True)
                self.assertIs(verdict["passes"], True, verdict.get("why"))
                self.assertEqual(verdict["wrong"], [])
                self.assertEqual(verdict["floor"], row["musical"]["floor"])
                self.assertEqual(verdict["evaluator"], row["musical"]["evaluator"])
                self.assertEqual(verdict["version"], ME.VERSION)
                # No build step persists the gate's verdict on the item at this commit
                # (`confirm_musical` raises or passes), so every one is the projection's.
                self.assertNotIn("verdict", entry["drill"]["study"])
                self.assertEqual(verdict["source"], "recomputed")
                # The page the projection read is the candidate the realiser chose and scored.
                self.assertAlmostEqual(verdict["total"], entry["drill"]["study"]["chosen"]["score"], places=3)
                self.assertIn(f"{verdict['total']:.3f} against the floor {verdict['floor']}", verdict["why"])

    def test_the_verdict_is_the_gate_s_own_on_the_built_notes(self) -> None:
        import family_contracts as FC  # noqa: PLC0415
        from music21 import converter  # noqa: PLC0415

        entry = self.by_id[STUDY]
        gate = FC.musical_gate(FC.contract("study"), converter.parse(str(BUILT / entry["file"])), entry)
        verdict = self.data["items"][STUDY]["musical"]
        for key in ("applies", "evaluated", "passes", "total", "parts", "wrong", "floor", "why"):
            self.assertEqual(verdict[key], gate[key], key)

    def test_a_groove_is_not_evaluated_in_the_contract_s_words(self) -> None:
        import family_contracts as FC  # noqa: PLC0415

        verdict = self.data["items"][GROOVE]["musical"]
        gate = FC.musical_gate(FC.contract("latin_groove"), None, self.by_id[GROOVE])
        self.assertEqual(verdict, gate)
        self.assertEqual(verdict["evaluated"], False)
        self.assertIn("the evaluator judges phrase shape, not idiom", verdict["why"])
        self.assertNotIn("no musical evaluator exists", verdict["why"])
        for key in ("total", "version", "source"):
            self.assertNotIn(key, verdict)

    def test_a_drill_is_judged_as_a_drill_and_the_promise_is_read_per_recipe(self) -> None:
        self.assertEqual(self.data["items"][DRILL]["musical"]["applies"], False)
        # The meter family: a drill in 5/4, music (and not evaluated) in 12/8.
        self.assertEqual(self.data["items"]["exercise.meter.5-4"]["musical"]["applies"], False)
        twelve = self.data["items"]["exercise.meter.12-8"]["musical"]
        self.assertEqual((twelve["applies"], twelve["evaluated"]), (True, False))
        for entry in self.generated:
            with self.subTest(item=entry["id"]):
                facts = self.data["items"][entry["id"]]
                self.assertEqual(facts["musical"]["applies"], facts["promise"] == "music")

    def test_two_evaluator_versions_on_the_same_item_are_told_apart(self) -> None:
        import family_contracts as FC  # noqa: PLC0415
        import musical_evaluator as ME  # noqa: PLC0415

        row = FC.contract("study")
        entry = copy.deepcopy(self.by_id[STUDY])
        current = review.musical_verdict(entry, row, BUILT)
        self.assertEqual((current["source"], current["version"]), ("recomputed", ME.VERSION))
        self.assertEqual(self.data["evaluator"], {"name": row["musical"]["evaluator"], "version": ME.VERSION})
        # The same item, carrying a verdict an earlier evaluator wrote: carried with its own
        # version and numbers, never presented as the current evaluator's.
        older = {key: value for key, value in current.items() if key != "source"}
        older.update(version=ME.VERSION - 1, total=0.85, why="phrase shape 0.850 against the floor 0.8 (notation, not hearing; unheard)")
        entry["drill"]["study"]["verdict"] = older
        carried = review.musical_verdict(entry, row, None)
        self.assertEqual((carried["source"], carried["version"], carried["total"]), ("carried", ME.VERSION - 1, 0.85))
        self.assertNotEqual(carried["version"], current["version"])
        # A verdict carried at the current version is carried, and nothing is recomputed:
        # there are no built notes to read here.
        entry["drill"]["study"]["verdict"] = {key: value for key, value in current.items() if key != "source"}
        self.assertEqual(review.musical_verdict(entry, row, None), {**current, "source": "carried"})

    def test_without_the_built_notes_or_a_carried_verdict_it_says_so(self) -> None:
        import family_contracts as FC  # noqa: PLC0415

        verdict = review.musical_verdict(copy.deepcopy(self.by_id[STUDY]), FC.contract("study"), None)
        self.assertEqual((verdict["applies"], verdict["evaluated"]), (True, False))
        self.assertEqual(verdict["why"], "evaluated at build: verdict not carried")
        self.assertNotIn("total", verdict)


class TestTheMicroscopesContractWarning(Projected):
    """G56: "requires but the notes lack" names only the requirements the recipe selects."""

    def test_the_warning_is_the_selected_requirements_the_notes_lack_on_every_item(self) -> None:
        import family_contracts as FC  # noqa: PLC0415

        for entry in self.generated:
            with self.subTest(item=entry["id"]):
                row = FC.contract(family_of(entry))
                recipe = FC.recipe_of(entry)
                facts = self.data["items"][entry["id"]]
                selected = list(dict.fromkeys(r["demand"] for r in FC.selected(row.get("requires"), recipe)))
                have = {one["demand"] for one in facts["demands"]}
                self.assertEqual(facts["requires"], selected)
                self.assertEqual(facts["missing"], [d for d in selected if d not in have])
        # The rules that selected nothing on the three items walked (the old warning's words).
        self.assertEqual(self.data["items"][STUDY]["missing"], [])
        for demand in ("range.beyond-position", "rhythm.eighths", "rhythm.syncopation", "metre.compound"):
            self.assertNotIn(demand, self.data["items"][STUDY]["requires"])
        self.assertNotIn("clef.bass", self.data["items"][DRILL]["requires"])
        self.assertEqual(self.data["items"][DRILL]["missing"], [])

    def test_a_study_whose_recipe_selects_one_of_two_conditional_requirements(self) -> None:
        # A subdivision study selects `rhythm.eighths` and not `rhythm.syncopation`; with both
        # taken out of its measured demands, only the selected one is named.
        entry = copy.deepcopy(self.by_id["exercise.study.subdivision.c-major.4-4.8bar.sustained.01"])
        entry["demands"] = [d for d in entry["demands"] if d not in ("rhythm.eighths", "rhythm.syncopation")]
        warning = review.contract_warning(entry)
        self.assertIn("rhythm.eighths", warning["missing"])
        self.assertNotIn("rhythm.syncopation", warning["missing"])
        self.assertNotIn("rhythm.syncopation", warning["requires"])

    def test_forbidden_verdicts_and_secondary_targets_follow_the_recipe(self) -> None:
        import family_contracts as FC  # noqa: PLC0415

        for entry in self.generated:
            with self.subTest(item=entry["id"]):
                row = FC.contract(family_of(entry))
                recipe = FC.recipe_of(entry)
                facts = self.data["items"][entry["id"]]
                forbids = {r["demand"] for r in FC.selected(row.get("forbids"), recipe)}
                for one in facts["demands"]:
                    if one["verdict"] == "forbidden":
                        self.assertIn(one["demand"], forbids)
                self.assertEqual(facts["target"]["secondary"], FC.target_skills(row, recipe)[1:])
        # A syncopation study's syncopation is what it requires, never what the other targets forbid.
        syncopation = self.data["items"]["exercise.study.syncopation.c-major.4-4.8bar.broken.01"]
        verdicts = {one["demand"]: one["verdict"] for one in syncopation["demands"]}
        self.assertEqual(verdicts["rhythm.syncopation"], "required")
        # Hand independence is a secondary target only of a study whose left hand is a pattern.
        self.assertNotIn("hand-independence", self.data["items"][STUDY]["target"]["secondary"])
        self.assertIn("hand-independence", syncopation["target"]["secondary"])


class TestCheck(Built):
    def test_check_lists_the_queue_music_families_first_and_passes_a_sound_record(self) -> None:
        out = io.StringIO()
        with redirect_stdout(out):
            code = review.main(["--check", "--content", str(BUILT), "--show", "3"])
        text = out.getvalue()
        self.assertEqual(code, 0, text)
        self.assertLess(text.index("1. The music families"), text.index("2. The families the app cannot judge"))


if __name__ == "__main__":  # pragma: no cover
    unittest.main()
