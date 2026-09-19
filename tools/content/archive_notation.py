#!/usr/bin/env python3
"""
Read what an archive score actually says, before anything is quarried.

**The method this completes.** The owner, after watching a rung be given one
song because a search over the *committed* catalog found nothing else:

> "I meant you could find the songs first online by finding, hey, what are songs
> that have this kind of chord structure, and then you can find the song based
> off of the features that we can trust, not the genre, in the PDMX."

So: name the pieces from musical knowledge, look those **titles** up in the
archive with `archive_search.py` — a title is the work's own name and is the one
metadata field worth trusting — and then read the file. All 37,261 scores are
already unpacked under `build/pdmx/library/<first two chars of cid>/<cid>.mxl`,
so this needs no quarry, no converter and no review gate.

`genres` and `tags` are not used here and should not be used anywhere. They came
from an uploader, and this session has already found a tango filed as classical
and a whole library whose genre filters held no songs.

Usage:

    python3 tools/content/archive_notation.py QmdZ4fF9... Qmc3v934...
    python3 tools/content/archive_notation.py --title "house of the rising sun"

With `--title` it searches the CSV itself and reads every match, which is the
whole loop in one command.
"""
from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from notation import describe, key_name, read_musicxml  # noqa: E402

LIBRARY = Path(__file__).resolve().parents[2] / "build" / "pdmx" / "library"
DEFAULT_CSV = Path(r"C:\Users\yalir\repos\Piano Stuff\PDMX.csv")


def score_path(cid: str) -> Path:
    """`build/pdmx/library/a1/Qma1….mxl` — sharded on the two chars after `Qm`."""
    return LIBRARY / cid[2:4].lower() / f"{cid}.mxl"


def rows_for_title(csv_path: Path, needle: str, pd_only: bool) -> list[dict]:
    csv.field_size_limit(10_000_000)
    needle = needle.lower()
    out: list[dict] = []
    with csv_path.open("r", encoding="utf-8", newline="") as handle:
        for row in csv.DictReader(handle):
            if pd_only and row.get("license") != "publicdomain":
                continue
            name = f"{row.get('song_name', '')} {row.get('title', '')}".lower()
            if needle in name:
                out.append(row)
    return out


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("cids", nargs="*", help="content ids to read")
    parser.add_argument("--title", help="find every archive row whose title contains this, and read them")
    parser.add_argument("--csv", type=Path, default=DEFAULT_CSV)
    parser.add_argument("--pd", action="store_true", default=True)
    parser.add_argument("--limit", type=int, default=12)
    args = parser.parse_args()

    targets: list[tuple[str, str]] = [(cid, "") for cid in args.cids]
    if args.title:
        for row in rows_for_title(args.csv, args.title, args.pd)[: args.limit]:
            cid = Path(row.get("mxl", "")).stem
            label = f"{row.get('song_name') or '?'} — {row.get('artist_name') or '?'}"
            targets.append((cid, label))

    if not targets:
        raise SystemExit("nothing to read: pass content ids or --title")

    for cid, label in targets:
        path = score_path(cid)
        if not path.exists():
            print(f"\n{cid}  NOT UNPACKED at {path}")
            continue
        text = read_musicxml(path)
        if text is None:
            print(f"\n{cid}  unreadable")
            continue
        try:
            n = describe(text)
        except Exception as error:  # noqa: BLE001 - a bad file is data, not a crash
            print(f"\n{cid}  will not parse: {type(error).__name__}")
            continue
        print(f"\n{label or cid}")
        print(
            f"  key {key_name(n):<6} times {','.join(n['times']) or '-':<8} "
            f"staves {n['staves']}  bars {n['bars']}  chord symbols {n['chordCount']}"
        )
        if len(n["keys"]) > 1:
            print(f"  MODULATES — {len(n['keys'])} key signatures: {n['keys']}")
        if n["chords"]:
            print(f"  chords: {' '.join(n['chords'])}")
        print(f"  cid {cid}")


if __name__ == "__main__":
    main()
