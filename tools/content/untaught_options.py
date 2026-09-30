#!/usr/bin/env python3
"""
The rung-own options the one gate's coping question refuses at their own rung, each untaught demand
read under the reviewer's order of truths (L120a; `docs/prompts/tasks/L120-untaught-readings-at-their-truth.md`,
ruled in `docs/review/responses/questions-4dc2f135.md`). Read-only: nothing here changes a rung, a
lesson, a claim, `taughtAt` or the gate; the validator warns with its count and never fails (L120b).

**The reading is the app's.** `eligibilityCore.establishedQuestions` asks a candidate, in this order:
a declared large-hand voicing (`physical`); the teaching-use admission (generated music whose family
promises music, or an excerpt, with no affirmative decision: `teaching-use-not-approved`); an
unmeasured item (`exploration-only`); then the coping question, `uncoped` — the demands the item asks
(`demandsAsked`: the catalogue row's `demands` list for a measured item, whatever its density, less a
key signature located at no sounding note, L120b), less those the learner's evidence supports, less
those taught at or below the rung (`session.taughtAtRung`: a demand whose `taughtAt` names a rung of
the rung's ancestry), less a skip (L120b) or a leap (L120d) wholly inside a fixed position a lesson on
that path teaches (`inTaughtPosition`; `claims.untaught_on` with the curriculum). A rung's own option,
judged at its own rung with no evidence read, is refused `untaught` when that difference is not empty. X1's probe
asked exactly that of every rung's `exerciseOptions` and `songOptions`
(`docs/prompts/runs/X1/scripts-zzX1CardProbe.test.ts`); this module reads the same `demands.json`,
the same ancestry (`claims.rung_ancestry`, which `taughtByAncestry.test.ts` holds equal to the app's)
and the same rows (`claims.untaught_on`), and `tests/test_untaught_options.py` holds its lines equal
to the probe's. Two things it does not read, each listed apart rather than counted as coped with:

- a **runtime reading row** (`drill.kind == "sight-reading"` made when it opens): the app asks the
  demands its reading controls may write into a phrase (`readingControls.ts`, app code), which the
  build does not have (`unread`);
- an option the gate refuses **before** the coping question (`physical`, `teaching-use-not-approved`):
  the gate's verdict is that refusal, so it is not among the lines; its untaught demands are listed
  (`shadowed`), since an approval would bring them to the coping question.

**The classification** is per untaught demand of an option, in the reviewer's order — the material
fact before the curriculum is rewritten around it, and a placement only when no truth above explains
the reading:

- **A — the material reading.** Every pair carries the measurement's verdict on the item
  (`established` at a useful density, `incidental` below it; `absent` cannot occur for an asked
  demand) and how many places the detectors located it. The verdict is information, never an
  exemption (the reviewer's first answer: an incidental demand is asked). A pair is class **A** when
  the build records the detector's reading of that demand on that item as doubtful as to presence:
  a known misreading (`claims.misreading_of`, E22's family readings and the clef assumption) or
  E22's caution on a notated walking bass (`PRESENCE_DOUBTS`); or the row's own facts under the
  detectors' documented rules (`reading_doubts`): a demand located nowhere (`NOWHERE`). Since L120b
  (the reviewer's ruling on L120a, `docs/review/responses/0bcd3be0.md`) a key signature located
  nowhere is not a pair at all — the gate does not ask it (`claims.asked_of`) — and the two 3/8
  doubts are gone: 3/8 is simple triple at the detector (`detect.ts`'s `isCompound`), and a written
  sixteenth in 3/8 is a sixteenth, classified by ownership and placement like any other. E22's other
  notes say the detector sees less than is there; they are kept as `caution`. Nothing else here can
  say the notes do not ask it; a pair not in doubt is read as present and required.
- **B — teaching ownership.** A lesson at or below the rung (its ancestry) owns it and fails to
  declare or map it. **B-claim**: a concept maps to the demand (`claims.concepts_naming`:
  `CONCEPT_DEMANDS` and a vocabulary skill whose opportunity is that demand alone) and a lesson at or
  below names it in its words, claims it in `concepts` where `taughtAt` does not reach, or lists it
  under `introduces` — the repair is the existing claim. **B-mapping**: no concept maps to the demand
  and a lesson at or below names it in its words — the repair is the mapping or a concept, only where
  the curriculum owns that ability (the reviewer's second answer).
- **C — placement.** No lesson at or below the rung names it. **C-later**: a rung that stands on
  this one teaches it (`later`, the first in the curriculum's order). **C-elsewhere**: a rung teaches
  it (`taughtAt`), and none that stands on this one does — a track whose path never reaches the
  teaching rung (the practice floor stands on 1.1, and nothing stands on it). **C-nowhere**: no rung
  teaches it at all (`taughtAt: []`). Either of the last two needs an honest teaching owner, a later
  placement or a simplification (the reviewer's second answer).

A **mention** is a word in a lesson's text (`content/<textFile>`, front matter aside) or its
`concepts`/`introduces` matched by `DEMAND_WORDS`: a pointer for a reader, with the sentence it came
from (the first per rung is printed), never a proof that the lesson teaches the thing. The mentions
read sentence by sentence and found not to teach the demand (`READ_NOT_TEACHING`, each with its
reading) are printed and do not count; every other mention counts, unread. An option's `resolution`
is `placement` if any of its pairs is C, else `ownership` if any is B, else `reading`.

Run by hand (writes nothing unless `--out` is given):

    python tools/content/untaught_options.py [--content DIR] [--out FILE] [--json FILE]
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Callable

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import claims  # noqa: E402
from claims import concepts_naming, lessons_in_order, rung_ancestry, taught_at  # noqa: E402,F401

REPO = HERE.parents[1]
BUILT = REPO / "app" / "public" / "content"
CONTENT = REPO / "content"

Doc = dict

#: The classes, in the reviewer's order of truths.
CLASSES =("A", "B-claim", "B-mapping", "C-later", "C-elsewhere", "C-nowhere")

#: The recorded readings that doubt a demand's *presence* on an item (a detector finding what is not
#: there): E22's family readings (`claims.E22_FAMILY`, by value), the clef assumption, and the caution
#: on a notated walking bass (a stride left hand or a one-line pulse read as a walk). E22's other notes
#: — syncopation's blind spots, the walking-bass family read as no walk — say the detector sees *less*
#: than is there, which leaves an asked demand asked: they are kept as `caution`, never class A.
PRESENCE_DOUBTS = frozenset({claims.CLEF_NOTE, claims.E22_NOTATED_WALK})

#: A reading of the detectors' own documented rule that leaves a demand in the row with nothing for the
#: learner to do (`app/src/demands/detect.ts`, read, never moved). Since L120b the key signature located
#: nowhere never reaches this table (the gate does not ask it, `claims.asked_of`); any other demand located
#: nowhere keeps the doubt. L120a's two 3/8 doubts are gone (L120b, the reviewer's ruling on L120a,
#: `docs/review/responses/0bcd3be0.md`): 3/8 read as compound time was the detector's error, corrected at
#: the reading (`detect.ts`'s `isCompound`), so a 3/8 row that still carries compound time carries it from
#: a genuinely compound bar; and a written sixteenth in 3/8 is a sixteenth the learner reads and times.
NOWHERE = ("present with nowhere to point: the detector places it on no note, so the learner has nothing "
           "of it to play")


def reading_doubts(item: Doc, demand_id: str, located: int) -> list[str]:
    """This module's doubts on a detector's reading of an asked demand, from the row's own facts."""
    return [NOWHERE] if located == 0 else []


#: The words that name each demand in a lesson's text or a concept id (hyphens read as spaces),
#: case-insensitive. Musical phrasings only: "steps" alone is the app's word for a score position
#: (0.3: "the fraction of steps"), "both hands" is said of warm-ups long before hands together, and
#: "black keys" of the keyboard's geography, so none of them is a mention.
DEMAND_WORDS: dict[str, str] = {
    "clef.bass": r"\bbass (clef|staff|stave)\b|\bgrand staff\b|\bF clef\b",
    "pitch.ledger": r"\bledger\b",
    "interval.step": r"\bstepwise\b|\b(by|a|one|whole|half) step\b|\bsteps? (up|down)\b|\bsteps and skips\b"
                     r"|\bmoves? by steps?\b|\bstep to the next\b",
    "interval.skip": r"\bskips\b(?! (it|this|the|ahead))|\b(a|by|one) skip\b|\bskip (of|up|down)\b|\bsteps and skips\b",
    "interval.leap": r"\bleaps?\b|\bleaping\b|\bleapt\b|\bintervals? of a (fourth|fifth|sixth|seventh)\b",
    "rhythm.eighths": r"\beighth[- ]?notes?\b|\beighths\b|\bquavers?\b|\bhalf[- ]beats?\b",
    "rhythm.shorter-than-quarter": r"\beighth[- ]?notes?\b|\beighths\b|\bquavers?\b|\bhalf[- ]beats?\b"
                                   r"|\bsixteenth[- ]?notes?\b|\bsixteenths\b|\bsemiquavers?\b",
    "rhythm.sixteenths": r"\bsixteenth[- ]?notes?\b|\bsixteenths\b|\bsemiquavers?\b",
    "rhythm.dotted-quarter": r"\bdotted[- ](quarter|crotchet)s?\b|\bdotted rhythms?\b",
    "rhythm.ties": r"\bties?\b|\btied\b",
    "rhythm.syncopation": r"\bsyncopat\w*|\boff[- ]?beats?\b",
    "rhythm.triplets": r"\btriplets?\b",
    "metre.compound": r"\bcompound (time|metre|meter)\b|\b(6|9|12)/8\b|\bsix[- ]eight\b",
    "key.signature": r"\bkey[- ]signatures?\b",
    "pitch.chromatic": r"\baccidentals?\b|\bchromatic\w*\b|\b(sharp|flat|natural) signs?\b|\b[A-G][ -](sharp|flat)\b",
    "range.beyond-position": r"\bposition (shifts?|changes?)\b|\bshift(s|ing)? (the |your )?(hand|position)\b"
                             r"|\bchange (hand )?positions?\b|\bnew position\b|\bout of (the )?(five-finger |C )?position\b"
                             r"|\bthumb (under|crossing)\b|\bcross(es|ing)? over\b|\bfinger crossing\b"
                             r"|\bbeyond (the )?five\b|\boutside (the |a )?five-finger\b",
    "texture.hands-together": r"\bhands[- ]together\b|\bboth hands (at once|together)\b",
    "texture.left-hand-pattern": r"\balberti\b|\bbroken[- ]chords?\b|\bwaltz bass\b|\boom-?pah\b|\bboogie\b|\bstride\b"
                                 r"|\bleft[- ]hand pattern\b|\baccompaniment pattern\b",
    "texture.walking-bass": r"\bwalking[- ](bass|line)\b|\bbass (line )?walks\b",
}

#: Mentions read and found not to teach the demand, `{(rung, demand): the reading}` (L120a, 2026-09-29,
#: each from the sentence it came from). A mention here is kept in the table with its reading and does
#: not make the pair class B; a mention not here counts, unread. Nothing here says a lesson teaches
#: anything: a lesson that does is simply not listed.
READ_NOT_TEACHING: dict[tuple[str, str], str] = {
    ("0.4", "clef.bass"): "the placement test's task list asks it, and teaches nothing",
    ("0.4", "texture.hands-together"): "the placement test's task list asks it, and teaches nothing",
    ("1.1", "pitch.ledger"): "middle C's own ledger line; the demand is a ledger line beyond middle C",
    ("1.3", "pitch.ledger"): "middle C's ledger line above the bass staff, and why a clef saves ledger lines; none beyond middle C is read",
    ("1.4", "pitch.ledger"): "middle C's ledger line between the staves; the demand is a ledger line beyond middle C",
    ("1.2", "rhythm.eighths"): "named once as a value (an eighth is half a quarter) among those later rungs build on; 1.2 teaches half and whole notes",
    ("1.2", "rhythm.shorter-than-quarter"): "named once as a value (an eighth is half a quarter) among those later rungs build on",
    ("1.2", "rhythm.triplets"): "named once as something met later",
    ("2.1", "rhythm.eighths"): "Simple Gifts described as in eighths and quarters; the lesson teaches no counting of them (2.2 does)",
    ("2.1", "rhythm.shorter-than-quarter"): "Simple Gifts described as in eighths and quarters; the lesson teaches no counting of them (2.2 does)",
    ("2.5", "pitch.chromatic"): "a key with a sharp in it, said of the next rung's version: a key signature, not a note outside the key",
    ("3.2", "pitch.chromatic"): "B flat named as a chord root in F major: in the key, not outside it",
    ("holiday.3", "pitch.chromatic"): "an F sharp named for its height, in a lesson about range",
    ("holiday.3", "key.signature"): "a G key signature named in describing one carol",
    ("jazz.3", "pitch.chromatic"): "a piece's runs described as climbing chromatically",
    ("rock.overview", "pitch.chromatic"): "a C sharp named in describing one tune's mode",
    ("technique.4", "metre.compound"): "one étude described as in 6/8",
    ("3.5", "rhythm.syncopation"): "'syncopated pedalling', a name for legato pedalling: a pedal technique, not a rhythm",
    ("blues.4", "rhythm.syncopation"): "the shuffle's off-beat eighth and where the app expects it: swing, not syncopation",
}


def measurement_of(item: Doc) -> Doc:
    """`eligibilityCore.measurementOf`: the row's record, a drill made at runtime, or unmeasured."""
    if item.get("measurement"):
        return item["measurement"]
    if item.get("drill") and not item.get("file"):
        return {"status": "runtime", "reason": "made when it opens"}
    return {"status": "unmeasured", "reason": "no measurement record"}


def unapproved_music(item: Doc) -> bool:
    """`eligibilityCore.unapprovedMusic` is not undefined: music whose teaching use rests on a decision, without a yes."""
    provenance = item.get("provenance") or {}
    promise = (((provenance.get("facts") or {}).get("promise")) or {}).get("value")
    if promise != "music" and item.get("type") != "excerpt":
        return False
    return ((provenance.get("review") or {}).get("teaching")) is not True


def refused_before_coping(item: Doc) -> str | None:
    """The gate's verdict before question 1, in its order; None when the coping question is asked."""
    if (item.get("provenance") or {}).get("physical"):
        return "physical"
    if unapproved_music(item):
        return "teaching-use-not-approved"
    if measurement_of(item).get("status") == "unmeasured":
        return "exploration-only"
    return None


def is_reading_row(item: Doc) -> bool:
    return ((item.get("drill") or {}).get("kind")) == "sight-reading"


def lesson_text(lesson: Doc) -> str:
    """The lesson's text as the build reads it: `content/<textFile>`, or nothing."""
    name = lesson.get("textFile")
    path = CONTENT / name if name else None
    return path.read_text(encoding="utf-8") if path is not None and path.is_file() else ""


def _sentence(text: str, start: int, end: int) -> str:
    """The sentence (or line) around a match, one line, trimmed."""
    left = max(text.rfind(". ", 0, start), text.rfind("\n\n", 0, start))
    right_candidates = [i for i in (text.find(". ", end), text.find("\n\n", end)) if i != -1]
    right = min(right_candidates) if right_candidates else len(text)
    snippet = " ".join(text[left + 1 if left != -1 else 0:right + 1].split())
    return snippet if len(snippet) <= 200 else snippet[:197] + "..."


#: A lesson file's front matter (title, videos): the build's metadata, not the lesson's words.
FRONT_MATTER = re.compile(r"\A\ufeff?---\r?\n.*?\r?\n---\r?\n", re.DOTALL)


def mentions_by_lesson(curriculum: Doc, text_of: Callable[[Doc], str]) -> dict[str, dict[str, list[Doc]]]:
    """`{rung: {demand: [{where, word, said}]}}`: every mention of each demand in a lesson's text and concept lists."""
    compiled = {ident: re.compile(pattern, re.IGNORECASE) for ident, pattern in DEMAND_WORDS.items()}
    out: dict[str, dict[str, list[Doc]]] = {}
    for _stage, _unit, lesson in lessons_in_order(curriculum):
        found: dict[str, list[Doc]] = defaultdict(list)
        text = FRONT_MATTER.sub("", text_of(lesson) or "", count=1)
        for ident, pattern in compiled.items():
            for match in pattern.finditer(text):
                found[ident].append({"where": "text", "word": match.group(0), "said": _sentence(text, match.start(), match.end())})
            for field in ("concepts", "introduces"):
                for concept in lesson.get(field) or []:
                    words = concept.replace("-", " ")
                    match = pattern.search(words)
                    if match:
                        found[ident].append({"where": field, "word": concept, "said": f"{field}: {concept}"})
        out[lesson["id"]] = dict(found)
    return out


def table(catalog: list[Doc], curriculum: Doc, skills: dict[str, Doc] | None = None,
          demands: dict[str, Doc] | None = None, text_of: Callable[[Doc], str] | None = None,
          readings: dict[tuple[str, str], str] | None = None) -> Doc:
    """The report's lines, the rows listed apart and the summary, as data."""
    readings = READ_NOT_TEACHING if readings is None else readings
    if skills is None or demands is None:
        loaded_skills, loaded_demands = claims.load_vocabulary()
        skills = loaded_skills if skills is None else skills
        demands = loaded_demands if demands is None else demands
    text_of = text_of or lesson_text
    by_id = {item["id"]: item for item in catalog}
    ancestry = rung_ancestry(curriculum)
    order = [lesson for _stage, _unit, lesson in lessons_in_order(curriculum)]
    index = {lesson["id"]: n for n, lesson in enumerate(order)}
    lessons = {lesson["id"]: lesson for lesson in order}
    naming = concepts_naming(skills, demands)
    mentions = mentions_by_lesson(curriculum, text_of)

    def taught_here(demand_id: str, rung: str) -> bool:
        return any(at in ancestry.get(rung, set()) for at in taught_at(demands.get(demand_id)))

    def earliest(demand_id: str) -> str | None:
        return next((lesson["id"] for lesson in order if taught_here(demand_id, lesson["id"])), None)

    def later(demand_id: str, rung: str) -> str | None:
        """The first rung, in the curriculum's order, that stands on this one and teaches the demand."""
        return next((lesson["id"] for lesson in order
                     if lesson["id"] != rung and rung in ancestry.get(lesson["id"], set()) and taught_here(demand_id, lesson["id"])), None)

    lines: list[Doc] = []
    shadowed: list[Doc] = []
    unread: list[Doc] = []
    missing: list[Doc] = []
    for stage, unit, lesson in lessons_in_order(curriculum):
        rung = lesson["id"]
        below = sorted(ancestry.get(rung, {rung}), key=lambda r: index.get(r, 0))
        for item_id in [*(lesson.get("exerciseOptions") or []), *(lesson.get("songOptions") or [])]:
            item = by_id.get(item_id)
            if item is None:
                missing.append({"rung": rung, "item": item_id})
                continue
            before = refused_before_coping(item)
            status = measurement_of(item).get("status")
            if before is None and status == "runtime" and is_reading_row(item):
                unread.append({"rung": rung, "item": item_id, "title": item.get("title"),
                               "why": "a runtime reading row: its asked demands are the reading controls' (app code)"})
                continue
            untaught = claims.untaught_on(item, rung, ancestry, demands, curriculum) if status == "measured" else []
            if not untaught:
                continue
            if before is not None:
                shadowed.append({"rung": rung, "item": item_id, "title": item.get("title"), "why": before, "demands": untaught})
                continue
            measurement = measurement_of(item)
            established = set(measurement.get("established") or [])
            located = measurement.get("located") or {}
            rows = []
            for demand_id in untaught:
                verdict = "established" if demand_id in established else "incidental" if demand_id in (item.get("demands") or []) else "absent"
                notes = {note for note in ([claims.misreading_of(item, demand_id)]
                                           + claims.e22_notes({"kind": "demand", "id": demand_id}, item, verdict, skills)) if note}
                doubt = sorted(note for note in notes if note in PRESENCE_DOUBTS or note in claims.E22_FAMILY.values())
                doubt += reading_doubts(item, demand_id, located.get(demand_id, 0))
                caution = sorted(notes - set(doubt))
                concepts = sorted(naming.get(demand_id, set()))
                said = [{"rung": r, **m, **({"read": readings[(r, demand_id)]} if (r, demand_id) in readings else {})}
                        for r in below for m in mentions.get(r, {}).get(demand_id, [])]
                counted = [m for m in said if "read" not in m]
                claimed = [r for r in below if set(concepts) & set(lessons[r].get("concepts") or [])]
                introduced = [r for r in below if set(concepts) & set(lessons[r].get("introduces") or [])]
                if doubt:
                    kind = "A"
                elif concepts and (counted or claimed or introduced):
                    kind = "B-claim"
                elif counted:
                    kind = "B-mapping"
                elif later(demand_id, rung) is not None:
                    kind = "C-later"
                elif taught_at(demands.get(demand_id)):
                    kind = "C-elsewhere"
                else:
                    kind = "C-nowhere"
                rows.append({
                    "id": demand_id,
                    "verdict": verdict,
                    "located": located.get(demand_id, 0),
                    "doubt": doubt,
                    "caution": caution,
                    "concepts": concepts,
                    "taughtAt": taught_at(demands.get(demand_id)),
                    "earliest": earliest(demand_id),
                    "later": later(demand_id, rung),
                    "mentions": said,
                    "claimed": claimed,
                    "introduced": introduced,
                    "class": kind,
                })
            kinds = {row["class"] for row in rows}
            resolution = ("placement" if any(k.startswith("C") for k in kinds)
                          else "ownership" if any(k.startswith("B") for k in kinds) else "reading")
            lines.append({"rung": rung, "stage": stage.get("number"), "track": unit.get("track"), "item": item_id,
                          "title": item.get("title"), "type": item.get("type"), "demands": rows, "resolution": resolution})

    pairs = [(line, row) for line in lines for row in line["demands"]]
    by_demand: dict[str, Counter] = defaultdict(Counter)
    for _line, row in pairs:
        by_demand[row["id"]][row["class"]] += 1
        by_demand[row["id"]][row["verdict"]] += 1
    summary = {
        "options": len(lines),
        "pairs": len(pairs),
        "linesByResolution": dict(Counter(line["resolution"] for line in lines)),
        "pairsByClass": {kind: sum(1 for _l, row in pairs if row["class"] == kind) for kind in CLASSES},
        "pairsByVerdict": dict(Counter(row["verdict"] for _l, row in pairs)),
        "pairsByDemand": dict(Counter(row["id"] for _l, row in pairs)),
        "byDemand": {ident: dict(counts) for ident, counts in sorted(by_demand.items(), key=lambda kv: -sum(
            v for k, v in kv[1].items() if k in CLASSES))},
        # C pairs a mention would have made B but for its reading (READ_NOT_TEACHING).
        "readAsNotTeaching": sum(1 for _l, row in pairs if row["class"].startswith("C") and row["mentions"]),
        "shadowed": dict(Counter(row["why"] for row in shadowed)),
        "unread": len(unread),
        "missing": len(missing),
        "rungs": len({line["rung"] for line in lines}),
        "items": len({line["item"] for line in lines}),
    }
    return {"summary": summary, "lines": lines, "shadowed": shadowed, "unread": unread, "missing": missing}


def _demand_words(row: Doc) -> str:
    parts = [f"{row['id']}: {row['verdict']} (located {row['located']})"]
    parts.append(f"concept {', '.join(row['concepts'])}" if row["concepts"] else "no concept maps")
    parts.append(f"taughtAt {', '.join(row['taughtAt'])}" if row["taughtAt"] else "taughtAt none")
    parts.append(f"earliest {row['earliest'] or 'none'}")
    parts.append(f"later on this path {row['later'] or 'none'}")
    below = []
    if row["claimed"]:
        below.append(f"claimed in concepts at {', '.join(row['claimed'])}")
    if row["introduced"]:
        below.append(f"introduced at {', '.join(row['introduced'])}")
    rungs = list(dict.fromkeys(m["rung"] for m in row["mentions"] if "read" not in m))
    if rungs:
        below.append(f"mentioned at {', '.join(rungs)}")
    passing = list(dict.fromkeys(m["rung"] for m in row["mentions"] if "read" in m))
    if passing:
        below.append(f"named without teaching at {', '.join(passing)}")
    parts.append("; ".join(below) if below else "no lesson at or below mentions it")
    return " · ".join(parts)


def render(report: Doc) -> str:
    """The text table: the summary, the counts per class and per demand, every line, the rows apart."""
    s = report["summary"]
    out = [
        "# Untaught rung-own options (L120a)",
        "",
        "Generated by `tools/content/untaught_options.py` from the built catalogue and curriculum. Read-only: nothing",
        "here changes a rung, a lesson, a claim or the gate. Each line is a rung's own option the one gate's coping",
        "question refuses at that rung (the app's `untaught`), each untaught demand classified in the reviewer's order:",
        "A the material reading in doubt; B-claim / B-mapping a lesson at or below the rung names it and does not",
        "declare or map it; C no lesson at or below names it — C-later a rung standing on this one teaches it,",
        "C-elsewhere a rung teaches it off this path, C-nowhere no rung teaches it. A mention is a pointer, not a proof.",
        "",
        "## Summary",
        "",
        f"- options refused `untaught` at their own rung: {s['options']} (on {s['rungs']} rungs, {s['items']} distinct items)",
        f"- option × untaught demand pairs: {s['pairs']}",
        "- options by resolution: " + ", ".join(f"{k} {s['linesByResolution'].get(k, 0)}" for k in ("reading", "ownership", "placement")),
        "- pairs by class: " + ", ".join(f"{k} {v}" for k, v in s["pairsByClass"].items()),
        "- pairs by measurement verdict: " + ", ".join(f"{k} {v}" for k, v in sorted(s["pairsByVerdict"].items())),
        f"- C pairs whose only mentions at or below were read as not teaching (`READ_NOT_TEACHING`): {s['readAsNotTeaching']}",
        "- refused before the coping question and carrying untaught demands (listed at the end, not counted above): "
        + (", ".join(f"{k} {v}" for k, v in sorted(s["shadowed"].items())) or "none"),
        f"- runtime reading rows not read here (the reading controls are app code): {s['unread']}",
        f"- listed ids the catalogue lacks (the gate never sees them): {s['missing']}",
        "",
        "## Per demand",
        "",
        "| demand | pairs | established | incidental | " + " | ".join(CLASSES) + " |",
        "| --- | --- | --- | --- | " + " | ".join("---" for _ in CLASSES) + " |",
    ]
    for ident, counts in s["byDemand"].items():
        out.append(f"| {ident} | {s['pairsByDemand'][ident]} | {counts.get('established', 0)} | {counts.get('incidental', 0)} | "
                   + " | ".join(str(counts.get(k, 0)) for k in CLASSES) + " |")
    out += ["", "## Lines", ""]
    for line in report["lines"]:
        kinds = "+".join(sorted({row["class"] for row in line["demands"]}, key=CLASSES.index))
        out.append(f"{line['rung']} {line['item']} — {line['title']} [{line['resolution']}: {kinds}]")
        for row in line["demands"]:
            out.append(f"    {row['class']:<9} {_demand_words(row)}")
            for note in row["doubt"]:
                out.append(f"              doubt: {note}")
            for note in row["caution"]:
                out.append(f"              caution: {note}")
            shown: set[tuple[str, str]] = set()
            for m in row["mentions"]:
                key = (m["rung"], "read" if "read" in m else "counted")
                if key in shown:
                    continue
                shown.add(key)
                if "read" in m:
                    out.append(f"              {m['rung']} read as not teaching it: {m['read']}")
                else:
                    out.append(f"              {m['rung']} {m['where']} \"{m['word']}\": {m['said']}")
    out += ["", "## Refused before the coping question (the gate's verdict is that refusal; untaught demands carried)", ""]
    for row in report["shadowed"]:
        out.append(f"{row['rung']} {row['item']} — {row['why']}: {', '.join(row['demands'])}")
    out += ["", "## Runtime reading rows not read here", ""]
    for row in report["unread"]:
        out.append(f"{row['rung']} {row['item']} — {row['why']}")
    out += ["", "## Listed ids the catalogue lacks", ""]
    for row in report["missing"]:
        out.append(f"{row['rung']} {row['item']}")
    return "\n".join(out) + "\n"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--content", type=Path, default=BUILT, help="the built content directory (catalog.json, curriculum.json)")
    parser.add_argument("--out", type=Path, help="write the text table here")
    parser.add_argument("--json", type=Path, help="write the table as JSON here")
    args = parser.parse_args(argv)
    catalog = json.loads((args.content / "catalog.json").read_text(encoding="utf-8"))
    curriculum = json.loads((args.content / "curriculum.json").read_text(encoding="utf-8"))
    report = table(catalog, curriculum)
    text = render(report)
    if args.out:
        args.out.write_text(text, encoding="utf-8")
    if args.json:
        args.json.write_text(json.dumps(report, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    if not args.out:
        sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
        sys.stdout.write(text)
    else:
        s = report["summary"]
        print(f"{s['options']} options, {s['pairs']} pairs: " + ", ".join(f"{k} {v}" for k, v in s["pairsByClass"].items()))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
