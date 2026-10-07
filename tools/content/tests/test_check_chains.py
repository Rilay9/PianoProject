"""The chain-record checker (FABLE.md section 3): the real record, and one record broken per rule.

`tools/content/check_chains.py` reads `docs/chains/*.yaml`. The first record is A7c.1, the Bizet
habanera chain, a `draft` whose unresolved refs the checker lists. Each rule is shown on a copy of that
record broken in that one way, and fails naming the field; the copy is checked in memory, never written
into `docs/chains/`. The brief lint and live-handoff lint are shown on small trees under the repository's gitignored
`build/`, and on the probe brief itself. Reference resolution is exact: a prefix of a real id, and a
`path#anchor` whose anchor is not a heading slug or a literal anchor, do not resolve.

Run: `py -3.11 -m unittest tools.content.tests.test_check_chains`
"""
from __future__ import annotations

import io
import json
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
G13_REF = "docs/prompts/runs/curriculum-review-2026-10-05/GENERATOR-ADDENDUM.md#G13"
#: G13's generated 2/4 pair (family bass_cell). Until lane A7F the checker resolved an exercise id only through
#: tools/content/generator_continuity.json, which lists only families whose version moved, so these were listed
#: unresolved in the draft (G13's H7). Since A7F they resolve through tools/content/generated_ids.json, the manifest of
#: built generated ids the content build writes and keeps current (`BuiltGeneratedIds` below).
BASS_CELL_IDS = {"exercise.bass-cell.habanera.c", "exercise.bass-cell.habanera.f", "exercise.bass-cell.habanera.g",
                 "exercise.bass-cell.tresillo.c"}
MANIFEST = ROOT / "tools" / "content" / "generated_ids.json"

RESOLVER = cc.Resolver(ROOT)
TOOLS, SHEET_PROBLEMS = cc.vocabulary(ROOT)


def load() -> dict:
    """The real record as a draft fixture base. The real record moved to `reviewed` on 2026-10-06 (Entry 260, the reviewer's
    ruling); the cases below derive broken or partial records from it and rely on draft semantics (unresolved refs listed, not
    failed), so the base is forced to draft here and the real record's own status is asserted in `TheRealRecord`."""
    rec = yaml.safe_load(RECORD.read_text(encoding="utf-8"))
    rec["status"] = "draft"
    return rec


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
        self.assertEqual(status, "reviewed")  # since Entry 260 (2026-10-06); every ref resolves
        listed = {u.ref for u in unresolved}
        # what is not yet committed: the lesson file of the new rung, and the excerpt cut the intake adds.
        # Each is expected unresolved exactly while the thing it names is absent.
        expected = set()
        if not (ROOT / LESSON).exists():
            expected.add(LESSON)
        if CUT not in RESOLVER.excerpt_ids:
            expected.add(CUT)
        # the family contract's `path#G13` names a row in a table and a bold lead, which are not anchors:
        # unresolved, and listed, until the addendum gains a heading or a literal anchor for it
        addendum, _, anchor = G13_REF.partition("#")
        if anchor not in cc.markdown_anchors(ROOT / addendum):
            expected.add(G13_REF)
        # Revised (G13): the bass_cell exercise ids, each listed while the checker cannot resolve it (H7).
        expected |= {ref for ref in BASS_CELL_IDS if not RESOLVER.resolve(ref, "generated")[0]}
        self.assertEqual(listed, expected)
        self.assertEqual({u.file for u in unresolved}, {"docs/chains/A7c.1.yaml"} if unresolved else set())
        # every occurrence is listed with its field, not just each distinct ref
        rec = load()
        occurrences = sum(1 for s in rec["steps"] if s["content"]["ref"] in expected)
        occurrences += sum(1 for g in rec["generated"] for key in ("family", "contract", "checker") if g[key] in expected)
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
        ):
            with self.subTest(ref=ref):
                self.assertEqual(RESOLVER.resolve(ref, kind), (True, ""))

    def test_the_cli_exits_zero_on_the_real_tree_and_names_the_draft(self):
        code, out = run_main("--lint-briefs")
        self.assertEqual(code, 0, out)
        self.assertIn("A7c.1 (reviewed)", out)
        self.assertIn("0 failure(s)", out)
        self.assertNotIn("EXEMPT", out)
        self.assertRegex(out, r"[1-9]\d* linted \(carry an ability marker\)")  # at least the Bizet probe brief; the count grows with each ability brief
        self.assertRegex(out, r"\d+ skipped \(no ability marker\)")
        self.assertIn("not proof that pedagogical support faded", out)

    def test_the_first_record_uses_a_scaffold_token_the_last_step_shares_with_the_first(self):
        rec = load()
        self.assertLess(
            {x.casefold() for x in rec["steps"][-1]["scaffold"]}, {x.casefold() for x in rec["steps"][0]["scaffold"]}
        )


class TheToolVocabulary(unittest.TestCase):
    def test_every_named_section_is_in_the_sheet(self):
        self.assertEqual([p.line() for p in SHEET_PROBLEMS], [])
        headings = cc.sheet_headings(ROOT)
        for section in [str(n) for n in range(1, 32)] + ["7a", "7b"]:
            self.assertIn(section, headings)
            self.assertIn(section, cc.SECTION_NAMES)

    def test_the_vocabulary_holds_the_sheets_words_including_the_lesson_page(self):
        for name in ("Keep tempo", "Wait for me", "Hear it", "Rhythm only", "Loop", "Ladder", "Duet", "Blind", "Perform", "Simon"):
            self.assertIn(cc.norm_tool(name), TOOLS, name)
        self.assertIn(cc.norm_tool("Score: Keep tempo"), TOOLS)
        self.assertIn("lesson", TOOLS)
        self.assertNotIn("magic wand", TOOLS)

    def test_the_checker_holds_no_tool_table_of_its_own(self):
        # `lesson` is read from the sheet's section 31 and FABLE's tool field line, never from the code
        self.assertFalse(hasattr(cc, "EXTRA_TOOLS"))
        self.assertFalse(hasattr(cc, "LINT_EXEMPT"))
        self.assertEqual(cc.fable_tool_names(ROOT), (["lesson"], []))
        self.assertEqual(cc.SECTION_NAMES["31"][0], "Lesson page")

    def test_a_tool_fables_field_names_that_the_sheet_does_not_document_is_a_failure(self):
        tree = Governing(fable_tool="a mode or drill named in MODE-SHEET.md, or lesson: the lesson page, or wand: a spell")
        self.addCleanup(tree.cleanup)
        names, problems = cc.vocabulary(tree.root)
        self.assertIn("wand", names)  # read from the field line, as `lesson` is...
        self.assertTrue(any(p.field == "tool field" and "wand" in p.message for p in problems), [p.line() for p in problems])
        self.assertFalse(any("lesson" in p.message for p in problems))  # ...but only `wand` is undocumented

    def test_a_fable_without_the_tool_field_line_or_without_fable_is_a_failure(self):
        tree = Governing(fable_tool=None)
        self.addCleanup(tree.cleanup)
        _, problems = cc.vocabulary(tree.root)
        self.assertTrue(any(p.field == "tool field" for p in problems), [p.line() for p in problems])
        empty = Tree()
        self.addCleanup(empty.cleanup)
        sheet = empty.root / cc.MODE_SHEET
        sheet.parent.mkdir(parents=True)
        shutil.copy(ROOT / cc.MODE_SHEET, sheet)
        _, problems = cc.vocabulary(empty.root)
        self.assertTrue(any(p.file == cc.FABLE and "missing" in p.message for p in problems), [p.line() for p in problems])

    def test_the_lesson_page_section_is_in_the_sheet_and_the_closing_sections_follow_it(self):
        headings = cc.sheet_headings(ROOT)
        self.assertIn("lesson", headings["31"].casefold())
        self.assertTrue(headings["32"].startswith("The seven claims"))
        self.assertTrue(headings["33"].startswith("Summary table"))
        self.assertTrue(headings["34"].startswith("What I could not establish"))

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
        # the cut, the lesson file and the family's `#G13` anchor are unresolved too, until the intake,
        # the lesson and an anchor land; the point is that every unresolved ref now fails, and nothing
        # else does
        others = {f.field for f in failures if not f.field.endswith("content.ref")}
        self.assertLessEqual(others, {"generated[1].contract", "generated[1].checker"})

    def test_r3_a_ref_that_resolves_never_fails_a_reviewed_record(self):
        rec = load()
        for step in rec["steps"]:
            if step["content"]["ref"] in (LESSON, CUT):
                step["content"]["ref"] = "exercise.tresillo.c"
                step["content"]["kind"] = "generated"
            # Revised (A7F): the bass_cell exercise ids resolve through the manifest of built generated ids, so they
            # stay as the record writes them (G13 had replaced them with the family id while H7 was open).
        rec["generated"][0]["contract"] = "docs/prompts/FABLE.md"
        rec["generated"][0]["checker"] = "tools/content/check_chains.py"
        rec["status"] = "reviewed"
        failures, listed = check(rec)
        self.assertEqual(fields(failures), [])
        self.assertEqual(listed, [])

    def test_r3_the_kinds_of_ref(self):
        good = [
            ("docs/prompts/FABLE.md", None),
            ("docs/prompts/FABLE.md#3-the-chain-record-the-teaching-design-as-data-the-build-checks", None),
            ("docs/prompts/FABLE.md#1-the-target-and-the-one-number-that-shows-progress", None),
            ("song.jazz.the-crave", None),
            ("QmNswaWYXpxK1XegKbJVDULwZMjKN6cETGTVfXQKYsYrzs@bars=1-14", "excerpt"),
            ("tresillo", "generated"),
            ("https://example.org/a-book", "external"),
        ]
        bad = [
            ("docs/prompts/NOPE.md", None),
            ("docs/prompts/FABLE.md#Nowhere-Such-Heading", None),
            ("docs/prompts/FABLE.md#3", None),  # a section number is not a slug
            ("docs/prompts/FABLE.md#3-the-chain-record", None),  # a prefix of a slug is not the slug
            ("docs/prompts/FABLE.md#missing-anchor", None),
            ("tools/content/check_chains.py#resolve", None),  # an anchor is read only in a Markdown file
            ("docs/prompts#anything", None),  # nor in a directory
            ("song.jazz.the-crave@bars=21-900", None),
            ("song.jazz.the-crave@bars=26-21", None),
            ("song.jazz.the-crave@bars=x", None),
            ("tresillo@bars=1-2", None),
            ("https://example.org/a-book", "piece"),
            ("exercise.tresillo.zz", None),
            ("exercise.tresillo", None),  # a prefix of real ids is not an id
            ("exercise.tresillo.c.extra", None),
            ("exercise.tresillo.", None),
            ("tresill", None),  # nor a prefix of a family id
            ("tresillo2", None),
            ("excerpt.classical.bizet-l-amour-est-un-oiseau-rebelle.pdmx.b1-1", None),
            ("", None),
        ]
        for ref, kind in good:
            with self.subTest(good=ref):
                self.assertTrue(RESOLVER.resolve(ref, kind)[0], RESOLVER.resolve(ref, kind))
        for ref, kind in bad:
            with self.subTest(bad=ref):
                self.assertFalse(RESOLVER.resolve(ref, kind)[0])

    def test_r3_a_prefix_of_a_real_exercise_id_is_unresolved_and_named_in_a_draft_and_fails_a_reviewed_record(self):
        rec = load()
        rec["steps"][1]["content"]["ref"] = "exercise.tresillo.zz"
        rec["steps"][3]["content"] = {"kind": "generated", "ref": "exercise.tresillo"}
        rec["steps"][4]["content"] = {"kind": "generated", "ref": "exercise.tresillo.c.0"}
        failures, listed = check(rec)
        self.assertEqual(failures, [])
        named = {(u.field, u.ref) for u in listed}
        for pair in (
            ("steps[2].content.ref", "exercise.tresillo.zz"),
            ("steps[4].content.ref", "exercise.tresillo"),
            ("steps[5].content.ref", "exercise.tresillo.c.0"),
        ):
            self.assertIn(pair, named)
        rec["status"] = "reviewed"
        failures, _ = check(rec)
        for field in ("steps[2].content.ref", "steps[4].content.ref", "steps[5].content.ref"):
            self.assertIn(field, fields(failures))

    def test_r3_a_path_with_a_missing_anchor_is_unresolved_and_named_in_a_draft_and_fails_a_reviewed_record(self):
        rec = load()
        rec["steps"][1]["content"] = {"kind": "explanation", "ref": "docs/prompts/FABLE.md#missing-anchor"}
        failures, listed = check(rec)
        self.assertEqual(failures, [])
        mine = [u for u in listed if u.ref == "docs/prompts/FABLE.md#missing-anchor"]
        self.assertEqual([u.field for u in mine], ["steps[2].content.ref"])
        self.assertIn("#missing-anchor", mine[0].why)
        rec["status"] = "reviewed"
        failures, _ = check(rec)
        self.assertIn("steps[2].content.ref", fields(failures))
        self.assertTrue(any("missing-anchor" in f.message for f in failures))

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
        # the steps cite the same unknown family, so no step names a family that lacks an entry (the link
        # rule is the next tests'); the unknown id is R3's, listed in a draft
        for step in rec["steps"]:
            if step["content"]["kind"] == "generated":
                step["content"]["ref"] = "no_such_family"
        failures, listed = check(rec)
        self.assertEqual(failures, [])
        self.assertIn("generated[1].family", {u.field for u in listed})

    def test_r7_a_generated_step_whose_family_has_no_entry_fails_naming_the_step_ref(self):
        rec = load()
        rec["generated"] = []
        failures, _ = check(rec)
        # Revised (A7F): every generated step now identifies its family, the bass_cell exercise ids through the
        # manifest of built generated ids (before A7F they identified none and were R3's, listed, H7).
        generated_steps = [n for n, s in enumerate(rec["steps"], 1) if s["content"]["kind"] == "generated"]
        self.assertTrue(generated_steps)
        self.assertEqual([n for n in generated_steps if not RESOLVER.family_of(rec["steps"][n - 1]["content"]["ref"])], [])
        self.assertTrue(any(s["content"]["ref"] in BASS_CELL_IDS for s in rec["steps"]))
        self.assertEqual(fields(failures), [f"steps[{n}].content.ref" for n in generated_steps])
        for n, failure in zip(generated_steps, failures):
            ref = rec["steps"][n - 1]["content"]["ref"]
            self.assertIn("'bass_cell'" if ref in BASS_CELL_IDS else "'tresillo'", failure.message)
            self.assertIn("no entry under generated", failure.message)

    def test_r7_a_step_naming_another_family_by_id_or_by_exercise_id_fails_until_that_family_is_listed(self):
        for ref in ("scale", "exercise.accompaniment.alberti.c-major.both"):
            with self.subTest(ref=ref):
                family = RESOLVER.family_of(ref)
                self.assertIsNotNone(family)
                self.assertNotEqual(family, "tresillo")
                rec = load()
                rec["steps"][3]["content"] = {"kind": "generated", "ref": ref}
                failures, _ = check(rec)
                self.assertEqual(fields(failures), ["steps[4].content.ref"])
                rec["generated"].append({**rec["generated"][0], "family": family})
                self.assertEqual(fields(check(rec)[0]), [])

    def test_r7_the_link_reads_the_family_id_itself_and_an_exercise_ids_continuity_family(self):
        self.assertEqual(RESOLVER.family_of("tresillo"), "tresillo")
        self.assertEqual(RESOLVER.family_of("exercise.tresillo.f"), "tresillo")
        self.assertIsNone(RESOLVER.family_of("exercise.tresillo"))
        self.assertIsNone(RESOLVER.family_of("no_such_family"))

    def test_r7_a_non_generated_step_needs_no_family_entry(self):
        rec = load()
        rec["generated"] = [g for g in rec["generated"] if g["family"] != "tresillo"]
        for step in rec["steps"]:
            if step["content"]["kind"] == "generated":
                step["content"] = {"kind": "explanation", "ref": "tresillo"}
        self.assertEqual(fields(check(rec)[0]), [])

    def test_r7_presented_as_is_required_and_is_drill_or_music(self):
        rec = load()
        del rec["generated"][0]["presented_as"]
        failures, _ = check(rec)
        self.assertEqual(fields(failures), ["generated[1].presented_as"])
        self.assertIn("missing", failures[0].message)
        for bad in ("", None, "audible", "Music"):
            with self.subTest(value=bad):
                rec = load()
                rec["generated"][0]["presented_as"] = bad
                self.assertEqual(fields(check(rec)[0]), ["generated[1].presented_as"])
        for good in ("drill", "music"):
            with self.subTest(value=good):
                rec = load()
                rec["generated"][0]["presented_as"] = good
                self.assertEqual(fields(check(rec)[0]), [])

    def test_r7_a_named_pattern_presented_as_music_lists_its_musical_properties(self):
        for props in ({}, None):
            with self.subTest(properties=props):
                rec = load()
                entry = rec["generated"][0]
                self.assertEqual((entry["job"], entry["presented_as"]), ("NAMED-PATTERN", "music"))
                if props is None:
                    del entry["musical_properties"]
                else:
                    entry["musical_properties"] = props
                failures, _ = check(rec)
                self.assertEqual(fields(failures), ["generated[1].musical_properties"])
                self.assertIn("presented_as: music", failures[0].message)

    def test_r7_a_named_pattern_presented_as_a_drill_needs_no_properties_but_is_checked_where_it_lists(self):
        rec = load()
        rec["generated"][0]["presented_as"] = "drill"
        rec["generated"][0]["musical_properties"] = {}
        self.assertEqual(fields(check(rec)[0]), [])
        rec["generated"][0]["musical_properties"] = {"onset set": ""}
        self.assertEqual(fields(check(rec)[0]), ["generated[1].musical_properties.onset set"])

    def test_r7_a_mechanical_control_presented_as_a_drill_lists_no_properties_and_passes(self):
        for properties in ("empty", "absent"):
            with self.subTest(properties=properties):
                rec = load()
                entry = rec["generated"][0]
                entry["job"] = "CONTROL"
                entry["presented_as"] = "drill"
                if properties == "empty":
                    entry["musical_properties"] = {}
                else:
                    del entry["musical_properties"]
                self.assertEqual(fields(check(rec)[0]), [])

    def test_r7_a_sight_reading_or_musical_family_lists_properties_whatever_it_is_presented_as(self):
        for job in ("SIGHT-READING", "MUSICAL"):
            with self.subTest(job=job):
                rec = load()
                rec["generated"][0]["job"] = job
                rec["generated"][0]["presented_as"] = "drill"
                rec["generated"][0]["musical_properties"] = {}
                self.assertEqual(fields(check(rec)[0]), ["generated[1].musical_properties"])

    # R8 -------------------------------------------------------------------------------
    def test_r8_shipped_without_an_acceptance_path(self):
        rec = load()
        rec["status"] = "shipped"
        # Revised (A7S): the real record now names its acceptance path, so the case takes it out; it was
        # written while the record had none, and relied on that.
        rec.pop("acceptance_test", None)
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

    def test_r8_shipped_with_an_existing_automated_test_source_passes_that_rule(self):
        rec = load()
        rec["status"] = "shipped"
        rec["acceptance_test"] = "tools/content/tests/test_check_chains.py"
        failures, _ = check(rec)
        self.assertNotIn("acceptance_test", fields(failures))

    def test_r8_shipped_with_existing_markdown_is_not_an_acceptance_test(self):
        rec = load()
        rec["status"] = "shipped"
        rec["acceptance_test"] = "docs/prompts/FABLE.md"
        failures, _ = check(rec)
        acceptance = [f for f in failures if f.field == "acceptance_test"]
        self.assertEqual(len(acceptance), 1)
        self.assertIn("not an automated test source", acceptance[0].message)
        self.assertIn("manual/phone walks cannot gate shipped", acceptance[0].message)

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


class TheAnchorRule(unittest.TestCase):
    """`path#anchor`: the path exists, is Markdown, and the anchor is a heading slug or a literal anchor."""

    def setUp(self):
        self.tree = Tree()
        self.addCleanup(self.tree.cleanup)
        self.tree.write(
            "doc.md",
            "# Title: The `Start` of it\n\n"
            "## 7a. Read it (the *first* way)\n\n"
            "## Repeated\n\n## Repeated\n\n"
            "```\n## Inside a fence\n```\n\n"
            "### With [a link](http://x.example/y) {#declared}\n\n"
            '<a id="literal-anchor"></a>\n\n'
            "| id | what |\n|---|---|\n| G13 | a table row |\n\n"
            "**Bold lead.** A sentence.\n",
        )
        self.tree.write("data.json", '{"a": 1}')
        self.resolver = cc.Resolver(self.tree.root)

    def resolves(self, ref: str) -> bool:
        return self.resolver.resolve(ref)[0]

    def test_a_heading_resolves_by_its_slug_only(self):
        self.assertTrue(self.resolves("doc.md#title-the-start-of-it"))
        self.assertTrue(self.resolves("doc.md#7a-read-it-the-first-way"))
        for wrong in ("Title", "7a", "7a-read-it", "read-it-the-first-way", "title-the-start", "TITLE-THE-START-OF-IT"):
            with self.subTest(wrong=wrong):
                self.assertFalse(self.resolves(f"doc.md#{wrong}"))

    def test_a_repeated_heading_takes_the_numbered_slug_github_gives_it(self):
        self.assertTrue(self.resolves("doc.md#repeated"))
        self.assertTrue(self.resolves("doc.md#repeated-1"))
        self.assertFalse(self.resolves("doc.md#repeated-2"))

    def test_a_link_in_a_heading_keeps_its_text_and_a_declared_or_literal_anchor_resolves(self):
        self.assertTrue(self.resolves("doc.md#with-a-link"))
        self.assertTrue(self.resolves("doc.md#declared"))
        self.assertTrue(self.resolves("doc.md#literal-anchor"))

    def test_a_table_row_a_bold_lead_and_a_fenced_heading_are_not_anchors(self):
        for wrong in ("G13", "g13", "bold-lead", "Bold lead.", "inside-a-fence"):
            with self.subTest(wrong=wrong):
                self.assertFalse(self.resolves(f"doc.md#{wrong}"))

    def test_the_path_must_exist_and_be_markdown(self):
        self.assertFalse(self.resolves("nope.md#title-the-start-of-it"))
        ok, why = self.resolver.resolve("data.json#a")
        self.assertFalse(ok)
        self.assertIn("Markdown", why)
        self.assertTrue(self.resolves("doc.md"))  # no anchor: the path alone

    def test_the_why_names_the_missing_anchor(self):
        ok, why = self.resolver.resolve("doc.md#missing-anchor")
        self.assertFalse(ok)
        self.assertIn("#missing-anchor", why)
        self.assertIn("doc.md", why)


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


class Governing(Tree):
    """A Tree holding the two governing files the vocabulary reads: the mode sheet, and FABLE.md with its
    tool field line (replaced by `fable_tool`, or removed when that is None)."""

    def __init__(self, fable_tool: str | None = "keep") -> None:
        super().__init__()
        sheet = self.root / cc.MODE_SHEET
        sheet.parent.mkdir(parents=True)
        shutil.copy(ROOT / cc.MODE_SHEET, sheet)
        fable = (ROOT / cc.FABLE).read_text(encoding="utf-8")
        if fable_tool != "keep":
            lines = []
            for line in fable.splitlines():
                if cc.FABLE_TOOL_LINE_RE.match(line):
                    if fable_tool is None:
                        continue
                    line = f"    tool: <{fable_tool}>"
                lines.append(line)
            fable = "\n".join(lines)
        self.write(cc.FABLE, fable)

    def write_record(self, rec: dict, ident: str = "A7c.1") -> Path:
        return self.write(f"docs/chains/{ident}.yaml", yaml.safe_dump(rec, sort_keys=False))


def brief(*headings: str, ability: str | None = "A7c.1") -> str:
    lines = ["# A brief", ""]
    if ability:
        lines += [f"ability: {ability}", ""]
    for heading in headings:
        lines += [f"### {heading}", "", "text", ""]
    return "\n".join(lines)


class TheBriefLint(unittest.TestCase):
    """Every brief that carries a whole line `ability: <id>` is linted; a brief without it is skipped."""

    def setUp(self):
        self.tree = Governing()
        self.addCleanup(self.tree.cleanup)

    def lint(self, with_record: bool = True, **briefs: str):
        if with_record:
            self.tree.write_record(load())
        for name, text in briefs.items():
            self.tree.write(f"docs/prompts/runs/r/briefs/{name}.md", text)
        return cc.lint_briefs(self.tree.root)

    def test_a_marked_brief_with_all_three_headings_and_a_passing_draft_record_is_accepted(self):
        failures, notes = self.lint(ok=brief(*cc.BRIEF_HEADINGS))
        self.assertEqual([f.line() for f in failures], [])
        self.assertTrue(notes[0].startswith("briefs: 1 linted"), notes)

    def test_each_missing_heading_of_a_marked_brief_is_named(self):
        for missing in cc.BRIEF_HEADINGS:
            with self.subTest(missing=missing):
                kept = [h for h in cc.BRIEF_HEADINGS if h != missing]
                failures, _ = self.lint(**{"b-" + missing.split()[0].lower(): brief(*kept)})
                named = [f for f in failures if f.file.endswith(f"b-{missing.split()[0].lower()}.md")]
                self.assertEqual(len(named), 1)
                self.assertIn(missing, named[0].message)
                self.assertEqual(named[0].field, "headings")

    def test_a_marked_brief_with_no_headings_at_all_fails_naming_all_three(self):
        failures, _ = self.lint(bare=brief())
        self.assertEqual([f.field for f in failures], ["headings"])
        for heading in cc.BRIEF_HEADINGS:
            self.assertIn(heading, failures[0].message)

    def test_a_marked_brief_whose_record_is_missing_fails(self):
        failures, _ = self.lint(with_record=False, orphan=brief(*cc.BRIEF_HEADINGS, ability="B9"))
        self.assertEqual([f.field for f in failures], ["record"])
        self.assertIn("docs/chains/B9.yaml", failures[0].message)
        self.assertIn("does not exist", failures[0].message)

    def test_a_marked_brief_whose_record_fails_the_checker_fails(self):
        rec = load()
        rec["evidence"]["never_credits"] = []
        self.tree.write_record(rec)
        failures, _ = self.lint(with_record=False, broken=brief(*cc.BRIEF_HEADINGS))
        self.assertEqual([f.field for f in failures], ["record"])
        self.assertIn("fails the checker", failures[0].message)

    def test_a_marked_brief_whose_record_is_a_draft_with_unresolved_refs_passes(self):
        # this tree holds no sources, so every ref of the copied record is unresolved; a draft lists them
        record_failures, listed, status = cc.check_file(
            self.tree.write_record(load()), cc.Resolver(self.tree.root), cc.vocabulary(self.tree.root)[0], self.tree.root
        )
        self.assertEqual((record_failures, status), ([], "draft"))
        self.assertTrue(listed)
        failures, _ = self.lint(draft=brief(*cc.BRIEF_HEADINGS))
        self.assertEqual(failures, [])

    def test_an_unmarked_brief_is_skipped_and_the_run_says_how_many(self):
        failures, notes = self.lint(
            ok=brief(*cc.BRIEF_HEADINGS),
            tiny="A wording fix to one lesson sentence.\n",
            names_a_path="Builds `docs/chains/B2.yaml` and nothing else.\n",
            chain_record_line="Chain record: `docs/chains/A7c.1.yaml`\n",
            bare=brief(ability=None),
        )
        self.assertEqual(failures, [])
        self.assertTrue(notes[0].startswith("briefs: 1 linted"), notes)
        self.assertIn("4 skipped (no ability marker)", notes[0])

    def test_the_marker_is_one_whole_line_in_the_id_form(self):
        for text in (
            "The brief says `ability: A7c.1` in a sentence.\n",
            "  ability: A7c.1\n",  # indented
            "ability: <id>\n",
            "ability: \n",
            "ability: A7c.1 and more\n",
            "Ability: A7c.1\n",
        ):
            with self.subTest(text=text):
                self.assertEqual(cc.brief_markers(text.splitlines()), [])
        self.assertEqual(cc.brief_markers(["ability: A7c.1", "x", "ability: B2", "ability: A7c.1"]), ["A7c.1", "B2"])
        self.assertEqual(cc.brief_markers(["ability: A10.2  "]), ["A10.2"])

    def test_there_is_no_exemption_and_no_record_naming_heuristic(self):
        # the old heuristic read `chain record:` and `docs/chains/`; neither marks a brief now
        failures, notes = self.lint(
            builds_the_checker="Owns `docs/chains/A7c.1.yaml`, and the line Chain record: docs/chains/A7c.1.yaml.\n"
        )
        self.assertEqual(failures, [])
        self.assertIn("1 skipped", notes[0])
        self.assertFalse(any(n.startswith("EXEMPT") for n in notes))

    def test_the_probe_brief_is_the_one_marked_brief_and_is_accepted(self):
        text = PROBE.read_text(encoding="utf-8")
        self.assertEqual(cc.brief_markers(text.splitlines()), ["A7c.1"])
        failures, notes = self.lint(probe=text)
        self.assertEqual([f.line() for f in failures], [])
        self.assertTrue(notes[0].startswith("briefs: 1 linted"), notes)

    def test_the_checkers_own_briefs_carry_no_marker_and_need_no_exemption(self):
        for name in ("chain-checker-corrections.md", "chain-record-checker.md"):
            with self.subTest(brief=name):
                text = (PROBE.parent / name).read_text(encoding="utf-8")
                self.assertEqual(cc.brief_markers(text.splitlines()), [])

    def test_the_real_briefs_pass_the_lint(self):
        failures, notes = cc.lint_briefs(ROOT)
        self.assertEqual([f.line() for f in failures], [])
        self.assertTrue(any("probe-latin4-bizet.md (A7c.1)" in n for n in notes), notes)

class TheLiveHandoffLint(unittest.TestCase):
    def setUp(self):
        self.tree = Tree()
        self.addCleanup(self.tree.cleanup)

    def pointer(self, body: str) -> None:
        self.tree.write(
            cc.CURRENT_REVIEW,
            "# Reviewer handoff (current)\n\n## Response-required handoffs\n\n" + body,
        )

    def test_a_live_handoff_without_owner_action_none_fails(self):
        self.pointer("- `handoffs/open.md` — response required before dispatch.\n")
        self.tree.write("docs/review/handoffs/open.md", "# Open\n\nReview this.\n")
        failures, notes = cc.lint_handoffs(self.tree.root)
        self.assertEqual([f.field for f in failures], ["owner_action"])
        self.assertIn("owner_action: none", failures[0].message)
        self.assertEqual(notes[0], "handoffs: 1 live reviewer handoff(s) linted")

    def test_a_live_handoff_with_owner_action_none_passes(self):
        self.pointer("- `handoffs/open.md` — response required before dispatch.\n")
        self.tree.write("docs/review/handoffs/open.md", "# Open\n\nowner_action: none\n\nReview this.\n")
        failures, notes = cc.lint_handoffs(self.tree.root)
        self.assertEqual(failures, [])
        self.assertEqual(notes[0], "handoffs: 1 live reviewer handoff(s) linted")

    def test_a_phone_walk_is_rejected_even_with_the_none_marker(self):
        self.pointer("- `handoffs/open.md` — response required before dispatch.\n")
        self.tree.write(
            "docs/review/handoffs/open.md",
            "# Open\n\nowner_action: none\n\nThe owner phone walk is the final shipping gate.\n",
        )
        failures, _ = cc.lint_handoffs(self.tree.root)
        self.assertEqual([f.field for f in failures], ["owner_action"])
        self.assertIn("phone walk", failures[0].message)

    def test_answered_handoffs_are_history_not_live_owner_work(self):
        self.pointer("- `handoffs/old.md` — **answered / U125 closed** in `responses/old.md`.\n")
        self.tree.write("docs/review/handoffs/old.md", "# Old\n\nThe owner phone walk was once mentioned here.\n")
        failures, notes = cc.lint_handoffs(self.tree.root)
        self.assertEqual(failures, [])
        self.assertEqual(notes[0], "handoffs: 0 live reviewer handoff(s) linted")

    def test_answered_word_later_in_a_live_status_does_not_hide_it(self):
        self.pointer("- `handoffs/open.md` — response required; an older question was answered elsewhere.\n")
        self.tree.write("docs/review/handoffs/open.md", "# Open\n\nReview this.\n")
        failures, notes = cc.lint_handoffs(self.tree.root)
        self.assertEqual([f.field for f in failures], ["owner_action"])
        self.assertEqual(notes[0], "handoffs: 1 live reviewer handoff(s) linted")

    def test_the_real_current_pointer_has_no_invalid_live_handoff(self):
        failures, _ = cc.lint_handoffs(ROOT)
        self.assertEqual([f.line() for f in failures], [])

class TheCommandLine(unittest.TestCase):
    def setUp(self):
        self.tree = Governing()
        self.addCleanup(self.tree.cleanup)

    def test_a_broken_record_exits_one_with_a_line_per_failure(self):
        rec = load()
        rec["steps"][3]["tool"] = "Magic wand"
        rec["evidence"]["never_credits"] = []
        self.tree.write_record(rec)
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
        self.tree.write_record(rec)
        code, out = run_main("--root", str(self.tree.root))
        self.assertEqual(code, 0, out)
        self.assertIn("UNRESOLVED docs/chains/A7c.1.yaml: steps[2].content.ref: exercise.tresillo.zz", out)

    def test_no_records_is_not_a_failure(self):
        code, out = run_main("--root", str(self.tree.root))
        self.assertEqual(code, 0, out)
        self.assertIn("0 chain record(s)", out)

    def test_the_summary_says_the_scaffold_rule_is_structural_not_proof(self):
        code, out = run_main("--root", str(self.tree.root))
        self.assertEqual(code, 0, out)
        self.assertIn("scaffold-subset rule (R5) is a structural check", out)
        self.assertIn("not proof that pedagogical support faded", out)

    def test_lint_briefs_flag_fails_on_a_marked_brief_without_the_headings_and_counts_the_skipped(self):
        self.tree.write_record(load())
        self.tree.write("docs/prompts/runs/r/briefs/x.md", brief("Instructional chain", "Failure route"))
        self.tree.write("docs/prompts/runs/r/briefs/tiny.md", "A wording fix.\n")
        code, out = run_main("--root", str(self.tree.root), "--lint-briefs")
        self.assertEqual(code, 1, out)
        self.assertIn("Independence test", out)
        self.assertIn("1 linted (carry an ability marker), 1 skipped (no ability marker)", out)
        code, _ = run_main("--root", str(self.tree.root))
        self.assertEqual(code, 0)  # without the flag the briefs are not read

    def test_lint_handoffs_flag_fails_on_live_handoff_that_assigns_owner_work(self):
        self.tree.write(
            cc.CURRENT_REVIEW,
            "# Reviewer handoff (current)\n\n## Response-required handoffs\n\n"
            "- `handoffs/open.md` — response required before dispatch.\n",
        )
        self.tree.write(
            "docs/review/handoffs/open.md",
            "# Open\n\nowner_action: none\n\nThe owner phone walk is the final gate.\n",
        )
        code, out = run_main("--root", str(self.tree.root), "--lint-handoffs")
        self.assertEqual(code, 1, out)
        self.assertIn("phone walk", out)
        code, _ = run_main("--root", str(self.tree.root))
        self.assertEqual(code, 0)  # without the flag reviewer handoffs are not read


class BuiltGeneratedIds(unittest.TestCase):
    """H7 (`docs/review/responses/g13-habanera-control.md` §3): a built generated id resolves without depending on
    whether its family appears in the continuity record. Rule (4) reads `tools/content/generated_ids.json` (the
    manifest the content build writes and fails on when stale) by exact match first, then
    `generator_continuity.json`, which stays the source for historical ids. Each case builds a small tree holding the
    two family sources, with and without the manifest, so the manifest is shown to be what resolves the four
    bass_cell ids, which no continuity row holds."""

    def setUp(self):
        self.tree = Tree()
        self.addCleanup(self.tree.cleanup)
        for rel in ("tools/content/family_contracts.json", "tools/content/generator_continuity.json"):
            self.tree.write(rel, (ROOT / rel).read_text(encoding="utf-8"))

    def resolver(self, manifest: bool) -> cc.Resolver:
        target = self.tree.root / "tools" / "content" / "generated_ids.json"
        if manifest:
            self.tree.write("tools/content/generated_ids.json", MANIFEST.read_text(encoding="utf-8"))
        elif target.exists():
            target.unlink()
        return cc.Resolver(self.tree.root)

    def test_the_four_bass_cell_ids_are_unresolved_without_the_manifest_and_resolve_with_it(self):
        without = self.resolver(manifest=False)
        for ref in sorted(BASS_CELL_IDS):
            with self.subTest(without=ref):
                self.assertFalse(without.resolve(ref, "generated")[0])
                self.assertIsNone(without.family_of(ref))
        with_manifest = self.resolver(manifest=True)
        for ref in sorted(BASS_CELL_IDS):
            with self.subTest(with_manifest=ref):
                self.assertEqual(with_manifest.resolve(ref, "generated"), (True, ""))
                self.assertEqual(with_manifest.family_of(ref), "bass_cell")

    def test_the_committed_manifest_holds_the_four_rows_sorted_and_unique(self):
        rows = json.loads(MANIFEST.read_text(encoding="utf-8"))["items"]
        ids = [row["id"] for row in rows]
        self.assertEqual(ids, sorted(ids))
        self.assertEqual(len(ids), len(set(ids)))
        by_id = {row["id"]: row for row in rows}
        for ref in sorted(BASS_CELL_IDS):
            with self.subTest(ref=ref):
                self.assertEqual(by_id[ref]["family"], "bass_cell")
                self.assertIsInstance(by_id[ref]["version"], int)
        self.assertTrue(all(set(row) == {"id", "family", "version"} for row in rows))

    def test_resolution_against_the_manifest_is_exact(self):
        resolver = self.resolver(manifest=True)
        for bad in ("exercise.bass-cell.zz", "exercise.bass-cell", "exercise.bass-cell.habanera",
                    "exercise.bass-cell.habanera.c.x", "Exercise.bass-cell.habanera.c", "exercise.bass-cell.habanera.cc"):
            with self.subTest(bad=bad):
                self.assertFalse(resolver.resolve(bad, "generated")[0])
                self.assertIsNone(resolver.family_of(bad))

    def test_a_broken_record_naming_bass_cell_zz_is_listed_in_a_draft_and_fails_once_reviewed(self):
        rec = load()
        self.assertEqual(rec["steps"][5]["content"]["ref"], "exercise.bass-cell.tresillo.c")
        rec["steps"][5]["content"]["ref"] = "exercise.bass-cell.zz"
        failures, listed = check(rec)
        self.assertEqual(failures, [])
        self.assertIn(("steps[6].content.ref", "exercise.bass-cell.zz"), {(u.field, u.ref) for u in listed})
        rec["status"] = "reviewed"
        failures, _ = check(rec)
        self.assertIn("steps[6].content.ref", fields(failures))
        self.assertTrue(any("exercise.bass-cell.zz" in f.message for f in failures))

    def test_the_continuity_record_stays_the_second_source_for_a_historical_id(self):
        continuity = json.loads((ROOT / "tools/content/generator_continuity.json").read_text(encoding="utf-8"))
        continuity["families"]["tresillo"]["items"]["exercise.tresillo.retired"] = {}
        self.tree.write("tools/content/generator_continuity.json", json.dumps(continuity))
        rows = json.loads(MANIFEST.read_text(encoding="utf-8"))["items"]
        self.assertNotIn("exercise.tresillo.retired", {row["id"] for row in rows})
        for manifest in (False, True):
            with self.subTest(manifest=manifest):
                resolver = self.resolver(manifest)
                self.assertEqual(resolver.resolve("exercise.tresillo.retired", "generated"), (True, ""))
                self.assertEqual(resolver.family_of("exercise.tresillo.retired"), "tresillo")

    def test_the_build_fails_on_a_stale_or_missing_manifest_with_one_line_and_rewrites_it(self):
        import build  # stdlib only at import, so this runs where the checker's tests run

        catalog = [
            {"id": "exercise.b.c", "drill": {"generator": {"family": "fam_b", "version": 2}}},
            {"id": "exercise.a.c", "drill": {"generator": {"family": "fam_a", "version": 1}}},
            {"id": "song.not-generated", "drill": None},
            {"id": "drill.runtime", "drill": {"kind": "simon"}},
        ]
        self.assertEqual(build.generated_id_rows(catalog), [
            {"id": "exercise.a.c", "family": "fam_a", "version": 1},
            {"id": "exercise.b.c", "family": "fam_b", "version": 2},
        ])
        out = self.tree.root / "out"
        out.mkdir()
        (out / "catalog.json").write_text(json.dumps(catalog), encoding="utf-8")
        path = self.tree.root / "generated_ids.json"
        missing = build.generated_ids_finding(catalog, path)
        self.assertIn("is missing", missing)
        self.assertNotIn("\n", missing)
        # neither a partial build nor a broken one checks or writes
        self.assertTrue(build.step_generated_ids(out, full=False, built=True, path=path).skipped)
        self.assertTrue(build.step_generated_ids(out, full=True, built=False, path=path).skipped)
        self.assertFalse(path.exists())
        first = build.step_generated_ids(out, full=True, built=True, path=path)
        self.assertFalse(first.ok)
        self.assertEqual(first.detail, missing)
        self.assertEqual(path.read_bytes().count(b"\r"), 0)
        self.assertIsNone(build.generated_ids_finding(catalog, path))
        self.assertTrue(build.step_generated_ids(out, full=True, built=True, path=path).ok)
        # a bumped version is stale, named in one line, and the file is rewritten
        catalog[0]["drill"]["generator"]["version"] = 3
        (out / "catalog.json").write_text(json.dumps(catalog), encoding="utf-8")
        stale = build.step_generated_ids(out, full=True, built=True, path=path)
        self.assertFalse(stale.ok)
        self.assertIn("is stale", stale.detail)
        self.assertIn("0 added, 0 removed, 1 changed", stale.detail)
        self.assertNotIn("\n", stale.detail)
        self.assertIsNone(build.generated_ids_finding(catalog, path))

    def test_the_real_record_reports_no_unresolved_ref(self):
        code, out = run_main("--lint-briefs")
        self.assertEqual(code, 0, out)
        self.assertIn("0 failure(s), 0 unresolved ref(s) in drafts", out)
        self.assertNotIn("UNRESOLVED", out)


if __name__ == "__main__":
    unittest.main()
