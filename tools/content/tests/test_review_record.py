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
        self.assertEqual(len(music), 14)
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
