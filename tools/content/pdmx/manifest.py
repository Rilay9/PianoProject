"""
Writes `library.json` into a folder of scores, so the folder describes itself.

The scores live on the phone, not in the app and not on this machine's network
(see `docs/decisions/2026-09-06-p14-folder-library.md`). The app points at a
folder and reads what is in it — which works for any folder of MusicXML, but
means that a folder of PDMX files would otherwise show 37,261 rows called
`QmbyQiyHS….mxl`, because a CID is not a title.

So the metadata travels *with* the files. This writes one small file next to
them holding what the browse list needs: title, composer, estimated level,
bars, rating. Copy the folder to the phone and the manifest goes with it.

Nothing about the format is PDMX-specific, and the app does not require it: a
folder with no manifest still works, the app just reads each score's own
`<work-title>` instead. The manifest is what makes 37,000 files browsable
rather than merely present.

    py -3.11 tools\\content\\pdmx\\manifest.py

Rows are arrays, not objects, and the field names are given once at the top.
For 37,261 scores that is the difference between a 13 MB file and a 6 MB one,
on a phone, parsed on every folder pick.
"""
from __future__ import annotations

import sys
from pathlib import Path

# `tools/content` on the path and this directory *off* it, before anything
# else is imported. Python puts a script's own directory first on `sys.path`,
# so every module sitting beside this one silently outranks the standard
# library for the rest of the process. That is how `select.py` — since
# renamed to `shortlist.py` for the same reason — came to answer
# `socketserver`'s `import select` and kill a server on its first connection.
# The name is gone; the hazard is structural, so the guard stays.
_HERE = Path(__file__).resolve().parent
sys.path[:] = [entry for entry in sys.path if entry and Path(entry).resolve() != _HERE]
if str(_HERE.parent) not in sys.path:
    sys.path.insert(0, str(_HERE.parent))

import argparse  # noqa: E402
import json  # noqa: E402
from datetime import datetime, timezone  # noqa: E402

from pdmx.extract import shard_of  # noqa: E402
from pdmx.paths import BUILD_DIR, fail  # noqa: E402

#: Bumped when a field changes meaning. The app refuses a version it does not
#: know rather than guessing at columns.
MANIFEST_VERSION = 1

MANIFEST_NAME = "library.json"

#: What the browse list draws, and nothing else. `member` is the extractor's
#: business; `notes` only ever fed the level; the CID is the filename.
FIELDS = (
    "file",
    "title",
    "composer",
    "level",
    "bars",
    "status",
    "style",
    "rating",
    "ratings",
    "views",
    "lyrics",
    "garbled",
    "museScore",
)


def row_for(entry: dict, relative: str) -> list:
    """One index row as the manifest's flat array."""
    return [
        relative,
        entry.get("title") or "",
        entry.get("composer") or entry.get("artist") or "",
        entry.get("level"),
        entry.get("bars"),
        entry.get("status") or "unknown",
        entry.get("bucket") or "",
        entry.get("rating") or 0,
        entry.get("ratings") or 0,
        entry.get("views") or 0,
        1 if entry.get("lyrics") else 0,
        1 if entry.get("garbled") else 0,
        entry.get("museScore") or "",
    ]


def build(index: Path, library: Path) -> tuple[dict, int]:
    """
    The manifest for the scores actually present in `library`.

    Indexed rows with no file are skipped and counted. A manifest that
    advertises a score the folder does not hold is a row that fails when it is
    tapped, which is worse than a row that was never offered.
    """
    data = json.loads(index.read_text(encoding="utf-8"))
    rows: list[list] = []
    absent = 0
    for entry in data.get("rows", []):
        if entry.get("notASong"):
            continue
        cid = entry["cid"]
        relative = f"{shard_of(cid)}/{cid}.mxl"
        if not (library / relative).is_file():
            absent += 1
            continue
        rows.append(row_for(entry, relative))
    manifest = {
        "kind": "pianopath-score-folder",
        "version": MANIFEST_VERSION,
        "generatedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "source": {
            "name": "PDMX",
            "url": "https://pnlong.github.io/PDMX.demo/",
            # Levels here are the CSV proxy's estimate, not a measured one:
            # good enough to sort a shelf by, and the app says so on the row.
            "levels": "estimated from the PDMX metadata (see pdmx-csv-level.json)",
        },
        "fields": list(FIELDS),
        "count": len(rows),
        "scores": rows,
    }
    return manifest, absent


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--library", type=Path, default=BUILD_DIR / "library")
    parser.add_argument("--index", type=Path, default=BUILD_DIR / "index" / "index.json")
    parser.add_argument("--out", type=Path, default=None, help="defaults to <library>/library.json")
    args = parser.parse_args(argv)

    if not args.index.is_file():
        fail(f"{args.index} does not exist. Run index.py first.")
        return 2
    if not args.library.is_dir():
        fail(
            f"{args.library} does not exist. Unpack the library first:\n"
            "  py -3.11 tools\\content\\pdmx\\extract.py --from-index --shard "
            "--out build\\pdmx\\library"
        )
        return 2

    manifest, absent = build(args.index, args.library)
    if not manifest["scores"]:
        fail(f"no indexed song has a file in {args.library}.")
        return 2

    out = args.out or (args.library / MANIFEST_NAME)
    out.write_text(json.dumps(manifest, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{manifest['count']} score(s) -> {out} ({out.stat().st_size / 1e6:.1f} MB)")
    if absent:
        print(f"note: {absent} indexed song(s) are not unpacked and are left out")
    print("Copy the whole folder to the phone, then: Library -> Score folder -> pick it.")
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
