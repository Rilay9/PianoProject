#!/usr/bin/env python3
"""CL01 (Entry 189): the per-lesson twelve-gate coverage record, built from the earlier tables.

Usage (from the repository root):
    python docs/prompts/runs/CL01/scripts-coverage.py            # write coverage-record.md
    python docs/prompts/runs/CL01/scripts-coverage.py --check    # the 109 x 12 check, exit 1 on a fault
    python docs/prompts/runs/CL01/scripts-coverage.py --check FILE

The record is an inventory of evidence, not a claim that any gate is satisfied. Every
evidence item below is one sentence in one lesson, taken from a table an earlier entry
wrote (F0's corrected-sentences and disposition tables, F0a's addendum, F1's table, F3a's
sentences table and follow-ups) or from this entry's own reads. The rule that maps an item
to the gates it answers is `gates_of` below, stated in words in the record's header. An
item counts only where its words are still in the lesson at HEAD (`present`); an item
whose words have since changed is listed as not at HEAD and maps to nothing.
"""
from __future__ import annotations

import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
LESSONS_DIR = ROOT / "content" / "lessons"
HERE = Path(__file__).resolve().parent
RECORD = HERE / "coverage-record.md"

sys.path.insert(0, str(ROOT / "tools" / "content"))
from lint_absolutes import PATTERN as LINT_WORDS  # noqa: E402  (the lint's own word list)

GATES = list(range(1, 13))
GATE_NAMES = {
    1: "factual correctness", 2: "technical defensibility", 3: "epistemic honesty",
    4: "no fake precision", 5: "no unjustified absolutes", 6: "musical authenticity",
    7: "experience before explanation", 8: "transfer", 9: "individual variation",
    10: "long-horizon compatibility", 11: "source discipline", 12: "the teacher test",
}

# --------------------------------------------------------------------------- lessons

def lesson_ids() -> list[str]:
    key = lambda p: [int(t) if t.isdigit() else t for t in re.split(r"(\d+)", p.stem)]
    return [p.stem for p in sorted(LESSONS_DIR.glob("*.md"), key=key)]


def norm(text: str) -> str:
    text = text.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')
    text = text.replace("*", "").replace("`", "")
    return re.sub(r"\s+", " ", text).strip().lower()


def body(lesson: str) -> str:
    raw = (LESSONS_DIR / f"{lesson}.md").read_text(encoding="utf-8")
    raw = re.sub(r"\A---\r?\n[\s\S]*?\r?\n---\r?\n", "", raw)
    return norm(raw)


# --------------------------------------------------------------------------- the tag rule
# A table row that names a backlog row answers the gates that row's problem is about.
TAG_GATES: dict[str, tuple[set[int], str]] = {
    "T4": ({3, 5, 10}, "\"temporary constraints written as universal rules\""),
    "T28": ({1}, "the rhythm arithmetic printed backwards"),
    "T29": ({1, 10}, "the add-half rule for every dotted note, false once double dots appear"),
    "T30": ({1, 3, 10}, "the anacrusis convention called a rule; the app's own tune a counter-example"),
    "T31": ({1, 2}, "the wrong model of what the foot does under a half pedal"),
    "T32": ({2, 9}, "one octave fingering \"in both hands\"; \"anatomy and context matter\""),
    "T33": ({2, 9}, "\"technique rules presented as physiology\"; \"difficulty diagnosed from one symptom\""),
    "T34": ({2, 9, 10}, "an unjustified causal ranking; C position's one finger per key \"as a fact about piano fingering\""),
    "T35": ({2, 11}, "injuries \"almost always\" from one cause: a biomechanical law with no source"),
    "T36": ({3}, "\"practice pedagogy turned into recipes\""),
    "T37": ({3, 11}, "interleaving overclaimed; \"the music-specific evidence is mixed\""),
    "T38": ({1}, "tonicisation and modulation told apart by length"),
    "T39": ({1, 3}, "\"chord-scale theory taught as harmonic fact\""),
    "T41": ({1, 4, 6}, "swing \"≈ 2:1\" as the definition of jazz swing; \"ratios vary\""),
    "T42": ({6, 11}, "\"blues reduced to formulas\"; the history unsourced"),
    "T44": ({3, 6, 9}, "\"Classical historical-performance conventions as rules\""),
    "T45": ({6}, "\"one texture\" promoted \"to a style's essence\""),
    "T47": ({5}, "\"improvisation overclaims\""),
    "T51": ({1}, "the technique measure's words agree with the corrected lesson"),
    "T52": ({1}, "\"lessons that contradict the app\""),
    "T55": ({1}, "spelling against pitch (the raised fourth)"),
    "P17": ({5}, "Part 17 section 20: statements \"written as universals\""),
}
# Gate 4 by row: the rows whose removed words were a fixed repetition count, tempo, ratio,
# percentage or duration (gate 4's own list), named here rather than guessed from a tag.
GATE4_ROWS = {
    "f0-corrected-sentences.md row 27",   # practice.4: four 20-minute sessions against one of 80
    "runs/F3a/sentences.md row 4",        # practice.1: five times correct in a row
    "runs/F3a/sentences.md row 5",        # practice.1: five times running
    "runs/F3a/sentences.md row 6",        # practice.2: usually about half the speed
    "runs/F3a/sentences.md row 9",        # practice.2: three clean repetitions, about 5 %
    "runs/F3a/sentences.md row 14",       # practice.3: warm up, five minutes
    "runs/F3a/sentences.md row 16",       # practice.5: it takes a week
}

# Entries whose own record puts every corrected sentence through the teacher test (gate 12).
TEACHER_TEST = {
    "E82": "`tasks/F0-never-teach-wrong.md`:19, decided item 7: every corrected sentence passes the teacher test",
    "E88": "`entry-88.md`:9: every one is a sentence a teacher could say without \"well, actually\"",
    "E157": "`entry-157.md`:9-17: every pair read in full in the lesson around it, the teacher's read stated",
    "E189": "this entry's Judgement: both sentences read in place, the teacher's read stated",
}

# --------------------------------------------------------------------------- items

ITEMS: list[dict] = []


def add(lesson, entry, kind, ref, *, layer="", tags=(), removed="", present=(), owner="",
        open_gates=(), table="", music=False, note="", extra_gates=(), teacher=None):
    ITEMS.append(dict(lesson=lesson, entry=entry, kind=kind, ref=ref, layer=layer, tags=list(tags),
                      removed=removed, present=list(present), owner=owner, open_gates=set(open_gates),
                      table=table, music=music, note=note, extra_gates=set(extra_gates), teacher=teacher))


def fragments(text: str) -> list[str]:
    """The words of an 'after' cell that must be in the lesson: the runs between ellipses."""
    text = re.sub(r"\([^)]*\)$", "", text.strip())
    parts = [p.strip(" .;:,—-\"'") for p in re.split(r"…|\.\.\.| / ", text)]
    return [p for p in parts if len(p) >= 12]


def table_rows(path: Path) -> list[list[str]]:
    out = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if re.match(r"^\| *\d+ *\|", line):
            out.append([c.strip() for c in line.split("|")[1:-1]])
    return out


# F0 (Entry 82): every corrected sentence, with its layer. docs/prompts/f0-corrected-sentences.md
F0_EXPERT = {  # T54's items, by the owner's split: (A) sourceable, (B) embodied technique, (C) safety
    6: ("A", "the full text of Lehtonen 2009; whether the bass rings longer"),
    7: ("A", "where the dampers catch: 'for the outside expert to confirm'"),
    10: ("B", "the octave alternatives"),
    18: ("B", "repeated-note wording (technique.5)"),
    20: ("B", "rotation wording (technique.6)"),
    32: ("A", "the chord-scale alternatives"),
    52: ("A", "what else separates swing from a shuffle"),
    58: ("A", "standard guitar tuning, S14 not opened"),
    66: ("B", "the left-hand arpeggio fingering"),
}
SPLIT_GATES = {"A": {1, 11}, "B": {2, 9}, "C": {1, 11}}
for cells in table_rows(ROOT / "docs/prompts/f0-corrected-sentences.md"):
    n, lesson_col, before, after, layer, evidence = int(cells[0]), cells[1], cells[2], cells[3], cells[4], cells[5]
    lesson = lesson_col.split()[0]
    # "(T35 area)" names a neighbourhood, not the row: no tag.
    tags = re.findall(r"\bT\d+\b(?! area)", lesson_col) + (["P17"] if "Part 17" in lesson_col else [])
    ref = f"f0-corrected-sentences.md row {n}"
    add(lesson, "E82", "corrected", ref, layer=layer, tags=tags, removed=before,
        present=fragments(after), table="F0")
    if n in F0_EXPERT:
        part, what = F0_EXPERT[n]
        add(lesson, "E82", "open", ref + f" ({what})", owner=f"T54({part})",
            open_gates=SPLIT_GATES[part], present=fragments(after))
    # Hutchinson (S2) sections located by title only: a citation with no section number.
    if re.search(r"\bS2\b", evidence) and not re.search(r"S2 §", evidence):
        add(lesson, "E82", "open", ref + " (S2 cited by a section located by title only)",
            owner="T54(A)", open_gates={1, 11}, present=fragments(after))

# F0a, the addendum to Entry 82: practice.4's referral sentence (source: the NHS page).
add("practice.4", "E82", "corrected", "F0a addendum (Entry 82), lessonClaimsAboutMusic F0a row",
    layer="source", removed="couple of days",
    present=["pain that does not settle, or any numbness or tingling, is a reason to see a doctor or a physiotherapist"],
    teacher=False, note="F0a's brief does not restate the teacher test, so gate 12 is not mapped")
add("practice.4", "E82", "open", "F0a addendum (no clinician has read it)", owner="T54(C)", open_gates={1, 11},
    present=["pain that does not settle, or any numbness or tingling"])

# F0: unchanged sentences verified (f0-corrected-sentences.md:77; f0-disposition-85.md rows named).
F0_VERIFIED = [
    ("0.2", "disposition row 3", "source", ["to the next c — twelve keys"]),
    ("2.2", "disposition row 13 (the 6/8 count)", "source", []),
    ("2.5", "disposition row 16 (bar 12)", "code (score)", []),
    ("classical.4", "disposition row 30 ('Five options')", "code", ["five options"]),
    ("ragtime.5", "disposition row 49 ('Not fast.')", "code", ["not fast"]),
    ("ragtime.6", "disposition row 59 (the three dates)", "source", []),
    ("ragtime.7", "disposition row 66 (accidentals)", "code", ["more accidentals to the bar than anything else on this rung"]),
    ("ragtime.8", "disposition rows 77-78 (key signatures; 'last decade')", "code + source", []),
    ("latin", "disposition row 53 ('(1916)' verified absent)", "removed", []),
    ("blues.6", "disposition row 62 (the Ladder sentence)", "code", ["will not let the tempo rise"]),
    ("classical.8", "disposition row 75 ('the fastest thing')", "code (score)", ["the fastest thing"]),
    ("jazz.7", "disposition row 69 (the stride sentence, T22's rewrite)", "code", []),
]
for lesson, ref, layer, present in F0_VERIFIED:
    add(lesson, "E82", "verified", "f0-disposition-85.md " + ref, layer=layer, present=present, table="F0v")
add("2.2", "E82", "open", "f0-disposition-85.md row 13 (S2, meter: a section located by title only)",
    owner="T54(A)", open_gates={1, 11})
add("jazz.7", "E82", "open", "f0-disposition-85.md row 69 (whether the pattern is stride)",
    owner="T54(A)", open_gates={1, 11})

# F0: the old audit's deferrals still open after F1 (rows 5, 14, 18, 29, 34, 41, 46, 63, 70, 85, 87)
# and F3a (rows 1, 8, 9, 12, 42, 60, 67, 81). Category -> the gates left open.
CATEGORY_GATES = {"musical judgement": {1, 3, 12}, "contested fact": {1, 11, 12}, "outside expert": {1, 11, 12}}
F0_OPEN = [
    (2, "0.1", "outside expert", ["slowly enough"]),
    (19, "classical.3", "contested fact", ["commoner"]),
    (21, "latin.3", "musical judgement", ["gentler"]),
    (22, "holiday.3", "outside expert", ["a below middle c"]),
    (23, "4.2", "contested fact", ["unsingable"]),
    (27, "4.6", "musical judgement", ["two or four bars"]),
    (28, "classical.4", "musical judgement", ["all legato, for the opposite touch"]),
    (43, "classical.5", "musical judgement", ["arabesque"]),
    (44, "chords-pop.5", "musical judgement", ["two ballads that live on seventh chords"]),
    (45, "chords-pop.5", "musical judgement", ["row row row your boat as an arpeggio study"]),
    (47, "blues.5", "musical judgement", ["conversation"]),
    (50, "ragtime.5", "musical judgement", ["without the problem on top"]),
    (55, "rock.5", "musical judgement", ["hinge"]),
    (56, "rock.5", "contested fact", ["cannot hold"]),
    (57, "classical.6", "musical judgement", ["none of them is fast"]),
    (64, "classical.7", "musical judgement", ["beat two or three"]),
    (65, "ragtime.7", "musical judgement", ["deliberately"]),
    (72, "chords-pop.7", "musical judgement", ["spread voicings"]),
    (74, "rock.7", "musical judgement", ["sixteen-bar idea"]),
    (83, "chords-pop.8", "contested fact", ["orchestra"]),
    (86, "chords-pop.9", "musical judgement", ["decides everything"]),
]
DISPOSITION_CLAIM = {int(c[0]): c[3] for c in table_rows(ROOT / "docs/prompts/f0-disposition-85.md")}
for row, lesson, category, present in F0_OPEN:
    claim = DISPOSITION_CLAIM[row]
    if not claim.startswith(lesson + ":"):
        sys.exit(f"disposition row {row} names {claim.split(':')[0]}, not {lesson}")
    # The claim's absolute word, if it has one, is part of what is left undecided.
    gates = CATEGORY_GATES[category] | ({5} if LINT_WORDS.search(claim.split(":", 1)[1]) else set())
    add(lesson, "E82", "open", f"f0-disposition-85.md row {row} ({category})", owner="T53",
        open_gates=gates, present=present)

# F0 and F1: absolutes found while correcting, and Part 17 section 20's voice items (backlog T53;
# entry-82.md:49-63), still open; Part 16 section 7's hands-separate ritual (entry-82.md:63, backlog L33).
T53_ABSOLUTES = [
    ("technique.7", "T53: 'do not learn the rhythm as a pattern of words'", ["pattern of words"]),
    ("blues.7", "T53: the shuffle as 'most of what makes a blues'", ["most of what makes a blues"]),
    ("2.3", "T53: 'no coincidence'", ["no coincidence"]),
    ("2.5", "T53: 'exactly two ways'", ["exactly two ways"]),
    ("improv.3", "Part 17 s20, entry-82.md:58: 'almost every memorable melody'", ["almost every memorable melody"]),
    ("improv.6", "Part 17 s20, entry-82.md:59: most weak solos weak rhythmically", ["most weak solos are weak rhythmically"]),
    ("jam", "Part 17 s20, entry-82.md:60: bands always speed up", ["bands always speed up"]),
    ("theory.9", "Part 17 s20, entry-82.md:62: almost all short music one phrase structure", ["almost all short music"]),
    ("classical.9", "F1's found on the way (backlog T53): 'the single most common way to waste a year'",
     ["the single most common way to waste a year"]),
    ("rock.6", "F1's found on the way (backlog T53): 'worth more here than almost anywhere'",
     ["worth more here than almost anywhere"]),
]
for lesson, ref, present in T53_ABSOLUTES:
    add(lesson, "E82" if "F1" not in ref else "E88", "open", ref, owner="T53", open_gates={5, 12}, present=present)
for lesson, present in (("0.3", ["start almost every piece hands separately"]),
                        ("2.1", ["right hand alone until it is automatic"])):
    add(lesson, "E82", "open", "Part 16 s7, entry-82.md:63: hands separately as a ritual", owner="L33",
        open_gates={3, 5}, present=present)

# F1 (Entry 88): the eleven voice rows, twelve sentences. docs/prompts/entry-88.md table.
for cells in table_rows(ROOT / "docs/prompts/entry-88.md"):
    if len(cells) < 6 or not cells[5].startswith("teacher"):
        continue
    n, lesson_col, before, after, _reason, layer = cells[:6]
    lesson = lesson_col.split(":")[0]
    add(lesson, "E88", "corrected", f"entry-88.md table row {n}", layer=layer, removed=before,
        present=fragments(after), table="F1", extra_gates={4} if lesson == "classical.9" else set())

# F3a (Entry 157): every changed sentence, with its layer. docs/prompts/runs/F3a/sentences.md
for cells in table_rows(ROOT / "docs/prompts/runs/F3a/sentences.md"):
    n, lesson_col, before, after, layer, _evidence = int(cells[0]), cells[1], cells[2], cells[3], cells[4], cells[5]
    lesson = lesson_col.split()[0]
    tags = re.findall(r"\bT\d+\b", lesson_col)
    in_unit_table = n <= 34  # rows 1-34 are F3A_SENTENCES and the F1_VOICE revision; 35-37 are F0_APP (T52)
    add(lesson, "E157", "corrected", f"runs/F3a/sentences.md row {n}", layer=layer, tags=tags, removed=before,
        present=fragments(after), table="F3a" if in_unit_table else "F3a-app", music="unverified as music" in layer)

# F3a: checked and kept (runs/F3a/sentences.md, "Checked and kept").
F3A_KEPT = [
    ("practice.3", "kept: review intervals, 'a starting guess'", "code", ["a starting guess"], False),
    ("classical.4", "kept: 'typically' texture sentence", "teacher", ["typically"], True),
    ("classical.4", "kept: the trill, 'never below'", "source + notation", ["never below"], False),
    ("classical.6", "kept: the rubato description (F0 row 68, S12)", "source", ["keeps time while the melody is free"], False),
    ("technique.6", "kept: where the written trill begins and ends", "notation", ["on the main note last"], False),
]
for lesson, ref, layer, present, music in F3A_KEPT:
    add(lesson, "E157", "verified", "runs/F3a/sentences.md " + ref, layer=layer, present=present,
        removed=" ".join(present), music=music, table="F3a-kept")

# F3a follow-ups recorded as backlog T56: adjacent sentences with the lint's word and the line.
T56 = [
    ("practice.1", "practice.1:12 'Most practice'", ["most practice"]),
    ("practice.2", "practice.2:12 'almost nobody'", ["almost nobody"]),
    ("practice.3", "practice.3 title 'should look like'", []),
    ("practice.3", "practice.3:27-28", []),
    ("practice.3", "practice.3:31", []),
    ("practice.5", "practice.5:21", []),
    ("practice.5", "practice.5:27 'The fix is'", ["the fix is"]),
    ("classical.3", "classical.3:20", []),
    ("classical.3", "classical.3:28", []),
    ("classical.3", "classical.3:31", []),
    ("classical.4.shelf", "classical.4.shelf:16", []),
    ("classical.6", "classical.6:20", []),
    ("classical.6", "classical.6:44", []),
    ("1.5", "1.5:36-39 'the single most valuable practice tool'", ["the single most valuable practice tool"]),
    ("ragtime.6", "ragtime.6:77-78 'The easiest way in'", ["the easiest way in"]),
    ("ragtime.6", "ragtime.6:80-81", []),
    ("ragtime.7", "ragtime.7:21", []),
    ("ragtime.7", "ragtime.7:39", []),
    ("ragtime.7", "ragtime.7:52-53", []),
    ("blues.8", "blues.8:20-23 (dates)", []),
    ("blues.8", "blues.8:37-39", []),
    ("chords-pop.7", "chords-pop.7:22-23 'sounds like jazz'", ["sounds like jazz"]),
]
for lesson, ref, present in T56:
    add(lesson, "E157", "open", "backlog T56: " + ref, owner="T56", open_gates={5}, present=present)

# CL01 (Entry 189): this lane.
add("improv.3", "E189", "corrected", "CL01_SENTENCES row improv.3 (:17-19)",
    layer="arithmetic (fifteen note-and-chord pairs worked) + teacher", tags=["T4", "T47"],
    removed="Nothing you play can be wrong, because all five notes belong to all three chords or are a step away from one.",
    present=["for pitch, any of these five notes can work here: over each of the three chords, each note is either a chord tone or a step from one"])
add("ragtime.9", "E189", "corrected", "CL01_SENTENCES row ragtime.9 (:60-61)", layer="teacher", tags=["T4"],
    removed="Memory laid down fast has the errors in it, and those never come out.",
    present=["memorising at full tempo. if you memorise mistakes at full tempo, they can be hard to unlearn"])
add("improv.8", "E189", "verified", "improv.8:15 read, kept: a justified absolute (the tritone substitution)",
    layer="theory identity (a dominant seventh's third and seventh are shared with the dominant a tritone away, all twelve)",
    removed="Every dominant chord can become the dominant a tritone away.",
    present=["every dominant chord can become the dominant a tritone away"])
add("improv.4", "E189", "verified", "improv.4:14-17 read, kept as already hedged (F0 row 65's rewrite; also listed in T56)",
    layer="teacher", removed="no note that sounds wrong over most diatonic progressions. It is the reason",
    present=["no note that sounds wrong over most diatonic progressions"])
CL01_OBSERVED = [
    ("improv.3", "improv.3:21-24 'most of what makes an improvisation sound good is rhythm and space'", {3, 5},
     ["most of what makes an improvisation sound good"]),
    ("improv.8", "improv.8:12-13 'the best way to learn composition'", {5}, ["the best way to learn composition"]),
    ("improv.8", "improv.8:16 'it works everywhere, and it changes the bass line from leaps into a chromatic descent'",
     {1, 5}, ["it works everywhere"]),
    ("improv.8", "improv.8:19 'Any chord can be preceded by its own dominant'", {1, 5},
     ["any chord can be preceded by its own dominant"]),
    ("ragtime.9", "ragtime.9:23-24 'Any one will fail on its own under pressure; all three will not'", {3, 5},
     ["any one will fail on its own under pressure"]),
]
for lesson, ref, gates, present in CL01_OBSERVED:
    add(lesson, "E189", "open", "observed in CL01's read: " + ref, owner="T48", open_gates=gates, present=present)


# --------------------------------------------------------------------------- the rule

def lint_hit(text: str) -> bool:
    return bool(LINT_WORDS.search(text or ""))


def gates_of(item: dict) -> set[int]:
    """The gates an item answers (covered) or leaves open (open). Never 7 or 8."""
    if item["kind"] == "open":
        return set(item["open_gates"])
    layer = item["layer"].lower()
    gates: set[int] = set()
    if "source" in layer:
        gates |= {1, 11}
    if any(k in layer for k in ("code", "notation", "arithmetic", "theory identity", "definition")):
        gates.add(1)
    if "teacher" in layer:
        gates.add(3)
    if "removed" in layer:
        gates.add(11)
    for tag in item["tags"]:
        gates |= TAG_GATES.get(tag, (set(), ""))[0]
    if item["table"] in ("F1", "F3a") or lint_hit(item["removed"]):
        gates.add(5)
    teacher = item["teacher"] if item["teacher"] is not None else item["entry"] in TEACHER_TEST
    if item["kind"] == "corrected" and teacher:
        gates.add(12)
    if item["ref"] in GATE4_ROWS:
        gates.add(4)
    gates |= item["extra_gates"]
    return gates - {7, 8}


# --------------------------------------------------------------------------- the record

def resolve() -> tuple[dict, list[dict]]:
    texts = {lesson: body(lesson) for lesson in lesson_ids()}
    for item in ITEMS:
        if item["lesson"] not in texts:
            item["at_head"] = None  # not a lesson (a tip) or a name that does not resolve
            continue
        item["at_head"] = all(norm(f) in texts[item["lesson"]] for f in item["present"])
        item["gates"] = sorted(gates_of(item)) if item["at_head"] else []
    return texts, ITEMS


def cell(lesson: str, gate: int, by_lesson: dict) -> str:
    if gate == 7:
        return "belongs to CL19"
    if gate == 8:
        return "belongs to T16"
    covered: dict[str, int] = defaultdict(int)
    music = False
    opened: dict[str, int] = defaultdict(int)
    for item in by_lesson.get(lesson, []):
        if not item.get("at_head") or gate not in item["gates"]:
            continue
        if item["kind"] == "open":
            opened[item["owner"]] += 1
        else:
            covered[item["entry"]] += 1
            music = music or item["music"]
    parts = []
    if covered:
        order = sorted(covered, key=lambda e: int(e[1:]))
        parts.append("covered by " + ", ".join(f"{e} ({covered[e]})" for e in order) + ("*" if music else ""))
    for owner in sorted(opened):
        parts.append(f"read, open: {owner} ({opened[owner]})")
    parts.append("belongs to T16" if gate == 10 else "not yet read")
    return " + ".join(parts)


HEADER = """# CL01 — the twelve-gate coverage record, 109 lessons (Entry 189)

An inventory of evidence, not a claim that any gate is satisfied (the reviewer's words,
`docs/review/responses/questions-e71ef3ad.md` §CL01). Generated by `scripts-coverage.py`
beside this file from the tables named below and the lessons at the tree the entry names;
`scripts-coverage.py --check` is the 109 × 12 check (`coverage-check.txt`).

## The sources

- **Entry 82 (F0):** `docs/prompts/f0-corrected-sentences.md` rows 1–69 (every sentence F0
  corrected, with its layer) and its verified list (:77); `docs/prompts/f0-disposition-85.md`,
  its verified, re-checked and still-deferred rows by number; F0a's addendum sentence
  (practice.4); `docs/prompts/entry-82.md`:49–63 (Part 17 §20 and Part 16 §7, classified); the
  absolutes found while correcting, backlog T53 (`backlog-2026-09-25.md`:583).
- **Entry 88 (F1):** `docs/prompts/entry-88.md`'s table, twelve rows, and the two sentences it
  found on the way (backlog T53).
- **Entry 157 (F3a):** `docs/prompts/runs/F3a/sentences.md`, rows 1–37 and *Checked and kept*;
  the adjacent sentences it recorded, backlog T56 (`backlog-2026-09-25.md`:586).
- **Entry 189 (CL01):** this entry's four reads (improv.3:17–19, ragtime.9:60–61, improv.8:15,
  improv.4:14–17) and five sentences noticed while reading them.

F0's deferrals that later entries resolved are counted through those entries' rows: F1 took
rows 5, 14, 18, 29, 34, 41, 46, 63, 70, 85 and 87; F3a took rows 1, 8, 9, 12, 42, 60, 67 and 81.
Rows 2, 19, 21, 22, 23, 27, 28, 43, 44, 45, 47, 50, 55, 56, 57, 64, 65, 72, 74, 83 and 86 are
still open, each still in its lesson at this tree.

## What a cell says

Every lesson has all twelve gates. A cell is one or more of these, joined by ` + `:

- **`covered by E<n> (k)`** — k sentences of this lesson carry evidence from Entry n that the
  rule below maps to this gate. It covers those k sentences only.
- **`read, open: <owner> (k)`** — k sentences an earlier entry read against this gate and left
  undecided, with the backlog row that owns the decision (T53: F0's deferrals and the
  absolutes found while correcting; T54(A), (B), (C): the outside-expert list by the owner's
  split, `responses/questions-bd7d303e.md` §8; T56: F3a's adjacent sentences; L33: Part 16 §7's
  hands-separate ritual; T48: sentences this entry noticed while reading, for the combined
  per-lesson read).
- **`not yet read`** — no mapped entry read this lesson (after a `covered` or `open` part: the
  rest of the lesson) against this gate. No entry mapped here read a whole lesson against a
  gate, so every cell with evidence still ends in `not yet read`.
- **`belongs to T16`** — gate 8 for every lesson, and gate 10 after any sentence evidence:
  the reviewer's ruling gives T16 "gates 8/10 against the settled claims/concepts/stage
  data", read in the combined per-lesson batches (§CL01, *T16 sequencing*). Open.
- **`belongs to CL19`** — gate 7 for every lesson. Open. Gate 7 (hear, play, notice first;
  name and explain second) is a property of a lesson's order, not of one sentence; CL19 owns
  that order for every file in `content/lessons` (T17, the arc hear → notice → try →
  understand; T7, notice before rules; ruled one migration/audit under T11's teaching-plan
  contract, `responses/questions-53670d2a.md`; CL19's proof "a gate record per lesson").
  No mapped entry read any lesson against gate 7.
- **`*`** after a `covered` part — the entry marks at least one of those sentences
  *unverified as music*.

`E82` is Entry 82 (F0, with its F0a addendum), `E88` Entry 88 (F1), `E157` Entry 157 (F3a),
`E189` this entry (CL01).

## The rule: which table answers which gate

Each evidence item is one sentence. An item counts only if its words are still in the lesson
at this tree (its *after* words, or the words read); an item whose words have changed since is
listed at the end as not at HEAD and maps to nothing. For a **corrected** or **verified** item:

1. **By layer** (the layer column each table writes): `source` → gates 1 and 11; `code`,
   `notation`, worked `arithmetic` or a `theory identity` → gate 1; `teacher` (a heuristic
   written as one) → gate 3; `removed` (an unsourced claim taken out) → gate 11.
2. **By backlog row** (the row the table names beside the lesson), the gates that row's problem
   is about:
{tags}
3. **Gate 5** — every row of `F1_VOICE` (E88) and of the unit table `F3A_SENTENCES` with the
   `F1_VOICE` revision (E157 rows 1–34): each table's own record says each row removes an
   uncounted absolute or a stated certainty (the section comments above the two arrays in
   `lessonClaimsAboutMusic.test.ts`). Any other item whose removed or read words contain a
   word of `tools/content/lint_absolutes.py`'s list (gate 5's seven and F0's four): that
   sentence had the explicit review gate 5 asks for. And the rows tagged T4, T47 or Part 17
   §20, whose problem is itself a universal claim (rule 2).
4. **Gate 12** — a **corrected** sentence in an entry whose own record put every corrected
   sentence through the teacher test:
{teacher}

   Not F0a's sentence (its brief does not restate the test), not a verified sentence (checked
   for fact, not for the teacher test), and not an open item.
5. **Gate 4** — the T41 rows (a ratio given as the definition), F1's classical.9 row, which
   F1's table itself calls fake precision (`entry-88.md`:79), and the rows whose removed words
   were a fixed count, tempo, percentage or duration: F0 row 27 (four 20-minute sessions) and
   F3a rows 4, 5, 6, 9, 14 and 16 (five in a row, five running, half the speed, three clean and
   5 %, five minutes of warm-up, a week).
6. **Never gates 7 or 8.** No table row is about a lesson's order or about transfer.

For a **read, open** item the gates are the ones left undecided: F0's deferral categories
(musical judgement → 1, 3, 12; contested fact and outside expert → 1, 11, 12), T54's split
((A) sourceable and (C) safety → 1, 11; (B) embodied technique → 2, 9), the absolutes lists
(→ 5, 12), T56 (→ 5, the lint's word), L33 (→ 3, 5) and this entry's observations (the gates
named beside each).

A gate this rule cannot map from a table cell is `not yet read`, never stretched to look
covered. **Not mapped, so a `not yet read` cell can undercount:** lesson sentences changed for
placement or score facts by Entries 84 (4.3's warning), 108, 117, 136 and 156; the claims rows
in `lessonClaims*.test.ts`, which pin many repertoire and app sentences against the built data
(agreement checks written over many entries, not a gate review); the pre-gate lesson audit of
2026-09-19 (`docs/lesson-audit/`), whose open items F0's disposition table reconciles.
"""


def write_record() -> str:
    texts, items = resolve()
    by_lesson: dict[str, list[dict]] = defaultdict(list)
    for item in items:
        by_lesson[item["lesson"]].append(item)
    tags = "\n".join(f"   - {t} → {', '.join(str(g) for g in sorted(gs))} — {why}" for t, (gs, why) in TAG_GATES.items())
    teacher = "\n".join(f"   - {e}: {why}" for e, why in TEACHER_TEST.items())
    out = [HEADER.replace("{tags}", tags).replace("{teacher}", teacher)]

    # Per-gate counts.
    lessons = lesson_ids()
    n = len(lessons)
    out += [f"## Counts per gate (lessons of {n})", "",
            "Each lesson falls in exactly one of the first three columns, by the strongest part of its",
            "cell: a `covered` part (it may also have `read, open` parts), a `read, open` part and no",
            "`covered` part, or nothing but `not yet read`. Every cell in the first two columns still ends",
            "in `not yet read` (or, for gate 10, `belongs to T16`) for the rest of the lesson. Gates 7 and 8",
            "are `belongs to` and nothing else.", "",
            "| gate | `covered` part | `read, open` only | `not yet read` only | `belongs to` |",
            "| --- | --- | --- | --- | --- |"]
    per_entry: dict[int, dict[str, int]] = {}
    per_owner: dict[int, dict[str, int]] = {}
    for g in GATES:
        cells = [cell(lesson, g, by_lesson) for lesson in lessons]
        cov = sum("covered by" in c for c in cells)
        opn = sum("read, open" in c and "covered by" not in c for c in cells)
        if g in (7, 8):
            owner = "CL19" if g == 7 else "T16"
            out.append(f"| {g} {GATE_NAMES[g]} | 0 | 0 | 0 | {n} ({owner}) |")
        else:
            if g == 10:
                only = sum(c == "belongs to T16" for c in cells)
                out.append(f"| {g} {GATE_NAMES[g]} | {cov} | {opn} | — | {only} with nothing else; all {n} carry T16 |")
            else:
                only = sum(c == "not yet read" for c in cells)
                out.append(f"| {g} {GATE_NAMES[g]} | {cov} | {opn} | {only} | 0 |")
        per_entry[g] = {e: sum(re.search(rf"\b{e} \(", c) is not None for c in cells) for e in ("E82", "E88", "E157", "E189")}
        per_owner[g] = {o: sum(f"read, open: {o} (" in c for c in cells)
                        for o in ("T53", "T54(A)", "T54(B)", "T54(C)", "T56", "L33", "T48")}
    out += ["", "Lessons per gate with a `covered` part from each entry, and with a `read, open` part for",
            "each owner (a lesson counts under every entry and owner its cell names):", "",
            "| gate | E82 | E88 | E157 | E189 | T53 | T54(A) | T54(B) | T54(C) | T56 | L33 | T48 |",
            "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |"]
    for g in GATES:
        e, o = per_entry[g], per_owner[g]
        out.append(f"| {g} | " + " | ".join(str(e[k]) for k in ("E82", "E88", "E157", "E189")) + " | "
                   + " | ".join(str(o[k]) for k in ("T53", "T54(A)", "T54(B)", "T54(C)", "T56", "L33", "T48")) + " |")
    out.append("")

    # The table.
    out += ["## The record", "",
            "| lesson | " + " | ".join(f"G{g}" for g in GATES) + " |",
            "| --- | " + " | ".join("---" for _ in GATES) + " |"]
    for lesson in lessons:
        out.append(f"| {lesson} | " + " | ".join(cell(lesson, g, by_lesson) for g in GATES) + " |")
    out.append("")

    # The evidence index.
    out += ["## Evidence items, by lesson", "",
            "Each item: entry, kind, where the table has it, the gates it maps to (for an open item, the",
            "gates left open, with the owner). The cells above count these and nothing else.", ""]
    for lesson in lessons:
        rows = [i for i in by_lesson.get(lesson, []) if i["at_head"]]
        if not rows:
            continue
        out.append(f"**{lesson}**")
        for i in rows:
            gates = ", ".join(str(g) for g in i["gates"]) or "none"
            what = f"open: {i['owner']}" if i["kind"] == "open" else i["kind"]
            music = "; unverified as music" if i["music"] else ""
            note = f"; {i['note']}" if i["note"] else ""
            out.append(f"- {i['entry']} {what} — {i['ref']} — gates {gates}{music}{note}")
        out.append("")
    gone = [i for i in items if i["at_head"] is False]
    other = [i for i in items if i["at_head"] is None]
    out += ["## Items not at HEAD (their words have changed since; they map to nothing)", ""]
    out += [f"- {i['lesson']}: {i['entry']} {i['kind']} — {i['ref']}" for i in gone] or ["None."]
    out += ["", "## Items outside the 109 lessons (not counted)", ""]
    out += [f"- {i['lesson']}: {i['entry']} {i['kind']} — {i['ref']}" for i in other] or ["None."]
    out.append("")
    text = "\n".join(out)
    RECORD.write_text(text, encoding="utf-8", newline="\n")
    return text


# --------------------------------------------------------------------------- the check

CELL_PART = re.compile(
    r"^(covered by E\d+ \(\d+\)(, E\d+ \(\d+\))*\*?"
    r"|read, open: (T53|T54\((A|B|C)\)|T56|L33|T48) \(\d+\)"
    r"|not yet read|belongs to T16|belongs to CL19)$")


def check(path: Path) -> int:
    faults: list[str] = []
    if not path.exists():
        print(f"FAULT: no record at {path.name}")
        return 1
    lessons = lesson_ids()
    rows: dict[str, list[str]] = {}
    in_table = False
    header_ok = False
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.startswith("## The record"):
            in_table = True
            continue
        if in_table and line.startswith("## "):
            break
        if not in_table or not line.startswith("|"):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if cells[0] == "lesson":
            header_ok = cells[1:] == [f"G{g}" for g in GATES]
            continue
        if set(cells[0]) <= {"-", " "}:
            continue
        if cells[0] in rows:
            faults.append(f"{cells[0]}: two rows")
        rows[cells[0]] = cells[1:]
    if not header_ok:
        faults.append("the header row is not lesson, G1 ... G12")
    missing = [l for l in lessons if l not in rows]
    extra = [l for l in rows if l not in lessons]
    faults += [f"{l}: no row" for l in missing] + [f"{l}: not a lesson" for l in extra]
    # Trace every covered part to the evidence items the rule maps.
    _, items = resolve()
    mapped: dict[tuple[str, int, str], int] = defaultdict(int)
    for i in items:
        if i.get("at_head") and i["kind"] != "open":
            for g in i["gates"]:
                mapped[(i["lesson"], g, i["entry"])] += 1
    for lesson, cells in rows.items():
        if len(cells) != 12:
            faults.append(f"{lesson}: {len(cells)} gate cells, not 12")
            continue
        for g, c in zip(GATES, cells):
            if not c:
                faults.append(f"{lesson} G{g}: empty")
                continue
            parts = c.split(" + ")
            for p in parts:
                if not CELL_PART.match(p):
                    faults.append(f"{lesson} G{g}: '{p}' is not in the vocabulary")
            if g == 7 and c != "belongs to CL19":
                faults.append(f"{lesson} G7: '{c}'")
            if g == 8 and c != "belongs to T16":
                faults.append(f"{lesson} G8: '{c}'")
            if g not in (7, 8) and parts[-1] != ("belongs to T16" if g == 10 else "not yet read"):
                faults.append(f"{lesson} G{g}: does not end with the rest's status")
            for e, k in re.findall(r"(E\d+) \((\d+)\)", c):
                if mapped[(lesson, g, e)] != int(k):
                    faults.append(f"{lesson} G{g}: {e} ({k}) but the rule maps {mapped[(lesson, g, e)]}")
    print(f"rows {len(rows)} of {len(lessons)} lessons; gate columns per row: "
          f"{sorted({len(c) for c in rows.values()}) or '-'}; faults {len(faults)}")
    for f in faults[:40]:
        print("FAULT:", f)
    return 1 if faults else 0


if __name__ == "__main__":
    if "--check" in sys.argv:
        rest = [a for a in sys.argv[1:] if a != "--check"]
        sys.exit(check(Path(rest[0]) if rest else RECORD))
    write_record()
    print(f"wrote {RECORD.relative_to(ROOT)}")
