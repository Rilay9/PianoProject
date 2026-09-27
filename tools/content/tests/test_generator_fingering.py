"""
Fingerings on melodic lines — the ones `confirm_fingering` cannot see.

`finalize` checks every *chord* for a finger on two notes or a crossed hand.
A scale, an arpeggio, a bass line and a chromatic run are melodies, and a
wrong finger on a melody ships silently: the file is valid, the notes are
right, and the learner practises a hand that crosses itself. These are the
faults the 2026-09-14 review found by reading the tables — sixty arpeggios
with the thumb on a black key, sixteen walking basses with the thumb on the
lowest note of the bar, twelve chromatic runs whose left hand was a right
hand — each held here to the rule it broke.

And the one the 2026-09-26 pass found (T53, G41): every two-octave left hand
on a white root went 5-3-2-**5**-3-2-1, finger 5 straight after 2 at the
octave join, and every right hand on a black root put finger 2 on two notes a
fourth apart, because one construction gave every root the first root's
finger. The old assertions here encoded both, so they passed. The truth is
now a published chart, read key by key (`KELLEY_CHART`); the rules below it
— no finger on two different notes in a row, a hand crossing only at the
thumb, finger 5 only where the line starts, turns or stops, the thumb on a
black key only where the chord has no white one, the notes spelled for the
key — are guards against a future table, never a substitute for the chart.
The authored *Ode to Joy (full theme)* is held to the same hand at its bar 12.
"""
from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from music21 import articulations, converter, interval, key, note, pitch  # noqa: E402

import generate_exercises as G  # noqa: E402
from abc_tools import apply_fingerings, extract_fingerings, prepare_abc  # noqa: E402
from generate_exercises import (  # noqa: E402
    BLACK_PITCH_CLASSES,
    MAJOR_KEYS,
    MINOR_KEYS,
    chromatic_finger,
    default_plan,
    is_black_root,
    make_arpeggio,
    make_broken_seventh,
    make_chromatic,
    make_seventh_arpeggio,
    make_tumbao,
    make_walking_bass,
    walking_bass_fingers,
)

REPO = Path(__file__).resolve().parents[3]


def fingered_notes(sc, part_id: str) -> list[tuple[pitch.Pitch, int | None]]:
    """(pitch, finger) for every note of one staff, in order."""
    part = next(p for p in sc.parts if p.id == part_id)
    out = []
    for element in part.recurse().notes:
        if not isinstance(element, note.Note):
            continue
        fingers = [a.fingerNumber for a in element.articulations if isinstance(a, articulations.Fingering)]
        out.append((element.pitch, fingers[0] if fingers else None))
    return out


# --------------------------------------------------------------------------------------
# the arpeggios' source: one chart, as its page prints it
# --------------------------------------------------------------------------------------

#: Robert Kelley, "Arpeggio Fingering Chart for Piano, Organ, or Electric
#: Keyboard", read 2026-09-26 at
#: https://robertkelleyphd.com/home/teaching/keyboard/keyboard-arpeggio-fingering-chart/
#:
#: Transcribed the way the page groups it — a pattern, then the keys under it —
#: and kept apart from the generator's own table on purpose: a slip in either
#: transcription is a disagreement here. Each pattern is four fingers going up,
#: root, third, fifth and the root an octave higher, and the page's rules say
#: how to read it over more octaves: "The arpeggio fingering pattern repeats
#: every three notes, so that every octave has the same fingering", and "The
#: fifth finger is only used at a starting place, a stopping place, or a
#: turning-around place."
KELLEY_CHART = {
    "RH 1231": "C Major, D Major, E Major, F Major, G Major, A Major, B Major, F♯/G♭ Major, "
               "A minor, B minor, C minor, D minor, E minor, F minor, G minor, D♯/E♭ minor",
    "RH 2124": "C♯/D♭ major, E♭ major, A♭ major, B♭ major, C♯ minor, F♯ minor, G♯/A♭ minor",
    "RH 2312": "B♭/A♯ minor",
    "LH 1421": "C major, F major, G major, A minor, B minor, C minor, D minor, E minor, F minor, "
               "G minor, D♯/E♭ minor",
    "LH 1321": "D major, E major, A major, B major, F♯/G♭ major",
    "LH 2142": "C♯/D♭ major, E♭ major, A♭ major, C♯ minor, F♯ minor, G♯/A♭ minor",
    "LH 3213": "B♭ major, B♭/A♯ minor",
}

#: "The thumb always stays on the white keys, except when there are no white
#: keys (F♯/G♭ major and D♯/E♭ minor)" — the page's second rule, in the
#: generator's spelling.
NO_WHITE_KEY = {("G-", "major"), ("E-", "minor")}


def chart_by_key() -> dict[tuple[str, str], dict[str, str]]:
    """`{(root, quality): {"RH": pattern, "LH": pattern}}` in music21 spelling."""
    out: dict[tuple[str, str], dict[str, str]] = {}
    for heading, keys in KELLEY_CHART.items():
        hand, pattern = heading.split()
        for name in keys.split(", "):
            names, quality = name.rsplit(" ", 1)
            quality = quality.lower()
            wanted = MAJOR_KEYS if quality == "major" else MINOR_KEYS
            spelled = [n.replace("♯", "#").replace("♭", "-") for n in names.split("/")]
            root = next(n for n in spelled if n in wanted)
            slot = out.setdefault((root, quality), {})
            assert hand not in slot, f"{name} is under two {hand} patterns"
            slot[hand] = pattern
    return out


def read_the_chart(pattern: str, hand: str, octaves: int) -> list[int]:
    """
    The ascent a pattern gives over `octaves`, read by the page's rules.

    Every root after the first takes the last digit ("every octave has the
    same fingering"), and the thumb is replaced by the fifth finger at the
    left hand's starting place and the right hand's turning-around place.
    """
    digits = [int(d) for d in pattern]
    ascent = digits[:1] + digits[1:] * octaves
    if hand == "LH" and ascent[0] == 1:
        ascent[0] = 5
    if hand == "RH" and ascent[-1] == 1:
        ascent[-1] = 5
    return ascent


def ascent(notes: list[tuple[pitch.Pitch, int | None]]) -> list[tuple[pitch.Pitch, int | None]]:
    """The notes from the first to the highest, inclusive."""
    top = max(range(len(notes)), key=lambda i: notes[i][0].ps)
    return notes[: top + 1]


# --------------------------------------------------------------------------------------
# the guards: what no fingering of these shapes may do, whatever the chart says
# --------------------------------------------------------------------------------------


def crossing_faults(notes: list[tuple[pitch.Pitch, int | None]], hand: str) -> list[str]:
    """
    Two neighbouring notes a hand cannot take as printed.

    One finger on two different notes in a row; and a hand crossing itself
    anywhere but at the thumb. Fingers lie across the hand in order, so going
    up the right hand's numbers rise and the left hand's fall; the only way
    against that order is the thumb passing under, or 2, 3 or 4 crossing over
    the thumb. Finger 5 never crosses. This is `fingerscan.py`'s two rules
    from Entry 82 (the same finger; the left hand's finger rising on a rising
    line) made one rule for both hands and both directions.
    """
    faults = []
    for (p1, f1), (p2, f2) in zip(notes, notes[1:]):
        if f1 is None or f2 is None or p1.ps == p2.ps:
            continue
        where = f"{p1.nameWithOctave}({f1}) {p2.nameWithOctave}({f2})"
        if f1 == f2:
            faults.append(f"{hand} {where}: one finger on two different notes")
            continue
        rising = p2.ps > p1.ps
        with_the_hand = (f2 > f1) if (hand == "RH") == rising else (f2 < f1)
        if with_the_hand:
            continue
        thumb_under = f2 == 1
        over_the_thumb = f1 == 1 and f2 in (2, 3, 4)
        if not (thumb_under or over_the_thumb):
            faults.append(f"{hand} {where}: the hand crosses itself away from the thumb")
    return faults


def fifth_finger_faults(notes: list[tuple[pitch.Pitch, int | None]], hand: str) -> list[str]:
    """
    Finger 5 anywhere but where the line starts, turns or stops.

    The chart's third rule. On an up-and-back arpeggio those places are its
    lowest and highest notes, so this is the brief's "finger 5 mid-ascent in
    the left hand's rising pattern", and its mirror in the right hand, as one
    rule.
    """
    sounding = [p.ps for p, _ in notes]
    low, high = min(sounding), max(sounding)
    return [f"{hand} {p.nameWithOctave}(5): finger 5 in the middle of the run"
            for p, f in notes if f == 5 and p.ps not in (low, high)]


def thumb_on_black_faults(notes, root: str, quality: str, hand: str) -> list[str]:
    """The thumb on a black key, unless the chord has no white key at all."""
    if (root, quality) in NO_WHITE_KEY:
        return []
    return [f"{hand} {p.nameWithOctave}(1): thumb on a black key"
            for p, f in notes if f == 1 and p.pitchClass in BLACK_PITCH_CLASSES]


#: The seventh shapes as intervals, the test's own copy: a seventh chord is
#: spelled in stacked thirds from its root, whatever its semitones.
SEVENTH_INTERVALS = {
    "dominant7": ("P1", "M3", "P5", "m7"),
    "diminished7": ("P1", "m3", "d5", "d7"),
    "major7": ("P1", "M3", "P5", "M7"),
    "minor7": ("P1", "m3", "P5", "m7"),
    "half-diminished7": ("P1", "m3", "d5", "m7"),
}

#: White keys wearing an accidental. The generator prints the enharmonic
#: instead (`_readable`), as it does for a double accidental.
NOBODY_WRITES = {"C-", "F-", "B#", "E#"}


def spelling_faults(sc, entry: dict) -> list[str]:
    """
    Notes spelled for some other key.

    A triad arpeggio prints only its key's first, third and fifth degrees; a
    seventh arpeggio prints its four notes as stacked thirds from the root,
    except that a note whose stacked-thirds spelling needs a double
    accidental, or is one nobody writes, may be printed as its enharmonic.
    """
    params = entry["drill"]["params"]
    root = params["key"]
    quality = params["quality"]
    faults = []
    for part_id in ("RH", "LH"):
        for p, _ in fingered_notes(sc, part_id):
            if entry["id"].startswith("exercise.arpeggio7."):
                proper = [pitch.Pitch(root).transpose(interval.Interval(name))
                          for name in SEVENTH_INTERVALS[quality]]
                ok = False
                for want in proper:
                    if p.name == want.name:
                        ok = True
                    elif (abs(want.alter) > 1 or want.name in NOBODY_WRITES) and \
                            p.pitchClass == want.pitchClass and abs(p.alter) <= 1 and \
                            p.name not in NOBODY_WRITES:
                        ok = True
            else:
                k = key.Key(root if quality == "major" else root.lower())
                ok = p.name in {k.pitchFromDegree(d).name for d in (1, 3, 5)}
            if not ok:
                faults.append(f"{part_id} {p.nameWithOctave} is not spelled for {root} {quality}")
    return faults


def guard_faults(sc, entry: dict) -> list[str]:
    """Every guard, over both hands of one item."""
    params = entry["drill"]["params"]
    faults = []
    for part_id in ("RH", "LH"):
        notes = fingered_notes(sc, part_id)
        if not notes:
            continue
        faults += crossing_faults(notes, part_id)
        faults += fifth_finger_faults(notes, part_id)
        faults += thumb_on_black_faults(notes, params["key"], params["quality"], part_id)
    return faults


def chart_faults(sc, entry: dict, chart: dict) -> list[str]:
    """Where one triad arpeggio's printed ascent differs from the chart's."""
    params = entry["drill"]["params"]
    patterns = chart[(params["key"], params["quality"])]
    faults = []
    for part_id in ("RH", "LH"):
        notes = fingered_notes(sc, part_id)
        if not notes:
            continue
        printed = [f for _, f in ascent(notes)]
        wanted = read_the_chart(patterns[part_id], part_id, params["octaves"])
        if printed != wanted:
            faults.append(f"{part_id} prints {printed}, the chart {patterns[part_id]} reads {wanted}")
    return faults


_PLAN: list[tuple[object, dict]] | None = None


def plan_arpeggios() -> list[tuple[object, dict]]:
    """Every arpeggio item the shipping plan builds, triads and sevenths."""
    global _PLAN
    if _PLAN is None:
        _PLAN = [(sc, entry) for sc, entry in default_plan(quick=False)
                 if entry["id"].startswith(("exercise.arpeggio.", "exercise.arpeggio7."))]
    return _PLAN


class TestArpeggioFingering(unittest.TestCase):
    def test_a_white_root_starts_on_the_thumb_and_tops_with_the_fifth(self) -> None:
        sc, _ = make_arpeggio("C", "major", "both", 2)
        rh = [f for _, f in fingered_notes(sc, "RH")]
        self.assertEqual(rh[:7], [1, 2, 3, 1, 2, 3, 5])
        lh = [f for _, f in fingered_notes(sc, "LH")]
        # 5-4-2-1, then 4 over the thumb: the lesson's fingering and the chart's
        # LH 1421. It read [5, 3, 2, 5, 3, 2, 1] — the fault, asserted.
        self.assertEqual(lh[:7], [5, 4, 2, 1, 4, 2, 1])

    def test_a_black_root_never_takes_the_thumb(self) -> None:
        # G flat major was in this list, and the chart says otherwise: a chord
        # with no white key puts the thumb on a black one (see the next test).
        for root, quality in (("A-", "major"), ("E-", "major"), ("B-", "minor"), ("F#", "minor"),
                              ("B-", "major"), ("D-", "major"), ("C#", "minor"), ("G#", "minor")):
            sc, entry = make_arpeggio(root, quality, "both", 2)
            for part_id in ("RH", "LH"):
                notes = fingered_notes(sc, part_id)
                self.assertNotEqual(notes[0][1], 1, f"{root} {quality} {part_id} starts on the thumb")
                for p, finger in notes:
                    if p.pitchClass == pitch.Pitch(root).pitchClass:
                        self.assertNotEqual(finger, 1, f"{root} {quality} {part_id}: thumb on the root {p.nameWithOctave}")
            self.assertTrue(entry["drill"]["params"]["fingeringVerified"])

    def test_a_chord_with_no_white_key_is_fingered_as_if_it_were_white(self) -> None:
        for root, quality, lh in (("G-", "major", [5, 3, 2, 1, 3, 2, 1]), ("E-", "minor", [5, 4, 2, 1, 4, 2, 1])):
            sc, _ = make_arpeggio(root, quality, "both", 2)
            self.assertEqual([f for _, f in fingered_notes(sc, "RH")][:7], [1, 2, 3, 1, 2, 3, 5], root)
            self.assertEqual([f for _, f in fingered_notes(sc, "LH")][:7], lh, root)

    def test_the_black_root_shape_takes_every_later_root_with_the_fourth(self) -> None:
        # A flat major: 2-1-2-4, then 1-2-4 — the chart's RH 2124 and LH 2142.
        # It read [2, 1, 2, 2, 1, 2, 4]: finger 2 on E flat and again on the A
        # flat a fourth above it.
        sc, _ = make_arpeggio("A-", "major", "both", 2)
        self.assertEqual([f for _, f in fingered_notes(sc, "RH")][:7], [2, 1, 2, 4, 1, 2, 4])
        self.assertEqual([f for _, f in fingered_notes(sc, "LH")][:7], [2, 1, 4, 2, 1, 4, 2])

    def test_a_flat_major_is_spelled_with_flats(self) -> None:
        sc, _ = make_arpeggio("A-", "major", "both", 2)
        for part_id in ("RH", "LH"):
            names = {p.name for p, _ in fingered_notes(sc, part_id)}
            self.assertEqual(names, {"A-", "C", "E-"}, part_id)

    def test_no_arpeggio_in_the_plan_puts_the_thumb_on_a_black_root(self) -> None:
        for sc, entry in plan_arpeggios():
            if not entry["id"].startswith("exercise.arpeggio."):
                continue
            root = entry["drill"]["params"]["key"]
            if not is_black_root(root) or (root, entry["drill"]["params"]["quality"]) in NO_WHITE_KEY:
                continue
            for part_id in ("RH", "LH"):
                for p, finger in fingered_notes(sc, part_id):
                    if p.pitchClass == pitch.Pitch(root).pitchClass:
                        self.assertNotEqual(finger, 1, f"{entry['id']} {part_id}: thumb on {p.nameWithOctave}")


class TestArpeggiosAgainstTheChart(unittest.TestCase):
    """The source: every triad arpeggio the plan ships, both hands, as the chart reads."""

    def test_the_chart_names_every_key_the_plan_arpeggiates_once_per_hand(self) -> None:
        chart = chart_by_key()
        wanted = {(k, "major") for k in MAJOR_KEYS} | {(k, "minor") for k in MINOR_KEYS}
        self.assertEqual(set(chart), wanted)
        for slot, hands in chart.items():
            self.assertEqual(set(hands), {"RH", "LH"}, slot)

    def test_the_c_major_left_hand_is_the_one_the_lesson_teaches(self) -> None:
        for hands in ("left", "both"):
            sc, _ = make_arpeggio("C", "major", hands, 2)
            self.assertEqual([f for _, f in ascent(fingered_notes(sc, "LH"))], [5, 4, 2, 1, 4, 2, 1], hands)

    def test_every_triad_arpeggio_in_the_plan_is_fingered_as_the_chart_reads(self) -> None:
        chart = chart_by_key()
        checked, faults = 0, []
        for sc, entry in plan_arpeggios():
            if not entry["id"].startswith("exercise.arpeggio."):
                continue
            checked += 1
            self.assertTrue(entry["drill"]["params"]["fingeringVerified"], entry["id"])
            faults += [f"{entry['id']}: {fault}" for fault in chart_faults(sc, entry, chart)]
        # 24 keys at two and four octaves, and the twelve hands-separate items.
        self.assertEqual(checked, 60)
        self.assertEqual(faults, [], "\n".join(faults))


class TestArpeggioGuards(unittest.TestCase):
    """The mechanical adversaries, over every arpeggio item the plan ships."""

    def test_no_arpeggio_in_the_plan_asks_for_a_hand_that_is_not_there(self) -> None:
        checked, faults = 0, []
        for sc, entry in plan_arpeggios():
            checked += 1
            faults += [f"{entry['id']}: {fault}" for fault in guard_faults(sc, entry)]
        self.assertEqual(checked, 120)
        self.assertEqual(faults, [], "\n".join(faults[:40]) + f"\n… {len(faults)} in all")

    def test_every_arpeggio_in_the_plan_is_spelled_for_its_key(self) -> None:
        faults = []
        for sc, entry in plan_arpeggios():
            faults += [f"{entry['id']}: {fault}" for fault in spelling_faults(sc, entry)]
        self.assertEqual(faults, [], "\n".join(faults[:40]) + f"\n… {len(faults)} in all")

    def test_a_shape_printed_without_fingering_says_so(self) -> None:
        for sc, entry in plan_arpeggios():
            printed = any(f is not None for part_id in ("RH", "LH") for _, f in fingered_notes(sc, part_id))
            self.assertEqual(entry["drill"]["params"]["fingeringVerified"], printed, entry["id"])


class TestTheFingeringChecksGoRedOnAMutation(unittest.TestCase):
    """
    The census for the checks above: each one fails on a generator broken the
    way this one was, and passes on the real one. A check nobody has seen fail
    is a check nobody knows the shape of (`00-invariants` §2).
    """

    def test_the_old_construction_fails_the_guards_and_the_chart(self) -> None:
        def every_root_takes_the_first_finger(first, join, top, octaves):
            # `table[:3] * octaves + [table[3]]`, the line that shipped.
            return first * octaves + [top]

        chart = chart_by_key()
        for root, quality, hands in (("C", "major", "left"), ("A-", "major", "right"),
                                     ("E", "minor", "both")):
            real, entry = make_arpeggio(root, quality, hands, 2)
            self.assertEqual(guard_faults(real, entry) + chart_faults(real, entry, chart), [])
            with mock.patch.object(G, "arpeggio_ascent", every_root_takes_the_first_finger):
                mutant, entry = make_arpeggio(root, quality, hands, 2)
            self.assertNotEqual(guard_faults(mutant, entry), [],
                                f"{entry['id']}: mutation `every_root_takes_the_first_finger` did not go red")
            self.assertNotEqual(chart_faults(mutant, entry, chart), [], entry["id"])
        real, entry = make_seventh_arpeggio("C", "dominant7", "both", 2)
        self.assertEqual(guard_faults(real, entry), [])
        with mock.patch.object(G, "arpeggio_ascent", every_root_takes_the_first_finger):
            mutant, entry = make_seventh_arpeggio("C", "dominant7", "both", 2)
        self.assertNotEqual(guard_faults(mutant, entry), [],
                            "the seventh: mutation `every_root_takes_the_first_finger` did not go red")

    def test_a_right_hand_table_on_the_left_fails_the_guards(self) -> None:
        with mock.patch.dict(G.ARPEGGIO_CHART, {("C", "major"): ("1231", "1231")}):
            mutant, entry = make_arpeggio("C", "major", "left", 2)
        self.assertNotEqual(guard_faults(mutant, entry), [],
                            "mutation `a_right_hand_table_on_the_left` did not go red")

    def test_a_playable_table_the_chart_does_not_give_fails_only_the_chart(self) -> None:
        # 5-3-2-1 is a fingering hands use for C (the lesson says so), so no
        # guard can object to it; only the source can. Which is why the guards
        # are guards and the chart is the truth.
        with mock.patch.dict(G.ARPEGGIO_CHART, {("C", "major"): ("1231", "1321")}):
            mutant, entry = make_arpeggio("C", "major", "left", 2)
        self.assertEqual(guard_faults(mutant, entry), [])
        self.assertNotEqual(chart_faults(mutant, entry, chart_by_key()), [],
                            "mutation `a_playable_table_the_chart_does_not_give` did not go red")

    def test_a_black_key_thumb_fails_the_guard(self) -> None:
        with mock.patch.dict(G.ARPEGGIO_CHART, {("B-", "minor"): ("2124", "2142")}):
            mutant, entry = make_arpeggio("B-", "minor", "both", 2)
        self.assertTrue(any("thumb on a black key" in f for f in guard_faults(mutant, entry)),
                        "mutation `the_major_table_on_b_flat_minor` did not go red")

    def test_spelling_by_semitones_fails_the_spelling_check(self) -> None:
        def by_semitones(p, semitones):
            return p.transpose(semitones)

        real, entry = make_arpeggio("A-", "major", "both", 2)
        self.assertEqual(spelling_faults(real, entry), [])
        with mock.patch.object(G, "up", by_semitones):
            mutant, entry = make_arpeggio("A-", "major", "both", 2)
        self.assertNotEqual(spelling_faults(mutant, entry), [],
                            "mutation `by_semitones` did not go red")


class TestSeventhArpeggioFingering(unittest.TestCase):
    def test_a_white_root_is_one_finger_a_note_with_the_thumb_under_after_the_fourth(self) -> None:
        sc, entry = make_seventh_arpeggio("C", "dominant7", "both", 2)
        self.assertEqual([f for _, f in fingered_notes(sc, "RH")][:9], [1, 2, 3, 4, 1, 2, 3, 4, 5])
        # The thumb takes the second C, as in the triads and the scales: it read
        # [5, 4, 3, 2, 5, 4, 3, 2, 1], finger 5 again straight after 2.
        self.assertEqual([f for _, f in fingered_notes(sc, "LH")][:9], [5, 4, 3, 2, 1, 4, 3, 2, 1])
        self.assertTrue(entry["drill"]["params"]["fingeringVerified"])

    def test_a_black_root_prints_no_fingering_and_says_so(self) -> None:
        sc, entry = make_seventh_arpeggio("E-", "dominant7", "both", 2)
        self.assertTrue(all(f is None for _, f in fingered_notes(sc, "RH")))
        self.assertTrue(all(f is None for _, f in fingered_notes(sc, "LH")))
        self.assertFalse(entry["drill"]["params"]["fingeringVerified"])

    def test_a_broken_seventh_on_a_black_root_prints_no_fingering(self) -> None:
        sc, _ = make_broken_seventh("D-", "dominant7", "both")
        self.assertTrue(all(f is None for _, f in fingered_notes(sc, "RH")))
        sc, _ = make_broken_seventh("C", "dominant7", "both")
        self.assertEqual([f for _, f in fingered_notes(sc, "RH")][:8], [1, 2, 3, 4, 5, 4, 3, 2])


class TestWalkingBassFingering(unittest.TestCase):
    def test_root_third_fifth_sit_under_five_three_one(self) -> None:
        sc, _ = make_walking_bass("C", "blues", "intro")
        lh = fingered_notes(sc, "LH")
        for bar in range(12):
            self.assertEqual([f for _, f in lh[bar * 4 : bar * 4 + 3]], [5, 3, 1], f"bar {bar + 1}")

    def test_the_approach_note_is_fingered_by_where_it_lands(self) -> None:
        sc, _ = make_walking_bass("C", "blues", "intro")
        lh = fingered_notes(sc, "LH")
        # Bar 1: C E G then B below the C — the hand drops, the little finger takes it.
        self.assertEqual(lh[3][0].nameWithOctave, "B1")
        self.assertEqual(lh[3][1], 5)
        # Bar 8 -> 9: C E G then F sharp, between the third and the fifth.
        self.assertEqual(lh[7 * 4 + 3][0].name, "F#")
        self.assertEqual(lh[7 * 4 + 3][1], 2)

    def test_the_thumb_is_never_below_the_second_finger_within_a_bar(self) -> None:
        for tonic in ("C", "F", "B-", "E-"):
            for form in ("blues", "ii-V-I"):
                sc, entry = make_walking_bass(tonic, form)
                lh = fingered_notes(sc, "LH")
                for start in range(0, len(lh), 4):
                    bar = lh[start : start + 4]
                    if len(bar) < 4:
                        continue
                    by_finger = {f: p.ps for p, f in bar[:3]}
                    _, approach_finger = bar[3]
                    approach_ps = bar[3][0].ps
                    # A finger's note is never above a lower-numbered finger's in the left hand.
                    if approach_finger == 1:
                        self.assertGreaterEqual(approach_ps, by_finger[3], entry["id"])
                    if approach_finger == 5:
                        self.assertLessEqual(approach_ps, by_finger[5], entry["id"])

    def test_the_rule_as_arithmetic(self) -> None:
        line = [pitch.Pitch("C2"), pitch.Pitch("E2"), pitch.Pitch("G2"), pitch.Pitch("B1")]
        self.assertEqual(walking_bass_fingers(line), [5, 3, 1, 5])
        line[3] = pitch.Pitch("F#2")
        self.assertEqual(walking_bass_fingers(line), [5, 3, 1, 2])
        line[3] = pitch.Pitch("E2")
        self.assertEqual(walking_bass_fingers(line), [5, 3, 1, 3])
        line[3] = pitch.Pitch("D2")
        self.assertEqual(walking_bass_fingers(line), [5, 3, 1, 4])
        line[3] = pitch.Pitch("B2")
        self.assertEqual(walking_bass_fingers(line), [5, 3, 1, 1])


class TestChromaticLeftHand(unittest.TestCase):
    def test_the_right_hand_puts_two_on_f_and_c(self) -> None:
        self.assertEqual(chromatic_finger(pitch.Pitch("F4").midi, False, "right"), 2)
        self.assertEqual(chromatic_finger(pitch.Pitch("C5").midi, False, "right"), 2)
        self.assertEqual(chromatic_finger(pitch.Pitch("E4").midi, False, "right"), 1)
        self.assertEqual(chromatic_finger(pitch.Pitch("B4").midi, False, "right"), 1)

    def test_the_left_hand_puts_two_on_e_and_b(self) -> None:
        self.assertEqual(chromatic_finger(pitch.Pitch("E3").midi, False, "left"), 2)
        self.assertEqual(chromatic_finger(pitch.Pitch("B3").midi, False, "left"), 2)
        self.assertEqual(chromatic_finger(pitch.Pitch("F3").midi, False, "left"), 1)
        self.assertEqual(chromatic_finger(pitch.Pitch("C4").midi, False, "left"), 1)
        for name in ("C#3", "E-3", "F#3", "A-3", "B-3"):
            self.assertEqual(chromatic_finger(pitch.Pitch(name).midi, False, "left"), 3)

    def test_the_left_hand_never_climbs_from_the_thumb_to_the_second_finger(self) -> None:
        sc, _ = make_chromatic("C", "both", 1)
        lh = fingered_notes(sc, "LH")
        up = lh[:13]
        self.assertEqual([f for _, f in up], [1, 3, 1, 3, 2, 1, 3, 1, 3, 1, 3, 2, 1])
        for (p1, f1), (p2, f2) in zip(up, up[1:]):
            if p2.ps > p1.ps and f1 == 1:
                self.assertEqual(f2, 3, f"{p1.nameWithOctave}{f1} -> {p2.nameWithOctave}{f2}")

    def test_the_two_hands_differ_only_where_the_pairs_are(self) -> None:
        sc, _ = make_chromatic("C", "both", 1)
        rh = [f for _, f in fingered_notes(sc, "RH")]
        lh = [f for _, f in fingered_notes(sc, "LH")]
        self.assertEqual(rh[:13], [1, 3, 1, 3, 1, 2, 3, 1, 3, 1, 3, 1, 2])
        self.assertEqual(len(rh), len(lh))


class TestTumbaoAnticipation(unittest.TestCase):
    def test_the_note_on_four_is_held_through_the_barline(self) -> None:
        sc, _ = make_tumbao("C", bars=4)
        lh = next(p for p in sc.parts if p.id == "LH")
        measures = list(lh.getElementsByClass("Measure"))
        self.assertGreaterEqual(len(measures), 4)
        second = measures[1]
        first_event = next(e for e in second.notesAndRests)
        self.assertIsInstance(first_event, note.Note, "the second bar opens with the held root, not a rest")
        self.assertIsNotNone(first_event.tie)
        self.assertEqual(first_event.tie.type, "stop")
        last_of_first = list(measures[0].notes)[-1]
        self.assertIsNotNone(last_of_first.tie)
        self.assertIn(last_of_first.tie.type, ("start", "continue"))
        # And the first bar still opens on nothing: the downbeat is empty by design.
        self.assertIsInstance(next(e for e in measures[0].notesAndRests), note.Rest)


class TestHandsSeparateArpeggios(unittest.TestCase):
    def test_the_quick_plan_has_them_in_c_at_stage_four(self) -> None:
        ids = {entry["id"]: entry for _, entry in default_plan(quick=True)}
        for hands in ("right", "left"):
            entry = ids.get(f"exercise.arpeggio.c-major.2oct.{hands}")
            self.assertIsNotNone(entry, hands)
            self.assertEqual(entry["level"], 4.3)
            entry = ids.get(f"exercise.arpeggio.a-minor.2oct.{hands}")
            self.assertIsNotNone(entry, hands)


class TestOdeToJoyBarTwelve(unittest.TestCase):
    """
    *Ode to Joy (full theme)*, `song.classical.ode-to-joy.full` (R48).

    Bar 12 is C4 D4 G3 in the right hand, and it printed 1 2 **5**: the little
    finger on the G below a thumb on middle C, which is the right hand
    crossing itself. Lesson 2.5 teaches this bar as the piece's one position
    shift, "a number that does not follow on from the last one", so the G is
    the thumb's: lift after the D, land the thumb on the G, and use the half
    note to come back to C position for bar 13. Read through the same ABC
    path the build compiles (`convert.py`: `prepare_abc`, then the fingerings
    put back by position).
    """

    ABC = REPO / "content" / "scores" / "authored" / "ode-to-joy-full.abc"

    def right_hand_bars(self) -> dict[int, list[tuple[pitch.Pitch, int | None]]]:
        text = self.ABC.read_text(encoding="utf-8")
        score = converter.parse(prepare_abc(text), format="abc")
        apply_fingerings(score, extract_fingerings(text))
        bars: dict[int, list[tuple[pitch.Pitch, int | None]]] = {}
        # Counted from 1 by position: music21 numbers this tune's first bar 0,
        # and `convert.renumber_measures` renumbers it from 1 for the page,
        # because it is a full bar and not a pickup.
        for number, measure in enumerate(score.parts[0].getElementsByClass("Measure"), start=1):
            notes = []
            for element in measure.notes:
                if not isinstance(element, note.Note):
                    continue
                fingers = [a.fingerNumber for a in element.articulations
                           if isinstance(a, articulations.Fingering)]
                notes.append((element.pitch, fingers[0] if fingers else None))
            bars[number] = notes
        return bars

    @staticmethod
    def below_the_thumb(bar: list[tuple[pitch.Pitch, int | None]]) -> list[str]:
        """
        A right-hand finger above the thumb on a pitch below the thumb's.

        Allowed only as a crossing: 2, 3 or 4 straight after the thumb, going
        down over it. Anything else is the hand on the wrong side of itself.
        """
        faults = []
        thumbs = [p.ps for p, f in bar if f == 1]
        for i, (p, f) in enumerate(bar):
            if f is None or f == 1:
                continue
            for thumb in thumbs:
                if p.ps >= thumb:
                    continue
                before = bar[i - 1] if i else None
                crossing = before is not None and before[1] == 1 and before[0].ps == thumb and f in (2, 3, 4)
                if not crossing:
                    faults.append(f"{p.nameWithOctave}({f}) under a thumb on {pitch.Pitch(ps=thumb).nameWithOctave}")
        return faults

    def test_bar_twelve_is_played_by_a_hand(self) -> None:
        bar = self.right_hand_bars()[12]
        self.assertEqual([p.nameWithOctave for p, _ in bar], ["C4", "D4", "G3"])
        self.assertEqual(self.below_the_thumb(bar), [])
        self.assertEqual([f for _, f in bar], [1, 2, 1])

    def test_no_bar_of_the_right_hand_crosses_under_its_thumb(self) -> None:
        faults = {number: self.below_the_thumb(bar) for number, bar in self.right_hand_bars().items()}
        self.assertEqual({n: f for n, f in faults.items() if f}, {})

    def test_the_rule_refuses_the_bar_that_shipped(self) -> None:
        shipped = [(pitch.Pitch("C4"), 1), (pitch.Pitch("D4"), 2), (pitch.Pitch("G3"), 5)]
        self.assertEqual(self.below_the_thumb(shipped), ["G3(5) under a thumb on C4"])
        crossing = [(pitch.Pitch("C4"), 1), (pitch.Pitch("B3"), 2)]
        self.assertEqual(self.below_the_thumb(crossing), [])


if __name__ == "__main__":
    unittest.main()
