"""
E50a: the red run of the final tests on the committed code. Each named file is put back to its bytes at the
base (`git show 2da6b8ef:<path>`, read only; no checkout), the tests are run, and the working file's bytes are
restored and checked. Output: red-final-on-committed.txt.
"""
import os
import shutil
import subprocess
import sys
from pathlib import Path

W = Path(__file__).resolve().parents[4]
BASE = "2da6b8ef"
OUT = W / "docs" / "prompts" / "runs" / "E50a" / "red-final-on-committed.txt"
NPX = shutil.which("npx") or "npx"
RUNS = [
    (["tools/content/convert.py"], [sys.executable, "-m", "unittest", "discover", "-s", "tools/content/tests", "-t", "tools/content", "-p", "test_convert_cache.py"], W),
    (["app/src/curriculum/material.ts", "app/src/curriculum/load.ts", "app/src/curriculum/types.ts", "app/src/data/encounterStore.ts", "app/src/data/progressStore.ts"],
     [NPX, "vitest", "run", "tests/unit/formerIdentity.test.ts"], W / "app"),
]
lines = []
for paths, command, cwd in RUNS:
    kept = {p: (W / p).read_bytes() for p in paths}
    try:
        for p in paths:
            base = subprocess.run(["git", "-C", str(W), "show", f"{BASE}:{p}"], capture_output=True, check=True).stdout
            (W / p).write_bytes(base)
        done = subprocess.run(command, cwd=cwd, capture_output=True, text=True, encoding="utf-8", errors="replace",
                              env=dict(os.environ, PYTHONIOENCODING="utf-8"))
    finally:
        for p, data in kept.items():
            (W / p).write_bytes(data)
    assert all((W / p).read_bytes() == data for p, data in kept.items()), "not restored"
    text = done.stdout + done.stderr
    keep = [l for l in text.splitlines() if l.startswith(("FAIL:", "ERROR:", "Ran ", "FAILED", "OK", "AssertionError", "AttributeError"))
            or any(k in l for k in (" × ", " ✓ ", "Tests ", "AssertionError", "TypeError"))]
    lines.append(f"## {' '.join(command[1:])} with {', '.join(paths)} at {BASE}: exit {done.returncode}")
    lines += ["   " + l.strip()[:300] for l in keep]
OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
print("\n".join(lines))
