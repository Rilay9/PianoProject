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

Idempotent, and it was not: `units[existing] = unit` replaced the whole unit,
so every field added to these rungs *after* the first run was deleted by the
second. Running it on the curriculum as it stands cost `levelBand` and
`finder` on all five technique rungs — 131 lines — while printing "updated"
five times and reporting success. The docstring said it was safe, which is
what made it dangerous.

It now writes only the keys it owns and leaves the rest of the rung alone, so
the promise is true: run it twice and the second run changes nothing.

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
            "mordent", "ornamentation", "hanon", "two-hand-independence",
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
            "polyrhythm-2:3", "polyrhythm-3:2", "half-pedal", "melody-in-octaves",
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


#: Days a rung at each stage is reckoned to take, matching the other tracks.
DAYS_PER_STAGE: dict[int, int] = {4: 45, 5: 90, 6: 90, 7: 120, 8: 150}


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
                # Each rung needs the one below it. Left out of the first
                # version of this tool, which is how the technique track came
                # to be the only ladder in the curriculum with no order
                # written down — every other one chains every rung. The
                # lessons always said it: technique.5 opens "Stage 4 was about
                # getting the notes under the hand". Strict prerequisites are
                # opt-in (`00` D17) and this is the hint they show, so the cost
                # of the omission was a learner turning the setting on and
                # getting guidance on every ladder except this one.
                #
                # The first rung has none, as theory.3 and improv.3 have none:
                # a ladder's foot points at a core rung only where it shares
                # something with it, and technique.4 shares no exercise and no
                # concept with core 4.1.
                **({"prerequisites": [f"technique.{stage - 1}"]} if stage > min(UNITS) else {}),
                # Technique rungs have no repertoire of their own: the songs that
                # need this work live on the classical, jazz and ragtime rungs at
                # the same stage. `00` D21's three-alternatives rule is satisfied
                # by the exercises, which is exactly what `songOptional` is for.
                "songOptional": True,
                # What the plan screen prints beside the rung. Left out with
                # the prerequisites, so the technique ladder was the only part
                # of the plan showing no estimate at all.
                #
                # The figure is the one every other single-track rung at the
                # same stage carries — 45 days at stage 4, 90 at 5 and 6, 120
                # at 7, 150 at 8 — which five to seven of the seven or eight
                # rungs there agree on. Classical and ragtime run longer
                # because they are the repertoire tracks; this is a drill
                # track, like theory and blues and jazz.
                "estimatedDays": DAYS_PER_STAGE[stage],
                # The standard a run is judged at, and what completes the rung:
                # two of its exercises judged by it (C5's requirements, which
                # replaced exercisesRequired/songsRequired).
                "mastery": {
                    "minAccuracy": 0.9,
                    "minTempoPct": 0.8,
                },
                "requirements": [{"kind": "runs", "from": "exercises", "count": 2}],
            }
        ],
    }


def merge_unit(existing: dict, built: dict) -> dict:
    """
    The built unit's own keys, over the one already there.

    This function is the whole of the idempotence claim. Everything this tool
    knows how to write — the title, the concepts, the exercise list — is its to
    replace. Everything else on the rung was put there by somebody who knew
    something this tool does not: `levelBand` is measured from the options,
    `finder` is written for a learner going looking for a piece, and neither is
    derivable from the generated catalog. Overwriting the unit wholesale threw
    both away on every re-run.

    Nested one level deep, because the lesson has the same problem as the unit.
    """
    merged = dict(existing)
    for key, value in built.items():
        if key == "lessons":
            continue
        merged[key] = value

    old_lessons = {lesson.get("id"): lesson for lesson in existing.get("lessons", [])}
    lessons = []
    for lesson in built.get("lessons", []):
        kept = dict(old_lessons.get(lesson.get("id"), {}))
        fresh = dict(lesson)
        # `representative` picks by level band and round-robins by drill kind.
        # That is the right way to *start* a rung and the wrong way to keep one:
        # it cannot see what the rung teaches, so once the catalog grew it
        # replaced technique.5's mordent, crescendo and tied-across-the-bar
        # exercises — the three its lesson is written about — with a montuno, a
        # ii-V-I and a boogie, all in the band and none of them technique.
        #
        # So a rung that already names its exercises keeps them. This tool
        # exists to bring a rung into being; choosing which twelve of three
        # hundred to show is a judgement it does not have the information to
        # make, and its own docstring says so: "the concepts do the reaching;
        # the named options are what the screen shows first."
        if kept.get("exerciseOptions"):
            fresh.pop("exerciseOptions", None)
        # And its pieces: since 2026-09-15 the technique rungs carry études
        # (Lemoine, Duvernoy, Czerny) chosen by level from the archive, which
        # this tool knows nothing about. A rung that names songs keeps them.
        if kept.get("songOptions"):
            fresh.pop("songOptions", None)
        kept.update(fresh)
        lessons.append(kept)
    merged["lessons"] = lessons
    return merged


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
            units[existing] = merge_unit(units[existing], unit)
            action = "updated"
        write_json(path, data)
        print(f"  {action} {unit['id']} ({len(unit['lessons'][0]['exerciseOptions'])} options)")


if __name__ == "__main__":
    main()
