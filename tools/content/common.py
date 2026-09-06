"""
Shared plumbing for the content pipeline (docs/03-content-pipeline.md).

Deliberately dependency-free apart from the standard library so that the parts
of the pipeline that do *not* need music21 (fetching, the provenance ledger,
the catalog writer) keep working in an environment where it failed to install.
"""
from __future__ import annotations

import contextlib
import hashlib
import json
import os
import re
import subprocess
import sys
import time
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

#: The one source of truth for the track list (replan §1.8).
TRACKS_FILE = CONTENT_SRC / "curriculum" / "00-tracks.json"


def load_tracks(path: Path = TRACKS_FILE) -> tuple[str, ...]:
    """
    The followable modules: the tracks a unit can belong to and the Plan screen draws.

    There used to be three lists: a tuple in this file, the `tracks` enum in
    `catalog.schema.json`, and `00-tracks.json` itself. They drifted — the
    schema was missing `rock-metal`, `jam` and `beautiful`, and the tuple named
    `film-game` and `technique`, which no track file has ever defined. Adding a
    Chopin prelude to the Beautiful-pieces module is what finally surfaced it.
    Now the curriculum file is the list and everything else asks it.
    """
    if not path.exists():
        return ()
    data = read_json(path)
    assert isinstance(data, dict)
    return tuple(track["id"] for track in data.get("tracks", []))


def load_item_labels(path: Path = TRACKS_FILE) -> tuple[str, ...]:
    """
    Categories an item may carry that are not modules a learner follows.

    The code has always used `tracks[]` for two jobs. Fourteen of the ids are
    curriculum modules with stages and units behind them; `technique` and
    `film-game` are labels — `technique` is on 434 items and the session
    builder reads it to choose a warm-up, but there is no technique ladder and
    a Plan screen drawing an empty one would be a lie. Keeping both roles in
    the one file keeps the single source of truth §1.8 asks for without
    pretending the two are the same thing.
    """
    if not path.exists():
        return ()
    data = read_json(path)
    assert isinstance(data, dict)
    return tuple(label["id"] for label in data.get("itemLabels", []))


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


def read_ledger(path: Path = SOURCES_MD) -> dict[tuple[str, str], LedgerRow]:
    """Every row currently in SOURCES.md, keyed by (source, path)."""
    existing: dict[tuple[str, str], LedgerRow] = {}
    if not path.exists():
        return existing
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.startswith("|") or line.startswith("| source") or set(line) <= set("| -"):
            continue
        row = LedgerRow.from_markdown(line)
        if row is not None:
            existing[row.key()] = row
    return existing


def ledger_fetched_at(source_path: str, path: Path = SOURCES_MD) -> str | None:
    """
    When the bytes under `source_path` were last actually fetched.

    The catalog's `fetchedAt` used to be `utc_now()` at *import* time, which is
    two things wrong: it says a source was fetched now when the clone may be
    days old, and it changes on every build, so two builds of untouched sources
    produce different catalogs. The ledger is the record of what happened, so
    the catalog quotes it.
    """
    for (_, row_path), row in read_ledger(path).items():
        if row_path == source_path:
            return row.fetched
    return None


def update_ledger(rows: list[LedgerRow], path: Path = SOURCES_MD) -> None:
    """Merges `rows` into SOURCES.md, replacing any row with the same key."""
    existing = read_ledger(path)
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
    level_source: str,
    hands: str,
    tracks: list[str],
    concepts: list[str],
    source: SourceBlock,
    **optional: object,
) -> dict:
    """
    Builds a schema-shaped catalog item; `optional` fills in the rest.

    `level_source` has no default on purpose (replan §1.4). It is the one field
    whose honest value depends entirely on how the caller arrived at `level`,
    and a default would be a guess made in the wrong place — so every writer
    has to say `judged` or `estimated` out loud.
    """
    if level_source not in {"judged", "estimated"}:
        raise ValueError(f"level_source must be 'judged' or 'estimated', not {level_source!r}")
    item: dict = {
        "id": item_id,
        "type": item_type,
        "title": title,
        "level": round(float(level), 2),
        "levelSource": level_source,
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


# ---------------------------------------------------------------------------
# one writer at a time
# ---------------------------------------------------------------------------

#: Held by anything that writes into `app/public/content/scores`.
CONTENT_LOCK = BUILD_DIR / ".content-lock"

#: A lock older than this is assumed to be a crashed run rather than a live one.
#:
#: The longest thing that holds it is `build.py --offline --render`, which is
#: about three minutes, and the PDMX quarry, which is about half an hour. Two
#: hours is well past both and short enough that a stale lock does not outlive
#: the session that dropped it.
LOCK_STALE_SECONDS = 2 * 60 * 60


class ContentBusy(RuntimeError):
    """Something else is writing the content directory."""


@contextlib.contextmanager
def content_lock(what: str):
    """
    Serialises the two programs that write `app/public/content/scores`.

    `build.py` empties that directory at the start of every run; the PDMX
    quarry stages candidates into it so the render check's browser can fetch
    them. Run at the same time — which happened once, at four in the morning —
    vite's `copyDir` walks a tree `clean_scores` is deleting under it and the
    build dies with an ENOENT on a file that existed a moment earlier. Nothing
    is corrupted and the log says exactly what happened, but the run is wasted
    and the error points at the wrong place entirely.

    Refuses rather than waits: both of these are long jobs a person started on
    purpose, and a second one silently blocking for half an hour is worse than
    being told.
    """
    BUILD_DIR.mkdir(parents=True, exist_ok=True)
    try:
        handle = os.open(CONTENT_LOCK, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
    except FileExistsError:
        held = ""
        age = None
        try:
            held = CONTENT_LOCK.read_text(encoding="utf-8").strip()
            age = time.time() - CONTENT_LOCK.stat().st_mtime
        except OSError:
            pass
        if age is not None and age > LOCK_STALE_SECONDS:
            # A crashed run, not a live one. Say so and take it over.
            print(
                f"note: {CONTENT_LOCK} is {age / 3600:.1f} hours old ({held}) — "
                "assuming a crashed run and taking it over",
                file=sys.stderr,
            )
            CONTENT_LOCK.unlink(missing_ok=True)
            handle = os.open(CONTENT_LOCK, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
        else:
            raise ContentBusy(
                f"{held or 'another run'} is already writing app/public/content. "
                "Wait for it to finish, or delete "
                f"{CONTENT_LOCK.relative_to(REPO_ROOT)} if you are sure nothing is running."
            )
    try:
        os.write(handle, f"{what} (pid {os.getpid()}) since {utc_now()}".encode("utf-8"))
        os.close(handle)
        yield
    finally:
        CONTENT_LOCK.unlink(missing_ok=True)
