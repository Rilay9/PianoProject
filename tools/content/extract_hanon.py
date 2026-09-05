#!/usr/bin/env python3
"""
Encodes Hanon 1–20 from the Mutopia Project's public-domain edition.

docs/03-content-pipeline.md §2 and the P4 prompt both ask for Hanon to come
from a published edition rather than from memory, and this is how: the Mutopia
typeset of *The Virtuoso Pianist* Part I (CC BY-SA 4.0) is parsed and reduced
to the one thing the generator needs — the sequence of scale degrees each hand
plays, with the printed fingering.

The composition (Hanon, 1873) is public domain; what Mutopia holds a licence
over is the typesetting, and this extracts note data rather than engraving.
The edition is credited on every generated item all the same, because that is
where the data came from.

The output is committed as content/sources/hanon-mutopia.json so the build runs
offline; this script only has to be re-run when the encoding is questioned.

Usage:
    python3 tools/content/fetch.py --only mutopia
    python3 tools/content/extract_hanon.py [--out content/sources/hanon-mutopia.json]
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import CONTENT_SRC, IMPORTED_DIR, run, write_json  # noqa: E402

LY_DIR = (
    IMPORTED_DIR / "mutopia" / "ftp" / "HanonCL" / "virtuoso-pianist-pt1" / "virtuoso-pianist-pt1-lys"
)
DEFAULT_OUT = CONTENT_SRC / "sources" / "hanon-mutopia.json"

STEPS = "cdefgab"

#: A LilyPond note: step letter, optional accidental, octave marks, duration,
#: and a fingering in any of the three positions this edition uses.
NOTE_RE = re.compile(r"(?<![a-zA-Z'])([a-g])(is|es)?((?:'|,)*)(\d+\.?)?\s*([-_^]\d)?")


def strip_noise(text: str) -> str:
    """
    Removes everything that is not a note before the note regex runs.

    The commands that take a *bare word* argument have to go with their
    argument: `\clef bass` leaves the word "bass" behind, whose leading `b`
    parses as a note — which is exactly what happened, and it put a phantom
    note at the head of every left-hand scale.
    """
    text = re.sub(r"%\{.*?%\}", " ", text, flags=re.S)
    text = re.sub(r"%[^\n]*", " ", text)
    text = re.sub(r"\\markup\s*\{[^{}]*\}", " ", text)
    # A placeholder rather than nothing, so the command-with-argument rule
    # below eats the string instead of eating the note that follows it.
    text = re.sub(r'"[^"]*"', " ~ ", text)
    text = re.sub(r"\\repeat[ \t]+\w+[ \t]+\d+", " ", text)
    # One argument only. An optional second one used to be allowed here for
    # `\repeat volta 2`, and it ate the note that follows `\bar "||"` on the
    # same line — which cost the left hand its first descending note in two of
    # the twenty exercises.
    text = re.sub(r"\\(?:clef|time|key|tempo|set|override|bar)[ \t]+\S+", " ", text)
    text = re.sub(r"\\[a-zA-Z]+", " ", text)
    text = text.replace("~", " ")
    # `\repeat volta 2` leaves the bare word behind, whose letters would parse
    # as notes.
    text = re.sub(r"\bvolta\b", " ", text)
    return text.replace("<", " ").replace(">", " ")


def parse_notes(body: str, relative: bool, ref_step: str, ref_octave: int) -> list[tuple[int, int, int, int | None]]:
    """`(step index, octave, alteration, fingering)` for every note in `body`."""
    out: list[tuple[int, int, int, int | None]] = []
    prev_step = STEPS.index(ref_step)
    prev_octave = ref_octave
    for match in NOTE_RE.finditer(strip_noise(body)):
        step, accidental, marks, _duration, finger = match.groups()
        index = STEPS.index(step)
        if relative:
            octave = prev_octave
            diff = index - prev_step
            # LilyPond's relative mode: the octave nearest the previous note.
            if diff > 3:
                octave -= 1
            elif diff < -3:
                octave += 1
            octave += marks.count("'") - marks.count(",")
        else:
            octave = 3 + marks.count("'") - marks.count(",")
        alter = {"is": 1, "es": -1}.get(accidental or "", 0)
        out.append((index, octave, alter, int(finger[1:]) if finger else None))
        prev_step, prev_octave = index, octave
    return out


def voice_body(source: str, voice: str) -> tuple[str, bool, str, int]:
    """The braced body of `RH = …` / `LH = …`, and its relative-mode reference."""
    match = re.search(rf"^{voice}\s*=\s*(\\relative\s+([a-g])((?:'|,)*)\s*)?\{{", source, re.M)
    if not match:
        raise ValueError(f"no {voice} block")
    start = match.end()
    depth = 1
    index = start
    while index < len(source) and depth:
        if source[index] == "{":
            depth += 1
        elif source[index] == "}":
            depth -= 1
        index += 1
    body = source[start : index - 1]
    if match.group(1):
        octave = 3 + match.group(3).count("'") - match.group(3).count(",")
        return body, True, match.group(2), octave
    return body, False, "c", 3


def diatonic(note: tuple[int, int, int, int | None]) -> int:
    return note[1] * 7 + note[0]


def extract(number: int) -> dict:
    path = LY_DIR / f"hanon{number:02d}.ily"
    source = path.read_text(encoding="utf-8", errors="replace")
    hands: dict[str, dict] = {}
    ascending_cells = 0

    for voice in ("RH", "LH"):
        body, relative, ref_step, ref_octave = voice_body(source, voice)
        notes = parse_notes(body, relative, ref_step, ref_octave)
        if any(n[2] for n in notes):
            raise ValueError(f"exercise {number} {voice}: accidentals found; 1–20 are C major")
        degrees = [diatonic(n) - diatonic(notes[0]) for n in notes]
        fingers = [n[3] for n in notes]
        # The double bar separates the ascending half from the descending half.
        cut = body.find('\\bar "||"')
        before = len(parse_notes(body[:cut], relative, ref_step, ref_octave)) if cut > 0 else 0
        ascending_cells = max(ascending_cells, before // 8)
        hands[voice.lower()] = {"steps": degrees, "fingers": fingers, "ascendingNotes": before}

    rh = hands["rh"]
    cell = rh["steps"][:8]
    cell = [d - cell[0] for d in cell]
    # Every exercise ends on a long tonic; No. 20 ends on a two-note chord, so
    # the leftover beyond a whole number of bars says how many notes that is.
    final_notes = (len(rh["steps"]) - 1) % 8 + 1
    return {
        "cell": cell,
        "ascendingCells": ascending_cells,
        "finalChordNotes": final_notes,
        "notes": len(rh["steps"]),
        "rh": {
            "start": "C4",
            "steps": rh["steps"],
            "fingers": rh["fingers"],
            "ascendingNotes": rh["ascendingNotes"],
        },
        "lh": {
            "start": "C3",
            "steps": hands["lh"]["steps"],
            "fingers": hands["lh"]["fingers"],
            "ascendingNotes": hands["lh"]["ascendingNotes"],
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--first", type=int, default=1)
    parser.add_argument("--last", type=int, default=20)
    args = parser.parse_args()

    if not LY_DIR.exists():
        print(
            f"Mutopia sources not present at {LY_DIR}.\n"
            "Run: python3 tools/content/fetch.py --only mutopia",
            file=sys.stderr,
        )
        sys.exit(2)

    revision = run(["git", "-C", str(IMPORTED_DIR / "mutopia"), "rev-parse", "--short", "HEAD"]).stdout.strip()
    exercises = {}
    for number in range(args.first, args.last + 1):
        exercises[str(number)] = extract(number)
        info = exercises[str(number)]
        print(
            f"Hanon {number:2d}: {info['notes']:3d} notes, cell {info['cell']}, "
            f"{info['ascendingCells']} ascending bars"
        )

    write_json(
        args.out,
        {
            "_comment": [
                "Hanon 1-20, encoded from the Mutopia Project's public-domain edition.",
                "Generated by tools/content/extract_hanon.py; do not edit by hand.",
                "`steps` are diatonic scale degrees in C major counted from the hand's",
                "start note, so 0 = the start note and 7 = an octave above it. The",
                "octaves are normalised to the printed layout (right hand from middle C,",
                "left hand an octave below); the LilyPond source writes both an octave",
                "lower because its voices cross staves.",
                "The composition is public domain (Hanon, 1873); the edition this was",
                "read from is CC BY-SA 4.0 and is credited on every generated item.",
            ],
            "source": {
                "name": "Mutopia Project — Hanon, The Virtuoso Pianist (Part I)",
                "url": "https://github.com/MutopiaProject/MutopiaProject",
                "path": "ftp/HanonCL/virtuoso-pianist-pt1",
                "license": "CC BY-SA 4.0",
                "maintainer": "Steve Taylor and Javier Ruiz-Alma",
                "revision": revision,
            },
            "exercises": exercises,
        },
    )
    print(f"\nwrote {args.out}")


if __name__ == "__main__":
    main()
