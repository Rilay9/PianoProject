"""
The PDMX build step (replan §2.1).

Reads what `pdmx/commit.py` put in the repository — `content/scores/pdmx/*.mxl`
and `content/sources/pdmx.json` — verifies every checksum, and writes
`build/catalog.pdmx.json`. It needs nothing else: no archive, no CSV, no
music21, no network. That is the whole point of the split, and it is why CI can
build a catalog that includes 300 quarried scores without ever seeing the 4 GB
they came from.

Two builds, one table — the same shape `import_kern.py` uses:

  --personal          admits everything, including items whose *composition* is
                      not public domain. The owner's build (docs/00 D23).
  --strict-license    emits a placeholder for those instead: title, composer,
                      an importHint saying what to do, and no file. The public
                      Pages deploy runs this.

A checksum that does not match fails the build naming the file. A file listed
in the table and missing from disk does too. Neither is recoverable by carrying
on: the catalog would then describe a score nobody has.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from dataclasses import dataclass, field
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import SourceBlock, catalog_item, read_json, write_json  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parents[2]
TABLE_PATH = REPO_ROOT / "content" / "sources" / "pdmx.json"
SCORES_DIR = REPO_ROOT / "content" / "scores" / "pdmx"

#: Tag on every item whose composition is not public domain. The mirror of
#: `NC_PERSONAL_TAG`, which is about the *edition*: an item can carry either,
#: and both mean "the owner's build only".
PERSONAL_BUILD_TAG = "personal-build"

#: What a placeholder tells the owner in the strict build.
IMPORT_HINT = (
    "Not bundled in a redistributable build: the composition is {status}. "
    "The owner's personal build carries it (build with --personal); import your own "
    "copy of the score otherwise."
)

SOURCE_NAME = "PDMX (MuseScore upload, uploader's public-domain claim)"

#: Which track a bucket belongs to. Deliberately narrow: a quarried file gets
#: the one track its bucket names and the curriculum decides the rest, because
#: guessing tracks from a title is how the library fills with mislabelled rows.
BUCKET_TRACKS = {
    "classical": ["classical"],
    "folk-hymn-carol": ["core"],
    "pop-film-game": ["chords-pop"],
    "jazz-latin": ["jazz"],
}

BUCKET_GENRE = {
    "classical": ["classical"],
    "folk-hymn-carol": ["folk"],
    "pop-film-game": ["pop"],
    "jazz-latin": ["jazz"],
}


@dataclass
class ImportReport:
    imported: list[str] = field(default_factory=list)
    placeheld: list[str] = field(default_factory=list)
    personal: list[str] = field(default_factory=list)
    failures: list[str] = field(default_factory=list)

    def summary(self) -> str:
        parts = [f"imported {len(self.imported)} score(s)"]
        if self.placeheld:
            parts.append(f"{len(self.placeheld)} placeholder(s)")
        if self.personal:
            parts.append(f"{len(self.personal)} personal-build")
        return ", ".join(parts)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def concepts_for(entry: dict) -> list[str]:
    """
    What the item claims to teach.

    Only what the features actually say. A quarried file has no lesson behind
    it and nobody has played it, so inventing concepts from the title would put
    words in a piece's mouth — the curriculum names concepts, and P15's finder
    is what connects the two.
    """
    concepts = ["repertoire"]
    if entry.get("singleLine"):
        concepts.append("single-line-melody")
    if entry.get("traditional"):
        concepts.append("folk-tune")
    features = entry.get("features", {})
    if float(features.get("keyAccidentals", 0)) >= 3:
        concepts.append("keys")
    if float(features.get("handCrossings", 0)) > 0:
        concepts.append("hand-crossing")
    if float(features.get("maxSpanRight", 0)) >= 12 or float(features.get("maxSpanLeft", 0)) >= 12:
        concepts.append("wide-span")
    return concepts


def build_item(entry: dict, *, bundled: bool, checksum: str | None) -> dict:
    status = entry.get("compositionStatus", "unknown")
    bucket = entry.get("bucket", "pop-film-game")
    tags = ["pdmx"]
    if status != "pd":
        tags.append(PERSONAL_BUILD_TAG)
    if entry.get("tempoDefaulted"):
        tags.append("tempo-defaulted")

    musescore = entry.get("musescoreId")
    return catalog_item(
        item_id=entry["id"],
        item_type="song",
        title=entry["title"],
        level=float(entry.get("level", 4.0)),
        # Always estimated: difficulty.py computed it, not a person (replan §1.4).
        level_source="estimated",
        hands=entry.get("hands", "both"),
        tracks=BUCKET_TRACKS.get(bucket, ["core"]),
        concepts=concepts_for(entry),
        source=SourceBlock(
            name=SOURCE_NAME,
            url=f"https://musescore.com/score/{musescore}" if musescore else None,
            license=entry.get("license", "publicdomain"),
            pd_region="worldwide",
            checksum=checksum,
            editionNotes=(
                "Quarried from PDMX and normalised by tools/content/convert.py. "
                f"Composition status: {status} — {entry.get('compositionReason', '')}".strip()
            ),
        ),
        composer=entry.get("composer"),
        genre=BUCKET_GENRE.get(bucket, ["pop"]),
        file=f"scores/pdmx/{entry['file']}" if bundled else None,
        importHint=None if bundled else IMPORT_HINT.format(status=status),
        alternatives=[entry["duplicateOf"]] if entry.get("duplicateOf") else None,
        tempoBpm=entry.get("tempoBpm") or None,
        tags=tags,
    )


def import_pdmx(
    out_dir: Path,
    catalog_path: Path,
    *,
    personal: bool,
    strict_license: bool,
    scores_dir: Path = SCORES_DIR,
    table_path: Path = TABLE_PATH,
) -> ImportReport:
    report = ImportReport()
    if not table_path.is_file():
        # No quarry has been run. That is a normal state before P14 and must
        # not fail a build: an empty fragment is the honest answer.
        write_json(catalog_path, [])
        return report

    table = read_json(table_path)
    assert isinstance(table, dict)
    items: list[dict] = []

    target_dir = out_dir / "scores" / "pdmx"
    target_dir.mkdir(parents=True, exist_ok=True)

    for entry in table.get("items", []):
        source = scores_dir / entry["file"]
        if not source.is_file():
            report.failures.append(f"{entry['id']}: {source} is listed in pdmx.json and missing")
            continue
        digest = sha256(source)
        expected = entry.get("convertedSha256", "")
        if expected and digest != expected:
            report.failures.append(
                f"{entry['id']}: {source} has sha256 {digest[:12]}…, table says {expected[:12]}… "
                "— the file changed after it was reviewed"
            )
            continue

        status = entry.get("compositionStatus", "unknown")
        bundled = status == "pd" or (personal and not strict_license)
        if bundled:
            (target_dir / entry["file"]).write_bytes(source.read_bytes())
            report.imported.append(entry["id"])
            if status != "pd":
                report.personal.append(entry["id"])
        else:
            report.placeheld.append(entry["id"])
        items.append(build_item(entry, bundled=bundled, checksum=digest))

    write_json(catalog_path, items)
    return report


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--catalog", type=Path, required=True)
    parser.add_argument("--table", type=Path, default=TABLE_PATH)
    parser.add_argument("--scores", type=Path, default=SCORES_DIR)
    parser.add_argument(
        "--personal",
        action="store_true",
        help="the owner's build: admit items whose composition is not public domain (docs/00 D23)",
    )
    parser.add_argument(
        "--strict-license",
        action="store_true",
        help="the public build: placeholder those items instead",
    )
    args = parser.parse_args(argv)

    report = import_pdmx(
        args.out,
        args.catalog,
        personal=args.personal,
        strict_license=args.strict_license,
        scores_dir=args.scores,
        table_path=args.table,
    )
    for failure in report.failures:
        print(f"  - {failure}", file=sys.stderr)
    print(report.summary())
    return 1 if report.failures else 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
