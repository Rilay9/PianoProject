"""
CK-7 extended to a re-staffing: the checker for a two-staff teaching edition cut from a PDMX
ensemble upload (requirement `A7a1-bluesriff-restaff`; `docs/review/responses/a7a-lanes-landing.md`
section 13; `docs/prompts/runs/A7a1/brief-bluesriff-restaff.md` Station 2).

Independent of the code that makes the edition. `restaff.py` parses with music21 and writes through
`convert.normalise`; this module imports neither. It reads MusicXML bytes itself, with the standard
library: ElementTree over the score file the archive's `META-INF/container.xml` names, position from
`<divisions>`, `<duration>`, `<backup>`, `<forward>` and the `<chord/>` flag, staff from `<staff>`,
pitch spelled from `<step>`, `<alter>` and `<octave>` (so B4 is B4 and never C-flat-5 or B-flat-4),
`<unpitched>` as a head of its own, ties from `<tie>`. The rules are the A7a.1 probe's reader A
(`docs/prompts/runs/A7a1/readers.py`), which agreed with music21 on every one of the raw file's 249
heads and 54 rests.

Two halves, used at two different times:

* `freeze` reads the RAW archive member, once, where the archive is (the import step), and returns the
  frozen source-event fixture: the selected source events the edition must equal, the omitted events
  it must not hold, the bar and metre facts, all bound to the raw member's sha256. It is never run on
  the edition under test, so a wrong edition cannot regenerate its own oracle.
* `verify` reads the committed EDITION and compares it, bar for bar and event for event, with that
  fixture. CI runs this half (`tools/content/tests/test_restaff.py`); it needs no archive and no raw
  file, by the ruling: the raw member is not committed to make CI self-contained.

An event is (bar, onset, duration, spelled head, tie): onset in quarters from the bar's start and
duration in quarters, both exact fractions. Rests are compared separately: every selected source
rest must stand in the edition at its bar, onset and duration; a rest the edition adds is listed with
its bar and is allowed, because the sounding events (which a moved onset would change) are compared
exactly.
"""
from __future__ import annotations

import sys
from pathlib import Path

# This directory off `sys.path` when run as a script, as every `pdmx/` entry point does (`commit.py` says why).
_HERE = Path(__file__).resolve().parent
sys.path[:] = [entry for entry in sys.path if entry and Path(entry).resolve() != _HERE]

import hashlib  # noqa: E402
import io  # noqa: E402
import json  # noqa: E402
import xml.etree.ElementTree as ET  # noqa: E402
import zipfile  # noqa: E402
from collections import Counter  # noqa: E402
from dataclasses import dataclass, field  # noqa: E402
from fractions import Fraction  # noqa: E402

#: The fixture format. Raised when a field changes meaning, so an old fixture is refused, not misread.
FIXTURE_VERSION = 1

ALTER_SPELLING = {-2: "bb", -1: "b", 0: "", 1: "#", 2: "##"}


# --------------------------------------------------------------------------- the reader


@dataclass(frozen=True)
class Event:
    part: str
    staff: int
    bar: int
    onset: Fraction
    duration: Fraction
    head: str  # a spelled pitch ("Bb4") or "x" for an unpitched head
    tie: str | None

    def key(self) -> tuple:
        return (self.bar, self.onset, self.duration, self.head, self.tie)


@dataclass(frozen=True)
class Rest:
    part: str
    staff: int
    bar: int
    onset: Fraction
    duration: Fraction
    hidden: bool

    def key(self) -> tuple:
        return (self.bar, self.onset, self.duration)


@dataclass
class Reading:
    """What the reader found in one MusicXML file."""

    parts: dict[str, str]  # score-part id -> part-name
    staves: dict[str, int]  # part id -> <staves> (1 when absent)
    clefs: dict[tuple[str, int], list[str]]  # (part, staff) -> clefs seen, "G2", "F4", "percussion"
    events: list[Event] = field(default_factory=list)
    rests: list[Rest] = field(default_factory=list)
    graces: list[tuple[str, int, int]] = field(default_factory=list)
    bars: dict[str, list[int]] = field(default_factory=dict)  # part -> measure numbers in order
    metre: dict[tuple[str, int], tuple[int, int]] = field(default_factory=dict)  # (part, bar) -> time in effect
    length: dict[tuple[str, int], Fraction] = field(default_factory=dict)  # (part, bar) -> furthest position


def score_xml(data: bytes) -> bytes:
    """The score file of a compressed MusicXML archive, or the bytes themselves for plain MusicXML."""
    if not data[:2] == b"PK":
        return data
    archive = zipfile.ZipFile(io.BytesIO(data))
    container = ET.fromstring(archive.read("META-INF/container.xml"))
    for element in container.iter():
        if element.tag.endswith("rootfile") and element.get("full-path"):
            return archive.read(element.get("full-path"))
    raise ValueError("no rootfile in META-INF/container.xml")


def spell(pitch: ET.Element) -> str:
    alter = float(pitch.findtext("alter") or 0)
    if alter != int(alter) or int(alter) not in ALTER_SPELLING:
        raise ValueError(f"unsupported alter {alter}")
    return f"{pitch.findtext('step')}{ALTER_SPELLING[int(alter)]}{int(pitch.findtext('octave'))}"


def read(data: bytes) -> Reading:
    """Every note, rest, clef, bar and metre in a MusicXML file, by the raw walk."""
    root = ET.fromstring(score_xml(data))
    parts = {sp.get("id"): (sp.findtext("part-name") or "").strip() for sp in root.iter("score-part")}
    reading = Reading(parts=parts, staves={}, clefs={})
    for part in root.findall("part"):
        pid = part.get("id")
        divisions = 1
        time: tuple[int, int] | None = None
        reading.staves.setdefault(pid, 1)
        reading.bars[pid] = []
        for measure in part.findall("measure"):
            bar = int(measure.get("number"))
            reading.bars[pid].append(bar)
            position = Fraction(0)
            furthest = Fraction(0)
            last_onset = Fraction(0)
            for element in measure:
                if element.tag == "attributes":
                    if element.findtext("divisions"):
                        divisions = int(element.findtext("divisions"))
                    if element.findtext("staves"):
                        reading.staves[pid] = int(element.findtext("staves"))
                    for signature in element.findall("time"):
                        time = (int(signature.findtext("beats")), int(signature.findtext("beat-type")))
                    for clef in element.findall("clef"):
                        staff = int(clef.get("number") or 1)
                        sign = clef.findtext("sign") or ""
                        name = "percussion" if sign == "percussion" else f"{sign}{clef.findtext('line') or ''}"
                        reading.clefs.setdefault((pid, staff), []).append(name)
                elif element.tag == "backup":
                    position -= Fraction(int(element.findtext("duration")), divisions)
                elif element.tag == "forward":
                    position += Fraction(int(element.findtext("duration")), divisions)
                    furthest = max(furthest, position)
                elif element.tag == "note":
                    staff = int(element.findtext("staff") or 1)
                    if element.find("grace") is not None:
                        reading.graces.append((pid, staff, bar))
                        continue
                    duration = Fraction(int(element.findtext("duration") or 0), divisions)
                    chord = element.find("chord") is not None
                    onset = last_onset if chord else position
                    ties = sorted(tie.get("type") for tie in element.findall("tie"))
                    tie = "+".join(ties) if ties else None
                    if element.find("rest") is not None:
                        reading.rests.append(Rest(pid, staff, bar, onset, duration, element.get("print-object") == "no"))
                    elif element.find("pitch") is not None:
                        reading.events.append(Event(pid, staff, bar, onset, duration, spell(element.find("pitch")), tie))
                    elif element.find("unpitched") is not None:
                        reading.events.append(Event(pid, staff, bar, onset, duration, "x", tie))
                    if not chord:
                        last_onset = position
                        position += duration
                        furthest = max(furthest, position)
            reading.metre[(pid, bar)] = time or (0, 0)
            reading.length[(pid, bar)] = furthest
    return reading


# --------------------------------------------------------------------------- the fixture


def text(value: Fraction) -> str:
    return str(value)


def event_row(event: Event) -> dict:
    return {"bar": event.bar, "onset": text(event.onset), "duration": text(event.duration),
            "head": event.head, "tie": event.tie}


def rest_row(rest: Rest) -> dict:
    return {"bar": rest.bar, "onset": text(rest.onset), "duration": text(rest.duration)}


def ordered(rows: list[dict]) -> list[dict]:
    return sorted(rows, key=lambda r: (r["bar"], Fraction(r["onset"]), r.get("head", ""), Fraction(r["duration"])))


def freeze(data: bytes, *, raw_sha256: str, upper: dict, lower: dict, omit: list[dict]) -> dict:
    """
    The frozen source-event fixture, read from the raw member's bytes.

    `upper` and `lower` name a selection each, `{"part": <score-part id>, "name": <part-name>,
    "staff": <staff number>}`: the source material the edition's staff 1 and staff 2 must equal. The
    part-name is checked, not used to select: a file whose `P2` is not called "Riff" is not the
    file the selection was written for. `omit` names the rest of the file the same way, so a source
    part that is neither kept nor omitted refuses the freeze instead of disappearing unnoticed.
    """
    digest = hashlib.sha256(data).hexdigest()
    if digest != raw_sha256:
        raise ValueError(f"raw sha256 {digest} is not the pinned {raw_sha256}")
    reading = read(data)
    selections = [("upper", upper), ("lower", lower)] + [(f"omit {i + 1}", one) for i, one in enumerate(omit)]
    covered: set[tuple[str, int]] = set()
    for label, one in selections:
        if reading.parts.get(one["part"]) != one["name"]:
            raise ValueError(f"{label}: part {one['part']} is named {reading.parts.get(one['part'])!r}, not {one['name']!r}")
        if not 1 <= one["staff"] <= reading.staves.get(one["part"], 1):
            raise ValueError(f"{label}: part {one['part']} has no staff {one['staff']}")
        covered.add((one["part"], one["staff"]))
    every = {(pid, staff) for pid in reading.parts for staff in range(1, reading.staves.get(pid, 1) + 1)}
    if every != covered:
        raise ValueError(f"source staves neither kept nor omitted: {sorted(every - covered)}")
    if reading.graces:
        raise ValueError(f"grace notes in the source ({len(reading.graces)}): this fixture format does not carry them")

    def of(one: dict) -> tuple[list[Event], list[Rest]]:
        sel = (one["part"], one["staff"])
        return ([e for e in reading.events if (e.part, e.staff) == sel],
                [r for r in reading.rests if (r.part, r.staff) == sel])

    upper_events, upper_rests = of(upper)
    lower_events, lower_rests = of(lower)
    omitted = [e for one in omit for e in of(one)[0]]
    bars = reading.bars[upper["part"]]
    if any(reading.bars[pid] != bars for pid in reading.parts):
        raise ValueError("the source's parts do not share one bar list")
    metres = sorted({reading.metre[(upper["part"], b)] for b in bars})
    return {
        "fixtureVersion": FIXTURE_VERSION,
        "rawSha256": raw_sha256,
        "reader": "tools/content/pdmx/restaff_verify.py read() (a raw MusicXML walk; no music21)",
        "upper": {**upper, "events": ordered([event_row(e) for e in upper_events]),
                  "rests": ordered([rest_row(r) for r in upper_rests])},
        "lower": {**lower, "events": ordered([event_row(e) for e in lower_events]),
                  "rests": ordered([rest_row(r) for r in lower_rests])},
        "omitted": {
            "selections": omit,
            "pitched": ordered([event_row(e) for e in omitted if e.head != "x"]),
            "unpitchedHeads": sum(1 for e in omitted if e.head == "x"),
        },
        "bars": bars,
        "metre": [f"{a}/{b}" for a, b in metres],
    }


# --------------------------------------------------------------------------- the check


def event_key(row: dict) -> tuple:
    return (int(row["bar"]), Fraction(row["onset"]), Fraction(row["duration"]), row["head"], row.get("tie"))


def describe(key: tuple) -> str:
    bar, onset, duration, head, tie = key
    beat = onset + 1
    beat_text = str(beat.numerator) if beat.denominator == 1 else str(float(beat))
    return f"bar {bar}: {head} lasting {duration} quarter(s) at beat {beat_text}" + (f" (tie {tie})" if tie else "")


@dataclass
class Verdict:
    failures: list[str] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return not self.failures


def verify(data: bytes, fixture: dict) -> Verdict:
    """The edition's bytes against the frozen fixture: every failure names its bar and event."""
    verdict = Verdict()
    if fixture.get("fixtureVersion") != FIXTURE_VERSION:
        verdict.failures.append(f"fixture version {fixture.get('fixtureVersion')} is not {FIXTURE_VERSION}")
        return verdict
    try:
        reading = read(data)
    except (ET.ParseError, ValueError, KeyError, zipfile.BadZipFile) as error:
        verdict.failures.append(f"the edition does not read: {type(error).__name__}: {error}")
        return verdict

    # The shape: one piano part on two staves, treble over bass, nothing percussive.
    if len(reading.parts) != 1:
        verdict.failures.append(f"the edition has {len(reading.parts)} parts, not one")
        return verdict
    (pid,) = reading.parts
    if reading.staves.get(pid) != 2:
        verdict.failures.append(f"the edition has {reading.staves.get(pid)} staves, not two")
    for staff, want in ((1, "G2"), (2, "F4")):
        seen = reading.clefs.get((pid, staff), [])
        if not seen or seen[0] != want:
            verdict.failures.append(f"staff {staff} opens with clef {seen[0] if seen else 'none'}, not {want}")
    for (part, staff), seen in reading.clefs.items():
        if "percussion" in seen:
            verdict.failures.append(f"staff {staff} carries a percussion clef")
    if reading.graces:
        verdict.failures.append(f"grace notes in the edition at bars {sorted({b for _, _, b in reading.graces})}")

    # Bars and metre: the source's bar list, every bar in the source's metre and full.
    bars = reading.bars[pid]
    if bars != list(fixture["bars"]):
        verdict.failures.append(f"bars {bars} are not the source's {fixture['bars']}")
    metres = {f"{a}/{b}" for (part, bar), (a, b) in reading.metre.items()}
    if metres != set(fixture["metre"]):
        verdict.failures.append(f"metre {sorted(metres)} is not the source's {fixture['metre']}")
    for bar in bars:
        beats, beat_type = reading.metre[(pid, bar)]
        if beat_type and reading.length[(pid, bar)] != Fraction(4 * beats, beat_type):
            verdict.failures.append(f"bar {bar}: lasts {reading.length[(pid, bar)]} quarter(s), not {Fraction(4 * beats, beat_type)}")

    # Unpitched heads: none, whatever staff.
    for event in reading.events:
        if event.head == "x":
            verdict.failures.append(f"staff {event.staff} {describe(event.key())}: an unpitched head")

    # The sounding events, staff by staff, as multisets.
    voicings = Counter(event_key(row) for row in fixture["omitted"]["pitched"])
    for staff, side in ((1, "upper"), (2, "lower")):
        want = Counter(event_key(row) for row in fixture[side]["events"])
        have = Counter(e.key() for e in reading.events if e.staff == staff and e.head != "x")
        name = f"{fixture[side]['name']} staff {fixture[side]['staff']}"
        for key in sorted((want - have).elements(), key=_sort):
            verdict.failures.append(f"staff {staff} {describe(key)}: a source {name} event missing")
        for key in sorted((have - want).elements(), key=_sort):
            why = "an omitted source event (the voicings)" if key in voicings else f"not a source {name} event"
            verdict.failures.append(f"staff {staff} {describe(key)}: {why}")
        # The rests: each source rest stands where it stood; an added rest is listed, not refused.
        rest_want = Counter((int(r["bar"]), Fraction(r["onset"]), Fraction(r["duration"])) for r in fixture[side]["rests"])
        rest_have = Counter(r.key() for r in reading.rests if r.staff == staff)
        for bar, onset, duration in sorted((rest_want - rest_have).elements()):
            verdict.failures.append(f"staff {staff} bar {bar}: the source rest of {duration} quarter(s) at beat {float(onset + 1):g} is missing")
        for bar, onset, duration in sorted((rest_have - rest_want).elements()):
            verdict.notes.append(f"staff {staff} bar {bar}: a rest of {duration} quarter(s) at beat {float(onset + 1):g} the source does not print (added)")
    other = sorted({e.staff for e in reading.events} - {1, 2})
    for staff in other:
        verdict.failures.append(f"events on staff {staff}, which the edition must not have")
    return verdict


def _sort(key: tuple) -> tuple:
    bar, onset, duration, head, tie = key
    return (bar, onset, duration, head, tie or "")


def load_fixture(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def main(argv: list[str] | None = None) -> int:
    import argparse

    parser = argparse.ArgumentParser(description="Check a re-staffed edition against its frozen source events.")
    parser.add_argument("edition", type=Path, help="the edition (.mxl or .musicxml)")
    parser.add_argument("fixture", type=Path, help="its fixture (tools/content/tests/fixtures/restaff/<cid>.source-events.json)")
    args = parser.parse_args(argv)
    verdict = verify(args.edition.read_bytes(), load_fixture(args.fixture))
    for note in verdict.notes:
        print(f"note: {note}")
    for failure in verdict.failures:
        print(f"FAIL: {failure}")
    print("PASS" if verdict.ok else f"FAIL ({len(verdict.failures)})")
    return 0 if verdict.ok else 1


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
