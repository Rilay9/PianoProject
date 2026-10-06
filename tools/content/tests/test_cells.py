"""
The habanera and the tresillo as measured demands (CD1): the build's independent witness (`cells.py`, partitura)
on hand-written fixtures and on the built files, the differential against the app's detectors, and latin.4's
claim made checkable.

- **T5, the witness on hand-written MusicXML** (`fixtures/cells/`, written as plain text by
  `docs/prompts/runs/CD1/scripts-fixtures.py`, never by music21): the cases `demandDetectors.test.ts` holds the
  app's detectors to, read by partitura — the cells present in 2/4, 4/4 and 2/2 and in Por Una Cabeza's and The
  Crave's written forms; absent in straight eighths, the dotted-pair near-miss, the right hand, 3/4 and 6/8, a
  bar entered by a tie, eight sixteenths; the cross-failure; a tie over the half bar; chords and voices merged;
  a pickup never read; a two-part file refused with its reason. A grace note shares its principal note's onset
  in partitura, so its case cannot change an onset set here; the app's case (`demandDetectors.test.ts`) is the
  one that discriminates.
- **T6, the real calibration on the built files** (`app/public/content`; the content build runs first): the
  witness's staff-2 counts, pinned, as Entry 241's probe read them with two readers agreeing in every bar.
- **T7, the differential**: per printed bar, the app's located places for each cell (the bridge,
  `demands.measure_opportunities`, the build's own way into the app) against the witness's bars. A disagreement
  fails with the bars named, and is never resolved by editing one side to match the other. The one difference by
  representation is stated as a case: the witness reads a staff, the app a hand, so a left-hand note drawn on the
  upper staff counts for the app and not for the witness reading staff 2.
- **T9, the latin.4 consumer**: a constructed curriculum with latin.4 injected (the probe's
  `candidate_latin4.py` shape: concepts habanera and tresillo, prerequisites 4.4 and latin.3) gets both demand
  claims from `claims.rung_claims_of`. Revised (CD1 §3a): no measured count establishes either (curated-only);
  the two proofs that do are `test_cell_proofs.py`'s. No file is changed and nothing is placed.

What T5-T7 prove is that the classification is consistent between two parsers of the same bytes, never that a
density suits teaching (`test_cell_density_calibration.py` is the calibration) and never the style: the left hand
holds the declared onset cell, and that is all (`docs/review/responses/eeff22fe.md` §2). Nothing here is heard.

T7 needs Node and `app/node_modules` (the bridge runs Vitest), which CI installs before these tests run.
"""
from __future__ import annotations

import copy
import json
import sys
import unittest
from fractions import Fraction
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import cells  # noqa: E402
import claims  # noqa: E402

REPO = Path(__file__).resolve().parents[3]
CONTENT = REPO / "app" / "public" / "content"
FIXTURES = Path(__file__).resolve().parent / "fixtures" / "cells"

POR_UNA_CABEZA = "song.folk.por-una-cabeza-carlos-gardel.pdmx"
THE_CRAVE = "song.jazz.the-crave"
TRESILLOS = ("exercise.tresillo.c", "exercise.tresillo.f", "exercise.tresillo.g")
BIZET = "song.classical.bizet-l-amour-est-un-oiseau-rebelle.pdmx"
BIZET_CUT = "excerpt.classical.bizet-l-amour-est-un-oiseau-rebelle.pdmx.b1-12.lh"
SOLACE = "song.ragtime.joplin-solace"
CELL_DEMAND = {"habanera": "rhythm.habanera", "tresillo": "rhythm.tresillo"}
PLACES = {"habanera": 4, "tresillo": 3}


def fixture(name: str) -> Path:
    return FIXTURES / f"{name}.musicxml"


def cells_of(path: Path, staff: int = 2) -> list[str | None]:
    return [bar["cell"] for bar in cells.bar_cells(path, staff)]


_CATALOG: dict[str, dict] | None = None


def built(item_id: str) -> dict:
    """The built catalogue's row (the content build runs first; the test fails without it)."""
    global _CATALOG
    if _CATALOG is None:
        path = CONTENT / "catalog.json"
        if not path.exists():
            raise AssertionError(f"{path} is missing: run tools/content/build.py first")
        _CATALOG = {row["id"]: row for row in json.loads(path.read_text(encoding="utf-8"))}
    row = _CATALOG.get(item_id)
    if row is None:
        raise AssertionError(f"{item_id} is not in the built catalogue")
    return row


def built_file(item_id: str) -> Path:
    return CONTENT / built(item_id)["file"]


class T5TheWitnessOnHandWrittenFixtures(unittest.TestCase):
    def test_present_the_upgrade_s_2_4_cell_the_doubled_forms_and_the_two_written_forms(self) -> None:
        # 2/4 habanera; doubled 4/4; Por Una Cabeza's quarter, eighth rest, eighth, quarter, quarter; The Crave's
        # dotted quarter, dotted quarter, quarter; the 2/4 tresillo; the doubled habanera in 2/2.
        self.assertEqual(cells_of(fixture("present")), ["habanera", "habanera", "habanera", "tresillo", "tresillo", "habanera"])

    def test_absent_and_the_metres_outside_2_4_4_4_and_2_2_are_not_read(self) -> None:
        bars = cells.bar_cells(fixture("absent"))
        self.assertEqual([bar["cell"] for bar in bars], [None] * 8)
        by_index = {bar["index"]: bar for bar in bars}
        # The dotted-pair near-miss: one onset off (7/8 for 3/4).
        self.assertEqual(by_index[2]["onsets"], [Fraction(0), Fraction(3, 8), Fraction(1, 2), Fraction(7, 8)])
        # The right hand holds the cell; the left a whole note.
        self.assertEqual(by_index[3]["onsets"], [Fraction(0)])
        # 3/4 and 6/8 hold the habanera's fractions exactly, and are not read.
        for index, metre in ((4, "3/4"), (5, "6/8")):
            self.assertEqual(by_index[index]["metre"], metre)
            self.assertFalse(by_index[index]["read"])
            self.assertEqual(by_index[index]["onsets"], sorted(cells.HABANERA))
        # A bar entered by a tie has no onset at its start.
        self.assertEqual(by_index[7]["onsets"], [Fraction(3, 8), Fraction(1, 2), Fraction(3, 4)])
        # Eight sixteenths sound every sixteenth.
        self.assertEqual(len(by_index[8]["onsets"]), 8)

    def test_the_cross_failure_no_habanera_bar_is_a_tresillo_bar_and_the_reverse(self) -> None:
        self.assertNotEqual(cells.HABANERA, cells.TRESILLO)
        self.assertLess(cells.TRESILLO, cells.HABANERA, "the tresillo is the habanera less its 1/2")
        self.assertEqual(cells.classify(cells.HABANERA), "habanera")
        self.assertEqual(cells.classify(cells.TRESILLO), "tresillo")
        for path in (fixture("present"), fixture("boundary")):
            for bar in cells.bar_cells(path):
                onsets = frozenset(bar["onsets"])
                self.assertFalse(onsets == cells.HABANERA and onsets == cells.TRESILLO)

    def test_boundary_a_tie_over_the_half_bar_chords_and_voices_merged_and_a_cross_staff_note(self) -> None:
        # 1: the habanera's sixteenth tied over the half bar reads as a tresillo; 2: a left-hand chord is one onset;
        # 3: a second left-hand voice merges into the cell's onsets; 4: a grace note changes nothing; 5: a left-hand
        # note drawn on the upper staff is read where it is drawn, so staff 2 holds 0, 1/2, 3/4 (the app reads the
        # bar by the hand: T7's stated difference).
        self.assertEqual(cells_of(fixture("boundary")), ["tresillo", "habanera", "habanera", "habanera", None])
        self.assertEqual(cells.bar_cells(fixture("boundary"))[4]["onsets"], [Fraction(0), Fraction(1, 2), Fraction(3, 4)])
        self.assertEqual(cells.bar_cells(fixture("boundary"), staff=1)[4]["onsets"], [Fraction(0), Fraction(3, 8)])

    def test_a_pickup_is_never_read_though_its_notes_sit_where_the_cell_s_would(self) -> None:
        bars = cells.bar_cells(fixture("pickup"))
        self.assertTrue(bars[0]["pickup"])
        self.assertFalse(bars[0]["read"])
        self.assertEqual(bars[0]["onsets"], sorted(cells.HABANERA), "measured from the pickup's own start")
        self.assertIsNone(bars[0]["cell"])
        self.assertEqual((bars[0]["number"], bars[1]["number"]), ("0", "1"))
        self.assertEqual(bars[1]["cell"], "habanera")

    def test_a_file_with_more_than_one_part_is_refused_with_its_reason(self) -> None:
        with self.assertRaises(cells.CellsError) as raised:
            cells.bar_cells(fixture("two-parts"))
        self.assertIn("2 parts", str(raised.exception))


class T6TheWitnessOnTheBuiltFiles(unittest.TestCase):
    def test_por_una_cabeza_56_of_66_habanera_printed_1_to_14_all_habanera(self) -> None:
        bars = cells.bar_cells(built_file(POR_UNA_CABEZA))
        self.assertEqual(len(bars), 66)
        self.assertEqual((bars[0]["number"], bars[0]["pickup"]), ("0", True), "the first measure is a pickup numbered 0")
        self.assertEqual(sum(bar["cell"] == "habanera" for bar in bars), 56)
        self.assertEqual(sum(bar["cell"] == "tresillo" for bar in bars), 0)
        # The bridge counts the pickup as bar 1, so MusicXML's 1-14 are indexes 2-15.
        by_number = {bar["number"]: bar for bar in bars}
        self.assertEqual([by_number[str(n)]["cell"] for n in range(1, 15)], ["habanera"] * 14)
        self.assertEqual([by_number[str(n)]["index"] for n in (1, 14)], [2, 15])

    def test_the_crave_27_of_53_tresillo_including_21_to_26(self) -> None:
        bars = cells.bar_cells(built_file(THE_CRAVE))
        self.assertEqual(len(bars), 53)
        self.assertEqual(sum(bar["cell"] == "tresillo" for bar in bars), 27)
        self.assertEqual(sum(bar["cell"] == "habanera" for bar in bars), 0)
        by_number = {bar["number"]: bar for bar in bars}
        self.assertEqual([by_number[str(n)]["cell"] for n in range(21, 27)], ["tresillo"] * 6)

    def test_the_three_tresillo_exercises_8_of_8_tresillo(self) -> None:
        for item in TRESILLOS:
            with self.subTest(item=item):
                self.assertEqual(cells_of(built_file(item)), ["tresillo"] * 8)

    def test_the_bizet_parent_85_of_90_habanera(self) -> None:
        found = cells_of(built_file(BIZET))
        self.assertEqual(len(found), 90)
        self.assertEqual(found.count("habanera"), 85)
        self.assertEqual(found.count("tresillo"), 0)

    def test_no_bar_is_both_cells(self) -> None:
        for item in (POR_UNA_CABEZA, THE_CRAVE, *TRESILLOS, BIZET, SOLACE):
            for bar in cells.bar_cells(built_file(item)):
                with self.subTest(item=item, bar=bar["index"]):
                    self.assertIn(bar["cell"], (None, "habanera", "tresillo"))
                    self.assertFalse(frozenset(bar["onsets"]) == cells.HABANERA == cells.TRESILLO)


def app_bars(row: dict, demand: str, side: int) -> dict[int, int]:
    """The app's located places per printed bar for one demand on one staff (0 upper, 1 lower), as the bridge writes them."""
    return {int(bar): counts[side] for bar, counts in (row.get("positions") or {}).get(demand, {}).items() if counts[side] > 0}


def witness_bars(path: Path, cell: str, staff: int) -> dict[int, int]:
    return {index: PLACES[cell] for index in cells.cell_bars(path, cell, staff)}


#: The differences T7 records rather than fails, each with its owner and reason, and nothing else may differ. Keyed by
#: (item, cell): the printed bars only the witness reads as the cell. When the owner's fix lands the entry goes red and is
#: removed; it is never resolved by editing the detector or the witness to match.
RECORDED_DIFFERENCES: dict[tuple[str, str], dict] = {
    (SOLACE, "tresillo"): {
        "only_witness": [84],
        "owner": "HD2 (the hand rule)",
        "why": ("bar 84's treble inner voice (MusicXML voice 2, B-flat 4 and G-sharp 4, all of it on staff 1 for the whole "
                "measure) is still read by the model as the left hand crossing up (L, crossStaff), as bars 22, 26, 30 "
                "and 32 were before their verified hand rows; its onsets join the left hand's and the bar is no cell to "
                "the app, while staff 2 alone (voice 3: F4 over B-flat 3, a dotted eighth, a sixteenth tied over, an "
                "eighth) is the tresillo by onsets. The model dump is docs/prompts/runs/CD1/evidence/solace-84.txt. "
                "Solace is ragtime.7's, off the Bizet path, and its habanera claim is deferred."),
    },
}


class T7TheDifferential(unittest.TestCase):
    """The app's per-printed-bar positions against the witness's bars, bar for bar, both cells."""

    rows: dict[str, dict] = {}
    cut: dict[str, dict] = {}

    @classmethod
    def setUpClass(cls) -> None:
        import demands

        named = [POR_UNA_CABEZA, THE_CRAVE, *TRESILLOS, BIZET, SOLACE]
        cls.paths = {item: built_file(item) for item in named}
        cls.paths.update({f"fixture:{name}": fixture(name) for name in ("present", "absent", "boundary", "pickup")})
        # Measured as the build measures them (`build.attach_demands`): with each file's current verified hands (HD2,
        # `verified_hand.verified_hands`), so the differential reads the model the Score screen plays.
        import verified_hand
        import verified_facts

        hands = {}
        for item in named:
            found = verified_hand.verified_hands(item, verified_facts.identity_of(built(item)))
            if found:
                hands[str(cls.paths[item])] = found
        answered = demands.measure_each(list(cls.paths.values()), verified_hands=hands)
        cls.rows = {item: answered[str(path)] for item, path in cls.paths.items()}
        # The Bizet cut is one staff that the catalogue declares the left hand (HD1): measured with that declaration,
        # as the build measures it, and read by the witness on its one staff.
        cls.cut_path = built_file(BIZET_CUT)
        cls.cut = demands.measure_opportunities([cls.cut_path], declared_hand="left")[str(cls.cut_path)]

    def assert_agree(self, item: str, path: Path, row: dict, staff: int, side: int) -> None:
        for cell, demand in CELL_DEMAND.items():
            app = app_bars(row, demand, side)
            witness = witness_bars(path, cell, staff)
            only_app = sorted(set(app) - set(witness))
            only_witness = sorted(set(witness) - set(app))
            counts = sorted(bar for bar in set(app) & set(witness) if app[bar] != witness[bar])
            recorded = RECORDED_DIFFERENCES.get((item, cell))
            if recorded is not None:
                self.assertEqual(only_witness, recorded["only_witness"],
                                 f"{item} {cell}: the recorded difference ({recorded['owner']}) no longer describes the "
                                 f"measurement: remove or correct the entry")
                only_witness = []
            self.assertEqual((only_app, only_witness, counts), ([], [], []),
                             f"{item} {cell}: bars only the app finds {only_app}, only the witness {only_witness}, "
                             f"with different counts {counts}")
            other = app_bars(row, demand, 1 - side)
            self.assertEqual(other, {}, f"{item} {cell}: located on the other staff at bars {sorted(other)}")

    def test_the_named_files_bar_for_bar(self) -> None:
        for item in (POR_UNA_CABEZA, THE_CRAVE, *TRESILLOS, BIZET, SOLACE):
            with self.subTest(item=item):
                self.assertNotIn("error", self.rows[item])
                self.assert_agree(item, self.paths[item], self.rows[item], staff=2, side=1)

    def test_the_named_counts_are_the_pinned_ones_on_both_sides(self) -> None:
        self.assertEqual(len(app_bars(self.rows[POR_UNA_CABEZA], "rhythm.habanera", 1)), 56)
        # Revised (HD2): 27, the witness's count, now that bar 40's treble inner voice reads as the right hand (a
        # verified hand row); the old reading was 26 through the voice-home rule.
        self.assertEqual(len(app_bars(self.rows[THE_CRAVE], "rhythm.tresillo", 1)), 27)
        self.assertEqual(len(app_bars(self.rows[SOLACE], "rhythm.habanera", 1)), 49)
        self.assertEqual(len(app_bars(self.rows[BIZET], "rhythm.habanera", 1)), 85)
        for item in TRESILLOS:
            self.assertEqual(len(app_bars(self.rows[item], "rhythm.tresillo", 1)), 8, item)

    def test_the_fixtures_agree_except_the_cross_staff_bar_the_two_read_by_different_representations(self) -> None:
        for name in ("present", "absent", "pickup"):
            with self.subTest(fixture=name):
                self.assert_agree(name, fixture(name), self.rows[f"fixture:{name}"], staff=2, side=1)
        row = self.rows["fixture:boundary"]
        # Bars 1-4 agree; bar 5's left-hand G3 is drawn on the upper staff: the app counts it by its voice's hand
        # (three places on the lower staff, one on the upper), the witness reading staff 2 does not.
        self.assertEqual(app_bars(row, "rhythm.habanera", 1), {2: 4, 3: 4, 4: 4, 5: 3})
        self.assertEqual(app_bars(row, "rhythm.habanera", 0), {5: 1})
        self.assertEqual(app_bars(row, "rhythm.tresillo", 1), {1: 3})
        self.assertEqual(witness_bars(fixture("boundary"), "habanera", 2), {2: 4, 3: 4, 4: 4})
        self.assertEqual(witness_bars(fixture("boundary"), "tresillo", 2), {1: 3})

    def test_the_bizet_left_hand_cut_read_as_the_left_hand_agrees_on_its_one_staff(self) -> None:
        self.assertNotIn("error", self.cut)
        self.assertEqual(app_bars(self.cut, "rhythm.habanera", 0), {bar: 4 for bar in range(1, 13)})
        self.assert_agree(BIZET_CUT, self.cut_path, self.cut, staff=1, side=0)


class T9TheLatin4Consumer(unittest.TestCase):
    """latin.4's claim, checkable on the built catalogue; nothing placed, no file changed."""

    def test_latin_4_gets_both_demand_claims_and_its_named_options_establish_them(self) -> None:
        curriculum = json.loads((CONTENT / "curriculum.json").read_text(encoding="utf-8"))
        proposed = {"id": "latin.4", "title": "The habanera bass", "concepts": ["habanera", "tresillo"],
                    "prerequisites": ["4.4", "latin.3"],
                    "exerciseOptions": list(TRESILLOS),
                    "songOptions": [POR_UNA_CABEZA, THE_CRAVE], "requirements": []}
        constructed = copy.deepcopy(curriculum)
        stage4 = next(stage for stage in constructed["stages"] if stage.get("number") == 4)
        stage4["units"].append({"id": "latin.4.1", "track": "latin", "title": "constructed", "lessons": [proposed]})
        skills, demands = claims.load_vocabulary()
        found, unmeasurable = claims.rung_claims_of(proposed, skills, demands)
        self.assertEqual([(c["kind"], c["id"]) for c in found], [("demand", "rhythm.habanera"), ("demand", "rhythm.tresillo")])
        self.assertEqual(unmeasurable, [])
        # Revised (CD1 §3a): neither cell has a density rule, so no option establishes either claim by its measured
        # count; establishment is the two proofs' (`test_cell_proofs.py`), checked on the built catalogue after the hand
        # rule (HD2) lands. The old assumption was a density rule that Por Una Cabeza, The Crave and the controls met.
        by_claim = {c["id"]: c for c in found}
        for item in (POR_UNA_CABEZA, THE_CRAVE):
            for claim in by_claim.values():
                self.assertNotEqual(claims.status_of(claim, built(item), skills), "established", (item, claim["id"]))
        # The path reaches 4.4 and latin.3, so the tresillo is taught there by latin.3 (the gate, untouched).
        ancestry = claims.rung_ancestry(constructed)
        self.assertTrue({"4.4", "latin.3"} <= ancestry["latin.4"])
        self.assertIn("latin.3", claims.taught_at(demands["rhythm.tresillo"]))


if __name__ == "__main__":
    unittest.main()
