#!/usr/bin/env python3
"""
Turns the [MT] library into catalog entries (docs/03-content-pipeline.md §2).

The interesting part is not the conversion — the files are already MusicXML —
but the licence decision. `musetrainer/library` makes one blanket claim ("Public
Domain MusicXML files") in its README, has no LICENSE file and states no
per-file terms. A blanket claim can only answer half of docs/03 §1's test: it
says nothing about whether the *composition* is public domain in the US, and
the library does contain pieces that are not (a 1979 Paul de Senneville piece
filed under Chopin, a modern arrangement filed under Bach). So every file is
judged individually in content/sources/musetrainer.json, and this script
reports what it excluded and why.

Files are copied verbatim unless they actually need normalising. A music21
round-trip is not free — it re-engraves the file — and these editions were
already verified to render, so the ones that are already a single piano part
with a tempo are left exactly as they are.

Usage:
    python3 tools/content/import_musetrainer.py --out build/content --catalog build/catalog.mt.json
"""
from __future__ import annotations

import argparse
import os
import re
import shutil
import sys
import zipfile
from dataclasses import dataclass, field
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import CONTENT_SRC, IMPORTED_DIR, SourceBlock, catalog_item, read_json, sha256_file, utc_now, write_json  # noqa: E402
from licensing import Verdict, composition_verdict  # noqa: E402

TABLE_PATH = CONTENT_SRC / "sources" / "musetrainer.json"
LIBRARY_DIR = IMPORTED_DIR / "musetrainer" / "scores"
SOURCE_URL = "https://github.com/musetrainer/library"

#: The licence exactly as the repository states it — not a normalisation of it.
STATED_LICENSE = "Public Domain (blanket claim by musetrainer/library; no LICENSE file, no per-file terms)"


@dataclass
class ImportReport:
    imported: list[str] = field(default_factory=list)
    excluded: list[tuple[str, str]] = field(default_factory=list)
    normalised: list[tuple[str, str]] = field(default_factory=list)
    fallback: list[tuple[str, str]] = field(default_factory=list)
    missing: list[str] = field(default_factory=list)


def read_main_xml(path: Path) -> str:
    """The MusicXML inside a .mxl container."""
    with zipfile.ZipFile(path) as archive:
        try:
            container = archive.read("META-INF/container.xml").decode("utf-8", "replace")
            match = re.search(r'full-path="([^"]+)"', container)
            name = match.group(1) if match else None
        except KeyError:
            name = None
        if name is None:
            candidates = [n for n in archive.namelist() if not n.startswith("META-INF")]
            name = candidates[0]
        return archive.read(name).decode("utf-8", "replace")


def normalisation_reasons(xml: str) -> list[str]:
    """Why a file cannot be copied verbatim, or [] when it can."""
    reasons: list[str] = []
    parts = xml.count("<score-part ")
    if parts > 1:
        reasons.append(f"{parts} separate parts to merge into one grand staff")
    if "<sound tempo=" not in xml and "<metronome" not in xml:
        reasons.append("no tempo of its own")
    return reasons


def measure_facts(xml: str) -> dict:
    """Key, time signature and tempo, read out of the file for the catalog."""
    facts: dict = {"keySig": None, "timeSig": None, "tempoBpm": None}
    fifths = re.search(r"<fifths>(-?\d+)</fifths>", xml)
    if fifths:
        mode = re.search(r"<mode>(\w+)</mode>", xml)
        facts["keySig"] = key_name(int(fifths.group(1)), (mode.group(1) if mode else "major"))
    beats = re.search(r"<beats>(\d+)</beats>\s*<beat-type>(\d+)</beat-type>", xml)
    if beats:
        facts["timeSig"] = f"{beats.group(1)}/{beats.group(2)}"
    tempo = re.search(r'<sound tempo="([0-9.]+)"', xml)
    if tempo:
        facts["tempoBpm"] = round(float(tempo.group(1)), 2)
    return facts


SHARP_KEYS = ["C", "G", "D", "A", "E", "B", "F#", "C#"]
FLAT_KEYS = ["C", "F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb"]
SHARP_MINORS = ["a", "e", "b", "f#", "c#", "g#", "d#", "a#"]
FLAT_MINORS = ["a", "d", "g", "c", "f", "bb", "eb", "ab"]


def key_name(fifths: int, mode: str) -> str:
    table = (SHARP_MINORS if fifths >= 0 else FLAT_MINORS) if mode == "minor" else (SHARP_KEYS if fifths >= 0 else FLAT_KEYS)
    name = table[min(abs(fifths), 7)]
    return f"{name} minor" if mode == "minor" else f"{name} major"


def import_library(out_dir: Path, catalog_path: Path, *, limit: int | None = None) -> ImportReport:
    table = read_json(TABLE_PATH)
    assert isinstance(table, dict)
    items: dict = table["items"]
    report = ImportReport()
    entries: list[dict] = []
    fetched_at = utc_now()

    scores_out = out_dir / "scores" / "imported"
    scores_out.mkdir(parents=True, exist_ok=True)

    for index, (filename, spec) in enumerate(sorted(items.items())):
        if limit is not None and index >= limit:
            break
        source_path = LIBRARY_DIR / filename
        if not source_path.exists():
            report.missing.append(filename)
            continue
        if "exclude" in spec:
            report.excluded.append((filename, spec["exclude"]))
            continue

        # The composition test, run again here rather than trusted from the
        # table: the table is data a human edits.
        verdict = composition_verdict(
            composer=spec.get("composer"),
            published_year=spec.get("publishedYear"),
            traditional=bool(spec.get("traditional")),
        )
        if verdict.verdict is not Verdict.BUNDLE:
            report.excluded.append((filename, f"composition: {verdict.reason}"))
            continue

        xml = read_main_xml(source_path)
        reasons = normalisation_reasons(xml)
        dest = scores_out / (spec["id"] + ".mxl")
        tags = ["musetrainer"]
        if reasons:
            from convert import cached_convert  # imported late: music21 is slow to load

            try:
                cached_convert(
                    source_path,
                    dest,
                    title=spec["title"],
                    composer=spec.get("composer"),
                )
            except Exception as exc:  # noqa: BLE001
                # music21 cannot round-trip every edition — one Chopin file
                # carries a 2048th-note tuplet rest its exporter refuses. The
                # original still renders, so it is copied verbatim and the
                # failure is recorded rather than costing the piece.
                shutil.copy2(source_path, dest)
                report.fallback.append((filename, f"{type(exc).__name__}: {exc}"))
                tags.append("not-normalised")
                facts = measure_facts(xml)
            else:
                report.normalised.append((filename, "; ".join(reasons)))
                facts = measure_facts(read_main_xml(dest))
        else:
            shutil.copy2(source_path, dest)
            facts = measure_facts(xml)

        entries.append(
            catalog_item(
                item_id=spec["id"],
                item_type="song",
                title=spec["title"],
                level=spec["level"],
                # Every [MT] level is a hand-entered number in
                # content/sources/musetrainer.json, decided per piece.
                level_source="judged",
                hands="both",
                tracks=spec["tracks"],
                concepts=spec["concepts"],
                source=SourceBlock(
                    name="MuseTrainer public-domain MusicXML library",
                    url=SOURCE_URL,
                    license=STATED_LICENSE,
                    pd_region=spec.get("pd_region", "worldwide"),
                    fetchedAt=fetched_at,
                    checksum=sha256_file(dest),
                    editionNotes=spec.get("editionNotes"),
                ),
                composer=spec.get("composer"),
                arranger=spec.get("arranger"),
                genre=["classical"] if "classical" in spec["tracks"] else None,
                abrsmGradeApprox=spec.get("abrsmGradeApprox"),
                file=f"scores/imported/{spec['id']}.mxl",
                variantOf=spec.get("variantOf"),
                variantLabel=spec.get("variantLabel"),
                tempoBpm=facts["tempoBpm"],
                keySig=facts["keySig"],
                timeSig=facts["timeSig"],
                tags=tags,
            )
        )
        report.imported.append(filename)

    write_json(catalog_path, entries)
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, required=True, help="content output directory")
    parser.add_argument("--catalog", type=Path, required=True)
    parser.add_argument("--limit", type=int)
    parser.add_argument(
        "--no-cache", action="store_true", help="ignore build/cache/convert and reconvert"
    )
    args = parser.parse_args()
    if args.no_cache:
        os.environ["PIANOPATH_NO_CACHE"] = "1"

    if not LIBRARY_DIR.exists():
        print(
            f"musetrainer library not present at {LIBRARY_DIR}; run tools/content/fetch.py first",
            file=sys.stderr,
        )
        write_json(args.catalog, [])
        sys.exit(0)

    report = import_library(args.out, args.catalog, limit=args.limit)
    if report.normalised:
        print(f"normalised {len(report.normalised)}:")
        for name, why in report.normalised:
            print(f"  - {name}: {why}")
    if report.fallback:
        print(f"copied verbatim after a failed normalisation {len(report.fallback)}:")
        for name, why in report.fallback:
            print(f"  - {name}: {why}")
    if report.excluded:
        print(f"excluded {len(report.excluded)}:")
        for name, why in report.excluded:
            print(f"  - {name}: {why}")
    if report.missing:
        print(f"missing {len(report.missing)} file(s) named in the table", file=sys.stderr)
    # Last, so the build's one-line summary of this step is the count rather
    # than whichever exclusion happened to print last.
    from convert import CACHE_STATS  # late import: music21 is slow to load

    print(
        f"imported {len(report.imported)} score(s), excluded {len(report.excluded)}, "
        f"normalised {len(report.normalised)} ({CACHE_STATS.summary()})"
    )


if __name__ == "__main__":
    main()
