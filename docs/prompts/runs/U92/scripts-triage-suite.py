"""Triage U92's whole browser run (e2e-all-fixed.txt): each failing test, its spec file, whether that
spec file reaches the Skills screen at all (a route to skills, or `#skills-list`, anywhere in the file),
and the first error line the run printed for it. U92 changes only the Skills row's detail string and a
rule scoped to `#skills-list`, so a failing spec that never opens Skills cannot see either change.
Usage: python scripts-triage-suite.py [log]"""
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
APP = HERE.parents[3] / "app"
sys.stdout.reconfigure(encoding="utf-8")
log = (HERE / (sys.argv[1] if len(sys.argv) > 1 else "e2e-all-fixed.txt")).read_text(encoding="utf-8", errors="replace")

failed = []
for line in log.splitlines():
    m = re.match(r"^  x\s+\d+ (tests\\e2e\\[^:]+):(\d+):\d+ › (.*?)(?: \([\d.]+m?s\))?$", line)
    if m:
        failed.append((m.group(1).replace("\\", "/"), m.group(2), m.group(3)))

# The summary's own list: "N failed", "N flaky", "N passed", "N skipped".
for key in ("failed", "flaky", "passed", "skipped", "did not run"):
    m = re.search(rf"^\s+(\d+) {key}", log, re.M)
    print(f"{key}: {m.group(1) if m else 0}")
print()

blocks = re.split(r"\n  \d+\) ", log)
seen = set()
for spec, line_no, title in failed:
    text = (APP / spec).read_text(encoding="utf-8")
    skills = bool(re.search(r"plan/skills|today/skills|#skills-list|'skills'", text))
    first_error = ""
    for block in blocks:
        if block.startswith(f"{spec.replace('/', chr(92))}:{line_no}:") and title[:40] in block:
            err = re.search(r"^\s+(Error: .*|TimeoutError: .*|expect\(.*)$", block, re.M)
            first_error = err.group(1).strip()[:160] if err else ""
            break
    key = (spec, line_no, title)
    if key in seen:
        continue
    seen.add(key)
    print(f"{spec}:{line_no} › {title}")
    print(f"    reaches Skills: {'yes' if skills else 'no'}; first error: {first_error or '(see the log)'}")
