#!/usr/bin/env python3
"""
What a MusicXML file actually says.

One copy, used by two callers: `build.py`'s `attach_notation`, which writes this
onto every catalog row, and `archive_notation.py`, which reads it straight out
of the 37,261-score archive before anything is quarried. A second copy of a
parser is a second thing that can drift, and this session already shipped one
duplicated list (the lab preset ids) that needed a test to hold it together.

Everything here is a *fact about the file*. No inference, no title, no genre —
those are the fields that were wrong.
"""
from __future__ import annotations

import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

#: Semitones above C for each letter name.
STEP_SEMITONES = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def read_musicxml(path: Path) -> str | None:
    """The score as XML text, out of a `.mxl` container where necessary."""
    if path.suffix.lower() in {".musicxml", ".xml"}:
        try:
            return path.read_text(encoding="utf-8", errors="replace")
        except OSError:
            return None
    try:
        with zipfile.ZipFile(path) as bundle:
            # The container names the root file; falling back to the largest
            # member is for the handful of archives that omit it.
            name = None
            if "META-INF/container.xml" in bundle.namelist():
                root = ET.fromstring(bundle.read("META-INF/container.xml"))
                el = root.find(".//{*}rootfile")
                if el is not None:
                    name = el.get("full-path")
            if name is None or name not in bundle.namelist():
                scores = [
                    n for n in bundle.namelist()
                    if n.lower().endswith((".musicxml", ".xml")) and "container" not in n
                ]
                if not scores:
                    return None
                name = max(scores, key=lambda n: bundle.getinfo(n).file_size)
            return bundle.read(name).decode("utf-8", errors="replace")
    except (zipfile.BadZipFile, KeyError, ET.ParseError, OSError):
        return None


def describe(text: str) -> dict:
    """
    Key signatures, metres, bars, staves, chord symbols and the final bass.

    **`findall`, never `iter`.** `ElementTree.iter()` does not parse the `{*}`
    namespace wildcard — it looks for a tag literally named `{*}time` — so an
    earlier version of this returned empty lists for every field while
    reporting success on 1,975 rows. Only `bars` was right, because it happened
    to use `findall`, and that was enough to make the output look plausible.
    """
    root = ET.fromstring(text)
    parts = root.findall("{*}part")
    # Bars are counted inside **one** part. Counting `<measure>` across the
    # document multiplies by the number of parts, which quietly doubles the
    # length of every grand-staff score written as two parts.
    bars = max((len(p.findall("{*}measure")) for p in parts), default=0)

    keys: list[dict] = []
    for el in root.findall(".//{*}key"):
        fifths = el.findtext("{*}fifths")
        if fifths is None:
            continue
        pair = {"fifths": int(fifths), "mode": el.findtext("{*}mode") or None}
        if pair not in keys:
            keys.append(pair)

    times: list[str] = []
    for el in root.findall(".//{*}time"):
        beats, kind = el.findtext("{*}beats"), el.findtext("{*}beat-type")
        if beats and kind and f"{beats}/{kind}" not in times:
            times.append(f"{beats}/{kind}")

    chords: list[str] = []
    for el in root.findall(".//{*}harmony"):
        step = el.findtext("{*}root/{*}root-step") or "?"
        alter = el.findtext("{*}root/{*}root-alter")
        kind_el = el.find("{*}kind")
        kind = (kind_el.get("text") if kind_el is not None else None) or (
            kind_el.text if kind_el is not None else ""
        )
        accidental = {"1": "#", "-1": "b"}.get(alter or "", "")
        chords.append(f"{step}{accidental}{'' if kind == 'major' else kind}")

    # What the piece ends on. `<mode>` is absent from most files, so a key
    # signature alone cannot tell A minor from C major; the bass of the final
    # sonority can. A fact, not a claim about the key.
    final_bass = None
    for part in parts:
        measures = part.findall("{*}measure")
        if not measures:
            continue
        for el in measures[-1].findall(".//{*}pitch"):
            step = el.findtext("{*}step")
            if step not in STEP_SEMITONES:
                continue
            alter = int(float(el.findtext("{*}alter") or 0))
            octave = int(el.findtext("{*}octave") or 4)
            midi = (octave + 1) * 12 + STEP_SEMITONES[step] + alter
            if final_bass is None or midi < final_bass:
                final_bass = midi

    staves = max((int(el.text or 1) for el in root.findall(".//{*}staves")), default=1)
    words = " ".join(el.text or "" for el in root.findall(".//{*}words")).lower()
    return {
        "bars": bars,
        "staves": max(staves, len(parts)),
        "keys": keys,
        "times": times,
        "chordCount": len(chords),
        "chords": sorted(set(chords))[:24],
        "swungMark": "swing" in words or "shuffle" in words,
        "finalBass": None if final_bass is None else final_bass % 12,
    }


MAJOR = ["C", "G", "D", "A", "E", "B", "F#", "C#"]
FLAT = ["C", "F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb"]
RELATIVE_MINOR = {
    "C": "Am", "G": "Em", "D": "Bm", "A": "F#m", "E": "C#m", "B": "G#m",
    "F#": "D#m", "C#": "A#m", "F": "Dm", "Bb": "Gm", "Eb": "Cm", "Ab": "Fm",
    "Db": "Bbm", "Gb": "Ebm", "Cb": "Abm",
}


def key_name(notation: dict) -> str:
    """
    The key in words, with a `?` where the file did not say.

    A trailing `?` means the mode was inferred from what the music ends on
    rather than read from a `<mode>` tag. Worth printing, because that is the
    difference between a fact and a good guess.
    """
    keys = notation.get("keys") or []
    if not keys:
        return "?"
    first = keys[0]
    fifths = int(first.get("fifths", 0))
    major = MAJOR[fifths] if fifths >= 0 else FLAT[-fifths]
    if first.get("mode") == "minor":
        return RELATIVE_MINOR.get(major, major + "m")
    if first.get("mode") == "major":
        return major
    relative = (((7 * fifths) % 12) + 9) % 12
    if notation.get("finalBass") == relative:
        return RELATIVE_MINOR.get(major, major + "m") + "?"
    return major + "?"
