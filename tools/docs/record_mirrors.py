"""The record generates its mirrors (T58): the task index's live table and `in-flight.md`'s lane lines.

Until T58 each verdict was hand-appended to the same status in the backlog, the task index, the
in-flight line, the brief and `current.md`. The reviewer approved generating the mechanical
navigation surfaces from the human-edited truth (`docs/review/responses/questions-70656183.md`,
proposal 2; the scope guard in `questions-bd7d303e.md`). The truth for a lane's status is now the
`## Record` block at the end of its brief; this script regenerates the two mirrors from those blocks,
the entries (`docs/pending-review.md`, `docs/prompts/entry-*.md`, `docs/prompts/runs/*/ENTRY.md`),
the backlog's row ids and the response and handoff files, and never writes any of those sources.

A block (one or more under the brief's `## Record` heading, each opening with its header):

    lane: <id> · closes: <row ids, or —> · entry: <N, or —>[ · role: history|scoping|handoff][ · aliases: <a>, <b>]
    index: <the index row's cells after the lane, verbatim, pipes included>
    in-flight: <the in-flight line's text after `- **<lane>** — `, verbatim>
    in-flight [<label>]: <the same, where the line's label is not the lane id (`D1 / D1a`)>
    pointer: <lane>          (this lane's in-flight status is carried on that lane's combined line)
    state: <state>[ <date>]: <words>     (the state the migrated text states, set once; or)
    state: question: <words>             (the migrated text did not settle it)
    - <state> <date>: <words>            (one line per later event, appended, never rewritten)

`<state>` is one of drafted, with-reviewer, approved, dispatched, landed, verdict, closed, held,
superseded. The `index:` and `in-flight:` texts are the lane's words, written once (the migration
copied them verbatim from the hand-kept mirrors); a later event's words are appended to both after
`; ` as `<state> <date>: <words>`, citing its file. The reviewer's prose stays in the response file:
a `verdict` line carries the verdict word (`APPROVE`, `APPROVE WITH ONE REQUIRED CHANGE`, ...) and the
response it came from, and that word is checked against the file's own `## Verdict` line.

What is generated, between `<!-- record:begin ... -->` and `<!-- record:end -->` in each mirror:

* the task index: a row per block that is not scoping or handoff and has an `index:` text, in
  entry-number order and then by id for lanes with no entry, and a comment listing each row's lane,
  state and entry (what the round trip reads back);
* in-flight: a line per live block whose state is not closed or superseded, in the same order.

A `role: history` block is outside the live-state contract (the reviewer's scope guard): a lane
whose state the migrated text did not settle without interpretation, or a pre-T41 brief listed in the
authored tables above the region. Its index text is still rendered, verbatim; it is never listed as
in flight, and no state check reads it. Prose outside the markers stays authored.

A run fails, writing nothing, on each of these, named with the file and line: `duplicate-lane`,
`brief-without-record`, `missing-backlog-row`, `missing-entry`, `missing-file`,
`entry-without-brief`, `entry-copies-disagree`, `stale-record`, `verdict-mismatch`,
`hand-line-outside-region`, `unparsed-record`, and the contradictions the structured parts can
show: `entry-lane-mismatch`, `entry-unrecorded`, `entry-claimed-twice`, `pointer-target-missing`,
`auxiliary-without-owner`, `history-with-state`, `open-lane-without-text`, `missing-index-text`,
`state-cites-unrendered`, `missing-markers`. Prose is never judged: a response's verdict is read only
from its own `## Verdict` line (or its `**Verdict: X**` line), never from a multi-lane file's prose.

    python tools/docs/record_mirrors.py            # regenerate both mirrors
    python tools/docs/record_mirrors.py --check    # write nothing; exit 1 naming each stale mirror
    python tools/docs/record_mirrors.py --migrate  # move hand-kept mirror text into the blocks, then regenerate

`--migrate` is the one-time move, rerun on a landing tree whose mirrors were hand-edited meanwhile:
a hand-kept row or line whose lane has no text in its block is copied into the block verbatim; one
that begins with the block's text replaces it (an extension, nothing lost; its state line is
reported for review); any other difference is refused, never overwritten. It decides no role, no
state and no `closes:` (the matrix's ids are their own namespace: task T41 is not row T41): a block it
creates says `closes: —` and `state: question`, and a brief no mirror text names is refused.
`tools/content/tests/test_record_mirrors.py` holds the committed mirrors to `render()` on every push
(docs-integrity.yml) and in the full run's content tests.
"""
from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parent))

import split_prompt_views as views  # noqa: E402

TASKS = "docs/prompts/tasks"
INDEX = "docs/prompts/tasks/README.md"
INFLIGHT = "docs/prompts/in-flight.md"
PENDING = "docs/pending-review.md"
PROMPTS = "docs/prompts"
RUNS = "docs/prompts/runs"
RESPONSES = "docs/review/responses"
HANDOFFS = "docs/review/handoffs"
BACKLOG = "docs/prompts/backlog-2026-09-25.md"
MIRRORS = (INDEX, INFLIGHT)

STATES = ("drafted", "with-reviewer", "approved", "dispatched", "landed", "verdict", "closed", "held", "superseded")
EARLY = frozenset({"drafted", "with-reviewer", "approved", "dispatched"})
LANDED_OR_LATER = frozenset({"landed", "verdict", "closed"})
SHUT = frozenset({"closed", "superseded"})
ROLES = ("history", "scoping", "handoff")
AUXILIARY = frozenset({"scoping", "handoff"})

BEGIN = ("<!-- record:begin (generated by tools/docs/record_mirrors.py from the `## Record` block at the end "
         "of each brief; edit a block, never these lines) -->")
END = "<!-- record:end -->"
INDEX_HEAD = ("| | Task | Kind | Runs |", "|---|---|---|---|")
LANES_OPEN = "<!-- record:lanes (generated; one line per row above: lane · state · entry)"
LANES_CLOSE = "-->"
LEGACY_ANCHOR = "### Between C0 and C (T41)"  # --migrate only: where the hand-kept live table stood

ROW = re.compile(r"^\| \*\*(?P<label>.+?)\*\* \|(?P<raw>.*)$")
LINE = re.compile(r"^- \*\*(?P<label>.+?)\*\* — (?P<text>.*)$")
ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9+.\-]*$")
DATE = r"\d{4}-\d{2}-\d{2}"
EVENT = re.compile(rf"^- (?P<state>[a-z-]+) (?P<date>{DATE}): (?P<words>\S.*)$")
STATE = re.compile(rf"^state: (?:question: (?P<question>\S.*)|(?P<state>[a-z-]+)(?: (?P<date>{DATE}))?: (?P<words>\S.*))$")
INFLIGHT_TEXT = re.compile(r"^in-flight(?: \[(?P<label>[^\]]+)\])?: (?P<text>.*)$")
SUFFIX = re.compile(rf"(?:^|; )(?P<state>{'|'.join(STATES)}) (?P<date>{DATE}): ")
ENTRY_HEAD = re.compile(r"^### Entry (?P<n>\d+) — (?P<rest>.*)$")
CITED = re.compile(r"`((?:responses|handoffs|tasks)/[^`\s]+?\.md)`")
VERDICT_WORD = re.compile(r"\b(?:APPROVE|ACCEPT|REVISE|REJECT|HOLD)\b(?: [A-Z][A-Z/-]*\b)*")


def order(paths: list[str]) -> list[str]:
    """The order sources are read in. Sorted; the determinism test patches it with a shuffle."""
    return sorted(paths)


@dataclass(frozen=True)
class Failure:
    reason: str
    where: str
    line: int
    message: str

    def __str__(self) -> str:
        return f"{self.reason}: {self.where}:{self.line}: {self.message}"


class RecordError(Exception):
    def __init__(self, failures: list[Failure]) -> None:
        self.failures = sorted(set(failures), key=lambda f: (f.where, f.line, f.reason, f.message))
        super().__init__("\n".join(str(f) for f in self.failures))


class Tree:
    """The repository as the generator reads it: files on disk under `root`, or texts overriding them."""

    def __init__(self, root: Path = ROOT, overrides: dict[str, str] | None = None) -> None:
        self.root = Path(root)
        self.overrides = dict(overrides or {})

    def read(self, rel: str) -> str | None:
        if rel in self.overrides:
            return self.overrides[rel]
        path = self.root / rel
        return path.read_text(encoding="utf-8") if path.is_file() else None

    def exists(self, rel: str) -> bool:
        return rel in self.overrides or (self.root / rel).is_file()

    def glob(self, rel_dir: str, pattern: str) -> list[str]:
        base = self.root / rel_dir
        found = {p.relative_to(self.root).as_posix() for p in base.glob(pattern) if p.is_file()} if base.is_dir() else set()
        prefix = rel_dir.rstrip("/") + "/"
        rx = re.compile("^" + re.escape(prefix) + re.escape(pattern).replace(r"\*", "[^/]*") + "$")
        found |= {rel for rel in self.overrides if rx.match(rel)}
        return order(list(found))


@dataclass
class Event:
    state: str
    date: str
    words: str
    line: int

    @property
    def text(self) -> str:
        return f"{self.state} {self.date}: {self.words}"


@dataclass
class Block:
    lane: str
    closes: list[str]
    entry: int | None
    role: str | None
    aliases: list[str]
    file: str
    line: int
    index: str | None = None
    index_line: int = 0
    inflight: str | None = None
    inflight_label: str | None = None
    inflight_line: int = 0
    pointer: str | None = None
    pointer_line: int = 0
    state: str | None = None  # the migrated state: a state name, or "question"
    state_date: str | None = None
    state_words: str = ""
    state_line: int = 0
    events: list[Event] = field(default_factory=list)

    @property
    def names(self) -> list[str]:
        return [self.lane] + self.aliases

    @property
    def owner(self) -> bool:
        return self.role not in AUXILIARY

    @property
    def live(self) -> bool:
        return self.role is None

    @property
    def current(self) -> str:
        if self.events:
            return self.events[-1].state
        if self.role == "history":
            return "history"
        return self.state or "question"

    @property
    def open(self) -> bool:
        return self.live and self.current not in SHUT

    def header(self) -> str:
        parts = [f"lane: {self.lane}", f"closes: {', '.join(self.closes) or '—'}",
                 f"entry: {self.entry if self.entry is not None else '—'}"]
        if self.role:
            parts.append(f"role: {self.role}")
        if self.aliases:
            parts.append(f"aliases: {', '.join(self.aliases)}")
        return " · ".join(parts)


@dataclass
class Entry:
    n: int
    token: str
    source: str  # "pending", "copy" or "run"
    file: str
    line: int


@dataclass
class Sources:
    tree: Tree
    blocks: list[Block]
    briefs: dict[str, list[str]]  # brief path -> its lines
    record_at: dict[str, int]  # brief path -> 0-based index of its `## Record` line (absent: none)
    entries: dict[int, list[Entry]]
    matrix: set[str]
    failures: list[Failure]


# ---------------------------------------------------------------------------------------------
# Reading the sources


def lines_of(text: str) -> list[str]:
    return text.replace("\r\n", "\n").split("\n")


def parse_header(text: str, path: str, lineno: int, failures: list[Failure]) -> Block | None:
    parts = text.split(" · ")
    fields: dict[str, str] = {}
    keys = []
    for part in parts:
        key, sep, value = part.partition(": ")
        if not sep or key in fields:
            failures.append(Failure("unparsed-record", path, lineno, f"header field {part!r}: expected `key: value`, each key once"))
            return None
        fields[key] = value
        keys.append(key)
    if keys[:3] != ["lane", "closes", "entry"] or any(k not in ("role", "aliases") for k in keys[3:]):
        failures.append(Failure("unparsed-record", path, lineno, "the header is `lane: · closes: · entry:` then optionally `role:` and `aliases:`"))
        return None
    lane = fields["lane"]
    if not ID.match(lane):
        failures.append(Failure("unparsed-record", path, lineno, f"lane id {lane!r} is not an id"))
        return None
    closes = [] if fields["closes"] == "—" else fields["closes"].split(", ")
    if any(not ID.match(c) for c in closes):
        failures.append(Failure("unparsed-record", path, lineno, f"closes {fields['closes']!r}: row ids separated by ', ', or —"))
        return None
    entry: int | None = None
    if fields["entry"] != "—":
        if not fields["entry"].isdigit():
            failures.append(Failure("unparsed-record", path, lineno, f"entry {fields['entry']!r}: a number, or —"))
            return None
        entry = int(fields["entry"])
    role = fields.get("role")
    if role is not None and role not in ROLES:
        failures.append(Failure("unparsed-record", path, lineno, f"role {role!r}: one of {', '.join(ROLES)}"))
        return None
    aliases = fields["aliases"].split(", ") if "aliases" in fields else []
    return Block(lane, closes, entry, role, aliases, path, lineno)


def parse_brief(path: str, lines: list[str], failures: list[Failure]) -> tuple[list[Block], int | None]:
    marks = [i for i, line in enumerate(lines) if line == "## Record"]
    if not marks:
        failures.append(Failure("brief-without-record", path, 1, "no `## Record` block at the brief's end"))
        return [], None
    if len(marks) > 1:
        failures.append(Failure("unparsed-record", path, marks[1] + 1, "a second `## Record` heading"))
        return [], marks[0]
    blocks: list[Block] = []
    current: Block | None = None
    for i in range(marks[0] + 1, len(lines)):
        line, lineno = lines[i], i + 1
        if not line.strip():
            continue
        if line.startswith("lane: "):
            current = parse_header(line, path, lineno, failures)
            if current is not None:
                blocks.append(current)
            continue
        if current is None:
            failures.append(Failure("unparsed-record", path, lineno, "a record line before any `lane:` header"))
            continue
        m_in = INFLIGHT_TEXT.match(line)
        if line.startswith("index:"):
            if current.index is not None:
                failures.append(Failure("unparsed-record", path, lineno, f"{current.lane}: a second `index:` line"))
            current.index, current.index_line = line[len("index:"):], lineno
        elif m_in:
            if current.inflight is not None:
                failures.append(Failure("unparsed-record", path, lineno, f"{current.lane}: a second `in-flight:` line"))
            current.inflight, current.inflight_label, current.inflight_line = m_in.group("text"), m_in.group("label"), lineno
        elif line.startswith("pointer: "):
            current.pointer, current.pointer_line = line[len("pointer: "):], lineno
        elif line.startswith("state: "):
            m = STATE.match(line)
            if not m or (m.group("state") and m.group("state") not in STATES):
                failures.append(Failure("unparsed-record", path, lineno, f"{current.lane}: `state: <state>[ <date>]: <words>` or `state: question: <words>`, state one of {', '.join(STATES)}"))
            elif current.state is not None:
                failures.append(Failure("unparsed-record", path, lineno, f"{current.lane}: a second `state:` line (a later state is an event line)"))
            else:
                if m.group("question"):
                    current.state, current.state_words = "question", m.group("question")
                else:
                    current.state, current.state_date, current.state_words = m.group("state"), m.group("date"), m.group("words")
                current.state_line = lineno
        elif line.startswith("- "):
            m = EVENT.match(line)
            if not m or m.group("state") not in STATES:
                failures.append(Failure("unparsed-record", path, lineno, f"{current.lane}: an event is `- <state> <date>: <words>`, state one of {', '.join(STATES)}"))
            else:
                current.events.append(Event(m.group("state"), m.group("date"), m.group("words"), lineno))
        else:
            failures.append(Failure("unparsed-record", path, lineno, f"{current.lane}: not a record line: {line[:60]!r}"))
    if not blocks:
        failures.append(Failure("brief-without-record", path, marks[0] + 1, "the `## Record` heading holds no block"))
    return blocks, marks[0]


def entry_token(rest: str) -> str:
    return re.match(r"^(.+?)(?:: | — |$)", rest).group(1)


def read_entries(tree: Tree, failures: list[Failure]) -> dict[int, list[Entry]]:
    entries: dict[int, list[Entry]] = {}
    text = tree.read(PENDING)
    if text is not None:
        for i, line in enumerate(lines_of(text)):
            m = ENTRY_HEAD.match(line)
            if m:
                entries.setdefault(int(m.group("n")), []).append(Entry(int(m.group("n")), entry_token(m.group("rest")), "pending", PENDING, i + 1))
    for n, found in entries.items():
        if len(found) > 1:
            failures.append(Failure("duplicate-lane", PENDING, found[1].line, f"two entries numbered {n} (lines {', '.join(str(e.line) for e in found)})"))
    copies = [(rel, "copy") for rel in tree.glob(PROMPTS, "entry-*.md")] + [(rel, "run") for rel in tree.glob(RUNS, "*/ENTRY.md")]
    for rel, source in copies:
        body = lines_of(tree.read(rel) or "")
        head = next(((i, ENTRY_HEAD.match(l)) for i, l in enumerate(body) if ENTRY_HEAD.match(l)), None)
        if head is None:
            failures.append(Failure("entry-copies-disagree", rel, 1, "an entry copy with no `### Entry N — ` heading"))
            continue
        i, m = head
        n = int(m.group("n"))
        if source == "copy":
            named = re.match(r"^entry-(\d+)\.md$", rel.rsplit("/", 1)[-1])
            if named and int(named.group(1)) != n:
                failures.append(Failure("entry-copies-disagree", rel, i + 1, f"the file is numbered {named.group(1)} and its heading {n}"))
        entries.setdefault(n, []).append(Entry(n, entry_token(m.group("rest")), source, rel, i + 1))
    for n, found in entries.items():
        tokens = sorted({e.token for e in found})
        if len(tokens) > 1:
            where = found[-1]
            failures.append(Failure("entry-copies-disagree", where.file, where.line,
                                    f"Entry {n} names {' / '.join(repr(t) for t in tokens)} across {', '.join(sorted({e.file for e in found}))}"))
    return entries


def backlog_ids(tree: Tree) -> set[str]:
    """The matrix's row ids, read by the views' one matrix reader (`split_prompt_views.split_backlog`)."""
    saved = views.BACKLOG
    views.BACKLOG = tree.root / BACKLOG
    try:
        _, rows = views.split_backlog()
    finally:
        views.BACKLOG = saved
    return {line.split(" | ", 1)[0].lstrip("| ").strip() for lines in rows.values() for line in lines}


def load(tree: Tree) -> Sources:
    failures: list[Failure] = []
    blocks: list[Block] = []
    briefs: dict[str, list[str]] = {}
    record_at: dict[str, int] = {}
    for rel in tree.glob(TASKS, "*.md"):
        if rel == INDEX:
            continue
        lines = lines_of(tree.read(rel) or "")
        briefs[rel] = lines
        found, at = parse_brief(rel, lines, failures)
        blocks += found
        if at is not None:
            record_at[rel] = at
    entries = read_entries(tree, failures)
    return Sources(tree, blocks, briefs, record_at, entries, backlog_ids(tree), failures)


# ---------------------------------------------------------------------------------------------
# The contract


def structural_verdict(text: str) -> str | None:
    """A response's own verdict word: its one `## Verdict` section's first line, or its `**Verdict: X**` line.

    A file with several verdict sections (a `questions-*.md` answering several lanes) has none: its
    prose is never searched (the reviewer's scope guard).
    """
    lines = lines_of(text)
    heads = [i for i, line in enumerate(lines) if line.strip() == "## Verdict"]
    inline = [line for line in lines if re.match(r"^\*\*Verdict: ", line)]
    if len(heads) + len(inline) != 1:
        return None
    if heads:
        first = next((line for line in lines[heads[0] + 1:] if line.strip()), "")
    else:
        first = inline[0].replace("Verdict: ", "", 1)
    m = VERDICT_WORD.match(first.strip().strip("*").strip())
    return m.group(0) if m else None


def cited(text: str) -> list[str]:
    return CITED.findall(text)


def file_for(citation: str) -> str:
    return (PROMPTS + "/" + citation) if citation.startswith("tasks/") else ("docs/review/" + citation)


def validate(src: Sources) -> list[Failure]:
    failures = list(src.failures)
    blocks = src.blocks
    owners: dict[str, Block] = {}
    for b in blocks:
        if not b.owner:
            continue
        for name in b.names:
            if name in owners:
                other = owners[name]
                failures.append(Failure("duplicate-lane", b.file, b.line, f"{name!r} is declared again (first at {other.file}:{other.line})"))
            else:
                owners[name] = b
    claimed: dict[int, Block] = {}
    for b in blocks:
        if b.entry is None or not b.owner:
            continue
        if b.entry in claimed:
            other = claimed[b.entry]
            failures.append(Failure("entry-claimed-twice", b.file, b.line, f"Entry {b.entry} is also {other.lane}'s ({other.file}:{other.line})"))
        else:
            claimed[b.entry] = b
    for b in blocks:
        for row in b.closes:
            if row not in src.matrix:
                failures.append(Failure("missing-backlog-row", b.file, b.line, f"{b.lane} closes {row}, which is no row of the matrix"))
        if not b.owner:
            if b.lane not in owners:
                failures.append(Failure("auxiliary-without-owner", b.file, b.line, f"a {b.role} block for {b.lane}, which no brief's record declares"))
            if b.index is not None or b.inflight is not None or b.state is not None or b.events or b.pointer:
                failures.append(Failure("unparsed-record", b.file, b.line, f"a {b.role} block is a header only"))
            continue
        if b.role == "history" and (b.state is not None or b.events):
            failures.append(Failure("history-with-state", b.file, b.state_line or b.events[0].line,
                                    f"{b.lane} is history (outside the live-state contract) and carries a state; drop the role or the state"))
        for text, lineno in ((b.index, b.index_line), (b.inflight, b.inflight_line)):
            if text is not None and SUFFIX.search(text):
                failures.append(Failure("unparsed-record", b.file, lineno, f"{b.lane}: the text holds an event-shaped `<state> <date>: ` segment, which the round trip would misread"))
        if b.live and b.index is None:
            failures.append(Failure("missing-index-text", b.file, b.line, f"{b.lane} has no `index:` cells for its row"))
        if b.index is not None and not re.match(r"^ [^ |]", b.index):
            failures.append(Failure("unparsed-record", b.file, b.index_line, f"{b.lane}: `index:` holds the row's cells after the lane, ` <task> | <kind> | <runs> |`"))
        if b.open and b.inflight is None and not b.events:
            failures.append(Failure("open-lane-without-text", b.file, b.line, f"{b.lane} is {b.current}, so in flight, and has no in-flight text or event to list"))
        if b.pointer is not None:
            target = owners.get(b.pointer)
            parts = (target.inflight_label or "").split(" / ") if target else []
            if target is None or b.lane not in parts[1:]:
                failures.append(Failure("pointer-target-missing", b.file, b.pointer_line, f"{b.lane} points at {b.pointer}'s combined in-flight line, which does not name it"))
        # References: every cited brief, response or handoff exists (a history lane's migrated prose excepted).
        texts = [(b.state_words, b.state_line)] + [(e.words, e.line) for e in b.events]
        if b.live:
            texts += [(b.index or "", b.index_line), (b.inflight or "", b.inflight_line)]
        for text, lineno in texts:
            for c in cited(text):
                if not src.tree.exists(file_for(c)):
                    failures.append(Failure("missing-file", b.file, lineno, f"{b.lane} cites `{c}`, which is not in the tree"))
        # A verdict word on a state or event line agrees with the cited response's own verdict line.
        for words, lineno, state in [(b.state_words, b.state_line, b.state)] + [(e.words, e.line, e.state) for e in b.events]:
            word = VERDICT_WORD.search(words)
            responses = [c for c in cited(words) if c.startswith("responses/")]
            if state == "verdict" and lineno != b.state_line and (not word or not responses):
                failures.append(Failure("unparsed-record", b.file, lineno, f"{b.lane}: a verdict line carries the verdict word and the response it came from"))
            if word and responses and src.tree.exists(file_for(responses[0])):
                theirs = structural_verdict(src.tree.read(file_for(responses[0])) or "")
                if theirs is not None and theirs != word.group(0):
                    failures.append(Failure("verdict-mismatch", b.file, lineno, f"{b.lane} records {word.group(0)!r}; `{responses[0]}` says {theirs!r}"))
        if b.live and b.state is not None:
            said = (b.index or "") + (b.inflight or "")
            for c in cited(b.state_words):
                if c not in said and f"`{c.rsplit('/', 1)[-1]}`" not in said:
                    failures.append(Failure("state-cites-unrendered", b.file, b.state_line, f"{b.lane}'s state cites `{c}`, which its generated row and line would not carry"))
    # Entries.
    by_name = {name: b for name, b in owners.items()}
    declared = [b.entry for b in blocks if b.entry is not None and b.owner]
    start = min(declared) if declared else None
    for b in blocks:
        if b.entry is None or not b.owner:
            continue
        found = src.entries.get(b.entry, [])
        if found and not any(e.token in b.names for e in found):
            failures.append(Failure("entry-lane-mismatch", b.file, b.line, f"{b.lane} declares Entry {b.entry}, whose heading names {found[0].token!r} ({found[0].file}:{found[0].line})"))
        if b.live and not found and b.current in LANDED_OR_LATER:
            failures.append(Failure("missing-entry", b.file, b.line, f"{b.lane} is {b.current} and declares Entry {b.entry}, which no entry holds"))
    for n in sorted(src.entries):
        if start is None or n < start:
            continue  # the first entries, before any record block declares one, are history: not linked
        e = src.entries[n][0]
        b = by_name.get(e.token)
        if b is None:
            failures.append(Failure("entry-without-brief", e.file, e.line, f"Entry {n} names {e.token!r}, which no record block declares"))
        elif b.entry != n:
            failures.append(Failure("entry-unrecorded", b.file, b.line, f"Entry {n} ({e.file}:{e.line}) names {b.lane}, whose record declares entry {b.entry if b.entry is not None else '—'}"))
        elif b.live and b.current in EARLY:
            failures.append(Failure("stale-record", b.file, (b.events[-1].line if b.events else b.state_line or b.line),
                                    f"{b.lane}'s record ends at {b.current}, and Entry {n} ({e.file}:{e.line}) shows it landed"))
    return failures


# ---------------------------------------------------------------------------------------------
# Rendering


def ordered(blocks: list[Block]) -> list[Block]:
    return sorted(blocks, key=lambda b: (0, b.entry, b.lane) if b.entry is not None else (1, 0, b.lane))


def row_text(b: Block) -> str:
    raw = b.index or ""
    add = "".join(f"; {e.text}" for e in b.events)
    if add:
        raw = (raw[:-2] + add + " |") if raw.endswith(" |") else raw + add
    return f"| **{b.lane}** |{raw}"


def line_text(b: Block) -> str:
    events = [e.text for e in b.events]
    body = (b.inflight + "".join(f"; {e}" for e in events)) if b.inflight is not None else "; ".join(events)
    return f"- **{b.inflight_label or b.lane}** — {body}"


def index_region(blocks: list[Block]) -> list[str]:
    rows = [b for b in ordered(blocks) if b.owner and b.index is not None]
    out = [BEGIN, "", *INDEX_HEAD, *(row_text(b) for b in rows), "", LANES_OPEN]
    out += [f"{b.lane} · {b.current} · {b.entry if b.entry is not None else '—'}" for b in rows]
    return out + [LANES_CLOSE, END]


def inflight_region(blocks: list[Block]) -> list[str]:
    lines = [line_text(b) for b in ordered(blocks) if b.open]
    return [BEGIN, "", *lines, "", END]


def region_span(lines: list[str], rel: str, failures: list[Failure]) -> tuple[int, int] | None:
    begins = [i for i, line in enumerate(lines) if line.startswith("<!-- record:begin")]
    ends = [i for i, line in enumerate(lines) if line == END]
    if len(begins) != 1 or len(ends) != 1 or ends[0] < begins[0]:
        failures.append(Failure("missing-markers", rel, (begins or ends or [0])[0] + 1,
                                "a mirror holds one `<!-- record:begin` line and one `<!-- record:end -->` after it (run --migrate on a hand-kept mirror)"))
        return None
    return begins[0], ends[0]


def outside_lines(src: Sources, rel: str, lines: list[str], span: tuple[int, int], failures: list[Failure]) -> None:
    history = {name for b in src.blocks if b.role == "history" for name in b.names}
    for i, line in enumerate(lines):
        if span[0] <= i <= span[1]:
            continue
        m = ROW.match(line) or LINE.match(line)
        if m and m.group("label") not in history:
            failures.append(Failure("hand-line-outside-region", rel, i + 1,
                                    f"a lane {'row' if line.startswith('|') else 'line'} for {m.group('label')!r} outside the generated region; its words belong in the lane's `## Record` block"))


def render_tree(tree: Tree) -> dict[str, str]:
    src = load(tree)
    failures = validate(src)
    out: dict[str, str] = {}
    for rel, region in ((INDEX, index_region(src.blocks)), (INFLIGHT, inflight_region(src.blocks))):
        text = tree.read(rel)
        if text is None:
            failures.append(Failure("missing-file", rel, 1, "the mirror is not in the tree"))
            continue
        lines = lines_of(text)
        span = region_span(lines, rel, failures)
        if span is None:
            continue
        outside_lines(src, rel, lines, span, failures)
        out[rel] = "\n".join(lines[:span[0]] + region + lines[span[1] + 1:])
    if failures:
        raise RecordError(failures)
    return out


def render(root: Path = ROOT) -> dict[str, str]:
    """Both mirrors as {repository path: text}, from the sources alone; raises `RecordError` on a failure."""
    return render_tree(Tree(root))


def on_disk(root: Path = ROOT) -> dict[str, str]:
    tree = Tree(root)
    return {rel: "\n".join(lines_of(tree.read(rel) or "")) for rel in MIRRORS if tree.exists(rel)}


def stale(root: Path = ROOT) -> list[str]:
    expected, actual = render(root), on_disk(root)
    return sorted(rel for rel in set(expected) | set(actual) if expected.get(rel) != actual.get(rel))


def write(root: Path, files: dict[str, str]) -> list[str]:
    changed = []
    for rel, text in sorted(files.items()):
        path = Path(root) / rel
        old = "\n".join(lines_of(path.read_text(encoding="utf-8"))) if path.is_file() else None
        if old != text:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(text, encoding="utf-8", newline="\n")
            changed.append(rel)
    return changed


# ---------------------------------------------------------------------------------------------
# The round trip: the generated mirrors read back


def parse_generated(files: dict[str, str]) -> dict[str, dict]:
    """Each generated lane as {lane: {state, entry, row, line, events, cites}} from the mirrors alone."""
    lanes: dict[str, dict] = {}
    index = lines_of(files[INDEX])
    begin = next(i for i, line in enumerate(index) if line.startswith("<!-- record:begin"))
    end = index.index(END, begin)
    region = index[begin:end]
    at = region.index(LANES_OPEN)
    for line in region[at + 1:]:
        if line == LANES_CLOSE:
            break
        lane, state, entry = line.split(" · ")
        lanes[lane] = {"state": state, "entry": None if entry == "—" else int(entry), "row": None, "line": None}
    for line in region[:at]:
        m = ROW.match(line)
        if m:
            lanes[m.group("label")]["row"] = m.group("raw")
    inflight = lines_of(files[INFLIGHT])
    begin = next(i for i, line in enumerate(inflight) if line.startswith("<!-- record:begin"))
    for line in inflight[begin:inflight.index(END, begin)]:
        m = LINE.match(line)
        if m:
            lanes.setdefault(m.group("label").split(" / ")[0], {"state": None, "entry": None, "row": None})["line"] = m.group("text")
    def events(text: str) -> list[tuple[str, str, str]]:
        marks = list(SUFFIX.finditer(text))
        return [(m.group("state"), m.group("date"), text[m.end():marks[i + 1].start()] if i + 1 < len(marks) else text[m.end():])
                for i, m in enumerate(marks)]

    for lane in lanes.values():
        row = lane["row"] or ""
        lane["events"] = events(row[:-2] if row.endswith(" |") else row)
        lane["line_events"] = events(lane["line"]) if lane["line"] is not None else None
        lane["cites"] = sorted(set(cited(row + (lane["line"] or ""))))
    return lanes


# ---------------------------------------------------------------------------------------------
# The migration


@dataclass
class Plan:
    edits: dict[str, list[str]]  # brief path -> its new lines
    moved: list[str] = field(default_factory=list)
    extended: list[str] = field(default_factory=list)
    created: list[str] = field(default_factory=list)
    mirrors: dict[str, str] = field(default_factory=dict)


def heading_id(lines: list[str]) -> str:
    first = next((line for line in lines if line.startswith("# ")), "")
    m = re.match(r"^# (.+?) — ", first)
    return m.group(1) if m else first[2:].strip()


def legacy_index(lines: list[str]) -> tuple[int, int] | None:
    """The hand-kept live table's span [first, last] (its header and rows) below the anchor heading."""
    anchor = next((i for i, line in enumerate(lines) if line.startswith(LEGACY_ANCHOR)), None)
    if anchor is None:
        return None
    first = next((i for i in range(anchor + 1, len(lines)) if lines[i].startswith("|")), None)
    if first is None:
        return None
    last = first
    while last + 1 < len(lines) and lines[last + 1].startswith("|"):
        last += 1
    return first, last


def migrate(root: Path = ROOT) -> Plan:
    """Move hand-kept mirror text into the blocks and regenerate; raises `RecordError`, writing nothing, on a refusal."""
    tree = Tree(root)
    src = load(tree)
    failures = [f for f in src.failures if f.reason != "brief-without-record"]
    briefs = {rel: list(lines) for rel, lines in src.briefs.items()}
    blocks = list(src.blocks)
    plan = Plan(edits={})
    owners: dict[str, Block] = {}
    for b in blocks:
        if b.owner:
            for name in b.names:
                owners.setdefault(name, b)
    items: list[tuple[str, str, str, str, int]] = []  # (label, kind, text, mirror, line)
    mirror_lines: dict[str, list[str]] = {}
    drop: dict[str, set[int]] = {INDEX: set(), INFLIGHT: set()}
    history = {name for b in blocks if b.role == "history" for name in b.names}
    for rel in MIRRORS:
        lines = lines_of(tree.read(rel) or "")
        mirror_lines[rel] = lines
        begins = [i for i, line in enumerate(lines) if line.startswith("<!-- record:begin")]
        ends = [i for i, line in enumerate(lines) if line == END]
        span = (begins[0], ends[0]) if begins and ends else None
        legacy = legacy_index(lines) if (rel == INDEX and span is None) else None
        for i, line in enumerate(lines):
            if span and span[0] <= i <= span[1]:
                continue
            m = ROW.match(line) if rel == INDEX else LINE.match(line)
            if not m:
                continue
            if rel == INDEX and span is None and not (legacy and legacy[0] <= i <= legacy[1]):
                continue  # the authored tables above the hand-kept live table
            if rel == INDEX and span is not None and m.group("label") in history:
                continue
            items.append((m.group("label"), "index" if rel == INDEX else "inflight",
                          m.group("raw") if rel == INDEX else m.group("text"), rel, i + 1))
            drop[rel].add(i)
    texts_by_lane: dict[str, list[str]] = {}
    for label, _, text, _, _ in items:
        texts_by_lane.setdefault(label.split(" / ")[0], []).append(text)
    unclaimed = {rel for rel in briefs if rel not in src.record_at}
    heads = {rel: heading_id(lines) for rel, lines in briefs.items()}

    def find_brief(lane: str, where: str, line: int) -> str | None:
        texts = texts_by_lane.get(lane, [])
        names = {c for t in texts for c in re.findall(r"`(?:tasks/)?([^`/\s]+\.md)`", t)}
        cited_briefs = {f"{TASKS}/{n}" for n in names if f"{TASKS}/{n}" in briefs}
        for pool in ([r for r in cited_briefs if heads[r] == lane and r in unclaimed],
                     [r for r in unclaimed if heads[r] == lane],
                     [r for r in cited_briefs if r in unclaimed]):
            if len(pool) == 1:
                return pool[0]
        failures.append(Failure("unparsed-record", where, line, f"--migrate: no one brief for {lane!r} (cite its file in the text, or write its block by hand)"))
        return None

    def entry_for(lane: str) -> int | None:
        named = sorted({n for n, found in src.entries.items() if any(e.token == lane for e in found)})
        if len(named) == 1:
            return named[0]
        mentioned = sorted({int(n) for t in texts_by_lane.get(lane, []) for n in re.findall(r"\bEntry (\d+)\b", t)})
        return mentioned[0] if len(mentioned) == 1 else None

    def block_for(lane: str, where: str, line: int) -> Block | None:
        if lane in owners:
            return owners[lane]
        rel = find_brief(lane, where, line)
        if rel is None:
            return None
        # No `closes:` is inferred: the matrix's ids are their own namespace (task T41 is not row T41).
        b = Block(lane, [], entry_for(lane), None, [], rel, 0)
        b.state, b.state_words = "question", "set by the migration; the migrated text is the evidence, settle it"
        blocks.append(b)
        owners[lane] = b
        unclaimed.discard(rel)
        plan.created.append(lane)
        return b

    for label, kind, text, where, line in items:
        ids = label.split(" / ")
        b = block_for(ids[0], where, line)
        if b is None:
            continue
        old = b.index if kind == "index" else b.inflight
        if kind == "inflight" and len(ids) > 1:
            if b.inflight_label not in (None, label):
                failures.append(Failure("unparsed-record", where, line, f"--migrate: {ids[0]}'s combined line is labelled {b.inflight_label!r} in its block and {label!r} here"))
                continue
            b.inflight_label = label
            for other in ids[1:]:
                p = block_for(other, where, line)
                if p is not None and p.pointer not in (None, ids[0]):
                    failures.append(Failure("unparsed-record", where, line, f"--migrate: {other} already points at {p.pointer}"))
                elif p is not None and p.pointer is None:
                    p.pointer = ids[0]
                    plan.moved.append(f"{other} pointer → {ids[0]}")
        if old == text:
            continue

        def core(s: str) -> str:
            # A row is extended inside its last cell, before the closing pipe, as the record scripts append.
            return s[:-2] if kind == "index" and s.endswith(" |") else s

        if old is None:
            plan.moved.append(f"{ids[0]} {kind} ← {where}:{line}")
        elif core(text).startswith(core(old)):
            plan.extended.append(f"{ids[0]} {kind} ← {where}:{line} (state line reads {b.current}: review it)")
        else:
            at = next((k for k, (x, y) in enumerate(zip(old, text)) if x != y), min(len(old), len(text)))
            failures.append(Failure("unparsed-record", where, line, f"--migrate refused: {ids[0]}'s {kind} text differs from its block's at column {at + 1}; neither extends the other, nothing overwritten"))
            continue
        if kind == "index":
            b.index = text
        else:
            b.inflight = text
    for rel in sorted(unclaimed):
        failures.append(Failure("brief-without-record", rel, 1, "--migrate names no mirror text for this brief and decides no role: write its header by hand"))
    if failures:
        raise RecordError(failures)
    # Write each block's lines into its brief: changed lines in place, new fields after the header, new blocks appended.
    for rel in sorted({b.file for b in blocks}):
        lines = briefs[rel]
        mine = [b for b in blocks if b.file == rel]
        before = list(lines)
        inserts: list[tuple[int, list[str]]] = []
        for b in mine:
            if b.line == 0:
                continue
            fields = []
            if b.index is not None:
                if b.index_line:
                    lines[b.index_line - 1] = f"index:{b.index}"
                else:
                    fields.append(f"index:{b.index}")
            if b.inflight is not None:
                text = f"in-flight [{b.inflight_label}]: {b.inflight}" if b.inflight_label else f"in-flight: {b.inflight}"
                if b.inflight_line:
                    lines[b.inflight_line - 1] = text
                else:
                    fields.append(text)
            if b.pointer is not None and not b.pointer_line:
                fields.append(f"pointer: {b.pointer}")
            if fields:
                inserts.append((b.index_line or b.line, fields))
        for at, fields in sorted(inserts, reverse=True):
            lines[at:at] = fields
        new = [b for b in mine if b.line == 0]
        if new:
            while lines and lines[-1] == "":
                lines.pop()
            if rel not in src.record_at:
                lines += ["", "## Record"]
            for b in new:
                lines += ["", b.header()]
                if b.index is not None:
                    lines.append(f"index:{b.index}")
                if b.inflight is not None:
                    lines.append(f"in-flight [{b.inflight_label}]: {b.inflight}" if b.inflight_label else f"in-flight: {b.inflight}")
                if b.pointer is not None:
                    lines.append(f"pointer: {b.pointer}")
                lines.append(f"state: question: {b.state_words}")
            lines.append("")
        if lines != before:
            plan.edits[rel] = lines
    # The mirrors: the hand-kept lines go, and the markers stand where the first of them stood.
    for rel in MIRRORS:
        lines = mirror_lines[rel]
        has = any(line.startswith("<!-- record:begin") for line in lines)
        if rel == INDEX and not has:
            span = legacy_index(lines)
            if span is None:
                raise RecordError([Failure("missing-markers", rel, 1, f"--migrate: no markers and no `{LEGACY_ANCHOR}` table to replace")])
            lines = lines[:span[0]] + [BEGIN, END] + lines[span[1] + 1:]
        elif rel == INFLIGHT and not has:
            dropped = sorted(drop[rel])
            if not dropped:
                raise RecordError([Failure("missing-markers", rel, 1, "--migrate: no markers and no lane line to replace")])
            first = dropped[0]
            section_end = next((i for i in range(first, len(lines)) if lines[i].startswith("## ")), len(lines))
            last = max(i for i in dropped if i < section_end)
            keep = [i for i in range(len(lines)) if not (first <= i <= last) and i not in drop[rel]]
            lines = [lines[i] for i in keep if i < first] + [BEGIN, END] + [lines[i] for i in keep if i > last]
        else:
            lines = [line for i, line in enumerate(lines) if i not in drop[rel]]
        plan.mirrors[rel] = "\n".join(lines)
    overrides = {rel: "\n".join(lines) for rel, lines in plan.edits.items()}
    overrides.update(plan.mirrors)
    plan.mirrors = render_tree(Tree(root, overrides))
    return plan


# ---------------------------------------------------------------------------------------------


def main(argv: list[str] | None = None) -> int:
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")  # a Windows console is cp1252; the record is not
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--check", action="store_true", help="write nothing; exit 1 naming each stale mirror")
    parser.add_argument("--migrate", action="store_true", help="move hand-kept mirror text into the blocks, then regenerate")
    parser.add_argument("--root", type=Path, default=ROOT, help=argparse.SUPPRESS)
    args = parser.parse_args(argv)
    try:
        if args.migrate:
            plan = migrate(args.root)
            changed = write(args.root, {rel: "\n".join(lines) for rel, lines in plan.edits.items()})
            changed += write(args.root, plan.mirrors)
            for kind, rows in (("moved", plan.moved), ("extended", plan.extended), ("created", plan.created)):
                for row in rows:
                    print(f"{kind}: {row}")
            print(f"--migrate: {len(plan.moved)} moved, {len(plan.extended)} extended, {len(plan.created)} block(s) created; "
                  f"{len(changed)} file(s) written")
            return 0
        if args.check:
            expected, actual = render(args.root), on_disk(args.root)
            bad = sorted(rel for rel in expected if expected[rel] != actual.get(rel))
            for rel in bad:
                a, e = lines_of(actual.get(rel, "")), lines_of(expected[rel])
                at = next((i for i, (x, y) in enumerate(zip(a, e)) if x != y), min(len(a), len(e)))
                print(f"stale: {rel} (first difference at line {at + 1}): a mirror is generated; edit the lane's "
                      "`## Record` block and run python tools/docs/record_mirrors.py")
            if not bad:
                print(f"record mirrors: fresh ({', '.join(MIRRORS)})")
            return 1 if bad else 0
        changed = write(args.root, render(args.root))
        print(f"record mirrors: {len(changed)} of {len(MIRRORS)} regenerated" + (f" ({', '.join(changed)})" if changed else ""))
        return 0
    except RecordError as err:
        for failure in err.failures:
            print(f"record-mirrors: {failure}", file=sys.stderr)
        print(f"record-mirrors: {len(err.failures)} failure(s); nothing written", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
