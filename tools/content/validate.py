#!/usr/bin/env python3
"""
Validates a built content directory.

docs/03-content-pipeline.md §3 step 5. The JSON Schemas answer "is this the
right shape?"; the checks after them answer the questions a schema cannot:

  * does every file a catalog item points at actually exist?
  * does every curriculum option point at an item that exists?
  * is every item's licence stated, and is it one we may redistribute?
  * is the duration plausible — between five seconds and twenty minutes?
  * are ids unique, and does every `variantOf` name a real parent?

A failure here stops the build, because each of these produces a library entry
that looks fine and breaks when the learner opens it.

Usage:
    python3 tools/content/validate.py [--dir app/public/content] [--strict-license]
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

try:
    import jsonschema
except ImportError:  # pragma: no cover
    print(
        "error: the 'jsonschema' package is required (pip install -r "
        "tools/content/requirements.txt)",
        file=sys.stderr,
    )
    sys.exit(2)

from common import CONTENT_SRC, DEFAULT_OUT  # noqa: E402
from licensing import NC_PERSONAL_TAG, Verdict, license_verdict  # noqa: E402

#: docs/03 §3 step 5: "duration sanity (5 s – 20 min)".
MIN_DURATION_SEC = 5
MAX_DURATION_SEC = 20 * 60


def load(path: Path) -> object:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def validate_schema(name: str, data_path: Path, schema_path: Path) -> list[str]:
    if not data_path.exists():
        return [f"{name}: {data_path} does not exist"]
    if not schema_path.exists():
        return [f"{name}: schema {schema_path} does not exist"]
    validator = jsonschema.Draft202012Validator(load(schema_path))
    return [
        f"{name}: {'/'.join(str(p) for p in err.path) or '<root>'}: {err.message}"
        for err in sorted(validator.iter_errors(load(data_path)), key=lambda e: list(e.path))
    ]


def validate_catalog(
    catalog: list, content_dir: Path, strict_license: bool, allow_nc: bool = False
) -> list[str]:
    errors: list[str] = []
    ids = [item["id"] for item in catalog]
    duplicates = sorted({i for i in ids if ids.count(i) > 1})
    for duplicate in duplicates:
        errors.append(f"catalog: duplicate id {duplicate}")

    known = set(ids)
    for item in catalog:
        item_id = item["id"]
        file_ref = item.get("file")
        if file_ref:
            if not (content_dir / file_ref).exists():
                errors.append(f"{item_id}: file {file_ref} does not exist")
        elif not item.get("importHint") and item.get("type") != "drill":
            errors.append(f"{item_id}: no file and no importHint")

        parent = item.get("variantOf")
        if parent and parent not in known:
            errors.append(f"{item_id}: variantOf {parent} is not in the catalog")

        licence = (item.get("source") or {}).get("license", "")
        if not licence:
            errors.append(f"{item_id}: no licence")
        elif strict_license:
            decision = license_verdict(licence, source=item_id, allow_nc=allow_nc)
            if decision.verdict is not Verdict.BUNDLE:
                errors.append(f"{item_id}: licence {licence!r} — {decision.reason}")

        duration = item.get("durationSec")
        if duration is not None and not (MIN_DURATION_SEC <= duration <= MAX_DURATION_SEC):
            errors.append(
                f"{item_id}: duration {duration}s outside "
                f"{MIN_DURATION_SEC}–{MAX_DURATION_SEC}s"
            )
    return errors


def validate_curriculum(curriculum: dict, catalog: list) -> list[str]:
    errors: list[str] = []
    known = {item["id"] for item in catalog}
    tracks = {track["id"] for track in curriculum.get("tracks", [])}
    for stage in curriculum.get("stages", []):
        for unit in stage.get("units", []):
            if unit.get("track") and unit["track"] not in tracks:
                errors.append(f"unit {unit['id']}: unknown track {unit['track']}")
            for lesson in unit.get("lessons", []):
                for field in ("exerciseOptions", "songOptions"):
                    for option in lesson.get(field, []):
                        if option not in known:
                            errors.append(
                                f"lesson {lesson['id']}: {field} references unknown item {option}"
                            )
    return errors


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dir", type=Path, default=DEFAULT_OUT)
    parser.add_argument(
        "--strict-license",
        action="store_true",
        help="also refuse licences that are not redistributable (docs/03 §1)",
    )
    parser.add_argument(
        "--allow-nc",
        action="store_true",
        help="accept CC BY-NC editions — a personal build only (docs/00 D10a)",
    )
    args = parser.parse_args()

    errors: list[str] = []
    errors += validate_schema(
        "catalog.json", args.dir / "catalog.json", CONTENT_SRC / "catalog.schema.json"
    )
    errors += validate_schema(
        "curriculum.json", args.dir / "curriculum.json", CONTENT_SRC / "curriculum.schema.json"
    )

    if not errors:
        catalog = load(args.dir / "catalog.json")
        curriculum = load(args.dir / "curriculum.json")
        assert isinstance(catalog, list) and isinstance(curriculum, dict)
        errors += validate_catalog(catalog, args.dir, args.strict_license, args.allow_nc)
        errors += validate_curriculum(curriculum, catalog)

    if errors:
        print(f"content validation FAILED ({len(errors)} error(s)):", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        sys.exit(1)

    catalog = load(args.dir / "catalog.json")
    assert isinstance(catalog, list)
    personal = [item["id"] for item in catalog if NC_PERSONAL_TAG in (item.get("tags") or [])]
    print(f"content validation OK: {args.dir} ({len(catalog)} catalog items)")
    if personal:
        # Loudly, every time: this build is not for a public URL.
        print(
            f"NOTE: {len(personal)} item(s) are CC BY-NC and bundled for a personal build "
            "(docs/00 D10a). Do not deploy this build publicly."
        )


if __name__ == "__main__":
    main()
