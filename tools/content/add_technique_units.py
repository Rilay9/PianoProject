#!/usr/bin/env python3
"""
Adds the technique units the generated families need (P12a).

`02` Part E is a technique syllabus and the curriculum never had a track for
it: the units that exist teach repertoire skills — voicing a Romantic melody,
comping a blues — and name a handful of exercises each. Everything else the
generator produced was reachable only through the Library, which is what
`validate.py`'s orphan check counts. Before this ran, 428 of 774 generated
exercises were reachable from no lesson and no concept, including `scale` and
`arpeggio` themselves.

So the technique track gets a rung per stage from 4 to 8, each one teaching the
concepts its families train and naming a representative handful. The exercise
lists are *representative and not exhaustive* on purpose: a rung offering three
hundred scales is not a rung. The concepts do the reaching; the named options
are what the screen shows first.

Idempotent: run it twice and the second run changes nothing.

Usage:
    python3 tools/content/add_technique_units.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import CONTENT_SRC, read_json, write_json  # noqa: E402

CURRICULUM = CONTENT_SRC / "curriculum"
LESSONS = CONTENT_SRC / "lessons"

#: One rung per stage: the concepts it teaches, and how many exercises to name.
#:
#: The concepts are every `concepts[]` value the families at that level carry,
#: minus the per-key tags (`E-major`) and the `hands:` tags, which are facets
#: rather than skills.
UNITS: dict[int, dict] = {
    4: {
        "id": "technique.4.1",
        "title": "Technique: the scales and shapes everything else is built from",
        "lesson_id": "technique.4",
        "lesson_title": "Scales, arpeggios and the two ways to touch a key",
        "concepts": [
            "scale", "arpeggio", "five-finger", "similar", "contrary", "chromatic",
            "semitones", "coordination", "finger-independence", "inversions",
            "articulation", "staccato", "legato", "note-length",
        ],
        "levels": (4.0, 5.0),
    },
    5: {
        "id": "technique.5.1",
        "title": "Technique: evenness, independence and the shape of a line",
        "lesson_id": "technique.5",
        "lesson_title": "Repeated notes, two hands at different speeds, and a line that travels",
        "concepts": [
            "repeated-notes", "evenness", "hand-independence", "polyrhythm-2:1",
            "dynamics", "shaping", "crescendo", "diminuendo", "phrasing",
            "rhythm", "syncopation", "tied-across-bar", "odd-meter", "meter-5-4",
            "mordent", "ornamentation", "hanon",
        ],
        "levels": (5.0, 6.0),
    },
    6: {
        "id": "technique.6.1",
        "title": "Technique: sevenths, rotation and making one note sing",
        "lesson_id": "technique.6",
        "lesson_title": "Seventh shapes, the rotating wrist, and voicing",
        "concepts": [
            "seventh-chord", "broken-chord", "rotation", "alberti", "wrist",
            "trill", "voicing", "melody-projection", "balance", "tone",
            "sustain-pedal", "held-melody", "CC64", "legato-pedalling",
            "polyrhythm-3:1", "meter-7-8",
        ],
        "levels": (6.0, 7.0),
    },
    7: {
        "id": "technique.7.1",
        "title": "Technique: double notes, octaves and the half pedal",
        "lesson_id": "technique.7",
        "lesson_title": "Two notes at once in one hand, octaves, and a pedal that is not a switch",
        "concepts": [
            "double-notes", "scale-in-3rds", "scale-in-6ths", "octaves",
            "octave-scale", "broken-octaves", "tremolo", "forearm",
            "polyrhythm-2:3", "polyrhythm-3:2", "half-pedal",
        ],
        "levels": (7.0, 8.0),
    },
    8: {
        "id": "technique.8.1",
        "title": "Technique: speed, and what it costs",
        "lesson_id": "technique.8",
        "lesson_title": "Four octaves in sixteenths, and why the metronome comes last",
        "concepts": ["scale", "velocity", "endurance"],
        "levels": (8.0, 9.0),
    },
}

#: How many exercises each rung names. Enough to satisfy the three-alternatives
#: rule several times over and few enough to read.
NAMED_PER_UNIT = 12


def representative(catalog: list[dict], low: float, high: float) -> list[str]:
    """
    A spread of exercises inside a level band, one per family before seconds.

    Round-robin by family rather than the first N by id, or a rung would offer
    twelve scales in adjacent keys and call it choice.
    """
    by_family: dict[str, list[str]] = {}
    for item in sorted(catalog, key=lambda entry: entry["id"]):
        if item.get("type") != "exercise":
            continue
        level = float(item.get("level", 0))
        if not (low <= level < high):
            continue
        kind = (item.get("drill") or {}).get("kind", "other")
        by_family.setdefault(kind, []).append(item["id"])

    picked: list[str] = []
    round_index = 0
    while len(picked) < NAMED_PER_UNIT and by_family:
        added = False
        for kind in sorted(by_family):
            options = by_family[kind]
            if round_index < len(options):
                picked.append(options[round_index])
                added = True
                if len(picked) >= NAMED_PER_UNIT:
                    break
        if not added:
            break
        round_index += 1
    return picked


def build_unit(stage: int, catalog: list[dict]) -> dict:
    spec = UNITS[stage]
    low, high = spec["levels"]
    options = representative(catalog, low, high)
    return {
        "id": spec["id"],
        "title": spec["title"],
        "track": "technique",
        "lessons": [
            {
                "id": spec["lesson_id"],
                "title": spec["lesson_title"],
                "concepts": spec["concepts"],
                "textFile": f"lessons/{spec['lesson_id']}.md",
                "exerciseOptions": options,
                "songOptions": [],
                # Technique rungs have no repertoire of their own: the songs that
                # need this work live on the classical, jazz and ragtime rungs at
                # the same stage. `00` D21's three-alternatives rule is satisfied
                # by the exercises, which is exactly what `songOptional` is for.
                "songOptional": True,
                "mastery": {
                    "exercisesRequired": 2,
                    "songsRequired": 0,
                    "minAccuracy": 0.9,
                    "minTempoPct": 0.8,
                },
            }
        ],
    }


def main() -> None:
    catalog_path = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    if catalog_path is None:
        print("usage: add_technique_units.py <generated-catalog.json>", file=sys.stderr)
        raise SystemExit(2)
    catalog = read_json(catalog_path)
    assert isinstance(catalog, list)

    for stage in sorted(UNITS):
        path = CURRICULUM / f"stage-{stage}.json"
        data = read_json(path)
        assert isinstance(data, dict)
        stage_obj = data["stages"][0]
        units = stage_obj["units"]
        unit = build_unit(stage, catalog)
        existing = next((i for i, u in enumerate(units) if u["id"] == unit["id"]), None)
        if existing is None:
            units.append(unit)
            action = "added"
        else:
            units[existing] = unit
            action = "updated"
        write_json(path, data)
        print(f"  {action} {unit['id']} ({len(unit['lessons'][0]['exerciseOptions'])} options)")


if __name__ == "__main__":
    main()
