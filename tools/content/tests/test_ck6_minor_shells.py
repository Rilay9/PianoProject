"""
CK-6: the minor ii-V-i shell drill's nine cases against music21 (A7b.1, lane G6a).

`drill.jazz.minor-ii-v-i-shells` asks for nine shells: iiø7, V7 and the tonic the chart prints,
in C minor (Cm6, Blue Bossa's tonic), A minor (Am7) and G minor (Gm7). The cases are data on the
catalogue row; nothing in the app derives them from a scale. This file is the Python half of the
check, after the evaluator-twins precedent:

- `CASES` is the settled table (`docs/prompts/runs/curriculum-review-2026-10-05/briefs/
  g6-minor-shells.md`, *The nine cases*): key, numeral, symbol, and the configured target voicing
  as chord steps (root-3-7, or root-3-6 for the m6 chord).
- `reading(CASES)` is music21's reading of every case: the symbol's root, pitch classes and
  spelled pitches (`harmony.ChordSymbol`), the numeral's root, third and pitch classes in its key
  (`roman.RomanNumeral(fig, key.Key(tonic))`), and the shell members drawn from the symbol's own
  chord by `getChordStep`; and the named key's signature (`key.Key(tonic).sharps`) with the
  accidental each shell member takes against it (G6b: the answer staff is written in the key the
  prompt names, so G7's B in C minor carries a natural and E7's G sharp in A minor a sharp).
- `fixtures/ck6_minor_shells.json` is that reading, committed. The app half
  (`app/tests/unit/minorShellDrill.test.ts`) holds the built row's prompts to it: pitch classes,
  three notes, no fifth, the label naming the symbol, the answer staff's steps and alters, its key
  signature and the accidentals it implies.

Here: the committed fixture must equal music21's reading of the settled table; the catalogue row
must carry exactly the settled table; the numeral and the symbol must agree (one fact stated
twice); and every adversary the brief names must make the comparison go red.

`CK6_WRITE=1` rewrites the fixture from music21, for a deliberate change to the settled table
only, never to turn a red case green without reading why it moved.
"""
from __future__ import annotations

import copy
import json
import os
import unittest
from pathlib import Path

from music21 import harmony, key, roman

ROOT = Path(__file__).resolve().parents[3]
FIXTURE = Path(__file__).resolve().parent / "fixtures" / "ck6_minor_shells.json"
CATALOG = ROOT / "content" / "catalog.static.json"
ITEM_ID = "drill.jazz.minor-ii-v-i-shells"

# The settled table, in the order the drill asks it. `key` is "<tonic> minor" as the row and the
# prompt write it; `shell` is the configured target voicing as chord steps.
CASES: list[dict] = [
    {"key": "C minor", "numeral": "iiø7", "symbol": "Dm7b5", "shell": [1, 3, 7]},
    {"key": "C minor", "numeral": "V7", "symbol": "G7", "shell": [1, 3, 7]},
    {"key": "C minor", "numeral": "i", "symbol": "Cm6", "shell": [1, 3, 6]},
    {"key": "A minor", "numeral": "iiø7", "symbol": "Bm7b5", "shell": [1, 3, 7]},
    {"key": "A minor", "numeral": "V7", "symbol": "E7", "shell": [1, 3, 7]},
    {"key": "A minor", "numeral": "i", "symbol": "Am7", "shell": [1, 3, 7]},
    {"key": "G minor", "numeral": "iiø7", "symbol": "Am7b5", "shell": [1, 3, 7]},
    {"key": "G minor", "numeral": "V7", "symbol": "D7", "shell": [1, 3, 7]},
    {"key": "G minor", "numeral": "i", "symbol": "Gm7", "shell": [1, 3, 7]},
]


def _music21_key(name: str) -> key.Key:
    tonic, mode = name.split()
    assert mode in ("minor", "major"), name
    # music21 reads a lower-case tonic as minor; the catalogue's flat sign is music21's own '-'.
    return key.Key(tonic.lower() if mode == "minor" else tonic)


def _pc(pitch) -> int:
    return pitch.pitchClass


def _spelled(pitch) -> dict:
    return {
        "name": pitch.name,
        "step": pitch.step,
        "alter": int(pitch.accidental.alter) if pitch.accidental else 0,
        "pc": pitch.pitchClass,
    }


_ACCIDENTAL = {-1: "flat", 0: "natural", 1: "sharp"}


def _accidental_against(k: key.Key, member: dict | None) -> str | None:
    """The accidental `member` is written with under `k`'s signature; None when the signature gives it."""
    if member is None:
        return None
    by_signature = k.accidentalByStep(member["step"])
    in_key = int(by_signature.alter) if by_signature is not None else 0
    return None if member["alter"] == in_key else _ACCIDENTAL[member["alter"]]


def reading(cases: list[dict]) -> list[dict]:
    """music21's reading of each case: what the symbol is, what the numeral is, what the shell keeps."""
    out = []
    for case in cases:
        symbol = harmony.ChordSymbol(case["symbol"])
        named_key = _music21_key(case["key"])
        numeral = roman.RomanNumeral(case["numeral"], named_key)
        members = []
        for step in case["shell"]:
            member = symbol.getChordStep(step)
            members.append(_spelled(member) if member is not None else None)
        fifth = symbol.getChordStep(5)
        out.append(
            {
                "key": case["key"],
                "numeral": case["numeral"],
                "symbol": case["symbol"],
                "shell_steps": list(case["shell"]),
                "symbol_root": _spelled(symbol.root()),
                "symbol_pcs": sorted({_pc(p) for p in symbol.pitches}),
                "symbol_spelled": [_spelled(p) for p in symbol.pitches],
                "fifth": _spelled(fifth) if fifth is not None else None,
                "numeral_root": _spelled(numeral.root()),
                "numeral_third": _spelled(numeral.third),
                "numeral_pcs": sorted({_pc(p) for p in numeral.pitches}),
                "shell": members,
                "shell_pcs": sorted({m["pc"] for m in members if m is not None}),
                "key_sharps": named_key.sharps,
                "shell_accidentals": [_accidental_against(named_key, m) for m in members],
            }
        )
    return out


def disagreements(fixture_cases: list[dict], read: list[dict]) -> list[str]:
    """Every difference between the committed fixture and a reading, one line each."""
    out = []
    if len(fixture_cases) != len(read):
        out.append(f"{len(fixture_cases)} cases in the fixture, {len(read)} read")
    for index, (want, got) in enumerate(zip(fixture_cases, read)):
        for field in sorted(set(want) | set(got)):
            if want.get(field) != got.get(field):
                out.append(f"case {index + 1} ({got.get('symbol')}) {field}: fixture {want.get(field)!r}, read {got.get(field)!r}")
    return out


def semantic_faults(read: list[dict]) -> list[str]:
    """The numeral and the symbol must state one fact; the shell must keep what the brief says."""
    out = []
    for case in read:
        name = f"{case['symbol']} ({case['numeral']} in {case['key']})"
        if case["numeral_root"]["name"] != case["symbol_root"]["name"]:
            out.append(f"{name}: numeral root {case['numeral_root']['name']} is not the symbol's root")
        if case["numeral"] in ("i", "i7"):
            # The tonic: music21 reads `i6` as a first-inversion triad, so the sixth is the symbol's
            # fact and the numeral states only the root and the minor third.
            if not set(case["numeral_pcs"]) <= set(case["symbol_pcs"]):
                out.append(f"{name}: the tonic triad {case['numeral_pcs']} is not inside the symbol")
            if case["numeral_third"]["name"] != case["shell"][1]["name"]:
                out.append(f"{name}: the numeral's third is not the shell's third")
        elif case["numeral_pcs"] != case["symbol_pcs"]:
            out.append(f"{name}: the numeral's chord {case['numeral_pcs']} is not the symbol's {case['symbol_pcs']}")
        if any(member is None for member in case["shell"]):
            out.append(f"{name}: a configured shell step is not in the chord")
            continue
        if len(case["shell_pcs"]) != 3:
            out.append(f"{name}: the shell has {len(case['shell_pcs'])} distinct notes, not three")
        if case["fifth"] is not None and case["fifth"]["pc"] in case["shell_pcs"]:
            out.append(f"{name}: the shell keeps the fifth")
        root = case["symbol_root"]["pc"]
        third = (case["shell"][1]["pc"] - root) % 12
        if case["numeral"].startswith("V") and third != 4:
            out.append(f"{name}: the dominant's third is not major")
        if case["numeral"][0].islower() and third != 3:
            out.append(f"{name}: a minor-quality numeral's shell has no minor third")
    return out


def load_fixture() -> dict:
    return json.loads(FIXTURE.read_text(encoding="utf-8"))


def catalog_row() -> dict | None:
    rows = json.loads(CATALOG.read_text(encoding="utf-8"))
    return next((row for row in rows if row.get("id") == ITEM_ID), None)


class CommittedFixtureIsMusic21sReading(unittest.TestCase):
    def test_fixture_equals_music21(self):
        read = reading(CASES)
        if os.environ.get("CK6_WRITE") == "1":
            FIXTURE.write_text(
                json.dumps(
                    {
                        "_comment": [
                            "CK-6 (A7b.1): music21's reading of the minor ii-V-i shell drill's nine cases.",
                            "Written by tools/content/tests/test_ck6_minor_shells.py with CK6_WRITE=1; read by that",
                            "file and by app/tests/unit/minorShellDrill.test.ts. Never hand-edited.",
                        ],
                        "item": ITEM_ID,
                        "cases": read,
                    },
                    ensure_ascii=False,
                    indent=2,
                )
                + "\n",
                encoding="utf-8",
            )
        fixture = load_fixture()
        self.assertEqual(fixture["item"], ITEM_ID)
        self.assertEqual(disagreements(fixture["cases"], read), [])

    def test_numeral_and_symbol_agree_and_shells_are_shells(self):
        self.assertEqual(semantic_faults(reading(CASES)), [])

    def test_boundary_am7b5_shell_is_am7s(self):
        # Expected green: the ♭5 is the omitted member, so the iiø7 shell in G minor and the tonic
        # shell in A minor are the same three notes. The lesson states this; it is not a defect.
        read = {case["symbol"]: case for case in reading(CASES)}
        self.assertEqual(read["Am7b5"]["shell_pcs"], read["Am7"]["shell_pcs"])
        self.assertNotEqual(read["Am7b5"]["symbol_pcs"], read["Am7"]["symbol_pcs"])


class CatalogueRowCarriesTheSettledTable(unittest.TestCase):
    def test_row_exists_and_is_a_shell_chord_drill(self):
        row = catalog_row()
        self.assertIsNotNone(row, f"{ITEM_ID} is not in content/catalog.static.json")
        self.assertEqual(row["type"], "drill")
        self.assertEqual(row["drill"]["kind"], "chord")
        self.assertEqual(row["drill"]["params"].get("voicing"), "shell")

    def test_row_cases_are_the_settled_nine_in_order(self):
        row = catalog_row()
        self.assertIsNotNone(row, f"{ITEM_ID} is not in content/catalog.static.json")
        got = [
            {"key": case.get("key"), "numeral": case.get("numeral"), "symbol": case.get("symbol")}
            for case in row["drill"]["params"].get("cases", [])
        ]
        want = [{"key": c["key"], "numeral": c["numeral"], "symbol": c["symbol"]} for c in CASES]
        self.assertEqual(got, want)


class EveryAdversaryGoesRed(unittest.TestCase):
    """Each case the brief names must make the check disagree; a check that cannot fail checks nothing."""

    def setUp(self):
        self.fixture = load_fixture()["cases"]

    def mutated(self, index: int, **change) -> list[dict]:
        cases = copy.deepcopy(CASES)
        cases[index].update(change)
        return cases

    def test_m7_shell_configured_for_cm6(self):
        # C-E♭-B♭ where the chart prints Cm6.
        read = reading(self.mutated(2, symbol="Cm7", shell=[1, 3, 7]))
        self.assertTrue(disagreements(self.fixture, read))
        self.assertEqual(read[2]["shell_pcs"], [0, 3, 10])

    def test_major_seventh_tonic(self):
        # C-E-B, today's `shellChord('i', C)`: a major-seventh shell as the C minor tonic.
        read = reading(self.mutated(2, symbol="Cmaj7", shell=[1, 3, 7]))
        self.assertTrue(disagreements(self.fixture, read))
        self.assertTrue(semantic_faults(read))

    def test_natural_minor_dominant(self):
        # G-B♭-F: the natural-minor v7 in C minor, a minor third on the dominant. Stated
        # consistently (numeral v7, symbol Gm7) only the settled table catches it; stated as the
        # table's V7 over a Gm7 symbol, the numeral and the symbol disagree as well.
        read = reading(self.mutated(1, numeral="v7", symbol="Gm7"))
        self.assertTrue(disagreements(self.fixture, read))
        self.assertEqual(read[1]["shell_pcs"], [5, 7, 10])
        read = reading(self.mutated(1, symbol="Gm7"))
        self.assertTrue(disagreements(self.fixture, read))
        self.assertTrue(semantic_faults(read))

    def test_numeral_disagreeing_with_symbol(self):
        # The symbol right and the numeral a natural-minor v7: one fact stated two ways, disagreeing.
        read = reading(self.mutated(1, numeral="v7"))
        self.assertTrue(semantic_faults(read))

    def test_flat_side_spelling(self):
        # Cm6's third or Gm7's third written as a sharp.
        for index, member in ((2, 1), (8, 1)):
            fixture = copy.deepcopy(self.fixture)
            pc = fixture[index]["shell"][member]["pc"]
            fixture[index]["shell"][member] = {"name": {3: "D#", 10: "A#"}[pc], "step": {3: "D", 10: "A"}[pc], "alter": 1, "pc": pc}
            self.assertTrue(disagreements(fixture, reading(CASES)), f"case {index + 1}")

    def test_signature_chosen_from_the_notes(self):
        # The answer staff before G6b: the major signature nearest the shell's notes (two flats
        # for Cm6, three sharps for E7, one sharp for D7) rather than the key the prompt names.
        for index, sharps in ((2, -2), (4, 3), (7, 1)):
            fixture = copy.deepcopy(self.fixture)
            fixture[index]["key_sharps"] = sharps
            self.assertTrue(disagreements(fixture, reading(CASES)), f"case {index + 1}")

    def test_chromatic_member_without_its_accidental(self):
        # G7's B in C minor written as if the signature's B flat held: the natural dropped.
        fixture = copy.deepcopy(self.fixture)
        fixture[1]["shell_accidentals"] = [None, None, None]
        self.assertTrue(disagreements(fixture, reading(CASES)))

    def test_eight_cases(self):
        read = reading(CASES[:5] + CASES[6:])
        self.assertTrue(disagreements(self.fixture, read))

    def test_shell_keeping_the_fifth(self):
        read = reading(self.mutated(5, shell=[1, 3, 5]))
        self.assertTrue(semantic_faults(read))


if __name__ == "__main__":
    unittest.main()
