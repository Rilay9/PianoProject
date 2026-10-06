"""The chain-record checker (FABLE.md section 3): the real record, and one record broken per rule.

`tools/content/check_chains.py` reads `docs/chains/*.yaml`. The first record is A7c.1, the Bizet
habanera chain, a `draft` whose unresolved refs the checker lists. Each rule is shown on a copy of that
record broken in that one way, and fails naming the field; the copy is checked in memory, never written
into `docs/chains/`. The brief lint is shown on a small tree of briefs under the repository's gitignored
`build/`, and on the probe brief itself.

Run: `py -3.11 -m unittest tools.content.tests.test_check_chains`
"""
from __future__ import annotations

import io
import shutil
import sys
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "tools" / "content"))

import check_chains as cc  # noqa: E402

RECORD = ROOT / "docs" / "chains" / "A7c.1.yaml"
PROBE = ROOT / "docs/prompts/runs/curriculum-review-2026-10-05/briefs/probe-latin4-bizet.md"
SCRATCH = ROOT / "build" / "test_check_chains"
CUT = "excerpt.classical.bizet-l-amour-est-un-oiseau-rebelle.pdmx.b1-12.lh"
LESSON = "content/lessons/latin.4.md"

RESOLVER = cc.Resolver(ROOT)
TOOLS, SHEET_PROBLEMS = cc.vocabulary(ROOT)


def load() -> dict:
    return yaml.safe_load(RECORD.read_text(encoding="utf-8"))


def check(rec: dict, name: str = "broken.yaml"):
    return cc.check_record(rec, name, RESOLVER, TOOLS, ROOT)


def fields(failures) -> list[str]:
    return [f.field for f in failures]


def run_main(*argv: str) -> tuple[int, str]:
    out = io.StringIO()
    with redirect_stdout(out):
        code = cc.main(list(argv))
    return code, out.getvalue()


class TheRealRecord(unittest.TestCase):
    def test_passes_as_a_draft_and_lists_exactly_its_unresolved_refs(self):
        failures, unresolved, status = cc.check_file(RECORD, RESOLVER, TOOLS, ROOT)
        self.assertEqual([f.line() for f in failures], [])
        self.assertEqual(status, "draft")
        listed = {u.ref for u in unresolved}
        # what is not yet committed: the lesson file of the new rung, and the excerpt cut the intake adds.
        # Each is expected unresolved exactly while the thing it names is absent.
        expected = set()
        if not (ROOT / LESSON).exists():
            expected.add(LESSON)
        if CUT not in RESOLVER.excerpt_ids:
            expected.add(CUT)
        self.assertEqual(listed, expected)
        self.assertEqual({u.file for u in unresolved}, {"docs/chains/A7c.1.yaml"} if unresolved else set())
        # every occurrence is listed with its field, not just each distinct ref
        rec = load()
        occurrences = sum(1 for s in rec["steps"] if s["content"]["ref"] in expected)
        self.assertEqual(len(unresolved), occurrences)

    def test_what_the_record_cites_resolves(self):
        rec = load()
        for ref, kind in (
            ("exercise.tresillo.c", "generated"),
            ("exercise.tresillo.f", "generated"),
            ("exercise.tresillo.g", "generated"),
            ("song.classical.bizet-l-amour-est-un-oiseau-rebelle.pdmx@bars=1-12", "piece"),
            ("song.jazz.the-crave@bars=21-26", "piece"),
            ("song.folk.por-una-cabeza-carlos-gardel.pdmx@bars=1-14", "piece"),
            ("tresillo", None),
            (rec["generated"][0]["contract"], None),
        ):
            with self.subTest(ref=ref):
                self.assertEqual(RESOLVER.resolve(ref, kind), (True, ""))

    def test_the_cli_exits_zero_on_the_real_tree_and_names_the_draft(self):
        code, out = run_main("--lint-briefs")
        self.assertEqual(code, 0, out)
        self.assertIn("A7c.1 (draft)", out)
        self.assertIn("0 failure(s)", out)

    def test_the_first_record_uses_a_scaffold_token_the_last_step_shares_with_the_first(self):
        rec = load()
        self.assertLess(
            {x.casefold() for x in rec["steps"][-1]["scaffold"]}, {x.casefold() for x in rec["steps"][0]["scaffold"]}
        )


class TheToolVocabulary(unittest.TestCase):
    def test_every_named_section_is_in_the_sheet(self):
        self.assertEqual([p.line() for p in SHEET_PROBLEMS], [])
        headings = cc.sheet_headings(ROOT)
        for section in [str(n) for n in range(1, 31)] + ["7a", "7b"]:
            self.assertIn(section, headings)
            self.assertIn(section, cc.SECTION_NAMES)

    def test_the_vocabulary_holds_the_sheets_words_and_one_extra(self):
        for name in ("Keep tempo", "Wait for me", "Hear it", "Rhythm only", "Loop", "Ladder", "Duet", "Blind", "Perform", "Simon"):
            self.assertIn(cc.norm_tool(name), TOOLS, name)
        self.assertIn(cc.norm_tool("Score: Keep tempo"), TOOLS)
        self.assertIn("lesson", TOOLS)
        self.assertEqual(set(cc.EXTRA_TOOLS), {"lesson"})
        self.assertNotIn("magic wand", TOOLS)

    def test_a_sheet_that_loses_a_name_is_a_failure(self):
        tree = Tree()
        self.addCleanup(tree.cleanup)
        sheet = tree.root / cc.MODE_SHEET
        sheet.parent.mkdir(parents=True)
        shutil.copy(ROOT / cc.MODE_SHEET, sheet)
        text = sheet.read_text(encoding="utf-8").replace("## 11. Loop", "## 11. Repeat")
        sheet.write_text(text, encoding="utf-8")
        _, problems = cc.vocabulary(tree.root)
        self.assertTrue(any(p.field == "section 11" and "Loop" in p.message for p in problems), [p.line() for p in problems])

    def test_tools_flag_prints_the_vocabulary(self):
        code, out = run_main("--tools")
        self.assertEqual(code, 0)
        self.assertIn(f"{len(TOOLS)} tool names", out)
        self.assertIn("Keep tempo", out)


class EachRuleFailsOnItsOwn(unittest.TestCase):
    def test_a_broken_copy_of_nothing_else_is_clean(self):
        failures, _ = check(load())
        self.assertEqual(fields(failures), [])

    # R1 -------------------------------------------------------------------------------
    def test_r1_a_missing_top_level_field(self):
        rec = load()
        del rec["learner_cannot"]
        failures, _ = check(rec)
        self.assertEqual(fields(failures), ["learner_cannot"])

    def test_r1_a_missing_step_field_names_the_step(self):
        rec = load()
        del rec["steps"][2]["feedback"]
        rec["steps"][4]["cannot_establish"] = ""
        failures, _ = check(rec)
        self.assertEqual(sorted(fields(failures)), ["steps[3].feedback", "steps[5].cannot_establish"])

    def test_r1_a_missing_evidence_key_a_missing_route_half_and_a_bad_status(self):
        rec = load()
        del rec["evidence"]["updates"]
        del rec["failure_routes"][1]["next"]
        rec["status"] = "finished"
        failures, _ = check(rec)
        self.assertEqual(sorted(fields(failures)), ["evidence.updates", "failure_routes[2].next", "status"])

    def test_r1_a_content_without_a_kind_or_ref(self):
        rec = load()
        rec["steps"][1]["content"] = {"ref": "exercise.tresillo.c"}
        rec["steps"][2]["content"] = {"kind": "excerpt"}
        failures, _ = check(rec)
        self.assertEqual(sorted(fields(failures)), ["steps[2].content.kind", "steps[3].content.ref"])

    # R2 -------------------------------------------------------------------------------
    def test_r2_a_tool_the_sheet_does_not_name(self):
        rec = load()
        rec["steps"][3]["tool"] = "Magic wand"
        failures, _ = check(rec)
        self.assertEqual(fields(failures), ["steps[4].tool"])
        self.assertIn("Magic wand", failures[0].message)

    def test_r2_a_missing_tool_and_a_tool_written_with_its_screen_prefix(self):
        rec = load()
        rec["steps"][3]["tool"] = "Score: Rhythm only"
        del rec["steps"][4]["tool"]
        failures, _ = check(rec)
        self.assertEqual(fields(failures), ["steps[5].tool"])

    # R3 -------------------------------------------------------------------------------
    def test_r3_an_unresolved_ref_fails_a_reviewed_record_and_is_only_listed_in_a_draft(self):
        rec = load()
        rec["steps"][1]["content"]["ref"] = "exercise.tresillo.zz"
        draft_failures, draft_listed = check(rec)
        self.assertEqual(draft_failures, [])
        self.assertIn("exercise.tresillo.zz", {u.ref for u in draft_listed})
        rec["status"] = "reviewed"
        failures, listed = check(rec)
        self.assertEqual(listed, [])
        self.assertIn("steps[2].content.ref", fields(failures))
        # the cut and the lesson file are unresolved too, until the intake and the lesson land; the
        # point is that every unresolved ref now fails, and nothing else does
        self.assertEqual({f.field for f in failures if not f.field.endswith("content.ref")}, set())

    def test_r3_a_ref_that_resolves_never_fails_a_reviewed_record(self):
        rec = load()
        for step in rec["steps"]:
            if step["content"]["ref"] in (LESSON, CUT):
                step["content"]["ref"] = "exercise.tresillo.c"
                step["content"]["kind"] = "generated"
        rec["status"] = "reviewed"
        failures, listed = check(rec)
        self.assertEqual(fields(failures), [])
        self.assertEqual(listed, [])

    def test_r3_the_kinds_of_ref(self):
        good = [
            ("docs/prompts/FABLE.md", None),
            ("docs/prompts/FABLE.md#3", None),
            ("song.jazz.the-crave", None),
            ("QmNswaWYXpxK1XegKbJVDULwZMjKN6cETGTVfXQKYsYrzs@bars=1-14", "excerpt"),
            ("tresillo", "generated"),
            ("https://example.org/a-book", "external"),
        ]
        bad = [
            ("docs/prompts/NOPE.md", None),
            ("docs/prompts/FABLE.md#Nowhere-Such-Heading", None),
            ("song.jazz.the-crave@bars=21-900", None),
            ("song.jazz.the-crave@bars=26-21", None),
            ("song.jazz.the-crave@bars=x", None),
            ("tresillo@bars=1-2", None),
            ("https://example.org/a-book", "piece"),
            ("exercise.tresillo.zz", None),
            ("", None),
        ]
        for ref, kind in good:
            with self.subTest(good=ref):
                self.assertTrue(RESOLVER.resolve(ref, kind)[0], RESOLVER.resolve(ref, kind))
        for ref, kind in bad:
            with self.subTest(bad=ref):
                self.assertFalse(RESOLVER.resolve(ref, kind)[0])

    def test_r3_a_path_cannot_leave_the_tree(self):
        self.assertFalse(RESOLVER.resolve("../../../../Windows/win.ini")[0])

    # R4 -------------------------------------------------------------------------------
    def test_r4_a_step_that_removes_nothing_and_gives_no_reason(self):
        rec = load()
        step = rec["steps"][2]
        self.assertEqual(step["removes"], [])
        del step["no_removal_reason"]
        failures, _ = check(rec)
        self.assertEqual(fields(failures), ["steps[3].removes"])

    def test_r4_a_reason_or_a_removal_each_satisfy_it_and_the_first_step_is_exempt(self):
        rec = load()
        self.assertEqual(rec["steps"][0]["removes"], [])  # the first step needs neither
        rec["steps"][2]["removes"] = ["app plays it"]
        del rec["steps"][2]["no_removal_reason"]
        failures, _ = check(rec)
        self.assertEqual(fields(failures), [])

    # R5 -------------------------------------------------------------------------------
    def test_r5_a_last_scaffold_with_an_item_the_first_lacks(self):
        rec = load()
        rec["steps"][-1]["scaffold"] = ["notation", "metronome"]
        failures, _ = check(rec)
        self.assertEqual(fields(failures), [f"steps[{len(rec['steps'])}].scaffold"])
        self.assertIn("metronome", failures[0].message)

    def test_r5_a_last_scaffold_equal_to_the_first_is_not_strict(self):
        rec = load()
        rec["steps"][-1]["scaffold"] = list(rec["steps"][0]["scaffold"])
        failures, _ = check(rec)
        self.assertEqual(fields(failures), [f"steps[{len(rec['steps'])}].scaffold"])
        self.assertIn("equals", failures[0].message)

    def test_r5_wording_is_compared_after_trimming_and_lower_casing_only(self):
        rec = load()
        rec["steps"][-1]["scaffold"] = ["  NOTATION "]
        self.assertEqual(fields(check(rec)[0]), [])
        rec["steps"][-1]["scaffold"] = ["the notation"]
        self.assertEqual(fields(check(rec)[0]), [f"steps[{len(rec['steps'])}].scaffold"])

    # R6 -------------------------------------------------------------------------------
    def test_r6_an_empty_never_credits(self):
        rec = load()
        rec["evidence"]["never_credits"] = []
        failures, _ = check(rec)
        self.assertEqual(fields(failures), ["evidence.never_credits"])

    # R7 -------------------------------------------------------------------------------
    def test_r7_a_generated_family_without_its_job_contract_or_checker(self):
        for key in ("job", "contract", "checker"):
            with self.subTest(missing=key):
                rec = load()
                del rec["generated"][0][key]
                failures, _ = check(rec)
                self.assertEqual(fields(failures), [f"generated[1].{key}"])

    def test_r7_a_job_outside_the_four(self):
        rec = load()
        rec["generated"][0]["job"] = "TASTE"
        failures, _ = check(rec)
        self.assertEqual(fields(failures), ["generated[1].job"])

    def test_r7_a_musical_family_with_a_property_neither_established_nor_unknown(self):
        rec = load()
        entry = rec["generated"][0]
        entry["job"] = "MUSICAL"
        entry["musical_properties"] = {"phrase structure": "", "cadence": "TBD", "contour": "unknown", "voice leading": None}
        failures, _ = check(rec)
        self.assertEqual(
            sorted(fields(failures)),
            sorted(f"generated[1].musical_properties.{p}" for p in ("phrase structure", "cadence", "contour", "voice leading")),
        )

    def test_r7_unknown_and_a_named_method_are_both_legal(self):
        rec = load()
        entry = rec["generated"][0]
        entry["job"] = "MUSICAL"
        entry["musical_properties"] = {"cadence": "UNKNOWN", "contour": "music21 contour reversals against the reference set"}
        self.assertEqual(fields(check(rec)[0]), [])

    def test_r7_a_musical_or_sight_reading_family_lists_properties(self):
        for job in ("MUSICAL", "SIGHT-READING"):
            with self.subTest(job=job):
                rec = load()
                rec["generated"][0]["job"] = job
                rec["generated"][0]["musical_properties"] = {}
                failures, _ = check(rec)
                self.assertEqual(fields(failures), ["generated[1].musical_properties"])

    def test_r7_a_control_family_may_list_none_and_a_named_pattern_is_checked_where_it_lists(self):
        rec = load()
        rec["generated"][0]["job"] = "CONTROL"
        rec["generated"][0]["musical_properties"] = {}
        self.assertEqual(fields(check(rec)[0]), [])
        rec["generated"][0]["job"] = "NAMED-PATTERN"
        rec["generated"][0]["musical_properties"] = {"onset set": ""}
        self.assertEqual(fields(check(rec)[0]), ["generated[1].musical_properties.onset set"])

    def test_r7_a_generated_ref_that_does_not_resolve_is_listed_in_a_draft(self):
        rec = load()
        rec["generated"][0]["family"] = "no_such_family"
        failures, listed = check(rec)
        self.assertEqual(failures, [])
        self.assertIn("generated[1].family", {u.field for u in listed})

    # R8 -------------------------------------------------------------------------------
    def test_r8_shipped_without_an_acceptance_path(self):
        rec = load()
        rec["status"] = "shipped"
        failures, _ = check(rec)
        self.assertIn("acceptance_test", fields(failures))

    def test_r8_shipped_with_a_path_that_does_not_exist(self):
        rec = load()
        rec["status"] = "shipped"
        rec["acceptance_test"] = "app/tests/e2e/no-such-spec.ts"
        failures, _ = check(rec)
        acceptance = [f for f in failures if f.field == "acceptance_test"]
        self.assertEqual(len(acceptance), 1)
        self.assertIn("does not exist", acceptance[0].message)

    def test_r8_shipped_with_a_path_that_exists_passes_that_rule(self):
        rec = load()
        rec["status"] = "shipped"
        rec["acceptance_test"] = "tools/content/tests/test_check_chains.py"
        failures, _ = check(rec)
        self.assertNotIn("acceptance_test", fields(failures))

    def test_a_draft_needs_no_acceptance_path(self):
        rec = load()
        rec.pop("acceptance_test", None)
        self.assertEqual(fields(check(rec)[0]), [])

    def test_a_file_that_is_not_yaml_or_not_a_mapping_fails_by_file(self):
        tree = Tree()
        self.addCleanup(tree.cleanup)
        bad = tree.write("docs/chains/not-yaml.yaml", "ability: [unclosed\n")
        failures, _, _ = cc.check_file(bad, RESOLVER, TOOLS, tree.root)
        self.assertEqual(fields(failures), ["(file)"])
        listy = tree.write("docs/chains/list.yaml", "- a\n- b\n")
        failures, _, _ = cc.check_file(listy, RESOLVER, TOOLS, tree.root)
        self.assertEqual(fields(failures), ["(record)"])


class Tree:
    """A small tree under the repository's gitignored build/, for the command line and the lint."""

    def __init__(self) -> None:
        SCRATCH.mkdir(parents=True, exist_ok=True)
        self._tmp = tempfile.TemporaryDirectory(dir=SCRATCH)
        self.root = Path(self._tmp.name)

    def write(self, rel: str, text: str) -> Path:
        path = self.root / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")
        return path

    def cleanup(self) -> None:
        self._tmp.cleanup()


def brief(*headings: str, names_record: bool = True) -> str:
    lines = ["# A brief", ""]
    if names_record:
        lines += ["Chain record: `docs/chains/A7c.1.yaml`", ""]
    for heading in headings:
        lines += [f"### {heading}", "", "text", ""]
    return "\n".join(lines)


class TheBriefLint(unittest.TestCase):
    def setUp(self):
        self.tree = Tree()
        self.addCleanup(self.tree.cleanup)

    def lint(self, **briefs: str):
        for name, text in briefs.items():
            self.tree.write(f"docs/prompts/runs/r/briefs/{name}.md", text)
        return cc.lint_briefs(self.tree.root)

    def test_a_brief_naming_a_record_with_all_three_headings_is_accepted(self):
        failures, _ = self.lint(ok=brief(*cc.BRIEF_HEADINGS))
        self.assertEqual(failures, [])

    def test_each_missing_heading_is_named(self):
        for missing in cc.BRIEF_HEADINGS:
            with self.subTest(missing=missing):
                kept = [h for h in cc.BRIEF_HEADINGS if h != missing]
                failures, _ = self.lint(**{"b-" + missing.split()[0].lower(): brief(*kept)})
                named = [f for f in failures if f.file.endswith(f"b-{missing.split()[0].lower()}.md")]
                self.assertEqual(len(named), 1)
                self.assertIn(missing, named[0].message)
                self.assertEqual(named[0].field, "headings")

    def test_a_brief_with_no_headings_at_all_fails_naming_all_three(self):
        failures, _ = self.lint(bare=brief())
        self.assertEqual(len(failures), 1)
        for heading in cc.BRIEF_HEADINGS:
            self.assertIn(heading, failures[0].message)

    def test_a_path_alone_names_a_record(self):
        failures, _ = self.lint(path="Builds `docs/chains/B2.yaml` and nothing else.\n")
        self.assertEqual(len(failures), 1)

    def test_a_heading_must_be_a_heading_not_a_sentence(self):
        failures, _ = self.lint(prose=brief() + "\nThe instructional chain, failure route and independence test are in the record.\n")
        self.assertEqual(len(failures), 1)

    def test_a_brief_that_names_no_record_needs_no_headings(self):
        failures, _ = self.lint(tiny="A wording fix to one lesson sentence.\n")
        self.assertEqual(failures, [])

    def test_the_probe_brief_is_accepted(self):
        text = PROBE.read_text(encoding="utf-8")
        failures, _ = self.lint(probe=text, named=text + "\nChain record: docs/chains/A7c.1.yaml\n")
        self.assertEqual(failures, [])

    def test_the_checkers_own_brief_is_the_one_named_exemption(self):
        rel = "docs/prompts/runs/curriculum-review-2026-10-05/briefs/chain-record-checker.md"
        self.assertIn(rel, cc.LINT_EXEMPT)
        self.tree.write(rel, "Owns `docs/chains/A7c.1.yaml`.\n")
        failures, notes = cc.lint_briefs(self.tree.root)
        self.assertEqual(failures, [])
        self.assertEqual(len(notes), 1)
        self.assertTrue(notes[0].startswith("EXEMPT "))
        self.tree.write("docs/prompts/runs/other/briefs/not-exempt.md", "Owns `docs/chains/A7c.1.yaml`.\n")
        failures, _ = cc.lint_briefs(self.tree.root)
        self.assertEqual(len(failures), 1)

    def test_the_real_briefs_pass_the_lint(self):
        failures, _ = cc.lint_briefs(ROOT)
        self.assertEqual([f.line() for f in failures], [])


class TheCommandLine(unittest.TestCase):
    def setUp(self):
        self.tree = Tree()
        self.addCleanup(self.tree.cleanup)
        # the sources the resolver and the tool vocabulary read, copied small
        sheet = self.tree.root / cc.MODE_SHEET
        sheet.parent.mkdir(parents=True)
        shutil.copy(ROOT / cc.MODE_SHEET, sheet)

    def test_a_broken_record_exits_one_with_a_line_per_failure(self):
        rec = load()
        rec["steps"][3]["tool"] = "Magic wand"
        rec["evidence"]["never_credits"] = []
        self.tree.write("docs/chains/A7c.1.yaml", yaml.safe_dump(rec, sort_keys=False))
        code, out = run_main("--root", str(self.tree.root))
        self.assertEqual(code, 1, out)
        fail_lines = [line for line in out.splitlines() if line.startswith("FAIL ")]
        self.assertEqual(len(fail_lines), 2, out)
        self.assertTrue(all("docs/chains/A7c.1.yaml:" in line for line in fail_lines))
        self.assertTrue(any("steps[4].tool" in line for line in fail_lines))
        self.assertTrue(any("evidence.never_credits" in line for line in fail_lines))

    def test_a_clean_draft_exits_zero_and_lists_what_is_unresolved(self):
        rec = load()
        rec["steps"][1]["content"]["ref"] = "exercise.tresillo.zz"
        self.tree.write("docs/chains/A7c.1.yaml", yaml.safe_dump(rec, sort_keys=False))
        code, out = run_main("--root", str(self.tree.root))
        self.assertEqual(code, 0, out)
        self.assertIn("UNRESOLVED docs/chains/A7c.1.yaml: steps[2].content.ref: exercise.tresillo.zz", out)

    def test_no_records_is_not_a_failure(self):
        code, out = run_main("--root", str(self.tree.root))
        self.assertEqual(code, 0, out)
        self.assertIn("0 chain record(s)", out)

    def test_lint_briefs_flag_fails_on_a_brief_without_the_headings(self):
        self.tree.write("docs/prompts/runs/r/briefs/x.md", brief("Instructional chain", "Failure route"))
        code, out = run_main("--root", str(self.tree.root), "--lint-briefs")
        self.assertEqual(code, 1, out)
        self.assertIn("Independence test", out)
        code, _ = run_main("--root", str(self.tree.root))
        self.assertEqual(code, 0)  # without the flag the briefs are not read


if __name__ == "__main__":
    unittest.main()
