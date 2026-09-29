"""Q83: `test_import_mutopia`'s placement cases on a catalogue built without Mutopia's files (Q80's script, narrowed).

CI runs `unittest discover` over tools/content/tests after `build.py` (Q24); on a Mutopia outage the strict-flavour
case fails there by design. This points that module's `BUILT` at a build whose Mutopia row is a fetch placeholder,
runs `TestThePlacement`, and prints each failure's message as CI's log would show it. Read only.

    python docs/prompts/runs/Q83-Q84/scripts-ci-tests-unfetched.py <absolute or repo-relative built content dir>
"""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(REPO / "tools" / "content"))
sys.path.insert(0, str(REPO / "tools" / "content" / "tests"))

import test_import_mutopia  # noqa: E402

built = (REPO / sys.argv[1]).resolve()
test_import_mutopia.BUILT = built
print(f"BUILT = {built}")
suite = unittest.defaultTestLoader.loadTestsFromTestCase(test_import_mutopia.TestThePlacement)
result = unittest.TextTestRunner(verbosity=2, stream=sys.stdout).run(suite)
sys.exit(0 if result.wasSuccessful() else 1)
