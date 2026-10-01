"""CL15's new Python cases against the committed code (fadafbfa): each seen red before the fix.

usage: python build/cl15/red_first.py <tests folder holding the new test files>
Run while tools/content still holds the committed generator, contract table and family_contracts.py.
The committed family_contracts has no `music_digest` (it lived in the test module), so the committed
test module's own function is lent to it; `continuity_table` and `former_generator_identities` do not
exist on the committed code, so those cases error: unprovable, not merely failing.
"""
from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(ROOT / "tools" / "content"))

import family_contracts as FC  # noqa: E402
from tests import test_family_contracts as committed  # noqa: E402

assert not hasattr(FC, "music_digest"), "tools/content is not the committed code"
FC.music_digest = committed.music_digest

folder = Path(sys.argv[1])
CLASSES = {
    "test_family_contracts.py": ["TestACanonicalRoleNamesAShippedItem", "TestANameClaimsOnlyWhatTheDetectorsFind",
                                 "TestTheTieDrillHasDensity", "TestGeneratedIdentityContinuity"],
    "test_generator_invariants.py": ["TestTheRecipesWriteWhatTheySay"],
}
suite = unittest.TestSuite()
for filename, classes in CLASSES.items():
    spec = importlib.util.spec_from_file_location(f"cl15_{filename[:-3]}", folder / filename)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    for name in classes:
        suite.addTests(unittest.defaultTestLoader.loadTestsFromTestCase(getattr(module, name)))

result = unittest.TextTestRunner(verbosity=2, stream=sys.stdout).run(suite)
print("\nRED LINES (the last line of each failure or error):")
for test, err in result.failures + result.errors:
    lines = [line for line in err.strip().splitlines() if line.strip()]
    print(f"- {test.id().split('.', 1)[1]}: {lines[-1][:400]}")
print(f"\n{result.testsRun} run, {len(result.failures)} failed, {len(result.errors)} errors, "
      f"{result.testsRun - len(result.failures) - len(result.errors)} passed")
