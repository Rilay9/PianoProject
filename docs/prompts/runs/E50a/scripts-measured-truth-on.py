"""
E50a: runs `test_measured_truth.py`'s identity tests against a given build's content folder (the test reads
`app/public/content`; this points its `BUILT` at another folder without touching the file), for the red run
on the before build and the green run on the after build.
Usage: python scripts-measured-truth-on.py <content dir> [test name ...]
"""
import sys
import unittest
from pathlib import Path

W = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(W / "tools" / "content"))
from tests import test_measured_truth as T  # noqa: E402

T.BUILT = Path(sys.argv[1])
names = sys.argv[2:] or ["TestTheMaterialIdentity"]
suite = unittest.TestSuite(unittest.defaultTestLoader.loadTestsFromName(name, T) for name in names)
result = unittest.TextTestRunner(verbosity=2).run(suite)
sys.exit(0 if result.wasSuccessful() else 1)
