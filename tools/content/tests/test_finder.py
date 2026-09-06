"""
Generated finders (replan §4.1, §4.2).

The prompts are generated rather than authored so that one wording change
fixes 83 rungs at once — which only helps if the generator is checked, because
a bad wording now breaks 83 rungs at once too.
"""
from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

TOOLS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(TOOLS))

import finder  # noqa: E402
import validate  # noqa: E402

REPO_ROOT = TOOLS.parents[1]
CURRICULUM_SRC = REPO_ROOT / "content" / "curriculum"
BUILT = REPO_ROOT / "app" / "public" / "content" / "curriculum.json"

SAMPLE = {
    "skill": "hands together with a held left hand",
    "levelWords": "very easy, beginner, C position",
    "constraints": ["C major", "left hand whole notes", "8 to 16 bars"],
    "avoid": ["chords in the right hand", "6/8"],
    "examples": [{"title": "Ode to Joy", "composer": "Beethoven", "note": "bundled"}],
    "formats": "MusicXML or .mxl preferred; a PDF works but cannot be scored.",
}


class TestSearchQuery(unittest.TestCase):
    def test_it_is_keywords_and_ends_with_the_format(self) -> None:
        query = finder.search_query(SAMPLE)
        self.assertTrue(query.startswith("piano sheet music"))
        self.assertTrue(query.endswith("musicxml"))

    def test_every_constraint_reaches_the_query(self) -> None:
        query = finder.search_query(SAMPLE).lower()
        for constraint in SAMPLE["constraints"]:
            self.assertIn(constraint.lower(), query)

    def test_a_repeated_phrase_is_dropped_but_a_shared_word_is_not(self) -> None:
        # "C position, C major" must not collapse to "C position major", which
        # is neither a key nor anything else. Only whole repeats go.
        block = dict(SAMPLE, levelWords="C position, very easy", constraints=["C major", "C major"])
        query = finder.search_query(block)
        self.assertIn("C position", query)
        self.assertIn("C major", query)
        self.assertEqual(query.count("C major"), 1)


class TestChatPrompt(unittest.TestCase):
    def test_it_carries_skill_level_constraints_and_avoids(self) -> None:
        prompt = finder.chat_prompt(SAMPLE, what='Stage 2, "Hands together"')
        self.assertIn(SAMPLE["skill"], prompt)
        self.assertIn(SAMPLE["levelWords"], prompt)
        for constraint in SAMPLE["constraints"]:
            self.assertIn(constraint, prompt)
        for avoid in SAMPLE["avoid"]:
            self.assertIn(avoid, prompt)

    def test_it_states_the_copyright_position_rather_than_dodging_it(self) -> None:
        prompt = finder.chat_prompt(SAMPLE, what="x")
        self.assertIn(finder.COPYRIGHT_MARKER, prompt)

    def test_it_never_asks_for_a_download(self) -> None:
        prompt = finder.chat_prompt(SAMPLE, what="x").lower()
        for word in validate.DOWNLOAD_WORDS:
            self.assertNotIn(word, prompt)

    def test_examples_are_named_with_their_composer(self) -> None:
        self.assertIn("Ode to Joy (Beethoven)", finder.chat_prompt(SAMPLE, what="x"))

    def test_a_finder_with_no_examples_still_generates(self) -> None:
        block = dict(SAMPLE)
        del block["examples"]
        self.assertIn("It must have", finder.chat_prompt(block, what="x"))


class TestValidatorRules(unittest.TestCase):
    """The four rules from §4.1, each proved by something that breaks it."""

    def curriculum(self, block: dict) -> dict:
        return {
            "stages": [{"units": [{"lessons": [{"id": "x", "finder": block}]}]}],
            "concepts": [],
        }

    def generated(self, **over) -> dict:
        block = finder.generate(dict(SAMPLE, **over), what="x")
        return block

    def test_a_good_finder_passes(self) -> None:
        self.assertEqual(validate.finder_errors(self.curriculum(self.generated())), [])

    def test_a_prompt_over_the_limit_is_refused(self) -> None:
        block = self.generated()
        block["chatPrompt"] = "x" * (finder.MAX_CHAT_PROMPT + 1)
        errors = validate.finder_errors(self.curriculum(block))
        self.assertTrue(any("over the" in e for e in errors), errors)

    def test_a_constraint_that_did_not_survive_is_refused(self) -> None:
        block = self.generated()
        block["chatPrompt"] = block["chatPrompt"].replace("left hand whole notes", "something else")
        errors = validate.finder_errors(self.curriculum(block))
        self.assertTrue(any("is missing from the chat prompt" in e for e in errors), errors)

    def test_losing_the_copyright_sentence_is_refused(self) -> None:
        block = self.generated()
        block["chatPrompt"] = block["chatPrompt"].replace(finder.COPYRIGHT_SENTENCE, "")
        errors = validate.finder_errors(self.curriculum(block))
        self.assertTrue(any("D18" in e for e in errors), errors)

    def test_asking_for_a_download_is_refused(self) -> None:
        block = self.generated()
        block["chatPrompt"] += " Please download the PDF."
        errors = validate.finder_errors(self.curriculum(block))
        self.assertTrue(any("D18 forbids" in e for e in errors), errors)

    def test_a_non_exempt_rung_with_no_finder_is_refused(self) -> None:
        curriculum = {"stages": [{"units": [{"lessons": [{"id": "x"}]}]}], "concepts": []}
        self.assertTrue(validate.finder_errors(curriculum))

    def test_an_exempt_rung_needs_none(self) -> None:
        curriculum = {
            "stages": [{"units": [{"lessons": [{"id": "x", "optionsExempt": True}]}]}],
            "concepts": [],
        }
        self.assertEqual(validate.finder_errors(curriculum), [])

    def test_a_concept_a_lesson_names_must_exist(self) -> None:
        curriculum = {
            "stages": [{"units": [{"lessons": [{"id": "x", "concepts": ["legato", "ghost"]}]}]}],
            "concepts": [{"id": "legato", "display": "Legato"}],
        }
        errors = validate.unknown_concepts(curriculum)
        self.assertEqual(len(errors), 1)
        self.assertIn("ghost", errors[0])


class TestNeeds(unittest.TestCase):
    """replan §4.2: the lesson page reads this rather than recounting."""

    def lesson(self, **over) -> dict:
        base = {
            "id": "x",
            "exerciseOptions": ["e1", "e2", "e3"],
            "songOptions": ["s1", "s2"],
            "levelBand": [1.0, 3.0],
        }
        base.update(over)
        return base

    def run_needs(self, lesson: dict, catalog: list, tmp: Path) -> dict:
        curriculum = {"stages": [{"units": [{"lessons": [lesson]}]}], "concepts": []}
        validate.write_needs(curriculum, catalog, tmp, 3)
        return lesson["needs"]

    def test_it_counts_what_is_short_of_the_floor(self) -> None:
        import tempfile

        with tempfile.TemporaryDirectory() as tmp:
            needs = self.run_needs(self.lesson(), [], Path(tmp))
        self.assertEqual(needs["songs"], 1)
        self.assertEqual(needs["exercises"], 0)
        self.assertEqual(needs["floor"], 3)

    def test_a_song_optional_rung_counts_both_lists_together(self) -> None:
        import tempfile

        with tempfile.TemporaryDirectory() as tmp:
            needs = self.run_needs(
                self.lesson(songOptional=True, exerciseOptions=["e1"], songOptions=[]),
                [],
                Path(tmp),
            )
        # One option against a floor of three: short by two, and it does not
        # matter which list they arrive in.
        self.assertEqual(needs["songs"], 0)
        self.assertEqual(needs["exercises"], 2)

    def test_it_counts_the_options_inside_the_level_band(self) -> None:
        import tempfile

        catalog = [
            {"id": "e1", "level": 2.0},
            {"id": "e2", "level": 9.0},
            {"id": "s1", "level": 1.5},
        ]
        with tempfile.TemporaryDirectory() as tmp:
            needs = self.run_needs(self.lesson(), catalog, Path(tmp))
        self.assertEqual(needs["inBand"], 2)

    def test_an_exempt_rung_gets_none(self) -> None:
        import tempfile

        lesson = self.lesson(optionsExempt=True)
        with tempfile.TemporaryDirectory() as tmp:
            curriculum = {"stages": [{"units": [{"lessons": [lesson]}]}], "concepts": []}
            validate.write_needs(curriculum, [], Path(tmp), 3)
        self.assertNotIn("needs", lesson)


class TestShippedContent(unittest.TestCase):
    """What is actually in the repository, not a fixture."""

    @classmethod
    def setUpClass(cls) -> None:
        cls.concepts = json.loads(
            (CURRICULUM_SRC / "concepts.json").read_text(encoding="utf-8")
        )["concepts"]

    def test_every_concept_a_lesson_uses_has_a_display_name(self) -> None:
        known = {c["id"] for c in self.concepts}
        used: set[str] = set()
        for path in sorted(CURRICULUM_SRC.glob("stage-*.json")):
            data = json.loads(path.read_text(encoding="utf-8"))
            for stage in data.get("stages", []):
                for unit in stage.get("units", []):
                    for lesson in unit.get("lessons", []):
                        used.update(lesson.get("concepts", []))
        self.assertEqual(used - known, set())

    def test_no_display_name_is_the_raw_id(self) -> None:
        # The whole point of the file: the Skills screen used to print `Cc64`.
        for concept in self.concepts:
            self.assertNotEqual(concept["display"], concept["id"])

    def test_every_non_exempt_rung_has_an_authored_finder(self) -> None:
        missing = []
        for path in sorted(CURRICULUM_SRC.glob("stage-*.json")):
            data = json.loads(path.read_text(encoding="utf-8"))
            for stage in data.get("stages", []):
                for unit in stage.get("units", []):
                    for lesson in unit.get("lessons", []):
                        if not lesson.get("optionsExempt") and "finder" not in lesson:
                            missing.append(lesson["id"])
        self.assertEqual(missing, [])

    def test_the_built_curriculum_carries_both_prompts_everywhere(self) -> None:
        if not BUILT.is_file():
            self.skipTest("no build in this tree")
        built = json.loads(BUILT.read_text(encoding="utf-8"))
        self.assertEqual(validate.finder_errors(built), [])
        self.assertEqual(validate.unknown_concepts(built), [])


if __name__ == "__main__":  # pragma: no cover
    unittest.main()
