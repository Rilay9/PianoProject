#!/usr/bin/env python3
"""
The named left-hand accompaniment figures, each matched in the notes by its published
definition (CT1 part one). One concept, one matcher: the seven styles `claims.py` mapped
onto the single `leftHandPattern` demand are seven questions with seven answers here.

**Why custom code.** The reuse map (`docs/prompts/runs/CT1/reuse-map.md` row 5.4) found no
library that implements these figures. music21 provides the chord, interval and metre
facts the definitions are written in, and this module uses it for them (`one_chord`).
Everything else is the definitions below, each citing its source.

**What a figure is not.** An accompaniment is a figure under a tune (Hutchinson ch. 14,
*Accompanimental Textures*). A two-hand scale, Hanon or arpeggio, whose hands strike
single notes together in every bar, is one line doubled, not a tune over a figure. A bar
whose hands do that is *mirrored*, and no accompaniment figure is found in it. That is
the rule that turns away the sixteen exercises `leftHandPattern` misread (the CT1 brief's
appendix).

**The representation.** A score is a list of `Note(bar, onset, duration, midi, staff)`.
Onset and duration are in quarter notes from the start of the piece. `bars` gives each
bar's start and its time signature. Two readers make it:
- `from_music21` reads any score file the build writes;
- `from_score_model` reads the app's `ScoreModel` JSON (the golden fixtures).

Staff 1 is the upper staff and staff 2 the lower, as `detect.ts` reads them.

**What is claimed.** `match(score)` returns, per figure, the printed bars where it was
found (1-based), and whether a tune sounds over it there. A figure counts for a piece
when it is found in at least `MIN_BARS` bars. Nothing here says the music is good
(*unverified as music*).

    python3 tools/content/figures.py <file.mxl|model.json> [...]
"""
from __future__ import annotations

import json
import sys
from dataclasses import dataclass, field
from fractions import Fraction
from pathlib import Path

#: A figure is a repeating pattern: one bar of it is a gesture, two are a figure.
MIN_BARS = 2

#: Onsets closer than this (in quarter notes) are one strike: a chord as printed.
SAME = Fraction(1, 64)


@dataclass(frozen=True)
class Note:
    bar: int  # 0-based printed bar
    onset: Fraction  # quarter notes from the start of the piece
    duration: Fraction
    midi: int
    staff: int  # 1 upper, 2 lower


@dataclass
class Bar:
    start: Fraction
    beats: int
    beat_type: int

    @property
    def length(self) -> Fraction:
        return Fraction(self.beats * 4, self.beat_type)


@dataclass
class Score:
    notes: list[Note]
    bars: list[Bar]
    id: str = ""

    def strikes(self, staff: int, bar: int) -> list[tuple[Fraction, list[Note]]]:
        """The staff's strikes in a bar, in time order, each the notes struck together."""
        out: list[tuple[Fraction, list[Note]]] = []
        for n in sorted((n for n in self.notes if n.staff == staff and n.bar == bar), key=lambda n: (n.onset, n.midi)):
            if out and n.onset - out[-1][0] < SAME:
                out[-1][1].append(n)
            else:
                out.append((n.onset, [n]))
        return out


@dataclass
class Found:
    """Where a figure was found: printed bars (1-based), and those with a tune over them."""
    bars: list[int] = field(default_factory=list)
    under_tune: list[int] = field(default_factory=list)

    @property
    def present(self) -> bool:
        return len(self.bars) >= MIN_BARS

    @property
    def accompanies(self) -> bool:
        return len(self.under_tune) >= MIN_BARS

    def as_dict(self) -> dict:
        return {"present": self.present, "accompanies": self.accompanies, "bars": self.bars, "underTune": self.under_tune}


# --- chord facts, from music21 -----------------------------------------------------------

def one_chord(midis: list[int]) -> bool:
    """
    Whether the pitches are the notes of one chord: a triad or a seventh chord, complete or
    with its fifth left out. music21 names the chord (`chord.Chord.isTriad`, `isSeventh`);
    the fifthless forms are the triad and seventh qualities of Open Music Theory, *Triads
    and seventh chords* (openmusictheory.github.io/triads.html).
    """
    from music21 import chord

    pcs = sorted({m % 12 for m in midis})
    if len(pcs) < 2:
        return False
    c = chord.Chord(pcs)
    if c.isTriad() or c.isSeventh():
        return True
    # A third or a sixth alone is the shell of a chord, never a figure's whole harmony.
    if len(pcs) == 3:
        for root in pcs:
            rel = sorted((p - root) % 12 for p in pcs)
            if rel in ([0, 4, 10], [0, 3, 10], [0, 4, 11]):  # a seventh chord without its fifth
                return True
    return False


# --- the hands ---------------------------------------------------------------------------

def mirrored(score: Score, bar: int) -> bool:
    """
    The two hands play one line doubled: single notes struck at the same times all through
    the bar, and either the same pitch class at every strike (similar motion in octaves) or
    every move answered by the opposite move of about the same size (contrary motion, a
    semitone's difference allowed for the scale's other step). That is a two-hand scale,
    Hanon or arpeggio, not a tune over an accompaniment. The same rhythm alone is not
    enough: a tune in quarters over a broken chord in quarters is a tune and a figure.
    """
    upper = score.strikes(1, bar)
    lower = score.strikes(2, bar)
    if not upper or not lower or len(upper) != len(lower):
        return False
    if not all(abs(a[0] - b[0]) < SAME and len(a[1]) == 1 and len(b[1]) == 1 for a, b in zip(upper, lower)):
        return False
    hi = [s[1][0].midi for s in upper]
    lo = [s[1][0].midi for s in lower]
    if all((h - l) % 12 == 0 for h, l in zip(hi, lo)):
        return True
    moves = list(zip((b - a for a, b in zip(hi, hi[1:])), (b - a for a, b in zip(lo, lo[1:]))))
    return bool(moves) and all(u * v < 0 and abs(abs(u) - abs(v)) <= 1 for u, v in moves)


def tune_over(score: Score, bar: int) -> bool:
    """The upper staff plays in the bar and is not the lower staff's double."""
    return bool(score.strikes(1, bar)) and not mirrored(score, bar)


def position(score: Score, onset: Fraction, bar: int) -> Fraction:
    """Quarter notes from the start of the bar."""
    return onset - score.bars[bar].start


def collect(score: Score, bar_test) -> Found:
    found = Found()
    for b in range(len(score.bars)):
        if mirrored(score, b):
            continue
        if bar_test(score, b):
            found.bars.append(b + 1)
            if tune_over(score, b):
                found.under_tune.append(b + 1)
    return found


# --- the figures -------------------------------------------------------------------------

def alberti_bar(score: Score, b: int) -> bool:
    """
    **Alberti bass.** A broken chord in the order lowest, highest, middle, highest: "low–high–
    middle–high" (Hutchinson, *Music Theory for the 21st-Century Classroom* §14.3,
    musictheory.pugetsound.edu/mt21c/ArpeggiatedAccompaniments.html). As a rule over the
    notes: four single notes struck at equal spacing, the second and fourth the same pitch,
    the first lowest and the third between them, the three pitches one chord. A bar holds the
    figure when one such group is in it.
    """
    strikes = score.strikes(2, b)
    for i in range(len(strikes) - 3):
        group = strikes[i:i + 4]
        if any(len(s[1]) != 1 for s in group):
            continue
        gaps = {group[k + 1][0] - group[k][0] for k in range(3)}
        if len(gaps) != 1:
            continue
        p1, p2, p3, p4 = (s[1][0].midi for s in group)
        if p2 == p4 and p1 < p3 < p2 and one_chord([p1, p2, p3]):
            return True
    return False


def _bass_then_chords(score: Score, b: int, bass_at: tuple[int, ...], chord_at: tuple[int, ...]) -> list[int] | None:
    """
    The bar's lower-staff strikes are a bass on each beat in `bass_at` and a chord on each
    beat in `chord_at`, and nothing else. A bass is one note or an octave. A chord is two or
    more notes struck together, all above the bass before it. Returns the leaps from each
    bass to the chord after it (semitones, bass to the chord's lowest note), or None.
    """
    strikes = score.strikes(2, b)
    at = {position(score, s[0], b): s[1] for s in strikes}
    if set(at) != {Fraction(q) for q in bass_at + chord_at}:
        return None
    leaps: list[int] = []
    last_bass = None
    for q in sorted(at):
        notes = sorted(n.midi for n in at[q])
        if q in bass_at:
            if len(notes) > 2 or (len(notes) == 2 and notes[1] - notes[0] != 12):
                return None
            last_bass = notes[0]
        else:
            if len(notes) < 2 or last_bass is None or notes[0] <= last_bass:
                return None
            leaps.append(notes[0] - last_bass)
    return leaps


def waltz_bar(score: Score, b: int) -> bool:
    """
    **Waltz bass (oom-pah-pah).** In 3/4, a bass note on beat one and a chord on beats two
    and three: "a low bass note … on beat 1, followed by lighter chordal pulses on beats 2
    and 3" (Wikipedia, *Oom-pah*, en.wikipedia.org/wiki/Oom-pah; the waltz's triple
    form).
    """
    bar = score.bars[b]
    if (bar.beats, bar.beat_type) != (3, 4):
        return False
    return _bass_then_chords(score, b, (0,), (1, 2)) is not None


def oompah_leaps(score: Score, b: int) -> list[int] | None:
    """The duple form: bass on the strong beats, chord on the weak ones (2/4, 4/4, 2/2)."""
    bar = score.bars[b]
    if bar.length == 2:
        return _bass_then_chords(score, b, (0,), (1,))
    if bar.length == 4 and (bar.beats, bar.beat_type) in ((4, 4), (2, 2)):
        return _bass_then_chords(score, b, (0, 2), (1, 3))
    return None


def oompah_bar(score: Score, b: int) -> bool:
    """
    **Oom-pah bass.** In duple time, "the 'oom' … the bass note" on the strong beat and the
    "pah" chord on the off-beat (Wikipedia, *Oom-pah*): bass on beats one and three of a 4/4
    bar (one of a 2/4 bar), a chord on two and four.
    """
    return oompah_leaps(score, b) is not None


#: Stride: the left hand "jumps long distances". Read here as at least an octave from the
#: bass to the chord after it, on average over the bar. The threshold is this module's
#: reading of the definition, not a quoted number.
STRIDE_LEAP = 12


def stride_bar(score: Score, b: int) -> bool:
    """
    **Stride bass.** "a bass note on beats one and three and a chord on beats two and four",
    the hand striding "long distances" between them (Wikipedia, *Stride (music)*,
    en.wikipedia.org/wiki/Stride_(music)). The oom-pah of a 4/4 bar, with the leap from bass
    to chord at least `STRIDE_LEAP` semitones on average.
    """
    bar = score.bars[b]
    if bar.length != 4:
        return False
    leaps = oompah_leaps(score, b)
    return bool(leaps) and sum(leaps) / len(leaps) >= STRIDE_LEAP


def walking_bar(score: Score, b: int) -> bool:
    """
    **Walking bass.** "a continuous sequence of quarter notes, generally played on the beat
    (4 notes per bar in 4/4 time)" that outlines the harmony (The Jazz Piano Site, *Walking
    Bass-lines*, thejazzpianosite.com). As a rule: a 4/4 bar whose lower staff strikes one
    single note on each of the four beats and nothing else, at least three different
    pitches, so a repeated note or a two-note rock is a pulse and not a walk.
    """
    bar = score.bars[b]
    if (bar.beats, bar.beat_type) != (4, 4):
        return False
    strikes = score.strikes(2, b)
    if [position(score, s[0], b) for s in strikes] != [0, 1, 2, 3]:
        return False
    if any(len(s[1]) != 1 for s in strikes):
        return False
    return len({s[1][0].midi for s in strikes}) >= 3


#: The boogie-woogie bass's degrees: "Root-3-5-6 | b7-6-5-3" (StudyBass, *The Boogie-Woogie
#: Blues Pattern*, studybass.com), semitones above the root.
BOOGIE_CORE = {0, 4, 7, 9}
BOOGIE_ALLOWED = {0, 3, 4, 7, 9, 10}


def boogie_bar(score: Score, b: int) -> bool:
    """
    **Boogie bass.** The line "ascends and then descends strongly outlining the notes of each
    dominant 7th chord": root, third, fifth, sixth, flat seventh (StudyBass, *The
    Boogie-Woogie Blues Pattern*). As a rule over one bar of the lower staff: at least four
    strikes; the lowest note of each, read from the bar's first, uses the root, third, fifth
    and sixth, and nothing outside root, minor or major third, fifth, sixth and flat seventh.
    The broken-octave boogie, the other common left hand, is not this figure and is not
    matched here.
    """
    strikes = score.strikes(2, b)
    if len(strikes) < 4:
        return False
    lows = [min(n.midi for n in s[1]) for s in strikes]
    root = lows[0]
    degrees = {(m - root) % 12 for m in lows}
    return BOOGIE_CORE <= degrees <= BOOGIE_ALLOWED


def broken_chord_bar(score: Score, b: int) -> bool:
    """
    **Broken-chord (arpeggiated) accompaniment.** "the arpeggiation of complete chords … the
    chord is played melodically (one note at a time)" (Hutchinson §14.3). As a rule: three
    successive single notes of the lower staff, three different pitch classes, all of one
    chord, each move a skip (a third or wider): a chord's notes, one at a time, never a
    scale's steps.
    """
    strikes = score.strikes(2, b)
    for i in range(len(strikes) - 2):
        window = strikes[i:i + 3]
        if any(len(s[1]) != 1 for s in window):
            continue
        midis = [s[1][0].midi for s in window]
        skips = all(abs(midis[k + 1] - midis[k]) >= 3 for k in range(2))
        if skips and len({m % 12 for m in midis}) == 3 and one_chord(midis):
            return True
    return False


#: Each named concept, the figure that establishes it, and whether a tune must sound over it.
#: An accompaniment concept needs the tune; a concept that names the left hand's figure alone
#: (an Alberti exercise for the left hand) does not.
FIGURES = {
    "alberti": alberti_bar,
    "waltz-bass": waltz_bar,
    "oom-pah-bass": oompah_bar,
    "stride-bass": stride_bar,
    "walking-bass": walking_bar,
    "boogie-bass": boogie_bar,
    "broken-chord": broken_chord_bar,
}

#: Concept ids (`content/curriculum/concepts.json`) answered by each figure. `accompaniment`
#: says whether the concept needs a tune over the figure.
CONCEPT_FIGURES = {
    "alberti": ("alberti", False),
    "alberti-bass": ("alberti", False),
    "alberti-bass-HT": ("alberti", True),
    "broken-chord-accompaniment": ("broken-chord", True),
    "arpeggio-texture": ("broken-chord", True),
    "waltz-bass": ("waltz-bass", False),
    "oom-pah-bass": ("oom-pah-bass", False),
    "stride-bass": ("stride-bass", False),
    "stride": ("stride-bass", False),
    "walking-bass": ("walking-bass", True),
    "boogie-bass": ("boogie-bass", False),
    "boogie": ("boogie-bass", False),
}


def match(score: Score) -> dict[str, dict]:
    return {name: collect(score, test).as_dict() for name, test in FIGURES.items()}


def concept_present(result: dict[str, dict], concept: str) -> bool | None:
    """Whether a matched score establishes a concept; None when no figure answers it."""
    if concept not in CONCEPT_FIGURES:
        return None
    figure, accompaniment = CONCEPT_FIGURES[concept]
    row = result[figure]
    return row["accompanies"] if accompaniment else row["present"]


# --- readers -----------------------------------------------------------------------------

def from_score_model(model: dict) -> Score:
    """The app's `ScoreModel` JSON: onsets and durations in quarter notes, `staff` 1 or 2."""
    sigs = sorted(model.get("timeSigMap") or [{"atMeasure": 0, "beats": 4, "beatType": 4}], key=lambda s: s["atMeasure"])
    notes: list[Note] = []
    starts: dict[int, Fraction] = {}
    for step in model["steps"]:
        for n in step["notes"]:
            if n.get("isGrace"):
                continue
            bar = n["measureIndex"]
            onset = Fraction(n["onset"]).limit_denominator(960)
            notes.append(Note(bar, onset, Fraction(n["duration"]).limit_denominator(960), n["midi"], n["staff"]))
            if step.get("isMeasureStart") and bar not in starts:
                starts[bar] = Fraction(step["onset"]).limit_denominator(960)
    bars: list[Bar] = []
    for b in range(model["measureCount"]):
        sig = [s for s in sigs if s["atMeasure"] <= b][-1]
        start = starts.get(b)
        if start is None:
            start = bars[-1].start + bars[-1].length if bars else Fraction(0)
        bars.append(Bar(start, sig["beats"], sig["beatType"]))
    return Score(notes, bars, model.get("id", ""))


def from_music21(path: Path) -> Score:
    """Any file music21 reads; the first part is the upper staff and the last the lower."""
    from music21 import converter, meter, note as m21note, chord as m21chord

    score = converter.parse(str(path))
    parts = list(score.parts)
    staves = [parts[0], parts[-1]] if len(parts) >= 2 else [parts[0]]
    notes: list[Note] = []
    bars: list[Bar] = []
    for staff_no, part in enumerate(staves, start=1):
        sig = meter.TimeSignature("4/4")
        for b, measure in enumerate(part.getElementsByClass("Measure")):
            ts = measure.timeSignature
            if ts is not None:
                sig = ts
            start = Fraction(measure.offset).limit_denominator(960)
            if staff_no == 1:
                bars.append(Bar(start, sig.numerator, sig.denominator))
            for el in measure.recurse().notes:
                if el.duration.isGrace:
                    continue
                if el.tie is not None and el.tie.type in ("stop", "continue"):
                    continue
                at = start + Fraction(el.getOffsetInHierarchy(measure)).limit_denominator(960)
                dur = Fraction(el.duration.quarterLength).limit_denominator(960)
                pitches = el.pitches if isinstance(el, m21chord.Chord) else [el.pitch] if isinstance(el, m21note.Note) else []
                for p in pitches:
                    notes.append(Note(b, at, dur, p.midi, staff_no))
    return Score(notes, bars, path.stem)


def read(path: Path) -> Score | None:
    if path.suffix == ".json":
        model = json.loads(path.read_text(encoding="utf-8"))
        return from_score_model(model) if "steps" in model else None
    return from_music21(path)


def main(argv: list[str]) -> int:
    for arg in argv:
        path = Path(arg)
        score = read(path)
        if score is None:
            continue
        result = match(score)
        named = {k: v["bars"] for k, v in result.items() if v["present"]}
        print(f"{path.name}: {json.dumps(named) if named else 'no figure'}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
