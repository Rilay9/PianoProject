#!/usr/bin/env python3
"""
The generated study (D3; G19, G16, G14, Part 15 §14): an 8-16-bar miniature around one target,
between the drill that repeats a pattern and the repertoire that is somebody's music.

Split from `generate_exercises.py` for ownership (G13): this module owns the study's recipe, its
grammar and its realiser; `generate_exercises.make_study` is the maker that turns what it writes
into a catalogue row, and `family_contracts.json`'s `study` row says what the family is for. The
four gates are the family contracts' (`family_contracts.py`), the musical one reading
`musical_evaluator.py`.

**The recipe** (`Recipe`): a target — a vocabulary skill (`interval-reading`, `position-shift`,
`subdivision`, `syncopation`) or a vocabulary demand the study provides as an opportunity
(`texture.hands-together`, `metre.compound`), never a skill invented to label a recipe — a key and
mode, a metre, a length of 8, 12 or 16 bars, a left-hand texture from the accompaniment
families' patterns (a sustained root, blocked chords, broken chords, Alberti, a waltz bass), the
rung whose taught set bounds every demand the study may carry (`claims.rung_ancestry`, the
reading `claims.py` and the app share), a seed and a tempo.

**The grammar, harmony first.** A form of four-bar phrases, each closed by a cadence:

- 8 bars: an antecedent ending on the dominant (a half cadence) and a consequent that restates
  the antecedent's first two bars and closes on an authentic cadence;
- 12 bars: the antecedent, a contrasting phrase ending on the dominant, the consequent;
- 16 bars: antecedent, consequent, contrasting phrase, and the consequent again.

The antecedent is `I x y V`; the consequent keeps its first two chords and closes with one of
`V I`, `V7 I`, `IV V | I` or `ii V | I`; the contrasting phrase is `IV I IV V`, `vi IV I V`,
`IV V I V` or `ii IV I V`. The minor forms: `i x y V` over the minor's own chords (`iv`, `VI`, the
dominant with its leading tone), closing `V i`, `V7 i` or `iv V | i`. A recipe that asks for two
chords a bar (`harmonicRhythm: 2`, the hands-together target) moves the first three bars of each
phrase through two chords each. A chord the rung cannot realise — a left hand that would leave
its five-note position before the rung teaches that — is not drawn.

**The realiser.** The left hand is the texture over the progression, each chord spelled by
interval from its root and the root spelled by the key. The melody is drawn: a rhythmic cell
chosen for the first bar (the motif), restated or varied in the bars after it, a cadence cell to
close each phrase; pitches by a walk guided toward a contour the draw chooses (an arch, an
ascent, a descent or a valley per phrase), strong beats on tones of the chord under them, weak
beats a chord tone or a step, each phrase closing on its cadence's tone. The consequent restates
the antecedent's opening and the contrasting phrase takes the motif's rhythm and shape to its own
chord (a sequence). **Valid first, then scored** (D1's rule): a draw that breaks the hard layer —
the rung's taught set (the rhythms, the register, the five-note position, the key), the leap cap,
the target at the recipe's density, a cadence on its chord's tone, no exact bar repeated beyond
the grammar's restatement — is never scored; the valid draws are scored by the musical evaluator,
the earliest within a tolerance of the best is kept at the valid draws' own density, and one that
falls below the musical floor is not. A recipe that yields no candidate within its budget is
refused with a reason at build time (`StudyRefusal`), and nothing it did not check is written.

What the realiser counts of its own writing is its construction, never a reading of a demand:
the demands are the app's detectors' (`demands.py`), measured on every written study by the
build-time suite and by the build's attach step.
"""
from __future__ import annotations

import hashlib
import json
import random
from dataclasses import dataclass, field, asdict
from functools import lru_cache
from pathlib import Path

from music21 import chord as m21chord, key, meter, note, pitch, stream, tempo

import musical_evaluator as ME

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]

#: The musical floor: a candidate the evaluator scores below it is refused, whatever else it
#: keeps (the distribution suite's table, Entry 100, is where it was set: every study the grammar
#: wrote on the suite's seeds cleared it and the random walk's median did not).
MUSICAL_FLOOR = 0.80

#: Draws a recipe may make, and valid candidates it scores before choosing.
BUDGET = 600
CANDIDATES = 24
#: A candidate within this of the best counts as the best, and the earliest such is kept (D1's
#: `SCORE_TOLERANCE`): the variety a strict best loses where the best-shaped draws are few.
TOLERANCE = 0.01

VERSION = 1


class StudyRefusal(ValueError):
    """A recipe the realiser cannot write within its budget, or cannot write at its rung at all."""


# --------------------------------------------------------------------------------------
# the recipe and the rung
# --------------------------------------------------------------------------------------


@dataclass(frozen=True)
class Recipe:
    target: str
    key: str
    mode: str
    metre: str
    bars: int
    texture: str
    rung: str
    seed: int
    bpm: int
    harmonic_rhythm: int = 1

    def params(self) -> dict:
        """The catalogue's `drill.params`: the recipe, which with family, version and seed is the identity (G21)."""
        return {"target": self.target, "key": self.key, "quality": self.mode, "timeSig": self.metre,
                "bars": self.bars, "texture": self.texture, "rung": self.rung, "seed": self.seed,
                "harmonicRhythm": self.harmonic_rhythm}


#: The first targets: what each asks of the realiser's own writing. `demand` is the vocabulary
#: demand the target's opportunity is measured by; `skill` the vocabulary skill that copes with
#: it (the contract's primary skill for the recipe). `words` names the target in the title.
TARGETS = {
    "interval-reading": {"demand": "interval.skip", "skill": "interval-reading", "words": "steps and skips",
                         "concepts": ["interval-reading", "steps", "skips"]},
    "position-shift": {"demand": "range.beyond-position", "skill": "position-shift", "words": "moving the hand",
                       "concepts": ["position-shift"]},
    "subdivision": {"demand": "rhythm.eighths", "skill": "subdivision", "words": "eighth notes",
                    "concepts": ["subdivision", "eighth-notes"]},
    "syncopation": {"demand": "rhythm.syncopation", "skill": "syncopation", "words": "off-beat notes",
                    "concepts": ["syncopation"]},
    "metre.compound": {"demand": "metre.compound", "skill": "6/8", "words": "in six-eight",
                       "concepts": ["6/8"]},
    "texture.hands-together": {"demand": "texture.hands-together", "skill": "hands-together",
                               "words": "the hands changing together", "concepts": ["hands-together"]},
}

TEXTURES = ("sustained", "blocked", "broken", "alberti", "waltz")
TEXTURE_WORDS = {"sustained": "held bass", "blocked": "blocked chords", "broken": "broken chords",
                 "alberti": "Alberti bass", "waltz": "waltz bass"}


def curriculum_sources() -> dict:
    """The curriculum's stages as `build.py` assembles `curriculum.json` from the sources, in order."""
    stages: list[dict] = []
    for path in sorted((REPO / "content" / "curriculum").glob("*.json")):
        if path.name == "concepts.json":
            continue
        stages.extend(json.loads(path.read_text(encoding="utf-8")).get("stages", []))
    stages.sort(key=lambda stage: stage["number"])
    return {"stages": stages}


@lru_cache(maxsize=None)
def taught_at(rung: str) -> frozenset[str]:
    """
    The demands a rung has taught: those taught at any rung in its ancestry (E0a,
    `claims.rung_ancestry`). Since E0b `taughtAt` is a list, one teaching rung per path, read
    through `claims.taught_at` so this and the report agree on what a rung has taught.
    """
    import claims

    ancestry = claims.rung_ancestry(curriculum_sources())
    if rung not in ancestry:
        raise StudyRefusal(f"the rung {rung} is not in the curriculum")
    _skills, demands = claims.load_vocabulary()
    return frozenset(d for d, row in demands.items() if any(r in ancestry[rung] for r in claims.taught_at(row)))


@dataclass(frozen=True)
class Limits:
    """What the rung lets the realiser write, read from its taught set."""

    eighths: bool
    dotted: bool
    syncopation: bool
    compound: bool
    position: bool
    signature: bool
    chromatic: bool
    pattern: bool
    together: bool

    @classmethod
    def of(cls, rung: str) -> "Limits":
        t = taught_at(rung)
        return cls(eighths="rhythm.eighths" in t and "rhythm.shorter-than-quarter" in t,
                   dotted="rhythm.dotted-quarter" in t, syncopation="rhythm.syncopation" in t,
                   compound="metre.compound" in t, position="range.beyond-position" in t,
                   signature="key.signature" in t, chromatic="pitch.chromatic" in t,
                   pattern="texture.left-hand-pattern" in t, together="texture.hands-together" in t)


def recipe_faults(recipe: Recipe) -> list[str]:
    """Why a recipe cannot be written at its rung at all: the rung has not taught what it would bring."""
    limits = Limits.of(recipe.rung)
    out = []
    if recipe.target not in TARGETS:
        out.append(f"{recipe.target} is not one of the first targets")
    if recipe.texture not in TEXTURES:
        out.append(f"{recipe.texture} is not a texture")
    if recipe.bars not in (8, 12, 16):
        out.append(f"{recipe.bars} bars: a study is 8, 12 or 16")
    if not limits.together:
        out.append("hands together is not taught at the rung, and every study is for two hands")
    signed = not ((recipe.key == "C" and recipe.mode == "major") or (recipe.key == "A" and recipe.mode == "minor"))
    if signed and not limits.signature:
        out.append(f"{recipe.key} {recipe.mode} has a key signature, not taught at {recipe.rung}")
    if recipe.mode == "minor" and not limits.chromatic:
        out.append(f"a minor study's dominant needs the leading tone, a note outside the key signature, not taught at {recipe.rung}")
    if recipe.metre == "6/8" and not limits.compound:
        out.append(f"6/8 is not taught at {recipe.rung}")
    if recipe.metre in ("6/8", "2/4", "3/4") or recipe.metre == "4/4":
        pass
    else:
        out.append(f"{recipe.metre} is not a metre the realiser writes")
    if recipe.texture in ("broken", "alberti", "waltz") and not limits.pattern:
        out.append(f"a {recipe.texture} left hand is a pattern in every bar, not taught at {recipe.rung}")
    if recipe.texture == "blocked" and not limits.position:
        out.append(f"blocked chords take the left hand beyond a five-note position, not taught at {recipe.rung}")
    if recipe.texture == "waltz" and recipe.metre != "3/4":
        out.append("a waltz bass is written in 3/4")
    if recipe.texture == "alberti" and recipe.metre == "6/8":
        out.append("an Alberti bass is written in simple time")
    if recipe.target == "subdivision" and not limits.eighths:
        out.append(f"eighth notes are not taught at {recipe.rung}")
    if recipe.target == "syncopation" and not limits.syncopation:
        out.append(f"syncopation is not taught at {recipe.rung}")
    if recipe.target == "syncopation" and recipe.metre not in ("4/4", "2/4", "3/4"):
        out.append("the syncopated cells are written in simple time")
    if recipe.target == "syncopation" and recipe.texture in ("sustained", "blocked"):
        out.append(f"a {recipe.texture} left hand holds through the beat, and an off-beat note is felt against a "
                   "beat: a syncopation study's left hand sounds it (broken chords, Alberti, a waltz bass)")
    if recipe.target == "metre.compound" and recipe.metre != "6/8":
        out.append("a study for compound time is in 6/8")
    if recipe.target == "position-shift" and not limits.position:
        out.append(f"moving the hand is not taught at {recipe.rung}")
    if recipe.target == "position-shift" and recipe.bars == 8:
        out.append("a position-shift study leaves the position and comes back: 12 or 16 bars")
    if recipe.harmonic_rhythm == 2 and recipe.metre not in ("4/4", "2/4", "6/8"):
        out.append("two chords a bar are written where the bar halves")
    return out


# --------------------------------------------------------------------------------------
# the grammar
# --------------------------------------------------------------------------------------

#: Chords by name: root degree (0 = the tonic), quality, seventh. The minor's dominant is major (its
#: leading tone), and its sixth-degree chord is VI.
CHORDS = {
    "major": {"I": (0, "M", False), "ii": (1, "m", False), "IV": (3, "M", False), "V": (4, "M", False),
              "V7": (4, "M", True), "vi": (5, "m", False)},
    "minor": {"i": (0, "m", False), "iv": (3, "m", False), "V": (4, "M", False), "V7": (4, "M", True),
              "VI": (5, "M", False)},
}

GRAMMAR = {
    "major": {
        "antecedent": [["I", "IV", "I", "V"], ["I", "vi", "IV", "V"], ["I", "I", "IV", "V"],
                       ["I", "V", "I", "V"], ["I", "ii", "IV", "V"]],
        "cadence": [[["V"], ["I"]], [["V7"], ["I"]], [["IV", "V"], ["I"]], [["ii", "V"], ["I"]]],
        "contrast": [["IV", "I", "IV", "V"], ["vi", "IV", "I", "V"], ["IV", "V", "I", "V"], ["ii", "IV", "I", "V"]],
        "pairs": {"I": ["IV", "V"], "IV": ["I", "V"], "V": ["I"], "vi": ["IV", "ii"], "ii": ["V"]},
    },
    "minor": {
        "antecedent": [["i", "iv", "i", "V"], ["i", "VI", "iv", "V"], ["i", "i", "iv", "V"], ["i", "V", "i", "V"]],
        "cadence": [[["V"], ["i"]], [["V7"], ["i"]], [["iv", "V"], ["i"]]],
        "contrast": [["iv", "i", "iv", "V"], ["VI", "iv", "i", "V"], ["iv", "V", "i", "V"]],
        "pairs": {"i": ["iv", "V"], "iv": ["i", "V"], "V": ["i"], "VI": ["iv"]},
    },
}

#: Each length's form: the phrases in order, the cadence each closes on, and the bars each
#: restates (the grammar's restatement, never counted against the study as repetition).
FORMS = {
    8: [("A", "half"), ("A'", "authentic")],
    12: [("A", "half"), ("B", "half"), ("A'", "authentic")],
    16: [("A", "half"), ("A'", "authentic"), ("B", "half"), ("A'", "authentic")],
}


@dataclass
class Plan:
    """The harmony and form before a note of melody: what the evaluator reads as declared."""

    phrases: list[tuple[int, int, str, str]]  # (start, end, cadence, role)
    progression: list[list[str]]  # chord names per bar
    restated: dict[int, int]  # bar -> the bar it restates


def chord_spec(mode: str, name: str) -> tuple[int, str, bool]:
    return CHORDS[mode][name]


def evaluator_chords(mode: str, bar: list[str]) -> list[dict]:
    out = []
    for name in bar:
        root, _quality, seventh = chord_spec(mode, name)
        out.append({"root": root, **({"seventh": True} if seventh else {})})
    return out


def draw_plan(recipe: Recipe, rng: random.Random, allowed: set[str]) -> Plan:
    """A form and a progression from the grammar, every chord one the rung can realise."""
    g = GRAMMAR[recipe.mode]
    ok = lambda bar: all(name in allowed for name in bar)  # noqa: E731
    two_ok = recipe.metre != "3/4"
    antecedents = [p for p in g["antecedent"] if ok(p)]
    cadences = [c for c in g["cadence"] if all(ok(b) for b in c) and (two_ok or all(len(b) == 1 for b in c))]
    contrasts = [p for p in g["contrast"] if ok(p)]
    if not antecedents or not cadences or (recipe.bars > 8 and not contrasts):
        raise StudyRefusal(f"no progression in the grammar can be realised at {recipe.rung} in {recipe.key} {recipe.mode}")
    antecedent = rng.choice(antecedents)
    cadence = rng.choice(cadences)
    contrast = rng.choice(contrasts) if contrasts else None
    phrases_: list[tuple[int, int, str, str]] = []
    progression: list[list[str]] = []
    restated: dict[int, int] = {}
    consequent_start = None
    for index, (role, closing) in enumerate(FORMS[recipe.bars]):
        start = index * 4
        if role == "A":
            bars = [[c] for c in antecedent]
        elif role == "A'":
            if consequent_start is None:
                bars = [[antecedent[0]], [antecedent[1]], *[list(b) for b in cadence]]
                consequent_start = start
                restated[start] = 0
                restated[start + 1] = 1
            else:
                # The consequent again, whole: the return (16 bars).
                bars = [list(b) for b in progression[consequent_start:consequent_start + 4]]
                for offset in range(4):
                    restated[start + offset] = consequent_start + offset
        else:
            bars = [[c] for c in contrast]
        phrases_.append((start, start + 4, closing, role))
        progression.extend(bars)
    if recipe.harmonic_rhythm == 2:
        pairs = g["pairs"]
        for start, _end, _closing, role in phrases_:
            if role == "A'" and restated.get(start) is not None and restated[start] >= 4:
                continue
            # The cadence keeps its harmony: two chords a bar in the phrase's opening bars, and in
            # its third bar only before a half cadence (an authentic cadence's third bar is its V).
            for bar in range(start, start + (3 if _closing == "half" else 2)):
                if len(progression[bar]) == 1 and progression[bar][0] in pairs:
                    options = [second for second in pairs[progression[bar][0]] if second in allowed]
                    if options:
                        progression[bar] = [progression[bar][0], rng.choice(options)]
        # Restated bars take the harmony of the bars they restate.
        for bar, source in restated.items():
            progression[bar] = list(progression[source])
    return Plan(phrases_, progression, restated)


# --------------------------------------------------------------------------------------
# spelling: every pitch by the key, every chord tone by interval from its root
# --------------------------------------------------------------------------------------

SEMITONES = {"M": (0, 4, 7), "m": (0, 3, 7)}
INTERVAL_NAMES = {3: "m3", 4: "M3", 7: "P5", 10: "m7"}


def the_key(recipe: Recipe) -> key.Key:
    return key.Key(recipe.key if recipe.mode == "major" else recipe.key.lower())


def scale_of(recipe: Recipe) -> tuple[int, ...]:
    return ME.MINOR if recipe.mode == "minor" else ME.MAJOR


def tonic_pc(recipe: Recipe) -> int:
    return pitch.Pitch(recipe.key).pitchClass


@lru_cache(maxsize=None)
def _spelled(key_name: str, mode: str, step: int, raised: bool) -> str:
    k = key.Key(key_name if mode == "major" else key_name.lower())
    degree = step % 7
    base = pitch.Pitch(k.pitchFromDegree(degree + 1).name)
    scale = ME.MINOR if mode == "minor" else ME.MAJOR
    midi = pitch.Pitch(key_name).pitchClass + 12 * (step // 7) + scale[degree]
    base.octave = 4
    base.octave = 4 + (midi - base.midi) // 12
    if raised:
        base = base.transpose("A1")
    return base.nameWithOctave


def pitch_at(recipe: Recipe, step: int, raised: bool = False) -> pitch.Pitch:
    """The pitch on a scale step (the evaluator's numbering), spelled by the key; `raised` the minor's leading tone."""
    return pitch.Pitch(_spelled(recipe.key, recipe.mode, step, raised))


@lru_cache(maxsize=None)
def midi_at(key_name: str, mode: str, step: int, raised: bool = False) -> int:
    return pitch.Pitch(_spelled(key_name, mode, step, raised)).midi


@lru_cache(maxsize=None)
def position_at(key_name: str, mode: str, step: int, raised: bool = False) -> int:
    return written_position(pitch.Pitch(_spelled(key_name, mode, step, raised)))


def raised_degree(recipe: Recipe, chord_name: str | None) -> bool:
    """Over the minor's dominant the seventh degree is raised: the leading tone."""
    return recipe.mode == "minor" and chord_name in ("V", "V7")


def written_position(p: pitch.Pitch) -> int:
    """Staff position as the detectors count it: octave x 7 + letter (middle C is 28)."""
    return p.octave * 7 + "CDEFGAB".index(p.step)


def chord_pitches(recipe: Recipe, name: str, root: pitch.Pitch) -> list[pitch.Pitch]:
    """Root, third, fifth (and seventh) above `root`, spelled by interval (D0a's policy)."""
    _degree, quality, seventh = chord_spec(recipe.mode, name)
    tones = [pitch.Pitch(root.nameWithOctave)]
    for semis in SEMITONES[quality][1:]:
        tones.append(root.transpose(INTERVAL_NAMES[semis]))
    if seventh:
        tones.append(root.transpose("m7"))
    return tones


# --------------------------------------------------------------------------------------
# the left hand
# --------------------------------------------------------------------------------------

#: The left hand keeps off ledger lines: F2 (position 17) to middle C (28).
LH_LOW, LH_HIGH = 17, 28


def lh_tonic_step(recipe: Recipe) -> int:
    """The tonic's scale step for the left hand: in the octave below middle C, at F2 or above."""
    tonic = pitch_at(recipe, 7 * 3)  # an octave near C3
    step = 7 * 3
    while written_position(pitch_at(recipe, step)) > 24:
        step -= 7
    while written_position(pitch_at(recipe, step)) < LH_LOW:
        step += 7
    del tonic
    return step


def lh_root(recipe: Recipe, name: str, limits: Limits, previous: list[int] | None = None) -> pitch.Pitch | None:
    """
    The chord's root for the left hand; None where the rung cannot reach it.

    Every tone the texture sounds stays between F2 and middle C (a held root sounds its root alone);
    before the rung teaches moving the hand, the root stays in the five-note position above the
    tonic. Of the octaves that keep those, the one whose root is within an octave of every tone the
    hand sounded under the chord before (`previous`, MIDI numbers) and whose tones sit nearest them —
    the hand is voice-led, as a pianist's is: the physical gate found roots placed by the tonic alone
    jumping more than an octave from a waltz's chord to the next root — else nearest the tonic's place.
    """
    degree = chord_spec(recipe.mode, name)[0]
    home = lh_tonic_step(recipe)
    home_midi = pitch_at(recipe, home).midi
    best = None
    for step in (home + degree, home + degree - 7, home + degree + 7):
        p = pitch_at(recipe, step)
        sounding = [p] if recipe.texture == "sustained" else lh_voicing(recipe, name, p)
        if min(written_position(t) for t in sounding) < LH_LOW or max(written_position(t) for t in sounding) > LH_HIGH:
            continue
        if not limits.position and not (home <= step <= home + 4):
            continue
        if previous:
            reach = max(abs(p.midi - m) for m in previous)
            middle = sum(t.midi for t in sounding) / len(sounding)
            key_ = (reach > AN_OCTAVE_SEMITONES, abs(middle - sum(previous) / len(previous)), abs(p.midi - home_midi))
        else:
            key_ = (False, 0.0, abs(p.midi - home_midi))
        if best is None or key_ < best[0]:
            best = (key_, p)
    return None if best is None else best[1]


#: A move of the hand beyond this is a leap the physical gate judges (`family_contracts.AN_OCTAVE`).
AN_OCTAVE_SEMITONES = 12


def realisable_chords(recipe: Recipe, limits: Limits) -> set[str]:
    return {name for name in CHORDS[recipe.mode] if lh_root(recipe, name, limits) is not None}


@dataclass
class Event:
    """One written event of a staff: its onset and length in quarters, and its pitches (empty for a rest)."""

    onset: float
    length: float
    pitches: list[pitch.Pitch]


def bar_quarters(metre: str) -> float:
    beats, unit = (int(x) for x in metre.split("/"))
    return beats * 4 / unit


def lh_voicing(recipe: Recipe, name: str, root: pitch.Pitch) -> list[pitch.Pitch]:
    """The chord above its root, the upper tones kept at or under middle C by dropping them an octave above the root."""
    tones = chord_pitches(recipe, name, root)
    out = [tones[0]]
    for tone in tones[1:]:
        t = pitch.Pitch(tone.nameWithOctave)
        while written_position(t) > LH_HIGH and t.midi - 12 > root.midi:
            t.octave -= 1
        out.append(t)
    return out


def texture_events(recipe: Recipe, name: str, root: pitch.Pitch, onset: float, span: float,
                   final: bool) -> list[Event]:
    """The left hand under one chord for `span` quarters from `onset`."""
    tones = lh_voicing(recipe, name, root)
    triad = tones[:3]
    upper = sorted(tones[1:], key=lambda p: p.midi)
    t = recipe.texture
    if t == "sustained" or (final and t == "blocked"):
        return [Event(onset, span, [triad[0]])] if t == "sustained" else [Event(onset, span, triad)]
    if t == "blocked":
        return [Event(onset, span, sorted(tones, key=lambda p: p.midi))]
    if final:
        # The last bar: the pattern's root, then the chord held — two strikes, so the pattern is
        # still in every bar, ending on a chord rather than mid-figure.
        first = 1.5 if recipe.metre == "6/8" else 1.0
        return [Event(onset, first, [triad[0]]), Event(onset + first, span - first, upper)]
    figure: list[tuple[pitch.Pitch | list, float]]
    if t == "waltz":
        figure = [(triad[0], 1.0)] + [(upper, 1.0)] * int(span - 1)
    elif t == "broken":
        if recipe.metre == "6/8":
            cycle = [triad[0], triad[1], triad[2]]
            figure = [(cycle[i % 3], 0.5) for i in range(int(span / 0.5))]
        else:
            cycle = [triad[0], triad[1], triad[2], triad[1]]
            figure = [(cycle[i % 4], 1.0) for i in range(int(span))]
    else:  # alberti
        cycle = [triad[0], triad[2], triad[1], triad[2]]
        figure = [(cycle[i % 4], 0.5) for i in range(int(span / 0.5))]
    out = []
    at = onset
    for p, length in figure:
        out.append(Event(at, length, p if isinstance(p, list) else [p]))
        at += length
    return out


def left_hand(recipe: Recipe, plan: Plan, limits: Limits) -> list[Event]:
    bar = bar_quarters(recipe.metre)
    out: list[Event] = []
    previous: list[int] | None = None
    for index, names in enumerate(plan.progression):
        span = bar / len(names)
        for position, name in enumerate(names):
            root = lh_root(recipe, name, limits, previous)
            assert root is not None
            previous = [t.midi for t in ([root] if recipe.texture == "sustained" else lh_voicing(recipe, name, root))]
            final = index == len(plan.progression) - 1
            out += texture_events(recipe, name, root, index * bar + position * span, span, final)
    return out


# --------------------------------------------------------------------------------------
# the melody
# --------------------------------------------------------------------------------------

#: Bar rhythms, in quarters, with what each writes: `eighths` (a written eighth), `dotted` (a
#: dotted quarter in simple time), `syncopated` (a note of a quarter or longer off the beat).
CELLS: dict[str, list[tuple[tuple[float, ...], frozenset]]] = {
    "4/4": [
        ((1, 1, 1, 1), frozenset()), ((2, 1, 1), frozenset()), ((1, 1, 2), frozenset()),
        ((1, 2, 1), frozenset()), ((2, 2), frozenset()),
        ((0.5, 0.5, 1, 1, 1), frozenset({"eighths"})), ((1, 0.5, 0.5, 1, 1), frozenset({"eighths"})),
        ((1, 1, 0.5, 0.5, 1), frozenset({"eighths"})), ((0.5, 0.5, 0.5, 0.5, 1, 1), frozenset({"eighths"})),
        ((1, 1, 1, 0.5, 0.5), frozenset({"eighths"})), ((0.5, 0.5, 1, 2), frozenset({"eighths"})),
        ((1.5, 0.5, 1, 1), frozenset({"dotted", "eighths"})), ((1.5, 0.5, 2), frozenset({"dotted", "eighths"})),
        ((0.5, 1, 0.5, 1, 1), frozenset({"syncopated", "eighths"})),
        ((1, 0.5, 1, 0.5, 1), frozenset({"syncopated", "eighths"})),
        ((0.5, 1, 0.5, 2), frozenset({"syncopated", "eighths"})),
        ((0.5, 1, 1, 1, 0.5), frozenset({"syncopated", "eighths"})),
    ],
    "3/4": [
        ((1, 1, 1), frozenset()), ((2, 1), frozenset()), ((1, 2), frozenset()),
        ((0.5, 0.5, 1, 1), frozenset({"eighths"})), ((1, 0.5, 0.5, 1), frozenset({"eighths"})),
        ((1, 1, 0.5, 0.5), frozenset({"eighths"})), ((0.5, 0.5, 0.5, 0.5, 1), frozenset({"eighths"})),
        ((1.5, 0.5, 1), frozenset({"dotted", "eighths"})),
        ((0.5, 1, 0.5, 1), frozenset({"syncopated", "eighths"})), ((1, 0.5, 1, 0.5), frozenset({"syncopated", "eighths"})),
    ],
    "2/4": [
        ((1, 1), frozenset()), ((0.5, 0.5, 1), frozenset({"eighths"})), ((1, 0.5, 0.5), frozenset({"eighths"})),
        ((0.5, 0.5, 0.5, 0.5), frozenset({"eighths"})), ((0.5, 1, 0.5), frozenset({"syncopated", "eighths"})),
    ],
    "6/8": [
        ((1.5, 1.5), frozenset({"eighths"})), ((1, 0.5, 1, 0.5), frozenset({"eighths"})),
        ((1, 0.5, 1.5), frozenset({"eighths"})), ((1.5, 1, 0.5), frozenset({"eighths"})),
        ((0.5, 0.5, 0.5, 1.5), frozenset({"eighths"})), ((0.5, 0.5, 0.5, 1, 0.5), frozenset({"eighths"})),
        ((1, 0.5, 0.5, 0.5, 0.5), frozenset({"eighths"})),
    ],
}

#: The closing bar of a phrase: its last note long enough to be heard as an arrival. A `None`
#: length is a rest: the breath after a half cadence.
CADENCE_CELLS: dict[str, dict[str, list[tuple]]] = {
    "4/4": {"half": [(1, 1, 2), (2, 2), (3, None)], "authentic": [(4,), (2, 2), (1, 1, 2)]},
    "3/4": {"half": [(3,), (1, 2), (2, None)], "authentic": [(3,), (1, 2)]},
    "2/4": {"half": [(2,), (1, 1)], "authentic": [(2,)]},
    "6/8": {"half": [(3,), (1.5, 1.5), (1, 0.5, 1.5)], "authentic": [(3,), (1, 0.5, 1.5)]},
}


def cell_allowed(features: frozenset, limits: Limits, metre: str) -> bool:
    if "eighths" in features and not limits.eighths and metre != "6/8":
        return False
    if "dotted" in features and not limits.dotted:
        return False
    if "syncopated" in features and not limits.syncopation:
        return False
    return True


@dataclass
class Note:
    """One melody event: onset and length in quarters, scale step (None for a rest), raised (the minor's leading tone)."""

    onset: float
    length: float
    step: int | None
    raised: bool = False


@dataclass
class Draw:
    notes: list[Note]
    plan: Plan
    faults: list[str] = field(default_factory=list)


def strong_onsets(metre: str) -> list[float]:
    bar = bar_quarters(metre)
    return [0.0, bar / 2] if metre == "4/4" else [0.0]


def beat_of(metre: str) -> float:
    return 1.5 if metre == "6/8" else 1.0


def chord_name_at(recipe: Recipe, plan: Plan, onset: float) -> str:
    bar = bar_quarters(recipe.metre)
    index = int(onset // bar + 1e-9)
    names = plan.progression[index]
    share = bar / len(names)
    return names[min(len(names) - 1, int((onset - index * bar) // share + 1e-9))]


def chord_degrees(recipe: Recipe, name: str) -> set[int]:
    root, _quality, seventh = chord_spec(recipe.mode, name)
    out = {root % 7, (root + 2) % 7, (root + 4) % 7}
    if seventh:
        out.add((root + 6) % 7)
    return out


@dataclass
class Window:
    low: int
    high: int
    positions: list[tuple[int, int]]  # per phrase: the five-note position it keeps to, or the window


def melody_home(recipe: Recipe) -> int:
    """The tonic's step for the right hand: the lowest tonic at or above middle C."""
    step = 7 * 4
    while written_position(pitch_at(recipe, step)) >= 28 + 7:
        step -= 7
    while written_position(pitch_at(recipe, step)) < 28:
        step += 7
    return step


def melody_window(recipe: Recipe, limits: Limits, plan: Plan) -> Window:
    home = melody_home(recipe)
    top = home + 8
    while written_position(pitch_at(recipe, top)) > 39:  # G5: above it a ledger line
        top -= 1
    low = max(home - 2, home)
    while low > home - 2 and written_position(pitch_at(recipe, low - 1)) >= 28:
        low -= 1
    if not limits.position:
        return Window(home, home + 4, [(home, home + 4)] * len(plan.phrases))
    if recipe.target == "position-shift":
        # The contrasting phrase in another five-note position: up a fourth where the staff has room
        # above, otherwise down a fourth (the lower position ends on the dominant below the tonic).
        other = (home + 3, home + 7) if home + 7 <= top else (home - 4, home)
        if other[0] < low - 0 and written_position(pitch_at(recipe, other[0])) < 28:
            raise StudyRefusal(f"no second five-note position fits the staff in {recipe.key} {recipe.mode}")
        positions = [other if role == "B" else (home, home + 4) for _s, _e, _c, role in plan.phrases]
        return Window(min(p[0] for p in positions), max(p[1] for p in positions), positions)
    return Window(low, top, [(low, top)] * len(plan.phrases))


#: How the walk weighs a move by its size in scale steps, per target: the reading target leans on
#: skips; everything else moves mostly by step.
MOVE_WEIGHTS = {
    "interval-reading": {0: 0.08, 1: 3.0, 2: 3.2, 3: 0.8, 4: 0.5},
    "default": {0: 0.2, 1: 4.0, 2: 2.0, 3: 0.6, 4: 0.4},
}

CONTOURS = ("arch", "ascent", "descent", "valley")


def goal_for(contour: str, position: tuple[int, int], fraction: float, start: int, end_goal: int) -> float:
    """Where the contour wants the line at a fraction of the phrase."""
    low, high = position
    mid = (low + high) / 2
    if contour == "arch":
        peak = high - 0.5
        return start + (peak - start) * (fraction / 0.6) if fraction < 0.6 else peak + (end_goal - peak) * ((fraction - 0.6) / 0.4)
    if contour == "valley":
        trough = low + 0.5
        return start + (trough - start) * (fraction / 0.5) if fraction < 0.5 else trough + (end_goal - trough) * ((fraction - 0.5) / 0.5)
    if contour == "ascent":
        return start + (max(end_goal, mid + 1) - start) * fraction
    return start + (min(end_goal, mid - 1) - start) * fraction


def cadence_tones(recipe: Recipe, closing: str, final_phrase: bool) -> list[int]:
    """The degrees a phrase may close its melody on: the tonic at the close, a tone of the dominant at a half cadence."""
    if closing == "authentic":
        return [0] if final_phrase else [0, 2]
    return [4, 1, 6]


def steps_of_degree(degree: int, low: int, high: int) -> list[int]:
    return [s for s in range(low, high + 1) if s % 7 == degree]


def draw_rhythm(recipe: Recipe, limits: Limits, rng: random.Random, plan: Plan) -> list[list[float | None]]:
    """Each bar's rhythm: the motif cell, restated or varied, and a cadence cell closing each phrase."""
    target = recipe.target
    cells = [c for c in CELLS[recipe.metre] if cell_allowed(c[1], limits, recipe.metre)]
    if target != "syncopation":
        cells = [c for c in cells if "syncopated" not in c[1]]
    if not cells:
        raise StudyRefusal(f"no rhythm cell in {recipe.metre} is taught at {recipe.rung}")

    def pick(prefer: str | None = None) -> tuple[float, ...]:
        if prefer:
            preferred = [c for c in cells if prefer in c[1]]
            if preferred and rng.random() < 0.8:
                return rng.choice(preferred)[0]
        return rng.choice(cells)[0]

    prefer = {"subdivision": "eighths", "syncopation": "syncopated"}.get(target)
    motif = pick(prefer)
    second = pick(prefer)
    bars: list[list[float | None]] = [[] for _ in range(recipe.bars)]
    for start, end, closing, role in plan.phrases:
        if role == "A'" and plan.restated.get(start, -1) >= 4:
            for offset in range(4):
                bars[start + offset] = list(bars[plan.restated[start + offset]])
            continue
        choice_a = [motif, motif if rng.random() < 0.4 else second, second if rng.random() < 0.6 else motif]
        if role == "A'":
            choice_a = [list(bars[plan.restated[start]]), list(bars[plan.restated[start + 1]]),
                        motif if rng.random() < 0.6 else pick(prefer)]
        elif role == "B":
            choice_a = [motif, motif if rng.random() < 0.5 else second, pick(prefer)]
        for offset in range(3):
            bars[start + offset] = list(choice_a[offset])
        final_phrase = end == recipe.bars
        closing_cells = CADENCE_CELLS[recipe.metre]["authentic" if closing == "authentic" else "half"]
        if final_phrase:
            closing_cells = [c for c in closing_cells if None not in c]
        bars[end - 1] = list(rng.choice(closing_cells))
    return bars


def is_syncopated(onset: float, length: float, metre: str) -> bool:
    beat = beat_of(metre)
    into = onset % beat
    return into > 1e-9 and beat - into > 1e-9 and length >= 1 - 1e-9


class Realiser:
    """One recipe's draws: the plan, the left hand, the rhythm and the pitches, each from the recipe's seed."""

    def __init__(self, recipe: Recipe, adversary: str | None = None):
        faults = recipe_faults(recipe)
        if faults:
            raise StudyRefusal("; ".join(faults))
        self.recipe = recipe
        self.limits = Limits.of(recipe.rung)
        self.allowed = realisable_chords(recipe, self.limits)
        self.adversary = adversary
        digest = hashlib.sha256(json.dumps(asdict(recipe), sort_keys=True).encode("utf-8")).hexdigest()
        self.rng = random.Random(int(digest[:12], 16))
        self.plan = draw_plan(recipe, self.rng, self.allowed)
        self.window = melody_window(recipe, self.limits, self.plan)
        self.max_leap = 4

    # -- one draw ----------------------------------------------------------------------

    def draw(self) -> Draw:
        rng = self.rng
        recipe = self.recipe
        plan = self.plan
        rhythm = draw_rhythm(recipe, self.limits, rng, plan)
        bar_q = bar_quarters(recipe.metre)
        notes: list[Note] = []
        weights = MOVE_WEIGHTS.get(recipe.target, MOVE_WEIGHTS["default"])
        strong = strong_onsets(recipe.metre)
        previous: int | None = None
        for index, (start, end, closing, role) in enumerate(plan.phrases):
            position = self.window.positions[index]
            final_phrase = end == recipe.bars
            contour = rng.choice(CONTOURS)
            restated_from = plan.restated.get(start)
            phrase_notes: list[Note] = []
            if restated_from is not None and self.adversary is None:
                count = 4 if restated_from >= 4 else 2
                for offset in range(count):
                    source = restated_from + offset
                    for n in notes:
                        if source * bar_q <= n.onset < (source + 1) * bar_q:
                            phrase_notes.append(Note(n.onset + (start + offset - source) * bar_q, n.length, n.step, n.raised))
                if count == 4:
                    notes += phrase_notes
                    previous = next((n.step for n in reversed(notes) if n.step is not None), previous)
                    continue
                previous = next((n.step for n in reversed(phrase_notes) if n.step is not None), previous)
            onsets: list[tuple[float, float | None]] = []
            for bar in range(start, end):
                if restated_from is not None and self.adversary is None and bar < start + 2:
                    continue
                at = bar * bar_q
                for length in rhythm[bar]:
                    onsets.append((at, length))
                    at += length if length is not None else bar_q - (at - bar * bar_q)
            goal_end_choices = [d for d in cadence_tones(recipe, closing, final_phrase)
                                if steps_of_degree(d, *position)]
            if not goal_end_choices:
                raise StudyRefusal(f"phrase at bar {start + 1}: no cadence tone in its position")
            end_degree = rng.choice(goal_end_choices)
            end_candidates = steps_of_degree(end_degree, *position)
            end_goal = rng.choice(end_candidates)
            start_step = previous if previous is not None else rng.choice(
                [s for s in range(position[0], position[1] + 1)
                 if s % 7 in chord_degrees(recipe, plan.progression[start][0])] or [position[0]])
            sounding = [(o, l) for o, l in onsets if l is not None]
            b_shape = None
            if role == "B" and self.adversary is None and rng.random() < 0.7:
                b_shape = self._motif_shape(notes, bar_q)
            for i, (onset, length) in enumerate(onsets):
                if length is None:
                    phrase_notes.append(Note(onset, bar_q - (onset % bar_q), None))
                    continue
                last = i == len(onsets) - 1 or all(l is None for _o, l in onsets[i + 1:])
                name = chord_name_at(recipe, plan, onset)
                raised_ok = raised_degree(recipe, name)
                fraction = (onset - start * bar_q) / (4 * bar_q)
                goal = goal_for(contour, position, fraction, start_step, end_goal)
                ahead = goal_for(contour, position, min(1.0, fraction + 0.1), start_step, end_goal)
                direction = 0 if abs(ahead - goal) < 0.05 else (1 if ahead > goal else -1)
                on_strong = (onset % bar_q) in strong
                sounding_index = sounding.index((onset, length))
                penultimate = sounding_index == len(sounding) - 2
                if self.adversary == "random-walk":
                    step = self._walk_step(previous, position, last, end_candidates)
                elif last:
                    step = self._closest(end_candidates, previous)
                elif b_shape is not None and onset < (start + 1) * bar_q and previous is not None:
                    step = self._shaped(b_shape, phrase_notes, previous, position, name, on_strong)
                else:
                    history = [n.step for n in notes + phrase_notes if n.step is not None][-3:]
                    step = self._choose(previous, position, name, on_strong, goal, weights,
                                        end_goal if penultimate else None, history, direction)
                raised = raised_ok and step % 7 == 6
                phrase_notes.append(Note(onset, length, step, raised))
                previous = step
            notes += phrase_notes
        return Draw(sorted(notes, key=lambda n: n.onset), plan)

    def _motif_shape(self, notes: list[Note], bar_q: float) -> list[int]:
        first = [n.step for n in notes if n.onset < bar_q and n.step is not None]
        return [b - a for a, b in zip(first, first[1:])]

    def _shaped(self, shape: list[int], phrase_notes: list[Note], previous: int, position: tuple[int, int],
                name: str, on_strong: bool) -> int:
        """The motif's interval shape carried to the contrasting phrase (a sequence), where it fits."""
        index = sum(1 for n in phrase_notes if n.step is not None)
        if index == 0:
            candidates = [s for s in range(position[0], position[1] + 1) if s % 7 in chord_degrees(self.recipe, name)]
            return self._closest(candidates, previous) if candidates else previous
        move = shape[index - 1] if index - 1 < len(shape) else 0
        step = previous + move
        if position[0] <= step <= position[1] and (not on_strong or step % 7 in chord_degrees(self.recipe, name)):
            return step
        return self._choose(previous, position, name, on_strong, previous, MOVE_WEIGHTS["default"], None)

    def _closest(self, candidates: list[int], previous: int | None) -> int:
        if previous is None:
            return self.rng.choice(candidates)
        best = min(abs(c - previous) for c in candidates)
        return self.rng.choice([c for c in candidates if abs(c - previous) == best])

    def _walk_step(self, previous: int | None, position: tuple[int, int], last: bool, end_candidates: list[int]) -> int:
        """The adversary: a uniform walk, the cadence tone forced at the end (the hard layer), nothing shaped."""
        if last:
            return self._closest(end_candidates, previous)
        if previous is None:
            return self.rng.randint(position[0], position[1])
        options = [previous + m for m in range(-self.max_leap, self.max_leap + 1)
                   if position[0] <= previous + m <= position[1]]
        return self.rng.choice(options)

    def _choose(self, previous: int | None, position: tuple[int, int], name: str, on_strong: bool,
                goal: float, weights: dict[int, float], approach_to: int | None,
                history: list[int] | None = None, direction: int = 0) -> int:
        """
        The next pitch: a tone of the chord on a strong beat; a move weighted by its size and by the
        contour's goal; **against the contour's direction only a step back** (a neighbour or a
        passing note, which a reader hears as ornament, never a skip that turns the line — the
        distribution suite found the five-note studies wandering without it); after a leap, a step
        back (a leap is recovered, not followed by another); no third strike of one pitch running,
        no rocking between two, no tritone or augmented second.
        """
        recipe = self.recipe
        tones = chord_degrees(recipe, name)
        low, high = position
        history = history or []
        last_move = history[-1] - history[-2] if len(history) >= 2 else 0
        options = []
        for step in range(low, high + 1):
            if previous is not None and forbidden_interval(recipe, previous, step, name):
                continue
            degree = step % 7
            if recipe.mode == "minor" and raised_degree(recipe, name) and degree == 5:
                continue  # no augmented second against the leading tone
            if on_strong and degree not in tones:
                continue
            if previous is None:
                size = 0
            else:
                size = abs(step - previous)
                if size > self.max_leap:
                    continue
                against = direction != 0 and (step - previous) * direction < 0
                if against and size > 1 and approach_to is None and abs(last_move) < 3:
                    continue
            w = weights.get(size, 0.1) if previous is not None else 1.0
            if degree in tones:
                w *= 1.6
            w *= 1.0 / (1.0 + 1.2 * abs(step - goal))
            if approach_to is not None and abs(step - approach_to) > 2:
                w *= 0.2
            if approach_to is not None and abs(step - approach_to) == 1:
                w *= 2.0
            if approach_to is not None and step == approach_to:
                w *= 0.05  # not the closing note struck twice: the phrase arrives on it
            if previous is not None and abs(last_move) >= 3:
                move = step - previous
                if abs(move) >= 3 or move == 0:
                    w *= 0.05
                elif (move > 0) != (last_move > 0):
                    w *= 3.0
            if previous is not None and step == previous and len(history) >= 2 and history[-2] == previous:
                continue  # never a third strike of one pitch running
            if len(history) >= 2 and step == history[-2] and history[-1] != step and len(history) >= 3                     and history[-3] == history[-1]:
                w *= 0.1  # a b a b: rocking
            options.append((step, w))
        if approach_to is not None:
            # The note before a phrase's last: a step from it where one is there to take, else the
            # dominant (5 to 1 at the close), else whatever the walk allows.
            by_step = [(st, w) for st, w in options if abs(st - approach_to) == 1]
            dominant = [(st, w) for st, w in options if st % 7 == 4 and st != approach_to]
            options = by_step or dominant or options
        if not options:
            candidates = [s for s in range(low, high + 1) if s % 7 in tones] or [low]
            return self._closest(candidates, previous)
        total = sum(w for _s, w in options)
        r = self.rng.random() * total
        for step, w in options:
            r -= w
            if r <= 0:
                return step
        return options[-1][0]

    # -- the hard layer ----------------------------------------------------------------

    def hard_faults(self, draw: Draw) -> list[str]:
        recipe = self.recipe
        limits = self.limits
        plan = draw.plan
        out: list[str] = []
        sounding = [n for n in draw.notes if n.step is not None]
        steps = [n.step for n in sounding]
        if not sounding:
            return ["no melody"]
        midis = [midi_at(recipe.key, recipe.mode, n.step, n.raised) for n in sounding]
        for n in sounding:
            position = position_at(recipe.key, recipe.mode, n.step, n.raised)
            if position < 28 or position > 39:
                out.append(f"range: step {n.step} needs a ledger line")
                break
        if not limits.position and max(midis) - min(midis) > 7:
            out.append(f"position: the right hand spans {max(midis) - min(midis)} semitones before the rung teaches moving the hand")
        for a, b in zip(steps, steps[1:]):
            if abs(b - a) > self.max_leap:
                out.append(f"leap: {abs(b - a)} scale steps, beyond the cap of {self.max_leap}")
                break
        for x, y, z in zip(sounding, sounding[1:], sounding[2:]):
            if x.step == y.step == z.step:
                out.append("repeat: one pitch struck three times running")
                break
        for x, y in zip(sounding, sounding[1:]):
            semis = abs(midi_at(recipe.key, recipe.mode, y.step, y.raised) - midi_at(recipe.key, recipe.mode, x.step, x.raised))
            if awkward(abs(y.step - x.step), semis):
                out.append("interval: an augmented or diminished melodic interval")
                break
        # The close: the last note approached by step (from 2 or 7) or from the dominant (5).
        if len(sounding) >= 2 and not (abs(sounding[-1].step - sounding[-2].step) == 1 or sounding[-2].step % 7 == 4):
            out.append("cadence: the close is approached by neither a step nor the dominant")
        bar_q = bar_quarters(recipe.metre)
        for n in draw.notes:
            if n.length < 1 - 1e-9 and not limits.eighths and recipe.metre != "6/8":
                out.append("rhythm: a note shorter than a quarter before the rung teaches eighths")
                break
            if n.step is not None and is_syncopated(n.onset % bar_q, n.length, recipe.metre) and not (
                    limits.syncopation and recipe.target == "syncopation"):
                out.append("rhythm: a note of a quarter or longer off the beat")
                break
        # Each phrase closes on its cadence's tone.
        for start, end, closing, _role in plan.phrases:
            final = [n for n in sounding if start * bar_q <= n.onset < end * bar_q]
            if not final:
                out.append(f"cadence: phrase at bar {start + 1} has no note")
                continue
            degree = final[-1].step % 7
            allowed = cadence_tones(recipe, closing, end == recipe.bars)
            if degree not in allowed:
                out.append(f"cadence: phrase at bar {start + 1} closes on degree {degree + 1}")
            elif len(final) >= 2 and final[-2].step == final[-1].step:
                out.append(f"cadence: phrase at bar {start + 1} strikes its closing note twice")
        # Strong beats on a tone of the chord (the realiser's rule; the evaluator scores the rest).
        # The target at the recipe's density, in the realiser's own count.
        out += self.target_faults(draw)
        out += repetition_faults(self.bars_of(draw), plan.restated)
        return out

    def target_faults(self, draw: Draw) -> list[str]:
        recipe = self.recipe
        sounding = [n for n in draw.notes if n.step is not None]
        steps = [n.step for n in sounding]
        bars = recipe.bars
        bar_q = bar_quarters(recipe.metre)
        target = recipe.target
        out = []
        if target == "interval-reading":
            skips = sum(1 for a, b in zip(steps, steps[1:]) if abs(b - a) == 2)
            moves = sum(1 for a, b in zip(steps, steps[1:]) if b != a)
            steps_ = sum(1 for a, b in zip(steps, steps[1:]) if abs(b - a) == 1)
            if skips < max(6, round(0.75 * bars)):
                out.append(f"target: {skips} skips in the melody, the recipe asks for {max(6, round(0.75 * bars))}")
            if steps_ < max(4, bars // 2):
                out.append(f"target: {steps_} steps in the melody, the recipe asks for {max(4, bars // 2)}: step read against skip")
            if moves and skips / moves > 0.6:
                out.append(f"target: skips are {skips / moves:.2f} of the moves: an arpeggio shape, not step read against skip")
        elif target == "subdivision":
            eighths = sum(1 for n in sounding if abs(n.length - 0.5) < 1e-9)
            bars_with = len({int(n.onset // bar_q) for n in sounding if abs(n.length - 0.5) < 1e-9})
            if eighths < 8 or bars_with < bars / 2:
                out.append(f"target: {eighths} eighths in {bars_with} bars, the recipe asks for 8 in half the bars")
        elif target == "syncopation":
            count = sum(1 for n in sounding if is_syncopated(n.onset % bar_q, n.length, recipe.metre))
            bars_with = len({int(n.onset // bar_q) for n in sounding if is_syncopated(n.onset % bar_q, n.length, recipe.metre)})
            if count < max(4, bars // 2) or bars_with < bars / 2 - 1:
                out.append(f"target: {count} off-beat notes in {bars_with} bars, the recipe asks for one a bar in half of them")
        elif target == "position-shift":
            midis = [midi_at(recipe.key, recipe.mode, n.step, n.raised) for n in sounding]
            widen = 0
            low = high = midis[0]
            for m in midis[1:]:
                if m < low or m > high:
                    low, high = min(low, m), max(high, m)
                    if high - low > 7:
                        widen += 1
            if widen < 2:
                out.append(f"target: the hand widens past its position {widen} times, the recipe asks for 2")
        elif target == "texture.hands-together":
            # Every left-hand strike sounds with the right hand: the hands change together.
            if getattr(self, "_lh", None) is None:
                self._lh = left_hand(recipe, draw.plan, self.limits)
            for e in self._lh:
                if not any(n.onset <= e.onset + 1e-9 < n.onset + n.length for n in sounding):
                    out.append(f"target: the left hand strikes alone at quarter {e.onset:g}")
                    break
        return out

    def bars_of(self, draw: Draw) -> list[str]:
        """Each bar's melody as written (rhythm and pitches): what the repetition rule compares."""
        bar_q = bar_quarters(self.recipe.metre)
        out = []
        for bar in range(self.recipe.bars):
            here = [n for n in draw.notes if bar * bar_q <= n.onset < (bar + 1) * bar_q]
            out.append(" ".join(f"{n.onset - bar * bar_q:g}:{n.length:g}:{'r' if n.step is None else n.step}" for n in here))
        return out

    # -- scoring ---------------------------------------------------------------------

    def facts(self) -> dict:
        """What the study declares, beside its notes, for the evaluator (`drill.study` on the row)."""
        return {
            "tonic": tonic_pc(self.recipe), "mode": self.recipe.mode,
            "progression": [evaluator_chords(self.recipe.mode, bar) for bar in self.plan.progression],
            "chords": self.plan.progression,
            "phrases": [[start, end, closing] for start, end, closing, _role in self.plan.phrases],
            "form": [role for _s, _e, _c, role in self.plan.phrases],
            "restated": sorted(self.plan.restated),
            "maxLeap": self.max_leap,
        }

    def model_of(self, draw: Draw) -> ME.Model:
        """The draw as the evaluator reads it: the same notes the score will carry, in divisions."""
        bar_q = bar_quarters(self.recipe.metre)
        bars: list[list[ME.WrittenNote]] = [[] for _ in range(self.recipe.bars)]
        for n in draw.notes:
            bar = int(n.onset // bar_q + 1e-9)
            midi = None if n.step is None else midi_at(self.recipe.key, self.recipe.mode, n.step, n.raised)
            bars[bar].append(ME.WrittenNote(midi, n.length * ME.DIVISIONS))
        facts = self.facts()
        return ME.Model(tonic=facts["tonic"], scale=scale_of(self.recipe),
                        metre=ME.Metre(*(int(x) for x in self.recipe.metre.split("/"))),
                        bars=self.recipe.bars, melody=ME.place_melody(bars),
                        harmony=[[ME.Chord(c["root"], bool(c.get("seventh"))) for c in bar] for bar in facts["progression"]],
                        max_leap=self.max_leap, rests_allowed=True, level=None,
                        phrases=[ME.Phrase(s, e, c) for s, e, c in facts["phrases"]],
                        restated=frozenset(self.plan.restated))

    def compose(self) -> tuple[Draw, dict]:
        """
        The study: draws until `CANDIDATES` keep the hard layer or the budget runs out; the valid
        ones scored; the earliest within `TOLERANCE` of the best, at or above the valid draws'
        lower quartile of notes, that clears the musical floor. Refused, with the reason, when none does.
        """
        valid: list[tuple[int, Draw, dict, int]] = []
        failures: dict[str, int] = {}
        draws = 0
        while draws < BUDGET and len(valid) < (1 if self.adversary else CANDIDATES):
            draws += 1
            d = self.draw()
            faults = self.hard_faults(d)
            if faults:
                kind = faults[0].split(":")[0]
                failures[kind] = failures.get(kind, 0) + 1
                continue
            scored = ME.score_study(self.model_of(d))
            events = sum(1 for n in d.notes if n.step is not None)
            valid.append((draws, d, scored, events))
        report = {"draws": draws, "valid": len(valid), "failures": failures, "floor": MUSICAL_FLOOR}
        if not valid:
            raise StudyRefusal(f"no draw kept the hard layer within {BUDGET} draws ({failures})")
        if self.adversary:
            d, scored = valid[0][1], valid[0][2]
            report.update({"score": scored["total"], "parts": scored["parts"], "chosen": valid[0][0]})
            return d, report
        counts = sorted(v[3] for v in valid)
        floor_events = counts[(len(counts) - 1) // 4]
        eligible = [v for v in valid if v[3] >= floor_events and not v[2]["wrong"] and v[2]["total"] >= MUSICAL_FLOOR]
        if not eligible:
            best = max(v[2]["total"] for v in valid)
            raise StudyRefusal(f"{len(valid)} valid candidates in {draws} draws, none at or above the musical floor "
                               f"{MUSICAL_FLOOR} (best {best:.3f})")
        best = max(v[2]["total"] for v in eligible)
        chosen = next(v for v in eligible if v[2]["total"] >= best - TOLERANCE)
        report.update({"score": chosen[2]["total"], "parts": chosen[2]["parts"], "chosen": chosen[0],
                       "best": best, "eligible": len(eligible)})
        return chosen[1], report


#: The semitones a melodic interval of each size on the staff may span: seconds, thirds, the perfect
#: fourth and fifth. Anything else is augmented or diminished — the tritone either way, the minor's
#: augmented second and its leading tone's diminished fourth and augmented fifth — which no study
#: asks a reader to sing or a hand to find.
DIATONIC_SIZES = {0: (0,), 1: (1, 2), 2: (3, 4), 3: (5,), 4: (7,)}


def awkward(size: int, semis: int) -> bool:
    return semis not in DIATONIC_SIZES.get(size, (semis,))


def forbidden_interval(recipe: Recipe, a: int, b: int, chord_name: str | None = None) -> bool:
    """An augmented or diminished melodic interval (`DIATONIC_SIZES`), with the minor's leading tone where it sounds."""
    raised = raised_degree(recipe, chord_name)
    ma = midi_at(recipe.key, recipe.mode, a, raised and a % 7 == 6)
    mb = midi_at(recipe.key, recipe.mode, b, raised and b % 7 == 6)
    return awkward(abs(b - a), abs(mb - ma))


def repetition_faults(bars: list[str], restated, allowed: int = 1) -> list[str]:
    """The family contracts' rule (`family_contracts.repetition_faults`): one definition, the gate's."""
    import family_contracts

    return family_contracts.repetition_faults(bars, restated, allowed)


# --------------------------------------------------------------------------------------
# writing the score
# --------------------------------------------------------------------------------------


def item_id(recipe: Recipe) -> str:
    """`exercise.study.<target>.<key>-<mode>.<metre>.<bars>bar.<texture>.<seed>`: unique over the recipe's surface."""
    import generate_exercises as G

    target = recipe.target.replace(".", "-")
    metre = recipe.metre.replace("/", "-")
    return f"exercise.study.{target}.{G.key_slug(recipe.key)}-{recipe.mode}.{metre}.{recipe.bars}bar.{recipe.texture}.{recipe.seed:02d}"


def title_of(recipe: Recipe) -> str:
    target = TARGETS[recipe.target]["words"]
    name = recipe.key.replace("-", "♭").replace("#", "♯")
    metre = "" if recipe.metre == "4/4" or recipe.target == "metre.compound" else f" in {recipe.metre}"
    return f"Study in {name} {recipe.mode}{metre} — {target}, {TEXTURE_WORDS[recipe.texture]}"


def write_score(recipe: Recipe, draw: Draw, limits: Limits):
    """The two staves, through the generator's own grand staff and finishing (`finalize`)."""
    import generate_exercises as G

    sc, rh, lh = G.grand_staff(title_of(recipe), recipe.bpm, ts=recipe.metre, ks=the_key(recipe))
    for n in draw.notes:
        if n.step is None:
            rh.append(note.Rest(quarterLength=n.length))
        else:
            rh.append(note.Note(pitch_at(recipe, n.step, n.raised), quarterLength=n.length))
    for e in left_hand(recipe, draw.plan, limits):
        if len(e.pitches) == 1:
            lh.append(note.Note(pitch.Pitch(e.pitches[0].nameWithOctave), quarterLength=e.length))
        else:
            lh.append(m21chord.Chord([pitch.Pitch(p.nameWithOctave) for p in e.pitches], quarterLength=e.length))
    G.finalize(sc)
    return sc


def compose(recipe: Recipe, adversary: str | None = None):
    """`(score, facts, report)` for a recipe: the written study, what it declares, and how it was chosen."""
    realiser = Realiser(recipe, adversary)
    draw, report = realiser.compose()
    score = write_score(recipe, draw, realiser.limits)
    return score, realiser.facts(), report


def page_score(score, facts: dict) -> dict:
    """The musical evaluator on the written page (`musical_evaluator.study_model`), not on the realiser's notes."""
    return ME.score_study(ME.study_model(score, facts))


# --------------------------------------------------------------------------------------
# the plan: the first targets, each canonical, in two variable realisations, and in transfer
# --------------------------------------------------------------------------------------

#: `role` is informational here: the contract's `roles.assign` decides it from the recipe.
PLAN = [
    # interval-reading at 2.1: a C-position melody over held roots (the first rung with both hands).
    Recipe("interval-reading", "C", "major", "4/4", 8, "sustained", "2.1", 1, 76),
    Recipe("interval-reading", "C", "major", "3/4", 8, "sustained", "2.1", 2, 80),
    Recipe("interval-reading", "C", "major", "4/4", 12, "sustained", "2.1", 3, 76),
    Recipe("interval-reading", "G", "major", "4/4", 8, "blocked", "3.1", 1, 80),
    # position-shift at 2.5: the hand leaves its position for the contrasting phrase and comes back.
    Recipe("position-shift", "C", "major", "4/4", 12, "blocked", "2.5", 1, 80),
    Recipe("position-shift", "C", "major", "3/4", 12, "sustained", "2.5", 2, 84),
    Recipe("position-shift", "C", "major", "4/4", 16, "blocked", "2.5", 3, 80),
    Recipe("position-shift", "B-", "major", "4/4", 12, "broken", "3.6", 1, 80),
    # subdivision at 2.2: eighth notes in a C-position melody.
    Recipe("subdivision", "C", "major", "4/4", 8, "sustained", "2.2", 1, 72),
    Recipe("subdivision", "C", "major", "2/4", 8, "sustained", "2.2", 2, 72),
    Recipe("subdivision", "C", "major", "3/4", 8, "sustained", "2.2", 3, 72),
    Recipe("subdivision", "F", "major", "3/4", 8, "waltz", "3.6", 1, 84),
    # syncopation at 4.5: off-beat notes over a left hand that keeps the beat.
    Recipe("syncopation", "C", "major", "4/4", 8, "broken", "4.5", 1, 84),
    Recipe("syncopation", "G", "major", "4/4", 8, "broken", "4.5", 2, 84),
    Recipe("syncopation", "F", "major", "4/4", 8, "alberti", "4.5", 3, 76),
    Recipe("syncopation", "D", "minor", "4/4", 8, "broken", "4.5", 1, 80),
    # compound time at 4.5.
    Recipe("metre.compound", "C", "major", "6/8", 8, "broken", "4.5", 1, 84),
    Recipe("metre.compound", "G", "major", "6/8", 8, "sustained", "4.5", 2, 84),
    Recipe("metre.compound", "A", "minor", "6/8", 8, "broken", "4.5", 3, 84),
    Recipe("metre.compound", "E-", "major", "6/8", 12, "blocked", "4.5", 1, 84),
    # hands together at 2.1: the left hand changing with the melody, twice a bar.
    Recipe("texture.hands-together", "C", "major", "4/4", 8, "sustained", "2.1", 1, 72, 2),
    Recipe("texture.hands-together", "C", "major", "2/4", 8, "sustained", "2.1", 2, 72, 2),
    Recipe("texture.hands-together", "C", "major", "4/4", 12, "sustained", "2.1", 3, 72, 2),
    Recipe("texture.hands-together", "B-", "major", "4/4", 8, "broken", "3.6", 1, 80, 2),
]


def recipe_from_params(params: dict, bpm: int) -> Recipe:
    return Recipe(params["target"], params["key"], params["quality"], params["timeSig"], params["bars"],
                  params["texture"], params["rung"], params["seed"], bpm, params.get("harmonicRhythm", 1))


# --------------------------------------------------------------------------------------
# the candidate-rungs report (the reviewer's required change: no placement in D3)
# --------------------------------------------------------------------------------------


def candidate_rungs(catalog: list[dict], curriculum: dict, family: str = "study") -> list[dict]:
    """
    For each item of `family` in the built catalogue: the rungs whose coping question leaves no
    demand it carries untaught (`claims.untaught_on` empty) and at least one of whose claims its
    measured demands establish (`claims.status_of` "established"), with the claims and the demands
    as evidence. The material a later placement decision reads beside a resolved teaching-use
    review; nothing here places anything.

    Each candidate rung also says how the coping question admits it (L120e, the reviewer's required
    change on L120d, `docs/review/responses/4e76c768.md`): `claims.coping_admission`'s three fields —
    the demands only a taught fixed position's note reading copes with there (L120b, L120d), the skills
    a run there is therefore never evidence of, and those of them among the study's `targetSkills`. The
    flag never adds or removes a candidate.
    """
    import claims

    skills, demands = claims.load_vocabulary()
    ancestry = claims.rung_ancestry(curriculum)
    out = []
    for item in catalog:
        if (((item.get("drill") or {}).get("generator")) or {}).get("family") != family:
            continue
        targets = list(item.get("targetSkills") or [])
        rows = []
        for _stage, _unit, lesson in claims.lessons_in_order(curriculum):
            rung = lesson["id"]
            if claims.untaught_on(item, rung, ancestry, demands, curriculum):
                continue
            rung_claims, _unmeasurable = claims.rung_claims_of(lesson, skills, demands)
            established = [c for c in rung_claims if claims.status_of(c, item, skills) == "established"]
            if established:
                rows.append({"rung": rung, "title": lesson.get("title"),
                             **claims.coping_admission(item, rung, ancestry, demands, curriculum, targets),
                             "established": [{"kind": c["kind"], "id": c["id"], "from": c["from"]} for c in established],
                             "notEstablished": [{"kind": c["kind"], "id": c["id"], "status": claims.status_of(c, item, skills)}
                                                for c in rung_claims if c not in established]})
        measurement = item.get("measurement") or {}
        out.append({"item": item["id"], "title": item["title"], "recipeRung": item["drill"]["params"]["rung"],
                    "demands": item.get("demands"), "located": measurement.get("located"),
                    "established": measurement.get("established"), "candidates": rows})
    return out


def candidate_rungs_markdown(report: list[dict]) -> str:
    import claims

    lines = ["# Candidate rungs for the generated studies (D3, Entry 100)", "",
             "Read from the built catalogue and curriculum by `study.candidate_rungs`: for each study, the rungs",
             "whose coping question leaves no demand it carries untaught (`claims.untaught_on` empty: the rung's",
             "ancestry, and since L120b its taught fixed positions)",
             "and whose claims its measured demands establish at a useful density (`claims.status_of`). **Nothing",
             "is placed**: no rung lists a study. Placement is F's, on a stated gate that needs no owner: a line",
             "below established on the combined build, and a current `goodTeachingUse: yes` in D2's record by a",
             "named reviewer. No owner review or placement is required. Until that decision exists a study stays in",
             "the Library and out of every automatic offer (D3a). Unheard; unverified as music.", "",
             *claims.ADMITTED_BY_NOTE, ""]
    for row in report:
        lines.append(f"## {row['title']}")
        lines.append("")
        lines.append(f"`{row['item']}` — written for rung {row['recipeRung']}. Measured demands: "
                     + ", ".join(f"{d} ({(row['located'] or {}).get(d, 0)})" for d in (row["demands"] or []))
                     + f". Established: {', '.join(row['established'] or []) or 'none'}.")
        lines.append("")
        if not row["candidates"]:
            lines.append("No rung: none both admits every demand it carries and has a claim it establishes.")
            lines.append("")
            continue
        lines.append("| Rung | Admitted by | Claims it establishes | Claims it does not |")
        lines.append("| --- | --- | --- | --- |")
        for c in row["candidates"]:
            est = "; ".join(f"{e['kind']} {e['id']} ({e['from']})" for e in c["established"])
            rest = "; ".join(f"{e['kind']} {e['id']}: {e['status']}" for e in c["notEstablished"]) or "—"
            lines.append(f"| {c['rung']} ({c['title']}) | {claims.admitted_by(c, 'study')} | {est} | {rest} |")
        lines.append("")
    return "\n".join(lines) + "\n"


def main(argv: list[str] | None = None) -> int:
    import argparse

    parser = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    parser.add_argument("--candidate-rungs", nargs=2, metavar=("CATALOG", "CURRICULUM"),
                        help="write the candidate-rungs report (markdown) from a built catalogue and curriculum")
    parser.add_argument("--out", help="where to write the report (default: stdout)")
    args = parser.parse_args(argv)
    if args.candidate_rungs:
        catalog = json.loads(Path(args.candidate_rungs[0]).read_text(encoding="utf-8"))
        curriculum = json.loads(Path(args.candidate_rungs[1]).read_text(encoding="utf-8"))
        text = candidate_rungs_markdown(candidate_rungs(catalog, curriculum))
        if args.out:
            Path(args.out).write_text(text, encoding="utf-8")
        else:
            print(text)
        return 0
    parser.print_help()
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
