#!/usr/bin/env python3
"""
Validates a built content directory.

docs/03-content-pipeline.md §3 step 5. The JSON Schemas answer "is this the
right shape?"; the checks after them answer the questions a schema cannot:

  * does every file a catalog item points at actually exist?
  * does every curriculum option point at an item that exists?
  * does every rung offer the three alternatives docs/00 D21 promises?
  * does every `alternatives[]` reference resolve?
  * is every item's licence stated, and is it one we may redistribute?
  * is the duration plausible — between five seconds and twenty minutes?
  * are ids unique, and does every `variantOf` name a real parent?

A failure here stops the build, because each of these produces a library entry
that looks fine and breaks when the learner opens it.

Usage:
    python3 tools/content/validate.py [--dir app/public/content] [--strict-license]
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

try:
    import jsonschema
except ImportError:  # pragma: no cover
    print(
        "error: the 'jsonschema' package is required (pip install -r "
        "tools/content/requirements.txt)",
        file=sys.stderr,
    )
    sys.exit(2)

from common import CONTENT_SRC, DEFAULT_OUT, load_item_labels, load_tracks, read_front_matter  # noqa: E402
from licensing import NC_PERSONAL_TAG, Verdict, license_verdict  # noqa: E402
from truncation_scan import scan_dir  # noqa: E402
import finder  # noqa: E402

#: docs/03 §3 step 5: "duration sanity (5 s – 20 min)".
MIN_DURATION_SEC = 5
MAX_DURATION_SEC = 20 * 60

#: docs/00 D21 / docs/02 Part G: every rung offers at least this many alternatives, so a
#: learner who does not want today's suggestion has somewhere to go. Counted per field
#: normally; on a `songOptional` unit the songs are not required and the two lists are
#: counted together, because there the second pass may be another exercise.
MIN_OPTIONS = 3


def load(path: Path) -> object:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def validate_schema(name: str, data_path: Path, schema_path: Path) -> list[str]:
    if not data_path.exists():
        return [f"{name}: {data_path} does not exist"]
    if not schema_path.exists():
        return [f"{name}: schema {schema_path} does not exist"]
    validator = jsonschema.Draft202012Validator(load(schema_path))
    return [
        f"{name}: {'/'.join(str(p) for p in err.path) or '<root>'}: {err.message}"
        for err in sorted(validator.iter_errors(load(data_path)), key=lambda e: list(e.path))
    ]


def validate_tracks(
    catalog: list, curriculum: dict, tracks: tuple[str, ...], labels: tuple[str, ...] = ()
) -> list[str]:
    """
    replan §1.8: every track id must be one `content/curriculum/00-tracks.json` defines.

    This is the check that replaces the schema's `tracks` enum. An enum in the
    schema was a second list, and a second list drifts — it did, twice.

    A catalog item may carry a module id or an item label; a **unit** may only
    carry a module id, because a unit is a rung on a ladder and a label has no
    ladder. That asymmetry is the point of keeping the two lists apart.
    """
    if not tracks:
        return ["tracks: content/curriculum/00-tracks.json defines no tracks"]
    known = set(tracks) | set(labels)
    errors: list[str] = []
    for item in catalog:
        for track in item.get("tracks") or []:
            if track not in known:
                errors.append(
                    f"{item['id']}: unknown track {track!r} "
                    f"(not in content/curriculum/00-tracks.json)"
                )
    for stage in curriculum.get("stages", []):
        for unit in stage.get("units", []):
            track = unit.get("track")
            if track and track not in set(tracks):
                hint = (
                    " — that is an itemLabel, which has no units"
                    if track in set(labels)
                    else " (not in content/curriculum/00-tracks.json)"
                )
                errors.append(f"unit {unit['id']}: unknown track {track!r}{hint}")
    return errors


def orphan_exercises(catalog: list, curriculum: dict) -> list[str]:
    """
    Exercises reachable from no lesson and no concept (replan §7.5).

    An orphan is not broken — it renders, it validates, it sits in the Library
    — it is simply unreachable by anyone following the plan, which makes it
    invisible work. P11 reported them; **P12a fails on them**, now that the
    technique rungs at stages 4-8 give every generated family a home. It was
    428 of 774 generated exercises before those rungs existed, including
    `scale` and `arpeggio` themselves, which no lesson had ever named as a
    concept.
    """
    referenced: set[str] = set()
    taught: set[str] = set()
    for stage in curriculum.get("stages", []):
        for unit in stage.get("units", []):
            for lesson in unit.get("lessons", []):
                referenced.update(lesson.get("exerciseOptions", []))
                referenced.update(lesson.get("songOptions", []))
                taught.update(lesson.get("concepts", []))
    out: list[str] = []
    for item in catalog:
        if item.get("type") != "exercise" or item["id"] in referenced:
            continue
        if any(concept in taught for concept in item.get("concepts") or []):
            continue
        out.append(item["id"])
    return sorted(out)


def estimated_by_stage(catalog: list) -> dict[int, tuple[int, int]]:
    """`{stage: (estimated, total)}` — replan §1.4 asks for this every run."""
    counts: dict[int, list[int]] = {}
    for item in catalog:
        stage = int(item.get("level", 0))
        bucket = counts.setdefault(stage, [0, 0])
        bucket[1] += 1
        if item.get("levelSource") == "estimated":
            bucket[0] += 1
    return {stage: (values[0], values[1]) for stage, values in sorted(counts.items())}


def exercises_by_level(catalog: list) -> dict[int, int]:
    """
    `{stage: exercises}` — the distribution P12a rebuilt and P12b added to.

    Exercises only, and by whole level: the point of the number is whether
    every rung of the ladder has generated material under it, and a stage whose
    only entries are songs has nothing to practise on.
    """
    counts: dict[int, int] = {}
    for item in catalog:
        if item.get("type") != "exercise":
            continue
        stage = int(item.get("level", 0))
        counts[stage] = counts.get(stage, 0) + 1
    return dict(sorted(counts.items()))


#: Tag on an item whose *composition* is not public domain (docs/00 D23).
#: The mirror of NC_PERSONAL_TAG, which is about the edition.
PERSONAL_BUILD_TAG = "personal-build"


def validate_catalog(
    catalog: list, content_dir: Path, strict_license: bool, allow_nc: bool = False,
    personal: bool = False,
) -> list[str]:
    errors: list[str] = []
    ids = [item["id"] for item in catalog]
    duplicates = sorted({i for i in ids if ids.count(i) > 1})
    for duplicate in duplicates:
        errors.append(f"catalog: duplicate id {duplicate}")

    known = set(ids)
    for item in catalog:
        item_id = item["id"]
        file_ref = item.get("file")
        if file_ref:
            if not (content_dir / file_ref).exists():
                errors.append(f"{item_id}: file {file_ref} does not exist")
        elif not item.get("importHint") and item.get("type") != "drill":
            errors.append(f"{item_id}: no file and no importHint")

        parent = item.get("variantOf")
        if parent and parent not in known:
            errors.append(f"{item_id}: variantOf {parent} is not in the catalog")

        for alternative in item.get("alternatives") or []:
            if alternative not in known:
                errors.append(f"{item_id}: alternatives names {alternative}, which is not in the catalog")
            elif alternative == item_id:
                errors.append(f"{item_id}: alternatives lists the item itself")

        licence = (item.get("source") or {}).get("license", "")
        if not licence:
            errors.append(f"{item_id}: no licence")
        elif strict_license and file_ref:
            # Only what is actually shipped has to be redistributable. An item
            # with no file ships nothing: a runtime-generated drill, or an
            # import placeholder for a copyrighted song whose licence line
            # exists precisely to say it may not be bundled (docs/02 Part D8).
            decision = license_verdict(licence, source=item_id, allow_nc=allow_nc)
            if decision.verdict is not Verdict.BUNDLE:
                errors.append(f"{item_id}: licence {licence!r} — {decision.reason}")
            if PERSONAL_BUILD_TAG in (item.get("tags") or []):
                # The edition may be redistributable and the *composition* not.
                # This is the check the Pages deploy exists to make: a quarried
                # file whose composer died in 1987 is bundled in the owner's
                # build and must never reach a public URL (docs/00 D23).
                errors.append(
                    f"{item_id}: tagged {PERSONAL_BUILD_TAG} — its composition is not public "
                    "domain, so it cannot ship in a strict build (docs/00 D23)"
                )

        duration = item.get("durationSec")
        if duration is not None and not (MIN_DURATION_SEC <= duration <= MAX_DURATION_SEC):
            errors.append(
                f"{item_id}: duration {duration}s outside "
                f"{MIN_DURATION_SEC}–{MAX_DURATION_SEC}s"
            )
    return errors


def validate_curriculum(curriculum: dict, catalog: list, min_options: int = MIN_OPTIONS) -> list[str]:
    errors: list[str] = []
    known = {item["id"] for item in catalog}
    tracks = {track["id"] for track in curriculum.get("tracks", [])}
    for stage in curriculum.get("stages", []):
        for unit in stage.get("units", []):
            if unit.get("track") and unit["track"] not in tracks:
                errors.append(f"unit {unit['id']}: unknown track {unit['track']}")
            for lesson in unit.get("lessons", []):
                exercises = lesson.get("exerciseOptions", [])
                songs = lesson.get("songOptions", [])
                for field, options in (("exerciseOptions", exercises), ("songOptions", songs)):
                    for option in options:
                        if option not in known:
                            errors.append(
                                f"lesson {lesson['id']}: {field} references unknown item {option}"
                            )
                    if len(options) != len(set(options)):
                        errors.append(f"lesson {lesson['id']}: {field} repeats an item")
                errors += thin_lesson_errors(lesson, exercises, songs, min_options)
                errors += level_band_errors(lesson, exercises + songs, catalog)
    return errors


def stale_ladder_report(catalog: list, curriculum: dict) -> list[str]:
    """
    replan §2.6: the committed ladder report has to match the catalog.

    Part D is a *report* of what is on each rung, and a generated report that
    nobody regenerates is exactly the hand-written table it replaced. So the
    build fails when it drifts, which is the same mechanism a formatted-file
    check uses.

    A missing report is not an error: the file is generated, and a checkout
    that has not run the generator yet should not fail for it.
    """
    from ladder_report import DEFAULT_OUT, render

    if not DEFAULT_OUT.is_file():
        return []
    if DEFAULT_OUT.read_text(encoding="utf-8") == render(catalog, curriculum):
        return []
    return [
        f"{DEFAULT_OUT.relative_to(CONTENT_SRC.parent)} is stale — the catalog has changed "
        "since it was written. Run `python3 tools/content/ladder_report.py` and commit it "
        "(replan §2.6)."
    ]


def level_band_errors(lesson: dict, options: list, catalog: list) -> list[str]:
    """
    replan §1.7: a rung states the level range it holds, and it has to be true.

    `level` is global difficulty and a rung is an order within a track, so the
    two are allowed to disagree — a Stage 6 rung holding a level-7 piece is the
    honest case, not a mistake. What is not allowed is the rung *claiming* a
    band its own options fall outside, because the lesson page prints that band
    to the learner.
    """
    band = lesson.get("levelBand")
    if not band:
        return []
    low, high = float(band[0]), float(band[1])
    levels = {item["id"]: float(item["level"]) for item in catalog if item.get("level") is not None}
    out: list[str] = []
    for option in options:
        level = levels.get(option)
        if level is None:
            continue
        if not (low - 1e-9 <= level <= high + 1e-9):
            out.append(
                f"lesson {lesson['id']}: {option} is level {level:g}, outside the rung's "
                f"stated band {low:g}–{high:g} (replan §1.7)"
            )
    return out


def thin_lesson_errors(lesson: dict, exercises: list, songs: list, min_options: int) -> list[str]:
    """
    docs/00 D21: three alternatives per rung, checked rather than trusted.

    A lesson that requires no songs at all — Stage 0's checklists, the theory and
    improvisation rungs — is exempt from the song count but not from the exercise one.
    """
    lesson_id = lesson.get("id", "?")
    if lesson.get("optionsExempt"):
        # Orientation lessons: there is one placement test and one guided tour, and
        # inventing two more to satisfy a counter would be worse than the counter.
        return []
    required_songs = (lesson.get("mastery") or {}).get("songsRequired", 1)
    out: list[str] = []
    if len(exercises) < min_options:
        out.append(
            f"lesson {lesson_id}: {len(exercises)} exercise option(s), needs {min_options} "
            f"(docs/00 D21)"
        )
    if lesson.get("songOptional"):
        total = len(exercises) + len(songs)
        if total < min_options:
            out.append(
                f"lesson {lesson_id}: song-optional but only {total} option(s) in total, "
                f"needs {min_options} (docs/00 D21)"
            )
    elif required_songs and len(songs) < min_options:
        out.append(
            f"lesson {lesson_id}: {len(songs)} song option(s), needs {min_options} — or set "
            f"songOptional if no song tests this skill (docs/00 D21)"
        )
    return out



#: Words that, next to a copyrighted title, would be asking somebody to fetch a
#: transcription off a website — the one thing `docs/00` D18 forbids. The
#: prompt is allowed to *say* that copyrighted music is fine to suggest; it is
#: not allowed to ask for it to be downloaded.
DOWNLOAD_WORDS = ("download", "free pdf", "torrent", "for free")


def finder_errors(curriculum: dict) -> list[str]:
    """
    replan §4.1: the generated prompts have to be usable and honest.

    Four rules, and each one exists because the opposite is easy to ship by
    accident:

    - **Length.** A prompt nobody can paste is a prompt nobody uses.
    - **Every constraint survives.** The author writes `constraints`; the
      generator builds a sentence from them. If a wording change ever drops
      one, the rung starts asking for the wrong music and nothing would say so.
    - **The copyright sentence is present.** `00` D18 is stated by the prompt
      rather than broken by it, and a prompt that lost the sentence is a prompt
      that quietly stopped saying where the owner stands.
    - **Nothing asks for a download.** The app never fetches a copyrighted
      transcription and never tells anyone else to.
    """
    errors: list[str] = []

    def check(where: str, block: dict) -> None:
        prompt = block.get("chatPrompt") or ""
        query = block.get("searchQuery") or ""
        if not prompt or not query:
            errors.append(f"{where}: finder has no generated prompt — run the build")
            return
        if len(prompt) > finder.MAX_CHAT_PROMPT:
            errors.append(
                f"{where}: chat prompt is {len(prompt)} characters, over the "
                f"{finder.MAX_CHAT_PROMPT} limit"
            )
        lowered = prompt.lower()
        for constraint in block.get("constraints", []):
            if constraint.lower() not in lowered:
                errors.append(f"{where}: constraint {constraint!r} is missing from the chat prompt")
        if finder.COPYRIGHT_MARKER not in lowered:
            errors.append(f"{where}: chat prompt has lost the docs/00 D18 copyright sentence")
        for word in DOWNLOAD_WORDS:
            if word in lowered:
                errors.append(
                    f"{where}: chat prompt says {word!r} — docs/00 D18 forbids asking for a "
                    "copyrighted transcription to be downloaded"
                )

    for stage in curriculum.get("stages", []):
        for unit in stage.get("units", []):
            for lesson in unit.get("lessons", []):
                block = lesson.get("finder")
                if block:
                    check(f"lesson {lesson['id']}", block)
                elif not lesson.get("optionsExempt"):
                    errors.append(f"lesson {lesson['id']}: no finder, and the rung is not exempt")

    for concept in curriculum.get("concepts", []):
        block = concept.get("finder")
        if block:
            check(f"concept {concept['id']}", block)
        elif not concept.get("appFeature"):
            errors.append(f"concept {concept['id']}: no finder and not marked appFeature")
    return errors


#: The four headings every tips file has, in this order (replan §6).
TIP_HEADINGS = (
    "What it's for",
    "How to practise it",
    "Common mistake",
    "How you'll know you've got it",
)

#: A tips file longer than this has stopped being a tip.
MAX_TIP_WORDS = 250

#: Where the runtime drill kinds are declared. Read, never copied: the list
#: grew from twelve to nineteen in P12b, and a copy here would have gone stale
#: without anything noticing.
DRILL_KINDS_FILE = CONTENT_SRC.parent / "app" / "src" / "engine" / "drills" / "fromCatalog.ts"


def runtime_drill_kinds(path: Path = DRILL_KINDS_FILE) -> list[str]:
    """The `RUNTIME_DRILL_KINDS` array, parsed out of the TypeScript."""
    if not path.is_file():
        return []
    text = path.read_text(encoding="utf-8")
    match = re.search(r"RUNTIME_DRILL_KINDS[^=]*=\s*\[(.*?)\]", text, re.S)
    if not match:
        return []
    return re.findall(r"'([^']+)'", match.group(1))


def tip_errors(catalog: list, tips_dir: Path) -> list[str]:
    """
    replan §6: every drill kind explains itself, in the same four sections.

    A drill that only says "wrong, again" teaches the thing it measures and
    nothing else. The four headings are fixed so that the advice is always the
    same shape — what it is for, how to practise it, the mistake, and how you
    know you are done — and so that a file that drifted into an essay fails
    rather than shipping.
    """
    errors: list[str] = []
    kinds = runtime_drill_kinds()
    if not kinds:
        return ["could not read RUNTIME_DRILL_KINDS — the tips check cannot run"]
    if not tips_dir.is_dir():
        return [f"{tips_dir} does not exist: every drill kind needs a tips file (replan §6)"]

    # Every parameter key any drill in the catalog actually carries. A `when:`
    # naming something else would silently never match.
    known_params: set[str] = set()
    for item in catalog:
        drill = item.get("drill") or {}
        known_params.update((drill.get("params") or {}).keys())

    files = sorted(tips_dir.glob("*.md"))
    by_kind: dict[str, list[Path]] = {}
    for path in files:
        meta, body = read_front_matter(path)
        kind = str(meta.get("kind") or "")
        if not kind:
            errors.append(f"tips/{path.name}: no `kind` in the front matter")
            continue
        by_kind.setdefault(kind, []).append(path)

        headings = re.findall(r"^##\s+(.*?)\s*$", body, re.M)
        if headings != list(TIP_HEADINGS):
            errors.append(
                f"tips/{path.name}: headings are {headings!r}; they must be exactly "
                f"{list(TIP_HEADINGS)!r} in that order"
            )
        words = len(body.split())
        if words > MAX_TIP_WORDS:
            errors.append(f"tips/{path.name}: {words} words, over the {MAX_TIP_WORDS} limit")

        stem = path.stem
        when = meta.get("when") or {}
        if stem == kind:
            if when:
                errors.append(f"tips/{path.name}: the default file for a kind must have no `when:`")
        elif stem.startswith(f"{kind}."):
            if not when:
                errors.append(f"tips/{path.name}: a variant needs a `when:` block to be chosen by")
            for key in when:
                if key not in known_params:
                    errors.append(
                        f"tips/{path.name}: `when: {key}` is not a drill parameter any catalog "
                        "item carries, so this variant can never be chosen"
                    )
        else:
            errors.append(f"tips/{path.name}: the filename does not start with its kind {kind!r}")

    for kind in kinds:
        if not any(path.stem == kind for path in by_kind.get(kind, [])):
            errors.append(f"drill kind {kind!r} has no tips file (content/tips/{kind}.md)")
    return errors


#: Where the render check records what it measured about each item.
RENDER_REPORT = CONTENT_SRC.parents[0] / "build" / "render-report.json"


def section_errors(catalog: list, report_path: Path = RENDER_REPORT) -> list[str]:
    """
    replan/`04` §5: a named section has to name bars the piece actually has.

    Bars are 1-based positions in the printed score, so the bound is
    `sourceMeasures` from the render report — the *printed* count. Checking
    against the unrolled count instead would pass a section that runs past the
    last page of a piece with a repeat, which is exactly the mistake worth
    catching: it produces a loop that silently ends early.

    Without a render report the check reports what it cannot do rather than
    passing quietly: a rule that disappears when its input is missing is a rule
    that stops working the day somebody deletes `build/`.
    """
    errors: list[str] = []
    with_sections = [
        item for item in catalog if (item.get("teaching") or {}).get("sections")
    ]
    if not with_sections:
        return errors
    if not report_path.is_file():
        return [
            f"{len(with_sections)} item(s) carry named sections but {report_path.name} is "
            "missing, so their bar numbers cannot be checked — run the render check"
        ]
    report = json.loads(report_path.read_text(encoding="utf-8"))
    printed = {
        entry["id"]: entry.get("sourceMeasures")
        for entry in report.get("items", [])
        if entry.get("ok") is not False
    }
    for item in with_sections:
        bars = printed.get(item["id"])
        sections = (item.get("teaching") or {})["sections"]
        if bars is None:
            errors.append(
                f"{item['id']}: has named sections but the render report does not say how many "
                "printed bars it has — re-run the render check so they can be checked"
            )
            continue
        for section in sections:
            low = section["fromMeasure"]
            high = section["toMeasure"]
            label = section["label"]
            if low < 1:
                errors.append(f"{item['id']}: section {label!r} starts at bar {low}; bars are 1-based")
            if high < low:
                errors.append(f"{item['id']}: section {label!r} ends at bar {high}, before it starts")
            if high > bars:
                errors.append(
                    f"{item['id']}: section {label!r} runs to bar {high} but the piece has "
                    f"{bars} printed bar(s)"
                )
    return errors


def orphan_sections(catalog: list, path: Path) -> list[str]:
    """A section keyed to an id that is not in the catalog — almost always a typo."""
    if not path.is_file():
        return []
    data = json.loads(path.read_text(encoding="utf-8"))
    known = {item["id"] for item in catalog}
    return [
        f"sections.json names {item_id!r}, which is not in the catalog"
        for item_id in sorted(data.get("sections", {}))
        if item_id not in known
    ]


def paper_hint_errors(curriculum: dict) -> list[str]:
    """
    replan §5.2: the rungs where a book almost certainly has an equivalent.

    Every Stage 1-5 core rung and every classical rung. Those are the ones a
    method book or a graded album covers — the owner has that material on a
    shelf whether or not the app has any, and a rung that stayed silent about
    it would be pretending the shelf is not there.

    Elsewhere it is optional and deliberately so: nothing in a method book
    trains tritone substitution, and inventing a hint for those rungs would be
    filling a field rather than answering a question.
    """
    errors: list[str] = []
    for stage in curriculum.get("stages", []):
        number = stage.get("number", 0)
        for unit in stage.get("units", []):
            track = unit.get("track")
            required = (track == "core" and 1 <= number <= 5) or track == "classical"
            for lesson in unit.get("lessons", []):
                if not required or lesson.get("optionsExempt"):
                    continue
                if not (lesson.get("paperHint") or "").strip():
                    errors.append(
                        f"lesson {lesson['id']}: a {track} rung at Stage {number} needs a "
                        "paperHint — the owner's own books cover this one (replan §5.2)"
                    )
    return errors


def unknown_concepts(curriculum: dict) -> list[str]:
    """Every concept a lesson names has to have a display name and a finder."""
    known = {c["id"] for c in curriculum.get("concepts", [])}
    missing: set[str] = set()
    for stage in curriculum.get("stages", []):
        for unit in stage.get("units", []):
            for lesson in unit.get("lessons", []):
                for concept in lesson.get("concepts", []):
                    if concept not in known:
                        missing.add(concept)
    return [
        f"concept {c!r} is used by a lesson but is not in content/curriculum/concepts.json"
        for c in sorted(missing)
    ]


def write_needs(curriculum: dict, catalog: list, out_dir: Path, min_options: int) -> int:
    """
    replan §4.2: each built lesson gets a `needs` block.

    The counting already happens — `thin_lesson_errors` does it to decide
    whether a rung is under the floor. What was missing is that the *app* could
    not say "this rung has two songs and wants three" without recomputing it,
    so the number is written where the lesson page can read it.

    `paper` is always 0 for now: the shelf of books the owner owns is P16, and
    a field that is always zero is better than a field the app has to guess at
    once the shelf exists.
    """
    by_id = {item["id"]: item for item in catalog}
    written = 0
    for stage in curriculum.get("stages", []):
        for unit in stage.get("units", []):
            for lesson in unit.get("lessons", []):
                if lesson.get("optionsExempt"):
                    continue
                exercises = lesson.get("exerciseOptions", [])
                songs = lesson.get("songOptions", [])
                band = lesson.get("levelBand")
                inside = 0
                if band:
                    low, high = band
                    for option in exercises + songs:
                        item = by_id.get(option)
                        level = item.get("level") if item else None
                        if level is not None and low <= level <= high:
                            inside += 1
                if lesson.get("songOptional"):
                    # The rung counts both lists together, so shortness is a
                    # property of the pair and not of either one.
                    together = max(0, min_options - (len(exercises) + len(songs)))
                    need_songs, need_exercises = 0, together
                else:
                    need_songs = max(0, min_options - len(songs))
                    need_exercises = max(0, min_options - len(exercises))
                lesson["needs"] = {
                    "songs": need_songs,
                    "exercises": need_exercises,
                    "paper": 0,
                    "inBand": inside,
                    "floor": min_options,
                }
                written += 1
    (out_dir / "curriculum.json").write_text(
        json.dumps(curriculum, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    return written


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dir", type=Path, default=DEFAULT_OUT)
    parser.add_argument(
        "--strict-license",
        action="store_true",
        help="also refuse licences that are not redistributable (docs/03 §1)",
    )
    parser.add_argument(
        "--allow-nc",
        action="store_true",
        help="accept CC BY-NC editions — a personal build only (docs/00 D10a)",
    )
    parser.add_argument(
        "--personal",
        action="store_true",
        help=(
            "the owner's build (docs/00 D23): implies --allow-nc and accepts items whose "
            "composition is not public domain"
        ),
    )
    parser.add_argument(
        "--min-options",
        type=int,
        default=MIN_OPTIONS,
        help=f"alternatives required per rung (docs/00 D21; default {MIN_OPTIONS}, 0 disables)",
    )
    args = parser.parse_args()

    errors: list[str] = []
    errors += validate_schema(
        "catalog.json", args.dir / "catalog.json", CONTENT_SRC / "catalog.schema.json"
    )
    errors += validate_schema(
        "curriculum.json", args.dir / "curriculum.json", CONTENT_SRC / "curriculum.schema.json"
    )

    if not errors:
        catalog = load(args.dir / "catalog.json")
        curriculum = load(args.dir / "curriculum.json")
        assert isinstance(catalog, list) and isinstance(curriculum, dict)
        errors += validate_catalog(
            catalog, args.dir, args.strict_license, args.allow_nc or args.personal, args.personal
        )
        errors += validate_curriculum(curriculum, catalog, args.min_options)
        errors += finder_errors(curriculum)
        errors += unknown_concepts(curriculum)
        errors += paper_hint_errors(curriculum)
        errors += tip_errors(catalog, CONTENT_SRC / "tips")
        errors += section_errors(catalog)
        errors += orphan_sections(catalog, CONTENT_SRC / "sources" / "sections.json")
        errors += stale_ladder_report(catalog, curriculum)
        errors += validate_tracks(catalog, curriculum, load_tracks(), load_item_labels())
        # replan §7.5: reported by P11, an error from P12a.
        errors += [
            f"{item_id}: orphan exercise — reachable from no lesson and no concept"
            for item_id in orphan_exercises(catalog, curriculum)
        ]

        # replan §4.2: the lesson page has to be able to say what a rung is
        # short of without recounting the catalog, so the number is written
        # into the built curriculum here — after the checks above have agreed
        # the counts mean something.
        if not errors:
            rungs = write_needs(curriculum, catalog, args.dir, args.min_options)
            print(f"  wrote needs into {rungs} rung(s)")

    if errors:
        print(f"content validation FAILED ({len(errors)} error(s)):", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        sys.exit(1)

    catalog = load(args.dir / "catalog.json")
    assert isinstance(catalog, list)
    personal = [item["id"] for item in catalog if NC_PERSONAL_TAG in (item.get("tags") or [])]
    personal_build = [
        item["id"] for item in catalog if PERSONAL_BUILD_TAG in (item.get("tags") or [])
    ]
    print(f"content validation of {args.dir}:")
    curriculum = load(args.dir / "curriculum.json")
    assert isinstance(curriculum, dict)
    lessons = [
        lesson
        for stage in curriculum.get("stages", [])
        for unit in stage.get("units", [])
        for lesson in unit.get("lessons", [])
    ]
    exempt = [l["id"] for l in lessons if l.get("optionsExempt")]
    optional = [l["id"] for l in lessons if l.get("songOptional")]
    # Both flags relax docs/00 D21, so both are counted out loud every run: a rule that
    # can be switched off quietly is not a rule.
    print(
        f"  {len(lessons)} lesson(s): {len(optional)} song-optional, {len(exempt)} exempt "
        f"from the {args.min_options}-alternative rule"
    )
    if exempt:
        print(f"  exempt: {', '.join(sorted(exempt))}")

    # replan §1.4: say how much of the library's difficulty is a guess, every
    # run. A number nobody prints is a number nobody fixes.
    by_stage = estimated_by_stage(catalog)
    estimated_total = sum(estimated for estimated, _ in by_stage.values())
    spread = ", ".join(
        f"L{stage}: {estimated}/{total}" for stage, (estimated, total) in by_stage.items()
    )
    print(f"  {estimated_total} item(s) with an estimated level — {spread}")

    # §3.1: and how much there is to practise at each of them.
    per_level = exercises_by_level(catalog)
    print(
        f"  {sum(per_level.values())} exercise(s) by level — "
        + ", ".join(f"L{stage}: {count}" for stage, count in per_level.items())
    )

    # The P2 grace-16th scan over everything this build converted (replan §7).
    scan = scan_dir(args.dir / "scores")
    print(f"  {scan.summary()}")
    for finding in scan.findings:
        print(f"    - {finding.describe()}")
    if personal_build:
        # replan §2.2: counted out loud on every build, like the NC items, so
        # nobody has to remember that a personal build is a personal build.
        print(
            f"NOTE: {len(personal_build)} item(s) have a composition that is not public domain "
            "and are bundled for a personal build only (docs/00 D23). Do not deploy this "
            "build publicly."
        )
    if personal:
        # Loudly, every time: this build is not for a public URL.
        print(
            f"NOTE: {len(personal)} item(s) are CC BY-NC and bundled for a personal build "
            "(docs/00 D10a). Do not deploy this build publicly."
        )

    # Last, so the build's one-line summary of this step is the verdict and the
    # item count rather than whichever detail happened to print last — the same
    # rule the importers follow. Everything above is the detail behind it.
    print(f"content validation OK: {args.dir} ({len(catalog)} catalog items)")


if __name__ == "__main__":
    main()
