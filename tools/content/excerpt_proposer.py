#!/usr/bin/env python3
"""
The excerpt proposer (E1 item 5; Part 24's mining, R7, R40): windows of printed bars scored for
the requested opportunity and for musical completeness, never for the lowest difficulty. Mining
proposes and creates no truth: a candidate is a suggestion a reviewer sees and hears in the
microscope's excerpt view (`#/dev/microscope/excerpts`), and only an approved, merged row is cut
and measured by the build.

    python tools/content/excerpts.py propose --for interval.leap [--rung 1.5] [--of ID] [--bars 4..8]
    python tools/content/excerpts.py propose --edition-check [--of ID ...]

**It never cuts a window to score it.** The positions come from the bridge (`demands.py` and
`demandsOfFiles.test.ts`), written once per parent by the content build into
`build/positions-cache.json`: per demand, per printed bar and staff, the detectors' own located
places; the every-bar detectors' condition per bar; each hand's range per bar. The phrase and
cadence signals read the parent's own notation (`read_bars`: barlines, rests, long notes,
rehearsal marks, repeat signs, fermatas, slurs, breath marks, the bass at each downbeat, chord
symbols). Each signal is a pure function with its weight and its reason (`WEIGHTS`); the score is
their weighted sum, shown part by part; three gates refuse outright (`untaught`, `forbidden`,
`physical`). Nothing reads a level: a mutant that ranks by lowest difficulty is red
(`test_excerpt_proposer.py`).

**What the positions cannot tell, named.** The left-hand pattern and the walking bass locate
nothing unless every bar of the piece qualifies, so the bridge asks each detector of every bar
alone and a window has them where every bar of it does; the shift beyond a five-finger position
widens from the start of the piece, so a window's span is read from each hand's range per bar; a
key signature and compound time are properties of the bars, read from the notation; hands
together is taken as present wherever both staves sound in a two-hand window (conservative: the
gate would rather refuse a window than propose one the cut then measures as untaught).

Writes `build/excerpts/candidates.json` (one section per run: the target, the judging rung, the
weights, every candidate with its parts and gates, the best refused window per parent with the
signal that refused it) and its builder-only projection `app/public/dev/review/excerpts.json`
(D2a's `dev/` root: gitignored, never precached), which the excerpt view reads.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import BUILD_DIR, CONTENT_SRC, DEFAULT_OUT  # noqa: E402

CANDIDATES = BUILD_DIR / "excerpts" / "candidates.json"
PROJECTION = Path("review") / "excerpts.json"
POSITIONS = BUILD_DIR / "positions-cache.json"
DENSITY_FILE = CONTENT_SRC / "sources" / "opportunity-density.json"
#: The seed list of teaching repertoire (E28; E2 item 5): a proposal source. A run offers the
#: catalogue's editions of the works it knows for a concept naming the target first within each
#: pass; it adds, removes and rescores no window, and admits nothing.
SEED_FILE = CONTENT_SRC / "sources" / "teaching-repertoire.json"

#: A window is four to eight printed bars unless the command asks otherwise (two to sixteen allowed).
DEFAULT_BARS = (4, 8)
ALLOWED_BARS = (2, 16)
#: How far either boundary may move in the view and still be scored from the table the proposer writes.
NEIGHBOURHOOD = 4
#: How many candidates a run keeps, and how many are checked by the physical gate (music21, slower).
KEEP = 40
PHYSICAL_CHECKED = 120

#: Each weighted signal, its weight and the reason for it. The candidate's score is the sum of
#: weight × value (each value in [0, 1]); the reviewer sees every part.
WEIGHTS: dict[str, tuple[float, str]] = {
    "opportunity": (3.0, "the reason the passage exists: the target at the window rule's density (perBar and minInWindow)"),
    "occurrences": (2.0, "practice needs the target to come back through the passage, in at least half its bars, not in one bar"),
    "phraseStart": (2.0, "a passage that begins mid-phrase is a fragment (adversary 3): bar 1, a double bar, a repeat sign, "
                         "a rehearsal mark, a new key or time, a rest, a long note or a fermata before it, or a phrase slur starting on it"),
    "ending": (2.0, "a passage that stops before its cadence is a fragment (adversary 4): the piece's end, a double bar, a "
                    "fermata, a long note or a rest in the melody (a cadence to the tonic read from the bass or the chord "
                    "symbols scores it higher; a half cadence is marked 'leads onward')"),
    "pickup": (1.0, "an upbeat severed from its phrase is the commonest cut fault (adversary 5): when the notes before the "
                    "start lead into it after a rest or a long note, the window starts at their bar"),
    "texture": (1.0, "the hands as the parent has them: both sounding through a two-hand window, and no window that begins "
                     "on one hand's rest and ends on the other's"),
    "length": (1.0, "a phrase or two: four and eight bars score highest, six next, five and seven after, shorter or longer less"),
}
#: A signal counts as met at this value (the view and the approval rule read `fired`).
MET = 0.6
#: The gates: a window failing one is refused whatever it scores.
GATES = ("untaught", "forbidden", "physical")

#: The physical gate's row for repertoire (D0's `physical_faults` reads it): an octave's span, a
#: leap of up to two octaves with a fifth of a second to make it, twelve notes a second. An
#: edition's printed fingering is its editor's, not a generated print, so fingering faults are not
#: the gate's here (`physical_gate`).
REPERTOIRE_PHYSICAL = {
    "physical": {
        "maxSpan": 12,
        "maxRate": 12,
        "leaps": {"max": 24, "minSeconds": 0.2},
        "maxContinuousSeconds": 600,
        "fingering": {"printed": "any", "source": None},
    }
}

DOUBLE_BARS = {"light-light", "light-heavy", "heavy-light", "heavy-heavy", "repeat"}

#: The selections the proposer offers. Not the left hand alone: a left-hand cut is one staff in
#: the bass clef, and the detectors read staff 1 as the treble clef (`detect.ts`'s clef assumption,
#: E0's 74 scores, E22's seam), so the cut would measure every note on a ledger line and none on
#: the bass staff — demands the passage does not have. The cutter and the definitions take `left`;
#: the proposer offers it again once the detectors read the clef.
PROPOSED_SELECTIONS = ("both", "right")
EVERY_BAR = ("texture.left-hand-pattern", "texture.walking-bass")


# --------------------------------------------------------------------------------------
# the parent's notation, bar by bar
# --------------------------------------------------------------------------------------

STEP = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


@dataclass
class Event:
    onset: float
    duration: float
    midis: list[int]
    tie_start: bool = False
    tie_stop: bool = False
    fermata: bool = False
    slur_start: bool = False
    slur_stop: bool = False


@dataclass
class Bar:
    number: int
    length: float = 4.0
    fifths: int = 0
    time: tuple[int, int] = (4, 4)
    key_change: bool = False
    time_change: bool = False
    left: str | None = None
    right: str | None = None
    ending: bool = False
    jump: bool = False
    rehearsal: bool = False
    breath: bool = False
    notes: dict[int, list[Event]] = field(default_factory=lambda: {1: [], 2: []})
    rests: dict[int, list[tuple[float, float]]] = field(default_factory=lambda: {1: [], 2: []})
    roots: list[tuple[float, int]] = field(default_factory=list)

    @property
    def fermata(self) -> bool:
        return any(e.fermata for staff in self.notes.values() for e in staff)

    def sounding(self, staff: int) -> bool:
        return bool(self.notes.get(staff))


def _local(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def _child(element, name: str):
    for child in element:
        if _local(child.tag) == name:
            return child
    return None


def _children(element, name: str) -> list:
    return [child for child in element if _local(child.tag) == name]


def _midi(pitch) -> int | None:
    step = _child(pitch, "step")
    octave = _child(pitch, "octave")
    if step is None or octave is None or not octave.text:
        return None
    alter = _child(pitch, "alter")
    shift = int(round(float(alter.text))) if alter is not None and alter.text else 0
    return (int(octave.text) + 1) * 12 + STEP.get((step.text or "C").strip(), 0) + shift


def read_bars(text: str) -> list[Bar]:
    """Every printed bar of the score's first part, with what the phrase and cadence signals read."""
    root = ET.fromstring(text)
    part = next((child for child in root if _local(child.tag) == "part"), None)
    if part is None:
        return []
    bars: list[Bar] = []
    divisions = 1.0
    fifths = 0
    time = (4, 4)
    for index, measure in enumerate(_children(part, "measure")):
        bar = Bar(number=index + 1, fifths=fifths, time=time, length=time[0] * 4 / time[1])
        position = 0.0
        last_onset = 0.0
        for element in measure:
            name = _local(element.tag)
            if name == "attributes":
                d = _child(element, "divisions")
                if d is not None and d.text:
                    divisions = float(d.text)
                key = _child(element, "key")
                if key is not None and _child(key, "fifths") is not None:
                    new = int(_child(key, "fifths").text)
                    if index > 0 and new != fifths:
                        bar.key_change = True
                    fifths = bar.fifths = new
                t = _child(element, "time")
                if t is not None and _child(t, "beats") is not None and _child(t, "beat-type") is not None:
                    try:
                        new_time = (int(_child(t, "beats").text), int(_child(t, "beat-type").text))
                    except (TypeError, ValueError):
                        new_time = time
                    if index > 0 and new_time != time:
                        bar.time_change = True
                    time = bar.time = new_time
                    bar.length = time[0] * 4 / time[1]
            elif name == "backup":
                position -= float(_child(element, "duration").text) / divisions
            elif name == "forward":
                position += float(_child(element, "duration").text) / divisions
            elif name == "note":
                if _child(element, "grace") is not None:
                    continue
                d = _child(element, "duration")
                length = float(d.text) / divisions if d is not None and d.text else 0.0
                chord = _child(element, "chord") is not None
                onset = last_onset if chord else position
                staff_el = _child(element, "staff")
                staff = int(staff_el.text) if staff_el is not None and staff_el.text else 1
                staff = 2 if staff >= 2 else 1
                if _child(element, "rest") is not None:
                    bar.rests[staff].append((onset, length))
                else:
                    pitch = _child(element, "pitch")
                    midi = _midi(pitch) if pitch is not None else None
                    ties = [t.get("type") for t in _children(element, "tie")]
                    notations = _child(element, "notations")
                    fermata = slur_start = slur_stop = False
                    if notations is not None:
                        fermata = _child(notations, "fermata") is not None
                        for slur in _children(notations, "slur"):
                            slur_start |= slur.get("type") == "start"
                            slur_stop |= slur.get("type") == "stop"
                        articulations = _child(notations, "articulations")
                        if articulations is not None and _child(articulations, "breath-mark") is not None:
                            bar.breath = True
                    events = bar.notes[staff]
                    if chord and events and abs(events[-1].onset - onset) < 1e-6:
                        if midi is not None:
                            events[-1].midis.append(midi)
                        events[-1].fermata |= fermata
                    elif midi is not None:
                        events.append(Event(onset, length, [midi], "start" in ties, "stop" in ties, fermata, slur_start, slur_stop))
                if not chord:
                    last_onset = position
                    position += length
            elif name == "direction":
                for kind in element.iter():
                    tag = _local(kind.tag)
                    if tag == "rehearsal":
                        bar.rehearsal = True
                    elif tag in ("segno", "coda"):
                        bar.jump = True
                    elif tag == "words" and kind.text and any(w in kind.text.lower() for w in ("d.c.", "d.s.", "da capo", "dal segno", "to coda")):
                        bar.jump = True
                sound = _child(element, "sound")
                if sound is not None and (sound.get("dacapo") or sound.get("dalsegno") or sound.get("tocoda") or sound.get("segno") or sound.get("coda")):
                    bar.jump = True
            elif name == "barline":
                location = element.get("location") or "right"
                style = _child(element, "bar-style")
                repeat = _child(element, "repeat")
                value = "repeat" if repeat is not None else ((style.text or "").strip() if style is not None else None)
                if _child(element, "ending") is not None:
                    bar.ending = True
                if location == "left":
                    bar.left = value
                elif location == "right":
                    bar.right = value
            elif name == "harmony":
                root_el = _child(element, "root")
                if root_el is not None and _child(root_el, "root-step") is not None:
                    alter = _child(root_el, "root-alter")
                    pc = (STEP.get((_child(root_el, "root-step").text or "C").strip(), 0)
                          + (int(round(float(alter.text))) if alter is not None and alter.text else 0)) % 12
                    offset = _child(element, "offset")
                    at = position + (float(offset.text) / divisions if offset is not None and offset.text else 0.0)
                    bar.roots.append((at, pc))
        for staff in bar.notes.values():
            staff.sort(key=lambda e: e.onset)
        bars.append(bar)
    return bars


# --------------------------------------------------------------------------------------
# readings of a bar
# --------------------------------------------------------------------------------------


def melody_staff(bars: list[Bar]) -> int:
    return 1 if any(b.sounding(1) for b in bars) else 2


def last_event(bar: Bar, staff: int) -> Event | None:
    events = bar.notes.get(staff) or []
    return max(events, key=lambda e: (e.onset + e.duration, e.onset)) if events else None


def ends_on_rest(bar: Bar, staff: int) -> bool:
    """The staff falls silent before the barline: its last note ends short of it (a rest at the end)."""
    last = last_event(bar, staff)
    return last is not None and last.onset + last.duration < bar.length - 1e-6 and not last.tie_start


def ends_long(bar: Bar, staff: int) -> bool:
    """
    The staff's last note is long, and not tied onward: held through the whole bar, or at least
    half the bar and a beat and longer than every other note in the bar. A tune written in half
    notes (Beyer's No. 38: D5 C5 in halves, mid-phrase) is not ending at each of them; its whole
    notes and a dotted half after shorter notes are the long notes this reading takes.
    """
    last = last_event(bar, staff)
    if last is None or last.tie_start:
        return False
    if last.duration >= bar.length - 1e-6:
        return True
    others = [e.duration for e in bar.notes.get(staff) or [] if e is not last]
    return last.duration >= max(1.0, bar.length / 2) - 1e-6 and all(d < last.duration - 1e-6 for d in others)


def starts_late(bar: Bar, staff: int) -> bool:
    """The staff's first note starts after the downbeat (a rest opens the bar)."""
    events = bar.notes.get(staff) or []
    return bool(events) and events[0].onset > 1e-6


def upbeat_into_next(bar: Bar, staff: int) -> float | None:
    """
    Where an upbeat group starts in this bar, leading into the next: short notes in the bar's
    second half after a rest or a long note in the same staff. None when the bar has none.
    """
    events = bar.notes.get(staff) or []
    if not events:
        return None
    long = max(1.0, bar.length / 2) - 1e-6
    last = events[-1]
    if last.onset + last.duration < bar.length - 1e-6 or last.tie_start or last.duration >= long:
        return None  # it ends on a rest or a long note: nothing leads in
    # The group: the trailing run of short notes, each joined to the next, back to a gap or a long note.
    group = [last]
    for event in reversed(events[:-1]):
        joined = event.onset + event.duration >= group[0].onset - 1e-6
        if not joined or event.duration >= long:
            break
        group.insert(0, event)
    start = group[0].onset
    if start < bar.length / 2 - 1e-6:
        return None  # a line that runs through the bar, not an upbeat
    before = [e for e in events if e.onset < start - 1e-6]
    gap = not before or before[-1].onset + before[-1].duration < start - 1e-6
    long_before = bool(before) and before[-1].duration >= long
    return start if (gap or long_before) else None


def is_pickup_bar(bar: Bar) -> bool:
    """The piece's anacrusis: a first bar shorter than its time signature."""
    content = max((e.onset + e.duration for staff in bar.notes.values() for e in staff), default=0.0)
    rests = max((o + d for staff in bar.rests.values() for o, d in staff), default=0.0)
    return bar.number == 1 and max(content, rests) < bar.length - 1e-6


def bass_at_downbeat(bar: Bar) -> int | None:
    """The pitch class under the downbeat: the lowest note the lower staff strikes on beat 1, else a chord symbol's root there."""
    lows = [min(e.midis) for e in bar.notes.get(2, []) if e.onset < 1e-6]
    if lows:
        return min(lows) % 12
    roots = [pc for at, pc in bar.roots if at < 1e-6]
    return roots[0] if roots else None


def tonics(fifths: int) -> tuple[int, int]:
    """The key signature's major tonic and its relative minor's, as pitch classes."""
    major = (fifths * 7) % 12
    return major, (major + 9) % 12


# --------------------------------------------------------------------------------------
# the signals (pure: each reads the window and returns its part)
# --------------------------------------------------------------------------------------


@dataclass
class Part:
    signal: str
    value: float
    detail: str
    kind: str | None = None

    @property
    def fired(self) -> bool:
        return self.value >= MET

    def row(self) -> dict:
        weight = WEIGHTS[self.signal][0] if self.signal in WEIGHTS else None
        out = {"signal": self.signal, "value": round(self.value, 3), "fired": self.fired, "detail": self.detail}
        if weight is not None:
            out["weight"] = weight
        if self.kind:
            out["kind"] = self.kind
        return out


def phrase_start(bars: list[Bar], low: int) -> Part:
    """Adversary 3: the window begins where a phrase does, by the edition's marks and the melody."""
    if low == 1:
        return Part("phraseStart", 1.0, "the piece's first bar")
    before, here = bars[low - 2], bars[low - 1]
    melody = melody_staff(bars)
    if before.right in DOUBLE_BARS or here.left in DOUBLE_BARS:
        mark = "a repeat sign" if "repeat" in (before.right, here.left) else "a double bar"
        return Part("phraseStart", 1.0, f"{mark} before bar {low}")
    if here.rehearsal:
        return Part("phraseStart", 1.0, f"a rehearsal mark at bar {low}")
    if here.key_change or here.time_change:
        return Part("phraseStart", 0.9, f"a new {'key' if here.key_change else 'time'} at bar {low}")
    last = last_event(before, melody)
    if last is not None and last.fermata:
        return Part("phraseStart", 0.9, f"a fermata ends bar {low - 1}")
    # The bar before opens a phrase the edition marks (a double bar, a repeat sign or a rehearsal
    # mark before it): its long note or rest belongs to that phrase's start, not to an end.
    opened = low >= 3 and (bars[low - 3].right in DOUBLE_BARS or before.left in DOUBLE_BARS or before.rehearsal)
    if opened and (ends_long(before, melody) or ends_on_rest(before, melody)):
        held = "long note" if ends_long(before, melody) else "rest"
        return Part("phraseStart", 0.4, f"bar {low - 1} opens the phrase the edition marks before it: its "
                                        f"{held} begins that phrase, it does not end one")
    if ends_on_rest(before, melody) and not upbeat_into_next(before, melody):
        return Part("phraseStart", 0.9, f"after a rest in the melody at the end of bar {low - 1}")
    if starts_late(here, melody) and upbeat_into_next(here, melody) is not None:
        return Part("phraseStart", 0.8, f"the melody rests into bar {low} and enters with an upbeat")
    if ends_long(before, melody) and upbeat_into_next(before, melody) is None:
        return Part("phraseStart", 0.8, f"after a long note in the melody in bar {low - 1}")
    if before.breath:
        return Part("phraseStart", 0.8, f"a breath mark in bar {low - 1}")
    first = (here.notes.get(melody) or [None])[0]
    if first is not None and first.slur_start and first.onset < 1e-6:
        return Part("phraseStart", 0.7, f"a slur starts on the first note of bar {low}")
    if upbeat_into_next(here, melody) is not None:
        # Not met: a cut is whole bars, so this one would open with the previous phrase's last
        # note before the upbeat. The window from the bar after severs the upbeat (the pickup
        # signal), so a piece whose phrases all start mid-bar yields a clean cut only at bar 1.
        return Part("phraseStart", 0.5, f"the phrase starts inside bar {low} with an upbeat, but the bar opens with the end of "
                                        f"the phrase before it: a cut of whole bars cannot start at the upbeat")
    b0, b1 = bass_at_downbeat(before), bass_at_downbeat(here)
    if b0 is not None and b1 is not None and b0 != b1:
        return Part("phraseStart", 0.3, f"only the bass changing at bar {low}: in this repertoire it changes on most downbeats, so alone it marks no phrase")
    return Part("phraseStart", 0.0, f"mid-phrase: nothing marks a start at bar {low}")


def pickup(bars: list[Bar], low: int) -> Part:
    """Adversary 5: notes before the start that lead into it belong to its phrase."""
    melody = melody_staff(bars)
    if low == 1:
        return Part("pickup", 1.0, "the piece's pickup, included" if is_pickup_bar(bars[0]) else "no pickup before bar 1")
    if low == 2 and is_pickup_bar(bars[0]):
        return Part("pickup", 0.0, "bar 1 is the piece's pickup into bar 2: start at bar 1")
    upbeat = upbeat_into_next(bars[low - 2], melody)
    if upbeat is not None:
        return Part("pickup", 0.0, f"an upbeat in bar {low - 1} leads into bar {low}: start at bar {low - 1}")
    return Part("pickup", 1.0, f"no upbeat before bar {low}")


def ending(bars: list[Bar], high: int) -> Part:
    """Adversary 4: the window ends where a phrase does — it resolves, or it is marked as leading onward."""
    bar = bars[high - 1]
    melody = melody_staff(bars)
    last = last_event(bar, melody)
    if last is not None and last.tie_start:
        return Part("ending", 0.0, f"the last note is tied into bar {high + 1}")
    if high == len(bars):
        return Part("ending", 1.0, "the piece's last bar", "resolves")
    if bar.right in DOUBLE_BARS or (high < len(bars) and bars[high].left in DOUBLE_BARS):
        return Part("ending", 1.0, f"{'a repeat sign' if 'repeat' in (bar.right, bars[high].left) else 'a double bar'} closes bar {high}", "resolves")
    if last is not None and last.fermata:
        return Part("ending", 1.0, f"a fermata ends bar {high}", "resolves")
    long_or_rest = ends_long(bar, melody) or ends_on_rest(bar, melody)
    if long_or_rest:
        what = "a long note" if ends_long(bar, melody) else "a rest"
        tonic, minor = tonics(bar.fifths)
        dominant = {(tonic + 7) % 12, (minor + 7) % 12}
        here, before = bass_at_downbeat(bar), bass_at_downbeat(bars[high - 2]) if high >= 2 else None
        # Each tonic with its own dominant: C to Dm in F major is a deceptive cadence, not a close.
        if (here, before) in ((tonic, (tonic + 7) % 12), (minor, (minor + 7) % 12)):
            return Part("ending", 1.0, f"resolves: {what} over a cadence to the tonic (the bass falls a fifth into bar {high})", "resolves")
        if here in (tonic, minor):
            return Part("ending", 0.9, f"resolves: {what} over the tonic in the bass", "resolves")
        if here in dominant:
            return Part("ending", 0.7, f"leads onward: {what} over the dominant (a half cadence)", "leads-onward")
        return Part("ending", 0.7, f"{what} in the melody ends bar {high} (no cadence read from the bass)", "resolves")
    nxt = bars[high] if high < len(bars) else None
    later = ""
    if nxt is not None and (ends_long(nxt, melody) or ends_on_rest(nxt, melody) or nxt.right in DOUBLE_BARS):
        later = f"; the phrase ends in bar {high + 1}"
    return Part("ending", 0.0, f"ends mid-motion: bar {high} closes on a short note and the line continues{later}")


def texture(bars: list[Bar], low: int, high: int, selection: str, staves: int) -> Part:
    """The hands as the parent has them."""
    window = bars[low - 1:high]
    if selection != "both":
        staff = 1 if selection == "right" else 2
        sounding = sum(1 for b in window if b.sounding(staff)) / len(window)
        if not window[0].sounding(staff) or not window[-1].sounding(staff):
            return Part("texture", 0.0, f"the {selection} hand is silent in the first or the last bar")
        return Part("texture", sounding, f"the {selection} hand sounds in {sum(1 for b in window if b.sounding(staff))} of {len(window)} bars")
    if staves < 2:
        sounding = sum(1 for b in window if b.sounding(1) or b.sounding(2)) / len(window)
        return Part("texture", sounding, "one staff")
    both = sum(1 for b in window if b.sounding(1) and b.sounding(2))
    if both == 0:
        silent = "left" if any(b.sounding(1) for b in window) else "right"
        return Part("texture", 0.0, f"the {silent} hand is silent throughout: select the other hand")
    first, last = window[0], window[-1]
    for a, b in ((1, 2), (2, 1)):
        if starts_late(first, a) and not starts_late(first, b) and ends_on_rest(last, b) and not ends_on_rest(last, a):
            return Part("texture", 0.0, "it begins on one hand's rest and ends on the other's")
    return Part("texture", both / len(window), f"both hands sound in {both} of {len(window)} bars")


def length_part(low: int, high: int, wanted: tuple[int, int]) -> Part:
    size = high - low + 1
    if not wanted[0] <= size <= wanted[1]:
        return Part("length", 0.0, f"{size} bars, outside the {wanted[0]}–{wanted[1]} asked for")
    value = {4: 1.0, 8: 1.0, 6: 0.8, 5: 0.7, 7: 0.7}.get(size, 0.6 if size in (2, 3) else 0.6)
    return Part("length", value, f"{size} bars")


# --------------------------------------------------------------------------------------
# the window's demands, from the positions
# --------------------------------------------------------------------------------------


def window_counts(positions: dict, low: int, high: int, selection: str) -> dict[str, int]:
    """Per demand, the located places in the window's bars on the selected staves (each printed note once)."""
    staves = {"both": (0, 1), "right": (0,), "left": (1,)}[selection]
    out: dict[str, int] = {}
    for demand, per_bar in (positions.get("positions") or {}).items():
        n = 0
        for bar in range(low, high + 1):
            counts = per_bar.get(str(bar))
            if counts:
                n += sum(counts[i] for i in staves)
        if n:
            out[demand] = n
    return out


def every_bar(positions: dict, demand: str, low: int, high: int) -> tuple[int, int]:
    """How many of the window's bars the every-bar detector's condition holds in, and how many bars."""
    bars = set((positions.get("everyBar") or {}).get(demand) or [])
    return sum(1 for b in range(low, high + 1) if b in bars), high - low + 1


def window_demands(positions: dict, bars: list[Bar], low: int, high: int, selection: str, staves: int) -> list[str]:
    """
    The demands the window would carry, read as the cut would be measured (conservatively where
    the positions cannot tell): the located demands on its staves; the every-bar ones where every
    bar qualifies (two hands only); the shift where a hand's range over the window passes a fifth;
    the key signature where the window's key has one; compound time where its bars are; hands
    together wherever both staves sound in a two-hand window.
    """
    counts = window_counts(positions, low, high, selection)
    present = {d for d, n in counts.items() if n > 0 and d not in EVERY_BAR}
    present.discard("range.beyond-position")
    present.discard("texture.hands-together")
    if selection == "both" and staves >= 2:
        for demand in EVERY_BAR:
            held, total = every_bar(positions, demand, low, high)
            if held == total:
                present.add(demand)
        window = bars[low - 1:high]
        if any(b.sounding(1) for b in window) and any(b.sounding(2) for b in window):
            present.add("texture.hands-together")
    hands = positions.get("hands") or {}
    for hand in ({"both": ("R", "L"), "right": ("R",), "left": ("L",)}[selection]):
        lows = [hands[str(b)][hand][0] for b in range(low, high + 1) if hand in (hands.get(str(b)) or {})]
        highs = [hands[str(b)][hand][1] for b in range(low, high + 1) if hand in (hands.get(str(b)) or {})]
        if lows and max(highs) - min(lows) > 7:
            present.add("range.beyond-position")
    if bars[low - 1].fifths != 0:
        present.add("key.signature")
    if any(t[1] == 8 and t[0] % 3 == 0 for t in (b.time for b in bars[low - 1:high])):
        present.add("metre.compound")
    return sorted(present)


def window_rule(demand: str, count: int, size: int, table: dict) -> bool:
    """The window rule (E1 item 9): `perBar` reached and at least `minInWindow` (two where the file says none)."""
    rule = table["demands"].get(demand)
    if rule is None or count <= 0:
        return False
    return count >= rule.get("minInWindow", 2) and count / max(size, 1) >= rule["perBar"]


def spread(fraction: float) -> float:
    """Half the bars is the bar the occurrences signal is met at; all of them is full value."""
    if fraction < 0.5:
        return fraction / 0.5 * MET
    return min(1.0, MET + (1.0 - MET) * (fraction - 0.5) / 0.5)


#: The demands whose located places are judged against the piece's first key (`detect.ts`'s module
#: note): after a key change the positions cannot tell a window's, and the cut would.
KEY_RELATIVE = ("pitch.chromatic", "key.signature")


def opportunity(target_demands: list[str], positions: dict, low: int, high: int, selection: str, table: dict,
                bars: list[Bar] | None = None) -> tuple[Part, Part]:
    """The target at the window rule's density, and how many of the window's bars it recurs in."""
    size = high - low + 1
    counts = window_counts(positions, low, high, selection)
    if bars and any(d in KEY_RELATIVE for d in target_demands) and any(b.fifths != bars[0].fifths for b in bars[low - 1:high]):
        why = "the window's key is not the piece's first key: the positions judge its notes against the first key, so only the cut can tell"
        return Part("opportunity", 0.0, why), Part("occurrences", 0.0, why)
    best_opp = Part("opportunity", 0.0, f"no {' or '.join(target_demands)} in the window")
    best_occ = Part("occurrences", 0.0, "the target is in none of the bars")
    for demand in target_demands:
        if demand in EVERY_BAR:
            if selection != "both":
                continue
            held, total = every_bar(positions, demand, low, high)
            opp = Part("opportunity", 1.0 if held == total else held / total * 0.5,
                       f"{demand}: every bar of {total}" if held == total else f"{demand}: {held} of {total} bars (the detector asks every bar)")
            occ = Part("occurrences", held / total, f"{demand} in {held} of {total} bars")
        else:
            n = counts.get(demand, 0)
            rule = table["demands"].get(demand) or {}
            minimum = rule.get("minInWindow", 2)
            met = window_rule(demand, n, size, table)
            opp = Part("opportunity", min(1.0, max(MET, n / (2 * minimum))) if met else min(0.5, n / (2 * max(minimum, 1))),
                       f"{demand}: {n} located in {size} bars ({'meets' if met else 'below'} the window rule: at least "
                       f"{minimum} and {rule.get('perBar', 0)} a bar)")
            per_bar = (positions.get("positions") or {}).get(demand) or {}
            staves = {"both": (0, 1), "right": (0,), "left": (1,)}[selection]
            bars_with = sum(1 for b in range(low, high + 1) if sum((per_bar.get(str(b)) or [0, 0])[i] for i in staves) > 0)
            occ = Part("occurrences", spread(bars_with / size), f"{demand} in {bars_with} of {size} bars")
        if (opp.value, occ.value) > (best_opp.value, best_occ.value):
            best_opp, best_occ = opp, occ
    return best_opp, best_occ


# --------------------------------------------------------------------------------------
# the gates
# --------------------------------------------------------------------------------------


def untaught(demands: list[str], rung: str | None, ancestry: dict, vocabulary: dict) -> list[str]:
    """The window's demands the judging rung has not taught (E0a's ancestry, E0b's lists, as `claims` reads them)."""
    if rung is None or rung not in ancestry:
        return []
    import claims

    taught_by = ancestry[rung]
    return [d for d in demands if not any(at in taught_by for at in claims.taught_at(vocabulary.get(d)))]


def forbidden(parent: dict, demands: list[str]) -> list[str]:
    """What the parent's family contract forbids (a generated parent); a notated piece has no contract."""
    import family_contracts as FC

    family = (((parent.get("drill") or {}).get("generator")) or {}).get("family")
    if not family or family not in FC.contracts():
        return []
    recipe = FC.recipe_of(parent)
    return [r["demand"] for r in FC.selected(FC.contract(family).get("forbids"), recipe) if r["demand"] in demands]


def physical_gate(score, low: int, high: int, selection: str, tempo_bpm: float | None = None) -> list[str]:
    """
    D0's physical gate over the window's spans (a slice of the parent's notation, not a cut file),
    at the tempo the piece is played: a tempo mark with no number (a word alone) is set aside and
    the catalogue's tempo stands in, as the app plays it.
    """
    import family_contracts as FC
    from music21 import tempo

    window = score.measures(low - 1, high, indicesNotNumbers=True)
    if selection != "both":
        keep = 0 if selection == "right" else 1
        for index, staff in enumerate(list(window.parts)):
            if index != keep:
                window.remove(staff)
    for mark in list(window.recurse().getElementsByClass(tempo.MetronomeMark)):
        if mark.number is None and mark.activeSite is not None:
            mark.activeSite.remove(mark)
    if not list(window.recurse().getElementsByClass(tempo.MetronomeMark)) and tempo_bpm and list(window.parts):
        window.parts[0].insert(0, tempo.MetronomeMark(number=float(tempo_bpm)))
    try:
        faults = FC.physical_faults(REPERTOIRE_PHYSICAL, {}, window)
    except (TypeError, ValueError, ZeroDivisionError, KeyError) as error:
        return [f"could not be read: {error}"]
    return [f for f in faults if not f.startswith("fingering:")]


# --------------------------------------------------------------------------------------
# a window, scored
# --------------------------------------------------------------------------------------


@dataclass
class Scored:
    parent: str
    low: int
    high: int
    selection: str
    parts: list[Part]
    demands: list[str]
    counts: dict[str, int]
    untaught: list[str]
    forbidden: list[str]
    physical: list[str] | None = None
    #: The parent's level, carried for the reviewer to read beside the score: never in it, never in the ranking.
    level: float | None = None

    @property
    def score(self) -> float:
        return round(sum(WEIGHTS[p.signal][0] * p.value for p in self.parts), 3)

    @property
    def refused_by(self) -> list[str]:
        out = []
        if self.untaught:
            out.append("untaught")
        if self.forbidden:
            out.append("forbidden")
        if self.physical:
            out.append("physical")
        return out

    @property
    def meets_every_signal(self) -> bool:
        return not self.refused_by and self.physical is not None and all(p.fired for p in self.parts)

    def gates(self) -> list[dict]:
        rows = [{"signal": "untaught", "passed": not self.untaught,
                 "detail": ("untaught at the judging rung: " + ", ".join(self.untaught)) if self.untaught else "nothing untaught at the judging rung"},
                {"signal": "forbidden", "passed": not self.forbidden,
                 "detail": ("forbidden by the family contract: " + ", ".join(self.forbidden)) if self.forbidden else "no contract forbids anything here"}]
        if self.physical is None:
            rows.append({"signal": "physical", "passed": None, "detail": "not checked (below the candidates the gate reads)"})
        else:
            rows.append({"signal": "physical", "passed": not self.physical,
                         "detail": "; ".join(self.physical) if self.physical else "within D0's limits for repertoire: span, leaps, rate, repeats, register"})
        return rows


def score_window(ctx: "ParentContext", low: int, high: int, selection: str, target_demands: list[str], wanted: tuple[int, int],
                 table: dict, rung: str | None, ancestry: dict, vocabulary: dict) -> Scored:
    """Every signal and gate but the physical one, for one window. Reads no level."""
    opp, occ = opportunity(target_demands, ctx.positions, low, high, selection, table, ctx.bars)
    parts = [
        opp,
        occ,
        phrase_start(ctx.bars, low),
        ending(ctx.bars, high),
        pickup(ctx.bars, low),
        texture(ctx.bars, low, high, selection, ctx.staves),
        length_part(low, high, wanted),
    ]
    demands = window_demands(ctx.positions, ctx.bars, low, high, selection, ctx.staves)
    return Scored(ctx.entry["id"], low, high, selection, parts, demands,
                  window_counts(ctx.positions, low, high, selection),
                  untaught(demands, rung, ancestry, vocabulary), forbidden(ctx.entry, demands),
                  level=ctx.entry.get("level"))


def rank_key(one: Scored) -> tuple:
    """Highest score first; then the parent and the bar, for a stable order. No level, ever."""
    return (-one.score, one.parent, one.low, one.high, one.selection)


# --------------------------------------------------------------------------------------
# parents
# --------------------------------------------------------------------------------------


@dataclass
class ParentContext:
    entry: dict
    path: Path
    sha: str
    bars: list[Bar]
    positions: dict
    staves: int


def crossing(bars: list[Bar], low: int, high: int) -> bool:
    """A repeat sign on a barline inside the window, a first-or-second ending over it, or a jump in it: never proposed."""
    for number in range(low, high + 1):
        bar = bars[number - 1]
        if bar.ending or bar.jump:
            return True
        if bar.left == "repeat" and number != low:
            return True
        if bar.right == "repeat" and number != high:
            return True
    return False


def load_parent(entry: dict, content: Path, positions: dict) -> ParentContext | str:
    from notation import read_musicxml

    misread = ((entry.get("measurement") or {}).get("misread") or {}).get("why")
    if misread:
        # The build marks a file whose upper staff is written in the bass clef (`build.clef_misread`):
        # the detectors read it as treble, so a window's clef and ledger readings are not the page's,
        # and a one-hand cut of that staff keeps the edition's clef — the Grieg cut of bars 29-32 put
        # E5 five ledger lines above a bass staff (E1, read on the Score screen).
        return f"the detectors misread its clef ({misread})"
    path = content / entry["file"]
    if not path.is_file():
        return "its file was not built"
    sha = hashlib.sha256(path.read_bytes()).hexdigest()
    found = positions.get(sha)
    if found is None:
        return "no positions for its file: run the content build (it writes build/positions-cache.json)"
    text = read_musicxml(path)
    if text is None:
        return "the file could not be read"
    try:
        bars = read_bars(text)
    except ET.ParseError as error:
        return f"the file could not be parsed: {error}"
    if len(bars) != int(found.get("printedBars") or 0):
        return f"the file prints {len(bars)} bars and the app's model {found.get('printedBars')}: the positions cannot be placed"
    staves = int((entry.get("notation") or {}).get("staves") or (2 if any(b.sounding(2) for b in bars) else 1))
    return ParentContext(entry, path, sha, bars, found, staves)


def parents_of(catalog: list[dict], only: list[str] | None) -> list[dict]:
    """Every song with a built, measured score (or the ones named with --of)."""
    out = []
    for entry in catalog:
        if only:
            if entry["id"] in only and entry.get("file"):
                out.append(entry)
            continue
        if entry.get("type") != "song" or not entry.get("file"):
            continue
        if (entry.get("measurement") or {}).get("status") != "measured":
            continue
        out.append(entry)
    return out


# --------------------------------------------------------------------------------------
# a run
# --------------------------------------------------------------------------------------


def load_seed(path: Path = SEED_FILE) -> dict:
    """The seed list of teaching repertoire, or an empty one where the file is absent."""
    return json.loads(path.read_text(encoding="utf-8")) if path.is_file() else {"works": []}


def seed_works_for(target_demands: list[str], seed: dict, skills: dict, demands: dict) -> list[dict]:
    """
    The seed's works known for a concept that names one of the target's demands, in the file's
    order: `claims.concepts_naming`, the reading the rung-claims report makes of a lesson's
    concepts (a concept in `CONCEPT_DEMANDS`, or a skill whose opportunity is that one demand).
    """
    import claims

    naming = claims.concepts_naming(skills, demands)
    concepts: set[str] = set()
    for demand in target_demands:
        concepts |= naming.get(demand, set())
    return [work for work in seed.get("works", []) if concepts & set(work.get("concepts", []))]


def seeded_parents(catalog: list[dict], works: list[dict]) -> dict[str, dict]:
    """
    `{parent id: the seed work}` for every catalogue entry whose composition key a seed work lists
    (`provenance.composition`, the build's identity), a variant through the entry it is a variant of.
    """
    keys = {key: work for work in works for key in work.get("catalogue", [])}
    by_id = {entry["id"]: entry for entry in catalog}
    out: dict[str, dict] = {}
    for entry in catalog:
        composition = (entry.get("provenance") or {}).get("composition") or ""
        if composition.startswith("variant-of:"):
            parent = by_id.get(composition[len("variant-of:"):]) or {}
            composition = (parent.get("provenance") or {}).get("composition") or ""
        if composition in keys:
            out[entry["id"]] = keys[composition]
    return out


def seed_note(work: dict | None) -> dict | None:
    """What a candidate row says of its parent's place in the seed list: the work and what it is known for, or nothing."""
    if work is None:
        return None
    return {"work": work["work"], "composer": work["composer"], "concepts": work["concepts"], "known": work["known"],
            "confidence": work["confidence"], "why": "a proposal source (E28): reputation orders the shortlist; the signals and gates decide"}


def acceptance_order(scored: list[Scored], seeded: set[str]) -> list[Scored]:
    """
    The order a run considers its ranked windows for acceptance: the windows meeting every signal,
    then the rest; within each, a seeded parent's windows first (E28); each group by score, as ranked.
    A window a gate refuses is never considered. The seed orders and nothing else: the same windows,
    the same scores.
    """
    out: list[Scored] = []
    for meeting in (True, False):
        for first in (True, False):
            out.extend(one for one in scored
                       if not one.refused_by and all(p.fired for p in one.parts) == meeting and (one.parent in seeded) == first)
    return out


def target_demands_of(target: str, skills: dict, demands: dict) -> list[str]:
    if target in demands:
        return [target]
    if target in skills and isinstance(skills[target].get("opportunity"), list):
        return list(skills[target]["opportunity"])
    raise SystemExit(f"--for {target!r} is neither a vocabulary demand nor a skill with an opportunity")


def default_rung(target_demands: list[str], demands: dict) -> str | None:
    import claims

    for demand in target_demands:
        taught = claims.taught_at(demands.get(demand))
        if taught:
            return taught[0]
    return None


def neighbourhood(ctx: ParentContext, best: Scored, target_demands: list[str], table: dict, rung: str | None,
                  ancestry: dict, vocabulary: dict) -> list[dict]:
    """Every window within `NEIGHBOURHOOD` bars of each boundary, scored, so the view re-scores a moved boundary live."""
    rows = []
    last = len(ctx.bars)
    for low in range(max(1, best.low - NEIGHBOURHOOD), min(last, best.low + NEIGHBOURHOOD) + 1):
        for high in range(max(low, best.high - NEIGHBOURHOOD), min(last, best.high + NEIGHBOURHOOD) + 1):
            size = high - low + 1
            if not ALLOWED_BARS[0] <= size <= ALLOWED_BARS[1]:
                continue
            if crossing(ctx.bars, low, high):
                rows.append({"fromBar": low, "toBar": high, "crossing": True})
                continue
            one = score_window(ctx, low, high, best.selection, target_demands, ALLOWED_BARS, table, rung, ancestry, vocabulary)
            rows.append({"fromBar": low, "toBar": high, "score": one.score,
                         "parts": [{"signal": p.signal, "value": round(p.value, 3), "fired": p.fired, "detail": p.detail} for p in one.parts],
                         "untaught": one.untaught, "forbidden": one.forbidden, "demands": one.demands})
    return rows


def candidate_row(one: Scored, ctx: ParentContext, target: str, rung: str | None, target_demands: list[str], table: dict,
                  ancestry: dict, vocabulary: dict, run_id: str) -> dict:
    entry = ctx.entry
    measurement = entry.get("measurement") or {}
    import excerpts as X

    return {
        "id": f"{run_id}:{entry['id']}:b{one.low}-{one.high}:{one.selection}",
        "of": entry["id"],
        "title": entry.get("title"),
        "fromBar": one.low,
        "toBar": one.high,
        "selection": one.selection,
        "excerptId": X.excerpt_id(entry["id"], one.low, one.high, one.selection),
        "targets": [target],
        "score": one.score,
        "parts": [p.row() for p in one.parts],
        "gates": one.gates(),
        "refusedBy": one.refused_by,
        "meetsEverySignal": one.meets_every_signal,
        "demands": one.demands,
        "counts": one.counts,
        "parent": {
            "file": entry["file"],
            "sha256": ctx.sha,
            "bars": len(ctx.bars),
            "staves": ctx.staves,
            "level": entry.get("level"),
            "levelSource": entry.get("levelSource"),
            "demands": entry.get("demands"),
            "established": measurement.get("established"),
            "untaught": untaught(entry["demands"], rung, ancestry, vocabulary) if isinstance(entry.get("demands"), list) else [],
            "tempoBpm": entry.get("tempoBpm"),
            "keySig": entry.get("keySig"),
            "timeSig": entry.get("timeSig") or ", ".join((entry.get("notation") or {}).get("times") or []),
            "source": entry.get("source"),
        },
        "neighbourhood": neighbourhood(ctx, one, target_demands, table, rung, ancestry, vocabulary),
    }


def overlaps(a: Scored, b: Scored) -> bool:
    if a.parent != b.parent or a.selection != b.selection:
        return False
    common = min(a.high, b.high) - max(a.low, b.low) + 1
    return common > 0 and common * 2 >= min(a.high - a.low + 1, b.high - b.low + 1)


def propose(catalog: list[dict], curriculum: dict, content: Path, target: str, rung: str | None = None,
            only: list[str] | None = None, wanted: tuple[int, int] = DEFAULT_BARS, positions_path: Path = POSITIONS,
            keep: int = KEEP, seed_path: Path = SEED_FILE) -> dict:
    """One run: every window of every parent scored for `target`, judged at `rung`; the run's section."""
    import claims
    from music21 import converter

    skills, vocabulary = claims.load_vocabulary()
    target_demands = target_demands_of(target, skills, vocabulary)
    seeded = seeded_parents(catalog, seed_works_for(target_demands, load_seed(seed_path), skills, vocabulary))
    rung = rung or default_rung(target_demands, vocabulary)
    ancestry = claims.rung_ancestry(curriculum)
    if rung is not None and rung not in ancestry:
        raise SystemExit(f"--rung {rung!r} is not a rung of the curriculum")
    table = json.loads(DENSITY_FILE.read_text(encoding="utf-8"))
    cache = json.loads(positions_path.read_text(encoding="utf-8")) if positions_path.is_file() else {}
    positions = cache.get("files") or {}
    scored: list[Scored] = []
    contexts: dict[str, ParentContext] = {}
    skipped: list[str] = []
    windows = crossings = 0
    for entry in parents_of(catalog, only):
        ctx = load_parent(entry, content, positions)
        if isinstance(ctx, str):
            skipped.append(f"{entry['id']}: {ctx}")
            continue
        contexts[entry["id"]] = ctx
        selections = list(PROPOSED_SELECTIONS) if ctx.staves >= 2 else ["both"]
        last = len(ctx.bars)
        for size in range(wanted[0], wanted[1] + 1):
            for low in range(1, last - size + 2):
                high = low + size - 1
                if crossing(ctx.bars, low, high):
                    crossings += 1
                    continue
                for selection in selections:
                    windows += 1
                    one = score_window(ctx, low, high, selection, target_demands, wanted, table, rung, ancestry, vocabulary)
                    if one.parts[0].value <= 0:
                        continue  # no target at all: not a candidate for it
                    scored.append(one)
    scored.sort(key=rank_key)
    # The physical gate reads music21: only the leading windows that pass the other gates.
    parsed: dict[str, object] = {}
    accepted: list[Scored] = []
    checked = 0
    # Two passes: the windows meeting every weighted signal first (a higher-scoring overlapping
    # window that misses one never hides them), then the rest; each pass by score, a seeded
    # parent's windows first within it (E28: the seed orders, and admits nothing).
    for one in acceptance_order(scored, set(seeded)):
        if any(overlaps(one, kept) for kept in accepted):
            continue
        if checked >= PHYSICAL_CHECKED or len(accepted) >= keep:
            break
        if one.parent not in parsed:
            parsed[one.parent] = converter.parse(str(contexts[one.parent].path))
        one.physical = physical_gate(parsed[one.parent], one.low, one.high, one.selection, contexts[one.parent].entry.get("tempoBpm"))
        checked += 1
        if not one.physical:
            accepted.append(one)
    run_id = f"{target}@{rung or 'none'}" + (f"@{'+'.join(only)}" if only else "")
    refused: dict[str, Scored] = {}
    for one in scored:
        if one.refused_by and one.parent not in refused:
            refused[one.parent] = one
    physical_refused = [one for one in scored if one.physical]
    return {
        "for": target,
        "demands": target_demands,
        "rung": rung,
        "of": only,
        "bars": list(wanted),
        "weights": {k: {"weight": w, "why": why} for k, (w, why) in WEIGHTS.items()},
        "met": MET,
        "gates": list(GATES),
        "rules": {d: table["demands"].get(d) for d in target_demands},
        "scanned": {"parents": len(contexts), "windows": windows, "crossing": crossings, "skipped": skipped[:50],
                    "skippedCount": len(skipped), "withTarget": len(scored)},
        "candidates": [dict(candidate_row(one, contexts[one.parent], target, rung, target_demands, table, ancestry, vocabulary, run_id),
                            seed=seed_note(seeded.get(one.parent)))
                       for one in accepted],
        "seeded": sorted(seeded),
        "refused": [
            {"of": one.parent, "title": contexts[one.parent].entry.get("title"), "fromBar": one.low, "toBar": one.high,
             "selection": one.selection, "score": one.score, "refusedBy": one.refused_by, "untaught": one.untaught,
             "forbidden": one.forbidden, "physical": one.physical, "parts": [p.row() for p in one.parts]}
            for one in sorted(refused.values(), key=rank_key)[:30]
        ] + [
            {"of": one.parent, "title": contexts[one.parent].entry.get("title"), "fromBar": one.low, "toBar": one.high,
             "selection": one.selection, "score": one.score, "refusedBy": ["physical"], "physical": one.physical,
             "parts": [p.row() for p in one.parts]}
            for one in physical_refused[:10]
        ],
        "runId": run_id,
    }


def write_run(run: dict, content: Path, candidates: Path = CANDIDATES) -> tuple[Path, Path]:
    """The run's section in `build/excerpts/candidates.json` (other runs kept) and the view's projection."""
    import review

    existing = json.loads(candidates.read_text(encoding="utf-8")) if candidates.is_file() else {"v": 1, "runs": {}}
    existing.setdefault("runs", {})[run["runId"]] = run
    candidates.parent.mkdir(parents=True, exist_ok=True)
    candidates.write_text(json.dumps(existing, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    projection = review.dev_root(content) / PROJECTION
    projection.parent.mkdir(parents=True, exist_ok=True)
    with projection.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump({"v": 1, "runs": list(existing["runs"].values())}, handle, ensure_ascii=False, separators=(",", ":"))
        handle.write("\n")
    return candidates, projection


# --------------------------------------------------------------------------------------
# the hypothesis the brief hands over: do the signals agree with the edition's own marks?
# --------------------------------------------------------------------------------------


def edition_marks(bars: list[Bar]) -> tuple[set[int], set[int]]:
    """
    The printed bars an edition marks as a phrase start and as a phrase end: a double bar or repeat
    sign, a rehearsal mark, a slur of two bars or more (its first and last bar), a fermata, a
    breath mark. Starts are bar numbers a phrase begins at; ends, bar numbers one ends in.
    """
    starts: set[int] = {1}
    ends: set[int] = {len(bars)}
    for bar in bars:
        n = bar.number
        if bar.left in DOUBLE_BARS or bar.rehearsal:
            starts.add(n)
        if bar.right in DOUBLE_BARS:
            ends.add(n)
            starts.add(n + 1)
        if bar.fermata or bar.breath:
            ends.add(n)
            starts.add(n + 1)
    open_slurs: dict[int, int] = {}
    for bar in bars:
        melody = bar.notes.get(1) or bar.notes.get(2) or []
        for event in melody:
            if event.slur_start:
                open_slurs.setdefault(0, bar.number)
            if event.slur_stop and 0 in open_slurs:
                begun = open_slurs.pop(0)
                if bar.number - begun >= 1:
                    starts.add(begun)
                    ends.add(bar.number)
    return {s for s in starts if 1 <= s <= len(bars)}, {e for e in ends if 1 <= e <= len(bars)}


def edition_check(catalog: list[dict], content: Path, parents: list[str], target: str = "interval.step") -> dict:
    """
    The brief's first hypothesis, run before the view: the top candidate of each named parent (any
    target that most bars carry, judged at no rung, so the phrase signals decide), its start and end
    against the edition's marks, and by how many bars they miss.
    """
    import claims

    _skills, vocabulary = claims.load_vocabulary()
    table = json.loads(DENSITY_FILE.read_text(encoding="utf-8"))
    cache = json.loads(POSITIONS.read_text(encoding="utf-8")) if POSITIONS.is_file() else {}
    positions = cache.get("files") or {}
    rows = []
    for entry in [e for e in catalog if e["id"] in parents]:
        ctx = load_parent(entry, content, positions)
        if isinstance(ctx, str):
            rows.append({"of": entry["id"], "skipped": ctx})
            continue
        starts, ends = edition_marks(ctx.bars)
        best: Scored | None = None
        for size in range(DEFAULT_BARS[0], DEFAULT_BARS[1] + 1):
            for low in range(1, len(ctx.bars) - size + 2):
                high = low + size - 1
                if crossing(ctx.bars, low, high):
                    continue
                one = score_window(ctx, low, high, "both" if ctx.staves >= 2 else "both", [target], DEFAULT_BARS, table, None, {}, vocabulary)
                if best is None or rank_key(one) < rank_key(best):
                    best = one
        if best is None:
            rows.append({"of": entry["id"], "skipped": "no window"})
            continue
        miss_start = min((abs(best.low - s) for s in starts), default=None)
        miss_end = min((abs(best.high - e) for e in ends), default=None)
        rows.append({"of": entry["id"], "title": entry.get("title"), "window": [best.low, best.high], "score": best.score,
                     "phraseStart": best.parts[2].detail, "ending": best.parts[3].detail,
                     "editionStarts": sorted(starts), "editionEnds": sorted(ends),
                     "startMissesBy": miss_start, "endMissesBy": miss_end})
    return {"target": target, "rows": rows,
            "startAgrees": sum(1 for r in rows if r.get("startMissesBy") == 0),
            "endAgrees": sum(1 for r in rows if r.get("endMissesBy") == 0),
            "parents": sum(1 for r in rows if "window" in r)}


# --------------------------------------------------------------------------------------
# the command
# --------------------------------------------------------------------------------------


def parse_bars(text: str) -> tuple[int, int]:
    low, _sep, high = text.partition("..")
    wanted = (int(low), int(high or low))
    if not (ALLOWED_BARS[0] <= wanted[0] <= wanted[1] <= ALLOWED_BARS[1]):
        raise argparse.ArgumentTypeError(f"--bars must lie within {ALLOWED_BARS[0]}..{ALLOWED_BARS[1]}")
    return wanted


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="excerpts.py propose", description=__doc__.split("\n\n")[0])
    parser.add_argument("--for", dest="target", help="a vocabulary demand or skill id")
    parser.add_argument("--of", action="append", help="a parent's catalogue id (repeatable); default every measured song")
    parser.add_argument("--rung", help="the rung judging what is taught (default: the first rung teaching the target)")
    parser.add_argument("--bars", type=parse_bars, default=DEFAULT_BARS, help="window lengths, e.g. 4..8 (2..16 allowed)")
    parser.add_argument("--content", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--keep", type=int, default=KEEP)
    parser.add_argument("--edition-check", action="store_true", help="the top window of each --of parent against the edition's marks")
    args = parser.parse_args(argv)
    catalog = json.loads((args.content / "catalog.json").read_text(encoding="utf-8"))
    if args.edition_check:
        result = edition_check(catalog, args.content, args.of or [], args.target or "interval.step")
        print(json.dumps(result, indent=1, ensure_ascii=False))
        return 0
    if not args.target:
        parser.error("say --for <demand or skill id>")
    curriculum = json.loads((args.content / "curriculum.json").read_text(encoding="utf-8"))
    run = propose(catalog, curriculum, args.content, args.target, args.rung, args.of, args.bars, keep=args.keep)
    candidates, projection = write_run(run, args.content)
    print(f"{run['runId']}: {run['scanned']['parents']} parent(s), {run['scanned']['windows']} window(s) "
          f"({run['scanned']['crossing']} across a repeat, never proposed), {run['scanned']['withTarget']} with the target; "
          f"{len(run['candidates'])} candidate(s), {sum(1 for c in run['candidates'] if c['meetsEverySignal'])} meeting every signal; "
          f"{run['scanned']['skippedCount']} parent(s) skipped")
    for row in run["candidates"][:12]:
        fired = ", ".join(p["signal"] for p in row["parts"] if not p["fired"]) or "every signal met"
        print(f"  {row['score']:6.2f}  {row['of']} bars {row['fromBar']}–{row['toBar']} {row['selection']}  ({fired})")
    print(f"wrote {candidates} and {projection}")
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
