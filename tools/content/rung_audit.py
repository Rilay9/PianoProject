#!/usr/bin/env python3
"""
The faults a rung can have that `validate.py` will never see.

`validate.py` answers "is this legal?" — every option exists, every level sits
inside the band, every concept is known. A rung can pass all of that and still
be bad in ways a learner notices in five seconds. This answers "is this worth
opening?", and it exists because every finding below was found by hand on
2026-09-18, in rungs that validated clean:

  * `rock.5` offered four options that were **one generated family with the
    parameter changed** — four cards, one thing to do.
  * `rock.4` owned none of its material: its four exercises were ones the same
    session had already put on core rungs `2.1`, `2.3` and `3.3`, so a learner
    who did the core path met them twice.
  * `rock.6`'s band spanned four levels, which the lesson page prints.

None of these is an error. They are judgements, so this **never fails a build**:
it prints and exits 0 unless `--strict` is passed. The point is that an agent
should not have to think of these checks; it should run this and read them.

Usage:
    python3 tools/content/rung_audit.py                 # everything
    python3 tools/content/rung_audit.py --rung rock.4   # one rung
    python3 tools/content/rung_audit.py --since-track rock-metal
    python3 tools/content/rung_audit.py --strict        # exit 1 on HIGH
"""
from __future__ import annotations

import argparse
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import DEFAULT_OUT, read_json  # noqa: E402

SEVERITY_ORDER = {"HIGH": 0, "MED": 1, "LOW": 2, "INFO": 3}

#: A rung whose exercises all come from one generated family is offering one
#: thing several times. Three is the floor `00` D21 sets, so three identical
#: things is the floor being met dishonestly.
MIN_FAMILIES_FOR = 3

#: A band the lesson page prints. Wider than this and the learner is told the
#: rung is somewhere between two grades, which is not useful on its own.
WIDE_BAND = 3.0


def family_of(item_id: str) -> str:
    """`exercise.open-voicing.c.sus2` → `exercise.open-voicing`."""
    parts = item_id.split(".")
    return ".".join(parts[:2]) if len(parts) >= 2 else item_id


def audit(out_dir: Path, only: str | None, only_track: str | None) -> list[tuple[str, str, str]]:
    catalog = read_json(out_dir / "catalog.json")
    curriculum = read_json(out_dir / "curriculum.json")
    assert isinstance(catalog, list) and isinstance(curriculum, dict)
    rows = {item["id"]: item for item in catalog}

    rungs: list[dict] = []
    for stage in curriculum.get("stages", []):
        for unit in stage.get("units", []):
            for lesson in unit.get("lessons", []):
                rungs.append({**lesson, "stage": stage.get("number"), "track": unit.get("track")})

    # Which rungs carry each option, so "borrowed" can be measured.
    carried: dict[str, list[str]] = defaultdict(list)
    for rung in rungs:
        for item_id in list(rung.get("exerciseOptions", [])) + list(rung.get("songOptions", [])):
            carried[item_id].append(rung["id"])

    found: list[tuple[str, str, str]] = []
    for rung in rungs:
        rid = rung["id"]
        if only and rid != only:
            continue
        if only_track and rung.get("track") != only_track:
            continue
        exercises = list(rung.get("exerciseOptions", []))
        songs = list(rung.get("songOptions", []))
        options = exercises + songs

        # 1. One family wearing several hats — but only when the rung is not
        #    *about* that family.
        #
        #    The first version of this flagged `4.1` for offering six scale
        #    exercises, which is what a rung called "Scales hands together" is
        #    supposed to do, and `technique.8` for twelve. A rung whose subject
        #    is the family is not padding; a rung that reaches for one family
        #    because it had nothing else is. The discriminator is whether the
        #    family's name appears in the rung's own title or concepts.
        families = {family_of(x) for x in exercises}
        subject = f"{rung.get('title', '')} {' '.join(rung.get('concepts', []))}".lower()
        if len(exercises) >= MIN_FAMILIES_FOR and len(families) == 1:
            family = next(iter(families))
            word = family.split(".")[-1].replace("-", " ")
            if word not in subject:
                found.append((
                    "HIGH", rid,
                    f"all {len(exercises)} exercises are one family ({family}), and the rung "
                    f"is not about {word} — one thing offered {len(exercises)} times",
                ))

        # 2. A rung that owns nothing.
        #
        #    Excluded: `practice`, `improv-compose` and `theory-ear`, which
        #    borrow on purpose — `02` Part D8a says the practice module's point
        #    is that the method gets applied to material from elsewhere, and the
        #    improvisation and theory rungs are song-optional by design. Core is
        #    excluded because it is the source everything else borrows from.
        borrows_by_design = rung.get("track") in {"practice", "improv-compose", "theory-ear", "core"}
        borrowed = [x for x in options if len(carried.get(x, [])) > 1]
        if options and not borrows_by_design and len(borrowed) == len(options):
            found.append((
                "HIGH", rid,
                "every option also appears on another rung — a learner who did those "
                "rungs is offered the same material again",
            ))
        elif options and not borrows_by_design and len(borrowed) >= max(1, int(len(options) * 0.8)):
            found.append((
                "MED", rid,
                f"{len(borrowed)} of {len(options)} options are shared with another rung",
            ))

        # 3. A band the lesson page prints and the learner cannot use.
        band = rung.get("levelBand") or []
        if len(band) == 2 and (band[1] - band[0]) > WIDE_BAND:
            found.append((
                "MED", rid,
                f"band spans {band[1] - band[0]:.1f} levels ({band[0]}–{band[1]}) — the "
                f"lesson page prints this, so say why in the prose or narrow it",
            ))

        # 4. A requirement held up by exactly one option is one deletion from failing.
        for need, value in (rung.get("requires") or {}).items():
            holders = []
            for item_id in options:
                notation = (rows.get(item_id) or {}).get("notation")
                if not notation:
                    continue
                if need == "chordSymbols" and bool(notation.get("chordCount", 0)) == bool(value):
                    holders.append(item_id)
                elif need == "meter" and any(s in notation.get("times", []) for s in value):
                    holders.append(item_id)
                elif need == "mode" and any(k.get("mode") == value for k in notation.get("keys", [])):
                    holders.append(item_id)
                elif need == "staves" and int(notation.get("staves", 1)) >= int(value):
                    holders.append(item_id)
            if len(holders) == 1:
                found.append((
                    "LOW", rid,
                    f"requires {need}={value!r} and only {holders[0]} satisfies it — "
                    f"removing that one option breaks the rung",
                ))

        # 5. A requirement asking for more runs than the rung offers (C5's
        #    requirements; validate.py refuses the same thing on every build).
        for requirement in rung.get("requirements") or []:
            if requirement.get("kind") != "runs":
                continue
            source = requirement.get("from")
            pool = exercises if source == "exercises" else songs if source == "songs" else exercises + songs
            if requirement.get("count", 0) > len(pool):
                found.append((
                    "HIGH", rid,
                    f"requires {requirement['count']} of its {source}, rung offers {len(pool)}",
                ))

        # 6. A tool naming an item the rung does not offer is caught by
        #    validate.py; a rung with no tools at all is only worth a note.
        if not rung.get("tools") and rung.get("track") not in {"core", None}:
            found.append((
                "INFO", rid,
                "names no mode — the app has duet, blind, rhythm-only, the ladder, "
                "Simon, the lab and free play, and this rung points at none of them",
            ))

    found.sort(key=lambda f: (SEVERITY_ORDER[f[0]], f[1]))
    return found


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dir", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--rung")
    parser.add_argument("--since-track", dest="track")
    parser.add_argument("--strict", action="store_true", help="exit 1 if anything is HIGH")
    args = parser.parse_args()

    found = audit(args.dir, args.rung, args.track)
    if not found:
        print("no findings")
        return
    for severity, rung, message in found:
        print(f"{severity:<6} {rung:<18} {message}")
    counts = defaultdict(int)
    for severity, _, _ in found:
        counts[severity] += 1
    print(
        "\n"
        + ", ".join(f"{counts[s]} {s}" for s in ("HIGH", "MED", "LOW", "INFO") if counts[s])
        + "\n\nThese are judgements, not errors. A rung can be legal and still not be "
        "worth opening; that is what this looks for."
    )
    if args.strict and counts["HIGH"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
