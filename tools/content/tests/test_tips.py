"""
Drill tips and their rules (replan §6).

The rules exist because each opposite ships easily and silently: a kind added
without a file, a file that drifted into an essay, headings in the wrong order,
and — the quiet one — a variant whose `when:` names a parameter no drill
carries, which simply never matches and looks like nothing at all.
"""
from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

TOOLS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(TOOLS))

import validate  # noqa: E402
from common import read_front_matter  # noqa: E402

REPO_ROOT = TOOLS.parents[1]
TIPS_DIR = REPO_ROOT / "content" / "tips"
CATALOG = REPO_ROOT / "app" / "public" / "content" / "catalog.json"

GOOD = """---
kind: note-flash
---

## What it's for

Reading a note without counting up from middle C.

## How to practise it

Short and often.

## Common mistake

Counting, and getting the right answer anyway.

## How you'll know you've got it

The answer arrives before you decide to answer.
"""


def write(directory: Path, name: str, text: str) -> None:
    (directory / name).write_text(text, encoding="utf-8")


class TestFrontMatter(unittest.TestCase):
    """The Python reader has to agree with `app/src/ui/markdown.ts`'s."""

    def test_it_reads_a_scalar_and_a_nested_block(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "x.md"
            path.write_text("---\nkind: rhythm\nwhen:\n  feel: shuffle\n---\n\nbody\n", encoding="utf-8")
            meta, body = read_front_matter(path)
        self.assertEqual(meta, {"kind": "rhythm", "when": {"feel": "shuffle"}})
        self.assertEqual(body.strip(), "body")

    def test_it_reads_numbers_booleans_and_lists(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "x.md"
            path.write_text(
                "---\nkind: k\nreadingTime: 3\nwhen:\n  leftHandOnly: true\n"
                "concepts: [a, b]\n---\n\nbody\n",
                encoding="utf-8",
            )
            meta, _ = read_front_matter(path)
        self.assertEqual(meta["readingTime"], 3)
        self.assertIs(meta["when"]["leftHandOnly"], True)
        self.assertEqual(meta["concepts"], ["a", "b"])

    def test_a_file_with_no_front_matter_is_all_body(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "x.md"
            path.write_text("no front matter here\n", encoding="utf-8")
            meta, body = read_front_matter(path)
        self.assertEqual(meta, {})
        self.assertIn("no front matter", body)


class TestDrillKinds(unittest.TestCase):
    def test_the_kinds_are_read_from_the_typescript_not_copied(self) -> None:
        kinds = validate.runtime_drill_kinds()
        # It was twelve when the phase was written and nineteen by the time it
        # ran; a copy of the list here would have gone stale silently.
        self.assertGreaterEqual(len(kinds), 12)
        self.assertIn("note-flash", kinds)
        self.assertIn("ear-tune", kinds)

    def test_a_missing_file_is_refused(self) -> None:
        errors = validate.tip_errors([], TIPS_DIR.parent / "does-not-exist")
        self.assertTrue(errors)


class TestTipRules(unittest.TestCase):
    """Each rule, proved by something that breaks it."""

    def setUp(self) -> None:
        self.tmp = Path(tempfile.mkdtemp())
        self.catalog = [{"drill": {"kind": "note-flash", "params": {"clef": "bass"}}}]

    def errors(self) -> list[str]:
        return [e for e in validate.tip_errors(self.catalog, self.tmp) if "has no tips file" not in e]

    def test_a_good_file_passes(self) -> None:
        write(self.tmp, "note-flash.md", GOOD)
        self.assertEqual(self.errors(), [])

    def test_headings_out_of_order_are_refused(self) -> None:
        swapped = GOOD.replace("## What it's for", "## TEMP").replace(
            "## How to practise it", "## What it's for"
        ).replace("## TEMP", "## How to practise it")
        write(self.tmp, "note-flash.md", swapped)
        self.assertTrue(any("in that order" in e for e in self.errors()))

    def test_a_missing_heading_is_refused(self) -> None:
        write(self.tmp, "note-flash.md", GOOD.replace("## Common mistake", "## Something else"))
        self.assertTrue(any("headings are" in e for e in self.errors()))

    def test_an_essay_is_refused(self) -> None:
        long = GOOD.replace("Short and often.", "word " * (validate.MAX_TIP_WORDS + 10))
        write(self.tmp, "note-flash.md", long)
        self.assertTrue(any("over the" in e for e in self.errors()))

    def test_a_file_with_no_kind_is_refused(self) -> None:
        write(self.tmp, "note-flash.md", GOOD.replace("kind: note-flash", "title: something"))
        self.assertTrue(any("no `kind`" in e for e in self.errors()))

    def test_a_variant_needs_a_when_block(self) -> None:
        write(self.tmp, "note-flash.md", GOOD)
        write(self.tmp, "note-flash.bass.md", GOOD)
        self.assertTrue(any("needs a `when:`" in e for e in self.errors()))

    def test_a_variant_naming_an_unknown_parameter_is_refused(self) -> None:
        # The quiet failure this rule exists for: a `when:` that never matches
        # produces no error at runtime and no variant, and looks like nothing.
        write(self.tmp, "note-flash.md", GOOD)
        write(
            self.tmp,
            "note-flash.bass.md",
            GOOD.replace("kind: note-flash", "kind: note-flash\nwhen:\n  nonsense: yes"),
        )
        self.assertTrue(any("not a drill parameter" in e for e in self.errors()))

    def test_a_variant_naming_a_real_parameter_passes(self) -> None:
        write(self.tmp, "note-flash.md", GOOD)
        write(
            self.tmp,
            "note-flash.bass.md",
            GOOD.replace("kind: note-flash", "kind: note-flash\nwhen:\n  clef: bass"),
        )
        self.assertEqual(self.errors(), [])

    def test_the_default_file_may_not_carry_a_when(self) -> None:
        write(
            self.tmp,
            "note-flash.md",
            GOOD.replace("kind: note-flash", "kind: note-flash\nwhen:\n  clef: bass"),
        )
        self.assertTrue(any("must have no `when:`" in e for e in self.errors()))

    def test_a_filename_that_does_not_match_its_kind_is_refused(self) -> None:
        write(self.tmp, "something-else.md", GOOD)
        self.assertTrue(any("does not start with its kind" in e for e in self.errors()))


class TestShippedTips(unittest.TestCase):
    """What is actually in the repository."""

    def test_every_runtime_kind_has_a_file(self) -> None:
        for kind in validate.runtime_drill_kinds():
            self.assertTrue(
                (TIPS_DIR / f"{kind}.md").is_file(), f"content/tips/{kind}.md is missing"
            )

    def test_the_shipped_files_pass_every_rule(self) -> None:
        if not CATALOG.is_file():
            self.skipTest("no build in this tree")
        catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
        self.assertEqual(validate.tip_errors(catalog, TIPS_DIR), [])

    def test_every_variant_names_a_kind_that_exists(self) -> None:
        kinds = set(validate.runtime_drill_kinds())
        for path in TIPS_DIR.glob("*.md"):
            meta, _ = read_front_matter(path)
            self.assertIn(meta.get("kind"), kinds, path.name)


class TestPracticeModule(unittest.TestCase):
    """The five lessons the comprehensiveness check found missing (replan §8)."""

    def test_all_five_exist_and_are_on_the_practice_track(self) -> None:
        stage = json.loads(
            (REPO_ROOT / "content" / "curriculum" / "stage-1.json").read_text(encoding="utf-8")
        )
        lessons = [
            lesson
            for st in stage["stages"]
            for unit in st["units"]
            if unit.get("track") == "practice"
            for lesson in unit["lessons"]
        ]
        self.assertEqual([lesson["id"] for lesson in lessons],
                         ["practice.1", "practice.2", "practice.3", "practice.4", "practice.5"])
        for lesson in lessons:
            # Not optionsExempt: each one has real material to try the method on.
            self.assertFalse(lesson.get("optionsExempt"))
            self.assertGreaterEqual(len(lesson["exerciseOptions"]), 3)
            self.assertTrue((REPO_ROOT / "content" / lesson["textFile"]).is_file())

    def test_the_track_is_declared(self) -> None:
        tracks = json.loads(
            (REPO_ROOT / "content" / "curriculum" / "00-tracks.json").read_text(encoding="utf-8")
        )
        self.assertIn("practice", [track["id"] for track in tracks["tracks"]])

    def test_the_plateau_lesson_the_coach_links_to_exists(self) -> None:
        # `coaching.ts` sends a stalled learner to `practice.5`; a dead link
        # there would be the one place the advice is least welcome.
        source = (REPO_ROOT / "app" / "src" / "engine" / "drills" / "coaching.ts").read_text(
            encoding="utf-8"
        )
        self.assertIn("PLATEAU_LESSON = 'practice.5'", source)
        self.assertTrue((REPO_ROOT / "content" / "lessons" / "practice.5.md").is_file())


if __name__ == "__main__":  # pragma: no cover
    unittest.main()
