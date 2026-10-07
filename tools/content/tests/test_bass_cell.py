"""
The `bass_cell` family (G13; `docs/prompts/runs/curriculum-review-2026-10-05/briefs/g13-habanera-control.md`, as ruled
in `docs/review/responses/g13-habanera-control.md`): latin.4's strict control, a generated 2/4 pair, the habanera and
the tresillo, that differs only in the onset cell.

What is proved here, each by a reader other than the maker:

- **The contract on the shipped plan** (`default_plan`'s four items: the habanera in C, F and G, the 2/4 tresillo in C).
  The app's own detectors (`demands.measure_opportunities`, the bridge) measure each written file; the family row's
  pedagogical gate passes on it; the cell is established by the contract (`build.established_by_contract`) and the
  independent witness (`cells.py`, partitura on the same bytes) agrees bar for bar (`build._witness_agrees`). Every bar
  of the four items is read by both: 32 bars.
- **The control.** The habanera in C and the 2/4 tresillo in C, read by partitura, share the metre, the tempo, the key,
  the bar count, the left hand's pitches and the right hand's chords, and their onsets differ by the half bar in every
  bar and by nothing else.
- **Spelling and roles,** for every major tonic the maker accepts (`MAJOR_KEYS`, twelve) and both cells: every left-hand
  onset is the tonic at octave 3 and every bar's right hand is the tonic triad from octave 4, read from the written file
  by partitura and compared with music21 used as a theory source (`Key.pitchFromDegree(1)`, `RomanNumeral("I", Key)`),
  never as a reader of its own output; the witness reads the cell in all eight bars of each of the 24 files.
- **The near-misses, each red,** written by the maker's own path (the score, the writer, the bridge, the witness) with a
  test-only override of `bass_cell_durations`, and judged by the contract and the witness, never by the maker's
  read-back: the sibling both ways; a dotted eighth and three sixteenths; even eighths; one tresillo bar in a habanera
  item; and app positions that disagree with the witness.

Not proved here, and not claimed: how either drill sounds (*unverified as music*; nothing is heard), the chord-tone
roles of a habanera bass line over changing harmony (UNKNOWN; the claim is narrowed to the cell on a root), or anything
about the learner. Needs Node and `app/node_modules` (the bridge runs Vitest), as `test_cells.py` does.
"""
from __future__ import annotations

import contextlib
import io
import sys
import tempfile
import unittest
import warnings
from fractions import Fraction
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import build  # noqa: E402
import cells  # noqa: E402
import family_contracts as FC  # noqa: E402
import generate_exercises as G  # noqa: E402

REPO = Path(__file__).resolve().parents[3]
FAMILY = "bass_cell"
SHIPPED = {
    "exercise.bass-cell.habanera.c": ("C", "habanera"),
    "exercise.bass-cell.habanera.f": ("F", "habanera"),
    "exercise.bass-cell.habanera.g": ("G", "habanera"),
    "exercise.bass-cell.tresillo.c": ("C", "tresillo"),
}
DEMAND = {"habanera": "rhythm.habanera", "tresillo": "rhythm.tresillo"}
OTHER = {"habanera": "tresillo", "tresillo": "habanera"}
PLACES = {"habanera": 4, "tresillo": 3}
BARS = 8

#: Near-miss bars, as the left hand's note lengths in quarters in one 2/4 bar.
DOTTED_EIGHTH_AND_THREE_SIXTEENTHS = (0.75, 0.25, 0.25, 0.75)  # onsets 0, 3/8, 1/2, 5/8 of the bar
EVEN_EIGHTHS = (0.5, 0.5, 0.5, 0.5)  # onsets 0, 1/4, 1/2, 3/4


def read(path: Path):
    """partitura's one part of a written file."""
    import partitura as pt

    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        score = pt.load_score(str(path))
    assert len(score.parts) == 1, path
    return score.parts[0]


def facts(path: Path) -> dict:
    """What partitura reads from a written item: metre, key, tempo, per bar the onsets and the pitches of each staff."""
    import partitura as pt

    part = read(path)
    segments = [(int(t), int(d)) for t, d in part.quarter_durations()]
    divs = segments[0][1]
    assert all(d == divs for _t, d in segments), "one division per quarter throughout"
    bar = 2 * divs
    staves: dict[int, dict[int, list]] = {1: {}, 2: {}}
    for n in part.notes_tied:
        index, into = divmod(int(n.start.t), bar)
        staves[n.staff].setdefault(index + 1, []).append(
            (Fraction(into, bar), n.step + {None: "", 0: "", 1: "#", -1: "-"}[n.alter], n.octave, Fraction(int(n.duration_tied), divs)))
    return {
        "metres": [(t.beats, t.beat_type) for t in part.iter_all(pt.score.TimeSignature)],
        "keys": [(k.fifths, k.mode) for k in part.iter_all(pt.score.KeySignature)],
        "tempi": [t.bpm for t in part.iter_all(pt.score.Tempo)],
        "words": [w.text for w in part.iter_all(pt.score.Words)],
        "bars": len(list(part.iter_all(pt.score.Measure))),
        "lh": staves[2],
        "rh": staves[1],
    }


def onsets(staff: dict[int, list]) -> dict[int, list[Fraction]]:
    return {bar: sorted({event[0] for event in events}) for bar, events in staff.items()}


class Written:
    """Items made by the maker, written by the generator's writer and measured by the bridge, in one scratch folder."""

    def __init__(self, items: dict[str, tuple]) -> None:
        import demands

        self._scratch = tempfile.TemporaryDirectory()
        folder = Path(self._scratch.name)
        self.made = {name: made for name, made in items.items()}
        self.paths = {name: Path(G.write(sc, str(folder), name)) for name, (sc, _entry) in items.items()}
        answered = demands.measure_opportunities(list(self.paths.values()))
        self.rows = {name: answered[str(path)] for name, path in self.paths.items()}

    def close(self) -> None:
        self._scratch.cleanup()

    def entry(self, name: str) -> dict:
        return self.made[name][1]


def contract_faults(entry: dict, row: dict) -> list[str]:
    """The family row's pedagogical gate on what the app's detectors measured, for the item's own recipe."""
    return FC.pedagogical_faults(FC.contract(FAMILY), FC.recipe_of(entry), row)


def established(entry: dict, path: Path, row: dict, demand: str) -> bool:
    """The build's rule (CD1 §3a): established by the family's contract and the witness agreeing bar for bar."""
    with contextlib.redirect_stdout(io.StringIO()):
        return demand in build.established_by_contract(entry, row) and build._witness_agrees(entry, path, row, demand)


def as_recipe(entry: dict, cell: str) -> dict:
    """The same item read against the other cell's contract: its recipe with `cell` swapped (the sibling near-miss)."""
    swapped = {**entry, "drill": {**entry["drill"], "params": {**entry["drill"]["params"], "cell": cell}}}
    return swapped


def with_bars(cell: str, wrong: dict[int, tuple] | tuple, tonic: str = "C") -> tuple:
    """A `cell` item written by the maker with some bars' durations overridden (0-based bar -> lengths, or every bar)."""
    real = G.bass_cell_durations

    def durations(asked: str, bar: int) -> tuple:
        if isinstance(wrong, tuple):
            return wrong
        return wrong.get(bar, real(asked, bar))

    with mock.patch.object(G, "bass_cell_durations", durations):
        return G.make_bass_cell(tonic, cell)


class TheShippedPlan(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.written = Written({name: G.make_bass_cell(tonic, cell) for name, (tonic, cell) in SHIPPED.items()})

    @classmethod
    def tearDownClass(cls) -> None:
        cls.written.close()

    def test_the_plan_ships_exactly_the_four_items_and_they_are_these(self) -> None:
        from tests import planned

        family = planned.by_family().get(FAMILY, [])
        self.assertEqual(sorted(entry["id"] for _sc, entry in family), sorted(SHIPPED))
        for sc, entry in family:
            with self.subTest(item=entry["id"]):
                made_sc, made_entry = self.written.made[entry["id"]]
                self.assertEqual(FC.music_digest(sc, entry), FC.music_digest(made_sc, made_entry))

    def test_the_catalogue_rows_say_what_the_files_are(self) -> None:
        for name, (tonic, cell) in SHIPPED.items():
            entry = self.written.entry(name)
            with self.subTest(item=name):
                self.assertEqual(entry["drill"]["generator"], {"family": FAMILY, "version": 1, "seed": None})
                self.assertEqual(entry["drill"]["params"], {"key": tonic, "cell": cell, "timeSig": "2/4"})
                self.assertEqual((entry["timeSig"], entry["tempoBpm"], entry["keySig"], entry["hands"]), ("2/4", 60, tonic, "both"))
                self.assertGreaterEqual(entry["level"], 2.67)
                self.assertLessEqual(entry["level"], 7.46, "inside latin.4's levelBand, which is not this lane's")
                self.assertNotIn("targetSkills", entry, "the cell's skill is observable none: not judged by the app")
                self.assertEqual(entry["role"], "canonical" if tonic == "C" else "variable")

    def test_titles_name_the_cell_and_the_metre_and_differ_only_by_the_cell(self) -> None:
        titles = {name: self.written.entry(name)["title"] for name in SHIPPED}
        self.assertEqual(titles["exercise.bass-cell.habanera.c"], "Habanera bass in C, in 2/4")
        self.assertEqual(titles["exercise.bass-cell.tresillo.c"], "Tresillo bass in C, in 2/4")
        self.assertEqual(titles["exercise.bass-cell.habanera.f"], "Habanera bass in F, in 2/4")
        for name, title in titles.items():
            self.assertNotIn("exercise.", title)
            self.assertNotIn("bass-cell", title)

    def test_the_contract_holds_and_establishes_the_cell_with_the_witness_agreeing_on_every_bar(self) -> None:
        for name, (_tonic, cell) in SHIPPED.items():
            entry, path, row = self.written.entry(name), self.written.paths[name], self.written.rows[name]
            with self.subTest(item=name):
                self.assertNotIn("error", row)
                self.assertEqual(int(row["measures"]), BARS)
                self.assertEqual(contract_faults(entry, row), [])
                self.assertIn(DEMAND[cell], row["demands"])
                self.assertNotIn(DEMAND[OTHER[cell]], row["demands"], "the cross-failure, by the app")
                self.assertTrue(established(entry, path, row, DEMAND[cell]))
                # Bar for bar, both readers: the app's located places on the lower staff, and the witness's cell.
                app = {int(bar): counts for bar, counts in row["positions"][DEMAND[cell]].items()}
                self.assertEqual(app, {bar: [0, PLACES[cell]] for bar in range(1, BARS + 1)})
                self.assertEqual((row["positions"] or {}).get(DEMAND[OTHER[cell]], {}), {})
                self.assertEqual([bar["cell"] for bar in cells.bar_cells(path)], [cell] * BARS)
                self.assertEqual(cells.disagreements(path, row["positions"], DEMAND[cell]), [])

    def test_the_physical_gate_holds_and_the_habanera_s_fast_repeat_passes_only_by_the_declared_solution(self) -> None:
        row = FC.contract(FAMILY)
        for name in SHIPPED:
            sc, entry = self.written.made[name]
            with self.subTest(item=name):
                self.assertEqual(FC.physical_faults(row, FC.recipe_of(entry), sc, entry), [])
        undeclared = {**row, "physical": {k: v for k, v in row["physical"].items() if k != "repeatedNotes"}}
        for name, (_tonic, cell) in SHIPPED.items():
            sc, entry = self.written.made[name]
            faults = FC.physical_faults(undeclared, FC.recipe_of(entry), sc, entry)
            with self.subTest(item=name):
                if cell == "habanera":
                    self.assertTrue(faults and all(f.startswith("repeated note: LH") for f in faults), faults)
                else:
                    self.assertEqual(faults, [], "the tresillo control has no repeat under the gate's 0.3 s")
        rates = {cell: FC.physical_facts(self.written.made[name][0])["hands"]["LH"]["rate"]
                 for name, (_tonic, cell) in SHIPPED.items()}
        self.assertEqual(rates, {"habanera": 4.0, "tresillo": 2.0})
        self.assertEqual(row["physical"]["maxRate"], max(rates.values()))


class TheControl(unittest.TestCase):
    """The habanera in C and the 2/4 tresillo in C differ in the onset cell alone, read by partitura."""

    @classmethod
    def setUpClass(cls) -> None:
        cls.folder = tempfile.TemporaryDirectory()
        cls.facts = {}
        for cell in ("habanera", "tresillo"):
            sc, entry = G.make_bass_cell("C", cell)
            cls.facts[cell] = facts(Path(G.write(sc, cls.folder.name, entry["id"])))

    @classmethod
    def tearDownClass(cls) -> None:
        cls.folder.cleanup()

    def test_metre_tempo_key_bars_and_the_right_hand_are_the_same(self) -> None:
        hab, tre = self.facts["habanera"], self.facts["tresillo"]
        for field in ("metres", "keys", "tempi", "bars", "rh"):
            with self.subTest(field=field):
                self.assertEqual(hab[field], tre[field])
        self.assertEqual((hab["metres"], hab["keys"], hab["tempi"], hab["bars"]), ([(2, 4)], [(0, "major")], [60.0], BARS))

    def test_the_left_hand_plays_the_same_note_and_the_onsets_differ_by_the_half_bar_in_every_bar(self) -> None:
        hab, tre = self.facts["habanera"], self.facts["tresillo"]
        self.assertEqual({(e[1], e[2]) for events in hab["lh"].values() for e in events},
                         {(e[1], e[2]) for events in tre["lh"].values() for e in events})
        hab_on, tre_on = onsets(hab["lh"]), onsets(tre["lh"])
        self.assertEqual(sorted(hab_on), list(range(1, BARS + 1)))
        for bar in range(1, BARS + 1):
            with self.subTest(bar=bar):
                self.assertEqual(set(hab_on[bar]) - set(tre_on[bar]), {Fraction(1, 2)})
                self.assertEqual(set(tre_on[bar]) - set(hab_on[bar]), set())
                self.assertEqual(hab_on[bar], sorted(cells.HABANERA))
                self.assertEqual(tre_on[bar], sorted(cells.TRESILLO))

    def test_the_counting_lines_differ_only_at_the_half_bar(self) -> None:
        hab, tre = G.BASS_CELL_COUNT["habanera"], G.BASS_CELL_COUNT["tresillo"]
        self.assertEqual(len(hab), len(tre))
        self.assertEqual([i for i, (a, b) in enumerate(zip(hab, tre)) if a != b], [hab.index("2")])
        for cell in ("habanera", "tresillo"):
            self.assertTrue(any(text.strip().startswith(G.BASS_CELL_COUNT[cell].strip(" .")) for text in self.facts[cell]["words"]),
                            self.facts[cell]["words"])


class SpellingAndRolesInEveryKey(unittest.TestCase):
    """Every major tonic the maker accepts, both cells: the written pitches against music21's theory, and the witness."""

    def test_the_root_on_every_onset_the_tonic_triad_held_and_the_cell_in_every_bar(self) -> None:
        from music21 import key, roman

        def name(p) -> str:
            return p.name  # music21 spells flats '-', as `facts` writes partitura's

        seen = 0
        with tempfile.TemporaryDirectory() as folder:
            for tonic in G.MAJOR_KEYS:
                k = key.Key(tonic)
                root = k.pitchFromDegree(1)
                triad = sorted(name(p) for p in roman.RomanNumeral("I", k).pitches)
                for cell in ("habanera", "tresillo"):
                    sc, entry = G.make_bass_cell(tonic, cell)
                    path = Path(G.write(sc, folder, entry["id"]))
                    read_back = facts(path)
                    with self.subTest(tonic=tonic, cell=cell):
                        self.assertEqual(read_back["keys"], [(k.sharps, "major")])
                        lh = [e for events in read_back["lh"].values() for e in events]
                        self.assertEqual(len(lh), BARS * len(G.BASS_CELL_DURATIONS[cell]))
                        self.assertEqual({(e[1], e[2]) for e in lh}, {(name(root), 3)}, "the tonic at octave 3 on every onset")
                        for bar in range(1, BARS + 1):
                            chord_tones = read_back["rh"][bar]
                            self.assertEqual(sorted(e[1] for e in chord_tones), triad, f"bar {bar}: the tonic triad")
                            self.assertEqual({e[0] for e in chord_tones}, {Fraction(0)})
                            self.assertEqual({e[3] for e in chord_tones}, {Fraction(2)}, "held for the 2/4 bar")
                            lowest = min(chord_tones, key=lambda e: (e[2], "CDEFGAB".index(e[1][0])))
                            self.assertEqual((lowest[1], lowest[2]), (name(root), 4), "the triad from the tonic at octave 4")
                        self.assertEqual([bar["cell"] for bar in cells.bar_cells(path)], [cell] * BARS)
                    seen += 1
        self.assertEqual(seen, 24)

    def test_a_tonic_or_a_cell_the_maker_does_not_know_stops_it(self) -> None:
        with self.assertRaises(ValueError):
            G.make_bass_cell("C#", "habanera")
        with self.assertRaises(ValueError):
            G.make_bass_cell("C", "clave")


class TheNearMisses(unittest.TestCase):
    """Each written by the maker's own path, each red by the contract and by the witness."""

    @classmethod
    def setUpClass(cls) -> None:
        cls.written = Written({
            "hab": G.make_bass_cell("C", "habanera"),
            "tre": G.make_bass_cell("C", "tresillo"),
            "three-sixteenths": with_bars("habanera", DOTTED_EIGHTH_AND_THREE_SIXTEENTHS),
            "even-eighths": with_bars("habanera", EVEN_EIGHTHS),
            "one-tresillo-bar": with_bars("habanera", {4: G.BASS_CELL_DURATIONS["tresillo"]}),
        })

    @classmethod
    def tearDownClass(cls) -> None:
        cls.written.close()

    def assert_red(self, name: str, entry: dict, cell: str) -> list[str]:
        path, row = self.written.paths[name], self.written.rows[name]
        faults = contract_faults(entry, row)
        self.assertTrue(faults, f"{name}: passes the {cell} contract")
        self.assertFalse(established(entry, path, row, DEMAND[cell]), f"{name}: establishes {DEMAND[cell]}")
        self.assertNotEqual([bar["cell"] for bar in cells.bar_cells(path)], [cell] * BARS, f"{name}: the witness reads {cell}")
        return faults

    def test_the_sibling_fails_the_other_cell_s_contract_both_ways(self) -> None:
        tre = as_recipe(self.written.entry("tre"), "habanera")
        faults = self.assert_red("tre", tre, "habanera")
        self.assertIn("presence: rhythm.habanera is required and absent", faults)
        self.assertIn("forbidden: rhythm.tresillo is present", faults)
        hab = as_recipe(self.written.entry("hab"), "tresillo")
        faults = self.assert_red("hab", hab, "tresillo")
        self.assertIn("presence: rhythm.tresillo is required and absent", faults)
        self.assertIn("forbidden: rhythm.habanera is present", faults)
        # The witness: no habanera bar is a tresillo bar, and the reverse.
        self.assertEqual(cells.cell_bars(self.written.paths["tre"], "habanera"), [])
        self.assertEqual(cells.cell_bars(self.written.paths["hab"], "tresillo"), [])

    def test_a_dotted_eighth_and_three_sixteenths_is_not_the_habanera(self) -> None:
        faults = self.assert_red("three-sixteenths", self.written.entry("three-sixteenths"), "habanera")
        self.assertIn("presence: rhythm.habanera is required and absent", faults)
        bars = cells.bar_cells(self.written.paths["three-sixteenths"])
        self.assertEqual({tuple(bar["onsets"]) for bar in bars},
                         {(Fraction(0), Fraction(3, 8), Fraction(1, 2), Fraction(5, 8))})
        self.assertEqual({bar["cell"] for bar in bars}, {None})

    def test_even_eighths_are_not_the_habanera(self) -> None:
        faults = self.assert_red("even-eighths", self.written.entry("even-eighths"), "habanera")
        self.assertIn("presence: rhythm.habanera is required and absent", faults)
        self.assertEqual({bar["cell"] for bar in cells.bar_cells(self.written.paths["even-eighths"])}, {None})

    def test_one_tresillo_bar_in_a_habanera_item_fails_the_density_and_the_witness_names_the_bar(self) -> None:
        faults = self.assert_red("one-tresillo-bar", self.written.entry("one-tresillo-bar"), "habanera")
        self.assertIn("density: rhythm.habanera 3.50 per bar, the row asks for 4", faults)
        self.assertIn("forbidden: rhythm.tresillo is present", faults)
        self.assertEqual(cells.cell_bars(self.written.paths["one-tresillo-bar"], "tresillo"), [5])
        self.assertEqual(cells.cell_bars(self.written.paths["one-tresillo-bar"], "habanera"), [1, 2, 3, 4, 6, 7, 8])

    def test_app_positions_that_disagree_with_the_witness_establish_nothing_and_the_bars_are_printed(self) -> None:
        entry, path = self.written.entry("hab"), self.written.paths["hab"]
        row = dict(self.written.rows["hab"])
        self.assertTrue(established(entry, path, row, "rhythm.habanera"), "the honest reading establishes it")
        doctored = {**row, "positions": {**row["positions"], "rhythm.habanera": {
            bar: counts for bar, counts in row["positions"]["rhythm.habanera"].items() if bar != "3"}}}
        self.assertEqual(contract_faults(entry, row), [])
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            self.assertFalse(build._witness_agrees(entry, path, doctored, "rhythm.habanera"))
        self.assertIn("the app and the witness disagree at bars [3]", out.getvalue())
        self.assertFalse(established(entry, path, doctored, "rhythm.habanera"))


if __name__ == "__main__":
    unittest.main()
