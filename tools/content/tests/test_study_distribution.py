"""
The study's distribution over seeds (D3 item 7; G22, Part 15 §12): a family can pass every
single-file check with a terrible distribution, so each first target's canonical recipe is
written over a seed set and measured on the written page, and the same recipes are written by an
adversary generator — a random walk that keeps the same hard layer (the rung, the target at its
density, every cadence on its chord's tone) and the same harmony and rhythm, with nothing shaped —
which the bounds must refuse.

Measured per recipe and generator, from the page (`musical_evaluator.study_model` on the written
score), never from the realiser's own notes: the refusal rate (seeds the realiser refuses) and the
rejection rate (draws the hard layer refuses); the evaluator's total (median and worst); arrival
(phrases arriving by D1's rule, and on a strong beat); four-bar units with one contour; the opening
cell varied (the motif); cadences correct; notes and rests a bar; repeated notes; leaps; the
target's opportunity density (the app's detectors through the bridge, once over every grammar
study); near-duplicates.

`D3_TABLE=<path>` writes the table (markdown) there. The numbers are this realiser's on these
seeds, not product facts.
"""
from __future__ import annotations

import dataclasses
import os
import statistics
import sys
import tempfile
import unittest
from functools import lru_cache
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import family_contracts as FC  # noqa: E402
import generate_exercises as G  # noqa: E402
import musical_evaluator as ME  # noqa: E402
import study as S  # noqa: E402

#: 40 seeds a recipe: enough that a share moves by a few points between seed sets, few enough that
#: the grammar and the walk together write under a thousand studies.
SEEDS = range(1, 41)
GENERATORS = {"grammar": None, "random walk": "random-walk"}


def canonical_recipes() -> list[S.Recipe]:
    row = FC.contract("study")
    out = []
    for recipe in S.PLAN:
        params = {**recipe.params(), "hands": "both"}
        if FC.role_of(row, params) == "canonical":
            out.append(recipe)
    return out


def phrase_measures(p: ME.Model) -> dict:
    arrives = strong = 0
    for phrase in p.phrases:
        sub = ME.phrase_slice(p, phrase)
        arrives += ME.arrives(sub)
        strong += ME.arrives_on_strong_beat(sub)
    events = ME.sounded(p)
    steps = [e.step for e in events]
    moves = [b - a for a, b in zip(steps, steps[1:])]
    shapes = ME.contour_shapes(p)
    rests = sum(1 for n in p.melody if n.midi is None)
    return {
        "phrases": len(p.phrases),
        "arrives": arrives,
        "strong": strong,
        "units": len(shapes),
        "oneContour": sum(1 for s in shapes if s in ("ascent", "descent", "arch", "valley")),
        "motif": ME.study_motif(p) == 1.0,
        "cadence": not ME.wrong_cadences(p),
        "notesPerBar": len(events) / p.bars,
        "restsPerBar": rests / p.bars,
        "repeats": sum(1 for m in moves if m == 0) / max(1, len(moves)),
        "leaps": sum(1 for m in moves if abs(m) >= 3) / max(1, len(moves)),
        "signature": tuple((n.bar, n.at, n.duration, n.midi) for n in p.melody),
    }


@lru_cache(maxsize=None)
def written(recipe: S.Recipe, generator: str) -> tuple:
    """Every seed's study (or refusal) for a recipe: `(seed, score, facts, report | reason)`."""
    out = []
    for seed in SEEDS:
        r = dataclasses.replace(recipe, seed=seed)
        try:
            sc, facts, report = S.compose(r, GENERATORS[generator])
        except S.StudyRefusal as refusal:
            out.append((seed, None, None, str(refusal)))
            continue
        out.append((seed, sc, facts, report))
    return tuple(out)


@lru_cache(maxsize=None)
def table() -> dict:
    rows = {}
    for recipe in canonical_recipes():
        for generator in GENERATORS:
            seeds = written(recipe, generator)
            kept = [(seed, sc, facts, report) for seed, sc, facts, report in seeds if sc is not None]
            measures = []
            for _seed, sc, facts, report in kept:
                page = ME.study_model(sc, facts)
                m = phrase_measures(page)
                m["score"] = ME.score_study(page)["total"]
                m["rejection"] = (report["draws"] - report["valid"]) / report["draws"]
                measures.append(m)
            phrases = sum(m["phrases"] for m in measures)
            units = sum(m["units"] for m in measures)
            signatures = [m["signature"] for m in measures]
            rows[(recipe, generator)] = {
                "seeds": len(seeds),
                "refused": (len(seeds) - len(kept)) / len(seeds),
                "rejection": statistics.median(m["rejection"] for m in measures),
                "scoreMedian": statistics.median(m["score"] for m in measures),
                "scoreWorst": min(m["score"] for m in measures),
                "belowFloor": sum(1 for m in measures if m["score"] < S.MUSICAL_FLOOR) / len(measures),
                "arrives": sum(m["arrives"] for m in measures) / phrases,
                "strong": sum(m["strong"] for m in measures) / phrases,
                "oneContour": sum(m["oneContour"] for m in measures) / units,
                "motif": sum(m["motif"] for m in measures) / len(measures),
                "cadence": sum(m["cadence"] for m in measures) / len(measures),
                "notesPerBar": statistics.median(m["notesPerBar"] for m in measures),
                "restsPerBar": statistics.median(m["restsPerBar"] for m in measures),
                "repeats": statistics.median(m["repeats"] for m in measures),
                "leaps": statistics.median(m["leaps"] for m in measures),
                "nearDuplicates": 1 - len(set(signatures)) / len(signatures),
            }
    return rows


@lru_cache(maxsize=None)
def target_density() -> dict:
    """Each canonical recipe's grammar studies through the bridge: the target's located count a bar, and the contract's gate."""
    import demands

    row = FC.contract("study")
    out = {}
    with tempfile.TemporaryDirectory() as scratch:
        paths = {}
        for recipe in canonical_recipes():
            for seed, sc, facts, _report in written(recipe, "grammar"):
                if sc is None:
                    continue
                item = f"{S.item_id(dataclasses.replace(recipe, seed=seed))}"
                paths[(recipe, seed)] = Path(G.write(sc, scratch, item))
        measured = demands.measure_opportunities(list(paths.values()))
    for (recipe, seed), path in paths.items():
        m = measured[str(path)]
        demand = S.TARGETS[recipe.target]["demand"]
        params = {**dataclasses.replace(recipe, seed=seed).params(), "hands": "both"}
        faults = FC.pedagogical_faults(row, params, m)
        out.setdefault(recipe, []).append({"perBar": m["opportunities"].get(demand, 0) / max(1, m["measures"]),
                                           "faults": faults})
    return out


#: The bounds, each with its reason. `grammar` must meet every one; the random walk must fail
#: at least one of the shape bounds on every recipe (the suite is red on it).
BOUNDS = {
    "refused": ("<=", 0.10, "a recipe the plan ships must write: more than one seed in ten refused means the recipe is at the edge of its rung"),
    "cadence": (">=", 1.0, "every phrase closes on its cadence's tone: the hard layer, measured on the page"),
    "arrives": (">=", 0.95, "a phrase that stops rather than arrives is the fault Part 15 §9 names first; the cadence cells hold a note a beat or more"),
    "scoreWorst": (">=", S.MUSICAL_FLOOR, "every study kept clears the musical floor, read again on the page"),
    "oneContour": (">=", 0.45, "at least a phrase in two with one shape; the grammar's lowest recipe (the five-note position at 2.1) sits near half, and the walk falls well below it"),
    "scoreMedian": (">=", round(S.MUSICAL_FLOOR + 0.05, 2), "the typical study clears the floor with room: a median at the floor would mean the floor is doing the composing"),
    "repeats": ("<=", 0.20, "a tune that sits on a note (D1's reader's read at level 2) is a degeneracy: at most one move in five a repeat"),
    "leaps": ("<=", 0.25, "at most one move in four a fourth or wider: a study reads by steps and skips, with a leap recovered"),
    "nearDuplicates": ("<=", 0.10, "a seed names a study; two seeds writing one page more than one time in ten is a space too small"),
    "motif": (">=", 0.90, "the opening cell comes back varied in nine studies of ten: the grammar's promise"),
}
SHAPE_BOUNDS = ("scoreMedian", "oneContour")


def bound_faults(row: dict) -> list[str]:
    out = []
    for name, (op, limit, _why) in BOUNDS.items():
        value = row[name]
        ok = value <= limit + 1e-9 if op == "<=" else value >= limit - 1e-9
        if not ok:
            out.append(f"{name} {value:.3f} {'>' if op == '<=' else '<'} {limit}")
    return out


def markdown() -> str:
    density = target_density()
    head = ("| recipe | generator | refused | rejected draws | score med / worst | below floor | arrives | strong beat "
            "| one contour | motif | cadence | notes/bar | rests/bar | repeats | leaps | near-dup | target/bar (min) |")
    lines = [head, "|" + " --- |" * 17]
    for (recipe, generator), row in table().items():
        target = ""
        if generator == "grammar":
            values = [d["perBar"] for d in density[recipe]]
            target = f"{statistics.median(values):.2f} ({min(values):.2f})"
        name = f"{recipe.target} {recipe.key} {recipe.mode} {recipe.metre} {recipe.bars} bars, {recipe.texture} @{recipe.rung}"
        lines.append(
            f"| {name} | {generator} | {row['refused']:.0%} | {row['rejection']:.0%} | {row['scoreMedian']:.2f} / "
            f"{row['scoreWorst']:.2f} | {row['belowFloor']:.0%} | {row['arrives']:.0%} | {row['strong']:.0%} | "
            f"{row['oneContour']:.0%} | {row['motif']:.0%} | {row['cadence']:.0%} | {row['notesPerBar']:.2f} | "
            f"{row['restsPerBar']:.2f} | {row['repeats']:.0%} | {row['leaps']:.0%} | {row['nearDuplicates']:.0%} | {target} |")
    lines.append("")
    lines.append("Bounds (the grammar must meet each; the random walk must fail a shape bound on every recipe):")
    for name, (op, limit, why) in BOUNDS.items():
        lines.append(f"- `{name}` {op} {limit}: {why}")
    return "\n".join(lines) + "\n"


class TestTheDistribution(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        if os.environ.get("D3_TABLE"):
            Path(os.environ["D3_TABLE"]).write_text(markdown(), encoding="utf-8")

    def test_the_grammar_meets_every_bound_on_every_recipe(self) -> None:
        recipes = canonical_recipes()
        self.assertEqual(len(recipes), len(S.TARGETS))
        for recipe in recipes:
            with self.subTest(recipe=S.item_id(recipe)):
                self.assertEqual(bound_faults(table()[(recipe, "grammar")]), [])

    def test_the_random_walk_fails_a_shape_bound_on_every_recipe(self) -> None:
        """The suite is red on the adversary generator: shape, not the hard layer, is what it lacks."""
        for recipe in canonical_recipes():
            faults = bound_faults(table()[(recipe, "random walk")])
            with self.subTest(recipe=S.item_id(recipe)):
                self.assertTrue(any(f.split()[0] in SHAPE_BOUNDS for f in faults), faults)
                # and it keeps the hard layer: its cadences are right and it is refused no more than the grammar
                self.assertEqual(table()[(recipe, "random walk")]["cadence"], 1.0)

    def test_the_target_is_at_the_contract_s_density_in_every_study(self) -> None:
        for recipe, rows in target_density().items():
            for index, row in enumerate(rows):
                with self.subTest(recipe=S.item_id(recipe), seed=index + 1):
                    self.assertEqual(row["faults"], [])


if __name__ == "__main__":
    unittest.main()
