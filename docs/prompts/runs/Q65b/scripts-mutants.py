"""The frame-union case bites (Q65b): test_a_frame_helper_names_the_union_of_its_screens_specs run on
the committed map mutated one way at a time, in memory (the committed file is not touched), and on
two controls that must stay green: an importer whose own row is the whole suite, with the helper's
row whole too, and a helper row that is whole because the union is the whole default suite.

A mutant is caught when the case fails and its failure text names what the mutant broke (the file or
the spec). One mutant adds an importer the source does not have, by replacing the test module's
discovery for the run.

    python docs/prompts/runs/Q65b/scripts-mutants.py .
"""
from __future__ import annotations

import copy
import io
import json
import sys
import unittest
from pathlib import Path

root = Path(sys.argv[1]).resolve()
sys.path.insert(0, str(root))
sys.path.insert(0, str(root / "tools" / "docs"))
import checks_for_paths as cfp  # noqa: E402
from tools.content.tests import test_checks_for_paths as T  # noqa: E402

MAP = json.loads((root / "docs" / "prompts" / "checks.json").read_text(encoding="utf-8"))
CASE = "test_a_frame_helper_names_the_union_of_its_screens_specs"
FRAME = "app/src/ui/screens/screenFrame.ts"
SUB = "app/src/ui/screens/subScreen.ts"
DEFAULT = sorted(f"tests/e2e/{p.name}" for p in (root / "app" / "tests" / "e2e").rglob("*.spec.ts") if p.name not in T.ENV_GATED)


def row(data: dict, name: str) -> dict:
    return next(p for p in data["patterns"] if p["pattern"] == name)


def drop(name: str, spec: str):
    def apply(data: dict) -> None:
        row(data, name)["checks"]["e2e"].remove(spec)
    return apply


def set_e2e(name: str, value):
    def apply(data: dict) -> None:
        row(data, name)["checks"]["e2e"] = value
    return apply


def add(name: str, spec: str):
    def apply(data: dict) -> None:
        row(data, name)["checks"]["e2e"].append(spec)
    return apply


def remove_row(name: str):
    def apply(data: dict) -> None:
        data["patterns"].remove(row(data, name))
    return apply


def reword(name: str, old: str, new: str):
    def apply(data: dict) -> None:
        assert old in row(data, name)["reason"]
        row(data, name)["reason"] = row(data, name)["reason"].replace(old, new)
    return apply


def both(*fs):
    def apply(data: dict) -> None:
        for f in fs:
            f(data)
    return apply


NEW_IMPORTER = "app/src/ui/screens/ScoreScreen.ts"
real_discovery = T.frame_importers


def with_new_importer(helper: str, root_: Path = T.ROOT) -> list[str]:
    found = real_discovery(helper, root_)
    return sorted(found + [NEW_IMPORTER]) if helper == FRAME else found


# (what, mutation, discovery, expected: "fail" naming the text given, or "pass")
MUTANTS = [
    ("screenFrame's row without tips.spec (only DrillScreen's row names it)", drop(FRAME, "tests/e2e/tips.spec.ts"), None, ("fail", "DrillScreen.ts")),
    ("subScreen's row without guide.spec (only GuideScreen's row names it)", drop(SUB, "tests/e2e/guide.spec.ts"), None, ("fail", "GuideScreen.ts")),
    ("subScreen's row without lesson-tools.spec (only LessonScreen, the transitive importer, names it)", drop(SUB, "tests/e2e/lesson-tools.spec.ts"), None, ("fail", "LessonScreen.ts")),
    ("screenFrame's row the whole suite again", set_e2e(FRAME, "*"), None, ("fail", "the row is the whole suite")),
    ("subScreen's row the whole suite again", set_e2e(SUB, "*"), None, ("fail", "the row is the whole suite")),
    ("a screen's row gains a spec the helper's row lacks (MetronomeScreen + wide.spec)", add("app/src/ui/screens/MetronomeScreen.ts", "tests/e2e/wide.spec.ts"), None, ("fail", "MetronomeScreen.ts")),
    ("an importer loses its own row (GuideScreen.ts)", remove_row("app/src/ui/screens/GuideScreen.ts"), None, ("fail", "GuideScreen.ts")),
    ("a new importer the source does not have (ScoreScreen.ts importing screenFrame.ts)", None, with_new_importer, ("fail", "ScoreScreen.ts")),
    ("the reason leaves out an importer (SkillsScreen)", reword(SUB, "SkillsScreen", "Skills"), None, ("fail", "SkillsScreen")),
    ("control: GuideScreen's row whole and subScreen's row whole", both(set_e2e("app/src/ui/screens/GuideScreen.ts", "*"), set_e2e(SUB, "*")), None, ("pass", "")),
    ("control: subScreen's row whole where one importer's row names the whole default suite", both(set_e2e("app/src/ui/screens/GuideScreen.ts", list(DEFAULT)), set_e2e(SUB, "*")), None, ("pass", "")),
    ("the map as committed", None, None, ("pass", "")),
]


def run(data: dict) -> tuple[bool, str]:
    class OnTheMutant(T.TheMinimumSemantics):
        @classmethod
        def setUpClass(cls) -> None:
            cls.map = cfp.load_map_data(data)

    stream = io.StringIO()
    # In a suite, so the class fixture (setUpClass, which loads the mutated map) runs.
    result = unittest.TextTestRunner(stream=stream, verbosity=0).run(unittest.TestSuite([OnTheMutant(CASE)]))
    return result.wasSuccessful(), stream.getvalue()


caught_all = True
for what, mutate, discovery, (expected, needle) in MUTANTS:
    data = copy.deepcopy(MAP)
    if mutate:
        mutate(data)
    T.frame_importers = discovery or real_discovery
    try:
        ok, text = run(data)
    finally:
        T.frame_importers = real_discovery
    if expected == "pass":
        good = ok
        verdict = "green, as it must be" if ok else "RED (a control failed)"
    else:
        good = (not ok) and needle in text
        verdict = f"caught, the failure names {needle!r}" if good else ("RED but the failure does not name " + repr(needle) if not ok else "NOT CAUGHT")
    caught_all &= good
    print(f"{'ok ' if good else 'BAD'} {what}: {verdict}")
    if not good:
        print(text)

print(f"\nall as expected: {caught_all}")
sys.exit(0 if caught_all else 1)
