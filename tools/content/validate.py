#!/usr/bin/env python3
"""
Validates a built content directory's catalog.json and curriculum.json
against the JSON Schemas in content/*.schema.json.

Usage:
    python3 tools/content/validate.py [--dir app/public/content]
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

try:
    import jsonschema
except ImportError:  # pragma: no cover
    print(
        "error: the 'jsonschema' package is required (pip install -r "
        "tools/content/requirements.txt)",
        file=sys.stderr,
    )
    sys.exit(2)

REPO_ROOT = Path(__file__).resolve().parents[2]
CONTENT_SRC = REPO_ROOT / "content"
DEFAULT_DIR = REPO_ROOT / "app" / "public" / "content"


def load(path: Path) -> object:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def validate_one(name: str, data_path: Path, schema_path: Path) -> list[str]:
    errors: list[str] = []
    if not data_path.exists():
        return [f"{name}: {data_path} does not exist"]
    if not schema_path.exists():
        return [f"{name}: schema {schema_path} does not exist"]
    data = load(data_path)
    schema = load(schema_path)
    validator = jsonschema.Draft202012Validator(schema)
    for err in sorted(validator.iter_errors(data), key=lambda e: list(e.path)):
        location = "/".join(str(p) for p in err.path) or "<root>"
        errors.append(f"{name}: {location}: {err.message}")
    return errors


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dir", type=Path, default=DEFAULT_DIR)
    args = parser.parse_args()

    all_errors: list[str] = []
    all_errors += validate_one(
        "catalog.json", args.dir / "catalog.json", CONTENT_SRC / "catalog.schema.json"
    )
    all_errors += validate_one(
        "curriculum.json",
        args.dir / "curriculum.json",
        CONTENT_SRC / "curriculum.schema.json",
    )

    if all_errors:
        print(f"content validation FAILED ({len(all_errors)} error(s)):", file=sys.stderr)
        for e in all_errors:
            print(f"  - {e}", file=sys.stderr)
        sys.exit(1)

    print(f"content validation OK: {args.dir}")


if __name__ == "__main__":
    main()
