"""
X31a's probe (not a test): what music21 10.5 makes of the elements the app's opening rule asks about, on the
app test's MusicXML shapes (`tests/test_difficulty.py`'s `_app_shapes()`) and three more written the same way.
Per shape: every tempo mark (offset in the hierarchy, the build's quarter BPM, number, numberSounding) and every
element `recurse().notesAndRests` yields at or before the latest mark (class, offset, isGrace, a cue attribute
if music21 has one, style noteSize). Nothing asserted.

    python docs/prompts/runs/X31a/scripts-what-music21-gives.py
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / "tools" / "content"))
sys.path.insert(0, str(ROOT / "tools" / "content" / "tests"))

import difficulty  # noqa: E402
import test_difficulty as t  # noqa: E402
from music21 import converter  # noqa: E402


def describe(name: str, score) -> None:  # noqa: ANN001
    marks = []
    for mark in score.recurse().getElementsByClass("MetronomeMark"):
        marks.append((float(mark.getOffsetInHierarchy(score)), difficulty._quarter_bpm(mark), mark.number, mark.numberSounding))  # noqa: SLF001
    latest = max((m[0] for m in marks), default=0.0)
    print(f"== {name}")
    print(f"   marks (offset, quarterBpm, number, numberSounding): {marks}")
    for element in score.recurse().notesAndRests:
        at = float(element.getOffsetInHierarchy(score))
        if at > latest:
            continue
        cue = getattr(element, "isCue", "(no attribute)")
        size = element.style.noteSize if element.hasStyleInformation else None
        print(f"   {type(element).__name__:<12} offset {at:g}  grace {element.duration.isGrace}  isCue {cue}  noteSize {size}")
    harmonies = [(type(h).__name__, float(h.getOffsetInHierarchy(score))) for h in score.recurse().getElementsByClass("Harmony")]
    if harmonies:
        print(f"   Harmony elements (class, offset): {harmonies}; in recurse().notes: "
              f"{[type(e).__name__ for e in score.recurse().notes if type(e).__name__ == 'ChordSymbol']}")


SHAPES = t._app_shapes()  # noqa: SLF001
for name in (
    "a mark on bar 2 after a cue note and rests",
    "a visual offset",
    "a mark only in bar 2",
    "a tempo after the first note of bar 1",
    "an upbeat before bar 1's tempo",
    "a tempo after an opening rest (the Fifth's shape)",
    "an opening sound, then a sounding offset",
    "a pickup whose mark and sound disagree",
):
    describe(name, converter.parseData(SHAPES[name][0], format="musicxml"))

OPEN4 = t._OPENING + t._QUARTER * 4  # noqa: SLF001
BAR2_MARK = t._xml(["", t._direction(t._metronome("quarter", "72"))])  # noqa: SLF001
REST4 = "<note><rest/><duration>4</duration><voice>1</voice></note>"
REST3 = "<note><rest/><duration>3</duration><voice>1</voice></note>"
# A grace note in bar 1 before a bar's rest, written as the app's test writes one (<grace/>, no <duration>).
GRACE = "<note><grace/><pitch><step>D</step><octave>4</octave></pitch><voice>1</voice><type>eighth</type></note>"
describe("a grace note, a bar's rest, a mark in bar 2",
         converter.parseData(BAR2_MARK.replace(OPEN4, f"{t._OPENING}{GRACE}{REST4}"), format="musicxml"))  # noqa: SLF001
# A chord symbol over a bar's rest.
HARMONY = "<harmony><root><root-step>C</root-step></root><kind>major</kind></harmony>"
describe("a chord symbol over a bar's rest, a mark in bar 2",
         converter.parseData(BAR2_MARK.replace(OPEN4, f"{t._OPENING}{HARMONY}{REST4}"), format="musicxml"))  # noqa: SLF001
# A cue-sized note that plays (<type size="cue">, no <cue/>): the app counts it as sounding.
SMALL = '<note><pitch><step>G</step><octave>4</octave></pitch><duration>1</duration><voice>1</voice><type size="cue">quarter</type></note>'
describe("a cue-sized note that plays, rests, a mark in bar 2",
         converter.parseData(BAR2_MARK.replace(OPEN4, f"{t._OPENING}{SMALL}{REST3}"), format="musicxml"))  # noqa: SLF001
