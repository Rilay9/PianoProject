"""Q80, adjacent: the content tests CI runs after its build, on a catalogue built without Mutopia's files.

CI runs `unittest discover` over tools/content/tests after `build.py` (Q24), and some tests read the built catalogue.
This points the tests that read it at a build whose Mutopia row is a fetch-failure placeholder, to see whether a
network hiccup at mutopiaproject.org would still fail CI through them once the validator tolerates it. Read only.

    python docs/prompts/runs/Q80/scripts-ci-tests-unfetched.py build/q80-unfetched/content
"""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(REPO / "tools" / "content"))
sys.path.insert(0, str(REPO / "tools" / "content" / "tests"))

import test_import_mutopia  # noqa: E402
import test_public_tie_option  # noqa: E402

built = REPO / sys.argv[1]
test_import_mutopia.BUILT = built
for name in dir(test_public_tie_option):
    if name.startswith("BUILT"):
        setattr(test_public_tie_option, name, built)
suite = unittest.TestSuite()
suite.addTests(unittest.defaultTestLoader.loadTestsFromTestCase(test_import_mutopia.TestThePlacement))
suite.addTests(unittest.defaultTestLoader.loadTestsFromModule(test_public_tie_option))
result = unittest.TextTestRunner(verbosity=2).run(suite)
sys.exit(0 if result.wasSuccessful() else 1)
