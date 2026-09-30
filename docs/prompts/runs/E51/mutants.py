"""E51 mutants: each replaces one line of excerpts.py in memory and runs the merge's three test classes."""
import io
import sys
import unittest
from pathlib import Path

#: The checkout this script sits in (run from `docs/prompts/runs/E51/` or a copy under `build/`).
ROOT = next(p for p in Path(__file__).resolve().parents if (p / "tools" / "content" / "excerpts.py").is_file())
sys.path.insert(0, str(ROOT / "tools" / "content"))
sys.path.insert(0, str(ROOT))

import excerpts  # noqa: E402
from tools.content.tests import test_excerpts  # noqa: E402

SOURCE = (ROOT / "tools" / "content" / "excerpts.py").read_text(encoding="utf-8")

MUTANTS = {
    "M1 staleness never judged": ("stale = approval_staleness(rows[at], current) if at is not None else []", "stale = []"),
    "M2 renewal bytes never checked": ("fault = _renewal_fault(event, current)", "fault = None"),
    "M3 superseded rows not indexed by event": (
        'by_event.setdefault(entry["event"], {k: v for k, v in entry.items() if k != "supersededBy"})', "pass"),
    "M4 main passes no current bytes": ('{item["id"] for item in catalog}, current_shas)', '{item["id"] for item in catalog})'),
    "M5 a rejection never withdraws": ("if at is not None and stale:", "if False:"),
    "M6 the renewal appended beside the stale row": ("rows[at] = row", "rows.append(row)"),
    "M7 the old row stamped with the new cutter": (
        'superseded.append({**same, "supersededBy": row["event"]})\n                rows[at] = row',
        'superseded.append({**same, "supersededBy": row["event"], "cutVersion": CUT_VERSION})\n                rows[at] = row'),
    "M8 superseded always written": ('if data.get("superseded"):', "if True:"),
    "M9 provenance judged without the current bytes": ("if current_parent_sha and approved and approved != current_parent_sha:",
                                                       "if approved and approved != current_parent_sha:"),
}

CLASSES = ("TheRenewal", "TheMerge", "TheCutVersion")


def run() -> unittest.TestResult:
    suite = unittest.TestSuite()
    loader = unittest.TestLoader()
    for name in CLASSES:
        suite.addTests(loader.loadTestsFromTestCase(getattr(test_excerpts, name)))
    return unittest.TextTestRunner(stream=io.StringIO(), verbosity=0).run(suite)


def main() -> int:
    pristine = dict(excerpts.__dict__)
    base = run()
    print(f"unmutated: {base.testsRun} run, {len(base.failures)} failed, {len(base.errors)} errors")
    survivors = 0
    for label, (old, new) in MUTANTS.items():
        count = SOURCE.count(old)
        if count != 1:
            print(f"{label}: the line occurs {count} times, not applied")
            survivors += 1
            continue
        exec(compile(SOURCE.replace(old, new), "excerpts-mutant.py", "exec"), excerpts.__dict__)
        result = run()
        red = sorted({test.id().rsplit(".", 1)[-1].split(" ")[0] for test, _ in result.failures + result.errors})
        print(f"{label}: {len(red)} red: {', '.join(red) or 'NONE (survived)'}")
        survivors += 0 if red else 1
        excerpts.__dict__.clear()
        excerpts.__dict__.update(pristine)
    return 1 if survivors else 0


if __name__ == "__main__":
    raise SystemExit(main())
