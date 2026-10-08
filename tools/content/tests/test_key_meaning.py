"""
What each generator family's `key` parameter means, and every generated file against it (2026-10-07).

The proving run (`docs/classifier/proving/2026-10-07/results.json`, row `generated.spec-declared`) read the
catalogue's `drill.params.key` as a tonic on 1,134 generated files and found 100 disagreeing with the file's key
signature: the chromatic scale and the two seventh-chord families use `key` for a starting note and a chord
root, written with no signature. The classifier row `generated.spec-interpreted` recorded the per-family
meaning as missing. `family_contracts.json` now states it on each row (`parameters.key`), the generator refuses
a `key` its row gives no meaning (`family_contracts.stamp`), and `family_contracts.key_faults` holds the written
file to the declared meaning with its own MusicXML reader, independent of the generator.

The fixtures pin the reader and each meaning, near-misses included. `TestEveryGeneratedFile` reads the built
catalogue: run `python tools/content/build.py` first (CI: the step 'Build content', before 'Content pipeline
tests').
"""
from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import family_contracts as FC  # noqa: E402

REPO = Path(__file__).resolve().parents[3]
BUILT = REPO / "app" / "public" / "content"


def musicxml(notes: list[list[tuple[str, int, int]]], *, fifths: int | None = 0, mode: str = "major") -> str:
    """One staff, one quarter per instant; each instant a list of (step, alter, octave) struck together."""
    key = "" if fifths is None else f"<key><fifths>{fifths}</fifths><mode>{mode}</mode></key>"
    body = []
    for instant in notes:
        for i, (step, alter, octave) in enumerate(instant):
            alter_el = f"<alter>{alter}</alter>" if alter else ""
            chord = "<chord/>" if i else ""
            body.append(f"<note>{chord}<pitch><step>{step}</step>{alter_el}<octave>{octave}</octave></pitch>"
                        "<duration>1</duration><type>quarter</type></note>")
    return ("<?xml version='1.0' encoding='UTF-8'?><score-partwise version='4.0'><part-list>"
            "<score-part id='P1'><part-name>Piano</part-name></score-part></part-list><part id='P1'>"
            f"<measure number='1'><attributes><divisions>1</divisions>{key}<time><beats>{max(1, len(notes))}</beats>"
            f"<beat-type>4</beat-type></time></attributes>{''.join(body)}</measure></part></score-partwise>")


def row(means: str, mode: list | None = None) -> dict:
    declared: dict = {"means": means, "why": "fixture"}
    if mode is not None:
        declared["mode"] = mode
    return {"maker": "fixture", "parameters": {"key": declared}}


def entry(**params) -> dict:
    return {"hands": "right", "drill": {"params": params}}


MAJOR = [{"mode": "major"}]
BY_QUALITY = [{"when": {"quality": "minor"}, "mode": "minor"}, {"mode": "major"}]


class Case(unittest.TestCase):
    def faults(self, contract: dict, item: dict, xml: str) -> list[str]:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "item.musicxml"
            path.write_text(xml, encoding="utf-8")
            return FC.key_faults(contract, item, path)


class TestTonic(Case):
    def test_the_signatures_tonic_and_mode_agree(self) -> None:
        self.assertEqual(self.faults(row("tonic", MAJOR), entry(key="B-"), musicxml([[("B", -1, 4)]], fifths=-2)), [])
        minor = musicxml([[("A", 0, 4)]], fifths=0, mode="minor")
        self.assertEqual(self.faults(row("tonic", BY_QUALITY), entry(key="A", quality="minor"), minor), [])

    def test_the_relative_key_is_a_disagreement(self) -> None:
        # A minor's signature under a recipe that says C: the same signature, another tonic.
        self.assertTrue(self.faults(row("tonic", MAJOR), entry(key="C"), musicxml([[("C", 0, 4)]], fifths=0, mode="minor")))

    def test_the_mode_comes_from_the_recipe(self) -> None:
        # A minor-quality recipe in a major signature on the same tonic.
        self.assertTrue(self.faults(row("tonic", BY_QUALITY), entry(key="D", quality="minor"),
                                    musicxml([[("D", 0, 4)]], fifths=2)))

    def test_an_enharmonic_signature_is_a_disagreement(self) -> None:
        # Six sharps is F# major, not G flat: the tonic is compared as spelled.
        self.assertTrue(self.faults(row("tonic", MAJOR), entry(key="G-"), musicxml([[("F", 1, 4)]], fifths=6)))

    def test_the_proving_runs_reading_fails_the_chromatic_scale(self) -> None:
        # The near-miss the proving run made: a chromatic scale from D, written with no signature, read as a tonic.
        scale = musicxml([[("D", 0, 4)], [("D", 1, 4)], [("E", 0, 4)]], fifths=0)
        self.assertTrue(self.faults(row("tonic", MAJOR), entry(key="D"), scale))
        self.assertEqual(self.faults(row("starting-note"), entry(key="D"), scale), [])


class TestStartingNote(Case):
    def test_every_note_struck_first_is_the_starting_note(self) -> None:
        both = musicxml([[("D", 0, 3), ("D", 0, 4)], [("E", -1, 3), ("E", -1, 4)]], fifths=None)
        self.assertEqual(self.faults(row("starting-note"), entry(key="D"), both), [])

    def test_another_first_note_is_a_disagreement(self) -> None:
        self.assertTrue(self.faults(row("starting-note"), entry(key="D"), musicxml([[("E", 0, 4)], [("D", 0, 4)]])))


class TestChordRoot(Case):
    def test_a_struck_chord(self) -> None:
        g7 = musicxml([[("G", 0, 3), ("B", 0, 3), ("D", 0, 4), ("F", 0, 4)]])
        self.assertEqual(self.faults(row("chord-root"), entry(key="G"), g7), [])
        self.assertTrue(self.faults(row("chord-root"), entry(key="B"), g7))

    def test_a_broken_chord_up_to_its_octave(self) -> None:
        arpeggio = musicxml([[("A", 0, 3)], [("C", 1, 4)], [("E", 0, 4)], [("G", 0, 4)], [("A", 0, 4)], [("C", 1, 5)]])
        self.assertEqual(self.faults(row("chord-root"), entry(key="A"), arpeggio), [])
        self.assertEqual(FC.written_key_facts_from_text(arpeggio)["chord"], ["A3", "C#4", "E4", "G4"])

    def test_the_respelled_diminished_seventh_keeps_its_root(self) -> None:
        # The generator prints C diminished 7th's B double flat as A (`_readable`). By pitch class C is a root;
        # a spelled reading of C E-flat G-flat A names A, which is why the reading is by pitch class.
        dim = musicxml([[("C", 0, 4)], [("E", -1, 4)], [("G", -1, 4)], [("A", 0, 4)], [("C", 0, 5)]])
        self.assertEqual(self.faults(row("chord-root"), entry(key="C"), dim), [])

    def test_a_line_that_is_no_chord_is_a_disagreement(self) -> None:
        steps = musicxml([[("C", 0, 4)], [("D", 0, 4)], [("E", 0, 4)], [("F", 0, 4)], [("C", 0, 4)]])
        self.assertTrue(self.faults(row("chord-root"), entry(key="C"), steps))


class TestTheDeclaration(unittest.TestCase):
    def test_a_key_with_no_declared_meaning_is_refused(self) -> None:
        with self.assertRaises(KeyError):
            FC.key_meaning({"maker": "fixture"}, {"key": "C"})

    def test_a_recipe_with_no_key_needs_none(self) -> None:
        self.assertIsNone(FC.key_meaning({"maker": "fixture"}, {"pattern": "son"}))

    def test_every_declared_meaning_is_a_known_one_and_every_tonic_has_a_default_mode(self) -> None:
        for family, contract in FC.contracts().items():
            declared = (contract.get("parameters") or {}).get("key")
            if declared is None:
                continue
            with self.subTest(family=family):
                self.assertIn(declared["means"], FC.KEY_MEANINGS)
                self.assertTrue(declared.get("why"))
                if declared["means"] == "tonic":
                    self.assertNotIn("when", declared["mode"][-1], "the last mode rule is the default")
                    self.assertTrue(all(rule["mode"] in ("major", "minor") for rule in declared["mode"]))
                else:
                    self.assertNotIn("mode", declared)


class TestEveryGeneratedFile(unittest.TestCase):
    """Every generated catalogue item with a `key`: its family declares the meaning and the built file agrees."""

    def test_the_built_files_agree_with_the_declared_meaning(self) -> None:
        path = BUILT / "catalog.json"
        if not path.is_file():
            raise AssertionError(f"{path} is missing, and this test reads the built content: run "
                                 "`python tools/content/build.py` first")
        checked, faults = 0, []
        for item in json.loads(path.read_text(encoding="utf-8")):
            generator = (item.get("drill") or {}).get("generator") or {}
            if "key" not in ((item.get("drill") or {}).get("params") or {}) or not item.get("file"):
                continue
            family = generator.get("family")
            if family not in FC.contracts():
                continue
            checked += 1
            try:
                found = FC.key_faults(FC.contract(family), item, BUILT / item["file"])
            except KeyError as undeclared:
                found = [str(undeclared)]
            faults.extend(f"{item['id']} ({family}): {fault}" for fault in found)
        self.assertGreater(checked, 1000, "the generated items with a key were not found")
        self.assertEqual(faults, [], f"{len(faults)} of {checked} disagree")


if __name__ == "__main__":
    unittest.main()
