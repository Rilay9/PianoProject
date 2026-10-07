#!/usr/bin/env python3
"""The chain-record checker (FABLE.md section 2 step 2 and section 3, 2026-10-06).

One record per learner-facing ability: ``docs/chains/<ability-id>.yaml``. The record is the teaching
design as data. This script reads every record and enforces the rules FABLE.md section 3 lists, and
nothing else:

 R1  every field is present;
 R2  every ``tool`` is one MODE-SHEET names;
 R3  every ``ref`` resolves once ``status`` is ``reviewed`` or ``shipped``; a ``draft`` may hold
     unresolved refs, and they are listed (a line each, not a failure);
 R4  every step after the first removes at least one scaffold, or carries a one-line reason;
 R5  the last step's scaffold is a strict subset of the first step's;
 R6  ``never_credits`` is not empty;
 R7  every generated family has its job, ``presented_as`` (drill or music), contract and checker;
     every step whose content kind is ``generated`` names a family that has a ``generated`` entry
     (see below); SIGHT-READING, MUSICAL and NAMED-PATTERN with ``presented_as: music`` list their
     musical properties, each with how it is established or UNKNOWN; a mechanical CONTROL
     (``presented_as: drill``) lists none and none is required;
 R8  ``status: shipped`` requires an acceptance-test path that exists.
 R9  ``status: shipped`` requires ``acceptance_journey``: an existing browser spec under
     ``app/tests/e2e/`` (``*.spec.ts``) that drives the visible path and contains the exact line
     ``// acceptance-ability: <ability id>``. It enforces FABLE sections 1 and 9 (objective acceptance
     is automated, never assigned to the owner; the owner, 2026-10-06).

``--lint-briefs`` also reads ``docs/prompts/runs/*/briefs/*.md``. A major curriculum brief declares
itself with one line, ``ability: <id>`` (the id in ABILITY-MAP.md's form, FABLE.md section 3). Every
brief that carries the line must have the headings Instructional chain, Failure route and Independence
test, and a record ``docs/chains/<id>.yaml`` that passes (a ``draft`` passes, its unresolved refs
listed with every record's). A brief without the line is not linted; the run says how many were
skipped. The same flag also runs the fail-closed owner-work guard and clause-map check on post-baseline immutable reviewer
handoffs, plus the outside-review closure ledger on post-baseline reviewer responses. docs-integrity is the runner
that sees a handoff/response-only push.

``--tools`` prints the tool vocabulary.

The summary always says that the scaffold-subset rule (R5) is a structural check, not proof that
pedagogical support faded.

Output: one line per failure, ``FAIL <file>: <field>: <message>``, then ``UNRESOLVED`` lines for a
draft's unresolved refs, then a summary. Exit 1 when there is any failure. Step numbers in a field
path are 1-based (``steps[3]`` is the third step of the record).

Decisions the brief took (briefs/chain-record-checker.md, "Decisions taken here"):

 * Tool vocabulary. Read from MODE-SHEET.md's section headings (sections 1 to 31, and 7a and 7b;
   the Score-screen settings Blind, Loop, Ladder, Duet, Rhythm only and Perform are sections 9 to
   14, and section 31 is the lesson page, ``lesson``, a presentation surface that measures
   nothing). ``SECTION_NAMES`` below lists, for each section, the words the sheet's own heading uses
   for it, and ``vocabulary()`` fails when a section or a name is no longer in the sheet's headings.
   Names compare after case-folding, collapsing whitespace and dropping a leading ``Score:`` or
   ``Score screen:``, so a record may write ``Score: Keep tempo``. The checker defines no tool of its
   own: it also reads the ``tool:`` field line of FABLE.md section 3, whose ``, or <name>: ...`` clauses
   name the tools beyond the mode sheet's modes (today ``lesson``), and each such name must be
   documented by a MODE-SHEET heading, or the vocabulary fails.
 * Ref resolution is exact; nothing resolves by prefix or resemblance. A ref is ``<target>`` or
   ``<target>@bars=<from>-<to>``. The target resolves when it is: (1) a path that exists in the tree;
   with a ``#anchor`` it resolves only when the path is a Markdown file (``.md``) and the anchor
   equals the slug of one of its headings or a literal anchor in it (see ``markdown_anchors``: the
   slug is GitHub's, lower-cased, punctuation dropped, spaces to hyphens, a repeated heading
   suffixed ``-1``, ``-2``; a literal anchor is an ``id=`` or ``name=`` attribute on an HTML tag, or
   a ``{#anchor}`` on a heading), so ``FABLE.md#3`` does not resolve and
   ``FABLE.md#3-the-chain-record-the-teaching-design-as-data-the-build-checks`` does; (2) an id in
   ``content/catalog.static.json``; (3) a song id or a CID in ``content/sources/pdmx.json`` (a bars
   suffix must lie inside the item's bar count); (4) an exercise id, by EXACT match, first against
   ``tools/content/generated_ids.json`` (the manifest of every generated item the build keeps, as
   ``{id, family, version}``; ``build.py`` writes it and fails a full build while the committed
   copy is stale, so it is current wherever the checker runs, and the checker never imports a
   generator), then against ``tools/content/generator_continuity.json`` (the items of each version
   a family left, so a historical id still resolves; lane A7F, the reviewer's H7 in
   ``docs/review/responses/g13-habanera-control.md`` section 3: a built id resolves whether or not
   its family's version ever moved); ``family_contracts.json`` declares no item pattern, so an
   exercise id resolves by exact match only, and ``exercise.tresillo.zz`` or
   ``exercise.tresillo`` does not; (4b) an authored exercise id: the literal string of ``"id"`` in a module-level
   ``PIANOPATH = {...}`` of a ``*.py`` under ``content/scores/authored/``, read by ``ast.parse`` and never by
   importing or running the module (A7a-authored-id-resolution, the reviewer's ruling in
   ``docs/review/responses/a7a-drafts.md``); exact match; an id computed rather than literal (concatenation,
   f-string, name, call, ``**`` spread), a ``PIANOPATH`` bound twice or mutated, or a syntax error is not
   guessed and resolves nothing; an id two modules declare resolves for neither and fails the run, naming both
   files; (5) an excerpt
   id derived from a row of ``content/sources/excerpts.json`` by ``excerpts.excerpt_id``'s own rule;
   (6) a family id in ``tools/content/family_contracts.json``; (7) a well-formed http(s) URL when
   the content kind is ``external`` (never fetched: CI has no network, so a URL is only a pointer).
 * Scaffold subset. Scaffolds compare as sets of strings after trimming and lower-casing; the rule is
   exact wording, so records write reusable tokens.

Fields this script adds to FABLE section 3's shape, because a rule needs somewhere to read:
 * ``steps[].no_removal_reason`` (optional): the one-line reason of R4.
 * ``acceptance_test`` (top level, optional): the acceptance-test path R8 reads.
 * ``acceptance_journey`` (top level, optional until shipped): the browser spec R9 reads.
 * ``content`` is one mapping and ``tool`` one string per step; a row with two items or two tools is
   written as two steps.

The generated-step link (R7). A step ``content: {kind: generated, ref: ...}`` links to the ``generated``
entry whose ``family`` is the ref, or, when the ref is an exercise id rule (4) resolves, the entry whose
``family`` is that exercise's family: its row's in ``tools/content/generated_ids.json``, else the
continuity family that holds it (the record's steps cite ``exercise.tresillo.c``, whose entry is
``tresillo``, and ``exercise.bass-cell.habanera.c``, whose entry is ``bass_cell``). The checker fails a
step whose ref identifies a family (a family id in ``family_contracts.json`` or an exercise id rule (4)
resolves) that no ``generated`` entry lists. A generated step whose ref
identifies no family is R3's: listed in a draft, a failure once reviewed. Nothing is inferred from a
tool or from a step's wording.

``presented_as: drill|music`` is required on every ``generated`` entry (FABLE section 3) and is the only
thing that decides whether a NAMED-PATTERN lists musical properties: ``music`` requires at least one,
each established or UNKNOWN; ``drill`` requires none (any it does list are still validated).
SIGHT-READING and MUSICAL always list at least one. A CONTROL requires none; a CONTROL with
``presented_as: drill`` may omit ``musical_properties`` altogether.
"""
from __future__ import annotations

import argparse
import ast
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path

import yaml

import owner_asks as owner_work  # noqa: E402
import clause_map  # noqa: E402
import review_closure as review_closure_guard  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
CHAINS_GLOB = "docs/chains/*.yaml"
BRIEFS_GLOB = "docs/prompts/runs/*/briefs/*.md"
MODE_SHEET = "docs/prompts/runs/curriculum-review-2026-10-05/MODE-SHEET.md"
FABLE = "docs/prompts/FABLE.md"
#: Rule (4)'s two sources for an exercise id, in the order they are read.
GENERATED_IDS = "tools/content/generated_ids.json"
GENERATOR_CONTINUITY = "tools/content/generator_continuity.json"
#: Rule (4b): where authored score modules live; their literal ``PIANOPATH`` id is read by parsing, never by running.
AUTHORED_DIR = "content/scores/authored"
#: Methods that change a dict in place; a module calling one on ``PIANOPATH`` is not read as literal.
PIANOPATH_MUTATORS = frozenset({"update", "setdefault", "pop", "popitem", "clear", "__setitem__", "__delitem__", "__ior__"})

STATUSES = ("draft", "reviewed", "shipped")
KINDS = ("generated", "excerpt", "piece", "chart", "external", "explanation")
JOBS = ("CONTROL", "SIGHT-READING", "NAMED-PATTERN", "MUSICAL")
MUSICAL_JOBS = ("SIGHT-READING", "MUSICAL")
PRESENTED = ("drill", "music")
UNKNOWN = "UNKNOWN"
#: Words that stand in for "how it is established" without saying how.
PLACEHOLDERS = {"tbd", "todo", "?", "n/a", "na", "none", "unknown", "-", "...", "x"}

#: For each MODE-SHEET section, the words its own heading uses for it. ``vocabulary()`` holds this to
#: the sheet: a section that vanished or a name its heading no longer contains is a failure.
SECTION_NAMES: dict[str, list[str]] = {
    "1": ["Wait for me", "wait"],
    "2": ["Keep tempo", "tempo"],
    "3": ["Play it to me", "Hear it", "listen"],
    "4": ["Free play", "free"],
    "5": ["Free play, standalone", "#/play"],
    "6": ["Simon", "drill:simon"],
    "7": ["Accompaniment lab", "#/lab"],
    "7a": ["Read it"],
    "7b": ["Jam it", "Bed only", "Hold the chords", "Play the tune"],
    "8": ["Trading fours", "trade 2", "trade 4"],
    "9": ["Perform"],
    "10": ["Blind"],
    "11": ["Loop"],
    "12": ["Ladder"],
    "13": ["Duet"],
    "14": ["Rhythm only"],
    "15": ["Chord chart", "#/chart"],
    "16": ["Today's daily sight-read"],
    "17": ["Note flash", "drill:note-flash"],
    "18": ["Find the key", "drill:find-key"],
    "19": ["Ear drills", "ear-interval", "ear-chord"],
    "20": ["ear-progression"],
    "21": ["Melodic dictation", "Answer the phrase", "call-response"],
    "22": ["Harmonic dictation", "harmonic-dictation"],
    "23": ["Rhythm drill", "Rhythm dictation"],
    "24": ["Tune playback", "ear-tune"],
    "25": ["Reading and theory drills"],
    "26": ["Pedal change", "dynamics"],
    "27": ["Backing track", "drill:backing-track"],
    "28": ["Practise from the book", "Paper"],
    "29": ["Orientation items", "drill:checklist", "drill:walkthrough", "drill:placement"],
    "30": ["Metronome", "PDF viewer"],
    "31": ["Lesson page", "lesson"],
}

HEADING_RE = re.compile(r"^#{2,3}\s+(\d+[ab]?)\.\s+(.+?)\s*$")

#: A major curriculum brief declares itself with one whole line, ``ability: <id>`` (FABLE.md section 3).
ABILITY_ID = r"[A-Za-z][A-Za-z0-9]*(?:\.[A-Za-z0-9]+)*"
ABILITY_MARKER_RE = re.compile(rf"^ability:[ \t]+(?P<id>{ABILITY_ID})[ \t]*$")
SCAFFOLD_NOTE = (
    "note: the scaffold-subset rule (R5) is a structural check on the wording of two lists, "
    "not proof that pedagogical support faded"
)
BRIEF_HEADINGS = ("Instructional chain", "Failure route", "Independence test")


# --------------------------------------------------------------------------------------
# result types
# --------------------------------------------------------------------------------------


@dataclass(frozen=True)
class Failure:
    file: str
    field: str
    message: str

    def line(self) -> str:
        return f"FAIL {self.file}: {self.field}: {self.message}"


@dataclass(frozen=True)
class Unresolved:
    file: str
    field: str
    ref: str
    why: str

    def line(self) -> str:
        return f"UNRESOLVED {self.file}: {self.field}: {self.ref} ({self.why})"


# --------------------------------------------------------------------------------------
# the tool vocabulary
# --------------------------------------------------------------------------------------


def norm_tool(name: str) -> str:
    text = re.sub(r"\s+", " ", str(name).strip()).casefold()
    text = re.sub(r"^score(?: screen)?\s*:\s*", "", text)
    return text.rstrip(".")


def sheet_headings(root: Path = ROOT) -> dict[str, str]:
    """Section id -> heading text, read from MODE-SHEET.md."""
    path = root / MODE_SHEET
    headings: dict[str, str] = {}
    if not path.is_file():
        return headings
    for line in path.read_text(encoding="utf-8").splitlines():
        match = HEADING_RE.match(line)
        if match and match.group(1) not in headings:
            headings[match.group(1)] = match.group(2)
    return headings


FABLE_TOOL_LINE_RE = re.compile(r"^\s*tool:\s*<(?P<body>[^>]*)>")
FABLE_EXTRA_RE = re.compile(r",\s*or\s+(?P<name>[A-Za-z][\w-]*)\s*:")


def fable_tool_names(root: Path = ROOT) -> tuple[list[str], list[Failure]]:
    """The tools FABLE.md section 3's ``tool:`` field line names beyond the mode sheet's modes, read from
    its ``, or <name>: ...`` clauses, and the ways that line cannot be read."""
    path = root / FABLE
    if not path.is_file():
        return [], [Failure(FABLE, "tool field", "FABLE.md is missing: the governing definition of the tool field cannot be read")]
    for line in path.read_text(encoding="utf-8").splitlines():
        match = FABLE_TOOL_LINE_RE.match(line)
        if match:
            return [m.group("name") for m in FABLE_EXTRA_RE.finditer(match.group("body"))], []
    return [], [Failure(FABLE, "tool field", "no `tool: <...>` field line found in the chain record shape")]


def vocabulary(root: Path = ROOT) -> tuple[dict[str, str], list[Failure]]:
    """The tool vocabulary (normalised name -> canonical spelling) and the ways the sheet no longer
    matches SECTION_NAMES or FABLE.md's tool field names a tool the sheet does not document."""
    headings = sheet_headings(root)
    problems: list[Failure] = []
    names: dict[str, str] = {}
    if not headings:
        problems.append(Failure(MODE_SHEET, "headings", "MODE-SHEET.md is missing or has no numbered section headings"))
        return names, problems
    for section, words in SECTION_NAMES.items():
        heading = headings.get(section)
        if heading is None:
            problems.append(Failure(MODE_SHEET, f"section {section}", "no such heading in MODE-SHEET.md; update SECTION_NAMES"))
            continue
        for word in words:
            if word.casefold() not in heading.casefold():
                problems.append(
                    Failure(MODE_SHEET, f"section {section}", f"heading {heading!r} no longer contains {word!r}; update SECTION_NAMES")
                )
                continue
            names.setdefault(norm_tool(word), word)
    extras, fable_problems = fable_tool_names(root)
    problems += fable_problems
    sheet_text = " ".join(headings.values()).casefold()
    for word in extras:
        if word.casefold() not in sheet_text:
            problems.append(
                Failure(FABLE, "tool field", f"names the tool {word!r}, which no MODE-SHEET.md heading documents; add its section there")
            )
        names.setdefault(norm_tool(word), word)
    return names, problems


# --------------------------------------------------------------------------------------
# ref resolution
# --------------------------------------------------------------------------------------

BARS_RE = re.compile(r"^(?P<target>.+?)@bars=(?P<a>\d+)-(?P<b>\d+)$")
URL_RE = re.compile(r"^https?://[^\s/$.?#][^\s]*$", re.IGNORECASE)
HAND_SUFFIX = {"both": "", "right": ".rh", "left": ".lh"}  # the same table as excerpts.HAND_SUFFIX


def _load_json(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


HEADING_LINE_RE = re.compile(r"^ {0,3}#{1,6}[ \t]+(?P<text>.*?)[ \t#]*$")
HEADING_ATTR_RE = re.compile(r"\s*\{#(?P<id>[A-Za-z0-9_:.-]+)\}\s*$")
HTML_ANCHOR_RE = re.compile(r"<[A-Za-z][^>]*?\b(?:id|name)\s*=\s*[\"'](?P<id>[^\"']+)[\"']", re.IGNORECASE)
FENCE_RE = re.compile(r"^ {0,3}(```|~~~)")


def heading_slug(text: str) -> str:
    """GitHub's heading slug: links keep their text, tags and inline markup go, the rest is lower-cased,
    anything that is not a letter, digit, underscore, space or hyphen is dropped, and each space
    becomes a hyphen."""
    text = re.sub(r"!?\[([^\]]*)\]\([^)]*\)", r"\1", text)
    text = re.sub(r"<[^>]*>", "", text)
    text = re.sub(r"[`*]", "", text)
    text = re.sub(r"[^\w\- ]", "", text.strip().casefold())
    return text.replace(" ", "-")


def markdown_anchors(path: Path) -> set[str]:
    """Every anchor a Markdown file offers: the slug of each ATX heading outside a code fence (a repeated
    slug takes ``-1``, ``-2``, as GitHub gives it), each ``{#id}`` written on a heading, and each ``id=`` or
    ``name=`` attribute on an HTML tag. Nothing else is an anchor: not a table row, a bold lead or a number."""
    try:
        text = path.read_text(encoding="utf-8")
    except OSError:
        return set()
    anchors: set[str] = set()
    seen: dict[str, int] = {}
    fenced = False
    for line in text.splitlines():
        if FENCE_RE.match(line):
            fenced = not fenced
            continue
        if fenced:
            continue
        match = HEADING_LINE_RE.match(line)
        if not match:
            continue
        body = match.group("text")
        attr = HEADING_ATTR_RE.search(body)
        if attr:
            anchors.add(attr.group("id"))
            body = body[: attr.start()]
        slug = heading_slug(body)
        if not slug:
            continue
        count = seen.get(slug, 0)
        seen[slug] = count + 1
        anchors.add(slug if count == 0 else f"{slug}-{count}")
    anchors.update(m.group("id") for m in HTML_ANCHOR_RE.finditer(text))
    return anchors


def authored_module_id(source: str) -> str | None:
    """The literal ``PIANOPATH["id"]`` of an authored score module, read from its syntax tree; None when the module does
    not declare it as a literal. The source is parsed with ``ast.parse`` and never compiled, imported or run (the
    reviewer's A7a-authored-id-resolution: ``author.load_module`` executes the module, the checker must not).

    Accepted only when ``PIANOPATH`` is bound exactly once in the whole module, by a top-level ``PIANOPATH = {...}`` (or
    annotated) assignment of a dict display; every key of that display is a string constant (no ``**`` spread);
    ``"id"`` appears once and its value is a non-empty string constant with no surrounding whitespace; and nothing in
    the module deletes it, indexes into it for writing, or calls an in-place mutator on it. Anything else (an id built
    by concatenation, an f-string, a name, ``dict(id=...)``, two assignments, a mutation) is not guessed: None.
    """
    try:
        tree = ast.parse(source)
    except (SyntaxError, ValueError, RecursionError):
        return None
    bindings = 0
    for node in ast.walk(tree):
        if isinstance(node, ast.Name) and node.id == "PIANOPATH" and isinstance(node.ctx, (ast.Store, ast.Del)):
            bindings += 1
        elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)) and node.name == "PIANOPATH":
            bindings += 1
        elif isinstance(node, ast.alias) and (node.asname or node.name.split(".")[0]) == "PIANOPATH":
            bindings += 1
        elif isinstance(node, (ast.Global, ast.Nonlocal)) and "PIANOPATH" in node.names:
            return None
        elif (
            isinstance(node, ast.Subscript)
            and isinstance(node.value, ast.Name)
            and node.value.id == "PIANOPATH"
            and isinstance(node.ctx, (ast.Store, ast.Del))
        ):
            return None
        elif (
            isinstance(node, ast.Attribute)
            and isinstance(node.value, ast.Name)
            and node.value.id == "PIANOPATH"
            and node.attr in PIANOPATH_MUTATORS
        ):
            return None
    if bindings != 1:
        return None
    assigned = None
    for node in tree.body:
        if isinstance(node, ast.Assign) and len(node.targets) == 1:
            target, value = node.targets[0], node.value
        elif isinstance(node, ast.AnnAssign) and node.value is not None:
            target, value = node.target, node.value
        else:
            continue
        if isinstance(target, ast.Name) and target.id == "PIANOPATH":
            assigned = value
    if not isinstance(assigned, ast.Dict):
        return None
    found: list[str] = []
    for key, value in zip(assigned.keys, assigned.values):
        if not (isinstance(key, ast.Constant) and isinstance(key.value, str)):
            return None  # a ``**`` spread (key None) or a computed key could set or override the id
        if key.value == "id":
            if not (isinstance(value, ast.Constant) and isinstance(value.value, str)):
                return None
            found.append(value.value)
    if len(found) != 1 or not found[0] or found[0] != found[0].strip():
        return None
    return found[0]


class Resolver:
    """What a ref can name, read once from the committed sources under ``root``."""

    def __init__(self, root: Path = ROOT) -> None:
        self.root = root
        self._anchors: dict[Path, set[str]] = {}
        catalog = _load_json(root / "content/catalog.static.json") or []
        self.catalog_ids = {row.get("id") for row in catalog if isinstance(row, dict)}
        pdmx = (_load_json(root / "content/sources/pdmx.json") or {}).get("items", [])
        self.pdmx_by_id = {row["id"]: row for row in pdmx if isinstance(row, dict) and "id" in row}
        self.pdmx_by_cid = {row["cid"]: row for row in pdmx if isinstance(row, dict) and "cid" in row}
        # Rule (4): an exercise id resolves by exact match against the manifest of built generated ids first, then
        # against the continuity record, which keeps the ids of the versions a family left (historical ids).
        continuity = (_load_json(root / GENERATOR_CONTINUITY) or {}).get("families", {})
        self.exercise_family = {
            item: name
            for name, fam in continuity.items()
            if isinstance(fam, dict)
            for item in (fam.get("items") or {})
        }
        built = (_load_json(root / GENERATED_IDS) or {}).get("items", [])
        self.exercise_family.update(
            {
                row["id"]: row["family"]
                for row in built
                if isinstance(row, dict) and isinstance(row.get("id"), str) and isinstance(row.get("family"), str)
            }
        )
        self.exercise_ids = set(self.exercise_family)
        self.families = set((_load_json(root / "tools/content/family_contracts.json") or {}).get("families", {}))
        # Rule (4b): an authored module's literal PIANOPATH id, read statically. An id declared by two modules is
        # ambiguous: it resolves for neither and ``authored_problems`` names both files (main() fails on them).
        self.authored_ids: dict[str, str] = {}
        self.authored_problems: list[tuple[str, str]] = []
        declared: dict[str, list[str]] = {}
        authored_dir = root / AUTHORED_DIR
        for path in sorted(authored_dir.glob("*.py")) if authored_dir.is_dir() else []:
            if path.name == "__init__.py":
                continue
            try:
                ident = authored_module_id(path.read_text(encoding="utf-8"))
            except (OSError, UnicodeDecodeError):
                continue
            if ident is not None:
                declared.setdefault(ident, []).append(f"{AUTHORED_DIR}/{path.name}")
        for ident, files in declared.items():
            if len(files) == 1:
                self.authored_ids[ident] = files[0]
            else:
                for rel in files:
                    self.authored_problems.append(
                        (rel, f"authored id {ident} is declared by {len(files)} modules ({', '.join(files)}); it resolves for none")
                    )
        self.excerpt_ids = set()
        for row in (_load_json(root / "content/sources/excerpts.json") or {}).get("excerpts", []):
            try:
                parent = row["of"]
                stem = parent[len("song."):] if parent.startswith("song.") else parent
                self.excerpt_ids.add(
                    f"excerpt.{stem}.b{int(row['fromBar'])}-{int(row['toBar'])}{HAND_SUFFIX[row['selection']]}"
                )
            except (KeyError, TypeError, ValueError):
                continue

    def family_of(self, ref: str) -> str | None:
        """The generated family a ref identifies: a family id, or an exercise id's family (the manifest's, else the
        continuity record's)."""
        text = str(ref).strip()
        if text in self.families:
            return text
        return self.exercise_family.get(text)

    def _anchor_in(self, path: Path, anchor: str) -> bool:
        if path.suffix.casefold() != ".md" or not path.is_file():
            return False
        key = path.resolve()
        if key not in self._anchors:
            self._anchors[key] = markdown_anchors(path)
        return anchor in self._anchors[key]

    def resolve(self, ref: str, kind: str | None = None) -> tuple[bool, str]:
        """(True, '') when the ref resolves, else (False, why)."""
        text = str(ref).strip()
        if not text:
            return False, "empty"
        bars: tuple[int, int] | None = None
        if "@" in text:
            match = BARS_RE.match(text)
            if not match:
                return False, "malformed bars suffix (write <target>@bars=<from>-<to>)"
            text = match.group("target")
            bars = (int(match.group("a")), int(match.group("b")))
            if not 1 <= bars[0] <= bars[1]:
                return False, f"bars {bars[0]}-{bars[1]} is not a range"
        if URL_RE.match(text):
            if bars:
                return False, "a URL takes no bars suffix"
            if kind == "external":
                return True, ""
            return False, "a URL resolves only under content kind external"
        target, _, anchor = text.partition("#")
        if bars is None and target:
            candidate = (self.root / target).resolve()
            try:
                candidate.relative_to(self.root.resolve())
            except ValueError:
                candidate = None
            if candidate is not None and candidate.exists():
                if not anchor:
                    return True, ""
                if candidate.suffix.casefold() != ".md" or not candidate.is_file():
                    return False, f"{target} exists, but an #anchor is read only in a Markdown file"
                if self._anchor_in(candidate, anchor):
                    return True, ""
                return False, f"{target} exists but no heading slug or literal anchor in it is #{anchor}"
        if anchor:
            return False, "no such file"
        item = self.pdmx_by_id.get(text) or self.pdmx_by_cid.get(text)
        if item is not None:
            if bars is not None and bars[1] > int(item.get("bars") or 0):
                return False, f"bars {bars[0]}-{bars[1]} are outside the item's {item.get('bars')} bars"
            return True, ""
        if bars is not None:
            return False, "a bars suffix is read only on a song id or a CID in content/sources/pdmx.json"
        if text in self.catalog_ids:
            return True, ""
        if text in self.exercise_ids:
            return True, ""
        if text in self.authored_ids:
            return True, ""
        if text in self.excerpt_ids:
            return True, ""
        if text in self.families:
            return True, ""
        return False, "no such file, id, family or CID in the committed sources"


# --------------------------------------------------------------------------------------
# one record
# --------------------------------------------------------------------------------------


def _blank(value) -> bool:
    return value is None or (isinstance(value, str) and not value.strip())


def _norm_item(item) -> str:
    return re.sub(r"\s+", " ", str(item).strip()).casefold()


def check_record(rec, file: str, resolver: Resolver, tools: dict[str, str] | None = None, root: Path = ROOT):
    """(failures, unresolved) for one parsed record."""
    failures: list[Failure] = []
    unresolved: list[Unresolved] = []
    if tools is None:
        tools = vocabulary(root)[0]

    def fail(field: str, message: str) -> None:
        failures.append(Failure(file, field, message))

    if not isinstance(rec, dict):
        fail("(record)", "the file is not a mapping of fields")
        return failures, unresolved

    # R1 -- every field present --------------------------------------------------------
    for key in ("ability", "learner_cannot", "independent_target", "independence_test"):
        if _blank(rec.get(key)):
            fail(key, "missing or empty")
    status = rec.get("status")
    if _blank(status):
        fail("status", "missing")
    elif status not in STATUSES:
        fail("status", f"{status!r} is not one of {', '.join(STATUSES)}")
    steps = rec.get("steps")
    if not isinstance(steps, list) or not steps:
        fail("steps", "missing or empty (a list of steps in teaching order)")
        steps = []
    routes = rec.get("failure_routes")
    if not isinstance(routes, list) or not routes:
        fail("failure_routes", "missing or empty (a list of {observed, next})")
        routes = []
    for n, route in enumerate(routes, 1):
        for key in ("observed", "next"):
            if not isinstance(route, dict) or _blank(route.get(key)):
                fail(f"failure_routes[{n}].{key}", "missing or empty")
    evidence = rec.get("evidence")
    if not isinstance(evidence, dict):
        fail("evidence", "missing (a mapping of updates, self_checked, never_credits)")
        evidence = {}
    for key in ("updates", "self_checked", "never_credits"):
        value = evidence.get(key)
        if not isinstance(value, list):
            fail(f"evidence.{key}", "missing (a list; it may be empty except never_credits)")
        elif any(_blank(item) for item in value):
            fail(f"evidence.{key}", "has an empty item")
    generated = rec.get("generated")
    if not isinstance(generated, list):
        fail("generated", "missing (a list, empty when no generated family is used)")
        generated = []

    refs: list[tuple[str, str, str | None]] = []  # (field, ref, content kind)
    generated_steps: list[tuple[str, str]] = []  # (field, ref) of every step whose content kind is generated
    for n, step in enumerate(steps, 1):
        where = f"steps[{n}]"
        if not isinstance(step, dict):
            fail(where, "not a mapping of fields")
            continue
        for key in ("action", "feedback", "recorded", "cannot_establish"):
            if _blank(step.get(key)):
                fail(f"{where}.{key}", "missing or empty")
        content = step.get("content")
        kind = None
        if not isinstance(content, dict):
            fail(f"{where}.content", "missing (a mapping of kind and ref)")
        else:
            kind = content.get("kind")
            if kind not in KINDS:
                fail(f"{where}.content.kind", f"{kind!r} is not one of {', '.join(KINDS)}")
            if _blank(content.get("ref")):
                fail(f"{where}.content.ref", "missing or empty")
            else:
                refs.append((f"{where}.content.ref", str(content["ref"]), kind if kind in KINDS else None))
                if kind == "generated":
                    generated_steps.append((f"{where}.content.ref", str(content["ref"])))
        for key in ("scaffold", "removes"):
            value = step.get(key)
            if not isinstance(value, list):
                fail(f"{where}.{key}", "missing (a list; it may be empty)")
            elif any(_blank(item) for item in value):
                fail(f"{where}.{key}", "has an empty item")
        # R2 -- the tool is one MODE-SHEET names -------------------------------------
        tool = step.get("tool")
        if _blank(tool) or not isinstance(tool, str):
            fail(f"{where}.tool", "missing (one tool named in MODE-SHEET.md)")
        elif norm_tool(tool) not in tools:
            fail(f"{where}.tool", f"{tool!r} is not a tool MODE-SHEET.md names (run with --tools)")
        # R4 -- every step after the first removes a scaffold, or says why not -------
        if n > 1 and isinstance(step.get("removes"), list):
            if not [item for item in step["removes"] if not _blank(item)] and _blank(step.get("no_removal_reason")):
                fail(f"{where}.removes", "removes nothing and gives no reason (list what goes, or write no_removal_reason)")

    # R5 -- the last scaffold is a strict subset of the first --------------------------
    if len(steps) >= 1 and all(isinstance(s, dict) and isinstance(s.get("scaffold"), list) for s in (steps[0], steps[-1])):
        first = {_norm_item(x) for x in steps[0]["scaffold"] if not _blank(x)}
        last = {_norm_item(x) for x in steps[-1]["scaffold"] if not _blank(x)}
        if not last < first:
            extra = sorted(last - first)
            detail = f"; not in the first step's scaffold: {', '.join(extra)}" if extra else "; it equals the first step's scaffold"
            if not first:
                detail = "; the first step's scaffold is empty"
            fail(f"steps[{len(steps)}].scaffold", "the last step's scaffold is not a strict subset of the first step's" + detail)

    # R6 -- never_credits is not empty -------------------------------------------------
    credits = evidence.get("never_credits")
    if isinstance(credits, list) and not [x for x in credits if not _blank(x)]:
        fail("evidence.never_credits", "is empty: say what must never earn credit")

    # R7 -- generated families ---------------------------------------------------------
    for n, entry in enumerate(generated, 1):
        where = f"generated[{n}]"
        if not isinstance(entry, dict):
            fail(where, "not a mapping of fields")
            continue
        if _blank(entry.get("family")):
            fail(f"{where}.family", "missing or empty")
        else:
            refs.append((f"{where}.family", str(entry["family"]), None))
        job = entry.get("job")
        if job not in JOBS:
            fail(f"{where}.job", "missing" if _blank(job) else f"{job!r} is not one of {', '.join(JOBS)}")
        presented = entry.get("presented_as")
        if presented not in PRESENTED:
            fail(
                f"{where}.presented_as",
                "missing (drill or music: whether the learner meets the family as a drill or as music)"
                if _blank(presented)
                else f"{presented!r} is not one of {', '.join(PRESENTED)}",
            )
        for key in ("contract", "checker"):
            if _blank(entry.get(key)):
                fail(f"{where}.{key}", "missing or empty")
            else:
                refs.append((f"{where}.{key}", str(entry[key]), None))
        props = entry.get("musical_properties")
        if props is None and (
            (job == "CONTROL" and presented == "drill") or (job == "NAMED-PATTERN" and presented == "music")
        ):
            props = {}  # a mechanical CONTROL lists none; a music NAMED-PATTERN with none fails below, by its own rule
        if not isinstance(props, dict):
            fail(f"{where}.musical_properties", "missing (a mapping; empty only for a CONTROL, or a NAMED-PATTERN presented_as drill)")
            continue
        if job in MUSICAL_JOBS and not props:
            fail(f"{where}.musical_properties", f"a {job} family lists its musical properties, each established or {UNKNOWN}")
        if job == "NAMED-PATTERN" and presented == "music" and not props:
            fail(
                f"{where}.musical_properties",
                f"a NAMED-PATTERN with presented_as: music lists its musical properties, each established or {UNKNOWN}",
            )
        for prop, how in props.items():
            if _blank(how) or not isinstance(how, str):
                fail(f"{where}.musical_properties.{prop}", f"neither how it is established nor {UNKNOWN}")
            elif how.strip().casefold() in PLACEHOLDERS and how.strip() != UNKNOWN:
                fail(f"{where}.musical_properties.{prop}", f"{how!r} says nothing about how it is established; write {UNKNOWN} or the method")

    # R7 -- every generated step's family is listed ------------------------------------
    listed_families = {str(e["family"]).strip() for e in generated if isinstance(e, dict) and not _blank(e.get("family"))}
    for field, ref in generated_steps:
        family = resolver.family_of(ref)
        if family is not None and family not in listed_families:
            fail(field, f"generated step names family {family!r} (ref {ref!r}), which has no entry under generated")

    # R3 -- refs resolve once reviewed or shipped; a draft's are listed ----------------
    for field, ref, kind in refs:
        ok, why = resolver.resolve(ref, kind)
        if ok:
            continue
        if status in ("reviewed", "shipped"):
            fail(field, f"ref {ref!r} does not resolve ({why}); status is {status}")
        else:
            unresolved.append(Unresolved(file, field, ref, why))

    # R8 -- shipped needs an acceptance-test path that exists --------------------------
    if status == "shipped":
        path = rec.get("acceptance_test")
        if _blank(path):
            fail("acceptance_test", "status is shipped: name the acceptance-test path")
        elif not (resolver.root / str(path)).exists():
            fail("acceptance_test", f"{path!r} does not exist")

    # R9 -- shipped needs an automated browser journey through the visible path ---------
    if status == "shipped":
        journey = rec.get("acceptance_journey")
        if _blank(journey):
            fail("acceptance_journey", "status is shipped: name the browser spec that drives the visible path")
        elif not (str(journey).startswith("app/tests/e2e/") and str(journey).endswith(".spec.ts")):
            fail("acceptance_journey", f"{journey!r} is not a browser spec under app/tests/e2e/")
        elif not (resolver.root / str(journey)).exists():
            fail("acceptance_journey", f"{journey!r} does not exist")
        else:
            ability = str(rec.get("ability") or "").strip()
            marker = f"// acceptance-ability: {ability}"
            try:
                journey_lines = (resolver.root / str(journey)).read_text(encoding="utf-8").splitlines()
            except OSError:
                journey_lines = []
            if marker not in [line.strip() for line in journey_lines]:
                fail(
                    "acceptance_journey",
                    f"{journey!r} does not declare this chain with the exact line {marker!r}",
                )
    return failures, unresolved



def check_file(path: Path, resolver: Resolver, tools: dict[str, str], root: Path = ROOT):
    try:
        shown = path.resolve().relative_to(root.resolve()).as_posix()
    except ValueError:
        shown = path.as_posix()
    try:
        rec = yaml.safe_load(path.read_text(encoding="utf-8"))
    except (OSError, yaml.YAMLError) as exc:
        first = str(exc).strip().splitlines()[0] if str(exc).strip() else type(exc).__name__
        return [Failure(shown, "(file)", f"not readable as YAML: {first}")], [], None
    failures, unresolved = check_record(rec, shown, resolver, tools, root)
    return failures, unresolved, (rec.get("status") if isinstance(rec, dict) else None)


# --------------------------------------------------------------------------------------
# the brief lint
# --------------------------------------------------------------------------------------


def brief_markers(lines: list[str]) -> list[str]:
    """The ability ids a brief declares, one per whole line ``ability: <id>`` (in file order, no repeats)."""
    ids: list[str] = []
    for line in lines:
        match = ABILITY_MARKER_RE.match(line)
        if match and match.group("id") not in ids:
            ids.append(match.group("id"))
    return ids


def lint_briefs(
    root: Path = ROOT, resolver: Resolver | None = None, tools: dict[str, str] | None = None
) -> tuple[list[Failure], list[str]]:
    """(failures, notes). Every brief that carries an ``ability: <id>`` line must have the three headings
    and a record ``docs/chains/<id>.yaml`` that passes; a brief without the line is skipped, and a note
    says how many were."""
    failures: list[Failure] = []
    linted: list[str] = []
    skipped = 0
    if resolver is None:
        resolver = Resolver(root)
    if tools is None:
        tools = vocabulary(root)[0]
    for path in sorted(root.glob(BRIEFS_GLOB)):
        shown = path.relative_to(root).as_posix()
        lines = path.read_text(encoding="utf-8").splitlines()
        ids = brief_markers(lines)
        if not ids:
            skipped += 1
            continue
        linted.append(f"{shown} ({', '.join(ids)})")
        headings = [line.casefold() for line in lines if re.match(r"^\s{0,3}#{1,6}\s+\S", line)]
        missing = [h for h in BRIEF_HEADINGS if not any(h.casefold() in line for line in headings)]
        if missing:
            failures.append(
                Failure(shown, "headings", "carries `ability: " + ids[0] + "` but lacks the heading(s): " + ", ".join(missing))
            )
        for ident in ids:
            record = root / "docs" / "chains" / f"{ident}.yaml"
            rel = f"docs/chains/{ident}.yaml"
            if not record.is_file():
                failures.append(Failure(shown, "record", f"carries `ability: {ident}` but {rel} does not exist"))
                continue
            record_failures, _, _ = check_file(record, resolver, tools, root)
            if record_failures:
                failures.append(
                    Failure(shown, "record", f"carries `ability: {ident}` but {rel} fails the checker ({len(record_failures)} failure(s), listed above)")
                )
    notes = [f"briefs: {len(linted)} linted (carry an ability marker), {skipped} skipped (no ability marker)"]
    notes += [f"  linted {entry}" for entry in linted]
    return failures, notes


# --------------------------------------------------------------------------------------
# command line
# --------------------------------------------------------------------------------------


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Check the chain records in docs/chains/ (FABLE.md section 3).")
    parser.add_argument("--root", type=Path, default=ROOT, help="the tree to read (default: this repository)")
    parser.add_argument("--lint-briefs", action="store_true", help="also lint docs/prompts/runs/*/briefs/*.md")
    parser.add_argument("--tools", action="store_true", help="print the tool vocabulary and exit")
    args = parser.parse_args(argv)
    root = args.root

    tools, sheet_problems = vocabulary(root)
    if args.tools:
        print(f"{len(tools)} tool names (MODE-SHEET.md section headings, and the tools FABLE.md's tool field names)")
        for key in sorted(tools):
            print(f"  {tools[key]}")
        for problem in sheet_problems:
            print(problem.line())
        return 1 if sheet_problems else 0

    failures: list[Failure] = list(sheet_problems)
    unresolved: list[Unresolved] = []
    notes: list[str] = []
    resolver = Resolver(root)
    failures += [Failure(path, "authored id", message) for path, message in resolver.authored_problems]
    paths = sorted(root.glob(CHAINS_GLOB))
    statuses: list[str] = []
    for path in paths:
        got_failures, got_unresolved, status = check_file(path, resolver, tools, root)
        failures += got_failures
        unresolved += got_unresolved
        statuses.append(f"{path.stem} ({status})")
    if args.lint_briefs:
        got_failures, notes = lint_briefs(root, resolver, tools)
        failures += got_failures
        failures += [
            Failure(path, "owner work", message)
            for path, message in owner_work.problems(root)
        ]
        failures += [
            Failure(path, "clause map", message)
            for path, message in clause_map.problems(root)
        ]
        review_problems, open_requirements = review_closure_guard.scan(root)
        failures += [
            Failure(path, "review closure", message)
            for path, message in review_problems
        ]
        notes += [f"review closure: {len(open_requirements)} open requirement(s)"]
        notes += [f"  OPEN {req.ident} from {req.source}: {req.text}" for req in open_requirements]

    for failure in failures:
        print(failure.line())
    for item in unresolved:
        print(item.line())
    for note in notes:
        print(note)
    summary = f"{len(paths)} chain record(s): {', '.join(statuses) or 'none'}; {len(failures)} failure(s), {len(unresolved)} unresolved ref(s) in drafts"
    if args.lint_briefs:
        summary += "; " + notes[0].replace("briefs: ", "briefs ", 1)
    print(summary)
    print(SCAFFOLD_NOTE)
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
