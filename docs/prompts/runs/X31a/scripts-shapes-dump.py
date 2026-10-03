"""
X31a: writes `test_difficulty._app_shapes()` to JSON (name -> {xml, app, build}) for the app-side probe
(`scripts-shapes-app.test.ts`), so every app number in the table is read back through the app's own reader, the
two shapes X31a added included.

    python docs/prompts/runs/X31a/scripts-shapes-dump.py <out.json>
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / "tools" / "content"))
sys.path.insert(0, str(ROOT / "tools" / "content" / "tests"))

import test_difficulty as t  # noqa: E402

shapes = {name: {"xml": xml, "app": app, "build": build} for name, (xml, _beats, app, build) in t._app_shapes().items()}  # noqa: SLF001
Path(sys.argv[1]).write_text(json.dumps(shapes, indent=1), encoding="utf-8")
print(f"shapes: {len(shapes)} -> {sys.argv[1]}")
