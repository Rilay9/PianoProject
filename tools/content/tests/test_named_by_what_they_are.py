"""
Generated objects are named by what they are, and no generated text states a genre universal
(D0 item 7; G11, Part 15 §17; the contextual claims are F's and G's, T42-T45).

A I-V-vi-IV loop, a i-bVII-bVI-bVII vamp, son clave, a tumbao pattern, a ii-V-I progression:
the generator names the pattern. Where, how often and in which traditions it occurs is the
lessons' to say, re-earned by Wave F and G. So none of the retired genre universals below may
appear in a generated item's title, printed direction or tags, in the generator's docstrings
and comments, in the family contracts, or in `docs/02` Part E and E2 (the catalogue facts the
generator writes and the spec that describes them). Each phrase is listed with where it came
from: the audit's examples (T42, T43, T45) and the lines of `generate_exercises.py` and `docs/02`
that D0 rewrote to the pattern's name.
"""
from __future__ import annotations

import re
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import family_contracts as FC  # noqa: E402
import generate_exercises as G  # noqa: E402
from tests import planned  # noqa: E402

REPO = Path(__file__).resolve().parents[3]

#: (phrase, where it was retired from). Matched case-insensitively.
RETIRED = [
    ("the tension never resolves", "T42"),
    ("the blues is mostly space", "T42"),
    ("every boogie bass since is a copy", "T42"),
    ("most 1920s bridges", "T43"),
    ("almost every heavy piano part", "T45"),
    ("the sound of most pop piano", "T45"),
    ("the sound of modal jazz", "make_open_voicing's docstring"),
    ("a great deal of film music", "make_open_voicing's docstring"),
    ("half the pop ballads", "make_slash_bass's docstring"),
    ("the pattern under ragtime", "make_stride's docstring"),
    ("the ragtime left hand", "make_oompah's and write_oompah_bar's docstrings"),
    ("single technical problem of the style", "make_oompah's docstring"),
    ("the one every standard ends with", "make_turnaround's docstring"),
    ("is *the* progression", "make_ii_v_i's docstring"),
    ("loop every pop song", "FOUR_CHORD_LOOP's comment; make_intro's docstring"),
    ("every blues and rock solo", "make_pentatonic's docstring"),
    ("under most latin music", "make_tresillo's docstring"),
    ("every habanera, tango", "make_tresillo's docstring"),
    ("every published tresillo", "make_tresillo's docstring"),
    ("a rhythm everybody plays", "make_tresillo's docstring"),
    ("most rock and metal", "make_modal_vamp's docstring"),
    ("is the rock voicing", "make_modal_vamp's docstring"),
    ("the style is built on", "make_tumbao's docstring and comment"),
    ("unmistakable error in the style", "make_montuno's docstring"),
    ("rock is playable long before", "make_riff's docstring"),
    ("the thing it is imitating", "make_riff's docstring"),
    ("can read late joplin", "make_secondary_rag's docstring"),
    ("exactly how it is played", "make_boogie's docstring"),
    ("what a player actually uses", "make_comping's docstring"),
    ("every blues method", "BOOGIE_PATTERNS' comment"),
    ("sounds inevitable", "make_walking_bass's docstring"),
    ("cheapest reharmonisation", "make_passing_chord's docstring"),
    ("the shuffle written out", "make_meter's docstring"),
    ("a minor blues is dorian", "docs/02 Part E2"),
    ("a horn section reads", "JAM_KEYS' comment; docs/02 Part E2"),
    ("which is what 12/8 *does* to the music", "docs/02 Part E2"),
]


def part_e() -> str:
    text = (REPO / "docs" / "02-curriculum.md").read_text(encoding="utf-8")
    start = text.index("## Part E — Technique syllabus")
    return text[start:text.index("## Part F", start)]


def texts() -> dict[str, str]:
    out = {
        "generate_exercises.py": Path(G.__file__).read_text(encoding="utf-8"),
        "family_contracts.json": FC.CONTRACTS.read_text(encoding="utf-8"),
        "docs/02 Part E and E2": part_e(),
    }
    from music21 import expressions  # noqa: PLC0415

    for sc, entry in planned.plan():
        printed = [t.content for p in sc.parts for t in p.recurse().getElementsByClass(expressions.TextExpression)]
        out[entry["id"]] = "\n".join([entry["title"], *printed, *entry["concepts"]])
    return out


def found_in(text: str) -> list[str]:
    flat = re.sub(r"\s+", " ", text).lower()
    return [phrase for phrase, _source in RETIRED if phrase.lower() in flat]


class TestNoGenreUniversal(unittest.TestCase):
    def test_no_title_direction_tag_docstring_contract_or_spec_line_carries_one(self) -> None:
        hits = {where: found for where, text in texts().items() if (found := found_in(text))}
        self.assertEqual(hits, {})

    def test_the_check_reads_what_it_says_it_reads(self) -> None:
        self.assertEqual(found_in("The loop every pop song is made of, and\n    the sound of modal jazz."),
                         ["the sound of modal jazz", "loop every pop song"])
        self.assertGreater(len(texts()), 1000, "the plan's items are read, not a sample")

    def test_the_retired_list_names_where_each_phrase_came_from(self) -> None:
        for phrase, source in RETIRED:
            with self.subTest(phrase=phrase):
                self.assertTrue(source)
                self.assertEqual(phrase, phrase.strip())


class TestNamedByWhatTheyAre(unittest.TestCase):
    """The reviewer's own examples, as the families write them."""

    def test_the_patterns_the_reviewer_names(self) -> None:
        titles = {entry["id"]: entry["title"] for _sc, entry in planned.plan()}
        self.assertIn("I-V-vi-IV", titles["exercise.loop4.c.root"])
        self.assertIn("i, flat seven, flat six", titles["exercise.modal-vamp.a"])
        self.assertIn("son 3-2", titles["exercise.clave.son-3-2"])
        self.assertIn("Tumbao", titles["exercise.tumbao.c"])
        self.assertIn("ii-V-I", titles["exercise.ii-v-i.c"])
        for family, row in FC.contracts().items():
            with self.subTest(family=family):
                self.assertNotRegex(row["name"].lower(), r"\b(every|most|all)\b")


if __name__ == "__main__":
    unittest.main()
