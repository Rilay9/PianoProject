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


def stale_ladder_report(catalog: list, curriculum: dict) -> list[str]:
    """
    replan §2.6: the committed ladder report has to match the catalog.

    Part D is a *report* of what is on each rung, and a generated report that
    nobody regenerates is exactly the hand-written table it replaced. So the
    build fails when it drifts, which is the same mechanism a formatted-file
    check uses.

    A missing report is not an error: the file is generated, and a checkout
    that has not run the generator yet should not fail for it. It is *said*
    though — see `ladder_report_note` — because a rule that disappears in
    silence when its input is missing is a rule that stops working the day
    somebody deletes the file, and nobody finds out.
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
    ("3.5", "song.classical.pachelbel-canon-d.easy"),
    ("3.6", "song.classical.pachelbel-canon-d.easy"),
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


def section_errors(
    catalog: list, content_dir: Path, report_path: Path = RENDER_REPORT
) -> list[str]:
    """
    replan/`04` §5: a named section has to name bars the piece actually has.

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
    """
    errors: list[str] = []
    with_sections = [
        item for item in catalog if (item.get("teaching") or {}).get("sections")
    ]
    if not with_sections:
        return errors
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
    "minor-triad": {"mode": "minor"},
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


def tool_errors(curriculum: dict) -> list[str]:
    """
    A rung's tools must open something the rung actually has.

    Two ways to point at nothing, and both would draw a button that lands the
    learner somewhere wrong rather than failing loudly: a lab preset the lab has
    never heard of, and an `item` that is not among this rung's own song
    options. The second is the important one — a lesson that sends you to a
    piece it does not offer is the `blues.3` fault wearing a control.
    """
    errors: list[str] = []
    for stage in curriculum.get("stages", []):
        for unit in stage.get("units", []):
            for lesson in unit.get("lessons", []):
                songs = set(lesson.get("songOptions", []))
                for tool in lesson.get("tools", []) or []:
                    kind = tool.get("kind")
                    where = f"{lesson.get('id', '?')}: tool {kind!r}"
                    if kind == "lab":
                        preset = tool.get("preset")
                        if preset is not None and preset not in LAB_PRESET_IDS:
                            errors.append(
                                f"{where} names preset {preset!r}, which the lab does not have"
                            )
                    if tool.get("item") and tool["item"] not in songs:
                        errors.append(
                            f"{where} opens {tool['item']!r}, which is not one of this "
                            f"rung's song options"
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
        errors += notation_requirements(curriculum, catalog)
        errors += tool_errors(curriculum)
        errors += paper_hint_errors(curriculum)
        errors += tip_errors(catalog, CONTENT_SRC / "tips")
        errors += section_errors(catalog, args.dir)
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

    # Last, so the build's one-line summary of this step is the verdict and the
    # item count rather than whichever detail happened to print last — the same
    # rule the importers follow. Everything above is the detail behind it.
    note = ladder_report_note()
    if note:
        print(note)
    print(f"content validation OK: {args.dir} ({len(catalog)} catalog items)")


if __name__ == "__main__":
    main()
