"""
E50's red runs on the committed code (the base, <base sha>), for the acceptance cases that are not in
`red-unit-base.txt` (the converter's new class ran red on the committed converter before the change, in place):

1. `test_convert_cache.TestRepairedIdentities` against the committed converter: a scratch tree under build/e50/red/
   holding the base's `convert.py`, `abc_tools.py` and `common.py` (`git show`), the worktree's test file, its
   `__init__.py`, the fixture it reads and E50a's table, with no relation file — the committed code as it stands.
2. `repairedTempoLineage.test.ts` against the committed data: the relation file set aside and `pdmx.json` put back as
   the base holds it, the test run, both restored byte for byte (checked) whatever the run did.
Output: runs/E50/red-on-base.txt (the summary and failing names; the full logs are not kept).
"""
from __future__ import annotations

import hashlib
import shutil
import subprocess
import sys
from pathlib import Path

W = Path(__file__).resolve().parents[4]
RED = W / "build" / "e50" / "red"
HOLD = W / "build" / "e50" / "red-hold"
LOG = W / "docs" / "prompts" / "runs" / "E50" / "red-on-base.txt"
NPX = "npx.cmd" if sys.platform == "win32" else "npx"


def git_show(base: str, rel: str) -> bytes:
    return subprocess.run(["git", "-C", str(W), "show", f"{base}:{rel}"], capture_output=True, check=True).stdout


def summary(text: str) -> list[str]:
    keep = ("FAIL", "ERROR", "Ran ", "OK", "FAILED", "Error:", " Tests ", "Test Files", "×", "✓")
    return [line.rstrip() for line in text.splitlines() if any(k in line for k in keep)][:40]


def main(argv: list[str]) -> int:
    base = argv[0]
    lines = [f"base {base}"]
    # 1. the relation's unit cases on the committed converter
    if RED.exists():
        shutil.rmtree(RED)
    content = RED / "tools" / "content"
    (content / "tests" / "fixtures").mkdir(parents=True)
    for name in ("convert.py", "abc_tools.py", "common.py", "former_identities.json"):
        (content / name).write_bytes(git_show(base, f"tools/content/{name}"))
    shutil.copy2(W / "tools/content/tests/__init__.py", content / "tests" / "__init__.py")
    shutil.copy2(W / "tools/content/tests/test_convert_cache.py", content / "tests" / "test_convert_cache.py")
    shutil.copy2(W / "tools/content/tests/fixtures/two-spines.krn", content / "tests" / "fixtures" / "two-spines.krn")
    done = subprocess.run([sys.executable, "-m", "unittest", "-v", "tests.test_convert_cache.TestRepairedIdentities"],
                          cwd=content, capture_output=True, text=True, encoding="utf-8", errors="replace")
    lines.append(f"\n1. test_convert_cache.TestRepairedIdentities on the committed converter: exit {done.returncode}")
    lines += [f"   {line}" for line in summary(done.stdout + done.stderr)]
    shutil.rmtree(RED)

    # 2. the app's lineage cases on the committed data
    relation = W / "tools/content/repaired_identities.json"
    table = W / "content/sources/pdmx.json"
    HOLD.mkdir(parents=True, exist_ok=True)
    kept = {relation: relation.read_bytes(), table: table.read_bytes()}
    try:
        shutil.move(str(relation), str(HOLD / relation.name))
        table.write_bytes(git_show(base, "content/sources/pdmx.json"))
        done = subprocess.run([NPX, "vitest", "run", "tests/unit/repairedTempoLineage.test.ts"], cwd=W / "app",
                              capture_output=True, text=True, encoding="utf-8", errors="replace")
    finally:
        for path, data in kept.items():
            path.write_bytes(data)
        shutil.rmtree(HOLD, ignore_errors=True)
    restored = all(hashlib.sha256(path.read_bytes()).digest() == hashlib.sha256(data).digest() for path, data in kept.items())
    lines.append(f"\n2. repairedTempoLineage.test.ts on the committed data: exit {done.returncode}; restored byte for byte: {restored}")
    lines += [f"   {line}" for line in summary(done.stdout + done.stderr)]
    LOG.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))
    return 0 if restored else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
