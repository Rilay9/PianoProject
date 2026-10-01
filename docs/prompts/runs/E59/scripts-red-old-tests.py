"""
E59: the base's versions (13e1b1a8, copied out read only into build/oldtests/tests) of the content tests E59 revised, run
on the new tree — E59's relation table, its moved files and the final build — so each revised test's old assertion is
seen red against what E59 changed, not inferred. The app's lineage test is run the same way (its base version as
app/build/e59/oldLineage.table.ts, through scripts-vitest.reader.config.mts's pattern). Output: runs/E59/red-old-tests.txt.

    python scripts-red-old-tests.py
"""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

W = Path(__file__).resolve().parents[4]
TESTS = [
    "tests.test_convert_cache.TestRepairedIdentities.test_the_committed_relations_re_prove_on_the_committed_scores",
    "tests.test_measured_truth.{cls}.test_a_repaired_file_carries_its_old_identity_and_no_approval_is_renewed_by_it",
    "tests.test_excerpts.TheRepairedCut.test_a_one_relation_for_the_one_cut_the_build_produced",
]


def main() -> int:
    old = W / "build" / "oldtests"
    text = (old / "tests" / "test_measured_truth.py").read_text(encoding="utf-8")
    at = text.index("def test_a_repaired_file_carries_its_old_identity")
    cls = text[:at].rsplit("\nclass ", 1)[1].split("(", 1)[0]
    env = {**os.environ, "PYTHONPATH": str(W / "tools" / "content"), "PYTHONIOENCODING": "utf-8"}
    lines = ["the base's versions of the revised tests, on the new tree:"]
    for test in TESTS:
        run = subprocess.run([sys.executable, "-m", "unittest", test.format(cls=cls)], cwd=old, env=env, capture_output=True,
                             text=True, encoding="utf-8", errors="replace")
        said = [line for line in run.stderr.splitlines() if line.startswith(("AssertionError", "FAIL:", "ERROR:"))][:2]
        lines.append(f"  {test.format(cls=cls)}: exit {run.returncode}; {said}")
    config = W / "build" / "e59" / "old-lineage.config.mts"
    config.write_text(
        "export default { root: " + repr(str(W / "app").replace("\\", "/")) + ", test: { dir: "
        + repr(str(W / "app" / "build" / "e59").replace("\\", "/")) + ", include: ['oldLineage.table.ts'], environment: 'node' } };\n",
        encoding="utf-8")
    run = subprocess.run(["npx.cmd", "vitest", "run", "--config", str(config)], cwd=W / "app", capture_output=True, text=True,
                         encoding="utf-8", errors="replace")
    failing = [line.strip() for line in run.stdout.splitlines() if line.strip().startswith("×")][:4]
    summary = [line.strip() for line in run.stdout.splitlines() if line.strip().startswith("Tests ")]
    lines.append(f"  app/tests/unit/repairedTempoLineage.test.ts (base): exit {run.returncode}; {summary}; failing {failing}")
    (W / "docs/prompts/runs/E59/red-old-tests.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))
    return 0


if __name__ == "__main__":
    sys.exit(main())
