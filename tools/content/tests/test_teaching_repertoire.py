"""
The seed list of teaching repertoire (E28; E2 item 5): `content/sources/teaching-repertoire.json`.

A proposal source, by the reviewer's ruling on E28: public-domain works a teacher reaches for
first, each with the lesson concepts it is known for, read by the finder's prompts, the excerpt
proposer's parent order and the app's external recommendations — and by nothing that admits,
places or approves. Held here:

- every work named: a composer, the work, what it is known for, a confidence;
- every concept an id of `content/curriculum/concepts.json`;
- every composition public domain where copyright runs for the author's life and seventy years;
- every catalogue key one the build wrote for an edition of the work, never an in-copyright one;
- the readers are the three proposal readers and nothing else.
"""
from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

TOOLS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(TOOLS))

REPO = TOOLS.parents[1]
SEED = REPO / "content" / "sources" / "teaching-repertoire.json"
CONCEPTS = REPO / "content" / "curriculum" / "concepts.json"
BUILT = REPO / "app" / "public" / "content" / "catalog.json"

#: A composition is public domain where copyright runs for life plus seventy years once the
#: composer died more than seventy years before this year's first day.
LAST_PUBLIC_DOMAIN_DEATH = 1955


class TheSeedList(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.seed = json.loads(SEED.read_text(encoding="utf-8"))
        cls.concepts = {c["id"] for c in json.loads(CONCEPTS.read_text(encoding="utf-8"))["concepts"]}

    def test_it_says_what_it_is_and_names_every_work(self) -> None:
        self.assertEqual(self.seed["v"], 1)
        self.assertIn("proposal source", self.seed["about"])
        self.assertGreater(len(self.seed["works"]), 0)
        for work in self.seed["works"]:
            with self.subTest(work.get("work")):
                for field in ("composer", "work", "known"):
                    self.assertIsInstance(work[field], str)
                    self.assertTrue(work[field].strip(), field)
                self.assertIn(work["confidence"], ("low", "medium", "high"))
                self.assertIsInstance(work["catalogue"], list)
        pairs = [(w["composer"], w["work"]) for w in self.seed["works"]]
        self.assertEqual(len(pairs), len(set(pairs)), "a work named twice")

    def test_every_concept_is_one_the_curriculum_defines(self) -> None:
        for work in self.seed["works"]:
            with self.subTest(work["work"]):
                self.assertTrue(work["concepts"], "a work known for nothing")
                self.assertEqual(set(work["concepts"]) - self.concepts, set())

    def test_every_composition_is_public_domain(self) -> None:
        for work in self.seed["works"]:
            with self.subTest(work["work"]):
                self.assertIsInstance(work["died"], int)
                self.assertLessEqual(work["died"], LAST_PUBLIC_DOMAIN_DEATH)

    def test_every_catalogue_key_is_an_edition_the_build_wrote_and_none_is_in_copyright(self) -> None:
        if not BUILT.is_file():
            self.fail(f"{BUILT} is missing: run `python tools/content/build.py` first (CI: 'Build content')")
        catalog = json.loads(BUILT.read_text(encoding="utf-8"))
        by_key: dict[str, list[dict]] = {}
        for entry in catalog:
            key = (entry.get("provenance") or {}).get("composition")
            if key:
                by_key.setdefault(key, []).append(entry)
        for work in self.seed["works"]:
            for key in work["catalogue"]:
                with self.subTest(key):
                    self.assertIn(key, by_key, f"{work['work']}: no catalogue entry has this composition key")
                    for entry in by_key[key]:
                        self.assertNotEqual(entry.get("compositionStatus"), "in-copyright", entry["id"])
                        self.assertEqual(entry.get("type"), "song", entry["id"])

    def test_only_the_proposal_readers_read_it(self) -> None:
        readers = sorted(
            path.relative_to(REPO).as_posix()
            for folder in (REPO / "tools", REPO / "app" / "src")
            for path in folder.rglob("*")
            if path.suffix in (".py", ".ts") and "tests" not in path.parts and "teaching-repertoire" in path.read_text(encoding="utf-8", errors="ignore")
        )
        self.assertEqual(readers, ["app/src/curriculum/candidates.ts", "tools/content/excerpt_proposer.py", "tools/content/finder.py"])


if __name__ == "__main__":
    unittest.main()
