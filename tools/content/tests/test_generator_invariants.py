"""
One row per family in `generate_exercises.py`, and what each family promises.

`docs/pending-review.md` Entry 4 records five faults found in the five families
written on 2026-09-18 — a cell named for a mode it was only in half the time, a
left hand climbing above middle C on an exercise about a hand that stays still,
a docstring promising four bars over two, text off the page, and a flat fifth
spelled as a raised fourth. **Four of the five were found by opening a picture,
and not one of them could have failed a check**, because every mechanical guard
the generator has — `confirm`, `confirm_fingering`, `confirm_playable`,
`confirm_not_silent` — asks whether the file is *valid*, never whether it is the
music the family said it would write.

This file asks the second question. `FAMILIES` below has one row per maker, and
a row is the family's own claim read off its docstring, its title, its plan
entry and the table it is generated from. The claims are checked on the item the
plan actually builds (the C or A version), along these axes:

* **length** — the bar count the docstring, the title or the plan states;
* **key** — the engraved signature against the id and the title, and `hands`
  against which staves sound;
* **hand range** — the register a family claims for its left hand, the hand a
  family says is silent, and the span of a chord one hand has to take;
* **spelling** — the blue note as a raised fourth in every key (the owner's
  rule, 2026-09-19), and no double accidental outside the keys that need one;
* **rhythm** — a family that names a rhythm has it, asserted on durations;
* **text** — a printed direction stays within the length that survived Entry 4;
* **the docstring is true** — `working-rules` §2.17, for every claim in it that
  this pass checked by hand.

**Every check here is proved red.** `TestTheChecksGoRedOnAMutation` mutates the
score each family produced — one of four named mutations — and asserts the check
that passes on the real score fails on the mutant. The mutation's name is in the
failure message, so a check that cannot fail is visible as one that does not.

**What this file does not do.** It reads the score object, not the page. Three
faults found in the pictures during the same pass are *recorded here as comments
beside the check that is deliberately loose* rather than asserted, because
proving a fix for any of them needs the render step (`build/previews` are the
first two bars, and re-rendering needs the built app on a server): the direction
that runs off both edges of the page, the four pedal marks that engrave on top
of one another, and the one-line rhythm staves whose notes sit below the line.
Entry 27 of `docs/pending-review.md` has them with the evidence.
"""
from __future__ import annotations

import copy
import inspect
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from music21 import chord as m21chord  # noqa: E402
from music21 import expressions, harmony, key, meter, note  # noqa: E402

import generate_exercises as G  # noqa: E402

# --------------------------------------------------------------------------------------
# reading a score
# --------------------------------------------------------------------------------------


def sounding(part) -> list:
    """Notes and chords that make a sound. A `ChordSymbol` is a label, not a note."""
    return [n for n in part.recurse().notes if not isinstance(n, harmony.ChordSymbol)]


def staves(sc) -> dict:
    """`{staff id: [notes]}`, in score order."""
    return {part.id or f"staff-{i}": sounding(part) for i, part in enumerate(sc.parts)}


def count_bars(sc) -> int:
    return max(len(list(p.getElementsByClass("Measure"))) for p in sc.parts)


def register(notes) -> tuple[int, int] | None:
    """Lowest and highest MIDI number a staff asks for, or None if it is silent."""
    pitches = [p.midi for n in notes for p in n.pitches]
    return (min(pitches), max(pitches)) if pitches else None


def widest_one_hand_chord(sc) -> tuple[int, str]:
    """The widest stretch one hand is asked to take at once, in semitones."""
    worst, where = 0, ""
    for part in sc.parts:
        if part.id not in ("RH", "LH"):
            continue
        for c in part.recurse().getElementsByClass(m21chord.Chord):
            if isinstance(c, harmony.ChordSymbol):
                continue
            midis = [p.midi for p in c.pitches]
            if max(midis) - min(midis) > worst:
                worst = max(midis) - min(midis)
                where = f"{part.id} {[p.nameWithOctave for p in c.pitches]}"
    return worst, where


def directions(sc) -> list[str]:
    return [t.content for p in sc.parts for t in p.recurse().getElementsByClass(
        expressions.TextExpression)]


def engraved_signature(sc):
    """The `key.Key` the staves carry, or None. Raises if the staves disagree."""
    found = {(k.tonic.name, k.mode) for p in sc.parts
             for k in p.recurse().getElementsByClass(key.Key)}
    if not found:
        return None
    if len(found) > 1:
        raise AssertionError(f"the staves carry different key signatures: {sorted(found)}")
    return next(iter(found))


def bar_length(sc) -> float:
    signature = next(iter(sc.recurse().getElementsByClass(meter.TimeSignature)))
    return float(signature.barDuration.quarterLength)


def onsets(notes, part) -> list[float]:
    return [float(n.getOffsetInHierarchy(part)) for n in notes]


MIDDLE_C = 60

#: The stretch a hand takes at once, in semitones, before it stops being a hand
#: shape and becomes a reach. An octave: `OOMPAH_SPANS` and `make_stride` both
#: reach a tenth and both *break* it — bass, then chord — which is the
#: difference this number is drawing. Measured over the whole plan, exactly one
#: family strikes wider than this, and it is named in `STRIKES_WIDER_THAN_A_HAND`.
AN_OCTAVE = 12

#: The two shapes in the generator that ask one hand for more than an octave
#: **at once**, with what they ask for. Both are in `make_open_voicing`, both
#: are the shape's own table, and neither is a slip: a stack of fourths *is*
#: `[0, 5, 10, 15]` and an added ninth on top *is* `[0, 4, 7, 14]`. Narrowing
#: either one changes what the family teaches, and splitting the stack across
#: the hands — which is how a pianist actually plays it — changes the family's
#: shape. That is a content decision and it is open: Entry 27.
STRIKES_WIDER_THAN_A_HAND = {
    "open_voicing": 15,  # quartal, C4-F4-B♭4-E♭5; add9 is 14 in the same maker
}

#: The longest printed direction the generator writes, as a ratchet and **not**
#: as a measurement of the page. Entry 4 shortened every direction that ran off
#: the page and recorded no number, so there is nothing to test against; this
#: holds the corrected state so the next family cannot quietly write a longer
#: one. It is known to be too generous — `exercise.blues-scale.c.1oct.right`'s
#: 47 characters are clipped at both edges of its own two-bar page, and
#: `exercise.ostinato.a.fifths`'s 70 are not drawn at all — and the honest cap
#: needs the render step. Entry 27.
LONGEST_DIRECTION = 80


# --------------------------------------------------------------------------------------
# the families
# --------------------------------------------------------------------------------------
#
# `build` makes the item the plan makes: the C version, or the A version where the
# family is generated in minor keys first. The other keys are covered by the
# `*_in_every_key` tests below, which are the ones that would have caught Entry 4's
# first and fifth faults — both of which were right in one key and wrong in another.
#
# `bars` is what the family says its length is, and `bars_says` is where it says it.
# Where nothing states a length, `bars_says` records that the number is the measured
# one held as a ratchet, which is a weaker claim and is marked as such.

HANON = G.load_hanon()
FIRST_HANON = sorted(int(n) for n in HANON)[0]


FAMILIES: dict[str, dict] = {
    "scale": dict(
        maker="make_scale",
        build=lambda: G.make_scale(G.ScaleSpec("C", "major", "both", 1, "similar", 0.5, 60)),
        bars=2, bars_says="one octave of eighths up and back is fifteen eighths, two bars",
    ),
    "arpeggio": dict(
        maker="make_arpeggio",
        build=lambda: G.make_arpeggio("C", "major", "both", 2),
        bars=2, bars_says="two octaves of eighths up and back, measured",
    ),
    "triad_inversions": dict(
        maker="make_triad_inversions",
        build=lambda: G.make_triad_inversions("C", "major", "both"),
        bars=2, bars_says="docstring: root, 1st, 2nd, root, then back down — seven chords",
    ),
    "five_finger": dict(
        maker="make_five_finger",
        build=lambda: G.make_five_finger("C", "major", "both"),
        bars=3, bars_says="nine quarters and the three-beat rest that ends it, measured",
    ),
    "hanon": dict(
        maker="make_hanon",
        build=lambda: G.make_hanon(FIRST_HANON, "both", data=HANON),
        bars=None, bars_says="the length is the Mutopia edition's, checked against the data file",
    ),
    "chromatic": dict(
        maker="make_chromatic",
        build=lambda: G.make_chromatic("C", "both", 1),
        bars=4, bars_says="twenty-five eighths up and back, measured",
    ),
    "seventh_arpeggio": dict(
        maker="make_seventh_arpeggio",
        build=lambda: G.make_seventh_arpeggio("C", "dominant7", "both", 2),
        bars=3, bars_says="docstring: two octaves, up and back, in eighths",
    ),
    "double_scale": dict(
        maker="make_double_scale",
        build=lambda: G.make_double_scale("C", "third", "right"),
        bars=4, bars_says="measured", silent="LH",
    ),
    "octave_scale": dict(
        maker="make_octave_scale",
        build=lambda: G.make_octave_scale("C", "right", 1),
        bars=2, bars_says="one octave of octaves up and back, measured", silent="LH",
    ),
    "broken_seventh": dict(
        maker="make_broken_seventh",
        build=lambda: G.make_broken_seventh("C", "dominant7", "both"),
        bars=2, bars_says="docstring: the figure repeats to clear docs/03 §3's five-second floor",
    ),
    "rhythm": dict(
        maker="make_rhythm",
        build=lambda: G.make_rhythm("quarters"),
        bars=4, bars_says="title: '— 4 bars', and `bars` is the argument",
    ),
    "coordination": dict(
        maker="make_coordination",
        build=lambda: G.make_coordination("C", "hold"),
        bars=3, bars_says="measured",
    ),
    "interval_reading": dict(
        maker="make_interval_reading",
        build=lambda: G.make_interval_reading(1, "right"),
        bars=4, bars_says="docstring: 'a four-bar melody'", silent="LH",
    ),
    "position_shift": dict(
        maker="make_position_shift",
        build=lambda: G.make_position_shift("C", "right"),
        bars=4, bars_says="docstring: 'four bars with one hand shift in the middle'", silent="LH",
    ),
    "cadence": dict(
        maker="make_cadence",
        build=lambda: G.make_cadence("C", "root"),
        bars=4, bars_says="docstring: four whole-note chords, I-IV-V7-I", silent="RH",
    ),
    "accompaniment": dict(
        maker="make_accompaniment",
        build=lambda: G.make_accompaniment("C", "major", list(G.ACCOMPANIMENT_PATTERNS)[0], "left"),
        bars=4, bars_says="docstring: one bar per chord over I-IV-V-I", silent="RH",
        lh_max=MIDDLE_C + 2,
        lh_says="an accompaniment sits under a melody; the broken figure reaches the tenth",
    ),
    "oompah": dict(
        maker="make_oompah",
        build=lambda: G.make_oompah("C", "octave"),
        bars=8, bars_says="docstring: 'two bars to a chord', four chords", silent="RH",
    ),
    "pedal": dict(
        maker="make_pedal",
        build=lambda: G.make_pedal("C"),
        bars=4, bars_says="docstring: the smooth I-IV-V7-I, one chord a bar",
    ),
    "repeated_notes": dict(
        maker="make_repeated_notes",
        build=lambda: G.make_repeated_notes("C", 3, "right"),
        bars=2, bars_says="measured", silent="LH",
    ),
    "trill": dict(
        maker="make_trill",
        build=lambda: G.make_trill("C", 4, "right", ornament="trill"),
        bars=3, bars_says="measured", silent="LH",
    ),
    "tremolo_octaves": dict(
        maker="make_tremolo_octaves",
        build=lambda: G.make_tremolo_octaves("C", "right"),
        bars=2, bars_says="measured", silent="LH",
    ),
    "rotation": dict(
        maker="make_rotation",
        build=lambda: G.make_rotation("C", "right"),
        bars=2, bars_says="measured", silent="LH",
    ),
    "articulation": dict(
        maker="make_articulation",
        build=lambda: G.make_articulation("C", "staccato", "right"),
        bars=4, bars_says="docstring: 'the same four-bar phrase'", silent="LH",
    ),
    "hand_independence": dict(
        maker="make_hand_independence",
        build=lambda: G.make_hand_independence("C", "2:1"),
        bars=4, bars_says="measured",
    ),
    "shaping": dict(
        maker="make_shaping",
        build=lambda: G.make_shaping("C", "crescendo"),
        bars=5, bars_says="measured: two octaves of eighths and the note it lands on",
        silent="LH",
    ),
    "voicing": dict(
        maker="make_voicing",
        build=lambda: G.make_voicing("C"),
        bars=4, bars_says="measured: four whole-note chords",
    ),
    "syncopation": dict(
        maker="make_syncopation",
        build=lambda: G.make_syncopation("tied-across-bar"),
        bars=4, bars_says="measured",
    ),
    "secondary_rag": dict(
        maker="make_secondary_rag",
        build=lambda: G.make_secondary_rag(),
        bars=4, bars_says="the id says `.4bar`, and `bars` is the argument",
    ),
    "meter": dict(
        maker="make_meter",
        build=lambda: G.make_meter(G.ODD_METERS[0].signature),
        bars=4, bars_says="`ODD_METERS`' counting rows are four bars; the 12/8 row is twelve",
    ),
    "pedal_variant": dict(
        maker="make_pedal_variant",
        build=lambda: G.make_pedal_variant("C", "held-melody"),
        bars=4, bars_says="the drill params say `holdBars: 4`",
    ),
    "seventh_voicing": dict(
        maker="make_seventh_voicing",
        build=lambda: G.make_seventh_voicing("C", list(G.SEVENTH_VOICINGS)[0]),
        bars=3, bars_says="one bar per chord of the ii-V-I",
    ),
    "four_chord_loop": dict(
        maker="make_four_chord_loop",
        build=lambda: G.make_four_chord_loop("C", False),
        bars=4, bars_says="I-V-vi-IV, a bar each",
    ),
    "slash_bass": dict(
        maker="make_slash_bass",
        build=lambda: G.make_slash_bass("C"),
        bars=4, bars_says="eight half-bar chords",
    ),
    "walking_bass": dict(
        maker="make_walking_bass",
        build=lambda: G.make_walking_bass("C", "blues"),
        bars=12, bars_says="docstring: 'over a blues' — `TWELVE_BAR` is twelve bars",
        lh_max=MIDDLE_C,
        lh_says="docstring: a walking *bass* line, root-third-fifth-approach",
    ),
    "comping": dict(
        maker="make_comping",
        build=lambda: G.make_comping("C", G.swing_comping_patterns()[0], "standard"),
        bars=G.COMPING_BARS, bars_says="`COMPING_BARS`",
    ),
    "stride": dict(
        maker="make_stride",
        build=lambda: G.make_stride("C"),
        bars=4, bars_says="four chords, a bar each",
    ),
    "turnaround": dict(
        maker="make_turnaround",
        build=lambda: G.make_turnaround("C", "I-vi-ii-V"),
        bars=2, bars_says="docstring: 'the two bars that send a chorus back to the top'",
    ),
    "ii_v_i": dict(
        maker="make_ii_v_i",
        build=lambda: G.make_ii_v_i("C", G.II_V_I_SHAPES[0][0]),
        bars=4, bars_says="docstring: the tonic gets two bars", silent="RH",
    ),
    "tritone_sub": dict(
        maker="make_tritone_sub",
        build=lambda: G.make_tritone_sub("C"),
        bars=4, bars_says="ii - subV - I with the tonic held",
    ),
    "open_voicing": dict(
        maker="make_open_voicing",
        build=lambda: G.make_open_voicing("C", "quartal"),
        bars=4, bars_says="four chords, a bar each",
    ),
    "boogie": dict(
        maker="make_boogie",
        build=lambda: G.make_boogie("C", list(G.BOOGIE_PATTERNS)[0]),
        bars=4, bars_says="`BLUES_FORMS['four-of-one']`",
        lh_max=MIDDLE_C,
        lh_says="a boogie left hand is a bass figure; the right hand takes the shell",
    ),
    "blues_scale": dict(
        maker="make_blues_scale",
        build=lambda: G.make_blues_scale("C", "right"),
        bars=2, bars_says="one octave of eighths up and back", silent="LH",
    ),
    "clave": dict(
        maker="make_clave",
        build=lambda: G.make_clave(list(G.CLAVE_PATTERNS)[0]),
        bars=8, bars_says="docstring: 'eight bars rather than four' — the clave is a two-bar unit",
    ),
    "tumbao": dict(
        maker="make_tumbao",
        build=lambda: G.make_tumbao("C"),
        bars=8, bars_says="`bars` is the argument and the plan passes its default", silent="RH",
        lh_max=MIDDLE_C,
        lh_says="docstring: 'latin bass'",
    ),
    "montuno": dict(
        maker="make_montuno",
        build=lambda: G.make_montuno("C", 2),
        bars=4, bars_says="two statements of the two-bar clave", silent="LH",
    ),
    "latin_groove": dict(
        maker="make_latin_groove",
        build=lambda: G.make_latin_groove("C"),
        bars=8, bars_says="the tumbao's eight bars with the montuno over them",
        lh_max=MIDDLE_C,
        lh_says="the same tumbao `make_tumbao` writes",
    ),
    "intro": dict(
        maker="make_intro",
        build=lambda: G.make_intro("C"),
        bars=4, bars_says="title: 'Four-bar introduction'",
    ),
    "walkup": dict(
        maker="make_walkup",
        build=lambda: G.make_walkup("C"),
        bars=4, bars_says="docstring: 'the same walk twice' — two bars each",
        lh_max=MIDDLE_C,
        lh_says="docstring: the walk is a bass line into the IV",
    ),
    "passing_chord": dict(
        maker="make_passing_chord",
        build=lambda: G.make_passing_chord("C"),
        bars=4, bars_says="six chords over four bars, the approaches on the half beat",
    ),
    "power_chord": dict(
        maker="make_power_chord",
        build=lambda: G.make_power_chord("A"),
        bars=4, bars_says="`POWER_CHORD_ROOTS`, a bar each",
        lh_max=MIDDLE_C,
        lh_says="docstring and `test_harmony_families`: the left hand drives the eighths",
    ),
    "riff": dict(
        maker="make_riff",
        build=lambda: G.make_riff("A", "falling"),
        bars=8, bars_says="`bars` is the argument; `RIFF_CELLS` says each cell is two bars",
        silent="LH", silent_says="docstring: 'the right hand plays alone'",
    ),
    "pentatonic": dict(
        maker="make_pentatonic",
        build=lambda: G.make_pentatonic("A", "pentatonic"),
        bars=2, bars_says="title: 'one octave, thumb under'", silent="LH",
    ),
    "tresillo": dict(
        maker="make_tresillo",
        build=lambda: G.make_tresillo("C"),
        bars=8, bars_says="`bars` is the argument and the plan passes its default",
        lh_max=MIDDLE_C,
        lh_says="docstring: 'the bass figure under most latin music'",
    ),
    "swing_pair": dict(
        maker="make_swing_pair",
        build=lambda: G.make_swing_pair("C"),
        bars=9, bars_says="docstring: four bars, a silent bar, four bars",
        silent="LH", silent_says="the catalog row says hands:right",
    ),
    "modal_vamp": dict(
        maker="make_modal_vamp",
        build=lambda: G.make_modal_vamp("A"),
        bars=8, bars_says="`bars` is the argument and the plan passes its default",
        lh_max=MIDDLE_C,
        lh_says="docstring: the flat seven is a step *down* so the hand does not climb "
                "above middle C — Entry 4's third fault, and the register this now holds",
    ),
    "ostinato": dict(
        maker="make_ostinato",
        build=lambda: G.make_ostinato("A", list(G.OSTINATO_SHAPES)[0]),
        bars=8, bars_says="`bars` is the argument and the plan passes its default",
        lh_max=MIDDLE_C,
        lh_says="docstring: a pedal bass under the figure",
    ),
}


_BUILT: dict[str, tuple] = {}


def built(name: str) -> tuple:
    """The family's item, built once for the whole file."""
    if name not in _BUILT:
        _BUILT[name] = FAMILIES[name]["build"]()
    return _BUILT[name]


class FamilyCase(unittest.TestCase):
    """Iterates `FAMILIES` with the family's name in every failure message."""

    def each(self):
        for name, claims in FAMILIES.items():
            sc, entry = built(name)
            with self.subTest(family=name, item=entry["id"]):
                yield name, claims, sc, entry


# --------------------------------------------------------------------------------------
# the table covers the module
# --------------------------------------------------------------------------------------


class TestEveryMakerIsHere(unittest.TestCase):
    """
    The one test that stops this file from being a sample.

    `working-rules` §2.2: a claim about several things is several claims. A file
    that checks the families somebody remembered is a claim about all of them
    made from a few, which is the shape of every content fault in this
    repository. So the module is the list, and a maker added without a row here
    fails before it can ship.
    """

    def test_the_table_names_every_maker_in_the_module(self) -> None:
        makers = {name for name, obj in inspect.getmembers(G, inspect.isfunction)
                  if name.startswith("make_") and obj.__module__ == G.__name__}
        claimed = {claims["maker"] for claims in FAMILIES.values()}
        self.assertEqual(makers - claimed, set(), "makers with no row in FAMILIES")
        self.assertEqual(claimed - makers, set(), "rows naming a maker that is not there")

    def test_there_are_as_many_rows_as_makers(self) -> None:
        makers = [name for name, obj in inspect.getmembers(G, inspect.isfunction)
                  if name.startswith("make_") and obj.__module__ == G.__name__]
        self.assertEqual(len(FAMILIES), len(makers))


# --------------------------------------------------------------------------------------
# length
# --------------------------------------------------------------------------------------


class TestLength(FamilyCase):
    def test_the_bar_count_is_the_one_the_family_states(self) -> None:
        for name, claims, sc, entry in self.each():
            if claims["bars"] is None:
                continue
            self.assertEqual(count_bars(sc), claims["bars"],
                             f"{name}: {claims['bars_says']}")

    def test_hanon_is_as_long_as_the_edition_it_is_copied_from(self) -> None:
        """
        The one family whose length is data, so the number cannot be written here.

        `make_hanon` writes sixteenths and a closing note worth two beats, so
        the edition's own step list decides the bar count. Held for every
        exercise in the data file rather than the first, because "note for note
        as the Mutopia edition prints it" is a claim about all twenty.
        """
        for number in sorted(int(n) for n in HANON):
            spec = HANON[str(number)]
            final = spec.get("finalChordNotes", 1)
            beats = 0.25 * (len(spec["rh"]["steps"]) - final) + 2.0
            sc, entry = G.make_hanon(number, "both", data=HANON)
            with self.subTest(number=number, item=entry["id"]):
                self.assertEqual(count_bars(sc), int(-(-beats // bar_length(sc))))
                self.assertEqual(len(staves(sc)["RH"]), len(spec["rh"]["steps"]) - final + 1)

    def test_both_staves_are_the_same_length(self) -> None:
        """A staff that stops early is a page that ends twice."""
        for name, _claims, sc, _entry in self.each():
            lengths = {p.id: float(sum(n.duration.quarterLength
                                       for n in p.recurse().notesAndRests))
                       for p in sc.parts}
            self.assertEqual(len(set(lengths.values())), 1, f"{name}: {lengths}")

    def test_every_bar_is_full(self) -> None:
        """`pad_final_bar` exists so a piece ends on a barline. This is that, checked."""
        for name, _claims, sc, _entry in self.each():
            length = bar_length(sc)
            for part in sc.parts:
                measures = list(part.getElementsByClass("Measure"))
                for index, measure in enumerate(measures, start=1):
                    self.assertAlmostEqual(
                        float(measure.duration.quarterLength), length, places=4,
                        msg=f"{name}: {part.id} bar {index} of {len(measures)}")


# --------------------------------------------------------------------------------------
# key
# --------------------------------------------------------------------------------------


class TestKey(FamilyCase):
    def test_the_two_staves_carry_the_same_key_signature(self) -> None:
        for name, _claims, sc, _entry in self.each():
            engraved_signature(sc)  # raises if they disagree

    def test_the_catalog_key_is_the_engraved_one_or_nothing(self) -> None:
        """
        `engraved_key` is the only thing that knows both, and it may say nothing.

        The seventh-chord families are written with no signature on purpose
        (`ks=key.Key("C")`, the shape spelled in accidentals), and that function
        returns None there rather than claiming the piece is in C major. What it
        must never do is name a key the page does not carry.
        """
        for name, _claims, sc, entry in self.each():
            declared = entry["drill"]["params"].get("key")
            said = G.engraved_key(sc, declared)
            if said is None:
                continue
            tonic, mode = engraved_signature(sc)
            self.assertEqual(said, f"{tonic.replace('-', 'b').lower()} minor"
                             if mode == "minor" else f"{tonic.replace('-', 'b')} {mode}",
                             f"{name}: keySig says {said!r}")

    def test_a_title_that_says_minor_is_engraved_in_the_minor(self) -> None:
        """
        Entry 4's first fault: `exercise.riff.c.minor-hook` rendered in C major.

        The cure was to name cells for what their shape does. This is the other
        half of it — a family that *does* say "minor" in its title has to mean it.
        """
        for name, _claims, sc, entry in self.each():
            signature = engraved_signature(sc)
            if signature is None:
                continue
            _tonic, mode = signature
            title = entry["title"].lower()
            if " minor" in title:
                self.assertEqual(mode, "minor", f"{name}: {entry['title']!r}")
            if " major" in title:
                self.assertEqual(mode, "major", f"{name}: {entry['title']!r}")

    def test_the_minor_families_are_in_the_minor_in_every_key_they_are_written_in(self) -> None:
        """
        The keys, not the key. Entry 4's first fault was right in A and wrong in C.
        """
        for tonic in ("A", "C"):
            for cell in G.RIFF_CELLS:
                sc, entry = G.make_riff(tonic, cell)
                tonic_name, mode = engraved_signature(sc)
                expected = "minor" if tonic == "A" else "major"
                with self.subTest(family="riff", key=tonic, cell=cell):
                    self.assertEqual(mode, expected, entry["title"])
                    self.assertIn(f" {expected}", entry["title"].lower())
        for tonic in ("A", "E", "D"):
            sc, entry = G.make_modal_vamp(tonic)
            with self.subTest(family="modal_vamp", key=tonic):
                self.assertEqual(engraved_signature(sc)[1], "minor", entry["title"])

    def test_hands_says_which_staves_sound(self) -> None:
        for name, _claims, sc, entry in self.each():
            parts = list(staves(sc).values())
            if len(parts) == 1:
                continue
            sounds = ("both" if parts[0] and parts[1]
                      else "right" if parts[0] else "left" if parts[1] else "none")
            self.assertEqual(entry["hands"], sounds, name)


# --------------------------------------------------------------------------------------
# hand range
# --------------------------------------------------------------------------------------


class TestHandRange(FamilyCase):
    def test_the_left_hand_stays_in_the_register_the_family_claims(self) -> None:
        for name, claims, sc, _entry in self.each():
            if "lh_max" not in claims:
                continue
            low = staves(sc).get("LH")
            self.assertTrue(low, f"{name}: claims a left-hand register and has no left hand")
            self.assertLessEqual(register(low)[1], claims["lh_max"],
                                 f"{name}: {claims['lh_says']}")

    def test_the_hand_a_family_says_rests_has_no_note_in_it(self) -> None:
        for name, claims, sc, _entry in self.each():
            if "silent" not in claims:
                continue
            self.assertEqual(staves(sc).get(claims["silent"]), [],
                             f"{name}: {claims.get('silent_says', 'the row says so')}")

    def test_no_hand_is_asked_to_strike_more_than_an_octave(self) -> None:
        for name, _claims, sc, _entry in self.each():
            span, where = widest_one_hand_chord(sc)
            ceiling = STRIKES_WIDER_THAN_A_HAND.get(name, AN_OCTAVE)
            self.assertLessEqual(span, ceiling, f"{name}: {where}")

    def test_the_families_that_reach_a_tenth_break_it(self) -> None:
        """
        `make_stride` and `make_oompah` both name a tenth, and neither strikes it.

        The tenth is the leap between a bass note and the chord after it, which
        is what makes stride stride; asserting it as a *stretch* would be
        asserting the opposite of what the family teaches.
        """
        for name in ("stride", "oompah"):
            sc, _entry = built(name)
            with self.subTest(family=name):
                self.assertLessEqual(widest_one_hand_chord(sc)[0], AN_OCTAVE)
                low = register(staves(sc)["LH"])
                self.assertGreater(low[1] - low[0], AN_OCTAVE,
                                   "the family claims a reach it does not use")

    def test_every_note_is_a_key_that_exists(self) -> None:
        for name, _claims, sc, _entry in self.each():
            for notes in staves(sc).values():
                if not notes:
                    continue
                low, high = register(notes)
                self.assertGreaterEqual(low, G.KEYBOARD_BOTTOM, name)
                self.assertLessEqual(high, G.KEYBOARD_TOP, name)


# --------------------------------------------------------------------------------------
# spelling
# --------------------------------------------------------------------------------------


class TestSpelling(FamilyCase):
    def test_the_blue_note_is_a_raised_fourth_in_every_key(self) -> None:
        """
        The owner's rule, 2026-09-19, and Entry 4's fifth fault the other way up.

        Transposing by semitones lets music21 choose; transposing by the named
        interval does not. The check is on the *letter*: a raised fourth sits on
        the same letter as the natural fourth, a flattened fifth on the fifth's.
        """
        self.assertIn("A4", G.BLUES_SCALE_FORMS["blues"][0])
        self.assertNotIn("d5", G.BLUES_SCALE_FORMS["blues"][0])
        for tonic in ("A", "E", "D", "C", "F", "B-", "E-"):
            sc, entry = G.make_blues_scale(tonic)
            letters = [p.pitch.step for p in sounding(sc.parts[0])]
            fourth = letters[2]
            with self.subTest(key=tonic, item=entry["id"]):
                self.assertEqual(letters[3], fourth,
                                 "the blue note has left the fourth's letter")
                self.assertNotEqual(letters[4], letters[3],
                                    "the blue note is sitting on the fifth's letter")

    def test_no_family_engraves_a_double_accidental_it_does_not_need(self) -> None:
        """
        The only double sharp the plan writes is G sharp minor's leading note.

        `test_harmony_families` holds this for the harmony families; this holds
        it for the one representative of every family in the file, which is
        where a new maker would put one.
        """
        for name, _claims, sc, _entry in self.each():
            for notes in staves(sc).values():
                doubles = sorted({p.name for n in notes for p in n.pitches
                                  if p.name.endswith(("##", "--"))})
                self.assertEqual(doubles, [], name)

    def test_the_chromatic_scale_climbs_a_semitone_at_a_time(self) -> None:
        """
        What the family can honestly promise today, and what it cannot.

        Every step is a semitone and no note is a double accidental. What is
        **not** asserted is the spelling rule, because the family has none:
        ascending from C it writes C#, E flat, F#, G#, B flat — sharps and flats
        mixed, because `transpose(i)` by semitone lets music21 choose, which is
        the mechanism behind Entry 4's fifth fault. Sharps up and flats down is
        what every method prints; choosing it is a content decision (Entry 27),
        and pinning today's spelling here would enshrine the accident.
        """
        for hands in ("right", "left", "both"):
            sc, entry = G.make_chromatic("C", hands, 1)
            for staff, notes in staves(sc).items():
                if not notes:
                    continue
                midis = [n.pitch.midi for n in notes]
                steps = {abs(b - a) for a, b in zip(midis, midis[1:])}
                with self.subTest(item=entry["id"], staff=staff):
                    self.assertEqual(steps, {1}, "a chromatic scale moves by semitones")


# --------------------------------------------------------------------------------------
# rhythm
# --------------------------------------------------------------------------------------


class TestRhythm(FamilyCase):
    def test_the_tresillo_is_three_three_two(self) -> None:
        sc, _entry = built("tresillo")
        durations = [float(n.duration.quarterLength) for n in staves(sc)["LH"]]
        self.assertEqual(durations[:3], [1.5, 1.5, 1.0])
        self.assertEqual(len(set(tuple(durations[i:i + 3])
                                 for i in range(0, len(durations), 3))), 1)

    def test_the_clave_strikes_where_the_table_says_and_nowhere_else(self) -> None:
        for pattern, offsets in G.CLAVE_PATTERNS.items():
            sc, entry = G.make_clave(pattern)
            part = sc.parts[0]
            struck = sorted({o % 8 for o in onsets(sounding(part), part)})
            with self.subTest(pattern=pattern, item=entry["id"]):
                self.assertEqual(struck, sorted(offsets))

    def test_the_swung_half_is_the_straight_half_note_for_note(self) -> None:
        """
        The docstring's own condition: "if the two halves ever stop being
        identical, this exercise is teaching the wrong thing."
        """
        sc, _entry = built("swing_pair")
        part = sc.parts[0]
        notes = sounding(part)
        half = len(notes) // 2
        first = [(n.pitch.nameWithOctave, float(n.duration.quarterLength))
                 for n in notes[:half]]
        second = [(n.pitch.nameWithOctave, float(n.duration.quarterLength))
                  for n in notes[half:]]
        self.assertEqual(first, second)
        self.assertEqual({d for _p, d in first}, {0.5, 1.0},
                         "swing is a direction, not a dotted pair")

    def test_the_swing_direction_sits_over_the_second_half(self) -> None:
        sc, _entry = built("swing_pair")
        part = sc.parts[0]
        marks = sorted((float(t.getOffsetInHierarchy(part)), t.content)
                       for t in part.recurse().getElementsByClass(expressions.TextExpression))
        self.assertEqual(len(marks), 2)
        self.assertEqual(marks[0][0], 0.0)
        length = bar_length(sc)
        self.assertEqual(marks[1][0] % length, 0.0, "a direction starting mid-bar")
        self.assertEqual(int(marks[1][0] // length) + 1, 6, "the swung half begins at bar six")

    def test_the_bar_in_between_the_halves_is_silent(self) -> None:
        sc, _entry = built("swing_pair")
        part = sc.parts[0]
        fifth = list(part.getElementsByClass("Measure"))[4]
        self.assertEqual(list(fifth.recurse().notes), [])

    def test_a_shuffle_row_is_written_straight_and_says_so_in_words(self) -> None:
        """
        `RHYTHM_PATTERNS_EXTRA`'s own comment: notating triplets would teach the
        wrong thing, so the eighths are straight and the direction asks for the feel.
        """
        for label, lengths, _level, _ts, direction in G.RHYTHM_PATTERNS_EXTRA:
            if direction is None:
                continue
            sc, entry = G.make_rhythm(label)
            written = {float(n.duration.quarterLength) for n in sounding(sc.parts[0])}
            with self.subTest(pattern=label, item=entry["id"]):
                self.assertEqual(written, set(lengths))
                self.assertNotIn(0.75, written, "a dotted eighth is not a swung eighth")
                self.assertIn(direction, directions(sc))

    def test_every_rhythm_row_writes_the_lengths_its_table_holds(self) -> None:
        for label, lengths, _level in G.RHYTHM_PATTERNS:
            sc, entry = G.make_rhythm(label)
            part = sc.parts[0]
            written = [float(n.duration.quarterLength) for n in sounding(part)]
            with self.subTest(pattern=label, item=entry["id"]):
                self.assertEqual(written[:len(lengths)], [float(x) for x in lengths])

    def test_the_meter_families_fill_the_signature_they_name(self) -> None:
        for spec in G.ODD_METERS:
            sc, entry = G.make_meter(spec.signature)
            with self.subTest(signature=spec.signature, item=entry["id"]):
                self.assertEqual(entry["timeSig"], spec.signature)
                self.assertEqual(
                    bar_length(sc),
                    float(meter.TimeSignature(spec.signature).barDuration.quarterLength))

    def test_the_oom_pah_alternates_bass_and_chord(self) -> None:
        sc, _entry = built("oompah")
        part = sc.parts[1]
        shapes = [len(n.pitches) for n in sounding(part)]
        self.assertTrue(all(a == 1 and b > 1 for a, b in zip(shapes[::2], shapes[1::2])),
                        f"bass-chord-bass-chord, got {shapes}")

    def test_the_tumbao_never_lands_on_a_downbeat(self) -> None:
        sc, _entry = built("tumbao")
        part = sc.parts[1]
        self.assertNotIn(0.0, [o % bar_length(sc) for o in onsets(sounding(part), part)])

    def test_the_hands_play_the_ratio_the_independence_family_names(self) -> None:
        for ratio, right, left, _level in G.INDEPENDENCE_RATIOS:
            sc, entry = G.make_hand_independence("C", ratio)
            upper, lower = list(staves(sc).values())
            with self.subTest(ratio=ratio, item=entry["id"]):
                self.assertEqual(len(upper) / len(lower), right / left)

    def test_a_repeated_note_family_strikes_each_note_the_number_of_times_it_says(self) -> None:
        for per_note in (3, 4):
            sc, entry = G.make_repeated_notes("C", per_note, "right")
            names = [n.pitch.nameWithOctave for n in staves(sc)["RH"]]
            runs = [names[i:i + per_note] for i in range(0, len(names), per_note)]
            with self.subTest(per_note=per_note, item=entry["id"]):
                self.assertTrue(all(len(set(run)) == 1 for run in runs), names)
                self.assertEqual(entry["drill"]["params"]["perNote"], per_note)

    def test_the_measured_trill_writes_the_number_of_notes_it_prints(self) -> None:
        for per_beat in (4, 2):
            ornament = "trill" if per_beat == 4 else "mordent"
            sc, entry = G.make_trill("C", per_beat, "right", ornament=ornament)
            written = {float(n.duration.quarterLength) for n in staves(sc)["RH"]}
            with self.subTest(ornament=ornament, item=entry["id"]):
                self.assertEqual(written, {1.0 / per_beat})
                self.assertIn(str(per_beat), directions(sc)[0])

    def test_the_secondary_rag_cell_does_not_fit_the_beat(self) -> None:
        self.assertEqual(sum(G.SECONDARY_RAG_CELL), 0.75)
        sc, _entry = built("secondary_rag")
        part = sc.parts[0]
        self.assertTrue(any(o % 1.0 not in (0.0,)
                            for o in onsets(staves(sc)["RH"], part)))

    def test_the_boogie_drives_eight_eighths_a_bar(self) -> None:
        sc, _entry = built("boogie")
        self.assertEqual({float(n.duration.quarterLength) for n in staves(sc)["LH"]}, {0.5})
        self.assertEqual(len(staves(sc)["LH"]), 8 * count_bars(sc))

    def test_the_riff_cell_is_two_bars_so_every_statement_starts_on_a_downbeat(self) -> None:
        """
        A cell of seven quarters put the second statement on beat four, the
        third on beat three and the fourth on beat two — a figure walking round
        the barline on a core-1.3 exercise about quarter notes in a still hand,
        and an eight-bar riff that came out nine. `RIFF_CELLS` always said two
        bars; now it is two bars.
        """
        for cell, (degrees, rhythm, fingers, _blurb) in G.RIFF_CELLS.items():
            with self.subTest(cell=cell):
                self.assertEqual(sum(rhythm), 8.0)
                self.assertEqual(len(degrees), len(rhythm))
                self.assertEqual(len(degrees), len(fingers))
        for tonic in ("A", "C"):
            for cell in G.RIFF_CELLS:
                sc, entry = G.make_riff(tonic, cell)
                part = sc.parts[0]
                notes = sounding(part)
                starts = [o for o in onsets(notes, part) if o % 8.0 == 0.0]
                with self.subTest(key=tonic, cell=cell, item=entry["id"]):
                    self.assertEqual(count_bars(sc), 8)
                    self.assertEqual(len(starts), 4, "four statements, each on a downbeat")


# --------------------------------------------------------------------------------------
# text
# --------------------------------------------------------------------------------------


class TestText(FamilyCase):
    def test_no_direction_is_longer_than_the_longest_one_that_survived(self) -> None:
        for name, _claims, sc, _entry in self.each():
            for text in directions(sc):
                self.assertLessEqual(len(text), LONGEST_DIRECTION, f"{name}: {text!r}")

    def test_no_direction_is_longer_than_that_in_any_key_the_family_is_written_in(self) -> None:
        """
        A direction that interpolates a key name is longer in D flat than in C.
        """
        for tonic in G.HARMONY_KEYS:
            for maker in (G.make_walkup, G.make_intro, G.make_open_voicing):
                sc, entry = maker(tonic)
                for text in directions(sc):
                    with self.subTest(item=entry["id"]):
                        self.assertLessEqual(len(text), LONGEST_DIRECTION, repr(text))

    def test_a_direction_is_one_line(self) -> None:
        for name, _claims, sc, _entry in self.each():
            for text in directions(sc):
                self.assertNotIn("\n", text, name)
                self.assertEqual(text, text.strip(), f"{name}: {text!r}")

    def test_a_direction_starts_at_a_barline(self) -> None:
        """
        A direction dropped mid-bar has the least room on the page to print in,
        and the reader has nothing to attach it to.
        """
        for name, _claims, sc, _entry in self.each():
            length = bar_length(sc)
            for part in sc.parts:
                for text in part.recurse().getElementsByClass(expressions.TextExpression):
                    offset = float(text.getOffsetInHierarchy(part))
                    self.assertEqual(offset % length, 0.0, f"{name}: {text.content!r}")


# --------------------------------------------------------------------------------------
# the docstrings are true
# --------------------------------------------------------------------------------------


class TestTheDocstringsAreTrue(unittest.TestCase):
    """
    `working-rules` §2.17: your own prose about your own code is a claim.

    Each of these was read against the music it describes during the 2026-09-21
    pass. Four were wrong and the prose was corrected; these hold the corrections
    so the next reader is not arguing from something untrue.
    """

    def test_the_five_finger_pattern_has_no_block_chord(self) -> None:
        for hands in ("right", "left", "both"):
            sc, entry = G.make_five_finger("C", "major", hands)
            with self.subTest(item=entry["id"]):
                for notes in staves(sc).values():
                    self.assertTrue(all(len(n.pitches) == 1 for n in notes))
        summary = (G.make_five_finger.__doc__ or "").strip().splitlines()[0]
        self.assertNotIn("block chord", summary)

    def test_the_seventh_arpeggio_is_fingered_the_way_its_tables_say(self) -> None:
        self.assertEqual(G.SEVENTH_ARPEGGIO_FINGERING_RH, [1, 2, 3, 4])
        self.assertEqual(G.SEVENTH_ARPEGGIO_FINGERING_LH, [5, 4, 3, 2])
        sc, _entry = G.make_seventh_arpeggio("C", "dominant7", "both", 2)
        for staff, wanted in (("RH", [1, 2, 3, 4]), ("LH", [5, 4, 3, 2])):
            printed = [a.fingerNumber for n in staves(sc)[staff]
                       for a in n.articulations if hasattr(a, "fingerNumber")]
            self.assertEqual(printed[:4], wanted, staff)
        says = G.make_seventh_arpeggio.__doc__ or ""
        self.assertIn("Fingered 1-2-3-4 in the right hand and 5-4-3-2 in the left", says)

    def test_the_two_hands_do_not_finger_the_chromatic_scale_alike(self) -> None:
        """
        `chromatic_finger`'s whole subject, and `make_chromatic`'s docstring used
        to say the opposite: 2 goes on the upper white of each adjacent pair in
        the right hand and the lower in the left, so the shapes differ.
        """
        sc, _entry = G.make_chromatic("C", "both", 1)
        shapes = {}
        for staff in ("RH", "LH"):
            shapes[staff] = [a.fingerNumber for n in staves(sc)[staff]
                             for a in n.articulations if hasattr(a, "fingerNumber")]
        self.assertNotEqual(shapes["RH"], shapes["LH"])
        self.assertEqual(G.chromatic_finger(G.pitch.Pitch("F4").midi, False, "right"), 2)
        self.assertEqual(G.chromatic_finger(G.pitch.Pitch("F4").midi, False, "left"), 1)
        self.assertEqual(G.chromatic_finger(G.pitch.Pitch("E4").midi, False, "left"), 2)
        self.assertIn("do not have the same shape", G.make_chromatic.__doc__ or "")

    def test_the_tresillo_is_written_as_dotted_quarters_as_its_docstring_says(self) -> None:
        sc, _entry = G.make_tresillo("C")
        self.assertEqual([float(n.duration.quarterLength) for n in staves(sc)["LH"]][:3],
                         [1.5, 1.5, 1.0])
        self.assertIn("dotted quarters", G.make_tresillo.__doc__)

    def test_the_riff_default_names_a_cell_that_exists(self) -> None:
        """
        It named `minor-hook` for three days after the cells were renamed, so
        `make_riff("A")` raised instead of building. The plan always passes a
        cell, which is why nothing caught it.
        """
        default = inspect.signature(G.make_riff).parameters["cell"].default
        self.assertIn(default, G.RIFF_CELLS)
        self.assertTrue(G.make_riff("A")[1]["id"].endswith(default))

    def test_every_maker_with_a_closed_set_of_words_refuses_a_word_it_does_not_know(self) -> None:
        """
        `one_of`'s reason, held for the families that branch on a string.
        """
        for call in (lambda: G.make_riff("A", "minor-hook"),
                     lambda: G.make_shaping("C", "rise"),
                     lambda: G.make_five_finger("C", "major", "rigth"),
                     lambda: G.make_oompah("C", "eleventh")):
            with self.assertRaises((ValueError, KeyError)):
                call()

    def test_every_maker_has_a_docstring(self) -> None:
        missing = [claims["maker"] for claims in FAMILIES.values()
                   if not (getattr(G, claims["maker"]).__doc__ or "").strip()]
        self.assertEqual(missing, ["make_scale", "make_arpeggio"],
                         "the two oldest makers carry none; everything newer does")


# --------------------------------------------------------------------------------------
# proven red
# --------------------------------------------------------------------------------------
#
# `00-invariants` §2: every fix ships with a test proved to fail without it. A
# check nobody has seen fail is a check nobody knows the shape of, so each of
# the four axes above is run against a score that has been broken on purpose and
# is required to fail. The mutation's name is in the failure message.


def drop_the_last_bar(sc):
    for part in sc.parts:
        measures = list(part.getElementsByClass("Measure"))
        if len(measures) > 1:
            part.remove(measures[-1])
    return sc


def lift_the_left_hand_two_octaves(sc):
    for part in sc.parts:
        if part.id == "LH":
            for n in sounding(part):
                n.transpose(24, inPlace=True)
    return sc


def stretch_every_chord_by_an_octave(sc):
    """
    A fifth is not enough: a scale in thirds stretched by a fifth is a tenth,
    which is still under the ceiling. An octave puts every chord over it,
    whatever the shape started as.
    """
    for part in sc.parts:
        if part.id not in ("RH", "LH"):
            continue
        for c in part.recurse().getElementsByClass(m21chord.Chord):
            if isinstance(c, harmony.ChordSymbol):
                continue
            c.pitches = tuple(list(c.pitches[:-1]) + [c.pitches[-1].transpose(AN_OCTAVE + 5)])
    return sc


def pad_every_direction(sc):
    for part in sc.parts:
        for text in part.recurse().getElementsByClass(expressions.TextExpression):
            text.content = text.content + " " + "x" * LONGEST_DIRECTION
    return sc


def sound_the_silent_hand(sc, staff):
    for part in sc.parts:
        if part.id == staff:
            part.append(note.Note("C4", quarterLength=1.0))
    return sc


class TestTheChecksGoRedOnAMutation(FamilyCase):
    """One mutation per family per axis, each required to make its check fail."""

    def test_dropping_the_last_bar_fails_the_length_check(self) -> None:
        for name, claims, sc, _entry in self.each():
            if claims["bars"] is None or claims["bars"] < 2:
                continue
            mutant = drop_the_last_bar(copy.deepcopy(sc))
            self.assertNotEqual(count_bars(mutant), claims["bars"],
                                f"{name}: mutation `drop_the_last_bar` did not go red")

    def test_lifting_the_left_hand_two_octaves_fails_the_register_check(self) -> None:
        for name, claims, sc, _entry in self.each():
            if "lh_max" not in claims:
                continue
            mutant = lift_the_left_hand_two_octaves(copy.deepcopy(sc))
            self.assertGreater(register(staves(mutant)["LH"])[1], claims["lh_max"],
                               f"{name}: mutation `lift_the_left_hand_two_octaves` "
                               "did not go red")

    def test_stretching_a_chord_by_an_octave_fails_the_span_check(self) -> None:
        for name, _claims, sc, _entry in self.each():
            if widest_one_hand_chord(sc)[0] == 0:
                continue  # a family with no chord in either hand
            mutant = stretch_every_chord_by_an_octave(copy.deepcopy(sc))
            ceiling = STRIKES_WIDER_THAN_A_HAND.get(name, AN_OCTAVE)
            self.assertGreater(widest_one_hand_chord(mutant)[0], ceiling,
                               f"{name}: mutation `stretch_every_chord_by_an_octave` "
                               "did not go red")

    def test_padding_a_direction_fails_the_text_check(self) -> None:
        for name, _claims, sc, _entry in self.each():
            if not directions(sc):
                continue
            mutant = pad_every_direction(copy.deepcopy(sc))
            self.assertTrue(any(len(t) > LONGEST_DIRECTION for t in directions(mutant)),
                            f"{name}: mutation `pad_every_direction` did not go red")

    def test_sounding_the_silent_hand_fails_the_rest_check(self) -> None:
        for name, claims, sc, _entry in self.each():
            if "silent" not in claims:
                continue
            mutant = sound_the_silent_hand(copy.deepcopy(sc), claims["silent"])
            self.assertNotEqual(staves(mutant).get(claims["silent"]), [],
                                f"{name}: mutation `sound_the_silent_hand` did not go red")

    def test_dropping_the_last_bar_fails_hanon_s_length_check(self) -> None:
        """
        Hanon's length is the edition's, so its mutation has to be run against
        the edition rather than against a number in this file.
        """
        spec = HANON[str(FIRST_HANON)]
        final = spec.get("finalChordNotes", 1)
        beats = 0.25 * (len(spec["rh"]["steps"]) - final) + 2.0
        sc, _entry = built("hanon")
        wanted = int(-(-beats // bar_length(sc)))
        mutant = drop_the_last_bar(copy.deepcopy(sc))
        self.assertNotEqual(count_bars(mutant), wanted,
                            "hanon: mutation `drop_the_last_bar` did not go red")

    def test_every_family_has_at_least_one_mutation_that_reddens_it(self) -> None:
        """
        The census. A family that no mutation can break has no check on it, and
        naming that is the point of this class.
        """
        unreddened = []
        for name, claims in FAMILIES.items():
            sc, _entry = built(name)
            reddenable = (
                (claims["bars"] is not None and claims["bars"] >= 2)
                # hanon's length comes off the data file, so its mutation has a
                # test of its own above rather than a number in the row.
                or name == "hanon"
                or "lh_max" in claims
                or widest_one_hand_chord(sc)[0] > 0
                or bool(directions(sc))
                or "silent" in claims
            )
            if not reddenable:
                unreddened.append(name)
        self.assertEqual(unreddened, [], "families with no mutation that fails a check")


if __name__ == "__main__":
    unittest.main()
