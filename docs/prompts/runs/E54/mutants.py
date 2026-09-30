"""
E54's mutants and the comment guard's two one-sided cases (Entry 174), run from the repository root:

    python docs/prompts/runs/E54/mutants.py > docs/prompts/runs/E54/mutants.txt

Each mutant is exec'd over the loaded `excerpts` module (the one the test module imported), never written to the
tree: `merge_text`'s source is read with `inspect`, one exact passage replaced (asserted to occur once), compiled into
the module's namespace, the classes run, and the original function put back. The tree's `excerpts.py` and
`excerpts.json` are hashed before and after the whole run.

- M1, the rejection ignored: the `and stale` gate restored. Predicted: `TheWithdrawal` (a) red at the
  `excerpts == []` line.
- M2, the approval deleted instead of superseded. Predicted: (a) red at the kept line (`len(superseded) == 1`,
  immediately before `assertKeptWhole`); and (a)'s rerun, run here on its own, appends the old approval again.
- D1, only `COMMENT` changed (the file's `_comment` the base's three strings): the guard red.
- D2, only `_comment` changed (`COMMENT` the base's three strings, exec'd over the module): the guard red.
"""
from __future__ import annotations

import hashlib
import inspect
import io
import json
import sys
import textwrap
import unittest
from pathlib import Path

ROOT = Path.cwd()
sys.path.insert(0, str(ROOT))

from tools.content.tests import test_excerpts as T  # noqa: E402

X = T.X
FILES = [ROOT / "tools" / "content" / "excerpts.py", ROOT / "content" / "sources" / "excerpts.json"]
BUILD = ROOT / "build" / "e54"

NEW_LINES = [
    "parent bytes or by cut version, and each one a person's rejection withdrew while it was current: the old",
    "row as it was, with `supersededBy`, the event that replaced it (a rejection is kept in `rejected` too). A",
]
BASE_LINE = "parent bytes or by cut version: the old row as it was, with `supersededBy`, the event that replaced it. A"


def hashes() -> list[str]:
    return [hashlib.sha256(path.read_bytes()).hexdigest() for path in FILES]


def run(*classes: type) -> tuple[bool, str]:
    suite = unittest.TestSuite()
    for cls in classes:
        suite.addTests(unittest.defaultTestLoader.loadTestsFromTestCase(cls))
    out = io.StringIO()
    result = unittest.TextTestRunner(stream=out, verbosity=0).run(suite)
    lines = []
    for test, trace in result.failures + result.errors:
        at = [line.strip() for line in trace.splitlines() if "test_excerpts.py" in line]
        last = trace.strip().splitlines()[-1]
        lines.append(f"    RED {test.id().rsplit('.', 2)[-2]}.{test._testMethodName}: {at[-1] if at else '?'}")
        lines.append(f"        {last[:220]}")
    passed = result.testsRun - len(result.failures) - len(result.errors)
    lines.insert(0, f"  ran {result.testsRun}: {passed} green, {len(result.failures)} failed, {len(result.errors)} errors")
    return result.wasSuccessful(), "\n".join(lines)


ORIGINAL = X.merge_text
SOURCE = textwrap.dedent(inspect.getsource(ORIGINAL))


def mutate(old: str, new: str) -> None:
    assert SOURCE.count(old) == 1, f"the passage occurs {SOURCE.count(old)} times"
    exec(compile(SOURCE.replace(old, new), "<mutant merge_text>", "exec"), X.__dict__)
    assert X.merge_text is not ORIGINAL


def restore() -> None:
    X.merge_text = ORIGINAL


MUTANTS = {
    "M1 the rejection ignored (the `and stale` gate restored)": (
        "            if at is not None:\n                # E51, E54",
        "            if at is not None and stale:\n                # E51, E54",
    ),
    "M2 the approval deleted instead of superseded": (
        "                same = rows.pop(at)\n                superseded.append({**same, \"supersededBy\": row[\"event\"]})\n",
        "                same = rows.pop(at)\n",
    ),
}


def rerun_of_a() -> str:
    """(a)'s last step on its own: the withdrawn file, then the approval's export and the rejection merged again."""
    case = T.TheWithdrawal("test_a_a_rejection_of_the_current_approval_withdraws_it_and_the_build_stops_cutting_it")
    old = case.stored(cutVersion=X.CUT_VERSION)
    withdrawn = case.merge(case.data(old), case.rejection(), shas={case.PARENT: case.OLD})
    text = X.serialise_definitions(withdrawn["data"])
    again = case.merge(json.loads(text), case.export_of(old), case.rejection(), shas={case.PARENT: case.OLD})
    return (f"  (a)'s rerun on its own: appended {again['appended']}, skipped {again['skipped']}, "
            f"active rows {[r['event'] for r in again['data']['excerpts']]}, bytes unchanged "
            f"{X.serialise_definitions(again['data']) == text}")


def main() -> int:
    before = hashes()
    print(f"excerpts.py and excerpts.json sha256 before: {before}")
    ok, text = run(T.TheWithdrawal, T.TheRenewal, T.TheMerge)
    print(f"\nThe tree (no mutant): {'green' if ok else 'RED'}\n{text}\n{rerun_of_a()}")
    for name, (old, new) in MUTANTS.items():
        mutate(old, new)
        try:
            ok, text = run(T.TheWithdrawal, T.TheRenewal)
            print(f"\n{name}: {'SURVIVED' if ok else 'caught'}\n{text}\n{rerun_of_a()}")
        finally:
            restore()
        print(f"  restored: merge_text is the original {X.merge_text is ORIGINAL}; files unchanged {hashes() == before}")

    guard = ("test_the_committed_file_says_what_its_format_holds", "test_the_committed_file_is_the_merges_own_serialisation")

    def run_guard() -> tuple[bool, str]:
        suite = unittest.TestSuite(T.TheMerge(name) for name in guard)
        out = io.StringIO()
        result = unittest.TextTestRunner(stream=out, verbosity=0).run(suite)
        red = [f"    RED {t._testMethodName}: {tr.strip().splitlines()[-1][:160]}" for t, tr in result.failures + result.errors]
        return result.wasSuccessful(), "\n".join([f"  ran {result.testsRun}"] + red)

    # D1: the file with the base's comment (a scratch copy under build/e54), COMMENT as the tree has it.
    BUILD.mkdir(parents=True, exist_ok=True)
    scratch = BUILD / "excerpts-base-comment.json"
    raw = FILES[1].read_bytes().decode("utf-8")
    eol = "\r\n" if "\r\n" in raw else "\n"
    old_block = f'    "{NEW_LINES[0]}",{eol}    "{NEW_LINES[1]}",{eol}'
    assert raw.count(old_block) == 1
    scratch.write_bytes(raw.replace(old_block, f'    "{BASE_LINE}",{eol}').encode("utf-8"))
    defaults, definitions = X.read_definitions.__defaults__, X.DEFINITIONS
    X.read_definitions.__defaults__, X.DEFINITIONS = (scratch,), scratch
    try:
        ok, text = run_guard()
    finally:
        X.read_definitions.__defaults__, X.DEFINITIONS = defaults, definitions
    print(f"\nD1 only COMMENT changed (the file's _comment the base's): guard {'green' if ok else 'RED'}\n{text}")
    scratch.unlink()

    # D2: COMMENT with the base's strings, exec'd over the module; the tree's file.
    comment = list(X.COMMENT)
    at = comment.index(NEW_LINES[0])
    base_comment = comment[:at] + [BASE_LINE] + comment[at + 2:]
    exec(compile(f"COMMENT = {base_comment!r}", "<mutant COMMENT>", "exec"), X.__dict__)
    try:
        ok, text = run_guard()
    finally:
        X.COMMENT = comment
    print(f"\nD2 only _comment changed (COMMENT the base's): guard {'green' if ok else 'RED'}\n{text}")
    ok, text = run_guard()
    print(f"\nBoth as the tree has them: guard {'green' if ok else 'RED'}\n{text}")

    after = hashes()
    print(f"\nexcerpts.py and excerpts.json sha256 after: {after}; unchanged {after == before}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
