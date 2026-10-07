"""CL15's edits to family_contracts.json, spliced as text (CLAUDE.md: never re-serialise this file).

usage: python build/cl15/edit_contracts.py <path to family_contracts.json>
Each edit names its old text, which must occur exactly once; an edit already applied is skipped.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

EDITS: list[tuple[str, str, str]] = [
    # (why, old, new)
    ("tremolo_octaves v1 -> v2: the third shape's notes change",
     '"maker": "make_tremolo_octaves",\n      "version": 1,',
     '"maker": "make_tremolo_octaves",\n      "version": 2,'),
    ("tremolo_octaves name: what the fixed maker writes",
     '"name": "an octave tremolo, or a major-third tremolo moved by step"',
     '"name": "an octave tremolo, or a tremolo in the key\'s own thirds moved by step"'),
    ("tremolo_octaves admission: the major-third fault is fixed",
     '"admission": "Right notes in time. The third shape keeps one major third and moves it by step, so D-F-sharp and E-G-sharp sound in C major (measured as chromatic notes): not a spelling fault, and not the diatonic thirds the double-third scale writes — a content question recorded for the family\'s owner.",',
     '"admission": "Right notes in time. The third shape plays the key\'s own third on each of its first four degrees (C-E, D-F, E-G, F-A in C: major or minor as the scale gives it, since CL15; it was one major third moved by step, D-F-sharp and E-G-sharp in C). Unheard.",'),
    ("tremolo_octaves assumes: no item carries a chromatic note now (measured: 0 of 12)",
     '"assumes": [\n        "interval.leap",\n        "interval.step",\n        "interval.skip",\n        "pitch.chromatic",\n        "range.beyond-position",\n        "rhythm.shorter-than-quarter",\n        "key.signature",\n        "clef.bass",\n        "pitch.ledger"\n      ],',
     '"assumes": [\n        "interval.leap",\n        "interval.step",\n        "interval.skip",\n        "range.beyond-position",\n        "rhythm.shorter-than-quarter",\n        "key.signature",\n        "clef.bass",\n        "pitch.ledger"\n      ],'),
    ("syncopation v1 -> v2: the tie drill's notes change",
     '"maker": "make_syncopation",\n      "version": 1,',
     '"maker": "make_syncopation",\n      "version": 2,'),
    ("syncopation: the tie density floor, as a count",
     '"min": 1,\n          "when": {\n            "variant": "tied-across-bar"\n          },\n          "why": "the family\'s promise, a note that starts in one bar and belongs to the next; one in four bars is an example rather than practice at density (Follow-ups)"',
     '"min": 2,\n          "when": {\n            "variant": "tied-across-bar"\n          },\n          "why": "the family\'s promise, a note that starts in one bar and belongs to the next, at a density that is practice: at least two independent ties across the bar in the four bars, a count of opportunities and never one bar\'s shape repeated (the reviewer\'s rule, CL15; one in four bars was an example)"'),
    ("syncopation admission: the title and concepts no longer claim syncopation",
     '"admission": "Measured, the tied-across-bar item\'s tie starts on beat four, which T37\'s definition does not call syncopation, and the sixteenth item has none either: the title claims what the app\'s definition does not see. The tie is the honest target of the first; the second is not judged.",',
     '"admission": "Measured, the tied-across-bar item\'s two ties start on the beat (beat four, then beat three), which T37\'s definition does not call syncopation, and the sixteenth item has none either. Since CL15 neither item\'s title or concepts name syncopation (the second was titled \\"Sixteenth-note syncopation\\"): the tie is the honest target of the first; the second, a sixteenth-note rhythm, is not judged.",'),
    ("pentatonic v1 -> v2: the pentatonic form's notes change",
     '"maker": "make_pentatonic",\n      "version": 1,',
     '"maker": "make_pentatonic",\n      "version": 2,'),
    ("pentatonic admission: the floor is cleared",
     '"admission": "Right notes after the passage show the hand arrived. At ♩=72 an item lasts under the five-second floor (4.6 s in A), so the render check writes it no duration (Follow-ups).",',
     '"admission": "Right notes after the passage show the hand arrived. The pentatonic form goes up and down twice (since CL15: once was eleven eighths at ♩=72, under the five-second floor, so the render check wrote it no duration); the blues form\'s once already clears it.",'),
    ("power_chord: the canonical root is one the plan ships",
     '"maker": "make_power_chord",',
     '"maker": "make_power_chord",'),
    ("interval_reading v1 -> v2: the first note moves, so every seed's walk changes",
     '"maker": "make_interval_reading",\n      "version": 1,',
     '"maker": "make_interval_reading",\n      "version": 2,'),
    ("walking_bass v2 -> v3: the line ends on the tonic",
     '"maker": "make_walking_bass",\n      "version": 2,',
     '"maker": "make_walking_bass",\n      "version": 3,'),
    ("walking_bass leaps: the register return is into the closing tonic",
     '"why": "the line returns to its register at the form\'s turn (the last bar\'s approach note drops back to the second octave), a quarter note at ♩=92"',
     '"why": "the line returns to its register at the end of the form (the last approach note drops back to the second octave, into the closing tonic), a quarter note at ♩=92"'),
    ("walking_bass admission: the written ending",
     'The line also ends on the approach to a chorus that is not written. Unheard.",',
     'The line ends on the tonic: its closing bar, on the tonic chord, walks root, third, fifth and octave, a bar after the twelve of a blues (whose bar twelve stays a V7) and the ii-V-I\'s own last bar (since CL15; it ended on the approach to a chorus that was not written). Unheard.",'),
]

#: power_chord's canonical clause: located inside the power_chord row, not by text alone ({"key": "C"} is everywhere).
POWER_OLD = '"assign": [\n          {\n            "role": "canonical",\n            "when": {\n              "key": "C"\n            }\n          },'
POWER_NEW = '"assign": [\n          {\n            "role": "canonical",\n            "when": {\n              "key": "A"\n            }\n          },'


def main() -> None:
    path = Path(sys.argv[1])
    raw = path.read_bytes()
    text = raw.decode("utf-8")
    crlf = "\r\n" in text
    text = text.replace("\r\n", "\n")
    for why, old, new in EDITS:
        if old == new:
            continue
        if text.count(new) == 1 and text.count(old) == 0:
            print(f"already: {why}")
            continue
        assert text.count(old) == 1, f"{why}: the old text occurs {text.count(old)} times"
        text = text.replace(old, new)
        print(f"edited: {why}")
    start = text.index('"maker": "make_power_chord",')
    end = text.index('"maker": ', start + 10)
    row = text[start:end]
    if POWER_NEW in row:
        print("already: power_chord canonical A")
    else:
        assert row.count(POWER_OLD) == 1, "power_chord's canonical clause not found once"
        text = text[:start] + row.replace(POWER_OLD, POWER_NEW) + text[end:]
        print("edited: power_chord canonical when key C -> A")
    json.loads(text)
    path.write_bytes((text.replace("\n", "\r\n") if crlf else text).encode("utf-8"))


if __name__ == "__main__":
    main()
