"""U118: the four unit files that fail in this worktree, run once more on the two source files as at HEAD
(the tests as they are), to tell an environment failure from this lane's. Source restored byte for byte."""
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from mutants import OUT, ROOT, SS, WR, run  # noqa: E402

FILES = ["tests/unit/lessonClaimsAboutApp.test.ts", "tests/unit/lessonClaimsAboutMusic.test.ts", "tests/unit/midiParity.test.ts", "tests/unit/taughtByAncestry.test.ts"]
OUT.mkdir(parents=True, exist_ok=True)
saved = {p: p.read_bytes() for p in (WR, SS)}
try:
    for p in (WR, SS):
        p.write_bytes(subprocess.check_output(["git", "show", f"HEAD:{p.relative_to(ROOT).as_posix()}"], cwd=ROOT))
    code = run(["npx", "vitest", "run", *FILES], OUT / "unit-four-on-base.txt")
    print(f"vitest on base source: {code}")
finally:
    for p, data in saved.items():
        p.write_bytes(data)
    print(f"restored: {all(p.read_bytes() == d for p, d in saved.items())}")
