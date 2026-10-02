"""G30's correction of three maker docstrings that said their fingering is printed.

usage: python docs/prompts/runs/G30/scripts-edit_maker_docs.py
make_octave_scale, make_position_shift and make_walkup described the page; since G30 their rows print none
and `print_as_contracted` withholds what they work out. Each docstring keeps its reasoning (it is what a
source would be checked against) and says what reaches the page. Idempotent splices; line endings kept.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
PATH = ROOT / "tools" / "content" / "generate_exercises.py"
EDITS = [
    ("""    Fingering is the one rule that matters and it is safe to print: thumb and
    fifth on the white keys, thumb and fourth on the black ones, in both hands.
""", """    Fingering is the one rule that matters: thumb and fifth on the white keys,
    thumb and fourth on the black ones, in both hands. It was printed as safe; no
    source was read for it, so since G30 it is worked out here and not printed
    (`print_as_contracted`).
"""),
    ("""    Four bars with one hand shift in the middle, marked by the fingering.

    Bars 1-2 sit with the thumb on the tonic; bars 3-4 move the hand up a fifth. The only
    fingering printed is on the two notes that start a position, because that is what a
    fingering number is *for* and printing them all hides the one that matters.
""", """    Four bars with one hand shift in the middle.

    Bars 1-2 sit with the thumb on the tonic; bars 3-4 move the hand up a fifth. The only
    fingering worked out is on the two notes that start a position, because that is what a
    fingering number is *for* and printing them all hides the one that matters. It is the
    generator's own convention, so since G30 it is not printed (`print_as_contracted`).
"""),
    ("""    The fingering is printed on every note, because it is the whole difficulty:
    the hand starts on the little finger and arrives on the thumb, and a hand
    that starts anywhere else runs out of fingers before it runs out of walk.
""", """    The fingering is worked out on every note, because it is the whole difficulty:
    the hand starts on the little finger and arrives on the thumb, and a hand
    that starts anywhere else runs out of fingers before it runs out of walk. It
    is the generator's own convention, so since G30 it is not printed
    (`print_as_contracted`).
"""),
]


def main() -> None:
    raw = PATH.read_bytes()
    crlf = b"\r\n" in raw
    text = raw.decode("utf-8").replace("\r\n", "\n")
    done = 0
    for old, new in EDITS:
        if new in text:
            continue
        assert text.count(old) == 1, old[:60]
        text = text.replace(old, new)
        done += 1
    out = (text.replace("\n", "\r\n") if crlf else text).encode("utf-8")
    if out != raw:
        PATH.write_bytes(out)
    print(f"{done} of {len(EDITS)} docstrings corrected")


if __name__ == "__main__":
    main()
