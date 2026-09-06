"""
Accepted rows -> content/scores/pdmx/ + content/sources/pdmx.json (replan §2.1).

This is the line the archive never crosses. What lands in the repository is the
*converted, normalised* `.mxl` and a table describing it, so the build does no
music21 work for PDMX at all and needs nothing but the repository.

`pdmx.json` records, per item: the CID, both checksums, the CSV facts the
selection used, the features, the level estimate and its inputs, and the
review decision with its note. `import_pdmx.py` verifies every checksum on
every build and fails naming the file, which is what makes an archive-free
deterministic build possible at all.

A row with no decision stops the commit. That is not pedantry: the whole design
rests on nothing being bundled that a person has not looked at.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import sys
import unicodedata
from pathlib import Path

# `tools/content` on the path and this directory *off* it, before anything
# else is imported. `select.py` next door has a standard library module's
# name, and Python puts a script's own directory first on `sys.path` — from
# which `socketserver` -> `selectors` -> `import select` finds the selector
# and fails somewhere with nothing to do with PDMX. Removing the directory
# fixes it for the whole process; importing as `pdmx.select` keeps working.
_HERE = Path(__file__).resolve().parent
sys.path[:] = [entry for entry in sys.path if entry and Path(entry).resolve() != _HERE]
if str(_HERE.parent) not in sys.path:
    sys.path.insert(0, str(_HERE.parent))

from pdmx.paths import BUILD_DIR, REPO_ROOT  # noqa: E402
from pdmx.review import read_decisions, undecided  # noqa: E402

SCORES_DIR = REPO_ROOT / "content" / "scores" / "pdmx"
TABLE_FILE = REPO_ROOT / "content" / "sources" / "pdmx.json"

#: Which id prefix a row gets, by genre bucket.
BUCKET_PREFIX = {
    "classical": "song.classical",
    "folk-hymn-carol": "song.folk",
    "pop-film-game": "song.pop",
    "jazz-latin": "song.jazz",
}

#: At most this many editions of one work (replan §2.3 item 6).
MAX_EDITIONS = 2


def slug(text: str) -> str:
    decomposed = unicodedata.normalize("NFKD", text or "")
    stripped = "".join(ch for ch in decomposed if not unicodedata.combining(ch))
    return re.sub(r"[^a-z0-9]+", "-", stripped.lower()).strip("-") or "untitled"


def surname(canonical: str | None) -> str:
    if not canonical:
        return ""
    return slug(canonical.split()[-1])


def item_id_for(row: dict, candidate: dict) -> str:
    """
    `song.classical.<composer>-<slug>.pdmx`, and the two other shapes.

    The `.pdmx` suffix is load-bearing: a quarried edition of a work already in
    the catalog is an *alternative*, and the suffix is what keeps the two ids
    apart while `alternatives` links them both ways.
    """
    if candidate.get("want"):
        # A named want takes over the placeholder's id, so the personal build
        # replaces it and the rock lessons' songOptions need no change.
        return str(candidate["want"])
    bucket = candidate.get("bucket", "pop-film-game")
    prefix = BUCKET_PREFIX.get(bucket, "song.pop")
    title = slug(row.get("title") or candidate.get("title") or candidate["cid"])
    if bucket == "classical":
        who = surname(row.get("composer") or candidate.get("composer"))
        stem = f"{who}-{title}" if who else title
    elif bucket == "folk-hymn-carol":
        stem = title
    else:
        # `NA` is what PDMX writes for "there isn't one", and slugging it gives
        # every anonymous pop upload an id beginning `na-`.
        raw_artist = (candidate.get("artist") or "").strip()
        artist = slug(raw_artist) if raw_artist.upper() != "NA" else ""
        stem = f"{artist}-{title}" if artist else title
    return f"{prefix}.{stem}.pdmx"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def build_entries(
    rows: list[dict],
    candidates: dict[str, dict],
    decisions: dict[str, dict[str, str]],
) -> tuple[list[dict], list[str]]:
    """The `items` block of `pdmx.json`, and the ids that were skipped."""
    entries: list[dict] = []
    skipped: list[str] = []
    editions: dict[str, int] = {}
    used_ids: set[str] = set()

    for row in rows:
        cid = row["cid"]
        record = decisions.get(cid, {})
        decision = (record.get("decision") or "").strip().lower()
        if decision != "keep":
            skipped.append(cid)
            continue
        candidate = candidates.get(cid, {})
        duplicate = row.get("duplicate_of")
        if duplicate:
            editions[duplicate] = editions.get(duplicate, 1) + 1
            if editions[duplicate] > MAX_EDITIONS:
                skipped.append(cid)
                continue

        item_id = item_id_for(row, candidate)
        # Two rows can slug to the same id — the same folk tune uploaded twice
        # under slightly different titles. Numbered rather than silently
        # dropped, because the reviewer kept both on purpose.
        if item_id in used_ids:
            suffix = 2
            while f"{item_id}.{suffix}" in used_ids:
                suffix += 1
            item_id = f"{item_id}.{suffix}"
        used_ids.add(item_id)

        override = (record.get("level_override") or "").strip()
        status = (record.get("composition_status") or candidate.get("composition_status")
                  or "unknown").strip()
        entries.append(
            {
                "id": item_id,
                "cid": cid,
                "file": f"{cid}.mxl",
                "title": row.get("title") or candidate.get("title") or cid,
                "composer": row.get("composer") or candidate.get("composer_raw") or None,
                "artist": candidate.get("artist") or None,
                "rawSha256": row.get("raw_sha256", ""),
                "convertedSha256": row.get("converted_sha256", ""),
                "musescoreId": candidate.get("musescore_id"),
                "license": candidate.get("license", ""),
                "compositionStatus": status,
                "compositionReason": candidate.get("composition_reason", ""),
                "traditional": bool(candidate.get("traditional")),
                "bucket": candidate.get("bucket", ""),
                "band": candidate.get("band", ""),
                "bars": row.get("measures", 0),
                "notes": row.get("notes", 0),
                "tempoBpm": row.get("tempo_bpm", 0),
                "tempoDefaulted": bool(row.get("tempo_defaulted")),
                "singleLine": bool(row.get("single_line")),
                "hands": "right" if row.get("single_line") else "both",
                "features": row.get("features", {}),
                "level": float(override) if override else row.get("level", 4.0),
                "levelSource": "estimated",
                "levelFrom": row.get("level_source", ""),
                "levelDrivers": row.get("level_drivers", []),
                "duplicateOf": duplicate,
                "review": {"decision": decision, "note": record.get("note", "")},
            }
        )
    return entries, skipped


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--quarried", type=Path, default=BUILD_DIR / "quarried.json")
    parser.add_argument("--candidates", type=Path, default=BUILD_DIR / "candidates.json")
    parser.add_argument("--review", type=Path, default=BUILD_DIR / "review" / "review.csv")
    parser.add_argument("--converted", type=Path, default=BUILD_DIR / "converted")
    parser.add_argument("--scores", type=Path, default=SCORES_DIR)
    parser.add_argument("--table", type=Path, default=TABLE_FILE)
    parser.add_argument(
        "--record",
        default="unknown",
        help="the Zenodo record id this archive came from (14648209 or 15571083)",
    )
    args = parser.parse_args(argv)

    if not args.quarried.is_file():
        print(f"{args.quarried} does not exist. Run quarry.py first.", file=sys.stderr)
        return 2
    data = json.loads(args.quarried.read_text(encoding="utf-8"))
    rows = [row for row in data["rows"] if row.get("ok")]
    decisions = read_decisions(args.review)

    pending = undecided(rows, decisions)
    if pending:
        print(
            f"{len(pending)} row(s) have no decision in {args.review}. Nothing is committed "
            "that a person has not marked keep, drop or later (replan §2.5). Run "
            "review.py --check to list them.",
            file=sys.stderr,
        )
        return 2

    candidates: dict[str, dict] = {}
    if args.candidates.is_file():
        candidates = {
            c["cid"]: c
            for c in json.loads(args.candidates.read_text(encoding="utf-8"))["candidates"]
        }

    entries, skipped = build_entries(rows, candidates, decisions)
    args.scores.mkdir(parents=True, exist_ok=True)
    for entry in entries:
        source = args.converted / entry["file"]
        if not source.is_file():
            print(f"{source} is missing; run quarry.py again.", file=sys.stderr)
            return 2
        destination = args.scores / entry["file"]
        shutil.copyfile(source, destination)
        # Re-hashed after the copy, because what the build verifies is the file
        # in the repository and not the one in build/.
        entry["convertedSha256"] = sha256(destination)

    header = dict(data.get("header", {}))
    header["zenodoRecord"] = args.record
    if args.record == "unknown":
        header["zenodoRecordNote"] = (
            "The owner was not asked. The CSV sha256 and the archive byte counts above "
            "identify which archive this was, so the record id can be filled in later "
            "without re-running anything."
        )
    table = {
        "_comment": [
            "What the PDMX quarry kept (replan §2.1). Written by tools/content/pdmx/commit.py;",
            "read by tools/content/import_pdmx.py on every build, which verifies every checksum",
            "and fails naming the file. The archive itself is never here and never in CI.",
            "",
            "Every item is levelSource: `estimated` — the level came from difficulty.py, not",
            "from a person. `compositionStatus` is a label, not a gate (docs/00 D23): anything",
            "that is not `pd` is tagged personal-build, admitted by --personal and refused by",
            "--strict-license, which is what the public Pages deploy runs.",
        ],
        "header": header,
        "items": entries,
    }
    args.table.write_text(json.dumps(table, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    kept = len(entries)
    print(f"committed {kept} file(s) to {args.scores}")
    print(f"  skipped {len(skipped)} row(s) marked drop or later")
    print(f"  table   {args.table}")
    if args.record == "unknown":
        print("  Zenodo record id recorded as 'unknown' — the fingerprint identifies the archive.")
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
