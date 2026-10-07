"""
The public build's tie at 2.4 (Q76; the owner's word 2026-09-29: public-domain material first).

The phone runs the licence-strict build. There, 2.4's one option that established the tie (a PDMX row whose
composition is not public domain) is a placeholder, so no bundled piece practised what the rung says it
teaches (Q75's warning, *not judged on this build*). Q76 authors a public-domain tune whose own notation holds
notes over the bar line — *Cielito Lindo* (Quirino Mendoza y Cortés, 1882), measured against independent
PDMX editions before it was chosen (`docs/prompts/runs/Q76/pdmx-tie-tunes.txt`: *Auld Lang Syne* and *Silent
Night*, the brief's examples, carry almost none) — and places it on 2.4.

What is held here:

- **The ties are the tune's, not the arranger's.** The right hand is the committed reference edition's melody
  note for note, length for length and tie for tie; the left hand holds one note a bar and ties nothing. A tie
  written into the tune to satisfy the claim fails the first test.
- **The header is complete** (id, level, hands, tracks, concepts, licence, arranger, sourceName, a year inside
  the public-domain rule) and the level sits in 2.4's band.
- **2.4 lists it.**
- **On the strict catalogue 2.4's tie is established, by this piece.** The strict flavour is the built
  catalogue with every row a strict build placeholders (tagged `personal-build` or `nc-personal-build`) left
  unmeasured, as `build.attach_demands` marks a placeholder; the claim rule (`claims.rung_claims`) then reads it.
  The rows are what the build measured (`rhythm.ties` at the density `opportunity-density.json` states),
  never asserted here. These last cases read the built content: run `python tools/content/build.py` first.
"""
from __future__ import annotations

import copy
import json
import sys
import unittest
import warnings
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from abc_tools import parse_metadata  # noqa: E402
from author import PD_CUTOFF_YEAR, validate_metadata  # noqa: E402

REPO = Path(__file__).resolve().parents[3]
BUILT = REPO / "app" / "public" / "content"
ABC = REPO / "content" / "scores" / "authored" / "cielito-lindo-simple.abc"
#: The reference edition, committed by the PDMX quarry ('Exercise - Cielito Lindo', cc-zero, composition pd).
REFERENCE = REPO / "content" / "scores" / "pdmx" / "QmdotJP1ctgJZG85e3Wr2kWcL1QiSQ7R1e9m8faM6SF8EM.mxl"
STAGE_2 = REPO / "content" / "curriculum" / "stage-2.json"
TIE_PIECE = "song.folk.cielito-lindo.simple"
STRICT_PLACEHOLDER_TAGS = ("personal-build", "nc-personal-build")


def rung_2_4() -> dict:
    source = json.loads(STAGE_2.read_text(encoding="utf-8"))
    return next(lesson for stage in source["stages"] for unit in stage["units"] for lesson in unit["lessons"]
                if lesson["id"] == "2.4")


def staff_line(score, index: int) -> list[tuple]:
    """(pitches, quarter length, tie) for every note, chord and rest of one staff, in order; a printed chord symbol is not a note."""
    from music21 import harmony, stream

    part = list(score.parts)[index]
    out = []
    for element in part.recurse().getElementsByClass(("Note", "Chord", "Rest")):
        if isinstance(element, harmony.Harmony):
            continue
        if element.isRest:
            out.append(("rest", float(element.quarterLength), None))
            continue
        tie = element.tie.type if element.tie is not None else None
        out.append((tuple(p.nameWithOctave for p in element.pitches), float(element.quarterLength), tie))
    assert isinstance(part, stream.Stream)
    return out


def strict_flavour(catalog: list[dict]) -> list[dict]:
    """The built catalogue as a strict build leaves it: the rows it placeholders, unmeasured."""
    out = copy.deepcopy(catalog)
    for item in out:
        if set(item.get("tags") or []) & set(STRICT_PLACEHOLDER_TAGS):
            item["file"] = None
            item["demands"] = "unmeasured"
            item["measurement"] = {"status": "unmeasured",
                                   "reason": "no notation is bundled: it arrives when the learner imports the piece"}
    return out


def built(name: str):
    path = BUILT / name
    if not path.is_file():
        raise AssertionError(f"{path} is missing, and this test reads the built content: run "
                             "`python tools/content/build.py` first")
    return json.loads(path.read_text(encoding="utf-8"))


class TestTheTiesAreTheTunes(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        warnings.filterwarnings("ignore")
        from convert import parse_source
        from music21 import converter

        cls.authored = parse_source(ABC)
        cls.reference = converter.parse(str(REFERENCE))

    def test_the_right_hand_is_the_reference_note_for_note_and_tie_for_tie(self) -> None:
        mine = staff_line(self.authored, 0)
        theirs = [row for row in staff_line(self.reference, 0)]
        self.assertEqual(mine, theirs, "the right hand must be the reference edition's melody, every tie included")

    def test_the_right_hand_holds_the_references_thirteen_ties(self) -> None:
        starts = [row for row in staff_line(self.authored, 0) if row[2] == "start"]
        self.assertEqual(len(starts), sum(1 for row in staff_line(self.reference, 0) if row[2] == "start"))

    def test_the_left_hand_ties_nothing(self) -> None:
        self.assertEqual([row for row in staff_line(self.authored, 1) if row[2] is not None], [],
                         "a held left-hand note carried over the bar would be a tie the tune does not have")


class TestTheHeader(unittest.TestCase):
    def test_it_is_complete_and_public_domain(self) -> None:
        meta = parse_metadata(ABC.read_text(encoding="utf-8"))
        fields = dict(meta.fields)
        for key in ("id", "level", "hands", "tracks", "concepts", "license", "arranger", "sourceName"):
            with self.subTest(key=key):
                self.assertTrue(fields.get(key), f"%%pianopath {key} is missing")
        self.assertEqual(fields["id"], TIE_PIECE)
        self.assertEqual(fields["hands"], "both")
        self.assertEqual(fields["license"], "CC0")
        self.assertLessEqual(int(fields["publishedYear"]), PD_CUTOFF_YEAR)
        self.assertEqual(validate_metadata(fields), "song")

    def test_its_level_sits_in_the_rungs_band(self) -> None:
        level = float(dict(parse_metadata(ABC.read_text(encoding="utf-8")).fields)["level"])
        low, high = rung_2_4()["levelBand"]
        self.assertTrue(low <= level <= high, f"level {level} is outside 2.4's band [{low}, {high}]")


class TestThePlacement(unittest.TestCase):
    def test_2_4_lists_the_tie_piece(self) -> None:
        self.assertIn(TIE_PIECE, rung_2_4()["songOptions"])


class TestTheStrictCatalogue(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.catalog = built("catalog.json")
        cls.curriculum = built("curriculum.json")
        cls.by_id = {item["id"]: item for item in cls.catalog}

    def test_the_piece_is_bundled_in_both_builds_and_measured(self) -> None:
        item = self.by_id.get(TIE_PIECE)
        self.assertIsNotNone(item, f"{TIE_PIECE} is not in the built catalogue")
        self.assertFalse(set(item.get("tags") or []) & set(STRICT_PLACEHOLDER_TAGS),
                         "a strict build would placeholder it")
        self.assertEqual(item["measurement"]["status"], "measured")
        self.assertIn("rhythm.ties", item["measurement"]["established"],
                      "the build's detectors do not find the ties at the density the claim rule needs")

    def test_the_level_model_puts_it_in_the_rungs_band(self) -> None:
        warnings.filterwarnings("ignore")
        import difficulty
        from music21 import converter

        estimate = difficulty.estimate(difficulty.features(converter.parse(str(BUILT / self.by_id[TIE_PIECE]["file"]))))
        low, high = rung_2_4()["levelBand"]
        self.assertTrue(low <= estimate.level <= high,
                        f"the level model's estimate {estimate.level} is outside 2.4's band [{low}, {high}]")

    def test_on_the_strict_flavour_2_4s_tie_is_established_by_it(self) -> None:
        import claims

        report = claims.rung_claims(strict_flavour(self.catalog), self.curriculum)
        rung = next(r for r in report["rungs"] if r["rung"] == "2.4")
        ties = [c for c in rung["claims"] if (c["kind"], c["id"]) in (("demand", "rhythm.ties"), ("skill", "tie"))]
        self.assertEqual(len(ties), 2, "2.4 claims the tie as a skill and as a demand")
        for claim in ties:
            with self.subTest(claim=claim["id"]):
                self.assertGreaterEqual(claim["established"], 1, f"2.4's {claim['id']} is kept by no option on the strict flavour")
        option = next(o for o in report["options"] if o["rung"] == "2.4" and o["item"] == TIE_PIECE)
        self.assertEqual({c["id"]: c["status"] for c in option["claims"] if c["id"] in ("rhythm.ties", "tie")},
                         {"rhythm.ties": "established", "tie": "established"})
        self.assertNotIn({"rung": "2.4"}, [{"rung": k["rung"]} for k in report["keptByNone"]])


if __name__ == "__main__":
    unittest.main()
