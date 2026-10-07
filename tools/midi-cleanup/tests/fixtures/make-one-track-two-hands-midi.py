#!/usr/bin/env python3
"""Write `one-track-two-hands.mid`: both hands in one note track, for the split's parity (Q46).

`hands="auto"` splits a file with one note track and keeps a file with two as recorded.
The app's committed MIDI fixtures (`app/tests/fixtures/imports/two-hands.mid`,
`crossed-hands.mid`) both have two note tracks, so neither is split, and the parity test's
case *splits the hands the same way* had nothing to compare unless the three MAESTRO
recordings were present. This file is the committed case that is split: a conductor track
(tempo and metre only) and **one** track holding both hands, the shape a digital piano's
own recording has.

Hand-written bytes rather than a rendering, as the app's fixtures are, so nothing else is
under test. Four bars of 4/4 in C major at 90 bpm, every onset on a beat:

    bar  right hand (above)         left hand (below)
    1    E4 half, G4 half           C3 E3 G3 E3, quarters
    2    A4 half, C5 half           F3 A3 C4 A3, quarters
    3    B4 half, D5 half           G3 B3 D4 B3, quarters
    4    C5 and E5, whole           C3 and G3, whole

The left hand climbs through middle C to D4 while the right hand climbs above it, so a
fixed middle-C boundary would give the left hand's C4 and D4 to the right; the converter's
moving boundary is what keeps them in the left hand, and that boundary is what the parity
test compares. Every half-note onset is struck with a left-hand note, so most groups are
cut between the hands; the left hand's off-beat quarters are single notes the split has to
place by the hands' running centres.

Deterministic: running it twice writes the same bytes.

    python tools/midi-cleanup/tests/fixtures/make-one-track-two-hands-midi.py
"""
from pathlib import Path

TICKS = 480
MICROS_PER_QUARTER = 60_000_000 // 90  # 90 bpm
VELOCITY = 72

#: (onset in quarters, length in quarters, MIDI number)
RIGHT = [
    (0.0, 2.0, 64), (2.0, 2.0, 67),
    (4.0, 2.0, 69), (6.0, 2.0, 72),
    (8.0, 2.0, 71), (10.0, 2.0, 74),
    (12.0, 4.0, 72), (12.0, 4.0, 76),
]
LEFT = [
    (0.0, 1.0, 48), (1.0, 1.0, 52), (2.0, 1.0, 55), (3.0, 1.0, 52),
    (4.0, 1.0, 53), (5.0, 1.0, 57), (6.0, 1.0, 60), (7.0, 1.0, 57),
    (8.0, 1.0, 55), (9.0, 1.0, 59), (10.0, 1.0, 62), (11.0, 1.0, 59),
    (12.0, 4.0, 48), (12.0, 4.0, 55),
]


def varlen(value: int) -> bytes:
    out = bytearray([value & 0x7F])
    value >>= 7
    while value:
        out.insert(0, (value & 0x7F) | 0x80)
        value >>= 7
    return bytes(out)


def chunk(name: bytes, body: bytes) -> bytes:
    return name + len(body).to_bytes(4, "big") + body


def track(events: list[tuple[int, bytes]], name: str) -> bytes:
    body = bytearray(varlen(0) + b"\xff\x03" + varlen(len(name)) + name.encode("latin-1"))
    for delta, message in events:
        body += varlen(delta) + message
    body += varlen(0) + b"\xff\x2f\x00"
    return chunk(b"MTrk", bytes(body))


def both_hands(notes: list[tuple[float, float, int]]) -> list[tuple[int, bytes]]:
    """Note-on/note-off pairs in time order, releases before strikes at the same tick."""
    stamped: list[tuple[int, int, int, bytes]] = []
    for at, length, midi in notes:
        stamped.append((round(at * TICKS), 1, midi, bytes([0x90, midi, VELOCITY])))
        stamped.append((round((at + length) * TICKS), 0, midi, bytes([0x80, midi, 0])))
    stamped.sort(key=lambda row: row[:3])
    out: list[tuple[int, bytes]] = []
    now = 0
    for when, _, _, message in stamped:
        out.append((when - now, message))
        now = when
    return out


def main() -> None:
    # format 1, two tracks (a conductor and one for both hands), ticks per quarter
    header = chunk(b"MThd", (1).to_bytes(2, "big") + (2).to_bytes(2, "big")
                   + TICKS.to_bytes(2, "big"))
    conductor = track(
        [
            (0, b"\xff\x51\x03" + MICROS_PER_QUARTER.to_bytes(3, "big")),
            (0, b"\xff\x58\x04\x04\x02\x18\x08"),
        ],
        name="Conductor",
    )
    data = header + conductor + track(both_hands(RIGHT + LEFT), "Piano")
    out = Path(__file__).with_name("one-track-two-hands.mid")
    out.write_bytes(data)
    print(f"wrote {out} ({len(data)} bytes, {len(RIGHT) + len(LEFT)} notes in one track)")


if __name__ == "__main__":
    main()
