"""CL15's two bridge-regression rows whose notes changed, spliced as text (idempotent).

usage: python build/cl15/edit_bridge.py <bridge_regression.json>
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

EDITS = [
    ('"read": "RH E4 F4 D4 F4 D4 C4 E4 E4 C4 in halves and quarters: two steps (E-F, D-C), five skips, one unison; C4 to F4, inside a position; no key signature, no ledger line beyond middle C; the left hand rests."',
     '"read": "RH G4 E4 F4 D4 F4 D4 F4 D4 F4 D4 D4 C4 in halves and quarters (since CL15 the first note is any degree of the position, here G): two steps (E-F, D-C), eight skips, one unison; C4 to G4, inside a position; no key signature, no ledger line beyond middle C; the left hand rests."'),
    ('"demands": ["clef.bass", "pitch.ledger", "interval.step", "rhythm.eighths", "rhythm.shorter-than-quarter", "rhythm.ties", "range.beyond-position", "texture.hands-together"],\n      "read": "RH C4 up to A5 by step, F4 on beat four tied into the next bar (a quarter and an eighth), G4 an eighth off the beat, A5 on a ledger line; whole-note C-E-G chords under it; no key signature. The tie starts on the beat, so no syncopation."',
     '"demands": ["clef.bass", "interval.step", "rhythm.eighths", "rhythm.shorter-than-quarter", "rhythm.ties", "range.beyond-position", "texture.hands-together"],\n      "read": "RH C4 up to G5 by step, two ties across the bar (since CL15): F4 on beat four tied into the next bar (a quarter and an eighth), G4 an eighth off the beat, and E5 on beat three held through the barline to beat two (a half and a quarter); G5 the highest note, on the space above the staff, so no ledger line; whole-note C-E-G chords under it; no key signature. Both ties start on the beat, so no syncopation."'),
]


def main() -> None:
    path = Path(sys.argv[1])
    text = path.read_bytes().decode("utf-8")
    crlf = "\r\n" in text
    text = text.replace("\r\n", "\n")
    for old, new in EDITS:
        if text.count(new) == 1 and old not in text:
            print("already")
            continue
        assert text.count(old) == 1, old[:60]
        text = text.replace(old, new)
        print("edited")
    json.loads(text)
    path.write_bytes((text.replace("\n", "\r\n") if crlf else text).encode("utf-8"))


if __name__ == "__main__":
    main()
