#!/usr/bin/env python3
"""
Search the whole PDMX archive, not the few hundred scores already committed.

**Why this exists.** Every repertoire search in P22 was run against
`app/public/content/catalog.json` — 2,053 rows — and the answers were reported
as facts about "the library". The archive on the owner's machine holds **37,261
scores**, and looking in it needs nothing but this file. Only *committing* a
quarried score needs the owner, because `review.py` has a human gate; searching
does not. The owner's question, on being told a rung could have only one song:
*"We have, what, 37,000 songs in the PDMX query and you can't look… Would that
really be so hard?"* It was not hard. It was not done.

**What it can and cannot see.** The CSV carries what the uploader and MuseScore
recorded: title, artist, composer, genres, tags, licence, rating, complexity,
bar and note counts, and three computed features — `pitch_class_entropy`,
`scale_consistency`, `groove_consistency`. **It carries no key signature, no
time signature and no chord symbols**, because those are inside the `.mxl`. So
this narrows a field of 37,261 to a shortlist; `extract.py` then pulls the files
and `attach_notation` reads what they actually say. Nothing here is evidence
about the music — it is evidence about the metadata, which is exactly the kind
of claim that has been wrong before.

Usage:

    python3 tools/content/archive_search.py --title "greensleeves"
    python3 tools/content/archive_search.py --title "kumbaya" --max-bars 40 --pd
    python3 tools/content/archive_search.py --artist "joplin" --min-rating 4

`--pd` keeps only rows the dataset marks public domain. `--rated` keeps only
rows somebody scored, which is the one quality signal the archive has.
"""
from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path

#: The archive lives beside the repository, never inside it (`00` D22).
DEFAULT_CSV = Path(r"C:\Users\yalir\repos\Piano Stuff\PDMX.csv")


def as_float(value: str) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--csv", type=Path, default=DEFAULT_CSV)
    parser.add_argument("--title", action="append", default=[],
                        help="substring of the title or song name; repeatable, any may match")
    parser.add_argument("--artist", help="substring of artist or composer")
    # No --genre and no --tag, deliberately. Those columns come from whoever
    # uploaded the score: a tango is filed under `classical`, and the Library's
    # own genre filters held no songs at all until 2026-09-18 because a track
    # came from an import bucket. Select on the title, which is the work's own
    # name, and then read the notation. `noGenreSelection.test.ts` enforces it —
    # and caught this file still carrying both flags after the rule was written.
    parser.add_argument("--pd", action="store_true", help="only rows marked public domain")
    parser.add_argument("--rated", action="store_true", help="only rows with at least one rating")
    parser.add_argument("--min-rating", type=float)
    parser.add_argument("--min-bars", type=int)
    parser.add_argument("--max-bars", type=int)
    parser.add_argument("--max-complexity", type=float)
    parser.add_argument("--dedup", action="store_true",
                        help="only the archive's own preferred copy of a work")
    parser.add_argument("--limit", type=int, default=30)
    args = parser.parse_args()

    if not args.csv.exists():
        raise SystemExit(f"archive CSV not found at {args.csv}")

    titles = [t.lower() for t in args.title]
    artist = (args.artist or "").lower()

    hits: list[dict] = []
    scanned = 0
    # The file is 209 MB; stream it. `csv` needs a big field limit because the
    # `tracks` column can be enormous on an orchestral upload.
    csv.field_size_limit(10_000_000)
    with args.csv.open("r", encoding="utf-8", newline="") as handle:
        for row in csv.DictReader(handle):
            scanned += 1
            if args.pd and row.get("license") != "publicdomain":
                continue
            if args.dedup and row.get("subset:deduplicated") != "True":
                continue
            if args.rated and row.get("is_rated") != "True":
                continue
            name = f"{row.get('song_name', '')} {row.get('title', '')}".lower()
            if titles and not any(t in name for t in titles):
                continue
            if artist and artist not in (
                f"{row.get('artist_name', '')} {row.get('composer_name', '')}".lower()
            ):
                continue
            bars = as_float(row.get("song_length.bars", ""))
            if args.min_bars is not None and (bars is None or bars < args.min_bars):
                continue
            if args.max_bars is not None and (bars is None or bars > args.max_bars):
                continue
            rating = as_float(row.get("rating", ""))
            if args.min_rating is not None and (rating is None or rating < args.min_rating):
                continue
            complexity = as_float(row.get("complexity", ""))
            if args.max_complexity is not None and (
                complexity is None or complexity > args.max_complexity
            ):
                continue
            hits.append(row)

    hits.sort(key=lambda r: (-(as_float(r.get("rating", "")) or 0), r.get("song_name", "")))
    print(f"{len(hits)} of {scanned} rows matched.\n")
    print("  rating  n   bars  cplx  licence       title / artist")
    for row in hits[: args.limit]:
        rating = as_float(row.get("rating", "")) or 0
        bars = as_float(row.get("song_length.bars", ""))
        cplx = as_float(row.get("complexity", ""))
        print(
            f"  {rating:>5.2f} {row.get('n_ratings', '0'):>3} "
            f"{('?' if bars is None else int(bars)):>5} {('?' if cplx is None else cplx):>5} "
            f"{(row.get('license') or '?')[:13]:<14}"
            f"{(row.get('song_name') or '')[:38]}  —  {(row.get('artist_name') or '?')[:22]}"
        )
        print(f"          cid {Path(row.get('mxl', '')).stem}  genres={row.get('genres') or '-'}")
    if len(hits) > args.limit:
        print(f"\n  … and {len(hits) - args.limit} more; raise --limit.")
    print(
        "\nThese are metadata matches, not musical facts. The archive records no key "
        "signature, no time signature and no chord symbols — extract the file and read "
        "the notation before believing anything about what is in it."
    )


if __name__ == "__main__":
    main()
