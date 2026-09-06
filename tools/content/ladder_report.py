"""
What is actually on each rung (replan §2.6).

`docs/02` Part D used to carry hand-written repertoire columns. They were a
wish: a list of pieces somebody thought belonged on a rung, maintained by hand,
and wrong the moment the catalog changed. **The catalog is the truth about
repertoire and Part D is a report of it** — so this generates the report, `02`
links to it, and `validate.py` fails the build when the committed copy is stale.

What stays authored in Part D is *focus*: what a rung is teaching and why, which
is pedagogy and does not come out of a database.

    python3 tools/content/ladder_report.py            # writes docs/generated/ladder.md
    python3 tools/content/ladder_report.py --check    # fails if the file is stale
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import read_json  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CONTENT = REPO_ROOT / "app" / "public" / "content"
DEFAULT_OUT = REPO_ROOT / "docs" / "generated" / "ladder.md"

#: docs/00 D21: three alternatives per rung.
OPTION_FLOOR = 3


def level_band(items: list[dict]) -> tuple[float, float] | None:
    """The lowest and highest level among a rung's options."""
    levels = [float(item["level"]) for item in items if item.get("level") is not None]
    return (min(levels), max(levels)) if levels else None


#: Tags that say an item is in the owner's build only (`00` D10a, D23).
PERSONAL_ONLY_TAGS = ("personal-build", "nc-personal-build")


def shippable(item: dict) -> bool:
    """
    Whether a public build may carry this file.

    False for a placeholder, and false for an item the owner's build bundles
    under `--personal` or `--allow-nc` — those have a file in his build and
    none in the deployed one, and the tag is what says so in both.
    """
    if not item.get("file"):
        return False
    return not any(tag in PERSONAL_ONLY_TAGS for tag in item.get("tags") or [])


def why_not_shipped(item: dict) -> str:
    """
    Why an item may not ship, said the same way in either build.

    The `importHint` cannot be used on its own: it is written by the strict
    build and is absent from the personal one, where the file is right there.
    `compositionStatus` and `source.license` are on the item in both, so the
    two reasons that depend on the flavour are read from those, and the hint is
    kept for the placeholders that are placeholders in every build.
    """
    status = item.get("compositionStatus")
    if status and status != "pd":
        return f"The composition is {status}; the owner's own build carries it (`00` D23)."
    licence = (item.get("source") or {}).get("license") or ""
    if "NC" in licence.upper().split("-") or "-NC" in licence.upper():
        return f"The edition is {licence}; the owner's own build carries it (`00` D10a)."
    return " ".join((item.get("importHint") or "").split())[:110]


def render(catalog: list[dict], curriculum: dict) -> str:
    by_id = {item["id"]: item for item in catalog}
    lines: list[str] = [
        "# The ladder, as it actually is",
        "",
        "**Generated — do not edit.** `python3 tools/content/ladder_report.py` writes this file",
        "and `validate.py` fails the build when it is stale. `docs/02` Part D describes what each",
        "rung is *for*; this says what is on it.",
        "",
        "Every row is one lesson. `exercises` and `songs` are the options the learner may choose",
        "between; the floor is three of each (`00` D21), and a rung marked *song-optional* is one",
        "where no song tests the skill, so the two lists are counted together instead.",
        "`level` is the range the rung's options actually span — a Stage 6 rung can hold a",
        "level-7 piece, because the easiest complete Joplin rag is a Grade 6 piece and the number",
        "is honest about that (replan §1.7). A ⚠ marks a rung under the floor.",
        "",
    ]

    tracks = {track["id"]: track for track in curriculum.get("tracks", [])}
    per_track: dict[str, list[tuple[int, dict, dict]]] = {}
    for stage in curriculum.get("stages", []):
        for unit in stage.get("units", []):
            for lesson in unit.get("lessons", []):
                per_track.setdefault(unit["track"], []).append((stage["number"], unit, lesson))

    for track_id in sorted(per_track, key=lambda t: (tracks.get(t, {}).get("startsAtStage", 99), t)):
        rungs = sorted(per_track[track_id], key=lambda row: (row[0], row[1]["id"]))
        meta = tracks.get(track_id, {})
        stages = sorted({stage for stage, _, _ in rungs})
        lines.append(f"## {meta.get('title', track_id)} (`{track_id}`)")
        lines.append("")
        lines.append(
            f"{len(rungs)} rung(s), stages {stages[0]}–{stages[-1]}."
            if stages
            else "No rungs."
        )
        lines.append("")
        lines.append("| stage | rung | exercises | songs | level | options |")
        lines.append("|---|---|---:|---:|---|---|")
        for stage_number, unit, lesson in rungs:
            exercises = [by_id[i] for i in lesson.get("exerciseOptions", []) if i in by_id]
            songs = [by_id[i] for i in lesson.get("songOptions", []) if i in by_id]
            band = level_band(exercises + songs)
            band_text = f"{band[0]:.1f}–{band[1]:.1f}" if band else "—"
            exempt = bool(lesson.get("optionsExempt"))
            optional = (
                " *(exempt)*" if exempt
                else " *(song-optional)*" if lesson.get("songOptional")
                else ""
            )
            # Stage 0's rungs are one placement test and one guided tour, and
            # inventing two more of each to satisfy a counter would be worse
            # than the counter (validate.thin_lesson_errors says the same).
            exercise_mark = "" if exempt or len(exercises) >= OPTION_FLOOR else " ⚠"
            song_mark = (
                ""
                if exempt or lesson.get("songOptional") or len(songs) >= OPTION_FLOOR
                else " ⚠"
            )
            names = ", ".join(
                f"{item['title']} ({float(item['level']):.1f})"
                for item in sorted(songs, key=lambda i: float(i["level"]))[:6]
            )
            if len(songs) > 6:
                names += f", … and {len(songs) - 6} more"
            lines.append(
                f"| {stage_number} | `{lesson['id']}`{optional} | {len(exercises)}{exercise_mark} "
                f"| {len(songs)}{song_mark} | {band_text} | {names or '—'} |"
            )
        lines.append("")

    # What the ladder wants and the library has not got. `02` Part D names these
    # in prose; the finder (P15) is what does something about them.
    # "Cannot be shipped", not "has no file in this build" — the same list
    # either way round. The owner's `--personal` build *does* carry these files
    # and the public one does not, and asking the question the other way made
    # this report describe whichever build last wrote it. One report is
    # committed and both builds are checked against it, so a report that
    # depended on the flavour meant the other flavour always failed validation:
    # `--personal` had done so since P14 (review C11).
    wanted = [item for item in catalog if item.get("type") == "song" and not shippable(item)]
    lines.append("## Wanted, and not bundled")
    lines.append("")
    lines.append(
        f"{len(wanted)} song(s) may not be shipped: the curriculum names them and the public "
        "build carries no file for them. Each carries an `importHint` saying what to do instead."
    )
    lines.append("")
    lines.append("| id | title | level | why |")
    lines.append("|---|---|---|---|")
    for item in sorted(wanted, key=lambda i: i["id"])[:80]:
        lines.append(
            f"| `{item['id']}` | {item['title']} | {float(item['level']):.1f} "
            f"| {why_not_shipped(item)} |"
        )
    if len(wanted) > 80:
        lines.append(f"| … | and {len(wanted) - 80} more | | |")
    lines.append("")
    return "\n".join(lines) + "\n"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--content", type=Path, default=DEFAULT_CONTENT)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--check", action="store_true", help="fail if the committed file is stale")
    args = parser.parse_args(argv)

    catalog = read_json(args.content / "catalog.json")
    curriculum = read_json(args.content / "curriculum.json")
    assert isinstance(catalog, list) and isinstance(curriculum, dict)
    text = render(catalog, curriculum)

    if args.check:
        if not args.out.is_file():
            print(f"{args.out} does not exist; run tools/content/ladder_report.py", file=sys.stderr)
            return 1
        current = args.out.read_text(encoding="utf-8")
        if current != text:
            print(
                f"{args.out} is stale — the catalog has changed since it was written. "
                "Run `python3 tools/content/ladder_report.py` and commit the result.",
                file=sys.stderr,
            )
            return 1
        print(f"{args.out} is up to date")
        return 0

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(text, encoding="utf-8")
    print(f"wrote {args.out} ({len(text.splitlines())} lines)")
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
