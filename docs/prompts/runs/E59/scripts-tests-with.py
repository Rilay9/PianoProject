"""
E59 (E57's script, its default classes moved): runs `test_convert` classes against a given copy of `convert.py`, so a
mutant is read without touching the worktree's file.

    python scripts-tests-with.py <folder holding the convert.py to test> [<class, module.class or module.class.test> ...]

The folder's `convert.py` is loaded as the module `convert` before the test module is imported, so the test file's own
`from convert import ...` takes it; every other module still comes from `tools/content`. A bare class name is
`test_convert`'s. Default: E59's class, the default case and the text-tempo class's `assert_today` callers. Exit 0 when
every test passes, 1 otherwise.
"""
from __future__ import annotations

import importlib
import importlib.util
import sys
import unittest
from pathlib import Path

W = Path(__file__).resolve().parents[4]
DEFAULT = ["TestADefaultedTempoIsPlaybackOnly", "test_convert.TestLilyPond.test_missing_tempo_gets_the_default",
           "TestTheTempoPrintedAsText", "TestTempoMarks", "TestALaterTempoMarkSurvives"]


def main(argv: list[str]) -> int:
    folder = Path(argv[0]).resolve()
    classes = argv[1:] or DEFAULT
    sys.path.insert(0, str(W / "tools" / "content"))
    spec = importlib.util.spec_from_file_location("convert", folder / "convert.py")
    module = importlib.util.module_from_spec(spec)  # type: ignore[arg-type]
    sys.modules["convert"] = module
    spec.loader.exec_module(module)  # type: ignore[union-attr]
    suite = unittest.TestSuite()
    loader = unittest.TestLoader()
    for name in classes:
        parts = name.split(".")
        module_name = parts[0] if len(parts) > 1 else "test_convert"
        cls = parts[1] if len(parts) > 1 else parts[0]
        tests = importlib.import_module(f"tests.{module_name}")
        if len(parts) == 3:
            suite.addTest(getattr(tests, cls)(parts[2]))
        else:
            suite.addTests(loader.loadTestsFromTestCase(getattr(tests, cls)))
    print(f"convert.py under test: {folder.relative_to(W).as_posix()}", flush=True)
    result = unittest.TextTestRunner(stream=sys.stdout, verbosity=2).run(suite)
    return 0 if result.wasSuccessful() else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
