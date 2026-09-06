#!/usr/bin/env python3
"""
Compiles the scores we write ourselves into the app's format.

docs/03-content-pipeline.md §3 step 4 and §5. Two kinds of source live in
content/scores/authored/:

  * `*.abc` — a tune in ABC with a `%%pianopath` metadata header. ABC is
    one to ten lines per tune, which is why the curriculum's folk, hymn and
    holiday repertoire is authored in it rather than in MusicXML.
  * `*.py` — a music21 module for anything ABC cannot say comfortably: a
    twelve-bar blues built from chord symbols, a study generated over a
    pattern. Each module declares `PIANOPATH` metadata and a `build()`
    returning a Score.

Both end up as compressed MusicXML with a catalog entry, through the same
normalisation every other source goes through.

Usage:
    python3 tools/content/author.py --out build/content --catalog build/catalog.authored.json
"""
from __future__ import annotations

import argparse
import importlib.util
import os
import sys
import traceback
from dataclasses import dataclass, field
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from abc_tools import parse_metadata  # noqa: E402
from common import AUTHORED_DIR, SourceBlock, catalog_item, sha256_file, utc_now, write_json  # noqa: E402

#: Metadata keys every authored item must declare. Everything else has a
#: default, but these three decide where the item shows up and cannot be
#: guessed from the notes.
REQUIRED = ("id", "level", "tracks")


class AuthoringError(RuntimeError):
    pass


@dataclass
class AuthorReport:
    written: list[str] = field(default_factory=list)
    failed: list[tuple[str, str]] = field(default_factory=list)


#: docs/03 §1 rule 1 — US public domain as of 2026.
PD_CUTOFF_YEAR = 1930


def public_domain_note(meta: dict) -> str | None:
    """
    Turns `publishedYear=` / `traditional=` into the sentence that goes in the
    catalog's `editionNotes`, refusing anything too recent to bundle.

    The P5 prompt asks for the year to be recorded and for anything that cannot
    be verified to be skipped, so a tune that states neither a year nor
    `traditional=yes` fails here rather than being quietly bundled on trust.
    """
    if str(meta.get("traditional", "")).lower() in {"1", "true", "yes"}:
        return "Traditional melody, no known author; public domain."
    raw = meta.get("publishedYear")
    if raw is None:
        return None
    try:
        year = int(str(raw))
    except ValueError as exc:
        raise AuthoringError(f"publishedYear must be a year, got {raw!r}") from exc
    if year > PD_CUTOFF_YEAR:
        raise AuthoringError(
            f"publishedYear {year} is after {PD_CUTOFF_YEAR}: not US public domain, cannot bundle"
        )
    return f"Composition published {year}; US public domain (published on or before {PD_CUTOFF_YEAR})."


def validate_metadata(meta: dict) -> str:
    """
    Checks the `%%pianopath` header before anything is parsed or written.

    Fail fast and fail cheaply: a tune with no level cannot be placed in the
    plan, and finding that out after music21 has parsed and engraved it only
    makes the message harder to find.
    """
    missing = [key for key in REQUIRED if not meta.get(key)]
    if missing:
        raise AuthoringError(f"missing %%pianopath {', '.join(missing)}")
    item_id = str(meta["id"])
    item_type = item_id.split(".", 1)[0]
    if item_type not in {"song", "exercise", "drill"}:
        raise AuthoringError(f"id must start with song./exercise./drill., got {item_id!r}")
    try:
        float(meta["level"])
    except (TypeError, ValueError) as exc:
        raise AuthoringError(f"level must be a number, got {meta['level']!r}") from exc
    if item_type == "song" and not (meta.get("publishedYear") or meta.get("traditional")):
        # A song is somebody's composition. Either it is traditional or it has
        # a year, and without one of the two there is nothing to check against
        # docs/03 §1.
        raise AuthoringError("a song needs publishedYear=<year> or traditional=yes")
    return item_type


def entry_from_metadata(
    meta: dict, *, dest: Path, out_root: Path, title: str, composer: str | None, tempo_bpm: float | None
) -> dict:
    item_type = validate_metadata(meta)
    pd_note = public_domain_note(meta)
    tracks = [t.strip() for t in str(meta["tracks"]).split(",") if t.strip()]
    concepts = [c.strip() for c in str(meta.get("concepts", "")).split(",") if c.strip()]
    item_id = str(meta["id"])

    relative = dest.relative_to(out_root).as_posix()
    return catalog_item(
        item_id=item_id,
        item_type=item_type,
        title=meta.get("title") or title,
        level=float(meta["level"]),
        # Authored material: the level is chosen by whoever wrote the piece,
        # for that piece.
        level_source="judged",
        hands=str(meta.get("hands", "both")),
        tracks=tracks,
        concepts=concepts,
        source=SourceBlock(
            name=str(meta.get("sourceName", "PianoPath (authored)")),
            url=meta.get("sourceUrl"),
            license=str(meta.get("license", "CC0")),
            pd_region=str(meta.get("pd_region", "worldwide")),
            # Authored here, not fetched from anywhere: a timestamp would be
            # the build's clock dressed up as provenance.
            fetchedAt=None,
            checksum=sha256_file(dest),
            editionNotes=meta.get("editionNotes") or pd_note,
        ),
        composer=meta.get("composer") or composer,
        arranger=meta.get("arranger", "PianoPath"),
        genre=[g.strip() for g in str(meta.get("genre", "")).split(",") if g.strip()] or None,
        abrsmGradeApprox=int(meta["abrsm"]) if meta.get("abrsm") else None,
        file=relative,
        variantOf=meta.get("variantOf"),
        variantLabel=meta.get("variantLabel"),
        tempoBpm=float(meta["tempoBpm"]) if meta.get("tempoBpm") else tempo_bpm,
        keySig=meta.get("keySig"),
        timeSig=meta.get("timeSig"),
        tags=["authored"],
    )


def compile_abc(path: Path, out_root: Path) -> dict:
    from convert import cached_convert  # late import: music21 is slow to load

    text = path.read_text(encoding="utf-8")
    meta = parse_metadata(text)
    fields = dict(meta.fields)
    if not fields.get("id"):
        raise AuthoringError("no %%pianopath id=… line")
    validate_metadata(fields)

    dest = out_root / "scores" / "authored" / f"{fields['id']}.mxl"
    keep_lyrics = str(fields.get("keepLyrics", "")).lower() in {"1", "true", "yes"}
    result = cached_convert(
        path,
        dest,
        keep_lyrics=keep_lyrics,
        tempo_bpm=float(fields["tempoBpm"]) if fields.get("tempoBpm") else None,
        title=fields.get("title") or meta.title,
        composer=fields.get("composer") or meta.composer,
    )
    entry = entry_from_metadata(
        fields,
        dest=dest,
        out_root=out_root,
        title=meta.title or path.stem,
        composer=meta.composer,
        tempo_bpm=result.tempo_bpm,
    )
    entry.setdefault("keySig", meta.key)
    entry.setdefault("timeSig", meta.meter)
    return entry


def load_module(path: Path):
    spec = importlib.util.spec_from_file_location(f"authored_{path.stem}", path)
    if spec is None or spec.loader is None:
        raise AuthoringError(f"cannot import {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def compile_python(path: Path, out_root: Path) -> dict:
    from convert import normalise, write_mxl  # late import

    module = load_module(path)
    meta = getattr(module, "PIANOPATH", None)
    build = getattr(module, "build", None)
    if not isinstance(meta, dict) or not callable(build):
        raise AuthoringError("module must define PIANOPATH (dict) and build() -> Score")

    validate_metadata(meta)
    score = build()
    normalised, result = normalise(
        score,
        keep_lyrics=bool(meta.get("keepLyrics")),
        tempo_bpm=float(meta["tempoBpm"]) if meta.get("tempoBpm") else None,
    )
    dest = out_root / "scores" / "authored" / f"{meta['id']}.mxl"
    write_mxl(normalised, dest)
    return entry_from_metadata(
        meta,
        dest=dest,
        out_root=out_root,
        title=result.title,
        composer=result.composer,
        tempo_bpm=result.tempo_bpm,
    )


def author_all(out_root: Path, catalog_path: Path, source_dir: Path = AUTHORED_DIR) -> AuthorReport:
    report = AuthorReport()
    entries: list[dict] = []
    sources = sorted(
        [p for p in source_dir.glob("*.abc")] + [p for p in source_dir.glob("*.py") if p.name != "__init__.py"]
    )
    for path in sources:
        try:
            entry = compile_abc(path, out_root) if path.suffix == ".abc" else compile_python(path, out_root)
        except Exception as exc:  # noqa: BLE001 - one bad tune must not stop the rest
            report.failed.append((path.name, f"{type(exc).__name__}: {exc}"))
            if "--traceback" in sys.argv:
                traceback.print_exc()
            continue
        entries.append(entry)
        report.written.append(entry["id"])
    write_json(catalog_path, entries)
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, required=True, help="content output directory")
    parser.add_argument("--catalog", type=Path, required=True)
    parser.add_argument("--dir", type=Path, default=AUTHORED_DIR)
    parser.add_argument("--traceback", action="store_true")
    parser.add_argument(
        "--no-cache", action="store_true", help="ignore build/cache/convert and reconvert"
    )
    args = parser.parse_args()
    if args.no_cache:
        os.environ["PIANOPATH_NO_CACHE"] = "1"

    report = author_all(args.out, args.catalog, args.dir)
    from convert import CACHE_STATS  # late import: music21 is slow to load

    print(f"authored {len(report.written)} item(s) ({CACHE_STATS.summary()})")
    for name, why in report.failed:
        print(f"FAIL {name}: {why}", file=sys.stderr)
    sys.exit(1 if report.failed else 0)


if __name__ == "__main__":
    main()
