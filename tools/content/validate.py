#!/usr/bin/env python3
"""
Validates a built content directory.

docs/03-content-pipeline.md §3 step 9. The JSON Schemas answer "is this the
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
import zipfile
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
import video_check  # noqa: E402

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


#: A lowercase letter followed by an accented capital, which is not a name.
#:
#: Three quarried titles reached the shipped catalogue reading "Petit Papa
#: NoeIl", "piyano notlarA" and "Anh trAng noi ha long toi" -- one or two
#: letters each, the rest of the title perfectly fine. Every one is the same
#: accident: a letter whose UTF-8 is a lead byte plus a continuation in the C1
#: range, read as Latin-1, and then stripped of the control half by something
#: downstream. What is left is valid Unicode, valid NFC, and round-trips
#: through Latin-1 to an error rather than to the original -- so every general
#: mojibake test misses it. The quarry's own `looks_garbled` needs a quarter of
#: the characters to be high bytes, and one ruined letter in sixteen is six per
#: cent.
#:
#: What is left as a signal is position. A real accented capital opens a word --
#: "Ánh", "Über", "École". One sitting immediately after a lowercase letter is
#: the Latin-1 rendering of a lead byte, every time. Across 1,585 catalogue rows
#: it matched exactly the three that were broken and nothing that was not.
#:
#: This lives in the catalogue check rather than in the quarry because it is the
#: catalogue that must be clean: it is the last gate every row passes through
#: whatever imported it, and the title is the one field a learner actually
#: reads.
#: U+00D7 and U+00F7 are the multiplication and division signs, which sit inside
#: the Latin-1 letter ranges without being letters.
MANGLED_LETTER = re.compile(
    r"[a-z\u00DF-\u00F6\u00F8-\u00FF][\u00C0-\u00D6\u00D8-\u00DE\u0178]"
)

#: The other mojibake, which the rule above is the wrong shape to catch.
#:
#: `MANGLED_LETTER` finds a letter that lost *one* byte. This finds a whole
#: string decoded with the wrong codec: UTF-8 read as Latin-1, where every
#: non-ASCII character becomes two or three, the first in the Latin-1 letter
#: range and the rest continuation bytes rendered as C1 controls and stray
#: punctuation. "Rolling Girl" in Japanese arrives as "ãã¼ãªã³ãã¼ã".
#:
#: Two rows in the shipped catalogue read that way, both on chords-and-pop
#: rungs, and both had passed every gate: the quarry's `looks_garbled` wants a
#: quarter of the characters to be high bytes, and `MANGLED_LETTER` wants an
#: accented *capital*, which this never produces. So a learner opening those
#: rungs saw two pieces whose titles were unreadable.
#:
#: The damage is not reversible by re-encoding — bytes are missing as well as
#: misread, so `title.encode("latin-1").decode("utf-8")` raises rather than
#: recovering the Japanese. The repair is to keep the part of the title that
#: survived, which in both cases carried the identity of the piece.
#:
#: Deliberately not a count or a ratio. One occurrence of a Latin-1 high letter
#: immediately followed by a continuation byte does not happen in any real
#: title in any language this catalogue holds; a threshold would only let the
#: short cases through.
MOJIBAKE = re.compile(r"[\u00C0-\u00FF][\u0080-\u00BF]")


#: The keys an 88-note piano has: A0 to C8.
KEYBOARD_BOTTOM, KEYBOARD_TOP = 21, 108

_PITCH_RE = re.compile(
    r"<step>([A-G])</step>\s*(?:<alter>(-?\d+)</alter>\s*)?<octave>(-?\d+)</octave>"
)
_STEP_SEMITONES = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def notes_off_the_keyboard(content_dir: Path, catalog: list) -> list[tuple[str, str, int]]:
    """
    Scores asking for keys the instrument does not have.

    `generate_exercises.confirm_playable` already refuses this, and its
    docstring is the argument: "the MusicXML is valid, the pitches are spelled
    correctly, the fingering is right, and a renderer will draw D8 on as many
    ledger lines as it takes." It caught forty-four generated items once. The
    rule was never applied to anything imported, so the same fault in a
    third-party transcription ships: two do today, one reaching D8 and one
    G sharp 0, either side of the eighty-eight.

    A note, not an error. The generator can be told to start its run lower; an
    imported edition cannot be argued with, and what to do about one — drop it,
    transpose it, leave it — is a decision about that piece rather than
    something a build should make on its own. So this counts them out loud on
    every build, which is what the licence notes do for the same reason.
    """
    found: list[tuple[str, str, int]] = []
    for item in catalog:
        rel = item.get("file")
        if not rel or not str(rel).endswith(".mxl"):
            continue
        path = content_dir / rel
        if not path.is_file():
            continue
        try:
            with zipfile.ZipFile(path) as archive:
                name = next(
                    (n for n in archive.namelist()
                     if not n.startswith("META-INF") and not n.endswith("/")),
                    None,
                )
                if name is None:
                    continue
                text = archive.read(name).decode("utf-8", "replace")
        except (zipfile.BadZipFile, OSError, StopIteration):
            continue
        for step, alter, octave in _PITCH_RE.findall(text):
            midi = (int(octave) + 1) * 12 + _STEP_SEMITONES[step] + int(alter or 0)
            if not (KEYBOARD_BOTTOM <= midi <= KEYBOARD_TOP):
                sign = {"-1": "b", "1": "#"}.get(alter or "", "")
                found.append((item["id"], f"{step}{sign}{octave}", midi))
                break
    return found


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

        for field in ("title", "composer", "artist"):
            value = item.get(field)
            if isinstance(value, str) and MANGLED_LETTER.search(value):
                errors.append(
                    f"{item_id}: {field} {value!r} has an accented capital inside a "
                    "word, which is a letter that lost a byte on the way in; repair "
                    "it in the source rather than shipping it"
                )
            if isinstance(value, str) and MOJIBAKE.search(value):
                errors.append(
                    f"{item_id}: {field} {value!r} was decoded with the wrong codec "
                    "— UTF-8 read as Latin-1 — and is unreadable; repair it in the "
                    "source rather than shipping it"
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
    errors += core_reach_errors(curriculum, catalog)
    return errors


#: Q80: the reasons an import step writes on a placeholder that is *this build's*, not the catalogue's: the
#: source's files were not fetched, or what was fetched is not the pinned file. Read from the placeholder's
#: `importHint`, where the step says why: `import_mutopia.build_entry`'s two, and since Q82 the one the kern and
#: MuseTrainer steps write for a file their clone does not have (`import_kern.UNFETCHED_REASON`,
#: `import_musetrainer.UNFETCHED_REASON`; before Q82 they left such a file out of the catalogue, and every id that
#: named it pointed at nothing). `tests/test_validate_ladder.py` builds these placeholders with the import steps
#: themselves, so a change to their wording turns that test red rather than this check quiet.
UNFETCHED_REASONS = (
    re.compile(r"the edition's \.(?:ly|mid) file was not fetched"),
    re.compile(r"\S+ is not the pinned file \(sha256 [^)]*\)"),
    re.compile(r"\S+ was not fetched: the (?:kern clone|MuseTrainer library) is not on this build"),
)


def unfetched_placeholders(catalog: list) -> list[tuple[str, str]]:
    """Each placeholder whose reason is this build's fetch, with the reason as the step wrote it (Q80)."""
    found: list[tuple[str, str]] = []
    for item in catalog:
        if item.get("file"):
            continue
        hint = " ".join((item.get("importHint") or "").split())
        match = next((m for m in (pattern.search(hint) for pattern in UNFETCHED_REASONS) if m), None)
        if match:
            found.append((item["id"], match.group(0)))
    return found


def ladder_report_findings(catalog: list, curriculum: dict) -> tuple[list[str], list[str]]:
    """
    replan §2.6: the committed ladder report has to match the catalog. Errors, and warnings (Q80).

    Part D is a *report* of what is on each rung, and a generated report that
    nobody regenerates is exactly the hand-written table it replaced. So the
    build fails when it drifts, which is the same mechanism a formatted-file
    check uses.

    A missing report is not an error: the file is generated, and a checkout
    that has not run the generator yet should not fail for it. It is *said*
    though — see `ladder_report_note` — because a rule that disappears in
    silence when its input is missing is a rule that stops working the day
    somebody deletes the file, and nobody finds out.

    **A build's own placeholder is not a change to the catalogue (Q80).** A build that could not
    fetch a source (Mutopia's site or the GitHub mirror unreachable, a fetched file that is not the
    pinned one) carries a placeholder the committed report, written on a build that fetched it,
    does not (in Q76's first landing chain the difference was the "may not be shipped" count and
    nothing that named the item), and validation failed for a reason that says nothing about the
    content; on the runner, a network hiccup would have failed CI and the Pages deploy. So
    where the reports differ and this build holds such placeholders (`unfetched_placeholders`), the
    report is rendered again with those items bundled, as a build that fetched them has them, and
    compared once more. Equal, and the difference was the fetch alone: **warned**, naming each item
    and its reason, never failed, as Q75 treats a claim this build could not measure. Still
    different, and the error stands, naming what it set aside, since a report regenerated on this
    build would list those items as not bundled.

    The render is untouched: what `ladder_report.py` writes is always this catalogue's truth,
    placeholders and all (its module note). Only this comparison takes a fetching build's view, and
    only of placeholders whose reason is a fetch. A licence placeholder is the catalogue's own state
    on that flavour and is compared as it is; the strict build's already compare equal to the
    owner's build's bundled files, because `ladder_report.shippable` reads a personal-only tag as
    not shipped.
    """
    from ladder_report import DEFAULT_OUT, render

    if not DEFAULT_OUT.is_file():
        return [], []
    committed = DEFAULT_OUT.read_text(encoding="utf-8")
    if committed == render(catalog, curriculum):
        return [], []
    report = DEFAULT_OUT.relative_to(CONTENT_SRC.parent)
    unfetched = unfetched_placeholders(catalog)
    count = f"{len(unfetched)} item{'' if len(unfetched) == 1 else 's'}"
    named = "; ".join(f"{item_id} ({reason})" for item_id, reason in unfetched)
    if unfetched:
        ids = {item_id for item_id, _ in unfetched}
        # The render reads only whether a file is there; the path is the one the import step writes.
        as_fetched = [
            dict(item, file=f"scores/imported/{item['id']}.mxl") if item["id"] in ids else item for item in catalog
        ]
        if committed == render(as_fetched, curriculum):
            return [], [
                f"WARNING (ladder report, Q80): {report} compared without the {count} this build could not "
                f"fetch (read as bundled, as the committed report has them): {named}; a placeholder made for "
                "want of a fetch is not a change to the catalogue"
            ]
    error = (
        f"{report} is stale — the catalog has changed "
        "since it was written. Run `python3 tools/content/ladder_report.py` and commit it "
        "(replan §2.6)."
    )
    if unfetched:
        error += (
            f" The comparison already set aside the {count} this build could not fetch ({named}): "
            "regenerate the report on a build that fetched them, or it will list them as not bundled."
        )
    return [error], []


def stale_ladder_report(catalog: list, curriculum: dict) -> list[str]:
    """The errors of `ladder_report_findings`: the committed ladder report differs beyond this build's own placeholders."""
    return ladder_report_findings(catalog, curriculum)[0]


def ladder_report_note() -> str:
    """
    One line, every run, when the ladder check has nothing to check against.

    The tips check is the model: `runtime_drill_kinds()` returns an *error*
    when it cannot parse the TypeScript rather than an empty list, so it cannot
    quietly stop applying. The ladder report has to stay a warning — a fresh
    checkout genuinely has not run the generator — so it is printed instead,
    beside the other counts that are printed to keep them honest.
    """
    from ladder_report import DEFAULT_OUT

    if DEFAULT_OUT.is_file():
        return ""
    return (
        f"NOTE: no ladder report at {DEFAULT_OUT.name}, so the rungs were not checked against "
        "one — run `python3 tools/content/ladder_report.py` to turn the check back on."
    )


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


#: How far above its stage a core-path rung may reach for a song.
#:
#: A rung's `levelBand` is honest by construction — it is the range its options
#: span — so it cannot say whether the options *belong*. On the core path they
#: have to: "First chords: C, F and G" is a Stage 2 rung, and it offered two
#: Jobim bossa novas at level 3.0 and "Ties, dotted rhythms and dynamics" a
#: film theme at 3.7 and a remix at 4.4, because the archive quarry attached
#: pieces by nearest band and the bands then widened to fit them. Two levels
#: above the stage is the reach the hand-placed repertoire actually uses —
#: the Petzold minuet at 5.1 on the Stage 3 ledger-line rung is the widest —
#: and everything past it was a piece nobody had looked at on that rung.
CORE_SONG_REACH = 2.0

#: Placements the plan makes by name (docs/02, Stages 2–3) where the only
#: arrangement the library holds is judged further above the stage than the
#: reach allows. Each is the piece the rung is written around, so it stays; the
#: real cure is an easier arrangement of the same tune, at which point the row
#: comes off this list because the family rule below covers it.
CORE_REACH_PLAN: frozenset[tuple[str, str]] = frozenset({
    ("2.5", "song.classical.beethoven-ode-to-joy.easy"),
    ("3.4", "song.classical.petzold-minuet-g-bwv-anh114"),
    ("3.4", "song.classical.petzold-minuet-g-bwv-anh114.alt"),
})


def variant_families(catalog: list) -> dict[str, int]:
    """
    Each item's family: the connected component of `variantOf` links.

    `song.folk.happy-birthday.simple` says it is a variant of
    `song.folk.happy-birthday`, and so does `.alt`; all three are one tune, and
    a rung that offers the simple one at its level may offer the full one
    beside it as the place the tune goes next.
    """
    parent: dict[str, str] = {}

    def find(x: str) -> str:
        while parent.setdefault(x, x) != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    for item in catalog:
        other = item.get("variantOf")
        if other:
            parent[find(item["id"])] = find(other)
    roots = {item["id"]: find(item["id"]) for item in catalog}
    index = {root: n for n, root in enumerate(dict.fromkeys(roots.values()))}
    return {item_id: index[root] for item_id, root in roots.items()}


def core_reach_errors(curriculum: dict, catalog: list) -> list[str]:
    """
    A core-path song more than `CORE_SONG_REACH` above its rung's stage.

    Exempt: a song whose variant family has another option on the same rung
    within reach (the full arrangement offered beside the simple one), and the
    plan's own placements in `CORE_REACH_PLAN`.
    """
    levels = {item["id"]: float(item["level"]) for item in catalog if item.get("level") is not None}
    family = variant_families(catalog)
    out: list[str] = []
    for stage in curriculum.get("stages", []):
        number = stage.get("number")
        if not isinstance(number, int) or number < 1:
            continue
        ceiling = number + CORE_SONG_REACH + 1e-9
        for unit in stage.get("units", []):
            if unit.get("track") != "core":
                continue
            for lesson in unit.get("lessons", []):
                options = lesson.get("songOptions", [])
                within = {
                    family[o] for o in options
                    if o in family and levels.get(o) is not None and levels[o] <= ceiling
                }
                for option in options:
                    level = levels.get(option)
                    if level is None or level <= ceiling:
                        continue
                    if (lesson["id"], option) in CORE_REACH_PLAN:
                        continue
                    if family.get(option) in within:
                        continue
                    out.append(
                        f"lesson {lesson['id']}: {option} is level {level:g}, more than "
                        f"{CORE_SONG_REACH:g} above a Stage {number} core rung — it belongs on a "
                        "track rung, or on the Library only"
                    )
    return out


def asks_for_songs(lesson: dict) -> bool:
    """
    Whether the rung asks for a run of one of its songs (C5's requirement that replaced
    `songsRequired`): the app's `selectors.asksForSongs`. Read by `thin_lesson_errors`
    and `write_needs`, so the build gate and the shortfall the lesson page prints agree
    on which rungs a song count applies to (R23).
    """
    return any(r.get("kind") == "runs" and r.get("from") == "songs" for r in lesson.get("requirements") or [])


def thin_lesson_errors(lesson: dict, exercises: list, songs: list, min_options: int) -> list[str]:
    """
    docs/00 D21: three alternatives per rung, checked rather than trusted.

    A lesson whose requirements ask for no song at all — Stage 0's checklists, the
    theory and improvisation rungs — is exempt from the song count but not from the
    exercise one.
    """
    lesson_id = lesson.get("id", "?")
    if lesson.get("optionsExempt"):
        # Orientation lessons: there is one placement test and one guided tour, and
        # inventing two more to satisfy a counter would be worse than the counter.
        return []
    required_songs = asks_for_songs(lesson)
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


def video_index_errors(
    lessons_dir: Path = CONTENT_SRC / "lessons",
    index_path: Path = CONTENT_SRC / "video-index.json",
) -> list[str]:
    """
    docs/03 §3 step 9: every video a lesson links to has been fetched once.

    The fault this exists for: 80 lessons carried a `videos:` list and not one
    URL had ever been requested. A video taken down, made private or mistyped
    looked exactly like a good one — on the phone, in `validate.py` and in
    `lessonVideos.test.ts`, which says so in its own header. So a learner taps
    *Watch* and lands on nothing, and the only way anybody finds out is a
    learner.

    The rule: a URL in a lesson must be in `content/video-index.json` with a
    `live` status and a checked date. `tools/content/video_check.py` writes
    that file from YouTube's oEmbed endpoint and is run **by hand**; the build
    only reads the committed answer, so `build.py --offline` stays offline and
    a newly added link fails the build until somebody has checked it once.

    What this cannot do: the index holds the title the uploader typed. Nothing
    here has watched anything, so a live link to the wrong video passes. That
    judgement is a person's, made once, and `lessonVideos.test.ts` asks the
    weaker mechanical half of it — that the title shares a word with the rung.
    """
    if not lessons_dir.is_dir():
        return [f"{lessons_dir} does not exist: the lesson video check cannot run"]
    where = video_check.lesson_urls(lessons_dir)
    if not where:
        return [f"no lesson under {lessons_dir} links to a video; the corpus has never been empty"]
    if not index_path.exists():
        return [
            f"{index_path} does not exist: run python tools/content/video_check.py "
            f"({len(where)} URL(s) to check)"
        ]
    return video_check.check(video_check.load_index(index_path), where)


#: Where the render check records what it measured about each item.
RENDER_REPORT = CONTENT_SRC.parents[0] / "build" / "render-report.json"


def printed_bars(path: Path) -> int | None:
    """
    How many bars a score prints, counted off the file itself.

    music21 keeps the written measures — it does not unroll repeats — so the
    count matches what the page shows and what a section's bar numbers mean.
    Verified against the render report over all 22 sectioned items: they agree
    exactly, including the pieces with pickups and with repeats.
    """
    try:
        from music21 import converter  # noqa: PLC0415 — slow import, only needed here
    except ImportError:
        return None
    try:
        score = converter.parse(str(path))
        part = next(iter(score.parts), None)
        if part is None:
            return None
        return len(list(part.getElementsByClass("Measure"))) or None
    except Exception:  # noqa: BLE001 — an unreadable file is caught by the file check
        return None


def section_findings(
    catalog: list, content_dir: Path, report_path: Path = RENDER_REPORT
) -> tuple[list[str], list[str]]:
    """
    replan/`04` §5: a named section has to name bars the piece actually has. Errors, and warnings (Q82).

    Bars are 1-based positions in the printed score, so the bound is the
    *printed* count. Checking against the unrolled count instead would pass a
    section that runs past the last page of a piece with a repeat, which is
    exactly the mistake worth catching: it produces a loop that silently ends
    early.

    The render report has the number when it exists, and the score file itself
    has it otherwise. Both are consulted, in that order, because the rule has
    to hold on a fresh checkout: an ordering between two build steps is not a
    thing to hang a correctness check on, and the first thing a clean CI runner
    does is prove it.

    **A placeholder this build could not fetch is warned, not failed (Q82).** `build.attach_sections`
    puts the sections on every item by id, a placeholder too. A fetch placeholder (`unfetched_placeholders`:
    the kern or MuseTrainer clone, or Mutopia's files, did not arrive) has no file, and a fresh runner has no
    render report when it validates, so there its count cannot be established for a reason that says nothing
    about the sections: the check says it did not look, naming the item and the fetch, as Q75 treats a claim
    this build could not measure. Only that case moves. A licence placeholder, a bundled file whose bars cannot
    be counted, and a fetch placeholder the render report does count are checked as before.
    """
    errors: list[str] = []
    warnings: list[str] = []
    with_sections = [
        item for item in catalog if (item.get("teaching") or {}).get("sections")
    ]
    if not with_sections:
        return errors, warnings
    unfetched = dict(unfetched_placeholders(with_sections))
    printed: dict[str, int | None] = {}
    if report_path.is_file():
        report = json.loads(report_path.read_text(encoding="utf-8"))
        printed = {
            entry["id"]: entry.get("sourceMeasures")
            for entry in report.get("items", [])
            if entry.get("ok") is not False
        }
    for item in with_sections:
        bars = printed.get(item["id"])
        sections = (item.get("teaching") or {})["sections"]
        if bars is None and item.get("file"):
            bars = printed_bars(content_dir / item["file"])
        if bars is None and item["id"] in unfetched and not item.get("file"):
            warnings.append(f"{item['id']}: named sections not checked on this build: {unfetched[item['id']]}")
            continue
        if bars is None:
            errors.append(
                f"{item['id']}: has named sections but its printed bar count could not be "
                "established from the render report or from the file, so they cannot be checked"
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
    return errors, warnings


def section_errors(
    catalog: list, content_dir: Path, report_path: Path = RENDER_REPORT
) -> list[str]:
    """The errors of `section_findings`: a named section that names bars the piece does not have (replan/`04` §5)."""
    return section_findings(catalog, content_dir, report_path)[0]


#: The approved excerpts (E1): each row checked beside the sections, against the built catalogue.
EXCERPTS_FILE = CONTENT_SRC / "sources" / "excerpts.json"


def excerpt_findings(catalog: list, content_dir: Path, path: Path = EXCERPTS_FILE) -> tuple[list[str], list[str]]:
    """
    E1 item 2: every approved row of `content/sources/excerpts.json`, checked beside the sections.

    Errors: the parent is not in the catalogue, or is not a notated item with a built file (a
    parent this build does not bundle — a licence placeholder — is a warning: the cut is refused
    where the parent is); the range is not inside the parent's printed bars (1-based, the pickup
    as bar 1); the selection is not one of both/right/left, or names a hand a one-staff parent
    does not have; a target is not a vocabulary skill or demand; two rows share parent, range and
    selection, or the derived id is another item's; the range crosses a repeat sign, a first-or-
    second ending or a jump (the bars named); the build has no item for a row it should have cut.

    Warnings: a row approved against parent bytes the parent no longer has — stale by provenance; a row
    merged under an older cutter — stale by cut version (E33: nothing carries the approval to the new
    cut); a built cut that does not establish a target its approval names, with the count (E29,
    `excerpt_target_warnings`).
    """
    import excerpts as X

    errors: list[str] = []
    warnings: list[str] = []
    if not path.is_file():
        return errors, warnings
    rows = X.read_definitions(path).get("excerpts") or []
    by_id = {item["id"]: item for item in catalog}
    skills_file, demands_file = load_vocabulary()
    skills_by_id = {s["id"]: s for s in skills_file.get("skills", [])}
    targets_known = set(skills_by_id) | {d["id"] for d in demands_file.get("demands", [])}
    seen: dict[tuple, int] = {}
    for number, row in enumerate(rows, start=1):
        where = f"excerpts.json row {number}"
        parent_id = row.get("of")
        selection = row.get("selection") or "both"
        try:
            low, high = int(row["fromBar"]), int(row["toBar"])
        except (KeyError, TypeError, ValueError):
            errors.append(f"{where}: fromBar and toBar must be printed bar numbers")
            continue
        if selection not in X.SELECTIONS:
            errors.append(f"{where}: selection {selection!r} is not one of {', '.join(X.SELECTIONS)}")
            continue
        eid = X.excerpt_id(str(parent_id), low, high, selection)
        where = f"{where} ({eid})"
        signature = (parent_id, low, high, selection)
        if signature in seen:
            errors.append(f"{where}: the same parent, bars and selection as row {seen[signature]}")
            continue
        seen[signature] = number
        clash = by_id.get(eid)
        if clash is not None and clash.get("type") != "excerpt":
            errors.append(f"{where}: its id is already another item's")
        targets = row.get("targets") or []
        if not targets:
            errors.append(f"{where}: no target: an approval names what the passage was approved for")
        for target in targets:
            if target not in targets_known:
                errors.append(f"{where}: target {target!r} is not a vocabulary skill or demand")
        parent = by_id.get(parent_id)
        if parent is None:
            errors.append(f"{where}: its parent {parent_id!r} is not in the catalogue")
            continue
        rel = parent.get("file")
        if not rel:
            if parent.get("importHint") or set(parent.get("tags") or []) & {PERSONAL_BUILD_TAG, NC_PERSONAL_TAG}:
                warnings.append(f"{where}: not cut in this build: its parent is not bundled here, so neither is the passage")
            else:
                errors.append(f"{where}: its parent {parent_id} is not a notated item with a built file")
            continue
        parent_path = content_dir / rel
        if not parent_path.is_file() or parent_path.suffix.lower() not in (".mxl", ".musicxml", ".xml"):
            errors.append(f"{where}: its parent {parent_id} is not a notated item with a built file ({rel})")
            continue
        printed = (parent.get("notation") or {}).get("bars") or printed_bars(parent_path)
        if printed is None:
            errors.append(f"{where}: the parent's printed bar count could not be read, so the range cannot be checked")
        elif not (1 <= low <= high <= printed):
            errors.append(f"{where}: bars {low}–{high} are not inside the parent's {printed} printed bar(s)")
            continue
        staves = (parent.get("notation") or {}).get("staves")
        if selection != "both" and staves is not None and staves < 2:
            errors.append(f"{where}: selection {selection} on a parent with {staves} staff: it has no second hand to leave out")
        try:
            from music21 import converter  # noqa: PLC0415 — slow import, only needed here

            faults = X.crossings(converter.parse(str(parent_path)), low, high)
        except ImportError:
            faults = []
        if faults:
            errors.append(f"{where}: bars {low}–{high}: " + "; ".join(faults) + " — unrolled, the cut would mean something else")
        built = by_id.get(eid)
        if built is None:
            errors.append(f"{where}: the build made no item for it")
            continue
        approved = row.get("parentSha256")
        current = X.sha256_of(parent_path)
        if approved and approved != current:
            warnings.append(f"{where}: stale by provenance — approved against the parent's bytes {approved[:12]}…, "
                            f"the parent is now {current[:12]}…: its boundary review predates the parent's change")
        under = X.approved_cut_version(row)
        if under != X.CUT_VERSION:
            warnings.append(f"{where}: stale by cut version — approved when the cutter was version {under}, the cutter "
                            f"is now version {X.CUT_VERSION}: nothing carries the approval to this cut; a person re-decides it")
        warnings += excerpt_target_warnings(where, [str(t) for t in targets if t in targets_known], built, skills_by_id)
    rows_ids = {X.excerpt_id(str(r.get("of")), int(r["fromBar"]), int(r["toBar"]), r.get("selection") or "both")
                for r in rows if "fromBar" in r and "toBar" in r and (r.get("selection") or "both") in X.SELECTIONS}
    for item in catalog:
        if item.get("type") != "excerpt":
            continue
        if item["id"] not in rows_ids:
            errors.append(f"{item['id']}: an excerpt with no approved row in excerpts.json")
        if item.get("excerptOf") not in by_id:
            errors.append(f"{item['id']}: excerptOf {item.get('excerptOf')!r} is not in the catalogue")
    return errors, warnings


def excerpt_target_warnings(where: str, targets: list[str], built: dict, skills: dict[str, dict]) -> list[str]:
    """
    E29: the targets an approval names that the built cut does not establish, each warned with the cut, the
    target and the count — the approval's claim is not what the passage carries. "Establishes" is the
    rung-claims report's one reading (`claims.status_of`): a demand target by itself, a skill target by the
    demands its opportunity names (the window rule included, as the build writes `established`). A skill
    whose opportunity is every step no detector establishes, so an approval naming one is warned too; an
    unmeasured cut is warned that its targets cannot be checked. A warning, never an error: a person
    decides what a passage was approved for, and the proposer's estimate from positions can exceed the
    cut's count at the edges (Hark! 25–28: 7 syncopations by position, 5 on the cut).
    """
    import claims

    if not targets:
        return []
    measurement = built.get("measurement") or {}
    if measurement.get("status") != "measured":
        return [f"{where}: the cut is not measured ({measurement.get('reason') or measurement.get('status') or 'no measurement'}), "
                f"so whether it establishes {', '.join(targets)} is not known"]
    located = measurement.get("located") or {}
    bars = measurement.get("bars")
    out: list[str] = []
    for target in targets:
        skill = skills.get(target)
        if skill is not None and not isinstance(skill.get("opportunity"), list):
            out.append(f"{where}: approved for {target}, whose opportunity is {skill.get('opportunity')!r}: no detector "
                       f"establishes it, so the cut does not establish it")
            continue
        claim = {"kind": "skill" if skill is not None else "demand", "id": target}
        if claims.status_of(claim, built, skills) == "established":
            continue
        demands = list(skill["opportunity"]) if skill is not None else [target]
        counts = "; ".join(f"{d}: {int(located.get(d, 0))} located in {bars} bar(s)" for d in demands)
        named = f"{target} ({counts})" if skill is not None else f"{target}: {counts.split(': ', 1)[1]}"
        out.append(f"{where}: approved for {named}, and the built cut does not establish it (E29): the approval "
                   f"names a target the passage does not carry at a useful density")
    return out


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
    """Every concept a lesson names, in `concepts` or `introduces` (F2), has to have a display name and a finder."""
    known = {c["id"] for c in curriculum.get("concepts", [])}
    missing: set[str] = set()
    for stage in curriculum.get("stages", []):
        for unit in stage.get("units", []):
            for lesson in unit.get("lessons", []):
                for concept in list(lesson.get("concepts", [])) + list(lesson.get("introduces") or []):
                    if concept not in known:
                        missing.add(concept)
    return [
        f"concept {c!r} is used by a lesson but is not in content/curriculum/concepts.json"
        for c in sorted(missing)
    ]


#: Concepts whose rung is making a claim about what the music *is*, and which
#: therefore may not leave `requires` off. Each of these named a fault that
#: shipped: a rung teaching chord symbols whose only new song printed none, a
#: rung teaching the minor whose song was in F major, a rung teaching the waltz
#: bass whose song was in 4/4.
CLAIMING_CONCEPTS = {
    "chord-symbols": {"chordSymbols": True},
    "four-part-harmony": {"staves": 2},
    "waltz-bass": {"meter": ["3/4"]},
    "relative-minor": {"mode": "minor"},
    # The vocabulary id: this key read `minor-triad` until C2 (G34), so it never
    # matched a rung. No effect today: the one rung carrying `minor-triads` also
    # carries another claiming concept and already has a `requires`.
    "minor-triads": {"mode": "minor"},
}


def notation_requirements(curriculum: dict, catalog: list) -> list[str]:
    """
    A rung that says what its music is must offer music that is it.

    `requires` is checked against the catalog's `notation` block, which
    `build.py` reads out of each MusicXML file. Nothing here reads a title, a
    level or an id — those are the fields that were asserted rather than
    measured, and choosing from them is how four songs landed on rungs they did
    not belong on (`docs/pending-review.md`, Entry 3).

    **At least one option, not all of them.** A rung offers alternatives and
    needs one that demonstrates the thing; requiring every option to be in the
    minor would empty every rung that teaches it.

    A rung whose `concepts` include one of `CLAIMING_CONCEPTS` and which has no
    `requires` at all is an error in itself, so the rungs most likely to make a
    claim cannot quietly opt out of being checked.
    """
    rows = {item["id"]: item for item in catalog}
    errors: list[str] = []

    def satisfied(option_ids: list, need: str, value) -> bool:
        for item_id in option_ids:
            notation = (rows.get(item_id) or {}).get("notation")
            if not notation:
                continue
            if need == "chordSymbols":
                if bool(notation.get("chordCount", 0)) == bool(value):
                    return True
            elif need == "meter":
                if any(sig in notation.get("times", []) for sig in value):
                    return True
            elif need == "mode":
                if any(key.get("mode") == value for key in notation.get("keys", [])):
                    return True
            elif need == "staves":
                if int(notation.get("staves", 1)) >= int(value):
                    return True
        return False

    for stage in curriculum.get("stages", []):
        for unit in stage.get("units", []):
            for lesson in unit.get("lessons", []):
                lesson_id = lesson.get("id", "?")
                requires = lesson.get("requires") or {}
                claimed = [c for c in lesson.get("concepts", []) if c in CLAIMING_CONCEPTS]
                if claimed and not requires:
                    wanted = {}
                    for concept in claimed:
                        wanted.update(CLAIMING_CONCEPTS[concept])
                    errors.append(
                        f"{lesson_id}: teaches {', '.join(sorted(claimed))} and has no "
                        f"`requires` — it is claiming something about its music that "
                        f"nothing checks (suggested: {wanted})"
                    )
                    continue
                options = list(lesson.get("songOptions", [])) + list(
                    lesson.get("exerciseOptions", [])
                )
                for need, value in requires.items():
                    if satisfied(options, need, value):
                        continue
                    errors.append(
                        f"{lesson_id}: requires {need}={value!r} and no option on the rung "
                        f"has it, read from the score rather than from a title"
                    )
    return errors


#: Vocabulary v0 (C2): the reading skills and the material demands, beside
#: `concepts.json` in a folder of their own, because `build.py` reads every JSON
#: file at the top of `content/curriculum/` as a stage file.
VOCABULARY_DIR = CONTENT_SRC / "curriculum" / "vocabulary"

def load_vocabulary(directory: Path = VOCABULARY_DIR) -> tuple[dict, dict]:
    """The skills file and the demands file, as written."""
    skills = load(directory / "skills.json")
    demands = load(directory / "demands.json")
    assert isinstance(skills, dict) and isinstance(demands, dict)
    return skills, demands


#: Where the relationship's dimensions are declared (D4, `curriculum/transfer.ts`). Read, never
#: copied: a skill's `transfer.dimensions` (G2) must name entries of that list, which the app's
#: transfer policy compares against the relationship's measured facts.
TRANSFER_FILE = CONTENT_SRC.parent / "app" / "src" / "curriculum" / "transfer.ts"


def transfer_dimensions(path: Path = TRANSFER_FILE) -> list[str]:
    """The `DIMENSIONS` array, parsed out of the TypeScript (as `runtime_drill_kinds` reads its list)."""
    if not path.is_file():
        return []
    match = re.search(r"export const DIMENSIONS\s*=\s*\[(.*?)\]", path.read_text(encoding="utf-8"), re.S)
    return re.findall(r"'([^']+)'", match.group(1)) if match else []


def skills_without_transfer(skills_file: dict) -> list[str]:
    """G2: the skills with no `transfer` block, which the app credits no transfer: listed on every build."""
    return [skill["id"] for skill in skills_file.get("skills", []) if not skill.get("transfer")]


def _rungs(curriculum: dict) -> list[dict]:
    return [
        lesson
        for stage in curriculum.get("stages", [])
        for unit in stage.get("units", [])
        for lesson in unit.get("lessons", [])
    ]


def vocabulary_errors(
    skills_file: dict,
    demands_file: dict,
    curriculum: dict,
    catalog: list,
    directory: Path = VOCABULARY_DIR,
) -> list[str]:
    """
    Vocabulary v0 has the right shape and every id it names resolves (C2).

    The schemas answer the shape; this answers the references: a skill's
    opportunity names demands that exist and its standards name declared
    conditions, a full standard with the guide off has the names off too (L58),
    a rhythm skill states its precision and no untimed skill has one (L57),
    a demand is coped with by a skill whose opportunity names it and
    is taught at rungs the curriculum has, one per path, whose concepts name it
    (E0b, `taught_at_findings`, whose warnings `main` prints), and every `targetSkills` and
    `demands` id on a catalog row is in the vocabulary. Whether each demand's
    detector exists is the app's to say: `app/tests/unit/vocabulary.test.ts`
    imports the module.
    """
    errors: list[str] = []
    for name, data in (("skills.json", skills_file), ("demands.json", demands_file)):
        schema = directory / name.replace(".json", ".schema.json")
        if not schema.exists():
            errors.append(f"vocabulary: schema {schema} does not exist")
            continue
        validator = jsonschema.Draft202012Validator(load(schema))
        errors += [
            f"vocabulary {name}: {'/'.join(str(p) for p in err.path) or '<root>'}: {err.message}"
            for err in sorted(validator.iter_errors(data), key=lambda e: list(e.path))
        ]
    if errors:
        return errors

    skills = {s["id"]: s for s in skills_file.get("skills", [])}
    demands = {d["id"]: d for d in demands_file.get("demands", [])}
    conditions = {c["id"] for c in skills_file.get("conditions", [])}

    for skill in skills.values():
        opportunity = skill["opportunity"]
        if opportunity != "every-step":
            for demand_id in opportunity:
                if demand_id not in demands:
                    errors.append(
                        f"vocabulary: skill {skill['id']} names demand {demand_id!r}, which demands.json lacks"
                    )
        for standard in ("practice", "full"):
            for condition in skill["standards"][standard]:
                if condition not in conditions:
                    errors.append(
                        f"vocabulary: skill {skill['id']} {standard} names condition {condition!r}, "
                        f"which is not declared"
                    )
        # CL11b, L58: a note's name on the screen is supported reading, so a full standard that asks
        # for the guide off asks for the names off too (the evidence contract's fourth line).
        full = skill["standards"]["full"]
        if "guide-off" in full and "names-off" not in full:
            errors.append(
                f"vocabulary: skill {skill['id']} full standard lists guide-off without names-off: "
                f"a read with a note's name on the screen would count as unaided reading (L58)"
            )
        # CL11b, L57: a rhythm skill states the error its timing must see; a skill no run times states none.
        timed = skill["observable"] != "none" and "timing" in skill["observable"]
        if skill.get("precision") is not None and not timed:
            errors.append(
                f"vocabulary: skill {skill['id']} has a precision, but no run times it "
                f"(observable {skill['observable']!r})"
            )
        if skill["kind"] == "rhythm" and timed and skill.get("precision") is None:
            errors.append(
                f"vocabulary: rhythm skill {skill['id']} names no precision: the error its timing "
                f"must see is not stated, and its demands would not be read as rhythm demands"
            )
    # G2: a skill's transfer dimensions are the relationship's, read out of transfer.ts.
    if any(skill.get("transfer") for skill in skills.values()):
        known_dimensions = transfer_dimensions()
        if not known_dimensions:
            errors.append("could not read DIMENSIONS from transfer.ts — the skills' transfer check cannot run")
        else:
            for skill in skills.values():
                for dimension in (skill.get("transfer") or {}).get("dimensions", []):
                    if dimension not in known_dimensions:
                        errors.append(
                            f"vocabulary: skill {skill['id']} names transfer dimension {dimension!r}, "
                            f"which transfer.ts's DIMENSIONS lacks"
                        )
    for demand in demands.values():
        coper = skills.get(demand["copedWithBy"])
        if coper is None:
            errors.append(
                f"vocabulary: demand {demand['id']} is coped with by {demand['copedWithBy']!r}, "
                f"which skills.json lacks"
            )
        elif coper["opportunity"] != "every-step" and demand["id"] not in coper["opportunity"]:
            errors.append(
                f"vocabulary: demand {demand['id']} is coped with by {coper['id']}, "
                f"whose opportunity does not name it"
            )
    # E0b: every rung `taughtAt` lists exists, one per path, and names the demand in its concepts.
    errors += taught_at_findings(skills_file, demands_file, curriculum)[0]
    for item in catalog:
        for skill_id in item.get("targetSkills") or []:
            if skill_id not in skills:
                errors.append(
                    f"{item.get('id')}: targetSkills names {skill_id!r}, which vocabulary v0 does not define"
                )
        # `"unmeasured"` is the one string `demands` may be (E0): a notated item the
        # detectors could not read, never an empty list; its reason is required.
        measured = item.get("demands")
        if measured == "unmeasured":
            if not ((item.get("measurement") or {}).get("reason")):
                errors.append(f"{item.get('id')}: demands unmeasured with no reason in measurement.reason")
            continue
        for demand_id in measured or []:
            if demand_id not in demands:
                errors.append(
                    f"{item.get('id')}: demands names {demand_id!r}, which vocabulary v0 does not define"
                )
        for demand_id in (item.get("measurement") or {}).get("established") or []:
            if demand_id not in (measured or []):
                errors.append(
                    f"{item.get('id')}: measurement establishes {demand_id!r}, which its measured demands lack"
                )
    return errors


def _names_rung(note: str, rung: str) -> bool:
    """Whether a note names the rung by its id (`3.1`, not `3.10` or `13.1`)."""
    return re.search(rf"(?<![\w.]){re.escape(rung)}(?!\w)", note) is not None


def taught_at_findings(skills_file: dict, demands_file: dict, curriculum: dict) -> tuple[list[str], list[str]]:
    """
    Where each demand is taught (E0b; the reviewer's finding 2 on E0a): `taughtAt` is every rung
    that teaches the demand, one per path — a rung whose ancestry (`claims.rung_ancestry`) already
    holds a listed rung of the same demand is not a second teaching rung. Returns `(errors,
    warnings)`.

    Errors: a listed rung the curriculum lacks; a listed rung on another listed rung's path; a
    listed rung whose concepts name none of the concepts that name the demand
    (`claims.concepts_naming`), unless `taughtAtNote` names that rung — a hand reading of its
    lesson, which is a warning until F reads the lesson. Warnings: those hand readings, and every
    rung the derivation from the lessons' concepts gives (`claims.teaching_rungs`) with no listed
    rung on its path — a teaching rung the list omits, or a lesson naming a concept in passing
    (`latin`'s walking-bass, whose lesson teaches a tumbao). Printed on every build; never silent.
    """
    import claims

    skills = {s["id"]: s for s in skills_file.get("skills", [])}
    demands = {d["id"]: d for d in demands_file.get("demands", [])}
    lessons = {lesson.get("id"): lesson for lesson in _rungs(curriculum)}
    ancestry = claims.rung_ancestry(curriculum)
    naming = claims.concepts_naming(skills, demands)
    derived = claims.teaching_rungs(curriculum, skills, demands, ancestry)
    errors: list[str] = []
    warnings: list[str] = []
    for demand in demands.values():
        ident = demand["id"]
        listed = claims.taught_at(demand)
        note = demand.get("taughtAtNote") or ""
        concepts = naming.get(ident, set())
        for rung in listed:
            if rung not in lessons:
                errors.append(f"vocabulary: demand {ident} is taught at {rung!r}, which is not a rung")
                continue
            # F2 item 7 (the reviewer's required change): a rung that only introduces the demand is never
            # a teaching rung, whatever a note reads by hand.
            introduced = sorted(concepts & set(lessons[rung].get("introduces") or []))
            if introduced:
                errors.append(
                    f"vocabulary: demand {ident} is taught at {rung!r}, which only introduces it "
                    f"({', '.join(introduced)} under introduces): an introduction is never a teaching rung"
                )
                continue
            for other in listed:
                if other != rung and other in ancestry.get(rung, set()):
                    errors.append(
                        f"vocabulary: demand {ident} is taught at {rung!r} and at {other!r}, which is on "
                        f"{rung}'s path: one teaching rung per path"
                    )
            if concepts and not concepts & set(lessons[rung].get("concepts") or []):
                words = f"demand {ident} is taught at {rung!r}, whose concepts name none of {', '.join(sorted(concepts))}"
                if _names_rung(note, rung):
                    warnings.append(f"WARNING (taught at, E0b): {words}; its taughtAtNote reads the lesson by hand, until F reads it")
                else:
                    errors.append(f"vocabulary: {words}, and its taughtAtNote does not name {rung} with the reading")
        for rung in derived.get(ident, []):
            if not any(at in ancestry.get(rung, set()) for at in listed):
                named = sorted(concepts & set(lessons.get(rung, {}).get("concepts") or []))
                warnings.append(
                    f"WARNING (taught at, E0b): demand {ident} is taught at no rung on the path to {rung!r}, whose "
                    f"concepts name {', '.join(named)}: a teaching rung taughtAt omits, or a concept named in passing"
                )
    return errors, warnings


#: Rung claims no option establishes, where the non-establishment is a detector's reading known to be
#: wrong, not the notes' (F2, Entry 108; the entry's question 2). Each warns on every build with its
#: reason instead of failing; `concept_claim_findings` fails once one no longer describes the build.
#: The claims stay taught as they were (`taughtAt` unchanged) and stay listed among the claims no
#: option keeps in `docs/prompts/rung-claims.md`: a deferral passes the build, never the report.
#: The counts are each option's own per-bar readings (the bridge's every-bar places, E1), against
#: the whole-piece every-bar rule the density file keeps for these two demands.
#: CQ1 (`docs/prompts/runs/CQ1/decision.md`): empty. The five deferrals (the walking bass at `blues.6`,
#: `blues.8`, `jazz.6` and `jam.6`; the oom-pah bass at `ragtime.5`) excused a named-style concept claim that
#: the broad `walkingBass` / `leftHandPattern` readings could not keep. Those concepts no longer map to a
#: demand (`claims.NAMED_FIGURES_AWAITING_A_SOURCED_CHECK`), so the claims are not made and a deferral of
#: them would be stale; `concept_claim_findings` itself fails a stale deferral. Their per-bar readings are
#: in git history (738e23e) for the figure slice that returns each style.
DEFERRED_CONCEPT_CLAIMS: dict[tuple[str, str], str] = {
    # CD1 §3a: the habanera is curated-only (no density rule), and ragtime.7's lesson names Solace as built on a
    # habanera rhythm without naming a passage (ragtime.7.md:25-27), so no verified passage fact can prove it there.
    ("ragtime.7", "habanera"): ("curated-only (CD1 §3a): ragtime.7.md names Solace's habanera rhythm but no passage, so no "
                                "verified passage fact establishes it; unestablished until a lesson names the bars"),
}


def concept_claim_findings(
    catalog: list, curriculum: dict, deferred: dict[tuple[str, str], str] | None = None
) -> tuple[list[str], list[str]]:
    """
    A rung claims only what its options establish, or says it introduces it (F2 item 7; the reviewer's
    required change on the F2 brief, `docs/review/responses/12af708.md`). Returns `(errors, warnings)`.

    Read from the rung-claims report (`claims.rung_claims`), the one reading of "establishes":

    - **fails** where a rung's `concepts` name a measurable skill or demand (a vocabulary skill with an
      opportunity, or a notated fact `claims.CONCEPT_DEMANDS` maps) that no checkable option of the rung
      establishes. A rung whose options no detector can check (runtime drills only) is not judged, as
      the report counts such a claim unchecked. The same concept under the rung's `introduces` list
      passes: the lesson says the rung introduces it and no piece there practises it yet;
    - judges only the options this build measured (Q75). An `unmeasured` option (a strict build's
      licence placeholder, a file the app could not load) establishes nothing and refutes nothing
      (E0), so it is not a checked option (`claims.CHECKED`), and where one sits on a rung whose
      checked options do not establish the claim, the claim is **warned** as not judged on this build,
      naming how many options were unmeasured, never failed: the option this build could not read may
      be the one that keeps it. The Pages deploy is the strict build, which placeholders the one
      option establishing 2.4's tie and the five Joplin rags among ragtime.8's options. A claim fails
      only where every option the rung holds was checked or is a runtime drill, and the failing message
      says so ("0 unmeasured on this build"), so the runner's log tells a placeholder from a wrong claim;
    - **fails** where a concept is in both lists, and where a deferral no longer describes the build (the
      claim established, or no longer made): a deferral never outlives its reason. A deferral whose
      options this build could not measure is not stale: the build did not look (Q75);
    - **warns** for each deferral (`DEFERRED_CONCEPT_CLAIMS`, with its reason), and where an option
      establishes a concept the rung only introduces: it belongs in `concepts`.

    What `introduces` never does is checked where it would: `taught_at_findings` refuses a listed rung
    that only introduces the demand, `teaching_rungs` reads `concepts` alone, and the evidence gate's
    requirement check reads `targetSkills`, never a lesson's lists. The concept claims no detector can
    measure are warned by `rung_claims_warning`, never failed. This proves the rungs agree with the
    report, not that the report or the lessons are true (Part 10's permanent rule).
    """
    import claims

    deferred = DEFERRED_CONCEPT_CLAIMS if deferred is None else deferred
    skills, _demands = claims.load_vocabulary()
    report = claims.rung_claims(catalog, curriculum)
    lessons = {lesson.get("id"): lesson for lesson in _rungs(curriculum)}

    def claim_of(concept: str) -> tuple[str, str] | None:
        if concept in skills:
            return ("skill", concept) if skills[concept]["opportunity"] != "every-step" else None
        if concept in claims.CONCEPT_DEMANDS:
            return ("demand", claims.CONCEPT_DEMANDS[concept])
        return None

    errors: list[str] = []
    warnings: list[str] = []
    used: set[tuple[str, str]] = set()
    for row in report["rungs"]:
        rung_id = row["rung"]
        lesson = lessons.get(rung_id, {})
        concepts = list(lesson.get("concepts") or [])
        introduced = list(lesson.get("introduces") or [])
        for both in sorted(set(concepts) & set(introduced)):
            errors.append(f"{rung_id}: {both} is in both concepts and introduces: a rung teaches a concept or introduces it")
        counts = {(c["kind"], c["id"]): c for c in row["claims"]}
        for concept in concepts:
            key = claim_of(concept)
            claim = counts.get(key) if key else None
            if claim is None or claim["established"] > 0:
                continue
            checked, unmeasured = claim["measurable"], claim.get("unmeasured", 0)
            if checked == 0 and unmeasured == 0:
                continue  # runtime drills or missing ids only: no build checks the claim (F2)
            looked = (f"none of its {checked} checked options establishes it" if checked
                      else "none of its options was checked")
            reason = deferred.get((rung_id, concept))
            if reason is not None:
                used.add((rung_id, concept))
                here = f" ({unmeasured} unmeasured on this build)" if unmeasured else ""
                warnings.append(f"WARNING (rung claims, F2): {rung_id} claims {concept} ({key[1]}) and {looked}{here}; "
                                f"deferred: {reason}")
                continue
            if unmeasured:
                warnings.append(
                    f"WARNING (rung claims, Q75): {rung_id} claims {concept} ({key[1]}), not judged on this build: "
                    f"{unmeasured} of its options unmeasured here (a placeholder, or a file the app could not load) and "
                    f"{looked}; an unmeasured option establishes nothing and refutes nothing"
                )
                continue
            errors.append(
                f"{rung_id}: its concepts name {concept} ({key[1]}) and {looked} (0 unmeasured on this build): "
                f"move it to introduces (the rung introduces it, and its lesson says no piece there practises it yet), "
                f"or keep an option that establishes it"
            )
        for item in row.get("introduced") or []:
            if item["kind"] is not None and item["established"] > 0:
                warnings.append(f"WARNING (rung claims, F2): {rung_id} introduces {item['from'].split(' ', 1)[1]} "
                                f"({item['id']}) and {item['established']} of its options establish it: it belongs in concepts")
    for rung_id, concept in sorted(set(deferred) - used):
        errors.append(f"{rung_id}: the deferral of {concept} no longer describes the build (the claim is kept, or "
                      f"no longer made): remove it from DEFERRED_CONCEPT_CLAIMS")
    return errors, warnings


def rung_claims_warning(catalog: list, curriculum: dict) -> str:
    """
    The rung-claims check as a warning, never a failure, until the reviewer says
    otherwise (E0 item 5): how many of the claims rungs make about their options the
    options' measured demands do not establish, and how many rung claims no option
    keeps. The report itself is `docs/prompts/rung-claims.md` (`claims.py`).
    """
    import claims

    s = claims.rung_claims(catalog, curriculum)["summary"]
    return (
        f"WARNING (rung claims, E0): {s['unestablished']} of {s['measurable']} checkable claims on rung options "
        f"are not established by the options' measured demands ({s['unmeasured']} unmeasured on this build, "
        f"neither established nor refuted, Q75); {s['rungClaimsKeptByNoOption']} rung claims "
        f"no option establishes; {s['unmeasurableConcepts']} concept claims no detector can measure, with "
        f"{s['humanReviewed']} human teaching-use reviews. Nothing is removed from a rung: "
        f"docs/prompts/rung-claims.md."
    )


def untaught_options_warnings(catalog: list, curriculum: dict) -> list[str]:
    """
    The rung-own options the one gate refuses `untaught` at their own rung, as a warning, never a failure
    (L120b item 7; the L120 brief's Ruled section: the validator's warning is L120b's). The count is
    `untaught_options.table`'s — the build's reading of the app's coping question, held equal to the app's
    probe by `tests/test_untaught_options.py` but for its recorded differences. The runtime reading rows on
    rungs are listed apart as not read: the demands they ask are the reading controls' (`readingControls.ts`,
    app code), which the build does not have — the recorded exception L124 asks for, the one the app's probe
    refuses named in `test_untaught_options.RECORDED_DIFFERENCES`. It becomes an error only when the count is
    zero or every line has a recorded reason, which no lane has decided yet.
    """
    import untaught_options

    report = untaught_options.table(catalog, curriculum)
    s = report["summary"]
    out = [
        f"WARNING (untaught rung-own options, L120b): {s['options']} rung-own options on {s['rungs']} rungs are refused "
        f"`untaught` at their own rung ({s['pairs']} option-demand pairs: "
        + ", ".join(f"{kind} {n}" for kind, n in s["pairsByClass"].items())
        + "); `python tools/content/untaught_options.py` lists and classifies them (A reading, B ownership, C placement)."
    ]
    if report["unread"]:
        out.append(
            f"WARNING (untaught rung-own options, L120b): {len(report['unread'])} runtime reading row(s) on rungs not read "
            "(the demands they ask are the reading controls', app code; the app's probe refusal among them is recorded in "
            "tests/test_untaught_options.py): " + ", ".join(f"{row['rung']} {row['item']}" for row in report["unread"])
        )
    return out


#: The ladder state a `skill` requirement names, and the standard its evidence
#: has to reach (`app/src/evidence/ladder.ts`): familiar is supporting evidence
#: at the practice standard, proficient at the full one.
SKILL_STATE_STANDARD = {"familiar": "practice", "proficient": "full"}


def evidence_gate(curriculum: dict, skills_file: dict, catalog: list) -> tuple[list[str], list[str]]:
    """
    Refuses a rung whose requirement no run can evidence (C2, C5; design
    2026-09-26 §4, enforcement 3).

    Since C5 a rung states what completes it as `requirements`, predicates over
    evidence that `app/src/evidence/rungState.ts` reads. This reads the same
    predicates against vocabulary v0 and the catalog:

    - **every rung states at least one requirement**;
    - a `skill` or `reads` requirement names a v0 skill whose observable is not
      `none`, whose standard (familiar: practice; proficient and `reads` as
      written) names only conditions some run records, and which one of the
      rung's own options declares in `targetSkills` — the evidence has to be
      reachable from the rung's page;
    - a `runs` requirement asks for no more distinct items than its pool holds
      (the rung's exercises, songs, or the items it names, which must be its own);
    - a `done` requirement names an option of this rung that no other rung lists;
    - a concept that is a v0 skill with `observable: none` (completing a rung
      marks its concepts learnt) is refused unless the rung carries an
      `unjudged` requirement naming it: the page then says the app does not
      judge it.

    Returns `(errors, unjudged)`: `unjudged` lists every `unjudged` requirement
    as `rung: rule`, printed on every build, so "nothing refused" is never read
    as "everything measured". Nothing is waived.
    """
    skills = {s["id"]: s for s in skills_file.get("skills", [])}
    recorded = {c["id"]: c.get("recordedBy") is not None for c in skills_file.get("conditions", [])}
    declares = {item.get("id"): set(item.get("targetSkills") or []) for item in catalog}
    rungs = _rungs(curriculum)
    listed_on: dict[str, list[str]] = {}
    for lesson in rungs:
        for item_id in (lesson.get("exerciseOptions") or []) + (lesson.get("songOptions") or []):
            listed_on.setdefault(item_id, []).append(str(lesson.get("id")))

    errors: list[str] = []
    unjudged: list[str] = []

    for lesson in rungs:
        rung_id = str(lesson.get("id", "?"))
        requirements = lesson.get("requirements") or []
        exercises = list(lesson.get("exerciseOptions") or [])
        songs = list(lesson.get("songOptions") or [])
        options = exercises + songs
        if not requirements:
            errors.append(f"{rung_id}: states no requirement, so nothing could ever meet it")
            continue
        said_unjudged = {r.get("rule") for r in requirements if r.get("kind") == "unjudged"}

        for concept in lesson.get("concepts") or []:
            skill = skills.get(concept)
            if skill is not None and skill["observable"] == "none" and concept not in said_unjudged:
                errors.append(
                    f"{rung_id}: its concepts claim {concept}, whose observable is none: no run can measure it; "
                    f"say so with an unjudged requirement whose rule is {concept!r}"
                )

        for requirement in requirements:
            kind = requirement.get("kind")
            if kind in ("skill", "reads"):
                skill_id = requirement.get("skill")
                skill = skills.get(skill_id)
                if skill is None:
                    errors.append(f"{rung_id}: requires {skill_id!r}, which vocabulary v0 does not define")
                    continue
                if skill["observable"] == "none":
                    errors.append(f"{rung_id}: requires {skill_id}, whose observable is none: no run can measure it")
                    continue
                standard = (
                    SKILL_STATE_STANDARD.get(requirement.get("state"), "full")
                    if kind == "skill"
                    else requirement.get("standard", "full")
                )
                missing = [c for c in skill["standards"][standard] if not recorded.get(c, False)]
                if missing:
                    errors.append(
                        f"{rung_id}: requires {skill_id} at the {standard} standard, which needs "
                        f"{', '.join(missing)}: no run records it"
                    )
                if not any(skill_id in declares.get(option, set()) for option in options):
                    errors.append(
                        f"{rung_id}: requires {skill_id}, and no option of the rung declares it in targetSkills: "
                        f"the evidence is not reachable from the rung's page"
                    )
            elif kind == "runs":
                # A hand condition reads `SessionRow.hands.played`, which only the vocabulary's `both-hands`
                # condition says a run records (A7a-hands-both-requirement): a value no run records is a promise
                # the app cannot keep.
                if "hands" in requirement:
                    if requirement["hands"] != "both":
                        errors.append(f"{rung_id}: its runs requirement says hands {requirement['hands']!r}; only 'both' is read")
                    elif not recorded.get("both-hands", False):
                        errors.append(f"{rung_id}: its runs requirement says hands both, and no run records the both-hands condition")
                source = requirement.get("from")
                pool = exercises if source == "exercises" else songs if source == "songs" else options
                named = requirement.get("items")
                if named is not None:
                    strangers = [item for item in named if item not in options]
                    if strangers:
                        errors.append(f"{rung_id}: its runs requirement names {', '.join(strangers)}, not options of the rung")
                    pool = [item for item in pool if item in named]
                count = requirement.get("count", 0)
                if count > len(pool):
                    errors.append(
                        f"{rung_id}: asks for {count} of its {source} and offers {len(pool)}: no run can meet it"
                    )
            elif kind == "done":
                item = requirement.get("item")
                if item not in options:
                    errors.append(f"{rung_id}: its done requirement names {item!r}, not an option of the rung")
                elif len(listed_on.get(item, [])) > 1:
                    errors.append(
                        f"{rung_id}: its done requirement names {item}, which {', '.join(listed_on[item])} list: "
                        f"finishing it would count for more than one rung"
                    )
            elif kind == "unjudged":
                unjudged.append(f"{rung_id}: {requirement.get('rule')}")
    return errors, unjudged


#: The lab's presets, as `engine/sightReading.ts` declares them. Duplicated here
#: rather than parsed out of the TypeScript, and the test that keeps the two in
#: step is `labPresets.test.ts` — a regex over a source file is a worse coupling
#: than a list with a test on it.
LAB_PRESET_IDS = {
    "primary-chords",
    "pop-four-chord",
    "ballad",
    "blues-shuffle",
    "jazz-comping",
    "minor-vamp",
}


#: Which of a preset's pickers each one locks, mirroring `LAB_PRESETS` in
#: `app/src/engine/sightReading.ts`. A rung's `unlock` names one of *its
#: preset's* locks, so the check needs the locks and not only the ids.
#: `labPresets.test.ts` is the join that says when the two copies drift.
LAB_PRESET_LOCKS = {
    "primary-chords": {"progression", "leftHand"},
    "pop-four-chord": {"progression", "leftHand"},
    "ballad": {"progression", "leftHand", "rightHand"},
    "blues-shuffle": {"progression", "leftHand", "bars"},
    "jazz-comping": {"progression", "leftHand"},
    "minor-vamp": {"key", "progression", "leftHand"},
}

#: The three ways round the lab opens (`04` §3c): the bed silent, the bed
#: holding the chords, the bed playing the tune.
LAB_BED_MODES = {"off", "hold", "tune"}


def tool_errors(curriculum: dict, catalog: list | None = None) -> list[str]:
    """
    A rung's tools must open something the rung actually has, and say something
    about that rung's own lab.

    Four ways to point at nothing, and each would draw a button that lands the
    learner somewhere wrong rather than failing loudly: a lab preset the lab
    has never heard of, an `item` that is not among this rung's own options, an
    `unlock` naming a control the rung's preset does not lock, and a `mode` the
    lab does not have. The second is the important one — a lesson that sends
    you to a piece it does not offer is the `blues.3` fault wearing a control.

    A `simon` tool opens a drill, not a piece, and a rung offers its drills as
    exercises, so its `item` is checked against those (2026-09-19, when the
    blues rungs began naming the Simon seeded from the blues scale).

    **A `ladder` takes no `item` at all**, and that is now said here rather
    than left to fall out of another rule (2026-09-22 review). The lesson page
    ignores `tool.item` on a ladder and opens the rung's first exercise that
    opens as notation; `04` §3d, `curriculum/types.ts` and the schema each
    state that an `item` written on one is refused. All three rested on the
    narrow rule below — an `item` had to be a *song*, which a ladder's exercise
    never is — so widening that rule made three documents false in one hunk.

    **Every other kind's `item` may be a song or an exercise** (widened
    2026-09-22). It used to have to be a song, and `technique.7` is what that
    was wrong about: its sentence is about the two-against-three exercise and
    its only songs are Czerny études, so the rule turned "play the exercise as
    a duet" into a button that opened a study. What replaced it is not weaker
    where it counts — the item must still be one of *this rung's* options — and
    where a catalog is given it is stronger, because an option with no file
    opens a drill screen and cannot be dueted against whatever its id says.

    `unlock` and `mode` (T16) belong to a `lab` entry and nowhere else. They
    replace the two-button shape Entry 24 item 5 put on six rungs, where the
    rung carried the preset once and again with nothing fixed; one button that
    names what it frees says the same thing and costs the lesson page one
    control instead of two.
    """
    errors: list[str] = []
    by_id = {item["id"]: item for item in catalog or []}
    for stage in curriculum.get("stages", []):
        for unit in stage.get("units", []):
            for lesson in unit.get("lessons", []):
                songs = set(lesson.get("songOptions", []))
                exercises = set(lesson.get("exerciseOptions", []))
                for tool in lesson.get("tools", []) or []:
                    kind = tool.get("kind")
                    where = f"{lesson.get('id', '?')}: tool {kind!r}"
                    if kind == "lab":
                        preset = tool.get("preset")
                        if preset is not None and preset not in LAB_PRESET_IDS:
                            errors.append(
                                f"{where} names preset {preset!r}, which the lab does not have"
                            )
                        unlock = tool.get("unlock")
                        if unlock is not None:
                            if preset is None:
                                errors.append(
                                    f"{where} frees {', '.join(unlock)} and names no preset, so "
                                    f"nothing is locked to free"
                                )
                            else:
                                locks = LAB_PRESET_LOCKS.get(preset, set())
                                for name in unlock:
                                    if name not in locks:
                                        errors.append(
                                            f"{where} frees {name!r}, which preset {preset!r} "
                                            f"does not lock"
                                        )
                        mode = tool.get("mode")
                        if mode is not None and mode not in LAB_BED_MODES:
                            errors.append(
                                f"{where} opens on {mode!r}, which is not one of the lab's three "
                                f"ways round"
                            )
                    else:
                        for field in ("unlock", "mode"):
                            if tool.get(field) is not None:
                                errors.append(
                                    f"{where} carries {field!r}, which only a 'lab' entry has"
                                )
                    if kind == "ladder":
                        # Stated, not inherited. `LessonScreen.ts` ignores
                        # `tool.item` on a ladder and opens the rung's first
                        # exercise that opens as notation, and `04` §3d,
                        # `curriculum/types.ts` and the schema all say an
                        # `item` written on one is refused. That refusal used
                        # to fall out of the narrow rule — an `item` had to be
                        # a *song*, and a ladder's exercise never is — and
                        # widening that rule to songs *or* exercises on
                        # 2026-09-22 quietly let it through, so a rung could
                        # name a piece the screen would not open.
                        if tool.get("item"):
                            errors.append(
                                f"{where} names {tool['item']!r}, and a ladder takes no item: "
                                f"it opens this rung's first exercise that is notation"
                            )
                    elif kind == "simon":
                        if tool.get("item") and tool["item"] not in exercises:
                            errors.append(
                                f"{where} opens {tool['item']!r}, which is not one of this "
                                f"rung's exercise options"
                            )
                    elif tool.get("item"):
                        item_id = tool["item"]
                        if item_id not in songs and item_id not in exercises:
                            errors.append(
                                f"{where} opens {item_id!r}, which is not one of this "
                                f"rung's song or exercise options"
                            )
                        elif kind in {"duet", "blind", "play"} and item_id in by_id:
                            if not by_id[item_id].get("file"):
                                errors.append(
                                    f"{where} opens {item_id!r}, which has no notation to open — "
                                    f"the catalog gives it no file, so it opens as a drill"
                                )
                    if kind in {"duet", "blind"} and not tool.get("item") and not songs:
                        errors.append(
                            f"{where} needs a piece and the rung offers no song, so the "
                            f"button would open nothing"
                        )
    return errors


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
                    # A rung that asks for no song run is short of no song (R23):
                    # `thin_lesson_errors` exempts it from the song count, so the
                    # page must not ask for songs the build does not require.
                    need_songs = max(0, min_options - len(songs)) if asks_for_songs(lesson) else 0
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
    section_warnings: list[str] = []
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
        errors += notation_requirements(curriculum, catalog)
        # C2, C5: vocabulary v0, and the rungs whose requirements no run can
        # evidence. The lesson rules the app does not judge are listed below.
        skills_file, demands_file = load_vocabulary()
        errors += vocabulary_errors(skills_file, demands_file, curriculum, catalog)
        errors += evidence_gate(curriculum, skills_file, catalog)[0]
        errors += tool_errors(curriculum, catalog)
        errors += paper_hint_errors(curriculum)
        errors += tip_errors(catalog, CONTENT_SRC / "tips")
        errors += video_index_errors()
        # Q82: once, since the fallback parses each sectioned file; its warnings are printed with the others below.
        found_section_errors, section_warnings = section_findings(catalog, args.dir)
        errors += found_section_errors
        errors += orphan_sections(catalog, CONTENT_SRC / "sources" / "sections.json")
        errors += excerpt_findings(catalog, args.dir)[0]
        # F2: a rung's concepts claim only what its options establish, or it introduces the concept.
        errors += concept_claim_findings(catalog, curriculum)[0]
        # CD1 §3a: a verified passage fact that could never prove what it names.
        import passages

        errors += passages.findings(catalog, curriculum)[0]
        # bf57baca §5: two current hand rows that disagree over the same bars, staff and voice.
        import verified_facts

        errors += verified_facts.hand_conflicts(
            verified_facts.load(),
            {row["id"]: verified_facts.identity_of(row) for row in catalog})
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
    # Tagged *and* carrying a file. A placeholder keeps the tag — that is how
    # the two builds keep the same ids — so counting the tag alone made a
    # strict build announce that it had bundled 159 items it had not, and told
    # the reader not to deploy a build that is exactly the one for deploying.
    personal_build = [
        item["id"]
        for item in catalog
        if PERSONAL_BUILD_TAG in (item.get("tags") or []) and item.get("file")
    ]
    personal_build_placeheld = [
        item["id"]
        for item in catalog
        if PERSONAL_BUILD_TAG in (item.get("tags") or []) and not item.get("file")
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
    if personal_build_placeheld:
        print(
            f"  {len(personal_build_placeheld)} item(s) whose composition is not public domain "
            "are placeholders in this build (docs/00 D23)."
        )
    if personal:
        # Loudly, every time: this build is not for a public URL.
        print(
            f"NOTE: {len(personal)} item(s) are CC BY-NC and bundled for a personal build "
            "(docs/00 D10a). Do not deploy this build publicly."
        )

    off_keyboard = notes_off_the_keyboard(args.dir, catalog)
    if off_keyboard:
        print(
            f"NOTE: {len(off_keyboard)} imported score(s) ask for keys an 88-note piano "
            "does not have; the generator refuses this and the importers do not:"
        )
        for item_id, name, midi in off_keyboard:
            edge = "above C8" if midi > KEYBOARD_TOP else "below A0"
            print(f"  {item_id}: {name} (midi {midi}), {edge}")

    # C5: the lesson rules no run can show, said out loud on every run, so
    # "nothing refused" is never read as "everything measured". Nothing is waived.
    skills_file, _ = load_vocabulary()
    _, gate_unjudged = evidence_gate(curriculum, skills_file, catalog)
    targeted = sum(1 for item in catalog if item.get("targetSkills"))
    print(
        f"  evidence gate (vocabulary v0): {len(gate_unjudged)} lesson rule(s) the app does not judge; "
        f"{targeted} item(s) declare targetSkills"
    )
    if gate_unjudged:
        print(f"    unjudged: {', '.join(gate_unjudged)}")
    # G2: the skills the data has not given transfer dimensions, credited no transfer, said on every run.
    unstated = skills_without_transfer(skills_file)
    print(
        f"  transfer (G2): {len(skills_file.get('skills', [])) - len(unstated)} skill(s) name their transfer dimensions; "
        f"{len(unstated)} without the block, credited no transfer"
        + (f": {', '.join(unstated)}" if unstated else "")
    )
    # E0b: where the vocabulary's teaching rungs differ from the lessons' concepts, said on every run.
    for warning in taught_at_findings(skills_file, load_vocabulary()[1], curriculum)[1]:
        print(f"  {warning}")
    # E1: an excerpt approved on parent bytes the parent no longer has, or not cut in this build.
    excerpt_rows = sum(1 for item in catalog if item.get("type") == "excerpt")
    print(f"  excerpts (E1): {excerpt_rows} cut, on no rung")
    for warning in excerpt_findings(catalog, args.dir)[1]:
        print(f"  WARNING (excerpt, E1): {warning}")
    print(f"  {rung_claims_warning(catalog, curriculum)}")
    # L120b: the rung-own options the gate refuses `untaught`, warned (never failed), the unread reading rows apart.
    for warning in untaught_options_warnings(catalog, curriculum):
        print(f"  {warning}")
    # F2: each deferred claim with its reason, and any introduced concept an option now establishes.
    for warning in concept_claim_findings(catalog, curriculum)[1]:
        print(f"  {warning}")
    # CD1 §3a: each stale verified passage fact, with why it counts for nothing.
    import passages

    for warning in passages.findings(catalog, curriculum)[1]:
        print(f"  {warning}")
    # Q80: the ladder report compared without the placeholders this build made for want of a fetch, said.
    for warning in ladder_report_findings(catalog, curriculum)[1]:
        print(f"  {warning}")
    # Q82: the named sections of a placeholder this build could not fetch, not checked, said.
    for warning in section_warnings:
        print(f"  WARNING (sections, Q82): {warning}")

    # Q-tooling (2026-09-29): the reviewer's views of the audit file and the matrix regenerated
    # and then compared, so a built tree never carries stale views (six record commits did on
    # 2026-09-29). On GitHub's runner they are compared, not written, so test_prompt_views still
    # sees the views as pushed. Here rather than in build.py, which another builder held this wave.
    sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tools" / "docs"))
    import split_prompt_views  # noqa: E402

    views_ok, views_line = split_prompt_views.refresh_for_validator()
    print(f"  {views_line}")
    if not views_ok:
        print(f"content validation FAILED: {views_line}", file=sys.stderr)
        sys.exit(1)

    # Last, so the build's one-line summary of this step is the verdict and the
    # item count rather than whichever detail happened to print last — the same
    # rule the importers follow. Everything above is the detail behind it.
    note = ladder_report_note()
    if note:
        print(note)
    print(f"content validation OK: {args.dir} ({len(catalog)} catalog items)")


if __name__ == "__main__":
    main()
