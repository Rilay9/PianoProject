#!/usr/bin/env python3
"""The chain preflight (FABLE.md section 2 item 5, the Convergence sentence; the owner, 2026-10-07).

Every defect class a slice finds becomes a check run on every chain record (``docs/chains/*.yaml``) before
dispatch, so no later slice rediscovers it. ``check_chains.py`` holds the record's shape; this script holds the
classes a slice found behind a record that passed its shape. For each record it reports, per record and per step,
PASS, FAIL or NOT-APPLICABLE for each class, with the evidence behind every verdict.

The six seed classes, each found by the A7c.1 slice (Entries 241-270 of ``docs/pending-review.md``):

 1. **Hand reading** (BZ1, DF2, HD1, HD2). Every passage a Score-screen step plays (a piece or an excerpt, with its
    bars or whole) has its hand reading established for exactly the bars used: a one-staff file by the build's
    declared hand (``build.declared_hand`` through ``passages.declared_hand_of``) or by the one-staff rule (no
    declaration: the model reads the lone staff as the right hand, CL15), which must agree with the row's ``hands``;
    a two-staff file by current verified facts (``content/sources/verified-facts.json``) covering every bar, because
    the voice-home rule is only the compatibility default and which hand plays an arbitrary score's note stays
    UNKNOWN (Entry 248). A passage proof (a ``demand`` row) establishes the hand of the staff it was proved on, with
    the file's HD2 hand rows applied; its staleness is ``passages.stale_reasons``, read, never re-derived. Steps on a
    surface that never reads the score's hands (the lesson page, the chord chart, the Lab, a drill) are
    NOT-APPLICABLE.
 2. **Cut tempo and marks** (BZ1, DF2, CUT1). Every excerpt cut a record uses keeps its parent's tempo and source
    marks: the parent's built file and the cut's built file are read with music21, and the tempo in force at the cut's
    start, the tempo marks inside it, the key and time signatures in force and changing, and the kept staves'
    dynamics and expression texts (the edition texts the cutter drops on purpose, ``excerpts.edition_text_kind``,
    aside) must agree; the catalogue row's ``tempoBpm`` must be the tempo in force, and a cut whose parent prints no
    tempo in force must carry the ``tempo-defaulted`` tag. Marks of a staff a one-hand cut drops are listed, not
    judged (only tempo is carried across staves, by the cutter's rule). Hairpins are not compared.
 3. **Control reachable in its mode** (the phone walk's step 7a, Entry 270; CB1, Entry 267; LB1, Entry 263). Each
    step's tool, and the controls its action and scaffold name, can be reached in the mode the step uses. The
    prerequisites are read from the app's code, never typed here: the Score screen's modes (``MODES``), the opening
    mode of a row opened from a lesson page with an input attached (``settingsStore``'s ``defaultModeWithInput``, as
    ``ScoreScreen`` applies it), Rhythm only's row (``rhythmAvailable``), the Ladder (``ladderApplies``), Duet
    (``otherExists``), Rhythm only remembered across pieces (``let rhythmOnly = settings.rhythmOnly``), the double-tap
    loop's handler, the chord chart's door (``hasChordSymbols``) and whether its Comp and Bass + drums are independent
    (CB1), the standalone Free play route. A control whose mode is not the opening mode passes when the step or the
    rung's lesson names the mode with the control; a remembered Rhythm only before a Keep tempo step passes when the
    step or the lesson says to switch it off. The item must be openable: an option of the placed rung, or of the rung
    a "later rung" step names. What cannot be read statically (inside the Lab, whether a bar is on the page at rest)
    is said and routed to class 6 (NOT-APPLICABLE, ``routed``).
 4. **Counted items match the claim** (G13, Entry 256). What the placed rung's requirements (``content/curriculum/
    stage-*.json``) count matches ``evidence.updates``: every named requirement item is named by id in an update, every
    update's item is counted by a requirement, the counts agree, an unnamed pool counts nothing a step or
    ``never_credits`` says never counts, and every rung requirement has an update. Per step: a step that says its run
    counts is on a counting tool with a counted item; a step that says it counts toward nothing would not be counted.
 5. **Taught-set hold** (SR1-SR4, Entries 251, 258, 262, 264; the untaught-options probe). No generated item a step
    uses asks a demand its rung has not taught: ``claims.untaught_on`` (the build's twin of the app's coping question:
    ``asked_of``, ``rung_ancestry``, ``taughtAt``, taught positions) on the item's measured demands at the placed rung.
    A runtime item (built when it opens) writes no score the build can measure: NOT-APPLICABLE, said.
 6. **Journey derived from the record** (A7SH, Entry 270). A Playwright journey skeleton is generated from the
    record's steps (the route to the placed rung, each step's item opened with its mode, hand, toggles and loop, the
    counted runs played through ``fixtures/midiMock.ts``, the rung's completion asserted), written to the output folder
    (``journey-<ability>.spec.ts``), never to ``app/tests/e2e/``. Per step: PASS when a template made the step,
    NOT-APPLICABLE (``routed``, a ``test.fixme`` line) where no template exists for the tool. ``--compare SPEC``
    lists every difference between the generated steps and a hand-written journey (``compare_journey``).

The placed rung is the rung whose lesson file is a step's ``explanation`` ref, or whose requirements name an item an
update names; a record with none fails class 4 at record level and its rung-dependent checks say so.

Inputs: the record; the committed sources (``content/curriculum/stage-*.json``, ``content/sources/excerpts.json``,
``content/sources/verified-facts.json``, ``content/curriculum/vocabulary/demands.json``, ``content/lessons/``, the app
source files named above); the built content (``app/public/content``: ``catalog.json`` and ``scores/``), which only
the content build writes (``--content`` points elsewhere). Without the built catalogue the script stops with exit 2:
a preflight that cannot read its inputs reports nothing.

Output: one text file per record, ``preflight-<ability>.txt``, under ``--out`` (default
``docs/prompts/runs/PF1``), the same text on stdout, and the generated journey. Report mode exits 0 with findings;
``--strict`` exits 1 on any FAIL (blocking once the reviewer has read it; not wired into CI).

Reuse (CLAUDE.md, reuse before reinvention): the record reader and ref resolver are ``check_chains``'s; the hand rules
are ``build.declared_hand`` and the verified-facts readers; the cut's marks are read by music21 against the cutter's
own staff table (``excerpts.KEEP_STAFF``) and edition-text rule; the taught set is ``claims.untaught_on``; the journey
uses the hand-written journey's helper vocabulary (``a7c1-phone-walk.spec.ts``) and its MIDI mock.

    py -3.11 tools/content/preflight_chains.py [ABILITY ...] [--content DIR] [--out DIR] [--strict]
                                               [--compare app/tests/e2e/a7c1-phone-walk.spec.ts]
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

import yaml

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import check_chains as CC  # noqa: E402

ROOT = HERE.parents[1]
DEFAULT_OUT = "docs/prompts/runs/PF1"
DEFAULT_CONTENT = "app/public/content"

PASS, FAIL, NA = "PASS", "FAIL", "NOT-APPLICABLE"
CLASSES = {
    1: "hand reading",
    2: "cut tempo and marks",
    3: "control reachable in its mode",
    4: "counted items match the claim",
    5: "taught-set hold",
    6: "journey derived from the record",
}

#: The app files class 3 reads its prerequisites from (never a table typed here).
CODE_FILES = {
    "score": "app/src/ui/screens/ScoreScreen.ts",
    "settings": "app/src/data/settingsStore.ts",
    "chart": "app/src/ui/screens/ChordChartScreen.ts",
    "openItem": "app/src/ui/openItem.ts",
    "router": "app/src/router.ts",
}

#: Tools whose screen is the Score screen: the ones that read a score's hands (class 1) and whose modes and
#: settings class 3 reads from ``ScoreScreen.ts``. The names are MODE-SHEET's (sections 1-4 and 9-14).
SCORE_TOOLS = {
    "wait for me", "keep tempo", "hear it", "play it to me", "free play", "rhythm only", "loop", "ladder", "duet",
    "blind", "perform",
}
#: MODE-SHEET section 0 R3/R4: the tools whose row a rung requirement can count (a Keep tempo run at the pass pair; a
#: drill row on accuracy; Simon on its chain). Every other tool's row never meets a requirement: Wait for me (R4,
#: claim 1), Hear it and Free play (no row, section 3-4), Rhythm only (excluded, section 14), the chart, the Lab, the
#: lesson page (nothing stored, sections 7, 15, 31).
COUNTING_TOOLS = {
    "keep tempo", "perform", "reading and theory drills", "ear drills", "simon", "note flash", "find the key",
    "rhythm drill", "melodic dictation", "harmonic dictation", "tune playback", "pedal change",
}
LAB_TOOLS = {"accompaniment lab", "read it", "jam it", "bed only", "hold the chords", "play the tune",
             "trading fours"}
DRILL_TOOLS = {"reading and theory drills", "ear drills", "simon", "note flash", "find the key", "rhythm drill",
               "melodic dictation", "harmonic dictation", "tune playback", "pedal change"}

ID_RE = re.compile(r"\b(?:exercise|drill|song|excerpt)\.[a-z0-9][a-z0-9.\-]*[a-z0-9]")
CID_RE = re.compile(r"\bQm[1-9A-HJ-NP-Za-km-z]{44}\b")
NEGATED = re.compile(r"\b(?:does not|do not|never|not count|nothing|no other|not meet)\b", re.I)
CLAIMS_COUNTED = re.compile(r"\bcounts? toward the\b|\bthis is the counted\b|\bthe counted (?:exercise )?run\b", re.I)
CLAIMS_NOT_COUNTED = re.compile(
    r"\bnot counted\b|\bcounts? toward nothing\b|\bcounted by nothing\b|\bnothing requires it\b|\bcount toward nothing\b",
    re.I)
NUMBER_WORDS = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8}
LATER_RUNG = re.compile(r"\b(?:on a later rung|a new task line on)\b", re.I)


# --------------------------------------------------------------------------------------
# results
# --------------------------------------------------------------------------------------


@dataclass
class Result:
    cls: int
    step: int | None  # None for a record-level verdict
    verdict: str
    evidence: list[str] = field(default_factory=list)
    routed: bool = False  # NOT-APPLICABLE because a static check is impossible (class 3 to class 6)

    def lines(self, label: str) -> list[str]:
        where = "record" if self.step is None else f"step {self.step}"
        head = f"  {where:<8} {self.verdict}{' (routed to class 6)' if self.routed else ''}  {label}".rstrip()
        return [head] + [f"           - {line}" for line in self.evidence]


# --------------------------------------------------------------------------------------
# the inputs, read once (injectable for the tests)
# --------------------------------------------------------------------------------------


class InputsMissing(Exception):
    """An input the preflight cannot run without (the built catalogue): the command line exits 2."""


class Context:
    """Everything a class reads. ``from_tree`` reads a real tree; the tests build one by hand."""

    def __init__(self, *, root: Path, catalog: list[dict], curriculum: dict, demands: dict[str, dict],
                 facts: list[dict], excerpts: list[dict], code: dict[str, str], content: Path,
                 lesson_text=None, resolver: CC.Resolver | None = None, version: str | None = None) -> None:
        self.root = root
        self.catalog = catalog
        self.by_id = {row["id"]: row for row in catalog if isinstance(row, dict) and "id" in row}
        self.curriculum = curriculum
        self.demands = demands
        self.facts = facts
        self.excerpts = excerpts
        self.code = code
        self.content = content
        self._lesson_text = lesson_text
        self.resolver = resolver
        self._version = version
        self._ancestry = None

    @classmethod
    def from_tree(cls, root: Path = ROOT, content: Path | None = None) -> "Context":
        content = content or (root / DEFAULT_CONTENT)
        catalog_path = content / "catalog.json"
        if not catalog_path.is_file():
            raise InputsMissing(f"preflight: no built catalogue at {catalog_path}: run tools/content/build.py first "
                                f"(or point --content at a built content folder)")
        catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
        stages = []
        for path in sorted((root / "content" / "curriculum").glob("stage-*.json"), key=lambda p: int(re.sub(r"\D", "", p.stem) or 0)):
            stages += json.loads(path.read_text(encoding="utf-8")).get("stages", [])
        demands = {d["id"]: d for d in json.loads(
            (root / "content/curriculum/vocabulary/demands.json").read_text(encoding="utf-8"))["demands"]}
        facts = json.loads((root / "content/sources/verified-facts.json").read_text(encoding="utf-8"))["facts"]
        excerpts = json.loads((root / "content/sources/excerpts.json").read_text(encoding="utf-8"))["excerpts"]
        code = {}
        for key, rel in CODE_FILES.items():
            path = root / rel
            # Line endings normalised: a Windows checkout reads CRLF, and the rules below match on lines.
            code[key] = path.read_text(encoding="utf-8").replace("\r\n", "\n") if path.is_file() else ""
        return cls(root=root, catalog=catalog, curriculum={"stages": stages}, demands=demands, facts=facts,
                   excerpts=excerpts, code=code, content=content, resolver=CC.Resolver(root))

    # -- derived, cached --------------------------------------------------------------

    def lessons(self):
        for stage in self.curriculum.get("stages", []):
            for unit in stage.get("units", []):
                for lesson in unit.get("lessons", []):
                    yield stage, unit, lesson

    def lesson(self, rung: str) -> tuple[dict, dict, dict] | None:
        return next(((s, u, l) for s, u, l in self.lessons() if l.get("id") == rung), None)

    def ancestry(self) -> dict[str, set[str]]:
        if self._ancestry is None:
            import claims

            self._ancestry = claims.rung_ancestry(self.curriculum)
        return self._ancestry

    def lesson_text(self, rung: str) -> str:
        if self._lesson_text is not None:
            return self._lesson_text(rung)
        found = self.lesson(rung)
        if not found or not found[2].get("textFile"):
            return ""
        path = self.root / "content" / found[2]["textFile"]
        return path.read_text(encoding="utf-8").replace("\r\n", "\n") if path.is_file() else ""

    def version(self) -> str:
        if self._version is None:
            import passages

            self._version = passages.definition_version()
        return self._version

    def item_for(self, ref: str) -> tuple[str | None, tuple[int, int] | None]:
        """The catalogue id a content ref names (a CID mapped through pdmx.json) and its bars, or (None, None)."""
        text = str(ref).strip()
        bars = None
        match = CC.BARS_RE.match(text)
        if match:
            text, bars = match.group("target"), (int(match.group("a")), int(match.group("b")))
        if text in self.by_id:
            return text, bars
        if self.resolver is not None:
            row = self.resolver.pdmx_by_cid.get(text)
            if row is not None and row.get("id") in self.by_id:
                return row["id"], bars
        return None, bars

    def excerpt_row(self, item_id: str) -> dict | None:
        import excerpts

        for row in self.excerpts:
            try:
                if excerpts.excerpt_id(row["of"], int(row["fromBar"]), int(row["toBar"]), row["selection"]) == item_id:
                    return row
            except (KeyError, TypeError, ValueError):
                continue
        return None


# --------------------------------------------------------------------------------------
# record helpers
# --------------------------------------------------------------------------------------


def norm(text) -> str:
    return CC.norm_tool(text or "")


def step_text(step: dict) -> str:
    parts = [step.get("action"), step.get("no_removal_reason"), " ".join(map(str, step.get("scaffold") or []))]
    return " ".join(str(p) for p in parts if p)


def scaffold_has(step: dict, *words: str) -> bool:
    items = [str(s).casefold() for s in step.get("scaffold") or []]
    return any(any(w in item for w in words) for item in items)


def step_hand(step: dict) -> str | None:
    """The hand a step names: 'L' for the left hand or the bass alone, 'R' for the right; None when unnamed."""
    text = step_text(step).casefold()
    if "app plays the other hand" in text and "left hand" in text:
        return "L"
    if re.search(r"\bleft hand\b|\bleft-hand\b|\bbass alone\b", text):
        return "L"
    if re.search(r"\bright hand\b|\bright-hand\b", text) and "the app plays the right" not in text:
        return "R"
    return None


def ids_in(text: str) -> list[str]:
    return list(dict.fromkeys(ID_RE.findall(text or "") + CID_RE.findall(text or "")))


def clauses(text: str) -> list[str]:
    """Clauses of a sentence-ish text: split at semicolons and at a full stop before a capital."""
    return [c for c in re.split(r";|(?<=\.)\s+(?=[A-Z(])", text or "") if c.strip()]


@dataclass
class Placement:
    rung: str | None
    how: list[str]


def placed_rung(rec: dict, ctx: Context) -> Placement:
    """The rung the record's ability is placed on: the rung whose lesson file a step's explanation names, or whose
    requirements name an item an update names. Several are reported; the first by lesson file wins."""
    how: list[str] = []
    by_lesson: list[str] = []
    for n, step in enumerate(rec.get("steps") or [], 1):
        content = step.get("content") or {}
        if content.get("kind") != "explanation":
            continue
        ref = str(content.get("ref") or "")
        for _s, _u, lesson in ctx.lessons():
            text_file = lesson.get("textFile")
            if text_file and ref == f"content/{text_file}" and lesson["id"] not in by_lesson:
                by_lesson.append(lesson["id"])
                how.append(f"{lesson['id']}: its lesson file {ref} is step {n}'s explanation")
    by_items: list[str] = []
    named = {i for line in (rec.get("evidence") or {}).get("updates") or [] for i in ids_in(str(line))}
    for _s, _u, lesson in ctx.lessons():
        for req in lesson.get("requirements") or []:
            if set(req.get("items") or []) & named and lesson["id"] not in by_items:
                by_items.append(lesson["id"])
                how.append(f"{lesson['id']}: a requirement's items name {sorted(set(req['items']) & named)}")
    ordered = by_lesson + [r for r in by_items if r not in by_lesson]
    if len(ordered) > 1:
        how.append(f"several rungs: {ordered}; {ordered[0]} is read")
    return Placement(ordered[0] if ordered else None, how)


def rung_options(lesson: dict) -> tuple[list[str], list[str]]:
    return list(lesson.get("exerciseOptions") or []), list(lesson.get("songOptions") or [])


# --------------------------------------------------------------------------------------
# class 1: hand reading
# --------------------------------------------------------------------------------------


def hands_present(row: dict) -> set[str]:
    """The hands the build's model read notes for (``measurement.span``), else the row's ``hands``."""
    span = ((row.get("measurement") or {}).get("span")) or {}
    found = {h for h in ("R", "L") if span.get(h)}
    if found:
        return found
    return {"left": {"L"}, "right": {"R"}, "both": {"R", "L"}}.get(row.get("hands"), set())


def check_hand_reading(rec: dict, ctx: Context) -> list[Result]:
    import passages
    import verified_facts as VF

    out: list[Result] = []
    for n, step in enumerate(rec.get("steps") or [], 1):
        content = step.get("content") or {}
        kind, tool = content.get("kind"), norm(step.get("tool"))
        if kind not in ("piece", "excerpt"):
            out.append(Result(1, n, NA, [f"content kind {kind}: not a passage"]))
            continue
        if tool not in SCORE_TOOLS:
            out.append(Result(1, n, NA, [f"tool {step.get('tool')!r} does not read the score's hands (only the Score "
                                         f"screen's modes do; the lesson page, the chart, the Lab and the drills never "
                                         f"read a note's hand)"]))
            continue
        item_id, bars = ctx.item_for(content.get("ref"))
        if item_id is None:
            out.append(Result(1, n, FAIL, [f"{content.get('ref')!r} is not in the built catalogue"]))
            continue
        row = ctx.by_id[item_id]
        total = int(((row.get("notation") or {}).get("bars")) or 0)
        first, last = bars if bars else (1, total)
        staves = (row.get("notation") or {}).get("staves")
        want = step_hand(step)
        evidence = [f"{item_id} bars {first}-{last}{' (the whole item)' if not bars else ''}; staves {staves}; "
                    f"hands {row.get('hands')!r}; model span {sorted(hands_present(row))}"
                    + (f"; the step names hand {want}" if want else "")]
        if staves == 1:
            declared = passages.declared_hand_of(row)
            fact = (((row.get("provenance") or {}).get("facts") or {}).get("hands")) if isinstance(row.get("provenance"), dict) else None
            if declared in ("left", "right"):
                hand = "L" if declared == "left" else "R"
                evidence.append(f"one staff: the build's declared hand is {declared} (hands fact {fact}); the model "
                                f"reads every note as {hand} (HD1)")
                verdict = PASS if (want in (None, hand)) else FAIL
                if verdict == FAIL:
                    evidence.append(f"the step plays hand {want}, which this one-staff item does not have")
                out.append(Result(1, n, verdict, evidence))
                continue
            evidence.append(f"one staff, no declaration (hands fact {fact}): the one-staff rule reads it as the right "
                            f"hand (CL15)")
            if row.get("hands") == "left":
                evidence.append("the row says left: the model reads right; the BZ1 mismatch")
                out.append(Result(1, n, FAIL, evidence))
            elif row.get("hands") == "both":
                evidence.append("the row says both on one staff: the model keeps R and reports a mismatch (HD1 case 6)")
                out.append(Result(1, n, FAIL, evidence))
            else:
                ok = want in (None, "R")
                if not ok:
                    evidence.append(f"the step plays hand {want}; the one-staff rule gives only R")
                out.append(Result(1, n, PASS if ok else FAIL, evidence))
            continue
        # Two or more staves: a current verified fact must cover every bar used.
        covered: dict[int, list[str]] = {}
        proved_hands: set[str] = set()
        stale: list[str] = []
        for fact_row in ctx.facts:
            if fact_row.get("item") != item_id or fact_row.get("kind") != "demand":
                continue
            reasons = VF.shape_errors(fact_row) or passages.stale_reasons(fact_row, row, ctx.version())
            a, b = fact_row["bars"]
            if reasons:
                stale.append(f"{VF.name_of(fact_row)} stale: {'; '.join(reasons)}")
                continue
            hand = (fact_row.get("fact") or {}).get("hand")
            proved_hands.add(hand)
            for bar in range(a, b + 1):
                covered.setdefault(bar, []).append(f"staff {fact_row['staff']} as {hand}")
            evidence.append(f"current passage proof {VF.name_of(fact_row)}: staff {fact_row['staff']} read as {hand} "
                            f"on bars {a}-{b} ({(fact_row.get('proof') or {}).get('date')})")
        corrections = [f"bar {r['bars'][0]}-{r['bars'][1]} staff {r['staff']} voice {r['voice']} -> {r['fact']}"
                       for r in ctx.facts
                       if r.get("item") == item_id and r.get("kind") == "hand" and VF.row_identity(r) == VF.identity_of(row)]
        if corrections:
            evidence.append("HD2 hand rows applied to this file: " + "; ".join(corrections))
        conflicts = VF.hand_conflicts([r for r in ctx.facts if r.get("item") == item_id], {item_id: VF.identity_of(row)})
        evidence += stale
        missing = [bar for bar in range(first, last + 1) if bar not in covered]
        verdict = PASS
        if conflicts:
            evidence += conflicts
            verdict = FAIL
        if missing:
            evidence.append(f"no current verified fact covers bars {compress(missing)} of the {last - first + 1} used: "
                            f"there the hand is the voice-home compatibility default, UNKNOWN as a fact (Entry 248)")
            verdict = FAIL
        elif want and want not in proved_hands:
            evidence.append(f"the step plays hand {want}; the proofs establish {sorted(proved_hands)} only")
            verdict = FAIL
        out.append(Result(1, n, verdict, evidence))
    return out


def compress(numbers: list[int]) -> str:
    """[1, 2, 3, 7, 9, 10] -> '1-3, 7, 9-10'."""
    runs: list[list[int]] = []
    for n in numbers:
        if runs and n == runs[-1][1] + 1:
            runs[-1][1] = n
        else:
            runs.append([n, n])
    return ", ".join(f"{a}" if a == b else f"{a}-{b}" for a, b in runs)


# --------------------------------------------------------------------------------------
# class 2: cut tempo and marks
# --------------------------------------------------------------------------------------


def _bpm(mark) -> float | None:
    try:
        value = mark.getQuarterBPM()
    except Exception:  # noqa: BLE001 - a mark music21 cannot convert is reported as unread
        value = None
    return round(float(value), 3) if value is not None else None


def score_marks(path: Path, first: int, last: int, staves: list[int] | None) -> dict:
    """The marks of printed bars ``first``-``last`` (positions, as the cutter counts them) of a file, with bars renumbered
    from 1: the tempo in force at the start and the tempo marks inside (every staff: a tempo is the system's); the key and
    time in force and their changes, the dynamics and expression texts of ``staves`` (indices; None for all); and the
    same of the other staves apart (``dropped``)."""
    from music21 import converter, dynamics, expressions, key, meter, stream, tempo

    import excerpts

    score = converter.parse(str(path))
    parts = list(score.parts)
    keep = list(range(len(parts))) if staves is None else staves
    out = {"tempoAtStart": None, "tempi": set(), "keyAtStart": None, "keys": set(), "timeAtStart": None, "times": set(),
           "dynamics": set(), "texts": set(), "dropped": set(), "bars": 0}
    for index, part in enumerate(parts):
        measures = list(part.getElementsByClass(stream.Measure))
        out["bars"] = max(out["bars"], len(measures))
        for position, measure in enumerate(measures, 1):
            for mark in measure.recurse().getElementsByClass(tempo.MetronomeMark):
                offset = round(float(mark.getOffsetInHierarchy(measure)), 4)
                bpm = _bpm(mark)
                if position < first or (position == first and offset == 0):
                    out["tempoAtStart"] = bpm  # the last one at or before the start stands
                elif position <= last:
                    out["tempi"].add((position - first + 1, offset, bpm))
            if index not in keep:
                if first <= position <= last:
                    for d in measure.recurse().getElementsByClass(dynamics.Dynamic):
                        out["dropped"].add((position - first + 1, f"staff {index + 1} dynamic {d.value}"))
                    for t in measure.recurse().getElementsByClass(expressions.TextExpression):
                        if (t.content or "").strip() and excerpts.edition_text_kind(t.content) is None:
                            out["dropped"].add((position - first + 1, f"staff {index + 1} text {t.content.strip()!r}"))
                continue
            for k in measure.recurse().getElementsByClass(key.KeySignature):
                if position <= first:
                    out["keyAtStart"] = k.sharps
                elif position <= last:
                    out["keys"].add((position - first + 1, k.sharps))
            for ts in measure.recurse().getElementsByClass(meter.TimeSignature):
                if position <= first:
                    out["timeAtStart"] = ts.ratioString
                elif position <= last:
                    out["times"].add((position - first + 1, ts.ratioString))
            if first <= position <= last:
                for d in measure.recurse().getElementsByClass(dynamics.Dynamic):
                    out["dynamics"].add((position - first + 1, round(float(d.getOffsetInHierarchy(measure)), 4), d.value))
                for t in measure.recurse().getElementsByClass(expressions.TextExpression):
                    text = (t.content or "").strip()
                    if text and excerpts.edition_text_kind(text) is None:
                        out["texts"].add((position - first + 1, text))
    # Two staves of one grand staff can print the same key or time; one fact each.
    return out


def check_cut_marks(rec: dict, ctx: Context) -> list[Result]:
    import excerpts

    out: list[Result] = []
    cache: dict[str, Result] = {}
    for n, step in enumerate(rec.get("steps") or [], 1):
        content = step.get("content") or {}
        ref = str(content.get("ref") or "")
        item_id, _bars = ctx.item_for(ref)
        row = ctx.by_id.get(item_id) if item_id else None
        if content.get("kind") != "excerpt" and not (row and row.get("type") == "excerpt"):
            out.append(Result(2, n, NA, [f"content kind {content.get('kind')}: not an excerpt cut"]))
            continue
        if item_id in cache:
            again = cache[item_id]
            out.append(Result(2, n, again.verdict, [f"the same cut as step {again.step}: {again.verdict}"]))
            continue
        result = Result(2, n, PASS, [])
        cache[item_id or ref] = result
        out.append(result)
        if row is None:
            result.verdict, result.evidence = FAIL, [f"{ref!r} is not in the built catalogue"]
            continue
        definition = ctx.excerpt_row(item_id)
        parent = ctx.by_id.get(row.get("excerptOf") or (definition or {}).get("of"))
        if definition is None or parent is None:
            result.verdict = FAIL
            result.evidence.append(f"{item_id}: no approved row in content/sources/excerpts.json or no parent in the catalogue")
            continue
        first, last, selection = int(definition["fromBar"]), int(definition["toBar"]), definition["selection"]
        cut_path, parent_path = ctx.content / str(row.get("file")), ctx.content / str(parent.get("file"))
        if not cut_path.is_file() or not parent_path.is_file():
            result.verdict = FAIL
            result.evidence.append(f"a built file is missing: {row.get('file')} or {parent.get('file')}")
            continue
        keep = None if selection == "both" else [excerpts.KEEP_STAFF[selection]]
        was = score_marks(parent_path, first, last, keep)
        now = score_marks(cut_path, 1, last - first + 1, None)
        result.evidence.append(f"{item_id}: parent {parent['id']} bars {first}-{last}, selection {selection}; read with "
                               f"music21 from the built files")
        faults: list[str] = []
        tags = list(row.get("tags") or [])
        if was["tempoAtStart"] is None:
            result.evidence.append("the parent prints no tempo in force at the cut's start")
            if "tempo-defaulted" not in tags:
                faults.append(f"the cut plays at {row.get('tempoBpm')} with no tempo printed in force and no "
                              f"tempo-defaulted tag (an unflagged default, BZ1)")
            else:
                result.evidence.append(f"the row is tagged tempo-defaulted (tempo {row.get('tempoBpm')})")
        else:
            result.evidence.append(f"tempo in force at the start: parent {was['tempoAtStart']}, cut "
                                   f"{now['tempoAtStart']}, catalogue tempoBpm {row.get('tempoBpm')}")
            if now["tempoAtStart"] != was["tempoAtStart"]:
                faults.append(f"the cut's tempo at its start is {now['tempoAtStart']}, the parent's in force is "
                              f"{was['tempoAtStart']} (DF2)")
            if row.get("tempoBpm") is None or abs(float(row["tempoBpm"]) - was["tempoAtStart"]) > 1e-6:
                faults.append(f"the catalogue's tempoBpm {row.get('tempoBpm')} is not the tempo in force {was['tempoAtStart']}")
            if "tempo-defaulted" in tags:
                faults.append("tagged tempo-defaulted although the parent prints a tempo in force")
        for name, label in (("tempi", "tempo marks inside the cut"), ("keys", "key changes"), ("times", "time changes"),
                            ("dynamics", "dynamics on the kept staff"), ("texts", "expression texts on the kept staff")):
            lost, added = sorted(was[name] - now[name]), sorted(now[name] - was[name])
            result.evidence.append(f"{label}: parent {len(was[name])}, cut {len(now[name])}")
            if lost:
                faults.append(f"{label} the cut lost: {lost}")
            if added:
                faults.append(f"{label} the cut added: {added}")
        for name, label in (("keyAtStart", "key in force (sharps)"), ("timeAtStart", "time in force")):
            result.evidence.append(f"{label}: parent {was[name]}, cut {now[name]}")
            if was[name] != now[name]:
                faults.append(f"{label}: parent {was[name]}, cut {now[name]}")
        if was["dropped"]:
            result.evidence.append(f"marks on the staff the cut drops (listed, not judged: only tempo is carried across "
                                   f"staves): {sorted(was['dropped'])}")
        if faults:
            result.verdict = FAIL
            result.evidence += faults
    return out


# --------------------------------------------------------------------------------------
# class 3: control reachable in its mode (prerequisites read from the code)
# --------------------------------------------------------------------------------------


@dataclass
class CodeFacts:
    modes: dict[str, str]  # id -> label
    opening_with_input: str | None
    rhythm_modes: set[str]
    rhythm_remembered: bool
    ladder_modes: set[str]
    ladder_needs_loop: bool
    duet_rule: str | None
    loop_any_mode: bool | None
    hear_button: bool
    chart_door: str | None
    chart_chips: set[str]
    chart_coupled: list[str]
    play_route: bool
    sources: list[str]


def _body_after(text: str, start: str, end_pattern: str = r"\n  \}\);?") -> str | None:
    at = text.find(start)
    if at < 0:
        return None
    match = re.search(end_pattern, text[at:])
    return text[at: at + match.end()] if match else text[at:]


def code_facts(code: dict[str, str]) -> CodeFacts:
    score, settings, chart = code.get("score", ""), code.get("settings", ""), code.get("chart", "")
    sources: list[str] = []
    modes = dict(re.findall(r"\{\s*id:\s*'(\w+)',\s*label:\s*'([^']+)'\s*\}", score.split("const SHORT_MODES")[0]))
    sources.append(f"{CODE_FILES['score']} MODES: {modes}")
    opening = None
    if re.search(r"mode = input === 'none' \? settings\.defaultModeWithoutInput : settings\.defaultModeWithInput", score):
        found = re.search(r"defaultModeWithInput:\s*'(\w+)',", settings)
        opening = found.group(1) if found else None
        sources.append(f"{CODE_FILES['score']} opens in settings.defaultModeWithInput with an input; "
                       f"{CODE_FILES['settings']} defaults it to {opening!r}")
    rhythm = re.search(r"const rhythmAvailable = ([^;]+);", score)
    rhythm_modes = set(re.findall(r"mode === '(\w+)'", rhythm.group(1))) if rhythm else set()
    if rhythm:
        sources.append(f"{CODE_FILES['score']} rhythmAvailable = {rhythm.group(1).strip()}")
    remembered = bool(re.search(r"let rhythmOnly = settings\.rhythmOnly;", score))
    if remembered:
        sources.append(f"{CODE_FILES['score']} let rhythmOnly = settings.rhythmOnly (a remembered setting)")
    ladder = re.search(r"function ladderApplies\(\): boolean \{\s*return ([^;]+);", score)
    ladder_modes = set(re.findall(r"mode === '(\w+)'", ladder.group(1))) if ladder else set()
    if ladder:
        sources.append(f"{CODE_FILES['score']} ladderApplies = {ladder.group(1).strip()}")
    duet = re.search(r"const otherExists = ([^;]+);", score)
    if duet:
        sources.append(f"{CODE_FILES['score']} Duet shown when {duet.group(1).strip()}")
    handler = _body_after(score, "stage.addEventListener('dblclick'")
    # Comments stripped: the handler's own comment says "a mode change", which is prose, not a condition.
    loop_any = None if handler is None else not re.search(r"\bmode\b", re.sub(r"//[^\n]*", "", handler))
    if handler is not None:
        sources.append(f"{CODE_FILES['score']} the double-tap loop handler reads {'no mode' if loop_any else 'the mode'}")
    hear = "button('Hear it'" in score
    door = re.search(r"export function hasChordSymbols[\s\S]*?return \(item\.notation\?\.chordCount \?\? 0\) > 0;", code.get("openItem", ""))
    door_rule = "notation.chordCount > 0" if door else None
    if door_rule:
        sources.append(f"{CODE_FILES['openItem']} hasChordSymbols: {door_rule}")
    chips = set(re.findall(r"chip\('([^']+)',", chart))
    coupled: list[str] = []
    backing = _body_after(chart, "chip('Bass + drums'")
    if backing and re.search(r"\bcomping\s*=", backing):
        coupled.append("the Bass + drums chip's click sets comping (Comp forced on)")
    comp_bar = _body_after(chart, "function compBar(", r"\n  \}\n")
    if comp_bar and "scheduleBacking" in comp_bar:
        coupled.append("compBar schedules the backing, so the bass and drums run only while Comp is on")
    if chart:
        sources.append(f"{CODE_FILES['chart']} chips {sorted(chips)}; "
                       + ("coupled: " + "; ".join(coupled) if coupled else "Comp and Bass + drums independent (CB1)"))
    play_route = "tab === 'play'" in code.get("router", "")
    return CodeFacts(modes, opening, rhythm_modes, remembered, ladder_modes, bool(ladder and "loopBars !== null" in ladder.group(1)),
                     duet.group(1).strip() if duet else None, loop_any, hear, door_rule, chips, coupled, play_route, sources)


def sentences(text: str) -> list[str]:
    """A lesson's sentences, emphasis marks and line breaks flattened (a list of names is not a sentence about them)."""
    flat = re.sub(r"[*_]", "", re.sub(r"\s+", " ", text or ""))
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+(?=[A-Z0-9*])", flat) if s.strip()]


def lesson_names_together(text: str, control: str, mode_label: str) -> str | None:
    """The first sentence of a lesson that names both ``control`` and ``mode_label``; None if none does."""
    for sentence in sentences(text):
        if control.casefold() in sentence.casefold() and mode_label.casefold() in sentence.casefold():
            return sentence[:220]
    return None


def lesson_says_off(text: str, control: str) -> str | None:
    """The first sentence of a lesson that switches ``control`` off."""
    for sentence in sentences(text):
        if re.search(rf"{re.escape(control)}\W+(?:\w+\W+){{0,2}}off\b", sentence, re.I):
            return sentence[:220]
    return None


def item_reach(item_id: str, rung: str | None, step: dict, ctx: Context) -> tuple[str, list[str]]:
    """Where the step's item can be opened: an option of the placed rung, or of the rung a 'later rung' step names."""
    listing = []
    for _s, _u, lesson in ctx.lessons():
        ex, songs = rung_options(lesson)
        if item_id in ex or item_id in songs:
            listing.append(lesson["id"])
    if rung and rung in listing:
        return PASS, [f"{item_id} is an option of the placed rung {rung}"]
    if listing and LATER_RUNG.search(step_text(step)):
        return PASS, [f"a later-rung step: {item_id} is an option of {listing}"]
    if listing:
        return FAIL, [f"{item_id} is an option of {listing}, not of the placed rung {rung}; the step does not say it is "
                      f"opened on a later rung"]
    return FAIL, [f"{item_id} is an option of no rung: a lesson page opens items only by its rows (MODE-SHEET section "
                  f"31), so the learner meets it only by finding it in the Library"]


def check_reachability(rec: dict, ctx: Context, placement: Placement) -> list[Result]:
    facts = code_facts(ctx.code)
    rung = placement.rung
    lesson_text = ctx.lesson_text(rung) if rung else ""
    labels = facts.modes
    # The rules themselves, as read from the code: a rule the code no longer states is a failure of the preflight's
    # reading, said here once rather than passed silently on every step.
    missing = [name for name, value in (("MODES", facts.modes), ("the opening mode", facts.opening_with_input),
                                        ("Rhythm only's modes", facts.rhythm_modes), ("ladderApplies", facts.ladder_modes),
                                        ("Duet's rule", facts.duet_rule), ("the double-tap loop", facts.loop_any_mode is not None),
                                        ("the chart door", facts.chart_door)) if not value]
    out: list[Result] = [Result(3, None, FAIL if missing else PASS,
                                list(facts.sources) + ([f"not found in the code: {missing}"] if missing else []))]
    rhythm_on = False  # Rhythm only is remembered across pieces (code), carried through the record's order
    for n, step in enumerate(rec.get("steps") or [], 1):
        tool = norm(step.get("tool"))
        content = step.get("content") or {}
        text = step_text(step)
        item_id, bars = ctx.item_for(content.get("ref")) if content.get("kind") != "explanation" else (None, None)
        row = ctx.by_id.get(item_id) if item_id else None
        evidence: list[str] = []
        verdict = PASS
        routed: list[str] = []

        def fail(line: str) -> None:
            nonlocal verdict
            verdict = FAIL
            evidence.append("FAIL: " + line)

        if tool == "lesson":
            out.append(Result(3, n, NA, ["the lesson page: no control to reach (MODE-SHEET section 31)"]))
            continue
        # The item itself must be openable where the step is.
        if item_id is not None:
            how, lines = item_reach(item_id, rung, step, ctx)
            if how == FAIL:
                fail(lines[0])
            else:
                evidence += lines
        elif content.get("kind") in ("piece", "excerpt", "generated") and not str(content.get("ref", "")).startswith("app/"):
            fail(f"{content.get('ref')!r} names no item in the built catalogue")
        # A step on the Lab's own writer (its Read it import, or Play it to me on it) is set up inside the Lab.
        lab_step = tool in LAB_TOOLS or str(content.get("ref", "")).startswith("app/src/engine/sightReading.ts")
        if tool in SCORE_TOOLS and not lab_step:
            opening = facts.opening_with_input
            evidence.append(f"opened from the lesson page with an input attached, the Score screen starts in {opening!r} "
                            f"(code); a Today ?rung= opening starts where it can count instead")
            needs: list[tuple[str, set[str]]] = []
            if tool in ("wait for me", "keep tempo", "play it to me", "free play"):
                wanted = {"wait for me": "wait", "keep tempo": "tempo", "play it to me": "listen", "free play": "free"}[tool]
                if wanted not in labels:
                    fail(f"the mode {wanted!r} is not in the Score screen's MODES")
                else:
                    evidence.append(f"the tool is the mode {labels[wanted]!r}, named by the step's tool field")
            if tool == "hear it":
                if facts.hear_button:
                    evidence.append("Hear it is a bar button in every mode (code)")
                else:
                    fail("no Hear it button in ScoreScreen.ts")
            if tool == "rhythm only":
                needs.append(("Rhythm only", facts.rhythm_modes))
            if tool == "ladder" or re.search(r"\bladder\b", text, re.I):
                needs.append(("Ladder", facts.ladder_modes))
            for control, modes in needs:
                if not modes:
                    fail(f"{control}: no mode condition found in the code (the row's rule changed?)")
                    continue
                if opening in modes:
                    evidence.append(f"{control} needs mode {sorted(modes)}: the opening mode")
                    continue
                label = labels.get(sorted(modes)[0], sorted(modes)[0])
                if label.casefold() in text.casefold():
                    evidence.append(f"{control} needs {label!r} first (code); the step names it")
                    continue
                said = lesson_names_together(lesson_text, control, label)
                if said:
                    evidence.append(f"{control} needs {label!r} first (code); the step does not name it, the lesson "
                                    f"does: \"{said}\"")
                else:
                    fail(f"{control} needs {label!r} first (code: the row is hidden in {opening!r}, the opening mode); "
                         f"neither the step nor the {rung} lesson names {label!r} with {control}")
            if tool == "rhythm only":
                rhythm_on = True
            elif tool == "keep tempo" and rhythm_on and facts.rhythm_remembered:
                said = lesson_says_off(lesson_text, "Rhythm only")
                if re.search(r"rhythm only\W+(?:\w+\W+){0,2}off", text, re.I):
                    evidence.append("Rhythm only, on since an earlier step and remembered (code), is switched off by the step")
                elif said:
                    evidence.append(f"Rhythm only, on since an earlier step and remembered (code): the lesson says to "
                                    f"switch it off: \"{said}\"")
                else:
                    fail("Rhythm only is on from an earlier step and remembered across pieces (code): this Keep tempo "
                         "run would be a rhythm run that counts toward nothing, and neither the step nor the lesson "
                         "says to switch it off")
                rhythm_on = False
            if scaffold_has(step, "loop") or re.search(r"\bon a loop\b|\blooped\b", text, re.I):
                if facts.loop_any_mode:
                    evidence.append("Loop: the double-tap handler reads no mode (code)")
                    if bars:
                        routed.append(f"whether bars {bars[0]}-{bars[1]} can be tapped at rest (the Window layout draws "
                                      f"the first window only, LB1) is a layout fact")
                else:
                    fail("Loop: no mode-free double-tap handler in ScoreScreen.ts")
            if scaffold_has(step, "app plays the other hand") or tool == "duet":
                hand = step_hand(step)
                present = hands_present(row) if row else set()
                if not facts.duet_rule:
                    fail("Duet: no otherExists rule found in ScoreScreen.ts")
                elif hand is None:
                    fail(f"Duet needs one hand chosen ({facts.duet_rule}); the step names none")
                elif {"R", "L"} - {hand} - present:
                    fail(f"Duet needs the other hand present; {item_id} has {sorted(present)}")
                else:
                    evidence.append(f"Duet: hand {hand} chosen, the other hand present ({sorted(present)}): {facts.duet_rule}")
            hand = step_hand(step)
            if hand and row is not None and hand not in hands_present(row):
                fail(f"the step plays hand {hand}; {item_id} has notes for {sorted(hands_present(row))} only (the app "
                     f"refuses: 'Nothing for the ... hand in this piece')")
        elif tool == "chord chart":
            if row is not None:
                count = (row.get("notation") or {}).get("chordCount") or 0
                if facts.chart_door and count > 0:
                    evidence.append(f"the chart door opens: {facts.chart_door} ({count})")
                else:
                    fail(f"the chart door is closed for {item_id}: chordCount {count} ({facts.chart_door})")
            named = [c for c in ("Comp", "Bass + drums") if re.search(re.escape(c) + r"\b", text)]
            for chip in named:
                if chip not in facts.chart_chips:
                    fail(f"the chart has no {chip!r} chip")
            if len(named) == 2 and re.search(r"Comp (?:on|off)\b.*Bass \+ drums (?:on|off)|Comp (?:off|on) and Bass", text):
                states = re.findall(r"(Comp|Bass \+ drums) (on|off)", text)
                differ = len({s for _c, s in states}) > 1
                if differ and facts.chart_coupled:
                    fail("the step asks Comp and Bass + drums in different states; the code couples them: "
                         + "; ".join(facts.chart_coupled))
                elif differ:
                    evidence.append("Comp and Bass + drums in different states: independent in the code (CB1)")
            routed.append("what the chart shows in the step's bars (one symbol per bar, or a split bar's second chord) "
                          "is read only when the chart is drawn")
        elif tool == "free play, standalone":
            if facts.play_route:
                evidence.append("Free play standalone: the #/play route exists (router.ts)")
            else:
                fail("no #/play route in router.ts")
        elif lab_step:
            lesson = ctx.lesson(rung)[2] if rung and ctx.lesson(rung) else {}
            lab = [t for t in lesson.get("tools") or [] if t.get("kind") == "lab"]
            if lab:
                evidence.append(f"the placed rung {rung} offers the Lab: {lab}")
            else:
                fail(f"the placed rung {rung} offers no Lab tool (curriculum tools)")
            routed.append("the Lab's pickers, presets, locks and its Read it / Play it to me / Play the tune controls "
                          "are set inside the Lab screen")
        elif tool in DRILL_TOOLS:
            if row is not None:
                evidence.append(f"a drill row of kind {((row.get('drill') or {}).get('kind'))!r} opens on the Drill screen")
        else:
            routed.append(f"no static rule for the tool {step.get('tool')!r}")
        if verdict == PASS and routed:
            out.append(Result(3, n, NA, evidence + [f"ROUTED: {r}" for r in routed], routed=True))
        else:
            out.append(Result(3, n, verdict, evidence + [f"ROUTED: {r}" for r in routed]))
    return out


# --------------------------------------------------------------------------------------
# class 4: counted items match the claim
# --------------------------------------------------------------------------------------


def counted_by(item_id: str, lesson: dict) -> list[str]:
    """The requirements of the rung that would count a run of ``item_id``: named in ``items``, or in an unnamed pool."""
    ex, songs = rung_options(lesson)
    pools = {"exercises": ex, "songs": songs}
    found = []
    for k, req in enumerate(lesson.get("requirements") or [], 1):
        if req.get("kind") != "runs":
            continue
        if req.get("items"):
            if item_id in req["items"]:
                found.append(f"requirement {k} (runs from {req.get('from')}, items {req['items']})")
        elif item_id in pools.get(req.get("from"), []):
            found.append(f"requirement {k} (runs from {req.get('from')}, unnamed: any of its {len(pools.get(req.get('from'), []))} options)")
    return found


def check_counted(rec: dict, ctx: Context, placement: Placement) -> list[Result]:
    out: list[Result] = []
    rung = placement.rung
    evidence_block = rec.get("evidence") or {}
    updates = [str(u) for u in evidence_block.get("updates") or []]
    never = " ".join(str(u) for u in evidence_block.get("never_credits") or [])
    record = Result(4, None, PASS, list(placement.how) or ["no rung found"])
    out.append(record)
    found = ctx.lesson(rung) if rung else None
    if found is None:
        record.verdict = FAIL
        record.evidence.append("no placed rung: no rung's lesson file is a step's explanation and no requirement names an "
                               "item the updates name, so nothing the record claims can be counted")
        for n, _step in enumerate(rec.get("steps") or [], 1):
            out.append(Result(4, n, NA, ["no placed rung"]))
        return out
    lesson = found[2]
    ex, songs = rung_options(lesson)
    pools = {"exercises": ex, "songs": songs}
    requirements = lesson.get("requirements") or []
    record.evidence.append(f"{rung} requirements: {json.dumps(requirements)}")
    positive: list[tuple[int, str, str]] = []  # (update index, id, clause)
    negative: set[str] = set(ids_in(never))
    for k, line in enumerate(updates, 1):
        ids_here = ids_in(line)
        if not ids_here:
            record.verdict = FAIL
            record.evidence.append(f"FAIL: evidence.updates[{k}] names no item id, so it cannot be matched to a "
                                   f"requirement (write the id): \"{line[:140]}\"")
            continue
        for clause in clauses(line):
            for item in ids_in(clause):
                if NEGATED.search(clause):
                    negative.add(item)
                else:
                    positive.append((k, item, clause))
    # Steps that say they count toward nothing name items that must never be counted.
    not_counted_steps: dict[str, list[int]] = {}
    for n, step in enumerate(rec.get("steps") or [], 1):
        said = " ".join(str(step.get(k) or "") for k in ("recorded", "action"))
        item_id, _ = ctx.item_for((step.get("content") or {}).get("ref"))
        if item_id and CLAIMS_NOT_COUNTED.search(said) and norm(step.get("tool")) in COUNTING_TOOLS:
            not_counted_steps.setdefault(item_id, []).append(n)
    named_by_updates = {item for _k, item, _c in positive}
    for k, req in enumerate(requirements, 1):
        kind = req.get("kind")
        if kind == "unjudged":
            record.evidence.append(f"requirement {k} unjudged: shown, never counted (MODE-SHEET claim 7)")
            continue
        if kind != "runs":
            record.evidence.append(f"requirement {k} of kind {kind}: not a runs requirement; read by hand")
            continue
        count = int(req.get("count") or 1)
        if req.get("items"):
            for item in req["items"]:
                lines = [(u, c) for u, i, c in positive if i == item]
                if not lines:
                    record.verdict = FAIL
                    record.evidence.append(f"FAIL: requirement {k} counts {item}; no update names it by id")
                    continue
                for u, clause in lines:
                    word = re.match(r"\s*(\w+)", clause)
                    number = NUMBER_WORDS.get((word.group(1) if word else "").casefold())
                    if number is not None and number != count:
                        record.verdict = FAIL
                        record.evidence.append(f"FAIL: update {u} says {number} run(s) of {item}; requirement {k} counts {count}")
                    else:
                        record.evidence.append(f"requirement {k} counts {count} run(s) of {item}: update {u} names it")
            if set(req["items"]) & negative:
                record.verdict = FAIL
                record.evidence.append(f"FAIL: requirement {k} names {sorted(set(req['items']) & negative)}, which the "
                                       f"record says never credits")
            for item in req["items"]:
                if item in not_counted_steps:
                    record.verdict = FAIL
                    record.evidence.append(f"FAIL: requirement {k} names {item}; steps {not_counted_steps[item]} say a "
                                           f"run of it counts toward nothing")
        else:
            pool = pools.get(req.get("from"), [])
            mine = [i for i in named_by_updates if i in pool]
            if not mine:
                record.verdict = FAIL
                record.evidence.append(f"FAIL: requirement {k} counts {count} run(s) of any of {len(pool)} "
                                       f"{req.get('from')} options; no update names one of them")
            else:
                record.evidence.append(f"requirement {k} (unnamed pool of {req.get('from')}): updates name {mine}")
            leaks = sorted({i for i in pool if i in negative or i in not_counted_steps})
            if leaks:
                record.verdict = FAIL
                record.evidence.append(f"FAIL: requirement {k} names no items, so any of its {req.get('from')} options "
                                       f"counts, among them {leaks}, which the record says never count (the G13 class: "
                                       f"name the exact item)")
    for k, item, _clause in positive:
        where = counted_by(item, lesson)
        if not where:
            record.verdict = FAIL
            record.evidence.append(f"FAIL: update {k} names {item}, which no requirement of {rung} counts "
                                   f"({'not an option of ' + rung if item not in ex + songs else 'an option outside every counting pool'})")
    # Per step.
    for n, step in enumerate(rec.get("steps") or [], 1):
        tool = norm(step.get("tool"))
        said = " ".join(str(step.get(k) or "") for k in ("recorded", "action"))
        item_id, _bars = ctx.item_for((step.get("content") or {}).get("ref"))
        counts_tool = tool in COUNTING_TOOLS and not (scaffold_has(step, "loop") or re.search(r"\blooped\b", said, re.I))
        where = counted_by(item_id, lesson) if item_id else []
        claims_no = bool(CLAIMS_NOT_COUNTED.search(said))
        claims_yes = bool(CLAIMS_COUNTED.search(said)) and not claims_no
        ev = [f"tool {step.get('tool')!r} ({'a counting tool' if counts_tool else 'never counted (MODE-SHEET R3/R4, section 14, RG1)'}); "
              f"{item_id or (step.get('content') or {}).get('ref')}: "
              + (", ".join(where) if where else f"counted by no requirement of {rung}")]
        if claims_yes:
            ok = counts_tool and bool(where)
            ev.append("the step says its run counts")
            out.append(Result(4, n, PASS if ok else FAIL, ev + ([] if ok else ["FAIL: the step says it counts; the rung would not count it"])))
        elif claims_no:
            leak = counts_tool and bool(where)
            ev.append("the step says its run counts toward nothing")
            out.append(Result(4, n, FAIL if leak else PASS, ev + (["FAIL: the rung would count this run"] if leak else [])))
        elif counts_tool and where:
            out.append(Result(4, n, FAIL, ev + ["FAIL: the run would count and the step does not say so"]))
        else:
            out.append(Result(4, n, NA, ev + ["no claim either way, and nothing would count"]))
    return out


# --------------------------------------------------------------------------------------
# class 5: taught-set hold
# --------------------------------------------------------------------------------------


def check_taught(rec: dict, ctx: Context, placement: Placement) -> list[Result]:
    import claims
    import untaught_options

    out: list[Result] = []
    rung = placement.rung
    ancestry = ctx.ancestry()
    for n, step in enumerate(rec.get("steps") or [], 1):
        content = step.get("content") or {}
        if content.get("kind") != "generated":
            out.append(Result(5, n, NA, [f"content kind {content.get('kind')}: not a generated item"]))
            continue
        item_id, _ = ctx.item_for(content.get("ref"))
        if item_id is None:
            out.append(Result(5, n, NA, [f"{content.get('ref')!r} is not a catalogue item (a runtime writer such as the "
                                         f"Lab's): the build measures no score for it, so what it asks cannot be read here"]))
            continue
        row = ctx.by_id[item_id]
        measurement = untaught_options.measurement_of(row)
        if measurement.get("status") != "measured":
            out.append(Result(5, n, NA, [f"{item_id}: measurement {measurement.get('status')!r} "
                                         f"({measurement.get('reason', '')}): no measured demands to hold"]))
            continue
        if rung is None or rung not in ancestry:
            out.append(Result(5, n, FAIL, [f"{item_id}: no placed rung to hold it to"]))
            continue
        untaught = claims.untaught_on(row, rung, ancestry, ctx.demands, ctx.curriculum)
        asked = claims.asked_of(row, ctx.demands)
        before = untaught_options.refused_before_coping(row)
        ev = [f"{item_id} at {rung}: asks {asked}", f"the gate before the coping question: {before or 'nothing refuses it'}"]
        if untaught:
            ev.append(f"FAIL: untaught at {rung} (no rung of its ancestry teaches it): {untaught}")
            out.append(Result(5, n, FAIL, ev))
        else:
            ev.append(f"every asked demand is taught on {rung}'s path")
            out.append(Result(5, n, PASS, ev))
    return out


# --------------------------------------------------------------------------------------
# class 6: the journey derived from the record
# --------------------------------------------------------------------------------------


@dataclass
class JourneyStep:
    record_step: int
    kind: str  # 'lesson' | 'hear' | 'rhythm' | 'wait' | 'tempo' | 'later-rung' | 'fixme'
    item: str | None = None
    title: str | None = None
    rung: str | None = None
    mode: str | None = None
    hand: str | None = None
    rhythm: bool | None = None  # the Rhythm only toggle set to this before playing
    duet: bool = False
    loop: tuple[int, int] | None = None
    tempo: int | None = None
    counts: str | None = None  # 'unchanged' | 'k of N'
    note: str = ""


def plan_journey(rec: dict, ctx: Context, placement: Placement) -> list[JourneyStep]:
    rung = placement.rung
    lesson = ctx.lesson(rung)[2] if rung and ctx.lesson(rung) else {}
    requirements = [r for r in lesson.get("requirements") or [] if r.get("kind") != "unjudged"]
    named = [i for r in requirements for i in r.get("items") or []]
    total = len(requirements)
    mastery = lesson.get("mastery") or {}
    tempo_floor = int(round(100 * float(mastery.get("minTempoPct") or 0.8)))
    done = 0
    rhythm_on = False
    plan: list[JourneyStep] = []
    for n, step in enumerate(rec.get("steps") or [], 1):
        tool = norm(step.get("tool"))
        content = step.get("content") or {}
        item_id, bars = ctx.item_for(content.get("ref"))
        row = ctx.by_id.get(item_id) if item_id else None
        title = row.get("title") if row else None
        whole = (1, int(((row or {}).get("notation") or {}).get("bars") or 0)) if row else None
        loop = bars if bars and bars != whole else None
        hand = step_hand(step) or ("L" if row and hands_present(row) == {"L"} else None)
        said = " ".join(str(step.get(k) or "") for k in ("recorded", "action"))
        if tool == "lesson" and content.get("kind") == "explanation":
            plan.append(JourneyStep(n, "lesson", rung=rung, note="read the lesson page"))
        elif tool == "lesson" and LATER_RUNG.search(step_text(step)) and item_id:
            later = [l["id"] for _s, _u, l in ctx.lessons() if item_id in sum(rung_options(l), []) and l["id"] != rung]
            plan.append(JourneyStep(n, "later-rung", item_id, title, rung=later[0] if later else None,
                                    note="the later rung lists the piece and its row opens it"))
        elif tool == "lesson" and item_id:
            plan.append(JourneyStep(n, "lesson", item_id, title, rung=rung,
                                    note="open the piece and press nothing: the decision is the learner's"))
        elif tool == "hear it" and item_id:
            # Hear it writes no row (MODE-SHEET section 3): the counts line must not move.
            plan.append(JourneyStep(n, "hear", item_id, title, rung=rung, loop=loop, counts="unchanged"))
        elif tool == "rhythm only" and item_id:
            plan.append(JourneyStep(n, "rhythm", item_id, title, rung=rung, mode="tempo", hand=hand, rhythm=True,
                                    loop=loop, counts="unchanged"))
            rhythm_on = True
        elif tool == "wait for me" and item_id:
            plan.append(JourneyStep(n, "wait", item_id, title, rung=rung, mode="wait", hand=hand, loop=loop,
                                    counts="unchanged"))
        elif tool == "keep tempo" and item_id:
            counted = item_id in named and bool(CLAIMS_COUNTED.search(said)) and not CLAIMS_NOT_COUNTED.search(said) and loop is None
            if counted:
                done += 1
            plan.append(JourneyStep(n, "tempo", item_id, title, rung=rung, mode="tempo", hand=hand,
                                    rhythm=False if rhythm_on else None,
                                    duet=scaffold_has(step, "app plays the other hand"), loop=loop,
                                    tempo=max(tempo_floor + 10, 90) if counted else None,
                                    counts=f"{done} of {total}" if counted else "unchanged"))
            rhythm_on = False
        else:
            on = "" if item_id else f" on {content.get('ref')} (no catalogue item: a Lab build or a lesson file)"
            plan.append(JourneyStep(n, "fixme", item_id, title, rung=rung,
                                    note=f"no journey template for the tool {step.get('tool')!r}{on}"))
    return plan


def check_journey(rec: dict, ctx: Context, placement: Placement, plan: list[JourneyStep]) -> list[Result]:
    out = []
    for step in plan:
        if step.kind == "fixme":
            out.append(Result(6, step.record_step, NA, [step.note + ": a test.fixme line in the skeleton"], routed=True))
        else:
            out.append(Result(6, step.record_step, PASS, [describe(step)]))
    counted = [s for s in plan if s.counts and s.counts != "unchanged"]
    lesson = ctx.lesson(placement.rung)[2] if placement.rung and ctx.lesson(placement.rung) else {}
    total = len([r for r in lesson.get("requirements") or [] if r.get("kind") != "unjudged"])
    if placement.rung is None:
        out.insert(0, Result(6, None, FAIL, ["no placed rung: the journey has no route and no completion to assert"]))
    elif len(counted) != total:
        out.insert(0, Result(6, None, FAIL, [f"the record's counted Keep tempo runs give {len(counted)} of the {total} "
                                             f"requirements {placement.rung} counts: the journey cannot assert completion"]))
    else:
        out.insert(0, Result(6, None, PASS, [f"route to {placement.rung}; {total} counted run(s) bring it to {total} of "
                                             f"{total}; completion asserted on Plan"]))
    return out


def describe(step: JourneyStep) -> str:
    parts = [step.kind]
    if step.title:
        parts.append(f"open {step.title!r}")
    if step.loop:
        parts.append(f"loop {step.loop[0]}-{step.loop[1]}")
    if step.mode:
        parts.append(f"mode {step.mode}")
    if step.hand:
        parts.append(f"hand {step.hand}")
    if step.rhythm is not None:
        parts.append(f"Rhythm only {'on' if step.rhythm else 'off'}")
    if step.duet:
        parts.append("Duet on")
    if step.tempo:
        parts.append(f"speed {step.tempo} %")
    if step.counts:
        parts.append(f"counts {step.counts}")
    if step.rung and step.kind == "later-rung":
        parts.append(f"on {step.rung}")
    return "; ".join(parts)


def _ts(value) -> str:
    return json.dumps(value, ensure_ascii=False)


def render_journey(rec: dict, ctx: Context, placement: Placement, plan: list[JourneyStep]) -> str:
    ability = str(rec.get("ability"))
    rung = placement.rung or "UNPLACED"
    found = ctx.lesson(placement.rung) if placement.rung else None
    stage = found[0].get("number") if found else None
    track = found[1].get("track") if found else None
    lesson = found[2] if found else {}
    ex, songs = rung_options(lesson)
    stage_selector = _ts('.list-row[data-stage="' + str(stage) + '"]')
    track_selector = _ts(f"#plan-track-{track}")
    lines = [
        f"// Generated by tools/content/preflight_chains.py from docs/chains/{ability}.yaml: a journey SKELETON (class 6).",
        "// Not an acceptance journey: it carries no `acceptance-ability` marker. Placed in app/tests/e2e/ it would run",
        "// with the helpers below; a test.fixme line marks a step no template could make.",
        "import { expect, test, type Page } from '@playwright/test';",
        "import { installMidiMock, type MidiMock } from './fixtures/midiMock';",
        "import { playInTime } from './fixtures/playInTime';",
        "",
        f"const RUNG = {_ts(rung)};",
        "const screen = (page: Page) => page.locator('section[data-screen=\"score\"]');",
        "type Run = { step: number; expected: number[]; bar: number; paused: boolean } | null;",
        "type Hooked = Window & { __pianopath?: { scoreRun?: () => Run } };",
        "const run = (page: Page): Promise<Run> => page.evaluate(() => (window as Hooked).__pianopath?.scoreRun?.() ?? null);",
        "async function toLesson(page: Page, rung = RUNG): Promise<void> {",
        "  const done = page.locator('#summary-done');",
        "  if (await done.isVisible().catch(() => false)) await done.tap();",
        "  await page.evaluate((r) => { window.location.hash = `#/lesson/${r}`; }, rung);",
        "  await expect(page.locator('#lesson-text')).toBeVisible({ timeout: 30_000 });",
        "}",
        "async function countsLine(page: Page): Promise<string> {",
        "  await toLesson(page);",
        "  return ((await page.locator('#lesson-counts summary').textContent()) ?? '').trim();",
        "}",
        "async function openRow(page: Page, title: string, rung = RUNG): Promise<void> {",
        "  await toLesson(page, rung);",
        "  await page.getByRole('button', { name: `Open ${title}`, exact: true }).tap();",
        "  await expect(page).toHaveURL(/#\\/score\\//, { timeout: 30_000 });",
        "  await expect(page.locator('#score-stage')).toHaveAttribute('data-settled', 'true', { timeout: 60_000 });",
        "}",
        "async function menu(page: Page, open: boolean): Promise<void> {",
        "  const sheet = page.locator('#score-more-sheet');",
        "  if ((await sheet.isVisible()) === open) return;",
        "  await page.locator(open ? '#score-more' : '#score-more-sheet-close').tap();",
        "}",
        "async function setMode(page: Page, mode: 'wait' | 'tempo' | 'listen'): Promise<void> {",
        "  await page.locator('#score-mode').selectOption(mode);",
        "  await expect(screen(page)).toHaveAttribute('data-mode', mode);",
        "}",
        "async function setHand(page: Page, hand: 'L' | 'R' | 'both'): Promise<void> {",
        "  await page.locator(`#score-hands-${hand}`).tap();",
        "}",
        "async function setToggle(page: Page, id: string, on: boolean): Promise<void> {",
        "  await menu(page, true);",
        "  const toggle = page.locator(`#${id}`);",
        "  if (((await toggle.textContent()) ?? '').trim() !== (on ? 'On' : 'Off')) await toggle.tap();",
        "  await expect(toggle).toHaveText(on ? 'On' : 'Off');",
        "  await menu(page, false);",
        "}",
        "async function setTempo(page: Page, pct: number): Promise<void> {",
        "  await page.locator('#score-tempo-label').tap();",
        "  await page.locator('#score-tempo').fill(String(pct));",
        "  await page.locator('#score-tempo-sheet-close').tap();",
        "}",
        "async function loopBars(page: Page, from: number, to: number): Promise<void> {",
        "  // The double-tap on the first bar and then the last (LB1); a bar off the page is played to first.",
        "  test.fixme(true, `loop ${from}-${to}: reuse the hand-written journey's loopBars`);",
        "}",
        "async function hearIt(page: Page): Promise<void> {",
        "  await page.locator('#score-hear').tap();",
        "  await expect(screen(page)).toHaveAttribute('data-hearing', 'true', { timeout: 15_000 });",
        "}",
        "async function playToSummary(page: Page): Promise<void> {",
        "  await page.locator('#score-play').tap();",
        "  await playInTime(page, 'midi', 240_000);",
        "  await expect(page.locator('#score-summary')).toBeVisible({ timeout: 180_000 });",
        "}",
        "async function waitToSummary(page: Page, midi: MidiMock): Promise<void> {",
        "  await page.locator('#score-play').tap();",
        "  for (let i = 0; i < 2_000 && !(await page.locator('#score-summary').isVisible()); i += 1) {",
        "    const now = await run(page);",
        "    if (!now) break;",
        "    for (const note of now.expected) await midi.noteOn(note, 78);",
        "    for (const note of now.expected) await midi.noteOff(note);",
        "    await page.waitForTimeout(60);",
        "  }",
        "}",
        "",
        f"test({_ts(f'{ability}: the journey derived from the record')}, async ({{ page }}) => {{",
        "  test.setTimeout(90 * 60_000);",
        "  const midi = await installMidiMock(page, { permission: 'granted' });",
        *([] if any(s.kind == "wait" for s in plan) else ["  void midi; // the input is attached; no Wait for me step strikes it"]),
        f"  // Route: Plan -> the tracks sheet -> {track} on -> Stage {stage} -> {rung}.",
        "  await page.goto('/#/plan');",
        "  await page.locator('#plan-tracks-open').tap();",
        f"  const chip = page.locator({track_selector});",
        "  if ((await chip.getAttribute('aria-pressed')) !== 'true') await chip.tap();",
        "  await page.locator('#plan-tracks-sheet-close').tap();",
        f"  const stage = page.locator({stage_selector});",
        "  if ((await stage.getAttribute('data-open')) !== 'true') await stage.tap();",
        "  await page.locator(`.list-row[data-lesson=\"${RUNG}\"]`).tap();",
        f"  await expect(page.locator('#lesson-exercises .list-row')).toHaveCount({len(ex)});",
        f"  await expect(page.locator('#lesson-songs .list-row')).toHaveCount({len(songs)});",
    ]
    for s in plan:
        lines.append("")
        lines.append(f"  // record step {s.record_step}: {describe(s)}")
        lines.append(f"  await test.step({_ts(f'step {s.record_step}')}, async () => {{")
        body: list[str] = []
        if s.kind == "fixme":
            body.append(f"test.fixme(true, {_ts(s.note)});")
        elif s.kind == "lesson" and not s.item:
            body.append("await toLesson(page);")
        elif s.kind == "lesson":
            body.append(f"await openRow(page, {_ts(s.title)});")
            body.append("// The decision is the learner's: nothing is pressed and nothing is recorded.")
        elif s.kind == "later-rung":
            body.append(f"await openRow(page, {_ts(s.title)}, {_ts(s.rung)});")
        else:
            if s.counts == "unchanged":
                body.append("const before = await countsLine(page);")
            body.append(f"await openRow(page, {_ts(s.title)});")
            if s.loop:
                body.append(f"await loopBars(page, {s.loop[0]}, {s.loop[1]});")
            if s.mode:
                body.append(f"await setMode(page, {_ts(s.mode)});")
            if s.hand:
                body.append(f"await setHand(page, {_ts(s.hand)});")
            if s.rhythm is not None:
                body.append(f"await setToggle(page, 'score-rhythm', {str(s.rhythm).lower()});")
            if s.duet:
                body.append("await setToggle(page, 'score-duet', true);")
            if s.tempo:
                body.append(f"await setTempo(page, {s.tempo});")
            if s.counts and s.counts != "unchanged":
                body.append("expect(page.url()).toContain(`from=${RUNG}`);")
                body.append("expect((await screen(page).getAttribute('data-loop')) ?? '', 'no loop').toBe('');")
            if s.kind == "hear":
                body.append("await hearIt(page);")
            elif s.kind == "wait":
                body.append("await waitToSummary(page, midi);")
            else:
                body.append("await playToSummary(page);")
            if s.counts == "unchanged":
                body.append("expect(await countsLine(page)).toBe(before);")
            elif s.counts:
                body.append(f"expect(await countsLine(page)).toMatch(/{s.counts}/);")
        lines += [f"    {b}" for b in body]
        lines.append("  });")
    lines += [
        "",
        "  // Completion: the rung reads complete on Plan.",
        "  await page.evaluate(() => { window.location.hash = '#/plan'; });",
        "  const row = page.locator(`.list-row[data-lesson=\"${RUNG}\"]`);",
        "  await expect(row.locator('.badge')).toContainText([/complete/i]);",
        "});",
        "",
    ]
    return "\n".join(lines)


# --------------------------------------------------------------------------------------
# the comparison with a hand-written journey
# --------------------------------------------------------------------------------------


#: A loop of steps, and a loop inside one step. The tuple list never runs past its own ``as const``.
TOP_FOR = re.compile(r"for \(const \[([^\]]+)\] of \[((?:(?!as const).)*?)\] as const\) \{\s*(?=await step\()", re.S)
NESTED_FOR = re.compile(r"for \(const \[([^\]]+)\] of \[((?:(?!as const).)*?)\] as const\) \{", re.S)
STEP_CALL = re.compile(r"await step\(")


def _tuples(source: str) -> list[list[str]]:
    """The flat tuples of a ``[[a, b], [c, d]]`` literal, each value stripped (quotes kept off, ``T.x`` kept)."""
    return [[v.strip().strip("'\"`") if not v.strip().startswith("T.") else v.strip() for v in t.split(",") if v.strip()]
            for t in re.findall(r"\[([^\[\]]*)\]", source)]


def parse_written_journey(text: str) -> list[dict]:
    """The hand-written journey's steps in order, each with what it opens and does, read from its helper calls
    (``openRow``, ``setMode``, ``setHand``, ``setToggle``, ``loopBars``, ``hearIt``, ``playToSummary``, ``playLooped``,
    ``strikeStep``, ``setTempo`` and the counts assertions). A step's text runs from its ``await step(`` to the next one
    (or the next loop of steps). A ``for (const [...] of [...] as const) {`` whose body is a ``step(`` is expanded with
    its tuples; one inside a step binds its variables to every tuple's value. Written against the helper vocabulary of
    ``a7c1-phone-walk.spec.ts``."""
    titles = dict(re.findall(r"^\s+(\w+): ['\"](.+?)['\"],\s*$", text.split("type Verdict")[0], re.M))
    walk = text[text.find("test('"):] if "test('" in text else text
    loops = {m.end(): m for m in TOP_FOR.finditer(walk)}
    calls = [m.start() for m in STEP_CALL.finditer(walk)]
    bounds = sorted(set(calls) | {m.start() for m in loops.values()} | {len(walk)})
    steps: list[dict] = []
    for at in calls:
        end = next(b for b in bounds if b > at)
        region = walk[at:end]
        loop = loops.get(at)
        if loop is None:
            steps.append(_parse_step_body(region, titles, {}))
            continue
        names = [n.strip() for n in loop.group(1).split(",")]
        for values in _tuples(loop.group(2)):
            steps.append(_parse_step_body(region, titles, dict(zip(names, values))))
    return steps


def _parse_step_body(body: str, titles: dict, env: dict) -> dict:
    nested: dict[str, list[str]] = {}
    for loop in NESTED_FOR.finditer(body):
        names = [n.strip() for n in loop.group(1).split(",")]
        for values in _tuples(loop.group(2)):
            for name, value in zip(names, values):
                nested.setdefault(name, []).append(value)

    def resolve(token: str) -> list[str]:
        token = token.strip()
        if token in env:
            token = env[token]
        if token in nested:
            return [v for t in nested[token] for v in resolve(t)]
        if token.startswith("T."):
            return [titles.get(token[2:], token)]
        return [token.strip("'\"`")]

    head = re.match(r"await step\(\s*(['\"`]?)([\w.]+)\1", body)
    sid = (env.get(head.group(2), head.group(2)) if head and not head.group(1) else head.group(2)) if head else "?"
    opens = [title for token in re.findall(r"openRow\(page, ([^,]+), obs\)", body) for title in resolve(token)]
    return {
        "id": sid,
        "opens": opens,
        "modes": re.findall(r"setMode\(page, '(\w+)'", body),
        "hands": re.findall(r"setHand\(page, '(\w+)'", body),
        "rhythm": [m == "true" for m in re.findall(r"setToggle\(page, 'score-rhythm', (true|false)", body)]
        + (["read"] if "readToggle(page, 'score-rhythm')" in body else []),
        "duet": "'score-duet', true" in body,
        "loops": [(int(a), int(b)) for a, b in re.findall(r"loopBars\(page, midi, (\d+), (\d+)", body)],
        "hear": "hearIt(" in body,
        "summary": "playToSummary(" in body,
        "looped": "playLooped(" in body,
        "wait": "strikeStep(" in body and "setMode(page, 'wait'" in body,
        "tempo": [int(t) for t in re.findall(r"setTempo\(page, (\d+)", body)],
        "counts": re.findall(r"toMatch\(/(\d+ of \d+)/\)", body) or (["unchanged"] if "expect(after).toBe(before)" in body else []),
        "complete": "'complete'" in body,
        "later": "latin.6" in body and "latin.7" in body,
        "from": "toContain('from=" in body,
        "noloop": "'no loop'" in body,
        "asserts": [re.sub(r"\s+", " ", line).strip() for line in re.findall(r"^\s*(?:await )?(expect[^\n]*)", body, re.M)],
    }


def compare_journey(plan: list[JourneyStep], written: list[dict]) -> list[str]:
    """Every difference between the generated steps and the hand-written ones, paired in order by the item opened and
    what is done with it (a hand-written step may cover several record steps)."""
    lines: list[str] = []
    used: set[int] = set()

    def kind_of(w: dict) -> str:
        if w["later"]:
            return "later-rung"
        if w["wait"]:
            return "wait"
        if w["hear"] and not (w["summary"] or w["looped"]):
            return "hear"
        if w["summary"] or w["looped"]:
            if any(r is True for r in w["rhythm"]) or ("read" in w["rhythm"] and "rhythm" in w["id"]):
                return "rhythm"
            return "tempo"
        return "lesson"

    pairs: list[tuple[JourneyStep, int | None]] = []
    cursor = 0
    if written and written[0]["id"] == "route":
        # The generated skeleton walks the route before its steps; the hand-written one makes it a step.
        used.add(0)
        cursor = 1
        lines.append("route <-> written step route: both go Plan, the tracks sheet, the stage, the rung, and count the "
                     "lesson page's rows")
    for s in plan:
        found = None
        for k in range(cursor, len(written)):
            w = written[k]
            if s.kind == "lesson" and not s.item and k == cursor and not w["opens"]:
                found = k
                break
            if s.kind == "later-rung" and w["later"]:
                found = k
                break
            if s.title and s.title in w["opens"]:
                wk = kind_of(w)
                if wk == s.kind or (s.kind == "rhythm" and wk in ("rhythm", "tempo") and w["rhythm"]) or (
                        s.kind == "lesson" and wk == "lesson"):
                    found = k
                    break
            if s.kind in ("hear", "rhythm") and s.loop and not w["opens"] and w["loops"][:1] in ([s.loop], []) and (
                    (s.kind == "hear" and w["hear"]) or (s.kind == "rhythm" and w["looped"])):
                found = k
                break
        pairs.append((s, found))
        if found is not None:
            used.add(found)
            cursor = found
    for s, k in pairs:
        if k is None:
            lines.append(f"record step {s.record_step} ({describe(s)}): no hand-written step does it")
            continue
        w = written[k]
        diffs = []
        if s.mode and s.mode not in w["modes"] and not (s.kind == "wait" and w["wait"]):
            diffs.append(f"mode: generated {s.mode}, written {w['modes'] or 'none set'}")
        if w["modes"] and s.kind == "rhythm" and w["modes"][0] != "tempo":
            diffs.append(f"written chooses {w['modes']} before Rhythm only")
        if (s.hand or None) != (w["hands"][0] if w["hands"] else None):
            diffs.append(f"hand: generated {s.hand}, written {w['hands'] or 'none set'}")
        if s.rhythm is not None and s.rhythm not in w["rhythm"] and "read" not in w["rhythm"]:
            diffs.append(f"Rhythm only: generated {'on' if s.rhythm else 'off'}, written {w['rhythm'] or 'not touched'}")
        if s.rhythm is None and s.kind == "tempo" and any(r is False for r in w["rhythm"]):
            diffs.append("written switches Rhythm only off; generated does not (no Rhythm only step before it in the record)")
        if s.duet != w["duet"]:
            diffs.append(f"Duet: generated {'on' if s.duet else 'not set'}, written {'on' if w['duet'] else 'not set'}")
        written_loop = w["loops"][0] if w["loops"] else None
        if s.loop != written_loop and not (s.loop and not w["opens"]):
            diffs.append(f"loop: generated {s.loop}, written {written_loop}")
        if (s.tempo or None) != (w["tempo"][0] if w["tempo"] else None):
            diffs.append(f"speed: generated {s.tempo}, written {w['tempo'] or 'not set'}")
        written_counts = w["counts"][0] if w["counts"] else None
        if s.counts != written_counts:
            diffs.append(f"counts assertion: generated {s.counts}, written {written_counts}")
        counted = bool(s.counts and s.counts != "unchanged")
        if counted != w["from"]:
            diffs.append(f"opened-from-the-rung assertion: generated {'yes' if counted else 'no'}, written {'yes' if w['from'] else 'no'}")
        if counted != w["noloop"]:
            diffs.append(f"no-loop assertion: generated {'yes' if counted else 'no'}, written {'yes' if w['noloop'] else 'no'}")
        skeleton = ("countsLine", "expect(after)", "from=", "'no loop'")
        extra = [a for a in w["asserts"] if not any(t in a for t in skeleton)]
        if extra and not any(q == k for p, q in pairs[: pairs.index((s, k))]):
            diffs.append(f"written also asserts ({len(extra)}): " + " | ".join(a[:110] for a in extra))
        shared = [p for p, q in pairs if q == k]
        if len(shared) > 1 and shared[0] is s:
            diffs.append(f"one written step ({w['id']}) covers record steps {[p.record_step for p in shared]}")
        tag = f"record step {s.record_step} <-> written step {w['id']}"
        lines.append(f"{tag}: " + ("; ".join(diffs) if diffs else "same"))
    for k, w in enumerate(written):
        if k not in used:
            lines.append(f"written step {w['id']} (opens {w['opens'] or 'nothing'}): no record step pairs with it")
    complete = any(w["complete"] for w in written)
    lines.append(f"completion on Plan: generated asserts it; written {'asserts it' if complete else 'does not'}")
    return lines


# --------------------------------------------------------------------------------------
# one record, and the command line
# --------------------------------------------------------------------------------------


def run_record(rec: dict, ctx: Context) -> tuple[list[Result], Placement, list[JourneyStep]]:
    placement = placed_rung(rec, ctx)
    plan = plan_journey(rec, ctx, placement)
    results = (check_hand_reading(rec, ctx) + check_cut_marks(rec, ctx) + check_reachability(rec, ctx, placement)
               + check_counted(rec, ctx, placement) + check_taught(rec, ctx, placement)
               + check_journey(rec, ctx, placement, plan))
    return results, placement, plan


def report(rec: dict, results: list[Result], placement: Placement, shown: str) -> str:
    steps = rec.get("steps") or []
    lines = [f"PREFLIGHT {rec.get('ability')} ({rec.get('status')}) from {shown}",
             f"placed rung: {placement.rung or 'none'}" + (f" ({'; '.join(placement.how)})" if placement.how else "")]
    for cls, name in CLASSES.items():
        mine = [r for r in results if r.cls == cls]
        counts = {v: sum(1 for r in mine if r.verdict == v) for v in (PASS, FAIL, NA)}
        routed = sum(1 for r in mine if r.routed)
        lines.append("")
        lines.append(f"CLASS {cls}: {name} -- {counts[PASS]} PASS, {counts[FAIL]} FAIL, {counts[NA]} NOT-APPLICABLE"
                     + (f" ({routed} routed to class 6)" if routed else ""))
        for r in mine:
            label = ""
            if r.step is not None and 1 <= r.step <= len(steps):
                s = steps[r.step - 1]
                label = f"[{s.get('tool')}; {(s.get('content') or {}).get('ref')}]"
            lines += r.lines(label)
    fails = [r for r in results if r.verdict == FAIL]
    lines.append("")
    lines.append(f"SUMMARY {rec.get('ability')}: {len(fails)} FAIL "
                 + ", ".join(f"class {c} {sum(1 for r in fails if r.cls == c)}" for c in CLASSES))
    return "\n".join(lines) + "\n"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="The chain preflight: the defect classes slices found, on every record.")
    parser.add_argument("abilities", nargs="*", help="records to run (default: every docs/chains/*.yaml)")
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument("--content", type=Path, default=None, help="the built content folder (default app/public/content)")
    parser.add_argument("--out", type=Path, default=None, help=f"where the reports go (default {DEFAULT_OUT})")
    parser.add_argument("--strict", action="store_true", help="exit 1 on any FAIL")
    parser.add_argument("--compare", type=Path, action="append", default=[],
                        help="a hand-written journey spec to compare with the generated one of the record it declares")
    args = parser.parse_args(argv)
    root = args.root
    try:
        ctx = Context.from_tree(root, args.content)
    except InputsMissing as missing:
        print(missing, file=sys.stderr)
        return 2
    out_dir = args.out or (root / DEFAULT_OUT)
    out_dir.mkdir(parents=True, exist_ok=True)
    paths = sorted(root.glob(CC.CHAINS_GLOB))
    if args.abilities:
        paths = [p for p in paths if p.stem in args.abilities]
    failed = 0
    for path in paths:
        rec = yaml.safe_load(path.read_text(encoding="utf-8"))
        shown = path.relative_to(root).as_posix()
        results, placement, plan = run_record(rec, ctx)
        text = report(rec, results, placement, shown)
        try:
            where = ctx.content.resolve().relative_to(root.resolve()).as_posix()
        except ValueError:
            where = "<content>"  # a folder outside the tree: no machine path in a kept file
        first, _, rest = text.partition("\n")
        text = f"{first}\nbuilt content: {where}/catalog.json ({len(ctx.catalog)} rows)\n{rest}"
        (out_dir / f"preflight-{path.stem}.txt").write_text(text, encoding="utf-8", newline="\n")
        (out_dir / f"journey-{path.stem}.spec.ts").write_text(render_journey(rec, ctx, placement, plan), encoding="utf-8",
                                                               newline="\n")
        for spec in args.compare:
            spec_text = (spec if spec.is_absolute() else root / spec).read_text(encoding="utf-8")
            if f"// acceptance-ability: {rec.get('ability')}" not in spec_text:
                continue
            diff = compare_journey(plan, parse_written_journey(spec_text))
            body = (f"COMPARE generated journey-{path.stem}.spec.ts with {spec.as_posix()}\n"
                    + "\n".join(f"  {line}" for line in diff) + "\n")
            (out_dir / f"journey-compare-{path.stem}.txt").write_text(body, encoding="utf-8", newline="\n")
            text += "\n" + body
        sys.stdout.write(text + "\n")
        failed += sum(1 for r in results if r.verdict == FAIL)
    print(f"{len(paths)} record(s); {failed} FAIL in all; report mode" + (" (--strict: blocking)" if args.strict else ""))
    return 1 if (args.strict and failed) else 0


if __name__ == "__main__":
    sys.exit(main())
