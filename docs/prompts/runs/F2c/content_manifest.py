"""
F2c: a sha256 manifest of the built app content (app/public/content), or the comparison of two.

    python docs/prompts/runs/F2c/content_manifest.py write <out-file>
    python docs/prompts/runs/F2c/content_manifest.py compare <before-file> <after-file>

What the app reads is this folder; if it is byte-identical before and after, no screen can differ.
"""
from __future__ import annotations

import hashlib
import sys
from pathlib import Path

WT = Path(__file__).resolve().parents[4]
CONTENT = WT / "app" / "public" / "content"

if sys.argv[1] == "write":
    lines = []
    for path in sorted(CONTENT.rglob("*")):
        if path.is_file():
            lines.append(f"{hashlib.sha256(path.read_bytes()).hexdigest()}  {path.relative_to(CONTENT).as_posix()}")
    Path(sys.argv[2]).write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"{len(lines)} files hashed under app/public/content")
else:
    a = dict(reversed(line.split("  ", 1)) for line in Path(sys.argv[2]).read_text(encoding="utf-8").splitlines())
    b = dict(reversed(line.split("  ", 1)) for line in Path(sys.argv[3]).read_text(encoding="utf-8").splitlines())
    changed = sorted(k for k in a.keys() & b.keys() if a[k] != b[k])
    print(f"files before {len(a)}, after {len(b)}; only before {sorted(a.keys() - b.keys())}; "
          f"only after {sorted(b.keys() - a.keys())}; changed {changed}")
    print("byte-identical" if not changed and a.keys() == b.keys() else "DIFFERENT")
