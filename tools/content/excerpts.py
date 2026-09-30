#!/usr/bin/env python3
"""
The excerpt as a first-class content object (E1; Part 24, R5, R7, R15, R35, R40, R42).

An excerpt is not a bar range on its parent. It is a catalogue item of its own type, cut by the
build from the parent's *built* score file into its own file, so that everything downstream —
E0's measurement through the bridge, the provenance, D2's identity and record, the one gate and
the screens — reads the passage the learner is given and nothing of the piece around it. A
named section (`content/sources/sections.json`, `teaching.sections`) is a different thing — a
loop over bars of a whole item — and nothing here reads or writes one.

**The definition** is a row of `content/sources/excerpts.json`, written by `--merge` from the
workbench's exported decisions and read by the build: `of` (the parent's catalogue id),
`fromBar`/`toBar` (printed bars, 1-based, the pickup counted as bar 1, as `sections.json` and
the model's `sourceMeasureIndex` count), `selection` (`both`, `right`, `left`), `targets`
(vocabulary skill or demand ids it was approved for), `label`, `note`, `parentSha256` (the
parent's built file the reviewer approved against) and the approving event (`event`, `by`,
`at`). Rejections are kept beside them (`rejected`) so a re-merge is idempotent both ways.

**Identity.** The id is derived from the definition and nothing else:
`excerpt.<parent id without its leading "song.">.b<from>-<to>` with `.rh`/`.lh` for a one-hand
selection. The chain key (`chain_key`) is sha256 over the parent's built bytes, the range, the
selection and `CUT_VERSION`: the same bars with the other hand are another id and key; an
endpoint moved one bar is another id, key and file; a parent whose catalogue metadata changed
leaves the cut byte-identical and the key unchanged; a parent whose file changed gives another
key (and other bytes where its notes changed), and the row's recorded `parentSha256` no longer
matches — stale by provenance, which `validate.py` names. The cut file's own sha256 is D2's
identity (`review.current_identity`), unchanged in shape.

**The cut** (`cut`): music21 over the parent's built file by printed position, never the
archive or the raw source; the clef, key, time and tempo in force at the cut carried into its
first bar; a pickup kept when the row starts at bar 1; a tie into the first bar severed (a plain
note) and a tie out of the last bar dropped; a repeat sign at either edge neutralised (the
passage is presented once) and one inside the range refused with its bar named, as is a first-or-
second ending or a jump (segno, coda, D.C., D.S.) — unrolled, the cut would mean something else;
the unselected staff of a one-hand cut silenced and left out by `convert.drop_silent_staves`
through `convert.normalise`, the pipeline every score goes through; the edition's texts that are not
the music left out — a direction to other players, a copyright or licence line, a swing the app does
not play — each listed in the provenance's `dropped` with its kind (E33, `EDITION_TEXTS`); and a normalised header —
the excerpt's id as the work title, none of the parent's credits, no encoding date — so the
cut's bytes depend on the notes and the definition alone. Attribution is never lost by that: the
excerpt's catalogue `source` is the parent's, and every screen that shows an item's source shows
it.

**Mining proposes and creates no truth**: `excerpts.py propose …` is `excerpt_proposer.py`
(the windows and their signals); only an approved row is cut, and only the cut's own detector
pass becomes catalogue truth.

    python tools/content/excerpts.py propose --for interval.leap --rung 1.5 [--of ID] [--bars 4..8]
    python tools/content/excerpts.py --merge excerpt-decisions.jsonl
    python tools/content/excerpts.py --candidate-rungs [--out FILE]
"""
from __future__ import annotations

import argparse
import copy
import hashlib
import json
import re
import sys
import zipfile
from dataclasses import dataclass, field
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import CONTENT_SRC, DEFAULT_OUT  # noqa: E402

#: Bumped with the cutter: every excerpt's key changes, and the build re-cuts every file. Version 2
#: (E33) drops the edition's texts that are not the music (`EDITION_TEXTS`). An approval merged under an
#: older cutter is stale by cut version (`provenance_block`, `validate.excerpt_findings`): nothing carries
#: it to the new cut, and a person re-decides it.
CUT_VERSION = 2

#: The cutter every approval merged before E33 was made under: a row with no `cutVersion` predates the field.
CUT_VERSION_BEFORE_THE_FIELD = 1


def approved_cut_version(row: dict) -> int:
    """The cutter an approval was merged under (`cutVersion`; version 1 where the row predates the field)."""
    return int(row.get("cutVersion") or CUT_VERSION_BEFORE_THE_FIELD)

SELECTIONS = ("both", "right", "left")
HAND_SUFFIX = {"both": "", "right": ".rh", "left": ".lh"}
#: The staff each one-hand selection keeps (the upper staff is the right hand's, as E0's
#: detectors and the app's model read a grand staff).
KEEP_STAFF = {"right": 0, "left": 1}

DEFINITIONS = CONTENT_SRC / "sources" / "excerpts.json"
#: Where the build writes the cuts, under the built content.
SCORES_SUBDIR = Path("scores") / "excerpts"
#: The parent's tags that travel with its passage: the licence decisions (a cut of a
#: personal-build or CC BY-NC edition is one too) and a tempo the converter supplied.
INHERITED_TAGS = ("personal-build", "nc-personal-build", "tempo-defaulted")

EVENT_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{5,79}$")
TIMESTAMP = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$")
DECISIONS = ("approve", "adjust", "reject")


# --------------------------------------------------------------------------------------
# identity
# --------------------------------------------------------------------------------------


def excerpt_id(parent_id: str, from_bar: int, to_bar: int, selection: str) -> str:
    """The excerpt's id, from its definition and nothing else (never a title)."""
    if selection not in SELECTIONS:
        raise ValueError(f"selection {selection!r} is not one of {', '.join(SELECTIONS)}")
    stem = parent_id[len("song."):] if parent_id.startswith("song.") else parent_id
    return f"excerpt.{stem}.b{int(from_bar)}-{int(to_bar)}{HAND_SUFFIX[selection]}"


def chain_key(parent_sha256: str, from_bar: int, to_bar: int, selection: str, cut_version: int = CUT_VERSION) -> str:
    """sha256 over the parent's built bytes, the printed range, the selection and the cut version."""
    text = f"{parent_sha256}|{int(from_bar)}|{int(to_bar)}|{selection}|{int(cut_version)}"
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def sha256_of(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


# --------------------------------------------------------------------------------------
# the definitions file
# --------------------------------------------------------------------------------------

COMMENT = [
    "Approved excerpts: each row a passage of a bundled score that the build cuts into its own file",
    "and catalogue item (E1; docs/03 §4c). Written by `python tools/content/excerpts.py --merge` from",
    "the microscope's excerpt view (#/dev/microscope/excerpts) and read by the build; not edited by hand.",
    "",
    "`fromBar`/`toBar` are **1-based positions in the printed score**: bar 1 is the first printed bar, a",
    "pickup included — what `sections.json` counts and the model's `sourceMeasureIndex` counts from. A",
    "range across a repeat sign, a first-or-second ending or a jump refuses at build, with the bars named.",
    "",
    "`selection` is the hands the learner is given: `both`, `right` (the upper staff alone) or `left`.",
    "`targets` are vocabulary skill or demand ids the passage was approved for, never an invented name.",
    "`parentSha256` is the parent's built file the approval was made against: when the parent's file",
    "changes the validator names the row as stale. `event`, `by` and `at` are the approving decision.",
    "`cutVersion` is the cutter the approval was merged under (a row without one predates the field: version",
    "1); an approval under an older cutter is stale by cut version, and nothing carries it to the new cut.",
    "",
    "`rejected` keeps the refusals with their reasons, so a re-merge of the same export appends nothing.",
    "`superseded` (written once there is one) keeps each approval a person re-decided after it went stale, by",
    "parent bytes or by cut version: the old row as it was, with `supersededBy`, the event that replaced it. A",
    "renewal names the parent's current bytes and is merged under the cutter in force; nothing renews by itself.",
    "",
    "An excerpt is on no rung: placement is F's, on a candidate-rungs line established on the combined",
    "build and a current `goodTeachingUse: yes` on the cut's identity in D2's record by a named reviewer.",
]


def read_definitions(path: Path = DEFINITIONS) -> dict:
    if not path.is_file():
        return {"_comment": COMMENT, "excerpts": [], "rejected": [], "superseded": []}
    data = json.loads(path.read_text(encoding="utf-8"))
    data.setdefault("excerpts", [])
    data.setdefault("rejected", [])
    data.setdefault("superseded", [])
    return data


def serialise_definitions(data: dict) -> str:
    """
    The file's one serialisation: the merge always writes it this way, so a round-trip is byte-identical.
    `superseded` (E51) is written only when it holds a row, so a file no renewal touched keeps its bytes.
    """
    ordered = {"_comment": data.get("_comment") or COMMENT, "excerpts": data.get("excerpts") or [],
               "rejected": data.get("rejected") or []}
    if data.get("superseded"):
        ordered["superseded"] = data["superseded"]
    return json.dumps(ordered, indent=2, ensure_ascii=False) + "\n"


def write_definitions(data: dict, path: Path = DEFINITIONS) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write(serialise_definitions(data))


# --------------------------------------------------------------------------------------
# the cutter
# --------------------------------------------------------------------------------------


class CutRefused(ValueError):
    """A definition the cutter will not cut, and why (the bars named)."""


@dataclass
class Cut:
    path: Path
    bars: int
    staves: int
    notes: int
    tempo_bpm: float
    time: str | None
    level: float
    drivers: list = field(default_factory=list)
    warnings: list = field(default_factory=list)
    #: The edition's texts the cutter left out (E33), each `{bar, parentBar, staff, kind, text, why}`.
    dropped: list = field(default_factory=list)


#: E33: the edition's texts that are not the music a learner plays, left out of a cut, by kind and in this
#: order (the first that matches names the kind). Everything else a `<words>` direction says is kept: a
#: tempo or expression word, a chord symbol written as words, a metronome mark written as text — and
#: dynamics, rehearsal letters and tempo marks are not words at all. The word lists are read off the
#: approved cuts and PDMX's lead sheets (hypotheses, each a list of words and never a reading of the
#: passage); "bass" is not among the players, since a piano score's own bass is the left hand.
EDITION_TEXTS: tuple[tuple[str, re.Pattern[str], str], ...] = (
    ("copyright",
     re.compile(r"public\s+domain|copyright|©|\(c\)\s*\d|all\s+rights\s+reserved|creative\s+commons|"
                r"\bcc[\s-]?(?:by|0|zero)\b|https?://|www\.", re.I),
     "a copyright or licence line: the attribution is the catalogue row's, not the page's"),
    ("swing",
     re.compile(r"\b(?:swing|swung|shuffle)\b", re.I),
     "a swing the app does not play: its playback keeps the eighths straight, so the cut does not print it"),
    ("band",
     re.compile(r"\b(?:sax(?:ophone)?s?|drums?|drummer|guitars?|trumpets?|trombones?|horns?|clarinets?|violins?|"
                r"vocals?|singers?|band|rhythm\s+section|tutti|tacet|solos?|impro(?:v(?:isation)?)?)\b", re.I),
     "a direction to other players: the learner plays the piano part alone"),
)


def edition_text_kind(text: str) -> tuple[str, str] | None:
    """The kind of edition text a `<words>` direction is, and why a cut leaves it out; None for the music's."""
    for kind, pattern, why in EDITION_TEXTS:
        if pattern.search(text):
            return kind, why
    return None


def _drop_edition_texts(measure) -> list[tuple[str, str, str]]:
    """Removes the edition's texts from one bar of a cut: `(kind, text, why)` each; an empty one silently."""
    from music21 import expressions

    dropped: list[tuple[str, str, str]] = []
    for element in list(measure.recurse().getElementsByClass(expressions.TextExpression)):
        text = (element.content or "").strip()
        found = edition_text_kind(text) if text else ("empty", "")
        if found is None:
            continue
        element.activeSite.remove(element)
        if text:
            dropped.append((found[0], text, found[1]))
    return dropped


def _measures(staff) -> list:
    from music21 import stream

    return list(staff.getElementsByClass(stream.Measure))


def printed_bar_count(score) -> int:
    parts = list(score.parts)
    return len(_measures(parts[0])) if parts else 0


def crossings(score, from_bar: int, to_bar: int) -> list[str]:
    """
    What in the range would make the cut mean something else unrolled: a repeat sign on a
    barline inside it (one at either edge is neutralised by the cut, not refused), a first-or-
    second ending over any bar of it, a jump (segno, coda, D.C., D.S.) in it. Each named with
    its printed bar.
    """
    from music21 import bar, repeat, spanner

    faults: list[str] = []
    for staff in score.parts:
        measures = _measures(staff)
        position = {id(m): i + 1 for i, m in enumerate(measures)}
        for number in range(from_bar, min(to_bar, len(measures)) + 1):
            measure = measures[number - 1]
            if isinstance(measure.leftBarline, bar.Repeat) and number != from_bar:
                faults.append(f"a repeat sign opens bar {number}")
            if isinstance(measure.rightBarline, bar.Repeat) and number != to_bar:
                faults.append(f"a repeat sign closes bar {number}")
            for mark in measure.recurse().getElementsByClass(repeat.RepeatExpression):
                if isinstance(mark, repeat.Fine):
                    continue
                faults.append(f"a {type(mark).__name__} mark in bar {number}")
        for bracket in list(score.spannerBundle.getByClass(spanner.RepeatBracket)) + list(
            staff.spannerBundle.getByClass(spanner.RepeatBracket)
        ):
            spanned = [position[id(m)] for m in bracket.getSpannedElements() if id(m) in position]
            if spanned and min(spanned) <= to_bar and max(spanned) >= from_bar:
                first, last = min(spanned), max(spanned)
                where = f"bar {first}" if first == last else f"bars {first}–{last}"
                faults.append(f"a first-or-second ending over {where}")
    return list(dict.fromkeys(faults))


def _sever_ties(measure, at_start: bool) -> int:
    """A tie into the first bar becomes a plain note; a tie out of the last bar is dropped."""
    from music21 import tie

    changed = 0
    for element in measure.recurse().notes:
        notes = list(element.notes) if element.isChord else [element]
        for one in [element, *notes] if element.isChord else notes:
            current = one.tie
            if current is None:
                continue
            if at_start and current.type in ("stop", "continue"):
                one.tie = None if current.type == "stop" else tie.Tie("start")
                changed += 1
            elif not at_start and current.type in ("start", "continue"):
                one.tie = None if current.type == "start" else tie.Tie("stop")
                changed += 1
    return changed


def _carry_state_in(staff, first_measure, source_staff, first_offset: float) -> None:
    """The clef, key, time and tempo in force at the cut, inside its first bar at offset 0."""
    from music21 import clef, key, meter, tempo

    for cls in (clef.Clef, key.KeySignature, meter.TimeSignature, tempo.MetronomeMark):
        inside = [e for e in first_measure.getElementsByClass(cls) if first_measure.elementOffset(e) == 0]
        loose = [e for e in staff.getElementsByClass(cls) if staff.elementOffset(e) == 0]
        for element in loose:
            staff.remove(element)
        if inside:
            continue
        carried = loose[0] if loose else None
        if carried is None:
            # `measures()` collects the clef, key and time; a tempo mark it may not. The last
            # one at or before the cut on the parent's staff is the tempo in force there.
            flat = source_staff.flatten()
            before = [e for e in flat.getElementsByClass(cls) if flat.elementOffset(e) <= first_offset + 1e-9]
            carried = copy.deepcopy(before[-1]) if before else None
        if carried is not None:
            first_measure.insert(0, carried)


def cut_score(score, from_bar: int, to_bar: int, selection: str, excerpt: str):
    """
    The cut as a normalised music21 score, the converter's result for it, and the edition's texts left
    out of it (E33, `EDITION_TEXTS`), each with the cut's bar, the parent's printed bar and the staff.
    """
    from music21 import bar, layout, metadata

    from convert import ConversionError, normalise

    if selection not in SELECTIONS:
        raise CutRefused(f"selection {selection!r} is not one of {', '.join(SELECTIONS)}")
    parts = list(score.parts)
    printed = printed_bar_count(score)
    if not 1 <= from_bar <= to_bar <= printed:
        raise CutRefused(f"bars {from_bar}–{to_bar} are not inside the parent's {printed} printed bar(s)")
    if selection != "both" and len(parts) < 2:
        raise CutRefused(f"a {selection}-hand cut needs two staves; the parent has {len(parts)}")
    faults = crossings(score, from_bar, to_bar)
    if faults:
        raise CutRefused(f"bars {from_bar}–{to_bar}: " + "; ".join(faults) + " (unrolled, the cut would mean something else)")

    first_offsets = [_measures(p)[from_bar - 1].getOffsetBySite(p) for p in parts]
    pickup = from_bar == 1 and (float(_measures(parts[0])[0].paddingLeft or 0) > 0 or _measures(parts[0])[0].number == 0)
    excerpt_score = score.measures(from_bar - 1, to_bar, indicesNotNumbers=True)
    staves = list(excerpt_score.parts)
    dropped: list[dict] = []
    for index, staff in enumerate(staves):
        measures = _measures(staff)
        if not measures:
            continue
        _carry_state_in(staff, measures[0], parts[index], first_offsets[index])
        for measure in measures:
            for element in list(measure.recurse().getElementsByClass((layout.SystemLayout, layout.StaffLayout, layout.PageLayout))):
                element.activeSite.remove(element)
        _sever_ties(measures[0], at_start=True)
        _sever_ties(measures[-1], at_start=False)
        if isinstance(measures[0].leftBarline, bar.Repeat):
            measures[0].leftBarline = None
        measures[-1].rightBarline = bar.Barline("final")
        for position, measure in enumerate(measures):
            measure.number = position if pickup else position + 1
            for kind, text, why in _drop_edition_texts(measure):
                # The unselected staff of a one-hand cut leaves with all it says; only the kept staves' are listed.
                if selection == "both" or index == KEEP_STAFF[selection]:
                    dropped.append({"bar": measure.number, "parentBar": from_bar + position, "staff": index + 1,
                                    "kind": kind, "text": text, "why": why})
        if selection != "both" and index != KEEP_STAFF[selection]:
            for element in list(staff.recurse().notes):
                element.activeSite.remove(element)
    # A spanner severed by the cut (a slur that starts before it or ends after it) is dropped:
    # an end drawn with nothing to join is not what the page says.
    present = {id(n) for n in excerpt_score.recurse().notesAndRests}
    for bundle in [excerpt_score.spannerBundle] + [s.spannerBundle for s in staves]:
        for one in list(bundle):
            if type(one).__name__ in ("StaffGroup",):
                continue
            if any(id(e) not in present for e in one.getSpannedElements()):
                for owner in [excerpt_score, *staves]:
                    if one in owner.spannerBundle:
                        owner.remove(one)
    fresh = metadata.Metadata()
    fresh.title = excerpt
    fresh.movementName = excerpt
    excerpt_score.metadata = fresh
    for element in list(excerpt_score.getElementsByClass(metadata.Metadata)):
        if element is not fresh:
            excerpt_score.remove(element)
    try:
        normalised, result = normalise(excerpt_score, keep_lyrics=True, tempo_bpm=None)
    except ConversionError as error:
        raise CutRefused(f"bars {from_bar}–{to_bar}: the converter refused the cut: {error}") from error
    if selection == "both" and len(parts) >= 2 and result.staves < 2:
        silent = [i for i, p in enumerate(staves) if not any(True for _ in p.recurse().notes)]
        hand = "right" if silent == [1] else "left"
        raise CutRefused(f"bars {from_bar}–{to_bar}: one hand is silent throughout; select {hand}")
    # By bar, then staff; within one bar and staff, in the order the page prints them.
    dropped.sort(key=lambda one: (one["bar"], one["staff"]))
    return normalised, result, dropped


#: The header lines whose bytes depend on when and by what the file was written, or on the
#: parent's edition: never in a cut.
_IDENTIFICATION = re.compile(r"\s*<identification>.*?</identification>", re.S)
_CREDIT = re.compile(r"\s*<credit[ >].*?</credit>", re.S)
_WORK = re.compile(r"<work>.*?</work>", re.S)
_MOVEMENT = re.compile(r"<movement-title>.*?</movement-title>", re.S)


def normalise_header(xml_text: str, excerpt: str) -> str:
    """
    The excerpt's id as the work and movement title; no identification (composer, rights,
    encoding date, software) and no credit: the cut's bytes depend on its notes and its
    definition alone. The parent's attribution lives in the catalogue row, not the file.
    """
    text = _IDENTIFICATION.sub("", xml_text)
    text = _CREDIT.sub("", text)
    work = f"<work>\n    <work-title>{excerpt}</work-title>\n  </work>"
    text = _WORK.sub(work, text, count=1) if _WORK.search(text) else re.sub(
        r"(<score-partwise[^>]*>)", r"\1\n  " + work, text, count=1)
    movement = f"<movement-title>{excerpt}</movement-title>"
    text = _MOVEMENT.sub(movement, text, count=1) if _MOVEMENT.search(text) else text.replace(
        work, work + "\n  " + movement, 1)
    return text


def write_cut(score, dest: Path, excerpt: str) -> Path:
    """`convert.write_mxl`, then the header normalised inside the archive, zip entries pinned."""
    from convert import ZIP_EPOCH, replace_atomically, write_mxl

    write_mxl(score, dest)
    with zipfile.ZipFile(dest) as archive:
        entries = [(info.filename, archive.read(info.filename)) for info in archive.infolist()]
    # The score's entry is named after the excerpt, not after wherever the file was written, so
    # the archive's bytes do not depend on the path it was cut to.
    inner = f"{excerpt}.musicxml"
    written = next((name for name, _data in entries
                    if name.lower().endswith((".xml", ".musicxml")) and not name.startswith("META-INF")), None)
    staged = dest.with_suffix(dest.suffix + ".tmp")
    with zipfile.ZipFile(staged, "w", zipfile.ZIP_DEFLATED) as archive:
        for name, data in entries:
            if name == written:
                data = normalise_header(data.decode("utf-8"), excerpt).encode("utf-8")
                name = inner
            elif name == "META-INF/container.xml" and written is not None:
                data = data.decode("utf-8").replace(f'full-path="{written}"', f'full-path="{inner}"').encode("utf-8")
            info = zipfile.ZipInfo(name, date_time=ZIP_EPOCH)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o600 << 16
            archive.writestr(info, data)
    replace_atomically(staged, dest)
    return dest


def cut(parent_path: Path, from_bar: int, to_bar: int, selection: str, excerpt: str, dest: Path) -> Cut:
    """Cuts the passage out of the parent's built file into `dest` and says what it made."""
    from music21 import converter, meter

    import difficulty

    score = converter.parse(str(parent_path))
    normalised, result, dropped = cut_score(score, from_bar, to_bar, selection, excerpt)
    write_cut(normalised, dest, excerpt)
    estimate = difficulty.estimate(difficulty.features(normalised))
    times = [f"{t.numerator}/{t.denominator}" for t in normalised.recurse().getElementsByClass(meter.TimeSignature)]
    return Cut(path=dest, bars=result.measures, staves=result.staves, notes=result.note_events,
               tempo_bpm=result.tempo_bpm, time=times[0] if times else None, level=estimate.level,
               drivers=list(estimate.drivers), warnings=list(result.warnings), dropped=dropped)


# --------------------------------------------------------------------------------------
# the build's step
# --------------------------------------------------------------------------------------


def title_for(row: dict, parent: dict) -> str:
    """The row's label, or "<parent title>, bars a–b" (display only; never part of the identity)."""
    label = (row.get("label") or "").strip()
    if label:
        return label
    hands = {"right": ", right hand", "left": ", left hand"}.get(row.get("selection") or "both", "")
    low, high = int(row["fromBar"]), int(row["toBar"])
    bars = f"bar {low}" if low == high else f"bars {low}–{high}"
    return f"{parent.get('title') or parent['id']}, {bars}{hands}"


def concepts_for(targets: list[str]) -> list[str]:
    """The targets' lesson concepts where the vocabulary maps them; else none."""
    import claims

    skills, demands = claims.load_vocabulary()
    naming = claims.concepts_naming(skills, demands)
    known_path = CONTENT_SRC / "curriculum" / "concepts.json"
    known: set[str] = set()
    if known_path.is_file():
        data = json.loads(known_path.read_text(encoding="utf-8"))
        rows = data.get("concepts", data) if isinstance(data, dict) else data
        if isinstance(rows, dict):
            known = set(rows)
        else:
            known = {r.get("id") for r in rows if isinstance(r, dict)}
    # A concept several lesson concepts share one demand under (the left-hand pattern: alberti,
    # waltz, oom-pah, boogie, stride…) says nothing the demand does not: which one the passage is,
    # the vocabulary cannot tell, so none of them is claimed.
    shared = {demand for demand in demands if sum(1 for d in claims.CONCEPT_DEMANDS.values() if d == demand) > 1}
    out: list[str] = []
    for target in targets:
        found = [target] if target in skills else ([] if target in shared else sorted(naming.get(target, set())))
        for concept in found:
            if (not known or concept in known) and concept not in out:
                out.append(concept)
    return out


def entry_for(row: dict, parent: dict, made: Cut, rel_file: str) -> dict:
    """The excerpt's catalogue row, from its definition, its parent and its cut."""
    selection = row.get("selection") or "both"
    eid = excerpt_id(parent["id"], row["fromBar"], row["toBar"], selection)
    tags = [t for t in (parent.get("tags") or []) if t in INHERITED_TAGS]
    entry: dict = {
        "id": eid,
        "type": "excerpt",
        "title": title_for(row, parent),
        "excerptOf": parent["id"],
        "level": made.level,
        "levelSource": "estimated",
        "hands": selection,
        "tracks": list(parent.get("tracks") or ["core"]),
        "concepts": concepts_for(list(row.get("targets") or [])),
        # The parent's attribution, whole: the cut's header carries none (docs/03 §4c).
        "source": copy.deepcopy(parent["source"]),
        "file": rel_file,
        "tempoBpm": made.tempo_bpm,
        "tags": tags,
    }
    for name in ("composer", "arranger", "compositionStatus"):
        if parent.get(name) is not None:
            entry[name] = parent[name]
    if made.time:
        entry["timeSig"] = made.time
    return entry


def settle_key(entry: dict, parent: dict) -> None:
    """
    The piece's key on the excerpt, where the piece has one key and the cut carries it: a parent that
    changes key, or a cut whose signature is not the parent's, says nothing (the Library prints no key).
    Run once the notation is read (`build.attach_provenance`'s excerpt pass).
    """
    keys = (parent.get("notation") or {}).get("keys") or []
    mine = (entry.get("notation") or {}).get("keys") or []
    if len(keys) == 1 and parent.get("keySig") and mine and mine[0].get("fifths") == keys[0].get("fifths"):
        entry["keySig"] = parent["keySig"]


def attach_excerpts(entries: list[dict], out_dir: Path, path: Path = DEFINITIONS) -> tuple[int, list[str], list[str]]:
    """
    Cuts every approved row out of its parent's built file into `scores/excerpts/<id>.mxl` and
    adds its catalogue row (E1 item 3). Runs after the parents' files exist and before the
    notation, demands and provenance steps, which then treat the cut as any other file.

    A parent this build does not bundle (a licence placeholder in a strict build) gives no cut:
    the build refuses the passage where it refuses the piece. A row the cutter refuses (a
    range across a repeat sign, a missing parent) stops the build, named.

    Returns (cut, not cut for the licence, refusals).
    """
    data = read_definitions(path)
    by_id = {entry["id"]: entry for entry in entries}
    made = 0
    unbundled: list[str] = []
    refusals: list[str] = []
    for row in data.get("excerpts") or []:
        selection = row.get("selection") or "both"
        parent = by_id.get(row.get("of"))
        eid = excerpt_id(str(row.get("of")), int(row["fromBar"]), int(row["toBar"]), selection)
        if parent is None:
            refusals.append(f"{eid}: its parent {row.get('of')!r} is not in the catalogue")
            continue
        if not parent.get("file"):
            unbundled.append(f"{eid}: its parent is not bundled in this build (a placeholder), so neither is the cut")
            continue
        parent_path = out_dir / parent["file"]
        if not parent_path.is_file():
            refusals.append(f"{eid}: its parent's file {parent['file']} was not built")
            continue
        rel = (SCORES_SUBDIR / f"{eid}.mxl").as_posix()
        try:
            cutting = cut(parent_path, int(row["fromBar"]), int(row["toBar"]), selection, eid, out_dir / rel)
        except CutRefused as refused:
            refusals.append(f"{eid}: {refused}")
            continue
        entry = entry_for(row, parent, cutting, rel)
        parent_sha = sha256_of(parent_path)
        # Carried to `attach_provenance` on the entry and removed there: the definition and the
        # parent's bytes at cut time.
        entry["_excerpt"] = {
            "of": parent["id"],
            "fromBar": int(row["fromBar"]),
            "toBar": int(row["toBar"]),
            "selection": selection,
            "targets": list(row.get("targets") or []),
            "event": row.get("event"),
            "by": row.get("by"),
            "approvedParentSha256": row.get("parentSha256"),
            "parentSha256": parent_sha,
            "approvedCutVersion": approved_cut_version(row),
            "dropped": cutting.dropped,
            "levelDrivers": [[name, value] for name, value in cutting.drivers],
            "cutWarnings": cutting.warnings,
        }
        entries.append(entry)
        made += 1
    entries.sort(key=lambda item: item["id"])
    return made, unbundled, refusals


def provenance_block(entry: dict, parent_record: dict) -> dict:
    """The provenance's `excerpt` block (E1 item 4), from the carried definition and the parent's record."""
    carried = entry["_excerpt"]
    block = {
        "of": carried["of"],
        "fromBar": carried["fromBar"],
        "toBar": carried["toBar"],
        "selection": carried["selection"],
        "cutVersion": CUT_VERSION,
        "parentSha256": carried["parentSha256"],
        "parentEdition": parent_record.get("edition"),
        "key": chain_key(carried["parentSha256"], carried["fromBar"], carried["toBar"], carried["selection"]),
        "targets": carried["targets"],
        "event": carried["event"],
    }
    # E33: the edition's texts the cutter left out, the swing it plays straight among them — said here, not printed.
    if carried.get("dropped"):
        block["dropped"] = list(carried["dropped"])
    # E33: the cutter the approval was merged under, beside the one that cut this file. Below `cutVersion`,
    # the approval is stale by cut version: it was made before this cutter, and nothing carries it over
    # (the validator names the row). `stale` keeps its one meaning: an approval made on other parent bytes.
    block["approvedCutVersion"] = int(carried.get("approvedCutVersion") or CUT_VERSION_BEFORE_THE_FIELD)
    approved = carried.get("approvedParentSha256")
    if approved and approved != carried["parentSha256"]:
        block["stale"] = {
            "approvedParentSha256": approved,
            "why": "the parent's built file changed since the boundary was approved: the approval was made on other bytes",
        }
    return block


# --------------------------------------------------------------------------------------
# the merge
# --------------------------------------------------------------------------------------


def decision_fault(event: object) -> str | None:
    """Why an exported decision line is not one this merge takes, or None."""
    if not isinstance(event, dict):
        return "not an object"
    for key in ("v", "event", "decision", "of", "fromBar", "toBar", "selection", "by", "at"):
        if key not in event:
            return f"no {key}"
    if event["v"] != 1:
        return f"version {event['v']!r} is not 1"
    if not isinstance(event["event"], str) or not EVENT_ID.match(event["event"]):
        return "the event id is malformed"
    if event["decision"] not in DECISIONS:
        return f"decision {event['decision']!r} is not one of {', '.join(DECISIONS)}"
    if event["selection"] not in SELECTIONS:
        return f"selection {event['selection']!r} is not one of {', '.join(SELECTIONS)}"
    if not all(isinstance(event[k], int) and event[k] >= 1 for k in ("fromBar", "toBar")) or event["toBar"] < event["fromBar"]:
        return "the range is not two printed bars, the first no later than the last"
    if not isinstance(event["at"], str) or not TIMESTAMP.match(event["at"]):
        return "the time is not an ISO instant with milliseconds and Z"
    if not str(event["by"]).strip():
        return "no reviewer"
    if event["decision"] == "reject":
        if not str(event.get("reason") or "").strip():
            return "a rejection needs a reason"
    else:
        targets = event.get("targets")
        if not isinstance(targets, list) or not targets or not all(isinstance(t, str) and t for t in targets):
            return "an approval names the targets it was approved for"
    return None


def _row_of(event: dict) -> dict:
    row = {
        "of": event["of"],
        "fromBar": event["fromBar"],
        "toBar": event["toBar"],
        "selection": event["selection"],
    }
    if event["decision"] == "reject":
        row["targets"] = list(event.get("targets") or [])
        row["reason"] = event["reason"]
    else:
        row["targets"] = list(event["targets"])
        row["label"] = str(event.get("label") or "")
        row["note"] = str(event.get("note") or "")
        if event["decision"] == "adjust" and isinstance(event.get("proposed"), dict):
            row["proposed"] = {"fromBar": event["proposed"].get("fromBar"), "toBar": event["proposed"].get("toBar")}
    if event.get("parentSha256"):
        row["parentSha256"] = event["parentSha256"]
    row.update({"event": event["event"], "by": event["by"], "at": event["at"]})
    if event["decision"] != "reject":
        # E33: the cutter the approval is merged under; a later cutter makes it stale by cut version.
        row["cutVersion"] = CUT_VERSION
    return row


def _same_decision(stored: dict, incoming: dict) -> bool:
    """One event's row as stored and as merged again: the same decision whichever cutter each merge ran under."""
    def strip(row: dict) -> dict:
        return {k: v for k, v in row.items() if k != "cutVersion"}

    return strip(stored) == strip(incoming)


def approval_staleness(row: dict, current_parent_sha: str | None) -> list[str]:
    """
    Why a stored approved row is stale, in the validator's terms (`validate.excerpt_findings`), or [] when it is
    current: stale by provenance where its `parentSha256` is present and is not the parent's current built bytes
    (judged only when those bytes are given), stale by cut version where it was merged under another cutter than
    `CUT_VERSION` (a row with no `cutVersion` under version 1, `approved_cut_version`).
    """
    why: list[str] = []
    approved = row.get("parentSha256")
    if current_parent_sha and approved and approved != current_parent_sha:
        why.append(f"stale by provenance: approved on the parent's bytes {approved[:12]}…, the parent is now "
                   f"{current_parent_sha[:12]}…")
    under = approved_cut_version(row)
    if under != CUT_VERSION:
        why.append(f"stale by cut version: approved under cutter version {under}, the cutter is now version {CUT_VERSION}")
    return why


def _renewal_fault(event: dict, current_parent_sha: str | None) -> str | None:
    """Why an approval renewing a stale one is not a decision on the parent's current bytes, or None."""
    named = event.get("parentSha256")
    if not named:
        return "this line names no parent bytes"
    if current_parent_sha and named != current_parent_sha:
        return f"this line names the parent's bytes {named[:12]}…, the parent is now {current_parent_sha[:12]}…"
    return None


def merge_text(data: dict, incoming: str, known_ids: set[str] | None = None,
               current_shas: dict[str, str] | None = None) -> dict:
    """
    The exported lines merged into the definitions, idempotently by event id: an event already
    there with the same content is skipped, with different content refused; an approval of a
    range already approved (same parent, bars and selection) is refused with the row named; a
    line naming a parent the catalogue lacks is refused. Returns the new data and what happened.

    E51 (the reviewer's ruling, `responses/f972756.md`): a stored approval that is stale
    (`approval_staleness`: by provenance against `current_shas`, the parents' current built bytes by
    parent id; by cut version) can be re-decided. An approval or adjustment of its range that names
    the parent's current bytes becomes the active row in its place, merged under the cutter in force;
    one naming other bytes or none is refused with the reason. A rejection of its range withdraws it.
    Either way the old row moves to `superseded` exactly as it was, with `supersededBy`, the event
    that replaced it. Without `current_shas`, or for a parent absent from them, provenance is not
    judged: a row stale by provenance alone is refused as current (fails closed). No stored row is
    rewritten and nothing is renewed without an event of its own. `superseding` lists (new event, old
    event, why the old one was stale).
    """
    rows = list(data.get("excerpts") or [])
    rejected = list(data.get("rejected") or [])
    superseded = list(data.get("superseded") or [])
    by_event = {row["event"]: row for row in rows + rejected if row.get("event")}
    # A superseded entry is the old row plus the event that replaced it: compared as the row it was, so the
    # old export merged again is the decision already in the file (skipped), never a new one.
    for entry in superseded:
        if entry.get("event"):
            by_event.setdefault(entry["event"], {k: v for k, v in entry.items() if k != "supersededBy"})
    appended: list[str] = []
    skipped: list[str] = []
    refused: list[tuple[int, str]] = []
    superseding: list[tuple[str, str | None, list[str]]] = []
    for number, line in enumerate(incoming.splitlines(), start=1):
        if not line.strip():
            continue
        try:
            event = json.loads(line)
        except json.JSONDecodeError as error:
            refused.append((number, f"not JSON: {error.msg}"))
            continue
        fault = decision_fault(event)
        if fault:
            refused.append((number, fault))
            continue
        if known_ids is not None and event["of"] not in known_ids:
            refused.append((number, f"{event['of']} is not in the built catalogue"))
            continue
        row = _row_of(event)
        if event["event"] in by_event:
            if _same_decision(by_event[event["event"]], row):
                skipped.append(event["event"])
            else:
                refused.append((number, f"event {event['event']} is already in the file with other content"))
            continue
        at = next((i for i, r in enumerate(rows) if (r["of"], r["fromBar"], r["toBar"], r["selection"])
                   == (row["of"], row["fromBar"], row["toBar"], row["selection"])), None)
        current = (current_shas or {}).get(row["of"])
        stale = approval_staleness(rows[at], current) if at is not None else []
        if event["decision"] != "reject":
            if at is not None:
                same = rows[at]
                eid = excerpt_id(row["of"], row["fromBar"], row["toBar"], row["selection"])
                if not stale:
                    refused.append((number, f"{eid} is already approved (event {same.get('event')})"))
                    continue
                fault = _renewal_fault(event, current)
                if fault:
                    refused.append((number, f"{eid}: its approval (event {same.get('event')}) is {'; '.join(stale)}; "
                                            f"a renewal is a decision on the current parent, and {fault}"))
                    continue
                # E51: the renewal takes the stale row's place; the old row is kept whole beside the file's rows.
                superseded.append({**same, "supersededBy": row["event"]})
                rows[at] = row
                superseding.append((row["event"], same.get("event"), stale))
            else:
                rows.append(row)
        else:
            if at is not None and stale:
                # E51: a rejection of a stale approval withdraws it (a rejection of a current one is kept beside it).
                same = rows.pop(at)
                superseded.append({**same, "supersededBy": row["event"]})
                superseding.append((row["event"], same.get("event"), stale))
            rejected.append(row)
        by_event[row["event"]] = row
        appended.append(row["event"])
    out = {"_comment": data.get("_comment") or COMMENT, "excerpts": rows, "rejected": rejected, "superseded": superseded}
    return {"data": out, "appended": appended, "skipped": skipped, "refused": refused, "superseding": superseding}


# --------------------------------------------------------------------------------------
# the candidate-rungs report (D3's precedent, responses/2c80472.md)
# --------------------------------------------------------------------------------------


def candidate_rungs(catalog: list[dict], curriculum: dict) -> list[dict]:
    """
    For each excerpt in the built catalogue: the rungs whose taught set contains every demand it
    carries (`claims.untaught_on` empty) and at least one of whose claims its measured demands
    establish (`claims.status_of`), with the claims as evidence. Placement is F's; nothing here
    places anything.
    """
    import claims

    skills, demands = claims.load_vocabulary()
    ancestry = claims.rung_ancestry(curriculum)
    # One detector answering for several lesson concepts (the left-hand pattern): a claim reached
    # through it says the demand is in the notes, not that the rung's own pattern is.
    sharing: dict[str, list[str]] = {}
    for concept, demand in claims.CONCEPT_DEMANDS.items():
        sharing.setdefault(demand, []).append(concept)

    def claim_row(c: dict) -> dict:
        row = {"kind": c["kind"], "id": c["id"], "from": c["from"]}
        shared = sharing.get(c["id"]) or []
        if c["kind"] == "demand" and c["from"].startswith("concept ") and len(shared) > 1:
            row["sharedBy"] = sorted(shared)
        return row

    out = []
    for item in catalog:
        if item.get("type") != "excerpt":
            continue
        rows = []
        for _stage, _unit, lesson in claims.lessons_in_order(curriculum):
            rung = lesson["id"]
            if claims.untaught_on(item, rung, ancestry, demands, curriculum):
                continue
            rung_claims, _unmeasurable = claims.rung_claims_of(lesson, skills, demands)
            established = [c for c in rung_claims if claims.status_of(c, item, skills) == "established"]
            if established:
                rows.append({"rung": rung, "title": lesson.get("title"),
                             "established": [claim_row(c) for c in established],
                             "notEstablished": [{"kind": c["kind"], "id": c["id"], "status": claims.status_of(c, item, skills)}
                                                for c in rung_claims if c not in established]})
        measurement = item.get("measurement") or {}
        block = (item.get("provenance") or {}).get("excerpt") or {}
        out.append({"item": item["id"], "title": item["title"], "of": item.get("excerptOf"),
                    "bars": [block.get("fromBar"), block.get("toBar")], "selection": block.get("selection"),
                    "targets": block.get("targets"), "demands": item.get("demands"),
                    "located": measurement.get("located"), "established": measurement.get("established"),
                    "window": measurement.get("window"), "candidates": rows})
    return out


def candidate_rungs_markdown(report: list[dict]) -> str:
    lines = ["# Candidate rungs for the approved excerpts (E1)", "",
             "Read from the built catalogue and curriculum by `excerpts.candidate_rungs`, from the combined build: for",
             "each excerpt, the rungs whose taught set contains every demand the cut carries (`claims.untaught_on`",
             "empty, the rung's ancestry) and whose claims the cut's measured demands establish at a useful density",
             "(`claims.status_of`; an excerpt establishes by the window rule, `minInWindow`). **Nothing is placed**:",
             "no rung lists an excerpt. Placement is F's, on a stated gate: a line here established on the combined",
             "build **and** a current `goodTeachingUse: yes` on the cut's identity in D2's record by a named reviewer",
             "stating their basis. Boundaries by rule, unheard; unverified as music.", ""]
    for row in report:
        lines.append(f"## {row['title']}")
        lines.append("")
        bars = row.get("bars") or [None, None]
        lines.append(f"`{row['item']}` — bars {bars[0]}–{bars[1]} of `{row['of']}`, {row.get('selection')}; approved for "
                     f"{', '.join(row.get('targets') or []) or 'no target'}. Measured demands: "
                     + ", ".join(f"{d} ({(row['located'] or {}).get(d, 0)})" for d in (row["demands"] or []) if isinstance(row["demands"], list))
                     + f". Established: {', '.join(row['established'] or []) or 'none'}"
                     + (f" (by the window rule alone: {', '.join(row['window'])})" if row.get("window") else "") + ".")
        lines.append("")
        if not row["candidates"]:
            lines.append("No rung: none both teaches every demand it carries and has a claim it establishes.")
            lines.append("")
            continue
        lines.append("| Rung | Claims it establishes | Claims it does not |")
        lines.append("| --- | --- | --- |")
        shared: dict[str, list[str]] = {}
        for c in row["candidates"]:
            est = "; ".join(f"{e['kind']} {e['id']} ({e['from']})" + (" †" if e.get("sharedBy") else "") for e in c["established"])
            rest = "; ".join(f"{e['kind']} {e['id']}: {e['status']}" for e in c["notEstablished"]) or "—"
            lines.append(f"| {c['rung']} ({c['title']}) | {est} | {rest} |")
            shared.update({e["id"]: e["sharedBy"] for e in c["established"] if e.get("sharedBy")})
        lines.append("")
        for demand, concepts in sorted(shared.items()):
            lines.append(f"† `{demand}` is one detector for {len(concepts)} concepts ({', '.join(concepts)}): the line says "
                         "the demand is in the notes, not which of them the passage is; the page says that.")
            lines.append("")
    return "\n".join(lines) + "\n"


# --------------------------------------------------------------------------------------
# the command
# --------------------------------------------------------------------------------------


def _load_built(content: Path) -> tuple[list[dict], dict]:
    catalog_path = content / "catalog.json"
    curriculum_path = content / "curriculum.json"
    if not catalog_path.is_file() or not curriculum_path.is_file():
        raise SystemExit(f"{content} has no built catalogue: run `python tools/content/build.py` first")
    return (json.loads(catalog_path.read_text(encoding="utf-8")),
            json.loads(curriculum_path.read_text(encoding="utf-8")))


def main(argv: list[str] | None = None) -> int:
    argv = list(sys.argv[1:] if argv is None else argv)
    if argv and argv[0] == "propose":
        import excerpt_proposer

        return excerpt_proposer.main(argv[1:])
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--merge", type=Path, help="an exported file of excerpt decisions to merge into excerpts.json")
    parser.add_argument("--definitions", type=Path, default=DEFINITIONS)
    parser.add_argument("--content", type=Path, default=DEFAULT_OUT, help="the built content (default app/public/content)")
    parser.add_argument("--candidate-rungs", action="store_true", help="write the candidate-rungs report from the built content")
    parser.add_argument("--out", type=Path, help="where --candidate-rungs writes (default: stdout)")
    args = parser.parse_args(argv)
    if args.merge:
        catalog, _curriculum = _load_built(args.content)
        data = read_definitions(args.definitions)
        # E51: each approved row's parent's current built bytes, read as the validator and the build read them,
        # so a row stale by provenance can be re-decided; a parent with no built file here is not judged by them.
        files = {item["id"]: item.get("file") for item in catalog}
        current_shas: dict[str, str] = {}
        for row in data.get("excerpts") or []:
            rel = files.get(row.get("of"))
            if rel and (args.content / rel).is_file():
                current_shas[row["of"]] = sha256_of(args.content / rel)
        result = merge_text(data, args.merge.read_text(encoding="utf-8"), {item["id"] for item in catalog}, current_shas)
        if result["appended"]:
            write_definitions(result["data"], args.definitions)
        print(f"Merged {args.merge}: appended {len(result['appended'])}, already in the file "
              f"{len(result['skipped'])}, refused {len(result['refused'])}.")
        supersedes = {new: (old, why) for new, old, why in result["superseding"]}
        for event in result["appended"]:
            if event in supersedes:
                old, why = supersedes[event]
                print(f"  + {event}, superseding {old} ({'; '.join(why)})")
            else:
                print(f"  + {event}")
        for number, why in result["refused"]:
            print(f"  line {number}: refused: {why}")
        return 1 if result["refused"] else 0
    if args.candidate_rungs:
        catalog, curriculum = _load_built(args.content)
        text = candidate_rungs_markdown(candidate_rungs(catalog, curriculum))
        if args.out:
            args.out.write_text(text, encoding="utf-8")
        else:
            print(text)
        return 0
    parser.print_help()
    return 2


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
