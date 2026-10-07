#!/usr/bin/env python3
"""Fetch the three MAESTRO performances the converter's tests read (Q47, 2026-09-29).

`test_converter.TestRealRecordings` and `parity_reference.py` read three Disklavier
performances from `build/midi-real/`. They come from the MAESTRO dataset, v3.0.0, MIDI
only, which the owner decided on 2026-09-28 may be fetched for testing. This is the CI
step "Fetch the MAESTRO test recordings", and a developer can run it too:

    python tools/midi-cleanup/tests/fetch_maestro.py

**What it checks, in order.** The archive's SHA256 against the publisher's figure before
anything is opened; then, from the archive's own metadata (`maestro-v3.0.0.csv`), that each
alias's member is listed by exactly one row and that the row names the intended composer,
work and year; that the member is in the archive once, is not empty, and has the bytes
pinned below. Only when all three pass are the files and `SOURCE.md` written. The mapping
is by member path, not by a search: the metadata holds two 2011 performances of BWV 885,
so composer, title and year alone would not say which one the Bach alias means. The
pinned bytes are the ones the harness was built against on 2026-09-21 (the main
checkout's copies are byte-identical to these members).

**A restored cache is validated, not trusted** (`--cache-hit true`): the three files
present, non-empty and with the pinned bytes, and `SOURCE.md` naming each alias, its member
and the archive's checksum; otherwise the step fails, and nothing is downloaded.

**The licence.** "The dataset is made available by Google LLC under a Creative Commons
Attribution Non-Commercial Share-Alike 4.0 (CC BY-NC-SA 4.0) license", quoted from the
dataset's page on 2026-09-29. The performances are test input for this personal,
non-commercial project: never committed, never bundled into the app, never uploaded as an
artefact. The dataset asks that the paper introducing it be cited, with the version; both
are in `SOURCE.md` and in the step's comment in `.github/workflows/ci.yml`.

Standard library only: the step runs before anything else needs the network.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import shutil
import sys
import tempfile
import urllib.request
import zipfile
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
DEFAULT_OUT = REPO / "build" / "midi-real"

VERSION = "v3.0.0"
DATASET_PAGE = "https://magenta.withgoogle.com/datasets/maestro"
ARCHIVE_URL = "https://storage.googleapis.com/magentadata/datasets/maestro/v3.0.0/maestro-v3.0.0-midi.zip"
#: The publisher's SHA256 for the MIDI-only v3.0.0 zip, as the dataset's page gives it.
ARCHIVE_SHA256 = "70470ee253295c8d2c71e6d9d4a815189e35c89624b76d22fce5a019d5dde12c"
MEMBER_ROOT = "maestro-v3.0.0/"
METADATA = MEMBER_ROOT + "maestro-v3.0.0.csv"

LICENCE = (
    "The dataset is made available by Google LLC under a Creative Commons Attribution "
    "Non-Commercial Share-Alike 4.0 (CC BY-NC-SA 4.0) license"
)
LICENCE_TEXT_URL = "https://creativecommons.org/licenses/by-nc-sa/4.0/"
CITATION_TITLE = (
    "Enabling Factorized Piano Music Modeling and Generation with the MAESTRO Dataset"
)
CITATION = (
    "Curtis Hawthorne, Andriy Stasyuk, Adam Roberts, Ian Simon, Cheng-Zhi Anna Huang, "
    "Sander Dieleman, Erich Elsen, Jesse Engel and Douglas Eck. "
    f"\"{CITATION_TITLE}.\" International Conference on Learning Representations (ICLR), "
    "2019. https://openreview.net/forum?id=r1lYRjC9F7"
)


@dataclass(frozen=True)
class Performance:
    """One alias the harness reads, and the one archive member it means."""

    alias: str
    #: The row's `midi_filename`, relative to `MEMBER_ROOT`.
    member: str
    composer: str
    #: A part of the row's `canonical_title` that names the work.
    title_contains: str
    year: str
    #: The member's own SHA256: the bytes the harness was built against.
    sha256: str


PERFORMANCES: tuple[Performance, ...] = (
    Performance(
        "bach-bwv885-prelude-2011.mid",
        "2011/MIDI-Unprocessed_22_R1_2011_MID--AUDIO_R1-D8_12_Track12_wav.midi",
        "Johann Sebastian Bach", "BWV 885", "2011",
        "e2ba82596c757411e06ee2ca182567c02dd2e7ebe2ef7f1b18dc8e40044428eb",
    ),
    Performance(
        "grieg-op38-7-waltz-2014.mid",
        "2014/MIDI-UNPROCESSED_21-22_R1_2014_MID--AUDIO_21_R1_2014_wav--2.midi",
        "Edvard Grieg", "Op. 38 No. 7", "2014",
        "8e470e2a9f00c279e40c24525ffc8c389c5228d2fa220bc2ab2c1b7394e8e336",
    ),
    Performance(
        "scarlatti-k525-2008.mid",
        "2008/MIDI-Unprocessed_09_R3_2008_01-07_ORIG_MID--AUDIO_09_R3_2008_wav--2.midi",
        "Domenico Scarlatti", "K. 525", "2008",
        "fbff7b81e8eb9159e52f0a9f46f3fef1cbe14cb0737dca137d3b52498a2b58cc",
    ),
)


class FetchError(Exception):
    """The archive or a member is not what the mapping says it is."""


def sha256_of(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1 << 20), b""):
            digest.update(block)
    return digest.hexdigest()


def download(url: str, dest: Path) -> None:
    with urllib.request.urlopen(url, timeout=120) as response, dest.open("wb") as handle:
        shutil.copyfileobj(response, handle)


def source_md(performances: tuple[Performance, ...], rows: dict[str, dict[str, str]],
              archive_sha256: str, today: str) -> str:
    table = "\n".join(
        f"| `{p.alias}` | `{MEMBER_ROOT}{p.member}` | {rows[p.member]['canonical_composer']} | "
        f"{rows[p.member]['canonical_title']} | {rows[p.member]['year']} | `{p.sha256}` |"
        for p in performances
    )
    return f"""# The MAESTRO performances the converter's tests read

Written by `tools/midi-cleanup/tests/fetch_maestro.py` on {today} (UTC). Test input for
`tools/midi-cleanup/tests/test_converter.py` (`TestRealRecordings`) and
`tools/midi-cleanup/tests/parity_reference.py`: never committed, never bundled into the
app, never uploaded as an artefact.

- Dataset: MAESTRO {VERSION}, MIDI only ({DATASET_PAGE})
- Archive: {ARCHIVE_URL}
- Archive SHA256: `{archive_sha256}`, verified before anything was extracted

| Alias | Archive member | Composer | Title | Year | SHA256 |
| --- | --- | --- | --- | --- | --- |
{table}

## Licence

> {LICENCE}

Quoted from {DATASET_PAGE}. The licence's text: {LICENCE_TEXT_URL} (the archive carries
it as `{MEMBER_ROOT}LICENSE`).

## Citation

The dataset asks that the paper introducing it be cited, with the version used:

{CITATION} Dataset version: MAESTRO {VERSION}.
"""


def extract(archive: Path, out: Path, *, expected_sha256: str | None = None,
            performances: tuple[Performance, ...] | None = None,
            today: str | None = None) -> None:
    """Verify `archive`, then write exactly the performances' aliases and `SOURCE.md`."""
    expected_sha256 = expected_sha256 or ARCHIVE_SHA256
    performances = performances or PERFORMANCES
    today = today or datetime.now(timezone.utc).date().isoformat()

    actual = sha256_of(archive)
    if actual != expected_sha256:
        raise FetchError(
            f"{archive.name}: SHA256 {actual}, expected the publisher's {expected_sha256}; "
            "nothing was extracted"
        )

    chosen: dict[str, bytes] = {}
    rows: dict[str, dict[str, str]] = {}
    with zipfile.ZipFile(archive) as bundle:
        names = bundle.namelist()
        if METADATA not in names:
            raise FetchError(f"{archive.name} has no {METADATA}")
        with bundle.open(METADATA) as handle:
            metadata = list(csv.DictReader(io.TextIOWrapper(handle, encoding="utf-8")))
        for p in performances:
            listed = [row for row in metadata if row["midi_filename"] == p.member]
            if len(listed) != 1:
                raise FetchError(
                    f"{p.alias}: {METADATA} has {len(listed)} rows for {p.member}, expected 1"
                )
            row = listed[0]
            if (row["canonical_composer"], row["year"]) != (p.composer, p.year) \
                    or p.title_contains not in row["canonical_title"]:
                raise FetchError(
                    f"{p.alias}: {p.member} is {row['canonical_composer']}, "
                    f"{row['canonical_title']!r}, {row['year']} in {METADATA}; expected "
                    f"{p.composer}, a title with {p.title_contains!r}, {p.year}"
                )
            alike = [r for r in metadata if r["canonical_composer"] == p.composer
                     and r["year"] == p.year and p.title_contains in r["canonical_title"]]
            print(f"{p.alias}: {p.member} ({len(alike)} performance(s) of "
                  f"{p.title_contains} by {p.composer} in {p.year}; the path names one)")
            member = MEMBER_ROOT + p.member
            present = names.count(member)
            if present != 1:
                raise FetchError(f"{p.alias}: {member} is in the archive {present} times, expected 1")
            data = bundle.read(member)
            if not data:
                raise FetchError(f"{p.alias}: {member} is empty")
            if hashlib.sha256(data).hexdigest() != p.sha256:
                raise FetchError(
                    f"{p.alias}: {member} has SHA256 {hashlib.sha256(data).hexdigest()}, "
                    f"expected {p.sha256}"
                )
            chosen[p.alias] = data
            rows[p.member] = row

    out.mkdir(parents=True, exist_ok=True)
    for alias, data in chosen.items():
        (out / alias).write_bytes(data)
    (out / "SOURCE.md").write_text(source_md(performances, rows, expected_sha256, today),
                                   encoding="utf-8", newline="\n")


def problems(out: Path, *, performances: tuple[Performance, ...] | None = None,
             expected_sha256: str | None = None) -> list[str]:
    """What is wrong with `out` as the fetch leaves it; empty when nothing is."""
    performances = performances or PERFORMANCES
    expected_sha256 = expected_sha256 or ARCHIVE_SHA256
    found: list[str] = []
    for p in performances:
        path = out / p.alias
        if not path.is_file():
            found.append(f"{path} is missing")
        elif path.stat().st_size == 0:
            found.append(f"{path} is empty")
        elif sha256_of(path) != p.sha256:
            found.append(f"{path} has SHA256 {sha256_of(path)}, expected {p.sha256}")
    source = out / "SOURCE.md"
    if not source.is_file():
        found.append(f"{source} is missing")
    else:
        text = source.read_text(encoding="utf-8")
        for p in performances:
            for needed in (f"`{p.alias}`", f"`{MEMBER_ROOT}{p.member}`"):
                if needed not in text:
                    found.append(f"{source} does not name {needed} (for {p.alias})")
        if expected_sha256 not in text:
            found.append(f"{source} does not give the archive's SHA256 {expected_sha256}")
    return found


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--cache-hit", default="",
                        help="the cache step's `cache-hit` output: 'true' validates what it "
                             "restored and never downloads")
    parser.add_argument("--archive", type=Path,
                        help="an already-downloaded maestro-v3.0.0-midi.zip, instead of the download")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = parser.parse_args(argv)
    out: Path = args.out

    if args.cache_hit == "true":
        found = problems(out)
        if found:
            print(f"the cache restored {out}, and it is not what this step writes "
                  "(a restore is not proof the inputs exist):")
            for line in found:
                print(f"  {line}")
            print("change the cache key in .github/workflows/ci.yml to fetch afresh")
            return 1
        print(f"{out}: the restored performances and SOURCE.md validated")
        return 0

    if not problems(out):
        print(f"{out}: the three performances and SOURCE.md are present and validated")
        return 0

    try:
        if args.archive is not None:
            extract(args.archive, out)
        else:
            with tempfile.TemporaryDirectory() as tmp:
                archive = Path(tmp) / "maestro-v3.0.0-midi.zip"
                print(f"downloading {ARCHIVE_URL}")
                download(ARCHIVE_URL, archive)
                extract(archive, out)
    except FetchError as error:
        print(f"fetch failed: {error}")
        return 1

    found = problems(out)
    if found:
        print("the fetch wrote something its own check refuses:")
        for line in found:
            print(f"  {line}")
        return 1
    print(f"wrote {', '.join(p.alias for p in PERFORMANCES)} and SOURCE.md to {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
