"""G30's revision of the tests that read a moved family's fingering off a maker's score.

usage: python docs/prompts/runs/G30/scripts-edit_convention_tests.py
The old assumption: a maker of these families prints its convention. Since G30 the maker's score carries
none (its row says none); the convention is still worked out and is what these tests pin, so each reads
it inside `tests.convention.convention_printed()`. Class: preserve, re-targeted. One of them
(`test_the_thumb_is_never_below_the_second_finger_within_a_bar`) had gone vacuously green on the fingerless
score and gains a guard that every approach note it reads carries a finger. Idempotent splices.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
T = ROOT / "tools" / "content" / "tests"
NOTE = "G30: the convention is no longer printed (the row says none); read as if it were (tests/convention.py)."

EDITS = {
    T / "test_generator.py": [
        ("""from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from generate_exercises import (  # noqa: E402
""", """from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from tests.convention import convention_printed  # noqa: E402
from generate_exercises import (  # noqa: E402
"""),
        ("""    def test_the_left_hand_fingering_is_five_on_the_tonic_and_one_on_the_dominant(self) -> None:
        score, _ = make_coordination("C", "change")
""", f"""    def test_the_left_hand_fingering_is_five_on_the_tonic_and_one_on_the_dominant(self) -> None:
        # {NOTE}
        with convention_printed():
            score, _ = make_coordination("C", "change")
"""),
        ("""    def test_only_the_two_notes_that_start_a_position_are_fingered(self) -> None:
        score, _ = make_position_shift("C", "right")
""", f"""    def test_only_the_two_notes_that_start_a_position_are_fingered(self) -> None:
        # {NOTE}
        with convention_printed():
            score, _ = make_position_shift("C", "right")
"""),
        ("""    def test_the_left_hand_version_uses_the_little_finger(self) -> None:
        score, _ = make_position_shift("C", "left")
""", f"""    def test_the_left_hand_version_uses_the_little_finger(self) -> None:
        # {NOTE}
        with convention_printed():
            score, _ = make_position_shift("C", "left")
"""),
        ("""    def test_only_the_bass_note_of_each_group_is_fingered(self) -> None:
        score, _ = make_accompaniment("C", "major", "broken", "left")
""", f"""    def test_only_the_bass_note_of_each_group_is_fingered(self) -> None:
        # {NOTE}
        with convention_printed():
            score, _ = make_accompaniment("C", "major", "broken", "left")
"""),
        ("""    def test_the_hands_have_mirrored_fingering(self) -> None:
        right, _ = make_five_finger("C", "major", "right")
        left, _ = make_five_finger("C", "major", "left")
""", f"""    def test_the_hands_have_mirrored_fingering(self) -> None:
        # {NOTE}
        with convention_printed():
            right, _ = make_five_finger("C", "major", "right")
            left, _ = make_five_finger("C", "major", "left")
"""),
        ("""    chord-shaped exercise shipped that way until this test existed, so the assertion is on
    the written MusicXML and nothing else.
    \"\"\"
""", """    chord-shaped exercise shipped that way until this test existed, so the assertion is on
    the written MusicXML and nothing else.

    Revised by G30: the families used here (cadence, pedal, triad_inversions) no longer print their
    convention, so each is read as if it did (`tests/convention.py`); the export is what is tested.
    \"\"\"
"""),
        ("""    def test_a_cadence_chord_keeps_its_fingering(self) -> None:
        score, _ = make_cadence("C", "root")
""", """    def test_a_cadence_chord_keeps_its_fingering(self) -> None:
        with convention_printed():
            score, _ = make_cadence("C", "root")
"""),
        ("""    def test_the_seventh_chord_is_fingered_on_all_four_notes(self) -> None:
        score, _ = make_cadence("C", "root")
""", """    def test_the_seventh_chord_is_fingered_on_all_four_notes(self) -> None:
        with convention_printed():
            score, _ = make_cadence("C", "root")
"""),
        ("""    def test_the_pedal_exercise_keeps_its_fingering(self) -> None:
        score, _ = make_pedal("C")
""", """    def test_the_pedal_exercise_keeps_its_fingering(self) -> None:
        with convention_printed():
            score, _ = make_pedal("C")
"""),
        ("""        # They never were: the family shipped with none, against docs/02 Part E.
        score, _ = make_triad_inversions("C", "major", "right")
""", """        # They never were: the family shipped with none, against docs/02 Part E.
        with convention_printed():
            score, _ = make_triad_inversions("C", "major", "right")
"""),
        ("""    def test_the_left_hand_fingers_inversions_from_the_bottom(self) -> None:
        score, _ = make_triad_inversions("C", "major", "left")
""", """    def test_the_left_hand_fingers_inversions_from_the_bottom(self) -> None:
        with convention_printed():
            score, _ = make_triad_inversions("C", "major", "left")
"""),
        ("""        # the lower of the pair.
        right, _ = make_trill(tonic="C", notes_per_beat=4, hands="right")
        left, _ = make_trill(tonic="C", notes_per_beat=4, hands="left")
""", f"""        # the lower of the pair. {NOTE}
        with convention_printed():
            right, _ = make_trill(tonic="C", notes_per_beat=4, hands="right")
            left, _ = make_trill(tonic="C", notes_per_beat=4, hands="left")
"""),
    ],
    T / "test_generator_fingering.py": [
        ("""import generate_exercises as G  # noqa: E402
from abc_tools import apply_fingerings, extract_fingerings, prepare_abc  # noqa: E402
""", """import generate_exercises as G  # noqa: E402
from abc_tools import apply_fingerings, extract_fingerings, prepare_abc  # noqa: E402
from tests.convention import convention_printed  # noqa: E402
"""),
        ("""class TestWalkingBassFingering(unittest.TestCase):
    def test_root_third_fifth_sit_under_five_three_one(self) -> None:
        sc, _ = make_walking_bass("C", "blues", "intro")
""", f"""class TestWalkingBassFingering(unittest.TestCase):
    \"\"\"{NOTE}\"\"\"

    def test_root_third_fifth_sit_under_five_three_one(self) -> None:
        with convention_printed():
            sc, _ = make_walking_bass("C", "blues", "intro")
"""),
        ("""    def test_the_approach_note_is_fingered_by_where_it_lands(self) -> None:
        sc, _ = make_walking_bass("C", "blues", "intro")
""", """    def test_the_approach_note_is_fingered_by_where_it_lands(self) -> None:
        with convention_printed():
            sc, _ = make_walking_bass("C", "blues", "intro")
"""),
        ("""                sc, entry = make_walking_bass(tonic, form)
                lh = fingered_notes(sc, "LH")
                for start in range(0, len(lh), 4):
                    bar = lh[start : start + 4]
                    if len(bar) < 4:
                        continue
                    by_finger = {f: p.ps for p, f in bar[:3]}
                    _, approach_finger = bar[3]
""", """                with convention_printed():
                    sc, entry = make_walking_bass(tonic, form)
                lh = fingered_notes(sc, "LH")
                for start in range(0, len(lh), 4):
                    bar = lh[start : start + 4]
                    if len(bar) < 4:
                        continue
                    by_finger = {f: p.ps for p, f in bar[:3]}
                    _, approach_finger = bar[3]
                    # G30: on a fingerless score every check here passed with nothing read.
                    self.assertIsNotNone(approach_finger, entry["id"])
"""),
    ],
    T / "test_harmony_families.py": [
        ("""    def test_the_walk_is_fingered_from_the_little_finger_to_the_thumb(self) -> None:
        from music21 import articulations

        sc, _ = make_walkup("C")
""", f"""    def test_the_walk_is_fingered_from_the_little_finger_to_the_thumb(self) -> None:
        from music21 import articulations

        from tests.convention import convention_printed

        # {NOTE}
        with convention_printed():
            sc, _ = make_walkup("C")
"""),
    ],
    T / "test_generator_invariants.py": [
        ("""        Over fifty seeds in each hand every degree of the position starts at least one melody, the
        printed finger is the degree's, and the vocabulary is still seconds and thirds ending on C.
        \"\"\"
        firsts: dict[str, set[int]] = {"right": set(), "left": set()}
        for hands in ("right", "left"):
            for seed in range(1, 51):
                sc, entry = G.make_interval_reading(seed, hands)
""", f"""        Over fifty seeds in each hand every degree of the position starts at least one melody, the
        finger the maker gives the first note is the degree's, and the vocabulary is still seconds and
        thirds ending on C. {NOTE}
        \"\"\"
        from tests.convention import convention_printed

        firsts: dict[str, set[int]] = {{"right": set(), "left": set()}}
        for hands in ("right", "left"):
            for seed in range(1, 51):
                with convention_printed():
                    sc, entry = G.make_interval_reading(seed, hands)
"""),
    ],
}


def main() -> None:
    for path, edits in EDITS.items():
        raw = path.read_bytes()
        crlf = b"\r\n" in raw
        text = raw.decode("utf-8").replace("\r\n", "\n")
        done = 0
        for old, new in edits:
            if new in text:
                continue
            assert text.count(old) == 1, (path.name, old[:70])
            text = text.replace(old, new)
            done += 1
        out = (text.replace("\n", "\r\n") if crlf else text).encode("utf-8")
        if out != raw:
            path.write_bytes(out)
        print(f"{path.name}: {done} of {len(edits)} edits applied")


if __name__ == "__main__":
    main()
