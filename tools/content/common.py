"""
Shared plumbing for the content pipeline (docs/03-content-pipeline.md).

Deliberately dependency-free apart from the standard library so that the parts
of the pipeline that do *not* need music21 (fetching, the provenance ledger,
the catalog writer) keep working in an environment where it failed to install.
"""
from __future__ import annotations

import hashlib
import json
import re
import subprocess
import unicodedata
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
CONTENT_SRC = REPO_ROOT / "content"
IMPORTED_DIR = CONTENT_SRC / "scores" / "imported"
AUTHORED_DIR = CONTENT_SRC / "scores" / "authored"
GENERATED_DIR = CONTENT_SRC / "scores" / "generated"
SOURCES_MD = IMPORTED_DIR / "SOURCES.md"
BUILD_DIR = REPO_ROOT / "build"
DEFAULT_OUT = REPO_ROOT / "app" / "public" / "content"

#: Every track id the catalog schema allows, so a typo in a data file is caught
#: before jsonschema has to explain it.
TRACKS = (
    "core", "classical", "chords-pop", "blues-boogie", "jazz", "ragtime",
    "theory-ear", "improv-compose", "hymns-gospel", "latin", "holiday",
    "film-game", "technique",
)


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def slug(text: str) -> str:
    """A catalog-id-safe slug: ASCII, lowercase, hyphen-separated."""
    folded = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "-", folded.lower()).strip("-")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(65536), b""):
            digest.update(block)
    return f"sha256:{digest.hexdigest()}"


def write_json(path: Path, data: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(data, handle, indent=2, ensure_ascii=False)
        handle.write("\n")


def read_json(path: Path) -> object:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


# ---------------------------------------------------------------------------
# provenance ledger
# ---------------------------------------------------------------------------

LEDGER_HEADER = """# Imported score provenance

One row per fetched source, appended by `tools/content/fetch.py`. This file is
the record that satisfies rule 6 of `docs/03-content-pipeline.md` §1: anything
bundled with the app has to be traceable back to where it came from and under
what licence.

Rows are keyed by source id + path, so re-running the fetch updates a row in
place rather than appending a duplicate.

| source | path | url | licence | pd_region | fetched | revision | files |
|---|---|---|---|---|---|---|---|
"""


@dataclass
class LedgerRow:
    source: str
    path: str
    url: str
    license: str
    pd_region: str
    fetched: str
    revision: str
    files: int

    def key(self) -> tuple[str, str]:
        return (self.source, self.path)

    def to_markdown(self) -> str:
        return (
            f"| {self.source} | {self.path} | {self.url} | {self.license} | "
            f"{self.pd_region} | {self.fetched} | {self.revision} | {self.files} |"
        )

    @classmethod
    def from_markdown(cls, line: str) -> "LedgerRow | None":
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) != 8:
            return None
        try:
            files = int(cells[7])
        except ValueError:
            return None
        return cls(cells[0], cells[1], cells[2], cells[3], cells[4], cells[5], cells[6], files)


def update_ledger(rows: list[LedgerRow], path: Path = SOURCES_MD) -> None:
    """Merges `rows` into SOURCES.md, replacing any row with the same key."""
    existing: dict[tuple[str, str], LedgerRow] = {}
    if path.exists():
        for line in path.read_text(encoding="utf-8").splitlines():
            if not line.startswith("|") or line.startswith("| source") or set(line) <= set("| -"):
                continue
            row = LedgerRow.from_markdown(line)
            if row is not None:
                existing[row.key()] = row
    for row in rows:
        existing[row.key()] = row

    ordered = sorted(existing.values(), key=lambda r: (r.source, r.path))
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(LEDGER_HEADER + "\n".join(r.to_markdown() for r in ordered) + "\n", encoding="utf-8")


# ---------------------------------------------------------------------------
# catalog entries
# ---------------------------------------------------------------------------

@dataclass
class SourceBlock:
    """The `source` block every catalog item needs (docs/03 §1 rule 2)."""

    name: str
    license: str
    pd_region: str = "worldwide"
    url: str | None = None
    fetchedAt: str | None = None
    checksum: str | None = None
    editionNotes: str | None = None

    def as_dict(self) -> dict:
        return {
            "name": self.name,
            "url": self.url,
            "license": self.license,
            "pd_region": self.pd_region,
            "fetchedAt": self.fetchedAt,
            "checksum": self.checksum,
            "editionNotes": self.editionNotes,
        }


def catalog_item(
    *,
    item_id: str,
    item_type: str,
    title: str,
    level: float,
    hands: str,
    tracks: list[str],
    concepts: list[str],
    source: SourceBlock,
    **optional: object,
) -> dict:
    """Builds a schema-shaped catalog item; `optional` fills in the rest."""
    item: dict = {
        "id": item_id,
        "type": item_type,
        "title": title,
        "level": round(float(level), 2),
        "hands": hands,
        "tracks": tracks,
        "concepts": concepts,
        "source": source.as_dict(),
    }
    item.update({k: v for k, v in optional.items() if v is not None})
    return item


# ---------------------------------------------------------------------------
# subprocess helpers
# ---------------------------------------------------------------------------

@dataclass
class Step:
    """One pipeline step's outcome, for build.py's summary."""

    name: str
    ok: bool
    detail: str = ""
    skipped: bool = False
    warnings: list[str] = field(default_factory=list)


def run(
    cmd: list[str],
    cwd: Path | None = None,
    timeout: int = 900,
    env: dict[str, str] | None = None,
) -> subprocess.CompletedProcess:
    return subprocess.run(
        cmd, cwd=cwd, timeout=timeout, capture_output=True, text=True, check=False, env=env
    )
