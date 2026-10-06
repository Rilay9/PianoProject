"""
latin.4's placement proofs (LP1; the reviewer's ruling on the prerequisites, `docs/review/responses/eeff22fe.md`
§1; the brief `docs/prompts/runs/curriculum-review-2026-10-05/briefs/latin4-placement.md`, finish items 2a-2g).

latin.4 is a Stage 4 track rung whose `prerequisites` are `4.4` (written sixteenths, which the Bizet cut prints in
every bar) and `latin.3` (where the tresillo is first named). The ruling asks the placement to prove, not assume:

- a. the prerequisites make no cycle. `claims.rung_ancestry` stops silently on one (`claims.py`, the `visiting`
  guard), so it cannot be the witness: the check here walks the same parent rule on its own and reports the cycle;
- b. latin.4's ancestry holds `4.4`, `latin.3` and both of their ancestries;
- c. the cut and the three tresillo exercises leave nothing untaught at latin.4 (`claims.untaught_on`, after a guard
  that latin.4 is in the ancestry at all: `untaught_on` answers `[]` for a rung it does not know);
- d. latin.4's two claims are established: the habanera on the cut by its verified passage fact (bars 1-12), the
  tresillo on each tresillo exercise;
- e. nothing unrelated changes: every other rung's ancestry, every demand's `taughtAt` but the habanera's, and
  `untaught_on` for every other rung and every catalogue item equal those of the same curriculum without latin.4;
  a mutant (another rung given latin.4 as a prerequisite) shows the differential can fail;
- g. `excerpts.candidate_rungs` lists latin.4 for the cut with the habanera established by the passage fact.

Reads the built content: run `python tools/content/build.py` first (CI: the step 'Build content', before 'Content
pipeline tests'). Nothing here writes a file. Nothing is heard: these are the build's readings of the notation and
the curriculum, never a judgement of the music.
"""
from __future__ import annotations

import copy
import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import claims  # noqa: E402
import excerpts  # noqa: E402

REPO = Path(__file__).resolve().parents[3]
BUILT = REPO / "app" / "public" / "content"

RUNG = "latin.4"
CUT = "excerpt.classical.bizet-l-amour-est-un-oiseau-rebelle.pdmx.b1-12.lh"
PARENT = "song.classical.bizet-l-amour-est-un-oiseau-rebelle.pdmx"
TRESILLOS = ("exercise.tresillo.c", "exercise.tresillo.f", "exercise.tresillo.g")
HABANERA = "rhythm.habanera"


def built(name: str):
    path = BUILT / name
    if not path.is_file():
        raise AssertionError(
            f"{path} is missing, and this test reads the built content: run "
            "`python tools/content/build.py` first (CI: the step 'Build content', "
            "before 'Content pipeline tests')"
        )
    return json.loads(path.read_text(encoding="utf-8"))


# --- a. the cycle check: its own walk of the parent rule, never `rung_ancestry` -----------------


def parents_of(curriculum: dict) -> dict[str, list[str]]:
    """
    Each rung's parents under the rule `claims.rung_ancestry` documents: a core rung stands on the core rung
    before it and its own prerequisites; a track rung on its own prerequisites and the last core rung of an
    earlier stage. Written apart from `rung_ancestry` on purpose: that function stops silently on a cycle.
    """
    stages = sorted(curriculum.get("stages", []), key=lambda stage: stage.get("number", 0))
    known = {lesson["id"] for stage in stages for unit in stage.get("units", []) for lesson in unit.get("lessons", [])}
    parents: dict[str, list[str]] = {}
    core: list[tuple[int, str]] = []
    previous: str | None = None
    for stage in stages:
        number = stage.get("number", 0)
        spine = next((rung for at, rung in reversed(core) if at < number), None)
        for unit in stage.get("units", []):
            for lesson in unit.get("lessons", []):
                own = [p for p in lesson.get("prerequisites") or [] if p in known and p != lesson["id"]]
                if unit.get("track") == "core":
                    parents[lesson["id"]] = ([previous] if previous else []) + own
                    previous = lesson["id"]
                    core.append((number, lesson["id"]))
                else:
                    parents[lesson["id"]] = own + ([spine] if spine else [])
    return parents


def cycles_in(curriculum: dict) -> list[list[str]]:
    """Every cycle the parent rule closes, each as the rungs on it, found by a depth-first walk with colours."""
    parents = parents_of(curriculum)
    state: dict[str, int] = {}  # 1 on the stack, 2 done
    found: list[list[str]] = []

    for root in parents:
        if state.get(root):
            continue
        stack: list[tuple[str, int]] = [(root, 0)]
        path: list[str] = []
        while stack:
            rung, index = stack.pop()
            if index == 0:
                state[rung] = 1
                path.append(rung)
            edges = parents.get(rung, [])
            if index < len(edges):
                stack.append((rung, index + 1))
                parent = edges[index]
                if state.get(parent) == 1:
                    found.append(path[path.index(parent):] + [parent])
                elif not state.get(parent):
                    stack.append((parent, 0))
            else:
                state[rung] = 2
                path.pop()
    return found


def lesson_of(curriculum: dict, rung: str) -> dict | None:
    return next((lesson for _s, _u, lesson in claims.lessons_in_order(curriculum) if lesson["id"] == rung), None)


def without_latin4(curriculum: dict) -> dict:
    """The same curriculum with latin.4's unit taken out, nothing else touched."""
    out = copy.deepcopy(curriculum)
    for stage in out.get("stages", []):
        stage["units"] = [unit for unit in stage.get("units", [])
                          if not any(lesson["id"] == RUNG for lesson in unit.get("lessons", []))]
    return out


def demands_without_latin4(demands: dict[str, dict]) -> dict[str, dict]:
    """The vocabulary's demands with latin.4 taken out of the habanera's `taughtAt`, as before this placement."""
    out = copy.deepcopy(demands)
    out[HABANERA]["taughtAt"] = [rung for rung in out[HABANERA].get("taughtAt") or [] if rung != RUNG]
    return out


def differential(catalog: list[dict], before: tuple[dict, dict], after: tuple[dict, dict]) -> list[str]:
    """
    What differs between two (curriculum, demands) readings for every rung but latin.4: its ancestry, every
    demand's `taughtAt` (the habanera's latin.4 entry apart) and `untaught_on` for every catalogue item there.
    """
    (cur_b, dem_b), (cur_a, dem_a) = before, after
    anc_b, anc_a = claims.rung_ancestry(cur_b), claims.rung_ancestry(cur_a)
    out: list[str] = []
    rungs = sorted(set(anc_b) | (set(anc_a) - {RUNG}))
    for rung in rungs:
        if anc_b.get(rung) != anc_a.get(rung):
            out.append(f"ancestry of {rung}: {sorted(anc_b.get(rung) or [])} -> {sorted(anc_a.get(rung) or [])}")
    for ident in sorted(set(dem_b) | set(dem_a)):
        taught_b = claims.taught_at(dem_b.get(ident))
        taught_a = [rung for rung in claims.taught_at(dem_a.get(ident)) if not (ident == HABANERA and rung == RUNG)]
        if taught_b != taught_a:
            out.append(f"taughtAt of {ident}: {taught_b} -> {taught_a}")
    items = [item for item in catalog if isinstance(item.get("demands"), list)]
    for rung in rungs:
        for item in items:
            was = claims.untaught_on(item, rung, anc_b, dem_b, cur_b)
            now = claims.untaught_on(item, rung, anc_a, dem_a, cur_a)
            if was != now:
                out.append(f"untaught of {item['id']} at {rung}: {was} -> {now}")
    return out


class TheCycleCheck(unittest.TestCase):
    """a. A cycle check of its own, seen to find a constructed cycle before it is trusted on the shipped one."""

    @staticmethod
    def three_rung_cycle() -> dict:
        # core a (stage 0) needs track c; track b (stage 1) needs a; track c (stage 1) needs b.
        return {"stages": [
            {"number": 0, "units": [{"track": "core", "lessons": [{"id": "a", "prerequisites": ["c"]}]}]},
            {"number": 1, "units": [{"track": "latin", "lessons": [{"id": "b", "prerequisites": ["a"]},
                                                                  {"id": "c", "prerequisites": ["b"]}]}]},
        ]}

    def test_it_finds_a_constructed_three_rung_cycle(self) -> None:
        cycles = cycles_in(self.three_rung_cycle())
        self.assertTrue(cycles, "a three-rung cycle went unseen")
        self.assertEqual({rung for cycle in cycles for rung in cycle}, {"a", "b", "c"})

    def test_rung_ancestry_is_no_witness_it_stops_silently_on_that_cycle(self) -> None:
        # Why the walk above exists: the build's ancestry returns on a cycle without a word.
        ancestry = claims.rung_ancestry(self.three_rung_cycle())
        self.assertEqual(set(ancestry), {"a", "b", "c"})

    def test_no_cycle_in_the_shipped_curriculum_with_latin4(self) -> None:
        curriculum = built("curriculum.json")
        self.assertIsNotNone(lesson_of(curriculum, RUNG), "latin.4 is not in the built curriculum")
        self.assertEqual(cycles_in(curriculum), [], "a cycle in the rungs' prerequisites")


class ThePlacement(unittest.TestCase):
    """b, c, d and g on the built content."""

    @classmethod
    def setUpClass(cls) -> None:
        cls.catalog = built("catalog.json")
        cls.curriculum = built("curriculum.json")
        cls.by_id = {item["id"]: item for item in cls.catalog}
        cls.ancestry = claims.rung_ancestry(cls.curriculum)
        cls.skills, cls.demands = claims.load_vocabulary()

    def test_b_latin4_stands_on_4_4_and_latin_3_and_both_their_paths(self) -> None:
        lesson = lesson_of(self.curriculum, RUNG)
        self.assertIsNotNone(lesson, "latin.4 is not in the built curriculum")
        self.assertEqual(lesson.get("prerequisites"), ["4.4", "latin.3"])
        self.assertTrue(RUNG in self.ancestry, "latin.4 has no ancestry: it is not a rung of the built curriculum")
        wanted = {"4.4", "latin.3"} | self.ancestry["4.4"] | self.ancestry["latin.3"]
        self.assertLessEqual(wanted, self.ancestry[RUNG], f"missing from latin.4's path: {sorted(wanted - self.ancestry[RUNG])}")

    def test_c_the_cut_and_the_tresillo_exercises_leave_nothing_untaught_at_latin4(self) -> None:
        # The guard first: `untaught_on` answers [] for a rung outside the ancestry, which would pass vacuously.
        self.assertTrue(RUNG in self.ancestry, "latin.4 is not a rung of the built curriculum: the check below would be vacuous")
        for ident in (CUT, *TRESILLOS):
            item = self.by_id.get(ident)
            self.assertIsNotNone(item, f"{ident} is not in the built catalogue")
            self.assertIsInstance(item.get("demands"), list, f"{ident} was not measured")
            self.assertEqual(claims.untaught_on(item, RUNG, self.ancestry, self.demands, self.curriculum), [], ident)

    def test_d_latin4s_claims_are_established_on_the_cut_and_on_each_tresillo_exercise(self) -> None:
        report = claims.rung_claims(self.catalog, self.curriculum)
        options = {o["item"]: o for o in report["options"] if o["rung"] == RUNG}
        self.assertIn(CUT, options, "the cut is not an option of latin.4")
        cut = {c["id"]: c for c in options[CUT]["claims"]}
        self.assertEqual(cut[HABANERA]["status"], "established")
        self.assertEqual(cut[HABANERA].get("passage"), "bars 1-12", "established by the verified passage fact")
        for ident in TRESILLOS:
            self.assertIn(ident, options, f"{ident} is not an option of latin.4")
            claim = {c["id"]: c for c in options[ident]["claims"]}
            self.assertEqual(claim["rhythm.tresillo"]["status"], "established", ident)
        row = next(r for r in report["rungs"] if r["rung"] == RUNG)
        counts = {c["id"]: c["established"] for c in row["claims"]}
        self.assertGreaterEqual(counts.get(HABANERA, 0), 1)
        self.assertGreaterEqual(counts.get("rhythm.tresillo", 0), 3)

    def test_g_candidate_rungs_lists_latin4_for_the_cut_with_the_habanera_established(self) -> None:
        report = excerpts.candidate_rungs(self.catalog, self.curriculum)
        row = next((r for r in report if r["item"] == CUT), None)
        self.assertIsNotNone(row, "the cut is not in the candidate-rungs report")
        candidates = {c["rung"]: c for c in row["candidates"]}
        self.assertIn(RUNG, candidates, f"latin.4 is not a candidate rung for the cut: {sorted(candidates)}")
        self.assertIn({"kind": "demand", "id": HABANERA},
                      [{"kind": e["kind"], "id": e["id"]} for e in candidates[RUNG]["established"]])


class NothingUnrelatedChanges(unittest.TestCase):
    """e. The differential against the same curriculum without latin.4, and the mutant that shows it can fail."""

    @classmethod
    def setUpClass(cls) -> None:
        cls.catalog = built("catalog.json")
        cls.curriculum = built("curriculum.json")
        _skills, cls.demands = claims.load_vocabulary()

    def test_only_latin4_and_the_habaneras_taught_at_change(self) -> None:
        self.assertIsNotNone(lesson_of(self.curriculum, RUNG), "latin.4 is not in the built curriculum")
        self.assertIn(RUNG, claims.taught_at(self.demands[HABANERA]), "the habanera's taughtAt does not name latin.4")
        before = (without_latin4(self.curriculum), demands_without_latin4(self.demands))
        after = (copy.deepcopy(self.curriculum), self.demands)
        self.assertEqual(differential(self.catalog, before, after), [])

    def test_the_differential_fails_on_a_mutant_that_gives_another_rung_latin4_as_a_prerequisite(self) -> None:
        mutant = copy.deepcopy(self.curriculum)
        latin6 = lesson_of(mutant, "latin.6")
        self.assertIsNotNone(latin6)
        latin6["prerequisites"] = list(latin6.get("prerequisites") or []) + [RUNG]
        before = (without_latin4(self.curriculum), demands_without_latin4(self.demands))
        found = differential(self.catalog, before, (mutant, self.demands))
        self.assertTrue(any(line.startswith("ancestry of latin.6") for line in found), found[:5])


if __name__ == "__main__":
    unittest.main()
