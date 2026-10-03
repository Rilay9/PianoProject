"""Q81: does `docs/08`'s file index have a line for every test file, and one line for each?

A file line is a list line (`- ...`) under "## Every spec file, one line each" whose first backticked name
is the file's. Scope: `app/tests/e2e/*.spec.ts`, `app/tests/unit/*.test.ts`, `app/tests/states/*.spec.ts`,
`app/tests/tour/*.spec.ts`, `tools/content/tests/test_*.py`, `tools/midi-cleanup/tests/test_*.py` — the
directories the index has sections for. Helpers and fixtures are not checked. Run from the worktree root;
an optional argument names another copy of `docs/08` to read (the committed one, for the before).
"""
from __future__ import annotations

import re
import sys
from collections import Counter
from pathlib import Path

root = Path.cwd()
doc_path = Path(sys.argv[1]) if len(sys.argv) > 1 else root / "docs" / "08-test-map.md"
doc = doc_path.read_text(encoding="utf-8").splitlines()
start = next(i for i, line in enumerate(doc) if line.startswith("## Every spec file, one line each"))
end = next((i for i in range(start + 1, len(doc)) if doc[i].startswith("## ")), len(doc))

section = None
lines_by_section: dict[str, Counter] = {}
for line in doc[start:end]:
    heading = re.match(r"^### `([^`]+)`", line)
    if heading:
        section = heading.group(1).rstrip("/")
        lines_by_section.setdefault(section, Counter())
        continue
    first = re.match(r"^- `([^`]+)`", line)
    if section and first:
        lines_by_section[section][first.group(1)] += 1

globs = {
    "app/tests/e2e": "*.spec.ts",
    "app/tests/unit": "*.test.ts",
    "app/tests/states": "*.spec.ts",
    "app/tests/tour": "*.spec.ts",
    "tools/content/tests": "test_*.py",
    "tools/midi-cleanup/tests": "test_*.py",
}
missing = 0
for folder, pattern in globs.items():
    listed = lines_by_section.get(folder, Counter())
    files = sorted(p.name for p in (root / folder).glob(pattern))
    for name in files:
        if listed[name] == 0:
            print(f"no file line: {folder}/{name}")
            missing += 1
    for name, count in sorted(listed.items()):
        if count > 1:
            print(f"{count} lines beginning with `{name}` in {folder}")
    print(f"{folder}: {len(files)} files, {sum(1 for n in files if listed[n] > 0)} with a line")
print(f"missing: {missing}")
