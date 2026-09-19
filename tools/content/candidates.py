#!/usr/bin/env python3
"""
What could go on a rung, read from the scores rather than from their names.

Placing repertoire has been done from memory twice and both times it was wrong:
four of eight placements in one sitting, including an eleven-bar right-hand
melody with no chord symbols put on the rung that teaches left-hand chords
because it was called *12 Bar Blues*. This is the shortlist that should have
come first.

**It narrows; it does not choose.** A piece in 3/4 is not necessarily a waltz
and twelve bars of I-IV-V are not necessarily a blues. Every row is printed with
the facts needed to reject it — bars, staves, keys, metres, the distinct chord
symbols, whether the level was judged or estimated — and the last step is still
reading the music.

**Two filters it deliberately does not apply**, both of which produced false
zeroes during P22 S1 and cost real work:

- **Genre tag.** `tracks` and `genre` came from the import bucket and the id's
  prefix, not from the music. Filtering by them is filtering by the least
  reliable field on the row. "The library has no early-stage genre repertoire"
  came from exactly that filter and sent a session writing generators.
- **Whether the row is already on a rung.** A piece may belong on two, and the
  one place it already sits may be the wrong one. Excluding them said core 4.5
  had nothing in compound time when it already held four things in 6/8.

Usage:

    python3 tools/content/candidates.py --rung 3.6
    python3 tools/content/candidates.py --meter 3/4 --max-level 4.5
    python3 tools/content/candidates.py --rung jazz.4 --exercises

`--rung` reads that rung's own `levelBand` and `requires` out of the built
curriculum, so the shortlist answers the question the rung actually asks.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import DEFAULT_OUT, read_json  # noqa: E402


def load(out_dir: Path) -> tuple[list[dict], dict]:
    catalog = read_json(out_dir / "catalog.json")
    curriculum = read_json(out_dir / "curriculum.json")
    assert isinstance(catalog, list) and isinstance(curriculum, dict)
    return catalog, curriculum


def find_rung(curriculum: dict, rung_id: str) -> tuple[dict, str] | None:
    for stage in curriculum.get("stages", []):
        for unit in stage.get("units", []):
            for lesson in unit.get("lessons", []):
                if lesson.get("id") == rung_id:
                    return lesson, unit.get("track", "?")
    return None


def relative_minor(fifths: int) -> int:
    """Pitch class of the relative minor's tonic for a key signature."""
    return (((7 * fifths) % 12) + 9) % 12


def sounds_minor(notation: dict) -> bool:
    """
    Whether the piece is in a minor key, as well as a file can say.

    `<mode>` is absent from 705 of 792 songs, so asking for it finds 5 pieces
    between levels 2.4 and 5.2 where there are 31. A key signature alone cannot
    tell A minor from C major; what distinguishes them is where the music
    *ends*, and `notation.finalBass` records that. A piece whose signature is no
    sharps and whose final bass is A is in A minor, and saying so is a judgement
    — which is why it lives in this search tool and not in `requires`, where
    `mode` stays strict and believes only the explicit tag.

    Wrong for a piece that ends on something other than its tonic. That is rare
    in the tonal repertoire this library holds, and the shortlist is read before
    anything is placed.
    """
    keys = notation.get("keys") or []
    if not keys:
        return False
    if any(key.get("mode") == "minor" for key in keys):
        return True
    if any(key.get("mode") == "major" for key in keys):
        return False
    final = notation.get("finalBass")
    if final is None:
        return False
    return any(relative_minor(int(key.get("fifths", 0))) == final for key in keys)


def matches(item: dict, need: str, value) -> bool:
    notation = item.get("notation")
    if not notation:
        return False
    if need == "chordSymbols":
        return bool(notation.get("chordCount", 0)) == bool(value)
    if need == "meter":
        return any(sig in notation.get("times", []) for sig in value)
    if need == "mode":
        return any(key.get("mode") == value for key in notation.get("keys", []))
    if need == "minorish":
        return sounds_minor(notation) == bool(value)
    if need == "staves":
        return int(notation.get("staves", 1)) >= int(value)
    return True


def describe_row(item: dict, on_rungs: dict) -> str:
    n = item.get("notation") or {}
    keys = ",".join(
        f"{k['fifths']:+d}{(k.get('mode') or '')[:3]}" for k in n.get("keys", [])
    ) or "-"
    chords = " ".join(n.get("chords", [])[:8])
    where = ", ".join(on_rungs.get(item["id"], [])) or "-"
    level = item.get("level")
    mark = "~" if item.get("levelSource") == "estimated" else " "
    return (
        f"  {mark}{level:>5} {(','.join(n.get('times', [])) or '-'):<8}"
        f" {keys:<12} st{n.get('staves', '?')} {str(n.get('bars', '?')):>4}b"
        f" ch{n.get('chordCount', 0):<3} {item.get('title', '')[:38]:<40}"
        f"\n        id {item['id']}\n        on {where}"
        + (f"\n        chords {chords}" if chords else "")
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dir", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--rung", help="take the band and requirements from this lesson id")
    parser.add_argument("--meter", action="append", help="e.g. 3/4; repeatable")
    parser.add_argument("--mode", choices=["major", "minor"], help="an explicit <mode> tag only")
    parser.add_argument("--minorish", action="store_true",
                        help="in a minor key as far as the file can say — the tag, or the "
                             "signature plus what it ends on. Finds 31 between 2.4 and 5.2 "
                             "where --mode minor finds 5.")
    parser.add_argument("--chords", action="store_true", help="must print chord symbols")
    parser.add_argument("--staves", type=int)
    parser.add_argument("--min-level", type=float)
    parser.add_argument("--max-level", type=float)
    parser.add_argument("--exercises", action="store_true", help="exercises too, not songs only")
    parser.add_argument("--limit", type=int, default=25)
    args = parser.parse_args()

    catalog, curriculum = load(args.dir)
    on_rungs: dict[str, list[str]] = {}
    for stage in curriculum.get("stages", []):
        for unit in stage.get("units", []):
            for lesson in unit.get("lessons", []):
                for item_id in list(lesson.get("songOptions", [])) + list(
                    lesson.get("exerciseOptions", [])
                ):
                    on_rungs.setdefault(item_id, []).append(lesson["id"])

    requires: dict = {}
    low, high = args.min_level, args.max_level
    if args.rung:
        found = find_rung(curriculum, args.rung)
        if not found:
            raise SystemExit(f"no rung {args.rung!r} in the built curriculum")
        lesson, track = found
        requires = dict(lesson.get("requires") or {})
        band = lesson.get("levelBand") or []
        if len(band) == 2:
            low = band[0] if low is None else low
            high = band[1] if high is None else high
        print(
            f"{args.rung} on {track}: band {low}-{high}, requires "
            f"{requires or '(nothing stated)'}\n"
        )

    if args.meter:
        requires["meter"] = args.meter
    if args.mode:
        requires["mode"] = args.mode
    if args.minorish:
        requires["minorish"] = True
    if args.chords:
        requires["chordSymbols"] = True
    if args.staves:
        requires["staves"] = args.staves

    rows = []
    for item in catalog:
        if not args.exercises and item.get("type") != "song":
            continue
        level = item.get("level")
        if not isinstance(level, (int, float)):
            continue
        if low is not None and level < low:
            continue
        if high is not None and level > high:
            continue
        if not all(matches(item, need, value) for need, value in requires.items()):
            continue
        rows.append(item)

    # A search that finds nothing must not be reported as an absence.
    #
    # Three times on 2026-09-18 a filtered query returned zero and the zero was
    # read as a fact about the library: "there is no tempo ladder" (there is,
    # spelled differently), "the library has no early genre repertoire" (the
    # filter used `genres`, which is wrong), "core 4.5 has nothing in compound
    # time" (it had four things in 6/8). Two of those sent work in the wrong
    # direction. So an empty result here runs the same query again with each
    # constraint dropped in turn, and prints what each relaxation finds — which
    # is the second, differently shaped search that `00-invariants` §1a demands,
    # run without anyone having to remember to.
    if not rows:
        print("This query matched nothing. That is a fact about the query.\n")
        relaxations: list[tuple[str, dict, tuple[float | None, float | None]]] = []
        for need in requires:
            relaxations.append((
                f"without {need}={requires[need]!r}",
                {k: v for k, v in requires.items() if k != need},
                (low, high),
            ))
        if low is not None or high is not None:
            relaxations.append(("without the level band", dict(requires), (None, None)))
        if not relaxations:
            print("  …and there was nothing to relax: the catalog has no songs at all.")
        for label, needs, (lo, hi) in relaxations:
            hits = [
                item for item in catalog
                if (args.exercises or item.get("type") == "song")
                and isinstance(item.get("level"), (int, float))
                and (lo is None or item["level"] >= lo)
                and (hi is None or item["level"] <= hi)
                and all(matches(item, n, v) for n, v in needs.items())
            ]
            print(f"  {label}: {len(hits)} row(s)")
            for item in sorted(hits, key=lambda i: i["level"])[:3]:
                print(f"      {item['level']:>5}  {item.get('title', '')[:44]}  {item['id']}")
        print(
            "\nBefore reporting that something does not exist, say which of these "
            "relaxations you checked. The archive is a separate question again: "
            "`archive_search.py` looks in all 37,261 scores, and this tool does not."
        )
        return

    rows.sort(key=lambda item: item["level"])
    already = sum(1 for item in rows if item["id"] in on_rungs)
    print(
        f"{len(rows)} candidate(s) — {already} already on some rung, "
        f"{len(rows) - already} on none.\n"
        f"~ marks a level that was estimated rather than judged.\n"
    )
    for item in rows[: args.limit]:
        print(describe_row(item, on_rungs))
    if len(rows) > args.limit:
        print(f"\n  … and {len(rows) - args.limit} more; raise --limit to see them.")


if __name__ == "__main__":
    main()
