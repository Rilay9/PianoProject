#!/usr/bin/env python3
"""
The musical evaluator the Python families that promise music share (D3; G9's second half,
Part 15 §5, §9-§12).

**One definition, ported and held equal.** The parts are D1's: `app/src/engine/sightReadingScore.ts`
scores the sight-reading phrase for its beginning, arrival, contour, motif, rests, harmonic
agreement and leaps, each a pure function of the written notes. They are ported here rather than
called through a bridge, for two reasons: the study's semantics differ from the sight-reading
phrase's (several phrases, minor keys, a harmony the study declares rather than one inferred from
the left hand's first note), and the TypeScript module belongs to the sight-reading generator,
which D3 may not change — so a bridge would call a scorer that cannot say what a study needs.
Each ported part is held equal to its TypeScript twin on a shared fixture of constructed phrases
(`tests/fixtures/evaluator_twins.json`, read by `tests/test_musical_evaluator.py` and by
`app/tests/unit/studyEvaluatorTwin.test.ts`), so the two cannot drift apart unseen.

**The study's semantics, stated.** A study is 8, 12 or 16 bars in phrases of four, each ending on
a cadence, the last an authentic one, in a major or a minor key, over a progression the study
declares. So, for a `Model` that carries phrases:

- *degrees* are read in the key's own scale: the major scale, or the natural minor, with a raised
  degree (the minor's leading tone and raised sixth, the sight-reading generator's raised fourth)
  read as the degree it raises — D1's rule, which the minor needs for its leading tone;
- *the harmony* is the declared progression, a chord (root degree, seventh or not) for each part
  of each bar; a note is judged against the chord sounding at its onset, never against a chord
  guessed from the left hand;
- *arrival* is judged per phrase: D1's rhythm grades on the phrase's final event, a close judged
  against the phrase's own cadence (the tonic, or the third or fifth, at an authentic cadence; a
  tone of the dominant at a half cadence) and the approach (into a tone of the cadence chord by
  step, or from a tone of the chord under the note before); the phrases' mean, the last counting
  twice;
- *cadence* is a part of its own: each phrase's declared cadence present in the progression (the
  dominant, then the tonic, at an authentic cadence; the dominant at a half cadence) and its
  melody closing on a tone of the cadence chord — the tonic at an authentic cadence, the third or
  fifth counting a half; a cadence on a note outside the chord is wrong, and the musical gate
  refuses it whatever the total;
- *motif* is D1's rule on the study's opening cell (`study_motif`): the first bar's rhythm under
  other pitches, or its shape at another pitch, in a bar the grammar does not restate; and a bar
  the grammar restates (the consequent's opening, the return) is never counted as an exact
  repeat: the grammar's own restatement is form, and only a repeat beyond it is the degeneracy
  the part costs;
- *contour*, *rests*, *beginning*, *harmony* and *leaps* are D1's functions as they stand, the
  harmony read from the declaration: contour is read per four bars, which are the study's phrases;
  a rest closing a two-bar group closes a phrase too.

The groove and style families are not evaluated here: the evaluator judges phrase shape, not
idiom (Part 15 §17), and `family_contracts.musical_gate` says so for them.

**The contract's version** (`VERSION`, D5): the microscope prints it beside every verdict it shows
(`review.musical_verdict`), so two totals for the same item from different evaluators are never
read as one fact. It is provenance for the displayed assessment, never part of an item's identity
(a review decision binds to the material, `review.current_identity`), and never a hearing.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field, replace
from typing import Callable, Iterable

#: The evaluator's contract version. Bump it in the same change as anything that can move a total
#: or a wrong cadence for the same written notes: a part's function, the parts a study is scored on,
#: a weight (`WEIGHTS`, `STUDY_WEIGHTS`), the cadence semantics, how a page is read into a `Model`.
#: The floor is the contract row's (`family_contracts.json`, `study.musical.floor`) and travels
#: beside the verdict on its own; a change to it moves a pass, never a total.
VERSION = 1

#: Divisions of a quarter, as the app's writer (`musicXmlWriter.ts` `DIVISIONS`) counts them: the
#: twin fixture's durations are in these, so both implementations read the same numbers.
DIVISIONS = 12

MAJOR = (0, 2, 4, 5, 7, 9, 11)
#: The natural minor; its raised sixth and seventh are read as the degrees they raise.
MINOR = (0, 2, 3, 5, 7, 8, 10)


# --------------------------------------------------------------------------------------
# the model
# --------------------------------------------------------------------------------------


@dataclass(frozen=True)
class Metre:
    beats: int
    beat_type: int


@dataclass
class WrittenNote:
    """One written note or rest of a line (the TypeScript `WrittenNote`)."""

    midi: int | None
    duration: float
    tie: str | None = None
    tuplet: bool = False
    chord: bool = False


@dataclass
class PhraseNote:
    """One written note or rest of the melody, placed in its bar (the TypeScript `PhraseNote`)."""

    bar: int
    at: float
    duration: float
    midi: int | None
    tie: str | None
    tuplet: bool
    designed: bool


@dataclass(frozen=True)
class Chord:
    """A chord of the declared progression: its root as a scale degree (0 = I) and whether it has a seventh."""

    root: int
    seventh: bool = False

    def tones(self) -> set[int]:
        out = {self.root % 7, (self.root + 2) % 7, (self.root + 4) % 7}
        if self.seventh:
            out.add((self.root + 6) % 7)
        return out


@dataclass(frozen=True)
class Phrase:
    """One phrase of a study: bars `start` to `end` (exclusive) and the cadence that closes it."""

    start: int
    end: int
    cadence: str  # "authentic" | "half"


@dataclass
class Model:
    """
    What the parts read. D1's `PhraseModel` plus what a study adds: the key's scale, the declared
    harmony per bar (a list of chords sharing the bar equally; empty where none), the phrases and
    the bars the grammar restates.
    """

    tonic: int
    scale: tuple[int, ...]
    metre: Metre
    bars: int
    melody: list[PhraseNote]
    harmony: list[list[Chord]]
    max_leap: int
    rests_allowed: bool
    #: D1's level, where the model is a sight-reading phrase; None for a study.
    level: int | None = None
    phrases: list[Phrase] = field(default_factory=list)
    restated: frozenset[int] = frozenset()
    _sounded: list | None = field(default=None, repr=False, compare=False)


@dataclass
class Sounded:
    bar: int
    at: float
    onset: float
    duration: float
    midi: int
    step: int
    tied_over: bool


def tonic_of_fifths(fifths: int) -> int:
    return (fifths * 7) % 12


def scale_step(midi: int, tonic: int, scale: tuple[int, ...] = MAJOR) -> int:
    """Scale steps from the tonic of MIDI's lowest octave: a diatonic position, so a third is 2 whatever its semitones."""
    relative = midi - tonic
    octave = math.floor(relative / 12)
    pitch_class = relative % 12
    if pitch_class in scale:
        degree = scale.index(pitch_class)
    else:
        # A raised degree is read as the degree it raises (D1's rule; the minor's leading tone).
        degree = scale.index(pitch_class - 1)
    return octave * 7 + degree


def degree_of(midi: int, tonic: int, scale: tuple[int, ...] = MAJOR) -> int:
    return scale_step(midi, tonic, scale) % 7


def is_compound(metre: Metre) -> bool:
    return metre.beat_type == 8 and metre.beats % 3 == 0


def bar_length(metre: Metre) -> float:
    return metre.beats * DIVISIONS * 4 / metre.beat_type


def felt_beat_of(metre: Metre) -> float:
    return DIVISIONS * 1.5 if is_compound(metre) else DIVISIONS * 4 / metre.beat_type


def arrival_beat(metre: Metre) -> float:
    if metre.beat_type >= 8 and not is_compound(metre):
        return max(felt_beat_of(metre), DIVISIONS)
    return felt_beat_of(metre)


def _js_round(x: float) -> int:
    return math.floor(x + 0.5)


def strong_offsets(metre: Metre) -> list[float]:
    bar = bar_length(metre)
    beat = felt_beat_of(metre)
    return [0.0, bar / 2] if _js_round(bar / beat) == 4 else [0.0]


def place_melody(bars: Iterable[Iterable[WrittenNote]]) -> list[PhraseNote]:
    out: list[PhraseNote] = []
    for bar, notes in enumerate(bars):
        at = 0.0
        for note in notes:
            if note.chord:
                continue
            out.append(PhraseNote(bar, at, note.duration, note.midi, note.tie, bool(note.tuplet),
                                  note.midi is None and at == 0))
            at += note.duration
    return out


def harmony_from_left_hand(bars: list[list[WrittenNote]], tonic: int, count: int,
                           scale: tuple[int, ...] = MAJOR) -> list[list[Chord]]:
    """D1's harmony: each bar's chord from the scale degree of the left hand's first note."""
    out: list[list[Chord]] = []
    for bar in range(count):
        notes = bars[bar] if bar < len(bars) else []
        root = next((n for n in notes if n.midi is not None and not n.chord), None)
        out.append([] if root is None else [Chord(degree_of(root.midi, tonic, scale))])
    return out


def phrase_model(level: int, fifths: int, metre: Metre, melody: list[list[WrittenNote]],
                 left: list[list[WrittenNote]] | None, max_leap: int, rests_allowed: bool,
                 harmony: list[int | None] | None = None) -> Model:
    """D1's `phraseModel`: a sight-reading phrase, one phrase, major, harmony from the left hand (or given)."""
    bars = len(melody)
    tonic = tonic_of_fifths(fifths)
    if harmony is not None:
        chords = [[] if h is None else [Chord(h)] for h in harmony]
    elif left is not None:
        chords = harmony_from_left_hand(left, tonic, bars)
    else:
        chords = [[] for _ in range(bars)]
    return Model(tonic=tonic, scale=MAJOR, metre=metre, bars=bars, melody=place_melody(melody),
                 harmony=chords, max_leap=max_leap, rests_allowed=rests_allowed, level=level)


def chord_at(p: Model, bar: int, at: float) -> Chord | None:
    """The declared chord sounding at an offset of a bar (the bar split equally among its chords)."""
    if bar < 0 or bar >= len(p.harmony):
        return None
    chords = p.harmony[bar]
    if not chords:
        return None
    share = bar_length(p.metre) / len(chords)
    index = min(len(chords) - 1, int(at // share + 1e-9))
    return chords[index]


def _first_chord(p: Model, bar: int) -> Chord | None:
    return p.harmony[bar][0] if 0 <= bar < len(p.harmony) and p.harmony[bar] else None


def _last_chord(p: Model, bar: int) -> Chord | None:
    return p.harmony[bar][-1] if 0 <= bar < len(p.harmony) and p.harmony[bar] else None


def sounded(p: Model) -> list[Sounded]:
    """The melody's sounded events, each tie chain one event."""
    if p._sounded is not None:
        return p._sounded
    bar = bar_length(p.metre)
    out: list[Sounded] = []
    open_: Sounded | None = None
    for note in p.melody:
        if note.midi is None:
            open_ = None
            continue
        continues = note.tie in ("stop", "both")
        if continues and open_ is not None and open_.midi == note.midi:
            open_.duration += note.duration
            open_.tied_over = True
            if note.tie == "stop":
                open_ = None
            continue
        event = Sounded(note.bar, note.at, note.bar * bar + note.at, note.duration, note.midi,
                        scale_step(note.midi, p.tonic, p.scale), False)
        out.append(event)
        open_ = event if note.tie in ("start", "both") else None
    p._sounded = out
    return out


def _deg(p: Model, midi: int) -> int:
    return degree_of(midi, p.tonic, p.scale)


# --------------------------------------------------------------------------------------
# D1's parts, ported (each held equal to its TypeScript twin by the shared fixture)
# --------------------------------------------------------------------------------------


def beginning(p: Model) -> float | None:
    events = sounded(p)
    if not events:
        return None
    first = events[0]
    chord = _first_chord(p, 0) or Chord(0)
    tone = 0.5 if _deg(p, first.midi) in chord.tones() else 0.0
    on_the_beat = 0.5 if first.bar == 0 and first.at == 0 else 0.0
    return tone + on_the_beat


def _final_event(p: Model) -> Sounded | None:
    events = sounded(p)
    last = events[-1] if events else None
    return last if last is not None and last.bar == p.bars - 1 else None


def arrives(p: Model) -> bool:
    final = _final_event(p)
    if final is None:
        return False
    return final.at == 0 or final.duration >= arrival_beat(p.metre)


def lands_on_beat_one(p: Model) -> bool:
    final = _final_event(p)
    return final is not None and final.at == 0


def arrives_on_strong_beat(p: Model) -> bool:
    final = _final_event(p)
    if final is None:
        return False
    return final.at == 0 or (final.at in strong_offsets(p.metre) and final.duration >= arrival_beat(p.metre))


def ends_on_tonic(p: Model) -> bool:
    events = sounded(p)
    return bool(events) and _deg(p, events[-1].midi) == 0


def arrival_rhythm(p: Model) -> float:
    """D1's rhythm grade of the final event: downbeat 1, a strong beat held 0.9, a beat held 0.7, off the beat held 0.5."""
    final = _final_event(p)
    if final is None:
        return 0.0
    if final.at == 0:
        return 1.0
    if final.duration >= arrival_beat(p.metre):
        if final.at in strong_offsets(p.metre):
            return 0.9
        if final.at % felt_beat_of(p.metre) == 0:
            return 0.7
        return 0.5
    return 0.0


def arrival(p: Model) -> float | None:
    """D1's arrival: three quarters rhythm, a quarter close; from level 5 seven tenths rhythm and the approach."""
    events = sounded(p)
    if not events:
        return None
    last = events[-1]
    rhythm = arrival_rhythm(p)
    degree = _deg(p, last.midi)
    close = 1.0 if degree == 0 else 0.5 if degree in (2, 4) else 0.0
    if (p.level or 0) < 5:
        return 0.75 * rhythm + 0.25 * close
    before = events[-2] if len(events) >= 2 else None
    into = degree in (0, 4)
    from_step = before is not None and abs(last.step - before.step) == 1
    final_chord = _first_chord(p, p.bars - 1) or Chord(0)
    from_chord_tone = before is not None and _deg(p, before.midi) in final_chord.tones()
    approach = 1.0 if into and (from_step or from_chord_tone) else 0.0
    return 0.7 * rhythm + 0.15 * close + 0.15 * approach


TURN = 2


def turns_of(steps: list[int]) -> tuple[int, int]:
    """(significant turns, first direction): a zigzag with a third's hysteresis."""
    if not steps:
        return 0, 0
    start = steps[0]
    direction = 0
    first = 0
    extreme = start
    low = start
    high = start
    turns = 0
    for step in steps[1:]:
        if direction == 0:
            low = min(low, step)
            high = max(high, step)
            if step - low >= TURN:
                direction = 1
                extreme = step
            elif high - step >= TURN:
                direction = -1
                extreme = step
            first = direction
            continue
        if direction == 1:
            if step > extreme:
                extreme = step
            elif extreme - step >= TURN:
                turns += 1
                direction = -1
                extreme = step
        elif step < extreme:
            extreme = step
        elif step - extreme >= TURN:
            turns += 1
            direction = 1
            extreme = step
    return turns, first


def beat_line(p: Model, unit: int | None = None) -> list[int]:
    events = sounded(p)
    bar = bar_length(p.metre)
    beat = felt_beat_of(p.metre)
    out: list[int] = []
    for b in range(p.bars):
        if unit is not None and b // 4 != unit:
            continue
        t = 0.0
        while t < bar:
            time = b * bar + t
            here = next((e for e in events if e.onset <= time < e.onset + e.duration), None)
            if here is not None:
                out.append(here.step)
            t += beat
    return out


def contour_shapes(p: Model) -> list[str]:
    units = max(1, math.ceil(p.bars / 4))
    out = []
    for unit in range(units):
        steps = beat_line(p, unit)
        if not steps or max(steps) - min(steps) < TURN:
            out.append("flat")
            continue
        turns, first = turns_of(steps)
        if turns == 0:
            out.append("ascent" if steps[-1] >= steps[0] else "descent")
        elif turns == 1:
            out.append("arch" if first == 1 else "valley")
        else:
            out.append("wandering")
    return out


def one_contour(p: Model) -> bool:
    return all(shape in ("ascent", "descent", "arch", "valley") for shape in contour_shapes(p))


def longest_oscillation(p: Model) -> int:
    midis = [e.midi for e in sounded(p)]
    longest = min(len(midis), 1)
    run = 1
    for i in range(1, len(midis)):
        here, before = midis[i], midis[i - 1]
        if here == before:
            run = 1
            continue
        run = run + 1 if i >= 2 and midis[i - 2] == here else 2
        longest = max(longest, run)
    return longest


def oscillating(p: Model) -> bool:
    return longest_oscillation(p) >= 5


def turn_rate(p: Model) -> float:
    steps = [e.step for e in sounded(p)]
    moves = [(1 if b > a else -1) for a, b in zip(steps, steps[1:]) if b != a]
    if len(moves) < 2:
        return 0.0
    changes = sum(1 for a, b in zip(moves, moves[1:]) if a != b)
    return changes / (len(moves) - 1)


def longest_repeat(p: Model) -> int:
    midis = [e.midi for e in sounded(p)]
    longest = min(len(midis), 1)
    run = 1
    for i in range(1, len(midis)):
        run = run + 1 if midis[i] == midis[i - 1] else 1
        longest = max(longest, run)
    return longest


def contour(p: Model) -> float | None:
    events = sounded(p)
    if len(events) < 2:
        return None
    units = []
    for unit, shape in enumerate(contour_shapes(p)):
        if shape == "flat":
            units.append(0.2)
        elif shape != "wandering":
            units.append(1.0)
        else:
            units.append(0.4 if turns_of(beat_line(p, unit))[0] == 2 else 0.0)
    shape = sum(units) / len(units)
    rocking = min(1.0, max(0.0, (longest_oscillation(p) - 4) / 4))
    sitting = min(1.0, max(0.0, (longest_repeat(p) - 3) / 4))
    random = min(1.0, max(0.0, (turn_rate(p) - 0.5) / 0.5))
    return (0.75 * shape + 0.25 * (1 - random)) * (1 - 0.75 * rocking) * (1 - 0.5 * sitting)


def _num(x: float) -> str:
    return str(int(x)) if float(x).is_integer() else repr(float(x))


def bar_rhythm(p: Model, bar: int) -> str:
    return " ".join(f"{_num(n.at)}:{_num(n.duration)}{'r' if n.midi is None else ''}{'t' if n.tuplet else ''}"
                    for n in p.melody if n.bar == bar)


def bar_pitches(p: Model, bar: int) -> str:
    return " ".join("-" if n.midi is None else str(n.midi) for n in p.melody if n.bar == bar)


def bar_shape(p: Model, bar: int) -> list[int]:
    steps = [scale_step(n.midi, p.tonic, p.scale) for n in p.melody
             if n.bar == bar and n.midi is not None and n.tie != "stop"]
    return [b - a for a, b in zip(steps, steps[1:])]


def motif_facts(p: Model, exempt: frozenset[int] = frozenset()) -> tuple[bool, int]:
    """(a recurrence transformed, the exact repeats) — a bar in `exempt` is never counted exact (the grammar's restatement)."""
    transformed = False
    exact_repeats = 0
    rhythms = [bar_rhythm(p, b) for b in range(p.bars)]
    pitches = [bar_pitches(p, b) for b in range(p.bars)]
    shapes = [bar_shape(p, b) for b in range(p.bars)]
    counts = [sum(1 for n in p.melody if n.bar == b) for b in range(p.bars)]
    for b in range(1, p.bars):
        exact = False
        for a in range(b):
            same_rhythm = rhythms[a] == rhythms[b]
            same_pitches = pitches[a] == pitches[b]
            if same_rhythm and same_pitches:
                exact = True
            if same_rhythm and not same_pitches and counts[b] >= 2:
                transformed = True
            if len(shapes[a]) >= 2 and shapes[a] == shapes[b] and not same_pitches:
                transformed = True
        if exact and b not in exempt:
            exact_repeats += 1
    return transformed, exact_repeats


def motif(p: Model) -> float | None:
    """D1's motif (levels 2 up): a transformed recurrence 1, exact only a half, none 0; each exact repeat beyond one costs a half."""
    if (p.level is not None and p.level < 2) or p.bars < 2:
        return None
    transformed, exact_repeats = motif_facts(p, p.restated)
    if not transformed and p.restated:
        # A study's restatement is its grammar's: the motif recurring exactly, never a fault.
        base = 0.5
    else:
        base = 1.0 if transformed else 0.5 if exact_repeats >= 1 else 0.0
    return max(0.0, base - 0.5 * max(0, exact_repeats - 1))


def study_motif(p: Model) -> float | None:
    """
    The study's motif: the *opening* bar's cell — its rhythm under other pitches, or its interval
    shape at another pitch — coming back in a bar the grammar does not restate, 1; the opening
    only restated by the grammar (or repeated exactly), a half; never, 0. Each exact repeat of any
    bar beyond the grammar's restatement and beyond one costs a half, as in D1. D1's part counts
    any two bars sharing a rhythm, which two bars of half notes always do; a study promises a
    motif restated and varied, so the cell that is varied is the one it opens with.
    """
    if p.bars < 2:
        return None
    rhythms = [bar_rhythm(p, b) for b in range(p.bars)]
    pitches = [bar_pitches(p, b) for b in range(p.bars)]
    shapes = [bar_shape(p, b) for b in range(p.bars)]
    counts = [sum(1 for n in p.melody if n.bar == b) for b in range(p.bars)]
    varied = False
    exact_opening = False
    for b in range(1, p.bars):
        same_rhythm = rhythms[0] == rhythms[b]
        same_pitches = pitches[0] == pitches[b]
        if same_rhythm and same_pitches:
            exact_opening = True
        elif b not in p.restated and counts[0] >= 2 and (
                (same_rhythm and counts[b] >= 2) or (len(shapes[0]) >= 2 and shapes[0] == shapes[b])):
            varied = True
    _transformed, exact_repeats = motif_facts(p, p.restated)
    base = 1.0 if varied else 0.5 if exact_opening or p.restated else 0.0
    return max(0.0, base - 0.5 * max(0, exact_repeats - 1))


def rest_facts(p: Model) -> tuple[int, int, int]:
    beat = felt_beat_of(p.metre)
    rests_ = boundary = bad = 0
    for i, note in enumerate(p.melody):
        if note.midi is not None or note.designed:
            continue
        rests_ += 1
        ends = note.at + note.duration == bar_length(p.metre)
        if ends and (note.bar + 1) % 2 == 0 and note.bar < p.bars - 1:
            boundary += 1
        before = p.melody[i - 1] if i >= 1 else None
        in_last_bar = note.bar == p.bars - 1
        after_rest = before is not None and before.bar == note.bar and before.midi is None
        beat_index = math.floor(note.at / beat)
        breaks_beam = note.duration < beat and any(
            other.bar == note.bar and other.midi is not None and other.duration < beat
            and math.floor(other.at / beat) == beat_index for other in p.melody)
        if in_last_bar or after_rest or breaks_beam:
            bad += 1
    return rests_, boundary, bad


def rests(p: Model) -> float | None:
    if not p.rests_allowed:
        return None
    _rests, boundary, bad = rest_facts(p)
    return min(1.0, max(0.0, 0.75 + 0.25 * boundary - 0.35 * bad))


def harmony(p: Model) -> float | None:
    """Strong beats on a tone of the chord under them 1, leaning by step onto the next chord's tone a half, else 0."""
    events = sounded(p)
    strong = strong_offsets(p.metre)
    marks: list[float] = []
    for i, event in enumerate(events):
        chord = chord_at(p, event.bar, event.at)
        if chord is None or event.at not in strong:
            continue
        if _deg(p, event.midi) in chord.tones():
            marks.append(1.0)
            continue
        nxt = events[i + 1] if i + 1 < len(events) else None
        next_chord = None if nxt is None else chord_at(p, nxt.bar, nxt.at)
        resolves = (nxt is not None and next_chord is not None and abs(nxt.step - event.step) == 1
                    and _deg(p, nxt.midi) in next_chord.tones())
        marks.append(0.5 if resolves else 0.0)
    if not marks:
        return None
    return sum(marks) / len(marks)


def leaps(p: Model) -> float | None:
    steps = [e.step for e in sounded(p)]
    if len(steps) < 2:
        return None
    cost = 0.0
    for i in range(1, len(steps)):
        move = steps[i] - steps[i - 1]
        size = abs(move)
        if size < 3:
            continue
        here = min(1.0, (size - 2) / (p.max_leap - 2)) if p.max_leap > 2 else 1.0
        nxt = steps[i + 1] - steps[i] if i + 1 < len(steps) else 0
        if nxt != 0 and (nxt > 0) != (move > 0) and abs(nxt) <= 2:
            here *= 0.5
        cost += here
    return 1 - cost / (len(steps) - 1)


PARTS = ("beginning", "arrival", "contour", "motif", "rests", "harmony", "leaps")

#: D1's weights (`sightReadingScore.ts` `WEIGHTS`, each with its reason there).
WEIGHTS = {"beginning": 1.0, "arrival": 5.0, "contour": 3.0, "motif": 1.5, "rests": 1.0, "harmony": 1.5, "leaps": 0.5}

_D1_FUNCTIONS: dict[str, Callable[[Model], float | None]] = {
    "beginning": beginning, "arrival": arrival, "contour": contour, "motif": motif,
    "rests": rests, "harmony": harmony, "leaps": leaps,
}


def score_parts(p: Model) -> dict[str, float]:
    """D1's parts that apply to a sight-reading phrase, each 0-1 (the TypeScript `scoreParts`)."""
    out = {}
    for name in PARTS:
        value = _D1_FUNCTIONS[name](p)
        if value is not None:
            out[name] = value
    return out


def total_of(parts: dict[str, float], weights: dict[str, float] = WEIGHTS) -> float:
    total = weight = 0.0
    for name, w in weights.items():
        if name in parts:
            total += w * parts[name]
            weight += w
    return 0.0 if weight == 0 else total / weight


# --------------------------------------------------------------------------------------
# the study's semantics: several phrases, the minor, the declared harmony
# --------------------------------------------------------------------------------------


def phrase_slice(p: Model, phrase: Phrase) -> Model:
    """One phrase as a model of its own, its bars counted from 0: what the per-phrase parts read."""
    melody = [replace(n, bar=n.bar - phrase.start) for n in p.melody if phrase.start <= n.bar < phrase.end]
    # A tie from the bar before the phrase is not the phrase's own note.
    if melody and melody[0].tie in ("stop", "both"):
        melody[0] = replace(melody[0], tie=None if melody[0].tie == "stop" else "start")
    return replace(p, bars=phrase.end - phrase.start, melody=melody,
                   harmony=p.harmony[phrase.start:phrase.end], phrases=[], restated=frozenset(),
                   _sounded=None)


def _cadence_chord(p: Model, phrase: Phrase) -> Chord | None:
    return _last_chord(p, phrase.end - 1)


def _chord_before_cadence(p: Model, phrase: Phrase) -> Chord | None:
    last_bar = p.harmony[phrase.end - 1] if phrase.end - 1 < len(p.harmony) else []
    if len(last_bar) >= 2:
        return last_bar[-2]
    return _last_chord(p, phrase.end - 2)


def cadence_close(p: Model, phrase: Phrase, midi: int) -> float:
    """How the melody's last note of a phrase closes it; the phrase's cadence decides what counts."""
    degree = _deg(p, midi)
    if phrase.cadence == "authentic":
        return 1.0 if degree == 0 else 0.5 if degree in (2, 4) else 0.0
    chord = _cadence_chord(p, phrase)
    return 1.0 if chord is not None and degree in chord.tones() else 0.0


def harmonic_cadence(p: Model, phrase: Phrase) -> bool:
    """The declared progression has the cadence the phrase claims: V then I (authentic), or V (half)."""
    last = _cadence_chord(p, phrase)
    if phrase.cadence == "half":
        return last is not None and last.root == 4
    before = _chord_before_cadence(p, phrase)
    return last is not None and last.root == 0 and before is not None and before.root == 4


def phrase_arrival(p: Model, phrase: Phrase) -> float | None:
    """D1's rhythm grade on the phrase's final event, the close against its own cadence, and the approach."""
    sub = phrase_slice(p, phrase)
    events = sounded(sub)
    if not events:
        return None
    last = events[-1]
    rhythm = arrival_rhythm(sub)
    close = cadence_close(p, phrase, last.midi)
    before = events[-2] if len(events) >= 2 else None
    chord_before = None if before is None else chord_at(sub, before.bar, before.at)
    cadence_chord = _cadence_chord(p, phrase)
    into = cadence_chord is not None and _deg(p, last.midi) in cadence_chord.tones()
    from_step = before is not None and abs(last.step - before.step) == 1
    from_chord_tone = before is not None and chord_before is not None and _deg(p, before.midi) in chord_before.tones()
    approach = 1.0 if into and (from_step or from_chord_tone) else 0.0
    return 0.7 * rhythm + 0.15 * close + 0.15 * approach


def _weighted_over_phrases(p: Model, value: Callable[[Phrase], float | None]) -> float | None:
    total = weight = 0.0
    for index, phrase in enumerate(p.phrases):
        v = value(phrase)
        if v is None:
            continue
        w = 2.0 if index == len(p.phrases) - 1 else 1.0
        total += w * v
        weight += w
    return None if weight == 0 else total / weight


def study_arrival(p: Model) -> float | None:
    return _weighted_over_phrases(p, lambda phrase: phrase_arrival(p, phrase))


def phrase_cadence(p: Model, phrase: Phrase) -> float:
    sub = phrase_slice(p, phrase)
    events = sounded(sub)
    if not events or not harmonic_cadence(p, phrase):
        return 0.0
    return cadence_close(p, phrase, events[-1].midi)


def study_cadence(p: Model) -> float | None:
    return _weighted_over_phrases(p, lambda phrase: phrase_cadence(p, phrase))


def wrong_cadences(p: Model) -> list[str]:
    """Each phrase whose cadence is wrong: not in the progression, or closed on a note outside its chord."""
    out = []
    for index, phrase in enumerate(p.phrases):
        sub = phrase_slice(p, phrase)
        events = sounded(sub)
        where = f"phrase {index + 1} (bars {phrase.start + 1}-{phrase.end})"
        if not events:
            out.append(f"{where}: no note to close on")
        elif not harmonic_cadence(p, phrase):
            out.append(f"{where}: the progression has no {phrase.cadence} cadence")
        elif cadence_close(p, phrase, events[-1].midi) == 0.0:
            out.append(f"{where}: the {phrase.cadence} cadence closes on a note outside its chord")
    return out


STUDY_PARTS = ("beginning", "arrival", "cadence", "contour", "motif", "rests", "harmony", "leaps")

#: The study's weights, each with its reason.
#:
#: - `arrival` 4 and `cadence` 3: an ending per phrase and the cadence that makes it one are what
#:   turn eight bars of legal notes into a piece in phrases (Part 15 §9's "phrases that stop rather
#:   than arrive"); arrival is below D1's 5 because the cadence now carries part of the ending.
#: - `contour` 3: as D1 — a line with one shape per four bars against one that wanders or rocks.
#: - `motif` 2 and `harmony` 2: heavier than in a sight-reading phrase, because a study promises a
#:   cell restated and varied over a progression it declares (the brief: "a beginning that
#:   establishes, a middle that varies or develops").
#: - `beginning` 1 and `rests` 1: as D1; the realiser begins on a tone of the first chord and rests
#:   only at a phrase's breath.
#: - `leaps` 0.5: a tiebreaker below the recipe's cap, never a reason to lose the skips a target asks for.
STUDY_WEIGHTS = {"beginning": 1.0, "arrival": 4.0, "cadence": 3.0, "contour": 3.0, "motif": 2.0,
                 "rests": 1.0, "harmony": 2.0, "leaps": 0.5}

_STUDY_FUNCTIONS: dict[str, Callable[[Model], float | None]] = {
    "beginning": beginning, "arrival": study_arrival, "cadence": study_cadence, "contour": contour,
    "motif": study_motif, "rests": rests, "harmony": harmony, "leaps": leaps,
}


def study_parts(p: Model) -> dict[str, float]:
    out = {}
    for name in STUDY_PARTS:
        value = _STUDY_FUNCTIONS[name](p)
        if value is not None:
            out[name] = value
    return out


def score_study(p: Model) -> dict:
    """`{"total", "parts", "wrong"}`: the weighted total, each part, and every wrong cadence by phrase."""
    parts = study_parts(p)
    return {"total": total_of(parts, STUDY_WEIGHTS), "parts": parts, "wrong": wrong_cadences(p)}


# --------------------------------------------------------------------------------------
# reading a written score (music21) into a model
# --------------------------------------------------------------------------------------


def lines_of(score, part_index: int) -> list[list[WrittenNote]]:
    """One staff's bars as written notes; a chord as its top note (bottom on the lower staff) plus chord members."""
    from music21 import chord as m21chord, harmony as m21harmony, note as m21note

    part = score.parts[part_index]
    out: list[list[WrittenNote]] = []
    for measure in part.getElementsByClass("Measure"):
        bar: list[WrittenNote] = []
        for element in measure.flatten().notesAndRests:
            if isinstance(element, m21harmony.ChordSymbol):
                continue
            duration = float(element.duration.quarterLength) * DIVISIONS
            tie = element.tie.type if getattr(element, "tie", None) is not None else None
            tuplet = bool(element.duration.tuplets)
            if isinstance(element, m21note.Rest):
                bar.append(WrittenNote(None, duration, None, tuplet))
            elif isinstance(element, m21chord.Chord):
                pitches = sorted(p.midi for p in element.pitches)
                top = pitches[-1] if part_index == 0 else pitches[0]
                bar.append(WrittenNote(top, duration, tie, tuplet))
                for other in pitches:
                    if other != top:
                        bar.append(WrittenNote(other, duration, tie, tuplet, chord=True))
            else:
                bar.append(WrittenNote(element.pitch.midi, duration, tie, tuplet))
        out.append(bar)
    return out


def metre_of(score) -> Metre:
    from music21 import meter

    signature = next(iter(score.recurse().getElementsByClass(meter.TimeSignature)))
    return Metre(signature.numerator, signature.denominator)


def study_model(score, facts: dict) -> Model:
    """
    A study's model from its written score and the form its recipe declares (`drill.study` on the
    catalogue row): the tonic's pitch class and the mode, the progression per bar (each chord a
    root degree and a seventh flag), the phrases with their cadences, the bars the grammar
    restates, and the recipe's leap cap. The notes are the page's; only the harmony and the form
    come from the declaration.
    """
    melody = lines_of(score, 0)
    metre = metre_of(score)
    harmony_ = [[Chord(c["root"], bool(c.get("seventh"))) for c in bar] for bar in facts["progression"]]
    phrases = [Phrase(start, end, cadence) for start, end, cadence in facts["phrases"]]
    return Model(tonic=facts["tonic"], scale=MINOR if facts["mode"] == "minor" else MAJOR, metre=metre,
                 bars=len(melody), melody=place_melody(melody), harmony=harmony_, max_leap=facts["maxLeap"],
                 rests_allowed=True, level=None, phrases=phrases, restated=frozenset(facts.get("restated", [])))


def inferred_model(score, tonic: int, mode: str, phrase_length: int = 4) -> Model:
    """
    Any two-staff score read the way D1 reads a phrase — the melody on the upper staff, the harmony
    inferred from the left hand's first note in each bar — cut into phrases of four bars, each
    claimed authentic. Used only to *report* on the other music families (the entry's table): their
    harmony is not declared, so this is D1's inference, and a groove is judged here for phrase shape
    alone, never for idiom.
    """
    melody = lines_of(score, 0)
    left = lines_of(score, 1) if len(score.parts) > 1 else [[] for _ in melody]
    scale = MINOR if mode == "minor" else MAJOR
    bars = len(melody)
    phrases = [Phrase(s, min(bars, s + phrase_length), "authentic") for s in range(0, bars, phrase_length)]
    return Model(tonic=tonic, scale=scale, metre=metre_of(score), bars=bars, melody=place_melody(melody),
                 harmony=harmony_from_left_hand(left, tonic, bars, scale), max_leap=4, rests_allowed=True,
                 level=None, phrases=phrases)
