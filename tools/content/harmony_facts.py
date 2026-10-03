"""
CF2: the harmony a score states, read by music21 (`docs/prompts/runs/content-finish-plan.md`).

It reports facts; it decides nothing about where a piece belongs, which is curation. Only explicit
harmony is read: printed chord symbols, and chords written as three or more notes struck together.
A tune with neither has no stated harmony, and the answer is "unknown": a melody's notes are never
harmonised here to avoid saying so. The key is the catalogue row's (`keySig`, the key the build
read off the engraved signature); a row that gives no mode leaves the function unknown.

    python3 tools/content/harmony_facts.py <item id> ...
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from music21 import chord, converter, harmony, key, roman

CONTENT = Path(__file__).resolve().parents[2] / "app" / "public" / "content"

#: The rung's three chords as written: C, F and G major, G with or without its seventh.
LITERAL_CFG = {"C", "F", "G", "G7"}
PRIMARY = {"I", "IV", "V", "V7"}


def row_key(row: dict) -> key.Key | None:
    tonic, _, mode = (row.get("keySig") or "").partition(" ")
    if mode not in ("major", "minor"):
        return None
    return key.Key(tonic.lower() if mode == "minor" else tonic)


def explicit_chords(score) -> tuple[str, list]:
    """("symbols", ChordSymbols) when any are printed, else ("written", chords of 3+ notes), else ("none", [])."""
    symbols = [c for c in score.recurse().getElementsByClass(harmony.ChordSymbol) if c.pitches]
    if symbols:
        return "symbols", symbols
    written = [c for c in score.recurse().getElementsByClass(chord.Chord)
               if not isinstance(c, harmony.ChordSymbol) and len({p.name for p in c.pitches}) >= 3]
    return ("written", written) if written else ("none", [])


def name(c) -> str:
    """A chord's name as a lead sheet prints it: root, "m" for minor, "7" for a dominant seventh."""
    if isinstance(c, harmony.ChordSymbol):
        return c.figure
    root = c.root().name.replace("-", "b")
    return root + {"minor": "m", "diminished": "dim", "augmented": "aug"}.get(c.quality, "") + \
        ("7" if c.seventh is not None else "")


def facts(score, row: dict) -> dict:
    source, chords = explicit_chords(score)
    k = row_key(row)
    out = {"key": row.get("keySig"), "harmony": source}
    if source == "none":
        return {**out, "chords": None, "literalCFG": "unknown", "numerals": None, "primaryOnly": "unknown"}
    names = sorted({name(c).replace("-", "b") for c in chords})
    out |= {"chords": names, "literalCFG": set(names) <= LITERAL_CFG}
    if k is None:
        return {**out, "numerals": None, "primaryOnly": "unknown (the row gives no mode)"}
    numerals = sorted({roman.romanNumeralFromChord(chord.Chord(c.pitches), k).romanNumeralAlone
                       + ("7" if chord.Chord(c.pitches).seventh is not None else "") for c in chords})
    return {**out, "numerals": numerals, "primaryOnly": set(numerals) <= PRIMARY}


def main(ids: list[str]) -> None:
    rows = {r["id"]: r for r in json.loads((CONTENT / "catalog.json").read_text(encoding="utf-8"))}
    for item_id in ids:
        row = rows[item_id]
        print(item_id, json.dumps(facts(converter.parse(str(CONTENT / row["file"])), row), ensure_ascii=False))


if __name__ == "__main__":
    main(sys.argv[1:])
