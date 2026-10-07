"""RS1 evidence: each mutant of the test suite, run against an edition file, with the verifier's failure lines.

    py -3.11 docs/prompts/runs/RS1/mutants.py <edition.mxl> <fixture.json>

Then the mutant test is run once against a verifier that passes everything (`verify` replaced by a stub), to show the
test itself goes red when the checker does not catch a change: the red-first line for the mutation cases.
"""
from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(REPO / "tools" / "content"))
sys.path.insert(0, str(REPO))

from pdmx import restaff_verify as rv  # noqa: E402
from tools.content.tests import test_restaff as t  # noqa: E402

edition, fixture_path = Path(sys.argv[1]), Path(sys.argv[2])
data = edition.read_bytes()
fixture = json.loads(fixture_path.read_text(encoding="utf-8"))

print("the edition as written:", "PASS" if rv.verify(data, fixture).ok else "FAIL")
print("the edition re-serialised by ElementTree:", "PASS" if rv.verify(t.serial(t.tree(data)), fixture).ok else "FAIL")
for name, (make, named) in t.MUTANTS.items():
    verdict = rv.verify(make(data), fixture)
    print(f"\nmutant {name}: {'PASS (not caught)' if verdict.ok else 'FAIL'} ({len(verdict.failures)} failure lines)")
    for line in verdict.failures[:6]:
        print("   ", line)
    if len(verdict.failures) > 6:
        print(f"    ... {len(verdict.failures) - 6} more")
    print("    names", named, ":", all(any(p in f for f in verdict.failures) for p in named))

# The red-first line: the mutant test against a checker that passes everything.
real = rv.verify
rv.verify = lambda data, fixture: rv.Verdict()  # noqa: E731
t.edition_bytes = lambda: data  # setUpClass reads these two; point them at the files given
t.FIXTURE = fixture_path
suite = unittest.TestSuite([t.TestMutants("test_each_mutant_fails_naming_its_bar_and_event")])
result = unittest.TextTestRunner(stream=sys.stdout, verbosity=0).run(suite)
print("\nwith a checker that passes everything, the mutant test:", "RED" if result.failures and not result.errors else "GREEN or ERROR",
      f"({len(result.failures)} failing subtests of {len(t.MUTANTS)}, {len(result.errors)} errors)")
rv.verify = real
