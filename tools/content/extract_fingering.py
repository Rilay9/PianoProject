#!/usr/bin/env python3
"""
Reads the scale fingerings out of Clementi's Op. 42 (Mutopia edition).

The P4 prompt asks for the generator's fingering table to be verified against a
published chart rather than against memory. This is that chart: Muzio
Clementi, *Introduction to the Art of Playing on the Piano Forte*, Op. 42
(1801) — one of the sources from which modern scale fingering descends — as
typeset by the Mutopia Project under CC BY-SA 4.0.

Printed fingering is sparse: an edition marks the thumbs and the position
changes and leaves the rest to be read off by stepping. That is what
`fill_unmarked` does, and it is the same reading a pianist does from the page.

Output: content/sources/clementi-op42-fingering.json, committed so the
comparison test runs offline.

Usage:
    python3 tools/content/fetch.py --only mutopia
    python3 tools/content/extract_fingering.py
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import CONTENT_SRC, IMPORTED_DIR, run, write_json  # noqa: E402
from extract_hanon import STEPS, parse_notes  # noqa: E402

SCALES_DIR = (
    IMPORTED_DIR / "mutopia" / "ftp" / "ClementiM" / "O42" / "clementi-op42" / "clementi-op42-lys" / "ilys"
)
SCALE_FILES = ("clementi-op42-p1-18-scales.ily", "clementi-op42-p1-19-scales.ily")
DEFAULT_OUT = CONTENT_SRC / "sources" / "clementi-op42-fingering.json"

#: `inlineScaleBesMaj` → the key as this project spells it (music21 style).
KEY_NAMES = {
    "Cmaj": ("C", "major"), "Gmaj": ("G", "major"), "Dmaj": ("D", "major"),
    "Amaj": ("A", "major"), "Emaj": ("E", "major"), "Bmaj": ("B", "major"),
    "Fismaj": ("F#", "major"), "DesMaj": ("D-", "major"), "AesMaj": ("A-", "major"),
    "EesMaj": ("E-", "major"), "BesMaj": ("B-", "major"), "Fmaj": ("F", "major"),
    "Amin": ("A", "minor"), "Emin": ("E", "minor"), "Bmin": ("B", "minor"),
    "FisMin": ("F#", "minor"), "CisMin": ("C#", "minor"), "GisMin": ("G#", "minor"),
    "DisMin": ("D#", "minor"), "BesMin": ("B-", "minor"), "Fmin": ("F", "minor"),
    "Cmin": ("C", "minor"), "Gmin": ("G", "minor"), "Dmin": ("D", "minor"),
}


def strip_key_signatures(text: str) -> str:
    """
    `\\key fis \\minor` — the key name parses as a note otherwise.

    This was not hypothetical: every minor scale came out with a phantom extra
    note at the front before this existed.
    """
    return re.sub(r"\\key\s+[a-g](?:is|es)?\s+\\\w+", " ", text)


def scale_blocks(text: str) -> dict[str, str]:
    parts = re.split(r"\n\s*(inlineScale\w+)\s*=", text)
    return {parts[i].removeprefix("inlineScale"): parts[i + 1] for i in range(1, len(parts), 2)}


def hand_notes(block: str, hand: str) -> list[tuple[int, int, int, int | None]]:
    staves = re.split(r"\\new Staff", block)[1:]
    index = 0 if hand == "rh" else 1
    if len(staves) <= index:
        return []
    match = re.search(r"\\relative\s+([a-g])((?:'|,)*)\s*\{(.*)", staves[index], re.S)
    if not match:
        return []
    octave = 3 + match.group(2).count("'") - match.group(2).count(",")
    return parse_notes(strip_key_signatures(match.group(3)), True, match.group(1), octave)


def ascending_run(notes: list) -> list:
    """The notes up to the top, which is where the printed run turns around."""
    if not notes:
        return []
    out = [notes[0]]
    for note in notes[1:]:
        current = note[1] * 7 + note[0]
        previous = out[-1][1] * 7 + out[-1][0]
        if current <= previous:
            break
        out.append(note)
    return out


def fill_unmarked(fingers: list[int | None], step: int) -> list[int | None]:
    """
    Reads a sparse printed fingering the way a pianist does.

    Between two printed numbers the fingers move by one each note; `step` says
    in which direction, which is the whole difference between the hands: going
    up the keyboard the right hand's fingers rise and the left hand's fall.
    Anything that would leave the hand (a sixth finger) is left as None rather
    than invented.
    """
    out = list(fingers)
    marked = [i for i, f in enumerate(out) if f is not None]
    if not marked:
        return out
    for position in range(marked[0] - 1, -1, -1):
        previous = out[position + 1]
        candidate = None if previous is None else previous - step
        out[position] = candidate if candidate and 1 <= candidate <= 5 else None
    for position in range(marked[0] + 1, len(out)):
        if out[position] is not None:
            continue
        previous = out[position - 1]
        candidate = None if previous is None else previous + step
        out[position] = candidate if candidate and 1 <= candidate <= 5 else None
    return out


def one_octave(notes: list, step: int) -> tuple[list[int | None], list[int | None]]:
    """`(printed, filled)` fingerings for the first octave, tonic to tonic."""
    run = ascending_run(notes)[:8]
    printed = [n[3] for n in run]
    return printed, fill_unmarked(printed, step)


def extract() -> dict:
    text = "".join((SCALES_DIR / name).read_text(encoding="utf-8", errors="replace") for name in SCALE_FILES)
    blocks = scale_blocks(text)
    keys: dict[str, dict] = {}
    for block_name, (tonic, mode) in KEY_NAMES.items():
        block = blocks.get(block_name)
        if block is None:
            continue
        entry: dict = {"tonic": tonic, "mode": mode, "block": f"inlineScale{block_name}"}
        for hand in ("rh", "lh"):
            # Ascending the keyboard, right-hand fingers climb and left-hand
            # fingers fall.
            printed, filled = one_octave(hand_notes(block, hand), 1 if hand == "rh" else -1)
            entry[hand] = {"printed": printed, "filled": filled}
        keys[f"{tonic} {mode}"] = entry
    return keys


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = parser.parse_args()

    if not SCALES_DIR.exists():
        print(
            f"Mutopia sources not present at {SCALES_DIR}.\n"
            "Run: python3 tools/content/fetch.py --only mutopia",
            file=sys.stderr,
        )
        sys.exit(2)

    keys = extract()
    revision = run(["git", "-C", str(IMPORTED_DIR / "mutopia"), "rev-parse", "--short", "HEAD"]).stdout.strip()
    for name, entry in sorted(keys.items()):
        print(f"{name:10} RH {entry['rh']['filled']}  LH {entry['lh']['filled']}")

    write_json(
        args.out,
        {
            "_comment": [
                "Scale fingerings read from Clementi's Op. 42 (1801), Mutopia edition.",
                "Generated by tools/content/extract_fingering.py; do not edit by hand.",
                "`printed` is what the edition marks — printed fingering is sparse, so",
                "most entries are null. `filled` reads the unmarked notes off by",
                "stepping between the printed numbers, which is what a pianist does.",
                "Each list is one octave, tonic to tonic, ascending.",
            ],
            "source": {
                "name": "Muzio Clementi, Introduction to the Art of Playing on the Piano Forte, Op. 42 (1801)",
                "edition": "Mutopia Project typeset",
                "url": "https://github.com/MutopiaProject/MutopiaProject",
                "path": "ftp/ClementiM/O42/clementi-op42",
                "license": "CC BY-SA 4.0",
                "revision": revision,
            },
            "keys": keys,
        },
    )
    print(f"\nwrote {args.out} ({len(keys)} keys)")


if __name__ == "__main__":
    main()
