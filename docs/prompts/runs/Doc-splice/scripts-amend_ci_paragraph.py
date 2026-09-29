"""Replaces the CI paragraph `splice.py` inserted into docs/08 with `splice.CI_PARAGRAPH` as it now reads.

One amendment after the first splice: docs-integrity.yml cancels an older docs run when a newer push
arrives (`cancel-in-progress: true`), so "checked on every push" gained that clause. The block replaced
is exactly the paragraph this seam inserted (from its first line to "Doc-splice, Entry 121.)"); no line
that was in the file at 71ee5f4 is touched.

Run from the repository root: `python docs/prompts/runs/Doc-splice/scripts/amend_ci_paragraph.py`.
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import splice  # noqa: E402

PATH = splice.ROOT / splice.D08


def main() -> int:
    raw = PATH.read_bytes().decode("utf-8")
    lines = raw[:-2].split("\r\n") if raw.endswith("\r\n") else raw.split("\r\n")
    starts = [i for i, line in enumerate(lines) if line.startswith("**CI** (`.github/workflows/ci.yml`)")]
    ends = [i for i, line in enumerate(lines) if line.endswith("Doc-splice, Entry 121.)")]
    if len(starts) != 1 or len(ends) != 1 or ends[0] < starts[0]:
        print(f"REFUSED: paragraph start {starts}, end {ends}")
        return 1
    new = splice.wrap(splice.CI_PARAGRAPH, 99, "", "")
    old = lines[starts[0]:ends[0] + 1]
    if old == new:
        print("already as it reads; nothing written")
        return 0
    lines[starts[0]:ends[0] + 1] = new
    PATH.write_bytes(("\r\n".join(lines) + ("\r\n" if raw.endswith("\r\n") else "")).encode("utf-8"))
    print(f"replaced lines {starts[0] + 1}-{ends[0] + 1} ({len(old)} lines) with {len(new)} lines")
    return 0


if __name__ == "__main__":
    sys.exit(main())
