"""CL15's mutants for the Python rows: each puts one piece of the committed behaviour back, in memory,
and runs the test that has to go red. No file in the worktree is edited.

usage: python build/cl15/mutants.py [name ...]
The committed generator (fadafbfa) is loaded from build/cl15/base/generate_exercises.py as its own
module; a maker mutant swaps that maker's committed function into the edited module, so the plan the
tests build writes the committed music for that family and the edited music for every other.
"""
from __future__ import annotations

import copy
import importlib.util
import sys
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(ROOT / "tools" / "content"))

import family_contracts as FC  # noqa: E402
import generate_exercises as G  # noqa: E402
from tests import planned  # noqa: E402


def committed_generator():
    spec = importlib.util.spec_from_file_location("committed_generate_exercises", HERE / "base" / "generate_exercises.py")
    module = importlib.util.module_from_spec(spec)
    # The committed file resolves its data files from its own folder: point it at the real one.
    module.__file__ = str(ROOT / "tools" / "content" / "generate_exercises.py")
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


BASE = committed_generator()


def run(cases: list[str]) -> tuple[int, int, list[str]]:
    planned._PLAN = None  # the plan is rebuilt under the mutant
    planned._MEASURED = None
    suite = unittest.TestSuite(unittest.defaultTestLoader.loadTestsFromName(case) for case in cases)
    result = unittest.TextTestRunner(verbosity=0, stream=open("NUL" if sys.platform == "win32" else "/dev/null", "w", encoding="utf-8")).run(suite)
    failed = [f"{test.id()}: {str(err).strip().splitlines()[-1][:220]}" for test, err in result.failures + result.errors]
    return result.testsRun, len(failed), failed


def swap(name: str):
    original = getattr(G, name)
    setattr(G, name, getattr(BASE, name))
    return lambda: setattr(G, name, original)


def patch(obj, name, value):
    original = getattr(obj, name)
    setattr(obj, name, value)
    return lambda: setattr(obj, name, original)


INV = "tests.test_generator_invariants.TestTheRecipesWriteWhatTheySay"
FCT = "tests.test_family_contracts"


def concepts_back():
    """Mutant 2: the committed `syncopation` concept back on both items, the edited titles kept."""
    made = G.make_syncopation

    def mutant(variant: str = "tied-across-bar", bpm: int = 76):
        sc, entry = made(variant, bpm)
        entry = copy.deepcopy(entry)
        entry["concepts"] = ["rhythm", "syncopation", variant]
        return sc, entry

    return patch(G, "make_syncopation", mutant)


def canonical_c():
    """Mutant 4: power_chord's canonical clause back to {"key": "C"}."""
    table = copy.deepcopy(FC.table())
    for rule in table["families"]["power_chord"]["roles"]["assign"]:
        if rule["role"] == "canonical":
            rule["when"] = {"key": "C"}
    FC.table.cache_clear()
    original = FC.table
    FC.table = lambda: table  # type: ignore[assignment]

    def restore():
        FC.table = original
        original.cache_clear()

    return restore


def no_relation():
    """Mutant 9a: the stamp dropped for every item."""
    return patch(FC, "former_generator_identities", lambda sc, entry, table=None: [])


def relation_ignores_digest():
    """Mutant 9b: every recorded item stamped, changed or not."""
    def mutant(sc, entry, table=None):
        record = (table or FC.continuity_table())["families"].get(entry["drill"]["generator"]["family"])
        if not record or record["to"] != entry["drill"]["generator"]["version"]:
            return []
        return [copy.deepcopy(record["items"][entry["id"]]["identity"])]

    return patch(FC, "former_generator_identities", mutant)


MUTANTS = {
    "1-tremolo-semitones": (lambda: swap("make_tremolo_octaves"), [f"{INV}.test_a_tremolo_in_thirds_plays_the_keys_own_third_on_each_degree"]),
    "2-syncopation-concept": (concepts_back, [f"{FCT}.TestANameClaimsOnlyWhatTheDetectorsFind.test_no_item_names_a_skill_its_music_holds_no_opportunity_for"]),
    "2b-syncopation-title": (lambda: swap("make_syncopation"), [f"{FCT}.TestANameClaimsOnlyWhatTheDetectorsFind.test_no_item_names_a_skill_its_music_holds_no_opportunity_for"]),
    "3-pentatonic-once": (lambda: swap("make_pentatonic"), [f"{INV}.test_every_pentatonic_run_clears_the_five_second_floor"]),
    "4-canonical-c": (canonical_c, [f"{FCT}.TestACanonicalRoleNamesAShippedItem.test_every_canonical_when_matches_a_planned_item"]),
    "5-interval-first-note": (lambda: swap("make_interval_reading"), [f"{INV}.test_an_interval_reading_melody_can_start_on_any_degree_of_the_position"]),
    "7-walking-bass-wraps": (lambda: swap("make_walking_bass"), [f"{INV}.test_a_walking_bass_ends_on_the_tonic_and_every_approach_note_leads_to_the_next_written_root"]),
    "8-one-tie": (lambda: swap("make_syncopation"), [f"{FCT}.TestTheTieDrillHasDensity.test_two_independent_across_bar_ties_in_four_bars"]),
    "9a-no-relation": (no_relation, [f"{FCT}.TestGeneratedIdentityContinuity.test_an_unchanged_item_carries_its_old_identity_and_a_changed_one_none",
                                     f"{FCT}.TestGeneratedIdentityContinuity.test_the_siblings_the_ruling_names"]),
    "9b-relation-ignores-digest": (relation_ignores_digest, [f"{FCT}.TestGeneratedIdentityContinuity.test_an_unchanged_item_carries_its_old_identity_and_a_changed_one_none",
                                                             f"{FCT}.TestGeneratedIdentityContinuity.test_the_siblings_the_ruling_names"]),
}


def main() -> None:
    names = sys.argv[1:] or list(MUTANTS)
    print("control (no mutant):")
    cases = sorted({case for name in names for case in MUTANTS[name][1]})
    ran, failed, why = run(cases)
    print(f"  {ran} run, {failed} failed" + "".join(f"\n    {w}" for w in why))
    caught = 0
    for name in names:
        apply, cases = MUTANTS[name]
        restore = apply()
        try:
            ran, failed, why = run(cases)
        finally:
            restore()
        caught += failed > 0
        print(f"{name}: {ran} run, {failed} red -> {'CAUGHT' if failed else 'MISSED'}")
        for line in why:
            print(f"    {line}")
    print(f"{caught} of {len(names)} caught")


if __name__ == "__main__":
    main()
