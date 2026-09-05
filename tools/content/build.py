#!/usr/bin/env python3
"""
PianoPath content build (P0 skeleton).

Produces `app/public/content/` from `content/` so the app has something
schema-valid to precache and load even before any real catalog/curriculum
data exists (P4/P5). Later phases extend this with fetch/convert/author
steps (see docs/03-content-pipeline.md); this skeleton only:

  1. writes an empty-but-valid catalog.json ([])
  2. writes an empty-but-valid curriculum.json ({version, tracks: [], stages: []})
  3. copies the JSON schemas alongside them (handy for the app/tools to
     reference, and for a human to eyeball what "valid" means)
  4. runs validate.py against what it just wrote

Usage:
    python3 tools/content/build.py [--out DIR]
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
CONTENT_SRC = REPO_ROOT / "content"
DEFAULT_OUT = REPO_ROOT / "app" / "public" / "content"


def write_json(path: Path, data: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")


def build(out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)

    catalog: list = []
    curriculum = {"version": 1, "tracks": [], "stages": []}

    write_json(out_dir / "catalog.json", catalog)
    write_json(out_dir / "curriculum.json", curriculum)

    for schema_name in ("catalog.schema.json", "curriculum.schema.json"):
        src = CONTENT_SRC / schema_name
        if src.exists():
            shutil.copy2(src, out_dir / schema_name)
        else:
            print(f"warning: {src} not found, skipping copy", file=sys.stderr)

    print(f"wrote {out_dir / 'catalog.json'} ({len(catalog)} items)")
    print(f"wrote {out_dir / 'curriculum.json'} (0 stages)")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument(
        "--skip-validate",
        action="store_true",
        help="skip running validate.py after building (useful in constrained sandboxes)",
    )
    args = parser.parse_args()

    build(args.out)

    if not args.skip_validate:
        validate_script = Path(__file__).resolve().parent / "validate.py"
        result = subprocess.run(
            [sys.executable, str(validate_script), "--dir", str(args.out)],
            check=False,
        )
        if result.returncode != 0:
            sys.exit(result.returncode)


if __name__ == "__main__":
    main()
