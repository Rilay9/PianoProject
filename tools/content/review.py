#!/usr/bin/env python3
"""
The human review record: what a person decided about an item, and on what it rests (D2;
R42, G28, G29, E16, Part 15 §18 and §22).

`content/review/decisions.jsonl` is the record: one JSON object per line, append-only,
never re-serialised. Every line is one event about one item, bound to the identity the
item had when the person looked at it. The fields are in `content/review/README.md`; in
short:

- **exactly one dimension per event**: `usableScore` (a usable, faithful score) or
  `goodTeachingUse` (a good teaching use for its claimed role), R42's two decisions, never
  one line for both; with the event's own `value` (`yes`, `no`, `fix`), `reason`,
  `category`, `basis`, reviewer (`by`), time (`at`) and a stable `event` id;
- **`basis`** says what the judgement rests on: `inspected` (the facts only), `notation`
  (the page read) or `heard` (the item played complete, both hands sounding, at its
  intended tempo; hand-alone or partial playback stays `notation`);
- **triage** is a line with `by: "triage"`: it flags an item with a reason and never
  counts — no bit, no `heard`, no report changes because of it.

**Current values, per item and per dimension.** A triage line never participates; an
event whose identity is not the item's current identity is stale and never participates;
among the valid human events for one item and one dimension the latest (`at`, then the
later line) is current and every earlier one is superseded. An event on one dimension
never touches the other's value or basis. `supersedes` is recorded when the screen knew
which decision it replaced, and resolution does not depend on it: time order needs no
chain repair when a line is lost, and one reviewer on one device is the expected case.

**Identity.** A generated item: its `drill.generator` (family, version, seed) and its
recipe (`drill.params` with the hands, and the tempo) — G21's identity, because the seed
is `null` on every deterministic family, so the triple alone names 63 identities for
1,176 items; a family whose version moves, or an item whose recipe changes, makes every
earlier event on it stale. A notated item: the sha256 of the built score file, E0's cache
key (`build.attach_demands`). An item with no file (a runtime drill, a placeholder):
`{"kind": "none"}`, which cannot go stale and is shown as weaker.

The screen (`#/dev/microscope`, `app/src/ui/screens/DevMicroscopeScreen.ts`) keeps its
decisions on the device and exports them as a file; this script merges that file:

    python tools/content/review.py --merge review-decisions.jsonl
    python tools/content/review.py --check

`--merge` appends the file's events to the record, refusing any line that is malformed,
names an item the built catalogue does not have, or names an identity the catalogue does
not have (a decision made on an earlier build of the item); it is idempotent — an event
id already in the record with the same content is skipped, with different content is
refused — so rerunning it on the same file appends nothing. `--check` lists the queue
(the music families' canonical items first) with what is decided and what is not, and
the record's own faults; it exits 1 only for a fault in the record, never for undecided
items, since most of the catalogue will stay undecided for a long time.

`app/src/review/record.ts` implements the same contract for the screen; the two are held
to one set of cases (`tests/fixtures/review_cases.json`) and to each other on the built
catalogue.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from collections import defaultdict
from pathlib import Path
from typing import Iterable

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import CONTENT_SRC, DEFAULT_OUT, REPO_ROOT  # noqa: E402

RECORD = CONTENT_SRC / "review" / "decisions.jsonl"

#: R42's two decisions, and the provenance bit each fills (`provenance.review`).
DIMENSIONS = ("usableScore", "goodTeachingUse")
BIT = {"usableScore": "score", "goodTeachingUse": "teaching"}
#: The provenance fact each dimension's current decision is written to.
FACT = {"usableScore": "reviewedScore", "goodTeachingUse": "reviewedTeaching"}
VALUES = ("yes", "no", "fix")
#: What a judgement rests on, weakest first.
BASES = ("inspected", "notation", "heard")
#: What a reason is about. The score's: R42's usable-score list; the teaching use's: R42's
#: teaching-use list and Part 15 §18's four things a person concentrates on.
CATEGORIES = {
    "usableScore": ("notation", "transcription", "fidelity", "identity", "rendering", "playback", "other"),
    "goodTeachingUse": ("role", "opportunity", "demands", "physical", "musical-shape", "style", "usefulness",
                        "placement", "other"),
}
TRIAGE = "triage"

EVENT_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{5,79}$")
ITEM_ID = re.compile(r"^[A-Za-z][A-Za-z0-9._-]{0,119}$")
#: Always with milliseconds and `Z`, so the strings sort as the times they name
#: (`…:56Z` sorts after `…:56.789Z`, which is why the short form is refused).
TIMESTAMP = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$")
SHA256 = re.compile(r"^[0-9a-f]{64}$")

HUMAN_KEYS = {"v", "event", "item", "identity", "dimension", "value", "basis", "reason", "category", "by", "at",
              "note", "supersedes"}
HUMAN_REQUIRED = HUMAN_KEYS - {"note", "supersedes"}
TRIAGE_KEYS = {"v", "event", "item", "identity", "dimension", "reason", "category", "by", "at", "from", "note"}
TRIAGE_REQUIRED = {"v", "event", "item", "reason", "by", "at"}


# --------------------------------------------------------------------------------------
# one line
# --------------------------------------------------------------------------------------


def identity_fault(identity: object) -> str | None:
    if not isinstance(identity, dict):
        return "identity is not an object"
    kind = identity.get("kind")
    if kind == "generator":
        extra = set(identity) - {"kind", "family", "version", "seed", "recipe", "tempoBpm"}
        if extra:
            return f"identity has unknown fields {sorted(extra)}"
        if not isinstance(identity.get("family"), str) or not identity["family"]:
            return "a generator identity names no family"
        if not isinstance(identity.get("version"), int) or isinstance(identity.get("version"), bool):
            return "a generator identity's version is not an integer"
        if "seed" not in identity or not (identity["seed"] is None or isinstance(identity["seed"], (int, str))):
            return "a generator identity's seed is missing or not a number, a string or null"
        if not isinstance(identity.get("recipe"), dict):
            return "a generator identity has no recipe"
        tempo = identity.get("tempoBpm")
        if "tempoBpm" not in identity or not (tempo is None or (isinstance(tempo, (int, float)) and not isinstance(tempo, bool))):
            return "a generator identity's tempoBpm is missing or not a number or null"
        return None
    if kind == "file":
        if set(identity) != {"kind", "sha256"}:
            return "a file identity carries exactly kind and sha256"
        if not isinstance(identity["sha256"], str) or not SHA256.match(identity["sha256"]):
            return "a file identity's sha256 is not 64 lowercase hex digits"
        return None
    if kind == "none":
        if set(identity) - {"kind", "why"}:
            return "a none identity carries only kind and why"
        return None
    return f"identity kind {kind!r} is not generator, file or none"


def event_fault(event: object) -> str | None:
    """Why this object is not a valid record line, or None."""
    if not isinstance(event, dict):
        return "not a JSON object"
    if event.get("v") != 1:
        return "v is not 1"
    by = event.get("by")
    if not isinstance(by, str) or not by.strip():
        return "by (the reviewer's name, or triage) is missing"
    triage = by == TRIAGE
    keys, required = (TRIAGE_KEYS, TRIAGE_REQUIRED) if triage else (HUMAN_KEYS, HUMAN_REQUIRED)
    missing = sorted(required - set(event))
    if missing:
        return f"missing {', '.join(missing)}"
    extra = sorted(set(event) - keys)
    if extra:
        if triage and set(extra) & {"value", "basis", "supersedes"}:
            return f"a triage line carries {', '.join(extra)}: triage flags, it never decides"
        return f"unknown fields {', '.join(extra)}"
    if not isinstance(event["event"], str) or not EVENT_ID.match(event["event"]):
        return "event id is not 6-80 letters, digits, dots, colons, dashes or underscores"
    if not isinstance(event["item"], str) or not ITEM_ID.match(event["item"]) or ".." in event["item"]:
        return "item is not a catalogue id"
    if not isinstance(event["at"], str) or not TIMESTAMP.match(event["at"]):
        return "at is not an ISO time in UTC with milliseconds (2026-09-27T10:00:00.000Z)"
    if not isinstance(event["reason"], str) or not event["reason"].strip():
        return "reason is empty"
    for optional in ("note", "from"):
        if optional in event and not isinstance(event[optional], str):
            return f"{optional} is not text"
    if "dimension" in event and event["dimension"] not in DIMENSIONS:
        return f"dimension {event['dimension']!r} is not one of {', '.join(DIMENSIONS)}"
    if "identity" in event:
        fault = identity_fault(event["identity"])
        if fault:
            return fault
    if triage:
        if "category" in event and not isinstance(event["category"], str):
            return "category is not text"
        return None
    if by.strip().lower() == TRIAGE:
        return "the reviewer's name 'triage' is reserved for triage lines"
    if event["value"] not in VALUES:
        return f"value {event['value']!r} is not one of {', '.join(VALUES)}"
    if event["basis"] not in BASES:
        return f"basis {event['basis']!r} is not one of {', '.join(BASES)}"
    if event["category"] not in CATEGORIES[event["dimension"]]:
        return f"category {event['category']!r} is not one of {', '.join(CATEGORIES[event['dimension']])} for {event['dimension']}"
    if "supersedes" in event and (not isinstance(event["supersedes"], str) or not EVENT_ID.match(event["supersedes"])):
        return "supersedes is not an event id"
    return None


def is_triage(event: dict) -> bool:
    return event.get("by") == TRIAGE


def parse(text: str) -> tuple[list[tuple[int, str, dict]], list[tuple[int, str]]]:
    """
    The record's lines: `(line number, the line as written, the event)` for each valid one,
    and `(line number, why)` for each refused one. Blank lines are skipped and counted. A
    second line with an event id already seen on a valid line is refused.
    """
    events: list[tuple[int, str, dict]] = []
    errors: list[tuple[int, str]] = []
    seen: dict[str, int] = {}
    for number, raw in enumerate(text.splitlines(), start=1):
        line = raw.strip()
        if not line:
            continue
        try:
            event = json.loads(line)
        except json.JSONDecodeError as cause:
            errors.append((number, f"not JSON ({cause.msg})"))
            continue
        fault = event_fault(event)
        if fault:
            errors.append((number, fault))
            continue
        if event["event"] in seen:
            errors.append((number, f"event id {event['event']} is already on line {seen[event['event']]}"))
            continue
        seen[event["event"]] = number
        events.append((number, line, event))
    return events, errors


def read_record(path: Path = RECORD) -> tuple[list[tuple[int, str, dict]], list[tuple[int, str]]]:
    if not path.is_file():
        return [], []
    return parse(path.read_text(encoding="utf-8"))


# --------------------------------------------------------------------------------------
# identity
# --------------------------------------------------------------------------------------


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def generator_identity(entry: dict) -> dict:
    """G21's identity of a generated item: the generator triple and the recipe it wrote."""
    drill = entry.get("drill") or {}
    generator = drill.get("generator") or {}
    recipe = dict(drill.get("params") or {})
    recipe.setdefault("hands", entry.get("hands"))
    return {
        "kind": "generator",
        "family": generator.get("family"),
        "version": generator.get("version"),
        "seed": generator.get("seed"),
        "recipe": recipe,
        "tempoBpm": entry.get("tempoBpm"),
    }


def current_identity(entry: dict, out_dir: Path | None = DEFAULT_OUT) -> dict:
    """The identity a decision on this item binds to now."""
    drill = entry.get("drill") or {}
    rel = entry.get("file") or ""
    if drill.get("generator") and rel.startswith("scores/generated/"):
        return generator_identity(entry)
    if rel and out_dir is not None and (out_dir / rel).is_file():
        return {"kind": "file", "sha256": _sha256(out_dir / rel)}
    if rel:
        return {"kind": "none", "why": "the score file was not built"}
    if drill:
        return {"kind": "none", "why": "made when it opens: no file the build keys"}
    return {"kind": "none", "why": "no notation is bundled"}


def same_identity(a: object, b: object) -> bool:
    """Structural equality: a `none` identity matches any `none`; numbers by value (3 == 3.0)."""
    if not isinstance(a, dict) or not isinstance(b, dict) or a.get("kind") != b.get("kind"):
        return False
    if a["kind"] == "none":
        return True
    if a["kind"] == "file":
        return a.get("sha256") == b.get("sha256")
    keys = ("family", "version", "seed", "recipe", "tempoBpm")
    return all(a.get(k) == b.get(k) for k in keys)


def identities(catalog: Iterable[dict], out_dir: Path | None = DEFAULT_OUT) -> dict[str, dict]:
    return {entry["id"]: current_identity(entry, out_dir) for entry in catalog}


# --------------------------------------------------------------------------------------
# current values
# --------------------------------------------------------------------------------------


def resolve(events: list[tuple[int, str, dict]], current: dict[str, dict]) -> tuple[dict[str, dict[str, dict]], dict[str, str]]:
    """
    `(decisions, status)`: for each item with a current decision, the current event per
    dimension; and each event's status — `current`, `superseded`, `stale`, `triage` or
    `unknown-item`.
    """
    status: dict[str, str] = {}
    candidates: dict[tuple[str, str], list[tuple[str, int, dict]]] = defaultdict(list)
    for order, (_number, _raw, event) in enumerate(events):
        if is_triage(event):
            status[event["event"]] = "triage"
            continue
        identity = current.get(event["item"])
        if identity is None:
            status[event["event"]] = "unknown-item"
            continue
        if not same_identity(event["identity"], identity):
            status[event["event"]] = "stale"
            continue
        candidates[(event["item"], event["dimension"])].append((event["at"], order, event))
    decisions: dict[str, dict[str, dict]] = defaultdict(dict)
    for (item, dimension), rows in candidates.items():
        rows.sort(key=lambda row: (row[0], row[1]))
        for _at, _order, event in rows[:-1]:
            status[event["event"]] = "superseded"
        winner = rows[-1][2]
        status[winner["event"]] = "current"
        decisions[item][dimension] = winner
    return dict(decisions), status


def flags(events: list[tuple[int, str, dict]], current: dict[str, dict]) -> list[dict]:
    """Triage lines that still bear on their item: no identity given, or the item's current one."""
    out = []
    for _number, _raw, event in events:
        if not is_triage(event) or event["item"] not in current:
            continue
        if "identity" in event and not same_identity(event["identity"], current[event["item"]]):
            continue
        out.append(event)
    return out


def bit_of(value: str) -> bool:
    """`yes` is usable / a good use as it stands; `no` and `fix` are not, as it stands."""
    return value == "yes"


def bits(decided: dict[str, dict] | None) -> dict[str, bool | None]:
    decided = decided or {}
    return {BIT[d]: (bit_of(decided[d]["value"]) if d in decided else None) for d in DIMENSIONS}


def reviewed_fact(event: dict) -> dict:
    """The provenance fact a current decision is written as (E0's `reviewed` kind)."""
    return {
        "kind": "reviewed",
        "via": "content/review/decisions.jsonl",
        "value": event["value"],
        "basis": event["basis"],
        "date": event["at"][:10],
        "event": event["event"],
        **({"identity": "none"} if event["identity"]["kind"] == "none" else {}),
    }


def fill_reviewed(entries: list[dict], out_dir: Path | None, record: Path | None = None) -> dict[str, int]:
    """
    Writes each item's current decisions into its provenance (D2 item 4): the two bits in
    `review`, and per dimension a `reviewed` fact with the value, the basis, the date and
    the event id. Nothing else of the provenance changes. Returns counts for the build line.
    """
    events, errors = read_record(record or RECORD)
    if errors:
        number, why = errors[0]
        raise SystemExit(f"{(record or RECORD).name} line {number}: {why} ({len(errors)} line(s) refused); "
                         f"`python tools/content/review.py --check` lists them")
    current = identities(entries, out_dir)
    decisions, status = resolve(events, current)
    for entry in entries:
        provenance = entry.get("provenance")
        if provenance is None:
            continue
        decided = decisions.get(entry["id"], {})
        provenance["review"] = bits(decided)
        for dimension in DIMENSIONS:
            provenance["facts"].pop(FACT[dimension], None)
            if dimension in decided:
                provenance["facts"][FACT[dimension]] = reviewed_fact(decided[dimension])
    counts: dict[str, int] = defaultdict(int)
    for value in status.values():
        counts[value] += 1
    counts["items"] = len(decisions)
    return dict(counts)


def heard_faults(contracts: dict[str, dict], events: list[tuple[int, str, dict]], current: dict[str, dict],
                 family_of: dict[str, str]) -> list[str]:
    """
    A family marked `heard: true` has at least one `heard` decision by a person on a current
    item of it (D2 item 4); never the reverse — a heard decision does not make the family
    heard, which stays a hand-maintained declaration.
    """
    heard: set[str] = set()
    decisions, status = resolve(events, current)
    for _number, _raw, event in events:
        if status.get(event["event"]) in ("current", "superseded") and event["basis"] == "heard":
            family = family_of.get(event["item"])
            if family:
                heard.add(family)
    return [f"{family} is marked heard with no heard decision on a current item of it"
            for family, row in sorted(contracts.items()) if row.get("heard") is True and family not in heard]


# --------------------------------------------------------------------------------------
# merge
# --------------------------------------------------------------------------------------


def merge_lines(existing: list[tuple[int, str, dict]], incoming_text: str, current: dict[str, dict]) -> dict:
    """
    What merging `incoming_text` into the record would do: `append` (the lines, as written),
    `skipped` (event ids already in the record with the same content), `refused`
    (`(line number, why)`). Idempotent: rerun on the record with `append` added, it appends
    nothing.
    """
    known = {event["event"]: event for _n, _r, event in existing}
    append: list[tuple[str, dict]] = []
    skipped: list[str] = []
    refused: list[tuple[int, str]] = []
    for number, raw in enumerate(incoming_text.splitlines(), start=1):
        line = raw.strip()
        if not line:
            continue
        try:
            event = json.loads(line)
        except json.JSONDecodeError as cause:
            refused.append((number, f"not JSON ({cause.msg})"))
            continue
        fault = event_fault(event)
        if fault:
            refused.append((number, fault))
            continue
        eid = event["event"]
        if eid in known:
            if known[eid] == event:
                skipped.append(eid)
            else:
                refused.append((number, f"event id {eid} is already in the record with different content"))
            continue
        if event["item"] not in current:
            refused.append((number, f"{event['item']} is not in the built catalogue"))
            continue
        if "identity" in event and not same_identity(event["identity"], current[event["item"]]):
            refused.append((number, f"{event['item']}: the line names an identity the catalogue does not have "
                                    f"(decided on {event['identity'].get('kind')} "
                                    f"{_identity_words(event['identity'])}; the catalogue has "
                                    f"{_identity_words(current[event['item']])})"))
            continue
        known[eid] = event
        append.append((line, event))
    return {"append": append, "skipped": skipped, "refused": refused}


def _identity_words(identity: dict) -> str:
    if identity.get("kind") == "file":
        return f"sha256 {str(identity.get('sha256'))[:12]}…"
    if identity.get("kind") == "generator":
        return f"{identity.get('family')} v{identity.get('version')} seed {identity.get('seed')}"
    return "no identity"


def merge_file(incoming: Path, record: Path, catalog: list[dict], out_dir: Path) -> tuple[int, dict]:
    existing, errors = read_record(record)
    if errors:
        return 2, {"append": [], "skipped": [], "refused": [(n, f"the record itself, line {n}: {why}") for n, why in errors]}
    result = merge_lines(existing, incoming.read_text(encoding="utf-8"), identities(catalog, out_dir))
    if result["append"]:
        record.parent.mkdir(parents=True, exist_ok=True)
        text = record.read_bytes() if record.is_file() else b""
        with record.open("ab") as handle:
            if text and not text.endswith(b"\n"):
                handle.write(b"\n")
            for line, _event in result["append"]:
                handle.write(line.encode("utf-8") + b"\n")
    return (1 if result["refused"] else 0), result


# --------------------------------------------------------------------------------------
# the queue (D2 item 5; Part 15 §22)
# --------------------------------------------------------------------------------------

#: Generated items first, then authored, then imported sources (D2 item 1), then what has
#: no score of its own.
SOURCE_ORDER = ("generated", "authored", "pdmx", "kern", "musetrainer", "runtime", "placeholder", "unknown")

TIERS = (
    ("music", "The music families' canonical items: promised as music, and unheard"),
    ("not-judged", "The families the app cannot judge: their canonical items"),
    ("unmeasurable", "Options a rung lists for a claim no detector can check"),
    ("rest", "Everything else"),
)


def promise_of(row: dict, recipe: dict) -> str:
    import family_contracts as FC

    for rule in row["promise"]:
        if FC.matches(rule.get("when"), recipe):
            return rule["promise"]
    return row["promise"][-1]["promise"]


def _source(entry: dict) -> str:
    return ((entry.get("provenance") or {}).get("source")) or "unknown"


def queue(catalog: list[dict], report: dict) -> list[dict]:
    """
    The review order, as tiers of item ids, every catalogue item exactly once: the music
    families' canonical items (unheard, promised as music: the fourteen families and
    `meter`'s twelve-eight row), then the not-judged families' canonical items (a family with
    no canonical item — `power_chord` ships A, D and E, none in C — is stood in for by its
    first item, so every family is met in its tier), then every
    option a rung lists whose rung claims something no detector measures (the report's
    unmeasurable concepts), then the rest. Within a tier: families in name order, rung
    options in the curriculum's order with generated before authored before imported,
    the rest by source and id.
    """
    import family_contracts as FC

    contracts = FC.contracts()
    by_id = {entry["id"]: entry for entry in catalog}
    placed: set[str] = set()
    tiers: dict[str, list[str]] = {name: [] for name, _title in TIERS}

    def family_of(entry: dict) -> str | None:
        family = (((entry.get("drill") or {}).get("generator")) or {}).get("family")
        return family if family in contracts else None

    generated = sorted((e for e in catalog if family_of(e)), key=lambda e: (family_of(e), e["id"]))

    # A family with a canonical item anywhere is met through it; only a family with none at all
    # is stood in for (a music family that is also not judged is met once, in the first tier).
    has_canonical = {family_of(e) for e in generated if e.get("role") == "canonical"}

    def take(tier: str, wanted) -> None:
        """A family's canonical items; where it has none at all, its first item stands in for it."""
        chosen: dict[str, list[str]] = defaultdict(list)
        first: dict[str, str] = {}
        for entry in generated:
            if entry["id"] in placed or not wanted(entry):
                continue
            family = family_of(entry)
            first.setdefault(family, entry["id"])
            if entry.get("role") == "canonical":
                chosen[family].append(entry["id"])
        for family in sorted(first):
            for item in chosen.get(family) or ([] if family in has_canonical else [first[family]]):
                tiers[tier].append(item)
                placed.add(item)

    take("music", lambda e: promise_of(contracts[family_of(e)], FC.recipe_of(e)) == "music")
    take("not-judged", lambda e: not contracts[family_of(e)]["target"]["primary"])
    unmeasurable_rungs = {r["rung"] for r in report.get("rungs", []) if r.get("unmeasurable")}
    options: list[tuple[int, int, str]] = []
    for position, option in enumerate(report.get("options", [])):
        item = option["item"]
        if option["rung"] in unmeasurable_rungs and item in by_id and item not in placed:
            placed.add(item)
            options.append((SOURCE_ORDER.index(_source(by_id[item])) if _source(by_id[item]) in SOURCE_ORDER else len(SOURCE_ORDER),
                            position, item))
    tiers["unmeasurable"] = [item for _rank, _position, item in sorted(options)]
    rest = [e for e in catalog if e["id"] not in placed]
    rest.sort(key=lambda e: (SOURCE_ORDER.index(_source(e)) if _source(e) in SOURCE_ORDER else len(SOURCE_ORDER), e["id"]))
    tiers["rest"] = [e["id"] for e in rest]
    return [{"id": name, "title": title, "items": tiers[name]} for name, title in TIERS]


# --------------------------------------------------------------------------------------
# the microscope's data (the screen reads it; the build writes it)
# --------------------------------------------------------------------------------------


def demand_verdicts(entry: dict, option_untaught: list[str], taught_at: dict[str, str | None]) -> list[dict]:
    """
    Each measured demand with its located count and the verdict the screen shows beside it:
    `required` (the family contract asks for it; `atDensity` says whether the notes give it
    at the contract's density), `forbidden` (the contract forbids it), `established` (present
    at a useful density, not the family's point), `incidental` (present below it); `assumed`
    when the family expects the learner already has it; `untaught` with the rung that
    teaches it when the earliest rung listing the item has not; `misread` where the
    detectors' reading of this file is known wrong.
    """
    import family_contracts as FC

    measurement = entry.get("measurement") or {}
    demands = entry.get("demands")
    if not isinstance(demands, list):
        return []
    located = measurement.get("located") or {}
    established = set(measurement.get("established") or [])
    misread = set(((measurement.get("misread") or {}).get("demands")) or [])
    family = (((entry.get("drill") or {}).get("generator")) or {}).get("family")
    requires: set[str] = set()
    forbids: set[str] = set()
    assumes: set[str] = set()
    if family in FC.contracts():
        row = FC.contract(family)
        recipe = FC.recipe_of(entry)
        requires = {r["demand"] for r in FC.selected(row.get("requires"), recipe)}
        forbids = {r["demand"] for r in FC.selected(row.get("forbids"), recipe)}
        assumes = set(row.get("assumes") or [])
    out = []
    for demand in demands:
        if demand in requires:
            verdict = "required"
        elif demand in forbids:
            verdict = "forbidden"
        elif demand in established:
            verdict = "established"
        else:
            verdict = "incidental"
        row = {"demand": demand, "located": int(located.get(demand, 0)), "verdict": verdict}
        if verdict == "required":
            row["atDensity"] = demand in established
        if demand in assumes:
            row["assumed"] = True
        if demand in option_untaught:
            row["untaught"] = taught_at.get(demand)
        if demand in misread:
            row["misread"] = True
        out.append(row)
    return out


def family_projection(row: dict) -> dict:
    """What the screen shows of a family's contract row."""
    return {
        "name": row["name"],
        "version": row["version"],
        "promise": row["promise"],
        "heard": row["heard"],
        "target": row["target"],
        "requires": row.get("requires") or [],
        "forbids": row.get("forbids") or [],
        "assumes": row.get("assumes") or [],
        "physical": row["physical"],
        "roles": row["roles"].get("provides"),
        "admission": row["admission"],
        "unjudged": row["assessment"].get("unjudged") or [],
        "judged": row["assessment"].get("judged") or [],
    }


def microscope_data(catalog: list[dict], report: dict, out_dir: Path | None, record: Path | None = None) -> dict:
    import family_contracts as FC

    _skills, demands_vocab = __import__("claims").load_vocabulary()
    taught_at = {d: v.get("taughtAt") for d, v in demands_vocab.items()}
    events, errors = read_record(record or RECORD)
    current = identities(catalog, out_dir)
    _decisions, status = resolve(events, current)
    tiers = queue(catalog, report)
    tier_of = {item: tier["id"] for tier in tiers for item in tier["items"]}
    rungs_of: dict[str, list[dict]] = defaultdict(list)
    earliest_untaught: dict[str, list[str]] = {}
    for option in report.get("options", []):
        rungs_of[option["item"]].append({
            "rung": option["rung"],
            "claims": [{"kind": c["kind"], "id": c["id"], "status": c["status"]} for c in option["claims"]],
            "unmeasurable": option["unmeasurable"],
            "untaught": option["untaught"],
            "earliest": option["earliest"],
        })
        if option["earliest"]:
            earliest_untaught[option["item"]] = option["untaught"]
    rung_titles = {r["rung"]: r["title"] for r in report.get("rungs", [])}
    events_of: dict[str, list[dict]] = defaultdict(list)
    for number, _raw, event in events:
        events_of[event["item"]].append({**event, "line": number, "status": status.get(event["event"], "unknown-item")})
    items: dict[str, dict] = {}
    contracts = FC.contracts()
    for entry in catalog:
        family = (((entry.get("drill") or {}).get("generator")) or {}).get("family")
        data: dict = {"tier": tier_of[entry["id"]], "identity": current[entry["id"]]}
        if family in contracts:
            row = contracts[family]
            recipe = FC.recipe_of(entry)
            data["family"] = family
            data["promise"] = promise_of(row, recipe)
            primary = FC.primary_skill(row, recipe)
            # The contract's target for this recipe (what `FC.stamp` writes on the row), read
            # from the contract so the screen never reads the catalogue's declared skills: those
            # are the activation boundary's (`skillActivation.ts`).
            skills = FC.target_skills(row, recipe)
            data["target"] = {"primary": primary, "secondary": skills[1:]}
            data["role"] = FC.role_of(row, recipe)
            if primary is None:
                not_judged = row["target"].get("notJudged") or {}
                data["notJudged"] = {"candidate": not_judged.get("candidate"), "why": not_judged.get("why")}
        data["demands"] = demand_verdicts(entry, earliest_untaught.get(entry["id"], []), taught_at)
        data["rungs"] = [{**r, "title": rung_titles.get(r["rung"])} for r in rungs_of.get(entry["id"], [])]
        if events_of.get(entry["id"]):
            data["events"] = events_of[entry["id"]]
        items[entry["id"]] = data
    return {
        "v": 1,
        "record": {"path": "content/review/decisions.jsonl", "events": len(events),
                   "errors": [{"line": n, "why": why} for n, why in errors]},
        "fields": {"dimensions": list(DIMENSIONS), "values": list(VALUES), "bases": list(BASES),
                   "categories": {k: list(v) for k, v in CATEGORIES.items()}},
        "queue": tiers,
        "families": {family: family_projection(row) for family, row in contracts.items()},
        "items": items,
    }


#: Where the build writes the screen's data, under the builder-only root beside the built
#: content and never inside it (D2a): the offline invariant holds every file under `content/`
#: to the learner's precache (`offline.spec.ts`, P19), and this one is megabytes no learner
#: opens. `vite.config.ts` leaves `dev/` out of the precache and `.gitignore` out of git.
MICROSCOPE_FILE = Path("review") / "microscope.json"


def dev_root(out_dir: Path) -> Path:
    """The builder-only root beside a build's content directory: `app/public/dev` for the default build."""
    return out_dir.parent / "dev"


def write_microscope(out_dir: Path, catalog: list[dict], report: dict) -> Path:
    """The screen's data, from the catalogue built in `out_dir`, written to `dev_root(out_dir)`."""
    path = dev_root(out_dir) / MICROSCOPE_FILE
    path.parent.mkdir(parents=True, exist_ok=True)
    data = microscope_data(catalog, report, out_dir)
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(data, handle, ensure_ascii=False, separators=(",", ":"))
        handle.write("\n")
    return path


# --------------------------------------------------------------------------------------
# the command
# --------------------------------------------------------------------------------------


def _load_built(content: Path) -> tuple[list[dict], dict]:
    catalog_path = content / "catalog.json"
    curriculum_path = content / "curriculum.json"
    if not catalog_path.is_file() or not curriculum_path.is_file():
        raise SystemExit(f"{content} has no built catalogue: run `python tools/content/build.py` first")
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    curriculum = json.loads(curriculum_path.read_text(encoding="utf-8"))
    return catalog, curriculum


def check(content: Path, record: Path, show: int = 20) -> int:
    import claims

    catalog, curriculum = _load_built(content)
    events, errors = read_record(record)
    current = identities(catalog, content)
    decisions, status = resolve(events, current)
    report = claims.rung_claims(catalog, curriculum)
    tiers = queue(catalog, report)
    human = sum(1 for _n, _r, e in events if not is_triage(e))
    print(f"The review record ({record.relative_to(REPO_ROOT) if record.is_relative_to(REPO_ROOT) else record}): "
          f"{len(events)} event(s), {human} by a person, {len(events) - human} triage; "
          f"{sum(1 for s in status.values() if s == 'current')} current, "
          f"{sum(1 for s in status.values() if s == 'superseded')} superseded, "
          f"{sum(1 for s in status.values() if s == 'stale')} stale, "
          f"{sum(1 for s in status.values() if s == 'unknown-item')} on an item the catalogue does not have.")
    for number, why in errors:
        print(f"  line {number}: {why}")
    flagged = flags(events, current)
    print(f"Flagged by triage (never counted): {len(flagged)}")
    for event in flagged[:show]:
        print(f"  {event['item']}: {event['reason']}")
    for position, tier in enumerate(tiers, start=1):
        items = tier["items"]
        score = sum(1 for i in items if "usableScore" in decisions.get(i, {}))
        teaching = sum(1 for i in items if "goodTeachingUse" in decisions.get(i, {}))
        both = sum(1 for i in items if len(decisions.get(i, {})) == 2)
        heard = sum(1 for i in items if any(e["basis"] == "heard" for e in decisions.get(i, {}).values()))
        print(f"{position}. {tier['title']}: {len(items)} item(s); a score decision on {score}, a teaching-use "
              f"decision on {teaching}, both on {both}, heard on {heard}; undecided {len(items) - both}")
        undecided = [i for i in items if len(decisions.get(i, {})) < 2]
        for item in undecided[:show]:
            print(f"     {item}")
        if len(undecided) > show:
            print(f"     … and {len(undecided) - show} more")
    faults = len(errors) + sum(1 for s in status.values() if s == "unknown-item")
    return 1 if faults else 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--merge", type=Path, help="an exported file of decisions to append to the record")
    parser.add_argument("--check", action="store_true", help="list the queue and what is undecided, music families first")
    parser.add_argument("--record", type=Path, default=RECORD, help="the record (default content/review/decisions.jsonl)")
    parser.add_argument("--content", type=Path, default=DEFAULT_OUT, help="the built content (default app/public/content)")
    parser.add_argument("--show", type=int, default=20, help="how many undecided items to list per tier")
    args = parser.parse_args(argv)
    if not args.merge and not args.check:
        parser.error("say --merge FILE or --check")
    code = 0
    if args.merge:
        catalog, _curriculum = _load_built(args.content)
        code, result = merge_file(args.merge, args.record, catalog, args.content)
        print(f"Merged {args.merge}: appended {len(result['append'])}, already in the record {len(result['skipped'])}, "
              f"refused {len(result['refused'])}.")
        for line, event in result["append"]:
            print(f"  + {event['event']} {event['item']} {event.get('dimension') or 'triage'} "
                  f"{event.get('value') or ''} {event.get('basis') or ''}".rstrip())
        for number, why in result["refused"]:
            print(f"  line {number}: refused: {why}")
    if args.check:
        code = max(code, check(args.content, args.record, args.show))
    return code


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
