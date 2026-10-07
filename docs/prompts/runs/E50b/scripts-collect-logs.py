"""
E50b (Entry 181): copies the run's logs from build/e50b into the run folder, each under 300 KB; the whole unit suite's
log is trimmed to its summary and failing names (the full log is not kept). Writes build-exits.txt from the builds' exit
files. Run once at the end.
"""
from __future__ import annotations

import re
import shutil
from pathlib import Path

W = Path(__file__).resolve().parents[4]
B = W / "build" / "e50b"
R = W / "docs" / "prompts" / "runs" / "E50b"
COPY = ["build-before.txt", "build-after.txt", "content-suite.txt", "green-app-lineage.txt", "green-python-units.txt", "lint.txt",
        "red-app-base.txt", "red-python-base.txt", "review-check.txt", "validate.txt", "vitest-rerun.txt", "build-app.txt",
        "record-mirrors.txt", "parity.txt", "tsc.txt"]

for name in COPY:
    source = B / name
    if source.stat().st_size > 300_000:
        raise SystemExit(f"{name} is over 300 KB")
    shutil.copyfile(source, R / name)

full = (B / "vitest-all.txt").read_text(encoding="utf-8", errors="replace")
keep = ["The whole unit suite (npx vitest run in app/, on the after build's content): its summary and failing names, with each "
        f"failure's first line; the full log ({len(full.encode('utf-8')) // 1024} KB) was not kept."]
lines = full.splitlines()
for index, line in enumerate(lines):
    if re.match(r"^\s*(Test Files|Tests)\s", line):
        keep.append(line.strip())
    if line.startswith(" FAIL  "):
        keep.append(line.rstrip())
        following = next((l for l in lines[index + 1:index + 4] if l.strip() and not l.startswith(" FAIL")), "")
        if following:
            keep.append("   " + following.strip())
(R / "vitest-all.txt").write_text("\n".join(keep) + "\n", encoding="utf-8")
(R / "build-exits.txt").write_text("".join(f"{name} exit {(B / (name + '.exit')).read_text().strip()}\n" for name in ("build-before", "build-after")), encoding="utf-8")
print("\n".join(keep))
print(sorted(p.name for p in R.iterdir()))
