"""
The seven score checks: each one red on the fault it was written for, green on
a clean control that is named.

Two kinds of test, deliberately:

* **Synthetic** — a few bars of MusicXML built in the test, which pins the
  *logic* and cannot rot when the content changes. Every threshold-free
  judgement lives here.
* **Corpus** — the named item from `docs/lesson-audit/README.md` and a named
  clean control beside it. These are what the brief asked for ("proven red on
  its known item and green on a clean control item you name"), and they are
  skipped when `app/public/content` has not been built, so an unbuilt tree does
  not report a failure it cannot have.

No test here asserts a count of today's content (`docs/00-invariants.md` §2).
Where a number appears it is an *input* — the corpus tempo floor the tool
prints with `--stats` is handed to the function so the two corpus items can be
compared against the same floor; the assertion is about which of them flags,
not about the floor.

Run:

    python -m unittest tools.content.tests.test_score_checks -v

`pytest tools/content/tests/test_score_checks.py` runs them too, where pytest
is installed; it is not installed in this repository's `.venv` (checked
2026-09-21, `pip list`), so the runs recorded in `docs/pending-review.md` Entry
23 were made with `unittest`, which is also what every other test file under
`tools/content/tests` is written for.
"""
from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from notation import read_musicxml  # noqa: E402
from score_checks import (  # noqa: E402
    CONTENT,
    LIBRARY_INDEX,
    ArchiveIndex,
    archive_bar_counts,
    bar_duration_faults,
    bar_fingerprints,
    check_bar_duration,
    check_grace_density,
    check_key_consistency,
    check_repeat_structure,
    check_title_structure,
    check_truncation,
    containment_flags,
    final_bar_incomplete,
    grace_share,
    read_score,
    repeat_faults,
    tempo_floors,
    title_key,
    work_key,
)

# --------------------------------------------------------------------------
# Building a few bars of MusicXML
# --------------------------------------------------------------------------


def note(duration: int, *, step: str = "C", octave: int = 4, kind: str = "quarter",
         voice: str = "1", staff: str | None = None, grace: bool = False,
         chord: bool = False, rest: bool = False, whole_rest: bool = False) -> str:
    body = "<grace/>" if grace else ""
    if chord:
        body += "<chord/>"
    if rest or whole_rest:
        body += '<rest measure="yes"/>' if whole_rest else "<rest/>"
    else:
        body += f"<pitch><step>{step}</step><octave>{octave}</octave></pitch>"
    if not grace:
        body += f"<duration>{duration}</duration>"
    body += f"<voice>{voice}</voice><type>{kind}</type>"
    if staff is not None:
        body += f"<staff>{staff}</staff>"
    return f"<note>{body}</note>"


def attributes(divisions: int = 4, beats: int = 4, beat_type: int = 4,
               fifths: int | None = 0, mode: str | None = None) -> str:
    out = f"<attributes><divisions>{divisions}</divisions>"
    if fifths is not None:
        out += f"<key><fifths>{fifths}</fifths>"
        if mode:
            out += f"<mode>{mode}</mode>"
        out += "</key>"
    out += f"<time><beats>{beats}</beats><beat-type>{beat_type}</beat-type></time>"
    return out + "</attributes>"


def measure(number, body: str, *, implicit: bool = False) -> str:
    flag = ' implicit="yes"' if implicit else ""
    return f'<measure number="{number}"{flag}>{body}</measure>'


def barline(*, location: str = "right", repeat: str | None = None,
            ending: tuple[str, str] | None = None, style: str | None = None) -> str:
    out = f'<barline location="{location}">'
    if style:
        out += f"<bar-style>{style}</bar-style>"
    if ending:
        out += f'<ending number="{ending[0]}" type="{ending[1]}"/>'
    if repeat:
        out += f'<repeat direction="{repeat}"/>'
    return out + "</barline>"


def score(*measures: str, parts: int = 1) -> str:
    part_list = "".join(
        f'<score-part id="P{i + 1}"><part-name>Piano</part-name></score-part>'
        for i in range(parts)
    )
    bodies = "".join(
        f'<part id="P{i + 1}">{"".join(measures)}</part>' for i in range(parts)
    )
    return (
        '<?xml version="1.0" encoding="UTF-8"?>'
        f'<score-partwise version="3.1"><part-list>{part_list}</part-list>{bodies}</score-partwise>'
    )


def row(item: str = "song.test", title: str = "Test", **extra) -> dict:
    out = {"id": item, "title": title, "file": "scores/test.mxl"}
    out.update(extra)
    return out


def four_four(*bodies: str) -> str:
    """A 4/4 score in C, divisions 4, one bar per body."""
    return score(
        *(
            measure(i + 1, (attributes() if i == 0 else "") + body)
            for i, body in enumerate(bodies)
        )
    )


FOUR_QUARTERS = "".join(note(4) for _ in range(4))


# --------------------------------------------------------------------------
# 1. key-consistency
# --------------------------------------------------------------------------


class TitleKey(unittest.TestCase):
    def test_reads_a_named_key(self):
        self.assertEqual(title_key("Ecossaise in G major, WoO 23"), (7, "major"))
        self.assertEqual(title_key("Andante in B-flat major, K. 15ii"), (10, "major"))
        self.assertEqual(title_key("Minuet in G minor, BWV Anh. 115"), (7, "minor"))

    def test_needs_the_word_in(self):
        """A title is the field this repository has been burned by most, so the
        pattern is narrow on purpose: without `in`, "Minor Swing" matches."""
        self.assertIsNone(title_key("Minor Swing"))
        self.assertIsNone(title_key("A Major Scale Study"))


class KeyConsistency(unittest.TestCase):
    def flags(self, *, title, fifths, mode=None, analysis=None, bodies=None, final_bass=None):
        bodies = bodies or [FOUR_QUARTERS]
        text = score(
            *(
                measure(
                    i + 1,
                    (attributes(fifths=fifths, mode=mode) if i == 0 else "") + body,
                )
                for i, body in enumerate(bodies)
            )
        )
        return check_key_consistency(
            row(title=title, notation={"finalBass": final_bass}),
            read_score(text),
            analysis,
        )

    def test_red_when_the_title_names_another_key(self):
        """The Ecossaise's shape: titled in G major, written with one flat."""
        found = self.flags(title="Ecossaise in G major", fifths=-1, mode="major")
        self.assertEqual([f.check for f in found], ["key-consistency"])
        self.assertEqual(found[0].severity, "high")
        self.assertEqual(found[0].numbers["titleKey"], "G major")
        self.assertEqual(found[0].numbers["signature"], "F major")

    def test_green_when_the_title_agrees(self):
        self.assertEqual(self.flags(title="Ecossaise in F major", fifths=-1, mode="major"), [])

    def test_green_when_the_title_names_the_relative_minor(self):
        """One signature stands for two keys. Two flats is B flat major *or* G
        minor, and a file that omits `<mode>` has not said which."""
        self.assertEqual(self.flags(title="Minuet in G minor", fifths=-2), [])
        self.assertEqual(self.flags(title="Minuet in B-flat major", fifths=-2), [])

    def test_red_when_the_analysis_and_the_final_bass_both_disagree(self):
        bodies = [FOUR_QUARTERS] * 8
        found = self.flags(
            title="Untitled",
            fifths=0,
            analysis={"tonicPc": 2, "mode": "minor", "correlation": 0.86},
            bodies=bodies,
            final_bass=7,
        )
        self.assertEqual(len(found), 1)
        self.assertEqual(found[0].numbers["analysis"], "D minor")

    def test_green_when_the_final_bass_backs_the_signature(self):
        """One witness against the signature is not enough: music21 reads a
        I-IV-V loop in C as F major."""
        self.assertEqual(
            self.flags(
                title="Untitled",
                fifths=0,
                analysis={"tonicPc": 5, "mode": "major", "correlation": 0.9},
                bodies=[FOUR_QUARTERS] * 8,
                final_bass=0,
            ),
            [],
        )

    def test_green_when_there_is_too_little_music_to_analyse(self):
        self.assertEqual(
            self.flags(
                title="Untitled",
                fifths=0,
                analysis={"tonicPc": 2, "mode": "minor", "correlation": 0.9},
                bodies=[FOUR_QUARTERS] * 4,
                final_bass=7,
            ),
            [],
        )

    def test_green_when_the_analysis_picks_the_relative(self):
        self.assertEqual(
            self.flags(
                title="Untitled",
                fifths=0,
                analysis={"tonicPc": 9, "mode": "minor", "correlation": 0.9},
                bodies=[FOUR_QUARTERS] * 8,
                final_bass=7,
            ),
            [],
        )


# --------------------------------------------------------------------------
# 2. grace-density and the tempo floor
# --------------------------------------------------------------------------


class GraceDensity(unittest.TestCase):
    def test_red_on_a_file_that_is_mostly_grace_notes(self):
        body = "".join(note(0, grace=True) for _ in range(4)) + FOUR_QUARTERS
        found = check_grace_density(row(), read_score(four_four(body)), {})
        self.assertEqual([f.check for f in found], ["grace-density"])
        self.assertGreater(found[0].numbers["share"], 0.25)

    def test_green_on_an_ordinary_ornamented_file(self):
        body = note(0, grace=True) + "".join(note(1, kind="16th") for _ in range(16))
        self.assertEqual(check_grace_density(row(), read_score(four_four(body)), {}), [])

    def test_green_on_one_grace_note_in_a_tiny_file(self):
        """`GRACE_COUNT_FLOOR`: a share means nothing over three notes."""
        body = note(0, grace=True) + note(4) + note(4) + note(4)
        self.assertEqual(check_grace_density(row(), read_score(four_four(body)), {}), [])

    def test_grace_share_ignores_nothing_it_should_count(self):
        body = "".join(note(0, grace=True) for _ in range(2)) + FOUR_QUARTERS
        graces, total, share = grace_share(read_score(four_four(body)))
        self.assertEqual((graces, total), (2, 6))
        self.assertAlmostEqual(share, 2 / 6)


class TempoFloor(unittest.TestCase):
    def test_a_floor_is_the_second_percentile_of_its_own_metre(self):
        """Over a hundred files that is the second slowest, so 98 of them sit
        above the floor and nothing about the metre is assumed."""
        values = {"4/4": [float(60 + i) for i in range(100)]}
        self.assertEqual(tempo_floors(values), {"4/4": 61.0})

    def test_no_floor_is_invented_for_a_metre_with_few_files(self):
        self.assertEqual(tempo_floors({"7/8": [40.0, 41.0, 42.0]}), {})

    def slow(self, *, words: str | None):
        direction = (
            f"<direction><direction-type><words>{words}</words></direction-type>"
            '<sound tempo="40"/></direction>'
            if words
            else '<direction><sound tempo="40"/></direction>'
        )
        return read_score(four_four(direction + FOUR_QUARTERS))

    def test_red_when_a_slow_tempo_carries_no_marking(self):
        found = check_grace_density(row(), self.slow(words=None), {"4/4": 54.0})
        self.assertEqual([f.numbers["tempoQuarterBpm"] for f in found], [40.0])

    def test_green_when_the_file_says_it_is_slow(self):
        """The Moonlight is slow and says `Adagio sostenuto`. A slow piece is
        not a fault; a slow file that never says so is the shape worth a look."""
        self.assertEqual(
            check_grace_density(row(), self.slow(words="Adagio sostenuto"), {"4/4": 54.0}), []
        )
        self.assertEqual(
            check_grace_density(row(), self.slow(words="Sehr langsam"), {"4/4": 54.0}), []
        )


# --------------------------------------------------------------------------
# 3. truncation
# --------------------------------------------------------------------------


class WorkKey(unittest.TestCase):
    def test_drops_parentheticals_and_the_catalogue_number(self):
        self.assertEqual(work_key("Minuet in G major, K. 1e"), "minuet in g major")
        self.assertEqual(
            work_key("Sonatina in C major, Op. 36 No. 1 (first movement, short edition)"),
            "sonatina in c major",
        )


class Truncation(unittest.TestCase):
    def short(self, bars: int) -> object:
        return read_score(four_four(*([FOUR_QUARTERS] * bars)))

    def test_red_against_a_longer_verified_copy(self):
        found = check_truncation(row(), self.short(16), {"other": (32, 16)})
        self.assertEqual([f.check for f in found], ["truncation"])
        self.assertEqual(found[0].numbers["bars"], 16)
        self.assertEqual(found[0].numbers["copyMedian"], 32)

    def test_green_when_the_copies_agree_on_length(self):
        self.assertEqual(check_truncation(row(), self.short(32), {"other": (32, 32)}), [])

    def test_green_within_the_ordinary_spread_of_editions(self):
        self.assertEqual(check_truncation(row(), self.short(30), {"a": (32, 30), "b": (31, 30)}), [])

    def test_final_bar_completing_a_pickup_is_not_truncation(self):
        """A three-four piece that opens on one beat ends on two. Without this
        excuse both Mozart minuets on `classical.4` are reported truncated."""
        opening = measure(0, attributes(beats=3, beat_type=4) + note(4), implicit=True)
        middle = measure(1, "".join(note(4) for _ in range(3)))
        closing = measure(2, note(4) + note(4))
        short, why = final_bar_incomplete(read_score(score(opening, middle, closing)))
        self.assertFalse(short, why)

    def test_red_on_a_last_bar_that_is_short_with_no_final_barline(self):
        opening = measure(1, attributes(beats=3, beat_type=4) + "".join(note(4) for _ in range(3)))
        closing = measure(2, note(4))
        short, why = final_bar_incomplete(read_score(score(opening, closing)))
        self.assertTrue(short)
        self.assertIn("no final barline", why)

    def test_green_when_the_short_last_bar_ends_the_piece_properly(self):
        opening = measure(1, attributes(beats=3, beat_type=4) + "".join(note(4) for _ in range(3)))
        closing = measure(2, note(4) + barline(style="light-heavy"))
        short, _ = final_bar_incomplete(read_score(score(opening, closing)))
        self.assertFalse(short)


# --------------------------------------------------------------------------
# 4. bar-duration
# --------------------------------------------------------------------------


class BarDuration(unittest.TestCase):
    def test_red_on_a_bar_holding_six_beats_in_four_four(self):
        faults = bar_duration_faults(
            read_score(four_four(FOUR_QUARTERS, "".join(note(4) for _ in range(6)), FOUR_QUARTERS))
        )
        self.assertEqual([f["kind"] for f in faults], ["overfull"])
        self.assertEqual(faults[0]["beats"], 6.0)

    def test_red_on_an_underfull_bar_in_the_middle(self):
        faults = bar_duration_faults(
            read_score(four_four(FOUR_QUARTERS, note(4) + note(4), FOUR_QUARTERS, FOUR_QUARTERS))
        )
        self.assertEqual([f["kind"] for f in faults], ["underfull"])

    def test_green_on_bars_that_add_up(self):
        self.assertEqual(
            bar_duration_faults(read_score(four_four(*([FOUR_QUARTERS] * 4)))), []
        )

    def test_green_on_a_tuplet_that_fills_the_bar(self):
        """So Danco Samba's bar 10: six printed quarters, each 2/3 long, which
        is four beats. The audit's instrument printed `<type>` and did not mark
        tuplets, and read them as six beats in four-four.

        Divisions of twelve, so that a 3:2 quarter is the whole number eight.
        """
        plain = "".join(note(12) for _ in range(4))
        sextuplet = "".join(note(8, kind="quarter") for _ in range(6))
        text = score(
            measure(1, attributes(divisions=12) + plain),
            measure(2, sextuplet),
            measure(3, plain),
        )
        self.assertEqual(bar_duration_faults(read_score(text)), [])

    def test_green_when_a_forward_is_undone_by_a_backup(self):
        """MuseScore opens a bar with `forward` then `backup` to position the
        cursor. Summing durations reads that as an extra bar's worth."""
        body = "<forward><duration>16</duration><staff>1</staff></forward>" \
               "<backup><duration>16</duration></backup>" + FOUR_QUARTERS
        self.assertEqual(
            bar_duration_faults(read_score(four_four(FOUR_QUARTERS, body, FOUR_QUARTERS))), []
        )

    def test_green_when_both_staves_number_their_voices_one(self):
        """A grand staff written as one part, both hands in voice 1, separated
        by a backup. Keyed on voice alone and summed this reads as twice the
        metre."""
        body = (
            "".join(note(4, staff="1") for _ in range(4))
            + "<backup><duration>16</duration></backup>"
            + "".join(note(4, staff="2", octave=3) for _ in range(4))
        )
        self.assertEqual(
            bar_duration_faults(read_score(four_four(FOUR_QUARTERS, body, FOUR_QUARTERS))), []
        )

    def test_a_fault_names_the_staff_as_well_as_the_voice(self):
        """Without the staff the reader cannot tell which hand is wrong, and
        two hands numbering their voices alike are counted as one."""
        body = (
            FOUR_QUARTERS
            + "<backup><duration>16</duration></backup>"
            + "".join(note(4, staff="2", voice="5", octave=3) for _ in range(6))
        )
        faults = bar_duration_faults(read_score(four_four(FOUR_QUARTERS, body, FOUR_QUARTERS)))
        self.assertEqual([f["voice"] for f in faults], ["2/5"])

    def test_green_on_an_inner_voice_that_stops_short_of_the_bar(self):
        """`mozart-k545-i`'s shape: a second voice of two quarters in a 4/4 bar,
        written with no rests after it. The *bar* is full — only the longest
        voice says whether it is. Judging every voice reported six such bars in
        that one file."""
        body = (
            FOUR_QUARTERS
            + "<backup><duration>16</duration></backup>"
            + note(4, voice="2")
            + note(4, voice="2")
        )
        self.assertEqual(
            bar_duration_faults(read_score(four_four(FOUR_QUARTERS, body, FOUR_QUARTERS))), []
        )

    def test_green_on_a_bar_split_at_a_repeat(self):
        text = score(
            measure(1, attributes() + FOUR_QUARTERS),
            measure(2, note(4) + note(4)),
            measure("2X1", note(4) + note(4)),
            measure(3, FOUR_QUARTERS),
        )
        self.assertEqual(bar_duration_faults(read_score(text)), [])

    def test_the_flag_names_the_bar_and_the_beats(self):
        found = check_bar_duration(
            row(), read_score(four_four(FOUR_QUARTERS, "".join(note(4) for _ in range(6)), FOUR_QUARTERS))
        )
        self.assertEqual(found[0].severity, "high")
        self.assertIn("holds 6.0 beats in 4/4", found[0].why)


# --------------------------------------------------------------------------
# 5. containment and duplication
# --------------------------------------------------------------------------


class Containment(unittest.TestCase):
    def prints(self, n: int, offset: int = 0) -> list[tuple]:
        return [((i + offset,), (i + offset,)) for i in range(n)]

    def test_red_when_one_item_sits_inside_another(self):
        big = self.prints(24)
        found = containment_flags({"a": self.prints(10), "b": big}, {"a": "A", "b": "B"})
        self.assertEqual([f.check for f in found], ["containment"])
        self.assertEqual(found[0].item, "a")
        self.assertEqual(found[0].numbers["other"], "b")
        self.assertEqual(found[0].numbers["longestRun"], 10)

    def test_green_on_two_unrelated_items(self):
        self.assertEqual(
            containment_flags(
                {"a": self.prints(10), "b": self.prints(24, offset=100)},
                {"a": "A", "b": "B"},
            ),
            [],
        )

    def test_green_on_a_declared_variant(self):
        """`chopin-prelude-op28-4.alt` is the same music by design."""
        self.assertEqual(
            containment_flags(
                {"a": self.prints(12), "b": self.prints(12)},
                {"a": "A", "b": "B"},
                {"a": "b"},
            ),
            [],
        )

    def test_green_on_a_fragment_too_short_to_mean_anything(self):
        self.assertEqual(
            containment_flags({"a": self.prints(4), "b": self.prints(4)}, {}), []
        )

    def test_two_generated_exercises_are_reported_quietly(self):
        found = containment_flags(
            {"exercise.a": self.prints(12), "exercise.b": self.prints(12)},
            {"exercise.a": "A", "exercise.b": "B"},
        )
        self.assertEqual([f.severity for f in found], ["low"])

    def test_a_fingerprint_ignores_the_staff_a_note_is_written_on(self):
        """The same bar written as one part with two staves and as two parts
        has to fingerprint alike, or no two encodings of a work ever match."""
        one_part = four_four(
            "".join(note(4, staff="1") for _ in range(4))
            + "<backup><duration>16</duration></backup>"
            + "".join(note(4, staff="2", step="G", octave=3) for _ in range(4))
        )
        two_parts = score(
            measure(1, attributes() + "".join(note(4) for _ in range(4))),
            parts=1,
        )
        self.assertEqual(len(bar_fingerprints(read_score(one_part))), 1)
        self.assertEqual(len(bar_fingerprints(read_score(two_parts))), 1)
        merged = bar_fingerprints(read_score(one_part))[0]
        self.assertEqual(merged[0], (0, 0, 0, 0, 7, 7, 7, 7))


# --------------------------------------------------------------------------
# 6. title against structure
# --------------------------------------------------------------------------


class TitleStructure(unittest.TestCase):
    def test_red_when_a_two_movement_title_holds_one_section(self):
        found = check_title_structure(
            row(title="Sonatina in C major, Op. 36 No. 1 (second and third movements)"),
            read_score(four_four(*([FOUR_QUARTERS] * 8))),
        )
        self.assertEqual([f.check for f in found], ["title-structure"])
        self.assertEqual(found[0].severity, "low")
        self.assertEqual(found[0].numbers["sections"], 1)

    def test_green_on_a_single_movement_title(self):
        self.assertEqual(
            check_title_structure(
                row(title="Sonatina in C major, Op. 36 No. 1 (first movement)"),
                read_score(four_four(*([FOUR_QUARTERS] * 8))),
            ),
            [],
        )

    def test_green_when_the_file_really_has_two_sections(self):
        first = measure(1, attributes() + '<direction><sound tempo="120"/></direction>' + FOUR_QUARTERS)
        second = measure(2, '<direction><sound tempo="60"/></direction>' + FOUR_QUARTERS)
        self.assertEqual(
            check_title_structure(
                row(title="Sonata (second and third movements)"),
                read_score(score(first, second)),
            ),
            [],
        )


# --------------------------------------------------------------------------
# 7. repeat structure
# --------------------------------------------------------------------------


class RepeatStructure(unittest.TestCase):
    def volta(self, second_ending_repeat: bool) -> str:
        """Bars 1-2 plain, bar 3 the first ending, bar 4 the second."""
        first = measure(1, attributes() + barline(location="left", repeat="forward") + FOUR_QUARTERS)
        second = measure(2, FOUR_QUARTERS)
        third = measure(
            3,
            barline(location="left", ending=("1", "start"))
            + FOUR_QUARTERS
            + barline(
                ending=("1", "stop"),
                repeat=None if second_ending_repeat else "backward",
            ),
        )
        fourth = measure(
            4,
            barline(location="left", ending=("2", "start"))
            + FOUR_QUARTERS
            + barline(
                ending=("2", "stop"),
                repeat="backward" if second_ending_repeat else None,
            ),
        )
        return score(first, second, third, fourth)

    def test_red_on_a_backward_repeat_inside_the_second_ending(self):
        """I Got Rhythm's shape: the repeat sits at the end of bar 10, which is
        the second-time bar, so the first ending never repeats."""
        faults = repeat_faults(read_score(self.volta(second_ending_repeat=True)))
        self.assertIn("backward-repeat-in-later-ending", [f["kind"] for f in faults])

    def test_green_when_the_repeat_closes_the_first_ending(self):
        self.assertEqual(repeat_faults(read_score(self.volta(second_ending_repeat=False))), [])

    def test_red_on_a_forward_repeat_that_is_never_closed(self):
        text = score(
            measure(1, attributes() + barline(location="left", repeat="forward") + FOUR_QUARTERS),
            measure(2, FOUR_QUARTERS),
        )
        self.assertEqual(
            [f["kind"] for f in repeat_faults(read_score(text))], ["unpaired-forward-repeat"]
        )

    def test_red_on_endings_numbered_one_then_three(self):
        text = score(
            measure(1, attributes() + barline(location="left", ending=("1", "start"))
                    + FOUR_QUARTERS + barline(ending=("1", "stop"), repeat="backward")),
            measure(2, barline(location="left", ending=("3", "start"))
                    + FOUR_QUARTERS + barline(ending=("3", "stop"))),
        )
        self.assertIn("endings-out-of-order", [f["kind"] for f in repeat_faults(read_score(text))])

    def test_green_on_three_strains_each_numbered_from_one(self):
        """A rag reads 1,2,1,2,1,2 and is correct; "sorted" is the wrong test."""
        bars = []
        for strain in range(3):
            bars.append(
                measure(
                    strain * 2 + 1,
                    (attributes() if strain == 0 else "")
                    + barline(location="left", ending=("1", "start"))
                    + FOUR_QUARTERS
                    + barline(ending=("1", "stop"), repeat="backward"),
                )
            )
            bars.append(
                measure(
                    strain * 2 + 2,
                    barline(location="left", ending=("2", "start"))
                    + FOUR_QUARTERS
                    + barline(ending=("2", "stop")),
                )
            )
        self.assertEqual(repeat_faults(read_score(score(*bars))), [])

    def test_the_flag_names_the_bar(self):
        found = check_repeat_structure(row(), read_score(self.volta(second_ending_repeat=True)))
        self.assertEqual(found[0].severity, "high")
        self.assertIn("bar 4", found[0].why)


# --------------------------------------------------------------------------
# The named items, read out of the built content
# --------------------------------------------------------------------------

CATALOG = CONTENT / "catalog.json"
BUILT = CATALOG.exists()


def built(item: str):
    rows = json.loads(CATALOG.read_text(encoding="utf-8"))
    found = next((r for r in rows if r["id"] == item), None)
    if found is None or not found.get("file"):
        raise AssertionError(f"{item}: not in the built catalog")
    text = read_musicxml(CONTENT / found["file"])
    if text is None:
        raise AssertionError(f"{item}: its file would not read")
    return found, read_score(text)


@unittest.skipUnless(BUILT, "app/public/content/catalog.json has not been built")
class KnownItems(unittest.TestCase):
    """
    Each of the seven faults in `docs/lesson-audit/README.md`, against a named
    clean control. Five fire on the file they were written for; the sixth
    (`so-danco-samba`) does not, and that is asserted too, because the file is
    not wrong — see `test_bar_duration`.
    """

    def test_key_consistency(self):
        red, score_ = built("song.classical.beethoven-ludwig-van-beethoven-ecossaise.pdmx")
        found = check_key_consistency(red, score_, None)
        self.assertEqual([f.severity for f in found], ["high"])
        self.assertEqual(found[0].numbers["titleKey"], "G major")
        self.assertEqual(found[0].numbers["signature"], "F major")

        green, clean = built("song.classical.mozart-minuet-in-f-major-k-1d.pdmx")
        self.assertEqual(check_key_consistency(green, clean, None), [])

    def test_grace_density(self):
        red, score_ = built(
            "song.classical.beethoven-ludwig-van-beethoven-joyful-joyful-we-adore-thee.pdmx"
        )
        # 54 corpus quarter-BPM for 4/4 is the floor `--stats` prints; it is an
        # input here so both items are judged against the same one.
        found = check_grace_density(red, score_, {"4/4": 54.0})
        kinds = [set(f.numbers) for f in found]
        self.assertTrue(any("graceNotes" in k for k in kinds), found)
        self.assertTrue(any("tempoQuarterBpm" in k for k in kinds), found)

        green, clean = built("song.classical.satie-erik-satie-gnossienne-n1.pdmx")
        self.assertEqual(check_grace_density(green, clean, {"4/4": 54.0}), [])

    def test_truncation(self):
        red, short = built("song.pop.minuet-in-g-minor-bach-piano.pdmx")
        green, full = built("song.classical.petzold-minuet-in-g-minor-bwv-anh-115.pdmx")
        # The two catalog items are copies of one work: the check verifies that
        # by their shared bars before comparing lengths.
        shared = set(bar_fingerprints(short)) & set(bar_fingerprints(full))
        self.assertGreater(len(shared), len(set(bar_fingerprints(short))) * 0.25)

        found = check_truncation(red, short, {green["id"]: (full.bar_count, short.bar_count)})
        self.assertEqual([f.severity for f in found], ["high"])
        self.assertEqual(check_truncation(green, full, {red["id"]: (short.bar_count, short.bar_count)}), [])

    @unittest.skipUnless(LIBRARY_INDEX.exists(), "the unpacked archive is not on this machine")
    def test_a_title_match_that_shares_no_bars_is_not_a_copy(self):
        """*Minuet in C major* is a title two different pieces carry — Mozart's
        K. 1f and a Clementi. Matched on the title alone the Mozart is reported
        truncated against the Clementi's length, so the match is confirmed
        against the notes before any length is compared."""
        item, k1f = built("song.classical.mozart-w-a-mozart-minuet-in-c-major-k1f.pdmx")
        index = ArchiveIndex.load()
        mine = Path(item["file"]).stem  # the item's own upload, excluded as the run does
        cids, _ = index.copies(item["title"], item.get("composer"), exclude=mine)
        self.assertTrue(cids, "no archive row matches the title at all")
        unverified = archive_bar_counts(index, cids)
        verified = archive_bar_counts(index, cids, set(bar_fingerprints(k1f)))
        self.assertTrue(unverified, "the title match read no archive file")
        self.assertEqual(verified, {})

    def test_bar_duration(self):
        """
        **The known item is not wrong.** `docs/lesson-audit/README.md` records
        "bar 10 seems to hold six beats in 4/4" for *So Danco Samba*. It holds
        two quarter-note triplets: six printed quarters at 2/3 each, 6720 of
        10080 divisions apiece, four beats exactly. The audit's own note on its
        instrument says `dump_score.py` does not mark tuplets. So the red
        control is a real overfull bar found by this check instead.
        """
        green, clean = built("song.folk.so-danco-samba.pdmx")
        self.assertEqual(bar_duration_faults(clean), [])

        red, score_ = built("song.blues.singin-the-blues")
        faults = bar_duration_faults(score_)
        self.assertTrue(any(f["kind"] == "overfull" and f["bar"] == "31" for f in faults), faults)

    def test_containment(self):
        small, k1f = built("song.classical.mozart-w-a-mozart-minuet-in-c-major-k1f.pdmx")
        large, k1e = built("song.classical.mozart-w-a-mozart-minuet-in-g-major-k1e.pdmx")
        prints = {small["id"]: bar_fingerprints(k1f), large["id"]: bar_fingerprints(k1e)}
        found = containment_flags(prints, {small["id"]: "K. 1f", large["id"]: "K. 1e"})
        self.assertEqual([f.item for f in found], [small["id"]])
        self.assertEqual(found[0].numbers["other"], large["id"])

        # Green: an unrelated minuet of a similar length shares no such run.
        other, k1d = built("song.classical.mozart-minuet-in-f-major-k-1d.pdmx")
        self.assertEqual(
            containment_flags(
                {other["id"]: bar_fingerprints(k1d), large["id"]: bar_fingerprints(k1e)},
                {other["id"]: "K. 1d", large["id"]: "K. 1e"},
            ),
            [],
        )

    def test_title_structure(self):
        red, score_ = built("song.classical.clementi-sonatina-no1-2-muzio-clementi.pdmx")
        found = check_title_structure(red, score_)
        self.assertEqual([f.severity for f in found], ["low"])
        self.assertEqual(found[0].numbers["sections"], 1)

        green, clean = built("song.classical.clementi-sonatina-no-1-muzio-clementi.pdmx")
        self.assertEqual(check_title_structure(green, clean), [])

    def test_repeat_structure(self):
        red, score_ = built("song.classical.i-got-rythm.pdmx")
        faults = repeat_faults(score_)
        self.assertIn("backward-repeat-in-later-ending", [f["kind"] for f in faults])
        self.assertTrue(
            any(f.get("bar") == "10" for f in faults if f["kind"] == "backward-repeat-in-later-ending"),
            faults,
        )

        green, clean = built("song.folk.so-danco-samba.pdmx")
        self.assertEqual(repeat_faults(clean), [])


if __name__ == "__main__":
    unittest.main()
