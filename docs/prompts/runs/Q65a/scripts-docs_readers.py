"""Which `docs/` paths a script, a test or a workflow reads, and which it only mentions (Q65a).

Searches tools/, app/tests/, app/scripts/ and .github/ (the brief's scope). Two lists:

1. Every line that builds a `docs/` path in code: a `"docs"` or `'docs'` path segment
   (`ROOT / "docs" / ...`, `join(ROOT, 'docs', ...)`) or a quoted string starting with `docs/`.
   These are the candidate readers; the entry reads each and says what it opens.
2. Every `docs/...` mention, grouped by path, with the files it appears in. A path that appears
   only here and never in list 1 is cited in prose, a comment or a docstring.

    python docs/prompts/runs/Q65a/scripts/docs_readers.py .
"""
from __future__ import annotations

import re
import sys
from collections import defaultdict
from pathlib import Path

root = Path(sys.argv[1]).resolve()
ROOTS = ["tools", "app/tests", "app/scripts", ".github"]
SUFFIXES = {".py", ".ts", ".mjs", ".js", ".cjs", ".yml", ".yaml", ".json"}
CODE = re.compile(r"""["']docs["']|["'](?:\.\./)*docs/[^"'\s]*["']""")
MENTION = re.compile(r"docs/[A-Za-z0-9_.*<>{}-]+(?:/[A-Za-z0-9_.*<>{}-]+)*")

files = []
for r in ROOTS:
    for p in (root / r).rglob("*"):
        if p.is_file() and p.suffix in SUFFIXES and "__pycache__" not in p.parts and "node_modules" not in p.parts:
            if "docs/prompts/runs/Q65a" in p.as_posix():
                continue
            files.append(p)

print("## 1. Lines that build a docs/ path in code")
mentions: dict[str, set[str]] = defaultdict(set)
for p in sorted(files):
    rel = p.relative_to(root).as_posix()
    for n, line in enumerate(p.read_text(encoding="utf-8", errors="replace").splitlines(), start=1):
        if CODE.search(line):
            print(f"{rel}:{n}: {line.strip()[:200]}")
        for m in MENTION.finditer(line):
            path = m.group(0).rstrip(".")
            mentions[path].add(rel)

print()
print("## 2. Every docs/ mention, by path (the files it appears in)")
for path in sorted(mentions):
    where = sorted(mentions[path])
    print(f"{path}: {len(where)} file(s): {' '.join(where[:6])}{' ...' if len(where) > 6 else ''}")
